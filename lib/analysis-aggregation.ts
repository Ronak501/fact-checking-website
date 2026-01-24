// Analysis result aggregation utilities

export interface TimelineAnomaly {
    timestamp: number;
    duration: number;
    type: 'cut' | 'insertion' | 'deletion' | 'temporal_inconsistency' | 'quality_change';
    confidence: number;
    description: string;
}

export interface AuthenticitySource {
    url?: string;
    similarity: number;
    source: string;
    verified: boolean;
}

export interface AIAnalysisResult {
    confidence: number;
    techniques: string[];
    explanation: string;
    indicators: {
        facial_inconsistencies: number;
        temporal_artifacts: number;
        lighting_anomalies: number;
        compression_artifacts: number;
    };
}

export interface ManipulationAnalysisResult {
    confidence: number;
    anomalies: TimelineAnomaly[];
    explanation: string;
    indicators: {
        frame_cuts: number;
        object_insertion: number;
        background_changes: number;
        audio_sync_issues: number;
    };
}

export interface AuthenticityAnalysisResult {
    confidence: number;
    sources: AuthenticitySource[];
    metadata: {
        creation_date?: string;
        device_info?: string;
        location?: string;
        compression_history: string[];
    };
    explanation: string;
}

export interface VideoAnalysisResults {
    aiGenerated: AIAnalysisResult;
    manipulation: ManipulationAnalysisResult;
    authenticity: AuthenticityAnalysisResult;
    overall: {
        credibilityScore: number;
        recommendation: string;
        summary: string;
    };
}

/**
 * Calculate overall credibility score from individual analysis results
 */
export function calculateCredibilityScore(
    aiResult: AIAnalysisResult,
    manipulationResult: ManipulationAnalysisResult,
    authenticityResult: AuthenticityAnalysisResult
): number {
    // Weights for different analysis types
    const weights = {
        ai: 0.4,        // AI detection is heavily weighted
        manipulation: 0.35, // Manipulation detection is important
        authenticity: 0.25  // Authenticity verification provides context
    };

    // Convert confidence scores to credibility scores (inverse for AI and manipulation)
    const aiCredibility = 100 - aiResult.confidence; // Lower AI confidence = higher credibility
    const manipulationCredibility = 100 - manipulationResult.confidence; // Lower manipulation confidence = higher credibility
    const authenticityCredibility = authenticityResult.confidence; // Higher authenticity confidence = higher credibility

    // Calculate weighted average
    const weightedScore = (
        aiCredibility * weights.ai +
        manipulationCredibility * weights.manipulation +
        authenticityCredibility * weights.authenticity
    );

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(weightedScore)));
}

/**
 * Generate recommendation based on analysis results
 */
export function generateRecommendation(
    credibilityScore: number,
    aiResult: AIAnalysisResult,
    manipulationResult: ManipulationAnalysisResult,
    authenticityResult: AuthenticityAnalysisResult
): string {
    if (credibilityScore >= 80) {
        return "HIGH CREDIBILITY: Video appears authentic with minimal signs of manipulation or AI generation.";
    } else if (credibilityScore >= 60) {
        return "MODERATE CREDIBILITY: Video shows some concerning indicators. Additional verification recommended.";
    } else if (credibilityScore >= 40) {
        return "LOW CREDIBILITY: Video shows significant signs of manipulation or AI generation. Use with caution.";
    } else {
        return "VERY LOW CREDIBILITY: Video likely contains AI-generated content or significant manipulations. Not recommended for use.";
    }
}

/**
 * Generate comprehensive summary of analysis results
 */
export function generateAnalysisSummary(
    aiResult: AIAnalysisResult,
    manipulationResult: ManipulationAnalysisResult,
    authenticityResult: AuthenticityAnalysisResult,
    credibilityScore: number
): string {
    const summaryParts: string[] = [];

    // AI Generation Summary
    if (aiResult.confidence > 70) {
        summaryParts.push(`High likelihood of AI generation (${aiResult.confidence}% confidence)`);
    } else if (aiResult.confidence > 40) {
        summaryParts.push(`Moderate signs of AI generation detected`);
    } else {
        summaryParts.push(`Low likelihood of AI generation`);
    }

    // Manipulation Summary
    if (manipulationResult.confidence > 70) {
        summaryParts.push(`significant video manipulation detected`);
    } else if (manipulationResult.confidence > 40) {
        summaryParts.push(`some video editing indicators found`);
    } else {
        summaryParts.push(`minimal signs of manipulation`);
    }

    // Authenticity Summary
    if (authenticityResult.confidence > 70) {
        summaryParts.push(`strong authenticity indicators present`);
    } else if (authenticityResult.confidence > 40) {
        summaryParts.push(`moderate authenticity verification`);
    } else {
        summaryParts.push(`limited authenticity verification possible`);
    }

    return `Analysis complete with ${credibilityScore}% credibility score. ${summaryParts.join(', ')}.`;
}

/**
 * Aggregate multiple AI analysis results
 */
export function aggregateAnalysisResults(
    aiResult: AIAnalysisResult,
    manipulationResult: ManipulationAnalysisResult,
    authenticityResult: AuthenticityAnalysisResult
): VideoAnalysisResults {
    const credibilityScore = calculateCredibilityScore(aiResult, manipulationResult, authenticityResult);
    const recommendation = generateRecommendation(credibilityScore, aiResult, manipulationResult, authenticityResult);
    const summary = generateAnalysisSummary(aiResult, manipulationResult, authenticityResult, credibilityScore);

    return {
        aiGenerated: aiResult,
        manipulation: manipulationResult,
        authenticity: authenticityResult,
        overall: {
            credibilityScore,
            recommendation,
            summary,
        },
    };
}

/**
 * Validate analysis results for completeness and consistency
 */
export function validateAnalysisResults(results: VideoAnalysisResults): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate confidence scores are within valid range (0-100)
    if (results.aiGenerated.confidence < 0 || results.aiGenerated.confidence > 100) {
        errors.push('AI detection confidence score is out of valid range (0-100)');
    }

    if (results.manipulation.confidence < 0 || results.manipulation.confidence > 100) {
        errors.push('Manipulation detection confidence score is out of valid range (0-100)');
    }

    if (results.authenticity.confidence < 0 || results.authenticity.confidence > 100) {
        errors.push('Authenticity verification confidence score is out of valid range (0-100)');
    }

    if (results.overall.credibilityScore < 0 || results.overall.credibilityScore > 100) {
        errors.push('Overall credibility score is out of valid range (0-100)');
    }

    // Validate timeline anomalies have valid timestamps
    for (const anomaly of results.manipulation.anomalies) {
        if (anomaly.timestamp < 0) {
            errors.push(`Timeline anomaly has invalid timestamp: ${anomaly.timestamp}`);
        }
        if (anomaly.duration <= 0) {
            errors.push(`Timeline anomaly has invalid duration: ${anomaly.duration}`);
        }
        if (anomaly.confidence < 0 || anomaly.confidence > 100) {
            errors.push(`Timeline anomaly has invalid confidence score: ${anomaly.confidence}`);
        }
    }

    // Validate authenticity sources
    for (const source of results.authenticity.sources) {
        if (source.similarity < 0 || source.similarity > 100) {
            errors.push(`Authenticity source has invalid similarity score: ${source.similarity}`);
        }
    }

    // Validate required fields are present
    if (!results.aiGenerated.explanation) {
        errors.push('AI detection explanation is missing');
    }

    if (!results.manipulation.explanation) {
        errors.push('Manipulation detection explanation is missing');
    }

    if (!results.authenticity.explanation) {
        errors.push('Authenticity verification explanation is missing');
    }

    if (!results.overall.recommendation) {
        errors.push('Overall recommendation is missing');
    }

    if (!results.overall.summary) {
        errors.push('Overall summary is missing');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Create default/empty analysis results
 */
export function createDefaultAnalysisResults(): VideoAnalysisResults {
    return {
        aiGenerated: {
            confidence: 0,
            techniques: [],
            explanation: 'AI detection analysis not yet performed',
            indicators: {
                facial_inconsistencies: 0,
                temporal_artifacts: 0,
                lighting_anomalies: 0,
                compression_artifacts: 0,
            },
        },
        manipulation: {
            confidence: 0,
            anomalies: [],
            explanation: 'Manipulation detection analysis not yet performed',
            indicators: {
                frame_cuts: 0,
                object_insertion: 0,
                background_changes: 0,
                audio_sync_issues: 0,
            },
        },
        authenticity: {
            confidence: 0,
            sources: [],
            metadata: {
                compression_history: [],
            },
            explanation: 'Authenticity verification analysis not yet performed',
        },
        overall: {
            credibilityScore: 0,
            recommendation: 'Analysis pending',
            summary: 'Video analysis has not been completed',
        },
    };
}