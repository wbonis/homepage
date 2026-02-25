<script lang="ts">
	import RepoIcon from '~icons/mdi/source-repository';
	import ArrowLeft from '~icons/mdi/arrow-left';

	const {
		is_being_dragged,
	}: {
		is_being_dragged: boolean;
	} = $props();

	type Repo = {
		name: string;
		full_name: string;
		description: string;
		language: string;
	};

	type RepoGroup = {
		name: string;
		type: 'user' | 'org';
		repos: Repo[];
		loading: boolean;
	};

	const sources: { name: string; type: 'user' | 'org' }[] = [
		{ name: 'WBonis', type: 'user' },
		{ name: 'styliteag', type: 'org' },
	];

	let groups = $state<RepoGroup[]>(
		sources.map((s) => ({
			name: s.name,
			type: s.type,
			repos: [],
			loading: true,
		})),
	);

	let selectedRepo = $state<string | null>(null);

	const langColors: Record<string, string> = {
		PHP: '#4F5D95',
		Shell: '#89e051',
		TypeScript: '#3178c6',
		Python: '#3572A5',
		Go: '#00ADD8',
		JavaScript: '#f1e05a',
		HTML: '#e34c26',
		CSS: '#563d7c',
		Rust: '#dea584',
		Svelte: '#ff3e00',
	};

	async function fetchRepos(group: RepoGroup) {
		const endpoint =
			group.type === 'org'
				? `https://api.github.com/orgs/${group.name}/repos`
				: `https://api.github.com/users/${group.name}/repos`;
		try {
			const res = await fetch(`${endpoint}?per_page=100&sort=updated`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			group.repos = data
				.filter((r: any) => !r.fork && !r.archived)
				.map((r: any) => ({
					name: r.name,
					full_name: r.full_name,
					description: r.description || '',
					language: r.language || '',
				}));
		} catch {
			group.repos = [];
		} finally {
			group.loading = false;
		}
	}

	groups.forEach(fetchRepos);

	function openRepo(full_name: string) {
		selectedRepo = full_name;
	}


</script>

<section class="container">
	<header class="app-window-drag-handle">
		{#if selectedRepo}
			<button class="back-btn" onclick={() => (selectedRepo = null)}>
				<ArrowLeft />
			</button>
			<span class="title">{selectedRepo}</span>
		{:else}
			<span class="title">VS Code — Open Repository</span>
		{/if}
	</header>

	{#if selectedRepo}
		<div class="editor">
			{#if is_being_dragged}
				<div class="drag-overlay"></div>
			{/if}
			<iframe
				src="https://stackblitz.com/github/{selectedRepo}?embed=1&hideNavigation=0&theme=dark&view=editor"
				title="VS Code — {selectedRepo}"
				allow="cross-origin-isolated"
			></iframe>
		</div>
	{:else}
		<div class="picker">
			<div class="welcome">
				<img src="/app-icons/vscode/256.webp" alt="VS Code" class="welcome-icon" />
				<h2>Welcome</h2>
				<p>Select a repository to open in the editor</p>
			</div>

			<div class="repo-groups">
				{#each groups as group}
					<div class="group">
						<h3 class="group-title">{group.name}</h3>
						{#if group.loading}
							<p class="loading">Loading repositories...</p>
						{:else}
							<div class="repo-list">
								{#each group.repos as repo}
									<button
										class="repo-item"
										onclick={() => openRepo(repo.full_name)}
									>
										<RepoIcon style="flex-shrink: 0; opacity: 0.5;" />
										<div class="repo-info">
											<span class="repo-name">{repo.name}</span>
											{#if repo.description}
												<span class="repo-desc">{repo.description}</span>
											{/if}
										</div>
										{#if repo.language}
											<span class="repo-lang">
												<span class="lang-dot" style="background-color: {langColors[repo.language] || '#888'};"></span>
												{repo.language}
											</span>
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</section>

<style>
	.container {
		background-color: #1e1e1e;
		padding: 1px;
		border-radius: inherit;
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100%;
		color: #ccc;
	}

	header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem 0.6rem 5.5rem;
		background: #323233;
		border-bottom: 1px solid #1a1a1a;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		color: #ccc;
		cursor: pointer;
		padding: 0.2rem;
		border-radius: 0.3rem;
		font-size: 1.1rem;

		&:hover {
			background: rgba(255, 255, 255, 0.1);
		}
	}

	.title {
		font-size: 0.8rem;
		opacity: 0.7;
		font-weight: 400;
	}

	.editor {
		min-height: 0;
		position: relative;
	}

	.drag-overlay {
		position: absolute;
		inset: 0;
		z-index: 1;
	}

	iframe {
		width: 100%;
		height: 100%;
		border: none;
		border-radius: 0 0 0.75rem 0.75rem;
	}

	.picker {
		overflow-y: auto;
		padding: 2rem;
	}

	.welcome {
		text-align: center;
		margin-bottom: 2rem;
	}

	.welcome-icon {
		width: 64px;
		height: 64px;
		margin-bottom: 0.8rem;
	}

	.welcome h2 {
		font-size: 1.4rem;
		font-weight: 300;
		color: #fff;
		margin: 0 0 0.3rem;
	}

	.welcome p {
		font-size: 0.85rem;
		opacity: 0.5;
		margin: 0;
	}

	.repo-groups {
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.group-title {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.4;
		font-weight: 600;
		margin: 0 0 0.5rem;
	}

	.loading {
		font-size: 0.82rem;
		opacity: 0.4;
	}

	.repo-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.repo-item {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.5rem 0.7rem;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid transparent;
		border-radius: 0.4rem;
		cursor: pointer;
		text-align: left;
		color: #ccc;
		transition: all 100ms ease;
		font-family: inherit;
		font-size: inherit;

		&:hover {
			background: rgba(255, 255, 255, 0.08);
			border-color: rgba(255, 255, 255, 0.1);
		}
	}

	.repo-info {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
		flex: 1;
	}

	.repo-name {
		font-size: 0.85rem;
		font-weight: 500;
		color: #e0e0e0;
	}

	.repo-desc {
		font-size: 0.75rem;
		opacity: 0.45;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.repo-lang {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.72rem;
		opacity: 0.5;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.lang-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
	}

	:global(.tl-container.vscode) {
		top: 0.6rem;
		left: 0.6rem;
	}
</style>
