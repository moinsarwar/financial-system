FROM python:3.11-slim AS base  
  
WORKDIR /app  
  
ENV PYTHONDONTWRITEBYTECODE=1  
ENV PYTHONUNBUFFERED=1  
  
RUN apt-get update \  
    && apt-get install -y --no-install-recommends curl \  
    && rm -rf /var/lib/apt/lists/*  
  
COPY requirements.txt .  
RUN pip install --no-cache-dir -r requirements.txt  
  
  
FROM base AS development  
  
COPY requirements-dev.txt .  
RUN pip install --no-cache-dir -r requirements-dev.txt  
  
COPY . .  
  
COPY entrypoint.sh /entrypoint.sh  
RUN chmod +x /entrypoint.sh  
  
RUN useradd -m -u 1000 finos \  
    && chown -R finos:finos /app  
  
USER finos  
  
ENTRYPOINT ["/entrypoint.sh"]  
  
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
  
  
FROM base AS production  
  
COPY . .  
  
COPY entrypoint.sh /entrypoint.sh  
RUN chmod +x /entrypoint.sh  
  
RUN useradd -m -u 1000 finos \  
    && chown -R finos:finos /app  
  
USER finos  
  
ENTRYPOINT ["/entrypoint.sh"]  
  
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
