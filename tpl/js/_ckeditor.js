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
			airbnbRegExp: /^https?:\/\/(?:www\.)?airbnb\.(?:[.a-z]+)\/rooms\/(\d+)(?:\?.+)?/,
			amazonMusicRegExp: /^https?:\/\/music\.amazon\.com\/(tracks|albums|artists|playlists)\/(\w+)(?:[/?].+)?$/,
			appleMusicRegExp: /^https?:\/\/music\.apple\.com\/((\w{2})\/(?:(album|playlist|music-video|post))\/(?:([^/]+)\/)?(?:\d+\?)?((?:i=|ra.|pl.)?\w+))$/,
			applePodcastsRegExp: /^https?:\/\/podcasts\.apple\.com\/((\w{2})\/podcast\/([^/]+)\/id(\d+)\?i=(\d+))$/,
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
			naverRegExp: /^https?:\/\/(?:naver\.me\/[\w]{8}$|(?:(?:(?:m.)?(?:sports|game|entertain)|tv|(?:n.|sports.)?news|media|m).)naver.com\/.+$)/,
			naverVibeRegExp: /^https?:\/\/vibe\.naver\.com\/(track|album|playlist)\/([\w]+)/,
			niconicoRegExp: /^https?:\/\/(?:(?:www|sp|(live))\.)?nico(?:video)?\.(?:jp|ms)\/(?:(watch)\/)?(\w{2}\d+)(?:(?:\?from=|\#)([0-9:]+))?/,
			pdfRegExp: /^<a(?:[^>]+)?data-file-srl="(\d+)"(?:[^>]+)?>(.+\.(pdf))<\/a>/,
			pinterestRegExp: /^https?:\/\/(?:(?:www\.)?pin\.it\/[\w]+$|(?:\w+\.)?pinterest\.(?:co\.?[a-z]+)\/([_a-z]+)(?:\/(?:([^/?]+))?(?:\/)?)?(?:(?:sent\/)?\?.+)?$)/,
			preziRegExp: /^https?:\/\/prezi\.com\/(?:(v|p|m)\/)?([\w\d:_-]{12})\/([\w\d:_-]+)(?:.+)?/,
			qqRegExp: /^https?:\/\/(?:m\.)?v\.qq\.com\/(?:x\/(?:m\/)?)?(cover|page|play)(?:.+?(?:(?:cid=)?(\w{15})))?(?:.+?(?:(?:vid=)?(\w{11})))(?:.+?(?:(?:cid=)?(\w{15})))?/,
			redditRegExp: /^https?:\/\/(?:(?:www|np|www\.np)\.)?reddit\.com\/((?:r|user)\/[^/]+)\/comments\/(\w+)\/(\w+)(?:\/(\w+))?(?:(?:\/|\?)(?:.*)?)?$/,
			reliveRegExp: /^https?:\/\/(?:www\.)?relive\.cc\/view\/([a-zA-Z0-9]+)/,
			sbsRegExp: /^https?:\/\/(?:(?:m\.)?(www|programs|allvod|(?:m)?news)\.sbs\.co\.kr)\/(?:(?:m\/)?live\/(S\w+)|(?:\w+(?:\/\w+)?\/(vod|clip)\/\w+\/(\w+))|(?:\/)?news.+news_id=(\w+))/,
			slideshareRegExp: /^https?:\/\/(?:www\.)?slideshare\.net(?:\/(slideshow))?\/([^\/\?\&]+)\/([\w-]+)(?:\/\?\&\s)?/,
			soopRegExp: /^https?:\/\/(?:(vod|play|ch)\.)?sooplive\.co\.kr\/(\w+)(?:\/(\d+)(?:\/(catch(?:story)?)(?:\?o=(\d+))?)?)?/,
			soundcloudRegExp: /^https?:\/\/(?:(?:w|www|on)\.)?(?:soundcloud\.(?:com|app\.goog\.gl)|snd\.sc)\/([\w\-\.]+[^#\s]+)(.*)?(#[\w\-]+)?$/,
			spotifyRegExp: /^(spotify|http(?:s)?:\/\/(?:[a-z]+\.)?(?:spotify|spoti)\.(?:com|fi))[\/|:](?:user[\/|:]([a-zA-Z0-9]+)[\/|:])?(track|album|artist|playlist|show|episode)[\/|:]([0-9a-zA-Z]+)((?:\?.+|))/,
			streamableRegExp: /^https?:\/\/(?:[a-z0-9]+\.)?streamable\.com\/([a-zA-Z0-9_-]+)$/,
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
			vimeoRegExp: /https?:\/\/(www|player\.)?vimeo.com\/(?:(?:channels|event|ondemand)\/(?:\w+\/)?|(?:album|groups)\/([^\/]*)\/videos\/|video\/|)(\d+)((?:\#t=.+|))(?:|\/\?)/,
			xRegExp: /^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!explore|login|settings|tos|privacy|search|i\/flow|i\/events|i\/moments)(\w+){1,15}(?:\/(?:(status|lists))?)?(?:\/([0-9a-zA-Z-_]+)(?:\?.+)?)?$/,
			youkuRegExp: /^https?:\/\/(?:(?:www|v|m).)?youku.com\/(v_show|video)\/id_([^?.]+)/,
			youtubeRegExp: /^https?:\/\/(?:(?:www|m).)?(?:youtube.com|youtu.be)\/(?:(watch|v|(?:play)?list|embed|shorts|live)[\/|\?])?(?:([\w\-]{11}))?(?:(?:\?)?(\S+))?$/
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

			let originalInsertHtml = ck_editor.insertHtml;
			let html_inserted = '';

			ck_editor.insertHtml = async function(html) {
				html = html.replaceAll('%20', ' ');

				if (html.match(preview.reg_exps.pdfRegExp) || html.match(preview.reg_exps.msOfficeRegExp)) {
					html_inserted = html;
					html = '';
				}

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
				const matches_with_pdf = paste.match(preview.reg_exps.pdfRegExp);
				const matches_with_office = paste.match(preview.reg_exps.msOfficeRegExp);
				if ( matches_with_pdf || matches_with_office ) {
					is_embedded = true;
					stopPaste(e, paste);

					try {
						const { handleEmbedService } = await import(functionScriptURL);
						const obj = {
							service: matches_with_pdf ? 'pdf' : 'ms_office',
							e: e,
							paste: paste,
							matches: matches_with_pdf ?? matches_with_office
						}
						await handleEmbedService(obj);
					} catch (error) {
						console.error('Failed to load or execute handleEmbedService:', error);
					}
				}
			})();

			if ( is_embedded ) {
				return;
			}
		}
	}

});