<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { DeviceType } from '🍎/helpers/device-detect';

	const { device, children }: { device: DeviceType; children: Snippet } = $props();

	const deviceClass = device === 'phone' ? 'device-iphone-14-pro' : 'device-ipad-pro';

	// Device frame outer dimensions from devices.css
	const frameDimensions: Record<'phone' | 'tablet', { width: number; height: number }> = {
		phone: { width: 428, height: 868 },
		tablet: { width: 560, height: 778 },
	};

	function computeFrameScale() {
		if (device === 'desktop') return 1;

		const frame = frameDimensions[device];
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const padding = 32;
		const frameScaleX = (vw - padding) / frame.width;
		const frameScaleY = (vh - padding) / frame.height;
		return Math.min(frameScaleX, frameScaleY);
	}

	const frameScale = computeFrameScale();
</script>

{#if device === 'desktop'}
	{@render children()}
{:else}
	<div class="device-wrapper">
		<div class="device {deviceClass}" style:transform="scale({frameScale})">
			<div class="device-frame">
				<div class="device-screen">
					{@render children()}
				</div>
			</div>
			<div class="device-stripe"></div>
			<div class="device-header"></div>
			<div class="device-sensors"></div>
			<div class="device-btns"></div>
			<div class="device-power"></div>
		</div>
	</div>
{/if}

<style>
	.device-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100dvh;
		width: 100%;
		background: #1a1a1a;
		overflow: hidden;
	}

	.device {
		transform-origin: center center;
	}

	.device-screen {
		overflow: hidden;
		position: relative;
	}
</style>
