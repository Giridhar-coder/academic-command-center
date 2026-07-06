import React from 'react';
import { StudentState, Exam, Goal } from '../types';
import { 
  GraduationCap, 
  Flame, 
  Droplet, 
  Calendar, 
  TrendingDown, 
  CheckCircle2, 
  Circle, 
  Mail, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface DashboardOverviewProps {
  state: StudentState;
  setActiveTab: (tab: string) => void;
  onUpdateState: (newState: StudentState) => void;
  onJarvisAction: (prompt: string) => void;
}

export default function DashboardOverview({
  state,
  setActiveTab,
  onUpdateState,
  onJarvisAction
}: DashboardOverviewProps) {
  const { profile, goals, exams, expenses, budget, workouts, meals, emails } = state;

  // Calculations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = Math.max(0, budget.allowance - totalSpent);
  
  const consumedCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const caloriePercent = Math.min(100, Math.round((consumedCalories / profile.dailyCalorieGoal) * 100));
  const waterPercent = Math.min(100, Math.round((profile.waterIntake / profile.dailyWaterGoal) * 100));

  const pendingGoals = goals.filter(g => !g.completed);
  const completedGoalsCount = goals.filter(g => g.completed).length;

  const unreadEmailsCount = emails.filter(e => e.unread).length;

  // Add water helper
  const addWater = (amount: number) => {
    const updated = {
      ...state,
      profile: {
        ...state.profile,
        waterIntake: state.profile.waterIntake + amount
      }
    };
    onUpdateState(updated);
  };

  // Toggle goal completion
  const toggleGoal = (goalId: string) => {
    const updated = {
      ...state,
      goals: state.goals.map(g => g.id === goalId ? { ...g, completed: !g.completed } : g)
    };
    onUpdateState(updated);
  };

  // Calculate days remaining for an exam
  const getExamCountdown = (examDateStr: string) => {
    const today = new Date('2026-07-06');
    const examDate = new Date(examDateStr);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white border border-slate-700/50 shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={120} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-mono font-medium">
            <Sparkles size={13} className="animate-pulse" />
            AI LIFE OPERATING SYSTEM ONLINE
          </div>
          <h1 className="text-3xl font-sans font-bold tracking-tight">
            Welcome back, {profile.name}
          </h1>
          <p className="text-slate-300 font-sans max-w-2xl text-sm">
            You are enrolled at <span className="font-semibold text-white">{profile.college}</span>, majoring in <span className="font-semibold text-white">{profile.major}</span>. Jarvis is synchronized and monitoring {exams.length} upcoming exams.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onJarvisAction("Prepare me for tomorrow.")}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-sans font-semibold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              "Prepare me for tomorrow."
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => setActiveTab('jarvis')}
              className="px-4 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/85 border border-slate-700 font-sans font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              Consult Jarvis AI
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Academic Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                <GraduationCap size={18} />
              </div>
              <h2 className="font-sans font-semibold text-slate-800">Academic Status</h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Goal: {profile.gpaGoal} GPA
            </span>
          </div>

          {exams.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">Upcoming Exams</h3>
              <div className="space-y-2.5">
                {exams.map((exam) => {
                  const days = getExamCountdown(exam.date);
                  const isUrgent = days <= 3;
                  return (
                    <div key={exam.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="space-y-0.5">
                        <div className="font-sans text-xs font-bold text-slate-800 line-clamp-1">{exam.course}</div>
                        <div className="font-sans text-[11px] text-slate-500 line-clamp-1">{exam.title}</div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          isUrgent ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{exam.preparationStatus.replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-sans italic">No exams listed. High marks achieved!</p>
          )}
          <button 
            onClick={() => setActiveTab('calendar')}
            className="w-full py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-sans font-medium text-center transition-colors cursor-pointer"
          >
            Manage Academic Calendar
          </button>
        </div>

        {/* Health & Fuel Balance */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <Flame size={18} />
              </div>
              <h2 className="font-sans font-semibold text-slate-800">Health & Fuel Balance</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Calories Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-slate-500">Diet</span>
                <span className="text-xs font-mono font-semibold text-slate-800">{consumedCalories}/{profile.dailyCalorieGoal} kcal</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-300" style={{ width: `${caloriePercent}%` }}></div>
              </div>
              <span className="text-[10px] text-slate-400 block font-mono">{caloriePercent}% daily target met</span>
            </div>

            {/* Water Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-sans text-slate-500">Hydration</span>
                <span className="text-xs font-mono font-semibold text-slate-800">{profile.waterIntake} ml</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-300" style={{ width: `${waterPercent}%` }}></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 block font-mono">{waterPercent}% completed</span>
                <button 
                  onClick={() => addWater(250)}
                  className="text-[10px] text-blue-600 font-sans hover:underline font-semibold focus:outline-none cursor-pointer"
                >
                  +250ml
                </button>
              </div>
            </div>
          </div>

          {/* Quick Workout Reminder */}
          <div className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100/50 flex items-center justify-between">
            <span className="text-xs text-slate-700 font-sans">
              Workouts today: {workouts.filter(w => w.date === '2026-07-06').length}
            </span>
            <span className="text-xs text-rose-600 font-sans font-semibold">
              {workouts.filter(w => w.date === '2026-07-06' && w.completed).length}/{workouts.filter(w => w.date === '2026-07-06').length} Done
            </span>
          </div>

          <button 
            onClick={() => setActiveTab('fitness')}
            className="w-full py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-sans font-medium text-center transition-colors cursor-pointer"
          >
            Open Fitness & Diet Log
          </button>
        </div>

        {/* Student Finances */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <TrendingDown size={18} />
              </div>
              <h2 className="font-sans font-semibold text-slate-800">Finances</h2>
            </div>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
              Allow: ${budget.allowance}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500 font-sans">
              <span>Expenses logged</span>
              <span className="font-mono font-semibold text-slate-800">${totalSpent.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-sans">
              <span>Safe-to-spend</span>
              <span className="font-mono font-bold text-slate-800">${remainingBudget.toFixed(2)}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(100, Math.round((totalSpent / budget.allowance) * 100))}%` }}
              ></div>
            </div>
          </div>

          {expenses.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-[10px] font-mono font-medium text-slate-400 uppercase tracking-wider">Recent Expenses</h3>
              <div className="text-xs space-y-1">
                {expenses.slice(0, 2).map(e => (
                  <div key={e.id} className="flex justify-between text-slate-600 font-sans">
                    <span className="truncate max-w-[150px]">{e.title}</span>
                    <span className="font-mono font-semibold text-slate-800">${e.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button 
            onClick={() => setActiveTab('finances')}
            className="w-full py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-sans font-medium text-center transition-colors cursor-pointer"
          >
            Track Expenses & Budget
          </button>
        </div>

        {/* Goal Board */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 hover:shadow-md transition-shadow lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <CheckCircle2 size={18} />
              </div>
              <h2 className="font-sans font-semibold text-slate-800">Semester Goals Progress</h2>
            </div>
            <span className="text-xs text-slate-500 font-sans">
              {completedGoalsCount} of {goals.length} completed
            </span>
          </div>

          {pendingGoals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {pendingGoals.map((goal) => (
                <div 
                  key={goal.id} 
                  onClick={() => toggleGoal(goal.id)}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 bg-slate-50 hover:bg-indigo-50/10 cursor-pointer transition-all group"
                >
                  <Circle size={16} className="text-slate-400 shrink-0 mt-0.5 group-hover:text-indigo-500" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700 font-sans group-hover:text-indigo-900 leading-snug line-clamp-2">
                      {goal.title}
                    </p>
                    <span className="inline-block text-[9px] font-mono uppercase bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-500">
                      {goal.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500 font-sans italic">All semester goals completed! Fantastic work!</p>
            </div>
          )}
        </div>

        {/* Simulated College Mailbox */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-150">
                <Mail size={18} />
              </div>
              <h2 className="font-sans font-semibold text-slate-800">Inbox</h2>
            </div>
            {unreadEmailsCount > 0 && (
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 animate-pulse">
                {unreadEmailsCount} unread
              </span>
            )}
          </div>

          <div className="space-y-2">
            {emails.slice(0, 3).map((email) => (
              <div 
                key={email.id} 
                onClick={() => setActiveTab('files')}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  email.unread 
                    ? 'bg-amber-50/20 border-amber-200/50 hover:bg-amber-50/30' 
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-[10px] text-slate-700 truncate max-w-[120px] font-sans">{email.sender}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{email.date}</span>
                </div>
                <div className={`text-xs font-semibold font-sans truncate ${email.unread ? 'text-slate-900' : 'text-slate-600'}`}>
                  {email.subject}
                </div>
                <div className="text-[10px] text-slate-500 truncate font-sans">
                  {email.snippet}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
