FROM python:3.11-slim

# System dependencies install karo
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /app

# Requirements file copy karo
COPY requirements.txt .

# Python packages install karo
RUN pip install --no-cache-dir -r requirements.txt

# Application code copy karo
COPY . .

# Non-root user create karo (security ke liye)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Port expose karo
EXPOSE 8000

# Application run karo
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
