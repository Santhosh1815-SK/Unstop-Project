import { useEffect, useState } from 'react';
import api from '../lib/api';
import { GitCompare, ArrowDownRight, ArrowUpRight, CheckCircle, XCircle, Info, ShieldAlert } from 'lucide-react';

export default function RegressionTracking() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [v1, setV1] = useState<string>('1');
  const [v2, setV2] = useState<string>('2');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/evaluations').then(res => {
      setEvaluations(res.data);
      if (res.data && res.data.length >= 2) {
        setV1(res.data[res.data.length - 1].id.toString());
        setV2(res.data[0].id.toString());
        loadComparison(res.data[res.data.length - 1].id, res.data[0].id);
      } else if (res.data && res.data.length === 1) {
        setV1(res.data[0].id.toString());
        setV2(res.data[0].id.toString());
        loadComparison(res.data[0].id, res.data[0].id);
      } else {
        setLoading(false);
      }
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const loadComparison = (id1: string | number, id2: string | number) => {
    setLoading(true);
    api.get(`/regression/compare?v1=${id1}&v2=${id2}`).then(res => {
      setReport(res.data);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setReport(null);
      setLoading(false);
    });
  };

  const handleCompare = (newV1: string, newV2: string) => {
    setV1(newV1);
    setV2(newV2);
    loadComparison(newV1, newV2);
  };

  if (loading) return <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-lg mt-8">Running CI/CD comparator engine...</div>;
  if (!report && evaluations.length < 2) return <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-lg mt-8">Need at least 2 evaluation runs to compare regressions. Run the Hackathon Demo or create agent evaluations.</div>;
  if (!report) return <div className="text-center py-16 text-red-400 border border-dashed border-red-500/30 rounded-lg mt-8">Failed to load regression report for selected evaluation runs.</div>;

  const isRegression = report.score_regression;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-zinc-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Version Regression Tracking</h1>
          <p className="text-zinc-400 mt-1 text-sm">Automated CI/CD deployment gates based on empirical reliability scores.</p>
        </div>
        {evaluations.length >= 2 && (
          <div className="flex items-center space-x-3 bg-zinc-950 p-2 rounded border border-zinc-800 text-xs">
            <span className="text-zinc-400 font-semibold">Baseline:</span>
            <select
              value={v1}
              onChange={(e) => handleCompare(e.target.value, v2)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none font-mono"
            >
              {evaluations.map(e => <option key={e.id} value={e.id}>Run #{e.id} (Agent #{e.agent_id})</option>)}
            </select>
            <span className="text-zinc-500">→</span>
            <span className="text-zinc-400 font-semibold">Candidate:</span>
            <select
              value={v2}
              onChange={(e) => handleCompare(v1, e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none font-mono"
            >
              {evaluations.map(e => <option key={e.id} value={e.id}>Run #{e.id} (Agent #{e.agent_id})</option>)}
            </select>
          </div>
        )}
      </div>

      <div className={`panel p-6 border-l-4 ${isRegression ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
         <div className="flex items-center justify-between">
           <div>
             <div className="flex items-center space-x-2 mb-2">
               {isRegression ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-emerald-500" />}
               <h2 className="text-lg font-bold text-zinc-100">Deployment Gate: {isRegression ? 'BLOCKED' : 'APPROVED'}</h2>
             </div>
             <p className="text-zinc-500 text-sm">Baseline Run #{v1} <span className="mx-2 text-zinc-700">→</span> Candidate Run #{v2}</p>
           </div>
           
           <div className="flex items-center space-x-8 text-center bg-zinc-950 p-4 rounded border border-zinc-800/80">
             <div>
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Baseline</p>
               <p className="text-2xl font-bold text-zinc-200">{report.agent_v1_score}</p>
             </div>
             <GitCompare className="w-5 h-5 text-zinc-700" />
             <div>
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Candidate</p>
               <p className={`text-2xl font-bold ${isRegression ? 'text-red-400' : 'text-emerald-400'}`}>{report.agent_v2_score}</p>
             </div>
             <div className="pl-8 border-l border-zinc-800">
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">Delta</p>
               <p className={`text-xl font-bold flex items-center justify-center ${isRegression ? 'text-red-400' : 'text-emerald-400'}`}>
                 {isRegression ? <ArrowDownRight className="w-4 h-4 mr-1" /> : <ArrowUpRight className="w-4 h-4 mr-1" />}
                 {Math.abs(report.score_difference)}
               </p>
             </div>
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
         <div className="panel p-5 border-t-2 border-t-emerald-500 flex flex-col h-full">
           <h3 className="text-sm font-semibold flex items-center space-x-2 mb-5 text-zinc-200">
             <CheckCircle className="w-4 h-4 text-emerald-500" />
             <span>Resolved Failures</span>
           </h3>
           <div className="space-y-3 flex-1">
             {report.fixed_failures.length === 0 ? <p className="text-zinc-500 text-xs text-center py-6">No fixes detected.</p> : null}
             {report.fixed_failures.map((f: any, i: number) => (
               <div key={i} className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded text-sm text-emerald-400/90 leading-relaxed">
                 <span className="font-bold text-emerald-400">{f.category}</span> fixed in Scenario #{f.scenario}
               </div>
             ))}
           </div>
         </div>

         <div className="panel p-5 border-t-2 border-t-amber-500 flex flex-col h-full">
           <h3 className="text-sm font-semibold flex items-center space-x-2 mb-5 text-zinc-200">
             <Info className="w-4 h-4 text-amber-500" />
             <span>Persistent Failures</span>
           </h3>
           <div className="space-y-3 flex-1">
             {report.persistent_failures.length === 0 ? <p className="text-zinc-500 text-xs text-center py-6">No persistent issues.</p> : null}
             {report.persistent_failures.map((f: any, i: number) => (
               <div key={i} className="bg-amber-500/5 border border-amber-500/20 p-3 rounded text-sm text-amber-400/90 leading-relaxed">
                 <span className="font-bold text-amber-400">{f.category}</span> unresolved in Scenario #{f.scenario}
               </div>
             ))}
           </div>
         </div>

         <div className="panel p-5 border-t-2 border-t-red-500 flex flex-col h-full">
           <h3 className="text-sm font-semibold flex items-center space-x-2 mb-5 text-zinc-200">
             <XCircle className="w-4 h-4 text-red-500" />
             <span>New Regressions</span>
           </h3>
           <div className="space-y-3 flex-1">
             {report.new_failures.length === 0 ? <p className="text-zinc-500 text-xs text-center py-6">No regressions detected.</p> : null}
             {report.new_failures.map((f: any, i: number) => (
               <div key={i} className="bg-red-500/5 border border-red-500/20 p-3 rounded text-sm text-red-400/90 leading-relaxed">
                 <span className="font-bold text-red-400">{f.category}</span> introduced in Scenario #{f.scenario}
               </div>
             ))}
           </div>
         </div>
      </div>
    </div>
  );
}
