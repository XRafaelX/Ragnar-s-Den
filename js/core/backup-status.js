/* ---------------- Backup status ----------------
   Saved data lives only in this browser, so a backup file is the one
   copy that survives the browser clearing it. This remembers when the
   last backup was saved and when the first change after it was made,
   so the app can remind a player whose changes have gone a while
   without a backup (and never one who changed nothing since). It also
   measures how much of the browser's space the saved data takes. */

var KEY = "ragnarsDen.backupStatus.v1";
var DAY = 24 * 60 * 60 * 1000;
export var REMIND_AFTER_DAYS = 14;
export var SNOOZE_DAYS = 7;
/* Browsers give a site about 5 million characters of localStorage. */
export var STORAGE_LIMIT = 5000000;

var cache = null;   // {backedUpAt, changedSince, snoozedUntil}, times in ms

function read(){
  if(cache) return cache;
  cache = {backedUpAt: null, changedSince: null, snoozedUntil: null};
  try{
    var s = JSON.parse(localStorage.getItem(KEY) || "null");
    if(s && typeof s === "object") Object.keys(cache).forEach(function(k){ if(typeof s[k] === "number") cache[k] = s[k]; });
  }catch(e){}
  return cache;
}
function write(){
  try{ localStorage.setItem(KEY, JSON.stringify(cache)); }catch(e){}
}

/* Called by every save of the player's data. Only the first change after
   a backup is written down, so a save costs nothing more after that. */
export function noteChange(now){
  var s = read();
  if(s.changedSince) return;
  s.changedSince = now || Date.now();
  write();
}

/* A backup file holding everything was just saved. */
export function markBackedUp(now){
  var s = read();
  s.backedUpAt = now || Date.now();
  s.changedSince = null;
  s.snoozedUntil = null;
  write();
}

/* "Later" on the reminder. */
export function snoozeReminder(now){
  read().snoozedUntil = (now || Date.now()) + SNOOZE_DAYS * DAY;
  write();
}

/* True when changes have waited REMIND_AFTER_DAYS for a backup and the
   reminder isn't snoozed. */
export function backupReminderDue(now){
  var s = read();
  now = now || Date.now();
  if(!s.changedSince || now - s.changedSince < REMIND_AFTER_DAYS * DAY) return false;
  return !(s.snoozedUntil && now < s.snoozedUntil);
}

function daysAgo(t, now){
  var d = Math.floor((now - t) / DAY);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : d + " days ago";
}

/* The reminder's sentence. */
export function backupReminderText(now){
  var s = read();
  now = now || Date.now();
  return (s.backedUpAt ? "Your last backup was " + daysAgo(s.backedUpAt, now) + "." : "You haven't saved a backup yet.") +
    " Save one to keep your characters safe.";
}

/* "Last backup: 12 days ago" for Import & Export. */
export function lastBackupText(now){
  var s = read();
  return "Last backup: " + (s.backedUpAt ? daysAgo(s.backedUpAt, now || Date.now()) : "never");
}

/* Characters of localStorage this site uses (keys and values). */
export function storageUsed(){
  var n = 0;
  try{
    for(var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      n += k.length + (localStorage.getItem(k) || "").length;
    }
  }catch(e){}
  return n;
}

/* The space line: {text, warn}. warn from 80% of the limit. */
export function storageNote(used){
  var mb = function(n){ return (Math.round(n / 100000) / 10).toFixed(1); };
  var warn = used >= STORAGE_LIMIT * 0.8;
  var text = "Space used: " + mb(used) + " MB of about " + mb(STORAGE_LIMIT) + " MB.";
  if(warn) text += " Export a backup now, then remove what you don't need to make room.";
  return {text: text, warn: warn};
}

/* For tests: forget the cached status (localStorage was changed by hand). */
export function resetBackupStatusCache(){ cache = null; }
