import React, { useEffect, useState } from 'react';
import { listarBonificaciones } from '../services/api';

const columnas = [
  { key: 'Codproducto', label: 'Codproducto' },
  { key: 'Factor', label: 'Factor' },
  { key: 'CodBoni', label: 'CodBoni' },
  { key: 'Cantidad', label: 'Cantidad' },
];

const Bonificaciones = () => {
  const [filtros, setFiltros] = useState({ Codproducto: '', Factor: '', CodBoni: '', Cantidad: '' });
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await listarBonificaciones(filtros);
        const ordenados = [...res.data].sort((a, b) => String(a.Codproducto).localeCompare(String(b.Codproducto)));
        setDatos(ordenados);
      } catch (e) {
        setDatos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filtros]);

  const handleFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros(f => ({ ...f, [name]: value }));
  };

  return (
    <div className="">
      <h2 className="text-2xl font-bold mb-4">Bonificaciones</h2>
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              {columnas.map(col => (
                <th key={col.key} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-50">
                  <input
                    type="text"
                    name={col.key}
                    value={filtros[col.key]}
                    onChange={handleFiltro}
                    placeholder={`Filtrar ${col.label}`}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  />
                </th>
              ))}
            </tr>
            <tr>
              {columnas.map(col => (
                <th key={col.key} className="px-4 py-2 text-left text-xs font-semibold text-gray-700 bg-gray-100">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columnas.length} className="text-center py-4">Cargando...</td></tr>
            ) : datos.length === 0 ? (
              <tr><td colSpan={columnas.length} className="text-center py-4">Sin resultados</td></tr>
            ) : (
              datos.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columnas.map(col => (
                    <td key={col.key} className="px-4 py-2 text-sm">{row[col.key]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bonificaciones; 