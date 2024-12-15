export async function setRedditHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] || !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[1];
		const id = obj.matches[2];
		const type = obj.matches[3];
		const hash = obj.matches[4];
		const target_url = 'https://www.redditmedia.com/'+ name +'/comments/'+ id +'/'+ type +'/';

		let iframe_src = '';
		let thumb = '';

		try {
			const response = await fetch(preview.cors + target_url + '.json' + '&format=json');
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
			data = data[0].data.children[0].data;

			iframe_src = 'https://www.redditmedia.com/'+ name +'/comments/'+ id +'/'+ type +'/';
			if ( hash ) {
				iframe_src += hash + '?depth=2&amp;showmore=false&amp;embed=true&amp;showtitle=true&amp;context=1&amp;showedits=false';
			} else {
				iframe_src += '?ref_source=embed&amp;ref=share&amp;embed=true&amp;showedits=false';
			}

			if ( data.thumbnail  && data.thumbnail !== 'self' ) {
				if ( data.preview ) {
					thumb = '<img src="'+ data.preview.images[0].source.url +'" />';
				} else {
					thumb = '<img src="'+ data.thumbnail +'" />';
				}
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} reddit-embed">
						${thumb}
						<iframe src="${iframe_src}" sandbox="allow-scripts allow-same-origin allow-popups" scrolling="no"></iframe>
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
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}