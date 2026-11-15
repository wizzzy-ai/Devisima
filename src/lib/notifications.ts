import "server-only";

import { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { getAppUrl } from "@/lib/app-url";
import { escapeEmailHtml, renderBrandedEmail, sendEmail } from "@/services/email";

type Database = typeof db | Prisma.TransactionClient;

export type NotificationInput = {
  userId: string;
  type?: NotificationType;
  title: string;
  message: string;
  link?: string | null;
};

const emailPreferenceByType: Record<NotificationType, keyof Pick<
  Prisma.NotificationPreferenceCreateInput,
  "orderEmails" | "paymentEmails" | "purchaseEmails" | "reviewEmails" | "sellerEmails" | "payoutEmails" | "marketingEmails" | "systemEmails"
>> = {
  ORDER_CREATED: "orderEmails",
  ORDER_PAID: "paymentEmails",
  PAYMENT_FAILED: "paymentEmails",
  PURCHASE_READY: "purchaseEmails",
  DOWNLOAD_AVAILABLE: "purchaseEmails",
  SELLER_APPLICATION_SUBMITTED: "systemEmails",
  SELLER_APPLICATION_APPROVED: "sellerEmails",
  SELLER_APPLICATION_REJECTED: "sellerEmails",
  PRODUCT_SUBMITTED: "systemEmails",
  PRODUCT_APPROVED: "sellerEmails",
  PRODUCT_REJECTED: "sellerEmails",
  PRODUCT_CHANGES_REQUESTED: "sellerEmails",
  FOLLOWED_STORE_NEW_PRODUCT: "marketingEmails",
  NEW_REVIEW: "reviewEmails",
  REVIEW_APPROVED: "reviewEmails",
  REVIEW_REJECTED: "reviewEmails",
  PAYOUT_REQUESTED: "payoutEmails",
  PAYOUT_APPROVED: "payoutEmails",
  PAYOUT_PROCESSING: "payoutEmails",
  PAYOUT_COMPLETED: "payoutEmails",
  PAYOUT_FAILED: "payoutEmails",
  SELLER_SALE: "sellerEmails",
  EARNINGS_AVAILABLE: "sellerEmails",
  REFUND_REQUESTED: "paymentEmails",
  REFUND_APPROVED: "paymentEmails",
  REFUND_REJECTED: "paymentEmails",
  REFUND_COMPLETED: "paymentEmails",
  COUPON_CREATED: "marketingEmails",
  SYSTEM: "systemEmails",
};

export async function createNotification(database: Database, input: NotificationInput) {
  return database.notification.create({
    data: {
      userId: input.userId,
      type: input.type ?? "SYSTEM",
      title: input.title,
      message: input.message,
      link: safeNotificationLink(input.link),
    },
  });
}

export async function createNotifications(database: Database, notifications: NotificationInput[]) {
  if (!notifications.length) return { count: 0 };
  return database.notification.createMany({
    data: notifications.map((notification) => ({
      userId: notification.userId,
      type: notification.type ?? "SYSTEM",
      title: notification.title,
      message: notification.message,
      link: safeNotificationLink(notification.link),
    })),
  });
}

export async function getNotifications(userId: string, { page = 1, limit = 20, unreadOnly = false }: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
} = {}) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(50, Math.max(1, Math.floor(limit)));
  const where = { userId, ...(unreadOnly ? { isRead: false } : {}) };
  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      select: { id: true, type: true, title: true, message: true, link: true, isRead: true, createdAt: true },
    }),
    db.notification.count({ where }),
  ]);
  return { notifications, total, page: safePage, limit: safeLimit, totalPages: Math.ceil(total / safeLimit) };
}

export function getUnreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, isRead: false } });
}

export function markNotificationRead(userId: string, notificationId: string) {
  return db.notification.updateMany({
    where: { id: notificationId, userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export function getNotificationPreferences(userId: string) {
  return db.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: {
      orderEmails: true,
      paymentEmails: true,
      purchaseEmails: true,
      reviewEmails: true,
      sellerEmails: true,
      payoutEmails: true,
      marketingEmails: true,
      systemEmails: true,
    },
  });
}

export async function sendNotificationEmail(input: Omit<NotificationInput, "userId" | "link"> & { userId: string; link?: string | null }) {
  try {
    const [user, preferences] = await Promise.all([
      db.user.findUnique({ where: { id: input.userId }, select: { email: true, name: true } }),
      getNotificationPreferences(input.userId),
    ]);
    if (!user) throw new Error(`Cannot email notification: user ${input.userId} was not found.`);
    const preference = emailPreferenceByType[input.type ?? "SYSTEM"];
    if (!preferences[preference]) return;

    const link = safeNotificationLink(input.link);
    const url = link ? getAppUrl(link).toString() : null;
    const text = `Hi ${user.name},\n\n${input.message}${url ? `\n\nView details: ${url}` : ""}\n\nDevisima`;
    const html = renderBrandedEmail({
      preheader: input.message,
      eyebrow: "Devisima notification",
      title: input.title,
      greeting: `Hi ${user.name},`,
      contentHtml: `<p style="margin:0">${escapeEmailHtml(input.message).replace(/\r?\n/g, "<br>")}</p>`,
      ...(url ? { action: { label: "View details", url } } : {}),
      preferenceUrl: getAppUrl("/settings/notifications").toString(),
    });
    await sendEmail({ to: user.email, subject: input.title, text, html });
  } catch (error) {
    console.error("Notification email delivery failed", error);
  }
}

export async function notifyAdmins(database: Database, input: Omit<NotificationInput, "userId">) {
  const admins = await database.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  return createNotifications(database, admins.map(({ id }) => ({ ...input, userId: id })));
}

function safeNotificationLink(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}
