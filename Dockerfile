FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
RUN addgroup -S trader && adduser -S trader -G trader
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN chown -R trader:trader /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
  touch /var/run/nginx.pid && chown trader:trader /var/run/nginx.pid
USER trader
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
