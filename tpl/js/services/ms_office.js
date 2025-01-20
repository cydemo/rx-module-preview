export async function setMsOfficeHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[1]) || !obj.matches[2] || !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed, getFileObjByDataUrl } = await import('./_functions.js');

		waitMediaEmbed();

		const id = Number(obj.matches[1]);
		const filename = obj.matches[2];
		const type = obj.matches[3];

		const allowed_types = ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'];
		if ( !allowed_types.includes(type) ) {
			console.error('Error: not allowed file type');
			return;
		}

		const target_url = request_uri + 'index.php?module=preview&act=procPreviewFileDownload&file_srl=' + id;
		const iframe_src = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(target_url);
		let thumb = '';

		let file_info = preview.editor_container.data().files[id];
		const office_type = getMsOfficeFileType(file_info.mime_type, id);
		let style = '';

		if ( file_info && file_info.thumbnail_filename ) {
			if ( office_type !== 'xlsx' ) {
				const ratio = (file_info.height / file_info.width * 100).toFixed(2);
				if ( office_type === 'pptx' ) {
					style = 'style="padding-bottom: calc('+ ratio +'% + 23px);"';
				} else {
					style = 'style="padding-bottom: '+ ratio +'%;"';
				}
			}
			thumb = `<img src="${file_info.thumbnail_filename}" />`;

			setMsOfficeIframe(obj, iframe_src, thumb, style);
			return false;
		} else {
			if ( office_type === 'docx' || office_type === 'pptx' ) {
				try {
					let response = await fetch(preview.cors + encodeURIComponent(iframe_src));
					if (!response.ok) {
						console.error('Error: fetching '+ title +':'+ office_type +' data');
						setMsOfficeIframe(obj, iframe_src);
						return false;
					}
					let data = await response.text();
					let matches = data.match(/var\s_iframeUrl\s?=\s?(?:'|")([^'"]+)(?:'|")/);
					if ( !matches ) {
						console.error('Error: matching no string');
						setMsOfficeIframe(obj, iframe_src);
						return false;
					}
					let iframe_url = matches[1];
						iframe_url = iframe_url.replace(/\\u([\d\w]{4})/gi, function (match, grp) {
							return String.fromCharCode(parseInt(grp, 16));
						});
						iframe_url += '&access_token=1';

					try {
						let response = await fetch(preview.cors + encodeURIComponent(iframe_url));
						if ( !response.ok ) {
							console.error('Error: fetching '+ title +':'+ office_type +' data');
							setMsOfficeIframe(obj, iframe_src);
							return false;
						}
						let data = await response.text();

						if ( office_type === 'docx' ) {
							let matches = data.match(/<img src="([^"]+)"/);
							if ( !matches ) {
								console.error('Error: matching no string');
								setMsOfficeIframe(obj, iframe_src);
								return false;
							}
							const thumb_path = 'https://PJP1-word-view.officeapps.live.com/wv/' + matches[1];

							obj.data_obj = {
								inserting_type: 'thumbnail',
								image_url: thumb_path,
								mid: window.current_mid,
								editor_sequence: preview.editor_container.data().editorSequence,
								allow_chunks: 'Y'
							};

							exec_json('preview.procPreviewImageFileInfo', obj.data_obj, function(response) {
								if ( response.error || !response.file_info ) {
									console.error('Error: uploading preview image file');
									insertPreviewCard(obj);
									completeMediaEmbed();
									return false;
								}

								file_info = response.file_info;

								(async function() {
									const fetch_response = await fetch(file_info.tmp_name.replace(default_url, '/'));
									const data = await fetch_response.blob();
									obj.fileData = new File([data], file_info.name, {type: file_info.type});

									procPreviewFileThumbnail(obj, id, file_info, iframe_src);
								})();
							});
						} else if ( office_type === 'pptx' ) {
							let matches = data.match(/presentationId[^\w]+([^\\]+)/);
							if ( !matches ) {
								console.error('Error: matching no string');
								setMsOfficeIframe(obj, iframe_src);
								return false;
							}
							const pdf_url = 'https://pjp1-powerpoint.officeapps.live.com/p/pdfhandler.ashx?PV=0&Pid=' + encodeURIComponent(matches[1]);

							$.getScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js').done(function() {
								pdfjsLib.getDocument(preview.cors + encodeURIComponent(pdf_url) + '&format=pdf').promise.then(function(pdf) {
									pdf.getPage(1).then(function(page) {
										const scale = 1;
										const viewport = page.getViewport({ scale: scale });
										const canvas = document.createElement('canvas');
										const context = canvas.getContext('2d');
											canvas.height = viewport.height;
											canvas.width = viewport.width;

										page.render({canvasContext: context, viewport: viewport}).promise.then(async function() {
											obj.fileData =  await getFileObjByDataUrl(canvas.toDataURL('image/jpeg'), id);
											procPreviewFileThumbnail(obj, id, file_info, iframe_src);
										});
									});
								});
							}).fail(function() {
								console.error('Error: importing script failed', error);
								setMsOfficeIframe(obj, iframe_src);
								return false;
							});
						}
					} catch (error) {
						console.error('Error: fetching '+ title +':'+ office_type +' data', error);
						setMsOfficeIframe(obj, iframe_src);
						return false;
					}
				} catch (error) {
					console.error('Error: fetching '+ title +':'+ office_type +' data');
					setMsOfficeIframe(obj, iframe_src);
					return false;
				}
			} else if ( office_type === 'xlsx' ) {
				$.getScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js').done(function() {
					$.getScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').done(function () {
						(async function() {
							let response = await fetch(target_url);
							if (!response.ok) {
								throw new Error(`Failed to fetch file: ${response.status}`);
							}
							let data = await response.arrayBuffer();

							const workbook = XLSX.read(data, {type: 'array'});
							const worksheet = workbook.Sheets[workbook.SheetNames[0]];
							const sheetData = XLSX.utils.sheet_to_html(worksheet);

							const $table = $(sheetData).filter('table');
							const tr_length = $table.find('tr').length;
							const td_length = $table.find('tr').eq(0).children('td').length;

							$table.prepend('<thead><tr></tr></thead>');
							for ( let i = 0; i < td_length; i++ ) {
								$table.find('thead tr').append('<th>'+ String.fromCharCode(65 + i) +'</th>');
							};
							$table.find('thead tr').prepend('<th class="corner"><span></span></th>');
							$table.find('tbody tr').prepend('<td></td>');
							for ( let i = 0; i < tr_length; i++ ) {
								$table.find('tbody tr').eq(i).find('td').eq(0).html(i+1);
							};

							const css = '<style>body {margin: 0;padding: 0;}' +
								'table {width: 100%; box-sizing: border-box; border-spacing: 0; font-size: 14px;}' +
									'th, td {margin: 0; padding: 0 4px; white-space: nowrap; box-sizing: border-box; border-right: 1px solid #ddd; overflow: hidden;}' +
									'th {border-bottom: 1px solid #bbb; background-color: #f0f0f0; font-weight: normal;}' +
										'th.corner {position: relative;}' + 
										'th.corner span {position: absolute; right: 3px; bottom: 3px; border-top: 12px solid transparent; border-right: 12px solid #b7b7b7;}' +
										'th:first-child {border-right: 1px solid #bbb;}' +
										'th:last-child {border-right: none;}' +
									'td {max-width: 160px; min-width: 32px; border-bottom: 1px solid #ddd;}' +
										'td:first-child {width: 32px; min-width: auto; text-align: right; background-color: #f0f0f0; border-right: 1px solid #bbb;}' +
										'td:last-child {border-right: none;}' +
									'tr:last-child td {border-bottom: none;}' +
								'</style>';
							const sheetHtml = sheetData.replace(/<table>(.+)<\/table>/, '<table>' + $table.html() + '</table>').replace('</head>', css + '</head>');

							const iframe = document.createElement('iframe');
								iframe.style.visibility = 'hidden';
								iframe.style.position = 'absolute';
								iframe.style.width = '1600px';
								iframe.style.height = '900px';
								iframe.style.top = '-9999px';
								iframe.style.left = '-9999px';
								document.body.appendChild(iframe);
							const iframedoc = iframe.contentDocument || iframe.contentWindow.document;
								iframedoc.open();
								iframedoc.write(sheetHtml);
								iframedoc.close();

							let canvas;
							try {
								canvas = await html2canvas(iframedoc.body, {
									x: 0, y: 0,
									width: 800, height: 450,
									windowWidth: 1600, windowHeight: 900,
									scale: 1,
								});
								iframe.parentNode.removeChild(iframe);
							} catch (error) {
								console.error('html2canvas capturing failed:', error);
							}

							obj.fileData =  await getFileObjByDataUrl(canvas.toDataURL('image/png'), id);
							procPreviewFileThumbnail(obj, id, file_info, iframe_src);
						})();
					});
				});
			} else {
				console.error('Error reading '+ title +' file data');
			}
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module');
		return false;
	}
}

	async function setMsOfficeIframe(obj, iframe_src, thumb, style) {
		const { insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');
		const id = obj.matches[1];
		if ( !thumb ) {
			thumb = '';
		}
		if ( !style ) {
			style = '';
		}

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false" data-file-srl="${id}">
				<div class="${preview.iframe_wrapper} ms-office-embed" ${style}>
					${thumb}
					<iframe src="${iframe_src}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no" loading="lazy"></iframe>
				</div>
			</div>
		`;
		insertMediaEmbed(obj);
		completeMediaEmbed();
		obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
	}

	async function procPreviewFileThumbnail(obj, id, file_info, iframe_src) {
		const { procFileUpload } = await import('./_functions.js');
		obj.new_file = {inserting_type: 'thumbnail'};

		const result = await procFileUpload(obj);
			file_info.file_srl = id;
			file_info.thumbnail_filename = '.' + result.download_url;
			file_info.width = result.width;
			file_info.height = result.height;
		preview.editor_container.data().files[id].thumbnail_filename = file_info.thumbnail_filename;

		exec_json('preview.procPreviewFileThumbnail', file_info, function(response) {
			const editor_container = preview.editor_container;
			const el = editor_container.find('.xefu-file[data-file-srl="'+ id +'"]');
			const name = el.find('.xefu-file-name').text();
			const size = el.find('.xefu-file-info').text();
			const el_with_thumb = `<li class="xefu-file xefu-file-image un-selected" data-file-srl="${id}" style="cursor: pointer;">
				<strong class="xefu-file-name">${name}</strong>
				<span class="xefu-file-info">
					<span class="xefu-file-size">${size}</span>
					<span>
						<span class="xefu-thumbnail" style="background-image:url(${response.thumbnail_filename})" title="${name}"></span>
					</span>
					<span><input type="checkbox" data-file-srl="${id}"></span>
					<button class="xefu-act-set-cover" data-file-srl="${id}" title="Set as cover image"><i class="xi-check-circle"></i></button>
				</span>
			</li>`;

			el.remove();
			editor_container.find('.xefu-list-images ul').append(el_with_thumb);

			let style = '';
			const office_type = getMsOfficeFileType(file_info.mime_type, id);
			if ( office_type !== 'xlsx' ) {
				const ratio = (file_info.height / file_info.width * 100).toFixed(2);
				if ( office_type === 'pptx' ) {
					style = 'style="padding-bottom: calc('+ ratio +'% + 23px);"';
				} else {
					style = 'style="padding-bottom: '+ ratio +'%;"';
				}
			}
			const thumb = `<img src="${response.thumbnail_filename}" />`;

			setMsOfficeIframe(obj, iframe_src, thumb, style);
		});
	}

	function getMsOfficeFileType(mime_type, id) {
		if ( mime_type === 'application/msword' || mime_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ) {
			return 'docx';
		} else if ( mime_type === 'application/vnd.ms-powerpoint' || mime_type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ) {
			return 'pptx';
		} else if ( mime_type === 'application/vnd.ms-excel' || mime_type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ) {
			return 'xlsx';
		} else {
			if ( mime_type === 'application/octet-stream' ) {
				const file_info = preview.editor_container.data().files[id];
				return file_info.source_filename.replace(/.+\.(\w+)/, '$1');
			} else {
				return false;
			}
		}
	}