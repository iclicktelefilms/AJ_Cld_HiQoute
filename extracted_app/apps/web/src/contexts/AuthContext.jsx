import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { generateReferralCode } from '@/lib/generateReferralCode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDirectLogin, setIsDirectLogin] = useState(false);
  const [originalAdminToken, setOriginalAdminToken] = useState(null);
  const [originalAdminModel, setOriginalAdminModel] = useState(null);

  useEffect(() => {
    setCurrentUser(pb.authStore.model);
    setLoading(false);

    const unsubscribe = pb.authStore.onChange(() => {
      setCurrentUser(pb.authStore.model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let unsubscribe;
    
    const initRealtimeUserTracking = async () => {
      if (currentUser?.id) {
        try {
          unsubscribe = await pb.collection('users').subscribe(currentUser.id, async (e) => {
            if (e.action === 'update') {
              const oldPlanId = currentUser.plan_id;
              const newPlanId = e.record.plan_id;
              
              if (newPlanId && newPlanId !== oldPlanId) {
                try {
                  const planData = await pb.collection('plans').getOne(newPlanId, { $autoCancel: false });
                  const isTrial = planData?.name?.toLowerCase().includes('trial') || planData?.price === 0;
                  
                  if (planData && !isTrial) {
                    const pendingReferrals = await pb.collection('referrals').getList(1, 1, {
                      filter: `referred_user_id="${currentUser.id}" && status="pending"`,
                      $autoCancel: false
                    });
                    
                    if (pendingReferrals.items.length > 0) {
                      const referral = pendingReferrals.items[0];
                      await pb.collection('referrals').update(referral.id, {
                        status: 'completed',
                        reward_given: true,
                        completed_at: new Date().toISOString(),
                        upgraded_users_count: (referral.upgraded_users_count || 0) + 1,
                        earned_days_total: (referral.earned_days_total || 0) + 30
                      }, { $autoCancel: false });
                    }
                  }
                } catch (err) {
                  console.warn('Plan fetch failed during upgrade check:', err);
                }
              }
              
              setCurrentUser(e.record);
            }
          });
        } catch (err) {
          console.warn('Could not subscribe to users collection for realtime updates');
        }
      }
    };
    
    initRealtimeUserTracking();

    return () => {
      if (unsubscribe) {
        pb.collection('users').unsubscribe(currentUser?.id).catch(() => {});
      }
    };
  }, [currentUser?.id, currentUser?.plan_id]);

  const getReferralLink = () => {
    if (!currentUser) return '';
    return `${window.location.origin}/signup?ref=${currentUser.referralCode || currentUser.id}`;
  };

  const login = async (email, password) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const authData = await pb.collection('users').authWithPassword(normalizedEmail, password, { $autoCancel: false });
      setCurrentUser(authData.record);
      return { success: true, user: authData.record };
    } catch (error) {
      return { 
        success: false, 
        error: { 
          type: 'auth_failed', 
          message: 'Invalid email or password' 
        } 
      };
    }
  };

  const checkEmailForReset = async (email) => {
    try {
      const result = await pb.collection('users').getList(1, 1, { 
        filter: `email="${email}"`, 
        $autoCancel: false 
      });
      if (result.totalItems === 0) {
        return { type: 'email_not_found', message: 'No account found with this email' };
      }
      return { type: 'email_found' };
    } catch (error) {
      return { type: 'email_not_found', message: 'No account found with this email' };
    }
  };

  const sendOTP = async (email) => {
    try {
      const result = await pb.collection('users').requestOTP(email);
      return { success: true, otpId: result.otpId };
    } catch (error) {
      return { success: false, error: { type: 'general', message: error.message } };
    }
  };

  const verifyOTP = async (otpId, code) => {
    try {
      if (!code || !/^\d{4}$/.test(code)) {
        return { 
          success: false, 
          error: { 
            type: 'invalid_code', 
            message: 'OTP code must be exactly 4 digits' 
          } 
        };
      }

      const authData = await pb.collection('users').authWithOTP(otpId, code);
      await pb.collection('users').update(authData.record.id, { verified: true }, { $autoCancel: false });
      setCurrentUser(authData.record);
      return { success: true, record: authData.record };
    } catch (error) {
      return { success: false, error: { type: 'general', message: 'Invalid or expired OTP code' } };
    }
  };

  const checkMobileNumberExists = async (mobileNumber) => {
    try {
      const result = await pb.collection('users').getList(1, 1, {
        filter: `phone="${mobileNumber}"`,
        $autoCancel: false
      });
      return result.totalItems > 0;
    } catch (error) {
      console.error("Error checking mobile number:", error);
      return false; 
    }
  };

  const signup = async (userData) => {
    try {
      try {
        const emailCheck = await pb.collection('users').getList(1, 1, { 
          filter: `email="${userData.email}"`, 
          $autoCancel: false 
        });
        if (emailCheck.totalItems > 0) {
          return { success: false, error: { type: 'email_exists', message: 'Email already registered' } };
        }
      } catch (e) {}

      try {
        const phoneCheck = await pb.collection('users').getList(1, 1, { 
          filter: `phone="${userData.phone}"`, 
          $autoCancel: false 
        });
        if (phoneCheck.totalItems > 0) {
          return { success: false, error: { type: 'phone_exists', message: 'This mobile number is already registered. Please use a different number or login.' } };
        }
      } catch (e) {}

      let validReferrerId = null;

      if (userData.referrerCode && userData.referrerCode.trim() !== '') {
        try {
          const lookupRecord = await pb.collection('referral_lookup').getFirstListItem('referralCode="' + userData.referrerCode.trim() + '"', {
            $autoCancel: false
          });
          validReferrerId = lookupRecord.user;
        } catch (err) {
          return { success: false, error: { type: 'invalid_referral', message: 'Invalid referral code' } };
        }
      }

      const newReferralCode = await generateReferralCode();

      const data = {
        email: userData.email,
        password: userData.password,
        passwordConfirm: userData.passwordConfirm || userData.password,
        full_name: userData.full_name,
        name: userData.full_name,
        phone: userData.phone,
        business_name: userData.business_name || '',
        address: userData.address || '',
        location: userData.address || '',
        instagramProfile: userData.instagramProfile || '',
        role: 'photographer',
        referralCode: newReferralCode,
        status: 'active',
        verified: false,
        onboarding_completed: false,
        ...(validReferrerId && { referredBy: validReferrerId })
      };

      const newUser = await pb.collection('users').create(data, { $autoCancel: false });
      
      if (validReferrerId) {
        await pb.collection('referrals').create({
          referrer_id: validReferrerId,
          referred_user_id: newUser.id,
          status: 'pending',
          reward_given: false,
          registered_users_count: 1,
          upgraded_users_count: 0,
          earned_days_total: 0
        }, { $autoCancel: false });
      }

      try {
        const defaultPlans = await pb.collection('plans').getList(1, 1, { 
          filter: 'is_default=true && status="active"', 
          $autoCancel: false 
        });
        
        if (defaultPlans.items.length > 0) {
          const defaultPlan = defaultPlans.items[0];
          const expiryDate = new Date();
          
          let durationDays = 15;
          const durationMatch = defaultPlan.description?.match(/\nDuration: (\d+) days/);
          if (durationMatch) {
            durationDays = parseInt(durationMatch[1], 10);
          }
          
          expiryDate.setDate(expiryDate.getDate() + durationDays);

          await pb.collection('user_plans').create({
            user_id: newUser.id,
            plan_id: defaultPlan.id,
            assigned_date: new Date().toISOString(),
            expiry_date: expiryDate.toISOString()
          }, { $autoCancel: false });

          await pb.collection('users').update(newUser.id, {
            plan_id: defaultPlan.id
          }, { $autoCancel: false });
        }
      } catch (planErr) {
        console.error('Failed to assign default plan:', planErr);
      }

      return { success: true, user: newUser };
    } catch (error) {
      if (error.response?.data?.email?.code === 'validation_not_unique') {
        return { success: false, error: { type: 'email_exists', message: 'Email already registered' } };
      }
      if (error.response?.data?.phone?.code === 'validation_not_unique') {
        return { success: false, error: { type: 'phone_exists', message: 'This mobile number is already registered. Please use a different number or login.' } };
      }
      return { success: false, error: { type: 'general', message: error.message } };
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    setIsDirectLogin(false);
    setOriginalAdminToken(null);
    setOriginalAdminModel(null);
  };

  const directLoginAsUser = async (userId) => {
    try {
      setOriginalAdminToken(pb.authStore.token);
      setOriginalAdminModel(pb.authStore.model);
      
      const userRecord = await pb.collection('users').getOne(userId, { $autoCancel: false });
      
      pb.authStore.save(pb.authStore.token, userRecord);
      
      setIsDirectLogin(true);
      setCurrentUser(userRecord);
      return { success: true };
    } catch (error) {
      console.error("Direct login failed:", error);
      return { success: false, error: { type: 'general', message: error.message } };
    }
  };

  const switchBackToAdmin = () => {
    if (originalAdminToken && originalAdminModel) {
      pb.authStore.save(originalAdminToken, originalAdminModel);
      setIsDirectLogin(false);
      setCurrentUser(originalAdminModel);
      setOriginalAdminToken(null);
      setOriginalAdminModel(null);
      return true;
    }
    return false;
  };
  
  const upgradePlan = async (planId) => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };
    try {
      const userPlans = await pb.collection('user_plans').getList(1, 1, {
        filter: `user_id="${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });

      let currentExpiry = new Date();
      let userPlanId = null;

      if (userPlans.items.length > 0) {
        const plan = userPlans.items[0];
        userPlanId = plan.id;
        if (plan.expiry_date && new Date(plan.expiry_date) > new Date()) {
          currentExpiry = new Date(plan.expiry_date);
        }
        currentExpiry.setDate(currentExpiry.getDate() + 30);
        await pb.collection('user_plans').update(userPlanId, {
          expiry_date: currentExpiry.toISOString(),
          plan_id: planId
        }, { $autoCancel: false });
      } else {
        currentExpiry.setDate(currentExpiry.getDate() + 30);
        await pb.collection('user_plans').create({
          user_id: currentUser.id,
          plan_id: planId,
          assigned_date: new Date().toISOString(),
          expiry_date: currentExpiry.toISOString()
        }, { $autoCancel: false });
      }

      await pb.collection('users').update(currentUser.id, { plan_id: planId }, { $autoCancel: false });

      const referrals = await pb.collection('referrals').getList(1, 1, {
        filter: `referred_user_id="${currentUser.id}" && status="pending"`,
        $autoCancel: false
      });

      if (referrals.items.length > 0) {
        const referral = referrals.items[0];
        const referrerId = referral.referrer_id;

        const referrerPlans = await pb.collection('user_plans').getList(1, 1, {
          filter: `user_id="${referrerId}"`,
          sort: '-created',
          $autoCancel: false
        });

        if (referrerPlans.items.length > 0) {
          const rPlan = referrerPlans.items[0];
          let rExpiry = new Date();
          if (rPlan.expiry_date && new Date(rPlan.expiry_date) > new Date()) {
            rExpiry = new Date(rPlan.expiry_date);
          }
          rExpiry.setDate(rExpiry.getDate() + 30);
          
          await pb.collection('user_plans').update(rPlan.id, {
            expiry_date: rExpiry.toISOString()
          }, { $autoCancel: false });
        }

        await pb.collection('referrals').update(referral.id, {
          status: 'completed',
          reward_given: true,
          completed_at: new Date().toISOString(),
          upgraded_users_count: (referral.upgraded_users_count || 0) + 1,
          earned_days_total: (referral.earned_days_total || 0) + 30
        }, { $autoCancel: false });
      }

      await pb.collection('users').authRefresh();
      return { success: true, message: 'Plan upgraded successfully!' };
    } catch (error) {
      console.error('Error upgrading plan:', error);
      return { success: false, message: error.message };
    }
  };

  const getReferralMetrics = async (userId) => {
    try {
      const registeredUsers = await pb.collection('users').getList(1, 500, {
        filter: `referredBy="${userId}" && status="active"`,
        $autoCancel: false
      });
      
      const upgradedUsers = await pb.collection('users').getList(1, 500, {
        filter: `referredBy="${userId}" && plan_id != ""`,
        expand: 'plan_id',
        $autoCancel: false
      });
      
      const validUpgraded = upgradedUsers.items.filter(u => {
        const plan = u.expand?.plan_id;
        return plan && !plan.name.toLowerCase().includes('trial') && plan.price > 0;
      });
      
      const registeredCount = registeredUsers.totalItems;
      const upgradedCount = validUpgraded.length;
      
      const daysEarned = (registeredCount * 30) + (upgradedCount * 30);
      
      return {
        registered: registeredCount,
        upgraded: upgradedCount,
        earnedDays: daysEarned
      };
    } catch (error) {
      console.error("Error fetching referral metrics:", error);
      return { registered: 0, upgraded: 0, earnedDays: 0 };
    }
  };

  const value = {
    currentUser,
    role: currentUser?.role || 'photographer',
    isSuperAdmin: currentUser?.role === 'super_admin' || currentUser?.is_super_admin,
    login,
    sendOTP,
    verifyOTP,
    signup,
    logout,
    loading,
    isAuthenticated: !!currentUser,
    isDirectLogin,
    directLoginAsUser,
    switchBackToAdmin,
    checkMobileNumberExists,
    checkEmailForReset,
    upgradePlan,
    getReferralLink,
    getReferralMetrics
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};