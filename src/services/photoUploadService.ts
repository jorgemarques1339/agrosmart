
import { supabase } from './supabaseClient';

const BUCKET = 'field-logs';

/**
 * Compresses an image File to max 1200px / 0.82 quality (JPEG).
 */
const compressImage = (file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            const scale = Math.min(1, maxWidth / img.width);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
                (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
                'image/jpeg',
                quality
            );
        };
        img.onerror = reject;
        img.src = url;
    });

/**
 * Uploads a single photo File to Supabase Storage bucket 'field-logs'.
 * Path: {fieldId}/{logId}/{timestamp}.jpg
 * Returns the public URL.
 */
export const uploadFieldLogPhoto = async (
    file: File,
    fieldId: string,
    logId: string
): Promise<string> => {
    const ext = file.type.includes('png') ? 'png' : 'jpg';
    const path = `${fieldId}/${logId}/${Date.now()}.${ext}`;

    let blob: Blob = file;
    if (!file.type.includes('png')) {
        try { blob = await compressImage(file); } catch { /* keep original */ }
    }

    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
        contentType: ext === 'png' ? 'image/png' : 'image/jpeg',
        upsert: false,
    });

    if (error) throw new Error(`[Storage] ${error.message}`);

    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

/**
 * Uploads multiple photos in parallel, skipping failed ones.
 */
export const uploadFieldLogPhotos = async (
    files: File[],
    fieldId: string,
    logId: string
): Promise<string[]> => {
    const results = await Promise.allSettled(
        files.map((f) => uploadFieldLogPhoto(f, fieldId, logId))
    );
    return results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map((r) => r.value);
};
