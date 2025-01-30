<?php

/**
 * 링크 프리뷰
 * Copyright (c) 윤삼
 * Generated with https://www.poesis.org/tools/modulegen/
 */

class PreviewModel extends Preview
{
	public static function getPreviewInfo($url)
	{
		$url = urldecode($url);
		if ( !$url )
		{
			return;
		}

		$preview_info = new stdClass();
		$preview_info->url = $url;

		if ( strpos($url, 'cafe.naver.com') !== false )
		{
			self::_setPreviewInfoForNaverCafe($url, $preview_info);
			if ( $preview_info->title && ($preview_info->description || $preview_info->image) )
			{
				return $preview_info;
			}
		}

		$url = self::transPreviewUrl($url);

		$timeout = ModuleModel::getModuleConfig('preview')->timeout[0];
		ini_set('default_socket_timeout', $timeout);
		$meta_tags = get_meta_tags($url);
		self::_setPreviewInfo($meta_tags, $preview_info);

		if ( empty($preview_info->title) || empty($preview_info->description) || empty($preview_info->image) )
		{
			$content = self::getPreviewContent($url);
			if ( !$content )
			{
				return false;
			}
			$meta_tags = self::getPreviewMetaTags($content);
			self::_setPreviewInfo($meta_tags, $preview_info, $content);
		}

		if ( !$preview_info->title || (!$preview_info->description && !$preview_info->image) )
		{
			return false;
		}

		return $preview_info;
	}

	public static function _setPreviewInfo($meta_tags, &$preview_info, $content = null)
	{
		// 제목
		if ( !empty($meta_tags['og:title']) )
		{
			$preview_info->title = $meta_tags['og:title'];
		}
		if ( empty($preview_info->title) )
		{
			if ( !empty($meta_tags['title']) )
			{
				$preview_info->title = $meta_tags['title'];
			}
		}
		if ( empty($preview_info->title) )
		{
			if ( !empty($meta_tags['twitter:title']) )
			{
				$preview_info->title = $meta_tags['twitter:title'];
			}
		}
		if ( empty($preview_info->title) && !empty($content) )
		{
			if ( preg_match('/<title(?:[^>]+)?>(.*?)<\/title>/is', $content, $match) )
			{
				$preview_info->title = strip_tags($match[1]);
			}
		}
		if ( !empty($preview_info->title) )
		{
			$preview_info->title = self::transCoding($preview_info->title);
		}

		// 내용
		if ( !empty($meta_tags['og:description']) )
		{
			$preview_info->description = $meta_tags['og:description'];
		}
		if ( empty($preview_info->description) )
		{
			if ( !empty($meta_tags['description']) )
			{
				$preview_info->description = $meta_tags['description'];
			}
		}
		if ( empty($preview_info->description) )
		{
			if ( !empty($meta_tags['twitter:description']) )
			{
				$preview_info->description = $meta_tags['twitter:description'];
			}
		}
		if ( empty($preview_info->description) && !empty($content) )
		{
			$inner_body = preg_replace('/.+<body(?:[^>]+)?>(.*?)<\/body>.+/is', '$1', $content);
			$inner_body = preg_replace('/<script(?:[^>]+)?>(.*?)<\/script>/is', '', $inner_body);
			$inner_body = preg_replace('/<style(?:[^>]+)?>(.*?)<\/style>/is', '', $inner_body);
			$inner_body = preg_replace('/<!--(.*?)-->/is', '', $inner_body);
			$p_pattern = '/<p(?:[^>]+)?>(.*?)<\/p>/is';
			if ( preg_match_all($p_pattern, $inner_body, $p_matches) )
			{
				$desc = '';
				foreach ( $p_matches[1] as $inner_p )
				{
					$inner_text = preg_replace('/<(?:.|\n)*?>/is', '', $inner_p);
					$desc .= trim($inner_text);
					if ( mb_strlen($desc, 'UTF-8') >= 160 )
					{
						break;
					}
				}
				$preview_info->description = $desc;
			}
		}
		if ( !empty($preview_info->description) )
		{
			$preview_info->description = self::transCoding($preview_info->description);
		}
		if ( empty($preview_info->description) )
		{
			if ( !empty($meta_tags['keywords']) )
			{
				$preview_info->description = self::transCoding($meta_tags['keywords']);
			}
		}

		// 글쓴이
		if ( !empty($meta_tags['og:article:author']) )
		{
			$preview_info->author = $meta_tags['og:article:author'];
		}
		if ( empty($preview_info->author) )
		{
			if ( !empty($meta_tags['author']) )
			{
				$preview_info->author = $meta_tags['author'];
			}
		}
		if ( empty($preview_info->author) )
		{
			if ( !empty($meta_tags['article:author']) )
			{
				$preview_info->author = $meta_tags['article:author'];
			}
		}
		if ( empty($preview_info->author) )
		{
			if ( !empty($meta_tags['writer']) )
			{
				$preview_info->author = $meta_tags['writer'];
			}
		}
		if ( !empty($preview_info->author) )
		{
			$preview_info->author = self::transCoding($preview_info->author);
		}

		// 사이트 이름
		if ( !empty($meta_tags['og:site_name']) )
		{
			$preview_info->site_name = $meta_tags['og:site_name'];
		}
		if ( empty($preview_info->site_name) )
		{
			if ( !empty($meta_tags['article:service_name']) )
			{
				$preview_info->site_name = $meta_tags['article:service_name'];
			}
		}
		if ( empty($preview_info->site_name) )
		{
			if ( !empty($meta_tags['twitter:site']) )
			{
				$preview_info->site_name = $meta_tags['twitter:site'];
			}
		}
		if ( !empty($preview_info->url) )
		{
			$preview_info->site_name = parse_url($preview_info->url, PHP_URL_HOST);
		}
		if ( !empty($preview_info->site_name) )
		{
			$preview_info->site_name = self::transCoding($preview_info->site_name);
		}

		// 대표 이미지
		if ( !empty($meta_tags['og:image']) )
		{
			$preview_info->image = $meta_tags['og:image'];
			$preview_info->image_width = $meta_tags['og:image:width'];
			$preview_info->image_height = $meta_tags['og:image:height'];
		}
		if ( empty($preview_info->image) )
		{
			if ( !empty($meta_tags['og:article:thumbnailUrl']) )
			{
				$preview_info->image = $meta_tags['og:article:thumbnailUrl'];
			}
		}
		if ( empty($preview_info->image) )
		{
			if ( !empty($meta_tags['twitter:image']) )
			{
				$preview_info->image = $meta_tags['twitter:image'];
			}
		}
		if ( empty($preview_info->image) )
		{
			if ( !empty($meta_tags['twitter:image:src']) )
			{
				$preview_info->image = $meta_tags['twitter:image:src'];
			}
		}
		if ( empty($preview_info->image) )
		{
			if ( !empty($meta_tags['thumbnail']) )
			{
				$preview_info->image = $meta_tags['thumbnail'];
			}
		}
		if ( !empty($preview_info->image) )
		{
			$image_info = self::getImageInfo($preview_info->image);
			if ( !$image_info )
			{
				unset($preview_info->image);
			}
		}
		if ( empty($preview_info->image) && !empty($content) )
		{
			$inner_body = preg_replace('/.+<body(?:[^>]+)?>(.*?)<\/body>.+/is', '$1', $content);
			$inner_body = preg_replace('/<script(?:[^>]+)?>(.*?)<\/script>/is', '', $inner_body);
			$inner_body = preg_replace('/<style(?:[^>]+)?>(.*?)<\/style>/is', '', $inner_body);
			$inner_body = preg_replace('/<!--(.*?)-->/is', '', $inner_body);

			$external_server_list = ['theqoo.net'];
			$image_matched = self::addExternalServerImages($external_server_list, $inner_body);

			$img_pattern = '/<img\s[^>]*?src\s*=\s*["\']([^"\']*?)["\'][^>]*?>/is';
			if ( preg_match_all($img_pattern, $inner_body, $img_matches) )
			{
				$image_matched = array_merge($image_matched, $img_matches[1]);
			}

			if ( !empty($image_matched) )
			{
				$image_info = self::getPreviewExternalImageInfo($image_matched, $preview_info->url);
				if ( $image_info )
				{
					$preview_info->image = $image_info->image;
					$preview_info->image_width = $image_info->image_width;
					$preview_info->image_height = $image_info->image_height;
				}
			}
		}
	}

	public static function addExternalServerImages($external_server_list, $content)
	{
		$result = array();
		if ( empty($external_server_list) )
		{
			return $result;
		}

		foreach ( $external_server_list as $target_domain )
		{
			if ( $target_domain === 'theqoo.net' )
			{
				$img_pattern = '/(https?:\/\/(img\.theqoo\.net|gfycat\.com)\/)(\w+)/is';
				if ( preg_match_all($img_pattern, $content, $img_matches) )
				{
					foreach ( $img_matches[2] as $key => $val )
					{
						if ( $val === 'img.theqoo.net' )
						{
							$result[$key] = 'https://img.theqoo.net/img/' . $img_matches[3][$key] . '.jpg';
						}
						else if ( $val === 'gfycat.com' )
						{
							$result[$key] = 'https://thumbs.gfycat.com/' . $img_matches[3][$key] . '-size_restricted.gif';
						}
					}
				}
			}
		}

		return $result;
	}

	public static function getPreviewContent($url, $is_crawler = false)
	{
		if ( is_array($url) )
		{
			$url = $url[0];
		}
		$url = str_replace('&amp;', '&', urldecode(trim($url)));
		$timeout = ModuleModel::getModuleConfig('preview')->timeout[1];
		$cookie = tempnam('/tmp', 'CURLCOOKIE');
		$user_agent = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Mobile Safari/537.36';

		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_COOKIEJAR, $cookie);
		curl_setopt($ch, CURLOPT_USERAGENT, $user_agent);
		curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
		curl_setopt($ch, CURLOPT_MAXREDIRS, 10);
		curl_setopt($ch, CURLOPT_ENCODING, '');
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_AUTOREFERER, true);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
		curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);

		$err_no = curl_errno($ch);
		$err_msg = curl_error($ch);

		$response = curl_getinfo($ch);
		$content = curl_exec($ch);

		curl_close($ch);

		if ( $err_no || !$content )
		{
			return '';
		}

		if ( !$is_crawler )
		{
			$preview_info = new stdClass();
			$preview_info->url = $url;
			$meta_tags = self::getPreviewMetaTags($content);
			self::_setPreviewInfo($meta_tags, $preview_info, $content);

			// 보배드림은 타이틀, 내용, 이미지가 모두 있어야만 내용 반환
			if ( strpos($url, 'bobaedream.co') !== false )
			{
				if ( $preview_info->title && $preview_info->description && $preview_info->image )
				{
					return $content;
				}
			}
			else
			{
				if ( !empty($preview_info->title) && (!empty($preview_info->description) || !empty($preview_info->image)) )
				{
					return $content;
				}
			}
		}

		$last_url = $response['url'];
		if ( preg_replace('/https?:/', '', $last_url) === preg_replace('/https?:/', '', $url) )
		{
			ini_set('user_agent', $user_agent);
			$context = stream_context_create( [
				'ssl' => [
					'verify_peer' => false,
					'verify_peer_name' => false,
				],
			]);
			$headers = get_headers($last_url, 1, $context);

			$location = '';
			if ( !empty($headers['Location']) )
			{
				$location = $headers['Location'];
			}
			if ( !empty($headers['location']) )
			{
				$location = $headers['location'];
			}
			if ( $location )
			{
				return self::getPreviewContent($location);
			}
		}

		if ( $response['http_code'] == 301 || $response['http_code'] == 302 )
		{
			ini_set('user_agent', $user_agent);
			$headers = get_headers($last_url, 1);

			foreach( $headers as $val )
			{
				if ( substr(strtolower($val), 0, 9) === 'location:' )
				{
					return self::getPreviewContent(trim(substr($val, 9, strlen($val))));
				}
			}
		}

		if ( preg_match('/<meta(?:[^>]+)?content=["|\'][0-9]+;url=([^"|\']+)["|\'](?:[^>]+)?>/', $content, $matches)
			|| preg_match('/(?:window.)?location.replace\(["\']([^"|\']+)["\']\)/i', $content, $matches)
			|| preg_match('/(?:window.)?location=["\']([^"|\']+)["\']/i', $content, $matches)
			|| preg_match('/location.href=["\']([^"|\']+)["\']/i', $content, $matches) )
		{
			return self::getPreviewContent($matches[1]);
		}
		else
		{
			return $content;
		}
	}

	public static function transPreviewUrl($url)
	{
		if ( strpos($url, '//kin.naver.com') !== false )
		{
			$url = str_replace('//kin.naver.com', '//m.kin.naver.com', $url);
		}

		else if ( strpos($url, '//blog.naver.com') !== false )
		{
			$url = str_replace('//blog.naver.com', '//m.blog.naver.com', $url);
		}

		else if ( strpos($url, '//grafolio.naver.com') !== false )
		{
			$url = str_replace('//grafolio.naver.com', '//m-grafolio.naver.com', $url);
		}

		else if ( strpos($url, '//cafe.daum.net') !== false )
		{
			$url = str_replace('//cafe.daum.net', '//m.cafe.daum.net', $url);
		}

		else if ( strpos($url, 'http://web.humoruniv.com/board/humor/read.html') !== false )
		{
			$url_queries = parse_url($url, PHP_URL_QUERY);
			if ( $url_queries && strpos($url_queries, '=') !== false )
			{
				$url = 'http://huv.kr/';
				$query_info = explode('&', $url_queries);
				foreach ( $query_info as $query )
				{
					if ( preg_match('/([^=]+)=([^=]+)/', $query, $match) )
					{
						if ( $match[1] === 'table' || $match[1] === 'number' )
						{
							$url .= $match[2];
						}
					}
				}
			}
		}

		else if ( preg_match('/(^https?:\/\/(?:www\.)?etoland\.co\.kr\/)bbs(\/board\.php\?bo_table\=[\w\d]+&wr_id=[\d]+)/i', $url, $match) )
		{
			$url = $match[1] . 'plugin/mobile' . $match[2];
		}

		return $url;
	}

	public static function transCoding($content)
	{
		$encode = mb_detect_encoding($content, ['UTF-8', 'EUC-KR', 'SJIS', 'ISO-8859-1']);
		if ( $encode !== 'UTF-8' )
		{
			$content = iconv($encode, 'UTF-8', $content);
		}
		return trim(html_entity_decode($content), " \t\n\r\0\x0B\xC2");
	}

	public static function getPreviewMetaTags($content)
	{
        $meta_tags = array();
		$pattern = '/<meta[^>]+(?:name|property)=(?:"|\')?([\w|:]+)(?:"|\')?[^>]+(?:content)=(?:"|\')?([^"\'>]+)(?:"|\')?(?:[^>]+)?>/is';

		if ( preg_match_all($pattern, $content, $matches) )
		{
			$keys = $matches[1];
			$vals = $matches[2];
			foreach ( $keys as $i => $key )
			{
				$k = strtolower($key);
				if ( !array_key_exists($k, $meta_tags) )
				{
					$meta_tags[$k] = $vals[$i];
				}
			}
			if ( empty($meta_tags['title']) )
			{
				if ( preg_match('/<title(?:[^>]+)?>(.*?)<\/title>/is', $content, $m) )
				{
					$meta_tags['title'] = strip_tags($m[1]);
				}
			}
		}

		return $meta_tags;
	}

	public static function getPreviewExternalImageInfo($images, $url)
	{
		if ( !is_array($images) )
		{
			return;
		}

		foreach ( $images as $target_src )
		{
			if ( preg_match('/\/(common|modules|widgets|addons|layouts)\//i', $target_src) )
			{
				continue;
			}
			else
			{
				$first_split = explode('://', $url);
				$scheme = $first_split[0];
				$rest_of_scheme = $first_split[1];

				$second_split = explode('/', $rest_of_scheme);
				$host = $second_split[0];

				if ( preg_match('/^\/\//', $target_src) )
				{
					$target_src = $scheme . ':' . $target_src;
				}
				else if ( preg_match('/^\/\w/', $target_src) )
				{
					$target_src = $scheme . '://' . $host . $target_src;
				}
				else if ( preg_match('/^\.\//', $target_src) )
				{
					$target_src = $scheme . '://' . $host . preg_replace('/^\.\//', '/', $target_src);
				}
				else if ( preg_match('/^\.\.\//', $target_src) )
				{
					$jumping_count = substr_count($target_src, '../');
					array_splice($second_split, $jumping_count);
					$host_and_path = implode('/', $second_split);
					$target_src = $scheme . '://' . $host_and_path . '/' . preg_replace('/\.\.\//', '', $target_src);
				}
				else if ( preg_match('/^(?!http)[^\/]+\//', $target_src) )
				{
					$host_and_path = implode('/', $second_split);
					$target_src = $scheme . '://' . $host_and_path . '/' . $target_src;
				}

				$image_info = self::getImageInfo($target_src);
				if ( !$image_info )
				{
					continue;
				}
				return $image_info;
			}
		}

		return;
	}

	public static function getImageInfo($image_url, $min_width = 120, $min_height = 120)
	{
		$tmp_file = sprintf('./files/cache/tmp/%d', md5(rand(111111, 999999)));
		if ( !is_dir('./files/cache/tmp') )
		{
			FileHandler::makeDir('./files/cache/tmp');
		}

		FileHandler::getRemoteFile($image_url, $tmp_file);
		if ( file_exists($tmp_file) )
		{
			$tmp_file_info = Rhymix\Framework\Image::getImageInfo($tmp_file);

			if ( !in_array($tmp_file_info['type'], ['gif', 'jpg', 'png', 'webp']) )
			{
				return false;
			}
			if ( $tmp_file_info && $tmp_file_info['width'] >= $min_width && $tmp_file_info['height'] >= $min_height )
			{
				FileHandler::removeFile($tmp_file);

				$image_info = new stdClass();
				$image_info->image = $image_url;
				$image_info->image_width = $tmp_file_info['width'];
				$image_info->image_height = $tmp_file_info['height'];
				return $image_info;
			}
		}

		return false;
	}

	public static function _setPreviewInfoForNaverCafe($url, &$preview_info)
	{
		$url = preg_replace('/\?iframe_url(?:_utf8)?\=/', '', $url);
		$url = urldecode($url);

		// 카페 : 짧은 주소
		if ( preg_match('/^https?:\/\/cafe.naver.com\/([^\/\?]+)(?:\/(\d+)(?:\/|\#.*?)?)?/', $url, $matches) )
		{
			$club_name = $matches[1];
			$club_id = '';
			$article_id = $matches[2] ?: '';
		}
		// 카페 : 쿼리스트링
		else if ( preg_match('/^https?:\/\/cafe.naver.com\/(?:([^\/\?\.]+)\/)?(?:[^\.]+\.nhn\?)(?:articleid=(\d+)\&)?clubid=(\d+)(?:\&articleid=(\d+))?/', $url, $matches) )
		{
			$club_name = $matches[1] ?: '';
			$club_id = $matches[3];
			$article_id = $matches[4] ?: ($matches[2] ?: '');
		}
		else
		{
			return;
		}

		$queries = array();
		$query_str = parse_url($url, PHP_URL_QUERY);
		parse_str($query_str, $queries);
		if ( !empty($queries) )
		{
			foreach ( $queries as $key => $val )
			{
				if ( $key === 'clubid' )
				{
					$club_id = $val;
				}
				else if ( $key === 'articleid' )
				{
					$article_id = $val;
				}
				else if ( $key === 'art' )
				{
					$art = $val;
				}
			}
		}

		// 카페 아이디를 모르는 경우
		if ( !$club_id )
		{
			$json_url = 'https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?cluburl=' . $club_name;
			$result = self::getPreviewJSON($json_url);
			$result = json_decode($result);

			$club_id = $result->message->result->cafeInfoView->cafeId;
		}

		if ( !$club_id )
		{
			return;
		}

		// 아티클 번호가 없는 경우
		if ( !$article_id )
		{
			if ( !$club_name && !$club_id )
			{
				return;
			}

			$new_url = 'https://m.cafe.naver.com/CafeProfile.nhn?cafeId=' . $club_id;
			$content = self::getPreviewContent($new_url);
			$meta_tags = self::getPreviewMetaTags($content);
			self::_setPreviewInfo($meta_tags, $preview_info, $content);
		}
		// 아티클 번호가 있는 경우
		else
		{
			if ( $art )
			{
				$json_url = 'https://apis.naver.com/cafe-web/cafe-articleapi/v2/cafes/'. $club_id .'/articles/'. $article_id .'?query=&art='. $art .'&useCafeId=true&requestFrom=A';
			}
			else
			{
				$json_url = 'https://apis.naver.com/cafe-web/cafe-articleapi/v2/cafes/'. $club_name .'/articles/'. $article_id .'?useCafeId=false';
			}
			$result = self::getPreviewJSON($json_url);
			$result = json_decode($result);
			
			// 로그인이 필요하거나, 삭제된 게시물일 경우
			if ( $result->result->errorCode )
			{
				$preview_info->title = self::transCoding($result->result->reason);
				$preview_info->description = self::transCoding($result->result->more->cafeIntroduction);
				$preview_info->site_name = self::transCoding($result->result->more->pcCafeName);

				$new_url = 'https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?cluburl=' . $club_name;
				$result = self::getPreviewJSON($new_url);
				$result = json_decode($result);

				$preview_info->image = $result->message->result->profileImageUrl;
				if ( !$preview_info->description )
				{
					$club_id = $result->message->result->cafeInfoView->cafeId;
					$new_url = 'https://m.cafe.naver.com/CafeProfile.nhn?cafeId=' . $club_id;
					$content = self::getPreviewContent($new_url);
					$inner_body = preg_replace('/.+<body(?:[^>]+)?>(.*?)<\/body>.+/is', '$1', $content);
					$inner_body = preg_replace('/<script(?:[^>]+)?>(.*?)<\/script>/is', '', $inner_body);
					$inner_body = preg_replace('/<style(?:[^>]+)?>(.*?)<\/style>/is', '', $inner_body);
					$inner_body = preg_replace('/<!--(.*?)-->/is', '', $inner_body);
					$p_pattern = '/<p(?:[^>]+)?>(.*?)<\/p>/is';
					if ( preg_match_all($p_pattern, $inner_body, $p_matches) )
					{
						$desc = '';
						foreach ( $p_matches[1] as $inner_p )
						{
							$inner_text = preg_replace('/<(?:.|\n)*?>/is', '', $inner_p);
							$desc .= trim($inner_text);
							if ( mb_strlen($desc, 'UTF-8') >= 160 )
							{
								break;
							}
						}
						$preview_info->description = $desc;
					}
				}

				return;
			}

			$preview_info->title = self::transCoding($result->result->article->subject);
			$preview_info->author = self::transCoding($result->result->article->writer->nick);
			$preview_info->site_name = self::transCoding($result->result->cafe->pcCafeName);

			$content = self::transCoding($result->result->article->contentHtml);
			$meta_tags = self::getPreviewMetaTags($content);
			self::_setPreviewInfo($meta_tags, $preview_info, $content);
		}
	}

	public static function getPreviewJSON($url)
	{
		$ch = curl_init();// curl 리소스를 초기화
		curl_setopt($ch, CURLOPT_URL, $url); // url을 설정
		curl_setopt($ch, CURLOPT_HEADER, 0); // 헤더는 제외하고 content 만 받음
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); // 응답 값을 브라우저에 표시하지 말고 값을 리턴
		$result = curl_exec($ch);
		curl_close($ch); // 리소스 해제를 위해 세션 연결 닫음
		return $result;
	}

	public function getPreviewFileExtraInfo()
	{
		$file_srl = Context::get('file_srl');
		$result = FileModel::getFile($file_srl, ['thumbnail_filename', 'duration', 'comment']);
		foreach ($result as $key => $val)
		{
			$this->add($key, $val);
		}
		return $result;
	}
}