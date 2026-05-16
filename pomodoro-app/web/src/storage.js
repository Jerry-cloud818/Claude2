const storage = {
  get(key, defaultValue) {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    try { return JSON.parse(raw); } catch { return defaultValue; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  delete(key) {
    localStorage.removeItem(key);
  },

  getTasks() { return this.get('tasks', []); },
  setTasks(tasks) { this.set('tasks', tasks); },
  getStats() { return this.get('stats', {}); },
  setStats(stats) { this.set('stats', stats); },
  getSettings() {
    return this.get('settings', {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      soundEnabled: true,
    });
  },
  setSettings(settings) { this.set('settings', settings); },
};
