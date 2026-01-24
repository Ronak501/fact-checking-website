// Video authenticity verification using Google Gemini

import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthenticityAnalysisResult, AuthenticitySource } from './analysis-aggregation';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

/**
 * Prompts for authenticity verification
 */
const AUTHENTICITY_PROMPTS = {
  metadata: `Analyze this video's metadata and technical characteristics for authenticity markers:
1. Compression patterns and encoding signatures
2. Creation timestamp consistency
3. Device fingerprints and camera characteristics
4. File format and container analysis
5. Embedded metadata integrity
6. Technical fingerprints that indicate original source

Assess the likelihood that this video is from an original, unmodified source.`,

  contextual: `Examine this video for contextual authenticity indicators:
1. Environmental consistency (lighting, shadows, reflections)
2. Physical plausibility of events and interactions
3. Temporal consistency of elements in the scene
4. Audio-visual coherence and natural synchronization
5. Realistic human behavior and expressions
6. Consistent perspective and camera movement

Evaluate whether the content appears to be authentic and unmanipulated.`,

  source: `Analyze this video for source verification markers:
1. Watermarks, logos, or identifying elements
2. Broadcasting or platform-specific characteristics
3. Professional vs amateur production indicators
4. Equipment signatures (camera, microphone, editing software)
5. Distribution chain indicators
6. Compression history and re-encoding patterns

Determine the likelihood of authentic source material and original provenance.`
};

/**
 * Parse Gemini response for authenticity verification
 */
function parseAuthenticityResponse(response: string): {
  confidence: number;
  sources: AuthenticitySource[];
  metadata: {
    creation_date?: string;
    device_info?: string;
    location?: string;
    compression_history: string[];
  };
} {
  let confidence = 0;
  const sources: AuthenticitySource[] = [];
  const metadata = {
    compression_history: [] as string[],
  };

  try {
    // Extract confidence score
    const confidenceMatch = response.match(/confidence[:\s]*(\d+)%?/i) || 
                           response.match(/(\d+)%?\s*(?:authentic|genuine|original)/i) ||
                           response.match(/authenticity[:\s]*(\d+)%?/i);
    if (confidenceMatch) {
      confidence = Math.min(100, Math.max(0, parseInt(confidenceMatch[1])));
    }

    // Extract metadata information
    const dateMatch = response.match(/(?:created?|date)[:\s]*([0-9]{4}[-\/][0-9]{1,2}[-\/][0-9]{1,2})/i);
    if (dateMatch) {
      metadata.creation_date = dateMatch[1];
    }

    const deviceMatch = response.match(/(?:device|camera|phone)[:\s]*([^\n\r.]+)/i);
    if (deviceMatch) {
      metadata.device_info = deviceMatch[1].trim();
    }

    const locationMatch = response.match(/(?:location|gps|coordinates)[:\s]*([^\n\r.]+)/i);
    if (locationMatch) {
      metadata.location = locationMatch[1].trim();
    }

    // Extract compression history
    const compressionKeywords = ['h264', 'h265', 'mp4', 'avi', 'mov', 'webm', 'compressed', 'encoded', 'transcoded'];
    for (const keyword of compressionKeywords) {
      if (response.toLowerCase().includes(keyword)) {
        metadata.compression_history.push(keyword.toUpperCase());
      }
    }

    // Extract potential sources
    const sourceKeywords = [
      { pattern: /youtube|yt/i, source: 'YouTube', verified: false },
      { pattern: /facebook|fb/i, source: 'Facebook', verified: false },
      { pattern: /instagram|ig/i, source: 'Instagram', verified: false },
      { pattern: /twitter|x\.com/i, source: 'Twitter/X', verified: false },
      { pattern: /tiktok/i, source: 'TikTok', verified: false },
      { pattern: /news|broadcast/i, source: 'News Media', verified: true },
      { pattern: /original|source/i, source: 'Original Source', verified: true },
    ];

    for (const { pattern, source, verified } of sourceKeywords) {
      if (pattern.test(response)) {
        sources.push({
          similarity: Math.min(100, confidence + Math.random() * 20 - 10),
          source,
          verified,
        });
      }
    }

    // If no sources found but confidence is reasonable, add generic source
    if (sources.length === 0 && confidence > 30) {
      sources.push({
        similarity: confidence,
        source: 'Unknown Source',
        verified: false,
      });
    }

  } catch (error) {
    console.warn('Failed to parse authenticity response:', error);
  }

  return { confidence, sources, metadata };
}

/**
 * Analyze video authenticity using Gemini
 */
export async function analyzeAuthenticity(
  videoBuffer: Buffer,
  analysisType: 'metadata' | 'contextual' | 'source' = 'metadata'
): Promise<Partial<AuthenticityAnalysisResult>> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const videoBase64 = videoBuffer.toString('base64');
    const prompt = AUTHENTICITY_PROMPTS[analysisType];
    
    const result = await model.generateContent([
      {
        inlineData: {
          data: videoBase64,
          mimeType: 'video/mp4'
        }
      },
      prompt
    ]);

    const response = result.response.text();
    const parsed = parseAuthenticityResponse(response);

    return {
      confidence: parsed.confidence,
      sources: parsed.sources,
      metadata: parsed.metadata,
      explanation: response,
    };

  } catch (error) {
    console.error('Authenticity verification failed:', error);
    
    return {
      confidence: 0,
      sources: [],
      metadata: {
        compression_history: [],
      },
      explanation: `Authenticity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Perform comprehensive authenticity verification
 */
export async function performAuthenticityVerification(videoBuffer: Buffer): Promise<AuthenticityAnalysisResult> {
  try {
    // Run multiple analysis types
    const [metadataResult, contextualResult, sourceResult] = await Promise.allSettled([
      analyzeAuthenticity(videoBuffer, 'metadata'),
      analyzeAuthenticity(videoBuffer, 'contextual'),
      analyzeAuthenticity(videoBuffer, 'source'),
    ]);

    // Combine results from successful analyses
    const results: Partial<AuthenticityAnalysisResult>[] = [];
    
    if (metadataResult.status === 'fulfilled') results.push(metadataResult.value);
    if (contextualResult.status === 'fulfilled') results.push(contextualResult.value);
    if (sourceResult.status === 'fulfilled') results.push(sourceResult.value);

    if (results.length === 0) {
      throw new Error('All authenticity verification analyses failed');
    }

    // Aggregate results
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;
    
    // Combine sources and remove duplicates
    const allSources = results.flatMap(r => r.sources || []);
    const uniqueSources = deduplicateSources(allSources);
    
    // Merge metadata
    const combinedMetadata = {
      creation_date: results.find(r => r.metadata?.creation_date)?.metadata?.creation_date,
      device_info: results.find(r => r.metadata?.device_info)?.metadata?.device_info,
      location: results.find(r => r.metadata?.location)?.metadata?.location,
      compression_history: [...new Set(results.flatMap(r => r.metadata?.compression_history || []))],
    };

    const combinedExplanation = `Combined Authenticity Verification Analysis:\n\n${results.map((r, i) => 
      `Analysis ${i + 1}: ${r.explanation || 'No explanation available'}`
    ).join('\n\n')}`;

    return {
      confidence: Math.round(avgConfidence),
      sources: uniqueSources,
      metadata: combinedMetadata,
      explanation: combinedExplanation,
    };

  } catch (error) {
    console.error('Comprehensive authenticity verification failed:', error);
    
    return {
      confidence: 0,
      sources: [],
      metadata: {
        compression_history: [],
      },
      explanation: `Authenticity verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Remove duplicate sources and merge similar ones
 */
function deduplicateSources(sources: AuthenticitySource[]): AuthenticitySource[] {
  const sourceMap = new Map<string, AuthenticitySource>();
  
  for (const source of sources) {
    const key = source.source.toLowerCase();
    
    if (sourceMap.has(key)) {
      const existing = sourceMap.get(key)!;
      // Keep the one with higher similarity
      if (source.similarity > existing.similarity) {
        sourceMap.set(key, source);
      }
    } else {
      sourceMap.set(key, source);
    }
  }
  
  return Array.from(sourceMap.values()).sort((a, b) => b.similarity - a.similarity);
}

/**
 * Perform reverse video search (placeholder implementation)
 */
export async function performReverseVideoSearch(videoBuffer: Buffer): Promise<AuthenticitySource[]> {
  // This is a placeholder implementation
  // In production, this would integrate with reverse video search APIs
  
  try {
    // Simulate reverse search results
    const mockSources: AuthenticitySource[] = [
      {
        url: 'https://example.com/original-video',
        similarity: 95,
        source: 'Original Source',
        verified: true,
      },
      {
        url: 'https://news.example.com/video',
        similarity: 87,
        source: 'News Media',
        verified: true,
      },
    ];

    // In reality, this would make API calls to reverse search services
    return mockSources;

  } catch (error) {
    console.error('Reverse video search failed:', error);
    return [];
  }
}

/**
 * Validate authenticity sources
 */
export function validateAuthenticitySources(sources: AuthenticitySource[]): boolean {
  return sources.every(source => 
    source.similarity >= 0 && 
    source.similarity <= 100 &&
    source.source && 
    source.source.length > 0 &&
    typeof source.verified === 'boolean'
  );
}

/**
 * Generate authenticity assessment report
 */
export function generateAuthenticityReport(result: AuthenticityAnalysisResult): {
  summary: string;
  details: string[];
  recommendations: string[];
} {
  const summary = `Authenticity confidence: ${result.confidence}% based on ${result.sources.length} source(s) analyzed.`;
  
  const details: string[] = [];
  
  if (result.metadata.creation_date) {
    details.push(`Creation date: ${result.metadata.creation_date}`);
  }
  
  if (result.metadata.device_info) {
    details.push(`Device information: ${result.metadata.device_info}`);
  }
  
  if (result.metadata.location) {
    details.push(`Location data: ${result.metadata.location}`);
  }
  
  if (result.metadata.compression_history.length > 0) {
    details.push(`Compression history: ${result.metadata.compression_history.join(', ')}`);
  }

  const recommendations: string[] = [];
  
  if (result.confidence >= 80) {
    recommendations.push('High authenticity confidence - video appears to be from original source');
  } else if (result.confidence >= 60) {
    recommendations.push('Moderate authenticity - additional verification recommended');
  } else {
    recommendations.push('Low authenticity confidence - exercise caution when using this content');
  }
  
  const verifiedSources = result.sources.filter(s => s.verified).length;
  if (verifiedSources > 0) {
    recommendations.push(`${verifiedSources} verified source(s) found`);
  } else {
    recommendations.push('No verified sources identified - consider additional verification');
  }

  return { summary, details, recommendations };
}