import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useSidebar } from '../App';
import { createPortal } from 'react-dom';

// Iconos importados de heroicons
import { 
  HomeIcon, 
  CubeIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  TagIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ChevronDownIcon,
  ArrowUpTrayIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const menuItems = [
  { name: 'Inicio', path: '/', icon: <HomeIcon className="w-6 h-6" /> },
  { 
    name: 'Importar', 
    icon: <ArrowUpTrayIcon className="w-6 h-6" />,
    submenu: [
      { name: 'Medifarma', path: '/medifarma' },
      { name: 'BCP', path: '/bcp' }
    ]
  },
  { name: 'Exportaciones', path: '/exportaciones', icon: <ArrowDownTrayIcon className="w-6 h-6" /> },
  { name: 'Promociones', path: '/promociones', icon: <TagIcon className="w-6 h-6" /> },
  { name: 'Escalas', path: '/escalas', icon: <ChartBarIcon className="w-6 h-6" /> },
  { name: 'Multi Acción', path: '/multi-accion', icon: <Bars3Icon className="w-6 h-6" /> },
  { 
    name: 'Reportes', 
    icon: <DocumentTextIcon className="w-6 h-6" />,
    submenu: [
      { name: 'Reporte CodPro', path: '/reporte-codpro' },
      { 
        name: 'Procter',
        submenu: [
          { name: 'Picking Cobertura General', path: '/reportes/picking-procter' }
        ]
      },
      {
        name: 'Loreal',
        submenu: [
          { name: 'Notas de Crédito', path: '/reportes/loreal-notas' }
        ]
      },
      { name: 'Concurso', path: '/reportes/concurso' }
    ]
  },
];

function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapse } = useSidebar();
  const [openMenus, setOpenMenus] = useState(new Set());
  const [hoveredItem, setHoveredItem] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const submenuTimerRef = useRef(null);
  const itemRefs = useRef({});

  // Cerrar sidebar automáticamente en móvil al cambiar de ruta
  useEffect(() => {
    if (window.innerWidth < 768 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isSidebarOpen, setIsSidebarOpen]);
  
  const handleMenuClick = () => {
    // En móvil, abre/cierra el sidebar
    if (window.innerWidth < 768) {
      toggleSidebar();
    } 
    // En desktop, colapsa/expande el sidebar
    else {
      toggleSidebarCollapse();
    }
  };
  
  const isMenuOpen = (menuPath) => openMenus.has(menuPath);
  
  const toggleMenu = (menuPath, event) => {
    event.stopPropagation();
    setOpenMenus(prev => {
      const newOpenMenus = new Set(prev);
      if (newOpenMenus.has(menuPath)) {
        newOpenMenus.delete(menuPath);
    } else {
        newOpenMenus.add(menuPath);
    }
      return newOpenMenus;
    });
  };

  const handleMouseEnter = (index) => {
    if (isSidebarCollapsed) {
      clearTimeout(submenuTimerRef.current);
      setHoveredItem(index);
      
      const itemElement = itemRefs.current[index];
      if (itemElement) {
        const rect = itemElement.getBoundingClientRect();
        setSubmenuPosition({
          top: rect.top,
          left: rect.right + 10
        });
      }
    }
  };

  const handleMouseLeave = () => {
    if (isSidebarCollapsed) {
      submenuTimerRef.current = setTimeout(() => {
        setHoveredItem(null);
      }, 300);
    }
  };

  useEffect(() => {
    return () => {
      if (submenuTimerRef.current) {
        clearTimeout(submenuTimerRef.current);
      }
    };
  }, []);

  const renderMenuItem = (item, parentPath = '') => {
    const currentPath = parentPath ? `${parentPath}.${item.name}` : item.name;
    
    if (item.submenu) {
      return (
        <div key={item.name}>
          <button
            onClick={(e) => toggleMenu(currentPath, e)}
            className={clsx(
              "w-full flex items-center px-4 py-2.5 text-slate-700 rounded-lg hover:bg-slate-200/60 transition-all duration-200 border border-transparent hover:border-slate-300/40 hover:shadow-sm group",
              (location.pathname === item.path || 
               item.submenu?.some(subItem => location.pathname === subItem.path)) && 
               "bg-slate-200/80 text-slate-800 border-slate-300/50 shadow-sm",
              isSidebarCollapsed && "justify-center"
            )}
          >
            {item.icon && <span className="flex-shrink-0 text-slate-600 group-hover:text-slate-700">{item.icon}</span>}
            {!isSidebarCollapsed && (
              <>
                <span className="ml-3 flex-grow text-left font-medium">{item.name}</span>
                <ChevronDownIcon 
                  className={clsx(
                    "w-4 h-4 transform transition-transform duration-200 text-slate-500",
                    isMenuOpen(currentPath) ? "rotate-180" : ""
                  )}
                />
              </>
            )}
          </button>
          
          {!isSidebarCollapsed && isMenuOpen(currentPath) && (
            <div className="ml-4 mt-1 space-y-1 relative">
              {/* Línea conectora principal */}
              <div className="absolute left-4 top-0 w-0.5 bg-slate-400 rounded-full opacity-60" style={{ height: `${item.submenu.length * 40}px` }}></div>
              
              {item.submenu.map((subItem, index) => (
                <div key={subItem.name} className="relative">
                  {/* Línea horizontal conectora */}
                  <div className="absolute left-4 top-4 w-3 h-0.5 bg-slate-400 rounded-full opacity-60"></div>
                  
                  {/* Punto de conexión */}
                  <div className="absolute left-3.5 top-3.5 w-1.5 h-1.5 bg-slate-500 rounded-full shadow-sm"></div>
                  
                  {subItem.submenu ? 
                    <div className="ml-6">
                      {renderMenuItem(subItem, currentPath)}
                    </div> :
                    <Link
                      to={subItem.path}
                      className={clsx(
                        "block px-3 py-2 ml-6 text-sm text-slate-600 rounded-md hover:bg-slate-100 transition-all duration-200 hover:text-slate-700 border border-transparent hover:border-slate-200 text-left",
                        location.pathname === subItem.path && "text-slate-700 font-medium bg-slate-100/80 border-slate-200/60"
                      )}
                    >
                      {subItem.name}
                    </Link>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.path}
        className={clsx(
          "flex items-center px-4 py-2.5 text-slate-700 rounded-lg hover:bg-slate-200/60 transition-all duration-200 border border-transparent hover:border-slate-300/40 hover:shadow-sm group",
          location.pathname === item.path && "bg-slate-200/80 text-slate-800 border-slate-300/50 shadow-sm",
          isSidebarCollapsed && "justify-center"
        )}
        title={isSidebarCollapsed ? item.name : ""}
      >
        {item.icon && <span className="flex-shrink-0 text-slate-600 group-hover:text-slate-700">{item.icon}</span>}
        {!isSidebarCollapsed && <span className="ml-3 font-medium text-left">{item.name}</span>}
      </Link>
    );
  };
  
  return (
    <>
      {/* Overlay para dispositivos móviles */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <aside className={clsx(
        "sidebar fixed inset-y-0 left-0 bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-300/60 transition-all duration-300 ease-in-out z-40 shadow-xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        "w-64", // Ancho fijo para móvil
        isSidebarCollapsed ? "md:w-20" : "md:w-64",
        "overflow-hidden flex flex-col"  // Flex column para que el contenido se distribuya correctamente
      )}>
        <div className="sidebar-header border-b border-slate-300/60 flex justify-between items-center h-16 px-4 bg-gradient-to-r from-slate-100/80 to-slate-200/80">
          {!isSidebarCollapsed && (
            <>
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
                FDN
              </h1>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:bg-slate-200/60 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                onClick={handleMenuClick}
                title="Colapsar sidebar"
              >
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
          {isSidebarCollapsed && (
            <div className="w-full flex flex-col items-center space-y-2">
              <span className="text-lg font-bold bg-gradient-to-r from-slate-700 to-slate-600 bg-clip-text text-transparent">
                FDN
              </span>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all"
                onClick={handleMenuClick}
                title="Expandir sidebar"
              >
                <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        
        <div className="sidebar-content flex-1 overflow-y-auto">
          <ul className="space-y-2 py-4 px-2">
            {menuItems.map((item, index) => (
              <li key={item.name} 
                  className="relative"
                  ref={el => itemRefs.current[index] = el}
                  onMouseEnter={() => handleMouseEnter(index)} 
                  onMouseLeave={handleMouseLeave}>
                {renderMenuItem(item)}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      
      {/* Portal para renderizar el submenú flotante fuera del flujo normal del DOM */}
      {isSidebarCollapsed && hoveredItem !== null && menuItems[hoveredItem]?.submenu && createPortal(
        <div 
          className="fixed bg-slate-50/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-300/60 z-[9999] w-56"
          style={{
            top: `${submenuPosition.top}px`,
            left: `${submenuPosition.left}px`,
          }}
          onMouseEnter={() => clearTimeout(submenuTimerRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-3">
            <div className="px-4 py-3 text-sm font-semibold text-slate-700 border-b border-slate-200/60 rounded-t-lg bg-slate-100/60">
              {menuItems[hoveredItem].name}
            </div>
            <div className="mt-2 space-y-1 relative">
              {/* Línea conectora principal para el menú flotante */}
              <div className="absolute left-4 top-0 w-0.5 bg-slate-400 rounded-full opacity-60" style={{ height: `${menuItems[hoveredItem].submenu.length * 40 - 8}px` }}></div>
              
              {menuItems[hoveredItem].submenu.map((subItem, index) => (
                <div key={subItem.name} className="relative">
                  {subItem.submenu ? (
                    <div className="px-2 py-1">
                      {/* Línea horizontal conectora */}
                      <div className="absolute left-4 top-4 w-3 h-0.5 bg-slate-400 rounded-full opacity-60"></div>
                      {/* Punto de conexión */}
                      <div className="absolute left-3.5 top-3.5 w-1.5 h-1.5 bg-slate-500 rounded-full shadow-sm"></div>
                      
                      <div className="font-medium text-sm text-slate-700 ml-6 mb-1 px-2 py-1 rounded-md bg-slate-100/60">
                        {subItem.name}
                      </div>
                      <div className="ml-8 space-y-1 relative">
                        {/* Línea conectora secundaria */}
                        <div className="absolute left-2 top-0 w-0.5 bg-slate-400 rounded-full opacity-50" style={{ height: `${subItem.submenu.length * 32 - 4}px` }}></div>
                        
                        {subItem.submenu.map((subSubItem, subIndex) => (
                          <div key={subSubItem.name} className="relative">
                            {/* Línea horizontal secundaria */}
                            <div className="absolute left-2 top-3 w-2.5 h-0.5 bg-slate-400 rounded-full opacity-50"></div>
                            {/* Punto de conexión secundario */}
                            <div className="absolute left-1.5 top-2.5 w-1 h-1 bg-slate-500 rounded-full shadow-sm"></div>
                            
                            <Link
                              to={subSubItem.path}
                              className={clsx(
                                "block px-3 py-1.5 ml-5 text-sm text-slate-600 hover:bg-slate-200/60 transition-all duration-200 hover:text-slate-700 border border-transparent hover:border-slate-200 rounded-md",
                                location.pathname === subSubItem.path && "text-slate-700 font-medium bg-slate-200/80 border-slate-200/60"
                              )}
                            >
                              {subSubItem.name}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Línea horizontal conectora */}
                      <div className="absolute left-4 top-4 w-3 h-0.5 bg-slate-400 rounded-full opacity-60"></div>
                      {/* Punto de conexión */}
                      <div className="absolute left-3.5 top-3.5 w-1.5 h-1.5 bg-slate-500 rounded-full shadow-sm"></div>
                      
                      <Link
                        to={subItem.path}
                        className={clsx(
                          "block px-3 py-2 ml-6 text-sm text-slate-600 hover:bg-slate-200/60 transition-all duration-200 hover:text-slate-700 border border-transparent hover:border-slate-300/40 rounded-md",
                          location.pathname === subItem.path && "bg-slate-200/80 text-slate-700 border-slate-300/50 font-medium"
                        )}
                      >
                        {subItem.name}
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default Sidebar; 