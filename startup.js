(() => {
  const intro = document.getElementById("startupIntro");
  const skip = document.getElementById("skipIntro");
  if (!intro) return;
  const key = "wellauschecker_intro_seen_v2";
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    intro.classList.add("intro-hidden");
    window.setTimeout(() => intro.remove(), 750);
  };
  // Skip must respond immediately; the CSS failsafe also dismisses the intro
  // if JavaScript is delayed or blocked by the browser.
  if (skip) {
    skip.addEventListener("click", (event) => { event.preventDefault(); finish(); });
    skip.addEventListener("touchend", (event) => { event.preventDefault(); finish(); }, { passive: false });
  }
  try {
    if (localStorage.getItem(key) === "1") { finish(); return; }
    localStorage.setItem(key, "1");
  } catch (_) {}
  window.setTimeout(finish, 3000);
})();
