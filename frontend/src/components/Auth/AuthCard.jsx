import { Toaster } from 'react-hot-toast';
import bgAuth from '../../assets/images/bg-auth.png';

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
          error: { primary: '#ef4444', secondary: '#fff' },
        }}
      />

      <div
        className="min-h-screen flex items-center justify-end p-6"
        style={{
          backgroundImage: `url(${bgAuth})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="bg-white/85 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20">

          <div className="text-center mb-8">
            <h3 className="text-3xl font-medium text-black mb-2">{title}</h3>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </>
  );
};

export default AuthCard;