import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import apiClient from '../../../helpers/apiClient';
import AuthCard from '../../../components/Auth/AuthCard';
import Input from '../../../components/Input';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    localStorage.clear();

    try {
      const response = await apiClient.post('/auth/login/', data);

      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      setIsAuthenticated(true);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <AuthCard title="Welcome Back!" subtitle="Log in to continue to your dashboard">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email Address"
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="**********"
          {...register('password')}
          error={errors.password?.message}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black text-white hover:text-black border font-medium py-3 rounded-lg hover:bg-white disabled:opacity-70 transition duration-300 shadow-md"
        >
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => navigate('/reset-password')}
          className="text-black hover:text-gray-600 font-medium text-sm transition-all duration-300"
        >
          Forgot Password?
        </button>
      </div>
    </AuthCard>
  );
};

export default Login;