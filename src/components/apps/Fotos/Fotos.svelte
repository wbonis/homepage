<script lang="ts">
	const { ios_mode = false }: { ios_mode?: boolean } = $props();

	let photos: string[] = $state([]);
	let selected: string | null = $state(null);

	$effect(() => {
		fetch('/photos/manifest.json')
			.then((r) => r.json())
			.then((list: string[]) => {
				photos = list;
			})
			.catch(() => {
				photos = [];
			});
	});

	function open_lightbox(photo: string) {
		selected = photo;
	}

	function close_lightbox() {
		selected = null;
	}

	function on_keydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close_lightbox();
	}
</script>

<svelte:window onkeydown={on_keydown} />

<section class="container">
	{#if !ios_mode}
		<header class="titlebar app-window-drag-handle">
			<span>Fotos</span>
			{#if photos.length > 0}
				<span class="count">{photos.length} Photos</span>
			{/if}
		</header>
	{/if}

	<section class="main-area">
		{#if photos.length === 0}
			<div class="empty">
				<p>No Photos</p>
				<p class="hint">Add images to <code>public/photos/</code> to see them here.</p>
			</div>
		{:else}
			<div class="grid">
				{#each photos as photo}
					<button class="photo-cell" onclick={() => open_lightbox(photo)}>
						<img src="/photos/{photo}" alt={photo} loading="lazy" />
					</button>
				{/each}
			</div>
		{/if}
	</section>
</section>

{#if selected}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div class="lightbox" role="dialog" tabindex="-1" onclick={close_lightbox} onkeydown={(e) => e.key === 'Escape' && close_lightbox()}>
		<img src="/photos/{selected}" alt={selected} />
	</div>
{/if}

<style>
	.container {
		background-color: var(--system-color-light);
		border-radius: inherit;
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100% !important;
		max-height: 100%;
		overflow-y: hidden;
	}

	.titlebar {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 0.5rem;
		padding: 0.9rem 1rem;
		width: 100%;
		border-bottom: solid 0.9px hsla(var(--system-color-dark-hsl), 0.3);

		span {
			color: hsla(var(--system-color-dark-hsl), 0.8);
			font-weight: 500;
			font-size: 0.9rem;
			letter-spacing: 0.5px;
		}

		.count {
			font-weight: 400;
			opacity: 0.6;
		}
	}

	.main-area {
		height: 100%;
		width: 100%;
		overflow-y: auto;
		padding: 0.5rem;

		&::-webkit-scrollbar {
			background-color: transparent;
			width: 18px;
		}

		&::-webkit-scrollbar-thumb {
			background-color: hsla(var(--system-color-dark-hsl), 0.8);
			border: 6px solid transparent;
			border-radius: 16px;
			background-clip: content-box;
		}

		&::-webkit-scrollbar-thumb:hover {
			background-color: hsla(var(--system-color-dark-hsl), 1);
		}
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 0.5rem;
		color: hsla(var(--system-color-dark-hsl), 0.5);

		p {
			margin: 0;
		}

		.hint {
			font-size: 0.8rem;
			opacity: 0.7;
		}

		code {
			background: hsla(var(--system-color-dark-hsl), 0.08);
			padding: 0.15rem 0.4rem;
			border-radius: 4px;
			font-size: 0.75rem;
		}
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 2px;
	}

	.photo-cell {
		aspect-ratio: 1;
		overflow: hidden;
		border: none;
		padding: 0;
		cursor: pointer;
		background: hsla(var(--system-color-dark-hsl), 0.05);

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			transition: transform 150ms ease;
		}

		&:hover img,
		&:focus-visible img {
			transform: scale(1.05);
		}
	}

	.lightbox {
		position: fixed;
		inset: 0;
		z-index: 999999;
		background: rgba(0, 0, 0, 0.85);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 2rem;

		img {
			max-width: 100%;
			max-height: 100%;
			object-fit: contain;
			border-radius: 4px;
			box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
		}
	}
</style>
