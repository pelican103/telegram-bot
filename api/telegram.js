// Try this import instead
import TelegramBot from 'node-telegram-bot-api';
// OR
// const TelegramBot = require('node-telegram-bot-api');

import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';

let bot = null;
let isConnected = false;
let handlers = null;

const userSessions = {};
const ADMIN_USERS = process.env.ADMIN_USERS?.split(',').map(id => id.trim()) || [];
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME;

// DB connection
async function connectToDatabase() {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      });
      isConnected = true;
      console.log('✅ MongoDB connected (Vercel)');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }
}

// Bot init with better error handling
function getBot() {
  if (!bot) {
    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN environment variable is required');
    }
    
    console.log('🤖 Initializing Telegram bot...');
    console.log('📛 Using bot token starting with:', process.env.BOT_TOKEN.slice(0, 8));
    
    try {
      bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
      console.log('✅ Bot initialized successfully');
      
      // Test if bot has sendMessage method
      if (typeof bot.sendMessage !== 'function') {
        console.error('❌ Bot does not have sendMessage method');
        console.error('Bot methods:', Object.getOwnPropertyNames(bot));
        throw new Error('Bot initialization failed - sendMessage method missing');
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize bot:', error);
      throw error;
    }
  }
  return bot;
}

// Load handlers dynamically
async function loadHandlers() {
  if (!handlers) {
    try {
      const handlersModule = await import('../bot/handlers.js');
      handlers = handlersModule;
      console.log('✅ Handlers loaded');
    } catch (error) {
      console.error('❌ Failed to load handlers:', error);
      throw error;
    }
  }
  return handlers;
}

// Webhook update handler
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('🌐 Webhook triggered');

    await connectToDatabase();
    const botInstance = getBot();
    const handlers = await loadHandlers();
    const update = req.body;

    // Add debug logging
    console.log('🔍 Bot instance type:', typeof botInstance);
    console.log('🔍 Bot has sendMessage:', typeof botInstance.sendMessage);

    const context = {
      Tutor,
      Assignment,
      userSessions,
      ADMIN_USERS,
      CHANNEL_ID,
      BOT_USERNAME
    };

    if (update.message) {
      const { chat, from, text } = update.message;
      await handlers.handleMessage(
        botInstance,
        chat.id,
        from.id,
        text,
        update.message,
        Tutor,
        Assignment,
        userSessions,
        ADMIN_USERS
      );
    } else if (update.callback_query) {
      const { message, from, data } = update.callback_query;
      await botInstance.answerCallbackQuery(update.callback_query.id);
      await handlers.handleCallbackQuery(
        botInstance,
        message.chat.id,
        from.id,
        data,
        Assignment,
        Tutor,
        userSessions,
        ADMIN_USERS,
        CHANNEL_ID,
        BOT_USERNAME
      );
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('❌ Webhook error:', err);
    return res.status(500).json({ error: 'Internal Server Error', message: err.message });
  }
}