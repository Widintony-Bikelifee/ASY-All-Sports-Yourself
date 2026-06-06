FROM nginx:alpine AS production

RUN apk add --no-cache curl

# Nginx config personalizada
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Archivos del sitio
COPY . /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
