<script lang="ts">
	import type { DeviceType } from '🍎/helpers/device-detect';
	import type { AppID } from '🍎/state/apps.svelte';
	import { apps } from '🍎/state/apps.svelte';
	import { apps_config } from '🍎/configs/apps/apps-config';
	import IOSStatusBar from './IOSStatusBar.svelte';
	import IOSHomeScreen from './IOSHomeScreen.svelte';
	import AppNexus from '../apps/AppNexus.svelte';
	import ChevronLeft from '~icons/mdi/chevron-left';

	const { device }: { device: DeviceType } = $props();

	// Find the active (open) app — first one that is open
	const active_app = $derived(
		(Object.keys(apps.open) as AppID[]).find((id) => apps.open[id]) ?? null,
	);

	const active_title = $derived(active_app ? apps_config[active_app].title : '');

	function go_home() {
		// Close all open apps to return to home screen
		for (const id of Object.keys(apps.open) as AppID[]) {
			if (apps.open[id]) {
				apps.open[id] = false;
			}
		}
	}
</script>

<div class="ios-shell">
	<IOSStatusBar />

	{#if active_app}
		<nav class="ios-nav-bar">
			<button class="back-btn" onclick={go_home}>
				<ChevronLeft /> Zurück
			</button>
			<span class="nav-title">{active_title}</span>
			<div class="nav-spacer"></div>
		</nav>

		<div class="app-content">
			<AppNexus app_id={active_app} is_being_dragged={false} ios_mode={true} />
		</div>
	{:else}
		<IOSHomeScreen {device} />
	{/if}

	<div class="home-indicator"></div>
</div>

<style>
	.ios-shell {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
		overflow: hidden;
		background-color: var(--system-color-light, #f5f5f7);
	}

	.ios-nav-bar {
		display: flex;
		align-items: center;
		height: 44px;
		padding: 0 8px;
		flex-shrink: 0;
		background-color: hsla(var(--system-color-light-hsl, 0 0% 97%), 0.9);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-bottom: 0.5px solid hsla(var(--system-color-dark-hsl, 0 0% 0%), 0.15);
		position: relative;
		z-index: 10;
	}

	.back-btn {
		display: flex;
		align-items: center;
		gap: 0;
		background: none;
		border: none;
		color: var(--system-color-primary, #007aff);
		font-size: 16px;
		font-weight: 400;
		cursor: pointer;
		padding: 8px 12px 8px 0;
		font-family: inherit;
		min-width: 60px;
		-webkit-tap-highlight-color: transparent;

		:global(svg) {
			font-size: 24px;
			margin-left: -6px;
		}
	}

	.nav-title {
		flex: 1;
		text-align: center;
		font-size: 16px;
		font-weight: 600;
		color: var(--system-color-dark, #000);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.nav-spacer {
		min-width: 60px;
	}

	.app-content {
		flex: 1;
		overflow: hidden;
	}

	.home-indicator {
		width: 134px;
		height: 5px;
		background: rgba(0, 0, 0, 0.3);
		border-radius: 3px;
		margin: 6px auto 8px;
		flex-shrink: 0;
	}
</style>
