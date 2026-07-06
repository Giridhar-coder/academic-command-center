export interface Goal {
  id: string;
  title: string;
  category: 'academic' | 'fitness' | 'financial' | 'personal';
  targetDate: string;
  completed: boolean;
}

export interface Exam {
  id: string;
  course: string;
  title: string;
  date: string;
  preparationStatus: 'not_started' | 'studying' | 'ready';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'food' | 'books' | 'transit' | 'fun' | 'other';
  date: string;
}

export interface Budget {
  allowance: number;
}

export interface Workout {
  id: string;
  title: string;
  completed: boolean;
  category: 'strength' | 'cardio' | 'yoga' | 'other';
  date: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tasks: ProjectTask[];
  dueDate: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // e.g. "09:00"
  endTime: string; // e.g. "10:30"
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  type: 'class' | 'study' | 'social' | 'personal';
}

export interface StudentProfile {
  name: string;
  college: string;
  major: string;
  gpaGoal: number;
  dailyCalorieGoal: number;
  dailyWaterGoal: number; // in ml
  waterIntake: number; // in ml
}

export interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: string; // e.g., "pdf", "docx", "syllabus"
  contentSnippet: string; // text representation
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  timestamp: string;
}

export interface StudentState {
  profile: StudentProfile;
  goals: Goal[];
  exams: Exam[];
  expenses: Expense[];
  budget: Budget;
  workouts: Workout[];
  meals: Meal[];
  projects: Project[];
  calendar: CalendarEvent[];
  emails: EmailMessage[];
  files: AttachedFile[];
  chatHistory: ChatMessage[];
}
