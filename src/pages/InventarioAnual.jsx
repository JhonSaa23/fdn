import { useState, useEffect, useRef, useCallback } from 'react';
import axiosClient from '../services/axiosClient';

const ITEMS_PER_PAGE = 250;

const InventarioAnual = () => {
    const [allItems, setAllItems] = useState([]);
    const [visibleData, setVisibleData] = useState([]);
    const [loading, setLoading] = useState(true); // Carga inicial
    const [loadingMore, setLoadingMore] = useState(false); // Carga al scrollear
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const observerTarget = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get('/inventario-anual');
                if (response.data.success) {
                    const data = response.data.data;
                    setAllItems(data);
                    // Cargar primeros 250
                    setVisibleData(data.slice(0, ITEMS_PER_PAGE));
                } else {
                    setError('Error cargando datos');
                }
            } catch (err) {
                console.error('Error:', err);
                setError('Error de conexión');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const loadMore = useCallback(() => {
        if (loadingMore || visibleData.length >= allItems.length) return;

        setLoadingMore(true);
        // Simular un pequeño delay para que se vea la animación si es muy rápido
        setTimeout(() => {
            const nextPage = page + 1;
            const nextItems = allItems.slice(0, nextPage * ITEMS_PER_PAGE);
            setVisibleData(nextItems);
            setPage(nextPage);
            setLoadingMore(false);
        }, 500);
    }, [page, allItems, visibleData.length, loadingMore]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [loadMore]);

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error) return <div className="p-4 text-red-500">{error}</div>;
    if (!allItems || allItems.length === 0) return <div className="p-4">No hay datos disponibles</div>;

    // Obtener cabeceras dinámicamente del primer elemento
    const headers = Object.keys(allItems[0]);

    return (
        <div className="p-4 bg-white rounded-lg shadow h-full flex flex-col">
            <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200 relative">
                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            {headers.map((header) => (
                                <th
                                    key={header}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {visibleData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                {headers.map((header) => (
                                    <td key={`${index}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {row[header]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Elemento observador para infinite scroll */}
                <div ref={observerTarget} className="h-10 w-full flex items-center justify-center py-4">
                    {loadingMore && (
                        <div className="flex items-center space-x-2 text-blue-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                            <span className="text-sm font-medium">Cargando más registros...</span>
                        </div>
                    )}
                    {!loadingMore && visibleData.length >= allItems.length && allItems.length > 0 && (
                        <span className="text-xs text-gray-400">Fin de los registros ({allItems.length})</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventarioAnual;
