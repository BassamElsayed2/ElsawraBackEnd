import { Resend } from "resend";
import { logger } from "../utils/logger";

let resendClient: Resend | null = null;
let resendClientKey: string | null = null;

function getConfig() {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const publicSiteUrl =
    process.env.EMAIL_PUBLIC_URL ||
    (frontendUrl.includes("localhost")
      ? "https://elsawra.net"
      : frontendUrl);

  return {
    apiKey: (process.env.RESEND_API_KEY || "").trim(),
    fromEmail:
      process.env.RESEND_FROM_EMAIL || "Elsawra <onboarding@resend.dev>",
    frontendUrl,
    defaultLang: process.env.DEFAULT_LANG || "ar",
    logoUrl:
      process.env.EMAIL_LOGO_URL ||
      `${publicSiteUrl.replace(/\/$/, "")}/LogoElSawra.png`,
  };
}

function getResend(): Resend {
  const { apiKey } = getConfig();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!resendClient || resendClientKey !== apiKey) {
    resendClient = new Resend(apiKey);
    resendClientKey = apiKey;
  }
  return resendClient;
}

function buildResetPasswordHtml(resetUrl: string, logoUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>إعادة تعيين كلمة المرور</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#ffffff;padding:28px 28px 12px;text-align:center;border-bottom:1px solid #eee;">
              <img
                src="${logoUrl}"
                alt="Elsawra"
                width="160"
                style="display:block;margin:0 auto;width:160px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;"
              />
            </td>
          </tr>
          <tr>
            <td style="padding:28px;color:#222;line-height:1.7;">
              <h1 style="margin:0 0 12px;font-size:20px;">إعادة تعيين كلمة المرور</h1>
              <p style="margin:0 0 16px;color:#555;">
                لقد طلبت إعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه للمتابعة.
              </p>
              <p style="margin:0 0 24px;text-align:center;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:#c45c26;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;">
                  تعيين كلمة مرور جديدة
                </a>
              </p>
              <p style="margin:0 0 8px;color:#777;font-size:13px;">
                الرابط صالح لمدة ساعة واحدة. إذا لم تطلب ذلك، تجاهل هذه الرسالة.
              </p>
              <p style="margin:0;color:#999;font-size:12px;word-break:break-all;">
                ${resetUrl}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;color:#999;font-size:12px;text-align:center;border-top:1px solid #eee;">
              Reset Password — If you did not request this, you can ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export class EmailService {
  static getPasswordResetUrl(token: string, lang?: string): string {
    const { frontendUrl, defaultLang } = getConfig();
    const base = frontendUrl.replace(/\/$/, "");
    const locale = lang || defaultLang;
    return `${base}/${locale}/auth/reset-password?token=${encodeURIComponent(token)}`;
  }

  static async sendPasswordResetEmail(
    to: string,
    token: string,
    lang?: string,
  ): Promise<void> {
    const { fromEmail, defaultLang, logoUrl } = getConfig();
    const resetUrl = this.getPasswordResetUrl(token, lang || defaultLang);
    const resend = getResend();

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: "إعادة تعيين كلمة المرور | Reset your password — Elsawra",
      html: buildResetPasswordHtml(resetUrl, logoUrl),
    });

    if (error) {
      logger.error("Resend password reset email failed:", error);
      throw new Error(error.message || "Failed to send password reset email");
    }

    logger.info(`Password reset email sent to ${to}`, { id: data?.id });
  }
}
