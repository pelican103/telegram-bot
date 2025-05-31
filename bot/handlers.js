// handlers.js (full version with logging, error handling, and diagnostics)

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
  
        let profileText;
        try {
          profileText = formatTutorProfile(tutor);
          console.log('📄 Formatted profile:', profileText.substring(0, 120));
        } catch (e) {
          console.error('❌ Error formatting profile:', e);
          profileText = 'Error formatting profile. Please try again.';
        }
  
        await safeSend(bot, chatId, profileText, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Yes, use this profile', callback_data: 'profile_confirm' }],
              [{ text: 'No, I want to edit it', callback_data: 'profile_edit' }],
              [{ text: 'Back', callback_data: 'start' }]
            ]
          }
        });
      } catch (error) {
        console.error('❌ Error in contact handler:', error);
        await safeSend(bot, chatId, 'Sorry, there was an error verifying your profile.');
      }
    });
  
    bot.on('callback_query', async (query) => {
      const { data } = query;
      const chatId = query.message.chat.id;
      await safeAnswer(bot, query.id);
  
      const session = userSessions[chatId];
      if (!session && data !== 'start') return;
  
      const tutor = session?.tutorId ? await Tutor.findById(session.tutorId) : null;
  
      if (data === 'start') {
        userSessions[chatId] = { state: 'awaiting_contact' };
        return safeSend(bot, chatId, 'Please share your phone number again.', {
          reply_markup: {
            keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
            one_time_keyboard: true,
          },
        });
      }
  
      if (data === 'profile_confirm') {
        userSessions[chatId].state = 'main_menu';
        if (session.assignmentId) {
          const assignment = await Assignment.findById(session.assignmentId);
          if (assignment && !assignment.applicants.includes(tutor._id)) {
            assignment.applicants.push(tutor._id);
            await assignment.save();
          }
          return safeSend(bot, chatId, '✅ You have applied for the assignment.');
        }
        return safeSend(bot, chatId, '✅ Profile confirmed. What would you like to do?', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'View Assignments', callback_data: 'view_assignments' }],
              [{ text: 'View My Applications', callback_data: 'view_applications' }]
            ]
          }
        });
      }
  
      if (data === 'profile_edit') {
        return safeSend(bot, chatId, 'What would you like to edit?', {
          reply_markup: getEditProfileMenu(tutor)
        });
      }
  
      if (data.startsWith('edit_')) {
        const field = data.replace('edit_', '');
        userSessions[chatId].state = 'editing_field';
        userSessions[chatId].editField = field;
        return safeSend(bot, chatId, `Please enter your new ${field}:`);
      }
  
      if (data === 'set_gender_menu') return safeSend(bot, chatId, 'Select gender:', { reply_markup: getGenderMenu() });
      if (data === 'set_race_menu') return safeSend(bot, chatId, 'Select race:', { reply_markup: getRaceMenu() });
      if (data === 'set_education_menu') return safeSend(bot, chatId, 'Select education level:', { reply_markup: getHighestEducationMenu() });
  
      if (data.startsWith('set_gender_')) {
        tutor.gender = data.replace('set_gender_', '');
        await tutor.save();
        return safeSend(bot, chatId, '✅ Gender updated.', { reply_markup: getEditProfileMenu(tutor) });
      }
      if (data.startsWith('set_race_')) {
        tutor.race = data.replace('set_race_', '');
        await tutor.save();
        return safeSend(bot, chatId, '✅ Race updated.', { reply_markup: getEditProfileMenu(tutor) });
      }
      if (data.startsWith('set_education_')) {
        tutor.education = data.replace('set_education_', '');
        await tutor.save();
        return safeSend(bot, chatId, '✅ Education updated.', { reply_markup: getEditProfileMenu(tutor) });
      }
  
      if (data === 'edit_teachingLevels') {
        initializeTeachingLevels(tutor);
        await tutor.save();
        return safeSend(bot, chatId, 'Toggle teaching levels:', { reply_markup: getTeachingLevelMenu(tutor) });
      }
  
      if (data === 'edit_availability') {
        initializeAvailability(tutor);
        await tutor.save();
        return safeSend(bot, chatId, 'Toggle availability:', { reply_markup: getAvailabilityMenu(tutor) });
      }
  
      if (data.startsWith('toggle_')) {
        const field = data.replace('toggle_', '');
        if (tutor.teachingLevels?.[field] !== undefined) tutor.teachingLevels[field] = !tutor.teachingLevels[field];
        else if (tutor.availability?.[field] !== undefined) tutor.availability[field] = !tutor.availability[field];
        await tutor.save();
        const menu = data.includes('primary') || data.includes('jc') ? getTeachingLevelMenu(tutor) : getAvailabilityMenu(tutor);
        return safeSend(bot, chatId, 'Updated:', { reply_markup: menu });
      }
  
      if (data === 'view_assignments') {
        const assignments = await Assignment.find({ status: 'Open' }).sort({ createdAt: -1 }).limit(10);
        if (!assignments.length) return safeSend(bot, chatId, 'No assignments currently available.');
        for (const a of assignments) {
          await safeSend(bot, chatId, formatAssignment(a), {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: 'Apply', callback_data: `apply_${a._id}` }]]
            }
          });
        }
      }
  
      if (data.startsWith('apply_')) {
        const id = data.replace('apply_', '');
        const assignment = await Assignment.findById(id);
        if (!assignment) return safeSend(bot, chatId, 'Assignment not found.');
        if (!assignment.applicants.includes(tutor._id)) {
          assignment.applicants.push(tutor._id);
          await assignment.save();
          return safeSend(bot, chatId, '✅ You have applied for this assignment.');
        }
        return safeSend(bot, chatId, 'You already applied.');
      }
  
      if (data === 'view_applications') {
        const assignments = await Assignment.find({ applicants: tutor._id }).sort({ createdAt: -1 });
        if (!assignments.length) return safeSend(bot, chatId, 'You have not applied for any assignments yet.');
        for (const a of assignments) {
          await safeSend(bot, chatId, `📝 ${a.title} (${a.subject} - ${a.level})\nStatus: ${a.status}`);
        }
      }
    });
  
    bot.onText(/\/post/, (msg) => {
      const chatId = msg.chat.id;
      if (!ADMIN_USERS.includes(String(msg.from.id))) {
        return safeSend(bot, chatId, '🚫 You are not authorized to post assignments.');
      }
      adminPostingSessions[chatId] = { step: 'title', data: {} };
      safeSend(bot, chatId, "Let's post a new assignment! What is the assignment title?");
    });
  
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const session = userSessions[chatId];
      if (!msg.text || msg.text.startsWith('/')) return;
  
      if (session?.state === 'editing_field') {
        const tutor = await Tutor.findById(session.tutorId);
        if (!tutor) return safeSend(bot, chatId, 'Please start over with /start');
        tutor[session.editField] = msg.text;
        await tutor.save();
        userSessions[chatId].state = 'main_menu';
        return safeSend(bot, chatId, `✅ ${session.editField} updated.`, {
          reply_markup: getEditProfileMenu(tutor)
        });
      }
  
      if (adminPostingSessions[chatId]) {
        const s = adminPostingSessions[chatId];
        const d = s.data;
        const next = (step, q) => { s.step = step; safeSend(bot, chatId, q); };
  
        switch (s.step) {
          case 'title': d.title = msg.text; return next('description', 'Description?');
          case 'description': d.description = msg.text; return next('level', 'Level?');
          case 'level': d.level = msg.text; return next('subject', 'Subject?');
          case 'subject': d.subject = msg.text; return next('location', 'Location?');
          case 'location': d.location = msg.text; return next('rate', 'Hourly rate?');
          case 'rate': d.rate = msg.text; return next('startDate', 'Start date?');
          case 'startDate': d.startDate = msg.text; return next('requirements', 'Any requirements?');
          case 'requirements':
            d.requirements = msg.text;
            const assignment = new Assignment(d);
            await assignment.save();
            await safeSend(bot, CHANNEL_ID, formatAssignment(assignment), { parse_mode: 'Markdown' });
            await safeSend(bot, chatId, '✅ Assignment posted.');
            delete adminPostingSessions[chatId];
            break;
        }
      }
    });
  
    console.log('✅ All bot handlers registered successfully');
  }
  