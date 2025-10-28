FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Set API URL for build (can be overridden via build args)
ARG NEXT_PUBLIC_API_URL=http://172.16.18.184:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy entrypoint script
COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use entrypoint to inject runtime config
CMD ["./entrypoint.sh"]
