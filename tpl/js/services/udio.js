export async function setUdioHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[1];
		const style = 'padding-bottom: 228px; border-radius: 12px;';

		const target_url = obj.matches[0];
		const iframe_src = 'https://www.udio.com/embed/'+ id +'?embedVariant=default';

		try {
			const response = await fetch(preview.cors + target_url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			let thumb = '';
			if ( data ) {
				thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
				thumb = thumb ? '<img src="'+ thumb +'"/>' : '';
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}" style="${style}">
						${thumb}
						<iframe src="${iframe_src}" frameborder="no" scrolling="no" marginwidth="0" marginheight="0" allowfullscreen></iframe>
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