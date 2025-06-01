import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';
import { handleUpdate } from '../bot/handlers.js';

let bot = null;
let isConnected = false;

const userSessions = {};
const adminPostingSessions = {};
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(id => id.trim()) : [];
const CHANNEL_ID = process.env.CHANNEL_ID;

async function connectToDatabase() {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        // Add connection options for better reliability
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log('✅ MongoDB connected (Vercel)');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }
}

function getBot() {
  if (!bot) {
    console.log('🤖 Initializing Telegram bot...');
    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN environment variable is required');
    }
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    console.log('📛 Using bot token starts with:', process.env.BOT_TOKEN?.slice(0, 8));
    console.log('🤖 Bot initialized successfully');
  }
  return bot;
}

export default async function handler(req, res) {
  // Handle GET requests (for health checks)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'active', 
      message: 'Telegram bot endpoint is deployed',
      timestamp: new Date().toISOString()
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📩 Incoming Telegram POST update');
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      console.log('⚠️ Invalid request body received');
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Connect to database
    await connectToDatabase();
    
    // Get bot instance
    const botInstance = getBot();

    // Create context object
    const context = {
      Tutor,
      Assignment,
      userSessions,
      adminPostingSessions,
      ADMIN_USERS,
      CHANNEL_ID
    };

    // Handle the update
    await handleUpdate(botInstance, context, req.body);

    // Respond to Telegram
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    console.error('❌ Telegram bot error:', error);
    
    // Don't expose internal errors to Telegram
    res.status(200).json({ status: 'error_handled' });
  }
}