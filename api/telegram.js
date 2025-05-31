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

const ADMIN_USERS = process.env.ADMIN_USERS
  ? process.env.ADMIN_USERS.split(',').map(u => u.trim())
  : [];

const CHANNEL_ID = process.env.CHANNEL_ID;

// One-time DB connection
async function connectToDatabase() {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected (Vercel)');
  }
}

// One-time bot init
function getBot() {
  if (!bot) {
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

    registerHandlers(bot, {
      Tutor,
      Assignment,
      userSessions,
      adminPostingSessions,
      ADMIN_USERS,
      CHANNEL_ID,
    });

    console.log('🤖 Bot initialized');
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
    if (process.env.DEBUG === 'true') {
      console.log("📩 Incoming Telegram update:", JSON.stringify(req.body, null, 2));
    }

    await connectToDatabase();
    const botInstance = getBot();

    await botInstance.processUpdate(req.body); // Pass Telegram update to bot

    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Telegram bot error:', error);
    res.status(500).send('Internal Server Error');
  }
}
