/**
 * Type definitions index for Link Content Verification
 * 
 * This file re-exports all types, interfaces, and enums for easy importing
 * throughout the application.
 */

// Core types and interfaces
export type {
  WebContent,
  SourceMetadata,
  ExtractedClaim,
  FactCheckResult,
  FactCheckSource,
  CredibilityScore,
  CredibilityFactor,
  VerificationResult,
  VerificationProgress,
  VerificationError,
  VerificationErrorDetails,
  LinkVerificationRequest,
  LinkVerificationResponse,
  VerificationConfig,
  DomainReputation,
  VerificationCacheEntry,
  LinkVerificationState
} from './link-verification';

// Enums and constants
export {
  VerificationStage,
  ContentType,
  ClaimCategory,
  FactCheckVerdict,
  VerificationErrorType,
  CredibilityFactorName,
  PROGRESS_MESSAGES,
  PROGRESS_PERCENTAGES,
  ERROR_MESSAGES,
  ERROR_SUGGESTIONS,
  RETRYABLE_ERRORS,
  CREDIBILITY_FACTOR_WEIGHTS,
  CREDIBILITY_FACTOR_DESCRIPTIONS,
  CONTENT_TYPE_PATTERNS,
  URL_PATTERNS,
  CONTENT_LIMITS,
  TIMEOUTS,
  CACHE_CONFIG
} from './link-verification-enums';

// Utility functions
export {
  isRetryableError,
  isVerificationComplete,
  DEFAULT_VERIFICATION_CONFIG
} from './link-verification';