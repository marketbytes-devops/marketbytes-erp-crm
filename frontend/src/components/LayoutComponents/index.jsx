import { motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { MdClose } from 'react-icons/md';
import { createPortal } from 'react-dom';

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
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-inner overflow-hidden"
          >
            <div className="bg-black p-6 text-center lg:text-left">
              <h2 className="text-2xl font-medium text-white mb-2">{title}</h2>
              {subtitle && <p className="text-gray-300 text-sm">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      </>
    );
  }

  if (variant === 'table') {
    return (
      <>
        {toaster}
        <div className="max-w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center lg:text-left"
          >
            <h2 className="text-2xl font-medium text-black mb-2">{title}</h2>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {children}
          </motion.div>
        </div>
      </>
    );
  }

  if (variant === 'modal') {
    return createPortal(
      <>
        {toaster}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10 rounded-t-2xl">
              <h3 className="text-2xl font-medium text-black">{title}</h3>
              <button
                onClick={onCloseModal}
                className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <MdClose className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <div className="p-8">{modal}</div>
          </motion.div>
        </div>
      </>,
      document.body
    );
  }

  return <>{children}</>;
};

export default LayoutComponents;