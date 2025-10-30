import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--input-label-color)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            input-default
            w-full px-3 py-2 rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }
)