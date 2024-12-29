export async function setTumblrHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	preview.reg_exps.pinitRegExp = /^https?:\/\/(?:www\.)?pin\.it\/([\w]+)/;

	let matches = [];

	const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

	waitMediaEmbed();

	// TUMBLR.APP
	if ( !obj.matches[1] && !obj.matches[2] && !obj.matches[3] ) {
		setTumblrAppLink(obj);
		return;
	} else if ( obj.matches[1] && obj.matches[2] && $.isNumeric(obj.matches[3]) ) {
		if ( obj.matches[1].length < 3 ) {
			setTumblrShort(obj);
		} else {
			setTumblr(obj);
		}
		return;
	} else {
		setPreviewCard(obj);
		return;
	}
}

	async function setTumblrAppLink(obj) {
		const { setPreviewCard } = await import('./_functions.js');

		const target_url = obj.paste;

		try {
			const response = await fetch(preview.cors + target_url);
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			let data = await response.text();
			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const matches = data.match(/window(?:\.top)?\.location[^'|"]+['|"]([^'|"]+)['|"]/);
			if ( !matches ) {
				setPreviewCard(obj);
				return false;
			}

			obj.matches = [];
			obj.paste = matches[1];
			setTumblr(obj);
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}

	async function setTumblrShort(obj) {
		const { setPreviewCard } = await import('./_functions.js');
		const tumblrAppRegExp = /^https?:\/\/tumblr\.app\.link\/\w+\?_p=\w+/;

		const target_url = obj.paste;

		try {
			const response = await fetch(preview.cors + target_url + '&format=short');
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			let data = await response.text();
			if ( !data ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const matches = data.match(tumblrAppRegExp);
			if ( !matches ) {
				setPreviewCard(obj);
				return false;
			}

			obj.paste = data;
			setTumblrAppLink(obj);
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}

	async function setTumblr(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		let matches = obj.matches;
		if ( matches.length < 1 ) {
			matches = obj.paste.match(preview.reg_exps.tumblrRegExp);
		}

		let target_url = 'https://www.tumblr.com/oembed/1.0?url=' + matches[0];
		const name = (matches[1] !== 'www') ? matches[1] : matches[2];
		const id = matches[3];


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

			if ( !data || !data.html ) {
				console.error('Error: data is empty or wrong');
				setPreviewCard(obj);
				return false;
			}

			const iframe_src = $(data.html).attr('data-href') || '';
			if ( !iframe_src ) {
				console.error('Error: iframe url not found');
				setPreviewCard(obj);
				return false;
			}
			target_url = 'https://' + name + '.tumblr.com/api/read/json?id=' + id;

			$.getScript(target_url).done(function() {
				if ( !tumblr_api_read ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				let thumb = '';
				const tumblr_data = tumblr_api_read.posts[0];
				if ( tumblr_data.type === 'photo' ) {
					thumb = tumblr_data['photo-url-400'] ? '<img src="'+ tumblr_data['photo-url-400'] +'"/>' : '';
				} else if ( tumblr_data.type === 'regular' ) {
					matches = tumblr_data['regular-body'].match(/poster[^"]+"(http[^"]+)"/);
					if ( !matches ) {
						matches = tumblr_data['regular-body'].match(/img\ssrc[^"]+"(http[^"]+)"/);
					}
					thumb = ( matches && matches[1] ) ? '<img src="'+ matches[1] +'"/>' : '';
				}

				obj.html =
					'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
						'<div class="'+ preview.iframe_wrapper +' tumblr-post">' +
							thumb +
							'<iframe src="'+ iframe_src +'" class="tumblr-embed tumblr-embed-loaded" frameborder="0" loading="lazy" allowfullscreen="true"></iframe>' +
						'</div>' +
					'</div>';

				insertMediaEmbed(obj);
				completeMediaEmbed();
				obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
			}).fail(function() {
				setPreviewCard(obj);
				return false;
			});
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}