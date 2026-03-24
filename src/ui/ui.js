export function updateProgressText(element, percent) {
  element.textContent = percent + "%";
}

export function showClear(element) {
  element.textContent = "クリア！";
}

function updateProgressBar(element, percent) {
  element.style.width = percent + "%";
}
function showClearEffect() {
  const el = document.createElement("div");
  el.textContent = "CLEAR!";
  el.className = "clear";
  document.body.appendChild(el);
}
