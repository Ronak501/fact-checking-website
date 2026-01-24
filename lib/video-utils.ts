// Video validation utilities for the video detection feature

export interface VideoValidationResult {
  valid: boolean;
  error?: string;
  metadata?: VideoMetadata;
}

export interface VideoMetadata {
  format: string;
  size: number;
  duration?: number;
  resolution?: {
    width: number;
    height: number;
  };
  bitrate?: number;
  codec?: string;
}

// Magic numbers for video file format detection
const VIDEO_MAGIC_NUMBERS = {
  mp4: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp
  mov: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], // ftyp (QuickTime)
  avi: [0x52, 0x49, 0x46, 0x46], // RIFF
  webm: [0x1A, 0x45, 0xDF, 0xA3], // EBML
};

// File size and format constraints
export const VIDEO_CONSTRAINTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MIN_RESOLUTION: { width: 640, height: 480 }, // 480p minimum
  MAX_RESOLUTION: { width: 3840, height: 2160 }, // 4K maximum
  SUPPORTED_FORMATS: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  MAX_DURATION: 10 * 60, // 10 minutes in seconds
};

/**
 * Validate video file format using magic numbers
 */
export function validateFileFormat(buffer: ArrayBuffer): { valid: boolean; format?: string; error?: string } {
  const bytes = new Uint8Array(buffer.slice(0, 32));
  
  // Check MP4
  if (bytes.length >= 8) {
    const mp4Magic = VIDEO_MAGIC_NUMBERS.mp4;
    let isMP4 = true;
    for (let i = 4; i < mp4Magic.length; i++) {
      if (bytes[i] !== mp4Magic[i]) {
        isMP4 = false;
        break;
      }
    }
    if (isMP4) return { valid: true, format: 'mp4' };
  }

  // Check AVI
  if (bytes.length >= 4) {
    const aviMagic = VIDEO_MAGIC_NUMBERS.avi;
    let isAVI = true;
    for (let i = 0; i < aviMagic.length; i++) {
      if (bytes[i] !== aviMagic[i]) {
        isAVI = false;
        break;
      }
    }
    if (isAVI) return { valid: true, format: 'avi' };
  }

  // Check WebM
  if (bytes.length >= 4) {
    const webmMagic = VIDEO_MAGIC_NUMBERS.webm;
    let isWebM = true;
    for (let i = 0; i < webmMagic.length; i++) {
      if (bytes[i] !== webmMagic[i]) {
        isWebM = false;
        break;
      }
    }
    if (isWebM) return { valid: true, format: 'webm' };
  }

  return { valid: false, error: 'Unsupported video format detected' };
}

/**
 * Validate video file size
 */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
    const sizeMB = Math.round(size / 1024 / 1024);
    const maxSizeMB = Math.round(VIDEO_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024);
    return { 
      valid: false, 
      error: `File size ${sizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB` 
    };
  }
  
  if (size === 0) {
    return { valid: false, error: 'File appears to be empty' };
  }

  return { valid: true };
}

/**
 * Extract basic metadata from video file
 * Note: This is a simplified version. In production, you'd use FFmpeg or similar
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  const metadata: VideoMetadata = {
    format: file.type,
    size: file.size,
  };

  // For now, we'll extract what we can from the File object
  // In a full implementation, this would use FFmpeg to get duration, resolution, etc.
  
  try {
    // Create a video element to extract basic metadata
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        metadata.duration = video.duration;
        metadata.resolution = {
          width: video.videoWidth,
          height: video.videoHeight,
        };
        
        URL.revokeObjectURL(url);
        resolve(metadata);
      };
      
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(metadata); // Return basic metadata even if video loading fails
      };
      
      video.src = url;
    });
  } catch (error) {
    console.warn('Failed to extract video metadata:', error);
    return metadata;
  }
}

/**
 * Validate video duration
 */
export function validateDuration(duration?: number): { valid: boolean; error?: string } {
  if (duration === undefined) {
    return { valid: true }; // Duration is optional for validation
  }
  
  if (duration > VIDEO_CONSTRAINTS.MAX_DURATION) {
    const maxMinutes = Math.round(VIDEO_CONSTRAINTS.MAX_DURATION / 60);
    const durationMinutes = Math.round(duration / 60);
    return { 
      valid: false, 
      error: `Video duration ${durationMinutes} minutes exceeds maximum allowed duration of ${maxMinutes} minutes` 
    };
  }
  
  if (duration <= 0) {
    return { valid: false, error: 'Invalid video duration' };
  }

  return { valid: true };
}

/**
 * Validate video resolution
 */
export function validateResolution(resolution?: { width: number; height: number }): { valid: boolean; error?: string } {
  if (!resolution) {
    return { valid: true }; // Resolution is optional for validation
  }
  
  const { width, height } = resolution;
  const { MIN_RESOLUTION, MAX_RESOLUTION } = VIDEO_CONSTRAINTS;
  
  if (width < MIN_RESOLUTION.width || height < MIN_RESOLUTION.height) {
    return { 
      valid: false, 
      error: `Video resolution ${width}x${height} is below minimum required resolution of ${MIN_RESOLUTION.width}x${MIN_RESOLUTION.height}` 
    };
  }
  
  if (width > MAX_RESOLUTION.width || height > MAX_RESOLUTION.height) {
    return { 
      valid: false, 
      error: `Video resolution ${width}x${height} exceeds maximum supported resolution of ${MAX_RESOLUTION.width}x${MAX_RESOLUTION.height}` 
    };
  }

  return { valid: true };
}

/**
 * Comprehensive video file validation
 */
export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  try {
    // Validate file size first (quick check)
    const sizeValidation = validateFileSize(file.size);
    if (!sizeValidation.valid) {
      return { valid: false, error: sizeValidation.error };
    }

    // Validate MIME type
    if (!VIDEO_CONSTRAINTS.SUPPORTED_FORMATS.includes(file.type)) {
      return { 
        valid: false, 
        error: `Unsupported file type: ${file.type}. Supported formats: ${VIDEO_CONSTRAINTS.SUPPORTED_FORMATS.join(', ')}` 
      };
    }

    // Read file header for magic number validation
    const headerBuffer = await file.slice(0, 32).arrayBuffer();
    const formatValidation = validateFileFormat(headerBuffer);
    if (!formatValidation.valid) {
      return { valid: false, error: formatValidation.error };
    }

    // Extract metadata for further validation
    const metadata = await extractVideoMetadata(file);
    
    // Validate duration if available
    const durationValidation = validateDuration(metadata.duration);
    if (!durationValidation.valid) {
      return { valid: false, error: durationValidation.error };
    }

    // Validate resolution if available
    const resolutionValidation = validateResolution(metadata.resolution);
    if (!resolutionValidation.valid) {
      return { valid: false, error: resolutionValidation.error };
    }

    return { valid: true, metadata };

  } catch (error) {
    console.error('Video validation error:', error);
    return { 
      valid: false, 
      error: 'Failed to validate video file. Please ensure the file is not corrupted.' 
    };
  }
}