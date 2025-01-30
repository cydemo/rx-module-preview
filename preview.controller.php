<?php

/**
 * 링크 프리뷰
 * Copyright (c) 윤삼
 * Generated with https://www.poesis.org/tools/modulegen/
 */
class PreviewController extends Preview
{
	/**
	 * Initialization
	 * @return void
	 */
	function init()
	{
	}

	/**
	 * Cache to prevent duplicate downloads.
	 */
	protected static $url_cache = array();

	/**
	 * @brief act별로 화면 출력시에 스크립트 삽입
	 */
	function triggerPreviewAction(&$content)
	{
		if ( Context::getResponseMethod() !== 'HTML' )
		{
			return;
		}

		// 모듈 사용 설정이 안 돼 있으면 반환
		$config = $this->getConfig();
		if ( $config->use_preview_module !== 'Y' )
		{
			return;
		}

		// 사용가능한 환경이 아니면 반환
		$mid = Context::get('mid');
		$module_info = ModuleModel::getModuleInfoByMid($mid);
		$act = Context::get('act') ?? 'dispBoardContent';
		$module = Context::get('module') ?? ($module_info->module ?? 'preview');
		$allowed_actions = [
			'dispBoardContent', 'dispBoardWrite',
			'dispBoardWriteComment', 'dispBoardReplyComment', 'dispBoardModifyComment', 'dispBoardDeleteComment',
			'dispDocumentPrint', 'dispDocumentPreview',
			'dispWidgetAdminAddContent', 'dispTrashAdminView',
		];
		if ( !$mid && $module !== 'admin' )
		{
			return;
		}
		if ( !in_array($act, $allowed_actions) )
		{
			return;
		}

		// 선택된 mid가 아니면 반환
		if ( $module !== 'admin' )
		{
			$work = false;
			$module_srl = $module_info->module_srl;
			$selected_module_srls = $config->mid_list ?? [];
			if ( $config->selected_modules_only === 'work' )
			{
				$work = false;
				if ( in_array($module_srl, $selected_module_srls) )
				{
					$work = true;
				}
			}
			if ( $config->selected_modules_only === 'not_work' )
			{
				$work = true;
				if ( in_array($module_srl, $selected_module_srls) )
				{
					$work = false;
				}
			}
			if ( !$work )
			{
				return;
			}
		}

		// 스크립트 전달 내용 수집 : 시작
		$script = '<script>';

		// 프리뷰 카드와 미디어 임베드 모두 사용 설정이 되어 있지 않으면 반환
		$use_preview = $config->use_preview_card === 'Y' ? 1 : 0;
		$use_embed = $config->use_media_embed === 'Y' ? 1 : 0;

		$script .= 'var use_preview = ' . $use_preview . ';';
		$script .= 'var use_embed = ' . $use_embed . ';';

		if ( !$use_preview && !$use_embed )
		{
			$script .= '</script>';
			Context::addHtmlHeader($script);
			return;
		}

		// 링크 텍스트 처리 방식 전달
		$embed_leave_link = ( $config->leave_link_text === 'Y' ) ? 1 : 0;
		$embed_link_style = $config->styling_link_text ?: '<p>%text%</p>';
		if ( $config->locating_link_text === 'all_to_down' )
		{
			$embed_link_location = 3;
		}
		else if ( $config->locating_link_text === 'media_to_down' )
		{
			$embed_link_location = 2;
		}
		else if ( $config->locating_link_text === 'preview_to_down' )
		{
			$embed_link_location = 1;
		}
		else
		{
			$embed_link_location = 0;
		}

		$script .= 'var embed_leave_link = ' . $embed_leave_link . ';';
		$script .= 'var embed_link_style = \'' . $embed_link_style . '\';';
		$script .= 'var embed_link_location = ' . $embed_link_location . ';';

		// 유튜브 영상 제목으로 문서 제목 자동 입력
		$embed_insert_title = ( $config->insert_youtube_title === 'Y' ) ? 1 : 0;

		$script .= 'var embed_insert_title = ' . $embed_insert_title . ';';

		$module_path = $this->module_path;

		// 프리뷰 카드
		if ( $use_preview )
		{
			// 프리뷰 카드 블랙리스트/화이트리스트
			$domains = '';
			if ( $config->black_or_white )
			{
				$domain_list = array_map('trim', explode("\n", str_replace("\r", "", $config->black_or_white)));
				$domains = implode(',', $domain_list);
			}
			$entered_domains_only = ( $config->entered_domains_only === 'allow' ) ? 1 : 0;

			// 프리뷰 카드 '이미지 파일 첨부 사용 여부' 및 '파일 첨부 예외 도메인'
			$image_file_upload = ( $config->image_file_upload !== 'N' ) ? 1 : 0;
			if ( $image_file_upload && isset($config->max_image_width) )
			{
				$max_image_width = is_numeric($config->max_image_width) ? intval($config->max_image_width) : 0;
				$max_image_height = is_numeric($config->max_image_height) ? intval($config->max_image_height) : 0;
			}
			$no_attach_domains = '';
			if ( $config->no_attach_domains )
			{
				$domain_list = array_map('trim', explode("\n", str_replace("\r", "", $config->no_attach_domains)));
				$no_attach_domains = implode(',', $domain_list);
			}

			// 프리뷰 카드 관련 변수를 자바스크립트로 전달
			$script .= 'var black_or_white = \'' . $domains . '\';';
			$script .= 'var entered_domains_only = ' . $entered_domains_only . ';';
			$script .= 'var image_file_upload = ' . $image_file_upload . ';';
			if ( isset($max_image_width) && isset($max_image_height) )
			{
				$script .= 'var max_image_width = ' . $max_image_width . ';';
				$script .= 'var max_image_height = ' . $max_image_height . ';';
			}
			$script .= 'var no_attach_domains = \'' . $no_attach_domains . '\';';

			// 프리뷰 카드 스킨의 css 파일을 추가
			Context::addCssFile($module_path . 'skins/' . (isset($config->skin) ? $config->skin : 'default') . '/preview_card_style.css');
		}

		// 본문 view 또는 print 모드
		if ( in_array($act, ['dispBoardContent', 'dispDocumentPrint', 'dispDocumentPreview', 'dispTrashAdminView']) )
		{
			$oDocument = Context::get('oDocument');
			$document_srl = $oDocument->document_srl ?? Context::get('trash_srl');
			// 문서번호 없으면(목록만 있으면) 리턴
			if ( !$document_srl && $act !== 'dispDocumentPreview' )
			{
				$script .= '</script>';
				Context::addHtmlHeader($script);
				return;
			}

			Context::addCssFile($module_path . 'tpl/css/media_embed.css');
			if ( file_exists($module_path . 'tpl/css/custom.css') )
			{
				Context::addCssFile($module_path . 'tpl/css/custom.css');
			}
			if ( $use_embed )
			{
				Context::addJsFile($module_path . 'tpl/js/media_embed.js');
			}

			// 본문 view 모드
			if ( $act === 'dispBoardContent' )
			{
				$editor_config = EditorModel::getEditorConfig($module_srl);
				// 댓글 허용시에만 임베딩 활성화
				if ( $oDocument->get('comment_status') === 'ALLOW' && $editor_config->comment_editor_skin === 'ckeditor' )
				{
					Context::addJsFile($module_path . 'tpl/js/_ckeditor.js', '', '', 0, 'body');
				}
			}
		}
		// 본문 그 외 모드
		else
		{
			// 본문 쓰기 모드
			if ( $act === 'dispBoardWrite' )
			{
				$editor_config = EditorModel::getEditorConfig($module_srl);
				if ( $editor_config->editor_skin === 'ckeditor' )
				{
					if ( $use_embed )
					{
						Context::addCssFile($module_path . 'tpl/css/media_embed.css');
						if ( file_exists($module_path . 'tpl/css/custom.css') )
						{
							Context::addCssFile($module_path . 'tpl/css/custom.css');
						}
					}
					Context::addJsFile($module_path . 'tpl/js/_ckeditor.js', '', '', 0, 'body');
				}
			}
			// 댓글 삭제 모드
			else if ( $act === 'dispBoardDeleteComment' )
			{
				if ( $use_embed )
				{
					Context::addCssFile($module_path . 'tpl/css/media_embed.css');
					if ( file_exists($module_path . 'tpl/css/custom.css') )
					{
						Context::addCssFile($module_path . 'tpl/css/custom.css');
					}
					Context::addJsFile($module_path . 'tpl/js/media_embed.js');
				}
			}
			// 댓글 쓰기, 댓글 수정, 대댓글 쓰기 모드
			else
			{
				// 대댓글 쓰기 모드일 때만
				if ( $act === 'dispBoardReplyComment' )
				{
					if ( $use_embed )
					{
						Context::addCssFile($module_path . 'tpl/css/media_embed.css');
						if ( file_exists($module_path . 'tpl/css/custom.css') )
						{
							Context::addCssFile($module_path . 'tpl/css/custom.css');
						}
						Context::addJsFile($module_path . 'tpl/js/media_embed.js');
					}
				}

				$editor_config = EditorModel::getEditorConfig($module_srl);
				if ( $editor_config->comment_editor_skin === 'ckeditor' )
				{
					// (대댓글 쓰기 모드에선 이미 css를 로드했으므로) 그 외의 경우(댓글 쓰기/수정)에만 로드함
					if ( $act !== 'dispBoardReplyComment' )
					{
						if ( $use_embed )
						{
							Context::addCssFile($module_path . 'tpl/css/media_embed.css');
							if ( file_exists($module_path . 'tpl/css/custom.css') )
							{
								Context::addCssFile($module_path . 'tpl/css/custom.css');
							}
						}
					}
					Context::addJsFile($module_path . 'tpl/js/_ckeditor.js', '', '', 0, 'body');
				}
			}
		}

		$embed_services = '';
		$embed_service_list = array();
		$embed_service_type = ['video', 'audio', 'image', 'social_media', 'web_page'];
		foreach ( $embed_service_type as $type )
		{
			if ( !empty($config->{$type}) )
			{
				$embed_service_list = array_merge($embed_service_list, $config->{$type});
			}
		}

		if ( !empty($embed_service_list) )
		{
			$embed_services = implode(',', $embed_service_list);
		}

		$script .= 'var embed_services = \'' . $embed_services . '\';';
		$script .= '</script>';
		Context::addHtmlHeader($script);

		// 커스텀 스크립트 전달
		if ( isset($config->user_custom_script) )
		{
			Context::addHtmlFooter('<script>'. $config->user_custom_script .'</script>');
		}
	}

	function procPreviewImageFileInfo()
	{
		Context::setRequestMethod('JSON');
		$image_url = Context::get('image_url');
		if ( !$image_url )
		{
			return;
		}
		$inserting_type = Context::get('inserting_type');
		if ( !$inserting_type || !in_array($inserting_type, ['preview_card', 'media_embed', 'thumbnail']) )
		{
			return;
		}

		// Count the time.
		$start_time = microtime(true);
		$image_timeout = 4;
		$total_timeout = 20;
		@set_time_limit($total_timeout + 20);

		// Attempt to download the image.
		$temp_name = self::cleanFilename($image_url);
		$temp_name = Rhymix\Framework\Filters\FilenameFilter::clean($temp_name);
		$temp_path = _XE_PATH_ . 'files/cache/preview/images/' . $temp_name;
		$download_start_time = microtime(true);
		$status = FileHandler::getRemoteFile($image_url, $temp_path, null, $image_timeout);
		clearstatcache($temp_path);
		if ( !$status || !file_exists($temp_path) || !filesize($temp_path) )
		{
			FileHandler::removeFile($temp_path);
			return;
		}

		// Fix size of the image
		$config = $this->getConfig();
		$width = is_numeric($config->max_image_width) ? intval($config->max_image_width) : 160;
		$height = is_numeric($config->max_image_height) ? intval($config->max_image_height) : 160;
		$result = FileHandler::createImageFile($temp_path, $temp_path, $width, $height, 'jpg');

		// Check the current module's attachment size limit.
		if ( $this->module_srl )
		{
			// Get information about the current module.
			$file_config = FileModel::getFileConfig($this->module_srl);
			if ( $file_config->allowed_filesize && ($_SERVER['REQUEST_METHOD'] === 'GET' || $this->user->is_admin !== 'Y') )
			{
				if ( filesize($temp_path) > $file_config->allowed_filesize * 1024 * 1024 )
				{
					FileHandler::removeFile($temp_path);
					return;
				}
			}
		}

		// If this is taking too long, stop now and try again later.
		if ( microtime(true) - $start_time > $total_timeout )
		{
			return;
		}

		// If the file has no explicit extension, guess and add its proper extension.
		if ( preg_match('/^[0-9a-f]{32}$/', $temp_name) )
		{
			$temp_name .= '.' . self::guessExtension($temp_path);
		}

		// GIF to JPG, Getting temporary file info(path, name, type)
		$config = $this->getConfig();
		if ( $config->gif_to_jpg !== 'N' )
		{
			self::procPreviewImageToJPG($temp_path, $temp_name);
		}
		$file_type = @getimagesize($temp_path)['mime'];

		// 기존 파일 목록과의 비교로 파일 중복 방지
		$file_exists = false;
		$existed_file_info = new stdClass();
		$editor_sequence = Context::get('editor_sequence');
		$upload_target_srl = Context::get('upload_target_srl') ?: 0;
		if ( !$upload_target_srl && isset($_SESSION['upload_info'][$editor_sequence]) )
		{
			$upload_target_srl = $_SESSION['upload_info'][$editor_sequence]->upload_target_srl;
		}
		$file_list = FileModel::getFiles($upload_target_srl);
		if ( !empty($file_list) )
		{
			// 업로드 준비 중인 파일의 정보
			$adjusting_file_info = [
				'tmp_name' => $temp_path,
				'name' => $temp_name,
				'type' => $file_type,
			];
			foreach ( $file_list as $file_info )
			{
				$source_file_info = $file_info;
				if ( $file_info->original_type )
				{
					$source_file_info->mime_type = $file_info->original_type;
				}
				if ( preg_match('/\.(gif|jpe?g|png|bmp|svg|webp)\.(jpg|png)$/i', $file_info->source_filename) )
				{
					$source_file_info->source_filename = preg_replace('/\.(jpg|png)$/i', '', $file_info->source_filename);
				}
				
				// 동일한 파일명이 있고 타입 또한 같을 경우, 준비 중인 이미지 파일을 사이트 설정에 따라 조절을 하고,
				// 파일 크기까지 비교하여 일치하면, 중복 파일이 있는 것으로 간주
				if ( $source_file_info->source_filename === $temp_name && $source_file_info->mime_type === $file_type )
				{
					$oFileController = getController('file');
					$adjusted_file_info = $oFileController->adjustUploadedImage($adjusting_file_info, $file_config);
					if ( !isset($adjusted_file_info['file_size']) )
					{
						$adjusted_file_info['file_size'] = filesize($adjusted_file_info['tmp_name']);
					}
					if ( $source_file_info->file_size === $adjusted_file_info['file_size'] )
					{
						$file_exists = true;
						$existed_file_info = $file_info;
						FileHandler::removeFile($temp_path);
						break;
					}
				}
			}
		}

		Context::setResponseMethod('JSON');
		if ( $file_exists )
		{
			$file_info = $existed_file_info;
		}
		else
		{
			$file_info = [
				'inserting_type' => $inserting_type,
				'tmp_name' => $temp_path,
				'name' => $temp_name,
				'type' => $file_type,
			];
		}
		$this->add('file_exists', $file_exists);
		$this->add('file_info', $file_info);
		$this->add('image_url', $image_url);
	}

	function procPreviewImageToJPG(&$temp_path, &$temp_name)
	{
		if ( !$temp_path || !$temp_name )
		{
			return false;
		}

		$is_animated = Rhymix\Framework\Image::isAnimatedGIF($temp_path);
		if ( !$is_animated )
		{
			return false;
		}

		$output_name = $temp_path . '.converted.jpg';
		$config = $this->getConfig();
		$width = is_numeric($config->max_image_width) ? intval($config->max_image_width) : 160;
		$height = is_numeric($config->max_image_height) ? intval($config->max_image_height) : 160;
		$result = FileHandler::createImageFile($temp_path, $output_name, $width, $height, 'jpg');
		if ( $result )
		{
			FileHandler::removeFile($temp_path);
			
			$temp_path = $output_name;
			$temp_name = preg_replace('/\.gif$/', '.jpg', $temp_name);
		}
	}

	function procPreviewImageTempFileDelete($temp_path = null)
	{
		if ( !$temp_path )
		{
			$temp_path = Context::get('temp_path');
		}
		if ( !$temp_path )
		{
			return false;
		}
		FileHandler::removeFile($temp_path);
	}

	/**
	 * Clean a filename.
	 *
	 * @param string $filename
	 * @return string
	 */
	protected static function cleanFilename($filename)
	{
		if ( preg_match('/[^\/\?=#]+\.(gif|jpe?g|png|bmp|svg|webp)\b/i', urldecode($filename), $matches) )
		{
			return $matches[0];
		}
		else
		{
			return md5($filename);
		}
	}

	/**
	 * Check the file type and return an appropriate extension.
	 *
	 * @param string $filename
	 * @param string $default
	 * @return string
	 */
	protected static function guessExtension($filename, $default = 'jpg')
	{
		$image_info = @getimagesize($filename);
		if ( !$image_info ) return $default;

		switch ( $image_info['mime'] )
		{
			case 'image/gif': return 'gif';
			case 'image/jpeg': return 'jpg';
			case 'image/png': return 'png';
			case 'image/x-ms-bmp': return 'bmp';
			default: return $default;
		}
	}

	function procPreviewFileDownload()
	{
		// Get requsted file info
		$file_srl = Context::get('file_srl');
		$filename_arg = Context::get('filename');

		$columnList = array('module_srl', 'file_srl', 'sid', 'source_filename', 'uploaded_filename', 'file_size');
		$file_obj = FileModel::getFile($file_srl, $columnList);
		$file_config = FileModel::getFileConfig($file_obj->module_srl ?: null);
		$filesize = $file_obj->file_size;
		$filename = preg_replace('/\.\.+/', '.', $file_obj->source_filename);

		// Check filename if given
		if ($filename_arg !== null && $filename_arg !== $filename)
		{
			throw new Rhymix\Framework\Exceptions\TargetNotFound('msg_file_not_found');
		}

		// Check if file exists
		$uploaded_filename = $file_obj->uploaded_filename;
		if(!file_exists($uploaded_filename))
		{
			throw new Rhymix\Framework\Exceptions\TargetNotFound('msg_file_not_found');
		}

		// If client sent an If-Modified-Since header with a recent modification date, do not download again
		if(isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) && strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE']) > filemtime($uploaded_filename))
		{
			header('HTTP/1.1 304 Not Modified');
			exit();
		}

		// Encode the filename.
		if ($filename_arg !== null && $filename_arg === $filename)
		{
			$filename_param = '';
		}
		else
		{
			$filename_param = '; ' . Rhymix\Framework\UA::encodeFilenameForDownload($filename);
		}

		// Close context to prevent blocking the session
		Context::close();

		// Open file
		$fp = fopen($uploaded_filename, 'rb');
		if(!$fp)
		{
			throw new Rhymix\Framework\Exceptions\TargetNotFound('msg_file_not_found');
		}

		// Take care of pause and resume
		if(isset($_SERVER['HTTP_RANGE']) && preg_match('/^bytes=(\d+)-(\d+)?/', $_SERVER['HTTP_RANGE'], $matches))
		{
			$range_start = $matches[1];
			$range_end = $matches[2] ? $matches[2] : ($filesize - 1);
			$range_length = $range_end - $range_start + 1;
			if($range_length < 1 || $range_start < 0 || $range_start >= $filesize || $range_end >= $filesize)
			{
				header('HTTP/1.1 416 Requested Range Not Satisfiable');
				fclose($fp);
				exit();
			}
            fseek($fp, $range_start);
			header('HTTP/1.1 206 Partial Content');
			header('Content-Range: bytes ' . $range_start . '-' . $range_end . '/' . $filesize);
		}
		else
		{
			$range_start = 0;
			$range_length = $filesize - $range_start;
		}

		// Determine download type
		$download_type = 'attachment';
		$mime_type = Rhymix\Framework\MIME::getTypeByFilename($filename);
		if (starts_with('image/', $mime_type) && in_array('image', $file_config->inline_download_format))
		{
			$download_type = 'inline';
		}
		if (starts_with('audio/', $mime_type) && in_array('audio', $file_config->inline_download_format))
		{
			$download_type = 'inline';
		}
		if (starts_with('video/', $mime_type) && in_array('video', $file_config->inline_download_format))
		{
			$download_type = 'inline';
		}
		if (starts_with('text/', $mime_type) && ($mime_type !== 'text/html') && in_array('text', $file_config->inline_download_format))
		{
			$download_type = 'inline';
		}
		if ($mime_type === 'application/pdf' && in_array('pdf', $file_config->inline_download_format))
		{
			$download_type = 'inline';
		}
		if (Context::get('force_download') === 'Y')
		{
			$download_type = 'attachment';
		}

		// Clear buffer
		while(ob_get_level()) ob_end_clean();

		// Set filename headers
		header('Content-Type: ' . $mime_type);
		header('Content-Disposition: ' . $download_type . $filename_param);

		// Set cache headers
		header('Cache-Control: private; max-age=3600');
		header('Last-Modified: ' . gmdate('D, d M Y H:i:s') . ' GMT');
		header('Pragma: ');

		// Set other headers
		header('Content-Length: ' . $range_length);
		header('Accept-Ranges: bytes');
		header('Etag: "' . $etag . '"');

		if (!FileModel::isIndexable($filename, $file_config))
		{
			header('X-Robots-Tag: noindex' . false);
		}

		// Print the file contents
		for($offset = 0; $offset < $range_length; $offset += 4096)
		{
			$buffer_size = min(4096, $range_length - $offset);
			echo fread($fp, $buffer_size);
			flush();
		}

		exit();
	}

	function procPreviewFileThumbnail()
	{
		$file_srl = Context::get('file_srl');
		if ( !$file_srl )
		{
			throw new Rhymix\Framework\Exceptions\TargetNotFound('msg_file_not_found');
		}

		$oDB = DB::getInstance();
		$oDB->begin();

		$args = new stdClass;
		$args->file_srl = $file_srl;
		$args->thumbnail_filename = Context::get('thumbnail_filename');
		$args->width = Context::get('width');
		$args->height = Context::get('height');
		$args->duration = Context::get('duration');
		$args->comment = Context::get('comment') ? utf8_mbencode(Context::get('comment')) : null;

		$output = executeQuery('preview.updateFile', $args);
		if(!$output->toBool())
		{
			$oDB->rollback();
			return $output;
		}

		if ( $args->thumbnail_filename )
		{
			$args->uploaded_filename = $args->thumbnail_filename;
			$output = executeQuery('preview.deleteFile', $args);
			if(!$output->toBool())
			{
				$oDB->rollback();
				return $output;
			}
			$this->add('thumbnail_filename', $args->thumbnail_filename);
		}

		$this->add('file_srl', (int)$args->file_srl);

		$oDB->commit();
		return new BaseObject();
	}
}
