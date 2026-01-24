import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// File validation constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const SUPPORTED_FORMATS = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
const TEMP_DIR = process.env.VIDEO_TEMP_DIR || '/tmp/video-analysis';

interface VideoAnalysisResults {
    aiGenerated: {
        confidence: number;
        techniques: string[];
        explanation: string;
    };
    manipulation: {
        confidence: number;
        anomalies: any[];
        explanation: string;
    };
    authenticity: {
        confidence: number;
        sources: any[];
        metadata: any;
    };
    overall: {
        credibilityScore: number;
        recommendation: string;
        summary: string;
    };
}

// File validation function
function validateVideoFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        return { valid: false, error: `File size exceeds 100MB limit. Current size: ${Math.round(file.size / 1024 / 1024)}MB` };
    }

    // Check file format
    if (!SUPPORTED_FORMATS.includes(file.type)) {
        return { valid: false, error: `Unsupported file format: ${file.type}. Supported formats: MP4, MOV, AVI, WebM` };
    }

    return { valid: true };
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const analysisTypes = formData.get('analysisTypes') as string;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No video file provided' },
                { status: 400 }
            );
        }

        // Validate file
        const validation = validateVideoFile(file);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        // Generate unique analysis ID
        const analysisId = randomUUID();

        // Create temporary file path
        const tempFilePath = join(TEMP_DIR, `${analysisId}.${file.name.split('.').pop()}`);

        // Save file temporarily
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(tempFilePath, buffer);

        // Parse analysis types
        const requestedAnalysisTypes = analysisTypes ? JSON.parse(analysisTypes) : ['ai-detection', 'manipulation', 'authenticity'];

        // Start analysis (simplified for now - will be enhanced in later tasks)
        const startTime = Date.now();

        // Placeholder results - will be replaced with actual AI analysis
        const results: VideoAnalysisResults = {
            aiGenerated: {
                confidence: 0,
                techniques: [],
                explanation: 'Analysis pending - AI detection not yet implemented'
            },
            manipulation: {
                confidence: 0,
                anomalies: [],
                explanation: 'Analysis pending - manipulation detection not yet implemented'
            },
            authenticity: {
                confidence: 0,
                sources: [],
                metadata: {}
            },
            overall: {
                credibilityScore: 0,
                recommendation: 'Analysis in progress',
                summary: 'Video analysis is being processed'
            }
        };

        const processingTime = Date.now() - startTime;

        // Clean up temporary file
        try {
            await unlink(tempFilePath);
        } catch (cleanupError) {
            console.error('Failed to cleanup temporary file:', cleanupError);
        }

        return NextResponse.json({
            success: true,
            analysisId,
            results,
            processingTime,
        });

    } catch (error) {
        console.error('Video detection API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error during video analysis' },
            { status: 500 }
        );
    }
}