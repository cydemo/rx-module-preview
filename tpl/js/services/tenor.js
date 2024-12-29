export async function setTenorHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

	waitMediaEmbed();

	const target_url = obj.matches[0];

	// TENOR.gif
	if ( !obj.matches[1] && obj.matches[2] ) {
		try {
			const response = await fetch(preview.cors + target_url + '&format=short');
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			let data = await response.text();
			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			obj.url = data;
			setTenor(obj);
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		}

		return;
	} else if ( obj.matches[1] && !obj.matches[2] ) {
		obj.url = target_url;
		setTenor(obj);
		return;
	} else {
		setPreviewCard(obj);
		return;
	}
}

	async function setTenor(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		const target_url = obj.url;

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

			const matches = data.match(/<script.+type="application\/ld\+json">([^<]+)<\/script>/);
			if ( !matches ) {
				console.error('Error: cannot read the data');
				setPreviewCard(obj);
				return false;
			}

			data = JSON.parse($.trim(matches[1]));
			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const iframe_src = data.image.embedUrl;
			if ( !iframe_src ) {
				console.error('Error: iframe url not found');
				setPreviewCard(obj);
				return false;
			}
			const thumb = data.image.contentUrl ? '<img src="'+ data.image.contentUrl +'"/>' : '';

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} tenor-video-embed">
						${thumb}
						<iframe src="${iframe_src}" frameborder="0" loading="lazy" allowtransparency="true" allowfullscreen="true" scrolling="no"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}