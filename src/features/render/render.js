export function render(viewContext, layers, width, height) {
  viewContext.clearRect(0, 0, width, height);

  layers.forEach((layer) => {
    viewContext.drawImage(layer.context.canvas, 0, 0);
  });
}
