import React, { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import styles from '@/styles/components/button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
  loading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
          variant = 'primary',
          size = 'md',
          fullWidth = false,
          loading = false,
          icon,
          children,
          className,
          disabled,
          type = 'button',
          onClick,
          ...restProps  // Các props còn lại KHÔNG bao gồm fullWidth
        },
        ref
    ) => {
      // Build class names
      const classes = clsx(
          styles.btn,
          styles[`btn-${variant}`],
          styles[`btn-${size}`],
          {
            [styles['btn-block']]: fullWidth,
            [styles['btn-loading']]: loading,
            [styles['btn-icon']]: icon && !children,
          },
          className
      )

      return (
          <button
              ref={ref}
              type={type}
              className={classes}
              disabled={disabled || loading}
              onClick={onClick}
              {...restProps}  // Spread các props còn lại (không có fullWidth)
          >
            {/* Icon */}
            {icon && !loading && (
                <span className={styles.btnIcon}>{icon}</span>
            )}

            {/* Loading spinner */}
            {loading && (
                <span className={styles.btnSpinner}>
            <svg
                className={styles.spinnerSvg}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
              <circle
                  className={styles.spinnerCircle}
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
              />
              <path
                  className={styles.spinnerPath}
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </span>
            )}

            {/* Button text */}
            {children && (
                <span className={styles.btnText}>{children}</span>
            )}
          </button>
      )
    }
)

Button.displayName = 'Button'