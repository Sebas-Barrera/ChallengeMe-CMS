import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-text-primary mb-2">
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'w-full px-4 py-3 bg-bg-tertiary border rounded-xl text-text-primary placeholder-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 focus:border-brand-yellow',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error
              ? 'border-error focus:ring-error/50 focus:border-error'
              : 'border-border',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-error flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-text-tertiary">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
