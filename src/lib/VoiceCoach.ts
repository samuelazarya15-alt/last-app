export class VoiceCoach {
  private name: string = '';
  private synth = window.speechSynthesis;
  private onSpeakStateChange: ((isSpeaking: boolean) => void) | null = null;
  private onMuteStateChange: ((isMuted: boolean) => void) | null = null;
  private isMuted: boolean = false; // Default to unmuted for better UX if user interacts
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private sfxVolume: number = 0.5;
  private musicVolume: number = 0.3;
  private bgMusic: HTMLAudioElement | null = null;

  private sfxUrls = {
    kick: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/squit.mp3',
    score: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/ping.mp3',
    wrong: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/alien_death.wav',
    pop: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/magical_get.wav',
    success: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/key.wav',
    click: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/numkey.wav',
    dove_chirp: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/paws.mp3',
    dove_cheer: 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/one_up.wav'
  };

  constructor() {
    // Initialize AudioContext lazily on user interaction
    const initAudioContext = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      // Preload SFX
      Object.values(this.sfxUrls).forEach(url => this.preloadAudio(url));
      
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);
  }

  setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.bgMusic) {
      this.bgMusic.volume = this.musicVolume;
    }
  }

  getSfxVolume() { return this.sfxVolume; }
  getMusicVolume() { return this.musicVolume; }

  playSfx(type: keyof typeof this.sfxUrls) {
    const url = this.sfxUrls[type];
    if (url) {
      this.playBuffer(url, this.sfxVolume);
    }
  }

  playClick() {
    this.playSfx('click');
  }

  playCorrect() {
    this.playSfx('score');
  }

  playIncorrect() {
    this.playSfx('wrong');
  }

  playDoveChirp() {
    this.playSfx('dove_chirp');
  }

  playDoveCheer() {
    this.playSfx('dove_cheer');
  }

  playMusic(url: string) {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
    this.bgMusic = new Audio(url);
    this.bgMusic.loop = true;
    this.bgMusic.volume = this.musicVolume;
    if (!this.isMuted) {
      this.bgMusic.play().catch(e => console.error("Music playback failed", e));
    }
  }

  stopMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
      this.bgMusic = null;
    }
  }

  setName(name: string) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  setListener(listener: (isSpeaking: boolean) => void) {
    this.onSpeakStateChange = listener;
  }

  setMuteListener(listener: (isMuted: boolean) => void) {
    this.onMuteStateChange = listener;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      if (this.synth) this.synth.cancel();
      if (this.bgMusic) this.bgMusic.pause();
      this.onSpeakStateChange?.(false);
    } else {
      if (this.bgMusic) this.bgMusic.play().catch(() => {});
    }
    this.onMuteStateChange?.(this.isMuted);
    return this.isMuted;
  }

  getIsMuted() {
    return this.isMuted;
  }

  async preloadAudio(url: string) {
    if (!this.audioContext || this.audioBuffers.has(url)) return;
    try {
      const response = await fetch(url);
      if (!response.ok) return; // Silently fail, playBuffer will use fallback
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(url, audioBuffer);
    } catch (e) {
      // Silently fail to avoid console noise, playBuffer has a fallback to new Audio()
    }
  }

  playBuffer(url: string, volume: number = 1.0): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted || !this.audioContext) return resolve();
      
      const buffer = this.audioBuffers.get(url);
      if (!buffer) {
        // Fallback if not preloaded
        const audio = new Audio(url);
        audio.volume = volume;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
        return;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.onended = () => resolve();
      source.start(0);
    });
  }

  speak(text: string, langCode: string = 'english') {
    if (!this.synth || this.isMuted) return;
    this.synth.cancel();
    this.playDoveChirp();

    const personalizedText = text.replace(/\[Name\]/g, this.name || 'friend');
    const utterance = new SpeechSynthesisUtterance(personalizedText);
    
    const langMap: Record<string, string> = {
      english: 'en-US',
      dutch: 'nl-NL',
      norwegian: 'no-NO',
      swedish: 'sv-SE',
      german: 'de-DE'
    };
    
    utterance.lang = langMap[langCode.toLowerCase()] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.2;

    utterance.onstart = () => this.onSpeakStateChange?.(true);
    utterance.onend = () => this.onSpeakStateChange?.(false);
    utterance.onerror = () => this.onSpeakStateChange?.(false);

    this.synth.speak(utterance);
  }

  speakPromise(text: string, langCode: string = 'english'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth || this.isMuted) return resolve();
      this.synth.cancel();
      this.playDoveChirp();
      
      const personalizedText = text.replace(/\[Name\]/g, this.name || 'friend');
      const utterance = new SpeechSynthesisUtterance(personalizedText);
      const langMap: Record<string, string> = { 
        english: 'en-US', dutch: 'nl-NL', norwegian: 'no-NO', swedish: 'sv-SE', german: 'de-DE' 
      };
      utterance.lang = langMap[langCode.toLowerCase()] || 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      
      utterance.onstart = () => this.onSpeakStateChange?.(true);
      utterance.onend = () => {
        this.onSpeakStateChange?.(false);
        resolve();
      };
      utterance.onerror = () => {
        this.onSpeakStateChange?.(false);
        resolve();
      };
      
      this.synth.speak(utterance);
    });
  }

  async playDualAudio(translationText: string, langCode: string, nativeAudioUrl?: string) {
    if (this.isMuted) return;
    // Play native audio first
    try {
      this.onSpeakStateChange?.(true); // Make the dove bounce during native audio too
      const url = nativeAudioUrl || 'https://raw.githubusercontent.com/photonstorm/phaser3-examples/master/public/assets/audio/SoundEffects/squit.mp3';
      await this.playBuffer(url);
    } catch (e) {
      console.error("Audio playback failed", e);
    } finally {
      this.onSpeakStateChange?.(false);
    }
    
    // Then speak the AI explanation
    await this.speakPromise(`That means ${translationText}`, langCode);
  }
}

export const voiceCoach = new VoiceCoach();
