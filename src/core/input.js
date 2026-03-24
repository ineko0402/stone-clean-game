export function setupPointer(canvas, onMove) {
  let isActive = false;

  canvas.addEventListener("mousedown", () => (isActive = true));
  canvas.addEventListener("mouseup", () => (isActive = false));

  canvas.addEventListener("mousemove", (event) => {
    if (!isActive) return;

    const rect = canvas.getBoundingClientRect();
    const position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    onMove(position);
  });
}
