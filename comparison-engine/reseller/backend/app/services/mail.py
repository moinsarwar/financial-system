"""Outbound email via SMTP (Brevo)."""
from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from ..config import settings

logger = logging.getLogger(__name__)


def send_email(to_address: str, subject: str, html_body: str, text_body: str | None = None) -> None:
    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        raise RuntimeError("SMTP credentials are not configured (MAIL_USERNAME / MAIL_PASSWORD)")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM_ADDRESS}>"
    msg["To"] = to_address

    msg.attach(MIMEText(text_body or html_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    use_ssl = str(settings.MAIL_ENCRYPTION).lower() in ("ssl", "smtps")
    if use_ssl:
        with smtplib.SMTP_SSL(settings.MAIL_HOST, settings.MAIL_PORT, timeout=30) as server:
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM_ADDRESS, [to_address], msg.as_string())
    else:
        with smtplib.SMTP(settings.MAIL_HOST, settings.MAIL_PORT, timeout=30) as server:
            server.ehlo()
            if str(settings.MAIL_ENCRYPTION).lower() in ("tls", "starttls", "1", "true"):
                server.starttls()
                server.ehlo()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM_ADDRESS, [to_address], msg.as_string())

    logger.info("Sent email to %s subject=%s", to_address, subject)


def send_set_password_invite(*, to_email: str, name: str, set_password_url: str) -> None:
    subject = "Set your password — The Comparison Engine"
    text = (
        f"Hi {name},\n\n"
        f"Your reseller application has been approved.\n"
        f"Set your password here (link expires soon):\n{set_password_url}\n\n"
        f"— The Comparison Engine\n"
    )
    html = f"""
    <div style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
      <p>Hi {name},</p>
      <p>Your reseller application has been <strong>approved</strong>.</p>
      <p>Click the button below to create your password and sign in:</p>
      <p style="margin:24px 0">
        <a href="{set_password_url}"
           style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">
          Set password
        </a>
      </p>
      <p style="font-size:14px;color:#555">Or open this link:<br/>
        <a href="{set_password_url}">{set_password_url}</a>
      </p>
      <p style="font-size:13px;color:#777">This link expires in {settings.INVITE_TOKEN_HOURS} hours.</p>
      <p>— The Comparison Engine</p>
    </div>
    """
    send_email(to_email, subject, html, text)
