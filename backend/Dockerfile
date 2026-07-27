# Production Dockerfile for FastAPI backend
FROM python:3.12-slim

# Prevent writing compiled bytecodes to disk and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EASYOCR_MODULE_PATH=/app/.EasyOCR \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1

WORKDIR /app

# Create system user and group for running the application securely
RUN groupadd -r appgroup && useradd -r -g appgroup -m -s /sbin/nologin appuser

# Install system dependencies for OpenCV and EasyOCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install requirements using layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application source code
COPY . .

# Create the uploads directory and set permissions
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Expose API gateway port
EXPOSE 8000

# Switch context to non-root user
USER appuser


# Health Check instruction using Python's built-in urllib
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD python -c "import urllib.request, os; urllib.request.urlopen('http://localhost:' + os.getenv('PORT', '8000') + '/health')" || exit 1

# Start FastAPI using production server configuration
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
