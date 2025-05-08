import React from 'react';

export default function TextAreaInput({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string,
}) {
  return (
    <textarea
      className={`w-full h-full p-0 border-0 bg-gray-200 dark:bg-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-300 ${className}`}
      {...props}
    />
  );
}