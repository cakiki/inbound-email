import PostalMime from 'postal-mime';
import { parse } from 'node-html-parser';

export default {
	async email(message, env, ctx) {
		const email = await new PostalMime().parse(message.raw);
		const papers = parse(email.html ?? '')
	.querySelectorAll('h3 > a[href*="scholar_url?url="]')
	.map((a) => {
		const href = a.getAttribute('href')!;
		const authors = a.parentNode.nextElementSibling;
		const snippet = authors?.nextElementSibling;
		return {
			url: new URL(href).searchParams.get('url') ?? href,
			title: a.text.replace(/\s+/g, ' ').trim(),
			authors: (authors?.text ?? '').replace(/\s+/g, ' ').trim(),
			snippet: (snippet?.classList.contains('gse_alrt_sni') ? snippet.text : '').replace(/\s+/g, ' ').trim(),
		};
	});
		console.info(`Received: ${email.subject}`, { from: message.from, to: message.to, papers });
	},
} satisfies ExportedHandler<Env>;