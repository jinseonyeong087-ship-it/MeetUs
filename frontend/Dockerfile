FROM nginx:1.27-alpine

# Clean default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Static frontend files
COPY . /usr/share/nginx/html

# Custom nginx config
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
