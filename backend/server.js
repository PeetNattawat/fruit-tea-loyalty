import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import TelegramBot from 'node-telegram-bot-api';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize SQLite database
let db;

async function initDb() {
  db = await open({
    filename: path.join(__dirname, 'loyalty.db'),
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE NOT NULL,
      points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 10),
      total_collected INTEGER NOT NULL DEFAULT 0 CHECK (total_collected >= 0),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
    
    CREATE TABLE IF NOT EXISTS point_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      points_added INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      redeemed BOOLEAN DEFAULT 0,
      FOREIGN KEY (phone_number) REFERENCES customers(phone_number) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_history_phone ON point_history(phone_number);
    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON point_history(timestamp DESC);
  `);
  
  console.log('✅ Database initialized');
}
const bot = process.env.TELEGRAM_BOT_TOKEN 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory rate limiting for anti-abuse
const rateLimitStore = new Map();
const usedTokens = new Set();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.timestamp > 60000) {
      rateLimitStore.delete(key);
    }
  }
  usedTokens.clear();
}, 300000);

// Rate limiter middleware
const apiLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1,
  message: { error: 'Please wait 10 seconds between requests' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.phone_number || req.ip
});

// Anti-abuse middleware
const antiAbuseMiddleware = (req, res, next) => {
  const { phone_number, token } = req.body;
  
  if (!phone_number) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  // Check for duplicate token (prevents refresh abuse)
  if (token && usedTokens.has(token)) {
    return res.status(429).json({ error: 'This request has already been processed' });
  }

  // Check rate limit per phone number
  const now = Date.now();
  const key = phone_number;
  const lastRequest = rateLimitStore.get(key);

  if (lastRequest && now - lastRequest.timestamp < 10000) {
    return res.status(429).json({ 
      error: 'Please wait 10 seconds between point collections',
      remainingSeconds: Math.ceil((10000 - (now - lastRequest.timestamp)) / 1000)
    });
  }

  // Store token if provided
  if (token) {
    usedTokens.add(token);
  }

  next();
};

// Send Telegram notification
const sendTelegramNotification = async (phone, points, totalCollected) => {
  if (!bot || !process.env.TELEGRAM_CHAT_ID) return;

  const message = `
🍹 *YANGCHAM - New Point Collected!*

📱 Phone: ${phone}
⭐ Total Points: ${points}/10
🎁 Free Drinks Redeemed: ${totalCollected}
⏰ Time: ${new Date().toLocaleString('th-TH')}
  `;

  try {
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Telegram notification failed:', error.message);
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generate QR Code
app.get('/api/qr-code', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
    const loyaltyUrl = `${baseUrl}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(loyaltyUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#8B1E12',
        light: '#FFF6E5'
      }
    });
    
    res.json({ 
      qrCode: qrCodeDataUrl,
      url: loyaltyUrl
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Collect point
app.post('/api/collect-point', apiLimiter, antiAbuseMiddleware, async (req, res) => {
  const { phone_number } = req.body;

  try {
    // Check if customer exists
    let customer = await db.get('SELECT * FROM customers WHERE phone_number = ?', phone_number);

    if (!customer) {
      // Create new customer
      const result = await db.run(
        'INSERT INTO customers (phone_number, points, total_collected) VALUES (?, 1, 0)',
        phone_number
      );
      customer = {
        id: result.lastID,
        phone_number,
        points: 1,
        total_collected: 0
      };
    } else {
      // Check if already at max points
      if (customer.points >= 10) {
        return res.status(400).json({
          error: 'Maximum points reached. You earned a free drink!',
          customer: {
            phone_number: customer.phone_number,
            points: customer.points,
            total_collected: customer.total_collected,
            can_redeem: true
          }
        });
      }

      // Update points
      await db.run('UPDATE customers SET points = points + 1 WHERE id = ?', customer.id);
      customer.points += 1;
    }

    // Record in point_history
    await db.run(
      'INSERT INTO point_history (phone_number, points_added, redeemed) VALUES (?, 1, 0)',
      phone_number
    );

    // Update rate limit store
    rateLimitStore.set(phone_number, { timestamp: Date.now() });

    // Send Telegram notification
    await sendTelegramNotification(phone_number, customer.points, customer.total_collected);

    res.json({
      message: customer.points >= 10 ? 'You earned a free drink!' : 'Thank you! Point collected!',
      customer: {
        phone_number: customer.phone_number,
        points: customer.points,
        total_collected: customer.total_collected,
        can_redeem: customer.points >= 10
      }
    });
  } catch (error) {
    console.error('Collect point error:', error);
    res.status(500).json({ error: 'Failed to collect point', details: error.message });
  }
});

// Get customer
app.get('/api/customer/:phone', async (req, res) => {
  const { phone } = req.params;

  try {
    const customer = await db.get('SELECT * FROM customers WHERE phone_number = ?', phone);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      customer: {
        phone_number: customer.phone_number,
        points: customer.points,
        total_collected: customer.total_collected,
        can_redeem: customer.points >= 10,
        created_at: customer.created_at
      }
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to fetch customer', details: error.message });
  }
});

// Redeem free drink
app.post('/api/redeem', apiLimiter, async (req, res) => {
  const { phone_number } = req.body;

  try {
    const customer = await db.get('SELECT * FROM customers WHERE phone_number = ?', phone_number);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (customer.points < 10) {
      return res.status(400).json({ error: 'Not enough points to redeem' });
    }

    // Reset points and increment total_collected
    await db.run(
      'UPDATE customers SET points = 0, total_collected = total_collected + 1 WHERE id = ?',
      customer.id
    );

    // Record redemption in history
    await db.run(
      'INSERT INTO point_history (phone_number, points_added, redeemed) VALUES (?, -10, 1)',
      phone_number
    );

    res.json({
      message: '🎉 Free drink redeemed! Enjoy your YANGCHAM!',
      customer: {
        phone_number: customer.phone_number,
        points: 0,
        total_collected: customer.total_collected + 1
      }
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({ error: 'Failed to redeem', details: error.message });
  }
});

// Get transaction history
app.get('/api/history', async (req, res) => {
  const { phone, limit = 100 } = req.query;

  try {
    let query = 'SELECT * FROM point_history ORDER BY timestamp DESC LIMIT ?';
    let params = [parseInt(limit)];

    if (phone) {
      query = 'SELECT * FROM point_history WHERE phone_number = ? ORDER BY timestamp DESC LIMIT ?';
      params = [phone, parseInt(limit)];
    }

    const history = await db.all(query, params);

    res.json({ history: history || [] });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history', details: error.message });
  }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.json({ token: 'admin-token', success: true });
});

// Get all customers (admin)
app.get('/api/admin/customers', async (req, res) => {
  const { search } = req.query;

  try {
    let query = 'SELECT * FROM customers ORDER BY created_at DESC';
    let params = [];

    if (search) {
      query = 'SELECT * FROM customers WHERE phone_number LIKE ? ORDER BY created_at DESC';
      params = [`%${search}%`];
    }

    const customers = await db.all(query, params);

    res.json({ customers: customers || [] });
  } catch (error) {
    console.error('Admin customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers', details: error.message });
  }
});

// Update customer (admin)
app.patch('/api/admin/customers/:phone', async (req, res) => {
  const { phone } = req.params;
  const { points, total_collected } = req.body;

  try {
    let updates = [];
    let params = [];
    
    if (points !== undefined) {
      updates.push('points = ?');
      params.push(points);
    }
    if (total_collected !== undefined) {
      updates.push('total_collected = ?');
      params.push(total_collected);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    params.push(phone);
    
    const query = `UPDATE customers SET ${updates.join(', ')} WHERE phone_number = ?`;
    await db.run(query, params);

    const updated = await db.get('SELECT * FROM customers WHERE phone_number = ?', phone);

    res.json({ customer: updated });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer', details: error.message });
  }
});

// Manual redeem (admin)
app.post('/api/admin/redeem', async (req, res) => {
  const { phone_number } = req.body;

  try {
    const customer = await db.get('SELECT * FROM customers WHERE phone_number = ?', phone_number);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await db.run(
      'UPDATE customers SET points = 0, total_collected = total_collected + 1 WHERE id = ?',
      customer.id
    );

    await db.run(
      'INSERT INTO point_history (phone_number, points_added, redeemed) VALUES (?, -10, 1)',
      phone_number
    );

    const updated = await db.get('SELECT * FROM customers WHERE phone_number = ?', phone_number);

    res.json({
      message: 'Free drink redeemed manually!',
      customer: updated
    });
  } catch (error) {
    console.error('Manual redeem error:', error);
    res.status(500).json({ error: 'Failed to redeem', details: error.message });
  }
});

// Initialize database and start server
async function startServer() {
  await initDb();
  
  app.listen(PORT, () => {
    console.log(`🚀 YANGCHAM Loyalty Server running on port ${PORT}`);
    console.log(`📱 QR Code URL: http://localhost:${PORT}/api/qr-code`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
