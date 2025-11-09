// Sound utility for casino games
class SoundManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.3 // Default volume
      this.masterGain.connect(this.audioContext.destination)
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || !this.masterGain || !this.enabled) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.masterGain)

    oscillator.frequency.value = frequency
    oscillator.type = type
    gainNode.gain.value = volume

    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  private playMultiTone(frequencies: number[], duration: number, type: OscillatorType = 'sine', volume: number = 0.2) {
    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, duration, type, volume)
      }, index * 50)
    })
  }

  // Spin wheel sounds
  spinStart() {
    if (!this.enabled) return
    this.playTone(400, 0.1, 'square', 0.2)
    setTimeout(() => this.playTone(600, 0.1, 'square', 0.2), 100)
  }

  spinTick() {
    if (!this.enabled) return
    this.playTone(800, 0.05, 'square', 0.15)
  }

  spinWin() {
    if (!this.enabled) return
    this.playMultiTone([523, 659, 784, 1047], 0.3, 'sine', 0.25)
  }

  spinLose() {
    if (!this.enabled) return
    this.playMultiTone([400, 350, 300, 250], 0.2, 'sawtooth', 0.2)
  }

  // Crash game sounds
  planeStart() {
    if (!this.enabled) return
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        this.playTone(200 + i * 20, 0.1, 'sawtooth', 0.15)
      }, i * 100)
    }
  }

  planeFlying() {
    if (!this.enabled) return
    this.playTone(300, 0.05, 'sawtooth', 0.1)
  }

  cashOut() {
    if (!this.enabled) return
    this.playMultiTone([659, 784, 1047], 0.2, 'sine', 0.25)
  }

  planeCrash() {
    if (!this.enabled) return
    this.playTone(100, 0.5, 'sawtooth', 0.3)
    setTimeout(() => {
      this.playTone(80, 0.3, 'sawtooth', 0.25)
    }, 200)
  }

  countdown() {
    if (!this.enabled) return
    this.playTone(600, 0.1, 'sine', 0.2)
  }

  // Rolling ball sounds
  ballRoll() {
    if (!this.enabled) return
    this.playTone(200, 0.1, 'sine', 0.15)
  }

  ballLand() {
    if (!this.enabled) return
    this.playTone(300, 0.2, 'sine', 0.2)
  }

  // VIP racing sounds
  engineStart() {
    if (!this.enabled) return
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        this.playTone(150 + i * 30, 0.08, 'sawtooth', 0.12)
      }, i * 50)
    }
  }

  engineRev() {
    if (!this.enabled) return
    this.playTone(400, 0.05, 'sawtooth', 0.1)
  }

  collision() {
    if (!this.enabled) return
    this.playTone(150, 0.4, 'sawtooth', 0.3)
    setTimeout(() => {
      this.playTone(100, 0.3, 'square', 0.25)
    }, 100)
  }

  raceWin() {
    if (!this.enabled) return
    this.playMultiTone([523, 659, 784, 1047, 1319], 0.3, 'sine', 0.25)
  }

  // General sounds
  buttonClick() {
    if (!this.enabled) return
    this.playTone(600, 0.05, 'sine', 0.15)
  }

  betPlaced() {
    if (!this.enabled) return
    this.playTone(800, 0.1, 'sine', 0.2)
  }

  error() {
    if (!this.enabled) return
    this.playTone(200, 0.3, 'sawtooth', 0.2)
  }

  // Volume control
  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  toggleSound() {
    this.enabled = !this.enabled
    return this.enabled
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled() {
    return this.enabled
  }
}

export const soundManager = new SoundManager()
