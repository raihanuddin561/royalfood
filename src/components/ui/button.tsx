import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const variantClasses = {
      default: "bg-blue-600 text-white hover:bg-blue-700",
      destructive: "bg-red-600 text-white hover:bg-red-700",
      outline: "border-2 border-gray-700 bg-white text-gray-900 hover:bg-gray-100 hover:border-gray-800",
      secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400",
      ghost: "text-gray-900 hover:bg-gray-200 border border-gray-300 hover:border-gray-400",
      link: "text-blue-600 hover:underline",
    }

    const sizeClasses = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-8",
      icon: "h-10 w-10 p-0",
    }

    const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
    
    // Get variant and size classes
    const variantClass = variantClasses[variant] || variantClasses.default
    const sizeClass = sizeClasses[size] || sizeClasses.default
    
    // If custom className contains text color, don't apply variant text color
    const hasCustomTextColor = className.includes('text-')
    const cleanVariantClass = hasCustomTextColor 
      ? variantClass.replace(/text-\S+/g, '').replace(/hover:text-\S+/g, '').trim()
      : variantClass
    
    const finalClassName = `${baseClasses} ${cleanVariantClass} ${sizeClass} ${className}`
    
    if (asChild) {
      return React.cloneElement(
        children as React.ReactElement,
        {
          ...props,
          className: finalClassName,
          ref,
        } as any
      )
    }
    
    return (
      <button
        className={finalClassName}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
