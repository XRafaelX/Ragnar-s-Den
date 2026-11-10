import { revealedBounds } from "./core/dungeons.js";
import { savedPlayerMap, watchAsPlayers } from "./core/dungeon-sync.js";
import { drawPlayersScreen, playersFit, isSeen, prepareCanvas, MAP_COLORS } from "./render/dungeon-canvas.js";

/* ---------------- The players' screen ----------------
   Shows the dungeon the DM presents (js/core/dungeon-sync.js) under
   fog, with only what the DM has shown in the clear. The view zooms to
   fit what has been shown and glides to the new fit as more appears,
   so the players never see how big the whole map is. Newly shown
   ground comes out of the fog over FADE_MS. Nothing here can change the
   map: it is a screen to look at. */

var GLIDE = 0.14;       // how far the view moves toward its fit each frame
var FADE_MS = 900;      // how long newly shown ground takes to come out of the fog

var canvas = document.getElementById("pv-map");
var wait = document.getElementById("pv-wait");
var waitName = document.getElementById("pv-wait-name");
var waitText = document.getElementById("pv-wait-text");
var fullBtn = document.getElementById("pv-full");

var map = null;      // the players' map (core playerView), or null
var cam = null;      // where the view is: { x, y } the middle in squares, { scale } pixels per square
var goal = null;     // where it is gliding to
var frame = 0;
var fades = {};      // square index -> when it started coming out of the fog
var still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function show(next){
  var firstLook = !map || !next || map.id !== next.id || map.w !== next.w || map.h !== next.h;
  if(!firstLook && !still) startFades(map, next);
  if(firstLook) fades = {};
  map = next;
  document.title = (map ? map.name + " · " : "") + "Players' view";
  goal = target();
  if(firstLook || !cam || still) cam = goal ? { x: goal.x, y: goal.y, scale: goal.scale } : null;
  waitScreen();
  draw();
}

/* The view that fits what is shown, in CSS pixels, or null. */
function target(){
  return playersFit(map, window.innerWidth, window.innerHeight);
}

/* Every square the players couldn't see before and can now starts to
   fade in. */
function startFades(before, after){
  var now = performance.now();
  for(var y = 0; y < after.h; y++) for(var x = 0; x < after.w; x++){
    if(isSeen(after, x, y) && !isSeen(before, x, y)) fades[y * after.w + x] = now;
  }
}

/* How thick the fog is on a square right now, and whether any square is
   still fading. */
var fading = false;
function fogAmount(now){
  fading = false;
  return function(x, y){
    if(!isSeen(map, x, y)) return 1;
    var i = y * map.w + x, start = fades[i];
    if(start === undefined) return 0;
    var t = (now - start) / FADE_MS;
    if(t >= 1){ delete fades[i]; return 0; }
    fading = true;
    return 1 - t * t * (3 - 2 * t);
  };
}

function waitScreen(){
  var nothing = !map || !revealedBounds(map);
  wait.hidden = !nothing;
  if(!nothing) return;
  waitName.textContent = map ? map.name : "";
  waitText.textContent = map
    ? "The DM will show you the way soon."
    : "Waiting for the DM. Open a dungeon in Ragnar's Den and press Player view.";
}

function draw(){
  if(frame) return;
  frame = requestAnimationFrame(function(){
    frame = 0;
    paint();
    if(glide() || fading) draw();
  });
}

/* Moves the view a step toward its goal. True while still moving. */
function glide(){
  if(!cam || !goal) return false;
  var dx = goal.x - cam.x, dy = goal.y - cam.y, ds = goal.scale - cam.scale;
  if(Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01 && Math.abs(ds) < 0.05){
    cam = { x: goal.x, y: goal.y, scale: goal.scale };
    return false;
  }
  cam.x += dx * GLIDE;
  cam.y += dy * GLIDE;
  cam.scale += ds * GLIDE;
  return true;
}

function paint(){
  var c = prepareCanvas(canvas, window.innerWidth, window.innerHeight);
  if(!map || !cam){
    c.ctx.fillStyle = MAP_COLORS.fog;
    c.ctx.fillRect(0, 0, c.width, c.height);
    return;
  }
  drawPlayersScreen(c.ctx, map, { x: cam.x, y: cam.y, scale: cam.scale * c.dpr }, c.width, c.height, fogAmount(performance.now()));
}

window.addEventListener("resize", function(){
  goal = target();
  if(goal) cam = { x: goal.x, y: goal.y, scale: goal.scale };
  draw();
});

/* ---- Full screen ---- */
function toggleFull(){
  if(document.fullscreenElement) document.exitFullscreen().catch(function(){});
  else if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(function(){});
}
fullBtn.addEventListener("click", toggleFull);
canvas.addEventListener("dblclick", toggleFull);
document.addEventListener("keydown", function(e){
  if(e.key === "f" || e.key === "F") toggleFull();
});
document.addEventListener("fullscreenchange", function(){
  document.body.classList.toggle("full", !!document.fullscreenElement);
  fullBtn.setAttribute("aria-label", document.fullscreenElement ? "Leave full screen" : "Full screen");
});
if(!document.documentElement.requestFullscreen) fullBtn.hidden = true;

/* The button and the pointer fade away while nobody moves the mouse. */
var idleTimer = 0;
function awake(){
  document.body.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(function(){ document.body.classList.add("idle"); }, 2500);
}
["mousemove", "pointerdown", "keydown"].forEach(function(t){ document.addEventListener(t, awake); });
awake();

/* Keeps a TV or laptop from going to sleep in the middle of a session. */
var wakeLock = null;
function keepAwake(){
  if(!navigator.wakeLock || document.visibilityState !== "visible" || wakeLock) return;
  navigator.wakeLock.request("screen").then(function(lock){
    wakeLock = lock;
    lock.addEventListener("release", function(){ wakeLock = null; });
  }).catch(function(){});
}
document.addEventListener("visibilitychange", keepAwake);
keepAwake();

show(savedPlayerMap());
watchAsPlayers(show);
