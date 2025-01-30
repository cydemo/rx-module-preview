<?php

/**
 * 링크 프리뷰
 * Copyright (c) 윤삼
 * Generated with https://www.poesis.org/tools/modulegen/
 */
class PreviewAdminView extends Preview
{
	public function init()
	{
		$this->setTemplatePath($this->module_path . 'tpl');
	}
	
	public function dispPreviewAdminConfig()
	{
		$config = $this->getConfig();
		Context::set('preview_config', $config);
		
		$config_keys = [
			0 => [
				'title' => 'cmd_preview_general_config',
				'items' => (object) [
					'use_preview_module' => ['Y', 'N'],
					'leave_link_text' => ['Y', 'N'],
					'styling_link_text' => 'textarea',
					'locating_link_text' => ['all_to_up', 'preview_to_down', 'media_to_down', 'all_to_down'],
					'insert_youtube_title' => ['Y', 'N'],
					'user_custom_script' => 'textarea',
				],
				'desc' => [
					'msg_use_preview_module' => false,
					'msg_leave_link_text' => true,
					'msg_styling_link_text' => true,
					'msg_locating_link_text' => true,
					'msg_insert_youtube_title' => true,
					'msg_user_custom_script' => true,
				],
			],
			1 => [
				'title' => 'cmd_preview_card_config',
				'items' => (object) [
					'use_preview_card' => ['Y', 'N'],
					'skin' => 'select',
					'timeout' => 'text',
					'entered_domains_only' => ['allow', 'not_allow'],
					'black_or_white' => 'textarea',
					'image_file_upload' => ['Y', 'N'],
					'image_size_limit' => 'text',
					'no_attach_domains' => 'textarea',
					'gif_to_jpg' => ['Y', 'N'],
				],
				'desc' => [
					'msg_use_preview_card' => false,
					'msg_skin' => false,
					'msg_timeout' => true,
					'msg_entered_domains_only' => true,
					'msg_black_or_white' => true,
					'msg_image_file_upload' => true,
					'msg_image_size_limit' => true,
					'msg_no_attach_domains' => true,
					'msg_gif_to_jpg' => true,
				],
			],
			2 => [
				'title' => 'cmd_media_embed_config',
				'items' => (object) [
					'use_media_embed' => ['Y', 'N'],
					'media_embed_list' => [
						'video' => ['bilibili', 'chzzk', 'dailymotion', 'fc2', 'imdb', 'imgur', 'iqiyi', 'kakao', 'ktv', 'mlb', 'nate', 'naver', 'niconico', 'popkontv', 'qq', 'sbs', 'soop', 'streamable', 'ted', 'tudou', 'tv_sohu', 'tvcf', 'vimeo', 'youku', 'youtube'],
						'audio' => ['amazon_music', 'apple_music', 'apple_podcasts', 'audioclip', 'bandcamp', 'mixcloud', 'nadio', 'naver_vibe', 'soundcloud', 'spoon', 'spotify', 'suno', 'udio'],
						'image' => ['azquotes', 'figma', 'flickr', 'getty_images', 'giphy', 'jjalbot', 'tenor'],
						'social_media' => ['airbnb', 'discord', 'facebook', 'instagram', 'pinterest', 'telegram', 'threads', 'tiktok', 'tumblr', 'x'],
						'web_page' => ['4shared', 'codepen', 'codesandbox', 'github', 'google_books', 'google_drive', 'google_forms', 'google_maps', 'internet_archive', 'jsfiddle', 'kakao_map', 'prezi', 'reddit', 'relive', 'slideshare', 'typeform'],
						'file_insert' => ['audio', 'ms_office', 'pdf', 'video'],
						'etc' => [],
					],
				],
				'desc' => [
					'msg_use_media_embed' => false,
					'msg_media_embed_list' => false,
				],
			],
			3 => [
				'title' => 'cmd_module_config',
				'items' => (object) [
					'selected_modules_only' => ['work', 'not_work'],
					'mid_list' => ModuleModel::getMidList(),
				],
				'desc' => [
					'msg_selected_modules_only' => false,
					'msg_mid_list' => true,
				],
			],
		];
		Context::set('config_keys', $config_keys);
		
		$radios = ['use_preview_module', 'leave_link_text', 'locating_link_text', 'insert_youtube_title', 'use_preview_card', 'image_file_upload', 'gif_to_jpg', 'entered_domains_only', 'use_media_embed', 'selected_modules_only'];
		Context::set('radios', $radios);
		
		$textareas = ['styling_link_text', 'user_custom_script', 'black_or_white', 'no_attach_domains'];
		Context::set('textareas', $textareas);
		
		$check_command = ['cmd_select_all', 'cmd_unselect_all', 'cmd_reverse_all'];
		Context::set('check_command', $check_command);

		// get the skins path
		$skin_list = ModuleModel::getSkins($this->module_path);
		Context::set('skin_list', $skin_list);
		
		$this->setTemplateFile('config');
	}
}
