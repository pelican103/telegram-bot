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
// Profile editing handlers
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

    // Helper function to get tutor from session
    const getTutorFromSession = async (chatId) => {
      let tutor;
      if (userSessions[chatId]?.tutorId) {
        tutor = await Tutor.findById(userSessions[chatId].tutorId);
      }
      if (!tutor && userSessions[chatId]?.contactNumber) {
        const phoneVariations = normalizePhone(userSessions[chatId].contactNumber);
        tutor = await Tutor.findOne({ contactNumber: { $in: phoneVariations } });
      }
      return tutor;
    };

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
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }
    
      return await safeSend(bot, chatId, 'Select your gender:', {
        reply_markup: getGenderMenu()
      });
    }
    
    if (data.startsWith('set_gender_')) {
      const gender = data.replace('set_gender_', '');
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }
    
      return await safeSend(bot, chatId, 'Select your race:', {
        reply_markup: getRaceMenu()
      });
    }
    
    if (data.startsWith('set_race_')) {
      const race = data.replace('set_race_', '');
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select your highest education level:', {
        reply_markup: getEducationMenu()
      });
    }

    if (data.startsWith('set_education_')) {
      const edu = data.replace('set_education_', '');
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select teaching levels:', {
        reply_markup: getTeachingLevelsMenu(tutor)
      });
    }

    // Locations editing
    if (data === 'edit_locations') {
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update your preferred teaching locations:', {
        reply_markup: getLocationsMenu(tutor)
      });
    }

    if (data.startsWith('toggle_location_')) {
      const key = data.replace('toggle_location_', '');
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update your available time slots:', {
        reply_markup: getAvailabilityMenu(tutor)
      });
    }

    if (data.startsWith('toggle_availability_')) {
      const key = data.replace('toggle_availability_', '');
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select your nationality:', {
        reply_markup: getNationalityMenu()
      });
    }

    if (data.startsWith('set_nationality_')) {
      const nationality = data.replace('set_nationality_', '');
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select your tutor type:', {
        reply_markup: getTutorTypeMenu()
      });
    }

    if (data.startsWith('set_tutor_type_')) {
      const tutorType = data.replace('set_tutor_type_', '');
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Select which teaching levels you want to configure:', {
        reply_markup: getTeachingLevelsDetailedMenu(tutor)
      });
    }

    if (data.startsWith('toggle_level_')) {
      const level = data.replace('toggle_level_', '');
      const tutor = await getTutorFromSession(chatId);
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
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update Primary level subjects:', {
        reply_markup: getPrimarySubjectsMenu(tutor)
      });
    }
    
    if (data === 'edit_secondary_subjects') {
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update Secondary level subjects:', {
        reply_markup: getSecondarySubjectsMenu(tutor)
      });
    }
    
    if (data === 'edit_jc_subjects') {
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update JC level subjects:', {
        reply_markup: getJCSubjectsMenu(tutor)
      });
    }
    
    if (data === 'edit_international_subjects') {
      const tutor = await getTutorFromSession(chatId);
      if (!tutor) {
        return await safeSend(bot, chatId, '❌ We couldn\'t find your profile. Please type /start and share your contact number again.');
      }

      return await safeSend(bot, chatId, 'Update International level subjects:', {
        reply_markup: getInternationalSubjectsMenu(tutor)
      });
    }
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

    // Subject toggle handlers
    const toggleCategories = ['primary', 'secondary', 'jc', 'international'];
    for (const cat of toggleCategories) {
      if (data.startsWith(`toggle_${cat}_`)) {
        const key = data.replace(`toggle_${cat}_`, '');
        const tutor = await getTutorFromSession(chatId);
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

  // Profile editing states
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
  confirmPostAssignment,
  
  // Constants
  ITEMS_PER_PAGE
};