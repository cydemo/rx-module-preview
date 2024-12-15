export async function setGithubHtml(obj) {
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

		let type = ( obj.matches[1] === 'gist' ) ? 'gist' : '';
		const user_name = obj.matches[2];
		const gist_id = type ? obj.matches[3] : '';
		const project_name = !type ? obj.matches[4] : '';
		const project_version = !type ? obj.matches[5] : '';
		const file_path = !type ? obj.matches[6] : '';

		if ( type && type === 'gist' ) {
			type = 'gist';
		} else if ( !type && user_name && project_name && project_version && file_path ) {
			type = 'file';
		} else {
			console.error('Error: Unknown type cannot be embedded');
			setPreviewCard(obj);
			return false;
		}

		let target_url = encodeURIComponent(obj.matches[0]);
		let iframe_src = '';

		if ( type === 'gist' || type === 'file' ) {
			$.get(preview.cors + target_url).done(function(data) {
				let thumb = '';
				if ( data ) {
					thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
					thumb = thumb ? '<img src ="'+ thumb +'" />' : '';
				}

				target_url = ( type === 'gist' ) ? decodeURIComponent(target_url) : target_url;
				iframe_src = '/modules/preview/libs/media_embed.iframe.php' +
					'?service=' + obj.service + '&type=' + type + '&url=' + target_url + '&data=';

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} github-embed">
							${thumb}
							<iframe src="${iframe_src}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" loading="lazy"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
				obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
			});
		} else {
			console.error('Error fetching '+ title +' data:', error);
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}