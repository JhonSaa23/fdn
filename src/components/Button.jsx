import { clsx } from 'clsx';

function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      className={clsx(
        'btn',
        {
          'btn-primary': variant === 'primary',
          'btn-secondary': variant === 'secondary',
          'btn-danger': variant === 'danger',
          'btn-success': variant === 'success',
          'btn-warning': variant === 'warning',
          'px-2 py-1 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled,
        },
        className
      )}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button; 