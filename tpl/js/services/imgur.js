export async function setImgurHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[3];
		let type = '';

		if ( obj.matches[1] && obj.matches[1] === 'i' ) {
			type = 'file';
		} else {
			type = obj.matches[2];
			if ( !type ) {
				type = 'image';
			} else {
				if ( type === 'a' || type.indexOf('t/') !== -1 ) {
					type = 'album';
				}
				if ( type.indexOf('r/') !== -1 ) {
					type = 'image';
				}
			}
		}

		if ( type === 'file' ) {
			const iframe_src = `https://imgur.com/${id}/embed?pub=true&ref=${request_uri}`;
			const thumb = obj.matches[0];
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} imgur-embed">
						<img src="${thumb}" />
						<iframe src="${iframe_src}" class="imgur-embed-iframe-pub" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
					</div>
				</div>
			`;

			insertMediaEmbed(obj);
			completeMediaEmbed();
			obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
		} else {
			const target_url = 'https://api.imgur.com/3/'+ type +'/'+ id +'?client_id=546c25a59c58ad7';

			const response = await fetch(target_url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const textData = await response.text();

			let data;
			try {
				data = JSON.parse(textData);
			} catch (error) {
				console.error('Error parsing JSON:', error);
				setPreviewCard(obj);
				return false;
			}

			if ( !data || !data.success || !data.data ) {
				console.error('Error: '+ title +' data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			let hash = '';
			data = data.data;
			if ( type === 'gallery' ) {
				type = ( data.is_album ) ? 'album' : 'image';
			}
			if ( type === 'album' ) {
				hash = 'a/';
				data = data.images[0];
			}

			const thumb = ( data.type === 'video/mp4' ) ? '' : `<img src="${data.link}" />`;
			const iframe_src = `https://imgur.com/${hash}${id}/embed?pub=true&ref=${request_uri}`;
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} imgur-embed">
						${thumb}
						<iframe src="${iframe_src}" class="imgur-embed-iframe-pub" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
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