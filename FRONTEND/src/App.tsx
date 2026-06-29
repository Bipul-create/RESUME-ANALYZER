import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Upload, FileText, BarChart3, TrendingUp, TrendingDown,
  Users, MessageCircle, Settings, ChevronRight, Star, Award,
  Target, Briefcase, Zap, CheckCircle, XCircle, AlertCircle,
  Send, Menu, X, Sparkles, Activity, Globe, Shield, Layers,
  Trophy, ClipboardList, Lightbulb, HelpCircle, GitCompare, Bot,
  Download, Eye, EyeOff, AlertTriangle, Cpu,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, Legend,
} from 'recharts';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface EvaluationResult {
  skill_match: number;
  project_relevance: number;
  experience_score: number;
  resume_quality: number;
  final_score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  missingSkills: string[];
  semanticScore?: number;
  confidenceLower?: number;
  confidenceUpper?: number;
}

interface RoleUnderstanding {
  role_title: string;
  experience_required: string;
  seniority_level: string;
  required_skills: string[];
  nice_to_have: string[];
  culture_fit: string[];
  role_summary: string;
  bias_flags: string[];
}

interface BehavioralSignal {
  key: string;
  label: string;
  color: string;
  strength: number;
  hits: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getScoreColor = (score: number) => {
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#3b82f6';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
};

const getScoreLabel = (score: number) => {
  if (score >= 90) return 'Excellent Fit';
  if (score >= 75) return 'Strong Candidate';
  if (score >= 60) return 'Moderate Match';
  return 'Needs Review';
};

const formatName = (raw: string) =>
  raw.replace(/\.pdf$/i, '').replace(/_/g, ' ');

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

const getRecommendationBadge = (rec: string) => {
  const r = rec.toLowerCase();
  if (r.includes('highly'))
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', label: '🟢 Highly Recommended' };
  if (r.includes('recommended') && !r.includes('not'))
    return { text: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', label: '🔵 Recommended' };
  if (r.includes('consider'))
    return { text: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: '🟡 Consider' };
  return { text: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', label: '🔴 Not Recommended' };
};

const behavioralColorMap: Record<string, string> = {
  blue: '#3b82f6', green: '#10b981', purple: '#8b5cf6',
  cyan: '#22d3ee', amber: '#f59e0b',
};

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = '' }: { value: number | string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const numVal = parseFloat(String(value));
  useEffect(() => {
    if (isNaN(numVal)) return;
    let start = 0;
    const duration = 1200, step = 16;
    const increment = numVal / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= numVal) { setDisplay(numVal); clearInterval(timer); }
      else setDisplay(Math.floor(start * 10) / 10);
    }, step);
    return () => clearInterval(timer);
  }, [numVal]);
  if (isNaN(numVal)) return <span>{value}{suffix}</span>;
  return <span>{Number.isInteger(numVal) ? Math.floor(display) : display.toFixed(1)}{suffix}</span>;
}

// ─── Typing Dots ─────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.span key={i} className="w-2 h-2 rounded-full bg-blue-400"
          animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18 }} />
      ))}
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: Trophy,        label: 'Best Candidate',          prompt: 'Who is the best candidate and why?' },
  { icon: GitCompare,    label: 'Compare Top 3',           prompt: 'Compare the top 3 candidates in detail.' },
  { icon: Target,        label: 'Interview Questions',     prompt: 'Generate tailored interview questions for the top candidate.' },
  { icon: ClipboardList, label: 'Candidate Summary',       prompt: 'Give me a brief summary of all candidates.' },
  { icon: Lightbulb,     label: 'Hiring Recommendation',   prompt: 'What is your hiring recommendation?' },
  { icon: Zap,           label: 'Missing Skills Analysis', prompt: 'Analyze the missing skills across all candidates.' },
  { icon: HelpCircle,    label: 'Explain Ranking',         prompt: 'Explain how the candidate ranking was determined, including semantic search.' },
];

// ─── Role Understanding Card ──────────────────────────────────────────────────

function RoleUnderstandingCard({ data }: { data: RoleUnderstanding }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="mb-8 rounded-2xl p-6 border border-cyan-500/20"
      style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.06) 0%, rgba(59,130,246,0.06) 100%)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
          <Cpu className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-bold text-white text-sm">AI Role Understanding</h3>
          <p className="text-xs text-gray-500">What the system understands about this role</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs text-gray-500 mb-1">Inferred Role</p>
          <p className="text-sm font-bold text-white">{data.role_title}</p>
        </div>
        <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs text-gray-500 mb-1">Seniority</p>
          <p className="text-sm font-bold text-cyan-400">{data.seniority_level}</p>
        </div>
        <div className="rounded-xl p-3 col-span-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <p className="text-xs text-gray-500 mb-1">Experience Required</p>
          <p className="text-sm font-semibold text-white">{data.experience_required}</p>
        </div>
      </div>

      <p className="text-sm text-gray-300 italic mb-4 leading-relaxed">"{data.role_summary}"</p>

      <div className="mb-4">
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Key Requirements</p>
        <div className="flex flex-wrap gap-2">
          {data.required_skills.map((s, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Culture Fit Signals</p>
        <div className="flex flex-wrap gap-2">
          {data.culture_fit.map((s, i) => (
            <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd' }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {data.bias_flags.length > 0 && (
        <div className="rounded-xl p-3 border border-amber-500/25"
          style={{ background: 'rgba(245,158,11,0.08)' }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-semibold text-amber-400">Bias Detection Flags</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.bias_flags.map((f, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                ⚠️ {f}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Behavioral Signals Card ──────────────────────────────────────────────────

function BehavioralSignalsCard({ signals }: { signals: BehavioralSignal[] }) {
  if (!signals || signals.length === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 border border-purple-500/15 mb-4"
      style={{ background: 'rgba(139,92,246,0.06)' }}>
      <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Behavioral Signals</p>
      <div className="space-y-2">
        {signals.slice(0, 4).map((sig, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-28 flex-shrink-0">{sig.label}</span>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${sig.strength}%` }} transition={{ delay: i * 0.1, duration: 0.7 }}
                className="h-full rounded-full" style={{ background: behavioralColorMap[sig.color] || '#8b5cf6' }} />
            </div>
            <span className="text-xs font-semibold w-8 text-right" style={{ color: behavioralColorMap[sig.color] }}>
              {sig.strength}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<EvaluationResult | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rankings, setRankings] = useState<any[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [roleUnderstanding, setRoleUnderstanding] = useState<RoleUnderstanding | null>(null);
  const [isUnderstandingRole, setIsUnderstandingRole] = useState(false);
  const [blindMode, setBlindMode] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const topCandidate = rankings.length > 0 ? rankings[0] : null;
  const totalCandidates = rankings.length;
  const highlyRecommended = rankings.filter((c) => c.recommendation === 'Highly Recommended').length;
  const averageScore = rankings.length > 0
    ? (rankings.reduce((sum, c) => sum + c.score, 0) / rankings.length).toFixed(1) : '0';
  const bestCandidate = rankings.length > 0 ? formatName(rankings[0].name) : 'N/A';
  const avgSemanticScore = rankings.length > 0
    ? (rankings.reduce((sum, c) => sum + (c.semanticScore || 0), 0) / rankings.length).toFixed(1) : '0';

  const radarData = analysisResult ? [
    { skill: 'Skills',     value: analysisResult.skill_match,       fullMark: 100 },
    { skill: 'Projects',   value: analysisResult.project_relevance, fullMark: 100 },
    { skill: 'Semantic',   value: analysisResult.semanticScore ?? 0, fullMark: 100 },
    { skill: 'Experience', value: analysisResult.experience_score,  fullMark: 100 },
    { skill: 'ATS',        value: analysisResult.resume_quality,    fullMark: 100 },
  ] : [];

  const skillDistribution = analysisResult ? [
    { name: 'Skills',     value: analysisResult.skill_match,        color: '#3b82f6' },
    { name: 'Projects',   value: analysisResult.project_relevance,  color: '#8b5cf6' },
    { name: 'Semantic',   value: analysisResult.semanticScore ?? 0, color: '#22d3ee' },
    { name: 'Experience', value: analysisResult.experience_score,   color: '#10b981' },
    { name: 'ATS',        value: analysisResult.resume_quality,     color: '#f59e0b' },
  ] : [];

  const recDistribution = (() => {
    const map: Record<string, number> = {};
    rankings.forEach((c) => { map[c.recommendation] = (map[c.recommendation] || 0) + 1; });
    const colors: Record<string, string> = {
      'Highly Recommended': '#10b981', 'Recommended': '#3b82f6',
      'Consider': '#f59e0b', 'Not Recommended': '#ef4444',
    };
    return Object.entries(map).map(([name, value]) => ({ name, value, color: colors[name] || '#6b7280' }));
  })();

  const candidateBarData = rankings.slice(0, 8).map((c) => ({
    name: blindMode ? `C${rankings.indexOf(c) + 1}` : formatName(c.name).split(' ')[0],
    score: c.score,
    semantic: c.semanticScore ?? 0,
  }));

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['dashboard', 'analysis', 'insights', 'rankings', 'about'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) { setActiveSection(section); break; }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.zip')) setZipFile(f);
  };

  const downloadReport = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/download-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankings, job_description: jobDescription }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'TalentIQ_Report.pdf';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Unable to download report.'); }
  };

  const exportCSV = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/export-csv', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankings }),
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'TalentIQ_Rankings.csv';
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) { console.error(err); alert('Unable to export CSV.'); }
  };

  const analyzeCandidate = async () => {
    if (!zipFile || !jobDescription) return;
    setIsAnalyzing(true);

    // First: understand the role
    setIsUnderstandingRole(true);
    try {
      const roleRes = await fetch('http://127.0.0.1:8000/understand-role', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_description: jobDescription }),
      });
      const roleData = await roleRes.json();
      if (roleData.role_understanding) setRoleUnderstanding(roleData.role_understanding);
    } catch (e) { console.error('Role understanding failed:', e); }
    setIsUnderstandingRole(false);

    // Then: evaluate candidates
    try {
      const formData = new FormData();
      formData.append('file', zipFile);
      formData.append('job_description', jobDescription);
      const response = await fetch('http://127.0.0.1:8000/bulk-evaluate-zip', { method: 'POST', body: formData });
      const data = await response.json();
      setRankings(data.rankings || []);
      if (data.rankings && data.rankings.length > 0) {
        const top = data.rankings[0];
        setAnalysisResult({
          skill_match: top.skillMatch,
          project_relevance: top.project_relevance ?? 0,
          experience_score: top.experience_score ?? 0,
          resume_quality: top.resume_quality ?? 0,
          final_score: top.score,
          feedback: top.feedback,
          strengths: top.strengths ?? [],
          weaknesses: top.weaknesses ?? [],
          missingSkills: top.missingSkills ?? [],
          semanticScore: top.semanticScore ?? 0,
          confidenceLower: top.confidenceLower ?? 0,
          confidenceUpper: top.confidenceUpper ?? 0,
        });
      } else {
        alert('No candidates could be evaluated.');
      }
    } catch (error) { console.error(error); }
    finally { setIsAnalyzing(false); }
  };

  const sendChatMessage = async (overrideText?: string) => {
    const text = overrideText ?? chatInput;
    if (!text.trim()) return;
    setChatMessages((prev) => [...prev, { role: 'user', content: text }]);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, rankings: rankings.slice(0, 5) }),
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Unable to contact AI assistant.' }]);
    } finally { setIsChatLoading(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 40%, #0f172a 100%)' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .glass-card {
          background: rgba(255,255,255,0.04); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; transition: all 0.3s ease;
        }
        .glass-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.14); transform: translateY(-2px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        .glass-chat { background: rgba(10,15,35,0.85); backdrop-filter: blur(32px); -webkit-backdrop-filter: blur(32px); border: 1px solid rgba(255,255,255,0.10); border-radius: 24px; box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.15); }
        .gradient-btn { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); }
        .gradient-text { background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #34d399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glow { box-shadow: 0 0 30px rgba(59,130,246,0.4), 0 0 60px rgba(139,92,246,0.2); }
        .glow-sm { box-shadow: 0 0 15px rgba(59,130,246,0.3); }
        .card-glow-blue { box-shadow: 0 0 0 1px rgba(59,130,246,0.2), 0 8px 32px rgba(59,130,246,0.1); }
        .card-glow-purple { box-shadow: 0 0 0 1px rgba(139,92,246,0.2), 0 8px 32px rgba(139,92,246,0.1); }
        .card-glow-green { box-shadow: 0 0 0 1px rgba(16,185,129,0.2), 0 8px 32px rgba(16,185,129,0.1); }
        .card-glow-amber { box-shadow: 0 0 0 1px rgba(245,158,11,0.2), 0 8px 32px rgba(245,158,11,0.1); }
        .card-glow-cyan { box-shadow: 0 0 0 1px rgba(34,211,238,0.2), 0 8px 32px rgba(34,211,238,0.1); }
        .animate-float { animation: float 6s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        .chat-scroll::-webkit-scrollbar{width:4px} .chat-scroll::-webkit-scrollbar-track{background:transparent} .chat-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        .nav-active{position:relative;color:#60a5fa}
        .nav-active::after{content:'';position:absolute;bottom:-4px;left:0;right:0;height:2px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:2px}
        .chip-green{background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.3);color:#34d399}
        .chip-red{background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);color:#f87171}
        .chip-amber{background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);color:#fbbf24}
        .chip-blue{background:rgba(59,130,246,0.12);border:1px solid rgba(59,130,246,0.3);color:#93c5fd}
        .quick-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:500;border:1px solid rgba(255,255,255,0.10);background:rgba(255,255,255,0.05);color:#cbd5e1;cursor:pointer;white-space:nowrap;transition:all 0.2s ease}
        .quick-chip:hover{background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.4);color:#93c5fd;transform:translateY(-1px)}
        @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}100%{transform:scale(1.6);opacity:0}}
        .pulse-ring::before{content:'';position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.4);animation:pulse-ring 2s ease-out infinite}
      `}</style>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div className="flex items-center gap-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="w-8 h-8 rounded-xl gradient-btn flex items-center justify-center glow-sm">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">TalentIQ AI</span>
            </motion.div>
            <div className="hidden md:flex items-center gap-8">
              {['Dashboard','Candidate Analysis','Insights','Rankings','About'].map((item, idx) => {
                const id = ['dashboard','analysis','insights','rankings','about'][idx];
                return (
                  <a key={item} href={`#${id}`} className={`text-sm font-medium transition-colors relative pb-1 ${activeSection===id?'nav-active':'text-gray-400 hover:text-white'}`}>{item}</a>
                );
              })}
            </div>
            <div className="hidden md:flex items-center gap-4">
              {/* Blind Mode Toggle */}
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setBlindMode(!blindMode)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${blindMode ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                {blindMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {blindMode ? 'Blind Mode ON' : 'Blind Mode'}
              </motion.button>
              <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-9 h-9 rounded-full gradient-btn flex items-center justify-center glow-sm">
                <span className="text-sm font-semibold">JD</span>
              </div>
            </div>
            <button className="md:hidden p-2 text-gray-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass border-t border-white/5">
              <div className="px-4 py-4 space-y-1">
                {['Dashboard','Candidate Analysis','Insights','Rankings','About'].map((item, idx) => (
                  <a key={item} href={`#${['dashboard','analysis','insights','rankings','about'][idx]}`}
                    className="block text-sm font-medium text-gray-400 hover:text-white py-2 px-3 rounded-lg hover:bg-white/5"
                    onClick={() => setMobileMenuOpen(false)}>{item}</a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section id="dashboard" className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-400/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass mb-8 border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300 font-medium">Hybrid AI · Semantic Search + LLM Ranking</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
              <span className="text-white">Find the Best Candidate</span><br />
              <span className="gradient-text">in Seconds</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Hybrid AI ranking using semantic vector search + LLM evaluation. Not keyword matching — genuine understanding.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.a href="#analysis" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl gradient-btn text-white font-semibold text-lg shadow-lg glow">
                Analyze Candidates <ChevronRight className="w-5 h-5" />
              </motion.a>
              <motion.button whileHover={{ scale: 1.05 }} onClick={() => setShowMethodology(!showMethodology)}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl text-gray-300 font-semibold border border-white/10 hover:bg-white/5 transition-all">
                <Activity className="w-5 h-5" /> How it Works
              </motion.button>
            </div>
          </motion.div>

          {/* Methodology Card */}
          <AnimatePresence>
            {showMethodology && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="mt-10 glass-card p-6 max-w-3xl mx-auto">
                <h3 className="text-lg font-bold mb-4 text-center">🧠 Hybrid Scoring Methodology</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Skill Match', pct: '34%', color: '#3b82f6', desc: 'LLM-evaluated technical skills' },
                    { label: 'Semantic Fit', pct: '15%', color: '#22d3ee', desc: 'Vector cosine similarity' },
                    { label: 'Projects', pct: '21%', color: '#8b5cf6', desc: 'Relevant project experience' },
                    { label: 'Experience', pct: '17%', color: '#10b981', desc: 'Career history depth' },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-2xl font-extrabold mb-1" style={{ color: m.color }}>{m.pct}</div>
                      <div className="text-xs font-semibold text-white mb-1">{m.label}</div>
                      <div className="text-xs text-gray-500">{m.desc}</div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-500 mt-4">
                  Semantic search uses <strong className="text-gray-300">all-MiniLM-L6-v2</strong> embeddings · LLM uses <strong className="text-gray-300">Llama 3.3 70B</strong>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {[
              { label: 'Candidates Analyzed', value: '10,000+', icon: Users, glowClass: 'card-glow-blue' },
              { label: 'Accuracy Rate',        value: '98.5%',   icon: Target, glowClass: 'card-glow-purple' },
              { label: 'Time Saved',           value: '85%',     icon: Zap, glowClass: 'card-glow-green' },
              { label: 'Enterprise Clients',   value: '250+',    icon: Globe, glowClass: 'card-glow-amber' },
            ].map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + idx * 0.08 }}
                className={`glass-card p-6 text-center ${stat.glowClass}`}>
                <stat.icon className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ANALYSIS */}
      <section id="analysis" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">

            {/* Left */}
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/20">
                  <Upload className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold">Candidate Submission</h2>
              </div>

              {/* Role Understanding */}
              {roleUnderstanding && <RoleUnderstandingCard data={roleUnderstanding} />}
              {isUnderstandingRole && (
                <div className="mb-8 rounded-2xl p-4 border border-cyan-500/20 text-center"
                  style={{ background: 'rgba(34,211,238,0.05)' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full mx-auto mb-2" />
                  <p className="text-xs text-cyan-400">Analyzing role requirements...</p>
                </div>
              )}

              {/* Top Candidate */}
              {topCandidate && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-8 rounded-2xl border border-amber-500/25 p-6"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(239,68,68,0.06) 100%)' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-amber-400">🏆 Top Candidate</h2>
                      <p className="text-xs text-gray-400">Highest Hybrid Score</p>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {blindMode ? 'Candidate #1' : formatName(topCandidate.name)}
                  </h3>
                  {topCandidate.experienceLevel && (
                    <p className="text-xs text-cyan-400 mb-3 font-medium">{topCandidate.experienceLevel}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="chip-blue px-3 py-1.5 rounded-full text-sm font-semibold">Score: {topCandidate.score}</span>
                    {topCandidate.semanticScore && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-semibold border"
                        style={{ background: 'rgba(34,211,238,0.12)', borderColor: 'rgba(34,211,238,0.3)', color: '#67e8f9' }}>
                        Semantic: {topCandidate.semanticScore}%
                      </span>
                    )}
                    <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getRecommendationBadge(topCandidate.recommendation).bg} ${getRecommendationBadge(topCandidate.recommendation).text}`}>
                      {getRecommendationBadge(topCandidate.recommendation).label}
                    </span>
                  </div>
                  {topCandidate.whyFits && (
                    <p className="text-sm text-cyan-300 italic mb-3 leading-relaxed">"{topCandidate.whyFits}"</p>
                  )}
                  <p className="text-gray-300 text-sm leading-relaxed mb-4">{topCandidate.feedback}</p>
                  {topCandidate.behavioralSignals?.length > 0 && (
                    <BehavioralSignalsCard signals={topCandidate.behavioralSignals} />
                  )}
                  {topCandidate.strengths?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Strengths</p>
                      <div className="flex flex-wrap gap-2">
                        {topCandidate.strengths.map((item: string, i: number) => (
                          <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                            className="chip-green px-3 py-1 rounded-full text-xs font-medium">{item}</motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                  {topCandidate.missingSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Missing Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {topCandidate.missingSkills.map((item: string, i: number) => (
                          <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                            className="chip-red px-3 py-1 rounded-full text-xs font-medium">{item}</motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Drop Zone */}
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${zipFile ? 'border-blue-500 bg-blue-500/8' : 'border-white/15 hover:border-blue-500/50 hover:bg-white/3'}`}>
                <input ref={fileInputRef} type="file" accept=".zip" className="hidden"
                  onChange={(e) => e.target.files?.[0] && setZipFile(e.target.files[0])} />
                <AnimatePresence mode="wait">
                  {zipFile ? (
                    <motion.div key="uploaded" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-blue-400" />
                      </div>
                      <div className="text-white font-semibold">{zipFile.name}</div>
                      <div className="text-sm text-gray-400">{(zipFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </motion.div>
                  ) : (
                    <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                      <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                        <Upload className="w-12 h-12 text-gray-500" />
                      </motion.div>
                      <div className="text-white font-semibold">Drop ZIP file here or click to upload</div>
                      <div className="text-sm text-gray-500">ZIP files containing PDF resumes</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Job Description */}
              <div className="mt-7">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Job Description</label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  placeholder={`Paste the job description here...\n\nThe AI will analyze and understand the role before ranking candidates.`}
                  className="w-full h-44 rounded-xl p-4 text-white placeholder-gray-600 resize-none focus:outline-none transition-all text-sm leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.08)')}
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-xs text-gray-600">{jobDescription.length} chars</span>
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={analyzeCandidate} disabled={!zipFile || !jobDescription || isAnalyzing}
                className={`w-full mt-5 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all ${zipFile && jobDescription && !isAnalyzing ? 'gradient-btn text-white glow' : 'text-gray-500 cursor-not-allowed'}`}
                style={!(zipFile && jobDescription && !isAnalyzing) ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                {isAnalyzing ? (
                  <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                    Running Hybrid AI Analysis...</>
                ) : (
                  <><Brain className="w-5 h-5" />Analyze Candidates</>
                )}
              </motion.button>
            </motion.div>

            {/* Right — Report */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-6 sm:p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/20">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-bold">AI Evaluation Report</h2>
                </div>
                {rankings.length > 0 && (
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={exportCSV}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs text-white transition-all"
                      style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
                      <Download className="w-3.5 h-3.5" /> CSV
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={downloadReport}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-xs text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                      <FileText className="w-3.5 h-3.5" /> PDF
                    </motion.button>
                  </div>
                )}
              </div>

              <AnimatePresence mode="wait">
                {analysisResult ? (
                  <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    {/* Score Circle */}
                    <div className="flex flex-col items-center py-4">
                      <div className="relative w-40 h-40">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
                          <motion.circle cx="80" cy="80" r="70" stroke={getScoreColor(analysisResult.final_score)}
                            strokeWidth="10" fill="none" strokeLinecap="round"
                            initial={{ strokeDasharray: '0 440' }}
                            animate={{ strokeDasharray: `${(analysisResult.final_score / 100) * 440} 440` }}
                            transition={{ duration: 1.5, ease: 'easeOut' }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-4xl font-extrabold" style={{ color: getScoreColor(analysisResult.final_score) }}>
                            {analysisResult.final_score}
                          </motion.span>
                          <span className="text-gray-500 text-sm">/100</span>
                        </div>
                      </div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-3 text-center">
                        <span className="text-lg font-bold" style={{ color: getScoreColor(analysisResult.final_score) }}>
                          {getScoreLabel(analysisResult.final_score)}
                        </span>
                        {/* Confidence interval */}
                        {analysisResult.confidenceLower !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            Confidence range: <span className="text-gray-300">{analysisResult.confidenceLower} – {analysisResult.confidenceUpper}</span>
                          </div>
                        )}
                      </motion.div>
                    </div>

                    {/* Semantic Score highlight */}
                    {analysisResult.semanticScore !== undefined && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl p-4 border border-cyan-500/20 flex items-center justify-between"
                        style={{ background: 'rgba(34,211,238,0.06)' }}>
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-cyan-400" />
                          <div>
                            <p className="text-xs text-gray-400">Semantic Vector Similarity</p>
                            <p className="text-xs text-gray-600">all-MiniLM-L6-v2 embeddings</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-cyan-400">{analysisResult.semanticScore}%</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Skill Match',       value: analysisResult.skill_match,       weight: '34%', icon: Target },
                        { label: 'Project Relevance', value: analysisResult.project_relevance, weight: '21%', icon: Layers },
                        { label: 'Experience Score',  value: analysisResult.experience_score,  weight: '17%', icon: Briefcase },
                        { label: 'ATS Compatibility', value: analysisResult.resume_quality,    weight: '13%', icon: Shield },
                      ].map((metric, idx) => (
                        <motion.div key={metric.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                          className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-1.5">
                              <metric.icon className="w-3.5 h-3.5 text-gray-500" />
                              <span className="text-xs text-gray-400 font-medium">{metric.label}</span>
                            </div>
                            <span className="text-xs text-gray-600">{metric.weight}</span>
                          </div>
                          <div className="flex items-end justify-between mb-3">
                            <span className="text-2xl font-extrabold" style={{ color: getScoreColor(metric.value) }}>{metric.value}%</span>
                            {metric.value >= 80 ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                              : metric.value >= 60 ? <Activity className="w-4 h-4 text-amber-400" />
                              : <TrendingDown className="w-4 h-4 text-red-400" />}
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${metric.value}%` }} transition={{ delay: idx * 0.1 + 0.3, duration: 0.9 }}
                              className="h-full rounded-full" style={{ background: getScoreColor(metric.value) }} />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Feedback */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                      className="rounded-xl p-5 border border-blue-500/15" style={{ background: 'rgba(59,130,246,0.06)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-blue-300">AI Feedback</span>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{analysisResult.feedback}</p>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                      <BarChart3 className="w-10 h-10 text-blue-400/50" />
                    </div>
                    <div className="text-gray-400 font-medium mb-2">No analysis yet</div>
                    <div className="text-gray-600 text-sm">Upload a ZIP and add a job description to start</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* INSIGHTS */}
      <section id="insights" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">AI Recruiter Insights</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Behavioral signals, semantic fit, and structured skill analysis</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            {[
              { title: 'Strengths',      icon: CheckCircle,  chipClass: 'chip-green', items: analysisResult?.strengths || [],     emptyText: 'Run analysis to see strengths' },
              { title: 'Missing Skills', icon: XCircle,      chipClass: 'chip-red',   items: analysisResult?.missingSkills || [], emptyText: 'Run analysis to see gaps' },
              { title: 'Weaknesses',     icon: AlertCircle,  chipClass: 'chip-amber', items: analysisResult?.weaknesses || [],    emptyText: 'Run analysis to see weaknesses' },
            ].map((sec, idx) => (
              <motion.div key={sec.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <sec.icon className={`w-5 h-5 ${sec.chipClass.includes('green') ? 'text-emerald-400' : sec.chipClass.includes('red') ? 'text-red-400' : 'text-amber-400'}`} />
                  <h3 className="text-lg font-bold">{sec.title}</h3>
                </div>
                {sec.items.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sec.items.map((item, i) => (
                      <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                        className={`${sec.chipClass} px-3 py-1.5 rounded-full text-sm font-medium`}>{item}</motion.span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-600 text-sm">{sec.emptyText}</div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Hiring Recommendation */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-8 glass-card p-8 border border-blue-500/20"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.06) 100%)' }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                  <Award className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Hiring Recommendation</div>
                  <div className="text-xl font-bold text-white">Recommended for Technical Interview</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div initial={{ width: 0 }} whileInView={{ width: '92%' }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#3b82f6,#10b981)' }} />
                  </div>
                  <span className="text-emerald-400 font-bold">92%</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6 mt-8">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" /> Skill Radar (incl. Semantic)
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Radar name="Candidate" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="glass-card p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" /> Score Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={skillDistribution} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {skillDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </section>

      {/* RANKINGS */}
      <section id="rankings" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
            {[
              { icon: Users,    value: totalCandidates,   label: 'Total Candidates',     glow: 'card-glow-blue',   color: 'text-blue-400' },
              { icon: Award,    value: highlyRecommended, label: 'Highly Recommended',   glow: 'card-glow-amber',  color: 'text-amber-400' },
              { icon: BarChart3,value: averageScore,       label: 'Average Score',        glow: 'card-glow-green',  color: 'text-emerald-400' },
              { icon: Cpu,      value: avgSemanticScore,   label: 'Avg Semantic Score',   glow: 'card-glow-cyan',   color: 'text-cyan-400' },
              { icon: Star,     value: bestCandidate,      label: 'Top Candidate',        glow: 'card-glow-purple', color: 'text-purple-400' },
            ].map((stat, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.07 }}
                className={`glass-card p-5 text-center ${stat.glow}`}>
                <stat.icon className={`w-7 h-7 mx-auto ${stat.color} mb-3`} />
                <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                  {typeof stat.value === 'number' ? <AnimatedNumber value={stat.value} /> : blindMode && idx === 4 ? '***' : stat.value}
                </h3>
                <p className="text-gray-400 text-xs mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Candidate Rankings</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Hybrid AI leaderboard — Semantic + LLM scoring</p>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Rank', 'Candidate', 'Hybrid Score', 'Semantic Fit', 'Skill Match', 'Recommendation'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider p-4 px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((candidate, idx) => {
                    const name = formatName(candidate.name);
                    const badge = getRecommendationBadge(candidate.recommendation);
                    const initials = getInitials(name);
                    const displayName = blindMode ? `Candidate #${idx + 1}` : name;
                    const displayInitials = blindMode ? `C${idx + 1}` : initials;
                    return (
                      <motion.tr key={idx}
                        initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.04 }}
                        className="transition-all"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: idx === 0 ? 'rgba(245,158,11,0.03)' : 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = idx === 0 ? 'rgba(245,158,11,0.03)' : 'transparent')}>
                        <td className="p-4 px-5">
                          {idx === 0 ? (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>
                              <Star className="w-4 h-4 text-white" />
                            </div>
                          ) : (
                            <span className="text-gray-500 font-semibold text-sm">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="p-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                              style={{ background: `linear-gradient(135deg,${getScoreColor(candidate.score)},${getScoreColor(candidate.skillMatch)})` }}>
                              {displayInitials}
                            </div>
                            <div>
                              <div className="font-semibold text-white">{displayName}</div>
                              {candidate.experienceLevel && !blindMode && (
                                <div className="text-xs text-gray-500">{candidate.experienceLevel}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                              <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                                whileInView={{ width: `${candidate.score}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: idx * 0.04 }}
                                style={{ background: getScoreColor(candidate.score) }} />
                            </div>
                            <span className="font-bold text-sm" style={{ color: getScoreColor(candidate.score) }}>{candidate.score}</span>
                          </div>
                        </td>
                        <td className="p-4 px-5">
                          <span className="font-semibold text-sm" style={{ color: '#22d3ee' }}>
                            {candidate.semanticScore ? `${candidate.semanticScore}%` : '—'}
                          </span>
                        </td>
                        <td className="p-4 px-5">
                          <span className="font-semibold" style={{ color: getScoreColor(candidate.skillMatch) }}>{candidate.skillMatch}%</span>
                        </td>
                        <td className="p-4 px-5">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {rankings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-600">
                        No candidates yet — run an analysis to populate the leaderboard
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Charts */}
          {rankings.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-6 mt-8">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" /> Score vs Semantic Fit
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={candidateBarData}>
                    <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="score" name="Hybrid Score" radius={[6, 6, 0, 0]}>
                      {candidateBarData.map((_, i) => <Cell key={i} fill={i === 0 ? '#f59e0b' : '#3b82f6'} />)}
                    </Bar>
                    <Bar dataKey="semantic" name="Semantic Fit" radius={[6, 6, 0, 0]}>
                      {candidateBarData.map((_, i) => <Cell key={i} fill={i === 0 ? '#22d3ee' : 'rgba(34,211,238,0.5)'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" /> Recommendation Distribution
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={recDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                      {recDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                    <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ color: '#9ca3af', fontSize: '12px' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Why TalentIQ AI?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Hybrid AI that ranks candidates the way a great recruiter would</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Cpu,    title: 'Semantic Search',    description: 'Vector embeddings (all-MiniLM-L6-v2) measure meaning, not keywords. "ML Engineer" matches "AI Developer".' },
              { icon: Brain,  title: 'LLM Evaluation',     description: 'Llama 3.3 70B reads each resume like a senior recruiter — considering context, projects, and transferable skills.' },
              { icon: Target, title: 'Hybrid Scoring',     description: 'Combines semantic similarity (15%) + LLM scoring (85%) for the most accurate candidate ranking.' },
            ].map((feature, idx) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="glass-card p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/12 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-btn flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">TalentIQ AI</span>
          </div>
          <div className="text-sm text-gray-600">Semantic Search · LLM Ranking · Hybrid AI Scoring</div>
        </div>
      </footer>

      {/* FLOATING AI CHAT */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button key="trigger" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-btn text-white flex items-center justify-center glow pulse-ring shadow-2xl"
            aria-label="Open AI Recruiter Assistant">
            <Bot className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {chatOpen && (
          <motion.div key="chat-window" drag dragMomentum={false} dragElastic={0}
            initial={{ opacity: 0, scale: 0.85, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[420px] max-h-[640px] flex flex-col glass-chat overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 select-none"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'linear-gradient(135deg,rgba(59,130,246,0.10) 0%,rgba(139,92,246,0.08) 100%)', cursor: 'grab' }}
              onMouseDown={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-xl gradient-btn flex items-center justify-center glow-sm">
                  <Brain className="w-4 h-4 text-white" />
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-gray-900" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">AI Recruiter</div>
                  <div className="text-xs text-emerald-400 font-medium">Online · Drag to move</div>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setChatOpen(false)}
                onPointerDown={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all" style={{ cursor: 'pointer' }}>
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {QUICK_ACTIONS.map((action) => (
                  <button key={action.label} className="quick-chip flex-shrink-0" onClick={() => sendChatMessage(action.prompt)}>
                    <action.icon className="w-3.5 h-3.5" />{action.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scroll" style={{ minHeight: 0 }}>
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-16 h-16 rounded-3xl gradient-btn flex items-center justify-center mb-4 glow">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-white font-bold mb-2">AI Recruiter Assistant</div>
                  <div className="text-gray-500 text-sm leading-relaxed px-4">
                    Ask me anything about candidates, or tap a quick action above to get started.
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2.5`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full gradient-btn flex items-center justify-center flex-shrink-0 mt-1 glow-sm">
                        <Brain className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[78%] rounded-2xl text-sm leading-relaxed px-4 py-3 ${msg.role === 'user' ? 'text-white rounded-br-md' : 'text-gray-200 rounded-bl-md'}`}
                      style={msg.role === 'user'
                        ? { background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }
                        : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold"
                        style={{ background: 'rgba(255,255,255,0.1)' }}>JD</div>
                    )}
                  </motion.div>
                ))
              )}
              {isChatLoading && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full gradient-btn flex items-center justify-center flex-shrink-0">
                    <Brain className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="rounded-2xl rounded-bl-md" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-2 rounded-2xl px-4 py-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                  placeholder="Ask about candidates..." className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none py-1" />
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => sendChatMessage()}
                  disabled={!chatInput.trim() || isChatLoading}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${chatInput.trim() && !isChatLoading ? 'gradient-btn text-white glow-sm' : 'text-gray-600 cursor-not-allowed'}`}
                  style={!chatInput.trim() || isChatLoading ? { background: 'rgba(255,255,255,0.04)' } : {}}>
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              <div className="text-center mt-2 text-xs text-gray-700">Powered by TalentIQ AI · Press Enter to send</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
