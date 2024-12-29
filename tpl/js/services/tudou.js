export async function setTudouHtml(obj) {
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

		const type = obj.matches[1];
		const id = obj.matches[2];

		const params = {
			client_id: '0edbfd2e4fc91b72',
			video_id: id
		};
		let target_url = 'https://api.youku.com/videos/show.json?';
			target_url += new URLSearchParams(params);
		const iframe_src = 'https://player.youku.com/embed/' + id;

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

			let thumb = '';
			if ( data ) {
				thumb = data.bigThumbnail ? '<img src="'+ data.bigThumbnail +'"/>' : '';
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}">
						${thumb}
						<iframe src="${iframe_src}" frameborder="0" scrolling="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>
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