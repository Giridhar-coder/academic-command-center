import React, { useState, useRef, useEffect } from 'react';
import { StudentState, ChatMessage } from '../types';
import { 
  Send, 
  Sparkles, 
  CornerDownLeft, 
  Terminal, 
  RefreshCw, 
  User, 
  Bot,
  Calendar,
  BookOpen,
  DollarSign,
  Dumbbell
} from 'lucide-react';

interface JarvisAssistantProps {
  state: StudentState;
  onUpdateState: (newState: StudentState) => void;
  chatHistory: ChatMessage[];
  onSetChatHistory: (chat: ChatMessage[]) => void;
}

// Custom Markdown Component to render Jarvis response cleanly and prevent build issues
const SimpleMarkdown = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  
  const parseInline = (inlineText: string) => {
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    const segments = inlineText.split(regex);
    return segments.map((seg, idx) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-slate-900 bg-indigo-50/50 px-1.5 py-0.5 rounded">
            {seg.slice(2, -2)}
          </strong>
        );
      }
      if (seg.startsWith('`') && seg.endsWith('`')) {
        return (
          <code key={idx} className="font-mono text-xs bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded border border-slate-200">
            {seg.slice(1, -1)}
          </code>
        );
      }
      return seg;
    });
  };

  return (
    <div className="space-y-2 font-sans text-sm text-slate-800 leading-relaxed">
      {lines.map((line, i) => {
        // Headings
        if (line.startsWith('### ')) {
          return (
            <h4 key={i} className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-1 pt-3 font-sans flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              {parseInline(line.replace('### ', ''))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="text-base font-bold text-indigo-950 pt-4 pb-1 font-sans border-l-2 border-indigo-500 pl-2">
              {parseInline(line.replace('## ', ''))}
            </h3>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="text-lg font-bold text-indigo-900 pt-5 pb-2 font-sans">
              {parseInline(line.replace('# ', ''))}
            </h2>
          );
        }
        
        // Bullet Points
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
          const content = line.trim().substring(2);
          return (
            <div key={i} className="flex items-start gap-2 pl-3">
              <span className="text-indigo-500 mt-1.5 font-bold shrink-0">•</span>
              <span className="flex-1 font-sans text-slate-700 text-sm">{parseInline(content)}</span>
            </div>
          );
        }

        // Numbered List
        const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          return (
            <div key={i} className="flex items-start gap-2 pl-3">
              <span className="font-mono text-xs text-indigo-500 mt-0.5 font-bold shrink-0">{numMatch[1]}.</span>
              <span className="flex-1 font-sans text-slate-700 text-sm">{parseInline(numMatch[2])}</span>
            </div>
          );
        }

        // Empty lines
        if (line.trim() === '') {
          return <div key={i} className="h-1" />;
        }

        // Default Paragraph
        return <p key={i} className="font-sans text-slate-700 text-sm">{parseInline(line)}</p>;
      })}
    </div>
  );
};

export default function JarvisAssistant({
  state,
  onUpdateState,
  chatHistory,
  onSetChatHistory
}: JarvisAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on chat update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const triggerJarvis = async (message: string) => {
    if (!message.trim() || isLoading) return;

    setErrorText(null);
    const userMsg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedHistory = [...chatHistory, userMsg];
    onSetChatHistory(updatedHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message, state }),
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
      onSetChatHistory(finalHistory);

      // Save state update in local JSON DB so chat logs persist
      onUpdateState({
        ...state,
        chatHistory: finalHistory
      });
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Connecting to Jarvis failed. Make sure your API Key is specified in Secrets.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerJarvis(inputText);
  };

  const handlePresetClick = (preset: string) => {
    triggerJarvis(preset);
  };

  const clearHistory = () => {
    const resetHistory: ChatMessage[] = [
      {
        id: 'ch_init',
        sender: 'jarvis',
        text: `Systems rebooted, ${state.profile.name}. Clear memory initiated. How may I serve you now?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    onSetChatHistory(resetHistory);
    onUpdateState({
      ...state,
      chatHistory: resetHistory
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[500px]" id="jarvis-tab">
      
      {/* Control center panel */}
      <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Terminal size={18} />
            </div>
            <div>
              <h2 className="font-sans font-bold text-slate-800 text-sm">Life OS Console</h2>
              <p className="text-[10px] text-slate-400 font-mono">STATUS: SYNCHRONIZED</p>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500 font-sans space-y-1.5">
            <div className="flex justify-between">
              <span>Student Profile:</span>
              <span className="font-semibold text-slate-700">{state.profile.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Academic Data:</span>
              <span className="font-semibold text-slate-700">{state.exams.length} Exams / {state.calendar.length} Classes</span>
            </div>
            <div className="flex justify-between">
              <span>Budget Health:</span>
              <span className="font-semibold text-slate-700">${(state.budget.allowance - state.expenses.reduce((s, e) => s + e.amount, 0)).toFixed(0)} Safe</span>
            </div>
            <div className="flex justify-between">
              <span>Fitness Focus:</span>
              <span className="font-semibold text-slate-700">{state.meals.length} Meal entries</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">Direct Actions</h3>
            <div className="space-y-2 text-xs">
              <button 
                onClick={() => handlePresetClick("Prepare me for tomorrow.")}
                className="w-full p-2.5 rounded-lg border border-slate-100 hover:border-indigo-150 bg-slate-50 hover:bg-indigo-50/10 hover:text-indigo-950 font-sans text-left flex items-center gap-2 text-slate-700 transition-all cursor-pointer"
              >
                <Calendar size={13} className="text-slate-400" />
                "Prepare me for tomorrow"
              </button>
              <button 
                onClick={() => handlePresetClick("Create a dynamic revision checklist for my upcoming algorithms midterm using my uploaded syllabus PDF details.")}
                className="w-full p-2.5 rounded-lg border border-slate-100 hover:border-indigo-150 bg-slate-50 hover:bg-indigo-50/10 hover:text-indigo-950 font-sans text-left flex items-center gap-2 text-slate-700 transition-all cursor-pointer"
              >
                <BookOpen size={13} className="text-slate-400" />
                "Midterm Revision Plan"
              </button>
              <button 
                onClick={() => handlePresetClick("Analyze my recent purchases. Am I spending too much on textbooks or coffee and what's my safe-to-spend allowance remaining?")}
                className="w-full p-2.5 rounded-lg border border-slate-100 hover:border-indigo-150 bg-slate-50 hover:bg-indigo-50/10 hover:text-indigo-950 font-sans text-left flex items-center gap-2 text-slate-700 transition-all cursor-pointer"
              >
                <DollarSign size={13} className="text-slate-400" />
                "Audit my finances"
              </button>
              <button 
                onClick={() => handlePresetClick("Analyze my food intakes and daily workout log. Let me know if I have enough energy for dynamic dynamic programming reviews!")}
                className="w-full p-2.5 rounded-lg border border-slate-100 hover:border-indigo-150 bg-slate-50 hover:bg-indigo-50/10 hover:text-indigo-950 font-sans text-left flex items-center gap-2 text-slate-700 transition-all cursor-pointer"
              >
                <Dumbbell size={13} className="text-slate-400" />
                "Gym & Meal Alignment"
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={clearHistory}
          className="w-full py-2 rounded-lg border border-rose-100 hover:bg-rose-50 text-xs font-sans text-rose-600 font-semibold text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} />
          Reset Chat Log
        </button>
      </div>

      {/* Main chat window */}
      <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white flex flex-col h-full overflow-hidden shadow-sm">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white relative">
              <Sparkles size={16} />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">Jarvis Core</h3>
              <p className="text-[10px] text-slate-400 font-mono">MODEL: GEMINI-3.5-FLASH</p>
            </div>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">
          {chatHistory.map((msg) => {
            const isJarvis = msg.sender === 'jarvis';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] ${
                  isJarvis ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                }`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  isJarvis 
                    ? 'bg-slate-100 text-indigo-600 border border-slate-200' 
                    : 'bg-indigo-600 text-white'
                }`}>
                  {isJarvis ? <Bot size={15} /> : <User size={15} />}
                </div>

                {/* Message bubble */}
                <div className="space-y-1">
                  <div className={`p-4 rounded-xl shadow-sm text-sm leading-relaxed ${
                    isJarvis 
                      ? 'bg-white border border-slate-200/60 rounded-tl-none text-slate-800' 
                      : 'bg-indigo-600 rounded-tr-none text-white font-medium'
                  }`}>
                    {isJarvis ? (
                      <SimpleMarkdown text={msg.text} />
                    ) : (
                      <p className="font-sans whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono px-1 block">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading bubble */}
          {isLoading && (
            <div className="flex gap-3 max-w-[80%] mr-auto text-left">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-indigo-600 border border-slate-200 flex items-center justify-center animate-spin">
                <Sparkles size={15} />
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-150 rounded-tl-none shadow-sm space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 animate-pulse">
                  <span>STATEDEPTH LOGGED... CALCULATING TOMORROW AGENDA...</span>
                </div>
                <div className="flex space-x-1.5 pt-1.5">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error notice */}
          {errorText && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-100 text-xs font-sans text-rose-700 space-y-1 max-w-lg mx-auto">
              <p className="font-bold">Database & API Sync Alert:</p>
              <p>{errorText}</p>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat input form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100 bg-white">
          <div className="relative flex items-center border border-slate-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 rounded-xl px-3 py-2.5 transition-all">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask Jarvis... (e.g. "Prepare me for tomorrow")`}
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none font-sans text-sm text-slate-800 placeholder-slate-400 pr-10 focus:ring-0 focus:outline-none"
            />
            <div className="absolute right-3 flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded">
                <CornerDownLeft size={10} />
                Enter
              </span>
              <button 
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-100 text-white disabled:text-slate-400 transition-colors cursor-pointer"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
