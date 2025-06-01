import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';

let bot = null;
let isConnected = false;
let handlers = null;

const userSessions = {};
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(id => id.trim()) : [];
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME;

// Connect to MongoDB
async function connectToDatabase() {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
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

// Initialize Telegram bot
function getBot() {
  if (!bot) {
    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN environment variable is required');
    }
    console.log('🤖 Initializing Telegram bot...');
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    console.log('📛 Using bot token starts with:', process.env.BOT_TOKEN?.slice(0, 8));
    console.log('🤖 Bot initialized successfully');
  }
  return bot;
}

// Load handlers dynamically
async function loadHandlers() {
  if (!handlers) {
    const handlersModule = await import('../bot/handlers.js');
    handlers = handlersModule; // not .default because handlers.js uses named exports
    console.log('✅ Handlers loaded successfully');
  }
  return handlers;
}

// Handle update from Telegram
async function handleUpdate(botInstance, context, update) {
  const handlers = await loadHandlers();

  if (update.message) {
    await handleMessage(botInstance, context, update.message, handlers);
  } else if (update.callback_query) {
    await handleCallbackQuery(botInstance, context, update.callback_query, handlers);
  }
}

// Minimal versions of handlers (you may keep your full versions)
async function handleMessage(bot, context, message, handlers) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;

  if (message.contact) {
    await handlers.handleContact(bot, chatId, userId, message.contact, Tutor, userSessions, ADMIN_USERS);
  } else if (text?.startsWith('/start')) {
    const startParam = text.split(' ')[1];
    await handlers.handleStart(bot, chatId, userId, Tutor, userSessions, startParam);
  } else {
    await handlers.safeSend(bot, chatId, 'Please use the menu or type /start.');
  }
}

async function handleCallbackQuery(bot, context, callbackQuery, handlers) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;

  await bot.answerCallbackQuery(callbackQuery.id);

  if (data === 'main_menu') {
    await handlers.showMainMenu(chatId, bot, userId, ADMIN_USERS);
  } else {
    await handlers.safeSend(bot, chatId, 'Action not implemented.');
  }
}

// Exported Vercel API handler
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('🌐 Webhook triggered');

    await connectToDatabase();
    const botInstance = getBot();
    const update = req.body;

    const context = {
      Tutor,
      Assignment,
      userSessions,
      ADMIN_USERS,
      CHANNEL_ID,
      BOT_USERNAME
    };

    await handleUpdate(botInstance, context, update);

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
