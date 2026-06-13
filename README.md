# SafeRoute AI - Emergency Response Platform

SafeRoute AI is an AI-powered Disaster Management and Emergency Response System configured as a monorepo containing a Next.js 15 web application, an Express.js server, and a PostgreSQL database setup.

## Features Included
- **Geospatial Map**: Real-time disaster zones, community shelters, and medical center marker tracking.
- **Dynamic SOS Beacon**: Periodic Socket.io coordinate feeds (broadcasting location every 15 seconds).
- **Incident Room Dashboards**: Role-based routing supporting Citizens (requesters), Rescue Teams (responders), and Admins (dispatchers).
- **AI Assistant**: Conversational agent providing disaster guidance and first-aid recommendations.

---

## Local Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database instance running (or Docker installed)

### Quick Start (Manual Setup)

1. **Clone and Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Configure Environment variables**:
   Modify the `.env` file at the root with your PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saferoute?schema=public"
   JWT_SECRET="safe-route-super-secure-key-12345"
   PORT=3001
   GEMINI_API_KEY="your-gemini-key"
   ```

3. **Deploy Database Migrations & Seeds**:
   ```bash
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

4. **Launch Application Services**:
   ```bash
   npm run dev
   ```
   The Next.js app will build on [http://localhost:3000](http://localhost:3000) and the Express Server will boot on [http://localhost:3001](http://localhost:3001).

---

## Docker Compose Setup
To spin up all services including PostgreSQL, Express Server, and Next.js dynamically in containers:
```bash
docker-compose up --build
```
This boots the database, server, and client services out of the box.

---

## Pre-configured Mock Accounts for Testing
To test role capabilities instantly, use the following details from the database seeds:
- **Admin Command**: `admin@saferoute.ai` (Password: `Password123`)
- **Rescue Team Dispatcher**: `rescue@saferoute.ai` (Password: `Password123`)
- **Citizen SOS client**: `citizen@saferoute.ai` (Password: `Password123`)
