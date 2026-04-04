
/**
 * LocalAI.ts
 * A zero-budget AI service using browser-native APIs and Gemini Free Tier.
 */

import { GoogleGenAI } from "@google/genai";

// 1. Speech Recognition (Local Browser API)
export class SpeechToText {
  private recognition: any;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
    }
  }

  start(onResult: (text: string) => void, onError?: (err: any) => void) {
    if (!this.recognition) {
      onError?.("Speech recognition not supported in this browser.");
      return;
    }

    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
    };

    this.recognition.onerror = (event: any) => onError?.(event.error);
    this.recognition.onend = () => { this.isListening = false; };

    this.recognition.start();
    this.isListening = true;
  }

  stop() {
    this.recognition?.stop();
    this.isListening = false;
  }
}

// 2. Speech Synthesis (Local Browser API)
export const textToSpeech = (text: string, lang: string = 'en-US') => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // Slightly slower for clarity
  utterance.pitch = 1.1; // Friendly tone
  window.speechSynthesis.speak(utterance);
};

// 3. AI Translation & Logic (Gemini Free Tier)
// Note: This uses the free tier of Gemini which costs $0.
export const aiTranslate = async (text: string, targetLang: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Translate this text to ${targetLang}. Provide only the translation. Text: "${text}"`,
  });

  return response.text;
};
