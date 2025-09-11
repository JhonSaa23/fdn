import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useSidebar } from '../App';
import { createPortal } from 'react-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

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
  ChevronRightIcon,
  TruckIcon,
  TableCellsIcon,
  GiftIcon,
  ClipboardDocumentListIcon,
  ArchiveBoxIcon,
  PuzzlePieceIcon,
  ArrowRightOnRectangleIcon,
  ShoppingCartIcon,
  FolderIcon
} from '@heroicons/react/24/outline';

// Mapeo de iconos para renderizar dinámicamente
const iconMap = {
  'HomeIcon': HomeIcon,
  'ArrowUpTrayIcon': ArrowUpTrayIcon,
  'TagIcon': TagIcon,
  'GiftIcon': GiftIcon,
  'ArchiveBoxIcon': ArchiveBoxIcon,
  'ArrowDownTrayIcon': ArrowDownTrayIcon,
  'UserGroupIcon': UserGroupIcon,
  'ChartBarIcon': ChartBarIcon,
  'TableCellsIcon': TableCellsIcon,
  'TruckIcon': TruckIcon,
  'Bars3Icon': Bars3Icon,
  'DocumentTextIcon': DocumentTextIcon,
  'MagnifyingGlassIcon': MagnifyingGlassIcon,
  'PuzzlePieceIcon': PuzzlePieceIcon,
  'ShoppingCartIcon': ShoppingCartIcon,
  'FolderIcon': FolderIcon
};

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapse } = useSidebar();
  const { usuario, logout } = useAuth();
  const { getMenuItems, loading } = usePermissions();
  const [openMenus, setOpenMenus] = useState(new Set());
  const [hoveredItem, setHoveredItem] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const submenuTimerRef = useRef(null);
  const itemRefs = useRef({});

  // Cerrar sidebar automáticamente en móvil al cambiar de ruta
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false); // Cerrar sidebar en móvil al cambiar de ruta
    }
  }, [location.pathname]); // Solo ejecutar cuando cambie la ruta
  
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

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    
    // Renderizar icono dinámicamente
    const IconComponent = iconMap[item.icon];
    const iconElement = IconComponent ? <IconComponent className="w-4 h-4" /> : null;
    
    if (item.submenu) {
      return (
        <div key={item.name}>
          <button
            onClick={(e) => toggleMenu(currentPath, e)}
            className={clsx(
              "w-full flex items-center px-4 py-1.5 text-white rounded-lg hover:bg-white/30 transition-all duration-200 border border-transparent hover:border-white/40 hover:shadow-md group",
              (location.pathname === item.path || 
               item.submenu?.some(subItem => location.pathname === subItem.path)) && 
               "bg-white/40 text-white border-white/50 shadow-md",
              isSidebarCollapsed && "justify-center"
            )}
          >
            {iconElement && <span className="flex-shrink-0 text-white group-hover:text-white">{iconElement}</span>}
            {!isSidebarCollapsed && (
              <>
                <span className="ml-3 flex-grow text-left font-medium">{item.name}</span>
                <ChevronDownIcon 
                  className={clsx(
                    "w-3 h-3 transform transition-transform duration-200 text-white",
                    isMenuOpen(currentPath) ? "rotate-180" : ""
                  )}
                />
              </>
            )}
          </button>
          
          {!isSidebarCollapsed && isMenuOpen(currentPath) && (
            <div className="ml-4 mt-0.5 space-y-0.5 relative">
              {/* Línea conectora principal */}
              <div className="absolute left-4 top-0 w-0.5 bg-white/60 rounded-full" style={{ height: `${item.submenu.length * 32}px` }}></div>
              
              {item.submenu.map((subItem, index) => (
                <div key={subItem.name} className="relative">
                  {/* Línea horizontal conectora */}
                  <div className="absolute left-4 top-3 w-3 h-0.5 bg-white/60 rounded-full"></div>
                  
                  {/* Punto de conexión */}
                  <div className="absolute left-3.5 top-2.5 w-1.5 h-1.5 bg-white/80 rounded-full shadow-sm"></div>
                  
                  {subItem.submenu ? 
                    <div className="ml-6">
                      {renderMenuItem(subItem, currentPath)}
                    </div> :
                    <Link
                      to={subItem.path}
                      className={clsx(
                        "block px-3 py-1 ml-6 text-sm text-white/90 rounded-md hover:bg-white/20 transition-all duration-200 hover:text-white border border-transparent hover:border-white/30 text-left",
                        location.pathname === subItem.path && "text-white font-medium bg-white/30 border-white/40"
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
          "flex items-center px-4 py-1.5 text-white rounded-lg hover:bg-white/30 transition-all duration-200 border border-transparent hover:border-white/40 hover:shadow-md group",
          location.pathname === item.path && "bg-white/40 text-white border-white/50 shadow-md",
          isSidebarCollapsed && "justify-center"
        )}
        title={isSidebarCollapsed ? item.name : ""}
      >
        {iconElement && <span className="flex-shrink-0 text-white group-hover:text-white">{iconElement}</span>}
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
        "sidebar fixed inset-y-0 left-0 border-r border-blue-200/60 transition-all duration-300 ease-in-out z-40 shadow-xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:translate-x-0",
        "w-64", // Ancho fijo para móvil
        isSidebarCollapsed ? "md:w-20" : "md:w-64",
        "overflow-hidden flex flex-col"  // Flex column para que el contenido se distribuya correctamente
      )} style={{ backgroundColor: 'var(--color-primary)' }}>
        <div className="sidebar-header border-b border-white/20 flex justify-between items-center h-16 px-4 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
          {!isSidebarCollapsed && (
            <>
              <div className="flex items-center bg-white/60 rounded-lg px-3 py-2 backdrop-blur-sm shadow-md">
                <img 
                  src="/locoFDN_3-R.png" 
                  alt="Fármacos del Norte" 
                  className="h-8 w-auto object-contain"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                onClick={handleMenuClick}
                title="Colapsar sidebar"
              >
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
          {isSidebarCollapsed && (
            <div className="w-full flex flex-col items-center space-y-2">
              <div className="bg-white/40 rounded-lg p-2 backdrop-blur-sm shadow-md">
                <img 
                  src="/logoFDN.png" 
                  alt="FDN" 
                  className="h-6 w-6 object-contain"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-1.5 text-white hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                onClick={handleMenuClick}
                title="Expandir sidebar"
              >
                <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        
        <div className="sidebar-content flex-1 overflow-y-auto sidebar-scroll">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <ul className="space-y-1 py-3 px-2">
              {getMenuItems().map((item, index) => (
                <li key={item.name} 
                    className="relative truncate"
                    ref={el => itemRefs.current[index] = el}
                    onMouseEnter={() => handleMouseEnter(index)} 
                    onMouseLeave={handleMouseLeave}>
                  {renderMenuItem(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        {/* Footer del sidebar con información del usuario y logout */}
        <div className="sidebar-footer border-t border-white/20 p-3 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}>
          {usuario && (
            <div>
              {!isSidebarCollapsed ? (
                <div className="p-3 rounded-xl bg-white/10 border shadow-lg backdrop-blur-sm">
                  {/* Información del usuario con botón de logout al lado derecho */}
                  <div className="flex items-center justify-between">
                    {/* Información del usuario */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {usuario.nombres}
                      </div>
                      <div className="text-xs text-white/90 truncate">
                        {usuario.rol}
                      </div>
                    </div>
                    
                    {/* Botón de logout al lado derecho */}
                    <button
                      onClick={handleLogout}
                      className="ml-3 flex items-center justify-center w-8 h-8 text-white rounded-lg hover:bg-red-500/30 hover:text-red-200 transition-all duration-200 border border-transparent hover:border-red-300/60 hover:shadow-md group flex-shrink-0"
                      title="Cerrar sesión"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Solo botón de logout cuando está colapsado */
                <div className="flex justify-center">
                  <button
                    onClick={handleLogout}
                    className="w-8 h-8 flex items-center justify-center text-white rounded-lg hover:bg-red-500/30 hover:text-red-200 transition-all duration-200 border border-transparent hover:border-red-300/60 hover:shadow-md group"
                    title="Cerrar sesión"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
      
      {/* Portal para renderizar el submenú flotante fuera del flujo normal del DOM */}
      {isSidebarCollapsed && hoveredItem !== null && getMenuItems()[hoveredItem]?.submenu && createPortal(
        <div 
          className="fixed bg-blue-50/95 backdrop-blur-md rounded-lg shadow-xl border border-blue-300/60 z-[9999] w-56"
          style={{
            top: `${submenuPosition.top}px`,
            left: `${submenuPosition.left}px`,
          }}
          onMouseEnter={() => clearTimeout(submenuTimerRef.current)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="p-3">
            <div className="px-4 py-3 text-sm font-semibold text-blue-700 border-b border-blue-200/60 rounded-t-lg bg-blue-100/60">
              {getMenuItems()[hoveredItem].name}
            </div>
            <div className="mt-2 space-y-1 relative">
              {/* Línea conectora principal para el menú flotante */}
              <div className="absolute left-4 top-0 w-0.5 bg-blue-400 rounded-full opacity-60" style={{ height: `${getMenuItems()[hoveredItem].submenu.length * 40 - 8}px` }}></div>
              
              {getMenuItems()[hoveredItem].submenu.map((subItem, index) => (
                <div key={subItem.name} className="relative">
                  {subItem.submenu ? (
                    <div className="px-2 py-1">
                      {/* Línea horizontal conectora */}
                      <div className="absolute left-4 top-4 w-3 h-0.5 bg-blue-400 rounded-full opacity-60"></div>
                      {/* Punto de conexión */}
                      <div className="absolute left-3.5 top-3.5 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-sm"></div>
                      
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
                                "block px-3 py-1.5 ml-5 text-sm text-blue-700 hover:bg-blue-100/60 transition-all duration-200 hover:text-blue-800 border border-transparent hover:border-blue-200 rounded-md",
                                location.pathname === subSubItem.path && "text-blue-800 font-medium bg-blue-100/80 border-blue-200/60"
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
                          "block px-3 py-2 ml-6 text-sm text-blue-700 hover:bg-blue-100/60 transition-all duration-200 hover:text-blue-800 border border-transparent hover:border-blue-200/40 rounded-md",
                          location.pathname === subItem.path && "bg-blue-100/80 text-blue-800 border-blue-200/50 font-medium"
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
