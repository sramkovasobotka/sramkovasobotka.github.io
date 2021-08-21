/*!
 * 
 * Responsive Timetable for Wordpress
 * For Wordpress
 * 
 * @author  Rik de Vos
 * @link    http://rikdevos.com/
 * @version 1.10.0
 * 
 * This is not free software. Visit http://rikdevos.com/demos/wordpress-responsive-timetable/ to purchase a license
 * 
 * JB 270421 hustota tab 6 na 2
 * 
 */

(function($){

	var sched_url_opened = false;

	$(document).ready(function() {

		$("body").append('<div class="sched-popup-overlay"><div class="sched-popup-overlay-close"></div></div><div class="sched-popup"><div class="sched-popup-navigate-left"></div><div class="sched-popup-navigate-right"></div><a href="#" class="sched-popup-close"><i class="sched-icon sched-icon-times"></i></a><div class="sched-popup-media"></div><div class="sched-popup-title">Mark Twain</div><div class="sched-popup-description"></div></div>');

		$(".sched").each(function() {
			new Schedule($(this));
		});
	});

	var Schedule = function($schedule) {

		var that = this;
		this.$schedule = $schedule;
		this.$columns = this.$schedule.find('.sched-column');
		this.$h_columns = this.$schedule.find('.sched-h-column');
		this.$events = this.$schedule.find('.sched-event');
		this.$popup = $(".sched-popup");
		this.$overlay = $(".sched-popup-overlay");
		this.$sorts = this.$schedule.find('.sched-sort');
		this.editor_mode = ($schedule.hasClass('sched-editor-mode')) ? true : false;
		this.type = this.$schedule.attr('data-type'),
		this.layout = this.$schedule.attr('data-layout'),
		this.id = this.$schedule.attr('id');

		this.options = $.parseJSON(this.$schedule.attr('data-options'));

		this.info = {
			open_event_id: false,
			ios: ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false ),
			mobile: ( navigator.userAgent.match(/(Android|webOS|iPad|iPhone|iPod|BlackBerry|Windows Phone)/g) ? true : false ),
			animations: true,
			animations_speed: 200,
			break_columns: false,
			popup_top_offset: 100,
			previous_width: 0,
			style_lighten_amount: 60,
			has_filters: that.$schedule.find('.sched-sort').length == 1,
			title_width: (that.$schedule.find('.sched-title').length === 0) ? 0 : that.$schedule.find('.sched-title').innerWidth(),
			filter_label_width: (that.$schedule.find('.sched-sort-label').length === 0) ? 0 : that.$schedule.find('.sched-sort-label').innerWidth(),
			filter_dropdown_closed_width: parseFloat(this.options.filter_dropdown_width)+38,
			filter_dropdown_open_width: parseFloat(this.options.filter_dropdown_hover_width)+18+38,
			hashchange_method: 'normal',
			next_event: false,
			previous_event: false,
			event_box_padding_break: 110,
			event_box_padding: 14,
			loader: this.$schedule.siblings('.sched-loader'),
			type: 'full',
		}


		this.info.popup_top_offset = this.info.mobile ? 20 : this.info.popup_top_offset;

		this.info.animations = (this.options.animations == 0 || (this.info.mobile && this.options.animations_mobile == 0)) ? false : true;

		if(this.editor_mode) {
			if(this.options.animations_editor == 0) {
				this.info.animations = false;
			}
		}
		if(this.options.animations_speed == 'slow') {
			this.info.animations_speed = 280;
		}else if(this.options.animations_speed == 'normal') {
			this.info.animations_speed = 200;
		}else if(this.options.animations_speed == 'fast') {
			this.info.animations_speed = 150;
		}

		if(this.info.animations == 0) {
			this.info.animations_speed = 1;
		}

		this.$schedule_list = (this.$schedule.attr('data-list-id') == 0) ? false : $(this.$schedule.attr('data-list-id'));

		this.init();

		//$(window).on('resize', that.resize);

		
		setTimeout(function() {
			that.info.loader.remove();
			that.$schedule.addClass('sched-visible');
		}, 100);
		
	};

	Schedule.prototype.init = function() {
		var that = this;

		$(window).on('resize', function() {
			that.resize();
		});

		if($('.sched[data-timetable-id='+this.$schedule.attr('data-timetable-id')+']').length > 1) {
			this.options.hashtag_url = 0;
		}
		//this.resize();

		this.info.event_box_padding_break = parseFloat(this.options.event_box_padding_break);
		if(this.info.mobile) {
			this.$schedule.addClass('sched-is-mobile');
			this.info.event_box_padding_break = 150;
		}
		if(this.info.ios) {
			this.$schedule.addClass('sched-is-ios');
		}

		var style = this.$schedule.find('.sched-style').html();
		if(style !== '') {
			$('<style type="text/css" />').html(style).appendTo('head');
		}

		this.$events.click(function(e) {
			var $this = $(this),
				click = $this.attr('data-onclick');
			
			if(click == 'popup' || that.editor_mode) {
				e.preventDefault();
				if(that.options.hashtag_url == 1) {
					//change url
					window.top.location.hash = 'event-'+$(this).attr('data-event-id');
				}else {
					that.open_event($this);
				}
				
			}else if(click == '0') {
				e.preventDefault();
			}else if(click == 'link') {
				
			}
			
		});

		if(this.$schedule_list !== false) {
			this.$schedule_list.find('.sched-list-event').click(function(e) {
				var $event = $(this).data('$event'),
					click = $event.attr('data-onclick');

				// console.log($event);

				if(click == 'popup' || that.editor_mode) {
					if(that.options.hashtag_url == 1) {
						// open the hashtag, so do nothing
					}else {
						e.preventDefault();
						that.open_event($event);
					}
				}else if(click == '0') {
					e.preventDefault();
				}else if(click == 'link') {
					
				}
			});
		}

		$(document).bind('keydown', function(e) {
			if(that.options.popup_arrows == 0) {
				return;
			}
			if(!that.info.open_event_id) {
				return;
			}
			if(e.keyCode === 37 && that.info.previous_event !== false) {
				that.info.hashchange_method = 'previous';
				that.queue_event(that.info.previous_event);
				e.preventDefault();
			}else if(e.keyCode === 39 && that.info.next_event !== false) {
				that.info.hashchange_method = 'next';
				that.queue_event(that.info.next_event);
				e.preventDefault();
			}else if(e.keyCode === 37) {
				that.nudge_event_down();
				e.preventDefault();
			}else if(e.keyCode === 39) {
				that.nudge_event_up();
				e.preventDefault();
			}
		});

		if(this.options.columns_sticky_header == '1') {

			$(window).scroll(function() {
				var offset = that.$schedule.find('.sched-columns').offset(),
					height = that.$schedule.find('.sched-columns').innerHeight(),
					scrollTop = $(this).scrollTop();

				if(scrollTop + parseFloat(that.options.columns_sticky_header_offset) > offset.top && scrollTop < offset.top+height-parseFloat(that.options.columns_sticky_header_offset)-100 && that.info.break_columns == false) {
					that.$schedule.addClass('sched-sticky-header-visible');
				}else {
					that.$schedule.removeClass('sched-sticky-header-visible');
				}
			});
		}

		if(this.options.popup_arrows == 0 || this.info.mobile) {
			this.$popup.addClass('sched-popup-hide-arrows');
		}

		this.$overlay.click(function(e) {
			e.preventDefault();
			that.close_event();
		});

		this.$popup.find('.sched-popup-close').click(function(e) {
			e.preventDefault();
			that.close_event();
		});

		this.$events.each(function() {
			that.init_event($(this));
		});

		this.$columns.each(function() {
			that.init_column($(this));
		});

		this.$h_columns.each(function() {
			that.init_h_column($(this));
		});

		this.$sorts.each(function() {
			that.init_sort($(this));
		});

		this.$schedule.find('.sched-h-content-scroll').each(function() {
			$(this).perfectScrollbarTimetable({
				'suppressScrollY': true,
				'useBothWheelAxes': true,
				'scroll': function(e) { that.horizontal_scroll_update(e); },
			});
			$(document).on('ps-scroll-x', function () {
				that.horizontal_scroll_update();
			});
		});

		$(document).keyup(function(e) {
			if(e.keyCode == 27) {
				that.close_event();
			}
		});

		this.resize();

		if(this.options.hashtag_url == 1 && sched_url_opened === false && window.top.location.hash !== '' && window.top.location.hash !== '#' && window.top.location.hash.split('#event-').length === 2) {
			var hash = window.top.location.hash.split('#event-'),
				event_id = parseFloat(hash[1]),
				$event = this.$schedule.find('.sched-event[data-event-id='+event_id+']');

			if($event.length !== 0) {
				sched_url_opened = true;
				$('html, body').animate({
					scrollTop: that.$schedule.offset().top
				}, 500, function() {
					that.open_event($event);
				});
				
			}

		}

		if(this.options.hashtag_url == 1 ) {
			$(window).on('hashchange', function() {
				if(that.info.hashchange_method === 'normal') {

					if(that.info.open_event_id !== false) {
						var hash = window.top.location.hash;
						that.close_event(function() {
							window.top.location.hash = hash;
						});
						//setTimeout(function() {
							//
						//}, 500);
						
					}

					if(window.top.location.hash !== '' && window.top.location.hash !== '#' && window.top.location.hash.split('#event-').length === 2) {
						var hash = window.top.location.hash.split('#event-'),
							event_id = parseFloat(hash[1]),
							$event = that.$schedule.find('.sched-event[data-event-id='+event_id+']');

						if($event.length !== 0) {
							that.open_event($event);
						}
						/*else if($(".sched-event[data-event-id="+event_id+"]").length > 1) {
							console.log('Timetable Error: You have multiple copies of the same timetable running on 1 page. Go to Timetable > Settings > General Settings and turn OFF "ENABLE HASHTAGS".')
						}*/
						
					}
				}else if(that.info.hashchange_method === 'next') {
					var hash = window.top.location.hash.split('#event-'),
							event_id = parseFloat(hash[1]),
							$event = that.$schedule.find('.sched-event[data-event-id='+event_id+']');
					that.open_next_event($event, that.info.open_event_id);
				}else if(that.info.hashchange_method === 'previous') {
					var hash = window.top.location.hash.split('#event-'),
							event_id = parseFloat(hash[1]),
							$event = that.$schedule.find('.sched-event[data-event-id='+event_id+']');
					that.open_previous_event($event, that.info.open_event_id);
				}
			});
		}

	};

	Schedule.prototype.init_sort = function($sort) {
		var that = this, 
			multisort = (this.options.filter_multiple == '1') ? true : false,
			$items = $sort.find('.sched-sort-item'),
			$items_checked = $sort.find('.sched-sort-item[data-checked-on-load="1"]');
		
		if(!this.info.mobile) {
			$sort.find('.sched-sort-dropdown').hover(function() {
				$sort.addClass('sched-sort-open');
			}, function() {
				$sort.removeClass('sched-sort-open');
			});
		}else {
			$sort.find('.sched-sort-dropdown').click(function(e) {
				e.preventDefault();
				var $target = $(e.target);
				if($target.parents('.sched-sort-dropdown-select').length == 0) {
					$sort.toggleClass('sched-sort-open');
				}
			});
			$sort.blur(function() {
				$sort.removeClass('sched-sort-open');
			});
		}
		
		// $items.each(function() {
		// 	var $item = $(this);
		// 	$(this).click(function() {
		// 		run_sort_item($(this));
		// 	});
		// });

		$items.click(function() {
			that.run_sort_item($(this), $sort);
		});

		$items_checked.each(function() {
			that.run_sort_item($(this), $sort);
		})
		
	}

	Schedule.prototype.run_sort_item = function($item, $sort) {
		var that = this,
			multisort = (this.options.filter_multiple == '1') ? true : false,
			sort_json = $item.attr('data-sort-item-json');

		$item.toggleClass('sched-sort-item-selected');
			if($item.hasClass('sched-sort-item-selected')) {
				// Changed to 1
				$sort.removeClass('sched-sort-empty');
				if(!multisort) {
					// Uncheck other $item

					$sort.find('.sched-sort-item.sched-sort-item-selected').each(function() {
						if($(this).attr('data-sort-item-json') !== sort_json) {
							$(this).removeClass('sched-sort-item-selected')
						}
					});

				}
			}else {
				// Changed to 0
				if($sort.find('.sched-sort-item.sched-sort-item-selected').length === 0) {
					$sort.addClass('sched-sort-empty');
				}
			}
			if(!multisort) {
				$sort.removeClass('sched-sort-open')
				// $sort.find('.sched-sort-dropdown-select').css('display', 'none');
				// setTimeout(function() {
				// 	$sort.find('.sched-sort-dropdown-select').css('display', '');
				// }, 300);
			}
			that.run_sort($sort);
	}

	Schedule.prototype.run_sort = function($sort) {
		var that = this;
		var $items_selected = $sort.find('.sched-sort-item.sched-sort-item-selected');
		if($items_selected.length === 0) {
			$sort.find('.sched-sort-current-label').html($sort.attr('data-all-string'));
			//this.$schedule.find('.sched-event.sched-event-sort-hidden').removeClass('sched-event-sort-hidden');
			//this.$events.removeClass('sched-event-sort-hidden');
			this.$schedule.find('.sched-event.sched-event-sort-hidden').each(function() {
				that.sort_show_event($(this));
			});
			return;
		}

		var all_logic = [];

		var i = 0,
			current_string = '';
		$items_selected.each(function() {
			// Run logic
			var logic = $.parseJSON($(this).attr('data-sort-item-json'));

			all_logic.push(logic);

			// Create String
			current_string += $(this).find('.sched-sort-item-label').html();
			if(i !== $items_selected.length-1) {
				current_string += ', ';
			}
			i++;
		});
		$sort.find('.sched-sort-current-label').html(current_string);

		this.sort_all_logic(all_logic);
	}

	Schedule.prototype.sort_all_logic = function(all_logic) {
		var that = this;

		this.$events.each(function() {
			var $event = $(this);
			//$event.removeClass('sched-event-sort-hidden');

			for(var i = 0; i < all_logic.length; i++) {
				var logic = all_logic[i];
				
				switch (logic.source) {
					case 'title':
						if($event.find('.sched-event-title').length !== 0 && that.sort_logic_title($event.find('.sched-event-title').html(), logic.matches, logic.method)) {
							// Show the event
							$event.addClass('sched-event-sort-visible');
							return; // Skip rest of logic, this one is good
						}
					break;
					case 'specific_custom_field':
						var $custom_field = that.$schedule.find('.sched-event-fulldescription[data-event-id='+$event.attr('data-event-id')+'] .sched-meta-field[data-meta-field-id='+logic.source_custom_field+']');

						if($custom_field.length === 0) {
							break;
						}

						var line_1 = $custom_field.attr('data-meta-field-line-one'),
							line_2 = $custom_field.attr('data-meta-field-line-two');

						if(that.sort_logic_custom_field_line(logic.source_custom_field_line, line_1, line_2, logic.matches, logic.method)) {
							// Show the event
							$event.addClass('sched-event-sort-visible');
							return; // Skip rest of logic, this one is good
						}
						
					break;
					case 'custom_field':
						var $custom_fields = that.$schedule.find('.sched-event-fulldescription[data-event-id='+$event.attr('data-event-id')+'] .sched-meta-field');

						var done = false;
						$custom_fields.each(function() {
							var $custom_field = $(this),
								line_1 = $custom_field.attr('data-meta-field-line-one'),
								line_2 = $custom_field.attr('data-meta-field-line-two');

							if(that.sort_logic_custom_field_line(logic.source_custom_field_line, line_1, line_2, logic.matches, logic.method)) {
								// Show the event
								done = true;
								return; // Skip rest of custom fields
							}
						});

						if(done === true) {
							$event.addClass('sched-event-sort-visible');
							return; // Skip rest of logic, this one is good
						}

					break;
				}
				
			}

		});

		this.$events.each(function() {



			var $event = $(this);

			if($event.hasClass('sched-event-sort-visible') && $event.hasClass('sched-event-sort-hidden')) {

				// If currently hidden and should be visible, make visible
				that.sort_show_event($event);

			}else if($event.hasClass('sched-event-sort-visible') && !$event.hasClass('sched-event-sort-hidden')) {

				// If currently visible and should be visible, do nothing

			}else if(!$event.hasClass('sched-event-sort-visible') && $event.hasClass('sched-event-sort-hidden')) {

				// If currently hidden and should be hidden, do nothing

			}else {

				// Else it shouldn't be visible and is not hidden, make invisible
				that.sort_hide_event($event);

			}

			$event.removeClass('sched-event-sort-visible');
		});
	}

	Schedule.prototype.sort_logic_title = function(title, matches, method) {
		switch (method) {
			case 'equals':
				return sched_equals(matches, title);
			break;
			case 'not_equals':
				return sched_not_equals(matches, title);
			break;
			case 'contains':
				return sched_contains(matches, title);
			break;
		}
	}

	Schedule.prototype.sort_logic_custom_field_line = function(which_line, line_1, line_2, matches, method) {
		switch (which_line) {
			case 'line_1':
				switch (method) {
					case 'equals':
						return sched_equals(matches, line_1);
					break;
					case 'not_equals':
						return sched_not_equals(matches, line_1);
					break;
					case 'contains':
						return sched_contains(matches, line_1);
					break;
				}
			break;
			case 'line_2':
				switch (method) {
					case 'equals':
						return sched_equals(matches, line_2);
					break;
					case 'not_equals':
						return sched_not_equals(matches, line_2);
					break;
					case 'contains':
						return sched_contains(matches, line_2);
					break;
				}
			break;
			case 'line_1_or_2':
				switch (method) {
					case 'equals':
						return sched_equals(matches, line_1) || sched_equals(matches, line_2);
					break;
					case 'not_equals':
						return sched_not_equals(matches, line_1) || sched_not_equals(matches, line_2);
					break;
					case 'contains':
						return sched_contains(matches, line_1) || sched_contains(matches, line_2);
					break;
				}
			break;
		}
	}

	Schedule.prototype.sort_hide_event = function($event) {

		var set_opacity = (this.options.filter_hidden_events == 'hide') ? 0 : parseFloat(this.options.filter_hidden_events_opacity)/100;

		$event.stop()
			.addClass('sched-event-sort-hidden')
			.animate({
				'opacity': set_opacity
			}, 100, function() {
				if(set_opacity === 0) {
					$event.css('display', 'none');
				}
			});

		if(this.$schedule_list !== false) {
			if(this.options.filter_hidden_events == 'hide') {
				$event.data('$list_event').stop().slideUp(100);
			}else {
				$event.data('$list_event').animate({
					'opacity': set_opacity
				}, 100);
			}
		}
	}

	Schedule.prototype.sort_show_event = function($event) {
		$event.stop()
			.removeClass('sched-event-sort-hidden')
			.css('display', 'block')
			.animate({
				'opacity': 1
			}, 100);

		if(this.$schedule_list !== false) {
			if(this.options.filter_hidden_events == 'hide') {
				$event.data('$list_event').stop().slideDown(100);
			}else {
				$event.data('$list_event').animate({
					'opacity': 1
				}, 100);
			}
		}
		

		
	}

	Schedule.prototype.init_event = function($event) {
		var that = this;

		//var color = $event.attr('data-color');
		$event.attr('data-padding', that.info.event_box_padding).find('.sched-event-inner').css({
			'padding-left': that.info.event_box_padding+6,
			'padding-right': that.info.event_box_padding+6,
		});

		if(that.$schedule_list !== false) {
			$event.data('$list_event', that.$schedule_list.find('.sched-list-event[data-event-id='+$event.attr('data-event-id')+']'));
			$event.data('$list_event').data('$event', $event);
		}

		if(this.options.event_box_style == 1 && !$event.hasClass('sched-event-image-bg')) {
			if($event.attr('data-onclick') !== '0' || that.editor_mode) {
				$event.hover(function() {
					if(that.options.event_hover_color == 'custom') {
						$event.find('.sched-event-inner')
							.css('background', that.options.event_hover_background_color)
							.css('color', that.options.event_hover_text_color);

					}else if(that.options.event_hover_color == 'lighten') {
						$event.find('.sched-event-inner').css('background', sched_color_lighten($event.attr('data-color'), 20));
					}else if(that.options.event_hover_color == 'darken') {
						$event.find('.sched-event-inner').css('background', sched_color_darken($event.attr('data-color'), 20));
					}
					
				}, function() {
					$event.find('.sched-event-inner')
						.css('background', $event.attr('data-color'))
						.css('color', that.options.event_box_text_color);
				});
			}
		}else if(this.options.event_box_style == 2 && !$event.hasClass('sched-event-image-bg')) {
			var $event_inner = $event.find('.sched-event-inner');

			$event_inner.css('background', sched_color_lighten($event.attr('data-color'), that.info.style_lighten_amount));
			$event.find('.sched-event-inner-bar').css('background', $event.attr('data-color'));

			if($event.attr('data-onclick') !== '0' || that.editor_mode) {
				$event.hover(function() {
					$event_inner.css('background', $event.attr('data-color')).css('color', '#ffffff');
				}, function() {
					$event_inner.css('background', sched_color_lighten($event.attr('data-color'), that.info.style_lighten_amount)).css('color', $event.attr('data-color'));
				});
			}
		}else if($event.hasClass('sched-event-image-bg')) {

		}

		if(this.options.title_attr == 0) {
			$event.removeAttr('title');
		}

		if(this.options.event_tooltip == 1 && $event.find('.sched-event-tooltip > div').length > 1 && (!this.info.mobile || this.options.tooltips_mobile == 1)) {
			$event.find('.sched-event-inner').hover(function() {
				var $tooltip = $event.find('.sched-event-tooltip'),
					tooltip_height = $tooltip.innerHeight();

				if(that.options.event_tooltip_width_type == 'event') {
					$tooltip.css('width', $tooltip.parent().innerWidth()-1);
				}

				if($tooltip.hasClass('sched-event-tooltip-first-child')) {
					$tooltip.css('width', $tooltip.innerWidth()-1);
				}else {
					//$tooltip.css('left', -1);
				}
				
				var tooltip_width = $tooltip.innerWidth(),
					event_width = $event.innerWidth();

				$tooltip.css('left', Math.floor((event_width-tooltip_width)/2));

				$tooltip.stop().css({
					'top': -tooltip_height-5,
					'display': 'block',
					'opacity': 0
				}).animate({
					'top': -tooltip_height-10,
					'opacity': 1
				}, 150);

			}, function() {
				
				var $tooltip = $event.find('.sched-event-tooltip'),
					tooltip_height = $tooltip.innerHeight();

				$tooltip.stop().animate({
					'top': -tooltip_height-15,
					'opacity': 0
				}, 150, function() {
					$tooltip.css({
						'display': 'none',
						'opacity': 1
					})
				});
			});
		}

		if(this.editor_mode && this.options.editor_quick_tooltips == 1) {
			var $popup = $($event.find('.sched-event-edit-tooltip-html').html());

			var original_color = $popup.find('.sched-color-picker').val();
			$popup.find('.sched-color-picker').wpColorPicker({
				palettes: false,
				change: function(event, ui) {
					var new_color = ui.color.toString();
					$event.attr('data-color', new_color);
					if(that.options.event_box_style == 1) {
						$event.find('.sched-event-inner').css('background', new_color);
					}else if(that.options.event_box_style == 2) {
						$event.find('.sched-event-inner').css('color', new_color).css('background', sched_color_lighten(new_color, that.info.style_lighten_amount));
						$event.find('.sched-event-inner-bar').css('background', new_color);
					}

				},
				clear: function() {
					$popup.find('.sched-color-picker').wpColorPicker('color', original_color)
				}
			});
			$popup.find('.sched-event-edit-tooltip-submit').click(function() {
				$popup.find('form').submit();
			});
			$popup.find('.sched-event-edit-tooltip-edit').click(function(e) {
				e.preventDefault();
				sched_open_event_editor($event.attr('data-event-id'));
			});
			$popup.find('.sched-event-edit-tooltip-duplicate').click(function(e) {
				e.preventDefault();
				sched_open_event_copy($event.attr('data-event-id'));
			});
			$popup.find('.sched-event-edit-tooltip-delete').click(function(e) {
				e.preventDefault();
				if(!confirm('Are you sure you want to delete this event?')) {
					return;
				}
				window.top.location = sched_action_url + '&method=delete_event&event_id='+$event.attr('data-event-id');
			});
			$popup.find("input[name=sched-event-edit-tooltip-title]").keyup(function (e) {
				if(e.keyCode == 13) {
					$popup.find('form').submit();
				}
			});
			$popup.find('form').on('submit', function(e) {
				e.preventDefault();

				$popup.find('.sched-event-edit-tooltip-submit').addClass('sched-button-grey').html('<i class="fa fa-spinner fa-spin"></i> Updating')

				var start = encodeURIComponent($popup.find('select[name=sched-event-edit-tooltip-time-start]').val()),
					end   = encodeURIComponent($popup.find('select[name=sched-event-edit-tooltip-time-end]').val()),
					id    = parseFloat($popup.find('input[name=sched-event-edit-tooltip-id]').val()),
					column    = parseFloat($popup.find('select[name=sched-event-edit-tooltip-column]').val()),
					title = encodeURIComponent($popup.find('input[name=sched-event-edit-tooltip-title]').val()),
					color = encodeURIComponent($popup.find('input[name=sched-event-edit-tooltip-color]').val());

				var url = sched_ajax_url + '&method=ajax_update_event_tooltip&id='+schedule_id+'&event_id='+id+'&start='+start+'&column='+column+'&end='+end+'&title='+title+'&color='+color;
				$.get(url, function(result) {
					result = $.parseJSON(result);
					setTimeout(function() {
						$popup.find('.sched-event-edit-tooltip-submit').removeClass('sched-button-grey').removeClass('sched-button-red').html('<i class="fa fa-save"></i> Save');
					}, 1000);
					if(result == null || typeof(result.success) == 'undefined' || result.success != '1') {
						$popup.find('.sched-event-edit-tooltip-submit').removeClass('sched-button-grey').addClass('sched-button-red').html('<i class="fa fa-times"></i> An Error Occured');
						return;
					}
					$popup.find('.sched-event-edit-tooltip-submit').html('<i class="fa fa-check"></i> Done');
					

					if(parseFloat($event.closest('.sched-column').attr('data-column-id')) !== result.column) {
						var $column = that.$schedule.find('.sched-column[data-column-id='+result.column+'] .sched-column-content');
						$event.appendTo($column);
						that.$schedule.find('.sched-event-fulldescription[data-event-id='+result.event_id+']').appendTo($column);
					}

					$event.animate({
						top: result.top,
						height: result.height
					}, 300, function() {
						// do a hard resize
						that.info.previous_width = false;
						that.resize();
					});
					$event.find('.sched-event-title, .sched-event-tooltip-title').html(result.title);
					$event.find('.sched-event-subtitle, .sched-event-tooltip-time').html(result.time_string);
				});
			});
			
			$event.hover(function() {
				var offset = $event.offset();

				var position = {
					left: offset.left-306,
					top: offset.top + 5,
					opacity: 0,
				}

				if($popup.hasClass('sched-event-edit-tooltip-right')) {
					position = {
						left: offset.left + $event.innerWidth()+6,
						top: offset.top + 5,
						opacity: 0,
					}
				}

				$popup
					.stop()
					.css(position)
					.appendTo($('body'))
					.show()
					.animate({
						opacity: 1,
						top: offset.top
					}, 150)

			}, function() {
				$popup
					.hide()
					
			});

			$popup.hover(function() {
				$popup.stop().css('opacity', 1).show();
			}, function() {
				$popup.stop().css('opacity', 1).hide();
			})
		}
	};

	Schedule.prototype.init_column = function($column) {
		var that = this;

		if(this.options.title_attr == 0) {
			$column.find('.sched-column-header').removeAttr('title');
		}

		if(this.options.column_tooltip == 1 && $column.find('.sched-column-tooltip > div').length > 1 && (!this.info.mobile || this.options.tooltips_mobile == 1)) {
			$column.find('.sched-column-header').hover(function() {
				var $tooltip = $(this).siblings('.sched-column-tooltip'),
					tooltip_height = $tooltip.innerHeight();

				if(that.options.column_tooltip_width_type == 'column') {
					$tooltip.css('width', $tooltip.parent().innerWidth()-1);
				}
				
				var tooltip_width = $tooltip.innerWidth(),
					column_width = $(this).innerWidth();
				$tooltip.css('left', Math.floor((column_width-tooltip_width)/2));
				

				$tooltip.stop().css({
					'top': -tooltip_height-5,
					'display': 'block',
					'opacity': 0
				}).animate({
					'top': -tooltip_height-10,
					'opacity': 1
				}, 150);

			}, function() {
				var $tooltip = $(this).siblings('.sched-column-tooltip'),
					tooltip_height = $tooltip.innerHeight();

				$tooltip.stop().animate({
					'top': -tooltip_height-15,
					'opacity': 0
				}, 150, function() {
					$tooltip.css({
						'display': 'none',
						'opacity': 1
					})
				});
			});
		}

	};

	Schedule.prototype.init_h_column = function($column) {
		var that = this;


		if(this.options.column_tooltip == 1 && $column.find('.sched-column-tooltip > div').length > 1 && (!this.info.mobile || this.options.tooltips_mobile == 1)) {
			$column.hover(function() {
				var $tooltip = $column.find('.sched-column-tooltip'),
					tooltip_height = $tooltip.innerHeight();

				if(that.options.column_tooltip_width_type == 'column') {
					$tooltip.css('width', $column.innerWidth()-1);
				}
				
				var tooltip_width = $tooltip.innerWidth(),
					column_width = $column.innerWidth();
				$tooltip.css('left', Math.floor((column_width-tooltip_width)/2));
				

				$tooltip.stop().css({
					'top': -tooltip_height-5,
					'display': 'block',
					'opacity': 0
				}).animate({
					'top': -tooltip_height-10,
					'opacity': 1
				}, 150);

			}, function() {
				var $tooltip = $column.find('.sched-column-tooltip'),
					tooltip_height = $tooltip.innerHeight();

				$tooltip.stop().animate({
					'top': -tooltip_height-15,
					'opacity': 0
				}, 150, function() {
					$tooltip.css({
						'display': 'none',
						'opacity': 1
					})
				});
			});
		}
	}

	Schedule.prototype.resize = function() {
		var that = this;
		this.resize_popup();

		var current_width = this.$schedule.innerWidth();
		if(this.info.type === 'list') {
			current_width = this.$schedule_list.innerWidth();
		}
		if(current_width == this.info.previous_width) {
			return;
		}
		this.info.previous_width = current_width;


		if(this.options.filter_position !== 'below_title_left') {
			// var top_buttons_width = this.$schedule.find('.sched-top-buttons').innerWidth();
			var top_buttons_width = this.$schedule.find('.sched-download-button').innerWidth() + this.$schedule.find('.sched-sort').innerWidth();


			if(this.info.has_filters) {
				top_buttons_width += this.info.filter_dropdown_open_width - this.info.filter_dropdown_closed_width;
			}
			var title_width = this.info.title_width,
				margin_width = 90,
				total_width = top_buttons_width + title_width + margin_width;

			if(total_width > this.$schedule.find('.sched-top').innerWidth()) {
				this.$schedule.find('.sched-top-buttons').removeClass('sched-top-buttons-right').addClass('sched-top-buttons-below-title');
			}else {
				this.$schedule.find('.sched-top-buttons').removeClass('sched-top-buttons-below-title');
				if(this.options.filter_position === 'right') {
					this.$schedule.find('.sched-top-buttons').addClass('sched-top-buttons-right');
				}
			}
		}
		// console.log(this.$schedule.find('.sched-sort-dropdown').innerWidth(), this.info.filter_dropdown_open_width - this.info.filter_dropdown_closed_width, this.$schedule.find('.sched-download-button').innerWidth(), this.$schedule.innerWidth())
		// if(this.$schedule.find('.sched-sort').innerWidth() + this.info.filter_dropdown_open_width - this.info.filter_dropdown_closed_width + this.$schedule.find('.sched-download-button').innerWidth() + 100 > this.$schedule.innerWidth()) {
		// 	this.$schedule.find('.sched-sort').addClass('sched-sort-clear')
		// }else {
		// 	this.$schedule.find('.sched-sort').removeClass('sched-sort-clear')
		// }
		// console.log(top_buttons_width, this.info.filter_dropdown_open_width, this.info.filter_dropdown_closed_width);

		/*if(this.info.has_filters && this.options.filter_position !== 'below_title_left') {
			var total_filter_width = this.info.filter_label_width + this.info.filter_dropdown_open_width,
				title_width = this.info.title_width,
				margin_width = 32,
				total_width = total_filter_width + title_width + margin_width;


			if(total_width > this.$schedule.find('.sched-top').innerWidth()) {
				this.$schedule.find('.sched-sort').removeClass('sched-sort-right').addClass('sched-sort-below-title');
			}else {
				this.$schedule.find('.sched-sort').removeClass('sched-sort-below-title');
				if(this.options.filter_position === 'right') {
					this.$schedule.find('.sched-sort').addClass('sched-sort-right');
				}
			}
		}*/

		if(this.options.columns_sticky_header == 1) {
			this.$schedule.find('.sched-column-header-sticky').each(function() {
				var $sticky = $(this);
				var $column_title = $sticky.siblings('.sched-column-header');
				$sticky.css('width', $column_title.width()).css('top', parseFloat(that.options.columns_sticky_header_offset));
			});
			if(that.info.break_columns == true) {
				that.$schedule.removeClass('sched-sticky-header-visible');
			}
		}

		if(this.info.has_filters) {
			if(this.info.filter_label_width + this.info.filter_dropdown_open_width > this.$schedule.find('.sched-top').innerWidth()) {
				that.$schedule.find('.sched-sort-label').hide();
			}else {
				that.$schedule.find('.sched-sort-label').show();
			}
		}
		// Cut event descriptions
		this.$events.each(function() {
			var $event = $(this);

			// var size = parseFloat($(this).attr('data-size')),
			// 	split = size === 1 ? 1 : (size-size%10)/10;

			var event_width = $event.innerWidth();
			if(event_width < that.info.event_box_padding_break) {
				$event.attr('data-padding', '0').find('.sched-event-inner').css({
					'padding-left': 2,
					'padding-right': 2,
				});
			}else {
				$event.attr('data-padding', that.info.event_box_padding).find('.sched-event-inner').css({
					'padding-left': that.info.event_box_padding+2,
					'padding-right': that.info.event_box_padding+2,
	// okraje bylo 6 je 2
				});
			}

			if((that.options.event_box_description_method == 'short' || that.options.event_box_description_method == 'full') && $event.find('.sched-event-description').length !== 0) {
				// Cut description if neccesarry
				var $description = $event.find('.sched-event-description'),
					description = $description.attr('data-full'),
					offset = $description.position(),
					padding_top = 6,
					event_height = $event.innerHeight() - offset.top - 1;
	// okraje bylo 6 je 1

				$description.html(description+'...');

				while ($description.innerHeight() > event_height) {
					if(description == '') {
						break;
					}

					// Remove last word
					var lastIndex = description.lastIndexOf(" ")
					description = description.substring(0, lastIndex);

					// Remove last character if it matches dot, comma or space
					var last_char = description.substr(description.length - 1);
					if(last_char == ',' || last_char == '.' || last_char == ' ') {
						description = description.slice(0, -1);
					}

					$description.html(description+'...');
				}

				if(description == '') {
					$description.html('');
				}else if(description == $description.attr('data-full')) {
					$description.html(description);
				}
			}
		});

		var columns_width = this.$schedule.find('.sched-row').first().innerWidth() - this.$schedule.find('.sched-row').first().find('.sched-sidebar').length * parseFloat(this.options.sidebar_width);
		
		// 
		if(this.info.type === 'list') {
			columns_width = this.$schedule_list.innerWidth() - this.$schedule.find('.sched-row').first().find('.sched-sidebar').length * parseFloat(this.options.sidebar_width);
		}

		var column_width = columns_width/this.$columns.length;



		if(this.options.column_break_action != 0 && !this.editor_mode && this.info.break_columns == false && column_width <= parseFloat(this.options.column_break_width)) {
			this.info.break_columns = true;
			
			if(this.options.column_break_action === 'list') {
				this.show_list();
			}else if(this.options.column_break_action === 'stack') {
				this.stack_columns();
			}
			

		}else if(this.options.column_break_action != 0 && !this.editor_mode && this.info.break_columns == true && column_width > parseFloat(this.options.column_break_width)) {

			this.info.break_columns = false;

			if(this.options.column_break_action === 'list') {
				this.hide_list();
			}else if(this.options.column_break_action === 'stack') {
				this.unstack_columns();
			}
			
		}

		if(this.layout == 'horizontal' && this.options.h_break == 1 && !this.editor_mode) {
			var container_width = this.$schedule_list.innerWidth()-parseFloat(this.options.h_column_width);

			if(this.info.type === 'full' && container_width < parseFloat(this.options.h_width_break_point)) {
				//convert to list
				this.show_list();
			}else if(this.info.type === 'list' && container_width >= parseFloat(this.options.h_width_break_point)) {
				//convert to full
				this.hide_list();
			}
			
		}

	};

	Schedule.prototype.resize_popup = function() {
		var popup_width = this.popup_width(),
			window_width = $(window).width();

		this.$popup.css({
			'width': popup_width,
			'left': (window_width-popup_width)/2,
		});

		if(popup_width+240 <= window_width) {
			//show arrows
			this.$popup.find('.sched-popup-navigate-right, .sched-popup-navigate-left').show()
			this.$popup.find('.sched-popup-navigate-right').css('left', popup_width+30)
		}else {
			//hide arrows
			this.$popup.find('.sched-popup-navigate-right, .sched-popup-navigate-left').hide()
		}

		var type = this.$popup.find('.sched-popup-media').attr('data-media-type');
		if(type == 'youtube') {
			this.$popup.find('.sched-popup-media').css({
				width: popup_width,
				height: popup_width/16*9
			});
			this.$popup.find('.sched-popup-media iframe').attr('width', popup_width).attr('height', popup_width/16*9);
		}else {
			this.$popup.find('.sched-popup-media').css({
				width: '100%',
				height: ''
			});
		}

	};

	Schedule.prototype.show_list = function() {
		this.info.type = 'list';
		this.$schedule.addClass('sched-hidden');
		this.$schedule_list.removeClass('sched-hidden');
		this.$schedule.find('.sched-top-buttons').appendTo(this.$schedule_list.find('.sched-list-top'));
		if(this.options.pdf_enable_list == 0) {
			this.$schedule_list.find('.sched-top-buttons .sched-download-button').hide();
		}
		
	};

	Schedule.prototype.hide_list = function() {
		this.info.type = 'full';
		this.$schedule_list.addClass('sched-hidden');
		this.$schedule.removeClass('sched-hidden');
		this.$schedule_list.find('.sched-top-buttons').appendTo(this.$schedule.find('.sched-top'));
		
		if(this.options.pdf_enable_list == 0) {
			this.$schedule.find('.sched-top-buttons .sched-download-button').show();
		}
	};

	Schedule.prototype.stack_columns = function() {
		var that = this,
			i = 0;
		this.$columns.each(function() {
			var $column = $(this);
			$column.css({
				'width': '100%',
				'float': 'none',
			});
			if(i == 0) {
				i++;
				return;
			}
			//var $row = $('<div class="sched-row" />').after(that.$schedule.find('.sched-row').last());
			var $row = $('<div />').attr('class', that.$schedule.find('.sched-row').first().attr('class')).appendTo(that.$schedule);

			that.$schedule.find('.sched-row').first().find('.sched-sidebar').clone().appendTo($row);

			var $column_wrap = $('<div class="sched-columns" />').css({
				'margin-left': that.$schedule.find('.sched-row').first().find('.sched-columns').css('margin-left'),
				'margin-right': that.$schedule.find('.sched-row').first().find('.sched-columns').css('margin-right'),
			}).appendTo($row);

			$column.appendTo($column_wrap);

			i++;
		});

		if(this.options.column_break_hide_sidebar == 1) {
			this.$schedule.find('.sched-top').css('margin-left', 0).css('margin-right', 0);
			this.$schedule.find('.sched-sidebar').hide();
			this.$schedule.find('.sched-columns').css({
				'margin-left': 0,
				'margin-right': 0,
			});
		}
	};

	Schedule.prototype.unstack_columns = function() {
		var that = this,
			i = 0;

		this.$columns.each(function() {
			var $column = $(this);
			$column.css({
				'width': (100/that.$columns.length) + '%',
				'float': 'left',
			});
			if(i == 0) {
				i++;
				return;
			}

			var $row = $column.parent().parent();
			$column.appendTo(that.$schedule.find('.sched-row').first().find('.sched-columns'));


			$row.remove();

			i++;
		});

		if(this.options.column_break_hide_sidebar == 1) {
			this.$schedule.find('.sched-top').css('margin-left', (this.options.sidebar_position == 'left' || this.options.sidebar_position == 'both') ? parseFloat(this.options.sidebar_width) : 0).css('margin-right', (this.options.sidebar_position == 'right' || this.options.sidebar_position == 'both') ? parseFloat(this.options.sidebar_width) : 0);
			this.$schedule.find('.sched-sidebar').show();
			this.$schedule.find('.sched-columns').css({
				'margin-left': (this.options.sidebar_position == 'left' || this.options.sidebar_position == 'both') ? parseFloat(this.options.sidebar_width) : 0,
				'margin-right': (this.options.sidebar_position == 'right' || this.options.sidebar_position == 'both') ? parseFloat(this.options.sidebar_width) : 0,
			});

		}
	};

	Schedule.prototype.open_event = function($event) {
		var that = this,
			position = $event.offset(),
			popup_width = this.popup_width(),
			event_id = $event.attr('data-event-id'),
			$popup = this.$popup,
			$overlay = this.$overlay,
			$event_description = this.$schedule.find('.sched-event-fulldescription[data-event-id='+event_id+']'),
			$event_inner = $event.find('.sched-event-inner');

		if($event_description.attr('data-media-type') == 'image') {
			$popup.addClass('sched-popup-has-image').find('.sched-popup-media')
				.attr('data-media-type', 'image')
				.html('<img src="'+$event_description.attr('data-media-link')+'" />');
		}else if($event_description.attr('data-media-type') == 'youtube') {
			$popup.addClass('sched-popup-has-image').find('.sched-popup-media')
				.attr('data-media-type', 'youtube')
				.html('<i class="sched-icon sched-icon-spinner sched-icon-spin"></i>');
		}else {
			$popup.removeClass('sched-popup-has-image').find('.sched-popup-media')
				.attr('data-media-type', '0')
				.html('');

		}
		this.$popup.attr('id', this.id+'-popup');

		this.resize_popup();

		$event_inner.css({
			//'background': $event.attr('data-color'),
			'color': ''
		});

		$popup.find('.sched-popup-title').css({
			'width': '',
		});

		var event_padding = parseFloat($event.attr('data-padding'))
		
		$popup.find('.sched-popup-title').html('<div>'+$event.find('.sched-event-title').html()+'</div>').css({
			'font-size': '18px',
			'line-height': '1.4',
			'padding': '14px 3px 0px 3px',
			'padding-right': event_padding+2,
			'padding-left': event_padding+2,
			'height': $event.innerHeight()-14,
			'background-color': $event.attr('data-color'),
			'text-align': $event.find('.sched-event-inner').css('text-align'),
			'font-weight': 'bold'
			// $event.find('.sched-event-inner')
		});

		$popup.find('.sched-popup-close').css('color', $event_inner.css('color'))

		var $popup_title_div = $popup.find('.sched-popup-title div');

		if(this.options.event_box_truncate_title == 1) {
			$popup_title_div.css({
				'text-overflow': 'ellipsis',
				'white-space': 'pre-wrap',
				'overflow': 'hidden'
			});
		}

		this.bind_arrows($event, event_id);

		var social_html = '';
		//social_html = '<div class="sched-popup-social-buttons"><a href="#" class="sched-popup-social-button sched-popup-social-facebook"><i class="sched-icon sched-icon-facebook"></i></a><a href="#" class="sched-popup-social-button sched-popup-social-twitter"><i class="sched-icon sched-icon-twitter"></i></a><a href="#" class="sched-popup-social-button sched-popup-social-google-plus"><i class="sched-icon sched-icon-google-plus"></i></a></div>';

		var extra_html = '';
		if(this.editor_mode) {
			extra_html = '<div class="sched-popup-buttons"><a href="'+sched_action_url + '&method=delete_event&event_id='+$event.attr('data-event-id')+'" class="sched-popup-delete-event sched-button sched-button-red" onclick="return confirm(\'Are you sure you want to delete this event\')" style="color: #e74c3c;"><i class="sched-icon sched-icon-times"></i>Delete Event</a><a href="#" class="sched-popup-edit-event sched-button" style="float: right;"><i class="sched-icon sched-icon-edit"></i>Edit Event</a></div>';
		}
		
		$popup.find('.sched-popup-description').html($event_description.html()+social_html+extra_html);

		$popup.find('.sched-popup-edit-event').click(function(e) {
			e.preventDefault();
			sched_open_event_editor($event.attr('data-event-id'));
			that.close_event();
		});

		var fix_width_offset = 0;
		if($event.hasClass('sched-event-size-21') || $event.hasClass('sched-event-size-33')) {
			fix_width_offset = 1;
		}

		$popup.css({
			'width': $event_inner.innerWidth()-fix_width_offset,
		});

		if(this.info.type === 'list') {
			$popup.css('visibility', 'hidden');
		}else {
			$popup.css('visibility', 'visible');
		}
		

		var document_width = $(window).width();

		var animations_speed = this.info.type === 'full' ? that.info.animations_speed : 1;

		$popup.css(position).fadeIn(that.info.animations_speed, function() {
			// return;
			$event.hide();
			$popup.find('.sched-popup-title').animate({
				'font-size': '18px',
				'padding': '10px 3px 0 3px',
				'height': '3em',
				'width': popup_width-40,
			}, {duration: animations_speed});

			//$popup.show();


			$popup.animate({
				left: ($(window).width()-popup_width)/2,
				top: $(window).scrollTop()+that.info.popup_top_offset,
			}, animations_speed, function() {
				$popup.css('width', popup_width);

				if(that.info.type === 'list') {
					$popup.css('visibility', 'visible');
				}
				

				// $popup.find('.sched-popup-description > div, .sched-popup-description > p').css('visibility', 'hidden')
				$popup.find('.sched-popup-description').slideDown(that.info.animations_speed);
				$popup.addClass('sched-popup-done');
				$popup.find('.sched-popup-title').css('width', '');

				that.info.open_event_id = ($event.attr('data-event-id'));

				$popup.find('.sched-popup-media').slideDown(that.info.animations_speed, function() {
					if($event_description.attr('data-media-type') == 'youtube') {
						var autoplay = (that.options.autoplay_videos == 1) ? '?autoplay=1' : '';
						$popup.find('.sched-popup-media').html('<iframe width="560" height="315" src="//www.youtube.com/embed/'+$event_description.attr('data-media-link')+autoplay+'" frameborder="0" allowfullscreen></iframe>');
						that.resize_popup();
					}
				});
			});
			that.show_overlay();
		});
	};

	Schedule.prototype.close_event = function(callback) {

		

		if(!this.info.open_event_id) {
			return;
		}

		var that = this,
			popup_width = this.popup_width()
			$event = this.$schedule.find(".sched-event[data-event-id="+this.info.open_event_id+"]"),
			$popup = this.$popup,
			$overlay = this.$overlay;

		var position = $event
			.css({
				'visibility': 'hidden',
				'display': 'block',
			})
			.offset();

		$event.hide().css({
			'visibility': '',
		});

		this.hide_overlay();

		if(this.options.hashtag_url == 1) {
			window.location.hash = '#rdv-calendar';
			if(history.pushState) {
				//history.pushState(null, null, '#');
			}
			else {
				//location.hash = '#';
			}
		}

		var fix_width_offset = 0;
		if($event.hasClass('sched-event-size-21') || $event.hasClass('sched-event-size-33')) {
			fix_width_offset = 1;
		}
		var event_padding = parseFloat($event.attr('data-padding'))
		$popup.removeClass('sched-popup-done');
		$popup.find('.sched-popup-media').slideUp(this.info.animations_speed);
		$popup.find('.sched-popup-description').slideUp(this.info.animations_speed, function() {

			var animations_speed = that.info.type === 'full' ? that.info.animations_speed : 1;

			if(that.info.type === 'list') {
				$popup.css('visibility', 'hidden');
			}
			$popup.find('.sched-popup-title').stop().animate({
				'font-size': '14px',
				'line-height': '1.5em',
				'padding': '10px 3px 0px 3px',
				'height': $event.innerHeight()-14,
				'width': $event.innerWidth()-12-2*event_padding-1-fix_width_offset,
			}, animations_speed, function() {
				//return;
				$popup.find('.sched-popup-media').html('');
				$event.show();
				$popup.fadeOut(that.info.animations_speed);
				that.info.open_event_id = false;
				if(that.info.type === 'list') {
					//$popup.css('visibility', 'visible');
				}
				if(typeof(callback) !== typeof(undefined)) {
					callback();
				}
			});
			$popup.css('width', '')
			$popup.animate(position, that.info.animations_speed);
		});

	};

	Schedule.prototype.find_next_event = function(event_id) {
		var $event = this.$schedule.find('.sched-event[data-event-id='+event_id+']'),
			sort_index = parseFloat($event.attr('data-sort-index')),
			$next_event = $event.siblings('.sched-event[data-sort-index='+(sort_index + 1)+']');

		if($next_event.length === 0) {
			return false;
		}

		if($next_event.hasClass('sched-event-sort-hidden')) {
			$next_event = this.find_next_event($next_event.attr('data-event-id'))
		}

		return $next_event;

	}

	Schedule.prototype.find_previous_event = function(event_id) {
		var $event = this.$schedule.find('.sched-event[data-event-id='+event_id+']'),
			sort_index = parseFloat($event.attr('data-sort-index')),
			$previous_event = $event.siblings('.sched-event[data-sort-index='+(sort_index - 1)+']');

		if($previous_event.length === 0) {
			return false;
		}

		if($previous_event.hasClass('sched-event-sort-hidden')) {
			$previous_event = this.find_previous_event($previous_event.attr('data-event-id'))
		}

		return $previous_event;

	}

	Schedule.prototype.queue_event = function($event) {
		var that = this;
		if($event !== false) {
			if(this.options.hashtag_url == 1) {
				//change url
				window.top.location.hash = 'event-'+$event.attr('data-event-id');				
			}else {
				//var hash = window.top.location.hash;
				this.close_event(function() {
					that.open_event($event);
				});
				
			}
		}

	};

	Schedule.prototype.open_next_event = function($event, previous_event_id) {
		var that = this;

		if($event == false) {
			return;
		}

		if(this.options.hashtag_url == 0) {
			this.close_event(function() {
				that.open_event($event);
			});
			return;
		}

		that.info.hashchange_method = 'normal';
		var $previous_event = this.$schedule.find('.sched-event[data-event-id='+previous_event_id+']');

		//change url
		//window.top.location.hash = 'event-'+$event.attr('data-event-id');
		var offset = this.$popup.offset(),
			height = this.$popup.innerHeight()

		this.$popup.animate({
			top: offset.top-(offset.top-$(window).scrollTop())-height,
		}, this.info.animations_speed/1.5, function() {
			that.$popup.css('top', $(window).scrollTop()+$(window).height())
			that.open_event_data($event, $previous_event)
			that.$popup.animate({
				// 'top': offset.top
				'top': $(window).scrollTop()+that.info.popup_top_offset
			}, that.info.animations_speed/1.5)
		});
		
	}

	Schedule.prototype.open_previous_event = function($event, previous_event_id) {
		var that = this;

		if($event == false) {
			return;
		}

		if(this.options.hashtag_url == 0) {
			this.close_event(function() {
				that.open_event($event);
			});
			return;
		}

		that.info.hashchange_method = 'normal';
		var $previous_event = this.$schedule.find('.sched-event[data-event-id='+previous_event_id+']');

		//change url
		//window.top.location.hash = 'event-'+$event.attr('data-event-id');
		var offset = this.$popup.offset(),
			height = this.$popup.innerHeight()

		this.$popup.animate({
			top: $(window).scrollTop()+$(window).height(),
		}, this.info.animations_speed/1.5, function() {
			that.$popup.css('top', offset.top-(offset.top-$(window).scrollTop())-height)
			that.open_event_data($event, $previous_event)
			that.$popup.animate({
				// 'top': offset.top
				'top': $(window).scrollTop()+that.info.popup_top_offset
			}, that.info.animations_speed/1.5)
		});
		
	}

	Schedule.prototype.open_event_data = function($event, $previous_event) {
		var that = this,
			event_id = $event.attr('data-event-id'),
			$popup = this.$popup,
			$event_description = this.$schedule.find('.sched-event-fulldescription[data-event-id='+event_id+']'),
			$event_inner = $event.find('.sched-event-inner');

		// $previous_event.fadeIn(this.info.animations_speed);
		// $event.fadeOut(this.info.animations_speed);

		$previous_event.show();
		$event.hide();

		if($event_description.attr('data-media-type') == 'image') {
			$popup.addClass('sched-popup-has-image').find('.sched-popup-media')
				.attr('data-media-type', 'image')
				.html('<img src="'+$event_description.attr('data-media-link')+'" />');
		}else if($event_description.attr('data-media-type') == 'youtube') {
			$popup.addClass('sched-popup-has-image').find('.sched-popup-media')
				.attr('data-media-type', 'youtube')
				.html('<i class="sched-icon sched-icon-spinner sched-icon-spin"></i>');
		}else {
			$popup.removeClass('sched-popup-has-image').find('.sched-popup-media')
				.attr('data-media-type', '0')
				.html('');

		}

		this.resize_popup();
		
		$popup.find('.sched-popup-title').html('<div style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden; color: '+that.options.event_box_text_color+'">'+$event.find('.sched-event-title').html()+'</div>').css({
			'background-color': $event.attr('data-color'),
			'color': '',
		});

		$popup.find('.sched-popup-close').css('color', $event_inner.css('color'))

		var $popup_title_div = $popup.find('.sched-popup-title div');

		this.bind_arrows($event, event_id);


		var social_html = '';
		//social_html = '<div class="sched-popup-social-buttons"><a href="#" class="sched-popup-social-button sched-popup-social-facebook"><i class="sched-icon sched-icon-facebook"></i></a><a href="#" class="sched-popup-social-button sched-popup-social-twitter"><i class="sched-icon sched-icon-twitter"></i></a><a href="#" class="sched-popup-social-button sched-popup-social-google-plus"><i class="sched-icon sched-icon-google-plus"></i></a></div>';

		var extra_html = '';
		if(this.editor_mode) {
			extra_html = '<div class="sched-popup-buttons"><a href="'+sched_action_url + '&method=delete_event&event_id='+$event.attr('data-event-id')+'" class="sched-popup-delete-event sched-button sched-button-red" onclick="return confirm(\'Are you sure you want to delete this event\')" style="color: #e74c3c;"><i class="sched-icon sched-icon-times"></i>Delete Event</a><a href="#" class="sched-popup-edit-event sched-button" style="float: right;"><i class="sched-icon sched-icon-edit"></i>Edit Event</a></div>';
		}
		
		$popup.find('.sched-popup-description').html($event_description.html()+social_html+extra_html);

		$popup.find('.sched-popup-edit-event').click(function(e) {
			e.preventDefault();
			sched_open_event_editor($event.attr('data-event-id'));
			that.close_event();
		});

		// var document_width = $(document).width();
		// $popup.css(position).fadeIn(that.info.animations_speed, function() {

		// 	$event.hide();
		// 	$popup.find('.sched-popup-title').animate({
		// 		'font-size': 18,
		// 		'line-height': 18,
		// 		'padding': 30,
		// 		'height': '18',
		// 		'width': popup_width-60,
		// 	}, {duration: that.info.animations_speed});

		// 	$popup.animate({
		// 		left: ($(document).width()-popup_width)/2,
		// 		top: $(window).scrollTop()+that.info.popup_top_offset,
		// 	}, that.info.animations_speed, function() {
		// 		$popup.css('width', popup_width);

		// 		$popup.find('.sched-popup-description').slideDown(that.info.animations_speed);
		// 		$popup.addClass('sched-popup-done');
		// 		$popup.find('.sched-popup-title').css('width', '');

				that.info.open_event_id = event_id;

		// 		$popup.find('.sched-popup-media').slideDown(that.info.animations_speed, function() {
					if($event_description.attr('data-media-type') == 'youtube') {
						var autoplay = (that.options.autoplay_videos == 1) ? '?autoplay=1' : '';
						$popup.find('.sched-popup-media').html('<iframe width="560" height="315" src="//www.youtube.com/embed/'+$event_description.attr('data-media-link')+autoplay+'" frameborder="0" allowfullscreen></iframe>');
						that.resize_popup();
					}
		// 		});
		// 	});
		// 	that.show_overlay();
		// });
	}

	Schedule.prototype.nudge_event_up = function() {
		var that = this;
		if(this.info.open_event_id === false || this.$popup.is(':animated')) {
			return;
		}
		var top = parseFloat(this.$popup.css('top'));
		this.$popup.animate({
			top: top-10
		}, 100, function() {
			that.$popup.animate({
				'top': top
			}, 50)
		})
	};

	Schedule.prototype.nudge_event_down = function() {
		var that = this;
		if(this.info.open_event_id === false || this.$popup.is(':animated')) {
			return;
		}
		var top = parseFloat(this.$popup.css('top'));
		this.$popup.animate({
			top: top+10
		}, 100, function() {
			that.$popup.animate({
				'top': top
			}, 50)
		})
	};

	Schedule.prototype.horizontal_scroll_update = function(pos) {
		// console.log(pos)
	}

	Schedule.prototype.bind_arrows = function($event, event_id) {
		var that = this,
			$popup = this.$popup;

		var next_event = this.find_next_event(event_id),
			previous_event = this.find_previous_event(event_id);

		this.info.next_event = false;
		this.info.previous_event = false;

		if(next_event !== false) {
			this.info.next_event = next_event;
			$popup.find('.sched-popup-navigate-right').show().unbind('click').bind('click', function() {
				that.info.hashchange_method = 'next';
				that.queue_event(next_event);
			});
		}else {
			$popup.find('.sched-popup-navigate-right').hide().unbind('click');
		}

		if(previous_event !== false) {
			this.info.previous_event = previous_event;
			$popup.find('.sched-popup-navigate-left').show().unbind('click').bind('click', function() {
				// that.queue_event(previous_event);
				that.info.hashchange_method = 'previous';
				that.queue_event(previous_event);
			});
		}else {
			$popup.find('.sched-popup-navigate-left').hide().unbind('click');
		}
	}

	Schedule.prototype.show_overlay = function(buttons) {
		if(typeof(buttons) === typeof(undefined)) {
			buttons = {left: false, right: false};
		}
		if(!this.info.animations && false) {
			this.$overlay.removeClass('sched-popup-overlay-hide').css('display', 'block').css('opacity', .5);
		}else if(this.options.animations_css3 == 1 && !this.info.mobile) {
			this.$overlay.addClass('sched-popup-overlay-show');
		}else {
			this.$overlay.stop().removeClass('sched-popup-overlay-hide').css('display', 'none').css('opacity', 1).fadeTo(500, .5);
		}
		
	};

	Schedule.prototype.hide_overlay = function() {
		var that = this;
		if(!this.info.animations && false) {
			this.$overlay.hide();
		}else if(this.options.animations_css3 == 1 && !this.info.mobile) {
			this.$overlay.removeClass('sched-popup-overlay-show');
			this.$overlay.addClass('sched-popup-overlay-hide');
			setTimeout(function() {
				that.$overlay.removeClass('sched-popup-overlay-hide');
			}, 500)
		}else {
			this.$overlay.stop().css('display', 'block').fadeTo(500, 0, function() {
				that.$overlay.css('display', 'none');
			});
		}

	};

	Schedule.prototype.popup_width = function() {
		var max_width = parseFloat(this.options.popup_max_width),
			width = $(window).width();

		if(width < max_width+20) {
			return width-20;
		}

		return max_width;
	}

})(jQuery);


function sched_equals(needle, haystack) {
	return haystack.trim().toLowerCase() == needle.toLowerCase();
}

function sched_not_equals(needle, haystack) {
	return !sched_equals(needle, haystack);
}

function sched_contains(needle, haystack) {
	return haystack.toLowerCase().indexOf(needle.toLowerCase()) > -1;
}

function sched_color_lighten(color, percent) {
	var C1 = new ColorMix.Color(color),
		C2 = new ColorMix.Color(255, 255, 255),
		mix = ColorMix.mix([C1, C2], [100-percent, percent]);
	return mix.toString('hex');
}

function sched_color_darken(color, percent) {
	var C1 = new ColorMix.Color(color),
		C2 = new ColorMix.Color(0, 0, 0),
		mix = ColorMix.mix([C1, C2], [100-percent, percent]);
	return mix.toString('hex');
}