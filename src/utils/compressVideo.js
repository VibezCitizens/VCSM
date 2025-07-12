import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();
let isLoaded = false;

/**
 * Compresses a video to 9:16 (vertical) and returns a compressed File.
 * @param {File} file - The original video file.
 * @param {function(number): void} [onProgress=(() => {})] - Optional progress callback (0–100).
 * @returns {Promise<File>} - Compressed video file.
 */
export async function compressVideo(file, onProgress = () => {}) {
  // Load FFmpeg with a proper corePath to avoid MIME issues in dev
  if (!isLoaded) {
    console.log('[ffmpeg] loading...');
    try {
      await ffmpeg.load({
        corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      });
      console.log('[ffmpeg] loaded');
      isLoaded = true;
    } catch (loadError) {
      console.error('[ffmpeg] failed to load:', loadError);
      throw new Error('Failed to load FFmpeg.');
    }
  }

  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  try {
    // Write video into FFmpeg's virtual FS
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Progress
    ffmpeg.on('progress', ({ progress }) => {
      if (progress >= 0 && typeof onProgress === 'function') {
        onProgress(Math.round(progress * 100));
      }
    });

    // Compress and resize to vertical 720x1280 (9:16)
    await ffmpeg.exec([
      '-i', inputName,
      '-vf', 'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2,setsar=1',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '28',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', 'faststart',
      outputName,
    ]);

    const outputData = await ffmpeg.readFile(outputName);
    const blob = new Blob([outputData.buffer], { type: 'video/mp4' });

    return new File([blob], `compressed-${Date.now()}-${file.name}`, {
      type: 'video/mp4',
      lastModified: Date.now(),
    });

  } catch (err) {
    console.error('[ffmpeg compress error]', err);
    throw err;
  } finally {
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch (cleanupError) {
      console.warn('[ffmpeg] cleanup failed', cleanupError);
    }
  }
}