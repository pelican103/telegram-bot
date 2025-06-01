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
    // Handle contact sharing
    if (message.contact) {
      await handlers.handleContact(
        botInstance, chatId, userId, message.contact, 
        context.Tutor, context.userSessions, context.ADMIN_USERS
      );
      return;
    }
    
    // Handle /start command
    if (text === '/start' || text?.startsWith('/start ')) {
      const startParam = text.split(' ')[1];
      await handlers.handleStart(
        botInstance, chatId, userId, context.Tutor, 
        context.userSessions, startParam
      );
      return;
    }
    
    // Handle admin commands
    if (handlers.isAdmin(userId, context.ADMIN_USERS)) {
      if (text === '/post_assignment') {
        await handlers.startAssignmentCreation(botInstance, chatId, context.userSessions);
        return;
      }
    }
    
    // Handle user session states
    const userSession = context.userSessions[chatId];
    
    // Handle assignment creation steps
    if (userSession?.state === 'creating_assignment') {
      await handlers.handleAssignmentStep(botInstance, chatId, text, context.userSessions);
      return;
    }
    
    // Handle profile editing states
    if (userSession?.state?.startsWith('awaiting_')) {
      await handleProfileInput(botInstance, chatId, text, context, handlers);
      return;
    }
    
    // Default response for unrecognized messages
    if (userSession?.tutorId) {
      await handlers.showMainMenu(chatId, botInstance, userId, context.ADMIN_USERS);
    } else {
      await handlers.safeSend(botInstance, chatId, 'Please start with /start to use this bot.');
    }
    
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
          await handlers.startAssignmentCreation(botInstance, chatId, context.userSessions);
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
  
  // Confirm application
  if (data.startsWith('confirm_apply_')) {
    const assignmentId = data.replace('confirm_apply_', '');
    await handlers.handleConfirmApplication(
      botInstance, chatId, userId, assignmentId, context.Assignment, 
      context.Tutor, context.userSessions
    );
    return;
  }
  
  // Post to channel
  if (data.startsWith('post_to_channel_')) {
    if (handlers.isAdmin(userId, context.ADMIN_USERS)) {
      const assignmentId = data.replace('post_to_channel_', '');
      await handlers.postAssignmentToChannel(
        botInstance, chatId, assignmentId, context.CHANNEL_ID, BOT_USERNAME
      );
    }
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
}

async function handleProfileCallbacks(botInstance, chatId, data, context, handlers) {
  const userSession = context.userSessions[chatId];
  
  if (data.startsWith('edit_')) {
    const field = data.replace('edit_', '');
    const validFields = ['name', 'email', 'phone', 'subjects', 'experience', 'hourlyRate', 'availability'];
    
    if (validFields.includes(field)) {
      context.userSessions[chatId] = {
        ...userSession,
        state: `awaiting_${field}`,
        editingField: field
      };
      
      const fieldNames = {
        name: 'Name',
        email: 'Email',
        phone: 'Phone Number',
        subjects: 'Subjects (comma-separated)',
        experience: 'Experience',
        hourlyRate: 'Hourly Rate',
        availability: 'Availability'
      };
      
      await handlers.safeSend(botInstance, chatId, 
        `Please enter your new ${fieldNames[field]}:`
      );
    }
    return;
  }
}

// Handle profile input during editing
async function handleProfileInput(botInstance, chatId, text, context, handlers) {
  const userSession = context.userSessions[chatId];
  const field = userSession.editingField;
  
  try {
    const tutor = await context.Tutor.findById(userSession.tutorId);
    if (!tutor) {
      await handlers.safeSend(botInstance, chatId, 'Tutor profile not found.');
      return;
    }
    
    // Update the specific field
    switch (field) {
      case 'subjects':
        tutor.subjects = text.split(',').map(s => s.trim()).filter(s => s.length > 0);
        break;
      case 'hourlyRate':
        const rate = parseFloat(text);
        if (isNaN(rate) || rate <= 0) {
          await handlers.safeSend(botInstance, chatId, 'Please enter a valid hourly rate (number).');
          return;
        }
        tutor.hourlyRate = rate;
        break;
      default:
        tutor[field] = text;
    }
    
    await tutor.save();
    
    // Clear session state
    context.userSessions[chatId] = {
      ...userSession,
      state: null,
      editingField: null
    };
    
    await handlers.safeSend(botInstance, chatId, 
      `✅ Your ${field} has been updated successfully!`
    );
    
    // Show updated profile
    await handlers.showProfile(chatId, botInstance, userSession.tutorId, context.Tutor);
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    await handlers.safeSend(botInstance, chatId, 
      'Sorry, there was an error updating your profile. Please try again.'
    );
  }
}

// Handle profile edit menu
async function handleProfileEdit(botInstance, chatId, context, handlers) {
  const userSession = context.userSessions[chatId];
  
  if (!userSession?.tutorId) {
    await handlers.safeSend(botInstance, chatId, 'Please complete your registration first.');
    return;
  }
  
  try {
    const tutor = await context.Tutor.findById(userSession.tutorId);
    if (!tutor) {
      await handlers.safeSend(botInstance, chatId, 'Tutor profile not found.');
      return;
    }
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '✏️ Edit Name', callback_data: 'edit_name' },
          { text: '📧 Edit Email', callback_data: 'edit_email' }
        ],
        [
          { text: '📱 Edit Phone', callback_data: 'edit_phone' },
          { text: '📚 Edit Subjects', callback_data: 'edit_subjects' }
        ],
        [
          { text: '🎓 Edit Experience', callback_data: 'edit_experience' },
          { text: '💰 Edit Hourly Rate', callback_data: 'edit_hourlyRate' }
        ],
        [
          { text: '⏰ Edit Availability', callback_data: 'edit_availability' }
        ],
        [
          { text: '🔙 Back to Main Menu', callback_data: 'main_menu' }
        ]
      ]
    };
    
    await handlers.safeSend(botInstance, chatId, 
      'Select what you would like to edit:', 
      { reply_markup: keyboard }
    );
    
  } catch (error) {
    console.error('❌ Error showing profile edit menu:', error);
    await handlers.safeSend(botInstance, chatId, 'Error loading profile edit menu.');
  }
}

// Export the main handler function and utilities
export default async function handler(req, res) {
  try {
    await connectToDatabase();
    const botInstance = getBot();
    
    // Create context object with all necessary data
    const context = {
      userSessions,
      adminPostingSessions,
      ADMIN_USERS,
      CHANNEL_ID,
      BOT_USERNAME,
      Tutor,
      Assignment
    };
    
    if (req.method === 'POST') {
      const update = req.body;
      await handleUpdate(botInstance, context, update);
      res.status(200).json({ ok: true });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('❌ Handler error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

// Utility functions for external use
export {
  getBot,
  connectToDatabase,
  userSessions,
  adminPostingSessions,
  ADMIN_USERS,
  CHANNEL_ID,
  BOT_USERNAME
};