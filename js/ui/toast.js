var hideTimer = null;

/* A generic top-of-screen confirmation toast, separate from the dice
   roll toast so success messages don't fight over the same element
   while the dice tray/catalog overlay may also be open. */
export function showActionToast(message, isError){
  var toast = document.getElementById("action-toast");
  if(!toast) return;
  toast.textContent = message;
  toast.classList.toggle("error", !!isError);
  toast.classList.add("show");
  if(hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(function(){
    toast.classList.remove("show");
  }, 2600);
}
