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
  ArrowUpTrayIcon
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
  { name: 'Promociones', path: '/promociones', icon: <ChartBarIcon className="w-6 h-6" /> },
  { name: 'Multi Acción', path: '/multi-accion', icon: <Bars3Icon className="w-6 h-6" /> },
  { 
    name: 'Reportes', 
    icon: <ChartBarIcon className="w-6 h-6" />,
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
  const { isSidebarOpen, toggleSidebar, isSidebarCollapsed } = useSidebar();
  const [openMenus, setOpenMenus] = useState(new Set());
  const [hoveredItem, setHoveredItem] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const submenuTimerRef = useRef(null);
  const itemRefs = useRef({});
  
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
              "w-full flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100",
              (location.pathname === item.path || 
               item.submenu?.some(subItem => location.pathname === subItem.path)) && 
               "bg-primary-50 text-primary-700",
              isSidebarCollapsed && "justify-center"
            )}
          >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            {!isSidebarCollapsed && (
              <>
                <span className="ml-3 flex-grow">{item.name}</span>
                <ChevronDownIcon 
                  className={clsx(
                    "w-5 h-5 transform transition-transform",
                    isMenuOpen(currentPath) ? "rotate-180" : ""
                  )}
                />
              </>
            )}
          </button>
          
          {!isSidebarCollapsed && isMenuOpen(currentPath) && (
            <ul className="pl-12 mt-2 space-y-1">
              {item.submenu.map(subItem => (
                <li key={subItem.name}>
                  {subItem.submenu ? 
                    renderMenuItem(subItem, currentPath) :
                    <Link
                      to={subItem.path}
                      className={clsx(
                        "block px-2 py-1 text-sm text-gray-700 rounded-md hover:bg-gray-100",
                        location.pathname === subItem.path && "text-primary-700 font-medium"
                      )}
                    >
                      {subItem.name}
                    </Link>
                  }
                </li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        to={item.path}
        className={clsx(
          "flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100",
          location.pathname === item.path && "bg-primary-50 text-primary-700",
          isSidebarCollapsed && "justify-center"
        )}
        title={isSidebarCollapsed ? item.name : ""}
      >
        {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
        {!isSidebarCollapsed && <span className="ml-3">{item.name}</span>}
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
        "sidebar fixed bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        isSidebarCollapsed ? "md:w-20" : "md:w-64",
        "overflow-hidden"  // Evita el scroll horizontal
      )}>
        <div className="sidebar-header border-b border-gray-200 flex justify-between items-center h-16 px-4">
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-primary-600">FDN</h1>
          )}
          {isSidebarCollapsed && (
            <span className="text-xl font-bold text-primary-600 w-full text-center">FDN</span>
          )}
        </div>
        
        <div className="sidebar-content">
          <ul className="space-y-2 py-4">
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
          className="fixed bg-white rounded-md shadow-lg border border-gray-200 z-[9999] w-48"
          style={{
            top: `${submenuPosition.top}px`,
            left: `${submenuPosition.left}px`,
          }}
          onMouseEnter={() => clearTimeout(submenuTimerRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="py-2">
            <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-200">
              {menuItems[hoveredItem].name}
            </div>
            <ul className="mt-1">
              {menuItems[hoveredItem].submenu.map(subItem => (
                <li key={subItem.name}>
                  {subItem.submenu ? (
                    <div className="px-4 py-2">
                      <div className="font-medium text-sm">{subItem.name}</div>
                      <ul className="pl-4 mt-1">
                        {subItem.submenu.map(subSubItem => (
                          <li key={subSubItem.name}>
                            <Link
                              to={subSubItem.path}
                              className={clsx(
                                "block px-2 py-1 text-sm text-gray-700 hover:bg-gray-100",
                                location.pathname === subSubItem.path && "text-primary-700 font-medium"
                              )}
                            >
                              {subSubItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                  <Link
                    to={subItem.path}
                    className={clsx(
                      "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                      location.pathname === subItem.path && "bg-primary-50 text-primary-700 font-medium"
                    )}
                  >
                    {subItem.name}
                  </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default Sidebar; 