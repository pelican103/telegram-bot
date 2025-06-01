// utils/menus.js - Enhanced menu system for Telegram bot

import { getTick } from './helpers.js';

// Main menu builders
export function getMainMenu() {
  return {
    inline_keyboard: [
      [{ text: '📋 View Available Assignments', callback_data: 'view_assignments' }],
      [{ text: '📝 My Applications', callback_data: 'view_applications' }],
      [{ text: '👤 Update Profile', callback_data: 'profile_edit' }],
      [{ text: '🔍 Search Assignments', callback_data: 'search_assignments' }],
      [{ text: '📊 My Statistics', callback_data: 'view_stats' }]
    ]
  };
}

export function getEditProfileMenu(tutor) {
  return {
    inline_keyboard: [
      [
        { text: 'Name', callback_data: 'edit_fullName' },
        { text: 'Contact', callback_data: 'edit_contactNumber' }
      ],
      [
        { text: 'Email', callback_data: 'edit_email' },
        { text: 'Age', callback_data: 'edit_age' }
      ],
      [
        { text: 'Gender', callback_data: 'set_gender_menu' },
        { text: 'Race', callback_data: 'set_race_menu' }
      ],
      [
        { text: 'Education', callback_data: 'set_education_menu' },
        { text: 'School', callback_data: 'edit_currentSchool' }
      ],
      [
        { text: 'Teaching Levels', callback_data: 'edit_teachingLevels' },
        { text: 'Subjects', callback_data: 'edit_subjects' }
      ],
      [
        { text: 'Availability', callback_data: 'edit_availability' },
        { text: 'Location', callback_data: 'edit_locations' }
      ],
      [
        { text: 'Hourly Rate', callback_data: 'edit_hourlyRate' },
        { text: 'Experience', callback_data: 'edit_yearsOfExperience' }
      ],
      [{ text: 'Introduction', callback_data: 'edit_introduction' }],
      [{ text: '✅ Done Editing', callback_data: 'profile_confirm' }],
      [{ text: '🏠 Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

// Teaching levels menu with enhanced functionality
export function getTeachingLevelMenu(tutor) {
  const levels = tutor.teachingLevels || {};
  return {
    inline_keyboard: [
      [{ text: `${getTick(levels.primary)} Primary`, callback_data: 'toggle_primary' }],
      [{ text: `${getTick(levels.secondary)} Secondary`, callback_data: 'toggle_secondary' }],
      [{ text: `${getTick(levels.jc)} Junior College (JC)`, callback_data: 'toggle_jc' }],
      [{ text: `${getTick(levels.international)} International`, callback_data: 'toggle_international' }],
      [{ text: '💾 Save & Back', callback_data: 'profile_edit' }]
    ]
  };
}

// Subject menu for each level
export function getPrimarySubjectsMenu(tutor) {
  const subjects = tutor.teachingLevels?.primary || {};
  return {
    inline_keyboard: [
      [
        { text: `${getTick(subjects.english)} English`, callback_data: 'toggle_primary_english' },
        { text: `${getTick(subjects.math)} Math`, callback_data: 'toggle_primary_math' }
      ],
      [
        { text: `${getTick(subjects.science)} Science`, callback_data: 'toggle_primary_science' },
        { text: `${getTick(subjects.chinese)} Chinese`, callback_data: 'toggle_primary_chinese' }
      ],
      [
        { text: `${getTick(subjects.malay)} Malay`, callback_data: 'toggle_primary_malay' },
        { text: `${getTick(subjects.tamil)} Tamil`, callback_data: 'toggle_primary_tamil' }
      ],
      [{ text: '🔙 Back to Levels', callback_data: 'edit_teachingLevels' }]
    ]
  };
}

export function getSecondarySubjectsMenu(tutor) {
  const subjects = tutor.teachingLevels?.secondary || {};
  return {
    inline_keyboard: [
      [
        { text: `${getTick(subjects.english)} English`, callback_data: 'toggle_secondary_english' },
        { text: `${getTick(subjects.math)} Math`, callback_data: 'toggle_secondary_math' }
      ],
      [
        { text: `${getTick(subjects.aMath)} A Math`, callback_data: 'toggle_secondary_aMath' },
        { text: `${getTick(subjects.eMath)} E Math`, callback_data: 'toggle_secondary_eMath' }
      ],
      [
        { text: `${getTick(subjects.physics)} Physics`, callback_data: 'toggle_secondary_physics' },
        { text: `${getTick(subjects.chemistry)} Chemistry`, callback_data: 'toggle_secondary_chemistry' }
      ],
      [
        { text: `${getTick(subjects.biology)} Biology`, callback_data: 'toggle_secondary_biology' },
        { text: `${getTick(subjects.science)} Science`, callback_data: 'toggle_secondary_science' }
      ],
      [
        { text: `${getTick(subjects.history)} History`, callback_data: 'toggle_secondary_history' },
        { text: `${getTick(subjects.geography)} Geography`, callback_data: 'toggle_secondary_geography' }
      ],
      [
        { text: `${getTick(subjects.literature)} Literature`, callback_data: 'toggle_secondary_literature' },
        { text: `${getTick(subjects.chinese)} Chinese`, callback_data: 'toggle_secondary_chinese' }
      ],
      [
        { text: `${getTick(subjects.malay)} Malay`, callback_data: 'toggle_secondary_malay' },
        { text: `${getTick(subjects.tamil)} Tamil`, callback_data: 'toggle_secondary_tamil' }
      ],
      [{ text: '🔙 Back to Levels', callback_data: 'edit_teachingLevels' }]
    ]
  };
}

export function getJCSubjectsMenu(tutor) {
  const subjects = tutor.teachingLevels?.jc || {};
  return {
    inline_keyboard: [
      [
        { text: `${getTick(subjects.generalPaper)} General Paper`, callback_data: 'toggle_jc_generalPaper' },
        { text: `${getTick(subjects.h1Math)} H1 Math`, callback_data: 'toggle_jc_h1Math' }
      ],
      [
        { text: `${getTick(subjects.h2Math)} H2 Math`, callback_data: 'toggle_jc_h2Math' },
        { text: `${getTick(subjects.h1Physics)} H1 Physics`, callback_data: 'toggle_jc_h1Physics' }
      ],
      [
        { text: `${getTick(subjects.h2Physics)} H2 Physics`, callback_data: 'toggle_jc_h2Physics' },
        { text: `${getTick(subjects.h1Chemistry)} H1 Chemistry`, callback_data: 'toggle_jc_h1Chemistry' }
      ],
      [
        { text: `${getTick(subjects.h2Chemistry)} H2 Chemistry`, callback_data: 'toggle_jc_h2Chemistry' },
        { text: `${getTick(subjects.h1Biology)} H1 Biology`, callback_data: 'toggle_jc_h1Biology' }
      ],
      [
        { text: `${getTick(subjects.h2Biology)} H2 Biology`, callback_data: 'toggle_jc_h2Biology' },
        { text: `${getTick(subjects.h1Economics)} H1 Economics`, callback_data: 'toggle_jc_h1Economics' }
      ],
      [
        { text: `${getTick(subjects.h2Economics)} H2 Economics`, callback_data: 'toggle_jc_h2Economics' },
        { text: `${getTick(subjects.h1History)} H1 History`, callback_data: 'toggle_jc_h1History' }
      ],
      [
        { text: `${getTick(subjects.h2History)} H2 History`, callback_data: 'toggle_jc_h2History' }
      ],
      [{ text: '🔙 Back to Levels', callback_data: 'edit_teachingLevels' }]
    ]
  };
}

export function getInternationalSubjectsMenu(tutor) {
  const subjects = tutor.teachingLevels?.international || {};
  return {
    inline_keyboard: [
      [
        { text: `${getTick(subjects.ib)} IB`, callback_data: 'toggle_international_ib' },
        { text: `${getTick(subjects.igcse)} IGCSE`, callback_data: 'toggle_international_igcse' }
      ],
      [
        { text: `${getTick(subjects.ielts)} IELTS`, callback_data: 'toggle_international_ielts' },
        { text: `${getTick(subjects.toefl)} TOEFL`, callback_data: 'toggle_international_toefl' }
      ],
      [{ text: '🔙 Back to Levels', callback_data: 'edit_teachingLevels' }]
    ]
  };
}

// Enhanced availability menu with more granular options
export function getAvailabilityMenu(tutor) {
  const slots = tutor.availableTimeSlots || {};
  
  const text = `*Current Availability:*\n\n` +
    `*Weekdays:*\n` +
    `${getTick(slots.weekdayMorning)} Morning (8AM-12PM)\n` +
    `${getTick(slots.weekdayAfternoon)} Afternoon (12PM-6PM)\n` +
    `${getTick(slots.weekdayEvening)} Evening (6PM-10PM)\n\n` +
    `*Weekends:*\n` +
    `${getTick(slots.weekendMorning)} Morning (8AM-12PM)\n` +
    `${getTick(slots.weekendAfternoon)} Afternoon (12PM-6PM)\n` +
    `${getTick(slots.weekendEvening)} Evening (6PM-10PM)\n\n` +
    `Select to toggle your availability:`;

  return {
    text,
    options: {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: `${getTick(slots.weekdayMorning)} Weekday Morning`, callback_data: 'toggle_weekdayMorning' },
            { text: `${getTick(slots.weekdayAfternoon)} Weekday Afternoon`, callback_data: 'toggle_weekdayAfternoon' }
          ],
          [
            { text: `${getTick(slots.weekdayEvening)} Weekday Evening`, callback_data: 'toggle_weekdayEvening' },
            { text: `${getTick(slots.weekendMorning)} Weekend Morning`, callback_data: 'toggle_weekendMorning' }
          ],
          [
            { text: `${getTick(slots.weekendAfternoon)} Weekend Afternoon`, callback_data: 'toggle_weekendAfternoon' },
            { text: `${getTick(slots.weekendEvening)} Weekend Evening`, callback_data: 'toggle_weekendEvening' }
          ],
          [{ text: '💾 Save & Back', callback_data: 'profile_edit' }]
        ]
      }
    }
  };
}

// Location preferences menu
export function getLocationsMenu(tutor) {
  const locations = tutor.locations || {};
  
  // Singapore regions from schema
  const regions = [
    'north', 'south', 'east', 'west', 'central',
    'northeast', 'northwest'
  ];
  
  const keyboard = [];
  
  // Create rows of 2 locations each
  for (let i = 0; i < regions.length; i += 2) {
    const row = [];
    row.push({
      text: `${getTick(locations[regions[i]])} ${regions[i].charAt(0).toUpperCase() + regions[i].slice(1)}`,
      callback_data: `toggle_location_${regions[i]}`
    });
    
    if (i + 1 < regions.length) {
      row.push({
        text: `${getTick(locations[regions[i + 1]])} ${regions[i + 1].charAt(0).toUpperCase() + regions[i + 1].slice(1)}`,
        callback_data: `toggle_location_${regions[i + 1]}`
      });
    }
    keyboard.push(row);
  }
  
  keyboard.push([
    { text: 'Select All', callback_data: 'location_select_all' },
    { text: 'Clear All', callback_data: 'location_clear_all' }
  ]);
  keyboard.push([{ text: '💾 Save & Back', callback_data: 'profile_edit' }]);
  
  return {
    inline_keyboard: keyboard
  };
}

// Hourly rate menu for different levels
export function getHourlyRateMenu(tutor) {
  return {
    inline_keyboard: [
      [{ text: 'Primary Rate', callback_data: 'edit_rate_primary' }],
      [{ text: 'Secondary Rate', callback_data: 'edit_rate_secondary' }],
      [{ text: 'JC Rate', callback_data: 'edit_rate_jc' }],
      [{ text: 'International Rate', callback_data: 'edit_rate_international' }],
      [{ text: 'Set All Same Rate', callback_data: 'edit_rate_all' }],
      [{ text: '💾 Save & Back', callback_data: 'profile_edit' }]
    ]
  };
}

// Dropdown menus for profile fields
export function getGenderMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Male', callback_data: 'set_gender_male' }],
      [{ text: 'Female', callback_data: 'set_gender_female' }],
      [{ text: 'Other', callback_data: 'set_gender_other' }],
      [{ text: 'Prefer not to say', callback_data: 'set_gender_prefer_not_to_say' }],
      [{ text: '🔙 Back', callback_data: 'profile_edit' }]
    ]
  };
}

export function getRaceMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Chinese', callback_data: 'set_race_chinese' }],
      [{ text: 'Malay', callback_data: 'set_race_malay' }],
      [{ text: 'Indian', callback_data: 'set_race_indian' }],
      [{ text: 'Eurasian', callback_data: 'set_race_eurasian' }],
      [{ text: 'Others', callback_data: 'set_race_others' }],
      [{ text: '🔙 Back', callback_data: 'profile_edit' }]
    ]
  };
}

export function getHighestEducationMenu() {
  return {
    inline_keyboard: [
      [{ text: 'O Levels', callback_data: 'set_education_olevels' }],
      [{ text: 'A Levels', callback_data: 'set_education_alevels' }],
      [{ text: 'Diploma', callback_data: 'set_education_diploma' }],
      [{ text: 'Bachelor\'s Degree', callback_data: 'set_education_degree' }],
      [{ text: 'Master\'s Degree', callback_data: 'set_education_masters' }],
      [{ text: 'PhD/Doctorate', callback_data: 'set_education_phd' }],
      [{ text: 'Professional Certification', callback_data: 'set_education_professional' }],
      [{ text: 'Others', callback_data: 'set_education_others' }],
      [{ text: '🔙 Back', callback_data: 'profile_edit' }]
    ]
  };
}

// Assignment filter menu
export function getAssignmentFilterMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📚 Subject', callback_data: 'filter_subject' },
        { text: '🎓 Level', callback_data: 'filter_level' }
      ],
      [
        { text: '📍 Location', callback_data: 'filter_location' },
        { text: '💰 Rate Range', callback_data: 'filter_rate_range' }
      ],
      [
        { text: '⏰ Schedule', callback_data: 'filter_schedule' },
        { text: '👥 Student Count', callback_data: 'filter_student_count' }
      ],
      [
        { text: '👨‍🏫 Tutor Requirements', callback_data: 'filter_requirements' },
        { text: '📅 Start Date', callback_data: 'filter_start_date' }
      ],
      [{ text: '🔍 Apply Filters', callback_data: 'apply_filters' }],
      [{ text: '🗑️ Clear All Filters', callback_data: 'clear_all_filters' }],
      [{ text: '🔙 Back to Assignments', callback_data: 'view_assignments' }]
    ]
  };
}

export function getLevelFilterMenu() {
  return {
    inline_keyboard: [
      [
        { text: 'Primary', callback_data: 'level_primary' },
        { text: 'Secondary', callback_data: 'level_secondary' }
      ],
      [
        { text: 'Junior College', callback_data: 'level_jc' },
        { text: 'International', callback_data: 'level_international' }
      ],
      [{ text: '🔙 Back', callback_data: 'filter_assignments' }]
    ]
  };
}

export function getScheduleFilterMenu() {
  return {
    inline_keyboard: [
      [
        { text: '🌅 Weekday Morning', callback_data: 'schedule_weekdayMorning' },
        { text: '☀️ Weekday Afternoon', callback_data: 'schedule_weekdayAfternoon' }
      ],
      [
        { text: '🌆 Weekday Evening', callback_data: 'schedule_weekdayEvening' },
        { text: '🌅 Weekend Morning', callback_data: 'schedule_weekendMorning' }
      ],
      [
        { text: '☀️ Weekend Afternoon', callback_data: 'schedule_weekendAfternoon' },
        { text: '🌆 Weekend Evening', callback_data: 'schedule_weekendEvening' }
      ],
      [{ text: '🔙 Back', callback_data: 'advanced_filters' }]
    ]
  };
}

export function getStudentCountMenu() {
  return {
    inline_keyboard: [
      [{ text: '1 Student', callback_data: 'students_1' }],
      [{ text: '2 Students', callback_data: 'students_2' }],
      [{ text: '3-5 Students', callback_data: 'students_3_5' }],
      [{ text: '6+ Students', callback_data: 'students_6_plus' }],
      [{ text: '🔙 Back', callback_data: 'advanced_filters' }]
    ]
  };
}

export function getTutorRequirementsMenu() {
  return {
    inline_keyboard: [
      [
        { text: 'Gender', callback_data: 'req_gender' },
        { text: 'Race', callback_data: 'req_race' }
      ],
      [
        { text: 'Experience', callback_data: 'req_experience' },
        { text: 'Qualifications', callback_data: 'req_qualifications' }
      ],
      [{ text: '🔙 Back', callback_data: 'advanced_filters' }]
    ]
  };
}

export function getGenderRequirementsMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Male', callback_data: 'req_gender_male' }],
      [{ text: 'Female', callback_data: 'req_gender_female' }],
      [{ text: 'Any', callback_data: 'req_gender_any' }],
      [{ text: '🔙 Back', callback_data: 'filter_requirements' }]
    ]
  };
}

export function getRaceRequirementsMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Chinese', callback_data: 'req_race_chinese' }],
      [{ text: 'Malay', callback_data: 'req_race_malay' }],
      [{ text: 'Indian', callback_data: 'req_race_indian' }],
      [{ text: 'Eurasian', callback_data: 'req_race_eurasian' }],
      [{ text: 'Any', callback_data: 'req_race_any' }],
      [{ text: '🔙 Back', callback_data: 'filter_requirements' }]
    ]
  };
}

export function getExperienceRequirementsMenu() {
  return {
    inline_keyboard: [
      [{ text: 'None', callback_data: 'req_experience_none' }],
      [{ text: '1-2 years', callback_data: 'req_experience_1_2' }],
      [{ text: '3-5 years', callback_data: 'req_experience_3_5' }],
      [{ text: '5+ years', callback_data: 'req_experience_5_plus' }],
      [{ text: '🔙 Back', callback_data: 'filter_requirements' }]
    ]
  };
}

export function getQualificationsRequirementsMenu() {
  return {
    inline_keyboard: [
      [{ text: 'O Levels', callback_data: 'req_qual_olevels' }],
      [{ text: 'A Levels', callback_data: 'req_qual_alevels' }],
      [{ text: 'Diploma', callback_data: 'req_qual_diploma' }],
      [{ text: 'Degree', callback_data: 'req_qual_degree' }],
      [{ text: 'Masters', callback_data: 'req_qual_masters' }],
      [{ text: 'PhD', callback_data: 'req_qual_phd' }],
      [{ text: 'Any', callback_data: 'req_qual_any' }],
      [{ text: '🔙 Back', callback_data: 'filter_requirements' }]
    ]
  };
}

// Application management menus
export function getApplicationActionMenu(applicationId, status) {
  const keyboard = [];
  
  if (status === 'Pending') {
    keyboard.push([{ text: '❌ Withdraw Application', callback_data: `withdraw_${applicationId}` }]);
  }
  
  keyboard.push([{ text: '📋 View Assignment Details', callback_data: `assignment_details_${applicationId}` }]);
  keyboard.push([{ text: '🔙 Back to Applications', callback_data: 'view_applications' }]);
  
  return {
    inline_keyboard: keyboard
  };
}

// Confirmation menus
export function getConfirmationMenu(action, itemId) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Yes, Confirm', callback_data: `confirm_${action}_${itemId}` },
        { text: '❌ Cancel', callback_data: 'cancel_action' }
      ]
    ]
  };
}

// Pagination menu helper
export function getPaginationMenu(currentPage, totalPages, baseCallback, additionalButtons = []) {
  const keyboard = [];
  const paginationRow = [];
  
  if (currentPage > 1) {
    paginationRow.push({ text: '◀️ Previous', callback_data: `${baseCallback}_${currentPage - 1}` });
  }
  
  paginationRow.push({ text: `${currentPage}/${totalPages}`, callback_data: 'page_info' });
  
  if (currentPage < totalPages) {
    paginationRow.push({ text: 'Next ▶️', callback_data: `${baseCallback}_${currentPage + 1}` });
  }
  
  if (paginationRow.length > 0) {
    keyboard.push(paginationRow);
  }
  
  // Add any additional buttons
  additionalButtons.forEach(button => {
    keyboard.push([button]);
  });
  
  return {
    inline_keyboard: keyboard
  };
}

// Statistics menu
export function getStatsMenu() {
  return {
    inline_keyboard: [
      [{ text: '📊 Application Stats', callback_data: 'stats_applications' }],
      [{ text: '💰 Earnings Overview', callback_data: 'stats_earnings' }],
      [{ text: '📈 Success Rate', callback_data: 'stats_success_rate' }],
      [{ text: '⏱️ Response Time', callback_data: 'stats_response_time' }],
      [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

// Search menu
export function getSearchMenu() {
  return {
    inline_keyboard: [
      [{ text: '🔍 Quick Search', callback_data: 'quick_search' }],
      [{ text: '🎯 Advanced Filters', callback_data: 'advanced_filters' }],
      [{ text: '⭐ Saved Searches', callback_data: 'saved_searches' }],
      [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

// Advanced filters menu
export function getAdvancedFiltersMenu() {
  return {
    inline_keyboard: [
      [
        { text: '📚 Subject', callback_data: 'filter_subject' },
        { text: '🎓 Level', callback_data: 'filter_level' }
      ],
      [
        { text: '📍 Location', callback_data: 'filter_location' },
        { text: '💰 Rate Range', callback_data: 'filter_rate_range' }
      ],
      [
        { text: '📅 Schedule', callback_data: 'filter_schedule' },
        { text: '👥 Student Count', callback_data: 'filter_student_count' }
      ],
      [{ text: '🔍 Apply Filters', callback_data: 'apply_filters' }],
      [{ text: '🗑️ Clear All Filters', callback_data: 'clear_all_filters' }],
      [{ text: '🔙 Back', callback_data: 'search_assignments' }]
    ]
  };
}

// Rate range filter menu
export function getRateRangeMenu() {
  return {
    inline_keyboard: [
      [{ text: '$20-30/hr', callback_data: 'rate_range_20_30' }],
      [{ text: '$30-50/hr', callback_data: 'rate_range_30_50' }],
      [{ text: '$50-80/hr', callback_data: 'rate_range_50_80' }],
      [{ text: '$80-120/hr', callback_data: 'rate_range_80_120' }],
      [{ text: '$120+/hr', callback_data: 'rate_range_120_plus' }],
      [{ text: 'Custom Range', callback_data: 'rate_range_custom' }],
      [{ text: '🔙 Back', callback_data: 'advanced_filters' }]
    ]
  };
}

// Assignment details menu
export function getAssignmentDetailsMenu(assignmentId, hasApplied = false, applicationStatus = null) {
  const keyboard = [];
  
  if (!hasApplied) {
    keyboard.push([{ text: '✅ Apply Now', callback_data: `apply_${assignmentId}` }]);
  } else {
    keyboard.push([{ text: `📋 Application Status: ${applicationStatus}`, callback_data: `view_application_${assignmentId}` }]);
    
    if (applicationStatus === 'Pending') {
      keyboard.push([{ text: '❌ Withdraw Application', callback_data: `withdraw_${assignmentId}` }]);
    }
  }
  
  keyboard.push([{ text: '📤 Share Assignment', callback_data: `share_${assignmentId}` }]);
  keyboard.push([{ text: '⭐ Save Assignment', callback_data: `save_${assignmentId}` }]);
  keyboard.push([{ text: '🔙 Back to Assignments', callback_data: 'view_assignments' }]);
  
  return {
    inline_keyboard: keyboard
  };
}

// Withdrawal confirmation menu
export function getWithdrawConfirmationMenu(assignmentId) {
  return {
    inline_keyboard: [
      [{ text: '✅ Yes, Withdraw', callback_data: `confirm_withdraw_${assignmentId}` }],
      [{ text: '❌ Cancel', callback_data: `view_application_${assignmentId}` }],
      [{ text: '🔙 Back to Applications', callback_data: 'view_applications' }]
    ]
  };
}

// Personal info editing menu (subset of profile edit)
export function getPersonalInfoMenu(tutor) {
  return {
    inline_keyboard: [
      [
        { text: 'Full Name', callback_data: 'edit_fullName' },
        { text: 'Email', callback_data: 'edit_email' }
      ],
      [
        { text: 'Contact Number', callback_data: 'edit_contactNumber' },
        { text: 'Age', callback_data: 'edit_age' }
      ],
      [
        { text: 'Gender', callback_data: 'set_gender_menu' },
        { text: 'Race', callback_data: 'set_race_menu' }
      ],
      [{ text: '💾 Save & Back', callback_data: 'profile_edit' }]
    ]
  };
}

// Quick actions menu for main screen
export function getQuickActionsMenu() {
  return {
    inline_keyboard: [
      [
        { text: '⚡ Quick Apply', callback_data: 'quick_apply' },
        { text: '🔔 Notifications', callback_data: 'view_notifications' }
      ],
      [
        { text: '💾 Saved Assignments', callback_data: 'saved_assignments' },
        { text: '⭐ Favorites', callback_data: 'favorite_assignments' }
      ],
      [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

// Settings menu
export function getSettingsMenu() {
  return {
    inline_keyboard: [
      [{ text: '🔔 Notification Settings', callback_data: 'settings_notifications' }],
      [{ text: '🌐 Language Settings', callback_data: 'settings_language' }],
      [{ text: '🔒 Privacy Settings', callback_data: 'settings_privacy' }],
      [{ text: '📱 Account Settings', callback_data: 'settings_account' }],
      [{ text: '❓ Help & Support', callback_data: 'help_support' }],
      [{ text: '🔙 Back to Main Menu', callback_data: 'main_menu' }]
    ]
  };
}

// Help menu
export function getHelpMenu() {
  return {
    inline_keyboard: [
      [{ text: '❓ FAQ', callback_data: 'help_faq' }],
      [{ text: '📞 Contact Support', callback_data: 'help_contact' }],
      [{ text: '📖 User Guide', callback_data: 'help_guide' }],
      [{ text: '🐛 Report Bug', callback_data: 'help_bug_report' }],
      [{ text: '💡 Feature Request', callback_data: 'help_feature_request' }],
      [{ text: '🔙 Back', callback_data: 'settings' }]
    ]
  };
}