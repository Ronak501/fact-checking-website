/**
 * Enums and constants for Link Content Verification
 * 
 * This file contains all enums, constants, and lookup tables used throughout
 * the link verification system.
 */

// ============================================================================
// Verification Stage Enums
// ============================================================================

/**
 * Stages of the verification process
 */
export enum VerificationStage {
  VALIDATING = 'validating',
  FETCHING = 'fetching',
  EXTRACTING = 'extracting',
  ANALYZING = 'analyzing',
  VERIFYING = 'verifying',
  COMPLETE = 'complete'
}

/**
 * Content types that can be processed
 */
export enum ContentType {
  ARTICLE = 'article',
  BLOG = 'blog',
  SOCIAL = 'social',
  NEWS = 'news',
  OTHER = 'other'
}

/**
 * Categories for extracted claims
 */
export enum ClaimCategory {
  FACTUAL = 'factual',
  STATISTICAL = 'statistical',
  HISTORICAL = 'historical',
  SCIENTIFIC = 'scientific',
  OTHER = 'other'
}

/**
 * Fact-check verdicts
 */
export enum FactCheckVerdict {
  TRUE = 'true',
  FALSE = 'false',
  MIXED = 'mixed',
  UNVERIFIED = 'unverified'
}

/**
 * Error types for verification
 */
export enum VerificationErrorType {
  INVALID_URL = 'invalid_url',
  FETCH_FAILED = 'fetch_failed',
  PARSE_ERROR = 'parse_error',
  ANALYSIS_FAILED = 'analysis_failed',
  API_ERROR = 'api_error',
  TIMEOUT = 'timeout',
  RATE_LIMITED = 'rate_limited'
}

// ============================================================================
// Credibility Factor Names
// ============================================================================

/**
 * Standard credibility factors used in assessment
 */
export enum CredibilityFactorName {
  DOMAIN_AUTHORITY = 'domain_authority',
  PUBLICATION_HISTORY = 'publication_history',
  EDITORIAL_STANDARDS = 'editorial_standards',
  TRANSPARENCY = 'transparency',
  FACT_CHECK_RECORD = 'fact_check_record',
  PEER_RECOGNITION = 'peer_recognition',
  BIAS_ASSESSMENT = 'bias_assessment'
}

// ============================================================================
// Progress Messages
// ============================================================================

/**
 * Standard progress messages for each verification stage
 */
export const PROGRESS_MESSAGES: Record<VerificationStage, string> = {
  [VerificationStage.VALIDATING]: 'Validating URL format and accessibility...',
  [VerificationStage.FETCHING]: 'Fetching web page content...',
  [VerificationStage.EXTRACTING]: 'Extracting text and metadata...',
  [VerificationStage.ANALYZING]: 'Analyzing content for factual claims...',
  [VerificationStage.VERIFYING]: 'Fact-checking claims against trusted sources...',
  [VerificationStage.COMPLETE]: 'Verification complete!'
};

/**
 * Progress percentages for each stage
 */
export const PROGRESS_PERCENTAGES: Record<VerificationStage, number> = {
  [VerificationStage.VALIDATING]: 10,
  [VerificationStage.FETCHING]: 25,
  [VerificationStage.EXTRACTING]: 40,
  [VerificationStage.ANALYZING]: 65,
  [VerificationStage.VERIFYING]: 85,
  [VerificationStage.COMPLETE]: 100
};

// ============================================================================
// Error Messages
// ============================================================================

/**
 * User-friendly error messages for each error type
 */
export const ERROR_MESSAGES: Record<VerificationErrorType, string> = {
  [VerificationErrorType.INVALID_URL]: 'The provided URL is not valid or accessible.',
  [VerificationErrorType.FETCH_FAILED]: 'Unable to fetch content from the provided URL.',
  [VerificationErrorType.PARSE_ERROR]: 'Unable to parse the content from the web page.',
  [VerificationErrorType.ANALYSIS_FAILED]: 'Failed to analyze the content for factual claims.',
  [VerificationErrorType.API_ERROR]: 'An error occurred while accessing external services.',
  [VerificationErrorType.TIMEOUT]: 'The verification process timed out.',
  [VerificationErrorType.RATE_LIMITED]: 'Too many requests. Please try again later.'
};

/**
 * Suggested actions for each error type
 */
export const ERROR_SUGGESTIONS: Record<VerificationErrorType, string> = {
  [VerificationErrorType.INVALID_URL]: 'Please check the URL format and ensure it starts with http:// or https://',
  [VerificationErrorType.FETCH_FAILED]: 'Please verify the URL is accessible and try again',
  [VerificationErrorType.PARSE_ERROR]: 'This content type may not be supported. Try a different URL',
  [VerificationErrorType.ANALYSIS_FAILED]: 'Please try again or contact support if the issue persists',
  [VerificationErrorType.API_ERROR]: 'Please try again in a few moments',
  [VerificationErrorType.TIMEOUT]: 'Please try again with a simpler page or check your connection',
  [VerificationErrorType.RATE_LIMITED]: 'Please wait a few minutes before submitting another request'
};

/**
 * Which error types are retryable
 */
export const RETRYABLE_ERRORS: Set<VerificationErrorType> = new Set([
  VerificationErrorType.FETCH_FAILED,
  VerificationErrorType.API_ERROR,
  VerificationErrorType.TIMEOUT,
  VerificationErrorType.RATE_LIMITED
]);

// ============================================================================
// Credibility Scoring Constants
// ============================================================================

/**
 * Default weights for credibility factors
 */
export const CREDIBILITY_FACTOR_WEIGHTS: Record<CredibilityFactorName, number> = {
  [CredibilityFactorName.DOMAIN_AUTHORITY]: 0.20,
  [CredibilityFactorName.PUBLICATION_HISTORY]: 0.15,
  [CredibilityFactorName.EDITORIAL_STANDARDS]: 0.20,
  [CredibilityFactorName.TRANSPARENCY]: 0.15,
  [CredibilityFactorName.FACT_CHECK_RECORD]: 0.15,
  [CredibilityFactorName.PEER_RECOGNITION]: 0.10,
  [CredibilityFactorName.BIAS_ASSESSMENT]: 0.05
};

/**
 * Descriptions for credibility factors
 */
export const CREDIBILITY_FACTOR_DESCRIPTIONS: Record<CredibilityFactorName, string> = {
  [CredibilityFactorName.DOMAIN_AUTHORITY]: 'Overall authority and reputation of the domain',
  [CredibilityFactorName.PUBLICATION_HISTORY]: 'Track record of accurate and reliable reporting',
  [CredibilityFactorName.EDITORIAL_STANDARDS]: 'Evidence of editorial oversight and fact-checking processes',
  [CredibilityFactorName.TRANSPARENCY]: 'Transparency about authors, sources, and funding',
  [CredibilityFactorName.FACT_CHECK_RECORD]: 'History of corrections and fact-checking accuracy',
  [CredibilityFactorName.PEER_RECOGNITION]: 'Recognition from journalism organizations and peers',
  [CredibilityFactorName.BIAS_ASSESSMENT]: 'Assessment of political or ideological bias'
};

// ============================================================================
// Content Type Detection Patterns
// ============================================================================

/**
 * URL patterns for detecting content types
 */
export const CONTENT_TYPE_PATTERNS: Record<ContentType, RegExp[]> = {
  [ContentType.NEWS]: [
    /\.(com|org|net)\/(news|politics|world|local)/i,
    /^https?:\/\/(www\.)?(cnn|bbc|reuters|ap|npr|pbs)/i,
    /\/(breaking|latest|today)/i
  ],
  [ContentType.BLOG]: [
    /\.(blog|wordpress|medium|substack)/i,
    /\/blog\//i,
    /\/(post|article)\/\d{4}/i
  ],
  [ContentType.SOCIAL]: [
    /^https?:\/\/(www\.)?(twitter|facebook|instagram|linkedin|tiktok)/i,
    /\/(status|post|p)\/\w+/i
  ],
  [ContentType.ARTICLE]: [
    /\/(article|story|feature)/i,
    /\d{4}\/\d{2}\/\d{2}/i
  ],
  [ContentType.OTHER]: []
};

// ============================================================================
// Validation Constants
// ============================================================================

/**
 * URL validation patterns
 */
export const URL_PATTERNS = {
  HTTP_HTTPS: /^https?:\/\/.+/i,
  SHORTENED: /^https?:\/\/(bit\.ly|tinyurl|t\.co|goo\.gl|short\.link)/i,
  VALID_DOMAIN: /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\/.*/
};

/**
 * Content extraction limits
 */
export const CONTENT_LIMITS = {
  MAX_CONTENT_LENGTH: 50000, // 50KB of text content
  MAX_CLAIMS: 20,
  MIN_CLAIM_LENGTH: 10,
  MAX_CLAIM_LENGTH: 500,
  MIN_CONFIDENCE: 0.5
};

/**
 * Timeout configurations (in milliseconds)
 */
export const TIMEOUTS = {
  URL_VALIDATION: 5000,    // 5 seconds
  CONTENT_FETCH: 15000,    // 15 seconds
  CONTENT_PARSE: 5000,     // 5 seconds
  CLAIM_ANALYSIS: 30000,   // 30 seconds
  FACT_CHECK: 20000,       // 20 seconds
  CREDIBILITY_ASSESS: 10000 // 10 seconds
};

/**
 * Cache configurations
 */
export const CACHE_CONFIG = {
  DEFAULT_TTL: 3600000,     // 1 hour
  MAX_ENTRIES: 1000,
  CLEANUP_INTERVAL: 300000  // 5 minutes
};