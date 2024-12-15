export async function handleEmbedService(obj) {
	const import_path = './'+ obj.service +'.js';
	const import_function = 'set' + obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	}) + 'Html';

	try {
		const import_service = await import(import_path);
		await import_service[import_function](obj);
		return false;
	} catch (error) {
		console.error(`Error importing or executing ${obj.service} module:`, error);
	}
}

export function waitMediaEmbed() {
	if ( $('.media_embed_loading').length ) {
		return;
	}
	$('body').append(
		'<div class="media_embed_loading">' +
			'<div class="media_embed_loading_container">' +
				'<p><i class="xi-spinner-5 xi-spin"></i>'+ preview.wait_message +'</p>' +
			'</div>' +
		'</div>'
	);
}

export function transPastedContent(paste) {
	if ( embed_leave_link ) {
		if ( embed_link_style ) {
			return embed_link_style.replace(/%text%/g, decodeURI(paste).replace(/\s$/, '').replace(/\s/g, '%20'));
		} else {
 			return '<p>'+ paste +'</p>';
		}
	} else {
		return '';
	}
}

export function completeMediaEmbed() {
	if ( !$('.media_embed_loading').length ) {
		return;
	}
	$('.media_embed_loading').remove();
}

export function insertMediaEmbed(obj) {
	const e = obj.e;
	const paste = obj.paste;
	const html = obj.html;
	const link_content = transPastedContent(paste);

	if ( embed_link_location === 2 || embed_link_location === 3 ) {
		e.editor.insertHtml(html + link_content + '<p>&nbsp;</p>');
	} else {
		e.editor.insertHtml(link_content + html + '<p>&nbsp;</p>');
	}
}

export function insertPreviewCard(obj) {
	const e = obj.e;
	const paste = obj.paste;
	const html = obj.html;
	const link_content = transPastedContent(paste);

	if ( embed_link_location === 1 || embed_link_location === 3 ) {
		e.editor.insertHtml(html + link_content + '<p>&nbsp;</p>');
	} else {
		e.editor.insertHtml(link_content + html + '<p>&nbsp;</p>');
	}
}

export async function delContentByInput(editor, paste) {
	const bookmark = editor.getSelection().createBookmarks();
	const data = editor.document.getBody().getHtml();
	const _bookmarker = '<span data-cke-bookmark="1" style="display: none;">&nbsp;</span>';
	const bookmarker = '<span id="user_content_bookmark_1" style="display: none;">&nbsp;</span>';
	const replaced_html =  paste.replace(/\&/g, '&amp;') + _bookmarker;
	const replacing_html =  data.replace(replaced_html, bookmarker);

	editor.document.getBody().setHtml(replacing_html);

	const range = editor.createRange();
	const bookmark_element = editor.document.getById('user_content_bookmark_1');

	if ( bookmark_element ) {
		range.setStart(bookmark_element, 0);
		range.setEnd(bookmark_element.getFirst(), 0);
		
		editor.getSelection().selectRanges([range]);

		requestAnimationFrame(() => {
			bookmark_element.remove(false);
		});
	} else {
		console.error('Bookmark element not found');
	}
}

export async function setPreviewCard(obj) {
	if ( !use_preview || !isAllowedDomain(obj.paste) ) {
		completeMediaEmbed();
		return false;
	}

	waitMediaEmbed();

	const params = {
		act: 'dispPreviewCard',
		url: obj.paste,
		layout: 'none'
	};

	$.get(current_url, params, function(result) {
		arrangePreviewResult(obj, result);
	});
}

export async function setPreviewCardByData(obj) {
	if ( !use_preview || !isAllowedDomain(obj.paste) ) {
		completeMediaEmbed();
		return false;
	}

	waitMediaEmbed();

	const params = {
		act: 'dispPreviewCardByData',
		url: obj.paste,
		data: JSON.stringify(obj.data_obj),
		layout: 'none'
	};

	$.get(current_url, params, function(result) {
		arrangePreviewResult(obj, result);
	});
}

	function isAllowedDomain(paste) {
		let result = ( entered_domains_only ) ? false : true;

		if ( typeof black_or_white !== 'undefined' && black_or_white ) {
			const bw_list = black_or_white.split(',');
			const target_info = paste.match(/^(?:(?:https?\:)?\/\/)?([^\/?#]+)(?:[\/?#]|$)/i);
			if ( !target_info || !target_info.length || !target_info[1] ) {
				return false;
			}
			const target_domain = target_info[1];

			$.each(bw_list, function(i, v) {
				if ( v.indexOf('*') === 0 ) {
					v = v.replace(/^\*\./, '');
					if ( !v.match(/[^\s\.]\.[a-zA-Z]{2,5}$/) ) {
						return true;
					}

					if ( target_domain.endsWith(v) ) {
						result = !result;
						return false;
					}
				} else {
					if ( !v.match(/[^\s\.]\.[a-zA-Z]{2,5}$/) ) {
						return true;
					}

					if ( target_domain === v ) {
						result = !result;
						return false;
					}
				}
			});
		}

		return result;
	}

	function arrangePreviewResult(obj, result) {
		const e = obj.e;
		const paste = obj.paste;

		if ( !result ) {
			e.editor.insertHtml(paste);
			completeMediaEmbed();
			return false;
		}

		const selector = $(result).filter('.preview_card_wrapper');
		if ( !selector.length ) {
			e.editor.insertHtml(paste);
			completeMediaEmbed();
			return false;
		}

		obj.html = selector[0].outerHTML;

		if ( !image_file_upload ) {
			insertPreviewCard(obj);
			completeMediaEmbed();
			return false;
		}

		const is_image = /<img [^>]*src="([^"]*)"[^>]*>/;
		const matches = obj.html.match(is_image);
		if ( matches ) {
			let image_url = unescape(matches[1]);
			if ( image_url.indexOf('//') === 0 ) {
				image_url = image_url.replace(/^\/\//, 'https://');
			} else {
				if ( image_url.indexOf('/files') === 0 ) {
					image_url = request_uri + image_url;
				}
			}

			// 이미지의 도메인이 자기 사이트 도메인과 같으면 파일 첨부를 하지 않음
			const image_server = new URL(image_url);
			if ( location.hostname === image_server.hostname ) {
				insertPreviewCard(obj);
				completeMediaEmbed();
				return false;
			}

			// 이미지의 도메인이 '파일 첨부 예외 도메인'에 속해 있으면 파일 첨부를 하지 않음
			if ( typeof no_attach_domains !== 'undefined' && no_attach_domains ) {
				var target_domain = image_server.hostname;
				var no_attach_domain_list = no_attach_domains.split(',');

				var no_attatch = false;
				$.each(no_attach_domain_list, function(i, v) {
					if ( v.indexOf('*') === 0 ) {
						// 설정된 도메인에 *표시가 있으면 맨 앞의 *에서 마침표까지 삭제
						v = v.replace(/^\*\./, '');
						// 설정된 도메인이 부적절한 형태면 패스
						if ( !v.match(/[^\s\.]\.[a-zA-Z]{2,5}$/) ) {
							return true;
						}

						if ( target_domain.endsWith(v) ) {
							insertPreviewCard(obj);
							completeMediaEmbed();

							no_attatch = true;
							return false;
						}
					} else {
						// 설정된 도메인이 부적절한 형태면 패스
						if ( !v.match(/[^\s\.]\.[a-zA-Z]{2,5}$/) ) {
							return true;
						}

						if ( target_domain === v ) {
							insertPreviewCard(obj);
							completeMediaEmbed();

							no_attatch = true;
							return false;
						}
					}
				});

				if ( no_attatch ) {
					return false;
				}
			}

			if ( typeof preview.editor_container === 'undefined' || preview.editor_container === null ) {
				insertPreviewCard(obj);
				completeMediaEmbed();
				return false;
			}

			obj.data_obj = {
				inserting_type: 'preview_card',
				image_url: image_url,
				mid: window.current_mid,
				editor_sequence: preview.editor_container.data().editorSequence,
				allow_chunks: 'Y'
			};
			procPreviewImageFileInfo(obj);
		} else {
			insertPreviewCard(obj);
			completeMediaEmbed();
			return false;
		}
	}

		export function procPreviewImageFileInfo(obj) {
			exec_json('preview.procPreviewImageFileInfo', obj.data_obj, function(response) {
				if ( response.error || !response.file_info ) {
					insertPreviewCard(obj);
					completeMediaEmbed();
					return false;
				}
				if ( response.file_exists ) {
					const old_file = response.file_info;
					const temp_code = 'src="' + old_file.uploaded_filename + '" alt="' + old_file.source_filename + '" data-file-srl="' + old_file.file_srl + '"';
					obj.html = obj.html.replace(/src="[^"]+"/, temp_code);
					insertPreviewCard(obj);
					completeMediaEmbed();
				} else {
					obj.new_file = response.file_info;
					procImageFileUpload(obj);
				}
			});
		}

			async function procImageFileUpload(obj) {
				obj.fileData = await _convertTemptoObj(obj.new_file);
				await procFileUpload(obj);
			}

				async function _convertTemptoObj(file_info) {
					const response = await fetch(file_info.tmp_name.replace(default_url, '/'));
					const data = await response.blob();
					return new File([data], file_info.name, {type: file_info.type});
				}
					
				export async function getFileObjByDataUrl(data_url) {
					var arr = data_url.split(','),
						mime = arr[0].match(/:(.*?);/)[1],
						bstr = atob(arr[1]),
						n = bstr.length,
						u8arr = new Uint8Array(n);

					var file_name = 'image.';
					switch ( mime ) {
						case 'image/gif': file_name += 'gif'; break;
						case 'image/jpeg': file_name += 'jpg'; break;
						case 'image/png': file_name += 'png'; break;
						case 'image/x-ms-bmp': file_name += 'bmp'; break;
						default: file_name += 'jpg'; break;
					}

					while ( n-- ) {
						u8arr[n] = bstr.charCodeAt(n);
					}

					return new File([u8arr], file_name, {type:mime});
				}

				export function procFileUpload(obj) {
					const event = obj.e;
					const file_info = obj.new_file;

					const editor_sequence = preview.editor.data('editor-sequence');
					const editor_target = preview.editor.data('editor-primary-key-name');
					const upload_target_srl = $('[name="'+ editor_target +'"]').val();
					const editor_container = preview.editor_container;

					const form_data = new FormData;
						form_data.append('act', 'procFileUpload');
						form_data.append('mid', current_mid);
						form_data.append('editor_sequence', editor_sequence);
						form_data.append('editor_target', editor_target);
						form_data.append('upload_target_srl', upload_target_srl);
						form_data.append('Filedata', obj.fileData);

					let notification = event.editor.showNotification('파일 업로드 중...', 'progress', 0);

					$.ajax({
						url: '/',
						type: 'post',
						cache: false,
						contentType: false,
						processData: false,
						dataType: 'json',
						data: form_data,
						async: true,
						xhr: function() {
							let xhr = $.ajaxSettings.xhr();
							xhr.upload.onprogress = function(e){
								const per = e.loaded / e.total;
								if ( per !== 1 ) {
									notification.update({
										progress: per
									});
								} else {
									notification.update({
										type: 'success',
										message: '파일 업로드 완료',
										duration: 1000
									});
								}
							};
							return xhr;
						},
						success: function(result) {
							if ( !result ) {
								notification.update({
									type: 'info',
									message: '파일 가져오기 실패',
									duration: 1000
								});
							} else {
								editor_container.data('instance').loadFilelist(editor_container);
								const temp_code = 'img src="' + result.download_url + '" alt="' + result.source_filename + '" data-file-srl="' + result.file_srl + '"';
								obj.html = obj.html.replace(/img\ssrc="[^"]+"/, temp_code);
							}
						},
						error: function(jqXHR, textStatus) {
							notification.update({
								type: 'info',
								message: '파일 가져오기 실패',
								duration: 1000
							});
							dispErrorMessage(jqXHR, textStatus);
						},
						complete: function() {
							if ( file_info.inserting_type === 'preview_card' ) {
								insertPreviewCard(obj);
							} else if ( file_info.inserting_type === 'media_embed' ) {
								insertMediaEmbed(obj);
							}
							completeMediaEmbed();
							exec_json('preview.procPreviewImageTempFileDelete', {temp_path: file_info.tmp_name});
							return false;
						}
					});
				}

					function dispErrorMessage(x, e) {
						if ( x.status === 0 ) {
							alert('네트워크 연결 상태를 체크해주세요.');
						} else if ( x.status === 404 ) {
							alert('요청받은 URL을 찾을 수 없습니다.');
						} else if ( x.status === 500 ) {
							alert('내부 서버 오류 : 관리자에게 문의해보세요.');
						} else if ( e === 'parsererror' ) {
							alert('요청받은 내용을 변환하는 데 실패했습니다.');
						} else if ( e === 'timeout' ) {
							alert('연결 시간이 초과됐습니다.');
						} else {
							alert('알 수 없는 에러가 발생했습니다.\n' + x.responseText);
						}
					}