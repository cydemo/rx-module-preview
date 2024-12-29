export async function setFc2Html(obj) {
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

		const type = obj.matches[1];
		const id = obj.matches[2];

		if ( type === 'video' ) {
			const target_url = 'https://video.fc2.com/api/v3/videoplayer/' + id;
			const iframe_src = 'https://video.fc2.com/embed/player/' + id + '/';
			try {
				const response = await fetch(preview.cors + target_url, {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.json();
				if (!data) {
					setPreviewCard(obj);
					return false;
				}
				const thumb = data.poster ? `<img src="${data.poster.replace(/\?.+$/, '')}" />` : '';
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" loading="lazy" allowfullscreen="1"></iframe>
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
			const iframe_src = 'https://live.fc2.com/embedPlayer/?id='+ id +'&lang=ko&suggest=1&thumbnail=1&adultaccess=1';
			const thumb = '<img src="https://live-storage.fc2.com/thumb/'+ id +'/thumb.jpg" />';

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}">
						${thumb}
						<iframe src="${iframe_src}" loading="lazy" allowfullscreen="1"></iframe>
					</div>
				</div>
			`;

			insertMediaEmbed(obj);
			completeMediaEmbed();
		} else {
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}