export async function setInstagramHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed, procPreviewImageFileInfo } = await import('./_functions.js');

		waitMediaEmbed();
		
		const matches = obj.matches;
		const id = matches[3];
		let type = '';

		if ( !matches[1] ) {
			type = 'username';
		} else if ( matches[1] === 'p' || matches[2] === 'p' ) {
			type = 'p';
		} else if ( matches[1] === 'tv' ) {
			type = 'tv';
		} else if ( matches[1] === 'explore' || matches[2] === 'tags' ) {
			type = 'tag';
		} else if ( matches[1] === 'reel' ) {
			type = 'reel';
		} else {
			setPreviewCard(obj);
			return false;
		}

		if ( type !== 'p' && type !== 'tv' && type !== 'reel' ) {
			setPreviewCard(obj);
			return false;
		}

		const external_proxy = 'https://api.codetabs.com/v1/proxy/?quest=';
		const target_url = 'https://www.instagram.com/' + type + '/' + id;
		const iframe_src = target_url + '/embed/captioned/';

		try {
			const response = await fetch(preview.cors + encodeURIComponent(external_proxy + encodeURIComponent(target_url)));

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
						<div class="${preview.iframe_wrapper} instagram-embed">
							<iframe src="${iframe_src}" class="instagram-media instagram-media-rendered" frameborder="0" height="480" scrolling="no"></iframe>
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
					<div class="${preview.iframe_wrapper} instagram-embed">
						<img src="${thumb}" style="display: none;" />
						<iframe src="${iframe_src}" class="instagram-media instagram-media-rendered" frameborder="0" height="480" scrolling="no"></iframe>
					</div>
				</div>
			`;
			procPreviewImageFileInfo(obj);
			obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
		} catch (error) {
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} instagram-embed">
						<iframe src="${iframe_src}" class="instagram-media instagram-media-rendered" frameborder="0" height="480" scrolling="no"></iframe>
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