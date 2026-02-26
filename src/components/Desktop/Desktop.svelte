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
