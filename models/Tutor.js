import mongoose from 'mongoose';

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
  userId: Number,   
  chatId: Number, 
  
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

export default Tutor;