import React, { useState } from 'react';
import { StudentState, CalendarEvent, Exam } from '../types';
import { 
  Calendar, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Clock, 
  BookOpen, 
  CheckSquare, 
  AlertTriangle 
} from 'lucide-react';

interface CalendarExamsViewProps {
  state: StudentState;
  onUpdateState: (newState: StudentState) => void;
}

export default function CalendarExamsView({
  state,
  onUpdateState
}: CalendarExamsViewProps) {
  const { calendar, exams } = state;

  // Form states
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');
  const [eventDay, setEventDay] = useState<CalendarEvent['day']>('Monday');
  const [eventType, setEventType] = useState<CalendarEvent['type']>('class');

  const [showExamForm, setShowExamForm] = useState(false);
  const [examCourse, setExamCourse] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('2026-07-10');
  const [examStatus, setExamStatus] = useState<Exam['preparationStatus']>('not_started');

  const DAYS: CalendarEvent['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Add event
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEvent: CalendarEvent = {
      id: `ev_${Date.now()}`,
      title: eventTitle,
      startTime: eventStartTime,
      endTime: eventEndTime,
      day: eventDay,
      type: eventType
    };

    onUpdateState({
      ...state,
      calendar: [...calendar, newEvent]
    });

    setEventTitle('');
    setShowEventForm(false);
  };

  // Delete event
  const handleDeleteEvent = (id: string) => {
    onUpdateState({
      ...state,
      calendar: calendar.filter(e => e.id !== id)
    });
  };

  // Add exam
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examCourse.trim() || !examTitle.trim()) return;

    const newExam: Exam = {
      id: `ex_${Date.now()}`,
      course: examCourse,
      title: examTitle,
      date: examDate,
      preparationStatus: examStatus
    };

    onUpdateState({
      ...state,
      exams: [...exams, newExam]
    });

    setExamCourse('');
    setExamTitle('');
    setShowExamForm(false);
  };

  // Delete exam
  const handleDeleteExam = (id: string) => {
    onUpdateState({
      ...state,
      exams: exams.filter(e => e.id !== id)
    });
  };

  // Update exam status
  const handleUpdateExamStatus = (id: string, status: Exam['preparationStatus']) => {
    onUpdateState({
      ...state,
      exams: exams.map(e => e.id === id ? { ...e, preparationStatus: status } : e)
    });
  };

  // Calculate days remaining for countdown
  const getExamCountdown = (examDateStr: string) => {
    const today = new Date('2026-07-06');
    const examDate = new Date(examDateStr);
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6" id="calendar-view">
      
      {/* Upper Grid: Weekly Timetable & Exam Countdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly schedule list */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Calendar size={18} />
              </div>
              <div>
                <h2 className="font-sans font-bold text-slate-800">Class & Study Blocks</h2>
                <p className="text-[10px] text-slate-400 font-mono">WEEKLY ROSTER</p>
              </div>
            </div>
            <button 
              onClick={() => setShowEventForm(!showEventForm)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={13} />
              Add Block
            </button>
          </div>

          {showEventForm && (
            <form onSubmit={handleAddEvent} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-500">NEW AGENDA ITEM</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Block Title</label>
                  <input 
                    type="text" 
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. Algorithms Lecture or Math Study"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Day of Week</label>
                  <select 
                    value={eventDay}
                    onChange={(e) => setEventDay(e.target.value as CalendarEvent['day'])}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Start Time</label>
                  <input 
                    type="text" 
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    placeholder="e.g. 09:00"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">End Time</label>
                  <input 
                    type="text" 
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    placeholder="e.g. 10:30"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Category Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['class', 'study', 'social', 'personal'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEventType(type as CalendarEvent['type'])}
                        className={`py-1.5 rounded-lg border text-xs capitalize ${
                          eventType === type 
                            ? 'bg-indigo-600 border-indigo-600 text-white font-bold' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowEventForm(false)}
                  className="px-3 py-1 text-xs font-semibold text-slate-500 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-500 cursor-pointer"
                >
                  Save Block
                </button>
              </div>
            </form>
          )}

          {/* Timetable schedule render organized by Day */}
          <div className="space-y-4">
            {DAYS.map(day => {
              const dayEvents = calendar.filter(e => e.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
              if (dayEvents.length === 0) return null;
              
              return (
                <div key={day} className="space-y-2">
                  <h3 className="text-xs font-mono font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase">{day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dayEvents.map(event => {
                      const colors = {
                        class: 'border-indigo-500 bg-indigo-50/10 text-indigo-950',
                        study: 'border-emerald-500 bg-emerald-50/10 text-emerald-950',
                        social: 'border-purple-500 bg-purple-50/10 text-purple-950',
                        personal: 'border-slate-500 bg-slate-50/10 text-slate-950'
                      }[event.type];

                      return (
                        <div key={event.id} className={`p-3 rounded-lg border-l-4 border ${colors} flex justify-between items-center group`}>
                          <div className="space-y-0.5">
                            <span className="inline-block text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-100/80 rounded mb-1 text-slate-500 border border-slate-200/50">
                              {event.type}
                            </span>
                            <h4 className="text-xs font-bold font-sans line-clamp-1">{event.title}</h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                              <Clock size={11} />
                              {event.startTime} - {event.endTime}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Exam Countdown Block */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <GraduationCap size={18} />
              </div>
              <div>
                <h2 className="font-sans font-bold text-slate-800">Exams Tracker</h2>
                <p className="text-[10px] text-slate-400 font-mono">ACADEMIC ROADMAP</p>
              </div>
            </div>
            <button 
              onClick={() => setShowExamForm(!showExamForm)}
              className="p-1 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <Plus size={15} />
            </button>
          </div>

          {showExamForm && (
            <form onSubmit={handleAddExam} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
              <h3 className="text-xs font-mono font-bold text-slate-500">NEW EXAM</h3>
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={examCourse}
                  onChange={(e) => setExamCourse(e.target.value)}
                  placeholder="Course (e.g. CS 401)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
                <input 
                  type="text" 
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="Exam Title (e.g. Midterm)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
                <input 
                  type="date" 
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                />
                <select 
                  value={examStatus}
                  onChange={(e) => setExamStatus(e.target.value as Exam['preparationStatus'])}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="not_started">Not Started</option>
                  <option value="studying">Studying</option>
                  <option value="ready">Ready</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => setShowExamForm(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-500 rounded hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-500 cursor-pointer"
                >
                  Save Exam
                </button>
              </div>
            </form>
          )}

          {/* Exams List */}
          <div className="space-y-3">
            {exams.map(exam => {
              const daysLeft = getExamCountdown(exam.date);
              const isUrgent = daysLeft <= 3;
              const statusColors = {
                not_started: 'bg-rose-50 text-rose-700 border-rose-100',
                studying: 'bg-amber-50 text-amber-700 border-amber-100',
                ready: 'bg-emerald-50 text-emerald-700 border-emerald-100'
              }[exam.preparationStatus];

              return (
                <div key={exam.id} className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-wide">
                        {exam.course}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{exam.title}</h4>
                    </div>
                    <button 
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock size={11} />
                      <span className="font-mono">{exam.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={exam.preparationStatus}
                        onChange={(e) => handleUpdateExamStatus(exam.id, e.target.value as Exam['preparationStatus'])}
                        className={`text-[10px] font-semibold border rounded px-1.5 py-0.5 outline-none ${statusColors}`}
                      >
                        <option value="not_started">Not Started</option>
                        <option value="studying">Studying</option>
                        <option value="ready">Ready</option>
                      </select>
                      <div className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                        isUrgent ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-slate-200 text-slate-800'
                      }`}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `In ${daysLeft}d`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </div>
  );
}
