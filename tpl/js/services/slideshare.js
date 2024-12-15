export async function setSlideshareHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] || !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1] ?? '';
		const name = obj.matches[2];
		const id = obj.matches[3];
		
		let target_url = '';
		let iframe_src = '';

		if ( type === 'slideshow' && $.isNumeric(id) ) {
			target_url = obj.matches[0];

			try {
				const response = await fetch(preview.cors + target_url);
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.text();
				if ( !data ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				const thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
				const iframe_src = $(data).filter('meta[name="twitter:player"]').attr('content') || '';
				if ( !iframe_src ) {
					setPreviewCard(obj);
					return false;
				}

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" allowfullscreen></iframe>
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
		} else if ( !type && name && id ) {
			target_url = 'https://www.slideshare.net/api/oembed/2?format=json&url=' + obj.matches[0];

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

				const thumb = data.thumbnail_url ? '<img src="'+ data.thumbnail_url +'" />' : '';
				const iframe_src = $(data.html).filter('iframe').attr('src') || '';
				if ( !iframe_src ) {
					setPreviewCard(obj);
					return false;
				}

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" allowfullscreen></iframe>
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