### Root Dockerfile (Render): gateway + cropeye06 + cropeye07 in ONE container

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

# Runtime: run 3 preview servers + nginx reverse proxy (single public port)
FROM node:20-alpine
WORKDIR /apps

RUN apk add --no-cache nginx supervisor gettext

# Copy built apps + minimal runtime deps to run `vite preview`
COPY --from=build /build/gateway /apps/gateway
COPY --from=build /build/cropeye06-main /apps/cropeye06-main
COPY --from=build /build/cropeye07-main /apps/cropeye07-main

# Nginx + supervisor config
COPY nginx.render.conf.template /etc/nginx/templates/nginx.render.conf.template
COPY supervisord.conf /etc/supervisord.conf

# Render provides $PORT (single external port)
ENV PORT=10000

EXPOSE 10000

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]

