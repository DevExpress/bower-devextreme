/*! 
* DevExtreme (Charts)
* Version: 15.2.4
* Build date: Dec 8, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!window.DevExpress || !DevExpress.MOD_VIZ_CHARTS) {
    if (!window.DevExpress || !DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-charts, file scrollBar.js */
    (function($, DX, math) {
        var MIN_SCROLL_BAR_SIZE = 2,
            commonUtils = DX.require("/utils/utils.common"),
            pointerEvents = DX.require("/ui/events/pointer/ui.events.pointer"),
            isDefined = commonUtils.isDefined,
            _min = math.min,
            _max = math.max,
            ScrollBar;
        ScrollBar = DX.viz.charts.ScrollBar = function(renderer, group) {
            this._translator = DX.viz.CoreFactory.createTranslator2D({}, {}, {});
            this._scroll = renderer.rect().append(group);
            this._addEvents()
        };
        function _getXCoord(canvas, pos, offset, width) {
            var x = 0;
            if (pos === "right")
                x = canvas.width - canvas.right + offset;
            else if (pos === "left")
                x = canvas.left - offset - width;
            return x
        }
        function _getYCoord(canvas, pos, offset, width) {
            var y = 0;
            if (pos === "top")
                y = canvas.top - offset;
            else if (pos === "bottom")
                y = canvas.height - canvas.bottom + width + offset;
            return y
        }
        ScrollBar.prototype = {
            _addEvents: function() {
                var that = this,
                    $scroll = $(that._scroll.element),
                    startPosX = 0,
                    startPosY = 0,
                    scrollChangeHandler = function(e) {
                        var dX = (startPosX - e.pageX) * that._scale,
                            dY = (startPosY - e.pageY) * that._scale;
                        $scroll.trigger(new $.Event("dxc-scroll-move", $.extend(e, {
                            type: "dxc-scroll-move",
                            pointers: [{
                                    pageX: startPosX + dX,
                                    pageY: startPosY + dY
                                }]
                        })))
                    };
                $scroll.on(pointerEvents.down, function(e) {
                    startPosX = e.pageX;
                    startPosY = e.pageY;
                    $scroll.trigger(new $.Event("dxc-scroll-start", {pointers: [{
                                pageX: startPosX,
                                pageY: startPosY
                            }]}));
                    $(document).on(pointerEvents.move, scrollChangeHandler)
                });
                $(document).on(pointerEvents.up, function() {
                    $(document).off(pointerEvents.move, scrollChangeHandler)
                })
            },
            update: function(options) {
                var that = this,
                    position = options.position,
                    isVertical = options.rotated,
                    defaultPosition = isVertical ? "right" : "top",
                    secondaryPosition = isVertical ? "left" : "bottom";
                if (position !== defaultPosition && position !== secondaryPosition)
                    position = defaultPosition;
                that._scroll.attr({
                    rotate: !options.rotated ? -90 : 0,
                    rotateX: 0,
                    rotateY: 0,
                    fill: options.color,
                    width: options.width,
                    opacity: options.opacity
                });
                that._layoutOptions = {
                    width: options.width,
                    offset: options.offset,
                    vertical: isVertical,
                    position: position
                };
                return that
            },
            init: function(range, canvas) {
                var that = this;
                that._translateWithOffset = range.axisType === "discrete" && !range.stick && 1 || 0;
                that._translator.update($.extend({}, range, {
                    minVisible: null,
                    maxVisible: null,
                    visibleCategories: null
                }), $.extend({}, canvas), {isHorizontal: !that._layoutOptions.vertical});
                return that
            },
            getOptions: function() {
                return this._layoutOptions
            },
            shift: function(x, y) {
                this._scroll.attr({
                    translateX: x,
                    translateY: y
                })
            },
            setPane: function(panes) {
                var position = this._layoutOptions.position,
                    pane;
                if (position === "left" || position === "top")
                    pane = panes[0];
                else
                    pane = panes[panes.length - 1];
                this.pane = pane.name;
                this._canvas = pane.canvas;
                return this
            },
            getMultipleAxesSpacing: function() {
                return 0
            },
            getBoundingRect: function() {
                var options = this._layoutOptions,
                    isVertical = options.vertical,
                    offset = options.offset,
                    width = options.width,
                    pos = options.position,
                    size = width + offset,
                    canvas = this._canvas;
                return isVertical ? {
                        x: _getXCoord(canvas, pos, offset, width),
                        y: canvas.top,
                        width: size,
                        height: canvas.height - canvas.top - canvas.bottom
                    } : {
                        x: canvas.left,
                        y: _getYCoord(canvas, pos, offset, width),
                        width: canvas.width - canvas.left - canvas.right,
                        height: size
                    }
            },
            applyLayout: function() {
                var canvas = this._canvas,
                    options = this._layoutOptions,
                    pos = options.position,
                    offset = options.offset,
                    width = options.width;
                this.shift(_getXCoord(canvas, pos, offset, width), _getYCoord(canvas, pos, offset, width))
            },
            setPosition: function(min, max) {
                var that = this,
                    translator = that._translator,
                    minPoint = isDefined(min) ? translator.translate(min, -that._translateWithOffset) : translator.translate("canvas_position_start"),
                    maxPoint = isDefined(max) ? translator.translate(max, that._translateWithOffset) : translator.translate("canvas_position_end");
                that._offset = _min(minPoint, maxPoint);
                that._scale = translator.getScale(min, max);
                that._applyPosition(_min(minPoint, maxPoint), _max(minPoint, maxPoint))
            },
            transform: function(translate, scale) {
                var translator = this._translator,
                    x = translator.getCanvasVisibleArea().min,
                    dx = x - (x * scale - translate),
                    lx = this._offset + dx / (this._scale * scale);
                this._applyPosition(lx, lx + translator.canvasLength / (this._scale * scale))
            },
            dispose: function() {
                this._scroll.dispose();
                this._scroll = this._translator = null
            },
            _applyPosition: function(x1, x2) {
                var that = this,
                    visibleArea = that._translator.getCanvasVisibleArea(),
                    height;
                x1 = _max(x1, visibleArea.min);
                x1 = _min(x1, visibleArea.max);
                x2 = _min(x2, visibleArea.max);
                x2 = _max(x2, visibleArea.min);
                height = math.abs(x2 - x1);
                that._scroll.attr({
                    y: x1,
                    height: height < MIN_SCROLL_BAR_SIZE ? MIN_SCROLL_BAR_SIZE : height
                })
            }
        }
    })(jQuery, DevExpress, Math);
    /*! Module viz-charts, file baseChart.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            charts = viz.charts,
            commonUtils = DX.require("/utils/utils.common"),
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            REINIT_REFRESH_ACTION = "_reinit",
            REINIT_DATA_SOURCE_REFRESH_ACTION = "_updateDataSource",
            DATA_INIT_REFRESH_ACTION = "_dataInit",
            FORCE_RENDER_REFRESH_ACTION = "_forceRender",
            RESIZE_REFRESH_ACTION = "_resize",
            ACTIONS_BY_PRIORITY = [REINIT_REFRESH_ACTION, REINIT_DATA_SOURCE_REFRESH_ACTION, DATA_INIT_REFRESH_ACTION, FORCE_RENDER_REFRESH_ACTION, RESIZE_REFRESH_ACTION],
            vizUtils = viz.utils,
            _noop = $.noop,
            _map = vizUtils.map,
            _each = $.each,
            _extend = $.extend,
            _isArray = commonUtils.isArray,
            _isDefined = commonUtils.isDefined,
            _setCanvasValues = DX.viz.utils.setCanvasValues,
            DEFAULT_OPACITY = 0.3,
            REINIT_REFRESH_ACTION_OPTIONS = ["adaptiveLayout", "crosshair", "equalBarWidth", "minBubbleSize", "maxBubbleSize", "resolveLabelOverlapping", "seriesSelectionMode", "pointSelectionMode", "adjustOnZoom", "synchronizeMultiAxes", "zoomingMode", "scrollingMode", "useAggregation"];
        function checkHeightLabelsInCanvas(points, canvas, isRotated) {
            var commonLabelSize = 0,
                canvasSize = canvas.end - canvas.start,
                label,
                bbox;
            for (var i = 0; i < points.length; i++) {
                label = points[i].getLabel();
                if (label.isVisible()) {
                    bbox = label.getBoundingRect();
                    commonLabelSize += isRotated ? bbox.width : bbox.height
                }
                else
                    points[i] = null
            }
            if (canvasSize > 0)
                while (commonLabelSize > canvasSize)
                    commonLabelSize -= killSmallValues(points, isRotated)
        }
        function killSmallValues(points, isRotated) {
            var smallestValuePoint = {originalValue: Infinity},
                label,
                bbox,
                indexOfPoint;
            _each(points, function(index, point) {
                if (point && smallestValuePoint.originalValue >= point.originalValue) {
                    smallestValuePoint = point;
                    indexOfPoint = index
                }
            });
            if (indexOfPoint !== null) {
                label = points[indexOfPoint].getLabel();
                bbox = label.getBoundingRect();
                label.hide();
                points[indexOfPoint] = null;
                return isRotated ? bbox.width : bbox.height
            }
            return 0
        }
        function resolveLabelOverlappingInOneDirection(points, canvas, isRotated, shiftFunction) {
            var rollingStocks,
                stubCanvas = {
                    start: isRotated ? canvas.left : canvas.top,
                    end: isRotated ? canvas.width - canvas.right : canvas.height - canvas.bottom
                };
            checkHeightLabelsInCanvas(points, stubCanvas, isRotated);
            rollingStocks = _map(points, function(p) {
                return p ? new RollingStock(p, isRotated, shiftFunction) : null
            });
            rollingStocks.sort(function(a, b) {
                return a.getPointPosition() - b.getPointPosition()
            });
            if (!checkStackOverlap(rollingStocks))
                return;
            rollingStocks.reverse();
            moveRollingStock(rollingStocks, stubCanvas)
        }
        function overlapRollingStock(firstRolling, secondRolling) {
            if (!firstRolling || !secondRolling)
                return;
            return firstRolling.getBoundingRect().end > secondRolling.getBoundingRect().start
        }
        function checkStackOverlap(rollingStocks) {
            var i,
                j,
                currentRollingStock,
                nextRollingStock,
                overlap;
            for (i = 0; i < rollingStocks.length; i++) {
                currentRollingStock = rollingStocks[i];
                for (j = i + 1; j < rollingStocks.length; j++) {
                    nextRollingStock = rollingStocks[j];
                    if (overlapRollingStock(currentRollingStock, nextRollingStock)) {
                        currentRollingStock.toChain(nextRollingStock);
                        overlap = true;
                        rollingStocks[j] = null
                    }
                }
            }
            return overlap
        }
        function moveRollingStock(rollingStocks, canvas) {
            var i,
                j,
                currentRollingStock,
                nextRollingStock,
                currentBBox,
                nextBBox;
            for (i = 0; i < rollingStocks.length; i++) {
                currentRollingStock = rollingStocks[i];
                if (rollingStocksIsOut(currentRollingStock, canvas)) {
                    currentBBox = currentRollingStock.getBoundingRect();
                    for (j = i + 1; j < rollingStocks.length; j++) {
                        nextRollingStock = rollingStocks[j];
                        if (!nextRollingStock)
                            continue;
                        nextBBox = nextRollingStock.getBoundingRect();
                        if (nextBBox.end > currentBBox.start - (currentBBox.end - canvas.end)) {
                            nextRollingStock.toChain(currentRollingStock);
                            rollingStocks[i] = currentRollingStock = null;
                            break
                        }
                    }
                }
                currentRollingStock && currentRollingStock.setRollingStockInCanvas(canvas)
            }
        }
        function rollingStocksIsOut(rollingStock, canvas) {
            return rollingStock && rollingStock.getBoundingRect().end > canvas.end
        }
        function RollingStock(point, isRotated, shiftFunction) {
            var label = point.getLabel(),
                bbox = label.getBoundingRect();
            this.labels = [label];
            this.points = [point];
            this.shiftFunction = shiftFunction;
            this._bbox = {
                start: isRotated ? bbox.x : bbox.y,
                width: isRotated ? bbox.width : bbox.height,
                end: isRotated ? bbox.x + bbox.width : bbox.y + bbox.height
            };
            this._pointPositionInitialize = isRotated ? point.getBoundaryCoords().x : point.getBoundaryCoords().y;
            return this
        }
        RollingStock.prototype = {
            toChain: function(nextRollingStock) {
                var nextRollingStockBBox = nextRollingStock.getBoundingRect();
                nextRollingStock.shift(nextRollingStockBBox.start - this._bbox.end);
                this._changeBoxWidth(nextRollingStockBBox.width);
                this.labels = this.labels.concat(nextRollingStock.labels);
                this.points = this.points.concat(nextRollingStock.points)
            },
            getBoundingRect: function() {
                return this._bbox
            },
            shift: function(shiftLength) {
                var shiftFunction = this.shiftFunction;
                _each(this.labels, function(index, label) {
                    var bbox = label.getBoundingRect(),
                        coords = shiftFunction(bbox, shiftLength, label);
                    label.shift(coords.x, coords.y)
                });
                this._bbox.end -= shiftLength;
                this._bbox.start -= shiftLength
            },
            setRollingStockInCanvas: function(canvas) {
                if (this._bbox.end > canvas.end)
                    this.shift(this._bbox.end - canvas.end)
            },
            getPointPosition: function() {
                return this._pointPositionInitialize
            },
            _changeBoxWidth: function(width) {
                this._bbox.end += width;
                this._bbox.width += width
            }
        };
        function getLegendFields(name) {
            return {
                    nameField: name + 'Name',
                    colorField: name + 'Color',
                    indexField: name + 'Index'
                }
        }
        function getLegendSettings(legendDataField) {
            var formatObjectFields = getLegendFields(legendDataField);
            return {
                    getFormatObject: function(data) {
                        var res = {};
                        res[formatObjectFields.indexField] = data.id;
                        res[formatObjectFields.colorField] = data.states.normal.fill;
                        res[formatObjectFields.nameField] = data.text;
                        return res
                    },
                    textField: formatObjectFields.nameField
                }
        }
        function setTemplateFields(data, teamplateData, series) {
            _each(data, function(_, data) {
                _each(series.getTeamplatedFields(), function(_, field) {
                    data[field.teamplateField] = data[field.originalField]
                });
                teamplateData.push(data)
            });
            series.updateTeamplateFieldNames()
        }
        function checkOverlapping(firstRect, secondRect) {
            return (firstRect.x <= secondRect.x && secondRect.x <= firstRect.x + firstRect.width || firstRect.x >= secondRect.x && firstRect.x <= secondRect.x + secondRect.width) && (firstRect.y <= secondRect.y && secondRect.y <= firstRect.y + firstRect.height || firstRect.y >= secondRect.y && firstRect.y <= secondRect.y + secondRect.height)
        }
        charts.overlapping = {resolveLabelOverlappingInOneDirection: resolveLabelOverlappingInOneDirection};
        charts.BaseChart = viz.BaseWidget.inherit({
            _eventsMap: $.extend({}, viz.BaseWidget.prototype._eventsMap, {
                onSeriesClick: {name: "seriesClick"},
                onPointClick: {name: "pointClick"},
                onArgumentAxisClick: {name: "argumentAxisClick"},
                onLegendClick: {name: "legendClick"},
                onSeriesSelectionChanged: {name: 'seriesSelectionChanged'},
                onPointSelectionChanged: {name: 'pointSelectionChanged'},
                onSeriesHoverChanged: {name: 'seriesHoverChanged'},
                onPointHoverChanged: {name: 'pointHoverChanged'},
                onTooltipShown: {name: 'tooltipShown'},
                onTooltipHidden: {name: 'tooltipHidden'},
                onDone: {name: "done"}
            }),
            _rootClassPrefix: "dxc",
            _rootClass: "dxc-chart",
            _init: function() {
                var that = this;
                that.callBase.apply(that, arguments);
                that._reinit(true)
            },
            _createThemeManager: function() {
                var option = this.option(),
                    themeManager = charts.factory.createThemeManager(option, this._chartType);
                themeManager.setTheme(option.theme, option.rtlEnabled);
                return themeManager
            },
            _initCore: function() {
                var that = this;
                that._canvasClipRect = that._renderer.clipRect();
                that._createHtmlStructure();
                that._createLegend();
                that._needHandleRenderComplete = true;
                that.layoutManager = new charts.LayoutManager;
                that._createScrollBar();
                that._$element.on('contextmenu', function(event) {
                    that.eventType = 'contextmenu';
                    if (eventUtils.isTouchEvent(event) || eventUtils.isPointerEvent(event))
                        event.preventDefault()
                }).on('MSHoldVisual', function(event) {
                    that.eventType = 'MSHoldVisual';
                    event.preventDefault()
                })
            },
            _layoutManagerOptions: function() {
                return this._themeManager.getOptions("adaptiveLayout")
            },
            _reinit: function(_skipRender) {
                var that = this;
                _setCanvasValues(that._canvas);
                that._createTracker();
                that._reinitAxes();
                if (!_skipRender)
                    that._initialized = false;
                that._updateDataSource();
                if (!that.series)
                    that._dataSpecificInit(false);
                if (!_skipRender)
                    that._initialized = true;
                that._correctAxes();
                _skipRender || that._forceRender()
            },
            _correctAxes: _noop,
            _createHtmlStructure: function() {
                var that = this,
                    renderer = that._renderer,
                    root = renderer.root;
                that._backgroundRect = renderer.rect().attr({
                    fill: "gray",
                    opacity: 0.0001
                }).append(root);
                that._panesBackgroundGroup = renderer.g().attr({'class': 'dxc-background'}).append(root);
                that._stripsGroup = renderer.g().attr({'class': 'dxc-strips-group'}).linkOn(root, "strips");
                that._gridGroup = renderer.g().attr({'class': 'dxc-grids-group'}).linkOn(root, "grids");
                that._axesGroup = renderer.g().attr({'class': 'dxc-axes-group'}).linkOn(root, "axes");
                that._constantLinesGroup = renderer.g().attr({'class': 'dxc-constant-lines-group'}).linkOn(root, "constant-lines");
                that._labelAxesGroup = renderer.g().attr({'class': 'dxc-strips-labels-group'}).linkOn(root, "strips-labels");
                that._panesBorderGroup = renderer.g().attr({'class': 'dxc-border'}).linkOn(root, "border");
                that._seriesGroup = renderer.g().attr({'class': 'dxc-series-group'}).linkOn(root, "series");
                that._labelsGroup = renderer.g().attr({'class': 'dxc-labels-group'}).linkOn(root, "labels");
                that._crosshairCursorGroup = renderer.g().attr({'class': 'dxc-crosshair-cursor'}).linkOn(root, "crosshair");
                that._legendGroup = renderer.g().attr({
                    'class': 'dxc-legend',
                    clipId: that._getCanvasClipRectID()
                }).linkOn(root, "legend");
                that._scrollBarGroup = renderer.g().attr({'class': 'dxc-scroll-bar'}).linkOn(root, "scroll-bar")
            },
            _disposeObjectsInArray: function(propName, fieldNames) {
                _each(this[propName] || [], function(_, item) {
                    if (fieldNames && item)
                        _each(fieldNames, function(_, field) {
                            item[field] && item[field].dispose()
                        });
                    else
                        item && item.dispose()
                });
                this[propName] = null
            },
            _disposeCore: function() {
                var that = this,
                    disposeObject = function(propName) {
                        if (that[propName]) {
                            that[propName].dispose();
                            that[propName] = null
                        }
                    },
                    unlinkGroup = function(name) {
                        that[name].linkOff()
                    },
                    disposeObjectsInArray = this._disposeObjectsInArray;
                clearTimeout(that._delayedRedraw);
                that._renderer.stopAllAnimations();
                disposeObjectsInArray.call(that, "businessRanges", ["arg", "val"]);
                that.translators = null;
                disposeObjectsInArray.call(that, "series");
                disposeObject("tracker");
                disposeObject("_crosshair");
                that.layoutManager = null;
                that.paneAxis = null;
                that._userOptions = null;
                that._canvas = null;
                unlinkGroup("_stripsGroup");
                unlinkGroup("_gridGroup");
                unlinkGroup("_axesGroup");
                unlinkGroup("_constantLinesGroup");
                unlinkGroup("_labelAxesGroup");
                unlinkGroup("_panesBorderGroup");
                unlinkGroup("_seriesGroup");
                unlinkGroup("_labelsGroup");
                unlinkGroup("_crosshairCursorGroup");
                unlinkGroup("_legendGroup");
                unlinkGroup("_scrollBarGroup");
                disposeObject("_canvasClipRect");
                disposeObject("_panesBackgroundGroup");
                disposeObject("_stripsGroup");
                disposeObject("_gridGroup");
                disposeObject("_axesGroup");
                disposeObject("_constantLinesGroup");
                disposeObject("_labelAxesGroup");
                disposeObject("_panesBorderGroup");
                disposeObject("_seriesGroup");
                disposeObject("_labelsGroup");
                disposeObject("_crosshairCursorGroup");
                disposeObject("_legendGroup");
                disposeObject("_scrollBarGroup")
            },
            _getAnimationOptions: function() {
                return this._themeManager.getOptions("animation")
            },
            _getDefaultSize: function() {
                return {
                        width: 400,
                        height: 400
                    }
            },
            _getOption: function(name) {
                return this._themeManager.getOptions(name)
            },
            _applySize: _noop,
            _resize: function() {
                if (this._updateLockCount)
                    this._processRefreshData(RESIZE_REFRESH_ACTION);
                else
                    this._render(this.__renderOptions || {
                        animate: false,
                        isResize: true,
                        updateTracker: false
                    })
            },
            _createTracker: function() {
                var that = this,
                    themeManager = that._themeManager;
                if (that.tracker)
                    that.tracker.dispose();
                that.tracker = charts.factory.createTracker({
                    seriesSelectionMode: themeManager.getOptions('seriesSelectionMode'),
                    pointSelectionMode: themeManager.getOptions('pointSelectionMode'),
                    seriesGroup: that._seriesGroup,
                    renderer: that._renderer,
                    tooltip: that._tooltip,
                    eventTrigger: that._eventTrigger
                }, that.NAME)
            },
            _getTrackerSettings: function() {
                var that = this;
                return {
                        series: that.series,
                        legend: that.legend,
                        legendCallback: $.proxy(that.legend.getActionCallback, that.legend)
                    }
            },
            _updateTracker: function() {
                this.tracker.update(this._getTrackerSettings())
            },
            _render: function(_options) {
                var that = this,
                    drawOptions,
                    originalCanvas,
                    recreateCanvas;
                if (!that._initialized)
                    return;
                if (that._canvas.width === 0 && that._canvas.height === 0)
                    return;
                that._resetIsReady();
                drawOptions = that._prepareDrawOptions(_options);
                recreateCanvas = drawOptions.recreateCanvas;
                clearTimeout(that._delayedRedraw);
                originalCanvas = that._canvas;
                that._canvas = $.extend({}, that._canvas);
                if (recreateCanvas)
                    that.__currentCanvas = that._canvas;
                else
                    that._canvas = that.__currentCanvas;
                that.DEBUG_canvas = that._canvas;
                recreateCanvas && that._updateCanvasClipRect(that._canvas);
                that._renderer.stopAllAnimations(true);
                _setCanvasValues(that._canvas);
                that._cleanGroups(drawOptions);
                that._renderElements(drawOptions);
                that._canvas = originalCanvas
            },
            _renderElements: function(drawOptions) {
                var that = this,
                    preparedOptions = that._prepareToRender(drawOptions),
                    isRotated = that._isRotated(),
                    isLegendInside = that._isLegendInside(),
                    trackerCanvases = [],
                    layoutTargets = that._getLayoutTargets(),
                    dirtyCanvas = $.extend({}, that._canvas),
                    argBusinessRange,
                    zoomMinArg,
                    drawElements = [],
                    layoutCanvas = drawOptions.drawTitle && drawOptions.drawLegend && drawOptions.adjustAxes,
                    zoomMaxArg;
                !drawOptions.isResize && that._scheduleLoadingIndicatorHiding();
                that.DEBUG_dirtyCanvas = dirtyCanvas;
                if (layoutCanvas)
                    drawElements = that._getDrawElements(drawOptions, isLegendInside);
                that._renderer.lock();
                that.layoutManager.setOptions(that._layoutManagerOptions());
                that.layoutManager.layoutElements(drawElements, that._canvas, that._getAxisDrawingMethods(drawOptions, preparedOptions, isRotated), layoutTargets, isRotated, that._getAxesForTransform(isRotated));
                layoutCanvas && that._updateCanvasClipRect(dirtyCanvas);
                that._applyClipRects(preparedOptions);
                that._appendSeriesGroups();
                that._createCrosshairCursor();
                _each(layoutTargets, function() {
                    var canvas = this.canvas;
                    trackerCanvases.push({
                        left: canvas.left,
                        right: canvas.width - canvas.right,
                        top: canvas.top,
                        bottom: canvas.height - canvas.bottom
                    })
                });
                if (that._scrollBar) {
                    argBusinessRange = that.businessRanges[0].arg;
                    if (argBusinessRange.categories && argBusinessRange.categories.length <= 1)
                        zoomMinArg = zoomMaxArg = undefined;
                    else {
                        zoomMinArg = argBusinessRange.minVisible;
                        zoomMaxArg = argBusinessRange.maxVisible
                    }
                    that._scrollBar.init(argBusinessRange, layoutTargets[0].canvas).setPosition(zoomMinArg, zoomMaxArg)
                }
                drawOptions.updateTracker && that._updateTracker();
                that.tracker.setCanvases({
                    left: 0,
                    right: that._canvas.width,
                    top: 0,
                    bottom: that._canvas.height
                }, trackerCanvases);
                that._updateLegendPosition(drawOptions, isLegendInside);
                that._renderSeries(drawOptions, isRotated, isLegendInside);
                that._renderer.unlock()
            },
            _createCrosshairCursor: _noop,
            _appendSeriesGroups: function() {
                this._seriesGroup.linkAppend();
                this._labelsGroup.linkAppend();
                this._appendAdditionalSeriesGroups()
            },
            _renderSeries: function(drawOptions, isRotated, isLegendInside) {
                var that = this,
                    themeManager = that._themeManager,
                    resolveLabelOverlapping = themeManager.getOptions("resolveLabelOverlapping");
                drawOptions.hideLayoutLabels = that.layoutManager.needMoreSpaceForPanesCanvas(that._getLayoutTargets(), isRotated) && !themeManager.getOptions("adaptiveLayout").keepLabels;
                that._drawSeries(drawOptions, isRotated);
                resolveLabelOverlapping !== "none" && that._resolveLabelOverlapping(resolveLabelOverlapping);
                that._adjustSeries();
                that._renderTrackers(isLegendInside);
                that.tracker.repairTooltip();
                if (that._dataSource.isLoaded())
                    that._fulfillLoadingIndicatorHiding();
                that._drawn();
                that._renderCompleteHandler()
            },
            _drawSeries: function(drawOptions, isRotated) {
                var that = this,
                    i,
                    series = that.series,
                    singleSeries,
                    seriesLength = series.length;
                that._updateSeriesDimensions(drawOptions);
                for (i = 0; i < seriesLength; i++) {
                    singleSeries = series[i];
                    that._applyExtraSettings(singleSeries, drawOptions);
                    singleSeries.draw(that._prepareTranslators(singleSeries, i, isRotated), drawOptions.animate && singleSeries.getPoints().length <= drawOptions.animationPointsLimit && that._renderer.animationEnabled(), drawOptions.hideLayoutLabels, that._getLegendCallBack(singleSeries))
                }
            },
            _resolveLabelOverlapping: function(resolveLabelOverlapping) {
                var func;
                switch (resolveLabelOverlapping) {
                    case"stack":
                        func = this._resolveLabelOverlappingStack;
                        break;
                    case"hide":
                        func = this._resolveLabelOverlappingHide;
                        break;
                    case"shift":
                        func = this._resolveLabelOverlappingShift;
                        break
                }
                $.isFunction(func) && func.call(this)
            },
            _getVisibleSeries: function() {
                return $.grep(this.getAllSeries(), function(series) {
                        return series.isVisible()
                    })
            },
            _resolveLabelOverlappingHide: function() {
                var labels = [],
                    currenctLabel,
                    nextLabel,
                    currenctLabelRect,
                    nextLabelRect,
                    i,
                    j,
                    points,
                    series = this._getVisibleSeries();
                for (i = 0; i < series.length; i++) {
                    points = series[i].getVisiblePoints();
                    for (j = 0; j < points.length; j++)
                        labels.push(points[j].getLabel())
                }
                labels = [].concat.apply([], labels);
                for (i = 0; i < labels.length; i++) {
                    currenctLabel = labels[i];
                    currenctLabelRect = currenctLabel.getBoundingRect();
                    if (!currenctLabel.isVisible())
                        continue;
                    for (j = i + 1; j < labels.length; j++) {
                        nextLabel = labels[j];
                        nextLabelRect = nextLabel.getBoundingRect();
                        if (checkOverlapping(currenctLabelRect, nextLabelRect))
                            nextLabel.hide()
                    }
                }
            },
            _cleanGroups: function(drawOptions) {
                var that = this;
                that._stripsGroup.linkRemove().clear();
                that._gridGroup.linkRemove().clear();
                that._axesGroup.linkRemove().clear();
                that._constantLinesGroup.linkRemove().clear();
                that._labelAxesGroup.linkRemove().clear();
                that._labelsGroup.linkRemove().clear();
                that._crosshairCursorGroup.linkRemove().clear()
            },
            _createLegend: function() {
                var legendSettings = getLegendSettings(this._legendDataField);
                this.legend = viz.CoreFactory.createLegend({
                    renderer: this._renderer,
                    group: this._legendGroup,
                    backgroundClass: 'dxc-border',
                    itemGroupClass: 'dxc-item',
                    textField: legendSettings.textField,
                    getFormatObject: legendSettings.getFormatObject
                })
            },
            _updateLegend: function() {
                var that = this,
                    themeManager = that._themeManager,
                    legendOptions = themeManager.getOptions('legend'),
                    legendData = that._getLegendData();
                legendOptions.containerBackgroundColor = themeManager.getOptions("containerBackgroundColor");
                legendOptions._incidentOccured = that._incidentOccured;
                that.legend.update(legendData, legendOptions)
            },
            _prepareDrawOptions: function(drawOptions) {
                var animationOptions = this._getAnimationOptions(),
                    options;
                options = $.extend({}, {
                    force: false,
                    adjustAxes: true,
                    drawLegend: true,
                    drawTitle: true,
                    animate: animationOptions.enabled,
                    animationPointsLimit: animationOptions.maxPointCountSupported,
                    updateTracker: true
                }, drawOptions, this.__renderOptions);
                if (!_isDefined(options.recreateCanvas))
                    options.recreateCanvas = options.adjustAxes && options.drawLegend && options.drawTitle;
                return options
            },
            _processRefreshData: function(newRefreshAction) {
                var currentRefreshActionPosition = $.inArray(this._currentRefreshData, ACTIONS_BY_PRIORITY),
                    newRefreshActionPosition = $.inArray(newRefreshAction, ACTIONS_BY_PRIORITY);
                if (!this._currentRefreshData || currentRefreshActionPosition >= 0 && newRefreshActionPosition < currentRefreshActionPosition) {
                    this._currentRefreshData = newRefreshAction;
                    this._invalidate()
                }
            },
            _getLegendData: function() {
                return _map(this._getLegendTargets(), function(item) {
                        var legendData = item.legendData,
                            style = item.getLegendStyles,
                            opacity = style.normal.opacity;
                        if (!item.visible) {
                            if (!_isDefined(opacity) || opacity > DEFAULT_OPACITY)
                                opacity = DEFAULT_OPACITY;
                            legendData.textOpacity = DEFAULT_OPACITY
                        }
                        legendData.states = {
                            hover: style.hover,
                            selection: style.selection,
                            normal: _extend({}, style.normal, {opacity: opacity})
                        };
                        return legendData
                    })
            },
            _getLegendOptions: function(item) {
                return {
                        legendData: {
                            text: item[this._legendItemTextField],
                            argument: item.argument,
                            id: item.index
                        },
                        getLegendStyles: item.getLegendStyles(),
                        visible: item.isVisible()
                    }
            },
            _disposeSeries: function() {
                var that = this;
                _each(that.series || [], function(_, series) {
                    series.dispose()
                });
                that.series = null;
                _each(that.seriesFamilies || [], function(_, family) {
                    family.dispose()
                });
                that.seriesFamilies = null;
                that._needHandleRenderComplete = true
            },
            _handleChangedOptions: function(options) {
                var that = this,
                    themeManager = that._themeManager;
                _each(options, function(name) {
                    themeManager.resetOptions(name)
                });
                themeManager.update(that._options);
                that.callBase.apply(that, arguments);
                if ("animation" in options)
                    that._renderer.updateAnimationOptions(that._getAnimationOptions());
                if ("dataSource" in options) {
                    that._needHandleRenderComplete = true;
                    that._processRefreshData(REINIT_DATA_SOURCE_REFRESH_ACTION)
                }
                if ("palette" in options) {
                    themeManager.updatePalette(options.palette);
                    that._refreshSeries(DATA_INIT_REFRESH_ACTION)
                }
                if (options._has(["series", "commonSeriesSettings", "containerBackgroundColor", "dataPrepareSettings"]))
                    that._refreshSeries(DATA_INIT_REFRESH_ACTION);
                if ("legend" in options || "seriesTemplate" in options)
                    that._processRefreshData(DATA_INIT_REFRESH_ACTION);
                if ("title" in options)
                    that._processRefreshData(FORCE_RENDER_REFRESH_ACTION);
                if (options._has(["valueAxis", "argumentAxis", "commonAxisSettings", "panes", "defaultPane"])) {
                    that._refreshSeries(REINIT_REFRESH_ACTION);
                    that.paneAxis = {}
                }
                if ("rotated" in options) {
                    that._createScrollBar();
                    that._refreshSeries(REINIT_REFRESH_ACTION)
                }
                if ("customizePoint" in options || "customizeLabel" in options)
                    that._refreshSeries(REINIT_REFRESH_ACTION);
                if ("scrollBar" in options) {
                    that._createScrollBar();
                    that._processRefreshData(FORCE_RENDER_REFRESH_ACTION)
                }
                if ("tooltip" in options)
                    that._organizeStackPoints();
                if (options._has(REINIT_REFRESH_ACTION_OPTIONS))
                    that._processRefreshData(REINIT_REFRESH_ACTION);
                if ("size" in options || "margin" in options || that._currentRefreshData)
                    that._invalidate()
            },
            _handleThemeOptionsCore: function() {
                var that = this;
                if (that._initialized) {
                    that._scheduleLoadingIndicatorHiding();
                    that.beginUpdate();
                    that._refreshSeries(REINIT_REFRESH_ACTION);
                    that.endUpdate()
                }
            },
            _refreshSeries: function(actionName) {
                this._disposeSeries();
                this._processRefreshData(actionName)
            },
            _refresh: function() {
                var methodName = this._currentRefreshData || FORCE_RENDER_REFRESH_ACTION;
                this._currentRefreshData = null;
                this._renderer.stopAllAnimations(true);
                this[methodName]()
            },
            _updateCanvasClipRect: function(canvas) {
                var that = this,
                    width,
                    height;
                width = Math.max(canvas.width - canvas.left - canvas.right, 0);
                height = Math.max(canvas.height - canvas.top - canvas.bottom, 0);
                that._canvasClipRect.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: width,
                    height: height
                });
                that._backgroundRect.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: width,
                    height: height
                })
            },
            _getCanvasClipRectID: function() {
                return this._canvasClipRect.id
            },
            _dataSourceChangedHandler: function() {
                this._scheduleLoadingIndicatorHiding();
                this._resetZoom();
                this._dataInit()
            },
            _dataInit: function() {
                clearTimeout(this._delayedRedraw);
                this._dataSpecificInit(true)
            },
            _dataSpecificInit: function(needRedraw) {
                var that = this;
                that.series = that.series || that._populateSeries();
                that._repopulateSeries();
                that._seriesPopulatedHandlerCore();
                that._populateBusinessRange();
                that._updateLegend();
                needRedraw && that._forceRender()
            },
            _forceRender: function() {
                this._render({force: true})
            },
            _repopulateSeries: function() {
                var that = this,
                    parsedData,
                    themeManager = that._themeManager,
                    data = that._dataSource.items(),
                    dataValidatorOptions = themeManager.getOptions('dataPrepareSettings'),
                    seriesTemplate = themeManager.getOptions('seriesTemplate');
                if (seriesTemplate) {
                    that._templatedSeries = vizUtils.processSeriesTemplate(seriesTemplate, data);
                    that._populateSeries();
                    delete that._templatedSeries;
                    data = that.teamplateData || data
                }
                that._groupSeries();
                parsedData = viz.validateData(data, that._groupedSeries, that._incidentOccured, dataValidatorOptions);
                themeManager.resetPalette();
                _each(that.series, function(_, singleSeries) {
                    singleSeries.updateData(parsedData);
                    that._processSingleSeries(singleSeries)
                });
                that._organizeStackPoints()
            },
            _organizeStackPoints: function() {
                var that = this,
                    themeManager = that._themeManager,
                    sharedTooltip = themeManager.getOptions("tooltip").shared,
                    stackPoints = {};
                _each(that.series || [], function(_, singleSeries) {
                    that._resetStackPoints(singleSeries);
                    sharedTooltip && that._prepareStackPoints(singleSeries, stackPoints)
                })
            },
            _renderCompleteHandler: function() {
                var that = this,
                    allSeriesInited = true;
                if (that._needHandleRenderComplete) {
                    _each(that.series, function(_, s) {
                        allSeriesInited = allSeriesInited && s.canRenderCompleteHandle()
                    });
                    if (allSeriesInited) {
                        that._needHandleRenderComplete = false;
                        that._eventTrigger("done", {target: that})
                    }
                }
            },
            _getDrawElements: function(drawOptions, legendHasInsidePosition) {
                var that = this,
                    drawElements = [];
                drawOptions.drawTitle && drawElements.push(that._title);
                if (drawOptions.drawLegend && that.legend) {
                    that._legendGroup.linkAppend();
                    !legendHasInsidePosition && drawElements.push(that.legend)
                }
                return drawElements
            },
            _resetZoom: _noop,
            _dataIsReady: function() {
                return this._dataSource.isLoaded()
            },
            _populateSeries: function() {
                var that = this,
                    themeManager = that._themeManager,
                    hasSeriesTemplate = !!themeManager.getOptions("seriesTemplate"),
                    seriesOptions = hasSeriesTemplate ? that._templatedSeries : that.option("series"),
                    allSeriesOptions = _isArray(seriesOptions) ? seriesOptions : seriesOptions ? [seriesOptions] : [],
                    extraOptions = that._getExtraOptions(),
                    particularSeriesOptions,
                    particularSeries,
                    seriesTheme,
                    data,
                    i,
                    seriesVisibilityChanged = function() {
                        that._specialProcessSeries();
                        that._populateBusinessRange();
                        that._renderer.stopAllAnimations(true);
                        that._updateLegend();
                        that._render({
                            force: true,
                            updateTracker: false
                        })
                    };
                that._disposeSeries();
                that.series = [];
                that.teamplateData = [];
                themeManager.resetPalette();
                for (i = 0; i < allSeriesOptions.length; i++) {
                    particularSeriesOptions = _extend(true, {}, allSeriesOptions[i], extraOptions);
                    if (!particularSeriesOptions.name)
                        particularSeriesOptions.name = "Series " + (i + 1).toString();
                    data = particularSeriesOptions.data;
                    particularSeriesOptions.data = null;
                    particularSeriesOptions.rotated = that._isRotated();
                    particularSeriesOptions.customizePoint = themeManager.getOptions("customizePoint");
                    particularSeriesOptions.customizeLabel = themeManager.getOptions("customizeLabel");
                    particularSeriesOptions.visibilityChanged = seriesVisibilityChanged;
                    particularSeriesOptions.incidentOccured = that._incidentOccured;
                    seriesTheme = themeManager.getOptions("series", particularSeriesOptions);
                    if (!that._checkPaneName(seriesTheme))
                        continue;
                    particularSeries = viz.CoreFactory.createSeries({
                        renderer: that._renderer,
                        seriesGroup: that._seriesGroup,
                        labelsGroup: that._labelsGroup
                    }, seriesTheme);
                    if (!particularSeries.isUpdated)
                        that._incidentOccured("E2101", [seriesTheme.type]);
                    else {
                        particularSeries.index = that.series.length;
                        that._processSingleSeries(particularSeries);
                        that.series.push(particularSeries);
                        if (hasSeriesTemplate)
                            setTemplateFields(data, that.teamplateData, particularSeries)
                    }
                }
                return that.series
            },
            getAllSeries: function getAllSeries() {
                return this.series.slice()
            },
            getSeriesByName: function getSeriesByName(name) {
                var found = null;
                _each(this.series, function(i, singleSeries) {
                    if (singleSeries.name === name) {
                        found = singleSeries;
                        return false
                    }
                });
                return found
            },
            getSeriesByPos: function getSeriesByPos(pos) {
                return this.series[pos]
            },
            clearSelection: function clearSelection() {
                this.tracker.clearSelection()
            },
            hideTooltip: function() {
                this.tracker._hideTooltip()
            },
            render: function(renderOptions) {
                var that = this;
                that.__renderOptions = renderOptions;
                that.__forceRender = renderOptions && renderOptions.force;
                that.callBase.apply(that, arguments);
                that.__renderOptions = that.__forceRender = null;
                return that
            },
            getSize: function() {
                var canvas = this._canvas || {};
                return {
                        width: canvas.width,
                        height: canvas.height
                    }
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-charts, file advancedChart.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            charts = viz.charts,
            commonUtils = DX.require("/utils/utils.common"),
            dateUtils = DX.require("/utils/utils.date"),
            DEFAULT_AXIS_NAME = "defaultAxisName",
            _isArray = commonUtils.isArray,
            _isDefined = commonUtils.isDefined,
            _each = $.each,
            _extend = $.extend,
            _map = viz.utils.map,
            MIN = "min",
            MAX = "max";
        function prepareAxis(axisOptions) {
            return _isArray(axisOptions) ? axisOptions.length === 0 ? [{}] : axisOptions : [axisOptions]
        }
        function prepareVisibleArea(visibleArea, axisRange, useAggregation, aggregationRange) {
            visibleArea.minVal = axisRange.min;
            visibleArea.maxVal = axisRange.max;
            if (useAggregation) {
                visibleArea.minArg = visibleArea.minArg === undefined ? aggregationRange.arg.min : visibleArea.minArg;
                visibleArea.maxArg = visibleArea.maxArg === undefined ? aggregationRange.arg.max : visibleArea.maxArg
            }
        }
        charts.AdvancedChart = charts.BaseChart.inherit({
            _dispose: function() {
                var that = this,
                    disposeObjectsInArray = this._disposeObjectsInArray;
                that.callBase();
                that.panes = null;
                if (that.legend) {
                    that.legend.dispose();
                    that.legend = null
                }
                disposeObjectsInArray.call(that, "panesBackground");
                disposeObjectsInArray.call(that, "seriesFamilies");
                that._disposeAxes()
            },
            _reinitAxes: function() {
                this.translators = {};
                this.panes = this._createPanes();
                this._populateAxes()
            },
            _populateAxes: function() {
                var that = this,
                    valueAxes = [],
                    argumentAxes,
                    panes = that.panes,
                    rotated = that._isRotated(),
                    valueAxisOptions = that.option("valueAxis") || {},
                    argumentOption = that.option("argumentAxis") || {},
                    argumentAxesOptions = prepareAxis(argumentOption)[0],
                    valueAxesOptions = prepareAxis(valueAxisOptions),
                    axisNames = [],
                    valueAxesCounter = 0,
                    paneWithNonVirtualAxis,
                    crosshairOptions = that._getCrosshairOptions() || {},
                    crosshairEnabled = crosshairOptions.enabled,
                    horCrosshairEnabled = crosshairEnabled && crosshairOptions.horizontalLine.visible,
                    verCrosshairEnabled = crosshairEnabled && crosshairOptions.verticalLine.visible;
                function getNextAxisName() {
                    return DEFAULT_AXIS_NAME + valueAxesCounter++
                }
                that._disposeAxes();
                if (rotated)
                    paneWithNonVirtualAxis = argumentAxesOptions.position === "right" ? panes[panes.length - 1].name : panes[0].name;
                else
                    paneWithNonVirtualAxis = argumentAxesOptions.position === "top" ? panes[0].name : panes[panes.length - 1].name;
                argumentAxes = _map(panes, function(pane, index) {
                    return that._createAxis("argumentAxis", argumentAxesOptions, {
                            pane: pane.name,
                            crosshairEnabled: rotated ? horCrosshairEnabled : verCrosshairEnabled
                        }, rotated, pane.name !== paneWithNonVirtualAxis, index)
                });
                _each(valueAxesOptions, function(priority, axisOptions) {
                    var axisPanes = [],
                        name = axisOptions.name;
                    if (name && $.inArray(name, axisNames) !== -1) {
                        that._incidentOccured("E2102");
                        return
                    }
                    name && axisNames.push(name);
                    if (axisOptions.pane)
                        axisPanes.push(axisOptions.pane);
                    if (axisOptions.panes && axisOptions.panes.length)
                        axisPanes = axisPanes.concat(axisOptions.panes.slice(0));
                    axisPanes = viz.utils.unique(axisPanes);
                    if (!axisPanes.length)
                        axisPanes.push(undefined);
                    _each(axisPanes, function(_, pane) {
                        valueAxes.push(that._createAxis("valueAxis", axisOptions, {
                            name: name || getNextAxisName(),
                            pane: pane,
                            priority: priority,
                            crosshairEnabled: rotated ? verCrosshairEnabled : horCrosshairEnabled
                        }, rotated))
                    })
                });
                that._valueAxes = valueAxes;
                that._argumentAxes = argumentAxes
            },
            _prepareStackPoints: function(singleSeries, stackPoints) {
                var points = singleSeries.getPoints(),
                    stackName = singleSeries.getStackName();
                _each(points, function(_, point) {
                    var argument = point.argument;
                    if (!stackPoints[argument]) {
                        stackPoints[argument] = {};
                        stackPoints[argument][null] = []
                    }
                    if (stackName && !_isArray(stackPoints[argument][stackName])) {
                        stackPoints[argument][stackName] = [];
                        _each(stackPoints[argument][null], function(_, point) {
                            if (!point.stackName)
                                stackPoints[argument][stackName].push(point)
                        })
                    }
                    if (stackName) {
                        stackPoints[argument][stackName].push(point);
                        stackPoints[argument][null].push(point)
                    }
                    else
                        _each(stackPoints[argument], function(_, stack) {
                            stack.push(point)
                        });
                    point.stackPoints = stackPoints[argument][stackName];
                    point.stackName = stackName
                })
            },
            _resetStackPoints: function(singleSeries) {
                _each(singleSeries.getPoints(), function(_, point) {
                    point.stackPoints = null;
                    point.stackName = null
                })
            },
            _disposeAxes: function() {
                var that = this,
                    disposeObjectsInArray = that._disposeObjectsInArray;
                disposeObjectsInArray.call(that, "_argumentAxes");
                disposeObjectsInArray.call(that, "_valueAxes")
            },
            _drawAxes: function(panesBorderOptions, drawOptions, adjustUnits) {
                var that = this,
                    drawAxes = function(axes) {
                        _each(axes, function(_, axis) {
                            axis.draw(adjustUnits)
                        })
                    },
                    drawStaticAxisElements = function(axes) {
                        _each(axes, function(_i, axis) {
                            axis.drawGrids(panesBorderOptions[axis.pane])
                        })
                    };
                that._reinitTranslators();
                that._prepareAxesAndDraw(drawAxes, drawStaticAxisElements, drawOptions)
            },
            _appendAdditionalSeriesGroups: function() {
                this._crosshairCursorGroup.linkAppend();
                this._scrollBar && this._scrollBarGroup.linkAppend()
            },
            _getLegendTargets: function() {
                var that = this;
                return _map(that.series, function(item) {
                        if (item.getOptions().showInLegend)
                            return that._getLegendOptions(item);
                        return null
                    })
            },
            _legendItemTextField: "name",
            _seriesPopulatedHandlerCore: function() {
                this._processSeriesFamilies();
                this._processValueAxisFormat()
            },
            _renderTrackers: function() {
                var that = this,
                    i;
                for (i = 0; i < that.series.length; ++i)
                    that.series[i].drawTrackers()
            },
            _specialProcessSeries: function() {
                this._processSeriesFamilies()
            },
            _processSeriesFamilies: function() {
                var that = this,
                    types = [],
                    families = [],
                    paneSeries,
                    themeManager = that._themeManager,
                    familyOptions = {
                        equalBarWidth: themeManager.getOptions("equalBarWidth"),
                        minBubbleSize: themeManager.getOptions("minBubbleSize"),
                        maxBubbleSize: themeManager.getOptions("maxBubbleSize"),
                        barWidth: themeManager.getOptions("barWidth")
                    };
                if (that.seriesFamilies && that.seriesFamilies.length) {
                    _each(that.seriesFamilies, function(_, family) {
                        family.updateOptions(familyOptions);
                        family.adjustSeriesValues()
                    });
                    return
                }
                _each(that.series, function(_, item) {
                    if ($.inArray(item.type, types) === -1)
                        types.push(item.type)
                });
                _each(that._getLayoutTargets(), function(_, pane) {
                    paneSeries = that._getSeriesForPane(pane.name);
                    _each(types, function(_, type) {
                        var family = viz.CoreFactory.createSeriesFamily({
                                type: type,
                                pane: pane.name,
                                equalBarWidth: familyOptions.equalBarWidth,
                                minBubbleSize: familyOptions.minBubbleSize,
                                maxBubbleSize: familyOptions.maxBubbleSize,
                                barWidth: familyOptions.barWidth,
                                rotated: that._isRotated()
                            });
                        family.add(paneSeries);
                        family.adjustSeriesValues();
                        families.push(family)
                    })
                });
                that.seriesFamilies = families
            },
            _updateSeriesDimensions: function() {
                var that = this,
                    i,
                    seriesFamilies = that.seriesFamilies || [];
                for (i = 0; i < seriesFamilies.length; i++) {
                    var family = seriesFamilies[i],
                        translators = that._getTranslator(family.pane) || {};
                    family.updateSeriesValues(translators);
                    family.adjustSeriesDimensions(translators)
                }
            },
            _getLegendCallBack: function(series) {
                return this.legend && this.legend.getActionCallback(series)
            },
            _appendAxesGroups: function() {
                var that = this;
                that._stripsGroup.linkAppend();
                that._gridGroup.linkAppend();
                that._axesGroup.linkAppend();
                that._constantLinesGroup.linkAppend();
                that._labelAxesGroup.linkAppend()
            },
            _populateBusinessRange: function(visibleArea) {
                var that = this,
                    businessRanges = [],
                    themeManager = that._themeManager,
                    rotated = that._isRotated(),
                    useAggregation = themeManager.getOptions("useAggregation"),
                    argAxes = that._argumentAxes,
                    lastArgAxis = argAxes[argAxes.length - 1],
                    calcInterval = lastArgAxis.calcInterval,
                    argRange = new viz.Range({rotated: !!rotated}),
                    argBusinessRange;
                that._disposeObjectsInArray("businessRanges", ["arg", "val"]);
                _each(argAxes, function(_, axis) {
                    argRange.addRange(axis.getRangeData())
                });
                _each(that._groupedSeries, function(_, group) {
                    var groupRange = new viz.Range({
                            rotated: !!rotated,
                            isValueRange: true,
                            pane: group.valueAxis.pane,
                            axis: group.valueAxis.name
                        }),
                        groupAxisRange = group.valueAxis.getRangeData();
                    groupRange.addRange(groupAxisRange);
                    _each(group, function(_, series) {
                        visibleArea && prepareVisibleArea(visibleArea, groupAxisRange, useAggregation, series.getRangeData());
                        var seriesRange = series.getRangeData(visibleArea, calcInterval);
                        groupRange.addRange(seriesRange.val);
                        argRange.addRange(seriesRange.arg)
                    });
                    if (!groupRange.isDefined())
                        groupRange.setStubData(group.valueAxis.getOptions().valueType === "datetime" ? "datetime" : undefined);
                    if (group.valueAxis.getOptions().showZero)
                        groupRange.correctValueZeroLevel();
                    groupRange.checkZeroStick();
                    businessRanges.push({
                        val: groupRange,
                        arg: argRange
                    })
                });
                if (!argRange.isDefined())
                    argRange.setStubData(argAxes[0].getOptions().argumentType);
                if (visibleArea && visibleArea.notApplyMargins && argRange.axisType !== "discrete") {
                    argBusinessRange = argAxes[0].getTranslator().getBusinessRange();
                    argRange.addRange({
                        min: argBusinessRange.min,
                        max: argBusinessRange.max,
                        stick: true
                    })
                }
                that._correctBusinessRange(argRange, lastArgAxis);
                that.businessRanges = businessRanges
            },
            _correctBusinessRange: function(range, lastArgAxis) {
                var setTicksAtUnitBeginning = lastArgAxis.getOptions().setTicksAtUnitBeginning,
                    tickIntervalRange = {},
                    tickInterval = lastArgAxis.getOptions().tickInterval,
                    originInterval = tickInterval;
                tickInterval = $.isNumeric(tickInterval) ? tickInterval : dateUtils.dateToMilliseconds(tickInterval);
                if (tickInterval && _isDefined(range[MIN]) && _isDefined(range[MAX]) && tickInterval >= Math.abs(range[MAX] - range[MIN])) {
                    if (commonUtils.isDate(range[MIN])) {
                        if (!$.isNumeric(originInterval)) {
                            tickIntervalRange[MIN] = dateUtils.addInterval(range[MIN], originInterval, true);
                            tickIntervalRange[MAX] = dateUtils.addInterval(range[MAX], originInterval, false)
                        }
                        else {
                            tickIntervalRange[MIN] = new Date(range[MIN].valueOf() - tickInterval);
                            tickIntervalRange[MAX] = new Date(range[MAX].valueOf() + tickInterval)
                        }
                        if (setTicksAtUnitBeginning) {
                            dateUtils.correctDateWithUnitBeginning(tickIntervalRange[MAX], originInterval);
                            dateUtils.correctDateWithUnitBeginning(tickIntervalRange[MIN], originInterval)
                        }
                    }
                    else {
                        tickIntervalRange[MIN] = range[MIN] - tickInterval;
                        tickIntervalRange[MAX] = range[MAX] + tickInterval
                    }
                    range.addRange(tickIntervalRange)
                }
            },
            _getArgumentAxes: function() {
                return this._argumentAxes
            },
            _getValueAxes: function() {
                return this._valueAxes
            },
            _processValueAxisFormat: function() {
                var that = this,
                    valueAxes = that._valueAxes,
                    axesWithFullStackedFormat = [];
                _each(that.series, function() {
                    if (this.isFullStackedSeries() && $.inArray(this.axis, axesWithFullStackedFormat) === -1)
                        axesWithFullStackedFormat.push(this.axis)
                });
                _each(valueAxes, function() {
                    if ($.inArray(this.name, axesWithFullStackedFormat) !== -1)
                        this.setPercentLabelFormat();
                    else
                        this.resetAutoLabelFormat()
                })
            },
            _createAxis: function(typeSelector, userOptions, axisOptions, rotated, virtual, index) {
                var that = this,
                    renderingSettings = _extend({
                        renderer: that._renderer,
                        incidentOccured: that._incidentOccured,
                        axisClass: typeSelector === "argumentAxis" ? "arg" : "val",
                        widgetClass: "dxc",
                        stripsGroup: that._stripsGroup,
                        labelAxesGroup: that._labelAxesGroup,
                        constantLinesGroup: that._constantLinesGroup,
                        axesContainerGroup: that._axesGroup,
                        gridGroup: that._gridGroup
                    }, that._getAxisRenderingOptions(typeSelector)),
                    axis,
                    preparedUserOptions = that._prepareStripsAndConstantLines(typeSelector, userOptions, rotated),
                    options = _extend(true, {}, preparedUserOptions, axisOptions, that._prepareAxisOptions(typeSelector, preparedUserOptions, rotated));
                if (virtual) {
                    options.visible = options.tick.visible = options.minorTick.visible = options.label.visible = false;
                    options.title = {}
                }
                axis = new viz.axes.Axis(renderingSettings);
                axis.updateOptions(options);
                if (!virtual && _isDefined(index))
                    that._displayedArgumentAxisIndex = index;
                return axis
            },
            _getTrackerSettings: function() {
                return _extend(this.callBase(), {argumentAxis: this._argumentAxes[this._displayedArgumentAxisIndex]})
            },
            _prepareStripsAndConstantLines: function(typeSelector, userOptions, rotated) {
                userOptions = this._themeManager.getOptions(typeSelector, userOptions, rotated);
                if (userOptions.strips)
                    _each(userOptions.strips, function(i) {
                        userOptions.strips[i] = _extend(true, {}, userOptions.stripStyle, userOptions.strips[i])
                    });
                if (userOptions.constantLines)
                    _each(userOptions.constantLines, function(i, line) {
                        userOptions.constantLines[i] = _extend(true, {}, userOptions.constantLineStyle, line)
                    });
                return userOptions
            },
            _legendDataField: "series",
            _adjustSeries: $.noop
        })
    })(jQuery, DevExpress);
    /*! Module viz-charts, file chart.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            charts = viz.charts,
            commonUtils = DX.require("/utils/utils.common"),
            registerComponent = DX.require("/componentRegistrator"),
            vizUtils = DX.viz.utils,
            MAX_ADJUSTMENT_ATTEMPTS = 5,
            DEFAULT_PANE_NAME = "default",
            DEFAULT_PANES = [{
                    name: DEFAULT_PANE_NAME,
                    border: {}
                }],
            _map = viz.utils.map,
            _each = $.each,
            _extend = $.extend,
            _isArray = commonUtils.isArray,
            _isDefined = commonUtils.isDefined;
        function getFirstAxisNameForPane(axes, paneName) {
            var result;
            for (var i = 0; i < axes.length; i++)
                if (axes[i].pane === paneName) {
                    result = axes[i].name;
                    break
                }
            if (!result)
                result = axes[0].name;
            return result
        }
        function hideGridsOnNonFirstValueAxisForPane(valAxes, paneName, synchronizeMultiAxes) {
            var axesForPane = [],
                firstShownAxis;
            _each(valAxes, function(_, axis) {
                if (axis.pane === paneName)
                    axesForPane.push(axis)
            });
            if (axesForPane.length > 1 && synchronizeMultiAxes)
                _each(axesForPane, function(_, axis) {
                    var gridOpt = axis.getOptions().grid,
                        minorGridOpt = axis.getOptions().minorGrid;
                    if (firstShownAxis && gridOpt && gridOpt.visible) {
                        gridOpt.visible = false;
                        minorGridOpt && (minorGridOpt.visible = false)
                    }
                    else
                        firstShownAxis = firstShownAxis ? firstShownAxis : gridOpt && gridOpt.visible
                })
        }
        function getPaneForAxis(paneAxis, axisNameWithoutPane) {
            var result;
            _each(paneAxis, function(paneName, pane) {
                _each(pane, function(axisName) {
                    if (axisNameWithoutPane === axisName) {
                        result = paneName;
                        return false
                    }
                })
            });
            return result
        }
        function findAxisOptions(valueAxes, valueAxesOptions, axisName) {
            var result,
                axInd;
            for (axInd = 0; axInd < valueAxesOptions.length; axInd++)
                if (valueAxesOptions[axInd].name === axisName) {
                    result = valueAxesOptions[axInd];
                    result.priority = axInd;
                    break
                }
            if (!result)
                for (axInd = 0; axInd < valueAxes.length; axInd++)
                    if (valueAxes[axInd].name === axisName) {
                        result = valueAxes[axInd].getOptions();
                        result.priority = valueAxes[axInd].priority;
                        break
                    }
            return result
        }
        function findAxis(paneName, axisName, axes) {
            var axis,
                i;
            for (i = 0; i < axes.length; i++) {
                axis = axes[i];
                if (axis.name === axisName && axis.pane === paneName)
                    return axis
            }
        }
        function prepareSegmentRectPoints(left, top, width, height, borderOptions) {
            var maxSW = ~~((width < height ? width : height) / 2),
                sw = borderOptions.width || 0,
                newSW = sw < maxSW ? sw : maxSW;
            left = left + newSW / 2;
            top = top + newSW / 2;
            width = width - newSW;
            height = height - newSW;
            var right = left + width,
                bottom = top + height,
                points = [],
                segments = [],
                segmentSequence,
                visiblyOpt = 0,
                prevSegmentVisibility = 0;
            var allSegment = {
                    top: [[left, top], [right, top]],
                    right: [[right, top], [right, bottom]],
                    bottom: [[right, bottom], [left, bottom]],
                    left: [[left, bottom], [left, top]]
                };
            _each(allSegment, function(seg) {
                var visibility = !!borderOptions[seg];
                visiblyOpt = visiblyOpt * 2 + ~~visibility
            });
            switch (visiblyOpt) {
                case 13:
                case 9:
                    segmentSequence = ['left', 'top', 'right', 'bottom'];
                    break;
                case 11:
                    segmentSequence = ['bottom', 'left', 'top', 'right'];
                    break;
                default:
                    segmentSequence = ['top', 'right', 'bottom', 'left']
            }
            _each(segmentSequence, function(_, seg) {
                var segmentVisibility = !!borderOptions[seg];
                if (!prevSegmentVisibility && segments.length) {
                    points.push(segments);
                    segments = []
                }
                if (segmentVisibility)
                    _each(allSegment[seg].slice(prevSegmentVisibility), function(_, segment) {
                        segments = segments.concat(segment)
                    });
                prevSegmentVisibility = ~~segmentVisibility
            });
            segments.length && points.push(segments);
            points.length === 1 && (points = points[0]);
            return {
                    points: points,
                    pathType: visiblyOpt === 15 ? "area" : "line"
                }
        }
        function applyClipSettings(clipRects, settings) {
            _each(clipRects || [], function(_, c) {
                c && c.attr(settings)
            })
        }
        function reinitTranslators(translators) {
            _each(translators, function(_, axisTrans) {
                _each(axisTrans, function(_, translator) {
                    translator.arg.reinit();
                    translator.val.reinit()
                })
            })
        }
        function compareAxes(a, b) {
            return a.priority - b.priority
        }
        charts._test_prepareSegmentRectPoints = function() {
            var original = prepareSegmentRectPoints.original || prepareSegmentRectPoints;
            if (arguments[0])
                prepareSegmentRectPoints = arguments[0];
            prepareSegmentRectPoints.original = original;
            prepareSegmentRectPoints.restore = function() {
                prepareSegmentRectPoints = original
            };
            return prepareSegmentRectPoints
        };
        registerComponent("dxChart", viz.charts, charts.AdvancedChart.inherit({
            _chartType: "chart",
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {defaultPane: DEFAULT_PANE_NAME})
            },
            _initCore: function() {
                this.paneAxis = {};
                this._panesClipRects = {};
                this.callBase()
            },
            _disposeCore: function() {
                var that = this,
                    disposeObjectsInArray = this._disposeObjectsInArray,
                    panesClipRects = that._panesClipRects;
                that.callBase();
                disposeObjectsInArray.call(panesClipRects, "fixed");
                disposeObjectsInArray.call(panesClipRects, "base");
                disposeObjectsInArray.call(panesClipRects, "wide");
                that._panesClipRects = null
            },
            _correctAxes: function() {
                this._correctValueAxes()
            },
            _getExtraOptions: $.noop,
            _processSingleSeries: $.noop,
            _groupSeries: function() {
                var that = this,
                    panes = that.panes,
                    valAxes = that._valueAxes,
                    paneList = _map(panes, function(pane) {
                        return pane.name
                    }),
                    series = that.series,
                    paneAxis = that.paneAxis,
                    synchronizeMultiAxes = that._themeManager.getOptions("synchronizeMultiAxes"),
                    groupedSeries = that._groupedSeries = [];
                _each(series, function(i, particularSeries) {
                    particularSeries.axis = particularSeries.axis || getFirstAxisNameForPane(valAxes, particularSeries.pane);
                    if (particularSeries.axis) {
                        paneAxis[particularSeries.pane] = paneAxis[particularSeries.pane] || {};
                        paneAxis[particularSeries.pane][particularSeries.axis] = true
                    }
                });
                _each(valAxes, function(_, axis) {
                    if (axis.name && axis.pane && $.inArray(axis.pane, paneList) !== -1) {
                        paneAxis[axis.pane] = paneAxis[axis.pane] || {};
                        paneAxis[axis.pane][axis.name] = true
                    }
                });
                that._correctValueAxes();
                _each(paneAxis, function(paneName, pane) {
                    hideGridsOnNonFirstValueAxisForPane(valAxes, paneName, synchronizeMultiAxes);
                    _each(pane, function(axisName) {
                        var group = [];
                        _each(series, function(_, particularSeries) {
                            if (particularSeries.pane === paneName && particularSeries.axis === axisName)
                                group.push(particularSeries)
                        });
                        groupedSeries.push(group);
                        group.valueAxis = findAxis(paneName, axisName, valAxes);
                        group.valueOptions = group.valueAxis.getOptions()
                    })
                });
                groupedSeries.argumentAxes = that._argumentAxes;
                groupedSeries.argumentOptions = groupedSeries.argumentAxes[0].getOptions()
            },
            _cleanPanesClipRects: function(clipArrayName) {
                var that = this,
                    clipArray = that._panesClipRects[clipArrayName];
                _each(clipArray || [], function(_, clipRect) {
                    clipRect && clipRect.dispose()
                });
                that._panesClipRects[clipArrayName] = []
            },
            _createPanes: function() {
                var that = this,
                    panes = that.option("panes"),
                    panesNameCounter = 0,
                    bottomPaneName;
                if (panes && _isArray(panes) && !panes.length || $.isEmptyObject(panes))
                    panes = DEFAULT_PANES;
                that._cleanPanesClipRects("fixed");
                that._cleanPanesClipRects("base");
                that._cleanPanesClipRects("wide");
                that.defaultPane = that.option("defaultPane");
                panes = _extend(true, [], _isArray(panes) ? panes : panes ? [panes] : []);
                _each(panes, function(_, pane) {
                    pane.name = !_isDefined(pane.name) ? DEFAULT_PANE_NAME + panesNameCounter++ : pane.name
                });
                if (!that._doesPaneExists(panes, that.defaultPane) && panes.length > 0) {
                    bottomPaneName = panes[panes.length - 1].name;
                    that._incidentOccured("W2101", [that.defaultPane, bottomPaneName]);
                    that.defaultPane = bottomPaneName
                }
                panes = that._isRotated() ? panes.reverse() : panes;
                return panes
            },
            _doesPaneExists: function(panes, paneName) {
                var found = false;
                _each(panes, function(_, pane) {
                    if (pane.name === paneName) {
                        found = true;
                        return false
                    }
                });
                return found
            },
            _getAxisRenderingOptions: function() {
                return {
                        axisType: "xyAxes",
                        drawingType: "linear"
                    }
            },
            _prepareAxisOptions: function(typeSelector, userOptions, rotated) {
                return {isHorizontal: typeSelector === "argumentAxis" !== rotated}
            },
            _checkPaneName: function(seriesTheme) {
                var paneList = _map(this.panes, function(pane) {
                        return pane.name
                    });
                seriesTheme.pane = seriesTheme.pane || this.defaultPane;
                return $.inArray(seriesTheme.pane, paneList) !== -1
            },
            _correctValueAxes: function() {
                var that = this,
                    rotated = that._isRotated(),
                    valueAxisOptions = that.option("valueAxis") || {},
                    valueAxesOptions = _isArray(valueAxisOptions) ? valueAxisOptions : [valueAxisOptions],
                    valueAxes = that._valueAxes || [],
                    defaultAxisName = valueAxes[0].name,
                    paneAxis = that.paneAxis,
                    neededAxis = {};
                _each(valueAxes, function(_, axis) {
                    var pane;
                    if (!axis.pane) {
                        pane = getPaneForAxis(paneAxis, axis.name);
                        if (!pane) {
                            pane = that.defaultPane;
                            (paneAxis[pane] = paneAxis[pane] || {})[axis.name] = true
                        }
                        axis.setPane(pane)
                    }
                });
                _each(that.panes, function(_, pane) {
                    var name = pane.name;
                    if (!paneAxis[name]) {
                        paneAxis[name] = {};
                        paneAxis[name][defaultAxisName] = true
                    }
                });
                _each(paneAxis, function(paneName, axisNames) {
                    _each(axisNames, function(axisName) {
                        var axisOptions;
                        neededAxis[axisName + "-" + paneName] = true;
                        if (!findAxis(paneName, axisName, valueAxes)) {
                            axisOptions = findAxisOptions(valueAxes, valueAxesOptions, axisName);
                            if (!axisOptions) {
                                that._incidentOccured("W2102", [axisName]);
                                axisOptions = {
                                    name: axisName,
                                    priority: valueAxes.length
                                }
                            }
                            valueAxes.push(that._createAxis("valueAxis", axisOptions, {
                                pane: paneName,
                                name: axisName
                            }, rotated))
                        }
                    })
                });
                that._valueAxes = $.grep(valueAxes, function(elem) {
                    return !!neededAxis[elem.name + "-" + elem.pane]
                }).sort(compareAxes)
            },
            _getSeriesForPane: function(paneName) {
                var paneSeries = [];
                _each(this.series, function(_, oneSeries) {
                    if (oneSeries.pane === paneName)
                        paneSeries.push(oneSeries)
                });
                return paneSeries
            },
            _createTranslator: function(range, canvas, options) {
                return viz.CoreFactory.createTranslator2D(range, canvas, options)
            },
            _createPanesBorderOptions: function() {
                var commonBorderOptions = this._themeManager.getOptions("commonPaneSettings").border,
                    panesBorderOptions = {};
                _each(this.panes, function(_, pane) {
                    panesBorderOptions[pane.name] = _extend(true, {}, commonBorderOptions, pane.border)
                });
                return panesBorderOptions
            },
            _createScrollBar: function() {
                var that = this,
                    scrollBarOptions = that._themeManager.getOptions("scrollBar") || {},
                    scrollBarGroup = that._scrollBarGroup;
                if (scrollBarOptions.visible) {
                    scrollBarOptions.rotated = that._isRotated();
                    that._scrollBar = (that._scrollBar || charts.factory.createScrollBar(that._renderer, scrollBarGroup)).update(scrollBarOptions)
                }
                else {
                    scrollBarGroup.linkRemove();
                    that._scrollBar && that._scrollBar.dispose();
                    that._scrollBar = null
                }
            },
            _prepareToRender: function(drawOptions) {
                var that = this,
                    panesBorderOptions = that._createPanesBorderOptions();
                that._createPanesBackground();
                that._appendAxesGroups();
                that._transformed && that._resetTransform();
                that._createTranslators(drawOptions);
                that._options.useAggregation && _each(that.series, function(_, series) {
                    series.resamplePoints(that._getTranslator(series.pane, series.axis).arg, that._zoomMinArg, that._zoomMaxArg)
                });
                if (that._options.useAggregation || _isDefined(that._zoomMinArg) || _isDefined(that._zoomMaxArg)) {
                    that._populateBusinessRange({
                        adjustOnZoom: that._themeManager.getOptions("adjustOnZoom"),
                        minArg: that._zoomMinArg,
                        maxArg: that._zoomMaxArg,
                        notApplyMargins: that._notApplyMargins
                    });
                    that._updateTranslators()
                }
                return panesBorderOptions
            },
            _isLegendInside: function() {
                return this.legend && this.legend.getPosition() === "inside"
            },
            _renderAxes: function(drawOptions, panesBorderOptions, rotated, adjustUnits) {
                if (drawOptions && drawOptions.recreateCanvas)
                    vizUtils.updatePanesCanvases(this.panes, this._canvas, rotated);
                this._drawAxes(panesBorderOptions, drawOptions, adjustUnits)
            },
            _isRotated: function() {
                return this._themeManager.getOptions("rotated")
            },
            _getLayoutTargets: function() {
                return this.panes
            },
            _applyClipRects: function(panesBorderOptions) {
                var that = this,
                    canvasClipRectID = that._getCanvasClipRectID(),
                    i;
                that._drawPanesBorders(panesBorderOptions);
                that._createClipRectsForPanes();
                for (i = 0; i < that._argumentAxes.length; i++)
                    that._argumentAxes[i].applyClipRects(that._getElementsClipRectID(that._argumentAxes[i].pane), canvasClipRectID);
                for (i = 0; i < that._valueAxes.length; i++)
                    that._valueAxes[i].applyClipRects(that._getElementsClipRectID(that._valueAxes[i].pane), canvasClipRectID);
                that._fillPanesBackground()
            },
            _updateLegendPosition: function(drawOptions, legendHasInsidePosition) {
                var that = this;
                if (drawOptions.drawLegend && that.legend && legendHasInsidePosition) {
                    var panes = that.panes,
                        newCanvas = _extend({}, panes[0].canvas),
                        layoutManager = new charts.LayoutManager;
                    newCanvas.right = panes[panes.length - 1].canvas.right;
                    newCanvas.bottom = panes[panes.length - 1].canvas.bottom;
                    layoutManager.setOptions({
                        width: 0,
                        height: 0
                    });
                    layoutManager.layoutElements([that.legend], newCanvas, $.noop, [{canvas: newCanvas}])
                }
            },
            _prepareTranslators: function(series, _, rotated) {
                var tr = this._getTranslator(series.pane, series.axis),
                    translators = {};
                translators[rotated ? "x" : "y"] = tr.val;
                translators[rotated ? "y" : "x"] = tr.arg;
                return translators
            },
            _applyExtraSettings: function(series, drawOptions) {
                var that = this,
                    paneIndex = that._getPaneIndex(series.pane),
                    panesClipRects = that._panesClipRects,
                    wideClipRect = panesClipRects.wide[paneIndex];
                series.setClippingParams(panesClipRects.base[paneIndex].id, wideClipRect && wideClipRect.id, that._getPaneBorderVisibility(paneIndex))
            },
            _createTranslators: function(drawOptions) {
                var that = this,
                    rotated = that._isRotated(),
                    translators;
                if (!drawOptions.recreateCanvas)
                    return;
                that.translators = translators = {};
                vizUtils.updatePanesCanvases(that.panes, that._canvas, rotated);
                _each(that.paneAxis, function(paneName, pane) {
                    translators[paneName] = translators[paneName] || {};
                    _each(pane, function(axisName) {
                        var translator = that._createTranslator(new viz.Range(that._getBusinessRange(paneName, axisName).val), that._getCanvasForPane(paneName), {isHorizontal: !!rotated});
                        translator.pane = paneName;
                        translator.axis = axisName;
                        translators[paneName][axisName] = {val: translator}
                    })
                });
                _each(that._argumentAxes, function(_, axis) {
                    var translator = that._createTranslator(new viz.Range(that._getBusinessRange(axis.pane).arg), that._getCanvasForPane(axis.pane), {isHorizontal: !rotated});
                    _each(translators[axis.pane], function(valAxis, paneAxisTran) {
                        paneAxisTran.arg = translator
                    })
                })
            },
            _updateTranslators: function() {
                var that = this;
                _each(that.translators, function(pane, axisTrans) {
                    _each(axisTrans, function(axis, translator) {
                        translator.arg.updateBusinessRange(new viz.Range(that._getBusinessRange(pane).arg));
                        delete translator.arg._originalBusinessRange;
                        translator.val.updateBusinessRange(new viz.Range(that._getBusinessRange(pane, axis).val));
                        delete translator.val._originalBusinessRange
                    })
                })
            },
            _getAxesForTransform: function(rotated) {
                return {
                        verticalAxes: !rotated ? this._getValueAxes() : this._getArgumentAxes(),
                        horizontalAxes: !rotated ? this._getArgumentAxes() : this._getValueAxes()
                    }
            },
            _getAxisDrawingMethods: function(drawOptions, preparedOptions, isRotated) {
                var that = this;
                return function(adjustUnits) {
                        that._renderAxes(drawOptions, preparedOptions, isRotated, adjustUnits)
                    }
            },
            _reinitTranslators: function() {
                var that = this;
                _each(that._argumentAxes, function(_, axis) {
                    var translator = that._getTranslator(axis.pane);
                    if (translator) {
                        translator.arg.reinit();
                        axis.setTranslator(translator.arg, translator.val)
                    }
                });
                _each(that._valueAxes, function(_, axis) {
                    var translator = that._getTranslator(axis.pane, axis.name);
                    if (translator) {
                        translator.val.reinit();
                        axis.setTranslator(translator.val, translator.arg)
                    }
                })
            },
            _prepareAxesAndDraw: function(drawAxes, drawStaticAxisElements, drawOptions) {
                var that = this,
                    i = 0,
                    layoutManager = that.layoutManager,
                    rotated = that._isRotated(),
                    adjustmentCounter = 0,
                    synchronizeMultiAxes = that._themeManager.getOptions('synchronizeMultiAxes'),
                    layoutTargets = that._getLayoutTargets(),
                    verticalAxes = rotated ? that._argumentAxes : that._valueAxes,
                    horizontalAxes = rotated ? that._valueAxes : that._argumentAxes,
                    hElements = horizontalAxes,
                    vElements = verticalAxes;
                if (that._scrollBar) {
                    that._scrollBar.setPane(layoutTargets);
                    if (rotated)
                        vElements = [that._scrollBar].concat(vElements);
                    else
                        hElements = hElements.concat([that._scrollBar])
                }
                do {
                    for (i = 0; i < that._argumentAxes.length; i++)
                        that._argumentAxes[i].resetTicks();
                    for (i = 0; i < that._valueAxes.length; i++)
                        that._valueAxes[i].resetTicks();
                    if (synchronizeMultiAxes)
                        charts.multiAxesSynchronizer.synchronize(that._valueAxes);
                    drawAxes(horizontalAxes);
                    layoutManager.requireAxesRedraw = false;
                    if (drawOptions.adjustAxes) {
                        layoutManager.applyHorizontalAxesLayout(hElements, layoutTargets, rotated);
                        !layoutManager.stopDrawAxes && reinitTranslators(that.translators)
                    }
                    drawAxes(verticalAxes);
                    if (drawOptions.adjustAxes && !layoutManager.stopDrawAxes) {
                        layoutManager.applyVerticalAxesLayout(vElements, layoutTargets, rotated);
                        !layoutManager.stopDrawAxes && reinitTranslators(that.translators)
                    }
                    adjustmentCounter = adjustmentCounter + 1
                } while (!layoutManager.stopDrawAxes && layoutManager.requireAxesRedraw && adjustmentCounter < MAX_ADJUSTMENT_ATTEMPTS);
                drawStaticAxisElements(verticalAxes);
                drawStaticAxisElements(horizontalAxes);
                that._scrollBar && that._scrollBar.applyLayout();
                that.__axisAdjustmentsCount = adjustmentCounter
            },
            _getPanesParameters: function() {
                var that = this,
                    panes = that.panes,
                    i,
                    params = [];
                for (i = 0; i < panes.length; i++)
                    if (that._getPaneBorderVisibility(i))
                        params.push({
                            coords: panes[i].borderCoords,
                            clipRect: that._panesClipRects.fixed[i]
                        });
                return params
            },
            _createCrosshairCursor: function() {
                var that = this,
                    options = that._themeManager.getOptions("crosshair") || {},
                    index = that._displayedArgumentAxisIndex,
                    axes = !that._isRotated() ? [[that._argumentAxes[index]], that._valueAxes] : [that._valueAxes, [that._argumentAxes[index]]],
                    parameters = {
                        canvas: that._getCommonCanvas(),
                        panes: that._getPanesParameters(),
                        axes: axes
                    };
                if (!options || !options.enabled)
                    return;
                if (!that._crosshair)
                    that._crosshair = charts.factory.createCrosshair(that._renderer, options, parameters, that._crosshairCursorGroup);
                else
                    that._crosshair.update(options, parameters);
                that._crosshair.render()
            },
            _getCommonCanvas: function() {
                var i,
                    canvas,
                    commonCanvas,
                    panes = this.panes;
                for (i = 0; i < panes.length; i++) {
                    canvas = panes[i].canvas;
                    if (!commonCanvas)
                        commonCanvas = _extend({}, canvas);
                    else {
                        commonCanvas.right = canvas.right;
                        commonCanvas.bottom = canvas.bottom
                    }
                }
                return commonCanvas
            },
            _createPanesBackground: function() {
                var that = this,
                    defaultBackgroundColor = that._themeManager.getOptions("commonPaneSettings").backgroundColor,
                    backgroundColor,
                    renderer = that._renderer,
                    rect,
                    i,
                    rects = [];
                that._panesBackgroundGroup.clear();
                for (i = 0; i < that.panes.length; i++) {
                    backgroundColor = that.panes[i].backgroundColor || defaultBackgroundColor;
                    if (!backgroundColor || backgroundColor === "none") {
                        rects.push(null);
                        continue
                    }
                    rect = renderer.rect(0, 0, 0, 0).attr({
                        fill: backgroundColor,
                        "stroke-width": 0
                    }).append(that._panesBackgroundGroup);
                    rects.push(rect)
                }
                that.panesBackground = rects
            },
            _fillPanesBackground: function() {
                var that = this,
                    bc;
                _each(that.panes, function(i, pane) {
                    bc = pane.borderCoords;
                    if (that.panesBackground[i] !== null)
                        that.panesBackground[i].attr({
                            x: bc.left,
                            y: bc.top,
                            width: bc.width,
                            height: bc.height
                        })
                })
            },
            _calcPaneBorderCoords: function(pane) {
                var canvas = pane.canvas,
                    bc = pane.borderCoords = pane.borderCoords || {};
                bc.left = canvas.left;
                bc.top = canvas.top;
                bc.right = canvas.width - canvas.right;
                bc.bottom = canvas.height - canvas.bottom;
                bc.width = Math.max(bc.right - bc.left, 0);
                bc.height = Math.max(bc.bottom - bc.top, 0)
            },
            _drawPanesBorders: function(panesBorderOptions) {
                var that = this,
                    rotated = that._isRotated();
                that._panesBorderGroup.linkRemove().clear();
                _each(that.panes, function(i, pane) {
                    var bc,
                        borderOptions = panesBorderOptions[pane.name],
                        segmentRectParams,
                        attr = {
                            fill: "none",
                            stroke: borderOptions.color,
                            "stroke-opacity": borderOptions.opacity,
                            "stroke-width": borderOptions.width,
                            dashStyle: borderOptions.dashStyle,
                            "stroke-linecap": "square"
                        };
                    that._calcPaneBorderCoords(pane, rotated);
                    if (!borderOptions.visible)
                        return;
                    bc = pane.borderCoords;
                    segmentRectParams = prepareSegmentRectPoints(bc.left, bc.top, bc.width, bc.height, borderOptions);
                    that._renderer.path(segmentRectParams.points, segmentRectParams.pathType).attr(attr).append(that._panesBorderGroup)
                });
                that._panesBorderGroup.linkAppend()
            },
            _createClipRect: function(clipArray, index, left, top, width, height) {
                var that = this,
                    clipRect = clipArray[index];
                if (!clipRect) {
                    clipRect = that._renderer.clipRect(left, top, width, height);
                    clipArray[index] = clipRect
                }
                else
                    clipRect.attr({
                        x: left,
                        y: top,
                        width: width,
                        height: height
                    })
            },
            _createClipRectsForPanes: function() {
                var that = this,
                    canvas = that._canvas;
                _each(that.panes, function(i, pane) {
                    var needWideClipRect = false,
                        bc = pane.borderCoords,
                        left = bc.left,
                        top = bc.top,
                        width = bc.width,
                        height = bc.height,
                        panesClipRects = that._panesClipRects;
                    that._createClipRect(panesClipRects.fixed, i, left, top, width, height);
                    that._createClipRect(panesClipRects.base, i, left, top, width, height);
                    _each(that.series, function(_, series) {
                        if (series.pane === pane.name && (series.isFinancialSeries() || series.areErrorBarsVisible()))
                            needWideClipRect = true
                    });
                    if (needWideClipRect) {
                        if (that._isRotated()) {
                            top = 0;
                            height = canvas.height
                        }
                        else {
                            left = 0;
                            width = canvas.width
                        }
                        that._createClipRect(panesClipRects.wide, i, left, top, width, height)
                    }
                    else
                        panesClipRects.wide.push(null)
                })
            },
            _getPaneIndex: function(paneName) {
                var paneIndex;
                _each(this.panes, function(index, pane) {
                    if (pane.name === paneName) {
                        paneIndex = index;
                        return false
                    }
                });
                return paneIndex
            },
            _getPaneBorderVisibility: function(paneIndex) {
                var commonPaneBorderVisible = this._themeManager.getOptions("commonPaneSettings").border.visible,
                    pane = this.panes[paneIndex] || {},
                    paneBorder = pane.border || {};
                return "visible" in paneBorder ? paneBorder.visible : commonPaneBorderVisible
            },
            _getElementsClipRectID: function(paneName) {
                return this._panesClipRects.fixed[this._getPaneIndex(paneName)].id
            },
            _getTranslator: function(paneName, axisName) {
                var paneTrans = this.translators[paneName],
                    foundTranslator = null;
                if (!paneTrans)
                    return foundTranslator;
                foundTranslator = paneTrans[axisName];
                if (!foundTranslator)
                    _each(paneTrans, function(axis, trans) {
                        foundTranslator = trans;
                        return false
                    });
                return foundTranslator
            },
            _getCanvasForPane: function(paneName) {
                var panes = this.panes,
                    panesNumber = panes.length,
                    i;
                for (i = 0; i < panesNumber; i++)
                    if (panes[i].name === paneName)
                        return panes[i].canvas
            },
            _getBusinessRange: function(paneName, axisName) {
                var ranges = this.businessRanges || [],
                    rangesNumber = ranges.length,
                    foundRange,
                    i;
                for (i = 0; i < rangesNumber; i++)
                    if (ranges[i].val.pane === paneName && ranges[i].val.axis === axisName) {
                        foundRange = ranges[i];
                        break
                    }
                if (!foundRange)
                    for (i = 0; i < rangesNumber; i++)
                        if (ranges[i].val.pane === paneName) {
                            foundRange = ranges[i];
                            break
                        }
                return foundRange
            },
            _transformArgument: function(translate, scale) {
                var that = this,
                    rotated = that._isRotated(),
                    settings,
                    clipSettings,
                    panesClipRects = that._panesClipRects;
                if (!that._transformed) {
                    that._transformed = true;
                    that._labelsGroup.remove();
                    that._resetIsReady();
                    _each(that.series || [], function(i, s) {
                        s.applyClip()
                    })
                }
                if (rotated) {
                    settings = {
                        translateY: translate,
                        scaleY: scale
                    };
                    clipSettings = {
                        translateY: -translate / scale,
                        scaleY: 1 / scale
                    }
                }
                else {
                    settings = {
                        translateX: translate,
                        scaleX: scale
                    };
                    clipSettings = {
                        translateX: -translate / scale,
                        scaleX: 1 / scale
                    }
                }
                applyClipSettings(panesClipRects.base, clipSettings);
                applyClipSettings(panesClipRects.wide, clipSettings);
                that._seriesGroup.attr(settings);
                that._scrollBar && that._scrollBar.transform(-translate, scale)
            },
            _resetTransform: function() {
                var that = this,
                    settings = {
                        translateX: 0,
                        translateY: 0,
                        scaleX: null,
                        scaleY: null
                    },
                    panesClipRects = that._panesClipRects;
                applyClipSettings(panesClipRects.base, settings);
                applyClipSettings(panesClipRects.wide, settings);
                that._seriesGroup.attr(settings);
                _each(that.series || [], function(i, s) {
                    s.resetClip()
                });
                that._transformed = false
            },
            _getTrackerSettings: function() {
                var that = this,
                    themeManager = that._themeManager;
                return _extend(this.callBase(), {
                        chart: that,
                        zoomingMode: themeManager.getOptions("zoomingMode"),
                        scrollingMode: themeManager.getOptions("scrollingMode"),
                        rotated: that._isRotated(),
                        crosshair: that._crosshair
                    })
            },
            _resolveLabelOverlappingStack: function() {
                var that = this,
                    isRotated = that._isRotated(),
                    shiftDirection = isRotated ? function(box, length) {
                        return {
                                x: box.x - length,
                                y: box.y
                            }
                    } : function(box, length) {
                        return {
                                x: box.x,
                                y: box.y - length
                            }
                    };
                _each(that.seriesFamilies, function(_, family) {
                    _each(family.getStackPoints(), function(_, stacks) {
                        _each(stacks, function(_, points) {
                            charts.overlapping.resolveLabelOverlappingInOneDirection(points, that._getCommonCanvas(), isRotated, shiftDirection)
                        })
                    })
                })
            },
            _getCrosshairOptions: function() {
                return this._getOption("crosshair")
            },
            zoomArgument: function(min, max, gesturesUsed) {
                var that = this,
                    zoomArg;
                if (!_isDefined(min) && !_isDefined(max))
                    return;
                zoomArg = that._argumentAxes[0].zoom(min, max, gesturesUsed);
                that._zoomMinArg = zoomArg.min;
                that._zoomMaxArg = zoomArg.max;
                that._notApplyMargins = gesturesUsed;
                that._render({
                    force: true,
                    drawTitle: false,
                    drawLegend: false,
                    adjustAxes: false,
                    animate: false,
                    updateTracker: false
                })
            },
            _resetZoom: function() {
                var that = this;
                that._zoomMinArg = that._zoomMaxArg = undefined;
                that._argumentAxes[0] && that._argumentAxes[0].resetZoom()
            },
            getVisibleArgumentBounds: function() {
                var range = this._argumentAxes[0].getTranslator().getBusinessRange(),
                    isDiscrete = range.axisType === "discrete",
                    categories = range.categories;
                return {
                        minVisible: isDiscrete ? range.minVisible || categories[0] : range.minVisible,
                        maxVisible: isDiscrete ? range.maxVisible || categories[categories.length - 1] : range.maxVisible
                    }
            }
        }))
    })(jQuery, DevExpress);
    /*! Module viz-charts, file pieChart.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            charts = viz.charts,
            mathUtils = DX.require("/utils/utils.math"),
            commonUtils = DX.require("/utils/utils.common"),
            registerComponent = DX.require("/componentRegistrator"),
            seriesSpacing = viz.series.helpers.consts.pieSeriesSpacing,
            REINIT_REFRESH_ACTION = "_reinit",
            DATA_INIT_REFRESH_ACTION = "_dataInit",
            OPTIONS_FOR_REFRESH_SERIES = ["startAngle", "innerRadius", "segmentsDirection", "type"],
            _extend = $.extend,
            _each = $.each,
            _noop = $.noop,
            _getVerticallyShiftedAngularCoords = viz.utils.getVerticallyShiftedAngularCoords;
        registerComponent("dxPieChart", viz.charts, charts.BaseChart.inherit({
            _setDeprecatedOptions: function() {
                this.callBase.apply(this, arguments);
                _extend(this._deprecatedOptions, {
                    "series.innerRadius": {
                        since: "15.2",
                        message: "Use the 'innerRadius' option instead"
                    },
                    "series.startAngle": {
                        since: "15.2",
                        message: "Use the 'startAngle' option instead"
                    },
                    "series.segmentsDirection": {
                        since: "15.2",
                        message: "Use the 'segmentsDirection' option instead"
                    },
                    "series.type": {
                        since: "15.2",
                        message: "Use the 'type' option instead"
                    }
                })
            },
            _chartType: 'pie',
            _layoutManagerOptions: function() {
                var diameter = this._themeManager.getOptions('diameter');
                if (commonUtils.isNumber(diameter)) {
                    if (diameter > 1)
                        diameter = 1;
                    else if (diameter < 0)
                        diameter = 0
                }
                else
                    diameter = undefined;
                return _extend(true, {}, this.callBase(), {piePercentage: diameter})
            },
            _handleChangedOptions: function(options) {
                this.callBase.apply(this, arguments);
                if ("diameter" in options)
                    this._processRefreshData(REINIT_REFRESH_ACTION);
                if (options._has(OPTIONS_FOR_REFRESH_SERIES))
                    this._refreshSeries(DATA_INIT_REFRESH_ACTION)
            },
            _groupSeries: function() {
                this.series.valueOptions = {valueType: "numeric"};
                this._groupedSeries = [this.series];
                this._groupedSeries.argumentOptions = this.series[0] && this.series[0].getOptions()
            },
            _populateBusinessRange: function() {
                var businessRanges = [],
                    series = this.series,
                    singleSeriesRange;
                this._disposeObjectsInArray("businessRanges");
                _each(series, function(_, singleSeries) {
                    var range = new viz.Range;
                    singleSeriesRange = singleSeries.getRangeData();
                    range.addRange(singleSeriesRange.val);
                    if (!range.isDefined())
                        range.setStubData();
                    businessRanges.push(range)
                });
                this.businessRanges = businessRanges
            },
            _specialProcessSeries: function() {
                _each(this.series, function(_, singleSeries) {
                    singleSeries.arrangePoints()
                })
            },
            _createTranslator: function(range) {
                return viz.CoreFactory.createTranslator1D(range.min, range.max, 360, 0)
            },
            _checkPaneName: function() {
                return true
            },
            _processSingleSeries: function(singleSeries) {
                singleSeries.arrangePoints()
            },
            _getLegendTargets: function() {
                var that = this,
                    points = [],
                    args = {},
                    itemIndex,
                    index = 0;
                _each(that.series, function(_, singleSeries) {
                    var arrayArguments = {},
                        count;
                    _each(singleSeries.getPoints(), function(_, point) {
                        var argument = point.argument;
                        arrayArguments[argument] = ++arrayArguments[argument] || 0;
                        count = arrayArguments[argument];
                        itemIndex = args[argument + count];
                        if (itemIndex === undefined) {
                            point.index = args[argument + count] = index;
                            points.push(that._getLegendOptions(point));
                            index++
                        }
                        else {
                            point.index = itemIndex;
                            if (!points[itemIndex].visible)
                                points[itemIndex].visible = point.isVisible()
                        }
                    })
                });
                return points
            },
            _getAxisDrawingMethods: _noop,
            _getLayoutTargets: function() {
                return [{canvas: this._canvas}]
            },
            _getAxesForTransform: function() {
                return {
                        verticalAxes: [],
                        horizontalAxes: []
                    }
            },
            _getLayoutSeries: function(series, drawOptions) {
                var that = this,
                    layout,
                    canvas = that._canvas,
                    drawnLabels = false;
                layout = that.layoutManager.applyPieChartSeriesLayout(canvas, series, true);
                _each(series, function(i, singleSeries) {
                    singleSeries.correctPosition(layout);
                    drawnLabels = singleSeries.drawLabelsWOPoints(that._createTranslator(that.businessRanges[i])) || drawnLabels
                });
                if (drawnLabels)
                    layout = that.layoutManager.applyPieChartSeriesLayout(canvas, series, drawOptions.hideLayoutLabels);
                return layout
            },
            _updateSeriesDimensions: function(drawOptions) {
                var that = this,
                    visibleSeries = that._getVisibleSeries(),
                    lengthVisibleSeries = visibleSeries.length,
                    innerRad,
                    delta,
                    layout;
                if (lengthVisibleSeries) {
                    layout = that._getLayoutSeries(visibleSeries, drawOptions);
                    delta = (layout.radiusOuter - layout.radiusInner - seriesSpacing * (lengthVisibleSeries - 1)) / lengthVisibleSeries;
                    innerRad = layout.radiusInner;
                    that._setCenter({
                        x: layout.centerX,
                        y: layout.centerY
                    });
                    _each(visibleSeries, function(_, singleSeries) {
                        singleSeries.correctRadius({
                            radiusInner: innerRad,
                            radiusOuter: innerRad + delta
                        });
                        innerRad += delta + seriesSpacing
                    })
                }
            },
            _prepareTranslators: function(_, i) {
                return this._createTranslator(this.businessRanges[i])
            },
            _getLegendCallBack: function() {
                var legend = this.legend;
                return function(point) {
                        return legend.getActionCallback(point)
                    }
            },
            _adjustSeries: function() {
                _each(this.series, function(_, singleSeries) {
                    singleSeries.adjustLabels()
                })
            },
            _prepareStackPoints: _noop,
            _resetStackPoints: _noop,
            _applyExtraSettings: _noop,
            _resolveLabelOverlappingShift: function() {
                var that = this,
                    series = that.series,
                    center = that._center;
                _each(series, function(_, singleSeries) {
                    if (singleSeries.getOptions().label.position === "inside")
                        return;
                    var points = singleSeries.getVisiblePoints(),
                        lPoints = [],
                        rPoints = [];
                    $.each(points, function(_, point) {
                        var angle = mathUtils.normalizeAngle(point.middleAngle);
                        (angle <= 90 || angle >= 270 ? rPoints : lPoints).push(point)
                    });
                    charts.overlapping.resolveLabelOverlappingInOneDirection(lPoints, that._canvas, false, shiftFunction);
                    charts.overlapping.resolveLabelOverlappingInOneDirection(rPoints, that._canvas, false, shiftFunction)
                });
                function shiftFunction(box, length) {
                    return _getVerticallyShiftedAngularCoords(box, -length, center)
                }
            },
            _setCenter: function(center) {
                this._center = center
            },
            getSeries: function() {
                DX.require("/errors").log("W0002", "dxPieChart", "getSeries", "15.2", "Use the 'getAllSeries' method instead");
                return this.series[0]
            },
            _legendDataField: 'point',
            _legendItemTextField: "argument",
            _updateLegendPosition: _noop,
            _renderTrackers: _noop,
            _createScrollBar: _noop,
            _updateAxesLayout: _noop,
            _applyClipRects: _noop,
            _appendAdditionalSeriesGroups: _noop,
            _prepareToRender: _noop,
            _isLegendInside: _noop,
            _renderAxes: _noop,
            _isRotated: _noop,
            _seriesPopulatedHandlerCore: _noop,
            _reinitAxes: _noop,
            _correctAxes: _noop,
            _getExtraOptions: function() {
                var that = this;
                return {
                        startAngle: that.option("startAngle"),
                        innerRadius: that.option("innerRadius"),
                        segmentsDirection: that.option("segmentsDirection"),
                        type: that.option("type")
                    }
            }
        }))
    })(jQuery, DevExpress);
    /*! Module viz-charts, file polarChart.js */
    (function($, DX, undefined) {
        var charts = DX.viz.charts,
            registerComponent = DX.require("/componentRegistrator"),
            mathUtils = DX.require("/utils/utils.math"),
            viz = DX.viz,
            _noop = $.noop,
            DEFAULT_PANE_NAME = 'default';
        var PolarChart = charts.AdvancedChart.inherit({
                _chartType: 'polar',
                _createPanes: function() {
                    return [{name: DEFAULT_PANE_NAME}]
                },
                _checkPaneName: function() {
                    return true
                },
                _getAxisRenderingOptions: function(typeSelector) {
                    var isArgumentAxis = typeSelector === "argumentAxis",
                        type = isArgumentAxis ? "circular" : "linear",
                        useSpiderWeb = this.option("useSpiderWeb");
                    if (useSpiderWeb)
                        type += "Spider";
                    return {
                            axisType: "polarAxes",
                            drawingType: type
                        }
                },
                _prepareAxisOptions: function(typeSelector, axisOptions) {
                    var isArgumentAxis = typeSelector === "argumentAxis";
                    return {
                            type: this.option("useSpiderWeb") && isArgumentAxis ? "discrete" : axisOptions.type,
                            isHorizontal: true,
                            showCustomBoundaryTicks: isArgumentAxis
                        }
                },
                _getExtraOptions: function() {
                    return {spiderWidget: this.option("useSpiderWeb")}
                },
                _groupSeries: function() {
                    this._groupedSeries = [this.series];
                    this._groupedSeries[0].valueAxis = this._valueAxes[0];
                    this._groupedSeries[0].valueOptions = this._valueAxes[0].getOptions();
                    this._groupedSeries.argumentAxes = this._argumentAxes;
                    this._groupedSeries.argumentOptions = this._argumentAxes[0].getOptions()
                },
                _prepareToRender: function() {
                    this._appendAxesGroups();
                    return {}
                },
                _renderAxes: function(drawOptions, _, __, adjustUnits) {
                    this._drawAxes({}, drawOptions, adjustUnits)
                },
                _getAxisDrawingMethods: function(drawOptions, preparedOptions, isRotated, adjustUnits) {
                    var that = this;
                    return function() {
                            that._renderAxes(drawOptions, preparedOptions, isRotated, adjustUnits)
                        }
                },
                _reinitTranslators: function() {
                    var that = this,
                        valueAxes = that._valueAxes,
                        argumentAxes = that._argumentAxes,
                        translator = that._createTranslator({
                            arg: new viz.Range(that.businessRanges[0].arg),
                            val: new viz.Range(that.businessRanges[0].val)
                        }),
                        argTranslator = translator.getComponent("arg"),
                        valTranslator = translator.getComponent("val"),
                        i = 0;
                    that.translator = translator;
                    argumentAxes[0].setTranslator(argTranslator, valTranslator);
                    for (i; i < valueAxes.length; i++)
                        valueAxes[i].setTranslator(valTranslator, argTranslator)
                },
                _prepareAxesAndDraw: function(drawAxes, drawStaticAxisElements) {
                    var that = this,
                        valueAxes = that._valueAxes,
                        argAxes = that._argumentAxes,
                        argumentAxis = argAxes[0];
                    that._calcCanvas(argumentAxis.measureLabels(true));
                    that.translator.reinit();
                    drawAxes(argAxes);
                    $.each(valueAxes, function(_, valAxis) {
                        valAxis.setSpiderTicks(argumentAxis.getSpiderTicks())
                    });
                    drawAxes(valueAxes);
                    drawStaticAxisElements(argAxes);
                    drawStaticAxisElements(valueAxes)
                },
                _calcCanvas: function(measure) {
                    var canvas = this.translator.canvas;
                    canvas.left += measure.width;
                    canvas.right += measure.width;
                    canvas.top += measure.height;
                    canvas.bottom += measure.height
                },
                _getLayoutTargets: function() {
                    return [{canvas: this._canvas}]
                },
                _getAxesForTransform: function() {
                    var argAxes = this._getArgumentAxes();
                    return {
                            verticalAxes: argAxes,
                            horizontalAxes: argAxes
                        }
                },
                _getTranslator: function() {
                    var translator = this.translator;
                    return {
                            val: translator,
                            arg: translator
                        }
                },
                _prepareTranslators: function() {
                    return this.translator
                },
                _createTranslator: function(br) {
                    var themeManager = this._themeManager,
                        axisUserOptions = this.option("argumentAxis"),
                        axisOptions = themeManager.getOptions("argumentAxis", axisUserOptions) || {},
                        startAngle = isFinite(axisOptions.startAngle) ? mathUtils.normalizeAngle(axisOptions.startAngle) : 0;
                    return new viz.PolarTranslator(br, $.extend(true, {}, this._canvas), {
                            startAngle: startAngle,
                            endAngle: startAngle + 360
                        })
                },
                _getSeriesForPane: function() {
                    return this.series
                },
                _applyExtraSettings: _noop,
                _updateLegendPosition: _noop,
                _createScrollBar: _noop,
                _applyClipRects: _noop,
                _isRotated: _noop,
                _getCrosshairOptions: _noop,
                _isLegendInside: _noop,
                _processSingleSeries: _noop
            });
        registerComponent('dxPolarChart', charts, PolarChart)
    })(jQuery, DevExpress);
    /*! Module viz-charts, file layoutManager.js */
    (function($, DX, undefined) {
        var commonUtils = DX.require("/utils/utils.common"),
            _isNumber = commonUtils.isNumber,
            _min = Math.min,
            _max = Math.max,
            _floor = Math.floor,
            _sqrt = Math.sqrt,
            _each = $.each,
            _extend = $.extend,
            consts = DX.viz.series.helpers.consts,
            pieLabelIndent = consts.pieLabelIndent,
            pieLabelSpacing = consts.pieLabelSpacing;
        function updateAxis(axes, side, needRemoveSpace) {
            if (axes && needRemoveSpace[side] > 0) {
                _each(axes, function(i, axis) {
                    var bbox = axis.getBoundingRect();
                    axis.updateSize();
                    needRemoveSpace[side] -= bbox[side] - axis.getBoundingRect()[side]
                });
                if (needRemoveSpace[side] > 0)
                    _each(axes, function(_, axis) {
                        axis.updateSize(true)
                    })
            }
        }
        function getNearestCoord(firstCoord, secondCoord, pointCenterCoord) {
            var nearestCoord;
            if (pointCenterCoord < firstCoord)
                nearestCoord = firstCoord;
            else if (secondCoord < pointCenterCoord)
                nearestCoord = secondCoord;
            else
                nearestCoord = pointCenterCoord;
            return nearestCoord
        }
        function getLabelLayout(point) {
            if (point._label.isVisible() && point._label.getLayoutOptions().position !== "inside")
                return point._label.getBoundingRect()
        }
        function getPieRadius(series, paneCenterX, paneCenterY, accessibleRadius, minR) {
            var radiusIsFound = false;
            _each(series, function(_, singleSeries) {
                if (radiusIsFound)
                    return false;
                _each(singleSeries.getVisiblePoints(), function(_, point) {
                    var labelBBox = getLabelLayout(point);
                    if (labelBBox) {
                        var xCoords = getNearestCoord(labelBBox.x, labelBBox.x + labelBBox.width, paneCenterX),
                            yCoords = getNearestCoord(labelBBox.y, labelBBox.y + labelBBox.height, paneCenterY);
                        accessibleRadius = _min(_max(getLengthFromCenter(xCoords, yCoords, paneCenterX, paneCenterY) - pieLabelIndent, minR), accessibleRadius);
                        radiusIsFound = true
                    }
                })
            });
            return accessibleRadius
        }
        function getSizeLabels(series) {
            var sizes = [],
                commonWidth = 0;
            _each(series, function(_, singleSeries) {
                var maxWidth = 0;
                _each(singleSeries.getVisiblePoints(), function(_, point) {
                    var labelBBox = getLabelLayout(point);
                    if (labelBBox)
                        maxWidth = _max(labelBBox.width + pieLabelSpacing, maxWidth)
                });
                sizes.push(maxWidth);
                commonWidth += maxWidth
            });
            return {
                    sizes: sizes,
                    common: commonWidth
                }
        }
        function correctLabelRadius(sizes, radius, series, canvas, averageWidthLabels) {
            var curRadius,
                i,
                centerX = (canvas.width - canvas.left - canvas.right) / 2;
            for (i = 0; i < series.length; i++) {
                if (sizes[i] === 0) {
                    curRadius && (curRadius += sizes[i - 1]);
                    continue
                }
                curRadius = _floor(curRadius ? curRadius + sizes[i - 1] : radius);
                series[i].correctLabelRadius(curRadius);
                if (averageWidthLabels && i !== series.length - 1) {
                    sizes[i] = averageWidthLabels;
                    series[i].setVisibleArea({
                        left: centerX - radius - averageWidthLabels * (i + 1),
                        right: canvas.width - (centerX + radius + averageWidthLabels * (i + 1)),
                        top: canvas.top,
                        bottom: canvas.bottom,
                        width: canvas.width,
                        height: canvas.height
                    })
                }
            }
        }
        function getLengthFromCenter(x, y, paneCenterX, paneCenterY) {
            return _sqrt((x - paneCenterX) * (x - paneCenterX) + (y - paneCenterY) * (y - paneCenterY))
        }
        function getInnerRadius(series) {
            var innerRadius;
            if (series.type === "pie")
                innerRadius = 0;
            else {
                innerRadius = _isNumber(series.innerRadius) ? Number(series.innerRadius) : 0.5;
                innerRadius = innerRadius < 0.2 ? 0.2 : innerRadius;
                innerRadius = innerRadius > 0.8 ? 0.8 : innerRadius
            }
            return innerRadius
        }
        function isValidBox(box) {
            return !!(box.x || box.y || box.width || box.height)
        }
        function correctDeltaMarginValue(panes, marginSides) {
            var canvas,
                deltaSide,
                requireAxesRedraw = false;
            _each(panes, function(_, pane) {
                canvas = pane.canvas;
                _each(marginSides, function(_, side) {
                    deltaSide = "delta" + side;
                    canvas[deltaSide] = _max(canvas[deltaSide] - (canvas[side.toLowerCase()] - canvas["original" + side]), 0);
                    if (canvas[deltaSide] > 0)
                        requireAxesRedraw = true
                })
            });
            return requireAxesRedraw
        }
        function getPane(name, panes) {
            var findPane = panes[0];
            _each(panes, function(_, pane) {
                if (name === pane.name)
                    findPane = pane
            });
            return findPane
        }
        function applyFoundExceedings(panes, rotated) {
            var stopDrawAxes = false,
                maxLeft = 0,
                maxRight = 0,
                maxTop = 0,
                maxBottom = 0;
            _each(panes, function(_, pane) {
                maxLeft = _max(maxLeft, pane.canvas.deltaLeft);
                maxRight = _max(maxRight, pane.canvas.deltaRight);
                maxTop = _max(maxTop, pane.canvas.deltaTop);
                maxBottom = _max(maxBottom, pane.canvas.deltaBottom)
            });
            if (rotated)
                _each(panes, function(_, pane) {
                    pane.canvas.top += maxTop;
                    pane.canvas.bottom += maxBottom;
                    pane.canvas.right += pane.canvas.deltaRight;
                    pane.canvas.left += pane.canvas.deltaLeft
                });
            else
                _each(panes, function(_, pane) {
                    pane.canvas.top += pane.canvas.deltaTop;
                    pane.canvas.bottom += pane.canvas.deltaBottom;
                    pane.canvas.right += maxRight;
                    pane.canvas.left += maxLeft
                });
            _each(panes, function(_, pane) {
                if (pane.canvas.top + pane.canvas.bottom > pane.canvas.height)
                    stopDrawAxes = true;
                if (pane.canvas.left + pane.canvas.right > pane.canvas.width)
                    stopDrawAxes = true
            });
            return stopDrawAxes
        }
        var inverseAlign = {
                left: "right",
                right: "left",
                top: "bottom",
                bottom: "top",
                center: "center"
            };
        function downSize(canvas, layoutOptions) {
            canvas[layoutOptions.cutLayoutSide] += layoutOptions.cutSide === "horizontal" ? layoutOptions.width : layoutOptions.height
        }
        function getOffset(layoutOptions, offsets) {
            var side = layoutOptions.cutLayoutSide,
                offset = {
                    horizontal: 0,
                    vertical: 0
                };
            switch (side) {
                case"top":
                case"left":
                    offset[layoutOptions.cutSide] = -offsets[side];
                    break;
                case"bottom":
                case"right":
                    offset[layoutOptions.cutSide] = offsets[side];
                    break
            }
            return offset
        }
        function LayoutManager(){}
        function toLayoutElementCoords(canvas) {
            return new DX.viz.WrapperLayoutElement(null, {
                    x: canvas.left,
                    y: canvas.top,
                    width: canvas.width - canvas.left - canvas.right,
                    height: canvas.height - canvas.top - canvas.bottom
                })
        }
        LayoutManager.prototype = {
            constructor: LayoutManager,
            setOptions: function(options) {
                this._options = options
            },
            applyVerticalAxesLayout: function(axes, panes, rotated) {
                this._applyAxesLayout(axes, panes, rotated)
            },
            applyHorizontalAxesLayout: function(axes, panes, rotated) {
                axes.reverse();
                this._applyAxesLayout(axes, panes, rotated);
                axes.reverse()
            },
            _applyAxesLayout: function(axes, panes, rotated) {
                var that = this,
                    canvas,
                    axisPosition,
                    box,
                    delta,
                    axis,
                    axisLength,
                    direction,
                    directionMultiplier,
                    someDirection = [],
                    pane,
                    i;
                _each(panes, function(_, pane) {
                    _extend(pane.canvas, {
                        deltaLeft: 0,
                        deltaRight: 0,
                        deltaTop: 0,
                        deltaBottom: 0
                    })
                });
                for (i = 0; i < axes.length; i++) {
                    axis = axes[i];
                    axisPosition = axis.getOptions().position || "left";
                    axis.delta = {};
                    box = axis.getBoundingRect();
                    pane = getPane(axis.pane, panes);
                    canvas = pane.canvas;
                    if (!isValidBox(box))
                        continue;
                    direction = "delta" + axisPosition.slice(0, 1).toUpperCase() + axisPosition.slice(1);
                    switch (axisPosition) {
                        case"right":
                            directionMultiplier = 1;
                            canvas.deltaLeft += axis.padding ? axis.padding.left : 0;
                            break;
                        case"left":
                            directionMultiplier = -1;
                            canvas.deltaRight += axis.padding ? axis.padding.right : 0;
                            break;
                        case"top":
                            directionMultiplier = -1;
                            canvas.deltaBottom += axis.padding ? axis.padding.bottom : 0;
                            break;
                        case"bottom":
                            directionMultiplier = 1;
                            canvas.deltaTop += axis.padding ? axis.padding.top : 0;
                            break
                    }
                    switch (axisPosition) {
                        case"right":
                        case"left":
                            if (!box.isEmpty) {
                                delta = box.y + box.height - (canvas.height - canvas.originalBottom);
                                if (delta > 0) {
                                    that.requireAxesRedraw = true;
                                    canvas.deltaBottom += delta
                                }
                                delta = canvas.originalTop - box.y;
                                if (delta > 0) {
                                    that.requireAxesRedraw = true;
                                    canvas.deltaTop += delta
                                }
                            }
                            axisLength = box.width;
                            someDirection = ["Left", "Right"];
                            break;
                        case"top":
                        case"bottom":
                            if (!box.isEmpty) {
                                delta = box.x + box.width - (canvas.width - canvas.originalRight);
                                if (delta > 0) {
                                    that.requireAxesRedraw = true;
                                    canvas.deltaRight += delta
                                }
                                delta = canvas.originalLeft - box.x;
                                if (delta > 0) {
                                    that.requireAxesRedraw = true;
                                    canvas.deltaLeft += delta
                                }
                            }
                            someDirection = ["Bottom", "Top"];
                            axisLength = box.height;
                            break
                    }
                    if (!axis.delta[axisPosition] && canvas[direction] > 0)
                        canvas[direction] += axis.getMultipleAxesSpacing();
                    axis.delta[axisPosition] = axis.delta[axisPosition] || 0;
                    axis.delta[axisPosition] += canvas[direction] * directionMultiplier;
                    canvas[direction] += axisLength
                }
                that.requireAxesRedraw = correctDeltaMarginValue(panes, someDirection) || that.requireAxesRedraw;
                that.stopDrawAxes = applyFoundExceedings(panes, rotated)
            },
            applyPieChartSeriesLayout: function(canvas, series, hideLayoutLabels) {
                var paneSpaceHeight = canvas.height - canvas.top - canvas.bottom,
                    paneSpaceWidth = canvas.width - canvas.left - canvas.right,
                    paneCenterX = paneSpaceWidth / 2 + canvas.left,
                    paneCenterY = paneSpaceHeight / 2 + canvas.top,
                    piePercentage = this._options.piePercentage,
                    accessibleRadius = _isNumber(piePercentage) ? piePercentage * _min(canvas.height, canvas.width) / 2 : _min(paneSpaceWidth, paneSpaceHeight) / 2,
                    minR = 0.7 * accessibleRadius,
                    sizeLabels,
                    averageWidthLabels,
                    fullRadiusWithLabels,
                    countSeriesWithOuterLabels = 0,
                    innerRadius = getInnerRadius(series[0]);
                if (!hideLayoutLabels && !_isNumber(piePercentage)) {
                    sizeLabels = getSizeLabels(series);
                    fullRadiusWithLabels = paneCenterX - sizeLabels.common + canvas.left;
                    if (fullRadiusWithLabels < minR) {
                        accessibleRadius = minR;
                        _each(sizeLabels.sizes, function(_, size) {
                            size !== 0 && countSeriesWithOuterLabels++
                        });
                        averageWidthLabels = (paneCenterX - accessibleRadius - canvas.left) / countSeriesWithOuterLabels
                    }
                    else
                        accessibleRadius = _min(getPieRadius(series, paneCenterX, paneCenterY, accessibleRadius, minR), fullRadiusWithLabels);
                    correctLabelRadius(sizeLabels.sizes, accessibleRadius, series, canvas, averageWidthLabels)
                }
                return {
                        centerX: _floor(paneCenterX),
                        centerY: _floor(paneCenterY),
                        radiusInner: _floor(accessibleRadius * innerRadius),
                        radiusOuter: _floor(accessibleRadius),
                        canvas: canvas
                    }
            },
            needMoreSpaceForPanesCanvas: function(panes, rotated) {
                var options = this._options,
                    width = options.width,
                    height = options.height,
                    piePercentage = options.piePercentage,
                    percentageIsValid = _isNumber(piePercentage),
                    needHorizontalSpace = 0,
                    needVerticalSpace = 0;
                _each(panes, function(_, pane) {
                    var paneCanvas = pane.canvas,
                        minSize = percentageIsValid ? _min(paneCanvas.width, paneCanvas.height) * piePercentage : undefined,
                        needPaneHorizonralSpace = (percentageIsValid ? minSize : width) - (paneCanvas.width - paneCanvas.left - paneCanvas.right),
                        needPaneVerticalSpace = (percentageIsValid ? minSize : height) - (paneCanvas.height - paneCanvas.top - paneCanvas.bottom);
                    if (rotated) {
                        needHorizontalSpace += needPaneHorizonralSpace > 0 ? needPaneHorizonralSpace : 0;
                        needVerticalSpace = _max(needPaneVerticalSpace > 0 ? needPaneVerticalSpace : 0, needVerticalSpace)
                    }
                    else {
                        needHorizontalSpace = _max(needPaneHorizonralSpace > 0 ? needPaneHorizonralSpace : 0, needHorizontalSpace);
                        needVerticalSpace += needPaneVerticalSpace > 0 ? needPaneVerticalSpace : 0
                    }
                });
                return needHorizontalSpace > 0 || needVerticalSpace > 0 ? {
                        width: needHorizontalSpace,
                        height: needVerticalSpace
                    } : false
            },
            layoutElements: function(elements, canvas, funcAxisDrawer, panes, rotated, axes) {
                this._elements = elements;
                this._probeDrawing(canvas);
                this._drawElements(canvas);
                funcAxisDrawer && funcAxisDrawer();
                this._processAdaptiveLayout(panes, rotated, canvas, axes, funcAxisDrawer);
                this._positionElements(canvas)
            },
            _processAdaptiveLayout: function(panes, rotated, canvas, axes, funcAxisDrawer) {
                var that = this,
                    size = that.needMoreSpaceForPanesCanvas(panes, rotated),
                    items = this._elements;
                if (!size)
                    return;
                function processCanvases(item, layoutOptions, side) {
                    if (!item.getLayoutOptions()[side]) {
                        canvas[layoutOptions.cutLayoutSide] -= layoutOptions[side];
                        size[side] = Math.max(size[side] - layoutOptions[side], 0)
                    }
                }
                $.each(items.slice().reverse(), function(_, item) {
                    var layoutOptions = _extend({}, item.getLayoutOptions()),
                        sizeObject;
                    if (!layoutOptions)
                        return;
                    sizeObject = $.extend({}, layoutOptions);
                    if (layoutOptions.cutSide === "vertical" && size.height) {
                        item.draw(sizeObject.width, sizeObject.height - size.height);
                        processCanvases(item, layoutOptions, "height")
                    }
                    if (layoutOptions.cutSide === "horizontal" && size.width) {
                        item.draw(sizeObject.width - size.width, sizeObject.height);
                        processCanvases(item, layoutOptions, "width")
                    }
                });
                updateAxis(axes.verticalAxes, "width", size);
                updateAxis(axes.horizontalAxes, "height", size);
                funcAxisDrawer && funcAxisDrawer(true)
            },
            _probeDrawing: function(canvas) {
                var that = this;
                $.each(this._elements, function(_, item) {
                    var layoutOptions = item.getLayoutOptions(),
                        sizeObject;
                    if (!layoutOptions)
                        return;
                    sizeObject = {
                        width: canvas.width - canvas.left - canvas.right,
                        height: canvas.height - canvas.top - canvas.bottom
                    };
                    if (layoutOptions.cutSide === "vertical")
                        sizeObject.height -= that._options.height;
                    else
                        sizeObject.width -= that._options.width;
                    item.probeDraw(sizeObject.width, sizeObject.height);
                    downSize(canvas, item.getLayoutOptions())
                })
            },
            _drawElements: function(canvas) {
                $.each(this._elements.slice().reverse(), function(_, item) {
                    var layoutOptions = item.getLayoutOptions(),
                        sizeObject,
                        cutSide,
                        length;
                    if (!layoutOptions)
                        return;
                    sizeObject = {
                        width: canvas.width - canvas.left - canvas.right,
                        height: canvas.height - canvas.top - canvas.bottom
                    };
                    cutSide = layoutOptions.cutSide;
                    length = cutSide === "horizontal" ? "width" : "height";
                    sizeObject[length] = layoutOptions[length];
                    item.draw(sizeObject.width, sizeObject.height)
                })
            },
            _positionElements: function(canvas) {
                var offsets = {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0
                    };
                $.each(this._elements.slice().reverse(), function(_, item) {
                    var layoutOptions = item.getLayoutOptions(),
                        position,
                        cutSide,
                        my;
                    if (!layoutOptions)
                        return;
                    position = layoutOptions.position;
                    cutSide = layoutOptions.cutSide;
                    my = {
                        horizontal: position.horizontal,
                        vertical: position.vertical
                    };
                    my[cutSide] = inverseAlign[my[cutSide]];
                    item.position({
                        of: toLayoutElementCoords(canvas),
                        my: my,
                        at: position,
                        offset: getOffset(layoutOptions, offsets)
                    });
                    offsets[layoutOptions.cutLayoutSide] += layoutOptions[layoutOptions.cutSide === "horizontal" ? "width" : "height"]
                })
            }
        };
        DX.viz.charts.LayoutManager = LayoutManager
    })(jQuery, DevExpress);
    /*! Module viz-charts, file multiAxesSynchronizer.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            Range = viz.Range,
            commonUtils = DX.require("/utils/utils.common"),
            mathUtils = DX.require("/utils/utils.math"),
            _adjustValue = mathUtils.adjustValue,
            _applyPrecisionByMinDelta = mathUtils.applyPrecisionByMinDelta,
            _isDefined = commonUtils.isDefined,
            debug = DX.require("/utils/utils.console").debug,
            _math = Math,
            _floor = _math.floor,
            _max = _math.max,
            _abs = _math.abs,
            _each = $.each,
            MIN_RANGE_FOR_ADJUST_BOUNDS = 0.1;
        var getValueAxesPerPanes = function(valueAxes) {
                var result = {};
                _each(valueAxes, function(_, axis) {
                    var pane = axis.pane;
                    if (!result[pane])
                        result[pane] = [];
                    result[pane].push(axis)
                });
                return result
            };
        var restoreOriginalBusinessRange = function(axis) {
                var businessRange,
                    translator = axis.getTranslator();
                if (!translator._originalBusinessRange)
                    translator._originalBusinessRange = new Range(translator.getBusinessRange());
                else {
                    businessRange = new Range(translator._originalBusinessRange);
                    translator.updateBusinessRange(businessRange)
                }
            };
        var linearConvertor = {
                transform: function(v, b) {
                    return mathUtils.getLog(v, b)
                },
                addInterval: function(v, i) {
                    return v + i
                },
                getInterval: function(base, tickInterval) {
                    return tickInterval
                },
                adjustValue: _floor
            };
        var logConvertor = {
                transform: function(v, b) {
                    return mathUtils.raiseTo(v, b)
                },
                addInterval: function(v, i) {
                    return v * i
                },
                getInterval: function(base, tickInterval) {
                    return _math.pow(base, tickInterval)
                },
                adjustValue: _adjustValue
            };
        var convertAxisInfo = function(axisInfo, convertor) {
                if (!axisInfo.isLogarithmic)
                    return;
                var base = axisInfo.logarithmicBase,
                    tickValues = axisInfo.tickValues,
                    tick,
                    ticks = [],
                    interval,
                    i;
                axisInfo.minValue = convertor.transform(axisInfo.minValue, base);
                axisInfo.oldMinValue = convertor.transform(axisInfo.oldMinValue, base);
                axisInfo.maxValue = convertor.transform(axisInfo.maxValue, base);
                axisInfo.oldMaxValue = convertor.transform(axisInfo.oldMaxValue, base);
                axisInfo.tickInterval = _math.round(axisInfo.tickInterval);
                if (axisInfo.tickInterval < 1)
                    axisInfo.tickInterval = 1;
                interval = convertor.getInterval(base, axisInfo.tickInterval);
                tick = convertor.transform(tickValues[0], base);
                for (i = 0; i < tickValues.length; i++) {
                    ticks.push(convertor.adjustValue(tick));
                    tick = convertor.addInterval(tick, interval)
                }
                ticks.tickInterval = axisInfo.tickInterval;
                axisInfo.tickValues = ticks
            };
        var populateAxesInfo = function(axes) {
                return viz.utils.map(axes, function(axis) {
                        restoreOriginalBusinessRange(axis);
                        var ticksValues = axis.getTicksValues(),
                            majorTicks = ticksValues.majorTicksValues,
                            options = axis.getOptions(),
                            minValue,
                            maxValue,
                            axisInfo = null,
                            businessRange,
                            tickInterval,
                            synchronizedValue;
                        if (majorTicks && majorTicks.length > 0 && commonUtils.isNumber(majorTicks[0]) && options.type !== "discrete") {
                            businessRange = axis.getTranslator().getBusinessRange();
                            tickInterval = axis._tickManager.getTickInterval();
                            minValue = businessRange.minVisible;
                            maxValue = businessRange.maxVisible;
                            synchronizedValue = options.synchronizedValue;
                            if (minValue === maxValue && _isDefined(synchronizedValue)) {
                                tickInterval = _abs(majorTicks[0] - synchronizedValue) || 1;
                                minValue = majorTicks[0] - tickInterval;
                                maxValue = majorTicks[0] + tickInterval
                            }
                            axisInfo = {
                                axis: axis,
                                isLogarithmic: options.type === "logarithmic",
                                logarithmicBase: businessRange.base,
                                tickValues: majorTicks,
                                minorValues: ticksValues.minorTicksValues,
                                minValue: minValue,
                                oldMinValue: minValue,
                                maxValue: maxValue,
                                oldMaxValue: maxValue,
                                inverted: businessRange.invert,
                                tickInterval: tickInterval,
                                synchronizedValue: synchronizedValue
                            };
                            if (businessRange.stubData) {
                                axisInfo.stubData = true;
                                axisInfo.tickInterval = axisInfo.tickInterval || options.tickInterval;
                                axisInfo.isLogarithmic = false
                            }
                            convertAxisInfo(axisInfo, linearConvertor);
                            debug.assert(axisInfo.tickInterval !== undefined && axisInfo.tickInterval !== null, "tickInterval was not provided")
                        }
                        return axisInfo
                    })
            };
        var updateTickValues = function(axesInfo) {
                var maxTicksCount = 0;
                _each(axesInfo, function(_, axisInfo) {
                    maxTicksCount = _max(maxTicksCount, axisInfo.tickValues.length)
                });
                _each(axesInfo, function(_, axisInfo) {
                    var ticksMultiplier,
                        ticksCount,
                        additionalStartTicksCount = 0,
                        synchronizedValue = axisInfo.synchronizedValue,
                        tickValues = axisInfo.tickValues,
                        tickInterval = axisInfo.tickInterval;
                    if (_isDefined(synchronizedValue)) {
                        axisInfo.baseTickValue = axisInfo.invertedBaseTickValue = synchronizedValue;
                        axisInfo.tickValues = [axisInfo.baseTickValue]
                    }
                    else {
                        if (tickValues.length > 1 && tickInterval) {
                            ticksMultiplier = _floor((maxTicksCount + 1) / tickValues.length);
                            ticksCount = ticksMultiplier > 1 ? _floor((maxTicksCount + 1) / ticksMultiplier) : maxTicksCount;
                            additionalStartTicksCount = _floor((ticksCount - tickValues.length) / 2);
                            while (additionalStartTicksCount > 0 && tickValues[0] !== 0) {
                                tickValues.unshift(_applyPrecisionByMinDelta(tickValues[0], tickInterval, tickValues[0] - tickInterval));
                                additionalStartTicksCount--
                            }
                            while (tickValues.length < ticksCount)
                                tickValues.push(_applyPrecisionByMinDelta(tickValues[0], tickInterval, tickValues[tickValues.length - 1] + tickInterval));
                            axisInfo.tickInterval = tickInterval / ticksMultiplier
                        }
                        axisInfo.baseTickValue = tickValues[0];
                        axisInfo.invertedBaseTickValue = tickValues[tickValues.length - 1]
                    }
                })
            };
        var getAxisRange = function(axisInfo) {
                return axisInfo.maxValue - axisInfo.minValue || 1
            };
        var getMainAxisInfo = function(axesInfo) {
                for (var i = 0; i < axesInfo.length; i++)
                    if (!axesInfo[i].stubData)
                        return axesInfo[i];
                return null
            };
        var correctMinMaxValues = function(axesInfo) {
                var mainAxisInfo = getMainAxisInfo(axesInfo),
                    mainAxisInfoTickInterval = mainAxisInfo.tickInterval;
                _each(axesInfo, function(_, axisInfo) {
                    var scale,
                        move,
                        mainAxisBaseValueOffset,
                        valueFromAxisInfo;
                    if (axisInfo !== mainAxisInfo) {
                        if (mainAxisInfoTickInterval && axisInfo.tickInterval) {
                            if (axisInfo.stubData && _isDefined(axisInfo.synchronizedValue)) {
                                axisInfo.oldMinValue = axisInfo.minValue = axisInfo.baseTickValue - (mainAxisInfo.baseTickValue - mainAxisInfo.minValue) / mainAxisInfoTickInterval * axisInfo.tickInterval;
                                axisInfo.oldMaxValue = axisInfo.maxValue = axisInfo.baseTickValue - (mainAxisInfo.baseTickValue - mainAxisInfo.maxValue) / mainAxisInfoTickInterval * axisInfo.tickInterval
                            }
                            scale = mainAxisInfoTickInterval / getAxisRange(mainAxisInfo) / axisInfo.tickInterval * getAxisRange(axisInfo);
                            axisInfo.maxValue = axisInfo.minValue + getAxisRange(axisInfo) / scale
                        }
                        if (mainAxisInfo.inverted && !axisInfo.inverted || !mainAxisInfo.inverted && axisInfo.inverted)
                            mainAxisBaseValueOffset = mainAxisInfo.maxValue - mainAxisInfo.invertedBaseTickValue;
                        else
                            mainAxisBaseValueOffset = mainAxisInfo.baseTickValue - mainAxisInfo.minValue;
                        valueFromAxisInfo = getAxisRange(axisInfo);
                        move = (mainAxisBaseValueOffset / getAxisRange(mainAxisInfo) - (axisInfo.baseTickValue - axisInfo.minValue) / valueFromAxisInfo) * valueFromAxisInfo;
                        axisInfo.minValue -= move;
                        axisInfo.maxValue -= move
                    }
                })
            };
        var calculatePaddings = function(axesInfo) {
                var minPadding,
                    maxPadding,
                    startPadding = 0,
                    endPadding = 0;
                _each(axesInfo, function(_, axisInfo) {
                    var inverted = axisInfo.inverted;
                    minPadding = axisInfo.minValue > axisInfo.oldMinValue ? (axisInfo.minValue - axisInfo.oldMinValue) / getAxisRange(axisInfo) : 0;
                    maxPadding = axisInfo.maxValue < axisInfo.oldMaxValue ? (axisInfo.oldMaxValue - axisInfo.maxValue) / getAxisRange(axisInfo) : 0;
                    startPadding = _max(startPadding, inverted ? maxPadding : minPadding);
                    endPadding = _max(endPadding, inverted ? minPadding : maxPadding)
                });
                return {
                        start: startPadding,
                        end: endPadding
                    }
            };
        var correctMinMaxValuesByPaddings = function(axesInfo, paddings) {
                _each(axesInfo, function(_, info) {
                    var range = getAxisRange(info),
                        inverted = info.inverted;
                    info.minValue -= paddings[inverted ? "end" : "start"] * range;
                    info.maxValue += paddings[inverted ? "start" : "end"] * range;
                    if (range > MIN_RANGE_FOR_ADJUST_BOUNDS) {
                        info.minValue = _math.min(info.minValue, _adjustValue(info.minValue));
                        info.maxValue = _max(info.maxValue, _adjustValue(info.maxValue))
                    }
                })
            };
        var updateTickValuesIfSyncronizedValueUsed = function(axesInfo) {
                var hasSyncronizedValue = false;
                _each(axesInfo, function(_, info) {
                    hasSyncronizedValue = hasSyncronizedValue || _isDefined(info.synchronizedValue)
                });
                _each(axesInfo, function(_, info) {
                    var lastTickValue,
                        tickInterval = info.tickInterval,
                        tickValues = info.tickValues,
                        maxValue = info.maxValue,
                        minValue = info.minValue;
                    if (hasSyncronizedValue && tickInterval) {
                        while (tickValues[0] - tickInterval >= minValue)
                            tickValues.unshift(_adjustValue(tickValues[0] - tickInterval));
                        lastTickValue = tickValues[tickValues.length - 1];
                        while ((lastTickValue = lastTickValue + tickInterval) <= maxValue)
                            tickValues.push(commonUtils.isExponential(lastTickValue) ? _adjustValue(lastTickValue) : _applyPrecisionByMinDelta(minValue, tickInterval, lastTickValue))
                    }
                    while (tickValues[0] < minValue)
                        tickValues.shift();
                    while (tickValues[tickValues.length - 1] > maxValue)
                        tickValues.pop()
                })
            };
        var applyMinMaxValues = function(axesInfo) {
                _each(axesInfo, function(_, info) {
                    var axis = info.axis,
                        range = axis.getTranslator().getBusinessRange();
                    if (range.min === range.minVisible)
                        range.min = info.minValue;
                    if (range.max === range.maxVisible)
                        range.max = info.maxValue;
                    range.minVisible = info.minValue;
                    range.maxVisible = info.maxValue;
                    if (_isDefined(info.stubData))
                        range.stubData = info.stubData;
                    if (range.min > range.minVisible)
                        range.min = range.minVisible;
                    if (range.max < range.maxVisible)
                        range.max = range.maxVisible;
                    range.isSynchronized = true;
                    axis.getTranslator().updateBusinessRange(range);
                    axis.setTicks({
                        majorTicks: info.tickValues,
                        minorTicks: info.minorValues
                    })
                })
            };
        var correctAfterSynchronize = function(axesInfo) {
                var invalidAxisInfo = [],
                    correctValue,
                    validAxisInfo;
                _each(axesInfo, function(i, info) {
                    if (info.oldMaxValue - info.oldMinValue === 0)
                        invalidAxisInfo.push(info);
                    else if (!_isDefined(correctValue) && !_isDefined(info.synchronizedValue)) {
                        correctValue = _abs((info.maxValue - info.minValue) / (info.tickValues[_floor(info.tickValues.length / 2)] || info.maxValue));
                        validAxisInfo = info
                    }
                });
                if (!_isDefined(correctValue))
                    return;
                _each(invalidAxisInfo, function(i, info) {
                    var firstTick = info.tickValues[0],
                        correctedTick = firstTick * correctValue,
                        tickValues = validAxisInfo.tickValues,
                        centralTick = tickValues[_floor(tickValues.length / 2)];
                    if (firstTick > 0) {
                        info.maxValue = correctedTick;
                        info.minValue = 0
                    }
                    else if (firstTick < 0) {
                        info.minValue = correctedTick;
                        info.maxValue = 0
                    }
                    else if (firstTick === 0) {
                        info.maxValue = validAxisInfo.maxValue - centralTick;
                        info.minValue = validAxisInfo.minValue - centralTick
                    }
                })
            };
        DX.viz.charts.multiAxesSynchronizer = {synchronize: function(valueAxes) {
                _each(getValueAxesPerPanes(valueAxes), function(_, axes) {
                    var axesInfo,
                        paddings;
                    if (axes.length > 1) {
                        axesInfo = populateAxesInfo(axes);
                        if (axesInfo.length === 0 || !getMainAxisInfo(axesInfo))
                            return;
                        updateTickValues(axesInfo);
                        correctMinMaxValues(axesInfo);
                        paddings = calculatePaddings(axesInfo);
                        correctMinMaxValuesByPaddings(axesInfo, paddings);
                        correctAfterSynchronize(axesInfo);
                        updateTickValuesIfSyncronizedValueUsed(axesInfo);
                        _each(axesInfo, function() {
                            convertAxisInfo(this, logConvertor)
                        });
                        applyMinMaxValues(axesInfo)
                    }
                })
            }}
    })(jQuery, DevExpress);
    /*! Module viz-charts, file tracker.js */
    (function($, DX, math, undefined) {
        var charts = DX.viz.charts,
            eventsConsts = DX.viz.series.helpers.consts.events,
            commonUtils = DX.require("/utils/utils.common"),
            pointerEvents = DX.require("/ui/events/pointer/ui.events.pointer"),
            wheelEvent = DX.require("/ui/events/ui.events.wheel"),
            isDefined = commonUtils.isDefined,
            _normalizeEnum = DX.viz.utils.normalizeEnum,
            _floor = math.floor,
            _each = $.each,
            MULTIPLE_MODE = 'multiple',
            ALL_ARGUMENTS_POINTS_MODE = 'allargumentpoints',
            ALL_SERIES_POINTS_MODE = 'allseriespoints',
            MARK_POINT_MODE = 'markpoint',
            NONE_MODE = 'none',
            POINTER_ACTION = [pointerEvents.down, pointerEvents.move].join(" "),
            POINT_SELECTION_CHANGED = "pointSelectionChanged",
            LEGEND_CLICK = "legendClick",
            SERIES_CLICK = "seriesClick",
            POINT_CLICK = "pointClick",
            RELEASE_POINT_SELECTED_STATE = "releasePointSelectedState",
            SET_POINT_SELECTED_STATE = "setPointSelectedState",
            SERIES_HOVER_CHANGED = 'seriesHoverChanged',
            POINT_HOVER_CHANGED = 'pointHoverChanged',
            RELEASE_POINT_HOVER_STATE = 'releasePointHoverState',
            SERIES_SELECTION_CHANGED = "seriesSelectionChanged",
            POINT_DATA = "chart-data-point",
            SERIES_DATA = "chart-data-series",
            ARG_DATA = "chart-data-argument",
            DELAY = 100;
        function getData(event, dataKey) {
            var target = event.target;
            return (target.tagName === "tspan" ? target.parentNode : target)[dataKey]
        }
        function eventCanceled(event, target) {
            return event.cancel || !target.getOptions()
        }
        function inCanvas(canvas, x, y) {
            return x >= canvas.left && x <= canvas.right && y >= canvas.top && y <= canvas.bottom
        }
        function setPointsSpecState(points, targetPoint, func, eventName, eventTrigger) {
            _each(points, function(_, currentPoint) {
                var series = currentPoint.series;
                if (currentPoint === targetPoint) {
                    series[func]({
                        point: currentPoint,
                        setState: true
                    });
                    eventName && eventTrigger(eventName, {target: currentPoint})
                }
                else
                    series[func]({point: currentPoint})
            })
        }
        function getArgumentPointsByIndex(storedSeries, argument, targetPointIndex) {
            var points = [];
            _each(storedSeries, function(_, series) {
                _each(series.getPointsByArg(argument), function(_, currentPoint) {
                    if (targetPointIndex === currentPoint.index)
                        points.push(currentPoint)
                })
            });
            return points
        }
        var baseTrackerPrototype = {
                ctor: function(options) {
                    var that = this,
                        data = {tracker: that};
                    if (_normalizeEnum(options.pointSelectionMode) === MULTIPLE_MODE) {
                        that._setSelectedPoint = that._selectPointMultipleMode;
                        that._releaseSelectedPoint = that._releaseSelectedPointMultipleMode
                    }
                    else {
                        that._setSelectedPoint = that._selectPointSingleMode;
                        that._releaseSelectedPoint = that._releaseSelectedPointSingleMode
                    }
                    if (_normalizeEnum(options.seriesSelectionMode) === MULTIPLE_MODE) {
                        that._releaseSelectedSeries = that._releaseSelectedSeriesMultipleMode;
                        that._setSelectedSeries = that._setSelectedSeriesMultipleMode
                    }
                    else {
                        that._releaseSelectedSeries = that._releaseSelectedSeriesSingleMode;
                        that._setSelectedSeries = that._setSelectedSeriesSingleMode
                    }
                    that._renderer = options.renderer;
                    that._tooltip = options.tooltip;
                    that._eventTrigger = options.eventTrigger;
                    options.seriesGroup.off().on(eventsConsts.selectSeries, data, that._selectSeries).on(eventsConsts.deselectSeries, data, that._deselectSeries).on(eventsConsts.selectPoint, data, that._selectPoint).on(eventsConsts.deselectPoint, data, that._deselectPoint).on(eventsConsts.showPointTooltip, data, that._showPointTooltip).on(eventsConsts.hidePointTooltip, data, that._hidePointTooltip);
                    that._renderer.root.off(POINTER_ACTION).off("dxclick dxhold").on(POINTER_ACTION, data, that._pointerHandler).on("dxclick", data, that._clickHandler).on("dxhold", {timeout: 300}, $.noop)
                },
                update: function(options) {
                    var that = this;
                    if (that._storedSeries !== options.series) {
                        that._storedSeries = options.series || [];
                        that._clean()
                    }
                    else {
                        that._hideTooltip(that.pointAtShownTooltip);
                        that._clearHover();
                        that.clearSelection()
                    }
                    that._legend = options.legend;
                    that.legendCallback = options.legendCallback;
                    that._prepare(that._renderer.root)
                },
                setCanvases: function(mainCanvas, paneCanvases) {
                    this._mainCanvas = mainCanvas;
                    this._canvases = paneCanvases
                },
                repairTooltip: function() {
                    var point = this.pointAtShownTooltip;
                    if (point && !point.isVisible())
                        this._hideTooltip(point, true);
                    else
                        this._showTooltip(point)
                },
                _prepare: function(root) {
                    root.off(wheelEvent.name).on(wheelEvent.name, {tracker: this}, function(e) {
                        e.data.tracker._pointerOut()
                    })
                },
                _selectPointMultipleMode: function(point) {
                    var that = this;
                    that._selectedPoint = that._selectedPoint || [];
                    if ($.inArray(point, that._selectedPoint) < 0) {
                        that._selectedPoint.push(point);
                        that._setPointState(point, SET_POINT_SELECTED_STATE, _normalizeEnum(point.getOptions().selectionMode), POINT_SELECTION_CHANGED, that.legendCallback(point))
                    }
                },
                _releaseSelectedPointMultipleMode: function(point) {
                    var that = this,
                        points = that._selectedPoint || [],
                        pointIndex = $.inArray(point, points);
                    if (pointIndex >= 0) {
                        that._setPointState(point, RELEASE_POINT_SELECTED_STATE, _normalizeEnum(point.getOptions().selectionMode), POINT_SELECTION_CHANGED, that.legendCallback(point));
                        points.splice(pointIndex, 1)
                    }
                    else if (!point)
                        _each(points, function(_, point) {
                            that._releaseSelectedPoint(point)
                        })
                },
                _selectPointSingleMode: function(point) {
                    var that = this;
                    if (that._selectedPoint !== point) {
                        that._releaseSelectedPoint();
                        that._selectedPoint = point;
                        that._setPointState(point, SET_POINT_SELECTED_STATE, _normalizeEnum(point.getOptions().selectionMode), POINT_SELECTION_CHANGED, that.legendCallback(point))
                    }
                },
                _releaseSelectedPointSingleMode: function() {
                    var that = this,
                        point = that._selectedPoint;
                    if (point) {
                        that._setPointState(point, RELEASE_POINT_SELECTED_STATE, _normalizeEnum(point.getOptions().selectionMode), POINT_SELECTION_CHANGED, that.legendCallback(point));
                        that._selectedPoint = null
                    }
                },
                _setPointState: function(point, action, mode, eventName, legendCallback) {
                    var that = this,
                        eventTrigger = that._eventTrigger;
                    switch (mode) {
                        case ALL_ARGUMENTS_POINTS_MODE:
                        case MARK_POINT_MODE:
                            that._toAllArgumentPoints(point.argument, action, eventName, point, legendCallback);
                            break;
                        case ALL_SERIES_POINTS_MODE:
                            setPointsSpecState(point.series.getPoints(), point, action, eventName, eventTrigger);
                            break;
                        case NONE_MODE:
                            break;
                        default:
                            point.series[action]({
                                point: point,
                                legendCallback: legendCallback,
                                setState: true
                            });
                            eventTrigger(eventName, {target: point})
                    }
                },
                _setHoveredPoint: function(point, mode) {
                    var that = this;
                    var debug = DX.require("/utils/utils.console").debug;
                    debug.assert(point.series, 'series was not assigned to point or empty');
                    if (that.hoveredPoint === point || !point.series)
                        return;
                    that._releaseHoveredPoint();
                    if (point && point.getOptions() && mode !== NONE_MODE) {
                        that.hoveredPoint = point;
                        that._setPointState(point, 'setPointHoverState', mode || _normalizeEnum(point.getOptions().hoverMode), POINT_HOVER_CHANGED, that.legendCallback(point))
                    }
                },
                _releaseHoveredPoint: function() {
                    var that = this,
                        point = that.hoveredPoint,
                        eventTrigger = that._eventTrigger;
                    if (!point || !point.getOptions())
                        return;
                    that._releasePoint(point, eventTrigger);
                    if (that._tooltip.isEnabled())
                        that._hideTooltip(point);
                    that.hoveredPoint = null
                },
                _setSelectedSeriesMultipleMode: function(series, mode) {
                    var that = this;
                    that._selectedSeries = that._selectedSeries || [];
                    if ($.inArray(series, that._selectedSeries) < 0) {
                        that._selectedSeries.push(series);
                        series.setSelectedState(true, mode, that.legendCallback(series));
                        that._eventTrigger(SERIES_SELECTION_CHANGED, {target: series})
                    }
                },
                _setSelectedSeriesSingleMode: function(series, mode) {
                    var that = this;
                    if (series !== that._selectedSeries || series.lastSelectionMode !== mode) {
                        that._releaseSelectedSeries();
                        that._selectedSeries = series;
                        series.setSelectedState(true, mode, that.legendCallback(series));
                        that._eventTrigger(SERIES_SELECTION_CHANGED, {target: series})
                    }
                },
                _releaseSelectedSeriesMultipleMode: function(series) {
                    var that = this,
                        selectedSeries = that._selectedSeries || [],
                        seriesIndex = $.inArray(series, selectedSeries);
                    if (seriesIndex >= 0) {
                        series.setSelectedState(false, undefined, that.legendCallback(series));
                        that._eventTrigger(SERIES_SELECTION_CHANGED, {target: series});
                        selectedSeries.splice(seriesIndex, 1)
                    }
                    else if (!series)
                        _each(selectedSeries, function(_, series) {
                            that._releaseSelectedSeries(series)
                        })
                },
                _releaseSelectedSeriesSingleMode: function(series) {
                    var that = this,
                        selectedSeries = that._selectedSeries;
                    if (selectedSeries && (!series || series === selectedSeries)) {
                        selectedSeries.setSelectedState(false, undefined, that.legendCallback(selectedSeries));
                        that._eventTrigger(SERIES_SELECTION_CHANGED, {target: selectedSeries});
                        that._selectedSeries = null
                    }
                },
                _setHoveredSeries: function(series, mode) {
                    var that = this;
                    if (mode !== NONE_MODE && that.hoveredSeries !== series || series.lastHoverMode !== mode) {
                        that._clearHover();
                        series.setHoverState(true, mode, that.legendCallback(series));
                        that._eventTrigger(SERIES_HOVER_CHANGED, {target: series})
                    }
                    that.hoveredSeries = series;
                    if (mode === NONE_MODE)
                        $(series).trigger('NoneMode')
                },
                _releaseHoveredSeries: function(needSetHoverView, hoveredPoint) {
                    var that = this,
                        hoveredSeries = that.hoveredSeries,
                        seriesWithHoverView = that._seriesWithHoverView;
                    if (hoveredSeries) {
                        hoveredSeries.setHoverState(false, undefined, that.legendCallback(hoveredSeries));
                        if (needSetHoverView && hoveredPoint && hoveredPoint.series === hoveredSeries)
                            that._seriesWithHoverView = hoveredSeries.setHoverView();
                        that._eventTrigger(SERIES_HOVER_CHANGED, {target: hoveredSeries});
                        that.hoveredSeries = null
                    }
                    else if (seriesWithHoverView && !needSetHoverView) {
                        seriesWithHoverView.releaseHoverView();
                        that._seriesWithHoverView = null
                    }
                },
                _selectSeries: function(event, mode) {
                    event.data.tracker._setSelectedSeries(event.target, mode)
                },
                _deselectSeries: function(event, mode) {
                    event.data.tracker._releaseSelectedSeries(event.target, mode)
                },
                _selectPoint: function(event, point) {
                    event.data.tracker._setSelectedPoint(point)
                },
                _deselectPoint: function(event, point) {
                    event.data.tracker._releaseSelectedPoint(point)
                },
                clearSelection: function() {
                    this._releaseSelectedPoint();
                    this._releaseSelectedSeries()
                },
                _clean: function() {
                    var that = this;
                    that._selectedPoint = that._selectedSeries = that.hoveredPoint = that.hoveredSeries = that._hoveredArgumentPoints = that._seriesWithHoverView = null;
                    that._hideTooltip(that.pointAtShownTooltip)
                },
                _clearHover: function() {
                    this._releaseHoveredSeries(false);
                    this._releaseHoveredPoint()
                },
                _hideTooltip: function(point, silent) {
                    var that = this;
                    if (!that._tooltip || point && that.pointAtShownTooltip !== point)
                        return;
                    if (!silent && that.pointAtShownTooltip)
                        that.pointAtShownTooltip = null;
                    that._tooltip.hide()
                },
                _showTooltip: function(point) {
                    var that = this,
                        tooltipFormatObject,
                        eventData;
                    if (point && point.getOptions()) {
                        tooltipFormatObject = point.getTooltipFormatObject(that._tooltip);
                        if (!isDefined(tooltipFormatObject.valueText) && !tooltipFormatObject.points || !point.isVisible())
                            return;
                        if (!that.pointAtShownTooltip || that.pointAtShownTooltip !== point)
                            eventData = {target: point};
                        var coords = point.getTooltipParams(that._tooltip.getLocation()),
                            rootOffset = that._renderer.getRootOffset();
                        coords.x += rootOffset.left;
                        coords.y += rootOffset.top;
                        if (!that._tooltip.show(tooltipFormatObject, coords, eventData))
                            return;
                        that.pointAtShownTooltip = point
                    }
                },
                _showPointTooltip: function(event, point) {
                    var that = event.data.tracker,
                        pointWithTooltip = that.pointAtShownTooltip;
                    if (pointWithTooltip && pointWithTooltip !== point)
                        that._hideTooltip(pointWithTooltip);
                    that._showTooltip(point)
                },
                _hidePointTooltip: function(event, point) {
                    event.data.tracker._hideTooltip(point)
                },
                _enableOutHandler: function() {
                    if (this._outHandler)
                        return;
                    var that = this,
                        handler = function(e) {
                            var rootOffset = that._renderer.getRootOffset(),
                                x = _floor(e.pageX - rootOffset.left),
                                y = _floor(e.pageY - rootOffset.top);
                            if (!inCanvas(that._mainCanvas, x, y)) {
                                that._pointerOut();
                                that._disableOutHandler()
                            }
                        };
                    $(document).on(POINTER_ACTION, handler);
                    this._outHandler = handler
                },
                _disableOutHandler: function() {
                    this._outHandler && $(document).off(POINTER_ACTION, this._outHandler);
                    this._outHandler = null
                },
                _pointerOut: function() {
                    this._clearHover();
                    this._tooltip.isEnabled() && this._hideTooltip(this.pointAtShownTooltip)
                },
                _legendClick: function(eventArgs, elementClick) {
                    var eventTrigger = this._eventTrigger;
                    eventTrigger(LEGEND_CLICK, eventArgs, function() {
                        !eventCanceled(eventArgs.jQueryEvent, eventArgs.target) && eventTrigger(elementClick, eventArgs)
                    })
                },
                dispose: function() {
                    var that = this;
                    that._disableOutHandler();
                    _each(that, function(k) {
                        that[k] = null
                    })
                }
            };
        charts.ChartTracker = function(options) {
            this.ctor(options)
        };
        $.extend(charts.ChartTracker.prototype, baseTrackerPrototype, {
            ctor: function(options) {
                var that = this;
                baseTrackerPrototype.ctor.call(that, options)
            },
            _pointClick: function(point, event) {
                var that = this,
                    eventTrigger = that._eventTrigger,
                    series = point.series;
                eventTrigger(POINT_CLICK, {
                    target: point,
                    jQueryEvent: event
                }, function() {
                    !eventCanceled(event, series) && eventTrigger(SERIES_CLICK, {
                        target: series,
                        jQueryEvent: event
                    })
                })
            },
            __trackerDelay: DELAY,
            update: function(options) {
                var that = this;
                that._zoomingMode = _normalizeEnum(options.zoomingMode);
                that._scrollingMode = _normalizeEnum(options.scrollingMode);
                baseTrackerPrototype.update.call(this, options);
                that._argumentAxis = options.argumentAxis || {};
                that._axisHoverEnabled = that._argumentAxis && _normalizeEnum(that._argumentAxis.getOptions().hoverMode) === ALL_ARGUMENTS_POINTS_MODE;
                that._chart = options.chart;
                that._rotated = options.rotated;
                that._crosshair = options.crosshair
            },
            _toAllArgumentPoints: function(argument, func, eventName, targetPoint) {
                var that = this;
                _each(that._storedSeries, function(_, series) {
                    setPointsSpecState(series.getPointsByArg(argument), targetPoint, func, eventName, that._eventTrigger)
                })
            },
            _getCanvas: function(x, y) {
                var that = this,
                    canvases = that._canvases || [];
                for (var i = 0; i < canvases.length; i++) {
                    var c = canvases[i];
                    if (inCanvas(c, x, y))
                        return c
                }
                return null
            },
            _focusOnCanvas: function(canvas) {
                if (!canvas && this._stickedSeries)
                    this._pointerOut()
            },
            _releasePoint: function(point, eventTrigger) {
                var that = this,
                    mode = _normalizeEnum(point.getOptions().hoverMode);
                if (mode === ALL_SERIES_POINTS_MODE)
                    setPointsSpecState(point.series.getPoints(), point, RELEASE_POINT_HOVER_STATE, POINT_HOVER_CHANGED, eventTrigger);
                else if (mode === ALL_ARGUMENTS_POINTS_MODE)
                    that._toAllArgumentPoints(point.argument, RELEASE_POINT_HOVER_STATE, POINT_HOVER_CHANGED, point);
                else if (mode !== "none") {
                    point.releaseHoverState(that.legendCallback(point));
                    eventTrigger(POINT_HOVER_CHANGED, {target: point})
                }
            },
            _resetHoveredArgument: function() {
                if (isDefined(this.hoveredArgument)) {
                    this._toAllArgumentPoints(this.hoveredArgument, RELEASE_POINT_HOVER_STATE);
                    this.hoveredArgument = null
                }
            },
            _hideCrosshair: function() {
                this._crosshair && this._crosshair.hide()
            },
            _moveCrosshair: function(point, x, y) {
                if (point && this._crosshair && point.isVisible())
                    this._crosshair.show(point.getCrosshairData(x, y), point.getPointRadius())
            },
            _prepare: function(root) {
                var that = this,
                    touchScrollingEnabled = that._scrollingMode === 'all' || that._scrollingMode === 'touch',
                    touchZoomingEnabled = that._zoomingMode === 'all' || that._zoomingMode === 'touch',
                    cssValue = (!touchScrollingEnabled ? "pan-x pan-y " : '') + (!touchZoomingEnabled ? "pinch-zoom" : '') || "none",
                    rootStyles = {
                        'touch-action': cssValue,
                        '-ms-touch-action': cssValue
                    },
                    wheelzoomingEnabled = that._zoomingMode === "all" || that._zoomingMode === "mouse";
                root.off(wheelEvent.name + " dxc-scroll-start dxc-scroll-move");
                baseTrackerPrototype._prepare.call(that, root);
                if (!that._gestureEndHandler) {
                    that._gestureEndHandler = function() {
                        that._gestureEnd && that._gestureEnd()
                    };
                    $(document).on(pointerEvents.up, that._gestureEndHandler)
                }
                wheelzoomingEnabled && root.on(wheelEvent.name, function(e) {
                    var rootOffset = that._renderer.getRootOffset(),
                        x = that._rotated ? e.pageY - rootOffset.top : e.pageX - rootOffset.left,
                        scale = that._argumentAxis.getTranslator().getMinScale(e.delta > 0),
                        translate = x - x * scale,
                        zoom = that._argumentAxis.getTranslator().zoom(-translate, scale);
                    that._pointerOut();
                    that._chart.zoomArgument(zoom.min, zoom.max, true);
                    e.preventDefault();
                    e.stopPropagation()
                });
                root.on("dxc-scroll-start", function(e) {
                    that._gestureStart(that._getGestureParams(e, {
                        left: 0,
                        top: 0
                    }))
                }).on("dxc-scroll-move", function(e) {
                    that._gestureChange(that._getGestureParams(e, {
                        left: 0,
                        top: 0
                    })) && e.preventDefault()
                });
                root.css(rootStyles)
            },
            _getGestureParams: function(e, offset) {
                var that = this,
                    x1,
                    x2,
                    touches = e.pointers.length,
                    left,
                    right,
                    eventCoordField = that._rotated ? "pageY" : "pageX";
                offset = that._rotated ? offset.top : offset.left;
                if (touches === 2)
                    x1 = e.pointers[0][eventCoordField] - offset,
                    x2 = e.pointers[1][eventCoordField] - offset;
                else if (touches === 1)
                    x1 = x2 = e.pointers[0][eventCoordField] - offset;
                left = math.min(x1, x2);
                right = math.max(x1, x2);
                return {
                        center: left + (right - left) / 2,
                        distance: right - left,
                        touches: touches,
                        scale: 1,
                        pointerType: e.pointerType
                    }
            },
            _gestureStart: function(gestureParams) {
                var that = this;
                that._startGesture = that._startGesture || gestureParams;
                if (that._startGesture.touches !== gestureParams.touches)
                    that._startGesture = gestureParams
            },
            _gestureChange: function(gestureParams) {
                var that = this,
                    startGesture = that._startGesture,
                    gestureChanged = false,
                    scrollingEnabled = that._scrollingMode === 'all' || that._scrollingMode !== 'none' && that._scrollingMode === gestureParams.pointerType,
                    zoommingEnabled = that._zoomingMode === 'all' || that._zoomingMode === 'touch';
                if (!startGesture)
                    return gestureChanged;
                if (startGesture.touches === 1 && math.abs(startGesture.center - gestureParams.center) < 3) {
                    that._gestureStart(gestureParams);
                    return gestureChanged
                }
                if (startGesture.touches === 2 && zoommingEnabled) {
                    gestureChanged = true;
                    startGesture.scale = gestureParams.distance / startGesture.distance;
                    startGesture.scroll = gestureParams.center - startGesture.center + (startGesture.center - startGesture.center * startGesture.scale)
                }
                else if (startGesture.touches === 1 && scrollingEnabled) {
                    gestureChanged = true;
                    startGesture.scroll = gestureParams.center - startGesture.center
                }
                if (gestureChanged) {
                    startGesture.changed = gestureChanged;
                    that._chart._transformArgument(startGesture.scroll, startGesture.scale)
                }
                return gestureChanged
            },
            _gestureEnd: function() {
                var that = this,
                    startGesture = that._startGesture,
                    zoom,
                    renderer = that._renderer;
                that._startGesture = null;
                function complete() {
                    that._chart.zoomArgument(zoom.min, zoom.max, true)
                }
                if (startGesture && startGesture.changed) {
                    zoom = that._argumentAxis._translator.zoom(-startGesture.scroll, startGesture.scale);
                    if (renderer.animationEnabled() && (-startGesture.scroll !== zoom.translate || startGesture.scale !== zoom.scale)) {
                        var translateDelta = -(startGesture.scroll + zoom.translate),
                            scaleDelta = startGesture.scale - zoom.scale;
                        renderer.root.animate({_: 0}, {
                            step: function(pos) {
                                var translateValue = -startGesture.scroll - translateDelta * pos,
                                    scaleValue = startGesture.scale - scaleDelta * pos;
                                that._chart._transformArgument(-translateValue, scaleValue)
                            },
                            complete: complete,
                            duration: 250
                        })
                    }
                    else
                        complete()
                }
            },
            _clean: function() {
                var that = this;
                baseTrackerPrototype._clean.call(that);
                that._resetTimer();
                that._stickedSeries = null
            },
            _getSeriesForShared: function(x, y) {
                var that = this,
                    points = [],
                    point = null,
                    distance = Infinity;
                if (that._tooltip.isShared() && !that.hoveredSeries) {
                    _each(that._storedSeries, function(_, series) {
                        var point = series.getNeighborPoint(x, y);
                        point && points.push(point)
                    });
                    _each(points, function(_, p) {
                        var coords = p.getCrosshairData(x, y),
                            d = math.sqrt((x - coords.x) * (x - coords.x) + (y - coords.y) * (y - coords.y));
                        if (d < distance) {
                            point = p;
                            distance = d
                        }
                    })
                }
                return point && point.series
            },
            _setTimeout: function(callback, keeper) {
                var that = this;
                if (that._timeoutKeeper !== keeper) {
                    that._resetTimer();
                    that._hoverTimeout = setTimeout(function() {
                        callback();
                        that._timeoutKeeper = null
                    }, DELAY);
                    that._timeoutKeeper = keeper
                }
            },
            _resetTimer: function() {
                clearTimeout(this._hoverTimeout);
                this._timeoutKeeper = this._hoverTimeout = null
            },
            _pointerHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = that._renderer.getRootOffset(),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    canvas = that._getCanvas(x, y),
                    series = getData(e, SERIES_DATA),
                    point = getData(e, POINT_DATA) || series && series.getPointByCoord(x, y);
                that._enableOutHandler();
                that._x = x;
                that._y = y;
                if (e.type === pointerEvents.down)
                    canvas && that._gestureStart(that._getGestureParams(e, rootOffset));
                else if (that._startGesture && canvas)
                    if (that._gestureChange(that._getGestureParams(e, rootOffset))) {
                        that._pointerOut();
                        e.preventDefault();
                        return
                    }
                if (that._legend.coordsIn(x, y)) {
                    var item = that._legend.getItemByCoord(x, y);
                    if (item) {
                        series = that._storedSeries[item.id];
                        that._setHoveredSeries(series, that._legend._options.hoverMode);
                        that._stickedSeries = series
                    }
                    else
                        that._clearHover();
                    that._hideCrosshair();
                    return
                }
                if (that._axisHoverEnabled && that._argumentAxis.coordsIn(x, y)) {
                    var argument = getData(e, ARG_DATA),
                        argumentDefined = isDefined(argument);
                    if (argumentDefined && that.hoveredArgument !== argument) {
                        that._clearHover();
                        that._resetHoveredArgument();
                        that._toAllArgumentPoints(argument, "setPointHoverState");
                        that.hoveredArgument = argument
                    }
                    else if (!argumentDefined)
                        that._resetHoveredArgument();
                    return
                }
                that._resetHoveredArgument();
                that._focusOnCanvas(canvas);
                if (!canvas && !point)
                    return;
                if (!series && !point)
                    that._stickedSeries = that._stickedSeries || that._getSeriesForShared(x, y);
                if (series && !point) {
                    point = series.getNeighborPoint(x, y);
                    if (series !== that.hoveredSeries) {
                        that._setTimeout(function() {
                            that._setHoveredSeries(series, series.getOptions().hoverMode);
                            that._stickedSeries = series;
                            that._pointerComplete(point)
                        }, series);
                        return
                    }
                }
                else if (point) {
                    if (that.hoveredSeries)
                        that._setTimeout(function() {
                            that._pointerOnPoint(point)
                        }, point);
                    else {
                        that._pointerOnPoint(point);
                        that._seriesWithHoverView = point.series.setHoverView()
                    }
                    return
                }
                else if (that._stickedSeries) {
                    series = that._stickedSeries;
                    point = series.getNeighborPoint(x, y);
                    that._releaseHoveredSeries(false);
                    point && that._setHoveredPoint(point)
                }
                that._pointerComplete(point)
            },
            _pointerOnPoint: function(point) {
                var that = this,
                    seriesWithHoverView = that._seriesWithHoverView,
                    seriesFromPoint = point.series;
                that._stickedSeries = seriesFromPoint;
                that._setHoveredPoint(point);
                that._releaseHoveredSeries(!seriesWithHoverView || seriesWithHoverView === seriesFromPoint, point);
                that._pointerComplete(point)
            },
            _pointerComplete: function(point) {
                var that = this;
                that.hoveredSeries && that.hoveredSeries.updateHover(that._x, that._y);
                that._resetTimer();
                that._moveCrosshair(point, that._x, that._y);
                that.pointAtShownTooltip !== point && that._tooltip.isEnabled() && that._showTooltip(point)
            },
            _pointerOut: function() {
                var that = this;
                that._stickedSeries = null;
                that._hideCrosshair();
                that._resetHoveredArgument();
                that._resetTimer();
                baseTrackerPrototype._pointerOut.call(that)
            },
            _clickHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = that._renderer.getRootOffset(),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    point = getData(e, POINT_DATA),
                    series = that._stickedSeries || getData(e, SERIES_DATA) || point && point.series,
                    axis = that._argumentAxis;
                if (that._legend.coordsIn(x, y)) {
                    var item = that._legend.getItemByCoord(x, y);
                    if (item) {
                        series = that._storedSeries[item.id];
                        that._legendClick({
                            target: series,
                            jQueryEvent: e
                        }, SERIES_CLICK)
                    }
                    return
                }
                if (axis && axis.coordsIn(x, y)) {
                    var argument = getData(e, ARG_DATA);
                    if (isDefined(argument)) {
                        that._eventTrigger("argumentAxisClick", {
                            argument: argument,
                            jQueryEvent: e
                        });
                        return
                    }
                }
                if (series) {
                    point = point || series.getPointByCoord(x, y);
                    if (point)
                        that._pointClick(point, e);
                    else
                        getData(e, SERIES_DATA) && that._eventTrigger(SERIES_CLICK, {
                            target: series,
                            jQueryEvent: e
                        })
                }
            },
            dispose: function() {
                this._gestureEndHandler && $(document).off(pointerEvents.up, this._gestureEndHandler);
                this._resetTimer();
                baseTrackerPrototype.dispose.call(this)
            }
        });
        charts.PieTracker = function(options) {
            this.ctor(options)
        };
        $.extend(charts.PieTracker.prototype, baseTrackerPrototype, {
            _pointerHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = that._renderer.getRootOffset(),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    point = getData(e, POINT_DATA),
                    mode,
                    item;
                that._enableOutHandler();
                if (that._legend.coordsIn(x, y)) {
                    item = that._legend.getItemByCoord(x, y);
                    if (item)
                        _each(that._storedSeries, function(_, singleSeries) {
                            _each(singleSeries.getPointsByArg(item.argument), function(_, p) {
                                if (p.index === item.id) {
                                    point = p;
                                    return false
                                }
                            });
                            if (point)
                                return false
                        });
                    mode = _normalizeEnum(that._legend._options.hoverMode)
                }
                if (point && point !== that.hoveredPoint) {
                    !item && that._tooltip.isEnabled() && that._showTooltip(point);
                    that._setHoveredPoint(point, mode)
                }
                else if (!point)
                    that._pointerOut()
            },
            _toAllArgumentPoints: function(argument, func, eventName, targetPoint, legendCallback) {
                var that = this;
                that._hoveredArgumentPoints = true;
                _each(getArgumentPointsByIndex(that._storedSeries, argument, targetPoint.index), function(_, currentPoint) {
                    var series = currentPoint.series,
                        obj = {
                            point: currentPoint,
                            setState: true
                        };
                    if (currentPoint === targetPoint)
                        obj.legendCallback = legendCallback;
                    series[func](obj);
                    that._eventTrigger(eventName, {target: currentPoint})
                })
            },
            _releasePoint: function(point, eventTrigger) {
                var that = this;
                if (that._hoveredArgumentPoints) {
                    that._hoveredArgumentPoints = null;
                    _each(getArgumentPointsByIndex(that._storedSeries, point.argument, point.index), function(_, argumentPoint) {
                        argumentPoint.releaseHoverState(that.legendCallback(argumentPoint));
                        eventTrigger(POINT_HOVER_CHANGED, {target: argumentPoint})
                    })
                }
                else if (_normalizeEnum(point.getOptions().hoverMode) !== NONE_MODE) {
                    point.releaseHoverState(that.legendCallback(point));
                    eventTrigger(POINT_HOVER_CHANGED, {target: point})
                }
            },
            _clickHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = that._renderer.getRootOffset(),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    eventTrigger = that._eventTrigger,
                    legend = that._legend,
                    points,
                    point,
                    argument,
                    item;
                if (legend.coordsIn(x, y)) {
                    item = legend.getItemByCoord(x, y);
                    if (item) {
                        argument = item.argument;
                        if (that._storedSeries.length === 1) {
                            points = getArgumentPointsByIndex(that._storedSeries, argument, item.id);
                            that._legendClick({
                                target: points[0],
                                jQueryEvent: e
                            }, POINT_CLICK)
                        }
                        else
                            eventTrigger(LEGEND_CLICK, {
                                target: argument,
                                jQueryEvent: e
                            })
                    }
                }
                else {
                    point = getData(e, POINT_DATA);
                    point && eventTrigger(POINT_CLICK, {
                        target: point,
                        jQueryEvent: e
                    })
                }
            }
        })
    })(jQuery, DevExpress, Math);
    /*! Module viz-charts, file crosshair.js */
    (function($, DX, undefined) {
        var math = Math,
            mathAbs = math.abs,
            mathMin = math.min,
            mathMax = math.max,
            mathFloor = math.floor,
            HORIZONTAL = "horizontal",
            VERTICAL = "vertical",
            LABEL_BACKGROUND_PADDING_X = 8,
            LABEL_BACKGROUND_PADDING_Y = 4,
            CENTER = "center",
            RIGHT = "right",
            LEFT = "left",
            TOP = "top",
            BOTTOM = "bottom";
        function Crosshair(renderer, options, params, group) {
            var that = this;
            that._renderer = renderer;
            that._crosshairGroup = group;
            that._options = {};
            that.update(options, params)
        }
        DX.viz.charts.Crosshair = Crosshair;
        Crosshair.prototype = {
            constructor: Crosshair,
            update: function(options, params) {
                var that = this,
                    canvas = params.canvas;
                that._canvas = {
                    top: canvas.top,
                    bottom: canvas.height - canvas.bottom,
                    left: canvas.left,
                    right: canvas.width - canvas.right,
                    width: canvas.width,
                    height: canvas.height
                };
                that._axes = params.axes;
                that._panes = params.panes;
                that._prepareOptions(options, HORIZONTAL);
                that._prepareOptions(options, VERTICAL)
            },
            dispose: function() {
                var that = this;
                that._renderer = null;
                that._crosshairGroup = null;
                that._options = null;
                that._axes = null;
                that._canvas = null;
                that._horizontalGroup = null;
                that._verticalGroup = null;
                that._horizontal = null;
                that._vertical = null;
                that._circle = null;
                that._panes = null
            },
            _prepareOptions: function(options, direction) {
                var lineOptions = options[direction + "Line"];
                this._options[direction] = {
                    visible: lineOptions.visible,
                    line: {
                        stroke: lineOptions.color || options.color,
                        "stroke-width": lineOptions.width || options.width,
                        dashStyle: lineOptions.dashStyle || options.dashStyle,
                        opacity: lineOptions.opacity || options.opacity,
                        "stroke-linecap": "butt"
                    },
                    label: $.extend(true, {}, options.label, lineOptions.label)
                }
            },
            _createLines: function(options, sharpParam, group) {
                var lines = [],
                    canvas = this._canvas,
                    points = [canvas.left, canvas.top, canvas.left, canvas.top];
                for (var i = 0; i < 2; i++)
                    lines.push(this._renderer.path(points, "line").attr(options).sharp(sharpParam).append(group));
                return lines
            },
            render: function() {
                var that = this,
                    renderer = that._renderer,
                    options = that._options,
                    verticalOptions = options.vertical,
                    horizontalOptions = options.horizontal,
                    extraOptions = horizontalOptions.visible ? horizontalOptions.line : verticalOptions.line,
                    circleOptions = {
                        stroke: extraOptions.stroke,
                        "stroke-width": extraOptions["stroke-width"],
                        dashStyle: extraOptions.dashStyle,
                        opacity: extraOptions.opacity
                    },
                    canvas = that._canvas;
                that._horizontal = {};
                that._vertical = {};
                that._horizontalGroup = renderer.g().append(that._crosshairGroup);
                that._verticalGroup = renderer.g().append(that._crosshairGroup);
                if (verticalOptions.visible) {
                    that._vertical.lines = that._createLines(verticalOptions.line, "h", that._verticalGroup);
                    that._vertical.labels = that._createLabels(that._axes[0], verticalOptions, false, that._verticalGroup)
                }
                if (horizontalOptions.visible) {
                    that._horizontal.lines = that._createLines(horizontalOptions.line, "v", that._horizontalGroup);
                    that._horizontal.labels = that._createLabels(that._axes[1], horizontalOptions, true, that._horizontalGroup)
                }
                that._circle = renderer.circle(canvas.left, canvas.top, 0).attr(circleOptions).append(that._crosshairGroup);
                that.hide()
            },
            _createLabels: function(axes, options, isHorizontal, group) {
                var that = this,
                    canvas = that._canvas,
                    renderer = that._renderer,
                    x,
                    y,
                    text,
                    labels = [],
                    background,
                    curentLabelPos,
                    bbox;
                if (!options.label || !options.label.visible)
                    return;
                $.each(axes, function(_, axis) {
                    var position = axis.getOptions().position;
                    if (axis.getTranslator().getBusinessRange().stubData)
                        return;
                    curentLabelPos = axis.getCurrentLabelPos();
                    if (isHorizontal) {
                        y = canvas.top;
                        x = curentLabelPos
                    }
                    else {
                        x = canvas.left;
                        y = curentLabelPos
                    }
                    text = renderer.text("0", x, y).css(DX.viz.utils.patchFontOptions(options.label.font)).attr({align: position === TOP || position === BOTTOM ? CENTER : position === RIGHT ? LEFT : RIGHT}).append(group);
                    bbox = text.getBBox();
                    text.attr({y: isHorizontal ? 2 * y - bbox.y - bbox.height / 2 : position === BOTTOM ? 2 * y - bbox.y : 2 * y - (bbox.y + bbox.height)});
                    background = renderer.rect(0, 0, 0, 0).attr({fill: options.label.backgroundColor || options.line.stroke}).append(group).toBackground();
                    labels.push({
                        text: text,
                        background: background,
                        axis: axis,
                        pos: {
                            coord: curentLabelPos,
                            side: position
                        }
                    })
                });
                return labels
            },
            _updateText: function(value, labels, axis) {
                var that = this,
                    bbox,
                    text,
                    textElement,
                    backgroundElement;
                if (!labels)
                    return;
                $.each(labels, function(i, label) {
                    text = "";
                    textElement = label.text;
                    backgroundElement = label.background;
                    if (!textElement)
                        return;
                    if (!label.axis.name || label.axis.name === axis)
                        text = label.axis.getFormattedValue(value);
                    if (text) {
                        textElement.attr({text: text});
                        bbox = textElement.getBBox();
                        that._updateLinesCanvas(label.pos.side, label.pos.coord);
                        backgroundElement.attr({
                            x: bbox.x - LABEL_BACKGROUND_PADDING_X,
                            y: bbox.y - LABEL_BACKGROUND_PADDING_Y,
                            width: bbox.width + LABEL_BACKGROUND_PADDING_X * 2,
                            height: bbox.height + LABEL_BACKGROUND_PADDING_Y * 2
                        })
                    }
                    else {
                        textElement.attr({text: ""});
                        backgroundElement.attr({
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0
                        })
                    }
                })
            },
            hide: function() {
                this._crosshairGroup.attr({visibility: "hidden"})
            },
            _updateLinesCanvas: function(position, labelPosition) {
                var coords = this._linesCanvas,
                    canvas = this._canvas;
                coords[position] = coords[position] !== canvas[position] && mathAbs(coords[position] - canvas[position]) < mathAbs(labelPosition - canvas[position]) ? coords[position] : labelPosition
            },
            _updateLines: function(lines, x, y, r, isHorizontal) {
                var coords = this._linesCanvas,
                    canvas = this._canvas,
                    points = isHorizontal ? [[mathMin(x - r, coords.left), canvas.top, x - r, canvas.top], [x + r, canvas.top, mathMax(coords.right, x + r), canvas.top]] : [[canvas.left, mathMin(coords.top, y - r), canvas.left, y - r], [canvas.left, y + r, canvas.left, mathMax(coords.bottom, y + r)]];
                for (var i = 0; i < 2; i++)
                    lines[i].attr({points: points[i]})
            },
            _resetLinesCanvas: function() {
                var canvas = this._canvas;
                this._linesCanvas = {
                    left: canvas.left,
                    right: canvas.right,
                    top: canvas.top,
                    bottom: canvas.bottom
                }
            },
            _getClipRectForPane: function(x, y) {
                var panes = this._panes,
                    i,
                    coords;
                for (i = 0; i < panes.length; i++) {
                    coords = panes[i].coords;
                    if (coords.left <= x && coords.right >= x && coords.top <= y && coords.bottom >= y)
                        return panes[i].clipRect
                }
                return {id: null}
            },
            show: function(data, r) {
                var that = this,
                    horizontal = that._horizontal,
                    vertical = that._vertical,
                    clipRect,
                    rad = !r ? 0 : r + 3,
                    canvas = that._canvas,
                    x = mathFloor(data.x),
                    y = mathFloor(data.y);
                if (x >= canvas.left && x <= canvas.right && y >= canvas.top && y <= canvas.bottom) {
                    that._crosshairGroup.attr({visibility: "visible"});
                    that._resetLinesCanvas();
                    clipRect = that._getClipRectForPane(x, y);
                    that._circle.attr({
                        cx: x,
                        cy: y,
                        r: rad,
                        clipId: clipRect.id
                    });
                    if (horizontal.lines) {
                        that._updateText(data.yValue, horizontal.labels, data.axis);
                        that._updateLines(horizontal.lines, x, y, rad, true);
                        that._horizontalGroup.attr({translateY: y - canvas.top})
                    }
                    if (vertical.lines) {
                        that._updateText(data.xValue, vertical.labels, data.axis);
                        that._updateLines(vertical.lines, x, y, rad, false);
                        that._verticalGroup.attr({translateX: x - canvas.left})
                    }
                }
                else
                    that.hide()
            }
        }
    })(jQuery, DevExpress);
    DevExpress.MOD_VIZ_CHARTS = true
}