export async function setKakaoHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !$.isNumeric(obj.matches[4]) ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		const category = obj.matches[1];
		const daum = obj.matches[2];
		let type = obj.matches[3];
			type = (type === 'l' || type === 'livelink') ? 'livelink' : 'cliplink';

		if ( category === 'v' || category === 'news.v' ) {
			setDaumNews(obj);
		} else {
			obj.id = obj.matches[4];
			obj.type = type;
			obj.url = ( daum === 'daum.net' || category === 'video' ) ? 'https://tv.kakao.com/v/' + obj.id : obj.matches[0];
			setKakaoTV(obj);
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function setDaumNews(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		const target_url = obj.matches[0].replace('//news.v', '//v');
		try {
			const response = await fetch(preview.cors + target_url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const data = await response.text();
			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const matches = data.match(/<iframe[^>]+poster="([^"]+)".+src="([^"]+)"[^>]+>/);
			if ( !matches ) {
				setPreviewCard(obj);
				return false;
			}

			const thumb = matches[1] ? `<img src="${matches[1]}" />` : '';
			const iframe_src = matches[2];

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}">
						${thumb}
						<iframe src="${iframe_src}" loading="lazy" allowfullscreen="true"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}

	async function setKakaoTV(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		const matches = obj.paste.match(preview.reg_exps.kakaoRegExp);
		if ( !matches ) {
			setPreviewCard(obj);
			return false;
		}
		const name = matches[1] ?? '';
		const short_form = ( name === 'video' ) ? ' short_form' : '';

		obj.url = ( name !== 'video' ) ? obj.url : 'https://tv.kakao.com/v/' + obj.id;

		const target_url = 'https://tv.kakao.com/oembed?url=' + obj.url;
		try {
			const response = await fetch(preview.cors + target_url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			const textData = await response.text();

			let data;
			try {
				data = JSON.parse(textData);
			} catch (error) {
				console.error('Error parsing JSON:', error);
				setPreviewCard(obj);
				return false;
			}

			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			let thumb = data.thumbnail_url ? '<img src="'+ data.thumbnail_url +'" />' : '';
				thumb = ( name !== 'video' ) ? thumb : thumb.replace('C640x360', 'C360x640');
			const iframe_src = 'https://tv.kakao.com/embed/player/'+ obj.type +'/'+ obj.id +'?service=kakao_tv';

			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper}${short_form}">
						${thumb}
						<iframe src="${iframe_src}" allowfullscreen frameborder="0" scrolling="no" loading="lazy" allow="autoplay"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}