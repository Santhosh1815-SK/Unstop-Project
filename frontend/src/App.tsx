import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, ShieldAlert, GitCompare, ShieldCheck, Link as LinkIcon, TestTube } from 'lucide-react';

import Dashboard from './pages/Dashboard';
import Agents from './pages/Agents';
import Evaluation from './pages/Evaluation';
import ReliabilityReport from './pages/ReliabilityReport';
import RegressionTracking from './pages/RegressionTracking';
import ConnectAgent from './pages/ConnectAgent';
import TestGeneration from './pages/TestGeneration';

function Sidebar() {
  const location = useLocation();
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Agents', path: '/agents', icon: Users },
    { name: 'Connect Agent', path: '/connect', icon: LinkIcon },
    { name: 'Test Generation', path: '/test-generation', icon: TestTube },
    { name: 'Evaluation Traces', path: '/evaluations', icon: Activity },
    { name: 'Reliability Report', path: '/reports', icon: ShieldAlert },
    { name: 'Regression Tracking', path: '/regression', icon: GitCompare },
  ];

  return (
    <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex items-center space-x-3">
        <ShieldCheck className="w-6 h-6 text-blue-500" />
        <div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">AgentCI</h1>
          <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest mt-0.5">Reliability Platform</p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Monitoring</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-zinc-800/80 text-zinc-100' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-800">
         <div className="flex items-center space-x-3 p-3 bg-zinc-900 rounded-md border border-zinc-800/50">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-xs font-mono text-zinc-400">System Online</span>
         </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex bg-zinc-950 min-h-screen text-zinc-50">
        <Sidebar />
        <main className="flex-1 p-8 h-screen overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agents/*" element={<Agents />} />
              <Route path="/connect" element={<ConnectAgent />} />
              <Route path="/test-generation" element={<TestGeneration />} />
              <Route path="/evaluations/*" element={<Evaluation />} />
              <Route path="/evaluation-traces/*" element={<Evaluation />} />
              <Route path="/reports/*" element={<ReliabilityReport />} />
              <Route path="/reliability-report/*" element={<ReliabilityReport />} />
              <Route path="/regression/*" element={<RegressionTracking />} />
              <Route path="/regression-tracking/*" element={<RegressionTracking />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
