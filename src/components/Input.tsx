import { InputHTMLAttributes, forwardRef, useState, useCallback } from 'react'
import { masks, validate } from '@/lib/dataUtils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  mask?: 'phone' | 'cpf' | 'cnpj' | 'cep' | 'currency'
  validation?: 'email' | 'phone' | 'cpf' | 'cnpj' | 'url'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  onValidation?: (isValid: boolean, errors?: string[]) => void
  showValidation?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    helperText,
    mask,
    validation,
    leftIcon,
    rightIcon,
    onValidation,
    showValidation = false,
    className = '',
    onChange,
    value,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value || '')
    const [validationError, setValidationError] = useState<string>('')
    const [isTouched, setIsTouched] = useState(false)

    // Validation function
    const validateValue = useCallback((val: string) => {
      if (!validation || !val.trim()) {
        setValidationError('')
        onValidation?.(true)
        return
      }

      let isValid = true
      let errors: string[] = []

      switch (validation) {
        case 'email':
          isValid = validate.email(val)
          if (!isValid) errors.push('Please enter a valid email address')
          break
        case 'phone':
          isValid = validate.phone(val)
          if (!isValid) errors.push('Please enter a valid phone number')
          break
        case 'cpf':
          isValid = validate.cpf(val)
          if (!isValid) errors.push('Please enter a valid CPF')
          break
        case 'cnpj':
          isValid = validate.cnpj(val)
          if (!isValid) errors.push('Please enter a valid CNPJ')
          break
        case 'url':
          isValid = validate.url(val)
          if (!isValid) errors.push('Please enter a valid URL')
          break
      }

      const errorMessage = errors.length > 0 ? errors[0] : ''
      setValidationError(errorMessage)
      onValidation?.(isValid, errors)
    }, [validation, onValidation])

    // Handle input change with masking
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value

      // Apply mask if specified
      if (mask) {
        switch (mask) {
          case 'phone':
            newValue = masks.phone(newValue)
            break
          case 'cpf':
            newValue = masks.cpf(newValue)
            break
          case 'cnpj':
            newValue = masks.cnpj(newValue)
            break
          case 'cep':
            newValue = masks.cep(newValue)
            break
          case 'currency':
            newValue = masks.currency(newValue)
            break
        }
      }

      setInternalValue(newValue)

      // Create new event with masked value
      const maskedEvent = {
        ...e,
        target: { ...e.target, value: newValue }
      } as React.ChangeEvent<HTMLInputElement>

      onChange?.(maskedEvent)

      // Validate if validation is enabled and field is touched
      if (showValidation && isTouched) {
        validateValue(newValue)
      }
    }, [mask, onChange, showValidation, isTouched, validateValue])

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      setIsTouched(true)
      if (showValidation) {
        validateValue(e.target.value)
      }
      props.onBlur?.(e)
    }, [showValidation, validateValue, props])

    const displayError = error || (showValidation && isTouched && validationError)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id}
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--input-label-color)' }}
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {leftIcon}
              </div>
            </div>
          )}

          <input
            ref={ref}
            value={value !== undefined ? value : internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`
              input-default
              w-full px-3 py-2 rounded-lg shadow-sm
              focus:outline-none focus:ring-2 focus:ring-[var(--primary)]
              ${displayError ? 'border-red-500' : ''}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            aria-invalid={Boolean(displayError)}
            aria-describedby={
              displayError ? `${props.id}-error` :
              helperText ? `${props.id}-helper` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">
                {rightIcon}
              </div>
            </div>
          )}
        </div>

        {displayError && (
          <p
            id={`${props.id}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {displayError}
          </p>
        )}

        {helperText && !displayError && (
          <p
            id={`${props.id}-helper`}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Preset input components
export const EmailInput = (props: Omit<InputProps, 'type' | 'validation'>) => (
  <Input type="email" validation="email" {...props} />
)

export const PhoneInput = (props: Omit<InputProps, 'mask' | 'validation'>) => (
  <Input mask="phone" validation="phone" {...props} />
)

export const CPFInput = (props: Omit<InputProps, 'mask' | 'validation'>) => (
  <Input mask="cpf" validation="cpf" {...props} />
)
