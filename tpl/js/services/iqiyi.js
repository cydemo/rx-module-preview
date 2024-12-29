export async function setIqiyiHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed, setPreviewCard } = await import('./_functions.js');

	waitMediaEmbed();

	try {
		const id = obj.matches[2];
		const target_url = 'https://www.iq.com/play/' + id;
		const iframe_src = 'https://em.iq.com/player.html?id='+ id +'&mod=kr&lang=ko&autoplay=0';
		let thumb = '';

		try {
			const response = await fetch(preview.cors + target_url);

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			if ( data ) {
				thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
				thumb = thumb ? `<img src="${thumb}" />` : '';
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}">
						${thumb}
						<iframe src="${iframe_src}" frameborder="0" scrolling="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>
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