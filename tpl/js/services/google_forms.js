export async function setGoogleFormsHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[1] ?? '';
		const id = obj.matches[2];

		if ( name === 'd/e' ) {
			obj.url = obj.matches[0];
			setGoogleForms(obj);
			return false;
		} else if ( name === 'd' ) {
			const target_url = `https://docs.google.com/forms/${name}/${id}/viewform`;
			try {
				const response = await fetch(preview.cors + target_url);

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();
				if ( !data ) {
					console.error('Error: '+ title +' data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				const url = $(data).filter('meta[property="og:url"]').attr('content') ?? '';
				if ( !url ) {
					console.error('Error: Can\'t find the full url');
					setPreviewCard(obj);
					return false;
				}
				obj.url = url;

				setGoogleForms(obj);
				return false;
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
		} else if ( !name || name === undefined || name === 'undefined' ) {
			const target_url = obj.matches[0];
			try {
				const response = await fetch(preview.cors + target_url + '&format=short');

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();
				if ( !data ) {
					console.error('Error: '+ title +' data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}
				obj.url = data;

				setGoogleForms(obj);
				return false;
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

	async function setGoogleForms(obj) {
		const target_url = obj.url.replace(/\?.+/, '').setQuery('embedded', 'true');
		const iframe_src = target_url;

		try {
			const { insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

			const response = await fetch(preview.cors + target_url);

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			if ( !data ) {
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} google-forms-embed">
							<iframe src="${iframe_src}" frameborder="no" loading="lazy"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
				return false;
			}

			let thumb = $(data).filter('meta[property="og:image"]').attr('content') ?? '';
			thumb = thumb ? '<img src="' + thumb + '" />' : '';

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} google-forms-embed">
						${thumb}
						<iframe src="${iframe_src}" frameborder="no" loading="lazy"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} google-forms-embed">
						<iframe src="${iframe_src}" frameborder="no" loading="lazy"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		}
	}