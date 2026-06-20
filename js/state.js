/**
 * STATE MANAGEMENT MODULE
 * Handles board data structure, local storage CRUD operations, and preloaded datasets.
 */

const LOCAL_STORAGE_KEY = 'auraflow_kanban_state';

// Pre-defined color combinations for dynamic avatars (gradient hexes)
const AVATAR_GRADIENTS = [
  { start: '#ff758c', end: '#ff7eb3' }, // Coral Pink
  { start: '#8ec5fc', end: '#e0c3fc' }, // Lavender Blue
  { start: '#30e3ca', end: '#1f8a70' }, // Mint Teal
  { start: '#fcd34d', end: '#f59e0b' }, // Amber Yellow
  { start: '#a855f7', end: '#ec4899' }, // Purple Pink
  { start: '#3b82f6', end: '#1d4ed8' }, // Cobalt Blue
  { start: '#10b981', end: '#047857' }  // Emerald Green
];

// Helper to generate initials from a name
export function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// Default state model
const defaultState = {
  columns: [
    { id: 'col-todo', title: 'To Do', taskIds: ['task-1', 'task-2'] },
    { id: 'col-inprogress', title: 'In Progress', taskIds: ['task-3'] },
    { id: 'col-review', title: 'Code Review', taskIds: ['task-4'] },
    { id: 'col-done', title: 'Done', taskIds: ['task-5'] }
  ],
  tasks: {
    'task-1': {
      id: 'task-1',
      title: 'Design Landing Page Wireframes',
      description: 'Create responsive dark-mode layouts for desktop and mobile homepages. Focus on glassmorphic card placements and typography scales.',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
      members: ['mem-1'],
      checklist: [
        { id: 'chk-1', text: 'Define HSL design tokens & variables', done: true },
        { id: 'chk-2', text: 'Create high-fidelity landing page mockup', done: false },
        { id: 'chk-3', text: 'Optimize asset sizes and export SVG layers', done: false }
      ]
    },
    'task-2': {
      id: 'task-2',
      title: 'Setup Database Auth API',
      description: 'Implement secure login, password hashing, and session tokens via JWT. Write middleware authentication endpoints.',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], // 4 days from now
      members: ['mem-2'],
      checklist: []
    },
    'task-3': {
      id: 'task-3',
      title: 'Integrate Floating Glow Orbs',
      description: 'Build CSS keyframes for floating background spheres and connect slider for customizable glass backdrop-blur opacity.',
      priority: 'medium',
      dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // 1 day ago (overdue)
      members: ['mem-3', 'mem-1'],
      checklist: [
        { id: 'chk-4', text: 'Create backdrop canvas containers', done: true },
        { id: 'chk-5', text: 'Code custom floating CSS animations', done: true },
        { id: 'chk-6', text: 'Bind range slider event listeners in JS', done: false }
      ]
    },
    'task-4': {
      id: 'task-4',
      title: 'Audit Webpack Bundle Sizes',
      description: 'Analyze visualizer report, configure code-splitting, tree-shaking, and lazy loading parameters on production outputs.',
      priority: 'low',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // 7 days from now
      members: ['mem-4'],
      checklist: []
    },
    'task-5': {
      id: 'task-5',
      title: 'Initialize Repository & Setup CI/CD',
      description: 'Setup basic Git repository workflow guidelines, protect the main branch, and verify automated linting pipelines pass.',
      priority: 'low',
      dueDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], // 3 days ago
      members: ['mem-1'],
      checklist: [
        { id: 'chk-7', text: 'Push initial repository skeleton', done: true },
        { id: 'chk-8', text: 'Write comprehensive README.md file', done: true }
      ]
    }
  },
  members: [
    { id: 'mem-1', name: 'Alex Rivera', initials: 'AR', loginId: '1001', password: '123', gradient: AVATAR_GRADIENTS[0] },
    { id: 'mem-2', name: 'Jordan Smith', initials: 'JS', loginId: '1002', password: '123', gradient: AVATAR_GRADIENTS[1] },
    { id: 'mem-3', name: 'Taylor Lee', initials: 'TL', loginId: '1003', password: '123', gradient: AVATAR_GRADIENTS[2] },
    { id: 'mem-4', name: 'Morgan Chen', initials: 'MC', loginId: '1004', password: '123', gradient: AVATAR_GRADIENTS[3] }
  ],
  settings: {
    background: 'mesh-dark',
    blurAmount: 16,
    showOrbs: true,
    activeRole: 'admin'
  }
};

let boardState = null;

// Initialize boardState
export function initBoardState() {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    try {
      boardState = JSON.parse(saved);
      // Backwards compatibility / structure check
      if (!boardState.columns || !boardState.tasks || !boardState.members || !boardState.settings) {
        throw new Error('Incomplete data structure');
      }
      if (!boardState.settings.activeRole) {
        boardState.settings.activeRole = 'admin';
        saveBoardState();
      }
    } catch (e) {
      console.warn('Failed parsing state, reverting to templates', e);
      boardState = JSON.parse(JSON.stringify(defaultState));
      saveBoardState();
    }
  } else {
    boardState = JSON.parse(JSON.stringify(defaultState));
    saveBoardState();
  }
  return boardState;
}

export function getBoardState() {
  if (!boardState) initBoardState();
  return boardState;
}

export function saveBoardState() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(boardState));
}

// Custom Settings Mutator
export function updateSettings(newSettings) {
  boardState.settings = { ...boardState.settings, ...newSettings };
  saveBoardState();
}

// Columns CRUD operations
export function addColumn(title) {
  const id = `col-${Date.now()}`;
  const newColumn = { id, title, taskIds: [] };
  boardState.columns.push(newColumn);
  saveBoardState();
  return newColumn;
}

export function renameColumn(columnId, newTitle) {
  const col = boardState.columns.find(c => c.id === columnId);
  if (col) {
    col.title = newTitle;
    saveBoardState();
  }
}

export function deleteColumn(columnId) {
  const colIndex = boardState.columns.findIndex(c => c.id === columnId);
  if (colIndex !== -1) {
    const col = boardState.columns[colIndex];
    // Delete associated tasks
    col.taskIds.forEach(id => {
      delete boardState.tasks[id];
    });
    boardState.columns.splice(colIndex, 1);
    saveBoardState();
  }
}

export function reorderColumns(sourceIdx, targetIdx) {
  const [movedColumn] = boardState.columns.splice(sourceIdx, 1);
  boardState.columns.splice(targetIdx, 0, movedColumn);
  saveBoardState();
}

// Tasks CRUD operations
export function getTask(taskId) {
  return boardState.tasks[taskId];
}

export function addOrUpdateTask(taskId, columnId, taskData) {
  if (taskId) {
    // Update existing task
    boardState.tasks[taskId] = {
      ...boardState.tasks[taskId],
      ...taskData
    };
  } else {
    // Create new task
    const newId = `task-${Date.now()}`;
    boardState.tasks[newId] = {
      id: newId,
      ...taskData
    };
    // Append to column
    const col = boardState.columns.find(c => c.id === columnId);
    if (col) {
      col.taskIds.push(newId);
    }
  }
  saveBoardState();
}

export function deleteTask(taskId) {
  // Remove from database
  delete boardState.tasks[taskId];
  // Remove from column mapping
  boardState.columns.forEach(col => {
    col.taskIds = col.taskIds.filter(id => id !== taskId);
  });
  saveBoardState();
}

// Moves a task within same column or across columns
export function moveTask(taskId, sourceColId, targetColId, targetIndex) {
  const sourceCol = boardState.columns.find(c => c.id === sourceColId);
  const targetCol = boardState.columns.find(c => c.id === targetColId);

  if (!sourceCol || !targetCol) return;

  // Remove from source
  const sourceIndex = sourceCol.taskIds.indexOf(taskId);
  if (sourceIndex !== -1) {
    sourceCol.taskIds.splice(sourceIndex, 1);
  }

  // Insert into target
  if (targetIndex === undefined || targetIndex === -1) {
    targetCol.taskIds.push(taskId);
  } else {
    targetCol.taskIds.splice(targetIndex, 0, taskId);
  }

  saveBoardState();
}

// Members CRUD operations
export function addMember(name, loginId, password) {
  const duplicate = boardState.members.some(m => m.loginId === loginId) || loginId.toLowerCase() === 'admin';
  if (duplicate) {
    throw new Error('Employee ID already registered.');
  }

  const id = `mem-${Date.now()}`;
  const initials = getInitials(name);
  const randomGrad = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
  const newMember = { id, name, initials, loginId, password, gradient: randomGrad };
  boardState.members.push(newMember);
  saveBoardState();
  return newMember;
}

export function deleteMember(memberId) {
  // Remove from member array
  boardState.members = boardState.members.filter(m => m.id !== memberId);
  // Remove member associations from all tasks
  Object.keys(boardState.tasks).forEach(taskId => {
    boardState.tasks[taskId].members = boardState.tasks[taskId].members.filter(id => id !== memberId);
  });
  saveBoardState();
}

// Restore default structures
export function resetBoardState() {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
  boardState = JSON.parse(JSON.stringify(defaultState));
  saveBoardState();
  return boardState;
}

// ==========================================
// SESSION MANAGEMENT METHODS
// ==========================================

const SESSION_KEY = LOCAL_STORAGE_KEY + '_session';

export function getActiveSession() {
  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function loginUser(loginId, password) {
  // 1. Admin login validation
  if (loginId.toLowerCase() === 'admin' && password === 'admin') {
    const session = { id: 'admin', name: 'Administrator', role: 'admin', initials: 'AD' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  
  // 2. Worker login validation
  const member = boardState.members.find(m => m.loginId === loginId && m.password === password);
  if (member) {
    const session = { id: member.id, name: member.name, role: 'worker', initials: member.initials };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  
  throw new Error('Invalid Employee ID or Password.');
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
