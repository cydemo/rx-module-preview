export async function setDailymotionHtml(obj) {
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

		const type = obj.matches[1] ?? 'video';
		const id = obj.matches[2];
		const list = obj.matches[3] ? '&playlist=' + obj.matches[3] : '';
		let style = '';
		let target_url = 'https://api.dailymotion.com/';

		if ( type === 'video' ) {
			target_url += 'video/' + id + '?fields=id,title,owner,thumbnail_url,aspect_ratio';
			try {
				const response = await fetch(preview.cors + encodeURIComponent(target_url), {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.json();
				if (!data) {
					setPreviewCard(obj);
					return false;
				}

				const thumb = data.thumbnail_url ? `<img src="${data.thumbnail_url}" />` : '';
				if ( data.aspect_ratio < 0.67 ) {
					style = ' youtube-shorts';
				} else {
					style = '" style="padding-bottom: ' + ( 100 / data.aspect_ratio ).toFixed(2) + '%;';
				}

				const iframe_src = `https://geo.dailymotion.com/player.html?${type}=${id}&mute=true${list}`;
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}${style}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="0" allowfullscreen allow="fullscreen; picture-in-picture; web-share"></iframe>
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
		} else if ( type === 'playlist' ) {
			target_url += 'playlist/' + id + '?fields=id,name,owner,private,thumbnail_720_url,videos_total';
			try {
				const response = await fetch(preview.cors + encodeURIComponent(target_url), {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.json();
				if (!data || data.error || data.private || data.videos_total < 1) {
					setPreviewCard(obj);
					return false;
				}

				const thumb = data.thumbnail_720_url ? `<img src="${data.thumbnail_720_url}" />` : '';
				const iframe_src = `https://geo.dailymotion.com/player.html?${type}=${id}&mute=true`;
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="0" allowfullscreen allow="fullscreen; picture-in-picture; web-share"></iframe>
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