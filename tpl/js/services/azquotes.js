export async function setAzquotesHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[1]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, procPreviewImageFileInfo, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();
	
		const id = obj.matches[1];
		const target_url = 'https://www.azquotes.com/quote/' + id;

		try {
			const response = await fetch(preview.cors + target_url);
			if (!response.ok) {
				console.error('Error fetching '+ title +' data');
			}

			const data = await response.text();
			if (!data) {
				setPreviewCard(obj);
				return;
			}
			const head_part = $(data.match(/<head.+<\/head>/s)[0]);
			const image_url = head_part.filter('meta[property="og:image"]').attr('content');

			const img = new Image();
			img.src = image_url;
			img.onload = function() {
				obj.data_obj = {
					inserting_type: 'media_embed',
					image_url: image_url,
					mid: window.current_mid,
					editor_sequence: preview.editor_container.data().editorSequence,
					allow_chunks: 'Y'
				};

				const thumb = `<img src="${image_url}" />`;
				const style = `max-width: ${this.naturalWidth}px; max-height: ${this.naturalHeight}px;`;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} azquotes-embed" style="${style}">
							${thumb}
						</div>
					</div>`;
				procPreviewImageFileInfo(obj);
			};
			img.onerror = function() {
				const thumb = `<img src="${image_url}" />`;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} azquotes-embed" style="${style}">
							${thumb}
						</div>
					</div>`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			};
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}