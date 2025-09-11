import { Link } from 'react-router-dom';
import {
  ArrowUpTrayIcon,
  TagIcon,
  GiftIcon,
  UserGroupIcon,
  ChartBarIcon,
  TableCellsIcon,
  TruckIcon,
  Bars3Icon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

function Home() {
  const moduleGroups = [
    {
      title: 'Importación',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      modules: [
        { name: 'Medifarma', icon: <ArrowUpTrayIcon className="w-5 h-5" />, path: '/medifarma' },
        { name: 'BCP', icon: <ArrowUpTrayIcon className="w-5 h-5" />, path: '/bcp' }
      ]
    },
    {
      title: 'Productos',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      modules: [
        { name: 'Promociones', icon: <TagIcon className="w-5 h-5" />, path: '/promociones' },
        { name: 'Bonificaciones', icon: <GiftIcon className="w-5 h-5" />, path: '/bonificaciones' },
        { name: 'Escalas', icon: <ChartBarIcon className="w-5 h-5" />, path: '/escalas' }
      ]
    },
    {
      title: 'Inventario',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      modules: [
        { name: 'Kardex', icon: <TableCellsIcon className="w-5 h-5" />, path: '/kardex-tabla' },
        { name: 'Guías', icon: <TruckIcon className="w-5 h-5" />, path: '/guias' },
        { name: 'Multi Acción', icon: <Bars3Icon className="w-5 h-5" />, path: '/multi-accion' }
      ]
    },
    {
      title: 'Gestión',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      modules: [
        { name: 'Clientes', icon: <UserGroupIcon className="w-5 h-5" />, path: '/clientes' },
        { name: 'Consulta Productos', icon: <MagnifyingGlassIcon className="w-5 h-5" />, path: '/consulta-productos' },
        { name: 'Reportes', icon: <DocumentTextIcon className="w-5 h-5" />, path: '/reporte-codpro' }
      ]
    }
  ];

  return (
    <div className=" bg-gradient-to-br  p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Dashboard <span className="text-indigo-600">FDN</span>
          </h1>
          <p className="text-slate-600">Panel de control empresarial</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {moduleGroups.map((group, index) => (
            <div key={group.title} className={`${group.bgColor} ${group.borderColor} border rounded-xl p-6 shadow-sm`}>
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 bg-gradient-to-r ${group.color} rounded-full mr-3`}></div>
                <h2 className="text-lg font-semibold text-slate-800">{group.title}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {group.modules.map((module) => (
                  <Link
                    key={module.name}
                    to={module.path}
                    className="group bg-white/80 hover:bg-white p-4 rounded-lg border border-white/50 hover:border-slate-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="p-2 bg-slate-100 group-hover:bg-slate-200 rounded-lg transition-colors">
                        {module.icon}
                      </div>
                      <span className="text-sm font-medium text-slate-700 leading-tight">
                        {module.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Módulos</p>
                <p className="text-xl font-semibold text-slate-800">
                  {moduleGroups.reduce((total, group) => total + group.modules.length, 0)}
                </p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Bars3Icon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Categorías</p>
                <p className="text-xl font-semibold text-slate-800">{moduleGroups.length}</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ChartBarIcon className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Estado</p>
                <p className="text-lg font-semibold text-emerald-600">Activo</p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tiempo</p>
                <p className="text-lg font-semibold text-slate-800">
                  {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 
