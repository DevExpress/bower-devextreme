/*! 
* DevExtreme (Range Selector)
* Version: 15.1.5
* Build date: Jul 15, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!DevExpress.MOD_VIZ_RANGESELECTOR) {
    if (!DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-rangeselector, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz.rangeSelector = {}
    })(DevExpress);
    /*! Module viz-rangeselector, file utils.js */
    (function($, DX, undefined) {
        var dxUtils = DX.utils;
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
                        if (dxUtils.isDate(value)) {
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
                var isDiscrete = scaleOptions.type === 'discrete',
                    categories = isDiscrete ? scaleOptions._categoriesInfo.categories : undefined,
                    startValue = scaleOptions.startValue,
                    endValue = scaleOptions.endValue,
                    min,
                    max,
                    valueIndex;
                if (isDiscrete) {
                    valueIndex = $.inArray(value, categories);
                    return valueIndex < 0 ? startValue : value
                }
                else
                    min = startValue > endValue ? endValue : startValue,
                    max = startValue > endValue ? startValue : endValue;
                if (value < min)
                    value = min;
                if (value > max)
                    value = max;
                return value
            };
        DX.viz.rangeSelector.utils = {
            findLessOrEqualValue: findLessOrEqualValue,
            findNearValue: findNearValue,
            findGreaterOrEqualValue: findGreaterOrEqualValue,
            getEventPageX: getEventPageX,
            truncateSelectedRange: truncateSelectedRange,
            trackerSettings: {
                fill: 'grey',
                stroke: 'grey',
                opacity: 0.0001
            },
            animationSettings: {duration: 250}
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
            utils = DX.utils,
            core = DX.viz.core,
            patchFontOptions = core.utils.patchFontOptions,
            ParseUtils = core.ParseUtils,
            formatHelper = DX.formatHelper,
            SCALE_TEXT_SPACING = 5,
            HEIGHT_COMPACT_MODE = 24,
            POINTER_SIZE = 4,
            EMPTY_SLIDER_MARKER_TEXT = '. . .',
            _isDefined = utils.isDefined,
            _isNumber = utils.isNumber,
            _isDate = utils.isDate,
            _max = Math.max,
            _ceil = Math.ceil,
            _noop = $.noop,
            START_VALUE = 'startValue',
            END_VALUE = 'endValue',
            DATETIME = 'datetime',
            SELECTED_RANGE = 'selectedRange',
            DISCRETE = 'discrete',
            STRING = 'string',
            SELECTED_RANGE_CHANGED = SELECTED_RANGE + 'Changed',
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
                return String(utils.isFunction(formatOptions.customizeText) ? formatOptions.customizeText.call(formatObject, formatObject) : formatObject.valueText)
            };
        var createTranslator = function(range, canvas) {
                return {
                        x: core.CoreFactory.createTranslator2D(range.arg, canvas, {direction: "horizontal"}),
                        y: core.CoreFactory.createTranslator2D(range.val, canvas)
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
        var calculateRangeContainerCanvas = function(size, indents, scaleLabelsAreaHeight, isCompactMode) {
                var canvas = {
                        left: size.left + indents.left,
                        top: size.top + indents.top,
                        width: size.width - size.left - size.right - indents.left - indents.right,
                        height: !isCompactMode ? size.height - size.top - size.bottom - indents.top : HEIGHT_COMPACT_MODE + scaleLabelsAreaHeight
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
                return validType('date') ? DATETIME : validType('number') ? 'numeric' : validType(STRING) ? STRING : ''
            };
        var showScaleMarkers = function(scaleOptions) {
                return scaleOptions.valueType === DATETIME && scaleOptions.marker.visible
            };
        var updateTranslatorRangeInterval = function(translatorRange, scaleOptions) {
                var intervalX = scaleOptions.minorTickInterval || scaleOptions.majorTickInterval;
                if (scaleOptions.valueType === "datetime")
                    intervalX = utils.dateToMilliseconds(intervalX);
                translatorRange = translatorRange.arg.addRange({interval: intervalX})
            };
        var createRange = function(options) {
                return new core.Range(options)
            };
        var checkLogarithmicOptions = function(options, defaultLogarithmBase, incidentOccured) {
                var logarithmBase;
                if (!options)
                    return;
                logarithmBase = options.logarithmBase;
                if (options.type === LOGARITHMIC && logarithmBase <= 0 || logarithmBase && !_isNumber(logarithmBase)) {
                    options.logarithmBase = defaultLogarithmBase;
                    incidentOccured('E2104')
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
                    text = utils.isFunction(customizeText) ? customizeText.call(formatObject, formatObject) : value,
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
                    tickManager = core.CoreFactory.createTickManager({
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
                        tickInterval: scaleOptions.majorTickInterval,
                        incidentOccured: incidentOccured,
                        base: scaleOptions.logarithmBase,
                        showMinorTicks: true,
                        withMinorCorrection: true,
                        stick: stick !== false
                    });
                tickManager.getTicks(true);
                return {
                        majorTickInterval: tickManager.getTickInterval(),
                        minorTickInterval: tickManager.getMinorTickInterval(),
                        bounds: tickManager.getTickBounds()
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
                    scaleOptions._categoriesInfo = categoriesInfo = utils.getCategoriesInfo(categories, startValue || categories[0], endValue || categories[categories.length - 1])
                }
                if (_isDefined(startValue) && _isDefined(endValue)) {
                    inverted = scaleOptions.inverted = categoriesInfo ? categoriesInfo.inverted : startValue > endValue;
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
                        scaleOptions.valueType = 'numeric';
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
        DX.registerComponent("dxRangeSelector", rangeSelector, core.BaseWidget.inherit({
            _eventsMap: $.extend({}, core.BaseWidget.prototype._eventsMap, {
                onSelectedRangeChanged: {
                    name: SELECTED_RANGE_CHANGED,
                    deprecated: SELECTED_RANGE_CHANGED,
                    deprecatedContext: function() {
                        return null
                    },
                    deprecatedArgs: function(arg) {
                        return [cloneSelectedRange(arg)]
                    }
                },
                selectedRangeChanged: {newName: "onSelectedRangeChanged"}
            }),
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {
                    selectedRangeChanged: {
                        since: "14.2",
                        message: "Use the 'onSelectedRangeChanged' option instead"
                    },
                    "sliderMarker.padding": {
                        since: "15.1",
                        message: "Use the 'paddingTopBottom' and 'paddingLeftRight' options instead"
                    },
                    "sliderMarker.placeholderSize": {
                        since: "15.1",
                        message: "Use the 'placeholderHeight' and 'indent' options instead"
                    }
                })
            },
            _rootClassPrefix: "dxrs",
            _rootClass: "dxrs-range-selector",
            _dataSourceOptions: function() {
                return {paginate: false}
            },
            _dataIsReady: function() {
                return this._isDataSourceReady()
            },
            _init: function() {
                this.callBase();
                this._reinitDataSource()
            },
            _initCore: function() {
                var renderer = this._renderer;
                this.rangeContainer = rangeSelector.rangeSelectorFactory.createRangeContainer(renderer);
                renderer.root.css({
                    "touch-action": "pan-y",
                    "-ms-touch-action": "pan-y"
                })
            },
            _getDefaultSize: function() {
                return {
                        width: 400,
                        height: 160
                    }
            },
            _reinitDataSource: function() {
                this._refreshDataSource()
            },
            _disposeCore: function() {
                var that = this,
                    disposeObject = function(propName) {
                        that[propName] && that[propName].dispose(),
                        that[propName] = null
                    };
                that.callBase();
                disposeObject("renderer");
                that.translators = null;
                disposeObject("rangeContainer")
            },
            _createThemeManager: function() {
                return rangeSelector.rangeSelectorFactory.createThemeManager()
            },
            _render: function(isResizing) {
                var that = this,
                    currentAnimationEnabled,
                    renderer = that._renderer;
                isResizing = isResizing || that.__isResizing;
                !isResizing && that._scheduleLoadingIndicatorHiding();
                that._applyOptions();
                if (isResizing) {
                    currentAnimationEnabled = renderer.animationEnabled();
                    renderer.updateAnimationOptions({enabled: false});
                    that.rangeContainer.redraw();
                    renderer.updateAnimationOptions({enabled: currentAnimationEnabled})
                }
                else
                    that.rangeContainer.redraw();
                that._checkLoadingIndicatorHiding(!that._dataSource || that._dataSource.isLoaded());
                that._drawn();
                that.__rendered && that.__rendered()
            },
            _optionChanged: function(args) {
                var that = this,
                    name = args.name;
                that._scheduleLoadingIndicatorHiding();
                if (name === "dataSource")
                    that._reinitDataSource();
                else if (name === SELECTED_RANGE)
                    that.setSelectedRange(that.option(SELECTED_RANGE));
                else
                    that.callBase(args)
            },
            _resize: function() {
                this._render(true)
            },
            _dataSourceChangedHandler: function() {
                var that = this;
                that._endLoading(function() {
                    if (that._renderer.drawn)
                        that._render()
                })
            },
            _applyOptions: function() {
                var that = this,
                    rangeContainerCanvas,
                    seriesDataSource,
                    translatorRange,
                    scaleLabelsAreaHeight,
                    sizeOptions = that._canvas,
                    indents,
                    sliderMarkerOptions,
                    selectedRange,
                    chartOptions = that.option('chart'),
                    shutterOptions = that._getOption("shutter"),
                    background = that._getOption(BACKGROUND),
                    isCompactMode,
                    scaleOptions,
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
                that._updateScaleOptions(seriesDataSource, translatorRange.arg, sizeOptions.width);
                updateTranslatorRangeInterval(translatorRange, scaleOptions);
                sliderMarkerOptions = that._prepareSliderMarkersOptions(sizeOptions.width);
                selectedRange = that._initSelection();
                indents = calculateIndents(that._renderer, sizeOptions, scaleOptions, sliderMarkerOptions, that.option("indent"));
                scaleLabelsAreaHeight = calculateScaleAreaHeight(that._renderer, scaleOptions, showScaleMarkers(scaleOptions));
                rangeContainerCanvas = calculateRangeContainerCanvas(sizeOptions, indents, scaleLabelsAreaHeight, isCompactMode);
                that.translators = createTranslator(translatorRange, createTranslatorCanvas(sizeOptions, rangeContainerCanvas, scaleLabelsAreaHeight));
                scaleOptions.ticksInfo = that._getTicksInfo(rangeContainerCanvas.width);
                that._testTicksInfo = scaleOptions.ticksInfo;
                that._selectedRange = selectedRange;
                if (seriesDataSource)
                    seriesDataSource.adjustSeriesDimensions(that.translators);
                shutterOptions.color = shutterOptions.color || that._getOption(CONTAINER_BACKGROUND_COLOR, true);
                that.rangeContainer.applyOptions({
                    canvas: rangeContainerCanvas,
                    isCompactMode: isCompactMode,
                    scaleLabelsAreaHeight: scaleLabelsAreaHeight,
                    indents: indents,
                    translators: that.translators,
                    selectedRange: selectedRange,
                    scale: scaleOptions,
                    behavior: that._getOption('behavior'),
                    background: background,
                    chart: chartOptions,
                    seriesDataSource: seriesDataSource,
                    sliderMarker: sliderMarkerOptions,
                    sliderHandle: that._getOption('sliderHandle'),
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
                    dataSource = that._dataSource && that._dataSource.items(),
                    scaleOptions = that._getOption('scale'),
                    valueType = scaleOptions.valueType,
                    backgroundOption = that.option(BACKGROUND);
                if (!valueType)
                    valueType = calculateValueType(scaleOptions.startValue, scaleOptions.endValue);
                if (dataSource || chartOptions && chartOptions.series) {
                    chartOptions = $.extend({}, chartOptions, {theme: that.option("theme")});
                    seriesDataSource = new rangeSelector.SeriesDataSource({
                        renderer: that._renderer,
                        dataSource: dataSource,
                        valueType: (valueType || '').toLowerCase(),
                        axisType: scaleOptions.type,
                        chart: chartOptions,
                        dataSourceField: that.option('dataSourceField'),
                        backgroundColor: backgroundOption && backgroundOption.color,
                        incidentOccured: that._incidentOccured,
                        categories: scaleOptions.categories
                    })
                }
                return seriesDataSource
            },
            _prepareScaleOptions: function(seriesDataSource) {
                var that = this,
                    scaleOptions = that._getOption('scale'),
                    parsedValue = 0,
                    parseUtils = new ParseUtils,
                    valueType = parseUtils.correctValueType((scaleOptions.valueType || '').toLowerCase()),
                    parser,
                    validateStartEndValues = function(field, parser) {
                        var messageToIncidentOccured = field === START_VALUE ? 'start' : 'end';
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
                    valueType = calculateValueType(scaleOptions.startValue, scaleOptions.endValue) || 'numeric';
                if (valueType === STRING || scaleOptions.categories) {
                    scaleOptions.type = DISCRETE;
                    valueType = STRING
                }
                scaleOptions.valueType = valueType;
                parser = parseUtils.getParser(valueType, 'scale');
                validateStartEndValues(START_VALUE, parser);
                validateStartEndValues(END_VALUE, parser);
                checkLogarithmicOptions(scaleOptions, logarithmBase, that._incidentOccured);
                if (!scaleOptions.type)
                    scaleOptions.type = 'continuous';
                scaleOptions.parser = parser;
                return scaleOptions
            },
            _prepareSliderMarkersOptions: function(screenDelta) {
                var that = this,
                    scaleOptions = that._scaleOptions,
                    minorTickInterval = scaleOptions.minorTickInterval,
                    majorTickInterval = scaleOptions.majorTickInterval,
                    endValue = scaleOptions.endValue,
                    startValue = scaleOptions.startValue,
                    sliderMarkerOptions = that._getOption(SLIDER_MARKER),
                    businessInterval,
                    sliderMarkerUserOption = that.option(SLIDER_MARKER) || {};
                sliderMarkerOptions.borderColor = that._getOption(CONTAINER_BACKGROUND_COLOR, true);
                if (!sliderMarkerOptions.format) {
                    if (!that._getOption('behavior').snapToTicks && _isNumber(scaleOptions.startValue)) {
                        businessInterval = Math.abs(endValue - startValue);
                        sliderMarkerOptions.format = 'fixedPoint';
                        sliderMarkerOptions.precision = utils.getSignificantDigitPosition(businessInterval / screenDelta)
                    }
                    if (scaleOptions.valueType === DATETIME)
                        if (!scaleOptions.marker.visible) {
                            if (_isDefined(startValue) && _isDefined(endValue))
                                sliderMarkerOptions.format = formatHelper.getDateFormatByTickInterval(startValue, endValue, minorTickInterval !== 0 ? minorTickInterval : majorTickInterval)
                        }
                        else
                            sliderMarkerOptions.format = utils.getDateUnitInterval(_isDefined(minorTickInterval) && minorTickInterval !== 0 ? minorTickInterval : majorTickInterval)
                }
                if (sliderMarkerUserOption.padding !== undefined && sliderMarkerUserOption.paddingLeftRight === undefined && sliderMarkerUserOption.paddingTopBottom === undefined)
                    sliderMarkerOptions.paddingLeftRight = sliderMarkerOptions.paddingTopBottom = sliderMarkerUserOption.padding;
                return sliderMarkerOptions
            },
            _updateScaleOptions: function(seriesDataSource, translatorRange, screenDelta) {
                var scaleOptions = this._scaleOptions,
                    min = _isDefined(translatorRange.minVisible) ? translatorRange.minVisible : translatorRange.min,
                    max = _isDefined(translatorRange.maxVisible) ? translatorRange.maxVisible : translatorRange.max,
                    tickIntervalsInfo = updateTickIntervals(scaleOptions, screenDelta, this._incidentOccured, translatorRange.stick, min, max),
                    bounds,
                    isEmptyInterval,
                    categoriesInfo = scaleOptions._categoriesInfo;
                if (seriesDataSource && !seriesDataSource.isEmpty() && !translatorRange.stubData) {
                    bounds = tickIntervalsInfo.bounds;
                    translatorRange.addRange(bounds);
                    scaleOptions.startValue = scaleOptions.inverted ? bounds.maxVisible : bounds.minVisible;
                    scaleOptions.endValue = scaleOptions.inverted ? bounds.minVisible : bounds.maxVisible
                }
                if (categoriesInfo) {
                    scaleOptions.startValue = categoriesInfo.start;
                    scaleOptions.endValue = categoriesInfo.end
                }
                isEmptyInterval = _isDate(scaleOptions.startValue) && _isDate(scaleOptions.endValue) && scaleOptions.startValue.getTime() === scaleOptions.endValue.getTime() || scaleOptions.startValue === scaleOptions.endValue;
                scaleOptions.isEmpty = startEndNotDefined(scaleOptions.startValue, scaleOptions.endValue) || isEmptyInterval;
                if (scaleOptions.isEmpty)
                    scaleOptions.startValue = scaleOptions.endValue = undefined;
                else {
                    scaleOptions.minorTickInterval = tickIntervalsInfo.minorTickInterval;
                    scaleOptions.majorTickInterval = tickIntervalsInfo.majorTickInterval;
                    if (scaleOptions.valueType === DATETIME && !_isDefined(scaleOptions.label.format))
                        if (!scaleOptions.marker.visible)
                            scaleOptions.label.format = formatHelper.getDateFormatByTickInterval(scaleOptions.startValue, scaleOptions.endValue, scaleOptions.majorTickInterval);
                        else
                            scaleOptions.label.format = utils.getDateUnitInterval(scaleOptions.majorTickInterval)
                }
            },
            _getStubTicks: function(scaleOptions) {
                scaleOptions.isEmpty = true;
                return ["canvas_position_left", "canvas_position_center", "canvas_position_right"]
            },
            _getTickManagerOptions: function(scaleOptions, isEmpty, startValue, endValue) {
                var that = this;
                return {
                        labelOptions: {},
                        minorTickInterval: isEmpty ? 0 : that._getOption('scale').minorTickInterval,
                        tickInterval: scaleOptions.majorTickInterval,
                        addMinMax: scaleOptions.showCustomBoundaryTicks ? {
                            min: true,
                            max: true
                        } : undefined,
                        minorTickCount: scaleOptions.minorTickCount,
                        textOptions: {
                            align: 'center',
                            font: scaleOptions.label.font
                        },
                        textFontStyles: patchFontOptions(scaleOptions.label.font),
                        incidentOccured: that._incidentOccured,
                        isHorizontal: true,
                        renderText: function(text, x, y, options) {
                            return that._renderer.text(text, x, y, options).append(that._renderer.root)
                        },
                        getText: startEndNotDefined(startValue, endValue) ? function(value) {
                            return value
                        } : function(value) {
                            return formatValue(value, scaleOptions.label)
                        },
                        translate: function(value) {
                            return that.translators.x.translate(value)
                        },
                        textSpacing: SCALE_TEXT_SPACING,
                        setTicksAtUnitBeginning: scaleOptions.setTicksAtUnitBeginning,
                        useTicksAutoArrangement: scaleOptions.useTicksAutoArrangement,
                        base: scaleOptions.logarithmBase,
                        stick: true,
                        showMinorTicks: true,
                        withMinorCorrection: true
                    }
            },
            _getTicksInfo: function(screenDelta) {
                var that = this,
                    scaleOptions = that._scaleOptions,
                    translators = that.translators,
                    isEmpty = scaleOptions.isEmpty,
                    businessRange = translators.x.getBusinessRange(),
                    categoriesInfo = scaleOptions._categoriesInfo,
                    tickManagerTypes = {
                        axisType: scaleOptions.type,
                        dataType: scaleOptions.valueType
                    },
                    tickManagerData,
                    startValue = scaleOptions.startValue,
                    endValue = scaleOptions.endValue,
                    tickManagerOptions = that._getTickManagerOptions(scaleOptions, isEmpty, startValue, endValue),
                    majorTicks,
                    customBoundaryTicks,
                    tickManager,
                    fullTicks,
                    noInfoFromMinMax;
                tickManagerData = {
                    min: isEmpty ? businessRange.min : startValue,
                    max: isEmpty ? businessRange.max : endValue,
                    screenDelta: screenDelta,
                    customTicks: categoriesInfo && categoriesInfo.categories
                };
                tickManager = core.CoreFactory.createTickManager(tickManagerTypes, tickManagerData, tickManagerOptions);
                if (scaleOptions.type === DISCRETE)
                    noInfoFromMinMax = !_isDefined(tickManagerData.min) || !_isDefined(tickManagerData.max);
                else
                    noInfoFromMinMax = !_isDefined(tickManagerData.min) && !_isDefined(tickManagerData.max);
                majorTicks = noInfoFromMinMax && !_isDefined(tickManagerData.customTicks) ? that._getStubTicks(scaleOptions) : tickManager.getTicks(true);
                customBoundaryTicks = tickManager.getBoundaryTicks();
                fullTicks = tickManager.getFullTicks();
                if (customBoundaryTicks.length) {
                    if (majorTicks[0].valueOf() === customBoundaryTicks[0].valueOf())
                        majorTicks.splice(0, 1);
                    if (majorTicks[majorTicks.length - 1].valueOf() === customBoundaryTicks[customBoundaryTicks.length - 1].valueOf())
                        majorTicks.pop()
                }
                return {
                        majorTicks: majorTicks,
                        minorTicks: tickManager.getMinorTicks(),
                        majorTickInterval: tickManager.getTickInterval(),
                        fullTicks: fullTicks,
                        customBoundaryTicks: customBoundaryTicks
                    }
            },
            getSelectedRange: function() {
                return cloneSelectedRange(this.rangeContainer.slidersContainer.getSelectedRange())
            },
            setSelectedRange: function(selectedRange) {
                var that = this;
                if (that._isUpdating || !selectedRange)
                    return;
                var oldSelectedRange = that.rangeContainer.slidersContainer.getSelectedRange();
                if (oldSelectedRange && oldSelectedRange.startValue === selectedRange.startValue && oldSelectedRange.endValue === selectedRange.endValue)
                    return;
                that.rangeContainer.slidersContainer.setSelectedRange(selectedRange)
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
            _handleLoadingIndicatorShown: _noop,
            _initTooltip: _noop,
            _setTooltipRendererOptions: _noop,
            _setTooltipOptions: _noop
        }).include(DX.ui.DataHelperMixin))
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file rangeContainer.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods,
            RangeContainer;
        var createSlidersContainer = function(renderer) {
                return rangeSelector.rangeSelectorFactory.createSlidersContainer(renderer)
            };
        var createScale = function(renderer) {
                return rangeSelector.rangeSelectorFactory.createScale(renderer)
            };
        var createRangeView = function(renderer) {
                return rangeSelector.rangeSelectorFactory.createRangeView(renderer)
            };
        var _createClipRectCanvas = function(canvas, indents) {
                return {
                        left: canvas.left - indents.left,
                        top: canvas.top - indents.top,
                        width: canvas.width + indents.right + indents.left,
                        height: canvas.height + indents.bottom + indents.top
                    }
            };
        function canvasOptionsToRenderOptions(canvasOptions) {
            return {
                    x: canvasOptions.left,
                    y: canvasOptions.top,
                    width: canvasOptions.width,
                    height: canvasOptions.height
                }
        }
        RangeContainer = function(renderer) {
            baseVisualElementMethods.init.apply(this, arguments);
            this.slidersContainer = createSlidersContainer(renderer);
            this.rangeView = createRangeView(renderer);
            this.scale = createScale(renderer)
        };
        RangeContainer.prototype = $.extend({}, baseVisualElementMethods, {
            constructor: RangeContainer,
            dispose: function() {
                this.slidersContainer.dispose();
                this.slidersContainer = null
            },
            _applyOptions: function(options) {
                var that = this,
                    scaleLabelsAreaHeight = options.scaleLabelsAreaHeight,
                    canvas = options.canvas,
                    isCompactMode = options.isCompactMode,
                    viewCanvas = {
                        left: canvas.left,
                        top: canvas.top,
                        width: canvas.width,
                        height: canvas.height >= scaleLabelsAreaHeight ? canvas.height - scaleLabelsAreaHeight : 0
                    };
                that._viewCanvas = viewCanvas;
                that.slidersContainer.applyOptions({
                    isCompactMode: isCompactMode,
                    canvas: viewCanvas,
                    selectedRangeColor: options.selectedRangeColor,
                    translator: options.translators.x,
                    scale: options.scale,
                    selectedRange: options.selectedRange,
                    sliderMarker: options.sliderMarker,
                    sliderHandle: options.sliderHandle,
                    shutter: options.shutter,
                    behavior: options.behavior,
                    selectedRangeChanged: options.selectedRangeChanged
                });
                that.rangeView.applyOptions({
                    isCompactMode: isCompactMode,
                    canvas: viewCanvas,
                    translators: options.translators,
                    background: options.background,
                    chart: options.chart,
                    seriesDataSource: options.seriesDataSource,
                    behavior: options.behavior,
                    isEmpty: options.scale.isEmpty
                });
                that.scale.applyOptions({
                    isCompactMode: isCompactMode,
                    canvas: canvas,
                    translator: options.translators.x,
                    scale: options.scale,
                    scaleLabelsAreaHeight: scaleLabelsAreaHeight,
                    setSelectedRange: options.setSelectedRange
                })
            },
            _draw: function() {
                var that = this,
                    containerGroup,
                    rangeViewGroup,
                    slidersContainerGroup,
                    scaleGroup,
                    trackersGroup,
                    options = that._options,
                    clipRectCanvas = _createClipRectCanvas(options.canvas, options.indents),
                    viewCanvas = that._viewCanvas,
                    renderer = that._renderer,
                    slidersContainer = that.slidersContainer;
                that._clipRect = renderer.clipRect(clipRectCanvas.left, clipRectCanvas.top, clipRectCanvas.width, clipRectCanvas.height);
                that._viewClipRect = renderer.clipRect(viewCanvas.left, viewCanvas.top, viewCanvas.width, viewCanvas.height);
                containerGroup = renderer.g().attr({
                    'class': 'rangeContainer',
                    clipId: that._clipRect.id
                }).append(renderer.root);
                rangeViewGroup = renderer.g().attr({
                    'class': 'view',
                    clipId: that._viewClipRect.id
                });
                that._slidersGroup = slidersContainerGroup = renderer.g().attr({'class': 'slidersContainer'});
                scaleGroup = renderer.g().attr({'class': 'scale'});
                trackersGroup = renderer.g().attr({'class': 'trackers'});
                rangeViewGroup.append(containerGroup);
                if (!options.isCompactMode) {
                    slidersContainerGroup.append(containerGroup);
                    scaleGroup.append(containerGroup)
                }
                else {
                    scaleGroup.append(containerGroup);
                    slidersContainerGroup.append(containerGroup)
                }
                trackersGroup.append(containerGroup);
                that.rangeView.redraw(rangeViewGroup);
                slidersContainer.redraw(slidersContainerGroup);
                that.scale.redraw(scaleGroup);
                that._trackersGroup = trackersGroup;
                slidersContainer.appendTrackers(trackersGroup)
            },
            _update: function() {
                var that = this,
                    options = that._options,
                    slidersContainer = that.slidersContainer;
                that._clipRect.attr(canvasOptionsToRenderOptions(_createClipRectCanvas(options.canvas, options.indents)));
                that._viewClipRect.attr(canvasOptionsToRenderOptions(that._viewCanvas));
                that.rangeView.redraw();
                slidersContainer.redraw(that._slidersGroup);
                slidersContainer.appendTrackers(that._trackersGroup);
                that.scale.redraw()
            },
            createSlidersContainer: createSlidersContainer,
            createScale: createScale
        });
        rangeSelector.RangeContainer = RangeContainer
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file scale.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            rangeSelector = viz.rangeSelector,
            formatHelper = DX.formatHelper,
            rangeSelectorUtils = rangeSelector.utils,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            HALF_TICK_LENGTH = 6,
            MINOR_TICK_OPACITY_COEF = 0.6,
            Scale,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods,
            _extend = $.extend;
        function calculateRangeByMarkerPosition(posX, markerDatePositions, scaleOptions) {
            var selectedRange = {},
                position,
                i;
            for (i = 0; i < markerDatePositions.length; i++) {
                position = markerDatePositions[i];
                if (!scaleOptions.inverted) {
                    if (posX >= position.posX)
                        selectedRange.startValue = position.date;
                    else if (!selectedRange.endValue)
                        selectedRange.endValue = position.date
                }
                else if (posX < position.posX)
                    selectedRange.endValue = position.date;
                else if (!selectedRange.startValue)
                    selectedRange.startValue = position.date
            }
            selectedRange.startValue = selectedRange.startValue || scaleOptions.startValue;
            selectedRange.endValue = selectedRange.endValue || scaleOptions.endValue;
            return selectedRange
        }
        var dateSetters = {};
        dateSetters.millisecond = function(date) {
            date.setMilliseconds(0)
        };
        dateSetters.second = function(date) {
            date.setSeconds(0, 0)
        };
        dateSetters.minute = function(date) {
            date.setMinutes(0, 0, 0)
        };
        dateSetters.hour = function(date) {
            date.setHours(0, 0, 0, 0)
        };
        dateSetters.week = dateSetters.day = function(date) {
            date.setDate(1);
            dateSetters.hour(date)
        };
        dateSetters.month = function(date) {
            date.setMonth(0);
            dateSetters.day(date)
        };
        dateSetters.quarter = function(date) {
            date.setMonth(formatHelper.getFirstQuarterMonth(date.getMonth()));
            dateSetters.day(date)
        };
        function getMarkerDate(date, tickInterval) {
            var markerDate = new Date(date.getTime()),
                setter = dateSetters[tickInterval];
            setter && setter(markerDate);
            return markerDate
        }
        function prepareDatesDifferences(datesDifferences, tickInterval) {
            var deleteDifferent = tickInterval,
                dateUnitInterval,
                i;
            if (deleteDifferent === 'week')
                deleteDifferent = 'day';
            if (deleteDifferent === 'quarter')
                deleteDifferent = 'month';
            if (datesDifferences[deleteDifferent])
                for (i = 0; i < utils.dateUnitIntervals.length; i++) {
                    dateUnitInterval = utils.dateUnitIntervals[i];
                    if (datesDifferences[dateUnitInterval]) {
                        datesDifferences[dateUnitInterval] = false;
                        datesDifferences.count--
                    }
                    if (dateUnitInterval === deleteDifferent)
                        break
                }
        }
        function getLabel(value, options) {
            var formatObject = {
                    value: value,
                    valueText: formatHelper.format(value, options.format, options.precision)
                };
            return String(utils.isFunction(options.customizeText) ? options.customizeText.call(formatObject, formatObject) : formatObject.valueText)
        }
        Scale = function() {
            baseVisualElementMethods.init.apply(this, arguments)
        };
        Scale.prototype = _extend({}, baseVisualElementMethods, {
            constructor: Scale,
            _setupDateUnitInterval: function(scaleOptions) {
                var key,
                    millisecTickInterval,
                    majorTickInterval = scaleOptions.ticksInfo.majorTickInterval,
                    majorTicks = scaleOptions.ticksInfo.majorTicks;
                if (scaleOptions.valueType === 'datetime') {
                    if (majorTicks && majorTicks.autoArrangementStep > 1) {
                        if (utils.isString(majorTickInterval))
                            majorTickInterval = utils.getDateIntervalByString(majorTickInterval);
                        for (key in majorTickInterval)
                            if (majorTickInterval.hasOwnProperty(key)) {
                                majorTickInterval[key] *= majorTicks.autoArrangementStep;
                                millisecTickInterval = utils.dateToMilliseconds(majorTickInterval)
                            }
                        majorTickInterval = utils.convertMillisecondsToDateUnits(millisecTickInterval)
                    }
                    this.dateUnitInterval = utils.getDateUnitInterval(majorTickInterval)
                }
            },
            _getDrawnDateMarker: function(date, options) {
                var that = this,
                    labelPosX,
                    labelPosY,
                    scaleOptions = that._options.scale,
                    textElement,
                    textElementWidth,
                    textIndent,
                    pathElement;
                if (options.x === null)
                    return;
                that.textOptions.align = "left";
                pathElement = that._renderer.path([options.x, options.y, options.x, options.y + scaleOptions.marker.separatorHeight], "line").attr(that._majorTickStyle).append(options.group);
                textElement = that._renderer.text(getLabel(date, options.label), 0, 0).attr(that.textOptions).css(that.fontOptions).append(options.group);
                textElementWidth = textElement.getBBox().width;
                textIndent = scaleOptions.tick.width + scaleOptions.marker.textLeftIndent;
                labelPosX = scaleOptions.inverted ? options.x - textIndent - textElementWidth : options.x + textIndent;
                labelPosY = options.y + scaleOptions.marker.textTopIndent + that.fontOptions["font-size"];
                textElement.move(labelPosX, labelPosY);
                return {
                        x1: labelPosX,
                        x2: labelPosX + textElementWidth,
                        path: pathElement,
                        text: textElement
                    }
            },
            _deleteDrawnDateMarker: function(marker) {
                marker.path.dispose();
                marker.path = null;
                marker.text.dispose();
                marker.text = null
            },
            _drawDateMarkers: function(dates, group) {
                var that = this,
                    i,
                    options = that._options,
                    datesLength = dates.length,
                    datesDifferences,
                    markerDate,
                    posX,
                    markerDatePositions = [],
                    prevDateMarker,
                    dateMarker;
                if (options.scale.valueType !== 'datetime' || !that.visibleMarkers)
                    return;
                if (dates.length > 1) {
                    for (i = 1; i < datesLength; i++) {
                        datesDifferences = utils.getDatesDifferences(dates[i - 1], dates[i]);
                        prepareDatesDifferences(datesDifferences, that.dateUnitInterval);
                        if (datesDifferences.count > 0) {
                            markerDate = getMarkerDate(dates[i], that.dateUnitInterval);
                            that.markerDates = that.markerDates || [];
                            that.markerDates.push(markerDate);
                            posX = that.translator.translate(markerDate);
                            dateMarker = that._getDrawnDateMarker(markerDate, {
                                group: group,
                                y: options.canvas.top + options.canvas.height - that.markersAreaHeight + options.scale.marker.topIndent,
                                x: posX,
                                label: that._getLabelFormatOptions(formatHelper.getDateFormatByDifferences(datesDifferences))
                            });
                            if (prevDateMarker === undefined || dateMarker.x1 > prevDateMarker.x2 || dateMarker.x2 < prevDateMarker.x1) {
                                posX !== null && markerDatePositions.push({
                                    date: markerDate,
                                    posX: posX
                                });
                                prevDateMarker = dateMarker
                            }
                            else
                                that._deleteDrawnDateMarker(dateMarker)
                        }
                    }
                    that._initializeMarkersEvents(markerDatePositions, group)
                }
            },
            _getLabelFormatOptions: function(formatString) {
                if (!_isDefined(this._options.scale.marker.label.format))
                    return _extend({}, this._options.scale.marker.label, {format: formatString});
                return this._options.scale.marker.label
            },
            _initializeMarkersEvents: function(markerDatePositions, group) {
                var that = this,
                    options = that._options,
                    markersAreaTop = options.canvas.top + options.canvas.height - this.markersAreaHeight + options.scale.marker.topIndent,
                    markersTracker,
                    svgOffsetLeft,
                    posX,
                    selectedRange;
                if (markerDatePositions.length > 0) {
                    markersTracker = that._renderer.rect(options.canvas.left, markersAreaTop, options.canvas.width, options.scale.marker.separatorHeight).attr(rangeSelectorUtils.trackerSettings).append(group);
                    markersTracker.on(rangeSelector.events.start, function(e) {
                        svgOffsetLeft = that._renderer.getRootOffset().left;
                        posX = rangeSelectorUtils.getEventPageX(e) - svgOffsetLeft;
                        selectedRange = calculateRangeByMarkerPosition(posX, markerDatePositions, options.scale);
                        options.setSelectedRange(selectedRange)
                    });
                    that._markersTracker = markersTracker
                }
            },
            _drawLabel: function(text, group) {
                var that = this,
                    options = that._options,
                    canvas = options.canvas,
                    textY = canvas.top + canvas.height - that.markersAreaHeight,
                    textElements = that._renderer.text(getLabel(text, options.scale.label), that.translator.translate(text), textY).attr(that.textOptions).css(that.fontOptions).append(group);
                that.textElements = that.textElements || [];
                that.textElements.push(textElements)
            },
            _drawTicks: function(ticks, group, directionOffset, coords, style, labelsGroup) {
                var that = this,
                    i,
                    posX,
                    tickElement;
                for (i = 0; i < ticks.length; i++) {
                    if (labelsGroup)
                        that._drawLabel(ticks[i], labelsGroup);
                    posX = that.translator.translate(ticks[i], directionOffset);
                    tickElement = that._createLine([posX, coords[0], posX, coords[1]], group, style);
                    that.tickElements = that.tickElements || [];
                    that.tickElements.push(tickElement)
                }
            },
            _createLine: function(points, group, options) {
                return this._renderer.path(points, "line").attr(options).append(group)
            },
            _redraw: function(group) {
                var that = this,
                    options = that._options,
                    scaleOptions = options.scale,
                    renderer = that._renderer,
                    labelsGroup = renderer.g().append(group),
                    ticksGroup = renderer.g(),
                    ticksInfo = scaleOptions.ticksInfo,
                    majorTicks = ticksInfo.majorTicks,
                    minorTicks = ticksInfo.minorTicks,
                    customBoundaryTicks = ticksInfo.customBoundaryTicks,
                    hideLabels = scaleOptions.isEmpty || !scaleOptions.label.visible,
                    isDiscrete = scaleOptions.type === "discrete",
                    directionOffset = isDiscrete ? -1 : 0,
                    isCompactMode = options.isCompactMode,
                    canvas = options.canvas,
                    bottom = canvas.top + canvas.height - that.scaleLabelsAreaHeight,
                    center = canvas.top + (bottom - canvas.top) / 2,
                    coords = isCompactMode ? [center - HALF_TICK_LENGTH, center + HALF_TICK_LENGTH] : [canvas.top, bottom],
                    categoriesInfo = scaleOptions._categoriesInfo,
                    majorTickStyle = that._majorTickStyle;
                that._drawTicks(majorTicks, ticksGroup, directionOffset, coords, majorTickStyle, !hideLabels && labelsGroup);
                if (scaleOptions.showMinorTicks || isDiscrete)
                    that._drawTicks(minorTicks, ticksGroup, directionOffset, coords, that._minorTickStyle);
                that._drawTicks(customBoundaryTicks, ticksGroup, 0, coords, majorTickStyle);
                isDiscrete && categoriesInfo && _isDefined(categoriesInfo.end) && that._drawTicks([categoriesInfo.end], ticksGroup, 1, coords, majorTickStyle);
                if (isCompactMode)
                    that._createLine([canvas.left, center, canvas.width + canvas.left, center], group, _extend({}, majorTickStyle, {sharp: "v"}));
                ticksGroup.append(group);
                that._drawDateMarkers(majorTicks, labelsGroup)
            },
            _applyOptions: function(options) {
                var that = this,
                    scaleOptions = options.scale,
                    labelsAreaHeight,
                    tick = scaleOptions.tick;
                that.textOptions = {align: 'center'};
                that.fontOptions = viz.core.utils.patchFontOptions(scaleOptions.label.font);
                that._majorTickStyle = {
                    "stroke-width": tick.width,
                    stroke: tick.color,
                    "stroke-opacity": tick.opacity,
                    sharp: "h"
                };
                that._minorTickStyle = _extend({}, that._majorTickStyle, {"stroke-opacity": tick.opacity * MINOR_TICK_OPACITY_COEF});
                that._setupDateUnitInterval(scaleOptions);
                that.visibleMarkers = scaleOptions.marker.visible === undefined ? true : scaleOptions.marker.visible;
                labelsAreaHeight = scaleOptions.label.visible ? scaleOptions.label.topIndent + that.fontOptions["font-size"] : 0;
                that.scaleLabelsAreaHeight = options.scaleLabelsAreaHeight;
                that.markersAreaHeight = that.scaleLabelsAreaHeight - labelsAreaHeight;
                that.translator = options.translator
            },
            _draw: function(group) {
                this._redraw(group)
            },
            _update: function() {
                if (this._markersTracker)
                    this._markersTracker.off(rangeSelector.events.start, '**');
                baseVisualElementMethods._update.apply(this, arguments)
            }
        });
        Scale.prototype._calculateRangeByMarkerPosition = calculateRangeByMarkerPosition;
        Scale.prototype._prepareDatesDifferences = prepareDatesDifferences;
        rangeSelector.Scale = Scale
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file rangeFactory.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector;
        rangeSelector.rangeSelectorFactory = function() {
            return {
                    createRangeContainer: function(renderer) {
                        return new rangeSelector.RangeContainer(renderer)
                    },
                    createSlidersContainer: function(renderer) {
                        return new rangeSelector.SlidersContainer(renderer)
                    },
                    createScale: function(renderer) {
                        return new rangeSelector.Scale(renderer)
                    },
                    createSliderMarker: function(options) {
                        return new rangeSelector.SliderMarker(options)
                    },
                    createRangeView: function(renderer) {
                        return new rangeSelector.RangeView(renderer)
                    },
                    createThemeManager: function(options) {
                        return new rangeSelector.ThemeManager(options)
                    },
                    createSlider: function(renderer, sliderIndex) {
                        return new rangeSelector.Slider(renderer, sliderIndex)
                    },
                    createSlidersEventsManager: function(renderer, slidersController, processSelectionChanged) {
                        return new rangeSelector.SlidersEventsManager(renderer, slidersController, processSelectionChanged)
                    },
                    createSlidersController: function(sliders) {
                        return new rangeSelector.SlidersController(sliders)
                    }
                }
        }()
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file slidersContainer.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            utils = DX.utils,
            msPointerEnabled = DX.support.pointer,
            isNumber = utils.isNumber,
            isDate = utils.isDate,
            isString = utils.isString,
            rangeSelectorUtils = rangeSelector.utils,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods,
            rangeSelectorFactory = rangeSelector.rangeSelectorFactory,
            trackerAttributes = rangeSelectorUtils.trackerSettings;
        function SlidersContainer() {
            var that = this;
            baseVisualElementMethods.init.apply(that, arguments);
            that._controller = rangeSelectorFactory.createSlidersController(that._renderer);
            that._eventsManager = rangeSelectorFactory.createSlidersEventsManager(that._renderer, that._controller, function(moving) {
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
            dispose: function() {
                this._eventsManager.dispose();
                this._controller.dispose();
                this._eventManager = null
            },
            _processSelectionChanged: function(moving, blockSelectedRangeChanged) {
                var that = this,
                    equalLastSelectedRange = function(selectedRange) {
                        return selectedRange && that._lastSelectedRange.startValue === selectedRange.startValue && that._lastSelectedRange.endValue === selectedRange.endValue
                    },
                    selectedRange = that.getSelectedRange();
                if ((!moving || (that._options.behavior.callSelectedRangeChanged || '').toLowerCase() === "onmoving") && that._options.selectedRangeChanged && !equalLastSelectedRange(selectedRange)) {
                    that._updateLastSelectedRange(selectedRange);
                    if (utils.isFunction(that._options.selectedRangeChanged))
                        that._options.selectedRangeChanged.call(null, selectedRange, blockSelectedRangeChanged);
                    if (!moving && !equalLastSelectedRange(selectedRange))
                        that.setSelectedRange(selectedRange)
                }
            },
            _updateLastSelectedRange: function(selectedRange) {
                selectedRange = selectedRange || this._options.selectedRange;
                this._lastSelectedRange = {
                    startValue: selectedRange.startValue,
                    endValue: selectedRange.endValue
                }
            },
            getSelectedRange: function() {
                return this._controller.getSelectedRange()
            },
            setSelectedRange: function(selectedRange) {
                var that = this,
                    scale = that._options.scale,
                    startValue,
                    endValue,
                    currentSelectedRange = that._options.selectedRange,
                    checkTypes = function(valueName, value) {
                        var valueFromScale = scale[valueName];
                        if (isNumber(valueFromScale) && isNumber(value) || isDate(valueFromScale) && isDate(value) || isString(valueFromScale) && isString(value))
                            currentSelectedRange[valueName] = value
                    };
                if (selectedRange) {
                    startValue = selectedRange.startValue;
                    endValue = selectedRange.endValue
                }
                checkTypes('startValue', startValue);
                checkTypes('endValue', endValue);
                currentSelectedRange.startValue = rangeSelectorUtils.truncateSelectedRange(currentSelectedRange.startValue, scale);
                currentSelectedRange.endValue = rangeSelectorUtils.truncateSelectedRange(currentSelectedRange.endValue, scale);
                that._controller.applySelectedRange(currentSelectedRange);
                that._controller.applyPosition();
                that._processSelectionChanged(false, selectedRange && selectedRange.blockSelectedRangeChanged)
            },
            appendTrackers: function(group) {
                this._controller.appendTrackers(group)
            },
            _applyOptions: function(options) {
                var that = this;
                that._controller.applyOptions({
                    isCompactMode: options.isCompactMode,
                    translator: options.translator,
                    canvas: options.canvas,
                    sliderMarker: options.sliderMarker,
                    sliderHandle: options.sliderHandle,
                    shutter: options.shutter,
                    scale: options.scale,
                    behavior: options.behavior
                });
                that._eventsManager.applyOptions({behavior: options.behavior})
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
                that._update(group)
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
            _update: function(group) {
                var that = this,
                    isEmpty = that._options.scale.isEmpty,
                    controller = that._controller;
                that._eventsManager.setEnabled(!isEmpty);
                !isEmpty && that._updateSelectedView(group);
                controller.applySelectedRange(isEmpty ? {} : that._options.selectedRange);
                controller.applyPosition(that.isDrawn());
                that._updateLastSelectedRange();
                controller.redraw()
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
            createSlider = rangeSelector.rangeSelectorFactory.createSlider,
            utils = DX.utils,
            rangeSelectorUtils = rangeSelector.utils,
            _SliderController,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            DISCRETE = 'discrete';
        _SliderController = rangeSelector.SlidersController = function(renderer) {
            var sliders = [createSlider(renderer, START_VALUE_INDEX), createSlider(renderer, END_VALUE_INDEX)];
            sliders[START_VALUE_INDEX].setAnotherSlider(sliders[END_VALUE_INDEX]);
            sliders[END_VALUE_INDEX].setAnotherSlider(sliders[START_VALUE_INDEX]);
            this._sliders = sliders
        };
        _SliderController.prototype = {
            constructor: _SliderController,
            setAreaTrackers: function(areaTracker, selectedAreaTracker) {
                this._areaTracker = areaTracker;
                this._selectedAreaTracker = selectedAreaTracker
            },
            applyOptions: function(options) {
                var that = this,
                    values = null,
                    startSlider = that.getSlider(START_VALUE_INDEX),
                    endSlider = that.getSlider(END_VALUE_INDEX),
                    scaleOptions = options.scale;
                that._options = options;
                startSlider.applyOptions(options);
                endSlider.applyOptions(options);
                if (options.behavior.snapToTicks && scaleOptions.type !== DISCRETE) {
                    values = scaleOptions.ticksInfo.fullTicks;
                    if (values.length > 1 && values[0] > values[values.length - 1])
                        values = values.reverse()
                }
                startSlider.setAvailableValues(values);
                endSlider.setAvailableValues(values)
            },
            processDocking: function(sliderIndex) {
                var that = this;
                if (sliderIndex !== undefined)
                    that.getSlider(sliderIndex).processDocking();
                else {
                    that.getSlider(START_VALUE_INDEX).processDocking();
                    that.getSlider(END_VALUE_INDEX).processDocking()
                }
                that.setTrackersCursorStyle('default');
                that.applyAreaTrackersPosition();
                that._applySelectedRangePosition()
            },
            _applySelectedRangePosition: function(disableAnimation) {
                var that = this,
                    options = that._options,
                    canvas = options.canvas,
                    center = canvas.top + canvas.height / 2,
                    isAnimation = options.behavior.animationEnabled && !disableAnimation,
                    startSliderPos = that.getSlider(START_VALUE_INDEX).getPosition(),
                    interval = that.getSelectedRangeInterval(),
                    points = [startSliderPos, center, startSliderPos + interval, center],
                    selectedView = that._selectedView;
                if (!selectedView || !options.isCompactMode)
                    return;
                if (isAnimation)
                    selectedView.animate({points: points}, rangeSelectorUtils.animationSettings);
                else
                    selectedView.stopAnimation().attr({points: points})
            },
            setSelectedView: function(selectedView) {
                this._selectedView = selectedView
            },
            getSelectedRangeInterval: function() {
                var that = this;
                return that.getSlider(END_VALUE_INDEX).getPosition() - that.getSlider(START_VALUE_INDEX).getPosition()
            },
            moveSliders: function(postitionDelta, selectedRangeInterval) {
                var startSlider = this.getSlider(START_VALUE_INDEX);
                startSlider.setPosition(startSlider.getPosition() + postitionDelta, false, selectedRangeInterval);
                this.applyPosition(true)
            },
            moveSlider: function(sliderIndex, fastSwap, position, offsetPosition, startOffsetPosition, startOffsetPositionChangedCallback) {
                var that = this,
                    slider = that.getSlider(sliderIndex),
                    anotherSlider = slider.getAnotherSlider(),
                    anotherSliderPosition = anotherSlider.getPosition(),
                    doSwap;
                if (slider.canSwap())
                    if (sliderIndex === START_VALUE_INDEX ? position > anotherSliderPosition : position < anotherSliderPosition) {
                        doSwap = fastSwap;
                        if (!fastSwap)
                            if (Math.abs(offsetPosition) >= Math.abs(startOffsetPosition)) {
                                doSwap = true;
                                if (offsetPosition * startOffsetPosition < 0) {
                                    position += 2 * startOffsetPosition;
                                    startOffsetPositionChangedCallback(-startOffsetPosition)
                                }
                                else {
                                    position -= 2 * startOffsetPosition;
                                    startOffsetPositionChangedCallback(startOffsetPosition)
                                }
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
                that.setTrackersCursorStyle('w-resize')
            },
            applySelectedAreaCenterPosition: function(pos) {
                var that = this,
                    startSlider = that.getSlider(START_VALUE_INDEX),
                    slidersContainerHalfWidth = (that.getSlider(END_VALUE_INDEX).getPosition() - startSlider.getPosition()) / 2,
                    selectedRangeInterval = that.getSelectedRangeInterval();
                startSlider.setPosition(pos - slidersContainerHalfWidth, false, selectedRangeInterval);
                that.applyPosition();
                that.processDocking()
            },
            endSelection: function() {
                var startSlider = this.getSlider(START_VALUE_INDEX),
                    endSlider = this.getSlider(END_VALUE_INDEX),
                    cloudSpacing = startSlider.getCloudBorder() - endSlider.getCloudBorder(),
                    overlappedState;
                if (cloudSpacing > 0)
                    overlappedState = true;
                else
                    overlappedState = false;
                startSlider.setOverlapped(overlappedState);
                endSlider.setOverlapped(overlappedState)
            },
            processManualSelection: function(startPosition, endPosition, eventArgs) {
                var that = this,
                    animateSliderIndex,
                    movingSliderIndex,
                    positionRange = [Math.min(startPosition, endPosition), Math.max(startPosition, endPosition)],
                    movingSlider,
                    animatedSlider;
                animateSliderIndex = startPosition < endPosition ? START_VALUE_INDEX : END_VALUE_INDEX;
                movingSliderIndex = startPosition < endPosition ? END_VALUE_INDEX : START_VALUE_INDEX;
                movingSlider = that.getSlider(movingSliderIndex);
                animatedSlider = that.getSlider(animateSliderIndex);
                movingSlider.setPosition(positionRange[movingSliderIndex]);
                animatedSlider.setPosition(positionRange[animateSliderIndex]);
                movingSlider.setPosition(positionRange[movingSliderIndex], true);
                movingSlider.startEventHandler(eventArgs);
                animatedSlider.processDocking();
                movingSlider.applyPosition(true)
            },
            applySelectedRange: function(selectedRange) {
                utils.debug.assertParam(selectedRange, 'selectedRange not passed');
                var that = this,
                    scaleoptions = that._options.scale,
                    inverted = scaleoptions.inverted,
                    startSlider = that.getSlider(START_VALUE_INDEX),
                    endSlider = that.getSlider(END_VALUE_INDEX),
                    startValue = selectedRange.startValue,
                    endValue = selectedRange.endValue,
                    categoriesInfo,
                    setValues = function(startValue, endValue, isInverted) {
                        (isInverted ? endSlider : startSlider).setValue(startValue);
                        (isInverted ? startSlider : endSlider).setValue(endValue)
                    };
                if (scaleoptions.type !== DISCRETE)
                    if (!inverted && startValue > endValue || inverted && startValue < endValue)
                        setValues(startValue, endValue, true);
                    else
                        setValues(startValue, endValue);
                else {
                    categoriesInfo = utils.getCategoriesInfo(scaleoptions._categoriesInfo.categories, startValue, endValue);
                    setValues(categoriesInfo.start, categoriesInfo.end, categoriesInfo.inverted ^ scaleoptions.inverted)
                }
            },
            getSelectedRange: function() {
                return {
                        startValue: this.getSlider(START_VALUE_INDEX).getValue(),
                        endValue: this.getSlider(END_VALUE_INDEX).getValue()
                    }
            },
            swapSliders: function() {
                var that = this;
                that._sliders.reverse();
                that.getSlider(START_VALUE_INDEX).changeLocation();
                that.getSlider(END_VALUE_INDEX).changeLocation()
            },
            applyAreaTrackersPosition: function() {
                var that = this,
                    selectedRange = that.getSelectedRange(),
                    canvas = that._options.canvas,
                    scaleOptions = that._options.scale,
                    startSlider = that.getSlider(START_VALUE_INDEX),
                    width = that.getSlider(END_VALUE_INDEX).getPosition() - startSlider.getPosition(),
                    options = {
                        x: startSlider.getPosition(),
                        width: width < 0 ? 0 : width,
                        y: canvas.top,
                        height: canvas.height
                    },
                    style = {cursor: scaleOptions.endValue - scaleOptions.startValue === selectedRange.endValue - selectedRange.startValue ? 'default' : 'pointer'};
                that._selectedAreaTracker.attr(options).css(style);
                that._areaTracker.attr({
                    x: canvas.left,
                    width: canvas.width,
                    y: canvas.top,
                    height: canvas.height
                })
            },
            applyPosition: function(disableAnimation) {
                var that = this;
                that.getSlider(START_VALUE_INDEX).applyPosition(disableAnimation);
                that.getSlider(END_VALUE_INDEX).applyPosition(disableAnimation);
                that.applyAreaTrackersPosition();
                that._applySelectedRangePosition(disableAnimation)
            },
            redraw: function(group) {
                var that = this;
                that.getSlider(START_VALUE_INDEX).redraw(group);
                that.getSlider(END_VALUE_INDEX).redraw(group);
                that._foregroundSliderIndex = END_VALUE_INDEX
            },
            toForeground: function(slider) {
                var that = this,
                    sliderIndex = slider.getIndex();
                if (that._foregroundSliderIndex !== sliderIndex) {
                    slider.toForeground();
                    that._foregroundSliderIndex = sliderIndex
                }
            },
            appendTrackers: function(group) {
                var that = this;
                if (that._areaTracker && that._selectedAreaTracker) {
                    that._areaTracker.append(group);
                    that._selectedAreaTracker.append(group)
                }
                that.getSlider(START_VALUE_INDEX).appendTrackers(group);
                that.getSlider(END_VALUE_INDEX).appendTrackers(group)
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
                var that = this;
                that._selectedAreaTracker.css({cursor: style});
                that._areaTracker.css({cursor: style})
            },
            createShutters: function() {
                var sliders = this._sliders;
                sliders[0].createShutter();
                sliders[1].createShutter()
            },
            removeShutters: function() {
                var sliders = this._sliders;
                sliders[0].removeShutter();
                sliders[1].removeShutter()
            },
            dispose: function() {
                var sliders = this._sliders;
                sliders[0].dispose();
                sliders[1].dispose()
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file slidersEventsManager.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            MIN_MANUAL_SELECTING_WIDTH = 10,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            addNamespace = DX.ui.events.addNamespace,
            _SlidersEventManager,
            rangeSelectorUtils = rangeSelector.utils,
            getEventPageX = rangeSelectorUtils.getEventPageX,
            rangeSelectorCount = 0;
        rangeSelector.events = {
            start: "dxpointerdown",
            move: "dxpointermove",
            end: "dxpointerup"
        };
        var isLeftButtonPressed = function(event) {
                var e = event || window.event,
                    originalEvent = e.originalEvent,
                    touches = e.touches,
                    pointerType = originalEvent ? originalEvent.pointerType : false,
                    eventTouches = originalEvent ? originalEvent.touches : false,
                    isIE8LeftClick = e.which === undefined && e.button === 1,
                    isMSPointerLeftClick = originalEvent && pointerType !== undefined && (pointerType === (originalEvent.MSPOINTER_TYPE_TOUCH || 'touch') || pointerType === (originalEvent.MSPOINTER_TYPE_MOUSE || 'mouse') && originalEvent.buttons === 1),
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
                return e && e.type && e.type.indexOf('touch') === 0
            };
        _SlidersEventManager = rangeSelector.SlidersEventsManager = function(renderer, slidersController, processSelectionChanged) {
            var that = this,
                uniqueNS = that._uniqueNS = 'dx-range-selector_' + rangeSelectorCount++,
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
                $(document).off('.' + this._uniqueNS)
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
            utils = DX.utils,
            rangeSelectorUtils = rangeSelector.utils,
            dxSupport = DX.support,
            touchSupport = dxSupport.touchEvents,
            msPointerEnabled = dxSupport.pointer,
            SPLITTER_WIDTH = 8,
            TOUCH_SPLITTER_WIDTH = 20,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            DISCRETE = 'discrete',
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods;
        function checkItemsSpacing(firstSliderPosition, secondSliderPosition, distance) {
            return Math.abs(secondSliderPosition - firstSliderPosition) < distance
        }
        function Slider(renderer, index) {
            baseVisualElementMethods.init.apply(this, arguments);
            this._index = index
        }
        Slider.prototype = $.extend({}, baseVisualElementMethods, {
            getText: function() {
                if (this._marker)
                    return this._marker.getText()
            },
            getAvailableValues: function() {
                return this._values
            },
            getShutter: function() {
                return this._shutter
            },
            getMarker: function() {
                return this._marker
            },
            constructor: Slider,
            _createSlider: function(group) {
                var that = this,
                    sliderHandle,
                    sliderGroup,
                    sliderHandleOptions = that._options.sliderHandle,
                    canvas = that._options.canvas,
                    renderer = that._renderer;
                sliderGroup = renderer.g().attr({
                    'class': 'slider',
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
                        'class': 'sliderTracker',
                        translateX: 0,
                        translateY: canvas.top
                    }).append(group);
                sliderTracker = renderer.rect(-sliderWidth / 2, 0, sliderWidth, canvas.height).attr(rangeSelectorUtils.trackerSettings).css({cursor: 'w-resize'}).append(sliderTrackerGroup);
                sliderTrackerGroup.updateHeight = function() {
                    sliderTracker.attr({height: that._options.canvas.height})
                };
                sliderTrackerGroup.__rect = sliderTracker;
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
                return this._options.scale.type === DISCRETE ? this.getIndex() === START_VALUE_INDEX ? -1 : 1 : 0
            },
            _setPositionForBothSliders: function(startPosition, interval) {
                var that = this,
                    anotherSlider = that.getAnotherSlider(),
                    startValue,
                    endValue,
                    endPosition,
                    options = that._options,
                    scale = options.scale,
                    canvas = options.canvas,
                    rightBorderCoords = canvas.left + canvas.width,
                    translator = options.translator,
                    valueDirection = that._getValueDirection(),
                    valueDirectionAnotherSlider = anotherSlider._getValueDirection(),
                    getNextValue = function(value, isNegative, reverseValueDirection) {
                        var curValueDirection = !reverseValueDirection ? valueDirection : valueDirectionAnotherSlider,
                            curAnotherValueDirection = reverseValueDirection ? valueDirection : valueDirectionAnotherSlider;
                        return translator.untranslate(that._correctBounds(utils.addInterval(translator.translate(value, curValueDirection), interval, isNegative)), curAnotherValueDirection)
                    };
                startPosition = that._correctBounds(startPosition);
                startValue = translator.untranslate(startPosition, valueDirection);
                endValue = getNextValue(startValue);
                endPosition = startPosition + interval;
                if (endPosition > rightBorderCoords) {
                    endValue = scale.endValue;
                    endPosition = rightBorderCoords;
                    startValue = getNextValue(endValue, true, true);
                    startPosition = that._correctBounds(endPosition - interval)
                }
                else
                    endPosition = that._correctBounds(endPosition);
                if (that._values)
                    if (!scale.inverted ? startValue < that._values[0] : startValue > that._values[that._values.length - 1]) {
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
                var that = this,
                    correctedPosition = position,
                    anotherSliderPosition = that.getAnotherSlider().getPosition(),
                    slidersInverted = that.getIndex() === START_VALUE_INDEX ? position > anotherSliderPosition : position < anotherSliderPosition;
                if (slidersInverted)
                    correctedPosition = anotherSliderPosition;
                return correctedPosition
            },
            _correctBounds: function(position) {
                var that = this,
                    correctedPosition = position,
                    canvas = that._options.canvas;
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
                if (that._options.scale.type !== DISCRETE)
                    result = that.correctByMinRange(result);
                return result
            },
            _correctByAvailableValues: function(businessValue, skipCorrection) {
                var values = this._values;
                if (!skipCorrection && values)
                    return rangeSelectorUtils.findNearValue(values, businessValue);
                return businessValue
            },
            _correctByMinMaxRange: function(businessValue) {
                var that = this,
                    result = businessValue,
                    options = that._options,
                    scale = options.scale,
                    values = that._values,
                    sliderIndex = that.getIndex(),
                    anotherSlider = that.getAnotherSlider(),
                    anotherBusinessValue = anotherSlider.getValue(),
                    isValid = true,
                    minValue,
                    maxValue,
                    maxRange = scale.maxRange,
                    minRange = scale.minRange,
                    isNegative;
                if (scale.type === DISCRETE) {
                    if (checkItemsSpacing(that.getPosition(), anotherSlider.getPosition(), options.translator.getInterval())) {
                        isValid = false;
                        result = anotherBusinessValue
                    }
                }
                else {
                    isNegative = !scale.inverted && sliderIndex === START_VALUE_INDEX || scale.inverted && sliderIndex === END_VALUE_INDEX;
                    if (maxRange)
                        minValue = that._addInterval(anotherBusinessValue, isNegative ? maxRange : minRange, isNegative);
                    if (minRange)
                        maxValue = that._addInterval(anotherBusinessValue, isNegative ? minRange : maxRange, isNegative);
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
            _addInterval: function(value, interval, isNegative) {
                var result,
                    type = this._options.scale.type,
                    base = type === "logarithmic" && this._options.scale.logarithmBase,
                    power;
                if (base) {
                    power = utils.addInterval(utils.getLog(value, base), interval, isNegative);
                    result = Math.pow(base, power)
                }
                else
                    result = utils.addInterval(value, interval, isNegative);
                return result
            },
            correctByMinRange: function(businessValue) {
                var that = this,
                    startValue,
                    endValue,
                    scale = that._options.scale,
                    result = businessValue;
                if (scale.minRange)
                    if (that.getIndex() === END_VALUE_INDEX) {
                        startValue = that._addInterval(scale.startValue, scale.minRange, scale.inverted);
                        if (!scale.inverted && result < startValue || scale.inverted && result > startValue)
                            result = startValue
                    }
                    else if (that.getIndex() === START_VALUE_INDEX) {
                        endValue = that._addInterval(scale.endValue, scale.minRange, !scale.inverted);
                        if (!scale.inverted && result > endValue || scale.inverted && result < endValue)
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
                    sliderIndex = that.getIndex(),
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
                that._container = sliderAreaGroup = renderer.g().attr({'class': 'sliderArea'}).append(group);
                slider = that._createSlider(sliderAreaGroup);
                if (options.sliderMarker.visible) {
                    marker = rangeSelector.rangeSelectorFactory.createSliderMarker({
                        renderer: renderer,
                        isLeftPointer: that.getIndex() === END_VALUE_INDEX,
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
                that._index = that._index === START_VALUE_INDEX ? END_VALUE_INDEX : START_VALUE_INDEX;
                if (that._options.scale.type === DISCRETE)
                    that.setPosition(that._position);
                that._lastPosition = null
            },
            setPosition: function(position, correctByMinMaxRange, selectedRangeInterval) {
                var that = this,
                    slider;
                if (selectedRangeInterval !== undefined) {
                    slider = that.getIndex() === START_VALUE_INDEX ? that : that.getAnotherSlider();
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
                    position = that.getIndex() === START_VALUE_INDEX ? canvas.left : canvas.left + canvas.width;
                    text = rangeSelector.consts.emptySliderMarkerText
                }
                else {
                    that._value = that._correctValue(value, correctByMinMaxRange, utils.isDefined(skipCorrection) ? !!skipCorrection : true);
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
                    scale = that._options.scale,
                    startValue,
                    endValue,
                    anotherSliderValue;
                if (that._options.behavior.allowSlidersSwap) {
                    if (scale.minRange) {
                        anotherSliderValue = that.getAnotherSlider().getValue();
                        if (that.getIndex() === START_VALUE_INDEX) {
                            endValue = that._addInterval(scale.endValue, scale.minRange, !scale.inverted);
                            if (!scale.inverted && anotherSliderValue > endValue || scale.inverted && anotherSliderValue < endValue)
                                return false
                        }
                        else {
                            startValue = that._addInterval(scale.startValue, scale.minRange, scale.inverted);
                            if (!scale.inverted && anotherSliderValue < startValue || scale.inverted && anotherSliderValue > startValue)
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
                    index = that.getIndex(),
                    canvas = that._options.canvas,
                    renderer = that._renderer,
                    shutter = that._shutter;
                if (!shutter) {
                    if (index === START_VALUE_INDEX)
                        shutter = renderer.rect(canvas.left, canvas.top, 0, canvas.height);
                    else if (index === END_VALUE_INDEX)
                        shutter = renderer.rect(canvas.left, canvas.top, canvas.width, canvas.height);
                    that._shutter = shutter
                }
                shutter.append(that._container)
            },
            removeShutter: function() {
                var shutter = this._shutter;
                shutter && shutter.remove()
            },
            getCloudBorder: function() {
                return this._marker ? this._marker.getBorderPosition() : 0
            },
            dispose: function() {
                var marker = this._marker;
                marker && marker.dispose()
            }
        });
        rangeSelector.Slider = Slider
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file sliderMarker.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            core = viz.core,
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
            that._options.textFontStyles = core.utils.patchFontOptions(that._options.font);
            that._isValid = true;
            that._isOverlapped = false
        };
        SliderMarker.prototype = {
            constructor: SliderMarker,
            draw: function(group) {
                var that = this,
                    options = that._options,
                    sliderMarkerGroup = that._sliderMarkerGroup = that._renderer.g().attr({'class': 'sliderMarker'}).append(group);
                that._area = that._renderer.path([], "area").attr({fill: options.color}).append(sliderMarkerGroup);
                that._label = that._renderer.text(that._text, 0, 0).attr({align: 'left'}).css(options.textFontStyles).append(sliderMarkerGroup);
                that._tracker = that._renderer.rect(0, 0, 2 * options.paddingLeftRight, 2 * options.paddingTopBottom + POINTER_SIZE).attr(rangeSelector.utils.trackerSettings).css({cursor: 'pointer'}).append(sliderMarkerGroup);
                that._border = that._renderer.rect(0, 0, 1, 0).attr({fill: options.borderColor});
                that._drawn = true;
                that._update()
            },
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
            setText: function(value) {
                var that = this;
                if (that._text !== value)
                    that._text = value
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
                var that = this,
                    fontSyles,
                    opt = that._options = $.extend(true, {}, options);
                fontSyles = opt.textFontStyles = core.utils.patchFontOptions(opt.font);
                that._textHeight = null;
                that._area.attr({fill: options.color});
                that._border.attr({fill: options.borderColor});
                that._label.css(fontSyles);
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
                var border = this._border,
                    currentOverlappedState = this._isOverlapped;
                if (currentOverlappedState === isOverlapped)
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
                    isCompactMode = options.isCompactMode,
                    canvas = options.canvas,
                    isEmpty = options.isEmpty,
                    renderer = that._renderer,
                    seriesDataSource = options.seriesDataSource,
                    showChart = seriesDataSource && seriesDataSource.isShowChart() && !isEmpty,
                    background = options.background,
                    backgroundColor = showChart ? seriesDataSource.getBackgroundColor() : background.color,
                    backgroundImage = background.image,
                    backgroundIsVisible = background.visible;
                if (isCompactMode)
                    return;
                if (backgroundIsVisible && !isEmpty && backgroundColor)
                    renderer.rect(canvas.left, canvas.top, canvas.width + 1, canvas.height).attr({
                        fill: backgroundColor,
                        'class': 'dx-range-selector-background'
                    }).append(group);
                if (backgroundIsVisible && backgroundImage && backgroundImage.url)
                    renderer.image(canvas.left, canvas.top, canvas.width + 1, canvas.height, backgroundImage.url, backgroundImage.location).append(group);
                if (showChart) {
                    series = seriesDataSource.getSeries();
                    seriesDataSource.adjustSeriesDimensions(options.translators, options.chart.useAggregation);
                    for (i = 0; i < series.length; i++) {
                        series[i]._extGroups.seriesGroup = group;
                        series[i]._extGroups.labelsGroup = group;
                        series[i].draw(options.translators, options.behavior && options.behavior.animationEnabled && renderer.animationEnabled())
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
            core = DX.viz.core,
            coreFactory = core.CoreFactory,
            utils = DX.utils,
            _SeriesDatasource;
        var createThemeManager = function(chartOptions) {
                return charts.factory.createThemeManager(chartOptions, 'rangeSelector.chart')
            };
        var isArrayOfSimpleTypes = function(data) {
                return $.isArray(data) && data.length > 0 && (utils.isNumber(data[0]) || utils.isDate(data[0]))
            };
        var convertToArrayOfObjects = function(data) {
                return $.map(data, function(item, i) {
                        return {
                                arg: item,
                                val: i
                            }
                    })
            };
        var processSeriesFamilies = function(series, equalBarWidth, minBubbleSize, maxBubbleSize) {
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
                            maxBubbleSize: maxBubbleSize
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
                type = type.toLowerCase();
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
                templatedSeries = utils.processSeriesTemplate(seriesTemplate, options.dataSource);
            that._series = that._calculateSeries(options, templatedSeries);
            that._seriesFamilies = processSeriesFamilies(that._series, themeManager.getOptions('equalBarWidth'), themeManager.getOptions('minBubbleSize'), themeManager.getOptions('maxBubbleSize'))
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
                that._dataValidator = core.CoreFactory.createDataValidator(data, groupSeries, options.incidentOccured, chartThemeManager.getOptions("dataPrepareSettings"));
                parsedData = that._dataValidator.validate();
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
                    valRange = new core.Range({
                        isValueRange: true,
                        min: valueAxisMin,
                        minVisible: valueAxisMin,
                        max: valueAxisMax,
                        maxVisible: valueAxisMax,
                        axisType: that._valueAxis.type,
                        base: that._valueAxis.logarithmBase
                    }),
                    argRange = new core.Range({}),
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
                    if (utils.isDate(valRange.min))
                        valRange.min = new Date(valRange.min.valueOf() - rangeYSize * minIndent);
                    else
                        valRange.min -= rangeYSize * minIndent;
                    if (utils.isDate(valRange.max))
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
        DX.viz.rangeSelector.ThemeManager = DX.viz.core.BaseThemeManager.inherit({
            _themeSection: 'rangeSelector',
            _fontFields: ['scale.label.font', 'sliderMarker.font', 'loadingIndicator.font']
        })
    })(jQuery, DevExpress);
    DevExpress.MOD_VIZ_RANGESELECTOR = true
}