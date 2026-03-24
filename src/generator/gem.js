export function generateGem(context, width, height) {
  const cx = width / 2;
  const cy = height / 2;

  context.fillStyle = "blue";

  context.beginPath();
  context.moveTo(cx, cy - 60);
  context.lineTo(cx + 40, cy);
  context.lineTo(cx, cy + 60);
  context.lineTo(cx - 40, cy);
  context.closePath();
  context.fill();
}
