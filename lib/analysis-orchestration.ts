// Analysis orchestration for coordinating multiple AI analysis types

import { performAIDetectionAnalysis } from './ai-detection';
import { performManipulationDetection } from './manipulation-detection';
import { performAuthenticityVerification } from './authenticity-verification';
import { aggregateAnalysisResults, VideoAnalysisResults, validateAnalysisResults } from './analysis-aggregation';

export interface AnalysisOptions {
  analysisTypes: ('ai-detection' | 'manipulation' | 'authenticity')[];
  videoDuration?: number;
  timeout?: number; // milliseconds
  retryAttempts?: number;
}

export interface AnalysisProgress {
  stage: string;
  progress: number; // 0-100
  message: string;
}

export type ProgressCallback = (progress: AnalysisProgress) => void;

/**
 * Orchestrate parallel execution of video analysis types
 */
export async function orchestrateVideoAnalysis(
  videoBuffer: Buffer,
  options: AnalysisOptions,
  onProgress?: ProgressCallback
): Promise<VideoAnalysisResults> {
  const {
    analysisTypes = ['ai-detection', 'manipulation', 'authenticity'],
    videoDuration = 60,
    timeout = 30000, // 30 seconds default
    retryAttempts = 2
  } = options;

  // Initialize progress tracking
  const totalStages = analysisTypes.length + 1; // +1 for aggregation
  let completedStages = 0;

  const updateProgress = (stage: string, message: string) => {
    const progress = Math.round((completedStages / totalStages) * 100);
    onProgress?.({ stage, progress, message });
  };

  try {
    updateProgress('initialization', 'Starting video analysis...');

    // Create analysis promises with timeout and retry logic
    const analysisPromises: Promise<any>[] = [];

    if (analysisTypes.includes('ai-detection')) {
      analysisPromises.push(
        executeWithRetry(
          () => performAIDetectionAnalysis(videoBuffer),
          retryAttempts,
          timeout,
          'AI Detection'
        ).then(result => {
          completedStages++;
          updateProgress('ai-detection', 'AI detection analysis completed');
          return { type: 'ai-detection', result };
        })
      );
    }

    if (analysisTypes.includes('manipulation')) {
      analysisPromises.push(
        executeWithRetry(
          () => performManipulationDetection(videoBuffer, videoDuration),
          retryAttempts,
          timeout,
          'Manipulation Detection'
        ).then(result => {
          completedStages++;
          updateProgress('manipulation', 'Manipulation detection completed');
          return { type: 'manipulation', result };
        })
      );
    }

    if (analysisTypes.includes('authenticity')) {
      analysisPromises.push(
        executeWithRetry(
          () => performAuthenticityVerification(videoBuffer),
          retryAttempts,
          timeout,
          'Authenticity Verification'
        ).then(result => {
          completedStages++;
          updateProgress('authenticity', 'Authenticity verification completed');
          return { type: 'authenticity', result };
        })
      );
    }

    // Execute all analyses in parallel
    updateProgress('analysis', 'Running parallel analysis...');
    const results = await Promise.allSettled(analysisPromises);

    // Process results and handle failures
    const analysisResults = {
      aiGenerated: null as any,
      manipulation: null as any,
      authenticity: null as any,
    };

    const errors: string[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { type, result: analysisResult } = result.value;
        analysisResults[type === 'ai-detection' ? 'aiGenerated' : type] = analysisResult;
      } else {
        errors.push(`Analysis failed: ${result.reason}`);
      }
    }

    // Ensure we have at least some results
    if (!analysisResults.aiGenerated && !analysisResults.manipulation && !analysisResults.authenticity) {
      throw new Error(`All analyses failed: ${errors.join('; ')}`);
    }

    // Fill in missing results with defaults
    if (!analysisResults.aiGenerated) {
      analysisResults.aiGenerated = createDefaultAIResult('AI detection analysis failed');
    }
    if (!analysisResults.manipulation) {
      analysisResults.manipulation = createDefaultManipulationResult('Manipulation detection analysis failed');
    }
    if (!analysisResults.authenticity) {
      analysisResults.authenticity = createDefaultAuthenticityResult('Authenticity verification analysis failed');
    }

    // Aggregate results
    updateProgress('aggregation', 'Aggregating analysis results...');
    const aggregatedResults = aggregateAnalysisResults(
      analysisResults.aiGenerated,
      analysisResults.manipulation,
      analysisResults.authenticity
    );

    // Validate results
    const validation = validateAnalysisResults(aggregatedResults);
    if (!validation.valid) {
      console.warn('Analysis results validation failed:', validation.errors);
      // Continue with results but log warnings
    }

    completedStages++;
    updateProgress('completed', 'Video analysis completed successfully');

    return aggregatedResults;

  } catch (error) {
    console.error('Analysis orchestration failed:', error);
    
    // Return default results on complete failure
    const defaultResults = createDefaultAnalysisResults(
      `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    
    updateProgress('failed', 'Video analysis failed');
    return defaultResults;
  }
}

/**
 * Execute analysis with retry logic and timeout
 */
async function executeWithRetry<T>(
  analysisFunction: () => Promise<T>,
  maxRetries: number,
  timeoutMs: number,
  analysisName: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`${analysisName} timed out after ${timeoutMs}ms`)), timeoutMs);
      });

      // Race between analysis and timeout
      const result = await Promise.race([
        analysisFunction(),
        timeoutPromise
      ]);

      return result;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        console.warn(`${analysisName} attempt ${attempt + 1} failed, retrying...`, error);
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error(`${analysisName} failed after ${maxRetries + 1} attempts`);
}

/**
 * Create default AI analysis result
 */
function createDefaultAIResult(errorMessage: string) {
  return {
    confidence: 0,
    techniques: [],
    explanation: errorMessage,
    indicators: {
      facial_inconsistencies: 0,
      temporal_artifacts: 0,
      lighting_anomalies: 0,
      compression_artifacts: 0,
    },
  };
}

/**
 * Create default manipulation analysis result
 */
function createDefaultManipulationResult(errorMessage: string) {
  return {
    confidence: 0,
    anomalies: [],
    explanation: errorMessage,
    indicators: {
      frame_cuts: 0,
      object_insertion: 0,
      background_changes: 0,
      audio_sync_issues: 0,
    },
  };
}

/**
 * Create default authenticity analysis result
 */
function createDefaultAuthenticityResult(errorMessage: string) {
  return {
    confidence: 0,
    sources: [],
    metadata: {
      compression_history: [],
    },
    explanation: errorMessage,
  };
}

/**
 * Create complete default analysis results
 */
function createDefaultAnalysisResults(errorMessage: string): VideoAnalysisResults {
  return {
    aiGenerated: createDefaultAIResult(errorMessage),
    manipulation: createDefaultManipulationResult(errorMessage),
    authenticity: createDefaultAuthenticityResult(errorMessage),
    overall: {
      credibilityScore: 0,
      recommendation: 'Analysis could not be completed',
      summary: errorMessage,
    },
  };
}

/**
 * Check analysis service health
 */
export async function checkAnalysisServiceHealth(): Promise<{
  healthy: boolean;
  services: {
    gemini: boolean;
    aiDetection: boolean;
    manipulation: boolean;
    authenticity: boolean;
  };
  errors: string[];
}> {
  const errors: string[] = [];
  const services = {
    gemini: false,
    aiDetection: false,
    manipulation: false,
    authenticity: false,
  };

  try {
    // Check if Gemini API key is available
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      errors.push('Gemini API key not configured');
    } else {
      services.gemini = true;
    }

    // In a full implementation, you would test actual API connectivity here
    services.aiDetection = services.gemini;
    services.manipulation = services.gemini;
    services.authenticity = services.gemini;

  } catch (error) {
    errors.push(`Service health check failed: ${error}`);
  }

  const healthy = services.gemini && services.aiDetection && services.manipulation && services.authenticity;

  return { healthy, services, errors };
}

/**
 * Get estimated analysis time based on video size and requested analyses
 */
export function estimateAnalysisTime(
  videoSizeBytes: number,
  analysisTypes: string[],
  videoDuration: number
): number {
  // Base time estimates (in seconds)
  const baseTimePerMB = 2; // 2 seconds per MB
  const timePerAnalysisType = 5; // 5 seconds per analysis type
  const durationFactor = 0.5; // 0.5 seconds per minute of video

  const videoSizeMB = videoSizeBytes / (1024 * 1024);
  const sizeTime = videoSizeMB * baseTimePerMB;
  const analysisTime = analysisTypes.length * timePerAnalysisType;
  const durationTime = (videoDuration / 60) * durationFactor;

  return Math.max(10, Math.round(sizeTime + analysisTime + durationTime));
}

/**
 * Cancel ongoing analysis (placeholder for future implementation)
 */
export function cancelAnalysis(analysisId: string): boolean {
  // This would be implemented with proper cancellation tokens
  // For now, return false as cancellation is not supported
  console.warn(`Analysis cancellation requested for ${analysisId} but not implemented`);
  return false;
}