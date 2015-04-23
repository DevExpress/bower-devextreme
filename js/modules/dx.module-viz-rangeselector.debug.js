/*! 
* DevExtreme (Range Selector)
* Version: 14.2.7
* Build date: Apr 17, 2015
*
* Copyright (c) 2011 - 2014 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!DevExpress.MOD_VIZ_RANGESELECTOR) {
    if (!DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-rangeselector, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz.rangeSelector = {utils: {}}
    })(DevExpress);
    /*! Module viz-rangeselector, file utils.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            utils = rangeSelector.utils,
            dxUtils = DX.utils,
            INVISIBLE_POS = -1000;
        var findLessOrEqualValueIndex = function(values, value) {
                if (!values || values.length === 0)
                    return -1;
                var minIndex = 0,
                    maxIndex = values.length - 1,
                    index = 0;
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
        var getRootOffsetLeft = function(renderer) {
                return dxUtils.getRootOffset(renderer).left || 0
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
        var getTextBBox = function(renderer, text, fontOptions) {
                var textElement = renderer.text(text, INVISIBLE_POS, INVISIBLE_POS).css(fontOptions).append(renderer.root);
                var textBBox = textElement.getBBox();
                textElement.remove();
                return textBBox
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
        utils.findLessOrEqualValue = findLessOrEqualValue;
        utils.findNearValue = findNearValue;
        utils.findGreaterOrEqualValue = findGreaterOrEqualValue;
        utils.getRootOffsetLeft = getRootOffsetLeft;
        utils.getEventPageX = getEventPageX;
        utils.getTextBBox = getTextBBox;
        utils.truncateSelectedRange = truncateSelectedRange
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file baseVisualElementMethods.js */
    (function(DX) {
        DevExpress.viz.rangeSelector.baseVisualElementMethods = {
            init: function(renderer) {
                this._renderer = renderer;
                this._isDrawn = false
            },
            applyOptions: function(options) {
                this._options = options || {};
                this._applyOptions(this._options)
            },
            _applyOptions: function(options){},
            redraw: function(group) {
                var that = this;
                if (!that._isDrawn) {
                    that._isDrawn = !(that._draw(group || that._group) === false);
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
            _draw: function(group){},
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
            dataUtils = DX.data.utils,
            rangeSelectorUtils = rangeSelector.utils,
            core = DX.viz.core,
            ParseUtils = core.ParseUtils,
            formatHelper = DX.formatHelper,
            SCALE_TEXT_SPACING = 5,
            _isDefined = utils.isDefined,
            _isNumber = utils.isNumber,
            _isDate = utils.isDate,
            _max = Math.max,
            _ceil = Math.ceil,
            _extend = $.extend,
            START_VALUE = 'startValue',
            END_VALUE = 'endValue',
            DATETIME = 'datetime',
            SELECTED_RANGE = 'selectedRange',
            DISCRETE = 'discrete',
            STRING = 'string',
            defaultRangeSelectorOptions = {
                size: undefined,
                margin: {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0
                },
                scale: {
                    showCustomBoundaryTicks: true,
                    showMinorTicks: true,
                    startValue: undefined,
                    endValue: undefined,
                    minorTickCount: undefined,
                    minorTickInterval: undefined,
                    majorTickInterval: undefined,
                    useTicksAutoArrangement: true,
                    setTicksAtUnitBeginning: true,
                    minRange: undefined,
                    maxRange: undefined,
                    placeholderHeight: undefined,
                    valueType: undefined,
                    label: {
                        visible: true,
                        format: undefined,
                        precision: undefined,
                        customizeText: undefined
                    },
                    marker: {
                        visible: true,
                        label: {
                            format: undefined,
                            precision: undefined,
                            customizeText: undefined
                        }
                    },
                    logarithmBase: 10
                },
                selectedRange: undefined,
                sliderMarker: {
                    visible: true,
                    format: undefined,
                    precision: undefined,
                    customizeText: undefined,
                    placeholderSize: undefined
                },
                behavior: {
                    snapToTicks: true,
                    animationEnabled: true,
                    moveSelectedRangeByClick: true,
                    manualRangeSelectionEnabled: true,
                    allowSlidersSwap: true,
                    callSelectedRangeChanged: "onMovingComplete"
                },
                background: {
                    color: "#C0BAE1",
                    visible: true,
                    image: {
                        url: undefined,
                        location: 'full'
                    }
                },
                dataSource: undefined,
                dataSourceField: 'arg',
                redrawOnResize: true,
                theme: undefined,
                selectedRangeChanged: null
            };
        rangeSelector.consts = {emptySliderMarkerText: '. . .'};
        function cloneSelectedRange(arg) {
            return {
                    startValue: arg.startValue,
                    endValue: arg.endValue
                }
        }
        rangeSelector.formatValue = function(value, formatOptions) {
            var formatObject = {
                    value: value,
                    valueText: formatHelper.format(value, formatOptions.format, formatOptions.precision)
                };
            return String(utils.isFunction(formatOptions.customizeText) ? formatOptions.customizeText.call(formatObject, formatObject) : formatObject.valueText)
        };
        var createRangeContainer = function(rangeContainerOptions) {
                return rangeSelector.rangeSelectorFactory.createRangeContainer(rangeContainerOptions)
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
        var calculateMarkerSize = function(renderer, value, sliderMarkerOptions) {
                var formattedText = value === undefined ? rangeSelector.consts.emptySliderMarkerText : rangeSelector.formatValue(value, sliderMarkerOptions),
                    textBBox = rangeSelectorUtils.getTextBBox(renderer, formattedText, sliderMarkerOptions.font);
                return {
                        width: _ceil(textBBox.width) + 2 * sliderMarkerOptions.padding,
                        height: _ceil(textBBox.height) + 2 * sliderMarkerOptions.padding + sliderMarkerOptions.pointerSize
                    }
            };
        var calculateScaleLabelHalfWidth = function(renderer, value, scaleOptions) {
                var formattedText = rangeSelector.formatValue(value, scaleOptions.label),
                    textBBox = rangeSelectorUtils.getTextBBox(renderer, formattedText, scaleOptions.label.font);
                return _ceil(textBBox.width / 2)
            };
        var calculateRangeContainerCanvas = function(size, margin, sliderMarkerSpacing) {
                var canvas = {
                        left: margin.left + sliderMarkerSpacing.left,
                        top: margin.top + sliderMarkerSpacing.top,
                        width: size.width - margin.left - margin.right - sliderMarkerSpacing.left - sliderMarkerSpacing.right,
                        height: size.height - margin.top - margin.bottom - sliderMarkerSpacing.top - sliderMarkerSpacing.bottom
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
                return {
                        widthLeft: placeholderWidthLeft,
                        widthRight: placeholderWidthRight,
                        height: placeholderHeight
                    }
            };
        var calculateSliderMarkersSpacing = function(renderer, size, scale, sliderMarkerOptions) {
                var leftMarkerSize,
                    leftScaleLabelWidth = 0,
                    rightScaleLabelWidth = 0,
                    rightMarkerSize,
                    placeholderWidthLeft = 0,
                    placeholderWidthRight = 0,
                    placeholderHeight = 0,
                    parsedPlaceholderSize,
                    markerMaxWidth;
                parsedPlaceholderSize = parseSliderMarkersPlaceholderSize(sliderMarkerOptions.placeholderSize);
                placeholderWidthLeft = parsedPlaceholderSize.widthLeft || 0;
                placeholderWidthRight = parsedPlaceholderSize.widthRight || 0;
                placeholderHeight = parsedPlaceholderSize.height || 0;
                if (sliderMarkerOptions.visible) {
                    leftMarkerSize = calculateMarkerSize(renderer, scale.startValue, sliderMarkerOptions);
                    rightMarkerSize = calculateMarkerSize(renderer, scale.endValue, sliderMarkerOptions);
                    markerMaxWidth = _max(leftMarkerSize.width, rightMarkerSize.width);
                    if (!placeholderWidthLeft)
                        placeholderWidthLeft = markerMaxWidth;
                    if (!placeholderWidthRight)
                        placeholderWidthRight = markerMaxWidth;
                    if (!placeholderHeight)
                        placeholderHeight = _max(leftMarkerSize.height, rightMarkerSize.height)
                }
                if (scale.label.visible) {
                    leftScaleLabelWidth = calculateScaleLabelHalfWidth(renderer, scale.startValue, scale);
                    rightScaleLabelWidth = calculateScaleLabelHalfWidth(renderer, scale.endValue, scale)
                }
                placeholderWidthLeft = _max(placeholderWidthLeft, leftScaleLabelWidth);
                placeholderWidthRight = _max(placeholderWidthRight, rightScaleLabelWidth);
                return {
                        left: placeholderWidthLeft,
                        right: placeholderWidthRight,
                        top: placeholderHeight,
                        bottom: 0
                    }
            };
        var clearContainer = function(container) {
                if (container)
                    container.empty()
            };
        var createThemeManager = function(theme) {
                return rangeSelector.rangeSelectorFactory.createThemeManager(theme)
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
                    intervalX = utils.convertDateTickIntervalToMilliseconds(intervalX);
                translatorRange = translatorRange.arg.addRange({interval: intervalX})
            };
        var createRange = function(options) {
                return new core.Range(options)
            };
        var checkLogarithmicOptions = function(options, logarithmBase, incidentOccured) {
                if (!options)
                    return;
                if (options.type === 'logarithmic' && options.logarithmBase <= 0 || options.logarithmBase && !_isNumber(options.logarithmBase)) {
                    options.logarithmBase = logarithmBase;
                    incidentOccured('E2104')
                }
                else if (options.type !== 'logarithmic')
                    options.logarithmBase = undefined
            };
        var calculateScaleAreaHeight = function(renderer, scaleOptions, visibleMarkers) {
                var textBBox,
                    value = "0",
                    formatObject = {
                        value: 0,
                        valueText: value
                    },
                    text = utils.isFunction(scaleOptions.label.customizeText) ? scaleOptions.label.customizeText.call(formatObject, formatObject) : value,
                    visibleLabels = scaleOptions.label.visible;
                if (scaleOptions.placeholderHeight)
                    return scaleOptions.placeholderHeight;
                else {
                    textBBox = rangeSelectorUtils.getTextBBox(renderer, text, scaleOptions.label.font);
                    return (visibleLabels ? scaleOptions.label.topIndent + textBBox.height : 0) + (visibleMarkers ? scaleOptions.marker.topIndent + scaleOptions.marker.separatorHeight : 0)
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
                        startCategories: startValue,
                        endCategories: endValue
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
        DX.registerComponent("dxRangeSelector", rangeSelector, core.BaseWidget.inherit({
            _setDefaultOptions: function() {
                this.callBase();
                this.option(defaultRangeSelectorOptions)
            },
            _eventsMap: $.extend({}, core.BaseWidget.prototype._eventsMap, {
                onSelectedRangeChanged: {
                    name: 'selectedRangeChanged',
                    deprecated: 'selectedRangeChanged',
                    deprecatedContext: function() {
                        return null
                    },
                    deprecatedArgs: function(arg) {
                        return [cloneSelectedRange(arg)]
                    }
                },
                selectedRangeChanged: {newName: 'onSelectedRangeChanged'}
            }),
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {selectedRangeChanged: {
                        since: '14.2',
                        message: "Use the 'onSelectedRangeChanged' option instead"
                    }})
            },
            _dataSourceOptions: function() {
                return {
                        paginate: false,
                        _preferSync: true
                    }
            },
            _dataIsReady: function() {
                return this._isDataSourceReady()
            },
            _initCore: function() {
                var that = this;
                that.rangeContainer = createRangeContainer(that._renderer);
                that._reinitDataSource()
            },
            _getRendererParameters: function() {
                return {
                        pathModified: this.option('pathModified'),
                        rtl: this.option('rtlEnabled')
                    }
            },
            _getDefaultSize: function() {
                return {
                        width: 400,
                        height: 160
                    }
            },
            _getOption: function(name) {
                return this.option(name)
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
            _initOptions: function(options) {
                var that = this,
                    themeManager;
                that._optionsInitializing = true;
                options = options || {};
                that._userOptions = _extend(true, {}, options);
                themeManager = createThemeManager(options.theme);
                themeManager.setBackgroundColor(options.containerBackgroundColor);
                that.option(themeManager.applyRangeSelectorTheme(options));
                that._prepareChartThemeOptions(options);
                if (options.background)
                    that._userBackgroundColor = options.background.color
            },
            _refresh: function() {
                var that = this,
                    callBase = that.callBase;
                that._endLoading(function() {
                    callBase.call(that)
                })
            },
            _render: function(isResizing) {
                var that = this,
                    currentAnimationEnabled,
                    behaviorOptions;
                isResizing = isResizing || that.__isResizing;
                that._optionsInitializing = false;
                that._applyOptions();
                if (isResizing) {
                    behaviorOptions = that.option('behavior');
                    currentAnimationEnabled = behaviorOptions.animationEnabled;
                    behaviorOptions.animationEnabled = false;
                    that.rangeContainer.redraw();
                    behaviorOptions.animationEnabled = currentAnimationEnabled
                }
                else
                    that.rangeContainer.redraw();
                !isResizing && (!that._dataSource || that._dataSource && that._dataSource.isLoaded()) && that.hideLoadingIndicator();
                that._drawn();
                that.__rendered && that.__rendered()
            },
            _optionChanged: function(args) {
                var that = this,
                    name = args.name;
                if (!that._optionsInitializing)
                    dataUtils.compileSetter(name)(that._userOptions, args.value, {
                        functionsAsIs: true,
                        merge: true
                    });
                if (name === "dataSource")
                    that._reinitDataSource();
                else if (name === "selectedRange")
                    that.setSelectedRange(that.option(SELECTED_RANGE));
                else if (name === 'containerBackgroundColor' || name === 'theme') {
                    that._initOptions(that._userOptions);
                    that._invalidate()
                }
                else
                    that.callBase(args)
            },
            _applySize: $.noop,
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
                    sliderMarkerSpacing,
                    sliderMarkerOptions,
                    selectedRange,
                    $container = that.container,
                    scaleOptions;
                that._isUpdating = true;
                seriesDataSource = that._createSeriesDataSource();
                scaleOptions = that._scaleOptions = that._prepareScaleOptions(seriesDataSource);
                translatorRange = calculateTranslatorRange(seriesDataSource, scaleOptions);
                that._updateScaleOptions(seriesDataSource, translatorRange.arg, sizeOptions.width);
                updateTranslatorRangeInterval(translatorRange, scaleOptions);
                sliderMarkerOptions = that._prepareSliderMarkersOptions(sizeOptions.width);
                selectedRange = that._initSelection();
                sliderMarkerSpacing = calculateSliderMarkersSpacing(that._renderer, sizeOptions, scaleOptions, sliderMarkerOptions);
                rangeContainerCanvas = calculateRangeContainerCanvas(sizeOptions, sizeOptions, sliderMarkerSpacing);
                scaleLabelsAreaHeight = calculateScaleAreaHeight(that._renderer, scaleOptions, showScaleMarkers(scaleOptions));
                that.translators = createTranslator(translatorRange, createTranslatorCanvas(sizeOptions, rangeContainerCanvas, scaleLabelsAreaHeight));
                scaleOptions.ticksInfo = that._getTicksInfo(rangeContainerCanvas.width);
                that._testTicksInfo = scaleOptions.ticksInfo;
                that._selectedRange = selectedRange;
                if (seriesDataSource)
                    seriesDataSource.adjustSeriesDimensions(that.translators);
                that.rangeContainer.applyOptions({
                    canvas: rangeContainerCanvas,
                    scaleLabelsAreaHeight: scaleLabelsAreaHeight,
                    sliderMarkerSpacing: sliderMarkerSpacing,
                    translators: that.translators,
                    selectedRange: selectedRange,
                    scale: scaleOptions,
                    behavior: that.option('behavior'),
                    background: that.option('background'),
                    chart: that.option('chart'),
                    seriesDataSource: seriesDataSource,
                    sliderMarker: sliderMarkerOptions,
                    sliderHandle: that.option('sliderHandle'),
                    shutter: that.option('shutter'),
                    selectedRangeChanged: function(selectedRange, blockSelectedRangeChanged) {
                        that.option(SELECTED_RANGE, selectedRange);
                        if (!blockSelectedRangeChanged)
                            that._eventTrigger('selectedRangeChanged', cloneSelectedRange(selectedRange))
                    },
                    setSelectedRange: function(selectedRange) {
                        that.setSelectedRange(selectedRange)
                    }
                });
                that._isUpdating = false
            },
            _initSelection: function() {
                var that = this,
                    scaleOptions = that._scaleOptions,
                    selectedRangeOptions = that.option(SELECTED_RANGE),
                    startValue,
                    endValue,
                    parser = scaleOptions.parser || function() {
                        return null
                    },
                    parseValue = function(value, entity) {
                        var parsedValue,
                            result = scaleOptions[entity];
                        if (_isDefined(value))
                            parsedValue = parser(value);
                        if (!_isDefined(parsedValue))
                            that._incidentOccured("E2203", [entity]);
                        else
                            result = parsedValue;
                        return result
                    };
                if (!selectedRangeOptions)
                    return cloneSelectedRange(scaleOptions);
                else {
                    startValue = parseValue(selectedRangeOptions.startValue, START_VALUE);
                    startValue = rangeSelectorUtils.truncateSelectedRange(startValue, scaleOptions);
                    endValue = parseValue(selectedRangeOptions.endValue, END_VALUE);
                    endValue = rangeSelectorUtils.truncateSelectedRange(endValue, scaleOptions);
                    return {
                            startValue: startValue,
                            endValue: endValue
                        }
                }
            },
            _prepareChartThemeOptions: function(options) {
                var chartTheme,
                    chartOption = this.option('chart') || {};
                if (!chartOption.theme && options && options.theme) {
                    chartTheme = options.theme;
                    if (chartTheme) {
                        if (typeof chartTheme === 'object') {
                            chartTheme = chartTheme.chart || {};
                            chartTheme.name = options.theme.name
                        }
                        chartOption.theme = chartTheme
                    }
                }
            },
            _createSeriesDataSource: function() {
                var that = this,
                    seriesDataSource,
                    dataSource = that._dataSource && that._dataSource.items(),
                    scaleOptions = that.option('scale'),
                    chartOptions = that.option('chart') || {},
                    valueType = scaleOptions.valueType;
                if (!valueType)
                    valueType = calculateValueType(scaleOptions.startValue, scaleOptions.endValue);
                if (dataSource || chartOptions.series) {
                    seriesDataSource = new rangeSelector.SeriesDataSource({
                        renderer: that._renderer,
                        dataSource: dataSource,
                        valueType: (valueType || '').toLowerCase(),
                        axisType: scaleOptions.type,
                        chart: chartOptions,
                        dataSourceField: that.option('dataSourceField'),
                        backgroundColor: that._userBackgroundColor,
                        incidentOccured: that._incidentOccured,
                        categories: scaleOptions.categories
                    });
                    checkLogarithmicOptions(chartOptions.valueAxis, seriesDataSource.themeManager.theme().valueAxis.logarithmBase, that._incidentOccured)
                }
                return seriesDataSource
            },
            _prepareScaleOptions: function(seriesDataSource) {
                var that = this,
                    scaleOptions = $.extend(true, {}, that.option('scale')),
                    incidentOccured = that._incidentOccured,
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
                checkLogarithmicOptions(scaleOptions, defaultRangeSelectorOptions.scale.logarithmBase, that._incidentOccured);
                if (!scaleOptions.type)
                    scaleOptions.type = 'continuous';
                scaleOptions.parser = parser;
                return scaleOptions
            },
            _prepareSliderMarkersOptions: function(screenDelta) {
                var that = this,
                    scaleOptions = that._scaleOptions,
                    sliderMarkerOptions = _extend(true, {}, that.option('sliderMarker')),
                    businessInterval;
                if (!sliderMarkerOptions.format) {
                    if (!that.option('behavior').snapToTicks && _isNumber(scaleOptions.startValue)) {
                        businessInterval = Math.abs(scaleOptions.endValue - scaleOptions.startValue);
                        sliderMarkerOptions.format = 'fixedPoint';
                        sliderMarkerOptions.precision = utils.getSignificantDigitPosition(businessInterval / screenDelta)
                    }
                    if (scaleOptions.valueType === DATETIME)
                        if (!scaleOptions.marker.visible) {
                            if (_isDefined(scaleOptions.startValue) && _isDefined(scaleOptions.endValue))
                                sliderMarkerOptions.format = formatHelper.getDateFormatByTickInterval(scaleOptions.startValue, scaleOptions.endValue, scaleOptions.minorTickInterval !== 0 ? scaleOptions.minorTickInterval : scaleOptions.majorTickInterval)
                        }
                        else
                            sliderMarkerOptions.format = utils.getDateUnitInterval(_isDefined(scaleOptions.minorTickInterval) && scaleOptions.minorTickInterval !== 0 ? scaleOptions.minorTickInterval : scaleOptions.majorTickInterval)
                }
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
                        minorTickInterval: isEmpty ? 0 : that.option('scale').minorTickInterval,
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
                        textFontStyles: core.utils.patchFontOptions(scaleOptions.label.font),
                        incidentOccured: that._incidentOccured,
                        isHorizontal: true,
                        renderText: function(text, x, y, options) {
                            return that._renderer.text(text, x, y, options).append(that._renderer.root)
                        },
                        getText: startEndNotDefined(startValue, endValue) ? function(value) {
                            return value
                        } : function(value) {
                            return rangeSelector.formatValue(value, scaleOptions.label)
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
                    decimatedTicks,
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
            _getContainer: function() {
                return this.element()
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
            }
        }).include(DX.ui.DataHelperMixin))
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file rangeContainer.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods,
            RangeContainer;
        var createSlidersContainer = function(options) {
                return rangeSelector.rangeSelectorFactory.createSlidersContainer(options)
            };
        var createScale = function(options) {
                return rangeSelector.rangeSelectorFactory.createScale(options)
            };
        var createRangeView = function(options) {
                return rangeSelector.rangeSelectorFactory.createRangeView(options)
            };
        var _createClipRectCanvas = function(canvas, sliderMarkerSpacing) {
                return {
                        left: canvas.left - sliderMarkerSpacing.left,
                        top: canvas.top - sliderMarkerSpacing.top,
                        width: canvas.width + sliderMarkerSpacing.right + sliderMarkerSpacing.left,
                        height: canvas.height + sliderMarkerSpacing.bottom + sliderMarkerSpacing.top
                    }
            };
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
                    isEmpty = options.scale.isEmpty,
                    viewCanvas = {
                        left: options.canvas.left,
                        top: options.canvas.top,
                        width: options.canvas.width,
                        height: options.canvas.height >= options.scaleLabelsAreaHeight ? options.canvas.height - options.scaleLabelsAreaHeight : 0
                    };
                that._viewCanvas = viewCanvas;
                that.slidersContainer.applyOptions({
                    canvas: viewCanvas,
                    translator: options.translators.x,
                    scale: options.scale,
                    selectedRange: options.selectedRange,
                    sliderMarker: options.sliderMarker,
                    sliderHandle: options.sliderHandle,
                    shutter: options.shutter,
                    behavior: options.behavior,
                    selectedRangeChanged: options.selectedRangeChanged,
                    isEmpty: isEmpty
                });
                that.rangeView.applyOptions({
                    canvas: viewCanvas,
                    translators: options.translators,
                    background: options.background,
                    chart: options.chart,
                    seriesDataSource: options.seriesDataSource,
                    behavior: options.behavior,
                    isEmpty: isEmpty
                });
                that.scale.applyOptions({
                    canvas: options.canvas,
                    translator: options.translators.x,
                    scale: options.scale,
                    hideLabels: isEmpty,
                    scaleLabelsAreaHeight: options.scaleLabelsAreaHeight,
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
                    clipRectCanvas = _createClipRectCanvas(that._options.canvas, that._options.sliderMarkerSpacing),
                    viewCanvas = that._viewCanvas;
                that._clipRect = that._renderer.clipRect(clipRectCanvas.left, clipRectCanvas.top, clipRectCanvas.width, clipRectCanvas.height);
                containerGroup = that._renderer.g().attr({
                    'class': 'rangeContainer',
                    clipId: that._clipRect.id
                }).append(that._renderer.root);
                that._viewClipRect = that._renderer.clipRect(viewCanvas.left, viewCanvas.top, viewCanvas.width, viewCanvas.height);
                rangeViewGroup = that._renderer.g().attr({
                    'class': 'view',
                    clipId: that._viewClipRect.id
                }).append(containerGroup);
                that.rangeView.redraw(rangeViewGroup);
                slidersContainerGroup = that._renderer.g().attr({'class': 'slidersContainer'}).append(containerGroup);
                that.slidersContainer.redraw(slidersContainerGroup);
                scaleGroup = that._renderer.g().attr({'class': 'scale'}).append(containerGroup);
                that.scale.redraw(scaleGroup);
                trackersGroup = that._renderer.g().attr({'class': 'trackers'}).append(containerGroup);
                that._trackersGroup = trackersGroup;
                that.slidersContainer.appendTrackers(trackersGroup)
            },
            _update: function() {
                var that = this,
                    clipRectCanvas = _createClipRectCanvas(that._options.canvas, that._options.sliderMarkerSpacing),
                    viewCanvas = that._viewCanvas;
                that._clipRect.attr({
                    x: clipRectCanvas.left,
                    y: clipRectCanvas.top,
                    width: clipRectCanvas.width,
                    height: clipRectCanvas.height
                });
                that._viewClipRect.attr({
                    x: viewCanvas.left,
                    y: viewCanvas.top,
                    width: viewCanvas.width,
                    height: viewCanvas.height
                });
                that.rangeView.redraw();
                that.slidersContainer.redraw();
                that.slidersContainer.appendTrackers(that._trackersGroup);
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
            utils = DX.utils,
            _isDefined = utils.isDefined,
            SCALE_TEXT_SPACING = 5,
            Scale,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods;
        function calculateRangeByMarkerPosition(posX, markerDatePositions, scaleOptions) {
            var selectedRange = {},
                index,
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
        function getMarkerDate(date, tickInterval) {
            var markerDate = new Date(date.getTime()),
                month = 0;
            switch (tickInterval) {
                case'quarter':
                    month = formatHelper.getFirstQuarterMonth(date.getMonth());
                case'month':
                    markerDate.setMonth(month);
                case'week':
                case'day':
                    markerDate.setDate(1);
                case'hour':
                    markerDate.setHours(0, 0, 0, 0);
                    break;
                case'millisecond':
                    markerDate.setMilliseconds(0);
                    break;
                case'second':
                    markerDate.setSeconds(0, 0);
                    break;
                case'minute':
                    markerDate.setMinutes(0, 0, 0);
                    break
            }
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
        Scale.prototype = $.extend({}, baseVisualElementMethods, {
            constructor: Scale,
            _setupDateUnitInterval: function(scaleOptions) {
                var key,
                    hasObjectSingleField = function(object) {
                        var fieldsCounter = 0;
                        $.each(object, function() {
                            return ++fieldsCounter < 2
                        });
                        return fieldsCounter === 1
                    },
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
                                millisecTickInterval = utils.convertDateTickIntervalToMilliseconds(majorTickInterval)
                            }
                        majorTickInterval = utils.convertMillisecondsToDateUnits(millisecTickInterval)
                    }
                    this.dateUnitInterval = utils.getDateUnitInterval(majorTickInterval)
                }
            },
            _drawDateMarker: function(date, options) {
                var labelPosX,
                    labelPosY,
                    dateFormated,
                    scaleOptions,
                    textElement;
                if (options.x === null)
                    return;
                scaleOptions = this._options.scale;
                this._renderer.path([options.x, options.y, options.x, options.y + scaleOptions.marker.separatorHeight], "line").attr(this.lineOptions).append(options.group);
                dateFormated = getLabel(date, options.label);
                labelPosX = options.x + scaleOptions.tick.width + scaleOptions.marker.textLeftIndent;
                labelPosY = options.y + scaleOptions.marker.textTopIndent + this.fontOptions["font-size"];
                this.textOptions.align = 'left';
                textElement = this._renderer.text(dateFormated, labelPosX, labelPosY).attr(this.textOptions).css(this.fontOptions).css(this.textStyles).append(options.group);
                return labelPosX + textElement.getBBox().width
            },
            _drawDateMarkers: function(dates, group) {
                var dateMarker,
                    i,
                    datesDifferences,
                    markerDate,
                    posX,
                    prevMarkerRightX = -1;
                if (this._options.scale.valueType !== 'datetime' || !this.visibleMarkers)
                    return;
                var markerDatePositions = [];
                if (dates.length > 1) {
                    for (i = 1; i < dates.length; i++) {
                        datesDifferences = utils.getDatesDifferences(dates[i - 1], dates[i]);
                        prepareDatesDifferences(datesDifferences, this.dateUnitInterval);
                        if (datesDifferences.count > 0) {
                            markerDate = getMarkerDate(dates[i], this.dateUnitInterval);
                            this.markerDates = this.markerDates || [];
                            this.markerDates.push(markerDate);
                            posX = this.translator.translate(markerDate);
                            if (posX > prevMarkerRightX) {
                                posX !== null && markerDatePositions.push({
                                    date: markerDate,
                                    posX: posX
                                });
                                prevMarkerRightX = this._drawDateMarker(markerDate, {
                                    group: group,
                                    y: this._options.canvas.top + this._options.canvas.height - this.markersAreaHeight + this._options.scale.marker.topIndent,
                                    x: posX,
                                    label: this._getLabelFormatOptions(formatHelper.getDateFormatByDifferences(datesDifferences))
                                })
                            }
                        }
                    }
                    this._initializeMarkersEvents(markerDatePositions, group)
                }
            },
            _getLabelFormatOptions: function(formatString) {
                if (!_isDefined(this._options.scale.marker.label.format))
                    return $.extend({}, this._options.scale.marker.label, {format: formatString});
                return this._options.scale.marker.label
            },
            _initializeMarkersEvents: function(markerDatePositions, group) {
                var that = this,
                    markersAreaTop = this._options.canvas.top + this._options.canvas.height - this.markersAreaHeight + this._options.scale.marker.topIndent,
                    markersTracker,
                    svgOffsetLeft,
                    index,
                    posX,
                    selectedRange;
                if (markerDatePositions.length > 0) {
                    markersTracker = that._renderer.rect(that._options.canvas.left, markersAreaTop, that._options.canvas.width, that._options.scale.marker.separatorHeight).attr({
                        fill: 'grey',
                        stroke: 'grey',
                        opacity: 0.0001
                    }).append(group);
                    markersTracker.on(rangeSelector.events.start, function(e) {
                        svgOffsetLeft = rangeSelector.utils.getRootOffsetLeft(that._renderer);
                        posX = rangeSelector.utils.getEventPageX(e) - svgOffsetLeft;
                        selectedRange = calculateRangeByMarkerPosition(posX, markerDatePositions, that._options.scale);
                        that._options.setSelectedRange(selectedRange)
                    });
                    that._markersTracker = markersTracker
                }
            },
            _drawLabel: function(value, group) {
                var textY = this._options.canvas.top + this._options.canvas.height - this.markersAreaHeight,
                    textElement = this._renderer.text(getLabel(value, this._options.scale.label), this.translator.translate(value), textY).attr(this.textOptions).css(this.fontOptions).css(this.textStyles);
                textElement.append(group);
                this.textElements = this.textElements || [];
                this.textElements.push(textElement)
            },
            _drawTick: function(value, group, directionOffset) {
                var that = this,
                    secondY = that._options.canvas.top + that._options.canvas.height - that.scaleLabelsAreaHeight,
                    posX = that.translator.translate(value, directionOffset),
                    tickElement = that._renderer.path([posX, that._options.canvas.top, posX, secondY], "line").attr(that.lineOptions).append(group);
                this.tickElements = this.tickElements || [];
                this.tickElements.push(tickElement)
            },
            _redraw: function(group) {
                var that = this,
                    scaleOptions = that._options.scale,
                    ticksGroup = that._renderer.g(),
                    labelsGroup = that._renderer.g().append(group),
                    majorTicks = scaleOptions.ticksInfo.majorTicks,
                    minorTicks = scaleOptions.ticksInfo.minorTicks,
                    customBoundaryTicks = scaleOptions.ticksInfo.customBoundaryTicks,
                    hideLabels = that._options.hideLabels || scaleOptions.isEmpty || !scaleOptions.label.visible,
                    isDiscrete = scaleOptions.type === "discrete",
                    directionOffset = isDiscrete ? -1 : 0,
                    i,
                    categoriesInfo = scaleOptions._categoriesInfo;
                for (i = 0; i < majorTicks.length; i++) {
                    !hideLabels && that._drawLabel(majorTicks[i], labelsGroup);
                    that._drawTick(majorTicks[i], ticksGroup, directionOffset)
                }
                if (scaleOptions.showMinorTicks || isDiscrete)
                    for (i = 0; i < minorTicks.length; i++)
                        that._drawTick(minorTicks[i], ticksGroup, directionOffset);
                for (i = 0; i < customBoundaryTicks.length; i++)
                    that._drawTick(customBoundaryTicks[i], ticksGroup);
                if (isDiscrete)
                    categoriesInfo && _isDefined(categoriesInfo.end) && that._drawTick(categoriesInfo.end, ticksGroup, 1);
                ticksGroup.append(group);
                that._drawDateMarkers(majorTicks, labelsGroup)
            },
            _applyOptions: function(options) {
                var scaleOptions = options.scale,
                    labelsAreaHeight;
                this.textOptions = {align: 'center'};
                this.textStyles = {'-webkit-user-select': 'none'};
                this.fontOptions = viz.core.utils.patchFontOptions(scaleOptions.label.font);
                this.lineOptions = {
                    "stroke-width": scaleOptions.tick.width,
                    stroke: scaleOptions.tick.color,
                    "stroke-opacity": scaleOptions.tick.opacity,
                    sharp: "h"
                };
                this._setupDateUnitInterval(scaleOptions);
                this.visibleMarkers = scaleOptions.marker.visible === undefined ? true : scaleOptions.marker.visible;
                labelsAreaHeight = scaleOptions.label.visible ? scaleOptions.label.topIndent + this.fontOptions["font-size"] : 0;
                this.scaleLabelsAreaHeight = options.scaleLabelsAreaHeight;
                this.markersAreaHeight = this.scaleLabelsAreaHeight - labelsAreaHeight;
                this.translator = options.translator
            },
            _draw: function(group) {
                this._redraw(group)
            },
            _update: function(group) {
                if (this._markersTracker)
                    this._markersTracker.off(rangeSelector.events.start, '**');
                baseVisualElementMethods._update.apply(this, arguments)
            },
            _calculateRangeByMarkerPosition: calculateRangeByMarkerPosition,
            _prepareDatesDifferences: prepareDatesDifferences
        });
        rangeSelector.Scale = Scale
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file rangeFactory.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            renderers = DX.viz.renderers;
        rangeSelector.rangeSelectorFactory = function() {
            return {
                    createRangeContainer: function(rangeContainerOptions) {
                        return new rangeSelector.RangeContainer(rangeContainerOptions)
                    },
                    createSlidersContainer: function(options) {
                        return new rangeSelector.SlidersContainer(options)
                    },
                    createScale: function(options) {
                        return new rangeSelector.Scale(options)
                    },
                    createSliderMarker: function(options) {
                        return new rangeSelector.SliderMarker(options)
                    },
                    createRangeView: function(options) {
                        return new rangeSelector.RangeView(options)
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
            msPointerEnabled = window.navigator.msPointerEnabled || window.navigator.pointerEnabled,
            isNumber = utils.isNumber,
            isDate = utils.isDate,
            isString = utils.isString,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            rangeSelectorUtils = rangeSelector.utils,
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods,
            trackerAttributes = {
                fill: 'grey',
                stroke: 'grey',
                opacity: 0.0001
            };
        function SlidersContainer() {
            var that = this,
                sliders;
            baseVisualElementMethods.init.apply(that, arguments);
            sliders = [that._createSlider(START_VALUE_INDEX), that._createSlider(END_VALUE_INDEX)];
            that._controller = that._createSlidersController(sliders);
            that._eventsManager = that._createSlidersEventsManager(that._controller);
            that._lastSelectedRange = {}
        }
        SlidersContainer.prototype = $.extend({}, baseVisualElementMethods, {
            constructor: SlidersContainer,
            _drawAreaTracker: function(group) {
                var that = this,
                    areaTracker,
                    selectedAreaTracker,
                    canvas = that._options.canvas;
                areaTracker = that._renderer.rect(canvas.left, canvas.top, canvas.width, canvas.height).attr(trackerAttributes).append(group);
                selectedAreaTracker = that._renderer.rect(canvas.left, canvas.top, canvas.width, canvas.height).attr(trackerAttributes).css({cursor: 'pointer'}).append(group);
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
            _createSlider: function(sliderIndex) {
                return rangeSelector.rangeSelectorFactory.createSlider(this._renderer, sliderIndex)
            },
            _createSlidersController: function(sliders) {
                return rangeSelector.rangeSelectorFactory.createSlidersController(sliders)
            },
            _createSlidersEventsManager: function(controller) {
                var that = this;
                return rangeSelector.rangeSelectorFactory.createSlidersEventsManager(that._renderer, controller, function(moving) {
                        that._processSelectionChanged(moving)
                    })
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
                that._update()
            },
            _update: function() {
                var that = this,
                    isEmpty = that._options.isEmpty;
                that._eventsManager.setEnabled(!isEmpty);
                that._controller.applySelectedRange(isEmpty ? {} : that._options.selectedRange);
                that._controller.applyPosition(that.isDrawn());
                that._updateLastSelectedRange();
                that._controller.redraw()
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
            utils = DX.utils,
            rangeSelectorUtils = rangeSelector.utils,
            _SliderController,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            DISCRETE = 'discrete';
        _SliderController = rangeSelector.SlidersController = function(sliders) {
            this._sliders = sliders;
            sliders[START_VALUE_INDEX].setAnotherSlider(sliders[END_VALUE_INDEX]);
            sliders[END_VALUE_INDEX].setAnotherSlider(sliders[START_VALUE_INDEX])
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
                that.applyAreaTrackersPosition()
            },
            getSelectedRangeInterval: function() {
                var that = this;
                return that.getSlider(END_VALUE_INDEX).getPosition() - that.getSlider(START_VALUE_INDEX).getPosition()
            },
            moveSliders: function(postitionDelta, selectedRangeInterval) {
                var that = this,
                    startSlider = that.getSlider(START_VALUE_INDEX),
                    endSlider;
                startSlider.setPosition(startSlider.getPosition() + postitionDelta, false, selectedRangeInterval);
                that.applyPosition(true)
            },
            moveSlider: function(sliderIndex, fastSwap, position, offsetPosition, startOffsetPosition, startOffsetPositionChangedCallback) {
                var that = this,
                    slider = that.getSlider(sliderIndex),
                    anotherSlider = slider.getAnotherSlider(),
                    doSwap;
                if (slider.canSwap())
                    if (sliderIndex === START_VALUE_INDEX ? position > anotherSlider.getPosition() : position < anotherSlider.getPosition()) {
                        doSwap = fastSwap;
                        if (!fastSwap)
                            if (Math.abs(offsetPosition) >= Math.abs(startOffsetPosition) && offsetPosition * startOffsetPosition < 0) {
                                doSwap = true;
                                position += 2 * startOffsetPosition;
                                startOffsetPositionChangedCallback(-startOffsetPosition)
                            }
                        if (doSwap) {
                            that.swapSliders();
                            anotherSlider.applyPosition(true)
                        }
                    }
                slider.setPosition(position, true);
                slider.applyPosition(true);
                that.applyAreaTrackersPosition();
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
            processManualSelection: function(startPosition, endPosition, eventArgs) {
                var that = this,
                    animateSliderIndex,
                    movingSliderIndex,
                    positionRange = [Math.min(startPosition, endPosition), Math.max(startPosition, endPosition)];
                animateSliderIndex = startPosition < endPosition ? START_VALUE_INDEX : END_VALUE_INDEX;
                movingSliderIndex = startPosition < endPosition ? END_VALUE_INDEX : START_VALUE_INDEX;
                that.getSlider(movingSliderIndex).setPosition(positionRange[movingSliderIndex]);
                that.getSlider(animateSliderIndex).setPosition(positionRange[animateSliderIndex]);
                that.getSlider(movingSliderIndex).setPosition(positionRange[movingSliderIndex], true);
                that.getSlider(movingSliderIndex).startEventHandler(eventArgs);
                that.getSlider(animateSliderIndex).processDocking();
                that.getSlider(movingSliderIndex).applyPosition(true)
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
                var that = this;
                return {
                        startValue: that.getSlider(START_VALUE_INDEX).getValue(),
                        endValue: that.getSlider(END_VALUE_INDEX).getValue()
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
                    scaleOptions = that._options.scale,
                    startSlider = that.getSlider(START_VALUE_INDEX),
                    width = that.getSlider(END_VALUE_INDEX).getPosition() - startSlider.getPosition(),
                    options = {
                        x: startSlider.getPosition(),
                        width: width < 0 ? 0 : width,
                        y: that._options.canvas.top,
                        height: that._options.canvas.height
                    },
                    style = {cursor: scaleOptions.endValue - scaleOptions.startValue === selectedRange.endValue - selectedRange.startValue ? 'default' : 'pointer'};
                that._selectedAreaTracker.attr(options).css(style);
                that._areaTracker.attr({
                    x: that._options.canvas.left,
                    width: that._options.canvas.width,
                    y: that._options.canvas.top,
                    height: that._options.canvas.height
                })
            },
            applyPosition: function(disableAnimation) {
                var that = this;
                that.getSlider(START_VALUE_INDEX).applyPosition(disableAnimation);
                that.getSlider(END_VALUE_INDEX).applyPosition(disableAnimation);
                that.applyAreaTrackersPosition()
            },
            redraw: function(group) {
                var that = this;
                that.getSlider(START_VALUE_INDEX).redraw(group);
                that.getSlider(END_VALUE_INDEX).redraw(group)
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
            utils = DX.utils,
            MIN_MANUAL_SELECTING_WIDTH = 10,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            addNamespace = DX.ui.events.addNamespace,
            setEvents = function() {
                var win = window;
                win = DX.viz.rangeSelector.mockWindow || window;
                var touchSupport = "ontouchstart" in win,
                    msPointerEnabled = win.navigator.msPointerEnabled,
                    pointerEnabled = win.navigator.pointerEnabled;
                rangeSelector.events = {
                    start: pointerEnabled ? "pointerdown" : msPointerEnabled ? "MSPointerDown" : touchSupport ? "touchstart mousedown" : "mousedown",
                    move: pointerEnabled ? "pointermove" : msPointerEnabled ? "MSPointerMove" : touchSupport ? "touchmove mousemove" : "mousemove",
                    end: pointerEnabled ? "pointerup pointercancel" : msPointerEnabled ? "MSPointerUp MSPointerCancel" : touchSupport ? "touchend mouseup" : "mouseup"
                }
            },
            _SlidersEventManager,
            getEventPageX = rangeSelector.utils.getEventPageX,
            rangeSelectorCount = 0;
        setEvents();
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
            _getRootOffsetLeft: function() {
                return rangeSelector.utils.getRootOffsetLeft(this._renderer)
            },
            _initializeSliderEvents: function(sliderIndex) {
                var that = this,
                    isTouchEvent,
                    slidersController = that._slidersController,
                    processSelectionChanged = that._processSelectionChanged,
                    slider = slidersController.getSlider(sliderIndex),
                    anotherSlider = slider.getAnotherSlider(),
                    fastSwap,
                    startOffsetPosition,
                    splitterMoving,
                    sliderEndHandler = function(e) {
                        if (splitterMoving) {
                            splitterMoving = false;
                            slidersController.processDocking();
                            processSelectionChanged(false)
                        }
                    },
                    sliderMoveHandler = function(e) {
                        var doSwap,
                            pageX,
                            offsetPosition,
                            svgOffsetLeft = that._getRootOffsetLeft(),
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
                    },
                    eventsNames = that._eventsNames;
                slider.startEventHandler = function(e) {
                    if (!that._enabled || !isLeftButtonPressed(e) || splitterMoving)
                        return;
                    fastSwap = this === slider.getSliderTracker().element;
                    splitterMoving = true;
                    isTouchEvent = isTouchEventArgs(e);
                    startOffsetPosition = getEventPageX(e) - slider.getPosition() - that._getRootOffsetLeft();
                    if (!isMultiTouches(e)) {
                        this.preventedDefault = true;
                        e.stopPropagation();
                        e.preventDefault()
                    }
                };
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
                    splitterMoving = false,
                    startPageX,
                    areaEndHandler = function(e) {
                        var pageX;
                        if (unselectedAreaProcessing) {
                            pageX = getEventPageX(e);
                            if (that._options.behavior.moveSelectedRangeByClick && Math.abs(startPageX - pageX) < MIN_MANUAL_SELECTING_WIDTH)
                                slidersController.applySelectedAreaCenterPosition(pageX - that._getRootOffsetLeft());
                            unselectedAreaProcessing = false;
                            processSelectionChanged(false)
                        }
                    },
                    areaMoveHandler = function(e) {
                        var pageX,
                            startPosition,
                            endPosition,
                            svgOffsetLeft = that._getRootOffsetLeft();
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
                    selectedAreaEndHandler = function(e) {
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
        };
        rangeSelector.__setEvents = setEvents
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file slider.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            utils = DX.utils,
            rangeSelectorUtils = rangeSelector.utils,
            _inArray = $.inArray,
            touchSupport = "ontouchstart" in window,
            msPointerEnabled = window.navigator.msPointerEnabled || window.navigator.pointerEnabled,
            animationOptions = {duration: 250},
            SPLITTER_WIDTH = 8,
            TOUCH_SPLITTER_WIDTH = 20,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            DISCRETE = 'discrete',
            baseVisualElementMethods = rangeSelector.baseVisualElementMethods;
        function checkItemsSpacing(firstSliderPosition, secondSliderPosition, distance) {
            return Math.abs(secondSliderPosition - firstSliderPosition) < distance
        }
        function getValidCategories(categories, curValue, anotherSliderValue, offset) {
            var curValueindex = _inArray(curValue, categories);
            if (curValueindex === 0 || curValueindex === categories.length - 1)
                return anotherSliderValue;
            return categories[curValueindex - offset]
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
            _createSlider: function() {
                var that = this,
                    sliderHandle,
                    sliderGroup,
                    sliderHandleOptions = that._options.sliderHandle;
                sliderGroup = that._renderer.g().attr({
                    'class': 'slider',
                    translateX: that._options.canvas.left,
                    translateY: that._options.canvas.top
                });
                sliderHandle = that._renderer.path([0, 0, 0, that._options.canvas.height], "line").attr({
                    'class': 'dx-range-selector-slider',
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
            _createSliderTracker: function() {
                var that = this,
                    sliderHandleWidth = that._options.sliderHandle.width,
                    splitterWidth = SPLITTER_WIDTH < sliderHandleWidth ? sliderHandleWidth : SPLITTER_WIDTH,
                    sliderWidth = touchSupport || msPointerEnabled ? TOUCH_SPLITTER_WIDTH : splitterWidth,
                    sliderTracker,
                    sliderTrackerGroup;
                sliderTrackerGroup = that._renderer.g().attr({
                    'class': 'sliderTracker',
                    translateX: 0,
                    translateY: that._options.canvas.top
                });
                sliderTracker = that._renderer.rect(-sliderWidth / 2, 0, sliderWidth, that._options.canvas.height).attr({
                    fill: 'grey',
                    stroke: 'grey',
                    opacity: 0.0001
                }).css({cursor: 'w-resize'}).append(sliderTrackerGroup);
                sliderTrackerGroup.updateHeight = function() {
                    sliderTracker.attr({height: that._options.canvas.height})
                };
                sliderTrackerGroup.__rect = sliderTracker;
                return sliderTrackerGroup
            },
            _drawSliderTracker: function(group) {
                var that = this,
                    sliderTracker = that._createSliderTracker();
                if (sliderTracker) {
                    sliderTracker.append(group);
                    that._sliderTracker = sliderTracker
                }
            },
            _createSliderMarker: function(options) {
                return rangeSelector.rangeSelectorFactory.createSliderMarker(options)
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
                var that = this,
                    correctedPosition = that._correctInversion(position);
                correctedPosition = that._correctBounds(correctedPosition);
                return correctedPosition
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
                    scale = that._options.scale,
                    values = that._values,
                    sliderIndex = that.getIndex(),
                    anotherSlider = that.getAnotherSlider(),
                    anotherBusinessValue = anotherSlider.getValue(),
                    isValid = true,
                    minValue,
                    maxValue,
                    maxRange = scale.maxRange,
                    minRange = scale.minRange,
                    categoriesInfo;
                if (scale.type === DISCRETE) {
                    categoriesInfo = scale._categoriesInfo;
                    if (checkItemsSpacing(that.getPosition(), anotherSlider.getPosition(), that._options.translator.getInterval() / 2)) {
                        isValid = false;
                        result = getValidCategories(categoriesInfo.categories, businessValue, anotherSlider.getValue(), sliderIndex === START_VALUE_INDEX ? 1 : -1)
                    }
                }
                else {
                    if (!scale.inverted && sliderIndex === START_VALUE_INDEX || scale.inverted && sliderIndex === END_VALUE_INDEX) {
                        if (maxRange)
                            minValue = that._addInterval(anotherBusinessValue, maxRange, true);
                        if (minRange)
                            maxValue = that._addInterval(anotherBusinessValue, minRange, true)
                    }
                    else {
                        if (maxRange)
                            maxValue = that._addInterval(anotherBusinessValue, maxRange);
                        if (minRange)
                            minValue = that._addInterval(anotherBusinessValue, minRange)
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
                    values = that._values,
                    startValue,
                    endValue,
                    isValid = true,
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
                    isAnimation = that._options.behavior.animationEnabled && !disableAnimation,
                    slider = that._slider,
                    attrs = {
                        translateX: position,
                        translateY: that._options.canvas.top
                    };
                if (isAnimation) {
                    slider.animate(attrs, animationOptions);
                    that._sliderTracker.animate(attrs, animationOptions)
                }
                else {
                    that._slider.stopAnimation().attr(attrs);
                    that._sliderTracker.stopAnimation().attr(attrs)
                }
                that._sliderTracker.updateHeight();
                that._slider.updateHeight()
            },
            _applyShutterPosition: function(position, disableAnimation) {
                var that = this,
                    shutterSettings,
                    shutter = that._shutter,
                    isAnimation = that._options.behavior.animationEnabled && !disableAnimation,
                    sliderIndex = that.getIndex(),
                    canvas = that._options.canvas;
                if (sliderIndex === START_VALUE_INDEX)
                    shutterSettings = {
                        x: canvas.left,
                        y: canvas.top,
                        width: position - canvas.left,
                        height: canvas.height
                    };
                else if (sliderIndex === END_VALUE_INDEX)
                    shutterSettings = {
                        x: position + 1,
                        y: canvas.top,
                        width: canvas.left + canvas.width - position,
                        height: canvas.height
                    };
                if (shutterSettings)
                    if (isAnimation)
                        shutter.animate(shutterSettings, animationOptions);
                    else
                        shutter.stopAnimation().attr(shutterSettings)
            },
            _setValid: function(isValid) {
                var marker = this._marker;
                if (marker)
                    marker.setValid(isValid);
                this._slider.setValid(isValid)
            },
            _setText: function(text) {
                var marker = this._marker;
                if (marker)
                    marker.setText(text)
            },
            _update: function() {
                var that = this,
                    options = that._options,
                    shutterOptions = options.shutter,
                    sliderHandleOptions = options.sliderHandle,
                    marker = that._marker;
                marker && marker.applyOptions(options.sliderMarker);
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
                    shutter,
                    startPos,
                    startWidth,
                    index = that.getIndex();
                sliderAreaGroup = that._renderer.g().attr({'class': 'sliderArea'}).append(group);
                if (index === START_VALUE_INDEX)
                    shutter = that._renderer.rect(that._options.canvas.left, that._options.canvas.top, 0, that._options.canvas.height);
                else if (index === END_VALUE_INDEX)
                    shutter = that._renderer.rect(that._options.canvas.left, that._options.canvas.top, that._options.canvas.width, that._options.canvas.height);
                if (shutter) {
                    shutter.append(sliderAreaGroup);
                    slider = that._createSlider();
                    if (slider)
                        slider.append(sliderAreaGroup);
                    if (that._options.sliderMarker.visible) {
                        marker = that._createSliderMarker({
                            renderer: that._renderer,
                            isLeftPointer: index === END_VALUE_INDEX,
                            sliderMarkerOptions: that._options.sliderMarker
                        });
                        marker.draw(slider)
                    }
                    that._shutter = shutter;
                    that._slider = slider;
                    that._marker = marker
                }
                that._drawSliderTracker(group)
            },
            _applyOptions: function(options) {
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
                var sliderTracker = this._sliderTracker;
                if (sliderTracker)
                    sliderTracker.append(group)
            },
            getSliderTracker: function() {
                return this._sliderTracker
            },
            changeLocation: function() {
                var that = this,
                    marker = that._marker;
                if (marker)
                    marker.changeLocation();
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
                    canvas = options.canvas;
                if (value === undefined) {
                    that._value = undefined;
                    that._valuePosition = that._position = that.getIndex() === START_VALUE_INDEX ? canvas.left : canvas.left + canvas.width;
                    that._setText(rangeSelector.consts.emptySliderMarkerText)
                }
                else {
                    that._value = that._correctValue(value, correctByMinMaxRange, utils.isDefined(skipCorrection) ? !!skipCorrection : true);
                    that._valuePosition = that._position = options.translator.translate(that._value, that._getValueDirection());
                    that._setText(rangeSelector.formatValue(that._value, options.sliderMarker))
                }
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
            SLIDER_MARKER_UPDATE_DELAY = 75;
        SliderMarker = rangeSelector.SliderMarker = function(options) {
            var that = this;
            that._renderer = options.renderer;
            that._text = options.text;
            that._isLeftPointer = options.isLeftPointer;
            that._options = $.extend(true, {}, options.sliderMarkerOptions);
            that._options.textFontStyles = core.utils.patchFontOptions(that._options.font);
            that._isValid = true;
            initializeAreaPoints(that, {
                width: 10,
                height: 10
            })
        };
        var getRectSize = function(that, textSize) {
                return {
                        width: Math.round(2 * that._options.padding + textSize.width),
                        height: Math.round(2 * that._options.padding + textSize.height)
                    }
            };
        var initializeAreaPoints = function(that, textSize) {
                var rectSize = getRectSize(that, textSize);
                if (that._isLeftPointer)
                    that._points = [0, 0, rectSize.width, 0, rectSize.width, rectSize.height, that._options.pointerSize, rectSize.height, 0, rectSize.height + that._options.pointerSize];
                else
                    that._points = [0, 0, rectSize.width, 0, rectSize.width, rectSize.height + that._options.pointerSize, rectSize.width - that._options.pointerSize, rectSize.height, 0, rectSize.height]
            };
        var getPointerPosition = function(that, textSize) {
                var rectSize = getRectSize(that, textSize);
                if (that._isLeftPointer)
                    return {
                            x: 0,
                            y: rectSize.height + that._options.pointerSize
                        };
                else
                    return {
                            x: rectSize.width - 1,
                            y: rectSize.height + that._options.pointerSize
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
        SliderMarker.prototype = {
            constructor: SliderMarker,
            draw: function(group) {
                var that = this;
                var padding = that._options.padding;
                that._sliderMarkerGroup = that._renderer.g().attr({'class': 'sliderMarker'}).append(group);
                that._area = that._renderer.path(that.points, "area").attr({fill: that._options.color}).append(that._sliderMarkerGroup);
                that._label = that._renderer.text(that._text, 0, 0).attr({align: 'left'}).css($.extend({'-webkit-user-select': 'none'}, that._options.textFontStyles)).append(that._sliderMarkerGroup);
                that._tracker = that._renderer.rect(0, 0, 2 * padding, 2 * padding + that._options.pointerSize).attr({
                    fill: 'grey',
                    stroke: 'grey',
                    opacity: 0.0001
                }).css({cursor: 'pointer'}).append(that._sliderMarkerGroup);
                that._drawn = true;
                that.update()
            },
            update: function(stop) {
                var that = this,
                    textSize,
                    rectSize,
                    pointerPosition;
                clearInterval(that._interval);
                that._interval = null;
                if (!that._drawn)
                    return;
                that._label.attr({text: that._text || ""});
                textSize = getTextSize(that);
                if (!stop) {
                    that._textSize = that._textSize || textSize;
                    that._textSize = textSize.width > that._textSize.width || textSize.height > that._textSize.height ? textSize : that._textSize;
                    textSize = that._textSize;
                    that._interval = setInterval(function() {
                        that.update(true)
                    }, SLIDER_MARKER_UPDATE_DELAY)
                }
                else {
                    delete that._textSize;
                    that._textSize = textSize
                }
                rectSize = getRectSize(that, textSize);
                pointerPosition = getPointerPosition(that, textSize);
                that._sliderMarkerGroup.attr({
                    translateX: -pointerPosition.x,
                    translateY: -pointerPosition.y
                });
                initializeAreaPoints(that, textSize);
                that._area.attr({
                    points: that._points,
                    fill: that._isValid ? that._options.color : that._options.invalidRangeColor
                });
                that._tracker.attr({
                    width: rectSize.width,
                    height: rectSize.height + that._options.pointerSize
                });
                that._label.attr({
                    translateX: that._options.padding,
                    translateY: rectSize.height / 2 - (textSize.y + textSize.height / 2)
                })
            },
            getText: function() {
                return this._text
            },
            setText: function(value) {
                var that = this;
                if (that._text !== value) {
                    that._text = value;
                    that.update()
                }
            },
            changeLocation: function() {
                var that = this;
                that._isLeftPointer = !that._isLeftPointer;
                that.update()
            },
            applyOptions: function(options) {
                var that = this;
                that._options = $.extend(true, {}, options);
                that._options.textFontStyles = core.utils.patchFontOptions(that._options.font);
                that.update()
            },
            getTracker: function() {
                return this._tracker
            },
            setValid: function(isValid) {
                var that = this;
                that._isValid = isValid;
                that.update()
            },
            dispose: function() {
                clearInterval(this._interval)
            },
            updateDelay: SLIDER_MARKER_UPDATE_DELAY
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
                    viewRect,
                    viewImage,
                    backgroundColor,
                    series,
                    i,
                    showChart,
                    canvas,
                    options = that._options,
                    seriesOptions,
                    isEmpty = options.isEmpty,
                    renderer = that._renderer;
                showChart = options.seriesDataSource && options.seriesDataSource.isShowChart() && !isEmpty;
                canvas = options.canvas;
                if (showChart)
                    backgroundColor = options.seriesDataSource.getBackgroundColor();
                else if (!isEmpty && options.background.visible)
                    backgroundColor = options.background.color;
                if (options.background.visible && backgroundColor)
                    viewRect = renderer.rect(canvas.left, canvas.top, canvas.width + 1, canvas.height).attr({
                        fill: backgroundColor,
                        'class': 'dx-range-selector-background'
                    }).append(group);
                if (options.background.visible && options.background.image && options.background.image.url)
                    viewImage = renderer.image(canvas.left, canvas.top, canvas.width + 1, canvas.height, options.background.image.url, options.background.image.location).append(group);
                if (showChart) {
                    series = options.seriesDataSource.getSeries();
                    options.seriesDataSource.adjustSeriesDimensions(options.translators, options.chart.useAggregation);
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
        _SeriesDatasource = rangeSelector.SeriesDataSource = function(options) {
            var that = this,
                templatedSeries,
                seriesTemplate,
                themeManager = that.themeManager = createThemeManager(options.chart),
                topIndent = themeManager.getOptions('topIndent'),
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
                    chartThemeManager = that.themeManager,
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
                that._backgroundColor = options.backgroundColor !== undefined ? options.backgroundColor : chartThemeManager.getOptions("backgroundColor");
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
                    if (hasSeriesTemplate) {
                        $.each(data, function(_, data) {
                            $.each(newSeries.getTeamplatedFields(), function(_, field) {
                                data[field.teamplateField] = data[field.originalField]
                            });
                            that.teamplateData.push(data)
                        });
                        newSeries.updateTeamplateFieldNames()
                    }
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
                    i,
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
                var that = this;
                return that._backgroundColor
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
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file themeManager.js */
    (function($, DX, undefined) {
        DX.viz.rangeSelector.ThemeManager = DX.viz.core.BaseThemeManager.inherit({
            _themeSection: 'rangeSelector',
            _fontFields: ['scale.label.font', 'sliderMarker.font', 'loadingIndicator.font'],
            ctor: function(userTheme) {
                this.setTheme(userTheme)
            },
            applyRangeSelectorTheme: function(userOptions) {
                var that = this,
                    chart = userOptions.chart,
                    dataSource = userOptions.dataSource,
                    result;
                delete userOptions.dataSource;
                delete userOptions.chart;
                result = $.extend(true, {}, that._theme, userOptions);
                userOptions.dataSource = result.dataSource = dataSource;
                if (chart)
                    userOptions.chart = result.chart = chart;
                return result
            },
            setBackgroundColor: function(containerBackgroundColor) {
                var theme = this._theme;
                if (containerBackgroundColor)
                    theme.containerBackgroundColor = containerBackgroundColor;
                theme.shutter.color = theme.shutter.color || theme.containerBackgroundColor
            }
        })
    })(jQuery, DevExpress);
    DevExpress.MOD_VIZ_RANGESELECTOR = true
}