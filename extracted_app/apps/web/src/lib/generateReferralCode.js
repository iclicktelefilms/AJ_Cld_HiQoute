import pb from '@/lib/pocketbaseClient';

export const generateReferralCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      // Check if code exists
      await pb.collection('users').getFirstListItem(`referralCode="${code}"`, { $autoCancel: false });
      // If it succeeds, the code exists, so we loop again
    } catch (error) {
      // If it fails with 404, the code is unique
      if (error.status === 404) {
        isUnique = true;
      } else {
        // Some other error occurred, throw it
        throw error;
      }
    }
  }

  return code;
};