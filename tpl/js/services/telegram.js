export async function setTelegramHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !$.isNumeric(obj.matches[2]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, procPreviewImageFileInfo, insertMediaEmbed, completeMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[1];
		const id = obj.matches[2];
		const target_url = obj.matches[0];
		const iframe_src = target_url + '?embed=1';

		try {
			const response = await fetch(preview.cors + target_url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			let thumb = '';
			const data = await response.text();
			if ( data ) {
				thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';

				if ( thumb ) {
					obj.data_obj = {
						inserting_type: 'media_embed',
						image_url: thumb,
						mid: window.current_mid,
						editor_sequence: preview.editor_container.data().editorSequence,
						allow_chunks: 'Y'
					};
				}

				thumb = thumb ? '<img src="'+ thumb +'"/>' : '';
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} telegram-embed">
						${thumb}
						<iframe src="${iframe_src}" frameborder="0" scrolling="no" allowfullscreen></iframe>
					</div>
				</div>
			`;

			if ( thumb ) {
				procPreviewImageFileInfo(obj);
			} else {
				insertMediaEmbed(obj);
				completeMediaEmbed();
			}

			obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}