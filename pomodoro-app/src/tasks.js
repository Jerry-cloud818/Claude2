class TaskManager {
  constructor(storage) {
    this.storage = storage;
    this.tasks = [];
    this.activeTaskId = null;
  }

  async load() {
    this.tasks = await this.storage.getTasks();
    return this.tasks;
  }

  async save() {
    await this.storage.setTasks(this.tasks);
  }

  async add(name) {
    const task = {
      id: Date.now().toString(),
      name,
      completed: false,
      pomodoros: 0,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(task);
    await this.save();
    return task;
  }

  async toggleComplete(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      if (task.completed && this.activeTaskId === id) {
        this.activeTaskId = null;
      }
      await this.save();
    }
    return task;
  }

  async delete(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    if (this.activeTaskId === id) this.activeTaskId = null;
    await this.save();
  }

  async incrementPomodoro() {
    if (this.activeTaskId) {
      const task = this.tasks.find((t) => t.id === this.activeTaskId);
      if (task) {
        task.pomodoros++;
        await this.save();
        return task;
      }
    }
    return null;
  }

  setActive(id) {
    this.activeTaskId = id;
  }

  getActive() {
    return this.tasks.find((t) => t.id === this.activeTaskId);
  }

  getAll() {
    return this.tasks;
  }
}
