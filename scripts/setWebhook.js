require('dotenv').config(); // If using .env file

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_URL = 'https://telegram-bot-pied-chi.vercel.app/api/telegram';

async function setWebhook() {
  const res = await fetch(`https://api.telegram.org/bot7595529103:AAGlZ3U-bykAcuVp0yoE4yGqfDNr9k1n4fw/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ url: WEBHOOK_URL })
  });

  const data = await res.json();
  console.log('📡 Webhook set response:', data);
}

setWebhook().catch(console.error);
