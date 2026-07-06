import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { DEFAULT_STATE } from './src/initialData.js'; // Let's use .js or just relative import since tsx resolves it

// Resolve filename and dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_PATH = path.join(process.cwd(), 'db.json');

// Ensure db.json exists on start
function getDBState() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
      return DEFAULT_STATE;
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading/writing DB, falling back to default', error);
    return DEFAULT_STATE;
  }
}

function saveDBState(state: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving DB', error);
  }
}

// REST API Endpoints
app.get('/api/state', (req, res) => {
  const state = getDBState();
  res.json(state);
});

app.post('/api/state', (req, res) => {
  const newState = req.body;
  saveDBState(newState);
  res.json({ success: true, state: newState });
});

// Lazy-initialized Gemini Assistant endpoint
app.post('/api/jarvis/chat', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(500).json({
      error: 'Missing Gemini API Key',
      message: 'Please set your GEMINI_API_KEY in Settings > Secrets to enable Jarvis AI.',
    });
  }

  try {
    // Lazy-initialize GoogleGenAI
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const state = req.body.state || getDBState();

    // Prepare contextual profile injection
    const stateContextString = JSON.stringify({
      profile: state.profile,
      goals: state.goals.filter((g: any) => !g.completed),
      exams: state.exams,
      budget: state.budget,
      expensesSummary: state.expenses.slice(0, 5),
      pendingWorkouts: state.workouts.filter((w: any) => !w.completed),
      meals: state.meals,
      pendingProjects: state.projects.map((p: any) => ({
        title: p.title,
        dueDate: p.dueDate,
        pendingTasks: p.tasks.filter((t: any) => !t.completed).map((t: any) => t.title),
      })),
      calendar: state.calendar,
      unreadEmails: state.emails.filter((e: any) => e.unread),
      filesList: state.files.map((f: any) => ({ name: f.name, summary: f.contentSnippet })),
    });

    const systemInstruction = `You are Jarvis, the state-of-the-art AI Life OS for college students. You are a highly professional, extremely intelligent, and supportive digital organizer, inspired by Marvel's JARVIS.

You have total awareness of the student's entire digital life:
${stateContextString}

Current Date Context: The student's system date is 2026-07-06 (Monday).

When answering the user's prompt (like "Prepare me for tomorrow" or any general questions/queries), you must:
1. Align with their college schedules, exam countdowns, budget limits, fitness targets, and file content.
2. Structure your response into a pristine, beautifully formatted Markdown presentation.
3. Be highly actionable:
   - For 'Prepare me for tomorrow' or calendar planning: Design a chronological, hour-by-hour agenda for tomorrow (Tuesday, July 7th, 2026). Suggest ideal slots for classes, revising for their upcoming exams, workouts, and meals based on their current status.
   - For revision queries: Synthesize study targets using syllabus/file data.
   - For budget questions: Warn about expense trends.
   - For workout/diet: Match calorie/water targets with current logs.
4. Maintain an encouraging, sophisticated, and slightly witty tone. Refer to the student as "Sir", "Ma'am", or by their first name "${state.profile.name}" with a digital holographic readout aesthetic.

Always output standard markdown. Highlight important metrics like GPA targets, due dates, calorie metrics, or budgets in bold.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const text = response.text || "I apologize, but I couldn't formulate a response right now.";
    res.json({ reply: text });
  } catch (error: any) {
    console.error('Gemini API call failed:', error);
    res.status(500).json({
      error: 'AI_INVOCATION_ERROR',
      message: error.message || 'An error occurred while communicating with Jarvis AI.',
    });
  }
});

// Serve Vite dev server or static build assets
import { createServer as createViteServer } from 'vite';

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Life OS server running on http://localhost:${PORT}`);
  });
}

start();
