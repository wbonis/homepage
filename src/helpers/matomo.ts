// Matomo (matomo.stylite-live.de, site 5). A module, not an inline <script> in index.html: the
// CSP on Plesk allows no inline scripts. Staging builds (VITE_STAGING=1) do not track.
const MATOMO_URL = 'https://matomo.stylite-live.de/';

if (import.meta.env.VITE_STAGING !== '1') {
	const paq = (window._paq = window._paq || []);
	paq.push(['trackPageView']);
	paq.push(['enableLinkTracking']);
	paq.push(['setTrackerUrl', `${MATOMO_URL}matomo.php`]);
	paq.push(['setSiteId', '5']);
	const script = document.createElement('script');
	script.async = true;
	script.src = `${MATOMO_URL}matomo.js`;
	document.head.appendChild(script);
}
