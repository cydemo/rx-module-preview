export async function setFlickrHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	try {
		const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		if ( obj.matches[1] ) {
			let type = obj.matches[1];
			const id = obj.matches[2];

			switch (type) {
				case('f') : type = 'favorites'; break;
				case('g') : type = 'group'; break;
				case('go') : type = 'grouppool'; break;
				case('ps') : type = 'photostream'; break;
				case('s') : type = 'photoset'; break;
				case('y') : type = 'gallery'; break;
				default : setPreviewCard(obj); return false;
			}

			const target_url = `https://www.flickr.com/short_urls.gne?${type}=${id}`;

			try {
				const response = await fetch(preview.cors + encodeURIComponent(target_url) + '&format=short');
				if (!response.ok) {
					console.error('Error fetching '+ title +' data');
				}

				const data = await response.text();
				if ( !data ) {
					setPreviewCard(obj);
					return false;
				}
				obj.url = $.isArray(data) ? data[0]: data;
				await setFlickr(obj);
			} catch (error) {
				setPreviewCard(obj);
				return false;
				console.error('Error fetching '+ title +' data:', error);
			}
		} else {
			obj.url = obj.matches[0];
			await setFlickr(obj);
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function setFlickr(obj) {
		const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
			return p1.toUpperCase();
		});
		const flickrRegExp = /^https?:\/\/(?:www\.)?flic(?:kr)?.(?:com|kr)\/(?:(f|go?|ps|s|y)\/)?(.+)/;
		const target_url = 'https://www.flickr.com/services/oembed/?format=json&url=' + obj.url;

		try {
			const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

			const response = await fetch(preview.cors + encodeURIComponent(target_url) + '&format=json');
			if (!response.ok) {
				console.error('Error fetching '+ title +' data');
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

			if ( !data || !data.width || !data.html ) {
				console.error('Error: '+ title +' data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			let thumb = '';
			if ( data.flickr_type !== 'video' ) {
				thumb = data.html.match(/(.+)<script.+script>/)[1];
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} flickr-embed">
							${thumb}
						</div>
					</div>
				`;
			} else {
				thumb = data.thumbnail_url ? `<img src="${data.thumbnail_url}" >` : '';
				const ratio = ((100 * data.thumbnail_height) / data.thumbnail_width).toFixed(2);
				const id = data.web_page.match(flickrRegExp)[2].replace(/[^0-9]+/, '');
				const iframe_src = 'https://embedr.flickr.com/photos/'+ id;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}" style="padding-bottom: ${ratio}%">
							${thumb}
							<iframe src="${iframe_src}" frameborder="0" loading="lazy" allowfullscreen></iframe>
						</div>
					</div>
				`;
			}

			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			console.error('Error importing or executing '+ title +' module:', error);
		}
	}