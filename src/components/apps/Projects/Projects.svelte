<script lang="ts">
	const { ios_mode = false }: { ios_mode?: boolean } = $props();

	const projects = [
		{
			name: 'Cloud-Infrastruktur-Plattform',
			description: 'Skalierbare Multi-Cloud-Infrastrukturverwaltung mit automatisierter Bereitstellung und Überwachung.',
			tags: ['Cloud', 'Docker', 'Linux'],
			icon: '🏗️',
		},
		{
			name: 'Microservices-Framework',
			description: 'Eigenes Microservices-Framework mit Service Discovery, Load Balancing und Circuit Breakern.',
			tags: ['Go', 'gRPC', 'Docker'],
			icon: '🔧',
		},
		{
			name: 'Sicherheits-Audit-Tool',
			description: 'Automatisierte Sicherheitsscans und Compliance-Prüfung für containerisierte Anwendungen.',
			tags: ['Python', 'Security', 'CI/CD'],
			icon: '🔒',
		},
		{
			name: 'Echtzeit-Monitoring-Dashboard',
			description: 'Vollständige Monitoring-Lösung mit Echtzeit-Metriken, Alerting und Incident Management.',
			tags: ['React', 'Grafana', 'Prometheus'],
			icon: '📊',
		},
		{
			name: 'API Gateway',
			description: 'Hochperformantes API Gateway mit Rate Limiting, Authentifizierung und Request-Transformation.',
			tags: ['Rust', 'Redis', 'OAuth'],
			icon: '🚀',
		},
		{
			name: 'DevOps-Pipeline',
			description: 'End-to-End CI/CD-Pipeline mit automatisierten Tests, Deployment und Rollback-Funktionen.',
			tags: ['CI/CD', 'Docker'],
			icon: '⚙️',
		},
	];
</script>

<section class="container">
	{#if !ios_mode}
		<header class="titlebar app-window-drag-handle">
			<span>Projects</span>
		</header>
	{/if}

	<div class="toolbar">
		<h2>Meine Projekte</h2>
		<p class="subtitle">{projects.length} Projekte</p>
	</div>

	<div class="grid">
		{#each projects as project}
			<article class="card">
				<div class="card-icon">{project.icon}</div>
				<h3>{project.name}</h3>
				<p>{project.description}</p>
				<div class="tags">
					{#each project.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</article>
		{/each}
	</div>
</section>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
		border-radius: inherit;
		background-color: hsla(var(--system-color-light-hsl), 1);
		color: var(--system-color-dark);
	}

	.titlebar {
		display: flex;
		justify-content: center;
		padding: 0.9rem 1rem;
		width: 100%;
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
		user-select: none;
		flex-shrink: 0;

		span {
			color: hsla(var(--system-color-dark-hsl), 0.8);
			font-weight: 500;
			font-size: 0.9rem;
			letter-spacing: 0.5px;
		}
	}

	.toolbar {
		padding: 0.5rem 1.5rem 1rem;
		flex-shrink: 0;

		h2 {
			font-size: 1.5rem;
			font-weight: 700;
		}

		.subtitle {
			font-size: 0.85rem;
			opacity: 0.6;
			margin-top: 0.2rem;
		}
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 1rem;
		padding: 0 1.5rem 1.5rem;
		overflow-y: auto;
	}

	.card {
		padding: 1.2rem;
		border-radius: 0.8rem;
		background-color: hsla(var(--system-color-dark-hsl), 0.05);
		transition: background-color 150ms ease, transform 150ms ease;
		cursor: default;

		&:hover {
			background-color: hsla(var(--system-color-dark-hsl), 0.1);
			transform: translateY(-2px);
		}
	}

	.card-icon {
		font-size: 2rem;
		margin-bottom: 0.5rem;
	}

	h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.4rem;
	}

	.card p {
		font-size: 0.82rem;
		line-height: 1.4;
		opacity: 0.75;
		margin-bottom: 0.8rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.tag {
		padding: 0.15rem 0.5rem;
		border-radius: 0.8rem;
		background-color: hsla(var(--system-color-primary-hsl), 0.12);
		color: var(--system-color-primary);
		font-size: 0.7rem;
		font-weight: 500;
	}
</style>
