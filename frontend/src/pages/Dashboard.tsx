import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Shield, AlertTriangle, ShieldCheck, Rocket, Activity } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  
  useEffect(() => {
    fetchLatest();
  }, []);

  const fetchLatest = () => {
    api.get('/evaluations').then(res => {
      if (res.data && res.data.length > 0) {
        setData(res.data[0]);
      }
    }).catch(console.error);
  };

  const runDemo = async () => {
    setDemoLoading(true);
    try {
      await api.post('/demo/run');
      alert("Demo execution complete! The database has been seeded with adversarial scenarios, execution traces, and regression data. Check the sidebar tabs to explore.");
      fetchLatest();
    } catch (e: any) {
      alert("Failed to run demo.");
      console.error(e);
    }
    setDemoLoading(false);
  };

  const buildStatus = data?.build_status || (data?.overall_score >= 80 ? "BUILD_PASSED" : "BUILD_FAILED");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Platform Overview</h1>
            {data && (
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${buildStatus === 'BUILD_PASSED' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                {buildStatus === 'BUILD_PASSED' ? 'BUILD PASSED' : 'BUILD FAILED'}
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-sm">Security and reliability metrics across all deployed agents.</p>
        </div>
        <button 
          onClick={runDemo} 
          disabled={demoLoading}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-bold hover:bg-blue-500 flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:shadow-none"
        >
          <Rocket className="w-4 h-4" />
          <span>{demoLoading ? 'Executing Sandbox CI/CD Pipeline...' : 'RUN HACKATHON DEMO'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="panel p-5">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-zinc-400">Overall Reliability</p>
            <ShieldCheck className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">{data?.overall_score || 0}</h2>
            <span className="text-sm text-zinc-500">/ 100</span>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 mt-4 rounded-full overflow-hidden">
             <div className="bg-blue-500 h-full" style={{ width: `${data?.overall_score || 0}%` }} />
          </div>
        </div>
        
        <div className="panel p-5">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-zinc-400">Policy Compliance</p>
            <Shield className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">{data?.score_policy || 0}%</h2>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 mt-4 rounded-full overflow-hidden">
             <div className="bg-indigo-500 h-full" style={{ width: `${data?.score_policy || 0}%` }} />
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-zinc-400">Security Risk</p>
            <AlertTriangle className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-3xl font-semibold tracking-tight text-red-400">{100 - (data?.score_security || 100)}%</h2>
          </div>
          <div className="w-full bg-zinc-800 h-1.5 mt-4 rounded-full overflow-hidden">
             <div className="bg-red-500 h-full" style={{ width: `${100 - (data?.score_security || 100)}%` }} />
          </div>
        </div>

        <div className="panel p-5">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-zinc-400">Test Scenarios</p>
            <Activity className="w-5 h-5 text-zinc-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-100">
              {data ? data.executions?.length || 0 : 0}
            </h2>
          </div>
          <p className="text-xs text-zinc-500 mt-4">Total execution traces analyzed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="panel p-6">
           <h3 className="text-base font-semibold mb-6 text-zinc-200">Sub-Score Breakdown</h3>
           <div className="space-y-5">
              {[
                { name: 'Robustness', score: data?.score_robustness || 0, color: 'bg-emerald-500' },
                { name: 'Goal Adherence', score: data?.score_goal || 0, color: 'bg-blue-500' },
                { name: 'Safety', score: data?.score_safety || 0, color: 'bg-purple-500' },
                { name: 'Tool Reliability', score: data?.score_tool_reliability || 0, color: 'bg-orange-500' },
              ].map(stat => (
                <div key={stat.name}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-zinc-400">{stat.name}</span>
                    <span className="text-sm font-mono text-zinc-300">{stat.score}/100</span>
                  </div>
                  <div className="w-full bg-zinc-800/50 h-2 rounded-full overflow-hidden">
                    <div className={`${stat.color} h-full transition-all duration-1000`} style={{ width: `${stat.score}%` }} />
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="panel p-6">
           <h3 className="text-base font-semibold mb-6 text-zinc-200">Risk Distribution</h3>
           {data ? (
             <div className="space-y-4">
               {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map(sev => {
                 let count = 0;
                 data.executions?.forEach((ex: any) => {
                   ex.failures?.forEach((f: any) => {
                     if (f.severity === sev) count++;
                   });
                 });
                 if (count === 0) return null;
                 
                 const color = sev === 'CRITICAL' ? 'text-red-500 border-red-500/30 bg-red-500/10' :
                               sev === 'HIGH' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' :
                               sev === 'MEDIUM' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' :
                               'text-blue-500 border-blue-500/30 bg-blue-500/10';
                 
                 return (
                   <div key={sev} className="flex justify-between items-center p-3 rounded-md border border-zinc-800 bg-zinc-900/30">
                     <span className={`text-xs font-bold tracking-wider ${color.split(' ')[0]}`}>{sev}</span>
                     <span className="text-sm font-mono text-zinc-300">{count} occurrences</span>
                   </div>
                 )
               })}
               {!data.executions?.some((ex: any) => ex.failures?.length > 0) && (
                 <div className="text-center py-10 border border-dashed border-zinc-800 rounded-lg">
                   <p className="text-sm text-zinc-500">No risks detected in the latest run.</p>
                 </div>
               )}
             </div>
           ) : (
             <div className="text-center py-10 border border-dashed border-zinc-800 rounded-lg">
                <p className="text-sm text-zinc-500">No evaluation data available.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
