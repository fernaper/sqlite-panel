export default function Loader({
  className,
  svgClassName,
  ...props
} : React.HTMLProps<HTMLDivElement> & {
  className?: string;
  svgClassName?: string;
}) {
  return (
    <div className={`mx-auto ${className}`} {...props}>
      <svg
        className={`w-10 h-10 ${svgClassName}`}
        viewBox="0 0 200 200"
      >
        <circle
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={15}
          r={15}
          cx={40}
          cy={65}
        >
          <animate
            attributeName="cy"
            calcMode="spline"
            dur={2}
            values="65;135;65;"
            keySplines=".5 0 .5 1;.5 0 .5 1"
            repeatCount="indefinite"
            begin="-.4"
          />
        </circle>
        <circle
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={15}
          r={15}
          cx={100}
          cy={65}
        >
          <animate
            attributeName="cy"
            calcMode="spline"
            dur={2}
            values="65;135;65;"
            keySplines=".5 0 .5 1;.5 0 .5 1"
            repeatCount="indefinite"
            begin="-.2"
          />
        </circle>
        <circle
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={15}
          r={15}
          cx={160}
          cy={65}
        >
          <animate
            attributeName="cy"
            calcMode="spline"
            dur={2}
            values="65;135;65;"
            keySplines=".5 0 .5 1;.5 0 .5 1"
            repeatCount="indefinite"
            begin={0}
          />
        </circle>
      </svg>
    </div>
  )
}