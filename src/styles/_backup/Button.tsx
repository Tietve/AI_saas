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
            ...props
        },
        ref
    ) => {
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
                className={classes}
                disabled={disabled || loading}
                {...props}
            >
                {icon && !loading && <span className={styles.btnIcon}>{icon}</span>}
                {children}
            </button>
        )
    }
)

Button.displayName = 'Button'