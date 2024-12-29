export async function setBandcampHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const target_url = obj.matches[0];
		const name = obj.matches[1];
		let type = obj.matches[2];
		let id = obj.matches[3];
		let style = '';

		if ( (name === 'www' || name === 'daily') || (id && (type !== 'album' && type !== 'track')) ) {
			setPreviewCard(obj);
			return false;
		}

		try {
			const response = await fetch(preview.cors + target_url);
			if (!response.ok) {
				console.error('Error fetching '+ title +' data');
			}

			const data_fetched = await response.text();
			if (!data_fetched) {
				setPreviewCard(obj);
				return;
			}
			const head_part = $(data_fetched.match(/<head.+<\/head>/s)[0]);
			const video_url = head_part.filter('meta[property="og:video"]').attr('content');
			if (!head_part || !video_url) {
				setPreviewCard(obj);
				return;
			}

			if ( !type ) {
				if ( video_url.indexOf('album=') !== -1 ) {
					type = 'album';
				} else if ( video_url.indexOf('track=') !== -1 ) {
					type = 'track';
				}
			}
			const hash = new RegExp(type + '=([0-9]+)');
			const id_matches = video_url.match(hash);
			if ( !id_matches || !id_matches[1] ) {
				setPreviewCard(obj);
				return false;
			}
			id = id_matches[1];

			const data_matches = data_fetched.match(/<script\stype=\"application\/ld\+json\">([^<]+)<\/script>/);
			if ( !data_matches || !data_matches[1] ) {
				setPreviewCard(obj);
				return false;
			}
			const data_parsed = JSON.parse($.trim(data_matches[1]));
			if ( !data_parsed ) {
				setPreviewCard(obj);
				return false;
			}
			const thumb = data_parsed.image ? `<img src="${data_parsed.image}" />` : '';

			if ( type === 'album' ) {
				if ( data_parsed.numTracks >= 5 ) {
					style = 'height: 310px;';
				} else if ( data_parsed.numTracks <= 1 ) {
					style = 'height: 175px;';
				} else {
					style = 'height: '+ (310 - ((5 - data_parsed.numTracks) * 33)) +'px;';
				}
			} else if ( type === 'track' ) {
				style = 'height: 175px;';
			}

			const iframe_src = `https://bandcamp.com/EmbeddedPlayer/size=large/bgcol=ffffff/linkcol=0687f5/artwork=small/${type}=${id}/transparent=true/`;
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} bandcamp-embed" style="${style}">
						${thumb}
						<iframe src="${iframe_src}" frameborder="0" scrolling="no" loading="lazy" style="${style}" seamless></iframe>
					</div>
				</div>`;

			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}