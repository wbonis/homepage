import type { HtmlTagDescriptor, Plugin } from 'vite';

interface BlogPost {
	title: string;
	url: string;
	date: string;
}

async function fetchBlogPosts(): Promise<BlogPost[]> {
	const res = await fetch('https://blog.stylite.de/blog/index.xml');
	const xml = await res.text();

	const posts: BlogPost[] = [];
	const itemRegex = /<item>([\s\S]*?)<\/item>/g;
	let match;

	while ((match = itemRegex.exec(xml)) !== null) {
		const item = match[1];
		const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
		const url = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '';
		const date = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() ?? '';

		if (url) {
			posts.push({ title: escapeHtml(title), url, date });
		}
	}

	return posts;
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function formatDate(dateStr: string): string {
	try {
		const d = new Date(dateStr);
		return d.toISOString().split('T')[0];
	} catch {
		return '';
	}
}

function buildJsonLd(posts: BlogPost[]): object {
	const blogPostings = posts.slice(0, 15).map((p) => ({
		'@type': 'BlogPosting',
		headline: p.title,
		url: p.url,
		...(p.date ? { datePublished: formatDate(p.date) } : {}),
		author: { '@id': 'https://www.bonis.de/#person' },
	}));

	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Person',
				'@id': 'https://www.bonis.de/#person',
				name: 'WBonis',
				jobTitle: 'System Architekt',
				email: 'bonis@bonis.de',
				url: 'https://www.bonis.de',
				sameAs: [
					'https://github.com/WBonis',
					'https://www.linkedin.com/in/wbonis/',
					'https://blog.stylite.de/blog/',
					'https://github.com/styliteag',
				],
				knowsAbout: [
					'System Architecture',
					'Cloud Infrastructure',
					'DevOps',
					'Microservices',
					'ZFS',
					'Storage',
					'TrueNAS',
					'Open-E',
					'Virtualisierung',
					'Docker',
					'AI',
				],
			},
			{
				'@type': 'WebSite',
				'@id': 'https://www.bonis.de/#website',
				url: 'https://www.bonis.de',
				name: 'WBonis | System Architekt',
				author: { '@id': 'https://www.bonis.de/#person' },
			},
			{
				'@type': 'Blog',
				'@id': 'https://blog.stylite.de/blog/#blog',
				url: 'https://blog.stylite.de/blog/',
				name: 'Stylite AG Blog',
				author: { '@id': 'https://www.bonis.de/#person' },
				blogPost: blogPostings,
			},
		],
	};
}

function buildNoscriptBlogHtml(posts: BlogPost[]): string {
	const items = posts
		.map(
			(p) =>
				`\t\t\t\t\t<li><a href="${p.url}">${p.title}</a>${p.date ? ` <small>(${formatDate(p.date)})</small>` : ''}</li>`,
		)
		.join('\n');

	return `<section>
					<h2>Blog - Stylite AG</h2>
					<ul>
${items}
					</ul>
				</section>`;
}

function buildSitemapXml(posts: BlogPost[]): string {
	const blogEntries = posts
		.map(
			(p) => `	<url>
		<loc>${p.url}</loc>${p.date ? `\n\t\t<lastmod>${formatDate(p.date)}</lastmod>` : ''}
		<changefreq>monthly</changefreq>
		<priority>0.6</priority>
	</url>`,
		)
		.join('\n');

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>https://www.bonis.de/</loc>
		<changefreq>monthly</changefreq>
		<priority>1.0</priority>
	</url>
	<url>
		<loc>https://blog.stylite.de/blog/</loc>
		<changefreq>weekly</changefreq>
		<priority>0.8</priority>
	</url>
${blogEntries}
</urlset>
`;
}

export function blogSeo(): Plugin {
	let blogPosts: BlogPost[] = [];

	return {
		name: 'blog-seo',
		enforce: 'post',
		apply: 'build',

		async buildStart() {
			try {
				blogPosts = await fetchBlogPosts();
				console.log(`[blog-seo] Fetched ${blogPosts.length} blog posts from RSS feed`);
			} catch (e) {
				console.warn('[blog-seo] Failed to fetch RSS feed, using empty list:', e);
				blogPosts = [];
			}
		},

		transformIndexHtml(html) {
			if (blogPosts.length === 0) return html;

			const blogSection = buildNoscriptBlogHtml(blogPosts.slice(0, 15));

			// Insert blog section after Erfahrung inside <noscript>
			html = html.replace(
				/(<section>\s*<h2>Erfahrung<\/h2>[\s\S]*?<\/section>)/,
				`$1\n\n\t\t\t\t${blogSection}`,
			);

			// Inject JSON-LD structured data into <head>
			const jsonLd = buildJsonLd(blogPosts);
			const tags: HtmlTagDescriptor[] = [
				{
					tag: 'script',
					attrs: { type: 'application/ld+json' },
					children: JSON.stringify(jsonLd),
					injectTo: 'head',
				},
			];

			return { html, tags };
		},

		generateBundle() {
			const sitemap = buildSitemapXml(blogPosts);

			this.emitFile({
				type: 'asset',
				fileName: 'sitemap.xml',
				source: sitemap,
			});
		},
	};
}
