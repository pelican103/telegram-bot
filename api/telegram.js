import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';

let bot = null;
let isConnected = false;

const userSessions = {};
const adminPostingSessions = {};
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(id => id.trim()) : [];
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME; // Add this to your environment variables

// Store handlers reference
let handlers = null;

async function connectToDatabase() {
  if (!isConnected) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      isConnected = true;
      console.log('✅ MongoDB connected (Vercel)');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }
}

function getBot() {
  if (!bot) {
    console.log('🤖 Initializing Telegram bot...');
    if (!process.env.BOT_TOKEN) {
      throw new Error('BOT_TOKEN environment variable is required');
    }
    bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });
    console.log('📛 Using bot token starts with:', process.env.BOT_TOKEN?.slice(0, 8));
    console.log('🤖 Bot initialized successfully');
  }
  return bot;
}

// Load handlers dynamically (since they're CommonJS)
async function loadHandlers() {
  if (!handlers) {
    try {
      // Dynamic import for CommonJS module
      const handlersModule = await import('../bot/handlers.js');
      handlers = handlersModule.default || handlersModule;
      console.log('✅ Handlers loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load handlers:', error);
      throw error;
    }
  }
  return handlers;
}

// Main update handler
async function handleUpdate(botInstance, context, update) {
  try {
    const handlers = await loadHandlers();
    
    console.log('📨 Processing update:', JSON.stringify(update, null, 2));
    
    // Handle different types of updates
    if (update.message) {
      await handleMessage(botInstance, context, update.message, handlers);
    } else if (update.callback_query) {
      await handleCallbackQuery(botInstance, context, update.callback_query, handlers);
    }
    
  } catch (error) {
    console.error('❌ Error handling update:', error);
    throw error;
  }
}

// Handle regular messages
async function handleMessage(botInstance, context, message, handlers) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;
  
  console.log(`📝 Message from ${userId} in chat ${chatId}: ${text}`);
  
  try {
    // Handle /start command
    if (text === '/start' || text?.startsWith('/start ')) {
      const startParam = text.split(' ')[1];
      
      if (startParam) {
        // Handle start parameter (e.g., apply_assignmentId)
        await handlers.handleStartParameter(
          botInstance, chatId, userId, startParam, 
          context.Assignment, context.Tutor, context.userSessions, context.ADMIN_USERS
        );
        return;
      }
      
      // Regular start command
      await handleStartCommand(botInstance, chatId, userId, context, handlers);
      return;
    }
    
    // Handle admin commands
    if (handlers.isAdmin(userId, context.ADMIN_USERS)) {
      if (text === '/post_assignment') {
        await handlers.handlePostAssignmentCommand(
          botInstance, chatId, userId, context.ADMIN_USERS, context.userSessions
        );
        return;
      }
      
      if (text?.startsWith('/view_applications')) {
        await handlers.handleViewApplicationsCommand(
          botInstance, chatId, userId, context.ADMIN_USERS, context.Assignment, text
        );
        return;
      }
    }
    
    // Handle user session states
    const userSession = context.userSessions[chatId];
    
    if (userSession?.state === 'awaiting_assignment_details') {
      await handlers.handleAssignmentDetails(
        botInstance, chatId, text, context.Assignment, context.userSessions, 
        context.CHANNEL_ID, BOT_USERNAME
      );
      return;
    }
    
    // Handle profile editing states
    if (userSession?.state?.startsWith('awaiting_')) {
      await handleProfileInput(botInstance, chatId, text, context, handlers);
      return;
    }
    
    // Default response
    await handlers.showMainMenu(chatId, botInstance, userId, context.ADMIN_USERS);
    
  } catch (error) {
    console.error('❌ Error handling message:', error);
    await handlers.safeSend(botInstance, chatId, 'Sorry, there was an error processing your message. Please try again.');
  }
}

// Handle callback queries (button presses)
async function handleCallbackQuery(botInstance, context, callbackQuery, handlers) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  console.log(`🔘 Callback from ${userId} in chat ${chatId}: ${data}`);
  
  try {
    // Acknowledge the callback query
    await botInstance.answerCallbackQuery(callbackQuery.id);
    
    // Handle different callback actions
    switch (data) {
      case 'main_menu':
        await handlers.showMainMenu(chatId, botInstance, userId, context.ADMIN_USERS);
        break;
        
      case 'view_assignments':
        await handlers.showAssignments(chatId, botInstance, context.Assignment, context.userSessions);
        break;
        
      case 'view_applications':
        await handlers.showApplications(chatId, botInstance, context.Assignment, context.userSessions);
        break;
        
      case 'profile_edit':
        await handleProfileEdit(botInstance, chatId, context, handlers);
        break;
        
      case 'admin_panel':
        if (handlers.isAdmin(userId, context.ADMIN_USERS)) {
          await handlers.showAdminPanel(chatId, botInstance);
        }
        break;
        
      case 'admin_post_assignment':
        if (handlers.isAdmin(userId, context.ADMIN_USERS)) {
          await handlers.handlePostAssignmentCommand(
            botInstance, chatId, userId, context.ADMIN_USERS, context.userSessions
          );
        }
        break;
        
      case 'admin_view_all_applications':
        if (handlers.isAdmin(userId, context.ADMIN_USERS)) {
          await handlers.showAllApplications(chatId, botInstance, context.Assignment);
        }
        break;
        
      default:
        await handleSpecificCallbacks(botInstance, chatId, userId, data, context, handlers);
    }
    
  } catch (error) {
    console.error('❌ Error handling callback query:', error);
    await handlers.safeSend(botInstance, chatId, 'Sorry, there was an error processing your request. Please try again.');
  }
}

// Handle specific callback patterns
async function handleSpecificCallbacks(botInstance, chatId, userId, data, context, handlers) {
  // Assignment pagination
  if (data.startsWith('assignments_page_')) {
    const page = parseInt(data.replace('assignments_page_', ''));
    await handlers.showAssignments(chatId, botInstance, context.Assignment, context.userSessions, page);
    return;
  }
  
  // Applications pagination
  if (data.startsWith('applications_page_')) {
    const page = parseInt(data.replace('applications_page_', ''));
    await handlers.showApplications(chatId, botInstance, context.Assignment, context.userSessions, page);
    return;
  }
  
  // Apply for assignment
  if (data.startsWith('apply_')) {
    const assignmentId = data.replace('apply_', '');
    await handlers.handleAssignmentApplication(
      botInstance, chatId, userId, assignmentId, context.Assignment, 
      context.Tutor, context.userSessions, context.ADMIN_USERS
    );
    return;
  }
  
  // Admin specific callbacks
  if (handlers.isAdmin(userId, context.ADMIN_USERS)) {
    await handleAdminCallbacks(botInstance, chatId, data, context, handlers);
    return;
  }
  
  // Profile editing callbacks
  await handleProfileCallbacks(botInstance, chatId, data, context, handlers);
}

// Handle admin-specific callbacks
async function handleAdminCallbacks(botInstance, chatId, data, context, handlers) {
  // View assignment applications
  if (data.startsWith('admin_view_assignment_')) {
    const assignmentId = data.replace('admin_view_assignment_', '');
    await handlers.showAssignmentApplications(chatId, botInstance, context.Assignment, assignmentId);
    return;
  }
  
  // Accept application
  if (data.startsWith('admin_accept_')) {
    const parts = data.replace('admin_accept_', '').split('_');
    const assignmentId = parts[0];
    const tutorId = parts[1];
    await handlers.handleApplicationDecision(
      botInstance, chatId, assignmentId, tutorId, 'Accepted', context.Assignment, context.Tutor
    );
    return;
  }
  
  // Reject application
  if (data.startsWith('admin_reject_')) {
    const parts = data.replace('admin_reject_', '').split('_');
    const assignmentId = parts[0];
    const tutorId = parts[1];
    await handlers.handleApplicationDecision(
      botInstance, chatId, assignmentId, tutorId, 'Rejected', context.Assignment, context.Tutor
    );
    return;
  }
  
  // Toggle assignment status
  if (data.startsWith('admin_close_') || data.startsWith('admin_reopen_')) {
    const assignmentId = data.replace(/^admin_(close|reopen)_/, '');
    await handlers.toggleAssignmentStatus(botInstance, chatId, assignmentId, context.Assignment);
    return;
  }
  
  // Admin pagination
  if (data.startsWith('admin_all_apps_page_')) {
    const page = parseInt(data.replace('admin_all_apps_page_', ''));
    await handlers.showAllApplications(chatId, botInstance, context.Assignment, page);
    return;
  }
}

// Handle profile-related callbacks
async function handleProfileCallbacks(botInstance, chatId, data, context, handlers) {
  const userSession = context.userSessions[chatId];
  if (!userSession || !userSession.tutorId) {
    await handlers.safeSend(botInstance, chatId, 'Your session has expired. Please start again with /start');
    return;
  }
  
  const tutor = await context.Tutor.findById(userSession.tutorId);
  if (!tutor) {
    await handlers.safeSend(botInstance, chatId, 'Tutor profile not found. Please start again.');
    return;
  }
  
  // Handle various profile editing actions
  if (data === 'edit_personal_info') {
    const menu = handlers.getPersonalInfoMenu(tutor);
    await handlers.safeSend(botInstance, chatId, 'Edit Personal Information:', { reply_markup: menu });
  } else if (data === 'edit_teaching_levels') {
    const menu = handlers.getTeachingLevelsMenu(tutor);
    await handlers.safeSend(botInstance, chatId, 'Edit Teaching Levels:', { reply_markup: menu });
  } else if (data === 'edit_locations') {
    const menu = handlers.getLocationsMenu(tutor);
    await handlers.safeSend(botInstance, chatId, 'Select your preferred locations:', { reply_markup: menu });
  } else if (data === 'edit_availability') {
    const menu = handlers.getAvailabilityMenu(tutor);
    await handlers.safeSend(botInstance, chatId, 'Select your availability:', { reply_markup: menu });
  } else if (data === 'edit_hourly_rates') {
    const menu = handlers.getHourlyRatesMenu(tutor);
    await handlers.safeSend(botInstance, chatId, 'Edit Hourly Rates:', { reply_markup: menu });
  }
  
  // Handle toggle callbacks for locations, availability, subjects
  await handleToggleCallbacks(botInstance, chatId, data, tutor, context, handlers);
}

// Handle toggle callbacks (locations, availability, subjects)
async function handleToggleCallbacks(botInstance, chatId, data, tutor, context, handlers) {
  let updated = false;
  
  // Toggle location
  if (data.startsWith('toggle_location_')) {
    const location = data.replace('toggle_location_', '');
    handlers.initializeLocations(tutor);
    tutor.locations[location] = !tutor.locations[location];
    updated = true;
  }
  
  // Toggle availability
  if (data.startsWith('toggle_availability_')) {
    const slot = data.replace('toggle_availability_', '');
    handlers.initializeAvailability(tutor);
    tutor.availableTimeSlots[slot] = !tutor.availableTimeSlots[slot];
    updated = true;
  }
  
  // Toggle subjects
  const subjectPrefixes = ['toggle_primary_', 'toggle_secondary_', 'toggle_jc_', 'toggle_international_'];
  for (const prefix of subjectPrefixes) {
    if (data.startsWith(prefix)) {
      const subject = data.replace(prefix, '');
      const level = prefix.replace('toggle_', '').replace('_', '');
      handlers.initializeTeachingLevels(tutor);
      tutor.teachingLevels[level][subject] = !tutor.teachingLevels[level][subject];
      updated = true;
      break;
    }
  }
  
  if (updated) {
    await tutor.save();
    
    // Refresh the current menu
    if (data.startsWith('toggle_location_')) {
      const menu = handlers.getLocationsMenu(tutor);
      await handlers.safeSend(botInstance, chatId, 'Select your preferred locations:', { reply_markup: menu });
    } else if (data.startsWith('toggle_availability_')) {
      const menu = handlers.getAvailabilityMenu(tutor);
      await handlers.safeSend(botInstance, chatId, 'Select your availability:', { reply_markup: menu });
    }
    // Add more menu refreshes as needed
  }
}

// Handle start command
async function handleStartCommand(botInstance, chatId, userId, context, handlers) {
  try {
    // Find or create tutor
    let tutor = await context.Tutor.findOne({ 
      $or: [
        { chatId: chatId },
        { userId: userId }
      ]
    });
    
    if (!tutor) {
      tutor = new context.Tutor({ 
        chatId: chatId, 
        userId: userId,
        createdAt: new Date()
      });
      await tutor.save();
      console.log(`✅ New tutor created: ${tutor._id}`);
    } else {
      // Update chatId if it has changed
      if (tutor.chatId !== chatId) {
        tutor.chatId = chatId;
        await tutor.save();
      }
    }
    
    // Set user session
    context.userSessions[chatId] = { tutorId: tutor._id };
    
    // Welcome message
    const welcomeMsg = handlers.isAdmin(userId, context.ADMIN_USERS) 
      ? '👋 Welcome back, Admin! Use the menu below to manage the tutoring platform.'
      : '👋 Welcome to the Tutoring Platform! Find your perfect tutoring assignment or update your profile.';
    
    await handlers.safeSend(botInstance, chatId, welcomeMsg);
    await handlers.showMainMenu(chatId, botInstance, userId, context.ADMIN_USERS);
    
  } catch (error) {
    console.error('❌ Error in start command:', error);
    await handlers.safeSend(botInstance, chatId, 'Welcome! There was a minor issue, but you can continue using the bot.');
  }
}

// Handle profile edit
async function handleProfileEdit(botInstance, chatId, context, handlers) {
  try {
    const userSession = context.userSessions[chatId];
    if (!userSession || !userSession.tutorId) {
      await handlers.safeSend(botInstance, chatId, 'Your session has expired. Please start again with /start');
      return;
    }
    
    const tutor = await context.Tutor.findById(userSession.tutorId);
    if (!tutor) {
      await handlers.safeSend(botInstance, chatId, 'Profile not found. Please start again.');
      return;
    }
    
    const profileText = handlers.formatTutorProfile(tutor);
    const menu = handlers.getMainEditProfileMenu(tutor);
    
    await handlers.safeSend(botInstance, chatId, profileText, { 
      parse_mode: 'Markdown',
      reply_markup: menu 
    });
    
  } catch (error) {
    console.error('❌ Error showing profile edit:', error);
    await handlers.safeSend(botInstance, chatId, 'There was an error loading your profile. Please try again.');
  }
}

// Handle profile input
async function handleProfileInput(botInstance, chatId, text, context, handlers) {
  try {
    const userSession = context.userSessions[chatId];
    const tutor = await context.Tutor.findById(userSession.tutorId);
    
    if (!tutor) {
      await handlers.safeSend(botInstance, chatId, 'Profile not found. Please start again.');
      return;
    }
    
    const field = userSession.state.replace('awaiting_', '');
    
    // Validate and save the input
    switch (field) {
      case 'fullName':
        tutor.fullName = text.trim();
        break;
      case 'email':
        // Basic email validation
        if (!text.includes('@')) {
          await handlers.safeSend(botInstance, chatId, '❌ Please enter a valid email address.');
          return;
        }
        tutor.email = text.trim();
        break;
      case 'contactNumber':
        // Basic phone validation
        const normalizedPhones = handlers.normalizePhone(text);
        tutor.contactNumber = normalizedPhones[0];
        break;
      default:
        tutor[field] = text.trim();
    }
    
    await tutor.save();
    userSession.state = null;
    
    await handlers.safeSend(botInstance, chatId, '✅ Information updated successfully!');
    
    // Show updated profile
    const profileText = handlers.formatTutorProfile(tutor);
    const menu = handlers.getMainEditProfileMenu(tutor);
    
    await handlers.safeSend(botInstance, chatId, profileText, { 
      parse_mode: 'Markdown',
      reply_markup: menu 
    });
    
  } catch (error) {
    console.error('❌ Error handling profile input:', error);
    await handlers.safeSend(botInstance, chatId, 'There was an error saving your information. Please try again.');
  }
}

export default async function handler(req, res) {
  // Handle GET requests (for health checks)
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'active', 
      message: 'Telegram bot endpoint is deployed',
      timestamp: new Date().toISOString()
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📩 Incoming Telegram POST update');
    
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      console.log('⚠️ Invalid request body received');
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Connect to database
    await connectToDatabase();
    
    // Get bot instance
    const botInstance = getBot();

    // Create context object
    const context = {
      Tutor,
      Assignment,
      userSessions,
      adminPostingSessions,
      ADMIN_USERS,
      CHANNEL_ID
    };

    // Handle the update
    await handleUpdate(botInstance, context, req.body);

    // Respond to Telegram
    res.status(200).json({ status: 'ok' });
    
  } catch (error) {
    console.error('❌ Telegram bot error:', error);
    
    // Don't expose internal errors to Telegram
    res.status(200).json({ status: 'error_handled' });
  }
}