import os
import logging
from app.settings import settings

logger = logging.getLogger("app.startup")

def run_startup_checks():
    logger.info("=========================================")
    logger.info("  TNC GUARDIAN STARTUP DIAGNOSTICS CHECK ")
    logger.info("=========================================")

    # 1. Environment & Platform Precedence Check
    is_render = os.getenv("RENDER") == "true" or os.getenv("RENDER_SERVICE_ID") is not None
    platform_name = "Render Container (Production)" if is_render else "Local Host / Development"
    
    logger.info(f"Environment Detected: {settings.APP_ENV}")
    logger.info(f"Platform: {platform_name}")
    logger.info(f"Log Level: {settings.LOG_LEVEL}")
    logger.info(f"Server Bind: {settings.BACKEND_HOST}:{settings.BACKEND_PORT}")
    
    # 2. Verify Upload Directory
    upload_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    try:
        os.makedirs(upload_dir, exist_ok=True)
        logger.info(f"Upload directory verified/created at: {upload_dir}")
    except Exception as e:
        logger.error(f"Failed to create upload directory at {upload_dir}: {str(e)}")

    # 3. Verify OCR Dependencies
    try:
        import torch
        import easyocr
        use_gpu = torch.cuda.is_available() if settings.OCR_USE_GPU else False
        logger.info(f"OCR Dependencies: easyocr & torch loaded successfully (GPU Available: {torch.cuda.is_available()}, GPU Enabled: {use_gpu})")
    except Exception as e:
        logger.warning(f"OCR Dependencies check failed: {str(e)}")

    # 4. Verify AI Provider Configuration
    ai_status = []
    # Check Anthropic key
    has_anthropic = settings.ANTHROPIC_API_KEY and "placeholder" not in settings.ANTHROPIC_API_KEY.lower() and settings.ANTHROPIC_API_KEY != ""
    ai_status.append(f"Anthropic Key: {'Configured' if has_anthropic else 'Missing/Placeholder'}")
    # Check OpenAI key
    has_openai = settings.OPENAI_API_KEY and "placeholder" not in settings.OPENAI_API_KEY.lower() and settings.OPENAI_API_KEY != ""
    ai_status.append(f"OpenAI Key: {'Configured' if has_openai else 'Missing/Placeholder'}")
    # Check Gemini key
    has_gemini = settings.GEMINI_API_KEY and "placeholder" not in settings.GEMINI_API_KEY.lower() and settings.GEMINI_API_KEY != ""
    ai_status.append(f"Gemini Key: {'Configured' if has_gemini else 'Missing/Placeholder'}")
    
    logger.info(f"AI Providers configuration status: {', '.join(ai_status)}")
    logger.info(f"Demo Mode state: {settings.DEMO_MODE}")

    # 5. Verify SMTP Configuration
    is_smtp_empty = not settings.SMTP_HOST or settings.SMTP_HOST.strip() == ""
    is_smtp_local = settings.SMTP_HOST in ["localhost", "127.0.0.1"]
    
    if settings.APP_ENV == "production":
        if is_smtp_empty or is_smtp_local:
            logger.warning("WARNING: SMTP Host is not configured or pointing to localhost in production. Email features (e.g. password resets) will fall back to development console logging.")
        else:
            logger.info(f"SMTP Configuration: Host={settings.SMTP_HOST}, Port={settings.SMTP_PORT}, Auth={'Yes' if settings.SMTP_USERNAME else 'No'}")
    else:
        logger.info(f"SMTP Configuration: Host={settings.SMTP_HOST}, Port={settings.SMTP_PORT}")

    # 6. Verify Critical Security Environment Variables (No Leakage)
    has_jwt_secret = settings.JWT_SECRET and "placeholder" not in settings.JWT_SECRET.lower() and "generate_a_secure_jwt" not in settings.JWT_SECRET.lower()
    logger.info(f"Security: JWT_SECRET configured correctly: {'Yes' if has_jwt_secret else 'No (INSECURE)'}")

    # 7. Check database URL structure (no raw print of credentials or secrets)
    db_url = settings.DATABASE_URL
    try:
        from urllib.parse import urlparse
        parsed = urlparse(db_url)
        ssl_enabled = "localhost" not in db_url and "127.0.0.1" not in db_url and "db" not in db_url
        
        logger.info("Database Diagnostics:")
        logger.info(f"  - Database driver: {parsed.scheme}")
        logger.info(f"  - Database host: {parsed.hostname or 'unknown'}")
        logger.info(f"  - Database name: {parsed.path.lstrip('/') if parsed.path else 'unknown'}")
        logger.info(f"  - SSL: {'Enabled' if ssl_enabled else 'Disabled'}")
    except Exception:
        logger.warning("Database Diagnostics: Unable to safely parse DATABASE_URL configuration.")

    logger.info("=========================================")
