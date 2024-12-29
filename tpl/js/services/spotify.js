export async function setSpotifyHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[4] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const target_url = 'https://open.spotify.com/oembed?url=' + obj.matches[0];

		try {
			const response = await fetch(preview.cors + encodeURIComponent(target_url));
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

			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const type = data.type;
			let style = '';
			let ratio = '';

			if ( type === 'rich' ) {
				style = 'max-width: ' + data.width + 'px; padding-bottom: '+ data.height +'px;';
			} else if ( type === 'video' ) {
				ratio = (data.height / data.width * 100).toFixed(2);
				style = 'padding-bottom: '+ ratio +'%;';
			}

			const thumb = data.thumbnail_url ? '<img src="'+ data.thumbnail_url +'" />' : '';
			const iframe_src = data.iframe_url.setQuery('locale', current_lang);

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} spotify-embed" style="${style}">
						${thumb}
						<iframe src="${iframe_src}" frameborder="0" loading="lazy"></iframe>
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