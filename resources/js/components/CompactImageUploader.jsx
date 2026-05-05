import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadToCloudinary } from '../store/slices/uploadSlice';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export default function CompactImageUploader({ value, onUploadSuccess, onRemove, placeholder = "Upload an image..." }) {
    const fileInputRef = useRef(null);
    const dispatch = useDispatch();
    const { cachedUploads } = useSelector(state => state.upload);
    
    const [isUploading, setIsUploading] = useState(false);
    const [localError, setLocalError] = useState(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'].includes(file.type)) {
            setLocalError("Invalid type.");
            return;
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            setLocalError("Max 4MB.");
            return;
        }

        const signature = `${file.name}-${file.size}-${file.lastModified}`;
        if (cachedUploads[signature]) {
            onUploadSuccess(cachedUploads[signature]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setLocalError(null);
        setIsUploading(true);

        try {
            const resultAction = await dispatch(uploadToCloudinary({ file })).unwrap();
            onUploadSuccess(resultAction.url);
        } catch (err) {
            console.error("Cloudinary upload error:", err);
            setLocalError('Failed.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="relative w-full">
            <div className={`w-full bg-surface-container border border-outline-variant/30 rounded-xl flex items-center overflow-hidden transition-all focus-within:ring-1 focus-within:ring-primary ${localError ? 'border-error/50' : ''}`}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
                
                <div className="flex-1 px-4 py-3 flex items-center min-w-0">
                    {value ? (
                        <div className="flex items-center gap-2 w-full">
                            <div className="w-6 h-6 rounded-md overflow-hidden flex-shrink-0 border border-outline-variant/20">
                                <img src={value} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-sm text-on-surface truncate font-body flex-1 opacity-70">
                                {value}
                            </span>
                        </div>
                    ) : (
                        <span className={`text-sm font-body truncate flex-1 ${isUploading ? 'text-primary' : 'text-on-surface-variant/50'}`}>
                            {isUploading ? 'Uploading to Cloudinary...' : (localError || placeholder)}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 pr-2">
                    {value ? (
                        <>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors"
                                title="Replace Image"
                            >
                                <span className="material-symbols-outlined text-[1.1rem]">edit</span>
                            </button>
                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="p-1.5 rounded-full hover:bg-error/10 text-error/80 transition-colors"
                                    title="Remove Image"
                                >
                                    <span className="material-symbols-outlined text-[1.1rem]">delete</span>
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isUploading ? (
                                <span className="material-symbols-outlined text-[1.1rem] animate-spin">sync</span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[1.1rem]">cloud_upload</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">Upload</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
            
            {localError && (
                <p className="absolute -bottom-5 left-2 text-[10px] text-error font-medium">{localError}</p>
            )}
        </div>
    );
}
