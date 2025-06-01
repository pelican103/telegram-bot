// handlers.js - Enhanced bot functionality with comprehensive features

import {
  normalizePhone,
  initializeTeachingLevels,
  initializeAvailability,
  getTick,
  paginate
} from '../utils/helpers.js';

import {
  formatTutorProfile,
  formatAssignment
} from '../utils/format.js';

import {
  getEditProfileMenu,
  getPersonalInfoMenu,
  getTeachingLevelMenu,
  getAvailabilityMenu,
  getLocationsMenu,
  getHourlyRateMenu,
  getGenderMenu,
  getRaceMenu,
  getHighestEducationMenu,
  getPrimarySubjectsMenu,
  getSecondarySubjectsMenu,
  getJCSubjectsMenu,
  getInternationalSubjectsMenu,
  getSubjectMenu,
  getLevelFilterMenu,
  getScheduleFilterMenu,
  getStudentCountMenu,
  getTutorRequirementsMenu,
  getGenderRequirementsMenu,
  getRaceRequirementsMenu,
  getExperienceRequirementsMenu,
  getQualificationsRequirementsMenu,
  getAssignmentFilterMenu
} from '../utils/menus.js';

const ITEMS_PER_PAGE = 5;

// Safe send function with enhanced logging
function safeSend(bot, chatId, text, options = {}) {
  console.log(`📤 Sending to ${chatId}:`, text.substring(0, 80));
  if (options?.reply_markup) {
    console.log(`📦 Reply markup:`, JSON.stringify(options.reply_markup, null, 2));
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

// Main menu function
function showMainMenu(chatId, bot) {
  return safeSend(bot, chatId, 'Main Menu - What would you like to do?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📋 View Available Assignments', callback_data: 'view_assignments' }],
        [{ text: '📝 My Applications', callback_data: 'view_applications' }],
        [{ text: '👤 Update Profile', callback_data: 'profile_edit' }]
      ]
    }
  });
}

// Assignment pagination with enhanced error handling
async function showAssignments(chatId, bot, Assignment, userSessions, page = 1) {
  try {
    const query = { status: 'Open' };
    const totalAssignments = await Assignment.countDocuments(query);
    const totalPages = Math.ceil(totalAssignments / ITEMS_PER_PAGE) || 1;
    
    page = Math.max(1, Math.min(page, totalPages));
    
    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    
    if (assignments.length === 0) {
      return safeSend(bot, chatId, 'No assignments available at the moment.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Back to Main Menu', callback_data: 'main_menu' }]]
        }
      });
    }
    
    await safeSend(bot, chatId, `Showing assignments ${(page - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(page * ITEMS_PER_PAGE, totalAssignments)} of ${totalAssignments}`);
    
    for (const assignment of assignments) {
      const msg = formatAssignment(assignment);
      const hasApplied = userSessions[chatId] && 
        assignment.applicants?.some(applicant => 
          applicant.tutorId.toString() === userSessions[chatId].tutorId.toString());
      
      const keyboard = [
        ...(assignment.status === 'Open' && !hasApplied ? [[{ text: '✅ Apply', callback_data: `apply_${assignment._id}` }]] : []),
        ...(hasApplied ? [[{ text: '📋 Already Applied', callback_data: `view_application_${assignment._id}` }]] : [])
      ];
      
      await safeSend(bot, chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    }
    
    const paginationKeyboard = [];
    if (page > 1) {
      paginationKeyboard.push({ text: '◀️ Previous', callback_data: `assignments_page_${page - 1}` });
    }
    if (page < totalPages) {
      paginationKeyboard.push({ text: 'Next ▶️', callback_data: `assignments_page_${page + 1}` });
    }
    
    await safeSend(bot, chatId, `Page ${page} of ${totalPages}`, {
      reply_markup: {
        inline_keyboard: [
          paginationKeyboard,
          [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (err) {
    console.error('Error showing assignments:', err);
    safeSend(bot, chatId, 'There was an error retrieving assignments. Please try again later.');
  }
}

// Applications pagination
async function showApplications(chatId, bot, Assignment, userSessions, page = 1) {
  try {
    if (!userSessions[chatId] || !userSessions[chatId].tutorId) {
      return safeSend(bot, chatId, 'Your session has expired. Please start again.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Start Over', callback_data: 'start' }]]
        }
      });
    }
    
    const tutorId = userSessions[chatId].tutorId;
    const assignments = await Assignment.find({ 'applicants.tutorId': tutorId }).sort({ createdAt: -1 });
    
    if (assignments.length === 0) {
      return safeSend(bot, chatId, 'You haven\'t applied to any assignments yet.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'View Available Assignments', callback_data: 'view_assignments' }],
            [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      });
    }
    
    const totalApplications = assignments.length;
    const totalPages = Math.ceil(totalApplications / ITEMS_PER_PAGE) || 1;
    page = Math.max(1, Math.min(page, totalPages));
    
    const pageAssignments = assignments.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    );
    
    await safeSend(bot, chatId, `Showing your applications ${(page - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(page * ITEMS_PER_PAGE, totalApplications)} of ${totalApplications}`);
    
    for (const assignment of pageAssignments) {
      const application = assignment.applicants.find(
        app => app.tutorId.toString() === tutorId.toString()
      );
      
      let msg = formatAssignment(assignment);
      msg += `\n\n*Your Application Status:* ${application?.status || 'Unknown'}`;
      msg += `\n*Applied on:* ${application?.appliedAt ? application.appliedAt.toLocaleDateString() : 'Unknown'}`;
      
      await safeSend(bot, chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'View Details', callback_data: `view_application_${assignment._id}` }],
            ...(application?.status === 'Pending' ? [[{ text: 'Withdraw Application', callback_data: `withdraw_${assignment._id}` }]] : [])
          ]
        }
      });
    }
    
    const paginationKeyboard = [];
    if (page > 1) {
      paginationKeyboard.push({ text: '◀️ Previous', callback_data: `applications_page_${page - 1}` });
    }
    if (page < totalPages) {
      paginationKeyboard.push({ text: 'Next ▶️', callback_data: `applications_page_${page + 1}` });
    }
    
    await safeSend(bot, chatId, `Page ${page} of ${totalPages}`, {
      reply_markup: {
        inline_keyboard: [
          paginationKeyboard,
          [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (err) {
    console.error('Error showing applications:', err);
    safeSend(bot, chatId, 'There was an error retrieving your applications. Please try again later.');
  }
}

// Main handler function
export async function handleUpdate(bot, context, update) {
  const { Tutor, Assignment, userSessions, ADMIN_USERS } = context;

  // Handle /start command
  if (update.message?.text === '/start') {
    const chatId = update.message.chat.id;
    console.log(`🚀 Start command received from ${chatId}`);
    userSessions[chatId] = { state: 'awaiting_contact' };
    return safeSend(bot, chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
      reply_markup: {
        keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
        one_time_keyboard: true,
      },
    });
  }

  // Handle contact sharing
  if (update.message?.contact) {
    const msg = update.message;
    const chatId = msg.chat.id;
    console.log('📞 Contact received from:', msg.from.id);
    console.log('📞 Contact details:', msg.contact);

    const contactNumber = msg.contact.phone_number;
    const variations = normalizePhone(contactNumber);
    console.log('🔎 Phone search variations:', variations);

    try {
      const tutor = await Tutor.findOne({
        $or: variations.map(v => ({ contactNumber: { $regex: new RegExp(v, 'i') } }))
      });

      if (!tutor) {
        console.log('❌ Tutor not found for variations:', variations);
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
      const pendingAssignmentId = userSessions[chatId]?.pendingAssignmentId;
      userSessions[chatId] = {
        tutorId: tutor._id,
        state: 'profile_verification'
      };
      
      if (pendingAssignmentId) {
        userSessions[chatId].pendingAssignmentId = pendingAssignmentId;
      }

      const profileMessage = formatTutorProfile(tutor);
      return safeSend(bot, chatId, profileMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yes, use this profile', callback_data: 'profile_confirm' }],
            [{ text: 'No, I would like to edit this profile', callback_data: 'profile_edit' }],
            [{ text: 'Back', callback_data: 'start' }]
          ]
        }
      });
    } catch (err) {
      console.error('Error finding tutor:', err);
      return safeSend(bot, chatId, 'There was an error processing your request. Please try again later.');
    }
  }

  // Handle text messages for profile editing
  if (update.message?.text && userSessions[update.message.chat.id]?.state?.startsWith('awaiting_')) {
    const chatId = update.message.chat.id;
    const session = userSessions[chatId];
    const text = update.message.text;

    try {
      const tutor = await Tutor.findById(session.tutorId);
      if (!tutor) {
        return safeSend(bot, chatId, 'Tutor not found. Please try again with /start.');
      }

      const field = session.state.replace('awaiting_', '');
      
      // Update the field
      tutor[field] = text;
      await tutor.save();

      // Clear the waiting state
      session.state = 'main_menu';

      await safeSend(bot, chatId, `✅ ${field} updated successfully!`);
      
      // Show updated profile
      const profileMessage = formatTutorProfile(tutor);
      return safeSend(bot, chatId, profileMessage, {
        parse_mode: 'Markdown',
        reply_markup: getEditProfileMenu(tutor)
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      return safeSend(bot, chatId, 'There was an error updating your profile. Please try again.');
    }
  }

  // Handle callback queries
  if (update.callback_query) {
    const query = update.callback_query;
    const chatId = query.message.chat.id;
    const data = query.data;
    const session = userSessions[chatId];

    try {
      await bot.answerCallbackQuery(query.id);
      console.log(`🔔 Callback query: ${data} from ${chatId}`);

      // Handle cases where no session exists
      if (!session) {
        if (data === 'start') {
          userSessions[chatId] = { state: 'awaiting_contact' };
          return safeSend(bot, chatId, 'Please share your phone number to verify your profile.', {
            reply_markup: {
              keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
              one_time_keyboard: true
            }
          });
        }
        return safeSend(bot, chatId, 'Session expired. Please send /start to begin again.');
      }

      // Handle start callback
      if (data === 'start') {
        userSessions[chatId] = { state: 'awaiting_contact' };
        return safeSend(bot, chatId, 'Please share your phone number to verify your profile.', {
          reply_markup: {
            keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
            one_time_keyboard: true
          }
        });
      }

      // For most callbacks, we need a tutor
      if (!session.tutorId && !['start'].includes(data)) {
        return safeSend(bot, chatId, 'Session expired. Please send /start to begin again.');
      }

      const tutor = session.tutorId ? await Tutor.findById(session.tutorId) : null;
      if (!tutor && !['start'].includes(data)) {
        return safeSend(bot, chatId, 'Tutor not found. Please try again with /start.');
      }

      // Profile confirmation
      if (data === 'profile_confirm') {
        session.state = 'main_menu';
        return showMainMenu(chatId, bot);
      }

      // Profile editing
      if (data === 'profile_edit') {
        return safeSend(bot, chatId, 'What would you like to edit?', {
          reply_markup: getEditProfileMenu(tutor)
        });
      }

      // Main menu
      if (data === 'main_menu') {
        return showMainMenu(chatId, bot);
      }

      // View assignments
      if (data === 'view_assignments') {
        return showAssignments(chatId, bot, Assignment, userSessions, 1);
      }

      // Assignment pagination
      if (data.startsWith('assignments_page_')) {
        const page = parseInt(data.split('_')[2]);
        return showAssignments(chatId, bot, Assignment, userSessions, page);
      }

      // View applications
      if (data === 'view_applications') {
        return showApplications(chatId, bot, Assignment, userSessions, 1);
      }

      // Application pagination
      if (data.startsWith('applications_page_')) {
        const page = parseInt(data.split('_')[2]);
        return showApplications(chatId, bot, Assignment, userSessions, page);
      }

      // Apply to assignment
      if (data.startsWith('apply_')) {
        const assignmentId = data.replace('apply_', '');
        try {
          const assignment = await Assignment.findById(assignmentId);
          if (!assignment) {
            return safeSend(bot, chatId, 'Assignment not found.');
          }

          // Check if already applied
          const hasApplied = assignment.applicants?.some(app => 
            app.tutorId.toString() === session.tutorId.toString());
          
          if (hasApplied) {
            return safeSend(bot, chatId, 'You have already applied to this assignment.');
          }

          // Add application
          if (!assignment.applicants) assignment.applicants = [];
          assignment.applicants.push({
            tutorId: session.tutorId,
            status: 'Pending',
            appliedAt: new Date()
          });

          await assignment.save();
          return safeSend(bot, chatId, '✅ Application submitted successfully!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'View My Applications', callback_data: 'view_applications' }],
                [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
              ]
            }
          });
        } catch (err) {
          console.error('Error applying to assignment:', err);
          return safeSend(bot, chatId, 'There was an error submitting your application. Please try again.');
        }
      }

      // Handle profile field edits
      if (data.startsWith('edit_')) {
        const field = data.replace('edit_', '');
        session.state = `awaiting_${field}`;
        return safeSend(bot, chatId, `Please enter your new ${field}:`);
      }

      // Handle menu selections
      if (data === 'edit_teachingLevels') {
        return safeSend(bot, chatId, 'Select your teaching levels:', {
          reply_markup: getTeachingLevelMenu(tutor)
        });
      }

      if (data === 'edit_availability') {
        const menuData = getAvailabilityMenu(tutor);
        return safeSend(bot, chatId, menuData.text || 'Select your availability:', {
          parse_mode: menuData.options?.parse_mode || 'HTML',
          reply_markup: menuData.options?.reply_markup || menuData
        });
      }

      // Handle toggle operations for teaching levels
      if (data.startsWith('toggle_')) {
        const parts = data.split('_');
        
        if (parts.length === 2) {
          // Handle level toggles (primary, secondary, jc, international)
          const level = parts[1];
          if (['primary', 'secondary', 'jc', 'international'].includes(level)) {
            initializeTeachingLevels(tutor);
            if (!tutor.teachingLevels[level]) {
              tutor.teachingLevels[level] = {};
            }
            await tutor.save();
            
            // Show the appropriate subject menu
            let menu;
            switch(level) {
              case 'primary':
                menu = getPrimarySubjectsMenu(tutor);
                break;
              case 'secondary':
                menu = getSecondarySubjectsMenu(tutor);
                break;
              case 'jc':
                menu = getJCSubjectsMenu(tutor);
                break;
              case 'international':
                menu = getInternationalSubjectsMenu(tutor);
                break;
            }
            
            return safeSend(bot, chatId, `Select ${level} subjects:`, {
              reply_markup: menu
            });
          }
        } else if (parts.length === 3) {
          // Handle subject toggles (e.g., toggle_primary_english)
          const [_, level, subject] = parts;
          if (['primary', 'secondary', 'jc', 'international'].includes(level)) {
            initializeTeachingLevels(tutor);
            if (!tutor.teachingLevels[level]) {
              tutor.teachingLevels[level] = {};
            }
            tutor.teachingLevels[level][subject] = !tutor.teachingLevels[level][subject];
            await tutor.save();
            
            // Show the appropriate subject menu
            let menu;
            switch(level) {
              case 'primary':
                menu = getPrimarySubjectsMenu(tutor);
                break;
              case 'secondary':
                menu = getSecondarySubjectsMenu(tutor);
                break;
              case 'jc':
                menu = getJCSubjectsMenu(tutor);
                break;
              case 'international':
                menu = getInternationalSubjectsMenu(tutor);
                break;
            }
            
            return safeSend(bot, chatId, `${subject} ${tutor.teachingLevels[level][subject] ? 'added' : 'removed'}!`, {
              reply_markup: menu
            });
          }
        }
        
        // Handle availability toggles
        if (['weekdayMorning', 'weekdayAfternoon', 'weekdayEvening', 
             'weekendMorning', 'weekendAfternoon', 'weekendEvening'].includes(parts[1])) {
          initializeAvailability(tutor);
          const slot = parts[1];
          tutor.availableTimeSlots[slot] = !tutor.availableTimeSlots[slot];
          await tutor.save();
          
          const menuData = getAvailabilityMenu(tutor);
          return safeSend(bot, chatId, 'Availability updated!', {
            parse_mode: menuData.options?.parse_mode || 'HTML',
            reply_markup: menuData.options?.reply_markup || menuData
          });
        }
        
        // Handle location toggles
        if (parts[1] === 'location') {
          const location = parts[2];
          if (!tutor.locations) {
            tutor.locations = {};
          }
          tutor.locations[location] = !tutor.locations[location];
          await tutor.save();
          
          return safeSend(bot, chatId, 'Location updated!', {
            reply_markup: getLocationsMenu(tutor)
          });
        }
      }

      // Handle menu callbacks for dropdowns
      if (data === 'set_gender_menu') {
        return safeSend(bot, chatId, 'Select your gender:', {
          reply_markup: getGenderMenu()
        });
      }

      if (data === 'set_race_menu') {
        return safeSend(bot, chatId, 'Select your race:', {
          reply_markup: getRaceMenu()
        });
      }

      if (data === 'set_education_menu') {
        return safeSend(bot, chatId, 'Select your highest education:', {
          reply_markup: getHighestEducationMenu()
        });
      }

      // Handle set operations
      if (data.startsWith('set_gender_')) {
        const gender = data.replace('set_gender_', '');
        tutor.gender = gender.charAt(0).toUpperCase() + gender.slice(1);
        await tutor.save();
        
        return safeSend(bot, chatId, `✅ Gender updated to ${tutor.gender}`, {
          reply_markup: getEditProfileMenu(tutor)
        });
      }

      if (data.startsWith('set_race_')) {
        const race = data.replace('set_race_', '');
        tutor.race = race.charAt(0).toUpperCase() + race.slice(1);
        await tutor.save();
        
        return safeSend(bot, chatId, `✅ Race updated to ${tutor.race}`, {
          reply_markup: getEditProfileMenu(tutor)
        });
      }

      if (data.startsWith('set_education_')) {
        const education = data.replace('set_education_', '');
        const educationMap = {
          alevels: 'A Levels',
          diploma: 'Diploma',
          degree: 'Degree',
          masters: 'Masters',
          phd: 'PhD',
          others: 'Others'
        };
        tutor.education = educationMap[education] || education;
        await tutor.save();
        
        return safeSend(bot, chatId, `✅ Education updated to ${tutor.education}`, {
          reply_markup: getEditProfileMenu(tutor)
        });
      }

      // Handle assignment filters
      const filterActions = [
        'filter_subject', 'filter_level', 'filter_location', 'filter_rate_range',
        'filter_schedule', 'filter_student_count', 'filter_requirements', 'filter_start_date',
        'apply_filters', 'clear_all_filters', 'level_primary', 'level_secondary',
        'level_jc', 'level_international', 'schedule_weekdayMorning', 'schedule_weekdayAfternoon',
        'schedule_weekdayEvening', 'schedule_weekendMorning', 'schedule_weekendAfternoon',
        'schedule_weekendEvening', 'students_1', 'students_2', 'students_3_5', 'students_6_plus',
        'req_gender', 'req_race', 'req_experience', 'req_qualifications'
      ];

      if (filterActions.includes(data) || 
          data.startsWith('req_gender_') || 
          data.startsWith('req_race_') || 
          data.startsWith('req_experience_') || 
          data.startsWith('req_qual_')) {
        return handleAssignmentFilters(ctx, data);
      }

      console.log(`⚠️ Unhandled callback: ${data}`);
      return safeSend(bot, chatId, 'This feature is not yet implemented.');

    } catch (err) {
      console.error('Error handling callback query:', err);
      return safeSend(bot, chatId, 'There was an error processing your request. Please try again.');
    }
  }

  console.log('ℹ️ No matching update handler for:', update);
  return Promise.resolve();
}

export default function registerHandlers(bot, context) {
  console.log('🔧 Bot handlers are set up (manual dispatch mode)');
}