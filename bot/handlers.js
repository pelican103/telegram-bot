function normalizePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  const variations = [
    cleaned,
    cleaned.startsWith('65') ? cleaned.substring(2) : '65' + cleaned,
    cleaned.startsWith('65') ? cleaned : '65' + cleaned
  ];
  return [...new Set(variations)];
}

function parseNaturalDate(dateString) {
  const today = new Date();
  const normalizedDate = dateString.toLowerCase().trim();
  
  // Handle "next monday", "next tuesday", etc.
  const nextDayMatch = normalizedDate.match(/^next\s+(\w+)$/);
  if (nextDayMatch) {
    const dayName = nextDayMatch[1];
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = daysOfWeek.indexOf(dayName);
    
    if (targetDay !== -1) {
      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysToAdd);
      return targetDate;
    }
  }
  
  // Handle other natural language patterns
  switch (normalizedDate) {
    case 'today':
      return new Date();
    case 'tomorrow':
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      return tomorrow;
    case 'next week':
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return nextWeek;
    default:
      // Try to parse as regular date
      const parsedDate = new Date(dateString);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Unable to parse date: ${dateString}`);
      }
      return parsedDate;
  }
}

function validateLevel(level) {
  const validLevels = [
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'Secondary 1', 'Secondary 2', 'Secondary 3', 'Secondary 4', 'Secondary 5',
    'JC 1', 'JC 2', 'Polytechnic', 'University', 'Adult Learning'
  ];
  
  // Try to normalize the input
  const normalizedLevel = level.trim();
  
  // Check for exact match
  if (validLevels.includes(normalizedLevel)) {
    return normalizedLevel;
  }
  
  // Try to fix common variations
  const levelMap = {
    'primary 6': 'Primary 6',
    'p6': 'Primary 6',
    'sec 1': 'Secondary 1',
    's1': 'Secondary 1',
    'junior college 1': 'JC 1',
    // Add more mappings as needed
  };
  
  const mapped = levelMap[normalizedLevel.toLowerCase()];
  if (mapped) {
    return mapped;
  }
  
  throw new Error(`Invalid level: ${level}. Valid options are: ${validLevels.join(', ')}`);
}

function validateFrequency(frequency) {
  const validFrequencies = [
    'Once a week', 'Twice a week', '3 times a week', 
    '4 times a week', '5 times a week', 'Daily', 'Flexible'
  ];
  
  // Try to normalize the input
  const normalizedFreq = frequency.trim();
  
  // Check for exact match
  if (validFrequencies.includes(normalizedFreq)) {
    return normalizedFreq;
  }
  
  // Try to fix common variations
  const frequencyMap = {
    '2 times per week': 'Twice a week',
    '2 times a week': 'Twice a week',
    'twice per week': 'Twice a week',
    '1 time per week': 'Once a week',
    'once per week': 'Once a week',
    '3x per week': '3 times a week',
    'thrice a week': '3 times a week',
    // Add more mappings as needed
  };
  
  const mapped = frequencyMap[normalizedFreq.toLowerCase()];
  if (mapped) {
    return mapped;
  }
  
  throw new Error(`Invalid frequency: ${frequency}. Valid options are: ${validFrequencies.join(', ')}`);
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
  msg += `*Frequency:* ${assignment.frequency}\n`;
  msg += `*Duration:* ${assignment.duration}\n`;
  msg += `*Start Date:* ${assignment.startDate}\n`;
  
  if (assignment.description) {
    msg += `\n*Description:* ${assignment.description}\n`;
  }
  
  msg += `\n*Status:* ${assignment.status}`;
  return msg;
}

// Format assignment for channel posting
function formatAssignmentForChannel(assignment, botUsername) {
  let msg = `🎯 *NEW TUTORING ASSIGNMENT*\n\n`;
  msg += `📚 *Level:* ${assignment.level}\n`;
  msg += `📖 *Subject:* ${assignment.subject}\n`;
  msg += `📍 *Location:* ${assignment.location}\n`;
  msg += `💰 *Rate:* $${assignment.rate}/${assignment.rateType || 'hour'}\n`;
  msg += `👥 *Students:* ${assignment.studentCount || 1}\n`;
  msg += `📅 *Frequency:* ${assignment.frequency}\n`;
  msg += `⏱️ *Duration:* ${assignment.duration}\n`;
  msg += `🚀 *Start Date:* ${assignment.startDate}\n`;
  
  if (assignment.description) {
    msg += `\n📝 *Description:* ${assignment.description}\n`;
  }
  
  msg += `\n💼 *Status:* ${assignment.status}`;
  msg += `\n\n👆 *Click below to apply for this assignment!*`;
  
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

// Check if user is admin
function isAdmin(userId, ADMIN_USERS) {
  return ADMIN_USERS && ADMIN_USERS.includes(userId.toString());
}

// Handle initial start and contact sharing
async function handleStart(bot, chatId, userId, Tutor, userSessions, startParam = null) {
  try {
    // Check if tutor exists in database
    let tutor = await Tutor.findOne({ userId: userId });
    
    if (!tutor) {
      // New user - request contact number
      await safeSend(bot, chatId, '👋 Welcome! To get started, please share your contact number by clicking the button below.', {
        reply_markup: {
          keyboard: [[{
            text: '📞 Share Contact Number',
            request_contact: true
          }]],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
      
      // Set state to waiting for contact
      userSessions[chatId] = { 
        state: 'awaiting_contact',
        startParam: startParam 
      };
      return;
    }
    
    // Existing user - set up session
    userSessions[chatId] = { tutorId: tutor._id };
    
    if (startParam) {
      await handleStartParameter(bot, chatId, userId, startParam, Assignment, Tutor, userSessions, ADMIN_USERS);
      return;
    }
    
    // Show welcome message with profile info
    const profileMsg = formatTutorProfile(tutor);
    await safeSend(bot, chatId, `Welcome back!\n\n${profileMsg}`, { parse_mode: 'Markdown' });
    
    // Show main menu
    await showMainMenu(chatId, bot, userId, ADMIN_USERS);
    
  } catch (error) {
    console.error('Error handling start:', error);
    await safeSend(bot, chatId, 'There was an error setting up your account. Please try again.');
  }
}

// Handle contact sharing
async function handleContact(bot, chatId, userId, contact, Tutor, userSessions, ADMIN_USERS) {
  try {
    const phoneNumber = contact.phone_number;
    const phoneVariations = normalizePhone(phoneNumber);
    
    // Find existing tutor by phone number variations
    let tutor = await Tutor.findOne({
      contactNumber: { $in: phoneVariations }
    });
    
    if (!tutor) {
      // Create new tutor
      tutor = new Tutor({
        userId: userId,
        chatId: chatId,
        contactNumber: phoneNumber,
        fullName: contact.first_name + (contact.last_name ? ' ' + contact.last_name : '')
      });
      await tutor.save();
      
      await safeSend(bot, chatId, 'Account created successfully! Please complete your profile to start applying for assignments.', {
        reply_markup: { remove_keyboard: true }
      });
    } else {
      // Update existing tutor with new chatId and userId
      tutor.chatId = chatId;
      tutor.userId = userId;
      if (!tutor.fullName && contact.first_name) {
        tutor.fullName = contact.first_name + (contact.last_name ? ' ' + contact.last_name : '');
      }
      await tutor.save();
      
      await safeSend(bot, chatId, 'Welcome back! Your profile has been linked.', {
        reply_markup: { remove_keyboard: true }
      });
    }
    
    // Set up session
    userSessions[chatId] = { tutorId: tutor._id };
    
    // Handle start parameter if exists
    const startParam = userSessions[chatId].startParam;
    if (startParam) {
      delete userSessions[chatId].startParam;
      await handleStartParameter(bot, chatId, userId, startParam, Assignment, Tutor, userSessions, ADMIN_USERS);
      return;
    }
    
    // Show profile and main menu
    const profileMsg = formatTutorProfile(tutor);
    await safeSend(bot, chatId, `Your Profile:\n\n${profileMsg}`, { parse_mode: 'Markdown' });
    await showMainMenu(chatId, bot, userId, ADMIN_USERS);
    
  } catch (error) {
    console.error('Error handling contact:', error);
    await safeSend(bot, chatId, 'There was an error setting up your account. Please try again.');
  }
}

// Main menu function
function showMainMenu(chatId, bot, userId, ADMIN_USERS) {
  const isUserAdmin = isAdmin(userId, ADMIN_USERS);
  
  const keyboard = [
    [{ text: '📋 View Available Assignments', callback_data: 'view_assignments' }],
    [{ text: '📝 My Applications', callback_data: 'view_applications' }],
    [{ text: '👤 Update Profile', callback_data: 'profile_edit' }]
  ];

  if (isUserAdmin) {
    keyboard.push([{ text: '⚙️ Admin Panel', callback_data: 'admin_panel' }]);
  }

  return safeSend(bot, chatId, 'Main Menu - What would you like to do?', {
    reply_markup: { inline_keyboard: keyboard }
  });
}

// Admin panel menu
function showAdminPanel(chatId, bot) {
  return safeSend(bot, chatId, '⚙️ Admin Panel - What would you like to do?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎯 Post New Assignment', callback_data: 'admin_post_assignment' }],
        [{ text: '📊 View All Applications', callback_data: 'admin_view_all_applications' }],
        [{ text: '📋 Manage Assignments', callback_data: 'admin_manage_assignments' }],
        [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Assignment creation flow - step by step
async function startAssignmentCreation(bot, chatId, userSessions) {
  userSessions[chatId] = {
    ...userSessions[chatId],
    state: 'creating_assignment',
    assignmentData: {},
    currentStep: 'title'
  };
  
  await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 1 of 9: Enter the assignment title:', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
    }
  });
}

// Handle assignment creation steps
async function handleAssignmentStep(bot, chatId, text, userSessions) {
  const session = userSessions[chatId];
  const { currentStep, assignmentData } = session;
  
  try {
    switch (currentStep) {
      case 'title':
        assignmentData.title = text.trim();
        session.currentStep = 'level';
        await safeSend(bot, chatId, '📚 Step 2 of 9: Enter the level (e.g., Primary 6, Secondary 3, JC 1):', {
          reply_markup: {// Continuing from where the code was cut off...

            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
        
      case 'level':
        try {
          assignmentData.level = validateLevel(text);
          session.currentStep = 'subject';
          await safeSend(bot, chatId, '📖 Step 3 of 9: Enter the subject (e.g., Math, English, Physics):', {
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        } catch (error) {
          await safeSend(bot, chatId, `❌ ${error.message}\n\nPlease enter a valid level:`);
        }
        break;
        
      case 'subject':
        assignmentData.subject = text.trim();
        session.currentStep = 'location';
        await safeSend(bot, chatId, '📍 Step 4 of 9: Enter the location (e.g., Jurong West, Tampines, Online):', {
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
        
      case 'location':
        assignmentData.location = text.trim();
        session.currentStep = 'rate';
        await safeSend(bot, chatId, '💰 Step 5 of 9: Enter the hourly rate (number only, e.g., 25):', {
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
        
      case 'rate':
        const rate = parseFloat(text);
        if (isNaN(rate) || rate <= 0) {
          await safeSend(bot, chatId, '❌ Please enter a valid hourly rate (number only):');
          return;
        }
        assignmentData.rate = rate;
        session.currentStep = 'frequency';
        await safeSend(bot, chatId, '📅 Step 6 of 9: Enter the frequency (e.g., "Once a week", "Twice a week", "3 times a week"):', {
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
        
      case 'frequency':
        try {
          assignmentData.frequency = validateFrequency(text);
          session.currentStep = 'duration';
          await safeSend(bot, chatId, '⏱️ Step 7 of 9: Enter the duration per session (e.g., "1.5 hours", "2 hours"):', {
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        } catch (error) {
          await safeSend(bot, chatId, `❌ ${error.message}\n\nPlease enter a valid frequency:`);
        }
        break;
        
      case 'duration':
        assignmentData.duration = text.trim();
        session.currentStep = 'startDate';
        await safeSend(bot, chatId, '🚀 Step 8 of 9: Enter the start date (e.g., "next Monday", "tomorrow", "2024-12-15"):', {
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
        
      case 'startDate':
        try {
          const startDate = parseNaturalDate(text);
          assignmentData.startDate = startDate.toDateString();
          session.currentStep = 'description';
          await safeSend(bot, chatId, '📝 Step 9 of 9: Enter additional description (or type "skip" to skip):', {
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        } catch (error) {
          await safeSend(bot, chatId, `❌ ${error.message}\n\nPlease enter a valid start date:`);
        }
        break;
        
      case 'description':
        if (text.toLowerCase().trim() !== 'skip') {
          assignmentData.description = text.trim();
        }
        
        // Create the assignment
        await createAssignment(bot, chatId, assignmentData, userSessions);
        break;
    }
  } catch (error) {
    console.error('Error in assignment step:', error);
    await safeSend(bot, chatId, 'There was an error processing your input. Please try again.');
  }
}

// Create assignment and post to channel
async function createAssignment(bot, chatId, assignmentData, userSessions) {
  try {
    // Create assignment object
    const assignment = new Assignment({
      title: assignmentData.title,
      level: assignmentData.level,
      subject: assignmentData.subject,
      location: assignmentData.location,
      rate: assignmentData.rate,
      rateType: 'hour',
      frequency: assignmentData.frequency,
      duration: assignmentData.duration,
      startDate: assignmentData.startDate,
      description: assignmentData.description || '',
      status: 'Open',
      studentCount: assignmentData.studentCount || 1,
      createdAt: new Date(),
      applications: []
    });
    
    await assignment.save();
    
    // Format assignment for admin confirmation
    const assignmentMsg = formatAssignment(assignment);
    
    await safeSend(bot, chatId, `✅ Assignment created successfully!\n\n${assignmentMsg}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Post to Channel', callback_data: `post_to_channel_${assignment._id}` }],
          [{ text: '🔙 Back to Admin Panel', callback_data: 'admin_panel' }]
        ]
      }
    });
    
    // Clear session
    delete userSessions[chatId].state;
    delete userSessions[chatId].assignmentData;
    delete userSessions[chatId].currentStep;
    
  } catch (error) {
    console.error('Error creating assignment:', error);
    await safeSend(bot, chatId, 'There was an error creating the assignment. Please try again.');
  }
}

// Post assignment to channel
async function postAssignmentToChannel(bot, chatId, assignmentId, CHANNEL_ID, BOT_USERNAME) {
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      await safeSend(bot, chatId, 'Assignment not found.');
      return;
    }
    
    const channelMsg = formatAssignmentForChannel(assignment, BOT_USERNAME);
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🎯 Apply for this Assignment', url: `https://t.me/${BOT_USERNAME}?start=apply_${assignment._id}` }]
      ]
    };
    
    await bot.sendMessage(CHANNEL_ID, channelMsg, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
    await safeSend(bot, chatId, '✅ Assignment posted to channel successfully!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back to Admin Panel', callback_data: 'admin_panel' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error posting to channel:', error);
    await safeSend(bot, chatId, 'There was an error posting to the channel. Please try again.');
  }
}

// Handle start parameter (for assignment applications)
async function handleStartParameter(bot, chatId, userId, startParam, Assignment, Tutor, userSessions, ADMIN_USERS) {
  try {
    if (startParam.startsWith('apply_')) {
      const assignmentId = startParam.replace('apply_', '');
      
      // Check if tutor profile exists and is complete
      const tutor = await Tutor.findOne({ userId: userId });
      if (!tutor) {
        await safeSend(bot, chatId, '👋 Welcome! To apply for assignments, you need to set up your profile first. Please share your contact number to get started.', {
          reply_markup: {
            keyboard: [[{
              text: '📞 Share Contact Number',
              request_contact: true
            }]],
            one_time_keyboard: true,
            resize_keyboard: true
          }
        });
        
        userSessions[chatId] = { 
          state: 'awaiting_contact',
          pendingAssignmentId: assignmentId 
        };
        return;
      }
      
      // Set up session
      userSessions[chatId] = { tutorId: tutor._id };
      
      // Show assignment and apply
      await handleAssignmentApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions, ADMIN_USERS);
    }
  } catch (error) {
    console.error('Error handling start parameter:', error);
    await safeSend(bot, chatId, 'There was an error processing your request. Please try again.');
  }
}

// Handle assignment application
async function handleAssignmentApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions, ADMIN_USERS) {
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      await safeSend(bot, chatId, 'Assignment not found or no longer available.');
      return;
    }
    
    if (assignment.status !== 'Open') {
      await safeSend(bot, chatId, 'This assignment is no longer accepting applications.');
      return;
    }
    
    const tutor = await Tutor.findOne({ userId: userId });
    if (!tutor) {
      await safeSend(bot, chatId, 'Please complete your profile first before applying.');
      return;
    }
    
    // Check if already applied
    const existingApplication = assignment.applications.find(app => app.tutorId.toString() === tutor._id.toString());
    if (existingApplication) {
      await safeSend(bot, chatId, `You have already applied for this assignment. Status: ${existingApplication.status}`);
      return;
    }
    
    // Show assignment details
    const assignmentMsg = formatAssignment(assignment);
    await safeSend(bot, chatId, assignmentMsg, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Confirm Application', callback_data: `confirm_apply_${assignmentId}` }],
          [{ text: '❌ Cancel', callback_data: 'view_assignments' }]
        ]
      }
    });
    
  } catch (error) {
    console.error('Error handling assignment application:', error);
    await safeSend(bot, chatId, 'There was an error processing your application. Please try again.');
  }
}

// Handle confirmed application
async function handleConfirmApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions) {
  try {
    const assignment = await Assignment.findById(assignmentId);
    const tutor = await Tutor.findOne({ userId: userId });
    
    if (!assignment || !tutor) {
      await safeSend(bot, chatId, 'Assignment or profile not found.');
      return;
    }
    
    // Add application to assignment
    assignment.applications.push({
      tutorId: tutor._id,
      tutorName: tutor.fullName,
      tutorContact: tutor.contactNumber,
      appliedAt: new Date(),
      status: 'Pending'
    });
    
    await assignment.save();
    
    await safeSend(bot, chatId, '✅ Application submitted successfully! You will be notified when the admin reviews your application.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 View My Applications', callback_data: 'view_applications' }],
          [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
    
    // Notify admins (optional)
    // You can implement admin notification here
    
  } catch (error) {
    console.error('Error confirming application:', error);
    await safeSend(bot, chatId, 'There was an error submitting your application. Please try again.');
  }
}

// Show available assignments
async function showAssignments(chatId, bot, Assignment, userSessions, page = 1) {
  try {
    const limit = ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;
    
    const assignments = await Assignment.find({ status: 'Open' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalCount = await Assignment.countDocuments({ status: 'Open' });
    const totalPages = Math.ceil(totalCount / limit);
    
    if (assignments.length === 0) {
      await safeSend(bot, chatId, 'No assignments available at the moment.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        }
      });
      return;
    }
    
    let msg = `📋 *Available Assignments* (Page ${page}/${totalPages})\n\n`;
    
    const keyboard = [];
    assignments.forEach((assignment, index) => {
      msg += `${skip + index + 1}. *${assignment.title}*\n`;
      msg += `   📚 ${assignment.level} - ${assignment.subject}\n`;
      msg += `   📍 ${assignment.location}\n`;
      msg += `   💰 $${assignment.rate}/hour\n`;
      msg += `   📅 ${assignment.frequency}\n\n`;
      
      keyboard.push([{ text: `🎯 Apply - ${assignment.title}`, callback_data: `apply_${assignment._id}` }]);
    });
    
    // Add pagination buttons
    const paginationRow = [];
    if (page > 1) {
      paginationRow.push({ text: '⬅️ Previous', callback_data: `assignments_page_${page - 1}` });
    }
    if (page < totalPages) {
      paginationRow.push({ text: 'Next ➡️', callback_data: `assignments_page_${page + 1}` });
    }
    
    if (paginationRow.length > 0) {
      keyboard.push(paginationRow);
    }
    
    keyboard.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);
    
    await safeSend(bot, chatId, msg, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
    
  } catch (error) {
    console.error('Error showing assignments:', error);
    await safeSend(bot, chatId, 'There was an error loading assignments. Please try again.');
  }
}

// Show user's applications
async function showApplications(chatId, bot, Assignment, userSessions, page = 1) {
  try {
    const userSession = userSessions[chatId];
    if (!userSession || !userSession.tutorId) {
      await safeSend(bot, chatId, 'Your session has expired. Please start again with /start');
      return;
    }
    
    const limit = ITEMS_PER_PAGE;
    const skip = (page - 1) * limit;
    
    const assignments = await Assignment.find({
      'applications.tutorId': userSession.tutorId
    }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    
    const totalCount = await Assignment.countDocuments({
      'applications.tutorId': userSession.tutorId
    });
    const totalPages = Math.ceil(totalCount / limit);
    
    if (assignments.length === 0) {
      await safeSend(bot, chatId, 'You have not applied for any assignments yet.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 View Available Assignments', callback_data: 'view_assignments' }],
            [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
          ]
        }
      });
      return;
    }
    
    let msg = `📝 *My Applications* (Page ${page}/${totalPages})\n\n`;
    
    assignments.forEach((assignment, index) => {
      const application = assignment.applications.find(app => app.tutorId.toString() === userSession.tutorId);
      msg += `${skip + index + 1}. *${assignment.title}*\n`;
      msg += `   📚 ${assignment.level} - ${assignment.subject}\n`;
      msg += `   📍 ${assignment.location}\n`;
      msg += `   💰 $${assignment.rate}/hour\n`;
      msg += `   ⭐ Status: ${application.status}\n\n`;
    });
    
    const keyboard = [];
    
    // Add pagination buttons
    const paginationRow = [];
    if (page > 1) {
      paginationRow.push({ text: '⬅️ Previous', callback_data: `applications_page_${page - 1}` });
    }
    if (page < totalPages) {
      paginationRow.push({ text: 'Next ➡️', callback_data: `applications_page_${page + 1}` });
    }
    
    if (paginationRow.length > 0) {
      keyboard.push(paginationRow);
    }
    
    keyboard.push([{ text: '🏠 Main Menu', callback_data: 'main_menu' }]);
    
    await safeSend(bot, chatId, msg, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
    
  } catch (error) {
    console.error('Error showing applications:', error);
    await safeSend(bot, chatId, 'There was an error loading your applications. Please try again.');
  }
}

// Export all functions
export default {
  normalizePhone,
  parseNaturalDate,
  validateLevel,
  validateFrequency,
  initializeTeachingLevels,
  initializeAvailability,
  initializeLocations,
  getTick,
  formatTutorProfile,
  formatAssignment,
  formatAssignmentForChannel,
  getMainEditProfileMenu,
  getPersonalInfoMenu,
  getTeachingLevelsMenu,
  getLocationsMenu,
  getAvailabilityMenu,
  getPrimarySubjectsMenu,
  getSecondarySubjectsMenu,
  getJCSubjectsMenu,
  getInternationalSubjectsMenu,
  getGenderMenu,
  getRaceMenu,
  getEducationMenu,
  getHourlyRatesMenu,
  safeSend,
  isAdmin,
  handleStart,
  handleContact,
  showMainMenu,
  showAdminPanel,
  startAssignmentCreation,
  handleAssignmentStep,
  createAssignment,
  postAssignmentToChannel,
  handleStartParameter,
  handleAssignmentApplication,
  handleConfirmApplication,
  showAssignments,
  showApplications
};