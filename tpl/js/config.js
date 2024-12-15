(function($) {
	
	$(function() {

		$('div[rel]').each(function() {
			var rel = $(this).attr('rel');
			var commands = $('label[rel="'+ rel +'"]');
			var boxes = $('input[name="'+ rel +'[]"]');
			var checked_count = $('input[name="'+ rel +'[]"]:checked').length;
			if ( checked_count === boxes.length ) {
				$('label#select_command_'+ rel +'_cmd_select_all').addClass('checked');
			} else if ( checked_count === 0 ) {
				$('label#select_command_'+ rel +'_cmd_unselect_all').addClass('checked');
			}
		});

		$(document).on('click', 'label[rel]', function() {
			$(this).addClass('checked');
			$(this).siblings('label[rel]').not(this).removeClass('checked');

			var rel = $(this).attr('rel');
			var index = $('label[rel="'+ rel +'"]').index(this);
			var boxes = $('input[name="'+ rel +'[]"]');

			if ( index === 0 ) {
				boxes.prop('checked', true);
				if ( rel !== 'mid_list' ) {
					boxes.parent('label').addClass('checked');
				}
			} else if ( index === 1 ) {
				boxes.prop('checked', false);
				if ( rel !== 'mid_list' ) {
					boxes.parent('label').removeClass('checked');
				}
			} else if ( index === 2 ) {
				boxes.each(function() {
					if ( $(this).is(':checked') ) {
						$(this).prop('checked', false);
						if ( rel !== 'mid_list' ) {
							$(this).parent('label').removeClass('checked');
						}
					} else {
						$(this).prop('checked', true);
						if ( rel !== 'mid_list' ) {
							$(this).parent('label').addClass('checked');
						}
					}
				});
			}
		});
		
		$(document).on('change', 'input[type="checkbox"]', function() {
			var rel = $(this).attr('name').replace('[]', '');
			var commands = $('label[rel="'+ rel +'"]');
			var boxes = $('input[name="'+ rel +'[]"]');
			var checked_count = $('input[name="'+ rel +'[]"]:checked').length;
			
			commands.removeClass('checked');
			if ( checked_count === boxes.length ) {
				$('label#select_command_'+ rel +'_cmd_select_all').addClass('checked');
			} else if ( checked_count === 0 ) {
				$('label#select_command_'+ rel +'_cmd_unselect_all').addClass('checked');
			}
		});
		
	});
	
})(jQuery);
