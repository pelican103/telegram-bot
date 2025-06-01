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
        assignmentData.title = text;
        session.currentStep = 'level';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 2 of 9: Enter the education level (e.g., Primary 6, Secondary 1, JC 2):', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'level':
        try {
          assignmentData.level = validateLevel(text);
          session.currentStep = 'subject';
          
          await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 3 of 9: Enter the subject:', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        } catch (error) {
          await safeSend(bot, chatId, `❌ ${error.message}\n\nPlease enter a valid education level:`, {
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        }
        break;
      
      case 'subject':
        assignmentData.subject = text;
        session.currentStep = 'location';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 4 of 9: Enter the location:', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'location':
        assignmentData.location = text;
        session.currentStep = 'rate';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 5 of 9: Enter the hourly rate (numbers only, e.g., 50):', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'rate':
        const rate = parseInt(text);
        if (isNaN(rate) || rate <= 0) {
          await safeSend(bot, chatId, '❌ Please enter a valid hourly rate (numbers only):');
          return;
        }
        assignmentData.rate = rate;
        session.currentStep = 'frequency';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 6 of 9: Enter the frequency (e.g., Once a week, Twice a week):', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'frequency':
        try {
          assignmentData.frequency = validateFrequency(text);
          session.currentStep = 'duration';
          
          await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 7 of 9: Enter the session duration (e.g., 1.5 hours, 2 hours):', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        } catch (error) {
          await safeSend(bot, chatId, `❌ ${error.message}\n\nPlease enter a valid frequency:`, {
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        }
        break;
      
      case 'duration':
        assignmentData.duration = text;
        session.currentStep = 'startDate';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 8 of 9: Enter the start date (e.g., today, tomorrow, next monday, 2024-12-15):', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'startDate':
        try {
          const startDate = parseNaturalDate(text);
          assignmentData.startDate = startDate.toLocaleDateString('en-SG');
          session.currentStep = 'description';
          
          await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 9 of 9: Enter additional description (or type "skip" to skip):', {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        } catch (error) {
          await safeSend(bot, chatId, `❌ ${error.message}\n\nPlease enter a valid date:`, {
            reply_markup: {
              inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
            }
          });
        }
        break;
      
      case 'description':
        if (text.toLowerCase() !== 'skip') {
          assignmentData.description = text;
        }
        
        // Show confirmation
        assignmentData.status = 'Open';
        assignmentData.studentCount = 1;
        assignmentData.rateType = 'hour';
        
        const confirmationMsg = formatAssignment(assignmentData);
        await safeSend(bot, chatId, `📋 *Assignment Preview*\n\n${confirmationMsg}\n\nIs this correct?`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Post Assignment', callback_data: 'confirm_post_assignment' }],
              [{ text: '❌ Cancel', callback_data: 'admin_panel' }]
            ]
          }
        });
        break;
    }
  } catch (error) {
    console.error('Error in assignment step:', error);
    await safeSend(bot, chatId, '❌ An error occurred. Please try again.');
    delete userSessions[chatId].state;
    delete userSessions[chatId].assignmentData;
    delete userSessions[chatId].currentStep;
  }
}

// Post assignment to channel
async function postAssignmentToChannel(bot, assignment, channelId, botUsername) {
  try {
    const message = formatAssignmentForChannel(assignment, botUsername);
    
    const result = await bot.sendMessage(channelId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '📝 Apply for this Assignment', url: `https://t.me/${botUsername}?start=apply_${assignment._id}` }
        ]]
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error posting to channel:', error);
    throw error;
  }
}

// Handle assignment applications
async function handleApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions) {
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      await safeSend(bot, chatId, '❌ Assignment not found or may have been removed.');
      return;
    }
    
    if (assignment.status !== 'Open') {
      await safeSend(bot, chatId, '❌ This assignment is no longer available.');
      return;
    }
    
    // Check if user already applied
    const existingApplication = assignment.applications.find(app => app.tutorId.toString() === userSessions[chatId].tutorId);
    if (existingApplication) {
      await safeSend(bot, chatId, '⚠️ You have already applied for this assignment.');
      return;
    }
    
    // Get tutor details
    const tutor = await Tutor.findById(userSessions[chatId].tutorId);
    if (!tutor) {
      await safeSend(bot, chatId, '❌ Please complete your profile before applying.');
      return;
    }
    
    // Add application
    assignment.applications.push({
      tutorId: tutor._id,
      tutorName: tutor.fullName,
      tutorContact: tutor.contactNumber,
      appliedAt: new Date()
    });
    
    await assignment.save();
    
    const assignmentMsg = formatAssignment(assignment);
    await safeSend(bot, chatId, `✅ *Application Submitted Successfully!*\n\n${assignmentMsg}`, {
      parse_mode: 'Markdown'
    });
    
    // Show main menu
    await showMainMenu(chatId, bot, userId, process.env.ADMIN_USERS?.split(',') || []);
    
  } catch (error) {
    console.error('Error handling application:', error);
    await safeSend(bot, chatId, '❌ An error occurred while submitting your application. Please try again.');
  }
}

// Handle start parameters (for assignment applications)
async function handleStartParameter(bot, chatId, userId, startParam, Assignment, Tutor, userSessions, ADMIN_USERS) {
  try {
    if (startParam.startsWith('apply_')) {
      const assignmentId = startParam.replace('apply_', '');
      await handleApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions);
    } else {
      // Show main menu for unknown parameters
      await showMainMenu(chatId, bot, userId, ADMIN_USERS);
    }
  } catch (error) {
    console.error('Error handling start parameter:', error);
    await safeSend(bot, chatId, '❌ An error occurred. Please try again.');
    await showMainMenu(chatId, bot, userId, ADMIN_USERS);
  }
}

// View assignments with pagination
async function viewAssignments(bot, chatId, page = 0, Assignment) {
  try {
    const totalAssignments = await Assignment.countDocuments({ status: 'Open' });
    const assignments = await Assignment.find({ status: 'Open' })
      .skip(page * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .sort({ createdAt: -1 });
    
    if (assignments.length === 0) {
      await safeSend(bot, chatId, '📋 No assignments available at the moment. Check back later!', {
        reply_markup: {
          inline_keyboard: [[{ text: '🏠 Back to Main Menu', callback_data: 'main_menu' }]]
        }
      });
      return;
    }
    
    // Create pagination buttons
    const buttons = [];
    const totalPages = Math.ceil(totalAssignments / ITEMS_PER_PAGE);
    
    if (totalPages > 1) {
      const paginationRow = [];
      if (page > 0) {
        paginationRow.push({ text: '⬅️ Previous', callback_data: `assignments_page_${page - 1}` });
      }
      if (page < totalPages - 1) {
        paginationRow.push({ text: 'Next ➡️', callback_data: `assignments_page_${page + 1}` });
      }
      if (paginationRow.length > 0) {
        buttons.push(paginationRow);
      }
    }
    
    buttons.push([{ text: '🏠 Back to Main Menu', callback_data: 'main_menu' }]);
    
    // Format assignments message
    let message = `📋 *Available Assignments* (Page ${page + 1}/${totalPages})\n\n`;
    
    assignments.forEach((assignment, index) => {
      const assignmentNum = page * ITEMS_PER_PAGE + index + 1;
      message += `*${assignmentNum}. ${assignment.title || 'Assignment'}*\n`;
      message += `📚 Level: ${assignment.level}\n`;
      message += `📖 Subject: ${assignment.subject}\n`;
      message += `📍 Location: ${assignment.location}\n`;
      message += `💰 Rate: $${assignment.rate}/${assignment.rateType || 'hour'}\n`;
      message += `📅 Frequency: ${assignment.frequency}\n`;
      message += `🚀 Start: ${assignment.startDate}\n`;
      
      // Add apply button for each assignment
      buttons.splice(-1, 0, [{ text: `📝 Apply for Assignment ${assignmentNum}`, callback_data: `apply_${assignment._id}` }]);
      
      message += '\n';
    });
    
    await safeSend(bot, chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons }
    });
    
  } catch (error) {
    console.error('Error viewing assignments:', error);
    await safeSend(bot, chatId, '❌ An error occurred while loading assignments. Please try again.');
  }
}

// View user's applications
async function viewMyApplications(bot, chatId, userSessions, Assignment) {
  try {
    const tutorId = userSessions[chatId].tutorId;
    const assignments = await Assignment.find({
      'applications.tutorId': tutorId
    }).sort({ createdAt: -1 });
    
    if (assignments.length === 0) {
      await safeSend(bot, chatId, '📋 You haven\'t applied for any assignments yet.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 View Available Assignments', callback_data: 'view_assignments' }],
            [{ text: '🏠 Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      });
      return;
    }
    
    let message = `📋 *My Applications*\n\n`;
    
    assignments.forEach((assignment, index) => {
      const myApplication = assignment.applications.find(app => app.tutorId.toString() === tutorId);
      
      message += `*${index + 1}. ${assignment.title || 'Assignment'}*\n`;
      message += `📚 Level: ${assignment.level}\n`;
      message += `📖 Subject: ${assignment.subject}\n`;
      message += `📍 Location: ${assignment.location}\n`;
      message += `💰 Rate: $${assignment.rate}/${assignment.rateType || 'hour'}\n`;
      message += `📅 Applied: ${myApplication.appliedAt.toLocaleDateString('en-SG')}\n`;
      message += `🔄 Status: ${assignment.status}\n\n`;
    });
    
    await safeSend(bot, chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🏠 Back to Main Menu', callback_data: 'main_menu' }]]
      }
    });
    
  } catch (error) {
    console.error('Error viewing applications:', error);
    await safeSend(bot, chatId, '❌ An error occurred while loading your applications. Please try again.');
  }
}

// Admin view all applications
async function adminViewAllApplications(bot, chatId, Assignment) {
  try {
    const assignments = await Assignment.find({
      applications: { $exists: true, $not: { $size: 0 } }
    }).sort({ createdAt: -1 });
    
    if (assignments.length === 0) {
      await safeSend(bot, chatId, '📋 No applications found.', {
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 Back to Admin Panel', callback_data: 'admin_panel' }]]
        }
      });
      return;
    }
    
    let message = `📊 *All Applications*\n\n`;
    
    assignments.forEach((assignment, index) => {
      message += `*${index + 1}. ${assignment.title || 'Assignment'}*\n`;
      message += `📚 ${assignment.level} - ${assignment.subject}\n`;
      message += `📍 ${assignment.location}\n`;
      message += `👥 Applications: ${assignment.applications.length}\n`;
      
      assignment.applications.forEach((app, appIndex) => {
        message += `  ${appIndex + 1}. ${app.tutorName} (${app.tutorContact})\n`;
      });
      
      message += '\n';
    });
    
    await safeSend(bot, chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🔙 Back to Admin Panel', callback_data: 'admin_panel' }]]
      }
    });
    
  } catch (error) {
    console.error('Error viewing all applications:', error);
    await safeSend(bot, chatId, '❌ An error occurred while loading applications. Please try again.');
  }
}

// Admin manage assignments
async function adminManageAssignments(bot, chatId, Assignment) {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 }).limit(10);
    
    if (assignments.length === 0) {
      await safeSend(bot, chatId, '📋 No assignments found.', {
        reply_markup: {
          inline_keyboard: [[{ text: '🔙 Back to Admin Panel', callback_data: 'admin_panel' }]]
        }
      });
      return;
    }
    
    let message = `📋 *Manage Assignments*\n\n`;
    const buttons = [];
    
    assignments.forEach((assignment, index) => {
      message += `*${index + 1}. ${assignment.title || 'Assignment'}*\n`;
      message += `📚 ${assignment.level} - ${assignment.subject}\n`;
      message += `🔄 Status: ${assignment.status}\n`;
      message += `👥 Applications: ${assignment.applications.length}\n\n`;
      
      buttons.push([{ text: `✏️ Edit Assignment ${index + 1}`, callback_data: `edit_assignment_${assignment._id}` }]);
    });
    
    buttons.push([{ text: '🔙 Back to Admin Panel', callback_data: 'admin_panel' }]);
    
    await safeSend(bot, chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons }
    });
    
  } catch (error) {
    console.error('Error managing assignments:', error);
    await safeSend(bot, chatId, '❌ An error occurred while loading assignments. Please try again.');
  }
}

// Export all functions (ES modules)
export {
  // Utility functions
  normalizePhone,
  parseNaturalDate,
  validateLevel,
  validateFrequency,
  initializeTeachingLevels,
  initializeAvailability,
  initializeLocations,
  getTick,
  
  // Format functions
  formatTutorProfile,
  formatAssignment,
  formatAssignmentForChannel,
  
  // Menu functions
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
  
  // Core handler functions
  safeSend,
  isAdmin,
  handleStart,
  handleContact,
  showMainMenu,
  showAdminPanel,
  startAssignmentCreation,
  handleAssignmentStep,
  postAssignmentToChannel,
  handleApplication,
  handleStartParameter,
  viewAssignments,
  viewMyApplications,
  adminViewAllApplications,
  adminManageAssignments,
  
  // Constants
  ITEMS_PER_PAGE
};