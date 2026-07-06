import React, { useState } from 'react';
import { StudentState, Expense } from '../types';
import { 
  TrendingDown, 
  DollarSign, 
  Plus, 
  Trash2, 
  BookOpen, 
  Coffee, 
  Car, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface FinanceTrackerProps {
  state: StudentState;
  onUpdateState: (newState: StudentState) => void;
}

export default function FinanceTracker({
  state,
  onUpdateState
}: FinanceTrackerProps) {
  const { expenses, budget } = state;

  const [showForm, setShowForm] = useState(false);
  const [allowanceInput, setAllowanceInput] = useState(budget.allowance.toString());
  const [isEditingAllowance, setIsEditingAllowance] = useState(false);

  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<Expense['category']>('food');

  // Calculations
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = Math.max(0, budget.allowance - totalSpent);
  const percentSpent = Math.min(100, Math.round((totalSpent / budget.allowance) * 100));

  // Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount.trim()) return;

    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newExpense: Expense = {
      id: `ex_${Date.now()}`,
      title: expenseTitle,
      amount: amountNum,
      category: expenseCategory,
      date: new Date().toISOString().split('T')[0]
    };

    onUpdateState({
      ...state,
      expenses: [newExpense, ...expenses]
    });

    setExpenseTitle('');
    setExpenseAmount('');
    setShowForm(false);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    onUpdateState({
      ...state,
      expenses: expenses.filter(e => e.id !== id)
    });
  };

  // Update Allowance
  const handleSaveAllowance = () => {
    const value = parseFloat(allowanceInput);
    if (isNaN(value) || value <= 0) return;

    onUpdateState({
      ...state,
      budget: {
        ...budget,
        allowance: value
      }
    });
    setIsEditingAllowance(false);
  };

  const getCategoryIcon = (category: Expense['category']) => {
    switch (category) {
      case 'books': return <BookOpen size={14} />;
      case 'food': return <Coffee size={14} />;
      case 'transit': return <Car size={14} />;
      case 'fun': return <Sparkles size={14} />;
      default: return <HelpCircle size={14} />;
    }
  };

  const getCategoryColor = (category: Expense['category']) => {
    switch (category) {
      case 'books': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'food': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'transit': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'fun': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="finances-view">
      
      {/* Left Columns: Financial Status Ledger */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Allowance Config & Spent Widget */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign size={18} />
              </div>
              <div>
                <h2 className="font-sans font-bold text-slate-800">Allowance OS</h2>
                <p className="text-[10px] text-slate-400 font-mono">SECURE WALLET</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-sans">Monthly Allowance:</span>
              {isEditingAllowance ? (
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-mono">$</span>
                  <input 
                    type="text" 
                    value={allowanceInput}
                    onChange={(e) => setAllowanceInput(e.target.value)}
                    className="w-16 px-1.5 py-0.5 border border-slate-300 rounded outline-none text-xs font-mono"
                  />
                  <button 
                    onClick={handleSaveAllowance}
                    className="text-[11px] px-2 py-0.5 bg-slate-800 text-white rounded font-sans hover:bg-slate-700 cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800">${budget.allowance.toFixed(2)}</span>
                  <button 
                    onClick={() => setIsEditingAllowance(true)}
                    className="text-[10px] text-indigo-600 font-sans font-semibold hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2.5">
              <span className="text-slate-500 font-sans">Total Spent This Month:</span>
              <span className="font-mono font-semibold text-slate-800">${totalSpent.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2.5">
              <span className="text-slate-500 font-sans">Remaining Safe-to-Spend:</span>
              <span className="font-mono font-extrabold text-slate-800 text-sm">${remainingBudget.toFixed(2)}</span>
            </div>
          </div>

          {/* Spent Progress Slider */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-sans">Budget Consumed</span>
              <span className="font-mono font-bold text-slate-800">{percentSpent}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  percentSpent >= 90 ? 'bg-rose-500' : percentSpent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`} 
                style={{ width: `${percentSpent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Add Expense Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-bold text-slate-800 text-sm">Register Purchase</h3>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="text-xs text-indigo-600 font-sans font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus size={13} />
              Add Expense
            </button>
          </div>

          {(showForm || expenses.length === 0) && (
            <form onSubmit={handleAddExpense} className="p-4 rounded-lg border border-slate-150 bg-slate-50 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Purchase Title</label>
                <input 
                  type="text" 
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Textbook or Coffee"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Amount ($)</label>
                <input 
                  type="text" 
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="e.g. 15.50"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as Expense['category'])}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="food">Food & Beverage</option>
                  <option value="books">Textbooks & Academic Files</option>
                  <option value="transit">Metro & Transit</option>
                  <option value="fun">Entertainment & Fun</option>
                  <option value="other">Other Purchases</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-sans font-bold shadow transition-colors cursor-pointer"
              >
                Save Purchase
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Right Column: Interactive Ledger Entries */}
      <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-150">
            <TrendingDown size={18} />
          </div>
          <div>
            <h2 className="font-sans font-bold text-slate-800">Purchases Ledger</h2>
            <p className="text-[10px] text-slate-400 font-mono">COMPLETE HISTORY</p>
          </div>
        </div>

        <div className="space-y-2.5 overflow-y-auto max-h-[500px] pr-1">
          {expenses.length > 0 ? (
            expenses.map(expense => (
              <div 
                key={expense.id} 
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border ${getCategoryColor(expense.category)}`}>
                    {getCategoryIcon(expense.category)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 font-sans leading-snug">{expense.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="capitalize">{expense.category}</span>
                      <span>•</span>
                      <span>{expense.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-800 text-xs">-${expense.amount.toFixed(2)}</span>
                  <button 
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-10 font-sans">No expenses logged. Budget fully safe!</p>
          )}
        </div>
      </div>

    </div>
  );
}
