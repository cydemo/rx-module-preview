export async function setApplePodcastsHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || (!obj.matches[2] || obj.matches[2].length !== 2) || !obj.matches[3] || !$.isNumeric(obj.matches[4]) || !$.isNumeric(obj.matches[5]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[2];
		const name = obj.matches[3];
		const adam_id = obj.matches[4];
		const content_id = obj.matches[5];

		const target_url = `https://podcasts.apple.com/${type}/podcast/${encodeURIComponent(name)}/id${adam_id}?i=${content_id}`;
		const iframe_src = target_url.replace('://', '://embed.');

		let thumb = '';

		try {
			const response = await fetch(preview.cors + encodeURIComponent(target_url));
			if (!response.ok) {
				console.error('Error fetching '+ title +' data');
			}

			const data = await response.text();
			thumb = $(data).filter('meta[property="og:image"]').attr('content');
			thumb = thumb ? `<img src="${thumb}" />` : '';
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
		}

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} podcasts-embed">
					${thumb}
					<iframe src="${iframe_src}" frameborder="no" scrolling="no" loading="lazy" allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"></iframe>
				</div>
			</div>`;

		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}