import { useState, useEffect } from 'react';
import { TestTube, Settings, AlertTriangle, Layers, ListChecks, Shield, Check, Eye, Edit2, Trash2, RefreshCw, Play, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const TEST_CATEGORIES = [
  'Normal Behavior', 'Edge Cases', 'Ambiguous Instructions', 'Missing Information',
  'Contradictory Instructions', 'Prompt Injection', 'Tool Misuse', 'Hallucination Traps',
  'Goal Drift', 'Excessive Permissions', 'Unauthorized Actions', 'Destructive Actions',
  'Data Leakage', 'Policy Conflicts', 'Multi-Step Reasoning Failures', 'Tool Failure Handling',
  'Malicious User Behavior', 'Social Engineering', 'Out-of-Domain Requests', 'Recovery After Tool Failure'
];

export default function TestGeneration() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(TEST_CATEGORIES);
  const [scenarioCount, setScenarioCount] = useState<number>(10);
  const [severity, setSeverity] = useState<string>('All');
  
  const [advancedToggles, setAdvancedToggles] = useState({
    adversarial: true,
    destructive: true,
    promptInjection: false,
    toolMisuse: false,
    dataLeakage: false,
  });

  const [generating, setGenerating] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  
  const [generatedScenarios, setGeneratedScenarios] = useState<any[]>([]);
  
  // Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<any>(null);

  useEffect(() => {
    api.get('/agents').then(res => {
      setAgents(res.data);
      if (res.data.length > 0) {
        setSelectedAgentId(res.data[0].id.toString());
      }
    }).catch(err => console.error("Failed to fetch agents", err));
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      fetchScenarios();
    }
  }, [selectedAgentId]);

  const fetchScenarios = async () => {
    try {
      const res = await api.get(`/agents/${selectedAgentId}/scenarios`);
      setGeneratedScenarios(res.data);
    } catch (e) {
      console.error("Failed to fetch scenarios", e);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAgentId) return;
    setGenerating(true);
    setMessage('');
    try {
      const payload = {
        categories: selectedCategories,
        count: scenarioCount,
        severity: severity,
        adversarial_testing: advancedToggles.adversarial,
        destructive_action_testing: advancedToggles.destructive,
        prompt_injection_testing: advancedToggles.promptInjection,
        tool_misuse_testing: advancedToggles.toolMisuse,
        data_leakage_testing: advancedToggles.dataLeakage
      };
      await api.post(`/agents/${selectedAgentId}/scenarios/generate`, payload);
      await fetchScenarios();
    } catch (e: any) {
      setMessage("Failed to generate scenarios: " + (e.response?.data?.detail || e.message));
    }
    setGenerating(false);
  };

  const handleRunEvaluation = async () => {
    if (!selectedAgentId) return;
    setRunning(true);
    try {
      const res = await api.post(`/evaluations/run?agent_id=${selectedAgentId}`);
      navigate(`/evaluations/${res.data.id}`);
    } catch (e: any) {
      setMessage("Failed to run evaluation: " + (e.response?.data?.detail || e.message));
      setRunning(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this scenario?")) return;
    try {
      await api.delete(`/agents/${selectedAgentId}/scenarios/${id}`);
      setGeneratedScenarios(generatedScenarios.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegenerate = async (id: number) => {
    try {
      const res = await api.post(`/agents/${selectedAgentId}/scenarios/${id}/regenerate`);
      setGeneratedScenarios(generatedScenarios.map(s => s.id === id ? res.data : s));
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate scenario.");
    }
  };

  const saveEdit = async () => {
    try {
      const res = await api.put(`/agents/${selectedAgentId}/scenarios/${activeScenario.id}`, {
        category: activeScenario.category,
        severity: activeScenario.severity,
        user_input: activeScenario.user_input,
        expected_behavior: activeScenario.expected_behavior,
        forbidden_behavior: activeScenario.forbidden_behavior,
        evaluation_criteria: activeScenario.evaluation_criteria,
      });
      setGeneratedScenarios(generatedScenarios.map(s => s.id === activeScenario.id ? res.data : s));
      setEditModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save scenario.");
    }
  };

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  // Stats
  const criticalCount = generatedScenarios.filter(s => s.severity === 'CRITICAL').length;
  const highCount = generatedScenarios.filter(s => s.severity === 'HIGH').length;
  const mediumCount = generatedScenarios.filter(s => s.severity === 'MEDIUM').length;
  const lowCount = generatedScenarios.filter(s => s.severity === 'LOW' || s.severity === 'INFO').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl pb-10">
      <div className="border-b border-zinc-800 pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center space-x-3">
            <TestTube className="w-6 h-6 text-indigo-500" />
            <span>Test Generation</span>
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">Configure and generate dynamic evaluation scenarios for your AI agents.</p>
        </div>
        {generatedScenarios.length > 0 && (
          <button 
            onClick={handleRunEvaluation}
            disabled={running}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-6 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Run Evaluation
          </button>
        )}
      </div>

      {generatedScenarios.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-6 items-center overflow-x-auto shadow-sm">
          <div className="px-4 py-2 bg-indigo-500/10 rounded-lg">
            <p className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-1">Generated Scenarios</p>
            <p className="text-2xl font-bold text-indigo-100">{generatedScenarios.length}</p>
          </div>
          <div className="px-4 py-2 border-l border-zinc-800">
            <p className="text-xs text-red-500 font-medium uppercase tracking-wider mb-1">Critical</p>
            <p className="text-xl font-bold text-zinc-200">{criticalCount}</p>
          </div>
          <div className="px-4 py-2 border-l border-zinc-800">
            <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">High</p>
            <p className="text-xl font-bold text-zinc-200">{highCount}</p>
          </div>
          <div className="px-4 py-2 border-l border-zinc-800">
            <p className="text-xs text-amber-400 font-medium uppercase tracking-wider mb-1">Medium</p>
            <p className="text-xl font-bold text-zinc-200">{mediumCount}</p>
          </div>
          <div className="px-4 py-2 border-l border-zinc-800">
            <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Low / Info</p>
            <p className="text-xl font-bold text-zinc-200">{lowCount}</p>
          </div>
          <div className="ml-auto px-4 py-2 flex items-center text-emerald-400 text-sm font-medium">
            <Check className="w-5 h-5 mr-2" />
            Ready for Evaluation
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Agent Selection
            </h2>
            {agents.length === 0 ? (
              <p className="text-sm text-zinc-500">Loading agents...</p>
            ) : (
              <select
                value={selectedAgentId}
                onChange={e => setSelectedAgentId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} {a.version ? `(v${a.version})` : ''} - {a.description || 'No description'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-indigo-400" />
                Test Categories
              </h2>
              <div className="space-x-3 text-sm">
                <button onClick={() => setSelectedCategories(TEST_CATEGORIES)} className="text-indigo-400 hover:text-indigo-300 transition-colors">Select All</button>
                <span className="text-zinc-700">|</span>
                <button onClick={() => setSelectedCategories([])} className="text-zinc-400 hover:text-zinc-300 transition-colors">Clear All</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {TEST_CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center space-x-3 group cursor-pointer">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedCategories.includes(cat) ? 'bg-indigo-500 border-indigo-500' : 'border-zinc-700 group-hover:border-indigo-400'}`}>
                    {selectedCategories.includes(cat) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{cat}</span>
                  <input type="checkbox" className="hidden" checked={selectedCategories.includes(cat)} onChange={() => toggleCategory(cat)} />
                </label>
              ))}
            </div>
          </div>
          
          {generatedScenarios.length === 0 && !generating ? (
            <div className="bg-zinc-950 border border-zinc-800 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-3">
               <TestTube className="w-12 h-12 text-zinc-700 mb-2" />
               <h3 className="text-lg font-medium text-zinc-300">No scenarios generated yet.</h3>
               <p className="text-sm text-zinc-500 max-w-sm">Configure your test suite above and generate scenarios to begin evaluating your agent.</p>
               {message && (
                 <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-sm">
                   {message}
                 </div>
               )}
            </div>
          ) : (
            <div className="space-y-4">
              {message && (
                 <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-sm">
                   {message}
                 </div>
              )}
              {generatedScenarios.map((sc) => (
                <div key={sc.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3 relative overflow-hidden group hover:border-zinc-700 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {sc.id ? `SC-${sc.id}` : 'NEW'}
                      </span>
                      <span className="text-sm font-medium text-zinc-300">{sc.category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        sc.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        sc.severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                        sc.severity === 'LOW' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-zinc-800 text-zinc-400'
                      } border`}>
                        {sc.severity}
                      </span>
                      <div className="flex space-x-2 text-zinc-500">
                        <button onClick={() => { setActiveScenario(sc); setInspectModalOpen(true); }} className="hover:text-indigo-400" title="Inspect">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setActiveScenario(sc); setEditModalOpen(true); }} className="hover:text-blue-400" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRegenerate(sc.id)} className="hover:text-emerald-400" title="Regenerate">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(sc.id)} className="hover:text-red-400" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <p className="text-xs text-zinc-500 font-mono mb-1">USER INPUT</p>
                    <p className="text-sm text-zinc-200 bg-black/30 p-3 rounded-lg border border-zinc-800/50 leading-relaxed truncate">
                      {sc.user_input}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
             <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Settings className="w-5 h-5 text-indigo-400" />
              Configuration
            </h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-400">Number of Scenarios</label>
              <select 
                value={scenarioCount} 
                onChange={e => setScenarioCount(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {[1, 5, 10, 20, 25, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-400">Severity Filter</label>
              <select 
                value={severity} 
                onChange={e => setSeverity(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {['All', 'INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
             <h2 className="text-lg font-semibold text-zinc-200 flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Shield className="w-5 h-5 text-indigo-400" />
              Advanced Testing
            </h2>
            <div className="space-y-4 pt-2">
               {[
                 { id: 'adversarial', label: 'Adversarial Testing' },
                 { id: 'destructive', label: 'Destructive Action Testing' },
                 { id: 'promptInjection', label: 'Prompt Injection Testing' },
                 { id: 'toolMisuse', label: 'Tool Misuse Testing' },
                 { id: 'dataLeakage', label: 'Data Leakage Testing' }
               ].map(toggle => (
                 <label key={toggle.id} className="flex items-center justify-between cursor-pointer group">
                   <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{toggle.label}</span>
                   <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${advancedToggles[toggle.id as keyof typeof advancedToggles] ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
                     <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${advancedToggles[toggle.id as keyof typeof advancedToggles] ? 'translate-x-4' : 'translate-x-1'}`} />
                     <input 
                       type="checkbox" 
                       className="hidden" 
                       checked={advancedToggles[toggle.id as keyof typeof advancedToggles]} 
                       onChange={() => setAdvancedToggles({...advancedToggles, [toggle.id]: !advancedToggles[toggle.id as keyof typeof advancedToggles]})} 
                     />
                   </div>
                 </label>
               ))}
            </div>
          </div>
          
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {generating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
            Generate Scenarios
          </button>
        </div>
      </div>

      {/* Inspect Modal */}
      {inspectModalOpen && activeScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" /> Inspect Scenario SC-{activeScenario.id}
              </h2>
              <button onClick={() => setInspectModalOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-xs text-zinc-500 block">Category</span><span className="text-sm font-medium text-zinc-300">{activeScenario.category}</span></div>
                <div><span className="text-xs text-zinc-500 block">Severity</span><span className="text-sm font-medium text-zinc-300">{activeScenario.severity}</span></div>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-zinc-500 block uppercase">User Input</span>
                <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg text-sm text-zinc-200 whitespace-pre-wrap">{activeScenario.user_input}</div>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-zinc-500 block uppercase">Expected Behavior</span>
                <div className="bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-lg text-sm text-emerald-200 whitespace-pre-wrap">{activeScenario.expected_behavior}</div>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-zinc-500 block uppercase">Forbidden Behavior</span>
                <div className="bg-red-950/30 border border-red-900/50 p-3 rounded-lg text-sm text-red-200 whitespace-pre-wrap">{activeScenario.forbidden_behavior}</div>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-zinc-500 block uppercase">Evaluation Criteria</span>
                <div className="bg-blue-950/30 border border-blue-900/50 p-3 rounded-lg text-sm text-blue-200 whitespace-pre-wrap">{activeScenario.evaluation_criteria}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && activeScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 p-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-400" /> Edit Scenario SC-{activeScenario.id}
              </h2>
              <button onClick={() => setEditModalOpen(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 block">Category</label>
                  <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-200" value={activeScenario.category} onChange={e => setActiveScenario({...activeScenario, category: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500 block">Severity</label>
                  <select className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-200" value={activeScenario.severity} onChange={e => setActiveScenario({...activeScenario, severity: e.target.value})}>
                    {['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 block">User Input</label>
                <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-200 min-h-[80px]" value={activeScenario.user_input} onChange={e => setActiveScenario({...activeScenario, user_input: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 block">Expected Behavior</label>
                <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-200 min-h-[80px]" value={activeScenario.expected_behavior} onChange={e => setActiveScenario({...activeScenario, expected_behavior: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 block">Forbidden Behavior</label>
                <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-200 min-h-[80px]" value={activeScenario.forbidden_behavior} onChange={e => setActiveScenario({...activeScenario, forbidden_behavior: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500 block">Evaluation Criteria</label>
                <textarea className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-200 min-h-[80px]" value={activeScenario.evaluation_criteria} onChange={e => setActiveScenario({...activeScenario, evaluation_criteria: e.target.value})} />
              </div>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200">Cancel</button>
              <button onClick={saveEdit} className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
