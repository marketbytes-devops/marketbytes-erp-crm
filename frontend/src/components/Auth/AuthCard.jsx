import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import bgAuth from '../../assets/images/bg-auth.jpg';

const AuthCard = ({ children, title, subtitle }) => {
  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363740',
            color: '#fff',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      <motion.div
        className="min-h-screen bg-gray-100 flex items-center justify-end p-6"
        style={{
          backgroundImage: `url(${bgAuth})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-white bg-opacity-95 backdrop-blur-sm p-8 rounded-xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-black mb-2">{title}</h3>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>
          {children}
        </div>
      </motion.div>
    </>
  );
};

export default AuthCard;