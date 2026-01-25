import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { validateVideoFile, VIDEO_CONSTRAINTS } from '@/lib/video-utils';
import { deleteTemporaryFile } from '@/lib/file-cleanup';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Configuration constants
const TEMP_DIR = process.env.VIDEO_TEMP_DIR || '/tmp/video-analysis';
const ANALYSIS_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_ANALYSIS_TIMEOUT || '30000'); // 30 seconds

interface VideoDetectionRequest {
    file: File;
    analysisTypes?: ('ai-detection' | 'manipulation' | 'authenticity')[];
}

interface VideoDetectionResponse {
    success: boolean;
    analysisId: string;
    results?: VideoAnalysisResults;
    processingTime?: number;
    error?: string;
}

interface VideoAnalysisResults {
    aiGenerated: {
        confidence: number;
        techniques: string[];
        explanation: string;
    };
    manipulation: {
        confidence: number;
        anomalies: TimelineAnomaly[];
        explanation: string;
    };
    authenticity: {
        confidence: number;
        sources: AuthenticitySource[];
        metadata: VideoMetadata;
    };
    overall: {
        credibilityScore: number;
        recommendation: string;
        summary: string;
    };
}

interface TimelineAnomaly {
    timestamp: number;
    type: string;
    confidence: number;
    description: string;
}

interface AuthenticitySource {
    url: string;
    similarity: number;
    verified: boolean;
}

interface VideoMetadata {
    format: string;
    duration: number;
    resolution: { width: number; height: number };
    fileSize: number;
    uploadTime: string;
}

/**
 * Ensure temporary directory exists
 */
async function ensureTempDirectory(): Promise<void> {
    try {
        await mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
        // Directory might already exist, which is fine
        console.log('Temp directory already exists or created successfully');
    }
}

/**
 * Generate secure temporary file path
 */
function generateTempFilePath(analysisId: string, originalFileName: string): string {
    const extension = originalFileName.split('.').pop() || 'tmp';
    return join(TEMP_DIR, `${analysisId}.${extension}`);
}

/**
 * Validate and extract file duration using client-side metadata
 */
async function validateFileDuration(file: File): Promise<{ valid: boolean; duration?: number; error?: string }> {
    try {
        // For server-side validation, we'll rely on file size as a proxy for duration
        // In a full implementation, this would use FFmpeg to get actual duration
        const estimatedDuration = file.size / (1024 * 1024 * 2); // Rough estimate: 2MB per minute

        if (estimatedDuration > VIDEO_CONSTRAINTS.MAX_DURATION / 60) {
            return {
                valid: false,
                error: `Estimated video duration exceeds maximum allowed duration of ${VIDEO_CONSTRAINTS.MAX_DURATION / 60} minutes`
            };
        }

        return { valid: true, duration: estimatedDuration };
    } catch (error) {
        return { valid: true }; // Allow processing to continue if duration check fails
    }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    let tempFilePath: string | null = null;

    try {
        // Ensure temporary directory exists
        await ensureTempDirectory();

        // Parse multipart form data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const analysisTypesParam = formData.get('analysisTypes') as string;

        // Validate required file parameter
        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No video file provided in multipart form data' },
                { status: 400 }
            );
        }

        // Validate file using comprehensive validation
        const validation = await validateVideoFile(file);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Additional duration validation
        const durationCheck = await validateFileDuration(file);
        if (!durationCheck.valid) {
            return NextResponse.json(
                { success: false, error: durationCheck.error },
                { status: 400 }
            );
        }

        // Generate unique analysis ID for tracking
        const analysisId = randomUUID();

        // Create secure temporary file path
        tempFilePath = generateTempFilePath(analysisId, file.name);

        // Save file to temporary storage
        try {
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            await writeFile(tempFilePath, buffer);
            console.log(`Video file saved temporarily: ${tempFilePath}`);
        } catch (writeError) {
            console.error('Failed to write temporary file:', writeError);
            return NextResponse.json(
                { success: false, error: 'Failed to save uploaded file for processing' },
                { status: 500 }
            );
        }

        // Parse analysis types (default to all types if not specified)
        let requestedAnalysisTypes: ('ai-detection' | 'manipulation' | 'authenticity')[];
        try {
            requestedAnalysisTypes = analysisTypesParam
                ? JSON.parse(analysisTypesParam)
                : ['ai-detection', 'manipulation', 'authenticity'];
        } catch (parseError) {
            requestedAnalysisTypes = ['ai-detection', 'manipulation', 'authenticity'];
        }

        // Validate analysis types
        const validAnalysisTypes = ['ai-detection', 'manipulation', 'authenticity'];
        const invalidTypes = requestedAnalysisTypes.filter(type => !validAnalysisTypes.includes(type));
        if (invalidTypes.length > 0) {
            return NextResponse.json(
                { success: false, error: `Invalid analysis types: ${invalidTypes.join(', ')}. Valid types: ${validAnalysisTypes.join(', ')}` },
                { status: 400 }
            );
        }

        // Create video metadata
        const videoMetadata: VideoMetadata = {
            format: file.type,
            duration: durationCheck.duration || 0,
            resolution: validation.metadata?.resolution || { width: 0, height: 0 },
            fileSize: file.size,
            uploadTime: new Date().toISOString(),
        };

        // Initialize analysis results structure
        const results: VideoAnalysisResults = {
            aiGenerated: {
                confidence: 0,
                techniques: [],
                explanation: 'AI detection analysis will be implemented in subsequent tasks'
            },
            manipulation: {
                confidence: 0,
                anomalies: [],
                explanation: 'Manipulation detection analysis will be implemented in subsequent tasks'
            },
            authenticity: {
                confidence: 0,
                sources: [],
                metadata: videoMetadata
            },
            overall: {
                credibilityScore: 0,
                recommendation: 'Analysis pending - full implementation in progress',
                summary: `Video analysis initiated for ${file.name} (${Math.round(file.size / 1024 / 1024)}MB)`
            }
        };

        const processingTime = Date.now() - startTime;

        // Schedule file cleanup (immediate cleanup for now, will be enhanced in task 1.3)
        setTimeout(async () => {
            if (tempFilePath) {
                await deleteTemporaryFile(tempFilePath);
            }
        }, 1000); // Clean up after 1 second

        // Return successful response with analysis ID for tracking
        const response: VideoDetectionResponse = {
            success: true,
            analysisId,
            results,
            processingTime,
        };

        console.log(`Video analysis request completed: ID=${analysisId}, Time=${processingTime}ms`);
        return NextResponse.json(response);

    } catch (error) {
        console.error('Video detection API error:', error);

        // Clean up temporary file on error
        if (tempFilePath) {
            try {
                await deleteTemporaryFile(tempFilePath);
            } catch (cleanupError) {
                console.error('Failed to cleanup temporary file on error:', cleanupError);
            }
        }

        // Return appropriate error response
        if (error instanceof Error) {
            if (error.message.includes('timeout')) {
                return NextResponse.json(
                    { success: false, error: 'Video analysis timed out. Please try with a smaller file.' },
                    { status: 408 }
                );
            }
            if (error.message.includes('size')) {
                return NextResponse.json(
                    { success: false, error: 'File size validation failed' },
                    { status: 413 }
                );
            }
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error during video analysis' },
            { status: 500 }
        );
    }
}