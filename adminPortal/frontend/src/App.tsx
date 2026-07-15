import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Activity, 
  Settings, 
  RefreshCw,
  Box,
  LogOut,
  ChevronDown
} from 'lucide-react';
import Login from './components/Login';
import ProjectsView from './components/ProjectsView';

interface Container {
  id: string;
  name: string;
  status: string;
  image: string;
  created: string;
}

interface Stat {
  id: string;
  name: string;
  cpu_percent: number;
  mem_percent: number;
  mem_usage_bytes: number;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('adminToken'));
  const [currentView, setCurrentView] = useState<'overview' | 'projects' | 'finos'>(() => {
    const path = window.location.pathname;
    if (path === '/finos') return 'finos';
    if (path === '/projects') return 'projects';
    return 'overview';
  });
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(() => window.location.pathname === '/finos' || window.location.pathname === '/projects');
  const [containers, setContainers] = useState<Container[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:9000' 
        ? import.meta.env.VITE_API_URL 
        : `http://${window.location.hostname}:9000`;
      const cRes = await fetch(`${apiUrl}/api/containers`);
      if (!cRes.ok) throw new Error('Failed to fetch containers');
      const cData = await cRes.json();
      setContainers(cData.containers);

      const sRes = await fetch(`${apiUrl}/api/stats`);
      if (!sRes.ok) throw new Error('Failed to fetch stats');
      const sData = await sRes.json();
      setStats(sData.stats);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/finos') setCurrentView('finos');
      else if (path === '/projects') setCurrentView('projects');
      else setCurrentView('overview');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const changeView = (view: 'overview' | 'projects' | 'finos') => {
    setCurrentView(view);
    window.history.pushState(null, '', view === 'overview' ? '/' : `/${view}`);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Portal</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => changeView('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              currentView === 'overview' 
                ? 'bg-indigo-500/10 text-indigo-400' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            Overview
          </button>
          
          <div>
            <button 
              onClick={() => {
                if (currentView === 'projects') {
                  setIsProjectsExpanded(!isProjectsExpanded);
                } else {
                  changeView('projects');
                  setIsProjectsExpanded(true);
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium ${
                currentView === 'projects' || currentView === 'finos'
                  ? 'bg-indigo-500/10 text-indigo-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Server className="w-5 h-5" />
                Projects
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isProjectsExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isProjectsExpanded && (
              <div className="ml-8 mt-1 space-y-1">
                <button 
                  onClick={() => changeView('finos')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                    currentView === 'finos' 
                      ? 'text-indigo-400' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  FinOS
                </button>
              </div>
            )}
          </div>

          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-800">
          <button 
            onClick={() => {
              localStorage.removeItem('adminToken');
              setIsAuthenticated(false);
              window.history.pushState(null, '', '/');
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        {currentView !== 'finos' && (
          <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shadow-sm z-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {currentView === 'projects' ? 'Projects Management' : 'System Overview'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Monitor all financial-system projects</p>
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </header>
        )}

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-8">
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
              <strong className="font-semibold">Error: </strong>
              <span>{error}</span>
            </div>
          )}

          {currentView === 'overview' && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="bg-blue-50 p-4 rounded-full">
                    <Box className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Containers</p>
                    <h3 className="text-3xl font-bold text-slate-800">{containers.length}</h3>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="bg-emerald-50 p-4 rounded-full">
                    <Activity className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Running</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      {containers.filter(c => c.status === 'running').length}
                    </h3>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
                  <div className="bg-amber-50 p-4 rounded-full">
                    <Server className="w-8 h-8 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Stopped</p>
                    <h3 className="text-3xl font-bold text-slate-800">
                      {containers.filter(c => c.status !== 'running').length}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Containers List */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
                  <h3 className="font-bold text-slate-800">Docker Containers</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {containers.length === 0 && !loading && !error && (
                    <div className="p-8 text-center text-slate-500">No containers found.</div>
                  )}
                  {containers.map(container => {
                    const stat = stats.find(s => s.id === container.id || s.name === container.name);
                    const isRunning = container.status === 'running';

                    return (
                      <div key={container.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className={`mt-1 w-3 h-3 rounded-full ${isRunning ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                          <div>
                            <h4 className="font-bold text-slate-800">{container.name.replace(/^\//, '')}</h4>
                            <p className="text-sm text-slate-500 mt-1 font-mono text-xs">{container.image}</p>
                          </div>
                        </div>
                        
                        {isRunning && stat && (
                          <div className="flex gap-8 items-center">
                            <div className="w-32">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-500">CPU</span>
                                <span className="font-bold text-slate-700">{stat.cpu_percent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${stat.cpu_percent > 80 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                  style={{ width: `${Math.min(stat.cpu_percent, 100)}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="w-32">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-slate-500">RAM</span>
                                <span className="font-bold text-slate-700">{stat.mem_percent}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${stat.mem_percent > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                                  style={{ width: `${Math.min(stat.mem_percent, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!isRunning && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                            {container.status}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {currentView === 'projects' && (
             <ProjectsView containers={containers} stats={stats} />
          )}

        </div>
        
        {currentView === 'finos' && (
          <div className="flex-1 w-full h-full">
            <iframe 
              src={import.meta.env.VITE_FINOS_FRONTEND_URL || `http://${window.location.hostname}:3000`} 
              className="w-full h-full border-none"
              title="FinOS Dashboard"
            />
          </div>
        )}
      </main>
    </div>
  );
}
