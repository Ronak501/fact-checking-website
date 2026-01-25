/**
 * Content Extraction Service
 * 
 * This module provides comprehensive web content extraction functionality for the
 * Link Content Verification system. It handles fetching web pages, parsing HTML,
 * extracting text and metadata, and managing various content types and encoding issues.
 * 
 * Requirements: 2.1, 2.2, 2.4, 2.5, 2.6
 */

import {
    WebContent,
    SourceMetadata,
    VerificationErrorDetails
} from '@/types/link-verification';
import {
    VerificationErrorType,
    ContentType,
    TIMEOUTS,
    CONTENT_LIMITS,
    CONTENT_TYPE_PATTERNS
} from '@/types/link-verification-enums';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Result of content extraction
 */
export interface ContentExtractionResult {
    /** Whether extraction was successful */
    success: boolean;
    /** The extracted web content (if successful) */
    content?: WebContent;
    /** Error details (if unsuccessful) */
    error?: VerificationErrorDetails;
    /** Processing time in milliseconds */
    processingTime: number;
}

/**
 * Raw HTML content with metadata
 */
interface RawContent {
    /** The HTML content */
    html: string;
    /** Response headers */
    headers: Record<string, string>;
    /** Final URL after redirects */
    finalUrl: string;
    /** Response status code */
    statusCode: number;
    /** Content encoding */
    encoding?: string;
}

/**
 * Parsed HTML elements
 */
interface ParsedElements {
    /** Page title */
    title?: string;
    /** Meta description */
    description?: string;
    /** Author information */
    author?: string;
    /** Publication date */
    publishedDate?: Date;
    /** Language */
    language?: string;
    /** Canonical URL */
    canonicalUrl?: string;
    /** Open Graph metadata */
    openGraph?: {
        ogTitle?: string;
        ogDescription?: string;
        ogImage?: string;
    };
    /** Main content text */
    mainContent: string;
}

// ============================================================================
// Main Content Extraction Function
// ============================================================================

/**
 * Extracts content from a web URL
 * 
 * @param url - The URL to extract content from
 * @returns Promise resolving to extraction result
 */
export async function extractContent(url: string): Promise<ContentExtractionResult> {
    const startTime = Date.now();

    try {
        // Step 1: Fetch raw content
        const rawContent = await fetchWebContent(url);

        // Step 2: Parse HTML and extract elements
        const parsedElements = parseHTMLContent(rawContent.html);

        // Step 3: Extract metadata
        const metadata = extractMetadata(url, rawContent, parsedElements);

        // Step 4: Determine content type
        const contentType = determineContentType(url, metadata, parsedElements);

        // Step 5: Create WebContent object
        const webContent: WebContent = {
            url: rawContent.finalUrl,
            title: parsedElements.title || metadata.title,
            content: parsedElements.mainContent,
            metadata,
            extractedAt: new Date(),
            contentType
        };

        const processingTime = Date.now() - startTime;

        return {
            success: true,
            content: webContent,
            processingTime
        };

    } catch (error) {
        const processingTime = Date.now() - startTime;

        // If it's already a VerificationErrorDetails, return it
        if (error && typeof error === 'object' && 'type' in error) {
            return {
                success: false,
                error: error as VerificationErrorDetails,
                processingTime
            };
        }

        return {
            success: false,
            error: {
                type: VerificationErrorType.PARSE_ERROR,
                message: 'An unexpected error occurred during content extraction',
                retryable: false,
                suggestedAction: 'Please try again or contact support'
            },
            processingTime
        };
    }
}

// ============================================================================
// Content Fetching
// ============================================================================

/**
 * Fetches raw web content with timeout and error handling
 * 
 * @param url - The URL to fetch
 * @returns Promise resolving to raw content
 */
async function fetchWebContent(url: string): Promise<RawContent> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.CONTENT_FETCH);

    try {
        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; FactCheckBot/1.0; +https://factcheck.example.com/bot)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Cache-Control': 'no-cache'
            }
        });

        clearTimeout(timeoutId);

        // Check if response is successful
        if (!response.ok) {
            const errorDetails = createFetchError(response.status, response.statusText);
            throw errorDetails;
        }

        // Check content type
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
            throw {
                type: VerificationErrorType.PARSE_ERROR,
                message: 'URL does not point to HTML content',
                retryable: false,
                suggestedAction: 'Please provide a URL that points to a web page'
            } as VerificationErrorDetails;
        }

        // Get response headers
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });

        // Get the HTML content
        const html = await response.text();

        // Check content length
        if (html.length > CONTENT_LIMITS.MAX_CONTENT_LENGTH) {
            console.warn(`Content length (${html.length}) exceeds limit, truncating...`);
        }

        return {
            html: html.slice(0, CONTENT_LIMITS.MAX_CONTENT_LENGTH),
            headers,
            finalUrl: response.url,
            statusCode: response.status,
            encoding: extractEncoding(contentType, html)
        };

    } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                throw {
                    type: VerificationErrorType.TIMEOUT,
                    message: 'Content fetching timed out',
                    retryable: true,
                    suggestedAction: 'Please try again or check your internet connection'
                } as VerificationErrorDetails;
            }

            if (error.message.includes('fetch')) {
                throw {
                    type: VerificationErrorType.FETCH_FAILED,
                    message: 'Unable to fetch content from the URL',
                    retryable: true,
                    suggestedAction: 'Please check the URL and your internet connection'
                } as VerificationErrorDetails;
            }
        }

        // Re-throw if it's already a VerificationErrorDetails
        if (error && typeof error === 'object' && 'type' in error) {
            throw error;
        }

        // If it's a network error, convert to fetch failed
        if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('Network'))) {
            throw {
                type: VerificationErrorType.FETCH_FAILED,
                message: 'Unable to fetch content from the URL',
                retryable: true,
                suggestedAction: 'Please check the URL and your internet connection'
            } as VerificationErrorDetails;
        }

        throw {
            type: VerificationErrorType.FETCH_FAILED,
            message: 'An unexpected error occurred while fetching content',
            retryable: true,
            suggestedAction: 'Please try again'
        } as VerificationErrorDetails;
    }
}

/**
 * Creates appropriate error details for fetch failures
 */
function createFetchError(status: number, statusText: string): VerificationErrorDetails {
    let message = `Server returned ${status} ${statusText}`;
    let suggestedAction = 'Please check the URL and try again';
    let retryable = false;

    switch (status) {
        case 403:
            message = 'Access to this content is forbidden';
            suggestedAction = 'This website may block automated access or require authentication';
            break;
        case 404:
            message = 'The requested page was not found';
            suggestedAction = 'Please check if the URL is correct';
            break;
        case 429:
            message = 'Too many requests to this server';
            suggestedAction = 'Please try again later';
            retryable = true;
            break;
        case 500:
        case 502:
        case 503:
        case 504:
            message = 'The server is experiencing issues';
            suggestedAction = 'Please try again later';
            retryable = true;
            break;
    }

    return {
        type: VerificationErrorType.FETCH_FAILED,
        message,
        retryable,
        suggestedAction
    };
}

/**
 * Extracts character encoding from content type or HTML
 */
function extractEncoding(contentType: string, html: string): string {
    // First try to get encoding from Content-Type header
    const contentTypeMatch = contentType.match(/charset=([^;]+)/i);
    if (contentTypeMatch) {
        return contentTypeMatch[1].toLowerCase();
    }

    // Try to get encoding from HTML meta tag
    const metaCharsetMatch = html.match(/<meta[^>]+charset=["']?([^"'>\s]+)/i);
    if (metaCharsetMatch) {
        return metaCharsetMatch[1].toLowerCase();
    }

    // Try to get encoding from XML declaration
    const xmlEncodingMatch = html.match(/<\?xml[^>]+encoding=["']?([^"'>\s]+)/i);
    if (xmlEncodingMatch) {
        return xmlEncodingMatch[1].toLowerCase();
    }

    // Default to UTF-8
    return 'utf-8';
}

// ============================================================================
// HTML Parsing and Text Extraction
// ============================================================================

/**
 * Parses HTML content and extracts structured information
 * 
 * @param html - The HTML content to parse
 * @returns Parsed elements
 */
function parseHTMLContent(html: string): ParsedElements {
    // Extract metadata from original HTML before cleaning (meta tags might be affected by cleaning)
    const openGraph = extractOpenGraphData(html);
    const description = extractMetaDescription(html);
    const author = extractAuthor(html);
    const publishedDate = extractPublishedDate(html);
    const language = extractLanguage(html);
    const canonicalUrl = extractCanonicalUrl(html);

    // Clean up the HTML for content extraction
    const cleanedHtml = cleanHTML(html);

    return {
        title: extractTitle(cleanedHtml),
        description,
        author,
        publishedDate,
        language,
        canonicalUrl,
        openGraph,
        mainContent: extractMainContent(cleanedHtml)
    };
}

/**
 * Cleans HTML by removing scripts, styles, and other non-content elements
 */
function cleanHTML(html: string): string {
    return html
        // Remove script tags and their content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        // Remove style tags and their content
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        // Remove comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remove noscript tags
        .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
        // Remove iframe tags
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        // Remove object and embed tags
        .replace(/<(object|embed)[^>]*>[\s\S]*?<\/\1>/gi, '');
}

/**
 * Extracts the page title
 */
function extractTitle(html: string): string | undefined {
    // Try to get title from <title> tag
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
        return decodeHTMLEntities(titleMatch[1].trim());
    }

    // Try to get title from h1 tag as fallback
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match) {
        const h1Text = stripHTMLTags(h1Match[1]).trim();
        if (h1Text.length > 0 && h1Text.length < 200) {
            return decodeHTMLEntities(h1Text);
        }
    }

    return undefined;
}

/**
 * Extracts meta description
 */
function extractMetaDescription(html: string): string | undefined {
    const descMatch = html.match(/<meta[^>]+name=["']?description["']?[^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']?description["']?/i);

    if (descMatch) {
        return decodeHTMLEntities(descMatch[1].trim());
    }

    return undefined;
}

/**
 * Extracts author information
 */
function extractAuthor(html: string): string | undefined {
    // Try various author meta tags
    const authorPatterns = [
        /<meta[^>]+name=["']?author["']?[^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']?author["']?/i,
        /<meta[^>]+property=["']?article:author["']?[^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']?twitter:creator["']?[^>]+content=["']([^"']+)["']/i,
        /<span[^>]*class=["'][^"']*author[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
        /<div[^>]*class=["'][^"']*author[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<p[^>]*class=["'][^"']*byline[^"']*["'][^>]*>([\s\S]*?)<\/p>/i
    ];

    for (const pattern of authorPatterns) {
        const match = html.match(pattern);
        if (match) {
            const author = stripHTMLTags(match[1]).trim();
            if (author.length > 0 && author.length < 100) {
                return decodeHTMLEntities(author);
            }
        }
    }

    return undefined;
}

/**
 * Extracts published date
 */
function extractPublishedDate(html: string): Date | undefined {
    // Try various date patterns
    const datePatterns = [
        /<meta[^>]+property=["']?article:published_time["']?[^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']?date["']?[^>]+content=["']([^"']+)["']/i,
        /<meta[^>]+name=["']?pubdate["']?[^>]+content=["']([^"']+)["']/i,
        /<time[^>]+datetime=["']([^"']+)["']/i,
        /<time[^>]+pubdate[^>]*>([\s\S]*?)<\/time>/i
    ];

    for (const pattern of datePatterns) {
        const match = html.match(pattern);
        if (match) {
            const dateStr = match[1].trim();
            const date = parseDate(dateStr);
            if (date) {
                return date;
            }
        }
    }

    return undefined;
}

/**
 * Extracts language information
 */
function extractLanguage(html: string): string | undefined {
    // Try to get language from html tag
    const htmlLangMatch = html.match(/<html[^>]+lang=["']?([^"'\s>]+)/i);
    if (htmlLangMatch) {
        return htmlLangMatch[1].toLowerCase();
    }

    // Try to get language from meta tag
    const metaLangMatch = html.match(/<meta[^>]+http-equiv=["']?content-language["']?[^>]+content=["']([^"']+)["']/i);
    if (metaLangMatch) {
        return metaLangMatch[1].toLowerCase();
    }

    return undefined;
}

/**
 * Extracts canonical URL
 */
function extractCanonicalUrl(html: string): string | undefined {
    const canonicalMatch = html.match(/<link[^>]+rel=["']?canonical["']?[^>]+href=["']([^"']+)["']/i);
    if (canonicalMatch) {
        return canonicalMatch[1].trim();
    }

    return undefined;
}

/**
 * Extracts Open Graph metadata
 */
function extractOpenGraphData(html: string): { ogTitle?: string; ogDescription?: string; ogImage?: string } {
    const openGraph: { ogTitle?: string; ogDescription?: string; ogImage?: string } = {};

    // Extract OG title
    const ogTitleMatch = html.match(/<meta[^>]+property=["']?og:title["']?[^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']?og:title["']?/i);
    if (ogTitleMatch) {
        openGraph.ogTitle = decodeHTMLEntities(ogTitleMatch[1].trim());
    }

    // Extract OG description
    const ogDescMatch = html.match(/<meta[^>]+property=["']?og:description["']?[^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']?og:description["']?/i);
    if (ogDescMatch) {
        openGraph.ogDescription = decodeHTMLEntities(ogDescMatch[1].trim());
    }

    // Extract OG image
    const ogImageMatch = html.match(/<meta[^>]+property=["']?og:image["']?[^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']?og:image["']?/i);
    if (ogImageMatch) {
        openGraph.ogImage = ogImageMatch[1].trim();
    }

    return openGraph;
}

/**
 * Extracts main content text from HTML
 */
function extractMainContent(html: string): string {
    // Try to find main content using common selectors
    const contentSelectors = [
        /<main[^>]*>([\s\S]*?)<\/main>/i,
        /<article[^>]*>([\s\S]*?)<\/article>/i,
        /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*class=["'][^"']*entry[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
        /<div[^>]*id=["']content["'][^>]*>([\s\S]*?)<\/div>/i
    ];

    let mainContent = '';

    for (const selector of contentSelectors) {
        const match = html.match(selector);
        if (match) {
            mainContent = match[1];
            break;
        }
    }

    // If no main content found, extract from body
    if (!mainContent) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
            mainContent = bodyMatch[1];
        } else {
            mainContent = html;
        }
    }

    // Remove navigation, sidebar, footer, and other non-content elements
    mainContent = mainContent
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<div[^>]*class=["'][^"']*sidebar[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class=["'][^"']*menu[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
        .replace(/<div[^>]*class=["'][^"']*advertisement[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '');

    // Convert HTML to plain text
    const plainText = stripHTMLTags(mainContent);

    // Clean up whitespace and decode entities
    return decodeHTMLEntities(cleanText(plainText));
}

// ============================================================================
// Metadata Extraction
// ============================================================================

/**
 * Extracts comprehensive metadata from raw content and parsed elements
 */
function extractMetadata(url: string, rawContent: RawContent, parsedElements: ParsedElements): SourceMetadata {
    const urlObj = new URL(rawContent.finalUrl);

    return {
        domain: extractDomain(urlObj.hostname),
        title: parsedElements.title || 'Untitled',
        author: parsedElements.author,
        publishedDate: parsedElements.publishedDate,
        description: parsedElements.description,
        language: parsedElements.language,
        canonicalUrl: parsedElements.canonicalUrl,
        socialMetadata: parsedElements.openGraph
    };
}

/**
 * Determines the content type based on URL and content analysis
 */
function determineContentType(url: string, metadata: SourceMetadata, parsedElements: ParsedElements): ContentType {
    // Check URL patterns first
    for (const [contentType, patterns] of Object.entries(CONTENT_TYPE_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(url)) {
                return contentType as ContentType;
            }
        }
    }

    // Analyze content structure and metadata
    const title = parsedElements.title?.toLowerCase() || '';
    const content = parsedElements.mainContent.toLowerCase();

    // Check for news indicators
    if (title.includes('breaking') || title.includes('news') ||
        content.includes('reuters') || content.includes('associated press')) {
        return ContentType.NEWS;
    }

    // Check for blog indicators
    if (title.includes('blog') || content.includes('posted by') ||
        parsedElements.author && content.length < 5000) {
        return ContentType.BLOG;
    }

    // Check for article indicators
    if (parsedElements.publishedDate && parsedElements.author && content.length > 1000) {
        return ContentType.ARTICLE;
    }

    // Default to other
    return ContentType.OTHER;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Strips HTML tags from text
 */
function stripHTMLTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Decodes HTML entities
 */
function decodeHTMLEntities(text: string): string {
    const entities: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&nbsp;': ' ',
        '&#160;': ' '
    };

    return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
        return entities[entity] || entity;
    });
}

/**
 * Cleans up extracted text
 */
function cleanText(text: string): string {
    return text
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Remove excessive line breaks
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        // Trim
        .trim();
}

/**
 * Parses various date formats
 */
function parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    // Try ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
        return isoDate;
    }

    // Try common date patterns
    const datePatterns = [
        /(\d{4})-(\d{2})-(\d{2})/,  // YYYY-MM-DD
        /(\d{2})\/(\d{2})\/(\d{4})/, // MM/DD/YYYY
        /(\d{2})-(\d{2})-(\d{4})/,  // MM-DD-YYYY
    ];

    for (const pattern of datePatterns) {
        const match = dateStr.match(pattern);
        if (match) {
            const date = new Date(match[0]);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }

    return undefined;
}

/**
 * Extracts domain from hostname
 */
function extractDomain(hostname: string): string {
    const parts = hostname.split('.');

    // Handle special TLDs
    const twoPartTlds = ['co.uk', 'com.au', 'co.jp', 'co.in', 'com.br'];
    const lastTwoParts = parts.slice(-2).join('.');

    if (twoPartTlds.includes(lastTwoParts)) {
        return parts.slice(-3).join('.');
    }

    return parts.slice(-2).join('.');
}