/*! 
* DevExtreme (Sparklines)
* Version: 15.1.5
* Build date: Jul 15, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!DevExpress.MOD_VIZ_SPARKLINES) {
    if (!DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-sparklines, file baseSparkline.js */
    (function($, DX, undefined) {
        var DEFAULT_LINE_SPACING = 2,
            DEFAULT_EVENTS_DELAY = 200,
            TOUCH_EVENTS_DELAY = 1000,
            _extend = $.extend,
            _abs = Math.abs,
            core = DX.viz.core,
            _noop = $.noop;
        function generateDefaultCustomizeTooltipCallback(fontOptions, rtlEnabled) {
            var lineSpacing = fontOptions.lineSpacing,
                lineHeight = (lineSpacing !== undefined && lineSpacing !== null ? lineSpacing : DEFAULT_LINE_SPACING) + fontOptions.size;
            DX.viz.sparklines.generated_customize_tooltip = function() {
                return {
                        lineHeight: lineHeight,
                        rtlEnabled: rtlEnabled
                    }
            };
            return function(customizeObject) {
                    var html = "",
                        vt = customizeObject.valueText;
                    for (var i = 0; i < vt.length; i += 2)
                        html += "<tr><td>" + vt[i] + "</td><td style='width: 15px'></td><td style='text-align: " + (rtlEnabled ? "left" : "right") + "'>" + vt[i + 1] + "</td></tr>";
                    return {html: "<table style='border-spacing:0px; line-height: " + lineHeight + "px'>" + html + "</table>"}
                }
        }
        DX.viz.sparklines = {};
        DX.viz.sparklines.BaseSparkline = core.BaseWidget.inherit({
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {
                    "tooltip.verticalAlignment": {
                        since: "15.1",
                        message: "Now tootips are aligned automatically"
                    },
                    "tooltip.horizontalAlignment": {
                        since: "15.1",
                        message: "Now tootips are aligned automatically"
                    }
                })
            },
            _clean: function() {
                var that = this;
                if (that._tooltipShown) {
                    that._tooltipShown = false;
                    that._tooltip.hide()
                }
                that._cleanWidgetElements();
                that._cleanTranslators()
            },
            _initCore: function() {
                var that = this;
                that._tooltipTracker = that._renderer.root;
                that._tooltipTracker.attr({"pointer-events": "visible"});
                that._createHtmlElements();
                that._initTooltipEvents()
            },
            _initTooltip: function() {
                this._initTooltipBase = this.callBase;
                return
            },
            _getDefaultSize: function() {
                return this._defaultSize
            },
            _isContainerVisible: function() {
                return true
            },
            _disposeCore: function() {
                this._disposeWidgetElements();
                this._disposeTooltipEvents();
                this._ranges = null
            },
            _render: function() {
                this._prepareOptions();
                this._updateWidgetElements();
                this._drawWidgetElements()
            },
            _updateWidgetElements: function() {
                this._updateRange();
                this._updateTranslator()
            },
            _applySize: function() {
                if (this._allOptions)
                    this._allOptions.size = {
                        width: this._canvas.width,
                        height: this._canvas.height
                    }
            },
            _cleanTranslators: function() {
                this._translatorX = null;
                this._translatorY = null
            },
            _setupResizeHandler: _noop,
            _resize: function() {
                var that = this;
                that._redrawWidgetElements();
                if (that._tooltipShown) {
                    that._tooltipShown = false;
                    that._tooltip.hide()
                }
                that._drawn()
            },
            _prepareOptions: function() {
                return _extend(true, {}, this._themeManager.theme(), this.option())
            },
            _createThemeManager: function() {
                var themeManager = new DX.viz.core.BaseThemeManager;
                themeManager._themeSection = this._widgetType;
                themeManager._fontFields = ["tooltip.font"];
                return themeManager
            },
            _getTooltipCoords: function() {
                var canvas = this._canvas,
                    rootOffset = this._renderer.getRootOffset();
                return {
                        x: canvas.width / 2 + rootOffset.left,
                        y: canvas.height / 2 + rootOffset.top
                    }
            },
            _initTooltipEvents: function() {
                var that = this,
                    data = {widget: that};
                that._showTooltipCallback = function() {
                    var tooltip;
                    that._showTooltipTimeout = null;
                    if (!that._tooltipShown) {
                        that._tooltipShown = true;
                        tooltip = that._getTooltip();
                        tooltip.isEnabled() && that._tooltip.show(that._getTooltipData(), that._getTooltipCoords(), {})
                    }
                    that._DEBUG_showCallback && that._DEBUG_showCallback()
                };
                that._hideTooltipCallback = function() {
                    var tooltipWasShown = that._tooltipShown;
                    that._hideTooltipTimeout = null;
                    if (that._tooltipShown) {
                        that._tooltipShown = false;
                        that._tooltip.hide()
                    }
                    that._DEBUG_hideCallback && that._DEBUG_hideCallback(tooltipWasShown)
                };
                that._disposeCallbacks = function() {
                    that = that._showTooltipCallback = that._hideTooltipCallback = that._disposeCallbacks = null
                };
                that._tooltipTracker.on(mouseEvents, data).on(touchEvents, data).on(mouseWheelEvents, data);
                that._tooltipTracker.on(menuEvents)
            },
            _disposeTooltipEvents: function() {
                var that = this;
                clearTimeout(that._showTooltipTimeout);
                clearTimeout(that._hideTooltipTimeout);
                that._tooltipTracker.off();
                that._disposeCallbacks()
            },
            _updateTranslator: function() {
                var that = this,
                    canvas = this._canvas,
                    ranges = this._ranges;
                that._translatorX = new core.Translator2D(ranges.arg, canvas, {direction: "horizontal"});
                that._translatorY = new core.Translator2D(ranges.val, canvas)
            },
            _getTooltip: function() {
                var that = this;
                if (!that._tooltip) {
                    that._initTooltipBase();
                    that._setTooltipRendererOptions(that._tooltipRendererOptions);
                    that._tooltipRendererOptions = null;
                    that._setTooltipOptions()
                }
                return that._tooltip
            },
            _setTooltipRendererOptions: function(options) {
                if (this._tooltip)
                    this._tooltip.setRendererOptions(options);
                else
                    this._tooltipRendererOptions = options
            },
            _setTooltipOptions: function() {
                var tooltip = this._tooltip,
                    options = tooltip && this._getOption("tooltip");
                tooltip && tooltip.update($.extend({}, options, {
                    customizeTooltip: !$.isFunction(options.customizeTooltip) ? generateDefaultCustomizeTooltipCallback(options.font, this.option("rtlEnabled")) : options.customizeTooltip,
                    enabled: options.enabled && this._isTooltipEnabled()
                }))
            },
            _showTooltip: function(delay) {
                var that = this;
                ++that._DEBUG_clearHideTooltipTimeout;
                clearTimeout(that._hideTooltipTimeout);
                that._hideTooltipTimeout = null;
                clearTimeout(that._showTooltipTimeout);
                ++that._DEBUG_showTooltipTimeoutSet;
                that._showTooltipTimeout = setTimeout(that._showTooltipCallback, delay)
            },
            _hideTooltip: function(delay) {
                var that = this;
                ++that._DEBUG_clearShowTooltipTimeout;
                clearTimeout(that._showTooltipTimeout);
                that._showTooltipTimeout = null;
                clearTimeout(that._hideTooltipTimeout);
                if (delay) {
                    ++that._DEBUG_hideTooltipTimeoutSet;
                    that._hideTooltipTimeout = setTimeout(that._hideTooltipCallback, delay)
                }
                else
                    that._hideTooltipCallback()
            },
            _endLoading: function(complete) {
                complete()
            },
            _initLoadingIndicator: _noop,
            _disposeLoadingIndicator: _noop,
            _handleLoadingIndicatorOptionChanged: _noop,
            _updateLoadingIndicatorOptions: _noop,
            _updateLoadingIndicatorCanvas: _noop,
            showLoadingIndicator: _noop,
            hideLoadingIndicator: _noop
        });
        var menuEvents = {
                "contextmenu.sparkline-tooltip": function(event) {
                    if (DX.ui.events.isTouchEvent(event) || DX.ui.events.isPointerEvent(event))
                        event.preventDefault()
                },
                "MSHoldVisual.sparkline-tooltip": function(event) {
                    event.preventDefault()
                }
            };
        var mouseEvents = {
                "mouseover.sparkline-tooltip": function(event) {
                    isPointerDownCalled = false;
                    var widget = event.data.widget;
                    widget._x = event.pageX;
                    widget._y = event.pageY;
                    widget._tooltipTracker.off(mouseMoveEvents).on(mouseMoveEvents, event.data);
                    widget._showTooltip(DEFAULT_EVENTS_DELAY)
                },
                "mouseout.sparkline-tooltip": function(event) {
                    if (isPointerDownCalled)
                        return;
                    var widget = event.data.widget;
                    widget._tooltipTracker.off(mouseMoveEvents);
                    widget._hideTooltip(DEFAULT_EVENTS_DELAY)
                }
            };
        var mouseWheelEvents = {"dxmousewheel.sparkline-tooltip": function(event) {
                    event.data.widget._hideTooltip()
                }};
        var mouseMoveEvents = {"mousemove.sparkline-tooltip": function(event) {
                    var widget = event.data.widget;
                    if (widget._showTooltipTimeout && (_abs(widget._x - event.pageX) > 3 || _abs(widget._y - event.pageY) > 3)) {
                        widget._x = event.pageX;
                        widget._y = event.pageY;
                        widget._showTooltip(DEFAULT_EVENTS_DELAY)
                    }
                }};
        var active_touch_tooltip_widget = null,
            touchstartTooltipProcessing = function(event) {
                event.preventDefault();
                var widget = active_touch_tooltip_widget;
                if (widget && widget !== event.data.widget)
                    widget._hideTooltip(DEFAULT_EVENTS_DELAY);
                widget = active_touch_tooltip_widget = event.data.widget;
                widget._showTooltip(TOUCH_EVENTS_DELAY);
                widget._touch = true
            },
            touchstartDocumentProcessing = function() {
                var widget = active_touch_tooltip_widget;
                if (widget) {
                    if (!widget._touch) {
                        widget._hideTooltip(DEFAULT_EVENTS_DELAY);
                        active_touch_tooltip_widget = null
                    }
                    widget._touch = null
                }
            },
            touchendDocumentProcessing = function() {
                var widget = active_touch_tooltip_widget;
                if (widget)
                    if (widget._showTooltipTimeout) {
                        widget._hideTooltip(DEFAULT_EVENTS_DELAY);
                        active_touch_tooltip_widget = null
                    }
            },
            isPointerDownCalled = false;
        var touchEvents = {
                "pointerdown.sparkline-tooltip": touchstartTooltipProcessing,
                "touchstart.sparkline-tooltip": touchstartTooltipProcessing
            };
        $(document).on({
            "pointerdown.sparkline-tooltip": function() {
                isPointerDownCalled = true;
                touchstartDocumentProcessing()
            },
            "touchstart.sparkline-tooltip": touchstartDocumentProcessing,
            "pointerup.sparkline-tooltip": touchendDocumentProcessing,
            "touchend.sparkline-tooltip": touchendDocumentProcessing
        });
        DX.viz.sparklines.BaseSparkline._DEBUG_reset = function() {
            active_touch_tooltip_widget = null
        }
    })(jQuery, DevExpress);
    /*! Module viz-sparklines, file sparkline.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            core = viz.core,
            MIN_BAR_WIDTH = 1,
            MAX_BAR_WIDTH = 50,
            DEFAULT_BAR_INTERVAL = 4,
            DEFAULT_CANVAS_WIDTH = 250,
            DEFAULT_CANVAS_HEIGHT = 30,
            DEFAULT_HORIZONTAL_MARGIN = 5,
            DEFAULT_VERTICAL_MARGIN = 3,
            ALLOWED_TYPES = {
                line: true,
                spline: true,
                stepline: true,
                area: true,
                steparea: true,
                splinearea: true,
                bar: true,
                winloss: true
            },
            _map = $.map,
            _math = Math,
            _abs = _math.abs,
            _round = _math.round,
            _max = _math.max,
            _min = _math.min,
            _isFinite = isFinite,
            _isDefined = DX.utils.isDefined,
            _Number = Number,
            _String = String;
        DX.registerComponent("dxSparkline", viz.sparklines, viz.sparklines.BaseSparkline.inherit({
            _rootClassPrefix: "dxsl",
            _rootClass: "dxsl-sparkline",
            _widgetType: "sparkline",
            _defaultSize: {
                width: DEFAULT_CANVAS_WIDTH,
                height: DEFAULT_CANVAS_HEIGHT,
                left: DEFAULT_HORIZONTAL_MARGIN,
                right: DEFAULT_HORIZONTAL_MARGIN,
                top: DEFAULT_VERTICAL_MARGIN,
                bottom: DEFAULT_VERTICAL_MARGIN
            },
            _initCore: function() {
                this.callBase();
                this._refreshDataSource();
                this._createSeries()
            },
            _dataSourceChangedHandler: function() {
                if (this._initialized) {
                    this._clean();
                    this._updateWidgetElements();
                    this._drawWidgetElements()
                }
            },
            _updateWidgetElements: function() {
                this._updateSeries();
                this.callBase()
            },
            _dataSourceOptions: function() {
                return {paginate: false}
            },
            _redrawWidgetElements: function() {
                this._updateTranslator();
                this._correctPoints();
                this._series.draw({
                    x: this._translatorX,
                    y: this._translatorY
                });
                this._seriesGroup.append(this._renderer.root)
            },
            _disposeWidgetElements: function() {
                var that = this;
                delete that._seriesGroup;
                delete that._seriesLabelGroup;
                that._series && that._series.dispose();
                that._series = null
            },
            _cleanWidgetElements: function() {
                this._seriesGroup.remove();
                this._seriesLabelGroup.remove();
                this._seriesGroup.clear();
                this._seriesLabelGroup.clear()
            },
            _drawWidgetElements: function() {
                if (this._isDataSourceReady()) {
                    this._drawSeries();
                    this._drawn()
                }
            },
            _prepareOptions: function() {
                this._allOptions = this.callBase();
                this._allOptions.type = _String(this._allOptions.type).toLowerCase();
                if (!ALLOWED_TYPES[this._allOptions.type])
                    this._allOptions.type = "line"
            },
            _createHtmlElements: function() {
                this._seriesGroup = this._renderer.g().attr({"class": "dxsl-series"});
                this._seriesLabelGroup = this._renderer.g().attr({"class": "dxsl-series-labels"})
            },
            _createSeries: function() {
                this._series = new core.series.Series({
                    renderer: this._renderer,
                    seriesGroup: this._seriesGroup,
                    labelsGroup: this._seriesLabelGroup
                }, {
                    widgetType: "chart",
                    type: "line"
                })
            },
            getSeriesOptions: function() {
                return this._series.getOptions()
            },
            _updateSeries: function() {
                var that = this,
                    groupSeries,
                    dataValidator,
                    seriesOptions;
                that._prepareDataSource();
                seriesOptions = that._prepareSeriesOptions();
                that._series.updateOptions(seriesOptions);
                groupSeries = [[that._series]];
                groupSeries.argumentOptions = {type: seriesOptions.type === "bar" ? "discrete" : undefined};
                dataValidator = new core.DataValidator(that._simpleDataSource, groupSeries, that._incidentOccured, {
                    checkTypeForAllData: false,
                    convertToAxisDataType: true,
                    sortingMethod: true
                });
                that._simpleDataSource = dataValidator.validate();
                that._series.updateData(that._simpleDataSource)
            },
            _optionChanged: function(args) {
                if (args.name === "dataSource" && this._allOptions)
                    this._refreshDataSource();
                else
                    this.callBase.apply(this, arguments)
            },
            _parseNumericDataSource: function(data, argField, valField) {
                var ignoreEmptyPoints = this.option("ignoreEmptyPoints");
                return _map(data, function(dataItem, index) {
                        var item = null,
                            isDataNumber,
                            value;
                        if (dataItem !== undefined) {
                            item = {};
                            isDataNumber = _isFinite(dataItem);
                            item[argField] = isDataNumber ? _String(index) : dataItem[argField];
                            value = isDataNumber ? dataItem : dataItem[valField];
                            item[valField] = value === null ? ignoreEmptyPoints ? undefined : value : _Number(value);
                            item = item[argField] !== undefined && item[valField] !== undefined ? item : null
                        }
                        return item
                    })
            },
            _parseWinlossDataSource: function(data, argField, valField) {
                var lowBarValue = -1,
                    zeroBarValue = 0,
                    highBarValue = 1,
                    delta = 0.0001,
                    target = this._allOptions.winlossThreshold;
                return _map(data, function(dataItem) {
                        var item = {};
                        item[argField] = dataItem[argField];
                        if (_abs(dataItem[valField] - target) < delta)
                            item[valField] = zeroBarValue;
                        else if (dataItem[valField] > target)
                            item[valField] = highBarValue;
                        else
                            item[valField] = lowBarValue;
                        return item
                    })
            },
            _prepareDataSource: function() {
                var that = this,
                    options = that._allOptions,
                    argField = options.argumentField,
                    valField = options.valueField,
                    dataSource = that._dataSource ? that._dataSource.items() : [],
                    data = that._parseNumericDataSource(dataSource, argField, valField);
                if (options.type === "winloss") {
                    that._winlossDataSource = data;
                    that._simpleDataSource = that._parseWinlossDataSource(data, argField, valField)
                }
                else
                    that._simpleDataSource = data
            },
            _prepareSeriesOptions: function() {
                var that = this,
                    options = that._allOptions,
                    type = options.type === "winloss" ? "bar" : options.type;
                return {
                        visible: true,
                        argumentField: options.argumentField,
                        valueField: options.valueField,
                        color: options.lineColor,
                        width: options.lineWidth,
                        widgetType: "chart",
                        type: type,
                        opacity: type.indexOf("area") !== -1 ? that._allOptions.areaOpacity : undefined,
                        customizePoint: that._getCustomizeFunction(),
                        point: {
                            size: options.pointSize,
                            symbol: options.pointSymbol,
                            border: {
                                visible: true,
                                width: 2
                            },
                            color: options.pointColor,
                            visible: false,
                            hoverStyle: {border: {}},
                            selectionStyle: {border: {}}
                        },
                        border: {
                            color: options.lineColor,
                            width: options.lineWidth,
                            visible: type !== "bar"
                        }
                    }
            },
            _createBarCustomizeFunction: function(pointIndexes) {
                var that = this,
                    options = that._allOptions,
                    winlossData = that._winlossDataSource;
                return function() {
                        var index = this.index,
                            isWinloss = options.type === "winloss",
                            target = isWinloss ? options.winlossThreshold : 0,
                            value = isWinloss ? winlossData[index][options.valueField] : this.value,
                            positiveColor = isWinloss ? options.winColor : options.barPositiveColor,
                            negativeColor = isWinloss ? options.lossColor : options.barNegativeColor,
                            color;
                        if (value >= target)
                            color = positiveColor;
                        else
                            color = negativeColor;
                        if (index === pointIndexes.first || index === pointIndexes.last)
                            color = options.firstLastColor;
                        if (index === pointIndexes.min)
                            color = options.minColor;
                        if (index === pointIndexes.max)
                            color = options.maxColor;
                        return {color: color}
                    }
            },
            _createLineCustomizeFunction: function(pointIndexes) {
                var that = this,
                    options = that._allOptions;
                return function() {
                        var color,
                            index = this.index;
                        if (index === pointIndexes.first || index === pointIndexes.last)
                            color = options.firstLastColor;
                        if (index === pointIndexes.min)
                            color = options.minColor;
                        if (index === pointIndexes.max)
                            color = options.maxColor;
                        return color ? {
                                visible: true,
                                border: {color: color}
                            } : {}
                    }
            },
            _getCustomizeFunction: function() {
                var that = this,
                    options = that._allOptions,
                    dataSource = that._winlossDataSource || that._simpleDataSource,
                    drawnPointIndexes = that._getExtremumPointsIndexes(dataSource),
                    customizeFunction;
                if (options.type === "winloss" || options.type === "bar")
                    customizeFunction = that._createBarCustomizeFunction(drawnPointIndexes);
                else
                    customizeFunction = that._createLineCustomizeFunction(drawnPointIndexes);
                return customizeFunction
            },
            _getExtremumPointsIndexes: function(data) {
                var that = this,
                    options = that._allOptions,
                    lastIndex = data.length - 1,
                    indexes = {};
                that._minMaxIndexes = that._findMinMax(data);
                if (options.showFirstLast) {
                    indexes.first = 0;
                    indexes.last = lastIndex
                }
                if (options.showMinMax) {
                    indexes.min = that._minMaxIndexes.minIndex;
                    indexes.max = that._minMaxIndexes.maxIndex
                }
                return indexes
            },
            _findMinMax: function(data) {
                var that = this,
                    valField = that._allOptions.valueField,
                    firstItem = data[0] || {},
                    firstValue = firstItem[valField] || 0,
                    min = firstValue,
                    max = firstValue,
                    minIndex = 0,
                    maxIndex = 0,
                    dataLength = data.length,
                    value,
                    i;
                for (i = 1; i < dataLength; i++) {
                    value = data[i][valField];
                    if (value < min) {
                        min = value;
                        minIndex = i
                    }
                    if (value > max) {
                        max = value;
                        maxIndex = i
                    }
                }
                return {
                        minIndex: minIndex,
                        maxIndex: maxIndex
                    }
            },
            _updateRange: function() {
                var that = this,
                    series = that._series,
                    type = series.type,
                    isBarType = type === "bar",
                    isWinlossType = type === "winloss",
                    DEFAULT_VALUE_RANGE_MARGIN = 0.15,
                    DEFAULT_ARGUMENT_RANGE_MARGIN = 0.1,
                    WINLOSS_MAX_RANGE = 1,
                    WINLOSS_MIN_RANGE = -1,
                    rangeData = series.getRangeData(),
                    minValue = that._allOptions.minValue,
                    hasMinY = _isDefined(minValue) && _isFinite(minValue),
                    maxValue = that._allOptions.maxValue,
                    hasMaxY = _isDefined(maxValue) && _isFinite(maxValue),
                    valCoef,
                    argCoef;
                valCoef = (rangeData.val.max - rangeData.val.min) * DEFAULT_VALUE_RANGE_MARGIN;
                if (isBarType || isWinlossType || type === "area") {
                    if (rangeData.val.min !== 0)
                        rangeData.val.min -= valCoef;
                    if (rangeData.val.max !== 0)
                        rangeData.val.max += valCoef
                }
                else {
                    rangeData.val.min -= valCoef;
                    rangeData.val.max += valCoef
                }
                if (hasMinY || hasMaxY) {
                    if (hasMinY && hasMaxY) {
                        rangeData.val.minVisible = _min(minValue, maxValue);
                        rangeData.val.maxVisible = _max(minValue, maxValue)
                    }
                    else {
                        rangeData.val.minVisible = hasMinY ? _Number(minValue) : undefined;
                        rangeData.val.maxVisible = hasMaxY ? _Number(maxValue) : undefined
                    }
                    if (isWinlossType) {
                        rangeData.val.minVisible = hasMinY ? _max(rangeData.val.minVisible, WINLOSS_MIN_RANGE) : undefined;
                        rangeData.val.maxVisible = hasMaxY ? _min(rangeData.val.maxVisible, WINLOSS_MAX_RANGE) : undefined
                    }
                }
                if (series.getPoints().length > 1)
                    if (isBarType) {
                        argCoef = (rangeData.arg.max - rangeData.arg.min) * DEFAULT_ARGUMENT_RANGE_MARGIN;
                        rangeData.arg.min = rangeData.arg.min - argCoef;
                        rangeData.arg.max = rangeData.arg.max + argCoef
                    }
                    else
                        rangeData.arg.stick = true;
                that._ranges = rangeData
            },
            _getBarWidth: function(pointsCount) {
                var that = this,
                    canvas = that._canvas,
                    intervalWidth = pointsCount * DEFAULT_BAR_INTERVAL,
                    rangeWidth = canvas.width - canvas.left - canvas.right - intervalWidth,
                    width = _round(rangeWidth / pointsCount);
                if (width < MIN_BAR_WIDTH)
                    width = MIN_BAR_WIDTH;
                if (width > MAX_BAR_WIDTH)
                    width = MAX_BAR_WIDTH;
                return width
            },
            _correctPoints: function() {
                var that = this,
                    seriesType = that._allOptions.type,
                    seriesPoints = that._series.getPoints(),
                    pointsLength = seriesPoints.length,
                    barWidth,
                    i;
                if (seriesType === "bar" || seriesType === "winloss") {
                    barWidth = that._getBarWidth(pointsLength);
                    for (i = 0; i < pointsLength; i++)
                        seriesPoints[i].correctCoordinates({
                            width: barWidth,
                            offset: 0
                        })
                }
            },
            _drawSeries: function() {
                var that = this;
                if (that._simpleDataSource.length > 0) {
                    that._correctPoints();
                    that._series.draw({
                        x: that._translatorX,
                        y: that._translatorY
                    });
                    that._seriesGroup.append(that._renderer.root)
                }
            },
            _isTooltipEnabled: function() {
                return !!this._simpleDataSource.length
            },
            _getTooltipData: function() {
                var that = this,
                    options = that._allOptions,
                    dataSource = that._winlossDataSource || that._simpleDataSource,
                    tooltip = that._tooltip;
                if (dataSource.length === 0)
                    return {};
                var minMax = that._minMaxIndexes,
                    valueField = options.valueField,
                    first = dataSource[0][valueField],
                    last = dataSource[dataSource.length - 1][valueField],
                    min = dataSource[minMax.minIndex][valueField],
                    max = dataSource[minMax.maxIndex][valueField],
                    formattedFirst = tooltip.formatValue(first),
                    formattedLast = tooltip.formatValue(last),
                    formattedMin = tooltip.formatValue(min),
                    formattedMax = tooltip.formatValue(max),
                    customizeObject = {
                        firstValue: formattedFirst,
                        lastValue: formattedLast,
                        minValue: formattedMin,
                        maxValue: formattedMax,
                        originalFirstValue: first,
                        originalLastValue: last,
                        originalMinValue: min,
                        originalMaxValue: max,
                        valueText: ["Start:", formattedFirst, "End:", formattedLast, "Min:", formattedMin, "Max:", formattedMax]
                    };
                if (options.type === "winloss") {
                    customizeObject.originalThresholdValue = options.winlossThreshold;
                    customizeObject.thresholdValue = tooltip.formatValue(options.winlossThreshold)
                }
                return customizeObject
            }
        }).include(DX.ui.DataHelperMixin))
    })(jQuery, DevExpress);
    /*! Module viz-sparklines, file bullet.js */
    (function($, DX, undefined) {
        var TARGET_MIN_Y = 0.02,
            TARGET_MAX_Y = 0.98,
            BAR_VALUE_MIN_Y = 0.1,
            BAR_VALUE_MAX_Y = 0.9,
            DEFAULT_CANVAS_WIDTH = 300,
            DEFAULT_CANVAS_HEIGHT = 30,
            DEFAULT_HORIZONTAL_MARGIN = 1,
            DEFAULT_VERTICAL_MARGIN = 2,
            _Number = Number,
            _isFinite = isFinite;
        DX.registerComponent("dxBullet", DX.viz.sparklines, DX.viz.sparklines.BaseSparkline.inherit({
            _rootClassPrefix: "dxb",
            _rootClass: "dxb-bullet",
            _widgetType: "bullet",
            _defaultSize: {
                width: DEFAULT_CANVAS_WIDTH,
                height: DEFAULT_CANVAS_HEIGHT,
                left: DEFAULT_HORIZONTAL_MARGIN,
                right: DEFAULT_HORIZONTAL_MARGIN,
                top: DEFAULT_VERTICAL_MARGIN,
                bottom: DEFAULT_VERTICAL_MARGIN
            },
            _disposeWidgetElements: function() {
                delete this._zeroLevelPath;
                delete this._targetPath;
                delete this._barValuePath
            },
            _redrawWidgetElements: function() {
                this._updateTranslator();
                this._drawBarValue();
                this._drawTarget();
                this._drawZeroLevel()
            },
            _cleanWidgetElements: function() {
                this._zeroLevelPath.remove();
                this._targetPath.remove();
                this._barValuePath.remove()
            },
            _drawWidgetElements: function() {
                this._drawBullet();
                this._drawn()
            },
            _createHtmlElements: function() {
                var renderer = this._renderer;
                this._zeroLevelPath = renderer.path(undefined, "line").attr({
                    "class": "dxb-zero-level",
                    "stroke-linecap": "square"
                });
                this._targetPath = renderer.path(undefined, "line").attr({
                    "class": "dxb-target",
                    "stroke-linecap": "square"
                });
                this._barValuePath = renderer.path(undefined, "line").attr({
                    "class": "dxb-bar-value",
                    "stroke-linecap": "square"
                })
            },
            _prepareOptions: function() {
                var that = this,
                    options,
                    startScaleValue,
                    endScaleValue,
                    level,
                    value,
                    target,
                    isValueUndefined,
                    isTargetUndefined;
                that._allOptions = options = that.callBase();
                isValueUndefined = that._allOptions.value === undefined;
                isTargetUndefined = that._allOptions.target === undefined;
                that._tooltipEnabled = !(isValueUndefined && isTargetUndefined);
                if (isValueUndefined)
                    that._allOptions.value = 0;
                if (isTargetUndefined)
                    that._allOptions.target = 0;
                options.value = value = _Number(options.value);
                options.target = target = _Number(options.target);
                if (that._allOptions.startScaleValue === undefined) {
                    that._allOptions.startScaleValue = target < value ? target : value;
                    that._allOptions.startScaleValue = that._allOptions.startScaleValue < 0 ? that._allOptions.startScaleValue : 0
                }
                if (that._allOptions.endScaleValue === undefined)
                    that._allOptions.endScaleValue = target > value ? target : value;
                options.startScaleValue = startScaleValue = _Number(options.startScaleValue);
                options.endScaleValue = endScaleValue = _Number(options.endScaleValue);
                if (endScaleValue < startScaleValue) {
                    level = endScaleValue;
                    that._allOptions.endScaleValue = startScaleValue;
                    that._allOptions.startScaleValue = level;
                    that._allOptions.inverted = true
                }
            },
            _updateRange: function() {
                var that = this,
                    options = that._allOptions;
                that._ranges = {
                    arg: {
                        invert: options.inverted,
                        min: options.startScaleValue,
                        max: options.endScaleValue,
                        axisType: "continuous",
                        dataType: "numeric"
                    },
                    val: {
                        min: 0,
                        max: 1,
                        axisType: "continuous",
                        dataType: "numeric"
                    }
                }
            },
            _drawBullet: function() {
                var that = this,
                    options = that._allOptions,
                    isValidBounds = options.startScaleValue !== options.endScaleValue,
                    isValidMin = _isFinite(options.startScaleValue),
                    isValidMax = _isFinite(options.endScaleValue),
                    isValidValue = _isFinite(options.value),
                    isValidTarget = _isFinite(options.target);
                if (isValidBounds && isValidMax && isValidMin && isValidTarget && isValidValue) {
                    this._drawBarValue();
                    this._drawTarget();
                    this._drawZeroLevel()
                }
            },
            _getTargetParams: function() {
                var that = this,
                    options = that._allOptions,
                    translatorY = that._translatorY,
                    x = that._translatorX.translate(options.target);
                return {
                        points: [x, translatorY.translate(TARGET_MIN_Y), x, translatorY.translate(TARGET_MAX_Y)],
                        stroke: options.targetColor,
                        "stroke-width": options.targetWidth
                    }
            },
            _getBarValueParams: function() {
                var that = this,
                    options = that._allOptions,
                    translatorX = that._translatorX,
                    translatorY = that._translatorY,
                    startLevel = options.startScaleValue,
                    endLevel = options.endScaleValue,
                    value = options.value,
                    y2 = translatorY.translate(BAR_VALUE_MIN_Y),
                    y1 = translatorY.translate(BAR_VALUE_MAX_Y),
                    x1,
                    x2;
                if (value > 0) {
                    x1 = startLevel <= 0 ? 0 : startLevel;
                    x2 = value >= endLevel ? endLevel : value < x1 ? x1 : value
                }
                else {
                    x1 = endLevel >= 0 ? 0 : endLevel;
                    x2 = value < startLevel ? startLevel : value > x1 ? x1 : value
                }
                x1 = translatorX.translate(x1);
                x2 = translatorX.translate(x2);
                return {
                        points: [x1, y1, x2, y1, x2, y2, x1, y2],
                        fill: options.color
                    }
            },
            _getZeroLevelParams: function() {
                var that = this,
                    translatorY = that._translatorY,
                    x = that._translatorX.translate(0);
                return {
                        points: [x, translatorY.translate(TARGET_MIN_Y), x, translatorY.translate(TARGET_MAX_Y)],
                        stroke: that._allOptions.targetColor,
                        "stroke-width": 1
                    }
            },
            _drawZeroLevel: function() {
                var that = this,
                    options = that._allOptions;
                if (0 > options.endScaleValue || 0 < options.startScaleValue || !options.showZeroLevel)
                    return;
                that._zeroLevelPath.attr(that._getZeroLevelParams()).sharp().append(that._renderer.root)
            },
            _drawTarget: function() {
                var that = this,
                    options = that._allOptions,
                    target = options.target;
                if (target > options.endScaleValue || target < options.startScaleValue || !options.showTarget)
                    return;
                that._targetPath.attr(that._getTargetParams()).sharp().append(that._renderer.root)
            },
            _drawBarValue: function() {
                this._barValuePath.attr(this._getBarValueParams()).append(this._renderer.root)
            },
            _getTooltipCoords: function() {
                var canvas = this._canvas,
                    rootOffset = this._renderer.getRootOffset(),
                    bbox = this._barValuePath.getBBox();
                return {
                        x: bbox.x + bbox.width / 2 + rootOffset.left,
                        y: canvas.height / 2 + rootOffset.top
                    }
            },
            _getTooltipData: function() {
                var that = this,
                    tooltip = that._tooltip,
                    options = that._allOptions,
                    value = options.value,
                    target = options.target;
                return {
                        originalValue: value,
                        originalTarget: target,
                        value: tooltip.formatValue(value),
                        target: tooltip.formatValue(target),
                        valueText: ["Actual Value:", value, "Target Value:", target]
                    }
            },
            _isTooltipEnabled: function() {
                return this._tooltipEnabled
            }
        }))
    })(jQuery, DevExpress);
    DevExpress.MOD_VIZ_SPARKLINES = true
}