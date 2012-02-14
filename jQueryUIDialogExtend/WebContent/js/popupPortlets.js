/*
 * The FNZ object is created in portletUtilities.js.
 */
 
/* Fix event.layerX and event.layerY bug in jQuery in Chrome, after upgrade to jQuery 1.7+, this can be removed. */
(function (p) { p[17] === "layerX" && p.splice(17, 2); })(window.jQuery && jQuery.event.props || []);

FNZ.Popup = {};


    var lastClickTimestamp = 0;
    var panelInit = false;
    var portletIndex = 0;
    
    /*
     * Common functions used by both Panels and lightboxes
     */
    FNZ.Popup.Utils = {
 			
 		// Convert double-clicks to clicks (ignore second click).  May be redundant?
 		captureDoubleClick: function(options){
 			var event = options.event;
 			diff = event.timeStamp - lastClickTimestamp;
 			lastClickTimestamp = event.timeStamp;
 			if (diff < 400) {
 				return true;
 			}
 			return false;
 		},

 		getInternalTargetURL: function(options){

 			var target = options.target;

 			var action = '&act=' + escape(options.act);
 			var account = '&acc=' + escape(options.acc);
   			var params = '&prm=' + escape(options.prm);

 			var cidVal = FNZ.getURLParam('cid');
 			var cid = (cidVal == null ? '' : '&cid=' + cidVal);
   			
      		panelURL = '/c/portal/render_portlet?' + target + action + account + params + cid;
 			serverURL = window.location.protocol + '//' + window.location.host;
 			fullURL = serverURL + panelURL;

 			return fullURL;
 		}
 	}

     
    FNZ.Popup.Panel = {

 		/*
 		 * In options, provide one of:
 		 *   target - to show another Portlet.
 		 *   internalTargetId - to show the content of an existing HTML element.
 		 */
    		show: function(options) {
    	   		if (!panelInit) {
    	   			jQuery(document).click(function(event) {
    	   				var jEnclosingPanel = jQuery(event.target).closest('.fnz-popup-panel');
    	   				FNZ.Popup.Panel.closeOtherPanels({panel : jEnclosingPanel});
    	   		 	});
    			   	panelInit = true;
    	   		}

    	   		
    			if (FNZ.Popup.Utils.captureDoubleClick(options)) return false;
    			this.processPanelLaunchClick(options);
    		},
    		
    		// Handle the click event on the launch element (e.g. button):
    		processPanelLaunchClick: function(options) {

    			var event = options.event;
    			var launchElement = event.target;
    		
    			event.stopPropagation();

    			// The launching element MUST have a unique ID:
    			panelID = 'PANEL_' + jQuery(launchElement).attr('id');
    			
    			var jPanelDiv = jQuery("#" + panelID);
    			this.closeOtherPanels({panel : jPanelDiv});

    			options.launchElement = launchElement;
    			options.panelID = panelID;
    			this.togglePanel(options);
    		},
    		
    		// Close all popupPanels other than the current one:
    		closeOtherPanels: function(options) {
    			
    			jThisPanel = options.panel;
    			
    			jQuery.each(jQuery('.fnz-popup-panel'), function(key, thisDiv) {
    				jThisDiv = jQuery(thisDiv);
    				if (jThisDiv.attr('id') != jThisPanel.attr('id')) {
    					jThisDiv.hide();
    				}
    			});
    		},
    		
    		
    		// Show/Hide (& create if necessary) the selected Panel:
    		togglePanel: function(options) {
    			
    			launchElement = options.launchElement;
    			panelID = options.panelID;

    			var jLaunchElement = jQuery(launchElement);
    			var jPanelDiv = jQuery("#" + panelID);
    			var targetEle = (options.targetEle && options.targetEle.length) ? options.targetEle : jQuery(document.body);
    	    	if (jPanelDiv.length == 0) {
    	    		
    	    		targetEle.append('<div class="fnz-popup-panel" id="' + panelID + '"></div>');
    	      		jPanelDiv = jQuery("#" + panelID);
    	      		
        			if (options.zindex != undefined){
        				
        				this.showPanel({launchElement : jLaunchElement, panelDiv : jPanelDiv,zindex :options.zindex });
        			}
        			else{
        				this.showPanel({launchElement : jLaunchElement, panelDiv : jPanelDiv});
        			}

    	      		

    	      		if (options.internalTargetId) {
    	      			var jInternalTargetDiv = jQuery("#" + options.internalTargetId);
    	      			jInternalTargetDiv.remove();
    	      			jPanelDiv.append(jInternalTargetDiv);
    	      		} else {
    					/**FNZ - refresh cookie time**/
    	 				if (Liferay.Session != null) {
    	 					Liferay.Session.setCookie();
    	 				}
    					
    	      			
    					fullURL = FNZ.Popup.Utils.getInternalTargetURL(options);
    					var data = '';
    					if (options.postData) {
 	   	      				data = options.postData;
    					}
    		   	      	jPanelDiv.load(fullURL, data);
    	      		}
    	      		// Maybe needs to reset size after load callback?
    	      		// Testing... can we set width after shown & loaded?
    	      		if (options.height) jPanelDiv.css({ 'height' : options.height });
    	      		if (options.width) jPanelDiv.css({ 'width' : options.width });
    	      		
    	    	}
    	    	else {
    	    			
    	      		if (jPanelDiv.is(':visible')) {
    	      			jPanelDiv.hide();
    	      			
    	      		}
    	      		else {
    	      			
    		      		this.showPanel({launchElement : jLaunchElement, panelDiv : jPanelDiv});
    	      		}
    	    	}
    		},

    		// Show the selected Panel:
    		showPanel: function(options) {

    			
    			jTrigElement = options.launchElement;
    			jPanelDiv = options.panelDiv;
    			
    			// Fix to correct missing alignment due to span in buttons
     	        if (jQuery(launchElement).attr('id') == "SpriteButtonSpan") {
     	        	jTrigElement = jQuery(launchElement).parent();
     	        }
    			
    		 	var trigLeft = jTrigElement.offset().left;
    			var windowWidth = jQuery(window).width();
    			
    			// Workaround due to bug in position() function in IE
				jPanelDiv.css({top:0,left:0}).show();
    			if (trigLeft < (windowWidth / 2)) {
    				
    				jPanelDiv.position({ my: "left top", at: "left bottom", of: jTrigElement, collision: "none"}).hide().slideDown();
    			}
    			else {
    				
    				jPanelDiv.position({ my: "right top", at: "right bottom", of: jTrigElement, collision: "none"}).hide().slideDown();
    			}
    			
    			if (options.zindex != undefined){
    				jPanelDiv.css("z-index",options.zindex)
    			}
    			
    			
    			

    		},

    		// Close the selected Panel from within:  e.g <div onclick="FNZ.Popup.Panel.hide({element : this})">Close Me</div>
    		hide: function(options) {
    			element = options.element;
    			var jEnclosingPanel = jQuery(element).closest('.fnz-popup-panel');
    			jEnclosingPanel.hide();
    		}
    	};

    FNZ.Popup.Lightbox = {
			uiDialog:null,
 			show: function(options){
 				if (FNZ.Popup.Utils.captureDoubleClick(options)) return false;
 				var sourceIsInternal = options.target ? true : false;
 	   			// We recreate the Lightbox div for each use.
				// In case an old (hidden) lightbox div is hanging around:
				jQuery('.fnzportlet-lightbox').remove();
 	   			
   	      		jQuery(document.body).append('<div class="fnzportlet-lightbox dialogWindow" id="lightboxDiv" style="display:none;" title=""></div>');
   	      		jLightboxDiv = jQuery("#lightboxDiv");

   	      		jLightboxDiv.dialog({
		            bgiframe: true,  
		            height: 'auto',  width: 'auto',
		            minHeight: 131, //160 in total included title and excluded border
		            autoOpen: false, 
		            resizable: true,
		            open: options.open,
   	      			beforeClose: options.close
		        });
				jLightboxDiv.bind('dialogopen',function(){
					FNZ.Popup.Lightbox.uiDialog = $('.ui-dialog:visible');
					FNZ.Popup.Lightbox.autoResize(); 
					FNZ.Popup.Lightbox.uiDialog.bind('resize',function(event){
						if (!$(event.target).is('.newList') && !$(event.target).is('.dp-popup'))
							FNZ.Popup.Lightbox.calculateOverlayForResize();
					});
					$('.portlet-content').addClass('clearfix');
					/* Fix the issue: jQuery dialog (modal:true) block click scrollbar in Chrome */
					window.setTimeout(function(){
						jQuery(document).unbind('mousedown.dialog-overlay')
                            .unbind('mouseup.dialog-overlay');},100);
				}).bind('dialogclose',function(){
					FNZ.Popup.Lightbox.closeDateChoosePanel();
					if (FNZ.Popup.Lightbox.uiDialog)
						FNZ.Popup.Lightbox.uiDialog.unbind('resize');
					var mt = parseFloat($('body').css('top').replace('px',''));
					$('body').css({
						'top':0,
						'position':'relative',
						'height':'auto',
						'overflow':'visible'
					});
					FNZ.Popup.Lightbox.showEleOutOfOverlay();
					$(window).scrollTop($(window).scrollTop()-mt);
					FNZ.Popup.Lightbox.uiDialog = null;
				});
   	      		var closeLink = jQuery('.ui-dialog-titlebar-close');
   	      		// Add text 'Close' to the existing close button.
   	      		closeLink.prepend('<span class="fnz-close-word">Close</span>');

   	      		// Add the tearoff button.
 				if (options.tearOff) {
 					closeLink.parent().append('<a href="#" class="fnz-tearoff-link"><span class="fnz-tearoff-button ui-icon ui-icon-copy" id="tearoff-button"></span></a>');
 			        tearoffButton = jQuery('#tearoff-button');
 			        tearoffButton.click(
 					    function() {
 					        jLightboxDiv.dialog('close');
 					        jLightboxDiv.dialog('option', 'modal', false);
 					        jLightboxDiv.dialog('option', 'draggable', true);
 					        jLightboxDiv.dialog('open');
 				        }
 			        );
 				}
 
 		        jLightboxDiv.dialog('option', 'modal', true);
 		        jLightboxDiv.dialog('option', 'draggable', false);
				jLightboxDiv.addClass('clearfix');
 				if (sourceIsInternal) {
 					
 					// Save a handle to options for subsequent nested Portlets:
 					this.originalOptions = options;
 					this.portletStack = new Array();
 					
 					fullURL = FNZ.Popup.Utils.getInternalTargetURL(options);
 	   	      		var data = '';
 	   	      		if (options.postData) {
 	   	      			data = options.postData;
 	   	      		}
 	   	      		
 	   	      		portletIndex = 0;
 	   	      		FNZ.Popup.Lightbox.addPortletToLightbox({url : fullURL, postData : data, title : options.title});
 	   	      		
 				} else {
 	   	      	
 					jLightboxDiv.html('<iframe scrolling="yes" width="100%" height="100%" id="modalLightbox" ' + 
 	   		   	      	'name="modalLightbox" marginheight="0" frameborder="0" >NAB Home</iframe>');
 	   	      		jLightboxIFrame = jQuery("#modalLightbox");
 					jLightboxIFrame.load(function(){
    						if (this.src) {
    							FNZ.Popup.Lightbox.autoResize({frameId: 'modalLightbox'});
    	   					}
  					});
 			        if (options.url) jLightboxIFrame.attr("src", options.url);   
 	 		        if (options.title) jLightboxDiv.dialog('option', 'title', options.title);
  	   	    	}
  	   	    	
 		        if (options.width) jLightboxDiv.dialog('option', 'width', options.width);
 		        
 		        jLightboxDiv.dialog('option', 'height', options.height || 'auto');    
 		        jLightboxDiv.dialog('option', 'resizable', options.resizable);    

 		        jLightboxDiv.dialog('open');
 			},

 			// These functions cater to the nested Portlets within a Lightbox.
 			showNextPortlet: function(currentOptions){
				
 				// prm : Don't use original value - only use if a new value is passed in here.
 				// act : Don't use original value - only use if a new value is passed in here.
 				
 				// acc : If no new value provided, default to the original value:
 				if (!currentOptions.acc) {
 	 				currentOptions.acc = this.originalOptions.acc;
 				}

 				// cid : Always take the original value (no overriding permitted).
 				currentOptions.cid = this.originalOptions.cid;

 				fullURL = FNZ.Popup.Utils.getInternalTargetURL(currentOptions);

 				// postData : Always take the current value.
    	      	var data = currentOptions.postData;

    	      	FNZ.Popup.Lightbox.addPortletToLightbox({url : fullURL, postData : data, title : currentOptions.title});

 		        if (currentOptions.title) jLightboxDiv.dialog('option', 'title', currentOptions.title);        

 				if (currentOptions.show) {
 					currentOptions.show();
 				}
 			},

 			
 			showPreviousPortlet: function(options){
 				var currentDiv = this.portletStack.pop();
 				currentDiv.remove();
 				
 				if (this.portletStack.length > 0) {
 					jQuery("#lightboxDiv").children().hide();
 	 				var previousDiv = this.portletStack[this.portletStack.length - 1];
 	 				previousDiv.show();
 	 				
 	 				var divTitle = previousDiv.attr('title');
 	 		        jLightboxDiv.dialog('option', 'title', divTitle);        
 	 				
 				} else {
 					this.hide();
 				}
 			},
 			
 			
 			
 			// For internal use only.
 			addPortletToLightbox: function(options){
 				
				/**FNZ - refresh cookie time**/
 				if (Liferay.Session != null) {
 					Liferay.Session.setCookie();
 				}
				
 	   			var jLightboxDiv = jQuery("#lightboxDiv");
 	   			var childDivs = jLightboxDiv.children();
 	   			childDivs.hide();
 	   			
 	   			portletIndex++;
 	   			var portletDivID = 'lightbox-portlet-' + portletIndex;
 	   			
 		        if (options.title) jLightboxDiv.dialog('option', 'title', options.title);        
 	   			
 	   			jLightboxDiv.append('<div class="loading-animation" id="' + portletDivID + '" + title="' + options.title + '"></div>');

 	   			var newDiv = jQuery('#' + portletDivID);
 	   			newDiv.load(
 	   				options.url, 
 	   				{ postData : options.postData },
	 	   			function() {
						newDiv.removeClass('loading-animation');
						FNZ.Popup.Lightbox.autoResize(); 
					}
 	   			);
				newDiv.ajaxSuccess(function(){
					FNZ.Popup.Lightbox.autoResize(); 
				});
 				this.portletStack.push(newDiv);
 			},

 			
 			hide: function(options){
 				var jLightboxDiv = jQuery("#lightboxDiv");
 				jLightboxDiv.children().remove();
 	   			jLightboxDiv.dialog('close');
 			},
 			
 			
 			resizeHeight: function(options){
 				var frame = document.getElementById(options.frameid);
 				var innerDoc = (frame.contentDocument) ? frame.contentDocument : frame.contentWindow.document;
 				var objToResize = (frame.style) ? frame.style : frame;
 				objToResize.height = innerDoc.body.scrollHeight + 10;
 				//objToResize.width = innerDoc.body.scrollWidth + 10;
 				
 		    	var theFrame = jQuery("#lightbox", parent.document.body);
 		    	theFrame.height(objToResize.height +10); //8 //44
 			},
 			
 			//testing link http://stackoverflow.com/questions/153152/resizing-an-iframe-based-on-content
 			autoResize: function (options){
 				    var newheight;
 				    var newwidth;
					var $targetEle = $("#"+(typeof options == 'undefined') ? "" : (typeof options.frameId == 'undefined' ? "":options.frameId));

					var jLightboxDiv = jQuery("#lightboxDiv:visible");
					if ($targetEle.length && $targetEle.is('iframe')) {

						newheight=$targetEle.contents().find("body").height();
 				        newwidth = $targetEle.contents().find("body").width();
						$targetEle.height((newheight + 10) + "px");
						jLightboxDiv.dialog('option', 'height', newheight + 50); 
						$targetEle.width((newwidth + 10) + "px");
						jLightboxDiv.dialog('option', 'width', newwidth + 50);
					}
					if (jLightboxDiv.length) {
					var lightboxheight = FNZ.Popup.Lightbox.uiDialog.outerHeight(),
					    mt = FNZ.Popup.Lightbox.getBodyTop(),
					    scrollTop = $(window).scrollTop()+mt,
					    top = -1 * scrollTop,
					    backContentHeight = Math.max(scrollTop+lightboxheight,scrollTop+$(window).height()),
					    windowHeight = $(window).height();
					$('body').css({
						'position':'absolute',
						'width':'100%',
						'overflow':'hidden',
						'height':backContentHeight,
						'min-width':FNZ.Popup.Lightbox.uiDialog.outerWidth(),
						'top':top
					});
					FNZ.Popup.Lightbox.calculatePosition();
					FNZ.Popup.Lightbox.calculateOverlay();
					FNZ.Popup.Lightbox.uiDialog.find('.date-pick').each(function(){
						$(this).bind('dpDisplayed',function(){
							var dp = $('#dp-popup');
							var offset = $(this).siblings('.dp-choose-date').offset();
							$('#dp-popup').css({
								'top':offset.top+FNZ.Popup.Lightbox.getBodyTop(),
								'left':offset.left
							});
							dp.resize(function(){
								FNZ.Popup.Lightbox.calculateOverlayForElements($('#dp-popup'));
							}).resize();
						}).bind('dpClosed',function(){
							$('#dp-popup').unbind('resize');
							FNZ.Popup.Lightbox.calculateOverlay();
						});
					});
					FNZ.Popup.Lightbox.uiDialog.find('.newListSelected').each(function(){
						$(this).find('.selectedTxt').bind('click.sSelect', function(){
							var newList = $(this).parent().find('.newList');
							if (newList.is(':visible'))
								FNZ.Popup.Lightbox.calculateOverlayForElements(newList);
						});
						$(this).find('.newList').resize(function(event){
							if ($(this).is(':visible'))
								FNZ.Popup.Lightbox.calculateOverlayForElements($(this));
						}).resize();
					});
					FNZ.Popup.Lightbox.uiDialog.find('a.help,a.jPinHelp').bind('tooltipshow', function(){
						var $this = $(this),
							tooltip = $('#jTooltipContainer'),
							tooltipTop = parseFloat(tooltip.css('top').replace('px','')),
							tooltipLeft = parseFloat(tooltip.css('left').replace('px','')),
							scrollLeft = $(window).scrollLeft(),
							displayAbove = tooltip.hasClass('displayAbove');
						if (displayAbove && $('.ui-dialog').outerWidth()>$(window).width()) tooltipLeft = 5;
						else if (scrollLeft>0) {
							tooltipLeft-=scrollLeft;
						}
						tooltip.css({
							'top':tooltipTop+FNZ.Popup.Lightbox.getBodyTop(),
							'left':tooltipLeft+scrollLeft
						});
						if (displayAbove)
							$('#jTooltipArrow').css('right',scrollLeft+tooltipLeft+tooltip.outerWidth()-$this.offset().left-$this.outerWidth());
					});
					}
 			},
			calculateOverlayForElements: function($ele){
				var t=0;
				if ($ele.parentsUntil('body','.ui-dialog').length) {
					t=FNZ.Popup.Lightbox.uiDialog.offset().top;
				}
				var bottomOverlay = $ele.offset().top+$ele.outerHeight()+t - Math.max($(window).height(),FNZ.Popup.Lightbox.uiDialog.outerHeight()+FNZ.Popup.Lightbox.uiDialog.offset().top);
				if (bottomOverlay > 0) {
					FNZ.Popup.Lightbox.calculateOverlay(bottomOverlay);
				}
			},
			getBodyTop: function(){
				var mt = -1 * parseFloat($('body').css('top').replace('px',''));
				return (isNaN(mt)) ? 0 : mt;
			},
			calculateOverlayForResize: function(){
				var selectLists=FNZ.Popup.Lightbox.uiDialog.find('.newList:visible');
				if (selectLists.length) {
					selectLists.each(function(){
						$(this).resize();
					});
				} else {
					FNZ.Popup.Lightbox.calculateOverlay();
				}
			},
			calculateOverlay: function(bottomOverlay){
				var mt = FNZ.Popup.Lightbox.getBodyTop();
				var dmt = FNZ.Popup.Lightbox.uiDialog.offset().top + (typeof bottomOverlay == 'undefined' ? 0 : bottomOverlay);
				var nh = Math.max(dmt+FNZ.Popup.Lightbox.uiDialog.outerHeight()+mt, mt+$(window).height());
				$('body').height(nh);
				FNZ.Popup.Lightbox.hideEleOutOfOverlay();
				$.ui.dialog.overlay.resize();
			},
			calculatePosition: function(){
				var mt = FNZ.Popup.Lightbox.getBodyTop();
				var w = Math.max(0,($(window).width()-FNZ.Popup.Lightbox.uiDialog.outerWidth())/2);
				var h = Math.max(0,($(window).height()-FNZ.Popup.Lightbox.uiDialog.outerHeight())/2)+mt;
				FNZ.Popup.Lightbox.uiDialog.css({
					'top':h,
					'left':w
				});
			},
			hideEleOutOfOverlay: function(){
				var overlay = $('.ui-widget-overlay');
				var overlayHeight = overlay.height()+overlay.offset().top;
				$('.help').each(function(){
					if ($(this).offset().top>overlayHeight) {
						$(this).css('display','none');
					}
				});
			},
			showEleOutOfOverlay: function() {
				$('.help').each(function(){
					$(this).css('display','inline');
				});
			},
			closeDateChoosePanel: function() {
				if ($('#dp-popup').length) {
					$('#dp-popup').unbind('resize');
					FNZ.Popup.Lightbox.uiDialog.find('.date-pick').each(function(){
						if ($('#dp-popup').length) {
							$(this).dpClose();
						}
					});
				}
			}
 		};
    
    FNZ.Popup.WSODLightbox = {
    		show: function(options) {
    			if(options && window.wsod){
	    			switch(options.lightboxName){
	    				case 'Goal Tracker':
	    				  wsod.showGoalTracker();
	    				  break;
	    				case 'Advanced Charting':
	    				  options.insCode = options.insCode || '';
	    				  wsod.showAdvancedChartLB(null, options.insCode);
	    				  break;
	    				case 'Derivatives Calculator':
		    			  wsod.showDerivativesCalculatorLB();
		    			  break;
	    				case 'Create WSOD Alert':
	    				  options.insCode = options.insCode || 'NAB';
	    				  wsod.showAlertsHub(null, options.insCode);
	    				  break;
	    				default:
	    				}
	    			}
    			}
    	};

$(document).ready(function(){
	var currheight = $(window).height();
	var currwidth = $(window).width();
	$(window).resize(function(){
		if (FNZ.Popup.Lightbox.uiDialog && (currheight!=$(window).height() || currwidth!=$(window).width())) {
			FNZ.Popup.Lightbox.closeDateChoosePanel();
			FNZ.Popup.Lightbox.calculatePosition();
			FNZ.Popup.Lightbox.calculateOverlayForResize();
		}
		currheight = $(window).height();
		currwidth = $(window).width();
	});
});
