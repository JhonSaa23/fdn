import { clsx } from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/outline';

function Alert({ variant = 'info', children, onClose, dismissible = false }) {
  return (
    <div className={clsx(
      'alert',
      {
        'alert-info': variant === 'info',
        'alert-success': variant === 'success',
        'alert-warning': variant === 'warning',
        'alert-danger': variant === 'danger',
      }
    )}>
      <div className="flex justify-between items-start">
        <div className="flex-1">{children}</div>
        
        {dismissible && (
          <button
            type="button"
            className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
          >
            <span className="sr-only">Cerrar</span>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert; 