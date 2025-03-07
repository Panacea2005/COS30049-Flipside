import { useState } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_AVATAR = '/default-avatar.png'; // Replace with your default avatar URL
const DEFAULT_BANNER = '/default-banner.png'; // Replace with your default banner URL

export const ProfileSettings = () => {
  const { user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || DEFAULT_AVATAR);
  const [bannerUrl, setBannerUrl] = useState(user?.user_metadata?.banner_url || DEFAULT_BANNER);
  const [formData, setFormData] = useState({
    username: user?.user_metadata?.username || '',
    twitter: user?.user_metadata?.twitter || '',
    discord: user?.user_metadata?.discord || '',
  });

  const handleFileUpload = async (
    file: File,
    bucket: 'user_avatar' | 'user_banner',
    metadataKey: 'avatar_url' | 'banner_url'
  ) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, or GIF.');
    }
  
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }
  
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${metadataKey.split('_')[0]}-${Date.now()}.${fileExt}`;
  
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });
  
    if (uploadError) throw uploadError;
  
    // Generate a signed URL for the uploaded file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // URL valid for 7 days
  
    if (urlError) throw urlError;
  
    // Update user metadata with the signed URL
    const { error: updateError, data: userData } = await supabase.auth.updateUser({
      data: { [metadataKey]: signedUrlData.signedUrl },
    });
  
    if (updateError) throw updateError;
  
    return { user: userData.user, url: signedUrlData.signedUrl };
  };  

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'banner'
  ) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Please select an image to upload.');
      }

      const file = event.target.files[0];
      const bucket = type === 'avatar' ? 'user_avatar' : 'user_banner';
      const metadataKey = type === 'avatar' ? 'avatar_url' : 'banner_url';

      const { user: updatedUser, url } = await handleFileUpload(file, bucket, metadataKey);
      
      // Update local state immediately
      if (type === 'avatar') {
        setAvatarUrl(url);
      } else {
        setBannerUrl(url);
      }
      
      setUser(updatedUser);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error uploading image!');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { error, data: userData } = await supabase.auth.updateUser({
        data: formData
      });

      if (error) throw error;
      setUser(userData.user);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Error updating profile!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8 mt-16">
        <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
        <button
          onClick={handleSubmit}
          disabled={saving || uploading}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="relative mb-8">
        <div className="h-48 bg-gray-100 rounded-lg overflow-hidden">
          {bannerUrl && (
            <img
              src={bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_BANNER;
                setBannerUrl(DEFAULT_BANNER);
              }}
            />
          )}
          <label className="absolute top-4 right-4 p-2 bg-gray-800/50 rounded-lg text-white hover:bg-gray-800/70 cursor-pointer disabled:opacity-50">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'banner')}
              disabled={uploading}
              className="hidden"
            />
            <Camera className="w-5 h-5" />
          </label>
        </div>

        <div className="absolute -bottom-16 left-8">
          <div className="relative w-32 h-32">
            <div className="w-full h-full rounded-full bg-white border-4 border-white overflow-hidden">
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_AVATAR;
                    setAvatarUrl(DEFAULT_AVATAR);
                  }}
                />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer disabled:opacity-50">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
                disabled={uploading}
                className="hidden"
              />
              <Camera className="w-5 h-5" />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-24 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-lg py-3 px-4"
          />
          <p className="mt-1 text-sm text-gray-500">
            Alphanumeric, hyphen, or underscore. Between 3 and 42 characters.
          </p>
        </div>
      </div>
    </div>
  );
};