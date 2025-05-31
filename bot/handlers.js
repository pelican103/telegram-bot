// handlers.js

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
  
  export default function registerHandlers(bot, context) {
    const {
      Tutor,
      Assignment,
      userSessions,
      adminPostingSessions,
      ADMIN_USERS,
      CHANNEL_ID
    } = context;
  
    // === START ===
    bot.onText(/^\/start(?:\s+apply_(\w+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const assignmentId = match[1];
  
      userSessions[chatId] = { state: 'awaiting_contact', assignmentId };
  
      bot.sendMessage(chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
        reply_markup: {
          keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
          one_time_keyboard: true,
        },
      });
    });
  
    // === CONTACT ===
    bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const contactNumber = msg.contact.phone_number;
      const variations = normalizePhone(contactNumber);
  
      const tutor = await Tutor.findOne({
        $or: variations.map(v => ({ contactNumber: { $regex: new RegExp(v, 'i') } }))
      });
  
      if (!tutor) {
        return bot.sendMessage(chatId, 'Sorry, we could not find your registration. Would you like to register as a tutor?', {
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
  
      const profileText = formatTutorProfile(tutor);
  
      await bot.sendMessage(chatId, profileText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yes, use this profile', callback_data: 'profile_confirm' }],
            [{ text: 'No, I want to edit it', callback_data: 'profile_edit' }],
            [{ text: 'Back', callback_data: 'start' }]
          ]
        }
      });
    });
  
    // === CALLBACK QUERIES ===
    bot.on('callback_query', async (query) => {
      const { data } = query;
      const chatId = query.message.chat.id;
      await bot.answerCallbackQuery(query.id);
  
      const session = userSessions[chatId];
      if (!session) return;
  
      const tutor = await Tutor.findById(session.tutorId);
      if (!tutor) return;
  
      // === MAIN MENU ===
      if (data === 'profile_confirm') {
        userSessions[chatId].state = 'main_menu';
  
        // Apply to assignment if applicable
        if (session.assignmentId) {
          const assignment = await Assignment.findById(session.assignmentId);
          if (!assignment) {
            return bot.sendMessage(chatId, 'Assignment no longer exists.');
          }
  
          if (!assignment.applicants.includes(tutor._id)) {
            assignment.applicants.push(tutor._id);
            await assignment.save();
          }
  
          bot.sendMessage(chatId, '✅ You have applied for the assignment.');
          return;
        }
  
        return bot.sendMessage(chatId, '✅ Profile confirmed. What would you like to do?', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'View Assignments', callback_data: 'view_assignments' }],
              [{ text: 'View My Applications', callback_data: 'view_applications' }]
            ]
          }
        });
      }
  
      if (data === 'profile_edit') {
        return bot.sendMessage(chatId, 'What would you like to edit?', {
          reply_markup: getEditProfileMenu(tutor)
        });
      }
  
      // === Edit basic fields ===
      if (data.startsWith('edit_')) {
        const field = data.replace('edit_', '');
        userSessions[chatId].state = 'editing_field';
        userSessions[chatId].editField = field;
        return bot.sendMessage(chatId, `Please enter your new ${field}:`);
      }
  
      // === Set gender, race, education ===
      if (data === 'set_gender_menu') return bot.sendMessage(chatId, 'Select gender:', { reply_markup: getGenderMenu() });
      if (data === 'set_race_menu') return bot.sendMessage(chatId, 'Select race:', { reply_markup: getRaceMenu() });
      if (data === 'set_education_menu') return bot.sendMessage(chatId, 'Select education level:', { reply_markup: getHighestEducationMenu() });
  
      if (data.startsWith('set_gender_')) {
        tutor.gender = data.replace('set_gender_', '');
        await tutor.save();
        return bot.sendMessage(chatId, '✅ Gender updated.', { reply_markup: getEditProfileMenu(tutor) });
      }
  
      if (data.startsWith('set_race_')) {
        tutor.race = data.replace('set_race_', '');
        await tutor.save();
        return bot.sendMessage(chatId, '✅ Race updated.', { reply_markup: getEditProfileMenu(tutor) });
      }
  
      if (data.startsWith('set_education_')) {
        tutor.education = data.replace('set_education_', '');
        await tutor.save();
        return bot.sendMessage(chatId, '✅ Education updated.', { reply_markup: getEditProfileMenu(tutor) });
      }
  
      // === Teaching levels and availability toggles ===
      if (data === 'edit_teachingLevels') {
        initializeTeachingLevels(tutor);
        await tutor.save();
        return bot.sendMessage(chatId, 'Toggle teaching levels:', {
          reply_markup: getTeachingLevelMenu(tutor)
        });
      }
  
      if (data.startsWith('toggle_')) {
        const field = data.replace('toggle_', '');
        if (tutor.teachingLevels?.[field] !== undefined) {
          tutor.teachingLevels[field] = !tutor.teachingLevels[field];
        } else if (tutor.availability?.[field] !== undefined) {
          tutor.availability[field] = !tutor.availability[field];
        }
        await tutor.save();
  
        if (data.includes('primary') || data.includes('jc')) {
          return bot.sendMessage(chatId, 'Updated:', {
            reply_markup: getTeachingLevelMenu(tutor)
          });
        } else {
          return bot.sendMessage(chatId, 'Updated:', {
            reply_markup: getAvailabilityMenu(tutor)
          });
        }
      }
  
      if (data === 'edit_availability') {
        initializeAvailability(tutor);
        await tutor.save();
        return bot.sendMessage(chatId, 'Toggle availability:', {
          reply_markup: getAvailabilityMenu(tutor)
        });
      }
  
      if (data === 'view_assignments') {
        const assignments = await Assignment.find({ status: 'Open' }).sort({ createdAt: -1 }).limit(10);
        if (!assignments.length) return bot.sendMessage(chatId, 'No assignments currently available.');
  
        for (const a of assignments) {
          await bot.sendMessage(chatId, formatAssignment(a), {
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
        if (!assignment) return bot.sendMessage(chatId, 'Assignment not found.');
  
        if (!assignment.applicants.includes(tutor._id)) {
          assignment.applicants.push(tutor._id);
          await assignment.save();
          return bot.sendMessage(chatId, '✅ You have applied for this assignment.');
        } else {
          return bot.sendMessage(chatId, 'You already applied.');
        }
      }
  
      if (data === 'view_applications') {
        const assignments = await Assignment.find({ applicants: tutor._id }).sort({ createdAt: -1 });
        if (!assignments.length) return bot.sendMessage(chatId, 'You have not applied for any assignments yet.');
  
        for (const a of assignments) {
          await bot.sendMessage(chatId, `📝 ${a.title} (${a.subject} - ${a.level})\nStatus: ${a.status}`);
        }
      }
    });
  
    // === HANDLE EDIT TEXT FIELDS ===
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const session = userSessions[chatId];
  
      if (!session || !msg.text || msg.text.startsWith('/')) return;
  
      if (session.state === 'editing_field') {
        const tutor = await Tutor.findById(session.tutorId);
        tutor[session.editField] = msg.text;
        await tutor.save();
  
        userSessions[chatId].state = 'main_menu';
        bot.sendMessage(chatId, `✅ ${session.editField} updated.`, {
          reply_markup: getEditProfileMenu(tutor)
        });
      }
    });
  
    // === ADMIN: POST ASSIGNMENT ===
    bot.onText(/\/post/, (msg) => {
      const chatId = msg.chat.id;
      if (!ADMIN_USERS.includes(String(msg.from.id))) {
        return bot.sendMessage(chatId, '🚫 You are not authorized to post assignments.');
      }
  
      adminPostingSessions[chatId] = { step: 'title', data: {} };
      bot.sendMessage(chatId, "Let's post a new assignment! What is the assignment title?");
    });
  
    // === ADMIN POST FLOW ===
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      if (!adminPostingSessions[chatId] || !msg.text || msg.text.startsWith('/')) return;
  
      const session = adminPostingSessions[chatId];
      const step = session.step;
      const data = session.data;
  
      switch (step) {
        case 'title': data.title = msg.text; session.step = 'description'; return bot.sendMessage(chatId, 'Description?');
        case 'description': data.description = msg.text; session.step = 'level'; return bot.sendMessage(chatId, 'Level?');
        case 'level': data.level = msg.text; session.step = 'subject'; return bot.sendMessage(chatId, 'Subject?');
        case 'subject': data.subject = msg.text; session.step = 'location'; return bot.sendMessage(chatId, 'Location?');
        case 'location': data.location = msg.text; session.step = 'rate'; return bot.sendMessage(chatId, 'Hourly rate?');
        case 'rate': data.rate = msg.text; session.step = 'startDate'; return bot.sendMessage(chatId, 'Start date?');
        case 'startDate': data.startDate = msg.text; session.step = 'requirements'; return bot.sendMessage(chatId, 'Any requirements?');
        case 'requirements':
          data.requirements = msg.text;
          const assignment = new Assignment(data);
          await assignment.save();
  
          const caption = formatAssignment(assignment);
          await bot.sendMessage(CHANNEL_ID, caption, { parse_mode: 'Markdown' });
          await bot.sendMessage(chatId, '✅ Assignment posted.');
          delete adminPostingSessions[chatId];
          break;
      }
    });
  }
  