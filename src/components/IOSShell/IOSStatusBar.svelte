<script lang="ts">
	import { preferences } from '🍎/state/preferences.svelte.ts';

	let time = $state(
		new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
	);

	setInterval(() => {
		time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
	}, 30_000);

	const isDark = $derived(preferences.theme.scheme === 'dark');
</script>

<div class="ios-status-bar" class:dark={isDark}>
	<span class="time">{time}</span>
	<div class="notch"></div>
	<div class="icons">
		<svg class="signal" viewBox="0 0 17 12" fill="currentColor">
			<rect x="0" y="9" width="3" height="3" rx="0.5" />
			<rect x="4.5" y="6" width="3" height="6" rx="0.5" />
			<rect x="9" y="3" width="3" height="9" rx="0.5" />
			<rect x="13.5" y="0" width="3" height="12" rx="0.5" />
		</svg>
		<svg class="wifi" viewBox="0 0 16 12" fill="currentColor">
			<path d="M8 10.2a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8zM8 6.4c2.1 0 4 .9 5.3 2.3l-1.4 1.4C10.9 9 9.5 8.4 8 8.4s-2.9.6-3.9 1.7L2.7 8.7C4 7.3 5.9 6.4 8 6.4zM8 2.5c3.2 0 6.1 1.3 8 3.5l-1.4 1.4C13 5.6 10.6 4.5 8 4.5S3 5.6 1.4 7.4L0 6c1.9-2.2 4.8-3.5 8-3.5z" />
		</svg>
		<svg class="battery" viewBox="0 0 25 12" fill="currentColor">
			<rect x="0" y="0" width="22" height="12" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="1" />
			<rect x="2" y="2" width="18" height="8" rx="1" />
			<rect x="23" y="3.5" width="2" height="5" rx="1" />
		</svg>
	</div>
</div>

<style>
	.ios-status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 44px;
		padding: 0 20px;
		color: #000;
		font-size: 14px;
		font-weight: 600;
		flex-shrink: 0;
		position: relative;
		z-index: 10;
	}

	.ios-status-bar.dark {
		color: #fff;
	}

	.time {
		width: 54px;
	}

	.notch {
		width: 120px;
		height: 32px;
		background: #000;
		border-radius: 0 0 18px 18px;
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
	}

	.icons {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.signal {
		width: 17px;
		height: 12px;
	}

	.wifi {
		width: 16px;
		height: 12px;
	}

	.battery {
		width: 25px;
		height: 12px;
	}
</style>
