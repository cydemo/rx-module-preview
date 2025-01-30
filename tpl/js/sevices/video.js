export async function setVideoHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[0][1]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}


	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed, getFileObjByDataUrl, procFileUpload } = await import('./_functions.js');

		waitMediaEmbed();

		let id, selected_file_list = [];
		let data_obj_for_text = {
			file_srl: [], source_filename: [], thumbnail_filename: [], mime_type: [], width: [], height: [], duration: []
		};
		const file_model = preview.editor_container.data();

		for ( let i = 0; i < obj.matches.length; i ++) {
			id = Number(obj.matches[i][1]);
			const file_info = file_model.files[id];
			const file_data = { file_srl: id };

			if ( file_info.source_filename ) file_data.source_filename = file_info.source_filename;
			if ( file_info.thumbnail_filename ) file_data.thumbnail_filename = file_info.thumbnail_filename;
			if ( file_info.mime_type ) file_data.mime_type = file_info.mime_type;
			if ( file_info.width ) file_data.width = file_info.width;
			if ( file_info.height ) file_data.height = file_info.height;
			if ( file_info.duration ) file_data.duration = file_info.duration;

			if ( !file_data.thumbnail_filename ) {
				const video_url = request_uri + 'index.php?module=preview&act=procPreviewFileDownload&file_srl=' + id;
				try {
					const meta_data = await getVideoMetaData(video_url);
					if ( meta_data.data_url && meta_data.data_url !== 'data:,' ) {
						file_data.width = file_data.width ?? meta_data.width;
						file_data.height = file_data.height ?? meta_data.height;
						file_data.duration = file_data.duration ?? meta_data.duration;

						obj.fileData =  await getFileObjByDataUrl(meta_data.data_url, id);
						obj.new_file = {
							inserting_type: 'thumbnail'
						}
						const result = await procFileUpload(obj);
						const thumbnail_filename = '.' + result.download_url;

						file_data.thumbnail_filename = thumbnail_filename;
						preview.editor_container.data().files[id].thumbnail_filename = thumbnail_filename;

						exec_json('preview.procPreviewFileThumbnail', file_data, function(response) {
							const editor_container = preview.editor_container;
							const video_el = editor_container.find('.xefu-file[data-file-srl="'+ file_data.file_srl +'"]');
							const video_name = video_el.find('.xefu-file-name').text();
							const video_size = video_el.find('.xefu-file-info').text();
							const video_el_with_thumb = `<li class="xefu-file xefu-file-image un-selected" data-file-srl="${file_data.file_srl}" style="cursor: pointer;">
								<strong class="xefu-file-name">${video_name}</strong>
								<span class="xefu-file-info">
									<span class="xefu-file-size">${video_size}</span>
									<span>
										<span class="xefu-file-video"><span class="xefu-file-video-play"></span></span>
										<span class="xefu-thumbnail" style="background-image:url(${thumbnail_filename})" title="${video_name}"></span>
									</span>
									<span><input type="checkbox" data-file-srl="${file_data.file_srl}"></span>
									<button class="xefu-act-set-cover" data-file-srl="${file_data.file_srl}" title="Set as cover image"><i class="xi-check-circle"></i></button>
								</span>
							</li>`;

							video_el.remove();
							editor_container.find('.xefu-list-images ul').append(video_el_with_thumb);
						});
					}
				} catch (error) {
					console.error("Error capturing first frame:", error);
				}
			}

			data_obj_for_text.file_srl.push(file_data.file_srl);
			data_obj_for_text.source_filename.push(file_data.source_filename);
			data_obj_for_text.thumbnail_filename.push(encodeURIComponent(file_data.thumbnail_filename));
			data_obj_for_text.mime_type.push(file_data.mime_type);
			data_obj_for_text.width.push(file_data.width);
			data_obj_for_text.height.push(file_data.height);
			data_obj_for_text.duration.push(file_data.duration);

			selected_file_list[i] = file_data;
		};

		const basic_info = selected_file_list[0];
		const target_url = request_uri + 'index.php?module=preview&act=procPreviewFileDownload&file_srl=' + basic_info.file_srl;
		let iframe_src = '/modules/preview/libs/media_embed.iframe.php' +
			'?service=' + obj.service + '&type=' + basic_info.mime_type.replace('video/', '') + '&url=' + encodeURIComponent(target_url);
			iframe_src += (obj.matches.length > 1) ? '&list_id=true' : '';

		let ratio = (basic_info.height / basic_info.width * 100).toFixed(2);
		let style = ' style="padding-bottom: '+ ratio +'%;"';
		let short_form = '';
		if ( ratio > 100 ) {
			short_form = ' short_form';
			style = ' style="border-radius: unset;"';
		}

		const keys = Object.keys(data_obj_for_text);
		let data_list = []
		for (const key of keys) {
			data_list.push('data-' + key + '="'+ data_obj_for_text[key].join('|@|') +'"');
		};
		const data_text = data_list.join(' ');

		obj.paste = '<a data-file-srl="'+ basic_info.file_srl +'" href="'+ target_url +'">'+ basic_info.source_filename +'</a>';

		obj.html = `
			<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false" data-file-srl="${data_obj_for_text.file_srl.join(',')}">
				<div class="${preview.iframe_wrapper} video-embed${short_form}"${style}>
					<iframe src="${iframe_src}" data-frame-id="video-${Date.now()}" data-src="${iframe_src}" ${data_text} allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
				</div>
			</div>
		`;
		insertMediaEmbed(obj);
		completeMediaEmbed();
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	function getVideoMetaData(target_url) {
		return new Promise((resolve, reject) => {
			const $video = $('<video>', {
				id: 'video_temp_1',
				src: target_url,
				preload: 'metadata',
				muted: true,
				css: { display: 'none' }
			}).appendTo('body');

			const $canvas = $('<canvas>', {
				id: 'canvas_temp_1',
				css: { display: 'none' }
			}).appendTo('body');
			const ctx = $canvas[0].getContext('2d');

			$video.on('loadeddata', function () {
				this.currentTime = 0;
			});

			$video.on('seeked', function () {
				try {
					$canvas.attr({
						width: this.videoWidth,
						height: this.videoHeight
					});

					ctx.drawImage(this, 0, 0, this.videoWidth, this.videoHeight);

					const dataURL = $canvas[0].toDataURL('image/jpeg');

					$('video#video_temp_1').remove();
					$('canvas#canvas_temp_1').remove();

					resolve({
						duration: this.duration || null,
						width: this.videoWidth || null,
						height: this.videoHeight || null,
						data_url: dataURL,
					});
				} catch (error) {
					reject(error);
				}
			});

			$video.on("error", function (event) {
				reject(new Error(`Failed to load video: ${event.target.error.code}`));
			});
		});
	}