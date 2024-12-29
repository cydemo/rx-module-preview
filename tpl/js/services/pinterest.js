export async function setPinterestHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	preview.reg_exps.pinitRegExp = /^https?:\/\/(?:www\.)?pin\.it\/([\w]+)/;

	let matches = [];

	const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

	waitMediaEmbed();

	// PIN.IT
	if ( !obj.matches[1] && !obj.matches[2] ) {
		matches = obj.paste.match(preview.reg_exps.pinitRegExp);
		if ( matches && matches[1] ) {
			const id = matches[1];
			const target_url = 'https://api.pinterest.com/url_shortener/' + id + '/redirect/';

			try {
				const response = await fetch(preview.cors + target_url + '&format=short');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.text();
				if ( !data ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				matches = data.match(preview.reg_exps.pinterestRegExp);
				if ( !matches || !matches[1] ) {
					setPreviewCard(obj);
					return false;
				}

				obj.matches = matches;
				setPinterest(obj);
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}

			return;
		}
	} else if ( obj.matches[1] && obj.matches[2] ) {
		setPinterest(obj);
		return;
	} else {
		setPreviewCard(obj);
		return;
	}
}

	async function setPinterest(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		let target_url = encodeURIComponent('https://www.pinterest.com/oembed.json?url=');
			target_url += encodeURIComponent(obj.matches[0].replace(/\/sent.+$/, ''));

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

			const iframe_src = $(data.html).attr('src') || '';
			if ( !iframe_src ) {
				console.error('Error: iframe url not found');
				setPreviewCard(obj);
				return false;
			}
			const thumb = data.thumbnail_url ? '<img src='+ data.thumbnail_url +' style="display: none;" />' : '';

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} pinterest-embed" style="width: ${data.width}px; height: ${data.height}px; max-width: 100%;">
						${thumb}
						<iframe src="${iframe_src}" frameborder="no" scrolling="no" loading="lazy"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}