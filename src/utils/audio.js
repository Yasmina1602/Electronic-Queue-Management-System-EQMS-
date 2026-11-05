// Web Audio API Sound Synthesizer & Speech Announcements

let audioCtx = null;

function getAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (e) {
    console.warn('AudioContext init error:', e);
  }
  return audioCtx;
}

/**
 * Yoqimli va jarangdor "Ding-Dong" ovoz signali (Zamonaviy bank / aeroport / xalqaro standart)
 * Birinchi nota: "Ding" (880 Hz - A5, jarangdor yuqori nota)
 * Ikkinchi nota: "Dong" (587.33 Hz - D5, mayin, chuqur va uzoq jaranglovchi nota)
 */
export function playChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Master limiter/compressor gain to ensure silky-smooth, clear sound without clipping
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.35, now);
    masterGain.connect(ctx.destination);

    // ==========================================
    // 1. "DING" (Birinchi nota: A5 = 880 Hz)
    // ==========================================
    const dingOsc = ctx.createOscillator();
    const dingGain = ctx.createGain();
    dingOsc.type = 'sine';
    dingOsc.frequency.setValueAtTime(880, now);

    // Qo'shimcha yumshoq garmonika (vibrofon / glockenspiel jilosi)
    const dingHarmonic = ctx.createOscillator();
    const dingHarmonicGain = ctx.createGain();
    dingHarmonic.type = 'sine';
    dingHarmonic.frequency.setValueAtTime(1760, now);

    dingGain.gain.setValueAtTime(0, now);
    dingGain.gain.linearRampToValueAtTime(0.7, now + 0.015);
    dingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    dingHarmonicGain.gain.setValueAtTime(0, now);
    dingHarmonicGain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    dingHarmonicGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    dingOsc.connect(dingGain);
    dingHarmonic.connect(dingHarmonicGain);
    dingGain.connect(masterGain);
    dingHarmonicGain.connect(masterGain);

    dingOsc.start(now);
    dingHarmonic.start(now);
    dingOsc.stop(now + 0.65);
    dingHarmonic.stop(now + 0.35);

    // ==========================================
    // 2. "DONG" (Ikkinchi nota: D5 = 587.33 Hz, 0.32s kechikish bilan)
    // ==========================================
    const dongTime = now + 0.32;

    const dongOsc = ctx.createOscillator();
    const dongGain = ctx.createGain();
    dongOsc.type = 'sine';
    dongOsc.frequency.setValueAtTime(587.33, dongTime);

    // Pastki chuqur rezonans (mayin gong sadosi)
    const dongHarmonic = ctx.createOscillator();
    const dongHarmonicGain = ctx.createGain();
    dongHarmonic.type = 'sine';
    dongHarmonic.frequency.setValueAtTime(1174.66, dongTime);

    dongGain.gain.setValueAtTime(0, dongTime);
    dongGain.gain.linearRampToValueAtTime(0.85, dongTime + 0.02);
    dongGain.gain.exponentialRampToValueAtTime(0.0001, dongTime + 1.25);

    dongHarmonicGain.gain.setValueAtTime(0, dongTime);
    dongHarmonicGain.gain.linearRampToValueAtTime(0.18, dongTime + 0.015);
    dongHarmonicGain.gain.exponentialRampToValueAtTime(0.0001, dongTime + 0.6);

    dongOsc.connect(dongGain);
    dongHarmonic.connect(dongHarmonicGain);
    dongGain.connect(masterGain);
    dongHarmonicGain.connect(masterGain);

    dongOsc.start(dongTime);
    dongHarmonic.start(dongTime);
    dongOsc.stop(dongTime + 1.25);
    dongHarmonic.stop(dongTime + 0.6);

  } catch (err) {
    console.warn('Audio chime play error:', err);
  }
}

/**
 * Thermal receipt printer sound simulation (motor buzz + paper cut)
 */
export function playPrintSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Noise buffer for mechanical printer feed sound
    const bufferSize = Math.floor(ctx.sampleRate * 0.45);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter to sound like a tiny thermal stepper motor
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(3.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.45);

    // Click/Snip sound at the end
    const snipOsc = ctx.createOscillator();
    const snipGain = ctx.createGain();
    snipOsc.frequency.setValueAtTime(3200, now + 0.45);
    snipGain.gain.setValueAtTime(0.3, now + 0.45);
    snipGain.gain.exponentialRampToValueAtTime(0.001, now + 0.52);
    snipOsc.connect(snipGain);
    snipGain.connect(ctx.destination);
    snipOsc.start(now + 0.45);
    snipOsc.stop(now + 0.52);

  } catch (err) {
    console.warn('Print sound error:', err);
  }
}

/**
 * Text to speech announcement (Ovozli xabar foydalanuvchi talabiga ko'ra o'chirildi, faqat 1 marta ding-dong chime yetarli)
 */
export function announceTicket() {
  return;
}
