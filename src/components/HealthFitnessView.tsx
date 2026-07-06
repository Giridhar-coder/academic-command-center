import React, { useState } from 'react';
import { StudentState, Workout, Meal } from '../types';
import { 
  Flame, 
  Droplet, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Dumbbell, 
  Coffee,
  RotateCcw
} from 'lucide-react';

interface HealthFitnessViewProps {
  state: StudentState;
  onUpdateState: (newState: StudentState) => void;
}

export default function HealthFitnessView({
  state,
  onUpdateState
}: HealthFitnessViewProps) {
  const { workouts, meals, profile } = state;

  // Form states
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutCategory, setWorkoutCategory] = useState<Workout['category']>('strength');

  const [showMealForm, setShowMealForm] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealType, setMealType] = useState<Meal['type']>('breakfast');

  // Calculations
  const consumedCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const caloriePercent = Math.min(100, Math.round((consumedCalories / profile.dailyCalorieGoal) * 100));
  const waterPercent = Math.min(100, Math.round((profile.waterIntake / profile.dailyWaterGoal) * 100));

  // Add water cup
  const addWater = (amount: number) => {
    onUpdateState({
      ...state,
      profile: {
        ...profile,
        waterIntake: profile.waterIntake + amount
      }
    });
  };

  // Reset water cup
  const resetWater = () => {
    onUpdateState({
      ...state,
      profile: {
        ...profile,
        waterIntake: 0
      }
    });
  };

  // Add Workout
  const handleAddWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle.trim()) return;

    const newWorkout: Workout = {
      id: `w_${Date.now()}`,
      title: workoutTitle,
      category: workoutCategory,
      completed: false,
      date: '2026-07-06' // today's context
    };

    onUpdateState({
      ...state,
      workouts: [...workouts, newWorkout]
    });

    setWorkoutTitle('');
    setShowWorkoutForm(false);
  };

  // Toggle workout checklist
  const toggleWorkout = (id: string) => {
    onUpdateState({
      ...state,
      workouts: workouts.map(w => w.id === id ? { ...w, completed: !w.completed } : w)
    });
  };

  // Delete workout
  const handleDeleteWorkout = (id: string) => {
    onUpdateState({
      ...state,
      workouts: workouts.filter(w => w.id !== id)
    });
  };

  // Add Meal
  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim() || !mealCalories.trim()) return;

    const calorieVal = parseInt(mealCalories);
    if (isNaN(calorieVal) || calorieVal <= 0) return;

    const newMeal: Meal = {
      id: `m_${Date.now()}`,
      name: mealName,
      calories: calorieVal,
      type: mealType
    };

    onUpdateState({
      ...state,
      meals: [...meals, newMeal]
    });

    setMealName('');
    setMealCalories('');
    setShowMealForm(false);
  };

  // Delete Meal
  const handleDeleteMeal = (id: string) => {
    onUpdateState({
      ...state,
      meals: meals.filter(m => m.id !== id)
    });
  };

  return (
    <div className="space-y-6" id="health-view">
      
      {/* Top Dials Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hydration Panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Droplet size={18} />
              </div>
              <div>
                <h2 className="font-sans font-bold text-slate-800">Hydration Core</h2>
                <p className="text-[10px] text-slate-400 font-mono">WATER TARGET: {profile.dailyWaterGoal} ml</p>
              </div>
            </div>
            <button 
              onClick={resetWater}
              className="p-1.5 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              title="Reset today's water"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            {/* Visual Dial */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="48" 
                  cy="48" 
                  r="40" 
                  stroke="#3b82f6" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - waterPercent / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-mono font-bold text-slate-800 text-lg">{waterPercent}%</span>
                <span className="text-[9px] text-slate-400 uppercase">Target</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-3 w-full">
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 font-sans">Water Intake Today:</p>
                <p className="font-mono font-bold text-slate-800 text-lg">{profile.waterIntake} / {profile.dailyWaterGoal} ml</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button 
                  onClick={() => addWater(250)}
                  className="py-1.5 border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg font-sans font-semibold transition-all cursor-pointer"
                >
                  +250 ml Cup
                </button>
                <button 
                  onClick={() => addWater(500)}
                  className="py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-sans font-bold shadow transition-all cursor-pointer"
                >
                  +500 ml Bottle
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Caloric Diet Tracker */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <Flame size={18} />
              </div>
              <div>
                <h2 className="font-sans font-bold text-slate-800">Caloric Fuel</h2>
                <p className="text-[10px] text-slate-400 font-mono">DIET TARGET: {profile.dailyCalorieGoal} kcal</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100">
            {/* Visual Dial */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle 
                  cx="48" 
                  cy="48" 
                  r="40" 
                  stroke="#f43f5e" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - caloriePercent / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-mono font-bold text-slate-800 text-lg">{caloriePercent}%</span>
                <span className="text-[9px] text-slate-400 uppercase">Fuel</span>
              </div>
            </div>

            <div className="flex-1 space-y-3 w-full">
              <div className="space-y-0.5">
                <p className="text-xs text-slate-500 font-sans">Consumed Today:</p>
                <p className="font-mono font-bold text-slate-800 text-lg">{consumedCalories} / {profile.dailyCalorieGoal} kcal</p>
              </div>
              <button 
                onClick={() => setShowMealForm(!showMealForm)}
                className="w-full py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-sans font-semibold transition-all cursor-pointer"
              >
                Log Food Entry
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Interactive Gym Log & Food Ledger */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Workouts checklist */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-150">
                <Dumbbell size={18} />
              </div>
              <h3 className="font-sans font-bold text-slate-800">Gym Routine Logs</h3>
            </div>
            <button 
              onClick={() => setShowWorkoutForm(!showWorkoutForm)}
              className="text-xs font-semibold text-indigo-600 font-sans flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus size={13} />
              New Workout
            </button>
          </div>

          {showWorkoutForm && (
            <form onSubmit={handleAddWorkout} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  placeholder="Workout target (e.g. Legs or Cardio run)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
                <select
                  value={workoutCategory}
                  onChange={(e) => setWorkoutCategory(e.target.value as Workout['category'])}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="strength">Strength Training</option>
                  <option value="cardio">Cardio & Runs</option>
                  <option value="yoga">Yoga & Mobility</option>
                  <option value="other">Other Exercise</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowWorkoutForm(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-2.5 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded font-bold cursor-pointer"
                >
                  Save Workout
                </button>
              </div>
            </form>
          )}

          {/* Workouts Checklist */}
          <div className="space-y-2">
            {workouts.map(workout => (
              <div 
                key={workout.id} 
                className="p-3 rounded-lg border border-slate-150 bg-slate-50/40 flex items-center justify-between group transition-all"
              >
                <div 
                  onClick={() => toggleWorkout(workout.id)}
                  className="flex items-center gap-2.5 cursor-pointer flex-1"
                >
                  {workout.completed ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <Circle size={16} className="text-slate-400 shrink-0 hover:text-indigo-500" />
                  )}
                  <span className={`text-xs font-sans ${workout.completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                    {workout.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono uppercase bg-slate-100 border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded">
                    {workout.category}
                  </span>
                  <button 
                    onClick={() => handleDeleteWorkout(workout.id)}
                    className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meal Food Logs */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-150">
                <Coffee size={18} />
              </div>
              <h3 className="font-sans font-bold text-slate-800">Dietary Ledger</h3>
            </div>
            <button 
              onClick={() => setShowMealForm(!showMealForm)}
              className="text-xs font-semibold text-indigo-600 font-sans flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Plus size={13} />
              Log Meal
            </button>
          </div>

          {showMealForm && (
            <form onSubmit={handleAddMeal} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="Food / meal details"
                  className="w-full col-span-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
                <input 
                  type="text" 
                  value={mealCalories}
                  onChange={(e) => setMealCalories(e.target.value)}
                  placeholder="Calories (kcal)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono"
                />
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as Meal['type'])}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setShowMealForm(false)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-2.5 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded font-bold cursor-pointer"
                >
                  Log Food
                </button>
              </div>
            </form>
          )}

          {/* Meals list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {meals.map(meal => (
              <div 
                key={meal.id} 
                className="p-3 rounded-lg border border-slate-150 bg-slate-50/40 flex items-center justify-between group transition-all"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-700 font-sans leading-snug">{meal.name}</h4>
                  <span className="text-[9px] font-mono uppercase bg-slate-100 border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded capitalize">
                    {meal.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-700 text-xs font-bold">{meal.calories} kcal</span>
                  <button 
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
