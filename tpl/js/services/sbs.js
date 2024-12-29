export async function setSbsHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	const matches = obj.matches;
	let type = '';
	let name = 'SBS';
	let id = '';

	if ( matches[1] === 'www' && matches[2].indexOf('S') === 0 ) {
		type = 'live';
		name = 'live';
		id = matches[2];
	} else if ( matches[1] === 'programs' || matches[1] === 'allvod' ) {
		if ( (matches[3] === 'vod' || matches[3] === 'clip') && matches[4] ) {
			type = matches[3];
			id = matches[4];
		}
	} else if ( matches[1].endsWith('news') && matches[5] ) {
		type = 'news';
		id = matches[5];
	}

	if ( !type ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	let target_url = '';
	let iframe_src = '';
	if ( type === 'news' ) {
		iframe_src = 'https://news.sbs.co.kr/news/newsPlayerIframe.do?news_id=' + id;
	} else {
		iframe_src = 'https://static.cloud.sbs.co.kr/sbs-player/index.html?target=' + name + '&media=' + id;
	}
	let thumb = '';

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		if ( type === 'live' ) {
			target_url = 'https://apis.sbs.co.kr/play-api/1.0/onair/channel/' + id;

			try {
				const response = await fetch(preview.cors + target_url + '&format=json');
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

				if ( !data || !data.onair ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				thumb = data.onair.info.thumbimg ? '<img src="'+ data.onair.info.thumbimg +'" />' : '';
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" allowfullscreen="" frameborder="0" scrolling="no" loading="lazy"></iframe>
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
		} else if ( type === 'vod' || type === 'clip' ) {
			target_url = 'https://apis.sbs.co.kr/play-api/1.0/sbs_vodall/' + id;

			try {
				const response = await fetch(preview.cors + target_url + '&format=json');
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

				thumb = data.vod.defaultimage ?? data.vod.source.thumbnail.medium;
				thumb = '<img src="'+ thumb +'" />';
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" allowfullscreen="" frameborder="0" scrolling="no" loading="lazy"></iframe>
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
		} else if ( type === 'news' ) {
			target_url = 'https://api-gw.sbsdlab.co.kr/v1/news_front_api/article/info/' + id;

			try {
				const response = await fetch(preview.cors + target_url + '&format=json');
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
				if ( !data.item.VIDEO_PLAYER ) {
					console.error('Error: data (of a video item) is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				thumb = data.item.ARTICLEIMG ? '<img src="'+ data.item.ARTICLEIMG +'" />' : '';
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" allowfullscreen="" frameborder="0" scrolling="no" loading="lazy"></iframe>
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