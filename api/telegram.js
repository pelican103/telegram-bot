import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';
import registerHandlers from '../bot/handlers.js';

let bot = null;
let isConnected = false;

// These will reset on each invocation in Vercel - consider using a database for persistence
const userSessions = {};
const adminPostingSessions = {};
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
const CHANNEL_ID = process.env.CHANNEL_ID;

// Connect to MongoDB once
async function connectToDatabase() {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log('✅ MongoDB connected (Vercel)');
  }
}

// Init bot once globally (between invocations)
function getBot() {
  if (!bot) {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    registerHandlers(bot, {
      Tutor,
      Assignment,
      userSessions,
      ADMIN_USERS,
      adminPostingSessions,
      CHANNEL_ID,
    });
  }
  return bot;
}

// Exported Vercel serverless function
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(404).send('Not found');
  }

  try {
    await connectToDatabase();
    const botInstance = getBot();
    await botInstance.processUpdate(req.body);
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Telegram bot error:', error);
    res.status(500).send('Internal Server Error');
  }
}