(function () {
  const storageKey = 'project-nexus.tasks.v1';
  const themeKey = 'project-nexus.theme.v1';

  const state = {
    filter: 'all',
    query: '',
    sort: 'asc',
    overlay: true,
  };

  const els = {
    list: document.getElementById('task-list'),
    empty: document.getElementById('empty-state'),
    template: document.getElementById('task-template'),
    total: document.getElementById('stat-total'),
    today: document.getElementById('stat-today'),
    done: document.getElementById('stat-done'),
    focus: document.getElementById('stat-focus'),
    focusMeter: document.getElementById('focus-meter'),
    search: document.getElementById('search'),
    sort: document.getElementById('sort'),
    form: document.getElementById('task-form'),
    id: document.getElementById('task-id'),
    name: document.getElementById('task-name'),
    desc: document.getElementById('task-desc'),
    priority: document.getElementById('task-priority'),
    category: document.getElementById('task-category'),
    due: document.getElementById('task-due'),
    cancel: document.getElementById('cancel-edit'),
    seed: document.getElementById('seed'),
    clear: document.getElementById('clear-complete'),
    deck: document.getElementById('card-deck'),
    deckCard: document.querySelector('#card-deck .deck-card'),
    deckInner: document.querySelector('#card-deck .deck-inner'),
    deckTitle: document.getElementById('deck-title'),
    deckStatus: document.getElementById('deck-status'),
    deckBody: document.getElementById('deck-body'),
    deckNext: document.getElementById('deck-next'),
    deckToggle: document.getElementById('deck-toggle'),
    deckBackdrop: document.querySelector('#card-deck [data-close]'),
    themeSelect: document.getElementById('theme-select'),
    overlayToggle: document.getElementById('holiday-overlay'),
    tabs: Array.from(document.querySelectorAll('.tab')),
  };

  let tasks = load();
  let deckOrder = [];
  let deckIndex = 0;
  let deckAnimating = false;

  function load() {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (error) {
      console.warn('Failed to load tasks', error);
      return [];
    }
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }

  function hydrateTheme() {
    try {
      const saved = JSON.parse(localStorage.getItem(themeKey) || '{}');
      if (saved.theme) {
        document.documentElement.setAttribute('data-theme', saved.theme);
        els.themeSelect.value = saved.theme;
      }
      if (typeof saved.overlay === 'boolean') {
        state.overlay = saved.overlay;
        els.overlayToggle.checked = saved.overlay;
      }
    } catch (error) {
      console.warn('Unable to load theme', error);
    }
    applyOverlay();
  }

  function persistTheme() {
    localStorage.setItem(themeKey, JSON.stringify({
      theme: document.documentElement.getAttribute('data-theme'),
      overlay: state.overlay,
    }));
  }

  function applyOverlay() {
    document.documentElement.setAttribute('data-overlay', state.overlay ? 'on' : 'off');
    els.overlayToggle.checked = !!state.overlay;
  }

  function normalizeDue(value) {
    if (!value) return undefined;
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return undefined;
    return new Date(parsed).toISOString();
  }

  function toLocalInput(value) {
    if (!value) return '';
    const date = new Date(value);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function defaultDue() {
    const date = new Date(Date.now() + 3600 * 1000);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  }

  function sortTasks(list) {
    const direction = state.sort === 'asc' ? 1 : -1;
    return list.slice().sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const ad = a.due ? Date.parse(a.due) : Number.POSITIVE_INFINITY;
      const bd = b.due ? Date.parse(b.due) : Number.POSITIVE_INFINITY;
      if (ad === bd) return a.createdAt - b.createdAt;
      return (ad - bd) * direction;
    });
  }

  function filterTasks(list) {
    const now = new Date();
    return list.filter((task) => {
      switch (state.filter) {
        case 'done':
          return task.done;
        case 'pending':
          return !task.done;
        case 'today':
          if (!task.due) return false;
          return new Date(task.due).toDateString() === now.toDateString();
        case 'upcoming':
          if (!task.due) return false;
          return new Date(task.due).getTime() > now.getTime();
        default:
          return true;
      }
    }).filter((task) => {
      if (!state.query) return true;
      const haystack = `${task.name} ${task.desc} ${task.category}`.toLowerCase();
      return haystack.includes(state.query);
    });
  }

  function render() {
    const wasOpen = els.deck.classList.contains('active');
    const previouslySelected = wasOpen ? deckOrder[deckIndex] : null;
    const filtered = filterTasks(sortTasks(tasks));
    els.list.innerHTML = '';
    deckOrder = filtered.map((task) => task.id);

    filtered.forEach((task) => {
      const node = els.template.content.firstElementChild.cloneNode(true);
      const title = node.querySelector('.task-title');
      const desc = node.querySelector('.task-desc');
      const meta = node.querySelector('.task-meta');
      const toggle = node.querySelector('[data-toggle]');
      const edit = node.querySelector('[data-edit]');
      const del = node.querySelector('[data-delete]');
      const open = node.querySelector('[data-open]');

      title.textContent = task.name + (task.done ? ' ✅' : '');
      desc.textContent = task.desc || 'No notes yet.';
      const due = task.due ? new Date(task.due).toLocaleString() : 'No due date';
      meta.textContent = `${task.priority} • ${task.category || 'general'} • ${due}`;
      toggle.textContent = task.done ? 'Mark pending' : 'Mark done';

      toggle.addEventListener('click', () => toggleTask(task.id));
      edit.addEventListener('click', () => editTask(task.id));
      del.addEventListener('click', () => deleteTask(task.id));
      open.addEventListener('click', () => openDeck(task.id));

    els.list.appendChild(node);
    });

    els.empty.style.display = filtered.length ? 'none' : 'block';
    updateStats();

    if (wasOpen) {
      if (!deckOrder.length) {
        closeDeck();
      } else {
        const nextIndex = previouslySelected ? deckOrder.indexOf(previouslySelected) : 0;
        deckIndex = nextIndex >= 0 ? nextIndex : 0;
        updateDeck();
      }
    }
  }

  function updateStats() {
    const total = tasks.length;
    const done = tasks.filter((task) => task.done).length;
    const today = tasks.filter((task) => {
      if (!task.due) return false;
      return new Date(task.due).toDateString() === new Date().toDateString();
    }).length;
    const focus = total ? Math.round((done / total) * 100) : 0;

    els.total.textContent = total;
    els.done.textContent = done;
    els.today.textContent = today;
    els.focus.textContent = `${focus}%`;
    els.focusMeter.style.width = `${focus}%`;
  }

  function resetForm() {
    els.id.value = '';
    els.name.value = '';
    els.desc.value = '';
    els.priority.value = 'Medium';
    els.category.value = '';
    els.due.value = defaultDue();
    els.name.focus();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const payload = {
      name: els.name.value.trim(),
      desc: els.desc.value.trim(),
      priority: els.priority.value,
      category: els.category.value.trim(),
      due: normalizeDue(els.due.value),
    };
    if (!payload.name) return;

    if (els.id.value) {
      const id = els.id.value;
      tasks = tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              ...payload,
              done: task.done,
              updatedAt: Date.now(),
            }
          : task
      );
    } else {
      tasks.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 10),
        ...payload,
        done: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    save();
    render();
    resetForm();
  }

  function toggleTask(id) {
    tasks = tasks.map((task) =>
      task.id === id
        ? { ...task, done: !task.done, updatedAt: Date.now(), completedAt: !task.done ? Date.now() : undefined }
        : task
    );
    save();
    render();
    updateDeckAfterToggle(id);
  }

  function editTask(id) {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    els.id.value = task.id;
    els.name.value = task.name;
    els.desc.value = task.desc;
    els.priority.value = task.priority;
    els.category.value = task.category;
    els.due.value = toLocalInput(task.due);
    els.name.focus();
  }

  function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    tasks = tasks.filter((task) => task.id !== id);
    save();
    render();
    if (deckOrder.includes(id)) closeDeck();
  }

  function clearCompleted() {
    tasks = tasks.filter((task) => !task.done);
    save();
    render();
  }

  function seedDemo() {
    if (tasks.length) return;
    const now = Date.now();
    const future = (hours) => new Date(now + hours * 3600 * 1000).toISOString();
    tasks = [
      {
        id: 'seed-algorithms',
        name: 'Study algorithms',
        desc: '30 minutes of graph drills.',
        priority: 'High',
        category: 'school',
        due: future(3),
        done: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'seed-polish',
        name: 'Polish card flip',
        desc: 'Tune the Pokémon deck transitions.',
        priority: 'Medium',
        category: 'design',
        due: future(8),
        done: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'seed-summon',
        name: 'Summon pumpkins',
        desc: 'Lay out the lantern path.',
        priority: 'Low',
        category: 'holiday',
        due: future(24),
        done: false,
        createdAt: now,
        updatedAt: now,
      },
    ];
    save();
    render();
  }

  function attachFilters() {
    els.tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        els.tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.filter = tab.dataset.filter;
        render();
      });
    });

    els.search.addEventListener('input', (event) => {
      state.query = event.target.value.trim().toLowerCase();
      render();
    });

    els.sort.addEventListener('change', (event) => {
      state.sort = event.target.value;
      render();
    });
  }

  function attachForm() {
    els.form.addEventListener('submit', handleSubmit);
    els.cancel.addEventListener('click', resetForm);
    els.seed.addEventListener('click', seedDemo);
    els.clear.addEventListener('click', clearCompleted);
  }

  function attachThemeControls() {
    els.themeSelect.addEventListener('change', (event) => {
      const value = event.target.value;
      document.documentElement.setAttribute('data-theme', value);
      persistTheme();
    });

    els.overlayToggle.addEventListener('change', (event) => {
      state.overlay = event.target.checked;
      applyOverlay();
      persistTheme();
    });
  }

  function openDeck(id) {
    if (!deckOrder.length) return;
    const index = deckOrder.indexOf(id);
    deckIndex = index >= 0 ? index : 0;
    updateDeck();
    els.deck.classList.add('active');
    els.deck.setAttribute('aria-hidden', 'false');
    els.deckCard.focus();
    document.addEventListener('keydown', handleDeckKeys);
  }

  function closeDeck() {
    els.deck.classList.remove('active');
    els.deck.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', handleDeckKeys);
    deckAnimating = false;
    els.deckInner.classList.remove('flip-next', 'flip-prev');
  }

  function currentTask() {
    const id = deckOrder[deckIndex];
    return tasks.find((task) => task.id === id);
  }

  function nextTask(direction = 1) {
    if (!deckOrder.length) return undefined;
    const nextIndex = (deckIndex + direction + deckOrder.length) % deckOrder.length;
    const id = deckOrder[nextIndex];
    return tasks.find((task) => task.id === id);
  }

  function updateDeck() {
    const task = currentTask();
    if (!task) {
      closeDeck();
      return;
    }
    els.deckTitle.textContent = task.name;
    els.deckStatus.textContent = task.done ? 'Completed' : 'Active';
    els.deckToggle.textContent = task.done ? 'Mark pending' : 'Mark done';
    const due = task.due ? new Date(task.due).toLocaleString() : 'No due date';
    els.deckBody.innerHTML = `
      <strong>${task.name}${task.done ? ' ✅' : ''}</strong>
      <span>${task.desc || 'No notes yet.'}</span>
      <span>${task.priority} • ${task.category || 'general'} • ${due}</span>
    `;
    const upcoming = nextTask();
    if (upcoming) {
      const nextDue = upcoming.due ? new Date(upcoming.due).toLocaleString() : 'No due date';
      els.deckNext.innerHTML = `
        <strong>${upcoming.name}${upcoming.done ? ' ✅' : ''}</strong>
        <span>${upcoming.priority} • ${upcoming.category || 'general'} • ${nextDue}</span>
      `;
    } else {
      els.deckNext.innerHTML = '<span>No other tasks in this view.</span>';
    }
  }

  function flipDeck(direction) {
    if (deckAnimating || deckOrder.length < 2) return;
    deckAnimating = true;
    els.deckInner.classList.remove('flip-next', 'flip-prev');
    requestAnimationFrame(() => {
      els.deckInner.classList.add(direction === 1 ? 'flip-next' : 'flip-prev');
    });
    setTimeout(() => {
      deckIndex = (deckIndex + direction + deckOrder.length) % deckOrder.length;
      els.deckInner.classList.remove('flip-next', 'flip-prev');
      updateDeck();
      deckAnimating = false;
    }, 680);
  }

  function updateDeckAfterToggle(id) {
    if (!els.deck.classList.contains('active')) return;
    if (!deckOrder.includes(id)) {
      deckOrder = filterTasks(sortTasks(tasks)).map((task) => task.id);
      if (!deckOrder.length) {
        closeDeck();
        return;
      }
      deckIndex = 0;
    }
    updateDeck();
  }

  function handleDeckKeys(event) {
    if (!els.deck.classList.contains('active')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDeck();
      return;
    }
    if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      flipDeck(1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      flipDeck(-1);
    }
  }

  function registerDeckControls() {
    els.deckBackdrop.addEventListener('click', closeDeck);
    els.deckToggle.addEventListener('click', () => {
      const task = currentTask();
      if (!task) return;
      toggleTask(task.id);
      updateDeck();
    });
    els.deckCard.addEventListener('click', () => flipDeck(1));
  }

  function attachGlobalShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.key === '/' && !event.target.closest('input, textarea')) {
        event.preventDefault();
        els.search.focus();
        els.search.select();
      }
      if ((event.key === 'n' || event.key === 'N') && !event.target.closest('input, textarea')) {
        event.preventDefault();
        els.name.focus();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        if (document.activeElement && document.activeElement.closest('form') === els.form) {
          event.preventDefault();
          els.form.requestSubmit();
        }
      }
    });
  }

  hydrateTheme();
  attachFilters();
  attachForm();
  attachThemeControls();
  registerDeckControls();
  attachGlobalShortcuts();
  resetForm();
  render();
})();
