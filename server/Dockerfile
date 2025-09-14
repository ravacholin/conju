# Dockerfile para deployment alternativo (Railway prefiere detectar automáticamente)
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias incluyendo herramientas de build para better-sqlite3
RUN apk add --no-cache python3 make g++ && \
    npm ci --only=production && \
    apk del python3 make g++

# Copiar código fuente
COPY src/ ./src/

# Crear directorio para base de datos
RUN mkdir -p .data

# Exponer puerto
EXPOSE 8787

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8787/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Comando por defecto
CMD ["npm", "start"]