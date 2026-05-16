import { useState } from 'react';

export const useFirstTimeUser = () => {
  // Hardcoded to false to completely disable the special first-time user flow
  // This ensures users go straight to the normal dashboard and standard quotation creation
  const [isFirstTime] = useState(false);
  const [loading] = useState(false);

  const markOnboardingComplete = async () => {
    // No-op since onboarding flow is disabled
    return Promise.resolve();
  };

  return { isFirstTime, loading, markOnboardingComplete };
};