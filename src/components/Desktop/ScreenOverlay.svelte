<script lang="ts">
	import { elevation } from '🍎/actions';
	import { screen_overlay } from '🍎/state/screen-overlay.svelte';

	let clock = $state(get_time());
	let corrupt_canvas: HTMLCanvasElement | undefined = $state();

	$effect(() => {
		if (screen_overlay.mode !== 'lock') return;
		clock = get_time();
		const interval = setInterval(() => (clock = get_time()), 1000);
		return () => clearInterval(interval);
	});

	$effect(() => {
		if (screen_overlay.mode !== 'vram-corrupt' || !corrupt_canvas) return;

		const canvas = corrupt_canvas;
		const ctx = canvas.getContext('2d')!;
		const w = (canvas.width = window.innerWidth);
		const h = (canvas.height = window.innerHeight);
		let frame_id: number;
		let start = performance.now();

		// Easing: slow start, accelerating toward the end
		function ease_in_quad(t: number) {
			return t * t;
		}

		// Intermittent flicker — artifacts appear/disappear randomly in early phases
		function should_flicker(intensity: number): boolean {
			if (intensity > 0.5) return true; // always visible past halfway
			// Early on, only show artifacts ~20-60% of frames
			return Math.random() < 0.2 + intensity * 0.8;
		}

		function draw_corruption(time: number) {
			const elapsed = time - start;
			const raw = Math.min(elapsed / 8500, 1); // ramp over 8.5s
			const intensity = ease_in_quad(raw);

			ctx.clearRect(0, 0, w, h);

			if (!should_flicker(raw)) {
				frame_id = requestAnimationFrame(draw_corruption);
				return;
			}

			// Displaced horizontal bands — like VRAM row offset corruption
			const band_count = Math.floor(1 + intensity * 10);
			for (let i = 0; i < band_count; i++) {
				const y = Math.random() * h;
				const band_h = 1 + Math.random() * (4 + intensity * 30);
				const offset_x = (Math.random() - 0.5) * (5 + intensity * 150);

				ctx.save();
				ctx.globalAlpha = 0.08 + intensity * 0.45;
				ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, ${20 + Math.random() * 25}%)`;
				ctx.fillRect(offset_x, y, w, band_h);
				ctx.restore();
			}

			// Random colored block artifacts — corrupted VRAM cells
			if (intensity > 0.05) {
				const block_count = Math.floor(intensity * 35);
				for (let i = 0; i < block_count; i++) {
					const bx = Math.random() * w;
					const by = Math.random() * h;
					const bw = 2 + Math.random() * (15 + intensity * 60);
					const bh = 1 + Math.random() * (6 + intensity * 14);

					ctx.globalAlpha = 0.05 + Math.random() * intensity * 0.4;
					const colors = ['#ff0050', '#00ff88', '#0088ff', '#ff00ff', '#ffff00', '#00ffff', '#ffffff', '#000000'];
					ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
					ctx.fillRect(bx, by, bw, bh);
				}
			}

			// Subtle scanline tears
			if (intensity > 0.1) {
				const tear_count = Math.floor(1 + intensity * 5);
				for (let i = 0; i < tear_count; i++) {
					const y = Math.random() * h;
					ctx.globalAlpha = 0.1 + intensity * 0.35;
					ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
					ctx.fillRect(0, y, w, 1 + Math.random() * (1 + intensity));
				}
			}

			// RGB channel split blocks — shifted color planes
			if (intensity > 0.35) {
				const split_count = Math.floor((intensity - 0.35) * 10);
				for (let i = 0; i < split_count; i++) {
					const sx = Math.random() * w;
					const sy = Math.random() * h;
					const sw = 15 + Math.random() * 80;
					const sh = 8 + Math.random() * 40;

					ctx.globalAlpha = 0.06 + intensity * 0.15;
					ctx.globalCompositeOperation = 'screen';
					ctx.fillStyle = '#ff0000';
					ctx.fillRect(sx + 2 + intensity * 5, sy, sw, sh);

					ctx.fillStyle = '#00ffff';
					ctx.fillRect(sx - 2 - intensity * 5, sy, sw, sh);

					ctx.globalCompositeOperation = 'source-over';
				}
			}

			// Static noise — only in final escalation
			if (intensity > 0.7) {
				const noise_density = (intensity - 0.7) * 250;
				for (let i = 0; i < noise_density; i++) {
					const nx = Math.random() * w;
					const ny = Math.random() * h;
					ctx.globalAlpha = Math.random() * 0.5;
					ctx.fillStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`;
					ctx.fillRect(nx, ny, 1 + Math.random() * 2, 1 + Math.random() * 2);
				}
			}

			ctx.globalAlpha = 1;
			frame_id = requestAnimationFrame(draw_corruption);
		}

		frame_id = requestAnimationFrame(draw_corruption);
		return () => cancelAnimationFrame(frame_id);
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

	let bug_report_text = $state('');
	let bug_report_email = $state('');
	let bug_sending = $state(false);
	let bug_status = $state<'idle' | 'success' | 'error'>('idle');
	let bug_error = $state('');
	let turnstileToken = $state('');
	let turnstileWidgetId: string | undefined;
	let turnstileContainer: HTMLDivElement | undefined;

	const TURNSTILE_SITE_KEY = '0x4AAAAAACkT4xd2e6qXbNEA';

	function loadTurnstile() {
		if (document.querySelector('script[src*="turnstile"]')) {
			renderTurnstileWidget();
			return;
		}
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
		script.async = true;
		(window as any).onTurnstileLoad = renderTurnstileWidget;
		document.head.appendChild(script);
	}

	function renderTurnstileWidget() {
		if (!turnstileContainer || !(window as any).turnstile) return;
		if (turnstileWidgetId !== undefined) {
			(window as any).turnstile.reset(turnstileWidgetId);
			return;
		}
		turnstileWidgetId = (window as any).turnstile.render(turnstileContainer, {
			sitekey: TURNSTILE_SITE_KEY,
			size: 'invisible',
			callback: (token: string) => { turnstileToken = token; },
			'error-callback': () => { turnstileToken = ''; },
			'expired-callback': () => { turnstileToken = ''; },
		});
	}

	$effect(() => {
		if (screen_overlay.mode === 'bug-report') loadTurnstile();
	});

	async function submit_bug_report() {
		bug_sending = true;
		bug_status = 'idle';
		bug_error = '';

		// Reset and await a fresh Turnstile token
		if ((window as any).turnstile && turnstileWidgetId !== undefined) {
			turnstileToken = '';
			(window as any).turnstile.reset(turnstileWidgetId);
			const start = Date.now();
			while (!turnstileToken && Date.now() - start < 10_000) {
				await new Promise((r) => setTimeout(r, 100));
			}
		}

		if (!turnstileToken) {
			bug_status = 'error';
			bug_error = 'Security verification failed. Please try again.';
			bug_sending = false;
			return;
		}

		const system_info = [
			`Browser: ${navigator.userAgent}`,
			`Viewport: ${window.innerWidth}x${window.innerHeight}`,
			`Screen: ${window.screen.width}x${window.screen.height}`,
			`Pixel Ratio: ${window.devicePixelRatio}x`,
		].join('\n');

		const message = [
			bug_report_text.trim() || '(Keine Beschreibung)',
			'',
			'--- System Info ---',
			system_info,
		].join('\n');

		const payload = {
			name: bug_report_email.trim() || 'Anonym',
			email: bug_report_email.trim() || 'noreply@bonis.de',
			subject: 'Bug Report: macOS Web Kernel Panic',
			message,
			'cf-turnstile-response': turnstileToken,
		};

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Senden fehlgeschlagen.');
			}

			bug_status = 'success';
		} catch (err) {
			bug_status = 'error';
			bug_error = err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.';
		} finally {
			bug_sending = false;
			if ((window as any).turnstile && turnstileWidgetId !== undefined) {
				turnstileToken = '';
				(window as any).turnstile.reset(turnstileWidgetId);
			}
		}
	}

	function reset_bug_form() {
		bug_report_text = '';
		bug_report_email = '';
		bug_sending = false;
		bug_status = 'idle';
		bug_error = '';
	}

	function close_bug_report() {
		screen_overlay.mode = 'none';
		reset_bug_form();
	}

	function dismiss() {
		screen_overlay.mode = 'none';
	}

	function dismiss_on_key(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			dismiss();
		}
	}
</script>

{#if screen_overlay.mode === 'sleep'}
	<div class="overlay sleep" use:elevation={'screen-overlay'} onclick={dismiss} role="button" tabindex="0" onkeydown={dismiss_on_key} aria-label="Click or press Enter to wake">
		<span class="hint">Click anywhere to wake</span>
	</div>
{/if}

{#if screen_overlay.mode === 'lock'}
	<div class="overlay lock" use:elevation={'screen-overlay'} onclick={dismiss} role="button" tabindex="0" onkeydown={dismiss_on_key} aria-label="Click or press Enter to unlock">
		<div class="lock-content">
			<div class="lock-time">{clock.time}</div>
			<div class="lock-date">{clock.date}</div>
			<span class="hint">Click anywhere to unlock</span>
		</div>
	</div>
{/if}

{#if screen_overlay.mode === 'shutdown'}
	<div class="overlay shutdown" use:elevation={'screen-overlay'} onclick={() => location.reload()} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') location.reload(); }} aria-label="Click or press Enter to restart">
		<span class="hint">Click anywhere to start</span>
	</div>
{/if}

{#if screen_overlay.mode === 'vram-corrupt'}
	<canvas class="corrupt-canvas" bind:this={corrupt_canvas} use:elevation={'screen-overlay'}></canvas>
{/if}

{#if screen_overlay.mode === 'kernel-panic'}
	<div class="overlay kernel-panic" use:elevation={'screen-overlay'} onclick={() => (screen_overlay.mode = 'bug-report')} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') screen_overlay.mode = 'bug-report'; }} aria-label="Click or press Enter to report bug">
		<div class="panic-content">
			<div class="panic-icon">⚠</div>
			<p class="panic-main">You need to restart your computer. Hold down the Power button for several seconds or press the Restart button.</p>
			<div class="panic-translations">
				<p>Vous devez redémarrer votre ordinateur. Maintenez la touche d'alimentation enfoncée pendant plusieurs secondes ou appuyez sur le bouton de redémarrage.</p>
				<p>Sie müssen den Computer neu starten. Halten Sie den Ein-/Ausschalter einige Sekunden gedrückt oder klicken Sie auf „Neustart".</p>
				<p>コンピュータを再起動する必要があります。パワーボタンを数秒間押し続けるか、「再起動」ボタンを押してください。</p>
			</div>
		</div>
		<span class="hint">Click anywhere to restart</span>
	</div>
{/if}

{#if screen_overlay.mode === 'bug-report'}
	<div class="overlay bug-report-backdrop" use:elevation={'screen-overlay'}>
		<div class="bug-report-dialog" role="dialog" aria-labelledby="bug-report-title">
			<div class="bug-report-header">
				<div class="bug-report-icon">🪲</div>
				<h1 id="bug-report-title">Problem Report</h1>
				<p class="bug-report-subtitle">macOS Web ist unerwartet beendet worden. Möchten Sie einen Fehlerbericht senden?</p>
			</div>

			{#if bug_status === 'success'}
				<div class="bug-report-success">
					<div class="success-icon">✓</div>
					<h2>Bericht gesendet!</h2>
					<p>Danke für das Feedback. Der Bug wird untersucht.</p>
					<button class="bug-btn primary" onclick={close_bug_report}>Schließen</button>
				</div>
			{:else}
				<form class="bug-report-form" onsubmit={(e) => { e.preventDefault(); submit_bug_report(); }}>
					{#if bug_status === 'error'}
						<div class="bug-report-error">{bug_error}</div>
					{/if}
					<label>
						<span>Was haben Sie getan, als das Problem auftrat?</span>
						<textarea bind:value={bug_report_text} rows="4" placeholder="Beschreiben Sie das Problem..." disabled={bug_sending}></textarea>
					</label>
					<label>
						<span>E-Mail (optional, für Rückfragen)</span>
						<input type="email" bind:value={bug_report_email} placeholder="ihre@email.de" disabled={bug_sending} />
					</label>
					<div bind:this={turnstileContainer}></div>
					<div class="bug-report-actions">
						<button type="button" class="bug-btn secondary" onclick={close_bug_report} disabled={bug_sending}>Ignorieren</button>
						<button type="submit" class="bug-btn primary" disabled={bug_sending}>
							{bug_sending ? 'Wird gesendet…' : 'Bug melden'}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

{#if screen_overlay.mode === 'about'}
	{@const info = get_about_info()}
	<div class="overlay about-backdrop" use:elevation={'screen-overlay'} onclick={dismiss} role="button" tabindex="0" onkeydown={dismiss_on_key}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_interactive_supports_focus -->
		<div class="about-dialog" onclick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="about-dialog-title">
			<div class="about-header">
				<img src="/app-icons/finder/256.webp" alt="macOS" class="about-icon" />
				<h1 id="about-dialog-title">macOS Web</h1>
				<p class="about-version">Version {__APP_VERSION__}</p>
				<p class="about-subtitle">Portfolio of Wim Bonis</p>
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

	.about-version {
		font-size: 0.8rem;
		opacity: 0.4;
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

	/* Bug Report Dialog */
	.bug-report-backdrop {
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(12px);
		cursor: default;
		animation: panic-fade-in 400ms ease;
	}

	.bug-report-dialog {
		background: linear-gradient(135deg, #f5f5f7 0%, #e8e8ed 100%);
		border-radius: 14px;
		padding: 2rem 2.5rem;
		min-width: 380px;
		max-width: 460px;
		color: #1d1d1f;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
	}

	:global(body.dark) .bug-report-dialog {
		background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
		color: #f5f5f7;
	}

	.bug-report-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 1.5rem;
		text-align: center;
	}

	.bug-report-icon {
		font-size: 3rem;
		line-height: 1;
		margin-bottom: 0.25rem;
	}

	.bug-report-header h1 {
		font-size: 1.2rem;
		font-weight: 600;
		margin: 0;
	}

	.bug-report-subtitle {
		font-size: 0.82rem;
		opacity: 0.6;
		margin: 0;
		line-height: 1.4;
	}

	.bug-report-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		label {
			display: flex;
			flex-direction: column;
			gap: 0.3rem;

			span {
				font-size: 0.78rem;
				font-weight: 500;
				opacity: 0.7;
			}
		}

		textarea,
		input {
			background: rgba(0, 0, 0, 0.05);
			border: 1px solid rgba(0, 0, 0, 0.12);
			border-radius: 8px;
			padding: 0.6rem 0.75rem;
			font-size: 0.85rem;
			font-family: inherit;
			color: inherit;
			resize: vertical;
			outline: none;
			transition: border-color 150ms;

			&:focus {
				border-color: var(--system-color-primary);
			}
		}
	}

	:global(body.dark) .bug-report-form textarea,
	:global(body.dark) .bug-report-form input {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.bug-report-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 0.5rem;
	}

	.bug-btn {
		border: none;
		border-radius: 6px;
		padding: 0.45rem 1.2rem;
		font-size: 0.82rem;
		font-family: inherit;
		cursor: pointer;
		font-weight: 500;
		transition: background 150ms, opacity 150ms;
	}

	.bug-btn.secondary {
		background: rgba(0, 0, 0, 0.08);
		color: inherit;

		&:hover {
			background: rgba(0, 0, 0, 0.14);
		}
	}

	:global(body.dark) .bug-btn.secondary {
		background: rgba(255, 255, 255, 0.1);

		&:hover {
			background: rgba(255, 255, 255, 0.18);
		}
	}

	.bug-btn.primary {
		background: var(--system-color-primary);
		color: white;

		&:hover {
			opacity: 0.85;
		}
	}

	.bug-report-success {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1.5rem 0;
		text-align: center;

		h2 {
			font-size: 1.1rem;
			font-weight: 600;
			margin: 0;
		}

		p {
			font-size: 0.82rem;
			opacity: 0.6;
			margin: 0;
		}

		.bug-btn {
			margin-top: 0.75rem;
		}
	}

	.success-icon {
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		background: hsl(130, 50%, 45%);
		color: white;
		font-size: 1.3rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 0.25rem;
	}

	.bug-report-error {
		padding: 0.6rem 0.75rem;
		border-radius: 8px;
		background: hsla(0, 70%, 50%, 0.1);
		color: hsl(0, 70%, 45%);
		font-size: 0.8rem;
		font-weight: 500;
	}

	/* VRAM Corruption Canvas */
	.corrupt-canvas {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	/* Kernel Panic */
	.kernel-panic {
		background-color: #2a2a2a;
		flex-direction: column;
		cursor: pointer;
		animation: panic-fade-in 500ms ease;
	}

	.panic-content {
		max-width: 520px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.panic-icon {
		font-size: 4rem;
		line-height: 1;
		opacity: 0.9;
	}

	.panic-main {
		color: white;
		font-size: 1.25rem;
		font-weight: 400;
		line-height: 1.5;
		margin: 0;
	}

	.panic-translations {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		p {
			color: rgba(255, 255, 255, 0.5);
			font-size: 0.85rem;
			line-height: 1.5;
			margin: 0;
		}
	}

	@keyframes panic-fade-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Glitch effect — applied to body via :global */
	:global(body.glitch-active) {
		animation: glitch-shake 200ms infinite;
	}

	:global(body.glitch-active)::after {
		content: '';
		position: fixed;
		inset: 0;
		z-index: 99999;
		pointer-events: none;
		animation: glitch-flash 300ms steps(1) infinite;
		mix-blend-mode: screen;
	}

	@keyframes glitch-shake {
		0% { transform: translate(0); }
		20% { transform: translate(-1.5px, 1px); }
		40% { transform: translate(1.5px, -0.5px); }
		60% { transform: translate(-1px, -1.5px); }
		80% { transform: translate(1px, 1.5px); }
		100% { transform: translate(0); }
	}

	@keyframes glitch-flash {
		0% { background: transparent; }
		12% { background: rgba(255, 0, 80, 0.04); }
		24% { background: transparent; }
		40% { background: rgba(0, 255, 200, 0.03); }
		52% { background: transparent; }
		65% { background: rgba(255, 255, 255, 0.06); }
		72% { background: transparent; }
		85% { background: rgba(0, 100, 255, 0.04); }
		100% { background: transparent; }
	}
</style>
