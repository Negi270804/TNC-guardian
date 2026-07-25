import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import asyncio
from app import config

logger = logging.getLogger("app.services.email_service")

class EmailService:
    @staticmethod
    def send_reset_email_sync(to_email: str, token: str):
        # Format the password reset configuration link dynamically using FRONTEND_URL
        reset_link = f"{config.FRONTEND_URL}/reset-password?token={token}"
        
        subject = "Reset Your Password - TNC Guardian"
        text_content = f"Please reset your password by clicking this link: {reset_link}"
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f1f5f9; padding: 20px;">
            <h2 style="color: #22c55e;">Password Reset Request</h2>
            <p>Hello,</p>
            <p>We received a request to reset your password for your TNC Guardian account.</p>
            <p>Please click the button below to set a new password. This link is valid for 20 minutes and can only be used once.</p>
            <div style="margin: 30px 0;">
              <a href="{reset_link}" style="background-color: #22c55e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p><a href="{reset_link}" style="color: #22c55e;">{reset_link}</a></p>
            <p>If you did not request a password reset, you can safely ignore this email.</p>
            <hr style="border-color: #1e293b;" />
            <p style="font-size: 12px; color: #64748b;">This is an automated message. Please do not reply directly to this email.</p>
          </body>
        </html>
        """

        # 1. Try sending via Resend API if API key is configured
        if config.RESEND_API_KEY and "api-key" not in str(config.RESEND_API_KEY).lower():
            try:
                import httpx
                headers = {
                    "Authorization": f"Bearer {config.RESEND_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "from": config.FROM_EMAIL or "onboarding@resend.dev",
                    "to": [to_email],
                    "subject": subject,
                    "text": text_content,
                    "html": html_content
                }
                resp = httpx.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
                if resp.status_code in [200, 201]:
                    logger.info(f"Password reset email sent successfully via Resend API to {to_email}")
                    return
                else:
                    logger.error(f"Resend API error: {resp.status_code} - {resp.text}")
            except Exception as e:
                logger.error(f"Resend service call failed: {str(e)}")

        # 2. Try sending via SMTP if SMTP_HOST is configured and is not local dev mock
        is_smtp_configured = (
            config.SMTP_HOST
            and config.SMTP_HOST not in ["localhost", "127.0.0.1"]
            and "your-smtp" not in str(config.SMTP_HOST).lower()
        )

        if is_smtp_configured:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = config.SMTP_FROM_EMAIL or config.SMTP_SENDER or "noreply@tncguardian.com"
                msg["To"] = to_email
                msg.attach(MIMEText(text_content, "plain"))
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10) as server:
                    if config.SMTP_USE_TLS:
                        server.starttls()
                    if config.SMTP_USERNAME and config.SMTP_PASSWORD:
                        server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
                    server.sendmail(
                        config.SMTP_FROM_EMAIL or config.SMTP_SENDER or "noreply@tncguardian.com",
                        to_email,
                        msg.as_string()
                    )
                logger.info(f"Password reset email sent successfully via SMTP to {to_email}")
                return
            except Exception as e:
                logger.error(f"SMTP delivery failed: failed to send email to {to_email}. Error details masked.")

        # 3. Fallback to Development Mode Console Logging
        logger.info("DEVELOPMENT MODE: Email service is not configured or transmission failed. Printing link to console.")
        logger.warning(
            f"\n\n==================================================\n"
            f"DEVELOPMENT MODE PASSWORD RESET LINK FOR {to_email}:\n"
            f"{reset_link}\n"
            f"==================================================\n"
        )

    @classmethod
    async def send_reset_email(cls, to_email: str, token: str):
        # Offload the blocking SMTP call to a background thread to prevent event loop blocking
        await asyncio.to_thread(cls.send_reset_email_sync, to_email, token)
