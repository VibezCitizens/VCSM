import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg();
let isLoaded = false;

export async function compressVideo(file, onProgress = () => {}) {
  if (!isLoaded) {
    console.log('[ffmpeg] loading...');
    await ffmpeg.load({
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/ffmpeg-core.js',
    });
    console.log('[ffmpeg] loaded');
    isLoaded = true;
  }

  const inputName = 'input.mp4';
  const outputName = 'output.mp4';
  const inputData = new Uint8Array(await file.arrayBuffer());

  ffmpeg.FS('writeFile', inputName, inputData);

  ffmpeg.setProgress(({ ratio }) => {
    if (typeof onProgress === 'function' && ratio >= 0) {
      onProgress(Math.floor(ratio * 100));
    }
  });

  try {
    await ffmpeg.run(
      '-i', inputName,
      '-vcodec', 'libx264',
      '-crf', '28',
      '-preset', 'veryfast',
      '-movflags', '+faststart',
      outputName
    );

    const outputData = ffmpeg.FS('readFile', outputName);
    const blob = new Blob([outputData.buffer], { type: 'video/mp4' });

    // Return a File compatible with your upload system
    return new File([blob], `compressed-${Date.now()}-${file.name}`, {
      type: 'video/mp4',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.error('[ffmpeg compress error]', err);
    throw err;
  } finally {
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);
  }
}
