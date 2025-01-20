export async function setPopkontvHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[1]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[1];
		const target_url = obj.matches[0];

		$.get(preview.cors + target_url).done(function(response) {
			if ( !response ) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				completeMediaEmbed();
			}

			const video_title = $(response).filter('title').text().replace(/\|.+/, '');
			const image_url = $(response).filter('meta[property="og:image"]').attr('content');
			const video_url = image_url.replace(/\.(\w+$)/, '.mp4');

			const thumb = `<img src="${image_url}" />`;
			const iframe_src = '/modules/preview/libs/media_embed.iframe.php' +
				'?service=' + obj.service + '&type=' + id + '&url=' + video_url + '&data=' + video_title + '|@|' + image_url;

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} popkontv-embed short_form">
						${thumb}
						<iframe src="${iframe_src}" data-frame-id="popkontv-${Date.now()}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" scroling="no" loading="lazy"></iframe>
					</div>
				</div>`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		}).fail(function() {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			completeMediaEmbed();
		});
	} catch(error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}