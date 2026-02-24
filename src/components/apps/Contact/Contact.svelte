<script lang="ts">
	import { preferences } from '🍎/state/preferences.svelte.ts';
	import EmailIcon from '~icons/mdi/email-outline';
	import GithubIcon from '~icons/mdi/github';
	import LinkedInIcon from '~icons/mdi/linkedin';
	import SendIcon from '~icons/mdi/send';

	let name = $state('');
	let email = $state('');
	let subject = $state('');
	let message = $state('');
	let sent = $state(false);

	function handleSubmit(e: Event) {
		e.preventDefault();
		// Open mailto link as fallback
		const mailtoLink = `mailto:contact@wbonis.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${name} (${email})\n\n${message}`)}`;
		window.open(mailtoLink);
		sent = true;
		setTimeout(() => { sent = false; }, 3000);
	}

	function external(node: HTMLAnchorElement) {
		node.rel = 'noopener noreferrer';
		node.target = '_blank';
	}
</script>

<section class="container">
	<header class="titlebar app-window-drag-handle">
		<span>Contact</span>
	</header>

	<aside class:light={preferences.theme.scheme === 'light'}>
		<nav>
			<button class="subject-btn active" onclick={() => { subject = 'Job Opportunity'; }}>
				<EmailIcon /> Job Opportunity
			</button>
			<button class="subject-btn" onclick={() => { subject = 'Freelance Work'; }}>
				<EmailIcon /> Freelance Work
			</button>
			<button class="subject-btn" onclick={() => { subject = 'Just Saying Hi'; }}>
				<EmailIcon /> Just Saying Hi
			</button>

			<hr />

			<a href="https://github.com/WBonis" use:external>
				<GithubIcon /> GitHub
			</a>
			<a href="https://linkedin.com" use:external>
				<LinkedInIcon /> LinkedIn
			</a>
		</nav>
	</aside>

	<section class="content">
		{#if sent}
			<div class="sent-message">
				<SendIcon />
				<h2>Message prepared!</h2>
				<p>Your email client should have opened.</p>
			</div>
		{:else}
			<form onsubmit={handleSubmit}>
				<div class="field">
					<label for="name">Name</label>
					<input id="name" type="text" bind:value={name} placeholder="Your name" required />
				</div>
				<div class="field">
					<label for="email">Email</label>
					<input id="email" type="email" bind:value={email} placeholder="your@email.com" required />
				</div>
				<div class="field">
					<label for="subject">Subject</label>
					<input id="subject" type="text" bind:value={subject} placeholder="What's this about?" />
				</div>
				<div class="field">
					<label for="message">Message</label>
					<textarea id="message" bind:value={message} placeholder="Your message..." rows="5" required></textarea>
				</div>
				<button type="submit" class="send-btn">
					<SendIcon /> Send Message
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

			.subject-btn, a {
				display: flex;
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
			}
		}
	}

	.content {
		grid-area: 2 / 2 / span 1 / span 1;
		padding: 1.5rem;
		overflow-y: auto;
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
