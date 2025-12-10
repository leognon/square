// Audio controller using p5.sound
class AudioController {
  constructor(audioPath, sharedDeathSound) {
    this.audioPath = audioPath;
    this.sound = null;
    this.deathSound = sharedDeathSound;
    this.paused = true;
    this.muted = false;
    this.latencyOffset = 0;

    // Load level music (must be done with a callback since not in preload)
    this.sound = loadSound(audioPath);

    // Measure audio latency and compensate
    this.measureLatency();
  }

  measureLatency() {
    // Get the Web Audio API context from p5.sound
    const audioContext = getAudioContext();
    if (audioContext) {
      // Use outputLatency if available (more accurate), otherwise baseLatency
      this.latencyOffset = audioContext.outputLatency || audioContext.baseLatency || 0;
    }
  }

  getTime() {
    if (this.sound && this.sound.isPlaying()) {
      // Compensate for audio output latency
      return this.sound.currentTime() + this.latencyOffset;
    }
    return 0;
  }

  toggle() {
    if (this.paused) {
      this.sound.play();
      this.paused = false;
    } else {
      this.sound.pause();
      this.paused = true;
    }
  }

  reset() {
    if (this.sound.isPlaying()) {
      this.sound.stop();
    }
    this.paused = true;
  }

  skip(seconds = 10) {
    const currentTime = this.getTime();
    const newTime = currentTime + seconds;
    if (newTime < this.sound.duration()) {
      this.sound.jump(newTime);
    }
  }

  playDeathSound() {
    if (this.deathSound) {
      // Play death sound regardless of mute state (it's a separate effect)
      this.deathSound.play();
    }
  }

  mute() {
    this.muted = true;
    if (this.sound) {
      this.sound.setVolume(0);
    }
  }

  unmute() {
    this.muted = false;
    if (this.sound) {
      this.sound.setVolume(1);
    }
  }

  isPaused() {
    return this.paused;
  }
}
