/* ---------------- UI sound cues ----------------
   Short, quiet, synthesized tones (no audio files; stays fully offline)
   played only for meaningful moments: adding or removing something (a
   weapon, a feat, a character…), rolling a natural 20 or natural 1,
   rolling ability scores, dragging the theme slider, adding or
   spending coin in the purse, and death saving throws. Never used for routine interaction like
   toggles, typing, or numeric steppers, so it stays a subtle accent
   instead of noise. */
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

/* A soft rising blip; something was added. */
export function playAdd(){
  try{ tone(560, 880, 0.11, "sine", 0.16); }catch(e){}
}

/* A soft falling blip; something was removed. */
export function playDelete(){
  try{ tone(420, 260, 0.13, "triangle", 0.13); }catch(e){}
}

/* A bright three-note rising fanfare; natural 20. */
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

/* A shimmering four-note arpeggio; the character gains Inspiration. */
export function playInspire(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 784, 784, 0.14, "sine", 0.12);
    scheduleTone(ctx, now + 0.07, 988, 988, 0.14, "sine", 0.12);
    scheduleTone(ctx, now + 0.14, 1175, 1175, 0.16, "sine", 0.13);
    scheduleTone(ctx, now + 0.21, 1568, 2093, 0.34, "sine", 0.12);
  }catch(e){}
}

/* Dice rattling in a cup: a quick scatter of short, woody clicks at
   random pitches. Used when rolling ability scores. */
export function playDiceRattle(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    for(var i=0;i<14;i++){
      var t = now + i*0.045 + Math.random()*0.02;
      var f = 900 + Math.random()*900;
      scheduleTone(ctx, t, f, f*0.6, 0.035, "triangle", 0.05 + Math.random()*0.04);
    }
  }catch(e){}
}

/* One die group landing on the table: a short soft knock whose pitch
   rises a little with `strength` (0..1, e.g. how good the roll was). */
export function playDiceLand(strength){
  try{
    var s = Math.max(0, Math.min(1, strength||0));
    tone(260 + s*260, 140 + s*120, 0.09, "triangle", 0.14);
  }catch(e){}
}

/* A low descending dud; natural 1. */
export function playFail(){
  try{ tone(300, 130, 0.28, "sawtooth", 0.1); }catch(e){}
}

/* A tiny bright chime for the theme slider; pitch rises with position
   (index/total, both 0-based) so scrubbing through the palette feels
   like running a finger across a xylophone. */
export function playThemeShift(index, total){
  try{
    var t = total > 1 ? index / (total - 1) : 0;
    var freq = 520 + t * 480;
    tone(freq, freq * 1.12, 0.08, "sine", 0.08);
  }catch(e){}
}

/* Coins clinking into (or out of) the purse: a few bright, slightly
   detuned metallic pings. `count` (1..6) is how many coins you hear, so a
   big haul sounds fuller than a single copper; `spend` makes them fall in
   pitch instead of rising. */
export function playCoins(count, spend){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    var n = Math.max(1, Math.min(6, count||1));
    for(var i=0;i<n;i++){
      var t = now + i*0.065 + Math.random()*0.02;
      var step = spend ? -i : i;
      var f = 2300 + step*140 + Math.random()*180;
      scheduleTone(ctx, t, f, f*0.985, 0.16, "sine", 0.07);
      scheduleTone(ctx, t, f*1.51, f*1.49, 0.09, "sine", 0.035);
    }
  }catch(e){}
}

/* A soft heartbeat (lub-dub) under a small rising chime; a death save
   succeeds. */
export function playDeathSaveSuccess(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 95, 60, 0.14, "sine", 0.28);
    scheduleTone(ctx, now + 0.16, 85, 55, 0.12, "sine", 0.2);
    scheduleTone(ctx, now + 0.1, 523, 784, 0.22, "sine", 0.08);
  }catch(e){}
}

/* A hollow low toll; a death save fails. `double` (a natural 1, two
   failures) tolls twice, the second lower. */
export function playDeathSaveFail(double){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 220, 150, 0.38, "triangle", 0.16);
    scheduleTone(ctx, now, 110, 80, 0.42, "sine", 0.18);
    if(double){
      scheduleTone(ctx, now + 0.24, 185, 120, 0.46, "triangle", 0.16);
      scheduleTone(ctx, now + 0.24, 92, 65, 0.5, "sine", 0.18);
    }
  }catch(e){}
}

/* A calm major chord settling upward; three successes, the character is
   stable. */
export function playStabilized(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 392, 392, 0.5, "sine", 0.1);
    scheduleTone(ctx, now + 0.1, 494, 494, 0.5, "sine", 0.1);
    scheduleTone(ctx, now + 0.2, 587, 587, 0.55, "sine", 0.1);
    scheduleTone(ctx, now + 0.34, 784, 784, 0.8, "sine", 0.09);
  }catch(e){}
}

/* A slow falling knell; three failures, the character dies. */
export function playDeath(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 196, 190, 0.7, "triangle", 0.14);
    scheduleTone(ctx, now, 98, 96, 0.8, "sine", 0.16);
    scheduleTone(ctx, now + 0.45, 165, 160, 0.75, "triangle", 0.13);
    scheduleTone(ctx, now + 0.9, 131, 110, 1.3, "triangle", 0.13);
    scheduleTone(ctx, now + 0.9, 65, 55, 1.4, "sine", 0.18);
  }catch(e){}
}

/* A heartbeat kicking back in, then a bright rising sweep; a natural 20
   on a death save brings the character back with 1 HP. */
export function playRevive(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 95, 60, 0.14, "sine", 0.28);
    scheduleTone(ctx, now + 0.16, 85, 55, 0.12, "sine", 0.2);
    scheduleTone(ctx, now + 0.3, 330, 990, 0.4, "sine", 0.1);
    scheduleTone(ctx, now + 0.42, 659, 659, 0.3, "triangle", 0.12);
    scheduleTone(ctx, now + 0.52, 784, 784, 0.3, "triangle", 0.13);
    scheduleTone(ctx, now + 0.62, 1046, 1318, 0.45, "triangle", 0.14);
  }catch(e){}
}
