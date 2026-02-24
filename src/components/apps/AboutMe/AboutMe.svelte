<script lang="ts">
	import { preferences } from '🍎/state/preferences.svelte.ts';
	import GithubIcon from '~icons/mdi/github';
	import LinkedInIcon from '~icons/mdi/linkedin';
	import EmailIcon from '~icons/mdi/email-outline';
	import WebIcon from '~icons/mdi/web';
	import CodeIcon from '~icons/mdi/code-braces';

	function external(node: HTMLAnchorElement) {
		node.rel = 'noopener noreferrer';
		node.target = '_blank';
	}
</script>

<section class="container">
	<header class="titlebar app-window-drag-handle">
		<span>About Me</span>
	</header>

	<aside class:light={preferences.theme.scheme === 'light'}>
		<nav>
			<a href="#about" onclick={(e) => e.preventDefault()}>
				<CodeIcon /> About
			</a>
			<a href="#skills" onclick={(e) => e.preventDefault()}>
				<WebIcon /> Skills
			</a>

			<hr />

			<a href="https://github.com/WBonis" use:external>
				<GithubIcon /> GitHub
			</a>
			<a href="https://linkedin.com" use:external>
				<LinkedInIcon /> LinkedIn
			</a>
			<a href="mailto:contact@wbonis.dev" use:external>
				<EmailIcon /> Email
			</a>
		</nav>
	</aside>

	<section class="content">
		<div class="avatar">
			<span class="avatar-initials">WB</span>
		</div>

		<br />

		<h1>WBonis</h1>
		<h2>System Architekt</h2>

		<br />

		<div class="skills">
			<span class="skill-tag">System Architecture</span>
			<span class="skill-tag">Cloud Infrastructure</span>
			<span class="skill-tag">DevOps</span>
			<span class="skill-tag">Backend Development</span>
			<span class="skill-tag">Microservices</span>
			<span class="skill-tag">Security</span>
			<span class="skill-tag">Linux</span>
			<span class="skill-tag">Docker</span>
			<span class="skill-tag">Kubernetes</span>
		</div>

		<br />

		<p>
			Experienced System Architect with a passion for designing scalable, secure, and efficient
			systems. Specializing in cloud infrastructure, distributed systems, and modern development
			workflows.
		</p>

		<br />

		<p>
			Always exploring new technologies and pushing the boundaries of what's possible in system
			design and automation.
		</p>
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

		transition: --color 200ms ease-in;

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

			a {
				display: flex;
				gap: 0.4rem;
				align-items: center;

				color: hsla(var(--system-color-dark-hsl), 0.9);
				text-decoration: none;
				font-weight: 400;

				padding: 0.5rem 0.5rem;

				border-radius: 0.4rem;

				transition: background-color 100ms ease;

				&:hover {
					background-color: hsla(var(--system-color-dark-hsl), 0.2);
				}
			}
		}
	}

	.content {
		grid-area: 2 / 2 / span 1 / span 1;

		display: flex;
		flex-direction: column;
		align-items: center;

		padding: 1.5rem;
		overflow-y: auto;
	}

	.avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-initials {
		font-size: 2.5rem;
		font-weight: 700;
		color: white;
		letter-spacing: 2px;
	}

	h1 {
		font-size: 2rem;
		line-height: 1.4;
	}

	h2 {
		font-size: 1.2rem;
		line-height: 1.2;
		opacity: 0.7;
		font-weight: 400;
	}

	.skills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
		max-width: 500px;
	}

	.skill-tag {
		padding: 0.3rem 0.8rem;
		border-radius: 1rem;
		background-color: hsla(var(--system-color-primary-hsl), 0.15);
		color: var(--system-color-primary);
		font-size: 0.8rem;
		font-weight: 500;
	}

	p {
		line-height: 1.6;
		text-align: center;
		max-width: 500px;
	}
</style>
