import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { useState } from "react";

export default function TextInput({
  className,
  divClassName,
  icon,
  iconPosition = "right",
  inputType = "text",
  labelClassName,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string,
  divClassName?: string,
  icon?: React.ReactNode,
  iconPosition?: "left" | "right",
  inputType?: "text" | "password" | "search" | "email" | "number",
  labelClassName?: string,
  label?: string,
}) {
  const [showPassword, setShowPassword] = useState(false);
  let input;
  if (icon) {
    let iconPositionClass = iconPosition === "left" ? "left-0 pl-4" : "right-0 pr-4"
    let inputClass = iconPosition === "left" ? "pl-12 pr-2 sm:pr-4" : "pl-2 sm:pl-4 pr-12"
    if (inputType === "password") {
      iconPositionClass = iconPositionClass.replace(/pl/g, 'px').replace(/pr/g, 'px')
      inputClass = "px-12"
    }
    input = (
      <div className={`relative ${divClassName}`}>
        <input
          type={showPassword ? "text" : inputType}
          className={`${inputClass} box-border py-2 outline-1 outline-gray-400 dark:outline-gray-800 bg-gray-200 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 ${className}`}
          {...props}
        />
        <div className={`absolute inset-y-0 flex items-center ${iconPositionClass}`}>
          {icon}
        </div>
        {inputType === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300"
          >
            {
              showPassword ? (
                <EyeSlashIcon className="w-6 h-6 mx-4 cursor-pointer" />
              ) : (
                <EyeIcon className="w-6 h-6 mx-4 cursor-pointer" />
              )
            }
          </button>
        )}
      </div>
    )
  } else {
    input = (
      <input
        type={inputType}
        className={`box-border px-4 py-2 max-w-max outline-1 outline-gray-400 dark:outline-gray-800 bg-gray-200 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-300 ${className}`}
        {...props}
      />
    )
  }

  if (label) {
    return (
      <label>
        <p
          className={`cursor-pointer text-sm font-semibold mb-1 mt-2 transition-opacity ${labelClassName}`}
        >
          {label}
        </p>
        {input}
      </label>
    );
  }
  return input
}