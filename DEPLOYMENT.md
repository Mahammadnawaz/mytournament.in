# CricPulse Deployment & Hosting Guide

The CricPulse Cricket Application is pre-configured and 100% ready for instant deployment on **Vercel**, **Render**, **Railway**, or any **VPS/Docker** host.

---

## ⚡ 1. Deploying on Vercel (1-Click Ready)

The project now includes [`vercel.json`](./vercel.json) and [`api/index.js`](./api/index.js) for full serverless deployment on Vercel:

1. Push this project repository to your GitHub account.
2. Go to [vercel.com](https://vercel.com/) and click **"Add New Project"**.
3. Import your `cricket-score-tracker` GitHub repository.
4. Vercel will automatically detect:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**.
6. **Done!** Vercel will build the frontend and serve all `/api/*` synchronization endpoints seamlessly on your live HTTPS `.vercel.app` domain.

---

## 🚀 2. Deploying on Render (Full-Stack Node Web Service)

1. Connect your repository on [render.com](https://render.com/).
2. Create a **Web Service**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
3. Render provides a live HTTPS domain (e.g. `https://cricpulse.onrender.com`).

---

## 🚂 3. Deploying on Railway

1. Connect your repo on [railway.app](https://railway.app/).
2. Railway detects `package.json` and runs `npm run build` + `npm start`.

---

## 💻 4. Deploying on VPS / Docker / Ubuntu

```bash
git clone <your-repo-url>
cd cricket-score-tracker
npm install
npm run build
pm2 start server/index.js --name "cricpulse"
```
