import TelegramBot from 'node-telegram-bot-api';
import mongoose from 'mongoose';
import Tutor from '../models/Tutor.js';
import Assignment from '../models/Assignment.js';
import * as handlers from '../bot/handlers.js';

let bot = null;
let isConnected = false;

const userSessions = {};
const adminPostingSessions = {};
const ADMIN_USERS = process.env.ADMIN_USERS ? process.env.ADMIN_USERS.split(',').map(id => id.trim()) : [];
const CHANNEL_ID = process.env.CHANNEL_ID;
const BOT_USERNAME = process.env.BOT_USERNAME;

// Main update handler
async function handleUpdate(botInstance, context, update) {
  try {
    console.log('📨 Processing update:', JSON.stringify(update, null, 2));
    
    // Handle different types of updates
    if (update.message) {
      await handleMessage(botInstance, context, update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(botInstance, context, update.callback_query);
    }
    
  } catch (error) {
    console.error('❌ Error handling update:', error);
    throw error;
  }
}

// Handle regular messages
async function handleMessage(botInstance, context, message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text;
  
  console.log(`📝 Message from ${userId} in chat ${chatId}: ${text}`);
  
  try {
    // Handle contact sharing
    if (message.contact) {
      await handlers.handleContact(
        botInstance, chatId, userId, message.contact, 
        Tutor, userSessions, ADMIN_USERS
      );
      return;
    }
    
    // Handle /start command
    if (text === '/start' || text?.startsWith('/start ')) {
      const startParam = text.split(' ')[1];
      await handlers.handleStart(
        botInstance, chatId, userId, Tutor, 
        userSessions, startParam
      );
      return;
    }
    
    // Handle admin commands
    if (handlers.isAdmin(userId, ADMIN_USERS)) {
      if (text === '/post_assignment') {
        await handlers.startAssignmentCreation(botInstance, chatId, userSessions);
        return;
      }
    }
    
    // Handle user session states
    const userSession = userSessions[chatId];
    
    // Handle assignment creation steps
    if (userSession?.state === 'creating_assignment') {
      await handlers.handleAssignmentStep(botInstance, chatId, text, userSessions);
      return;
    }
    
    // Handle profile editing states
    if (userSession?.state?.startsWith('awaiting_')) {
      await handleProfileInput(botInstance, chatId, text, context);
      return;
    }
    
    // Default response for unhandled messages
    await handlers.safeSend(botInstance, chatId, 'Please use the menu buttons or type /start to begin.');
    
  } catch (error) {
    console.error('❌ Error handling message:', error);
    await handlers.safeSend(botInstance, chatId, 'There was an error processing your message. Please try again.');
  }
}

// Handle callback queries (button presses)
async function handleCallbackQuery(botInstance, context, callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const userId = callbackQuery.from.id;
  const data = callbackQuery.data;
  
  console.log(`🔘 Callback from ${userId} in chat ${chatId}: ${data}`);
  
  try {
    // Always answer callback query first
    await botInstance.answerCallbackQuery(callbackQuery.id);
    
    // Handle main menu
    if (data === 'main_menu') {
      await handlers.showMainMenu(chatId, botInstance, userId, ADMIN_USERS);
      return;
    }
    
    // Handle admin panel
    if (data === 'admin_panel') {
      if (!handlers.isAdmin(userId, ADMIN_USERS)) {
        await handlers.safeSend(botInstance, chatId, 'You are not authorized to access the admin panel.');
        return;
      }
      await handlers.showAdminPanel(chatId, botInstance);
      return;
    }
    
    // Handle assignment posting
    if (data === 'admin_post_assignment') {
      await handlers.startAssignmentCreation(botInstance, chatId, userSessions);
      return;
    }
    
    // Handle post to channel
    if (data.startsWith('post_to_channel_')) {
      const assignmentId = data.replace('post_to_channel_', '');
      await handlers.postAssignmentToChannel(botInstance, chatId, assignmentId, CHANNEL_ID, BOT_USERNAME);
      return;
    }
    
    // Handle assignment views
    if (data === 'view_assignments') {
      await handlers.showAssignments(chatId, botInstance, Assignment, userSessions);
      return;
    }
    
    if (data.startsWith('assignments_page_')) {
      const page = parseInt(data.replace('assignments_page_', ''));
      await handlers.showAssignments(chatId, botInstance, Assignment, userSessions, page);
      return;
    }
    
    // Handle applications
    if (data === 'view_applications') {
      await handlers.showApplications(chatId, botInstance, Assignment, userSessions);
      return;
    }
    
    if (data.startsWith('applications_page_')) {
      const page = parseInt(data.replace('applications_page_', ''));
      await handlers.showApplications(chatId, botInstance, Assignment, userSessions, page);
      return;
    }
    
    // Handle assignment applications
    if (data.startsWith('apply_')) {
      const assignmentId = data.replace('apply_', '');
      await handlers.handleAssignmentApplication(
        botInstance, chatId, userId, assignmentId, 
        Assignment, Tutor, userSessions, ADMIN_USERS
      );
      return;
    }
    
    if (data.startsWith('confirm_apply_')) {
      const assignmentId = data.replace('confirm_apply_', '');
      await handlers.handleConfirmApplication(
        botInstance, chatId, userId, assignmentId, 
        Assignment, Tutor, userSessions
      );
      return;
    }
    
    // Handle profile editing
    if (data === 'profile_edit') {
      const tutor = await Tutor.findOne({ userId: userId });
      if (!tutor) {
        await handlers.safeSend(botInstance, chatId, 'Profile not found. Please start with /start');
        return;
      }
      
      const profileMsg = handlers.formatTutorProfile(tutor);
      await handlers.safeSend(botInstance, chatId, `${profileMsg}\n\nWhat would you like to edit?`, {
        parse_mode: 'Markdown',
        reply_markup: handlers.getMainEditProfileMenu(tutor)
      });
      return;
    }
    
    // Handle personal info editing
    if (data === 'edit_personal_info') {
      const tutor = await Tutor.findOne({ userId: userId });
      await handlers.safeSend(botInstance, chatId, 'Edit Personal Information:', {
        reply_markup: handlers.getPersonalInfoMenu(tutor)
      });
      return;
    }
    
    // Handle specific field edits
    if (data.startsWith('edit_')) {
      await handleFieldEdit(botInstance, chatId, userId, data);
      return;
    }
    
    // Handle toggles (locations, availability, subjects)
    if (data.startsWith('toggle_')) {
      await handleToggle(botInstance, chatId, userId, data);
      return;
    }
    
    // Handle dropdown selections (gender, race, education)
    if (data.startsWith('set_')) {
      await handleSelection(botInstance, chatId, userId, data);
      return;
    }
    
    // Default callback handling
    await handlers.safeSend(botInstance, chatId, 'This action is not yet implemented.');
    
  } catch (error) {
    console.error('❌ Error handling callback query:', error);
    await handlers.safeSend(botInstance, chatId, 'There was an error processing your request. Please try again.');
  }
}

// Handle profile input
async function handleProfileInput(botInstance, chatId, text, context) {
  const userSession = userSessions[chatId];
  const field = userSession.state.replace('awaiting_', '');
  
  try {
    const tutor = await Tutor.findOne({ userId: userSession.userId });
    if (!tutor) {
      await handlers.safeSend(botInstance, chatId, 'Profile not found. Please start again.');
      return;
    }
    
    // Update the field
    tutor[field] = text.trim();
    await tutor.save();
    
    // Clear state
    delete userSession.state;
    delete userSession.userId;
    
    await handlers.safeSend(botInstance, chatId, `✅ ${field} updated successfully!`, {
      reply_markup: handlers.getPersonalInfoMenu(tutor)
    });
    
  } catch (error) {
    console.error('Error updating profile field:', error);
    await handlers.safeSend(botInstance, chatId, 'There was an error updating your profile. Please try again.');
  }
}

// Handle field editing
async function handleFieldEdit(botInstance, chatId, userId, data) {
  try {
    const fieldMappings = {
      'edit_fullName': { field: 'fullName', prompt: 'Enter your full name:' },
      'edit_email': { field: 'email', prompt: 'Enter your email address:' },
      'edit_teaching_levels': () => handlers.getTeachingLevelsMenu,
      'edit_locations': () => handlers.getLocationsMenu,
      'edit_availability': () => handlers.getAvailabilityMenu,
      'edit_hourly_rates': () => handlers.getHourlyRatesMenu,
      'edit_gender_menu': () => handlers.getGenderMenu,
      'edit_race_menu': () => handlers.getRaceMenu,
      'edit_education_menu': () => handlers.getEducationMenu,
    };
    
    const tutor = await Tutor.findOne({ userId: userId });
    if (!tutor) {
      await handlers.safeSend(botInstance, chatId, 'Profile not found.');
      return;
    }
    
    const mapping = fieldMappings[data];
    
    if (typeof mapping === 'function') {
      const menu = mapping()(tutor);
      await handlers.safeSend(botInstance, chatId, 'Please select an option:', { reply_markup: menu });
    } else if (mapping) {
      userSessions[chatId] = { 
        ...userSessions[chatId],
        state: `awaiting_${mapping.field}`,
        userId: userId
      };
      await handlers.safeSend(botInstance, chatId, mapping.prompt);
    } else {
      // Handle subject menus
      if (data === 'edit_primary_subjects') {
        await handlers.safeSend(botInstance, chatId, 'Select Primary subjects you can teach:', {
          reply_markup: handlers.getPrimarySubjectsMenu(tutor)
        });
      } else if (data === 'edit_secondary_subjects') {
        await handlers.safeSend(botInstance, chatId, 'Select Secondary subjects you can teach:', {
          reply_markup: handlers.getSecondarySubjectsMenu(tutor)
        });
      } else if (data === 'edit_jc_subjects') {
        await handlers.safeSend(botInstance, chatId, 'Select JC subjects you can teach:', {
          reply_markup: handlers.getJCSubjectsMenu(tutor)
        });
      } else if (data === 'edit_international_subjects') {
        await handlers.safeSend(botInstance, chatId, 'Select International subjects you can teach:', {
          reply_markup: handlers.getInternationalSubjectsMenu(tutor)
        });
      }
    }
    
  } catch (error) {
    console.error('Error handling field edit:', error);
    await handlers.safeSend(botInstance, chatId, 'There was an error. Please try again.');
  }
}

// Handle toggles
async function handleToggle(botInstance, chatId, userId, data) {
  try {
    const tutor = await Tutor.findOne({ userId: userId });
    if (!tutor) {
      await handlers.safeSend(botInstance, chatId, 'Profile not found.');
      return;
    }
    
    // Parse toggle data
    if (data.startsWith('toggle_location_')) {
      const location = data.replace('toggle_location_', '');
      handlers.initializeLocations(tutor);
      tutor.locations[location] = !tutor.locations[location];
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, 'Location preference updated!', {
        reply_markup: handlers.getLocationsMenu(tutor)
      });
      
    } else if (data.startsWith('toggle_availability_')) {
      const slot = data.replace('toggle_availability_', '');
      handlers.initializeAvailability(tutor);
      tutor.availableTimeSlots[slot] = !tutor.availableTimeSlots[slot];
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, 'Availability updated!', {
        reply_markup: handlers.getAvailabilityMenu(tutor)
      });
      
    } else if (data.startsWith('toggle_primary_')) {
      const subject = data.replace('toggle_primary_', '');
      handlers.initializeTeachingLevels(tutor);
      tutor.teachingLevels.primary[subject] = !tutor.teachingLevels.primary[subject];
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, 'Subject preference updated!', {
        reply_markup: handlers.getPrimarySubjectsMenu(tutor)
      });
      
    } else if (data.startsWith('toggle_secondary_')) {
      const subject = data.replace('toggle_secondary_', '');
      handlers.initializeTeachingLevels(tutor);
      tutor.teachingLevels.secondary[subject] = !tutor.teachingLevels.secondary[subject];
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, 'Subject preference updated!', {
        reply_markup: handlers.getSecondarySubjectsMenu(tutor)
      });
      
    } else if (data.startsWith('toggle_jc_')) {
      const subject = data.replace('toggle_jc_', '');
      handlers.initializeTeachingLevels(tutor);
      tutor.teachingLevels.jc[subject] = !tutor.teachingLevels.jc[subject];
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, 'Subject preference updated!', {
        reply_markup: handlers.getJCSubjectsMenu(tutor)
      });
      
    } else if (data.startsWith('toggle_international_')) {
      const subject = data.replace('toggle_international_', '');
      handlers.initializeTeachingLevels(tutor);
      tutor.teachingLevels.international[subject] = !tutor.teachingLevels.international[subject];
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, 'Subject preference updated!', {
        reply_markup: handlers.getInternationalSubjectsMenu(tutor)
      });
    }
    
  } catch (error) {
    console.error('Error handling toggle:', error);
    await handlers.safeSend(botInstance, chatId, 'There was an error updating your preference. Please try again.');
  }
}

// Handle selections
async function handleSelection(botInstance, chatId, userId, data) {
  try {
    const tutor = await Tutor.findOne({ userId: userId });
    if (!tutor) {
      await handlers.safeSend(botInstance, chatId, 'Profile not found.');
      return;
    }
    
    if (data.startsWith('set_gender_')) {
      const gender = data.replace('set_gender_', '');
      tutor.gender = gender.charAt(0).toUpperCase() + gender.slice(1);
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, `✅ Gender set to ${tutor.gender}`, {
        reply_markup: handlers.getPersonalInfoMenu(tutor)
      });
      
    } else if (data.startsWith('set_race_')) {
      const race = data.replace('set_race_', '');
      tutor.race = race.charAt(0).toUpperCase() + race.slice(1);
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, `✅ Race set to ${tutor.race}`, {
        reply_markup: handlers.getPersonalInfoMenu(tutor)
      });
      
    } else if (data.startsWith('set_education_')) {
      const education = data.replace('set_education_', '');
      const educationMap = {
        'alevels': 'A Levels',
        'diploma': 'Diploma',
        'degree': 'Degree',
        'masters': 'Masters',
        'phd': 'PhD',
        'others': 'Others'
      };
      tutor.highestEducation = educationMap[education] || education;
      await tutor.save();
      
      await handlers.safeSend(botInstance, chatId, `✅ Education set to ${tutor.highestEducation}`, {
        reply_markup: handlers.getPersonalInfoMenu(tutor)
      });
    }
    
  } catch (error) {
    console.error('Error handling selection:', error);
    await handlers.safeSend(botInstance, chatId, 'There was an error updating your selection. Please try again.');
  }
}

// Main webhook handler function
export default async function handler(req, res) {
  try {
    // Only handle POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    console.log('🌐 Webhook triggered');
    
    // Connect to database
    await connectToDatabase();
    
    // Get bot instance
    const botInstance = getBot();
    
    // Parse update
    const update = req.body;
    
    // Create context object
    const context = {
      Tutor,
      Assignment,
      userSessions,
      ADMIN_USERS,
      CHANNEL_ID,
      BOT_USERNAME
    };
    
    // Handle the update
    await handleUpdate(botInstance, context, update);
    
    return res.status(200).json({ ok: true });
    
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}