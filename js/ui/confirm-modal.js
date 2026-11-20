/* ---------------- Confirm modal ----------------
   `extra`, when given, is an element shown under the message (a choice
   that goes with the confirmation) and taken out again on close.
   `labels`, when given, renames the buttons ({ok, cancel}) and with
   `safe: true` shows the OK button as a plain action, not a red one. The
   usual "Confirm" / "Cancel" come back on close. */
export function confirmDialog(title, body, onConfirm, extra, labels){
  var modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-title").textContent = title;
  var bodyEl = document.getElementById("confirm-body");
  bodyEl.textContent = body;
  if(extra) bodyEl.after(extra);
  var okBtn = document.getElementById("confirm-ok");
  var cancelBtn = document.getElementById("confirm-cancel");
  if(labels){
    if(labels.ok) okBtn.textContent = labels.ok;
    if(labels.cancel) cancelBtn.textContent = labels.cancel;
    if(labels.safe){ okBtn.classList.remove("danger"); okBtn.classList.add("primary"); }
  }
  modal.classList.add("open");
  function cleanup(){
    modal.classList.remove("open");
    if(extra) extra.remove();
    if(labels){
      okBtn.textContent = "Confirm";
      cancelBtn.textContent = "Cancel";
      okBtn.classList.remove("primary"); okBtn.classList.add("danger");
    }
    okBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onCancel);
  }
  function onOk(){ cleanup(); onConfirm(); }
  function onCancel(){ cleanup(); }
  okBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onCancel);
}
