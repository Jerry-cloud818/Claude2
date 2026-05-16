const storage = {
  async get(key, defaultValue) {
    return window.api.store.get(key, defaultValue);
  },
  async set(key, value) {
    return window.api.store.set(key, value);
  },
  async delete(key) {
    return window.api.store.delete(key);
  },

  async getTasks() {
    return this.get('tasks', []);
  },
  async setTasks(tasks) {
    return this.set('tasks', tasks);
  },
  async getStats() {
    return this.get('stats', { daily: {}, weekly: {}, monthly: {} });
  },
  async setStats(stats) {
    return this.set('stats', stats);
  },
  async getSettings() {
    return this.get('settings', {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      soundEnabled: true,
      autoStartBreaks: false,
      autoStartWork: false,
    });
  },
  async setSettings(settings) {
    return this.set('settings', settings);
  },
};
