/**
 * Property-Based Tests for Content Extraction
 * 
 * Feature: link-content-verification
 * Property 2: Content Extraction Consistency
 * **Validates: Requirements 2.1, 2.2, 2.4, 2.5**
 * 
 * These tests verify that content extraction consistently retrieves web content
 * and parses it into the expected WebContent structure with text, metadata, and
 * source information across all valid inputs.
 */

import * as fc from 'fast-check';
import { extractContent, ContentExtractionResult } from '../content-extractor';
import { WebContent, SourceMetadata } from '@/types/link-verification';
import { VerificationErrorType, ContentType } from '@/types/link-verification-enums';

// Mock fetch globally for property tests
global.fetch = jest.fn();

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generator for meaningful text content (avoids whitespace-only strings)
 */
const meaningfulTextArbitrary = fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 3);

/**
 * Generator for meaningful content paragraphs
 */
const meaningfulContentArbitrary = fc.string({ minLength: 20, maxLength: 1000 }).filter(s => s.trim().length >= 10);

/**
 * Generator for valid domains with proper format
 */
const validDomainArbitrary = fc.oneof(
    fc.constant('example.com'),
    fc.constant('test.org'),
    fc.constant('news.co.uk'),
    fc.constant('blog.net'),
    fc.constant('journal.edu')
);

/**
 * Generator for valid URLs
 */
const validUrlArbitrary = fc.record({
    protocol: fc.constantFrom('http', 'https'),
    domain: validDomainArbitrary,
    path: fc.constantFrom('/', '/article', '/post', '/news', '/page')
}).map(({ protocol, domain, path }) => `${protocol}://${domain}${path}`);

/**
 * Generator for basic HTML content
 */
const basicHtmlArbitrary = fc.record({
    title: meaningfulTextArbitrary,
    content: meaningfulContentArbitrary,
    hasAuthor: fc.boolean(),
    hasDescription: fc.boolean()
}).map(({ title, content, hasAuthor, hasDescription }) => {
    const authorTag = hasAuthor ? `<meta name="author" content="Test Author">` : '';
    const descTag = hasDescription ? `<meta name="description" content="Test description">` : '';
    
    return {
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${escapeHtml(title)}</title>
                ${authorTag}
                ${descTag}
            </head>
            <body>
                <main>
                    <h1>${escapeHtml(title)}</h1>
                    <p>${escapeHtml(content)}</p>
                </main>
            </body>
            </html>
        `,
        expectedTitle: title,
        expectedContent: content,
        hasAuthor,
        hasDescription
    };
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Creates a mock fetch response for HTML content
 */
function createMockHtmlResponse(html: string, url: string, statusCode: number = 200) {
    return {
        ok: statusCode >= 200 && statusCode < 300,
        status: statusCode,
        statusText: statusCode === 200 ? 'OK' : 'Error',
        url,
        headers: {
            get: (key: string) => {
                const headers: Record<string, string> = {
                    'content-type': 'text/html; charset=utf-8'
                };
                return headers[key.toLowerCase()] || null;
            },
            forEach: (callback: (value: string, key: string) => void) => {
                callback('text/html; charset=utf-8', 'content-type');
            }
        },
        text: () => Promise.resolve(html)
    };
}

/**
 * Creates a mock fetch response for non-HTML content
 */
function createMockNonHtmlResponse(content: string, contentType: string, url: string) {
    return {
        ok: true,
        status: 200,
        statusText: 'OK',
        url,
        headers: {
            get: (key: string) => {
                const headers: Record<string, string> = {
                    'content-type': contentType
                };
                return headers[key.toLowerCase()] || null;
            },
            forEach: (callback: (value: string, key: string) => void) => {
                callback(contentType, 'content-type');
            }
        },
        text: () => Promise.resolve(content)
    };
}

// ============================================================================
// Property Tests
// ============================================================================

describe('Content Extraction Properties', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    /**
     * Property 2: Content Extraction Consistency
     * **Validates: Requirements 2.1, 2.2, 2.4, 2.5**
     * 
     * For any valid and accessible URL, the content extractor should successfully
     * retrieve web content and parse it into the expected WebContent structure
     * with text, metadata, and source information.
     */
    describe('Property 2: Content Extraction Consistency', () => {

        test('extractContent always returns a valid ContentExtractionResult structure', () => {
            fc.assert(fc.property(validUrlArbitrary, basicHtmlArbitrary, async (url, htmlData) => {
                // Mock successful fetch
                (fetch as jest.Mock).mockResolvedValueOnce(
                    createMockHtmlResponse(htmlData.html, url)
                );

                const result = await extractContent(url);

                // Result must have required structure
                expect(typeof result.success).toBe('boolean');
                expect(typeof result.processingTime).toBe('number');
                expect(result.processingTime).toBeGreaterThanOrEqual(0);

                if (result.success) {
                    // Successful results must have content
                    expect(result.content).toBeDefined();
                    expect(result.error).toBeUndefined();

                    // WebContent must have required structure
                    const content = result.content!;
                    expect(typeof content.url).toBe('string');
                    expect(typeof content.title).toBe('string');
                    expect(typeof content.content).toBe('string');
                    expect(content.metadata).toBeDefined();
                    expect(content.extractedAt).toBeInstanceOf(Date);
                    expect(Object.values(ContentType)).toContain(content.contentType);

                    // Metadata must have required structure
                    const metadata = content.metadata;
                    expect(typeof metadata.domain).toBe('string');
                    expect(typeof metadata.title).toBe('string');
                    expect(metadata.domain.length).toBeGreaterThan(0);
                    expect(metadata.title.length).toBeGreaterThan(0);

                    // Optional metadata fields should be correct type when present
                    if (metadata.author !== undefined) {
                        expect(typeof metadata.author).toBe('string');
                    }
                    if (metadata.publishedDate !== undefined) {
                        expect(metadata.publishedDate).toBeInstanceOf(Date);
                    }
                    if (metadata.description !== undefined) {
                        expect(typeof metadata.description).toBe('string');
                    }
                    if (metadata.language !== undefined) {
                        expect(typeof metadata.language).toBe('string');
                    }
                    if (metadata.canonicalUrl !== undefined) {
                        expect(typeof metadata.canonicalUrl).toBe('string');
                    }
                } else {
                    // Failed results must have error details
                    expect(result.error).toBeDefined();
                    expect(result.content).toBeUndefined();

                    const error = result.error!;
                    expect(typeof error.type).toBe('string');
                    expect(typeof error.message).toBe('string');
                    expect(typeof error.retryable).toBe('boolean');
                    expect(error.message.length).toBeGreaterThan(0);
                    expect(Object.values(VerificationErrorType)).toContain(error.type);
                }
            }), { numRuns: 30 });
        });

        test('content extraction preserves essential information from HTML', () => {
            fc.assert(fc.property(validUrlArbitrary, basicHtmlArbitrary, async (url, htmlData) => {
                (fetch as jest.Mock).mockResolvedValueOnce(
                    createMockHtmlResponse(htmlData.html, url)
                );

                const result = await extractContent(url);

                if (result.success) {
                    const content = result.content!;

                    // Title should be extracted correctly
                    expect(content.title).toBe(htmlData.expectedTitle);

                    // Main content should contain the expected text
                    expect(content.content).toContain(htmlData.expectedContent);

                    // Metadata should be extracted when present
                    if (htmlData.hasAuthor) {
                        expect(content.metadata.author).toBe('Test Author');
                    }
                    if (htmlData.hasDescription) {
                        expect(content.metadata.description).toBe('Test description');
                    }
                }
            }), { numRuns: 20 });
        });

        test('domain extraction works correctly for various URLs', () => {
            fc.assert(fc.property(validUrlArbitrary, basicHtmlArbitrary, async (url, htmlData) => {
                (fetch as jest.Mock).mockResolvedValueOnce(
                    createMockHtmlResponse(htmlData.html, url)
                );

                const result = await extractContent(url);

                if (result.success) {
                    const content = result.content!;
                    const urlObj = new URL(url);
                    
                    // Domain should be extracted from URL
                    expect(content.metadata.domain).toContain(urlObj.hostname.split('.').slice(-2).join('.'));
                }
            }), { numRuns: 15 });
        });

        test('non-HTML content is rejected with appropriate error', () => {
            fc.assert(fc.property(validUrlArbitrary, meaningfulContentArbitrary, fc.constantFrom('image/jpeg', 'application/pdf', 'text/plain'), async (url, content, contentType) => {
                (fetch as jest.Mock).mockResolvedValueOnce(
                    createMockNonHtmlResponse(content, contentType, url)
                );

                const result = await extractContent(url);

                // Non-HTML content should be rejected
                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.error!.type).toBe(VerificationErrorType.PARSE_ERROR);
                expect(result.error!.message).toContain('HTML content');
                expect(result.content).toBeUndefined();
            }), { numRuns: 10 });
        });

        test('extraction is consistent for the same input', () => {
            fc.assert(fc.property(validUrlArbitrary, basicHtmlArbitrary, async (url, htmlData) => {
                // Mock the same response twice
                (fetch as jest.Mock)
                    .mockResolvedValueOnce(createMockHtmlResponse(htmlData.html, url))
                    .mockResolvedValueOnce(createMockHtmlResponse(htmlData.html, url));

                const result1 = await extractContent(url);
                const result2 = await extractContent(url);

                // Both results should have the same success status
                expect(result1.success).toBe(result2.success);

                if (result1.success && result2.success) {
                    // Content should be identical
                    expect(result1.content!.title).toBe(result2.content!.title);
                    expect(result1.content!.content).toBe(result2.content!.content);
                    expect(result1.content!.contentType).toBe(result2.content!.contentType);

                    // Metadata should be identical
                    expect(result1.content!.metadata.domain).toBe(result2.content!.metadata.domain);
                    expect(result1.content!.metadata.author).toBe(result2.content!.metadata.author);
                    expect(result1.content!.metadata.description).toBe(result2.content!.metadata.description);
                }

                if (!result1.success && !result2.success) {
                    // Error details should be identical
                    expect(result1.error!.type).toBe(result2.error!.type);
                    expect(result1.error!.message).toBe(result2.error!.message);
                    expect(result1.error!.retryable).toBe(result2.error!.retryable);
                }
            }), { numRuns: 10 });
        });

        test('processing time is always recorded and reasonable', () => {
            fc.assert(fc.property(validUrlArbitrary, basicHtmlArbitrary, async (url, htmlData) => {
                (fetch as jest.Mock).mockResolvedValueOnce(
                    createMockHtmlResponse(htmlData.html, url)
                );

                const startTime = Date.now();
                const result = await extractContent(url);
                const endTime = Date.now();

                // Processing time should be recorded
                expect(typeof result.processingTime).toBe('number');
                expect(result.processingTime).toBeGreaterThanOrEqual(0);

                // Processing time should be reasonable (within the actual time taken)
                const actualTime = endTime - startTime;
                expect(result.processingTime).toBeLessThanOrEqual(actualTime + 100); // Allow 100ms tolerance
            }), { numRuns: 10 });
        });
    });

    /**
     * Error handling properties to ensure robustness
     */
    describe('Error Handling Properties', () => {

        test('network errors are handled consistently', () => {
            fc.assert(fc.property(validUrlArbitrary, fc.constantFrom('Network error', 'fetch failed', 'Connection refused'), async (url, errorMessage) => {
                (fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

                const result = await extractContent(url);

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.error!.type).toBe(VerificationErrorType.FETCH_FAILED);
                expect(result.error!.retryable).toBe(true);
                expect(typeof result.processingTime).toBe('number');
            }), { numRuns: 5 });
        });

        test('HTTP error responses are handled consistently', () => {
            fc.assert(fc.property(validUrlArbitrary, fc.constantFrom(404, 403, 500, 502, 503), async (url, statusCode) => {
                (fetch as jest.Mock).mockResolvedValueOnce({
                    ok: false,
                    status: statusCode,
                    statusText: 'Error',
                    headers: {
                        get: () => null,
                        forEach: () => {}
                    }
                });

                const result = await extractContent(url);

                expect(result.success).toBe(false);
                expect(result.error).toBeDefined();
                expect(result.error!.type).toBe(VerificationErrorType.FETCH_FAILED);
                expect(result.error!.message).toContain(statusCode.toString());

                // 5xx errors should be retryable, 4xx generally not
                if (statusCode >= 500 || statusCode === 429) {
                    expect(result.error!.retryable).toBe(true);
                } else if (statusCode === 404 || statusCode === 403) {
                    expect(result.error!.retryable).toBe(false);
                }
            }), { numRuns: 5 });
        });
    });
});