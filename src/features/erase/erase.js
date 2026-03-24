export function erase(context, position, size) {
  context.globalCompositeOperation = "destination-out";

  context.beginPath();
  context.arc(position.x, position.y, size, 0, Math.PI * 2);
  context.fill();

  context.globalCompositeOperation = "source-over";
}
