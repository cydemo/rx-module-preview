export async function setFacebookHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	const fbShareRegExp = /^https?:\/\/(?:m.|www.)?facebook.com\/share(?:\/(p|v|r|g))?\/\w+\//;
	const fbShortRegExp = /^https?:\/\/fb.watch\/vH[a-zA-Z][\w_-]+\/?/;

	let matches = obj.paste.match(fbShareRegExp);
	if (!matches || !matches[0]) {
		matches = obj.paste.match(fbShortRegExp);
	}
	let fb_set = false;

	try {
		const { waitMediaEmbed, setPreviewCard } = await import('./_functions.js');

		waitMediaEmbed();

		if ( matches && matches[0] ) {
			const target_url = matches[0];
			try {
				const response = await fetch(preview.cors + target_url + '&format=short');
				if (!response.ok) {
					console.error('Error fetching '+ title +' data');
				}

				const data = await response.text();
				if ( !data ) {
					setPreviewCard(obj);
					return false;
				}

				fb_set = await setFacebook(obj, data);
				if (fb_set) {
					return;
				}

				setPreviewCard(obj);
				return false;
			} catch (error) {
				setPreviewCard(obj);
				return false;
				console.error('Error fetching '+ title +' data:', error);
			}
		} else {
			try {
				fb_set = await setFacebook(obj, obj.paste);
				if (fb_set) {
					return;
				}
			} catch (error) {
				console.error('Error importing or executing '+ title +' module:', error);
				setPreviewCard(obj);
				return false;
			}
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
		setPreviewCard(obj);
		return false;
	}
}

	async function setFacebook(obj, data) {
		let matches = [];
		let type = '';
		let id = '';
		let arr = [];
		const fbPostRegExp = /^https:\/\/(?:www|m)\.facebook\.com\/(?:.+\/)?(?:photo(?:\.php|s)|permalink\.php|media|questions|notes|[^\/]+\/(?:activity|posts))[\/?](.*)$/;
		const fbVideoRegExp = /^https:\/\/(?:(?:www|m)\.facebook\.com)\/(watch(?:\/live)?|\w+\/videos|reel)\/(?:\?(?:[^&]+&(?:amp;)?)?v=)?(\d+)/;
		const fbPageRegExp = /^https?:\/\/(?:www|m)\.facebook\.com\/([\w\d._-]+)(?:\/([a-z_]+)\/?)?$/;

		// FACEBOOK : POSTS
		matches = data.match(fbPostRegExp);
		if ( matches ) {
			obj.url = encodeURIComponent(matches[0]);
			obj.type = 'post';

			await setFacebookIframe(obj);
			return true;
		}

		// FACEBOOK : VIDEOS
		matches = data.match(fbVideoRegExp);
		if ( matches ) {
			type = (matches[1] !== 'reel') ? 'video' : 'reel';
			id = matches[2];
			if ( type === 'video' ) {
				obj.url = encodeURIComponent('https://www.facebook.com/watch/?v=' + id);
			} else if ( type === 'reel' ) {
				obj.url = encodeURIComponent('https://www.facebook.com/reel/' + id);
			}
			obj.type = 'video';

			await setFacebookIframe(obj);
			return true;
		}

		// FACEBOOK : PAGE
		matches = data.match(fbPageRegExp);
		if ( matches && matches[1] !== 'groups' ) {
			type = matches[2];
			arr = ['about', 'mentions', 'reviews', 'reels', 'photos', 'videos', 'live_videos', 'events', 'followers', 'music', 'map', 'sports', 'movies', 'tv', 'books', 'likes', 'reviews_given'];
			if ( !type || $.inArray(type, arr) !== -1 ) {
				obj.url = encodeURIComponent(matches[0]);
				obj.type = 'page';

				await setFacebookIframe(obj);
				return true;
			}
		}

		setPreviewCard(obj);
		return false;
	}

		async function setFacebookIframe(obj) {
			const current_domain = request_uri.replace(/^http(?:s)?:/, '').replace(/\//g, '');
			let target_url = 'https://www.facebook.com/plugins/'+ obj.type +'.php?href='+ obj.url;

			obj.iframe_src = target_url +
				'&amp;app_id=&amp;channel=https%3A%2F%2Fstaticxx.facebook.com%2Fx%2Fconnect%2Fxd_arbiter%2F%3Fversion%3D46%23cb%3Df278d3fe180800c%26' +
				'domain%3D'+ current_domain +'%26origin%3D'+ encodeURIComponent(request_uri) +'f214a1b105f1a6%26relation%3Dparent.parent&amp;container_width=480' +
				'&amp;href='+ obj.url +'&amp;lazy=true&amp;locale=ko_KR&amp;sdk=joey&amp;show_text=true&amp;width=480';
			if ( obj.type === 'page' ) {
				obj.iframe_src += '&amp;tabs=timeline&amp;height=480&amp;small_header=true&amp;adapt_container_width=true&amp;hide_cover=false&amp;show_facepile=true';
			}
			obj.type = ( obj.url.indexOf('reel') !== -1 ) ? 'reel' : obj.type;
			obj.thumb = '';

			try {
				const response = await fetch(preview.cors + target_url);
				if (!response.ok) {
					console.error('Error fetching data');
				}

				const data = await response.text();
				if ( !data ) {
					insertFacebookHtml(obj);
					return false;
				}

				let image_url = '';
				if ( obj.type === 'post' || obj.type === 'page' ) {
					image_url = $(data).find('img[data-src]').first().data('src');
				} else if ( obj.type === 'video' || obj.type === 'reel' ) {
					image_url = $(data).find('img[width]').first().attr('src');
				}

				const img = new Image();
				img.src = image_url;
				img.onload = function() {
					obj.data_obj = {
						inserting_type: 'media_embed',
						image_url: image_url,
						mid: window.current_mid,
						editor_sequence: preview.editor_container.data().editorSequence,
						allow_chunks: 'Y'
					};

					obj.thumb = `<img src="${image_url}" style="display: none;" />`;

					insertFacebookHtml(obj);
					return false;
				};
				img.onerror = function() {
					insertFacebookHtml(obj);
					return false;
				};
			} catch (error) {
				console.error('Error importing or executing module:', error);
				insertFacebookHtml(obj);
				return false;
			}
		}

			async function insertFacebookHtml(obj) {
				const { procPreviewImageFileInfo, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

				let style = '';
				if ( obj.type === 'reel' ) {
					style = ' style="width: 320px;"';
					obj.type = 'video';
				}

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} fb-${obj.type} fb_iframe_widget_fluid_desktop fb_iframe_widget"${style}>
							${obj.thumb}
							<iframe src="${obj.iframe_src}" frameborder="0" allowtransparency="true" allowfullscreen="true" scrolling="no" loading="lazy"></iframe>
						</div>
					</div>
				`;
				if ( obj.thumb ) {
					procPreviewImageFileInfo(obj);
				} else {
					insertMediaEmbed(obj);
					completeMediaEmbed();
				}

				obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
			}