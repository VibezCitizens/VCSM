// src/lib/compressVideo.js
import { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpegInstance = null;
let isLoadingFFmpeg = false;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  if (isLoadingFFmpeg) {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (ffmpegInstance) {
          clearInterval(interval);
          resolve(ffmpegInstance);
        }
      }, 100);
    });
  }

  isLoadingFFmpeg = true;
  try {
    console.log('Loading ffmpeg...');
    ffmpegInstance = new FFmpeg({
      log: true,
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    });

    await ffmpegInstance.load();
    console.log('ffmpeg loaded.');
    return ffmpegInstance;
  } catch (error) {
    console.error('❌ Failed to load ffmpeg:', error);
    ffmpegInstance = null;
    throw error;
  } finally {
    isLoadingFFmpeg = false;
  }
}

export async function compressVideo(file, onProgress = () => {}) {
  if (typeof onProgress !== 'function') {
    console.warn('onProgress is not a function, using noop');
    onProgress = () => {};
  }

  const ffmpeg = await getFFmpeg();
  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  try {
    ffmpeg.setProgress(({ ratio }) => {
      if (ratio >= 0 && ratio <= 1) {
        onProgress(Math.floor(ratio * 100));
      }
    });

    console.log('Writing file to virtual FS...');
    await ffmpeg.writeFile(inputName, file);

    console.log('Running ffmpeg...');
    await ffmpeg.run(
      '-i', inputName,
      '-vcodec', 'libx264',
      '-crf', '28',
      '-preset', 'veryfast',
      '-movflags', '+faststart',
      outputName
    );

    console.log('Reading output...');
    const data = await ffmpeg.readFile(outputName);

    return new File([data.buffer], `compressed-${file.name}`, {
      type: 'video/mp4',
    });
  } finally {
    try {
      ffmpeg.deleteFile(inputName);
      ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }
  }
}
