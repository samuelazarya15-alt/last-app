export class VoiceCoach {
  private name: string = '';
  private synth = window.speechSynthesis;
  private onSpeakStateChange: ((isSpeaking: boolean) => void) | null = null;
  private isMuted: boolean = true; // Default to muted
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    // Initialize AudioContext lazily on user interaction
    const initAudioContext = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('touchstart', initAudioContext);
    };
    document.addEventListener('click', initAudioContext);
    document.addEventListener('touchstart', initAudioContext);
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

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.synth) {
      this.synth.cancel();
      this.onSpeakStateChange?.(false);
    }
    return this.isMuted;
  }

  getIsMuted() {
    return this.isMuted;
  }

  async preloadAudio(url: string) {
    if (!this.audioContext || this.audioBuffers.has(url)) return;
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(url, audioBuffer);
    } catch (e) {
      console.error("Failed to preload audio:", url, e);
    }
  }

  playBuffer(url: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted || !this.audioContext) return resolve();
      
      const buffer = this.audioBuffers.get(url);
      if (!buffer) {
        // Fallback if not preloaded
        const audio = new Audio(url);
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
        return;
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.onended = () => resolve();
      source.start(0);
    });
  }

  speak(text: string, langCode: string = 'english') {
    if (!this.synth || this.isMuted) return;
    this.synth.cancel();

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
      const url = nativeAudioUrl || 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg';
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
