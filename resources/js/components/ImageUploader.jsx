import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadImage } from '../store/slices/uploadSlice';

export default function ImageUploader({ value, onUploadSuccess, onRemove, label }) {
    const fileInputRef = useRef(null);
    const dispatch = useDispatch();
    const { cachedUploads } = useSelector(state => state.upload);
    
    // We keep these local so multiple uploaders don't share the same loading spinner
    const [isUploading, setIsUploading] = useState(false);
    const [localError, setLocalError] = useState(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Basic validation
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'].includes(file.type)) {
            setLocalError("Invalid file type. Please upload a JPG, PNG, WEBP, or GIF.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setLocalError("File is too large. Maximum size is 5MB.");
            return;
        }

        // Check cache first
        const signature = `${file.name}-${file.size}-${file.lastModified}`;
        if (cachedUploads[signature]) {
            onUploadSuccess(cachedUploads[signature]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setLocalError(null);
        setIsUploading(true);

        try {
            const resultAction = await dispatch(uploadImage(file)).unwrap();
            onUploadSuccess(resultAction.url);
        } catch (err) {
            console.error("Upload error:", err);
            setLocalError(err || 'Failed to upload image. Please try again.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    return (
        <div className="flex flex-col gap-2">
            {label && (
                <label className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                    {label}
                </label>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg, image/png, image/webp, image/jpg, image/gif"
                className="hidden"
            />

            {localError && (
                <p className="text-xs text-error dark:text-red-400 mt-1">{localError}</p>
            )}

            {value ? (
                <div className="relative group rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container aspect-video">
                    <img
                        key={value}
                        src={value}
                        alt="Uploaded preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                            title="Replace Image"
                        >
                            <span className="material-symbols-outlined text-[1.25rem]">edit</span>
                        </button>
                        {onRemove && (
                            <button
                                type="button"
                                onClick={onRemove}
                                className="bg-error/80 hover:bg-error text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                                title="Remove Image"
                            >
                                <span className="material-symbols-outlined text-[1.25rem]">delete</span>
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full rounded-2xl border-2 border-dashed border-outline-variant/50 hover:border-primary/50 bg-surface-container hover:bg-surface-container-high transition-all flex flex-col items-center justify-center py-8 gap-3 aspect-video disabled:opacity-70 disabled:cursor-not-allowed dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                >
                    {isUploading ? (
                        <>
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                            <span className="text-sm font-semibold text-primary font-body">Uploading...</span>
                        </>
                    ) : (
                        <>
                            <div className="w-12 h-12 rounded-full bg-primary-container dark:bg-red-900/30 flex items-center justify-center text-primary dark:text-red-400">
                                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-on-surface dark:text-white font-body">Click to upload an image</p>
                                <p className="text-xs text-on-surface-variant dark:text-stone-400 mt-1 font-body">JPG, PNG, WEBP (Max 5MB)</p>
                            </div>
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
