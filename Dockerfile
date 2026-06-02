# Stage 1: Base
FROM nginx:alpine AS base
RUN apk add --no-cache curl

# Stage 2: Development
FROM base AS development
# CAMBIO CLAVE: Cambiamos el WORKDIR a la ruta de Nginx
WORKDIR /usr/share/nginx/html
# Copiamos todo el contenido aquí
COPY . .
EXPOSE 80
# Quitamos el flag -c para usar la config por defecto que sí funciona
CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Production
FROM base AS production
WORKDIR /usr/share/nginx/html
COPY . .
RUN rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/index.html || exit 1
CMD ["nginx", "-g", "daemon off;"]