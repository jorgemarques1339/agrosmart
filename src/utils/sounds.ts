/**
 * Premium Sound Design Utility using the Web Audio API
 * Generates high-quality synthesized sounds on the fly without heavy audio files.
 */
class SoundService {
    private ctx: AudioContext | null = null;
    private initialized = false;

    private init() {
        if (this.initialized) return;
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.initialized = true;
            }
        } catch (e) {
            console.warn("Web Audio API not supported", e);
        }
    }

    /**
     * Soft, natural "Bop" sound (like a water drop or marimba tap)
     * Used for entering geofencing zones or subtle physical interactions.
     */
    playBop() {
        try {
            this.init();
            if (!this.ctx) return;

            // Resume context if suspended (browser auto-play policy)
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Soft sine wave base
            osc.type = 'sine';

            // Soft pitch drop (gives it that "bloop/bop" character)
            osc.frequency.setValueAtTime(450, t);
            osc.frequency.exponentialRampToValueAtTime(250, t + 0.15);

            // Envelope: very fast attack, smooth decay
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.4, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.3);
        } catch (e) {
            console.warn("Audio play failed:", e);
        }
    }

    /**
     * Airy "Swoosh" / Wind sweep sound
     * Used when an action is saved offline, indicating data floating to the cloud later.
     */
    playSwoosh() {
        try {
            this.init();
            if (!this.ctx) return;

            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            const duration = 0.6; // slightly longer, airy feel
            const bufferSize = this.ctx.sampleRate * duration;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);

            // Fill with white noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noiseSrc = this.ctx.createBufferSource();
            noiseSrc.buffer = buffer;

            // Bandpass filter to create the "wind" sweep effect
            const bandpass = this.ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.Q.value = 1.2; // Smooth, wide resonance

            // Sweep frequency up then down
            bandpass.frequency.setValueAtTime(300, t);
            bandpass.frequency.exponentialRampToValueAtTime(1000, t + (duration * 0.4));
            bandpass.frequency.exponentialRampToValueAtTime(300, t + duration);

            // Gain envelope (fade in, fade out)
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + (duration * 0.3));
            gain.gain.linearRampToValueAtTime(0, t + duration);

            noiseSrc.connect(bandpass);
            bandpass.connect(gain);
            gain.connect(this.ctx.destination);

            noiseSrc.start(t);
        } catch (e) {
            console.warn("Audio play failed:", e);
        }
    }

    /**
     * Positive Chime
     */
    playSuccess() {
        try {
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') this.ctx.resume();

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.setValueAtTime(800, t + 0.1);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.2, t + 0.05);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.35);
        } catch (e) {
            console.warn("Audio play failed:", e);
        }
    }
}

export const sounds = new SoundService();
