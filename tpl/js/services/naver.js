export async function setNaverHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	preview.reg_exps.naverMeRegExp = /^https?:\/\/naver\.me\/[\w]{8}$/;
	preview.reg_exps.naverBridgeRegExp = /^https:\/\/(?:bridge-now|link)\.naver\.com\/bridge\?(?:target_)?url=([^&]+)/;
	preview.reg_exps.naverTVRegExp = /^https?:\/\/(?:m\.)?tv(?:cast)?\.naver\.com\/(v|l|h)\/(\d+)(?:|\/\?)/;
	preview.reg_exps.naverVideoRegExp = /^https?:\/\/(?:m\.)?(sports(?:\.news)?|(?:n\.)?news|media|entertain|game)\.naver\.com\/((?:(?:mnews|ranking|movie|now|series|kbaseball|wbaseball|kfootball|wfootball|basketball|volleyball|golf|general|esports)\/)?\w+(?:\/issue)?)(?:\/|\.nhn\?id=)?(?:(?:ranking\/)?read\.naver.+oid=|bi\/(?:mi|pi)\/mediaView\.naver\?code=)?(?:(\w+))?(?:(?:\/|\&)(?:(?:a|m)?id=)?(\w+))?(?:.+(?:albumId|photoId)?=(\d+))?(?:.+)?$/;
	preview.reg_exps.naverShortFormRegExp = /^https?:\/\/(?:m\.)?naver\.com(?:\/)?\/shorts\/\?(?:.+)?mediaId=([^&]+)\&.+$/;

	let matches = [];
	obj.url = obj.matches[0];

	const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

	waitMediaEmbed();

	// NAVER.ME
	matches = obj.url.match(preview.reg_exps.naverMeRegExp);
	if ( matches ) {
		const target_url = matches[0].replace(/^http:/, 'https:');
		$.getJSON(preview.cors + target_url, {format: 'short'}).done(function(data) {
			if ( !data ) {
				setPreviewCard(obj);
				return false;
			}

			obj.url = $.isArray(data) ? data[0] : data;
			if ( !obj.url ) {
				setPreviewCard(obj);
				return false;
			}

			const matchesBridge = obj.url.match(preview.reg_exps.naverBridgeRegExp);
			if ( matchesBridge && matchesBridge[1] ) {
				obj.url = decodeURIComponent(matchesBridge[1]);

				setNaverInit(obj);
				return;
			}

			setNaverInit(obj);
		}).fail(function() {
			setPreviewCard(obj);
			return false;
		});

		return;
	}
	
	setNaverInit(obj);
	return;
}

	async function setNaverInit(obj) {
		const { setPreviewCard } = await import('./_functions.js');

		let matches = [];

		// NAVER TV
		matches = obj.url.match(preview.reg_exps.naverTVRegExp);
		if ( matches && $.isNumeric(matches[2]) ) {
			obj.matches = matches;
			setNaverTV(obj);
			return;
		}

		// NAVER VIDEO
		matches = obj.url.match(preview.reg_exps.naverVideoRegExp);
		if ( matches && (matches[3] || matches[4]) ) {
			obj.matches = matches;
			setNaverVideo(obj);
			return;
		}

		// NAVER ShortForm
		matches = obj.url.match(preview.reg_exps.naverShortFormRegExp);
		if ( matches && matches[1] ) {
			obj.matches = matches;
			setNaverShortForm(obj);
			return;
		}
		
		setPreviewCard(obj);
		return;
	}

	async function setNaverTV(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		let type = obj.matches[1];
		const id = obj.matches[2];
		const target_url = 'https://tv.naver.com/' + type + '/' + id;

		$.get(preview.cors + target_url).done(function(data) {
			if ( !data ) {
				setPreviewCard(obj);
				return false;
			}

			if ( type === 'v') {
				const url = $(data).filter('meta[property="og:url"]').attr('content') || '';
				if ( url && url.indexOf('/h/') !== -1 ) {
					type = 'h';
				}
			}
			const style = (type === 'h') ? ' youtube-shorts' : '';

			let thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
				thumb = thumb ? '<img src="'+ thumb.replace(/\?.+$/, '') +'" />' : '';
			const iframe_src = ( type === 'l' ) ? 'https://tv.naver.com/'+ type +'/'+ id +'/sharePlayer' : 'https://tv.naver.com/embed/'+ id;

			obj.html =
				'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
					'<div class="'+ preview.iframe_wrapper + style +'">' +
						thumb +
						'<iframe src="'+ iframe_src +'" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>' +
					'</div>' +
				'</div>';
			insertMediaEmbed(obj);
			completeMediaEmbed();
		}).fail(function() {
			setPreviewCard(obj);
			return false;
		});
	}

	async function setNaverVideo(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed, procPreviewImageFileInfo, setPreviewCardByData } = await import('./_functions.js');

		let matches = obj.matches;
		const url = matches[0].replace(/\&amp\;/g, '&');
		const type = matches[1];
		const style = matches[2];
		const name = matches[3];
		let id = matches[4];

		if ( type === 'entertain' || type === 'sports' || type === 'sports.news' ) {
			if ( style === 'video' ) {
				const target_url = 'https://api-gw.' + type + '.naver.com/video/' + name + '?fields=all';

				$.getJSON(preview.cors + target_url).done(function(data) {
					if ( !data || !data.success ) {
						setPreviewCard(obj);
						return false;
					}

					const thumb = data.result.thumbnail ? '<img src="'+ data.result.thumbnail +'" />' : '';
					const iframe_src = 'https://tv.naver.com/embed/' + data.result.naverTv.clipNo;

					obj.html =
						'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
							'<div class="'+ preview.iframe_wrapper +'">' +
								thumb +
								'<iframe src="'+ iframe_src +'" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>' +
							'</div>' +
						'</div>';
					insertMediaEmbed(obj);
					completeMediaEmbed();
				}).fail(function() {
					setPreviewCard(obj);
					return false;
				});
			} else if ( style === 'game' ) {
				const target_url = 'https://api-gw.sports.naver.com/schedule/games/' + name;

				$.getJSON(preview.cors + target_url).done(function(data) {
					if ( !data || !data.success ) {
						setPreviewCard(obj);
						return false;
					}

					data = data.result.game.liveList[0];
					const iframe_src = 'https://m.sports.naver.com/game/popupPlayer/' + name;
					obj.data_obj = {
						inserting_type: 'media_embed',
						image_url: data.liveThumbnailCloud,
						mid: window.current_mid,
						editor_sequence: $container.data().editorSequence,
						allow_chunks: 'Y'
					};

					obj.html =
						'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
							'<div class="'+ preview.iframe_wrapper +'">' +
								'<img src="' + obj.data_obj.image_url + '" />' +
								'<iframe src="'+ iframe_src +'" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>' +
							'</div>' +
						'</div>';

					procPreviewImageFileInfo(obj);
				}).fail(function() {
					setPreviewCard(obj);
					return false;
				});
			} else if ( style === 'photocenter' ) {
				if ( name === 'photoList' || name === 'photo' ) {
					const target_url = matches[0];
					$.get(preview.cors + target_url).done(function(data) {
						if ( !data ) {
							setPreviewCard(obj);
							return false;
						}

						obj.data_obj = {
							image: $(data).filter('meta[property="og:image"]').attr('content') || '',
							title: $(data).filter('meta[property="og:title"]').attr('content') || '',
							description: $(data).filter('meta[property="og:description"]').attr('content') || '',
							author: $(data).filter('meta[property="og:author"]').attr('content') || '',
							site_name: new URL(url).hostname
						};

						setPreviewCardByData(obj);
						return false;
					}).fail(function() {
						setPreviewCard(obj);
						return false;
					});
				} else {
					setPreviewCard(obj);
					return false;
				}
			} else if ( style.indexOf('article') !== -1 ) {
				const target_url = 'https://api-gw.' + type + '.naver.com/news/article/' + name + '/' + id;

				$.getJSON(preview.cors + target_url).done(function(data) {
					if ( !data || !data.success ) {
						setPreviewCard(obj);
						return false;
					}

					const article_info = data.result.articleInfo.article;
					if ( !article_info ) {
						setPreviewCard(obj);
						return false;
					}
					if ( article_info.type === '1' ) {
						obj.data_obj = {
							image: article_info.imageFiles[0].url,
							title: article_info.title,
							description: article_info.subcontent,
							author: article_info.reporter,
							site_name: new URL(matches[0]).hostname
						};

						setPreviewCardByData(obj);
						return false;
					} else if ( article_info.type === '2' ) {
						data = article_info.vodKeys[0];
						if ( !data ) {
							setPreviewCard(obj);
							return false;
						}
						const thumb = data.coverImageUrl ? '<img src="'+ data.coverImageUrl +'" />' : '';
						const iframe_src = 'https://tv.naver.com/embed/' + data.navertvClipNo;

						obj.html =
							'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
								'<div class="'+ preview.iframe_wrapper +'">' +
									thumb +
									'<iframe src="'+ iframe_src +'" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>' +
								'</div>' +
							'</div>';
						insertMediaEmbed(obj);
						completeMediaEmbed();
						return false;
					} else {
						setPreviewCard(obj);
						return false;
					}
				}).fail(function() {
					setPreviewCard(obj);
					return false;
				});
			} else {
				setPreviewCard(obj);
				return false;
			}
		} else if ( type === 'game' ) {
			if ( name === 'videos' && $.isNumeric(id) ) {
				const target_url = 'https://esports-api.game.naver.com/service/v1/video/id/' + id;
				$.getJSON(preview.cors + target_url).done(function(data) {
					if ( !data || data.code !== 200 || !data.content || !data.content.clipNo ) {
						setPreviewCard(obj);
						return false;
					}
					const thumb = data.content.imageUrl ? '<img src="'+ data.content.imageUrl +'" />' : '';
					const iframe_src = 'https://tv.naver.com/embed/' + data.content.clipNo;

					obj.html =
						'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
							'<div class="'+ preview.iframe_wrapper +'">' +
								thumb +
								'<iframe src="'+ iframe_src +'" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>' +
							'</div>' +
						'</div>';
					insertMediaEmbed(obj);
					completeMediaEmbed();
				}).fail(function() {
					setPreviewCard(obj);
					return false;
				});
			} else {
				setPreviewCard(obj);
				return false;
			}
		} else {
			$.get(preview.cors + encodeURIComponent(url)).done(function(data) {
				if ( !data ) {
					setPreviewCard(obj);
					return false;
				}

				if ( type === 'n.news' || type === 'news' ) {
					matches = data.match(/<div\sclass="_VOD_PLAYER_WRAP"([^<]+)<\/div>/);
					if ( !matches ) {
						setPreviewCard(obj);
						return false;
					}

					const vod_info = matches[1];
					let list = [];
					obj.data_obj = {};
					$.map($.trim(vod_info).split('\n'), function(v, i) {
						list = $.trim(v).split('=');
						obj.data_obj[list[0].replace('data-', '').replace(/\-/g, '_')] = list[1].replace(/[">]/g, '');
					});
					const thumb = obj.data_obj.cover_image_url ? '<img src="'+ obj.data_obj.cover_image_url +'" />' : '';

					const target_url = 'https://apis.naver.com/rmcnmv/rmcnmv/vod/play/v2.0/' + obj.data_obj.video_id + '?key=' + obj.data_obj.inkey;
					$.getJSON(preview.cors + target_url).done(function(data) {
						if ( !data || !data.meta ) {
							setPreviewCard(obj);
							return false;
						}
						id = data.meta.contentId;
						const iframe_src = 'https://tv.naver.com/embed/' + id;

						obj.html =
							'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
								'<div class="'+ preview.iframe_wrapper +'">' +
									thumb +
									'<iframe src="'+ iframe_src +'" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>' +
								'</div>' +
							'</div>';
						insertMediaEmbed(obj);
						completeMediaEmbed();
					}).fail(function() {
						setPreviewCard(obj);
						return false;
					});
				} else {
					setPreviewCard(obj);
					return false;
				}
			}).fail(function() {
				setPreviewCard(obj);
				return false;
			});
		}
	}

	async function setNaverShortForm(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		let matches = obj.matches;
		const id = matches[1];
		const target_url = matches[0];

		$.get(preview.cors + encodeURIComponent(target_url)).done(function(data) {
			if ( !data ) {
				setPreviewCard(obj);
				return false;
			}

			matches = data.match(/endPageUrl\":\"([^"]+)/);
			if ( !matches ) {
				setPreviewCard(obj);
				return false;
			}

			// NAVER TV
			matches = matches[1].match(preview.reg_exps.naverTVRegExp);
			if ( matches && $.isNumeric(matches[2]) ) {
				obj.matches = matches;
				setNaverTV(obj);
				return;
			}

			matches = data.match(/endPageMobileUrl\":\"([^"]+)/);
			if ( !matches ) {
				setPreviewCard(obj);
				return false;
			}

			const iframe_src = matches[1];

			let thumb = $(data).filter('meta[property="og:image"]').attr('content').replace(/\?.+/, '') || '';
				thumb = thumb ? '<img src="'+ thumb +'" />' : '';

			obj.matches = matches;
			obj.html =
				'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
					'<div class="'+ preview.iframe_wrapper +' youtube-shorts">' +
						thumb +
						'<iframe src="'+ iframe_src +'" frameborder="no" scrolling="no" loading="lazy" allowfullscreen></iframe>' +
					'</div>' +
				'</div>';
			insertMediaEmbed(obj);
			completeMediaEmbed();
		}).fail(function() {
			setPreviewCard(obj);
			return false;
		});
	}