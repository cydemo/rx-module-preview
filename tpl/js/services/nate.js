export async function setNateHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] || !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, procPreviewImageFileInfo, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const id = obj.matches[3];
		const target_url = obj.matches[0];

		$.get(preview.cors + target_url).done(function(response) {
			if ( type === 'news' ) {
				const matches = response.match(/source[^\"']+[\"|']([^\"']+)/);
				if ( !matches ) {
					setPreviewCard(obj);
					return false;
				}
			}

			let image_url = '';
			if ( $(response).filter('#__NEXT_DATA__').length ) {
				let data = JSON.parse($(response).filter('#__NEXT_DATA__').text());
					data = data.props.pageProps.videoDetailView;
				image_url = data.contentImg;
			} else {
				image_url = $(response).filter('meta[property=\"og:image\"]').attr('content');
				image_url = 'https:' + image_url.match(/(\/\/news.nateimg.co.kr\/[^.]+.(?:jpe?g|png))/)[1];
			}
			const thumb = `<img src="${image_url}" />`;

			obj.data_obj = {
				inserting_type: 'media_embed',
				image_url: image_url,
				mid: window.current_mid,
				editor_sequence: preview.editor_container.data().editorSequence,
				allow_chunks: 'Y'
			};

			const iframe_src = '/modules/preview/libs/media_embed.iframe.php' +
				'?service=' + obj.service + '&type=' + type + '&url=' + encodeURIComponent(target_url) + '&data=' + encodeURIComponent(image_url);

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} nate-embed">
						${thumb}
						<iframe src="${iframe_src}" data-frame-id="nate-${Date.now()}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" scroling="no" loading="lazy"></iframe>
					</div>
				</div>
			`;
			procPreviewImageFileInfo(obj);
		}).fail(function() {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		});
	} catch(error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}