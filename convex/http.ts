import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/**
 * Google OAuth callback endpoint.
 * Google redirects here after user picks their account.
 * This page extracts the access_token from the URL fragment
 * and deep-links back into the Expo app.
 */
http.route({
  path: "/auth/google/callback",
  method: "GET",
  handler: httpAction(async (_, request) => {
    // Google implicit flow puts the token in the URL fragment (#access_token=...).
    // Fragments are client-side only, so we return an HTML page with JS
    // that reads the fragment and redirects back to the app.
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Redirecting to DailyBoost AI...</title>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f8f9fa;
      color: #191c1d;
    }
    .card {
      text-align: center;
      padding: 32px;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    h2 { color: #0d631b; margin-bottom: 8px; }
    p { color: #40493d; }
  </style>
</head>
<body>
  <div class="card">
    <h2>DailyBoost AI</h2>
    <p id="status">Signing you in...</p>
  </div>
  <script>
    (function() {
      try {
        var hash = window.location.hash.substring(1);
        var params = new URLSearchParams(hash);
        var accessToken = params.get('access_token');
        var state = params.get('state');

        if (accessToken && state) {
          // Redirect back to Expo app via deep link provided in state (e.g. exp://192.168...:8081)
          var decodedReturnUrl = decodeURIComponent(state);
          var separator = decodedReturnUrl.indexOf('?') !== -1 ? '&' : '?';
          var appUrl = decodedReturnUrl + separator + 'access_token=' + encodeURIComponent(accessToken);
          window.location.href = appUrl;

          // Fallback: show manual instructions after 3 seconds
          setTimeout(function() {
            document.getElementById('status').innerHTML =
              'If the app did not open automatically, please go back to DailyBoost AI.';
          }, 3000);
        } else {
          document.getElementById('status').textContent = 'Authentication failed. Please try again.';
        }
      } catch (e) {
        document.getElementById('status').textContent = 'An error occurred. Please try again.';
      }
    })();
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }),
});

export default http;
