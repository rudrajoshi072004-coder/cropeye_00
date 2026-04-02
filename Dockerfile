### Root Dockerfile (Render): gateway + cropeye06 + cropeye07 behind ONE port
### Served as static SPAs via Nginx:
###   /           -> gateway (login)
###   /login/     -> gateway (same SPA)
###   /grapes/    -> cropeye06
###   /sugarcan/  -> cropeye07 (sugarcane app)
###
### Deploy host (override when building):
###   docker build --build-arg VITE_PUBLIC_ORIGIN=https://cropeye-00.onrender.com .
### Login:  https://cropeye-00.onrender.com/
### Grapes: https://cropeye-00.onrender.com/grapes/
### Sugar:  https://cropeye-00.onrender.com/sugarcan/

FROM node:20-alpine AS build
WORKDIR /build

# Vite bakes VITE_* at build time — set before npm run build for gateway + both apps.
# GATEWAY_URL is used by cropeye06/cropeye07 for redirects to centralized login.
# GRAPES / SUGARCANE URLs are used by the gateway login redirect after auth.
ARG VITE_PUBLIC_ORIGIN=https://cropeye-00.onrender.com
ENV VITE_GATEWAY_URL=${VITE_PUBLIC_ORIGIN}
ENV VITE_GRAPES_APP_URL=${VITE_PUBLIC_ORIGIN}/grapes/
ENV VITE_SUGARCANE_APP_URL=${VITE_PUBLIC_ORIGIN}/sugarcan/

# Build gateway (login at site root)
COPY gateway/package*.json ./gateway/
RUN cd gateway && npm ci
COPY gateway ./gateway
RUN cd gateway && npm run build

# Build cropeye06 (grapes)
COPY cropeye06-main/package*.json ./cropeye06-main/
RUN cd cropeye06-main && npm ci
COPY cropeye06-main ./cropeye06-main
RUN cd cropeye06-main && npm run build

# Build cropeye07 (sugarcane UI, served under /sugarcan/)
COPY cropeye07-main/package*.json ./cropeye07-main/
RUN cd cropeye07-main && npm ci
COPY cropeye07-main ./cropeye07-main
RUN cd cropeye07-main && npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache gettext

# Copy built SPAs into path-based folders
COPY --from=build /build/gateway/dist /usr/share/nginx/html/login
COPY --from=build /build/cropeye06-main/dist /usr/share/nginx/html/grapes
COPY --from=build /build/cropeye07-main/dist /usr/share/nginx/html/sugarcan

# Nginx template (Render $PORT) + entrypoint
COPY nginx.render.conf.template /etc/nginx/templates/nginx.render.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["/docker-entrypoint.sh"]

