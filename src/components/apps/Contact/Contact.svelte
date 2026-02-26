<script lang="ts">
	import { preferences } from '🍎/state/preferences.svelte.ts';

	const { ios_mode = false }: { ios_mode?: boolean } = $props();

	function external(node: HTMLAnchorElement) {
		node.rel = 'noopener noreferrer';
		node.target = '_blank';
	}
</script>

<section class="container" class:light={preferences.theme.scheme === 'light'}>
	{#if !ios_mode}
		<header class="titlebar app-window-drag-handle">
			<span>Kontakt</span>
		</header>
	{/if}

	<div class="card">
		<div class="avatar-section">
			<div class="avatar">WB</div>
			<h1 class="name">Wim Bonis</h1>
			<p class="role">System Architekt</p>
		</div>

		<div class="details">
			<div class="row">
				<span class="label">E-Mail (privat)</span>
				<a href="mailto:bonis@bonis.de">bonis@bonis.de</a>
			</div>
			<div class="row">
				<span class="label">E-Mail (geschäftlich)</span>
				<a href="mailto:wb@stylite.de">wb@stylite.de</a>
			</div>
			<div class="row">
				<span class="label">Blog</span>
				<a href="https://blog.stylite.de" use:external>blog.stylite.de</a>
			</div>
			<div class="row">
				<span class="label">Firma</span>
				<a href="https://stylite.de" use:external>stylite.de</a>
			</div>
			<div class="row">
				<span class="label">GitHub</span>
				<a href="https://github.com/WBonis" use:external>github.com/WBonis</a>
			</div>
			<div class="row">
				<span class="label">LinkedIn</span>
				<a href="https://linkedin.com/in/wbonis" use:external>linkedin.com/in/wbonis</a>
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
		background-color: hsla(var(--system-color-light-hsl), 1);
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

		span {
			color: hsla(var(--system-color-dark-hsl), 0.8);
			font-weight: 500;
			font-size: 0.9rem;
			letter-spacing: 0.5px;
		}
	}

	.card {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.avatar-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding-bottom: 1.2rem;
		border-bottom: 1px solid hsla(var(--system-color-dark-hsl), 0.1);
	}

	.avatar {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #5ac8fa, #007aff);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.6rem;
		font-weight: 700;
		color: white;
		letter-spacing: 1px;
	}

	.name {
		font-size: 1.3rem;
		font-weight: 600;
		margin: 0;
	}

	.role {
		font-size: 0.85rem;
		opacity: 0.5;
		margin: 0;
	}

	.details {
		display: flex;
		flex-direction: column;
	}

	.row {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid hsla(var(--system-color-dark-hsl), 0.08);

		&:last-child {
			border-bottom: none;
		}
	}

	.label {
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: lowercase;
		opacity: 0.5;
	}

	.row a {
		font-size: 0.9rem;
		color: #007aff;
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
