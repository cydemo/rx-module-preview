export async function setChzzkHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed, setPreviewCardByData  } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[2];
		const type = ( !obj.matches[1] && id.length === 32 ) ? 'channel' : obj.matches[1];
		let target_url = 'https://api.chzzk.naver.com/service/';
		obj.data_obj = {
			site_name: 'chzzk.naver.com'
		};

		if ( type === 'clips' ) {
			target_url += 'v1/clips/' + id + '/detail?optionalProperties=COMMENT&optionalProperties=PRIVATE_USER_BLOCK&optionalProperties=PENALTY';
			try {
				const response = await fetch(preview.cors + target_url, {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.json();
				if (!data || data.code !== 200 || data.message !== null) {
					setPreviewCard(obj);
					return false;
				}
				const thumb = data.content.thumbnailImageUrl ? '<img src="'+ data.content.thumbnailImageUrl +'" />' : ''; '';

				const iframe_src = 'https://chzzk.naver.com/embed/clip/' + id;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" scrolling="no" frameborder="no" allow="web-share" allowfullscreen></iframe>
						</div>
					</div>`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
		} else if ( type === 'live' ) {
			target_url += 'v3/channels/' + id + '/live-detail';
			try {
				const response = await fetch(preview.cors + target_url, {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.json();
				if (!data || data.code !== 200 || data.message !== null) {
					setPreviewCard(obj);
					return false;
				}
				data = data.content;

				obj.data_obj.image = data.defaultThumbnailImageUrl ?? data.channel.channelImageUrl;
				obj.data_obj.title = data.channel.channelName + ' - ' + data.liveTitle;
				obj.data_obj.description = ( data.tags.length > 0 ) ? data.tags.join(', ') : data.liveCategoryValue + ' > ' + data.liveTitle;
				obj.data_obj.author = data.channel.channelName;

				setPreviewCardByData(obj);
				return false;
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
		} else if ( type === 'video' ) {
			target_url += 'v3/videos/' + id;
			try {
				const response = await fetch(preview.cors + target_url, {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.json();
				if (!data || data.code !== 200 || data.message !== null) {
					setPreviewCard(obj);
					return false;
				}
				data = data.content;

				obj.data_obj.image = data.thumbnailImageUrl ?? data.channel.channelImageUrl;
				obj.data_obj.title = data.channel.channelName + ' - ' + data.videoTitle;
				obj.data_obj.description = data.videoTitle;
				obj.data_obj.author = data.channel.channelName;

				setPreviewCardByData(obj);
				return false;
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
		} else if ( type === 'channel' ) {
			target_url += 'v1/channels/' + id;
			try {
				const response = await fetch(preview.cors + target_url, {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.json();
				if (!data || data.code !== 200 || data.message !== null) {
					setPreviewCard(obj);
					return false;
				}
				data = data.content;

				obj.data_obj.image = data.channelImageUrl;
				obj.data_obj.title = data.channelName + ' 채널 - CHZZK';
				obj.data_obj.description = data.channelDescription;
				obj.data_obj.author = data.channelName;

				setPreviewCardByData(obj);
				return false;
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