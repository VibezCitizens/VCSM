// src/lib/compressVideo.js
import { FFmpeg } from '@ffmpeg/ffmpeg'; // Import the FFmpeg class (capital F)

// Initialize ffmpeg instance ONCE to avoid repeated loading
let ffmpegInstance = null;
let isLoadingFFmpeg = false; // To prevent multiple simultaneous loads

async function getFFmpeg() {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (isLoadingFFmpeg) {
    // Wait until loading is complete if already in progress
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (ffmpegInstance) {
          clearInterval(checkInterval);
          resolve(ffmpegInstance);
        }
      }, 100);
    });
  }

  isLoadingFFmpeg = true;
  console.log('Loading ffmpeg...');
  try {
    // Instantiate the FFmpeg class
    ffmpegInstance = new FFmpeg({
      log: true,
      // IMPORTANT: Ensure this corePath is correct for your @ffmpeg/core version.
      // This path typically points to the UMD build of @ffmpeg/core.
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
      // If you're hosting locally: e.g., '/ffmpeg-core/ffmpeg-core.js',
    });

    await ffmpegInstance.load();
    console.log('ffmpeg loaded.');
    return ffmpegInstance;
  } catch (error) {
    console.error('Failed to load ffmpeg:', error);
    ffmpegInstance = null; // Reset to allow re-attempt
    throw error;
  } finally {
    isLoadingFFmpeg = false;
  }
}

export async function compressVideo(file, onProgress = () => {}) {
  const ffmpeg = await getFFmpeg();

  const inputName = 'input.mp4';
  const outputName = 'output.mp4';

  // Listen to ffmpeg progress (optional but good for UX)
  ffmpeg.setProgress(({ ratio }) => {
    // ratio is from 0 to 1, or -1 if not available
    if (ratio >= 0) {
      onProgress(Math.floor(ratio * 100));
    }
  });

  console.log('Writing file to ffmpeg FS...');
  // Pass the File object directly. The FFmpeg instance's writeFile method
  // automatically handles Blob/File objects.
  ffmpeg.writeFile(inputName, file); // <--- Note: writeFile is a method of the FFmpeg instance, not FS.writeFile()

  console.log('Running ffmpeg command...');
  await ffmpeg.run(
    '-i', inputName,
    '-vcodec', 'libx264',
    '-crf', '28',
    '-preset', 'veryfast',
    '-movflags', '+faststart',
    outputName
  );
  console.log('ffmpeg command complete.');

  console.log('Reading compressed file from ffmpeg FS...');
  const data = await ffmpeg.readFile(outputName); // <--- Note: readFile is a method of the FFmpeg instance

  // Clean up virtual files
  ffmpeg.deleteFile(inputName); // <--- Note: deleteFile is a method of the FFmpeg instance
  ffmpeg.deleteFile(outputName);

  return new File([data.buffer], `compressed-${file.name}`, {
    type: 'video/mp4',
  });
}