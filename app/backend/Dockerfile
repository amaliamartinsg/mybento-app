# --- Stage 1: Builder ---
FROM python:3.11-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libzbar-dev \
    && rm -rf /var/lib/apt/lists/*

# Cambiado: de 'backend/requirements.txt' a 'requirements.txt'
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Stage 2: Runtime ---
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libzbar0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /install /usr/local

# Cambiado: de 'backend/ .' a '. .'
COPY . . 

# Cambiado: de 'backend/docker-entrypoint.sh' a 'docker-entrypoint.sh'
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8080
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

ENTRYPOINT ["/docker-entrypoint.sh"]