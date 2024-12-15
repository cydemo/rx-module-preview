export async function setTiktokHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] && !obj.matches[4] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

	waitMediaEmbed();

	const target_url = obj.matches[0];
	const type = obj.matches[1];
	const name = obj.matches[2];
	const id = obj.matches[4];

	if ( (type === 'vt' || type === 'vm') && !name && id && !$.isNumeric(id) ) {
		try {
			const response = await fetch(preview.cors + target_url + '&format=short');
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const matches = data.match(preview.reg_exps.tiktokRegExp);
			if ( !matches ) {
				console.error('Error: invalid url-data given');
				setPreviewCard(obj);
				return false;
			}

			if ( matches && matches[2] ) {
				obj.matches = matches;
				setTiktok(obj);
			} else {
				setPreviewCard(obj);
				return false;
			}
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		}
	} else {
		setTiktok(obj);
	}
}

	async function setTiktok(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		const name = obj.matches[2];
		const id = obj.matches[4];
		const url = id ? 'https://www.tiktok.com/video/' + id : 'https://www.tiktok.com/' + name;

		const target_url = 'https://www.tiktok.com/oembed?url=' + url;
		let iframe_src = '';

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
			const thumb = data.thumbnail_url ? '<img src="'+ data.thumbnail_url +'" />' : '';
			if ( id ) {
				iframe_src = 'https://www.tiktok.com/embed/v2/'+ id +'?lang=ko-KR" name="__tt_embed__v'+ id;
			} else {
				iframe_src = 'https://www.tiktok.com/embed/'+ name + '" name="__tt_embed__'+ name;
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} tiktok-embed">
						${thumb}
						<iframe src="${iframe_src}" frameborder="0" scrolling="no" sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-top-navigation allow-same-origin"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
			obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}