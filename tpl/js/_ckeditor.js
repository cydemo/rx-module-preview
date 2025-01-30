jQuery(document).ready(function($) {

	const functionScriptURL = request_uri + 'modules/preview/tpl/js/services/_functions.js';
	const editor = $('[data-editor-primary-key-name$="_srl"]');
	if ( editor.length < 1 ) {
		return;
	}

	if ( !use_preview && !use_embed )
	{
		return;
	}

	window.preview = {
		editor : editor,
		iframe_wrapper : 'media_embed',
		cors : request_uri + 'modules/preview/libs/media_embed.cors.php?url=',
		omit_message : '생략된 부분은 본문이 로드되면 볼 수 있습니다.',
		wait_message : '콘텐츠를 로딩 중입니다.<br>잠시만 기다려주세요.',
		editor_container : $('.xefu-container[data-editor-sequence=' + editor.data('editor-sequence') + ']'),
		embed_service_list : (embed_services ? embed_services.split(',') : null),
		reg_exps : {
			'4sharedRegExp': /^https?:\/\/www.4shared.com\/(s\/f|(?:mp3|music|video)\/)([\w]{10})(?:\/[^.]+\.html)?$/,
			airbnbRegExp: /^https?:\/\/(?:www\.)?airbnb\.(?:[.a-z]+)\/rooms\/(\d+)(?:\?.+)?/,
			amazonMusicRegExp: /^https?:\/\/music\.amazon\.com\/(tracks|albums|artists|playlists)\/(\w+)(?:[/?].+)?$/,
			appleMusicRegExp: /^https?:\/\/music\.apple\.com\/((\w{2})\/(?:(album|playlist|music-video|post))\/(?:([^/]+)\/)?(?:\d+\?)?((?:i=|ra.|pl.)?\w+))$/,
			applePodcastsRegExp: /^https?:\/\/podcasts\.apple\.com\/((\w{2})\/podcast\/([^/]+)\/id(\d+)\?i=(\d+))$/,
			audioRegExp: /(?:(?:<p>)?<audio[^>]+data-file-srl="(\d+)"(?:[^>]+)?>|^<a(?:[^>]+)?data-file-srl="(\d+)"(?:[^>]+)?>(.+\.(aac|flac|m4a|mp3|ogg|wav))<\/a>)/g,
			audioclipRegExp: /^https?:\/\/audioclip\.naver\.com\/(channels|audiobooks|curations|lives)\/([\_\-0-9a-zA-Z]+)(?:\/(clips)\/([\_\-0-9a-zA-Z]+))?/,
			azquotesRegExp: /^https?:\/\/(?:www\.)?azquotes\.com\/quote\/(\d+)/,
			bandcampRegExp: /^https?:\/\/(?:([\w]+)\.)bandcamp\.com(?:\/(album|track))?(?:\/([-a-z0-9]+))?/,
			bilibiliRegExp: /^https?:\/\/(?:(www|m|live)\.)?bilibili\.com\/(?:(video|bangumi|h5)\/)?(?:play\/)?(\w+)(?:.+)?$/,
			chzzkRegExp: /^https?:\/\/(?:m\.)?chzzk\.naver\.com(?:\/(clips|live|video))?\/(\w+)$/,
			codepenRegExp: /^https?:\/\/(?:www\.|m\.)?codepen\.io\/([a-zA-Z]+)\/(?:pen|details)\/((?:[a-z]+[A-Z]+|[A-Z]+[a-z]+)(?:[a-zA-Z]+))(?:\/)?$/,
			codesandboxRegExp: /^https?:\/\/(?:(?:www\.|m\.)?codesandbox\.io\/(?:s|embed|p\/sandbox)\/([^?\s]+)|(\w{6})\.csb\.app)/,
			dailymotionRegExp: /^https?:\/\/(?:www\.)?(?:dailymotion\.com(?:\/?(video|playlist))|dai\.ly)\/([-_0-9a-zA-Z]+)(?:\?playlist=([a-z0-9]+)|)(?:#video=([a-z0-9]+)|)?/,
			discordRegExp: /^https?:\/\/(?:www\.)?discord\.(?:(com|gg))\/(?:(invite|channels)\/)?(\w+)(?:[?/].+)?$/,
			facebookRegExp: /^https:\/\/(?:(?:www|m)\.facebook\.com|fb.(?:me|com)|fb.watch\/vH[a-zA-Z][\w_-]+)\/[^\s]+$/,
			fc2RegExp: /^https?:\/\/(video|live).fc2.com(?:\/content(?:.php\?[a-z_-]+)?)?(?:\/|=)(\w+)(?:(?:[/|&|?])?.+)?$/,
			figmaRegExp: /^https?:\/\/[\w\.-]+\.?figma\.com\/(file|design|board|proto|slides|deck)\/(\w{22,128})/,
			flickrRegExp: /^https?:\/\/(?:www\.)?flic(?:kr)?.(?:com|kr)\/(?:(f|go?|ps|s|y)\/)?(.+)/,
			gettyImagesRegExp: /^https?:\/\/(?:www\.)?gettyimages\.com\/(?:detail\/)?(?:([-\w]+)\/)?(?:([-\w]+)\/)?(\d+)(?:\?.+)?$/,
			giphyRegExp: /^https?:\/\/(?:(?:www|m)\.)?giphy\.com\/(?:(gifs|clips|stickers)\/)[\w-]+-(\w+)$/,
			githubRegExp: /^https:\/\/(?:(gist).)?(?:github|githubusercontent).com\/([\w-_.]+)\/(?:(\w{32})|([\w-_.]+)\/blob\/([\w-_.]+)\/(.+))$/,
			googleBooksRegExp: /^https:\/\/books\.google\.co(?:m|\.kr)\/books\?id=([^&]+).+$/,
			googleDriveRegExp: /https?:\/\/(?:docs|drive).google.com\/(?!forms\/)(?:(document|drive\/folders|drawings|embeddedfolderview|file|presentation|spreadsheets)[/?](?:(d\/(?:e\/)?|id=))?)?([-_a-zA-Z0-9]+)(?:[/?&#](?:.+)?)?$/,
			googleFormsRegExp: /^https?:\/\/(?:forms.gle|docs.google.com\/forms\/(d(?:\/e)?))\/([\w_-]+)(?:[/?&#](?:.+)?)?$/,
			googleMapsRegExp: /^https:\/\/(?:maps\.app\.goo\.gl\/\w{17}$|(?:www\.)?google\.com\/maps(?:\/|\?)(?:(?:(place|search|q))(?:\/|=))?(?:([^@/?&#!\s]+)\/?)?(?:\/?@([^/?&#\s!]+))?(?:\/?data=([^/?&#\s=]+))?)/,
			imdbRegExp: /^https?:\/\/(?:www\.|m\.)?imdb\.com\/video\/(?:(?:imdb|embed)\/)?((vi)(\d+))/,
			imgurRegExp: /^https?:\/\/(?:(?:(www|i))\.)?imgur\.com\/(?:(?:(a|gallery|(?:t|r)\/[\w]+))\/)?([\w]{2,})(?:\.[a-zA-Z]{3,4})?/,
			instagramRegExp: /^https?:\/\/(?:www\.)?(?:instagram|instagr)?\.(?:com|am)?(?:\/([a-zA-Z0-9]+))?(?:\/(p|tv|reel|tags))?\/([^/?#&\s]+)((?:(?:\/|\?)[^\s]+))?/,
			internetArchiveRegExp: /^https:\/\/(?:www\.)?archive\.org\/details\/([\w-.]+)/,
			iqiyiRegExp: /^https?:\/\/(?:(?:www)\.)?iq\.com\/(play)\/(?:(?:.+)?-)?([^?.]+)(?:\?.+)?$/,
			jjalbotRegExp: /^https?:\/\/(?:www\.)?jjalbot\.com\/(jjals|embed|media)(?:\/\d{0,4}\/\d{2})?\/([\w]+)(?:\/zzal\.gif)?/,
			jsfiddleRegExp: /^https?:\/\/(?:www\.|m\.)?jsfiddle\.net\/([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)(?:\/([A-Za-z0-9_-]+))?/,
			kakaoRegExp: /^https?:\/\/(?:(?:(www|play-tv|tv|sports|entertain|auto|news(?:link|\.v)?|v|video)(?:\.(?:media))?)\.)?(?:(?:(kakao\.com|daum\.net)))\/(?:.+)?(videoId|video|view|cliplink|livelink|l|v)(?:\/|\=)([0-9]+)/,
			kakaoMapRegExp: /^https?:\/\/(?:kko\.kakao\.com\/[\w_-]{10}$|(?:m\.)?map\.kakao\.com\/(?:actions\/(?:[a-zA-Z]+)View)?(.+)$)/,
			ktvRegExp: /^https?:\/\/(?:(?:www|m)\.)?ktv\.go\.kr\/(?:content|(?:issue|program|online)\/(?:home\/\w+|again|orgPromotion)|news\/(?:major|latest|issue|sphere\/T\d{6}))?\/(?:view(?:\/|\?(?:[^&\s]+&(?:amp;)?)?content_id=)|content\/)(\d+)/,
			mixcloudRegExp: /^https?:\/\/(?:(?:www|m)\.)?mixcloud\.com\/(.+?)\/(.+?)(?:\/)?$/,
			mlbRegExp: /^https:\/\/(?:www|m)\.mlb\.com\/video\/([-_a-z0-9.]+)(?:\?.+)?$/,
			msOfficeRegExp: /^<a(?:[^>]+)?data-file-srl="(\d+)"(?:[^>]+)?>(.+\.(pptx?|docx?|xlsx?))<\/a>/,
			nadioRegExp: /^https?:\/\/(?:www.)?nadio.co.kr\/series\/(\d+)\/episodes/,
			nateRegExp: /^https:\/\/(?:m.)?(tv|news).nate.com\/(clip|view)\/(\w+)[\S]+/,
			naverRegExp: /^https?:\/\/(?:naver\.me\/[\w]{8}$|(?:(?:(?:m.)?(?:sports|game|entertain)|tv|(?:n.|sports.)?news|media|m).)naver.com\/.+$)/,
			naverVibeRegExp: /^https?:\/\/vibe\.naver\.com\/(track|album|playlist)\/([\w]+)/,
			niconicoRegExp: /^https?:\/\/(?:(?:www|sp|(live))\.)?nico(?:video)?\.(?:jp|ms)\/(?:(watch)\/)?(\w{2}\d+)(?:(?:\?from=|\#)([0-9:]+))?/,
			pdfRegExp: /^<a(?:[^>]+)?data-file-srl="(\d+)"(?:[^>]+)?>(.+\.(pdf))<\/a>/,
			pinterestRegExp: /^https?:\/\/(?:(?:www\.)?pin\.it\/[\w]+$|(?:\w+\.)?pinterest\.(?:co\.?[a-z]+)\/([_a-z]+)(?:\/(?:([^/?]+))?(?:\/)?)?(?:(?:sent\/)?\?.+)?$)/,
			popkontvRegExp: /^https?:\/\/(?:www\.)?popkontv\.com\/clip\/(\d+)$/,
			preziRegExp: /^https?:\/\/prezi\.com\/(?:(v|p|m)\/)?([\w\d:_-]{12})\/([\w\d:_-]+)(?:.+)?/,
			qqRegExp: /^https?:\/\/(?:m\.)?v\.qq\.com\/(?:x\/(?:m\/)?)?(cover|page|play)(?:.+?(?:(?:cid=)?(\w{15})))?(?:.+?(?:(?:vid=)?(\w{11})))(?:.+?(?:(?:cid=)?(\w{15})))?/,
			redditRegExp: /^https?:\/\/(?:(?:www|np|www\.np)\.)?reddit\.com\/((?:r|user)\/[^/]+)\/comments\/(\w+)\/(\w+)(?:\/(\w+))?(?:(?:\/|\?)(?:.*)?)?$/,
			reliveRegExp: /^https?:\/\/(?:www\.)?relive\.cc\/view\/([a-zA-Z0-9]+)/,
			sbsRegExp: /^https?:\/\/(?:(?:m\.)?(www|programs|allvod|(?:m)?news)\.sbs\.co\.kr)\/(?:(?:m\/)?live\/(S\w+)|(?:\w+(?:\/\w+)?\/(vod|clip)\/\w+\/(\w+))|(?:\/)?news.+news_id=(\w+))/,
			slideshareRegExp: /^https?:\/\/(?:www\.)?slideshare\.net(?:\/(slideshow))?\/([^\/\?\&]+)\/([\w-]+)(?:\/\?\&\s)?/,
			soopRegExp: /^https?:\/\/(?:(vod|play|ch)\.)?sooplive\.co\.kr\/(\w+)(?:\/(\d+)(?:\/(catch(?:story)?)(?:\?o=(\d+))?)?)?/,
			soundcloudRegExp: /^https?:\/\/(?:(?:w|www|on)\.)?(?:soundcloud\.(?:com|app\.goog\.gl)|snd\.sc)\/([\w\-\.]+[^#\s]+)(.*)?(#[\w\-]+)?$/,
			spoonRegExp: /^https?:\/\/(?:www.)?spooncast.net\/([a-z]{2})\/(cast|live|playlist|profile)\/(@?[\w.-]+)/,
			spotifyRegExp: /^(spotify|http(?:s)?:\/\/(?:[a-z]+\.)?(?:spotify|spoti)\.(?:com|fi))[\/|:](?:user[\/|:]([a-zA-Z0-9]+)[\/|:])?(track|album|artist|playlist|show|episode)[\/|:]([0-9a-zA-Z]+)((?:\?.+|))/,
			streamableRegExp: /^https?:\/\/(?:[a-z0-9]+\.)?streamable\.com\/([a-zA-Z0-9_-]+)$/,
			sunoRegExp: /^https:\/\/suno.com\/song\/(\w{8}-\w{4}-\w{4}-\w{4}-\w{12})$/,
			tedRegExp: /^https?:\/\/((?:www\.|)ted\.com)\/talks\/([\_\-0-9a-zA-Z]+)/,
			telegramRegExp: /^https?:\/\/t\.me\/(\w+)\/(\d+)$/,
			tenorRegExp: /^https:\/\/tenor\.com\/(?:view\/[-a-z]+(\d+)$|([\w]+\.gif))/,
			threadsRegExp: /^https?:\/\/(?:www\.)?threads\.net\/@([\w\d._-]+)\/post\/(\w+)/,
			tiktokRegExp: /^https?:\/\/(?:(www|m|vt|vm)\.)?(?:tiktok\.com)(?:\/(@[a-z0-9_.-]+))?(?:\/(video|v|embed))?(?:\/(\w+))?/,
			tudouRegExp: /^https?:\/\/(?:(?:www|play)\.)?tudou\.com\/(v_show)\/id_([^?.]+)/,
			tumblrRegExp: /^https?:\/\/(?:tumblr\.app\.link\/\w+\?_p=\w+|([-_0-9a-z]+)\.tumblr\.com(?:\/blog\/view)?\/([-_0-9a-z]+)\/([0-9]+)?)/,
			tvSohuRegExp: /^https?:\/\/(?:www\.|(?:(m(?:y)?).)?tv\.)?sohu\.com\/(?:(v|us)\/)?(?:([\d]+)\/)?(.+?)\.(?:s)?html/,
			tvcfRegExp: /^https?:\/\/play\.tvcf\.co\.kr\/([0-9]+)?$/,
			typeformRegExp: /^https?:\/\/([\w\.-]+)\.typeform\.com\/to\/(\w+)/,
			udioRegExp: /^https?:\/\/(?:www\.)?udio\.com\/songs\/(\w+)?$/,
			videoRegExp: /(?:<p>)?<video[^>]+data-file-srl="(\d+)"(?:[^>]+)?>/g,
			vimeoRegExp: /^https?:\/\/(www|player\.)?vimeo.com\/(?:(?:channels|event|ondemand)\/(?:\w+\/)?|(?:album|groups)\/([^\/]*)\/videos\/|video\/|)(\d+)((?:\#t=.+|))(?:|\/\?)/,
			xRegExp: /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!explore|login|settings|tos|privacy|search|i\/flow|i\/events|i\/moments)(\w+){1,15}(?:\/(?:(status|lists))?)?(?:\/([0-9a-zA-Z-_]+)(?:\?.+)?)?$/,
			youkuRegExp: /^https?:\/\/(?:(?:www|v|m).)?youku.com\/(v_show|video)\/id_([^?.]+)/,
			youtubeRegExp: /^https?:\/\/(?:(?:www|m).)?(?:youtube.com|youtu.be)\/(?:(watch|v|(?:play)?list|embed|shorts|live)[\/|\?])?(?:([\w\-]{11}))?(?:(?:\?)?([v|list|si|t]\S+))?$/
		}
	}

	let paste = '';

	initEditor();

	async function initEditor() {
		try {
			const ck_editor = CKEDITOR.instances.editor1;
			if ( !ck_editor ) {
				console.error('CKEditor instance not found');
				return;
			}
			await new Promise(resolve => ck_editor.on('instanceReady', resolve));

			setIframeSrc(ck_editor);

			ck_editor.on('paste', async function(e) {
				paste = e.data.dataValue;
				await setContent(e, paste);
			});

			ck_editor.editable().on('input', async function(e) {
				const userAgent = window.navigator.userAgent;
				const matches = userAgent.match(/iPhone OS (\d+)_/);
				if (matches && parseInt(matches[1]) <= 10) {
					console.warn('iOS fallback logic applied.');
					return;
				}

				paste = e.data.$.data;
				if ( paste === null) {
					return;
				}
				e = e.sender;
				e.name = 'input';
				await setContent(e, paste);
			});

			ck_editor.on('drop', function(e) {
				const file_list = e.data.dataTransfer.$.files;
				if (file_list.length > 0) {
					uploadFiles(e.editor, file_list);
					e.stop();
				}
			});

			let originalInsertHtml = ck_editor.insertHtml;
			let html_inserted = '';

			ck_editor.insertHtml = async function(html) {
				html = html.replaceAll('%20', ' ');

				const services_of_insert = ['audioRegExp', 'msOfficeRegExp', 'pdfRegExp', 'videoRegExp'];
				for (const reg_exp of services_of_insert) {
					let matches;
					if ( reg_exp === 'audioRegExp' || reg_exp === 'videoRegExp' ) {
						matches = [...html.matchAll(preview.reg_exps[reg_exp])];
					} else {
						matches = html.match(preview.reg_exps[reg_exp]);
					}
					if ( !matches || !matches[0] ) {
						continue;
					}

					html_inserted = html;
					html = '';

					break;
				};

				await originalInsertHtml.call(this, html);
			};

			ck_editor.on('insertHtml', async function(e) {
				if (!html_inserted) {
					return;
				}

				paste = html_inserted;
				html_inserted = '';
				await setContentByInsertHtml(e, paste);
			});
		} catch (error) {
			console.error('Error during setEditor execution:', error);
		}
	}

	function setIframeSrc(editor) {
		const iframe_elements = editor.document.find('iframe[data-src]');
		iframe_elements.toArray().forEach((iframe) => {
			const data_src = iframe.getAttribute('data-src');
			if (data_src) {
				iframe.setAttribute('src', data_src);
			}
		});
	}

	function stopPaste(e, paste) {
		if ( e.name === 'paste' || e.name === 'insertHtml' ) {
			e.stop();
		} else if ( e.name === 'input' ) {
			(async function() {
				const { delContentByInput } = await import(functionScriptURL);
				delContentByInput(e.editor, paste);
			})();
		} else {
			return;
		}
	}

	function setContent(e, paste) {
		paste = paste.replace(/(<([^>]+)>)/gi, '');

		// Set Regular Expression of URL (the Source from XE Auto Link Add-on)
		const protocol_re = '(?:(?:https?)://)';
		const domain_re = '(?:[^\\s./)>]+\\.)+[^\\s./)>]+';
		const max_255_re = '(?:1[0-9]{2}|2[0-4][0-9]|25[0-5]|[1-9]?[0-9])';
		const ip_re = '(?:' + max_255_re + '\\.){3}' + max_255_re;
		const port_re = '(?::([0-9]+))?';
		const user_re = '(?:/~\\w+)?';
		const path_re = '(?:/[^\\s]*)?';
		const hash_re = '(?:#[^\\s]*)?';
		const url_regex = new RegExp('^(' + protocol_re + '(' + domain_re + '|' + ip_re + '|localhost' + ')' + port_re + user_re + path_re + hash_re + ')$', 'ig');

		if ( !paste.match(url_regex) ) {
			return;
		}

		// Media Embed
		if ( embed_services ) {
			const embed_service_list = embed_services ? embed_services.split(',') : null;
			if ( !embed_service_list ) {
				return;
			}

			let is_embedded = false;
			(async function() {
				for (const service of embed_service_list) {
					const reg_exp = service.replace(/_([a-z])/g, function(match, p1) {
						return p1.toUpperCase();
					}) + 'RegExp';

					const matches = paste.match(preview.reg_exps[reg_exp]);
					if ( !matches || !matches[0] ) {
						continue;
					}

					is_embedded = true;
					stopPaste(e, paste);

					try {
						const { handleEmbedService } = await import(functionScriptURL);
						const obj = {
							service: service,
							e: e,
							paste: paste,
							matches: matches
						}
						await handleEmbedService(obj);
					} catch (error) {
						console.error('Failed to load or execute handleEmbedService:', error);
					}

					break;
				}
			})();

			if ( is_embedded ) {
				return;
			}
		}

		// Link Preview
		if ( use_preview ) {
			stopPaste(e, paste);
			(async function() {
				const { setPreviewCard } = await import(functionScriptURL);
				const obj = {
					e: e,
					paste: paste
				}
				await setPreviewCard(obj);
			})();
		}

	}

	function setContentByInsertHtml(e, paste) {
		if ( !paste ) {
			return;
		}

		// Media Embed
		if ( embed_services ) {
			const embed_service_list = embed_services ? embed_services.split(',') : null;
			if ( !embed_service_list ) {
				return;
			}

			let is_embedded = false;
			(async function() {
				const services_of_insert = ['audio', 'ms_office', 'pdf', 'video'];
				for (const service of services_of_insert) {
					const reg_exp = service.replace(/_([a-z])/g, function(match, p1) {
						return p1.toUpperCase();
					}) + 'RegExp';

					let matches;
					if ( service === 'audio' || service === 'video' ) {
						matches = [...paste.matchAll(preview.reg_exps[reg_exp])];
					} else {
						matches = paste.match(preview.reg_exps[reg_exp]);
					}
					if ( !matches || !matches[0] ) {
						continue;
					}

					is_embedded = true;
					stopPaste(e, paste);

					try {
						const { handleEmbedService } = await import(functionScriptURL);
						const obj = {
							service: service,
							e: e,
							paste: paste,
							matches: matches
						}
						await handleEmbedService(obj);
					} catch (error) {
						console.error('Failed to load or execute handleEmbedService:', error);
					}

					break;
				}
			})();

			if ( is_embedded ) {
				return;
			}
		}
	}

	// 파일 드래그앤드롭 이벤트를 가로챔 : 업로드 프로그레스바 구현 및 오디오/비디오 재생목록 생성
	async function uploadFiles(editor, file_list) {
		const editor_container = preview.editor_container;
		let html_for_audio = '';
		let html_for_video = '';

		const progressbar = $('.xefu-progressbar');
		const progressbarGraph = $('.xefu-progressbar div');
		const progressStatus =  $('.xefu-progress-status');
		const progressPercent =  $('.xefu-progress-percent');

		const form = new FormData();
		form.append('mid', window.editor_mid ?? window.current_mid);
		form.append('act', 'procFileUpload');
		form.append('editor_sequence', preview.editor.data('editor-sequence'));

		for (let file of file_list) {
			form.append('Filedata', file);

			progressbar.stop(true, true).css('display', 'block');
			progressbarGraph.stop(true, true).css('width', '0%');
			progressPercent.stop(true, true).text('0%');
			progressStatus.stop(true, true).css('display', 'block');

			try {
				await new Promise((resolve, reject) => {
					$.ajax({
						url: window.request_uri,
						type: 'POST',
						async: true,
						contentType: false,
						processData: false,
						cache: false,
						data: form,
						dataType: 'json',
						xhr: function() {
							let xhr = $.ajaxSettings.xhr();
							xhr.upload.onprogress = function(e) {
								const lastUploadTime = Date.now();
								const progress = Math.round(e.loaded / e.total * 999) / 10;

								if ( progress < 99.9 ) {
									progressbarGraph.css('width', progress + '%');
									progressPercent.text(progress + '%');
								} else {
									progressbarGraph.css('width', '100%');
									progressPercent.text('100%');
								}
							};
							return xhr;
						},
						success: function(data) {
							if (data.error == 0) {
								const type = file.type;

								if ( !type.startsWith('audio/') && !type.startsWith('video/') ) {
									const html = editor_container.data('instance').generateHtml(editor_container, data);
									editor.insertHtml(html, 'unfiltered_html');
								} else {
									if ( type.startsWith('audio/') ) {
										html_for_audio += editor_container.data('instance').generateHtml(editor_container, data);
									} else if ( type.startsWith('video/') ) {
										html_for_video += editor_container.data('instance').generateHtml(editor_container, data);
									}
								}

								editor_container.data('editorStatus', data);
								editor_container.data('instance').loadFilelist(editor_container, true);
								resolve();
							} else {
								alert(window.xe.msg_file_upload_error + ' (Type ' + 8 + ")\n" + data.message);
								reject(data.message);
							}
						},
						error: function(jqXHR) {
							alert(window.xe.msg_file_upload_error + ' (Type ' + 9 + ")\n" + jqXHR.responseText);
							reject(jqXHR.responseText);
						}
					});
				});

				progressbar.stop(true, true).slideUp();
				progressStatus.stop(true, true).slideUp();
			} catch(error) {
				console.error('An error occurred during file upload:', error);

				progressbar.stop(true, true).slideUp();
				progressStatus.stop(true, true).slideUp();
			}
		};

		if (html_for_audio) {
			editor.insertHtml(html_for_audio, 'unfiltered_html');
		}
		if (html_for_video) {
			editor.insertHtml(html_for_video, 'unfiltered_html');
		}
	}

	// 파일 첨부와 함께 본문 삽입이 동시에 이뤄질 때, 비디오 파일들은 모아서 맨 나중에 삽입함
	const settings = preview.editor_container.data().settings;
	const originalAdd = settings.add;
	const originalDone = settings.done;
	let file_count = 1;
	let html_for_multiple = '';

    preview.editor_container.fileupload({
		add: function(e, item) {
			if (typeof originalAdd === 'function') {
				originalAdd.call(this, e, item);
			}
			file_count = item.originalFiles.length;
		},
        done: function(e, res) {
			const result = res.response()?.result;
			if (!result || !result.mime_type || (!result.mime_type.startsWith('audio/') && !result.mime_type.startsWith('video/'))) {
				if (typeof originalDone === 'function') {
					originalDone.call(this, e, res);
				}
				file_count--;
			} else {
				const lastUploadTime = Date.now();
				settings.progressbarGraph.width('100%');
				settings.progressPercent.text('100%');
				setTimeout(function() {
					if (lastUploadTime < Date.now() - 800) {
						settings.progressbar.slideUp();
						settings.progressStatus.slideUp();
					}
				}, 1000);

				if (!result) {
					alert(window.xe.msg_file_upload_error + " (Type 4)");
					return false;
				}
				if (!jQuery.isPlainObject(result)) {
					result = jQuery.parseJSON(result);
				}
				if (!result) {
					alert(window.xe.msg_file_upload_error + " (Type 5)" + "<br>\n" + res.response().result);
					return false;
				}

				if (result.error == 0) {
					let temp_code = '';
					const filename = String(result.source_filename);

					if (filename.match(/\.(aac|flac|mp3|ogg|wav)$/i) && preview.editor_container.data().autoinsertTypes.audio
						|| filename.match(/\.(mp4|webm)$/i) && preview.editor_container.data().autoinsertTypes.video) {
						temp_code = preview.editor_container.data('instance').generateHtml(preview.editor_container, result);
					}

					if(temp_code !== '') {
						var textarea = _getCkeContainer(settings.formData.editor_sequence).find('.cke_source');
						var editor = _getCkeInstance(settings.formData.editor_sequence);
						if (textarea.length && editor.mode == 'source') {
							temp_code += "\n";
						}
						html_for_multiple += temp_code;
					}

					if (typeof result.files !== 'undefined') {
						preview.editor_container.data('editorStatus', result);
					} else {
						preview.editor_container.data('editorStatus', null);
					}

					file_count--;

					if (file_count === 0) {
						try {
							if (textarea.length && editor.mode == 'source') {
								const caretPosition = textarea[0].selectionStart;
								const currentText = textarea[0].value;
								textarea.val(currentText.substring(0, caretPosition) + "\n" +
									html_for_multiple + "\n" +
									currentText.substring(caretPosition)
								);
							} else {
								editor.insertHtml(html_for_multiple, 'unfiltered_html');
							}
							html_for_multiple = '';
						}
						catch(err) {
							// pass
						}
					}
				} else if (result.message) {
					preview.editor_container.data('editorStatus', null);
					alert(result.message);
					return false;
				} else {
					preview.editor_container.data('editorStatus', null);
					alert(window.xe.msg_file_upload_error + " (Type 6)" + "<br>\n" + res.response().result);
					return false;
				}
			}
        }
    });

	// 첨부된 파일을 본문에 삽입할 때, 비디오 파일들을 모아서 맨 나중에 삽입함
	const instance = preview.editor_container.data('instance');
	const originalInsertToContent = instance.insertToContent;
	const originalDeleteFile = instance.deleteFile;

	instance.insertToContent = function() {
		const self = this;
		const data = preview.editor_container.data();
		const textarea = _getCkeContainer(data.editorSequence).find('.cke_source');
		const editor = _getCkeInstance(data.editorSequence);
		let html_for_multiple = '', html_for_single = '';

		$.each(data.selected_files, function(idx, file) {
			const file_srl = $(file).data().fileSrl;
			const result = data.files[file_srl];

			if (result) {
				if (result.mime_type.startsWith('audio/') || result.mime_type.startsWith('video/')) {
					html_for_single = self.generateHtml(preview.editor_container, result);
					if (textarea.length && editor.mode == 'source') {
						html_for_single += "\n";
					}
					html_for_multiple += html_for_single;
				} else {
					try {
						html_for_single = self.generateHtml(preview.editor_container, result);
						if (textarea.length && editor.mode == 'source') {
							const caretPosition = textarea[0].selectionStart;
							const currentText = textarea[0].value;
							textarea.val(currentText.substring(0, caretPosition) + "\n" +
								html_for_single + "\n" +
								currentText.substring(caretPosition)
							);
						} else {
							editor.insertHtml(html_for_single, 'unfiltered_html');
						}
					}
					catch(err) {
						// pass
					}
				}
			}
		});

		if ( html_for_multiple ) {
			try {
				if (textarea.length && editor.mode == 'source') {
					const caretPosition = textarea[0].selectionStart;
					const currentText = textarea[0].value;
					textarea.val(currentText.substring(0, caretPosition) + "\n" +
						html_for_multiple + "\n" +
						currentText.substring(caretPosition)
					);
				} else {
					editor.insertHtml(html_for_multiple, 'unfiltered_html');
				}
			}
			catch(err) {
				// pass
			}
		}

		//originalInsertToContent.apply(this, arguments);
	};

	instance.deleteFile = function() {
		if (typeof originalDeleteFile === 'function') {
			originalDeleteFile.apply(this, arguments);
		}

		const data = preview.editor_container.data();
		const file_srls = [];

		$.each(data.selected_files, function(idx, file) {
			const file_srl = file.dataset.fileSrl;
			const file_info = data.files[file_srl];
			const file_ext = file_info.source_filename.replace(/.+\.(\w+)/, '$1');
			if ( !file_info.mime_type.startsWith('application/vnd.openxmlformats-officedocument.')
				&& !file_info.mime_type.startsWith('audio/')
				&& !file_info.mime_type.startsWith('video/')
				&& !['application/msword', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel', 'application/pdf'].includes(file_info.mime_type)
				&& !/(?:aac|flac|mp3|ogg|wav|docx?|pptx?|xlsx?|pdf|mp4|webm)/i.test(file_ext) )
			{
				return true;
			}
			file_srls.push(file_srl);
		});

		if ( !file_srls.length ) {
			return;
		}

		const ckeditor = _getCkeInstance(data.editorSequence);
		const $html = $('<div>' + ckeditor.getData() + '</div>');
		const target_class = '.audio-embed, .ms-office-embed, .pdf-embed, .video-embed';
		const $media_embed = $html.find(target_class).parent();

		let updated_html = $html.prop('innerHTML');
		for ( let i = 0; i < $media_embed.length; i++ ) {
			const target_srls = $media_embed[i].dataset.fileSrl.split(',');
			const maintained_srls = target_srls.filter(x => !file_srls.includes(x));

			if ( JSON.stringify(maintained_srls) === JSON.stringify(target_srls) ) {
				continue;
			} else if ( maintained_srls.length < 1 ) {
				for ( let j = 0; j < target_srls.length; j++ ) {
					$media_embed.filter('[data-file-srl='+ target_srls.join(',') +']').remove();
				};
				updated_html = $html.prop('innerHTML');
			} else {
				const $target_element = $media_embed.eq(i);
				const target_properties = ['file_srl', 'source_filename', 'thumbnail_filename', 'mime_type', 'width', 'height', 'duration', 'title', 'album', 'artist'];
				const maintained_indices = maintained_srls.map((item) => {
					return target_srls.indexOf(item);
				});

				for ( let j = 0; j < target_properties.length; j++ ) {
					const opt = target_properties[j];
					const old_data = $target_element.find('iframe').data(opt);
					if ( typeof old_data === 'undefined' ) {
						continue;
					}
					const old_data_arr = old_data.split('|@|');
					const new_data = maintained_indices.map((index) => {
						return old_data_arr[index];
					}).join('|@|');
					$target_element.find('iframe').attr('data-' + opt, new_data);
				};
				$target_element.attr('data-file-srl', maintained_srls.join(','));

				if ( embed_leave_link ) {
					const old_hero_info = data.files[target_srls[0]];
					const old_download_url = request_uri + 'index.php?module=preview&act=procPreviewFileDownload&file_srl=' + old_hero_info.file_srl;
					const old_title_text = '<a data-file-srl="'+ old_hero_info.file_srl +'" href="'+ old_download_url.replace(/\&/g, '&amp;') +'">'+ old_hero_info.source_filename +'</a>';
					const old_title_link = embed_link_style ? embed_link_style.replaceAll('%text%', old_title_text) : old_title_text;

					const new_hero_info = data.files[maintained_srls[0]];
					const new_download_url = request_uri + 'index.php?module=preview&act=procPreviewFileDownload&file_srl=' + new_hero_info.file_srl;
					const new_title_text = '<a data-file-srl="'+ new_hero_info.file_srl +'" href="'+ new_download_url +'">'+ new_hero_info.source_filename +'</a>';
					const new_title_link = embed_link_style ? embed_link_style.replaceAll('%text%', new_title_text) : new_title_text;

					if ( embed_link_location <= 1 ) {
						if ( $target_element.prev().length && $target_element.prev().prop('outerHTML') === old_title_link ) {
							$target_element.prev().remove();
							$target_element.before(new_title_link);
						}
					} else if ( embed_link_location >= 2 ) {
						if ( $target_element.next().length && $target_element.next().prop('outerHTML') === old_title_link ) {
							$target_element.next().remove();
							$target_element.after(new_title_link);
						}
					}
				}

				updated_html = $html.prop('innerHTML');
			}
		};

		ckeditor.setData(updated_html);
	};
});