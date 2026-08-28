
/**
 * Safe markdown component overrides.
 * Explicitly sanitizes and blocks executable URI schemes (javascript:, data:, vbscript:)
 * to prevent Stored Cross-Site Scripting (XSS) via markdown links.
 */
export const safeMarkdownComponents = {
  a: ({ node, href, children, ...props }: any) => {
    let url = (href || '').trim();

    // Explicitly reject dangerous executable protocols (XSS prevention)
    if (/^(?:javascript|data|vbscript):/i.test(url)) {
      return <span>{children}</span>;
    }

    // Prepend https:// to raw domains (e.g., "example.com" -> "https://example.com")
    if (url && !/^https?:\/\//i.test(url) && !url.startsWith('/') && !url.startsWith('mailto:')) {
      url = 'https://' + url;
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline hover:opacity-80 transition-colors"
        {...props}
      >
        {children}
      </a>
    );
  }
};
