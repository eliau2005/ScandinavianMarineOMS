import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    glass?: boolean;
    hover?: boolean;
    onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
    children,
    className = "",
    glass = false,
    hover = false,
    onClick,
}) => {
    return (
        <div
            onClick={onClick}
            className={`
        rounded-2xl p-6
        ${glass ? "glass-card" : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-none"}
        ${hover ? "transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer" : ""}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

export default Card;
