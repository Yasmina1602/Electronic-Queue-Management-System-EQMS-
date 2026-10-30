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
 * Pleasant two-tone chime for calling tickets (Bank/Airport style)
 */
export function playChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Tone 1: 659.25 Hz (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.55);

    // Tone 2: 880 Hz (A5) slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.28);
    gain2.gain.setValueAtTime(0, now + 0.28);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.32);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.28);
    osc2.stop(now + 0.95);

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
 * Text to speech announcement in Uzbek / phonetic fallback
 */
export function announceTicket(ticketNumber, windowNumber) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    // Cancel any hanging or previous utterances to prevent browser freezing
    window.speechSynthesis.cancel();

    // Natural Uzbek phrasing
    const message = `${ticketNumber} raqamli mijoz, ${windowNumber}-oynaga marhamat!`;
    
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    // Look for uz-UZ or tr-TR or ru-RU voices if available
    const voices = window.speechSynthesis.getVoices();
    const suitableVoice = voices.find(
      (v) => v.lang.startsWith('uz') || v.lang.startsWith('tr') || v.lang.startsWith('ru')
    );
    if (suitableVoice) {
      utterance.voice = suitableVoice;
    }

    // Delay slightly after the chime finishes
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak error:', err);
      }
    }, 500);
  } catch (e) {
    console.warn('Speech error:', e);
  }
}
