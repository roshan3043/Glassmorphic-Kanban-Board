/**
 * DOM RENDERING & EVENT HANDLERS MODULE
 * Generates column and card templates, handles modal states, and applies theme customizer parameters.
 */

import {
  getBoardState,
  addOrUpdateTask,
  deleteTask,
  addColumn,
  renameColumn,
  deleteColumn,
  addMember,
  deleteMember,
  updateSettings,
  resetBoardState,
  getTask,
  getActiveSession,
  loginUser,
  logoutUser
} from './state.js?v=1.7';
import { setupCardDragListeners, setupColumnDragListeners } from './dragdrop.js?v=1.7';

// DOM selectors
const searchInput = document.getElementById('searchInput');
const filterMember = document.getElementById('filterMember');
const filterPriority = document.getElementById('filterPriority');
const boardCanvas = document.getElementById('boardCanvas');

// Session selectors
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const loginId = document.getElementById('loginId');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const sessionBadge = document.getElementById('sessionBadge');
const sessionAvatar = document.getElementById('sessionAvatar');
const sessionName = document.getElementById('sessionName');
const btnLogout = document.getElementById('btnLogout');

// Modal backdrops
const taskModal = document.getElementById('taskModal');
const membersModal = document.getElementById('membersModal');
const customizerModal = document.getElementById('customizerModal');
const statsModal = document.getElementById('statsModal');

// Form selectors
const taskForm = document.getElementById('taskForm');
const taskFormId = document.getElementById('taskFormId');
const taskFormColumnId = document.getElementById('taskFormColumnId');
const taskTitle = document.getElementById('taskTitle');
const taskDesc = document.getElementById('taskDesc');
const taskPriority = document.getElementById('taskPriority');
const taskDueDate = document.getElementById('taskDueDate');
const modalMembersGrid = document.getElementById('modalMembersGrid');
const modalChecklistContainer = document.getElementById('modalChecklistContainer');
const btnDeleteTask = document.getElementById('btnDeleteTask');

// Customizer selectors
const sliderBlur = document.getElementById('sliderBlur');
const blurValDisplay = document.getElementById('blurValDisplay');
const toggleOrbs = document.getElementById('toggleOrbs');
const themePickers = document.querySelectorAll('.theme-pick-btn');

// Stats selectors
const statTotalTasks = document.getElementById('statTotalTasks');
const statCompletedTasks = document.getElementById('statCompletedTasks');
const statIncompleteTasks = document.getElementById('statIncompleteTasks');
const statHighCount = document.getElementById('statHighCount');
const statHighBar = document.getElementById('statHighBar');
const statMediumCount = document.getElementById('statMediumCount');
const statMediumBar = document.getElementById('statMediumBar');
const statLowCount = document.getElementById('statLowCount');
const statLowBar = document.getElementById('statLowBar');
const statColumnsBreakdown = document.getElementById('statColumnsBreakdown');

/**
 * Initialize DOM setups and listeners
 */
export function initDOM(renderCallback) {
  // Global search & filters change
  searchInput.addEventListener('input', renderCallback);
  filterMember.addEventListener('change', renderCallback);
  
  filterPriority.addEventListener('change', renderCallback);

  // Authentication Login form listener
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idVal = loginId.value.trim();
    const passVal = loginPassword.value;
    try {
      loginUser(idVal, passVal);
      loginError.style.display = 'none';
      applySettings();
      renderFiltersAndSelectors();
      renderCallback();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = 'block';
    }
  });

  // Logout button listener
  btnLogout.addEventListener('click', () => {
    logoutUser();
    loginForm.reset();
    loginId.value = '';
    loginPassword.value = '';
    loginError.style.display = 'none';
    applySettings();
    renderCallback();
  });

  // Close modals clicking on backdrop
  [taskModal, membersModal, customizerModal, statsModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // Modal triggers
  document.getElementById('btnStats').addEventListener('click', () => openStatsModal());
  document.getElementById('btnMembers').addEventListener('click', () => openMembersModal());
  document.getElementById('btnCustomizer').addEventListener('click', () => openCustomizerModal());
  document.getElementById('btnAddColumn').addEventListener('click', () => handleAddColumn(renderCallback));

  // Modal close buttons
  document.getElementById('closeTaskModalBtn').addEventListener('click', () => closeModal(taskModal));
  document.getElementById('closeMembersModalBtn').addEventListener('click', () => closeModal(membersModal));
  document.getElementById('closeCustomizerModalBtn').addEventListener('click', () => closeModal(customizerModal));
  document.getElementById('closeStatsModalBtn').addEventListener('click', () => closeModal(statsModal));
  document.getElementById('btnCancelTaskModal').addEventListener('click', () => closeModal(taskModal));

  // Customizer slider & toggle listeners
  sliderBlur.addEventListener('input', (e) => {
    const val = e.target.value;
    blurValDisplay.textContent = `${val}px`;
    updateSettings({ blurAmount: parseInt(val) });
    applySettings();
  });

  toggleOrbs.addEventListener('change', (e) => {
    updateSettings({ showOrbs: e.target.checked });
    applySettings();
  });

  themePickers.forEach(btn => {
    btn.addEventListener('click', () => {
      themePickers.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.getAttribute('data-theme');
      updateSettings({ background: theme });
      applySettings();
    });
  });

  // Database Reset Listener
  document.getElementById('btnResetBoard').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the board? This will wipe all custom columns, tasks, and members.')) {
      resetBoardState();
      applySettings();
      closeModal(customizerModal);
      renderCallback();
    }
  });

  // Task form submission
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSaveTask(renderCallback);
  });

  // Delete task click
  btnDeleteTask.addEventListener('click', () => {
    const id = taskFormId.value;
    if (id && confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
      closeModal(taskModal);
      renderCallback();
    }
  });

  // Add subtask / checklist item row in task modal
  document.getElementById('btnAddChecklistItem').addEventListener('click', () => {
    appendChecklistItem('', false);
  });

  // Employee Registration Form
  const employeeForm = document.getElementById('createEmployeeForm');
  employeeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('newMemberName');
    const idInput = document.getElementById('newMemberLoginId');
    const passInput = document.getElementById('newMemberPassword');
    
    const name = nameInput.value.trim();
    const loginId = idInput.value.trim();
    const password = passInput.value;
    
    if (name && loginId && password) {
      try {
        addMember(name, loginId, password);
        nameInput.value = '';
        idInput.value = '';
        passInput.value = '';
        renderMembersModalList();
        renderFiltersAndSelectors();
        renderCallback();
      } catch (err) {
        alert(err.message);
      }
    }
  });

  // Apply initial settings styling
  applySettings();
}

/**
 * Open Modal helper
 */
function openModal(modal) {
  modal.classList.add('open');
}

/**
 * Close Modal helper
 */
function closeModal(modal) {
  modal.classList.remove('open');
}

/**
 * Applies customizer parameters to the application UI
 */
export function applySettings() {
  const { settings } = getBoardState();
  
  // Toggle role-worker class and Login overlay
  const session = getActiveSession();
  if (session) {
    if (loginOverlay) loginOverlay.classList.remove('open');
    if (sessionBadge) {
      sessionBadge.style.display = 'inline-flex';
      sessionName.textContent = session.name;
      sessionAvatar.textContent = session.initials;
    }
    
    if (session.role === 'admin') {
      document.body.classList.remove('role-worker');
    } else {
      document.body.classList.add('role-worker');
    }
  } else {
    if (loginOverlay) loginOverlay.classList.add('open');
    if (sessionBadge) sessionBadge.style.display = 'none';
    document.body.classList.remove('role-worker');
  }
  
  // 1. Blur
  document.documentElement.style.setProperty('--glass-blur', `${settings.blurAmount}px`);
  sliderBlur.value = settings.blurAmount;
  blurValDisplay.textContent = `${settings.blurAmount}px`;

  // 2. Orbs visibility
  const orbsContainer = document.getElementById('bgOrbsContainer');
  if (settings.showOrbs) {
    orbsContainer.style.opacity = '1';
    toggleOrbs.checked = true;
  } else {
    orbsContainer.style.opacity = '0';
    toggleOrbs.checked = false;
  }

  // 3. Theme selection
  document.body.className = ''; // wipe themes
  document.body.classList.add(`theme-${settings.background}`);

  // Apply body styles dynamically if browser has transitions
  let grad = '';
  switch (settings.background) {
    case 'mesh-dark': grad = 'radial-gradient(circle at 50% 50%, rgb(18, 14, 30) 0%, rgb(6, 4, 12) 100%)'; break;
    case 'mesh-cyber': grad = 'linear-gradient(135deg, #0e0a1b 0%, #170d24 50%, #030307 100%)'; break;
    case 'mesh-aurora': grad = 'linear-gradient(180deg, #0a171a 0%, #030606 100%)'; break;
    case 'mesh-sunset': grad = 'linear-gradient(135deg, #1b0f15 0%, #060305 100%)'; break;
  }
  document.body.style.background = grad;

  // Sync customizer modal picker active states
  themePickers.forEach(btn => {
    if (btn.getAttribute('data-theme') === settings.background) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Renders global dropdown selectors & selectors inside Task Edit Modal
 */
export function renderFiltersAndSelectors() {
  const state = getBoardState();
  
  // selectRole element removed - using auth session

  // Sync global header filter assignees select
  const currentFilterVal = filterMember.value;
  filterMember.innerHTML = '<option value="all">All Members</option>';
  state.members.forEach(member => {
    const opt = document.createElement('option');
    opt.value = member.id;
    opt.textContent = member.name;
    filterMember.appendChild(opt);
  });
  filterMember.value = currentFilterVal;

  // Build members selector checkboxes inside task edit modal
  modalMembersGrid.innerHTML = '';
  state.members.forEach(member => {
    const card = document.createElement('div');
    card.className = 'member-select-card';
    card.setAttribute('data-member-id', member.id);
    
    // Virtual avatar badge
    const avatar = document.createElement('div');
    avatar.className = 'member-avatar';
    avatar.style.background = `linear-gradient(135deg, ${member.gradient.start}, ${member.gradient.end})`;
    avatar.textContent = member.initials;

    const label = document.createElement('span');
    label.className = 'member-select-name';
    label.textContent = member.name;

    card.appendChild(avatar);
    card.appendChild(label);

    card.addEventListener('click', () => {
      const session = getActiveSession();
      if (session && session.role === 'admin') {
        card.classList.toggle('selected');
      }
    });

    modalMembersGrid.appendChild(card);
  });
}

/**
 * Add Column handle
 */
function handleAddColumn(renderCallback) {
  const title = prompt('Enter column title:');
  if (title && title.trim()) {
    addColumn(title.trim());
    renderCallback();
  }
}

/**
 * Save / Update Task action
 */
function handleSaveTask(renderCallback) {
  const id = taskFormId.value || null;
  const colId = taskFormColumnId.value;

  // Gather checklist elements
  const checklist = [];
  modalChecklistContainer.querySelectorAll('.checklist-row').forEach(row => {
    const textInput = row.querySelector('.checklist-row-input');
    const checkInput = row.querySelector('.checklist-row-checkbox');
    const text = textInput.value.trim();
    if (text) {
      checklist.push({
        id: row.getAttribute('data-chk-id') || `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text,
        done: checkInput.checked
      });
    }
  });

  // Gather members selected
  const memberIds = [];
  modalMembersGrid.querySelectorAll('.member-select-card.selected').forEach(card => {
    memberIds.push(card.getAttribute('data-member-id'));
  });

  const taskData = {
    title: taskTitle.value.trim(),
    description: taskDesc.value.trim(),
    priority: taskPriority.value,
    dueDate: taskDueDate.value || '',
    members: memberIds,
    checklist
  };

  addOrUpdateTask(id, colId, taskData);
  closeModal(taskModal);
  renderCallback();
}

/**
 * Task Details Modal - open action
 */
export function openTaskEditModal(columnId, taskId = null) {
  const state = getBoardState();
  renderFiltersAndSelectors(); // refresh modal assignees list state

  const session = getActiveSession();
  const isAdmin = session.role === 'admin';

  taskForm.reset();
  modalChecklistContainer.innerHTML = '';
  taskFormColumnId.value = columnId;

  // Workers are allowed to edit task fields (add/update their tasks)
  taskTitle.readOnly = false;
  taskPriority.disabled = false;
  taskDueDate.readOnly = false;
  
  const btnAdd = document.getElementById('btnAddChecklistItem');
  if (btnAdd) {
    btnAdd.style.display = 'inline-flex';
  }

  if (taskId) {
    // Editing Mode
    const task = getTask(taskId);
    if (!task) return;

    document.getElementById('modalTaskTitleHeader').textContent = 'Edit Task';
    taskFormId.value = taskId;
    taskTitle.value = task.title;
    taskDesc.value = task.description;
    taskPriority.value = task.priority;
    taskDueDate.value = task.dueDate || '';

    // Mark active checklist subtasks
    if (task.checklist && task.checklist.length > 0) {
      task.checklist.forEach(item => {
        appendChecklistItem(item.text, item.done, item.id);
      });
    }

    // Toggle active members selected
    if (task.members && task.members.length > 0) {
      modalMembersGrid.querySelectorAll('.member-select-card').forEach(card => {
        const id = card.getAttribute('data-member-id');
        if (task.members.includes(id)) {
          card.classList.add('selected');
        }
      });
    }

    btnDeleteTask.style.display = isAdmin ? 'inline-flex' : 'none';
  } else {
    // Creation Mode
    document.getElementById('modalTaskTitleHeader').textContent = 'Create Task';
    taskFormId.value = '';
    btnDeleteTask.style.display = 'none';

    // Auto-select assignee to active worker (since workers can only create their own tasks)
    if (!isAdmin) {
      modalMembersGrid.querySelectorAll('.member-select-card').forEach(card => {
        const id = card.getAttribute('data-member-id');
        if (id === session.id) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });
    }
  }

  openModal(taskModal);
}

/**
 * Add subtask checklist item template inside the Task modal
 */
function appendChecklistItem(text = '', done = false, id = null) {
  const state = getBoardState();
  const isAdmin = state.settings.activeRole === 'admin';

  const rowId = id || `chk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const row = document.createElement('div');
  row.className = 'checklist-row';
  row.setAttribute('data-chk-id', rowId);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checklist-row-checkbox';
  checkbox.checked = done;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Subtask description...';
  input.className = 'checklist-row-input';
  input.value = text;
  input.readOnly = !isAdmin;
  if (done) input.classList.add('done');

  // Checkbox toggle class
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      input.classList.add('done');
    } else {
      input.classList.remove('done');
    }
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'checklist-row-delete';
  deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
  deleteBtn.addEventListener('click', () => {
    row.parentNode.removeChild(row);
  });
  
  // All editors can delete checklist rows

  row.appendChild(checkbox);
  row.appendChild(input);
  row.appendChild(deleteBtn);

  modalChecklistContainer.appendChild(row);
}

/**
 * Members Modal - open and render list
 */
function openMembersModal() {
  renderMembersModalList();
  openModal(membersModal);
}

function renderMembersModalList() {
  const state = getBoardState();
  const list = document.getElementById('boardMembersList');
  list.innerHTML = '';

  state.members.forEach(member => {
    const item = document.createElement('div');
    item.className = 'member-list-item';

    const info = document.createElement('div');
    info.className = 'member-info-block';

    const avatar = document.createElement('div');
    avatar.className = 'member-avatar';
    avatar.style.background = `linear-gradient(135deg, ${member.gradient.start}, ${member.gradient.end})`;
    avatar.textContent = member.initials;

    const name = document.createElement('span');
    name.className = 'member-name-text';
    name.textContent = `${member.name} (${member.loginId})`;

    info.appendChild(avatar);
    info.appendChild(name);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'column-icon-btn danger';
    deleteBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Remove ${member.name} from board? This will remove them from all tasks.`)) {
        deleteMember(member.id);
        renderMembersModalList();
        renderFiltersAndSelectors();
        // Trigger board rebuild so avatars reflect their deletion
        document.getElementById('searchInput').dispatchEvent(new Event('input'));
      }
    });

    item.appendChild(info);
    item.appendChild(deleteBtn);
    list.appendChild(item);
  });
}

/**
 * Customizer settings modal open
 */
function openCustomizerModal() {
  openModal(customizerModal);
}

/**
 * Statistics Analytics modal open
 */
function openStatsModal() {
  const state = getBoardState();
  const tasksArr = Object.values(state.tasks);

  // 1. Total counts
  const total = tasksArr.length;
  // Completed column is usually the last column or id contains 'done'
  const doneCol = state.columns.find(c => c.id.includes('done') || c.title.toLowerCase() === 'done');
  const completed = doneCol ? doneCol.taskIds.length : 0;
  const incomplete = total - completed;

  statTotalTasks.textContent = total;
  statCompletedTasks.textContent = completed;
  statIncompleteTasks.textContent = incomplete;

  // 2. Priority counts
  const high = tasksArr.filter(t => t.priority === 'high').length;
  const medium = tasksArr.filter(t => t.priority === 'medium').length;
  const low = tasksArr.filter(t => t.priority === 'low').length;

  statHighCount.textContent = high;
  statMediumCount.textContent = medium;
  statLowCount.textContent = low;

  // Bar width animation percentages
  const highPercent = total > 0 ? (high / total) * 100 : 0;
  const medPercent = total > 0 ? (medium / total) * 100 : 0;
  const lowPercent = total > 0 ? (low / total) * 100 : 0;

  statHighBar.style.width = `${highPercent}%`;
  statMediumBar.style.width = `${medPercent}%`;
  statLowBar.style.width = `${lowPercent}%`;

  // 3. Breakdown per column
  statColumnsBreakdown.innerHTML = '';
  state.columns.forEach(col => {
    const li = document.createElement('li');
    li.className = 'stats-column-item';
    li.innerHTML = `
      <span>${col.title}</span>
      <span class="stats-col-count">${col.taskIds.length} tasks</span>
    `;
    statColumnsBreakdown.appendChild(li);
  });

  openModal(statsModal);
}

/**
 * MAIN BOARD RENDERING ENGINE
 */
export function renderBoard(onStateChanged) {
  const state = getBoardState();
  boardCanvas.innerHTML = '';

  const session = getActiveSession();
  if (!session) return;
  const isAdmin = session.role === 'admin';
  const activeRole = session.id;

  // Capture search and filters
  const query = searchInput.value.toLowerCase().trim();
  const selectedMember = filterMember.value;
  const selectedPriority = filterPriority.value;

  state.columns.forEach(col => {
    // 1. Column base panel
    const columnNode = document.createElement('div');
    columnNode.className = 'board-column glass-panel';
    columnNode.draggable = isAdmin;
    columnNode.setAttribute('data-col-id', col.id);

    // 2. Column Header
    const colHeader = document.createElement('div');
    colHeader.className = 'column-header';

    const colTitleWrap = document.createElement('div');
    colTitleWrap.className = 'column-title-wrapper';

    // Drag Handle SVG
    const handleSVG = document.createElement('div');
    handleSVG.className = 'column-drag-handle';
    handleSVG.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>';

    // Editable title input
    const titleInput = document.createElement('input');
    titleInput.className = 'column-title-input';
    titleInput.type = 'text';
    titleInput.value = col.title;
    titleInput.readOnly = !isAdmin;

    titleInput.addEventListener('change', (e) => {
      if (!isAdmin) return;
      const val = e.target.value.trim();
      if (val) {
        renameColumn(col.id, val);
      } else {
        titleInput.value = col.title; // revert
      }
    });

    colTitleWrap.appendChild(handleSVG);
    colTitleWrap.appendChild(titleInput);

    // Header actions (Badge count, Add task, Delete Column)
    const headerActions = document.createElement('div');
    headerActions.className = 'column-header-actions';

    const countBadge = document.createElement('span');
    countBadge.className = 'column-badge';
    countBadge.textContent = col.taskIds.length;

    const addTaskBtn = document.createElement('button');
    addTaskBtn.className = 'column-icon-btn';
    addTaskBtn.title = 'Add Task';
    addTaskBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    addTaskBtn.addEventListener('click', () => openTaskEditModal(col.id));

    const deleteColBtn = document.createElement('button');
    deleteColBtn.className = 'column-icon-btn danger';
    deleteColBtn.title = 'Delete Column';
    deleteColBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    deleteColBtn.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete column "${col.title}"? All tasks inside will be permanently deleted.`)) {
        deleteColumn(col.id);
        onStateChanged();
      }
    });

    headerActions.appendChild(countBadge);
    headerActions.appendChild(addTaskBtn); // all users can add tasks!
    
    if (isAdmin) {
      headerActions.appendChild(deleteColBtn);
    }

    colHeader.appendChild(colTitleWrap);
    colHeader.appendChild(headerActions);
    columnNode.appendChild(colHeader);

    // 3. Task List Drop container
    const taskList = document.createElement('div');
    taskList.className = 'task-list';
    taskList.setAttribute('data-col-id', col.id);

    // Count matching cards
    let visibleCardsCount = 0;

    // 4. Generate Task Cards
    col.taskIds.forEach(taskId => {
      const task = state.tasks[taskId];
      if (!task) return;

      // Filter Logic
      // a) search query filter
      const matchesQuery = !query || 
        task.title.toLowerCase().includes(query) || 
        (task.description && task.description.toLowerCase().includes(query));

      // b) assignee filter
      const matchesAssignee = selectedMember === 'all' || 
        (task.members && task.members.includes(selectedMember));

      // c) priority filter
      const matchesPriority = selectedPriority === 'all' || 
        task.priority === selectedPriority;

      // d) active worker role focus filter
      const matchesWorkerRole = isAdmin || (task.members && task.members.includes(activeRole));

      if (!matchesQuery || !matchesAssignee || !matchesPriority || !matchesWorkerRole) return;

      visibleCardsCount++;

      // Build task card element
      const cardNode = document.createElement('div');
      cardNode.className = 'task-card glass-panel-nested';
      cardNode.draggable = true;
      cardNode.setAttribute('data-task-id', task.id);

      // Top priority accent line
      const priLine = document.createElement('div');
      priLine.className = `card-priority-line ${task.priority}`;
      cardNode.appendChild(priLine);

      // Header block
      const cardHeader = document.createElement('div');
      cardHeader.className = 'card-header';
      
      const cardTitle = document.createElement('h4');
      cardTitle.className = 'card-title';
      cardTitle.textContent = task.title;

      const priBadge = document.createElement('span');
      priBadge.className = `card-priority-badge ${task.priority}`;
      priBadge.textContent = task.priority;

      cardHeader.appendChild(cardTitle);
      cardHeader.appendChild(priBadge);
      cardNode.appendChild(cardHeader);

      // Description text
      if (task.description) {
        const cardDesc = document.createElement('p');
        cardDesc.className = 'card-desc';
        cardDesc.textContent = task.description;
        cardNode.appendChild(cardDesc);
      }

      // Checklist progress
      if (task.checklist && task.checklist.length > 0) {
        const totalItems = task.checklist.length;
        const doneItems = task.checklist.filter(item => item.done).length;
        const percent = Math.round((doneItems / totalItems) * 100);

        const progressDiv = document.createElement('div');
        progressDiv.className = 'card-checklist-summary';

        progressDiv.innerHTML = `
          <div class="checklist-info-row">
            <span>Subtasks</span>
            <span>${doneItems}/${totalItems} (${percent}%)</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width: ${percent}%;"></div>
          </div>
        `;
        cardNode.appendChild(progressDiv);
      }

      // Footer info (Date & Avatars)
      const cardFooter = document.createElement('div');
      cardFooter.className = 'card-footer';

      // Due date
      const dateBadge = document.createElement('div');
      dateBadge.className = 'card-date-badge';
      if (task.dueDate) {
        const isDoneColumn = col.id.includes('done') || col.title.toLowerCase() === 'done';
        const isOverdue = new Date(task.dueDate) < new Date().setHours(0,0,0,0) && !isDoneColumn;
        
        dateBadge.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${task.dueDate}</span>
        `;
        if (isOverdue) {
          dateBadge.classList.add('overdue');
          dateBadge.title = 'Task is overdue!';
        }
      }
      cardFooter.appendChild(dateBadge);

      // Members avatars row
      const membersRow = document.createElement('div');
      membersRow.className = 'card-members-row';

      if (task.members && task.members.length > 0) {
        task.members.forEach(memberId => {
          const member = state.members.find(m => m.id === memberId);
          if (member) {
            const avatar = document.createElement('div');
            avatar.className = 'member-avatar';
            avatar.style.background = `linear-gradient(135deg, ${member.gradient.start}, ${member.gradient.end})`;
            avatar.textContent = member.initials;
            avatar.title = member.name;
            membersRow.appendChild(avatar);
          }
        });
      }
      cardFooter.appendChild(membersRow);
      cardNode.appendChild(cardFooter);

      // Card edit click listener
      cardNode.addEventListener('click', (e) => {
        // Prevent opening edit modal if dragging or clicking buttons inside card (none currently, but safe practice)
        if (cardNode.classList.contains('dragging')) return;
        openTaskEditModal(col.id, task.id);
      });

      // Bind drag event listeners
      setupCardDragListeners(cardNode, task.id, col.id);

      taskList.appendChild(cardNode);
    });

    // Update header badge for only visible count matching filters
    countBadge.textContent = visibleCardsCount;

    if (visibleCardsCount > 1) {
      taskList.classList.add('has-scrollbar');
    } else {
      taskList.classList.remove('has-scrollbar');
    }

    columnNode.appendChild(taskList);

    // Bind column drag event listeners
    setupColumnDragListeners(columnNode, col.id, onStateChanged);

    boardCanvas.appendChild(columnNode);
  });
}
