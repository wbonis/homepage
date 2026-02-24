<script lang="ts">
	import { tick } from 'svelte';

	interface HistoryEntry {
		command: string;
		output: string;
	}

	let history: HistoryEntry[] = $state([
		{ command: '', output: 'Welcome to WBonis Terminal v1.0\nType "help" for available commands.\n' },
	]);
	let currentInput = $state('');
	let terminalEl: HTMLDivElement | undefined = $state();

	const commands: Record<string, () => string> = {
		help: () => `Available commands:
  whoami      - Who am I?
  about       - About me
  skills      - My technical skills
  projects    - List my projects
  contact     - Contact information
  neofetch    - System info
  clear       - Clear terminal
  help        - Show this help`,

		whoami: () => 'WBonis - System Architekt',

		about: () => `WBonis - System Architekt
━━━━━━━━━━━━━━━━━━━━━━━━━━
Experienced System Architect specializing in
cloud infrastructure, distributed systems,
and modern development workflows.

Building scalable, secure, and efficient
systems since 2017.`,

		skills: () => `Technical Skills
━━━━━━━━━━━━━━━━
Infrastructure : AWS, Azure, GCP, Terraform, K8s
Languages      : Go, Python, TypeScript, Rust
DevOps         : GitLab CI, ArgoCD, Docker
Monitoring     : Prometheus, Grafana, ELK
Architecture   : Microservices, Event-Driven, DDD`,

		projects: () => `Projects
━━━━━━━━
[1] Cloud Infrastructure Platform  - AWS/Terraform/K8s
[2] Microservices Framework         - Go/gRPC/Docker
[3] Security Audit Tool             - Python/CI/CD
[4] Real-time Monitoring Dashboard  - React/Grafana
[5] API Gateway                     - Rust/Redis/OAuth
[6] DevOps Pipeline                 - GitLab CI/ArgoCD`,

		contact: () => `Contact Info
━━━━━━━━━━━━
Email  : contact@wbonis.dev
GitHub : github.com/WBonis
LinkedIn: linkedin.com/in/wbonis`,

		neofetch: () => `        .:'          WBonis@portfolio
    __ :'__         ━━━━━━━━━━━━━━━━
 .'  \`  \`   '.     OS: macOS Web 1.0
:          .-'     Host: Browser
:         ;        Shell: wbonis-sh
:        :         Resolution: ${window.innerWidth}x${window.innerHeight}
 '.    .'          Theme: System Architect
   \`--'            Terminal: WBonis Terminal v1.0`,

		clear: () => '__CLEAR__',
	};

	async function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			const cmd = currentInput.trim().toLowerCase();
			let output = '';

			if (cmd === '') {
				output = '';
			} else if (cmd === 'clear') {
				history = [];
				currentInput = '';
				return;
			} else if (commands[cmd]) {
				output = commands[cmd]();
			} else {
				output = `zsh: command not found: ${cmd}\nType "help" for available commands.`;
			}

			history = [...history, { command: currentInput, output }];
			currentInput = '';

			await tick();
			if (terminalEl) {
				terminalEl.scrollTop = terminalEl.scrollHeight;
			}
		}
	}
</script>

<section class="container">
	<header class="titlebar app-window-drag-handle">
		<div class="title-dots">
			<span class="dot red"></span>
			<span class="dot yellow"></span>
			<span class="dot green"></span>
		</div>
		<span class="title-text">WBonis — zsh — 80x24</span>
	</header>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="terminal" bind:this={terminalEl} onclick={() => {
		const input = document.getElementById('terminal-input');
		if (input) input.focus();
	}}>
		{#each history as entry}
			{#if entry.command}
				<div class="line">
					<span class="prompt">wbonis@portfolio</span><span class="prompt-sep">:</span><span class="prompt-dir">~</span><span class="prompt-dollar">$</span> {entry.command}
				</div>
			{/if}
			{#if entry.output}
				<pre class="output">{entry.output}</pre>
			{/if}
		{/each}

		<div class="line input-line">
			<span class="prompt">wbonis@portfolio</span><span class="prompt-sep">:</span><span class="prompt-dir">~</span><span class="prompt-dollar">$</span>
			<input
				id="terminal-input"
				type="text"
				bind:value={currentInput}
				onkeydown={handleKeydown}
				spellcheck="false"
				autocomplete="off"
			/>
		</div>
	</div>
</section>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
		border-radius: inherit;
		background-color: #1e1e1e;
		font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
	}

	.titlebar {
		display: flex;
		align-items: center;
		padding: 0.6rem 1rem;
		background-color: #2d2d2d;
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
		flex-shrink: 0;
		position: relative;
	}

	.title-dots {
		display: flex;
		gap: 6px;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;

		&.red { background-color: #ff5f57; }
		&.yellow { background-color: #febc2e; }
		&.green { background-color: #28c840; }
	}

	.title-text {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.75rem;
	}

	.terminal {
		flex: 1;
		padding: 0.8rem;
		overflow-y: auto;
		color: #d4d4d4;
		font-size: 0.82rem;
		line-height: 1.5;
		cursor: text;
	}

	.line {
		white-space: pre-wrap;
		word-break: break-all;
	}

	.prompt {
		color: #4ec9b0;
		font-weight: 600;
	}

	.prompt-sep {
		color: #d4d4d4;
	}

	.prompt-dir {
		color: #569cd6;
		font-weight: 600;
	}

	.prompt-dollar {
		color: #d4d4d4;
		margin-right: 0.5rem;
	}

	.output {
		margin: 0 0 0.3rem 0;
		white-space: pre-wrap;
		font-family: inherit;
		font-size: inherit;
		color: #cccccc;
	}

	.input-line {
		display: flex;
		align-items: center;

		input {
			flex: 1;
			background: none;
			border: none;
			outline: none;
			color: #d4d4d4;
			font-family: inherit;
			font-size: inherit;
			caret-color: #fff;
			padding: 0;
		}
	}
</style>
