

(function($){
  
  if (!$.dialogs){
    var $body;
    
    // initialize namespace and required dom elements
    $.dialogs = {};
    
    $.dialogs.defaultOptions = {
      bodyClass: "no-scroll",             // body class when opening a dialog, used to prevent scroll with overflow: hidden
      showOnInit: true,                   // show the dialog right after initializing it
      overlayClass: "dialogs-overlay",    // the class of the overlay (semi transparent background) that will cover the page when a dialog is opened
      overlayVisibleClass: "visible",     // class added and removed from the overlay to trigger any css transition
      
      dialog: {                           // single dialog box defaults
        title: "New dialog",
        message: "Message here",
        inputs: {},
        buttons: [],
        autoShow: true,
        overlayClickClose: true,
        attributes: {
          class: "jq-dialog"
        }
      }
    };
    
    
    
    /***************************
    *         OVERLAY
    ***************************/
    
    $.dialogs.overlay = {
      visible: false,
      closing: false
    };
    
    
    // display the overlay
    $.dialogs.overlay.show = function(){
      $body = $body || $("body");
      $.dialogs.overlay.visible = true;
      $.dialogs.overlay.closing = false;
      
      // create overlay if necessary
      if ($.dialogs.$overlay === undefined){
        $.dialogs.$overlay = $("<div/>").attr({class: $.dialogs.defaultOptions.overlayClass});
      }
      
      // remove the destroy function after css3 transition (to prevent overlay from being destroyed after a quick hide/show)
      $.dialogs.$overlay.off(transitionEndEventName(), removeDialogOverlay($.dialogs.$overlay));
      
      // append overlay to the body if it doesn't exist
      if ($body.find($.dialogs.defaultOptions.overlayClass).length === 0){
        $body.append($.dialogs.$overlay).addClass($.dialogs.defaultOptions.bodyClass);
      }
      
      $.dialogs.$overlay.css("opacity");                // access css opacity to reflow and enable transition when adding the visible class below
      
      $.dialogs.$overlay.addClass($.dialogs.defaultOptions.overlayVisibleClass);           // visible class is used to toggle any css3 transition
    }
    
    
    // hides overlay and calls destroy after any css3 transition
    $.dialogs.overlay.hide = function(){
      $.dialogs.overlay.closing = true;
      $.dialogs.$overlay.removeClass($.dialogs.defaultOptions.overlayVisibleClass);
      $.dialogs.$overlay.on(transitionEndEventName(), removeDialogOverlay($.dialogs.$overlay));
    }
    
    
    // destroy overlay element
    function removeDialogOverlay($overlay){
      $body = $body || $("body");
      
      $overlay.remove();
      $body.removeClass($.dialogs.defaultOptions.bodyClass);
      $.dialogs.overlay.visible = false;
      $.dialogs.overlay.closing = false;
    }
    
    /***************************
    *       end overlay
    ***************************/
    
    
    
    function fireCallback(callbackName){
      console.log("TODO callback: " + callbackName);
    }
    


    /***************************
    *   DIALOG constructor
    ***************************/
    
    
    function Dialog(options){
      
      var dialogElements = {
        title: "jq-dialog-title", 
        message: "jq-dialog-message", 
        inputs: "jq-dialog-inputs", 
        buttons: "jq-dialog-buttons"
      };
      var initialized = false;
      var overlayClickCloseBound = false;
      

      var dialog = this;
      dialog.options = $.extend(true, $.dialogs.defaultOptions.dialog, options);
      dialog.active = false;

      var $dialog = $('<div/>');
      $dialog.attr(dialog.options.attributes);



      // public functions

      dialog.show = function(){
        if (!$.dialogs.overlay.visible || $.dialogs.overlay.closing)
          $.dialogs.overlay.show();
        if (!initialized){
          createDialogStructure();
        }
        updateDialogContent();
        updateDialogBinds();
        dialog.active = true;
        $.dialogs.current = dialog;
        $body.append($dialog);
        dialog.centerPosition();
        $dialog.addClass("visible");
      }


      dialog.close = function(){
        // TODO check if queue is empty before hiding the overlay if i'll implement a queue system
        dialog.active = false;
        $.dialogs.current = undefined;
        
        // TODO fadeout effect with callbacks before remove
        $dialog.remove();
        if (overlayClickCloseBound)
          $.dialogs.$overlay.off("click", dialog.close);
        $.dialogs.overlay.hide();
      }


      dialog.update = function(options){
        dialog.options = $.extend(true, dialog.options, options);
        updateDialogContent();
        dialog.centerPosition();
      }

      
      dialog.centerPosition = function(){
        var dialogWidth = $dialog.outerWidth();
        var dialogHeight = $dialog.outerHeight(); 
        
        $dialog.addClass("no-transition").css({left: "50%", top: "50%", position: "fixed", "margin-left": -dialogWidth/2, "margin-top": -dialogHeight/2});
        $dialog.css("opacity");
        $dialog.removeClass("no-transition");
        
      }
      

      // private functions

      function createDialogStructure(){
        for (var dialogPart in dialogElements){
          var partClass = dialogElements[dialogPart];
          $("<div/>").attr({class: partClass}).appendTo($dialog);
        }
        initialized = true;
      }


      function updateDialogContent(){
        $dialog.find("." + dialogElements.title).text(dialog.options.title);
        $dialog.find("." + dialogElements.message).text(dialog.options.message);

        
        // TODO update inputs
        // TODO update buttons
        // TODO rebind everything (if needed)

        // $dialog.find("." + dialogElements.inputs);
        // $dialog.find("." + dialogElements.buttons);
        
      }
      
      
      function updateDialogBinds(){
        if (dialog.options.overlayClickClose && !overlayClickCloseBound)
          $.dialogs.$overlay.on("click", dialog.close);
          // bindCloseOnOverlayClick();
      }
      

      // creates action buttons
      function createButtons(){
        var buttons = _box.options.buttons;
        if (typeof buttons === 'object' && buttons.constructor === Array){
          for (var i = 0; i < buttons.length; i++){
            var button = buttons[i];
            createAndBindButton(button);
          }
        }
      }

      // bind each action button
      function createAndBindButton(button){
        var buttonClass = typeof button.customClass === 'string' ? 'jq-dialog-button ' + button.customClass : "jq-dialog-button";
        var $button = $("<button class='" + buttonClass + "'>" + button.text + "</button>");
        $actions.append($button);

        // if button.onclick is a function, call it
        if (typeof button.onclick === 'function'){
          var args = [];
          if ( (button.onclickArguments !== undefined) && (button.onclickArguments !== null) ){
            args = button.onclickArguments.constructor === Array ? button.onclickArguments : [button.onclickArguments];
          } else if (button.onclickArguments === null){
            args = [null];
          }
          button.onclick.apply(undefined, args);
          $button.on("click", function(e){
            e.stopPropagation();
            button.onclick.apply(undefined, args);
            if (button.closeDialog === true){
              _box.close(args);
            }
          });
        // else close the dialog box and return button.onclick as value
        } else {
          $button.on("click", function(e){
            e.stopPropagation();
            _box.close(button.onclick);
          })
        }
      }
      
      
      
      // auto show
      if (dialog.options.autoShow){
        dialog.show();
      }


      return dialog;

    }
    
    /***************************
    *       end dialog
    ***************************/
    
    
    // bind center current dialog on resize
    
    $(window).resize(function(){
      requestAnimationFrame(function(){
        if ($.dialogs.current !== undefined){
          $.dialogs.current.centerPosition();
        }
      });
    })
    
  }

  
  


  $.dialogs.alert = function(){
    return new Dialog({
      title: "Prova", 
      message: "Testo di prova numero 1",
      buttons: [
        {
          text: "Ok", 
          onclick: function(e){
            console.log(e);
            this.close();
          }
        }
      ]
    });
  }
  
  
  
  
  
  // get name for transition end event name based on browser
  
  function transitionEndEventName() {
      var i,
          undefined,
          el = document.createElement('div'),
          transitions = {
              'transition':'transitionend',
              'OTransition':'otransitionend',  // oTransitionEnd in very old Opera
              'MozTransition':'transitionend',
              'WebkitTransition':'webkitTransitionEnd'
          };

      for (i in transitions) {
          if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
              return transitions[i];
          }
      }

      //TODO: throw 'TransitionEnd event is not supported in this browser';
  }
  
  
  
  
  // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
  
  var lastTime = 0;
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame){
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { 
        callback(currTime + timeToCall);
      },  timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };
  }

  if (!window.cancelAnimationFrame){
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
  }
  
  // end requestAnimationFrame polyfill
  
  
  
})(jQuery)
