import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import TelegramBot from 'node-telegram-bot-api';
import QRCode from 'qrcode';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase initialized');
} else {
  console.warn('⚠️ Supabase credentials not found');
}
const bot = process.env.TELEGRAM_BOT_TOKEN 
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false })
  : null;

// Middleware
app.use(cors({
  origin: ['https://chayangchamloyalty.netlify.app', 'https://yangchamloyalty.netlify.app', 'https://magnificent-gecko-906e38.netlify.app', 'https://heartfelt-gecko-05f286.netlify.app', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
    const baseUrl = process.env.FRONTEND_URL || 'https://chayangchamloyalty.netlify.app/';
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
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let customer;

    if (!existingCustomer) {
      // Create new customer
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({ phone_number, points: 1, total_collected: 0 })
        .select()
        .single();
      
      if (insertError) throw insertError;
      customer = newCustomer;
    } else {
      customer = existingCustomer;
      
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
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({ points: customer.points + 1 })
        .eq('phone_number', phone_number)
        .select()
        .single();
      
      if (updateError) throw updateError;
      customer = updatedCustomer;
    }

    // Record in point_history
    const { error: historyError } = await supabase
      .from('point_history')
      .insert({ phone_number, points_added: 1, redeemed: false });
    
    if (historyError) throw historyError;

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
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phone)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (error) throw error;

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
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (fetchError) throw fetchError;

    if (customer.points < 10) {
      return res.status(400).json({ error: 'Not enough points to redeem' });
    }

    // Reset points and increment total_collected
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({ points: 0, total_collected: customer.total_collected + 1 })
      .eq('phone_number', phone_number)
      .select()
      .single();
    
    if (updateError) throw updateError;

    // Record redemption in history
    const { error: historyError } = await supabase
      .from('point_history')
      .insert({ phone_number, points_added: -10, redeemed: true });
    
    if (historyError) throw historyError;

    res.json({
      message: '🎉 Free drink redeemed! Enjoy your YANGCHAM!',
      customer: {
        phone_number: updatedCustomer.phone_number,
        points: updatedCustomer.points,
        total_collected: updatedCustomer.total_collected
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
    let query = supabase
      .from('point_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(parseInt(limit));

    if (phone) {
      query = query.eq('phone_number', phone);
    }

    const { data: history, error } = await query;

    if (error) throw error;

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
    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('phone_number', `%${search}%`);
    }

    const { data: customers, error } = await query;

    if (error) throw error;

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
    const updates = {};
    if (points !== undefined) updates.points = points;
    if (total_collected !== undefined) updates.total_collected = total_collected;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    const { data: updated, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('phone_number', phone)
      .select()
      .single();

    if (error) throw error;

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
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (fetchError) throw fetchError;

    const { data: updated, error: updateError } = await supabase
      .from('customers')
      .update({ points: 0, total_collected: customer.total_collected + 1 })
      .eq('phone_number', phone_number)
      .select()
      .single();
    
    if (updateError) throw updateError;

    const { error: historyError } = await supabase
      .from('point_history')
      .insert({ phone_number, points_added: -10, redeemed: true });
    
    if (historyError) throw historyError;

    res.json({
      message: 'Free drink redeemed manually!',
      customer: updated
    });
  } catch (error) {
    console.error('Manual redeem error:', error);
    res.status(500).json({ error: 'Failed to redeem', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 YANGCHAM Loyalty Server running on port ${PORT}`);
  console.log(`📱 QR Code URL: http://localhost:${PORT}/api/qr-code`);
});

export default app;
