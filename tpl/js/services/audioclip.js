export async function setAudioclipHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, setPreviewCardByData, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const type_id = obj.matches[2];
		const content_id = $.isNumeric(obj.matches[4]) ? obj.matches[4] : '';

		let url = 'https://audioclip.naver.com/' + type + '/' + type_id;
		if (type === 'channels') {
			url += (content_id) ? '/clips/' + content_id : '/clips/1';
		}

		try {
			let target_url;
			let data_obj = {};

			if (type === 'curations') {
				target_url = 'https://audioclip.naver.com/api/v1/curations/' + type_id;
				let response = await fetch(preview.cors + target_url);
				let data = await response.json();

				if (!data || data.totalCount < 1) {
					setPreviewCard(obj);
					return;
				}

				data_obj.title = data.title ?? '';
				if (data.imageUrl) {
					data_obj.image = data.imageUrl;
					data_obj.description = data.description ?? data.subtitle;
					data_obj.site_name = new URL(url).hostname;

					obj.data_obj = data_obj;
					setPreviewCardByData(obj);
					return;
				} else {
					target_url = 'https://audioclip.naver.com/api/curations/' + type_id + '/contents';
					response = await fetch(preview.cors + target_url);
					data = await response.json();

					if (!data || data.totalCount < 1) {
						setPreviewCard(obj);
						return;
					}

					data = data.episodes[0];
					data_obj.image = data.imageUrl;
					if (!data_obj.title) {
						data_obj.title = data.channelName;
						data_obj.description = data.episodeTitle + ':::' + data.description;
					} else {
						data_obj.description = data.channelName + ':::' + data.episodeTitle;
					}
					data_obj.site_name = new URL(url).hostname;

					obj.data_obj = data_obj;
					setPreviewCardByData(obj);
					return;
				}
			} else if (type === 'lives') {
				target_url = 'https://audioclip.naver.com/api/lives/' + type_id;
				const response = await fetch(preview.cors + target_url);
				const data = await response.json();

				if (!data) {
					setPreviewCard(obj);
					return;
				}

				data_obj.title = data.title ?? data.channelName;
				data_obj.description = data.description ?? data.channelName;
				data_obj.image = data.thumbnailUrl ?? '';
				data_obj.author = data.channelName ?? '';
				data_obj.site_name = new URL(url).hostname;

				obj.data_obj = data_obj;
				setPreviewCardByData(obj);
				return;
			} else {
				target_url = 'https://audioclip.naver.com/oembed?url=' + url;
				const response = await fetch(preview.cors + target_url);
				const data = await response.json();

				if (!data || !data.html) {
					setPreviewCard(obj);
					return;
				}

				let iframe_src = 'https://player.audiop.naver.com/player?cpId=audioclip&cpMetaId=';
				if (type === 'channels') {
					iframe_src += 'CH_' + type_id + '_EP_';
					iframe_src += content_id ? content_id : '1';
				} else if (type === 'audiobooks') {
					iframe_src += type_id;
				}
				const thumb = data.thumbnail_url ? '<img src="' + data.thumbnail_url + '" />' : '';

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} audioclip-embed">
							${thumb}
							<iframe src="${iframe_src}" frameborder="0" scrolling="no"></iframe>
						</div>
					</div>`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			}
		} catch (error) {
			console.error('Failed to fetch data: ', error);
			setPreviewCard(obj);
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}