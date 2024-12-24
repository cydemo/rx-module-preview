export async function setJsfiddleHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || obj.matches[1] === 'user' || obj.matches[1] === 'boilerplate' || !obj.matches[2] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[1];
		const id = obj.matches[2];
		const hash = obj.matches[3] ?? '';
		const iframe_src = '//jsfiddle.net/' + name + '/' + id + '/' + hash + '/embedded/result,html,css,js/';
		const thumb = '<img src="https://cdn4.iconfinder.com/data/icons/logos-and-brands-1/512/188_Jsfiddle_logo_logos-512.png" />';

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} jsfiddle-embed">
					${thumb}
					<iframe src="${iframe_src}" allowfullscreen="true" allowtransparency="true" frameborder="0" loading="lazy"></iframe>
				</div>
			</div>
		`;
		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}