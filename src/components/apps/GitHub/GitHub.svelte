<script lang="ts">
	import FolderIcon from '~icons/mdi/folder';
	import RepoIcon from '~icons/mdi/source-repository';
	import StarIcon from '~icons/mdi/star';
	import ForkIcon from '~icons/mdi/source-fork';
	import ChevronRight from '~icons/mdi/chevron-right';
	import ChevronDown from '~icons/mdi/chevron-down';

	type Repo = {
		name: string;
		description: string;
		language: string;
		url: string;
		stars: number;
	};

	type RepoGroup = {
		name: string;
		url: string;
		type: 'user' | 'org';
		repos: Repo[];
		loading: boolean;
		error: string | null;
	};

	const sources: { name: string; type: 'user' | 'org' }[] = [
		{ name: 'WBonis', type: 'user' },
		{ name: 'styliteag', type: 'org' },
	];

	let groups = $state<RepoGroup[]>(
		sources.map((s) => ({
			name: s.name,
			url: `https://github.com/${s.name}`,
			type: s.type,
			repos: [],
			loading: true,
			error: null,
		})),
	);

	let expandedGroups = $state<Record<string, boolean>>({
		'WBonis': true,
		'styliteag': true,
	});

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
		Java: '#b07219',
		C: '#555555',
		'C++': '#f34b7d',
		Ruby: '#701516',
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
				.filter((r: any) => !r.fork)
				.map((r: any) => ({
					name: r.name,
					description: r.description || '',
					language: r.language || '',
					url: r.html_url,
					stars: r.stargazers_count,
				}));
		} catch (e: any) {
			group.error = e.message;
		} finally {
			group.loading = false;
		}
	}

	// Fetch all groups on mount
	groups.forEach(fetchRepos);

	function toggleGroup(name: string) {
		expandedGroups[name] = !expandedGroups[name];
	}

	function openRepo(url: string) {
		window.open(url, '_blank');
	}
</script>

<section class="container">
	<header class="titlebar app-window-drag-handle">
		<span>Finder — src</span>
	</header>

	<div class="sidebar-layout">
		<aside class="sidebar">
			<div class="sidebar-section">
				<span class="sidebar-label">Favorites</span>
				<div class="sidebar-item active">
					<FolderIcon style="color: #54aef0;" /> src
				</div>
			</div>
			<div class="sidebar-section">
				<span class="sidebar-label">Locations</span>
				{#each groups as group}
					<a class="sidebar-item" href={group.url} target="_blank" rel="noopener noreferrer">
						<RepoIcon /> {group.name}
					</a>
				{/each}
			</div>
		</aside>

		<main class="content">
			<div class="path-bar">
				<span class="path-segment">src</span>
			</div>

			<div class="file-list">
				{#each groups as group}
					<div
						class="folder-row"
						onclick={() => toggleGroup(group.name)}
						role="button"
						tabindex="0"
						onkeydown={(e) => { if (e.key === 'Enter') toggleGroup(group.name); }}
					>
						<span class="expand-icon">
							{#if expandedGroups[group.name]}
								<ChevronDown />
							{:else}
								<ChevronRight />
							{/if}
						</span>
						<FolderIcon style="color: #54aef0; font-size: 1.1rem;" />
						<span class="folder-name">{group.name}</span>
						<span class="item-count">
							{#if group.loading}
								...
							{:else}
								{group.repos.length} items
							{/if}
						</span>
					</div>

					{#if expandedGroups[group.name]}
						{#if group.loading}
							<div class="loading-row">Loading repos...</div>
						{:else if group.error}
							<div class="loading-row error">Failed to load: {group.error}</div>
						{/if}
						{#each group.repos as repo}
							<div
								class="repo-row"
								onclick={() => openRepo(repo.url)}
								role="button"
								tabindex="0"
								onkeydown={(e) => { if (e.key === 'Enter') openRepo(repo.url); }}
							>
								<RepoIcon style="opacity: 0.6;" />
								<span class="repo-name">{repo.name}</span>
								<span class="repo-desc">{repo.description}</span>
								{#if repo.language}
									<span class="repo-lang">
										<span class="lang-dot" style="background-color: {langColors[repo.language] || '#888'};"></span>
										{repo.language}
									</span>
								{/if}
								{#if repo.stars > 0}
									<span class="repo-stars">
										<StarIcon style="font-size: 0.75rem;" /> {repo.stars}
									</span>
								{/if}
							</div>
						{/each}
					{/if}
				{/each}
			</div>
		</main>
	</div>
</section>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
		overflow: hidden;
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

	.sidebar-layout {
		display: grid;
		grid-template-columns: 11rem 1fr;
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.sidebar {
		background: hsla(var(--system-color-dark-hsl), 0.03);
		border-right: 1px solid hsla(var(--system-color-dark-hsl), 0.08);
		padding: 0.8rem 0.5rem;
		overflow-y: auto;
		border-bottom-left-radius: inherit;
	}

	.sidebar-section {
		margin-bottom: 1rem;
	}

	.sidebar-label {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		opacity: 0.4;
		padding: 0 0.5rem;
		margin-bottom: 0.3rem;
		display: block;
	}

	.sidebar-item {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.35rem 0.5rem;
		border-radius: 0.4rem;
		font-size: 0.82rem;
		cursor: pointer;
		transition: background-color 100ms ease;
		text-decoration: none;
		color: inherit;

		&:hover {
			background: hsla(var(--system-color-dark-hsl), 0.06);
		}

		&.active {
			background: hsla(var(--system-color-primary-hsl), 0.15);
			color: var(--system-color-primary);
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow: hidden;
	}

	.path-bar {
		padding: 0.4rem 1rem;
		border-bottom: 1px solid hsla(var(--system-color-dark-hsl), 0.08);
		flex-shrink: 0;
	}

	.path-segment {
		font-size: 0.8rem;
		font-weight: 500;
		opacity: 0.6;
	}

	.file-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.3rem 0;
	}

	.folder-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.8rem;
		cursor: pointer;
		transition: background-color 100ms ease;
		user-select: none;

		&:hover {
			background: hsla(var(--system-color-dark-hsl), 0.05);
		}
	}

	.expand-icon {
		display: flex;
		align-items: center;
		font-size: 0.9rem;
		opacity: 0.5;
		width: 1rem;
		flex-shrink: 0;
	}

	.folder-name {
		font-size: 0.85rem;
		font-weight: 600;
	}

	.item-count {
		margin-left: auto;
		font-size: 0.72rem;
		opacity: 0.4;
	}

	.loading-row {
		padding: 0.5rem 0.8rem 0.5rem 2.8rem;
		font-size: 0.8rem;
		opacity: 0.5;

		&.error {
			color: #e53e3e;
			opacity: 0.8;
		}
	}

	.repo-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.8rem 0.4rem 2.8rem;
		cursor: pointer;
		transition: background-color 100ms ease;

		&:hover {
			background: hsla(var(--system-color-primary-hsl), 0.08);
		}
	}

	.repo-name {
		font-size: 0.82rem;
		font-weight: 500;
		white-space: nowrap;
		min-width: 0;
	}

	.repo-desc {
		font-size: 0.75rem;
		opacity: 0.5;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
		min-width: 0;
	}

	.repo-lang {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.72rem;
		opacity: 0.6;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.lang-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.repo-stars {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		font-size: 0.72rem;
		opacity: 0.5;
		flex-shrink: 0;
	}
</style>
