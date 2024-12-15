export async function setDiscordHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[3] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed } = await import('./_functions.js');

		waitMediaEmbed();

		const type = obj.matches[2];
		const id = obj.matches[3];
		let iframe_src = 'https://discordapp.com/widget?id=';

		if ( type === 'channels' && $.isNumeric(id) ) {
			iframe_src += id;
			obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} discord-embed">
							<iframe src="${iframe_src}"></iframe>
						</div>
					</div>
				`;
			insertMediaEmbed(obj);
			completeMediaEmbed();
		} else if ( type === 'invite' || (!type && obj.matches[1] === 'gg') ) {
			const target_url = 'https://discord.com/api/v10/invites/' + id;
			try {
				const response = await fetch(target_url, {format: 'json'});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const data = await response.json();
				if (!data) {
					setPreviewCard(obj);
					return false;
				}

				iframe_src += data.guild.id;
				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} discord-embed">
							<iframe src="${iframe_src}"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
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