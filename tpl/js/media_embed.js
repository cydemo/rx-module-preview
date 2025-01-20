$(document).ready(function() {
	if ( $("link[href*='common/css/xeicon']").length < 1 ) {
		$('<link href="/common/css/xeicon/xeicon.min.css" rel="stylesheet">').appendTo('head');
	}

	var thumb, width, height;
	var cors = request_uri +'modules/preview/libs/media_embed.cors.php?url=';

	var $self_embed = $('.github-embed, .kakao-map-embed, .ms-office-embed, .nate-embed, .pdf-embed, .popkontv-embed, .spoon-embed, .suno-embed, .video-embed');
	if ( $self_embed.length > 0 ) {
		if ( $self_embed.find('iframe').length > 0 ) {
			$self_embed.find('iframe').each(function() {
				if ( $(this).attr('src') === undefined && $(this).data('src') ) {
					$(this).attr('src', $(this).data('src'));
				}
			});
		}
	}

	var $airbnb = $('.airbnb-embed');
	if ( $airbnb.length > 0 ) {
		$airbnb.each(function() {
			$(this).scrollLeft(($(this).children('iframe').width() - $(this).width()) / 2);
		});
	}

	var $amzmusic = $('.amazon-music-embed');
	if ( $amzmusic.length > 0 ) {
		$amzmusic.each(function() {
			if ( !$(this).hasClass('amazon-music-track') ) {
				return true;
			};
			if ( $(this).closest('.media_embed_wrapper').outerWidth() > 498 ) {
				$(this).css({height: 250});
			} else {
				$(this).css({height: 345});
			}
		});
	}

	var $flickr = $('.flickr-embed');
	if ( $flickr.length > 0 ) {
		$flickr.each(function() {
			if ( !$(this).children('iframe').attr('data-flickr-embed') ) {
				$(this).children('iframe').attr('data-flickr-embed', 'true');
			}
		});
		$('body').append('<script async src="https://embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>');
	}

	var $insta = $('.instagram-media');
	if ( $insta.length > 0 ) {
		$('body').append('<script async defer src="https://www.instagram.com/embed.js" />');
	}

	var $pin = $('.pinterest-embed');
	if ( $pin.length > 0 ) {
		// oembed 지원 이후 iframe 적용이 가능해진 경우 (로드시에만 세로 사이즈 조절)
		if ( $pin.find('iframe').length > 0 ) {
			$pin.each(function() {
				var ratio = parseInt(this.style.width) / parseInt(this.style.height);
				var gap = (ratio > 0.6) ? 18: 0;
				if ( $(this).width() < parseInt(this.style.width) ) {
					$(this).css('height', Math.ceil($(this).width() / ratio) + gap);
				}
			});
		}

		// oembed 지원 이전의 api 활용의 경우
		if ( $('.pinterest-pin').length > 0 || $('.pinterest-board').length > 0 || $('.pinterest-profile').length > 0 ) {
			if ( $('.pinterest-pin').length > 0 ) {
				$('.pinterest-pin').children('a').each(function() {
					if ( !$(this).attr('data-pin-do') || !$(this).attr('data-pin-width') ) {
						$(this).attr('data-pin-do', 'embedPin').attr('data-pin-width', 'large');
					}
				});
			}
			if ( $('.pinterest-board').length > 0 ) {
				$('.pinterest-board').children('a').each(function() {
					if ( !$(this).attr('data-pin-do') || !$(this).attr('data-pin-scale-width') || !$(this).attr('data-pin-scale-height') || !$(this).attr('data-pin-board-width') ) {
						$(this).attr('data-pin-do', 'embedBoard').attr('data-pin-scale-width', 160).attr('data-pin-scale-height', 540).attr('data-pin-board-width', 580);
					}
				});
			}
			if ( $('.pinterest-profile').length > 0 ) {
				$('.pinterest-profile').children('a').each(function() {
					if ( !$(this).attr('data-pin-do') || !$(this).attr('data-pin-scale-width') || !$(this).attr('data-pin-scale-height') || !$(this).attr('data-pin-board-width') ) {
						$(this).attr('data-pin-do', 'embedUser').attr('data-pin-scale-width', 160).attr('data-pin-scale-height', 540).attr('data-pin-board-width', 580);
					}
				});
			}
			$.getScript('https://assets.pinterest.com/js/pinit.js');
		}
	}

	var $typeform = $('.typeform-embed');
	if ( $typeform.length > 0 ) {
		$.getScript('//embed.typeform.com/next/embed.js');
	}

	var $twitter = $('.twitter-status, .twitter-timeline, .twitter-moment');
	if ( $twitter.length > 0 ) {
		var id;
		$twitter.each(function(i) {
			if ( $(this).hasClass('twitter-status') && !$(this).find('iframe').attr('data-tweet-id') ) {
				$(this).find('iframe').attr('data-tweet-id', $(this).attr('id').replace(/[^0-9]+/g, ''));
			} else if ( $(this).hasClass('twitter-timeline') && (!$(this).attr('data-width') || !$(this).attr('data-tweet-limit')) ) {
				$(this).attr('data-width', 550).attr('data-tweet-limit', 3);
			}
			if ( i + 1 === $twitter.length ) {
				$.getScript('https://platform.twitter.com/widgets.js');
			}
		});
	}

	var $ytmusic = $('.media_embed.youtube-music iframe');
	if ( $ytmusic.length > 0 ) {
		$ytmusic.each(function(i) {
			$(this).closest('.youtube-music').append(
				'<div class="youtube-music-loading"><div><i class="xi-spinner-5 xi-spin"></i><span>Loading...</span></div></div>'
			);
			$(this).attr('id', 'user_content_youtube-music-' + i);
			ids[i] = {};
			ids[i].oid = this.id;

			var root = $(this).closest('.youtube-music');
			var desc = root.find('.youtube-music-desc');

			var progress = root.find('.progress');
			var bar = progress.children('.bar');
			var range = progress.children('input[type=range]');
			var vols = root.find('[class^=xi-volume-]');
			var volume = root.find('.volume');

			if ( range.length < 1 ) {
				bar.after('<input type="range" min="0" max="100" step="1" value="0" disabled />');
				var range = progress.children('input[type=range]');
			}

			if ( volume.length < 1 ) {
				vols.last().after('<input class="volume" type="range" min="0" max="100" step="1" value="100" disabled />');
				var volume = root.find('.volume');
			}

			if ( !$(this).attr('allow') ) {
				$(this).attr('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
				$(this).attr('src', $(this).next().attr('alt'));
				$(this).next().removeAttr('alt');
			}

			desc.find('a').removeAttr('rel');
		});
		$.getScript('https://www.youtube.com/iframe_api');
	}

	$(window).on('resize', triggerResizeEvent);

	$(window).on('message', function(e) {
		triggerMessageEvent(e);
	});
});

let current_frame_id = null;

function triggerMessageEvent(e) {
	var event = {}, data = {}, name, width, height, arr = [], ratio, total;
	event = e.originalEvent;

	if ( event.origin + '/' === request_uri ) {
		var $self_embed = $('.nate-embed, .popkontv-embed, .spoon-embed, .suno-embed, .video-embed');
		if ( $self_embed.length > 0 ) {
			const { id, action } = event.data;
			if (action === 'play') {
				if ( current_frame_id && current_frame_id !== id ) {
					const target_iframe = $('[data-frame-id="'+ current_frame_id +'"]');
					if ( target_iframe.length ) {
						target_iframe[0].contentWindow.postMessage({ action: 'pause' }, '*');
					}
				}
				current_frame_id = id;
			} else if (action === 'pause') {
				if ( current_frame_id === id ) {
					current_frame_id = null;
				}
			}
		}

		var $github = $('.github-embed');
		if ( $github.length > 0 ) {
			$github.find('iframe').each(function() {
				if ( this.contentWindow === event.source ) {
					data = event.data;
					if ( data.type === 'github-embed' ) {
						$(this).parent().css({
							paddingBottom: ( (data.height < data.width) ? data.height : '100%' )
						});
						return;
					}
				}
			});
		}

		var $pdf = $('.pdf-embed');
		if ( $pdf.length > 0 ) {
			$pdf.find('iframe').each(function() {
				if ( this.contentWindow === event.source ) {
					data = event.data;
					if ( data.type === 'pdf-embed' ) {
						$(this).parent().css({
							paddingBottom: data.height
						});
						return;
					}
				}
			});
		}

		var $flickr = $('iframe.flickr-embed-frame');
		if ( $flickr.length > 0 ) {
			$flickr.each(function() {
				if ( this.contentWindow === event.source ) {
					data = event.data;
					if ( data.name === 'loaded' && $.inArray(data.data, arr) === -1 ) {
						arr.push(data.data);
						ratio = Number(($(this).data('natural-height') / $(this).data('natural-width')).toFixed(4));
						$(this).attr('data-ratio', ratio);
						return;
					}
				}
			});
		}
	} else if ( $.inArray(event.origin, ['https://www.facebook.com', 'https://m.facebook.com']) !== -1 ) {
		var $fb = $('.fb-post, .fb-video, .fb-page');
		if ( $fb.length > 0 ) {
			$fb.find('iframe').each(function() {
				if ( this.contentWindow === event.source ) {
					data = event.data;
					if ( data.indexOf('type=resize') !== -1 ) {
						height = data.match(/height=(\d+)/)[1];
						if ( event.origin === 'https://m.facebook.com' ) {
							width = data.match(/width=(\d+)/)[1];
							ratio = (height / width).toFixed(4);
							width = $(this).outerWidth();
							height = Math.floor(width * ratio);
						}
						$(this).parent().css({height: height});
						$(this).css({height: height});
						if ( $(this).next().length > 0 ) {
							$(this).next().remove();
						}
						return;
					}
				}
			});
		}
	} else if ( event.origin === 'https://imgur.com' ) {
		data = JSON.parse(event.data);
		if ( data.message === 'resize_imgur' ) {
			$('.imgur-embed').children('p').remove();
			$('.imgur-embed').children('iframe[src="'+ data.href +'"]').css({
				width : data.width,
				height : data.height
			});
		}
	} else if ( event.origin === 'https://www.instagram.com' ) {
		$('iframe.instagram-media').each(function() {
			if ( this.contentWindow === event.source ) {
				data = JSON.parse(event.data);
				if ( data.type === 'MEASURE' ) {
					$(this).css({height: data.details.height});
					$(this).next('p').remove();
					return;
				}
			}
		});
	} else if ( event.origin === 'https://www.redditmedia.com' || event.origin === 'https://embed.reddit.com' ) {
		$('.reddit-embed > iframe').each(function() {
			if ( this.contentWindow === event.source ) {
				data = JSON.parse(event.data);
				if ( data.type === 'resize.embed' ) {
					$(this).parent('.reddit-embed').css({height: data.data});
					return;
				}
			}
		});
	} else if ( event.origin === 'https://t.me' ) {
		$('.telegram-embed > iframe').each(function() {
			if ( this.contentWindow === event.source ) {
				data = JSON.parse(event.data);
				if ( data.event === 'resize' ) {
					$(this).parent('.telegram-embed').css({height: data.height});
					return;
				}
			}
		});
	} else if ( event.origin === 'https://www.threads.net' ) {
		$('.threads-embed > iframe').each(function() {
			if ( this.contentWindow === event.source ) {
				$(this).parent('.threads-embed').css({height: event.data});
			}
		});
	} else if ( event.origin === 'https://www.tiktok.com' ) {
		if ( event.data.includes('{') ) {
			data = JSON.parse(event.data);
			name = data.signalSource;
			$('[name="'+ name +'"]').css({
				width: data.width,
				height: data.height
			});
		}
	} else if ( event.origin === 'https://embed.tumblr.com' ) {
		$('iframe.tumblr-embed').each(function() {
			if ( this.contentWindow === event.source ) {
				data = JSON.parse(event.data);
				if ( data.method === 'tumblr-post:sizeChange' ) {
					$(this).css({height: data.args[0]});
					return;
				}
			}
		});
	} else if ( event.origin === 'https://platform.twitter.com' ) {
		if ( typeof(event.data) === 'object' && event.data['twttr.embed'].method === 'twttr.private.resize' ) {
			data = event.data['twttr.embed'].params[0];
			name = data.data.tweet_id;
			$('[data-tweet-id="'+ name +'"]').css({
				height: data.height
			});
		}
	} else if ( event.origin === 'https://www.youtube.com' ) {
		data = JSON.parse(event.data);
		if ( data.event === 'onReady' ) {
			$('.youtube-music').find('iframe[id="user_content_youtube-music-'+ (data.id - 1) +'"]').closest('.youtube-music').children('.youtube-music-loading').remove();
		}
		if ( data.event === 'infoDelivery' ) {
			var info = data.info;
			if ( info.currentTime ) {
				var n = data.id - 1;
				var root = $('.youtube-music').find('iframe[id="user_content_youtube-music-'+ n +'"]').closest('.youtube-music');
				var progress = root.find('.progress');
				var bar = progress.find('.bar');
				var range = progress.find('input[type="range"]');
				var timer = root.find('.timer');

				if ( info.duration ) {
					total = Math.ceil(info.duration);
					timer.children('span').last().text(sformat(total));
					range.attr('max', total);
				} else {
					total = range.attr('max') * 1;
				}

				var c_time = Math.ceil(info.currentTime);
				timer.children('span').first().text(sformat(c_time));
				range.attr('value', c_time);

				var diff = Math.round((c_time / total) * 100);
				var buff = Math.round(info.videoLoadedFraction * 100);
				bar.css(
					'background',
					'linear-gradient(to right, #c33 ' + diff + '%, #999 ' + diff + '% ' + buff + '%, #444 ' + buff + '%)'
				);
			}
		}
	}
}

function triggerResizeEvent() {
	var width, height, limit;

	if ( $('.amazon-music-embed').length > 0 ) {
		$('.amazon-music-embed').each(function() {
			if ( !$(this).hasClass('amazon-music-track') ) {
				return true;
			};
			limit = 400;
			if ( $(this).closest('.media_embed_wrapper').outerWidth() > limit ) {
				$(this).css({height: 230});
			} else {
				$(this).css({height: 330});
			}
		});
	}
	if ( $('.flickr-embed-frame').length > 0 ) {
		$('.flickr-embed-frame').each(function() {
			limit = Number($(this).parent().attr('id').match(/user_content_filckr_(\d+)x\d+/)[1]);
			if ( $(this).outerWidth() < limit ) {
				$(this).css({width: '100%'});
			} else {
				$(this).css({width: limit});
			}
			width = $(this).outerWidth();
			height = Math.floor(width * $(this).data('ratio'));
			$(this).css({height: height});
			$(this).contents().find('.flickr-embed-photo').css({width: width, height: height});
			$(this).contents().find('.flickr-embed-photo').find('img').css({height: 'auto'});
		});
	}
	if ( $('.youtube-music iframe').length > 1 ) {
		$('.youtube-music iframe').each(function() {
			var root = $(this).closest('.youtube-music');
			var desc = root.find('.youtube-music-desc');
			var title_container = desc.find('span').eq(0);
			var title_text = title_container.children('a').first();

			title_text.stop(true, true);
			if ( title_text.width() + 16 > title_container.width() ) {
				if ( title_container.children().length < 2 ) {
					title_container.append(title_text.clone());
					var _clone = title_container.children().last();
					_clone.css({marginLeft: 16});
				}
				slideText(title_text);
			} else if ( title_text.width() + 16 <= title_container.width() ) {
				if ( title_container.children().length > 1 ) {
					title_text.remove();
					title_container.children().css({marginLeft: 0});
				}
			}
		});
	}
}

var ids = [], browser_title = document.title;
var oid, total, val, diff, buff, vol, url, aid, number, index, n;
var play_list = [], list = [], shuffled_list = [], status_list = [], html;
var wait_message = '<i class="xi-spinner-5 xi-spin"></i><p>콘텐츠를 로딩 중입니다.<br>잠시만 기다려주세요.</p>';
var msg_not_loaded = '재생할 수 없는 콘텐츠';
var msg_unknown = '알 수 없음';
var isPushed = false, isMobile = false;
if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
	isMobile = true;
}

function onYouTubeIframeAPIReady() {
	$.each(ids, function(i, v) {
		var player = new YT.Player(v.oid, {
			events: {
				'onReady': onYouTubePlayerReady,
				'onStateChange': onYouTubePlayerStateChange
			}
		});
		ids[i].obj = player;
	});
}

function onYouTubePlayerReady(event) {
	var obj = event.target;
	var iframe = $(obj.getIframe());
	var root = iframe.closest('.youtube-music');

	var desc = root.find('.youtube-music-desc');
	var title_container = desc.find('span').eq(0);
	var title_text = title_container.children('a').first();

	var progress = root.find('.progress');
	var bar = progress.children('.bar');
	var range = progress.children('input[type=range]');

	var remote = root.find('.remote');
	var play = root.find('.xi-play');
	var pause = root.find('.xi-pause-o');
	var refresh = root.find('.xi-refresh-l');
	var prev = root.find('.xi-step-backward-o');
	var next = root.find('.xi-step-forward-o');
	var vols = root.find('[class^=xi-volume-]');
	var volume = root.find('.volume');
	var fs = root.find('.xi-expand-square');
	var bars = root.find('.xi-bars');
	var loop = root.find('.xi-repeat');
	var shuffle = root.find('.xi-shuffle');

	if ( title_text.width() + 16 > title_container.width()  ) {
		if ( title_container.children().length < 2 ) {
			title_container.append(title_text.clone());
			var _clone = title_container.children().last();
			_clone.css({marginLeft: 16});
		}
		slideText(title_text);
	}
	if ( isMobile ) {
		progress.addClass('is_mobile');
	}

	url = obj.getVideoUrl();
	aid = url.getQuery('v');

	$.each(ids, function(i, v) {
		if ( v.obj.getIframe() === obj.getIframe() ) {
			ids[i].playing = '';
			if ( url.getQuery('list') ) {
				var _list = obj.getPlaylist();
				ids[i].original_list = _list;
				ids[i].play_history = '';
				root.find('.xi-bars').show();
				return false;
			} else if ( iframe.attr('src').getQuery('cue_required') ) {
				$.get(cors + 'https://www.youtube.com/playlist?list=' + iframe.attr('src').getQuery('list')).done(function(data) {
					matches = data.match(/var\s?ytInitialData\s?=\s?(.+?);<\/script>/);
					data = JSON.parse(matches[1]);
					data = data.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
					var _list = [];
					for ( var j = 0; j < data.length; j++ ) {
						var _vid = data[j].playlistVideoRenderer.videoId;
						_list[j] = _vid;
						if ( j === data.length - 1 ) {
							ids[i].original_list = _list;
							ids[i].play_history = '';
							obj.cuePlaylist(_list);
							root.find('.xi-bars').show();
						}
					}
					return false;
				});
			}
		}
	});

	play.on('click', function() {
		showIframe(obj);
		obj.playVideo();
	});

	refresh.on('click', function() {
		showIframe(obj);
		obj.playVideo();
	});

	pause.on('click', function() {
		$(this).hide();
		$(this).prev('.xi-play').show();
		obj.pauseVideo();
	});

	prev.on('click', function() {
		showIframe(obj);
		obj.previousVideo();
	});

	next.on('click', function() {
		showIframe(obj);
		obj.nextVideo();
	});

	vols.on('click', function(e) {
		val = $(this).attr('class').replace('xi-volume-', '');
		vol = obj.getVolume();
		if ( val !== 'off' ) {
			$(this).parent().children('i').not('.xi-volume-off').hide();
			$(this).parent().children('.xi-volume-off').show();
			obj.mute();
		} else {
			$(this).parent().children('i').hide();
			if ( vol > 66 ) {
				$(this).parent().children('.xi-volume-max').show();
			} else if ( vol > 33 ) {
				$(this).parent().children('.xi-volume-mid').show();
			} else if ( vol > 0 ) {
				$(this).parent().children('.xi-volume-min').show();
			} else if ( vol === 0 ) {
				obj.setVolume(5);
				$(this).parent().children('.volume').attr('value', 5);
				$(this).parent().children('.xi-volume-min').show();
			}
			obj.unMute();
		}
	});

	volume.on('change mousemove', function (e) {
		vol = $(this).val() * 1;
		if ( e.type === 'change' && vol > 0 ) {
			obj.unMute();
		}
		if ( !obj.isMuted() ) {
			$(this).prevAll().hide();
			if ( vol > 66 ) {
				$(this).parent().children('.xi-volume-max').show();
			} else if ( vol > 33 ) {
				$(this).parent().children('.xi-volume-mid').show();
			} else if ( vol > 0 ) {
				$(this).parent().children('.xi-volume-min').show();
			} else if ( vol === 0 ) {
				$(this).parent().children('.xi-volume-off').show();
			}
		}
		obj.setVolume(vol);
	});

	fs.on('click', function() {
		var object = obj.getIframe();
		if ( object.requestFullscreen ) {
			object.requestFullscreen();
		} else if ( object.mozRequestFullScreen ) {
			object.mozRequestFullScreen();
		} else if ( object.webkitRequestFullscreen ) {
			object.webkitRequestFullscreen();
		} else if ( object.msRequestFullscreen ) {
			object.msRequestFullscreen();
		}
	    if ( screen.orientation && screen.orientation.lock ) {
			screen.orientation.lock('landscape');
		}
	});

	bars.on('click', function() {
		var _root = $(this).closest('.youtube-music');
		var _url = _root.find('iframe').attr('src');
		var _list = [];

		if ( !_url.getQuery('list') ) {
			return false;
		}
		n = _root.find('iframe').attr('id').replace('user_content_youtube-music-', '') * 1;
		play_list = ids[n].original_list;

		$(this).fadeOut();
		_root.css('padding-bottom', (_root.css('padding-bottom').replace('px', '') * 1) + 184);
		_root.find('.youtube-music-table-wrapper').addClass('loading').html(wait_message);

		n = 0;
		$.map(play_list, function(vid, idx) {
			$.getJSON('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + vid).done(function(data) {
				n++;
				_list[idx] =
					'<div class="youtube-music-tr'+ (vid === aid ? ' on' : '') +'" data-key="'+ idx +'" data-id="'+ vid +'">' +
						'<span class="_key">'+ (idx + 1) +'</span>' +
						'<span class="_img"><p><img src="https://i.ytimg.com/vi/'+ vid +'/mqdefault.jpg" /></p></span>' +
						'<span class="_ttl">'+ data.title +'</span>' +
						'<span class="_anm">'+ data.author_name.replace(/\s+[-]\s+Topic/, '') +'</span>' +
					'</div>';
				if ( n === play_list.length ) {
					setPlayList(obj, _list);
				}
			}).fail(function() {
				n++;
				_list[idx] =
					'<div class="youtube-music-tr" data-key="'+ idx +'" data-id="'+ vid +'">' +
						'<span class="_key">'+ (idx + 1) +'</span>' +
						'<span class="_img"><p><img src="https://i.ytimg.com/vi/'+ vid +'/default.jpg" /></p></span>' +
						'<span class="_ttl">'+ msg_not_loaded +'</span>' +
						'<span class="_anm">'+ msg_unknown +'</span>' +
					'</div>';
				if ( n === play_list.length ) {
					setPlayList(obj, _list);
				}
			});
		});
	});

	loop.on('click', function() {
		if ( obj.getPlaylist() === null ) {
			if ( $(this).hasClass('one') ) {
				$(this).removeClass('one');
				obj.setLoop(false);
			} else {
				$(this).addClass('one');
				obj.setLoop(true);
			}
		} else {
			if ( $(this).hasClass('on') ) {
				$(this).removeClass('on');
				obj.setLoop(false);
			} else {
				if ( $(this).hasClass('one') ) {
					$(this).removeClass('one');
					$(this).addClass('on');
					obj.setLoop(true);
				} else {
					$(this).addClass('one');
					obj.setLoop(false);
				}
			}

		}
	});

	shuffle.on('click', function() {
		if ( $(this).hasClass('on') ) {
			$(this).removeClass('on')
			obj.setShuffle(false);
		} else {
			$(this).addClass('on')
			obj.setShuffle(true);
		}
	});

	range.on('change mousemove touchmove', function(e) {
		var _bar = $(this).prev('.bar');
		var seconds = $(this).val();
		var _total = Math.ceil(obj.getDuration());
		var _diff = Math.round(seconds / _total * 100);
		var _buff = Math.round(obj.getVideoLoadedFraction() * 100);
		if ( e.type === 'change' ) {
			obj.seekTo(seconds, true);
			$(this).attr('value', seconds);
		}
		if ( isPushed || e.type === 'change' ) {
			var _timer_current = $(this).closest('.youtube-music').find('.timer').children('span').first();
			_timer_current.text(sformat(seconds));
		}
		_bar.css(
			'background',
			'linear-gradient(to right, #c33 ' + _diff + '%, #999 ' + _diff + '% ' + _buff + '%, #444 ' + _buff + '%)'
		);
	}).on('mousedown mouseup touchstart touchend', function(e) {
		var _bar = $(this).prev('.bar');
		if ( e.type === 'mousedown' || e.type === 'touchstart' ) {
			isPushed = true;
			$(window).off('message');

		} else if ( e.type === 'mouseup' || e.type === 'touchend' ) {
			isPushed = false;
			$(window).on('message', function(e) {
				triggerMessageEvent(e);
			});
		}
	});
}

function onYouTubePlayerStateChange(event) {
	var obj = event.target;
	var iframe = $(obj.getIframe());
	var root = iframe.closest('.youtube-music');

	var desc = root.find('.youtube-music-desc');

	var progress = root.find('.progress');
	var bar = progress.children('.bar');
	var range = progress.children('input[type=range]');

	var remote = root.find('.remote');
	var play = root.find('.xi-play');
	var pause = root.find('.xi-pause-o');
	var refresh = root.find('.xi-refresh-l');
	var prev = root.find('.xi-step-backward-o');
	var next = root.find('.xi-step-forward-o');
	var fs = root.find('.xi-expand-square');
	var loop = root.find('.xi-repeat');

	var table = root.find('.youtube-music-table-wrapper');

	status_list.push(event.data);
	n = iframe.attr('id').replace('user_content_youtube-music-', '') * 1;

	if ( event.data === YT.PlayerState.PLAYING ) {
		play.hide();
		refresh.hide();
		pause.show();

		document.title = desc.find('span').eq(0).text() + ' ― ' + browser_title;
		root.find('input[type="range"]').removeAttr('disabled');
		fs.show();

		url = obj.getVideoUrl();
		aid = url.getQuery('v');
		if ( aid !== ids[n].playing ) {
			ids[n].playing = aid;

			total = Math.ceil(obj.getDuration());
			remote.children('.timer').children('span').last().text(sformat(total));
			range.attr('max', total);
			remote.children('.timer').children('span').first().text(sformat(0));
			range.attr('value', 0);
			bar.css(
				'background',
				'linear-gradient(to right, #c33 0%, #999 0%, #444 0%)'
			);
			if ( table.length > 0 && table.children().length > 0 ) {
				toCurrentNumber(obj);
			}

			$.getJSON('https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=' + aid).done(function(data) {
				document.title = data.title + ' ― ' + browser_title;
				var _width = Math.ceil(data.width * 90 / data.height);
				if ( _width <= 120 ) {
					desc.find('figure').css({width: 90, height: 90});
				} else {
					desc.find('figure').css({width: _width, height: 90});
				}
				desc.find('img').attr('src', 'https://i.ytimg.com/vi/'+ aid +'/mqdefault.jpg');
				desc.find('span').eq(0).html('<a href="https://music.youtube.com/watch?v='+ aid +'" target="_blank">'+ data.title +'</a>');
				desc.find('span').eq(1).html('<a href="'+ data.author_url +'" target="_blank">'+ data.author_name.replace(/\s+[-]\s+Topic/, '') +'</a>');

				var title_container = desc.find('span').eq(0);
				var title_text = title_container.children('a').first();
				if ( title_text.width() + 16 > title_container.width()  ) {
					if ( title_container.children().length < 2 ) {
						title_container.append(title_text.clone());
						var _clone = title_container.children().last();
						_clone.css({marginLeft: 16});
					}
					slideText(title_text);
				}
			}).fail(function() {
				document.title = browser_title;
				return true;
			});
		}

		progress.addClass('loaded');
		progress.on('focusin mouseover mousedown hover', function() {
			progress.addClass('hover');
		});
		progress.on('focusout mouseout mouseup', function() {
			progress.removeClass('hover');
		});
	} else {
		fs.hide();
		document.title = browser_title;

		if ( event.data === YT.PlayerState.PAUSED ) {
			pause.hide();
			refresh.hide();
			play.show();
		} else if ( event.data === YT.PlayerState.ENDED ) {
			if ( loop.hasClass('one') ) {
				obj.playVideo();
			} else {
				play.hide();
				pause.hide();
				refresh.show();
			}
		} else if ( event.data === -1 ) {
			url = obj.getVideoUrl();
			aid = url.getQuery('v');

			// 1곡 루프시, 이전 곡의 재생이 끝났을 경우에만 이전 곡을 다시 재생
			if ( JSON.stringify(status_list) !== '[-1]' && JSON.stringify(status_list.slice(-2)) !== '[2,-1]' && loop.hasClass('one') ) {
				var _played_id = ids[n].playing;
				if ( aid !== _played_id ) {
					$.each(obj.getPlaylist(), function(i, v) {
						if ( v === _played_id ) {
							obj.playVideoAt(i);
							return false;
						}
					});
				}
			// 재생 불가 콘텐츠의 경우, 먹통 방지
			} else if ( JSON.stringify(status_list) === '[3,-1]' ) {
				remote.children('.timer').children('span').last().text(sformat(0));
				range.attr('max', 0);
				remote.children('.timer').children('span').first().text(sformat(0));
				range.attr('value', 0);
				obj.seekTo(0, true);
				bar.css(
					'background',
					'linear-gradient(to right, #c33 0%, #999 0%, #444 0%)'
				);
				if ( table.length > 0 && table.children().length > 0 ) {
					toCurrentNumber(obj);
				}

				ids[n].playing = aid;

				desc.find('figure').css({width: 90, height: 90});
				desc.find('img').attr('src', 'https://i.ytimg.com/vi/'+ aid +'/mqdefault.jpg');
				desc.find('span').eq(0).html('<a href="https://music.youtube.com/watch?v='+ aid +'" target="_blank">'+ msg_not_loaded +'</a>');
				desc.find('span').eq(1).html('<a href="https://music.youtube.com/watch?v='+ aid +'" target="_blank">'+ msg_unknown +'</a>');

				if ( url.getQuery('list') ) {
					var i = root.find('iframe').attr('id').replace('user_content_youtube-music-', '');
					var _idx = ids[i].play_history;
					var _total = ids[i].original_list.length - 1;
					var idx = obj.getPlaylistIndex();

					if ( idx === 0 ) {					// 불가 콘텐츠가 1번일 때
						if ( loop.hasClass('on') ) {		// 루프가 켜 있고
							if ( _idx === _total ) {		// + 이전 콘텐츠가 막번이라면
								obj.nextVideo();				// 다음 콘텐츠를 재생
							} else if ( idx < _idx ) {		// + 이전 콘텐츠가 막번이 아니라면
								obj.previousVideo();			// 이전 콘텐츠, 즉 리스트의 마지막 콘텐츠를 재생
							}
						} else {							// 그런데 루프가 꺼져 있고
							if ( _idx === _total ) {		// + 이전 콘텐츠가 막번이라면
								obj.nextVideo();				// 다음 콘텐츠를 재생 -> 그런데 그럴 경우는 없음
							} else if ( idx < _idx ) {		// + 이전 콘텐츠가 막번이 아니라면
								obj.stopVideo();				// 콘텐츠를 완전 정지
							}
						}
					} else if ( idx === _total ) {
						if ( loop.hasClass('on') ) {
							if ( _idx === 0 ) {
								obj.previousVideo();
							} else if ( idx > _idx ) {
								obj.nextVideo();
							}
						} else {
							if ( _idx === 0 ) {
								obj.previousVideo();
							} else if ( idx > _idx ) {
								obj.stopVideo();
							}
						}
					} else {							// 불가 콘텐츠가 (1번도 막번이 아닌) 중간 번호일 때
						if ( idx < _idx  ) {				// 이전 콘텐츠보다 순번이 앞에 있는 콘텐츠라면
							obj.previousVideo();				// 그보다 이전에 있는 콘텐츠로 재생을 넘김
						} else if ( idx > _idx ) {			// 이전 콘텐츠보다 순번이 뒤에 있는 콘텐츠라면
							obj.nextVideo();					// 그보다 다음에 있는 콘텐츠로 재생을 넘김
						}
					}
				}
			}
			status_list = [];
		}
	}
}

function slideText(text) {
	var _width = Math.ceil(text.width());
	text.animate({
		marginLeft: (_width * -1) - 16
	}, 8000 + _width).promise().then(function() {
		return $(this).animate({
			marginLeft: 0
		}, 0).promise();
	}).then(function() {
		slideText($(this));
	});
}

function setPlayList(obj, list) {
	var iframe = $(obj.getIframe());
	var root = iframe.closest('.youtube-music');
	var table = root.find('.youtube-music-table-wrapper');

	html = '<div class="youtube-music-table">' + list.join('') + '</div>';
	table.removeClass('loading').addClass('loaded').html(html);
	toCurrentNumber(obj);

	var number = root.find('.youtube-music-tr');
	var shuffle = root.find('.xi-shuffle');
	number.on('click', function() {
		if ( $(this).hasClass('on') ) {
			return false;
		}
		showIframe(obj);

		if ( shuffle.hasClass('on') ) {
			var _vid = $(this).attr('data-id');
			var _vol = obj.getVolume();
			obj.playVideo();
			obj.setVolume(0);
			setTimeout(function() {
				shuffled_list = obj.getPlaylist();
				$.each(shuffled_list, function(i, v) {
					if ( v === _vid ) {
						obj.playVideoAt(i);
						obj.setVolume(_vol ? _vol : 100);
						return false;
					}
				});
			}, 1000);
		} else {
			obj.playVideoAt($(this).data('key'));
		}
	});
}

function toCurrentNumber(obj) {
	var iframe = $(obj.getIframe());
	var id = obj.getVideoUrl().getQuery('v');
	var root = iframe.closest('.youtube-music');
	var container = root.find('.youtube-music-table-wrapper');
	var target = root.find('.youtube-music-tr[data-id="'+ id +'"]');

	target.parent().children('.on').removeClass('on');
	container.animate({
		scrollTop: container.scrollTop() - container.offset().top + target.offset().top
	}, 400);
	target.addClass('on');
}

function showIframe(obj) {
	var iframe = $(obj.getIframe());
	$.each(ids, function(i, v) {
		$(v.obj.getIframe()).next().show();
		var root = $(v.obj.getIframe()).closest('.youtube-music');
		if ( root.find('.xi-pause-o').is(':visible') ) {	// 재생중
			v.obj.pauseVideo();								// 일시정지
			root.find('.xi-pause-o').hide();				// 일시정지 버튼 감춤
			root.find('.xi-play').show();					// 재생 버튼 활성화
		}
		if ( v.obj.getIframe() === obj.getIframe() ) {
			ids[i].play_history = obj.getPlaylistIndex();	// 기존 재생 index를 history에 저장
		}
	});
	iframe.next().hide();
}

function sformat(s) {
	var fm = [];
	fm[0] = Math.floor(s / 60 / 60) % 24; // HOURS
		fm[0] = fm[0] > 0 ? fm[0] + ':' : '';
	fm[1] = Math.floor(s / 60) % 60; // MINUTES
		if ( fm[0] ) {
			fm[1] = (fm[1] < 10) ? '0' + fm[1] + ':' : fm[1] + ':';
		} else {
			fm[1] = fm[1] + ':';
		}
	fm[2] = Math.floor(s % 60); // SECONDS
		fm[2] = (fm[2] < 10) > 0 ? '0' + fm[2] : fm[2];

	return fm[0] + fm[1] + fm[2];
}