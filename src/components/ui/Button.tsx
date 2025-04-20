import type { MouseEventHandler } from "react"


export default function Button({
  children,
  className,
  icon,
  variant = "primary",
  iconPosition = "left",
  href,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement | HTMLAnchorElement> & {
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  variant?: "none" | "empty" | "link" | "primary" | "integrated";
  iconPosition?: "left" | "right";
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement> | undefined;
}) {
  let finalClassName = icon === undefined ? "" : "flex items-center gap-2 justify-center "
  finalClassName += "transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer " // Not working for some reason

  switch (variant) {
    case "none":
      finalClassName += className ?? ""
      finalClassName += " focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300"
      break
    case "empty":
      finalClassName += `bg-transparent hover:bg-indigo-500 text-gray-700 dark:text-indigo-100 font-semibold hover:text-white py-2 px-4 border border-indigo-500 hover:border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 ${className}`
      break
    case "link":
      finalClassName += `text-gray-700 dark:text-white font-semi-bold hover:underline focus:underline focus:outline-none ${className}`
      break
    case "integrated":
      finalClassName += `bg-transparent hover:bg-opacity-30 hover:bg-black text-gray-700 dark:text-indigo-100 font-semibold hover:text-white p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 ${className}`
      break
    case "primary":
    default:
      finalClassName += `bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-300 ${className}`
      break
  }
  if (href) {
    return (
      <a href={href} className={finalClassName} {...props}>
        {icon !== undefined && iconPosition === 'left' ? icon : <></>}
        {children}
        {icon !== undefined && iconPosition === 'right' ? icon : <></>}
      </a>
    )
  }
  return (
    <button className={finalClassName} onClick={onClick} {...props}>
      {icon !== undefined && iconPosition === 'left' ? icon : <></>}
      {children}
      {icon !== undefined && iconPosition === 'right' ? icon : <></>}
    </button>
  )
}