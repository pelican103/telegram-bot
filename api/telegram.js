import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';
import registerHandlers from '../bot/handlers.js';

let bot = null;
let isConnected = false;

const userSessions = {};
const adminPostingSessions = {};
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
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
    console.log('📛 Using bot token starts with:', process.env.BOT_TOKEN?.slice(0, 8));
    registerHandlers(bot, {
      Tutor,
      Assignment,
      userSessions,
      ADMIN_USERS,
      adminPostingSessions,
      CHANNEL_ID
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
    console.log('📩 Incoming Telegram POST update');
    await connectToDatabase();
    const botInstance = getBot();
    await botInstance.processUpdate(req.body);
    console.log('✅ Telegram update processed successfully');
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Telegram bot error:', error);
    res.status(500).send('Internal Server Error');
  }
}
