<script lang="ts">
	import { preferences } from '🍎/state/preferences.svelte.ts';
	import { trackEvent } from '🍎/helpers/tracking';
	import GithubIcon from '~icons/mdi/github';
	import LinkedInIcon from '~icons/mdi/linkedin';
	import EmailIcon from '~icons/mdi/email-outline';
	import WebIcon from '~icons/mdi/web';
	import CodeIcon from '~icons/mdi/code-braces';
	import ServerIcon from '~icons/mdi/server';
	import MonitorIcon from '~icons/mdi/monitor';
	import BrainIcon from '~icons/mdi/head-cog';

	type Section = 'about' | 'skills';
	let active_section: Section = $state('about');

	function switch_section(section: Section) {
		active_section = section;
		trackEvent('AboutMe', 'section_switched', section);
	}

	function external(node: HTMLAnchorElement) {
		node.rel = 'noopener noreferrer';
		node.target = '_blank';
	}
</script>

<section class="container">
	<header class="titlebar app-window-drag-handle">
		<span>About Me</span>
	</header>

	<aside class:light={preferences.theme.scheme === 'light'}>
		<nav>
			<button class="nav-btn" class:active={active_section === 'about'} onclick={() => switch_section('about')}>
				<CodeIcon /> About
			</button>
			<button class="nav-btn" class:active={active_section === 'skills'} onclick={() => switch_section('skills')}>
				<WebIcon /> Skills
			</button>

			<hr />

			<a href="https://github.com/WBonis" use:external>
				<GithubIcon /> GitHub
			</a>
			<a href="https://www.linkedin.com/in/wbonis/" use:external>
				<LinkedInIcon /> LinkedIn
			</a>
			<a href="mailto:bonis@bonis.de" use:external>
				<EmailIcon /> Email
			</a>
		</nav>
	</aside>

	<section class="content">
		{#if active_section === 'about'}
			<div class="avatar">
				<span class="avatar-initials">WB</span>
			</div>

			<br />

			<h1>WBonis</h1>
			<h2>System Architekt</h2>

			<br />

			<p>
				Erfahrener System Architekt mit Leidenschaft für skalierbare, sichere und effiziente
				Systeme. Spezialisiert auf Storage-Infrastruktur, Virtualisierung und moderne
				Entwicklungs-Workflows.
			</p>

			<br />

			<p>
				Immer auf der Suche nach neuen Technologien und der Optimierung von System-Design
				und Automatisierung.
			</p>

			<br />

			<div class="contact-list">
				<a href="mailto:bonis@bonis.de" target="_blank" rel="noopener noreferrer">
					<EmailIcon /> bonis@bonis.de
				</a>
				<a href="mailto:wb@stylite.de" target="_blank" rel="noopener noreferrer">
					<EmailIcon /> wb@stylite.de
				</a>
				<a href="https://www.linkedin.com/in/wbonis/" target="_blank" rel="noopener noreferrer">
					<LinkedInIcon /> linkedin.com/in/wbonis
				</a>
				<a href="https://github.com/WBonis" target="_blank" rel="noopener noreferrer">
					<GithubIcon /> github.com/WBonis
				</a>
				<a href="https://github.com/styliteag" target="_blank" rel="noopener noreferrer">
					<GithubIcon /> github.com/styliteag
				</a>
				<a href="https://blog.stylite.de/blog/" target="_blank" rel="noopener noreferrer">
					<WebIcon /> blog.stylite.de
				</a>
			</div>

			<br />

			<div class="highlights">
				<div class="highlight-card">
					<ServerIcon />
					<h3>Infrastructure</h3>
					<p>ZFS, TrueNAS, Open-E, Linux, Docker</p>
				</div>
				<div class="highlight-card">
					<MonitorIcon />
					<h3>Virtualisierung</h3>
					<p>Proxmox, VMware, Container</p>
				</div>
				<div class="highlight-card">
					<BrainIcon />
					<h3>AI</h3>
					<p>AI-Benutzer</p>
				</div>
			</div>
		{:else}
			<h1 class="section-heading">Skills & Expertise</h1>

			<div class="skill-group">
				<h3><ServerIcon /> Storage & Infrastructure</h3>
				<div class="skill-tags">
					<span class="skill-tag">ZFS</span>
					<span class="skill-tag">TrueNAS</span>
					<span class="skill-tag">Open-E</span>
					<span class="skill-tag">Linux</span>
					<span class="skill-tag">Backup & Recovery</span>
				</div>
			</div>

			<div class="skill-group">
				<h3><MonitorIcon /> Virtualisierung & Container</h3>
				<div class="skill-tags">
					<span class="skill-tag">Proxmox</span>
					<span class="skill-tag">VMware</span>
					<span class="skill-tag">Docker</span>
					<span class="skill-tag">LXC</span>
				</div>
			</div>

			<div class="skill-group">
				<h3><CodeIcon /> Development & DevOps</h3>
				<div class="skill-tags">
					<span class="skill-tag">Go</span>
					<span class="skill-tag">Python</span>
					<span class="skill-tag">TypeScript</span>
					<span class="skill-tag">Rust</span>
					<span class="skill-tag">Perl</span>
					<span class="skill-tag">Bash</span>
				</div>
			</div>

			<div class="skill-group">
				<h3><WebIcon /> Monitoring</h3>
				<div class="skill-tags">
					<span class="skill-tag">Prometheus</span>
					<span class="skill-tag">Grafana</span>
					<span class="skill-tag">Checkmk</span>
				</div>
			</div>

			<div class="skill-group">
				<h3><BrainIcon /> AI & Architektur</h3>
				<div class="skill-tags">
					<span class="skill-tag">AI-Benutzer</span>
					<span class="skill-tag">Systemanalyse</span>
					<span class="skill-tag">Systemdesign</span>
					<span class="skill-tag">Microservices</span>
					<span class="skill-tag">Monitoring</span>
					<span class="skill-tag">Debugging</span>
				</div>
			</div>
		{/if}
	</section>
</section>

<style>
	.container {
		--color: var(--system-color-light-hsl);

		display: grid;
		grid-template-columns: 12rem 1fr;
		grid-template-rows: 3rem 1fr;

		height: 100%;
		min-height: 0;
		overflow: hidden;

		border-radius: inherit;

		background-image: linear-gradient(
			to right,
			hsla(var(--color), 0.7) 12rem,
			hsla(var(--color), 1) 12rem 100%
		);

		transition: --color 200ms ease-in;

		color: var(--system-color-dark);
	}

	.titlebar {
		grid-area: 1 / 1 / span 1 / span 2;

		display: flex;
		justify-content: center;

		z-index: 1;

		padding: 0.9rem 1rem;

		width: 100%;

		border-top-left-radius: inherit;
		border-top-right-radius: inherit;

		user-select: none;

		span {
			color: hsla(var(--system-color-dark-hsl), 0.8);
			font-weight: 500;
			font-size: 0.9rem;
			letter-spacing: 0.5px;
		}
	}

	aside {
		grid-area: 1 / 1 / span 2 / span 1;

		transform: translateZ(0);

		height: calc(100% - 2.7px);
		width: calc(12rem - 2.27px);

		margin: 1.8px 0 0px 1.8px;

		border-top-left-radius: 0.5rem;
		border-bottom-left-radius: inherit;

		&::before {
			content: '';

			width: inherit;
			height: inherit;

			border-radius: inherit;

			position: fixed;
			left: 0;
			top: 0;

			z-index: -1;
			backdrop-filter: blur(12px);
		}

		&.light {
			height: calc(100% - 3px);
			width: calc(12rem - 2.5px);

			margin: 1.7px 0 0px 1.7px;

			border-top-left-radius: 0.5rem;
			border-bottom-left-radius: 0.5rem;
		}

		nav {
			display: flex;
			flex-direction: column;
			gap: 0.2rem;

			margin: 4rem 0.6rem;

			hr {
				display: block;

				width: 100%;
				height: 1px;

				background-color: hsla(var(--system-color-dark-hsl), 0.2);

				border: none;
			}

			a, .nav-btn {
				display: flex;
				gap: 0.4rem;
				align-items: center;
				justify-content: flex-start;

				color: hsla(var(--system-color-dark-hsl), 0.9);
				text-decoration: none;
				font-weight: 400;
				font-size: inherit;
				font-family: inherit;

				padding: 0.5rem 0.5rem;

				border-radius: 0.4rem;
				border: none;
				background: none;
				cursor: pointer;
				width: 100%;
				text-align: left;

				transition: background-color 100ms ease;

				:global(svg) {
					flex-shrink: 0;
					width: 1.1rem;
				}

				&:hover {
					background-color: hsla(var(--system-color-dark-hsl), 0.2);
				}

				&.active {
					background-color: var(--system-color-primary);
					color: var(--system-color-primary-contrast);
				}
			}
		}
	}

	.content {
		grid-area: 2 / 2 / span 1 / span 1;

		display: flex;
		flex-direction: column;
		align-items: center;

		padding: 1.5rem;
		overflow-y: auto;
	}

	.avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-initials {
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
		letter-spacing: 2px;
	}

	h1 {
		font-size: 2rem;
		line-height: 1.4;
	}

	h2 {
		font-size: 1.2rem;
		line-height: 1.2;
		opacity: 0.7;
		font-weight: 400;
	}

	.skill-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.skill-tag {
		padding: 0.3rem 0.8rem;
		border-radius: 1rem;
		background-color: hsla(var(--system-color-primary-hsl), 0.15);
		color: var(--system-color-primary);
		font-size: 0.8rem;
		font-weight: 500;
	}

	p {
		line-height: 1.6;
		text-align: center;
		max-width: 500px;
	}

	.contact-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		width: 100%;
		max-width: 500px;

		a {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.5rem 0.75rem;
			border-radius: 0.5rem;
			text-decoration: none;
			color: inherit;
			font-size: 0.85rem;
			transition: background-color 100ms ease;

			:global(svg) {
				font-size: 1.1rem;
				color: var(--system-color-primary);
				flex-shrink: 0;
			}

			&:hover {
				background-color: hsla(var(--system-color-dark-hsl), 0.06);
			}
		}
	}

	.highlights {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		width: 100%;
		max-width: 500px;
	}

	.highlight-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding: 1rem 0.5rem;
		border-radius: 0.75rem;
		background-color: hsla(var(--system-color-dark-hsl), 0.04);
		border: 1px solid hsla(var(--system-color-dark-hsl), 0.08);
		text-align: center;

		:global(svg) {
			font-size: 1.5rem;
			color: var(--system-color-primary);
		}

		h3 {
			font-size: 0.8rem;
			font-weight: 600;
			margin: 0;
		}

		p {
			font-size: 0.7rem;
			opacity: 0.6;
			margin: 0;
			line-height: 1.3;
		}
	}

	.section-heading {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.skill-group {
		width: 100%;
		max-width: 500px;
		margin-bottom: 1.25rem;

		h3 {
			display: flex;
			align-items: center;
			gap: 0.4rem;
			font-size: 0.9rem;
			font-weight: 600;
			margin-bottom: 0.5rem;
			color: var(--system-color-primary);

			:global(svg) {
				font-size: 1.1rem;
			}
		}
	}
</style>
