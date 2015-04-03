/*    
*     jQuery Dialogs
*     
*     
*     support ie9+, TODO ff, TODO chrome
* 
*/


// dialogs object
/*
*     dialogs.options             current default options
*     dialogs.updateOptions       function(options) -> accepts an object as argument
*     dialogs.all                 array containing each dialog object
*     dialogs.visible             boolean, true if at least a dialog is opened
*     dialogs.active              returns the current active dialog object or undefined if no dialog has been opened
*     dialogs.closeAll            close all opened dialogs
*
*     // preset dialogs
*
*     dialogs.alert(title, message, callback())                       simple alert dialog box, callback function is called when user closes the dialog by clicking the "ok" button
*     dialog.confirm(title, message, callback(res))                   simple confirm dialog box, callback is invoked with an argument that is true if user clicks "ok" and false otherwise
*     dialogs.prompt(title, message, inputValue, callback(res))       simple prompt dialog box, callback is invoked with an argument equal to the input's value, null if the value clicks cancel
*     
*/




// callbacks
/*

beforeShow
afterShow
beforeClose
afterClose


*/



(function($){
  
  window.dialogs = {};
  
  // options
  dialogs.options = {
    bodyClass: "dialog-open",       // body class when opening a dialog, used to prevent scroll with overflow: hidden
    dialogClass: "",                // custom additional class to all dialogues
    closeOnClickOverlay: true,      // close when clicking on the overlay
    destroyOnClose: true,           // destroy button reference after closing it, cannot use the show() to make it appear again
    showOnInit: true,               // show the dialog right after initializing it
    focusOnClick: true              // when multiple dialogs are opened, the user can focus on a particular dialog by clicking it
  };
  
  var $body;
  var $overlay;
  
  // update options
  dialogs.updateOptions = function(newOptions){
    if ( typeof newOptions === 'object' ){
      $.extend(dialogs.options, newOptions);
    }
  }
  
  
  // array containing all opened dialog objects
  dialogs.all = [];
  
  // returns true if at lest a dialog is visible
  dialogs.visible = function(){
    for (var i = 0; i < dialogs.all.length; i++){
      if ( dialogs.all[i].visible ) return true;
    }
    return false;
  }
  
  
  // current active dialog object
  dialogs.active;
  
  // close all dialogs
  dialogs.closeAll = function(){
    for (var i = 0; dialogs.all.length; i++){
      dialogs.all[i].close();
    }
  }
  
  
  
  // alert dialog
  dialogs.alert = function(title, message, callback){
    if (!typeof title === 'string') title = undefined;
    if ( (typeof message !== 'string') && (typeof message === 'function') ){
      message = undefined;
      callback = message;
    }
    var options = {
      title: title,
      message: message,
      buttons: [
        {text: "Ok", onclick: callback, closeDialog: true}
      ]
    }
    options = $.extend(dialogs.options, options);
    return new DialogBox(options);
  }
  
  
  // confirm dialog
  dialogs.confirm = function(title, message, callback){
    if (!typeof title === 'string') title = undefined;
    if ( (typeof message !== 'string') && (typeof message === 'function') ){
      message = undefined;
      callback = message;
    }
    var options = {
      title: title,
      message: message,
      buttons: [
        {text: "Cancel", onclick: callback, onclickArguments: false, closeDialog: true},
        {text: "Ok", onclick: callback, onclickArguments: true, closeDialog: true}
      ]
    }
    options = $.extend(dialogs.options, options);
    return new DialogBox(options);
  }
  
  
  // prompt dialog
  dialogs.prompt = function(title, message, defaultValue, callback){
    if (typeof title !== 'string') title = undefined;
    
    if ( (typeof message !== 'string') && (typeof message === 'function') ){
      console.log("message function"),
      callback = message;
      message = undefined;
    }
    
    if ( (typeof defaultValue !== 'string') && (typeof defaultValue === 'function') ){
      console.log("Default value function"),
      callback = defaultValue;
      defaultValue = "";
    }
    
    var options = {
      title: title,
      message: message,
      buttons: [
        {text: "Cancel", onclick: callback, onclickArguments: null, closeDialog: true},
        {text: "Ok", onclick: callback, onclickArguments: true, closeDialog: true}
      ]
    }
    options = $.extend(dialogs.options, options);
    return new DialogBox(options);
  }
  
  
  
  // dialog constructor
  /*
  *     public functions
  *
  *     show()
  *     close()
  *     setMain()
  *     setSecondary()
  *     update()
  *
  */
  
  
  function DialogBox(options){
    
    // init
    var _box = this;
    var onTransitionEndCallback;
    _box.options = options;
    _box.visible = false;
    
    var $title;
    var $message;
    var destroyBox = false; // if set to true destroy this dialog after close
    
    // basic dialog box
    var $dialog = $("<div class='jq-dialog " + _box.options.dialogClass + "'></div>");
    
    initializeTexts();
    
    // buttons
    var $actions = $("<div class='jq-dialog-actions'></div>");
    $dialog.append($actions);
    createButtons();
    
    
    // public functions
    _box.show = function(){
      fireCallback(_box.options.beforeShow);
      $body.append($dialog).addClass(options.bodyClass);
      $overlay.show();
      $dialog.css("opacity");             // access css to reflow and enable transition when adding class below
      $dialog.addClass("visible");
      _box.visible = true;
      _box.setMain();
      onTransitionEndCallback = ["afterShow"];
    }
    

    _box.close = function(callbackArgument){
      fireCallback(_box.options.beforeClose, callbackArgument);
      if (_box.options.destroyOnClose){
        destroyBox = true;        
      }
            
      // set new active if this dialog is the active one
      if (dialogs.active === _box){
        _box.setSecondary();
        
        for (var i = 0; i < dialogs.all.length; i++){
          if ( (dialogs.all[i] !== _box) && dialogs.all[i].visible) dialogs.all[i].setMain();
        }
      }
      
      $dialog.removeClass("visible");
      _box.visible = false;
      
      if (!dialogs.visible()){
        $overlay.hide();
        $body.removeClass(options.bodyClass);
      }
      
      onTransitionEndCallback = ["afterClose", callbackArgument];
    }
    
    
    _box.setMain = function(){
      if (dialogs.active !== undefined){
        dialogs.active.setSecondary();
      }
      dialogs.active = _box;
      $dialog.addClass("active");
    }
    
    
    _box.setSecondary = function(){
      $dialog.removeClass("active");
      dialogs.active = undefined;
    }
    
    
    _box.update = function(options){
      $.extend(_box.options, options);
      // remove and recreate texts
      
      if (typeof $title !== 'string'){
        $title.remove();
      }
      if (typeof $message !== 'string'){
        $message.remove();
      }
      initializeTexts();

      // recreate buttons
      $actions.empty();
      createButtons();
    }
    
    
    _box.destroy = function(){
      if (_box.visible) _box.close();
      // remove from all array
      if (dialogs.all.indexOf(_box) !== -1){
        dialogs.all.splice(dialogs.all.indexOf(_box), 1);
      }
      $dialog.remove();
      _box = undefined;
    }
    // end public functions    
    
    
    // fire callback after transitions are ended
    $dialog.on(transitionEndEventName(), function(){
      if (typeof onTransitionEndCallback === 'object' && onTransitionEndCallback.constructor === Array){
        var callbackName = onTransitionEndCallback.shift();
        var callback = _box.options[callbackName];
        var args = [callback].concat(onTransitionEndCallback);
        
        if (typeof callback === 'function'){
          fireCallback.apply(undefined, args);
        }
        if ( (callbackName === 'afterClose') && ( destroyBox ) ){
          _box.destroy();
        }
      }
      onTransitionEndCallback = undefined;
    })
    
    
    // fill texts (title and message) if defined
    function initializeTexts(){
      // title
      if (typeof _box.options.title === 'string'){
        $title = $("<div class='jq-dialog-title'>" + _box.options.title + "</div>");
      } else {
        $title = "";
      }
      // message
      if (typeof _box.options.message === 'string'){
        $message = $("<div class='jq-dialog-message'>" + _box.options.message + "</div>");
      } else {
        $message = "";
      }
      
      $dialog.prepend($message).prepend($title);
    }
    
    // creates action buttons
    function createButtons(){
      var buttons = _box.options.buttons;
      if (typeof buttons === 'object' && buttons.constructor === Array){
        for (var i = 0; i < buttons.length; i++){
          var button = buttons[i];
          bindbuttonClick(button);
        }
      }
    }
    
    // bind each action button
    function bindbuttonClick(button){
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
    if (options.showOnInit){
      _box.show();
    }
    // bind focus on click
    $dialog.click(function(e){
      if ( _box.options.focusOnClick && ( dialogs.active !== _box ) ){
        // e.stopPropagation();
        _box.setMain();
      }
    })
    // add this dialog to all dialogs array
    dialogs.all.push(_box);
    
    
    return _box;
  }
  
  // end dialog constructor
  
  
  
  // initializations on document ready
  $(function(){
    $body = $("body")
    $overlay = $body.find(".dialogs-overlay");
    if ($overlay.length === 0){
      $overlay = $("<div class='dialogs-overlay' style='display: none;'></div>");
      $body.append($overlay);
    }
  })
  
  
  
  //// fires callbacks
  
  function fireCallback(){
    var func = arguments[0];
    if ( typeof(func) === "function" ){
      var args = [];
      for (var i = 1; i < arguments.length; i++){
        args.push(arguments[i]);
      }
      func.apply(undefined, args);
    }
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
  
})(jQuery)