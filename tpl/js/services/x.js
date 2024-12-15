export async function setXHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed, setPreviewCardByData, procPreviewImageFileInfo } = await import('./_functions.js');

		waitMediaEmbed();

		const name = obj.matches[1];
		const id = obj.matches[3];

		let type = obj.matches[2];
		let list_type = '';
		if ( !type && (name && name !== 'i') && !id ) {
			type = 'profile';
		}
		if ( type === 'lists' ) {
			type = 'list';
			list_type = $.isNumeric(id) ? 'list-id' : 'slug';
		}

		let added_info = 'user_content_tweet_' + name;
		if ( type ) {
			added_info += '-' + type;
		}
		if ( id ) {
			added_info += '-' + id;
		}
		
		let target_url = '';
		let iframe_src = '';

		if ( type === 'status' ) {
			target_url = 'https://cdn.syndication.twimg.com/tweet-result?id=' + id + '&lang=' + current_lang + '&token=1';
			iframe_src = 'https://platform.twitter.com/embed/Tweet.html?id=' + id + '&lang=' + current_lang;

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

				let thumb = '';
				if ( data ) {
					thumb = data.mediaDetails[0].media_url_https ? '<img src="' + data.mediaDetails[0].media_url_https + '" style="display: none;" />' : '';
				}

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} twitter-status" id="${added_info}">
							${thumb}
							<iframe src="${iframe_src}" data-tweet-id="${id}" id="twitter-widget-0" scrolling="no" frameborder="0" style="position: static; height: 450px; display: block;"></iframe>
						</div>
					</div>
				`;

				insertMediaEmbed(obj);
				completeMediaEmbed();
				obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
			} catch (error) {
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} twitter-status" id="${added_info}">
							<iframe src="${iframe_src}" data-tweet-id="${id}" id="twitter-widget-0" scrolling="no" frameborder="0" style="position: static; height: 450px; display: block;"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
				obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
			}
		} else if ( type === 'profile' || type === 'list' ) {
			const style = '?lang=' + current_lang + '&limit=3&maxHeight=450px';

			if ( type === 'profile' ) {
				target_url = 'https://syndication.twitter.com/srv/timeline-profile/screen-name/' + name;
				target_url += style;
				iframe_src = target_url;

				try {
					const response = await fetch(preview.cors + target_url);
					if (!response.ok) {
						throw new Error('Network response was not ok');
					}

					let data = await response.text();

					let thumb = '';
					if ( data ) {
						const matches = data.match(/<script[^"]+"__NEXT_DATA__[^{]+(\{[^<]+)<\/script>/);
						if ( matches ) {
							data = JSON.parse(matches[1]);
							thumb = data.props.pageProps.timeline.entries[0].content.tweet.extended_entities.media[0].media_url_https;
							thumb = thumb ? '<img src="' + thumb + '" style="display: none;" />' : '';
						}
					}

					obj.html = `
						<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
							<div class="${preview.iframe_wrapper} twitter-profile" id="${added_info}">
								${thumb}
								<iframe src="${iframe_src}" id="twitter-widget-0" scrolling="no" frameborder="0" style="position: static; height: 450px; display: block;"></iframe>
							</div>
						</div>
					`;

					insertMediaEmbed(obj);
					completeMediaEmbed();
				} catch (error) {
					obj.html = `
						<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
							<div class="${preview.iframe_wrapper} twitter-profile" id="${added_info}">
								<iframe src="${iframe_src}" id="twitter-widget-0" scrolling="no" frameborder="0" style="position: static; height: 450px; display: block;"></iframe>
							</div>
						</div>
					`;
					insertMediaEmbed(obj);
					completeMediaEmbed();
				}
			} else if ( type === 'list' ) {
				if ( list_type === 'list-id' ) {
					iframe_src = 'https://syndication.twitter.com/srv/timeline-list/list-id/' + id;
				} else if ( list_type === 'slug' ) {
					iframe_src = 'https://syndication.twitter.com/srv/timeline-list/screen-name/' + name + '/slug/' + id;
				} else {
					setPreviewCard(obj);
					return false;
				}
				iframe_src += style;

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} twitter-list" id="${added_info}">
							<iframe src="${iframe_src}" id="twitter-widget-0" scrolling="no" frameborder="0" style="position: static; height: 450px; display: block;"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			} else {
				setPreviewCard(obj);
				return false;
			}
		} else {
			setPreviewCard(obj);
			return false;
		}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}