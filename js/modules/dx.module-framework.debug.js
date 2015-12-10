/*! 
* DevExtreme (Single Page App Framework)
* Version: 15.2.4
* Build date: Dec 8, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!window.DevExpress || !DevExpress.MOD_FRAMEWORK) {
    if (!window.DevExpress || !DevExpress.MOD_CORE)
        throw Error('Required module is not referenced: core');
    /*! Module framework, file framework.js */
    (function($, DX, undefined) {
        var KoTemplateProvider = DX.require("/integration/knockout/ko.templateProvider");
        var mergeWithReplace = function(targetArray, arrayToMerge, needReplaceFn) {
                var result = [];
                for (var i = 0, length = targetArray.length; i < length; i++)
                    if (!needReplaceFn(targetArray[i], arrayToMerge))
                        result.push(targetArray[i]);
                result.push.apply(result, arrayToMerge);
                return result
            };
        var prepareCommandToReplace = function(targetCommand, commandsToMerge) {
                var needToReplace = false;
                $.each(commandsToMerge, function(_, commandToMerge) {
                    var idEqual = targetCommand.option("id") === commandToMerge.option("id") && commandToMerge.option("id"),
                        behaviorEqual = targetCommand.option("behavior") === commandToMerge.option("behavior") && targetCommand.option("behavior");
                    needToReplace = idEqual || behaviorEqual;
                    if (behaviorEqual && commandToMerge.option("onExecute") === null)
                        commandToMerge.option("onExecute", targetCommand.option("onExecute"));
                    if (needToReplace) {
                        targetCommand.element().remove();
                        return false
                    }
                });
                return needToReplace
            };
        var mergeCommands = function(targetCommands, commandsToMerge) {
                return mergeWithReplace(targetCommands, commandsToMerge, prepareCommandToReplace)
            };
        var resolvePropertyValue = function(command, containerOptions, propertyName, defaultValue) {
                var containerOption = containerOptions ? containerOptions[propertyName] : undefined,
                    defaultOption = containerOption === undefined ? defaultValue : containerOption,
                    commandOption = command.option(propertyName);
                return commandOption === undefined || commandOption === defaultValue ? defaultOption : commandOption
            };
        var resolveTextValue = function(command, containerOptions) {
                var showText = resolvePropertyValue(command, containerOptions, "showText"),
                    hasIcon = !!command.option("icon"),
                    titleValue = resolvePropertyValue(command, containerOptions, "title", "");
                return showText || !hasIcon ? titleValue : ""
            };
        var resolveIconValue = function(command, containerOptions) {
                var showIcon = resolvePropertyValue(command, containerOptions, "showIcon"),
                    hasText = !!command.option("title"),
                    iconValue = resolvePropertyValue(command, containerOptions, "icon", "");
                return showIcon || !hasText ? iconValue : ""
            };
        DX.framework = {
            utils: {
                mergeCommands: mergeCommands,
                commandToContainer: {
                    resolveIconValue: resolveIconValue,
                    resolveTextValue: resolveTextValue,
                    resolvePropertyValue: resolvePropertyValue
                }
            },
            templateProvider: KoTemplateProvider
        }
    })(jQuery, DevExpress);
    /*! Module framework, file framework.errors.js */
    DevExpress.define("/framework/framework.errors", ["/utils/utils.error", "/errors"], function(errorUtils, errors) {
        return errorUtils(errors.ERROR_MESSAGES, {
                E3001: "Routing rule is not found for the '{0}' URI.",
                E3002: "The passed object cannot be formatted into a URI string by the application's router. An appropriate route should be registered.",
                E3003: "Unable to navigate. Application is being initialized.",
                E3004: "Cannot execute the command: {0}.",
                E3005: "The '{0}' command {1} is not registered in the application's command mapping. Go to http://dxpr.es/1bTjfj1 for more details.",
                E3006: "Unknown navigation target: '{0}'. Use the 'current', 'back' or 'blank' values.",
                E3007: "Error while restoring the application state. The state has been cleared. Refresh the page.",
                E3008: "Unable to go back.",
                E3009: "Unable to go forward.",
                E3010: "The command's 'id' option should be specified.\r\nProcessed markup: {0}\n",
                E3011: "Layout controller cannot be resolved. There are no appropriate layout controllers for the current context. Check browser console for details.",
                E3012: "Layout controller cannot be resolved. Two or more layout controllers suit the current context. Check browser console for details.",
                E3013: "The '{0}' template with the '{1}' name is not found. Make sure the case is correct in the specified view name and the template fits the current context.",
                E3014: "All the children of the dxView element should be either of the dxCommand or dxContent type.\r\nProcessed markup: {0}",
                E3015: "The 'exec' method should be called before the 'finalize' method.",
                E3016: "Unknown transition type '{0}'.",
                E3018: "Unable to parse options.\nMessage: {0};\nOptions value: {1}.",
                E3019: "View templates should be updated according to the 13.1 changes. Go to http://dxpr.es/15ikrJA for more details.",
                E3020: "Concurrent templates are found:\r\n{0}Target device:\r\n{1}.",
                E3021: "Remote template cannot be loaded.\r\nUrl:{0}\r\nError:{1}.",
                E3022: "Cannot initialize the HtmlApplication component.",
                E3023: "Navigation item is not found",
                E3024: "Layout controller is not initialized",
                W3001: "A view with the '{0}' key doesn't exist.",
                W3002: "A view with the '{0}' key has already been released.",
                W3003: "Layout resolving context:\n{0}\nAvailable layout controller registrations:\n{1}\n",
                W3004: "Layout resolving context:\n{0}\nConcurent layout controller registrations for the context:\n{1}\n",
                W3005: "Direct hash-based navigation is detected in a mobile application. Use data-bind=\"dxAction: url\" instead of href=\"#url\" to avoid navigation issues.\nFound markup:\n{0}\n"
            })
    });
    /*! Module framework, file framework.routing.js */
    (function($, DX) {
        var JSON_URI_PREFIX = encodeURIComponent("json:");
        var Class = DevExpress.require("/class");
        DX.framework.Route = Class.inherit({
            _trimSeparators: function(str) {
                return str.replace(/^[\/.]+|\/+$/g, "")
            },
            _escapeRe: function(str) {
                return str.replace(/\W/g, "\\$1")
            },
            _checkConstraint: function(param, constraint) {
                param = String(param);
                if (typeof constraint === "string")
                    constraint = new RegExp(constraint);
                var match = constraint.exec(param);
                if (!match || match[0] !== param)
                    return false;
                return true
            },
            _ensureReady: function() {
                var that = this;
                if (this._patternRe)
                    return false;
                this._pattern = this._trimSeparators(this._pattern);
                this._patternRe = "";
                this._params = [];
                this._segments = [];
                this._separators = [];
                this._pattern.replace(/[^\/]+/g, function(segment, index) {
                    that._segments.push(segment);
                    if (index)
                        that._separators.push(that._pattern.substr(index - 1, 1))
                });
                $.each(this._segments, function(index) {
                    var isStatic = true,
                        segment = this,
                        separator = index ? that._separators[index - 1] : "";
                    if (segment.charAt(0) === ":") {
                        isStatic = false;
                        segment = segment.substr(1);
                        that._params.push(segment);
                        that._patternRe += "(?:" + separator + "([^/]*))";
                        if (segment in that._defaults)
                            that._patternRe += "?"
                    }
                    else
                        that._patternRe += separator + that._escapeRe(segment)
                });
                this._patternRe = new RegExp("^" + this._patternRe + "$")
            },
            ctor: function(pattern, defaults, constraints) {
                this._pattern = pattern || "";
                this._defaults = defaults || {};
                this._constraints = constraints || {}
            },
            parse: function(uri) {
                var that = this;
                this._ensureReady();
                var matches = this._patternRe.exec(uri);
                if (!matches)
                    return false;
                var result = $.extend({}, this._defaults);
                $.each(this._params, function(i) {
                    var index = i + 1;
                    if (matches.length >= index && matches[index])
                        result[this] = that.parseSegment(matches[index])
                });
                $.each(this._constraints, function(key) {
                    if (!that._checkConstraint(result[key], that._constraints[key])) {
                        result = false;
                        return false
                    }
                });
                return result
            },
            format: function(routeValues) {
                var that = this,
                    query = "";
                this._ensureReady();
                var mergeValues = $.extend({}, this._defaults),
                    useStatic = 0,
                    ret = [],
                    dels = [],
                    unusedRouteValues = {};
                $.each(routeValues, function(paramName, paramValue) {
                    routeValues[paramName] = that.formatSegment(paramValue);
                    if (!(paramName in mergeValues))
                        unusedRouteValues[paramName] = true
                });
                $.each(this._segments, function(index, segment) {
                    ret[index] = index ? that._separators[index - 1] : '';
                    if (segment.charAt(0) === ':') {
                        var paramName = segment.substr(1);
                        if (!(paramName in routeValues) && !(paramName in that._defaults)) {
                            ret = null;
                            return false
                        }
                        if (paramName in that._constraints && !that._checkConstraint(routeValues[paramName], that._constraints[paramName])) {
                            ret = null;
                            return false
                        }
                        if (paramName in routeValues) {
                            if (routeValues[paramName] !== undefined) {
                                mergeValues[paramName] = routeValues[paramName];
                                ret[index] += routeValues[paramName];
                                useStatic = index
                            }
                            delete unusedRouteValues[paramName]
                        }
                        else if (paramName in mergeValues) {
                            ret[index] += mergeValues[paramName];
                            dels.push(index)
                        }
                    }
                    else {
                        ret[index] += segment;
                        useStatic = index
                    }
                });
                $.each(mergeValues, function(key, value) {
                    if (!!value && $.inArray(":" + key, that._segments) === -1 && routeValues[key] !== value) {
                        ret = null;
                        return false
                    }
                });
                var unusedCount = 0;
                if (!$.isEmptyObject(unusedRouteValues)) {
                    query = "?";
                    $.each(unusedRouteValues, function(key) {
                        query += key + "=" + routeValues[key] + "&";
                        unusedCount++
                    });
                    query = query.substr(0, query.length - 1)
                }
                if (ret === null)
                    return false;
                if (dels.length)
                    $.map(dels, function(i) {
                        if (i >= useStatic)
                            ret[i] = ''
                    });
                var path = ret.join('');
                path = path.replace(/\/+$/, "");
                return {
                        uri: path + query,
                        unusedCount: unusedCount
                    }
            },
            formatSegment: function(value) {
                if ($.isArray(value) || $.isPlainObject(value))
                    return JSON_URI_PREFIX + encodeURIComponent(JSON.stringify(value));
                return encodeURIComponent(value)
            },
            parseSegment: function(value) {
                if (value.substr(0, JSON_URI_PREFIX.length) === JSON_URI_PREFIX)
                    try {
                        return $.parseJSON(decodeURIComponent(value.substr(JSON_URI_PREFIX.length)))
                    }
                    catch(x) {}
                return decodeURIComponent(value)
            }
        });
        DX.framework.Router = Class.inherit({
            ctor: function() {
                this._registry = []
            },
            _trimSeparators: function(str) {
                return str.replace(/^[\/.]+|\/+$/g, "")
            },
            _createRoute: function(pattern, defaults, constraints) {
                return new DX.framework.Route(pattern, defaults, constraints)
            },
            register: function(pattern, defaults, constraints) {
                this._registry.push(this._createRoute(pattern, defaults, constraints))
            },
            _parseQuery: function(query) {
                var result = {},
                    values = query.split("&");
                $.each(values, function(index, value) {
                    var keyValuePair = value.split("=");
                    result[keyValuePair[0]] = decodeURIComponent(keyValuePair[1])
                });
                return result
            },
            parse: function(uri) {
                var that = this,
                    ret;
                uri = this._trimSeparators(uri);
                var parts = uri.split("?", 2),
                    path = parts[0],
                    query = parts[1];
                $.each(this._registry, function() {
                    var result = this.parse(path);
                    if (result !== false) {
                        ret = result;
                        if (query)
                            ret = $.extend(ret, that._parseQuery(query));
                        return false
                    }
                });
                return ret ? ret : false
            },
            format: function(obj) {
                var ret = false,
                    minUnusedCount = 99999;
                obj = obj || {};
                $.each(this._registry, function() {
                    var toFormat = $.extend(true, {}, obj);
                    var result = this.format(toFormat);
                    if (result !== false)
                        if (minUnusedCount > result.unusedCount) {
                            minUnusedCount = result.unusedCount;
                            ret = result.uri
                        }
                });
                return ret
            }
        });
        DX.framework.Route.__internals = {JSON_URI_PREFIX: JSON_URI_PREFIX}
    })(jQuery, DevExpress);
    /*! Module framework, file framework.command.js */
    (function($, DX) {
        var errors = DevExpress.require("/framework/framework.errors"),
            registerComponent = DX.require("/componentRegistrator"),
            DOMComponent = DX.require("/domComponent");
        var Command = DOMComponent.inherit({
                ctor: function(element, options) {
                    if ($.isPlainObject(element)) {
                        options = element;
                        element = $("<div />")
                    }
                    this.callBase(element, options)
                },
                _setDeprecatedOptions: function() {
                    this.callBase();
                    $.extend(this._deprecatedOptions, {iconSrc: {
                            since: "15.1",
                            alias: "icon"
                        }})
                },
                _getDefaultOptions: function() {
                    return $.extend(this.callBase(), {
                            onExecute: null,
                            id: null,
                            title: "",
                            icon: "",
                            visible: true,
                            disabled: false,
                            renderStage: "onViewShown"
                        })
                },
                execute: function() {
                    var isDisabled = this._options.disabled;
                    if ($.isFunction(isDisabled))
                        isDisabled = !!isDisabled.apply(this, arguments);
                    if (isDisabled)
                        throw errors.Error("E3004", this._options.id);
                    this.fireEvent("beforeExecute", arguments);
                    this._createActionByOption("onExecute").apply(this, arguments);
                    this.fireEvent("afterExecute", arguments)
                },
                _render: function() {
                    this.callBase();
                    this.element().addClass("dx-command")
                },
                _renderDisabledState: $.noop,
                _dispose: function() {
                    this.callBase();
                    this.element().removeData(this.NAME)
                }
            });
        registerComponent("dxCommand", DX.framework, Command)
    })(jQuery, DevExpress);
    /*! Module framework, file framework.commandMapping.js */
    (function($, DX) {
        var Class = DevExpress.require("/class"),
            errors = DevExpress.require("/framework/framework.errors");
        DX.framework.CommandMapping = Class.inherit({
            ctor: function() {
                this._commandMappings = {};
                this._containerDefaults = {}
            },
            setDefaults: function(containerId, defaults) {
                this._containerDefaults[containerId] = defaults;
                return this
            },
            mapCommands: function(containerId, commandMappings) {
                var that = this;
                $.each(commandMappings, function(index, commandMapping) {
                    if (typeof commandMapping === "string")
                        commandMapping = {id: commandMapping};
                    var commandId = commandMapping.id;
                    var mappings = that._commandMappings[containerId] || {};
                    mappings[commandId] = $.extend({
                        showIcon: true,
                        showText: true
                    }, that._containerDefaults[containerId] || {}, commandMapping);
                    that._commandMappings[containerId] = mappings
                });
                this._initExistingCommands();
                return this
            },
            unmapCommands: function(containerId, commandIds) {
                var that = this;
                $.each(commandIds, function(index, commandId) {
                    var mappings = that._commandMappings[containerId] || {};
                    if (mappings)
                        delete mappings[commandId]
                });
                this._initExistingCommands()
            },
            getCommandMappingForContainer: function(commandId, containerId) {
                return (this._commandMappings[containerId] || {})[commandId]
            },
            checkCommandsExist: function(commands) {
                var that = this,
                    result = $.grep(commands, function(commandName, index) {
                        return $.inArray(commandName, that._existingCommands) < 0 && $.inArray(commandName, commands) === index
                    });
                if (result.length !== 0)
                    throw errors.Error("E3005", result.join("', '"), result.length === 1 ? " is" : "s are");
            },
            load: function(config) {
                if (!config)
                    return;
                var that = this;
                $.each(config, function(name, container) {
                    that.setDefaults(name, container.defaults);
                    that.mapCommands(name, container.commands)
                });
                return this
            },
            _initExistingCommands: function() {
                var that = this;
                this._existingCommands = [];
                $.each(that._commandMappings, function(name, _commands) {
                    $.each(_commands, function(index, command) {
                        if ($.inArray(command.id, that._existingCommands) < 0)
                            that._existingCommands.push(command.id)
                    })
                })
            }
        });
        DX.framework.CommandMapping.defaultMapping = {
            "global-navigation": {
                defaults: {
                    showIcon: true,
                    showText: true
                },
                commands: []
            },
            "ios-header-toolbar": {
                defaults: {
                    showIcon: false,
                    showText: true,
                    location: "after"
                },
                commands: ["edit", "save", {
                        id: "back",
                        location: "before"
                    }, {
                        id: "cancel",
                        location: "before"
                    }, {
                        id: "create",
                        showIcon: true,
                        showText: false
                    }]
            },
            "ios-action-sheet": {
                defaults: {
                    showIcon: false,
                    showText: true
                },
                commands: []
            },
            "ios-view-footer": {
                defaults: {
                    showIcon: false,
                    showText: true
                },
                commands: [{
                        id: "delete",
                        type: "danger"
                    }]
            },
            "android-header-toolbar": {
                defaults: {
                    showIcon: true,
                    showText: false,
                    location: "after"
                },
                commands: [{
                        id: "back",
                        showIcon: false,
                        location: "before"
                    }, "create", {
                        id: "save",
                        showText: true,
                        showIcon: false,
                        location: "after"
                    }, {
                        id: "edit",
                        showText: false,
                        location: "after"
                    }, {
                        id: "cancel",
                        showText: false,
                        location: "before"
                    }, {
                        id: "delete",
                        showText: false,
                        location: "after"
                    }]
            },
            "android-simple-toolbar": {
                defaults: {
                    showIcon: true,
                    showText: false,
                    location: "after"
                },
                commands: [{
                        id: "back",
                        showIcon: false,
                        location: "before"
                    }, {id: "create"}, {
                        id: "save",
                        showText: true,
                        showIcon: false,
                        location: "after"
                    }, {
                        id: "edit",
                        showText: false,
                        location: "after"
                    }, {
                        id: "cancel",
                        showText: false,
                        location: "before"
                    }, {
                        id: "delete",
                        showText: false,
                        location: "after"
                    }]
            },
            "android-footer-toolbar": {
                defaults: {location: "after"},
                commands: [{
                        id: "create",
                        showText: false,
                        location: "center"
                    }, {
                        id: "edit",
                        showText: false,
                        location: "before"
                    }, {
                        id: "delete",
                        location: "menu"
                    }, {
                        id: "save",
                        showIcon: false,
                        location: "before"
                    }]
            },
            "generic-header-toolbar": {
                defaults: {
                    showIcon: false,
                    showText: true,
                    location: "after"
                },
                commands: ["edit", "save", {
                        id: "back",
                        location: "before"
                    }, {
                        id: "cancel",
                        location: "before"
                    }, {
                        id: "create",
                        showIcon: true,
                        showText: false
                    }]
            },
            "generic-view-footer": {
                defaults: {
                    showIcon: false,
                    showText: true
                },
                commands: [{
                        id: "delete",
                        type: "danger"
                    }]
            },
            "win8-appbar": {
                defaults: {location: "after"},
                commands: ["edit", "cancel", "save", "delete", {
                        id: "create",
                        location: "before"
                    }, {
                        id: "refresh",
                        location: "before"
                    }]
            },
            "win8-toolbar": {
                defaults: {
                    showText: false,
                    location: "before"
                },
                commands: [{id: "previousPage"}]
            },
            "win8-phone-appbar": {
                defaults: {location: "center"},
                commands: ["create", "edit", "cancel", "save", "refresh", {
                        id: "delete",
                        location: "menu"
                    }]
            },
            "win8-split-toolbar": {
                defaults: {
                    showIcon: true,
                    showText: false,
                    location: "after"
                },
                commands: [{
                        id: "back",
                        showIcon: false,
                        location: "before"
                    }, {id: "create"}, {
                        id: "save",
                        showText: true,
                        location: "before"
                    }, {
                        id: "edit",
                        showText: true,
                        location: "menu"
                    }, {
                        id: "cancel",
                        showText: true,
                        location: "menu"
                    }, {
                        id: "delete",
                        showText: true,
                        location: "menu"
                    }]
            },
            "win8-master-detail-toolbar": {
                defaults: {
                    showText: false,
                    location: "before"
                },
                commands: ["back"]
            },
            "desktop-toolbar": {
                defaults: {
                    showIcon: false,
                    showText: true,
                    location: "after"
                },
                commands: ["cancel", "create", "edit", "save", {
                        id: "delete",
                        type: "danger"
                    }]
            }
        }
    })(jQuery, DevExpress);
    /*! Module framework, file framework.viewCache.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            EventsMixin = DX.require("/eventsMixin");
        DX.framework.ViewCache = Class.inherit({
            ctor: function() {
                this._cache = {}
            },
            setView: function(key, viewInfo) {
                this._cache[key] = viewInfo
            },
            getView: function(key) {
                return this._cache[key]
            },
            removeView: function(key) {
                var result = this._cache[key];
                if (result) {
                    delete this._cache[key];
                    this.fireEvent("viewRemoved", [{viewInfo: result}])
                }
                return result
            },
            clear: function() {
                var that = this;
                $.each(this._cache, function(key) {
                    that.removeView(key)
                })
            },
            hasView: function(key) {
                return key in this._cache
            }
        }).include(EventsMixin);
        DX.framework.NullViewCache = DX.framework.ViewCache.inherit({setView: function(key, viewInfo) {
                this.callBase(key, viewInfo);
                this.removeView(key)
            }});
        DX.framework.ConditionalViewCacheDecorator = Class.inherit({
            ctor: function(options) {
                this._filter = options.filter;
                this._viewCache = options.viewCache;
                this.viewRemoved = this._viewCache.viewRemoved;
                this._events = this._viewCache._events
            },
            setView: function(key, viewInfo) {
                this._viewCache.setView(key, viewInfo);
                if (!this._filter(key, viewInfo))
                    this._viewCache.removeView(key)
            },
            getView: function(key) {
                return this._viewCache.getView(key)
            },
            removeView: function(key) {
                return this._viewCache.removeView(key)
            },
            clear: function() {
                return this._viewCache.clear()
            },
            hasView: function(key) {
                return this._viewCache.hasView(key)
            }
        }).include(EventsMixin);
        var DEFAULT_VIEW_CACHE_CAPACITY = 5;
        DX.framework.CapacityViewCacheDecorator = Class.inherit({
            ctor: function(options) {
                this._keys = [];
                this._size = options.size || DEFAULT_VIEW_CACHE_CAPACITY;
                this._viewCache = options.viewCache;
                this.viewRemoved = this._viewCache.viewRemoved;
                this._events = this._viewCache._events
            },
            setView: function(key, viewInfo) {
                if (!this.hasView(key)) {
                    if (this._keys.length === this._size)
                        this.removeView(this._keys[0]);
                    this._keys.push(key)
                }
                this._viewCache.setView(key, viewInfo)
            },
            getView: function(key) {
                var index = $.inArray(key, this._keys);
                if (index < 0)
                    return null;
                this._keys.push(key);
                this._keys.splice(index, 1);
                return this._viewCache.getView(key)
            },
            removeView: function(key) {
                var index = $.inArray(key, this._keys);
                if (index > -1)
                    this._keys.splice(index, 1);
                return this._viewCache.removeView(key)
            },
            clear: function() {
                this._keys = [];
                return this._viewCache.clear()
            },
            hasView: function(key) {
                return this._viewCache.hasView(key)
            }
        }).include(EventsMixin);
        DX.framework.HistoryDependentViewCacheDecorator = Class.inherit({
            ctor: function(options) {
                this._viewCache = options.viewCache || new DX.framework.ViewCache;
                this._navigationManager = options.navigationManager;
                this._navigationManager.on("itemRemoved", $.proxy(this._onNavigationItemRemoved, this));
                this.viewRemoved = this._viewCache.viewRemoved;
                this._events = this._viewCache._events
            },
            _onNavigationItemRemoved: function(item) {
                this.removeView(item.key)
            },
            setView: function(key, viewInfo) {
                this._viewCache.setView(key, viewInfo)
            },
            getView: function(key) {
                return this._viewCache.getView(key)
            },
            removeView: function(key) {
                return this._viewCache.removeView(key)
            },
            clear: function() {
                return this._viewCache.clear()
            },
            hasView: function(key) {
                return this._viewCache.hasView(key)
            }
        }).include(EventsMixin)
    })(jQuery, DevExpress);
    /*! Module framework, file framework.stateManager.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class");
        DX.framework.MemoryKeyValueStorage = Class.inherit({
            ctor: function() {
                this.storage = {}
            },
            getItem: function(key) {
                return this.storage[key]
            },
            setItem: function(key, value) {
                this.storage[key] = value
            },
            removeItem: function(key) {
                delete this.storage[key]
            }
        });
        DX.framework.StateManager = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this.storage = options.storage || new DX.framework.MemoryKeyValueStorage;
                this.stateSources = options.stateSources || []
            },
            addStateSource: function(stateSource) {
                this.stateSources.push(stateSource)
            },
            removeStateSource: function(stateSource) {
                var index = $.inArray(stateSource, this.stateSources);
                if (index > -1) {
                    this.stateSources.splice(index, 1);
                    stateSource.removeState(this.storage)
                }
            },
            saveState: function() {
                var that = this;
                $.each(this.stateSources, function(index, stateSource) {
                    stateSource.saveState(that.storage)
                })
            },
            restoreState: function() {
                var that = this;
                $.each(this.stateSources, function(index, stateSource) {
                    stateSource.restoreState(that.storage)
                })
            },
            clearState: function() {
                var that = this;
                $.each(this.stateSources, function(index, stateSource) {
                    stateSource.removeState(that.storage)
                })
            }
        })
    })(jQuery, DevExpress);
    /*! Module framework, file framework.browserAdapters.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            queue = DX.require("/utils/utils.queue");
        var ROOT_PAGE_URL = "__root__",
            BUGGY_ANDROID_BUFFER_PAGE_URL = "__buffer__";
        DX.framework.DefaultBrowserAdapter = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this._window = options.window || window;
                this.popState = $.Callbacks();
                $(this._window).on("hashchange", $.proxy(this._onHashChange, this));
                this._tasks = queue.create();
                this.canWorkInPureBrowser = true
            },
            replaceState: function(uri) {
                var that = this;
                return this._addTask(function() {
                        uri = that._normalizeUri(uri);
                        that._window.history.replaceState(null, null, "#" + uri);
                        that._currentTask.resolve()
                    })
            },
            pushState: function(uri) {
                var that = this;
                return this._addTask(function() {
                        uri = that._normalizeUri(uri);
                        that._window.history.pushState(null, null, "#" + uri);
                        that._currentTask.resolve()
                    })
            },
            createRootPage: function() {
                return this.replaceState(ROOT_PAGE_URL)
            },
            _onHashChange: function() {
                if (this._currentTask)
                    this._currentTask.resolve();
                this.popState.fire()
            },
            back: function() {
                var that = this;
                return this._addTask(function() {
                        that._window.history.back()
                    })
            },
            getHash: function() {
                return this._normalizeUri(this._window.location.hash)
            },
            isRootPage: function() {
                return this.getHash() === ROOT_PAGE_URL
            },
            _normalizeUri: function(uri) {
                return (uri || "").replace(/^#+/, "")
            },
            _addTask: function(task) {
                var that = this,
                    d = $.Deferred();
                this._tasks.add(function() {
                    that._currentTask = d;
                    task();
                    return d
                });
                return d.promise()
            }
        });
        DX.framework.OldBrowserAdapter = DX.framework.DefaultBrowserAdapter.inherit({
            ctor: function() {
                this._innerEventCount = 0;
                this.callBase.apply(this, arguments);
                this._skipNextEvent = false
            },
            replaceState: function(uri) {
                var that = this;
                uri = that._normalizeUri(uri);
                if (that.getHash() !== uri) {
                    that._addTask(function() {
                        that._skipNextEvent = true;
                        that._window.history.back()
                    });
                    return that._addTask(function() {
                            that._skipNextEvent = true;
                            that._window.location.hash = uri
                        })
                }
                return $.Deferred().resolve().promise()
            },
            pushState: function(uri) {
                var that = this;
                uri = this._normalizeUri(uri);
                if (this.getHash() !== uri)
                    return that._addTask(function() {
                            that._skipNextEvent = true;
                            that._window.location.hash = uri
                        });
                return $.Deferred().resolve().promise()
            },
            createRootPage: function() {
                return this.pushState(ROOT_PAGE_URL)
            },
            _onHashChange: function() {
                var currentTask = this._currentTask;
                this._currentTask = null;
                if (this._skipNextEvent)
                    this._skipNextEvent = false;
                else
                    this.popState.fire();
                if (currentTask)
                    currentTask.resolve()
            }
        });
        DX.framework.BuggyAndroidBrowserAdapter = DX.framework.OldBrowserAdapter.inherit({createRootPage: function() {
                this.pushState(BUGGY_ANDROID_BUFFER_PAGE_URL);
                return this.callBase()
            }});
        DX.framework.HistorylessBrowserAdapter = DX.framework.DefaultBrowserAdapter.inherit({
            ctor: function(options) {
                options = options || {};
                this._window = options.window || window;
                this.popState = $.Callbacks();
                $(this._window).on("dxback", $.proxy(this._onHashChange, this));
                this._currentHash = this._window.location.hash
            },
            replaceState: function(uri) {
                this._currentHash = this._normalizeUri(uri);
                return $.Deferred().resolve().promise()
            },
            pushState: function(uri) {
                return this.replaceState(uri)
            },
            createRootPage: function() {
                return this.replaceState(ROOT_PAGE_URL)
            },
            getHash: function() {
                return this._normalizeUri(this._currentHash)
            },
            back: function() {
                return this.replaceState(ROOT_PAGE_URL)
            },
            _onHashChange: function() {
                var promise = this.back();
                this.popState.fire();
                return promise
            }
        });
        DX.framework.BuggyCordovaWP81BrowserAdapter = DX.framework.DefaultBrowserAdapter.inherit({ctor: function(options) {
                this.callBase(options);
                this.canWorkInPureBrowser = false
            }})
    })(jQuery, DevExpress);
    /*! Module framework, file framework.navigationDevices.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            storageUtils = DX.require("/utils/utils.storage"),
            devices = DX.require("/devices");
        var SESSION_KEY = "dxPhoneJSApplication";
        DX.framework.HistoryBasedNavigationDevice = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this._browserAdapter = options.browserAdapter || this._createBrowserAdapter(options);
                this.uriChanged = $.Callbacks();
                this._browserAdapter.popState.add($.proxy(this._onPopState, this))
            },
            init: $.noop,
            getUri: function() {
                return this._browserAdapter.getHash()
            },
            setUri: function(uri, replaceCurrent) {
                if (replaceCurrent)
                    return this._browserAdapter.replaceState(uri);
                else if (uri !== this.getUri())
                    return this._browserAdapter.pushState(uri);
                else
                    return $.Deferred().resolve().promise()
            },
            back: function() {
                return this._browserAdapter.back()
            },
            _onPopState: function() {
                this.uriChanged.fire(this.getUri())
            },
            _isBuggyAndroid2: function() {
                var realDevice = devices.real();
                var version = realDevice.version;
                return realDevice.platform === "android" && version.length > 1 && (version[0] === 2 && version[1] < 4 || version[0] < 2)
            },
            _isBuggyAndroid4: function() {
                var realDevice = devices.real();
                var version = realDevice.version;
                return realDevice.platform === "android" && version.length > 1 && version[0] === 4 && version[1] === 0
            },
            _isWindowsPhone8: function() {
                var realDevice = devices.real();
                return realDevice.platform === "win" && realDevice.phone
            },
            _createBrowserAdapter: function(options) {
                var sourceWindow = options.window || window,
                    supportPushReplace = sourceWindow.history.replaceState && sourceWindow.history.pushState,
                    result;
                if (this._isWindowsPhone8())
                    result = new DX.framework.BuggyCordovaWP81BrowserAdapter(options);
                else if (sourceWindow !== sourceWindow.top)
                    result = new DX.framework.HistorylessBrowserAdapter(options);
                else if (this._isBuggyAndroid4())
                    result = new DX.framework.BuggyAndroidBrowserAdapter(options);
                else if (this._isBuggyAndroid2() || !supportPushReplace)
                    result = new DX.framework.OldBrowserAdapter(options);
                else
                    result = new DX.framework.DefaultBrowserAdapter(options);
                return result
            }
        });
        DX.framework.StackBasedNavigationDevice = DX.framework.HistoryBasedNavigationDevice.inherit({
            ctor: function(options) {
                this.callBase(options);
                this.backInitiated = $.Callbacks();
                this._rootStateHandler = null;
                $(window).on("unload", this._saveBrowserState)
            },
            init: function() {
                var that = this;
                if (that._browserAdapter.canWorkInPureBrowser)
                    return that._initRootPage().done(function() {
                            if (that._browserAdapter.isRootPage())
                                that._browserAdapter.pushState("")
                        });
                else
                    return $.Deferred().resolve().promise()
            },
            setUri: function(uri) {
                return this.callBase(uri, !this._browserAdapter.isRootPage())
            },
            _saveBrowserState: function() {
                var sessionStorage = storageUtils.sessionStorage();
                if (sessionStorage)
                    sessionStorage.setItem(SESSION_KEY, true)
            },
            _initRootPage: function() {
                var hash = this.getUri(),
                    sessionStorage = storageUtils.sessionStorage();
                if (!sessionStorage || sessionStorage.getItem(SESSION_KEY))
                    return $.Deferred().resolve().promise();
                sessionStorage.removeItem(SESSION_KEY);
                this._browserAdapter.createRootPage();
                return this._browserAdapter.pushState(hash)
            },
            _onPopState: function() {
                if (this._browserAdapter.isRootPage())
                    if (this._rootStateHandler)
                        this._rootStateHandler();
                    else
                        this.backInitiated.fire();
                else {
                    if (!this._rootStateHandler)
                        this._createRootStateHndler();
                    this.back()
                }
            },
            _createRootStateHndler: function() {
                var uri = this.getUri();
                this._rootStateHandler = function() {
                    this.uriChanged.fire(uri);
                    this._rootStateHandler = null
                }
            }
        })
    })(jQuery, DevExpress);
    /*! Module framework, file framework.navigationManager.js */
    (function($, DX, undefined) {
        var Class = DX.require("/class"),
            EventsMixin = DX.require("/eventsMixin"),
            errors = DX.require("/framework/framework.errors"),
            commonUtils = DX.require("/utils/utils.common"),
            hardwareBackButton = DX.require("/utils/utils.hardwareBack").processCallback,
            hideTopOverlay = DX.require("/utils/utils.topOverlay").hide;
        var NAVIGATION_TARGETS = {
                current: "current",
                blank: "blank",
                back: "back"
            },
            STORAGE_HISTORY_KEY = "__history";
        DX.framework.HistoryBasedNavigationManager = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this._currentItem = undefined;
                this._previousItem = undefined;
                this._createNavigationDevice(options)
            },
            _createNavigationDevice: function(options) {
                this._navigationDevice = options.navigationDevice || new DX.framework.HistoryBasedNavigationDevice;
                this._navigationDevice.uriChanged.add($.proxy(this._uriChangedHandler, this))
            },
            _uriChangedHandler: function(uri) {
                while (hideTopOverlay());
                this.navigate(uri)
            },
            _syncUriWithCurrentNavigationItem: function() {
                var currentUri = this._currentItem && this._currentItem.uri;
                this._navigationDevice.setUri(currentUri, true)
            },
            _cancelNavigation: function(args) {
                this._syncUriWithCurrentNavigationItem();
                this.fireEvent("navigationCanceled", [args])
            },
            _getDefaultOptions: function() {
                return {
                        direction: "none",
                        target: NAVIGATION_TARGETS.blank
                    }
            },
            _updateHistory: function(uri, options) {
                this._previousItem = this._currentItem;
                this._currentItem = {
                    uri: uri,
                    key: uri
                };
                this._navigationDevice.setUri(uri, options.target === NAVIGATION_TARGETS.current)
            },
            _setCurrentItem: function(item) {
                this._currentItem = item
            },
            navigate: function(uri, options) {
                options = options || {};
                var that = this,
                    isFirstNavigate = !that._currentItem,
                    currentItem = that._currentItem || {},
                    targetItem = options.item || {},
                    currentUri = currentItem.uri,
                    currentKey = currentItem.key,
                    targetKey = targetItem.key,
                    args;
                if (uri === undefined)
                    uri = that._navigationDevice.getUri();
                if (/^_back$/.test(uri)) {
                    that.back();
                    return
                }
                options = $.extend(that._getDefaultOptions(), options || {});
                if (isFirstNavigate)
                    options.target = NAVIGATION_TARGETS.current;
                args = {
                    currentUri: currentUri,
                    uri: uri,
                    cancel: false,
                    navigateWhen: [],
                    options: options
                };
                that.fireEvent("navigating", [args]);
                uri = args.uri;
                if (args.cancel || currentUri === uri && (targetKey === undefined || targetKey === currentKey) && !that._forceNavigate)
                    that._cancelNavigation(args);
                else {
                    that._forceNavigate = false;
                    $.when.apply($, args.navigateWhen).done(function() {
                        commonUtils.executeAsync(function() {
                            that._updateHistory(uri, options);
                            that.fireEvent("navigated", [{
                                    uri: uri,
                                    previousUri: currentUri,
                                    options: options,
                                    item: that._currentItem
                                }])
                        })
                    })
                }
            },
            back: function() {
                return this._navigationDevice.back()
            },
            previousItem: function() {
                return this._previousItem
            },
            currentItem: function(item) {
                if (arguments.length > 0) {
                    if (!item)
                        throw errors.Error("E3023");
                    this._setCurrentItem(item)
                }
                else
                    return this._currentItem
            },
            rootUri: function() {
                return this._currentItem && this._currentItem.uri
            },
            canBack: function() {
                return true
            },
            saveState: $.noop,
            restoreState: $.noop,
            removeState: $.noop
        }).include(EventsMixin);
        DX.framework.StackBasedNavigationManager = DX.framework.HistoryBasedNavigationManager.inherit({
            ctor: function(options) {
                options = options || {};
                this.callBase(options);
                this._createNavigationStacks(options);
                hardwareBackButton.add($.proxy(this._deviceBackInitiated, this));
                this._stateStorageKey = options.stateStorageKey || STORAGE_HISTORY_KEY
            },
            init: function() {
                return this._navigationDevice.init()
            },
            _createNavigationDevice: function(options) {
                if (!options.navigationDevice)
                    options.navigationDevice = new DX.framework.StackBasedNavigationDevice;
                this.callBase(options);
                this._navigationDevice.backInitiated.add($.proxy(this._deviceBackInitiated, this))
            },
            _uriChangedHandler: function(uri) {
                this.navigate(uri)
            },
            _createNavigationStacks: function(options) {
                this.navigationStacks = {};
                this._keepPositionInStack = options.keepPositionInStack;
                this.currentStack = new DX.framework.NavigationStack
            },
            _deviceBackInitiated: function() {
                if (!hideTopOverlay())
                    this.back({isHardwareButton: true});
                else
                    this._syncUriWithCurrentNavigationItem()
            },
            _getDefaultOptions: function() {
                return {target: NAVIGATION_TARGETS.blank}
            },
            _createNavigationStack: function() {
                var result = new DX.framework.NavigationStack;
                result.itemsRemoved.add($.proxy(this._removeItems, this));
                return result
            },
            _setCurrentItem: function(item) {
                this._setCurrentStack(item.stack);
                this.currentStack.currentItem(item);
                this.callBase(item);
                this._syncUriWithCurrentNavigationItem()
            },
            _setCurrentStack: function(stackOrStackKey) {
                var stack,
                    stackKey;
                if (typeof stackOrStackKey === "string") {
                    stackKey = stackOrStackKey;
                    if (!(stackKey in this.navigationStacks))
                        this.navigationStacks[stackKey] = this._createNavigationStack();
                    stack = this.navigationStacks[stackKey]
                }
                else {
                    stack = stackOrStackKey;
                    stackKey = $.map(this.navigationStacks, function(stack, key) {
                        if (stack === stackOrStackKey)
                            return key;
                        return null
                    })[0]
                }
                this.currentStack = stack;
                this.currentStackKey = stackKey
            },
            _getViewTargetStackKey: function(uri, isRoot) {
                var result;
                if (isRoot)
                    if (this.navigationStacks[uri] !== undefined)
                        result = uri;
                    else {
                        for (var stackKey in this.navigationStacks)
                            if (this.navigationStacks[stackKey].items[0].uri === uri) {
                                result = stackKey;
                                break
                            }
                        result = result || uri
                    }
                else
                    result = this.currentStackKey || uri;
                return result
            },
            _updateHistory: function(uri, options) {
                var isRoot = options.root,
                    forceIsRoot = isRoot,
                    forceToRoot = false,
                    previousStack = this.currentStack,
                    keepPositionInStack = options.keepPositionInStack !== undefined ? options.keepPositionInStack : this._keepPositionInStack;
                options.stack = options.stack || this._getViewTargetStackKey(uri, isRoot);
                this._setCurrentStack(options.stack);
                if (isRoot || !this.currentStack.items.length) {
                    forceToRoot = this.currentStack === previousStack;
                    forceIsRoot = true
                }
                if (isRoot && this.currentStack.items.length) {
                    if (!keepPositionInStack || forceToRoot) {
                        this.currentStack.currentIndex = 0;
                        if (this.currentItem().uri !== uri)
                            this.currentStack.navigate(uri, true)
                    }
                    options.direction = options.direction || "none"
                }
                else {
                    var prevIndex = this.currentStack.currentIndex,
                        prevItem = this.currentItem() || {};
                    switch (options.target) {
                        case NAVIGATION_TARGETS.blank:
                            this.currentStack.navigate(uri);
                            break;
                        case NAVIGATION_TARGETS.current:
                            this.currentStack.navigate(uri, true);
                            break;
                        case NAVIGATION_TARGETS.back:
                            if (this.currentStack.currentIndex > 0)
                                this.currentStack.back(uri);
                            else
                                this.currentStack.navigate(uri, true);
                            break;
                        default:
                            throw errors.Error("E3006", options.target);
                    }
                    if (options.direction === undefined) {
                        var indexDelta = this.currentStack.currentIndex - prevIndex;
                        if (indexDelta < 0)
                            options.direction = this.currentStack.currentItem().backDirection || "backward";
                        else if (indexDelta > 0 && this.currentStack.currentIndex > 0)
                            options.direction = "forward";
                        else
                            options.direction = "none"
                    }
                    prevItem.backDirection = options.direction === "forward" ? "backward" : "none"
                }
                options.root = forceIsRoot;
                this._currentItem = this.currentStack.currentItem();
                this._syncUriWithCurrentNavigationItem()
            },
            _removeItems: function(items) {
                var that = this;
                $.each(items, function(index, item) {
                    that.fireEvent("itemRemoved", [item])
                })
            },
            back: function(options) {
                options = options || {};
                var navigatingBackArgs = $.extend({cancel: false}, options);
                this.fireEvent("navigatingBack", [navigatingBackArgs]);
                if (navigatingBackArgs.cancel) {
                    this._syncUriWithCurrentNavigationItem();
                    return
                }
                var item = this.previousItem(navigatingBackArgs.stack);
                if (item)
                    this.navigate(item.uri, {
                        stack: navigatingBackArgs.stack,
                        target: NAVIGATION_TARGETS.back,
                        item: item
                    });
                else
                    this.callBase()
            },
            rootUri: function() {
                return this.currentStack.items.length ? this.currentStack.items[0].uri : this.callBase()
            },
            canBack: function(stackKey) {
                var stack = stackKey ? this.navigationStacks[stackKey] : this.currentStack;
                return stack.canBack()
            },
            saveState: function(storage) {
                if (this.currentStack.items.length) {
                    var state = {
                            navigationStacks: {},
                            currentStackKey: this.currentStackKey
                        };
                    $.each(this.navigationStacks, function(stackKey, stack) {
                        var stackState = {};
                        state.navigationStacks[stackKey] = stackState;
                        stackState.currentIndex = stack.currentIndex;
                        stackState.items = $.map(stack.items, function(item) {
                            return {
                                    key: item.key,
                                    uri: item.uri
                                }
                        })
                    });
                    var json = JSON.stringify(state);
                    storage.setItem(this._stateStorageKey, json)
                }
                else
                    this.removeState(storage)
            },
            restoreState: function(storage) {
                if (this.disableRestoreState)
                    return;
                var json = storage.getItem(this._stateStorageKey);
                if (json)
                    try {
                        var that = this,
                            state = JSON.parse(json);
                        $.each(state.navigationStacks, function(stackKey, stackState) {
                            var stack = that._createNavigationStack();
                            that.navigationStacks[stackKey] = stack;
                            stack.currentIndex = stackState.currentIndex;
                            stack.items = $.map(stackState.items, function(item) {
                                item.stack = stack;
                                return item
                            })
                        });
                        this.currentStackKey = state.currentStackKey;
                        this.currentStack = this.navigationStacks[this.currentStackKey];
                        this._currentItem = this.currentStack.currentItem();
                        this._navigationDevice.setUri(this.currentItem().uri);
                        this._forceNavigate = true
                    }
                    catch(e) {
                        this.removeState(storage);
                        throw errors.Error("E3007");
                    }
            },
            removeState: function(storage) {
                storage.removeItem(this._stateStorageKey)
            },
            currentIndex: function() {
                return this.currentStack.currentIndex
            },
            previousItem: function(stackKey) {
                var stack = this.navigationStacks[stackKey] || this.currentStack;
                return stack.previousItem()
            },
            getItemByIndex: function(index) {
                return this.currentStack.items[index]
            },
            clearHistory: function() {
                this.currentStack.clear()
            },
            itemByKey: function(itemKey) {
                var result;
                $.each(this.navigationStacks, function(stackKey, stack) {
                    var item = stack.itemByKey(itemKey);
                    if (item) {
                        result = item;
                        return false
                    }
                });
                return result
            },
            currentItem: function(itemOrItemKey) {
                var item;
                if (arguments.length > 0) {
                    if (typeof itemOrItemKey === "string")
                        item = this.itemByKey(itemOrItemKey);
                    else if ($.isPlainObject(itemOrItemKey))
                        item = itemOrItemKey;
                    this.callBase(item)
                }
                else
                    return this.callBase()
            }
        });
        DX.framework.NavigationStack = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this.itemsRemoved = $.Callbacks();
                this.clear()
            },
            currentItem: function(item) {
                if (item) {
                    for (var i = 0; i < this.items.length; i++)
                        if (item === this.items[i]) {
                            this.currentIndex = i;
                            break
                        }
                }
                else
                    return this.items[this.currentIndex]
            },
            previousItem: function() {
                return this.items.length > 1 ? this.items[this.currentIndex - 1] : undefined
            },
            canBack: function() {
                return this.currentIndex > 0
            },
            clear: function() {
                this._deleteItems(this.items);
                this.items = [];
                this.currentIndex = -1
            },
            back: function(uri) {
                this.currentIndex--;
                if (this.currentIndex < 0)
                    throw errors.Error("E3008");
                var currentItem = this.currentItem();
                if (currentItem.uri !== uri)
                    this._updateItem(this.currentIndex, uri)
            },
            forward: function() {
                this.currentIndex++;
                if (this.currentIndex >= this.items.length)
                    throw errors.Error("E3009");
            },
            navigate: function(uri, replaceCurrent) {
                if (this.currentIndex < this.items.length && this.currentIndex > -1 && this.items[this.currentIndex].uri === uri)
                    return;
                if (replaceCurrent && this.currentIndex > -1)
                    this.currentIndex--;
                if (this.currentIndex + 1 < this.items.length && this.items[this.currentIndex + 1].uri === uri)
                    this.currentIndex++;
                else {
                    var toDelete = this.items.splice(this.currentIndex + 1, this.items.length - this.currentIndex - 1);
                    this.items.push({stack: this});
                    this.currentIndex++;
                    this._updateItem(this.currentIndex, uri);
                    this._deleteItems(toDelete)
                }
                return this.currentItem()
            },
            itemByKey: function(key) {
                for (var i = 0; i < this.items.length; i++) {
                    var item = this.items[i];
                    if (item.key === key)
                        return item
                }
            },
            _updateItem: function(index, uri) {
                var item = this.items[index];
                item.uri = uri;
                item.key = this.items[0].uri + "_" + index + "_" + uri
            },
            _deleteItems: function(items) {
                if (items)
                    this.itemsRemoved.fire(items)
            }
        });
        DX.framework.HistoryBasedNavigationManager.NAVIGATION_TARGETS = NAVIGATION_TARGETS
    })(jQuery, DevExpress);
    /*! Module framework, file framework.actionExecutors.js */
    (function($, DX, undefined) {
        function prepareNavigateOptions(options, actionArguments) {
            if (actionArguments.args) {
                var sourceEventArguments = actionArguments.args[0];
                options.jQueryEvent = sourceEventArguments.jQueryEvent
            }
            if ((actionArguments.component || {}).NAME === "dxCommand")
                $.extend(options, actionArguments.component.option())
        }
        function preventDefaultLinkBehaviour(e) {
            if (!e)
                return;
            var $targetElement = $(e.target);
            if ($targetElement.attr('href'))
                e.preventDefault()
        }
        DX.framework.createActionExecutors = function(app) {
            return {
                    routing: {execute: function(e) {
                            var action = e.action,
                                options = {},
                                routeValues,
                                uri;
                            if ($.isPlainObject(action)) {
                                routeValues = action.routeValues;
                                if (routeValues && $.isPlainObject(routeValues))
                                    options = action.options;
                                else
                                    routeValues = action;
                                uri = app.router.format(routeValues);
                                prepareNavigateOptions(options, e);
                                preventDefaultLinkBehaviour(options.jQueryEvent);
                                app.navigate(uri, options);
                                e.handled = true
                            }
                        }},
                    hash: {execute: function(e) {
                            if (typeof e.action !== "string" || e.action.charAt(0) !== "#")
                                return;
                            var uriTemplate = e.action.substr(1),
                                args = e.args[0],
                                uri = uriTemplate;
                            var defaultEvaluate = function(expr) {
                                    var getter = DX.data.utils.compileGetter(expr),
                                        model = e.args[0].model;
                                    return getter(model)
                                };
                            var evaluate = args.evaluate || defaultEvaluate;
                            uri = uriTemplate.replace(/\{([^}]+)\}/g, function(entry, expr) {
                                expr = $.trim(expr);
                                if (expr.indexOf(",") > -1)
                                    expr = $.map(expr.split(","), $.trim);
                                var value = evaluate(expr);
                                if (value === undefined)
                                    value = "";
                                value = DX.framework.Route.prototype.formatSegment(value);
                                return value
                            });
                            var options = {};
                            prepareNavigateOptions(options, e);
                            preventDefaultLinkBehaviour(options.jQueryEvent);
                            app.navigate(uri, options);
                            e.handled = true
                        }}
                }
        }
    })(jQuery, DevExpress);
    /*! Module framework, file framework.application.js */
    (function($, DX) {
        var Class = DX.require("/class"),
            abstract = Class.abstract,
            EventsMixin = DX.require("/eventsMixin"),
            Action = DX.require("/action"),
            storageUtils = DX.require("/utils/utils.storage"),
            commonUtils = DX.require("/utils/utils.common"),
            errors = DX.require("/framework/framework.errors"),
            BACK_COMMAND_TITLE,
            INIT_IN_PROGRESS = "InProgress",
            INIT_COMPLETE = "Inited",
            frameworkNS = DX.framework;
        DX.framework.Application = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this._options = options;
                this.namespace = options.namespace || window;
                this._applicationMode = options.mode ? options.mode : "mobileApp";
                this.components = [];
                BACK_COMMAND_TITLE = DX.localization.localizeString("@Back");
                this.router = options.router || new DX.framework.Router;
                var navigationManagers = {
                        mobileApp: DX.framework.StackBasedNavigationManager,
                        webSite: DX.framework.HistoryBasedNavigationManager
                    };
                this.navigationManager = options.navigationManager || new navigationManagers[this._applicationMode]({keepPositionInStack: options.navigateToRootViewMode === "keepHistory"});
                this.navigationManager.on("navigating", $.proxy(this._onNavigating, this));
                this.navigationManager.on("navigatingBack", $.proxy(this._onNavigatingBack, this));
                this.navigationManager.on("navigated", $.proxy(this._onNavigated, this));
                this.navigationManager.on("navigationCanceled", $.proxy(this._onNavigationCanceled, this));
                this.stateManager = options.stateManager || new DX.framework.StateManager({storage: options.stateStorage || storageUtils.sessionStorage()});
                this.stateManager.addStateSource(this.navigationManager);
                this.viewCache = this._createViewCache(options);
                this.commandMapping = this._createCommandMapping(options.commandMapping);
                this.createNavigation(options.navigation);
                this._isNavigating = false;
                this._viewLinksHash = {};
                Action.registerExecutor(DX.framework.createActionExecutors(this));
                this.components.push(this.router);
                this.components.push(this.navigationManager)
            },
            _createViewCache: function(options) {
                var result;
                if (options.viewCache)
                    result = options.viewCache;
                else if (options.disableViewCache)
                    result = new DX.framework.NullViewCache;
                else
                    result = new DX.framework.CapacityViewCacheDecorator({
                        size: options.viewCacheSize,
                        viewCache: new DX.framework.ViewCache
                    });
                result.on("viewRemoved", $.proxy(function(e) {
                    this._releaseViewLink(e.viewInfo)
                }, this));
                return result
            },
            _createCommandMapping: function(commandMapping) {
                var result = commandMapping;
                if (!(commandMapping instanceof DX.framework.CommandMapping)) {
                    result = new DX.framework.CommandMapping;
                    result.load(DX.framework.CommandMapping.defaultMapping || {}).load(commandMapping || {})
                }
                return result
            },
            createNavigation: function(navigationConfig) {
                this.navigation = this._createNavigationCommands(navigationConfig);
                this._mapNavigationCommands(this.navigation, this.commandMapping)
            },
            _createNavigationCommands: function(commandConfig) {
                if (!commandConfig)
                    return [];
                var generatedIdCount = 0;
                return $.map(commandConfig, function(item) {
                        var command;
                        if (item instanceof frameworkNS.dxCommand)
                            command = item;
                        else
                            command = new frameworkNS.dxCommand($.extend({root: true}, item));
                        if (!command.option("id"))
                            command.option("id", "navigation_" + generatedIdCount++);
                        return command
                    })
            },
            _mapNavigationCommands: function(navigationCommands, commandMapping) {
                var navigationCommandIds = $.map(navigationCommands, function(command) {
                        return command.option("id")
                    });
                commandMapping.mapCommands("global-navigation", navigationCommandIds)
            },
            _callComponentMethod: function(methodName, args) {
                var tasks = [];
                $.each(this.components, function(index, component) {
                    if (component[methodName] && $.isFunction(component[methodName])) {
                        var result = component[methodName](args);
                        if (result && result.done)
                            tasks.push(result)
                    }
                });
                return $.when.apply($, tasks)
            },
            init: function() {
                var that = this;
                that._initState = INIT_IN_PROGRESS;
                return that._callComponentMethod("init").done(function() {
                        that._initState = INIT_COMPLETE;
                        that._processEvent("initialized")
                    }).fail(function(error) {
                        throw error || errors.Error("E3022");
                    })
            },
            _onNavigatingBack: function(args) {
                this._processEvent("navigatingBack", args)
            },
            _onNavigating: function(args) {
                var that = this;
                if (that._isNavigating) {
                    that._pendingNavigationArgs = args;
                    args.cancel = true;
                    return
                }
                else {
                    that._isNavigating = true;
                    delete that._pendingNavigationArgs
                }
                var routeData = this.router.parse(args.uri);
                if (!routeData)
                    throw errors.Error("E3001", args.uri);
                var uri = this.router.format(routeData);
                if (args.uri !== uri && uri) {
                    args.cancel = true;
                    args.cancelReason = "redirect";
                    commonUtils.executeAsync(function() {
                        that.navigate(uri, args.options)
                    })
                }
                else
                    that._processEvent("navigating", args)
            },
            _onNavigated: function(args) {
                var that = this,
                    direction = args.options.direction,
                    resultDeferred,
                    viewInfo = that._acquireViewInfo(args.item, args.options);
                if (!viewInfo.model) {
                    this._processEvent("beforeViewSetup", {viewInfo: viewInfo});
                    that._createViewModel(viewInfo);
                    that._createViewCommands(viewInfo);
                    this._processEvent("afterViewSetup", {viewInfo: viewInfo})
                }
                that._highlightCurrentNavigationCommand(viewInfo);
                resultDeferred = that._showView(viewInfo, direction).always(function() {
                    that._isNavigating = false;
                    var pendingArgs = that._pendingNavigationArgs;
                    if (pendingArgs)
                        commonUtils.executeAsync(function() {
                            that.navigate(pendingArgs.uri, pendingArgs.options)
                        })
                });
                return resultDeferred
            },
            _isViewReadyToShow: function(viewInfo) {
                return !!viewInfo.model
            },
            _onNavigationCanceled: function(args) {
                var that = this;
                if (!that._pendingNavigationArgs || that._pendingNavigationArgs.uri !== args.uri) {
                    var currentItem = that.navigationManager.currentItem();
                    if (currentItem)
                        commonUtils.executeAsync(function() {
                            var viewInfo = that._acquireViewInfo(currentItem, args.options);
                            that._highlightCurrentNavigationCommand(viewInfo, true)
                        });
                    that._isNavigating = false
                }
            },
            _disposeRemovedViews: function() {
                var that = this,
                    args;
                $.each(that._viewLinksHash, function(key, link) {
                    if (!link.linkCount) {
                        args = {viewInfo: link.viewInfo};
                        that._processEvent("viewDisposing", args, args.viewInfo.model);
                        that._disposeView(link.viewInfo);
                        that._processEvent("viewDisposed", args, args.viewInfo.model);
                        delete that._viewLinksHash[key]
                    }
                })
            },
            _onViewHidden: function(viewInfo) {
                var args = {viewInfo: viewInfo};
                this._processEvent("viewHidden", args, args.viewInfo.model)
            },
            _disposeView: function(viewInfo) {
                var commands = viewInfo.commands || [];
                $.each(commands, function(index, command) {
                    command._dispose()
                })
            },
            _acquireViewInfo: function(navigationItem, navigateOptions) {
                var routeData = this.router.parse(navigationItem.uri),
                    viewInfoKey = this._getViewInfoKey(navigationItem, routeData),
                    viewInfo = this.viewCache.getView(viewInfoKey);
                if (!viewInfo) {
                    viewInfo = this._createViewInfo(navigationItem, navigateOptions);
                    this._obtainViewLink(viewInfo);
                    this.viewCache.setView(viewInfoKey, viewInfo)
                }
                else
                    this._updateViewInfo(viewInfo, navigationItem, navigateOptions);
                return viewInfo
            },
            _getViewInfoKey: function(navigationItem, routeData) {
                var args = {
                        key: navigationItem.key,
                        navigationItem: navigationItem,
                        routeData: routeData
                    };
                this._processEvent("resolveViewCacheKey", args);
                return args.key
            },
            _processEvent: function(eventName, args, model) {
                this._callComponentMethod(eventName, args);
                this.fireEvent(eventName, args && [args]);
                var modelMethod = (model || {})[eventName];
                if (modelMethod)
                    modelMethod.call(model, args)
            },
            _updateViewInfo: function(viewInfo, navigationItem, navigateOptions) {
                var uri = navigationItem.uri,
                    routeData = this.router.parse(uri);
                viewInfo.viewName = routeData.view;
                viewInfo.routeData = routeData;
                viewInfo.uri = uri;
                viewInfo.navigateOptions = navigateOptions;
                viewInfo.canBack = this.canBack(navigateOptions.stack);
                viewInfo.previousViewInfo = this._getPreviousViewInfo(navigateOptions)
            },
            _createViewInfo: function(navigationItem, navigateOptions) {
                var uri = navigationItem.uri,
                    routeData = this.router.parse(uri),
                    viewInfo = {key: this._getViewInfoKey(navigationItem, routeData)};
                this._updateViewInfo(viewInfo, navigationItem, navigateOptions);
                return viewInfo
            },
            _createViewModel: function(viewInfo) {
                viewInfo.model = viewInfo.model || this._callViewCodeBehind(viewInfo)
            },
            _createViewCommands: function(viewInfo) {
                viewInfo.commands = viewInfo.model.commands || [];
                if (viewInfo.canBack && this._applicationMode !== "webSite")
                    this._appendBackCommand(viewInfo)
            },
            _callViewCodeBehind: function(viewInfo) {
                var setupFunc = $.noop,
                    routeData = viewInfo.routeData;
                if (routeData.view in this.namespace)
                    setupFunc = this.namespace[routeData.view];
                return setupFunc.call(this.namespace, routeData, viewInfo) || {}
            },
            _appendBackCommand: function(viewInfo) {
                var commands = viewInfo.commands,
                    that = this,
                    backTitle = BACK_COMMAND_TITLE;
                if (that._options.useViewTitleAsBackText)
                    backTitle = ((viewInfo.previousViewInfo || {}).model || {}).title || backTitle;
                var toMergeTo = [new DX.framework.dxCommand({
                            id: "back",
                            title: backTitle,
                            behavior: "back",
                            onExecute: function() {
                                that.back({stack: viewInfo.navigateOptions.stack})
                            },
                            icon: "arrowleft",
                            type: "back",
                            renderStage: that._options.useViewTitleAsBackText ? "onViewRendering" : "onViewShown"
                        })];
                var result = DX.framework.utils.mergeCommands(toMergeTo, commands);
                commands.length = 0;
                commands.push.apply(commands, result)
            },
            _showView: function(viewInfo, direction) {
                var that = this;
                var eventArgs = {
                        viewInfo: viewInfo,
                        direction: direction,
                        params: viewInfo.routeData
                    };
                DX.data.utils.processRequestResultLock.obtain();
                return that._showViewImpl(eventArgs.viewInfo, eventArgs.direction).done(function() {
                        commonUtils.executeAsync(function() {
                            DX.data.utils.processRequestResultLock.release();
                            that._processEvent("viewShown", eventArgs, viewInfo.model);
                            that._disposeRemovedViews()
                        })
                    })
            },
            _highlightCurrentNavigationCommand: function(viewInfo, forceUpdate) {
                var that = this,
                    selectedCommand,
                    currentNavigationItemId = viewInfo.model && viewInfo.model.currentNavigationItemId;
                if (currentNavigationItemId !== undefined)
                    $.each(this.navigation, function(index, command) {
                        if (command.option("id") === currentNavigationItemId) {
                            selectedCommand = command;
                            return false
                        }
                    });
                if (!selectedCommand)
                    $.each(this.navigation, function(index, command) {
                        var commandUri = command.option("onExecute");
                        if (commonUtils.isString(commandUri)) {
                            commandUri = commandUri.replace(/^#+/, "");
                            if (commandUri === that.navigationManager.rootUri()) {
                                selectedCommand = command;
                                return false
                            }
                        }
                    });
                $.each(this.navigation, function(index, command) {
                    if (forceUpdate && command === selectedCommand && command.option("highlighted"))
                        command.fireEvent("optionChanged", [{
                                name: "highlighted",
                                value: true,
                                previousValue: true
                            }]);
                    command.option("highlighted", command === selectedCommand)
                })
            },
            _showViewImpl: abstract,
            _obtainViewLink: function(viewInfo) {
                var key = viewInfo.key;
                if (!this._viewLinksHash[key])
                    this._viewLinksHash[key] = {
                        viewInfo: viewInfo,
                        linkCount: 1
                    };
                else
                    this._viewLinksHash[key].linkCount++
            },
            _releaseViewLink: function(viewInfo) {
                if (this._viewLinksHash[viewInfo.key] === undefined)
                    errors.log("W3001", viewInfo.key);
                if (this._viewLinksHash[viewInfo.key].linkCount === 0)
                    errors.log("W3002", viewInfo.key);
                this._viewLinksHash[viewInfo.key].linkCount--
            },
            navigate: function(uri, options) {
                var that = this;
                if ($.isPlainObject(uri)) {
                    uri = that.router.format(uri);
                    if (uri === false)
                        throw errors.Error("E3002");
                }
                if (!that._initState)
                    that.init().done(function() {
                        that.restoreState();
                        that.navigate(uri, options)
                    });
                else if (that._initState === INIT_COMPLETE) {
                    if (!that._isNavigating || uri)
                        that.navigationManager.navigate(uri, options)
                }
                else
                    throw errors.Error("E3003");
            },
            canBack: function(stackKey) {
                return this.navigationManager.canBack(stackKey)
            },
            _getPreviousViewInfo: function(navigateOptions) {
                var previousNavigationItem = this.navigationManager.previousItem(navigateOptions.stack),
                    result;
                if (previousNavigationItem) {
                    var routeData = this.router.parse(previousNavigationItem.uri);
                    result = this.viewCache.getView(this._getViewInfoKey(previousNavigationItem, routeData))
                }
                return result
            },
            back: function(options) {
                this.navigationManager.back(options)
            },
            saveState: function() {
                this.stateManager.saveState()
            },
            restoreState: function() {
                this.stateManager.restoreState()
            },
            clearState: function() {
                this.stateManager.clearState()
            }
        }).include(EventsMixin)
    })(jQuery, DevExpress);
    /*! Module framework, file framework.html.js */
    (function($, DX, undefined) {
        DX.framework.html = {
            layoutSets: {},
            animationSets: {
                "native": {
                    "view-content-change": [{animation: "slide"}, {
                            animation: "ios7-slide",
                            device: {platform: "ios"}
                        }, {
                            animation: "none",
                            device: {
                                deviceType: "desktop",
                                platform: "generic"
                            }
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "view-header-toolbar": [{animation: "ios7-toolbar"}, {
                            animation: "slide",
                            device: {grade: "B"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }]
                },
                "default": {
                    "layout-change": [{animation: "none"}, {
                            animation: "ios7-slide",
                            device: {platform: "ios"}
                        }, {
                            animation: "pop",
                            device: {platform: "android"}
                        }, {
                            animation: "openDoor",
                            device: {
                                deviceType: "phone",
                                platform: "win"
                            }
                        }],
                    "view-content-change": [{animation: "slide"}, {
                            animation: "ios7-slide",
                            device: {platform: "ios"}
                        }, {
                            animation: "fade",
                            device: {
                                deviceType: "desktop",
                                platform: "generic"
                            }
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "view-content-rendered": [{animation: "fade"}, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "view-header-toolbar": [{animation: "ios7-toolbar"}, {
                            animation: "slide",
                            device: {grade: "B"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "command-rendered": [{animation: "stagger-fade-drop"}, {
                            animation: "fade",
                            device: {grade: "B"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "list-item-rendered": [{
                            animation: "stagger-3d-drop",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "detail-item-rendered": [{
                            animation: "stagger-3d-drop",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "edit-item-rendered": [{
                            animation: "stagger-3d-drop",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }]
                },
                slide: {
                    "view-content-change": [{animation: "slide"}, {
                            animation: "ios7-slide",
                            device: {platform: "ios"}
                        }, {
                            animation: "fade",
                            device: {
                                deviceType: "desktop",
                                platform: "generic"
                            }
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "view-content-rendered": [{animation: "fade"}, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "view-header-toolbar": [{animation: "ios7-toolbar"}, {
                            animation: "slide",
                            device: {grade: "B"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "command-rendered": [{animation: "stagger-fade-drop"}, {
                            animation: "fade",
                            device: {grade: "B"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "list-item-rendered": [{
                            animation: "stagger-fade-slide",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "detail-item-rendered": [{
                            animation: "stagger-fade-slide",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "edit-item-rendered": [{
                            animation: "stagger-fade-slide",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }]
                },
                zoom: {
                    "view-content-change": [{animation: "slide"}, {
                            animation: "ios7-slide",
                            device: {platform: "ios"}
                        }, {
                            animation: "fade",
                            device: {
                                deviceType: "desktop",
                                platform: "generic"
                            }
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "view-content-rendered": [{animation: "fade"}, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "view-header-toolbar": [{animation: "ios7-toolbar"}, {
                            animation: "slide",
                            device: {grade: "B"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "command-rendered": [{animation: "stagger-fade-zoom"}, {
                            animation: "fade",
                            device: {grade: "B"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "list-item-rendered": [{
                            animation: "stagger-fade-zoom",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "detail-item-rendered": [{
                            animation: "stagger-fade-zoom",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }],
                    "edit-item-rendered": [{
                            animation: "stagger-fade-zoom",
                            device: {grade: "A"}
                        }, {
                            animation: "fade",
                            device: {deviceType: "desktop"}
                        }, {
                            animation: "none",
                            device: {grade: "C"}
                        }]
                }
            }
        }
    })(jQuery, DevExpress);
    /*! Module framework, file framework.markupComponent.js */
    (function($, DX, undefined) {
        var Class = DX.require("/class"),
            publicComponentUtils = DX.require("/utils/utils.publicComponent"),
            removeEvent = DX.require("/ui/events/ui.events.remove");
        var MarkupComponent = Class.inherit({
                ctor: function(element, options) {
                    this.NAME = this.constructor.publicName();
                    options = options || {};
                    this._$element = $(element).one(removeEvent.name, $.proxy(function() {
                        this._dispose()
                    }, this));
                    publicComponentUtils.attachInstanceToElement(this._$element, this.NAME, this);
                    if (options.fromCache)
                        this._options = options;
                    else {
                        this._options = {};
                        this._setDefaultOptions();
                        if (options)
                            this.option(options);
                        this._render()
                    }
                },
                _setDefaultOptions: $.noop,
                _render: $.noop,
                _dispose: $.noop,
                element: function() {
                    return this._$element
                },
                option: function(name, value) {
                    if (arguments.length === 0)
                        return this._options;
                    else if (arguments.length === 1)
                        if (typeof name === "string")
                            return this._options[name];
                        else {
                            value = name;
                            $.extend(this._options, value)
                        }
                    else
                        this._options[name] = value
                },
                instance: function() {
                    return this
                }
            });
        MarkupComponent.publicName = publicComponentUtils.getName;
        MarkupComponent.getInstance = function($element) {
            return publicComponentUtils.getInstanceByElement($element, this.publicName())
        };
        $.extend(DX.framework.html, {MarkupComponent: MarkupComponent})
    })(jQuery, DevExpress);
    /*! Module framework, file framework.widgetCommandAdapters.js */
    (function($, DX) {
        var Class = DevExpress.require("/class"),
            commandToContainer = DX.framework.utils.commandToContainer,
            DX_COMMAND_TO_WIDGET_ADAPTER = "dxCommandToWidgetAdapter";
        var WidgetItemWrapperBase = Class.inherit({
                ctor: function(command, containerOptions) {
                    this.command = command;
                    this.widgetItem = this._createWidgetItem(command, containerOptions)
                },
                _createWidgetItem: function(command, containerOptions) {
                    var itemOptions = $.extend({}, containerOptions, command.option()),
                        executeCommandCallback = function(e) {
                            command.execute(e)
                        },
                        result;
                    itemOptions.text = commandToContainer.resolveTextValue(command, containerOptions);
                    itemOptions.icon = commandToContainer.resolveIconValue(command, containerOptions);
                    itemOptions.type = commandToContainer.resolvePropertyValue(command, containerOptions, "type");
                    itemOptions.location = commandToContainer.resolvePropertyValue(command, containerOptions, "location");
                    result = this._createWidgetItemCore(itemOptions, executeCommandCallback);
                    result.command = command;
                    return result
                },
                _createWidgetItemCore: function(itemOptions, executeCommandCallback) {
                    return itemOptions
                },
                dispose: function() {
                    delete this.command;
                    delete this.widgetItem
                }
            });
        var WidgetAdapterBase = Class.inherit({
                ctor: function($widgetElement) {
                    this._commandToWidgetItemOptionNames = {};
                    this.$widgetElement = $widgetElement;
                    this.$widgetElement.data(DX_COMMAND_TO_WIDGET_ADAPTER, this);
                    this.widget = this._getWidgetByElement($widgetElement);
                    this._widgetWidgetContentReadyHandler = $.proxy(this._onWidgetContentReady, this);
                    this._widgetWidgetItemRenderedHandler = $.proxy(this._onWidgetItemRendered, this);
                    this._widgetDisposingHandler = $.proxy(this._onWidgetDisposing, this);
                    this.widget.on("itemRendered", this._widgetWidgetItemRenderedHandler);
                    this.widget.on("contentReady", this._widgetWidgetContentReadyHandler);
                    this.widget.on("disposing", this._widgetDisposingHandler);
                    this.itemWrappers = [];
                    this._transitionExecutor = new DX.TransitionExecutor
                },
                addCommand: function(command, containerOptions) {
                    var itemWrapper = this._createItemWrapper(command, containerOptions);
                    this.itemWrappers.push(itemWrapper);
                    this._addItemToWidget(itemWrapper);
                    this._commandChangedHandler = $.proxy(this._onCommandChanged, this);
                    itemWrapper.command.on("optionChanged", this._commandChangedHandler)
                },
                beginUpdate: function() {
                    this.widget.beginUpdate()
                },
                endUpdate: function() {
                    this.widget.endUpdate();
                    return this.animationDeferred
                },
                _onWidgetItemRendered: function(e) {
                    if (e.itemData.isJustAdded && e.itemData.command && e.itemData.command.option("visible") && this._commandRenderedAnimation) {
                        this._transitionExecutor.enter(e.itemElement, this._commandRenderedAnimation);
                        delete e.itemData.isJustAdded
                    }
                },
                _onWidgetContentReady: function(e) {
                    this.animationDeferred = this._transitionExecutor.start()
                },
                _onWidgetDisposing: function() {
                    this.dispose(true)
                },
                _setWidgetItemOption: function(optionName, optionValue, itemCommand) {
                    var items = this.widget.option("items"),
                        itemIndex = $.inArray(itemCommand, $.map(items, function(item) {
                            return item.command || {}
                        }));
                    if (itemIndex > -1) {
                        var optionPath = "items[" + itemIndex + "].";
                        if (optionName !== "visible" && optionName !== "location" && this.widget.option("items[" + itemIndex + "]").options)
                            optionPath += "options.";
                        optionPath += this._commandToWidgetItemOptionNames[optionName] || optionName;
                        this.widget.option(optionPath, optionValue)
                    }
                },
                _onCommandChanged: function(args) {
                    if (args.name === "highlighted")
                        return;
                    this._setWidgetItemOption(args.name, args.value, args.component)
                },
                _addItemToWidget: function(itemWrapper) {
                    var items = this.widget.option("items");
                    items.push(itemWrapper.widgetItem);
                    if (this.widget.element().is(":visible"))
                        itemWrapper.widgetItem.isJustAdded = true;
                    this.widget.option("items", items)
                },
                refresh: function() {
                    var items = this.widget.option("items");
                    this.widget.option("items", items)
                },
                clear: function(widgetDisposing) {
                    var that = this;
                    $.each(that.itemWrappers, function(index, itemWrapper) {
                        itemWrapper.command.off("optionChanged", that._commandChangedHandler);
                        itemWrapper.dispose()
                    });
                    this.itemWrappers.length = 0;
                    if (!widgetDisposing)
                        this._clearWidgetItems()
                },
                _clearWidgetItems: function() {
                    this.widget.option("items", [])
                },
                dispose: function(widgetDisposing) {
                    this.clear(widgetDisposing);
                    if (this.widget) {
                        this.widget.off("itemRendered", this._widgetWidgetItemRenderedHandler);
                        this.widget.off("contentReady", this._widgetContentReadyHandler);
                        this.widget.off("disposing", this._widgetDisposingHandler);
                        this.$widgetElement.removeData(DX_COMMAND_TO_WIDGET_ADAPTER);
                        delete this.widget;
                        delete this.$widgetElement
                    }
                }
            });
        var CommandToWidgetAdapter = Class.inherit({
                ctor: function(createAdapter) {
                    this.createAdapter = createAdapter
                },
                _getWidgetAdapter: function($container) {
                    var widgetAdapter = $container.data(DX_COMMAND_TO_WIDGET_ADAPTER);
                    if (!widgetAdapter)
                        widgetAdapter = this.createAdapter($container);
                    return widgetAdapter
                },
                addCommand: function($container, command, containerOptions) {
                    var widgetAdapter = this._getWidgetAdapter($container);
                    widgetAdapter.addCommand(command, containerOptions)
                },
                clearContainer: function($container) {
                    var widgetAdapter = this._getWidgetAdapter($container);
                    widgetAdapter.clear()
                },
                beginUpdate: function($container) {
                    var widgetAdapter = this._getWidgetAdapter($container);
                    widgetAdapter.beginUpdate()
                },
                endUpdate: function($container) {
                    var widgetAdapter = this._getWidgetAdapter($container);
                    return widgetAdapter.endUpdate()
                }
            });
        var dxToolbarItemWrapper = WidgetItemWrapperBase.inherit({_createWidgetItemCore: function(itemOptions, executeCommandCallback) {
                    var widgetItem;
                    itemOptions.onClick = executeCommandCallback;
                    if (itemOptions.location === "menu")
                        widgetItem = itemOptions;
                    else {
                        widgetItem = {
                            location: itemOptions.location,
                            visible: itemOptions.visible,
                            options: itemOptions,
                            widget: "button"
                        };
                        itemOptions.visible = true;
                        delete itemOptions.location
                    }
                    return widgetItem
                }});
        var dxToolbarAdapter = WidgetAdapterBase.inherit({
                ctor: function($widgetElement) {
                    this.callBase($widgetElement);
                    this._commandToWidgetItemOptionNames = {title: "text"};
                    this._commandRenderedAnimation = "command-rendered"
                },
                _getWidgetByElement: function($element) {
                    return $element.dxToolbar("instance")
                },
                _createItemWrapper: function(command, containerOptions) {
                    return new dxToolbarItemWrapper(command, containerOptions)
                },
                addCommand: function(command, containerOptions) {
                    this.widget.option("visible", true);
                    this.callBase(command, containerOptions)
                }
            });
        var dxListItemWrapper = WidgetItemWrapperBase.inherit({_createWidgetItemCore: function(itemOptions, executeCommandCallback) {
                    itemOptions.title = itemOptions.text;
                    itemOptions.onClick = executeCommandCallback;
                    return itemOptions
                }});
        var dxListAdapter = WidgetAdapterBase.inherit({
                _createItemWrapper: function(command, containerOptions) {
                    return new dxListItemWrapper(command, containerOptions)
                },
                _getWidgetByElement: function($element) {
                    return $element.dxList("instance")
                }
            });
        var dxNavBarItemWrapper = WidgetItemWrapperBase.inherit({});
        var dxNavBarAdapter = WidgetAdapterBase.inherit({
                ctor: function($widgetElement) {
                    this.callBase($widgetElement);
                    this._commandToWidgetItemOptionNames = {title: "text"};
                    this.widget.option("onItemClick", $.proxy(this._onNavBarItemClick, this))
                },
                _onNavBarItemClick: function(e) {
                    var items = this.widget.option("items");
                    for (var i = items.length; --i; )
                        items[i].command.option("highlighted", false);
                    e.itemData.command.execute(e)
                },
                _getWidgetByElement: function($element) {
                    return $element.dxNavBar("instance")
                },
                _createItemWrapper: function(command, containerOptions) {
                    return new dxNavBarItemWrapper(command, containerOptions)
                },
                addCommand: function(command, containerOptions) {
                    this.callBase(command, containerOptions);
                    this._updateSelectedIndex()
                },
                _onCommandChanged: function(args) {
                    var optionName = args.name,
                        newValue = args.value;
                    if (optionName === "highlighted" && newValue)
                        this._updateSelectedIndex();
                    this.callBase(args)
                },
                _updateSelectedIndex: function() {
                    var items = this.widget.option("items");
                    for (var i = 0, itemsCount = items.length; i < itemsCount; i++) {
                        var command = items[i].command;
                        if (command && command.option("highlighted")) {
                            this.widget.option("selectedIndex", i);
                            break
                        }
                    }
                }
            });
        var dxPivotItemWrapper = WidgetItemWrapperBase.inherit({_createWidgetItemCore: function(itemOptions, executeCommandCallback) {
                    itemOptions.title = itemOptions.text;
                    return itemOptions
                }});
        var dxPivotAdapter = WidgetAdapterBase.inherit({
                ctor: function($widgetElement) {
                    this.callBase($widgetElement);
                    this.widget.option("onSelectionChanged", $.proxy(this._onPivotSelectionChange, this))
                },
                _onPivotSelectionChange: function(e) {
                    if (e.addedItems.length && e.removedItems.length && e.addedItems[0] && e.addedItems[0].command)
                        e.addedItems[0].command.execute(e)
                },
                _getWidgetByElement: function($element) {
                    return $element.dxPivot("instance")
                },
                _createItemWrapper: function(command, containerOptions) {
                    return new dxPivotItemWrapper(command, containerOptions)
                },
                addCommand: function(command, containerOptions) {
                    this.callBase(command, containerOptions);
                    this._updateSelectedIndex()
                },
                _onCommandChanged: function(args) {
                    var optionName = args.name,
                        newValue = args.value;
                    if (optionName === "visible")
                        this._rerenderPivot();
                    else if (optionName === "highlighted" && newValue)
                        this._updateSelectedIndex();
                    this.callBase(args)
                },
                _addItemToWidget: function(itemWrapper) {
                    if (itemWrapper.command.option("visible"))
                        this.callBase(itemWrapper)
                },
                _updateSelectedIndex: function() {
                    var pivot = this.widget,
                        items = pivot.option("items") || [];
                    DX.fx.off = true;
                    for (var i = 0, itemsCount = items.length; i < itemsCount; i++) {
                        var command = items[i].command;
                        if (command && command.option("highlighted")) {
                            pivot.option("selectedIndex", i);
                            break
                        }
                    }
                    DX.fx.off = false
                },
                _rerenderPivot: function() {
                    var that = this;
                    that.widget.option("items", []);
                    $.each(that.itemWrappers, function(index, itemWrapper) {
                        if (itemWrapper.command.option("visible"))
                            that._addItemToWidget(itemWrapper)
                    });
                    that.refresh();
                    that._updateSelectedIndex()
                }
            });
        var dxSlideOutItemWrapper = WidgetItemWrapperBase.inherit({});
        var dxSlideOutAdapter = WidgetAdapterBase.inherit({
                ctor: function($widgetElement) {
                    this.callBase($widgetElement);
                    this._commandToWidgetItemOptionNames = {title: "text"};
                    this.widget.option("onItemClick", $.proxy(this._onSlideOutItemClick, this))
                },
                _onSlideOutItemClick: function(e) {
                    e.itemData.command.execute(e)
                },
                _getWidgetByElement: function($element) {
                    return $element.dxSlideOut("instance")
                },
                _createItemWrapper: function(command, containerOptions) {
                    return new dxSlideOutItemWrapper(command, containerOptions)
                },
                _updateSelectedIndex: function() {
                    var items = this.widget.option("items") || [];
                    for (var i = 0, itemsCount = items.length; i < itemsCount; i++) {
                        var command = items[i].command;
                        if (command && command.option("highlighted")) {
                            this.widget.option("selectedIndex", i);
                            break
                        }
                    }
                },
                addCommand: function(command, containerOptions) {
                    this.callBase(command, containerOptions);
                    this._updateSelectedIndex()
                },
                _onCommandChanged: function(args) {
                    var optionName = args.name,
                        newValue = args.value;
                    if (optionName === "highlighted" && newValue)
                        this._updateSelectedIndex();
                    this.callBase(args)
                }
            });
        var adapters = DX.framework.html.commandToDXWidgetAdapters = {};
        adapters.dxToolbar = new CommandToWidgetAdapter(function($widgetElement) {
            return new dxToolbarAdapter($widgetElement)
        });
        adapters.dxList = new CommandToWidgetAdapter(function($widgetElement) {
            return new dxListAdapter($widgetElement)
        });
        adapters.dxNavBar = new CommandToWidgetAdapter(function($widgetElement) {
            return new dxNavBarAdapter($widgetElement)
        });
        adapters.dxPivot = new CommandToWidgetAdapter(function($widgetElement) {
            return new dxPivotAdapter($widgetElement)
        });
        adapters.dxSlideOut = new CommandToWidgetAdapter(function($widgetElement) {
            return new dxSlideOutAdapter($widgetElement)
        });
        DX.framework.html.WidgetItemWrapperBase = WidgetItemWrapperBase;
        DX.framework.html.WidgetAdapterBase = WidgetAdapterBase
    })(jQuery, DevExpress);
    /*! Module framework, file framework.commandManager.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            errors = DevExpress.require("/framework/framework.errors"),
            registerComponent = DX.require("/componentRegistrator");
        var CommandContainer = DX.framework.html.MarkupComponent.inherit({
                ctor: function(element, options) {
                    if ($.isPlainObject(element)) {
                        options = element;
                        element = $("<div />")
                    }
                    this.callBase(element, options)
                },
                _setDefaultOptions: function() {
                    this.callBase();
                    this.option({id: null})
                },
                _render: function() {
                    this.callBase();
                    this.element().addClass("dx-command-container")
                }
            });
        registerComponent("dxCommandContainer", DX.framework, CommandContainer);
        DX.framework.html.CommandManager = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this.defaultWidgetAdapter = options.defaultWidgetAdapter || this._getDefaultWidgetAdapter();
                this.commandMapping = options.commandMapping || new DX.framework.CommandMapping
            },
            _getDefaultWidgetAdapter: function() {
                return {
                        addCommand: $.noop,
                        clearContainer: $.noop
                    }
            },
            _getContainerAdapter: function($container) {
                var componentNames = $container.data("dxComponents"),
                    adapters = DX.framework.html.commandToDXWidgetAdapters;
                if (componentNames)
                    for (var index in componentNames) {
                        var widgetName = componentNames[index];
                        if (widgetName in adapters)
                            return adapters[widgetName]
                    }
                return this.defaultWidgetAdapter
            },
            findCommands: function($view) {
                var result = $.map($view.addBack().find(".dx-command"), function(element) {
                        return $(element).dxCommand("instance")
                    });
                return result
            },
            findCommandContainers: function($markup) {
                var result = $.map($markup.find(".dx-command-container"), function(element) {
                        return $(element).dxCommandContainer("instance")
                    });
                return result
            },
            _checkCommandId: function(id, command) {
                if (id === null)
                    throw errors.Error("E3010", command.element().get(0).outerHTML);
            },
            renderCommandsToContainers: function(commands, containers) {
                var that = this,
                    commandHash = {},
                    commandIds = [],
                    deferreds = [];
                $.each(commands, function(i, command) {
                    var id = command.option("id");
                    that._checkCommandId(id, command);
                    commandIds.push(id);
                    commandHash[id] = command
                });
                that.commandMapping.checkCommandsExist(commandIds);
                $.each(containers, function(k, container) {
                    var commandInfos = [];
                    $.each(commandHash, function(id, command) {
                        var commandId = id;
                        var commandOptions = that.commandMapping.getCommandMappingForContainer(commandId, container.option("id"));
                        if (commandOptions)
                            commandInfos.push({
                                command: command,
                                options: commandOptions
                            })
                    });
                    if (commandInfos.length) {
                        var deferred = that._attachCommandsToContainer(container.element(), commandInfos);
                        if (deferred)
                            deferreds.push(deferred)
                    }
                });
                return $.when.apply($, deferreds)
            },
            clearContainer: function(container) {
                var $container = container.element(),
                    adapter = this._getContainerAdapter($container);
                adapter.clearContainer($container)
            },
            _arrangeCommandsToContainers: function(commands, containers) {
                errors.log("W0002", "CommandManager", "_arrangeCommandsToContainers", "14.1", "Use the 'renderCommandsToContainers' method instead.");
                this.renderCommandsToContainers(commands, containers)
            },
            _attachCommandsToContainer: function($container, commandInfos) {
                var adapter = this._getContainerAdapter($container),
                    result;
                if (adapter.beginUpdate)
                    adapter.beginUpdate($container);
                $.each(commandInfos, function(index, commandInfo) {
                    adapter.addCommand($container, commandInfo.command, commandInfo.options)
                });
                if (adapter.endUpdate)
                    result = adapter.endUpdate($container);
                return result
            }
        })
    })(jQuery, DevExpress);
    /*! Module framework, file framework.layoutController.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            EventsMixin = DX.require("/eventsMixin"),
            errors = DevExpress.require("/framework/framework.errors"),
            commonUtils = DX.require("/utils/utils.common"),
            domUtils = DX.require("/utils/utils.dom"),
            HIDDEN_BAG_ID = "__hidden-bag",
            TRANSITION_SELECTOR = ".dx-transition:not(.dx-transition .dx-transition)",
            CONTENT_SELECTOR = ".dx-content",
            DEFAULT_COMMAND_RENDER_STAGE = "onViewShown",
            CONTENT_RENDERED_EVENT_NAME = "dxcontentrendered.layoutController",
            PENDING_RENDERING_SELECTOR = ".dx-pending-rendering",
            PENDING_RENDERING_MANUAL_SELECTOR = ".dx-pending-rendering-manual";
        var transitionSelector = function(transitionName) {
                return ".dx-transition-" + transitionName
            };
        DX.framework.html.DefaultLayoutController = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this.name = options.name || "";
                this._layoutModel = options.layoutModel || {};
                this._defaultPaneName = options.defaultPaneName || "content";
                this._transitionDuration = options.transitionDuration === undefined ? 400 : options.transitionDuration
            },
            init: function(options) {
                options = options || {};
                this._visibleViews = {};
                this._$viewPort = options.$viewPort || $("body");
                this._commandManager = options.commandManager;
                this._viewEngine = options.viewEngine;
                this.transitionExecutor = new DX.TransitionExecutor;
                this._prepareTemplates();
                this._$viewPort.append(this.element());
                this._hideElements(this.element());
                if (options.templateContext) {
                    this._templateContext = options.templateContext;
                    this._proxiedTemplateContextChangedHandler = $.proxy(this._templateContextChangedHandler, this)
                }
            },
            activate: function() {
                if (this._disabledState) {
                    this._disabledState = false;
                    this._notifyShowing();
                    return $.Deferred().resolve().promise()
                }
                var $rootElement = this.element();
                this._showElements($rootElement);
                this._attachRefreshViewRequiredHandler();
                return $.Deferred().resolve().promise()
            },
            deactivate: function() {
                this._disabledState = false;
                this._releaseVisibleViews();
                this._hideElements(this.element());
                this._detachRefreshViewRequiredHandler();
                return $.Deferred().resolve().promise()
            },
            disable: function() {
                this._disabledState = true;
                this._notifyHidden()
            },
            activeViewInfo: function() {
                return this._visibleViews[this._defaultPaneName]
            },
            _notifyShowing: function() {
                var that = this;
                $.each(this._visibleViews, function(index, viewInfo) {
                    that.fireEvent("viewShowing", [viewInfo])
                })
            },
            _notifyHidden: function() {
                var that = this;
                $.each(this._visibleViews, function(index, viewInfo) {
                    that.fireEvent("viewHidden", [viewInfo])
                })
            },
            _applyTemplate: function($elements, model) {
                $elements.each(function(i, element) {
                    DX.framework.templateProvider.applyTemplate(element, model)
                })
            },
            _releaseVisibleViews: function() {
                var that = this;
                $.each(this._visibleViews, function(index, viewInfo) {
                    that._hideView(viewInfo);
                    that._releaseView(viewInfo)
                });
                this._visibleViews = {}
            },
            _templateContextChangedHandler: function() {
                $.each(this._visibleViews, $.proxy(function(index, viewInfo) {
                    this.showView(viewInfo)
                }, this))
            },
            _attachRefreshViewRequiredHandler: function() {
                if (this._templateContext)
                    this._templateContext.on("optionChanged", this._proxiedTemplateContextChangedHandler)
            },
            _detachRefreshViewRequiredHandler: function() {
                if (this._templateContextChanged)
                    this._templateContext.off("optionChanged", this._proxiedTemplateContextChangedHandler)
            },
            _getPreviousViewInfo: function(viewInfo) {
                return this._visibleViews[this._getViewPaneName(viewInfo.viewTemplateInfo)]
            },
            _prepareTemplates: function() {
                var that = this;
                var $layoutTemplate = that._viewEngine.getLayoutTemplate(this._getLayoutTemplateName());
                that._$layoutTemplate = $layoutTemplate;
                that._$mainLayout = that._createEmptyLayout();
                that._showElements(that._$mainLayout);
                that._applyTemplate(that._$mainLayout, that._layoutModel);
                that._$navigationWidget = that._createNavigationWidget()
            },
            renderNavigation: function(navigationCommands) {
                this._clearNavigationWidget();
                this._renderNavigationImpl(navigationCommands)
            },
            _renderNavigationImpl: function(navigationCommands) {
                this._renderCommands(this._$mainLayout, navigationCommands)
            },
            _createNavigationWidget: function() {
                var containers = this._findCommandContainers(this._$mainLayout),
                    result;
                $.each(containers, function(k, container) {
                    if (container.option("id") === "global-navigation") {
                        result = container.element();
                        return false
                    }
                });
                return result
            },
            _clearNavigationWidget: function() {
                if (this._$navigationWidget)
                    this._commandManager.clearContainer(this._$navigationWidget.dxCommandContainer("instance"))
            },
            element: function() {
                return this._$mainLayout
            },
            _getViewFrame: function(viewInfo) {
                return this._$mainLayout
            },
            _getLayoutTemplateName: function() {
                return this.name
            },
            _applyModelToTransitionElements: function($markup, model) {
                var that = this;
                this._getTransitionElements($markup).each(function(i, item) {
                    that._applyTemplate($(item).children(), model)
                })
            },
            _createViewLayoutTemplate: function() {
                var that = this;
                var $viewLayoutTemplate = that._$layoutTemplate.clone();
                this._hideElements($viewLayoutTemplate);
                return $viewLayoutTemplate
            },
            _createEmptyLayout: function() {
                var that = this;
                var $result = that._$layoutTemplate.clone();
                this._hideElements($result);
                this._getTransitionElements($result).empty();
                $result.children(CONTENT_SELECTOR).remove();
                return $result
            },
            _getTransitionElements: function($markup) {
                return $markup.find(TRANSITION_SELECTOR).addBack(TRANSITION_SELECTOR)
            },
            showView: function(viewInfo, direction) {
                direction = direction || "forward";
                var that = this,
                    previousViewInfo = that._getPreviousViewInfo(viewInfo),
                    previousViewTemplateId = previousViewInfo === viewInfo ? previousViewInfo.currentViewTemplateId : undefined;
                this._defineCurrentViewTemplateId(viewInfo);
                if (previousViewTemplateId && previousViewTemplateId === viewInfo.currentViewTemplateId && viewInfo === previousViewInfo)
                    return $.Deferred().resolve().promise();
                that._ensureViewRendered(viewInfo);
                that.fireEvent("viewShowing", [viewInfo, direction]);
                return this._showViewImpl(viewInfo, direction, previousViewTemplateId).done(function() {
                        that._onViewShown(viewInfo)
                    })
            },
            disposeView: function(viewInfo) {
                this._clearRenderResult(viewInfo)
            },
            _clearRenderResult: function(viewInfo) {
                if (viewInfo.renderResult) {
                    viewInfo.renderResult.$markup.remove();
                    viewInfo.renderResult.$viewItems.remove();
                    delete viewInfo.renderResult
                }
            },
            _prepareViewTemplate: function($viewTemplate, viewInfo){},
            _renderViewImpl: function($viewTemplate, viewInfo) {
                var that = this,
                    allowedChildrenSelector = ".dx-command,.dx-content,script",
                    $layout = this._createViewLayoutTemplate(),
                    $viewItems,
                    isSimplifiedMarkup = true,
                    outOfContentItems = $();
                if ($viewTemplate.children(allowedChildrenSelector).length === 0)
                    this._viewEngine._wrapViewDefaultContent($viewTemplate);
                $viewItems = $viewTemplate.children();
                this._applyModelToTransitionElements($layout, viewInfo.model);
                this._viewEngine.applyLayout($viewTemplate, $layout);
                $viewItems.each(function(i, item) {
                    var $item = $(item);
                    that._applyTemplate($item, viewInfo.model);
                    if ($item.is(allowedChildrenSelector))
                        isSimplifiedMarkup = false;
                    else
                        outOfContentItems = outOfContentItems.add($item)
                });
                if (outOfContentItems.length && !isSimplifiedMarkup)
                    throw errors.Error("E3014", outOfContentItems[0].outerHTML);
                viewInfo.renderResult = viewInfo.renderResult || {};
                viewInfo.renderResult.$viewItems = $viewItems;
                viewInfo.renderResult.$markup = $layout
            },
            _renderCommands: function($markup, commands) {
                var commandContainers = this._findCommandContainers($markup);
                return this._commandManager.renderCommandsToContainers(commands, commandContainers)
            },
            _prepareViewCommands: function(viewInfo) {
                var $viewItems = viewInfo.renderResult.$viewItems,
                    viewCommands = this._commandManager.findCommands($viewItems),
                    commandsToRenderMap = {};
                viewInfo.commands = DX.framework.utils.mergeCommands(viewInfo.commands || [], viewCommands);
                viewInfo.commandsToRenderMap = commandsToRenderMap;
                $.each(viewInfo.commands, function(index, command) {
                    var renderStage = command.option("renderStage") || DEFAULT_COMMAND_RENDER_STAGE,
                        targetArray = commandsToRenderMap[renderStage] = commandsToRenderMap[renderStage] || [];
                    targetArray.push(command)
                })
            },
            _applyViewCommands: function(viewInfo, renderStage) {
                renderStage = renderStage || DEFAULT_COMMAND_RENDER_STAGE;
                var commandsToRender = viewInfo.commandsToRenderMap[renderStage],
                    $markup = viewInfo.renderResult.$markup,
                    result;
                if (commandsToRender) {
                    result = this._renderCommands($markup, commandsToRender);
                    delete viewInfo.commandsToRenderMap[renderStage]
                }
                else
                    result = $.Deferred().resolve().promise();
                return result
            },
            _findCommandContainers: function($markup) {
                return domUtils.createComponents($markup, ["dxCommandContainer"])
            },
            _defineCurrentViewTemplateId: function(viewInfo) {
                var viewTemplateInstance = viewInfo.$viewTemplate ? viewInfo.$viewTemplate.dxView("instance") : this._viewEngine.getViewTemplateInfo(viewInfo.viewName),
                    currentViewTemplateId = viewTemplateInstance.getId();
                viewInfo.currentViewTemplateId = currentViewTemplateId
            },
            _ensureViewRendered: function(viewInfo) {
                var $cachedMarkup = viewInfo.renderResult && viewInfo.renderResult.markupCache[viewInfo.currentViewTemplateId];
                if ($cachedMarkup)
                    viewInfo.renderResult.$markup = $cachedMarkup;
                else {
                    this._renderView(viewInfo);
                    viewInfo.renderResult.markupCache = viewInfo.renderResult.markupCache || {};
                    viewInfo.renderResult.markupCache[viewInfo.currentViewTemplateId] = viewInfo.renderResult.$markup
                }
            },
            _renderView: function(viewInfo) {
                var $viewTemplate = viewInfo.$viewTemplate || this._viewEngine.getViewTemplate(viewInfo.viewName);
                this._prepareViewTemplate($viewTemplate, viewInfo);
                this._renderViewImpl($viewTemplate, viewInfo);
                this._prepareViewCommands(viewInfo);
                this._applyViewCommands(viewInfo, "onViewRendering");
                this._appendViewToLayout(viewInfo);
                $viewTemplate.remove();
                this._onRenderComplete(viewInfo);
                this.fireEvent("viewRendered", [viewInfo])
            },
            _appendViewToLayout: function(viewInfo) {
                var that = this,
                    $viewFrame = that._getViewFrame(viewInfo),
                    $markup = viewInfo.renderResult.$markup,
                    $transitionContentElements = $(),
                    animationItems = [];
                $.each($markup.find(".dx-content-placeholder"), function(index, el) {
                    DX.framework.prepareTransition($(el), $(el).attr("data-dx-content-placeholder-name"))
                });
                $.each(that._getTransitionElements($viewFrame), function(index, transitionElement) {
                    var $transition = $(transitionElement),
                        $viewElement = $markup.find(transitionSelector($transition.attr("data-dx-transition-name"))).children(),
                        animationItem = {
                            $element: $viewElement,
                            animation: $transition.attr("data-dx-transition-type")
                        };
                    animationItems.push(animationItem);
                    $transition.append($viewElement);
                    that._showViewElements($viewElement);
                    domUtils.triggerShownEvent($viewElement);
                    $transitionContentElements = $transitionContentElements.add($viewElement)
                });
                that._$mainLayout.append(viewInfo.renderResult.$viewItems.filter(".dx-command"));
                $markup.remove();
                viewInfo.renderResult.$markup = $transitionContentElements;
                viewInfo.renderResult.animationItems = animationItems
            },
            _onRenderComplete: function(viewInfo){},
            _onViewShown: function(viewInfo) {
                $(document).trigger("dx.viewchanged")
            },
            _enter: function(animationItems, animationModifier) {
                var transitionExecutor = this.transitionExecutor;
                $.each(animationItems, function(index, item) {
                    transitionExecutor.enter(item.$element, item.animation, animationModifier)
                })
            },
            _leave: function(animationItems, animationModifier) {
                var transitionExecutor = this.transitionExecutor;
                $.each(animationItems, function(index, item) {
                    transitionExecutor.leave(item.$element, item.animation, animationModifier)
                })
            },
            _doTransition: function(oldViewInfo, newViewInfo, animationModifier) {
                if (oldViewInfo)
                    this._leave(oldViewInfo.renderResult.animationItems, animationModifier);
                this._enter(newViewInfo.renderResult.animationItems, animationModifier);
                this._showView(newViewInfo);
                return this.transitionExecutor.start()
            },
            _showViewImpl: function(viewInfo, direction, previousViewTemplateId) {
                var that = this,
                    result,
                    previousViewInfo = this._getPreviousViewInfo(viewInfo),
                    animationModifier = {direction: direction};
                if (previousViewInfo === viewInfo)
                    previousViewInfo = undefined;
                if (!previousViewInfo)
                    animationModifier.duration = 0;
                result = that._doTransition(previousViewInfo, viewInfo, animationModifier).then(function() {
                    return that._changeView(viewInfo, previousViewTemplateId)
                });
                return result
            },
            _releaseView: function(viewInfo) {
                this.fireEvent("viewReleased", [viewInfo])
            },
            _getReadyForRenderDeferredItems: function(viewInfo) {
                return $.Deferred().resolve().promise()
            },
            _changeView: function(viewInfo, previousViewTemplateId) {
                var that = this;
                if (previousViewTemplateId)
                    that._hideView(viewInfo, previousViewTemplateId);
                else {
                    var previousViewInfo = that._getPreviousViewInfo(viewInfo);
                    if (previousViewInfo && previousViewInfo !== viewInfo) {
                        that._hideView(previousViewInfo);
                        that._releaseView(previousViewInfo)
                    }
                    this._visibleViews[this._getViewPaneName(viewInfo.viewTemplateInfo)] = viewInfo
                }
                this._subscribeToDeferredItems(viewInfo);
                return this._getReadyForRenderDeferredItems(viewInfo).then(function() {
                        return that._applyViewCommands(viewInfo)
                    }).then(function() {
                        return that._renderDeferredItems(viewInfo.renderResult.$markup)
                    })
            },
            _subscribeToDeferredItems: function(viewInfo) {
                var that = this,
                    $markup = viewInfo.renderResult.$markup;
                $markup.find(PENDING_RENDERING_SELECTOR).add($markup.filter(PENDING_RENDERING_SELECTOR)).each(function() {
                    var eventData = {
                            viewInfo: viewInfo,
                            context: that
                        };
                    $(this).on(CONTENT_RENDERED_EVENT_NAME, eventData, that._onDeferredContentRendered)
                })
            },
            _onDeferredContentRendered: function(event) {
                var $element = $(event.target),
                    viewInfo = event.data.viewInfo,
                    that = event.data.context;
                $element.off(CONTENT_RENDERED_EVENT_NAME, that._onDeferredContentRendered);
                that._renderCommands($element, viewInfo.commands)
            },
            _renderDeferredItems: function($items) {
                var that = this,
                    result = $.Deferred();
                var $pendingItem = $items.find(PENDING_RENDERING_MANUAL_SELECTOR).add($items.filter(PENDING_RENDERING_MANUAL_SELECTOR)).first();
                if ($pendingItem.length) {
                    var render = $pendingItem.data("dx-render-delegate");
                    commonUtils.executeAsync(function() {
                        render().then(function() {
                            return that._renderDeferredItems($items)
                        }).then(function() {
                            result.resolve()
                        })
                    })
                }
                else
                    result.resolve();
                return result.promise()
            },
            _getViewPaneName: function(viewTemplateInfo) {
                return this._defaultPaneName
            },
            _hideElements: function($elements) {
                $elements.addClass("dx-fast-hidden")
            },
            _showElements: function($elements) {
                $elements.removeClass("dx-fast-hidden")
            },
            _hideViewElements: function($elements) {
                this._patchIDs($elements);
                this._disableInputs($elements);
                $elements.removeClass("dx-active-view").addClass("dx-inactive-view")
            },
            _hideView: function(viewInfo, templateId) {
                if (viewInfo.renderResult) {
                    var $markupToHide = templateId === undefined ? viewInfo.renderResult.$markup : viewInfo.renderResult.markupCache[templateId];
                    this._hideViewElements($markupToHide);
                    this.fireEvent("viewHidden", [viewInfo])
                }
            },
            _showViewElements: function($elements) {
                this._unpatchIDs($elements);
                this._enableInputs($elements);
                $elements.removeClass("dx-inactive-view").addClass("dx-active-view");
                this._skipAnimation($elements)
            },
            _showView: function(viewInfo) {
                if (viewInfo.renderResult)
                    this._showViewElements(viewInfo.renderResult.$markup)
            },
            _skipAnimation: function($elements) {
                $elements.addClass("dx-skip-animation");
                for (var i = 0; i < $elements.length; i++)
                    $elements.eq(i).css("transform");
                $elements.removeClass("dx-skip-animation")
            },
            _patchIDs: function($markup) {
                this._processIDs($markup, function(id) {
                    var result = id;
                    if (id.indexOf(HIDDEN_BAG_ID) === -1)
                        result = HIDDEN_BAG_ID + "-" + id;
                    return result
                })
            },
            _unpatchIDs: function($markup) {
                this._processIDs($markup, function(id) {
                    var result = id;
                    if (id.indexOf(HIDDEN_BAG_ID) === 0)
                        result = id.substr(HIDDEN_BAG_ID.length + 1);
                    return result
                })
            },
            _processIDs: function($markup, process) {
                var elementsWithIds = $markup.find("[id]");
                $.each(elementsWithIds, function(index, element) {
                    var $el = $(element),
                        id = $el.attr("id");
                    $el.attr("id", process(id))
                })
            },
            _enableInputs: function($markup) {
                var $inputs = $markup.find(":input[data-disabled=true]");
                $.each($inputs, function(index, input) {
                    $(input).removeAttr("disabled").removeAttr("data-disabled")
                })
            },
            _disableInputs: function($markup) {
                var $inputs = $markup.find(":input:not([disabled], [disabled=true])");
                $.each($inputs, function(index, input) {
                    $(input).attr({
                        disabled: true,
                        "data-disabled": true
                    })
                })
            }
        }).include(EventsMixin);
        var layoutSets = DX.framework.html.layoutSets;
        layoutSets["default"] = layoutSets["default"] || [];
        layoutSets["default"].push({controller: new DX.framework.html.DefaultLayoutController})
    })(jQuery, DevExpress);
    /*! Module framework, file framework.viewEngine.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            errors = DevExpress.require("/framework/framework.errors"),
            domUtils = DX.require("/utils/utils.dom"),
            commonUtils = DX.require("/utils/utils.common"),
            registerComponent = DX.require("/componentRegistrator"),
            framework = DX.framework,
            MarkupComponent = DX.framework.html.MarkupComponent,
            MARKUP_TEMPLATE_MARKER = "MarkupTemplate:",
            _VIEW_ROLE = "dxView",
            _LAYOUT_ROLE = "dxLayout";
        registerComponent(_VIEW_ROLE, framework, MarkupComponent.inherit({
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    name: null,
                    title: null
                })
            },
            ctor: function() {
                this._id = domUtils.uniqueId();
                this.callBase.apply(this, arguments)
            },
            _render: function() {
                this.callBase();
                this.element().addClass("dx-view");
                this.element().attr("dx-data-template-id", this._id)
            },
            getId: function() {
                return this._id
            }
        }), framework);
        registerComponent(_LAYOUT_ROLE, framework, MarkupComponent.inherit({
            _setDefaultOptions: function() {
                this.callBase();
                this.option({name: null})
            },
            _render: function() {
                this.callBase();
                this.element().addClass("dx-layout")
            }
        }));
        registerComponent("dxViewPlaceholder", framework, MarkupComponent.inherit({
            _setDefaultOptions: function() {
                this.callBase();
                this.option({viewName: null})
            },
            _render: function() {
                this.callBase();
                this.element().addClass("dx-view-placeholder")
            }
        }));
        var setupTransitionElement = function($element, transitionType, transitionName, contentCssPosition) {
                if (contentCssPosition === "absolute")
                    $element.addClass("dx-transition-absolute");
                else
                    $element.addClass("dx-transition-static");
                $element.addClass("dx-transition").addClass("dx-transition-" + transitionName).addClass("dx-transition-" + transitionType).attr("data-dx-transition-type", transitionType).attr("data-dx-transition-name", transitionName)
            };
        var setupTransitionInnerElement = function($element) {
                $element.addClass("dx-transition-inner-wrapper")
            };
        registerComponent("dxTransition", framework, MarkupComponent.inherit({
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    name: null,
                    type: undefined,
                    animation: "slide"
                })
            },
            _render: function() {
                this.callBase();
                var element = this.element();
                setupTransitionElement(element, this.option("type") || this.option("animation"), this.option("name"), "absolute");
                element.wrapInner("<div/>");
                setupTransitionInnerElement(element.children());
                if (this.option("type"))
                    errors.log("W0003", "dxTransition", "type", "15.1", "Use the 'animation' property instead")
            },
            _clean: function() {
                this.callBase();
                this.element().empty()
            }
        }));
        DX.framework.prepareTransition = function($element, targetPlaceholderName) {
            if ($element.children(".dx-content").length === 0) {
                $element.wrapInner("<div>");
                $element.children().dxContent({targetPlaceholder: targetPlaceholderName})
            }
        };
        registerComponent("dxContentPlaceholder", framework, MarkupComponent.inherit({
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    name: null,
                    transition: undefined,
                    animation: "none",
                    contentCssPosition: "absolute"
                })
            },
            _render: function() {
                this.callBase();
                var $element = this.element();
                $element.addClass("dx-content-placeholder").addClass("dx-content-placeholder-" + this.option("name"));
                $element.attr("data-dx-content-placeholder-name", this.option("name"));
                setupTransitionElement($element, this.option("transition") || this.option("animation"), this.option("name"), this.option("contentCssPosition"));
                if (this.option("transition"))
                    errors.log("W0003", "dxContentPlaceholder", "transition", "15.1", "Use the 'animation' property instead")
            },
            prepareTransition: function() {
                DX.framework.prepareTransition(this.element(), this.option("name"))
            }
        }));
        registerComponent("dxContent", framework, MarkupComponent.inherit({
            _setDefaultOptions: function() {
                this.callBase();
                this.option({targetPlaceholder: null})
            },
            _optionChanged: function() {
                this._refresh()
            },
            _clean: function() {
                this.callBase();
                this.element().removeClass(this._currentClass)
            },
            _render: function() {
                this.callBase();
                var element = this.element();
                element.addClass("dx-content");
                this._currentClass = "dx-content-" + this.option("targetPlaceholder");
                element.attr("data-dx-target-placeholder-id", this.option("targetPlaceholder"));
                element.addClass(this._currentClass);
                setupTransitionInnerElement(element)
            }
        }));
        framework.html.ViewEngine = Class.inherit({
            ctor: function(options) {
                options = options || {};
                this.$root = options.$root;
                this.device = options.device || {};
                this.dataOptionsAttributeName = options.dataOptionsAttributeName || "data-options";
                this._templateMap = {};
                this._pendingViewContainer = null;
                this.markupLoaded = $.Callbacks();
                this._templateContext = options.templateContext;
                this._$skippedMarkup = $();
                if (options.templatesVersion !== undefined && options.templateCacheStorage) {
                    this._templateCacheEnabled = true;
                    this._templatesVersion = "v_" + options.templatesVersion;
                    this._templateCacheStorage = options.templateCacheStorage;
                    this._templateCacheKey = "dxTemplateCache_" + DevExpress.VERSION + "_" + JSON.stringify(this.device)
                }
            },
            _enumerateTemplates: function(processFn) {
                var that = this;
                $.each(that._templateMap, function(name, templatesByRoleMap) {
                    $.each(templatesByRoleMap, function(role, templates) {
                        $.each(templates, function(index, template) {
                            processFn(template)
                        })
                    })
                })
            },
            _findComponent: function(name, role) {
                var components = (this._templateMap[name] || {})[role] || [],
                    filter = this._templateContext && this._templateContext.option() || {};
                components = this._filterTemplates(filter, components);
                this._checkMatchedTemplates(components);
                return components[0]
            },
            _findTemplate: function(name, role) {
                var component = this._findComponent(name, role);
                if (!component)
                    throw errors.Error("E3013", role, name);
                var $template = component.element(),
                    $result;
                if (!component._isStaticComponentsCreated) {
                    domUtils.createComponents($template, ["dxContent", "dxContentPlaceholder", "dxTransition"]);
                    component._isStaticComponentsCreated = true
                }
                $result = $template.clone().removeClass("dx-hidden");
                return $result
            },
            _loadTemplatesFromMarkupCore: function($markup) {
                var that = this;
                if ($markup.find("[data-dx-role]").length)
                    throw errors.Error("E3019");
                that.markupLoaded.fire({markup: $markup});
                var components = domUtils.createComponents($markup, [_VIEW_ROLE, _LAYOUT_ROLE]);
                $.each(components, function(index, component) {
                    var $element = component.element();
                    $element.addClass("dx-hidden");
                    that._registerTemplateComponent(component);
                    component.element().detach()
                });
                var $skipped = $markup.filter("script");
                $skipped.appendTo(that.$root);
                that._$skippedMarkup = that._$skippedMarkup.add($skipped)
            },
            _registerTemplateComponent: function(component) {
                var role = component.NAME,
                    options = component.option(),
                    templateName = options.name,
                    componentsByRoleMap = this._templateMap[templateName] || {};
                componentsByRoleMap[role] = componentsByRoleMap[role] || [];
                componentsByRoleMap[role].push(component);
                this._templateMap[templateName] = componentsByRoleMap
            },
            _applyPartialViews: function($render) {
                var that = this;
                domUtils.createComponents($render, ["dxViewPlaceholder"]);
                $.each($render.find(".dx-view-placeholder"), function() {
                    var $partialPlaceholder = $(this);
                    if ($partialPlaceholder.children().length)
                        return;
                    var viewName = $partialPlaceholder.data("dxViewPlaceholder").option("viewName"),
                        $view = that._findTemplate(viewName, _VIEW_ROLE);
                    that._applyPartialViews($view);
                    $partialPlaceholder.append($view);
                    $view.removeClass("dx-hidden")
                })
            },
            _ajaxImpl: function() {
                return $.ajax.apply($, arguments)
            },
            _loadTemplatesFromURL: function(url) {
                var that = this,
                    options = this._getLoadOptions(),
                    deferred = $.Deferred();
                url = options.winPhonePrefix + url;
                this._ajaxImpl({
                    url: url,
                    isLocal: options.isLocal,
                    dataType: "html"
                }).done(function(data) {
                    that._loadTemplatesFromMarkupCore(domUtils.createMarkupFromString(data));
                    deferred.resolve()
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    var error = errors.Error("E3021", url, errorThrown);
                    deferred.reject(error)
                });
                return deferred.promise()
            },
            _getLoadOptions: function() {
                if (location.protocol.indexOf("wmapp") >= 0)
                    return {
                            winPhonePrefix: location.protocol + "www/",
                            isLocal: true
                        };
                return {
                        winPhonePrefix: "",
                        isLocal: undefined
                    }
            },
            _loadExternalTemplates: function() {
                var tasks = [],
                    that = this;
                $("head").find("link[rel='dx-template']").each(function(index, link) {
                    var task = that._loadTemplatesFromURL($(link).attr("href"));
                    tasks.push(task)
                });
                return $.when.apply($, tasks)
            },
            _processTemplates: function() {
                var that = this;
                $.each(that._templateMap, function(name, templatesByRoleMap) {
                    $.each(templatesByRoleMap, function(role, templates) {
                        that._filterTemplatesByDevice(templates)
                    })
                });
                that._enumerateTemplates(function(template) {
                    that._applyPartialViews(template.element())
                })
            },
            _filterTemplatesByDevice: function(components) {
                var filteredComponents = this._filterTemplates(this.device, components);
                $.each(components, function(index, component) {
                    if ($.inArray(component, filteredComponents) < 0)
                        component.element().remove()
                });
                components.length = 0;
                components.push.apply(components, filteredComponents)
            },
            _filterTemplates: function(filter, components) {
                return commonUtils.findBestMatches(filter, components, function(component) {
                        return component.option()
                    })
            },
            _checkMatchedTemplates: function(bestMatches) {
                if (bestMatches.length > 1) {
                    var message = "";
                    $.each(bestMatches, function(index, match) {
                        message += match.element().attr("data-options") + "\r\n"
                    });
                    throw errors.Error("E3020", message, JSON.stringify(this.device));
                }
            },
            _wrapViewDefaultContent: function($viewTemplate) {
                $viewTemplate.wrapInner("<div class=\"dx-full-height\"></div>");
                $viewTemplate.children().eq(0).dxContent({targetPlaceholder: 'content'})
            },
            _initDefaultLayout: function() {
                this._$defaultLayoutTemplate = $("<div class=\"dx-full-height\" data-options=\"dxLayout : { name: 'default' } \"> \n" + "    <div class=\"dx-full-height\" data-options=\"dxContentPlaceholder : { name: 'content' } \" ></div> \n" + "</div>");
                domUtils.createComponents(this._$defaultLayoutTemplate)
            },
            _getDefaultLayoutTemplate: function() {
                return this._$defaultLayoutTemplate.clone()
            },
            applyLayout: function($view, $layout) {
                if ($layout === undefined || $layout.length === 0)
                    $layout = this._getDefaultLayoutTemplate();
                if ($view.children(".dx-content").length === 0)
                    this._wrapViewDefaultContent($view);
                var $toMerge = $().add($layout).add($view);
                var $placeholderContents = $toMerge.find(".dx-content");
                $.each($placeholderContents, function() {
                    var $placeholderContent = $(this);
                    var placeholderId = $placeholderContent.attr("data-dx-target-placeholder-id");
                    var $placeholder = $toMerge.find(".dx-content-placeholder-" + placeholderId);
                    $placeholder.empty();
                    $placeholder.append($placeholderContent)
                });
                $placeholderContents.filter(":not(.dx-content-placeholder .dx-content)").remove();
                return $layout
            },
            _loadTemplatesFromCache: function() {
                if (!this._templateCacheEnabled)
                    return;
                var cache;
                var fromJSONInterceptor = function(key, value) {
                        if (typeof value === "string" && value.indexOf(MARKUP_TEMPLATE_MARKER) === 0) {
                            var data = JSON.parse(value.substr(MARKUP_TEMPLATE_MARKER.length)),
                                type = data.type,
                                options = data.options,
                                $markup = $(data.markup);
                            options.fromCache = true;
                            return $markup[type](options)[type]("instance")
                        }
                        else if (key === "skippedMarkup")
                            return $("<div>").append($(value)).contents();
                        return value
                    };
                var toParse = this._templateCacheStorage.getItem(this._templateCacheKey);
                if (toParse)
                    try {
                        var cacheContainer = JSON.parse(toParse, fromJSONInterceptor);
                        cache = cacheContainer[this._templatesVersion]
                    }
                    catch(e) {
                        this._templateCacheStorage.removeItem(this._templateCacheKey)
                    }
                if (!cache)
                    return;
                this._templateMap = cache.templates;
                this.$root.append(cache.skippedMarkup);
                return true
            },
            _putTemplatesToCache: function() {
                if (!this._templateCacheEnabled)
                    return;
                var toJSONInterceptor = function(key, value) {
                        if (value && value.element)
                            return MARKUP_TEMPLATE_MARKER + JSON.stringify({
                                    markup: value.element().prop("outerHTML"),
                                    options: value.option(),
                                    type: value.NAME
                                });
                        else if (key === "skippedMarkup")
                            return $("<div>").append(value.clone()).html();
                        return value
                    };
                var cacheContainer = {};
                cacheContainer[this._templatesVersion] = {
                    templates: this._templateMap,
                    skippedMarkup: this._$skippedMarkup
                };
                this._templateCacheStorage.setItem(this._templateCacheKey, JSON.stringify(cacheContainer, toJSONInterceptor, 4))
            },
            init: function() {
                var that = this;
                this._initDefaultLayout();
                if (!this._loadTemplatesFromCache()) {
                    that._loadTemplatesFromMarkupCore(that.$root.children());
                    return this._loadExternalTemplates().done(function() {
                            that._processTemplates();
                            that._putTemplatesToCache()
                        })
                }
                else
                    return $.Deferred().resolve().promise()
            },
            getViewTemplate: function(viewName) {
                return this._findTemplate(viewName, _VIEW_ROLE)
            },
            getViewTemplateInfo: function(name) {
                return this._findComponent(name, _VIEW_ROLE)
            },
            getLayoutTemplate: function(layoutName) {
                if (!layoutName)
                    return this._getDefaultLayoutTemplate();
                return this._findTemplate(layoutName, _LAYOUT_ROLE)
            },
            getLayoutTemplateInfo: function(name) {
                return this._findComponent(name, _LAYOUT_ROLE)
            },
            loadTemplates: function(source) {
                var result;
                if (typeof source === "string")
                    result = this._loadTemplatesFromURL(source);
                else {
                    this._loadTemplatesFromMarkupCore(source);
                    result = $.Deferred().resolve().promise()
                }
                return result.done($.proxy(this._processTemplates, this))
            }
        })
    })(jQuery, DevExpress);
    /*! Module framework, file framework.htmlApplication.js */
    (function($, DX, undefined) {
        var Component = DX.require("/component"),
            errors = DX.require("/framework/framework.errors"),
            viewPort = DX.require("/utils/utils.viewPort").value,
            objectUtils = DX.require("/utils/utils.object"),
            domUtils = DX.require("/utils/utils.dom"),
            commonUtils = DX.require("/utils/utils.common"),
            devices = DX.require("/devices"),
            feedbackEvents = DX.require("/ui/events/ui.events.emitter.feedback"),
            frameworkNS = DX.framework,
            htmlNS = frameworkNS.html;
        var VIEW_PORT_CLASSNAME = "dx-viewport",
            LAYOUT_CHANGE_ANIMATION_NAME = "layout-change";
        htmlNS.HtmlApplication = frameworkNS.Application.inherit({
            ctor: function(options) {
                options = options || {};
                this.callBase(options);
                this._$root = $(options.rootNode || document.body);
                this._initViewport(options.viewPort);
                if (this._applicationMode === "mobileApp")
                    domUtils.initMobileViewport(options.viewPort);
                this.device = options.device || devices.current();
                this.commandManager = options.commandManager || new DX.framework.html.CommandManager({commandMapping: this.commandMapping});
                this._initTemplateContext();
                this.viewEngine = options.viewEngine || new htmlNS.ViewEngine({
                    $root: this._$root,
                    device: this.device,
                    templateCacheStorage: options.templateCacheStorage || window.localStorage,
                    templatesVersion: options.templatesVersion,
                    templateContext: this._templateContext
                });
                this.components.push(this.viewEngine);
                this._initMarkupFilters(this.viewEngine);
                this._layoutSet = options.layoutSet || DX.framework.html.layoutSets["default"];
                this._animationSet = options.animationSet || DX.framework.html.animationSets["default"];
                this._availableLayoutControllers = [];
                this._activeLayoutControllersStack = [];
                this.transitionExecutor = new DX.TransitionExecutor;
                this._initAnimations(this._animationSet)
            },
            _initAnimations: function(animationSet) {
                if (!animationSet)
                    return;
                $.each(animationSet, function(name, configs) {
                    $.each(configs, function(index, config) {
                        DX.animationPresets.registerPreset(name, config)
                    })
                });
                DX.animationPresets.applyChanges()
            },
            _localizeMarkup: function($markup) {
                DX.localization.localizeNode($markup)
            },
            _notifyIfBadMarkup: function($markup) {
                $markup.each(function() {
                    var html = $(this).html();
                    if (/href="#/.test(html))
                        errors.log("W3005", html)
                })
            },
            _initMarkupFilters: function(viewEngine) {
                var filters = [];
                filters.push(this._localizeMarkup);
                if (this._applicationMode === "mobileApp")
                    filters.push(this._notifyIfBadMarkup);
                if (viewEngine.markupLoaded)
                    viewEngine.markupLoaded.add(function(args) {
                        $.each(filters, function(_, filter) {
                            filter(args.markup)
                        })
                    })
            },
            _createViewCache: function(options) {
                var result = this.callBase(options);
                if (!options.viewCache)
                    result = new DX.framework.ConditionalViewCacheDecorator({
                        filter: function(key, viewInfo) {
                            return !viewInfo.viewTemplateInfo.disableCache
                        },
                        viewCache: result
                    });
                return result
            },
            _initViewport: function() {
                this._$viewPort = this._getViewPort();
                viewPort(this._$viewPort)
            },
            _getViewPort: function() {
                var $viewPort = $("." + VIEW_PORT_CLASSNAME);
                if (!$viewPort.length)
                    $viewPort = $("<div>").addClass(VIEW_PORT_CLASSNAME).appendTo(this._$root);
                return $viewPort
            },
            _initTemplateContext: function() {
                this._templateContext = new Component({orientation: devices.orientation()});
                devices.on("orientationChanged", $.proxy(function(args) {
                    this._templateContext.option("orientation", args.orientation)
                }, this))
            },
            _showViewImpl: function(viewInfo, direction) {
                var that = this,
                    deferred = $.Deferred(),
                    result = deferred.promise(),
                    layoutController = viewInfo.layoutController;
                that._obtainViewLink(viewInfo);
                layoutController.showView(viewInfo, direction).done(function() {
                    that._activateLayoutController(layoutController, that._getTargetNode(viewInfo), direction).done(function() {
                        deferred.resolve()
                    })
                });
                feedbackEvents.lock(result);
                return result
            },
            _resolveLayoutController: function(viewInfo) {
                var args = {
                        viewInfo: viewInfo,
                        layoutController: null,
                        availableLayoutControllers: this._availableLayoutControllers
                    };
                this._processEvent("resolveLayoutController", args, viewInfo.model);
                this._checkLayoutControllerIsInitialized(args.layoutController);
                return args.layoutController || this._resolveLayoutControllerImpl(viewInfo)
            },
            _checkLayoutControllerIsInitialized: function(layoutController) {
                if (layoutController) {
                    var isControllerInited = false;
                    $.each(this._layoutSet, function(_, controllerInfo) {
                        if (controllerInfo.controller === layoutController) {
                            isControllerInited = true;
                            return false
                        }
                    });
                    if (!isControllerInited)
                        throw errors.Error("E3024");
                }
            },
            _ensureOneLayoutControllerFound: function(target, matches) {
                var toJSONInterceptor = function(key, value) {
                        if (key === "controller")
                            return "[controller]: { name:" + value.name + " }";
                        return value
                    };
                if (!matches.length) {
                    errors.log("W3003", JSON.stringify(target, null, 4), JSON.stringify(this._availableLayoutControllers, toJSONInterceptor, 4));
                    throw errors.Error("E3011");
                }
                if (matches.length > 1) {
                    errors.log("W3004", JSON.stringify(target, null, 4), JSON.stringify(matches, toJSONInterceptor, 4));
                    throw errors.Error("E3012");
                }
            },
            _resolveLayoutControllerImpl: function(viewInfo) {
                var templateInfo = viewInfo.viewTemplateInfo || {},
                    navigateOptions = viewInfo.navigateOptions || {},
                    target = $.extend({
                        root: !viewInfo.canBack,
                        customResolveRequired: false,
                        pane: templateInfo.pane,
                        modal: navigateOptions.modal !== undefined ? navigateOptions.modal : templateInfo.modal || false
                    }, devices.current());
                var matches = commonUtils.findBestMatches(target, this._availableLayoutControllers);
                this._ensureOneLayoutControllerFound(target, matches);
                return matches[0].controller
            },
            _onNavigatingBack: function(args) {
                this.callBase.apply(this, arguments);
                if (!args.cancel && !this.canBack() && this._activeLayoutControllersStack.length > 1) {
                    var previousActiveLayoutController = this._activeLayoutControllersStack[this._activeLayoutControllersStack.length - 2],
                        previousViewInfo = previousActiveLayoutController.activeViewInfo();
                    args.cancel = true;
                    this._activateLayoutController(previousActiveLayoutController, undefined, "backward");
                    this.navigationManager.currentItem(previousViewInfo.key)
                }
            },
            _activeLayoutController: function() {
                return this._activeLayoutControllersStack.length ? this._activeLayoutControllersStack[this._activeLayoutControllersStack.length - 1] : undefined
            },
            _getTargetNode: function(viewInfo) {
                var jQueryEvent = (viewInfo.navigateOptions || {}).jQueryEvent;
                return jQueryEvent ? $(jQueryEvent.target) : undefined
            },
            _activateLayoutController: function(layoutController, targetNode, direction) {
                var that = this,
                    previousLayoutController = that._activeLayoutController();
                if (previousLayoutController === layoutController)
                    return $.Deferred().resolve().promise();
                return layoutController.activate(targetNode).then($.proxy(this._deactivatePreviousLayoutControllers, this, layoutController, direction)).then(function() {
                        that._activeLayoutControllersStack.push(layoutController)
                    })
            },
            _deactivatePreviousLayoutControllers: function(layoutController, direction) {
                var that = this,
                    tasks = [],
                    controllerToDeactivate = that._activeLayoutControllersStack.pop();
                if (!controllerToDeactivate)
                    return $.Deferred().resolve().promise();
                if (layoutController.isOverlay) {
                    that._activeLayoutControllersStack.push(controllerToDeactivate);
                    tasks.push(controllerToDeactivate.disable())
                }
                else {
                    var transitionDeferred = $.Deferred(),
                        skipAnimation = false;
                    var getControllerDeactivator = function(controllerToDeactivate, d) {
                            return function() {
                                    controllerToDeactivate.deactivate().done(function() {
                                        d.resolve()
                                    })
                                }
                        };
                    while (controllerToDeactivate && controllerToDeactivate !== layoutController) {
                        var d = $.Deferred();
                        if (controllerToDeactivate.isOverlay)
                            skipAnimation = true;
                        else
                            that.transitionExecutor.leave(controllerToDeactivate.element(), LAYOUT_CHANGE_ANIMATION_NAME, {direction: direction});
                        transitionDeferred.promise().done(getControllerDeactivator(controllerToDeactivate, d));
                        tasks.push(d.promise());
                        controllerToDeactivate = that._activeLayoutControllersStack.pop()
                    }
                    if (skipAnimation)
                        transitionDeferred.resolve();
                    else {
                        that.transitionExecutor.enter(layoutController.element(), LAYOUT_CHANGE_ANIMATION_NAME, {direction: direction});
                        that.transitionExecutor.start().done(function() {
                            transitionDeferred.resolve()
                        })
                    }
                }
                return $.when.apply($, tasks)
            },
            init: function() {
                var that = this,
                    result = this.callBase();
                result.done(function() {
                    that._initLayoutControllers();
                    that.renderNavigation()
                });
                return result
            },
            _disposeView: function(viewInfo) {
                if (viewInfo.layoutController.disposeView)
                    viewInfo.layoutController.disposeView(viewInfo);
                this.callBase(viewInfo)
            },
            viewPort: function() {
                return this._$viewPort
            },
            _createViewInfo: function(navigationItem, navigateOptions) {
                var viewInfo = this.callBase.apply(this, arguments),
                    templateInfo = this.getViewTemplateInfo(viewInfo.viewName);
                if (!templateInfo)
                    throw errors.Error("E3013", "dxView", viewInfo.viewName);
                viewInfo.viewTemplateInfo = templateInfo;
                viewInfo.layoutController = this._resolveLayoutController(viewInfo);
                return viewInfo
            },
            _createViewModel: function(viewInfo) {
                this.callBase(viewInfo);
                objectUtils.extendFromObject(viewInfo.model, viewInfo.viewTemplateInfo)
            },
            _initLayoutControllers: function() {
                var that = this;
                $.each(that._layoutSet, function(index, controllerInfo) {
                    var controller = controllerInfo.controller,
                        target = devices.current();
                    if (commonUtils.findBestMatches(target, [controllerInfo]).length) {
                        that._availableLayoutControllers.push(controllerInfo);
                        if (controller.init)
                            controller.init({
                                app: that,
                                $viewPort: that._$viewPort,
                                navigationManager: that.navigationManager,
                                viewEngine: that.viewEngine,
                                templateContext: that._templateContext,
                                commandManager: that.commandManager
                            });
                        if (controller.on) {
                            controller.on("viewReleased", function(viewInfo) {
                                that._onViewReleased(viewInfo)
                            });
                            controller.on("viewHidden", function(viewInfo) {
                                that._onViewHidden(viewInfo)
                            });
                            controller.on("viewRendered", function(viewInfo) {
                                that._processEvent("viewRendered", {viewInfo: viewInfo}, viewInfo.model)
                            });
                            controller.on("viewShowing", function(viewInfo, direction) {
                                that._processEvent("viewShowing", {
                                    viewInfo: viewInfo,
                                    direction: direction,
                                    params: viewInfo.routeData
                                }, viewInfo.model)
                            })
                        }
                    }
                })
            },
            _onViewReleased: function(viewInfo) {
                this._releaseViewLink(viewInfo)
            },
            renderNavigation: function() {
                var that = this;
                $.each(that._availableLayoutControllers, function(index, controllerInfo) {
                    var controller = controllerInfo.controller;
                    if (controller.renderNavigation)
                        controller.renderNavigation(that.navigation)
                })
            },
            getViewTemplate: function(viewName) {
                return this.viewEngine.getViewTemplate(viewName)
            },
            getViewTemplateInfo: function(viewName) {
                var viewComponent = this.viewEngine.getViewTemplateInfo(viewName);
                return viewComponent && viewComponent.option()
            },
            loadTemplates: function(source) {
                return this.viewEngine.loadTemplates(source)
            },
            templateContext: function() {
                return this._templateContext
            }
        })
    })(jQuery, DevExpress);
    DevExpress.MOD_FRAMEWORK = true
}