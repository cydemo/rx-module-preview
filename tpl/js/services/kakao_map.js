export async function setKakaoMapHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	try {
		const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		if ( obj.matches[1] ) {
			setKakaoMapInit(obj);
		} else {
			try {
				const target_url = obj.matches[0];

				const response = await fetch(preview.cors + target_url + '&format=short');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();
				if ( !data ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				const url = data.replace(/"/g, '').replace(/\\/g, '');
				obj.matches = url.match(preview.reg_exps.kakaoMapRegExp);

				if ( !obj.matches || !obj.matches[1] ) {
					setPreviewCard(obj);
					return false;
				}

				setKakaoMapInit(obj);
			} catch (error) {
				console.error('Error fetching data:', error);
				setPreviewCard(obj);
				return false;
			}

			return;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function setKakaoMapInit(obj) {
		const { setPreviewCard } = await import('./_functions.js');

		const url = obj.matches[0].replace(/\&amp\;/g, '&');
		const queries = window.XE.URI(url).search(true);
		let type = '';

		if ( queries.panoId || queries.panoid || (queries.id && queries.rv && queries.rv === 'on') ) {
			type = 'roadview';
		} else if ( queries.q ) {
			type = 'search';
		} else if ( queries.itemId || (queries.urlX && queries.urlY) ) {
			type = 'default'
		} else {
			setPreviewCard(obj);
			return false;
		}
		obj.type = type;

		obj.queries = queries;
		if ( type === 'default' || type === 'search' ) {
			setKakaoScript('https://ssl.daumcdn.net/dmaps/map_js_init/v3.js')
				.then(() => setKakaoScript('https://t1.daumcdn.net/mapjsapi/js/main/4.4.19/v3.js'))
				.then(() => {
					if (type === 'default') {
						setKakaoMapByDefault(obj);
					} else if (type === 'search') {
						setKakaoMapBySearch(obj);
					}
				})
				.catch(() => {
					setPreviewCard(obj);
				});
		} else if ( type === 'roadview' ) {
			setKakaoMapByRoadview(obj);
		}
	}

		function setKakaoScript(url) {
			return new Promise((resolve, reject) => {
				const script = document.createElement('script');
				script.src = url;
				script.onload = () => resolve(url);
				script.onerror = () => reject(new Error(`Script load error for ${url}`));
				document.head.append(script);
			});
		}

		async function setKakaoMapByDefault(obj) {
			const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');
			const queries = obj.queries;

			queries.id = queries.id ?? Number(queries.itemId);
			queries.start = queries.start ?? Number(queries.urlX);
			queries.end = queries.end ?? Number(queries.urlY);
			queries.name = queries.name ?? null;
			queries.zoom = queries.urlLevel ?? 3;

			const target_url = 'https://place.map.kakao.com/main/v/' + queries.id;

			if ( queries.id && !queries.name ) {
				try {
					const response = await fetch(preview.cors + encodeURIComponent(target_url));
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

					queries.name = queries.name ?? data.basicInfo.placenamefull;
					queries.start = Number(data.basicInfo.wpointx);
					queries.end = Number(data.basicInfo.wpointy);

					if ( queries.name === null ) {
						setPreviewCard(obj);
						return false;
					}

					obj.queries = queries;
					await setKakaoMapByDefault(obj);
				} catch (error) {
					setPreviewCard(obj);
					return false;
				}
				return false;
			}

			let thumb = 'https://map2.daum.net/map/mapservice?FORMAT=PNG&SCALE=2.5&MX='+ queries.start +'&MY='+ queries.end +'&IW=640&IH=480';
				thumb += (queries.name !== null) ? '&CX='+ (queries.start+1) +'&CY='+ queries.end +'&TX='+ (queries.start+1) +'&TY='+ (queries.end+165) +'&TEXT='+ encodeURIComponent(queries.name) +'&service=open' : '';
				thumb = '<img src="' + thumb + '" />';

			const data_obj = new kakao.maps.Coords(queries.start, queries.end);
			const list = data_obj.toLatLng();
			queries.place = queries.id + ',' + list.Oa + ',' + list.Pa + ',' + queries.name + ',' + queries.zoom;

			const params = {
				service: obj.service,
				url: target_url,
				type: obj.type,
				data: queries.place
			};
			const iframe_src = '/modules/preview/libs/media_embed.iframe.php?' + new URLSearchParams(params);

			obj.html =
				'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
					'<div class="'+ preview.iframe_wrapper +' kakao-map-embed">' +
						thumb +
						'<iframe src="'+ iframe_src +'" data-src="'+ iframe_src +'" scrolling="no" frameborder="no" loading="lazy"></iframe>' +
					'</div>' +
				'</div>';
			insertMediaEmbed(obj);
			completeMediaEmbed();

			return false;
		}

		async function setKakaoMapByRoadview(obj) {
			const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');
			const queries = obj.queries;

			queries.panoid = queries.panoId ?? queries.panoid;

			if ( !queries.panoid ) {
				if ( queries.id && queries.rv && queries.rv === 'on' ) {
					const target_url = 'https://place.map.kakao.com/main/v/' + queries.id;
					try {
						const response = await fetch(preview.cors + encodeURIComponent(target_url));
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

						queries.panoid = data.basicInfo.roadview.panoid;
						if ( !queries.panoid ) {
							setPreviewCard(obj);
							return false;
						}
						queries.pan = data.basicInfo.roadview.pan;
						queries.tilt = data.basicInfo.roadview.tilt;
						queries.start = data.wphotox;
						queries.end = data.wphotoy;
						queries.zoom = data.basicInfo.roadview.rvlevel;

						obj.queries = queries;
						await setKakaoMapByRoadview(obj);
					} catch (error) {
						setPreviewCard(obj);
						return false;
					}
					return false;
				} else {
					setPreviewCard(obj);
					return false;
				}
			}

			queries.pan = queries.pan ? Number(queries.pan) : 360;
			queries.tilt = queries.tilt ? Number(queries.tilt) : 0;
			queries.zoom = queries.zoom ?? 0;
			queries.encodedQ = queries.q ? encodeURIComponent(queries.q) : '';

			const target_url = 'https://rv.map.kakao.com/roadview-search/v2/node/'+ queries.panoid;

			if ( !queries.start || !queries.end ) {
				try {
					const response = await fetch(target_url);
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

					if ( !data || !data.street_view.cnt ) {
						console.error('Error: data is empty or wrong');
						setPreviewCard(obj);
						return false;
					}

					const street = data.street_view.street;
					queries.start = street.wcongx;
					queries.end = street.wcongy;
					if ( !queries.start || !queries.end ) {
						setPreviewCard(obj);
						return false;
					}

					obj.queries = queries;
					await setKakaoMapByRoadview(obj);
				} catch (error) {
					setPreviewCard(obj);
					return false;
				}
				return false;
			}

			let thumb = 'https://map2.daum.net/map/mapservice?FORMAT=PNG&SCALE=2.5&MX='+ queries.start +'&MY='+ queries.end +'&IW=640&IH=480';
				thumb += '&CX='+ (queries.start+1) +'&CY='+ queries.end +'&TX='+ (queries.start+1) +'&TY='+ (queries.end+165) + (queries.encodedQ ? '&TEXT=' + queries.encodedQ : '') +'&service=open';
				thumb = '<img src="' + thumb + '" />';

			queries.place = queries.panoid + '|@|' + queries.end + '|@|' + queries.start + '|@|' + queries.pan + '|@|' + queries.tilt + '|@|' + queries.zoom;

			const params = {
				service: obj.service,
				url: target_url,
				type: obj.type,
				data: queries.place
			};
			const iframe_src = '/modules/preview/libs/media_embed.iframe.php?' + new URLSearchParams(params);

			obj.html =
				'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
					'<div class="'+ preview.iframe_wrapper +' kakao-map-embed">' +
						thumb +
						'<iframe src="'+ iframe_src +'" data-src="'+ iframe_src +'" scrolling="no" frameborder="no" loading="lazy"></iframe>' +
					'</div>' +
				'</div>';
			insertMediaEmbed(obj);
			completeMediaEmbed();
		}

		async function setKakaoMapBySearch(obj) {
			const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');
			const queries = obj.queries;

			queries.encodedQ = encodeURIComponent(queries.q);
			queries.srcid = queries.srcid ?? '';
			queries.start = queries.urlX ? Number(queries.urlX) : '';
			queries.end = queries.urlY ? Number(queries.urlY) : '';
			queries.zoom = queries.urlLevel ?? 3;

			const target_url = 'https://m.map.kakao.com/actions/searchView?q='+ queries.encodedQ +'&sort=0';
			try {
				const response = await fetch(preview.cors + encodeURIComponent(target_url));
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();
				if ( !data || !$(data).length ) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				const $items = $(data).find('#placeList').find('li[class="search_item base"]');
				if (!$items.length) {
					setPreviewCard(obj);
					return false;
				}

				queries.places = [];
				for (let i = 0; i < $items.length; i++) {
					const $item = $items.eq(i);

					if (i === 0) {
						queries.id = $item.data('cid');
						queries.start = $item.data('wx');
						queries.end = $item.data('wy');
					}

					const data_obj = new kakao.maps.Coords($item.data('wx'), $item.data('wy'));
					const list = data_obj.toLatLng();
					queries.places[i] = $item.data('title') + ',' + list.Oa + ',' + list.Pa;

					if (i === $items.length - 1) {
						let thumb = 'https://map2.daum.net/map/mapservice?FORMAT=PNG&SCALE=2.5&MX=' + queries.start + '&MY=' + queries.end + '&IW=640&IH=480';
							thumb += '&CX=' + (queries.start + 1) + '&CY=' + queries.end + '&TX=' + (queries.start + 1) + '&TY=' + (queries.end + 165) + '&TEXT=' + queries.encodedQ + '&service=open';
							thumb = '<img src="' + thumb + '" />';

						queries.place = queries.places.join('|@|');

						const params = {
							service: obj.service,
							url: target_url,
							type: obj.type,
							data: queries.place
						};
						const iframe_src = '/modules/preview/libs/media_embed.iframe.php?' + new URLSearchParams(params);

						obj.html =
							'<div class="'+ preview.iframe_wrapper +'_wrapper" contenteditable="false">' +
								'<div class="'+ preview.iframe_wrapper +' kakao-map-embed">' +
									thumb +
									'<iframe src="'+ iframe_src +'" data-src="'+ iframe_src +'" scrolling="no" frameborder="no" loading="lazy"></iframe>' +
								'</div>' +
							'</div>';
						insertMediaEmbed(obj);
						completeMediaEmbed();
					}
				};
			} catch (error) {
				setPreviewCard(obj);
				return false;
			}
		}