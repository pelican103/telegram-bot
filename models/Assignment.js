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
  frequency: {
    type: String,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  
  // Rate Information
  rate: {
    type: String,
    required: true
  },
  
  // Requirements
  requirements: String,
  
  // Status
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Filled', 'Closed'],
    default: 'Open'
  },
  
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