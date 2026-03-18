<<<<<<< HEAD
# 🍹 YANGCHAM - ชาอย่างฉ่ำ | Loyalty Program

A full-stack web application for YANGCHAM fruit tea shop loyalty program. Customers collect points when buying drinks and earn free drinks after collecting 10 points.

## Brand Identity

**Brand Name:** YANGCHAM (ชาอย่างฉ่ำ)

**Color Palette:**
- Primary Background: #8B1E12 (Deep Red)
- Primary Button: #F59E0B (Fruit Orange)
- Accent: #FFD34D (Lemon Yellow)
- Card Background: #FFF6E5 (Cream)
- Text: #4B2E1E (Tea Brown)

**Font Style:** Poppins & Fredoka (friendly, rounded)

## Features

### Customer Loyalty Page (Mobile-First)
- Clean, fun, and refreshing fruit tea shop vibe
- YANGCHAM branded UI with Thai language support
- Phone number input with validation
- Real-time points display with animated juice progress bar
- Message when customer reaches 10 points: "🎉 คุณได้รับเครื่องดื่มฟรี!"
- Redeem button to claim free drink

### QR Code Generator
- Generate QR code linking to the loyalty page
- Brand-colored QR code (Deep Red on Cream)
- Display in Admin Dashboard for printing
- Customers scan to open loyalty page directly

### Anti-Abuse Protection
- 10-second rate limiting between point collections per phone number
- Session-based token system prevents page refresh abuse
- Duplicate request detection
- Maximum 10 points limit per customer

### Telegram Notifications
- Real-time notifications sent when points are collected
- Includes phone number, total points, and timestamp

### Admin Dashboard
- Password-protected access
- View all customers with search functionality
- Edit customer points and total redeemed count
- Manual redemption for customers
- Transaction history view with filtering

### Database
- **SQLite** (simple, file-based database)
- Customers table with points tracking
- Point history table for audit trail
- No external database service required

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TailwindCSS, Vite, Axios, Poppins/Fredoka fonts |
| Backend | Node.js, Express |
| Database | SQLite (better-sqlite3) |
| Notifications | Telegram Bot API |
| QR Code | qrcode library |

## Project Structure

```
fruit-tea-loyalty/
├── backend/
│   ├── server.js           # Express API server
│   ├── package.json
│   ├── .env.example
│   ├── railway.json        # Railway deployment config
│   └── render.yaml         # Render deployment config
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── CustomerPage.jsx
│   │       └── AdminDashboard.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── .env.example
├── database/
│   └── supabase_schema.sql # Database schema
├── package.json            # Root workspace config
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- Telegram Bot (optional, for notifications)

### 1. Clone and Install

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Variables

Backend (`backend/.env`):
```
PORT=3001
ADMIN_PASSWORD=your_secure_admin_password
TELEGRAM_BOT_TOKEN=your_telegram_bot_token (optional)
TELEGRAM_CHAT_ID=your_telegram_chat_id (optional)
```

Frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001/api
```

### 3. Run Development

```bash
# Run both frontend and backend
npm run dev

# Or separately:
npm run dev:backend   # Backend only (port 3001)
npm run dev:frontend  # Frontend only (port 5173)
```

### 4. Access the Application

- Customer Page: http://localhost:5173/
- Admin Dashboard: http://localhost:5173/admin
- QR Code: http://localhost:5173/admin (click QR Code tab)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/qr-code` | Generate QR code for loyalty page |
| POST | `/api/collect-point` | Add 1 point to customer |
| GET | `/api/customer/:phone` | Get customer data |
| POST | `/api/redeem` | Redeem free drink |
| GET | `/api/history` | Get transaction history |
| POST | `/api/admin/login` | Admin authentication |
| GET | `/api/admin/customers` | List all customers |
| PATCH | `/api/admin/customers/:phone` | Update customer |
| POST | `/api/admin/redeem` | Manual redeem (admin) |

## Deployment

### Frontend (Vercel)

1. Connect your repo to Vercel
2. Set framework preset to "Vite"
3. Add environment variable: `VITE_API_URL=https://your-api.com/api`
4. Deploy

### Backend (Railway)

1. Connect your repo to Railway
2. Select the `backend` directory
3. Add environment variables from `.env.example`
4. Deploy

### Backend (Render)

1. Create new Web Service
2. Connect your repo
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables
6. Deploy

### Database

SQLite database is automatically created when the server starts. No external database setup required!

## Telegram Bot Setup (Optional)

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Create a new bot and copy the token
3. Start a chat with your new bot
4. Get your chat ID by visiting: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Add both to your backend `.env`

## Usage Guide

### For Shop Staff

1. Generate a QR code pointing to your deployed customer page
2. Place QR codes at checkout counter
3. Customers scan and enter phone number
4. Staff clicks "Collect Point" after purchase
5. Page auto-closes after 5 seconds

### For Customers

1. Scan QR code at shop
2. Enter phone number
3. Click "Collect Point" after purchase
4. Watch points accumulate (max 10)
5. At 10 points, choose to redeem or save

### For Admin

1. Navigate to `/admin`
2. Enter admin password
3. View customers, search by phone
4. Edit customer data if needed
5. Redeem manually if customer requests
6. View transaction history for auditing

## Security Considerations

- Change default admin password immediately
- Use environment variables for all secrets
- Consider adding HTTPS in production
- Telegram bot token should be kept private
- SQLite database file should be backed up regularly

## License

MIT License - feel free to use for your own fruit tea shop!

## Support

For issues or questions, please check:
1. Environment variables are set correctly
2. Backend is running and accessible
3. SQLite database is writable
4. Ports are not blocked by firewall
=======
# fruit-tea-loyalty
V1.0.0
>>>>>>> 94129eabdf7bf6604e4938a9a6efad5006b9d17d
