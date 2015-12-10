/*! 
* DevExtreme (Vector Map)
* Version: 15.2.4
* Build date: Dec 8, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!window.DevExpress || !DevExpress.MOD_VIZ_VECTORMAP) {
    if (!window.DevExpress || !DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-vectormap, file map.js */
    (function(DX, $, undefined) {
        var map = DX.viz.map = {},
            _parseScalar = DX.viz.utils.parseScalar,
            registerComponent = DX.require("/componentRegistrator"),
            _noop = $.noop,
            _extend = $.extend,
            DEFAULT_WIDTH = 800,
            DEFAULT_HEIGHT = 400,
            TOOLTIP_OFFSET = 12,
            nextDataKey = 1,
            RE_LAYERS = /^layers/,
            RE_LAYERS_I = /^layers\[\d+\]$/,
            RE_LAYERS_I_DATA = /^layers\[\d+\].data$/,
            RE_LAYERS_DATA = /^layers.data$/;
        function generateDataKey() {
            return "vectormap-data-" + nextDataKey++
        }
        var Map = DX.viz.BaseWidget.inherit({
                _eventsMap: _extend({}, DX.viz.BaseWidget.prototype._eventsMap, {
                    onClick: {name: "click"},
                    onCenterChanged: {name: "centerChanged"},
                    onZoomFactorChanged: {name: "zoomFactorChanged"},
                    onAreaClick: {name: "areaClick"},
                    onAreaHoverChanged: {name: "areaHoverChanged"},
                    onAreaSelectionChanged: {name: "areaSelectionChanged"},
                    onMarkerClick: {name: "markerClick"},
                    onMarkerHoverChanged: {name: "markerHoverChanged"},
                    onMarkerSelectionChanged: {name: "markerSelectionChanged"},
                    onHoverChanged: {name: "hoverChanged"},
                    onSelectionChanged: {name: "selectionChanged"}
                }),
                _setDeprecatedOptions: function() {
                    this.callBase.apply(this, arguments);
                    _extend(this._deprecatedOptions, {
                        areaSettings: {
                            since: "15.2",
                            message: "Use the 'layers' option instead"
                        },
                        markerSettings: {
                            since: "15.2",
                            message: "Use the 'layers' option instead"
                        },
                        mapData: {
                            since: "15.2",
                            message: "Use the 'layers' option instead"
                        },
                        markers: {
                            since: "15.2",
                            message: "Use the 'layers' option instead"
                        },
                        onAreaClick: {
                            since: "15.2",
                            message: "Use the 'onClick' option instead"
                        },
                        onMarkerClick: {
                            since: "15.2",
                            message: "Use the 'onClick' option instead"
                        },
                        onAreaHoverChanged: {
                            since: "15.2",
                            message: "Use the 'onHoverChanged' option instead"
                        },
                        onMarkerHoverChanged: {
                            since: "15.2",
                            message: "Use the 'onHoverChanged' option instead"
                        },
                        onAreaSelectionChanged: {
                            since: "15.2",
                            message: "Use the 'onSelectionChanged' option instead"
                        },
                        onMarkerSelectionChanged: {
                            since: "15.2",
                            message: "Use the 'onSelectionChanged' option instead"
                        }
                    })
                },
                _setOptionsByReference: function() {
                    this.callBase.apply(this, arguments);
                    _extend(this._optionsByReference, {
                        layers: true,
                        mapData: true,
                        markers: true
                    })
                },
                _rootClassPrefix: "dxm",
                _rootClass: "dxm-vector-map",
                _createThemeManager: function() {
                    return new map.ThemeManager
                },
                _initBackground: function(dataKey) {
                    this._background = this._renderer.rect(0, 0, 0, 0).attr({"class": "dxm-background"}).data(dataKey, {name: "background"}).append(this._root)
                },
                _initLayerCollection: function(dataKey, notifyDirty, notifyReady) {
                    var that = this;
                    that._layerCollection = new map.MapLayerCollection({
                        renderer: that._renderer,
                        projection: that._projection,
                        themeManager: that._themeManager,
                        tracker: that._tracker,
                        dataKey: dataKey,
                        eventTrigger: that._eventTrigger,
                        dataExchanger: that._dataExchanger,
                        notifyDirty: notifyDirty,
                        notifyReady: notifyReady
                    });
                    if (that._options.layers === undefined && (that._options.mapData || that._options.markers))
                        applyDeprecatedMode(that);
                    else
                        suspendLayersData(that._layerCollection, that._options.layers)
                },
                _initLegendsControl: function(notifyDirty, notifyReady) {
                    var that = this;
                    that._legendsControl = new map.LegendsControl({
                        renderer: that._renderer,
                        container: that._root,
                        layoutControl: that._layoutControl,
                        themeManager: that._themeManager,
                        dataExchanger: that._dataExchanger,
                        notifyDirty: notifyDirty,
                        notifyReady: notifyReady
                    })
                },
                _initControlBar: function(dataKey) {
                    var that = this;
                    that._controlBar = new map.ControlBar({
                        renderer: that._renderer,
                        container: that._root,
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
                    that._projection = new map.Projection;
                    that._tracker = new map.Tracker({
                        root: that._root,
                        projection: that._projection,
                        dataKey: dataKey
                    });
                    that._layoutControl = new map.LayoutControl;
                    that._layoutControl.suspend();
                    that._initBackground(dataKey);
                    that._initLayerCollection(dataKey, notifyDirty, notifyReady);
                    that._initControlBar(dataKey);
                    that._initLegendsControl(notifyDirty, notifyReady);
                    function notifyDirty() {
                        that._resetIsReady();
                        ++notifyCounter
                    }
                    function notifyReady() {
                        if (--notifyCounter === 0) {
                            that._drawn();
                            that._fulfillLoadingIndicatorHiding()
                        }
                    }
                },
                _init: function() {
                    this.callBase.apply(this, arguments);
                    this._afterInit();
                    this._layoutControl.resume()
                },
                _afterInit: function() {
                    resumeLayersData(this._layerCollection, this._options.layers, this._renderer)
                },
                _initCore: function() {
                    var that = this;
                    that._root = that._renderer.root.attr({
                        align: "center",
                        cursor: "default"
                    });
                    that._initElements();
                    that._projection.setEngine(that.option("projection")).setBounds(that.option("bounds")).setMaxZoom(that.option("maxZoomFactor")).setZoom(that.option("zoomFactor"), true).setCenter(that.option("center"), true);
                    that._setTrackerCallbacks();
                    that._setControlBarCallbacks();
                    that._setProjectionCallbacks()
                },
                _disposeCore: function() {
                    var that = this;
                    that._resetProjectionCallbacks();
                    that._resetTrackerCallbacks();
                    that._resetControlBarCallbacks();
                    that._tracker.dispose();
                    that._legendsControl.dispose();
                    that._layerCollection.dispose();
                    that._controlBar.dispose();
                    that._layoutControl.dispose();
                    that._disposeCenterHandler();
                    that._dataExchanger.dispose();
                    that._projection.dispose();
                    that._dataExchanger = that._projection = that._tracker = that._layoutControl = that._root = that._background = that._layerCollection = that._controlBar = that._legendsControl = null
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
                        layerCollection = that._layerCollection,
                        controlBar = that._controlBar,
                        tooltip = that._tooltip,
                        isControlDrag = false;
                    that._tracker.setCallbacks({
                        click: function(arg) {
                            var offset = renderer.getRootOffset(),
                                layer = layerCollection.byName(arg.data.name);
                            arg.$event.x = arg.x - offset.left;
                            arg.$event.y = arg.y - offset.top;
                            if (layer)
                                layer.raiseClick(arg.data.index, arg.$event);
                            else if (arg.data.name === "background")
                                that._eventTrigger("click", {jQueryEvent: arg.$event})
                        },
                        start: function(arg) {
                            isControlDrag = arg.data.name === "control-bar";
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
                            var layer = layerCollection.byName(arg.data.name);
                            if (layer)
                                layer.hoverItem(arg.data.index, true)
                        },
                        "hover-off": function(arg) {
                            var layer = layerCollection.byName(arg.data.name);
                            if (layer)
                                layer.hoverItem(arg.data.index, false)
                        },
                        "focus-on": function(arg, done) {
                            var result = false,
                                layer,
                                proxy;
                            if (tooltip.isEnabled()) {
                                layer = layerCollection.byName(arg.data.name);
                                proxy = layer && layer.getProxy(arg.data.index);
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
                        that._resetTrackerCallbacks = that = centerHandler = renderer = layerCollection = controlBar = tooltip = null
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
                _getTitleLayoutSize: function() {
                    var canvas = this._canvas,
                        title = this._title,
                        layout = title.getVerticalCuttedSize(canvas),
                        layoutOptions = title.getLayoutOptions();
                    layoutOptions && title.position({
                        at: layoutOptions.position,
                        my: layoutOptions.position,
                        of: {getLayoutOptions: function() {
                                return {
                                        width: canvas.width,
                                        height: canvas.height,
                                        x: 0,
                                        y: 0
                                    }
                            }}
                    });
                    return layout
                },
                _applySize: function() {
                    var that = this,
                        layout;
                    that._renderer.lock();
                    layout = that._getTitleLayoutSize();
                    that._projection.setSize(layout);
                    that._layoutControl.setSize(layout);
                    that._renderer.unlock();
                    that._background.attr({
                        x: layout.left,
                        y: layout.top,
                        height: layout.height,
                        width: layout.width
                    });
                    that._layerCollection.setRect([layout.left, layout.top, layout.width, layout.height])
                },
                _resize: _noop,
                _initDataSource: _noop,
                _disposeDataSource: _noop,
                _optionValuesEqual: function(name, oldValue, newValue) {
                    if (RE_LAYERS.test(name) && newValue && oldValue)
                        if (RE_LAYERS_I.test(name)) {
                            if (newValue.data && oldValue.data)
                                oldValue.data = undefined
                        }
                        else if (RE_LAYERS_I_DATA.test(name))
                            this.option(name.substr(0, 9)).data = undefined;
                        else if (RE_LAYERS_DATA.test(name))
                            this.option("layers").data = undefined;
                    return this.callBase.apply(this, arguments)
                },
                _handleChangedOptions: function(options) {
                    var that = this;
                    that.callBase.apply(that, arguments);
                    if ("background" in options)
                        that._setBackgroundOptions();
                    if ("layers" in options || "areaSettings" in options || "markerSettings" in options || "mapData" in options || "markers" in options)
                        that._setLayerCollectionOptions();
                    if ("controlBar" in options)
                        that._setControlBarOptions();
                    if ("legends" in options)
                        that._setLegendsOptions();
                    if ("touchEnabled" in options || "wheelEnabled" in options)
                        that._setTrackerOptions();
                    if ("panningEnabled" in options || "zoomingEnabled" in options)
                        that._setupInteraction();
                    if ("projection" in options)
                        that._projection.setEngine(options.projection);
                    if ("bounds" in options)
                        that._projection.setBounds(options.bounds);
                    if ("maxZoomFactor" in options)
                        that._projection.setMaxZoom(options.maxZoomFactor);
                    if ("zoomFactor" in options)
                        that._projection.setZoom(options.zoomFactor);
                    if ("center" in options)
                        that._projection.setCenter(options.center)
                },
                _handleThemeOptionsCore: function() {
                    var that = this;
                    that._scheduleLoadingIndicatorHiding();
                    that._setBackgroundOptions();
                    that._setLayerCollectionOptions();
                    that._layoutControl.suspend();
                    that._setControlBarOptions();
                    that._setLegendsOptions();
                    that._setTrackerOptions();
                    that._setupInteraction();
                    that._layoutControl.resume()
                },
                _setBackgroundOptions: function() {
                    var settings = this._getOption("background");
                    this._background.attr({
                        "stroke-width": settings.borderWidth,
                        stroke: settings.borderColor,
                        fill: settings.color
                    });
                    this._layerCollection.setBorderWidth(settings.borderWidth)
                },
                _setLayerCollectionOptions: function() {
                    this._layerCollection.setOptions(this.option("layers"))
                },
                _setControlBarOptions: function() {
                    this._controlBar.setOptions(this._getOption("controlBar"))
                },
                _setLegendsOptions: function() {
                    this._legendsControl.setOptions(this.option("legends"))
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
                getLayers: function() {
                    var layers = this._layerCollection.items(),
                        list = [],
                        i,
                        ii = list.length = layers.length;
                    for (i = 0; i < ii; ++i)
                        list[i] = layers[i].proxy;
                    return list
                },
                getLayerByIndex: function(index) {
                    var layer = this._layerCollection.byIndex(index);
                    return layer ? layer.proxy : null
                },
                getLayerByName: function(name) {
                    var layer = this._layerCollection.byName(name);
                    return layer ? layer.proxy : null
                },
                clearSelection: function(_noEvent) {
                    var layers = this._layerCollection.items(),
                        i,
                        ii = layers.length;
                    for (i = 0; i < ii; ++i)
                        layers[i].clearSelection(_noEvent);
                    return this
                },
                getAreas: _noop,
                getMarkers: _noop,
                clearAreaSelection: _noop,
                clearMarkerSelection: _noop,
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
                }
            });
        function suspendLayersData(layerCollection, options) {
            if (options)
                layerCollection.__data = options.length ? $.map(options, patch) : patch(options);
            function patch(ops) {
                ops = ops || {};
                var data = ops.data;
                ops.data = undefined;
                return {data: data}
            }
        }
        function resumeLayersData(layerCollection, options, renderer) {
            var data = layerCollection.__data;
            if (data) {
                layerCollection.__data = undefined;
                if (data.length)
                    $.each(data, function(i, item) {
                        options[i].data = item.data
                    });
                else
                    options.data = data.data;
                renderer.lock();
                layerCollection.setOptions(options);
                renderer.unlock()
            }
        }
        function applyDeprecatedMode(map) {
            var log = DX.require("/errors").log;
            var mapData = map._options.mapData,
                markers = map._options.markers;
            map._options.mapData = map._options.markers = undefined;
            map._afterInit = function() {
                this._options.mapData = mapData;
                this._options.markers = markers;
                this._renderer.lock();
                this._setLayerCollectionOptions();
                this._renderer.unlock();
                mapData = markers = undefined
            };
            map._setLayerCollectionOptions = function() {
                var options = this._options,
                    mapData = options.mapData,
                    markers = options.markers;
                mapData = mapData && mapData.features ? _extend({}, mapData) : mapData;
                markers = markers && markers.features ? _extend({}, markers) : markers;
                this._layerCollection.setOptions([_extend({}, options.areaSettings, {
                        name: "areas",
                        _deprecated: true,
                        data: mapData,
                        type: "area"
                    }), _extend({}, options.markerSettings, {
                        name: "markers",
                        _deprecated: true,
                        data: markers,
                        type: "marker",
                        elementType: options.markerSettings && options.markerSettings.type
                    })])
            };
            map.getAreas = function() {
                log("W0002", this.NAME, "getAreas", "15.2", "Use the 'getLayerByName('areas').getElements()' instead");
                return this.getLayerByName("areas").getElements()
            };
            map.getMarkers = function() {
                log("W0002", this.NAME, "getMarkers", "15.2", "Use the 'getLayerByName('markers').getElements()' instead");
                return this.getLayerByName("markers").getElements()
            };
            map.clearAreaSelection = function(_noEvent) {
                log("W0002", this.NAME, "clearAreaSelection", "15.2", "Use the 'getLayerByName('areas').clearSelection()' instead");
                this.getLayerByName("areas").clearSelection(_noEvent);
                return this
            };
            map.clearMarkerSelection = function(_noEvent) {
                log("W0002", this.NAME, "clearMarkerSelection", "15.2", "Use the 'getLayerByName('markers').clearSelection()' instead");
                this.getLayerByName("markers").clearSelection(_noEvent);
                return this
            };
            var clickMap = {
                    areas: "areaClick",
                    markers: "markerClick"
                },
                hoverChangedMap = {
                    areas: "areaHoverChanged",
                    markers: "markerHoverChanged"
                },
                selectionChangedMap = {
                    areas: "areaSelectionChanged",
                    markers: "markerSelectionChanged"
                };
            map.on("click", function(e) {
                if (e.target)
                    this._eventTrigger(clickMap[e.target.layer.name], e)
            });
            map.on("hoverChanged", function(e) {
                if (e.target)
                    this._eventTrigger(hoverChangedMap[e.target.layer.name], e)
            });
            map.on("selectionChanged", function(e) {
                if (e.target)
                    this._eventTrigger(selectionChangedMap[e.target.layer.name], e)
            })
        }
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
        registerComponent("dxVectorMap", DX.viz.map, Map);
        DX.viz.map._internal = {};
        DX.viz.map.sources = {};
        DX.viz.map._tests = {};
        DX.viz.map._tests.resetDataKey = function() {
            nextDataKey = 1
        };
        DX.viz.map._tests.DataExchanger = DataExchanger;
        DX.viz.map._tests.stubDataExchanger = function(stub) {
            DataExchanger = stub
        }
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file projection.js */
    (function(DX, $, undefined) {
        var _Number = Number,
            _min = Math.min,
            _max = Math.max,
            _abs = Math.abs,
            _round = Math.round,
            _ln = Math.log,
            _pow = Math.pow,
            TWO_TO_LN2 = 2 / Math.LN2,
            MIN_BOUNDS_RANGE = 1 / 3600 / 180 / 10,
            DEFAULT_MIN_ZOOM = 1,
            DEFAULT_MAX_ZOOM = 1 << 8,
            DEFAULT_CENTER = [NaN, NaN],
            DEFAULT_ENGINE_NAME = "mercator";
        function floatsEqual(f1, f2) {
            return _abs(f1 - f2) < 1E-8
        }
        function parseAndClamp(value, minValue, maxValue, defaultValue) {
            var val = _Number(value);
            return isFinite(val) ? _min(_max(val, minValue), maxValue) : defaultValue
        }
        function parseAndClampArray(value, minValue, maxValue, defaultValue) {
            return [parseAndClamp(value[0], minValue[0], maxValue[0], defaultValue[0]), parseAndClamp(value[1], minValue[1], maxValue[1], defaultValue[1])]
        }
        function Projection() {
            this._events = {
                project: $.Callbacks(),
                transform: $.Callbacks(),
                center: $.Callbacks(),
                zoom: $.Callbacks(),
                "max-zoom": $.Callbacks()
            }
        }
        Projection.prototype = {
            constructor: Projection,
            _minZoom: DEFAULT_MIN_ZOOM,
            _maxZoom: DEFAULT_MAX_ZOOM,
            _zoom: DEFAULT_MIN_ZOOM,
            _center: DEFAULT_CENTER,
            _canvas: {},
            dispose: function() {
                var name;
                for (name in this._events)
                    this._events[name].empty();
                this._events = null;
                return this
            },
            setEngine: function(engine) {
                var that = this,
                    eng = isEngine(engine) ? engine : projection.get(DEFAULT_ENGINE_NAME);
                if (that._engine !== eng) {
                    that._engine = eng;
                    that._setupScreen();
                    that._events.project.fire();
                    that.setCenter(null);
                    that.setZoom(null)
                }
                return that
            },
            setBounds: function(bounds) {
                return bounds ? this.setEngine(this._engine.original().bounds(bounds)) : this
            },
            _setupScreen: function() {
                var that = this,
                    canvas = that._canvas,
                    width = canvas.width,
                    height = canvas.height,
                    aspectRatio = that._engine.ar();
                that._x0 = canvas.left + width / 2;
                that._y0 = canvas.top + height / 2;
                if (width / height <= aspectRatio) {
                    that._xradius = width / 2;
                    that._yradius = width / 2 / aspectRatio
                }
                else {
                    that._xradius = height / 2 * aspectRatio;
                    that._yradius = height / 2
                }
            },
            setSize: function(canvas) {
                var that = this;
                that._canvas = canvas;
                that._setupScreen();
                that._events.transform.fire(that.getTransform());
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
                    center = that._engine.project(that._center);
                that._dxcenter = -center[0] * that._zoom || 0;
                that._dycenter = -center[1] * that._zoom || 0
            },
            project: function(coordinates) {
                return this._engine.project(coordinates)
            },
            transform: function(coordinates) {
                return this._toScreen(this._toTransformedFast(coordinates))
            },
            isInvertible: function() {
                return this._engine.isinv()
            },
            getSquareSize: function(size) {
                return [size[0] * this._zoom * this._xradius, size[1] * this._zoom * this._yradius]
            },
            getZoom: function() {
                return this._zoom
            },
            setZoom: function(zoom, _forceEvent) {
                var that = this,
                    oldZoom = that._zoom,
                    newZoom;
                that._zoom = that._engine.isinv() ? parseAndClamp(zoom, that._minZoom, that._maxZoom, that._minZoom) : that._minZoom;
                that._adjustCenter();
                newZoom = that.getZoom();
                if (!floatsEqual(oldZoom, newZoom) || _forceEvent)
                    that._events.zoom.fire(newZoom, that.getTransform());
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
                that._maxZoom = parseAndClamp(maxZoom, that._minZoom, _Number.MAX_VALUE, DEFAULT_MAX_ZOOM);
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
                return this._center.slice()
            },
            setCenter: function(center, _forceEvent) {
                var that = this,
                    engine = that._engine,
                    oldCenter = that._center,
                    newCenter;
                that._center = engine.isinv() ? parseAndClampArray(center || [], engine.min(), engine.max(), engine.center()) : DEFAULT_CENTER;
                that._adjustCenter();
                newCenter = that.getCenter();
                if (!floatsEqual(oldCenter[0], newCenter[0]) || !floatsEqual(oldCenter[1], newCenter[1]) || _forceEvent)
                    that._events.center.fire(newCenter, that.getTransform());
                return that
            },
            setCenterByPoint: function(coordinates, screenPosition) {
                var that = this,
                    p = that._engine.project(coordinates),
                    q = that._fromScreen(screenPosition);
                return that.setCenter(that._engine.unproject([-q[0] / that._zoom + p[0], -q[1] / that._zoom + p[1]]))
            },
            moveCenter: function(screenDx, screenDy) {
                var that = this,
                    current = that._toScreen(that._toTransformed(that._engine.project(that._center))),
                    center = that._engine.unproject(that._fromTransformed(that._fromScreen([current[0] + screenDx, current[1] + screenDy])));
                return that.setCenter(center)
            },
            getViewport: function() {
                var that = this,
                    unproject = that._engine.unproject,
                    lt = unproject(that._fromTransformed([-1, -1])),
                    lb = unproject(that._fromTransformed([-1, +1])),
                    rt = unproject(that._fromTransformed([+1, -1])),
                    rb = unproject(that._fromTransformed([+1, +1])),
                    minmax = findMinMax([selectFarthestPoint(lt[0], lb[0], rt[0], rb[0]), selectFarthestPoint(lt[1], rt[1], lb[1], rb[1])], [selectFarthestPoint(rt[0], rb[0], lt[0], lb[0]), selectFarthestPoint(lb[1], rb[1], lt[1], rt[1])]);
                return [].concat(minmax.min, minmax.max)
            },
            setViewport: function(viewport) {
                var engine = this._engine,
                    data = viewport ? getZoomAndCenterFromViewport(engine.project, engine.unproject, viewport) : [this._minZoom, engine.center()];
                return this.setZoom(data[0]).setCenter(data[1])
            },
            getTransform: function() {
                return {
                        translateX: this._dxcenter * this._xradius,
                        translateY: this._dycenter * this._yradius
                    }
            },
            fromScreenPoint: function(x, y) {
                return this._engine.unproject(this._fromTransformed(this._fromScreen([x, y])))
            },
            on: function(handlers) {
                var events = this._events,
                    name;
                for (name in handlers)
                    events[name].add(handlers[name]);
                return dispose;
                function dispose() {
                    for (name in handlers)
                        events[name].remove(handlers[name])
                }
            }
        };
        function selectFarthestPoint(point1, point2, basePoint1, basePoint2) {
            var basePoint = (basePoint1 + basePoint2) / 2;
            return _abs(point1 - basePoint) > _abs(point2 - basePoint) ? point1 : point2
        }
        function selectClosestPoint(point1, point2, basePoint1, basePoint2) {
            var basePoint = (basePoint1 + basePoint2) / 2;
            return _abs(point1 - basePoint) < _abs(point2 - basePoint) ? point1 : point2
        }
        function getZoomAndCenterFromViewport(project, unproject, viewport) {
            var lt = project([viewport[0], viewport[3]]),
                lb = project([viewport[0], viewport[1]]),
                rt = project([viewport[2], viewport[3]]),
                rb = project([viewport[2], viewport[1]]),
                l = selectClosestPoint(lt[0], lb[0], rt[0], rb[0]),
                r = selectClosestPoint(rt[0], rb[0], lt[0], lb[0]),
                t = selectClosestPoint(lt[1], rt[1], lb[1], rb[1]),
                b = selectClosestPoint(lb[1], rb[1], lt[1], rt[1]);
            return [2 / _max(_abs(l - r), _abs(t - b)), unproject([(l + r) / 2, (t + b) / 2])]
        }
        function Engine(parameters, _original) {
            var that = this,
                aspectRatio = parameters.aspectRatio > 0 ? _Number(parameters.aspectRatio) : 1,
                project = createProjectMethod(parameters.to),
                unproject = parameters.from ? createUnprojectMethod(parameters.from) : returnValue(DEFAULT_CENTER),
                center = unproject([0, 0]),
                minmax = findMinMax([unproject([-1, 0])[0], unproject([0, +1])[1]], [unproject([+1, 0])[0], unproject([0, -1])[1]]);
            that.project = project;
            that.unproject = unproject;
            that.original = returnValue(_original || that);
            that.source = function() {
                return $.extend({}, parameters)
            };
            that.isinv = returnValue(!!parameters.from);
            that.ar = returnValue(aspectRatio);
            that.center = returnArray(center);
            that.min = returnArray(minmax.min);
            that.max = returnArray(minmax.max)
        }
        Engine.prototype.aspectRatio = function(aspectRatio) {
            var parameters = this.source();
            parameters.aspectRatio = aspectRatio;
            return new Engine(parameters, this)
        };
        Engine.prototype.bounds = function(bounds) {
            bounds = bounds || [];
            var parameters = this.source(),
                min = this.min(),
                max = this.max(),
                p1 = parameters.to(parseAndClampArray([bounds[0], bounds[1]], min, max, min)),
                p2 = parameters.to(parseAndClampArray([bounds[2], bounds[3]], min, max, max)),
                delta = _min(_abs(p2[0] - p1[0]) > MIN_BOUNDS_RANGE ? _abs(p2[0] - p1[0]) : 2, _abs(p2[1] - p1[1]) > MIN_BOUNDS_RANGE ? _abs(p2[1] - p1[1]) : 2);
            if (delta < 2)
                $.extend(parameters, createProjectUnprojectMethods(parameters.to, parameters.from, p1, p2, delta));
            return new Engine(parameters, this)
        };
        function isEngine(engine) {
            return engine instanceof Engine
        }
        function invertVerticalAxis(pair) {
            return [pair[0], -pair[1]]
        }
        function createProjectMethod(method) {
            return function(arg) {
                    return invertVerticalAxis(method(arg))
                }
        }
        function createUnprojectMethod(method) {
            return function(arg) {
                    return method(invertVerticalAxis(arg))
                }
        }
        function returnValue(value) {
            return function() {
                    return value
                }
        }
        function returnArray(value) {
            return function() {
                    return value.slice()
                }
        }
        function projection(parameters) {
            return parameters && parameters.to ? new Engine(parameters) : null
        }
        function findMinMax(p1, p2) {
            return {
                    min: [_min(p1[0], p2[0]), _min(p1[1], p2[1])],
                    max: [_max(p1[0], p2[0]), _max(p1[1], p2[1])]
                }
        }
        var projectionsCache = {};
        projection.get = function(name) {
            return projectionsCache[name] || null
        };
        projection.add = function(name, engine) {
            if (!projectionsCache[name] && isEngine(engine))
                projectionsCache[name] = engine;
            return projection
        };
        function createProjectUnprojectMethods(project, unproject, p1, p2, delta) {
            var x0 = (p1[0] + p2[0]) / 2 - delta / 2,
                y0 = (p1[1] + p2[1]) / 2 - delta / 2,
                k = 2 / delta;
            return {
                    to: function(coordinates) {
                        var p = project(coordinates);
                        return [-1 + (p[0] - x0) * k, -1 + (p[1] - y0) * k]
                    },
                    from: function(coordinates) {
                        var p = [x0 + (coordinates[0] + 1) / k, y0 + (coordinates[1] + 1) / k];
                        return unproject(p)
                    }
                }
        }
        DX.viz.map._tests.Engine = Engine;
        DX.viz.map.Projection = Projection;
        DX.viz.map.projection = projection
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file projection.engines.js */
    (function(DX, undefined) {
        var projection = DX.viz.map.projection,
            _min = Math.min,
            _max = Math.max,
            _sin = Math.sin,
            _asin = Math.asin,
            _tan = Math.tan,
            _atan = Math.atan,
            _exp = Math.exp,
            _log = Math.log,
            PI = Math.PI,
            PI_DIV_4 = PI / 4,
            GEO_LON_BOUND = 180,
            GEO_LAT_BOUND = 90,
            RADIANS = PI / 180,
            MERCATOR_LAT_BOUND = (2 * _atan(_exp(PI)) - PI / 2) / RADIANS,
            MILLER_LAT_BOUND = (2.5 * _atan(_exp(0.8 * PI)) - 0.625 * PI) / RADIANS;
        function clamp(value, threshold) {
            return _max(_min(value, +threshold), -threshold)
        }
        projection.add("mercator", projection({
            aspectRatio: 1,
            to: function(coordinates) {
                return [coordinates[0] / GEO_LON_BOUND, _log(_tan(PI_DIV_4 + clamp(coordinates[1], MERCATOR_LAT_BOUND) * RADIANS / 2)) / PI]
            },
            from: function(coordinates) {
                return [coordinates[0] * GEO_LON_BOUND, (2 * _atan(_exp(coordinates[1] * PI)) - PI / 2) / RADIANS]
            }
        }));
        projection.add("equirectangular", projection({
            aspectRatio: 2,
            to: function(coordinates) {
                return [coordinates[0] / GEO_LON_BOUND, coordinates[1] / GEO_LAT_BOUND]
            },
            from: function(coordinates) {
                return [coordinates[0] * GEO_LON_BOUND, coordinates[1] * GEO_LAT_BOUND]
            }
        }));
        projection.add("lambert", projection({
            aspectRatio: 2,
            to: function(coordinates) {
                return [coordinates[0] / GEO_LON_BOUND, _sin(clamp(coordinates[1], GEO_LAT_BOUND) * RADIANS)]
            },
            from: function(coordinates) {
                return [coordinates[0] * GEO_LON_BOUND, _asin(clamp(coordinates[1], 1)) / RADIANS]
            }
        }));
        projection.add("miller", projection({
            aspectRatio: 1,
            to: function(coordinates) {
                return [coordinates[0] / GEO_LON_BOUND, 1.25 * _log(_tan(PI_DIV_4 + clamp(coordinates[1], MILLER_LAT_BOUND) * RADIANS * 0.4)) / PI]
            },
            from: function(coordinates) {
                return [coordinates[0] * GEO_LON_BOUND, (2.5 * _atan(_exp(0.8 * coordinates[1] * PI)) - 0.625 * PI) / RADIANS]
            }
        }))
    })(DevExpress);
    /*! Module viz-vectormap, file controlBar.js */
    (function(DX, undefined) {
        var _math = Math,
            _min = _math.min,
            _max = _math.max,
            _round = _math.round,
            _floor = _math.floor,
            _pow = _math.pow,
            _ln = _math.log,
            _LN2 = _math.LN2,
            utils = DX.viz.utils,
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
        function ControlBar(parameters) {
            var that = this;
            that._params = parameters;
            that._createElements(parameters.renderer, parameters.container, parameters.dataKey);
            parameters.layoutControl.addItem(that);
            that._subscribeToProjection(parameters.projection)
        }
        ControlBar.prototype = {
            constructor: ControlBar,
            _flags: 0,
            setCallbacks: function(callbacks) {
                this._callbacks = callbacks;
                return this
            },
            _createElements: function(renderer, container, dataKey) {
                var that = this,
                    buttonsGroups,
                    trackersGroup;
                that._root = renderer.g().attr({"class": "dxm-control-bar"}).linkOn(container, "control-bar");
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
                    name: EVENT_TARGET_TYPE
                }).append(group);
                renderer.rect(-size, -offset2, size * 2, size2).data(dataKey, {
                    index: COMMAND_MOVE_UP,
                    name: EVENT_TARGET_TYPE
                }).append(group);
                renderer.rect(offset1, -size, size2, size * 2).data(dataKey, {
                    index: COMMAND_MOVE_RIGHT,
                    name: EVENT_TARGET_TYPE
                }).append(group);
                renderer.rect(-size, offset1, size * 2, size2).data(dataKey, {
                    index: COMMAND_MOVE_DOWN,
                    name: EVENT_TARGET_TYPE
                }).append(group);
                renderer.rect(-offset2, -size, size2, size * 2).data(dataKey, {
                    index: COMMAND_MOVE_LEFT,
                    name: EVENT_TARGET_TYPE
                }).append(group);
                renderer.circle(0, options.incButtonOffset, options.smallCircleSize / 2).data(dataKey, {
                    index: COMMAND_ZOOM_IN,
                    name: EVENT_TARGET_TYPE
                }).append(group);
                renderer.circle(0, options.decButtonOffset, options.smallCircleSize / 2).data(dataKey, {
                    index: COMMAND_ZOOM_OUT,
                    name: EVENT_TARGET_TYPE
                }).append(group);
                renderer.rect(-2, options.sliderLineStartOffset - 2, 4, options.sliderLineEndOffset - options.sliderLineStartOffset + 4).css({cursor: "default"}).data(dataKey, {
                    index: COMMAND_ZOOM_DRAG_LINE,
                    name: EVENT_TARGET_TYPE
                }).append(group);
                this._zoomDragCover = renderer.rect(-options.sliderLength / 2, options.sliderLineEndOffset - options.sliderWidth / 2, options.sliderLength, options.sliderWidth).data(dataKey, {
                    index: COMMAND_ZOOM_DRAG,
                    name: EVENT_TARGET_TYPE
                }).append(group)
            },
            _subscribeToProjection: function(projection) {
                var that = this;
                projection.on({
                    project: function() {
                        that._update()
                    },
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
                that._root.linkRemove().linkOff();
                that._params = that._root = that._callbacks = that._buttonsGroup = that._zoomDrag = that._zoomDragCover = that._progressBar = null;
                return that
            },
            resize: function(size) {
                if (this._isActive)
                    this._root.attr({visibility: size !== null ? null : "hidden"})
            },
            getLayoutOptions: function() {
                return this._isActive ? this._layoutOptions : null
            },
            locate: function(x, y) {
                this._root.attr({
                    translateX: x + this._margin + OFFSET_X,
                    translateY: y + this._margin + OFFSET_Y
                })
            },
            _update: function() {
                var that = this;
                that._isActive = that._isEnabled && that._flags && that._params.projection.isInvertible();
                if (that._isActive)
                    that._root.linkAppend();
                else
                    that._root.linkRemove();
                that.processEnd();
                that.updateLayout()
            },
            setInteraction: function(interaction) {
                var that = this;
                if (_parseScalar(interaction.centeringEnabled, true))
                    that._flags |= FLAG_CENTERING;
                else
                    that._flags &= ~FLAG_CENTERING;
                if (_parseScalar(interaction.zoomingEnabled, true))
                    that._flags |= FLAG_ZOOMING;
                else
                    that._flags &= ~FLAG_ZOOMING;
                that._update()
            },
            setOptions: function(options) {
                var that = this;
                that._isEnabled = !!_parseScalar(options.enabled, true);
                that._margin = options.margin || 0;
                that._layoutOptions = {
                    width: 2 * that._margin + TOTAL_WIDTH,
                    height: 2 * that._margin + TOTAL_HEIGHT,
                    horizontalAlignment: parseHorizontalAlignment(options.horizontalAlignment, "left"),
                    verticalAlignment: parseVerticalAlignment(options.verticalAlignment, "top")
                };
                that._buttonsGroup.attr({
                    "stroke-width": options.borderWidth,
                    stroke: options.borderColor,
                    fill: options.color,
                    "fill-opacity": options.opacity
                });
                that._update()
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
                that._progressBar.attr({points: [[0, start, 0, _max(start, y)], [0, _min(end, y + h), 0, end]]});
                that._zoomDrag.attr(transform);
                that._zoomDragCover.attr(transform)
            },
            _applyZoom: function(center) {
                this._callbacks.zoom(this._zoomFactor, this._flags & FLAG_CENTERING ? center : undefined)
            },
            processStart: function(arg) {
                var commandType;
                if (this._isActive) {
                    commandType = COMMAND_TO_TYPE_MAP[arg.data];
                    this._command = commandType && commandType.flags & this._flags ? new commandType(this, arg) : null
                }
            },
            processMove: function(arg) {
                this._command && this._command.update(arg)
            },
            processEnd: function() {
                this._command && this._command.finish();
                this._command = null
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
            }
        };
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
        DX.viz.map.ControlBar = ControlBar;
        var COMMAND_TO_TYPE_MAP__ORIGINAL = COMMAND_TO_TYPE_MAP;
        DX.viz.map._tests.stubCommandToTypeMap = function(map) {
            COMMAND_TO_TYPE_MAP = map
        };
        DX.viz.map._tests.restoreCommandToTypeMap = function() {
            COMMAND_TO_TYPE_MAP = COMMAND_TO_TYPE_MAP__ORIGINAL
        }
    })(DevExpress);
    /*! Module viz-vectormap, file tracker.js */
    (function(DX, $, undefined) {
        var _math = Math,
            _abs = _math.abs,
            _sqrt = _math.sqrt,
            _round = _math.round,
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            _addNamespace = eventUtils.addNamespace,
            _parseScalar = DX.viz.utils.parseScalar,
            _now = $.now,
            _NAME = DX.viz.map.dxVectorMap.publicName(),
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
                        data = getData(event);
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
                        data = getData(event);
                    if (isTouch && !that._isTouchEnabled)
                        return;
                    that._moveDrag(event, data);
                    that._moveZoom(event, data);
                    that._moveHover(event, data);
                    that._moveFocus(event, data)
                };
                that._docHandlers[EVENTS.end] = function(event) {
                    var isTouch = isTouchEvent(event),
                        data = getData(event);
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
                    var data = getData(event);
                    if (data) {
                        event.preventDefault();
                        event.stopPropagation();
                        that._wheelZoom(event, data)
                    }
                };
                that._wheelLock = {dir: 0};
                function getData(event) {
                    var target = event.target;
                    return (target.tagName === "tspan" ? target.parentNode : target)[DATA_KEY]
                }
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
        DX.viz.map.Tracker = Tracker;
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
        DX.viz.map.ThemeManager = DX.viz.BaseThemeManager.inherit({
            _themeSection: "map",
            _fontFields: ["layer:area.label.font", "layer:marker:dot.label.font", "layer:marker:bubble.label.font", "layer:marker:pie.label.font", "layer:marker:image.label.font", "tooltip.font", "legend.font", "title.font", "title.subtitle.font", "loadingIndicator.font"]
        })
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file legend.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            _extend = $.extend,
            _each = $.each,
            _BaseLegend = viz.Legend;
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
        function parseSource(source) {
            var ret;
            if (typeof source === "string")
                ret = sourceMap[source.toLowerCase()] || unknownSource;
            else
                ret = {
                    category: source.layer,
                    name: source.grouping
                };
            return ret
        }
        function Legend(parameters) {
            var that = this;
            that._params = parameters;
            that._root = parameters.renderer.g().attr({"class": "dxm-legend"}).linkOn(parameters.container, {
                name: "legend",
                after: "legend-base"
            }).linkAppend();
            parameters.layoutControl.addItem(that);
            _BaseLegend.call(that, {
                renderer: parameters.renderer,
                group: that._root,
                backgroundClass: null,
                itemsGroupClass: null,
                textField: "text",
                getFormatObject: function(data) {
                    return data
                }
            });
            that._onDataChanged = function(data) {
                that._updateData(data)
            }
        }
        function buildData(partition, values, field) {
            var i,
                ii = values.length,
                list = [],
                item;
            for (i = 0; i < ii; ++i) {
                list[i] = item = {
                    start: partition[i],
                    end: partition[i + 1],
                    index: i
                };
                item[field] = values[i];
                item.states = {normal: {fill: item.color}}
            }
            return list
        }
        Legend.prototype = _extend(DX.require("/utils/utils.object").clone(_BaseLegend.prototype), {
            constructor: Legend,
            dispose: function() {
                var that = this;
                that._params.layoutControl.removeItem(that);
                that._unbindData();
                that._root.linkRemove().linkOff();
                that._params = that._root = that._onDataChanged = null;
                return _BaseLegend.prototype.dispose.apply(that, arguments)
            },
            resize: function(size) {
                this._params.notifyDirty();
                if (size === null)
                    this.erase();
                else
                    this.draw(size.width, size.height);
                this._params.notifyReady()
            },
            locate: _BaseLegend.prototype.shift,
            _updateData: function(data) {
                this.update(data ? buildData(data.partition, data.values, this._dataName) : [], this._options);
                this.updateLayout()
            },
            _unbindData: function() {
                if (this._dataCategory)
                    this._params.dataExchanger.unbind(this._dataCategory, this._dataName)
            },
            _bindData: function(arg) {
                this._params.dataExchanger.bind(this._dataCategory = arg.category, this._dataName = arg.name, this._onDataChanged)
            },
            setOptions: function(options) {
                var that = this;
                that.update(that._data, options);
                that._unbindData();
                that._bindData(options.source && parseSource(options.source) || unknownSource);
                that.updateLayout();
                return that
            }
        });
        function LegendsControl(parameters) {
            this._params = parameters;
            this._items = [];
            parameters.container.virtualLink("legend-base")
        }
        LegendsControl.prototype = {
            constructor: LegendsControl,
            dispose: function() {
                _each(this._items, function(_, item) {
                    item.dispose()
                });
                this._params = this._items = null
            },
            setOptions: function(options) {
                var optionList = options && options.length ? options : [],
                    items = this._items,
                    i,
                    ii = optionList.length,
                    params = this._params,
                    theme = params.themeManager.theme("legend");
                for (i = items.length; i < ii; ++i)
                    items[i] = new Legend(params);
                for (i = items.length - 1; i >= ii; --i) {
                    items[i].dispose();
                    items.splice(i, 1)
                }
                params.layoutControl.suspend();
                for (i = 0; i < ii; ++i)
                    items[i].setOptions(_extend(true, {}, theme, optionList[i]));
                params.layoutControl.resume()
            }
        };
        DX.viz.map.LegendsControl = LegendsControl;
        DX.viz.map._tests.Legend = Legend;
        DX.viz.map._tests.stubLegendType = function(stub) {
            Legend = stub
        };
        DX.viz.map._tests.restoreLegendType = function() {
            Legend = DX.viz.map._tests.Legend
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
            that._suspended = 0;
            that._updateLayout = function() {
                that._update()
            }
        }
        LayoutControl.prototype = {
            constructor: LayoutControl,
            dispose: function() {
                this._items = this._updateLayout = null
            },
            setSize: function(canvas) {
                this._canvas = canvas;
                this._update()
            },
            suspend: function() {
                ++this._suspended
            },
            resume: function() {
                if (--this._suspended === 0)
                    this._update()
            },
            addItem: function(item) {
                this._items.push(item);
                item.updateLayout = this._updateLayout
            },
            removeItem: function(item) {
                this._items.splice(_inArray(item, this._items), 1);
                item.updateLayout = null
            },
            _update: function() {
                var canvas;
                if (this._suspended === 0) {
                    canvas = this._canvas;
                    _each(this._items, function(_, item) {
                        item.resize(canvas)
                    });
                    applyLayout({
                        left: canvas.left,
                        top: canvas.top,
                        right: canvas.width + canvas.left,
                        bottom: canvas.height + canvas.top
                    }, this._items)
                }
            }
        };
        DX.viz.map.LayoutControl = LayoutControl
    })(DevExpress, jQuery);
    /*! Module viz-vectormap, file mapLayer.js */
    (function(DX, $, undefined) {
        var _Number = Number,
            _String = String,
            _abs = Math.abs,
            _round = Math.round,
            _min = Math.min,
            _max = Math.max,
            _sqrt = Math.sqrt,
            _utils = DX.require("/utils/utils.common"),
            _isFunction = _utils.isFunction,
            _isArray = _utils.isArray,
            _parseScalar = DX.viz.utils.parseScalar,
            _patchFontOptions = DX.viz.utils.patchFontOptions,
            _normalizeEnum = DX.viz.utils.normalizeEnum,
            _noop = $.noop,
            _extend = $.extend,
            _each = $.each,
            _concat = Array.prototype.concat,
            TYPE_AREA = "area",
            TYPE_LINE = "line",
            TYPE_MARKER = "marker",
            STATE_DEFAULT = 0,
            STATE_HOVERED = 1,
            STATE_SELECTED = 2,
            STATE_TO_INDEX = [0, 1, 2, 2],
            TOLERANCE = 1,
            SELECTIONS = {
                none: null,
                single: -1,
                multiple: NaN
            };
        function getSelection(selectionMode) {
            var selection = _normalizeEnum(selectionMode);
            selection = selection in SELECTIONS ? SELECTIONS[selection] : SELECTIONS.single;
            if (selection !== null)
                selection = {
                    state: {},
                    single: selection
                };
            return selection
        }
        function EmptySource(){}
        EmptySource.prototype.count = function() {
            return 0
        };
        function ArraySource(raw) {
            this.raw = raw
        }
        ArraySource.prototype = {
            constructor: ArraySource,
            count: function() {
                return this.raw.length
            },
            item: function(index) {
                return this.raw[index]
            },
            geometry: function(item) {
                return {coordinates: item.coordinates}
            },
            attributes: function(item) {
                return item.attributes
            }
        };
        function GeoJsonSource(raw) {
            this.raw = raw
        }
        GeoJsonSource.prototype = {
            constructor: GeoJsonSource,
            count: function() {
                return this.raw.features.length
            },
            item: function(index) {
                return this.raw.features[index]
            },
            geometry: function(item) {
                return item.geometry
            },
            attributes: function(item) {
                return item.properties
            }
        };
        function isGeoJsonObject(obj) {
            return _isArray(obj.features)
        }
        function unwrapFromDataSource(source) {
            var sourceType;
            if (source)
                if (isGeoJsonObject(source))
                    sourceType = GeoJsonSource;
                else if (source.length === 1 && source[0] && isGeoJsonObject(source[0])) {
                    sourceType = GeoJsonSource;
                    source = source[0]
                }
                else if (_isArray(source))
                    sourceType = ArraySource;
            sourceType = sourceType || EmptySource;
            return new sourceType(source)
        }
        function wrapToDataSource(option) {
            return option ? isGeoJsonObject(option) ? [option] : option : []
        }
        function customizeHandles(proxies, callback, widget) {
            callback.call(widget, proxies)
        }
        function customizeHandles_deprecated(proxies, callback) {
            var i,
                ii = proxies.length,
                proxy,
                settings;
            for (i = 0; i < ii; ++i) {
                proxy = proxies[i];
                settings = callback.call(proxy, proxy) || {};
                proxy.applySettings(settings);
                if (settings.isSelected)
                    proxy.selected(true)
            }
        }
        function patchProxies(handles, name, data) {
            var type = {
                    areas: "area",
                    markers: "marker"
                }[name],
                i,
                ii = handles.length,
                dataItem;
            for (i = 0; i < ii; ++i)
                handles[i].proxy.type = type;
            if (type === "marker")
                for (i = 0; i < ii; ++i) {
                    dataItem = data.item(i);
                    _extend(handles[i].proxy, {
                        text: dataItem.text,
                        value: dataItem.value,
                        values: dataItem.values,
                        url: dataItem.url
                    })
                }
        }
        function setAreaLabelVisibility(label) {
            label.text.attr({visibility: label.size[0] / label.spaceSize[0] < TOLERANCE && label.size[1] / label.spaceSize[1] < TOLERANCE ? null : "hidden"})
        }
        function setLineLabelVisibility(label) {
            label.text.attr({visibility: label.size[0] / label.spaceSize[0] < TOLERANCE || label.size[1] / label.spaceSize[1] < TOLERANCE ? null : "hidden"})
        }
        function getDataValue(proxy, dataField, deprecatedField) {
            return proxy.attribute(dataField) || proxy[deprecatedField]
        }
        var TYPE_TO_TYPE_MAP = {
                Point: TYPE_MARKER,
                MultiPoint: TYPE_LINE,
                LineString: TYPE_LINE,
                MultiLineString: TYPE_LINE,
                Polygon: TYPE_AREA,
                MultiPolygon: TYPE_AREA
            };
        function guessTypeByData(sample) {
            var type = TYPE_TO_TYPE_MAP[sample.type],
                coordinates = sample.coordinates;
            if (!type)
                if (typeof coordinates[0] === "number")
                    type = TYPE_MARKER;
                else if (typeof coordinates[0][0] === "number")
                    type = TYPE_LINE;
                else
                    type = TYPE_AREA;
            return type
        }
        var selectStrategy = function(options, data) {
                var type = _normalizeEnum(options.type),
                    elementType = _normalizeEnum(options.elementType),
                    sample,
                    strategy = _extend({}, emptyStrategy);
                if (data.count() > 0) {
                    sample = data.geometry(data.item(0));
                    type = strategiesByType[type] ? type : guessTypeByData(sample);
                    _extend(strategy, strategiesByType[type]);
                    strategy.fullType = strategy.type = type;
                    if (strategiesByGeometry[type])
                        _extend(strategy, strategiesByGeometry[type](sample));
                    if (strategiesByElementType[type]) {
                        elementType = strategiesByElementType[type][elementType] ? elementType : strategiesByElementType[type]._default;
                        _extend(strategy, strategiesByElementType[type][elementType]);
                        strategy.elementType = elementType;
                        strategy.fullType += ":" + elementType
                    }
                }
                return strategy
            };
        function applyElementState(figure, styles, state, field) {
            figure[field].attr(styles[field][state])
        }
        var emptyStrategy = {
                setup: _noop,
                reset: _noop,
                arrange: _noop,
                updateGrouping: _noop
            };
        var strategiesByType = {};
        strategiesByType[TYPE_AREA] = {
            projectLabel: projectAreaLabel,
            transform: transformPointList,
            transformLabel: transformAreaLabel,
            draw: function(context, figure, data) {
                figure.root = context.renderer.path([], "area").data(context.dataKey, data)
            },
            refresh: _noop,
            getLabelOffset: function(label) {
                setAreaLabelVisibility(label);
                return [0, 0]
            },
            getStyles: function(settings) {
                var color = settings.color || null,
                    borderColor = settings.borderColor || null,
                    borderWidth = settings.borderWidth || null,
                    opacity = settings.opacity || null;
                return {root: [{
                                "class": "dxm-area",
                                stroke: borderColor,
                                "stroke-width": borderWidth,
                                fill: color,
                                opacity: opacity
                            }, {
                                "class": "dxm-area dxm-area-hovered",
                                stroke: settings.hoveredBorderColor || borderColor,
                                "stroke-width": settings.hoveredBorderWidth || borderWidth,
                                fill: settings.hoveredColor || color,
                                opacity: settings.hoveredOpacity || opacity
                            }, {
                                "class": "dxm-area dxm-area-selected",
                                stroke: settings.selectedBorderColor || borderColor,
                                "stroke-width": settings.selectedBorderWidth || borderWidth,
                                fill: settings.selectedColor || color,
                                opacity: settings.selectedOpacity || opacity
                            }]}
            },
            setState: function(figure, styles, state) {
                applyElementState(figure, styles, state, "root")
            },
            hasLabelsGroup: true,
            updateGrouping: function(context) {
                groupByColor(context)
            }
        };
        strategiesByType[TYPE_LINE] = {
            projectLabel: projectLineLabel,
            transform: transformPointList,
            transformLabel: transformLineLabel,
            draw: function(context, figure, data) {
                figure.root = context.renderer.path([], "line").data(context.dataKey, data)
            },
            refresh: _noop,
            getLabelOffset: function(label) {
                setLineLabelVisibility(label);
                return [0, 0]
            },
            getStyles: function(settings) {
                var color = settings.color || settings.borderColor || null,
                    width = settings.borderWidth || null,
                    opacity = settings.opacity || null;
                return {root: [{
                                "class": "dxm-line",
                                stroke: color,
                                "stroke-width": width,
                                opacity: opacity
                            }, {
                                "class": "dxm-line dxm-line-hovered",
                                stroke: settings.hoveredColor || settings.hoveredBorderColor || color,
                                "stroke-width": settings.hoveredBorderWidth || width,
                                opacity: settings.hoveredOpacity || opacity
                            }, {
                                "class": "dxm-line dxm-line-selected",
                                stroke: settings.selectedColor || settings.selectedBorderColor || color,
                                "stroke-width": settings.selectedBorderWidth || width,
                                opacity: settings.selectedOpacity || opacity
                            }]}
            },
            setState: function(figure, styles, state) {
                applyElementState(figure, styles, state, "root")
            },
            hasLabelsGroup: true,
            updateGrouping: function(context) {
                groupByColor(context)
            }
        };
        strategiesByType[TYPE_MARKER] = {
            project: projectPoint,
            transform: transformPoint,
            draw: function(context, figure, data) {
                figure.root = context.renderer.g();
                this._draw(context, figure, data)
            },
            refresh: _noop,
            hasLabelsGroup: false,
            getLabelOffset: function(label, settings) {
                return [_round((label.size[0] + _max(settings.size || 0, 0)) / 2) + 2, 0]
            },
            getStyles: function(settings) {
                var styles = {root: [{"class": "dxm-marker"}, {"class": "dxm-marker dxm-marker-hovered"}, {"class": "dxm-marker dxm-marker-selected"}]};
                this._getStyles(styles, settings);
                return styles
            },
            setState: function(figure, styles, state) {
                applyElementState(figure, styles, state, "root");
                this._setState(figure, styles, state)
            },
            updateGrouping: function(context) {
                groupByColor(context);
                groupBySize(context)
            }
        };
        var strategiesByGeometry = {};
        strategiesByGeometry[TYPE_AREA] = function(sample) {
            var coordinates = sample.coordinates;
            return {project: coordinates[0] && coordinates[0][0] && coordinates[0][0][0] && typeof coordinates[0][0][0][0] === "number" ? projectMultiPolygon : projectPolygon}
        };
        strategiesByGeometry[TYPE_LINE] = function(sample) {
            var coordinates = sample.coordinates;
            return {project: coordinates[0] && coordinates[0][0] && typeof coordinates[0][0][0] === "number" ? projectPolygon : projectLineString}
        };
        var strategiesByElementType = {};
        strategiesByElementType[TYPE_MARKER] = {
            _default: "dot",
            dot: {
                setup: function(context) {
                    context.filter = context.renderer.shadowFilter("-40%", "-40%", "180%", "200%", 0, 1, 1, "#000000", 0.2)
                },
                reset: function(context) {
                    context.filter.dispose();
                    context.filter = null
                },
                _draw: function(ctx, figure, data) {
                    figure.back = ctx.renderer.circle().sharp().data(ctx.dataKey, data).append(figure.root);
                    figure.dot = ctx.renderer.circle().sharp().data(ctx.dataKey, data).append(figure.root)
                },
                refresh: function(ctx, figure, data, proxy, settings) {
                    figure.dot.attr({filter: settings.shadow ? ctx.filter.ref : null})
                },
                _getStyles: function(styles, style) {
                    var size = style.size > 0 ? _Number(style.size) : 0,
                        hoveredSize = size,
                        selectedSize = size + (style.selectedStep > 0 ? _Number(style.selectedStep) : 0),
                        hoveredBackSize = hoveredSize + (style.backStep > 0 ? _Number(style.backStep) : 0),
                        selectedBackSize = selectedSize + (style.backStep > 0 ? _Number(style.backStep) : 0),
                        color = style.color || null,
                        borderColor = style.borderColor || null,
                        borderWidth = style.borderWidth || null,
                        opacity = style.opacity || null,
                        backColor = style.backColor || null,
                        backOpacity = style.backOpacity || null;
                    styles.dot = [{
                            r: size / 2,
                            stroke: borderColor,
                            "stroke-width": borderWidth,
                            fill: color,
                            opacity: opacity
                        }, {
                            r: hoveredSize / 2,
                            stroke: style.hoveredBorderColor || borderColor,
                            "stroke-width": style.hoveredBorderWidth || borderWidth,
                            fill: style.hoveredColor || color,
                            opacity: style.hoveredOpacity || opacity
                        }, {
                            r: selectedSize / 2,
                            stroke: style.selectedBorderColor || borderColor,
                            "stroke-width": style.selectedBorderWidth || borderWidth,
                            fill: style.selectedColor || color,
                            opacity: style.selectedOpacity || opacity
                        }];
                    styles.back = [{
                            r: size / 2,
                            stroke: "none",
                            "stroke-width": 0,
                            fill: backColor,
                            opacity: backOpacity
                        }, {
                            r: hoveredBackSize / 2,
                            stroke: "none",
                            "stroke-width": 0,
                            fill: backColor,
                            opacity: backOpacity
                        }, {
                            r: selectedBackSize / 2,
                            stroke: "none",
                            "stroke-width": 0,
                            fill: backColor,
                            opacity: backOpacity
                        }]
                },
                _setState: function(figure, styles, state) {
                    applyElementState(figure, styles, state, "dot");
                    applyElementState(figure, styles, state, "back")
                }
            },
            bubble: {
                _draw: function(ctx, figure, data) {
                    figure.bubble = ctx.renderer.circle().sharp().data(ctx.dataKey, data).append(figure.root)
                },
                refresh: function(ctx, figure, data, proxy, settings) {
                    figure.bubble.attr({r: settings.size / 2})
                },
                _getStyles: function(styles, style) {
                    var color = style.color || null,
                        borderColor = style.borderColor || null,
                        borderWidth = style.borderWidth || null,
                        opacity = style.opacity || null;
                    styles.bubble = [{
                            stroke: borderColor,
                            "stroke-width": borderWidth,
                            fill: color,
                            opacity: opacity
                        }, {
                            stroke: style.hoveredBorderColor || borderColor,
                            "stroke-width": style.hoveredBorderWidth || borderWidth,
                            fill: style.hoveredColor || style.color,
                            opacity: style.hoveredOpacity || opacity
                        }, {
                            stroke: style.selectedBorderColor || borderColor,
                            "stroke-width": style.selectedBorderWidth || borderWidth,
                            fill: style.selectedColor || style.color,
                            opacity: style.selectedOpacity || opacity
                        }]
                },
                _setState: function(figure, styles, state) {
                    applyElementState(figure, styles, state, "bubble")
                },
                arrange: function(context, handles) {
                    var values = [],
                        i,
                        ii = values.length = handles.length,
                        settings = context.settings,
                        dataField = settings.dataField,
                        minSize = settings.minSize > 0 ? _Number(settings.minSize) : 0,
                        maxSize = settings.maxSize > minSize ? _Number(settings.maxSize) : minSize,
                        minValue,
                        maxValue,
                        deltaValue,
                        deltaSize;
                    if (settings.sizeGroups)
                        return;
                    for (i = 0; i < ii; ++i)
                        values[i] = _max(getDataValue(handles[i].proxy, dataField, "value") || 0, 0);
                    minValue = _min.apply(null, values);
                    maxValue = _max.apply(null, values);
                    deltaValue = maxValue - minValue || 1;
                    deltaSize = maxSize - minSize;
                    for (i = 0; i < ii; ++i)
                        handles[i]._settings.size = minSize + deltaSize * (values[i] - minValue) / deltaValue
                },
                updateGrouping: function(context) {
                    var dataField = context.settings.dataField;
                    strategiesByType[TYPE_MARKER].updateGrouping(context);
                    groupBySize(context, function(proxy) {
                        return getDataValue(proxy, dataField, "value")
                    })
                }
            },
            pie: {
                _draw: function(ctx, figure, data) {
                    figure.pie = ctx.renderer.g().append(figure.root);
                    figure.border = ctx.renderer.circle().sharp().data(ctx.dataKey, data).append(figure.root)
                },
                refresh: function(ctx, figure, data, proxy, settings) {
                    var values = getDataValue(proxy, ctx.settings.dataField, "values") || [],
                        i,
                        ii = values.length || 0,
                        colors = settings._colors,
                        sum = 0,
                        pie = figure.pie,
                        renderer = ctx.renderer,
                        dataKey = ctx.dataKey,
                        r = (settings.size > 0 ? _Number(settings.size) : 0) / 2,
                        start = 90,
                        end = start;
                    for (i = 0; i < ii; ++i)
                        sum += values[i] || 0;
                    for (i = 0; i < ii; ++i) {
                        start = end;
                        end += (values[i] || 0) / sum * 360;
                        renderer.arc(0, 0, 0, r, start, end).attr({
                            "stroke-linejoin": "round",
                            fill: colors[i]
                        }).data(dataKey, data).append(pie)
                    }
                    figure.border.attr({r: r})
                },
                _getStyles: function(styles, style) {
                    var opacity = style.opacity || null,
                        borderColor = style.borderColor || null,
                        borderWidth = style.borderWidth || null;
                    styles.pie = [{opacity: opacity}, {opacity: style.hoveredOpacity || opacity}, {opacity: style.selectedOpacity || opacity}];
                    styles.border = [{
                            stroke: borderColor,
                            "stroke-width": borderWidth
                        }, {
                            stroke: style.hoveredBorderColor || borderColor,
                            "stroke-width": style.hoveredBorderWidth || borderWidth
                        }, {
                            stroke: style.selectedBorderColor || borderColor,
                            "stroke-width": style.selectedBorderWidth || borderWidth
                        }]
                },
                _setState: function(figure, styles, state) {
                    applyElementState(figure, styles, state, "pie");
                    applyElementState(figure, styles, state, "border")
                },
                arrange: function(context, handles) {
                    var i,
                        ii = handles.length,
                        dataField = context.settings.dataField,
                        values,
                        count = 0,
                        palette;
                    for (i = 0; i < ii; ++i) {
                        values = getDataValue(handles[i].proxy, dataField, "values");
                        if (values && values.length > count)
                            count = values.length
                    }
                    if (count > 0) {
                        values = [];
                        palette = context.params.themeManager.createPalette(context.settings.palette, {useHighlight: true});
                        for (i = 0; i < count; ++i)
                            values.push(palette.getNextColor());
                        context.settings._colors = values;
                        context.grouping.color = {
                            callback: _noop,
                            field: "",
                            partition: [],
                            values: []
                        };
                        context.params.dataExchanger.set(context.name, "color", {
                            partition: [],
                            values: values
                        })
                    }
                }
            },
            image: {
                _draw: function(ctx, figure, data) {
                    figure.image = ctx.renderer.image().attr({location: "center"}).data(ctx.dataKey, data).append(figure.root)
                },
                refresh: function(ctx, figure, data, proxy, settings) {
                    figure.image.attr({href: getDataValue(proxy, ctx.settings.dataField, "url")})
                },
                _getStyles: function(styles, style) {
                    var size = style.size > 0 ? _Number(style.size) : 0,
                        hoveredSize = size + (style.hoveredStep > 0 ? _Number(style.hoveredStep) : 0),
                        selectedSize = size + (style.selectedStep > 0 ? _Number(style.selectedStep) : 0),
                        opacity = style.opacity || null;
                    styles.image = [{
                            x: -size / 2,
                            y: -size / 2,
                            width: size,
                            height: size,
                            opacity: opacity
                        }, {
                            x: -hoveredSize / 2,
                            y: -hoveredSize / 2,
                            width: hoveredSize,
                            height: hoveredSize,
                            opacity: style.hoveredOpacity || opacity
                        }, {
                            x: -selectedSize / 2,
                            y: -selectedSize / 2,
                            width: selectedSize,
                            height: selectedSize,
                            opacity: style.selectedOpacity || opacity
                        }]
                },
                _setState: function(figure, styles, state) {
                    applyElementState(figure, styles, state, "image")
                }
            }
        };
        function projectPoint(projection, coordinates) {
            return projection.project(coordinates)
        }
        function projectPointList(projection, coordinates) {
            var output = [],
                i,
                ii = output.length = coordinates.length;
            for (i = 0; i < ii; ++i)
                output[i] = projection.project(coordinates[i]);
            return output
        }
        function projectLineString(projection, coordinates) {
            return [projectPointList(projection, coordinates)]
        }
        function projectPolygon(projection, coordinates) {
            var output = [],
                i,
                ii = output.length = coordinates.length;
            for (i = 0; i < ii; ++i)
                output[i] = projectPointList(projection, coordinates[i]);
            return output
        }
        function projectMultiPolygon(projection, coordinates) {
            var output = [],
                i,
                ii = output.length = coordinates.length;
            for (i = 0; i < ii; ++i)
                output[i] = projectPolygon(projection, coordinates[i]);
            return _concat.apply([], output)
        }
        function transformPoint(content, projection, coordinates) {
            var data = projection.transform(coordinates);
            content.root.attr({
                translateX: data[0],
                translateY: data[1]
            })
        }
        function transformList(projection, coordinates) {
            var output = [],
                i,
                ii = output.length = coordinates.length;
            for (i = 0; i < ii; ++i)
                output[i] = projection.transform(coordinates[i]);
            return output
        }
        function transformPointList(content, projection, coordinates) {
            var output = [],
                i,
                ii = output.length = coordinates.length;
            for (i = 0; i < ii; ++i)
                output[i] = transformList(projection, coordinates[i]);
            content.root.attr({points: output})
        }
        function transformAreaLabel(label, projection, coordinates) {
            var data = projection.transform(coordinates[0]);
            label.spaceSize = projection.getSquareSize(coordinates[1]);
            label.text.attr({
                translateX: data[0],
                translateY: data[1]
            });
            setAreaLabelVisibility(label)
        }
        function transformLineLabel(label, projection, coordinates) {
            var data = projection.transform(coordinates[0]);
            label.spaceSize = projection.getSquareSize(coordinates[1]);
            label.text.attr({
                translateX: data[0],
                translateY: data[1]
            });
            setLineLabelVisibility(label)
        }
        function getItemSettings(context, proxy, settings) {
            var result = combineSettings(context.settings, settings);
            proxy.text = proxy.text || settings.text;
            applyGrouping(context.grouping, proxy, result);
            if (settings.color === undefined && settings.paletteIndex >= 0)
                result.color = result._colors[settings.paletteIndex];
            return result
        }
        function applyGrouping(grouping, proxy, settings) {
            _each(grouping, function(name, data) {
                var index = findGroupingIndex(data.callback(proxy, data.field), data.partition);
                if (index >= 0)
                    settings[name] = data.values[index]
            })
        }
        function findGroupingIndex(value, partition) {
            var start = 0,
                end = partition.length - 1,
                index = -1,
                middle;
            if (partition[start] <= value && value <= partition[end])
                if (value === partition[end])
                    index = end - 1;
                else {
                    while (end - start > 1) {
                        middle = start + end >> 1;
                        if (value < partition[middle])
                            end = middle;
                        else
                            start = middle
                    }
                    index = start
                }
            return index
        }
        function raiseChanged(context, handle, state, name) {
            context.params.eventTrigger(name, {
                target: handle.proxy,
                state: state
            })
        }
        function combineSettings(common, partial) {
            var obj = _extend({}, common, partial);
            obj.label = _extend({}, common.label, obj.label);
            obj.label.font = _extend({}, common.label.font, obj.label.font);
            return obj
        }
        function processCommonSettings(type, options, themeManager) {
            var settings = combineSettings(themeManager.theme("layer:" + type) || {label: {}}, options),
                colors,
                i,
                palette;
            if (settings.paletteSize > 0) {
                palette = themeManager.createGradientPalette(settings.palette, settings.paletteSize);
                for (i = 0, colors = []; i < settings.paletteSize; ++i)
                    colors.push(palette.getColor(i));
                settings._colors = colors
            }
            return settings
        }
        function valueCallback(proxy, dataField) {
            return proxy.attribute(dataField)
        }
        var performGrouping = function(context, partition, settingField, dataField, valuesCallback) {
                var values;
                if (dataField && partition && partition.length > 1) {
                    values = valuesCallback(partition.length - 1);
                    context.grouping[settingField] = {
                        callback: _isFunction(dataField) ? dataField : valueCallback,
                        field: dataField,
                        partition: partition,
                        values: values
                    };
                    context.params.dataExchanger.set(context.name, settingField, {
                        partition: partition,
                        values: values
                    })
                }
            };
        function dropGrouping(context) {
            var name = context.name,
                dataExchanger = context.params.dataExchanger;
            _each(context.grouping, function(field) {
                dataExchanger.set(name, field, null)
            });
            context.grouping = {}
        }
        var groupByColor = function(context) {
                performGrouping(context, context.settings.colorGroups, "color", context.settings.colorGroupingField, function(count) {
                    var _palette = context.params.themeManager.createGradientPalette(context.settings.palette, count),
                        i,
                        list = [];
                    for (i = 0; i < count; ++i)
                        list.push(_palette.getColor(i));
                    return list
                })
            };
        var groupBySize = function(context, valueCallback) {
                var settings = context.settings;
                performGrouping(context, settings.sizeGroups, "size", valueCallback || settings.sizeGroupingField, function(count) {
                    var minSize = settings.minSize > 0 ? _Number(settings.minSize) : 0,
                        maxSize = settings.maxSize >= minSize ? _Number(settings.maxSize) : 0,
                        i = 0,
                        sizes = [];
                    if (count > 1)
                        for (i = 0; i < count; ++i)
                            sizes.push((minSize * (count - i - 1) + maxSize * i) / (count - 1));
                    else if (count === 1)
                        sizes.push((minSize + maxSize) / 2);
                    return sizes
                })
            };
        function setFlag(flags, flag, state) {
            if (state)
                flags |= flag;
            else
                flags &= ~flag;
            return flags
        }
        function hasFlag(flags, flag) {
            return !!(flags & flag)
        }
        function createLayerProxy(layer, name, index) {
            var proxy = {
                    index: index,
                    name: name,
                    getElements: function() {
                        return layer.getProxies()
                    },
                    clearSelection: function(_noEvent) {
                        layer.clearSelection(_noEvent);
                        return proxy
                    }
                };
            return proxy
        }
        var MapLayer = function(params, container, name, index) {
                var that = this;
                that._params = params;
                that._onProjection();
                that.proxy = createLayerProxy(that, name, index);
                that._context = {
                    name: name,
                    layer: that.proxy,
                    renderer: params.renderer,
                    projection: params.projection,
                    params: params,
                    dataKey: params.dataKey,
                    str: emptyStrategy,
                    hover: false,
                    selection: null,
                    grouping: {},
                    root: params.renderer.g().attr({"class": "dxm-layer"}).linkOn(container, name).linkAppend()
                };
                that._container = container;
                that._dataSource = new DX.viz.DataSource(function() {
                    that._data = unwrapFromDataSource(that._dataSource.items());
                    that._update(true)
                });
                that._options = {};
                that._handles = [];
                that._data = new EmptySource
            };
        MapLayer.prototype = {
            constructor: MapLayer,
            _onProjection: function() {
                var that = this;
                that._removeHandlers = that._params.projection.on({
                    project: function() {
                        that._project()
                    },
                    transform: function() {
                        that._transform()
                    },
                    center: function() {
                        that._transformCore()
                    },
                    zoom: function() {
                        that._transform()
                    }
                })
            },
            _offProjection: function() {
                this._removeHandlers();
                this._removeHandlers = null
            },
            dispose: function() {
                var that = this;
                that._dataSource.dispose();
                that._destroyHandles();
                dropGrouping(that._context);
                that._context.root.linkRemove().linkOff();
                that._context.labelRoot && that._context.labelRoot.linkRemove().linkOff();
                that._context.str.reset(that._context);
                that._offProjection();
                that._params = that._container = that._context = that._dataSource = that.proxy = null;
                return that
            },
            TESTS_getContext: function() {
                return this._context
            },
            setOptions: function(options) {
                var that = this;
                options = that._options = options || {};
                if ("data" in options && options.data !== that._options_data) {
                    that._options_data = options.data;
                    that._params.notifyDirty();
                    that._dataSource.update(wrapToDataSource(options.data))
                }
                else if (that._data.count() > 0) {
                    that._params.notifyDirty();
                    that._update(options.type !== undefined && options.type !== that._context.str.type || options.elementType !== undefined && options.elementType !== that._context.str.elementType)
                }
            },
            _update: function(isContextChanged) {
                var that = this,
                    context = that._context;
                if (isContextChanged) {
                    context.str.reset(context);
                    context.root.clear();
                    context.labelRoot && context.labelRoot.clear();
                    that._params.tracker.reset();
                    that._destroyHandles();
                    context.str = selectStrategy(that._options, that._data);
                    context.str.setup(context);
                    that.proxy.type = context.str.type;
                    that.proxy.elementType = context.str.elementType
                }
                context.settings = processCommonSettings(context.str.fullType, that._options, that._params.themeManager);
                context.hasSeparateLabel = !!(context.settings.label.enabled && context.str.hasLabelsGroup);
                context.hover = !!_parseScalar(context.settings.hoverEnabled, true);
                if (context.selection)
                    _each(context.selection.state, function(_, handle) {
                        handle && handle.resetSelected()
                    });
                context.selection = getSelection(context.settings.selectionMode);
                if (context.hasSeparateLabel) {
                    if (!context.labelRoot) {
                        context.labelRoot = context.renderer.g().attr({"class": "dxm-layer-labels"}).linkOn(that._container, {
                            name: context.name + "-labels",
                            after: context.name
                        }).linkAppend();
                        that._transformCore()
                    }
                }
                else if (context.labelRoot) {
                    context.labelRoot.linkRemove().linkOff();
                    context.labelRoot = null
                }
                if (isContextChanged)
                    that._createHandles();
                dropGrouping(context);
                context.str.arrange(context, that._handles);
                context.str.updateGrouping(context);
                that._updateHandles();
                that._params.notifyReady()
            },
            _destroyHandles: function() {
                var handles = this._handles,
                    i,
                    ii = handles.length;
                for (i = 0; i < ii; ++i)
                    handles[i].dispose();
                if (this._context.selection)
                    this._context.selection.state = {};
                this._handles = []
            },
            _createHandles: function() {
                var that = this,
                    handles = that._handles = [],
                    data = that._data,
                    i,
                    ii = handles.length = data.count(),
                    context = that._context,
                    geometry = data.geometry,
                    attributes = data.attributes,
                    handle,
                    dataItem;
                for (i = 0; i < ii; ++i) {
                    dataItem = data.item(i);
                    handles[i] = new MapLayerElement(context, i, geometry(dataItem), attributes(dataItem))
                }
                if (_isFunction(that._options.customize))
                    (that._options._deprecated ? customizeHandles_deprecated : customizeHandles)(that.getProxies(), that._options.customize, that._params.widget);
                if (that._options._deprecated)
                    patchProxies(handles, context.name, data);
                for (i = 0; i < ii; ++i) {
                    handle = handles[i];
                    handle.project();
                    handle.draw();
                    handle.transform()
                }
                if (context.selection)
                    _each(context.selection.state, function(_, handle) {
                        handle && handle.restoreSelected()
                    })
            },
            _updateHandles: function() {
                var handles = this._handles,
                    i,
                    ii = handles.length;
                for (i = 0; i < ii; ++i)
                    handles[i].refresh();
                if (this._context.settings.label.enabled) {
                    for (i = 0; i < ii; ++i)
                        handles[i].measureLabel();
                    for (i = 0; i < ii; ++i)
                        handles[i].adjustLabel()
                }
            },
            _transformCore: function() {
                var transform = this._params.projection.getTransform();
                this._context.root.attr(transform);
                this._context.labelRoot && this._context.labelRoot.attr(transform)
            },
            _project: function() {
                var handles = this._handles,
                    i,
                    ii = handles.length;
                for (i = 0; i < ii; ++i)
                    handles[i].project();
                this._transformHandles()
            },
            _transformHandles: function() {
                var handles = this._handles,
                    i,
                    ii = handles.length;
                for (i = 0; i < ii; ++i)
                    handles[i].transform()
            },
            _transform: function() {
                this._transformCore();
                this._transformHandles()
            },
            getProxies: function() {
                var handles = this._handles,
                    proxies = [],
                    i,
                    ii = proxies.length = handles.length;
                for (i = 0; i < ii; ++i)
                    proxies[i] = handles[i].proxy;
                return proxies
            },
            getProxy: function(index) {
                return this._handles[index].proxy
            },
            raiseClick: function(i, jQueryEvent) {
                this._params.eventTrigger("click", {
                    target: this._handles[i].proxy,
                    jQueryEvent: jQueryEvent
                })
            },
            hoverItem: function(i, state) {
                this._handles[i].setHovered(state)
            },
            selectItem: function(i, state, _noEvent) {
                this._handles[i].setSelected(state, _noEvent)
            },
            clearSelection: function() {
                var selection = this._context.selection;
                if (selection) {
                    _each(selection.state, function(_, handle) {
                        handle && handle.setSelected(false)
                    });
                    selection.state = {}
                }
            }
        };
        function createProxy(handle, coords, attrs) {
            var proxy = {
                    coordinates: function() {
                        return coords
                    },
                    attribute: function(name, value) {
                        if (arguments.length > 1) {
                            attrs[name] = value;
                            return proxy
                        }
                        else
                            return arguments.length > 0 ? attrs[name] : attrs
                    },
                    selected: function(state, _noEvent) {
                        if (arguments.length > 0) {
                            handle.setSelected(state, _noEvent);
                            return proxy
                        }
                        else
                            return handle.isSelected()
                    },
                    applySettings: function(settings) {
                        handle.update(settings);
                        return proxy
                    }
                };
            return proxy
        }
        var MapLayerElement = function(context, index, geometry, attributes) {
                var that = this,
                    proxy = that.proxy = createProxy(that, geometry.coordinates, _extend({}, attributes));
                that._ctx = context;
                that._idx = index;
                that._fig = that._lbl = null;
                that._state = STATE_DEFAULT;
                that._coordinates = geometry.coordinates;
                that._settings = {label: {}};
                proxy.index = index;
                proxy.layer = context.layer;
                that._data = {
                    name: context.name,
                    index: index
                }
            };
        MapLayerElement.prototype = {
            constructor: MapLayerElement,
            dispose: function() {
                var that = this;
                that._ctx = that.proxy = that._settings = that._fig = that._lbl = that.data = null;
                return that
            },
            project: function() {
                var context = this._ctx;
                this._prj = context.str.project(context.projection, this._coordinates);
                if (context.hasSeparateLabel && this._lbl)
                    this._projectLabel()
            },
            _projectLabel: function() {
                this._labelPrj = this._ctx.str.projectLabel(this._prj)
            },
            draw: function() {
                var that = this,
                    context = this._ctx;
                context.str.draw(context, that._fig = {}, that._data);
                that._fig.root.append(context.root)
            },
            transform: function() {
                var that = this,
                    context = that._ctx;
                context.str.transform(that._fig, context.projection, that._prj);
                if (context.hasSeparateLabel && that._lbl)
                    that._transformLabel()
            },
            _transformLabel: function() {
                this._ctx.str.transformLabel(this._lbl, this._ctx.projection, this._labelPrj)
            },
            refresh: function() {
                var that = this,
                    strategy = that._ctx.str,
                    settings = getItemSettings(that._ctx, that.proxy, that._settings);
                that._styles = strategy.getStyles(settings);
                strategy.refresh(that._ctx, that._fig, that._data, that.proxy, settings);
                that._refreshLabel(settings);
                that._setState()
            },
            _refreshLabel: function(settings) {
                var that = this,
                    context = that._ctx,
                    labelSettings = settings.label,
                    label = that._lbl;
                if (labelSettings.enabled) {
                    if (!label) {
                        label = that._lbl = {
                            root: context.labelRoot || that._fig.root,
                            text: context.renderer.text().attr({"class": "dxm-label"}),
                            size: [0, 0]
                        };
                        if (context.hasSeparateLabel) {
                            that._projectLabel();
                            that._transformLabel()
                        }
                    }
                    label.value = _String(that.proxy.text || that.proxy.attribute(labelSettings.dataField) || "");
                    if (label.value) {
                        label.text.attr({
                            text: label.value,
                            x: 0,
                            y: 0
                        }).css(_patchFontOptions(labelSettings.font)).attr({
                            align: "center",
                            stroke: labelSettings.stroke,
                            "stroke-width": labelSettings["stroke-width"],
                            "stroke-opacity": labelSettings["stroke-opacity"]
                        }).data(context.dataKey, that._data).append(label.root);
                        label.settings = settings
                    }
                }
                else if (label) {
                    label.text.remove();
                    that._lbl = null
                }
            },
            measureLabel: function() {
                var label = this._lbl,
                    bbox;
                if (label.value) {
                    bbox = label.text.getBBox();
                    label.size = [bbox.width, bbox.height, -bbox.y - bbox.height / 2]
                }
            },
            adjustLabel: function() {
                var label = this._lbl,
                    offset;
                if (label.value) {
                    offset = this._ctx.str.getLabelOffset(label, label.settings);
                    label.settings = null;
                    label.text.attr({
                        x: offset[0],
                        y: offset[1] + label.size[2]
                    })
                }
            },
            update: function(settings) {
                var that = this;
                that._settings = combineSettings(that._settings, settings);
                if (that._fig) {
                    that.refresh();
                    if (that._lbl && that._lbl.value) {
                        that.measureLabel();
                        that.adjustLabel()
                    }
                }
            },
            _setState: function() {
                this._ctx.str.setState(this._fig, this._styles, STATE_TO_INDEX[this._state])
            },
            _setForeground: function() {
                var root = this._fig.root;
                this._state ? root.toForeground() : root.toBackground()
            },
            setHovered: function(state) {
                var that = this,
                    currentState = hasFlag(that._state, STATE_HOVERED),
                    newState = !!state;
                if (that._ctx.hover && currentState !== newState) {
                    that._state = setFlag(that._state, STATE_HOVERED, newState);
                    that._setState();
                    that._setForeground();
                    raiseChanged(that._ctx, that, newState, "hoverChanged")
                }
                return that
            },
            setSelected: function(state, _noEvent) {
                var that = this,
                    currentState = hasFlag(that._state, STATE_SELECTED),
                    newState = !!state,
                    selection = that._ctx.selection,
                    tmp;
                if (selection && currentState !== newState) {
                    that._state = setFlag(that._state, STATE_SELECTED, newState);
                    tmp = selection.state[selection.single];
                    selection.state[selection.single] = null;
                    if (tmp)
                        tmp.setSelected(false);
                    selection.state[selection.single || that._idx] = state ? that : null;
                    if (that._fig) {
                        that._setState();
                        that._setForeground();
                        if (!_noEvent)
                            raiseChanged(that._ctx, that, newState, "selectionChanged")
                    }
                }
            },
            isSelected: function() {
                return hasFlag(this._state, STATE_SELECTED)
            },
            resetSelected: function() {
                this._state = setFlag(this._state, STATE_SELECTED, false)
            },
            restoreSelected: function() {
                this._fig.root.toForeground()
            }
        };
        function calculatePolygonCentroid(coordinates) {
            var i,
                ii = coordinates.length,
                v1,
                v2 = coordinates[ii - 1],
                cross,
                cx = 0,
                cy = 0,
                area = 0;
            for (i = 0; i < ii; ++i) {
                v1 = v2;
                v2 = coordinates[i];
                cross = v1[0] * v2[1] - v2[0] * v1[1];
                area += cross;
                cx += (v1[0] + v2[0]) * cross;
                cy += (v1[1] + v2[1]) * cross
            }
            return [[cx / 3 / area, cy / 3 / area], _abs(area) / 2]
        }
        function calculateLineStringData(coordinates) {
            var i,
                ii = coordinates.length,
                v1,
                v2 = coordinates[0],
                totalLength = 0,
                items = [0],
                min0 = v2[0],
                max0 = v2[0],
                min1 = v2[1],
                max1 = v2[1],
                t;
            for (i = 1; i < ii; ++i) {
                v1 = v2;
                v2 = coordinates[i];
                totalLength += _sqrt((v1[0] - v2[0]) * (v1[0] - v2[0]) + (v1[1] - v2[1]) * (v1[1] - v2[1]));
                items[i] = totalLength;
                min0 = _min(min0, v2[0]);
                max0 = _max(max0, v2[0]);
                min1 = _min(min1, v2[1]);
                max1 = _max(max1, v2[1])
            }
            i = findGroupingIndex(totalLength / 2, items);
            v1 = coordinates[i];
            v2 = coordinates[i + 1];
            t = (totalLength / 2 - items[i]) / (items[i + 1] - items[i]);
            return [[v1[0] * (1 - t) + v2[0] * t, v1[1] * (1 - t) + v2[1] * t], [max0 - min0, max1 - min1], totalLength]
        }
        function projectAreaLabel(coordinates) {
            var i,
                ii = coordinates.length,
                centroid,
                resultCentroid,
                maxArea = 0;
            for (i = 0; i < ii; ++i) {
                centroid = calculatePolygonCentroid(coordinates[i]);
                if (centroid[1] > maxArea) {
                    maxArea = centroid[1];
                    resultCentroid = centroid
                }
            }
            return [resultCentroid[0], [_sqrt(resultCentroid[1]), _sqrt(resultCentroid[1])]]
        }
        function projectLineLabel(coordinates) {
            var i,
                ii = coordinates.length,
                maxLength = 0,
                data,
                resultData;
            for (i = 0; i < ii; ++i) {
                data = calculateLineStringData(coordinates[i]);
                if (data[2] > maxLength) {
                    maxLength = data[2];
                    resultData = data
                }
            }
            return resultData
        }
        function MapLayerCollection(params) {
            var that = this;
            that._params = params;
            that._layers = [];
            that._layerByName = {};
            that._rect = [0, 0, 0, 0];
            that._clip = params.renderer.clipRect();
            that._container = params.renderer.g().attr({
                "class": "dxm-layers",
                clipId: that._clip.id
            }).linkOn(params.renderer.root, "layers").linkAppend().enableLinks()
        }
        MapLayerCollection.prototype = {
            constructor: MapLayerCollection,
            dispose: function() {
                var that = this;
                that._clip.dispose();
                that._container.linkRemove().linkOff();
                that._params = that._layers = that._layerByName = that._clip = that._container = null
            },
            _addLayers: function(optionList) {
                var layers = this._layers,
                    i = layers.length,
                    ii = optionList.length,
                    name,
                    layer;
                for (; i < ii; ++i) {
                    name = (optionList[i] || {}).name || "map-layer-" + i;
                    layers[i] = layer = new MapLayer(this._params, this._container, name, i);
                    this._layerByName[name] = layer
                }
            },
            _removeLayers: function(count) {
                var layers = this._layers,
                    i = layers.length - 1,
                    ii = i - count,
                    layer;
                for (; i > ii; --i) {
                    layer = layers[i];
                    delete this._layerByName[layer.proxy.name];
                    layer.dispose();
                    layers.splice(i, 1)
                }
            },
            setOptions: function(options) {
                var optionList = options ? options.length ? options : [options] : [],
                    layers = this._layers,
                    i,
                    ii;
                if (layers.length < optionList.length)
                    this._addLayers(optionList);
                if (layers.length > optionList.length)
                    this._removeLayers(layers.length - optionList.length);
                for (i = 0, ii = layers.length; i < ii; ++i)
                    layers[i].setOptions(optionList[i])
            },
            _updateClip: function() {
                var rect = this._rect,
                    bw = this._bw;
                this._clip.attr({
                    x: rect[0] + bw,
                    y: rect[1] + bw,
                    width: _max(rect[2] - bw * 2, 0),
                    height: _max(rect[3] - bw * 2, 0)
                })
            },
            setRect: function(rect) {
                this._rect = rect;
                this._updateClip()
            },
            setBorderWidth: function(borderWidth) {
                this._bw = _max(borderWidth, 0);
                this._updateClip()
            },
            byIndex: function(index) {
                return this._layers[index]
            },
            byName: function(name) {
                return this._layerByName[name]
            },
            items: function() {
                return this._layers
            }
        };
        DX.viz.map.MapLayerCollection = MapLayerCollection;
        _extend(DX.viz.map._tests, {
            MapLayer: MapLayer,
            stub_MapLayer: function(stub) {
                MapLayer = stub
            },
            selectStrategy: selectStrategy,
            stub_selectStrategy: function(stub) {
                selectStrategy = stub
            },
            MapLayerElement: MapLayerElement,
            stub_MapLayerElement: function(stub) {
                MapLayerElement = stub
            },
            createProxy: createProxy,
            stub_performGrouping: function(stub) {
                performGrouping = stub
            },
            performGrouping: performGrouping,
            stub_groupByColor: function(stub) {
                groupByColor = stub
            },
            groupByColor: groupByColor,
            stub_groupBySize: function(stub) {
                groupBySize = stub
            },
            groupBySize: groupBySize,
            findGroupingIndex: findGroupingIndex
        })
    })(DevExpress, jQuery);
    DevExpress.MOD_VIZ_VECTORMAP = true
}