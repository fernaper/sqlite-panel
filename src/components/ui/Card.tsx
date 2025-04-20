export default function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode,
  className?: string,
}) {
  return (
    <div
      className={
        `transition-all p-4 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 ${className}`
      }
      {...props}
    >
      {children}
    </div>
  )
}