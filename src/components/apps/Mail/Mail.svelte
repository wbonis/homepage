<script lang="ts">
	import { trackEvent } from '🍎/helpers/tracking';
	import { preferences } from '🍎/state/preferences.svelte.ts';
	import EmailIcon from '~icons/mdi/email-outline';
	import GithubIcon from '~icons/mdi/github';
	import LinkedInIcon from '~icons/mdi/linkedin';
	import SendIcon from '~icons/mdi/send';
	import AlertIcon from '~icons/mdi/alert-circle-outline';

	const TURNSTILE_SITE_KEY = '0x4AAAAAACkT4xd2e6qXbNEA';

	const { ios_mode = false }: { ios_mode?: boolean } = $props();

	let name = $state('');
	let email = $state('');
	let subject = $state('Jobangebot');
	let message = $state('');
	let sending = $state(false);
	let status = $state<'idle' | 'success' | 'error'>('idle');
	let errorMessage = $state('');
	let turnstileToken = $state('');
	let turnstileWidgetId: string | undefined;
	let turnstileContainer: HTMLDivElement | undefined;

	function loadTurnstile() {
		if (document.querySelector('script[src*="turnstile"]')) {
			renderWidget();
			return;
		}
		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad';
		script.async = true;
		(window as any).onTurnstileLoad = renderWidget;
		document.head.appendChild(script);
	}

	function renderWidget() {
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
		loadTurnstile();
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		trackEvent('Contact', 'form_submitted', subject);

		sending = true;
		status = 'idle';
		errorMessage = '';

		// Reset and await a fresh Turnstile token
		if ((window as any).turnstile && turnstileWidgetId !== undefined) {
			turnstileToken = '';
			(window as any).turnstile.reset(turnstileWidgetId);
			try {
				await new Promise<void>((resolve, reject) => {
					const timeout = setTimeout(() => reject(new Error('timeout')), 10_000);
					const check = () => {
						if (turnstileToken) {
							clearTimeout(timeout);
							resolve();
						} else {
							requestAnimationFrame(check);
						}
					};
					requestAnimationFrame(check);
				});
			} catch {
				// Token did not arrive in time
			}
		}

		if (!turnstileToken) {
			status = 'error';
			errorMessage = 'Security verification failed. Please try again.';
			sending = false;
			return;
		}

		const payload = { name, email, subject, message, 'cf-turnstile-response': turnstileToken };

		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || 'Failed to send message.');
			}

			status = 'success';
			name = '';
			email = '';
			subject = '';
			message = '';
		} catch (err) {
			status = 'error';
			errorMessage = err instanceof Error ? err.message : 'Something went wrong.';
		} finally {
			sending = false;
			// Reset Turnstile for next submission
			if ((window as any).turnstile && turnstileWidgetId !== undefined) {
				turnstileToken = '';
				(window as any).turnstile.reset(turnstileWidgetId);
			}
		}
	}

	function external(node: HTMLAnchorElement) {
		node.rel = 'noopener noreferrer';
		node.target = '_blank';
	}
</script>

<section class="container" class:ios={ios_mode}>
	{#if !ios_mode}
		<header class="titlebar app-window-drag-handle">
			<span>Mail</span>
		</header>

		<aside class:light={preferences.theme.scheme === 'light'}>
			<nav>
				<button class="subject-btn" class:active={subject === 'Jobangebot'} aria-current={subject === 'Jobangebot' ? 'true' : undefined} onclick={() => { subject = 'Jobangebot'; trackEvent('Contact', 'subject_selected', 'Jobangebot'); }}>
					<EmailIcon /> Jobangebot
				</button>
				<button class="subject-btn" class:active={subject === 'Freelance-Arbeit'} aria-current={subject === 'Freelance-Arbeit' ? 'true' : undefined} onclick={() => { subject = 'Freelance-Arbeit'; trackEvent('Contact', 'subject_selected', 'Freelance-Arbeit'); }}>
					<EmailIcon /> Freelance-Arbeit
				</button>
				<button class="subject-btn" class:active={subject === 'Einfach Hallo sagen'} aria-current={subject === 'Einfach Hallo sagen' ? 'true' : undefined} onclick={() => { subject = 'Einfach Hallo sagen'; trackEvent('Contact', 'subject_selected', 'Einfach Hallo sagen'); }}>
					<EmailIcon /> Einfach Hallo sagen
				</button>

				<hr />

				<a href="https://github.com/WBonis" use:external>
					<GithubIcon /> GitHub
				</a>
				<a href="https://linkedin.com/in/wbonis" use:external>
					<LinkedInIcon /> LinkedIn
				</a>
			</nav>
		</aside>
	{:else}
		<div class="ios-subject-bar">
			<button class="ios-subject-btn" onclick={() => { subject = 'Jobangebot'; }}>Job</button>
			<button class="ios-subject-btn" onclick={() => { subject = 'Freelance-Arbeit'; }}>Freelance</button>
			<button class="ios-subject-btn" onclick={() => { subject = 'Einfach Hallo sagen'; }}>Hallo</button>
		</div>
	{/if}

	<section class="content">
		{#if status === 'success'}
			<div class="sent-message">
				<SendIcon />
				<h2>Nachricht gesendet!</h2>
				<p>Danke für deine Nachricht. Ich melde mich bald.</p>
				<button class="send-btn" onclick={() => { status = 'idle'; }}>
					Weitere senden
				</button>
			</div>
		{:else}
			<form onsubmit={handleSubmit}>
				{#if status === 'error'}
					<div class="error-message">
						<AlertIcon /> {errorMessage}
					</div>
				{/if}
				<div class="field">
					<label for="name">Name</label>
					<input id="name" type="text" bind:value={name} placeholder="Dein Name" required disabled={sending} maxlength="100" />
				</div>
				<div class="field">
					<label for="email">E-Mail</label>
					<input id="email" type="email" bind:value={email} placeholder="deine@email.de" required disabled={sending} maxlength="254" />
				</div>
				<div class="field">
					<label for="subject">Betreff</label>
					<input id="subject" type="text" bind:value={subject} placeholder="Worum geht es?" disabled={sending} maxlength="200" />
				</div>
				<div class="field">
					<label for="message">Nachricht</label>
					<textarea id="message" bind:value={message} placeholder="Deine Nachricht..." rows="5" required disabled={sending} maxlength="5000"></textarea>
				</div>
				<div bind:this={turnstileContainer}></div>
				<button type="submit" class="send-btn" disabled={sending}>
					{#if sending}
						Wird gesendet…
					{:else}
						<SendIcon /> Nachricht senden
					{/if}
				</button>
			</form>
		{/if}
	</section>
</section>

<style>
	.container {
		--color: var(--system-color-light-hsl);

		display: grid;
		grid-template-columns: 12rem 1fr;
		grid-template-rows: 3rem 1fr;

		border-radius: inherit;

		background-image: linear-gradient(
			to right,
			hsla(var(--color), 0.7) 12rem,
			hsla(var(--color), 1) 12rem 100%
		);

		color: var(--system-color-dark);
	}

	.container.ios {
		display: flex;
		flex-direction: column;
		background-image: none;
		background-color: hsla(var(--color), 1);
		height: 100%;
	}

	.titlebar {
		grid-area: 1 / 1 / span 1 / span 2;

		display: flex;
		justify-content: center;

		z-index: 1;

		padding: 0.9rem 1rem;
		width: 100%;

		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
		user-select: none;

		span {
			color: hsla(var(--system-color-dark-hsl), 0.8);
			font-weight: 500;
			font-size: 0.9rem;
			letter-spacing: 0.5px;
		}
	}

	aside {
		grid-area: 1 / 1 / span 2 / span 1;

		transform: translateZ(0);

		height: calc(100% - 2.7px);
		width: calc(12rem - 2.27px);

		margin: 1.8px 0 0px 1.8px;

		border-top-left-radius: 0.5rem;
		border-bottom-left-radius: inherit;

		&::before {
			content: '';
			width: inherit;
			height: inherit;
			border-radius: inherit;
			position: fixed;
			left: 0;
			top: 0;
			z-index: -1;
			backdrop-filter: blur(12px);
		}

		&.light {
			height: calc(100% - 3px);
			width: calc(12rem - 2.5px);
			margin: 1.7px 0 0px 1.7px;
			border-top-left-radius: 0.5rem;
			border-bottom-left-radius: 0.5rem;
		}

		nav {
			display: flex;
			flex-direction: column;
			gap: 0.2rem;
			margin: 4rem 0.6rem;

			hr {
				display: block;
				width: 100%;
				height: 1px;
				background-color: hsla(var(--system-color-dark-hsl), 0.2);
				border: none;
			}

			:global(svg) {
				flex-shrink: 0;
				width: 1.2rem;
				height: 1.2rem;
			}

			.subject-btn, a {
				display: flex;
				justify-content: flex-start;
				gap: 0.4rem;
				align-items: center;
				color: hsla(var(--system-color-dark-hsl), 0.9);
				text-decoration: none;
				font-weight: 400;
				font-size: 0.85rem;
				padding: 0.5rem 0.5rem;
				border-radius: 0.4rem;
				transition: background-color 100ms ease;
				background: none;
				border: none;
				cursor: pointer;
				text-align: left;
				width: 100%;

				&:hover {
					background-color: hsla(var(--system-color-dark-hsl), 0.2);
				}

				&.active {
					background-color: hsla(var(--system-color-primary-hsl), 0.15);
					color: var(--system-color-primary);
					font-weight: 500;
				}
			}
		}
	}

	.ios-subject-bar {
		display: flex;
		gap: 8px;
		padding: 8px 12px;
		flex-shrink: 0;
		border-bottom: 0.5px solid hsla(var(--system-color-dark-hsl), 0.15);
	}

	.ios-subject-btn {
		flex: 1;
		padding: 6px 8px;
		border-radius: 8px;
		border: none;
		background: hsla(var(--system-color-primary-hsl), 0.12);
		color: var(--system-color-primary);
		font-size: 13px;
		font-weight: 500;
		font-family: inherit;
		cursor: pointer;
	}

	.content {
		grid-area: 2 / 2 / span 1 / span 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.container.ios .content {
		grid-area: unset;
		flex: 1;
		padding: 1rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;

		label {
			font-size: 0.8rem;
			font-weight: 500;
			opacity: 0.7;
		}

		input, textarea {
			padding: 0.6rem 0.8rem;
			border-radius: 0.5rem;
			border: 1px solid hsla(var(--system-color-dark-hsl), 0.15);
			background-color: hsla(var(--system-color-dark-hsl), 0.05);
			color: var(--system-color-dark);
			font-size: 0.9rem;
			font-family: inherit;
			outline: none;
			transition: border-color 150ms ease;

			&:focus {
				border-color: var(--system-color-primary);
			}
		}

		textarea {
			resize: vertical;
		}
	}

	.send-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.7rem 1.5rem;
		border-radius: 0.5rem;
		border: none;
		background-color: var(--system-color-primary);
		color: white;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 150ms ease;
		align-self: flex-end;

		&:hover {
			opacity: 0.85;
		}
	}

	.error-message {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.7rem 1rem;
		border-radius: 0.5rem;
		background-color: hsla(0, 70%, 50%, 0.1);
		color: hsl(0, 70%, 45%);
		font-size: 0.85rem;
		font-weight: 500;

		:global(svg) {
			flex-shrink: 0;
			font-size: 1.1rem;
		}
	}

	.send-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.sent-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		gap: 1rem;
		text-align: center;

		:global(svg) {
			font-size: 3rem;
			color: var(--system-color-primary);
		}

		h2 {
			font-size: 1.5rem;
		}

		p {
			opacity: 0.6;
		}
	}
</style>
