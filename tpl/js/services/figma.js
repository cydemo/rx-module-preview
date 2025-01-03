export async function setFigmaHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const id = obj.matches[2];
		const target_url = 'https://www.figma.com/api/oembed?url=https://www.figma.com/' + type + '/' + id;
		const iframe_src = 'https://embed.figma.com/' + type + '/' + id + '?embed-host=oembed&page-selector=1&theme=light';

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
			const ratio = (100 * data.thumbnail_height / data.thumbnail_width).toFixed(2);
			const style = `padding-bottom : calc(${ratio}% + 100px);`;
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}" style="${style}">
						${thumb}
						<iframe src="${iframe_src}" loading="lazy" allowfullscreen></iframe>
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