export async function setAmazonMusicHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = ( obj.matches[1] === 'tracks' ) ? 'track' : 'album';
		const id = obj.matches[2];
		const name = ' amazon-music-' + type;
		const style = ( type === 'track' ) ? 'height: 250px; max-width: 500px;' : 'height: 550px;';

		const target_url = `https://music.amazon.com/embed/${id}`;
		const iframe_src = target_url;

		let thumb = '';

		try {
			const response = await fetch(preview.cors + encodeURIComponent(target_url));
			if (!response.ok) {
				console.error('Error fetching '+ title +' data');
			}

			const data = await response.text();
			const matches = data.match(/<img[^>]+src="(https?:\/\/m.media-amazon.com\/images\/[^"]+)"(?:[^>]+)?>/);
			thumb = matches ? `<img src="${matches[1]}" />` : '';
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
		}

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} amazon-music-embed${name}" style="${style}">
					${thumb}
					<iframe src="${iframe_src}" id="AmazonMusicEmbed${id}" frameborder="0" scrolling="no" loading="lazy" style="${style}"></iframe>
				</div>
			</div>`;

		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}