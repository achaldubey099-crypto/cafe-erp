# Vercel + Azure deployment

## Target architecture

- Frontend: Vercel
- Backend: Azure App Service (Linux)
- Edge protection: Azure Application Gateway WAF v2 in front of the backend

## Frontend on Vercel

Deploy the `frontend` folder as the Vercel project root.

Required Vercel environment variables:

- `VITE_API_BASE_URL=https://your-backend.azurewebsites.net/api`
- `VITE_GOOGLE_CLIENT_ID=<your-google-client-id>`

Recommended Vercel project settings:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

## Backend on Azure

Deploy the `backend` folder to Azure App Service Linux with Node 20.

Required Azure App Settings:

- `NODE_ENV=production`
- `PORT=8080`
- `MONGO_URI`
- `JWT_SECRET`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`
- `SUPERADMIN_NAME`
- `GOOGLE_CLIENT_ID`
- `CLOUDINARY_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app,https://app.yourdomain.com`

Startup behavior:

- Azure runs `npm install --omit=dev`
- Azure starts the app with `npm start`
- Backend health endpoint is `GET /health`

## DNS and API wiring

Recommended production DNS:

- Frontend: `app.yourdomain.com` -> Vercel
- Backend gateway: `api.yourdomain.com` -> Azure Application Gateway public IP

Then set:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Validation

1. Open the Vercel site and verify frontend assets load.
2. Call `https://api.yourdomain.com/health` and verify `200`.
3. Confirm login, menu, orders, admin, and payment APIs work from the Vercel frontend.
4. Confirm backend CORS only allows the Vercel production domain.
