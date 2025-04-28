const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const express = require('express');

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
  }
});

const Assignment = mongoose.model('Assignment', assignmentSchema);


// Create Telegram Bot
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

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Please share your phone number using the button below.', {
    reply_markup: {
      keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
      one_time_keyboard: true,
    },
  });
});

const userSessions = {};

// Listen for contact share
bot.on('contact', async (msg) => {
  const chatId = msg.chat.id;
  const contactNumber = msg.contact.phone_number;
  
  console.log(`Received phone number from Telegram: ${contactNumber}`);

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
      // Store tutor info in session
      userSessions[chatId] = {
        tutorId: tutor._id,
        state: 'profile_verification'
      };
      
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
    } else if (matchingTutor) {
      // Store matched tutor info in session
      userSessions[chatId] = {
        tutorId: matchingTutor._id,
        state: 'profile_verification'
      };
      
      // Format the matched tutor profile nicely
      const profileMessage = formatTutorProfile(matchingTutor);
      
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
        
        // Add other levels as needed based on your schema
        
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
      
      profile += `Please verify if this information is correct.`;
      
      return profile;
    }
    
    // Add button callback handler
    bot.on('callback_query', async (callbackQuery) => {
      const chatId = callbackQuery.message.chat.id;
      const data = callbackQuery.data;
      
      // Acknowledge the button press
      bot.answerCallbackQuery(callbackQuery.id);
      
      switch (data) {
        case 'start':
          // Return to start
          bot.sendMessage(chatId, 'Welcome to Lion City Tutors! Please share your phone number to verify your profile.', {
            reply_markup: {
              keyboard: [[{ text: 'Share Phone Number', request_contact: true }]],
              one_time_keyboard: true,
            },
          });
          break;
          
        case 'profile_confirm':
          // User confirmed profile
          if (userSessions[chatId] && userSessions[chatId].tutorId) {
            userSessions[chatId].state = 'main_menu';
            showMainMenu(chatId);
          } else {
            bot.sendMessage(chatId, 'Session expired. Please start again.', {
              reply_markup: {
                keyboard: [[{ text: 'Start Over', callback_data: 'start' }]],
                one_time_keyboard: true,
              },
            });
          }
          break;
          
        case 'profile_edit':
          // User wants to edit profile
          bot.sendMessage(chatId, 'To edit your profile, please visit our website: https://www.lioncitytutors.com/tutor-login', {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Go to Website', url: 'https://www.lioncitytutors.com/tutor-login' }],
                [{ text: 'Back to Main Menu', callback_data: 'profile_confirm' }]
              ]
            }
          });
          break;
      }
    });
    
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
  } catch (err) {
    console.error('Error finding tutor:', err);
    bot.sendMessage(chatId, 'There was an error processing your request. Please try again later.');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bot server is running on port ${PORT}`);
});
