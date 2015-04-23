(function($, DX, undefined) {
    var translator = DX.translator,
        fx = DX.fx,
        VIEW_OFFSET = 40,
        NAVIGATION_MAX_WIDTH = 300,
        NAVIGATION_TOGGLE_DURATION = 400;
    DX.framework.html.SlideOutController = DX.framework.html.DefaultLayoutController.inherit({
        ctor: function(options) {
            options = options || {};
            options.name = options.name || "slideout";
            this.swipeEnabled = options.swipeEnabled === undefined ? true : options.swipeEnabled;
            this.callBase(options)
        },
        _createNavigationWidget: function() {
            this.$slideOut = $("<div data-bind='dxSlideOut: {  menuItemTemplate: $(\"#slideOutMenuItemTemplate\") }'></div>").dxCommandContainer({id: 'global-navigation'});
            this._applyTemplate(this.$slideOut, this._layoutModel);
            this.callBase();
            this.slideOut = this.$slideOut.dxSlideOut("instance");
            this.slideOut.option("swipeEnabled", this.swipeEnabled);
            this.$slideOut.find(".dx-slideout-item-container").append(this._$mainLayout);
            return this.$slideOut
        },
        _renderNavigationImpl: function(navigationCommands) {
            var container = this.$slideOut.dxCommandContainer("instance");
            this._commandManager.renderCommandsToContainers(navigationCommands, [container])
        },
        _getRootElement: function() {
            return this.$slideOut
        },
        init: function(options) {
            this.callBase(options);
            this._navigationManager = options.navigationManager;
            this._navigatingHandler = $.proxy(this._onNavigating, this)
        },
        activate: function() {
            var result = this.callBase.apply(this, arguments);
            this._navigationManager.on("navigating", this._navigatingHandler);
            return result
        },
        deactivate: function() {
            this._navigationManager.navigating.remove(this._navigatingHandler);
            return this.callBase.apply(this, arguments)
        },
        _onNavigating: function(args) {
            var that = this;
            if (this.slideOut.option("menuVisible"))
                args.navigateWhen.push(this._toggleNavigation().done(function() {
                    that._disableTransitions = true
                }))
        },
        _onViewShown: function(viewInfo) {
            this._refreshVisibility();
            this._disableTransitions = false
        },
        _refreshVisibility: function() {
            if (DX.devices.real().platform === "android") {
                this.$slideOut.css("backface-visibility", "hidden");
                this.$slideOut.css("backface-visibility");
                this.$slideOut.css("backface-visibility", "visible")
            }
        },
        _isPlaceholderEmpty: function(viewInfo) {
            var $markup = viewInfo.renderResult.$markup;
            var toolbar = $markup.find(".layout-toolbar").data("dxToolbar");
            var items = toolbar.option("items");
            var backCommands = $.grep(items, function(item) {
                    return (item.behavior === "back" || item.id === "back") && item.visible === true
                });
            return !backCommands.length
        },
        _onRenderComplete: function(viewInfo) {
            var that = this;
            that._initNavigation(viewInfo.renderResult.$markup);
            if (that._isPlaceholderEmpty(viewInfo))
                that._initNavigationButton(viewInfo.renderResult.$markup);
            var $content = viewInfo.renderResult.$markup.find(".layout-content"),
                $appbar = viewInfo.renderResult.$markup.find(".layout-toolbar-bottom"),
                appbar = $appbar.data("dxToolbar");
            if (appbar) {
                that._refreshAppbarVisibility(appbar, $content);
                appbar.on("optionChanged", function(args) {
                    if (args.name === "items")
                        that._refreshAppbarVisibility(appbar, $content)
                })
            }
        },
        _refreshAppbarVisibility: function(appbar, $content) {
            var isAppbarNotEmpty = false;
            $.each(appbar.option("items"), function(index, item) {
                if (item.visible) {
                    isAppbarNotEmpty = true;
                    return false
                }
            });
            $content.toggleClass("has-toolbar-bottom", isAppbarNotEmpty);
            appbar.option("visible", isAppbarNotEmpty)
        },
        _initNavigationButton: function($markup) {
            var that = this,
                $toolbar = $markup.find(".layout-toolbar"),
                toolbar = $toolbar.data("dxToolbar");
            var initNavButton = function() {
                    toolbar.option("items[0].visible", true);
                    $toolbar.find(".nav-button").data("dxButton").option("onClick", $.proxy(that._toggleNavigation, that, $markup))
                };
            initNavButton();
            toolbar.on("contentReady", function(args) {
                initNavButton()
            })
        },
        _initNavigation: function($markup) {
            this._isNavigationVisible = false
        },
        _toggleNavigation: function($markup) {
            return this.slideOut.toggleMenuVisibility()
        }
    });
    var layoutSets = DX.framework.html.layoutSets;
    layoutSets["slideout"] = layoutSets["slideout"] || [];
    layoutSets["slideout"].push({
        platform: "ios",
        controller: new DX.framework.html.SlideOutController
    });
    layoutSets["slideout"].push({
        platform: "android",
        controller: new DX.framework.html.SlideOutController
    });
    layoutSets["slideout"].push({
        platform: "tizen",
        controller: new DX.framework.html.SlideOutController
    });
    layoutSets["slideout"].push({
        platform: "generic",
        controller: new DX.framework.html.SlideOutController
    });
    layoutSets["slideout"].push({
        platform: "win8",
        phone: true,
        controller: new DX.framework.html.SlideOutController
    })
})(jQuery, DevExpress);