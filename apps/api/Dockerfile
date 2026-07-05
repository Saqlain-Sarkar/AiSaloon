# This Dockerfile should be built from the ROOT of the monorepo
# docker build -f apps/api/Dockerfile -t aisaloon-api .

# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install dependencies (ignoring scripts initially to avoid prisma generate failing without schema)
RUN npm ci --ignore-scripts

# Copy prisma schema
COPY prisma ./prisma

# Generate prisma client
RUN npx prisma generate

# Copy the rest of the backend source code
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

# Build the NestJS app
RUN npm run build --workspace=apps/api

# Production Stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Install only production dependencies
RUN npm ci --omit=dev --ignore-scripts

# Copy Prisma engine and generated client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Copy built assets from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Expose port (Render/Koyeb default to 3000, but we can use 4000)
ENV PORT=4000
EXPOSE 4000

# Start the application
CMD ["node", "apps/api/dist/main"]
