import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { MdClose } from 'react-icons/md';

const LayoutComponents = ({
  children,
  title,
  subtitle,
  variant = 'card',
  modal,
  onCloseModal,
}) => {

  const toaster = (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#000',
          color: '#fff',
          fontSize: '14px',
          position: "relative",
          top: "80px",
          right: "8px"
        },
        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  );

  if (variant === 'card') {
    return (
      <>
        {toaster}
        <div className="min-h-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="bg-white rounded-xl shadow-inner overflow-hidden">
              <div className="bg-black p-6 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
                {subtitle && <p className="text-gray-300 text-sm">{subtitle}</p>}
              </div>
              <div className="p-6">{children}</div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  if (variant === 'table') {
    return (
      <>
        {toaster}
        <div className="min-h-auto">
          <div className="max-w-full mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 text-center lg:text-left"
            >
              <h2 className="text-2xl font-bold text-black mb-2">{title}</h2>
              {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className=" rounded-xl overflow-hidden"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  if (variant === 'modal') {
    return (
      <>
        {toaster}
        <div className="fixed inset-0 backdrop-brightness-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-black">{title}</h3>
              <button
                onClick={onCloseModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all"
              >
                <MdClose className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-8">{modal}</div>
          </motion.div>
        </div>
      </>
    );
  }

  return <>{children}</>;
};

export default LayoutComponents;