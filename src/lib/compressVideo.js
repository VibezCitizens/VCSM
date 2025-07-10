import { FFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = new FFmpeg();
let isLoaded = false;

export async function compressVideo(file, onProgress = () => {}) {
  if (!isLoaded) {
    console.log('[ffmpeg] loading...');
    await ffmpeg.load({
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.15/dist/umd/ffmpeg-core.js',
    });
    console.log('[ffmpeg] loaded');
    isLoaded = true;
  }

  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  // ✅ Use new API: writeFile
 ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));


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

    const outputData = await ffmpeg.readFile(outputName); // ✅ Use new API
    const blob = new Blob([outputData.buffer], { type: 'video/mp4' });

    return new File([blob], `compressed-${Date.now()}-${file.name}`, {
      type: 'video/mp4',
      lastModified: Date.now(),
    });
  } catch (err) {
    console.error('[ffmpeg compress error]', err);
    throw err;
  } finally {
    // ✅ Use deleteFile instead of unlink
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  }
}
