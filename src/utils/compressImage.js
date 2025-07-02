export async function compressImageFile(file, maxSize = 1024, quality = 0.8) {
  const imageBitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');

  const scale = Math.min(maxSize / imageBitmap.width, maxSize / imageBitmap.height, 1);
  canvas.width = imageBitmap.width * scale;
  canvas.height = imageBitmap.height * scale;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
        resolve(compressedFile);
      },
      'image/jpeg',
      quality
    );
  });
}
