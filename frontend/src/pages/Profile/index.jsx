import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Camera, User, Mail, MapPin, Phone, ShieldCheck, UserCircle, Settings } from 'lucide-react';
import apiClient from '../../helpers/apiClient';
import LayoutComponents from '../../components/LayoutComponents';
import Input from '../../components/Input';

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

      toast.success('Identity updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failure');
    }
  };

  const onPasswordChange = async (data) => {
    try {
      await apiClient.put('/auth/profile/', {
        new_password: data.new_password,
      });
      toast.success('Security credentials updated.');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Password change failed');
    }
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Column: Profile Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-1/3 flex flex-col gap-6"
          >
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm p-8 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-full blur-3xl -mr-16 -mt-16"></div>

              <div className="relative z-10">
                <div className="relative inline-block mb-6">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-2xl mx-auto bg-gray-50 ring-1 ring-gray-100 ring-offset-4">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-2 right-2 p-2.5 bg-black text-white rounded-2xl shadow-xl cursor-pointer hover:scale-110 transition-transform ring-4 ring-white">
                    <Camera className="w-5 h-5" />
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>

                <h1 className="text-2xl font-black text-black tracking-tight mb-1">{profile.name || 'Account Owner'}</h1>
                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">@{profile.username || 'user'}</p>

                <div className="flex flex-col gap-3 text-left pt-6 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-gray-500">
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-black" />
                    </div>
                    <span className="text-sm font-medium truncate">{profile.email}</span>
                  </div>
                  {profile.phone_number && (
                    <div className="flex items-center gap-3 text-gray-500">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-black" />
                      </div>
                      <span className="text-sm font-medium">{profile.phone_number}</span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex items-center gap-3 text-gray-500">
                      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-black" />
                      </div>
                      <span className="text-sm font-medium line-clamp-1">{profile.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-black rounded-4xl p-8 text-white relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mb-16 -mr-16"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">Verified Profile</h3>
                <p className="text-gray-400 text-xs leading-relaxed">Your account is secured with high-level encryption and internal role protocols.</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Settings Forms */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex flex-col gap-6"
          >
            {/* Profile Info Form */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <UserCircle className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-black leading-none mb-1">Personal Details</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identification & Presence</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit(onProfileUpdate)} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <Input
                  label="Legal Name"
                  id="name"
                  placeholder="e.g. Alexander Pierce"
                  {...registerProfile('name')}
                  error={profileErrors.name?.message}
                  className="font-medium"
                />
                <Input
                  label="Username Alias"
                  id="username"
                  placeholder="e.g. alex_01"
                  {...registerProfile('username')}
                  error={profileErrors.username?.message}
                  className="font-medium"
                />
                <div className="md:col-span">
                  <Input
                    label="Physical Address"
                    id="address"
                    placeholder="e.g. 742 Evergreen Terrace, Springfield"
                    {...registerProfile('address')}
                    error={profileErrors.address?.message}
                    className="font-medium"
                  />
                </div>
                <Input
                  label="Contact Number"
                  id="phone_number"
                  type="tel"
                  placeholder="+91 00000 00000"
                  {...registerProfile('phone_number')}
                  error={profileErrors.phone_number?.message}
                  className="font-medium"
                />

                <div className="md:col-span-2 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-8 py-4 bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-black/10 hover:shadow-black/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                  >
                    {isUpdatingProfile ? 'Processing...' : 'Apply Modifications'}
                  </motion.button>
                </div>
              </form>
            </div>

            {/* Security Form */}
            <div className="bg-white rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-black leading-none mb-1">Security Update</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authentication Keys</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit(onPasswordChange)} className="p-8 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="New Access Key"
                    id="new_password"
                    type="password"
                    placeholder="Min. 8 characters"
                    {...registerPassword('new_password')}
                    error={passwordErrors.new_password?.message}
                    className="font-medium"
                  />
                  <Input
                    label="Confirm Access Key"
                    id="confirm_password"
                    type="password"
                    placeholder="Repeat access key"
                    {...registerPassword('confirm_password')}
                    error={passwordErrors.confirm_password?.message}
                    className="font-medium"
                  />
                </div>

                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-8 py-4 bg-white text-black border-2 border-black rounded-2xl font-bold text-sm hover:bg-black hover:text-white transition-all disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Securing...' : 'Renew Password'}
                  </motion.button>
                </div>
              </form>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
