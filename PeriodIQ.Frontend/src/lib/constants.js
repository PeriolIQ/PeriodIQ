export const FITNESS_LEVELS = [
  { value: 'Beginner', labelKey: 'constants.levels.beginner' },
  { value: 'Intermediate', labelKey: 'constants.levels.intermediate' },
  { value: 'Advanced', labelKey: 'constants.levels.advanced' }
];

export const GOALS = [
  { value: 'Strength', labelKey: 'constants.goals.strength' },
  { value: 'Hypertrophy', labelKey: 'constants.goals.hypertrophy' },
  { value: 'Endurance', labelKey: 'constants.goals.endurance' },
  { value: 'Weight Loss', labelKey: 'constants.goals.weight_loss' },
  { value: 'Fat Loss', labelKey: 'constants.goals.fat_loss' },
  { value: 'General Fitness', labelKey: 'constants.goals.fitness' }
];

export const EQUIPMENT = [
  { value: 'Barbell', labelKey: 'constants.equip.barbell' },
  { value: 'Dumbbell', labelKey: 'constants.equip.dumbbell' },
  { value: 'Machine', labelKey: 'constants.equip.machine' },
  { value: 'Bodyweight', labelKey: 'constants.equip.bodyweight' }
];

export const LIMITATIONS = [
  { value: 'lower_back_fatigue', labelKey: 'constants.limits.lower_back' },
  { value: 'shoulder_pain', labelKey: 'constants.limits.shoulder' },
  { value: 'knee_pain', labelKey: 'constants.limits.knee' },
];

export const getLabel = (t, array, value) => {
  const item = array.find(item => item.value === value);
  return item ? t(item.labelKey) : value;
};
