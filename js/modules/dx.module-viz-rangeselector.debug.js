/*! 
* DevExtreme (Range Selector)
* Version: 15.2.4
* Build date: Dec 8, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!window.DevExpress || !DevExpress.MOD_VIZ_RANGESELECTOR) {
    if (!window.DevExpress || !DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-rangeselector, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz.rangeSelector = {}
    })(DevExpress);
    /*! Module viz-rangeselector, file utils.js */
    (function($, DX, undefined) {
        var commonUtils = DX.require("/utils/utils.common"),
            mathUtils = DX.require("/utils/utils.math"),
            utilsAddInterval = DX.require("/utils/utils.date").addInterval;
        var findLessOrEqualValueIndex = function(values, value) {
                if (!values || values.length === 0)
                    return -1;
                var minIndex = 0,
                    maxIndex = values.length - 1;
                while (maxIndex - minIndex > 1) {
                    var index = minIndex + maxIndex >> 1;
                    if (values[index] > value)
                        maxIndex = index;
                    else
                        minIndex = index
                }
                return values[maxIndex] <= value ? maxIndex : minIndex
            };
        var findLessOrEqualValue = function(values, value) {
                var index = findLessOrEqualValueIndex(values, value);
                if (values && index >= 0 && index < values.length)
                    return values[index];
                return value
            };
        var findNearValue = function(values, value) {
                var index = findLessOrEqualValueIndex(values, value);
                if (values && index >= 0 && index < values.length) {
                    if (index + 1 < values.length)
                        if (commonUtils.isDate(value)) {
                            if (values[index + 1].getTime() - value.getTime() < value.getTime() - values[index].getTime())
                                index++
                        }
                        else if (values[index + 1] - value < value - values[index])
                            index++;
                    return values[index]
                }
                return value
            };
        var findGreaterOrEqualValue = function(values, value) {
                var index = findLessOrEqualValueIndex(values, value);
                if (values && index >= 0 && index < values.length) {
                    if (values[index] < value && index + 1 < values.length)
                        index++;
                    return values[index]
                }
                return value
            };
        var getEventPageX = function(eventArgs) {
                var result = 0;
                if (eventArgs.pageX)
                    result = eventArgs.pageX;
                else if (eventArgs.originalEvent && eventArgs.originalEvent.pageX)
                    result = eventArgs.originalEvent.pageX;
                if (eventArgs.originalEvent && eventArgs.originalEvent.touches)
                    if (eventArgs.originalEvent.touches.length > 0)
                        result = eventArgs.originalEvent.touches[0].pageX;
                    else if (eventArgs.originalEvent.changedTouches.length > 0)
                        result = eventArgs.originalEvent.changedTouches[0].pageX;
                return result
            };
        var truncateSelectedRange = function(value, scaleOptions) {
                var isDiscrete = scaleOptions.type === "discrete",
                    categories = isDiscrete ? scaleOptions.categories || scaleOptions._categoriesInfo.categories : undefined,
                    startValue = scaleOptions.startValue,
                    endValue = scaleOptions.endValue,
                    min,
                    max,
                    valueIndex;
                if (categories)
                    categories = DX.viz.utils.map(categories, function(category) {
                        return commonUtils.isDefined(category) ? category.valueOf() : null
                    });
                if (isDiscrete) {
                    valueIndex = $.inArray(value.valueOf(), categories);
                    return valueIndex < 0 ? startValue : value
                }
                else {
                    min = startValue > endValue ? endValue : startValue;
                    max = startValue > endValue ? startValue : endValue
                }
                if (value < min)
                    value = min;
                if (value > max)
                    value = max;
                return value
            };
        var canvasOptionsToRenderOptions = function(canvasOptions) {
                return {
                        x: canvasOptions.left,
                        y: canvasOptions.top,
                        width: canvasOptions.width,
                        height: canvasOptions.height
                    }
            };
        DX.viz.rangeSelector.utils = {
            findLessOrEqualValue: findLessOrEqualValue,
            findNearValue: findNearValue,
            findGreaterOrEqualValue: findGreaterOrEqualValue,
            getEventPageX: getEventPageX,
            truncateSelectedRange: truncateSelectedRange,
            canvasOptionsToRenderOptions: canvasOptionsToRenderOptions,
            trackerSettings: {
                fill: "grey",
                stroke: "grey",
                opacity: 0.0001
            },
            animationSettings: {duration: 250},
            addInterval: function(value, interval, isNegative, scaleOptions) {
                var result,
                    type = scaleOptions.type,
                    base = type === "logarithmic" && scaleOptions.logarithmBase,
                    power;
                if (base) {
                    power = utilsAddInterval(mathUtils.getLog(value, base), interval, isNegative);
                    result = Math.pow(base, power)
                }
                else
                    result = utilsAddInterval(value, interval, isNegative);
                return result
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file baseVisualElementMethods.js */
    (function(DX) {
        DX.viz.rangeSelector.baseVisualElementMethods = {
            init: function(renderer) {
                this._renderer = renderer;
                this._isDrawn = false
            },
            applyOptions: function(options) {
                this._options = options || {};
                this._applyOptions(this._options)
            },
            _applyOptions: function(){},
            redraw: function(group) {
                var that = this;
                if (!that._isDrawn) {
                    that._isDrawn = that._draw(group || that._group) !== false;
                    if (group)
                        that._group = group
                }
                else
                    that._update(group || that._group)
            },
            isDrawn: function() {
                return !!this._isDrawn
            },
            isInitialized: function() {
                return !!this._options
            },
            _draw: function(){},
            _update: function(group) {
                group.clear();
                this._draw(group)
            }
        }
    })(DevExpress);
    /*! Module viz-rangeselector, file rangeSelector.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            commonUtils = DX.require("/utils/utils.common"),
            mathUtils = DX.require("/utils/utils.math"),
            dateUtils = DX.require("/utils/utils.date"),
            viz = DX.viz,
            vizUtils = viz.utils,
            patchFontOptions = vizUtils.patchFontOptions,
            parseUtils = viz.parseUtils,
            _normalizeEnum = vizUtils.normalizeEnum,
            formatHelper = DX.require("/utils/utils.formatHelper"),
            registerComponent = DX.require("/componentRegistrator"),
            HEIGHT_COMPACT_MODE = 24,
            POINTER_SIZE = 4,
            EMPTY_SLIDER_MARKER_TEXT = ". . .",
            _isDefined = commonUtils.isDefined,
            _isNumber = commonUtils.isNumber,
            _isDate = commonUtils.isDate,
            _max = Math.max,
            _ceil = Math.ceil,
            _noop = $.noop,
            START_VALUE = "startValue",
            END_VALUE = "endValue",
            DATETIME = "datetime",
            SELECTED_RANGE = "selectedRange",
            DISCRETE = "discrete",
            STRING = "string",
            SELECTED_RANGE_CHANGED = SELECTED_RANGE + "Changed",
            CONTAINER_BACKGROUND_COLOR = "containerBackgroundColor",
            SLIDER_MARKER = "sliderMarker",
            BACKGROUND = "background",
            LOGARITHMIC = "logarithmic",
            INVISIBLE_POS = -1000,
            logarithmBase = 10;
        rangeSelector.consts = {
            emptySliderMarkerText: EMPTY_SLIDER_MARKER_TEXT,
            pointerSize: POINTER_SIZE
        };
        rangeSelector.HEIGHT_COMPACT_MODE = HEIGHT_COMPACT_MODE;
        rangeSelector.__getTextBBox = getTextBBox;
        function cloneSelectedRange(arg) {
            return {
                    startValue: arg.startValue,
                    endValue: arg.endValue
                }
        }
        var formatValue = rangeSelector.formatValue = function(value, formatOptions) {
                var formatObject = {
                        value: value,
                        valueText: formatHelper.format(value, formatOptions.format, formatOptions.precision)
                    };
                return String(commonUtils.isFunction(formatOptions.customizeText) ? formatOptions.customizeText.call(formatObject, formatObject) : formatObject.valueText)
            };
        var createTranslator = function(range, canvas) {
                return {
                        x: viz.CoreFactory.createTranslator2D(range.arg, canvas, {isHorizontal: true}),
                        y: viz.CoreFactory.createTranslator2D(range.val, canvas)
                    }
            };
        var createTranslatorCanvas = function(sizeOptions, rangeContainerCanvas, scaleLabelsAreaHeight) {
                return {
                        left: rangeContainerCanvas.left,
                        top: rangeContainerCanvas.top,
                        right: sizeOptions.width - rangeContainerCanvas.width - rangeContainerCanvas.left,
                        bottom: sizeOptions.height - rangeContainerCanvas.height - rangeContainerCanvas.top + scaleLabelsAreaHeight,
                        width: sizeOptions.width,
                        height: sizeOptions.height
                    }
            };
        var calculateMarkerHeight = function(renderer, value, sliderMarkerOptions) {
                var formattedText = value === undefined ? EMPTY_SLIDER_MARKER_TEXT : formatValue(value, sliderMarkerOptions),
                    textBBox = getTextBBox(renderer, formattedText, sliderMarkerOptions.font);
                return _ceil(textBBox.height) + 2 * sliderMarkerOptions.paddingTopBottom + POINTER_SIZE
            };
        var calculateScaleLabelHalfWidth = function(renderer, value, scaleOptions) {
                var formattedText = formatValue(value, scaleOptions.label),
                    textBBox = getTextBBox(renderer, formattedText, scaleOptions.label.font);
                return _ceil(textBBox.width / 2)
            };
        var calculateRangeContainerCanvas = function(originalCanvas, size, indents, scaleLabelsAreaHeight, title, isCompactMode) {
                var canvas = {
                        left: size.left + indents.left,
                        top: size.top + indents.top,
                        width: size.width - indents.left - indents.right,
                        height: !isCompactMode ? size.height - indents.top - indents.bottom : HEIGHT_COMPACT_MODE + scaleLabelsAreaHeight
                    };
                if (canvas.width <= 0)
                    canvas.width = 1;
                return canvas
            };
        var parseSliderMarkersPlaceholderSize = function(placeholderSize) {
                var placeholderWidthLeft,
                    placeholderWidthRight,
                    placeholderHeight;
                if (_isNumber(placeholderSize))
                    placeholderWidthLeft = placeholderWidthRight = placeholderHeight = placeholderSize;
                else if (placeholderSize) {
                    if (_isNumber(placeholderSize.height))
                        placeholderHeight = placeholderSize.height;
                    if (_isNumber(placeholderSize.width))
                        placeholderWidthLeft = placeholderWidthRight = placeholderSize.width;
                    else if (placeholderSize.width) {
                        if (_isNumber(placeholderSize.width.left))
                            placeholderWidthLeft = placeholderSize.width.left;
                        if (_isNumber(placeholderSize.width.right))
                            placeholderWidthRight = placeholderSize.width.right
                    }
                }
                else
                    return null;
                return {
                        widthLeft: placeholderWidthLeft,
                        widthRight: placeholderWidthRight,
                        height: placeholderHeight
                    }
            };
        var calculateIndents = function(renderer, size, scale, sliderMarkerOptions, indentOptions) {
                var leftMarkerHeight,
                    leftScaleLabelWidth = 0,
                    rightScaleLabelWidth = 0,
                    rightMarkerHeight,
                    placeholderWidthLeft = 0,
                    placeholderWidthRight = 0,
                    placeholderHeight,
                    parsedPlaceholderSize;
                indentOptions = indentOptions || {};
                parsedPlaceholderSize = parseSliderMarkersPlaceholderSize(sliderMarkerOptions.placeholderSize);
                if (parsedPlaceholderSize && indentOptions.left === undefined && indentOptions.right === undefined) {
                    placeholderWidthLeft = parsedPlaceholderSize.widthLeft;
                    placeholderWidthRight = parsedPlaceholderSize.widthRight
                }
                else {
                    placeholderWidthLeft = indentOptions.left;
                    placeholderWidthRight = indentOptions.right
                }
                if (parsedPlaceholderSize && sliderMarkerOptions.placeholderHeight === undefined)
                    placeholderHeight = parsedPlaceholderSize.height;
                else
                    placeholderHeight = sliderMarkerOptions.placeholderHeight;
                if (sliderMarkerOptions.visible) {
                    leftMarkerHeight = calculateMarkerHeight(renderer, scale.startValue, sliderMarkerOptions);
                    rightMarkerHeight = calculateMarkerHeight(renderer, scale.endValue, sliderMarkerOptions);
                    if (placeholderHeight === undefined)
                        placeholderHeight = _max(leftMarkerHeight, rightMarkerHeight)
                }
                if (scale.label.visible) {
                    leftScaleLabelWidth = calculateScaleLabelHalfWidth(renderer, scale.startValue, scale);
                    rightScaleLabelWidth = calculateScaleLabelHalfWidth(renderer, scale.endValue, scale)
                }
                placeholderWidthLeft = placeholderWidthLeft !== undefined ? placeholderWidthLeft : leftScaleLabelWidth;
                placeholderWidthRight = (placeholderWidthRight !== undefined ? placeholderWidthRight : rightScaleLabelWidth) || 1;
                return {
                        left: placeholderWidthLeft,
                        right: placeholderWidthRight,
                        top: placeholderHeight || 0,
                        bottom: 0
                    }
            };
        var calculateValueType = function(firstValue, secondValue) {
                var typeFirstValue = $.type(firstValue),
                    typeSecondValue = $.type(secondValue),
                    validType = function(type) {
                        return typeFirstValue === type || typeSecondValue === type
                    };
                return validType("date") ? DATETIME : validType("number") ? "numeric" : validType(STRING) ? STRING : ""
            };
        var showScaleMarkers = function(scaleOptions) {
                return scaleOptions.valueType === DATETIME && scaleOptions.marker.visible
            };
        var updateTranslatorRangeInterval = function(translatorRange, scaleOptions) {
                var intervalX = scaleOptions.minorTickInterval || scaleOptions.tickInterval;
                if (scaleOptions.valueType === "datetime")
                    intervalX = dateUtils.dateToMilliseconds(intervalX);
                translatorRange.arg.addRange({interval: intervalX})
            };
        var createRange = function(options) {
                return new viz.Range(options)
            };
        var checkLogarithmicOptions = function(options, defaultLogarithmBase, incidentOccured) {
                var logarithmBase;
                if (!options)
                    return;
                logarithmBase = options.logarithmBase;
                if (options.type === LOGARITHMIC && logarithmBase <= 0 || logarithmBase && !_isNumber(logarithmBase)) {
                    options.logarithmBase = defaultLogarithmBase;
                    incidentOccured("E2104")
                }
                else if (options.type !== LOGARITHMIC)
                    options.logarithmBase = undefined
            };
        var calculateScaleAreaHeight = function(renderer, scaleOptions, visibleMarkers) {
                var textBBox,
                    value = "0",
                    formatObject = {
                        value: 0,
                        valueText: value
                    },
                    labelScaleOptions = scaleOptions.label,
                    markerScaleOPtions = scaleOptions.marker,
                    customizeText = labelScaleOptions.customizeText,
                    placeholderHeight = scaleOptions.placeholderHeight,
                    text = commonUtils.isFunction(customizeText) ? customizeText.call(formatObject, formatObject) : value,
                    visibleLabels = labelScaleOptions.visible;
                if (placeholderHeight)
                    return placeholderHeight;
                else {
                    textBBox = getTextBBox(renderer, text, labelScaleOptions.font);
                    return (visibleLabels ? labelScaleOptions.topIndent + textBBox.height : 0) + (visibleMarkers ? markerScaleOPtions.topIndent + markerScaleOPtions.separatorHeight : 0)
                }
            };
        var updateTickIntervals = function(scaleOptions, screenDelta, incidentOccured, stick, min, max) {
                var categoriesInfo = scaleOptions._categoriesInfo,
                    tickManager = viz.CoreFactory.createTickManager({
                        axisType: scaleOptions.type,
                        dataType: scaleOptions.valueType
                    }, {
                        min: min,
                        max: max,
                        screenDelta: screenDelta,
                        customTicks: categoriesInfo && categoriesInfo.categories
                    }, {
                        labelOptions: {},
                        boundCoef: 1,
                        minorTickInterval: scaleOptions.minorTickInterval,
                        tickInterval: scaleOptions.tickInterval,
                        incidentOccured: incidentOccured,
                        base: scaleOptions.logarithmBase,
                        showMinorTicks: true,
                        withMinorCorrection: true,
                        stick: stick !== false
                    }),
                    ticks = tickManager.getTicks(true);
                return {
                        tickInterval: tickManager.getTickInterval(),
                        minorTickInterval: tickManager.getMinorTickInterval(),
                        bounds: tickManager.getTickBounds(),
                        ticks: ticks
                    }
            };
        var calculateTranslatorRange = function(seriesDataSource, scaleOptions) {
                var minValue,
                    maxValue,
                    inverted = false,
                    isEqualDates,
                    startValue = scaleOptions.startValue,
                    endValue = scaleOptions.endValue,
                    categories,
                    categoriesInfo,
                    translatorRange = seriesDataSource ? seriesDataSource.getBoundRange() : {
                        arg: createRange(),
                        val: createRange({isValueRange: true})
                    },
                    rangeForCategories;
                if (scaleOptions.type === DISCRETE) {
                    rangeForCategories = createRange({
                        categories: scaleOptions.categories || (!seriesDataSource && startValue && endValue ? [startValue, endValue] : undefined),
                        minVisible: startValue,
                        maxVisible: endValue
                    });
                    rangeForCategories.addRange(translatorRange.arg);
                    translatorRange.arg = rangeForCategories;
                    categories = rangeForCategories.categories || [];
                    scaleOptions._categoriesInfo = categoriesInfo = vizUtils.getCategoriesInfo(categories, startValue || categories[0], endValue || categories[categories.length - 1])
                }
                if (_isDefined(startValue) && _isDefined(endValue)) {
                    inverted = categoriesInfo ? categoriesInfo.inverted : startValue > endValue;
                    minValue = categoriesInfo ? categoriesInfo.start : inverted ? endValue : startValue;
                    maxValue = categoriesInfo ? categoriesInfo.end : inverted ? startValue : endValue
                }
                else if (_isDefined(startValue) || _isDefined(endValue)) {
                    minValue = startValue;
                    maxValue = endValue
                }
                else if (categoriesInfo) {
                    minValue = categoriesInfo.start;
                    maxValue = categoriesInfo.end
                }
                isEqualDates = _isDate(minValue) && _isDate(maxValue) && minValue.getTime() === maxValue.getTime();
                if (minValue !== maxValue && !isEqualDates)
                    translatorRange.arg.addRange({
                        invert: inverted,
                        min: minValue,
                        max: maxValue,
                        minVisible: minValue,
                        maxVisible: maxValue,
                        dataType: scaleOptions.valueType
                    });
                translatorRange.arg.addRange({
                    base: scaleOptions.logarithmBase,
                    axisType: scaleOptions.type
                });
                if (!translatorRange.arg.isDefined()) {
                    if (isEqualDates)
                        scaleOptions.valueType = "numeric";
                    translatorRange.arg.setStubData(scaleOptions.valueType)
                }
                return translatorRange
            };
        var startEndNotDefined = function(start, end) {
                return !_isDefined(start) || !_isDefined(end)
            };
        function getTextBBox(renderer, text, fontOptions) {
            var textElement = renderer.text(text, INVISIBLE_POS, INVISIBLE_POS).css(patchFontOptions(fontOptions)).append(renderer.root);
            var textBBox = textElement.getBBox();
            textElement.remove();
            return textBBox
        }
        function processValue(selectedRangeOptions, scaleOptions, entity, incidentOccured) {
            var parsedValue,
                value = selectedRangeOptions[entity],
                parser = scaleOptions.parser || function() {
                    return null
                },
                resultValue = scaleOptions[entity];
            if (_isDefined(value))
                parsedValue = parser(value);
            if (!_isDefined(parsedValue))
                incidentOccured("E2203", [entity]);
            else
                resultValue = parsedValue;
            return rangeSelector.utils.truncateSelectedRange(resultValue, scaleOptions)
        }
        function prepareCanvas(canvas) {
            return {
                    top: canvas.top,
                    bottom: canvas.bottom,
                    left: canvas.left,
                    right: canvas.right,
                    width: canvas.width - canvas.left - canvas.right,
                    height: canvas.height - canvas.top - canvas.bottom
                }
        }
        registerComponent("dxRangeSelector", rangeSelector, viz.BaseWidget.inherit({
            _eventsMap: $.extend({}, viz.BaseWidget.prototype._eventsMap, {onSelectedRangeChanged: {name: SELECTED_RANGE_CHANGED}}),
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {
                    "sliderMarker.padding": {
                        since: "15.1",
                        message: "Use the 'paddingTopBottom' and 'paddingLeftRight' options instead"
                    },
                    "sliderMarker.placeholderSize": {
                        since: "15.1",
                        message: "Use the 'placeholderHeight' and 'indent' options instead"
                    },
                    "scale.majorTickInterval": {
                        since: "15.2",
                        message: "Use the 'tickInterval' options instead"
                    },
                    "scale.showMinorTicks": {
                        since: "15.2",
                        message: "Use the 'minorTick.visible' options instead"
                    }
                })
            },
            _rootClassPrefix: "dxrs",
            _rootClass: "dxrs-range-selector",
            _invalidatingOptions: ["scale", "selectedRangeColor", "containerBackgroundColor", "sliderMarker", "sliderHandle", "shutter", "background", "behavior", "chart", "indent"],
            _dataIsReady: function() {
                return this._dataSource.isLoaded()
            },
            _init: function() {
                var that = this;
                that.callBase();
                that._updateDataSource()
            },
            _initCore: function() {
                this._renderer.root.css({
                    "touch-action": "pan-y",
                    "-ms-touch-action": "pan-y"
                });
                this.rangeContainer = new rangeSelector.RangeContainer(this._renderer)
            },
            _getDefaultSize: function() {
                return {
                        width: 400,
                        height: 160
                    }
            },
            _disposeCore: function() {
                var that = this,
                    disposeObject = function(propName) {
                        that[propName] && that[propName].dispose();
                        that[propName] = null
                    };
                that.callBase();
                disposeObject("renderer");
                that.translators = null;
                disposeObject("rangeContainer")
            },
            _createThemeManager: function() {
                return new rangeSelector.ThemeManager
            },
            _render: function(isResizing) {
                var that = this,
                    currentAnimationEnabled,
                    renderer = that._renderer;
                isResizing = isResizing || that.__isResizing;
                renderer.lock();
                that._applyOptions();
                if (isResizing) {
                    currentAnimationEnabled = renderer.animationEnabled();
                    renderer.updateAnimationOptions({enabled: false});
                    that.rangeContainer.redraw();
                    renderer.updateAnimationOptions({enabled: currentAnimationEnabled})
                }
                else
                    that.rangeContainer.redraw();
                renderer.unlock();
                if (!isResizing && that._dataSource.isLoaded())
                    that.hideLoadingIndicator();
                that._drawn();
                that.__rendered && that.__rendered()
            },
            _handleChangedOptions: function(options) {
                var that = this;
                that.callBase.apply(that, arguments);
                if ("dataSource" in options)
                    that._updateDataSource();
                if (SELECTED_RANGE in options)
                    that.setSelectedRange(options[SELECTED_RANGE])
            },
            _resize: function() {
                this._render(true)
            },
            _dataSourceChangedHandler: function() {
                if (this._initialized)
                    this._render()
            },
            _applyOptions: function() {
                var that = this,
                    rangeContainerCanvas,
                    seriesDataSource,
                    translatorRange,
                    scaleLabelsAreaHeight,
                    sizeOptions = that._title.getVerticalCuttedSize(prepareCanvas(that._canvas)),
                    indents,
                    sliderMarkerOptions,
                    selectedRange,
                    chartOptions = that.option("chart"),
                    shutterOptions = that._getOption("shutter"),
                    background = that._getOption(BACKGROUND),
                    isCompactMode,
                    scaleOptions,
                    min,
                    max,
                    argTranslatorRange,
                    tickIntervalsInfo,
                    chartThemeManager;
                that._isUpdating = true;
                seriesDataSource = that._createSeriesDataSource(chartOptions);
                isCompactMode = !(seriesDataSource && seriesDataSource.isShowChart() || background && background.image && background.image.url);
                if (seriesDataSource) {
                    chartThemeManager = seriesDataSource.getThemeManager();
                    checkLogarithmicOptions(chartOptions && chartOptions.valueAxis, chartThemeManager.getOptions("valueAxis").logarithmBase, that._incidentOccured)
                }
                scaleOptions = that._scaleOptions = that._prepareScaleOptions(seriesDataSource);
                translatorRange = calculateTranslatorRange(seriesDataSource, scaleOptions);
                argTranslatorRange = translatorRange.arg;
                min = _isDefined(argTranslatorRange.minVisible) ? argTranslatorRange.minVisible : argTranslatorRange.min;
                max = _isDefined(argTranslatorRange.maxVisible) ? argTranslatorRange.maxVisible : argTranslatorRange.max;
                tickIntervalsInfo = updateTickIntervals(scaleOptions, sizeOptions.width, this._incidentOccured, argTranslatorRange.stick, min, max);
                that._updateScaleOptions(seriesDataSource, translatorRange.arg, tickIntervalsInfo);
                updateTranslatorRangeInterval(translatorRange, scaleOptions);
                sliderMarkerOptions = that._prepareSliderMarkersOptions(sizeOptions.width, tickIntervalsInfo);
                selectedRange = that._initSelection();
                indents = calculateIndents(that._renderer, sizeOptions, scaleOptions, sliderMarkerOptions, that.option("indent"));
                scaleLabelsAreaHeight = calculateScaleAreaHeight(that._renderer, scaleOptions, showScaleMarkers(scaleOptions));
                rangeContainerCanvas = calculateRangeContainerCanvas(that._canvas, sizeOptions, indents, scaleLabelsAreaHeight, that._title, isCompactMode);
                that._applyTitleLayout(rangeContainerCanvas, indents);
                that.translators = createTranslator(translatorRange, createTranslatorCanvas(sizeOptions, rangeContainerCanvas, scaleLabelsAreaHeight));
                that._selectedRange = selectedRange;
                if (seriesDataSource)
                    seriesDataSource.adjustSeriesDimensions(that.translators);
                shutterOptions.color = shutterOptions.color || that._getOption(CONTAINER_BACKGROUND_COLOR, true);
                scaleOptions.minorTickInterval = scaleOptions.isEmpty ? 0 : that._getOption('scale').minorTickInterval;
                that.rangeContainer.applyOptions({
                    canvas: rangeContainerCanvas,
                    isCompactMode: isCompactMode,
                    scaleLabelsAreaHeight: scaleLabelsAreaHeight,
                    indents: indents,
                    translators: that.translators,
                    selectedRange: selectedRange,
                    scale: scaleOptions,
                    behavior: that._getOption("behavior"),
                    background: background,
                    chart: chartOptions,
                    seriesDataSource: seriesDataSource,
                    sliderMarker: sliderMarkerOptions,
                    sliderHandle: that._getOption("sliderHandle"),
                    shutter: shutterOptions,
                    selectedRangeColor: that._getOption("selectedRangeColor", true),
                    selectedRangeChanged: function(selectedRange, blockSelectedRangeChanged) {
                        that.option(SELECTED_RANGE, selectedRange);
                        if (!blockSelectedRangeChanged)
                            that._eventTrigger(SELECTED_RANGE_CHANGED, cloneSelectedRange(selectedRange))
                    },
                    setSelectedRange: function(selectedRange) {
                        that.setSelectedRange(selectedRange)
                    }
                });
                that._isUpdating = false;
                chartThemeManager && chartThemeManager.dispose()
            },
            _applyTitleLayout: function(rangeContainerCanvas, indents) {
                var layoutOptions = this._title.getLayoutOptions(),
                    canvas = this._canvas;
                layoutOptions && this._title.position({
                    at: layoutOptions.position,
                    my: layoutOptions.position,
                    of: {getLayoutOptions: function() {
                            return {
                                    width: rangeContainerCanvas.width + indents.left + indents.right,
                                    height: rangeContainerCanvas.height + layoutOptions.height + indents.top + indents.bottom,
                                    x: canvas.left,
                                    y: canvas.top
                                }
                        }}
                })
            },
            _initSelection: function() {
                var that = this,
                    scaleOptions = that._scaleOptions,
                    selectedRangeOptions = that.option(SELECTED_RANGE),
                    incidentOccured = that._incidentOccured;
                if (!selectedRangeOptions)
                    return cloneSelectedRange(scaleOptions);
                else
                    return {
                            startValue: processValue(selectedRangeOptions, scaleOptions, START_VALUE, incidentOccured),
                            endValue: processValue(selectedRangeOptions, scaleOptions, END_VALUE, incidentOccured)
                        }
            },
            _createSeriesDataSource: function(chartOptions) {
                var that = this,
                    seriesDataSource,
                    dataSource = that._dataSource.items(),
                    scaleOptions = that._getOption("scale"),
                    valueType = scaleOptions.valueType,
                    backgroundOption = that.option(BACKGROUND);
                if (!valueType)
                    valueType = calculateValueType(scaleOptions.startValue, scaleOptions.endValue);
                if (dataSource || chartOptions && chartOptions.series) {
                    chartOptions = $.extend({}, chartOptions, {theme: that.option("theme")});
                    seriesDataSource = new rangeSelector.SeriesDataSource({
                        renderer: that._renderer,
                        dataSource: dataSource,
                        valueType: _normalizeEnum(valueType),
                        axisType: scaleOptions.type,
                        chart: chartOptions,
                        dataSourceField: that.option("dataSourceField"),
                        backgroundColor: backgroundOption && backgroundOption.color,
                        incidentOccured: that._incidentOccured,
                        categories: scaleOptions.categories
                    })
                }
                return seriesDataSource
            },
            _prepareScaleOptions: function(seriesDataSource) {
                var that = this,
                    scaleOptions = that._getOption("scale"),
                    parsedValue = 0,
                    valueType = parseUtils.correctValueType(_normalizeEnum(scaleOptions.valueType)),
                    parser,
                    validateStartEndValues = function(field, parser) {
                        var messageToIncidentOccured = field === START_VALUE ? "start" : "end";
                        if (_isDefined(scaleOptions[field])) {
                            parsedValue = parser(scaleOptions[field]);
                            if (_isDefined(parsedValue))
                                scaleOptions[field] = parsedValue;
                            else {
                                scaleOptions[field] = undefined;
                                that._incidentOccured("E2202", [messageToIncidentOccured])
                            }
                        }
                    };
                if (seriesDataSource)
                    valueType = seriesDataSource.getCalculatedValueType() || valueType;
                if (!valueType)
                    valueType = calculateValueType(scaleOptions.startValue, scaleOptions.endValue) || "numeric";
                if (valueType === STRING || scaleOptions.categories) {
                    scaleOptions.type = DISCRETE;
                    valueType = STRING
                }
                scaleOptions.valueType = valueType;
                parser = parseUtils.getParser(valueType);
                validateStartEndValues(START_VALUE, parser);
                validateStartEndValues(END_VALUE, parser);
                checkLogarithmicOptions(scaleOptions, logarithmBase, that._incidentOccured);
                if (!scaleOptions.type)
                    scaleOptions.type = "continuous";
                scaleOptions.tickInterval === undefined && (scaleOptions.tickInterval = scaleOptions.majorTickInterval);
                scaleOptions.minorTick.visible && (scaleOptions.minorTick.visible = scaleOptions.showMinorTicks);
                scaleOptions.parser = parser;
                return scaleOptions
            },
            _prepareSliderMarkersOptions: function(screenDelta, tickIntervalsInfo) {
                var that = this,
                    scaleOptions = that._scaleOptions,
                    minorTickInterval = tickIntervalsInfo.minorTickInterval,
                    tickInterval = tickIntervalsInfo.tickInterval,
                    endValue = scaleOptions.endValue,
                    startValue = scaleOptions.startValue,
                    sliderMarkerOptions = that._getOption(SLIDER_MARKER),
                    businessInterval,
                    sliderMarkerUserOption = that.option(SLIDER_MARKER) || {},
                    isTypeDiscrete = scaleOptions.type === DISCRETE,
                    isValueTypeDatetime = scaleOptions.valueType === DATETIME;
                sliderMarkerOptions.borderColor = that._getOption(CONTAINER_BACKGROUND_COLOR, true);
                if (!sliderMarkerOptions.format) {
                    if (!that._getOption("behavior").snapToTicks && _isNumber(scaleOptions.startValue)) {
                        businessInterval = Math.abs(endValue - startValue);
                        sliderMarkerOptions.format = "fixedPoint";
                        sliderMarkerOptions.precision = mathUtils.getSignificantDigitPosition(businessInterval / screenDelta)
                    }
                    if (isValueTypeDatetime && !isTypeDiscrete)
                        if (!scaleOptions.marker.visible) {
                            if (_isDefined(startValue) && _isDefined(endValue))
                                sliderMarkerOptions.format = formatHelper.getDateFormatByTickInterval(startValue, endValue, minorTickInterval !== 0 ? minorTickInterval : tickInterval)
                        }
                        else
                            sliderMarkerOptions.format = dateUtils.getDateUnitInterval(_isDefined(minorTickInterval) && minorTickInterval !== 0 ? minorTickInterval : tickInterval);
                    if (isValueTypeDatetime && isTypeDiscrete)
                        sliderMarkerOptions.format = formatHelper.getDateFormatByTicks(tickIntervalsInfo.ticks)
                }
                if (sliderMarkerUserOption.padding !== undefined && sliderMarkerUserOption.paddingLeftRight === undefined && sliderMarkerUserOption.paddingTopBottom === undefined)
                    sliderMarkerOptions.paddingLeftRight = sliderMarkerOptions.paddingTopBottom = sliderMarkerUserOption.padding;
                return sliderMarkerOptions
            },
            _updateScaleOptions: function(seriesDataSource, translatorRange, tickIntervalsInfo) {
                var scaleOptions = this._scaleOptions,
                    bounds,
                    isEmptyInterval,
                    categoriesInfo = scaleOptions._categoriesInfo;
                if (seriesDataSource && !seriesDataSource.isEmpty() && !translatorRange.stubData) {
                    bounds = tickIntervalsInfo.bounds;
                    translatorRange.addRange(bounds);
                    scaleOptions.startValue = translatorRange.invert ? bounds.maxVisible : bounds.minVisible;
                    scaleOptions.endValue = translatorRange.invert ? bounds.minVisible : bounds.maxVisible
                }
                if (categoriesInfo) {
                    scaleOptions.startValue = categoriesInfo.start;
                    scaleOptions.endValue = categoriesInfo.end
                }
                if (scaleOptions.type !== DISCRETE)
                    isEmptyInterval = _isDate(scaleOptions.startValue) && _isDate(scaleOptions.endValue) && scaleOptions.startValue.getTime() === scaleOptions.endValue.getTime() || scaleOptions.startValue === scaleOptions.endValue;
                scaleOptions.isEmpty = startEndNotDefined(scaleOptions.startValue, scaleOptions.endValue) || isEmptyInterval;
                if (scaleOptions.isEmpty)
                    scaleOptions.startValue = scaleOptions.endValue = undefined;
                else {
                    scaleOptions.minorTickInterval = tickIntervalsInfo.minorTickInterval;
                    scaleOptions.tickInterval = tickIntervalsInfo.tickInterval;
                    if (scaleOptions.valueType === DATETIME && !_isDefined(scaleOptions.label.format))
                        if (scaleOptions.type === DISCRETE)
                            scaleOptions.label.format = formatHelper.getDateFormatByTicks(tickIntervalsInfo.ticks);
                        else if (!scaleOptions.marker.visible)
                            scaleOptions.label.format = formatHelper.getDateFormatByTickInterval(scaleOptions.startValue, scaleOptions.endValue, scaleOptions.tickInterval);
                        else
                            scaleOptions.label.format = dateUtils.getDateUnitInterval(scaleOptions.tickInterval)
                }
            },
            getSelectedRange: function() {
                return cloneSelectedRange(this.rangeContainer.getSlidersContainer().getSelectedRange())
            },
            setSelectedRange: function(selectedRange) {
                var that = this;
                if (that._isUpdating || !selectedRange)
                    return;
                var oldSelectedRange = that.rangeContainer.getSlidersContainer().getSelectedRange();
                if (oldSelectedRange && oldSelectedRange.startValue === selectedRange.startValue && oldSelectedRange.endValue === selectedRange.endValue)
                    return;
                that.rangeContainer.getSlidersContainer().setSelectedRange(selectedRange)
            },
            resetSelectedRange: function(blockSelectedRangeChanged) {
                var data = cloneSelectedRange(this._scaleOptions);
                data.blockSelectedRangeChanged = blockSelectedRangeChanged;
                this.setSelectedRange(data)
            },
            render: function(isResizing) {
                var that = this;
                that.__isResizing = isResizing;
                that.callBase.apply(that, arguments);
                that.__isResizing = null;
                return that
            },
            _applySize: _noop,
            _initTooltip: _noop,
            _setTooltipRendererOptions: _noop,
            _setTooltipOptions: _noop,
            _hideTooltip: _noop
        }))
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file rangeContainer.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            canvasOptionsToRenderOptions = rangeSelector.utils.canvasOptionsToRenderOptions,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods,
            dateUtils = DX.require("/utils/utils.date"),
            _extend = $.extend,
            RangeContainer;
        function createClipRectCanvas(canvas, indents) {
            return {
                    left: canvas.left - indents.left,
                    top: canvas.top - indents.top,
                    width: canvas.width + indents.right + indents.left,
                    height: canvas.height + indents.bottom + indents.top
                }
        }
        RangeContainer = function(renderer) {
            var that = this;
            baseVisualElementMethods.init.apply(that, arguments);
            that._clipRect = renderer.clipRect();
            that._root = renderer.g().attr({
                'class': 'rangeContainer',
                clipId: that._clipRect.id
            }).linkOn(renderer.root, "range-container");
            that._createGroups();
            that._slidersContainer = new rangeSelector.SlidersContainer(renderer);
            that._rangeView = new rangeSelector.RangeView(renderer);
            that._axis = new DX.viz.axes.Axis({
                axesContainerGroup: that._scaleGroup,
                renderer: renderer,
                axisType: "xyAxes",
                drawingType: "linear",
                widgetClass: "dxrs",
                axisClass: "range-selector"
            })
        };
        RangeContainer.prototype = _extend({}, baseVisualElementMethods, {
            constructor: RangeContainer,
            dispose: function() {
                var that = this;
                that._slidersContainer.dispose();
                that._axis.dispose();
                that._root.linkOff();
                that._slidersContainer = that._root = that._rangeView = that._axis = null
            },
            getSlidersContainer: function() {
                return this._slidersContainer
            },
            _applyOptions: function(options) {
                var scaleLabelsAreaHeight = options.scaleLabelsAreaHeight,
                    canvas = options.canvas,
                    height = canvas.height;
                this._viewCanvas = {
                    left: canvas.left,
                    top: canvas.top,
                    width: canvas.width,
                    height: height >= scaleLabelsAreaHeight ? height - scaleLabelsAreaHeight : 0
                };
                this._options = options
            },
            _updateClipRect: function() {
                this._clipRect.attr(canvasOptionsToRenderOptions(createClipRectCanvas(this._options.canvas, this._options.indents)))
            },
            _createViewClipRect: function() {
                var that = this,
                    viewCanvas = that._viewCanvas;
                if (that._viewClipRect)
                    that._viewClipRect.attr(canvasOptionsToRenderOptions(viewCanvas));
                else {
                    that._viewClipRect = that._renderer.clipRect(viewCanvas.left, viewCanvas.top, viewCanvas.width, viewCanvas.height);
                    that._rangeViewGroup.attr({clipId: that._viewClipRect.id})
                }
            },
            _createGroups: function() {
                var that = this,
                    renderer = that._renderer;
                that._rangeViewGroup = renderer.g().attr({"class": "dxrs-view"});
                that._slidersGroup = renderer.g().attr({"class": "dxrs-slidersContainer"});
                that._scaleGroup = renderer.g().attr({"class": "dxrs-scale"});
                that._trackersGroup = renderer.g().attr({"class": "dxrs-trackers"})
            },
            _draw: function() {
                var that = this,
                    containerGroup = that._root;
                containerGroup.linkAppend();
                that._rangeViewGroup.append(containerGroup);
                if (that._options.isCompactMode) {
                    that._scaleGroup.append(containerGroup);
                    that._slidersGroup.append(containerGroup)
                }
                else {
                    that._slidersGroup.append(containerGroup);
                    that._scaleGroup.append(containerGroup)
                }
                that._trackersGroup.append(containerGroup);
                that._update()
            },
            _update: function() {
                var that = this;
                that._updateClipRect();
                that._createViewClipRect();
                that._drawRangeView();
                that._drawAxis();
                that._drawSliderContainer();
                that._slidersContainer.appendTrackers(that._trackersGroup)
            },
            _prepareScaleOptions: function(axisPosition) {
                var options = this._options,
                    scaleOptions = options.scale;
                scaleOptions.label.overlappingBehavior = {mode: scaleOptions.useTicksAutoArrangement ? "enlargeTickInterval" : "ignore"};
                scaleOptions.marker.label.font = scaleOptions.label.font;
                scaleOptions.color = scaleOptions.marker.color = scaleOptions.tick.color;
                scaleOptions.opacity = scaleOptions.marker.opacity = scaleOptions.tick.opacity;
                scaleOptions.width = scaleOptions.marker.width = scaleOptions.tick.width;
                scaleOptions.placeholderSize = (scaleOptions.placeholderHeight || 0) + axisPosition;
                scaleOptions.argumentType = scaleOptions.valueType;
                scaleOptions.visible = options.isCompactMode;
                scaleOptions.isHorizontal = scaleOptions.withoutOverlappingBehavior = scaleOptions.stick = true;
                if (!options.isCompactMode)
                    scaleOptions.minorTick.length = scaleOptions.tick.length = options.canvas.height - options.scaleLabelsAreaHeight;
                scaleOptions.label.indentFromAxis = scaleOptions.label.topIndent + axisPosition;
                scaleOptions.setSelectedRange = options.setSelectedRange;
                return scaleOptions
            },
            _drawAxis: function() {
                var that = this,
                    options = that._options,
                    canvas = options.canvas,
                    translators = options.translators,
                    centerY = (2 * canvas.top + canvas.height - options.scaleLabelsAreaHeight) / 2,
                    markerTrackers;
                that._axis.updateOptions(that._prepareScaleOptions(this._viewCanvas.height + canvas.top - centerY - Math.ceil(options.scale.width / 2)));
                that._axis.delta = {bottom: centerY - translators.y.translateSpecialCase("canvas_position_bottom")};
                that._axis.setTranslator(translators.x, translators.y);
                that._axis.draw();
                markerTrackers = this._axis.getMarkerTrackers();
                markerTrackers && that._initializeDateMarkersEvent(markerTrackers)
            },
            _drawSliderContainer: function() {
                var that = this,
                    translator = that._axis.getTranslator(),
                    range = translator.getBusinessRange(),
                    inverted = range.invert,
                    options = that._options,
                    scaleOptions = options.scale,
                    newOptions = _extend({
                        type: range.axisType,
                        startValue: inverted ? range.maxVisible : range.minVisible,
                        endValue: inverted ? range.minVisible : range.maxVisible,
                        categories: range.categories,
                        inverted: inverted,
                        fullTicks: that._axis.getFullTicks(),
                        maxRange: scaleOptions.maxRange,
                        minRange: scaleOptions.minRange,
                        isEmpty: scaleOptions.isEmpty
                    }, options);
                newOptions.canvas = that._viewCanvas;
                newOptions.translator = translator;
                that._slidersContainer.applyOptions(newOptions);
                that._slidersContainer.redraw(that._slidersGroup)
            },
            _drawRangeView: function() {
                var that = this,
                    options = _extend({}, that._options);
                options.canvas = that._viewCanvas;
                if (!options.isCompactMode) {
                    that._rangeView.applyOptions(options);
                    that._rangeView.redraw(that._rangeViewGroup)
                }
            },
            _initializeDateMarkersEvent: function(markerTrackers) {
                var that = this;
                $.each(markerTrackers, function(_, value) {
                    value.on("dxpointerdown", function(e) {
                        var range = e.target.range,
                            options = that._options,
                            scaleOptions = options.scale,
                            minRange = scaleOptions.minRange ? dateUtils.addInterval(range.startValue, scaleOptions.minRange) : undefined,
                            maxRange = scaleOptions.maxRange ? dateUtils.addInterval(range.startValue, scaleOptions.maxRange) : undefined;
                        if (minRange && minRange > range.endValue || maxRange && maxRange < range.endValue)
                            return;
                        options.setSelectedRange(range)
                    })
                })
            }
        });
        rangeSelector.RangeContainer = RangeContainer
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file slidersContainer.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            msPointerEnabled = DX.require("/utils/utils.support").pointer,
            _normalizeEnum = DX.viz.utils.normalizeEnum,
            rangeSelectorUtils = rangeSelector.utils,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods,
            trackerAttributes = rangeSelectorUtils.trackerSettings;
        function checkRangeEquality(selectedRange, lastSelectedRange) {
            var lastStartValue = lastSelectedRange.startValue && lastSelectedRange.startValue.valueOf(),
                lastEndValue = lastSelectedRange.endValue && lastSelectedRange.endValue.valueOf(),
                startValue = selectedRange.startValue && selectedRange.startValue.valueOf(),
                endValue = selectedRange.endValue && selectedRange.endValue.valueOf();
            return lastEndValue === endValue && lastStartValue === startValue
        }
        function SlidersContainer() {
            var that = this;
            baseVisualElementMethods.init.apply(that, arguments);
            that._controller = new rangeSelector.SlidersController(that._renderer);
            that._eventsManager = new rangeSelector.SlidersEventsManager(that._renderer, that._controller, function(moving) {
                that._processSelectionChanged(moving)
            });
            that._lastSelectedRange = {}
        }
        SlidersContainer.prototype = $.extend({}, baseVisualElementMethods, {
            constructor: SlidersContainer,
            _drawAreaTracker: function(group) {
                var that = this,
                    areaTracker,
                    selectedAreaTracker,
                    canvas = that._options.canvas,
                    renderer = that._renderer;
                areaTracker = renderer.rect(canvas.left, canvas.top, canvas.width, canvas.height).attr(trackerAttributes).append(group);
                selectedAreaTracker = renderer.rect(canvas.left, canvas.top, canvas.width, canvas.height).attr(trackerAttributes).css({cursor: 'pointer'}).append(group);
                that._controller.setAreaTrackers(areaTracker, selectedAreaTracker)
            },
            _processSelectionChanged: function(moving, blockSelectedRangeChanged) {
                var that = this,
                    selectedRange = that.getSelectedRange(),
                    rangeNotEquality = !checkRangeEquality(selectedRange, that._lastSelectedRange);
                if ((!moving || _normalizeEnum(that._options.behavior.callSelectedRangeChanged) === "onmoving") && rangeNotEquality) {
                    that._updateLastSelectedRange(selectedRange, blockSelectedRangeChanged);
                    that._options.selectedRangeChanged(selectedRange);
                    !moving && rangeNotEquality && that.setSelectedRange(selectedRange)
                }
            },
            _updateLastSelectedRange: function(selectedRange) {
                selectedRange = selectedRange || this._options.selectedRange;
                this._lastSelectedRange = {
                    startValue: selectedRange.startValue,
                    endValue: selectedRange.endValue
                }
            },
            _applyOptions: function(options) {
                this._controller.applyOptions(options);
                this._eventsManager.applyOptions({behavior: options.behavior})
            },
            _draw: function(group) {
                var that = this,
                    rootElement;
                if (msPointerEnabled) {
                    rootElement = that._renderer.root;
                    rootElement && rootElement.css({msTouchAction: "pinch-zoom"})
                }
                that._controller.redraw(group);
                that._drawAreaTracker(group);
                that._eventsManager.initialize();
                that._update(group, false)
            },
            _updateSelectedView: function(group) {
                var that = this,
                    options = that._options,
                    canvas = options.canvas,
                    lineOptions = {
                        "stroke-width": 3,
                        stroke: options.selectedRangeColor,
                        sharp: "v"
                    },
                    center = canvas.top + canvas.height / 2,
                    selectedView = that._selectedView,
                    selectedViewAppended = that._selectedViewAppended,
                    controller = that._controller;
                if (!options.isCompactMode) {
                    if (selectedView && selectedViewAppended) {
                        selectedView.remove();
                        that._selectedViewAppended = false
                    }
                    controller.createShutters()
                }
                else {
                    if (!selectedView) {
                        that._selectedView = selectedView = that._renderer.path([canvas.left, center, canvas.left, center], "line").attr(lineOptions);
                        controller.setSelectedView(selectedView)
                    }
                    else
                        selectedView.attr(lineOptions);
                    if (!selectedViewAppended) {
                        selectedView.append(group);
                        controller.removeShutters();
                        that._selectedViewAppended = true
                    }
                }
            },
            _update: function(group, withSelectionChanged) {
                var that = this,
                    isEmpty = that._options.isEmpty,
                    controller = that._controller,
                    selectedRange = that._options.selectedRange;
                that._eventsManager.setEnabled(!isEmpty);
                !isEmpty && that._updateSelectedView(group);
                controller.applySelectedRange(isEmpty ? {} : selectedRange);
                controller.applyPosition(that.isDrawn());
                if (withSelectionChanged === false)
                    that._updateLastSelectedRange(selectedRange);
                else
                    that._processSelectionChanged(false, selectedRange.blockSelectedRangeChanged);
                controller.redraw(group)
            },
            _validateSelectedRange: function(field, value) {
                if (value === undefined || $.type(this._options[field]) === $.type(value))
                    this._options.selectedRange[field] = value
            },
            dispose: function() {
                this._eventsManager.dispose();
                this._controller.dispose();
                this._eventsManager = null
            },
            getSelectedRange: function() {
                return this._controller.getSelectedRange()
            },
            setSelectedRange: function(selectedRange) {
                var that = this,
                    options = that._options,
                    startValue,
                    endValue,
                    currentSelectedRange = options.selectedRange;
                if (selectedRange) {
                    startValue = selectedRange.startValue;
                    endValue = selectedRange.endValue
                }
                that._validateSelectedRange("startValue", startValue);
                that._validateSelectedRange("endValue", endValue);
                currentSelectedRange.startValue = rangeSelectorUtils.truncateSelectedRange(currentSelectedRange.startValue, options);
                currentSelectedRange.endValue = rangeSelectorUtils.truncateSelectedRange(currentSelectedRange.endValue, options);
                that._controller.applySelectedRange(currentSelectedRange);
                that._controller.applyPosition();
                that._processSelectionChanged(false, selectedRange && selectedRange.blockSelectedRangeChanged)
            },
            appendTrackers: function(group) {
                this._controller.appendTrackers(group)
            },
            getController: function() {
                return this._controller
            }
        });
        rangeSelector.SlidersContainer = SlidersContainer
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file slidersController.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            _SliderController,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            DISCRETE = "discrete";
        _SliderController = rangeSelector.SlidersController = function(renderer) {
            var sliders = [new rangeSelector.Slider(renderer, START_VALUE_INDEX), new rangeSelector.Slider(renderer, END_VALUE_INDEX)];
            sliders[START_VALUE_INDEX].setAnotherSlider(sliders[END_VALUE_INDEX]);
            sliders[END_VALUE_INDEX].setAnotherSlider(sliders[START_VALUE_INDEX]);
            this._sliders = sliders
        };
        _SliderController.prototype = {
            constructor: _SliderController,
            _callMethodForBothSliders: function(methodName, params) {
                this._sliders[START_VALUE_INDEX][methodName](params);
                this._sliders[END_VALUE_INDEX][methodName](params)
            },
            _applySelectedRangePosition: function(disableAnimation) {
                var that = this,
                    options = that._options,
                    canvas = options.canvas,
                    center = canvas.top + canvas.height / 2,
                    isAnimation = options.behavior.animationEnabled && !disableAnimation,
                    startSliderPos = that._sliders[START_VALUE_INDEX].getPosition(),
                    points = [startSliderPos, center, startSliderPos + that.getSelectedRangeInterval(), center],
                    selectedView = that._selectedView;
                if (!selectedView || !options.isCompactMode)
                    return;
                if (isAnimation)
                    selectedView.animate({points: points}, rangeSelector.utils.animationSettings);
                else
                    selectedView.stopAnimation().attr({points: points})
            },
            setAreaTrackers: function(areaTracker, selectedAreaTracker) {
                this._areaTracker = areaTracker;
                this._selectedAreaTracker = selectedAreaTracker
            },
            applyOptions: function(options) {
                var that = this,
                    values = null;
                that._options = options;
                that._callMethodForBothSliders("applyOptions", options);
                if (options.behavior.snapToTicks && options.type !== DISCRETE) {
                    values = options.fullTicks;
                    values[0] > values[values.length - 1] && values.reverse()
                }
                that._callMethodForBothSliders("setAvailableValues", values)
            },
            processDocking: function(sliderIndex) {
                var that = this;
                if (sliderIndex !== undefined)
                    that._sliders[sliderIndex].processDocking();
                else
                    that._callMethodForBothSliders("processDocking");
                that.setTrackersCursorStyle("default");
                that.applyAreaTrackersPosition();
                that._applySelectedRangePosition()
            },
            setSelectedView: function(selectedView) {
                this._selectedView = selectedView
            },
            getSelectedRangeInterval: function() {
                return this._sliders[END_VALUE_INDEX].getPosition() - this._sliders[START_VALUE_INDEX].getPosition()
            },
            moveSliders: function(postitionDelta, selectedRangeInterval) {
                var startSlider = this._sliders[START_VALUE_INDEX];
                startSlider.setPosition(startSlider.getPosition() + postitionDelta, false, selectedRangeInterval);
                this.applyPosition(true)
            },
            moveSlider: function(sliderIndex, fastSwap, position, offsetPosition, startOffsetPosition, startOffsetPositionChangedCallback) {
                var that = this,
                    slider = that._sliders[sliderIndex],
                    anotherSlider = slider.getAnotherSlider(),
                    anotherSliderPosition = anotherSlider.getPosition(),
                    delta,
                    doSwap;
                if (slider.canSwap())
                    if (sliderIndex === START_VALUE_INDEX ? position > anotherSliderPosition : position < anotherSliderPosition) {
                        doSwap = fastSwap;
                        if (!fastSwap)
                            if (Math.abs(offsetPosition) >= Math.abs(startOffsetPosition)) {
                                doSwap = true;
                                delta = offsetPosition * startOffsetPosition < 0 ? 1 : -1;
                                position = position + delta * 2 * startOffsetPosition;
                                startOffsetPositionChangedCallback(-delta * startOffsetPosition)
                            }
                        if (doSwap) {
                            that.swapSliders();
                            anotherSlider.applyPosition(true)
                        }
                    }
                slider.setPosition(position, true);
                slider.applyPosition(true);
                that.applyAreaTrackersPosition();
                that._applySelectedRangePosition(true);
                that.setTrackersCursorStyle("w-resize")
            },
            applySelectedAreaCenterPosition: function(position) {
                var that = this,
                    startSlider = that._sliders[START_VALUE_INDEX],
                    selectedRangeInterval = that.getSelectedRangeInterval(),
                    slidersContainerHalfWidth = selectedRangeInterval / 2;
                startSlider.setPosition(position - slidersContainerHalfWidth, false, selectedRangeInterval);
                that.applyPosition();
                that.processDocking()
            },
            endSelection: function() {
                var that = this,
                    startSlider = that._sliders[START_VALUE_INDEX],
                    endSlider = that._sliders[END_VALUE_INDEX],
                    overlappedState = startSlider.getCloudBorder() > endSlider.getCloudBorder();
                that._callMethodForBothSliders("setOverlapped", overlappedState)
            },
            processManualSelection: function(startPosition, endPosition, eventArgs) {
                var isStartLessEnd = startPosition < endPosition,
                    animateSliderIndex = +!isStartLessEnd,
                    movingSliderIndex = +isStartLessEnd,
                    positionRange = [Math.min(startPosition, endPosition), Math.max(startPosition, endPosition)],
                    movingSlider = this._sliders[movingSliderIndex],
                    animatedSlider = this._sliders[animateSliderIndex];
                movingSlider.setPosition(positionRange[movingSliderIndex]);
                animatedSlider.setPosition(positionRange[animateSliderIndex]);
                movingSlider.setPosition(positionRange[movingSliderIndex], true);
                movingSlider.startEventHandler(eventArgs);
                animatedSlider.processDocking();
                movingSlider.applyPosition(true)
            },
            applySelectedRange: function(selectedRange) {
                var that = this,
                    options = that._options,
                    inverted = options.inverted,
                    startSlider = that._sliders[START_VALUE_INDEX],
                    endSlider = that._sliders[END_VALUE_INDEX],
                    startValue = selectedRange.startValue,
                    endValue = selectedRange.endValue,
                    categoriesInfo,
                    setValues = function(startValue, endValue, isInverted) {
                        (isInverted ? endSlider : startSlider).setValue(startValue);
                        (isInverted ? startSlider : endSlider).setValue(endValue)
                    };
                if (options.type !== DISCRETE)
                    setValues(startValue, endValue, !inverted && startValue > endValue || inverted && startValue < endValue);
                else {
                    categoriesInfo = DX.viz.utils.getCategoriesInfo(options.categories, startValue, endValue);
                    setValues(categoriesInfo.start, categoriesInfo.end, categoriesInfo.inverted ^ inverted)
                }
            },
            getSelectedRange: function() {
                return {
                        startValue: this._sliders[START_VALUE_INDEX].getValue(),
                        endValue: this._sliders[END_VALUE_INDEX].getValue()
                    }
            },
            swapSliders: function() {
                this._sliders.reverse();
                this._callMethodForBothSliders("changeLocation")
            },
            applyAreaTrackersPosition: function() {
                var that = this,
                    selectedRange = that.getSelectedRange(),
                    options = that._options,
                    canvas = options.canvas,
                    startSliderPosition = that._sliders[START_VALUE_INDEX].getPosition(),
                    width = that._sliders[END_VALUE_INDEX].getPosition() - startSliderPosition,
                    style = {cursor: options.endValue - options.startValue === selectedRange.endValue - selectedRange.startValue ? "default" : "pointer"};
                that._selectedAreaTracker.attr({
                    x: startSliderPosition,
                    width: width < 0 ? 0 : width,
                    y: canvas.top,
                    height: canvas.height
                }).css(style);
                that._areaTracker.attr(rangeSelector.utils.canvasOptionsToRenderOptions(canvas))
            },
            applyPosition: function(disableAnimation) {
                var that = this;
                that._callMethodForBothSliders("applyPosition", disableAnimation);
                that.applyAreaTrackersPosition();
                that._applySelectedRangePosition(disableAnimation)
            },
            redraw: function(group) {
                this._callMethodForBothSliders("redraw", group);
                this._foregroundSliderIndex = END_VALUE_INDEX
            },
            toForeground: function(slider) {
                var sliderIndex = slider.getIndex();
                if (this._foregroundSliderIndex !== sliderIndex) {
                    slider.toForeground();
                    this._foregroundSliderIndex = sliderIndex
                }
            },
            appendTrackers: function(group) {
                var that = this;
                if (that._areaTracker && that._selectedAreaTracker) {
                    that._areaTracker.append(group);
                    that._selectedAreaTracker.append(group)
                }
                that._callMethodForBothSliders("appendTrackers", group)
            },
            getSlider: function(sliderIndex) {
                return this._sliders[sliderIndex]
            },
            getAreaTracker: function() {
                return this._areaTracker
            },
            getSelectedAreaTracker: function() {
                return this._selectedAreaTracker
            },
            setTrackersCursorStyle: function(style) {
                style = {cursor: style};
                this._selectedAreaTracker.css(style);
                this._areaTracker.css(style)
            },
            createShutters: function() {
                this._callMethodForBothSliders("createShutter")
            },
            removeShutters: function() {
                this._callMethodForBothSliders("removeShutter")
            },
            dispose: function() {
                this._callMethodForBothSliders("dispose")
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file slidersEventsManager.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            pointerEvents = DX.require("/ui/events/pointer/ui.events.pointer"),
            MIN_MANUAL_SELECTING_WIDTH = 10,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            addNamespace = eventUtils.addNamespace,
            _SlidersEventManager,
            rangeSelectorUtils = rangeSelector.utils,
            getEventPageX = rangeSelectorUtils.getEventPageX,
            rangeSelectorCount = 0;
        rangeSelector.events = {
            start: pointerEvents.down,
            move: pointerEvents.move,
            end: pointerEvents.up
        };
        var isLeftButtonPressed = function(event) {
                var e = event || window.event,
                    originalEvent = e.originalEvent,
                    touches = e.touches,
                    pointerType = originalEvent ? originalEvent.pointerType : false,
                    eventTouches = originalEvent ? originalEvent.touches : false,
                    isIE8LeftClick = e.which === undefined && e.button === 1,
                    isMSPointerLeftClick = originalEvent && pointerType !== undefined && (pointerType === (originalEvent.MSPOINTER_TYPE_TOUCH || "touch") || pointerType === (originalEvent.MSPOINTER_TYPE_MOUSE || "mouse") && originalEvent.buttons === 1),
                    isLeftClick = isIE8LeftClick || e.which === 1,
                    isTouches = touches && touches.length > 0 || eventTouches && eventTouches.length > 0;
                return isLeftClick || isMSPointerLeftClick || isTouches
            };
        var isMultiTouches = function(event) {
                var originalEvent = event.originalEvent,
                    touches = event.touches,
                    eventTouches = originalEvent ? originalEvent.touches : false;
                return touches && touches.length > 1 || eventTouches && eventTouches.length > 1 || null
            };
        var isTouchEventArgs = function(e) {
                return e && e.type && e.type.indexOf("touch") === 0
            };
        _SlidersEventManager = rangeSelector.SlidersEventsManager = function(renderer, slidersController, processSelectionChanged) {
            var that = this,
                uniqueNS = that._uniqueNS = "dx-range-selector_" + rangeSelectorCount++,
                rangeSelectorEvents = rangeSelector.events;
            that._renderer = renderer;
            that._slidersController = slidersController;
            that._processSelectionChanged = processSelectionChanged;
            that._enabled = true;
            that._eventsNames = {
                start: addNamespace(rangeSelectorEvents.start, uniqueNS),
                move: addNamespace(rangeSelectorEvents.move, uniqueNS),
                end: addNamespace(rangeSelectorEvents.end, uniqueNS)
            }
        };
        _SlidersEventManager.prototype = {
            constructor: _SlidersEventManager,
            _initializeSliderEvents: function(sliderIndex) {
                var that = this,
                    isTouchEvent,
                    slidersController = that._slidersController,
                    processSelectionChanged = that._processSelectionChanged,
                    slider = slidersController.getSlider(sliderIndex),
                    fastSwap,
                    startOffsetPosition,
                    splitterMoving,
                    sliderEndHandler = function() {
                        if (splitterMoving) {
                            splitterMoving = false;
                            slidersController.endSelection();
                            slidersController.processDocking();
                            processSelectionChanged(false)
                        }
                    },
                    sliderMoveHandler = function(e) {
                        var pageX,
                            offsetPosition,
                            svgOffsetLeft = that._renderer.getRootOffset().left,
                            position,
                            sliderIndex = slider.getIndex();
                        if (isTouchEvent !== isTouchEventArgs(e))
                            return;
                        if (!isLeftButtonPressed(e, true) && splitterMoving) {
                            splitterMoving = false;
                            slidersController.processDocking();
                            processSelectionChanged(false)
                        }
                        else if (splitterMoving) {
                            if (!isMultiTouches(e)) {
                                this.preventedDefault = true;
                                e.preventDefault()
                            }
                            pageX = getEventPageX(e);
                            position = pageX - startOffsetPosition - svgOffsetLeft;
                            offsetPosition = pageX - slider.getPosition() - svgOffsetLeft;
                            slidersController.moveSlider(sliderIndex, fastSwap, position, offsetPosition, startOffsetPosition, function(newStartOffsetPosition) {
                                startOffsetPosition = newStartOffsetPosition
                            });
                            processSelectionChanged(true)
                        }
                        slidersController.endSelection()
                    },
                    eventsNames = that._eventsNames;
                slider.startEventHandler = function(e) {
                    if (!that._enabled || !isLeftButtonPressed(e) || splitterMoving)
                        return;
                    fastSwap = this === slider.getSliderTracker().element;
                    splitterMoving = true;
                    isTouchEvent = isTouchEventArgs(e);
                    startOffsetPosition = getEventPageX(e) - slider.getPosition() - that._renderer.getRootOffset().left;
                    if (!isMultiTouches(e)) {
                        this.preventedDefault = true;
                        e.stopPropagation();
                        e.preventDefault()
                    }
                };
                slider.on(eventsNames.move, function() {
                    slidersController.toForeground(slider)
                });
                slider.on(eventsNames.start, slider.startEventHandler);
                $(document).on(eventsNames.end, sliderEndHandler).on(eventsNames.move, sliderMoveHandler);
                slider.__moveEventHandler = sliderMoveHandler
            },
            _initializeAreaEvents: function() {
                var that = this,
                    isTouchEvent,
                    slidersController = that._slidersController,
                    processSelectionChanged = that._processSelectionChanged,
                    areaTracker = slidersController.getAreaTracker(),
                    unselectedAreaProcessing = false,
                    startPageX,
                    areaEndHandler = function(e) {
                        var pageX;
                        if (unselectedAreaProcessing) {
                            pageX = getEventPageX(e);
                            if (that._options.behavior.moveSelectedRangeByClick && Math.abs(startPageX - pageX) < MIN_MANUAL_SELECTING_WIDTH)
                                slidersController.applySelectedAreaCenterPosition(pageX - that._renderer.getRootOffset().left);
                            unselectedAreaProcessing = false;
                            slidersController.endSelection();
                            processSelectionChanged(false)
                        }
                    },
                    areaMoveHandler = function(e) {
                        var pageX,
                            startPosition,
                            endPosition,
                            svgOffsetLeft = that._renderer.getRootOffset().left;
                        if (isTouchEvent !== isTouchEventArgs(e))
                            return;
                        if (unselectedAreaProcessing && !isLeftButtonPressed(e)) {
                            unselectedAreaProcessing = false;
                            processSelectionChanged(false)
                        }
                        if (unselectedAreaProcessing) {
                            pageX = getEventPageX(e);
                            if (that._options.behavior.manualRangeSelectionEnabled && Math.abs(startPageX - pageX) >= MIN_MANUAL_SELECTING_WIDTH) {
                                startPosition = startPageX - svgOffsetLeft;
                                endPosition = pageX - svgOffsetLeft;
                                slidersController.processManualSelection(startPosition, endPosition, e);
                                unselectedAreaProcessing = false;
                                processSelectionChanged(true)
                            }
                        }
                    },
                    eventsNames = that._eventsNames;
                areaTracker.on(eventsNames.start, function(e) {
                    if (!that._enabled || !isLeftButtonPressed(e) || unselectedAreaProcessing)
                        return;
                    unselectedAreaProcessing = true;
                    isTouchEvent = isTouchEventArgs(e);
                    startPageX = getEventPageX(e)
                });
                $(document).on(eventsNames.end, areaEndHandler).on(eventsNames.move, areaMoveHandler);
                that.__areaMoveEventHandler = areaMoveHandler
            },
            _initializeSelectedAreaEvents: function() {
                var that = this,
                    isTouchEvent,
                    slidersController = that._slidersController,
                    processSelectionChanged = that._processSelectionChanged,
                    selectedAreaTracker = slidersController.getSelectedAreaTracker(),
                    selectedAreaMoving = false,
                    offsetStartPosition,
                    selectedRangeInterval,
                    selectedAreaEndHandler = function() {
                        if (selectedAreaMoving) {
                            selectedAreaMoving = false;
                            slidersController.processDocking();
                            processSelectionChanged(false)
                        }
                    },
                    selectedAreaMoveHandler = function(e) {
                        var positionDelta,
                            pageX;
                        if (isTouchEvent !== isTouchEventArgs(e))
                            return;
                        if (selectedAreaMoving && !isLeftButtonPressed(e)) {
                            selectedAreaMoving = false;
                            slidersController.processDocking();
                            processSelectionChanged(false)
                        }
                        if (selectedAreaMoving) {
                            if (!isMultiTouches(e)) {
                                this.preventedDefault = true;
                                e.preventDefault()
                            }
                            pageX = getEventPageX(e);
                            positionDelta = pageX - slidersController.getSlider(START_VALUE_INDEX).getPosition() - offsetStartPosition;
                            slidersController.moveSliders(positionDelta, selectedRangeInterval);
                            processSelectionChanged(true)
                        }
                        slidersController.endSelection()
                    },
                    eventsNames = that._eventsNames;
                selectedAreaTracker.on(eventsNames.start, function(e) {
                    if (!that._enabled || !isLeftButtonPressed(e) || selectedAreaMoving)
                        return;
                    selectedAreaMoving = true;
                    isTouchEvent = isTouchEventArgs(e);
                    offsetStartPosition = getEventPageX(e) - slidersController.getSlider(START_VALUE_INDEX).getPosition();
                    selectedRangeInterval = slidersController.getSelectedRangeInterval();
                    if (!isMultiTouches(e)) {
                        this.preventedDefault = true;
                        e.stopPropagation();
                        e.preventDefault()
                    }
                });
                $(document).on(eventsNames.end, selectedAreaEndHandler).on(eventsNames.move, selectedAreaMoveHandler);
                that.__selectedAreaMoveEventHandler = selectedAreaMoveHandler
            },
            applyOptions: function(options) {
                this._options = options
            },
            dispose: function() {
                $(document).off("." + this._uniqueNS)
            },
            initialize: function() {
                var that = this;
                that._initializeSelectedAreaEvents(that);
                that._initializeAreaEvents();
                that._initializeSliderEvents(START_VALUE_INDEX);
                that._initializeSliderEvents(END_VALUE_INDEX)
            },
            setEnabled: function(enabled) {
                this._enabled = enabled
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file slider.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            rangeSelectorUtils = rangeSelector.utils,
            dxSupport = DX.require("/utils/utils.support"),
            dateUtils = DX.require("/utils/utils.date"),
            commonUtils = DX.require("/utils/utils.common"),
            touchSupport = dxSupport.touchEvents,
            msPointerEnabled = dxSupport.pointer,
            SPLITTER_WIDTH = 8,
            TOUCH_SPLITTER_WIDTH = 20,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            DISCRETE = "discrete",
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods,
            addInterval = rangeSelectorUtils.addInterval;
        function checkItemsSpacing(firstSliderPosition, secondSliderPosition, distance) {
            return Math.abs(secondSliderPosition - firstSliderPosition) < distance
        }
        function Slider(renderer, index) {
            baseVisualElementMethods.init.apply(this, arguments);
            this._index = index
        }
        Slider.prototype = $.extend({}, baseVisualElementMethods, {
            constructor: Slider,
            _createSlider: function(group) {
                var that = this,
                    sliderHandle,
                    sliderGroup,
                    sliderHandleOptions = that._options.sliderHandle,
                    canvas = that._options.canvas,
                    renderer = that._renderer;
                sliderGroup = renderer.g().attr({
                    "class": "slider",
                    translateX: canvas.left,
                    translateY: canvas.top
                }).append(group);
                sliderHandle = renderer.path([0, 0, 0, canvas.height], "line").attr({
                    "stroke-width": sliderHandleOptions.width,
                    stroke: sliderHandleOptions.color,
                    "stroke-opacity": sliderHandleOptions.opacity,
                    sharp: "h"
                }).append(sliderGroup);
                sliderGroup.setValid = function(correct) {
                    sliderHandle.attr({stroke: correct ? that._options.sliderHandle.color : that._options.sliderMarker.invalidRangeColor})
                };
                sliderGroup.updateHeight = function() {
                    sliderHandle.attr({points: [0, 0, 0, that._options.canvas.height]})
                };
                sliderGroup.applyOptions = function(options) {
                    sliderHandle.attr(options)
                };
                sliderGroup.__line = sliderHandle;
                return sliderGroup
            },
            _createSliderTracker: function(group) {
                var that = this,
                    sliderHandleWidth = that._options.sliderHandle.width,
                    splitterWidth = SPLITTER_WIDTH < sliderHandleWidth ? sliderHandleWidth : SPLITTER_WIDTH,
                    sliderWidth = touchSupport || msPointerEnabled ? TOUCH_SPLITTER_WIDTH : splitterWidth,
                    sliderTracker,
                    canvas = that._options.canvas,
                    renderer = that._renderer,
                    sliderTrackerGroup = renderer.g().attr({
                        "class": "sliderTracker",
                        translateX: 0,
                        translateY: canvas.top
                    }).append(group);
                sliderTracker = renderer.rect(-sliderWidth / 2, 0, sliderWidth, canvas.height).attr(rangeSelectorUtils.trackerSettings).css({cursor: "w-resize"}).append(sliderTrackerGroup);
                sliderTrackerGroup.updateHeight = function() {
                    sliderTracker.attr({height: that._options.canvas.height})
                };
                return sliderTrackerGroup
            },
            _setPosition: function(position, correctByMinMaxRange) {
                var that = this,
                    correctedPosition = that._correctPosition(position),
                    value = that._options.translator.untranslate(correctedPosition, that._getValueDirection());
                that.setValue(value, correctByMinMaxRange, false);
                that._position = correctedPosition
            },
            _getValueDirection: function() {
                return this._options.type === DISCRETE ? this._index === START_VALUE_INDEX ? -1 : 1 : 0
            },
            _setPositionForBothSliders: function(startPosition, interval) {
                var that = this,
                    anotherSlider = that.getAnotherSlider(),
                    startValue,
                    endValue,
                    endPosition,
                    options = that._options,
                    canvas = options.canvas,
                    rightBorderCoords = canvas.left + canvas.width,
                    translator = options.translator,
                    valueDirection = that._getValueDirection(),
                    valueDirectionAnotherSlider = anotherSlider._getValueDirection(),
                    getNextValue = function(value, isNegative, reverseValueDirection) {
                        var curValueDirection = !reverseValueDirection ? valueDirection : valueDirectionAnotherSlider,
                            curAnotherValueDirection = reverseValueDirection ? valueDirection : valueDirectionAnotherSlider;
                        return translator.untranslate(that._correctBounds(dateUtils.addInterval(translator.translate(value, curValueDirection), interval, isNegative)), curAnotherValueDirection)
                    };
                startPosition = that._correctBounds(startPosition);
                startValue = translator.untranslate(startPosition, valueDirection);
                endValue = getNextValue(startValue);
                endPosition = startPosition + interval;
                if (endPosition > rightBorderCoords) {
                    endValue = options.endValue;
                    endPosition = rightBorderCoords;
                    startValue = getNextValue(endValue, true, true);
                    startPosition = that._correctBounds(endPosition - interval)
                }
                else
                    endPosition = that._correctBounds(endPosition);
                if (that._values)
                    if (!options.inverted ? startValue < that._values[0] : startValue > that._values[that._values.length - 1]) {
                        startValue = that._correctByAvailableValues(startValue, false);
                        endValue = getNextValue(startValue)
                    }
                    else {
                        endValue = that._correctByAvailableValues(endValue, false);
                        startValue = getNextValue(endValue, true)
                    }
                anotherSlider.setValue(endValue, undefined, false);
                that.setValue(startValue, undefined, false);
                that._position = startPosition;
                anotherSlider._position = endPosition
            },
            _correctPosition: function(position) {
                return this._correctBounds(this._correctInversion(position))
            },
            _correctInversion: function(position) {
                var anotherSliderPosition = this._anotherSlider.getPosition(),
                    slidersInverted = this._index === START_VALUE_INDEX ? position > anotherSliderPosition : position < anotherSliderPosition;
                return slidersInverted ? anotherSliderPosition : position
            },
            _correctBounds: function(position) {
                var correctedPosition = position,
                    canvas = this._options.canvas;
                if (position < canvas.left)
                    correctedPosition = canvas.left;
                if (position > canvas.left + canvas.width)
                    correctedPosition = canvas.left + canvas.width;
                return correctedPosition
            },
            _correctValue: function(businessValue, correctByMinMaxRange, skipCorrection) {
                var that = this,
                    result = that._correctByAvailableValues(businessValue, skipCorrection);
                if (correctByMinMaxRange)
                    result = that._correctByMinMaxRange(result);
                if (that._options.type !== DISCRETE)
                    result = that._correctByMinRange(result);
                return result
            },
            _correctByAvailableValues: function(businessValue, skipCorrection) {
                var values = this._values;
                return !skipCorrection && values ? rangeSelectorUtils.findNearValue(values, businessValue) : businessValue
            },
            _correctByMinMaxRange: function(businessValue) {
                var that = this,
                    result = businessValue,
                    options = that._options,
                    values = that._values,
                    sliderIndex = that._index,
                    anotherSlider = that.getAnotherSlider(),
                    anotherBusinessValue = anotherSlider.getValue(),
                    isValid = true,
                    minValue,
                    maxValue,
                    maxRange = options.maxRange,
                    minRange = options.minRange,
                    isNegative,
                    tmp;
                if (options.type === DISCRETE) {
                    if (checkItemsSpacing(that.getPosition(), anotherSlider.getPosition(), options.translator.getInterval())) {
                        isValid = false;
                        result = anotherBusinessValue
                    }
                }
                else {
                    isNegative = !options.inverted && sliderIndex === START_VALUE_INDEX || options.inverted && sliderIndex === END_VALUE_INDEX;
                    if (maxRange) {
                        tmp = addInterval(anotherBusinessValue, maxRange, isNegative, options);
                        if (isNegative)
                            minValue = tmp;
                        else
                            maxValue = tmp
                    }
                    if (minRange) {
                        tmp = addInterval(anotherBusinessValue, minRange, isNegative, options);
                        if (isNegative)
                            maxValue = tmp;
                        else
                            minValue = tmp
                    }
                    if (maxValue !== undefined && result > maxValue) {
                        result = values ? rangeSelectorUtils.findLessOrEqualValue(values, maxValue) : maxValue;
                        isValid = false
                    }
                    else if (minValue !== undefined && result < minValue) {
                        result = values ? rangeSelectorUtils.findGreaterOrEqualValue(values, minValue) : minValue;
                        isValid = false
                    }
                }
                that._setValid(isValid);
                return result
            },
            _correctByMinRange: function(businessValue) {
                var that = this,
                    options = that._options,
                    startValue,
                    endValue,
                    minRange = options.minRange,
                    result = businessValue;
                if (minRange)
                    if (that._index === END_VALUE_INDEX) {
                        startValue = addInterval(options.startValue, minRange, options.inverted, options);
                        if (!options.inverted && result < startValue || options.inverted && result > startValue)
                            result = startValue
                    }
                    else {
                        endValue = addInterval(options.endValue, minRange, !options.inverted, options);
                        if (!options.inverted && result > endValue || options.inverted && result < endValue)
                            result = endValue
                    }
                return result
            },
            _applySliderPosition: function(position, disableAnimation) {
                var that = this,
                    options = that._options,
                    isAnimation = options.behavior.animationEnabled && !disableAnimation,
                    slider = that._slider,
                    sliderTracker = that._sliderTracker,
                    attrs = {
                        translateX: position,
                        translateY: options.canvas.top
                    },
                    animationSettings = rangeSelectorUtils.animationSettings;
                that._marker && that._marker.setPosition(position);
                if (isAnimation) {
                    slider.animate(attrs, animationSettings);
                    sliderTracker.animate(attrs, animationSettings)
                }
                else {
                    slider.stopAnimation().attr(attrs);
                    sliderTracker.stopAnimation().attr(attrs)
                }
                sliderTracker.updateHeight();
                slider.updateHeight()
            },
            _applyShutterPosition: function(position, disableAnimation) {
                var that = this,
                    shutterSettings,
                    options = that._options,
                    shutter = that._shutter,
                    isAnimation = options.behavior.animationEnabled && !disableAnimation,
                    sliderIndex = that._index,
                    canvas = options.canvas,
                    halfSliderHandleWidth = options.sliderHandle.width / 2,
                    width;
                if (!shutter)
                    return;
                if (sliderIndex === START_VALUE_INDEX) {
                    width = position - canvas.left - Math.floor(halfSliderHandleWidth);
                    if (width < 0)
                        width = 0;
                    shutterSettings = {
                        x: canvas.left,
                        y: canvas.top,
                        width: width,
                        height: canvas.height
                    }
                }
                else if (sliderIndex === END_VALUE_INDEX)
                    shutterSettings = {
                        x: position + Math.ceil(halfSliderHandleWidth),
                        y: canvas.top,
                        width: canvas.left + canvas.width - position,
                        height: canvas.height
                    };
                if (isAnimation)
                    shutter.animate(shutterSettings, rangeSelectorUtils.animationSettings);
                else
                    shutter.stopAnimation().attr(shutterSettings)
            },
            _setValid: function(isValid) {
                this._marker && this._marker.setValid(isValid);
                this._slider.setValid(isValid)
            },
            _setText: function(text) {
                this._marker && this._marker.setText(text)
            },
            _update: function() {
                var that = this,
                    options = that._options,
                    shutterOptions = options.shutter,
                    sliderHandleOptions = options.sliderHandle,
                    marker = that._marker;
                if (marker) {
                    marker.applyOptions(options.sliderMarker);
                    marker.setCanvas(that._options.canvas)
                }
                that._shutter && that._shutter.attr({
                    fill: shutterOptions.color,
                    "fill-opacity": shutterOptions.opacity
                });
                that._slider && that._slider.applyOptions({
                    "stroke-width": sliderHandleOptions.width,
                    stroke: sliderHandleOptions.color,
                    "stroke-opacity": sliderHandleOptions.opacity
                })
            },
            _draw: function(group) {
                var that = this,
                    slider,
                    marker,
                    sliderAreaGroup,
                    options = that._options,
                    renderer = that._renderer;
                that._container = sliderAreaGroup = renderer.g().attr({"class": "sliderArea"}).append(group);
                slider = that._createSlider(sliderAreaGroup);
                if (options.sliderMarker.visible) {
                    marker = new rangeSelector.SliderMarker({
                        renderer: renderer,
                        isLeftPointer: that._index === END_VALUE_INDEX,
                        sliderMarkerOptions: options.sliderMarker
                    });
                    marker.setCanvas(options.canvas);
                    marker.draw(slider)
                }
                that._slider = slider;
                that._marker = marker;
                that._sliderTracker = that._createSliderTracker(group)
            },
            toForeground: function() {
                this._container.toForeground()
            },
            _applyOptions: function() {
                this._lastPosition = null
            },
            getIndex: function() {
                return this._index
            },
            setAvailableValues: function(values) {
                this._values = values
            },
            setAnotherSlider: function(slider) {
                this._anotherSlider = slider
            },
            getAnotherSlider: function() {
                return this._anotherSlider
            },
            appendTrackers: function(group) {
                this._sliderTracker && this._sliderTracker.append(group)
            },
            getSliderTracker: function() {
                return this._sliderTracker
            },
            changeLocation: function() {
                var that = this;
                that._marker && that._marker.changeLocation();
                that._index = +!that._index;
                that._options.type === DISCRETE && that.setPosition(that._position);
                that._lastPosition = null
            },
            setPosition: function(position, correctByMinMaxRange, selectedRangeInterval) {
                var that = this,
                    slider;
                if (selectedRangeInterval !== undefined) {
                    slider = that._index === START_VALUE_INDEX ? that : that.getAnotherSlider();
                    slider._setPositionForBothSliders(position, selectedRangeInterval)
                }
                else
                    that._setPosition(position, correctByMinMaxRange)
            },
            getPosition: function() {
                return this._position
            },
            setValue: function(value, correctByMinMaxRange, skipCorrection) {
                var that = this,
                    options = that._options,
                    canvas = options.canvas,
                    position,
                    text;
                if (value === undefined) {
                    that._value = undefined;
                    position = that._index === START_VALUE_INDEX ? canvas.left : canvas.left + canvas.width;
                    text = rangeSelector.consts.emptySliderMarkerText
                }
                else {
                    that._value = that._correctValue(value, correctByMinMaxRange, commonUtils.isDefined(skipCorrection) ? !!skipCorrection : true);
                    position = options.translator.translate(that._value, that._getValueDirection());
                    text = rangeSelector.formatValue(that._value, options.sliderMarker)
                }
                that._setText(text);
                that._valuePosition = that._position = position
            },
            setOverlapped: function(isOverlapped) {
                this._marker && this._marker.setOverlapped(isOverlapped)
            },
            getValue: function() {
                return this._value
            },
            canSwap: function() {
                var that = this,
                    options = that._options,
                    startValue,
                    endValue,
                    anotherSliderValue;
                if (that._options.behavior.allowSlidersSwap) {
                    if (options.minRange) {
                        anotherSliderValue = that.getAnotherSlider().getValue();
                        if (that._index === START_VALUE_INDEX) {
                            endValue = addInterval(options.endValue, options.minRange, !options.inverted, options);
                            if (!options.inverted && anotherSliderValue > endValue || options.inverted && anotherSliderValue < endValue)
                                return false
                        }
                        else {
                            startValue = addInterval(options.startValue, options.minRange, options.inverted, options);
                            if (!options.inverted && anotherSliderValue < startValue || options.inverted && anotherSliderValue > startValue)
                                return false
                        }
                    }
                    return true
                }
                return false
            },
            processDocking: function() {
                var that = this;
                that._position = that._valuePosition;
                that.applyPosition(false);
                that._setValid(true)
            },
            applyPosition: function(disableAnimation) {
                var that = this,
                    position = that.getPosition();
                if (that._lastPosition !== position) {
                    that._applySliderPosition(position, disableAnimation);
                    that._applyShutterPosition(position, disableAnimation);
                    that._lastPosition = position
                }
            },
            on: function(event, handler) {
                var that = this,
                    marker = that._marker,
                    tracker = marker && marker.getTracker(),
                    sliderTracker = that._sliderTracker;
                sliderTracker && sliderTracker.on(event, handler);
                tracker && tracker.on(event, handler)
            },
            createShutter: function() {
                var that = this,
                    canvas = that._options.canvas,
                    width = that._index === START_VALUE_INDEX ? 0 : canvas.width;
                if (!that._shutter)
                    that._shutter = that._renderer.rect(canvas.left, canvas.top, width, canvas.height);
                that._shutter.append(that._container)
            },
            removeShutter: function() {
                this._shutter && this._shutter.remove()
            },
            getCloudBorder: function() {
                return this._marker ? this._marker.getBorderPosition() : 0
            },
            dispose: function() {
                this._marker && this._marker.dispose()
            },
            getText: function() {
                if (this._marker)
                    return this._marker.getText()
            },
            getAvailableValues: function() {
                return this._values
            }
        });
        rangeSelector.Slider = Slider
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file sliderMarker.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            patchFontOptions = viz.utils.patchFontOptions,
            rangeSelector = viz.rangeSelector,
            SliderMarker,
            SLIDER_MARKER_UPDATE_DELAY = 75,
            POINTER_SIZE = rangeSelector.consts.pointerSize;
        var getRectSize = function(that, textSize) {
                var options = that._options;
                return {
                        width: Math.round(2 * options.paddingLeftRight + textSize.width),
                        height: Math.round(2 * options.paddingTopBottom + textSize.height)
                    }
            };
        var getAreaPointsInfo = function(that, textSize) {
                var rectSize = getRectSize(that, textSize),
                    rectWidth = rectSize.width,
                    rectHeight = rectSize.height,
                    rectLeftBorder = -rectWidth,
                    rectRightBorder = 0,
                    pointerRightPoint = POINTER_SIZE,
                    pointerCenterPoint = 0,
                    pointerLeftPoint = -POINTER_SIZE,
                    position = that._position,
                    canvas = that._canvas,
                    isLeft = that._isLeftPointer,
                    correctCloudBorders = function() {
                        rectLeftBorder++;
                        rectRightBorder++;
                        pointerRightPoint++;
                        pointerCenterPoint++;
                        pointerLeftPoint++
                    },
                    checkPointerBorders = function() {
                        if (pointerRightPoint > rectRightBorder)
                            pointerRightPoint = rectRightBorder;
                        else if (pointerLeftPoint < rectLeftBorder)
                            pointerLeftPoint = rectLeftBorder;
                        isLeft && correctCloudBorders()
                    },
                    borderPosition = position;
                if (isLeft)
                    if (position > canvas.left + canvas.width - rectWidth) {
                        rectRightBorder = -position + (canvas.left + canvas.width);
                        rectLeftBorder = rectRightBorder - rectWidth;
                        checkPointerBorders();
                        borderPosition += rectLeftBorder
                    }
                    else {
                        rectLeftBorder = pointerLeftPoint = 0;
                        rectRightBorder = rectWidth
                    }
                else if (position - canvas.left < rectWidth) {
                    rectLeftBorder = -(position - canvas.left);
                    rectRightBorder = rectLeftBorder + rectWidth;
                    checkPointerBorders();
                    borderPosition += rectRightBorder
                }
                else {
                    pointerRightPoint = 0;
                    correctCloudBorders()
                }
                that._borderPosition = borderPosition;
                return {
                        offset: rectLeftBorder,
                        isCutted: (!isLeft || pointerCenterPoint !== pointerLeftPoint) && (isLeft || pointerCenterPoint !== pointerRightPoint),
                        points: [rectLeftBorder, 0, rectRightBorder, 0, rectRightBorder, rectHeight, pointerRightPoint, rectHeight, pointerCenterPoint, rectHeight + POINTER_SIZE, pointerLeftPoint, rectHeight, rectLeftBorder, rectHeight]
                    }
            };
        var getTextSize = function(that) {
                var textSize = that._label.getBBox();
                if (!that._textHeight && isFinite(textSize.height))
                    that._textHeight = textSize.height;
                return {
                        width: textSize.width,
                        height: that._textHeight,
                        y: textSize.y
                    }
            };
        SliderMarker = rangeSelector.SliderMarker = function(options) {
            var that = this;
            that._renderer = options.renderer;
            that._text = options.text;
            that._isLeftPointer = options.isLeftPointer;
            that._options = $.extend(true, {}, options.sliderMarkerOptions);
            that._options.textFontStyles = patchFontOptions(that._options.font);
            that._isValid = true;
            that._isOverlapped = false
        };
        SliderMarker.prototype = {
            constructor: SliderMarker,
            _update: function() {
                var that = this,
                    textSize,
                    options = that._options,
                    currentTextSize,
                    rectSize;
                clearTimeout(that._timeout);
                if (!that._drawn)
                    return;
                that._label.attr({text: that._text || ""});
                currentTextSize = getTextSize(that);
                rectSize = getRectSize(that, currentTextSize);
                textSize = that._textSize || currentTextSize;
                textSize = that._textSize = currentTextSize.width > textSize.width || currentTextSize.height > textSize.height ? currentTextSize : textSize;
                that._timeout = setTimeout(function() {
                    updateSliderMarker(currentTextSize, rectSize);
                    that._textSize = currentTextSize
                }, SLIDER_MARKER_UPDATE_DELAY);
                function updateSliderMarker(size, rectSize) {
                    var points,
                        pointsData,
                        offset;
                    rectSize = rectSize || getRectSize(that, size);
                    that._sliderMarkerGroup.attr({translateY: -(rectSize.height + POINTER_SIZE)});
                    pointsData = getAreaPointsInfo(that, size);
                    points = pointsData.points;
                    offset = pointsData.offset;
                    that._area.attr({points: points});
                    that._border.attr({
                        x: that._isLeftPointer ? points[0] - 1 : points[2],
                        height: pointsData.isCutted ? rectSize.height : rectSize.height + POINTER_SIZE
                    });
                    that._tracker.attr({
                        translateX: offset,
                        width: rectSize.width,
                        height: rectSize.height + POINTER_SIZE
                    });
                    that._label.attr({
                        translateX: options.paddingLeftRight + offset,
                        translateY: rectSize.height / 2 - (size.y + size.height / 2)
                    })
                }
                updateSliderMarker(textSize)
            },
            draw: function(group) {
                var that = this,
                    options = that._options,
                    renderer = that._renderer,
                    sliderMarkerGroup = that._sliderMarkerGroup = renderer.g().attr({"class": "sliderMarker"}).append(group);
                that._area = renderer.path([], "area").attr({fill: options.color}).append(sliderMarkerGroup);
                that._label = renderer.text(that._text, 0, 0).attr({align: "left"}).css(options.textFontStyles).append(sliderMarkerGroup);
                that._tracker = renderer.rect(0, 0, 2 * options.paddingLeftRight, 2 * options.paddingTopBottom + POINTER_SIZE).attr(rangeSelector.utils.trackerSettings).css({cursor: "pointer"}).append(sliderMarkerGroup);
                that._border = renderer.rect(0, 0, 1, 0).attr({fill: options.borderColor});
                that._drawn = true;
                that._update()
            },
            setText: function(value) {
                if (this._text !== value)
                    this._text = value
            },
            setPosition: function(position) {
                this._position = position;
                this._update()
            },
            changeLocation: function() {
                var that = this;
                that._isLeftPointer = !that._isLeftPointer;
                that._update()
            },
            applyOptions: function(options) {
                var that = this;
                that._textHeight = null;
                that._area.attr({fill: options.color});
                that._border.attr({fill: options.borderColor});
                that._label.css(patchFontOptions(options.font));
                that._update()
            },
            getTracker: function() {
                return this._tracker
            },
            setValid: function(isValid) {
                var that = this,
                    options = that._options;
                if (that._isValid !== isValid) {
                    that._isValid = isValid;
                    that._area.attr({fill: isValid ? options.color : options.invalidRangeColor})
                }
            },
            dispose: function() {
                clearTimeout(this._timeout)
            },
            setOverlapped: function(isOverlapped) {
                var border = this._border;
                if (this._isOverlapped === isOverlapped)
                    return;
                if (isOverlapped)
                    border.append(this._sliderMarkerGroup);
                else
                    this._isOverlapped && border.remove();
                this._isOverlapped = isOverlapped
            },
            getBorderPosition: function() {
                return this._borderPosition
            },
            setCanvas: function(canvas) {
                this._canvas = canvas
            }
        };
        SliderMarker.prototype.updateDelay = SLIDER_MARKER_UPDATE_DELAY;
        SliderMarker.prototype.getText = function() {
            return this._text
        }
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file rangeView.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            RangeView,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods;
        RangeView = function() {
            baseVisualElementMethods.init.apply(this, arguments)
        };
        RangeView.prototype = $.extend({}, baseVisualElementMethods, {
            constructor: RangeView,
            _draw: function(group) {
                var that = this,
                    series,
                    i,
                    options = that._options,
                    canvas = options.canvas,
                    isEmpty = options.scale.isEmpty,
                    renderer = that._renderer,
                    seriesDataSource = options.seriesDataSource,
                    showChart = seriesDataSource && seriesDataSource.isShowChart() && !isEmpty,
                    background = options.background,
                    backgroundColor = showChart ? seriesDataSource.getBackgroundColor() : background.color,
                    backgroundImage = background.image,
                    backgroundIsVisible = background.visible,
                    animationEnabled;
                if (backgroundIsVisible && !isEmpty && backgroundColor)
                    renderer.rect(canvas.left, canvas.top, canvas.width + 1, canvas.height).attr({
                        fill: backgroundColor,
                        "class": "dx-range-selector-background"
                    }).append(group);
                if (backgroundIsVisible && backgroundImage && backgroundImage.url)
                    renderer.image(canvas.left, canvas.top, canvas.width + 1, canvas.height, backgroundImage.url, backgroundImage.location).append(group);
                if (showChart) {
                    series = seriesDataSource.getSeries();
                    seriesDataSource.adjustSeriesDimensions(options.translators, options.chart.useAggregation);
                    animationEnabled = options.behavior && options.behavior.animationEnabled && renderer.animationEnabled();
                    for (i = 0; i < series.length; i++) {
                        series[i]._extGroups.seriesGroup = group;
                        series[i]._extGroups.labelsGroup = group;
                        series[i].draw(options.translators, animationEnabled)
                    }
                }
            }
        });
        rangeSelector.RangeView = RangeView
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file seriesDataSource.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            charts = DX.viz.charts,
            viz = DX.viz,
            coreFactory = viz.CoreFactory,
            commonUtils = DX.require("/utils/utils.common"),
            _SeriesDatasource;
        var createThemeManager = function(chartOptions) {
                return charts.factory.createThemeManager(chartOptions, 'rangeSelector.chart')
            };
        var isArrayOfSimpleTypes = function(data) {
                return $.isArray(data) && data.length > 0 && (commonUtils.isNumber(data[0]) || commonUtils.isDate(data[0]))
            };
        var convertToArrayOfObjects = function(data) {
                return viz.utils.map(data, function(item, i) {
                        return {
                                arg: item,
                                val: i
                            }
                    })
            };
        var processSeriesFamilies = function(series, equalBarWidth, minBubbleSize, maxBubbleSize, barWidth) {
                var families = [],
                    types = [];
                $.each(series, function(i, item) {
                    if ($.inArray(item.type, types) === -1)
                        types.push(item.type)
                });
                $.each(types, function(_, type) {
                    var family = new coreFactory.createSeriesFamily({
                            type: type,
                            equalBarWidth: equalBarWidth,
                            minBubbleSize: minBubbleSize,
                            maxBubbleSize: maxBubbleSize,
                            barWidth: barWidth
                        });
                    family.add(series);
                    family.adjustSeriesValues();
                    families.push(family)
                });
                return families
            };
        var isStickType = function(type) {
                var nonStickTypes = ["bar", "candlestick", "stock", "bubble"],
                    stickType = true;
                type = viz.utils.normalizeEnum(type);
                $.each(nonStickTypes, function(_, item) {
                    if (type.indexOf(item) !== -1) {
                        stickType = false;
                        return false
                    }
                });
                return stickType
            };
        function setTemplateFields(data, templateData, series) {
            $.each(data, function(_, data) {
                $.each(series.getTeamplatedFields(), function(_, field) {
                    data[field.teamplateField] = data[field.originalField]
                });
                templateData.push(data)
            });
            series.updateTeamplateFieldNames()
        }
        _SeriesDatasource = rangeSelector.SeriesDataSource = function(options) {
            var that = this,
                templatedSeries,
                seriesTemplate,
                themeManager = that._themeManager = createThemeManager(options.chart),
                topIndent,
                bottomIndent;
            themeManager._fontFields = ["commonSeriesSettings.label.font"];
            themeManager.setTheme(options.chart.theme);
            topIndent = themeManager.getOptions('topIndent');
            bottomIndent = themeManager.getOptions('bottomIndent');
            that._indent = {
                top: topIndent >= 0 && topIndent < 1 ? topIndent : 0,
                bottom: bottomIndent >= 0 && bottomIndent < 1 ? bottomIndent : 0
            };
            that._valueAxis = themeManager.getOptions('valueAxisRangeSelector') || {};
            that._hideChart = false;
            seriesTemplate = themeManager.getOptions('seriesTemplate');
            if (options.dataSource && seriesTemplate)
                templatedSeries = viz.utils.processSeriesTemplate(seriesTemplate, options.dataSource);
            that._series = that._calculateSeries(options, templatedSeries);
            that._seriesFamilies = processSeriesFamilies(that._series, themeManager.getOptions('equalBarWidth'), themeManager.getOptions('minBubbleSize'), themeManager.getOptions('maxBubbleSize'), themeManager.getOptions('barWidth'))
        };
        _SeriesDatasource.prototype = {
            constructor: _SeriesDatasource,
            _calculateSeries: function(options, templatedSeries) {
                var that = this,
                    series = [],
                    particularSeriesOptions,
                    seriesTheme,
                    data,
                    groupSeries,
                    parsedData,
                    chartThemeManager = that._themeManager,
                    hasSeriesTemplate = !!chartThemeManager.getOptions('seriesTemplate'),
                    allSeriesOptions = hasSeriesTemplate ? templatedSeries : options.chart.series,
                    seriesValueType = options.chart.valueAxis && options.chart.valueAxis.valueType,
                    dataSourceField,
                    i,
                    newSeries,
                    particularSeries;
                that.teamplateData = [];
                if (options.dataSource && !allSeriesOptions) {
                    if (isArrayOfSimpleTypes(options.dataSource))
                        options.dataSource = convertToArrayOfObjects(options.dataSource);
                    dataSourceField = options.dataSourceField || 'arg';
                    allSeriesOptions = {
                        argumentField: dataSourceField,
                        valueField: dataSourceField
                    };
                    that._hideChart = true
                }
                allSeriesOptions = $.isArray(allSeriesOptions) ? allSeriesOptions : allSeriesOptions ? [allSeriesOptions] : [];
                that._backgroundColor = options.backgroundColor;
                for (i = 0; i < allSeriesOptions.length; i++) {
                    particularSeriesOptions = $.extend(true, {incidentOccured: options.incidentOccured}, allSeriesOptions[i]);
                    particularSeriesOptions.rotated = false;
                    data = particularSeriesOptions.data || options.dataSource;
                    seriesTheme = chartThemeManager.getOptions("series", particularSeriesOptions);
                    seriesTheme.argumentField = seriesTheme.argumentField || options.dataSourceField;
                    if (data && data.length > 0) {
                        newSeries = coreFactory.createSeries({renderer: options.renderer}, seriesTheme);
                        series.push(newSeries)
                    }
                    if (hasSeriesTemplate)
                        setTemplateFields(data, that.teamplateData, newSeries)
                }
                data = hasSeriesTemplate ? that.teamplateData : data;
                groupSeries = [series];
                groupSeries.argumentOptions = {
                    categories: options.categories,
                    argumentType: options.valueType,
                    type: options.axisType
                };
                groupSeries[0].valueOptions = {valueType: dataSourceField ? options.valueType : seriesValueType};
                parsedData = viz.validateData(data, groupSeries, options.incidentOccured, chartThemeManager.getOptions("dataPrepareSettings"));
                for (i = 0; i < series.length; i++) {
                    particularSeries = series[i];
                    particularSeries.updateData(parsedData)
                }
                return series
            },
            adjustSeriesDimensions: function(translators, useAggregation) {
                var that = this;
                if (useAggregation)
                    $.each(that._series || [], function(_, s) {
                        s.resamplePoints(translators.x)
                    });
                $.each(that._seriesFamilies, function(_, family) {
                    family.adjustSeriesDimensions({
                        arg: translators.x,
                        val: translators.y
                    })
                })
            },
            getBoundRange: function() {
                var that = this,
                    rangeData,
                    valueAxisMin = that._valueAxis.min,
                    valueAxisMax = that._valueAxis.max,
                    valRange = new viz.Range({
                        isValueRange: true,
                        min: valueAxisMin,
                        minVisible: valueAxisMin,
                        max: valueAxisMax,
                        maxVisible: valueAxisMax,
                        axisType: that._valueAxis.type,
                        base: that._valueAxis.logarithmBase
                    }),
                    argRange = new viz.Range({}),
                    rangeYSize,
                    rangeVisibleSizeY,
                    minIndent,
                    maxIndent;
                $.each(that._series, function(_, series) {
                    rangeData = series.getRangeData();
                    valRange.addRange(rangeData.val);
                    argRange.addRange(rangeData.arg);
                    if (!isStickType(series.type))
                        argRange.addRange({stick: false})
                });
                if (valRange.isDefined() && argRange.isDefined()) {
                    minIndent = that._valueAxis.inverted ? that._indent.top : that._indent.bottom;
                    maxIndent = that._valueAxis.inverted ? that._indent.bottom : that._indent.top;
                    rangeYSize = valRange.max - valRange.min;
                    rangeVisibleSizeY = ($.isNumeric(valRange.maxVisible) ? valRange.maxVisible : valRange.max) - ($.isNumeric(valRange.minVisible) ? valRange.minVisible : valRange.min);
                    if (commonUtils.isDate(valRange.min))
                        valRange.min = new Date(valRange.min.valueOf() - rangeYSize * minIndent);
                    else
                        valRange.min -= rangeYSize * minIndent;
                    if (commonUtils.isDate(valRange.max))
                        valRange.max = new Date(valRange.max.valueOf() + rangeYSize * maxIndent);
                    else
                        valRange.max += rangeYSize * maxIndent;
                    if ($.isNumeric(rangeVisibleSizeY)) {
                        valRange.maxVisible = valRange.maxVisible ? valRange.maxVisible + rangeVisibleSizeY * maxIndent : undefined;
                        valRange.minVisible = valRange.minVisible ? valRange.minVisible - rangeVisibleSizeY * minIndent : undefined
                    }
                    valRange.invert = that._valueAxis.inverted
                }
                return {
                        arg: argRange,
                        val: valRange
                    }
            },
            getSeries: function() {
                var that = this;
                return that._series
            },
            getBackgroundColor: function() {
                return this._backgroundColor
            },
            isEmpty: function() {
                var that = this;
                return that.getSeries().length === 0
            },
            isShowChart: function() {
                var that = this;
                return !that.isEmpty() && !that._hideChart
            },
            getCalculatedValueType: function() {
                var that = this,
                    result;
                if (that._series.length)
                    result = that._series[0].argumentType;
                return result
            },
            getThemeManager: function() {
                return this._themeManager
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file themeManager.js */
    (function($, DX, undefined) {
        DX.viz.rangeSelector.ThemeManager = DX.viz.BaseThemeManager.inherit({
            _themeSection: "rangeSelector",
            _fontFields: ["scale.label.font", "sliderMarker.font", "loadingIndicator.font", "title.font", "title.subtitle.font"]
        })
    })(jQuery, DevExpress);
    DevExpress.MOD_VIZ_RANGESELECTOR = true
}