/* ---------------- Confirm modal ----------------
   `extra`, when given, is an element shown under the message (a choice
   that goes with the confirmation) and taken out again on close. */
export function confirmDialog(title, body, onConfirm, extra){
  var modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-title").textContent = title;
  var bodyEl = document.getElementById("confirm-body");
  bodyEl.textContent = body;
  if(extra) bodyEl.after(extra);
  modal.classList.add("open");
  function cleanup(){
    modal.classList.remove("open");
    if(extra) extra.remove();
    okBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onCancel);
  }
  var okBtn = document.getElementById("confirm-ok");
  var cancelBtn = document.getElementById("confirm-cancel");
  function onOk(){ cleanup(); onConfirm(); }
  function onCancel(){ cleanup(); }
  okBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onCancel);
}
