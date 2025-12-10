// Audio controller using Web Audio API directly
class AudioController {
  constructor(audioPath, sharedDeathSound) {
    this.audioPath = audioPath;
    this.audio = new Audio(audioPath);
    this.deathAudio = sharedDeathSound;
    this.paused = true;
    this.muted = false;
    this.latencyOffset = 0;
    this.startTime = 0;
    this.pauseTime = 0;

    // Measure audio latency
    this.measureLatency();
  }

  measureLatency() {
    // Create audio context to measure latency
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
      const AudioContextClass = AudioContext || webkitAudioContext;
      const ctx = new AudioContextClass();
      this.latencyOffset = ctx.outputLatency || ctx.baseLatency || 0;
      ctx.close();
    }
  }

  getTime() {
    if (!this.paused && this.audio) {
      return this.audio.currentTime + this.latencyOffset;
    }
    return this.pauseTime;
  }

  toggle() {
    if (this.paused) {
      this.audio.play();
      this.paused = false;
    } else {
      this.pauseTime = this.audio.currentTime;
      this.audio.pause();
      this.paused = true;
    }
  }

  reset() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.paused = true;
    this.pauseTime = 0;
  }

  skip(seconds = 10) {
    const currentTime = this.getTime();
    const newTime = currentTime + seconds;
    if (newTime < this.audio.duration) {
      this.audio.currentTime = newTime;
    }
  }

  playDeathSound() {
    if (this.deathAudio) {
      // Clone and play to allow overlapping sounds
      const clone = this.deathAudio.cloneNode();
      clone.play();
    }
  }

  mute() {
    this.muted = true;
    if (this.audio) {
      this.audio.volume = 0;
    }
  }

  unmute() {
    this.muted = false;
    if (this.audio) {
      this.audio.volume = 1;
    }
  }

  isPaused() {
    return this.paused;
  }
}
