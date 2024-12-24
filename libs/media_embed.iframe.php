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


$result = '<div class="preview_iframe_wrapper" contenteditable="false">';

// style
$style_tmp = "";
$style_def = "
	body {
		position: relative; margin: 0; width: 100%; height: fit-content;
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
		iframe {
			width: 100%; height: 100%; border: 0; box-sizing: border-box;
		}
	";
}

$style = '<style>' . $style_tmp . $style_def . '</style>';
$result .= $style;


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
else if ( $service === 'pdf' || $service === 'ms_office' )
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

	if ( $service === 'pdf' )
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
	else if ( $service === 'ms_office' )
	{
		$allowed_ext = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
		if ( !in_array($ext, $allowed_ext) )
		{
			echo 'the file format is not for MS Office';
			exit;
		}

		$result .= '<iframe src="//view.officeapps.live.com/op/embed.aspx?src='. rawurlencode($download_url) .'"></iframe>';
	}
}

$result .= $script;

$result .= '</div>';

echo $result;