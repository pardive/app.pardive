export async function getCroppedImage(
  imageSrc: string,
  crop: any
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;

  await new Promise((res) => (image.onload = res));

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    512,
    512
  );

  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9)
  );
}
