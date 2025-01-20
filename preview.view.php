<?php

/**
 * 링크 프리뷰
 * Copyright (c) 윤삼
 * Generated with https://www.poesis.org/tools/modulegen/
 */

class PreviewView extends Preview
{
	public function init()
	{
		Context::setResponseMethod('RAW');

		// 스킨 템플릿의 경로와 스킨
		$this->setTemplatePath($this->module_path . 'skins/' . ($this->module_config->skin ?: 'default'));
		$this->setTemplateFile('preview_card');
	}

	public function dispPreviewCard()
	{
		$url = Context::get('url');
		if ( !$url )
		{
			return;
		}

		if ( Rhymix\Framework\URL::isInternalURL($url) )
		{
			$this->dispPreviewCardBySelf();
			return;
		}

		$flag = false;
		$links = [
			'naver.me', 'cafe.naver.com/ca-fe/town-talks', 'ogqmarket.naver.com/creators', 'dict.naver.com', 'map.naver.com', 'game.naver.com', 'movie.naver.com', 'jr.naver.com',
			'finance.daum.net', 'dic.daum.net', 'wordbook.daum.net', 'melon.com/artist', 'webtoon.kakao.com',
			'namu.wiki', 'fmkorea.com', 'soccerline.kr', 'coupang.com', '.tistory.com', '.gettyimages.com', '.aliexpress.com'
		];
		foreach ( $links as $link )
		{
			if ( strpos($url, $link) !== false )
			{
				$flag = true;
				break;
			}
		}

		$preview_info = PreviewModel::getPreviewInfo($url);
		Context::set('preview_info', $preview_info);
	}

	public function dispPreviewCardByData()
	{
		$url = Context::get('url');
		$data = Context::get('data');
		if ( !$url || !$data )
		{
			return;
		}

		$preview_info = json_decode(html_entity_decode($data));
		$preview_info->url = urldecode($url);

		Context::set('preview_info', $preview_info);
	}

	public function dispPreviewCardBySelf()
	{
		$url = Context::get('url');
		if ( !$url )
		{
			return;
		}

		$preview_info = new stdClass();
		$preview_info->url = urldecode($url);

		$_length = strlen(RX_BASEURL);
		$rewrite_level = Rhymix\Framework\Router::getRewriteLevel();
		$url_info = parse_url($url, PHP_URL_PATH);
		$url_info = substr($url_info, $_length);
		$result = Rhymix\Framework\Router::parseUrl('GET', $url_info, $rewrite_level);

		$mid = $result->mid ?: null;
		if ( $mid )
		{
			$module_info = ModuleModel::getModuleInfoByMid($mid);
		}
		$document_srl = $result->args['document_srl'] ?: null;
		$site_config = ModuleModel::getModuleConfig('module');
		$default_image = getAdminModel('admin')->getSiteDefaultImageUrl();

		// url 접근 및 열람 권한 확인
		$permitted = false;
		if ( $this->user->is_admin === 'Y' )
		{
			$permitted = true;
		}
		else
		{
			if ( $mid )
			{
				$grant = ModuleModel::getGrant($module_info, $this->user);

				if ( $grant->manager )
				{
					$permitted = true;
				}
				else
				{
					if ( $document_srl )
					{
						$permitted = ( $module_info->consultation === 'Y' ) ? $grant->consultation_read : $permitted = $grant->view;
					}
					else
					{
						$permitted = $grant->access;
					}
				}
			}
			else
			{
				$permitted = true;
			}
		}
		
		// 권한 및 url 정보에 따라 프리뷰 정보를 차별적으로 배분
		if ( $permitted )
		{
			if ( $mid && !$document_srl)
			{
				$preview_info->title = $module_info->browser_title;
				$preview_info->description = Context::getSiteTitle() . ' - ' . ($site_config->meta_description ?: ($site_config->meta_keywords ?: $site_config->siteSubtitle));
				$preview_info->image = $default_image ?: null;
			}
			else if ( $document_srl )
			{
				$oDocument = DocumentModel::getDocument($document_srl);
				if ( $oDocument->isExists() )
				{
					$config = $this->getConfig();
					$width = is_numeric($config->max_image_width) ? intval($config->max_image_width) : 160;
					$height = is_numeric($config->max_image_height) ? intval($config->max_image_height) : 160;

					$preview_info->title = $oDocument->getTitle();
					$preview_info->description = $oDocument->getContentText(200);
					$preview_info->author = $oDocument->getNickName();
					$preview_info->image = $oDocument->thumbnailExists() ? $oDocument->getThumbnail($width, $height, 'fill') : $default_image;
				}
			}
			else
			{
				$preview_info->title = Context::getSiteTitle();
				$preview_info->description = $site_config->meta_description ?: ($site_config->meta_keywords ?: $site_config->siteSubtitle);
				$preview_info->image = $default_image ?: null;
			}
		}
		else
		{
			$preview_info->title = lang('msg_not_permitted');
			$preview_info->description = $site_config->meta_description ?: ($site_config->meta_keywords ?: $site_config->siteSubtitle);
			$preview_info->image = $default_image ?: null;
		}
		$preview_info->site_name = Context::getSiteTitle();

		Context::set('preview_info', $preview_info);
	}
}
