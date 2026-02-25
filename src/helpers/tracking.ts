declare global {
	interface Window {
		_paq?: unknown[][];
	}
}

export function trackEvent(category: string, action: string, name?: string, value?: number) {
	const args: unknown[] = ['trackEvent', category, action];
	if (name != null) args.push(name);
	if (value != null) args.push(value);
	window._paq?.push(args);
}

/** Global listener: track clicks on all external links (a[target="_blank"]) */
function initLinkTracking() {
	document.addEventListener('click', (e) => {
		const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[target="_blank"]');
		if (anchor?.href) {
			trackEvent('Link', 'click', anchor.href);
		}
	});
}

initLinkTracking();
