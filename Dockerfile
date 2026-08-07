FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# Persist this path with a Coolify Volume Mount (Persistent Storage → /app/uploads)
ENV UPLOADS_DIR=/app/uploads
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/uploads
# Declares the mount point; Coolify must still attach Persistent Storage here
VOLUME ["/app/uploads"]
EXPOSE 4015
CMD ["node", "dist/index.js"]
