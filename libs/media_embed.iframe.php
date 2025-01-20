<?php

include '../../../common/autoload.php';
Context::init();

if ( !Context::get('service') || !Context::get('url') || !Context::get('type') )
{
	return;
}

$service = Context::get('service');
$url = Context::get('url');
$type = Context::get('type');
$data = Context::get('data');
$list_id = Context::get('list_id');

$result = '<!DOCTYPE html><html lang="ko"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">';

// style
$style_tmp = "";
$style_def = "
	body {
		position: relative; margin: 0; width: 100%; height: 100vh; overflow: hidden;
	}
";
if ( $service === 'github' )
{
	$style_def .= "
		.gist .gist-file,
		.emgithub-file {
			margin: 0 !important; border-radius: 0 !important;
		}
			.emgithub-file .code-area pre code.hljs {
				padding: 0.8em 0 !important;
			}
				.emgithub-file .code-area td.hljs-ln-line {
					white-space: pre;
				}
			.gist .blob-num,
			.emgithub-file .code-area .hljs-ln-numbers {
				position: sticky !important; left: 0; padding: 0 1rem; background: rgba(255, 255, 255, 1) !important; z-index: 1;
			}
			.gist .gist-meta,
			.emgithub-file .file-meta {
				position: sticky; bottom: 0; width: calc(100% - 20px); border-top: 1px solid #ccc; z-index: 1;
			}
	";
}
else if ( $service === 'kakao_map' )
{
	$style_def .= "
		.preview_iframe_wrapper {
			height: 100vh;
		}
		.map_label {
			position: relative; width: 150px; height: 27px; font-size: 12px; text-align: center;
		}
			.map_label_link {
				position: absolute; top: 0; left: 0; width: 100%; height: 100%; font-weight: bold; color: #000; text-decoration: none;
			}
				.map_label_link_text {
					display: block; width: 138px; margin: 0 6px; white-space: nowrap; overflow: hidden; line-height: 27px;
				}
	";
}
else if ( $service === 'pdf' )
{
	$style_def .= "
		#file-container {
			position: relative; width: 100%; background-color: #ddd; overflow: auto;
		}
			canvas {
				width: calc(100% - 24px); height: auto; margin: 0 12px 12px; box-sizing: border-box;
			}
			canvas {
				box-shadow: 0 0 2px 0 rgba(0, 0, 0, .14), 0 2px 2px 0 rgba(0, 0, 0, .12), 0 1px 3px 0 rgba(0, 0, 0, .12);
			}
				canvas:first-of-type {
					margin-top: 12px;
				}
	";
}
else if ( $service === 'ms_office' )
{
	$style_def .= "
		.preview_iframe_wrapper {
			height: 100vh;
		}
		iframe {
			width: 100%; height: 100%; border: 0; box-sizing: border-box;
		}
	";
}

$style = '<style>' . $style_tmp . $style_def . '</style>';
$result .= $style;

$result .= '</head><body><div class="preview_iframe_wrapper" contenteditable="false">';


// html
$script = '';
if ( $service === 'github' )
{
	if ( $type === 'gist' )
	{
		$script .= '<script src="'. $url. '.js"></script>';
	}

	$script .= "<script>
		const target = document.querySelector('.preview_iframe_wrapper');

		async function loadScript(url) {
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = url;
				script.onload = () => resolve(script);
				script.onerror = () => reject(new Error('Failed to load script ' + url));
				target.appendChild(script);
			});
		}

		async function postHeight(type) {
			try {
				if (type === 'file') {
					let url = '/modules/preview/libs/src/github_renderer.js?target=' + encodeURIComponent('". $url ."');
						url += '&style=github&type=code&showLineNumbers=on&showFileMeta=on&showFullPath=on';
					await loadScript(url);
				}

				// ResizeObserver를 사용하여 요소의 크기 변경 감지
				const observer = new ResizeObserver(() => {
					const width = target.getBoundingClientRect().width;
					const height = target.getBoundingClientRect().height;
					window.parent.postMessage({
						type: 'github-embed',
						width,
						height
					}, '*');
				});

				observer.observe(target);
			} catch (error) {
				console.error(error);
			}
		}

		postHeight('". $type ."');
	</script>";
}
else if ( $service === 'kakao_map' )
{
	$script .= "<script>
		const type = '". $type ."';

		function setKakaoScript(url) {
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = url;
				script.onload = () => resolve(url);
				script.onerror = () => reject(new Error('Script load error for ' + url));
				document.head.append(script);
			});
		}

		setKakaoScript('https://ssl.daumcdn.net/dmaps/map_js_init/v3.js')
			.then(() => setKakaoScript('https://t1.daumcdn.net/mapjsapi/js/main/4.4.19/v3.js'))
			.then(() => {
				if (type === 'default') {
					var mapContainer = document.body;
					var map = {}, mLabel = {};
					var place = decodeURIComponent('". $data ."');
					var location_info = place.split(','),
						location_id = location_info[0],
						location_x = location_info[2],
						location_y = location_info[1],
						location_name = location_info[3],
						location_zoom = location_info[4];

					var mapOption = {
						center: new kakao.maps.LatLng(location_x, location_y),
						level: location_zoom
					};
					map = new kakao.maps.Map(mapContainer, mapOption);

					var markerOption = {
						map: map,
						position: new kakao.maps.LatLng(location_x, location_y)
					}
					var marker = new kakao.maps.Marker(markerOption);

					if ( location_name !== 'null' ) {
						var mLabelOption = {
							content: location_name,
							position: markerOption.position
						}
						mLabel = new kakao.maps.InfoWindow(mLabelOption);
						mLabel.setContent(
							'<div class=\"map_label\">' +
								'<a class=\"map_label_link\" href=\"https://map.kakao.com/?q=' + location_name + '\" target=\"_blank\">' +
									'<span class=\"map_label_link_text\">' + location_name + '</span>' +
								'</a>' +
							'</div>');
						mLabel.open(map, marker);
					}
				} else if ( type === 'roadview' ) {
					var roadviewContainer = document.body;
					var pano_list = decodeURIComponent('". $data ."').split('|@|');
					var panoOption = {
						panoId : Number(pano_list[0]),
						panoX : Number(pano_list[1]),
						panoY : Number(pano_list[2]),
						pan : Number(pano_list[3]),
						tilt : Number(pano_list[4]),
						zoom : Number(pano_list[5])
					};

					var roadview = new kakao.maps.Roadview(roadviewContainer, panoOption);
				} else if (type === 'search') {
					var mapContainer = document.body;
					var place_list = decodeURIComponent('". $data ."').split('|@|');
					var map = {}, mLabels = [];
					var bounds = new kakao.maps.LatLngBounds();

					place_list.forEach(function(v, i) {
						if ( i === 0 ) {
							var location_info = v.split(','),
								location_name = location_info[0],
								location_x = location_info[2],
								location_y = location_info[1];
							var mapCenter = new kakao.maps.LatLng(location_x, location_y);
							var mapOption = {
								center: mapCenter,
								level: 3
							};
							map = new kakao.maps.Map(mapContainer, mapOption);
						}

						var place_info = v.split(','),
							place_name = place_info[0],
							place_x = place_info[2],
							place_y = place_info[1];

						var markerOption = {
							map: map,
							position: new kakao.maps.LatLng(place_x, place_y)
						}
						var marker = new kakao.maps.Marker(markerOption);

						var mLabelOption = {
							content: place_name,
							position: markerOption.position,
							zIndex: 1
						}
						mLabels[i] = new kakao.maps.InfoWindow(mLabelOption);
						mLabels[i].setContent(
							'<div class=\"map_label\">' +
								'<a class=\"map_label_link\" href=\"https://map.kakao.com/?q=' + place_name + '\" target=\"_blank\">' +
									'<span class=\"map_label_link_text\">' + place_name + '</span>' +
								'</a>' +
							'</div>');

						kakao.maps.event.addListener(marker, 'click', function() {
							for ( var j = 0; j < mLabels.length; j++ ) {
								mLabels[j].close();
							}
							mLabels[i].open(map, marker);
						});

						if ( i === 0 ) {
							mLabels[i].open(map, marker);
						}

						bounds.extend(new kakao.maps.LatLng(place_x, place_y));
						if ( i > 0 ) {
							map.setBounds(bounds);
						}
					});
				}
			});
	</script>";
}
else if ( $service === 'ms_office' || $service === 'pdf' )
{
	$file_srl = $data;
	$filename = $url;

	$columnList = ['module_srl', 'file_srl', 'source_filename'];
	$file_obj = FileModel::getFile($file_srl, $columnList);

	if ( !$file_obj )
	{
		throw new Rhymix\Framework\Exceptions\TargetNotFound('msg_file_not_found');
	}
	if ($file_obj->source_filename !== null && $file_obj->source_filename !== $filename )
	{
		throw new Rhymix\Framework\Exceptions\TargetNotFound('msg_file_not_found');
	}

	$download_url = getFullUrl('', 'module', 'preview', 'act', 'procPreviewFileDownload', 'file_srl', $file_srl);
	$download_url = htmlspecialchars_decode($download_url);

	$_ext = explode('.', strtolower($filename));
	$ext = $_ext[count($_ext)-1];

	if ( $service === 'ms_office' )
	{
		$allowed_ext = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
		if ( !in_array($ext, $allowed_ext) )
		{
			echo 'the file format is not for MS Office';
			exit;
		}

		$result .= '<iframe src="//view.officeapps.live.com/op/embed.aspx?src='. rawurlencode($download_url) .'"></iframe>';
	}
	else if ( $service === 'pdf' )
	{
		if ( $ext !== 'pdf' )
		{
			echo 'the file format is not PDF';
			exit;
		}

		$script .= '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js"></script>';
		$script .= "<script>
			const url = '". $download_url ."';
			const container = document.getElementById('file-container');

			pdfjsLib.getDocument(url).promise.then(function(pdf) {
				for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
					pdf.getPage(pageNum).then(function(page) {
						const scale = 1.5;
						const viewport = page.getViewport({ scale: scale });

						const canvas = document.createElement('canvas');
						const context = canvas.getContext('2d');
						canvas.width = viewport.width;
						canvas.height = viewport.height;
						container.appendChild(canvas);

						const renderContext = {
							canvasContext: context,
							viewport: viewport
						};
						page.render(renderContext);

						if (pageNum === 1) {
							const aspectRatio = viewport.height / viewport.width;
							container.style.height = (container.clientWidth * aspectRatio) + 'px';

							try {
								// ResizeObserver를 사용하여 요소의 크기 변경 감지
								const observer = new ResizeObserver(() => {
									const rect = canvas.getBoundingClientRect();
									const style = window.getComputedStyle(canvas);
									const width = rect.width + parseFloat(style.marginLeft) + parseFloat(style.marginRight);
									const height = rect.height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);

									container.style.height = height;
									window.parent.postMessage({
										type: 'pdf-embed',
										width,
										height
									}, '*');
								});

								observer.observe(canvas);
							} catch (error) {
								console.error(error);
							}
						}
					});
				}
			});
		</script>";
		$result .= '<div id="file-container" data-filepath="'. $download_url .'"></div>';
	}
}
else if ( $service === 'nate' )
{
	$result .= file_get_contents(RX_BASEDIR . '/modules/preview/libs/src/video_player.html');

	if ( $type === 'tv' )
	{
		$script .= "<script>
			$(document).ready(function(){
				const videoPlayer = new VideoPlayer('.preview_iframe_wrapper');

				$.get('/modules/preview/libs/media_embed.cors.php?url=". $url ."', function(response) {
					const data = JSON.parse($(response).filter('#__NEXT_DATA__').html());
					const image_url = '". $data ."';
					const video_info = data.props.pageProps.videoDetailView;
					const video_title = video_info.clipTitle;
					const video_url = video_info.smcUriList.pop();

					$('.video-player-header').children('h2').text(video_title);
					$('.video-player').attr('poster', image_url).attr('src', video_url);
				});
			});
		</script>";
	}
	else if ( $type === 'news' )
	{
		preg_match('/view\/(\w+)/', $url, $matches);
		$target_url = 'https://m.news.nate.com/vod/VodPlay?aid=' . $matches[1];

		$script .= "<script>
			$(document).ready(function() {
				const videoPlayer = new VideoPlayer('.preview_iframe_wrapper');

				let video_title, image_url, video_url;
				$.get('/modules/preview/libs/media_embed.cors.php?url=". $target_url ."', function(response) {
					const data = JSON.parse(response);
					if ( !data || data.err ) {
						console.error('Cannot get video url');
					}
					image_url = '". $data ."';
					video_url = data.url;

					const target_url = 'https://m.news.nate.com/view/". $matches[1] ."';
					$.get('/modules/preview/libs/media_embed.cors.php?url=' + target_url, function(response) {
						video_title = response.match(/<title>([^<]+)/)[1];

						$('.video-player-header').children('h2').text(video_title);
						$('.video-player').attr('poster', image_url).attr('src', video_url);
					});
				});
			});
		</script>";
	}
}
else if ( $service === 'popkontv' || $service === 'suno' )
{
	$result .= file_get_contents(RX_BASEDIR . '/modules/preview/libs/src/video_player.html');

	$script .= "<script>
		$(document).ready(function() {
			const videoPlayer = new VideoPlayer('.preview_iframe_wrapper');

			const data = '". $data ."';
			const data_info = data.split('|@|');
			const video_title = data_info[0];
			const image_url = data_info[1];
			const video_url = '". $url ."';

			$('.video-player-header').children('h2').text(video_title);
			$('.video-player').attr('poster', image_url).attr('src', video_url);
		});
	</script>";
}
else if ( $service === 'spoon' )
{
	$result .= file_get_contents(RX_BASEDIR . '/modules/preview/libs/src/video_player.html');

	$script .= "<script>
		$(document).ready(function() {
			const videoPlayer = new VideoPlayer('.preview_iframe_wrapper');

			let video_url = '". $url ."';
			let data = '". $data ."';
			const type = '". $type ."';
			const data_info = data.split('|@|');
			let video_title = data_info[0];
			let image_url = data_info[1];

			$('.video-player-header').children('h2').text(video_title);

			if ( type === 'cast' || type === 'playlist' ) {
				$('.video-player').attr('poster', image_url).attr('src', video_url);

				if ( type === 'playlist' ) {
					const list_id = '". $list_id ."';
					const target_url = 'https://kr-api.spooncast.net/storages/' + list_id + '/casts/';

					setVideoList(target_url);
				}
			} else if ( type === 'live' ) {
				const messages = getMessages();

				$.getJSON(video_url).done(function(response) {
					if ( !response || response.detail !== 'Success' ) {
						$('.error-message-text').html(messages['live_network_' + response.error.code]);
						$('.error-message-container').css('display', 'flex');
						return false;
					}
					data = response.results[0];

					if ( data.current_live_id ) {
						const target_url = 'https://kr-api.spooncast.net/lives/' + data.current_live_id + '/';

						$.getJSON(target_url).done(function(response) {
							if ( !response || response.detail !== 'Success' ) {
								$('.error-message-text').html(messages['live_network_' + response.error.code]);
								$('.error-message-container').css('display', 'flex');
								return false;
							}
							data = response.results[0];

							if ( !data.room_token ) {
								const video = $('#video-player')[0];
									video_title = data.title;
									video_url = data.url_hls.replace('http://', 'https://');
									image_url = data.img_url.replace('http://', 'https://');

								$('.video-player-header').children('h2').text(video_title);
								$('.video-player').attr('poster', image_url).attr('src', video_url);
								$('.time-container').find('span').not('.current-time').hide();

								$.getScript('https://cdn.jsdelivr.net/npm/hls.js@latest', function() {
									if (Hls.isSupported()) {
										const hls = new Hls({
											startPosition: 0,
										});
										hls.loadSource(video_url);
										hls.attachMedia(video);

										hls.on(Hls.Events.ERROR, function(event, response) {
											console.warn(response.type + ': ' + response.error.message);
											video.pause();
											hls.destroy();

											$('.error-message-text').html(messages.live_network_30012);
											$('.error-message-container').css('display', 'flex');
										});
									} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
										video.addEventListener('loadedmetadata', function() {
											video.play();
										});
									}
								});
							} else {
								$('.error-message-text').html(messages.live_network_30010);
								$('.error-message-container').css('display', 'flex');
								return false;
							}
						}).fail(function(error) {
							const response = error.responseJSON;
							$('.error-message-text').html(messages['live_network_' + response.error.code]);
							$('.error-message-container').css('display', 'flex');
							return false;
						});
					} else {
						$('.error-message-text').html(messages.live_network_30004);
						$('.error-message-container').css('display', 'flex');
						return false;
					}
				}).fail(function(error) {
					const response = error.responseJSON;
					$('.error-message-text').html(messages['live_network_' + response.error.code]);
					$('.error-message-container').css('display', 'flex');
					return false;
				});
			}

			function setVideoList(url, total) {
				$.getJSON(url).done(function(response) {
					if ( !response || response.detail !== 'Success' ) {
						console.warn('비디오 소스를 로드할 수 없습니다.');
						$('.error-message-text').html('오류가 발생하여 재생할 수 없습니다.');
						$('.error-message-container').css('display', 'flex');
						return false;
					}

					if ( !total ) {
						total = 0;
					}

					const video_list = [];
					for ( let i = total; i < response.results.length + total; i++ ) {
						let result = response.results[i - total];

						if ( i + total === 0 ) {
							$('.video-player-header').children('h2').text(result.title);
							$('.video-player').attr('poster', result.img_url.replace(/^https?:\/\//, 'https://')).attr('src', result.voice_url.replace(/^https?:\/\//, 'https://'));
						}

						video_list[i - total] = {
							id: result.id,
							title: result.title,
							artist: result.author.nickname,
							src: result.voice_url.replace(/^https?:\/\//, 'https://'),
							artwork: [
								{
									src: result.img_url.replace(/^https?:\/\//, 'https://'),
									sizes: '512x512',
									type: 'image/' + result.img_url.match(/\.(\w+$)/)[1]
								}
							],
							duration: result.duration
						};
					};

					total += response.results.length;
					videoPlayer.videoList.push(...video_list);

					$('.video-player-header').children('.track-opener').text('(1/' + total + ')');
					$('.prev-btn, .next-btn').removeClass('is-hidden');
					if ( response.next ) {
						setVideoList(response.next, total);
					}
				}).fail(function() {
					console.warn('비디오 소스를 로드할 수 없습니다.');
					$('.error-message-text').html('오류가 발생하여 재생할 수 없습니다.');
					$('.error-message-container').css('display', 'flex');
					return false;
				});
			}

			function getMessages() {
				return {
					live_network_30001: '라이브를 생성 할 수 있는 권한이 없습니다.',
					live_network_30002: '만 19세 미만은 성인 라이브를 생성 할 수 없어요.',
					live_network_30003: '방송 수정은 DJ만 할 수 있습니다.',
					live_network_30004: '종료된 라이브 방송입니다.',
					live_network_30005: '진행중인 라이브 방송이 아닙니다.',
					live_network_30006: '방송에 입장 할 권한이 없습니다.',
					live_network_30007: 'Staff 계정으로는 후원이 불가능합니다.',
					live_network_30008: '종료된 라이브 방송입니다.',
					live_network_30010: '입장 정보가 유효하지 않습니다.',
					live_network_30012: '일시적인 오류가 발생하였습니다.<br>잠시 후 다시 시도해주세요.',
					live_network_30013: '허용된 사용 횟수를 초과하였습니다.',
					live_network_30014: '아이템이 선택되지 않았습니다.',
					live_network_30015: '일시적인 오류가 발생했습니다.<br>다시 시도해 주세요.',
					live_network_30016: '아이템이 정상적으로 사용되지 않았나요?<br>자세한 문의는 고객문의로 이용해주세요.',
					live_network_30017: '더 이상 변경할 수 없습니다.',
					live_network_30018: '아이템이 정상적으로 사용되지 않았나요?<br>자세한 문의는 고객문의로 이용해주세요.',
					live_network_30019: '현재 사용할 수 없는 아이템입니다.<br>잠시 후 다시 시도해주세요.',
					live_network_30028: '허용되지 않은 해시태그 문자가 포함되어 있습니다.'
				};
			}
		});
	</script>";
}
else if ( $service === 'video' )
{
	$result .= file_get_contents(RX_BASEDIR . '/modules/preview/libs/src/video_player.html');

	$script .= "<script>
		$(document).ready(function() {
			const videoPlayer = new VideoPlayer('.preview_iframe_wrapper');
			let video_url = '". $url ."';

			const iframes = $(parent.document).find('iframe');
			let iframe;
			for ( let i = 0; i < iframes.length; i++ ) {
				const el = iframes[i];
				if ( iframes[i].contentWindow !== window ) continue;
				iframe = iframes[i];
			};

			let video_list = [];
			const track_list = iframe.dataset.file_srl.split('|@|');

			for ( let i = 0; i < track_list.length; i++ ) {
				const video_id = track_list[i];
				const video_title = iframe.dataset.source_filename.split('|@|')[i].replace(/\.\w+$/, '');
				const image_url = decodeURIComponent(iframe.dataset.thumbnail_filename.split('|@|')[i]);
				const mime_type = iframe.dataset.mime_type.split('|@|')[i];
				const width = iframe.dataset.width.split('|@|')[i];
				const height = iframe.dataset.height.split('|@|')[i];
				const duration = iframe.dataset.duration.split('|@|')[i];

				video_url = video_url.replace(/\d+$/, video_id);
				if ( i === 0 ) {
					$('.video-player-header').children('h2').text(video_title);
					$('.video-player').attr('poster', image_url).attr('src', video_url);
				}

				video_list[i] = {
					id: video_id,
					title: video_title,
					artist: '',
					src: video_url,
					artwork: [
						{
							src: image_url,
							sizes: '512x512',
							type: 'image/' + image_url.match(/\.(\w+$)/)[1]
						}
					],
					duration: duration
				};
			};

			if ( track_list.length > 1 ) {
				videoPlayer.videoList.push(...video_list);

				$('.video-player-header').children('.track-opener').text('(1/' + track_list.length + ')');
				$('.prev-btn, .next-btn').removeClass('is-hidden');
			}
		});
	</script>";
}

$result .= $script;

$result .= '</div></body></html>';

echo $result;