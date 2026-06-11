FROM node:20-alpine

WORKDIR /app

# Prisma needs openssl on alpine
RUN apk add --no-cache openssl

# Install deps first for better Docker layer caching
COPY package*.json ./
RUN npm ci

# Generate Prisma clients against the Linux target (host generates against Windows)
COPY prisma ./prisma/
RUN npx prisma generate

# Source + sms_syllabus Prisma client (writes to src/generated/, must happen
# before `npm run build` because the build imports the generated types).
# Uses a placeholder URL — generate does not connect; runtime reads the real
# SMS_SYLLABUS_DATABASE_URL from env_file at container start.
COPY . .
RUN npx prisma generate --config=prisma/sms-syllabus/prisma.config.ts
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Drop to non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["npm", "start"]
