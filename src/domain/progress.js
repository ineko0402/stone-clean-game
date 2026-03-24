export function calculateProgress(context, width, height) {
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  let transparentCount = 0;
  const total = width * height;

  for (let index = 3; index < data.length; index += 4) {
    const alpha = data[index];

    if (alpha === 0) {
      transparentCount++;
    }
  }

  return transparentCount / total;
}
