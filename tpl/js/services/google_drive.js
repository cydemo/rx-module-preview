export async function setGoogleDriveHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, procPreviewImageFileInfo } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[2];
		const id = obj.matches[3];

		let type = obj.matches[1];
		let iframe_src = '';

		if ( type === 'drive/folders' || type === 'embeddedfolderview' ) {
			type = 'embeddedfolderview';
			iframe_src = `https://drive.google.com/${type}?id=${id}&usp=drive_link`;

			setGoogleDriveContentWithoutThumbnail(obj, iframe_src);
		} else {
			const target_url = obj.matches[0];
			iframe_src = `https://docs.google.com/${type}/${name}${id}/preview?usp=embed_googleplus`;

			try {
				const response = await fetch(preview.cors + target_url);
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();
				if ( !data ) {
					setGoogleDriveContentWithoutThumbnail(obj, iframe_src);
				}

				const url = $(data).filter('meta[itemprop="embedURL"]').attr('content');
				iframe_src = url ?? iframe_src;

				let thumb = $(data).filter('meta[property="og:image"]').attr('content') ?? '';

				if ( thumb ) {
					obj.data_obj = {
						inserting_type: 'media_embed',
						image_url: thumb,
						mid: window.current_mid,
						editor_sequence: preview.editor_container.data().editorSequence,
						allow_chunks: 'Y'
					};

					thumb = thumb ? `<img src="${thumb}" />` : '';

					obj.html = `
						<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
							<div class="${preview.iframe_wrapper} google-drive-embed">
								${thumb}
								<iframe src="${iframe_src}" allowfullscreen="true" frameborder="no" loading="lazy"></iframe>
							</div>
						</div>
					`;
					procPreviewImageFileInfo(obj);
				} else {
					setGoogleDriveContentWithoutThumbnail(obj, iframe_src);
				}
			} catch (error) {
				setGoogleDriveContentWithoutThumbnail(obj, iframe_src);
			}
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function setGoogleDriveContentWithoutThumbnail(obj, iframe_src) {
		const { insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} google-drive-embed">
					<iframe src="${iframe_src}" allowfullscreen="true" frameborder="no" loading="lazy"></iframe>
				</div>
			</div>
		`;
		insertMediaEmbed(obj);
		completeMediaEmbed();
	}