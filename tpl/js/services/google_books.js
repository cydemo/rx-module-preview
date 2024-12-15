export async function setGoogleBooksHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[1];
		let page = obj.matches[0].replace(/&amp;/g, '&').getQuery('pg');
		page = !page ? 'PP1' : page;

		const thumb = `<img src="https://books.google.co.kr/books/publisher/content?id=${id}&printsec=frontcover&img=1" />`;
		const iframe_src = `https://books.google.co.kr/books?id=${id}&pg=${page}&output=embed`;

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
				<div class="${preview.iframe_wrapper} google-books-embed">
					${thumb}
					<iframe src="${iframe_src}" scrolling="no" frameborder="no"></iframe>
				</div>
			</div>
		`;

		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}