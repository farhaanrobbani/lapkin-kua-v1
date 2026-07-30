import React from 'react';
import { Terminal, Server, ShieldCheck, Database, Cpu, FileCode } from 'lucide-react';

export const DeploymentGuideView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Panduan Deployment Production Ubuntu VPS & Docker
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Petunjuk lengkap arsitektur production-ready dengan Docker, Docker Compose, Nginx Reverse Proxy, SSL, PM2, dan PostgreSQL Migration.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Dockerfile Card */}
        <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-emerald-400 font-bold">
            <span className="flex items-center space-x-2">
              <FileCode className="w-4 h-4" />
              <span>1. Dockerfile (Multi-stage Build)</span>
            </span>
          </div>
          <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`}
          </pre>
        </div>

        {/* docker-compose.yml Card */}
        <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-blue-400 font-bold">
            <span className="flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>2. docker-compose.yml</span>
            </span>
          </div>
          <pre className="text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{`version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=kua-laporan-super-secret-key-2026
      - DATABASE_URL=postgres://kua_user:kua_password@postgres:5432/kua_db
    depends_on:
      - postgres
    restart: always

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: kua_user
      POSTGRES_PASSWORD: kua_password
      POSTGRES_DB: kua_db
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./src/server/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: always

volumes:
  pgdata:`}
          </pre>
        </div>

      </div>

      {/* Ubuntu VPS & Nginx Commands */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          <span>Panduan Langkah-demi-Langkah Deploy di Ubuntu VPS</span>
        </h3>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <p className="font-bold text-slate-900 dark:text-white">Langkah 1: Setup Nginx Reverse Proxy & SSL Certbot</p>
            <p className="text-slate-500 dark:text-slate-400">Konfigurasi Nginx `/etc/nginx/sites-available/kua.conf`:</p>
            <pre className="font-mono text-[11px] p-3 rounded-lg bg-slate-900 text-emerald-400 overflow-x-auto">
{`server {
    server_name silap-kua.go.id;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Auto SSL LetsEncrypt:
# sudo certbot --nginx -d silap-kua.go.id`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <p className="font-bold text-slate-900 dark:text-white">Langkah 2: Menjalankan Aplikasi dengan PM2</p>
            <pre className="font-mono text-[11px] p-3 rounded-lg bg-slate-900 text-slate-300 overflow-x-auto">
{`# Install PM2 secara global
npm install -g pm2

# Build aplikasi
npm run build

# Jalankan server
pm2 start dist/server.cjs --name "silap-kua"
pm2 save
pm2 startup`}
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <p className="font-bold text-slate-900 dark:text-white">Langkah 3: Setup Cronjob Server Scheduler (Rekap Otomatis)</p>
            <pre className="font-mono text-[11px] p-3 rounded-lg bg-slate-900 text-slate-300 overflow-x-auto">
{`# Edit cronjob server:
crontab -e

# Eksekusi rekap harian KUA setiap jam 23:59 WIB:
59 23 * * * curl -X POST http://localhost:3000/api/telegram/send -H "Content-Type: application/json" -d '{"chatId":"987654321","message":"Rekap otomatis harian KUA selesai dilakukan."}'`}
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
};
