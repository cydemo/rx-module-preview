export async function setBilibiliHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, procPreviewImageFileInfo } = await import('./_functions.js');

		waitMediaEmbed();

		const type = (obj.matches[1] === 'live') ? obj.matches[1] : obj.matches[2];
		let id = obj.matches[3];
		let list = '';
		let hash = '';

		if ( type === 'video' ) {
			await setBilibili(obj, id);
		} else if ( type === 'bangumi' ) {
			list = id.match(/(\w{2})(\d+)/);
			if ( list[1] === 'ss' ) {
				hash = 'season_id=' + list[2];
			} else if ( list[1] === 'ep' ) {
				hash = 'ep_id=' + list[2];
			}

			const target_url = 'https://api.bilibili.com/pgc/view/web/season?'+ hash;
			try {
				const response = await fetch(preview.cors + target_url, {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.json();
				if (!data || data.code !== 0) {
					setPreviewCard(obj);
					return false;
				}

				if ( list[1] === 'ss' ) {
					id = data.result.episodes[0].bvid;
				} else if ( list[1] === 'ep' ) {
					$.each(data.result.episodes, function(i, v) {
						if ( v.id == list[2] ) {
							id = v.bvid;
							return false;
						}
					});
				}
				
				await setBilibili(obj, id);
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
		} else if ( type === 'live' ) {
			const target_url = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id=' + id;
			try {
				const response = await fetch(preview.cors + target_url, {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.json();
				if (!data || data.code !== 0) {
					setPreviewCard(obj);
					return false;
				}

				obj.data_obj = {
					inserting_type: 'media_embed',
					image_url: data.data.room_info.cover,
					mid: window.current_mid,
					editor_sequence: preview.editor_container.data().editorSequence,
					allow_chunks: 'Y'
				};
				
				const iframe_src = 'https://www.bilibili.com/blackboard/live/live-activity-player.html?cid=' + id + '&quality=0';
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							<img src="${obj.data_obj.image_url.replace('http:', '')}" />
							<iframe src="${iframe_src}" allowfullscreen="true"></iframe>
						</div>
					</div>
				`;

				procPreviewImageFileInfo(obj);
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function setBilibili(obj, id) {
		const { setPreviewCard, procPreviewImageFileInfo } = await import('./_functions.js');

		const target_url = 'https://api.bilibili.com/x/web-interface/view?bvid=' + id;
		try {
			const response = await fetch(preview.cors + target_url, {format: 'json'});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.json();
			if (!data || data.code !== 0) {
				setPreviewCard(obj);
				return false;
			}

			obj.data_obj = {
				inserting_type: 'media_embed',
				image_url: data.data.pic,
				mid: window.current_mid,
				editor_sequence: preview.editor_container.data().editorSequence,
				allow_chunks: 'Y'
			};

			const iframe_src = '//player.bilibili.com/player.html?bvid='+ id +'&autoplay=0';
			obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							<img src="${data.data.pic.replace('http:', '')}" />
							<iframe src="${iframe_src}" allowfullscreen="true"></iframe>
						</div>
					</div>
				`;

			procPreviewImageFileInfo(obj);
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		}
	}