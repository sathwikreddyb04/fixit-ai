# FixIt AI — Production Deployment Guide

This document describes how to build, containerize, configure, and deploy FixIt AI for production hosting.

---

## Architecture & Hosting Models

FixIt AI consists of three workspace components:
1. **`@fixit/shared`**: Type contracts & Zod schemas (compiled TypeScript).
2. **`@fixit/server`**: Node.js / Express REST API (runs on port `4000` by default).
3. **`@fixit/client`**: React / Vite SPA (compiled to static HTML/CSS/JS in `client/dist`).

FixIt AI can be deployed under two standard deployment patterns:
- **Unified Single-Server Deployment (Recommended for Hackathons & Demos)**: The Express backend serves the API routes under `/api/v1/*` and serves the compiled static Vite frontend bundle from `client/dist` for all other routes.
- **Split Cloud Deployment**: The client static bundle is deployed to a CDN / Static Host (e.g. Vercel, Netlify, Cloudflare Pages, AWS S3 + CloudFront), and the backend is deployed to a Node.js container runner (e.g. Render, Railway, Fly.io, Google Cloud Run).

---

## 1. Environment Variables Configuration

Copy `.env.example` to `.env` or set these environment variables in your hosting provider's dashboard:

| Variable | Type | Default | Description |
|---|---|---|---|
| `NODE_ENV` | string | `production` | Set to `production` to enable performance optimizations and disable stack traces. |
| `PORT` | number | `4000` | Port for the Express server to listen on. |
| `CORS_ORIGIN` | string | `http://localhost:5173` | Allowed origin for API requests (set to your frontend domain in production). |
| `AI_PROVIDER` | string | `gemini` | AI Provider selection: `gemini` or `deterministic-demo`. |
| `GEMINI_API_KEY` | string | *(optional)* | Google Gemini API key. If omitted, the server safely falls back to Deterministic Demo Mode with explicit UI disclosure. |
| `SESSION_TTL_MINUTES` | number | `60` | In-memory session time-to-live before garbage collection. |
| `MAX_UPLOAD_SIZE_BYTES`| number | `5242880` | Maximum upload size in bytes (default 5 MB). |

---

## 2. Production Build Commands

Run the following commands from the project root:

```bash
# 1. Install all dependencies (production + dev dependencies needed for compilation)
npm ci

# 2. Build all workspaces in order (shared -> server -> client)
npm run build

# 3. Verify that tests pass before starting production
npm test --workspace=server
```

---

## 3. Docker Containerization (Dockerfile)

A production-ready multi-stage `Dockerfile` for containerized hosting:

```dockerfile
# Stage 1: Build workspace artifacts
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files
COPY package*.json tsconfig.base.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies across all workspaces
RUN npm ci

# Copy source trees
COPY shared ./shared
COPY server ./server
COPY client ./client

# Build all packages (shared -> server -> client)
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY package*.json ./
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/
RUN npm ci --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Security: run as non-root user
USER node

EXPOSE 4000
CMD ["node", "server/dist/server.js"]
```

Build and run the container:
```bash
docker build -t fixit-ai .
docker run -p 4000:4000 --env-file .env fixit-ai
```

---

## 4. Hosting on Cloud Platforms

### A. Deploy to Render / Railway
1. Connect your GitHub repository: `https://github.com/sathwikreddyb04/fixit-ai.git`.
2. Select **Web Service**.
3. Set **Build Command**: `npm ci && npm run build`.
4. Set **Start Command**: `node server/dist/server.js`.
5. Add environment variables (`NODE_ENV=production`, `GEMINI_API_KEY`, etc.).

### B. Deploy to Google Cloud Run
1. Build and push the Docker image to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/<PROJECT_ID>/fixit-ai
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy fixit-ai \
     --image gcr.io/<PROJECT_ID>/fixit-ai \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production
   ```

---

## 5. Security & Invariants Checklist

- [x] **Magic-byte Image Validation**: Only genuine JPEG, PNG, and WebP byte signatures pass. SVG and arbitrary binaries are rejected at the edge.
- [x] **Server-side Safety Intercepts**: Bleach combinations, electrical risks, and bodily injuries halt execution before AI prompt processing.
- [x] **Rate Limiting & Headers**: Helmet security headers and express-rate-limit are enabled on all `/api/v1/*` routes.
- [x] **In-Memory Privacy**: User images are processed in-memory and never persisted to disks or external object storage.
- [x] **Zero-Secret Commits**: All secrets are loaded through environment variables, with strict `.gitignore` enforcement.
