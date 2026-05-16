(async function () {
  // ── Modules ──
  const timer = new PomodoroTimer();
  const taskMgr = new TaskManager(storage);
  const statsMgr = new StatsManager(storage);

  // ── Elements ──
  const $ = (sel) => document.querySelector(sel);
  const timerTime = $('#timer-time');
  const timerState = $('#timer-state');
  const timerProgress = $('#timer-progress');
  const pomodoroDots = $('#pomodoro-dots').children;
  const btnStart = $('#btn-start');
  const btnReset = $('#btn-reset');
  const btnSkip = $('#btn-skip');
  const taskInput = $('#task-input');
  const taskList = $('#task-list');
  const statsChart = $('#stats-chart');
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');

  const CIRCUMFERENCE = 2 * Math.PI * 90; // 565.48

  // ── Init ──
  async function init() {
    const settings = await storage.getSettings();
    timer.updateSettings(settings);
    await taskMgr.load();
    await statsMgr.load();

    // Apply saved theme
    const theme = await window.api.app.getTheme();
    document.body.setAttribute('data-theme', theme);
    $('#setting-theme').checked = theme === 'dark';

    // Apply saved settings to UI
    $('#setting-work').value = settings.workDuration;
    $('#setting-short').value = settings.shortBreakDuration;
    $('#setting-long').value = settings.longBreakDuration;
    $('#setting-interval').value = settings.longBreakInterval;
    $('#setting-sound').checked = settings.soundEnabled;

    // Auto launch
    const autoLaunch = await window.api.app.getAutoLaunch();
    $('#setting-autostart').checked = autoLaunch;

    renderTimer(timer.getState());
    renderTasks();
    renderStats();
    updateTimeDisplay(settings.workDuration * 60);
  }

  // ── Timer Callbacks ──
  timer.onTick = (state) => {
    renderTimer(state);
  };

  timer.onStateChange = (state) => {
    renderTimer(state);
    updateStartButton(state);
  };

  timer.onComplete = async (type, count) => {
    if (type === 'work') {
      await statsMgr.recordPomodoro();
      await taskMgr.incrementPomodoro();
      renderStats();
      renderTasks();
    }
  };

  // ── Timer Rendering ──
  function renderTimer(state) {
    updateTimeDisplay(state.remainingSeconds);
    updateProgress(state.progress);
    updateDots(state.pomodoroCount);
    updateBodyMode(state.state);

    const stateTexts = {
      idle: '准备开始',
      work: '专注中',
      shortBreak: '短休息',
      longBreak: '长休息',
      paused: '已暂停',
    };
    timerState.textContent = stateTexts[state.state] || '';
    timerState.className = 'timer-state' + (state.state === 'work' ? ' working' : '');
  }

  function updateTimeDisplay(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    timerTime.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateProgress(progress) {
    const offset = CIRCUMFERENCE * (1 - progress);
    timerProgress.style.strokeDashoffset = offset;
  }

  function updateDots(count) {
    for (let i = 0; i < 4; i++) {
      pomodoroDots[i].classList.toggle('active', i < (count % 4 || (count > 0 && count % 4 === 0 ? 4 : 0)));
    }
    // Show completed cycle dots
    const cycleCount = count % 4;
    for (let i = 0; i < 4; i++) {
      if (count > 0 && cycleCount === 0) {
        pomodoroDots[i].classList.add('active');
      } else {
        pomodoroDots[i].classList.toggle('active', i < cycleCount);
      }
    }
  }

  function updateBodyMode(state) {
    const isBreak = state === 'shortBreak' || state === 'longBreak';
    document.body.classList.toggle('break-mode', isBreak);
  }

  function updateStartButton(state) {
    if (state.state === 'idle') {
      btnStart.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
    } else if (state.state === 'paused') {
      btnStart.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>';
    } else {
      btnStart.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
    }
  }

  // ── Tasks Rendering ──
  function renderTasks() {
    const tasks = taskMgr.getAll();
    taskList.innerHTML = '';

    if (tasks.length === 0) {
      taskList.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:13px;">暂无任务，添加一个开始吧</div>';
      return;
    }

    tasks.forEach((task) => {
      const div = document.createElement('div');
      div.className = 'task-item' +
        (task.completed ? ' completed' : '') +
        (taskMgr.activeTaskId === task.id ? ' active-task' : '');

      div.innerHTML = `
        <div class="task-check ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
        <span class="task-name" data-id="${task.id}" title="${task.name}">${task.name}</span>
        ${task.pomodoros > 0 ? `<span class="task-pomodoros">🍅 ${task.pomodoros}</span>` : ''}
        <button class="task-delete" data-id="${task.id}">✕</button>
      `;
      taskList.appendChild(div);
    });
  }

  // ── Stats Rendering ──
  function renderStats() {
    const today = statsMgr.getToday();
    const week = statsMgr.getThisWeek();
    const month = statsMgr.getThisMonth();
    const total = statsMgr.getTotal();

    $('#stat-today').textContent = today;
    $('#stat-week').textContent = week;
    $('#stat-total').textContent = total;

    $('#detail-today').textContent = `${today} 个番茄`;
    $('#detail-week').textContent = `${week} 个番茄`;
    $('#detail-month').textContent = `${month} 个番茄`;
    $('#detail-total').textContent = `${total} 个番茄`;

    drawChart();
  }

  function drawChart() {
    const data = statsMgr.getLast7Days();
    const canvas = statsChart;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const padding = { top: 20, right: 10, bottom: 30, left: 30 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const maxVal = Math.max(...data.map((d) => d.value), 1);
    const barWidth = chartW / data.length * 0.6;
    const gap = chartW / data.length;

    // Get theme colors
    const style = getComputedStyle(document.documentElement);
    const accentColor = style.getPropertyValue('--accent').trim();
    const textMuted = style.getPropertyValue('--text-muted').trim();
    const borderColor = style.getPropertyValue('--border').trim();

    // Draw grid lines
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
    }

    // Draw bars
    data.forEach((d, i) => {
      const x = padding.left + gap * i + (gap - barWidth) / 2;
      const barH = (d.value / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      // Bar
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Value on top
      if (d.value > 0) {
        ctx.fillStyle = textMuted;
        ctx.font = '11px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText(d.value, x + barWidth / 2, y - 6);
      }

      // Day label
      ctx.fillStyle = textMuted;
      ctx.font = '11px Segoe UI';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + barWidth / 2, h - 8);
    });
  }

  // ── Event Listeners ──

  // Title bar
  $('#btn-minimize').addEventListener('click', () => window.api.window.minimize());
  $('#btn-close').addEventListener('click', () => window.api.window.close());

  // Timer controls
  btnStart.addEventListener('click', () => {
    const state = timer.getState().state;
    if (state === 'idle' || state === 'paused') {
      timer.start();
    } else {
      timer.pause();
    }
  });

  btnReset.addEventListener('click', () => timer.reset());
  btnSkip.addEventListener('click', () => timer.skip());

  // Tabs
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#panel-${tab.dataset.tab}`).classList.add('active');
      if (tab.dataset.tab === 'stats') drawChart();
    });
  });

  // Tasks
  $('#btn-add-task').addEventListener('click', async () => {
    const name = taskInput.value.trim();
    if (name) {
      await taskMgr.add(name);
      taskInput.value = '';
      renderTasks();
    }
  });

  taskInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const name = taskInput.value.trim();
      if (name) {
        await taskMgr.add(name);
        taskInput.value = '';
        renderTasks();
      }
    }
  });

  taskList.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains('task-check')) {
      await taskMgr.toggleComplete(id);
      renderTasks();
    } else if (target.classList.contains('task-delete')) {
      await taskMgr.delete(id);
      renderTasks();
    } else if (target.classList.contains('task-name')) {
      // Set as active task
      taskMgr.setActive(taskMgr.activeTaskId === id ? null : id);
      renderTasks();
    }
  });

  // Settings
  async function saveSettings() {
    const settings = {
      workDuration: parseInt($('#setting-work').value) || 25,
      shortBreakDuration: parseInt($('#setting-short').value) || 5,
      longBreakDuration: parseInt($('#setting-long').value) || 15,
      longBreakInterval: parseInt($('#setting-interval').value) || 4,
      soundEnabled: $('#setting-sound').checked,
    };
    await storage.setSettings(settings);
    timer.updateSettings(settings);
    return settings;
  }

  ['setting-work', 'setting-short', 'setting-long', 'setting-interval'].forEach((id) => {
    $(`#${id}`).addEventListener('change', async () => {
      const settings = await saveSettings();
      // If idle, update the display
      if (timer.getState().state === 'idle') {
        updateTimeDisplay(settings.workDuration * 60);
      }
    });
  });

  $('#setting-sound').addEventListener('change', () => saveSettings());

  $('#setting-autostart').addEventListener('change', async (e) => {
    await window.api.app.setAutoLaunch(e.target.checked);
  });

  $('#setting-theme').addEventListener('change', async (e) => {
    const theme = e.target.checked ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);
    await storage.set('theme', theme);
  });

  // ── Start ──
  init();
})();
