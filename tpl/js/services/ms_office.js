export async function setMsOfficeHtml(obj) {
	const title = obj.service.charAt(0).toUpperCase() + obj.service.slice(1).replace(/_([a-z])/g, function(m, p1) {
		return p1.toUpperCase();
	});

	if ( !obj.matches[1] || !obj.matches[2] || !$.isNumeric(obj.matches[3]) || !obj.matches[4] ) {
		console.error('Error parsing '+ title +' url');
		return;
	}

	try {
		const { waitMediaEmbed, setPreviewCard, insertMediaEmbed, completeMediaEmbed, getFileObjByDataUrl, procFileUpload } = await import('./_functions.js');

		waitMediaEmbed();

		const url = obj.matches[1];
		const type = obj.matches[2];
		const id = obj.matches[3];
		const filename = obj.matches[4];

		const allowed_types = ['ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx'];
		if ( !allowed_types.includes(type) ) {
			console.error('Error: not allowed file type');
			return;
		}

			const target_url = '/modules/preview/libs/media_embed.iframe.php' +
				'?service=' + obj.service + '&type=' + type + '&url=' + filename + '&data=' + id;
			const iframe_src = target_url;

			try {
				let url = 'https://view.officeapps.live.com/op/embed.aspx?src=';
					url += request_uri;
					url += 'files/preview_download/'+ id +'/'+ filename;
					url = preview.cors + encodeURIComponent(url);
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				let data = await response.text();
				console.log(data);
				if (!data) {
					console.error('Error: data is empty or wrong');
					setPreviewCard(obj);
					return false;
				}

				let office_type = ( type.slice(-1) !== 'x' ) ? type + 'x': type;
				let thumb = 'https://static.vecteezy.com/system/resources/thumbnails/';
				switch ( office_type ) {
					case 'docx':
						thumb += '027/179/388/small/microsoft-word-icon-logo-symbol-free-png.png';
						break;
					case 'pptx':
						thumb += '027/179/348/small/microsoft-power-point-icon-logo-symbol-free-png.png';
						break;
					case 'xlsx':
						thumb += '027/179/363/small/microsoft-excel-icon-logo-symbol-free-png.png';
						break;
					default:
						thumb += '028/339/965/small/microsoft-icon-logo-symbol-free-png.png';
				}
				thumb = '<img src="'+ thumb +'" />';

				obj.html = `
					<div class="${preview.iframe_wrapper}_wrapper" contenteditable="false">
						<div class="${preview.iframe_wrapper} ms-office-embed">
							${thumb}
							<iframe src="${iframe_src}" data-src="${iframe_src}" allowfullscreen="true" frameborder="no"></iframe>
						</div>
					</div>
				`;
				insertMediaEmbed(obj);
				completeMediaEmbed();
				obj.e.editor.showNotification(preview.omit_message, 'info', 3000);
			} catch (error) {
				console.error('Error fetching '+ title +' data:', error);
				setPreviewCard(obj);
				return false;
			}
	} catch (error) {
		console.error('Error importing or executing '+ title +' module:', error);
	}
}