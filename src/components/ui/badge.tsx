import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'danger'
}

function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variantClasses = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-gray-200 text-gray-900 border-gray-400",
    destructive: "bg-red-100 text-red-800 border-red-200",
    outline: "bg-white text-gray-900 border-gray-500 border-2",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    danger: "bg-red-100 text-red-800 border-red-200",
  }

  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors"
  const variantClass = variantClasses[variant] || variantClasses.default
  
  return (
    <div className={`${baseClasses} ${variantClass} ${className}`} {...props} />
  )
}

export { Badge }
