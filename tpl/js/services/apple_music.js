export async function setAppleMusicHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[5] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const country = obj.matches[2];
		const type = obj.matches[3];
		const name = obj.matches[4];
		const id = obj.matches[5];

		let style = '';
		if ( type === 'album' && id.indexOf('i=') === 0 ) {
			style = 'padding-bottom: 0; height: 150px;';
		} else if ( type === 'music-video' || type === 'post' ) {
			style = 'padding-bottom: '+ 56.25 +'%';
		} else {
			style = 'padding-bottom: 0; height: 450px;';
		}

		const target_url = encodeURIComponent('https://music.apple.com/api/oembed?url=' + obj.matches[0]);
		const iframe_src = obj.matches[0].replace('music.apple.com', 'embed.music.apple.com');

		try {
			const response = await fetch(preview.cors + target_url, {format: 'json'});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.json();
			if (!data) {
				setPreviewCard(obj);
				return false;
			}
			const thumb = `<img src="${data.thumbnail_url.replace(/\d+x\d+[^.]+.(?:(jpg|jpeg|png|gif))/, '600x600.$1')}" />`;
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} apple-music-embed" style="${style}">
						${thumb}
						<iframe src="${iframe_src}" allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"></iframe>
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