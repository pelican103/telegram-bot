import mongoose from 'mongoose';

// Define Assignment Schema
const assignmentSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true
  },
  description: String,
  
  // Academic Information
  level: {
    type: String,
    required: true,
    enum: [
      // Primary levels
      'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
      // Secondary levels  
      'Secondary 1', 'Secondary 2', 'Secondary 3', 'Secondary 4', 'Secondary 5',
      // JC levels
      'JC 1', 'JC 2',
      // Other levels
      'Polytechnic', 'University', 'Adult Learning'
    ]
  },
  
  frequency: {
    type: String,
    required: true,
    enum: [
      'Once a week',
      'Twice a week', 
      '3 times a week',
      '4 times a week',
      '5 times a week',
      'Daily',
      'Flexible'
    ]
  },
  
  startDate: {
    type: Date,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  
  // Location and Schedule
  location: {
    type: String,
    required: true
  },
  preferredTiming: {
    weekdayMorning: Boolean,
    weekdayAfternoon: Boolean,
    weekdayEvening: Boolean,
    weekendMorning: Boolean,
    weekendAfternoon: Boolean,
    weekendEvening: Boolean
  },
  duration: {
    type: String,
    required: true
  },
  
  // Rate Information
  rate: {
    type: String,
    required: true
  },
  rateType: {
    type: String,
    enum: ['hour', 'session', 'month'],
    default: 'hour'
  },
  
  // Student Information
  studentGender: {
    type: String,
    enum: ['Male', 'Female', 'Any'],
    default: 'Any'
  },
  studentCount: {
    type: Number,
    default: 1
  },
  
  // Tutor Requirements
  tutorRequirements: {
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Any'],
      default: 'Any'
    },
    race: {
      type: String,
      enum: ['Chinese', 'Malay', 'Indian', 'Eurasian', 'Any'],
      default: 'Any'
    },
    experience: {
      type: String,
      enum: ['None', '1-2 years', '3-5 years', '5+ years'],
      default: 'None'
    },
    qualifications: {
      type: String,
      enum: ['O Levels', 'A Levels', 'Diploma', 'Degree', 'Masters', 'PhD', 'Any'],
      default: 'Any'
    }
  },
  
  // Additional Details
  additionalDetails: String,
  notes: String,
  
  // Status and Dates
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Filled', 'Closed'],
    default: 'Open'
  },
  startDate: Date,
  deadline: Date,
  
  // Applications
  applicants: [{
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tutor'
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected'],
      default: 'Pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    acceptedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    contactDetails: String,
    notes: String
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  channelMessageId: { type: Number }
});

// Add middleware to update the updatedAt timestamp
assignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;