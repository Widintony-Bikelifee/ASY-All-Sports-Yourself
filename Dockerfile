FROM nginx:alpine AS base
RUN apk add --no-cache curl

FROM base AS development
WORKDIR /usr/share/nginx/html
COPY . .
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

FROM base AS production
WORKDIR /usr/share/nginx/html
COPY . .
RUN rm -f /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/index.html || exit 1
CMD ["nginx", "-g", "daemon off;"]