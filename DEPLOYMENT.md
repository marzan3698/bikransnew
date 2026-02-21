# Plesk Deployment Guide - bikrans.com

## Overview

This project uses Node.js (Express) + React (Vite) + MySQL. Deployment to Plesk with GitHub auto-deploy and automatic database migration.

## Prerequisites

- GitHub repository with the project code
- Plesk hosting with Git and Node.js enabled
- MySQL database created in Plesk

## 1. Plesk Setup

### 1.1 Connect GitHub

1. **Websites & Domains** → bikrans.com → **Git**
2. **Add Repository**
3. Repository URL: `https://github.com/YOUR_USERNAME/YOUR_REPO.git`
4. **Deployment path:** `httpdocs`
5. **Branch:** `main`
6. Enable deployment

### 1.2 Create Database

1. **Databases** → **Add Database**
2. Name: `bikrans_db` (or your choice)
3. Create user with full privileges

### 1.3 Create .env File

Using Plesk File Manager or SSH, create `.env` in `httpdocs`:

```
NODE_ENV=production
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your-secure-random-string
PORT=3001
ALLOWED_ORIGIN=https://bikrans.com
```

### 1.4 Deploy Actions (Auto Migration on Push)

1. **Git** → Select repository → **Deploy** / **Settings**
2. Enable **Additional deployment actions**
3. Add:

```bash
cd $HOME/httpdocs && chmod +x deploy.sh 2>/dev/null; bash deploy.sh 2>&1 | tee -a deploy.log; touch tmp/restart.txt 2>/dev/null || true
```

### 1.5 Node.js App

1. **Dev Tools** → **Node.js** → bikrans.com
2. **Application root:** `httpdocs`
3. **Application startup file:** `server/index.js`
4. **Node.js version:** 18+
5. Enable application

### 1.6 Webhook (Optional)

GitHub repo → **Settings** → **Webhooks** → Add:

- Payload URL: (from Plesk Git settings)
- Events: Push

## 2. First Deploy

1. Push code to GitHub
2. In Plesk Git: **Pull** or **Deploy**
3. Check `deploy.log` in httpdocs for migration output
4. Restart Node.js app if needed

## 3. Deploy Script (`deploy.sh`)

Runs automatically on each Git pull/deploy:

- `npm ci --omit=dev` - Install production dependencies
- `npm run build` - Build Vite frontend to dist/
- `npm run migrate` - Run database migrations
- `mkdir -p public/uploads/...` - Create upload directories

## 4. FFmpeg

Video processing requires FFmpeg on the server. Install via SSH if not present:

```bash
# Debian/Ubuntu
apt install ffmpeg
```

## 5. মাইগ্রেশন হ্যান্ডবুক (Migration Handbook)

নতুন মাইগ্রেশন (যেমন `quiz_responses`) সাধারণত ডিপ্লয় স্পটে নিজে চালু হয় না। নিচের দুইটা প্রক্রিয়ার যেকোনো একটা থাকলেই হবে:

**ক) Plesk Additional Deployment Actions:**
- যদি **1.4** অনুযায়ী `deploy.sh` চালানোর কমান্ড সেট করা থাকে, তাহলে প্রতি Pull/Deploy-এ `deploy.sh` চলবে
- `deploy.sh` এর ভেতর `npm run migrate` আছে → নতুন মাইগ্রেশন স্বয়ংক্রিয়ভাবে চালবে

**খ) ম্যানুয়াল মাইগ্রেশন (Plesk SSH বা Terminal):**

সার্ভারে SSH দিয়ে বা Plesk **Tools & Settings** → **SSH Access** দিয়ে লগইন করে:

```bash
cd /var/www/vhosts/bikrans.com/httpdocs   # অথবা আপনার deployment path
npm run migrate
```

`.env` ফাইলে সঠিক DB credentials থাকলে এই কমান্ড নতুন টেবিল/কলাম যোগ করবে।

**রোলব্যাক (প্রয়োজনে):**
```bash
npm run migrate:rollback
```

## 6. Troubleshooting

- **Migration fails:** Check `.env` DB credentials
- **403/404:** Verify Node.js app is running and document root
- **CORS errors:** Ensure `ALLOWED_ORIGIN` matches your domain
- **নতুন টেবিল দেখা যাচ্ছে না:** Plesk Git → **Pull** করার পর `deploy.sh` চালু হয়েছে কি না `deploy.log` দেখুন; না থাকলে `npm run migrate` ম্যানুয়াল চালান
