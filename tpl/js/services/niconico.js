export async function setNiconicoHtml(obj) {
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

		let id = obj.matches[3];
		const prefix = id.substr(0, 2);
		const start = obj.matches[4] ?? 0;
		let type = '';

		if ( !obj.matches[1] && prefix === 'sm' ) {
			type = 'video';
		} else if ( obj.matches[1] === 'live' && (prefix === 'lv' || prefix === 'ch') ) {
			type = 'live';
		} else {
			setPreviewCard(obj);
			return false;
		}

		if ( type === 'video' ) {
			const target_url = 'https://ext.nicovideo.jp/api/getthumbinfo/' + id;
			const iframe_src = 'https://embed.nicovideo.jp/watch/'+ id +'?from='+ start;

			try {
				const response = await fetch(preview.cors + target_url);

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.text();
				let thumb = '';
				if ( data ) {
					data = $.parseXML(data);
					thumb = '<img src="' + $(data).find('thumbnail_url').text() +'.L" />';
				}

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} nico-embed-${type}">
							${thumb}
							<iframe src="${iframe_src}" allowfullscreen frameborder="0" scrolling="no" loading="lazy"></iframe>
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
		} else if ( type === 'live' ) {
			let target_url = '';
			let iframe_src = '';

			if ( prefix === 'lv' ) {
				target_url = 'https://live.nicovideo.jp/embed/' + id;
				target_url += ( start ) ? '#' + start : '';
			} else if ( prefix === 'ch' ) {
				target_url = obj.matches[0];
			}

			try {
				const response = await fetch(preview.cors + target_url);

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();
				if ( !data ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				let matches = [];
				if ( prefix === 'lv' ) {
					iframe_src = target_url;
				} else if ( prefix === 'ch' ) {
					const url = $(data).filter('meta[property="og:url"]').attr('content') || '';
					if ( !url ) {
						console.error('Error: the terminal url is not found');
						setPreviewCard(obj);
						return false;
					}

					matches = url.match(preview.reg_exps.niconicoRegExp);
					id = matches[3];

					iframe_src = 'https://live.nicovideo.jp/embed/' + id;
					iframe_src += ( start ) ? '#' + start : '';
				}

				let thumb = '';
				if ( prefix === 'lv' ) {
					matches = data.match(/<img(?:[^>]+)?src="([^"]+)"(?:[^>]+)?>/);
					thumb = matches ? '<img src="'+ matches[1] +'" />' : '';
				} else if ( prefix === 'ch' ) {
					thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
					thumb = thumb ?'<img src="'+ thumb +'" />' : '';
				}

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} nico-embed-${type}">
							${thumb}
							<iframe src="${iframe_src}" allowfullscreen frameborder="0" scrolling="no" loading="lazy"></iframe>
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
		} else {
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}