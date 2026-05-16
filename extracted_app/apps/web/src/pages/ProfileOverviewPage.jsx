import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import AppScaffold from '@/components/m3/AppScaffold';
import AppButton from '@/components/m3/AppButton';
import { User, MapPin, Phone, Briefcase, Mail, Edit2 } from 'lucide-react';

const ProfileOverviewPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchUser();
    }
  }, [currentUser]);

  const fetchUser = async () => {
    try {
      const record = await pb.collection('users').getOne(currentUser.id, { $autoCancel: false });
      setUser(record);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () => {
    if (!user) return null;
    if (user.profile_picture) return pb.files.getUrl(user, user.profile_picture);
    if (user.avatar) return pb.files.getUrl(user, user.avatar);
    return null;
  };

  if (loading) {
    return (
      <AppScaffold title="Profile Overview">
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-[#ff3131] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppScaffold>
    );
  }

  const avatarUrl = getAvatarUrl();
  const displayName = user?.full_name || user?.name || 'Photographer';

  return (
    <>
      <Helmet>
        <title>Profile Overview - Pixora Studio</title>
      </Helmet>

      <AppScaffold title="Profile Overview">
        <div className="max-w-2xl mx-auto w-full pb-24 md:pb-12 animate-in fade-in duration-300">
          
          <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-[#f5f5f5] border-4 border-white shadow-md flex-shrink-0 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-[#666666]">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left w-full">
                <h2 className="text-2xl font-bold text-black mb-1">{displayName}</h2>
                <p className="text-sm text-[#666666] mb-4">{user?.email}</p>
                
                <AppButton 
                  variant="filled" 
                  className="w-full sm:w-auto py-3 px-8 text-base font-bold h-auto shadow-md"
                  onClick={() => navigate('/profile/edit')}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </AppButton>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#e0e0e0] rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-black mb-6 border-b border-[#e0e0e0] pb-3">Personal Information</h3>
            
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f5f5f5] rounded-lg text-[#666666]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#666666] font-medium uppercase tracking-wider">Full Name</p>
                  <p className="text-base font-medium text-black">{user?.full_name || user?.name || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f5f5f5] rounded-lg text-[#666666]">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#666666] font-medium uppercase tracking-wider">Business Name</p>
                  <p className="text-base font-medium text-black">{user?.business_name || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f5f5f5] rounded-lg text-[#666666]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#666666] font-medium uppercase tracking-wider">Email Address</p>
                  <p className="text-base font-medium text-black">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f5f5f5] rounded-lg text-[#666666]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#666666] font-medium uppercase tracking-wider">Phone Number</p>
                  <p className="text-base font-medium text-black">{user?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#f5f5f5] rounded-lg text-[#666666]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#666666] font-medium uppercase tracking-wider">Location</p>
                  <p className="text-base font-medium text-black">{user?.location || 'Not provided'}</p>
                </div>
              </div>

              {user?.bio && (
                <div className="pt-4 border-t border-[#e0e0e0]">
                  <p className="text-xs text-[#666666] font-medium uppercase tracking-wider mb-2">Bio</p>
                  <p className="text-sm text-black leading-relaxed">{user.bio}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </AppScaffold>
    </>
  );
};

export default ProfileOverviewPage;