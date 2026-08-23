import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Play, Shield, Code, Settings, AlertTriangle } from 'lucide-react';

export default function AgentView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    api.get(`/agents/${id}`).then(res => setAgent(res.data));
    api.get(`/agents/${id}/versions`).then(res => setVersions(res.data));
  }, [id]);

  const runEvaluation = async () => {
    if (versions.length === 0) return;
    setIsRunning(true);
    try {
      const res = await api.post(`/evaluations/run/${versions[0].id}`);
      navigate(`/reports/${res.data.id}`);
    } catch (e) {
      console.error(e);
      setIsRunning(false);
    }
  };

  if (!agent) return <div className="animate-pulse">Loading agent profile...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
          <p className="text-gray-400 mt-2 max-w-2xl">{agent.description}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={async () => {
              try {
                alert("Generating scenarios... This will take a few seconds.");
                await api.post(`/agents/${id}/scenarios/generate`);
                alert("Scenarios generated successfully!");
              } catch (e: any) {
                alert("Failed to generate scenarios: " + (e.response?.data?.detail || e.message));
              }
            }}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-black/20"
          >
            Generate Scenarios
          </button>
          <button 
            onClick={runEvaluation}
            disabled={isRunning}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-medium transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isRunning ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={20} />}
            Run Evaluation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Code size={20} className="text-primary"/> System Prompt</h2>
            <pre className="bg-black/50 p-4 rounded-xl text-sm text-gray-300 whitespace-pre-wrap font-mono border border-white/5">
              {agent.system_prompt}
            </pre>
          </div>
          
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Settings size={20} className="text-primary"/> Available Tools</h2>
            <div className="space-y-4">
              {agent.tools_schema.map((tool: any, i: number) => (
                <div key={i} className="p-4 bg-black/30 rounded-xl border border-white/5">
                  <h3 className="font-medium text-blue-400">{tool.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2"><Shield size={20} /> Guardrail Policies</h2>
            <ul className="space-y-3">
              {agent.policies.map((policy: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm text-gray-300">
                  <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{policy}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
