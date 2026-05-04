# --- Stage 1: Builder ---
FROM python:3.11-slim AS builder

WORKDIR /app

# Necesitamos gcc para compilar algunas librerías de Python (como psycopg2 o bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libzbar-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# --- Stage 2: Runtime ---
FROM python:3.11-slim

WORKDIR /app

# Instalamos solo la librería de ejecución de zbar (necesaria para el backend)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzbar0 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copiamos las librerías instaladas desde el builder
COPY --from=builder /install /usr/local

# Copiamos el contenido de la carpeta backend al root del WORKDIR
# Asumo que ejecutas el build desde la carpeta raíz del proyecto
COPY backend/ . 

# Ajuste del Entrypoint
COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Cloud Run prefiere el puerto 8080 por defecto
EXPOSE 8080

# Seteamos variables para que Python no genere basura y los logs fluyan
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

ENTRYPOINT ["/docker-entrypoint.sh"]