export async function setKtvHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[1]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[1];
		const target_url = 'https://www.ktv.go.kr/content/view?content_id=' + id;
		const iframe_src = 'https://www.ktv.go.kr/content/player?content_id=' + id;

		try {
			const response = await fetch(preview.cors + encodeURIComponent(target_url));

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			let thumb = '';
			if ( data ) {
				thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
				thumb = thumb ? '<img src="'+ thumb +'" />' : '';
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}">
						${thumb}
						<iframe src="${iframe_src}" loading="lazy"></iframe>
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