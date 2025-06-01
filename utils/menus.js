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
      [{ text: `${getTick(levels.ib)} International Baccalaureate (IB)`, callback_data: 'toggle_ib' }],
      [{ text: `${getTick(levels.igcse)} IGCSE`, callback_data: 'toggle_igcse' }],
      [{ text: `${getTick(levels.diploma)} Polytechnic Diploma`, callback_data: 'toggle_diploma' }],
      [{ text: `${getTick(levels.university)} University`, callback_data: 'toggle_university' }],
      [{ text: `${getTick(levels.others)} Others`, callback_data: 'toggle_others' }],
      [{ text: '💾 Save & Back', callback_data: 'profile_edit' }]
    ]
  };
}

// Enhanced availability menu with more granular options
export function getAvailabilityMenu(tutor) {
  const avail = tutor.availability || {};
  
  const text = `*Current Availability:*\n\n` +
    `*Days:*\n` +
    `${getTick(avail.weekdays)} Weekdays (Mon-Fri)\n` +
    `${getTick(avail.weekends)} Weekends (Sat-Sun)\n\n` +
    `*Time Slots:*\n` +
    `${getTick(avail.mornings)} Mornings (8AM-12PM)\n` +
    `${getTick(avail.afternoons)} Afternoons (12PM-6PM)\n` +
    `${getTick(avail.evenings)} Evenings (6PM-10PM)\n\n` +
    `Select to toggle your availability:`;

  return {
    text,
    options: {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: `${getTick(avail.weekdays)} Weekdays`, callback_data: 'toggle_weekdays' },
            { text: `${getTick(avail.weekends)} Weekends`, callback_data: 'toggle_weekends' }
          ],
          [
            { text: `${getTick(avail.mornings)} Mornings`, callback_data: 'toggle_mornings' },
            { text: `${getTick(avail.afternoons)} Afternoons`, callback_data: 'toggle_afternoons' }
          ],
          [{ text: `${getTick(avail.evenings)} Evenings`, callback_data: 'toggle_evenings' }],
          [{ text: '💾 Save & Back', callback_data: 'profile_edit' }]
        ]
      }
    }
  };
}

// Location preferences menu
export function getLocationsMenu(tutor) {
  const locations = tutor.locations || {};
  
  // Singapore regions
  const regions = [
    'north', 'south', 'east', 'west', 'central',
    'northeast', 'northwest', 'southeast', 'southwest'
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

// Assignment-related menus
export function getAssignmentFilterMenu() {
  return {
    inline_keyboard: [
      [
        { text: 'By Subject', callback_data: 'filter_subject' },
        { text: 'By Level', callback_data: 'filter_level' }
      ],
      [
        { text: 'By Location', callback_data: 'filter_location' },
        { text: 'By Rate', callback_data: 'filter_rate' }
      ],
      [{ text: 'Clear Filters', callback_data: 'clear_filters' }],
      [{ text: '🔙 Back to Assignments', callback_data: 'view_assignments' }]
    ]
  };
}

export function getSubjectFilterMenu() {
  const subjects = [
    'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Economics', 'Accounting', 'Literature',
    'Chinese', 'Malay', 'Tamil', 'Hindi', 'French', 'German'
  ];
  
  const keyboard = [];
  
  // Create rows of 2 subjects each
  for (let i = 0; i < subjects.length; i += 2) {
    const row = [];
    row.push({ text: subjects[i], callback_data: `subject_${subjects[i].toLowerCase()}` });
    
    if (i + 1 < subjects.length) {
      row.push({ text: subjects[i + 1], callback_data: `subject_${subjects[i + 1].toLowerCase()}` });
    }
    keyboard.push(row);
  }
  
  keyboard.push([{ text: '🔙 Back', callback_data: 'filter_assignments' }]);
  
  return {
    inline_keyboard: keyboard
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
      [
        { text: 'Polytechnic', callback_data: 'level_polytechnic' },
        { text: 'University', callback_data: 'level_university' }
      ],
      [{ text: '🔙 Back', callback_data: 'filter_assignments' }]
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

// Schedule filter menu
export function getScheduleFilterMenu() {
  return {
    inline_keyboard: [
      [
        { text: '🌅 Morning (8AM-12PM)', callback_data: 'schedule_morning' },
        { text: '☀️ Afternoon (12PM-6PM)', callback_data: 'schedule_afternoon' }
      ],
      [
        { text: '🌆 Evening (6PM-10PM)', callback_data: 'schedule_evening' },
        { text: '🌃 Night (10PM-12AM)', callback_data: 'schedule_night' }
      ],
      [
        { text: '📅 Weekdays Only', callback_data: 'schedule_weekdays' },
        { text: '🏖️ Weekends Only', callback_data: 'schedule_weekends' }
      ],
      [{ text: '🔙 Back', callback_data: 'advanced_filters' }]
    ]
  };
}

// Student count filter menu
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