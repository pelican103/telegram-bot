// handlers.js (extended to handle callback_query and improve tutor routing)

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

  return bot.sendMessage(chatId, text, options)
    .then(result => {
      console.log(`✅ Message sent successfully to ${chatId}`);
      return result;
    })
    .catch(err => {
      console.error(`❌ Failed to send message to ${chatId}:`, err.message);
      throw err;
    });
}

export async function handleUpdate(bot, context, update) {
  const {
    Tutor,
    userSessions
  } = context;

  if (update.message?.text === '/start') {
    const chatId = update.message.chat.id;
    userSessions[chatId] = { state: 'awaiting_contact' };
    return safeSend(bot, chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
      reply_markup: {
        keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
        one_time_keyboard: true,
      },
    });
  }

  if (update.message?.contact) {
    const msg = update.message;
    const chatId = msg.chat.id;
    console.log('📞 Contact received from:', msg.from.id);
    console.log('📞 Contact object:', msg.contact);
    console.log('👤 contact.user_id:', msg.contact.user_id);
    console.log('👤 msg.from.id:', msg.from.id);

    const contactNumber = msg.contact.phone_number;
    const variations = normalizePhone(contactNumber);
    console.log('🔎 Phone search variations:', variations);

    return Tutor.findOne({
      $or: variations.map(v => ({ contactNumber: { $regex: new RegExp(v, 'i') } }))
    }).then(tutor => {
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

      console.log('✅ Tutor found:', tutor._id);
      userSessions[chatId] = {
        state: 'verified',
        tutorId: tutor._id
      };

      const profileText = formatTutorProfile(tutor);
      return safeSend(bot, chatId, profileText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yes, use this profile', callback_data: 'profile_confirm' }],
            [{ text: 'No, I want to edit it', callback_data: 'profile_edit' }],
            [{ text: 'Back', callback_data: 'start' }]
          ]
        }
      });
    }).catch(err => {
      console.error('❌ Error in contact flow:', err);
      return safeSend(bot, chatId, '⚠️ Something went wrong. Please try again later.');
    });
  }

  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const data = query.data;
    const session = userSessions[chatId];

    if (!session || !session.tutorId) {
      console.warn('⚠️ Callback received with no session:', chatId);
      return safeSend(bot, chatId, 'Session expired. Please send /start again.');
    }

    const tutor = await Tutor.findById(session.tutorId);
    if (!tutor) {
      return safeSend(bot, chatId, 'Tutor not found. Please try again.');
    }

    if (data === 'profile_confirm') {
      userSessions[chatId].state = 'main_menu';
      return safeSend(bot, chatId, '✅ Profile confirmed! You can now view or apply for assignments.');
    }

    if (data === 'profile_edit') {
      return safeSend(bot, chatId, 'What would you like to edit?', {
        reply_markup: getEditProfileMenu(tutor)
      });
    }

    if (data === 'start') {
      userSessions[chatId] = { state: 'awaiting_contact' };
      return safeSend(bot, chatId, 'Please share your phone number again to verify your profile.', {
        reply_markup: {
          keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
          one_time_keyboard: true
        }
      });
    }

    return bot.answerCallbackQuery(query.id).catch(err => {
      console.error('❌ Failed to answer callback query:', err.message);
    });
  }

  console.log('ℹ️ No matching update handler for:', update);
  return Promise.resolve();
}

export default function registerHandlers(bot, context) {
  console.log('🔧 Bot handlers are set up (manual dispatch mode)');
}
