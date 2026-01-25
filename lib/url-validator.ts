/**
 * URL Validator Utility Functions
 * 
 * This module provides comprehensive URL validation, sanitization, and accessibility
 * checking for the Link Content Verification system. It ensures that only valid,
 * accessible URLs are processed by the verification pipeline.
 * 
 * Requirements: 1.1, 1.4
 */

import { VerificationErrorType, URL_PATTERNS, TIMEOUTS } from '@/types/link-verification-enums';
import { VerificationErrorDetails } from '@/types/link-verification';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Result of URL validation
 */
export interface URLValidationResult {
    /** Whether the URL is valid */
    isValid: boolean;
    /** The normalized URL (if valid) */
    normalizedUrl?: string;
    /** Error details (if invalid) */
    error?: VerificationErrorDetails;
    /** Additional metadata about the URL */
    metadata?: URLMetadata;
}

/**
 * Metadata extracted during URL validation
 */
export interface URLMetadata {
    /** The original URL as provided */
    originalUrl: string;
    /** The normalized URL */
    normalizedUrl: string;
    /** The protocol (http or https) */
    protocol: string;
    /** The hostname */
    hostname: string;
    /** The domain (hostname without subdomains) */
    domain: string;
    /** Whether this is a shortened URL */
    isShortened: boolean;
    /** Whether this URL redirects */
    hasRedirects?: boolean;
    /** The final URL after following redirects */
    finalUrl?: string;
}

/**
 * Result of URL accessibility check
 */
export interface URLAccessibilityResult {
    /** Whether the URL is accessible */
    isAccessible: boolean;
    /** HTTP status code */
    statusCode?: number;
    /** Response headers */
    headers?: Record<string, string>;
    /** Error details (if not accessible) */
    error?: VerificationErrorDetails;
    /** Response time in milliseconds */
    responseTime?: number;
}

// ============================================================================
// URL Format Validation
// ============================================================================

/**
 * Validates URL format and structure
 * 
 * @param url - The URL to validate
 * @returns Validation result with normalized URL or error details
 */
export function validateURLFormat(url: string): URLValidationResult {
    // Check if URL is provided
    if (!url || typeof url !== 'string') {
        return {
            isValid: false,
            error: {
                type: VerificationErrorType.INVALID_URL,
                message: 'URL is required and must be a string',
                retryable: false,
                suggestedAction: 'Please provide a valid URL'
            }
        };
    }

    // Trim whitespace
    const trimmedUrl = url.trim();

    if (trimmedUrl.length === 0) {
        return {
            isValid: false,
            error: {
                type: VerificationErrorType.INVALID_URL,
                message: 'URL cannot be empty',
                retryable: false,
                suggestedAction: 'Please provide a valid URL'
            }
        };
    }

    // Check for basic HTTP/HTTPS format
    if (!URL_PATTERNS.HTTP_HTTPS.test(trimmedUrl)) {
        return {
            isValid: false,
            error: {
                type: VerificationErrorType.INVALID_URL,
                message: 'URL must start with http:// or https://',
                retryable: false,
                suggestedAction: 'Please ensure the URL starts with http:// or https://'
            }
        };
    }

    try {
        // Use URL constructor for detailed validation
        const urlObj = new URL(trimmedUrl);

        // Validate protocol
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return {
                isValid: false,
                error: {
                    type: VerificationErrorType.INVALID_URL,
                    message: 'Only HTTP and HTTPS protocols are supported',
                    retryable: false,
                    suggestedAction: 'Please use a URL with http:// or https://'
                }
            };
        }

        // Validate hostname
        if (!urlObj.hostname || urlObj.hostname.length === 0) {
            return {
                isValid: false,
                error: {
                    type: VerificationErrorType.INVALID_URL,
                    message: 'URL must have a valid hostname',
                    retryable: false,
                    suggestedAction: 'Please provide a URL with a valid domain name'
                }
            };
        }

        // Check for valid domain pattern
        if (!URL_PATTERNS.VALID_DOMAIN.test(trimmedUrl)) {
            return {
                isValid: false,
                error: {
                    type: VerificationErrorType.INVALID_URL,
                    message: 'URL has an invalid domain format',
                    retryable: false,
                    suggestedAction: 'Please check the domain name format'
                }
            };
        }

        // Extract metadata
        const metadata: URLMetadata = {
            originalUrl: url,
            normalizedUrl: normalizeURL(trimmedUrl),
            protocol: urlObj.protocol.slice(0, -1), // Remove trailing colon
            hostname: urlObj.hostname,
            domain: extractDomain(urlObj.hostname),
            isShortened: URL_PATTERNS.SHORTENED.test(trimmedUrl)
        };

        return {
            isValid: true,
            normalizedUrl: metadata.normalizedUrl,
            metadata
        };

    } catch (error) {
        return {
            isValid: false,
            error: {
                type: VerificationErrorType.INVALID_URL,
                message: 'URL format is invalid',
                retryable: false,
                suggestedAction: 'Please check the URL format and try again'
            }
        };
    }
}

// ============================================================================
// URL Sanitization and Normalization
// ============================================================================

/**
 * Normalizes a URL by removing unnecessary parameters and fragments
 * 
 * @param url - The URL to normalize
 * @returns The normalized URL
 */
export function normalizeURL(url: string): string {
    try {
        const urlObj = new URL(url);

        // Remove common tracking parameters
        const trackingParams = [
            'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
            'fbclid', 'gclid', 'msclkid', 'ref', 'source', 'campaign',
            '_ga', '_gl', 'mc_cid', 'mc_eid'
        ];

        trackingParams.forEach(param => {
            urlObj.searchParams.delete(param);
        });

        // Remove fragment (hash) as it's not needed for content fetching
        urlObj.hash = '';

        // Ensure consistent protocol (prefer HTTPS if available)
        // Note: We don't automatically upgrade to HTTPS here as it might break some URLs
        // This will be handled during accessibility checking

        // Normalize pathname (remove double slashes, etc.)
        urlObj.pathname = urlObj.pathname.replace(/\/+/g, '/');

        // Remove trailing slash unless it's the root path
        if (urlObj.pathname.length > 1 && urlObj.pathname.endsWith('/')) {
            urlObj.pathname = urlObj.pathname.slice(0, -1);
        }

        return urlObj.toString();
    } catch (error) {
        // If normalization fails, return the original URL
        return url;
    }
}

/**
 * Sanitizes a URL by removing potentially harmful elements
 * 
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeURL(url: string): string {
    // Remove any potential XSS attempts in the URL
    const sanitized = url
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/data:/gi, '')
        .replace(/vbscript:/gi, '')
        .replace(/on\w+\s*=/gi, '');

    return sanitized.trim();
}

// ============================================================================
// URL Accessibility Checking
// ============================================================================

/**
 * Checks if a URL is accessible by making a HEAD request
 * 
 * @param url - The URL to check
 * @returns Promise resolving to accessibility result
 */
export async function checkURLAccessibility(url: string): Promise<URLAccessibilityResult> {
    const startTime = Date.now();

    try {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.URL_VALIDATION);

        try {
            // First try HEAD request to check accessibility without downloading content
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FactCheckBot/1.0)',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - startTime;

            // Extract response headers
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });

            // Check if response is successful
            if (response.ok) {
                return {
                    isAccessible: true,
                    statusCode: response.status,
                    headers,
                    responseTime
                };
            }

            // Handle specific HTTP error codes
            let errorMessage = `Server returned ${response.status} ${response.statusText}`;
            let suggestedAction = 'Please check the URL and try again';

            switch (response.status) {
                case 403:
                    errorMessage = 'Access to this URL is forbidden';
                    suggestedAction = 'This website may block automated access';
                    break;
                case 404:
                    errorMessage = 'The requested page was not found';
                    suggestedAction = 'Please check if the URL is correct';
                    break;
                case 429:
                    errorMessage = 'Too many requests to this server';
                    suggestedAction = 'Please try again later';
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    errorMessage = 'The server is experiencing issues';
                    suggestedAction = 'Please try again later';
                    break;
            }

            return {
                isAccessible: false,
                statusCode: response.status,
                headers,
                responseTime,
                error: {
                    type: VerificationErrorType.FETCH_FAILED,
                    message: errorMessage,
                    retryable: [429, 500, 502, 503, 504].includes(response.status),
                    suggestedAction
                }
            };

        } catch (fetchError) {
            clearTimeout(timeoutId);

            // If HEAD request fails, try GET request (some servers don't support HEAD)
            if (fetchError instanceof Error && !fetchError.name.includes('Abort')) {
                return await checkURLAccessibilityWithGet(url, startTime);
            }

            throw fetchError;
        }

    } catch (error) {
        const responseTime = Date.now() - startTime;

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return {
                    isAccessible: false,
                    responseTime,
                    error: {
                        type: VerificationErrorType.TIMEOUT,
                        message: 'Request timed out while checking URL accessibility',
                        retryable: true,
                        suggestedAction: 'Please try again or check your internet connection'
                    }
                };
            }

            if (error.message.includes('fetch')) {
                return {
                    isAccessible: false,
                    responseTime,
                    error: {
                        type: VerificationErrorType.FETCH_FAILED,
                        message: 'Unable to connect to the URL',
                        retryable: true,
                        suggestedAction: 'Please check the URL and your internet connection'
                    }
                };
            }
        }

        return {
            isAccessible: false,
            responseTime,
            error: {
                type: VerificationErrorType.FETCH_FAILED,
                message: 'An unexpected error occurred while checking URL accessibility',
                retryable: true,
                suggestedAction: 'Please try again'
            }
        };
    }
}

/**
 * Fallback accessibility check using GET request
 * 
 * @param url - The URL to check
 * @param startTime - When the check started
 * @returns Promise resolving to accessibility result
 */
async function checkURLAccessibilityWithGet(url: string, startTime: number): Promise<URLAccessibilityResult> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.URL_VALIDATION);

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FactCheckBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        if (response.ok) {
            return {
                isAccessible: true,
                statusCode: response.status,
                headers,
                responseTime
            };
        }

        return {
            isAccessible: false,
            statusCode: response.status,
            headers,
            responseTime,
            error: {
                type: VerificationErrorType.FETCH_FAILED,
                message: `Server returned ${response.status} ${response.statusText}`,
                retryable: [429, 500, 502, 503, 504].includes(response.status),
                suggestedAction: 'Please check the URL and try again'
            }
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;

        return {
            isAccessible: false,
            responseTime,
            error: {
                type: VerificationErrorType.FETCH_FAILED,
                message: 'Unable to access the URL',
                retryable: true,
                suggestedAction: 'Please check the URL and try again'
            }
        };
    }
}

// ============================================================================
// Comprehensive URL Validation
// ============================================================================

/**
 * Performs comprehensive URL validation including format and accessibility checks
 * 
 * @param url - The URL to validate
 * @returns Promise resolving to complete validation result
 */
export async function validateURL(url: string): Promise<URLValidationResult> {
    // First, sanitize the URL
    const sanitizedUrl = sanitizeURL(url);

    // Validate format
    const formatResult = validateURLFormat(sanitizedUrl);
    if (!formatResult.isValid) {
        return formatResult;
    }

    // Check accessibility
    const accessibilityResult = await checkURLAccessibility(formatResult.normalizedUrl!);
    if (!accessibilityResult.isAccessible) {
        return {
            isValid: false,
            error: accessibilityResult.error,
            metadata: formatResult.metadata
        };
    }

    // If we get here, the URL is valid and accessible
    const metadata = formatResult.metadata!;

    // Update metadata with accessibility information
    if (accessibilityResult.headers) {
        // Check if there were redirects by looking at the response
        const location = accessibilityResult.headers['location'];
        if (location) {
            metadata.hasRedirects = true;
            metadata.finalUrl = location;
        }
    }

    return {
        isValid: true,
        normalizedUrl: formatResult.normalizedUrl,
        metadata
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extracts the domain from a hostname (removes subdomains)
 * 
 * @param hostname - The hostname to extract domain from
 * @returns The domain without subdomains
 */
function extractDomain(hostname: string): string {
    const parts = hostname.split('.');

    // Handle special cases like co.uk, com.au, etc.
    const twoPartTlds = ['co.uk', 'com.au', 'co.jp', 'co.in', 'com.br'];
    const lastTwoParts = parts.slice(-2).join('.');

    if (twoPartTlds.includes(lastTwoParts)) {
        // Return domain.tld.country format
        return parts.slice(-3).join('.');
    }

    // Return domain.tld format
    return parts.slice(-2).join('.');
}

/**
 * Checks if a URL is a shortened URL
 * 
 * @param url - The URL to check
 * @returns Whether the URL is shortened
 */
export function isShortenedURL(url: string): boolean {
    return URL_PATTERNS.SHORTENED.test(url);
}

/**
 * Resolves a shortened URL to its final destination
 * 
 * @param url - The shortened URL to resolve
 * @returns Promise resolving to the final URL or null if resolution fails
 */
export async function resolveShortenedURL(url: string): Promise<string | null> {
    if (!isShortenedURL(url)) {
        return url; // Not a shortened URL, return as-is
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.URL_VALIDATION);

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FactCheckBot/1.0)'
            }
        });

        clearTimeout(timeoutId);

        // The final URL after following redirects
        return response.url;

    } catch (error) {
        // If resolution fails, return null
        return null;
    }
}