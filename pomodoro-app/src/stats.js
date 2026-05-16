class StatsManager {
  constructor(storage) {
    this.storage = storage;
    this.stats = {};
  }

  async load() {
    this.stats = await this.storage.getStats();
    return this.stats;
  }

  async save() {
    await this.storage.setStats(this.stats);
  }

  getDateKey(date = new Date()) {
    return date.toISOString().split('T')[0];
  }

  getWeekKey(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }

  getMonthKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  async recordPomodoro() {
    const day = this.getDateKey();
    if (!this.stats[day]) this.stats[day] = 0;
    this.stats[day]++;
    await this.save();
  }

  getToday() {
    return this.stats[this.getDateKey()] || 0;
  }

  getThisWeek() {
    const weekKey = this.getWeekKey();
    let total = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    for (let i = 0; i < 7; i++) {
      const key = this.getDateKey(d);
      total += this.stats[key] || 0;
      d.setDate(d.getDate() + 1);
    }
    return total;
  }

  getThisMonth() {
    const now = new Date();
    let total = 0;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      total += this.stats[this.getDateKey(date)] || 0;
    }
    return total;
  }

  getLast7Days() {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = this.getDateKey(d);
      const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
      data.push({
        label: dayNames[d.getDay()],
        value: this.stats[key] || 0,
      });
    }
    return data;
  }

  getTotal() {
    return Object.values(this.stats).reduce((sum, v) => sum + v, 0);
  }
}
