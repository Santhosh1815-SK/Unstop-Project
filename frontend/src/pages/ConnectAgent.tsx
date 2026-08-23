import { useState } from 'react';
import api from '../lib/api';
import { Link as LinkIcon, Activity, AlertTriangle, CheckCircle, Save, Loader2 } from 'lucide-react';

export default function ConnectAgent() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    endpoint: '',
    method: 'POST',
    auth_type: 'None',
    api_key: '',
    request_template: '{\n  "message": "{{user_input}}"\n}',
    response_format: 'response',
    test_input: 'Hello, how can you help me?'
  });

  const [testStatus, setTestStatus] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await api.post('/agents/test-connection', {
        endpoint: formData.endpoint,
        method: formData.method,
        auth_type: formData.auth_type,
        api_key: formData.api_key,
        request_template: formData.request_template,
        response_format: formData.response_format,
        test_input: formData.test_input
      });
      setTestStatus(res.data);
    } catch (e: any) {
      const reason = e.code === 'ERR_NETWORK'
        ? 'Network Error — backend server may not be running on ' + api.defaults.baseURL
        : e.response?.data?.detail || e.message;
      setTestStatus({ status: 'FAILED', reason });
    }
    setTesting(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.endpoint) {
      alert("Name and Endpoint are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post('/agents', {
        name: formData.name,
        description: formData.description,
        agent_type: 'EXTERNAL_API',
        endpoint: formData.endpoint,
        method: formData.method,
        auth_type: formData.auth_type,
        api_key: formData.api_key,
        request_template: formData.request_template,
        response_format: formData.response_format,
        system_prompt: 'EXTERNAL API AGENT',
        policies: ["No policies defined for external agent"]
      });
      alert("External agent successfully connected!");
      setFormData({ ...formData, name: '', description: '', endpoint: '', api_key: '' });
      setTestStatus(null);
    } catch (e: any) {
      alert("Failed to save agent: " + e.message);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center space-x-3">
          <LinkIcon className="w-6 h-6 text-indigo-500" />
          <span>Connect External Agent</span>
        </h1>
        <p className="text-zinc-400 mt-1 text-sm">Register a REST API to evaluate any third-party or custom-built agent.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="panel p-5 space-y-4">
            <h3 className="font-semibold text-zinc-200 border-b border-zinc-800 pb-2">Basic Info</h3>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Agent Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g. Acme Support Bot"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
              <input 
                type="text" 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="External GPT-4 based support agent"
              />
            </div>
          </div>

          <div className="panel p-5 space-y-4">
            <h3 className="font-semibold text-zinc-200 border-b border-zinc-800 pb-2">Connection Settings</h3>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">REST Endpoint URL</label>
              <input 
                type="text" 
                value={formData.endpoint}
                onChange={e => setFormData({...formData, endpoint: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                placeholder="https://example.com/api/chat"
              />
            </div>
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-400 mb-1">HTTP Method</label>
                <select 
                  value={formData.method}
                  onChange={e => setFormData({...formData, method: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option>POST</option>
                  <option>GET</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-zinc-400 mb-1">Auth Type</label>
                <select 
                  value={formData.auth_type}
                  onChange={e => setFormData({...formData, auth_type: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option>None</option>
                  <option>Bearer</option>
                  <option>ApiKey</option>
                </select>
              </div>
            </div>
            {formData.auth_type !== 'None' && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">API Key / Token</label>
                <input 
                  type="password" 
                  value={formData.api_key}
                  onChange={e => setFormData({...formData, api_key: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  placeholder="Secret token..."
                />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-5 space-y-4">
            <h3 className="font-semibold text-zinc-200 border-b border-zinc-800 pb-2">Payload Configuration</h3>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Request Template (JSON)</label>
              <p className="text-[10px] text-zinc-500 mb-2">Use <code className="text-zinc-300">{"{{user_input}}"}</code> to inject the scenario prompt.</p>
              <textarea 
                value={formData.request_template}
                onChange={e => setFormData({...formData, request_template: e.target.value})}
                rows={4}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Response Extraction Key</label>
              <input 
                type="text" 
                value={formData.response_format}
                onChange={e => setFormData({...formData, response_format: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="e.g. 'response' or 'message'"
              />
            </div>
          </div>

          <div className="panel p-5 space-y-4">
             <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                <h3 className="font-semibold text-zinc-200">Test Connection</h3>
             </div>
             <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Dummy Input</label>
                <input 
                  type="text" 
                  value={formData.test_input}
                  onChange={e => setFormData({...formData, test_input: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
             </div>
             
             {testStatus && (
               <div className={`p-3 rounded text-sm font-mono break-all ${testStatus.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                 <div className="flex items-center space-x-2 mb-1">
                   {testStatus.status === 'CONNECTED' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                   <span className="font-bold">{testStatus.status}</span>
                 </div>
                 {testStatus.status_code && <div className="text-xs opacity-80 mt-1">HTTP {testStatus.status_code}</div>}
                 {testStatus.reason && <div className="text-xs opacity-80 mt-1">{testStatus.reason}</div>}
                 {testStatus.response && <div className="text-xs opacity-80 mt-1 truncate">Response: {testStatus.response}</div>}
               </div>
             )}

             <div className="flex space-x-3 pt-2">
                <button 
                  onClick={handleTest}
                  disabled={testing || !formData.endpoint}
                  className="flex-1 bg-zinc-800 text-zinc-200 px-4 py-2 rounded text-sm font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50 flex justify-center items-center space-x-2"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  <span>Test Connection</span>
                </button>
                <button 
                  onClick={handleSave}
                  disabled={saving || testStatus?.status !== 'CONNECTED'}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 flex justify-center items-center space-x-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Agent</span>
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
