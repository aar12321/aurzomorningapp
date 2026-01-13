/**
 * Sound Service
 * Manages sound effects and audio feedback
 */

class SoundManager {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Check if sounds are enabled in localStorage
    const saved = localStorage.getItem('soundsEnabled');
    this.enabled = saved !== 'false';
    
    const savedVolume = localStorage.getItem('soundVolume');
    if (savedVolume) {
      this.volume = parseFloat(savedVolume);
    }
  }

  /**
   * Create and cache a sound
   */
  private createSound(name: string, url?: string): HTMLAudioElement {
    if (this.sounds.has(name)) {
      return this.sounds.get(name)!;
    }

    // For now, we'll use Web Audio API to generate simple tones
    // In production, you'd load actual sound files
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Store reference (simplified - in production use actual audio files)
    const audio = new Audio();
    audio.volume = this.volume;
    this.sounds.set(name, audio);
    return audio;
  }

  /**
   * Play a sound effect
   */
  play(name: string, volume?: number): void {
    if (!this.enabled) return;

    try {
      const sound = this.createSound(name);
      if (volume !== undefined) {
        sound.volume = volume;
      } else {
        sound.volume = this.volume;
      }
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore play errors (user interaction required, etc.)
      });
    } catch (error) {
      // Silently fail if audio is not available
    }
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    localStorage.setItem('soundsEnabled', String(enabled));
  }

  /**
   * Set volume (0-1)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundVolume', String(this.volume));
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }
}

// Singleton instance
export const soundManager = new SoundManager();

/**
 * Sound effect names
 */
export const Sounds = {
  success: 'success',
  error: 'error',
  click: 'click',
  badge: 'badge',
  levelUp: 'levelUp',
  streak: 'streak',
  quizCorrect: 'quizCorrect',
  quizWrong: 'quizWrong',
  gameWin: 'gameWin',
  gameLose: 'gameLose'
};

/**
 * Play success sound
 */
export function playSuccess(): void {
  soundManager.play(Sounds.success);
}

/**
 * Play error sound
 */
export function playError(): void {
  soundManager.play(Sounds.error);
}

/**
 * Play click sound
 */
export function playClick(): void {
  soundManager.play(Sounds.click, 0.2);
}

/**
 * Play badge unlock sound
 */
export function playBadge(): void {
  soundManager.play(Sounds.badge);
}

/**
 * Play level up sound
 */
export function playLevelUp(): void {
  soundManager.play(Sounds.levelUp);
}

/**
 * Play streak milestone sound
 */
export function playStreak(): void {
  soundManager.play(Sounds.streak);
}

/**
 * Play quiz correct answer sound
 */
export function playQuizCorrect(): void {
  soundManager.play(Sounds.quizCorrect, 0.3);
}

/**
 * Play quiz wrong answer sound
 */
export function playQuizWrong(): void {
  soundManager.play(Sounds.quizWrong, 0.3);
}

/**
 * Play game win sound
 */
export function playGameWin(): void {
  soundManager.play(Sounds.gameWin);
}

/**
 * Play game lose sound
 */
export function playGameLose(): void {
  soundManager.play(Sounds.gameLose);
}

