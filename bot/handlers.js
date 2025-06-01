// handlers.js - Enhanced bot functionality with admin assignment posting

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

// Parse assignment input from admin
function parseAssignmentInput(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const assignment = {
    status: 'Open' // Default status
  };
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    
    if (!key || !value) continue;
    
    const cleanKey = key.toLowerCase().trim();
    
    switch (cleanKey) {
      case 'assignment':
      case 'title':
        assignment.title = value;
        break;
      case 'level':
        assignment.level = value;
        break;
      case 'subject':
        assignment.subject = value;
        break;
      case 'location':
        assignment.location = value;
        break;
      case 'rate':
        // Extract rate and rate type
        const rateMatch = value.match(/(\d+)(?:\/(\w+))?/);
        if (rateMatch) {
          assignment.rate = parseFloat(rateMatch[1]);
          assignment.rateType = rateMatch[2] || 'hour';
        }
        break;
      case 'frequency':
        assignment.frequency = value;
        break;
      case 'start date':
      case 'startdate':
        assignment.startDate = value;
        break;
      case 'description':
        assignment.description = value;
        break;
      case 'duration':
        assignment.duration = value;
        break;
      case 'students':
      case 'student count':
        assignment.studentCount = parseInt(value) || 1;
        break;
      case 'status':
        assignment.status = value;
        break;
    }
  }
  
  return assignment;
}

// Post assignment to channel
async function postAssignmentToChannel(bot, assignment, channelId, botUsername) {
  try {
    const message = formatAssignmentForChannel(assignment, botUsername);
    
    const keyboard = {
      inline_keyboard: [
        [{
          text: '✅ Apply for this Assignment',
          url: `https://t.me/${botUsername}?start=apply_${assignment._id}`
        }]
      ]
    };
    
    await bot.sendMessage(channelId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
    
    console.log(`✅ Assignment ${assignment._id} posted to channel ${channelId}`);
  } catch (error) {
    console.error('Error posting assignment to channel:', error);
    throw error;
  }
}

async function showAllApplications(chatId, bot, Assignment, page = 1) {
  try {
    const assignments = await Assignment.find({})
      .populate('applicants.tutorId', 'fullName contactNumber email')
      .sort({ createdAt: -1 });
    
    if (assignments.length === 0) {
      return safeSend(bot, chatId, 'No assignments found.', {
        reply_markup: {
          inline_keyboard: [[{ text: 'Back to Admin Panel', callback_data: 'admin_panel' }]]
        }
      });
    }
    
    const totalPages = Math.ceil(assignments.length / ITEMS_PER_PAGE) || 1;
    page = Math.max(1, Math.min(page, totalPages));
    
    const pageAssignments = assignments.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    );
    
    await safeSend(bot, chatId, `📊 All Applications (Page ${page} of ${totalPages})`);
    
    for (const assignment of pageAssignments) {
      const applicantCount = assignment.applicants?.length || 0;
      let msg = formatAssignment(assignment);
      msg += `\n\n👥 *Total Applicants:* ${applicantCount}`;
      
      const keyboard = [
        [{ text: `📋 View Applications (${applicantCount})`, callback_data: `admin_view_assignment_${assignment._id}` }]
      ];
      
      if (assignment.status === 'Open') {
        keyboard.push([{ text: '🔒 Close Assignment', callback_data: `admin_close_${assignment._id}` }]);
      } else {
        keyboard.push([{ text: '🔓 Reopen Assignment', callback_data: `admin_reopen_${assignment._id}` }]);
      }
      
      await safeSend(bot, chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    }
    
    const paginationKeyboard = [];
    if (page > 1) {
      paginationKeyboard.push({ text: '◀️ Previous', callback_data: `admin_all_apps_page_${page - 1}` });
    }
    if (page < totalPages) {
      paginationKeyboard.push({ text: 'Next ▶️', callback_data: `admin_all_apps_page_${page + 1}` });
    }
    
    await safeSend(bot, chatId, `Page ${page} of ${totalPages}`, {
      reply_markup: {
        inline_keyboard: [
          paginationKeyboard,
          [{ text: 'Back to Admin Panel', callback_data: 'admin_panel' }]
        ]
      }
    });
  } catch (err) {
    console.error('Error showing all applications:', err);
    safeSend(bot, chatId, 'There was an error retrieving applications. Please try again later.');
  }
}

// Show applications for a specific assignment (admin view)
async function showAssignmentApplications(chatId, bot, Assignment, assignmentId) {
  try {
    const assignment = await Assignment.findById(assignmentId)
      .populate('applicants.tutorId', 'fullName contactNumber email gender race highestEducation');
    
    if (!assignment) {
      return safeSend(bot, chatId, 'Assignment not found.');
    }
    
    let msg = formatAssignment(assignment);
    msg += `\n\n👥 *Total Applicants:* ${assignment.applicants?.length || 0}`;
    
    await safeSend(bot, chatId, msg, { parse_mode: 'Markdown' });
    
    if (!assignment.applicants || assignment.applicants.length === 0) {
      return safeSend(bot, chatId, 'No applications for this assignment yet.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Back to All Applications', callback_data: 'admin_view_all_applications' }]
          ]
        }
      });
    }
    
    for (let i = 0; i < assignment.applicants.length; i++) {
      const applicant = assignment.applicants[i];
      const tutor = applicant.tutorId;
      
      let applicantMsg = `*👤 Applicant ${i + 1}*\n\n`;
      applicantMsg += `*Name:* ${tutor.fullName || 'Not provided'}\n`;
      applicantMsg += `*Contact:* ${tutor.contactNumber || 'Not provided'}\n`;
      applicantMsg += `*Email:* ${tutor.email || 'Not provided'}\n`;
      applicantMsg += `*Gender:* ${tutor.gender || 'Not provided'}\n`;
      applicantMsg += `*Race:* ${tutor.race || 'Not provided'}\n`;
      applicantMsg += `*Education:* ${tutor.highestEducation || 'Not provided'}\n`;
      applicantMsg += `*Status:* ${applicant.status}\n`;
      applicantMsg += `*Applied:* ${applicant.appliedAt.toLocaleDateString()}`;
      
      const keyboard = [];
      if (applicant.status === 'Pending') {
        keyboard.push([
          { text: '✅ Accept', callback_data: `admin_accept_${assignmentId}_${tutor._id}` },
          { text: '❌ Reject', callback_data: `admin_reject_${assignmentId}_${tutor._id}` }
        ]);
      }
      keyboard.push([{ text: '👤 View Full Profile', callback_data: `admin_view_tutor_${tutor._id}` }]);
      
      await safeSend(bot, chatId, applicantMsg, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
    }
    
    const actionKeyboard = [
      [{ text: 'Back to All Applications', callback_data: 'admin_view_all_applications' }]
    ];
    
    if (assignment.status === 'Open') {
      actionKeyboard.unshift([{ text: '🔒 Close Assignment', callback_data: `admin_close_${assignmentId}` }]);
    } else {
      actionKeyboard.unshift([{ text: '🔓 Reopen Assignment', callback_data: `admin_reopen_${assignmentId}` }]);
    }
    
    await safeSend(bot, chatId, 'Assignment Actions:', {
      reply_markup: { inline_keyboard: actionKeyboard }
    });
    
  } catch (err) {
    console.error('Error showing assignment applications:', err);
    safeSend(bot, chatId, 'There was an error retrieving applications. Please try again later.');
  }
}

// Handle /post_assignment command
async function handlePostAssignmentCommand(bot, chatId, userId, ADMIN_USERS, userSessions) {
  if (!isAdmin(userId, ADMIN_USERS)) {
    return safeSend(bot, chatId, '❌ You are not authorized to post assignments.');
  }
  
  userSessions[chatId] = { 
    ...userSessions[chatId], 
    state: 'awaiting_assignment_details' 
  };
  
  const formatExample = `Please provide the assignment details in the following format:

Assignment: Math Tutoring for Primary 6
Level: Primary 6
Subject: Mathematics
Location: Tampines
Rate: 35/hour
Frequency: 2 times per week
Start Date: Next Monday
Duration: 1.5 hours per session
Students: 1
Description: Student needs help with PSLE Math preparation
Status: Open

Just copy and modify the above format with your assignment details.`;
  
  return safeSend(bot, chatId, formatExample);
}

// Handle assignment details input from admin
async function handleAssignmentDetails(bot, chatId, text, Assignment, userSessions, channelId, botUsername) {
  try {
    const assignmentData = parseAssignmentInput(text);
    
    // Validate required fields
    const requiredFields = ['level', 'subject', 'location', 'rate'];
    const missingFields = requiredFields.filter(field => !assignmentData[field]);
    
    if (missingFields.length > 0) {
      return safeSend(bot, chatId, `❌ Missing required fields: ${missingFields.join(', ')}\n\nPlease provide all required information.`);
    }
    
    // Create new assignment
    const assignment = new Assignment({
      ...assignmentData,
      createdAt: new Date(),
      applicants: []
    });
    
    await assignment.save();
    
    // Post to channel if channel ID is configured
    if (channelId) {
      try {
        await postAssignmentToChannel(bot, assignment, channelId, botUsername);
        await safeSend(bot, chatId, '✅ Assignment posted successfully and shared to channel!');
      } catch (channelError) {
        console.error('Error posting to channel:', channelError);
        await safeSend(bot, chatId, '✅ Assignment created successfully, but failed to post to channel.');
      }
    } else {
      await safeSend(bot, chatId, '✅ Assignment posted successfully!');
    }
    
    // Show the created assignment
    const msg = formatAssignment(assignment);
    await safeSend(bot, chatId, msg, { parse_mode: 'Markdown' });
    
    // Clear user session
    userSessions[chatId].state = null;
    
    // Show admin panel again
    await showAdminPanel(chatId, bot);
    
  } catch (err) {
    console.error('Error creating assignment:', err);
    safeSend(bot, chatId, 'There was an error creating the assignment. Please try again.');
  }
}

// Handle /view_applications command
async function handleViewApplicationsCommand(bot, chatId, userId, ADMIN_USERS, Assignment, text) {
  if (!isAdmin(userId, ADMIN_USERS)) {
    return safeSend(bot, chatId, '❌ You are not authorized to view applications.');
  }
  
  // Extract assignment ID from command if provided
  const parts = text.split(' ');
  if (parts.length > 1) {
    const assignmentId = parts[1];
    await showAssignmentApplications(chatId, bot, Assignment, assignmentId);
  } else {
    await showAllApplications(chatId, bot, Assignment);
  }
}

// Check if user can apply (not admin)
function canUserApply(userId, ADMIN_USERS) {
  return !isAdmin(userId, ADMIN_USERS);
}

// Handle assignment application
async function handleAssignmentApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions, ADMIN_USERS) {
  try {
    // Check if user is admin
    if (!canUserApply(userId, ADMIN_USERS)) {
      return safeSend(bot, chatId, '❌ Admins cannot apply for assignments.');
    }
    
    // Check if user session exists
    if (!userSessions[chatId] || !userSessions[chatId].tutorId) {
      return safeSend(bot, chatId, 'Your session has expired. Please start again with /start');
    }
    
    const tutorId = userSessions[chatId].tutorId;
    
    // Find the assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return safeSend(bot, chatId, 'Assignment not found.');
    }
    
    if (assignment.status !== 'Open') {
      return safeSend(bot, chatId, 'This assignment is no longer accepting applications.');
    }
    
    // Check if already applied
    const existingApplication = assignment.applicants?.find(
      app => app.tutorId.toString() === tutorId.toString()
    );
    
    if (existingApplication) {
      return safeSend(bot, chatId, 'You have already applied for this assignment.');
    }
    
    // Add application
    assignment.applicants = assignment.applicants || [];
    assignment.applicants.push({
      tutorId: tutorId,
      status: 'Pending',
      appliedAt: new Date()
    });
    
    await assignment.save();
    
    const msg = `✅ Application submitted successfully!\n\n${formatAssignment(assignment)}`;
    await safeSend(bot, chatId, msg, { parse_mode: 'Markdown' });
    
    // Show main menu
    await showMainMenu(chatId, bot, userId, ADMIN_USERS);
    
  } catch (err) {
    console.error('Error applying for assignment:', err);
    safeSend(bot, chatId, 'There was an error processing your application. Please try again.');
  }
}

// Accept/Reject applications
async function handleApplicationDecision(bot, chatId, assignmentId, tutorId, decision, Assignment, Tutor) {
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return safeSend(bot, chatId, 'Assignment not found.');
    }
    
    const applicant = assignment.applicants.find(
      app => app.tutorId.toString() === tutorId.toString()
    );
    
    if (!applicant) {
      return safeSend(bot, chatId, 'Application not found.');
    }
    
    applicant.status = decision;
    applicant.decidedAt = new Date();
    
    await assignment.save();
    
    // Notify the tutor
    const tutor = await Tutor.findById(tutorId);
    if (tutor && tutor.chatId) {
      const statusEmoji = decision === 'Accepted' ? '✅' : '❌';
      const notificationMsg = `${statusEmoji} Your application has been ${decision.toLowerCase()}!\n\n${formatAssignment(assignment)}`;
      
      try {
        await safeSend(bot, tutor.chatId, notificationMsg, { parse_mode: 'Markdown' });
      } catch (notifyError) {
        console.error('Error notifying tutor:', notifyError);
      }
    }
    
    await safeSend(bot, chatId, `✅ Application ${decision.toLowerCase()} successfully.`);
    
    // Show updated assignment applications
    await showAssignmentApplications(chatId, bot, Assignment, assignmentId);
    
  } catch (err) {
    console.error('Error handling application decision:', err);
    safeSend(bot, chatId, 'There was an error processing the decision. Please try again.');
  }
}

// Close/Reopen assignment
async function toggleAssignmentStatus(bot, chatId, assignmentId, Assignment) {
  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return safeSend(bot, chatId, 'Assignment not found.');
    }
    
    const newStatus = assignment.status === 'Open' ? 'Closed' : 'Open';
    assignment.status = newStatus;
    await assignment.save();
    
    const statusEmoji = newStatus === 'Open' ? '🔓' : '🔒';
    await safeSend(bot, chatId, `${statusEmoji} Assignment ${newStatus.toLowerCase()} successfully.`);
    
    // Show updated assignment
    const msg = formatAssignment(assignment);
    await safeSend(bot, chatId, msg, { parse_mode: 'Markdown' });
    
  } catch (err) {
    console.error('Error toggling assignment status:', err);
    safeSend(bot, chatId, 'There was an error updating the assignment status. Please try again.');
  }
}

// Handle start parameter for direct application
async function handleStartParameter(bot, chatId, userId, startParam, Assignment, Tutor, userSessions, ADMIN_USERS) {
  if (startParam && startParam.startsWith('apply_')) {
    const assignmentId = startParam.replace('apply_', '');
    
    // Check if user is admin
    if (!canUserApply(userId, ADMIN_USERS)) {
      return safeSend(bot, chatId, '❌ Admins cannot apply for assignments. Please use the admin panel to manage assignments.');
    }
    
    // Find or create tutor session
    let tutor = await Tutor.findOne({ chatId: chatId });
    if (!tutor) {
      tutor = new Tutor({ chatId: chatId, userId: userId });
      await tutor.save();
    }
    
    userSessions[chatId] = { tutorId: tutor._id };
    
    // Check if profile is complete enough to apply
    if (!tutor.fullName || !tutor.contactNumber) {
      await safeSend(bot, chatId, 'Please complete your profile before applying for assignments.');
      return showMainMenu(chatId, bot, userId, ADMIN_USERS);
    }
    
    // Process the application
    await handleAssignmentApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions, ADMIN_USERS);
  }
}

// Export all functions
module.exports = {
  normalizePhone,
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
  showMainMenu,
  showAdminPanel,
  showAssignments,
  showApplications,
  showAllApplications,
  showAssignmentApplications,
  parseAssignmentInput,
  postAssignmentToChannel,
  handlePostAssignmentCommand,
  handleAssignmentDetails,
  handleViewApplicationsCommand,
  canUserApply,
  handleAssignmentApplication,
  handleApplicationDecision,
  toggleAssignmentStatus,
  handleStartParameter,
  ITEMS_PER_PAGE
};