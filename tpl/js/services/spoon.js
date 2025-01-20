export async function setSpoonHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] || !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const lang = obj.matches[1];
		const type = obj.matches[2];
		const id = obj.matches[3];

		if ( (['cast', 'playlist', 'profile'].includes(type) && !$.isNumeric(id)) || (type === 'live' && !id.startsWith('@')) ) {
			console.error('Error wrong '+ title +' url');
			return;
		}

		obj.type = type;
		let target_url = '';
		if ( type === 'cast' ) {
			target_url = 'https://'+ lang +'-api.spooncast.net/casts/' + id + '/';
		} else if ( type === 'live' ) {
			target_url = 'https://'+ lang +'-api.spooncast.net/profiles/' + id.replace('@', '') + '/meta/';
		} else if ( type === 'playlist' ) {
			target_url = 'https://'+ lang +'-api.spooncast.net/storages/' + id + '/casts/';
		} else if ( type === 'profile' ) {
			target_url = 'https://'+ lang +'-api.spooncast.net/users/' + id + '/';
		}

		$.getJSON(target_url).done(function(response) {
			if ( !response || response.detail !== 'Success' ) {
				console.error('Error fetching '+ title +' data');
				setPreviewCard(obj);
				return false;
			}
			let data = response.results[0];

			if ( type === 'cast' || type === 'playlist' ) {
				if ( type === 'playlist' ) {
					data.list_id = id;
				}
				setSpooncastContent(obj, data);
			} else if ( type === 'live' ) {
				if ( data.current_live_id ) {
					target_url = 'https://kr-api.spooncast.net/lives/' + data.current_live_id + '/';

					$.getJSON(target_url).done(function(response) {
						if ( !response || response.detail !== 'Success' ) {
							console.error('Error fetching '+ title +' data');
							setPreviewCard(obj);
							return false;
						}

						let data = response.results[0];
						data.author.live_url = 'https://'+ lang +'-api.spooncast.net/profiles/' + id.replace('@', '') + '/meta/';
						setSpooncastContent(obj, data);
					}).fail(function() {
						console.error('Error fetching '+ title +' data');
						setPreviewCard(obj);
						completeMediaEmbed();
					});
				} else {
					obj.url = 'https://kr-api.spooncast.net/users/' + data.id + '/';
					setSpooncastPreviewCard(obj);
				}
			} else if ( type === 'profile' ) {
				obj.url = target_url;
				setSpooncastPreviewCard(obj);
			}
		}).fail(function() {
			console.error('Error fetching '+ title +' data');
			setPreviewCard(obj);
			completeMediaEmbed();
		});
	} catch(error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function setSpooncastContent(obj, data) {
		const { insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		let video_title = data.title;
		let image_url, video_url;
		if ( obj.type === 'cast' ) {
			image_url = data.img_url.replace('http://', 'https://');
			video_url = data.voice_url.replace('http://', 'https://');
		} else if ( obj.type === 'live' ) {
			image_url = data.author.profile_url.replace('http://', 'https://');
			video_url = data.author.live_url;
		} else if ( obj.type === 'playlist' ) {
			video_title = data.author.nickname;
			image_url = data.author.profile_url.replace('http://', 'https://');
			video_url = data.voice_url.replace('http://', 'https://');
		}

		const thumb = `<img src="${image_url}" />`;
		let iframe_src = '/modules/preview/libs/media_embed.iframe.php' +
			'?service=' + obj.service + '&type=' + obj.type + '&url=' + video_url + '&data=' + video_title + '|@|' + image_url;
		if ( obj.type === 'playlist' ) {
			iframe_src += '&list_id=' + data.list_id;
		}

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} spoon-embed short_form">
					${thumb}
					<iframe src="${iframe_src}" data-frame-id="spoon-${Date.now()}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" scroling="no" loading="lazy"></iframe>
				</div>
			</div>`;
		insertMediaEmbed(obj);
		completeMediaEmbed();
	}

	async function setSpooncastPreviewCard(obj) {
		const { setPreviewCard, setPreviewCardByData, completeMediaEmbed } = await import('./_functions.js');

		$.getJSON(obj.url).done(function(response) {
			if ( !response || response.detail !== 'Success' ) {
				console.error('Error fetching '+ title +' data');
				setPreviewCard(obj);
				return false;
			}
			const data = response.results[0];

			obj.data_obj = {
				site_name: 'www.spooncast.net',
				image: data.profile_url.replace('http://', 'https://'),
				title: data.description,
				description: data.self_introduction,
				author: data.nickname
			};

			setPreviewCardByData(obj);
			return false;
		}).fail(function() {
			console.error('Error fetching '+ title +' data');
			setPreviewCard(obj);
			completeMediaEmbed();
		});
	}