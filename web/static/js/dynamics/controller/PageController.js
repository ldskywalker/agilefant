
window.pageController = null;

/**
 * The topmost controller on the page.
 * 
 * @constructor
 */
var PageController = function(currentUserJson) {
  if (currentUserJson) {
    this.currentUser = ModelFactory.updateObject(currentUserJson);
  }
  this._init();
};

/**
 * Initialize a page controller.
 */
PageController.initialize = function(currentUserJson) {
  window.pageController = new PageController(currentUserJson);
};

PageController.prototype._init = function() {
  var me = this;
  $('#menuToggleControl').click(function() {
    me.toggleMenu();
  });
  if($.cookie("agilefantMenuClosed")) {
    me.toggleMenu();
  }
  $('#menuRefreshControl').click(function() {
    me.refreshMenu();
  });
};

/**
 * Gets the current instance of page controller.
 * <p>
 * Returns <code>null</code> if not set.
 */
PageController.getInstance = function() {
  return window.pageController;
};

/**
 * Refresh the menu.
 * <p>
 * Calls <code>window.menuController.reload</code>.
 * If <code>window.menuController</code> is not set, does nothing.
 */
PageController.prototype.refreshMenu = function() {
  if (window.menuController) {
    window.menuController.reload();
  }
};

/**
 * Refresh the content.
 */
PageController.prototype.refreshContent = function() {
  ModelFactory.reloadRoot();
};

/**
 * Get the currently logged in user.
 */
PageController.prototype.getCurrentUser = function() {
  return this.currentUser;
};

/**
 * Toggle the hiding and showing of the left hand menu.
 */
PageController.prototype.toggleMenu = function() {
  var wrapper = $('#outerWrapper');
  var isClosed = wrapper.hasClass("menu-collapsed");
  wrapper.toggleClass('menu-collapsed');
  this._updateMenuCookie(isClosed);
  $(window).resize();
  return false;
};

PageController.prototype._updateMenuCookie = function(isClosed) {
  if (isClosed) {
    $.cookie("agilefantMenuClosed", null);
  }
  else {
    $.cookie("agilefantMenuClosed", true);
  }
};

/**
 * Listen to all events from <code>ModelFactory</code>.
 */
PageController.prototype.pageListener = function(event) {
  
};


/*
 * PAGE-WIDE CONFIGURATIONS.
 */

var Configuration = {};
Configuration.options = {};

Configuration.setConfiguration = function(newConfig) {
  Configuration.options = newConfig;
};

Configuration.isTimesheetsEnabled = function() {
  return Configuration.options.timesheets;
};