/* ---------------- Confirm modal ---------------- */
export function confirmDialog(title, body, onConfirm){
  var modal = document.getElementById("confirm-modal");
  document.getElementById("confirm-title").textContent = title;
  document.getElementById("confirm-body").textContent = body;
  modal.classList.add("open");
  function cleanup(){
    modal.classList.remove("open");
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
