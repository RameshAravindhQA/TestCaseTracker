// Lottie animations configuration
const LOTTIE_ANIMATIONS = {
  // Basic animations
  loading: "/lottie/Rocket lottie Animation_1752294834959.json",
  success: "/lottie/Business team_1752294842244.json",
  error: "/lottie/Software development Scene_1752294837517.json",
  info: "/lottie/Office worker team work hello office waves_1752294845673.json",
  warning: "/lottie/Female 05_1752294849174.json",

  // Profile and character animations
  profile: "/lottie/Profile Avatar of Young Boy_1752294847420.json",
  female: "/lottie/Female 05_1752294849174.json",
  business: "/lottie/Business team_1752294842244.json",
  office: "/lottie/Office worker team work hello office waves_1752294845673.json",
  rocket: "/lottie/Rocket lottie Animation_1752294834959.json",

  // CRUD operations
  createAction: "/lottie/Business team_1752294842244.json",
  editAction: "/lottie/Office worker team work hello office waves_1752294845673.json",
  updateAction: "/lottie/Software development Scene_1752294837517.json",
  deleteAction: "/lottie/Female 05_1752294849174.json",
  search: "/lottie/Profile Avatar of Young Boy_1752294847420.json",
};

// Animation utility functions
export const getRandomAnimation = (category?: keyof typeof LOTTIE_ANIMATIONS) => {
  if (category && LOTTIE_ANIMATIONS[category]) {
    return LOTTIE_ANIMATIONS[category];
  }

  const animations = Object.values(LOTTIE_ANIMATIONS);
  return animations[Math.floor(Math.random() * animations.length)];
};

// Export the main animations object
export { LOTTIE_ANIMATIONS };

// Default export for backward compatibility
export default LOTTIE_ANIMATIONS;

// Individual animation exports for convenience
export const {
  loading,
  success,
  error,
  info,
  warning,
  profile,
  female,
  business,
  office,
  rocket,
  createAction,
  editAction,
  updateAction,
  deleteAction,
  search
} = LOTTIE_ANIMATIONS;