import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/firebase';

export interface UploadResult {
    url: string;
    path: string;
}

export type ProgressCallback = (progress: number) => void;

/**
 * Uploads a file to Firebase Storage
 * @param file The file object to upload
 * @param pathPrefix The folder path (e.g. 'tenant_docs', 'property_images')
 * @param onProgress Optional callback for upload progress (0-100)
 * @returns Promise resolving to the download URL and full path
 */
export async function uploadFile(
    file: File,
    pathPrefix: string = 'uploads',
    onProgress?: ProgressCallback
): Promise<UploadResult> {
    try {
        // Create a unique filename: timestamp_sanitized-name
        const timestamp = new Date().getTime();
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const fullPath = `${pathPrefix}/${timestamp}_${sanitizedName}`;

        const storageRef = ref(storage, fullPath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                },
                (error) => {
                    console.error('Upload failed:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve({
                            url: downloadURL,
                            path: fullPath
                        });
                    } catch (err) {
                        reject(err);
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error starting upload:', error);
        throw error;
    }
}
