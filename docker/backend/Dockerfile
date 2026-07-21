# TNC Guardian - Backend Development container
FROM python:3.12-slim

WORKDIR /app

# Prevent writing compiled bytecodes to disk
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend app
COPY . .

# Expose API gateway port
EXPOSE 8000

# Start hot-reload server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
