// utils/menus.js

import { getTick } from './helpers.js';

export function getTeachingLevelMenu(tutor) {
  const levels = tutor.teachingLevels || {};
  return {
    inline_keyboard: [
      [{ text: `${getTick(levels.primary)} Primary`, callback_data: 'toggle_primary' }],
      [{ text: `${getTick(levels.secondary)} Secondary`, callback_data: 'toggle_secondary' }],
      [{ text: `${getTick(levels.jc)} JC`, callback_data: 'toggle_jc' }],
      [{ text: `${getTick(levels.ib)} IB`, callback_data: 'toggle_ib' }],
      [{ text: `${getTick(levels.others)} Others`, callback_data: 'toggle_others' }],
      [{ text: 'Back', callback_data: 'profile_edit' }]
    ]
  };
}

export function getAvailabilityMenu(tutor) {
  const avail = tutor.availability || {};
  return {
    inline_keyboard: [
      [{ text: `${getTick(avail.weekdays)} Weekdays`, callback_data: 'toggle_weekdays' }],
      [{ text: `${getTick(avail.weekends)} Weekends`, callback_data: 'toggle_weekends' }],
      [{ text: `${getTick(avail.mornings)} Mornings`, callback_data: 'toggle_mornings' }],
      [{ text: `${getTick(avail.afternoons)} Afternoons`, callback_data: 'toggle_afternoons' }],
      [{ text: `${getTick(avail.evenings)} Evenings`, callback_data: 'toggle_evenings' }],
      [{ text: 'Back', callback_data: 'profile_edit' }]
    ]
  };
}

export function getEditProfileMenu(tutor) {
  return {
    inline_keyboard: [
      [{ text: 'Name', callback_data: 'edit_fullName' }],
      [{ text: 'Contact', callback_data: 'edit_contactNumber' }],
      [{ text: 'Email', callback_data: 'edit_email' }],
      [{ text: 'Gender', callback_data: 'set_gender_menu' }],
      [{ text: 'Race', callback_data: 'set_race_menu' }],
      [{ text: 'Education', callback_data: 'set_education_menu' }],
      [{ text: 'Teaching Levels', callback_data: 'edit_teachingLevels' }],
      [{ text: 'Subjects', callback_data: 'edit_subjects' }],
      [{ text: 'Availability', callback_data: 'edit_availability' }],
      [{ text: 'Location', callback_data: 'edit_location' }],
      [{ text: 'Hourly Rate', callback_data: 'edit_hourlyRate' }],
      [{ text: 'Done Editing', callback_data: 'profile_confirm' }]
    ]
  };
}

export function getGenderMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Male', callback_data: 'set_gender_male' }],
      [{ text: 'Female', callback_data: 'set_gender_female' }],
      [{ text: 'Other', callback_data: 'set_gender_other' }],
      [{ text: 'Back', callback_data: 'profile_edit' }]
    ]
  };
}

export function getRaceMenu() {
  return {
    inline_keyboard: [
      [{ text: 'Chinese', callback_data: 'set_race_chinese' }],
      [{ text: 'Malay', callback_data: 'set_race_malay' }],
      [{ text: 'Indian', callback_data: 'set_race_indian' }],
      [{ text: 'Others', callback_data: 'set_race_others' }],
      [{ text: 'Back', callback_data: 'profile_edit' }]
    ]
  };
}

export function getHighestEducationMenu() {
  return {
    inline_keyboard: [
      [{ text: 'A Levels', callback_data: 'set_education_alevels' }],
      [{ text: 'Diploma', callback_data: 'set_education_diploma' }],
      [{ text: 'Degree', callback_data: 'set_education_degree' }],
      [{ text: 'Masters', callback_data: 'set_education_masters' }],
      [{ text: 'PhD', callback_data: 'set_education_phd' }],
      [{ text: 'Others', callback_data: 'set_education_others' }],
      [{ text: 'Back', callback_data: 'profile_edit' }]
    ]
  };
}
