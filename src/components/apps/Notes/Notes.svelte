<script lang="ts">
	import { preferences } from '🍎/state/preferences.svelte.ts';
	import NoteIcon from '~icons/mdi/note-text-outline';

	const { ios_mode = false }: { ios_mode?: boolean } = $props();
</script>

<section class="container" class:ios={ios_mode}>
	{#if !ios_mode}
		<header class="titlebar app-window-drag-handle">
			<span>Notizen</span>
		</header>
	{/if}

	<div class="body">
		{#if !ios_mode}
			<aside class:light={preferences.theme.scheme === 'light'}>
				<div class="sidebar-header">Notizen</div>
				<button class="note-item active">
					<NoteIcon />
					<div class="note-preview">
						<strong>Lebenslauf (Entwurf)</strong>
						<span>Erfahrung, Fähigkeiten, Ausbildung...</span>
					</div>
				</button>
			</aside>
		{/if}

		<div class="content">
			<div class="note-content">
				<h1>Lebenslauf (Entwurf)</h1>

				<div class="section">
					<h2>Erfahrung</h2>

					<div class="entry">
						<div class="entry-header">
							<h3>CTO / Vorstand</h3>
							<span class="date">2019 - Heute</span>
						</div>
						<p class="company">Stylite AG</p>
						<ul>
							<li>Technische Strategie für Managed IT Services und SaaS/IaaS-Hosting</li>
							<li>Verantwortung für Infrastruktur-Architektur, Plattformbetrieb und Servicebereitstellung</li>
						</ul>
					</div>

					<div class="entry">
						<div class="entry-header">
							<h3>CTO</h3>
							<span class="date">2004 - 2018</span>
						</div>
						<p class="company">Udicom AG</p>
						<ul>
							<li>Managed IT Services und Hosting-Infrastruktur</li>
							<li>Verantwortlich für technische Ausrichtung und Plattform-Architektur</li>
						</ul>
					</div>

					<div class="entry">
						<div class="entry-header">
							<h3>Freiberufler</h3>
							<span class="date">2000 - 2003</span>
						</div>
						<p class="company">Selbstständig</p>
						<ul>
							<li>Linux-Infrastruktur Aufbau und Administration</li>
							<li>IT-Beratung und Systemdesign für Unternehmen</li>
						</ul>
					</div>

					<div class="entry">
						<div class="entry-header">
							<h3>CTO</h3>
							<span class="date">1990 - 1999</span>
						</div>
						<p class="company">Kiss GmbH — Internet Provider Kaiserslautern</p>
						<ul>
							<li>Aufbau und Betrieb eines lokalen ISP mit Dial-up, ISDN und Festnetz-Internetzugang</li>
							<li>Verwaltung von Webhosting-Diensten und Server-Infrastruktur</li>
						</ul>
					</div>

					<div class="entry">
						<div class="entry-header">
							<h3>Mitgründer</h3>
							<span class="date">1990 - 1994</span>
						</div>
						<p class="company">Antares GbR</p>
						<ul>
							<li>Mitgründung eines IT-Unternehmens mit Fokus auf Systemadministration und Infrastruktur</li>
						</ul>
					</div>
				</div>

				<div class="section">
					<h2>Fähigkeiten</h2>
					<div class="skills-grid">
						<div>
							<h4>Infrastruktur</h4>
							<p>Docker, Linux</p>
						</div>
						<div>
							<h4>Storage</h4>
							<p>ZFS, TrueNAS, Open-E</p>
						</div>
						<div>
							<h4>Virtualisierung</h4>
							<p>Proxmox, VMware, Docker</p>
						</div>
						<div>
							<h4>Sprachen</h4>
							<p>Go, Python, TypeScript, Rust, Perl, Bash</p>
						</div>
						<div>
							<h4>Tools</h4>
							<p>Prometheus, Grafana</p>
						</div>
						<div>
							<h4>Architektur</h4>
							<p>Systemanalyse, Systemdesign, Microservices, Monitoring, Debugging</p>
						</div>
						<div>
							<h4>KI</h4>
							<p>KI-Anwender</p>
						</div>
					</div>
				</div>

				<div class="section">
					<h2>Erfolge</h2>
					<ul>
						<li>Aufbau eines der ersten Internet Service Provider in Kaiserslautern</li>
						<li>Autodidaktisches Programmieren mit KI</li>
						<li>Mehrere Sicherheitslücken entdeckt, z.B. in Cloud-Telefonie-Provisionierungssystemen</li>
						<li>Allrounder in der IT</li>
					</ul>
				</div>

				<div class="section">
					<h2>Ausbildung</h2>
					<div class="entry">
						<div class="entry-header">
							<h3>Bachelor Elektrotechnik</h3>
							<span class="date">1984 - 1989</span>
						</div>
						<p class="company">Technische Universität (TU) Kaiserslautern</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		border-radius: inherit;
		color: var(--system-color-dark);
	}

	.titlebar {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 0.7rem 1rem;
		width: 100%;
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
		user-select: none;
		flex-shrink: 0;
		background-color: #f5f0e8;
		border-bottom: 1px solid #e0d9ce;

		span {
			color: #3c3c3c;
			font-weight: 500;
			font-size: 0.9rem;
			letter-spacing: 0.5px;
		}
	}

	.body {
		flex: 1;
		display: grid;
		grid-template-columns: 11rem 1fr;
		overflow: hidden;
		border-bottom-left-radius: inherit;
		border-bottom-right-radius: inherit;
	}

	.container.ios .body {
		grid-template-columns: 1fr;
	}

	aside {
		background-color: #f9f5ed;
		border-right: 1px solid #e0d9ce;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		border-bottom-left-radius: inherit;
	}

	.sidebar-header {
		padding: 0.8rem 0.8rem 0.4rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: #8a8178;
	}

	.note-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.6rem 0.8rem;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		width: 100%;
		border-radius: 0.4rem;
		margin: 0 0.4rem;
		width: calc(100% - 0.8rem);

		&.active {
			background-color: #fbe9a2;
		}

		:global(svg) {
			flex-shrink: 0;
			width: 1rem;
			height: 1rem;
			margin-top: 0.1rem;
			color: #c4a84d;
		}
	}

	.note-preview {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		overflow: hidden;

		strong {
			font-size: 0.8rem;
			font-weight: 600;
			color: #3c3c3c;
		}

		span {
			font-size: 0.7rem;
			color: #8a8178;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.content {
		background-color: #fffef7;
		overflow-y: auto;
		border-bottom-right-radius: inherit;
	}

	.note-content {
		padding: 2rem;
		max-width: 550px;
		color: #3c3c3c;

		h1 {
			font-size: 1.5rem;
			font-weight: 700;
			margin-bottom: 1.5rem;
			color: #2c2c2c;
		}
	}

	.container.ios .note-content {
		padding: 1rem;
	}

	.section {
		margin-bottom: 1.5rem;

		h2 {
			font-size: 0.9rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 1px;
			color: #c4a84d;
			margin-bottom: 0.6rem;
			padding-bottom: 0.3rem;
			border-bottom: 1px solid #e8e0d0;
		}
	}

	.entry {
		margin-bottom: 0.8rem;
	}

	.entry-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;

		h3 {
			font-size: 0.85rem;
			font-weight: 600;
		}

		.date {
			font-size: 0.72rem;
			opacity: 0.5;
		}
	}

	.company {
		font-size: 0.78rem;
		opacity: 0.6;
		margin-bottom: 0.3rem;
	}

	ul {
		padding-left: 1.2rem;
		margin: 0;

		li {
			font-size: 0.78rem;
			line-height: 1.5;
			margin-bottom: 0.15rem;
		}
	}

	.skills-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;

		h4 {
			font-size: 0.78rem;
			font-weight: 600;
			margin-bottom: 0.15rem;
		}

		p {
			font-size: 0.72rem;
			line-height: 1.4;
			opacity: 0.7;
		}
	}
</style>
