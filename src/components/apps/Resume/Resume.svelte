<script lang="ts">
	import DownloadIcon from '~icons/mdi/download';
</script>

<section class="container">
	<header class="titlebar app-window-drag-handle">
		<span>Resume</span>
		<button class="download-btn" onclick={() => alert('PDF download coming soon!')}>
			<DownloadIcon /> Download PDF
		</button>
	</header>

	<div class="document">
		<div class="page">
			<div class="doc-header">
				<h1>WBonis</h1>
				<p class="role">System Architekt</p>
				<div class="contact-row">
					<span>contact@wbonis.dev</span>
					<span>github.com/WBonis</span>
				</div>
			</div>

			<div class="section">
				<h2>Experience</h2>
				<div class="entry">
					<div class="entry-header">
						<h3>Senior System Architect</h3>
						<span class="date">2022 - Present</span>
					</div>
					<p class="company">Enterprise Solutions GmbH</p>
					<ul>
						<li>Designed and implemented cloud-native microservices architecture serving 1M+ users</li>
						<li>Led migration from monolithic to distributed systems, reducing deployment time by 80%</li>
						<li>Established infrastructure-as-code practices using Terraform and Kubernetes</li>
					</ul>
				</div>

				<div class="entry">
					<div class="entry-header">
						<h3>DevOps Engineer</h3>
						<span class="date">2019 - 2022</span>
					</div>
					<p class="company">Tech Startup AG</p>
					<ul>
						<li>Built CI/CD pipelines reducing release cycles from weeks to hours</li>
						<li>Implemented monitoring and alerting infrastructure with Prometheus and Grafana</li>
						<li>Managed AWS and Azure cloud environments with 99.99% uptime SLA</li>
					</ul>
				</div>

				<div class="entry">
					<div class="entry-header">
						<h3>Backend Developer</h3>
						<span class="date">2017 - 2019</span>
					</div>
					<p class="company">Digital Agency</p>
					<ul>
						<li>Developed RESTful APIs and microservices in Go and Node.js</li>
						<li>Designed database schemas and optimized query performance</li>
					</ul>
				</div>
			</div>

			<div class="section">
				<h2>Skills</h2>
				<div class="skills-grid">
					<div>
						<h4>Infrastructure</h4>
						<p>AWS, Azure, GCP, Terraform, Kubernetes, Docker, Linux</p>
					</div>
					<div>
						<h4>Languages</h4>
						<p>Go, Python, TypeScript, Rust, Bash</p>
					</div>
					<div>
						<h4>Tools</h4>
						<p>GitLab CI, ArgoCD, Prometheus, Grafana, Vault, Consul</p>
					</div>
					<div>
						<h4>Architecture</h4>
						<p>Microservices, Event-Driven, Domain-Driven Design, CQRS</p>
					</div>
				</div>
			</div>

			<div class="section">
				<h2>Education</h2>
				<div class="entry">
					<div class="entry-header">
						<h3>B.Sc. Computer Science</h3>
						<span class="date">2013 - 2017</span>
					</div>
					<p class="company">Technical University</p>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.container {
		display: flex;
		flex-direction: column;
		height: 100%;
		border-radius: inherit;
		background-color: #525659;
		color: var(--system-color-dark);
	}

	.titlebar {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 0.7rem 1rem;
		width: 100%;
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;
		user-select: none;
		flex-shrink: 0;
		background-color: #3a3d40;

		span {
			color: rgba(255, 255, 255, 0.8);
			font-weight: 500;
			font-size: 0.9rem;
		}
	}

	.download-btn {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.6rem;
		border-radius: 0.3rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.75rem;
		cursor: pointer;
		position: absolute;
		right: 1rem;

		&:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	.document {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		display: flex;
		justify-content: center;
	}

	.page {
		background: white;
		width: 100%;
		max-width: 550px;
		padding: 2.5rem;
		border-radius: 4px;
		box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
		color: #1d1d1f;
	}

	.doc-header {
		text-align: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #007aff;

		h1 {
			font-size: 1.8rem;
			font-weight: 700;
			letter-spacing: 1px;
		}

		.role {
			font-size: 1rem;
			color: #007aff;
			margin-top: 0.2rem;
		}

		.contact-row {
			display: flex;
			justify-content: center;
			gap: 1.5rem;
			margin-top: 0.5rem;
			font-size: 0.75rem;
			opacity: 0.6;
		}
	}

	.section {
		margin-bottom: 1.2rem;

		h2 {
			font-size: 0.9rem;
			font-weight: 700;
			text-transform: uppercase;
			letter-spacing: 1px;
			color: #007aff;
			margin-bottom: 0.6rem;
			padding-bottom: 0.3rem;
			border-bottom: 1px solid #e5e5e7;
		}
	}

	.entry {
		margin-bottom: 0.8rem;
	}

	.entry-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;

		h3 {
			font-size: 0.85rem;
			font-weight: 600;
		}

		.date {
			font-size: 0.72rem;
			opacity: 0.5;
		}
	}

	.company {
		font-size: 0.78rem;
		opacity: 0.6;
		margin-bottom: 0.3rem;
	}

	ul {
		padding-left: 1.2rem;
		margin: 0;

		li {
			font-size: 0.78rem;
			line-height: 1.5;
			margin-bottom: 0.15rem;
		}
	}

	.skills-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;

		h4 {
			font-size: 0.78rem;
			font-weight: 600;
			margin-bottom: 0.15rem;
		}

		p {
			font-size: 0.72rem;
			line-height: 1.4;
			opacity: 0.7;
		}
	}
</style>
