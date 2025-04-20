import React, { useState, useEffect } from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import Button from './Button';

export default function ThemeSwitcher({
  className = '',
  labelClassName = '',
}: {
  className?: string,
  labelClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);
  // const { theme, setTheme } = useTheme(); // Removed next-themes usage
  const [theme, setTheme] = useState('light'); // Local state placeholder

  useEffect(() => {
    setMounted(true);
    // Client-side only: Determine initial theme from localStorage or system preference
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme); // Persist preference
    document.documentElement.classList.toggle('dark', newTheme === 'dark'); // Apply class to HTML tag
  };

  return (
    <label className='cursor-pointer'>
      {/* TODO: Replace with Astro i18n */}
      <p
        className={`text-sm font-semibold mb-1 transition-opacity ${labelClassName}`}
      >
        Theme {/* Placeholder label */}
      </p>
      <Button
        aria-label="Switch theme" // Placeholder aria-label
        onClick={toggleTheme}
        variant='link'
        className={`transition-colors duration-200 flex items-center gap-2 ${className}`}
      >
        {/* Render icon based on local state */}
        {theme === 'dark' ? (
          <SunIcon className="h-6 w-6" />
        ) : (
          <MoonIcon className="h-6 w-6" />
        )}
        {/* Placeholder text */}
        {theme === 'dark' ? 'Light' : 'Dark'} Mode
      </Button>
    </label>
  );
}
