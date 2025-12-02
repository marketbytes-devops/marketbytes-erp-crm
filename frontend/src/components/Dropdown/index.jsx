import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';

const useDropdownStore = create((set) => ({
  openDropdownId: null,
  open: (id) => set({ openDropdownId: id }),
  close: () => set({ openDropdownId: null }),
  toggle: (id) =>
    set((state) => ({
      openDropdownId: state.openDropdownId === id ? null : id,
    })),
}));

const Dropdown = ({
  trigger,
  children,
  align = 'right',
  className = '',
  dropdownId,
  width = 'w-64', 
}) => {
  const dropdownRef = useRef(null);
  const { openDropdownId } = useDropdownStore();
  const isOpen = openDropdownId === dropdownId;

  const toggle = () => useDropdownStore.getState().toggle(dropdownId);
  const close = () => useDropdownStore.getState().close();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        close();
      }
    };
    const handleEscape = (e) => e.key === 'Escape' && close();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [close]);

  const alignClasses = {
    left: 'left-0',
    right: 'right-0',
    center: 'left-1/2 -translate-x-1/2',
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      <div onClick={toggle} className="cursor-pointer select-none">
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 30,
              duration: 0.2,
            }}
            className={`absolute top-full mt-2 ${width} ${alignClasses[align]} z-50`}
          >
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/90 backdrop-blur-xl shadow-2xl ring-1 ring-black/5">
              <div className="p-2">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Dropdown.Item = ({ onClick, href, children, icon: Icon, danger = false }) => {
  const close = () => useDropdownStore.getState().close();

  const handleClick = (e) => {
    if (href) e.preventDefault();
    onClick?.();
    close();
  };

  const baseClasses = 'flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group relative overflow-hidden';
  const textColor = danger ? 'text-red-600' : 'text-gray-700';
  const hoverBg = danger
    ? 'hover:bg-red-50 hover:text-red-700'
    : 'hover:bg-linear-to-r hover:from-gray-50 hover:to-gray-50 hover:text-gray-700';

  return href ? (
    <a href={href} onClick={handleClick} className={`${baseClasses} ${textColor} ${hoverBg}`}>
      {Icon && <Icon size={18} className="group-hover:scale-110 transition-transform" />}
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700" />
    </a>
  ) : (
    <div onClick={handleClick} className={`${baseClasses} ${textColor} ${hoverBg}`}>
      {Icon && <Icon size={18} className="group-hover:scale-110 transition-transform duration-200" />}
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-700" />
    </div>
  );
};

Dropdown.Divider = () => (
  <div className="my-2 mx-3 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
);

export default Dropdown;