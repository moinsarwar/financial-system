import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Server, 
  Activity, 
  Settings, 
  RefreshCw,
  Box,
  LogOut,
  ChevronDown,
  Play,
  Square,
  Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import Login from './components/Login';
import ProjectsView from './components/ProjectsView';
import FinosClients from './components/finos/FinosClients';
import FinosApplications from './components/finos/FinosApplications';
import FinosProducts from './components/finos/FinosProducts';
import FinosMarketplace from './components/finos/FinosMarketplace';
import FinosClaims from './components/finos/FinosClaims';
import FinosDocuments from './components/finos/FinosDocuments';

interface Container {
  id: string;
  name: string;
  status: string;
  image: string;
  created: string;
  startedAt?: string;
}

interface Stat {
  id: string;
  name: string;
  cpu_percent: number;
  mem_percent: number;
  mem_usage_bytes: number;
}

export default function App() {
  const backendUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'http://localhost:9000' 
    ? import.meta.env.VITE_API_URL 
    : `http://${window.location.hostname}:9000`;
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('adminToken'));
  const [currentView, setCurrentView] = useState<'overview' | 'projects' | 'finos-clients' | 'finos-applications' | 'finos-products' | 'finos-marketplace' | 'finos-claims' | 'finos-documents'>(() => {
    const path = window.location.pathname;
    if (path.startsWith('/finos-')) return path.substring(1) as any;
    if (path === '/projects') return 'projects';
    return 'overview';
  });
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(() => window.location.pathname.startsWith('/finos') || window.location.pathname === '/projects');
  const [isFinosExpanded, setIsFinosExpanded] = useState(() => window.location.pathname.startsWith('/finos'));
  const [containers, setContainers] = useState<Container[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).format(new Date(dateStr));
    } catch(e) {
      return dateStr;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const [contRes, statRes] = await Promise.all([
        fetch(`${backendUrl}/api/containers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${backendUrl}/api/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (!contRes.ok || !statRes.ok) {
        throw new Error('Failed to fetch system data');
      }

      const contData = await contRes.json();
      const statData = await statRes.json();
      
      setContainers(contData.containers);
      setStats(statData.stats);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContainerAction = async (id: string, action: 'start' | 'stop' | 'delete') => {
    const actionText = action === 'delete' ? 'delete' : action;
    const confirmResult = await Swal.fire({
      title: 'Are you sure?',
      text: `You want to ${actionText} this container?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#d33',
      confirmButtonText: `Yes, ${actionText} it!`
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const token = localStorage.getItem('adminToken');
      const method = action === 'delete' ? 'DELETE' : 'POST';
      const res = await fetch(`${backendUrl}/api/containers/${id}${action === 'delete' ? '' : '/' + action}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || `Failed to ${action} container`);
      
      Swal.fire('Success', data.message || `Container ${action}ed successfully.`, 'success');
      fetchData();
    } catch (err: any) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/finos-')) setCurrentView(path.substring(1) as any);
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

  const changeView = (view: 'overview' | 'projects' | 'finos-clients' | 'finos-applications' | 'finos-products' | 'finos-marketplace' | 'finos-claims' | 'finos-documents') => {
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
                currentView === 'projects' || currentView.startsWith('finos-')
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
                  onClick={() => setIsFinosExpanded(!isFinosExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all text-sm font-medium ${
                    currentView.startsWith('finos-') 
                      ? 'text-indigo-400 bg-indigo-500/5' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    FinOS
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${isFinosExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {isFinosExpanded && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-slate-800 pl-2">
                    <button onClick={() => changeView('finos-clients')} className={`w-full flex items-center px-4 py-2 rounded-xl transition-all text-sm font-medium ${currentView === 'finos-clients' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      Clients
                    </button>
                    <button onClick={() => changeView('finos-applications')} className={`w-full flex items-center px-4 py-2 rounded-xl transition-all text-sm font-medium ${currentView === 'finos-applications' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      Applications
                    </button>
                    <button onClick={() => changeView('finos-products')} className={`w-full flex items-center px-4 py-2 rounded-xl transition-all text-sm font-medium ${currentView === 'finos-products' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      Client Products
                    </button>
                    <button onClick={() => changeView('finos-marketplace')} className={`w-full flex items-center px-4 py-2 rounded-xl transition-all text-sm font-medium ${currentView === 'finos-marketplace' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      Marketplace Products
                    </button>
                    <button onClick={() => changeView('finos-claims')} className={`w-full flex items-center px-4 py-2 rounded-xl transition-all text-sm font-medium ${currentView === 'finos-claims' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      Claims
                    </button>
                    <button onClick={() => changeView('finos-documents')} className={`w-full flex items-center px-4 py-2 rounded-xl transition-all text-sm font-medium ${currentView === 'finos-documents' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                      Documents
                    </button>
                  </div>
                )}
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
        {!currentView.startsWith('finos-') && (
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
        {!currentView.startsWith('finos-') && (
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
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                              {container.name.replace(/^\//, '')}
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 font-mono">
                                {container.id.substring(0, 12)}
                              </span>
                            </h4>
                            <p className="text-sm text-slate-500 mt-1 font-mono text-xs truncate max-w-[200px]" title={container.image}>{container.image}</p>
                            <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-slate-400">
                              <p>Created: {formatDate(container.created)}</p>
                              {container.startedAt && container.startedAt !== '0001-01-01T00:00:00Z' && (
                                <p>Started: {formatDate(container.startedAt)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          {isRunning && stat && (
                            <div className="flex gap-8 items-center mr-4">
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
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 mr-4">
                              {container.status}
                            </span>
                          )}

                          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                            {!isRunning ? (
                              <button 
                                onClick={() => handleContainerAction(container.id, 'start')}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Start Container"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleContainerAction(container.id, 'stop')}
                                className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Stop Container"
                              >
                                <Square className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              onClick={() => handleContainerAction(container.id, 'delete')}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Container"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
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
        )}
        
        {currentView.startsWith('finos-') && (
          <div className="flex-1 w-full h-full overflow-y-auto bg-slate-50">
            {currentView === 'finos-clients' && <FinosClients />}
            {currentView === 'finos-applications' && <FinosApplications />}
            {currentView === 'finos-products' && <FinosProducts />}
            {currentView === 'finos-marketplace' && <FinosMarketplace />}
            {currentView === 'finos-claims' && <FinosClaims />}
            {currentView === 'finos-documents' && <FinosDocuments />}
          </div>
        )}
      </main>
    </div>
  );
}
