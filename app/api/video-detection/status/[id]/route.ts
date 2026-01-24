import { NextRequest, NextResponse } from 'next/server';

interface AnalysisStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  results?: any;
  error?: string;
}

// In-memory storage for analysis status (will be enhanced with proper storage later)
const analysisStatus = new Map<string, AnalysisStatusResponse>();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id;

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Check if analysis exists
    const status = analysisStatus.get(analysisId);
    
    if (!status) {
      // For now, assume all analyses are completed immediately
      // This will be enhanced when we implement proper async processing
      return NextResponse.json({
        status: 'completed',
        progress: 100,
        results: {
          aiGenerated: {
            confidence: 0,
            techniques: [],
            explanation: 'Analysis completed - results pending AI integration'
          },
          manipulation: {
            confidence: 0,
            anomalies: [],
            explanation: 'Analysis completed - results pending AI integration'
          },
          authenticity: {
            confidence: 0,
            sources: [],
            metadata: {}
          },
          overall: {
            credibilityScore: 0,
            recommendation: 'Analysis completed',
            summary: 'Video analysis has been processed'
          }
        }
      });
    }

    return NextResponse.json(status);

  } catch (error) {
    console.error('Analysis status API error:', error);
    return NextResponse.json(
      { 
        status: 'failed',
        progress: 0,
        error: 'Internal server error while checking analysis status'
      },
      { status: 500 }
    );
  }
}

// Helper function to update analysis status (will be used by the main analysis endpoint)
export function updateAnalysisStatus(analysisId: string, status: AnalysisStatusResponse) {
  analysisStatus.set(analysisId, status);
}

// Helper function to get analysis status (for internal use)
export function getAnalysisStatus(analysisId: string): AnalysisStatusResponse | undefined {
  return analysisStatus.get(analysisId);
}