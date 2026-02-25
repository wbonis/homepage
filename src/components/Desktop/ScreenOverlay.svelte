<script lang="ts">
	import { elevation } from '🍎/actions';
	import { screen_overlay } from '🍎/state/screen-overlay.svelte';

	let clock = $state(get_time());

	$effect(() => {
		if (screen_overlay.mode !== 'lock') return;
		clock = get_time();
		const interval = setInterval(() => (clock = get_time()), 1000);
		return () => clearInterval(interval);
	});

	function get_time() {
		const now = new Date();
		return {
			time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			date: now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }),
		};
	}

	function get_about_info() {
		const ua = navigator.userAgent;
		let browser = 'Unknown Browser';
		if (ua.includes('Firefox')) browser = 'Firefox';
		else if (ua.includes('Edg')) browser = 'Microsoft Edge';
		else if (ua.includes('Chrome')) browser = 'Chrome';
		else if (ua.includes('Safari')) browser = 'Safari';

		let os = 'Unknown OS';
		if (ua.includes('Mac')) os = 'macOS';
		else if (ua.includes('Windows')) os = 'Windows';
		else if (ua.includes('Linux')) os = 'Linux';
		else if (ua.includes('Android')) os = 'Android';
		else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

		return {
			browser,
			os,
			screen: `${window.screen.width} x ${window.screen.height}`,
			viewport: `${window.innerWidth} x ${window.innerHeight}`,
			pixel_ratio: window.devicePixelRatio,
		};
	}

	function dismiss() {
		screen_overlay.mode = 'none';
	}
</script>

{#if screen_overlay.mode === 'sleep'}
	<div class="overlay sleep" use:elevation={'screen-overlay'} onclick={dismiss} role="button" tabindex="0" onkeydown={dismiss}>
		<span class="hint">Click anywhere to wake</span>
	</div>
{/if}

{#if screen_overlay.mode === 'lock'}
	<div class="overlay lock" use:elevation={'screen-overlay'} onclick={dismiss} role="button" tabindex="0" onkeydown={dismiss}>
		<div class="lock-content">
			<div class="lock-time">{clock.time}</div>
			<div class="lock-date">{clock.date}</div>
			<span class="hint">Click anywhere to unlock</span>
		</div>
	</div>
{/if}

{#if screen_overlay.mode === 'shutdown'}
	<div class="overlay shutdown" use:elevation={'screen-overlay'} onclick={() => location.reload()} role="button" tabindex="0" onkeydown={() => location.reload()}>
		<span class="hint">Click anywhere to start</span>
	</div>
{/if}

{#if screen_overlay.mode === 'about'}
	{@const info = get_about_info()}
	<div class="overlay about-backdrop" use:elevation={'screen-overlay'} onclick={dismiss} role="button" tabindex="0" onkeydown={dismiss}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div class="about-dialog" onclick={(e) => e.stopPropagation()} role="dialog">
			<div class="about-header">
				<img src="/app-icons/finder/256.webp" alt="macOS" class="about-icon" />
				<h1>macOS Web</h1>
				<p class="about-subtitle">Portfolio of Wolfgang Bonis</p>
			</div>
			<div class="about-info">
				<div class="info-row"><span class="info-label">Browser</span><span>{info.browser}</span></div>
				<div class="info-row"><span class="info-label">OS</span><span>{info.os}</span></div>
				<div class="info-row"><span class="info-label">Screen</span><span>{info.screen}</span></div>
				<div class="info-row"><span class="info-label">Viewport</span><span>{info.viewport}</span></div>
				<div class="info-row"><span class="info-label">Pixel Ratio</span><span>{info.pixel_ratio}x</span></div>
			</div>
			<button class="about-close" onclick={dismiss}>OK</button>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.sleep,
	.shutdown {
		background-color: #000;
		flex-direction: column;
	}

	.lock {
		background-color: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(30px);
	}

	.hint {
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.85rem;
		position: absolute;
		bottom: 10%;
	}

	.lock-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		color: white;
	}

	.lock-time {
		font-size: 5rem;
		font-weight: 200;
		letter-spacing: 0.05em;
		line-height: 1;
	}

	.lock-date {
		font-size: 1.25rem;
		font-weight: 300;
		opacity: 0.8;
	}

	.about-backdrop {
		background-color: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(10px);
		cursor: default;
	}

	.about-dialog {
		background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
		border-radius: 12px;
		padding: 2rem 2.5rem;
		min-width: 320px;
		max-width: 400px;
		color: white;
		text-align: center;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		cursor: auto;
	}

	.about-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.about-icon {
		width: 80px;
		height: 80px;
		margin-bottom: 0.5rem;
	}

	.about-header h1 {
		font-size: 1.5rem;
		font-weight: 500;
		margin: 0;
	}

	.about-subtitle {
		font-size: 0.85rem;
		opacity: 0.6;
		margin: 0;
	}

	.about-info {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		text-align: left;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		padding: 0.25rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.info-label {
		opacity: 0.5;
	}

	.about-close {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		border-radius: 6px;
		color: white;
		padding: 0.4rem 2rem;
		font-size: 0.85rem;
		cursor: pointer;
		transition: background 150ms;

		&:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}
</style>
