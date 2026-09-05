# 🚀 JobAnalytica - AI Job Discovery & Multi-Resume Intelligence Engine

[![CI/CD Pipeline](https://github.com/siddarths1/JobAnalytica/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/siddarths1/JobAnalytica/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0+-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg)](https://nextjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**JobAnalytica** is a high-throughput, production-ready AI job discovery platform, multi-role resume intelligence matcher, regional tech hub crawler, and Kanban application lifecycle tracking system.

---

## 🌟 Key Capabilities

### 1. 🎯 Multi-Resume & Multi-Role AI Matching Engine
- Maintain and manage multiple role-specific resumes simultaneously (e.g. **Founding AI Engineer**, **Staff Backend Engineer**, **Product Engineering Lead**).
- Dynamic 3-stage matching funnel: deterministic pre-filtering → weighted semantic skill overlap → gap synthesis.
- Automatic **Best-Fit Resume** tagging with cross-compatibility fit percentages for alternate resumes.
- Generates **Why You Should Apply** positive factors and **Risks & Missing Gaps** analysis for each job.

### 2. 🌍 Regional Geo Discovery & India Top 10 Tech Hubs
- Deep cataloging and targeted ingestion across India's top 10 technology hubs and districts:
  - 📍 **Bengaluru** *(Silicon Valley of India — Koramangala, HSR, Whitefield, Indiranagar)*
  - 📍 **Hyderabad** *(Cyberabad — HITEC City, Gachibowli, Financial District)*
  - 📍 **Pune** *(Engineering Epicenter — Hinjawadi, Magarpatta, Kharadi)*
  - 📍 **Delhi-NCR** *(Gurgaon Cyber City, Golf Course Ext, Noida Sector 62/125)*
  - 📍 **Chennai** *(SaaS Capital — OMR Tech Corridor, Tidel Park, Guindy)*
  - 📍 **Mumbai & MMR** *(FinTech Capital — BKC, Powai, Andheri SEEPZ)*
  - 📍 **Ahmedabad & GIFT City** *(International FinTech SEZ, SG Highway)*
  - 📍 **Kochi** *(Infopark Kakkanad, SmartCity)*
  - 📍 **Kolkata** *(Salt Lake Sector V, New Town)*
  - 📍 **Jaipur & Indore** *(High-Growth Emerging Tech Corridors)*

### 3. 🏢 4-Tier Target Company Catalog & Direct ATS Crawlers
- Ingests opportunities across all company tiers:
  - 🚀 **Early-Stage Startups** (Seed / Series A — *Langflow, DevRev, HyperVerge*)
  - 🏢 **Tier 2 Mid-Cap / Growth Scaleups** (*Postman, Hasura, Darwinbox, HighRadius, Druva, Icertis, Freshworks, BrowserStack, CleverTap, SurveySparrow*)
  - 🏛️ **Tier 1 Enterprises & Unicorns** (*Razorpay, Zomato, Uber India Tech Centers*)
  - 🌐 **Tier 3 IT & Services Consultancies** (*Thoughtworks, Persistent Systems, Coforge, Nagarro, LTI Mindtree*)
- **Direct ATS Integration**: Structured JSON ingestion from Greenhouse, Lever, and Ashby APIs with zero bot blocking.
- **Liveness & Freshness Validator**: Active HTTP HEAD probing of ATS endpoints + automatic deactivation of stale listings older than 45 days.

### 4. 📊 Application Lifecycle Tracker & CSV Streaming
- Drag-and-drop Kanban tracker: `SAVED` → `APPLIED` → `ASSESSMENT` → `INTERVIEW` → `OFFER`.
- Real-time audit history events and streaming CSV export.

### 5. 🛡️ Production Hardening & CI/CD
- Security headers via **Helmet**, rate limiting via **Throttler**, global exception filtering.
- Automated **GitHub Actions CI/CD** with linting, multi-package typecheck, and Docker validation.
- Standalone **Docker Compose** & single-click local runners (`start-local.bat` / `start-local.sh`).

---

## 🏗️ Architecture & Monorepo Layout

```
JobAnalytica (Monorepo via pnpm)
├── apps/
│   ├── api/                       # NestJS 10 Gateway, Prisma ORM, ATS Adapters
│   │   ├── src/
│   │   │   ├── adapters/          # Greenhouse, Lever, Ashby, Adzuna adapters
│   │   │   └── modules/
│   │   │       ├── discovery/     # Geo Hubs, Company Directory & Freshness Validator
│   │   │       ├── resumes/       # Multi-Resume parser & Candidate Profiles
│   │   │       ├── jobs/          # 3-Stage AI matching engine & custom JD evaluator
│   │   │       ├── applications/  # Kanban tracker & audit trail
│   │   │       └── exports/       # Streaming CSV exporter
│   └── web/                       # Next.js 14+ App Router, TailwindCSS, Lucide Icons
│       └── src/app/
│           ├── dashboard/         # Multi-Tier & Geo Hub Feed with Priority Index
│           ├── resume/            # Multi-Resume Management Hub
│           ├── tracker/           # Application Kanban Board
│           └── sources/           # Ingestion Source Status & Adapters
├── packages/
│   └── shared-types/              # Shared TypeScript DTOs, Interfaces & Enums
├── docs/                          # Comprehensive Technical Documentation
│   ├── ARCHITECTURE.md            # System Design & Data Flow
│   ├── GEO_DISCOVERY_ENGINE.md    # Tech Hubs, ATS Crawlers & Freshness Validation
│   ├── API_REFERENCE.md           # Full REST API Reference
│   └── DEPLOYMENT_GUIDE.md        # Local, Docker Compose & Production Setup
├── .github/workflows/             # Automated CI/CD Pipeline
└── docker-compose.yml             # Multi-container production deployment
```

---

## ⚡ Quick Start Guide

### 1. Zero-Dependency Local Launch
```bash
# Install dependencies & compile packages
pnpm install
pnpm build

# Windows single-click run
.\start-local.bat

# Linux / macOS run
chmod +x start-local.sh
./start-local.sh
```

### 2. Docker Compose
```bash
docker-compose up --build -d
```

---

## 🌐 Endpoints & Ports

- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **API Gateway**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 📚 Detailed Documentation

- 🏛️ [System Architecture](docs/ARCHITECTURE.md)
- 🌍 [Regional Geo Discovery & ATS Crawler](docs/GEO_DISCOVERY_ENGINE.md)
- 📡 [REST API Reference](docs/API_REFERENCE.md)
- 🚀 [Deployment & Operations Guide](docs/DEPLOYMENT_GUIDE.md)

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
