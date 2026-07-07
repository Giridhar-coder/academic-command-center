import React, { useState, useEffect } from 'react';
import { StudentState, ChatMessage } from './types';
import { DEFAULT_STATE } from './initialData';

// Import sub-components
import DashboardOverview from './components/DashboardOverview';
import JarvisAssistant from './components/JarvisAssistant';
import CalendarExamsView from './components/CalendarExamsView';
import FinanceTracker from './components/FinanceTracker';
import HealthFitnessView from './components/HealthFitnessView';
import ProjectsFilesView from './components/ProjectsFilesView';

// Firebase Integrations
import { 
  auth, 
  fetchCompleteState, 
  initializeNewUser, 
  syncCollection, 
  db 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInAnonymously
} from 'firebase/auth';

import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

// Icons
import { 
  Sparkles, 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  Dumbbell, 
  FolderGit2,
  Terminal,
  RotateCcw,
  LogOut
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [state, setState] = useState<StudentState>(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(DEFAULT_STATE.chatHistory);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load and sync authenticated user state on mount / auth change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsSyncing(true);
        setDbError(null);
        try {
          const loadedState = await fetchCompleteState(currentUser.uid);
          if (loadedState) {
            setState(loadedState);
            setChatHistory(loadedState.chatHistory || []);
          } else {
            // First time login, initialize template records in Firestore
            await initializeNewUser(currentUser.uid, currentUser.displayName || 'Guest Pilot');
            
            // Adjust local state with the user's name
            const freshState = {
              ...DEFAULT_STATE,
              profile: {
                ...DEFAULT_STATE.profile,
                name: currentUser.displayName || 'Guest Pilot'
              }
            };
            setState(freshState);
            setChatHistory(freshState.chatHistory || []);
          }
        } catch (err: any) {
          console.error('Failed to load user state from Firestore:', err);
          setDbError('Error loading Firestore data. Running offline fallback.');
        } finally {
          setIsSyncing(false);
          setAuthLoading(false);
        }
      } else {
        setUser((prev: any) => {
          if (prev && prev.uid === 'local_guest_sandbox') {
            return prev;
          }
          setState(DEFAULT_STATE);
          setChatHistory(DEFAULT_STATE.chatHistory);
          return null;
        });
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setDbError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setDbError('Authentication failed: ' + (err.message || String(err)));
      setAuthLoading(false);
    }
  };

  // Anonymous Sign In Handler
  const handleAnonymousSignIn = async () => {
    setAuthLoading(true);
    setDbError(null);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error('Anonymous Sign In Error:', err);
      setDbError('Anonymous auth failed: ' + (err.message || String(err)));
      setAuthLoading(false);
    }
  };

  // Local Sandbox / Guest Mode (No Firebase Auth Required)
  const handleLocalSandbox = () => {
    setAuthLoading(true);
    setDbError(null);
    setUser({
      uid: 'local_guest_sandbox',
      displayName: 'Sandbox Pilot',
      email: 'sandbox@ailife.os',
      isAnonymous: true,
      photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
    });
    setState(DEFAULT_STATE);
    setChatHistory(DEFAULT_STATE.chatHistory);
    setAuthLoading(false);
  };

  // Logout Handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setState(DEFAULT_STATE);
      setChatHistory(DEFAULT_STATE.chatHistory);
      setActiveTab('dashboard');
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  // Update State & synchronize changes securely with Firestore
  const handleUpdateState = async (newState: StudentState) => {
    const prevState = state;
    setState(newState);
    setIsSyncing(true);
    setDbError(null);

    if (user && user.uid !== 'local_guest_sandbox') {
      try {
        const uid = user.uid;

        // 1. Sync primary profile details
        const profileRef = doc(db, 'users', uid);
        await setDoc(profileRef, {
          name: newState.profile.name,
          college: newState.profile.college,
          major: newState.profile.major,
          gpaGoal: newState.profile.gpaGoal,
          dailyCalorieGoal: newState.profile.dailyCalorieGoal,
          dailyWaterGoal: newState.profile.dailyWaterGoal,
          waterIntake: newState.profile.waterIntake,
          budget: newState.budget,
          updatedAt: new Date().toISOString()
        });

        // 2. Sync subcollections in parallel via diff-sync algorithm
        await Promise.all([
          syncCollection(uid, 'goals', newState.goals, prevState.goals),
          syncCollection(uid, 'exams', newState.exams, prevState.exams),
          syncCollection(uid, 'expenses', newState.expenses, prevState.expenses),
          syncCollection(uid, 'workouts', newState.workouts, prevState.workouts),
          syncCollection(uid, 'meals', newState.meals, prevState.meals),
          syncCollection(uid, 'projects', newState.projects, prevState.projects),
          syncCollection(uid, 'calendar', newState.calendar, prevState.calendar),
          syncCollection(uid, 'emails', newState.emails, prevState.emails),
          syncCollection(uid, 'files', newState.files, prevState.files),
          syncCollection(uid, 'chatHistory', newState.chatHistory, prevState.chatHistory),
        ]);

      } catch (err: any) {
        console.error('Firestore save sync failed:', err);
        setDbError('Save pending: synchronizing data with Firestore...');
      } finally {
        setIsSyncing(false);
      }
    } else {
      // Local server fallback (if offline / unauthenticated state modification)
      try {
        const res = await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newState),
        });
        if (!res.ok) throw new Error('Local server sync failed');
      } catch (err: any) {
        console.error(err);
        setDbError('Save pending: database connection sync failed.');
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Trigger Jarvis action directly from Dashboard shortcuts
  const handleJarvisShortcut = async (prompt: string) => {
    setActiveTab('jarvis');
    
    // Create new user message in state and push to assistant
    const userMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    
    try {
      // Temporarily write the user prompt so visual flow begins
      const tempState = {
        ...state,
        chatHistory: updatedHistory
      };
      handleUpdateState(tempState);

      const response = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, state: tempState }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Server returned an error');
      }

      const jarvisMsg: ChatMessage = {
        id: `chat_${Date.now() + 1}`,
        sender: 'jarvis',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalHistory = [...updatedHistory, jarvisMsg];
      setChatHistory(finalHistory);
      
      handleUpdateState({
        ...state,
        chatHistory: finalHistory
      });

    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `chat_${Date.now() + 2}`,
        sender: 'jarvis',
        text: `Sir/Ma'am, I encountered an issue updating your tomorrow agenda: ${err.message || 'API connection lost.'}. Please check that your GEMINI_API_KEY is configured in Settings > Secrets.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory([...updatedHistory, errMsg]);
    }
  };

  // Reset entire state database to original defaults
  const handleSystemReboot = async () => {
    if (window.confirm("Are you sure you want to reboot AI Life OS? This restores initial defaults inside your database.")) {
      handleUpdateState(DEFAULT_STATE);
      setChatHistory(DEFAULT_STATE.chatHistory);
      setActiveTab('dashboard');
    }
  };

  // Loader screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-cyan-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="flex flex-col items-center gap-4 text-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg animate-spin">
            <Sparkles size={28} className="text-indigo-100 animate-pulse" />
          </div>
          <p className="text-xs font-mono text-indigo-400 tracking-widest mt-6 animate-pulse">STATEDEPTH LOGGED // SCANNING SYSTEM CONFIG...</p>
          <h2 className="text-base font-bold text-slate-200">Authorizing JARVIS Core Connection...</h2>
        </div>
      </div>
    );
  }

  // Authentication page (if not signed in)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-y-auto py-12 px-4">
        
        {/* Background Mesh Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl relative"
        >
          {/* Hologram top edge effect */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg relative overflow-hidden">
              <Sparkles size={24} className="text-indigo-100 animate-pulse" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI Life OS</h1>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase mt-1">
                SYSTEM DEPLOYMENT // SECURED CLOUD PORT
              </p>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed font-sans">
              Welcome back, Pilot. Synchronize your student metrics, calorie logs, exam schedules, and ledger databases securely via Firebase authentication.
            </p>

            {/* Terminal simulation log */}
            <div className="w-full bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-[10px] text-slate-400 text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-indigo-400">&gt; COMPILING ASSETS...</span>
                <span className="text-emerald-400">[OK]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-400">&gt; PERSISTENCE ENGINE...</span>
                <span className="text-cyan-400">[FIRESTORE]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-400">&gt; AI INTERACTION CORE...</span>
                <span className="text-emerald-400">[ONLINE]</span>
              </div>
            </div>

            {dbError && (
              <div className="w-full space-y-2">
                <p className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded border border-rose-500/20 w-full text-center font-mono">
                  {dbError}
                </p>

                {dbError.toLowerCase().includes('unauthorized-domain') && (
                  <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left text-xs text-amber-300 space-y-3 font-sans">
                    <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                      <span>💡</span> Domain Authorization Required
                    </p>
                    <p className="leading-relaxed text-slate-300">
                      Your current preview domain is not whitelisted in your Firebase project. To fix this permanently in Firebase:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-amber-200/80">
                      <li>Go to the <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-semibold text-cyan-400 hover:text-cyan-300">Firebase Console</a></li>
                      <li>Go to <strong>Authentication &gt; Settings &gt; Authorized domains</strong></li>
                      <li>Add this domain: <code className="bg-slate-950 px-1 py-0.5 rounded text-[10px] text-amber-400 border border-white/5 font-mono break-all">{window.location.hostname}</code></li>
                    </ol>
                    <div className="h-[1px] bg-white/5 my-1"></div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      Or bypass immediately to run offline inside the container sandbox:
                    </p>
                    <button
                      onClick={handleLocalSandbox}
                      className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-xs transition-all active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      🚀 Bypass & Enter Local Sandbox
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="w-full space-y-3">
              <button
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.47 1.617l2.337-2.337C17.47 1.846 15.01 1 12.24 1c-5.522 0-10 4.478-10 10s4.478 10 10 10c5.783 0 9.613-4.06 9.613-9.78 0-.66-.06-1.29-.173-1.935H12.24z"/>
                </svg>
                Sign In with Google
              </button>

              <div className="relative flex py-2 items-center text-xs text-slate-500 font-mono">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4">OR BYPASS AUTH</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAnonymousSignIn}
                  className="py-2.5 px-3 rounded-lg bg-slate-900 border border-white/10 hover:bg-slate-850 hover:border-white/20 text-slate-300 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer text-center"
                  title="Logs in using Firebase Anonymous Mode (No Credentials)"
                >
                  Instant Guest (Cloud)
                </button>
                <button
                  onClick={handleLocalSandbox}
                  className="py-2.5 px-3 rounded-lg bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-200 font-semibold text-xs transition-all active:scale-[0.98] cursor-pointer text-center"
                  title="Bypasses Firebase Auth completely, storing data in local container state"
                >
                  Local Offline Sandbox
                </button>
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    );
  }

  // Signed In Application view
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white relative overflow-x-hidden">
      
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Upper Title Toolbar */}
      <header className="sticky top-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/10 text-white shadow-lg relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
              <span className="absolute inset-0 bg-indigo-500/10 group-hover:scale-110 transition-transform"></span>
              <Sparkles size={18} className="animate-pulse relative z-10 text-indigo-100" />
            </div>
            <div>
              <h1 className="text-base font-sans font-bold tracking-tight">AI Life OS</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                ACTIVE PROTOCOL // FIRESTORE CLOUD
              </p>
            </div>
          </div>

          {/* Sync indicator & Pilot profile info */}
          <div className="flex items-center gap-4">
            
            {dbError && (
              <span className="hidden md:inline-block text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                {dbError}
              </span>
            )}

            <div className="flex items-center gap-2">
              {user.photoURL && (
                <img 
                  src={user.photoURL} 
                  alt={state.profile.name} 
                  className="w-7 h-7 rounded-full border border-indigo-500/30 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="text-right hidden sm:block">
                <span className="text-[9px] text-slate-400 font-mono block leading-none">PILOT ACCESS:</span>
                <span className="text-xs font-bold text-slate-200 block font-sans">{state.profile.name}</span>
              </div>
            </div>

            <div className="h-8 w-[1px] bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                {isSyncing ? 'SYNCING...' : 'SYNCED'}
              </span>
              <button 
                onClick={handleSystemReboot}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Reboot System Defaults"
              >
                <RotateCcw size={15} />
              </button>
              <button 
                onClick={handleSignOut}
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={15} />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Navigation Sub-Menu Tab Rail */}
      <div className="bg-slate-950/25 backdrop-blur-md border-b border-white/5 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 h-14 items-center overflow-x-auto scrollbar-none" aria-label="Tabs">
            {[
              { id: 'dashboard', label: 'Command Center', icon: <LayoutDashboard size={15} /> },
              { id: 'jarvis', label: 'Jarvis Assistant', icon: <Terminal size={15} className="text-indigo-400" /> },
              { id: 'calendar', label: 'Calendar & Exams', icon: <Calendar size={15} /> },
              { id: 'finances', label: 'Financial Ledger', icon: <DollarSign size={15} /> },
              { id: 'fitness', label: 'Health & Gym', icon: <Dumbbell size={15} /> },
              { id: 'projects', label: 'Projects & Files', icon: <FolderGit2 size={15} /> },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-sans text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected 
                      ? 'bg-white/15 text-white border border-white/20 shadow-xl' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Render Selected View */}
        {activeTab === 'dashboard' && (
          <DashboardOverview 
            state={state} 
            setActiveTab={setActiveTab} 
            onUpdateState={handleUpdateState}
            onJarvisAction={handleJarvisShortcut}
          />
        )}

        {activeTab === 'jarvis' && (
          <JarvisAssistant 
            state={state}
            onUpdateState={handleUpdateState}
            chatHistory={chatHistory}
            onSetChatHistory={setChatHistory}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarExamsView 
            state={state} 
            onUpdateState={handleUpdateState}
          />
        )}

        {activeTab === 'finances' && (
          <FinanceTracker 
            state={state} 
            onUpdateState={handleUpdateState}
          />
        )}

        {activeTab === 'fitness' && (
          <HealthFitnessView 
            state={state} 
            onUpdateState={handleUpdateState}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsFilesView 
            state={state} 
            onUpdateState={handleUpdateState}
          />
        )}

      </main>

      {/* Ambient Footer */}
      <footer className="bg-slate-950/40 backdrop-blur-md border-t border-white/10 py-6 text-center text-xs text-slate-500 font-mono mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <p>AI LIFE OPERATING SYSTEM v3.5 // INGRESS PORT: 3000 // PERSISTENCE ENGINE: CLOUD FIRESTORE</p>
          <p className="mt-1 text-slate-600">Securely orchestrated by Google Firebase & Gemini Core.</p>
        </div>
      </footer>

    </div>
  );
}
