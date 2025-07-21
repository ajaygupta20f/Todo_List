const API_URL = "https://dummyjson.com/todos";
const TODOS_PER_PAGE = 10;

let todos = [];              
let filteredTodos = [];      
let localTodos = loadLocalTodos(); 
let currentPage = 1;


const todoList = document.getElementById('todoList');
const searchInput = document.getElementById('searchInput');
const fromDate = document.getElementById('fromDate');
const toDate = document.getElementById('toDate');
const filterBtn = document.getElementById('filterBtn');
const addTodoForm = document.getElementById('addTodoForm');
const newTodoText = document.getElementById('newTodoText');
const loading = document.getElementById('loading');
const errorBox = document.getElementById('error');
const pagination = document.getElementById('pagination');

// Load local todos from localStorage

function loadLocalTodos() {
  const data = localStorage.getItem('localTodos');
  return data ? JSON.parse(data).map(todo => ({
    ...todo,
    createdDate: new Date(todo.createdDate)
  })) : [];
}

// Save local todos to localStorage

function saveLocalTodos() {
  localStorage.setItem('localTodos', JSON.stringify(localTodos));
}

// Fetch todos from API and merge with localTodos, then sort by createdDate desc

async function fetchTodos() {
  showLoading(true);
  try {
    const res = await axios.get(`${API_URL}?limit=100`);
    const apiTodos = res.data.todos.map(todo => ({
      ...todo,
      createdDate: randomDate(new Date(2024,0,1), new Date())
    }));

    todos = [...localTodos, ...apiTodos].sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    filteredTodos = [...todos];

    renderTodos();
    renderPagination();
  } catch (err) {
    showError('Failed to fetch todos');
  } finally {
    showLoading(false);
  }
}

// Render current page todos

function renderTodos() {
  todoList.innerHTML = '';
  const start = (currentPage - 1) * TODOS_PER_PAGE;
  const end = start + TODOS_PER_PAGE;
  const currentTodos = filteredTodos.slice(start, end);

  if (currentTodos.length === 0) {
    todoList.innerHTML = '<li class="list-group-item">No todos found.</li>';
  } else {
    currentTodos.forEach(todo => {
      const item = document.createElement('li');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      item.innerHTML = `
        <span>${todo.todo}</span>
        <small class="text-muted">${todo.createdDate.toISOString().split('T')[0]}</small>
      `;
      todoList.appendChild(item);
    });
  }
}

// Render pagination

function renderPagination() {
  const totalPages = Math.ceil(filteredTodos.length / TODOS_PER_PAGE);
  pagination.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click', e => {
      e.preventDefault();
      currentPage = i;
      renderTodos();
      renderPagination();
    });
    pagination.appendChild(li);
  }
}

// Filter by search text & date, and always sort newest first

function filterBySearchAndDate() {
  const searchText = searchInput.value.toLowerCase();
  const from = fromDate.value ? new Date(fromDate.value) : null;
  const to = toDate.value ? new Date(toDate.value) : null;

  filteredTodos = todos.filter(todo => {
    const taskMatch = todo.todo.toLowerCase().includes(searchText);
    const date = new Date(todo.createdDate);
    const fromMatch = from ? date >= from : true;
    const toMatch = to ? date <= to : true;
    return taskMatch && fromMatch && toMatch;
  });

  // Sort newest first

  filteredTodos.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

  currentPage = 1;
  renderTodos();
  renderPagination();
}

// Add new todo and keep list sorted

addTodoForm.addEventListener('submit', async e => {
  e.preventDefault();
  const text = newTodoText.value.trim();
  if (!text) return;

  showLoading(true);
  try {
    const res = await axios.post('https://dummyjson.com/todos/add', {
      todo: text,
      completed: false,
      userId: 1
    });

    const newTodo = {
      ...res.data,
      createdDate: new Date()
    };
     
      // add to local

    localTodos.unshift(newTodo); 
    saveLocalTodos();
   
    // add to new todo

    todos.unshift(newTodo); 
    todos.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));

    filterBySearchAndDate();
    newTodoText.value = '';
  } catch (err) {
    showError('Failed to add todo');
  } finally {
    showLoading(false);
  }
});

// Event listeners

searchInput.addEventListener('input', filterBySearchAndDate);
filterBtn.addEventListener('click', filterBySearchAndDate);

//  show loading

function showLoading(isLoading) {
  loading.style.display = isLoading ? 'block' : 'none';
}

//  show error

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.style.display = 'block';
  setTimeout(() => errorBox.style.display = 'none', 3000);
}

//  random date
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}


fetchTodos();
