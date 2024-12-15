export async function setYoutubeHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	const matches = obj.matches;
	const allowed_types = ['shorts', 'embed', 'watch', 'playlist'];
	if ( $.inArray(matches[1], allowed_types) === -1 && (!matches[2] || matches[2].length !== 11) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		let target_url, iframe_src, type, id, queries, start, list, style, name, ratio;

		type = matches[1];
		id = ( matches[2] !== 'videoseries' ) ? matches[2] : '';
		if ( matches[3] ) {
			queries = window.XE.URI(matches[0].replace(/amp\;/g, '')).search(true);
			id = queries.v ? queries.v : id;
			start = queries.t ? '?start=' + queries.t : '';
			start = queries.start ? '?start=' + queries.start : start;
			if ( queries.list ) {
				list = id ? '&list=' + queries.list : '?list=' + queries.list;
			}
		} else {
			start = '';
		}
		target_url = 'https://www.youtube.com/oembed?url=https://www.youtube.com/';
		target_url += id ? 'watch?v=' + id : 'playlist';
		target_url += list ? list : '';

		try {
			const response = await fetch(target_url);

			if (!response.ok) {
				obj.e.editor.showNotification(response.status + ' error occurred', 'warning', 2000);
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

			iframe_src = 'https://www.youtube.com/embed/';
			if ( id && list ) {
				iframe_src += id + list.replace('&', '?') + start.replace('?', '&');
			} else if ( id && !list ) {
				iframe_src += id + start;
				if ( embed_insert_title ) {
					if ( $('[name="title"]').val() === '' && data.title ) {
						$('[name="title"]').trigger('focus').val(function(i, val) {
							return data.title;
						});
					}
				}
			} else if ( !id && list ) {
				iframe_src += 'videoseries' + list;
			} else {
				console.error('Error: both of video id and list not found');
				setPreviewCard(obj);
				return false;
			}

			ratio = (data.height / data.width * 100).toFixed(2);
			if ( type === 'shorts' ) {
				name = ' youtube-shorts';
			} else {
				name = '';
				style = 'padding-bottom: '+ ratio +'%;';
			}
						
			const thumb = data.thumbnail_url ? '<img src="'+ data.thumbnail_url +'" />' : '';

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}${name}" style="${style}">
						${thumb}
						<iframe src="${iframe_src}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
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