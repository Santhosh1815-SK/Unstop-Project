import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import { ShieldAlert, CheckCircle2, ShieldX, Terminal, RefreshCw, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function ReportView() {
  const { runId } = useParams();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchReport = async () => {
      const res = await api.get(`/evaluations/${runId}`);
      setReport(res.data);
    };
    fetchReport();
    
    // Polling if still running
    const interval = setInterval(() => {
      if (report?.status === 'RUNNING') fetchReport();
    }, 2000);
    return () => clearInterval(interval);
  }, [runId, report?.status]);

  if (!report) return <div className="animate-pulse flex gap-2 items-center text-primary mt-10"><RefreshCw className="animate-spin" /> Loading report...</div>;

  const scoreColor = report.overall_score >= 80 ? 'text-green-500' : report.overall_score >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-[#111] p-8 rounded-3xl border border-white/5 relative overflow-hidden">
        <div className="z-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Evaluation Report</h1>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="bg-white/10 px-3 py-1 rounded-full text-xs">Run #{report.id}</span>
            <span>Status: {report.status}</span>
          </div>
        </div>
        
        {report.status === 'COMPLETED' && (
          <div className="text-center z-10">
            <div className="text-sm text-gray-400 uppercase tracking-widest font-semibold mb-1">Reliability Score</div>
            <div className={clsx("text-6xl font-black tabular-nums tracking-tighter", scoreColor)}>
              {report.overall_score}<span className="text-3xl text-gray-600">/100</span>
            </div>
          </div>
        )}
      </div>

      {report.status === 'RUNNING' ? (
        <div className="py-20 text-center text-gray-400 flex flex-col items-center">
           <RefreshCw size={48} className="animate-spin text-primary mb-4" />
           <p className="text-lg">Executing adversarial tests in sandbox...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold mb-4">Execution Traces</h2>
          {report.executions.map((exec: any) => (
            <div key={exec.id} className={clsx("border rounded-2xl overflow-hidden transition-all", exec.status === 'PASS' ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5')}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {exec.status === 'PASS' ? <CheckCircle2 className="text-green-500" /> : <ShieldAlert className="text-red-500" />}
                  <h3 className="text-lg font-semibold">{exec.status === 'PASS' ? 'Passed' : 'Failed'} Test Case</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">User Input</div>
                      <div className="bg-black/50 p-4 rounded-xl text-gray-300 font-mono text-sm border border-white/5">
                        {exec.trace_json?.input}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Agent Response</div>
                      <div className="bg-black/50 p-4 rounded-xl text-gray-300 font-mono text-sm border border-white/5">
                        {exec.trace_json?.output}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="text-sm text-gray-500 mb-1 flex items-center gap-2"><Terminal size={16}/> Tool Calls Captured</div>
                     {exec.trace_json?.tool_calls.map((call: any, i: number) => (
                       <div key={i} className="bg-black/80 border border-primary/20 p-4 rounded-xl">
                         <div className="text-primary font-mono text-sm mb-2">{call.name}()</div>
                         <pre className="text-xs text-gray-400 font-mono whitespace-pre-wrap">{JSON.stringify(call.arguments, null, 2)}</pre>
                       </div>
                     ))}
                     {exec.trace_json?.tool_calls.length === 0 && <div className="text-sm text-gray-600 italic">No tool calls made.</div>}
                  </div>
                </div>

                {exec.failures?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-red-500/10 space-y-4">
                    {exec.failures.map((f: any, i: number) => (
                      <div key={i} className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-4">
                        <ShieldX className="text-red-500 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-red-400">{f.category}</span>
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{f.severity}</span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{f.description}</p>
                          <div className="text-xs text-yellow-400/80 flex items-start gap-1">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            {f.recommendation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
