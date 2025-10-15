// Audio processing utilities for voice chat

export class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationId = null;
  }

  // Initialize audio analysis
  async initializeAnalyzer(mediaStream) {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      
      const source = this.audioContext.createMediaStreamSource(mediaStream);
      source.connect(this.analyser);
      
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio analyzer:', error);
      return false;
    }
  }

  // Get audio visualization data
  getVisualizationData(barCount = 32) {
    if (!this.analyser || !this.dataArray) return Array(barCount).fill(0);
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    const bars = [];
    const step = Math.floor(this.dataArray.length / barCount);
    
    for (let i = 0; i < barCount; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += this.dataArray[i * step + j];
      }
      const average = sum / step;
      bars.push(average / 255); // Normalize to 0-1
    }
    
    return bars;
  }

  // Start continuous visualization updates
  startVisualization(callback, barCount = 32) {
    const updateVisualization = () => {
      const data = this.getVisualizationData(barCount);
      callback(data);
      this.animationId = requestAnimationFrame(updateVisualization);
    };
    
    updateVisualization();
  }

  // Stop visualization updates
  stopVisualization() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Clean up resources
  cleanup() {
    this.stopVisualization();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
  }
}

// Audio format conversion utilities
export const AudioUtils = {
  // Convert Float32Array to PCM16
  floatToPCM16: (float32Array) => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      pcm16[i] = Math.max(-32768, Math.min(32767, float32Array[i] * 32768));
    }
    return pcm16;
  },

  // Convert PCM16 to base64
  pcm16ToBase64: (pcm16Array) => {
    return btoa(String.fromCharCode(...new Uint8Array(pcm16Array.buffer)));
  },

  // Convert Float32Array directly to base64
  floatToBase64: (float32Array) => {
    const pcm16 = AudioUtils.floatToPCM16(float32Array);
    return AudioUtils.pcm16ToBase64(pcm16);
  },

  // Convert base64 to audio blob
  base64ToBlob: (base64, mimeType = 'audio/mp3') => {
    try {
      const cleanBase64 = base64.replace(/\s/g, '');
      const paddedBase64 = cleanBase64 + '='.repeat((4 - cleanBase64.length % 4) % 4);
      
      const byteCharacters = atob(paddedBase64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      throw error;
    }
  },

  // Calculate audio level from Float32Array
  calculateAudioLevel: (audioData) => {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += Math.abs(audioData[i]);
    }
    return sum / audioData.length;
  },

  // Detect voice activity based on audio level
  detectVoiceActivity: (audioData, threshold = 0.01) => {
    const level = AudioUtils.calculateAudioLevel(audioData);
    return level > threshold;
  }
};

// Voice Activity Detection class
export class VoiceActivityDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.01;
    this.minSpeechDuration = options.minSpeechDuration || 300; // ms
    this.minSilenceDuration = options.minSilenceDuration || 500; // ms
    
    this.isActive = false;
    this.speechStartTime = null;
    this.silenceStartTime = null;
    this.callbacks = {};
  }

  // Set callbacks for speech events
  setCallbacks(callbacks) {
    this.callbacks = callbacks;
  }

  // Process audio data for VAD
  processAudio(audioData) {
    const isVoice = AudioUtils.detectVoiceActivity(audioData, this.threshold);
    const now = Date.now();

    if (isVoice && !this.isActive) {
      // Potential speech start
      if (!this.speechStartTime) {
        this.speechStartTime = now;
      } else if (now - this.speechStartTime >= this.minSpeechDuration) {
        // Confirmed speech start
        this.isActive = true;
        this.speechStartTime = null;
        this.silenceStartTime = null;
        
        if (this.callbacks.onSpeechStart) {
          this.callbacks.onSpeechStart();
        }
      }
    } else if (!isVoice && this.isActive) {
      // Potential speech end
      if (!this.silenceStartTime) {
        this.silenceStartTime = now;
      } else if (now - this.silenceStartTime >= this.minSilenceDuration) {
        // Confirmed speech end
        this.isActive = false;
        this.speechStartTime = null;
        this.silenceStartTime = null;
        
        if (this.callbacks.onSpeechEnd) {
          this.callbacks.onSpeechEnd();
        }
      }
    } else if (isVoice && this.isActive) {
      // Continue speech - reset silence timer
      this.silenceStartTime = null;
    } else if (!isVoice && !this.isActive) {
      // Continue silence - reset speech timer
      this.speechStartTime = null;
    }

    return this.isActive;
  }

  // Reset VAD state
  reset() {
    this.isActive = false;
    this.speechStartTime = null;
    this.silenceStartTime = null;
  }
}

export default {
  AudioProcessor,
  AudioUtils,
  VoiceActivityDetector
};
