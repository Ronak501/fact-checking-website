/**
 * Unit Tests for Content Extractor
 * 
 * Tests the content extraction functionality including HTML parsing,
 * metadata extraction, and error handling.
 */

import { extractContent } from '../content-extractor';
import { VerificationErrorType, ContentType } from '@/types/link-verification-enums';

// Mock fetch globally
global.fetch = jest.fn();

describe('Content Extractor', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('extractContent', () => {
        it('should extract content from a valid HTML page', async () => {
            const mockHtml = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <title>Test Article Title</title>
                    <meta name="description" content="This is a test article description">
                    <meta name="author" content="John Doe">
                    <meta property="article:published_time" content="2024-01-15T10:00:00Z">
                    <link rel="canonical" href="https://example.com/article">
                    <meta property="og:title" content="OG Test Title">
                    <meta property="og:description" content="OG Test Description">
                </head>
                <body>
                    <header>Navigation here</header>
                    <main>
                        <article>
                            <h1>Main Article Heading</h1>
                            <p>This is the main content of the article. It contains important information that should be extracted.</p>
                            <p>This is another paragraph with more content.</p>
                        </article>
                    </main>
                    <footer>Footer content</footer>
                </body>
                </html>
            `;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/article',
                headers: {
                    get: (key: string) => {
                        const headers: Record<string, string> = {
                            'content-type': 'text/html; charset=utf-8'
                        };
                        return headers[key.toLowerCase()];
                    },
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html; charset=utf-8', 'content-type');
                    }
                },
                text: () => Promise.resolve(mockHtml)
            });

            const result = await extractContent('https://example.com/article');

            expect(result.success).toBe(true);
            expect(result.content).toBeDefined();
            expect(result.content!.title).toBe('Test Article Title');
            expect(result.content!.metadata.author).toBe('John Doe');
            expect(result.content!.metadata.description).toBe('This is a test article description');
            expect(result.content!.metadata.publishedDate).toEqual(new Date('2024-01-15T10:00:00Z'));
            expect(result.content!.metadata.canonicalUrl).toBe('https://example.com/article');
            expect(result.content!.metadata.socialMetadata?.ogTitle).toBe('OG Test Title');
            expect(result.content!.content).toContain('This is the main content of the article');
            expect(result.content!.content).not.toContain('Navigation here');
            expect(result.content!.content).not.toContain('Footer content');
        });

        it('should handle pages without main content tags', async () => {
            const mockHtml = `
                <!DOCTYPE html>
                <html>
                <head><title>Simple Page</title></head>
                <body>
                    <div>
                        <p>This is some content in a div.</p>
                        <p>More content here.</p>
                    </div>
                </body>
                </html>
            `;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/simple',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'text/html' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html', 'content-type');
                    }
                },
                text: () => Promise.resolve(mockHtml)
            });

            const result = await extractContent('https://example.com/simple');

            expect(result.success).toBe(true);
            expect(result.content!.title).toBe('Simple Page');
            expect(result.content!.content).toContain('This is some content in a div');
        });

        it('should handle HTML with scripts and styles', async () => {
            const mockHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Page with Scripts</title>
                    <style>body { color: red; }</style>
                    <script>console.log('test');</script>
                </head>
                <body>
                    <script>alert('popup');</script>
                    <main>
                        <p>Main content here</p>
                    </main>
                    <noscript>No script content</noscript>
                </body>
                </html>
            `;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/scripts',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'text/html' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html', 'content-type');
                    }
                },
                text: () => Promise.resolve(mockHtml)
            });

            const result = await extractContent('https://example.com/scripts');

            expect(result.success).toBe(true);
            expect(result.content!.content).toBe('Main content here');
            expect(result.content!.content).not.toContain('console.log');
            expect(result.content!.content).not.toContain('alert');
            expect(result.content!.content).not.toContain('color: red');
        });

        it('should determine content type correctly', async () => {
            const newsHtml = `
                <!DOCTYPE html>
                <html>
                <head><title>Breaking News: Important Event</title></head>
                <body><main><p>Breaking news content</p></main></body>
                </html>
            `;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://cnn.com/news/breaking-story',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'text/html' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html', 'content-type');
                    }
                },
                text: () => Promise.resolve(newsHtml)
            });

            const result = await extractContent('https://cnn.com/news/breaking-story');

            expect(result.success).toBe(true);
            expect(result.content!.contentType).toBe(ContentType.NEWS);
        });

        it('should handle fetch timeout', async () => {
            (fetch as jest.Mock).mockImplementationOnce(() => 
                new Promise((_, reject) => {
                    setTimeout(() => {
                        const error = new Error('The operation was aborted');
                        error.name = 'AbortError';
                        reject(error);
                    }, 100);
                })
            );

            const extractPromise = extractContent('https://example.com/slow');
            
            // Fast-forward time to trigger timeout
            jest.advanceTimersByTime(15000);

            const result = await extractPromise;

            expect(result.success).toBe(false);
            expect(result.error?.type).toBe(VerificationErrorType.TIMEOUT);
        }, 10000);

        it('should handle HTTP error responses', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: {
                    get: () => null,
                    forEach: () => {}
                }
            });

            const result = await extractContent('https://example.com/notfound');

            expect(result.success).toBe(false);
            expect(result.error?.type).toBe(VerificationErrorType.FETCH_FAILED);
            expect(result.error?.message).toContain('not found');
        });

        it('should handle non-HTML content', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/image.jpg',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'image/jpeg' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('image/jpeg', 'content-type');
                    }
                },
                text: () => Promise.resolve('binary data')
            });

            const result = await extractContent('https://example.com/image.jpg');

            expect(result.success).toBe(false);
            expect(result.error?.type).toBe(VerificationErrorType.PARSE_ERROR);
            expect(result.error?.message).toContain('HTML content');
        });

        it('should handle network errors', async () => {
            (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            const result = await extractContent('https://example.com/error');

            expect(result.success).toBe(false);
            expect(result.error?.type).toBe(VerificationErrorType.FETCH_FAILED);
        });

        it('should extract metadata from various HTML structures', async () => {
            const mockHtml = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="utf-8">
                    <title>Artículo de Prueba</title>
                    <meta name="description" content="Descripción del artículo">
                    <meta name="author" content="María García">
                    <meta name="date" content="2024-01-20">
                    <meta http-equiv="content-language" content="es-ES">
                    <link rel="canonical" href="https://ejemplo.com/articulo">
                    <meta property="og:title" content="Título OG">
                    <meta property="og:description" content="Descripción OG">
                    <meta property="og:image" content="https://ejemplo.com/imagen.jpg">
                </head>
                <body>
                    <article>
                        <h1>Título Principal</h1>
                        <p>Contenido del artículo en español.</p>
                    </article>
                </body>
                </html>
            `;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://ejemplo.com/articulo',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'text/html; charset=utf-8' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html; charset=utf-8', 'content-type');
                    }
                },
                text: () => Promise.resolve(mockHtml)
            });

            const result = await extractContent('https://ejemplo.com/articulo');

            expect(result.success).toBe(true);
            expect(result.content!.metadata.language).toBe('es');
            expect(result.content!.metadata.socialMetadata?.ogImage).toBe('https://ejemplo.com/imagen.jpg');
            expect(result.content!.metadata.domain).toBe('ejemplo.com');
        });

        it('should handle HTML entities correctly', async () => {
            const mockHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Test &amp; Example &lt;Article&gt;</title>
                    <meta name="description" content="Description with &quot;quotes&quot; &amp; entities">
                </head>
                <body>
                    <main>
                        <p>Content with &nbsp; entities &amp; symbols.</p>
                    </main>
                </body>
                </html>
            `;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/entities',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'text/html' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html', 'content-type');
                    }
                },
                text: () => Promise.resolve(mockHtml)
            });

            const result = await extractContent('https://example.com/entities');

            expect(result.success).toBe(true);
            expect(result.content!.title).toBe('Test & Example <Article>');
            expect(result.content!.metadata.description).toBe('Description with "quotes" & entities');
            expect(result.content!.content).toBe('Content with   entities & symbols.');
        });

        it('should handle large content by truncating', async () => {
            const largeContent = 'a'.repeat(60000); // Exceeds CONTENT_LIMITS.MAX_CONTENT_LENGTH
            const mockHtml = `
                <!DOCTYPE html>
                <html>
                <head><title>Large Content</title></head>
                <body><main><p>${largeContent}</p></main></body>
                </html>
            `;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/large',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'text/html' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html', 'content-type');
                    }
                },
                text: () => Promise.resolve(mockHtml)
            });

            const result = await extractContent('https://example.com/large');

            expect(result.success).toBe(true);
            expect(result.content!.content.length).toBeLessThanOrEqual(50000);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty HTML', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/empty',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'text/html' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html', 'content-type');
                    }
                },
                text: () => Promise.resolve('')
            });

            const result = await extractContent('https://example.com/empty');

            expect(result.success).toBe(true);
            expect(result.content!.title).toBe('Untitled');
            expect(result.content!.content).toBe('');
        });

        it('should handle malformed HTML', async () => {
            const malformedHtml = `
                <html>
                <head>
                    <title>Malformed HTML
                    <meta name="description" content="Missing closing quote>
                </head>
                <body>
                    <p>Some content without closing tag
                    <div>Nested content
                </body>
            `;

            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/malformed',
                headers: {
                    get: (key: string) => key === 'content-type' ? 'text/html' : null,
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html', 'content-type');
                    }
                },
                text: () => Promise.resolve(malformedHtml)
            });

            const result = await extractContent('https://example.com/malformed');

            expect(result.success).toBe(true);
            expect(result.content!.content).toContain('Some content');
        });

        it('should handle redirects correctly', async () => {
            (fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                status: 200,
                url: 'https://example.com/final-url', // Different from requested URL
                headers: {
                    get: (key: string) => {
                        const headers: Record<string, string> = {
                            'content-type': 'text/html',
                            'location': 'https://example.com/final-url'
                        };
                        return headers[key.toLowerCase()];
                    },
                    forEach: (callback: (value: string, key: string) => void) => {
                        callback('text/html', 'content-type');
                        callback('https://example.com/final-url', 'location');
                    }
                },
                text: () => Promise.resolve('<html><head><title>Final Page</title></head><body><p>Final content</p></body></html>')
            });

            const result = await extractContent('https://example.com/redirect');

            expect(result.success).toBe(true);
            expect(result.content!.url).toBe('https://example.com/final-url');
        });
    });
});