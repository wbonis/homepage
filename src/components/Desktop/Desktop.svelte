<script lang="ts">
	import type { DeviceType } from '🍎/helpers/device-detect';
	import DeviceFrame from '../DeviceFrame/DeviceFrame.svelte';
	import Dock from '../Dock/Dock.svelte';
	import TopBar from '../TopBar/TopBar.svelte';
	import Wallpaper from '../apps/WallpaperApp/Wallpaper.svelte';
	import BootupScreen from './BootupScreen.svelte';
	import ContextMenu from './ContextMenu.svelte';
	import ScreenOverlay from './ScreenOverlay.svelte';
	import SystemUpdate from './SystemUpdate.svelte';
	import WindowsArea from './Window/WindowsArea.svelte';
	import { trigger_glitch, screen_overlay } from '🍎/state/screen-overlay.svelte';

	const { deviceType = 'desktop' as DeviceType }: { deviceType?: DeviceType } = $props();

	const isMobile = deviceType !== 'desktop';

	const isMac = /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

	if (!isMac) {
		Promise.all([
			import('@fontsource/inter/latin-ext-300.css'),
			import('@fontsource/inter/latin-ext-400.css'),
			import('@fontsource/inter/latin-ext-500.css'),
			import('@fontsource/inter/latin-ext-600.css'),
		]);
	}
	let mainEl = $state<HTMLElement>();

	// Idle glitch: trigger after 2 minutes of no interaction
	const IDLE_TIMEOUT = 2 * 60 * 1000;
	let idle_timer: ReturnType<typeof setTimeout>;
	let idle_triggered = false;

	function reset_idle() {
		clearTimeout(idle_timer);
		if (idle_triggered) return;
		idle_timer = setTimeout(() => {
			if (screen_overlay.mode === 'none') {
				idle_triggered = true;
				trigger_glitch();
			}
		}, IDLE_TIMEOUT);
	}

	$effect(() => {
		if (isMobile) return;
		const events = ['pointermove', 'pointerdown', 'keydown', 'scroll', 'touchstart'] as const;
		reset_idle();
		for (const e of events) window.addEventListener(e, reset_idle, { passive: true });
		return () => {
			clearTimeout(idle_timer);
			for (const e of events) window.removeEventListener(e, reset_idle);
		};
	});
</script>

<DeviceFrame device={deviceType}>
	{#if isMobile}
		{#await import('../IOSShell/IOSShell.svelte') then { default: IOSShell }}
			<IOSShell device={deviceType} />
		{/await}
	{:else}
		<div bind:this={mainEl} class="container">
			<main>
				<TopBar />
				<WindowsArea />
				<Dock />
			</main>

			<Wallpaper />
			<ScreenOverlay />
			<SystemUpdate />

			<ContextMenu target_element={mainEl} />
		</div>
	{/if}

	<BootupScreen />
</DeviceFrame>

<style>
	.container {
		height: 100dvh;
		width: 100%;
		overflow: hidden;
	}

	main {
		height: 100%;
		width: 100%;

		display: grid;
		grid-template-rows: auto 1fr auto;
		grid-template-columns: minmax(0, 1fr);
		overflow: hidden;
	}
</style>
