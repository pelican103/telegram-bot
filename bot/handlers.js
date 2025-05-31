// handlers.js (adds identity check logs and hardcoded message test)

import {
    normalizePhone,
    initializeTeachingLevels,
    initializeAvailability
  } from '../utils/helpers.js';
  
  import {
    formatTutorProfile,
    formatAssignment
  } from '../utils/format.js';
  
  import {
    getTeachingLevelMenu,
    getAvailabilityMenu,
    getEditProfileMenu,
    getGenderMenu,
    getRaceMenu,
    getHighestEducationMenu
  } from '../utils/menus.js';
  
  function safeSend(bot, chatId, text, options = {}) {
    console.log(`📤 Attempting to send message to ${chatId}:`, text.substring(0, 80));
    if (options?.reply_markup) {
      console.log(`📦 Reply markup:`, JSON.stringify(options.reply_markup));
    }
  
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.error(`⏱️ Timeout: sendMessage to ${chatId} took more than 10s`);
        reject(new Error('Send message timeout after 10 seconds'));
      }, 10000);
    });
  
    const sendPromise = bot.sendMessage(chatId, text, options)
      .then(result => {
        console.log(`✅ Message sent successfully to ${chatId}`);
        return result;
      })
      .catch(err => {
        console.error(`❌ Failed to send message to ${chatId}:`, err.message);
        console.error(`❌ Full error:`, err);
        throw err;
      });
  
    return Promise.race([sendPromise, timeoutPromise]);
  }
  
  function safeAnswer(bot, queryId, options = {}) {
    return bot.answerCallbackQuery(queryId, options).catch(err => {
      console.error(`❌ Failed to answer callback query:`, err.message);
    });
  }
  
  export default function registerHandlers(bot, context) {
    const {
      Tutor,
      Assignment,
      userSessions,
      adminPostingSessions,
      ADMIN_USERS,
      CHANNEL_ID
    } = context;
  
    console.log('🔧 Registering bot handlers...');
  
    bot.onText(/^\/start(?:\s+apply_(\w+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const assignmentId = match[1];
  
      try {
        userSessions[chatId] = { state: 'awaiting_contact', assignmentId };
        await safeSend(bot, chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
          reply_markup: {
            keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
            one_time_keyboard: true,
          },
        });
      } catch (error) {
        console.error('❌ Error in /start handler:', error);
        await safeSend(bot, chatId, 'Sorry, there was an error. Please try again.');
      }
    });
  
    bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      console.log('📞 Contact received from:', msg.from.id);
      console.log('📞 Contact object:', msg.contact);
  
      console.log('👤 contact.user_id:', msg.contact.user_id);
      console.log('👤 msg.from.id:', msg.from.id);
  
      try {
        const contactNumber = msg.contact.phone_number;
        const variations = normalizePhone(contactNumber);
        console.log('🔎 Phone search variations:', variations);
  
        const tutor = await Tutor.findOne({
          $or: variations.map(v => ({ contactNumber: { $regex: new RegExp(v, 'i') } }))
        });
  
        if (!tutor) {
          return safeSend(bot, chatId, 'Sorry, we could not find your registration. Would you like to register as a tutor?', {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Register Now', url: 'https://www.lioncitytutors.com/register-tutor' }],
                [{ text: 'Try Another Number', callback_data: 'start' }]
              ]
            }
          });
        }
  
        userSessions[chatId] = {
          state: 'verified',
          tutorId: tutor._id,
          assignmentId: userSessions[chatId]?.assignmentId
        };
  
        console.log('✅ Tutor found:', tutor._id);
        console.log('📨 About to send test message to:', chatId);
        console.log('📨 Session state:', userSessions[chatId]);
  
        try {
          // Hardcoded minimal message for verification
          await bot.sendMessage(812379368, '🧪 Manual test message inside contact handler');
          console.log('✅ Manual test message sent after contact');
        } catch (e) {
          console.error('❌ Failed to send hardcoded message:', e);
          await safeSend(bot, chatId, '⚠️ Error sending confirmation message.');
        }
      } catch (error) {
        console.error('❌ Error in contact handler:', error);
        await safeSend(bot, chatId, 'Sorry, there was an error verifying your profile.');
      }
    });
  
    console.log('✅ All bot handlers registered successfully');
  }
  