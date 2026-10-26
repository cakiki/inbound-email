import PostalMime from 'postal-mime';
import { parse } from 'node-html-parser';
import { Octokit } from '@octokit/core';

export default {
	async email(message, env, ctx) {
		const email = await new PostalMime().parse(message.raw);
		const papers = parse(email.html ?? '')
			.querySelectorAll('h3 > a[href*="scholar_url?url="]')
			.map((a) => {
				const href = a.getAttribute('href')!;
				const authors = a.parentNode?.nextElementSibling;
				const snippet = authors?.nextElementSibling;
				return {
					url: new URL(href).searchParams.get('url') ?? href,
					title: a.text.replace(/\s+/g, ' ').trim(),
					authors: (authors?.text ?? '').replace(/\s+/g, ' ').trim(),
					snippet: (snippet?.classList.contains('gse_alrt_sni') ? snippet.text : '').replace(/\s+/g, ' ').trim(),
				};
			});
		const octokit = new Octokit({ auth: env.GITHUB_TOKEN });
		for (const paper of papers) {
			await octokit
				.request(`POST /repos/${env.GITHUB_REPO}/issues`, {
					title: paper.title,
					body: `${paper.url}\n\n${paper.authors}\n\n> ${paper.snippet}\n\n_Google Scholar alert: ${email.subject}_`,
					labels: ['google-scholar'],
				})
				.catch((e) => console.error(`GitHub ${e.status} for "${paper.title}": ${e.message}`));
		}

		console.info(`Received: ${email.subject}`, { from: message.from, to: message.to, papers: papers.map((p) => p.title) });
	},
} satisfies ExportedHandler<Env>;
