<script lang="ts">
	import type { DeviceType } from '🍎/helpers/device-detect';
	import type { AppID } from '🍎/state/apps.svelte';
	import { apps } from '🍎/state/apps.svelte';
	import { apps_config } from '🍎/configs/apps/apps-config';
	import { preferences } from '🍎/state/preferences.svelte.ts';

	const { device }: { device: DeviceType } = $props();

	// Apps to exclude on mobile
	const HIDDEN_APPS: AppID[] = ['finder', 'vscode', 'view-source', 'wallpapers'];

	// Dock apps (always shown at bottom)
	const DOCK_APPS: AppID[] = ['contact', 'mail', 'safari', 'notes'];

	// Grid apps = all visible apps minus dock apps
	const grid_apps = $derived(
		(Object.keys(apps_config) as AppID[]).filter(
			(id) => !HIDDEN_APPS.includes(id) && !DOCK_APPS.includes(id),
		),
	);

	const columns = $derived(device === 'phone' ? 4 : 5);

	function open_app(id: AppID) {
		if (apps_config[id].external_action) {
			apps_config[id].external_action!(null);
			return;
		}
		apps.open[id] = true;
		apps.active = id;
	}

	function app_label(id: AppID): string {
		return apps_config[id].title;
	}

	function app_icon(id: AppID): string {
		return `/app-icons/${id}/256.webp`;
	}
</script>

<div class="ios-home" style:--columns={columns}>
	<div class="wallpaper" style:background-image="url({preferences.wallpaper.image})"></div>

	<div class="app-grid">
		{#each grid_apps as id}
			<button class="app-item" onclick={() => open_app(id)}>
				<img src={app_icon(id)} alt={app_label(id)} class="app-icon" />
				<span class="app-name">{app_label(id)}</span>
			</button>
		{/each}
	</div>

	<div class="dock-bar">
		{#each DOCK_APPS as id}
			<button class="dock-item" onclick={() => open_app(id)}>
				<img src={app_icon(id)} alt={app_label(id)} class="app-icon" />
			</button>
		{/each}
	</div>
</div>

<style>
	.ios-home {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.wallpaper {
		position: absolute;
		inset: 0;
		background-size: cover;
		background-position: center;
		z-index: 0;
	}

	.app-grid {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(var(--columns), 1fr);
		gap: 16px 8px;
		padding: 16px 20px;
		align-content: start;
		overflow-y: auto;
		position: relative;
		z-index: 1;
	}

	.app-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		-webkit-tap-highlight-color: transparent;

		&:active .app-icon {
			opacity: 0.7;
			transform: scale(0.9);
		}
	}

	.app-icon {
		width: 60px;
		height: 60px;
		border-radius: 14px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		transition: transform 100ms ease, opacity 100ms ease;
	}

	.app-name {
		font-size: 11px;
		color: #fff;
		text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
		max-width: 70px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: center;
	}

	.dock-bar {
		display: flex;
		justify-content: center;
		gap: 16px;
		padding: 10px 20px 16px;
		margin: 0 12px 8px;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border-radius: 24px;
		position: relative;
		z-index: 1;
	}

	.dock-item {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		-webkit-tap-highlight-color: transparent;

		&:active .app-icon {
			opacity: 0.7;
			transform: scale(0.9);
		}

		.app-icon {
			width: 56px;
			height: 56px;
		}
	}
</style>
