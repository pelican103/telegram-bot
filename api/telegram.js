// api/telegram.js

import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';
import registerHandlers from '../bot/handlers.js';

// Globals (safe across invocations in Vercel)
let bot = null;
let isConnected = false;

// In-memory session stores — will reset on cold start
const userSessions = {};
const adminPostingSessions = {};

// Validate required environment variables
const requiredEnvVars = ['BOT_TOKEN', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

const ADMIN_USERS = process.env.ADMIN_USERS
  ? process.env.ADMIN_USERS.split(',').map(u => u.trim())
  : [];

const CHANNEL_ID = process.env.CHANNEL_ID;

console.log('🔧 Environment check:');
console.log('- BOT_TOKEN:', process.env.BOT_TOKEN ? '✅ Set' : '❌ Missing');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
console.log('- ADMIN_USERS:', ADMIN_USERS.length > 0 ? `✅ ${ADMIN_USERS.length} users` : '⚠️ None set');
console.log('- CHANNEL_ID:', CHANNEL_ID ? '✅ Set' : '⚠️ Not set');
console.log('- DEBUG:', process.env.DEBUG || 'false');

// One-time DB connection
async function connectToDatabase() {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
      console.log('✅ MongoDB connected (Vercel)');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }
}

// One-time bot init
function getBot() {
  if (!bot) {
    try {
      console.log('🤖 Initializing Telegram bot...');
      bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

      // Test bot token by getting bot info
      bot.getMe().then(botInfo => {
        console.log('✅ Bot token valid. Bot info:', botInfo.username);
      }).catch(error => {
        console.error('❌ Invalid bot token:', error.message);
      });

      registerHandlers(bot, {
        Tutor,
        Assignment,
        userSessions,
        adminPostingSessions,
        ADMIN_USERS,
        CHANNEL_ID,
      });

      console.log('🤖 Bot initialized successfully');
    } catch (error) {
      console.error('❌ Bot initialization failed:', error);
      throw error;
    }
  }
  return bot;
}

// Main serverless endpoint
export default async function handler(req, res) {
    if (req.method === 'GET') {
      return res.status(200).send('✅ Telegram bot endpoint is deployed.');
    }
  
    if (req.method !== 'POST') {
      return res.status(404).send('Not found');
    }
  
    try {
      await connectToDatabase();
      const botInstance = getBot();
  
      // THIS MUST BE AWAITED DIRECTLY
      await botInstance.processUpdate(req.body);
  
      return res.status(200).send('OK');
    } catch (error) {
      console.error('❌ Telegram bot error:', error);
      return res.status(500).send('Internal Server Error');
    }
  }
  