export async function setJjalbotHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( $.inArray(obj.matches[1], ['jjals', 'embed', 'media']) === -1 || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed, setPreviewCard } = await import('./_functions.js');

	waitMediaEmbed();

	try {
		const id = obj.matches[2];
		const target_url = 'https://jjalbot.com/jjals/' + id;
		let image_url = '';

		try {
			const response = await fetch(preview.cors + target_url);

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			if ( data ) {
				image_url = $(data).filter('meta[property="og:image"]').attr('content') || '';
			}

			$('<img />').attr('src', image_url).load(function() {
				const style = 'max-width: '+ this.naturalWidth +'px; max-height: '+ this.naturalHeight +'px;';
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} jjalbot-embed" style="${style}">
							<img src="${image_url}" style="width: ${this.naturalWidth}px;" />
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			}).error(function() {
				console.error('Error: fail to load the image');
				setPreviewCard(obj);
				return false;
			});
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}