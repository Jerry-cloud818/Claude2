class PomodoroTimer {
  constructor() {
    this.state = 'idle'; // idle, work, shortBreak, longBreak, paused
    this.previousState = null;
    this.totalSeconds = 0;
    this.remainingSeconds = 0;
    this.interval = null;
    this.pomodoroCount = 0;
    this.settings = {
      workDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      longBreakInterval: 4,
      soundEnabled: true,
    };
    this.onTick = null;
    this.onStateChange = null;
    this.onComplete = null;
    this.audioCtx = null;
  }

  getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioCtx;
  }

  playSound(type) {
    if (!this.settings.soundEnabled) return;
    const ctx = this.getAudioContext();

    for (let i = 0; i < 10; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime + i * 0.25;

      if (type === 'work-end') {
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.setValueAtTime(1100, t + 0.08);
      } else {
        osc.frequency.setValueAtTime(523, t);
        osc.frequency.setValueAtTime(659, t + 0.08);
      }

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
  }

  start() {
    if (this.state === 'idle') {
      this.pomodoroCount = 0;
      this.startWork();
    } else if (this.state === 'paused') {
      this.state = this.previousState;
      this._startInterval();
      if (this.onStateChange) this.onStateChange(this.getState());
    } else if (!this.interval) {
      // Resumed after skip — timer is in work/break but not running
      this._startInterval();
      if (this.onStateChange) this.onStateChange(this.getState());
    }
  }

  startWork() {
    this.state = 'work';
    this.totalSeconds = this.settings.workDuration * 60;
    this.remainingSeconds = this.totalSeconds;
    this._startInterval();
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  startShortBreak() {
    this.state = 'shortBreak';
    this.totalSeconds = this.settings.shortBreakDuration * 60;
    this.remainingSeconds = this.totalSeconds;
    this._startInterval();
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  startLongBreak() {
    this.state = 'longBreak';
    this.totalSeconds = this.settings.longBreakDuration * 60;
    this.remainingSeconds = this.totalSeconds;
    this._startInterval();
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  pause() {
    if (this.state === 'work' || this.state === 'shortBreak' || this.state === 'longBreak') {
      this.previousState = this.state;
      this.state = 'paused';
      this._stopInterval();
      if (this.onStateChange) this.onStateChange(this.getState());
    }
  }

  reset() {
    this._stopInterval();
    this.state = 'idle';
    this.remainingSeconds = 0;
    this.totalSeconds = 0;
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  skip() {
    this._stopInterval();
    // Cycle: work → shortBreak → longBreak → work
    const s = this.state === 'paused' ? this.previousState : this.state;
    if (s === 'work') {
      this.state = 'shortBreak';
      this.totalSeconds = this.settings.shortBreakDuration * 60;
    } else if (s === 'shortBreak') {
      this.state = 'longBreak';
      this.totalSeconds = this.settings.longBreakDuration * 60;
    } else {
      this.state = 'work';
      this.totalSeconds = this.settings.workDuration * 60;
    }
    this.remainingSeconds = this.totalSeconds;
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  _startInterval() {
    this._stopInterval();
    this.interval = setInterval(() => {
      this.remainingSeconds--;
      if (this.onTick) this.onTick(this.getState());
      if (this.remainingSeconds <= 0) {
        this._onTimerComplete();
      }
    }, 1000);
  }

  _stopInterval() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  _onTimerComplete() {
    this._stopInterval();
    const completedState = this.state;

    // Every completion: count +1, sound, stay in current mode, reset time
    this.pomodoroCount++;
    if (completedState === 'work') {
      this.playSound('work-end');
    } else {
      this.playSound('break-end');
    }
    if (this.onComplete) this.onComplete(completedState, this.pomodoroCount);

    // Reset time for current mode, stay in current state
    if (completedState === 'work') {
      this.totalSeconds = this.settings.workDuration * 60;
    } else if (completedState === 'shortBreak') {
      this.totalSeconds = this.settings.shortBreakDuration * 60;
    } else {
      this.totalSeconds = this.settings.longBreakDuration * 60;
    }
    this.remainingSeconds = this.totalSeconds;
    if (this.onStateChange) this.onStateChange(this.getState());
  }

  getState() {
    return {
      state: this.state,
      remainingSeconds: this.remainingSeconds,
      totalSeconds: this.totalSeconds,
      pomodoroCount: this.pomodoroCount,
      progress: this.totalSeconds > 0 ? 1 - (this.remainingSeconds / this.totalSeconds) : 0,
      running: !!this.interval,
    };
  }
}
