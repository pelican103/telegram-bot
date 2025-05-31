// utils/format.js

export function formatTutorProfile(tutor) {
    return `*Tutor Profile*\n\n` +
      `*Name:* ${tutor.fullName || 'Not provided'}\n` +
      `*Contact:* ${tutor.contactNumber || 'Not provided'}\n` +
      `*Email:* ${tutor.email || 'Not provided'}\n` +
      `*Gender:* ${tutor.gender || 'Not specified'}\n` +
      `*Race:* ${tutor.race || 'Not specified'}\n` +
      `*Education:* ${tutor.education || 'Not specified'}\n` +
      `*Teaching Levels:* ${Object.entries(tutor.teachingLevels || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}\n` +
      `*Subjects:* ${Array.isArray(tutor.subjects) ? tutor.subjects.join(', ') : tutor.subjects || 'None'}\n` +
      `*Availability:* ${Object.entries(tutor.availability || {}).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None'}\n` +
      `*Location:* ${tutor.location || 'Not specified'}\n` +
      `*Hourly Rate:* ${tutor.hourlyRate || 'Not specified'}`;
  }
  
  export function formatAssignment(assignment) {
    return `📚 *${assignment.title}*\n` +
      `Level: ${assignment.level}\n` +
      `Subject: ${assignment.subject}\n` +
      `Location: ${assignment.location}\n` +
      `Rate: ${assignment.rate}\n` +
      `Start Date: ${assignment.startDate}\n` +
      `Requirements: ${assignment.requirements || 'None'}`;
  }
  