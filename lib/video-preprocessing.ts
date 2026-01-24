// Video preprocessing utilities for analysis preparation

export interface VideoFrame {
  timestamp: number;
  data: Buffer;
  width: number;
  height: number;
}

export interface VideoPreprocessingResult {
  success: boolean;
  frames?: VideoFrame[];
  thumbnail?: Buffer;
  metadata?: VideoMetadata;
  error?: string;
}

export interface VideoMetadata {
  duration: number;
  fps: number;
  width: number;
  height: number;
  codec: string;
  bitrate: number;
  format: string;
  fileSize: number;
}

/**
 * Extract frames from video for analysis
 * Note: This is a simplified client-side implementation
 * In production, this would use FFmpeg on the server
 */
export async function extractFrames(
  file: File, 
  options: {
    maxFrames?: number;
    interval?: number; // seconds between frames
    quality?: number; // 0.1 to 1.0
  } = {}
): Promise<VideoFrame[]> {
  const { maxFrames = 10, interval = 1, quality = 0.8 } = options;
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: VideoFrame[] = [];
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const duration = video.duration;
      const frameCount = Math.min(maxFrames, Math.floor(duration / interval));
      let currentFrame = 0;

      const extractFrame = () => {
        if (currentFrame >= frameCount) {
          URL.revokeObjectURL(video.src);
          resolve(frames);
          return;
        }

        const timestamp = currentFrame * interval;
        video.currentTime = timestamp;
      };

      video.onseeked = () => {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                const buffer = Buffer.from(reader.result as ArrayBuffer);
                frames.push({
                  timestamp: video.currentTime,
                  data: buffer,
                  width: canvas.width,
                  height: canvas.height,
                });
                
                currentFrame++;
                extractFrame();
              };
              reader.readAsArrayBuffer(blob);
            } else {
              currentFrame++;
              extractFrame();
            }
          }, 'image/jpeg', quality);
        } catch (error) {
          console.warn(`Failed to extract frame at ${timestamp}s:`, error);
          currentFrame++;
          extractFrame();
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video for frame extraction'));
      };

      extractFrame();
    };

    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
  });
}

/**
 * Generate thumbnail from video
 */
export async function generateThumbnail(
  file: File,
  options: {
    timestamp?: number; // seconds into video
    width?: number;
    height?: number;
    quality?: number;
  } = {}
): Promise<Buffer> {
  const { timestamp = 1, width = 320, height = 240, quality = 0.8 } = options;
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    canvas.width = width;
    canvas.height = height;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timestamp, video.duration - 0.1);
    };

    video.onseeked = () => {
      try {
        // Calculate aspect ratio to maintain proportions
        const aspectRatio = video.videoWidth / video.videoHeight;
        let drawWidth = width;
        let drawHeight = height;
        
        if (aspectRatio > width / height) {
          drawHeight = width / aspectRatio;
        } else {
          drawWidth = height * aspectRatio;
        }
        
        const offsetX = (width - drawWidth) / 2;
        const offsetY = (height - drawHeight) / 2;
        
        // Clear canvas and draw video frame
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              URL.revokeObjectURL(video.src);
              resolve(Buffer.from(reader.result as ArrayBuffer));
            };
            reader.readAsArrayBuffer(blob);
          } else {
            URL.revokeObjectURL(video.src);
            reject(new Error('Failed to generate thumbnail'));
          }
        }, 'image/jpeg', quality);
      } catch (error) {
        URL.revokeObjectURL(video.src);
        reject(error);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video for thumbnail generation'));
    };

    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
  });
}

/**
 * Parse video metadata
 */
export async function parseVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      const metadata: VideoMetadata = {
        duration: video.duration,
        fps: 30, // Default FPS - would need FFmpeg for accurate detection
        width: video.videoWidth,
        height: video.videoHeight,
        codec: 'unknown', // Would need FFmpeg for codec detection
        bitrate: 0, // Would need FFmpeg for bitrate detection
        format: file.type,
        fileSize: file.size,
      };
      
      URL.revokeObjectURL(video.src);
      resolve(metadata);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to parse video metadata'));
    };

    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
  });
}

/**
 * Comprehensive video preprocessing
 */
export async function preprocessVideo(
  file: File,
  options: {
    extractFrames?: boolean;
    generateThumbnail?: boolean;
    frameOptions?: {
      maxFrames?: number;
      interval?: number;
      quality?: number;
    };
    thumbnailOptions?: {
      timestamp?: number;
      width?: number;
      height?: number;
      quality?: number;
    };
  } = {}
): Promise<VideoPreprocessingResult> {
  try {
    const {
      extractFrames: shouldExtractFrames = true,
      generateThumbnail: shouldGenerateThumbnail = true,
      frameOptions = {},
      thumbnailOptions = {},
    } = options;

    // Parse metadata first
    const metadata = await parseVideoMetadata(file);
    
    const result: VideoPreprocessingResult = {
      success: true,
      metadata,
    };

    // Extract frames if requested
    if (shouldExtractFrames) {
      try {
        result.frames = await extractFrames(file, frameOptions);
      } catch (error) {
        console.warn('Frame extraction failed:', error);
        // Continue without frames rather than failing completely
      }
    }

    // Generate thumbnail if requested
    if (shouldGenerateThumbnail) {
      try {
        result.thumbnail = await generateThumbnail(file, thumbnailOptions);
      } catch (error) {
        console.warn('Thumbnail generation failed:', error);
        // Continue without thumbnail rather than failing completely
      }
    }

    return result;

  } catch (error) {
    console.error('Video preprocessing error:', error);
    return {
      success: false,
      error: `Failed to preprocess video: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate preprocessing results
 */
export function validatePreprocessingResults(result: VideoPreprocessingResult): boolean {
  if (!result.success) {
    return false;
  }

  // Check if we have at least metadata
  if (!result.metadata) {
    return false;
  }

  // Validate metadata completeness
  const { metadata } = result;
  if (metadata.duration <= 0 || metadata.width <= 0 || metadata.height <= 0) {
    return false;
  }

  return true;
}