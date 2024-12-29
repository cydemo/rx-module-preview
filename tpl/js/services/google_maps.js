export async function setGoogleMapsHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	try {
		const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		let matches = obj.matches;

		if ( matches[1] || matches[2] || matches[3] ) {
			setGoogleMaps(obj);
			return false;
		} else {
			let target_url = matches[0];
			try {
				const response = await fetch(preview.cors + target_url + '&format=short');

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.text();
				if ( !data ) {
					console.error('Error: '+ title +' data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				target_url = decodeURIComponent(data);

				const googleMapsFullRegExp = /^https:\/\/(?:www.)?google.com\/maps(?:\/|\?)(?:(?:(place|search|q))(?:\/|=))?(?:([^@/?&#!\s]+)\/?)?(?:\/?@([^/?&#\s!]+))?(?:\/?data=([^/?&#\s=]+))?/;
				matches = target_url.match(googleMapsFullRegExp);
				if ( !matches ) {
					console.error('Error: '+ title +' url was not translated properly');
					setPreviewCard(obj);
					return false;
				}
				obj.matches = matches;

				setGoogleMaps(obj);
				return false;
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}

			return;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}

	async function setGoogleMaps(obj) {
		const { setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');
		const googleMapsCoordRegExp = /!8m2!3d([-.\d]+)!4d([-.\d]+)/;
		const googleMapsPanoRegExp = /!3m[4678]!1e1!3m[245]!1s([-_\w]+)(!2e0|!2e10)(?:!6s([^!]+))?/;

		const target = obj.matches[2] ? encodeURIComponent(obj.matches[2].replace(/(?:\%20|\+)/g, ' ')) : '';
		let levels = obj.matches[3];
		let data = obj.matches[4];

		let latitude, longitude;
		let is_panorama = false;
		let is_satellite = false;
		let unit, value, zoom, fov, heading, pitch;

		if ( levels ) {
			if ( levels.match(/^cid=\d+/) ) {
				setPreviewCard(obj);
				return false;
			}

			const level_info = levels.split(',');
				latitude = level_info[0];
				longitude = level_info[1];

			levels = '';
			for ( var i = 0; i < level_info.length; i++ ) {
				if ( i > 1 ) {
					unit = level_info[i].replace(/^[^a-z]+/, '');
					value = level_info[i].replace(/[a-z]$/, '');

					if ( unit === 'z' ) {
						levels += '&z=' + Math.floor(value);
					} else if ( unit === 'm' ) {
						levels += '&z=' + Math.round(Math.log2(40075016.686 / (256 * value)));
						// m means meter value in satellite map.
						// 256 is tile size, pixel. 40075016.686 is earch circumference meter
						// their value of log function is the nearest to zoom level
					}

					switch ( unit ) {
						case ( 'a' ) : is_panorama = true; break;
						case ( 'm' ) : is_satellite = true; break;
						case ( 'y' ) : fov = 2.64 - (0.0352 * value); break;
						case ( 'h' ) : heading = value; break;
						case ( 't' ) : pitch = 90 - value; break;
						default : zoom = Math.floor(value); break;
					}
				}
			}
		}

		if ( !is_panorama && !zoom ) {
			zoom = 17;
			levels = '&z=17';
		}

		// cf. https://github.com/asilichenko/streetview-vr-walker/wiki/Extracting-Panorama-ID-and-Location-from-the-Google-Maps-Link
		let coord_info, pano_info, panoid, thumb = '';
		if ( data ) {
			coord_info = data.match(googleMapsCoordRegExp);
			if ( coord_info ) {
				latitude = latitude ?? coord_info[1];
				longitude = longitude ?? coord_info[2];
			}

			pano_info = data.match(googleMapsPanoRegExp);
			if ( pano_info ) {
				if ( pano_info[2] === '!2e0' ){
					panoid = pano_info[1];
				}
				thumb = pano_info[3] ? decodeURIComponent(pano_info[3]).replace(/w\=\d+\&h\=\d+/, 'w=640&h=480') : '';
			}
		}

		if ( !thumb && (is_panorama && latitude && longitude) ) {
			thumb = 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?' +
				'll=' + latitude + ',' + longitude + '&cb_client=maps_sv.tactile&w=640&h=480&';
			if ( pitch && heading ) {
				thumb += 'pitch=' + pitch + '&yaw=' + heading;
			} else {
				thumb += 'pitch=0&yaw=0';
			}
		}

		(async function() {
			if ( !thumb ) {
				try {
					let target_url = obj.matches[0].replace(/search\/[^/]+\//, '');
					target_url = target_url.setQuery('hl', current_lang);
					target_url = encodeURI(decodeURIComponent(target_url));
					target_url = encodeURIComponent(target_url).replace(/'/g, '%27').replace(/"/g, '%22');

					const response = await fetch(preview.cors + target_url);
					if (!response.ok) {
						throw new Error('Network response was not ok');
					}

					data = await response.text();
					if ( data ) {
						thumb = $(data).filter('meta[property="og:image"]').attr('content') || '';
					}
				} catch (error) {
					console.error('Error fetching data:', error);
				}
			}

			let iframe_src = 'https://maps.google.com/maps?output=' + (is_panorama ? 'sv' : '') + 'embed';
			if ( target ) {
				iframe_src += '&q=' + target.replace(/\s/g, '+');
			}
			if ( latitude && longitude ) {
				iframe_src += '&' + (is_panorama ? 'cb' : '') + 'll=' + latitude + ',' + longitude;
			}
			if ( is_panorama ) {
				if ( panoid ) {
					iframe_src += '&panoid=' + panoid;
				}
				iframe_src += '&layer=c&cbp=0,'+heading+',0,'+fov+','+pitch;
			} else if ( is_satellite ) {
				iframe_src += '&t=k';
			}
			if ( levels ) {
				iframe_src += levels;
			}

			thumb = thumb ? '<img src="'+ thumb +'" />' : '';
			obj.html = `
				<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
					<div class="${preview.iframe_wrapper} google-maps-embed">
						${thumb}
						<iframe src="${iframe_src}" scrolling="no" frameborder="no" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
					</div>
				</div>
			`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		})();
	}