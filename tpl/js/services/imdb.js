export async function setImdbHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || obj.matches[2] !== 'vi' || !$.isNumeric(obj.matches[3]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[1];
		const target_url = 'https://www.imdb.com/video/embed/'+ id +'/?format=1080p&width=&isResponsive=true';
		const iframe_src = target_url;
		let thumb = '';

		try {
			const response = await fetch(preview.cors + encodeURIComponent(target_url));

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			if ( data ) {
				thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
				thumb = thumb ? '<img src="' + thumb + '" />' : '';
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}">
						${thumb}
						<iframe src="${iframe_src}" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}">
						<iframe src="${iframe_src}" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}