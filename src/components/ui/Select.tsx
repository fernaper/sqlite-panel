export default function Select({
  children,
  className,
  labelClassName,
  label,
  disabled,
  variant,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode,
  className?: string,
  labelClassName?: string,
  label?: string,
  disabled?: boolean,
  variant?: 'default' | 'empty' | 'integrated',
}) {

  let selectClassName = `py-2 px-4 outline outline-1 outline-gray-300 dark:outline-gray-800 bg-gray-200 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 disabled:opacity-30 disabled:cursor-not-allowed`;
  if (variant === 'empty') {
    selectClassName = `is-empty-select bg-transparent hover:bg-indigo-500 text-gray-700 dark:text-indigo-100 font-semibold hover:text-white py-2 px-4 border border-indigo-500 hover:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300`;
  } else if (variant == 'integrated') {
    selectClassName = `is-empty-select bg-transparent hover:bg-opacity-30 hover:bg-black text-gray-700 dark:text-indigo-100 font-semibold p-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300`;
  }

  const selectContent = (
    <select
      className={`transition-all cursor-pointer rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:ring-2 hover:ring-indigo-400 dark:hover:ring-indigo-300 ${selectClassName} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </select>
  );
  if (label) {
    return (
      <label className={labelClassName}>
        <p
          className={`cursor-pointer text-sm font-semibold mb-1 mt-2 transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          {label}
        </p>
        {selectContent}
      </label>
    );
  }
  return selectContent;
}