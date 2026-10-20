/* ---------------- UI sound cues ----------------
   Short, quiet, synthesized tones (no audio files; stays fully offline)
   played only for meaningful moments: adding or removing something (a
   weapon, a feat, a character…), rolling a natural 20 or natural 1,
   rolling ability scores, the home menu's centre die tumbling, finishing
   a new character, short and long rests, dragging the theme slider, adding or
   spending coin in the purse, death saving throws, gaining or losing a
   condition or a level of exhaustion, and an encounter's
   hits, slain monsters, new rounds and victory. Never used for routine interaction like
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

/* A burst of filtered white noise (a breath, grinding stone, a muffled
   rush); `freq` is the band-pass centre. */
function scheduleNoise(ctx, startTime, duration, peakGain, freq){
  var len = Math.max(1, Math.floor(ctx.sampleRate * duration));
  var buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  var data = buffer.getChannelData(0);
  for(var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  var src = ctx.createBufferSource();
  src.buffer = buffer;
  var filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(freq, startTime);
  filter.Q.value = 0.9;
  var gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + duration * 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start(startTime);
  src.stop(startTime + duration + 0.03);
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
   random pitches. Used when rolling ability scores and when the home
   menu's centre die tumbles. */
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

/* A harp-like strum rising into a soft high note; a new character
   steps out of the creation wizard. */
export function playNewCharacter(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    [262, 330, 392, 523, 659, 784].forEach(function(f, i){
      scheduleTone(ctx, now + i*0.05, f, f, 0.7, "triangle", 0.07);
    });
    scheduleTone(ctx, now + 0.34, 1046, 1046, 0.9, "sine", 0.08);
    scheduleTone(ctx, now + 0.34, 523, 523, 0.9, "sine", 0.05);
  }catch(e){}
}

/* A campfire: a few soft, low crackles under a warm two-note settle;
   a short rest. */
export function playShortRest(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    for(var i=0;i<9;i++){
      var t = now + i*0.09 + Math.random()*0.05;
      var f = 320 + Math.random()*420;
      scheduleTone(ctx, t, f, f*0.5, 0.025, "triangle", 0.04 + Math.random()*0.03);
    }
    scheduleTone(ctx, now + 0.15, 294, 294, 0.6, "sine", 0.08);
    scheduleTone(ctx, now + 0.4, 392, 392, 0.8, "sine", 0.08);
  }catch(e){}
}

/* A falling lullaby for the night, then a bright chord for the dawn;
   a long rest. Timed to the long rest's night and dawn on screen. */
export function playLongRest(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 659, 659, 0.45, "sine", 0.07);
    scheduleTone(ctx, now + 0.3, 523, 523, 0.45, "sine", 0.07);
    scheduleTone(ctx, now + 0.6, 392, 392, 0.7, "sine", 0.07);
    scheduleTone(ctx, now + 1.3, 392, 392, 0.9, "sine", 0.07);
    scheduleTone(ctx, now + 1.38, 494, 494, 0.9, "sine", 0.07);
    scheduleTone(ctx, now + 1.46, 587, 587, 0.9, "sine", 0.07);
    scheduleTone(ctx, now + 1.56, 784, 988, 1.1, "sine", 0.06);
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

/* ---- Encounters (the DM's tracker) ---- */

/* A soft low thud; a monster takes damage. `heavy` (a quarter of its hit
   points or more in one go) lands deeper and a little louder. */
export function playMonsterHit(heavy){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    if(heavy){
      scheduleTone(ctx, now, 120, 42, 0.26, "sine", 0.3);
      scheduleTone(ctx, now, 180, 70, 0.14, "triangle", 0.14);
    }else{
      scheduleTone(ctx, now, 170, 70, 0.14, "sine", 0.22);
      scheduleTone(ctx, now, 240, 120, 0.07, "triangle", 0.08);
    }
  }catch(e){}
}

/* A short falling tone; a monster drops to 0. Briefer than a player's
   death knell (playDeath). */
export function playMonsterSlain(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 140, 50, 0.22, "sine", 0.26);
    scheduleTone(ctx, now + 0.06, 392, 131, 0.42, "triangle", 0.12);
    scheduleTone(ctx, now + 0.06, 196, 82, 0.5, "sine", 0.1);
  }catch(e){}
}

/* A low gong; Next turn starts a new round. Ordinary turn changes stay
   silent, they happen too often. */
export function playNewRound(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 70, 60, 0.12, "sine", 0.22);       // the strike
    scheduleTone(ctx, now, 110, 108, 1.4, "sine", 0.14);      // the body
    scheduleTone(ctx, now, 220, 217, 1.0, "sine", 0.06);
    scheduleTone(ctx, now, 331, 326, 0.7, "triangle", 0.035); // shimmer
  }catch(e){}
}

/* A short rising fanfare; the last monster standing goes down. */
export function playVictory(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 392, 392, 0.12, "triangle", 0.14);
    scheduleTone(ctx, now + 0.11, 523, 523, 0.12, "triangle", 0.15);
    scheduleTone(ctx, now + 0.22, 659, 659, 0.12, "triangle", 0.16);
    scheduleTone(ctx, now + 0.33, 784, 784, 0.55, "triangle", 0.17);
    scheduleTone(ctx, now + 0.33, 392, 392, 0.55, "sine", 0.1);
  }catch(e){}
}

/* Easter egg: plays a sound clip when a character named TOUKELLIENMELI
   is created. The clip is the one audio file the app ships (sounds/). */
export function playToukellienmeli(){
  try{
    var clip = new Audio("sounds/toukellienmeli.mp3");
    clip.play().catch(function(){});
  }catch(e){}
}

/* ---- Conditions (the Vitals tab's Conditions card) ---- */

/* Each condition's own cue as it takes hold: (ctx, now) => tones. */
var CONDITION_CUES = {
  // The light going out: a falling sweep into a low hum.
  blinded: function(ctx, now){
    scheduleTone(ctx, now, 880, 140, 0.55, "sine", 0.1);
    scheduleTone(ctx, now + 0.2, 98, 92, 0.7, "sine", 0.1);
  },
  // A dreamy rising sparkle.
  charmed: function(ctx, now){
    [1046, 1318, 1568, 2093].forEach(function(f, i){ scheduleTone(ctx, now + i*0.08, f, f*1.01, 0.32, "sine", 0.08); });
  },
  // A muffled thump, then a thin ringing in the ears.
  deafened: function(ctx, now){
    scheduleNoise(ctx, now, 0.25, 0.12, 300);
    scheduleTone(ctx, now + 0.12, 3520, 3500, 0.9, "sine", 0.025);
  },
  // A trembling minor second over a low drone.
  frightened: function(ctx, now){
    for(var i = 0; i < 6; i++) scheduleTone(ctx, now + i*0.07, i % 2 ? 466 : 494, i % 2 ? 466 : 494, 0.08, "triangle", 0.07);
    scheduleTone(ctx, now, 73, 69, 0.7, "sawtooth", 0.05);
  },
  // Two squeezing tones as something grabs hold.
  grappled: function(ctx, now){
    scheduleTone(ctx, now, 110, 165, 0.18, "triangle", 0.15);
    scheduleTone(ctx, now + 0.16, 123, 98, 0.26, "triangle", 0.15);
  },
  // A dull falling tone.
  incapacitated: function(ctx, now){
    scheduleTone(ctx, now, 330, 165, 0.4, "triangle", 0.11);
  },
  // A shimmer that fades away.
  invisible: function(ctx, now){
    [1760, 1480, 1245, 1047].forEach(function(f, i){ scheduleTone(ctx, now + i*0.06, f, f*0.98, 0.3, "sine", 0.07 - i*0.012); });
  },
  // A crackle of sparks and a buzz.
  paralyzed: function(ctx, now){
    for(var i = 0; i < 10; i++){
      var f = 2200 + Math.random()*1600;
      scheduleTone(ctx, now + i*0.035 + Math.random()*0.015, f, f*0.7, 0.025, "square", 0.025);
    }
    scheduleTone(ctx, now, 60, 60, 0.45, "square", 0.04);
  },
  // Grinding stone settling with a heavy thud.
  petrified: function(ctx, now){
    scheduleNoise(ctx, now, 0.5, 0.14, 180);
    scheduleTone(ctx, now + 0.42, 90, 40, 0.3, "sine", 0.28);
  },
  // Bubbles rising.
  poisoned: function(ctx, now){
    for(var i = 0; i < 7; i++){
      var f = 300 + Math.random()*400;
      scheduleTone(ctx, now + i*0.06 + Math.random()*0.02, f, f*1.9, 0.06, "sine", 0.1);
    }
  },
  // A body hitting the floor.
  prone: function(ctx, now){
    scheduleTone(ctx, now, 190, 55, 0.24, "sine", 0.3);
    scheduleNoise(ctx, now, 0.12, 0.08, 500);
  },
  // Chain links clinking, then a clank.
  restrained: function(ctx, now){
    [0, 0.07, 0.16].forEach(function(t){
      var f = 1300 + Math.random()*500;
      scheduleTone(ctx, now + t, f, f*0.99, 0.12, "triangle", 0.07);
      scheduleTone(ctx, now + t, f*2.7, f*2.68, 0.06, "sine", 0.025);
    });
    scheduleTone(ctx, now + 0.28, 220, 140, 0.2, "triangle", 0.13);
  },
  // Little birds circling the head.
  stunned: function(ctx, now){
    for(var i = 0; i < 6; i++) scheduleTone(ctx, now + i*0.075, i % 2 ? 2637 : 2093, i % 2 ? 2793 : 2349, 0.06, "sine", 0.05);
  },
  // Slow notes falling asleep.
  unconscious: function(ctx, now){
    scheduleTone(ctx, now, 523, 523, 0.4, "sine", 0.08);
    scheduleTone(ctx, now + 0.25, 392, 392, 0.45, "sine", 0.07);
    scheduleTone(ctx, now + 0.55, 262, 247, 0.8, "sine", 0.07);
  }
};

/* A condition takes hold. */
export function playConditionOn(id){
  try{
    var ctx = getCtx();
    if(!ctx || !CONDITION_CUES[id]) return;
    CONDITION_CUES[id](ctx, ctx.currentTime);
  }catch(e){}
}

/* A condition ends: a light upward release. */
export function playConditionOff(){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    scheduleTone(ctx, now, 440, 880, 0.16, "sine", 0.1);
    scheduleTone(ctx, now + 0.09, 1175, 1318, 0.22, "sine", 0.06);
  }catch(e){}
}

/* A level of exhaustion: a heavy breath and a thud that sinks lower with
   each level (`up`), or a lighter breath rising as one goes. */
export function playExhaustion(level, up){
  try{
    var ctx = getCtx();
    if(!ctx) return;
    var now = ctx.currentTime;
    if(up){
      scheduleNoise(ctx, now, 0.55, 0.1, 700 - level*70);
      scheduleTone(ctx, now + 0.08, 150 - level*14, 70 - level*6, 0.4, "sine", 0.24);
    } else {
      scheduleNoise(ctx, now, 0.35, 0.06, 1100);
      scheduleTone(ctx, now + 0.05, 392, 587, 0.3, "sine", 0.08);
    }
  }catch(e){}
}
