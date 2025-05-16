import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { useSidebar } from '../App';

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
      { name: 'BCP', path: '/bcp' },
      { name: 'BBVA', path: '/bbva' }
    ]
  },
  { name: 'Importar Descuento Cliente', path: '/descuento-cliente', icon: <UserGroupIcon className="w-6 h-6" /> },
  { name: 'Exportaciones', path: '/exportaciones', icon: <ArrowDownTrayIcon className="w-6 h-6" /> },
  { name: 'Letras', path: '/letras', icon: <DocumentTextIcon className="w-6 h-6" /> },
  { name: 'Tipificaciones', path: '/tipificaciones', icon: <TagIcon className="w-6 h-6" /> },
  { 
    name: 'Reportes', 
    icon: <ChartBarIcon className="w-6 h-6" />,
    submenu: [
      { name: 'Reporte CodPro', path: '/reporte-codpro' }
    ]
  },
];

function Sidebar() {
  const location = useLocation();
  const { isSidebarOpen, toggleSidebar, isSidebarCollapsed } = useSidebar();
  const [openSubMenu, setOpenSubMenu] = useState(null);
  
  const toggleSubMenu = (index) => {
    if (openSubMenu === index) {
      setOpenSubMenu(null);
    } else {
      setOpenSubMenu(index);
    }
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
              <li key={item.name}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubMenu(index)}
                      className={clsx(
                        "w-full flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100",
                        (location.pathname === item.path || 
                         item.submenu?.some(subItem => location.pathname === subItem.path)) && 
                         "bg-primary-50 text-primary-700",
                        isSidebarCollapsed && "justify-center"
                      )}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      {!isSidebarCollapsed && (
                        <>
                          <span className="ml-3 flex-grow">{item.name}</span>
                          <ChevronDownIcon 
                            className={clsx(
                              "w-5 h-5 transform transition-transform",
                              openSubMenu === index ? "rotate-180" : ""
                            )}
                          />
                        </>
                      )}
                    </button>
                    
                    {/* Submenú */}
                    {!isSidebarCollapsed && openSubMenu === index && (
                      <ul className="pl-12 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              to={subItem.path}
                              className={clsx(
                                "block px-2 py-1 text-sm text-gray-700 rounded-md hover:bg-gray-100",
                                location.pathname === subItem.path && "text-primary-700 font-medium"
                              )}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={clsx(
                      "flex items-center px-4 py-2 text-gray-700 rounded-md hover:bg-gray-100",
                      location.pathname === item.path && "bg-primary-50 text-primary-700",
                      isSidebarCollapsed && "justify-center"
                    )}
                    title={isSidebarCollapsed ? item.name : ""}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isSidebarCollapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}

export default Sidebar; 