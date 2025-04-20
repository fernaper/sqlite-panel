export default function Kbd({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <kbd
      className="inline-block px-1 text-sm font-mono font-bold text-gray-800 bg-gray-300 
        border border-gray-400 rounded-md shadow-md
        dark:text-gray-200 dark:bg-gray-700 dark:border-gray-500
        transition-transform transform"
    >
      {children}
    </kbd>
  );
}