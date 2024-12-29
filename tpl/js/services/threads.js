export async function setThreadsHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed, procPreviewImageFileInfo } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[1];
		const id = obj.matches[2];

		const external_proxy = 'https://api.codetabs.com/v1/proxy/?quest=';
		const target_url = 'https://www.threads.net/@' + name + '/post/' + id;
		const iframe_src = obj.matches[0] + '/embed';

		try {
			const response = await fetch(preview.cors + encodeURIComponent(external_proxy + target_url));

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			let thumb = '';
			if ( data ) {
				thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
			}

			if ( !thumb ) {
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} threads-embed">
							<iframe src="${iframe_src}" frameborder="0" loading="lazy" scrolling="no" allowtransparency="true" allowfullscreen="true"></iframe>
						</div>
					</div>
				`;

				insertMediaEmbed(obj);
				completeMediaEmbed();
				obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
				return false;
			}

			obj.data_obj = {
				inserting_type: 'media_embed',
				image_url: thumb,
				mid: window.current_mid,
				editor_sequence: preview.editor_container.data().editorSequence,
				allow_chunks: 'Y'
			};

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} threads-embed">
						<img src="${thumb}" style="display: none;" />
						<iframe src="${iframe_src}" frameborder="0" scrolling="no" loading="lazy"></iframe>
					</div>
				</div>
			`;
			procPreviewImageFileInfo(obj);
			obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
		} catch (error) {
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} threads-embed">
						<iframe src="${iframe_src}" frameborder="0" scrolling="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>
					</div>
				</div>
			`;

			insertMediaEmbed(obj);
			completeMediaEmbed();
			obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}