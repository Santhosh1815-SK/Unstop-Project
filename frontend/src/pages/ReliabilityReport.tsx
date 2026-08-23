import { useEffect, useState } from 'react';
import api from '../lib/api';
import { AlertOctagon, FileText } from 'lucide-react';

export default function ReliabilityReport() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedEvalId, setSelectedEvalId] = useState<string>('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/evaluations').then(res => {
      setEvaluations(res.data);
      if (res.data && res.data.length > 0) {
        setSelectedEvalId(res.data[0].id.toString());
        setData(res.data[0]);
      }
    }).catch(console.error);
  }, []);

  const handleSelectEval = (idStr: string) => {
    setSelectedEvalId(idStr);
    const target = evaluations.find(e => e.id.toString() === idStr);
    if (target) {
      setData(target);
    }
  };

  if (!data && evaluations.length === 0) return <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-lg mt-8">No evaluations found. Run an evaluation to view reliability reports.</div>;
  if (!data) return <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-lg mt-8">Loading report...</div>;

  const allFailures = data.executions?.flatMap((ex: any) => ex.failures || []) || [];
  const buildStatus = data?.build_status || (data?.overall_score >= 80 ? "BUILD_PASSED" : "BUILD_FAILED");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="border-b border-zinc-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Security & Reliability Report</h1>
          <p className="text-zinc-400 mt-1 text-sm">Comprehensive audit of AI agent failure modes and policy violations.</p>
        </div>
        {evaluations.length > 0 && (
          <div className="flex items-center space-x-3">
            <span className={`px-2.5 py-1 rounded text-xs font-bold border ${buildStatus === 'BUILD_PASSED' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
              {buildStatus}
            </span>
            <select
              value={selectedEvalId}
              onChange={(e) => handleSelectEval(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
            >
              {evaluations.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  Run #{ev.id} — Score: {ev.overall_score || 0}/100
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="panel p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center space-x-2 text-zinc-200">
          <FileText className="w-4 h-4 text-blue-500" />
          <span>Executive Summary</span>
        </h2>
        <div className="bg-zinc-950 p-5 rounded border border-zinc-800/50 leading-relaxed font-mono text-[13px] text-zinc-300 whitespace-pre-wrap">
          {data.score_explanation || "No execution data found."}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold flex items-center space-x-2 text-zinc-100">
          <AlertOctagon className="w-5 h-5 text-red-500" />
          <span>Vulnerabilities Detected ({allFailures.length})</span>
        </h2>
        
        {allFailures.length === 0 ? (
           <div className="panel p-10 text-center border-emerald-500/30 bg-emerald-500/5">
             <p className="text-emerald-400 font-semibold">Zero vulnerabilities detected. Agent is compliant.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            {allFailures.map((f: any, i: number) => (
              <div key={i} className="panel p-5 border-t-2 border-t-red-500 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="badge border-red-500/30 text-red-400 bg-red-500/10">{f.severity}</span>
                    <span className="text-zinc-500 text-[11px] uppercase tracking-wider font-mono">Trace {f.execution_id}</span>
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100 mb-1">{f.category}</h3>
                  <p className="text-sm text-zinc-400 mb-5">{f.description}</p>
                  
                  <div className="bg-zinc-950 p-3 rounded border border-zinc-800/80 mb-5">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Evidence / Artifact</p>
                    <p className="font-mono text-xs text-red-300/90 leading-relaxed">{f.evidence}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-zinc-800/50 text-sm bg-zinc-900/50 -mx-5 -mb-5 p-5 rounded-b-lg">
                  <p className="text-zinc-500 font-semibold text-xs uppercase tracking-wider mb-1">Recommendation</p>
                  <p className="text-zinc-300">{f.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
