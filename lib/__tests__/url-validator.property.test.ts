/**
 * Property-Based Tests for URL Validation
 * 
 * Feature: link-content-verification
 * Property 1: URL Validation Completeness
 * **Validates: Requirements 1.1, 1.2, 1.4**
 * 
 * These tests verify that URL validation correctly classifies inputs as valid or invalid
 * and that valid URLs proceed to processing while invalid URLs return descriptive error messages.
 */

import * as fc from 'fast-check';
import {
    validateURLFormat,
    validateURL,
    sanitizeURL,
    normalizeURL,
    isShortenedURL,
    URLValidationResult
} from '../url-validator';
import { VerificationErrorType } from '@/types/link-verification-enums';

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generator for valid HTTP/HTTPS URLs (ensures path is present for domain validation)
 */
const validUrlArbitrary = fc.record({
    protocol: fc.constantFrom('http', 'https'),
    domain: fc.domain(),
    path: fc.string({ minLength: 1, maxLength: 100 }).map(s => '/' + s.replace(/[^a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]/g, '')),
}).map(({ protocol, domain, path }) =>
    `${protocol}://${domain}${path}`
);

/**
 * Generator for invalid URLs (various invalid formats)
 */
const invalidUrlArbitrary = fc.oneof(
    // Empty or null-like values
    fc.constantFrom('', '   ', '\t\n'),

    // Non-string values converted to string
    fc.oneof(
        fc.constant('null'),
        fc.constant('undefined'),
        fc.integer().map(n => n.toString())
    ),

    // Invalid protocols
    fc.record({
        protocol: fc.constantFrom('ftp', 'file', 'javascript', 'data', 'mailto'),
        domain: fc.domain()
    }).map(({ protocol, domain }) => `${protocol}://${domain}/`),

    // Missing protocol
    fc.domain().map(domain => domain),

    // Invalid domain formats
    fc.oneof(
        fc.constant('http://'),
        fc.constant('https://'),
        fc.constant('http://.com/'),
        fc.constant('https://..com/'),
        fc.constant('http://domain..com/'),
        fc.constant('http://domain./'),
        fc.constant('http://-domain.com/'),
        fc.constant('http://domain-.com/')
    )
);

/**
 * Generator for shortened URLs
 */
const shortenedUrlArbitrary = fc.record({
    service: fc.constantFrom('bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'short.link'),
    path: fc.string({ minLength: 3, maxLength: 10 }).filter(s => /^[a-zA-Z0-9]+$/.test(s))
}).map(({ service, path }) => `https://${service}/${path}`);

/**
 * Generator for any string input (including edge cases)
 */
const anyStringArbitrary = fc.oneof(
    validUrlArbitrary,
    invalidUrlArbitrary,
    shortenedUrlArbitrary,
    fc.string({ minLength: 0, maxLength: 200 }),
    fc.constantFrom(
        'http://localhost/',
        'https://127.0.0.1/',
        'http://example.com/',
        'https://www.google.com/',
        'http://test.co.uk/',
        'https://sub.domain.com/path?query=value#fragment'
    )
);

// ============================================================================
// Property Tests
// ============================================================================

describe('URL Validation Properties', () => {

    /**
     * Property 1: URL Validation Completeness
     * **Validates: Requirements 1.1, 1.2, 1.4**
     * 
     * For any string input, the URL validator should correctly classify it as either 
     * valid or invalid, and valid URLs should proceed to processing while invalid 
     * URLs should return descriptive error messages.
     */
    describe('Property 1: URL Validation Completeness', () => {

        test('validateURLFormat always returns a valid URLValidationResult', () => {
            fc.assert(fc.property(anyStringArbitrary, (input) => {
                const result = validateURLFormat(input);

                // Result must have isValid boolean
                expect(typeof result.isValid).toBe('boolean');

                if (result.isValid) {
                    // Valid results must have normalizedUrl and metadata
                    expect(typeof result.normalizedUrl).toBe('string');
                    expect(result.normalizedUrl!.length).toBeGreaterThan(0);
                    expect(result.metadata).toBeDefined();
                    expect(result.error).toBeUndefined();

                    // Normalized URL should be a valid URL format
                    expect(result.normalizedUrl!).toMatch(/^https?:\/\/.+/);

                    // Metadata should contain required fields
                    expect(result.metadata!.originalUrl).toBe(input);
                    expect(typeof result.metadata!.protocol).toBe('string');
                    expect(typeof result.metadata!.hostname).toBe('string');
                    expect(typeof result.metadata!.domain).toBe('string');
                    expect(typeof result.metadata!.isShortened).toBe('boolean');
                } else {
                    // Invalid results must have error details
                    expect(result.error).toBeDefined();
                    expect(result.normalizedUrl).toBeUndefined();

                    // Error must have required fields
                    expect(typeof result.error!.type).toBe('string');
                    expect(typeof result.error!.message).toBe('string');
                    expect(typeof result.error!.retryable).toBe('boolean');
                    expect(result.error!.message.length).toBeGreaterThan(0);

                    // Error type should be INVALID_URL for format validation
                    expect(result.error!.type).toBe(VerificationErrorType.INVALID_URL);
                }
            }), { numRuns: 100 });
        });

        test('valid HTTP/HTTPS URLs are always classified as valid', () => {
            fc.assert(fc.property(validUrlArbitrary, (validUrl) => {
                const result = validateURLFormat(validUrl);

                // All properly formatted HTTP/HTTPS URLs should be valid
                expect(result.isValid).toBe(true);
                expect(result.normalizedUrl).toBeDefined();
                expect(result.metadata).toBeDefined();
                expect(result.error).toBeUndefined();

                // The normalized URL should still be HTTP/HTTPS
                expect(result.normalizedUrl!).toMatch(/^https?:\/\/.+/);
            }), { numRuns: 50 });
        });

        test('invalid URLs are always classified as invalid with descriptive errors', () => {
            fc.assert(fc.property(invalidUrlArbitrary, (invalidUrl) => {
                const result = validateURLFormat(invalidUrl);

                // All invalid URLs should be rejected
                expect(result.isValid).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.normalizedUrl).toBeUndefined();

                // Error message should be descriptive (not empty)
                expect(result.error!.message.length).toBeGreaterThan(10);
                expect(result.error!.type).toBe(VerificationErrorType.INVALID_URL);

                // Should have suggested action
                expect(result.error!.suggestedAction).toBeDefined();
                expect(result.error!.suggestedAction!.length).toBeGreaterThan(0);
            }), { numRuns: 50 });
        });

        test('shortened URLs are correctly identified', () => {
            fc.assert(fc.property(shortenedUrlArbitrary, (shortenedUrl) => {
                const result = validateURLFormat(shortenedUrl);

                // Shortened URLs should be valid
                expect(result.isValid).toBe(true);
                expect(result.metadata).toBeDefined();

                // Should be marked as shortened
                expect(result.metadata!.isShortened).toBe(true);

                // isShortenedURL utility should also detect it
                expect(isShortenedURL(shortenedUrl)).toBe(true);
            }), { numRuns: 30 });
        });

        test('URL sanitization is safe and preserves valid URLs', () => {
            fc.assert(fc.property(anyStringArbitrary, (input) => {
                const sanitized = sanitizeURL(input);

                // Sanitization should not introduce new invalid characters
                expect(sanitized).not.toContain('<script');
                expect(sanitized).not.toContain('javascript:');
                expect(sanitized).not.toContain('data:');
                expect(sanitized).not.toContain('vbscript:');

                // If input was a valid URL, sanitized version should still be valid
                const originalResult = validateURLFormat(input);
                const sanitizedResult = validateURLFormat(sanitized);

                if (originalResult.isValid) {
                    // Sanitization should not break valid URLs
                    expect(sanitizedResult.isValid).toBe(true);
                }
            }), { numRuns: 100 });
        });

        test('URL normalization is idempotent', () => {
            fc.assert(fc.property(validUrlArbitrary, (validUrl) => {
                const normalized1 = normalizeURL(validUrl);
                const normalized2 = normalizeURL(normalized1);

                // Normalizing twice should give the same result
                expect(normalized1).toBe(normalized2);

                // Normalized URL should still be valid
                const result = validateURLFormat(normalized1);
                expect(result.isValid).toBe(true);
            }), { numRuns: 50 });
        });

        test('validation is consistent for the same input', () => {
            fc.assert(fc.property(anyStringArbitrary, (input) => {
                const result1 = validateURLFormat(input);
                const result2 = validateURLFormat(input);

                // Same input should always give same result
                expect(result1.isValid).toBe(result2.isValid);

                if (result1.isValid) {
                    expect(result1.normalizedUrl).toBe(result2.normalizedUrl);
                    expect(result1.metadata?.protocol).toBe(result2.metadata?.protocol);
                    expect(result1.metadata?.hostname).toBe(result2.metadata?.hostname);
                    expect(result1.metadata?.domain).toBe(result2.metadata?.domain);
                    expect(result1.metadata?.isShortened).toBe(result2.metadata?.isShortened);
                } else {
                    expect(result1.error?.type).toBe(result2.error?.type);
                    expect(result1.error?.message).toBe(result2.error?.message);
                }
            }), { numRuns: 100 });
        });
    });

    /**
     * Additional property tests for edge cases and requirements coverage
     */
    describe('Edge Case Properties', () => {

        test('empty and whitespace-only inputs are handled correctly', () => {
            const emptyInputs = ['', '   ', '\t', '\n', '\r\n', '  \t  \n  '];

            emptyInputs.forEach(input => {
                const result = validateURLFormat(input);
                expect(result.isValid).toBe(false);
                expect(result.error?.type).toBe(VerificationErrorType.INVALID_URL);
                // Check for either "empty" or "required" in the message
                expect(result.error?.message.toLowerCase()).toMatch(/empty|required/);
            });
        });

        test('protocol validation is strict', () => {
            const invalidProtocols = [
                'ftp://example.com/',
                'file://example.com/',
                'javascript://example.com/',
                'data://example.com/',
                'mailto://example.com/'
            ];

            invalidProtocols.forEach(url => {
                const result = validateURLFormat(url);
                expect(result.isValid).toBe(false);
                // Check for either "protocol" or "http" in the message
                expect(result.error?.message.toLowerCase()).toMatch(/protocol|http/);
            });
        });

        test('domain validation catches malformed domains', () => {
            const malformedDomains = [
                'http://',
                'https://',
                'http://.com/',
                'https://..com/',
                'http://domain..com/',
                'http://domain./',
                'http://-domain.com/',
                'http://domain-.com/'
            ];

            malformedDomains.forEach(url => {
                const result = validateURLFormat(url);
                expect(result.isValid).toBe(false);
                expect(result.error?.type).toBe(VerificationErrorType.INVALID_URL);
            });
        });
    });
});

// ============================================================================
// Integration Property Tests
// ============================================================================

describe('URL Validation Integration Properties', () => {

    /**
     * Note: These tests focus on format validation since accessibility checking
     * requires network requests. In a real environment, you might want to mock
     * the network requests or use a test server for integration testing.
     */

    test('validateURL handles format validation correctly', async () => {
        // Test a few specific cases to ensure integration works
        const testCases = [
            { input: '', shouldBeValid: false },
            { input: 'not-a-url', shouldBeValid: false },
            { input: 'ftp://example.com/', shouldBeValid: false },
        ];

        for (const { input, shouldBeValid } of testCases) {
            const formatResult = validateURLFormat(input);
            expect(formatResult.isValid).toBe(shouldBeValid);

            if (!shouldBeValid) {
                // For invalid format, validateURL should also fail at format stage
                const fullResult = await validateURL(input);
                expect(fullResult.isValid).toBe(false);
                expect(fullResult.error?.type).toBe(VerificationErrorType.INVALID_URL);
            }
        }
    });
});