// handlers.js - Enhanced bot functionality with comprehensive submenus

function normalizePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  const variations = [
    cleaned,
    cleaned.startsWith('65') ? cleaned.substring(2) : '65' + cleaned,
    cleaned.startsWith('65') ? cleaned : '65' + cleaned
  ];
  return [...new Set(variations)];
}

function initializeTeachingLevels(tutor) {
  if (!tutor.teachingLevels) {
    tutor.teachingLevels = {
      primary: {},
      secondary: {},
      jc: {},
      international: {}
    };
  }
}

function initializeAvailability(tutor) {
  if (!tutor.availableTimeSlots) {
    tutor.availableTimeSlots = {
      weekdayMorning: false,
      weekdayAfternoon: false,
      weekdayEvening: false,
      weekendMorning: false,
      weekendAfternoon: false,
      weekendEvening: false
    };
  }
}

function initializeLocations(tutor) {
  if (!tutor.locations) {
    tutor.locations = {
      north: false,
      south: false,
      east: false,
      west: false,
      central: false,
      northeast: false,
      northwest: false
    };
  }
}

function getTick(value) {
  return value ? '✅' : '❌';
}

// Format functions
function formatTutorProfile(tutor) {
  let profile = `*📋 Your Profile*\n\n`;
  profile += `*Name:* ${tutor.fullName || 'Not set'}\n`;
  profile += `*Contact:* ${tutor.contactNumber || 'Not set'}\n`;
  profile += `*Email:* ${tutor.email || 'Not set'}\n`;
  profile += `*Gender:* ${tutor.gender || 'Not set'}\n`;
  profile += `*Race:* ${tutor.race || 'Not set'}\n`;
  profile += `*Education:* ${tutor.highestEducation || 'Not set'}\n`;

  // Teaching levels summary
  if (tutor.teachingLevels) {
    const levels = [];
    if (Object.values(tutor.teachingLevels.primary || {}).some(v => v)) levels.push('Primary');
    if (Object.values(tutor.teachingLevels.secondary || {}).some(v => v)) levels.push('Secondary');
    if (Object.values(tutor.teachingLevels.jc || {}).some(v => v)) levels.push('JC');
    if (Object.values(tutor.teachingLevels.international || {}).some(v => v)) levels.push('International');
    profile += `*Teaching Levels:* ${levels.length ? levels.join(', ') : 'Not set'}\n`;
  }

  // Locations summary
  if (tutor.locations) {
    const locations = [];
    Object.entries(tutor.locations).forEach(([key, value]) => {
      if (value) locations.push(key.charAt(0).toUpperCase() + key.slice(1));
    });
    profile += `*Locations:* ${locations.length ? locations.join(', ') : 'Not set'}\n`;
  }

  // Availability summary
  if (tutor.availableTimeSlots) {
    const slots = [];
    Object.entries(tutor.availableTimeSlots).forEach(([key, value]) => {
      if (value) {
        const formatted = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        slots.push(formatted.charAt(0).toUpperCase() + formatted.slice(1));
      }
    });
    profile += `*Availability:* ${slots.length ? slots.join(', ') : 'Not set'}\n`;
  }

  return profile;
}

function formatAssignment(assignment) {
  let msg = `*🎯 ${assignment.title || 'Assignment'}*\n\n`;
  msg += `*Level:* ${assignment.level}\n`;
  msg += `*Subject:* ${assignment.subject}\n`;
  msg += `*Location:* ${assignment.location}\n`;
  msg += `*Rate:* $${assignment.rate}/${assignment.rateType || 'hour'}\n`;
  msg += `*Students:* ${assignment.studentCount || 1}\n`;
  msg += `*Frequency:* ${assignment.frequency}/week\n`;
  msg += `*Duration:* ${assignment.duration}\n`;
  
  if (assignment.description) {
    msg += `\n*Description:* ${assignment.description}\n`;
  }
  
  msg += `\n*Status:* ${assignment.status}`;
  return msg;
}

// Menu functions
function getMainEditProfileMenu(tutor) {
  return {
    inline_keyboard: [
      [{ text: '📝 Personal Info', callback_data: 'edit_personal_info' }],
      [{ text: '🎓 Teaching Levels', callback_data: 'edit_teaching_levels' }],
      [{ text: '📍 Locations', callback_data: 'edit_locations' }],
      [{ text: '⏰ Availability', callback_data: 'edit_availability' }],
      [{ text: '💰 Hourly Rates', callback_data: 'edit_hourly_rates' }],
      [{ text: '🏠 Back to Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

function getPersonalInfoMenu(tutor) {
  return {
    inline_keyboard: [
      [{ text: '👤 Full Name', callback_data: 'edit_fullName' }],
      [{ text: '📧 Email', callback_data: 'edit_email' }],
      [{ text: '⚥ Gender', callback_data: 'edit_gender_menu' }],
      [{ text: '🌍 Race', callback_data: 'edit_race_menu' }],
      [{ text: '🎓 Education', callback_data: 'edit_education_menu' }],
      [{ text: '🔙 Back to Profile Edit', callback_data: 'profile_edit' }]
    ]
  };
}

function getTeachingLevelsMenu(tutor) {
  initializeTeachingLevels(tutor);
  
  const primaryCount = Object.values(tutor.teachingLevels.primary || {}).filter(v => v).length;
  const secondaryCount = Object.values(tutor.teachingLevels.secondary || {}).filter(v => v).length;
  const jcCount = Object.values(tutor.teachingLevels.jc || {}).filter(v => v).length;
  const intlCount = Object.values(tutor.teachingLevels.international || {}).filter(v => v).length;
  
  return {
    inline_keyboard: [
      [{ text: `📚 Primary (${primaryCount} subjects)`, callback_data: 'edit_primary_subjects' }],
      [{ text: `📖 Secondary (${secondaryCount} subjects)`, callback_data: 'edit_secondary_subjects' }],
      [{ text: `🎓 JC (${jcCount} subjects)`, callback_data: 'edit_jc_subjects' }],
      [{ text: `🌍 International (${intlCount} subjects)`, callback_data: 'edit_international_subjects' }],
      [{ text: '🔙 Back to Profile Edit', callback_data: 'profile_edit' }]
    ]
  };
}

function getLocationsMenu(tutor) {
  initializeLocations(tutor);
  
  const locations = [
    { key: 'north', label: 'North' },
    { key: 'south', label: 'South' },
    { key: 'east', label: 'East' },
    { key: 'west', label: 'West' },
    { key: 'central', label: 'Central' },
    { key: 'northeast', label: 'Northeast' },
    { key: 'northwest', label: 'Northwest' }
  ];
  
  const keyboard = locations.map(location => [
    { 
      text: `${getTick(tutor.locations[location.key])} ${location.label}`, 
      callback_data: `toggle_location_${location.key}` 
    }
  ]);
  
  keyboard.push([{ text: '🔙 Back to Profile Edit', callback_data: 'profile_edit' }]);
  
  return { inline_keyboard: keyboard };
}

function getAvailabilityMenu(tutor) {
  initializeAvailability(tutor);
  
  const slots = [
    { key: 'weekdayMorning', label: 'Weekday Morning' },
    { key: 'weekdayAfternoon', label: 'Weekday Afternoon' },
    { key: 'weekdayEvening', label: 'Weekday Evening' },
    { key: 'weekendMorning', label: 'Weekend Morning' },
    { key: 'weekendAfternoon', label: 'Weekend Afternoon' },
    { key: 'weekendEvening', label: 'Weekend Evening' }
  ];
  
  const keyboard = slots.map(slot => [
    { 
      text: `${getTick(tutor.availableTimeSlots[slot.key])} ${slot.label}`, 
      callback_data: `toggle_availability_${slot.key}` 
    }
  ]);
  
  keyboard.push([{ text: '🔙 Back to Profile Edit', callback_data: 'profile_edit' }]);
  
  return { inline_keyboard: keyboard };
}

function getPrimarySubjectsMenu(tutor) {
  initializeTeachingLevels(tutor);
  
  const subjects = [
    { key: 'english', label: 'English' },
    { key: 'math', label: 'Math' },
    { key: 'science', label: 'Science' },
    { key: 'chinese', label: 'Chinese' },
    { key: 'malay', label: 'Malay' },
    { key: 'tamil', label: 'Tamil' }
  ];
  
  const keyboard = subjects.map(subject => [
    { 
      text: `${getTick(tutor.teachingLevels.primary[subject.key])} ${subject.label}`, 
      callback_data: `toggle_primary_${subject.key}` 
    }
  ]);
  
  keyboard.push([{ text: '🔙 Back to Teaching Levels', callback_data: 'edit_teaching_levels' }]);
  
  return { inline_keyboard: keyboard };
}

function getSecondarySubjectsMenu(tutor) {
  initializeTeachingLevels(tutor);
  
  const subjects = [
    { key: 'english', label: 'English' },
    { key: 'math', label: 'Math' },
    { key: 'aMath', label: 'A Math' },
    { key: 'eMath', label: 'E Math' },
    { key: 'physics', label: 'Physics' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'biology', label: 'Biology' },
    { key: 'science', label: 'Science' },
    { key: 'history', label: 'History' },
    { key: 'geography', label: 'Geography' },
    { key: 'literature', label: 'Literature' },
    { key: 'chinese', label: 'Chinese' },
    { key: 'malay', label: 'Malay' },
    { key: 'tamil', label: 'Tamil' }
  ];
  
  const keyboard = subjects.map(subject => [
    { 
      text: `${getTick(tutor.teachingLevels.secondary[subject.key])} ${subject.label}`, 
      callback_data: `toggle_secondary_${subject.key}` 
    }
  ]);
  
  keyboard.push([{ text: '🔙 Back to Teaching Levels', callback_data: 'edit_teaching_levels' }]);
  
  return { inline_keyboard: keyboard };
}

function getJCSubjectsMenu(tutor) {
  initializeTeachingLevels(tutor);
  
  const subjects = [
    { key: 'generalPaper', label: 'General Paper' },
    { key: 'h1Math', label: 'H1 Math' },
    { key: 'h2Math', label: 'H2 Math' },
    { key: 'h1Physics', label: 'H1 Physics' },
    { key: 'h2Physics', label: 'H2 Physics' },
    { key: 'h1Chemistry', label: 'H1 Chemistry' },
    { key: 'h2Chemistry', label: 'H2 Chemistry' },
    { key: 'h1Biology', label: 'H1 Biology' },
    { key: 'h2Biology', label: 'H2 Biology' },
    { key: 'h1Economics', label: 'H1 Economics' },
    { key: 'h2Economics', label: 'H2 Economics' },
    { key: 'h1History', label: 'H1 History' },
    { key: 'h2History', label: 'H2 History' }
  ];
  
  const keyboard = subjects.map(subject => [
    { 
      text: `${getTick(tutor.teachingLevels.jc[subject.key])} ${subject.label}`, 
      callback_data: `toggle_jc_${subject.key}` 
    }
  ]);
  
  keyboard.push([{ text: '🔙 Back to Teaching Levels', callback_data: 'edit_teaching_levels' }]);
  
  return { inline_keyboard: keyboard };
}

function getInternationalSubjectsMenu(tutor) {
  initializeTeachingLevels(tutor);
  
  const subjects = [
    { key: 'ib', label: 'IB' },
    { key: 'igcse', label: 'IGCSE' },
    { key: 'ielts', label: 'IELTS' },
    { key: 'toefl', label: 'TOEFL' }
  ];
  
  const keyboard = subjects.map(subject => [
    { 
      text: `${getTick(tutor.teachingLevels.international[subject.key])} ${subject.label}`, 
      callback_data: `toggle_international_${subject.key}` 
    }
  ]);
  
  keyboard.push([{ text: '🔙 Back to Teaching Levels', callback_data: 'edit_teaching_levels' }]);
  
  return { inline_keyboard: keyboard };
}

function getGenderMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Male', callback_data: 'set_gender_male' }],
      [{ text: 'Female', callback_data: 'set_gender_female' }],
      [{ text: '🔙 Back', callback_data: 'edit_personal_info' }]
    ]
  };
}

function getRaceMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Chinese', callback_data: 'set_race_chinese' }],
      [{ text: 'Malay', callback_data: 'set_race_malay' }],
      [{ text: 'Indian', callback_data: 'set_race_indian' }],
      [{ text: 'Eurasian', callback_data: 'set_race_eurasian' }],
      [{ text: 'Others', callback_data: 'set_race_others' }],
      [{ text: '🔙 Back', callback_data: 'edit_personal_info' }]
    ]
  };
}

function getEducationMenu() {
  return {
    inline_keyboard: [
      [{ text: 'A Levels', callback_data: 'set_education_alevels' }],
      [{ text: 'Diploma', callback_data: 'set_education_diploma' }],
      [{ text: 'Degree', callback_data: 'set_education_degree' }],
      [{ text: 'Masters', callback_data: 'set_education_masters' }],
      [{ text: 'PhD', callback_data: 'set_education_phd' }],
      [{ text: 'Others', callback_data: 'set_education_others' }],
      [{ text: '🔙 Back', callback_data: 'edit_personal_info' }]
    ]
  };
}

function getHourlyRatesMenu(tutor) {
  return {
    inline_keyboard: [
      [{ text: `💰 Primary Rate: $${tutor.hourlyRate?.primary || 'Not set'}`, callback_data: 'edit_rate_primary' }],
      [{ text: `💰 Secondary Rate: $${tutor.hourlyRate?.secondary || 'Not set'}`, callback_data: 'edit_rate_secondary' }],
      [{ text: `💰 JC Rate: $${tutor.hourlyRate?.jc || 'Not set'}`, callback_data: 'edit_rate_jc' }],
      [{ text: `💰 International Rate: $${tutor.hourlyRate?.international || 'Not set'}`, callback_data: 'edit_rate_international' }],
      [{ text: '🔙 Back to Profile Edit', callback_data: 'profile_edit' }]
    ]
  };
}

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
      
      // Handle different field types
      if (field.startsWith('rate_')) {
        const level = field.replace('rate_', '');
        if (!tutor.hourlyRate) tutor.hourlyRate = {};
        tutor.hourlyRate[level] = text;
        await tutor.save();
        
        session.state = 'main_menu';
        await safeSend(bot, chatId, `✅ ${level} rate updated to $${text}!`);
        
        return safeSend(bot, chatId, 'Select rate to edit:', {
          reply_markup: getHourlyRatesMenu(tutor)
        });
      } else {
        // Regular field update
        tutor[field] = text;
        await tutor.save();
        
        session.state = 'main_menu';
        await safeSend(bot, chatId, `✅ ${field} updated successfully!`);
        
        return safeSend(bot, chatId, 'Select field to edit:', {
          reply_markup: getPersonalInfoMenu(tutor)
        });
      }
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
    const messageId = query.message.message_id;
    
    console.log(`🔄 Callback query received: ${data} from ${chatId}`);

    try {
      await bot.answerCallbackQuery(query.id);
      
      // Get tutor if session exists
      let tutor = null;
      if (userSessions[chatId]?.tutorId) {
        tutor = await Tutor.findById(userSessions[chatId].tutorId);
      }

      // Handle main menu navigation
      if (data === 'main_menu') {
        return showMainMenu(chatId, bot);
      }

      // Handle start over
      if (data === 'start') {
        delete userSessions[chatId];
        return safeSend(bot, chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
          reply_markup: {
            keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
            one_time_keyboard: true,
          },
        });
      }

      // Handle profile confirmation
      if (data === 'profile_confirm') {
        if (!userSessions[chatId]?.tutorId) {
          return safeSend(bot, chatId, 'Session expired. Please start again with /start.');
        }
        
        userSessions[chatId].state = 'main_menu';
        
        // Check if there's a pending assignment application
        if (userSessions[chatId].pendingAssignmentId) {
          const assignmentId = userSessions[chatId].pendingAssignmentId;
          delete userSessions[chatId].pendingAssignmentId;
          
          try {
            const assignment = await Assignment.findById(assignmentId);
            if (!assignment) {
              return safeSend(bot, chatId, 'Assignment not found. Returning to main menu.', {
                reply_markup: { inline_keyboard: [[{ text: 'Main Menu', callback_data: 'main_menu' }]] }
              });
            }
            
            // Check if already applied
            const hasApplied = assignment.applicants?.some(applicant => 
              applicant.tutorId.toString() === userSessions[chatId].tutorId.toString());
            
            if (hasApplied) {
              return safeSend(bot, chatId, 'You have already applied to this assignment.', {
                reply_markup: { inline_keyboard: [[{ text: 'Main Menu', callback_data: 'main_menu' }]] }
              });
            }
            
            // Add application
            if (!assignment.applicants) assignment.applicants = [];
            assignment.applicants.push({
              tutorId: userSessions[chatId].tutorId,
              status: 'Pending',
              appliedAt: new Date()
            });
            
            await assignment.save();
            
            return safeSend(bot, chatId, '✅ Application submitted successfully!', {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'View My Applications', callback_data: 'view_applications' }],
                  [{ text: 'Main Menu', callback_data: 'main_menu' }]
                ]
              }
            });
          } catch (err) {
            console.error('Error processing pending application:', err);
            return safeSend(bot, chatId, 'There was an error processing your application. Please try again.');
          }
        }
        
        return showMainMenu(chatId, bot);
      }

      // Handle assignments view
      if (data === 'view_assignments') {
        return showAssignments(chatId, bot, Assignment, userSessions);
      }

      // Handle assignment pagination
      if (data.startsWith('assignments_page_')) {
        const page = parseInt(data.split('_')[2]);
        return showAssignments(chatId, bot, Assignment, userSessions, page);
      }

      // Handle applications view
      if (data === 'view_applications') {
        return showApplications(chatId, bot, Assignment, userSessions);
      }

      // Handle applications pagination
      if (data.startsWith('applications_page_')) {
        const page = parseInt(data.split('_')[2]);
        return showApplications(chatId, bot, Assignment, userSessions, page);
      }

      // Handle assignment application
      if (data.startsWith('apply_')) {
        const assignmentId = data.replace('apply_', '');
        
        if (!userSessions[chatId]?.tutorId) {
          userSessions[chatId] = { pendingAssignmentId: assignmentId, state: 'awaiting_contact' };
          return safeSend(bot, chatId, 'Please share your phone number first to verify your profile.', {
            reply_markup: {
              keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
              one_time_keyboard: true,
            },
          });
        }

        try {
          const assignment = await Assignment.findById(assignmentId);
          if (!assignment) {
            return safeSend(bot, chatId, 'Assignment not found.');
          }
          
          // Check if already applied
          const hasApplied = assignment.applicants?.some(applicant => 
            applicant.tutorId.toString() === userSessions[chatId].tutorId.toString());
          
          if (hasApplied) {
            return safeSend(bot, chatId, 'You have already applied to this assignment.');
          }
          
          // Add application
          if (!assignment.applicants) assignment.applicants = [];
          assignment.applicants.push({
            tutorId: userSessions[chatId].tutorId,
            status: 'Pending',
            appliedAt: new Date()
          });
          
          await assignment.save();
          
          return safeSend(bot, chatId, '✅ Application submitted successfully!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'View My Applications', callback_data: 'view_applications' }],
                [{ text: 'Back to Assignments', callback_data: 'view_assignments' }],
                [{ text: 'Main Menu', callback_data: 'main_menu' }]
              ]
            }
          });
        } catch (err) {
          console.error('Error applying to assignment:', err);
          return safeSend(bot, chatId, 'There was an error submitting your application. Please try again.');
        }
      }

      // Handle application withdrawal
      if (data.startsWith('withdraw_')) {
        const assignmentId = data.replace('withdraw_', '');
        
        try {
          const assignment = await Assignment.findById(assignmentId);
          if (!assignment) {
            return safeSend(bot, chatId, 'Assignment not found.');
          }
          
          assignment.applicants = assignment.applicants.filter(
            applicant => applicant.tutorId.toString() !== userSessions[chatId].tutorId.toString()
          );
          
          await assignment.save();
          
          return safeSend(bot, chatId, '✅ Application withdrawn successfully!', {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'View My Applications', callback_data: 'view_applications' }],
                [{ text: 'Main Menu', callback_data: 'main_menu' }]
              ]
            }
          });
        } catch (err) {
          console.error('Error withdrawing application:', err);
          return safeSend(bot, chatId, 'There was an error withdrawing your application. Please try again.');
        }
      }

      // Handle application details view
      if (data.startsWith('view_application_')) {
        const assignmentId = data.replace('view_application_', '');
        
        try {
          const assignment = await Assignment.findById(assignmentId);
          if (!assignment) {
            return safeSend(bot, chatId, 'Assignment not found.');
          }
          
          const application = assignment.applicants.find(
            app => app.tutorId.toString() === userSessions[chatId].tutorId.toString()
          );
          
          let msg = formatAssignment(assignment);
          msg += `\n\n*Your Application Status:* ${application?.status || 'Unknown'}`;
          msg += `\n*Applied on:* ${application?.appliedAt ? application.appliedAt.toLocaleDateString() : 'Unknown'}`;
          
          const keyboard = [
            [{ text: 'Back to My Applications', callback_data: 'view_applications' }]
          ];
          
          if (application?.status === 'Pending') {
            keyboard.unshift([{ text: 'Withdraw Application', callback_data: `withdraw_${assignmentId}` }]);
          }
          
          return safeSend(bot, chatId, msg, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard }
          });
        } catch (err) {
          console.error('Error viewing application:', err);
          return safeSend(bot, chatId, 'There was an error retrieving application details. Please try again.');
        }
      }

      // Profile editing handlers
      if (data === 'profile_edit') {
        if (!tutor) {
          return safeSend(bot, chatId, 'Tutor profile not found. Please start again with /start.');
        }
        
        const profileMessage = formatTutorProfile(tutor);
        return safeSend(bot, chatId, profileMessage + '\n\nWhat would you like to edit?', {
          parse_mode: 'Markdown',
          reply_markup: getMainEditProfileMenu(tutor)
        });
      }

      // Personal info editing
      if (data === 'edit_personal_info') {
        return safeSend(bot, chatId, 'Select field to edit:', {
          reply_markup: getPersonalInfoMenu(tutor)
        });
      }

      // Individual field editing
      if (data.startsWith('edit_') && ['fullName', 'email'].includes(data.replace('edit_', ''))) {
        const field = data.replace('edit_', '');
        userSessions[chatId].state = `awaiting_${field}`;
        return safeSend(bot, chatId, `Please enter your ${field}:`);
      }

      // Menu handlers for dropdowns
      if (data === 'edit_gender_menu') {
        return safeSend(bot, chatId, 'Select your gender:', {
          reply_markup: getGenderMenu()
        });
      }

      if (data === 'edit_race_menu') {
        return safeSend(bot, chatId, 'Select your race:', {
          reply_markup: getRaceMenu()
        });
      }

      if (data === 'edit_education_menu') {
        return safeSend(bot, chatId, 'Select your highest education:', {
          reply_markup: getEducationMenu()
        });
      }

      // Set values for dropdown selections
      if (data.startsWith('set_gender_')) {
        const value = data.replace('set_gender_', '');
        tutor.gender = value.charAt(0).toUpperCase() + value.slice(1);
        await tutor.save();
        
        await safeSend(bot, chatId, `✅ Gender updated to ${tutor.gender}!`);
        return safeSend(bot, chatId, 'Select field to edit:', {
          reply_markup: getPersonalInfoMenu(tutor)
        });
      }

      if (data.startsWith('set_race_')) {
        const value = data.replace('set_race_', '');
        tutor.race = value.charAt(0).toUpperCase() + value.slice(1);
        await tutor.save();
        
        await safeSend(bot, chatId, `✅ Race updated to ${tutor.race}!`);
        return safeSend(bot, chatId, 'Select field to edit:', {
          reply_markup: getPersonalInfoMenu(tutor)
        });
      }

      if (data.startsWith('set_education_')) {
        const value = data.replace('set_education_', '');
        const educationMap = {
          'alevels': 'A Levels',
          'diploma': 'Diploma',
          'degree': 'Degree',
          'masters': 'Masters',
          'phd': 'PhD',
          'others': 'Others'
        };
        tutor.highestEducation = educationMap[value] || value;
        await tutor.save();
        
        await safeSend(bot, chatId, `✅ Education updated to ${tutor.highestEducation}!`);
        return safeSend(bot, chatId, 'Select field to edit:', {
          reply_markup: getPersonalInfoMenu(tutor)
        });
      }

      // Teaching levels
      if (data === 'edit_teaching_levels') {
        return safeSend(bot, chatId, 'Select teaching level to edit:', {
          reply_markup: getTeachingLevelsMenu(tutor)
        });
      }

      // Subject menus
      if (data === 'edit_primary_subjects') {
        return safeSend(bot, chatId, 'Select Primary subjects you can teach:', {
          reply_markup: getPrimarySubjectsMenu(tutor)
        });
      }

      if (data === 'edit_secondary_subjects') {
        return safeSend(bot, chatId, 'Select Secondary subjects you can teach:', {
          reply_markup: getSecondarySubjectsMenu(tutor)
        });
      }

      if (data === 'edit_jc_subjects') {
        return safeSend(bot, chatId, 'Select JC subjects you can teach:', {
          reply_markup: getJCSubjectsMenu(tutor)
        });
      }

      if (data === 'edit_international_subjects') {
        return safeSend(bot, chatId, 'Select International subjects you can teach:', {
          reply_markup: getInternationalSubjectsMenu(tutor)
        });
      }

      // Toggle subjects
      if (data.startsWith('toggle_primary_')) {
        const subject = data.replace('toggle_primary_', '');
        initializeTeachingLevels(tutor);
        tutor.teachingLevels.primary[subject] = !tutor.teachingLevels.primary[subject];
        await tutor.save();
        
        return safeSend(bot, chatId, 'Select Primary subjects you can teach:', {
          reply_markup: getPrimarySubjectsMenu(tutor)
        });
      }

      if (data.startsWith('toggle_secondary_')) {
        const subject = data.replace('toggle_secondary_', '');
        initializeTeachingLevels(tutor);
        tutor.teachingLevels.secondary[subject] = !tutor.teachingLevels.secondary[subject];
        await tutor.save();
        
        return safeSend(bot, chatId, 'Select Secondary subjects you can teach:', {
          reply_markup: getSecondarySubjectsMenu(tutor)
        });
      }

      if (data.startsWith('toggle_jc_')) {
        const subject = data.replace('toggle_jc_', '');
        initializeTeachingLevels(tutor);
        tutor.teachingLevels.jc[subject] = !tutor.teachingLevels.jc[subject];
        await tutor.save();
        
        return safeSend(bot, chatId, 'Select JC subjects you can teach:', {
          reply_markup: getJCSubjectsMenu(tutor)
        });
      }

      if (data.startsWith('toggle_international_')) {
        const subject = data.replace('toggle_international_', '');
        initializeTeachingLevels(tutor);
        tutor.teachingLevels.international[subject] = !tutor.teachingLevels.international[subject];
        await tutor.save();
        
        return safeSend(bot, chatId, 'Select International subjects you can teach:', {
          reply_markup: getInternationalSubjectsMenu(tutor)
        });
      }

      // Locations
      if (data === 'edit_locations') {
        return safeSend(bot, chatId, 'Select locations where you can teach:', {
          reply_markup: getLocationsMenu(tutor)
        });
      }

      if (data.startsWith('toggle_location_')) {
        const location = data.replace('toggle_location_', '');
        initializeLocations(tutor);
        tutor.locations[location] = !tutor.locations[location];
        await tutor.save();
        
        return safeSend(bot, chatId, 'Select locations where you can teach:', {
          reply_markup: getLocationsMenu(tutor)
        });
      }

      // Availability
      if (data === 'edit_availability') {
        return safeSend(bot, chatId, 'Select your available time slots:', {
          reply_markup: getAvailabilityMenu(tutor)
        });
      }

      if (data.startsWith('toggle_availability_')) {
        const slot = data.replace('toggle_availability_', '');
        initializeAvailability(tutor);
        tutor.availableTimeSlots[slot] = !tutor.availableTimeSlots[slot];
        await tutor.save();
        
        return safeSend(bot, chatId, 'Select your available time slots:', {
          reply_markup: getAvailabilityMenu(tutor)
        });
      }

      // Hourly rates
      if (data === 'edit_hourly_rates') {
        if (!tutor.hourlyRate) tutor.hourlyRate = {};
        return safeSend(bot, chatId, 'Select rate to edit:', {
          reply_markup: getHourlyRatesMenu(tutor)
        });
      }

      if (data.startsWith('edit_rate_')) {
        const level = data.replace('edit_rate_', '');
        userSessions[chatId].state = `awaiting_rate_${level}`;
        return safeSend(bot, chatId, `Please enter your hourly rate for ${level} level (numbers only):`);
      }

      // If no handler matched, log and provide fallback
      console.log(`⚠️ Unhandled callback query: ${data}`);
      return safeSend(bot, chatId, 'Sorry, I didn\'t understand that action. Please try again.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Main Menu', callback_data: 'main_menu' }]]
        }
      });

    } catch (err) {
      console.error('Error handling callback query:', err);
      return safeSend(bot, chatId, 'There was an error processing your request. Please try again later.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Main Menu', callback_data: 'main_menu' }]]
        }
      });
    }
  }

  // Handle unrecognized messages
  if (update.message && !update.message.contact && update.message.text !== '/start') {
    const chatId = update.message.chat.id;
    
    // If user has an active session, provide context-appropriate help
    if (userSessions[chatId]?.state === 'main_menu') {
      return safeSend(bot, chatId, 'I didn\'t understand that. Please use the menu buttons below.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Main Menu', callback_data: 'main_menu' }]]
        }
      });
    } else {
      return safeSend(bot, chatId, 'Please start by sharing your phone number or use /start to begin.', {
        reply_markup: {
          keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
          one_time_keyboard: true,
        },
      });
    }
  }
}