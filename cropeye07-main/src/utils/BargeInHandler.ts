/**
 * BargeInHandler - Detects user audio input during AI speech
 * Sends interrupt signal when user volume exceeds threshold
 */

export interface BargeInConfig {
  volumeThreshold: number; // 0.0 to 1.0
  checkInterval: number; // milliseconds
  minDuration: number; // Minimum duration above threshold (ms)
}

export class BargeInHandler {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private checkInterval: number | null = null;
  private isActive: boolean = false;
  private config: BargeInConfig;
  private onInterrupt?: () => void;
  private aboveThresholdStart: number = 0;
  private isAboveThreshold: boolean = false;

  constructor(config: Partial<BargeInConfig> = {}) {
    this.config = {
      volumeThreshold: config.volumeThreshold ?? 0.3, // 30% volume
      checkInterval: config.checkInterval ?? 100, // Check every 100ms
      minDuration: config.minDuration ?? 200, // Must be above threshold for 200ms
    };
  }

  /**
   * Start monitoring microphone for barge-in
   */
  async start(stream: MediaStream, onInterrupt: () => void): Promise<void> {
    if (this.isActive) {
      console.warn('BargeInHandler already active');
      return;
    }

    try {
      this.stream = stream;
      this.onInterrupt = onInterrupt;

      // Create AudioContext
      this.audioContext = new AudioContext({ sampleRate: 16000 });

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Create microphone source
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // Create data array for analysis
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Start monitoring
      this.isActive = true;
      this.startMonitoring();

      console.log('✅ BargeInHandler started');
    } catch (error: any) {
      console.error('❌ Failed to start BargeInHandler:', error);
      throw new Error(`Failed to start barge-in detection: ${error.message}`);
    }
  }

  /**
   * Start monitoring loop
   */
  private startMonitoring(): void {
    if (!this.isActive || !this.analyser || !this.dataArray) {
      return;
    }

    const checkVolume = () => {
      if (!this.isActive || !this.analyser || !this.dataArray) {
        return;
      }

      // Get frequency data
      this.analyser.getByteFrequencyData(this.dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      const average = sum / this.dataArray.length;
      const normalizedVolume = average / 255.0; // Normalize to [0, 1]

      // Check if above threshold
      if (normalizedVolume > this.config.volumeThreshold) {
        if (!this.isAboveThreshold) {
          // Just crossed threshold
          this.isAboveThreshold = true;
          this.aboveThresholdStart = Date.now();
        } else {
          // Still above threshold - check duration
          const duration = Date.now() - this.aboveThresholdStart;
          if (duration >= this.config.minDuration) {
            // Trigger interrupt
            console.log('🛑 Barge-in detected!', {
              volume: normalizedVolume,
              duration,
            });
            this.onInterrupt?.();
            this.isAboveThreshold = false; // Reset to prevent multiple triggers
          }
        }
      } else {
        // Below threshold - reset
        this.isAboveThreshold = false;
        this.aboveThresholdStart = 0;
      }

      // Schedule next check
      if (this.isActive) {
        this.checkInterval = window.setTimeout(
          checkVolume,
          this.config.checkInterval
        );
      }
    };

    // Start checking
    checkVolume();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isActive = false;

    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.dataArray = null;
    this.onInterrupt = undefined;
    this.isAboveThreshold = false;
    this.aboveThresholdStart = 0;

    console.log('🛑 BargeInHandler stopped');
  }

  /**
   * Check if handler is active
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Update volume threshold
   */
  setVolumeThreshold(threshold: number): void {
    this.config.volumeThreshold = Math.max(0, Math.min(1, threshold));
  }

  /**
   * Get current volume (0.0 to 1.0)
   */
  getCurrentVolume(): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    return (sum / this.dataArray.length) / 255.0;
  }
}
