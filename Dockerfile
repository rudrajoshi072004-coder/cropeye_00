### Root Dockerfile (Render): gateway + cropeye06 + cropeye07 behind ONE port
### Served as static SPAs via Nginx:
###   /login/     -> gateway
###   /grapes/    -> cropeye06
###   /sugarcane/ -> cropeye07

FROM node:20-alpine AS build
WORKDIR /build

# Build gateway
COPY gateway/package*.json ./gateway/
RUN cd gateway && npm ci
COPY gateway ./gateway
RUN cd gateway && npm run build

# Build cropeye06 (grapes)
COPY cropeye06-main/package*.json ./cropeye06-main/
RUN cd cropeye06-main && npm ci
COPY cropeye06-main ./cropeye06-main
RUN cd cropeye06-main && npm run build

# Build cropeye07 (sugarcane)
COPY cropeye07-main/package*.json ./cropeye07-main/
RUN cd cropeye07-main && npm ci
COPY cropeye07-main ./cropeye07-main
RUN cd cropeye07-main && npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext

# Copy built SPAs into path-based folders
COPY --from=build /build/gateway/dist /usr/share/nginx/html/login
COPY --from=build /build/cropeye06-main/dist /usr/share/nginx/html/grapes
COPY --from=build /build/cropeye07-main/dist /usr/share/nginx/html/sugarcane

# Nginx template (Render $PORT) + entrypoint
COPY nginx.render.conf.template /etc/nginx/templates/nginx.render.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["/docker-entrypoint.sh"]

