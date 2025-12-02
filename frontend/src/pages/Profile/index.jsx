import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Camera, User } from 'lucide-react';
import apiClient from '../../helpers/apiClient';
import Input from '../../components/Input';
import LayoutComponents from '../../components/LayoutComponents';

const profileSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  username: z.string().min(1, 'Username is required'),
  address: z.string().optional(),
  phone_number: z.string().optional(),
});

const passwordSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

const Profile = () => {
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    username: '',
    address: '',
    phone_number: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isUpdatingProfile },
    reset: resetProfileForm,
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isChangingPassword },
    reset: resetPasswordForm,
  } = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get('/auth/profile/');
        
        const profileData = {
          email: data.email || '',
          name: data.name || '',
          username: data.username || '',
          address: data.address || '',
          phone_number: data.phone_number || '',
          image: data.image || null,
        };

        setProfile(profileData);
        setImagePreview(data.image || null);

        resetProfileForm({
          name: profileData.name,
          username: profileData.username,
          address: profileData.address,
          phone_number: profileData.phone_number,
        });
      } catch (err) {
        toast.error('Failed to load profile');
      }
    };

    fetchProfile();
  }, [resetProfileForm]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const onProfileUpdate = async (formData) => {
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        data.append(key, value);
      }
    });

    if (profile.image instanceof File) {
      data.append('image', profile.image);
    }

    try {
      const res = await apiClient.put('/auth/profile/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedData = res.data;

      setProfile(prev => ({
        ...prev,
        name: updatedData.name || prev.name,
        username: updatedData.username || prev.username,
        address: updatedData.address || prev.address,
        phone_number: updatedData.phone_number || prev.phone_number,
        image: updatedData.image || prev.image,
      }));

      if (updatedData.image) {
        setImagePreview(updatedData.image);
      }

      resetProfileForm({
        name: updatedData.name || '',
        username: updatedData.username || '',
        address: updatedData.address || '',
        phone_number: updatedData.phone_number || '',
      });

      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    }
  };

  const onPasswordChange = async (data) => {
    try {
      await apiClient.put('/auth/profile/', {
        new_password: data.new_password,
      });
      toast.success('Password changed successfully!');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    }
  };

  return (
    <>
      <motion.div
        className="w-full flex items-center justify-center p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full">
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-10 mb-8 text-center border border-gray-200"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative inline-block">
              <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white shadow-2xl mx-auto bg-gray-100">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-2 right-2 bg-black hover:bg-gray-800 rounded-full p-4 cursor-pointer shadow-2xl transition-all hover:scale-110">
                <Camera className="w-7 h-7 text-white" />
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <h2 className="mt-8 text-3xl font-bold text-black">{profile.name || 'Your Name'}</h2>
            <p className="text-lg text-gray-600 mt-2">{profile.email}</p>
            <p className="text-sm text-gray-500 mt-1">@{profile.username || 'username'}</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LayoutComponents variant="card" title="Personal Information" subtitle="Update your profile details">
              <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="space-y-6">
                <Input
                  label="Full Name"
                  id="name"
                  placeholder="John Doe"
                  {...registerProfile('name')}
                  error={profileErrors.name?.message}
                />
                <Input
                  label="Username"
                  id="username"
                  placeholder="johndoe123"
                  {...registerProfile('username')}
                  error={profileErrors.username?.message}
                />
                <Input
                  label="Address"
                  id="address"
                  placeholder="123 Main St, City, Country"
                  {...registerProfile('address')}
                  error={profileErrors.address?.message}
                />
                <Input
                  label="Phone Number"
                  id="phone_number"
                  type="tel"
                  placeholder="+123 456 7890"
                  {...registerProfile('phone_number')}
                  error={profileErrors.phone_number?.message}
                />

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full bg-black text-white hover:bg-white hover:text-black border gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg"
                >
                  {isUpdatingProfile ? 'Updating Profile...' : 'Update Profile'}
                </button>
              </form>
            </LayoutComponents>
            <LayoutComponents variant="card" title="Change Password" subtitle="Keep your account secure">
              <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="space-y-6">
                <Input
                  label="New Password"
                  id="new_password"
                  type="password"
                  placeholder="Enter new password"
                  {...registerPassword('new_password')}
                  error={passwordErrors.new_password?.message}
                />
                <Input
                  label="Confirm New Password"
                  id="confirm_password"
                  type="password"
                  placeholder="Repeat new password"
                  {...registerPassword('confirm_password')}
                  error={passwordErrors.confirm_password?.message}
                />

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-black text-white hover:bg-white hover:text-black border gap-3 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg"
                >
                  {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                </button>
              </form>
            </LayoutComponents>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Profile;