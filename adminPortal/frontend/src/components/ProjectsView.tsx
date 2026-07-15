import { useState } from 'react';

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

export default function ProjectsView({ containers, stats }: { containers: Container[], stats: Stat[] }) {
  const [selectedProject, setSelectedProject] = useState('finos');

  const projectContainers = containers.filter(c => c.name.toLowerCase().includes(selectedProject.toLowerCase()));

  return (
    <div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Select Project</h3>
            <p className="text-sm text-slate-500 mt-1">Manage individual project configurations and instances</p>
          </div>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 min-w-[200px]"
          >
            <option value="finos">finOS</option>
            {/* Future projects */}
          </select>
        </div>

        {selectedProject === 'finos' && (
          <div className="pt-6 border-t border-slate-100">
            <h4 className="font-semibold text-slate-700 mb-4">Quick Links</h4>
            <div className="flex flex-wrap gap-4">
              <a href={import.meta.env.VITE_FINOS_FRONTEND_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-100 transition-colors">
                Open Frontend
              </a>
              <a href={import.meta.env.VITE_FINOS_BACKEND_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-100 transition-colors">
                Open Backend API
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-800">Related Containers ({projectContainers.length})</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {projectContainers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No containers found for this project.</div>
          ) : (
            projectContainers.map(container => {
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
