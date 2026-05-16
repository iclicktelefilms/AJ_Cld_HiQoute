import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AppTextField from '@/components/m3/AppTextField';
import AppButton from '@/components/m3/AppButton';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';

const ProfileSettingsModal = ({ open, onOpenChange, user, onUpdate }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
    bio: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user && open) {
      setFormData({
        full_name: user.full_name || user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || ''
      });
      
      if (user.profile_picture) {
        setAvatarPreview(pb.files.getUrl(user, user.profile_picture));
      } else if (user.avatar) {
        setAvatarPreview(pb.files.getUrl(user, user.avatar));
      } else {
        setAvatarPreview(null);
      }
      setAvatarFile(null);
    }
  }, [user, open]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      toast.error('Full Name and Phone are required');
      return;
    }

    setIsSaving(true);
    try {
      const data = new FormData();
      data.append('full_name', formData.full_name);
      data.append('name', formData.full_name); // Keep name in sync
      data.append('phone', formData.phone);
      data.append('location', formData.location);
      data.append('bio', formData.bio);
      
      if (avatarFile) {
        data.append('profile_picture', avatarFile);
      }

      await pb.collection('users').update(user.id, data, { $autoCancel: false });
      toast.success('Profile updated successfully');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] w-full max-h-[90vh] overflow-y-auto rounded-[var(--radius-xl)] p-6 bg-white border-[#e0e0e0]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-[20px] font-bold text-black">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="relative w-[80px] h-[80px] rounded-full overflow-hidden bg-[#f5f5f5] border border-[#e0e0e0] flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[24px] font-bold text-[#666666]">
                  {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div>
              <input 
                type="file" 
                id="avatar-upload" 
                accept="image/jpeg, image/png" 
                className="hidden" 
                onChange={handleFileChange}
              />
              <label 
                htmlFor="avatar-upload" 
                className="flex items-center gap-2 text-[14px] font-medium text-[#ff3131] cursor-pointer hover:underline"
              >
                <Camera className="w-4 h-4" />
                Change Picture
              </label>
            </div>
            <p className="text-[11px] text-[#666666]">JPG or PNG, max 5MB</p>
          </div>

          <AppTextField
            label="Full Name *"
            placeholder="Your full name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            className="[&_input]:rounded-[10px]"
          />
          <AppTextField
            label="Phone *"
            placeholder="+91 XXXXX XXXXX"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="[&_input]:rounded-[10px]"
          />
          <AppTextField
            label="Location (Optional)"
            placeholder="City, State"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="[&_input]:rounded-[10px]"
          />
          <AppTextField
            label="Bio (Optional)"
            type="textarea"
            placeholder="Tell us about your photography style"
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="[&_textarea]:rounded-[10px] [&_textarea]:h-[80px]"
          />
          
          <div className="flex flex-col gap-[8px] mt-4">
            <AppButton 
              variant="filled" 
              className="w-full rounded-[20px] bg-[#ff3131] hover:bg-[#ff1a1a] text-white" 
              onClick={handleSave} 
              loading={isSaving}
            >
              Save Changes
            </AppButton>
            <AppButton 
              variant="tonal" 
              className="w-full rounded-[8px]" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </AppButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettingsModal;