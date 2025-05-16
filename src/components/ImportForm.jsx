import { useState } from 'react';
import Alert from './Alert';
import Button from './Button';
import Card from './Card';

function ImportForm({ onImportClick, title, isLoading }) {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ show: false, type: '', text: '' });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage({
        show: true,
        type: 'danger',
        text: 'Por favor seleccione un archivo'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const result = await onImportClick(formData);
      
      if (!result || !result.success) {
        setMessage({
          show: true,
          type: 'danger',
          text: result?.error || 'Error desconocido al importar el archivo'
        });
        return;
      }
      
      // Solo mostrar mensaje en el formulario si no viene desde el componente padre
      if (!result.suppressMessage) {
        setMessage({
          show: true,
          type: 'success',
          text: result.message || 'Archivo importado correctamente'
        });
      }
      
      // Limpiar el input de archivo
      if (result.success) {
        e.target.reset();
        setFile(null);
      }
      
    } catch (error) {
      console.error('Error en la importación:', error);
      setMessage({
        show: true,
        type: 'danger',
        text: error.message || 'Error al importar archivo'
      });
    }
  };

  return (
    <Card className="mb-6">
      <Card.Header>
        <Card.Title>{title || 'Importar archivo Excel'}</Card.Title>
      </Card.Header>
      
      <Card.Body>
        {message.show && (
          <Alert 
            variant={message.type} 
            onClose={() => setMessage({ ...message, show: false })} 
            dismissible
          >
            {message.text}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="formFile" className="block text-sm font-medium text-gray-700 mb-1">
              Elija Archivo Excel
            </label>
            <input 
              type="file" 
              id="formFile"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              onChange={handleFileChange}
              accept=".xls,.xlsx,.csv"
              disabled={isLoading}
            />
          </div>
          
          <div className="mt-4">
            <Button 
              type="submit" 
              variant="primary"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Importando...
                </>
              ) : 'Importar Registros'}
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  );
}

export default ImportForm; 