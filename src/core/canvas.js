export function createCanvas(width, height) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  return { canvas, context, width, height };
}
