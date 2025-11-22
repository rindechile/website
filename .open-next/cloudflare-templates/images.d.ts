export type RemotePattern = {
    protocol?: "http" | "https";
    hostname: string;
    port?: string;
    pathname: string;
    search?: string;
};
export type LocalPattern = {
    pathname: string;
    search?: string;
};
/**
 * Fetches an images.
 *
 * Local images (starting with a '/' as fetched using the passed fetcher).
 * Remote images should match the configured remote patterns or a 404 response is returned.
 */
export declare function fetchImage(fetcher: Fetcher | undefined, imageUrl: string, ctx: ExecutionContext): Promise<Response | undefined>;
export declare function matchRemotePattern(pattern: RemotePattern, url: URL): boolean;
export declare function matchLocalPattern(pattern: LocalPattern, url: URL): boolean;
/**
 * Detects the content type by looking at the first few bytes of a file
 *
 * Based on https://github.com/vercel/next.js/blob/72c9635/packages/next/src/server/image-optimizer.ts#L155
 *
 * @param buffer The image bytes
 * @returns a content type of undefined for unsupported content
 */
export declare function detectContentType(buffer: Uint8Array): "image/svg+xml" | "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif" | "image/x-icon" | "image/x-icns" | "image/tiff" | "image/bmp" | "image/jxl" | "image/heic" | "application/pdf" | "image/jp2" | undefined;
declare global {
    var __IMAGES_REMOTE_PATTERNS__: RemotePattern[];
    var __IMAGES_LOCAL_PATTERNS__: LocalPattern[];
    var __IMAGES_ALLOW_SVG__: boolean;
    var __IMAGES_CONTENT_SECURITY_POLICY__: string;
    var __IMAGES_CONTENT_DISPOSITION__: string;
}
