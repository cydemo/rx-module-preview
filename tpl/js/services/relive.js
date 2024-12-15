export async function setReliveHtml(obj) {
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
		const target_url = 'https://www.relive.cc/view/'+ id +'/widget?r=oembed';
		const iframe_src = target_url;

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

			const matches = data.match(/poster(?:['|"|:]+)(https?:\/\/.+.png(?:\?[^"]+)?)/);
			const thumb = matches ? '<img src="'+ matches[1] +'" />' : '';

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} relive-embed">
						${thumb}
						<iframe src="${iframe_src}" allowfullscreen="" frameborder="0" scrolling="no"></iframe>
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