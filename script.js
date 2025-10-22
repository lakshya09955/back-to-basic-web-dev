// Select DOM elements
const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const list = document.getElementById('todo-list');
const dueDateInput = document.getElementById('due-date');
const prioritySelect = document.getElementById('priority');
const themeToggle = document.getElementById('theme-toggle');
const filterButtons = document.querySelectorAll('.filter-buttons button');
const sortSelect = document.getElementById('sort-by');



// Current filter and sort state
let currentFilter = 'all';
let currentSort = 'priority';

// Theme handling
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'moon' : 'sun'}"></i>`;
}

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.innerHTML = `<i class="fas fa-${savedTheme === 'dark' ? 'sun' : 'moon'}"></i>`;

// Load saved todos from localStorage (if any)
const saved = localStorage.getItem('todos');
const todos = saved ? JSON.parse(saved) : [];

function saveTodos() {
    // save current todos array to localStorage
    localStorage.setItem('todos', JSON.stringify(todos));
}

function createNode(todo, index) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' completed' : '');
    li.draggable = true;

    // Priority indicator
    const priorityDot = document.createElement('span');
    priorityDot.className = `priority-indicator priority-${todo.priority || 'low'}`;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!todo.completed;

    // Text container
    const textContainer = document.createElement('div');
    textContainer.className = 'text';
    textContainer.contentEditable = true;
    textContainer.textContent = todo.text;

    // Due date display
    const dueDate = document.createElement('span');
    dueDate.className = 'due-date';
    if (todo.dueDate) {
        const date = new Date(todo.dueDate);
        dueDate.textContent = date.toLocaleDateString();
        if (date < new Date()) {
            dueDate.classList.add('overdue');
        }
    }

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.className = 'delete-btn';

    // Event listeners
    checkbox.addEventListener('change', () => {
        todo.completed = checkbox.checked;
        li.classList.toggle('completed');
        saveTodos();
    });

    textContainer.addEventListener('blur', () => {
        todo.text = textContainer.textContent.trim();
        saveTodos();
    });

    textContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            textContainer.blur();
        }
    });

    deleteBtn.addEventListener('click', () => {
        li.classList.add('slide-out');
        setTimeout(() => {
            todos.splice(index, 1);
            saveTodos();
            renderTodos();
        }, 300);
    });

    // Drag and drop handlers
    li.addEventListener('dragstart', () => {
        li.classList.add('dragging');
    });

    li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        updateTodoOrder();
    });

    // Assemble the todo item
    const contentDiv = document.createElement('div');
    contentDiv.className = 'todo-content';
    contentDiv.appendChild(priorityDot);
    contentDiv.appendChild(checkbox);
    contentDiv.appendChild(textContainer);
    if (todo.dueDate) contentDiv.appendChild(dueDate);

    li.appendChild(contentDiv);
    li.appendChild(deleteBtn);

    return li;
}

function filterTodos(todos) {
    switch (currentFilter) {
        case 'active':
            return todos.filter(todo => !todo.completed);
        case 'completed':
            return todos.filter(todo => todo.completed);
        default:
            return todos;
    }
}

function sortTodos(todos) {
    return [...todos].sort((a, b) => {
        switch (currentSort) {
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'date':
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'name':
                return a.text.localeCompare(b.text);
            default:
                return 0;
        }
    });
}

function renderTodos() {
    list.innerHTML = '';
    const filteredTodos = filterTodos(todos);
    const sortedTodos = sortTodos(filteredTodos);
    
    sortedTodos.forEach((todo, index) => {
        const node = createNode(todo, index);
        list.appendChild(node);
    });
}

function addTodo() {
    const text = input.value.trim();
    if (text === '') return;

    const todo = {
        text,
        completed: false,
        priority: prioritySelect.value,
        dueDate: dueDateInput.value || null,
        created: new Date().toISOString()
    };

    todos.push(todo);
    input.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'low';
    saveTodos();
    renderTodos();
}

// Event Listeners
addBtn.addEventListener('click', addTodo);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

themeToggle.addEventListener('click', toggleTheme);

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        renderTodos();
    });
});

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTodos();
});

// Drag and drop for list
list.addEventListener('dragover', e => {
    e.preventDefault();
    const draggingItem = list.querySelector('.dragging');
    const siblings = [...list.querySelectorAll('.todo-item:not(.dragging)')];
    const nextSibling = siblings.find(sibling => {
        const box = sibling.getBoundingClientRect();
        return e.clientY <= box.top + box.height / 2;
    });
    
    list.insertBefore(draggingItem, nextSibling);
});

// Update todo order after drag and drop
function updateTodoOrder() {
    const items = [...list.children];
    const newTodos = items.map(item => {
        const index = Array.from(list.children).indexOf(item);
        return todos[index];
    });
    todos.length = 0;
    todos.push(...newTodos);
    saveTodos();
}

// Initial render of todos on page load
renderTodos();