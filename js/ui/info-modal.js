/* ---------------- Generic read-only info modal ----------------
   Used by the Information tab to keep the main screen short: tap a
   row, see the details in a modal, close it, move on. */
export function openInfoModal(title, buildContent){
  var modal = document.getElementById("info-modal");
  var body = document.getElementById("info-modal-body");
  document.getElementById("info-modal-title").textContent = title;
  body.innerHTML = "";
  buildContent(body);
  modal.classList.add("open");

  var closeBtn = document.getElementById("info-modal-close");
  function onClose(){
    modal.classList.remove("open");
    closeBtn.removeEventListener("click", onClose);
  }
  closeBtn.addEventListener("click", onClose);
}
