export async function set4sharedHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const id = obj.matches[2];

		const target_url = obj.matches[0];

		if ( type === 's/f' ) {
			try {
				const response = await fetch(preview.cors + encodeURIComponent(target_url) + '&format=short');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.text();
				if ( !data ) {
					console.error('Error: '+ title +' data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				const matches = data.match(preview.reg_exps['4sharedRegExp']);
				if ( !matches || !matches[1] || !matches[2] ) {
					console.error('Error: the final url is something wrong');
					setPreviewCard(obj);
					return false;
				}

				obj.matches = matches;
				const final_type = matches[1];
				if ( final_type === 'mp3/' || final_type === 'music/' ) {
					set4sharedMusic(obj, id);
				} else if ( final_type === 'video/' ) {
					set4sharedVideo(obj, id);
				} else {
					console.error('Error: the final url is something wrong');
					setPreviewCard(obj);
					return false;
				}
			} catch(error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
		} else if ( type === 'mp3/' || type === 'music/' ) {
			set4sharedMusic(obj, id);
		} else if ( type === 'video/' ) {
			set4sharedVideo(obj, id);
		} else {
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

async function get4sharedData(target_url) {
	const response = await fetch(preview.cors + encodeURIComponent(target_url) + '&format=html');
	if (!response.ok) {
		return false;
		throw new Error('Network response was not ok');
	}

	const data = await response.text();
	return data;
}

async function set4sharedMusic(obj, id) {
	const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

	const iframe_src = 'https://www.4shared.com/web/embed/audio/file/'+ id +'?type=NORMAL&widgetWidth=640&showArtwork=true&lightTheme=true&playlistHeight=0';
	const target_url = iframe_src;

	try {
		const data = await get4sharedData(target_url);
		if ( !data ) {
			console.error('Error: '+ obj.service +' data is empty or wrong');
			setPreviewCard(obj);
			return false;
		}
		const thumb = '<img src="' + $(data).find('.jsBigCoverUrl').val() + '" />';

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} 4shared-embed-music">
					${thumb}
					<iframe src="${iframe_src}" frameborder="no" scrolling="no" loading="lazy"></iframe>
				</div>
			</div>
		`;
		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error fetching '+ obj.service +' data:', error);
		setPreviewCard(obj);
		return false;
	}
}

async function set4sharedVideo(obj, id) {
	const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

	const iframe_src = 'https://www.4shared.com/web/embed/file/' + id;
	const target_url = obj.matches[0];

	try {
		const data = await get4sharedData(target_url);
		if ( !data ) {
			console.error('Error: '+ obj.service +' data is empty or wrong');
			setPreviewCard(obj);
			return false;
		}

		const matches = data.match(/poster[^'"]+['|"]([^'"]+)/);
		if ( matches ) {
			const thumb = '<img src="' + matches[1] + '" />';
			$('<img />').attr('src', matches[1]).load(function() {
				const ratio = (this.naturalHeight / this.naturalWidth * 100).toFixed(2);
				const style = ' style="padding-bottom: '+ ratio +'%;"';
				let short_form = '';
				if ( ratio > 100 ) {
					short_form = ' short_form';
				}

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} 4shared-embed-video${short_form}"${style}>
							${thumb}
							<iframe src="${iframe_src}" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			});
			return false;
		}
	} catch (error) {
		console.error('Error fetching '+ obj.service +' data:', error);
		setPreviewCard(obj);
		return false;
	}
}