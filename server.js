const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

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
      console.log(`Found match for ${contactNumber}: ${tutor.fullName}`);
      bot.sendMessage(chatId, `Hi ${tutor.fullName}, you are registered! We have received your application.`);
    } else {
      // If still not found, try a more aggressive search that ignores all non-digits
      const tutors = await Tutor.find({});
      
      // Manual comparison ignoring all formatting
      const matchingTutor = tutors.find(t => {
        const dbNumberDigits = t.contactNumber ? t.contactNumber.replace(/\D/g, '') : '';
        
        // Check if normalized input contains the db number or vice versa
        return dbNumberDigits.includes(normalizedInput) || 
               normalizedInput.includes(dbNumberDigits);
      });
      
      if (matchingTutor) {
        console.log(`Found match using manual comparison: ${matchingTutor.fullName}`);
        bot.sendMessage(chatId, `Hi ${matchingTutor.fullName}, you are registered! We have received your application.`);
      } else {
        console.log(`No match found for ${contactNumber}`);
        bot.sendMessage(chatId, `Sorry, we could not find your registration. Please register at https://www.lioncitytutors.com/register-tutor`);
      }
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
