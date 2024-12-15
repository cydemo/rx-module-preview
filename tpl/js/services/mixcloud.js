export async function setMixcloudHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[1];
		const list = obj.matches[2];
		const target_url = 'https://www.mixcloud.com/oembed/?url=' + encodeURIComponent(obj.matches[0]);
		const iframe_src = 'https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=%2F'+ name +'%2F'+ list +'%2F';

		try {
			const response = await fetch(preview.cors + encodeURIComponent(target_url) + '&format=json');
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

			const thumb = data.image ? '<img src="'+ data.image +'" />' : '';
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} mixcloud-embed">
						${thumb}
						<iframe src="${iframe_src}"></iframe>
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