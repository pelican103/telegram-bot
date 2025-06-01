import {
  normalizePhone,
  initializeTeachingLevels,
  initializeAvailability,
  getTick,
  paginate,
  buildFilterQuery
} from '../utils/helpers.js';

import {
  formatTutorProfile,
  formatAssignment,
  formatAssignmentsList
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
  getAssignmentFilterMenu,
  getAssignmentsMenu
} from '../utils/menus.js';

const ITEMS_PER_PAGE = 5;

// Safe send function with enhanced logging and error handling
function safeSend(bot, chatId, text, options = {}) {
  console.log(`📤 Sending to ${chatId}:`, text.substring(0, 80));
  if (options?.reply_markup) {
    console.log(`📦 Reply markup:`, JSON.stringify(options.reply_markup, null, 2));
  }
  
  // Validate inline keyboard structure
  if (options.reply_markup?.inline_keyboard) {
    const keyboard = options.reply_markup.inline_keyboard;
    if (!Array.isArray(keyboard)) {
      console.error('❌ Invalid keyboard structure: not an array');
      options.reply_markup.inline_keyboard = [];
    } else {
      // Validate each row
      keyboard.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
          console.error(`❌ Invalid keyboard row ${rowIndex}: not an array`);
          keyboard[rowIndex] = [];
        } else {
          // Validate each button
          row.forEach((button, buttonIndex) => {
            if (!button.text || (!button.callback_data && !button.url)) {
              console.error(`❌ Invalid button at row ${rowIndex}, col ${buttonIndex}:`, button);
            }
            // Ensure callback_data is not too long (max 64 bytes)
            if (button.callback_data && button.callback_data.length > 64) {
              console.warn(`⚠️ Callback data too long, truncating: ${button.callback_data}`);
              button.callback_data = button.callback_data.substring(0, 64);
            }
          });
        }
      });
    }
  }
  
  return bot.sendMessage(chatId, text, options)
    .then(result => {
      console.log(`✅ Message sent successfully to ${chatId}`);
      return result;
    })
    .catch(err => {
      console.error(`❌ Failed to send message to ${chatId}:`, err.message);
      
      // Try sending a simplified version without markup if the original fails
      if (options.reply_markup && err.message.includes('Bad Request')) {
        console.log('🔄 Retrying without reply markup...');
        return bot.sendMessage(chatId, text);
      }
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
        [{ text: '👤 Update Profile', callback_data: 'profile_edit' }],
        [{ text: '🔍 Filter Assignments', callback_data: 'assignment_filters' }]
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
      
      const keyboard = [];
      if (assignment.status === 'Open' && !hasApplied) {
        keyboard.push([{ text: '✅ Apply', callback_data: `apply_${assignment._id}` }]);
      }
      if (hasApplied) {
        keyboard.push([{ text: '📋 Already Applied', callback_data: `view_app_${assignment._id}` }]);
      }
      
      await safeSend(bot, chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    }
    
    const paginationKeyboard = [];
    if (page > 1) {
      paginationKeyboard.push({ text: '◀️ Previous', callback_data: `assign_page_${page - 1}` });
    }
    if (page < totalPages) {
      paginationKeyboard.push({ text: 'Next ▶️', callback_data: `assign_page_${page + 1}` });
    }
    
    const finalKeyboard = [];
    if (paginationKeyboard.length > 0) {
      finalKeyboard.push(paginationKeyboard);
    }
    finalKeyboard.push([{ text: 'Back to Main Menu', callback_data: 'main_menu' }]);
    
    await safeSend(bot, chatId, `Page ${page} of ${totalPages}`, {
      reply_markup: { inline_keyboard: finalKeyboard }
    });
  } catch (err) {
    console.error('Error showing assignments:', err);
    safeSend(bot, chatId, 'There was an error retrieving assignments. Please try again later.');
  }
}

// Applications pagination with enhanced error handling
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
      
      const keyboard = [[{ text: 'View Details', callback_data: `view_app_${assignment._id}` }]];
      if (application?.status === 'Pending') {
        keyboard.push([{ text: 'Withdraw Application', callback_data: `withdraw_${assignment._id}` }]);
      }
      
      await safeSend(bot, chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    }
    
    const paginationKeyboard = [];
    if (page > 1) {
      paginationKeyboard.push({ text: '◀️ Previous', callback_data: `apps_page_${page - 1}` });
    }
    if (page < totalPages) {
      paginationKeyboard.push({ text: 'Next ▶️', callback_data: `apps_page_${page + 1}` });
    }
    
    const finalKeyboard = [];
    if (paginationKeyboard.length > 0) {
      finalKeyboard.push(paginationKeyboard);
    }
    finalKeyboard.push([{ text: 'Back to Main Menu', callback_data: 'main_menu' }]);
    
    await safeSend(bot, chatId, `Page ${page} of ${totalPages}`, {
      reply_markup: { inline_keyboard: finalKeyboard }
    });
  } catch (err) {
    console.error('Error showing applications:', err);
    safeSend(bot, chatId, 'There was an error retrieving your applications. Please try again later.');
  }
}

// Handle assignment filters with better error handling
async function handleAssignmentFilters(bot, chatId, data, Tutor) {
  try {
    const tutor = await Tutor.findOne({ telegramChatId: chatId });
    if (!tutor) {
      return safeSend(bot, chatId, 'Please start the bot first with /start');
    }

    // Initialize filters if they don't exist
    if (!tutor.filters) {
      tutor.filters = {};
    }

    switch (data) {
      case 'assignment_filters':
        return safeSend(bot, chatId, 'Assignment Filters:', getAssignmentFilterMenu());

      case 'filter_subject':
        const level = tutor.filters?.level || 'primary';
        const subjectMenu = getSubjectMenu(level);
        return safeSend(bot, chatId, 'Select a subject:', subjectMenu);

      case 'filter_level':
        return safeSend(bot, chatId, 'Select education level:', getLevelFilterMenu());

      case 'filter_location':
        return safeSend(bot, chatId, 'Select preferred location:', getLocationsMenu(tutor));

      case 'filter_schedule':
        return safeSend(bot, chatId, 'Select preferred schedule:', getScheduleFilterMenu());

      case 'filter_student_count':
        return safeSend(bot, chatId, 'Select number of students:', getStudentCountMenu());

      case 'filter_requirements':
        return safeSend(bot, chatId, 'Select tutor requirements:', getTutorRequirementsMenu());

      case 'apply_filters':
        const assignments = await Assignment.find({
          status: 'Open',
          ...buildFilterQuery(tutor.filters)
        });
        return safeSend(bot, chatId, formatAssignmentsList(assignments), getAssignmentsMenu());

      case 'clear_all_filters':
        tutor.filters = {};
        await tutor.save();
        return safeSend(bot, chatId, 'All filters cleared', getAssignmentFilterMenu());

      // Handle level selection
      case 'level_primary':
      case 'level_secondary':
      case 'level_jc':
      case 'level_international':
        const selectedLevel = data.split('_')[1];
        tutor.filters = { ...tutor.filters, level: selectedLevel };
        await tutor.save();
        return safeSend(bot, chatId, 'Select a subject:', getSubjectMenu(selectedLevel));

      // Handle student count
      case 'students_1':
      case 'students_2':
      case 'students_3_5':
      case 'students_6_plus':
        const count = data.replace('students_', '');
        tutor.filters = { ...tutor.filters, studentCount: count };
        await tutor.save();
        return safeSend(bot, chatId, 'Student count updated', getStudentCountMenu());

      // Handle tutor requirements
      case 'req_gender':
        return safeSend(bot, chatId, 'Select preferred gender:', getGenderRequirementsMenu());
      case 'req_race':
        return safeSend(bot, chatId, 'Select preferred race:', getRaceRequirementsMenu());
      case 'req_experience':
        return safeSend(bot, chatId, 'Select experience requirement:', getExperienceRequirementsMenu());
      case 'req_qualifications':
        return safeSend(bot, chatId, 'Select qualification requirement:', getQualificationsRequirementsMenu());

      // Handle gender selection
      case 'req_gender_male':
      case 'req_gender_female':
      case 'req_gender_any':
        const gender = data.split('_')[2];
        tutor.filters = {
          ...tutor.filters,
          tutorRequirements: { ...tutor.filters?.tutorRequirements, gender }
        };
        await tutor.save();
        return safeSend(bot, chatId, 'Gender requirement updated', getGenderRequirementsMenu());

      default:
        return safeSend(bot, chatId, 'Invalid filter option');
    }
  } catch (err) {
    console.error('Error handling assignment filters:', err);
    return safeSend(bot, chatId, 'There was an error processing your request. Please try again.');
  }
}

// Main handler function with improved error handling
export async function handleUpdate(bot, context, update) {
  const { Tutor, Assignment, userSessions, ADMIN_USERS } = context;

  try {
    // Handle /start command
    if (update.message?.text === '/start') {
      const chatId = update.message.chat.id;
      console.log(`🚀 Start command received from ${chatId}`);
      userSessions[chatId] = { state: 'awaiting_contact' };
      return safeSend(bot, chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
        reply_markup: {
          keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
          one_time_keyboard: true,
          resize_keyboard: true
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
                one_time_keyboard: true,
                resize_keyboard: true
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
              one_time_keyboard: true,
              resize_keyboard: true
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

        // Assignment pagination - Fixed callback names
        if (data.startsWith('assign_page_')) {
          const page = parseInt(data.split('_')[2]);
          return showAssignments(chatId, bot, Assignment, userSessions, page);
        }

        // View applications
        if (data === 'view_applications') {
          return showApplications(chatId, bot, Assignment, userSessions, 1);
        }

        // Application pagination - Fixed callback names
        if (data.startsWith('apps_page_')) {
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
          
          return safeSend(bot, chatId, '✅ Gender updated successfully!', {
            reply_markup: getEditProfileMenu(tutor)
          });
        }

        if (data.startsWith('set_race_')) {
          const race = data.replace('set_race_', '');
          tutor.race = race.charAt(0).toUpperCase() + race.slice(1);
          await tutor.save();
          
          return safeSend(bot, chatId, '✅ Race updated successfully!', {
            reply_markup: getEditProfileMenu(tutor)
          });
        }

        if (data.startsWith('set_education_')) {
          const education = data.replace('set_education_', '');
          tutor.highestEducation = education;
          await tutor.save();
          
          return safeSend(bot, chatId, '✅ Education updated successfully!', {
            reply_markup: getEditProfileMenu(tutor)
          });
        }

        // Handle hourly rate setting
        if (data === 'edit_hourlyRate') {
          return safeSend(bot, chatId, 'Select your hourly rate:', {
            reply_markup: getHourlyRateMenu()
          });
        }

        if (data.startsWith('set_rate_')) {
          const rate = data.replace('set_rate_', '');
          tutor.hourlyRate = parseInt(rate);
          await tutor.save();
          
          return safeSend(bot, chatId, `✅ Hourly rate set to $${rate}!`, {
            reply_markup: getEditProfileMenu(tutor)
          });
        }

        // Handle location editing
        if (data === 'edit_locations') {
          return safeSend(bot, chatId, 'Select your preferred locations:', {
            reply_markup: getLocationsMenu(tutor)
          });
        }

        // Handle back to profile from submenus
        if (data === 'back_to_profile') {
          const profileMessage = formatTutorProfile(tutor);
          return safeSend(bot, chatId, profileMessage, {
            parse_mode: 'Markdown',
            reply_markup: getEditProfileMenu(tutor)
          });
        }

        // Handle assignment filters
        if (data.startsWith('assignment_filters') || data.startsWith('filter_') || 
            data.startsWith('level_') || data.startsWith('students_') || 
            data.startsWith('req_') || data === 'apply_filters' || 
            data === 'clear_all_filters') {
          return handleAssignmentFilters(bot, chatId, data, Tutor);
        }

        // Handle subject filter selections based on level
        if (data.startsWith('subject_')) {
          const subject = data.replace('subject_', '');
          const filters = tutor.filters || {};
          filters.subject = subject;
          tutor.filters = filters;
          await tutor.save();
          
          return safeSend(bot, chatId, `Subject filter set to: ${subject}`, getAssignmentFilterMenu());
        }

        // Handle location filter selections
        if (data.startsWith('location_')) {
          const location = data.replace('location_', '');
          const filters = tutor.filters || {};
          filters.location = location;
          tutor.filters = filters;
          await tutor.save();
          
          return safeSend(bot, chatId, `Location filter set to: ${location}`, getAssignmentFilterMenu());
        }

        // Handle schedule filter selections
        if (data.startsWith('schedule_')) {
          const schedule = data.replace('schedule_', '');
          const filters = tutor.filters || {};
          filters.schedule = schedule;
          tutor.filters = filters;
          await tutor.save();
          
          return safeSend(bot, chatId, `Schedule filter set to: ${schedule}`, getScheduleFilterMenu());
        }

        // Handle experience requirements
        if (data.startsWith('exp_')) {
          const experience = data.replace('exp_', '');
          const filters = tutor.filters || {};
          if (!filters.tutorRequirements) filters.tutorRequirements = {};
          filters.tutorRequirements.experience = experience;
          tutor.filters = filters;
          await tutor.save();
          
          return safeSend(bot, chatId, `Experience requirement set to: ${experience}`, getExperienceRequirementsMenu());
        }

        // Handle qualification requirements
        if (data.startsWith('qual_')) {
          const qualification = data.replace('qual_', '');
          const filters = tutor.filters || {};
          if (!filters.tutorRequirements) filters.tutorRequirements = {};
          filters.tutorRequirements.qualifications = qualification;
          tutor.filters = filters;
          await tutor.save();
          
          return safeSend(bot, chatId, `Qualification requirement set to: ${qualification}`, getQualificationsRequirementsMenu());
        }

        // Handle race requirements
        if (data.startsWith('req_race_')) {
          const race = data.replace('req_race_', '');
          const filters = tutor.filters || {};
          if (!filters.tutorRequirements) filters.tutorRequirements = {};
          filters.tutorRequirements.race = race;
          tutor.filters = filters;
          await tutor.save();
          
          return safeSend(bot, chatId, `Race requirement set to: ${race}`, getRaceRequirementsMenu());
        }

        // Handle withdraw application
        if (data.startsWith('withdraw_')) {
          const assignmentId = data.replace('withdraw_', '');
          try {
            const assignment = await Assignment.findById(assignmentId);
            if (!assignment) {
              return safeSend(bot, chatId, 'Assignment not found.');
            }

            // Remove the application
            assignment.applicants = assignment.applicants.filter(
              app => app.tutorId.toString() !== session.tutorId.toString()
            );

            await assignment.save();
            return safeSend(bot, chatId, '✅ Application withdrawn successfully!', {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'View My Applications', callback_data: 'view_applications' }],
                  [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
                ]
              }
            });
          } catch (err) {
            console.error('Error withdrawing application:', err);
            return safeSend(bot, chatId, 'There was an error withdrawing your application. Please try again.');
          }
        }

        // Handle view application details
        if (data.startsWith('view_app_')) {
          const assignmentId = data.replace('view_app_', '');
          try {
            const assignment = await Assignment.findById(assignmentId);
            if (!assignment) {
              return safeSend(bot, chatId, 'Assignment not found.');
            }

            const application = assignment.applicants.find(
              app => app.tutorId.toString() === session.tutorId.toString()
            );

            if (!application) {
              return safeSend(bot, chatId, 'Application not found.');
            }

            let msg = formatAssignment(assignment);
            msg += `\n\n📋 *Your Application Details:*`;
            msg += `\n• Status: ${application.status}`;
            msg += `\n• Applied on: ${application.appliedAt.toLocaleDateString()}`;
            
            if (application.notes) {
              msg += `\n• Notes: ${application.notes}`;
            }

            const keyboard = [];
            if (application.status === 'Pending') {
              keyboard.push([{ text: 'Withdraw Application', callback_data: `withdraw_${assignmentId}` }]);
            }
            keyboard.push([{ text: 'Back to Applications', callback_data: 'view_applications' }]);
            keyboard.push([{ text: 'Back to Main Menu', callback_data: 'main_menu' }]);

            return safeSend(bot, chatId, msg, {
              parse_mode: 'Markdown',
              reply_markup: { inline_keyboard: keyboard }
            });
          } catch (err) {
            console.error('Error viewing application:', err);
            return safeSend(bot, chatId, 'There was an error retrieving application details. Please try again.');
          }
        }

        // Handle admin functions if user is admin
        if (ADMIN_USERS && ADMIN_USERS.includes(chatId.toString())) {
          if (data === 'admin_panel') {
            return safeSend(bot, chatId, 'Admin Panel:', {
              reply_markup: {
                inline_keyboard: [
                  [{ text: '📊 View Statistics', callback_data: 'admin_stats' }],
                  [{ text: '👥 Manage Tutors', callback_data: 'admin_tutors' }],
                  [{ text: '📋 Manage Assignments', callback_data: 'admin_assignments' }],
                  [{ text: '📢 Send Broadcast', callback_data: 'admin_broadcast' }],
                  [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
                ]
              }
            });
          }

          if (data === 'admin_stats') {
            try {
              const totalTutors = await Tutor.countDocuments();
              const totalAssignments = await Assignment.countDocuments();
              const openAssignments = await Assignment.countDocuments({ status: 'Open' });
              const completedAssignments = await Assignment.countDocuments({ status: 'Completed' });

              const stats = `📊 *Platform Statistics*\n\n` +
                          `👥 Total Tutors: ${totalTutors}\n` +
                          `📋 Total Assignments: ${totalAssignments}\n` +
                          `🟢 Open Assignments: ${openAssignments}\n` +
                          `✅ Completed Assignments: ${completedAssignments}`;

              return safeSend(bot, chatId, stats, {
                parse_mode: 'Markdown',
                reply_markup: {
                  inline_keyboard: [[{ text: 'Back to Admin Panel', callback_data: 'admin_panel' }]]
                }
              });
            } catch (err) {
              console.error('Error getting admin stats:', err);
              return safeSend(bot, chatId, 'Error retrieving statistics.');
            }
          }
        }

        // Default fallback
        console.log(`⚠️ Unhandled callback data: ${data}`);
        return safeSend(bot, chatId, 'Sorry, I didn\'t understand that action. Please try again.', {
          reply_markup: {
            inline_keyboard: [[{ text: 'Back to Main Menu', callback_data: 'main_menu' }]]
          }
        });

      } catch (err) {
        console.error('Error handling callback query:', err);
        return safeSend(bot, chatId, 'There was an error processing your request. Please try again.');
      }
    }

    // Handle other message types
    if (update.message && !update.message.contact && update.message.text !== '/start') {
      const chatId = update.message.chat.id;
      const session = userSessions[chatId];
      
      if (!session) {
        return safeSend(bot, chatId, 'Please start the bot with /start command first.');
      }

      // Handle text input during profile editing states
      if (session.state && session.state.startsWith('awaiting_')) {
        // This is already handled above in the text message section
        return;
      }

      // Handle general messages when not in a specific state
      return safeSend(bot, chatId, 'I didn\'t understand that. Please use the menu options.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Main Menu', callback_data: 'main_menu' }]]
        }
      });
    }

  } catch (err) {
    console.error('❌ Error in handleUpdate:', err);
    
    // Try to send an error message to the user if we have a chat ID
    const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
    if (chatId) {
      try {
        await safeSend(bot, chatId, 'Sorry, there was an unexpected error. Please try again or contact support.');
      } catch (sendErr) {
        console.error('❌ Failed to send error message:', sendErr);
      }
    }
  }
}

// Helper function for deep linking to assignments
export function generateAssignmentDeepLink(assignmentId, botUsername) {
  return `https://t.me/${botUsername}?start=assignment_${assignmentId}`;
}

// Function to handle deep link starts (when user clicks on assignment link)
export async function handleDeepLinkStart(bot, chatId, parameter, context) {
  const { userSessions } = context;
  
  if (parameter.startsWith('assignment_')) {
    const assignmentId = parameter.replace('assignment_', '');
    
    // Store the assignment ID for after profile verification
    if (!userSessions[chatId]) {
      userSessions[chatId] = {};
    }
    userSessions[chatId].pendingAssignmentId = assignmentId;
    
    // Start the normal verification process
    userSessions[chatId].state = 'awaiting_contact';
    return safeSend(bot, chatId, 'Welcome! Please share your phone number to verify your profile and view the assignment.', {
      reply_markup: {
        keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });
  }
}

// Function to broadcast messages to all tutors (admin only)
export async function broadcastMessage(bot, message, context, adminChatId) {
  const { Tutor } = context;
  
  try {
    const tutors = await Tutor.find({ telegramChatId: { $exists: true, $ne: null } });
    let successCount = 0;
    let failCount = 0;
    
    for (const tutor of tutors) {
      try {
        await safeSend(bot, tutor.telegramChatId, message, { parse_mode: 'Markdown' });
        successCount++;
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Failed to send broadcast to ${tutor.telegramChatId}:`, err.message);
        failCount++;
      }
    }
    
    await safeSend(bot, adminChatId, `📢 Broadcast complete!\n\n✅ Sent: ${successCount}\n❌ Failed: ${failCount}`);
  } catch (err) {
    console.error('Error broadcasting message:', err);
    await safeSend(bot, adminChatId, 'Error sending broadcast message.');
  }
}

// Function to cleanup expired sessions (call periodically)
export function cleanupExpiredSessions(userSessions, maxAge = 24 * 60 * 60 * 1000) { // 24 hours
  const now = Date.now();
  const expiredSessions = [];
  
  for (const [chatId, session] of Object.entries(userSessions)) {
    if (session.lastActivity && (now - session.lastActivity) > maxAge) {
      expiredSessions.push(chatId);
    }
  }
  
  expiredSessions.forEach(chatId => {
    delete userSessions[chatId];
    console.log(`🧹 Cleaned up expired session for ${chatId}`);
  });
  
  return expiredSessions.length;
}