export default function registerHandlers(bot, context) {
    const {
      Tutor,
      Assignment,
      userSessions,
      ADMIN_USERS,
      adminPostingSessions,
      CHANNEL_ID,
    } = context;
  
    // === START COMMAND ===
    bot.onText(/\/(start|help)/, (msg) => {
      const welcomeText = `Hello ${msg.from.first_name}!\nWelcome to Lion City Tutors.\n\nTo register as a tutor, type /register.\nTo view assignments, type /assignments.`;
      bot.sendMessage(msg.chat.id, welcomeText);
    });
  
    // === REGISTER COMMAND ===
    bot.onText(/\/register/, (msg) => {
      const chatId = msg.chat.id;
      userSessions[chatId] = { step: 'fullName', data: {} };
      bot.sendMessage(chatId, "Let's start your tutor registration! What is your full name?");
    });
  
    // === ASSIGNMENTS COMMAND ===
    bot.onText(/\/assignments/, async (msg) => {
      const chatId = msg.chat.id;
      try {
        const assignments = await Assignment.find({ status: 'Open' }).sort({ createdAt: -1 }).limit(10);
        
        if (assignments.length === 0) {
          bot.sendMessage(chatId, 'No open assignments available at the moment.');
          return;
        }
  
        let message = '📚 *Open Assignments:*\n\n';
        assignments.forEach((assignment, index) => {
          message += `${index + 1}. *${assignment.title}*\n`;
          message += `Level: ${assignment.level}\n`;
          message += `Subject: ${assignment.subject}\n`;
          message += `Location: ${assignment.location}\n`;
          message += `Rate: ${assignment.rate}\n`;
          message += `Start Date: ${assignment.startDate}\n\n`;
        });
  
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } catch (error) {
        console.error('Error fetching assignments:', error);
        bot.sendMessage(chatId, 'Sorry, there was an error fetching assignments. Please try again later.');
      }
    });
  
    // === HANDLE REGISTRATION FLOW ===
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
  
      if (!userSessions[chatId] || msg.text.startsWith('/')) return;
  
      const session = userSessions[chatId];
      const step = session.step;
      const data = session.data;
  
      switch (step) {
        case 'fullName':
          data.fullName = msg.text;
          session.step = 'contactNumber';
          bot.sendMessage(chatId, 'What is your contact number?');
          break;
        case 'contactNumber':
          data.contactNumber = msg.text;
          session.step = 'email';
          bot.sendMessage(chatId, 'What is your email address?');
          break;
        case 'email':
          data.email = msg.text;
          data.telegramChatId = chatId;
  
          const newTutor = new Tutor(data);
          await newTutor.save();
  
          bot.sendMessage(chatId, '✅ Registration complete! We will contact you when suitable assignments are available.');
          delete userSessions[chatId];
          break;
      }
    });
  
    // === ADMIN: POST ASSIGNMENT ===
    bot.onText(/\/post/, (msg) => {
      const chatId = msg.chat.id;
      if (!ADMIN_USERS.includes(String(msg.from.id))) {
        return bot.sendMessage(chatId, '🚫 You are not authorized to post assignments.');
      }
  
      adminPostingSessions[chatId] = { step: 'title', data: {} };
      bot.sendMessage(chatId, "Let's post a new assignment! What is the assignment title?");
    });
  
    // === HANDLE ADMIN POSTING FLOW ===
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
  
      if (!adminPostingSessions[chatId] || msg.text.startsWith('/')) return;
  
      const session = adminPostingSessions[chatId];
      const step = session.step;
      const data = session.data;
  
      switch (step) {
        case 'title':
          data.title = msg.text;
          session.step = 'description';
          bot.sendMessage(chatId, 'Please provide a brief description of the assignment.');
          break;
        case 'description':
          data.description = msg.text;
          session.step = 'level';
          bot.sendMessage(chatId, 'What level is the assignment for? (e.g. Primary, Secondary, JC)');
          break;
        case 'level':
          data.level = msg.text;
          session.step = 'subject';
          bot.sendMessage(chatId, 'What subject is it for?');
          break;
        case 'subject':
          data.subject = msg.text;
          session.step = 'location';
          bot.sendMessage(chatId, 'Where is the assignment located?');
          break;
        case 'location':
          data.location = msg.text;
          session.step = 'rate';
          bot.sendMessage(chatId, 'What is the hourly rate?');
          break;
        case 'rate':
          data.rate = msg.text;
          session.step = 'frequency';
          bot.sendMessage(chatId, 'What is the lesson frequency (e.g. twice a week)?');
          break;
        case 'frequency':
          data.frequency = msg.text;
          session.step = 'startDate';
          bot.sendMessage(chatId, 'When is the preferred start date?');
          break;
        case 'startDate':
          data.startDate = msg.text;
          session.step = 'requirements';
          bot.sendMessage(chatId, 'Any additional requirements?');
          break;
        case 'requirements':
          data.requirements = msg.text;
  
          const assignment = new Assignment(data);
          await assignment.save();
  
          const caption = `📚 *New Assignment!*
  
  *Title:* ${assignment.title}
  *Level:* ${assignment.level}
  *Subject:* ${assignment.subject}
  *Location:* ${assignment.location}
  *Rate:* ${assignment.rate}
  *Start Date:* ${assignment.startDate}
  *Requirements:* ${assignment.requirements}`;
  
          await bot.sendMessage(CHANNEL_ID, caption, { parse_mode: 'Markdown' });
  
          bot.sendMessage(chatId, '✅ Assignment posted successfully!');
          delete adminPostingSessions[chatId];
          break;
      }
    });
  }