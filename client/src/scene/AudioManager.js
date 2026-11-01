/**
 * Quản lý âm thanh Web Audio API & Đa Thể Loại Nhạc Club Bản Quyền Tự Do (100% Royalty-Free)
 * Hỗ trợ: Vinahouse, Cyber EDM, Deep House Lounge, Techno Rave, Hip-Hop 808
 */

export const MUSIC_GENRES = [
  { id: 'vinahouse', name: '🔥 Vinahouse Nonstop (138 BPM)', bpm: 138 },
  { id: 'cyber_edm', name: '⚡ Cyber EDM Festival (128 BPM)', bpm: 128 },
  { id: 'deep_house', name: '🌙 Deep House Lounge (122 BPM)', bpm: 122 },
  { id: 'techno_rave', name: '💥 Rave Hard Techno (144 BPM)', bpm: 144 },
  { id: 'hiphop_trap', name: '🧢 Hip-Hop Trap 808 (96 BPM)', bpm: 96 }
];

export class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.gainNode = null;
    this.freqData = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.volume = 0.5;

    this.currentGenreIndex = 0;
    this.currentGenre = MUSIC_GENRES[0];
    this.bpm = this.currentGenre.bpm;
    this.step = 0;
    this.synthTimer = null;

    this.bassEnergy = 0;
    this.midEnergy = 0;
    this.trebleEnergy = 0;
    this.beatDetected = false;

    this.onTrackChangeCallback = null;
  }

  init() {
    if (this.audioCtx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = this.volume;

    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
  }

  start() {
    this.init();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (this.isPlaying) return;

    this.isPlaying = true;
    this._startProceduralBeat();
    if (this.onTrackChangeCallback) {
      this.onTrackChangeCallback(this.currentGenre);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.gainNode) {
      this.gainNode.gain.value = this.isMuted ? 0 : this.volume;
    }
    return this.isMuted;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.value = this.volume;
    }
  }

  /**
   * Chuyển sang thể loại nhạc tiếp theo
   */
  nextTrack() {
    this.currentGenreIndex = (this.currentGenreIndex + 1) % MUSIC_GENRES.length;
    this.setGenre(MUSIC_GENRES[this.currentGenreIndex].id);
  }

  /**
   * Đặt thể loại nhạc cụ thể theo ID
   */
  setGenre(genreId) {
    const found = MUSIC_GENRES.find(g => g.id === genreId);
    if (!found) return;

    this.currentGenre = found;
    this.currentGenreIndex = MUSIC_GENRES.indexOf(found);
    this.bpm = found.bpm;

    if (this.isPlaying) {
      if (this.synthTimer) clearInterval(this.synthTimer);
      this._startProceduralBeat();
    }

    if (this.onTrackChangeCallback) {
      this.onTrackChangeCallback(this.currentGenre);
    }

    console.log(`[Music Engine] Đã đổi bài: ${found.name}`);
  }

  getCurrentTrackName() {
    return this.currentGenre.name;
  }

  /**
   * Bộ tạo nhịp đa thể loại (Vinahouse, Cyber EDM, Deep House, Rave Techno, Trap)
   */
  _startProceduralBeat() {
    const stepDurationMs = (60 / this.bpm / 4) * 1000; // 16th note step
    this.step = 0;

    this.synthTimer = setInterval(() => {
      if (!this.isPlaying || !this.audioCtx) return;
      const time = this.audioCtx.currentTime;

      switch (this.currentGenre.id) {
        case 'vinahouse':
          this._playVinahouseStep(time, this.step);
          break;
        case 'techno_rave':
          this._playTechnoStep(time, this.step);
          break;
        case 'deep_house':
          this._playDeepHouseStep(time, this.step);
          break;
        case 'hiphop_trap':
          this._playTrapStep(time, this.step);
          break;
        case 'cyber_edm':
        default:
          this._playCyberEdmStep(time, this.step);
          break;
      }

      this.step = (this.step + 1) % 16;
    }, stepDurationMs);
  }

  // 1. Vinahouse Nonstop (138 BPM) - Nhạc bay phòng Việt Nam đặc trưng
  _playVinahouseStep(time, step) {
    // Kick punchy đanh thép 4/4
    if (step % 4 === 0) {
      this._playKick(time, 160, 48, 0.18, 1.1);
    }
    // Vinahouse off-beat rolling bass (nhịp 1, 3, 5, 7, 9, 11, 13, 15)
    if (step % 2 === 1) {
      const vBass = [65.4, 65.4, 73.4, 65.4, 82.4, 73.4, 65.4, 98.0];
      this._playBass(time, vBass[Math.floor(step / 2) % vBass.length], 0.12, 600, 0.45);
    }
    // Open hi-hat ở nhịp 2, 6, 10, 14
    if (step % 4 === 2) {
      this._playHiHat(time, true);
    } else if (step % 2 === 0) {
      this._playHiHat(time, false);
    }
    // Vinahouse Lead Stabs
    if (step === 3 || step === 7 || step === 11 || step === 14) {
      this._playSynthStab(time, [261.63, 329.63, 392.00], 0.16); // C Major
    }
  }

  // 2. Cyber EDM (128 BPM)
  _playCyberEdmStep(time, step) {
    if (step % 4 === 0) {
      this._playKick(time, 140, 35, 0.22, 1.0);
    }
    if (step % 4 === 2) {
      this._playHiHat(time, true);
    } else if (step % 2 === 0) {
      this._playHiHat(time, false);
    }
    const notes = [55, 55, 65.4, 55, 73.4, 55, 82.4, 73.4];
    this._playBass(time, notes[Math.floor(step / 2) % notes.length], 0.13, 450, 0.35);

    if (step === 3 || step === 7 || step === 11 || step === 14) {
      this._playSynthStab(time, [220, 261.63, 329.63], 0.18);
    }
  }

  // 3. Deep House Lounge (122 BPM) - Ấm áp, mượt mà
  _playDeepHouseStep(time, step) {
    if (step % 4 === 0) {
      this._playKick(time, 120, 38, 0.25, 0.85); // Kick trầm ấm
    }
    if (step % 4 === 2) {
      this._playHiHat(time, true);
    }
    // Bass sâu lắng
    if (step % 4 === 1 || step % 4 === 3) {
      this._playBass(time, 43.65, 0.18, 250, 0.4); // F1 sub
    }
    // Chords ấm cúng phong cách Lounge
    if (step === 0 || step === 8) {
      this._playSynthStab(time, [174.61, 220, 261.63, 329.63], 0.35); // Fmaj7
    }
  }

  // 4. Hard Rave Techno (144 BPM) - Cuồng nhiệt, bốc lửa
  _playTechnoStep(time, step) {
    // Hard Kick distortion
    if (step % 4 === 0) {
      this._playKick(time, 180, 42, 0.25, 1.3);
    }
    // Offbeat Hat giòn
    if (step % 4 === 2) {
      this._playHiHat(time, true);
    }
    // Rumble Sub-bass
    this._playBass(time, 41.2, 0.14, 180, 0.48); // E1 rumble
    // Synth Acid stabs
    if (step === 4 || step === 12) {
      this._playSynthStab(time, [164.81, 329.63], 0.12);
    }
  }

  // 5. Hip-Hop & Trap 808 (96 BPM) - Sub bass sâu, Hi-hat triplet
  _playTrapStep(time, step) {
    // Kick ở nhịp 0 và 10
    if (step === 0 || step === 10) {
      this._playKick(time, 130, 32, 0.35, 1.2); // 808 Sub Kick dài
    }
    // Snare ở nhịp 4 và 12
    if (step === 4 || step === 12) {
      this._playSnare(time);
    }
    // Hi-hat lăn tăn
    if (step % 2 === 0 || step === 7 || step === 15) {
      this._playHiHat(time, false);
    }
  }

  _playKick(time, startFreq = 140, endFreq = 35, duration = 0.25, gainVal = 1.0) {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration * 0.5);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  _playSnare(time) {
    const noise = this.audioCtx.createBufferSource();
    const bufferSize = this.audioCtx.sampleRate * 0.12;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1500;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + 0.12);
  }

  _playHiHat(time, isOpen) {
    const bufferSize = this.audioCtx.sampleRate * (isOpen ? 0.08 : 0.03);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(isOpen ? 0.28 : 0.16, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (isOpen ? 0.08 : 0.03));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    noise.start(time);
    noise.stop(time + (isOpen ? 0.08 : 0.03));
  }

  _playBass(time, freq, duration = 0.14, cutoff = 450, gainVal = 0.35) {
    const osc = this.audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(100, time + duration);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.gainNode);

    osc.start(time);
    osc.stop(time + duration);
  }

  _playSynthStab(time, chords, duration = 0.2) {
    chords.forEach((f) => {
      const osc = this.audioCtx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f * 2, time);

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, time);
      filter.frequency.exponentialRampToValueAtTime(300, time + duration);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.gainNode);

      osc.start(time);
      osc.stop(time + duration);
    });
  }

  update() {
    if (!this.analyser || !this.isPlaying) {
      return { bass: 0, mid: 0, treble: 0, energy: 0, isBeat: false };
    }

    this.analyser.getByteFrequencyData(this.freqData);

    let bassSum = 0, midSum = 0, trebleSum = 0;
    const len = this.freqData.length;

    for (let i = 0; i < 8; i++) bassSum += this.freqData[i];
    for (let i = 8; i < 40; i++) midSum += this.freqData[i];
    for (let i = 40; i < Math.min(100, len); i++) trebleSum += this.freqData[i];

    this.bassEnergy = (bassSum / 8) / 255;
    this.midEnergy = (midSum / 32) / 255;
    this.trebleEnergy = (trebleSum / 60) / 255;

    const prevBeat = this.beatDetected;
    this.beatDetected = this.bassEnergy > 0.62;
    const isNewBeat = this.beatDetected && !prevBeat;

    return {
      bass: this.bassEnergy,
      mid: this.midEnergy,
      treble: this.trebleEnergy,
      energy: (this.bassEnergy + this.midEnergy + this.trebleEnergy) / 3,
      isBeat: isNewBeat
    };
  }
}
