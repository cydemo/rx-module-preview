export async function setCodesandboxHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] && !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[1] ?? obj.matches[2];
		const target_url = 'https://codesandbox.io/oembed?url=https://codesandbox.io/s/' + id;
		const iframe_src = 'https://codesandbox.io/embed/' + id + '?autoresize=1&fontsize=14&hidenavigation=1&theme=dark';

		try {
			const response = await fetch(preview.cors + target_url, {format: 'json'});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.json();
			if (!data) {
				setPreviewCard(obj);
				return false;
			}
			const thumb = data.thumbnail_url ? `<img src="${data.thumbnail_url}" />` : '';
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} codesandbox-embed">
						${thumb}
						<iframe src="${iframe_src}" title="${data.title}" loading="lazy" sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"></iframe>
					</div>
				</div>
			`;

			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}