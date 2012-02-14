$(document).ready(function(){
	var currheight = $(window).height();
	var currwidth = $(window).width();
	$(window).unbind('resize.dialog-overlay').resize(function(){
		if (currheight!=$(window).height() || currwidth!=$(window).width()) {
			$.ui.dialog.overlay.resize();
		}
		currheight = $(window).height();
		currwidth = $(window).width();
	});
});
$.extend($.ui.dialog, {
	dialogObject : null,
	getBodyTop : function() {
		var t = parseFloat($('body').css('top').replace('px', ''));
		return isNaN(t) ? 0 : t;
	}
});
$.extend($.ui.dialog.overlay, {
	resize : function() {
		if ($.ui.dialog.dialogObject) {
			$.ui.dialog.dialogObject.find('.ui-dialog-titlebar').next().dialog( "option", "position", "center");
		}
		this.resizeNoReposition();
	},
	resizeNoReposition:function(){
		if ($.ui.dialog.dialogObject) {
			var mt = -1 * $.ui.dialog.getBodyTop();
			var dmt = $.ui.dialog.dialogObject.offset().top;
			var nh = Math.max(
					dmt + $.ui.dialog.dialogObject.outerHeight() + mt, mt
							+ $(window).height());
			$('body').height(nh);
		}
		/* The following is from ui dialog original*/
		var $overlays = $([]);
		$.each($.ui.dialog.overlay.instances, function() {
			$overlays = $overlays.add(this);
		});

		$overlays.css({
			width : 0,
			height : 0
		}).css({
			width : $.ui.dialog.overlay.width(),
			height : $.ui.dialog.overlay.height()
		});
	}
});
$.extend($.ui.dialog.prototype, {
		_init: function() {
			this._setOptions({
				autoOpen : false,
				bgiframe: true,  
				modal : true,
				resizable : false,
				height: 'auto',  
				width: 'auto',
				draggable:false,
				buttons : {
					Close : function() {
						$(this).dialog("close");
					}
				}
			});
			this.uiDialog.bind('dialogopen',function(){
				var $this = $(this),
				lightboxheight = $this.outerHeight(),
			    mt = -1*$.ui.dialog.getBodyTop(),
			    scrollTop = $(window).scrollTop()+mt,
			    top = -1 * scrollTop,
			    backContentHeight = Math.max(scrollTop+lightboxheight,scrollTop+$(window).height());
				$.ui.dialog.dialogObject = $this;
				$('body').css({
					position:'absolute',
					overflow:'hidden',
					width:'100%',
					'min-width':$this.outerWidth(),
					top:top,
					height:backContentHeight
				});
				
				$.ui.dialog.dialogObject.bind('resize',function(){
					$.ui.dialog.overlay.resizeNoReposition();
				});
				$(window).unbind('resize.dialog-overlay');
			}).bind('dialogclose',function(){
				if ($.ui.dialog.dialogObject)
					$.ui.dialog.dialogObject.unbind('resize');
				var mt = $.ui.dialog.getBodyTop();
				$('body').css({
					top:0,
					position:'relative',
					width:'auto',
					height:'auto',
					overflow:'visible'
				});
				$(window).scrollTop($(window).scrollTop()-mt);
				$.ui.dialog.dialogObject = null;
			});
			if ( this.options.autoOpen ) {
				this.open();
			}
		},
		_position : function() {
			var mt = (this._isOpen ? -1*this._getBodyTop() : $(window).scrollTop());
			var w = Math.max(0,($(window).width()-this.uiDialog.outerWidth())/2);
			var h = Math.max(0,($(window).height()-this.uiDialog.outerHeight())/2)+mt;
			this.uiDialog.css({
				'top':h,
				'left':w
			});
		},
		_getBodyTop: function(){
			return $.ui.dialog.getBodyTop();
		}});