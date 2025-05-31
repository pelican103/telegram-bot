import mongoose from 'mongoose';

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

export default Assignment;