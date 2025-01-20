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
		
		let thumb = '';

		try {
			const file_info = preview.editor_container.data().files[id];
			if ( file_info.mime_type !== 'application/pdf' ) {
				completeMediaEmbed();
				console.error('Error: The file is not suitable');
				return false;
			}

			if ( file_info.thumbnail_filename ) {
				thumb = `<img src="${file_info.thumbnail_filename}" />`;
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false" data-file-srl="${id}">
						<div class="${preview.iframe_wrapper} pdf-embed">
							${thumb}
							<iframe src="${iframe_src}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
				return false;
			}

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
							const thumbnail_data = canvas.toDataURL('image/jpeg');
							obj.fileData =  await getFileObjByDataUrl(thumbnail_data, id);
							obj.new_file = {
								inserting_type: 'thumbnail'
							}

							const result = await procFileUpload(obj);
							const pdf_srl = Number(result.source_filename.replace(/[^0-9]+/g, ''));
							const thumbnail_filename = '.' + result.download_url;

							file_info.thumbnail_filename = thumbnail_filename;
							preview.editor_container.data().files[id].thumbnail_filename = thumbnail_filename;

							exec_json('preview.procPreviewFileThumbnail', file_info, function(response) {
								const editor_container = preview.editor_container;
								const pdf_el = editor_container.find('.xefu-file[data-file-srl="'+ id +'"]');
								const pdf_name = pdf_el.find('.xefu-file-name').text();
								const pdf_size = pdf_el.find('.xefu-file-info').text();
								const pdf_el_with_thumb = `<li class="xefu-file xefu-file-image un-selected" data-file-srl="${id}" style="cursor: pointer;">
									<strong class="xefu-file-name">${pdf_name}</strong>
									<span class="xefu-file-info">
										<span class="xefu-file-size">${pdf_size}</span>
										<span>
											<span class="xefu-thumbnail" style="background-image:url(${thumbnail_filename})" title="${pdf_name}"></span>
										</span>
										<span><input type="checkbox" data-file-srl="${id}"></span>
										<button class="xefu-act-set-cover" data-file-srl="${id}" title="Set as cover image"><i class="xi-check-circle"></i></button>
									</span>
								</li>`;

								pdf_el.remove();
								editor_container.find('.xefu-list-images ul').append(pdf_el_with_thumb);

								thumb = `<img src="${response.thumbnail_filename}" />`;
								obj.html = `
									<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false" data-file-srl="${id}">
										<div class="${preview.iframe_wrapper} pdf-embed">
											${thumb}
											<iframe src="${iframe_src}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
										</div>
									</div>
								`;
								insertMediaEmbed(obj);
								completeMediaEmbed();
								obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
							});

						});
					});
				});
			}).fail(function() {
				console.error('Error loading thumbnail');

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false" data-file-srl="${id}">
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