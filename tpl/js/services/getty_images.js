export async function setGettyImagesHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[3]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const name = obj.matches[2];
		const id = obj.matches[3];
		const allowed_types = [
			'news-photo', 'photo', 'illustration'
		];

		if ( type === undefined || $.inArray(type, allowed_types) !== -1  ) {
			const target_url = 'https://embed.gettyimages.com/oembed?url=https://www.gettyimages.com/detail/'+ id;

			try {
				const response = await fetch(preview.cors + encodeURIComponent(target_url) + '&format=json');
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

				if ( !data || data.message ) {
					console.error('Error: '+ title +' data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				const hash = data.html.match(/gie.widgets.load\(\{([^})]+)/)[1];
				let queries = {};
				let list = [];
				$.map(hash.split(','), function(v, i) {
					list = v.split(':');
					queries[$.trim(list[0])] = $.trim(list[1].replace(/\'/g, ''));
				});

				const ratio = ((data.height / data.width) * 100).toFixed(2);
				const style = 'max-width: '+ data.width +'px; height: '+ ratio +'%; max-height: '+ data.height +'px;';
				const thumb = `<img src="${data.thumbnail_url}" />`;
				const iframe_src = `//embed.gettyimages.com/embed/${id}?et=${queries.id}&tld=com&sig=${queries.sig}&caption=true`;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} gettyimage-embed" style="${style}">
							${thumb}
							<iframe src="${iframe_src}" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
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