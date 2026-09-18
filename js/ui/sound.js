/* ---------------- UI sound cues ----------------
   Short, quiet, synthesized tones (no audio files — stays fully offline)
   played only for meaningful list changes: adding or removing something
   (a weapon, a feat, a character…). Never used for routine interaction
   like toggles, typing, or numeric steppers, so it stays a subtle accent
   instead of noise. */
var audioCtx = null;

function getCtx(){
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if(!Ctx) return null;
  if(!audioCtx) audioCtx = new Ctx();
  if(audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone(freqStart, freqEnd, duration, type, peakGain){
  var ctx = getCtx();
  if(!ctx) return;
  var osc = ctx.createOscillator();
  var gain = ctx.createGain();
  osc.type = type;
  var now = ctx.currentTime;
  osc.frequency.setValueAtTime(freqStart, now);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peakGain, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.03);
}

/* A soft rising blip — something was added. */
export function playAdd(){
  try{ tone(560, 880, 0.11, "sine", 0.16); }catch(e){}
}

/* A soft falling blip — something was removed. */
export function playDelete(){
  try{ tone(420, 260, 0.13, "triangle", 0.13); }catch(e){}
}
