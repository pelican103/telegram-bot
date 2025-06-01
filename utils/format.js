// utils/format.js - Enhanced formatting functions for tutor profiles and assignments

export function formatTutorProfile(tutor) {
  let profile = `*Tutor Profile*\n\n`;
  
  // Personal Information
  profile += `*Name:* ${tutor.fullName || 'Not provided'}\n`;
  profile += `*Contact:* ${tutor.contactNumber || 'Not provided'}\n`;
  profile += `*Email:* ${tutor.email || 'Not provided'}\n`;
  profile += `*Age:* ${tutor.age || 'Not provided'}\n`;
  profile += `*Gender:* ${tutor.gender || 'Not provided'}\n`;
  profile += `*Race:* ${tutor.race || 'Not provided'}\n`;
  profile += `*Nationality:* ${tutor.nationality || 'Not provided'}\n`;
  profile += `*Years of Experience:* ${tutor.yearsOfExperience || 'Not provided'} years\n`;
  profile += `*Highest Education:* ${tutor.highestEducation || tutor.education || 'Not provided'}\n`;
  profile += `*Current School:* ${tutor.currentSchool || 'Not provided'}\n\n`;
  
  // Teaching Levels and Subjects
  if (tutor.teachingLevels) {
    profile += `*Teaching Levels:*\n`;
    const levels = [];
    
    // Handle complex teaching levels structure (from first paste)
    if (typeof tutor.teachingLevels === 'object' && tutor.teachingLevels.primary) {
      // Primary subjects
      if (tutor.teachingLevels.primary) {
        const subjects = [];
        Object.keys(tutor.teachingLevels.primary).forEach(subject => {
          if (tutor.teachingLevels.primary[subject]) {
            subjects.push(subject.charAt(0).toUpperCase() + subject.slice(1));
          }
        });
        if (subjects.length > 0) levels.push(`Primary: ${subjects.join(', ')}`);
      }
      
      // Secondary subjects
      if (tutor.teachingLevels.secondary) {
        const subjects = [];
        Object.keys(tutor.teachingLevels.secondary).forEach(subject => {
          if (tutor.teachingLevels.secondary[subject]) {
            const formatted = subject === 'aMath' ? 'A Math' : 
                            subject === 'eMath' ? 'E Math' :
                            subject.charAt(0).toUpperCase() + subject.slice(1);
            subjects.push(formatted);
          }
        });
        if (subjects.length > 0) levels.push(`Secondary: ${subjects.join(', ')}`);
      }
      
      // JC subjects
      if (tutor.teachingLevels.jc) {
        const subjects = [];
        Object.keys(tutor.teachingLevels.jc).forEach(subject => {
          if (tutor.teachingLevels.jc[subject]) {
            const formatted = subject.replace(/([A-Z])/g, ' $1').trim();
            subjects.push(formatted);
          }
        });
        if (subjects.length > 0) levels.push(`JC: ${subjects.join(', ')}`);
      }
      
      // International programs
      if (tutor.teachingLevels.international) {
        const programs = [];
        Object.keys(tutor.teachingLevels.international).forEach(program => {
          if (tutor.teachingLevels.international[program]) {
            programs.push(program.toUpperCase());
          }
        });
        if (programs.length > 0) levels.push(`International: ${programs.join(', ')}`);
      }
    } else {
      // Handle simple teaching levels structure (from second paste)
      const simpleLevels = Object.entries(tutor.teachingLevels || {})
        .filter(([_, v]) => v)
        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
      if (simpleLevels.length > 0) levels.push(...simpleLevels);
    }
    
    profile += levels.length > 0 ? levels.join('\n') : 'None specified';
    profile += '\n\n';
  }
  
  // Subjects (if separate from teaching levels)
  if (tutor.subjects && tutor.subjects !== tutor.teachingLevels) {
    const subjectsText = Array.isArray(tutor.subjects) ? 
      tutor.subjects.join(', ') : 
      tutor.subjects;
    profile += `*Subjects:* ${subjectsText || 'None'}\n\n`;
  }
  
  // Availability
  if (tutor.availability || tutor.availableTimeSlots) {
    profile += `*Availability:*\n`;
    
    // Handle complex availability structure
    if (tutor.availableTimeSlots) {
      const slots = [];
      if (tutor.availableTimeSlots.weekdayMorning) slots.push('Weekday Morning');
      if (tutor.availableTimeSlots.weekdayAfternoon) slots.push('Weekday Afternoon');
      if (tutor.availableTimeSlots.weekdayEvening) slots.push('Weekday Evening');
      if (tutor.availableTimeSlots.weekendMorning) slots.push('Weekend Morning');
      if (tutor.availableTimeSlots.weekendAfternoon) slots.push('Weekend Afternoon');
      if (tutor.availableTimeSlots.weekendEvening) slots.push('Weekend Evening');
      profile += slots.length > 0 ? slots.join(', ') : 'None specified';
    } else if (tutor.availability) {
      // Handle simple availability structure
      const availTimes = Object.entries(tutor.availability || {})
        .filter(([_, v]) => v)
        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
      profile += availTimes.length > 0 ? availTimes.join(', ') : 'None specified';
    }
    profile += '\n\n';
  }
  
  // Location/Preferred Areas
  if (tutor.locations) {
    profile += `*Preferred Areas:*\n`;
    const areas = Object.entries(tutor.locations || {})
      .filter(([_, v]) => v)
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
    profile += areas.length > 0 ? areas.join(', ') : 'None specified';
    profile += '\n\n';
  } else if (tutor.location) {
    profile += `*Location:* ${tutor.location}\n\n`;
  }
  
  // Hourly Rates
  if (tutor.hourlyRate) {
    profile += `*Hourly Rates:*\n`;
    if (typeof tutor.hourlyRate === 'object') {
      if (tutor.hourlyRate.primary) profile += `Primary: $${tutor.hourlyRate.primary}\n`;
      if (tutor.hourlyRate.secondary) profile += `Secondary: $${tutor.hourlyRate.secondary}\n`;
      if (tutor.hourlyRate.jc) profile += `JC: $${tutor.hourlyRate.jc}\n`;
      if (tutor.hourlyRate.international) profile += `International: $${tutor.hourlyRate.international}\n`;
    } else {
      profile += `$${tutor.hourlyRate}\n`;
    }
    profile += '\n';
  }
  
  // Additional Profile Information
  if (tutor.introduction || tutor.teachingExperience || tutor.qualifications) {
    profile += `*Additional Information:*\n`;
    if (tutor.introduction) profile += `${tutor.introduction}\n\n`;
    if (tutor.teachingExperience) profile += `*Teaching Experience:* ${tutor.teachingExperience}\n`;
    if (tutor.qualifications) profile += `*Qualifications:* ${tutor.qualifications}\n`;
  }
  
  return profile.trim();
}

export function formatAssignment(assignment) {
  const {
    title,
    level,
    subject,
    location,
    frequency,
    duration,
    rate,
    rateType,
    studentGender,
    studentCount,
    tutorRequirements,
    preferredTiming,
    additionalDetails,
    notes,
    status,
    startDate,
    deadline
  } = assignment;

  let text = `📝 *${title}*\n\n`;
  
  // Basic Information
  text += `*Education Level:* ${level}\n`;
  text += `*Subject:* ${subject}\n`;
  text += `*Location:* ${location}\n\n`;
  
  // Schedule
  text += `*Schedule:*\n`;
  text += `• Frequency: ${frequency}\n`;
  text += `• Duration: ${duration} hours\n`;
  text += `• Preferred Timing:\n`;
  
  // Format preferred timing
  if (preferredTiming) {
    const { weekday, weekend } = preferredTiming;
    if (weekday) {
      text += '  Weekdays:\n';
      if (weekday.morning) text += '    - Morning (8AM-12PM)\n';
      if (weekday.afternoon) text += '    - Afternoon (12PM-6PM)\n';
      if (weekday.evening) text += '    - Evening (6PM-10PM)\n';
    }
    if (weekend) {
      text += '  Weekends:\n';
      if (weekend.morning) text += '    - Morning (8AM-12PM)\n';
      if (weekend.afternoon) text += '    - Afternoon (12PM-6PM)\n';
      if (weekend.evening) text += '    - Evening (6PM-10PM)\n';
    }
  }
  
  // Student Information
  text += `\n*Student Information:*\n`;
  text += `• Gender: ${studentGender}\n`;
  text += `• Number of Students: ${studentCount}\n\n`;
  
  // Rate Information
  text += `*Rate:* $${rate}/${rateType}\n\n`;
  
  // Tutor Requirements
  if (tutorRequirements) {
    text += `*Tutor Requirements:*\n`;
    if (tutorRequirements.gender) text += `• Gender: ${tutorRequirements.gender}\n`;
    if (tutorRequirements.race) text += `• Race: ${tutorRequirements.race}\n`;
    if (tutorRequirements.experience) text += `• Experience: ${tutorRequirements.experience}\n`;
    if (tutorRequirements.qualifications) text += `• Qualifications: ${tutorRequirements.qualifications}\n`;
    text += '\n';
  }
  
  // Additional Information
  if (additionalDetails) {
    text += `*Additional Details:*\n${additionalDetails}\n\n`;
  }
  
  if (notes) {
    text += `*Notes:*\n${notes}\n\n`;
  }
  
  // Status and Dates
  text += `*Status:* ${status}\n`;
  if (startDate) {
    text += `*Start Date:* ${new Date(startDate).toLocaleDateString()}\n`;
  }
  if (deadline) {
    text += `*Application Deadline:* ${new Date(deadline).toLocaleDateString()}\n`;
  }
  
  return text;
}

export function formatAssignmentsList(assignments) {
  if (!assignments || assignments.length === 0) {
    return 'No assignments found matching your criteria.';
  }

  let text = `Found ${assignments.length} assignment(s):\n\n`;
  
  assignments.forEach((assignment, index) => {
    text += `${index + 1}. *${assignment.title}*\n`;
    text += `   ${assignment.level} - ${assignment.subject}\n`;
    text += `   Location: ${assignment.location}\n`;
    text += `   Rate: $${assignment.rate}/${assignment.rateType}\n`;
    text += `   Status: ${assignment.status}\n\n`;
  });
  
  return text;
}

export function formatApplicationStatus(application, assignment) {
  let msg = `*Application Status*\n\n`;
  
  msg += `*Assignment:* #${assignment.assignmentNumber || assignment._id.toString().slice(-6)}\n`;
  msg += `*Subject:* ${assignment.subject}\n`;
  msg += `*Status:* ${application.status}\n`;
  msg += `*Applied On:* ${new Date(application.appliedAt).toLocaleDateString()}\n`;
  
  if (application.status === 'Accepted') {
    msg += `*Accepted On:* ${new Date(application.acceptedAt).toLocaleDateString()}\n`;
    if (application.contactDetails) {
      msg += `*Contact Details:* ${application.contactDetails}\n`;
    }
  } else if (application.status === 'Rejected') {
    msg += `*Rejected On:* ${new Date(application.rejectedAt).toLocaleDateString()}\n`;
    if (application.rejectionReason) {
      msg += `*Reason:* ${application.rejectionReason}\n`;
    }
  }
  
  if (application.notes) {
    msg += `*Notes:* ${application.notes}\n`;
  }
  
  return msg;
}

export function formatTutorSummary(tutor) {
  let summary = `*${tutor.fullName || 'Unknown'}*\n`;
  
  if (tutor.gender || tutor.race) {
    const details = [];
    if (tutor.gender) details.push(tutor.gender);
    if (tutor.race) details.push(tutor.race);
    summary += `${details.join(', ')}\n`;
  }
  
  if (tutor.education || tutor.highestEducation) {
    summary += `Education: ${tutor.education || tutor.highestEducation}\n`;
  }
  
  if (tutor.yearsOfExperience) {
    summary += `Experience: ${tutor.yearsOfExperience} years\n`;
  }
  
  // Teaching levels
  if (tutor.teachingLevels) {
    const levels = Object.entries(tutor.teachingLevels || {})
      .filter(([_, v]) => v)
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
    if (levels.length > 0) {
      summary += `Levels: ${levels.join(', ')}\n`;
    }
  }
  
  if (tutor.contactNumber) {
    summary += `Contact: ${tutor.contactNumber}\n`;
  }
  
  return summary;
}

export function formatNotification(type, data) {
  switch (type) {
    case 'new_assignment':
      return `🔔 *New Assignment Available*\n\n${formatAssignment(data.assignment)}`;
    
    case 'application_update':
      return `📝 *Application Update*\n\nYour application for Assignment #${data.assignment.assignmentNumber || data.assignment._id.toString().slice(-6)} has been ${data.status.toLowerCase()}.`;
    
    case 'assignment_filled':
      return `✅ *Assignment Filled*\n\nAssignment #${data.assignment.assignmentNumber || data.assignment._id.toString().slice(-6)} has been filled. Thank you for your interest!`;
    
    case 'profile_incomplete':
      return `⚠️ *Profile Incomplete*\n\nPlease complete your profile to apply for assignments. Missing: ${data.missingFields.join(', ')}`;
    
    default:
      return `📢 *Notification*\n\n${data.message || 'You have a new notification.'}`;
  }
}

export function formatSearchResults(tutors, searchCriteria) {
  if (!tutors || tutors.length === 0) {
    return 'No tutors found matching your criteria.';
  }
  
  let msg = `*Search Results* (${tutors.length} found)\n`;
  if (searchCriteria) {
    msg += `*Criteria:* ${Object.entries(searchCriteria).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
  }
  msg += '\n';
  
  tutors.forEach((tutor, index) => {
    msg += `*${index + 1}.* ${formatTutorSummary(tutor)}\n`;
  });
  
  return msg;
}