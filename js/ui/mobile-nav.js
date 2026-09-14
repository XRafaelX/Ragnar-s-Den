/* ---------------- Sidebar mobile toggle ---------------- */
export function closeSidebarMobile(){
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("scrim").classList.remove("show");
}
export function setupMobileNav(){
  document.getElementById("hamburger").addEventListener("click", function(){
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("scrim").classList.add("show");
  });
  document.getElementById("scrim").addEventListener("click", closeSidebarMobile);
}
