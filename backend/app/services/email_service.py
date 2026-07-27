import logging
import asyncio
from app import config

logger = logging.getLogger("app.services.email_service")

class EmailService:
    """
    EmailService handles delivery of system notification and alert emails.
    Uses Resend API exclusively.
    """

    @staticmethod
    def send_reset_email_sync(to_email: str, token: str) -> None:
        """
        Synchronous worker function that builds the reset link, verifies Resend settings,
        and sends the HTTP POST request to the Resend API endpoint.
        
        Args:
            to_email (str): Recipient email address.
            token (str): Secure random verification token.
            
        Raises:
            RuntimeError: If Resend API Key/Sender Email are invalid or the request fails.
        """
        logger.info("[EMAIL SERVICE] Entering EmailService.send_reset_email_sync")
        
        # Build password reset link dynamically using configured frontend domain
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

        # Verify API configuration presence and throw RuntimeError if missing/invalid
        api_key = config.RESEND_API_KEY
        from_email = config.FROM_EMAIL

        # Key validations
        if not api_key or api_key == "" or "placeholder" in str(api_key).lower() or "api-key" in str(api_key).lower():
            err_msg = "[EMAIL SERVICE] RESEND_API_KEY is missing, empty, or set to placeholder value."
            logger.error(err_msg)
            raise RuntimeError(err_msg)

        if not from_email or from_email == "" or "placeholder" in str(from_email).lower():
            err_msg = "[EMAIL SERVICE] FROM_EMAIL configuration is missing, empty, or set to placeholder value."
            logger.error(err_msg)
            raise RuntimeError(err_msg)

        # Log parameters
        logger.info(f"[EMAIL SERVICE] Recipient: {to_email}")
        logger.info(f"[EMAIL SERVICE] RESEND_API_KEY Loaded: True")
        logger.info(f"[EMAIL SERVICE] FROM_EMAIL: {from_email}")
        logger.info(f"[EMAIL SERVICE] APP_ENV: {config.APP_ENV}")
        logger.info(f"[EMAIL SERVICE] DEMO_MODE: {config.DEMO_MODE}")

        # Send via Resend API
        try:
            import httpx
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "from": from_email,
                "to": [to_email],
                "subject": subject,
                "text": text_content,
                "html": html_content
            }
            logger.info("[EMAIL SERVICE] API request started")
            
            resp = httpx.post("https://api.resend.com/emails", json=payload, headers=headers, timeout=10)
            
            logger.info(f"[EMAIL SERVICE] HTTP status: {resp.status_code}")
            logger.info(f"[EMAIL SERVICE] Response body: {resp.text}")

            if resp.status_code in [200, 201]:
                logger.info("[EMAIL SERVICE] Success: Password reset email sent successfully.")
                return
            else:
                err_msg = f"[EMAIL SERVICE] Resend API error response received. Status: {resp.status_code}, Body: {resp.text}"
                logger.error(err_msg)
                raise RuntimeError(err_msg)
        except Exception as e:
            logger.exception("[EMAIL SERVICE] Exception occurred during Resend API request")
            raise RuntimeError(f"Failed to send email via Resend: {str(e)}") from e

    @classmethod
    async def send_reset_email(cls, to_email: str, token: str) -> None:
        """
        Asynchronous wrapper offloading the blocking HTTP requests to a worker thread.
        """
        logger.info(f"Before call: send_reset_email for recipient {to_email}")
        await asyncio.to_thread(cls.send_reset_email_sync, to_email, token)
        logger.info(f"After call: send_reset_email finished background task for {to_email}")
