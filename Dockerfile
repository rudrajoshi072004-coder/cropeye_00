### Root Dockerfile (Render / any host): gateway + cropeye06 + cropeye07 on ONE port
### Nginx serves static SPAs:
###   /           -> 302 /login/
###   /login/     -> gateway (login SPA)
###   /grapes/    -> cropeye06 (grapes)
###   /sugarcan/  -> cropeye07 (sugarcane)
###
### VITE_* are baked at **build** time — set VITE_PUBLIC_ORIGIN to your public HTTPS origin
### (no trailing path), e.g. your Render service URL or custom domain.
###
###   docker build --build-arg VITE_PUBLIC_ORIGIN=https://YOUR-SERVICE.onrender.com -t cropeye .
###   docker run -p 10000:10000 -e PORT=10000 cropeye
###
### Render: add Docker build arg `VITE_PUBLIC_ORIGIN` = `https://<your-service>.onrender.com`
### (Dashboard → Service → Settings → Build → Docker Build Args).

# Pin base images to immutable digests to avoid Render BuildKit cache/registry issues
# that can surface as: "failed to compute cache key ... content sha256 ... not found"
# when mutable tags (e.g. alpine) move or cached layers go missing.
FROM node:20-alpine@sha256:9d3576e0c3ed2538f103893876944d637a957e3775525e12d8e39c9ecb1df70e AS build
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

FROM nginx:1.27-alpine@sha256:0f62d942d5e8dd98c5451270e23bb7411257d42b5fd8f5127100d763dc862d52
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

