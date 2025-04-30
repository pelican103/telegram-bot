const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const express = require('express');
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',') : [];
const adminPostingSessions = {};

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Tutor Schema
const tutorSchema = new mongoose.Schema({
  // Personal Information
  fullName: String,
  contactNumber: String,
  email: String,
  dob: {
    day: String,
    month: String,
    year: String
  },
  gender: String,
  age: String,
  nationality: String,
  nationalityOther: String,
  race: String,
  nricLast4: String,
  
  // Tutoring Preferences
  teachingLevels: {
    primary: {
      english: Boolean,
      math: Boolean,
      science: Boolean,
      chinese: Boolean,
      malay: Boolean,
      tamil: Boolean
    },
    secondary: {
      english: Boolean,
      math: Boolean,
      aMath: Boolean,
      eMath: Boolean,
      physics: Boolean,
      chemistry: Boolean,
      biology: Boolean,
      science: Boolean,
      history: Boolean,
      geography: Boolean,
      literature: Boolean,
      chinese: Boolean,
      malay: Boolean,
      tamil: Boolean
    },
    jc: {
      generalPaper: Boolean,
      h1Math: Boolean,
      h2Math: Boolean,
      h1Physics: Boolean,
      h2Physics: Boolean,
      h1Chemistry: Boolean,
      h2Chemistry: Boolean,
      h1Biology: Boolean,
      h2Biology: Boolean,
      h1Economics: Boolean,
      h2Economics: Boolean,
      h1History: Boolean,
      h2History: Boolean
    },
    international: {
      ib: Boolean,
      igcse: Boolean,
      ielts: Boolean,
      toefl: Boolean
    }
  },
  
  // Locations
  locations: {
    north: Boolean,
    south: Boolean,
    east: Boolean,
    west: Boolean,
    central: Boolean,
    northeast: Boolean,
    northwest: Boolean
  },
  
  // Qualifications & Experience
  tutorType: String,
  yearsOfExperience: String,
  highestEducation: String,
  currentSchool: String,
  previousSchools: String,
  
  // Fee Structure
  hourlyRate: {
    primary: String,
    secondary: String,
    jc: String,
    international: String
  },
  
  // Tutor Profile
  introduction: String,
  teachingExperience: String,
  trackRecord: String,
  sellingPoints: String,
  
  // Availability
  availableTimeSlots: {
    weekdayMorning: Boolean,
    weekdayAfternoon: Boolean,
    weekdayEvening: Boolean,
    weekendMorning: Boolean,
    weekendAfternoon: Boolean,
    weekendEvening: Boolean
  },
  
  // Form metadata
  formType: String
}, { timestamps: true });

const Tutor = mongoose.model('Tutor', tutorSchema);

// Define Assignment Schema
const assignmentSchema = new mongoose.Schema({
  title: String,
  description: String,
  level: String,
  subject: String,
  location: String,
  rate: String,
  frequency: String,
  startDate: String,
  requirements: String,
  status: {
    type: String,
    default: 'Open'
  },
  applicants: [{
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor'
    },
    status: {
      type: String,
      default: 'Pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  channelMessageId: { type: Number }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

// Create Express application
const app = express();
app.use(express.json());

// Initialize bot without polling
const bot = new TelegramBot(process.env.BOT_TOKEN);

// Set webhook URL (this will run when the server starts)
const url = process.env.RENDER_EXTERNAL_URL || 'https://your-service-name.onrender.com';
bot.setWebHook(`${url}/bot${process.env.BOT_TOKEN}`);

// Handle webhook endpoint
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Add a simple health check endpoint
app.get('/', (req, res) => {
  res.send('Bot service is running!');
});

// Store user sessions
const userSessions = {};

// Pagination settings
const ITEMS_PER_PAGE = 5;

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Please share your phone number using the button below.', {
    reply_markup: {
      keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
      one_time_keyboard: true,
    },
  });
});

// Listen for contact share
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const contactNumber = msg.contact.phone_number;
  
  console.log(`Received phone number from Telegram: ${contactNumber}`);
  console.log(`Current user session before processing: ${JSON.stringify(userSessions[chatId])}`);


  try {
    // Normalize the received phone number (remove all non-digits)
    const normalizedInput = contactNumber.replace(/\D/g, '');
    
    // Create variations to check against
    const singaporeCode = '65';
    const variations = [];
    
    // Full number with country code (if exists)
    variations.push(normalizedInput);
    
    // Without country code (if country code exists)
    if (normalizedInput.startsWith(singaporeCode) && normalizedInput.length > 8) {
      variations.push(normalizedInput.substring(singaporeCode.length));
    } 
    // With country code (if country code doesn't exist)
    else if (normalizedInput.length === 8) {
      variations.push(singaporeCode + normalizedInput);
    }

    console.log('Trying phone number variations:', variations);
    
    // Find tutor with any of these variations, ignoring non-digit characters in the database
    const tutor = await Tutor.findOne({
      $or: variations.map(variant => ({
        // This regex removes all non-digit characters from the stored number before comparison
        contactNumber: { $regex: new RegExp('^' + variant + '$', 'i') }
      })).concat(variations.map(variant => ({
        // Also try matching where the database number contains our cleaned number
        contactNumber: { $regex: new RegExp(variant, 'i') }
      })))
    });

    if (tutor) {
      // Store tutor info in session, preserving pendingAssignmentId if it exists
      const pendingAssignmentId = userSessions[chatId]?.pendingAssignmentId;
      
      userSessions[chatId] = {
        tutorId: tutor._id,
        state: 'profile_verification'
      };
      
      // Restore pendingAssignmentId if it was present
      if (pendingAssignmentId) {
        userSessions[chatId].pendingAssignmentId = pendingAssignmentId;
      }
      
      console.log(`Session after tutor found: ${JSON.stringify(userSessions[chatId])}`);
      // Format the tutor profile nicely
      const profileMessage = formatTutorProfile(tutor);
      
      // Send profile with verification buttons
      bot.sendMessage(chatId, profileMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yes, use this profile', callback_data: 'profile_confirm' }],
            [{ text: 'No, I would like to edit this profile', callback_data: 'profile_edit' }],
            [{ text: 'Back', callback_data: 'start' }]
          ]
        }
      });
    } else {
      console.log(`No match found for ${contactNumber}`);
      bot.sendMessage(chatId, 'Sorry, we could not find your registration. Would you like to register as a tutor?', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Register Now', url: 'https://www.lioncitytutors.com/register-tutor' }],
            [{ text: 'Try Another Number', callback_data: 'start' }]
          ]
        }
      });
    }
  } catch (err) {
    console.error('Error finding tutor:', err);
    bot.sendMessage(chatId, 'There was an error processing your request. Please try again later.');
  }
});

// Format tutor profile for display
function formatTutorProfile(tutor) {
  let profile = `*Tutor Profile*\n\n`;
  profile += `*Name:* ${tutor.fullName || 'Not provided'}\n`;
  profile += `*Contact:* ${tutor.contactNumber || 'Not provided'}\n`;
  profile += `*Email:* ${tutor.email || 'Not provided'}\n`;
  profile += `*Age:* ${tutor.age || 'Not provided'}\n`;
  profile += `*Gender:* ${tutor.gender || 'Not provided'}\n`;
  profile += `*Experience:* ${tutor.yearsOfExperience || 'Not provided'} years\n`;
  profile += `*Highest Education:* ${tutor.highestEducation || 'Not provided'}\n`;
  profile += `*Current School:* ${tutor.currentSchool || 'Not provided'}\n\n`;
  
  // Add teaching levels if available in your schema
  if (tutor.teachingLevels) {
    profile += `*Teaching Levels:*\n`;
    const levels = [];
    
    // Check Primary
    if (tutor.teachingLevels.primary) {
      const subjects = [];
      if (tutor.teachingLevels.primary.english) subjects.push('English');
      if (tutor.teachingLevels.primary.math) subjects.push('Math');
      if (tutor.teachingLevels.primary.science) subjects.push('Science');
      if (tutor.teachingLevels.primary.chinese) subjects.push('Chinese');
      if (tutor.teachingLevels.primary.malay) subjects.push('Malay');
      if (tutor.teachingLevels.primary.tamil) subjects.push('Tamil');
      
      if (subjects.length > 0) {
        levels.push(`Primary: ${subjects.join(', ')}`);
      }
    }
    
    // Check Secondary
    if (tutor.teachingLevels.secondary) {
      const subjects = [];
      if (tutor.teachingLevels.secondary.english) subjects.push('English');
      if (tutor.teachingLevels.secondary.math) subjects.push('Math');
      if (tutor.teachingLevels.secondary.aMath) subjects.push('A Math');
      if (tutor.teachingLevels.secondary.eMath) subjects.push('E Math');
      if (tutor.teachingLevels.secondary.physics) subjects.push('Physics');
      if (tutor.teachingLevels.secondary.chemistry) subjects.push('Chemistry');
      if (tutor.teachingLevels.secondary.biology) subjects.push('Biology');
      if (tutor.teachingLevels.secondary.science) subjects.push('Science');
      if (tutor.teachingLevels.secondary.history) subjects.push('History');
      if (tutor.teachingLevels.secondary.geography) subjects.push('Geography');
      if (tutor.teachingLevels.secondary.literature) subjects.push('Literature');
      if (tutor.teachingLevels.secondary.chinese) subjects.push('Chinese');
      if (tutor.teachingLevels.secondary.malay) subjects.push('Malay');
      if (tutor.teachingLevels.secondary.tamil) subjects.push('Tamil');
      
      if (subjects.length > 0) {
        levels.push(`Secondary: ${subjects.join(', ')}`);
      }
    }
    
    // Check JC
    if (tutor.teachingLevels.jc) {
      const subjects = [];
      if (tutor.teachingLevels.jc.generalPaper) subjects.push('General Paper');
      if (tutor.teachingLevels.jc.h1Math) subjects.push('H1 Math');
      if (tutor.teachingLevels.jc.h2Math) subjects.push('H2 Math');
      if (tutor.teachingLevels.jc.h1Physics) subjects.push('H1 Physics');
      if (tutor.teachingLevels.jc.h2Physics) subjects.push('H2 Physics');
      if (tutor.teachingLevels.jc.h1Chemistry) subjects.push('H1 Chemistry');
      if (tutor.teachingLevels.jc.h2Chemistry) subjects.push('H2 Chemistry');
      if (tutor.teachingLevels.jc.h1Biology) subjects.push('H1 Biology');
      if (tutor.teachingLevels.jc.h2Biology) subjects.push('H2 Biology');
      if (tutor.teachingLevels.jc.h1Economics) subjects.push('H1 Economics');
      if (tutor.teachingLevels.jc.h2Economics) subjects.push('H2 Economics');
      if (tutor.teachingLevels.jc.h1History) subjects.push('H1 History');
      if (tutor.teachingLevels.jc.h2History) subjects.push('H2 History');
      
      if (subjects.length > 0) {
        levels.push(`JC: ${subjects.join(', ')}`);
      }
    }
    
    // Check International
    if (tutor.teachingLevels.international) {
      const programs = [];
      if (tutor.teachingLevels.international.ib) programs.push('IB');
      if (tutor.teachingLevels.international.igcse) programs.push('IGCSE');
      if (tutor.teachingLevels.international.ielts) programs.push('IELTS');
      if (tutor.teachingLevels.international.toefl) programs.push('TOEFL');
      
      if (programs.length > 0) {
        levels.push(`International: ${programs.join(', ')}`);
      }
    }
    
    if (levels.length > 0) {
      profile += levels.join('\n');
    } else {
      profile += 'None specified';
    }
    
    profile += '\n\n';
  }
  
  // Add hourly rates if available
  if (tutor.hourlyRate) {
    profile += `*Hourly Rates:*\n`;
    if (tutor.hourlyRate.primary) profile += `Primary: $${tutor.hourlyRate.primary}\n`;
    if (tutor.hourlyRate.secondary) profile += `Secondary: $${tutor.hourlyRate.secondary}\n`;
    if (tutor.hourlyRate.jc) profile += `JC: $${tutor.hourlyRate.jc}\n`;
    if (tutor.hourlyRate.international) profile += `International: $${tutor.hourlyRate.international}\n`;
    profile += '\n';
  }
  if (
    tutor.introduction ||
    tutor.teachingExperience ||
    tutor.trackRecord ||
    tutor.sellingPoints
  ) {
    profile += `*Tutor Profile:*\n`;
    if (tutor.introduction) profile += `*Introduction:* ${tutor.introduction}\n`;
    if (tutor.teachingExperience) profile += `*Teaching Experience:* ${tutor.teachingExperience}\n`;
    if (tutor.trackRecord) profile += `*Track Record:* ${tutor.trackRecord}\n`;
    if (tutor.sellingPoints) profile += `*Selling Points:* ${tutor.sellingPoints}\n`;
    profile += '\n';
  }
  
  profile += `Please verify if this information is correct.`;
  
  return profile;
}

// Format assignment for display
function formatAssignment(assignment) {
  let msg = `*Assignment: ${assignment.title}*\n\n`;
  msg += `*Level:* ${assignment.level}\n`;
  msg += `*Subject:* ${assignment.subject}\n`;
  msg += `*Location:* ${assignment.location}\n`;
  msg += `*Rate:* ${assignment.rate}\n`;
  msg += `*Frequency:* ${assignment.frequency}\n`;
  msg += `*Start Date:* ${assignment.startDate}\n\n`;
  msg += `*Description:* ${assignment.description}\n\n`;
  
  if (assignment.requirements) {
    msg += `*Requirements:* ${assignment.requirements}\n\n`;
  }
  
  msg += `*Status:* ${assignment.status}`;
  
  return msg;
}

// Show main menu
function showMainMenu(chatId) {
  bot.sendMessage(chatId, 'Main Menu - What would you like to do?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'View Available Assignments', callback_data: 'view_assignments' }],
        [{ text: 'View My Applications', callback_data: 'view_applications' }],
        [{ text: 'Update My Profile', callback_data: 'profile_edit' }]
      ]
    }
  });
}

// Handle pagination for assignments
async function showAssignments(chatId, page = 1, filter = 'open') {
  try {
    // Default filter is 'open' assignments
    const query = filter === 'open' ? { status: 'Open' } : {};
    
    // Count total assignments for pagination
    const totalAssignments = await Assignment.countDocuments(query);
    const totalPages = Math.ceil(totalAssignments / ITEMS_PER_PAGE) || 1;
    
    // Validate current page
    page = Math.max(1, Math.min(page, totalPages));
    
    // Get assignments for current page
    const assignments = await Assignment.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    
    if (assignments.length === 0) {
      return bot.sendMessage(chatId, 'No assignments available at the moment.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      });
    }
    
    // Send message for each assignment
    bot.sendMessage(chatId, `Showing assignments ${(page - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(page * ITEMS_PER_PAGE, totalAssignments)} of ${totalAssignments}`);
    
    for (const assignment of assignments) {
      const msg = formatAssignment(assignment);
      
      // Check if user has already applied
      const hasApplied = userSessions[chatId] && 
        assignment.applicants.some(applicant => 
          applicant.tutorId.toString() === userSessions[chatId].tutorId.toString());
      
      const keyboard = [
        ...(assignment.status === 'Open' && !hasApplied ? [[{ text: 'Apply', callback_data: `apply_${assignment._id}` }]] : []),
        ...(hasApplied ? [[{ text: 'Already Applied', callback_data: `view_application_${assignment._id}` }]] : [])
      ];
      
      await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    }
    
    // Add pagination controls
    const paginationKeyboard = [];
    
    // Previous page button if not on first page
    if (page > 1) {
      paginationKeyboard.push({ text: '◀️ Previous', callback_data: `assignments_page_${page - 1}` });
    }
    
    // Next page button if not on last page
    if (page < totalPages) {
      paginationKeyboard.push({ text: 'Next ▶️', callback_data: `assignments_page_${page + 1}` });
    }
    
    // Add navigation row
    await bot.sendMessage(chatId, `Page ${page} of ${totalPages}`, {
      reply_markup: {
        inline_keyboard: [
          paginationKeyboard,
          [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (err) {
    console.error('Error showing assignments:', err);
    bot.sendMessage(chatId, 'There was an error retrieving assignments. Please try again later.');
  }
}

// Handle pagination for tutor's applications
async function showApplications(chatId, page = 1) {
  try {
    if (!userSessions[chatId] || !userSessions[chatId].tutorId) {
      return bot.sendMessage(chatId, 'Your session has expired. Please start again.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Start Over', callback_data: 'start' }]
          ]
        }
      });
    }
    
    const tutorId = userSessions[chatId].tutorId;
    
    // Find assignments where the tutor has applied
    const assignments = await Assignment.find({ 
      'applicants.tutorId': tutorId 
    }).sort({ createdAt: -1 });
    
    if (assignments.length === 0) {
      return bot.sendMessage(chatId, 'You haven\'t applied to any assignments yet.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'View Available Assignments', callback_data: 'view_assignments' }],
            [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      });
    }
    
    // Calculate pagination
    const totalApplications = assignments.length;
    const totalPages = Math.ceil(totalApplications / ITEMS_PER_PAGE) || 1;
    
    // Validate current page
    page = Math.max(1, Math.min(page, totalPages));
    
    // Get slice for current page
    const pageAssignments = assignments.slice(
      (page - 1) * ITEMS_PER_PAGE,
      page * ITEMS_PER_PAGE
    );
    
    // Send message for each application
    bot.sendMessage(chatId, `Showing your applications ${(page - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(page * ITEMS_PER_PAGE, totalApplications)} of ${totalApplications}`);
    
    for (const assignment of pageAssignments) {
      // Find the tutor's application
      const application = assignment.applicants.find(
        app => app.tutorId.toString() === tutorId.toString()
      );
      
      // Format assignment details with application status
      let msg = formatAssignment(assignment);
      msg += `\n\n*Your Application Status:* ${application.status}`;
      msg += `\n*Applied on:* ${application.appliedAt.toLocaleDateString()}`;
      
      await bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'View Details', callback_data: `view_application_${assignment._id}` }],
            ...(application.status === 'Pending' ? [[{ text: 'Withdraw Application', callback_data: `withdraw_${assignment._id}` }]] : [])
          ]
        }
      });
    }
    
    // Add pagination controls
    const paginationKeyboard = [];
    
    // Previous page button if not on first page
    if (page > 1) {
      paginationKeyboard.push({ text: '◀️ Previous', callback_data: `applications_page_${page - 1}` });
    }
    
    // Next page button if not on last page
    if (page < totalPages) {
      paginationKeyboard.push({ text: 'Next ▶️', callback_data: `applications_page_${page + 1}` });
    }
    
    // Add navigation row
    await bot.sendMessage(chatId, `Page ${page} of ${totalPages}`, {
      reply_markup: {
        inline_keyboard: [
          paginationKeyboard,
          [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
        ]
      }
    });
  } catch (err) {
    console.error('Error showing applications:', err);
    bot.sendMessage(chatId, 'There was an error retrieving your applications. Please try again later.');
  }
}

// Admin command to view applications for a specific assignment
bot.onText(/\/view_applications (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const assignmentId = match[1];
  
  // Check if user is an admin
  if (!ADMIN_USERS.includes(userId)) {
    return bot.sendMessage(chatId, 'Sorry, only administrators can view applications.');
  }
  
  try {
    // Find the assignment
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment) {
      return bot.sendMessage(chatId, 'Assignment not found.');
    }
    
    // Check if there are any applications
    if (!assignment.applicants || assignment.applicants.length === 0) {
      return bot.sendMessage(chatId, `No applications for assignment: ${assignment.title}`);
    }
    
    // Send assignment details first
    await bot.sendMessage(chatId, `*Applications for Assignment:* ${assignment.title}\n\n`, {
      parse_mode: 'Markdown'
    });
    
    // Fetch and send each applicant's details
    for (const applicant of assignment.applicants) {
      try {
        const tutor = await Tutor.findById(applicant.tutorId);
        
        if (!tutor) {
          await bot.sendMessage(chatId, `- Unknown Tutor (ID: ${applicant.tutorId})\n  Status: ${applicant.status}\n  Applied: ${applicant.appliedAt.toLocaleDateString()}`);
          continue;
        }
        
        // Format tutor info
        let tutorInfo = `*Applicant:* ${tutor.fullName}\n`;
        tutorInfo += `*Status:* ${applicant.status}\n`;
        tutorInfo += `*Applied:* ${applicant.appliedAt.toLocaleDateString()}\n`;
        tutorInfo += `*Contact:* ${tutor.contactNumber}\n`;
        tutorInfo += `*Email:* ${tutor.email}\n`;
        tutorInfo += `*Experience:* ${tutor.yearsOfExperience || 'Not specified'} years\n`;
        tutorInfo += `*Education:* ${tutor.highestEducation || 'Not specified'}\n`;
        
        // Create action buttons for this applicant
        const keyboard = [
          [
            { text: 'Accept', callback_data: `admin_accept_${assignment._id}_${tutor._id}` },
            { text: 'Reject', callback_data: `admin_reject_${assignment._id}_${tutor._id}` }
          ],
          [{ text: 'View Full Profile', callback_data: `admin_view_tutor_${tutor._id}` }]
        ];
        
        await bot.sendMessage(chatId, tutorInfo, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: keyboard
          }
        });
      } catch (err) {
        console.error(`Error processing applicant ${applicant.tutorId}:`, err);
      }
    }
    
    // Add a command to list available assignments
    await bot.sendMessage(chatId, 'To view applications for another assignment, use /list_assignments');
    
  } catch (err) {
    console.error('Error retrieving applications:', err);
    bot.sendMessage(chatId, 'Error retrieving applications. Please try again later.');
  }
});

// Command to list all assignments for admin
bot.onText(/\/list_assignments/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Check if user is an admin
  if (!ADMIN_USERS.includes(userId)) {
    return bot.sendMessage(chatId, 'Sorry, only administrators can view assignments.');
  }
  
  try {
    // Get all assignments, sorted by creation date (newest first)
    const assignments = await Assignment.find({})
      .sort({ createdAt: -1 })
      .limit(20); // Limit to 20 most recent assignments
    
    if (assignments.length === 0) {
      return bot.sendMessage(chatId, 'No assignments found.');
    }
    
    let message = '*Available Assignments:*\n\n';
    
    for (const assignment of assignments) {
      // Count applicants
      const applicantCount = assignment.applicants ? assignment.applicants.length : 0;
      
      message += `*ID:* ${assignment._id}\n`;
      message += `*Title:* ${assignment.title}\n`;
      message += `*Status:* ${assignment.status}\n`;
      message += `*Applicants:* ${applicantCount}\n`;
      message += `*Created:* ${assignment.createdAt.toLocaleDateString()}\n\n`;
    }
    
    message += 'To view applications for a specific assignment, use:\n/view_applications [assignment_id]';
    
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });
    
  } catch (err) {
    console.error('Error listing assignments:', err);
    bot.sendMessage(chatId, 'Error retrieving assignments. Please try again later.');
  }
});

// Consolidated callback handler - replace both existing handlers with this one
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id.toString();
  
  // Acknowledge the button press
  bot.answerCallbackQuery(callbackQuery.id);
  
  try {
    // Check if this is an admin action
    if (data.startsWith('admin_') && !ADMIN_USERS.includes(userId)) {
      return bot.answerCallbackQuery(callbackQuery.id, 'Only administrators can perform this action.');
    }
    
    // Process admin actions
    if (data.startsWith('admin_accept_') || data.startsWith('admin_reject_')) {
      const parts = data.split('_');
      const action = parts[1]; // 'accept' or 'reject'
      const assignmentId = parts[2];
      const tutorId = parts[3];
      
      try {
        // Update application status
        const newStatus = action === 'accept' ? 'Accepted' : 'Rejected';
        
        // Find the assignment first
        const assignment = await Assignment.findById(assignmentId);
        
        if (!assignment) {
          return bot.answerCallbackQuery(callbackQuery.id, 'Assignment not found.');
        }
        
        // Update the specific applicant's status
        await Assignment.findOneAndUpdate(
          { 
            _id: assignmentId,
            'applicants.tutorId': tutorId
          },
          {
            $set: { 'applicants.$.status': newStatus }
          }
        );
        
        // If action is 'accept', also update the assignment status to 'Closed'
        if (action === 'accept') {
          await Assignment.findByIdAndUpdate(
            assignmentId,
            { status: 'Closed' }
          );
          
          // Get the updated assignment to have the latest data
          const updatedAssignment = await Assignment.findById(assignmentId);
          
          // Update the message in the channel to remove the Apply button
          await updateChannelAssignmentMessage(updatedAssignment);
          
          console.log(`Assignment ${assignmentId} status changed to Closed after accepting applicant ${tutorId}`);
        }
        
        // Get the updated assignment
        const updatedAssignment = await Assignment.findById(assignmentId);
        
        // Notify the accepted/rejected tutor
        const tutor = await Tutor.findById(tutorId);
        if (tutor && tutor.telegramChatId) {
          await bot.sendMessage(
            tutor.telegramChatId,
            `*Application Update*\n\nYour application for "${updatedAssignment.title}" has been ${newStatus.toLowerCase()}.`,
            { parse_mode: 'Markdown' }
          );
        }
        
        // Notify all other pending applicants if assignment was accepted and closed
        if (action === 'accept') {
          // Notify all other applicants that the position has been filled
          for (const applicant of updatedAssignment.applicants) {
            // Skip the accepted applicant as they already got a notification
            if (applicant.tutorId.toString() === tutorId) continue;
            
            // Only notify pending applicants
            if (applicant.status === 'Pending') {
              const pendingTutor = await Tutor.findById(applicant.tutorId);
              if (pendingTutor && pendingTutor.telegramChatId) {
                await bot.sendMessage(
                  pendingTutor.telegramChatId,
                  `*Assignment Update*\n\nThe assignment "${updatedAssignment.title}" has been filled and is no longer accepting applications.`,
                  { parse_mode: 'Markdown' }
                );
              }
            }
          }
        }
        
        // Confirm to admin
        bot.answerCallbackQuery(
          callbackQuery.id, 
          action === 'accept' ? 
            `Application accepted and assignment closed successfully!` : 
            `Application rejected successfully!`
        );
        
        // Update the message with new status
        const currentMessage = callbackQuery.message.text;
        const updatedMessage = currentMessage.replace(/\*Status:\* [^\n]+/, `*Status:* ${newStatus}`);
        
        await bot.editMessageText(updatedMessage, {
          chat_id: chatId,
          message_id: callbackQuery.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: 'View Full Profile', callback_data: `admin_view_tutor_${tutorId}` }]
            ]
          }
        });
        
        // If we accepted an applicant, also update the admin with assignment status change
        if (action === 'accept') {
          await bot.sendMessage(
            chatId,
            `The assignment "${updatedAssignment.title}" has been marked as *Closed*. No more applications will be accepted.`,
            { parse_mode: 'Markdown' }
          );
        }
        
      } catch (err) {
        console.error(`Error processing ${action} for application:`, err);
        bot.answerCallbackQuery(callbackQuery.id, 'Error processing action. Please try again.');
      }
    }
    else if (data.startsWith('admin_view_tutor_')) {
      const tutorId = data.split('_').pop();
      
      try {
        const tutor = await Tutor.findById(tutorId);
        
        if (!tutor) {
          return bot.answerCallbackQuery(callbackQuery.id, 'Tutor not found.');
        }
        
        // Format the tutor profile
        const profileMessage = formatTutorProfile(tutor);
        
        // Send the full profile
        await bot.sendMessage(chatId, profileMessage, {
          parse_mode: 'Markdown'
        });
        
        bot.answerCallbackQuery(callbackQuery.id);
        
      } catch (err) {
        console.error('Error viewing tutor profile:', err);
        bot.answerCallbackQuery(callbackQuery.id, 'Error retrieving tutor profile.');
      }
    }
    // Handle regular user actions
    else if (data === 'start') {
      // Return to start
      bot.sendMessage(chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
        reply_markup: {
          keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
          one_time_keyboard: true,
        },
      });
    } 
    else if (data === 'profile_confirm') {
      // User confirmed profile
      console.log("Processing profile_confirm action");
      console.log("User session data:", userSessions[chatId]);
      
      if (userSessions[chatId] && userSessions[chatId].tutorId) {
        // Check if there's a pending assignment to apply for
        if (userSessions[chatId].pendingAssignmentId) {
          console.log("Found pending assignment ID:", userSessions[chatId].pendingAssignmentId);
          const assignmentId = userSessions[chatId].pendingAssignmentId;
          const tutorId = userSessions[chatId].tutorId;
          
          try {
            // Find the assignment
            const assignment = await Assignment.findById(assignmentId);
            console.log("Found assignment:", assignment ? "yes" : "no");
            
            if (!assignment) {
              bot.sendMessage(chatId, 'Sorry, this assignment no longer exists.');
              userSessions[chatId].state = 'main_menu';
              showMainMenu(chatId);
              return;
            }
            
            // Check if assignment is still open
            if (assignment.status !== 'Open') {
              bot.sendMessage(chatId, 'Sorry, this assignment is no longer open for applications.');
              userSessions[chatId].state = 'main_menu';
              showMainMenu(chatId);
              return;
            }
            
            // Check if already applied
            const alreadyApplied = assignment.applicants.some(app => 
              app.tutorId.toString() === tutorId.toString()
            );
            console.log("Already applied:", alreadyApplied);
            
            if (alreadyApplied) {
              bot.sendMessage(chatId, 'You have already applied for this assignment.');
              userSessions[chatId].state = 'main_menu';
              showMainMenu(chatId);
              return;
            }
            
            // Add tutor to applicants
            assignment.applicants.push({
              tutorId: tutorId,
              status: 'Pending',
              appliedAt: new Date()
            });
            
            await assignment.save();
            console.log("Application saved successfully");
            
            // Clear pending assignment
            delete userSessions[chatId].pendingAssignmentId;
            
            bot.sendMessage(chatId, 'You have successfully applied for this assignment! We will notify you when there are updates.', {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'View My Applications', callback_data: 'view_applications' }],
                  [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
                ]
              }
            });
          } catch (err) {
            console.error('Error processing application:', err);
            bot.sendMessage(chatId, 'There was an error processing your application. Please try again later.');
            userSessions[chatId].state = 'main_menu';
            showMainMenu(chatId);
          }
        } else {
          console.log("No pending assignment, going to main menu");
          // No pending assignment, just go to main menu
          userSessions[chatId].state = 'main_menu';
          showMainMenu(chatId);
        }
      } else {
        console.log("No user session or tutorId found");
        bot.sendMessage(chatId, 'Session expired. Please start again.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Start Over', callback_data: 'start' }]
            ]
          },
        });
      }
    } 
    else if (data === 'profile_edit') {
      if (!userSessions[chatId] || !userSessions[chatId].tutorId) {
        return bot.sendMessage(chatId, 'Session expired. Please start again.');
      }
    
      userSessions[chatId].state = 'editing_profile';
      userSessions[chatId].editStep = 'fullName';
    
      bot.sendMessage(chatId, 'Let\'s update your profile.\n\nWhat is your full name?');
    }
    else if (data === 'main_menu') {
      // Show main menu
      showMainMenu(chatId);
    }
    else if (data === 'view_assignments') {
      // Show available assignments
      showAssignments(chatId, 1, 'open');
    }
    else if (data === 'view_applications') {
      // Show user's applications
      showApplications(chatId, 1);
    }
    else if (data.startsWith('assignments_page_')) {
      // Handle assignment pagination
      const page = parseInt(data.split('_').pop());
      showAssignments(chatId, page, 'open');
    }
    else if (data.startsWith('applications_page_')) {
      // Handle applications pagination
      const page = parseInt(data.split('_').pop());
      showApplications(chatId, page);
    }
    else if (data.startsWith('apply_')) {
      // Handle assignment application
      const assignmentId = data.split('_')[1];
      
      if (!userSessions[chatId] || !userSessions[chatId].tutorId) {
        return bot.sendMessage(chatId, 'Your session has expired. Please start again.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Start Over', callback_data: 'start' }]
            ]
          }
        });
      }
      
      // Find the assignment
      const assignment = await Assignment.findById(assignmentId);
      
      if (!assignment) {
        return bot.sendMessage(chatId, 'This assignment no longer exists.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Back to Assignments', callback_data: 'view_assignments' }]
            ]
          }
        });
      }
      
      // Check if assignment is still open
      if (assignment.status !== 'Open') {
        return bot.sendMessage(chatId, 'This assignment is no longer open for applications.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Back to Assignments', callback_data: 'view_assignments' }]
            ]
          }
        });
      }
      
      // Check if already applied
      const tutorId = userSessions[chatId].tutorId;
      const alreadyApplied = assignment.applicants.some(app => 
        app.tutorId.toString() === tutorId.toString()
      );
      
      if (alreadyApplied) {
        return bot.sendMessage(chatId, 'You have already applied for this assignment.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'View My Applications', callback_data: 'view_applications' }],
              [{ text: 'Back to Assignments', callback_data: 'view_assignments' }]
            ]
          }
        });
      }
      
      // Add tutor to applicants
      assignment.applicants.push({
        tutorId: tutorId,
        status: 'Pending',
        appliedAt: new Date()
      });
      
      await assignment.save();
      
      bot.sendMessage(chatId, 'You have successfully applied for this assignment! We will notify you when there are updates.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'View My Applications', callback_data: 'view_applications' }],
            [{ text: 'Back to Assignments', callback_data: 'view_assignments' }],
            [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
          ]
        }
      });
    }
    else if (data.startsWith('view_application_')) {
      // View specific application
      const assignmentId = data.split('_').pop();
      
      if (!userSessions[chatId] || !userSessions[chatId].tutorId) {
        return bot.sendMessage(chatId, 'Your session has expired. Please start again.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Start Over', callback_data: 'start' }]
            ]
          }
        });
      }
      
      // Find the assignment
      const assignment = await Assignment.findById(assignmentId);
      
      if (!assignment) {
        return bot.sendMessage(chatId, 'This assignment no longer exists.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Back to Applications', callback_data: 'view_applications' }]
            ]
          }
        });
      }
      
      // Find the tutor's application
      const tutorId = userSessions[chatId].tutorId;
      const application = assignment.applicants.find(app => 
        app.tutorId.toString() === tutorId.toString()
      );
      
      if (!application) {
        return bot.sendMessage(chatId, 'You have not applied for this assignment.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Back to Applications', callback_data: 'view_applications' }]
            ]
          }
        });
      }
      
      // Format application details
      let msg = formatAssignment(assignment);
      msg += `\n\n*Your Application Status:* ${application.status}`;
      msg += `\n*Applied on:* ${application.appliedAt.toLocaleDateString()}`;
      
      // Create appropriate buttons based on application status
      const keyboard = [];
      
      if (application.status === 'Pending') {
        keyboard.push([{ text: 'Withdraw Application', callback_data: `withdraw_${assignment._id}` }]);
      }
      
      keyboard.push([{ text: 'Back to My Applications', callback_data: 'view_applications' }]);
      keyboard.push([{ text: 'Back to Main Menu', callback_data: 'main_menu' }]);
      
      bot.sendMessage(chatId, msg, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    }
    else if (data.startsWith('withdraw_')) {
      // Withdraw application
      const assignmentId = data.split('_')[1];
      
      if (!userSessions[chatId] || !userSessions[chatId].tutorId) {
        return bot.sendMessage(chatId, 'Your session has expired. Please start again.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Start Over', callback_data: 'start' }]
            ]
          }
        });
      }
      
      // Confirm withdrawal
      bot.sendMessage(chatId, 'Are you sure you want to withdraw your application? This action cannot be undone.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yes, withdraw my application', callback_data: `confirm_withdraw_${assignmentId}` }],
            [{ text: 'No, keep my application', callback_data: `view_application_${assignmentId}` }]
          ]
        }
      });
    }
    else if (data.startsWith('confirm_withdraw_')) {
      // Confirm withdrawal
      const assignmentId = data.split('_').pop();
      
      if (!userSessions[chatId] || !userSessions[chatId].tutorId) {
        return bot.sendMessage(chatId, 'Your session has expired. Please start again.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Start Over', callback_data: 'start' }]
            ]
          }
        });
      }
      
      const tutorId = userSessions[chatId].tutorId;
      
      // Update the assignment to remove the application
      const result = await Assignment.updateOne(
        { _id: assignmentId },
        { $pull: { applicants: { tutorId: tutorId } } }
      );
      
      if (result.modifiedCount > 0) {
        bot.sendMessage(chatId, 'Your application has been withdrawn successfully.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'View Available Assignments', callback_data: 'view_assignments' }],
              [{ text: 'View My Applications', callback_data: 'view_applications' }],
              [{ text: 'Back to Main Menu', callback_data: 'main_menu' }]
            ]
          }
        });
      } else {
        bot.sendMessage(chatId, 'There was an error withdrawing your application. Please try again later.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Back to My Applications', callback_data: 'view_applications' }]
            ]
          }
        });
      }
    }
  } catch (err) {
    console.error('Error handling callback query:', err);
    bot.sendMessage(chatId, 'There was an error processing your request. Please try again later.');
  }
});

async function updateChannelAssignmentMessage(assignment) {
  try {
    // We need to find the message ID in the channel
    // You'll need to store message IDs when posting to the channel
    // Add this field to your assignment schema
    if (!assignment.channelMessageId) {
      console.log(`No channel message ID found for assignment ${assignment._id}`);
      return;
    }
    
    const channelId = process.env.CHANNEL_ID;
    const formattedAssignment = formatAssignment(assignment);
    
    // Update the message in the channel with closed status and no button
    await bot.editMessageText(formattedAssignment, {
      chat_id: channelId,
      message_id: assignment.channelMessageId,
      parse_mode: 'Markdown',
      reply_markup: {
        // No buttons for closed assignments
        inline_keyboard: []
      }
    });
    
    console.log(`Updated channel message for assignment ${assignment._id} to Closed status`);
  } catch (err) {
    console.error('Error updating channel message:', err);
  }
}

// Now modify the createAssignmentPost function to store the message ID
async function createAssignmentPost(channelId, assignment) {
  try {
    const formattedAssignment = formatAssignment(assignment);
    
    // Create the message with apply button
    const sentMessage = await bot.sendMessage(channelId, formattedAssignment, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Apply for this Assignment', url: `https://t.me/${process.env.BOT_USERNAME}?start=apply_${assignment._id}` }]
        ]
      }
    });
    
    // Store the message ID in the assignment document
    assignment.channelMessageId = sentMessage.message_id;
    await assignment.save();
    
    console.log(`Posted assignment ${assignment._id} to channel ${channelId} with message ID ${sentMessage.message_id}`);
  } catch (err) {
    console.error('Error posting assignment to channel:', err);
  }
}


bot.onText(/\/post_assignment/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Check if user is an admin
  if (!ADMIN_USERS.includes(userId)) {
    return bot.sendMessage(chatId, 'Sorry, only administrators can post assignments.');
  }
  
  // Initialize posting session
  adminPostingSessions[chatId] = {
    state: 'title',
    assignment: {}
  };
  
  bot.sendMessage(chatId, 'Let\'s create a new assignment post.\n\nPlease enter the assignment title:');
});

// Handle assignment creation conversation flow
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Skip if this is a command or no active posting session
  if (!text || text.startsWith('/') || !adminPostingSessions[chatId]) {
    return;
  }
  
  const session = adminPostingSessions[chatId];
  
  // Handle different states of the assignment creation flow
  switch (session.state) {
    case 'title':
      session.assignment.title = text;
      session.state = 'level';
      bot.sendMessage(chatId, 'Great! Now enter the educational level (e.g. Primary 5, Secondary 3, JC1):');
      break;
      
    case 'level':
      session.assignment.level = text;
      session.state = 'subject';
      bot.sendMessage(chatId, 'Now enter the subject:');
      break;
      
    case 'subject':
      session.assignment.subject = text;
      session.state = 'location';
      bot.sendMessage(chatId, 'Enter the location:');
      break;
      
    case 'location':
      session.assignment.location = text;
      session.state = 'rate';
      bot.sendMessage(chatId, 'Enter the hourly rate:');
      break;
      
    case 'rate':
      session.assignment.rate = text;
      session.state = 'frequency';
      bot.sendMessage(chatId, 'Enter the lesson frequency (e.g. Once a week, Twice a week):');
      break;
      
    case 'frequency':
      session.assignment.frequency = text;
      session.state = 'startDate';
      bot.sendMessage(chatId, 'Enter the start date:');
      break;
      
    case 'startDate':
      session.assignment.startDate = text;
      session.state = 'description';
      bot.sendMessage(chatId, 'Enter a detailed description of the assignment:');
      break;
      
    case 'description':
      session.assignment.description = text;
      session.state = 'requirements';
      bot.sendMessage(chatId, 'Enter any specific requirements (or type "none" if there are none):');
      break;
      
    case 'requirements':
      if (text.toLowerCase() !== 'none') {
        session.assignment.requirements = text;
      }
      session.state = 'confirmation';
      
      // Show preview of the assignment
      const previewMsg = formatAssignment(session.assignment);
      bot.sendMessage(chatId, `*Preview of Assignment:*\n\n${previewMsg}\n\nIs this correct? Type "yes" to post or "no" to cancel.`, {
        parse_mode: 'Markdown'
      });
      break;
      
    case 'confirmation':
      if (text.toLowerCase() === 'yes') {
        try {
          // Set default status
          session.assignment.status = 'Open';
          
          // Save assignment to database
          const newAssignment = new Assignment(session.assignment);
          const savedAssignment = await newAssignment.save();
          
          // Post to channel
          if (process.env.CHANNEL_ID) {
            console.log(`Attempting to post to channel: ${process.env.CHANNEL_ID}`);
            try {
              await createAssignmentPost(process.env.CHANNEL_ID, savedAssignment);
              bot.sendMessage(chatId, 'Assignment has been posted to the channel successfully!');
            } catch (channelErr) {
              console.error('Error posting to channel:', channelErr);
              bot.sendMessage(chatId, `Error posting to channel: ${channelErr.message}`);
            }
          } else {
            bot.sendMessage(chatId, 'Assignment saved but not posted to channel: CHANNEL_ID not configured.');
          }
        } catch (err) {
          console.error('Error saving assignment:', err);
          bot.sendMessage(chatId, 'There was an error saving the assignment. Please try again later.');
        }
      } else {
        bot.sendMessage(chatId, 'Assignment posting cancelled.');
      }
      
      // Clear posting session
      delete adminPostingSessions[chatId];
      break;
  }
});

// Add a command to cancel assignment posting
bot.onText(/\/cancel_post/, (msg) => {
  const chatId = msg.chat.id;
  
  if (adminPostingSessions[chatId]) {
    delete adminPostingSessions[chatId];
    bot.sendMessage(chatId, 'Assignment posting cancelled.');
  }
});

// Handle "Apply" button clicks from channel
bot.onText(/\/start apply_(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const assignmentId = match[1];
  
  console.log(`Received application request for assignment: ${assignmentId}`);
  
  // Store the assignment ID in the session to redirect after verification
  if (!userSessions[chatId]) {
    userSessions[chatId] = {};
  }
  userSessions[chatId].pendingAssignmentId = assignmentId;
  console.log(`Stored pending assignment ID in session: ${assignmentId}`);
  
  // Start the application process
  bot.sendMessage(chatId, 'Welcome! To apply for this assignment, please share your phone number to verify your profile.', {
    reply_markup: {
      keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
      one_time_keyboard: true,
    },
  });
});

// Regular start command without assignment
bot.onText(/^\/start$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
    reply_markup: {
      keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
      one_time_keyboard: true,
    },
  });
});

// Admin endpoint to post new assignments to channel
app.post('/api/assignments', async (req, res) => {
  try {
    // Verify API key for security
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Create new assignment
    const assignment = new Assignment(req.body);
    const savedAssignment = await assignment.save();
    
    // Post to channel if CHANNEL_ID is configured
    if (process.env.CHANNEL_ID) {
      await createAssignmentPost(process.env.CHANNEL_ID, savedAssignment);
    }
    
    res.status(201).json(savedAssignment);
  } catch (err) {
    console.error('Error creating assignment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to update assignment status
app.put('/api/assignments/:id/status', async (req, res) => {
  try {
    // Verify API key for security
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Update assignment status
    const assignment = await Assignment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    
    // Notify applicants of status change if needed
    if (status === 'Closed' || status === 'Filled') {
      // For each applicant, send a notification
      for (const applicant of assignment.applicants) {
        // Look up the tutor
        const tutor = await Tutor.findById(applicant.tutorId);
        if (tutor && tutor.telegramChatId) {
          await bot.sendMessage(
            tutor.telegramChatId,
            `*Assignment Update*\n\nThe assignment "${assignment.title}" has been marked as ${status}.`,
            { parse_mode: 'Markdown' }
          );
        }
      }
    }
    
    res.json(assignment);
  } catch (err) {
    console.error('Error updating assignment status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin endpoint to update application status
app.put('/api/assignments/:assignmentId/applications/:tutorId', async (req, res) => {
  try {
    // Verify API key for security
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { assignmentId, tutorId } = req.params;
    const { status } = req.body;
    
    // Update application status
    const assignment = await Assignment.findOneAndUpdate(
      { 
        _id: assignmentId,
        'applicants.tutorId': tutorId
      },
      {
        $set: { 'applicants.$.status': status }
      },
      { new: true }
    );
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment or application not found' });
    }
    
    // Find the tutor to notify them
    const tutor = await Tutor.findById(tutorId);
    if (tutor && tutor.telegramChatId) {
      await bot.sendMessage(
        tutor.telegramChatId,
        `*Application Update*\n\nYour application for "${assignment.title}" has been ${status.toLowerCase()}.`,
        { parse_mode: 'Markdown' }
      );
    }
    
    res.json(assignment);
  } catch (err) {
    console.error('Error updating application status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Store Telegram Chat ID for tutors
app.put('/api/tutors/:id/telegram', async (req, res) => {
  try {
    // Verify API key for security
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { telegramChatId } = req.body;
    
    // Update tutor with telegram chat id
    const tutor = await Tutor.findByIdAndUpdate(
      id,
      { telegramChatId },
      { new: true }
    );
    
    if (!tutor) {
      return res.status(404).json({ error: 'Tutor not found' });
    }
    
    res.json(tutor);
  } catch (err) {
    console.error('Error updating tutor telegram ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clean up expired sessions periodically
setInterval(() => {
  const now = Date.now();
  const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const chatId in userSessions) {
    if (userSessions[chatId].lastActive && (now - userSessions[chatId].lastActive > sessionTimeout)) {
      delete userSessions[chatId];
    }
  }
}, 60 * 60 * 1000); // Check every hour

// Update lastActive timestamp on each interaction
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (userSessions[chatId]) {
    userSessions[chatId].lastActive = Date.now();
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!userSessions[chatId] || userSessions[chatId].state !== 'editing_profile') return;

  const tutorId = userSessions[chatId].tutorId;
  const step = userSessions[chatId].editStep;

  const nextSteps = {
    fullName: 'age',
    age: 'email',
    email: 'gender',
    gender: 'introduction',
    introduction: null // finish here for now
  };

  try {
    await Tutor.findByIdAndUpdate(tutorId, { [step]: text });

    const nextStep = nextSteps[step];
    if (nextStep) {
      userSessions[chatId].editStep = nextStep;
      bot.sendMessage(chatId, `Got it! What's your ${nextStep}?`);
    } else {
      delete userSessions[chatId].editStep;
      userSessions[chatId].state = 'main_menu';
      bot.sendMessage(chatId, 'Your profile has been updated successfully.');
      showMainMenu(chatId);
    }
  } catch (err) {
    console.error('Error updating tutor profile:', err);
    bot.sendMessage(chatId, 'There was an error updating your profile. Please try again later.');
  }
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot server is running on port ${PORT}`);
});