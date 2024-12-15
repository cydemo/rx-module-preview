export async function setTvSohuHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[4] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		const target_url = obj.matches[0];

		if ( obj.matches[1] ) {
			try {
				const response = await fetch(preview.cors + target_url + '&format=short');

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();
				if ( !data ) {
					setPreviewCard(obj);
					return false;
				}
				
				obj.url = data;
				setTvSohu(obj);
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
		} else {
			obj.url = target_url;
			setTvSohu(obj);
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function setTvSohu(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');
		const target_url = obj.url;

		try {
			let response = await fetch(preview.cors + target_url);

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}

			let data = await response.text();
			if ( !data ) {
				try {
					response = await fetch(preview.cors + target_url + '&format=short');

					if (!response.ok) {
						throw new Error('Network response was not ok');
					}

					data = await response.text();
					if ( !data ) {
						console.error('Error: data is empty or wrong');
						setPreviewCard(obj);
						return false;
					}
					
					obj.url = data;
					setTVSohu(obj);
				} catch (error) {
					console.error('Error fetching data:', error);
					setPreviewCard(obj);
					return false;
				}
			} else {
				let matches = data.match(/var\s(vid|cover)(?:\s)?=(?:\s)?['|"]([^'"]+)['|"]/g);
				if ( !matches ) {
					console.error('Error: fail to import content data');
					setPreviewCard(obj);
					return false;
				}

				const queries = {};
				let list = [];
				$.map(matches, function(v, i) {
					list = v.match(/var\s(vid|cover)(?:\s)?=(?:\s)?['|"]([^'"]+)['|"]/);
					queries[list[1]] = list[2].replace('http://', 'https://').replace('vrsab_hor', 'vrsa_hor');
				});
				if ( !queries.vid ) {
					console.error('Error: video id not found');
					setPreviewCard(obj);
					return false;
				}

				const url = $(data).filter('meta[property="og:url"]').attr('content') || '';
				if ( !url ) {
					console.error('Error: the terminal url not found');
					setPreviewCard(obj);
					return false;
				}

				matches = url.match(preview.reg_exps.tvSohuRegExp);
				if ( !matches ) {
					console.error('Error: not matched with the pattern of tvSohu url');
					setPreviewCard(obj);
					return false;
				}

				let type = 'vid';
				if ( matches[4].match(/^[0-9]+$/) !== null ) {
					type = 'bid';
				}

				const thumb = queries.cover ? '<img src="'+ queries.cover.replace(/^http:/, 'https:').replace(/\\/g, '') +'" />' : '';
				const iframe_src = 'https://tv.sohu.com/s/sohuplayer/iplay.html?'+ type +'=' + queries.vid;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper}">
							${thumb}
							<iframe src="${iframe_src}" frameborder="0" scrolling="no" allowtransparency="true" allowfullscreen="true"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			}
		} catch (error) {
			console.error('Error fetching data:', error);
			setPreviewCard(obj);
			return false;
		}
	}