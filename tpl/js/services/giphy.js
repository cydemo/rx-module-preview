export async function setGiphyHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();
		
		const id = obj.matches[2];
		const target_url = 'https://giphy.com/services/oembed?url=' + obj.matches[0];

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
				console.error('Error: '+ title +' data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const type = data.type;
			let thumb = '';
			let style = '';
			let iframe_html = '';

			if ( type === 'photo' ) {
				thumb = `<img src="${data.url}" />`;
			} else if ( type === 'video' ) {
				thumb = `<img src="${data.thumbnail_url}" />`;
				style = `padding-bottom: ${((100 * data.height) / data.width).toFixed(2)}%;`;
				iframe_html = `<iframe src="https://giphy.com/embed/${id}" allowfullscreen="true" frameborder="0" scrolling="no" allowFullScreen></iframe>`;
			} else {
				setPreviewCard(obj);
				return false;
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} giphy-embed giphy-embed-${type}" style="${style}">
						${thumb}
						${iframe_html}
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