import Card from "@/components/ui/Card";

export default function Popover({
  element,
  children,
  className = "",
  groupClassName = "",
  position = "top",
  defaultWidth = 'min-w-72',
}: {
  element: React.ReactNode,
  children?: React.ReactNode,
  className?: string,
  groupClassName?: string,
  position?: "top" | "bottom" | "left" | "right",
  defaultWidth?: string,
}) {
  let positionClassName = "";
  let animationClassName = "opacity-0 invisible scale-95"; // Animación inicial

  switch (position) {
    case "top":
      positionClassName = " -top-2 left-0 transform -translate-y-full";
      break;
    case "bottom":
      positionClassName = " top-auto left-0 transform mt-2";
      break;
    case "left":
      positionClassName = " -left-2 top-0 transform -translate-x-full";
      break;
    case "right":
    default:
      positionClassName = " ml-2";
  }
  return (
    <div className={`relative group/popover ${groupClassName}`}>
      {element}
      <Card
        className={`
          absolute z-30 outline-1 outline-gray-300 dark:outline-gray-700
          inline-block transition-all duration-200 ease-out delay-300
          opacity-0 invisible scale-95
          group-hover/popover:visible group-hover/popover:opacity-100 group-hover/popover:scale-100
          group-focus-within/popover:visible group-focus-within/popover:opacity-100 group-focus-within/popover:scale-100
          ${defaultWidth} ${animationClassName} ${positionClassName} ${className}
        `}
      >
        {children}
      </Card>
    </div>
  );
}
