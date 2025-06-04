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

// Helper function to get tutor from session
async function getTutorFromSession(chatId, userSessions, Tutor) {
  let tutor;
  if (userSessions[chatId]?.tutorId) {
    tutor = await Tutor.findById(userSessions[chatId].tutorId);
  }
  if (!tutor && userSessions[chatId]?.contactNumber) {
    const phoneVariations = normalizePhone(userSessions[chatId].contactNumber);
    tutor = await Tutor.findOne({ contactNumber: { $in: phoneVariations } });
  }
  return tutor;
}

function getTick(value) {
  return value ? '✅' : '❌';
}

// Format functions
function formatTutorProfile(tutor) {
  let profile = `*📋 Your Profile*\n\n`;
  
  // Personal Information
  profile += `*👤 Personal Information*\n`;
  profile += `*Name:* ${tutor.fullName || 'Not set'}\n`;
  profile += `*Contact:* ${tutor.contactNumber || 'Not set'}\n`;
  profile += `*Email:* ${tutor.email || 'Not set'}\n`;
  profile += `*Gender:* ${tutor.gender || 'Not set'}\n`;
  profile += `*Age:* ${tutor.age || 'Not set'}\n`;
  profile += `*Race:* ${tutor.race || 'Not set'}\n`;
  profile += `*Nationality:* ${tutor.nationality || 'Not set'}\n`;
  if (tutor.nationality === 'Other' && tutor.nationalityOther) {
    profile += `*Other Nationality:* ${tutor.nationalityOther}\n`;
  }
  profile += `*NRIC (Last 4):* ${tutor.nricLast4 ? '****' + tutor.nricLast4 : 'Not set'}\n`;
  
  // Date of Birth
  if (tutor.dob) {
    const dob = tutor.dob;
    const dobStr = [dob.day, dob.month, dob.year].filter(Boolean).join('/');
    profile += `*Date of Birth:* ${dobStr || 'Not set'}\n`;
  } else {
    profile += `*Date of Birth:* Not set\n`;
  }
  
  // Education & Experience
  profile += `\n*🎓 Education & Experience*\n`;
  profile += `*Highest Education:* ${tutor.highestEducation || 'Not set'}\n`;
  profile += `*Current School:* ${tutor.currentSchool || 'Not set'}\n`;
  profile += `*Previous Schools:* ${tutor.previousSchools || 'Not set'}\n`;
  profile += `*Tutor Type:* ${tutor.tutorType || 'Not set'}\n`;
  profile += `*Years of Experience:* ${tutor.yearsOfExperience || 'Not set'}\n`;
  
  // Teaching Levels
  if (tutor.teachingLevels) {
    profile += `\n*📚 Teaching Levels*\n`;
    const levels = [];
    if (Object.values(tutor.teachingLevels.primary || {}).some(v => v)) levels.push('Primary');
    if (Object.values(tutor.teachingLevels.secondary || {}).some(v => v)) levels.push('Secondary');
    if (Object.values(tutor.teachingLevels.jc || {}).some(v => v)) levels.push('JC');
    if (Object.values(tutor.teachingLevels.international || {}).some(v => v)) levels.push('International');
    profile += `*Levels:* ${levels.length ? levels.join(', ') : 'Not set'}\n`;
  }

  // Locations
  if (tutor.locations) {
    profile += `\n*📍 Teaching Locations*\n`;
    const locations = [];
    Object.entries(tutor.locations).forEach(([key, value]) => {
      if (value) locations.push(key.charAt(0).toUpperCase() + key.slice(1));
    });
    profile += `*Areas:* ${locations.length ? locations.join(', ') : 'Not set'}\n`;
  }

  // Availability
  if (tutor.availableTimeSlots) {
    profile += `\n*⏰ Availability*\n`;
    const slots = [];
    Object.entries(tutor.availableTimeSlots).forEach(([key, value]) => {
      if (value) {
        const formatted = key.replace(/([A-Z])/g, ' $1').toLowerCase();
        slots.push(formatted.charAt(0).toUpperCase() + formatted.slice(1));
      }
    });
    profile += `*Time Slots:* ${slots.length ? slots.join(', ') : 'Not set'}\n`;
  }

  // Hourly Rates
  if (tutor.hourlyRate) {
    profile += `\n*💰 Hourly Rates*\n`;
    const rates = [];
    if (tutor.hourlyRate.primary) rates.push(`Primary: $${tutor.hourlyRate.primary}`);
    if (tutor.hourlyRate.secondary) rates.push(`Secondary: $${tutor.hourlyRate.secondary}`);
    if (tutor.hourlyRate.jc) rates.push(`JC: $${tutor.hourlyRate.jc}`);
    if (tutor.hourlyRate.international) rates.push(`International: $${tutor.hourlyRate.international}`);
    profile += `*Rates:* ${rates.length ? rates.join('\n') : 'Not set'}\n`;
  }

  // Introduction & Experience
  profile += `\n*📝 Profile Details*\n`;
  profile += `*Introduction:* ${tutor.introduction || 'Not set'}\n`;
  profile += `*Teaching Experience:* ${tutor.teachingExperience || 'Not set'}\n`;

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

async function handleBioEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await Tutor.findById(session.tutorId);
    
    tutor.bio = text;
    await tutor.save();
    
    session.state = 'idle';
    await safeSend(bot, chatId, '✅ Bio updated successfully!');
    return await showProfileEditMenu(bot, chatId);
  } catch (error) {
    console.error('Error updating bio:', error);
    await safeSend(bot, chatId, '❌ Error updating bio. Please try again.');
  }
}

async function handleExperienceEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await Tutor.findById(session.tutorId);
    
    tutor.experience = text;
    await tutor.save();
    
    session.state = 'idle';
    await safeSend(bot, chatId, '✅ Experience updated successfully!');
    return await showProfileEditMenu(bot, chatId);
  } catch (error) {
    console.error('Error updating experience:', error);
    await safeSend(bot, chatId, '❌ Error updating experience. Please try again.');
  }
}

async function handleQualificationsEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await Tutor.findById(session.tutorId);
    
    tutor.qualifications = text;
    await tutor.save();
    
    session.state = 'idle';
    await safeSend(bot, chatId, '✅ Qualifications updated successfully!');
    return await showProfileEditMenu(bot, chatId);
  } catch (error) {
    console.error('Error updating qualifications:', error);
    await safeSend(bot, chatId, '❌ Error updating qualifications. Please try again.');
  }
}

// Menu functions
function showProfileEditMenu(tutor) {
  // This should return a keyboard object, NOT call safeSend
  return {
    inline_keyboard: [
      [{ text: '👤 Personal Info', callback_data: 'edit_personal_info' }],
      [{ text: '📚 Teaching Levels', callback_data: 'edit_teaching_levels' }],
      [{ text: '📍 Locations', callback_data: 'edit_locations' }],
      [{ text: '⏰ Availability', callback_data: 'edit_availability' }],
      [{ text: '💰 Hourly Rates', callback_data: 'edit_hourly_rates' }],
      [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

function getPersonalInfoMenu(tutor) {
  return {
    inline_keyboard: [
      [{ text: '👤 Full Name', callback_data: 'edit_full_name' }],
      [{ text: '📱 Contact Number', callback_data: 'edit_contact_number' }],
      [{ text: '🎂 Age', callback_data: 'edit_age' }],
      [{ text: '👫 Gender', callback_data: 'edit_gender_menu' }],
      [{ text: '🌍 Race', callback_data: 'edit_race_menu' }],
      [{ text: '🏛️ Nationality', callback_data: 'edit_nationality' }],
      [{ text: '🆔 NRIC (Last 4)', callback_data: 'edit_nric' }],
      [{ text: '📧 Email', callback_data: 'edit_email' }],
      [{ text: '📅 Date of Birth', callback_data: 'edit_dob' }],
      [{ text: '🎓 Education', callback_data: 'edit_education_menu' }],
      [{ text: '👨‍🏫 Tutor Type', callback_data: 'edit_tutor_type' }],
      [{ text: '🏫 Current School', callback_data: 'edit_current_school' }],
      [{ text: '📝 Introduction', callback_data: 'edit_introduction' }],
      [{ text: '🔙 Back', callback_data: 'profile_edit' }]
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
function getProfileDetailsMenu(tutor) {
  return {
    inline_keyboard: [
      [{ text: '📝 Introduction', callback_data: 'edit_introduction' }],
      [{ text: '👨‍🏫 Teaching Experience', callback_data: 'edit_teaching_experience' }],
      [{ text: '🏆 Track Record', callback_data: 'edit_track_record' }],
      [{ text: '⭐ Selling Points', callback_data: 'edit_selling_points' }],
      [{ text: '⬅️ Back to Profile Edit', callback_data: 'profile_edit' }]
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
      [{ text: '👨 Male', callback_data: 'set_gender_male' }],
      [{ text: '👩 Female', callback_data: 'set_gender_female' }],
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

function getTutorTypeMenu() {
  return {
    inline_keyboard: [
      [
        { text: '👨‍🏫 Full-time Tutor', callback_data: 'set_tutor_type_fulltime' },
        { text: '👩‍🏫 Part-time Tutor', callback_data: 'set_tutor_type_parttime' }
      ],
      [
        { text: '🎓 MOE Teacher', callback_data: 'set_tutor_type_moe' },
        { text: '👨‍🎓 Ex-MOE Teacher', callback_data: 'set_tutor_type_exmoe' }
      ],
      [
        { text: '🎓 NIE Trainee', callback_data: 'set_tutor_type_nie' },
        { text: '👨‍🎓 Undergraduate', callback_data: 'set_tutor_type_undergraduate' }
      ],
      [
        { text: '← Back', callback_data: 'edit_personal_info' }
      ]
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

function getNationalityMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Singaporean', callback_data: 'set_nationality_singaporean' }],
      [{ text: 'PR', callback_data: 'set_nationality_pr' }],
      [{ text: 'Malaysian', callback_data: 'set_nationality_malaysian' }],
      [{ text: 'Chinese', callback_data: 'set_nationality_chinese' }],
      [{ text: 'Indian', callback_data: 'set_nationality_indian' }],
      [{ text: 'Others', callback_data: 'set_nationality_other' }],
      [{ text: '🔙 Back', callback_data: 'edit_personal_info' }]
    ]
  };
}

function getDOBMenu(tutor) {
  const dob = tutor.dateOfBirth || { day: null, month: null, year: null };
  const dayText = dob.day ? `📅 Day: ${dob.day}` : '📅 Set Day';
  const monthText = dob.month ? `📅 Month: ${dob.month}` : '📅 Set Month';
  const yearText = dob.year ? `📅 Year: ${dob.year}` : '📅 Set Year';
  
  return {
    inline_keyboard: [
      [{ text: dayText, callback_data: 'edit_dob_day' }],
      [{ text: monthText, callback_data: 'edit_dob_month' }],
      [{ text: yearText, callback_data: 'edit_dob_year' }],
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
async function handleStart(bot, chatId, userId, Tutor, userSessions, startParam = null, Assignment, ADMIN_USERS, BOT_USERNAME) {
  try {
    // Always request contact number first - this is your primary verification method
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
      startParam: startParam,
      userId: userId // Store for later use
    };
    
  } catch (error) {
    console.error('Error handling start:', error);
    await safeSend(bot, chatId, 'There was an error setting up your account. Please try again.');
  }
}

// Handle contact sharing
async function handleContact(bot, chatId, userId, contact, Tutor, userSessions, ADMIN_USERS) {
  try {
    const phoneNumber = contact.phone_number;
    
    // Extract last 8 digits for Singapore numbers
    const last8Digits = phoneNumber.replace(/\D/g, '').slice(-8);
    
    // Create variations to search for
    const phoneVariations = [
      last8Digits,
      `+65${last8Digits}`,
      `65${last8Digits}`,
      phoneNumber
    ];
    
    console.log('🔍 Searching for phone variations:', phoneVariations);
    
    // Find existing tutor by phone number variations
    let tutor = await Tutor.findOne({
      contactNumber: { $in: phoneVariations }
    });
    
    if (tutor) {
      tutor.chatId = chatId;
      tutor.userId = userId;
      if (!tutor.fullName && contact.first_name) {
        tutor.fullName = contact.first_name + (contact.last_name ? ' ' + contact.last_name : '');
      }
      await tutor.save();
      
      await safeSend(bot, chatId, '✅ Welcome back! Your account has been verified and linked.', {
        reply_markup: { remove_keyboard: true }
      });
      
      console.log('✅ Verified user:', tutor.fullName || tutor.contactNumber);
      
    } else {
      await safeSend(bot, chatId, '❌ Sorry, your phone number is not registered in our system. Please register yourself at www.lioncitytutors.com/register-tutor or contact LionCity admin @ivanfang for access.', {
        reply_markup: { remove_keyboard: true }
      });
      
      console.log('❌ Unverified phone number:', last8Digits);
      return; // Stop here - don't create account
    }
    
    // Set up session
    userSessions[chatId] = { 
      tutorId: tutor._id, 
      contactNumber: tutor.contactNumber,
      verified: true
    };
    
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
    await safeSend(bot, chatId, 'There was an error verifying your account. Please try again.');
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

// Flexible validation functions that accept any text
function validateLevel(text) {
  // Accept any text but provide guidance
  const validLevels = [
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'Secondary 1', 'Secondary 2', 'Secondary 3', 'Secondary 4', 'Secondary 5',
    'JC 1', 'JC 2', 'Polytechnic', 'University', 'Adult Learning'
  ];
  
  // If it matches a predefined level, return as is
  if (validLevels.includes(text)) {
    return text;
  }
  
  // Otherwise, accept the custom text but warn
  console.log(`Custom level entered: ${text}`);
  return text;
}

function validateFrequency(text) {
  // Accept any text but provide guidance
  const validFrequencies = [
    'Once a week', 'Twice a week', '3 times a week', '4 times a week', 
    '5 times a week', 'Daily', 'Flexible'
  ];
  
  // If it matches a predefined frequency, return as is
  if (validFrequencies.includes(text)) {
    return text;
  }
  
  // Otherwise, accept the custom text
  console.log(`Custom frequency entered: ${text}`);
  return text;
}

function parseNaturalDate(text) {
  const today = new Date();
  const lowerText = text.toLowerCase().trim();
  
  // Handle common natural language dates
  if (lowerText === 'today') {
    return today;
  } else if (lowerText === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  } else if (lowerText === 'asap' || lowerText === 'immediately') {
    return today;
  } else if (lowerText.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return nextWeek;
  } else {
    // Try to parse as a regular date
    const parsedDate = new Date(text);
    if (isNaN(parsedDate.getTime())) {
      // If parsing fails, just return the text as is for flexible handling
      return text;
    }
    return parsedDate;
  }
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
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 2 of 7: Enter the education level\n\n*Examples:* Primary 6, Secondary 1 NA, JC 2, University, etc.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'level':
        assignmentData.level = text.trim();
        session.currentStep = 'subject';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 3 of 7: Enter the subject(s)\n\n*Examples:* Mathematics, English, Science, Physics & Chemistry, etc.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'subject':
        assignmentData.subject = text.trim();
        session.currentStep = 'location';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 4 of 7: Enter the location\n\n*Examples:* Tampines, Online, Tutor\'s place (Jurong), etc.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'location':
        assignmentData.location = text.trim();
        session.currentStep = 'rate';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 5 of 7: Enter the rate\n\n*Examples:* 55-75/hr, 40/hr, etc.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'rate':
        assignmentData.rate = text.trim();
        session.currentStep = 'frequency';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 6 of 7: Enter the frequency\n\n*Examples:* Once a week, Twice a week, 3 times a week, Daily, Flexible, etc.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'frequency':
        assignmentData.frequency = text.trim();
        session.currentStep = 'startDate';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nStep 7 of 7: Enter the start date\n\n*Examples:* ASAP, today, tomorrow, next Monday, 15 Dec 2024, etc.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'startDate':
        assignmentData.startDate = text.trim();
        session.currentStep = 'description';
        
        await safeSend(bot, chatId, '🎯 *Creating New Assignment*\n\nFinal Step: Enter additional description or requirements\n\n*Type "skip" to leave empty*\n\n*Examples:* Looking for MOE/Ex-MOE tutor, Student needs help with exam prep, etc.', {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '❌ Cancel', callback_data: 'admin_panel' }]]
          }
        });
        break;
      
      case 'description':
        if (text.toLowerCase().trim() !== 'skip') {
          assignmentData.description = text.trim();
        }
        
        // Set default values
        assignmentData.status = 'Open';
        assignmentData.createdAt = new Date();
        assignmentData.updatedAt = new Date();
        
        // Show confirmation
        const confirmationMsg = formatAssignmentPreview(assignmentData);
        await safeSend(bot, chatId, `📋 *Assignment Preview*\n\n${confirmationMsg}\n\n✅ *Ready to post this assignment?*`, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Confirm & Post Assignment', callback_data: 'confirm_post_assignment' }],
              [{ text: '❌ Cancel', callback_data: 'admin_panel' }]
            ]
          }
        });
        break;
    }
  } catch (error) {
    console.error('Error in assignment step:', error);
    await safeSend(bot, chatId, '❌ An error occurred. Please try again.');
    // Reset the session
    delete userSessions[chatId].state;
    delete userSessions[chatId].assignmentData;
    delete userSessions[chatId].currentStep;
  }
}

// Update formatAssignmentPreview to match the simplified schema
function formatAssignmentPreview(assignment) {
  let msg = `*🎯 ${assignment.title}*\n\n`;
  msg += `*📚 Level:* ${assignment.level}\n`;
  msg += `*📖 Subject:* ${assignment.subject}\n`;
  msg += `*📍 Location:* ${assignment.location}\n`;
  msg += `*💰 Rate:* ${assignment.rate}\n`;
  msg += `*📅 Frequency:* ${assignment.frequency}\n`;
  msg += `*🚀 Start Date:* ${assignment.startDate}\n`;
  
  if (assignment.description) {
    msg += `\n*📝 Description:* ${assignment.description}\n`;
  }
  
  msg += `\n*💼 Status:* ${assignment.status}`;
  return msg;
}

async function confirmPostAssignment(bot, chatId, userSessions, Assignment, channelId, botUsername) {
  try {
    const assignmentData = userSessions[chatId].assignmentData;
    
    // Create assignment in database
    const assignment = new Assignment(assignmentData);
    const savedAssignment = await assignment.save();
    
    // Post to channel
    const channelMessage = await postAssignmentToChannel(bot, savedAssignment, channelId, botUsername);
    
    // Store channel message ID for future reference
    if (channelMessage && channelMessage.message_id) {
      savedAssignment.channelMessageId = channelMessage.message_id;
      await savedAssignment.save();
    }
    
    // Clear session
    delete userSessions[chatId].state;
    delete userSessions[chatId].assignmentData;
    delete userSessions[chatId].currentStep;
    
    await safeSend(bot, chatId, `✅ *Assignment Posted Successfully!*\n\n📋 Assignment ID: ${savedAssignment._id}\n📢 Posted to channel\n📊 Status: Open for applications`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[{ text: '🔙 Back to Admin Panel', callback_data: 'admin_panel' }]]
      }
    });
    
  } catch (error) {
    console.error('Error confirming assignment:', error);
    await safeSend(bot, chatId, '❌ Failed to post assignment. Please try again.');
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
    
    console.log(`✅ Assignment posted to channel. Message ID: ${result.message_id}`);
    return result;
  } catch (error) {
    console.error('Error posting to channel:', error);
    throw error;
  }
}

// Handle assignment applications
async function handleApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions) {
  try {
    if (!userSessions[chatId]?.tutorId) {
      console.warn(`🚫 tutorId missing in session for chatId ${chatId}`);
      return await safeSend(bot, chatId, '❌ Please start with /start and share your contact before applying.');
    }
    
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      await safeSend(bot, chatId, '❌ Assignment not found or may have been removed.');
      return;
    }
    
    if (assignment.status !== 'Open') {
      await safeSend(bot, chatId, '❌ This assignment is no longer available.');
      return;
    }
    
    // Initialize applicants array if it doesn't exist (safety check)
    if (!assignment.applicants) {
      assignment.applicants = [];
    }
    
    // Check if user already applied (using 'applicants' not 'applications')
    const existingApplication = assignment.applicants.find(app => app.tutorId.toString() === userSessions[chatId].tutorId);
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
    
    // Add application to applicants array
    assignment.applicants.push({
      tutorId: tutor._id,
      status: 'Pending', // This matches your schema enum
      appliedAt: new Date(),
      contactDetails: tutor.contactNumber, // Store contact info as per schema
      notes: `Applied via bot by ${tutor.fullName}`
    });
    
    await assignment.save();
    
    const assignmentMsg = formatAssignment(assignment);
    await safeSend(bot, chatId, `✅ *Application Submitted Successfully!*\n\n${assignmentMsg}\n\n📝 *Application Status:* Pending\n⏰ *Applied At:* ${new Date().toLocaleString('en-SG')}`, {
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

async function handleAgeEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    const age = parseInt(text);
    if (isNaN(age) || age < 16 || age > 80) {
      return await safeSend(bot, chatId, '❌ Please enter a valid age (16-80):');
    }
    
    tutor.age = age;
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Age updated to *${age}*`, {
      parse_mode: 'Markdown',
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating age:', error);
    await safeSend(bot, chatId, '❌ Error updating age. Please try again.');
  }
}

async function handleFullNameEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    if (text.trim().length < 2) {
      return await safeSend(bot, chatId, '❌ Please enter a valid full name:');
    }
    
    tutor.fullName = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Full name updated to *${tutor.fullName}*`, {
      parse_mode: 'Markdown',
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating full name:', error);
    await safeSend(bot, chatId, '❌ Error updating full name. Please try again.');
  }
}

async function handleContactNumberEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    // Basic phone number validation
    const phoneRegex = /^[+]?[\d\s()-]{8,15}$/;
    if (!phoneRegex.test(text.trim())) {
      return await safeSend(bot, chatId, '❌ Please enter a valid contact number:');
    }
    
    tutor.contactNumber = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Contact number updated to *${tutor.contactNumber}*`, {
      parse_mode: 'Markdown',
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating contact number:', error);
    await safeSend(bot, chatId, '❌ Error updating contact number. Please try again.');
  }
}

async function handleNRICEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    // Validate NRIC last 4 digits
    if (!/^\d{4}[A-Za-z]?$/.test(text.trim())) {
      return await safeSend(bot, chatId, '❌ Please enter the last 4 digits of your NRIC (e.g., 1234A):');
    }
    
    tutor.nricLast4 = text.trim().toUpperCase();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ NRIC updated to *****${tutor.nricLast4}*`, {
      parse_mode: 'Markdown',
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating NRIC:', error);
    await safeSend(bot, chatId, '❌ Error updating NRIC. Please try again.');
  }
}

async function handleEmailEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(text.trim())) {
      return await safeSend(bot, chatId, '❌ Please enter a valid email address:');
    }
    
    tutor.email = text.trim().toLowerCase();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Email updated to *${tutor.email}*`, {
      parse_mode: 'Markdown',
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating email:', error);
    await safeSend(bot, chatId, '❌ Error updating email. Please try again.');
  }
}

async function handleIntroductionEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    tutor.introduction = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, '✅ Introduction updated successfully!', {
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating introduction:', error);
    await safeSend(bot, chatId, '❌ Error updating introduction. Please try again.');
  }
}

async function handleTeachingExperienceEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    tutor.teachingExperience = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, '✅ Teaching experience updated successfully!', {
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating teaching experience:', error);
    await safeSend(bot, chatId, '❌ Error updating teaching experience. Please try again.');
  }
}

async function handleTrackRecordEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    tutor.trackRecord = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, '✅ Track record updated successfully!', {
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating track record:', error);
    await safeSend(bot, chatId, '❌ Error updating track record. Please try again.');
  }
}

async function handleSellingPointsEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    tutor.sellingPoints = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, '✅ Selling points updated successfully!', {
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating selling points:', error);
    await safeSend(bot, chatId, '❌ Error updating selling points. Please try again.');
  }
}

async function handleYearsExperienceEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    const years = parseInt(text);
    if (isNaN(years) || years < 0 || years > 50) {
      return await safeSend(bot, chatId, '❌ Please enter a valid number of years (0-50):');
    }
    
    tutor.yearsExperience = years;
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Years of experience updated to *${years}*`, {
      parse_mode: 'Markdown',
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating years experience:', error);
    await safeSend(bot, chatId, '❌ Error updating years experience. Please try again.');
  }
}

async function handleCurrentSchoolEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    tutor.currentSchool = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Current school updated to *${tutor.currentSchool}*`, {
      parse_mode: 'Markdown',
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating current school:', error);
    await safeSend(bot, chatId, '❌ Error updating current school. Please try again.');
  }
}

async function handlePreviousSchoolsEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    tutor.previousSchools = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, '✅ Previous schools updated successfully!', {
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating previous schools:', error);
    await safeSend(bot, chatId, '❌ Error updating previous schools. Please try again.');
  }
}

async function handleNationalityOtherEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    tutor.nationality = 'Other';
    tutor.nationalityOther = text.trim();
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Nationality updated to *${tutor.nationalityOther}*`, {
      parse_mode: 'Markdown',
      reply_markup: getPersonalInfoMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating nationality other:', error);
    await safeSend(bot, chatId, '❌ Error updating nationality. Please try again.');
  }
}

async function handleDOBDayEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    const day = parseInt(text);
    if (isNaN(day) || day < 1 || day > 31) {
      return await safeSend(bot, chatId, '❌ Please enter a valid day (1-31):');
    }
    
    if (!tutor.dateOfBirth) {
      tutor.dateOfBirth = { day: null, month: null, year: null };
    }
    
    tutor.dateOfBirth.day = day;
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Birth day updated to *${day}*`, {
      parse_mode: 'Markdown',
      reply_markup: getDOBMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating DOB day:', error);
    await safeSend(bot, chatId, '❌ Error updating birth day. Please try again.');
  }
}

async function handleDOBMonthEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    const month = parseInt(text);
    if (isNaN(month) || month < 1 || month > 12) {
      return await safeSend(bot, chatId, '❌ Please enter a valid month (1-12):');
    }
    
    if (!tutor.dateOfBirth) {
      tutor.dateOfBirth = { day: null, month: null, year: null };
    }
    
    tutor.dateOfBirth.month = month;
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Birth month updated to *${month}*`, {
      parse_mode: 'Markdown',
      reply_markup: getDOBMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating DOB month:', error);
    await safeSend(bot, chatId, '❌ Error updating birth month. Please try again.');
  }
}

async function handleDOBYearEdit(bot, chatId, text, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    const year = parseInt(text);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < (currentYear - 80) || year > (currentYear - 16)) {
      return await safeSend(bot, chatId, `❌ Please enter a valid birth year (${currentYear - 80}-${currentYear - 16}):`);
    }
    
    if (!tutor.dateOfBirth) {
      tutor.dateOfBirth = { day: null, month: null, year: null };
    }
    
    tutor.dateOfBirth.year = year;
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ Birth year updated to *${year}*`, {
      parse_mode: 'Markdown',
      reply_markup: getDOBMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating DOB year:', error);
    await safeSend(bot, chatId, '❌ Error updating birth year. Please try again.');
  }
}

async function handleSpecificRateEdit(bot, chatId, text, level, userSessions, Tutor) {
  try {
    const session = userSessions[chatId];
    const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
    
    if (!tutor) {
      return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
    }
    
    // Validate rate format
    const rateMatch = text.match(/\d+/);
    if (!rateMatch) {
      return await safeSend(bot, chatId, '❌ Please enter a valid hourly rate (e.g., 40 or $40):');
    }
    
    const rate = parseInt(rateMatch[0]);
    if (rate < 10 || rate > 200) {
      return await safeSend(bot, chatId, '❌ Please enter a rate between $10-$200 per hour:');
    }
    
    if (!tutor.hourlyRates) {
      tutor.hourlyRates = {};
    }
    
    tutor.hourlyRates[level] = rate;
    await tutor.save();
    
    session.state = 'idle';
    return await safeSend(bot, chatId, `✅ ${level.charAt(0).toUpperCase() + level.slice(1)} rate updated to *$${rate}/hour*`, {
      parse_mode: 'Markdown',
      reply_markup: getHourlyRatesMenu(tutor)
    });
  } catch (error) {
    console.error('Error updating specific rate:', error);
    await safeSend(bot, chatId, '❌ Error updating hourly rate. Please try again.');
  }
}
// Fixed version of handleCallbackQuery with all editable fields and menus handled
async function handleCallbackQuery(
  bot,
  chatId,
  userId,
  data,
  Assignment,
  Tutor,
  userSessions,
  ADMIN_USERS,
  CHANNEL_ID,
  BOT_USERNAME
) {
  try {
    console.log("📥 Callback data received:", data);

    // Main menu and admin handlers
    if (data === 'main_menu') {
      return await showMainMenu(chatId, bot, userId, ADMIN_USERS);
    }

    if (data === 'admin_panel') {
      if (!isAdmin(userId, ADMIN_USERS)) {
        return await safeSend(bot, chatId, 'You are not authorized to access the admin panel.');
      }
      return await showAdminPanel(chatId, bot);
    }

    if (data.trim() === 'admin_post_assignment') {
      return await startAssignmentCreation(bot, chatId, userSessions);
    }

    if (data === 'view_assignments') {
      return await viewAssignments(bot, chatId, 0, Assignment);
    }

    if (data.startsWith('assignments_page_')) {
      const page = parseInt(data.replace('assignments_page_', ''), 10);
      return await viewAssignments(bot, chatId, page, Assignment);
    }

    if (data === 'view_applications') {
      return await viewMyApplications(bot, chatId, userSessions, Assignment);
    }

    if (data === 'admin_view_all_applications') {
      return await adminViewAllApplications(bot, chatId, Assignment);
    }

    if (data === 'admin_manage_assignments') {
      return await adminManageAssignments(bot, chatId, Assignment);
    }

    if (data.startsWith('apply_')) {
      const assignmentId = data.replace('apply_', '');
      return await handleApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions);
    }

    // Profile editing handlers
    if (data === 'profile_edit') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }
    
      const profileMsg = formatTutorProfile(tutor);
      const keyboard = showProfileEditMenu(tutor); 
      
      return await safeSend(bot, chatId, `${profileMsg}\n\nWhat would you like to edit?`, {
        parse_mode: 'Markdown',
        reply_markup: keyboard  
      });
    }
    
    if (data === 'edit_personal_info') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }
    
      return await safeSend(bot, chatId, 'Edit Personal Information:', {
        reply_markup: getPersonalInfoMenu(tutor)
      });
    }
    if (data === 'edit_full_name') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_full_name',
        userId
      };
      return await safeSend(bot, chatId, '👤 Please enter your full name:');
    }
    
    if (data === 'edit_contact_number') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_contact_number',
        userId
      };
      return await safeSend(bot, chatId, '📱 Please enter your contact number:');
    }
    // Gender editing
    if (data === 'edit_gender_menu') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }
    
      return await safeSend(bot, chatId, 'Select your gender:', {
        reply_markup: getGenderMenu()
      });
    }
    
    if (data.startsWith('set_gender_')) {
      const gender = data.replace('set_gender_', '');
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }
    
      tutor.gender = gender.charAt(0).toUpperCase() + gender.slice(1);
      await tutor.save();
    
      return await safeSend(bot, chatId, `✅ Gender updated to *${tutor.gender}*`, {
        parse_mode: 'Markdown',
        reply_markup: getPersonalInfoMenu(tutor)
      });
    }
    
    // Race editing
    if (data === 'edit_race_menu') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }
    
      return await safeSend(bot, chatId, 'Select your race:', {
        reply_markup: getRaceMenu()
      });
    }
    
    if (data.startsWith('set_race_')) {
      const race = data.replace('set_race_', '');
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }
    
      tutor.race = race.charAt(0).toUpperCase() + race.slice(1);
      await tutor.save();
    
      return await safeSend(bot, chatId, `✅ Race updated to *${tutor.race}*`, {
        parse_mode: 'Markdown',
        reply_markup: getPersonalInfoMenu(tutor)
      });
    }

    // Education editing
    if (data === 'edit_education_menu') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select your highest education level:', {
        reply_markup: getEducationMenu()
      });
    }

    if (data.startsWith('set_education_')) {
      const edu = data.replace('set_education_', '');
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      tutor.highestEducation = edu.charAt(0).toUpperCase() + edu.slice(1);
      await tutor.save();
      
      return await safeSend(bot, chatId, `✅ Education updated to *${tutor.highestEducation}*`, {
        parse_mode: 'Markdown',
        reply_markup: getPersonalInfoMenu(tutor)
      });
    }

    // Teaching levels editing
    if (data === 'edit_teaching_levels') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select teaching levels:', {
        reply_markup: getTeachingLevelsMenu(tutor)
      });
    }

    // Locations editing
    if (data === 'edit_locations') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update your preferred teaching locations:', {
        reply_markup: getLocationsMenu(tutor)
      });
    }

    if (data.startsWith('toggle_location_')) {
      const key = data.replace('toggle_location_', '');
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      tutor.locations[key] = !tutor.locations[key];
      await tutor.save();
      
      return await safeSend(bot, chatId, '✅ Location updated.', {
        reply_markup: getLocationsMenu(tutor)
      });
    }

    // Availability editing
    if (data === 'edit_availability') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update your available time slots:', {
        reply_markup: getAvailabilityMenu(tutor)
      });
    }

    if (data.startsWith('toggle_availability_')) {
      const key = data.replace('toggle_availability_', '');
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      tutor.availableTimeSlots[key] = !tutor.availableTimeSlots[key];
      await tutor.save();
      
      return await safeSend(bot, chatId, '✅ Availability updated.', {
        reply_markup: getAvailabilityMenu(tutor)
      });
    }

    // Hourly rates editing
    if (data === 'edit_hourly_rates') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update your hourly rates:', {
        reply_markup: getHourlyRatesMenu(tutor)
      });
    }

    if (data.startsWith('edit_rate_')) {
      const key = data.replace('edit_rate_', '');
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: `awaiting_rate_${key}`,
        userId
      };
      return await safeSend(bot, chatId, `💰 Please enter your new hourly rate for ${key.charAt(0).toUpperCase() + key.slice(1)} level:`);
    }

    // Additional personal info editing
    if (data === 'edit_age') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_age',
        userId
      };
      return await safeSend(bot, chatId, '👤 Please enter your age:');
    }

    if (data === 'edit_nationality') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select your nationality:', {
        reply_markup: getNationalityMenu()
      });
    }

    if (data.startsWith('set_nationality_')) {
      const nationality = data.replace('set_nationality_', '');
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      if (nationality === 'other') {
        userSessions[chatId] = {
          ...userSessions[chatId],
          state: 'awaiting_nationality_other',
          userId
        };
        return await safeSend(bot, chatId, '🌍 Please specify your nationality:');
      } else {
        tutor.nationality = nationality.charAt(0).toUpperCase() + nationality.slice(1);
        tutor.nationalityOther = null; // Clear other field if selecting predefined
        await tutor.save();

        return await safeSend(bot, chatId, `✅ Nationality updated to *${tutor.nationality}*`, {
          parse_mode: 'Markdown',
          reply_markup: getPersonalInfoMenu(tutor)
        });
      }
    }

    if (data === 'edit_nric') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_nric',
        userId
      };
      return await safeSend(bot, chatId, '🆔 Please enter the last 4 digits of your NRIC:');
    }

    if (data === 'edit_email') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_email',
        userId
      };
      return await safeSend(bot, chatId, '📧 Please enter your email address:');
    }

    if (data === 'edit_dob') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update your date of birth:', {
        reply_markup: getDOBMenu(tutor)
      });
    }

    if (data === 'edit_dob_day') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_dob_day',
        userId
      };
      return await safeSend(bot, chatId, '📅 Please enter the day (1-31):');
    }

    if (data === 'edit_dob_month') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_dob_month',
        userId
      };
      return await safeSend(bot, chatId, '📅 Please enter the month (1-12):');
    }

    if (data === 'edit_dob_year') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_dob_year',
        userId
      };
      return await safeSend(bot, chatId, '📅 Please enter the year (e.g., 1995):');
    }

    if (data === 'edit_introduction') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_introduction',
        userId
      };
      return await safeSend(bot, chatId, '📝 Please enter your introduction/bio:');
    }

    if (data === 'edit_teaching_experience') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_teaching_experience',
        userId
      };
      return await safeSend(bot, chatId, '👨‍🏫 Please describe your teaching experience:');
    }

    if (data === 'edit_track_record') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_track_record',
        userId
      };
      return await safeSend(bot, chatId, '🏆 Please describe your track record:');
    }

    if (data === 'edit_selling_points') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_selling_points',
        userId
      };
      return await safeSend(bot, chatId, '⭐ Please enter your key selling points:');
    }

    if (data === 'edit_years_experience') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_years_experience',
        userId
      };
      return await safeSend(bot, chatId, '📚 Please enter your years of tutoring experience:');
    }

    if (data === 'edit_tutor_type') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select your tutor type:', {
        reply_markup: getTutorTypeMenu()
      });
    }

    if (data.startsWith('set_tutor_type_')) {
      const tutorType = data.replace('set_tutor_type_', '');
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      tutor.tutorType = tutorType.charAt(0).toUpperCase() + tutorType.slice(1);
      await tutor.save();

      return await safeSend(bot, chatId, `✅ Tutor type updated to *${tutor.tutorType}*`, {
        parse_mode: 'Markdown',
        reply_markup: getPersonalInfoMenu(tutor)
      });
    }

    if (data === 'edit_current_school') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_current_school',
        userId
      };
      return await safeSend(bot, chatId, '🏫 Please enter your current school:');
    }

    if (data === 'edit_previous_schools') {
      userSessions[chatId] = {
        ...userSessions[chatId],
        state: 'awaiting_previous_schools',
        userId
      };
      return await safeSend(bot, chatId, '🏫 Please enter your previous schools:');
    }

    // Teaching levels with proper toggle display
    if (data === 'edit_teaching_levels_detailed') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select which teaching levels you want to configure:', {
        reply_markup: getTeachingLevelsDetailedMenu(tutor)
      });
    }

    if (data.startsWith('toggle_level_')) {
      const level = data.replace('toggle_level_', '');
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      // Initialize the level object if it doesn't exist
      if (!tutor.teachingLevels[level]) {
        tutor.teachingLevels[level] = {};
      }

      // Toggle the level - this would enable/disable the entire level
      const hasAnySubject = Object.values(tutor.teachingLevels[level]).some(val => val === true);
      
      // If any subject is enabled, disable all. If none enabled, enable common ones
      if (hasAnySubject) {
        Object.keys(tutor.teachingLevels[level]).forEach(subject => {
          tutor.teachingLevels[level][subject] = false;
        });
      } else {
        // Enable common subjects based on level
        const commonSubjects = {
          primary: ['english', 'math'],
          secondary: ['english', 'math'],
          jc: ['generalPaper', 'h2Math'],
          international: ['ib']
        };
        
        commonSubjects[level]?.forEach(subject => {
          if (tutor.teachingLevels[level].hasOwnProperty(subject)) {
            tutor.teachingLevels[level][subject] = true;
          }
        });
      }

      await tutor.save();
      
      return await safeSend(bot, chatId, `✅ ${level.charAt(0).toUpperCase() + level.slice(1)} level updated.`, {
        reply_markup: getTeachingLevelsDetailedMenu(tutor)
      });
    }

    // Subject editing handlers
    if (data === 'edit_primary_subjects') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update Primary level subjects:', {
        reply_markup: getPrimarySubjectsMenu(tutor)
      });
    }
    
    if (data === 'edit_secondary_subjects') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update Secondary level subjects:', {
        reply_markup: getSecondarySubjectsMenu(tutor)
      });
    }
    
    if (data === 'edit_jc_subjects') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update JC level subjects:', {
        reply_markup: getJCSubjectsMenu(tutor)
      });
    }
    
    if (data === 'edit_international_subjects') {
      const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update International level subjects:', {
        reply_markup: getInternationalSubjectsMenu(tutor)
      });
    }

    // Subject toggle handlers
    const toggleCategories = ['primary', 'secondary', 'jc', 'international'];
    for (const cat of toggleCategories) {
      if (data.startsWith(`toggle_${cat}_`)) {
        const key = data.replace(`toggle_${cat}_`, '');
        const tutor = await getTutorFromSession(chatId, userSessions, Tutor);
        if (!tutor) {
          return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
        }

        tutor.teachingLevels[cat][key] = !tutor.teachingLevels[cat][key];
        await tutor.save();

        const menuFn = {
          primary: getPrimarySubjectsMenu,
          secondary: getSecondarySubjectsMenu,
          jc: getJCSubjectsMenu,
          international: getInternationalSubjectsMenu
        }[cat];

        return await safeSend(bot, chatId, `✅ ${cat.charAt(0).toUpperCase() + cat.slice(1)} subject updated.`, {
          reply_markup: menuFn(tutor)
        });
      }
    }

    // Default handler for unimplemented actions
    return await safeSend(bot, chatId, '❓ This action is not yet implemented.');
    
  } catch (error) {
    console.error('❌ Error in handleCallbackQuery:', error);
    return await safeSend(bot, chatId, 'An error occurred. Please try again.');
  }
}

async function handleMessage(bot, chatId, userId, text, message, Tutor, Assignment, userSessions, ADMIN_USERS, BOT_USERNAME) {
  // Initialize session using chatId for consistency
  if (!userSessions[chatId]) {
    userSessions[chatId] = { state: 'idle' };
  }

  const session = userSessions[chatId];
  const isUserAdmin = isAdmin(userId, ADMIN_USERS);

  // Handle non-text messages first
  if (!text || typeof text !== 'string') {
    // Handle contact sharing - delegate to your existing handleContact function
    if (message.contact) {
      return await handleContact(bot, chatId, userId, message.contact, Tutor, userSessions, ADMIN_USERS);
    }
    
    // For other non-text messages, show main menu or prompt for contact if needed
    if (session.state === 'awaiting_contact') {
      return await safeSend(bot, chatId, '👋 Please share your contact number using the button below to continue.', {
        reply_markup: {
          keyboard: [[{
            text: '📞 Share Contact Number',
            request_contact: true
          }]],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    }
    
    // For users without proper setup, redirect to start
    if (!session.tutorId) {
      return await handleStart(bot, chatId, userId, Tutor, userSessions, null, Assignment, ADMIN_USERS, BOT_USERNAME);
    }
    
    // Show main menu for established users
    return await showMainMenu(chatId, bot, userId, ADMIN_USERS);
  }

  // Handle /start command - delegate to your existing handleStart function
  if (text === '/start' || text.startsWith('/start ')) {
    const startParam = text.includes(' ') ? text.split(' ')[1] : null;
    return await handleStart(bot, chatId, userId, Tutor, userSessions, startParam, Assignment, ADMIN_USERS, BOT_USERNAME);
  }

  // Check if user is in awaiting_contact state
  if (session.state === 'awaiting_contact') {
    return await safeSend(bot, chatId, '👋 Please share your contact number using the button below to continue.', {
      reply_markup: {
        keyboard: [[{
          text: '📞 Share Contact Number',
          request_contact: true
        }]],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    });
  }

  // For users without proper setup, redirect to start
  if (!session.tutorId) {
    return await handleStart(bot, chatId, userId, Tutor, userSessions, null, Assignment, ADMIN_USERS, BOT_USERNAME);
  }

  // Admin assignment creation flow
  if (isUserAdmin && text === '/newassignment') {
    session.state = 'awaiting_assignment_title';
    session.assignmentDraft = {};
    return await safeSend(bot, chatId, 'Please enter the assignment title:');
  }

  if (isUserAdmin && session.state === 'awaiting_assignment_title') {
    session.assignmentDraft.title = text;
    session.state = 'awaiting_assignment_subject';
    return await safeSend(bot, chatId, 'Enter the subject:');
  }

  if (isUserAdmin && session.state === 'awaiting_assignment_subject') {
    session.assignmentDraft.subject = text;
    session.state = 'awaiting_assignment_level';
    return await safeSend(bot, chatId, 'Enter the level (e.g., Secondary 2):');
  }

  if (isUserAdmin && session.state === 'awaiting_assignment_level') {
    session.assignmentDraft.level = text;
    session.state = 'awaiting_assignment_description';
    return await safeSend(bot, chatId, 'Enter the description:');
  }

  if (isUserAdmin && session.state === 'awaiting_assignment_description') {
    session.assignmentDraft.description = text;
    session.state = 'awaiting_assignment_rate';
    return await safeSend(bot, chatId, 'Enter the rate (e.g., $40/hour):');
  }

  if (isUserAdmin && session.state === 'awaiting_assignment_rate') {
    session.assignmentDraft.rate = text;
    session.state = 'idle';

    const assignment = new Assignment({
      ...session.assignmentDraft,
      frequency: 'Once a week',
      startDate: new Date(),
      location: 'Online',
      duration: '1h',
    });

    await assignment.save();
    await safeSend(bot, chatId, `✅ Assignment created:\n\n${assignment.title}`);
    return;
  }

  // Handle direct application commands (legacy support)
  if (text.startsWith('/apply_')) {
    const assignmentId = text.split('_')[1];
    return await handleApplication(bot, chatId, userId, assignmentId, Assignment, Tutor, userSessions);
  }

  // Profile editing states - MOVED FROM handleCallbackQuery
  if (session.state === 'editing_name') {
    return await handleNameEdit(bot, chatId, text, userSessions, Tutor);
  }

  if (session.state === 'editing_bio') {
    return await handleBioEdit(bot, chatId, text, userSessions, Tutor);
  }

  if (session.state === 'editing_experience') {
    return await handleExperienceEdit(bot, chatId, text, userSessions, Tutor);
  }

  if (session.state === 'editing_qualifications') {
    return await handleQualificationsEdit(bot, chatId, text, userSessions, Tutor);
  }

  if (session.state === 'editing_hourly_rate') {
    return await handleHourlyRateEdit(bot, chatId, text, userSessions, Tutor);
  }

  // ADD ALL THE TEXT INPUT HANDLERS HERE (moved from handleCallbackQuery)
  if (session.state === 'awaiting_age') {
    return await handleAgeEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Full name editing
  if (session.state === 'awaiting_full_name') {
    return await handleFullNameEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Contact number editing
  if (session.state === 'awaiting_contact_number') {
    return await handleContactNumberEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // NRIC editing
  if (session.state === 'awaiting_nric') {
    return await handleNRICEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Email editing
  if (session.state === 'awaiting_email') {
    return await handleEmailEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // DOB editing
  if (session.state === 'awaiting_dob_day') {
    return await handleDOBDayEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  if (session.state === 'awaiting_dob_month') {
    return await handleDOBMonthEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  if (session.state === 'awaiting_dob_year') {
    return await handleDOBYearEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Introduction editing
  if (session.state === 'awaiting_introduction') {
    return await handleIntroductionEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Teaching experience editing
  if (session.state === 'awaiting_teaching_experience') {
    return await handleTeachingExperienceEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Track record editing
  if (session.state === 'awaiting_track_record') {
    return await handleTrackRecordEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Selling points editing
  if (session.state === 'awaiting_selling_points') {
    return await handleSellingPointsEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Years experience editing
  if (session.state === 'awaiting_years_experience') {
    return await handleYearsExperienceEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Current school editing
  if (session.state === 'awaiting_current_school') {
    return await handleCurrentSchoolEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Previous schools editing
  if (session.state === 'awaiting_previous_schools') {
    return await handlePreviousSchoolsEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Nationality other editing
  if (session.state === 'awaiting_nationality_other') {
    return await handleNationalityOtherEdit(bot, chatId, text, userSessions, Tutor);
  }
  
  // Hourly rate editing for specific levels
  if (session.state.startsWith('awaiting_rate_')) {
    const level = session.state.replace('awaiting_rate_', '');
    return await handleSpecificRateEdit(bot, chatId, text, level, userSessions, Tutor);
  }

  // Default response - show main menu
  await safeSend(bot, chatId, 'I didn\'t understand that command. Here\'s the main menu:');
  return await showMainMenu(chatId, bot, userId, ADMIN_USERS);
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
  handleCallbackQuery,
  handleMessage,
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
  showProfileEditMenu,
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
  getNationalityMenu,
  getDOBMenu,
  getHourlyRatesMenu,
  getTutorTypeMenu,
  
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
  confirmPostAssignment,
  
  // Constants
  ITEMS_PER_PAGE
};