export async function setNaverVibeHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const id = obj.matches[2];
		const target_url = 'https://apis.naver.com/vibeWeb/musicapiweb/vibe/v1/' + type + '/' + id;

		try {
			const response = await fetch(preview.cors + target_url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const textData = await response.text();

			let data;
			try {
				data = $.parseXML(textData);
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

			let width;
			let height;
			if ( type === 'track' ) {
				width = 500;
				height = 154;
			} else {
				width = 600;
				height = 450;
			}
			const style = 'max-width: '+ width +'px; padding-bottom: '+ (height+8) +'px;';
			const iframe_src = 'https://vibe.naver.com/embed/'+ type +'/'+ id +'?width='+ width +'&height='+ height +'&autoPlay=false';

			let thumb = '';
			if ( $(data).find('imageUrl') ) {
				thumb = $(data).find('imageUrl')[0].innerHTML;
				thumb = thumb.replace(/<\!\[CDATA\[/, '');
				thumb = thumb.replace(/\]\]>/, '');
				thumb = '<img src="'+ thumb +'" />';
			}

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} spotify-embed" style="${style}">
						${thumb}
						<iframe src="${iframe_src}" style="width: 100%; height: ${(height+8)}px;" frameborder="no" scrolling="no" loading="lazy" marginwidth="0" marginheight="0" allow="autoplay" allowfullscreen></iframe>
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