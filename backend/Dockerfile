# Backend image for IdeaConnect.
# Multi-stage: install prod deps only, run as a non-root user.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app

# wget is used by the healthcheck below.
RUN apk add --no-cache wget

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY scripts ./scripts

# Uploads are written here by the Multer middleware before being pushed to
# Cloudinary. The path must match middlewares/upload.js, which resolves
# <__dirname>/../uploads => /app/src/uploads. Mount a volume to keep them
# across restarts.
RUN mkdir -p /app/src/uploads && chown -R node:node /app
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:5000/api/v1/health || exit 1

CMD ["node", "src/server.js"]
