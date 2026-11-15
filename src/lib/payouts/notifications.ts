import "server-only";

import type { NotificationType, Prisma } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { createNotification, createNotifications } from "@/lib/notifications";

type Database = typeof db | Prisma.TransactionClient;

export async function notifyUser(database: Database, input: {
  userId: string;
  type?: NotificationType;
  title: string;
  body: string;
  href?: string;
}) {
  return createNotification(database, {
    userId: input.userId,
    type: input.type,
    title: input.title,
    message: input.body,
    link: input.href,
  });
}

export async function notifyAdmins(database: Database, input: {
  type?: NotificationType;
  title: string;
  body: string;
  href?: string;
}) {
  const admins = await database.user.findMany({ where: { role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  return createNotifications(database, admins.map(({ id }) => ({
    userId: id,
    type: input.type,
    title: input.title,
    message: input.body,
    link: input.href,
  })));
}
