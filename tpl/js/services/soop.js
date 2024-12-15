export async function setSoopHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed, setPreviewCardByData, procPreviewImageFileInfo } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const name = obj.matches[2];
		const id = obj.matches[3];
		const style = obj.matches[4] ?? '';
		const hash = obj.matches[5] ? Number(obj.matches[5]) : 1;
		
		let target_url = '';
		let iframe_src = '';

		const allowed_types = ['play', 'vod', 'ch'];
		if ( $.inArray(type, allowed_types) === -1 ) {
			setPreviewCard(obj);
			return false;
		}

		if ( type === 'vod' ) {
			if ( name !== 'player' && name !=='ST' ) {
				setPreviewCard(obj);
				return false;
			}

			iframe_src = 'https://vod.sooplive.co.kr/player/' + id + '/embed?showChat=false&autoPlay=false&mutePlay=false';

			if ( style === 'catch' ) {
				iframe_src += '&type=catch';
			}
		} else if ( type === 'play' ) {
			iframe_src = obj.matches[0] + '/embed';
		}

		if ( style === 'catchstory' ) {
			target_url = 'https://api.m.sooplive.co.kr/catchstory/a/view?nStoryIdx=' + id;

			try {
				const response = await fetch(preview.cors + target_url);
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

				if ( !data || !data.data[0] ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				data = data.data[0].catch_list[hash - 1];
				const thumb = '<img src="'+ data.thumb +'" />';
				iframe_src = 'https://vod.sooplive.co.kr/player/' + data.title_no + '/embed?showChat=false&autoPlay=false&mutePlay=false';

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen="true"></iframe>
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
			if ( type === 'ch' ) {
				target_url = 'https://chapi.sooplive.co.kr/api/' + name + '/station';

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

					if ( !data ) {
						console.error('Error: data is empty or wrong');
						setPreviewCard(obj);
						return false;
					}

					obj.data_obj = {
						image: data.profile_image,
						title: data.station.user_nick + '의 채널',
						description: data.station.station_name + ' - ' + data.station.display.profile_text,
						author: data.station.user_nick,
						site_name: 'ch.sooplive.co.kr'
					};

					setPreviewCardByData(obj);
					return false;
				} catch (error) {
					console.error('Error fetching '+ title +' data:', error);
					setPreviewCard(obj);
					return false;
				}
			} else if ( type === 'play' ) {
				target_url = 'https://liveimg.sooplive.co.kr/m/' + id;
				const thumb = '<img src="' + target_url + '" />';

				$('<img />').attr('src', target_url).load(function() {
					obj.data_obj = {
						inserting_type: 'media_embed',
						image_url: target_url,
						mid: window.current_mid,
						editor_sequence: preview.editor_container.data().editorSequence,
						allow_chunks: 'Y'
					};

					obj.html = `
						<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
							<div class="${preview.iframe_wrapper}">
								${thumb}
								<iframe src="${iframe_src}" allowfullscreen="true"></iframe>
							</div>
						</div>
					`;

					procPreviewImageFileInfo(obj);
				}).error(function() {
					obj.html = `
						<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
							<div class="${preview.iframe_wrapper}">
								${thumb}
								<iframe src="${iframe_src}" allowfullscreen="true"></iframe>
							</div>
						</div>
					`;
					insertMediaEmbed(obj);
					completeMediaEmbed();
				});
			} else if ( type === 'vod' ) {
				target_url = obj.matches[0];

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
					
					let thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
						thumb = thumb ? '<img src="'+ thumb +'" />' : '';

					obj.html = `
						<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
							<div class="${preview.iframe_wrapper}">
								${thumb}
								<iframe src="${iframe_src}" frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen="true"></iframe>
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
			}
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}