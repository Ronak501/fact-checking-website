"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, FileVideo, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export interface VideoFile {
  file: File;
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
  metadata?: {
    duration: number;
    width: number;
    height: number;
    size: string;
  };
}

interface VideoUploadProps {
    onFileSelect: (files: VideoFile[]) => void;
    onFileRemove: (fileId: string) => void;
    maxFiles?: number;
    maxSize?: number; // in bytes
    acceptedFormats?: string[];
    disabled?: boolean;
    className?: string;
}

const DEFAULT_ACCEPTED_FORMATS = [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function VideoUpload({
    onFileSelect,
    onFileRemove,
    maxFiles = 1,
    maxSize = MAX_FILE_SIZE,
    acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
    disabled = false,
    className
}: VideoUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<VideoFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validate file
    const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
        // Check file type
        if (!acceptedFormats.includes(file.type)) {
            return {
                valid: false,
                error: `Unsupported format: ${file.type}. Supported: ${acceptedFormats.join(', ')}`
            };
        }

        // Check file size
        if (file.size > maxSize) {
            const sizeMB = Math.round(file.size / 1024 / 1024);
            const maxSizeMB = Math.round(maxSize / 1024 / 1024);
            return {
                valid: false,
                error: `File size ${sizeMB}MB exceeds limit of ${maxSizeMB}MB`
            };
        }

        // Check if we're at max files
        if (selectedFiles.length >= maxFiles) {
            return {
                valid: false,
                error: `Maximum ${maxFiles} file(s) allowed`
            };
        }

        return { valid: true };
    }, [acceptedFormats, maxSize, maxFiles, selectedFiles.length]);

    // Generate video preview and extract metadata
    const generatePreview = useCallback((file: File): Promise<{ preview: string; metadata: any }> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            video.onloadedmetadata = () => {
                canvas.width = 320;
                canvas.height = 240;
                video.currentTime = Math.min(1, video.duration / 2); // Seek to middle or 1 second
            };

            video.onseeked = () => {
                try {
                    const aspectRatio = video.videoWidth / video.videoHeight;
                    let drawWidth = 320;
                    let drawHeight = 240;

                    if (aspectRatio > 320 / 240) {
                        drawHeight = 320 / aspectRatio;
                    } else {
                        drawWidth = 240 * aspectRatio;
                    }

                    const offsetX = (320 - drawWidth) / 2;
                    const offsetY = (240 - drawHeight) / 2;

                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, 320, 240);
                    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    const metadata = {
                        duration: video.duration,
                        width: video.videoWidth,
                        height: video.videoHeight,
                        size: `${Math.round(file.size / 1024 / 1024)} MB`,
                    };

                    URL.revokeObjectURL(video.src);
                    resolve({ preview: dataUrl, metadata });
                } catch (error) {
                    URL.revokeObjectURL(video.src);
                    reject(error);
                }
            };

            video.onerror = () => {
                URL.revokeObjectURL(video.src);
                reject(new Error('Failed to load video'));
            };

            const url = URL.createObjectURL(file);
            video.src = url;
            video.load();
        });
    }, []);

    // Handle file selection
    const handleFiles = useCallback(async (files: FileList) => {
        const newFiles: VideoFile[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const validation = validateFile(file);

            const videoFile: VideoFile = {
                file,
                id: `${Date.now()}-${i}`,
                status: validation.valid ? 'pending' : 'error',
                error: validation.error,
                progress: 0,
            };

            // Generate preview for valid files
            if (validation.valid) {
                try {
                    const result = await generatePreview(file);
                    videoFile.preview = result.preview;
                    videoFile.metadata = result.metadata;
                    videoFile.status = 'success';
                } catch (error) {
                    console.warn('Failed to generate preview:', error);
                    // Continue without preview
                }
            }

            newFiles.push(videoFile);
        }

        const updatedFiles = [...selectedFiles, ...newFiles];
        setSelectedFiles(updatedFiles);
        onFileSelect(updatedFiles);
    }, [selectedFiles, validateFile, generatePreview, onFileSelect]);

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) {
            setIsDragOver(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }, [disabled, handleFiles]);

    // File input change handler
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
        // Reset input value to allow selecting the same file again
        e.target.value = '';
    }, [handleFiles]);

    // Remove file handler
    const handleRemoveFile = useCallback((fileId: string) => {
        const updatedFiles = selectedFiles.filter(f => f.id !== fileId);
        setSelectedFiles(updatedFiles);
        onFileRemove(fileId);
    }, [selectedFiles, onFileRemove]);

    // Click to select files
    const handleClick = useCallback(() => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, [disabled]);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Upload Area */}
            <Card
                className={cn(
                    "border-2 border-dashed transition-colors cursor-pointer",
                    isDragOver && !disabled && "border-primary bg-primary/5",
                    disabled && "opacity-50 cursor-not-allowed",
                    !disabled && "hover:border-primary/50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                        {selectedFiles.length === 0 ? 'Upload Video' : 'Upload Another Video'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Drag and drop your video file here, or click to browse
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <p>Supported formats: MP4, MOV, AVI, WebM</p>
                        <p>Maximum size: {Math.round(maxSize / 1024 / 1024)}MB</p>
                        {maxFiles > 1 && <p>Maximum files: {maxFiles}</p>}
                    </div>
                    <Button
                        variant="outline"
                        className="mt-4"
                        disabled={disabled}
                        onClick={(e) => e.stopPropagation()}
                    >
                        Choose File
                    </Button>
                </CardContent>
            </Card>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                multiple={maxFiles > 1}
                onChange={handleFileInputChange}
                className="hidden"
                disabled={disabled}
            />

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium">Selected Files</h4>
                    {selectedFiles.map((videoFile) => (
                        <Card key={videoFile.id} className="p-4">
                            <div className="flex items-start space-x-4">
                                {/* Preview or Icon */}
                                <div className="flex-shrink-0">
                                    {videoFile.preview ? (
                                        <img
                                            src={videoFile.preview}
                                            alt="Video preview"
                                            className="w-20 h-15 object-cover rounded border"
                                        />
                                    ) : (
                                        <div className="w-20 h-15 bg-muted rounded border flex items-center justify-center">
                                            <FileVideo className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">
                                                {videoFile.file.name}
                                            </p>
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <p>{Math.round(videoFile.file.size / 1024 / 1024)} MB</p>
                                                {videoFile.metadata && (
                                                    <>
                                                        <p>{videoFile.metadata.width} × {videoFile.metadata.height}</p>
                                                        <p>{Math.round(videoFile.metadata.duration)}s duration</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status and Remove Button */}
                                        <div className="flex items-center space-x-2 ml-4">
                                            {videoFile.status === 'success' && (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            )}
                                            {videoFile.status === 'error' && (
                                                <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveFile(videoFile.id)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {videoFile.error && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {videoFile.error}
                                        </p>
                                    )}

                                    {/* Progress Bar */}
                                    {videoFile.status === 'uploading' && videoFile.progress !== undefined && (
                                        <div className="mt-2">
                                            <Progress value={videoFile.progress} className="h-2" />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Uploading... {videoFile.progress}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}