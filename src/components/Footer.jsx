import React from 'react';

function Footer() {
  return (
    <footer className="mt-auto py-6 bg-gray-100 border-t border-gray-200">
      <div className="container mx-auto px-4">
        <span className="text-sm text-gray-600">
          Sistema de Importación FDN &copy; {new Date().getFullYear()}
        </span>
      </div>
    </footer>
  );
}

export default Footer; 