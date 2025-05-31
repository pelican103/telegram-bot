// handlers.js (fixed version with proper error handling and single message handler)

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
    console.log(`📤 Attempting to send message to ${chatId}:`, text.substring(0, 50) + '...');
    return bot.sendMessage(chatId, text, options)
      .then(result => {
        console.log(`✅ Message sent successfully to ${chatId}`);
        return result;
      })
      .catch(err => {
        console.error(`❌ Failed to send message to ${chatId}:`, err.message);
        console.error(`❌ Full error:`, err);
        throw err; // Re-throw to see the error in the main handler
      });
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
    
    // Add debug logging
    console.log('🔧 Registering bot handlers...');
  
    bot.onText(/^\/start(?:\s+apply_(\w+))?/, async (msg, match) => {
      console.log('📝 /start command received:', msg.from.id);
      const chatId = msg.chat.id;
      const assignmentId = match[1];
      
      try {
        console.log('💾 Setting user session for:', chatId);
        userSessions[chatId] = { state: 'awaiting_contact', assignmentId };
        
        console.log('📤 Sending welcome message...');
        await safeSend(bot, chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
          reply_markup: {
            keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
            one_time_keyboard: true,
          },
        });
        console.log('✅ Welcome message sent successfully');
      } catch (error) {
        console.error('❌ Error in /start handler:', error);
        console.error('❌ Error details:', error.message);
        // Try to send a simple error message
        try {
          await bot.sendMessage(chatId, 'Sorry, there was an error. Please try again.');
        } catch (sendError) {
          console.error('❌ Could not send error message:', sendError.message);
        }
      }
    });
  
    bot.on('contact', async (msg) => {
      console.log('📞 Contact received from:', msg.from.id);
      const chatId = msg.chat.id;
      
      try {
        const contactNumber = msg.contact.phone_number;
        const variations = normalizePhone(contactNumber);
        const tutor = await Tutor.findOne({
          $or: variations.map(v => ({ contactNumber: { $regex: new RegExp(v, 'i') } }))
        });
  
        if (!tutor) {
          console.log('❌ Tutor not found for number:', contactNumber);
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
          tutorId: tutor._id,
          assignmentId: userSessions[chatId]?.assignmentId
        };
  
        const profileText = formatTutorProfile(tutor);
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
        await safeSend(bot, chatId, 'Sorry, there was an error processing your contact. Please try again.');
      }
    });
  
    bot.on('callback_query', async (query) => {
      console.log('🔘 Callback query received:', query.data, 'from:', query.from.id);
      const { data } = query;
      const chatId = query.message.chat.id;
      
      try {
        await safeAnswer(bot, query.id);
        
        // Handle start callback without session
        if (data === 'start') {
          userSessions[chatId] = { state: 'awaiting_contact' };
          return safeSend(bot, chatId, 'Please share your phone number to verify your profile.', {
            reply_markup: {
              keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
              one_time_keyboard: true,
            },
          });
        }
        
        const session = userSessions[chatId];
        if (!session) {
          console.log('❌ No session found for user:', chatId);
          return safeSend(bot, chatId, 'Please start over with /start');
        }
        
        const tutor = await Tutor.findById(session.tutorId);
        if (!tutor && data !== 'start') {
          console.log('❌ Tutor not found for session:', session.tutorId);
          return safeSend(bot, chatId, 'Please start over with /start');
        }
  
        if (data === 'profile_confirm') {
          userSessions[chatId].state = 'main_menu';
          if (session.assignmentId) {
            const assignment = await Assignment.findById(session.assignmentId);
            if (!assignment) return safeSend(bot, chatId, 'Assignment no longer exists.');
            if (!assignment.applicants.includes(tutor._id)) {
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
  
        if (data === 'profile_edit') return safeSend(bot, chatId, 'What would you like to edit?', { reply_markup: getEditProfileMenu(tutor) });
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
      } catch (error) {
        console.error('❌ Error in callback query handler:', error);
        await safeSend(bot, chatId, 'Sorry, there was an error. Please try again.');
      }
    });
  
    // SINGLE message handler for both regular users and admin posting
    bot.on('message', async (msg) => {
      console.log('📨 Message received:', msg.text, 'from:', msg.from.id);
      const chatId = msg.chat.id;
      
      try {
        // Skip if no text or is a command (except /post which we handle separately)
        if (!msg.text || (msg.text.startsWith('/') && !msg.text.startsWith('/post'))) return;
        
        // Handle admin posting flow
        if (adminPostingSessions[chatId]) {
          const session = adminPostingSessions[chatId];
          const step = session.step;
          const data = session.data;
          const prompt = (nextStep, question) => { 
            session.step = nextStep; 
            safeSend(bot, chatId, question); 
          };
  
          switch (step) {
            case 'title': data.title = msg.text; return prompt('description', 'Description?');
            case 'description': data.description = msg.text; return prompt('level', 'Level?');
            case 'level': data.level = msg.text; return prompt('subject', 'Subject?');
            case 'subject': data.subject = msg.text; return prompt('location', 'Location?');
            case 'location': data.location = msg.text; return prompt('rate', 'Hourly rate?');
            case 'rate': data.rate = msg.text; return prompt('startDate', 'Start date?');
            case 'startDate': data.startDate = msg.text; return prompt('requirements', 'Any requirements?');
            case 'requirements':
              data.requirements = msg.text;
              const assignment = new Assignment(data);
              await assignment.save();
              await safeSend(bot, CHANNEL_ID, formatAssignment(assignment), { parse_mode: 'Markdown' });
              await safeSend(bot, chatId, '✅ Assignment posted.');
              delete adminPostingSessions[chatId];
              break;
          }
          return;
        }
        
        // Handle regular user editing flow
        const session = userSessions[chatId];
        if (session && session.state === 'editing_field') {
          const tutor = await Tutor.findById(session.tutorId);
          if (!tutor) return safeSend(bot, chatId, 'Please start over with /start');
          
          tutor[session.editField] = msg.text;
          await tutor.save();
          userSessions[chatId].state = 'main_menu';
          await safeSend(bot, chatId, `✅ ${session.editField} updated.`, {
            reply_markup: getEditProfileMenu(tutor)
          });
        }
      } catch (error) {
        console.error('❌ Error in message handler:', error);
        await safeSend(bot, chatId, 'Sorry, there was an error processing your message.');
      }
    });
  
    bot.onText(/\/post/, (msg) => {
      console.log('📝 /post command received from:', msg.from.id);
      const chatId = msg.chat.id;
      
      try {
        if (!ADMIN_USERS.includes(String(msg.from.id))) {
          console.log('❌ Unauthorized post attempt from:', msg.from.id);
          return safeSend(bot, chatId, '🚫 You are not authorized to post assignments.');
        }
        adminPostingSessions[chatId] = { step: 'title', data: {} };
        safeSend(bot, chatId, "Let's post a new assignment! What is the assignment title?");
      } catch (error) {
        console.error('❌ Error in /post handler:', error);
      }
    });
    
    console.log('✅ All bot handlers registered successfully');
  }