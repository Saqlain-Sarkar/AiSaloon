# Deployment

## Local Development

```bash
# Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate --schema=prisma/schema.prisma

# Push schema to database
npx prisma db push --schema=prisma/schema.prisma

# Seed data
npx ts-node prisma/seed/index.ts

# Start API in dev mode
npm run dev
```

## Production Build

```bash
# Build API
cd apps/api && npm run build

# Build Docker image
docker build -f docker/Dockerfile.api -t ai-saloon-os-api .
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/ai_saloon_os` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_REFRESH_SECRET` | Refresh token secret | — |
| `OPENAI_API_KEY` | OpenAI API key | — |
| `GEMINI_API_KEY` | Google Gemini API key (fallback) | — |
| `QDRANT_URL` | Qdrant vector DB URL | `http://localhost:6333` |
| `PORT` | API server port | `4000` |

## CI/CD

- GitHub Actions on push/PR to `main` and `develop`
- Lint → Test → Build → Deploy
- Deploy frontend to Vercel
- Deploy backend to Railway or DigitalOcean
