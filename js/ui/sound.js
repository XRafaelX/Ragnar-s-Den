/* ---------------- UI sound cues ----------------
   Short, quiet, synthesized tones (no audio files — stays fully offline)
   played only for meaningful moments: adding or removing something (a
   weapon, a feat, a character…), and rolling a natural 20 or natural 1.
   Never used for routine interaction like toggles, typing, or numeric
   steppers, so it stays a subtle accent instead of noise. */
var audioCtx = null;

function getCtx(){
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return null;
  if(!audioCtx) audioCtx = new Ctx();
  if(audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function scheduleTone(ctx, startTime, freqStart, freqEnd, duration, type, peakGain){
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, startTime);
  if(freqEnd !== freqStart) osc.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

function tone(freqStart, freqEnd, duration, type, peakGain){
  var ctx = getCtx();
  if(!ctx) return;
  scheduleTone(ctx, ctx.currentTime, freqStart, freqEnd, duration, type, peakGain);
}

/* A soft rising blip — something was added. */
export function playAdd(){
  try{ tone(560, 880, 0.11, "sine", 0.16); }catch(e){}
}

/* A soft falling blip — something was removed. */
export function playDelete(){
  try{ tone(420, 260, 0.13, "triangle", 0.13); }catch(e){}
}

/* A bright three-note rising fanfare — natural 20. */
export function playCrit(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 523, 523, 0.11, "triangle", 0.15);
    scheduleTone(ctx, now + 0.09, 659, 659, 0.11, "triangle", 0.16);
    scheduleTone(ctx, now + 0.18, 784, 1046, 0.24, "triangle", 0.18);
  }catch(e){}
}

/* A low descending dud — natural 1. */
export function playFail(){
  try{ tone(300, 130, 0.28, "sawtooth", 0.1); }catch(e){}
}
