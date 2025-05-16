import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

function Home() {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Bienvenido al Sistema de Importación FDN</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Importar Medifarma</Card.Title>
              <Card.Text>
                Importar archivos Excel de Medifarma y gestionar los registros.
              </Card.Text>
              <Link to="/medifarma">
                <Button variant="primary">Ir a Medifarma</Button>
              </Link>
            </Card.Body>
          </Card>
        </div>
        
        <div className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Importar BCP</Card.Title>
              <Card.Text>
                Importar archivos Excel de BCP y gestionar los registros.
              </Card.Text>
              <Link to="/bcp">
                <Button variant="primary">Ir a BCP</Button>
              </Link>
            </Card.Body>
          </Card>
        </div>
        
        <div className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Importar BBVA</Card.Title>
              <Card.Text>
                Importar archivos Excel de BBVA y gestionar los registros.
              </Card.Text>
              <Link to="/bbva">
                <Button variant="primary">Ir a BBVA</Button>
              </Link>
            </Card.Body>
          </Card>
        </div>
        
        <div className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Descuentos por Cliente</Card.Title>
              <Card.Text>
                Importar archivos Excel de descuentos por cliente.
              </Card.Text>
              <Link to="/descuento-cliente">
                <Button variant="primary">Ir a Descuentos</Button>
              </Link>
            </Card.Body>
          </Card>
        </div>
        
        <div className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Exportaciones</Card.Title>
              <Card.Text>
                Exportar datos a diferentes formatos.
              </Card.Text>
              <Link to="/exportaciones">
                <Button variant="primary">Ir a Exportaciones</Button>
              </Link>
            </Card.Body>
          </Card>
        </div>
        
        <div className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Letras</Card.Title>
              <Card.Text>
                Gestionar las letras.
              </Card.Text>
              <Link to="/letras">
                <Button variant="primary">Ir a Letras</Button>
              </Link>
            </Card.Body>
          </Card>
        </div>
        
        <div className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Tipificaciones</Card.Title>
              <Card.Text>
                Gestionar las tipificaciones.
              </Card.Text>
              <Link to="/tipificaciones">
                <Button variant="primary">Ir a Tipificaciones</Button>
              </Link>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Home; 