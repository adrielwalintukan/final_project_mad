import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

/**
 * Google OAuth callback endpoint.
 * Google redirects here after user picks their account.
 * This page extracts the id_token from the URL fragment
 * and deep-links back into the Expo app.
 */
http.route({
  path: "/auth/google/callback",
  method: "GET",
  handler: httpAction(async (_, request) => {
    // Google implicit flow puts tokens in the URL fragment (#id_token=...&access_token=...&state=...).
    // Fragments are client-side only, so we return an HTML page with JS
    // that reads the fragment and redirects back to the app.
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Redirecting...</title>
</head>
<body style="background: #f8f9fa; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
  <div style="text-align: center;">
    <p id="status">Redirecting to DailyBoost AI...</p>
  </div>
  <script>
    (function() {
      try {
        var hash = window.location.hash.substring(1);
        var params = new URLSearchParams(hash);
        var idToken = params.get('id_token');
        var accessToken = params.get('access_token');
        var state = params.get('state');

        if (state && (idToken || accessToken)) {
          var returnUrl = state;
          var separator = returnUrl.indexOf('?') !== -1 ? '&' : '?';
          
          // Pass id_token (preferred) and access_token back to the app
          var deepLink = returnUrl + separator;
          if (idToken) {
            deepLink += 'id_token=' + encodeURIComponent(idToken);
          }
          if (accessToken) {
            deepLink += (idToken ? '&' : '') + 'access_token=' + encodeURIComponent(accessToken);
          }
          
          window.location.href = deepLink;
        } else {
          document.getElementById('status').textContent = 'Login failed. Please close this window and try again.';
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
