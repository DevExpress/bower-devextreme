/*! 
* DevExtreme (Vector Map)
* Version: 15.1.5
* Build date: Jul 15, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!DevExpress.MOD_VIZ_VECTORMAP) {
    if (!DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-vectormap, file map.js */
    (function(DX, $, undefined) {
        DX.viz.map = {};
        var _parseScalar = DX.viz.core.utils.parseScalar,
            DEFAULT_WIDTH = 800,
            DEFAULT_HEIGHT = 400,
            TOOLTIP_OFFSET = 12,
            _extend = $.extend,
            nextDataKey = 1;
        function generateDataKey() {
            return "vectormap-data-" + nextDataKey++
        }
        var Map = DX.viz.core.BaseWidget.inherit({
                _eventsMap: _extend({}, DX.viz.core.BaseWidget.prototype._eventsMap, {
                    onClick: {
                        name: "click",
                        deprecated: "click",
                        deprecatedContext: function(arg) {
                            return arg.component
                        },
                        deprecatedArgs: function(arg) {
                            return [arg.jQueryEvent]
                        }
                    },
                    click: {newName: "onClick"},
                    onCenterChanged: {
                        name: "centerChanged",
                        deprecated: "centerChanged",
                        deprecatedContext: function(arg) {
                            return arg.component
                        },
                        deprecatedArgs: function(arg) {
                            return [arg.center]
                        }
                    },
                    centerChanged: {newName: "onCenterChanged"},
                    onZoomFactorChanged: {
                        name: "zoomFactorChanged",
                        deprecated: "zoomFactorChanged",
                        deprecatedContext: function(arg) {
                            return arg.component
                        },
                        deprecatedArgs: function(arg) {
                            return [arg.zoomFactor]
                        }
                    },
                    zoomFactorChanged: {newName: "onZoomFactorChanged"},
                    onAreaClick: {
                        name: "areaClick",
                        deprecated: "areaSettings.click",
                        deprecatedContext: function(arg) {
                            return arg.target
                        },
                        deprecatedArgs: function(arg) {
                            return [arg.target, arg.jQueryEvent]
                        }
                    },
                    onAreaHoverChanged: {name: "areaHoverChanged"},
                    onAreaSelectionChanged: {
                        name: "areaSelectionChanged",
                        deprecated: "areaSettings.selectionChanged",
                        deprecatedContext: function(arg) {
                            return arg.target
                        },
                        deprecatedArgs: function(arg) {
                            return [arg.target]
                        }
                    },
                    onMarkerClick: {
                        name: "markerClick",
                        deprecated: "markerSettings.click",
                        deprecatedContext: function(arg) {
                            return arg.target
                        },
                        deprecatedArgs: function(arg) {
                            return [arg.target, arg.jQueryEvent]
                        }
                    },
                    onMarkerHoverChanged: {name: "markerHoverChanged"},
                    onMarkerSelectionChanged: {
                        name: "markerSelectionChanged",
                        deprecated: "markerSettings.selectionChanged",
                        deprecatedContext: function(arg) {
                            return arg.target
                        },
                        deprecatedArgs: function(arg) {
                            return [arg.target]
                        }
                    }
                }),
                _setDeprecatedOptions: function() {
                    this.callBase();
                    $.extend(this._deprecatedOptions, {
                        click: {
                            since: "14.2",
                            message: 'Use the "onClick" option instead'
                        },
                        centerChanged: {
                            since: "14.2",
                            message: 'Use the "onCenterChanged" option instead'
                        },
                        zoomFactorChanged: {
                            since: "14.2",
                            message: 'Use the "onZoomFactorChanged" option instead'
                        },
                        "areaSettings.click": {
                            since: "14.2",
                            message: 'Use the "onAreaClick" option instead'
                        },
                        "areaSettings.selectionChanged": {
                            since: "14.2",
                            message: 'Use the "onAreaSelectionChanged" option instead'
                        },
                        "markerSettings.click": {
                            since: "14.2",
                            message: 'Use the "onMarkerClick" option instead'
                        },
                        "markerSettings.selectionChanged": {
                            since: "14.2",
                            message: 'Use the "onMarkerSelectionChanged" option instead'
                        },
                        "markerSettings.font": {
                            since: "14.2",
                            message: 'Use the "label.font" option instead'
                        }
                    })
                },
                _rootClassPrefix: "dxm",
                _rootClass: "dxm-vector-map",
                _createThemeManager: function() {
                    return this._factory.createThemeManager()
                },
                _initBackground: function(dataKey) {
                    this._background = this._renderer.rect(0, 0, 0, 0).attr({"class": "dxm-background"}).data(dataKey, {type: "background"})
                },
                _initAreasManager: function(dataKey, notifyDirty, notifyReady) {
                    var that = this;
                    that._areasManager = that._factory.createAreasManager({
                        container: that._root,
                        renderer: that._renderer,
                        projection: that._projection,
                        themeManager: that._themeManager,
                        tracker: that._tracker,
                        dataKey: dataKey,
                        eventTrigger: that._eventTrigger,
                        dataExchanger: that._dataExchanger,
                        notifyDirty: notifyDirty,
                        notifyReady: notifyReady
                    })
                },
                _initMarkersManager: function(dataKey, notifyDirty, notifyReady) {
                    var that = this;
                    that._markersManager = that._factory.createMarkersManager({
                        container: that._root,
                        renderer: that._renderer,
                        projection: that._projection,
                        themeManager: that._themeManager,
                        tracker: that._tracker,
                        eventTrigger: that._eventTrigger,
                        dataExchanger: that._dataExchanger,
                        dataKey: dataKey,
                        notifyDirty: notifyDirty,
                        notifyReady: notifyReady
                    })
                },
                _initLegendsControl: function() {
                    var that = this;
                    that._legendsControl = that._factory.createLegendsControl({
                        container: that._root,
                        renderer: that._renderer,
                        layoutControl: that._layoutControl,
                        dataExchanger: that._dataExchanger
                    })
                },
                _initControlBar: function(dataKey) {
                    var that = this;
                    that._controlBar = that._factory.createControlBar({
                        container: that._root,
                        renderer: that._renderer,
                        layoutControl: that._layoutControl,
                        projection: that._projection,
                        dataKey: dataKey
                    })
                },
                _initElements: function() {
                    var that = this,
                        dataKey = generateDataKey(),
                        notifyCounter = 0;
                    that._dataExchanger = new DataExchanger;
                    that._initCenterHandler();
                    that._projection = that._factory.createProjection();
                    that._tracker = that._factory.createTracker({
                        root: that._root,
                        projection: that._projection,
                        dataKey: dataKey
                    });
                    that._layoutControl = that._factory.createLayoutControl();
                    that._initBackground(dataKey);
                    that._initAreasManager(dataKey, notifyDirty, notifyReady);
                    that._initMarkersManager(dataKey, notifyDirty, notifyReady);
                    that._initLegendsControl();
                    that._initControlBar(dataKey);
                    function notifyDirty() {
                        that._resetIsReady();
                        ++notifyCounter
                    }
                    function notifyReady() {
                        if (--notifyCounter === 0) {
                            that._drawn();
                            that._checkLoadingIndicatorHiding(true)
                        }
                    }
                },
                _initCore: function() {
                    var that = this;
                    that._root = that._renderer.root;
                    that._root.attr({
                        align: 'center',
                        cursor: 'default'
                    });
                    that._initElements();
                    that._projection.setBounds(that.option("bounds")).setMaxZoom(that.option("maxZoomFactor")).setZoom(that.option("zoomFactor"), true).setCenter(that.option("center"), true);
                    that._setTrackerCallbacks();
                    that._setControlBarCallbacks();
                    that._setProjectionCallbacks()
                },
                _init: function() {
                    var that = this;
                    that.callBase.apply(that, arguments);
                    that._areasManager.setData(that.option("mapData"));
                    that._markersManager.setData(that.option("markers"))
                },
                _disposeCore: function() {
                    var that = this;
                    that._resetProjectionCallbacks();
                    that._resetTrackerCallbacks();
                    that._resetControlBarCallbacks();
                    that._tracker.dispose();
                    that._legendsControl.dispose();
                    that._areasManager.dispose();
                    that._markersManager.dispose();
                    that._controlBar.dispose();
                    that._layoutControl.dispose();
                    that._disposeCenterHandler();
                    that._dataExchanger.dispose();
                    that._projection.dispose();
                    that._dataExchanger = that._projection = that._tracker = that._layoutControl = that._root = that._background = that._areasManager = that._markersManager = that._controlBar = that._legendsControl = null
                },
                _initCenterHandler: function() {
                    var that = this,
                        xdrag,
                        ydrag,
                        isCursorChanged = false;
                    that._centerHandler = {
                        processStart: function(arg) {
                            if (that._centeringEnabled) {
                                xdrag = arg.x;
                                ydrag = arg.y;
                                that._noCenterChanged = true
                            }
                        },
                        processMove: function(arg) {
                            if (that._centeringEnabled) {
                                if (!isCursorChanged) {
                                    that._root.attr({cursor: "move"});
                                    isCursorChanged = true
                                }
                                that._projection.moveCenter(xdrag - arg.x, ydrag - arg.y);
                                xdrag = arg.x;
                                ydrag = arg.y
                            }
                        },
                        processEnd: function() {
                            if (that._centeringEnabled) {
                                that._root.attr({cursor: "default"});
                                that._noCenterChanged = null;
                                isCursorChanged && that._raiseCenterChanged();
                                isCursorChanged = false
                            }
                        }
                    }
                },
                _disposeCenterHandler: function() {
                    this._centerHandler = null
                },
                _setProjectionCallbacks: function() {
                    var that = this;
                    that._projection.on({
                        center: function() {
                            that._raiseCenterChanged()
                        },
                        zoom: function() {
                            that._raiseZoomFactorChanged()
                        }
                    });
                    that._resetProjectionCallbacks = function() {
                        that._resetProjectionCallbacks = that = null
                    }
                },
                _setTrackerCallbacks: function() {
                    var that = this,
                        centerHandler = that._centerHandler,
                        renderer = that._renderer,
                        managers = {
                            area: that._areasManager,
                            marker: that._markersManager
                        },
                        controlBar = that._controlBar,
                        tooltip = that._tooltip,
                        isControlDrag = false;
                    that._tracker.setCallbacks({
                        click: function(arg) {
                            var offset = renderer.getRootOffset(),
                                manager;
                            arg.$event.x = arg.x - offset.left;
                            arg.$event.y = arg.y - offset.top;
                            manager = managers[arg.data.type];
                            if (manager)
                                manager.raiseClick(arg.data.index, arg.$event);
                            if (manager || arg.data.type === "background")
                                that._eventTrigger("click", {jQueryEvent: arg.$event})
                        },
                        start: function(arg) {
                            isControlDrag = arg.data.type === "control-bar";
                            if (isControlDrag) {
                                arg.data = arg.data.index;
                                controlBar.processStart(arg)
                            }
                            else
                                centerHandler.processStart(arg)
                        },
                        move: function(arg) {
                            if (isControlDrag) {
                                arg.data = arg.data.index;
                                controlBar.processMove(arg)
                            }
                            else
                                centerHandler.processMove(arg)
                        },
                        end: function(arg) {
                            if (isControlDrag) {
                                arg.data = arg.data.index;
                                controlBar.processEnd(arg);
                                isControlDrag = false
                            }
                            else
                                centerHandler.processEnd()
                        },
                        zoom: function(arg) {
                            controlBar.processZoom(arg)
                        },
                        "hover-on": function(arg) {
                            var manager = managers[arg.data.type];
                            if (manager)
                                manager.hoverItem(arg.data.index, true)
                        },
                        "hover-off": function(arg) {
                            var manager = managers[arg.data.type];
                            if (manager)
                                manager.hoverItem(arg.data.index, false)
                        },
                        "focus-on": function(arg, done) {
                            var result = false,
                                proxy;
                            if (tooltip.isEnabled()) {
                                proxy = managers[arg.data.type] ? managers[arg.data.type].getProxyItem(arg.data.index) : null;
                                if (proxy && tooltip.show(proxy, {
                                    x: 0,
                                    y: 0,
                                    offset: 0
                                }, {target: proxy})) {
                                    tooltip.move(arg.x, arg.y, TOOLTIP_OFFSET);
                                    result = true
                                }
                            }
                            done(result)
                        },
                        "focus-move": function(arg) {
                            tooltip.move(arg.x, arg.y, TOOLTIP_OFFSET)
                        },
                        "focus-off": function() {
                            tooltip.hide()
                        }
                    });
                    that._resetTrackerCallbacks = function() {
                        that._resetTrackerCallbacks = that = centerHandler = renderer = managers = controlBar = tooltip = null
                    }
                },
                _setControlBarCallbacks: function() {
                    var that = this,
                        projection = that._projection,
                        isZoomChanged;
                    that._projection.on({zoom: function() {
                            isZoomChanged = true
                        }});
                    that._controlBar.setCallbacks({
                        reset: function(isCenter, isZoom) {
                            if (isCenter)
                                projection.setCenter(null);
                            if (isZoom)
                                projection.setZoom(null)
                        },
                        beginMove: function() {
                            that._noCenterChanged = true
                        },
                        endMove: function() {
                            that._noCenterChanged = null;
                            that._raiseCenterChanged()
                        },
                        move: function(dx, dy) {
                            projection.moveCenter(dx, dy)
                        },
                        zoom: function(zoom, center) {
                            var coords,
                                screenPosition;
                            if (center) {
                                screenPosition = that._renderer.getRootOffset();
                                screenPosition = [center[0] - screenPosition.left, center[1] - screenPosition.top];
                                coords = projection.fromScreenPoint(screenPosition[0], screenPosition[1])
                            }
                            isZoomChanged = false;
                            projection.setScaledZoom(zoom);
                            if (isZoomChanged && center)
                                projection.setCenterByPoint(coords, screenPosition)
                        }
                    });
                    that._resetControlBarCallbacks = function() {
                        that._resetControlBarCallbacks = that = projection = null
                    }
                },
                _setupInteraction: function() {
                    var that = this;
                    that._centerHandler.processEnd();
                    that._centeringEnabled = !!_parseScalar(this._getOption("panningEnabled", true), true);
                    that._zoomingEnabled = !!_parseScalar(this._getOption("zoomingEnabled", true), true);
                    that._controlBar.setInteraction({
                        centeringEnabled: that._centeringEnabled,
                        zoomingEnabled: that._zoomingEnabled
                    })
                },
                _getDefaultSize: function() {
                    return {
                            width: DEFAULT_WIDTH,
                            height: DEFAULT_HEIGHT
                        }
                },
                _applySize: function() {
                    var that = this,
                        width = that._canvas.width,
                        height = that._canvas.height;
                    that._projection.setSize(width, height);
                    that._layoutControl.setSize(width, height);
                    that._background.attr({
                        x: 0,
                        y: 0,
                        width: width,
                        height: height
                    })
                },
                _resize: $.noop,
                _clean: function() {
                    var that = this;
                    that._tracker.reset();
                    that._layoutControl.stop();
                    that._background.remove();
                    that._areasManager.clean();
                    that._markersManager.clean();
                    that._controlBar.clean();
                    that._legendsControl.clean()
                },
                _render: function() {
                    var that = this;
                    that._scheduleLoadingIndicatorHiding();
                    that._background.append(that._root);
                    that._areasManager.render();
                    that._markersManager.render();
                    that._controlBar.render();
                    that._legendsControl.render();
                    that._layoutControl.start();
                    that._repairLoadIndicator()
                },
                _optionChanged: function(args) {
                    var that = this,
                        value = args.value;
                    that._scheduleLoadingIndicatorHiding();
                    switch (args.name) {
                        case"mapData":
                            that._areasManager.setData(value);
                            break;
                        case"markers":
                            that._markersManager.setData(value);
                            break;
                        case"bounds":
                            that._projection.setBounds(value);
                            break;
                        case"maxZoomFactor":
                            that._projection.setMaxZoom(value);
                            break;
                        case"zoomFactor":
                            that._projection.setZoom(value);
                            break;
                        case"center":
                            that._projection.setCenter(value);
                            break;
                        case"background":
                            that._setBackgroundOptions();
                            break;
                        case"areaSettings":
                            that._setAreasManagerOptions();
                            break;
                        case"markerSettings":
                            that._setMarkersManagerOptions();
                            break;
                        case"controlBar":
                            that._setControlBarOptions();
                            break;
                        case"legends":
                            that._setLegendsOptions();
                            break;
                        case"touchEnabled":
                        case"wheelEnabled":
                            that._setTrackerOptions();
                            break;
                        case"panningEnabled":
                        case"zoomingEnabled":
                            that._setupInteraction();
                            break;
                        default:
                            that.callBase.apply(that, arguments);
                            break
                    }
                },
                _handleThemeOptionsCore: function() {
                    var that = this;
                    that._scheduleLoadingIndicatorHiding();
                    that._setBackgroundOptions();
                    that._setAreasManagerOptions();
                    that._setMarkersManagerOptions();
                    that._setControlBarOptions();
                    that._setLegendsOptions();
                    that._setTrackerOptions();
                    that._setupInteraction()
                },
                _setBackgroundOptions: function() {
                    var settings = this._getOption("background");
                    this._background.attr({
                        "stroke-width": settings.borderWidth,
                        stroke: settings.borderColor,
                        fill: settings.color
                    })
                },
                _setAreasManagerOptions: function() {
                    this._areasManager.setOptions(this.option("areaSettings"));
                    this._eventTrigger.update("onAreaClick");
                    this._eventTrigger.update("onAreaSelectionChanged")
                },
                _setMarkersManagerOptions: function() {
                    this._markersManager.setOptions(this.option("markerSettings"));
                    this._eventTrigger.update("onMarkerClick");
                    this._eventTrigger.update("onMarkerSelectionChanged")
                },
                _setControlBarOptions: function() {
                    this._controlBar.setOptions(this._getOption("controlBar"))
                },
                _setLegendsOptions: function() {
                    this._legendsControl.setOptions(this.option("legends"), this._themeManager.theme("legend"))
                },
                _setTrackerOptions: function() {
                    this._tracker.setOptions({
                        touchEnabled: this._getOption("touchEnabled", true),
                        wheelEnabled: this._getOption("wheelEnabled", true)
                    })
                },
                _raiseCenterChanged: function() {
                    !this._noCenterChanged && this._eventTrigger("centerChanged", {center: this._projection.getCenter()})
                },
                _raiseZoomFactorChanged: function() {
                    !this._noZoomFactorChanged && this._eventTrigger("zoomFactorChanged", {zoomFactor: this._projection.getZoom()})
                },
                getAreas: function() {
                    return this._areasManager.getProxyItems()
                },
                getMarkers: function() {
                    return this._markersManager.getProxyItems()
                },
                clearAreaSelection: function(_noEvent) {
                    this._areasManager.clearSelection(_noEvent);
                    return this
                },
                clearMarkerSelection: function(_noEvent) {
                    this._markersManager.clearSelection(_noEvent);
                    return this
                },
                clearSelection: function(_noEvent) {
                    return this.clearAreaSelection(_noEvent).clearMarkerSelection(_noEvent)
                },
                center: function(value, _noEvent) {
                    var that = this;
                    if (value === undefined)
                        return that._projection.getCenter();
                    else {
                        that._noCenterChanged = _noEvent;
                        that._projection.setCenter(value);
                        that._noCenterChanged = null;
                        return that
                    }
                },
                zoomFactor: function(value, _noEvent) {
                    var that = this;
                    if (value === undefined)
                        return that._projection.getZoom();
                    else {
                        that._noZoomFactorChanged = _noEvent;
                        that._projection.setZoom(value);
                        that._noZoomFactorChanged = null;
                        return that
                    }
                },
                viewport: function(value, _noEvent) {
                    var that = this;
                    if (value === undefined)
                        return that._projection.getViewport();
                    else {
                        that._noCenterChanged = that._noZoomFactorChanged = _noEvent;
                        that._projection.setViewport(value);
                        that._noCenterChanged = that._noZoomFactorChanged = null;
                        return that
                    }
                },
                convertCoordinates: function(x, y) {
                    return this._projection.fromScreenPoint(x, y)
                },
                _factory: {}
            });
        var DataExchanger = function() {
                this._store = {}
            };
        DataExchanger.prototype = {
            constructor: DataExchanger,
            dispose: function() {
                this._store = null;
                return this
            },
            _get: function(category, name) {
                var store = this._store[category] || (this._store[category] = {});
                return store[name] || (store[name] = {})
            },
            set: function(category, name, data) {
                var item = this._get(category, name);
                item.data = data;
                item.callback && item.callback(data);
                return this
            },
            bind: function(category, name, callback) {
                var item = this._get(category, name);
                item.callback = callback;
                item.data && callback(item.data);
                return this
            },
            unbind: function(category, name) {
                var item = this._get(category, name);
                item.data = item.callback = null;
                return this
            }
        };
        DX.registerComponent("dxVectorMap", DX.viz.map, Map);
        DX.viz.map._internal = {};
        DX.viz.map.sources = {};
        DX.viz.map._tests = {};
        DX.viz.map._tests.DataExchanger = DataExchanger;
        DX.viz.map._tests.stubDataExchanger = function(stub) {
            DataExchanger = stub
        }
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file projection.js */
    (function(DX, $, undefined) {
        var _Number = Number,
            _isArray = DX.utils.isArray,
            _math = Math,
            _min = _math.min,
            _max = _math.max,
            _abs = _math.abs,
            _tan = _math.tan,
            _atan = _math.atan,
            _exp = _math.exp,
            _round = _math.round,
            _ln = _math.log,
            _pow = _math.pow,
            PI = _math.PI,
            QUARTER_PI = PI / 4,
            PI_TO_360 = PI / 360,
            TWO_TO_LN2 = 2 / _math.LN2,
            MIN_BOUNDS_RANGE = 1 / 3600 / 180 / 10,
            DEFAULT_MIN_ZOOM = 1,
            DEFAULT_MAX_ZOOM = 1 << 8,
            MERCATOR_MIN_LON = -180,
            MERCATOR_MAX_LON = 180,
            MERCATOR_MIN_LAT = -85.0511,
            MERCATOR_MAX_LAT = 85.0511;
        var mercator = {
                aspectRatio: 1,
                project: function(coordinates) {
                    var lon = coordinates[0],
                        lat = coordinates[1];
                    return [lon <= MERCATOR_MIN_LON ? -1 : lon >= MERCATOR_MAX_LON ? +1 : lon / 180, lat <= MERCATOR_MIN_LAT ? +1 : lat >= MERCATOR_MAX_LAT ? -1 : -_ln(_tan(QUARTER_PI + lat * PI_TO_360)) / PI]
                },
                unproject: function(coordinates) {
                    var x = coordinates[0],
                        y = coordinates[1];
                    return [x <= -1 ? MERCATOR_MIN_LON : x >= +1 ? MERCATOR_MAX_LON : 180 * x, y <= -1 ? MERCATOR_MAX_LAT : y >= +1 ? MERCATOR_MIN_LAT : (_atan(_exp(-PI * coordinates[1])) - QUARTER_PI) / PI_TO_360]
                }
            };
        function createProjectUnprojectMethods(p1, p2, delta) {
            var x0 = (p1[0] + p2[0]) / 2 - delta / 2,
                y0 = (p1[1] + p2[1]) / 2 - delta / 2,
                k = 2 / delta;
            return {
                    project: function(coordinates) {
                        var p = mercator.project(coordinates);
                        return [-1 + (p[0] - x0) * k, -1 + (p[1] - y0) * k]
                    },
                    unproject: function(coordinates) {
                        var p = [x0 + (coordinates[0] + 1) / k, y0 + (coordinates[1] + 1) / k];
                        return mercator.unproject(p)
                    }
                }
        }
        function floatsEqual(f1, f2) {
            return _abs(f1 - f2) < 1E-8
        }
        function truncate(value, min, max, fallback) {
            var _value = _Number(value);
            if (_value < min)
                _value = min;
            else if (_value > max)
                _value = max;
            else if (!(min <= _value && _value <= max))
                _value = fallback;
            return _value
        }
        function truncateQuad(quad, min, max) {
            return {
                    lt: [truncate(quad[0], min[0], max[0], min[0]), truncate(quad[1], min[1], max[1], min[1])],
                    rb: [truncate(quad[2], min[0], max[0], max[0]), truncate(quad[3], min[1], max[1], max[1])]
                }
        }
        function parseBounds(bounds) {
            var p1 = mercator.unproject([-1, -1]),
                p2 = mercator.unproject([+1, +1]),
                min = [_min(p1[0], p2[0]), _min(p1[1], p2[1])],
                max = [_max(p1[0], p2[0]), _max(p1[1], p2[1])],
                quad = bounds;
            if (quad)
                quad = truncateQuad(quad, min, max);
            return {
                    min: quad ? [_min(quad.lt[0], quad.rb[0]), _min(quad.lt[1], quad.rb[1])] : min,
                    max: quad ? [_max(quad.lt[0], quad.rb[0]), _max(quad.lt[1], quad.rb[1])] : max
                }
        }
        function selectCenterValue(value1, value2, center1, center2) {
            var result;
            if (value1 > -1 && value2 >= +1)
                result = center1;
            else if (value1 <= -1 && value2 < +1)
                result = center2;
            else
                result = (center1 + center2) / 2;
            return result
        }
        function Projection() {
            this._events = {
                project: $.Callbacks(),
                transform: $.Callbacks(),
                center: $.Callbacks(),
                zoom: $.Callbacks(),
                "max-zoom": $.Callbacks()
            };
            this.setBounds(null)
        }
        Projection.prototype = {
            constructor: Projection,
            _minZoom: DEFAULT_MIN_ZOOM,
            _maxZoom: DEFAULT_MAX_ZOOM,
            _zoom: DEFAULT_MIN_ZOOM,
            _center: [NaN, NaN],
            dispose: function() {
                this._events = null;
                return this
            },
            setSize: function(width, height) {
                var that = this;
                that._x0 = width / 2;
                that._y0 = height / 2;
                if (width / height <= mercator.aspectRatio) {
                    that._xradius = width / 2;
                    that._yradius = width / 2 / mercator.aspectRatio
                }
                else {
                    that._xradius = height / 2 * mercator.aspectRatio;
                    that._yradius = height / 2
                }
                that._events["transform"].fire(that.getTransform());
                return that
            },
            setBounds: function(bounds) {
                var that = this,
                    _bounds = parseBounds(bounds),
                    p1,
                    p2,
                    delta,
                    methods;
                that._minBound = _bounds.min;
                that._maxBound = _bounds.max;
                p1 = mercator.project(_bounds.min);
                p2 = mercator.project(_bounds.max);
                delta = [_abs(p2[0] - p1[0]), _abs(p2[1] - p1[1])];
                delta = _min(delta[0] > MIN_BOUNDS_RANGE ? delta[0] : 2, delta[1] > MIN_BOUNDS_RANGE ? delta[1] : 2);
                methods = delta < 2 ? createProjectUnprojectMethods(p1, p2, delta) : mercator;
                that._project = methods.project;
                that._unproject = methods.unproject;
                that._defaultCenter = that._unproject([0, 0]);
                that.setCenter(that._defaultCenter);
                that._events.project.fire();
                return that
            },
            _toScreen: function(coordinates) {
                return [this._x0 + this._xradius * coordinates[0], this._y0 + this._yradius * coordinates[1]]
            },
            _fromScreen: function(coordinates) {
                return [(coordinates[0] - this._x0) / this._xradius, (coordinates[1] - this._y0) / this._yradius]
            },
            _toTransformed: function(coordinates) {
                return [coordinates[0] * this._zoom + this._dxcenter, coordinates[1] * this._zoom + this._dycenter]
            },
            _toTransformedFast: function(coordinates) {
                return [coordinates[0] * this._zoom, coordinates[1] * this._zoom]
            },
            _fromTransformed: function(coordinates) {
                return [(coordinates[0] - this._dxcenter) / this._zoom, (coordinates[1] - this._dycenter) / this._zoom]
            },
            _adjustCenter: function() {
                var that = this,
                    center = that._project(that._center);
                that._dxcenter = -center[0] * that._zoom;
                that._dycenter = -center[1] * that._zoom
            },
            projectArea: function(coordinates) {
                var i = 0,
                    ii = _isArray(coordinates) ? coordinates.length : 0,
                    subcoords,
                    j,
                    jj,
                    subresult,
                    result = [];
                for (; i < ii; ++i) {
                    subcoords = coordinates[i];
                    subresult = [];
                    for (j = 0, jj = _isArray(subcoords) ? subcoords.length : 0; j < jj; ++j)
                        subresult.push(this._project(subcoords[j]));
                    result.push(subresult)
                }
                return result
            },
            projectPoint: function(coordinates) {
                return coordinates ? this._project(coordinates) : []
            },
            getAreaCoordinates: function(data) {
                var k = 0,
                    kk = data.length,
                    partialData,
                    i,
                    ii,
                    list = [],
                    partialPath,
                    point;
                for (; k < kk; ++k) {
                    partialData = data[k];
                    partialPath = [];
                    for (i = 0, ii = partialData.length; i < ii; ++i) {
                        point = this._toScreen(this._toTransformedFast(partialData[i]));
                        partialPath.push(point[0], point[1])
                    }
                    list.push(partialPath)
                }
                return list
            },
            getPointCoordinates: function(data) {
                var point = this._toScreen(this._toTransformedFast(data));
                return {
                        x: _round(point[0]),
                        y: _round(point[1])
                    }
            },
            getSquareSize: function(size) {
                return [size[0] * this._zoom * this._xradius, size[1] * this._zoom * this._yradius]
            },
            getZoom: function() {
                return this._zoom
            },
            setZoom: function(zoom, _forceEvent) {
                var that = this,
                    zoom__ = that._zoom;
                that._zoom = truncate(zoom, that._minZoom, that._maxZoom, that._minZoom);
                that._adjustCenter();
                if (!floatsEqual(zoom__, that._zoom) || _forceEvent)
                    that._events.zoom.fire(that.getZoom(), that.getTransform());
                return that
            },
            getScaledZoom: function() {
                return _round((this._scale.length - 1) * _ln(this._zoom) / _ln(this._maxZoom))
            },
            setScaledZoom: function(scaledZoom) {
                return this.setZoom(this._scale[_round(scaledZoom)])
            },
            getZoomScalePartition: function() {
                return this._scale.length - 1
            },
            _setupScaling: function() {
                var that = this,
                    k = _round(TWO_TO_LN2 * _ln(that._maxZoom)),
                    step,
                    zoom,
                    i = 1;
                k = k > 4 ? k : 4;
                step = _pow(that._maxZoom, 1 / k);
                zoom = that._minZoom;
                that._scale = [zoom];
                for (; i <= k; ++i)
                    that._scale.push(zoom *= step)
            },
            setMaxZoom: function(maxZoom) {
                var that = this;
                that._minZoom = DEFAULT_MIN_ZOOM;
                that._maxZoom = truncate(maxZoom, that._minZoom, _Number.MAX_VALUE, DEFAULT_MAX_ZOOM);
                that._setupScaling();
                if (that._zoom > that._maxZoom)
                    that.setZoom(that._maxZoom);
                that._events["max-zoom"].fire(that._maxZoom);
                return that
            },
            getMinZoom: function() {
                return this._minZoom
            },
            getMaxZoom: function() {
                return this._maxZoom
            },
            getCenter: function() {
                return [this._center[0], this._center[1]]
            },
            setCenter: function(center, _forceEvent) {
                var that = this,
                    _center = _isArray(center) ? center : [],
                    center__ = that._center;
                that._center = [truncate(_center[0], that._minBound[0], that._maxBound[0], that._defaultCenter[0]), truncate(_center[1], that._minBound[1], that._maxBound[1], that._defaultCenter[1])];
                that._adjustCenter();
                if (!floatsEqual(center__[0], that._center[0]) || !floatsEqual(center__[1], that._center[1]) || _forceEvent)
                    that._events.center.fire(that.getCenter(), that.getTransform());
                return that
            },
            setCenterByPoint: function(coordinates, screenPosition) {
                var that = this,
                    p = that._project(coordinates),
                    q = that._fromScreen(screenPosition);
                return that.setCenter(that._unproject([-q[0] / that._zoom + p[0], -q[1] / that._zoom + p[1]]))
            },
            moveCenter: function(screenDx, screenDy) {
                var that = this,
                    current = that._toScreen(that._toTransformed(that._project(that._center))),
                    center = that._unproject(that._fromTransformed(that._fromScreen([current[0] + screenDx, current[1] + screenDy])));
                return that.setCenter(center)
            },
            getViewport: function() {
                var p1 = this._unproject(this._fromTransformed([-1, -1])),
                    p2 = this._unproject(this._fromTransformed([+1, +1]));
                return [p1[0], p1[1], p2[0], p2[1]]
            },
            setViewport: function(viewport) {
                var that = this;
                if (!_isArray(viewport))
                    return that.setZoom(that._minZoom).setCenter(that._defaultCenter);
                var _viewport = truncateQuad(viewport, that._minBound, that._maxBound),
                    lt = that._project(_viewport.lt),
                    rb = that._project(_viewport.rb),
                    l = _min(lt[0], rb[0]),
                    t = _min(lt[1], rb[1]),
                    r = _max(lt[0], rb[0]),
                    b = _max(lt[1], rb[1]),
                    zoom = 2 / _max(r - l, b - t),
                    xc = selectCenterValue(l, r, -1 - zoom * l, +1 - zoom * r),
                    yc = selectCenterValue(t, b, -1 - zoom * t, +1 - zoom * b);
                return that.setZoom(zoom).setCenter(that._unproject([-xc / zoom, -yc / zoom]))
            },
            getTransform: function() {
                return {
                        translateX: this._dxcenter * this._xradius,
                        translateY: this._dycenter * this._yradius
                    }
            },
            fromScreenPoint: function(x, y) {
                return this._unproject(this._fromTransformed(this._fromScreen([x, y])))
            },
            on: function(obj) {
                $.each(this._events, function(name, list) {
                    obj[name] && list.add(obj[name])
                });
                return this
            }
        };
        DX.viz.map._tests.Projection = Projection;
        DX.viz.map._tests.mercator = mercator;
        DX.viz.map._tests._DEBUG_stubMercator = function(stub) {
            mercator = stub
        };
        DX.viz.map._tests._DEBUG_restoreMercator = function() {
            mercator = DX.viz.map._tests.mercator
        };
        DX.viz.map.dxVectorMap.prototype._factory.createProjection = function() {
            return new Projection
        }
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file controlBar.js */
    (function(DX, undefined) {
        var _Number = Number,
            _math = Math,
            _round = _math.round,
            _floor = _math.floor,
            _pow = _math.pow,
            _ln = _math.log,
            _LN2 = _math.LN2,
            utils = DX.viz.core.utils,
            _parseScalar = utils.parseScalar,
            parseHorizontalAlignment = utils.enumParser(["left", "center", "right"]),
            parseVerticalAlignment = utils.enumParser(["top", "bottom"]),
            COMMAND_RESET = "command-reset",
            COMMAND_MOVE_UP = "command-move-up",
            COMMAND_MOVE_RIGHT = "command-move-right",
            COMMAND_MOVE_DOWN = "command-move-down",
            COMMAND_MOVE_LEFT = "command-move-left",
            COMMAND_ZOOM_IN = "command-zoom-in",
            COMMAND_ZOOM_OUT = "command-zoom-out",
            COMMAND_ZOOM_DRAG_LINE = "command-zoom-drag-line",
            COMMAND_ZOOM_DRAG = "command-zoom-drag",
            EVENT_TARGET_TYPE = "control-bar",
            FLAG_CENTERING = 1,
            FLAG_ZOOMING = 2,
            SIZE_OPTIONS = {
                bigCircleSize: 58,
                smallCircleSize: 28,
                buttonSize: 10,
                arrowButtonOffset: 20,
                incdecButtonSize: 11,
                incButtonOffset: 66,
                decButtonOffset: 227,
                sliderLineStartOffset: 88.5,
                sliderLineEndOffset: 205.5,
                sliderLength: 20,
                sliderWidth: 8,
                trackerGap: 4
            },
            OFFSET_X = 30.5,
            OFFSET_Y = 30.5,
            TOTAL_WIDTH = 61,
            TOTAL_HEIGHT = 274,
            COMMAND_TO_TYPE_MAP = {};
        COMMAND_TO_TYPE_MAP[COMMAND_RESET] = ResetCommand;
        COMMAND_TO_TYPE_MAP[COMMAND_MOVE_UP] = COMMAND_TO_TYPE_MAP[COMMAND_MOVE_RIGHT] = COMMAND_TO_TYPE_MAP[COMMAND_MOVE_DOWN] = COMMAND_TO_TYPE_MAP[COMMAND_MOVE_LEFT] = MoveCommand;
        COMMAND_TO_TYPE_MAP[COMMAND_ZOOM_IN] = COMMAND_TO_TYPE_MAP[COMMAND_ZOOM_OUT] = ZoomCommand;
        COMMAND_TO_TYPE_MAP[COMMAND_ZOOM_DRAG] = ZoomDragCommand;
        var ControlBar = DX.Class.inherit({
                _flags: 0,
                ctor: function(parameters) {
                    var that = this;
                    that._params = parameters;
                    that._createElements(parameters.renderer, parameters.dataKey);
                    parameters.layoutControl.addItem(that);
                    that._subscribeToProjection(parameters.projection);
                    that._setVisibility(false)
                },
                setCallbacks: function(callbacks) {
                    this._callbacks = callbacks;
                    return this
                },
                _createElements: function(renderer, dataKey) {
                    var that = this,
                        buttonsGroups,
                        trackersGroup;
                    that._root = renderer.g().attr({"class": "dxm-control-bar"});
                    buttonsGroups = that._buttonsGroup = renderer.g().attr({"class": "dxm-control-buttons"}).append(that._root);
                    trackersGroup = renderer.g().attr({
                        stroke: "none",
                        "stroke-width": 0,
                        fill: "#000000",
                        opacity: 0.0001
                    }).css({cursor: "pointer"}).append(that._root);
                    that._createButtons(renderer, dataKey, buttonsGroups);
                    that._createTrackers(renderer, dataKey, trackersGroup)
                },
                _createButtons: function(renderer, dataKey, group) {
                    var that = this,
                        options = SIZE_OPTIONS,
                        size = options.buttonSize / 2,
                        offset1 = options.arrowButtonOffset - size,
                        offset2 = options.arrowButtonOffset,
                        incdecButtonSize = options.incdecButtonSize / 2,
                        directionOptions = {
                            "stroke-linecap": "square",
                            fill: "none"
                        },
                        line = "line";
                    renderer.circle(0, 0, options.bigCircleSize / 2).append(group);
                    renderer.circle(0, 0, size).attr({fill: "none"}).append(group);
                    renderer.path([-size, -offset1, 0, -offset2, size, -offset1], line).attr(directionOptions).append(group);
                    renderer.path([offset1, -size, offset2, 0, offset1, size], line).attr(directionOptions).append(group);
                    renderer.path([size, offset1, 0, offset2, -size, offset1], line).attr(directionOptions).append(group);
                    renderer.path([-offset1, size, -offset2, 0, -offset1, -size], line).attr(directionOptions).append(group);
                    renderer.circle(0, options.incButtonOffset, options.smallCircleSize / 2).append(group);
                    renderer.path([[-incdecButtonSize, options.incButtonOffset, incdecButtonSize, options.incButtonOffset], [0, options.incButtonOffset - incdecButtonSize, 0, options.incButtonOffset + incdecButtonSize]], "area").append(group);
                    renderer.circle(0, options.decButtonOffset, options.smallCircleSize / 2).append(group);
                    renderer.path([-incdecButtonSize, options.decButtonOffset, incdecButtonSize, options.decButtonOffset], "area").append(group);
                    that._progressBar = renderer.path([], "area").append(group);
                    that._zoomDrag = renderer.rect(_floor(-options.sliderLength / 2), _floor(options.sliderLineEndOffset - options.sliderWidth / 2), options.sliderLength, options.sliderWidth).append(group);
                    that._sliderLineLength = options.sliderLineEndOffset - options.sliderLineStartOffset
                },
                _createTrackers: function(renderer, dataKey, group) {
                    var options = SIZE_OPTIONS,
                        size = _round((options.arrowButtonOffset - options.trackerGap) / 2),
                        offset1 = options.arrowButtonOffset - size,
                        offset2 = _round(_pow(options.bigCircleSize * options.bigCircleSize / 4 - size * size, 0.5)),
                        size2 = offset2 - offset1;
                    renderer.rect(-size, -size, size * 2, size * 2).data(dataKey, {
                        index: COMMAND_RESET,
                        type: EVENT_TARGET_TYPE
                    }).append(group);
                    renderer.rect(-size, -offset2, size * 2, size2).data(dataKey, {
                        index: COMMAND_MOVE_UP,
                        type: EVENT_TARGET_TYPE
                    }).append(group);
                    renderer.rect(offset1, -size, size2, size * 2).data(dataKey, {
                        index: COMMAND_MOVE_RIGHT,
                        type: EVENT_TARGET_TYPE
                    }).append(group);
                    renderer.rect(-size, offset1, size * 2, size2).data(dataKey, {
                        index: COMMAND_MOVE_DOWN,
                        type: EVENT_TARGET_TYPE
                    }).append(group);
                    renderer.rect(-offset2, -size, size2, size * 2).data(dataKey, {
                        index: COMMAND_MOVE_LEFT,
                        type: EVENT_TARGET_TYPE
                    }).append(group);
                    renderer.circle(0, options.incButtonOffset, options.smallCircleSize / 2).data(dataKey, {
                        index: COMMAND_ZOOM_IN,
                        type: EVENT_TARGET_TYPE
                    }).append(group);
                    renderer.circle(0, options.decButtonOffset, options.smallCircleSize / 2).data(dataKey, {
                        index: COMMAND_ZOOM_OUT,
                        type: EVENT_TARGET_TYPE
                    }).append(group);
                    renderer.rect(-2, options.sliderLineStartOffset - 2, 4, options.sliderLineEndOffset - options.sliderLineStartOffset + 4).css({cursor: "default"}).data(dataKey, {
                        index: COMMAND_ZOOM_DRAG_LINE,
                        type: EVENT_TARGET_TYPE
                    }).append(group);
                    this._zoomDragCover = renderer.rect(-options.sliderLength / 2, options.sliderLineEndOffset - options.sliderWidth / 2, options.sliderLength, options.sliderWidth).data(dataKey, {
                        index: COMMAND_ZOOM_DRAG,
                        type: EVENT_TARGET_TYPE
                    }).append(group)
                },
                _subscribeToProjection: function(projection) {
                    var that = this;
                    projection.on({
                        zoom: function() {
                            that._adjustZoom(projection.getScaledZoom())
                        },
                        "max-zoom": function() {
                            that._zoomPartition = projection.getZoomScalePartition();
                            that._sliderUnitLength = that._sliderLineLength / that._zoomPartition;
                            that._adjustZoom(projection.getScaledZoom())
                        }
                    })
                },
                dispose: function() {
                    var that = this;
                    that._params.layoutControl.removeItem(that);
                    that._root.clear();
                    that._params = that._callbacks = that._root = that._buttonsGroup = that._zoomDrag = that._zoomDragCover = that._progressBar = null;
                    return that
                },
                resize: function(size) {
                    this._setVisibility(size !== null && this._options.enabled && this._flags);
                    return this
                },
                _setVisibility: function(state) {
                    this._root.attr({visibility: state ? null : "hidden"})
                },
                getLayoutOptions: function() {
                    var options = this._options;
                    return this._rendered && options.enabled && this._flags ? {
                            width: 2 * options.margin + TOTAL_WIDTH,
                            height: 2 * options.margin + TOTAL_HEIGHT,
                            horizontalAlignment: options.horizontalAlignment,
                            verticalAlignment: options.verticalAlignment
                        } : null
                },
                locate: function(x, y) {
                    this._root.attr({
                        translateX: x + this._options.margin + OFFSET_X,
                        translateY: y + this._options.margin + OFFSET_Y
                    });
                    return this
                },
                setInteraction: function(interaction) {
                    var that = this;
                    that.processEnd();
                    if (_parseScalar(interaction.centeringEnabled, true))
                        that._flags |= FLAG_CENTERING;
                    else
                        that._flags &= ~FLAG_CENTERING;
                    if (_parseScalar(interaction.zoomingEnabled, true))
                        that._flags |= FLAG_ZOOMING;
                    else
                        that._flags &= ~FLAG_ZOOMING;
                    if (that._rendered)
                        that._refresh();
                    return that
                },
                setOptions: function(options) {
                    var that = this;
                    that.processEnd();
                    that._buttonsGroup.attr({
                        "stroke-width": options.borderWidth,
                        stroke: options.borderColor,
                        fill: options.color,
                        "fill-opacity": options.opacity
                    });
                    that._options = {
                        enabled: !!_parseScalar(options.enabled, true),
                        margin: options.margin > 0 ? _Number(options.margin) : 0,
                        horizontalAlignment: parseHorizontalAlignment(options.horizontalAlignment, "left"),
                        verticalAlignment: parseVerticalAlignment(options.verticalAlignment, "top")
                    };
                    that._rendered && that._refresh();
                    return that
                },
                _refresh: function() {
                    var isVisible = this._flags && this._options.enabled;
                    this._setVisibility(isVisible);
                    if (isVisible)
                        this.updateLayout()
                },
                clean: function() {
                    var that = this;
                    that._rendered = null;
                    that._root.remove();
                    return that
                },
                render: function() {
                    var that = this;
                    that._rendered = true;
                    that._root.append(that._params.container);
                    that._refresh();
                    return that
                },
                _adjustZoom: function(zoom) {
                    var that = this,
                        transform,
                        y,
                        start = SIZE_OPTIONS.sliderLineStartOffset,
                        end = SIZE_OPTIONS.sliderLineEndOffset,
                        h = SIZE_OPTIONS.sliderWidth;
                    that._zoomFactor = _round(zoom);
                    that._zoomFactor >= 0 || (that._zoomFactor = 0);
                    that._zoomFactor <= that._zoomPartition || (that._zoomFactor = that._zoomPartition);
                    transform = {translateY: -that._zoomFactor * that._sliderUnitLength};
                    y = end - h / 2 + transform.translateY;
                    that._progressBar.attr({points: [[0, start, 0, _math.max(start, y)], [0, _math.min(end, y + h), 0, end]]});
                    that._zoomDrag.attr(transform);
                    that._zoomDragCover.attr(transform)
                },
                _applyZoom: function(center) {
                    this._callbacks.zoom(this._zoomFactor, this._flags & FLAG_CENTERING ? center : undefined)
                },
                processStart: function(arg) {
                    var commandType = COMMAND_TO_TYPE_MAP[arg.data];
                    this._command = commandType && this._options.enabled && commandType.flags & this._flags ? new commandType(this, arg) : null;
                    return this
                },
                processMove: function(arg) {
                    this._command && this._command.update(arg);
                    return this
                },
                processEnd: function() {
                    this._command && this._command.finish();
                    this._command = null;
                    return this
                },
                processZoom: function(arg) {
                    var that = this,
                        zoomFactor;
                    if (that._flags & FLAG_ZOOMING) {
                        if (arg.delta)
                            zoomFactor = arg.delta;
                        else if (arg.ratio)
                            zoomFactor = _ln(arg.ratio) / _LN2;
                        that._adjustZoom(that._zoomFactor + zoomFactor);
                        that._applyZoom([arg.x, arg.y])
                    }
                    return that
                }
            });
        function disposeCommand(command) {
            delete command._owner;
            command.update = function(){};
            command.finish = function(){}
        }
        function ResetCommand(owner, arg) {
            this._owner = owner;
            this._command = arg.data
        }
        ResetCommand.flags = FLAG_CENTERING | FLAG_ZOOMING;
        ResetCommand.prototype.update = function(arg) {
            arg.data !== this._command && disposeCommand(this)
        };
        ResetCommand.prototype.finish = function() {
            var flags = this._owner._flags;
            this._owner._callbacks.reset(!!(flags & FLAG_CENTERING), !!(flags & FLAG_ZOOMING));
            if (flags & FLAG_ZOOMING)
                this._owner._adjustZoom(0);
            disposeCommand(this)
        };
        function MoveCommand(owner, arg) {
            this._command = arg.data;
            var timeout = null,
                interval = 100,
                dx = 0,
                dy = 0;
            switch (this._command) {
                case COMMAND_MOVE_UP:
                    dy = -10;
                    break;
                case COMMAND_MOVE_RIGHT:
                    dx = 10;
                    break;
                case COMMAND_MOVE_DOWN:
                    dy = 10;
                    break;
                case COMMAND_MOVE_LEFT:
                    dx = -10;
                    break
            }
            function callback() {
                owner._callbacks.move(dx, dy);
                timeout = setTimeout(callback, interval)
            }
            this._stop = function() {
                clearTimeout(timeout);
                owner._callbacks.endMove();
                this._stop = owner = null;
                return this
            };
            arg = null;
            owner._callbacks.beginMove();
            callback()
        }
        MoveCommand.flags = FLAG_CENTERING;
        MoveCommand.prototype.update = function(arg) {
            this._command !== arg.data && this.finish()
        };
        MoveCommand.prototype.finish = function() {
            disposeCommand(this._stop())
        };
        function ZoomCommand(owner, arg) {
            this._owner = owner;
            this._command = arg.data;
            var timeout = null,
                interval = 150,
                dzoom = this._command === COMMAND_ZOOM_IN ? 1 : -1;
            function callback() {
                owner._adjustZoom(owner._zoomFactor + dzoom);
                timeout = setTimeout(callback, interval)
            }
            this._stop = function() {
                clearTimeout(timeout);
                this._stop = owner = null;
                return this
            };
            arg = null;
            callback()
        }
        ZoomCommand.flags = FLAG_ZOOMING;
        ZoomCommand.prototype.update = function(arg) {
            this._command !== arg.data && this.finish()
        };
        ZoomCommand.prototype.finish = function() {
            this._owner._applyZoom();
            disposeCommand(this._stop())
        };
        function ZoomDragCommand(owner, arg) {
            this._owner = owner;
            this._zoomFactor = owner._zoomFactor;
            this._pos = arg.y
        }
        ZoomDragCommand.flags = FLAG_ZOOMING;
        ZoomDragCommand.prototype.update = function(arg) {
            var owner = this._owner;
            owner._adjustZoom(this._zoomFactor + owner._zoomPartition * (this._pos - arg.y) / owner._sliderLineLength)
        };
        ZoomDragCommand.prototype.finish = function() {
            this._owner._applyZoom();
            disposeCommand(this)
        };
        DX.viz.map._tests.ControlBar = ControlBar;
        var COMMAND_TO_TYPE_MAP__ORIGINAL = COMMAND_TO_TYPE_MAP;
        DX.viz.map._tests.stubCommandToTypeMap = function(map) {
            COMMAND_TO_TYPE_MAP = map
        };
        DX.viz.map._tests.restoreCommandToTypeMap = function() {
            COMMAND_TO_TYPE_MAP = COMMAND_TO_TYPE_MAP__ORIGINAL
        };
        DX.viz.map.dxVectorMap.prototype._factory.createControlBar = function(parameters) {
            return new ControlBar(parameters)
        }
    })(DevExpress);
    /*! Module viz-vectormap, file tracker.js */
    (function(DX, $, undefined) {
        var _math = Math,
            _abs = _math.abs,
            _sqrt = _math.sqrt,
            _round = _math.round,
            _addNamespace = DX.ui.events.addNamespace,
            _parseScalar = DX.viz.core.utils.parseScalar,
            _now = $.now,
            _NAME = DX.viz.map.dxVectorMap.prototype.NAME,
            EVENTS = {};
        setupEvents();
        var EVENT_START = "start",
            EVENT_MOVE = "move",
            EVENT_END = "end",
            EVENT_ZOOM = "zoom",
            EVENT_HOVER_ON = "hover-on",
            EVENT_HOVER_OFF = "hover-off",
            EVENT_CLICK = "click",
            EVENT_FOCUS_ON = "focus-on",
            EVENT_FOCUS_MOVE = "focus-move",
            EVENT_FOCUS_OFF = "focus-off",
            CLICK_TIME_THRESHOLD = 500,
            CLICK_COORD_THRESHOLD_MOUSE = 5,
            CLICK_COORD_THRESHOLD_TOUCH = 20,
            DRAG_COORD_THRESHOLD_MOUSE = 5,
            DRAG_COORD_THRESHOLD_TOUCH = 10,
            FOCUS_ON_DELAY_MOUSE = 300,
            FOCUS_OFF_DELAY_MOUSE = 300,
            FOCUS_ON_DELAY_TOUCH = 300,
            FOCUS_OFF_DELAY_TOUCH = 400,
            FOCUS_COORD_THRESHOLD_MOUSE = 5,
            WHEEL_COOLDOWN = 50,
            WHEEL_DIRECTION_COOLDOWN = 300;
        function Tracker(parameters) {
            var that = this;
            that._root = parameters.root;
            that._callbacks = {};
            that._createEventHandlers(parameters.dataKey);
            that._createProjectionHandlers(parameters.projection);
            that._focus = new Focus(that._callbacks);
            that._attachHandlers()
        }
        Tracker.prototype = {
            constructor: Tracker,
            dispose: function() {
                var that = this;
                that._detachHandlers();
                that._focus.dispose();
                that._root = that._callbacks = that._focus = that._docHandlers = that._rootHandlers = null;
                return that
            },
            _startClick: function(event, data) {
                if (!data)
                    return;
                var coords = getEventCoords(event);
                this._clickState = {
                    x: coords.x,
                    y: coords.y,
                    threshold: isTouchEvent(event) ? CLICK_COORD_THRESHOLD_TOUCH : CLICK_COORD_THRESHOLD_MOUSE,
                    time: _now()
                }
            },
            _endClick: function(event, data) {
                var state = this._clickState,
                    threshold,
                    coords;
                if (!state)
                    return;
                if (_now() - state.time <= CLICK_TIME_THRESHOLD) {
                    threshold = state.threshold;
                    coords = getEventCoords(event);
                    if (_abs(coords.x - state.x) <= threshold && _abs(coords.y - state.y) <= threshold)
                        this._callbacks[EVENT_CLICK]({
                            data: data,
                            x: coords.x,
                            y: coords.y,
                            $event: event
                        })
                }
                this._clickState = null
            },
            _startDrag: function(event, data) {
                if (!data)
                    return;
                var coords = getEventCoords(event),
                    state = this._dragState = {
                        x: coords.x,
                        y: coords.y,
                        data: data
                    };
                this._callbacks[EVENT_START]({
                    x: state.x,
                    y: state.y,
                    data: state.data
                })
            },
            _moveDrag: function(event, data) {
                var state = this._dragState,
                    coords,
                    threshold;
                if (!state)
                    return;
                coords = getEventCoords(event);
                threshold = isTouchEvent(event) ? DRAG_COORD_THRESHOLD_TOUCH : DRAG_COORD_THRESHOLD_MOUSE;
                if (state.active || _abs(coords.x - state.x) > threshold || _abs(coords.y - state.y) > threshold) {
                    state.x = coords.x;
                    state.y = coords.y;
                    state.active = true;
                    state.data = data || {};
                    this._callbacks[EVENT_MOVE]({
                        x: state.x,
                        y: state.y,
                        data: state.data
                    })
                }
            },
            _endDrag: function() {
                var state = this._dragState;
                if (!state)
                    return;
                this._dragState = null;
                this._callbacks[EVENT_END]({
                    x: state.x,
                    y: state.y,
                    data: state.data
                })
            },
            _wheelZoom: function(event, data) {
                if (!data)
                    return;
                var that = this,
                    lock = that._wheelLock,
                    time = _now(),
                    delta,
                    coords;
                if (time - lock.time <= WHEEL_COOLDOWN)
                    return;
                if (time - lock.dirTime > WHEEL_DIRECTION_COOLDOWN)
                    lock.dir = 0;
                delta = adjustWheelDelta(event.originalEvent.wheelDelta / 120 || event.originalEvent.detail / -3 || 0, lock);
                if (delta === 0)
                    return;
                coords = getEventCoords(event);
                that._callbacks[EVENT_ZOOM]({
                    delta: delta,
                    x: coords.x,
                    y: coords.y
                });
                lock.time = lock.dirTime = time
            },
            _startZoom: function(event, data) {
                if (!isTouchEvent(event) || !data)
                    return;
                var state = this._zoomState = this._zoomState || {},
                    coords,
                    pointer2;
                if (state.pointer1 && state.pointer2)
                    return;
                if (state.pointer1 === undefined) {
                    state.pointer1 = getPointerId(event) || 0;
                    coords = getMultitouchEventCoords(event, state.pointer1);
                    state.x1 = state.x1_0 = coords.x;
                    state.y1 = state.y1_0 = coords.y
                }
                if (state.pointer2 === undefined) {
                    pointer2 = getPointerId(event) || 1;
                    if (pointer2 !== state.pointer1) {
                        coords = getMultitouchEventCoords(event, pointer2);
                        if (coords) {
                            state.x2 = state.x2_0 = coords.x;
                            state.y2 = state.y2_0 = coords.y;
                            state.pointer2 = pointer2;
                            state.ready = true;
                            this._endDrag()
                        }
                    }
                }
            },
            _moveZoom: function(event) {
                var state = this._zoomState,
                    coords;
                if (!state || !isTouchEvent(event))
                    return;
                if (state.pointer1 !== undefined) {
                    coords = getMultitouchEventCoords(event, state.pointer1);
                    if (coords) {
                        state.x1 = coords.x;
                        state.y1 = coords.y
                    }
                }
                if (state.pointer2 !== undefined) {
                    coords = getMultitouchEventCoords(event, state.pointer2);
                    if (coords) {
                        state.x2 = coords.x;
                        state.y2 = coords.y
                    }
                }
            },
            _endZoom: function(event) {
                var state = this._zoomState,
                    startDistance,
                    currentDistance;
                if (!state || !isTouchEvent(event))
                    return;
                if (state.ready) {
                    startDistance = getDistance(state.x1_0, state.y1_0, state.x2_0, state.y2_0);
                    currentDistance = getDistance(state.x1, state.y1, state.x2, state.y2);
                    this._callbacks[EVENT_ZOOM]({
                        ratio: currentDistance / startDistance,
                        x: (state.x1_0 + state.x2_0) / 2,
                        y: (state.y1_0 + state.y2_0) / 2
                    })
                }
                this._zoomState = null
            },
            _startHover: function(event, data) {
                this._doHover(event, data, true)
            },
            _moveHover: function(event, data) {
                this._doHover(event, data, false)
            },
            _doHover: function(event, data, isTouch) {
                var that = this;
                if (that._dragState && that._dragState.active || that._zoomState && that._zoomState.ready) {
                    that._cancelHover();
                    return
                }
                if (isTouchEvent(event) !== isTouch || that._hoverTarget === event.target || that._hoverState && that._hoverState.data === data)
                    return;
                that._cancelHover();
                if (data) {
                    that._hoverState = {data: data};
                    that._callbacks[EVENT_HOVER_ON]({data: data})
                }
                that._hoverTarget = event.target
            },
            _cancelHover: function() {
                var state = this._hoverState;
                this._hoverState = this._hoverTarget = null;
                if (state)
                    this._callbacks[EVENT_HOVER_OFF]({data: state.data})
            },
            _startFocus: function(event, data) {
                this._doFocus(event, data, true)
            },
            _moveFocus: function(event, data) {
                this._doFocus(event, data, false)
            },
            _doFocus: function(event, data, isTouch) {
                var that = this;
                if (that._dragState && that._dragState.active || that._zoomState && that._zoomState.ready) {
                    that._cancelFocus();
                    return
                }
                if (isTouchEvent(event) !== isTouch)
                    return;
                that._focus.turnOff(isTouch ? FOCUS_OFF_DELAY_TOUCH : FOCUS_OFF_DELAY_MOUSE);
                data && that._focus.turnOn(data, getEventCoords(event), isTouch ? FOCUS_ON_DELAY_TOUCH : FOCUS_ON_DELAY_MOUSE, isTouch)
            },
            _endFocus: function(event) {
                if (!isTouchEvent(event))
                    return;
                this._focus.cancelOn()
            },
            _cancelFocus: function() {
                this._focus.cancel()
            },
            _createEventHandlers: function(DATA_KEY) {
                var that = this;
                that._docHandlers = {};
                that._rootHandlers = {};
                that._docHandlers[EVENTS.start] = function(event) {
                    var isTouch = isTouchEvent(event),
                        data = $(event.target).data(DATA_KEY);
                    if (isTouch && !that._isTouchEnabled)
                        return;
                    data && event.preventDefault();
                    that._startClick(event, data);
                    that._startDrag(event, data);
                    that._startZoom(event, data);
                    that._startHover(event, data);
                    that._startFocus(event, data)
                };
                that._docHandlers[EVENTS.move] = function(event) {
                    var isTouch = isTouchEvent(event),
                        data = $(event.target).data(DATA_KEY);
                    if (isTouch && !that._isTouchEnabled)
                        return;
                    that._moveDrag(event, data);
                    that._moveZoom(event, data);
                    that._moveHover(event, data);
                    that._moveFocus(event, data)
                };
                that._docHandlers[EVENTS.end] = function(event) {
                    var isTouch = isTouchEvent(event),
                        data = $(event.target).data(DATA_KEY);
                    if (isTouch && !that._isTouchEnabled)
                        return;
                    that._endClick(event, data);
                    that._endDrag(event, data);
                    that._endZoom(event, data);
                    that._endFocus(event, data)
                };
                that._rootHandlers[EVENTS.wheel] = function(event) {
                    that._cancelFocus();
                    if (!that._isWheelEnabled)
                        return;
                    var data = $(event.target).data(DATA_KEY);
                    if (data) {
                        event.preventDefault();
                        event.stopPropagation();
                        that._wheelZoom(event, data)
                    }
                };
                that._wheelLock = {dir: 0}
            },
            _createProjectionHandlers: function(projection) {
                var that = this;
                projection.on({
                    center: handler,
                    zoom: handler
                });
                function handler() {
                    that._cancelFocus()
                }
            },
            reset: function() {
                var that = this;
                that._clickState = null;
                that._endDrag();
                that._cancelHover();
                that._cancelFocus();
                return that
            },
            setCallbacks: function(callbacks) {
                $.extend(this._callbacks, callbacks);
                return this
            },
            setOptions: function(options) {
                var that = this;
                that.reset();
                that._detachHandlers();
                that._isTouchEnabled = !!_parseScalar(options.touchEnabled, true);
                that._isWheelEnabled = !!_parseScalar(options.wheelEnabled, true);
                that._attachHandlers();
                return that
            },
            _detachHandlers: function() {
                var that = this;
                if (that._isTouchEnabled)
                    that._root.css({
                        "touch-action": "",
                        "-ms-touch-action": "",
                        "-webkit-user-select": ""
                    }).off(_addNamespace("MSHoldVisual", _NAME)).off(_addNamespace("contextmenu", _NAME));
                $(document).off(that._docHandlers);
                that._root.off(that._rootHandlers)
            },
            _attachHandlers: function() {
                var that = this;
                if (that._isTouchEnabled)
                    that._root.css({
                        "touch-action": "none",
                        "-ms-touch-action": "none",
                        "-webkit-user-select": "none"
                    }).on(_addNamespace("MSHoldVisual", _NAME), function(event) {
                        event.preventDefault()
                    }).on(_addNamespace("contextmenu", _NAME), function(event) {
                        isTouchEvent(event) && event.preventDefault()
                    });
                $(document).on(that._docHandlers);
                that._root.on(that._rootHandlers)
            }
        };
        var Focus = function(callbacks) {
                var that = this,
                    _activeData = null,
                    _data = null,
                    _disabled = false,
                    _onTimer = null,
                    _offTimer = null,
                    _x,
                    _y;
                that.dispose = function() {
                    clearTimeout(_onTimer);
                    clearTimeout(_offTimer);
                    that.turnOn = that.turnOff = that.cancel = that.cancelOn = that.dispose = that = callbacks = _activeData = _data = _onTimer = _offTimer = null
                };
                that.turnOn = function(data, coords, timeout, forceTimeout) {
                    if (data === _data && _disabled)
                        return;
                    _disabled = false;
                    _data = data;
                    if (_activeData) {
                        _x = coords.x;
                        _y = coords.y;
                        clearTimeout(_onTimer);
                        _onTimer = setTimeout(function() {
                            _onTimer = null;
                            if (_data === _activeData) {
                                callbacks[EVENT_FOCUS_MOVE]({
                                    data: _data,
                                    x: _x,
                                    y: _y
                                });
                                onCheck(true)
                            }
                            else
                                callbacks[EVENT_FOCUS_ON]({
                                    data: _data,
                                    x: _x,
                                    y: _y
                                }, onCheck)
                        }, forceTimeout ? timeout : 0)
                    }
                    else if (!_onTimer || _abs(coords.x - _x) > FOCUS_COORD_THRESHOLD_MOUSE || _abs(coords.y - _y) > FOCUS_COORD_THRESHOLD_MOUSE || forceTimeout) {
                        _x = coords.x;
                        _y = coords.y;
                        clearTimeout(_onTimer);
                        _onTimer = setTimeout(function() {
                            _onTimer = null;
                            callbacks[EVENT_FOCUS_ON]({
                                data: _data,
                                x: _x,
                                y: _y
                            }, onCheck)
                        }, timeout)
                    }
                    function onCheck(result) {
                        _disabled = !result;
                        if (result) {
                            _activeData = _data;
                            clearTimeout(_offTimer);
                            _offTimer = null
                        }
                    }
                };
                that.turnOff = function(timeout) {
                    clearTimeout(_onTimer);
                    _onTimer = null;
                    _data = null;
                    if (_activeData && !_disabled)
                        _offTimer = _offTimer || setTimeout(function() {
                            _offTimer = null;
                            callbacks[EVENT_FOCUS_OFF]({data: _activeData});
                            _activeData = null
                        }, timeout)
                };
                that.cancel = function() {
                    clearTimeout(_onTimer);
                    clearTimeout(_offTimer);
                    if (_activeData)
                        callbacks[EVENT_FOCUS_OFF]({data: _activeData});
                    _activeData = _data = _onTimer = _offTimer = null
                };
                that.cancelOn = function() {
                    clearTimeout(_onTimer);
                    _onTimer = null
                }
            };
        DX.viz.map._tests.Tracker = Tracker;
        DX.viz.map._tests._DEBUG_forceEventMode = function(mode) {
            setupEvents(mode)
        };
        DX.viz.map._tests.Focus = Focus;
        DX.viz.map._tests._DEBUG_stubFocusType = function(focusType) {
            Focus = focusType
        };
        DX.viz.map._tests._DEBUG_restoreFocusType = function() {
            Focus = DX.viz.map._tests.Focus
        };
        DX.viz.map.dxVectorMap.prototype._factory.createTracker = function(parameters) {
            return new Tracker(parameters)
        };
        function getDistance(x1, y1, x2, y2) {
            return _sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
        }
        function isTouchEvent(event) {
            var type = event.originalEvent.type,
                pointerType = event.originalEvent.pointerType;
            return /^touch/.test(type) || /^MSPointer/.test(type) && pointerType !== 4 || /^pointer/.test(type) && pointerType !== "mouse"
        }
        function selectItem(flags, items) {
            var i = 0,
                ii = flags.length,
                item;
            for (; i < ii; ++i)
                if (flags[i]) {
                    item = items[i];
                    break
                }
            return _addNamespace(item || items[i], _NAME)
        }
        function setupEvents() {
            var flags = [navigator.pointerEnabled, navigator.msPointerEnabled, "ontouchstart" in window];
            if (arguments.length)
                flags = [arguments[0] === "pointer", arguments[0] === "MSPointer", arguments[0] === "touch"];
            EVENTS = {
                start: selectItem(flags, ["pointerdown", "MSPointerDown", "touchstart mousedown", "mousedown"]),
                move: selectItem(flags, ["pointermove", "MSPointerMove", "touchmove mousemove", "mousemove"]),
                end: selectItem(flags, ["pointerup", "MSPointerUp", "touchend mouseup", "mouseup"]),
                wheel: selectItem([], ["mousewheel DOMMouseScroll"])
            }
        }
        function getEventCoords(event) {
            var originalEvent = event.originalEvent,
                touch = originalEvent.touches && originalEvent.touches[0] || {};
            return {
                    x: touch.pageX || originalEvent.pageX || event.pageX,
                    y: touch.pageY || originalEvent.pageY || event.pageY
                }
        }
        function getPointerId(event) {
            return event.originalEvent.pointerId
        }
        function getMultitouchEventCoords(event, pointerId) {
            var originalEvent = event.originalEvent;
            if (originalEvent.pointerId !== undefined)
                originalEvent = originalEvent.pointerId === pointerId ? originalEvent : null;
            else
                originalEvent = originalEvent.touches[pointerId];
            return originalEvent ? {
                    x: originalEvent.pageX || event.pageX,
                    y: originalEvent.pageY || event.pageY
                } : null
        }
        function adjustWheelDelta(delta, lock) {
            if (delta === 0)
                return 0;
            var _delta = _abs(delta),
                sign = _round(delta / _delta);
            if (lock.dir && sign !== lock.dir)
                return 0;
            lock.dir = sign;
            if (_delta < 0.1)
                _delta = 0;
            else if (_delta < 1)
                _delta = 1;
            else if (_delta > 4)
                _delta = 4;
            else
                _delta = _round(_delta);
            return sign * _delta
        }
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file themeManager.js */
    (function(DX, $, undefined) {
        var _Number = Number,
            _extend = $.extend,
            _each = $.each;
        var ThemeManager = DX.viz.core.BaseThemeManager.inherit({
                _themeSection: "map",
                _fontFields: ["areaSettings.label.font", "markerSettings.label.font", "tooltip.font", "legend.font", "loadingIndicator.font"],
                getCommonAreaSettings: function(options) {
                    var settings = _extend(true, {}, this._theme.areaSettings, options),
                        palette,
                        i,
                        colors;
                    if (settings.paletteSize > 0) {
                        palette = new DX.viz.core.GradientPalette(settings.palette, settings.paletteSize);
                        for (i = 0, colors = []; i < settings.paletteSize; ++i)
                            colors.push(palette.getColor(i));
                        settings._colors = colors
                    }
                    return settings
                },
                getAreaSettings: function(commonSettings, options) {
                    var settings = _extend(true, {}, commonSettings, options);
                    settings.borderWidth = _Number(settings.borderWidth) || 0;
                    settings.borderColor = settings.borderColor || null;
                    if (options.color === undefined && options.paletteIndex >= 0)
                        settings.color = commonSettings._colors[options.paletteIndex];
                    settings.color = settings.color || null;
                    settings.hoveredBorderWidth = _Number(settings.hoveredBorderWidth) || settings.borderWidth;
                    settings.hoveredBorderColor = settings.hoveredBorderColor || settings.borderColor;
                    settings.hoveredColor = settings.hoveredColor || settings.color;
                    settings.selectedBorderWidth = _Number(settings.selectedBorderWidth) || settings.borderWidth;
                    settings.selectedBorderColor = settings.selectedBorderColor || settings.borderColor;
                    settings.selectedColor = settings.selectedColor || settings.color;
                    return settings
                },
                getCommonMarkerSettings: function(options) {
                    options && !options.label && options.font && (options.label = {font: options.font}) && (options.font = undefined);
                    var theme = _extend({}, this._theme.markerSettings),
                        _options = _extend({}, options),
                        themeParts = {},
                        optionsParts = {},
                        settings;
                    _each(theme, function(name, themePart) {
                        if (name[0] === "_") {
                            themeParts[name] = themePart;
                            optionsParts[name] = _options[name];
                            theme[name] = _options[name] = undefined
                        }
                    });
                    settings = _extend(true, {}, theme, _options);
                    _each(themeParts, function(name, themePart) {
                        settings[name] = _extend(true, {}, theme, themePart, _options, optionsParts[name])
                    });
                    return settings
                },
                getMarkerSettings: function(commonSettings, options, type) {
                    var settings = _extend(true, {}, commonSettings["_" + type], options);
                    settings.borderWidth = _Number(settings.borderWidth) || 0;
                    settings.borderColor = settings.borderColor || null;
                    settings.color = settings.color || null;
                    settings.opacity = settings.opacity || null;
                    settings.hoveredBorderWidth = _Number(settings.hoveredBorderWidth) || settings.borderWidth;
                    settings.hoveredBorderColor = settings.hoveredBorderColor || settings.borderColor;
                    settings.hoveredColor = settings.hoveredColor || settings.color;
                    settings.hoveredOpacity = settings.hoveredOpacity || settings.opacity;
                    settings.selectedBorderWidth = _Number(settings.selectedBorderWidth) || settings.borderWidth;
                    settings.selectedBorderColor = settings.selectedBorderColor || settings.borderColor;
                    settings.selectedColor = settings.selectedColor || settings.color;
                    settings.selectedOpacity = settings.selectedOpacity || settings.opacity;
                    return settings
                },
                getPieColors: function(commonSettings, count) {
                    var colors = commonSettings._pie._colors || [],
                        palette,
                        i,
                        _count = count > 8 ? count : 8;
                    if (colors.length < _count) {
                        palette = new DX.viz.core.Palette(commonSettings._pie.palette, {
                            stepHighlight: 50,
                            theme: this.themeName()
                        });
                        for (i = 0, colors = []; i < _count; ++i)
                            colors.push(palette.getNextColor());
                        commonSettings._pie._colors = colors
                    }
                    return colors
                }
            });
        DX.viz.map._tests.ThemeManager = ThemeManager;
        DX.viz.map.dxVectorMap.prototype._factory.createThemeManager = function() {
            return new ThemeManager
        }
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file legend.js */
    (function(DX, $, undefined) {
        var _String = String,
            _isArray = DX.utils.isArray,
            _extend = $.extend,
            _each = $.each,
            _BaseLegend = DX.viz.core.Legend;
        function Legend(parameters) {
            var that = this;
            that._params = parameters;
            that._root = parameters.renderer.g().attr({"class": "dxm-legend"});
            parameters.layoutControl.addItem(that);
            _BaseLegend.apply(that, [{
                    renderer: parameters.renderer,
                    group: that._root,
                    backgroundClass: null,
                    itemsGroupClass: null,
                    textField: "text",
                    getFormatObject: function(data) {
                        return data
                    }
                }]);
            that._onDataChanged = function(items) {
                var itemsForUpdate = $.map(items, function(item) {
                        return _extend(true, {states: {normal: {fill: item.color}}}, item)
                    });
                that.update(itemsForUpdate, that._options);
                that._refresh()
            }
        }
        var legendPrototype = Legend.prototype = DX.utils.clone(_BaseLegend.prototype);
        legendPrototype.constructor = Legend;
        legendPrototype.dispose = function() {
            var that = this;
            that._params.layoutControl.removeItem(that);
            that._unbindData();
            that._params = that._root = that._onDataChanged = null;
            return _BaseLegend.prototype.dispose.apply(that, arguments)
        };
        legendPrototype.clean = function() {
            this._rendered = false;
            this._root.remove();
            return this
        };
        legendPrototype.render = function() {
            var that = this;
            that._root.append(that._params.container);
            that._rendered = true;
            that._refresh();
            return that
        };
        legendPrototype.resize = function(size) {
            if (size === null)
                this.erase();
            else
                this.setSize(size).draw();
            return this
        };
        legendPrototype.locate = _BaseLegend.prototype.shift;
        legendPrototype._unbindData = function() {
            if (this._dataCategory)
                this._params.dataExchanger.unbind(this._dataCategory, this._dataName)
        };
        legendPrototype._bindData = function(info) {
            this._params.dataExchanger.bind(this._dataCategory = info.category, this._dataName = info.name, this._onDataChanged)
        };
        var sourceMap = {
                areacolorgroups: {
                    category: "areas",
                    name: "color"
                },
                markercolorgroups: {
                    category: "markers",
                    name: "color"
                },
                markersizegroups: {
                    category: "markers",
                    name: "size"
                }
            };
        var unknownSource = {
                category: "UNKNOWN",
                name: "UNKNOWN"
            };
        legendPrototype.setOptions = function(options) {
            var that = this;
            that.update(that._data, options);
            that._unbindData();
            that._bindData(sourceMap[_String(options.source).toLowerCase()] || unknownSource);
            that._refresh();
            return that
        };
        legendPrototype._refresh = function() {
            if (this._rendered)
                this.updateLayout()
        };
        function LegendsControl(parameters) {
            this._parameters = parameters;
            this._items = []
        }
        LegendsControl.prototype = {
            constructor: LegendsControl,
            dispose: function() {
                _each(this._items, function(_, item) {
                    item.dispose()
                });
                this._parameters = this._items = null;
                return this
            },
            setOptions: function(options, theme) {
                var optionList = _isArray(options) ? options : [],
                    i = 0,
                    ii = optionList.length,
                    item,
                    newItems = [],
                    items = this._items;
                for (; i < ii; ++i) {
                    item = (items[i] || new Legend(this._parameters)).setOptions(_extend(true, {}, theme, optionList[i]));
                    newItems.push(item)
                }
                for (ii = items.length; i < ii; ++i)
                    items[i].clean().dispose();
                this._items = newItems
            },
            clean: function() {
                _each(this._items, function(_, item) {
                    item.clean()
                });
                return this
            },
            render: function() {
                _each(this._items, function(_, item) {
                    item.render()
                });
                return this
            }
        };
        DX.viz.map.dxVectorMap.prototype._factory.createLegendsControl = function(parameters) {
            return new LegendsControl(parameters)
        };
        DX.viz.map._tests.Legend = Legend;
        DX.viz.map._tests.LegendsControl = LegendsControl;
        DX.viz.map._tests.stubLegendType = function(stub) {
            Legend = stub
        };
        DX.viz.map._tests.restoreLegendType = function() {
            Legend = DX.viz.map._tests.Legend
        };
        DX.viz.map._tests.extendLegendSourceMap = function(name, value) {
            sourceMap[name] = value
        }
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file layout.js */
    (function(DX, $, undefined) {
        var _round = Math.round,
            _min = Math.min,
            _max = Math.max,
            _each = $.each,
            _inArray = $.inArray,
            horizontalAlignmentMap = {
                left: 0,
                center: 1,
                right: 2
            },
            verticalAlignmentMap = {
                top: 0,
                bottom: 1
            };
        function getCellIndex(options) {
            return verticalAlignmentMap[options.verticalAlignment] * 3 + horizontalAlignmentMap[options.horizontalAlignment]
        }
        function createCells(canvas, items) {
            var hstep = (canvas.right - canvas.left) / 3,
                vstep = (canvas.bottom - canvas.top) / 2,
                h1 = canvas.left,
                h2 = _round(h1 + hstep),
                h3 = _round(h1 + hstep + hstep),
                h4 = canvas.right,
                v1 = canvas.top,
                v2 = _round(v1 + vstep),
                v3 = canvas.bottom,
                cells = [{rect: [h1, v1, h2, v2]}, {
                        rect: [h2, v1, h3, v2],
                        center: true
                    }, {
                        rect: [h3, v1, h4, v2],
                        horInv: true
                    }, {
                        rect: [h1, v2, h2, v3],
                        verInv: true
                    }, {
                        rect: [h2, v2, h3, v3],
                        center: true,
                        verInv: true
                    }, {
                        rect: [h3, v2, h4, v3],
                        horInv: true,
                        verInv: true
                    }],
                itemsList = [[], [], [], [], [], []];
            _each(items, function(_, item) {
                var options = item.getLayoutOptions();
                if (options)
                    itemsList[getCellIndex(options)].push({
                        item: item,
                        width: options.width,
                        height: options.height
                    })
            });
            _each(cells, function(i, cell) {
                if (itemsList[i].length)
                    cell.items = itemsList[i];
                else {
                    if (cell.center)
                        cell.rect[0] = cell.rect[2] = (cell.rect[0] + cell.rect[2]) / 2;
                    else
                        cell.rect[cell.horInv ? 0 : 2] = cell.rect[cell.horInv ? 2 : 0];
                    cell.rect[cell.verInv ? 1 : 3] = cell.rect[cell.verInv ? 3 : 1]
                }
            });
            return cells
        }
        function adjustCellSizes(cells) {
            _each([0, 1, 2, 3, 4, 5], function(_, index) {
                var cell = cells[index],
                    otherCell = cells[(index + 3) % 6];
                if (cell.items)
                    if (!otherCell.items) {
                        cell.rect[1] = _min(cell.rect[1], otherCell.rect[3]);
                        cell.rect[3] = _max(cell.rect[3], otherCell.rect[1])
                    }
            });
            _each([1, 4], function(_, index) {
                var cell = cells[index],
                    otherCell1 = cells[index - 1],
                    otherCell2 = cells[index + 1],
                    size1,
                    size2;
                if (cell.items) {
                    if (!otherCell1.items && !otherCell2.items) {
                        size1 = cell.rect[0] - otherCell1.rect[2];
                        size2 = otherCell2.rect[0] - cell.rect[2];
                        if (size1 > size2)
                            if (size1 / size2 >= 2) {
                                cell.rect[0] -= size1;
                                cell.right = true
                            }
                            else {
                                cell.rect[0] -= size2;
                                cell.rect[2] += size2
                            }
                        else if (size2 / size1 >= 2) {
                            cell.rect[2] += size2;
                            cell.center = null
                        }
                        else {
                            cell.rect[0] -= size1;
                            cell.rect[2] += size1
                        }
                    }
                }
                else {
                    if (otherCell1.items)
                        otherCell1.rect[2] = (cell.rect[0] + cell.rect[2]) / 2;
                    if (otherCell2.items)
                        otherCell2.rect[0] = (cell.rect[0] + cell.rect[2]) / 2
                }
            })
        }
        function adjustCellsAndApplyLayout(cells, forceMode) {
            var hasHiddenItems = false;
            adjustCellSizes(cells);
            _each(cells, function(_, cell) {
                if (cell.items)
                    hasHiddenItems = applyCellLayout(cell, forceMode) || hasHiddenItems
            });
            return hasHiddenItems
        }
        function applyCellLayout(cell, forceMode) {
            var cellRect = cell.rect,
                cellWidth = cellRect[2] - cellRect[0],
                cellHeight = cellRect[3] - cellRect[1],
                xoffset = 0,
                yoffset = 0,
                currentHeight = 0,
                totalL = cellRect[2],
                totalT = cellRect[3],
                totalR = cellRect[0],
                totalB = cellRect[1],
                moves = [],
                hasHiddenItems = false;
            _each(cell.items, function(_, item) {
                if (item.width > cellWidth || item.height > cellHeight) {
                    moves.push(null);
                    hasHiddenItems = true;
                    return forceMode || false
                }
                if (xoffset + item.width > cellWidth) {
                    yoffset += currentHeight;
                    xoffset = currentHeight = 0
                }
                if (yoffset + item.height > cellHeight) {
                    moves.push(null);
                    hasHiddenItems = true;
                    return forceMode || false
                }
                currentHeight = _max(currentHeight, item.height);
                var dx = cell.horInv ? cellRect[2] - item.width - xoffset : cellRect[0] + xoffset,
                    dy = cell.verInv ? cellRect[3] - item.height - yoffset : cellRect[1] + yoffset;
                xoffset += item.width;
                totalL = _min(totalL, dx);
                totalT = _min(totalT, dy);
                totalR = _max(totalR, dx + item.width);
                totalB = _max(totalB, dy + item.height);
                moves.push([dx, dy])
            });
            if (forceMode || !hasHiddenItems) {
                xoffset = 0;
                if (cell.right)
                    xoffset = cellRect[2] - cellRect[0] - totalR + totalL;
                else if (cell.center)
                    xoffset = _round((cellRect[2] - cellRect[0] - totalR + totalL) / 2);
                _each(cell.items, function(i, item) {
                    var move = moves[i];
                    if (move)
                        item.item.locate(move[0] + xoffset, move[1]);
                    else
                        item.item.resize(null)
                });
                cell.rect = [totalL, totalT, totalR, totalB];
                cell.items = null
            }
            return hasHiddenItems
        }
        function applyLayout(canvas, items) {
            var cells = createCells(canvas, items);
            if (adjustCellsAndApplyLayout(cells))
                adjustCellsAndApplyLayout(cells, true)
        }
        function LayoutControl() {
            var that = this;
            that._items = [];
            that._suspended = true;
            that._updateLayout = function() {
                that._update()
            }
        }
        LayoutControl.prototype = {
            constructor: LayoutControl,
            dispose: function() {
                this._items = this._updateLayout = null;
                return this
            },
            setSize: function(width, height) {
                this._size = {
                    width: width,
                    height: height
                };
                this._update();
                return this
            },
            stop: function() {
                this._suspended = true;
                return this
            },
            start: function() {
                this._suspended = null;
                this._update();
                return this
            },
            addItem: function(item) {
                this._items.push(item);
                item.updateLayout = this._updateLayout;
                return this
            },
            removeItem: function(item) {
                this._items.splice(_inArray(item, this._items), 1);
                item.updateLayout = null;
                return this
            },
            _update: function() {
                if (this._suspended)
                    return;
                var size = this._size;
                _each(this._items, function(_, item) {
                    item.resize(size)
                });
                applyLayout({
                    left: 0,
                    top: 0,
                    right: size.width,
                    bottom: size.height
                }, this._items)
            }
        };
        DX.viz.map.dxVectorMap.prototype._factory.createLayoutControl = function() {
            return new LayoutControl
        };
        DX.viz.map._tests.LayoutControl = LayoutControl
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file mapItemsManager.js */
    (function(DX, $, undefined) {
        var _isFinite = isFinite,
            _utils = DX.utils,
            _coreUtils = DX.viz.core.utils,
            _isString = _utils.isString,
            _isArray = _utils.isArray,
            _isFunction = _utils.isFunction,
            _patchFontOptions = _coreUtils.patchFontOptions,
            _parseScalar = _coreUtils.parseScalar,
            _extend = $.extend,
            _each = $.each,
            _map = $.map;
        var SELECTIONS = {
                none: null,
                single: -1,
                multiple: NaN
            };
        function getSelection(selectionMode) {
            var selection = String(selectionMode).toLowerCase();
            selection = selection in SELECTIONS ? SELECTIONS[selection] : SELECTIONS.single;
            if (selection !== null)
                selection = {
                    state: {},
                    single: selection || null
                };
            return selection
        }
        function createEventTriggers(context, trigger, names) {
            context.raiseHoverChanged = function(handle, state) {
                trigger(names.hoverChanged, {
                    target: handle.proxy,
                    state: state
                })
            };
            context.raiseSelectionChanged = function(handle) {
                trigger(names.selectionChanged, {target: handle.proxy})
            }
        }
        var MapItemsManager = DX.Class.inherit({
                _rootClass: null,
                ctor: function(parameters) {
                    var that = this;
                    that._params = parameters;
                    that._init();
                    parameters.projection.on({
                        project: function() {
                            that._reproject()
                        },
                        transform: function(transform) {
                            that._transform(transform);
                            that._relocate()
                        },
                        center: function(_, transform) {
                            that._transform(transform)
                        },
                        zoom: function(_, transform) {
                            that._transform(transform);
                            that._relocate()
                        }
                    })
                },
                _init: function() {
                    var that = this;
                    that._context = {
                        renderer: that._params.renderer,
                        projection: that._params.projection,
                        dataKey: that._params.dataKey,
                        selection: null,
                        getItemSettings: that._createItemSettingsBuilder()
                    };
                    that._initRoot();
                    createEventTriggers(that._context, that._params.eventTrigger, that._eventNames)
                },
                _createItemSettingsBuilder: function() {
                    var that = this;
                    return function(proxy, settings) {
                            var result = {};
                            _each(that._grouping, function(settingField, grouping) {
                                var value,
                                    index;
                                if (_isFinite(value = grouping.callback(proxy)) && (index = findGroupPosition(value, grouping.groups)) >= 0)
                                    result[settingField] = grouping.groups[index][settingField]
                            });
                            return that._getItemSettings(proxy, _extend({}, settings, result))
                        }
                },
                _initRoot: function() {
                    this._context.root = this._root = this._params.renderer.g().attr({"class": this._rootClass})
                },
                dispose: function() {
                    var that = this;
                    that._destroyHandles();
                    that._params = that._context = that._grouping = null;
                    that._disposeRoot();
                    return that
                },
                _disposeRoot: function() {
                    this._root = null
                },
                clean: function() {
                    var that = this;
                    that._destroyItems();
                    that._removeRoot();
                    that._rendered = false;
                    return that
                },
                _removeRoot: function() {
                    this._root.remove()
                },
                setOptions: function(options) {
                    var that = this;
                    that._processOptions(options || {});
                    that._params.notifyDirty();
                    that._destroyItems();
                    that._createItems(that._params.notifyReady);
                    return that
                },
                render: function() {
                    var that = this;
                    that._rendered = true;
                    that._params.notifyDirty();
                    that._appendRoot();
                    that._createItems(that._params.notifyReady, true);
                    return that
                },
                _processOptions: function(options) {
                    var that = this,
                        settings = that._commonSettings = that._getCommonSettings(options),
                        context = that._context;
                    that._customizeCallback = _isFunction(settings.customize) ? settings.customize : $.noop;
                    context.hover = !!_parseScalar(settings.hoverEnabled, true);
                    if (context.selection)
                        _each(context.selection.state, function(_, handle) {
                            handle && handle.resetSelected()
                        });
                    context.selection = getSelection(settings.selectionMode);
                    that._grouping = {};
                    that._updateGrouping()
                },
                _appendRoot: function() {
                    this._root.append(this._params.container)
                },
                _destroyItems: function() {
                    var that = this;
                    that._clearRoot();
                    clearTimeout(that._labelsTimeout);
                    that._rendered && that._handles && _each(that._handles, function(_, handle) {
                        if (handle.item) {
                            handle.item.dispose();
                            handle.item = null
                        }
                    })
                },
                _clearRoot: function() {
                    this._root.clear()
                },
                _destroyHandles: function() {
                    this._handles && _each(this._handles, function(_, handle) {
                        handle.dispose()
                    });
                    this._handles = null
                },
                _createHandles: function(source) {
                    var that = this;
                    if (_isArray(source))
                        that._handles = _map(source, function(dataItem, i) {
                            dataItem = dataItem || {};
                            var handle = new MapItemHandle(that._context, that._getItemCoordinates(dataItem), that._getItemAttributes(dataItem), i, that._itemType),
                                proxy = handle.proxy;
                            that._initProxy(proxy, dataItem);
                            handle.settings = that._customizeCallback.call(proxy, proxy) || {};
                            if (handle.settings.isSelected)
                                proxy.selected(true);
                            return handle
                        })
                },
                _createItems: function(notifyReady) {
                    var that = this,
                        selectedItems = [],
                        immediateReady = true;
                    if (that._rendered && that._handles) {
                        _each(that._handles, function(_, handle) {
                            handle.item = that._createItem(handle.proxy).init(that._context, handle.proxy).project().update(handle.settings).locate();
                            if (handle.proxy.selected())
                                selectedItems.push(handle.item)
                        });
                        _each(selectedItems, function(_, item) {
                            item.setSelectedState()
                        });
                        that._arrangeItems();
                        if (that._commonSettings.label.enabled) {
                            immediateReady = false;
                            clearTimeout(that._labelsTimeout);
                            that._labelsTimeout = setTimeout(function() {
                                _each(that._handles, function(_, handle) {
                                    handle.item.createLabel()
                                });
                                notifyReady()
                            })
                        }
                    }
                    immediateReady && notifyReady()
                },
                _processSource: null,
                setData: function(data) {
                    var that = this;
                    that._params.notifyDirty();
                    if (_isString(data))
                        $.getJSON(data).done(updateSource).fail(function() {
                            updateSource(null)
                        });
                    else
                        updateSource(data);
                    return that;
                    function updateSource(source) {
                        if (that._rendered)
                            that._params.tracker.reset();
                        that._destroyItems();
                        that._destroyHandles();
                        that._createHandles(that._processSource(source));
                        that._createItems(that._params.notifyReady)
                    }
                },
                _transform: function(transform) {
                    this._root.attr(transform)
                },
                _reproject: function() {
                    this._rendered && this._handles && _each(this._handles, function(_, handle) {
                        handle.item.project().locate()
                    })
                },
                _relocate: function() {
                    this._rendered && this._handles && _each(this._handles, function(_, handle) {
                        handle.item.locate()
                    })
                },
                hoverItem: function(index, state) {
                    this._handles[index].setHovered(state);
                    return this
                },
                selectItem: function(index, state, noCallback) {
                    this._handles[index].setSelected(state, noCallback);
                    return this
                },
                clearSelection: function() {
                    var selection = this._context.selection;
                    if (selection)
                        _each(selection.state, function(_, handle) {
                            handle && handle.setSelected(false)
                        });
                    return this
                },
                raiseClick: function(index, $event) {
                    this._params.eventTrigger(this._eventNames.click, {
                        target: this._handles[index].proxy,
                        jQueryEvent: $event
                    });
                    return this
                },
                getProxyItems: function() {
                    return _map(this._handles, function(handle) {
                            return handle.proxy
                        })
                },
                getProxyItem: function(index) {
                    return this._handles[index].proxy
                },
                _performGrouping: function(partition, settingField, valueCallback, valuesCallback) {
                    var groups = createGroups(partition),
                        values;
                    if (groups) {
                        values = valuesCallback(groups.length);
                        _each(groups, function(i, group) {
                            group.index = i;
                            group[settingField] = values[i]
                        });
                        this._grouping[settingField] = {
                            callback: valueCallback,
                            groups: groups
                        }
                    }
                    else {
                        delete this._grouping[settingField];
                        groups = []
                    }
                    this._params.dataExchanger.set(this._dataCategory, settingField, groups)
                },
                _groupByColor: function(colorGroups, palette, valueCallback) {
                    this._performGrouping(colorGroups, "color", valueCallback, function(count) {
                        var _palette = new DX.viz.core.GradientPalette(palette, count),
                            i = 0,
                            list = [];
                        for (; i < count; ++i)
                            list.push(_palette.getColor(i));
                        return list
                    })
                }
            });
        MapItemsManager.prototype.TEST_getContext = function() {
            return this._context
        };
        MapItemsManager.prototype.TEST_performGrouping = MapItemsManager.prototype._performGrouping;
        MapItemsManager.prototype.TEST_groupByColor = MapItemsManager.prototype._groupByColor;
        DX.viz.map._internal.mapItemBehavior = {
            init: function(ctx, proxy) {
                var that = this;
                that._ctx = ctx;
                that._data = {
                    index: proxy.index,
                    type: proxy.type
                };
                that._proxy = proxy;
                that._root = that._createRoot().append(that._ctx.root);
                return that
            },
            dispose: function() {
                disposeItem(this);
                return this
            },
            project: function() {
                var that = this;
                that._coords = that._project(that._ctx.projection, that._proxy.coordinates());
                return this
            },
            locate: function() {
                var that = this;
                that._locate(that._transform(that._ctx.projection, that._coords));
                that._label && that._label.value && that._locateLabel();
                return that
            },
            update: function(settings) {
                var that = this;
                that._settings = that._ctx.getItemSettings(that._proxy, settings);
                that._update(that._settings);
                that._label && that._updateLabel();
                return that
            },
            createLabel: function() {
                var that = this;
                that._label = {
                    root: that._createLabelRoot(),
                    text: that._ctx.renderer.text(),
                    tracker: that._ctx.renderer.rect().attr({
                        stroke: "none",
                        "stroke-width": 0,
                        fill: "#000000",
                        opacity: 0.0001
                    }).data(that._ctx.dataKey, that._data)
                };
                that._updateLabel();
                return that
            },
            _updateLabel: function() {
                var that = this,
                    settings = that._settings.label;
                that._label.value = String(this._proxy.text || this._proxy.attribute(this._settings.label.dataField) || "");
                if (that._label.value) {
                    that._label.text.attr({
                        text: that._label.value,
                        x: 0,
                        y: 0
                    }).css(_patchFontOptions(settings.font)).attr({
                        align: "center",
                        stroke: settings.stroke,
                        "stroke-width": settings["stroke-width"],
                        "stroke-opacity": settings["stroke-opacity"]
                    }).append(that._label.root);
                    that._label.tracker.append(that._label.root);
                    that._adjustLabel();
                    that._locateLabel()
                }
            }
        };
        var MapItemHandle = function(context, coordinates, attributes, index, type) {
                var handle = this;
                handle._ctx = context;
                handle._idx = index;
                handle._hovered = handle._selected = false;
                attributes = _extend({}, attributes);
                handle.proxy = {
                    index: index,
                    type: type,
                    coordinates: function() {
                        return coordinates
                    },
                    attribute: function(name, value) {
                        if (arguments.length > 1) {
                            attributes[name] = value;
                            return this
                        }
                        else
                            return arguments.length > 0 ? attributes[name] : attributes
                    },
                    selected: function(state, _noEvent) {
                        if (arguments.length > 0) {
                            handle.setSelected(!!state, _noEvent);
                            return this
                        }
                        else
                            return handle._selected
                    },
                    applySettings: function(settings) {
                        _extend(true, handle.settings, settings);
                        handle.item && handle.item.update(handle.settings);
                        return this
                    }
                }
            };
        MapItemHandle.prototype = {
            constructor: MapItemHandle,
            dispose: function() {
                disposeItem(this.proxy);
                disposeItem(this);
                return this
            },
            setHovered: function(state) {
                state = !!state;
                var that = this;
                if (that._ctx.hover && that._hovered !== state) {
                    that._hovered = state;
                    if (that.item) {
                        if (that._hovered)
                            that.item.onHover();
                        if (!that._selected) {
                            that.item[that._hovered ? "setHoveredState" : "setDefaultState"]();
                            that._ctx.raiseHoverChanged(that, that._hovered)
                        }
                    }
                }
                return that
            },
            resetSelected: function() {
                this._selected = false;
                return this
            },
            setSelected: function(state, _noEvent) {
                state = !!state;
                var that = this,
                    context = that._ctx,
                    selection = that._ctx.selection,
                    tmp;
                if (selection && that._selected !== state) {
                    that._selected = state;
                    tmp = selection.state[selection.single];
                    selection.state[selection.single] = null;
                    if (tmp)
                        tmp.setSelected(false);
                    selection.state[selection.single || that._idx] = state ? that : null;
                    if (that.item) {
                        that.item[state ? "setSelectedState" : that._hovered ? "setHoveredState" : "setDefaultState"]();
                        if (!_noEvent)
                            context.raiseSelectionChanged(that)
                    }
                }
                return that
            }
        };
        function disposeItem(item) {
            _each(item, function(name) {
                item[name] = null
            })
        }
        function createGroups(partition) {
            var i,
                ii,
                groups = null;
            if (_isArray(partition) && partition.length > 1) {
                groups = [];
                for (i = 0, ii = partition.length - 1; i < ii; ++i)
                    groups.push({
                        start: Number(partition[i]),
                        end: Number(partition[i + 1])
                    })
            }
            return groups
        }
        function findGroupPosition(value, groups) {
            var i = 0,
                ii = groups.length;
            for (; i < ii; ++i)
                if (groups[i].start <= value && value <= groups[i].end)
                    return i;
            return -1
        }
        _extend(DX.viz.map._tests, {
            MapItemsManager: MapItemsManager,
            MapItemHandle: MapItemHandle,
            stubMapItemHandle: function(mapItemHandleType) {
                MapItemHandle = mapItemHandleType
            },
            restoreMapItemHandle: function() {
                MapItemHandle = DX.viz.map._tests.MapItemHandle
            }
        });
        DX.viz.map.dxVectorMap.prototype._factory.MapItemsManager = MapItemsManager
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file areasManager.js */
    (function(DX, $, undefined) {
        var _abs = Math.abs,
            _sqrt = Math.sqrt,
            _noop = $.noop,
            TOLERANCE = 1;
        var AreasManager = DX.viz.map.dxVectorMap.prototype._factory.MapItemsManager.inherit({
                _rootClass: "dxm-areas",
                _dataCategory: "areas",
                _eventNames: {
                    click: "areaClick",
                    hoverChanged: "areaHoverChanged",
                    selectionChanged: "areaSelectionChanged"
                },
                _initRoot: function() {
                    var that = this;
                    that.callBase.apply(that, arguments);
                    that._context.labelRoot = that._labelRoot = that._params.renderer.g().attr({"class": "dxm-area-labels"})
                },
                _disposeRoot: function() {
                    this.callBase.apply(this, arguments);
                    this._labelRoot = null
                },
                _processSource: function(source) {
                    var isGeoJson = source && source.type === "FeatureCollection";
                    this._getItemCoordinates = isGeoJson ? getCoordinatesGeoJson : getCoordinatesDefault;
                    this._getItemAttributes = isGeoJson ? getAttributesGeoJson : getAttributesDefault;
                    return isGeoJson ? source.features : source
                },
                _getCommonSettings: function(options) {
                    return this._params.themeManager.getCommonAreaSettings(options)
                },
                _initProxy: _noop,
                _itemType: "area",
                _removeRoot: function() {
                    this.callBase.apply(this, arguments);
                    this._labelRoot.remove()
                },
                _appendRoot: function() {
                    var that = this;
                    that.callBase.apply(that, arguments);
                    if (that._commonSettings.label.enabled)
                        that._labelRoot.append(that._params.container)
                },
                _clearRoot: function() {
                    this.callBase.apply(this, arguments);
                    this._labelRoot.clear()
                },
                _getItemSettings: function(_, options) {
                    return this._params.themeManager.getAreaSettings(this._commonSettings, options)
                },
                _transform: function(transform) {
                    this.callBase.apply(this, arguments);
                    this._labelRoot.attr(transform)
                },
                _createItem: function() {
                    return new Area
                },
                _updateGrouping: function() {
                    var commonSettings = this._commonSettings,
                        attributeName = commonSettings.colorGroupingField;
                    this._groupByColor(commonSettings.colorGroups, commonSettings.palette, function(proxy) {
                        return proxy.attribute(attributeName)
                    })
                },
                _arrangeItems: _noop
            });
        function getCoordinatesDefault(dataItem) {
            return dataItem.coordinates
        }
        function getCoordinatesGeoJson(dataItem) {
            var coordinates,
                type;
            if (dataItem.geometry) {
                type = dataItem.geometry.type;
                coordinates = dataItem.geometry.coordinates;
                if (coordinates && (type === "Polygon" || type === "MultiPolygon"))
                    type === "MultiPolygon" && (coordinates = [].concat.apply([], coordinates));
                else
                    coordinates = undefined
            }
            return coordinates
        }
        function getAttributesDefault(dataItem) {
            return dataItem.attributes
        }
        function getAttributesGeoJson(dataItem) {
            return dataItem.properties
        }
        function Area(){}
        $.extend(Area.prototype, DX.viz.map._internal.mapItemBehavior, {
            _project: function(projection, coords) {
                return projection.projectArea(coords)
            },
            _createRoot: function() {
                return this._ctx.renderer.path([], "area").data(this._ctx.dataKey, this._data)
            },
            _update: function(settings) {
                this._styles = {
                    normal: {
                        "class": "dxm-area",
                        stroke: settings.borderColor,
                        "stroke-width": settings.borderWidth,
                        fill: settings.color
                    },
                    hovered: {
                        "class": "dxm-area dxm-area-hovered",
                        stroke: settings.hoveredBorderColor,
                        "stroke-width": settings.hoveredBorderWidth,
                        fill: settings.hoveredColor
                    },
                    selected: {
                        "class": "dxm-area dxm-area-selected",
                        stroke: settings.selectedBorderColor,
                        "stroke-width": settings.selectedBorderWidth,
                        fill: settings.selectedColor
                    }
                };
                this._root.attr(this._styles.normal);
                return this
            },
            _transform: function(projection, coords) {
                return projection.getAreaCoordinates(coords)
            },
            _locate: function(coords) {
                this._root.attr({points: coords})
            },
            onHover: _noop,
            setDefaultState: function() {
                this._root.attr(this._styles.normal).toBackground()
            },
            setHoveredState: function() {
                this._root.attr(this._styles.hovered).toForeground()
            },
            setSelectedState: function() {
                this._root.attr(this._styles.selected).toForeground()
            },
            _createLabelRoot: function() {
                return this._ctx.renderer.g().attr({"class": "dxm-area-label"}).append(this._ctx.labelRoot)
            },
            _adjustLabel: function() {
                var that = this,
                    centroid = calculateAreaCentroid(that._coords),
                    bbox = that._label.text.getBBox(),
                    offset = -bbox.y - bbox.height / 2;
                that._centroid = centroid.coords;
                that._areaSize = _sqrt(centroid.area);
                that._labelSize = [bbox.width, bbox.height];
                that._label.text.attr({y: offset});
                that._label.tracker.attr({
                    x: bbox.x,
                    y: bbox.y + offset,
                    width: bbox.width,
                    height: bbox.height
                })
            },
            _locateLabel: function() {
                var that = this,
                    coords = that._ctx.projection.getPointCoordinates(that._centroid),
                    size = that._ctx.projection.getSquareSize([that._areaSize, that._areaSize]);
                that._label.root.attr({
                    translateX: coords.x,
                    translateY: coords.y,
                    visibility: that._labelSize[0] / size[0] < TOLERANCE && that._labelSize[1] / size[1] < TOLERANCE ? null : "hidden"
                })
            }
        });
        function calculatePolygonCentroid(coordinates) {
            var i = 0,
                ii = coordinates.length,
                v1,
                v2 = coordinates[ii - 1],
                cross,
                cx = 0,
                cy = 0,
                area = 0;
            for (; i < ii; ++i) {
                v1 = v2;
                v2 = coordinates[i];
                cross = v1[0] * v2[1] - v2[0] * v1[1];
                area += cross;
                cx += (v1[0] + v2[0]) * cross;
                cy += (v1[1] + v2[1]) * cross
            }
            area /= 2;
            cx /= 6 * area;
            cy /= 6 * area;
            return {
                    coords: [cx, cy],
                    area: _abs(area)
                }
        }
        function calculateAreaCentroid(coordinates) {
            var i = 0,
                ii = coordinates.length,
                centroid,
                resultCentroid,
                maxArea = 0;
            for (; i < ii; ++i) {
                centroid = calculatePolygonCentroid(coordinates[i]);
                if (centroid.area > maxArea) {
                    maxArea = centroid.area;
                    resultCentroid = centroid
                }
            }
            return resultCentroid
        }
        DX.viz.map._internal.AreasManager = AreasManager;
        DX.viz.map._internal.Area = Area;
        DX.viz.map._tests.AreasManager = AreasManager;
        DX.viz.map._tests.Area = Area;
        DX.viz.map.dxVectorMap.prototype._factory.createAreasManager = function(parameters) {
            return new AreasManager(parameters)
        }
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file markersManager.js */
    (function(DX, $, undefined) {
        var _Number = Number,
            _String = String,
            _isFinite = isFinite,
            _math = Math,
            _round = _math.round,
            _max = _math.max,
            _min = _math.min,
            _extend = $.extend,
            _each = $.each,
            _isArray = DX.utils.isArray,
            CLASS_DEFAULT = "dxm-marker",
            CLASS_HOVERED = "dxm-marker dxm-marker-hovered",
            CLASS_SELECTED = "dxm-marker dxm-marker-selected",
            DOT = "dot",
            BUBBLE = "bubble",
            PIE = "pie",
            IMAGE = "image",
            DEFAULT_MARKER_TYPE = null,
            MARKER_TYPES = {};
        var MarkersManager = DX.viz.map.dxVectorMap.prototype._factory.MapItemsManager.inherit({
                _rootClass: "dxm-markers",
                _dataCategory: "markers",
                _eventNames: {
                    click: "markerClick",
                    hoverChanged: "markerHoverChanged",
                    selectionChanged: "markerSelectionChanged"
                },
                _init: function() {
                    var that = this;
                    that.callBase.apply(that, arguments);
                    that._context.getPieColors = function(count) {
                        return that._params.themeManager.getPieColors(that._commonSettings, count)
                    };
                    that._filter = that._params.renderer.shadowFilter("-40%", "-40%", "180%", "200%", 0, 1, 1, "#000000", 0.2)
                },
                _dispose: function() {
                    this.callBase.apply(this, arguments);
                    this._filter.dispose();
                    this._filter = null
                },
                _getItemCoordinates: function(dataItem) {
                    return dataItem.coordinates
                },
                _getItemAttributes: function(dataItem) {
                    return dataItem.attributes
                },
                _processSource: function(source) {
                    return source
                },
                _getCommonSettings: function(options) {
                    return this._params.themeManager.getCommonMarkerSettings(options)
                },
                _processOptions: function(options) {
                    var that = this;
                    that._commonType = parseMarkerType(options && options.type, DEFAULT_MARKER_TYPE);
                    that.callBase.apply(that, arguments);
                    that._commonSettings._filter = that._filter.ref
                },
                _arrangeBubbles: function() {
                    var markers = this._handles,
                        bubbles = [],
                        i,
                        ii = markers.length,
                        marker,
                        values = [],
                        minValue,
                        maxValue,
                        deltaValue;
                    if (this._commonSettings._bubble.sizeGroups)
                        return;
                    for (i = 0; i < ii; ++i) {
                        marker = markers[i];
                        if (marker.item.type === BUBBLE) {
                            bubbles.push(marker);
                            if (_isFinite(marker.proxy.value))
                                values.push(marker.proxy.value)
                        }
                    }
                    minValue = _min.apply(null, values);
                    maxValue = _max.apply(null, values);
                    deltaValue = maxValue - minValue || 1;
                    for (i = 0, ii = bubbles.length; i < ii; ++i) {
                        marker = bubbles[i];
                        marker.item.setSize(_isFinite(marker.proxy.value) ? (marker.proxy.value - minValue) / deltaValue : 0)
                    }
                },
                _itemType: "marker",
                _initProxy: function(proxy, dataItem) {
                    _each(dataItem, function(name, value) {
                        if (proxy[name] === undefined)
                            proxy[name] = value
                    });
                    proxy._TYPE = parseMarkerType(dataItem.type, null)
                },
                _getItemSettings: function(proxy, options) {
                    var type = proxy._TYPE || this._commonType,
                        settings = this._params.themeManager.getMarkerSettings(this._commonSettings, _extend({}, proxy.style, options), type);
                    proxy.text = proxy.text || settings.text;
                    return settings
                },
                _createItem: function(proxy) {
                    return new MARKER_TYPES[proxy._TYPE || this._commonType]
                },
                _updateGrouping: function() {
                    var that = this,
                        markerType = that._commonType,
                        colorDataField,
                        sizeDataField,
                        commonSettings = that._commonSettings["_" + markerType];
                    if (markerType === DOT || markerType === BUBBLE) {
                        colorDataField = commonSettings.colorGroupingField;
                        that._groupByColor(commonSettings.colorGroups, commonSettings.palette, function(proxy) {
                            return !proxy._TYPE || proxy._TYPE === markerType ? proxy.attribute(colorDataField) : NaN
                        })
                    }
                    sizeDataField = commonSettings.sizeGroupingField;
                    that._performGrouping(commonSettings.sizeGroups, "size", function(proxy) {
                        return !proxy._TYPE || proxy._TYPE === markerType ? proxy.value || proxy.attribute(sizeDataField) : NaN
                    }, function(count) {
                        var minSize = commonSettings.minSize > 0 ? _Number(commonSettings.minSize) : 0,
                            maxSize = commonSettings.maxSize >= minSize ? _Number(commonSettings.maxSize) : 0,
                            i = 0,
                            sizes = [];
                        for (i = 0; i < count; ++i)
                            sizes.push((minSize * (count - i - 1) + maxSize * i) / (count - 1));
                        return sizes
                    })
                },
                _updateLegendForPies: function() {
                    var count = 0;
                    _each(this._handles, function(_, handle) {
                        var proxy = handle.proxy,
                            values;
                        if (!proxy._TYPE || proxy._TYPE === PIE) {
                            values = proxy.values;
                            if (values && values.length > count)
                                count = values.length
                        }
                    });
                    if (count > 0)
                        this._params.dataExchanger.set(this._dataCategory, "color", $.map(this._context.getPieColors(count).slice(0, count), function(color, i) {
                            return {
                                    index: i,
                                    color: color
                                }
                        }))
                },
                _arrangeItems: function() {
                    this._arrangeBubbles();
                    this._updateLegendForPies()
                }
            });
        var baseMarkerBehavior = _extend({}, DX.viz.map._internal.mapItemBehavior, {
                _project: function(projection, coords) {
                    return projection.projectPoint(coords)
                },
                _createRoot: function() {
                    return this._ctx.renderer.g()
                },
                _update: function(settings) {
                    var that = this;
                    that._root.attr({"class": CLASS_DEFAULT}).clear();
                    that._create(settings, that._ctx.renderer, that._root);
                    return that
                },
                _transform: function(projection, coords) {
                    return projection.getPointCoordinates(coords)
                },
                _locate: function(coords) {
                    this._root.attr({
                        translateX: coords.x,
                        translateY: coords.y
                    })
                },
                onHover: function() {
                    this._root.toForeground()
                },
                setDefaultState: function() {
                    this._root.attr({"class": CLASS_DEFAULT}).toBackground();
                    this._applyDefault()
                },
                setHoveredState: function() {
                    this._root.attr({"class": CLASS_HOVERED});
                    this._applyHovered()
                },
                setSelectedState: function() {
                    this._root.attr({"class": CLASS_SELECTED}).toForeground();
                    this._applySelected()
                },
                _createLabelRoot: function() {
                    return this._root
                },
                _adjustLabel: function() {
                    var bbox = this._label.text.getBBox(),
                        x = _round(-bbox.x + this._size / 2) + 2,
                        y = _round(-bbox.y - bbox.height / 2) - 1;
                    this._label.text.attr({
                        x: x,
                        y: y
                    });
                    this._label.tracker.attr({
                        x: x + bbox.x - 1,
                        y: y + bbox.y - 1,
                        width: bbox.width + 2,
                        height: bbox.height + 2
                    })
                },
                _locateLabel: $.noop
            });
        function DotMarker(){}
        _extend(DotMarker.prototype, baseMarkerBehavior, {
            type: DOT,
            _create: function(style, renderer, root) {
                var that = this,
                    size = that._size = style.size > 0 ? _Number(style.size) : 0,
                    hoveredSize = size,
                    selectedSize = size + (style.selectedStep > 0 ? _Number(style.selectedStep) : 0),
                    hoveredBackSize = hoveredSize + (style.backStep > 0 ? _Number(style.backStep) : 0),
                    selectedBackSize = selectedSize + (style.backStep > 0 ? _Number(style.backStep) : 0),
                    r = size / 2;
                that._dotDefault = {
                    cx: 0,
                    cy: 0,
                    r: r,
                    stroke: style.borderColor,
                    "stroke-width": style.borderWidth,
                    fill: style.color,
                    filter: style.shadow ? style._filter : null
                };
                that._dotHovered = {
                    cx: 0,
                    cy: 0,
                    r: hoveredSize / 2,
                    stroke: style.hoveredBorderColor,
                    "stroke-width": style.hoveredBorderWidth,
                    fill: style.hoveredColor
                };
                that._dotSelected = {
                    cx: 0,
                    cy: 0,
                    r: selectedSize / 2,
                    stroke: style.selectedBorderColor,
                    "stroke-width": style.selectedBorderWidth,
                    fill: style.selectedColor
                };
                that._backDefault = {
                    cx: 0,
                    cy: 0,
                    r: r,
                    stroke: "none",
                    "stroke-width": 0,
                    fill: style.backColor,
                    opacity: style.backOpacity
                };
                that._backHovered = {
                    cx: 0,
                    cy: 0,
                    r: hoveredBackSize / 2,
                    stroke: "none",
                    "stroke-width": 0,
                    fill: style.backColor,
                    opacity: style.backOpacity
                };
                that._backSelected = {
                    cx: 0,
                    cy: 0,
                    r: selectedBackSize / 2,
                    stroke: "none",
                    "stroke-width": 0,
                    fill: style.backColor,
                    opacity: style.backOpacity
                };
                that._back = renderer.circle().sharp().attr(that._backDefault).data(that._ctx.dataKey, that._data).append(root);
                that._dot = renderer.circle().sharp().attr(that._dotDefault).data(that._ctx.dataKey, that._data).append(root)
            },
            _destroy: function() {
                this._back = this._dot = null
            },
            _applyDefault: function() {
                this._back.attr(this._backDefault);
                this._dot.attr(this._dotDefault)
            },
            _applyHovered: function() {
                this._back.attr(this._backHovered);
                this._dot.attr(this._dotHovered)
            },
            _applySelected: function() {
                this._back.attr(this._backSelected);
                this._dot.attr(this._dotSelected)
            }
        });
        function BubbleMarker(){}
        _extend(BubbleMarker.prototype, baseMarkerBehavior, {
            type: BUBBLE,
            _create: function(style, renderer, root) {
                var that = this;
                that._minSize = style.minSize > 0 ? _Number(style.minSize) : 0;
                that._maxSize = style.maxSize > that._minSize ? _Number(style.maxSize) : that._minSize;
                that.value = _isFinite(that._proxy.value) ? _Number(that._proxy.value) : null;
                that._default = {
                    stroke: style.borderColor,
                    "stroke-width": style.borderWidth,
                    fill: style.color,
                    opacity: style.opacity
                };
                that._hovered = {
                    stroke: style.hoveredBorderColor,
                    "stroke-width": style.hoveredBorderWidth,
                    fill: style.hoveredColor,
                    opacity: style.hoveredOpacity
                };
                that._selected = {
                    stroke: style.selectedBorderColor,
                    "stroke-width": style.selectedBorderWidth,
                    fill: style.selectedColor,
                    opacity: style.selectedOpacity
                };
                that._bubble = renderer.circle(0, 0, 0).sharp().attr(that._default).data(that._ctx.dataKey, that._data).append(root);
                that.setSize(style.size / that._maxSize || 1)
            },
            _applyDefault: function() {
                this._bubble.attr(this._default)
            },
            _applyHovered: function() {
                this._bubble.attr(this._hovered)
            },
            _applySelected: function() {
                this._bubble.attr(this._selected)
            },
            setSize: function(ratio) {
                var that = this,
                    r = (that._minSize + ratio * (that._maxSize - that._minSize)) / 2;
                that._default.r = that._hovered.r = that._selected.r = r;
                that._size = 2 * r;
                that._bubble.attr({r: r});
                return that
            }
        });
        function PieMarker(){}
        _extend(PieMarker.prototype, baseMarkerBehavior, {
            type: PIE,
            _create: function(style, renderer, root) {
                var that = this,
                    r = (style.size > 0 ? _Number(style.size) : 0) / 2,
                    srcValues,
                    i = 0,
                    ii,
                    values,
                    value,
                    sum = 0,
                    translator,
                    startAngle,
                    endAngle,
                    colors;
                that._size = 2 * r;
                that._pieDefault = {opacity: style.opacity};
                that._pieHovered = {opacity: style.hoveredOpacity};
                that._pieSelected = {opacity: style.selectedOpacity};
                that._borderDefault = {
                    stroke: style.borderColor,
                    "stroke-width": style.borderWidth
                };
                that._borderHovered = {
                    stroke: style.hoveredBorderColor,
                    "stroke-width": style.hoveredBorderWidth
                };
                that._borderSelected = {
                    stroke: style.selectedBorderColor,
                    "stroke-width": style.selectedBorderWidth
                };
                srcValues = that._proxy.values;
                ii = _isArray(srcValues) ? srcValues.length : 0;
                values = [];
                for (; i < ii; ++i) {
                    value = _Number(srcValues[i]);
                    if (_isFinite(value)) {
                        values.push(value);
                        sum += value
                    }
                }
                that._pie = renderer.g().attr(that._pieDefault);
                translator = new DX.viz.core.Translator1D(0, sum, 90, 450);
                startAngle = translator.translate(0);
                colors = that._ctx.getPieColors(values.length);
                for (value = 0, i = 0, ii = values.length; i < ii; ++i) {
                    value += values[i];
                    endAngle = translator.translate(value);
                    renderer.arc(0, 0, 0, r, startAngle, endAngle).attr({
                        "stroke-linejoin": "round",
                        fill: colors[i]
                    }).data(that._ctx.dataKey, that._data).append(that._pie);
                    startAngle = endAngle
                }
                that._pie.append(root);
                that._border = renderer.circle(0, 0, r).sharp().attr(that._borderDefault).data(that._ctx.dataKey, that._data).append(root)
            },
            _applyDefault: function() {
                this._pie.attr(this._pieDefault);
                this._border.attr(this._borderDefault)
            },
            _applyHovered: function() {
                this._pie.attr(this._pieHovered);
                this._border.attr(this._borderHovered)
            },
            _applySelected: function() {
                this._pie.attr(this._pieSelected);
                this._border.attr(this._borderSelected)
            }
        });
        function ImageMarker(){}
        _extend(ImageMarker.prototype, baseMarkerBehavior, {
            type: IMAGE,
            _create: function(style, renderer, root) {
                var that = this,
                    size = that._size = style.size > 0 ? _Number(style.size) : 0,
                    hoveredSize = size + (style.hoveredStep > 0 ? _Number(style.hoveredStep) : 0),
                    selectedSize = size + (style.selectedStep > 0 ? _Number(style.selectedStep) : 0);
                that._default = {
                    x: -size / 2,
                    y: -size / 2,
                    width: size,
                    height: size
                };
                that._hovered = {
                    x: -hoveredSize / 2,
                    y: -hoveredSize / 2,
                    width: hoveredSize,
                    height: hoveredSize
                };
                that._selected = {
                    x: -selectedSize / 2,
                    y: -selectedSize / 2,
                    width: selectedSize,
                    height: selectedSize
                };
                that._image = renderer.image().attr(that._default).attr({
                    href: that._proxy.url,
                    location: "center"
                }).append(root);
                that._tracker = renderer.rect().attr(that._default).attr({
                    stroke: "none",
                    "stroke-width": 0,
                    fill: "#000000",
                    opacity: 0.0001
                }).data(that._ctx.dataKey, that._data).append(root)
            },
            _applyDefault: function() {
                this._image.attr(this._default);
                this._tracker.attr(this._default)
            },
            _applyHovered: function() {
                this._image.attr(this._hovered);
                this._tracker.attr(this._hovered)
            },
            _applySelected: function() {
                this._image.attr(this._selected);
                this._tracker.attr(this._selected)
            }
        });
        _each([DotMarker, BubbleMarker, PieMarker, ImageMarker], function(_, markerType) {
            DEFAULT_MARKER_TYPE = DEFAULT_MARKER_TYPE || markerType.prototype.type;
            MARKER_TYPES[markerType.prototype.type] = markerType
        });
        function parseMarkerType(type, defaultType) {
            var _type = _String(type).toLowerCase();
            return MARKER_TYPES[_type] ? _type : defaultType
        }
        var __originalDefaultMarkerType = DEFAULT_MARKER_TYPE,
            __originalMarkerTypes = _extend({}, MARKER_TYPES);
        DX.viz.map._tests.stubMarkerTypes = function(markerTypes, defaultMarkerType) {
            DEFAULT_MARKER_TYPE = defaultMarkerType;
            MARKER_TYPES = markerTypes
        };
        DX.viz.map._tests.restoreMarkerTypes = function() {
            DEFAULT_MARKER_TYPE = __originalDefaultMarkerType;
            MARKER_TYPES = __originalMarkerTypes
        };
        DX.viz.map._tests.baseMarkerBehavior = baseMarkerBehavior;
        DX.viz.map._tests.MarkersManager = MarkersManager;
        DX.viz.map._tests.DotMarker = DotMarker;
        DX.viz.map._tests.BubbleMarker = BubbleMarker;
        DX.viz.map._tests.PieMarker = PieMarker;
        DX.viz.map._tests.ImageMarker = ImageMarker;
        DX.viz.map.dxVectorMap.prototype._factory.createMarkersManager = function(parameters) {
            return new MarkersManager(parameters)
        }
    })(DevExpress, jQuery);
    DevExpress.MOD_VIZ_VECTORMAP = true
}