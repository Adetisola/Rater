/**
 * StructuredData — JSON-LD Schema Component
 *
 * Injects Schema.org structured data into the page to help search engines
 * understand Rater's entity identity:
 *   Rater = Rater App = Rater — Design Critique Studio = https://raterapp.site
 *
 * Two schemas are included — only using information verified to exist in the project:
 *   1. Organization — establishes Rater as a brand entity
 *   2. WebSite      — gives Google a stable site-level anchor for Rater
 *
 * Conservative approach: no fabricated ratings, pricing, social profiles,
 * download counts, or screenshots are included.
 */

const PRODUCTION_URL = "https://raterapp.site";
const LOGO_URL = `${PRODUCTION_URL}/icons/icon-512.png`;

/** Organization — establishes the Rater brand entity with stable @id */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${PRODUCTION_URL}/#organization`,
  name: "Rater",
  alternateName: ["Rater App", "Rater — Design Critique Studio"],
  url: PRODUCTION_URL,
  logo: {
    "@type": "ImageObject",
    "@id": `${PRODUCTION_URL}/#logo`,
    url: LOGO_URL,
    width: 512,
    height: 512,
  },
  description:
    "Rater is a design feedback platform where designers share their work, receive constructive critiques, and develop their visual judgment.",
};

/** WebSite — gives Google a stable entity reference for the site */
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${PRODUCTION_URL}/#website`,
  name: "Rater",
  alternateName: "Rater — Design Critique Studio",
  url: PRODUCTION_URL,
  publisher: {
    "@id": `${PRODUCTION_URL}/#organization`,
  },
  description:
    "Rater is a design feedback platform where designers share their work, receive constructive critiques, and develop their visual judgment.",
};

/**
 * Renders JSON-LD <script> tags.
 * Placed inside <body> — search engines process ld+json regardless of placement.
 */
export function StructuredData() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  );
}
