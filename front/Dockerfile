FROM node:25-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias durante BUILD
RUN npm ci --only=production=false

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 5173

# Variables de entorno
ENV HOST=0.0.0.0
ENV PORT=5173

