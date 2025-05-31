// api/telegram.js — safe Vercel-compatible version

import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';
import registerHandlers from '../bot/handlers.js';

let bot = null;
let isConnected = false;

const userSessions = {};
const adminPostingSessions = {};
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(u => u.trim()) : [];
const CHANNEL_ID = process.env.CHANNEL_ID;

async function connectToDatabase() {
  if (!isConnected) {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected (Vercel)');
  }
}

function getBot() {
  if (!bot) {
    console.log('🤖 Initializing Telegram bot...');
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

    registerHandlers(bot, {
      Tutor,
      Assignment,
      userSessions,
      adminPostingSessions,
      ADMIN_USERS,
      CHANNEL_ID,
    });

    console.log('🤖 Bot initialized successfully');
  }
  return bot;
}

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

    // Respond to Telegram immediately
    res.status(200).send('OK');

    // Process update after response (fire-and-forget style)
    await botInstance.processUpdate(req.body);
  } catch (error) {
    console.error('❌ Telegram bot error:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
}
