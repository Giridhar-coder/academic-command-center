import React, { useState } from 'react';
import { StudentState, Project, AttachedFile, ProjectTask } from '../types';
import { 
  FolderGit2, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Upload, 
  CheckSquare,
  FileCode,
  Sparkles
} from 'lucide-react';

interface ProjectsFilesViewProps {
  state: StudentState;
  onUpdateState: (newState: StudentState) => void;
}

export default function ProjectsFilesView({
  state,
  onUpdateState
}: ProjectsFilesViewProps) {
  const { projects, files } = state;

  // Projects states
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('2026-07-20');
  
  // Tasks state per project
  const [newTaskTexts, setNewTaskTexts] = useState<{ [key: string]: string }>({});

  // Files states
  const [showFileForm, setShowFileForm] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [fileContentSnippet, setFileContentSnippet] = useState('');

  // Add Project
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    const newProject: Project = {
      id: `p_${Date.now()}`,
      title: projectTitle,
      description: projectDescription,
      dueDate: projectDueDate,
      tasks: []
    };

    onUpdateState({
      ...state,
      projects: [...projects, newProject]
    });

    setProjectTitle('');
    setProjectDescription('');
    setShowProjectForm(false);
  };

  // Delete Project
  const handleDeleteProject = (id: string) => {
    onUpdateState({
      ...state,
      projects: projects.filter(p => p.id !== id)
    });
  };

  // Add Task to Project
  const handleAddTask = (projectId: string) => {
    const text = newTaskTexts[projectId];
    if (!text || !text.trim()) return;

    const newTask: ProjectTask = {
      id: `t_${Date.now()}`,
      title: text,
      completed: false
    };

    onUpdateState({
      ...state,
      projects: projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: [...p.tasks, newTask]
          };
        }
        return p;
      })
    });

    setNewTaskTexts({
      ...newTaskTexts,
      [projectId]: ''
    });
  };

  // Toggle Task Completion
  const toggleTask = (projectId: string, taskId: string) => {
    onUpdateState({
      ...state,
      projects: projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
          };
        }
        return p;
      })
    });
  };

  // Delete Task from Project
  const handleDeleteTask = (projectId: string, taskId: string) => {
    onUpdateState({
      ...state,
      projects: projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: p.tasks.filter(t => t.id !== taskId)
          };
        }
        return p;
      })
    });
  };

  // Simulate File Uploading / Indexing
  const handleAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim() || !fileContentSnippet.trim()) return;

    const newFile: AttachedFile = {
      id: `f_${Date.now()}`,
      name: fileName.endsWith(`.${fileType}`) ? fileName : `${fileName}.${fileType}`,
      size: `${(fileContentSnippet.length / 1024).toFixed(1)} KB`,
      type: fileType,
      contentSnippet: fileContentSnippet
    };

    onUpdateState({
      ...state,
      files: [...files, newFile]
    });

    setFileName('');
    setFileContentSnippet('');
    setShowFileForm(false);
  };

  // Delete File
  const handleDeleteFile = (id: string) => {
    onUpdateState({
      ...state,
      files: files.filter(f => f.id !== id)
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="projects-files-view">
      
      {/* Left Column: Projects & Task lists */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FolderGit2 size={18} />
            </div>
            <div>
              <h2 className="font-sans font-bold text-slate-800">Ongoing Projects</h2>
              <p className="text-[10px] text-slate-400 font-mono">TASK MATRICES</p>
            </div>
          </div>
          <button 
            onClick={() => setShowProjectForm(!showProjectForm)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus size={13} />
            Create Project
          </button>
        </div>

        {showProjectForm && (
          <form onSubmit={handleAddProject} className="p-4 rounded-xl border border-slate-150 bg-slate-50 space-y-3">
            <div className="space-y-2">
              <input 
                type="text" 
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Project title (e.g. Distributed Systems Lab)"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
              />
              <textarea 
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Brief description..."
                rows={2}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
              />
              <input 
                type="date" 
                value={projectDueDate}
                onChange={(e) => setProjectDueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowProjectForm(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-2.5 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded font-bold cursor-pointer"
              >
                Save Project
              </button>
            </div>
          </form>
        )}

        {/* Project Lists with inner tasks */}
        <div className="space-y-4">
          {projects.map(project => {
            const completedCount = project.tasks.filter(t => t.completed).length;
            const progressPercent = project.tasks.length === 0 ? 0 : Math.round((completedCount / project.tasks.length) * 100);

            return (
              <div key={project.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/20 hover:bg-slate-50/50 space-y-3 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-extrabold text-slate-800 font-sans leading-snug">{project.title}</h3>
                    <p className="text-[10px] text-slate-500 font-sans">{project.description}</p>
                    <span className="inline-block text-[9px] font-mono font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded mt-1">
                      Due: {project.dueDate}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Progress bar */}
                {project.tasks.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-sans text-slate-500">
                      <span>Tasks completion:</span>
                      <span className="font-mono font-bold text-slate-700">{completedCount}/{project.tasks.length} ({progressPercent}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                )}

                {/* Inner tasks list */}
                <div className="space-y-1.5">
                  {project.tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2 rounded bg-white border border-slate-150/65 group">
                      <div 
                        onClick={() => toggleTask(project.id, task.id)}
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        {task.completed ? (
                          <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        ) : (
                          <Circle size={14} className="text-slate-400 shrink-0 hover:text-indigo-500" />
                        )}
                        <span className={`text-[11px] font-sans ${task.completed ? 'line-through text-slate-400' : 'text-slate-600 font-medium'}`}>
                          {task.title}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteTask(project.id, task.id)}
                        className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 p-0.5 cursor-pointer transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add task field */}
                <div className="flex gap-1">
                  <input 
                    type="text"
                    value={newTaskTexts[project.id] || ''}
                    onChange={(e) => setNewTaskTexts({ ...newTaskTexts, [project.id]: e.target.value })}
                    placeholder="Add step/task..."
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(project.id)}
                    className="flex-1 px-2.5 py-1 border border-slate-250 bg-white rounded-lg text-[11px] outline-none"
                  />
                  <button 
                    onClick={() => handleAddTask(project.id)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold font-sans cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Files / PDFs Syllabus Document Indexer */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="font-sans font-bold text-slate-800">Files & PDFs Indexer</h2>
              <p className="text-[10px] text-slate-400 font-mono">JARVIS MEMORY DEPTH</p>
            </div>
          </div>
          <button 
            onClick={() => setShowFileForm(!showFileForm)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Upload size={13} />
            Index File
          </button>
        </div>

        {/* Informative block */}
        <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-lg text-[11px] text-indigo-800 font-sans flex items-start gap-2">
          <Sparkles size={14} className="shrink-0 mt-0.5 text-indigo-600 animate-pulse" />
          <p>
            <strong>Jarvis Knowledge Core:</strong> Any text, syllabus, or class notes you index below is saved in our database. When chatting with Jarvis, this content is dynamically included in the AI context!
          </p>
        </div>

        {showFileForm && (
          <form onSubmit={handleAddFile} className="p-4 rounded-xl border border-slate-150 bg-slate-50 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="File name (e.g. CS401_Syllabus)"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
              />
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
              >
                <option value="pdf">PDF Syllabus</option>
                <option value="docx">Word Document</option>
                <option value="txt">Lecture Text Notes</option>
                <option value="syllabus">General Syllabus</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">File Text Content / Syllabus Snippet</label>
              <textarea 
                value={fileContentSnippet}
                onChange={(e) => setFileContentSnippet(e.target.value)}
                placeholder="Paste the key course details, schedule, or notes here. Jarvis reads this text to prepare you for tomorrow..."
                rows={4}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-sans"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setShowFileForm(false)}
                className="px-2.5 py-1 text-xs text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-2.5 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 rounded font-bold cursor-pointer"
              >
                Upload & Index
              </button>
            </div>
          </form>
        )}

        {/* List of indexed files */}
        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {files.map(file => (
            <div key={file.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 space-y-2 group transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <FileCode size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 font-sans leading-snug truncate max-w-[200px]">{file.name}</h4>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">{file.type} • {file.size}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="p-2.5 rounded bg-white border border-slate-150 text-[10px] text-slate-500 font-sans line-clamp-3">
                {file.contentSnippet}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
