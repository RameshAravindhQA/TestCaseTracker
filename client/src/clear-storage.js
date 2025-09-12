
// Clear problematic localStorage data
console.log('Clearing localStorage...');
localStorage.removeItem('hasSeenWelcome');
localStorage.removeItem('hasCompletedOnboarding');
localStorage.removeItem('tutorialState');
localStorage.removeItem('showWelcome');
localStorage.removeItem('onboardingComplete');
console.log('localStorage cleared');
