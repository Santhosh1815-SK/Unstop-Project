import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { CheckCircle2, XCircle, Terminal, AlertTriangle } from 'lucide-react';

export default function Evaluation() {
  const [searchParams] = useSearchParams();
  const evalId = searchParams.get('id');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (evalId) {
      api.get(`/evaluations/${evalId}`).then(res => { setEvaluation(res.data); setLoading(false); }).catch(console.error);
    } else {
      api.get('/evaluations/agent/1').then(res => {
        if (res.data && res.data.length > 0) setEvaluation(res.data[res.data.length - 1]);
        setLoading(false);
      }).catch(console.error);
    }
  }, [evalId]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 space-x-2">
       <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
       <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75" />
       <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150" />
    </div>
  );
  if (!evaluation) return <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">No execution data found.</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Execution Traces</h1>
          <p className="text-zinc-500 mt-1 text-sm font-mono">EVAL_RUN_{evaluation.id} • {new Date(evaluation.created_at).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1">Reliability Score</p>
          <p className={`text-4xl font-bold tracking-tight ${evaluation.overall_score >= 80 ? 'text-emerald-500' : 'text-red-500'}`}>{evaluation.overall_score}<span className="text-xl text-zinc-600">/100</span></p>
        </div>
      </div>

      <div className="space-y-6">
        {evaluation.executions?.map((exec: any) => (
          <div key={exec.id} className="panel overflow-hidden">
            <div className={`px-5 py-4 border-b border-zinc-800 flex items-center justify-between ${exec.status === 'PASS' ? 'bg-emerald-500/5' : exec.status === 'ERROR' ? 'bg-amber-500/5' : 'bg-red-500/5'}`}>
              <div className="flex items-center space-x-3">
                {exec.status === 'PASS' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : exec.status === 'ERROR' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <h3 className="text-base font-semibold text-zinc-200">Test Scenario #{exec.test_scenario_id}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${exec.status === 'PASS' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10' : exec.status === 'ERROR' ? 'border-amber-500/20 text-amber-400 bg-amber-500/10' : 'border-red-500/20 text-red-400 bg-red-500/10'}`}>
                {exec.status}
              </span>
            </div>
            
            <div className="p-5">
              <div className="bg-zinc-950 rounded border border-zinc-800/80 font-mono text-sm overflow-x-auto shadow-inner">
                <div className="flex items-center space-x-2 px-4 py-2 border-b border-zinc-800/50 bg-zinc-900/30 text-zinc-500 text-xs">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>stdout</span>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <p className="text-zinc-600 mb-2 text-xs uppercase tracking-wider font-semibold">Events</p>
                    {exec.trace_data?.events?.map((evt: any, i: number) => (
                      <div key={i} className="flex space-x-4 mb-1 text-[13px]">
                        <span className="text-zinc-600 shrink-0">[{new Date(evt.timestamp * 1000).toISOString().split('T')[1].slice(0, 12)}]</span>
                        <span className="text-zinc-300">{evt.message}</span>
                      </div>
                    ))}
                  </div>
                  
                  {exec.trace_data?.request_payload && (
                    <div>
                      <p className="text-zinc-600 mt-4 mb-2 text-xs uppercase tracking-wider font-semibold">External Request Trace</p>
                      <div className="pl-4 border-l border-amber-500/50 mb-3 text-[13px]">
                        <p className="text-amber-400 font-semibold">HTTP Request Payload</p>
                        <div className="text-zinc-400 mt-1"><span className="text-zinc-600">Payload:</span> {JSON.stringify(exec.trace_data.request_payload)}</div>
                        <div className="text-zinc-400 mt-1"><span className="text-zinc-600">Headers:</span> {JSON.stringify(exec.trace_data.request_headers)}</div>
                      </div>
                    </div>
                  )}
                  
                  {exec.trace_data?.tool_calls?.length > 0 && (
                    <div>
                      <p className="text-zinc-600 mt-4 mb-2 text-xs uppercase tracking-wider font-semibold">Tool Executions</p>
                      {exec.trace_data.tool_calls.map((call: any, i: number) => (
                        <div key={i} className="pl-4 border-l border-blue-500/50 mb-3 text-[13px]">
                          <p className="text-blue-400 font-semibold">{call.name}()</p>
                          <div className="text-zinc-400 mt-1"><span className="text-zinc-600">Args:</span> {JSON.stringify(call.arguments)}</div>
                          <div className="text-emerald-400/80 mt-1"><span className="text-zinc-600">Return:</span> {JSON.stringify(call.response)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-zinc-800/50">
                    <p className="text-zinc-600 text-xs uppercase tracking-wider font-semibold mb-2">Final Output</p>
                    <p className="text-zinc-200">{exec.trace_data?.final_response || "None"}</p>
                  </div>
                </div>
              </div>
              
              {exec.failures?.length > 0 && (
                <div className="mt-5 space-y-3">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Evaluator Findings</h4>
                  {exec.failures.map((f: any) => (
                    <div key={f.id} className="sub-panel p-4 border-red-500/20 bg-red-500/5">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">{f.severity}</span>
                        <span className="font-semibold text-red-400 text-sm">{f.category}</span>
                        {f.evaluation_method && (
                          <span className="bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded tracking-wide">
                            {f.evaluation_method.replace('_', ' ')}
                          </span>
                        )}
                        {f.confidence != null && (
                          <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                            Conf: {(f.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-300 text-sm mb-4 leading-relaxed">{f.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs mt-4 bg-zinc-950 p-3 rounded border border-zinc-800/50">
                         <div>
                           <p className="text-red-400/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">Actual Behavior</p>
                           <p className="text-zinc-300">{f.actual_behavior}</p>
                         </div>
                         <div>
                           <p className="text-emerald-400/70 font-semibold mb-1 uppercase tracking-wider text-[10px]">Expected Behavior</p>
                           <p className="text-zinc-300">{f.expected_behavior}</p>
                         </div>
                      </div>
                      <div className="mt-3 text-sm flex items-start space-x-2">
                        <span className="text-zinc-500 font-semibold shrink-0">Recommendation:</span>
                        <span className="text-blue-400">{f.recommendation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
