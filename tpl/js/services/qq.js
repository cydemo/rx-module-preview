export async function setQqHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[1];
		const id = obj.matches[3];
		let list = obj.matches[2] ?? '';
			list = obj.matches[4] ?? list;

		const thumb = '<img src="https://puui.qpic.cn/vpic_cover/' + id + '/' + id + '_hz.jpg/496" />';
		const iframe_src = 'https://v.qq.com/txp/iframe/player.html?vid=' + id + '&show1080p=1';

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper}">
					${thumb}
					<iframe src="${iframe_src}" frameborder="no" scrolling="no" loading="lazy" allowfullscreen="true"></iframe>
				</div>
			</div>
		`;
		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}