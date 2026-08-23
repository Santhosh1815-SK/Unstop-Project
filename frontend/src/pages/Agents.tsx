import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Play, Settings, Bot, Cpu } from 'lucide-react';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/agents/').then(res => setAgents(res.data)).catch(console.error);
  }, []);

  const runEvaluation = async (agentId: number) => {
    setLoading(true);
    try {
      const res = await api.post(`/evaluations/run?agent_id=${agentId}`);
      navigate(`/evaluations?id=${res.data.id}`);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to run evaluation");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Configured Agents</h1>
          <p className="text-zinc-400 mt-1 text-sm">Manage agent logic, tools, and trigger security evaluations.</p>
        </div>
        <button onClick={() => navigate('/connect')} className="bg-zinc-100 text-zinc-900 hover:bg-white px-4 py-2 rounded-md text-sm font-semibold transition-colors">
          Connect Agent
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent: any) => (
          <div key={agent.id} className="panel p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-300">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-200">{agent.name}</h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="badge border-zinc-700 text-zinc-400 bg-zinc-800/50">v{agent.version}</span>
                      {agent.agent_type === 'EXTERNAL_API' ? (
                        <span className="badge border-indigo-500/30 text-indigo-400 bg-indigo-500/10">EXTERNAL API</span>
                      ) : (
                        <span className="badge border-emerald-500/30 text-emerald-400 bg-emerald-500/10">DEMO</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 mb-6 line-clamp-2 leading-relaxed">{agent.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 mr-1.5" />
                  Mounted Tools ({agent.tools?.length || 0})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tools?.slice(0, 3).map((t: any) => (
                    <span key={t.id} className="text-xs bg-zinc-800/50 border border-zinc-800 px-2 py-1 rounded text-zinc-300">{t.name}</span>
                  ))}
                  {agent.tools?.length > 3 && <span className="text-xs text-zinc-500 py-1">+{agent.tools.length - 3} more</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 pt-5 border-t border-zinc-800/80">
              <button 
                onClick={() => runEvaluation(agent.id)}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-semibold hover:bg-blue-500 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{loading ? 'Executing...' : 'Run Evaluation'}</span>
              </button>
              <button className="p-2 border border-zinc-800 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {agents.length === 0 && (
          <div className="col-span-full text-center py-16 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-sm text-zinc-500">No agents registered in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
