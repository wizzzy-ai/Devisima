import { Resend } from "resend";
import { getAppUrl } from "@/lib/app-url";

type EmailMessage = { to: string; subject: string; text: string; html: string };
type EmailProvider = { send(message: EmailMessage): Promise<void> };

type BrandedEmailOptions = {
  preheader: string;
  eyebrow?: string;
  title: string;
  greeting?: string;
  contentHtml: string;
  action?: { label: string; url: string };
  preferenceUrl?: string;
};

const resendProvider: EmailProvider = {
  async send(message) {
    if (!process.env.EMAIL_API_KEY) {
      throw new Error("EMAIL_API_KEY is not configured. Please set it in your environment variables.");
    }
    const from = process.env.EMAIL_FROM;
    if (!from) {
      throw new Error("EMAIL_FROM is not configured. Please set it in your environment variables.");
    }

    const resend = new Resend(process.env.EMAIL_API_KEY);

    try {
      await resend.emails.send({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    } catch (error) {
      console.error("Resend email error:", error);
      throw new Error(`Failed to send email via Resend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export async function sendEmail(message: EmailMessage) {
  if (process.env.EMAIL_PROVIDER === "resend" && process.env.EMAIL_API_KEY && process.env.EMAIL_FROM) {
    await resendProvider.send(message);
    return;
  }
  if (process.env.NODE_ENV === "production") throw new Error("Email delivery is not configured.");
  console.info(`[development email] ${message.subject}\nTo: ${message.to}\n${message.text}`);
}

export function renderBrandedEmail(options: BrandedEmailOptions) {
  const logoUrl = escapeEmailHtml(getAppUrl("/logo.png").toString());
  const contactUrl = escapeEmailHtml(getAppUrl("/contact").toString());
  const action = options.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px"><tr><td bgcolor="#0F4C5C" style="border-radius:8px"><a href="${escapeEmailHtml(options.action.url)}" style="display:inline-block;padding:14px 22px;border:1px solid #0F4C5C;border-radius:8px;color:#FFFFFF;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none">${escapeEmailHtml(options.action.label)}</a></td></tr></table>`
    : "";
  const preferenceLink = options.preferenceUrl
    ? `&nbsp;&nbsp;·&nbsp;&nbsp;<a href="${escapeEmailHtml(options.preferenceUrl)}" style="color:#0F4C5C;text-decoration:underline">Email preferences</a>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
  <body style="margin:0;padding:0;background-color:#F7F5EF;font-family:Arial,Helvetica,sans-serif;color:#101820">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeEmailHtml(options.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F7F5EF" style="width:100%;background-color:#F7F5EF">
      <tr><td align="center" style="padding:32px 14px">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFFFF;border:1px solid #E8E6DF;border-radius:14px;overflow:hidden">
          <tr><td style="padding:24px 34px;border-bottom:1px solid #EEEDE8">
            <a href="${escapeEmailHtml(getAppUrl("/").toString())}" style="display:inline-block;text-decoration:none"><img src="${logoUrl}" width="184" alt="Devisima" style="display:block;width:184px;max-width:100%;height:auto;border:0"></a>
          </td></tr>
          <tr><td style="padding:36px 34px 34px">
            ${options.eyebrow ? `<p style="margin:0 0 12px;color:#0F4C5C;font-size:12px;font-weight:bold;letter-spacing:1.1px;text-transform:uppercase">${escapeEmailHtml(options.eyebrow)}</p>` : ""}
            <h1 style="margin:0 0 20px;color:#101820;font-size:26px;line-height:1.3;font-weight:700">${escapeEmailHtml(options.title)}</h1>
            ${options.greeting ? `<p style="margin:0 0 16px;color:#263238;font-size:16px;line-height:1.65">${escapeEmailHtml(options.greeting)}</p>` : ""}
            <div style="color:#344248;font-size:15px;line-height:1.7">${options.contentHtml}</div>
            ${action}
          </td></tr>
          <tr><td style="padding:20px 34px;background-color:#FBFAF7;border-top:1px solid #EEEDE8">
            <p style="margin:0 0 8px;color:#697579;font-size:12px;line-height:1.6">Need help? <a href="${contactUrl}" style="color:#0F4C5C;text-decoration:underline">Contact Devisima support</a>${preferenceLink}</p>
            <p style="margin:0;color:#899294;font-size:12px;line-height:1.6">© Devisima</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const url = getAppUrl(`/verify-email?token=${encodeURIComponent(token)}`).toString();
  await sendEmail({
    to,
    subject: "Verify your Devisima email",
    text: `Hi ${name},\n\nPlease verify your email address to finish setting up your Devisima account.\n\nVerify your email: ${url}\n\nThis link expires in 24 hours.`,
    html: renderBrandedEmail({
      preheader: "Verify your email address to finish setting up your account.",
      eyebrow: "Account security",
      title: "Verify your email",
      greeting: `Hi ${name},`,
      contentHtml: "<p style=\"margin:0\">Confirm your email address to finish setting up your Devisima account. This link expires in 24 hours.</p>",
      action: { label: "Verify email address", url },
    }),
  });
}

export async function sendVerificationCodeEmail(to: string, name: string, code: string) {
  await sendEmail({
    to,
    subject: "Your Devisima verification code",
    text: `Hi ${name},\n\nYour Devisima verification code is ${code}.\n\nThis code expires in 10 minutes. If you did not create a Devisima account, you can ignore this email.`,
    html: renderBrandedEmail({
      preheader: "Your Devisima verification code is ready.",
      eyebrow: "Account security",
      title: "Verify your email",
      greeting: `Hi ${name},`,
      contentHtml: `<p style="margin:0 0 18px">Enter this one-time code to verify your Devisima account:</p><p style="display:inline-block;margin:0 0 18px;padding:14px 20px;background-color:#F7F5EF;border:1px solid #E8E6DF;border-radius:8px;color:#0F4C5C;font-size:30px;font-weight:bold;letter-spacing:8px">${escapeEmailHtml(code)}</p><p style="margin:0;color:#697579;font-size:13px">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>`,
    }),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = getAppUrl(`/reset-password?token=${encodeURIComponent(token)}`).toString();
  await sendEmail({
    to,
    subject: "Reset your Devisima password",
    text: `Hi ${name},\n\nWe received a request to reset your Devisima password.\n\nReset your password: ${url}\n\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.`,
    html: renderBrandedEmail({
      preheader: "Use the secure link to reset your Devisima password.",
      eyebrow: "Account security",
      title: "Reset your password",
      greeting: `Hi ${name},`,
      contentHtml: "<p style=\"margin:0\">We received a request to reset your Devisima password. This secure link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>",
      action: { label: "Reset password", url },
    }),
  });
}

export async function sendSellerApprovalEmail(to: string, name: string, storeName: string) {
  const dashboardUrl = getAppUrl("/seller/dashboard").toString();
  await sendEmail({
    to, subject: "Your Devisima seller application is approved",
    text: `Hi ${name},\n\nYour seller application for "${storeName}" has been approved! You can now create and sell digital products on Devisima.\n\nVisit your seller dashboard to get started: ${dashboardUrl}`,
    html: renderBrandedEmail({
      preheader: `Your seller application for ${storeName} has been approved.`,
      eyebrow: "Seller application",
      title: "Your application is approved",
      greeting: `Hi ${name},`,
      contentHtml: `<p style="margin:0">Your application for <strong style="color:#101820">${escapeEmailHtml(storeName)}</strong> has been approved. You can now set up your seller storefront and start listing products on Devisima.</p>`,
      action: { label: "Open seller dashboard", url: dashboardUrl },
    }),
  });
}

export async function sendSellerRejectionEmail(to: string, name: string, storeName: string, reason?: string) {
  const applicationUrl = getAppUrl("/seller/apply").toString();
  await sendEmail({
    to,
    subject: "Updates requested for your Devisima seller application",
    text: `Hi ${name},\n\nThank you for applying to sell on Devisima. We need a few updates before we can approve your application for "${storeName}". This decision applies only to your seller application; your Devisima account remains active as a buyer.${reason ? `\n\nFeedback: ${reason}` : ""}\n\nYou can update your application and request another review from your seller application page.`,
    html: renderBrandedEmail({
      preheader: `Updates are requested before your ${storeName} seller application can be approved.`,
      eyebrow: "Seller application",
      title: "A few updates are needed",
      greeting: `Hi ${name},`,
      contentHtml: `<p style="margin:0 0 14px">Thank you for applying to sell on Devisima. We need a few updates before we can approve the application for <strong style="color:#101820">${escapeEmailHtml(storeName)}</strong>.</p><p style="margin:0 0 14px;padding:14px 16px;background-color:#F7F5EF;border-left:3px solid #35D0BA;border-radius:4px;color:#263238"><strong style="color:#101820">What this means</strong><br>This decision applies only to your seller application. Your Devisima account remains active, and you can continue using it as a buyer.</p>${reason ? `<p style="margin:0;padding:14px 16px;background-color:#F7F5EF;border:1px solid #E8E6DF;border-radius:8px"><strong style="color:#101820">Review feedback</strong><br>${escapeEmailHtml(reason).replace(/\r?\n/g, "<br>")}</p>` : ""}<p style="margin:16px 0 0">You can update your application and request another review from your seller application page.</p>`,
      action: { label: "Review your application", url: applicationUrl },
    }),
  });
}

export function escapeEmailHtml(value: string) { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!); }
