import { forwardRef, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  MdKeyboardArrowDown,
  MdVisibility,
  MdVisibilityOff,
  MdDelete,
} from "react-icons/md";
import { createPortal } from "react-dom";

const Select = forwardRef(
  (
    {
      options = [],
      value,
      onChange,
      onDeleteOption,
      placeholder = "Select an option",
      className,
      multiple = false,
      disabled = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLabel, setSelectedLabel] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const searchInputRef = useRef(null);
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
      const updateRect = () => {
        if (isOpen && triggerRef.current) {
          setTriggerRect(triggerRef.current.getBoundingClientRect());
        }
      };

      updateRect();
      if (isOpen) {
        window.addEventListener("scroll", updateRect, true);
        window.addEventListener("resize", updateRect);
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        setSearchTerm("");
      }

      return () => {
        window.removeEventListener("scroll", updateRect, true);
        window.removeEventListener("resize", updateRect);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        (!ulRef.current || !ulRef.current.contains(e.target))
      ) {
        setIsOpen(false);
      }
    };

    useEffect(() => {
      if (isOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen]);

    const filteredOptions = options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const finalOptions = multiple && Array.isArray(value)
      ? filteredOptions.filter(opt => !value.includes(String(opt.value)))
      : filteredOptions;

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
      if (disabled) return;
      onChange(value.filter((v) => v !== val));
    };

    const dropdownContent = isOpen && triggerRect && (
      <motion.ul
        ref={ulRef}
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed bg-white border border-gray-300 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-10"
        style={{
          top: triggerRect.bottom + 8 + 256 > window.innerHeight 
            ? triggerRect.top - 8 - Math.min(256, (finalOptions.length * 40 + 60)) // Flip up if not enough space
            : triggerRect.bottom + 8,
          left: triggerRect.left,
          width: triggerRect.width,
        }}
      >
        <div className="sticky top-0 bg-white p-2 border-b border-gray-100 z-10">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="py-1">
          {finalOptions.length === 0 ? (
            <li className="px-4 py-3 text-gray-500 text-center text-sm">
              {options.length === 0 ? "No options available" : "No results found"}
            </li>
          ) : (
            finalOptions.map((option) => (
              <motion.li
                key={option.value}
                onClick={() => handleSelect(option)}
                className="px-4 py-2.5 cursor-pointer text-sm text-gray-900 hover:bg-gray-100 transition-colors duration-100 flex items-center justify-between group"
              >
                <span>{option.label}</span>
                {onDeleteOption && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteOption(option);
                    }}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MdDelete size={16} />
                  </button>
                )}
              </motion.li>
            ))
          )}
        </div>
      </motion.ul>
    );

    return (
      <>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full px-4 py-3 border rounded-lg flex items-center justify-between text-left transition-all",
            !disabled && "focus:ring focus:ring-black focus:border-black outline-none border-gray-600 hover:border-gray-800",
            disabled && "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200",
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
      onDeleteOption,
      required,
      disabled,
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
              className="block text-sm font-medium text-black"
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          <Select
            options={options || []}
            value={value}
            onChange={onChange}
            onDeleteOption={onDeleteOption}
            placeholder={placeholder}
            multiple={props.multiple}
            disabled={disabled}
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
            className="block text-sm font-medium text-black"
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
