import React from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />
        
        {/* Modal */}
        <div 
          className={`inline-block w-full ${sizeClasses[size]} p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="mt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalBody = ({ children }) => (
  <div className="py-4">
    {children}
  </div>
);

const ModalFooter = ({ children }) => (
  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
    {children}
  </div>
);

Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export default Modal; 