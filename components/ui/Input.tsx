import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    className = "",
    id,
    ...props
}) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className="w-full">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                >
                    {label}
                </label>
            )}
            <div className="relative group">
                {leftIcon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary transition-colors duration-200">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            block w-full rounded-xl border-gray-200 dark:border-gray-700 
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:border-primary focus:ring-primary focus:ring-2 focus:ring-opacity-20
            transition-all duration-200 ease-in-out
            shadow-sm hover:border-gray-300 dark:hover:border-gray-600
            ${leftIcon ? "pl-10" : "pl-4"}
            ${rightIcon ? "pr-10" : "pr-4"}
            py-2.5
            ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
            ${className}
          `}
                    {...props}
                />
                {rightIcon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-sm text-red-500 animate-fade-in">{error}</p>}
        </div>
    );
};

export default Input;
