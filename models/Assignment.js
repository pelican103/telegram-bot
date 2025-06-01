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
    enum: ['Primary', 'Secondary', 'JC', 'International'],
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
  frequency: {
    type: String,
    enum: ['Once', 'Twice', 'Thrice', 'More than 3 times'],
    required: true
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