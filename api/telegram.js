// api/telegram.js — safe Vercel-compatible version (with extra logging)

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
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      isConnected = true;
      console.log('✅ MongoDB connected (Vercel)');
    } catch (err) {
      console.error('❌ MongoDB connection failed:', err);
      throw err;
    }
  }
}

function getBot() {
  if (!bot) {
    try {
      console.log('🤖 Initializing Telegram bot...');
      console.log('📛 Using bot token starts with:', process.env.BOT_TOKEN?.slice(0, 8));

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
    } catch (err) {
      console.error('❌ Error initializing bot:', err);
      throw err;
    }
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
    console.log('📩 Incoming Telegram POST update');
    await connectToDatabase();
    const botInstance = getBot();

    // Respond to Telegram immediately
    res.status(200).send('OK');

    // Process update after responding
    try {
      await botInstance.processUpdate(req.body);
      console.log('✅ Telegram update processed successfully');
    } catch (updateError) {
      console.error('❌ Error while processing Telegram update:', updateError);
    }
  } catch (error) {
    console.error('❌ Telegram bot handler error:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
}
