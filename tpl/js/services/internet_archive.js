export async function setInternetArchiveHtml(obj) {
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
		
		const id = obj.matches[1];
		const target_url = 'https://archive.org/details/' + id;
		const iframe_src = 'https://archive.org/embed/' + id;

		try {
			const response = await fetch(preview.cors + encodeURIComponent(target_url) + '&format=html');

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			let data = await response.text();
			if ( !data ) {
				console.error('Error: '+ title +' data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const $obj = $($(data).find('#embedcodehere').text());
			if ( !$obj.length ) {
				setPreviewCard(obj);
				return false;
			}

			let thumb = $(data).filter('meta[property="twitter:image"]').attr('content') || '';
			let style = '';
			let width = $(data).filter('meta[property="og:video:width"]').attr('content') || '';
			let height = $(data).filter('meta[property="og:video:height"]').attr('content') || '';
			let ratio = 0;
			if ( width && height ) {
				ratio = (100 * Number(height) / Number(width)).toFixed(2);
			}

			const matches = data.match(/<script\stype="application\/ld\+json">(?:\s+)?({[^<]+)(?:\s+)?<\/script>/);
			if ( !matches || !matches[1] ) {
				setPreviewCard(obj);
				return false;
			}
			data = JSON.parse(matches[1]);

			const type = data.itemListElement[0].item.name.replace(/s$/, '').toLowerCase();
			const allowed_types = ['text', 'video', 'audio', 'software', 'image'];
			if ( $.inArray(type, allowed_types) === -1 ) {
				setPreviewCard(obj);
				return false;
			}

			if ( type === 'video' || type === 'audio' ) {
				if ( type === 'video' ) {
					style = 'padding-bottom: ' + ratio + '%;';
				} else if ( type === 'audio' ) {
					style = 'padding-bottom: 30px';
				}
				thumb = thumb ? `<img src="${thumb}" />` : '';

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}" style="${style}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="no" scrolling="no" allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"></iframe>
						</div>
					</div>
				`;

				insertMediaEmbed(obj);
				completeMediaEmbed();
			} else {
				$('<img />').attr('src', thumb).load(function() {
					var r = (this.naturalHeight / this.naturalWidth).toFixed(4);
					var y = Math.floor(Math.sqrt(230400 * r));
					var x = Math.floor((1 / r) * y);

					ratio = r * 100;
					style = 'padding-bottom: ' + ratio + '%;';
					thumb = thumb ? `<img src="${thumb}" />` : '';

					obj.html = `
						<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false" style="max-width: ${x}px;">
							<div class="${preview.iframe_wrapper}" style="${style}">
								${thumb}
								<iframe src="${iframe_src}" frameborder="no" scrolling="no" allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"></iframe>
							</div>
						</div>
					`;

					insertMediaEmbed(obj);
					completeMediaEmbed();
				}).error(function() {
					setPreviewCard(obj);
					return false;
				});
			}
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}