/**
 * Rater Email Templates
 *
 * Each function returns { subject, html, text } for a given email event.
 * Uses email-safe HTML (table-based layout, inline styles) for broad client compatibility.
 * Rater brand: #FEC312 yellow, black, white. Clean and minimal.
 */

const PRODUCTION_URL = 'https://www.raterapp.site';
// PNG logo: reliable across all email clients (including Outlook which doesn't render SVG)
const LOGO_URL = `${PRODUCTION_URL}/icons/icon-192.png`;

// ─── Brand Tokens ─────────────────────────────────────────────────────────────

const brand = {
  primary: '#FEC312',
  black: '#111111',
  white: '#FFFFFF',
  gray: '#888888',
  lightGray: '#F5F5F5',
  borderGray: '#E8E8E8',
  font: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
};

// ─── Shared Layout Wrapper ────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Rater</title>
</head>
<body style="margin:0;padding:0;background-color:${brand.lightGray};font-family:${brand.font};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${brand.lightGray};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <img
                src="${LOGO_URL}"
                alt="Rater"
                width="48"
                height="48"
                style="display:block;border-radius:12px;border:0;"
              />
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color:${brand.white};border-radius:20px;border:1px solid ${brand.borderGray};overflow:hidden;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 16px 0;">
              <p style="margin:0;font-size:12px;color:${brand.gray};line-height:1.6;">
                Rater &mdash; Design Critique Studio<br/>
                <a href="${PRODUCTION_URL}" style="color:${brand.gray};text-decoration:underline;">${PRODUCTION_URL.replace('https://', '')}</a>
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:${brand.borderGray};line-height:1.5;">
                You received this email because you created a Rater account.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── WELCOME_USER Template ────────────────────────────────────────────────────

interface WelcomeEmailParams {
  firstName?: string | null;
  email: string;
}

export function welcomeEmail({ firstName }: WelcomeEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const displayName = firstName?.trim() || 'there';

  const subject = 'Welcome to Rater 👋';

  const html = emailWrapper(`
    <!-- Yellow accent top bar -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="height:4px;background-color:${brand.primary};border-radius:20px 20px 0 0;"></td>
      </tr>
    </table>

    <!-- Body -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:40px 40px 32px;">

          <!-- Greeting -->
          <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:${brand.black};line-height:1.3;">
            Hi ${displayName},
          </p>

          <p style="margin:0 0 24px;font-size:16px;font-weight:600;color:${brand.black};line-height:1.4;">
            Welcome to Rater &mdash; Design Critique Studio!
          </p>

          <!-- Body text -->
          <p style="margin:0 0 16px;font-size:15px;color:#444444;line-height:1.7;">
            We're excited to have you here. Rater is a place to share your creative work, get meaningful feedback, and grow as a creative.
          </p>

          <p style="margin:0 0 32px;font-size:15px;color:#444444;line-height:1.7;">
            Your journey starts here.
          </p>

          <!-- CTA Button -->
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="border-radius:100px;background-color:${brand.primary};">
                <a
                  href="${PRODUCTION_URL}/browse"
                  target="_blank"
                  style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:${brand.black};text-decoration:none;border-radius:100px;letter-spacing:-0.01em;"
                >
                  Explore Rater &rarr;
                </a>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  `);

  const text = `Hi ${displayName},

Welcome to Rater — Design Critique Studio!

We're excited to have you here. Rater is a place to share your creative work, get meaningful feedback, and grow as a creative.

Your journey starts here.

Explore Rater: ${PRODUCTION_URL}/browse

---
Rater — Design Critique Studio
${PRODUCTION_URL}

You received this email because you created a Rater account.`;

  return { subject, html, text };
}
