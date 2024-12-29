export async function setAirbnbHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[1]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[1];
		const style = 'width: 450px; height: 480px;';

		const target_url = `https://www.airbnb.co.kr/embeddable/home?id=${id}`;
		const iframe_src = target_url;

		let thumb = '';

		try {
			const response = await fetch(preview.cors + encodeURIComponent(target_url));
			if (!response.ok) {
				console.error('Error fetching '+ title +' data');
			}

			const data = await response.text();
			const matches = data.match(/"picture_url":"([^"]+)"/);
			thumb = matches ? `<img src="${matches[1]}" style="display: none" />` : '';
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
		}

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} airbnb-embed" style="${style}">
					${thumb}
					<iframe src="${iframe_src}" frameborder="0" scrolling="no" loading="lazy" style="${style}"></iframe>
				</div>
			</div>`;

		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}