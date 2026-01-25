/**
 * Core data types and interfaces for Link Content Verification
 * 
 * This file defines all TypeScript interfaces, types, and enums used throughout
 * the link verification system. These types ensure type safety and consistency
 * across the verification pipeline.
 */

// ============================================================================
// Core Content Types
// ============================================================================

/**
 * Represents web content extracted from a URL
 */
export interface WebContent {
    /** The original URL that was processed */
    url: string;
    /** The title of the web page */
    title: string;
    /** The main text content extracted from the page */
    content: string;
    /** Metadata about the source and content */
    metadata: SourceMetadata;
    /** Timestamp when the content was extracted */
    extractedAt: Date;
    /** The type of content identified */
    contentType: 'article' | 'blog' | 'social' | 'news' | 'other';
}

/**
 * Metadata about the source website and content
 */
export interface SourceMetadata {
    /** The domain of the source website */
    domain: string;
    /** The title of the content */
    title: string;
    /** The author of the content, if available */
    author?: string;
    /** When the content was published, if available */
    publishedDate?: Date;
    /** Description or summary of the content */
    description?: string;
    /** The language of the content */
    language?: string;
    /** The canonical URL for the content */
    canonicalUrl?: string;
    /** Social media metadata (Open Graph, etc.) */
    socialMetadata?: {
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
    };
}

// ============================================================================
// Claim Analysis Types
// ============================================================================

/**
 * A factual claim extracted from web content
 */
export interface ExtractedClaim {
    /** Unique identifier for the claim */
    id: string;
    /** The text of the claim */
    text: string;
    /** Surrounding context that provides meaning to the claim */
    context: string;
    /** Confidence score (0-1) in the claim extraction */
    confidence: number;
    /** Category of the claim for better organization */
    category: 'factual' | 'statistical' | 'historical' | 'scientific' | 'other';
    /** Position of the claim within the original content */
    position: {
        start: number;
        end: number;
    };
}

// ============================================================================
// Fact Checking Types
// ============================================================================

/**
 * Result of fact-checking a specific claim
 */
export interface FactCheckResult {
    /** The claim that was fact-checked */
    claim: string;
    /** The verdict from fact-checking sources */
    verdict: 'true' | 'false' | 'mixed' | 'unverified';
    /** Explanation of the fact-check result */
    explanation: string;
    /** Sources that provided the fact-check information */
    sources: FactCheckSource[];
    /** Confidence in the fact-check result (0-1) */
    confidence: number;
}

/**
 * A source that provided fact-checking information
 */
export interface FactCheckSource {
    /** The publisher/organization that did the fact-check */
    publisher: string;
    /** URL to the fact-check article */
    url: string;
    /** Title of the fact-check article */
    title: string;
    /** The verdict given by this source */
    verdict: string;
    /** When the fact-check was published */
    publishedDate?: Date;
}

// ============================================================================
// Credibility Assessment Types
// ============================================================================

/**
 * Overall credibility score for a source
 */
export interface CredibilityScore {
    /** Overall credibility score (0-100) */
    overall: number;
    /** Individual factors that contribute to the score */
    factors: CredibilityFactor[];
    /** Human-readable explanation of the score */
    explanation: string;
    /** When this assessment was last updated */
    lastUpdated: Date;
}

/**
 * An individual factor in credibility assessment
 */
export interface CredibilityFactor {
    /** Name of the credibility factor */
    name: string;
    /** Score for this factor (0-100) */
    score: number;
    /** Weight of this factor in overall calculation */
    weight: number;
    /** Description of what this factor measures */
    description: string;
}

// ============================================================================
// Complete Verification Result
// ============================================================================

/**
 * Complete result of link content verification
 */
export interface VerificationResult {
    /** The URL that was verified */
    url: string;
    /** The extracted web content */
    webContent: WebContent;
    /** Claims extracted from the content */
    extractedClaims: ExtractedClaim[];
    /** Fact-check results for the claims */
    factCheckResults: FactCheckResult[];
    /** Credibility assessment of the source */
    credibilityScore: CredibilityScore;
    /** Time taken to process the verification (in milliseconds) */
    processingTime: number;
    /** When the verification was completed */
    timestamp: Date;
}

// ============================================================================
// Progress and State Management
// ============================================================================

/**
 * Progress information during verification
 */
export interface VerificationProgress {
    /** Current stage of the verification process */
    stage: 'validating' | 'fetching' | 'extracting' | 'analyzing' | 'verifying' | 'complete';
    /** Progress percentage (0-100) */
    percentage: number;
    /** Human-readable message about current progress */
    message: string;
    /** Estimated time remaining in milliseconds */
    estimatedTimeRemaining?: number;
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Types of errors that can occur during verification
 */
export type VerificationError =
    | 'invalid_url'
    | 'fetch_failed'
    | 'parse_error'
    | 'analysis_failed'
    | 'api_error'
    | 'timeout'
    | 'rate_limited';

/**
 * Detailed error information
 */
export interface VerificationErrorDetails {
    /** The type of error that occurred */
    type: VerificationError;
    /** Human-readable error message */
    message: string;
    /** Whether this error can be retried */
    retryable: boolean;
    /** Suggested action for the user */
    suggestedAction?: string;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request payload for link verification API
 */
export interface LinkVerificationRequest {
    /** The URL to verify */
    url: string;
}

/**
 * Response from link verification API
 */
export interface LinkVerificationResponse {
    /** Whether the verification was successful */
    success: boolean;
    /** The verification result data (if successful) */
    data?: VerificationResult;
    /** Error information (if unsuccessful) */
    error?: VerificationErrorDetails;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Configuration for the verification pipeline
 */
export interface VerificationConfig {
    /** Timeout for content fetching (in milliseconds) */
    fetchTimeout: number;
    /** Maximum number of claims to extract */
    maxClaims: number;
    /** Minimum confidence threshold for claims */
    minClaimConfidence: number;
    /** Whether to enable caching */
    enableCaching: boolean;
    /** Cache expiration time (in milliseconds) */
    cacheExpiration: number;
}

/**
 * Domain reputation information
 */
export interface DomainReputation {
    /** The domain being assessed */
    domain: string;
    /** Reputation score (0-100) */
    score: number;
    /** Factors contributing to the reputation */
    factors: string[];
    /** When this reputation was last assessed */
    lastAssessed: Date;
}

/**
 * Cache entry for verification results
 */
export interface VerificationCacheEntry {
    /** The cached verification result */
    result: VerificationResult;
    /** When this entry was cached */
    cachedAt: Date;
    /** When this entry expires */
    expiresAt: Date;
}

/**
 * State for the link verification component
 */
export interface LinkVerificationState {
    /** Current URL being processed */
    url: string;
    /** Whether verification is in progress */
    isLoading: boolean;
    /** Current verification results */
    results: VerificationResult | null;
    /** Current error state */
    error: VerificationErrorDetails | null;
    /** Current progress information */
    progress: VerificationProgress;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: VerificationError): boolean {
    return ['fetch_failed', 'api_error', 'timeout', 'rate_limited'].includes(error);
}

/**
 * Type guard to check if a verification result is complete
 */
export function isVerificationComplete(result: Partial<VerificationResult>): result is VerificationResult {
    return !!(
        result.url &&
        result.webContent &&
        result.extractedClaims &&
        result.factCheckResults &&
        result.credibilityScore &&
        result.processingTime !== undefined &&
        result.timestamp
    );
}

/**
 * Default configuration for verification
 */
export const DEFAULT_VERIFICATION_CONFIG: VerificationConfig = {
    fetchTimeout: 10000, // 10 seconds
    maxClaims: 10,
    minClaimConfidence: 0.7,
    enableCaching: true,
    cacheExpiration: 3600000, // 1 hour
};