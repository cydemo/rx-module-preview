export async function setAudioHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[0][1]) && (!$.isNumeric(obj.matches[0][2]) || !obj.matches[0][3] || !obj.matches[0][4]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}


	try {
		const { waitMediaEmbed, insertMediaEmbed, completeMediaEmbed, getFileObjByDataUrl, procFileUpload } = await import('./_functions.js');

		waitMediaEmbed();

		let id, selected_file_list = [];
		let data_obj_for_text = {
			file_srl: [], source_filename: [], title: [], artist: [], album: [], thumbnail_filename: [], mime_type: [], duration: []
		};
		const file_model = preview.editor_container.data();

		$.getScript('https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js').then(function() {
			(async function() {
				for ( let i = 0; i < obj.matches.length; i ++) {
					id = Number(obj.matches[i][1]) || Number(obj.matches[i][2]);
					const file_info = file_model.files[id];
					const file_data = { file_srl: id };
					let comment = {};

					if ( file_info.source_filename ) file_data.source_filename = file_info.source_filename;
					if ( file_info.thumbnail_filename ) file_data.thumbnail_filename = file_info.thumbnail_filename;
					if ( file_info.mime_type ) file_data.mime_type = file_info.mime_type;
					if ( file_info.duration ) file_data.duration = file_info.duration;

					if ( file_data.duration ) {
						comment = await getPreviewFileExtraInfo(file_data);
					} else {
						try {
							const meta_data = await getAudioMetaData(file_data);
							comment.title = meta_data.title ?? file_data.source_filename.replace(/\.\w+$/, '');
							comment.artist = meta_data.artist ?? '아티스트 없음';
							comment.album = meta_data.album ?? '앨범 없음';
							file_data.comment = JSON.stringify(comment);
							file_data.duration = meta_data.duration;
							preview.editor_container.data().files[id].duration = file_data.duration;

							if ( meta_data.picture ) {
								if ( !file_data.mime_type.endsWith('ogg') ) {
									const { data, format } = meta_data.picture;
									let base64String = "";
									for (let j = 0; j < data.length; j++) {
										base64String += String.fromCharCode(data[j]);
									}
									meta_data.data_url = `data:${format};base64,${window.btoa(base64String)}`;
									obj.fileData =  await getFileObjByDataUrl(meta_data.data_url, id);
								} else {
									obj.fileData =  new File([meta_data.picture], file_info.source_filename, {type: file_info.mime_type});
								}
								obj.new_file = {
									inserting_type: 'thumbnail'
								}
								const result = await procFileUpload(obj);
								const thumbnail_filename = '.' + result.download_url;

								file_data.thumbnail_filename = thumbnail_filename;
								preview.editor_container.data().files[id].thumbnail_filename = thumbnail_filename;
							}

							exec_json('preview.procPreviewFileThumbnail', file_data, function(response) {
								if ( !response.thumbnail_filename ) {
									return;
								}

								const editor_container = preview.editor_container;
								const audio_el = editor_container.find('.xefu-file[data-file-srl="'+ file_data.file_srl +'"]');
								const audio_name = audio_el.find('.xefu-file-name').text();
								const audio_size = audio_el.find('.xefu-file-info').text();
								const audio_el_with_thumb = `<li class="xefu-file xefu-file-image un-selected" data-file-srl="${file_data.file_srl}" style="cursor: pointer;">
									<strong class="xefu-file-name">${audio_name}</strong>
									<span class="xefu-file-info">
										<span class="xefu-file-size">${audio_size}</span>
										<span>
											<span class="xefu-file-video"><span class="xefu-file-video-play"></span></span>
											<span class="xefu-thumbnail" style="background-image:url(${response.thumbnail_filename})" title="${audio_name}"></span>
										</span>
										<span><input type="checkbox" data-file-srl="${file_data.file_srl}"></span>
										<button class="xefu-act-set-cover" data-file-srl="${file_data.file_srl}" title="Set as cover image"><i class="xi-check-circle"></i></button>
									</span>
								</li>`;

								audio_el.remove();
								editor_container.find('.xefu-list-images ul').append(audio_el_with_thumb);
							});
						} catch (error) {
							console.error("Error extracting the metadata:", error);
						}
					}

					data_obj_for_text.file_srl.push(file_data.file_srl);
					data_obj_for_text.source_filename.push(file_data.source_filename);
					data_obj_for_text.title.push(comment.title);
					data_obj_for_text.artist.push(comment.artist);
					data_obj_for_text.album.push(comment.album);
					data_obj_for_text.thumbnail_filename.push(encodeURIComponent(file_data.thumbnail_filename));
					data_obj_for_text.mime_type.push(file_data.mime_type);
					data_obj_for_text.duration.push(file_data.duration);

					selected_file_list[i] = file_data;
				};


				const basic_info = selected_file_list[0];
				const target_url = request_uri + 'index.php?module=preview&act=procPreviewFileDownload&file_srl=' + basic_info.file_srl;
				let iframe_src = '/modules/preview/libs/media_embed.iframe.php' +
					'?service=' + obj.service + '&type=' + basic_info.mime_type.replace('audio/', '') + '&url=' + encodeURIComponent(target_url);
					iframe_src += (obj.matches.length > 1) ? '&list_id=true' : '';

				const keys = Object.keys(data_obj_for_text);
				let data_list = []
				for (const key of keys) {
					data_list.push('data-' + key + '="'+ data_obj_for_text[key].join('|@|') +'"');
				};
				const data_text = data_list.join(' ');

				obj.paste = '<a data-file-srl="'+ basic_info.file_srl +'" href="'+ target_url +'">'+ basic_info.source_filename +'</a>';

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false" data-file-srl="${data_obj_for_text.file_srl.join(',')}">
						<div class="${preview.iframe_wrapper} audio-embed short_form">
							<iframe src="${iframe_src}" data-frame-id="audio-${Date.now()}" data-src="${iframe_src}" ${data_text} allowfullscreen="true" frameborder="no" scrolling="no" loading="lazy"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			})();
		});
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function getPreviewFileExtraInfo(file_data) {
		return new Promise((resolve, reject) => {
			exec_json('preview.getPreviewFileExtraInfo', file_data, function(response) {
				try {
					const comment = JSON.parse(response.comment);
					file_data.duration = response.duration;
					resolve(comment);
				} catch (error) {
					reject(error);
				}
			});
		});
	}

	function getAudioMetaData(file_data) {
		return new Promise(async (resolve, reject) => {
			const audio_url = '/index.php?module=preview&act=procPreviewFileDownload&file_srl=' + file_data.file_srl;
			try {
				const response = await fetch(audio_url);
				if (!response.ok) {
					throw new Error('Fail to fetch the audio file.');
				}
				const blob = await response.blob();

				const mime_type = file_data.mime_type;
				if ( /(mp3|mpeg|m4a|mp4|flac)$/.test(mime_type) ) {
					window.jsmediatags.read(blob, {
						onSuccess: async function(result) {
							const meta_data = result.tags;
							const title = meta_data.title || null;
							const artist = meta_data.artist || null;
							const album = meta_data.album || null;
							const picture = meta_data.picture || null;
							const duration = await getAudioDuration(blob);

							resolve({title, artist, album, picture, duration});
						},
						onError: async function(error) {
							reject(null);
							console.error('Fail to extract the metadata:', error);
						}
					});
				} else if ( mime_type.endsWith('ogg') ) {
					const { parse_audio_metadata } = await import('/modules/preview/libs/src/js/audio_parser.js');
					parse_audio_metadata(blob, async function(meta_data) {
						const title = meta_data.title || null;
						const artist = meta_data.artist || null;
						const album = meta_data.album || null;
						const picture = meta_data.picture || null;
						const duration = await getAudioDuration(blob);

						resolve({title, artist, album, duration, picture});
					}, function(error) {
						reject(null);
						console.error('Fail to extract the metadata:', error);
					});
				} else {
					// audio/aac, audio/x-hx-aac-adts, audio/vnd.dlna.adts, audio/wave, audio/wav, audio/x-wav, audio/x-pn-wav
					const title = file_data.source_filename.replace(/\.\w+$/, '');
					const artist = '아티스트 없음';
					const album = '앨범 없음';
					const picture = null;
					const duration = await getAudioDuration(blob);

					resolve({title, artist, album, duration, picture});
				}
			} catch (error) {
				reject(null);
				console.error('Fail to extract the metadata:', error);
			}
		});
	}

	function getAudioDuration(blob) {
		return new Promise((resolve, reject) => {
			try {
				const audio = new Audio();
				const objectURL = URL.createObjectURL(blob);
				audio.src = objectURL;

				$(audio).on('loadedmetadata', function() {
					resolve(parseFloat(audio.duration.toFixed(2)));
					URL.revokeObjectURL(objectURL);
				});

				audio.onerror = function () {
					reject("Failed to load audio metadata");
					URL.revokeObjectURL(objectURL);
				};
			} catch (error) {
				reject(error);
			}
		});
	}