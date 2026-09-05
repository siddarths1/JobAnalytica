# 🚀 JobAnalytica Deployment & Operations Guide

JobAnalytica supports local zero-dependency execution, Docker containerization, and automated CI/CD pipeline deployments.

---

## 1. Local Development & Standalone Launch

### Prerequisites:
- Node.js 18+ & pnpm (`npm install -g pnpm`)
- Git

### Commands:
```bash
# 1. Clone repository & install dependencies
git clone https://github.com/siddarths1/JobAnalytica.git
cd JobAnalytica
pnpm install

# 2. Build monorepo packages
pnpm build

# 3. Launch via 1-click script
# On Windows:
.\start-local.bat

# On Linux / macOS:
chmod +x start-local.sh
./start-local.sh
```

---

## 2. Docker Compose Deployment

Run the complete stack inside isolated containers with one command:
```bash
docker-compose up --build -d
```

To stop containers:
```bash
docker-compose down
```

---

## 3. Environment Variables Configuration

Create `.env` in root or inside respective app directories:

### Backend (`apps/api/.env`)
```ini
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="http://localhost:3000"
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

### Frontend (`apps/web/.env.local`)
```ini
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
PORT=3000
```

---

## 4. CI/CD Pipeline (GitHub Actions)

The repository includes `.github/workflows/ci-cd.yml` configured to run on every push and pull request:
1. **Linting & Code Formatting**: Runs `pnpm lint`.
2. **Type Checking**: Strict TypeScript validation across all workspaces.
3. **Database Sync**: Validates Prisma schema consistency.
4. **Production Build**: Compiles NestJS backend and Next.js static pages.
5. **Docker Container Build**: Verifies that both multi-stage Dockerfiles build successfully.
