import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import apiClient from '../../../helpers/apiClient';
import AuthCard from '../../../components/Auth/AuthCard';
import Input from '../../../components/Input';

const ResetPassword = () => {
  const [step, setStep] = useState('request_otp');
  const navigate = useNavigate();

  const emailForm = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email('Please enter a valid email address'),
      })
    ),
    defaultValues: { email: '' },
  });

  const resetForm = useForm({
    resolver: zodResolver(
      z.object({
        otp: z.string().regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
        newPassword: z.string().min(6, 'Password must be at least 6 characters'),
      })
    ),
    defaultValues: { otp: '', newPassword: '' },
  });

  const onRequestOTP = async (data) => {
    try {
      await apiClient.post('/auth/request-otp/', { email: data.email });
      toast.success('OTP sent to your email!');
      setStep('reset_password');
      resetForm.setValue('email', data.email);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    }
  };

  const onReset = async (data) => {
    try {
      await apiClient.post('/auth/reset-password/', {
        email: emailForm.getValues('email'),
        otp: data.otp,
        new_password: data.newPassword,
      });
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
    }
  };

  return (
    <AuthCard
      title="Reset Password"
      subtitle={
        step === 'request_otp'
          ? "We'll send a 6-digit code to your email"
          : 'Enter the code and create a new password'
      }
    >
      {step === 'request_otp' ? (
        <form onSubmit={emailForm.handleSubmit(onRequestOTP)} className="space-y-6">
          <Input
            label="Email Address"
            id="email"
            type="email"
            placeholder="you@example.com"
            {...emailForm.register('email')}
            error={emailForm.formState.errors.email?.message}
          />

          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-gray-100 hover:text-black border transition duration-300 disabled:opacity-70 shadow-md"
          >
            {emailForm.formState.isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-6">
          <Input
            label="6-Digit OTP"
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength="6"
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono letter-spacing-4"
            {...resetForm.register('otp')}
            error={resetForm.formState.errors.otp?.message}
          />

          <Input
            label="New Password"
            id="newPassword"
            type="password"
            placeholder="Enter strong password"
            {...resetForm.register('newPassword')}
            error={resetForm.formState.errors.newPassword?.message}
          />

          <button
            type="submit"
            disabled={resetForm.formState.isSubmitting}
            className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-gray-100 hover:text-black border transition duration-300 disabled:opacity-70 shadow-md"
          >
            {resetForm.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="text-black hover:text-gray-600 font-medium text-sm transition-all duration-300"
        >
          Back to Login
        </button>
      </div>
    </AuthCard>
  );
};

export default ResetPassword;