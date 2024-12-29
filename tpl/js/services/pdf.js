export async function setPdfHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[1]) || !obj.matches[2] || !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed, getFileObjByDataUrl, procFileUpload } = await import('./_functions.js');

		waitMediaEmbed();

		const id = obj.matches[1];
		const filename = obj.matches[2];
		const type = obj.matches[3];

		const target_url = '/modules/preview/libs/media_embed.iframe.php' +
			'?service=' + obj.service + '&type=' + type + '&url=' + filename + '&data=' + id;
		const iframe_src = target_url;

		try {
			const response = await fetch(target_url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			let data = await response.text();
			if (!data) {
				console.error('Error: data is empty or wrong');
				return false;
			}
			const filepath = $(data).find('#file-container').data('filepath');

			$.getScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js').done(function() {
				pdfjsLib.getDocument(filepath).promise.then(function(pdf) {
					pdf.getPage(1).then(function(page) {
						const scale = 1.5;
						const viewport = page.getViewport({ scale: scale });

						const canvas = document.createElement('canvas');
						const context = canvas.getContext('2d');
						canvas.height = viewport.height;
						canvas.width = viewport.width;

						const renderContext = {
							canvasContext: context,
							viewport: viewport
						};
						page.render(renderContext).promise.then(async function() {
							const thumbnailData = canvas.toDataURL('image/jpeg');
							const thumb = '<img src="'+ thumbnailData +'" >';

							obj.fileData =  await getFileObjByDataUrl(thumbnailData);
							obj.new_file = {
								inserting_type: 'media_embed'
							}

							obj.html = `
								<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
									<div class="${preview.iframe_wrapper} pdf-embed">
										${thumb}
										<iframe src="${iframe_src}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
									</div>
								</div>
							`;

							procFileUpload(obj);
							obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
						});
					});
				});
			}).fail(function() {
				console.error('Error loading thumbnail');

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} pdf-embed">
							<iframe src="${iframe_src}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
				obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
			});
		} catch (error) {
			console.error('Error fetching '+ title +' data:', error);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}