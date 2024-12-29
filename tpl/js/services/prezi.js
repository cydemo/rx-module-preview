export async function setPreziHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const id = obj.matches[2];

		let target_url = '';
		let matches = [];

		if ( !type || type === 'p' || type === 'm' ) {
			target_url = obj.matches[0];
			if ( target_url[target_url.length - 1] !== '/' ) {
				target_url += '/';
			}

			try {
				const response = await fetch(preview.cors + encodeURIComponent(target_url));
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.text();
				if ( !data ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				matches = data.match(/var appData = JSON.parse\((".+")\);/);
				if ( !matches ) {
					setPreviewCard(obj);
					return false;
				}

				data = JSON.parse(decodeURIComponent(JSON.parse(matches[1])));
				if ( !data || data.oid !== id ) {
					setPreviewCard(obj);
					return false;
				}

				const thumb = data.previewUrl ? '<img src="'+ data.previewUrl +'" />' : '';
				const iframe_src = 'https://prezi.com/p/embed/' + id;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>
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
		} else if ( type === 'v' ) {
			target_url = 'https://prezi.com/v/oembed/?url=' + obj.matches[0];

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

				const thumb = data.thumbnail_url ? '<img src="'+ data.thumbnail_url +'" />' : '';
				const iframe_src = 'https://prezi.com/v/embed/' + id;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>
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
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}