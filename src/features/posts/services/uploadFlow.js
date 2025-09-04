// src/features/posts/services/uploadFlow.js
import { supabase } from '@/lib/supabaseClient';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare'; // keep as-is for fallback
import { compressVideo } from '@/utils/compressVideo';
import { enqueueUpload } from '@/utils/bgUpload'; // ← NEW

/** Product limits */
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_24DROP_SECONDS = 15;

/** “#funny, dance” -> ['funny','dance'] */
function parseTags(input) {
  if (!input) return [];
  return input
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => t.replace(/^#/, '').toLowerCase());
}

/** Robust inference (never returns null for POST mode) */
function inferMediaTypeFromFile(file, fallbackWhenNoFile = 'text') {
  if (!file) return fallbackWhenNoFile; // text post (POST mode)
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (/\.(png|jpe?g|gif|webp|avif)$/i.test(name)) return 'image';
  if (/\.(mp4|mov|webm|mkv|m4v)$/i.test(name)) return 'video';
  return 'image'; // has a file but unknown => treat as image
}

function sanitizeFilename(name, ts) {
  const base = (name || `${ts}`)
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');
  return `${ts}-${base}`;
}

/** Storage paths are independent of DB tables; keep whatever structure you like */
function getStorageKey({ mode, isActingAsVPort, actorUserId, actorVportId, filename }) {
  const ts = Date.now();
  const safe = sanitizeFilename(filename, ts);
  if (mode === '24DROP') {
    return isActingAsVPort
      ? { key: `vport_stories/${actorVportId}/${safe}`, ts }
      : { key: `stories/${actorUserId}/${safe}`, ts };
  }
  if (mode === 'VDROP') {
    // even though we store under "vdrops/", we will insert into posts/vport_posts
    return isActingAsVPort
      ? { key: `vport_vdrops/${actorVportId}/${safe}`, ts }
      : { key: `vdrops/${actorUserId}/${safe}`, ts };
  }
  // POST
  return isActingAsVPort
    ? { key: `vport_posts/${actorVportId}/${safe}`, ts }
    : { key: `posts/${actorUserId}/${safe}`, ts };
}

function readVideoDuration(file) {
  return new Promise((resolve, reject) => {
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.src = url;
      video.onloadedmetadata = () => {
        const d = Number(video.duration) || 0;
        URL.revokeObjectURL(url);
        resolve(d);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not read video metadata.'));
      };
    } catch (e) {
      reject(e);
    }
  });
}

/** Timeout guard to prevent indefinite hangs */
function withTimeout(promise, ms, label = 'Operation') {
  let t;
  return new Promise((resolve, reject) => {
    t = setTimeout(() => reject(Object.assign(new Error(`${label} timed out after ${ms}ms`), { code: 'TIMEOUT' })), ms);
    promise.then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); }
    );
  });
}

/**
 * Try to enqueue a background upload via SW using an adapter from uploadToCloudflare.
 * This EXPECTS your uploadToCloudflare to optionally expose:
 *   - getBackgroundJob(file, key) -> { url, method, headers, fields, filename, contentType, publicUrl }
 * If it isn't present, this will return null and the caller should fall back to direct upload.
 */
async function tryEnqueueBackgroundUpload(fileToSend, key) {
  // no SW available → opt out
  if (!('serviceWorker' in navigator)) return null;
  if (typeof uploadToCloudflare.getBackgroundJob !== 'function') return null;

  const job = await uploadToCloudflare.getBackgroundJob(fileToSend, key);
  if (!job || !job.url) return null;

  await enqueueUpload({
    url: job.url,
    method: job.method || 'POST',
    headers: job.headers || {},
    fields: job.fields || { key },
    fileBlob: fileToSend,
    filename: job.filename || fileToSend.name,
    contentType: job.contentType || fileToSend.type || 'application/octet-stream',
  });

  // Return the public URL we can write to DB immediately (deterministic from key)
  return job.publicUrl || null;
}

/**
 * Main upload flow. Returns { ok: true, id?, enqueued? } on success; throws on error.
 */
export async function runUpload({
  mode,                 // 'POST' | '24DROP' | 'VDROP'
  isActingAsVPort,
  actorUserId,
  actorVportId,
  file,
  mediaType: _uiMediaType, // UI hint only; ignored for safety
  filePreviewUrl,       // unused
  croppedAreaPixels,    // TODO: integrate crop pipeline if applicable
  title,
  description,
  category,
  tags,
  visibility,
  setProgress,
  setCompressionProgress,
}) {
  // 0) auth sanity
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) throw new Error('You must be logged in.');
  const userId = authData.user.id;

  // 1) Decide media type deterministically
  const inferredType = inferMediaTypeFromFile(file, mode === 'POST' ? 'text' : null);
  if (!inferredType && mode !== 'POST') {
    throw new Error('Select a file to upload.');
  }

  // 2) Validate size
  if (file) {
    const maxBytes = inferredType === 'video' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      const err = new Error(`Max ${inferredType} size is 25MB.`);
      err.code = 'FILE_TOO_LARGE';
      throw err;
    }
  }

  // 3) Video handling (compression still happens in-page)
  let uploadFile = file;
  if (inferredType === 'video') {
    if (typeof setProgress === 'function') setProgress('Analyzing video…');
    const duration = await readVideoDuration(file);

    // Timeouts to avoid indefinite hangs during ffmpeg/wrapper operations
    const TRIM_TIMEOUT_MS = 120_000; // 2 minutes
    const OPT_TIMEOUT_MS  = 90_000;  // 1.5 minutes

    if (mode === '24DROP' && duration > MAX_24DROP_SECONDS + 0.25) {
      if (typeof setProgress === 'function') setProgress('Trimming to 15s…');
      try {
        const trimmed = await withTimeout(
          compressVideo(file, {
            maxDurationSeconds: MAX_24DROP_SECONDS,
            onProgress: setCompressionProgress,
          }),
          TRIM_TIMEOUT_MS,
          'Trimming'
        );
        if (!(trimmed instanceof Blob)) {
          const err = new Error('Video trimmer returned no file.');
          err.code = 'TRIM_RETURN_INVALID';
          throw err;
        }
        uploadFile = trimmed;
        if (typeof setProgress === 'function') setProgress('Trim complete. Preparing upload…');
      } catch (e) {
        if (e?.code === 'TIMEOUT') {
          const err = new Error('Video trimming is taking too long. Please try a shorter clip or different file.');
          err.code = 'TRIM_TIMEOUT';
          throw err;
        }
        const err = new Error('24DROP videos must be 15 seconds or shorter.');
        err.code = 'VIDEO_TOO_LONG';
        throw err;
      }
    } else {
      if (typeof setProgress === 'function') setProgress('Optimizing video…');
      try {
        const optimized = await withTimeout(
          compressVideo(file, { onProgress: setCompressionProgress }),
          OPT_TIMEOUT_MS,
          'Video optimization'
        );
        if (optimized instanceof Blob) uploadFile = optimized;
      } catch {
        // keep original on compression failure
      } finally {
        if (typeof setProgress === 'function') setProgress('Preparing upload…');
      }
    }
  }

  // 4) Pure text POST: insert directly
  if (mode === 'POST' && !file) {
    if (isActingAsVPort) {
      const payload = {
        vport_id: actorVportId,
        created_by: userId,              // auth.users.id
        title: title?.trim() || null,
        body: (description || '').trim(),
        media_type: 'text',
        media_url: '',                   // NEVER NULL
      };
      const { data, error } = await supabase
        .from('vport_posts')
        .insert([payload])
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: data?.id };
    } else {
      const payload = {
        user_id: actorUserId,            // profiles.id == auth.users.id
        title: title?.trim() || null,
        text: (description || '').trim(),// posts.text
        tags: parseTags(tags),           // text[]
        visibility: visibility || 'public',
        media_type: 'text',
        media_url: '',                   // NEVER NULL
      };
      const { data, error } = await supabase
        .from('posts')
        .insert([payload])
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: data?.id };
    }
  }

  // 5) Compute storage key (used by both paths)
  const { key } = getStorageKey({
    mode,
    isActingAsVPort,
    actorUserId,
    actorVportId,
    filename: uploadFile?.name,
  });

  // 6) Try background upload via SW first (non-blocking UI)
  if (typeof setProgress === 'function') setProgress('Queuing upload…');
  let mediaUrlFromBg = null;
  try {
    mediaUrlFromBg = await tryEnqueueBackgroundUpload(uploadFile, key);
  } catch (_) {
    // ignore; fall back to direct upload below
  }

  // 7) If background enqueued successfully AND we have a deterministic public URL,
  //    write the DB row now and return (UI is free to navigate away).
  if (mediaUrlFromBg) {
    const url = mediaUrlFromBg;
    if (mode === '24DROP') {
      const row = isActingAsVPort
        ? {
            vport_id: actorVportId,
            created_by: userId,
            media_url: url,
            media_type: inferredType,
            caption: (description || '').trim(),
          }
        : {
            user_id: actorUserId,
            media_url: url,
            media_type: inferredType,
            caption: (description || '').trim(),
          };
      const { error } = await supabase
        .from(isActingAsVPort ? 'vport_stories' : 'stories')
        .insert([row]);
      if (error) throw new Error(error.message);
      return { ok: true, enqueued: true };
    }

    if (mode === 'VDROP') {
      const row = isActingAsVPort
        ? {
            vport_id: actorVportId,
            created_by: userId,
            title: (title || '').trim() || null,
            body: (description || '').trim(),
            media_url: url,
            media_type: 'video',
          }
        : {
            user_id: actorUserId,
            title: (title || '').trim() || null,
            text: (description || '').trim(),
            tags: parseTags(tags),
            visibility: visibility || 'public',
            media_url: url,
            media_type: 'video',
            category: (category || '').trim() || null,
          };
      const table = isActingAsVPort ? 'vport_posts' : 'posts';
      const { data, error } = await supabase.from(table).insert([row]).select('id').single();
      if (error) throw new Error(error.message);
      return { ok: true, id: data?.id, enqueued: true };
    }

    // mode === 'POST' with file
    if (isActingAsVPort) {
      const row = {
        vport_id: actorVportId,
        created_by: userId,
        title: (title || '').trim() || null,
        body: (description || '').trim(),
        media_url: url,
        media_type: inferredType === 'video' ? 'video' : 'image',
      };
      const { data, error } = await supabase
        .from('vport_posts')
        .insert([row])
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: data?.id, enqueued: true };
    } else {
      const row = {
        user_id: actorUserId,
        title: (title || '').trim() || null,
        text: (description || '').trim(),
        tags: parseTags(tags),
        visibility: visibility || 'public',
        media_url: url,
        media_type: inferredType === 'video' ? 'video' : 'image',
        category: (category || '').trim() || null,
      };
      const { data, error } = await supabase
        .from('posts')
        .insert([row])
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: data?.id, enqueued: true };
    }
  }

  // 8) Fallback: direct upload (original behavior)
  if (typeof setProgress === 'function') setProgress('Uploading media…');
  const { url, error: uploadErr } = await uploadToCloudflare(uploadFile, key);
  if (uploadErr) throw new Error(uploadErr);
  if (!url) throw new Error('Upload returned no URL.');

  // 9) Insert into the correct table per mode (same as before)
  if (mode === '24DROP') {
    const row = isActingAsVPort
      ? {
          vport_id: actorVportId,
          created_by: userId,
          media_url: url,
          media_type: inferredType,
          caption: (description || '').trim(),
        }
      : {
          user_id: actorUserId,
          media_url: url,
          media_type: inferredType,
          caption: (description || '').trim(),
        };

    const { error } = await supabase
      .from(isActingAsVPort ? 'vport_stories' : 'stories')
      .insert([row]);
    if (error) throw new Error(error.message);
    return { ok: true };
  }

  if (mode === 'VDROP') {
    const row = isActingAsVPort
      ? {
          vport_id: actorVportId,
          created_by: userId,
          title: (title || '').trim() || null,
          body: (description || '').trim(),
          media_url: url,
          media_type: 'video',
        }
      : {
          user_id: actorUserId,
          title: (title || '').trim() || null,
          text: (description || '').trim(),
          tags: parseTags(tags),
          visibility: visibility || 'public',
          media_url: url,
          media_type: 'video',
          category: (category || '').trim() || null,
        };

    const table = isActingAsVPort ? 'vport_posts' : 'posts';
    const { data, error } = await supabase.from(table).insert([row]).select('id').single();
    if (error) throw new Error(error.message);
    return { ok: true, id: data?.id };
  }

  // mode === 'POST' with file (image or video post)
  if (isActingAsVPort) {
    const row = {
      vport_id: actorVportId,
      created_by: userId,
      title: (title || '').trim() || null,
      body: (description || '').trim(),
      media_url: url,
      media_type: inferredType === 'video' ? 'video' : 'image',
    };
    const { data, error } = await supabase
      .from('vport_posts')
      .insert([row])
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: data?.id };
  } else {
    const row = {
      user_id: actorUserId,
      title: (title || '').trim() || null,
      text: (description || '').trim(),
      tags: parseTags(tags),
      visibility: visibility || 'public',
      media_url: url,
      media_type: inferredType === 'video' ? 'video' : 'image',
      category: (category || '').trim() || null,
    };
    const { data, error } = await supabase
      .from('posts')
      .insert([row])
      .select('id')
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: data?.id };
  }
}
