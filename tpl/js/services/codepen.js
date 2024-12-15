export async function setCodepenHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[1];
		const id = obj.matches[2];
		const iframe_src = 'https://codepen.io/'+ name +'/embed/'+ id +'?default-tab=html,result';
		let thumb = 'https://shots.codepen.io/' + name + '/pen/' + id + '-512.jpg';
		thumb = '<img src="'+ thumb +'" />';

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} codepen-embed">
					${thumb}
					<iframe src="${iframe_src}" scrolling="no" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe>
				</div>
			</div>`;
		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}