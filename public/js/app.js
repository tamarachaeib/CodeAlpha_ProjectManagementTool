// ============ CONFIG ============
const API_URL = 'http://localhost:5001/api';

// ============ STATE ============
let currentUser = JSON.parse(localStorage.getItem('taskflow_user')) || null;
let token = localStorage.getItem('taskflow_token') || null;

// ============ DOM ELEMENTS ============
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const logoutBtn = document.getElementById('logout-btn');

// ============ SWITCH LOGIN / REGISTER ============
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  loginForm.classList.add('hidden');
  registerForm.classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerForm.classList.add('hidden');
  loginForm.classList.remove('hidden');
});

// ============ SHOW APP / AUTH ============
function showApp() {
  authSection.classList.add('hidden');
  appSection.classList.remove('hidden');
  loadProjects();
  loadUnreadCount();
  setInterval(loadUnreadCount, 10000);
}

function showAuth() {
  appSection.classList.add('hidden');
  authSection.classList.remove('hidden');
}

// ============ REGISTER ============
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.textContent = '';

  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      registerError.textContent = data.message || 'Something went wrong';
      return;
    }

    saveSession(data.user, data.token);
    showApp();
  } catch (err) {
    registerError.textContent = 'Could not connect to server';
  }
});

// ============ LOGIN ============
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      loginError.textContent = data.message || 'Invalid credentials';
      return;
    }

    saveSession(data.user, data.token);
    showApp();
  } catch (err) {
    loginError.textContent = 'Could not connect to server';
  }
});

// ============ SESSION HELPERS ============
function saveSession(user, jwt) {
  currentUser = user;
  token = jwt;
  localStorage.setItem('taskflow_user', JSON.stringify(user));
  localStorage.setItem('taskflow_token', jwt);
}

function clearSession() {
  currentUser = null;
  token = null;
  localStorage.removeItem('taskflow_user');
  localStorage.removeItem('taskflow_token');
}

logoutBtn.addEventListener('click', () => {
  clearSession();
  showAuth();
});

// ============ HELPER: authenticated fetch ============
function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ============ HELPER: auto-logout on expired/invalid token ============
function handleAuthError(res) {
  if (res.status === 401) {
    clearSession();
    showAuth();
    showToast('Your session expired — please log in again.', 'error');
    return true;
  }
  return false;
}

// ============ CUSTOM CONFIRM MODAL (بدل confirm() تبع المتصفح) ============
function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-card" style="text-align:center; max-width:340px;">
        <p style="margin-bottom:20px; font-weight:600; font-size:0.95rem;"></p>
        <div class="modal-actions">
          <button class="modal-cancel">Cancel</button>
          <button class="modal-danger">Delete</button>
        </div>
      </div>
    `;
    overlay.querySelector('p').textContent = message;
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(false);
    });
    overlay.querySelector('.modal-danger').addEventListener('click', () => {
      overlay.remove();
      resolve(true);
    });
  });
}

// ============ TOAST NOTIFICATIONS ============
const toastContainer = document.getElementById('toast-container');

function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============ HELPERS: avatar, initials, dates ============
function getInitials(username) {
  return username ? username.charAt(0).toUpperCase() : '?';
}

function avatarHTML(avatarPath, username) {
  if (avatarPath) return `<img src="${avatarPath}" alt="${username}" />`;
  return getInitials(username);
}

function timeAgo(dateStr) {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============ PROJECTS VIEW ELEMENTS ============
const projectsView = document.getElementById('projects-view');
const boardView = document.getElementById('board-view');
const projectsListEl = document.getElementById('projects-list');
const newProjectBtn = document.getElementById('new-project-btn');
const backToProjectsBtn = document.getElementById('back-to-projects');
const navHome = document.getElementById('nav-home');

let currentProjectId = null;

// ============ VIEW SWITCHING ============
function showProjectsView() {
  currentProjectId = null;
  boardView.classList.add('hidden');
  projectsView.classList.remove('hidden');
}

function showBoardView() {
  projectsView.classList.add('hidden');
  boardView.classList.remove('hidden');
}

navHome.addEventListener('click', () => {
  showProjectsView();
  loadProjects();
});

backToProjectsBtn.addEventListener('click', () => {
  showProjectsView();
  loadProjects();
});

// ============ LOAD MY PROJECTS ============
async function loadProjects() {
  try {
    const res = await authFetch(`${API_URL}/projects`);
    if (handleAuthError(res)) return;
    const projects = await res.json();

    projectsListEl.innerHTML = '';

    if (projects.length === 0) {
      projectsListEl.innerHTML = '<p class="empty-msg">No projects yet. Create your first one!</p>';
      return;
    }

    projects.forEach((project) => {
      const card = document.createElement('div');
      card.className = 'project-card';
      card.innerHTML = `
        <h3></h3>
        <p></p>
        <div class="member-avatars"></div>
      `;
      card.querySelector('h3').textContent = project.name;
      card.querySelector('p').textContent = project.description || 'No description';

      const avatarsEl = card.querySelector('.member-avatars');
      project.members.slice(0, 5).forEach((m) => {
        const av = document.createElement('div');
        av.className = 'avatar-circle';
        av.innerHTML = avatarHTML(m.avatar, m.username);
        av.title = m.username;
        avatarsEl.appendChild(av);
      });

      card.addEventListener('click', () => openBoard(project._id));
      projectsListEl.appendChild(card);
    });
  } catch (err) {
    showToast('Could not load projects');
  }
}

// ============ CREATE PROJECT ============
newProjectBtn.addEventListener('click', () => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <h3>Create Project</h3>
      <label>Project name</label>
      <input type="text" id="new-project-name" placeholder="e.g. Website Redesign" maxlength="60" />
      <label>Description (optional)</label>
      <textarea id="new-project-description" rows="3" placeholder="What's this project about?" maxlength="300"></textarea>
      <div class="modal-actions">
        <button class="modal-cancel">Cancel</button>
        <button class="modal-confirm">Create</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.remove());

  overlay.querySelector('.modal-confirm').addEventListener('click', async () => {
    const name = document.getElementById('new-project-name').value.trim();
    const description = document.getElementById('new-project-description').value.trim();

    if (!name) return showToast('Project name is required');

    const res = await authFetch(`${API_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    const project = await res.json();

    if (handleAuthError(res)) return;
    if (!res.ok) return showToast(project.message || 'Could not create project');

    overlay.remove();
    showToast('Project created!', 'success');
    loadProjects();
  });
});

// ============ BOARD VIEW ELEMENTS ============
const boardTitle = document.getElementById('board-title');
const boardDescription = document.getElementById('board-description');
const boardMembersEl = document.getElementById('board-members');
const addMemberBtn = document.getElementById('add-member-btn');
const deleteProjectBtn = document.getElementById('delete-project-btn');
const columnEls = {
  todo: document.getElementById('column-todo'),
  'in-progress': document.getElementById('column-in-progress'),
  done: document.getElementById('column-done'),
};

let currentProjectData = null; // { project, tasks } الحالية المفتوحة

// ============ OPEN A PROJECT BOARD ============
async function openBoard(projectId) {
  currentProjectId = projectId;

  try {
    const res = await authFetch(`${API_URL}/projects/${projectId}`);
    if (handleAuthError(res)) return;
    const data = await res.json();

    if (!res.ok) return showToast(data.message || 'Could not load project');

    currentProjectData = data;
    renderBoard(data);
    showBoardView();
  } catch (err) {
    showToast('Could not load project');
  }
}

// ============ RENDER THE WHOLE BOARD ============
function renderBoard(data) {
  const { project, tasks } = data;
  const myId = currentUser._id || currentUser.id;
  const isOwner = project.owner._id === myId;

  boardTitle.textContent = project.name;
  boardDescription.textContent = project.description || '';

  boardMembersEl.innerHTML = '';
  project.members.forEach((m) => {
    const av = document.createElement('div');
    av.className = 'avatar-circle';
    av.innerHTML = avatarHTML(m.avatar, m.username);
    av.title = m.username;
    boardMembersEl.appendChild(av);
  });

  addMemberBtn.classList.toggle('hidden', !isOwner);
  deleteProjectBtn.classList.toggle('hidden', !isOwner);

  // نفرّغ كل الأعمدة ونعيد تعبئتها
  Object.values(columnEls).forEach((col) => (col.innerHTML = ''));
  tasks.forEach((task) => {
    columnEls[task.status].appendChild(createTaskCard(task));
  });
}

// ============ CREATE A TASK CARD (draggable + move arrows) ============
const STATUS_ORDER = ['todo', 'in-progress', 'done'];

function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.draggable = true;
  card.dataset.taskId = task._id;

  const dueBadge = task.dueDate
    ? `<span class="due-date-badge ${new Date(task.dueDate) < new Date() ? 'overdue' : ''}">${new Date(
        task.dueDate
      ).toLocaleDateString()}</span>`
    : '';

  const currentIndex = STATUS_ORDER.indexOf(task.status);
  const canMoveBack = currentIndex > 0;
  const canMoveForward = currentIndex < STATUS_ORDER.length - 1;

  card.innerHTML = `
    <h4></h4>
    <div class="task-card-footer">
      <div class="task-card-meta">${dueBadge}</div>
      ${task.assignedTo ? '<div class="avatar-circle"></div>' : ''}
    </div>
    <div class="task-move-row">
      <button class="move-btn move-back ${canMoveBack ? '' : 'move-btn-disabled'}" title="Move back">&larr;</button>
      <button class="move-btn move-forward ${canMoveForward ? '' : 'move-btn-disabled'}" title="Move forward">&rarr;</button>
    </div>
  `;
  card.querySelector('h4').textContent = task.title;

  if (task.assignedTo) {
    const av = card.querySelector('.avatar-circle');
    av.innerHTML = avatarHTML(task.assignedTo.avatar, task.assignedTo.username);
    av.title = task.assignedTo.username;
  }

  // فتح تفاصيل الـ task عند الضغط على الكرت (بس مش لما نضغط عالأسهم)
  card.addEventListener('click', (e) => {
    if (e.target.closest('.move-btn')) return;
    openTaskDetail(task);
  });

  // ============ أسهم النقل السريعة ============
  const moveBackBtn = card.querySelector('.move-back');
  const moveForwardBtn = card.querySelector('.move-forward');

  moveBackBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!canMoveBack) return;
    moveTaskToStatus(task._id, STATUS_ORDER[currentIndex - 1]);
  });

  moveForwardBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!canMoveForward) return;
    moveTaskToStatus(task._id, STATUS_ORDER[currentIndex + 1]);
  });

  // ============ DRAG EVENTS ============
  card.addEventListener('dragstart', () => {
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', () => {
    card.classList.remove('dragging');
  });

  return card;
}

// ============ MOVE TASK TO A NEW STATUS (used by arrows AND drag & drop) ============
async function moveTaskToStatus(taskId, newStatus) {
  const res = await authFetch(`${API_URL}/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus }),
  });

  if (handleAuthError(res)) return;
  if (!res.ok) return showToast('Could not move task');

  openBoard(currentProjectId); // أبسط طريقة نضمن كل الأسهم/الأعمدة تتحدّث صح
}

// ============ DRAG & DROP BETWEEN COLUMNS ============
Object.entries(columnEls).forEach(([status, columnEl]) => {
  columnEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    columnEl.classList.add('drag-over');
  });

  columnEl.addEventListener('dragleave', () => {
    columnEl.classList.remove('drag-over');
  });

  columnEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    columnEl.classList.remove('drag-over');

    const draggingCard = document.querySelector('.task-card.dragging');
    if (!draggingCard) return;

    const taskId = draggingCard.dataset.taskId;
    moveTaskToStatus(taskId, status);
  });
});

// ============ ADD TASK (per column "+" button) ============
document.querySelectorAll('.add-task-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const status = btn.dataset.status;
    showTaskFormModal(status);
  });
});

function showTaskFormModal(status) {
  const members = currentProjectData.project.members;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <h3>New Task</h3>
      <label>Title</label>
      <input type="text" id="task-title-input" placeholder="Task title" maxlength="100" />
      <label>Description (optional)</label>
      <textarea id="task-description-input" rows="3" placeholder="Details..." maxlength="500"></textarea>
      <label>Assign to</label>
      <select id="task-assignee-input">
        <option value="">Unassigned</option>
        ${members.map((m) => `<option value="${m._id}">${m.username}</option>`).join('')}
      </select>
      <label>Due date (optional)</label>
      <input type="date" id="task-duedate-input" />
      <div class="modal-actions">
        <button class="modal-cancel">Cancel</button>
        <button class="modal-confirm">Create</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.remove());

  overlay.querySelector('.modal-confirm').addEventListener('click', async () => {
    const title = document.getElementById('task-title-input').value.trim();
    const description = document.getElementById('task-description-input').value.trim();
    const assignedTo = document.getElementById('task-assignee-input').value;
    const dueDate = document.getElementById('task-duedate-input').value;

    if (!title) return showToast('Task title is required');

    const res = await authFetch(`${API_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify({
        projectId: currentProjectId,
        title,
        description,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
        status,
      }),
    });
    const task = await res.json();

    if (handleAuthError(res)) return;
    if (!res.ok) return showToast(task.message || 'Could not create task');

    overlay.remove();
    showToast('Task created!', 'success');
    openBoard(currentProjectId);
  });
}

// ============ TASK DETAIL MODAL (view/edit/comments/delete) ============
async function openTaskDetail(task) {
  const members = currentProjectData.project.members;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <h3>Task Details</h3>

      <div class="task-detail-section">
        <label>Title</label>
        <input type="text" id="detail-title" maxlength="100" />
      </div>

      <div class="task-detail-section">
        <label>Description</label>
        <textarea id="detail-description" rows="3" maxlength="500"></textarea>
      </div>

      <div class="task-detail-section">
        <label>Assigned to</label>
        <select id="detail-assignee">
          <option value="">Unassigned</option>
          ${members.map((m) => `<option value="${m._id}">${m.username}</option>`).join('')}
        </select>
      </div>

      <div class="task-detail-section">
        <label>Due date</label>
        <input type="date" id="detail-duedate" />
      </div>

      <div class="task-detail-section">
        <label>Comments</label>
        <div class="task-comments-list" id="detail-comments-list"></div>
        <div class="comment-form">
          <input type="text" id="detail-comment-input" placeholder="Write a comment..." maxlength="500" />
          <button id="detail-comment-send">Send</button>
        </div>
      </div>

      <div class="modal-actions">
        <button class="modal-cancel">Close</button>
        <button class="modal-danger" id="detail-delete-btn">Delete</button>
        <button class="modal-confirm" id="detail-save-btn">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('detail-title').value = task.title;
  document.getElementById('detail-description').value = task.description || '';
  document.getElementById('detail-assignee').value = task.assignedTo ? task.assignedTo._id : '';
  document.getElementById('detail-duedate').value = task.dueDate ? task.dueDate.split('T')[0] : '';

  // تحميل التعليقات
  const commentsListEl = document.getElementById('detail-comments-list');
  async function loadTaskComments() {
    const res = await authFetch(`${API_URL}/tasks/${task._id}/comments`);
    const comments = await res.json();

    commentsListEl.innerHTML = '';
    if (comments.length === 0) {
      commentsListEl.innerHTML = '<p class="empty-msg">No comments yet</p>';
      return;
    }

    comments.forEach((c) => {
      const div = document.createElement('div');
      div.className = 'task-comment';
      div.innerHTML = `
        <div class="avatar-circle">${avatarHTML(c.author.avatar, c.author.username)}</div>
        <div class="task-comment-bubble">
          <strong>${c.author.username}</strong>
          <span></span>
        </div>
      `;
      div.querySelector('span').textContent = c.content;
      commentsListEl.appendChild(div);
    });
  }
  loadTaskComments();

  document.getElementById('detail-comment-send').addEventListener('click', async () => {
    const input = document.getElementById('detail-comment-input');
    const content = input.value.trim();
    if (!content) return;

    const res = await authFetch(`${API_URL}/tasks/${task._id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    if (handleAuthError(res)) return;
    if (!res.ok) return showToast('Could not add comment');

    input.value = '';
    loadTaskComments();
  });

  overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.remove());

  document.getElementById('detail-save-btn').addEventListener('click', async () => {
    const title = document.getElementById('detail-title').value.trim();
    const description = document.getElementById('detail-description').value.trim();
    const assignedTo = document.getElementById('detail-assignee').value;
    const dueDate = document.getElementById('detail-duedate').value;

    if (!title) return showToast('Title cannot be empty');

    const res = await authFetch(`${API_URL}/tasks/${task._id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, description, assignedTo: assignedTo || null, dueDate: dueDate || null }),
    });

    if (handleAuthError(res)) return;
    if (!res.ok) return showToast('Could not update task');

    overlay.remove();
    showToast('Task updated', 'success');
    openBoard(currentProjectId);
  });

  document.getElementById('detail-delete-btn').addEventListener('click', async () => {
    const confirmed = await showConfirm('Delete this task? This cannot be undone.');
    if (!confirmed) return;

    const res = await authFetch(`${API_URL}/tasks/${task._id}`, { method: 'DELETE' });
    if (handleAuthError(res)) return;

    overlay.remove();
    showToast('Task deleted', 'success');
    openBoard(currentProjectId);
  });
}

// ============ ADD MEMBER ============
addMemberBtn.addEventListener('click', () => {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-card">
      <h3>Add Member</h3>
      <label>Username</label>
      <input type="text" id="add-member-username" placeholder="Exact username" />
      <div class="modal-actions">
        <button class="modal-cancel">Cancel</button>
        <button class="modal-confirm">Add</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.modal-cancel').addEventListener('click', () => overlay.remove());

  overlay.querySelector('.modal-confirm').addEventListener('click', async () => {
    const username = document.getElementById('add-member-username').value.trim();
    if (!username) return showToast('Enter a username');

    const res = await authFetch(`${API_URL}/projects/${currentProjectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
    const data = await res.json();

    if (handleAuthError(res)) return;
    if (!res.ok) return showToast(data.message || 'Could not add member');

    overlay.remove();
    showToast(`${username} added to the project!`, 'success');
    openBoard(currentProjectId);
  });
});

// ============ DELETE PROJECT ============
deleteProjectBtn.addEventListener('click', async () => {
  const confirmed = await showConfirm('Delete this entire project? All tasks and comments will be lost.');
  if (!confirmed) return;

  const res = await authFetch(`${API_URL}/projects/${currentProjectId}`, { method: 'DELETE' });
  if (handleAuthError(res)) return;

  showToast('Project deleted', 'success');
  showProjectsView();
  loadProjects();
});

// ============ NOTIFICATIONS ============
const notifBell = document.getElementById('notif-bell');
const notifBadge = document.getElementById('notif-badge');
const notifDropdown = document.getElementById('notif-dropdown');
const notifList = document.getElementById('notif-list');

function notifText(notif) {
  switch (notif.type) {
    case 'assigned':
      return `<strong>${notif.sender.username}</strong> assigned you a task${notif.task ? `: "${notif.task.title}"` : ''}`;
    case 'comment':
      return `<strong>${notif.sender.username}</strong> commented on a task you're assigned to`;
    case 'added-to-project':
      return `<strong>${notif.sender.username}</strong> added you to project${notif.project ? ` "${notif.project.name}"` : ''}`;
    default:
      return '';
  }
}

async function loadUnreadCount() {
  try {
    const res = await authFetch(`${API_URL}/notifications/unread-count`);
    if (!res.ok) return;
    const { count } = await res.json();

    if (count > 0) {
      notifBadge.textContent = count > 9 ? '9+' : count;
      notifBadge.classList.remove('hidden');
    } else {
      notifBadge.classList.add('hidden');
    }
  } catch (err) {
    // صامت، مجرد polling
  }
}

async function loadNotifications() {
  try {
    const res = await authFetch(`${API_URL}/notifications`);
    const notifications = await res.json();

    notifList.innerHTML = '';
    if (notifications.length === 0) {
      notifList.innerHTML = '<p class="empty-msg">No notifications yet</p>';
      return;
    }

    notifications.forEach((notif) => {
      const item = document.createElement('div');
      item.className = `notif-item ${notif.read ? '' : 'unread'}`;
      item.innerHTML = `
        <div class="avatar-circle">${avatarHTML(notif.sender.avatar, notif.sender.username)}</div>
        <div>
          <span>${notifText(notif)}</span>
          <span class="notif-time">${timeAgo(notif.createdAt)}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        notifDropdown.classList.add('hidden');
        if (notif.project) {
          showProjectsView();
          openBoard(notif.project._id || notif.project);
        }
      });

      notifList.appendChild(item);
    });
  } catch (err) {
    notifList.innerHTML = '<p class="empty-msg">Could not load notifications</p>';
  }
}

notifBell.addEventListener('click', async (e) => {
  e.stopPropagation();
  const isHidden = notifDropdown.classList.contains('hidden');
  notifDropdown.classList.toggle('hidden');

  if (isHidden) {
    await loadNotifications();
    await authFetch(`${API_URL}/notifications/read-all`, { method: 'POST' });
    notifBadge.classList.add('hidden');
  }
});

document.addEventListener('click', (e) => {
  if (!notifDropdown.contains(e.target) && e.target !== notifBell) {
    notifDropdown.classList.add('hidden');
  }
});

// ============ ON PAGE LOAD ============
if (currentUser && token) {
  showApp();
} else {
  showAuth();
}