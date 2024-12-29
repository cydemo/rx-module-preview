export async function setStreamableHtml(obj) {
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
		const target_url = 'https://api.streamable.com/oembed.json?url=' + obj.matches[0];

		try {
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

			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const iframe_src = $(data.html).attr('src') || '';
			if ( !iframe_src ) {
				console.error('Error: iframe url not found');
				setPreviewCard(obj);
				return false;
			}
			const style = 'padding-bottom: '+ ((data.height / data.width) * 100) +'%;';
			const thumb = data.thumbnail_url ? '<img src="'+ data.thumbnail_url.replace(/^\/\//, 'https://') +'" />' : '';

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}" style="${style}">
						${thumb}
						<iframe src="${iframe_src}?loop=0" frameborder="0" loading="lazy" allowfullscreen></iframe>
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