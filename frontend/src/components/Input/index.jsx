import { forwardRef, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  MdKeyboardArrowDown,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import { createPortal } from "react-dom";

const Select = forwardRef(
  (
    {
      options = [],
      value,
      onChange,
      placeholder = "Select an option",
      className,
      multiple = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("");
    const triggerRef = useRef(null);
    const ulRef = useRef(null);
    const [triggerRect, setTriggerRect] = useState(null);

    useEffect(() => {
      if (multiple) return;

      const selected = options.find(
        (opt) => String(opt.value) === String(value)
      );
      setSelectedLabel(selected ? selected.label : "");
    }, [value, options, multiple]);

    useEffect(() => {
      if (isOpen && triggerRef.current) {
        setTriggerRect(triggerRef.current.getBoundingClientRect());
      }
    }, [isOpen]);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target) &&
          (!ulRef.current || !ulRef.current.contains(e.target))
        ) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleSelect = (option) => {
      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        if (!current.includes(option.value)) {
          onChange([...current, option.value]);
        }
      } else {
        onChange(option.value);
        setIsOpen(false);
      }
    };

    const handleRemove = (val) => {
      onChange(value.filter((v) => v !== val));
    };


    const dropdownContent = isOpen && (
      <motion.ul
        ref={ulRef}
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute bg-white border border-gray-300 rounded-xl shadow-2xl max-h-64 overflow-y-auto py-1 z-1001"
        style={{
          top: triggerRect ? triggerRect.bottom + window.pageYOffset + 8 : 0,
          left: triggerRect ? triggerRect.left + window.pageXOffset : 0,
          minWidth: triggerRect ? triggerRect.width : "100%",
        }}
      >
        {options.length === 0 ? (
          <li className="px-4 py-3 text-gray-500 text-center text-sm">
            No options available
          </li>
        ) : (
          options.map((option) => (
            <motion.li
              key={option.value}
              onClick={() => handleSelect(option)}
              className="px-4 py-2.5 cursor-pointer text-sm text-gray-900 hover:bg-gray-100 transition-colors duration-100" // Optional: add smooth transition
            >
              {option.label}
            </motion.li>
          ))
        )}
      </motion.ul>
    );

    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-3 border rounded-lg flex items-center justify-between text-left transition-all",
            "focus:ring focus:ring-black focus:border-black outline-none",
            "border-gray-600 hover:border-gray-800",
            className
          )}
        >
          <span className="flex flex-wrap gap-2">
            {multiple && Array.isArray(value) && value.length > 0 ? (
              value.map((val) => {
                const opt = options.find(o => String(o.value) === String(val));
                return (
                  <span
                    key={val}
                    className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded text-sm"
                  >
                    {opt?.label}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(val);
                      }}
                      className="text-gray-600 hover:text-black"
                    >
                      ✕
                    </button>
                  </span>
                );
              })
            ) : (
              <span className={value ? "text-black" : "text-gray-500"}>
                {selectedLabel || placeholder}
              </span>
            )}
          </span>

          <MdKeyboardArrowDown
            className={cn(
              "w-5 h-5 transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {createPortal(
          <AnimatePresence>{dropdownContent}</AnimatePresence>,
          document.body
        )}
      </>
    );
  }
);
Select.displayName = "Select";

const Input = forwardRef(
  (
    {
      label,
      id,
      type = "text",
      placeholder,
      className,
      error,
      helperText,
      options,
      value,
      onChange,
      required,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    if (type === "select") {
      return (
        <div className="space-y-2">
          {label && (
            <label
              htmlFor={id}
              className="block text-sm font-semibold text-black"
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          <Select
            options={options || []}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            multiple={props.multiple}
            className={cn(
              hasError &&
              "border-red-500 focus:ring-red-500 focus:border-red-500"
            )}

          />

          {(hasError || helperText) && (
            <p
              className={cn(
                "text-sm mt-1",
                hasError ? "text-red-600" : "text-gray-600"
              )}
            >
              {error || helperText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-semibold text-black"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            id={id}
            type={inputType}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            ref={ref}
            className={cn(
              "w-full px-4 py-3 border rounded-lg",
              isPassword ? "pr-12" : "pr-4",
              "focus:ring focus:ring-black focus:border-black outline-none transition-all",
              hasError
                ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                : "border-gray-600",
              isPassword && "font-mono tracking-wider",
              className
            )}
            autoComplete={
              type === "password"
                ? "current-password"
                : type === "email"
                  ? "username"
                  : undefined
            }
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <MdVisibilityOff className="w-5 h-5" />
              ) : (
                <MdVisibility className="w-5 h-5" />
              )}
            </button>
          )}
        </div>

        {(hasError || helperText) && (
          <p
            className={cn(
              "text-sm mt-1",
              hasError ? "text-red-600" : "text-gray-600"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
