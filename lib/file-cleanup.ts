import { unlink, readdir, stat } from 'fs/promises';
import { join } from 'path';

const TEMP_DIR = process.env.VIDEO_TEMP_DIR || '/tmp/video-analysis';
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_FILE_AGE = 5 * 60 * 1000; // 5 minutes

interface CleanupResult {
  success: boolean;
  filesDeleted: number;
  errors: string[];
}

/**
 * Delete a specific temporary file
 */
export async function deleteTemporaryFile(filePath: string): Promise<boolean> {
  try {
    await unlink(filePath);
    console.log(`Successfully deleted temporary file: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete temporary file ${filePath}:`, error);
    return false;
  }
}

/**
 * Clean up old temporary files in the temp directory
 */
export async function cleanupOldFiles(): Promise<CleanupResult> {
  const result: CleanupResult = {
    success: true,
    filesDeleted: 0,
    errors: []
  };

  try {
    const files = await readdir(TEMP_DIR);
    const now = Date.now();

    for (const file of files) {
      try {
        const filePath = join(TEMP_DIR, file);
        const stats = await stat(filePath);
        const fileAge = now - stats.mtime.getTime();

        // Delete files older than MAX_FILE_AGE
        if (fileAge > MAX_FILE_AGE) {
          const deleted = await deleteTemporaryFile(filePath);
          if (deleted) {
            result.filesDeleted++;
          } else {
            result.errors.push(`Failed to delete ${file}`);
          }
        }
      } catch (error) {
        result.errors.push(`Error processing file ${file}: ${error}`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

  } catch (error) {
    result.success = false;
    result.errors.push(`Failed to read temp directory: ${error}`);
  }

  return result;
}

/**
 * Start the background cleanup process
 */
export function startCleanupService(): NodeJS.Timeout {
  console.log('Starting file cleanup service...');
  
  const intervalId = setInterval(async () => {
    try {
      const result = await cleanupOldFiles();
      
      if (result.filesDeleted > 0) {
        console.log(`Cleanup service: Deleted ${result.filesDeleted} old files`);
      }
      
      if (result.errors.length > 0) {
        console.error('Cleanup service errors:', result.errors);
      }
    } catch (error) {
      console.error('Cleanup service error:', error);
    }
  }, CLEANUP_INTERVAL);

  return intervalId;
}

/**
 * Stop the background cleanup process
 */
export function stopCleanupService(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
  console.log('File cleanup service stopped');
}

/**
 * Ensure temp directory exists and perform initial cleanup
 */
export async function initializeCleanupService(): Promise<void> {
  try {
    // Perform initial cleanup
    const result = await cleanupOldFiles();
    console.log(`Initial cleanup completed: ${result.filesDeleted} files deleted`);
    
    if (result.errors.length > 0) {
      console.warn('Initial cleanup warnings:', result.errors);
    }
  } catch (error) {
    console.error('Failed to initialize cleanup service:', error);
  }
}