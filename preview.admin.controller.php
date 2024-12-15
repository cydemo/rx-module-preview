<?php

/**
 * 링크 프리뷰
 * Copyright (c) 윤삼
 * Generated with https://www.poesis.org/tools/modulegen/
 */
class PreviewAdminController extends Preview
{
	/**
	 * 관리자 설정 저장 액션 예제
	 */
	public function procPreviewAdminInsertConfig()
	{
		// 제출받은 데이터 불러오기
		$args = Context::getRequestVars();
		$config = $this->getConfig();
		
		// 제출받은 데이터를 각각 적절히 필터링하여 설정 변경
		$args->user_custom_script = preg_replace('/(?:<script(?:[^>]+)?>)?(.+)(?:<\/script>)?/is', '$1', $args->user_custom_script);

		foreach ( $args->timeout as $k => $v )
		{
			$v = intval(preg_replace('/[^0-9]/', '', $v));
			if ( !$v || $v < 0 )
			{
				$args->timeout[$k] = ($k === 0) ? 1: 3;
			}
			else
			{
				$args->timeout[$k] = $v;
			}
		}

		$domain_fields = [
			0 => 'black_or_white',
			1 => 'no_attach_domains',
		];
		foreach ( $domain_fields as $field )
		{
			$domain_list = array();
			$lines = array_map('trim', explode("\n", str_replace("\r", "", $args->{$field})));
			foreach ( $lines as $url )
			{
				$host_pattern = '/^(?:https?:)?(?:\/\/)?((?:(?:www|\*)\.)?[^\/?#]+)(?:\/.*?)?$/i';
				$host_name = preg_replace($host_pattern, '$1', $url);
				if ( !$host_name || (in_array($host_name, $domain_list)) )
				{
					continue;
				}
				$domain_list[] = $host_name;
			}
			$args->{$field} = implode("\n", $domain_list);
		}
		
		// 변경된 설정을 저장
		$output = $this->setConfig($args);
		if (!$output->toBool())
		{
			return $output;
		}
		
		// 설정 화면으로 리다이렉트
		$this->setMessage('success_registed');
		$this->setRedirectUrl(Context::get('success_return_url'));
	}
}
