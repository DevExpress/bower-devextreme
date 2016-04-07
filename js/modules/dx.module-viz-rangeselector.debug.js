/*! 
* DevExtreme (Range Selector)
* Version: 15.2.9
* Build date: Apr 7, 2016
*
* Copyright (c) 2012 - 2016 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!window.DevExpress || !DevExpress.MOD_VIZ_RANGESELECTOR) {
    if (!window.DevExpress || !DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-rangeselector, file rangeSelector.js */
    (function(DX, $, undefined) {
        var rangeSelector = DX.viz.rangeSelector = {},
            commonUtils = DX.require("/utils/utils.common"),
            mathUtils = DX.require("/utils/utils.math"),
            dateUtils = DX.require("/utils/utils.date"),
            viz = DX.viz,
            vizUtils = viz.utils,
            patchFontOptions = vizUtils.patchFontOptions,
            parseUtils = viz.parseUtils,
            _normalizeEnum = vizUtils.normalizeEnum,
            formatHelper = DX.require("/utils/utils.formatHelper"),
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
            OPTION_BACKGROUND = "background",
            LOGARITHMIC = "logarithmic",
            INVISIBLE_POS = -1000,
            logarithmBase = 10;
        rangeSelector.utils = {
            trackerSettings: {
                fill: "grey",
                stroke: "grey",
                opacity: 0.0001
            },
            animationSettings: {duration: 250}
        };
        rangeSelector.consts = {
            emptySliderMarkerText: EMPTY_SLIDER_MARKER_TEXT,
            pointerSize: POINTER_SIZE
        };
        rangeSelector.HEIGHT_COMPACT_MODE = HEIGHT_COMPACT_MODE;
        var formatValue = rangeSelector.formatValue = function(value, formatOptions) {
                var formatObject = {
                        value: value,
                        valueText: formatHelper.format(value, formatOptions.format, formatOptions.precision)
                    };
                return String(commonUtils.isFunction(formatOptions.customizeText) ? formatOptions.customizeText.call(formatObject, formatObject) : formatObject.valueText)
            };
        function createTranslator() {
            return new viz.Translator2D({}, {})
        }
        function updateTranslator(translator, valueRange, screenRange) {
            translator.update(valueRange, {
                left: screenRange[0],
                width: screenRange[1]
            }, {isHorizontal: true})
        }
        function calculateMarkerHeight(renderer, value, sliderMarkerOptions) {
            var formattedText = value === undefined ? EMPTY_SLIDER_MARKER_TEXT : formatValue(value, sliderMarkerOptions),
                textBBox = getTextBBox(renderer, formattedText, sliderMarkerOptions.font);
            return _ceil(textBBox.height) + 2 * sliderMarkerOptions.paddingTopBottom + POINTER_SIZE
        }
        function calculateScaleLabelHalfWidth(renderer, value, scaleOptions) {
            var formattedText = formatValue(value, scaleOptions.label),
                textBBox = getTextBBox(renderer, formattedText, scaleOptions.label.font);
            return _ceil(textBBox.width / 2)
        }
        function parseSliderMarkersPlaceholderSize(placeholderSize) {
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
        }
        function calculateIndents(renderer, scale, sliderMarkerOptions, indentOptions) {
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
        }
        function calculateValueType(firstValue, secondValue) {
            var typeFirstValue = $.type(firstValue),
                typeSecondValue = $.type(secondValue),
                validType = function(type) {
                    return typeFirstValue === type || typeSecondValue === type
                };
            return validType("date") ? DATETIME : validType("number") ? "numeric" : validType(STRING) ? STRING : ""
        }
        function showScaleMarkers(scaleOptions) {
            return scaleOptions.valueType === DATETIME && scaleOptions.marker.visible
        }
        function updateTranslatorRangeInterval(translatorRange, scaleOptions) {
            var intervalX = scaleOptions.minorTickInterval || scaleOptions.tickInterval;
            if (scaleOptions.valueType === "datetime")
                intervalX = dateUtils.dateToMilliseconds(intervalX);
            translatorRange.addRange({interval: intervalX})
        }
        function checkLogarithmicOptions(options, defaultLogarithmBase, incidentOccured) {
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
        }
        function calculateScaleAreaHeight(renderer, scaleOptions, visibleMarkers) {
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
        }
        function updateTickIntervals(scaleOptions, screenDelta, incidentOccured, stick, min, max) {
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
        }
        function calculateTranslatorRange(seriesDataSource, scaleOptions) {
            var minValue,
                maxValue,
                inverted = false,
                isEqualDates,
                startValue = scaleOptions.startValue,
                endValue = scaleOptions.endValue,
                categories,
                categoriesInfo,
                translatorRange = seriesDataSource ? seriesDataSource.getBoundRange().arg : new viz.Range,
                rangeForCategories;
            if (scaleOptions.type === DISCRETE) {
                rangeForCategories = new viz.Range({
                    categories: scaleOptions.categories || (!seriesDataSource && startValue && endValue ? [startValue, endValue] : undefined),
                    minVisible: startValue,
                    maxVisible: endValue
                });
                rangeForCategories.addRange(translatorRange);
                translatorRange = rangeForCategories;
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
                translatorRange.addRange({
                    invert: inverted,
                    min: minValue,
                    max: maxValue,
                    minVisible: minValue,
                    maxVisible: maxValue,
                    dataType: scaleOptions.valueType
                });
            translatorRange.addRange({
                base: scaleOptions.logarithmBase,
                axisType: scaleOptions.type
            });
            if (!translatorRange.isDefined()) {
                if (isEqualDates)
                    scaleOptions.valueType = "numeric";
                translatorRange.setStubData(scaleOptions.valueType)
            }
            return translatorRange
        }
        function startEndNotDefined(start, end) {
            return !_isDefined(start) || !_isDefined(end)
        }
        function getTextBBox(renderer, text, fontOptions) {
            var textElement = renderer.text(text, INVISIBLE_POS, INVISIBLE_POS).css(patchFontOptions(fontOptions)).append(renderer.root);
            var textBBox = textElement.getBBox();
            textElement.remove();
            return textBBox
        }
        function updateScaleOptions(scaleOptions, seriesDataSource, translatorRange, tickIntervalsInfo) {
            var bounds,
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
        }
        function prepareScaleOptions(scaleOption, seriesDataSource, incidentOccurred) {
            var parsedValue = 0,
                valueType = parseUtils.correctValueType(_normalizeEnum(scaleOption.valueType)),
                parser,
                validateStartEndValues = function(field, parser) {
                    var messageToIncidentOccured = field === START_VALUE ? "start" : "end";
                    if (_isDefined(scaleOption[field])) {
                        parsedValue = parser(scaleOption[field]);
                        if (_isDefined(parsedValue))
                            scaleOption[field] = parsedValue;
                        else {
                            scaleOption[field] = undefined;
                            incidentOccurred("E2202", [messageToIncidentOccured])
                        }
                    }
                };
            if (seriesDataSource)
                valueType = seriesDataSource.getCalculatedValueType() || valueType;
            if (!valueType)
                valueType = calculateValueType(scaleOption.startValue, scaleOption.endValue) || "numeric";
            if (valueType === STRING || scaleOption.categories) {
                scaleOption.type = DISCRETE;
                valueType = STRING
            }
            scaleOption.valueType = valueType;
            parser = parseUtils.getParser(valueType);
            validateStartEndValues(START_VALUE, parser);
            validateStartEndValues(END_VALUE, parser);
            checkLogarithmicOptions(scaleOption, logarithmBase, incidentOccurred);
            if (!scaleOption.type)
                scaleOption.type = "continuous";
            scaleOption.tickInterval === undefined && (scaleOption.tickInterval = scaleOption.majorTickInterval);
            scaleOption.minorTick.visible && (scaleOption.minorTick.visible = scaleOption.showMinorTicks);
            scaleOption.parser = parser;
            return scaleOption
        }
        function performTitleLayout(canvas, title) {
            var cuttedCanvas = title.getVerticalCuttedSize({
                    left: canvas.left,
                    top: canvas.top,
                    right: canvas.right,
                    bottom: canvas.bottom,
                    width: canvas.width - canvas.left - canvas.right,
                    height: canvas.height - canvas.top - canvas.bottom
                }),
                layoutOptions = title.getLayoutOptions(),
                target;
            if (layoutOptions) {
                target = {
                    x: cuttedCanvas.left,
                    y: cuttedCanvas.top,
                    width: cuttedCanvas.width,
                    height: cuttedCanvas.height + layoutOptions.height,
                    getLayoutOptions: function() {
                        return this
                    }
                };
                if (layoutOptions.verticalAlignment !== "bottom")
                    target.y -= layoutOptions.height;
                title.position({
                    at: layoutOptions.position,
                    my: layoutOptions.position,
                    of: target
                })
            }
            return cuttedCanvas
        }
        DX.require("/componentRegistrator")("dxRangeSelector", rangeSelector, viz.BaseWidget.inherit({
            _eventsMap: $.extend({}, viz.BaseWidget.prototype._eventsMap, {onSelectedRangeChanged: {name: SELECTED_RANGE_CHANGED}}),
            _setDeprecatedOptions: function() {
                this.callBase.apply(this, arguments);
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
            _invalidatingOptions: ["scale", "selectedRangeColor", "containerBackgroundColor", "sliderMarker", "sliderHandle", "shutter", "title", OPTION_BACKGROUND, "behavior", "chart", "indent"],
            _dataIsReady: function() {
                return this._dataSource.isLoaded()
            },
            _init: function() {
                this.callBase.apply(this, arguments);
                this._updateDataSource()
            },
            _initCore: function() {
                var that = this,
                    renderer = that._renderer,
                    root = renderer.root,
                    rangeViewGroup,
                    slidersGroup,
                    scaleGroup,
                    trackersGroup;
                root.css({
                    "touch-action": "pan-y",
                    "-ms-touch-action": "pan-y"
                });
                that._updateSelectedRangeCallback = function(range) {
                    that.option(SELECTED_RANGE, range);
                    that._eventTrigger(SELECTED_RANGE_CHANGED, {
                        startValue: range.startValue,
                        endValue: range.endValue
                    })
                };
                that._clipRect = renderer.clipRect();
                rangeViewGroup = renderer.g().attr({"class": "dxrs-view"}).append(root);
                slidersGroup = renderer.g().attr({
                    "class": "dxrs-slidersContainer",
                    clipId: that._clipRect.id
                }).append(root);
                scaleGroup = renderer.g().attr({
                    "class": "dxrs-scale",
                    clipId: that._clipRect.id
                }).append(root);
                trackersGroup = renderer.g().attr({"class": "dxrs-trackers"}).append(root);
                that._translator = createTranslator();
                that._rangeView = new rangeSelector.RangeView({
                    renderer: renderer,
                    root: rangeViewGroup,
                    translator: that._translator
                });
                that._slidersController = new rangeSelector.SlidersController({
                    renderer: renderer,
                    root: slidersGroup,
                    trackersGroup: trackersGroup,
                    updateSelectedRange: that._updateSelectedRangeCallback,
                    translator: that._translator
                });
                that._axis = new AxisWrapper({
                    renderer: renderer,
                    root: scaleGroup,
                    updateSelectedRange: that._updateSelectedRangeCallback,
                    translator: that._translator
                });
                that._tracker = new rangeSelector.Tracker({
                    renderer: renderer,
                    controller: that._slidersController
                })
            },
            _getDefaultSize: function() {
                return {
                        width: 400,
                        height: 160
                    }
            },
            _disposeCore: function() {
                this._axis.dispose();
                this._slidersController.dispose();
                this._tracker.dispose()
            },
            _createThemeManager: function() {
                return new rangeSelector.ThemeManager
            },
            _render: function() {
                var that = this,
                    renderer = that._renderer,
                    currentAnimationEnabled,
                    canvas;
                renderer.lock();
                if (that.__isResizing) {
                    currentAnimationEnabled = renderer.animationEnabled();
                    renderer.updateAnimationOptions({enabled: false})
                }
                canvas = performTitleLayout(that._canvas, that._title);
                that._clipRect.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: canvas.width,
                    height: canvas.height
                });
                that._updateContent(canvas);
                if (that.__isResizing)
                    renderer.updateAnimationOptions({enabled: currentAnimationEnabled});
                renderer.unlock();
                if (!that.__isResizing && that._dataIsReady())
                    that.hideLoadingIndicator();
                that._drawn()
            },
            _handleChangedOptions: function(options) {
                var that = this,
                    oldSelectedRange = that._options[SELECTED_RANGE],
                    newSelectedRange = $.extend({}, options[SELECTED_RANGE]);
                that.callBase.apply(that, arguments);
                if ("dataSource" in options) {
                    that._options[SELECTED_RANGE] = null;
                    that._updateDataSource()
                }
                if (SELECTED_RANGE in options)
                    that.setSelectedRange($.extend({}, oldSelectedRange, options[SELECTED_RANGE], newSelectedRange))
            },
            _applySize: function() {
                if (this._initialized) {
                    this.__isResizing = true;
                    this._render();
                    this.__isResizing = false
                }
            },
            _dataSourceChangedHandler: function() {
                if (this._initialized)
                    this._render()
            },
            _updateContent: function(canvas) {
                var that = this,
                    chartOptions = that.option("chart"),
                    seriesDataSource = that._createSeriesDataSource(chartOptions),
                    isCompactMode = !(seriesDataSource && seriesDataSource.isShowChart() || that.option("background.image.url")),
                    scaleOptions = prepareScaleOptions(that._getOption("scale"), seriesDataSource, that._incidentOccured),
                    argTranslatorRange = calculateTranslatorRange(seriesDataSource, scaleOptions),
                    min = _isDefined(argTranslatorRange.minVisible) ? argTranslatorRange.minVisible : argTranslatorRange.min,
                    max = _isDefined(argTranslatorRange.maxVisible) ? argTranslatorRange.maxVisible : argTranslatorRange.max,
                    tickIntervalsInfo = updateTickIntervals(scaleOptions, canvas.width, that._incidentOccured, argTranslatorRange.stick, min, max),
                    sliderMarkerOptions,
                    indents,
                    scaleLabelsAreaHeight,
                    rangeContainerCanvas,
                    chartThemeManager = seriesDataSource && seriesDataSource.isShowChart() && seriesDataSource.getThemeManager();
                if (chartThemeManager)
                    checkLogarithmicOptions(chartOptions && chartOptions.valueAxis, chartThemeManager.getOptions("valueAxis").logarithmBase, that._incidentOccured);
                updateScaleOptions(scaleOptions, seriesDataSource, argTranslatorRange, tickIntervalsInfo);
                updateTranslatorRangeInterval(argTranslatorRange, scaleOptions);
                sliderMarkerOptions = that._prepareSliderMarkersOptions(scaleOptions, canvas.width, tickIntervalsInfo);
                indents = calculateIndents(that._renderer, scaleOptions, sliderMarkerOptions, that.option("indent"));
                scaleLabelsAreaHeight = calculateScaleAreaHeight(that._renderer, scaleOptions, showScaleMarkers(scaleOptions));
                rangeContainerCanvas = {
                    left: canvas.left + indents.left,
                    top: canvas.top + indents.top,
                    width: _max(canvas.width - indents.left - indents.right, 1),
                    height: _max(!isCompactMode ? canvas.height - indents.top - indents.bottom - scaleLabelsAreaHeight : HEIGHT_COMPACT_MODE, 0)
                };
                updateTranslator(that._translator, argTranslatorRange, [rangeContainerCanvas.left, rangeContainerCanvas.left + rangeContainerCanvas.width]);
                scaleOptions.minorTickInterval = scaleOptions.isEmpty ? 0 : scaleOptions.minorTickInterval;
                that._updateElements(scaleOptions, sliderMarkerOptions, isCompactMode, rangeContainerCanvas, seriesDataSource);
                if (chartThemeManager)
                    chartThemeManager.dispose()
            },
            _updateElements: function(scaleOptions, sliderMarkerOptions, isCompactMode, canvas, seriesDataSource) {
                var that = this,
                    behavior = that._getOption("behavior"),
                    selectedRange = that.option(SELECTED_RANGE),
                    shutterOptions = that._getOption("shutter");
                if (selectedRange) {
                    if (!that._translator.isValid(selectedRange[START_VALUE]))
                        that._incidentOccured("E2203", [START_VALUE]);
                    if (!that._translator.isValid(selectedRange[END_VALUE]))
                        that._incidentOccured("E2203", [END_VALUE])
                }
                shutterOptions.color = shutterOptions.color || that._getOption(CONTAINER_BACKGROUND_COLOR, true);
                that._rangeView.update(that.option("background"), that._themeManager.theme("background"), canvas, isCompactMode, behavior.animationEnabled && that._renderer.animationEnabled(), seriesDataSource);
                that._axis.update(scaleOptions, isCompactMode, canvas);
                that._isUpdating = true;
                that._slidersController.update([canvas.top, canvas.top + canvas.height], behavior, isCompactMode, that._getOption("sliderHandle"), sliderMarkerOptions, shutterOptions, {
                    minRange: that.option("scale.minRange"),
                    maxRange: that.option("scale.maxRange")
                }, that._axis.getFullTicks(), that._getOption("selectedRangeColor", true));
                that._slidersController.setSelectedRange(selectedRange);
                that._isUpdating = false;
                that._tracker.update(!that._translator.isEmptyValueRange(), behavior)
            },
            _createSeriesDataSource: function(chartOptions) {
                var that = this,
                    seriesDataSource,
                    dataSource = that._dataSource.items(),
                    scaleOptions = that._getOption("scale"),
                    valueType = scaleOptions.valueType || calculateValueType(scaleOptions.startValue, scaleOptions.endValue);
                if (dataSource || chartOptions && chartOptions.series) {
                    chartOptions = $.extend({}, chartOptions, {theme: that.option("theme")});
                    seriesDataSource = new rangeSelector.SeriesDataSource({
                        renderer: that._renderer,
                        dataSource: dataSource,
                        valueType: _normalizeEnum(valueType),
                        axisType: scaleOptions.type,
                        chart: chartOptions,
                        dataSourceField: that.option("dataSourceField"),
                        incidentOccured: that._incidentOccured,
                        categories: scaleOptions.categories
                    })
                }
                return seriesDataSource
            },
            _prepareSliderMarkersOptions: function(scaleOptions, screenDelta, tickIntervalsInfo) {
                var that = this,
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
                    if (isValueTypeDatetime && isTypeDiscrete && tickIntervalsInfo.ticks.length)
                        sliderMarkerOptions.format = formatHelper.getDateFormatByTicks(tickIntervalsInfo.ticks)
                }
                if (sliderMarkerUserOption.padding !== undefined && sliderMarkerUserOption.paddingLeftRight === undefined && sliderMarkerUserOption.paddingTopBottom === undefined)
                    sliderMarkerOptions.paddingLeftRight = sliderMarkerOptions.paddingTopBottom = sliderMarkerUserOption.padding;
                return sliderMarkerOptions
            },
            getSelectedRange: function() {
                return this._slidersController.getSelectedRange()
            },
            setSelectedRange: function(range) {
                var current;
                if (!this._isUpdating && range) {
                    current = this._slidersController.getSelectedRange();
                    if (!current || current.startValue !== range.startValue || current.endValue !== range.endValue)
                        this._slidersController.setSelectedRange(range)
                }
            },
            resetSelectedRange: function() {
                this.setSelectedRange({})
            },
            render: function(isResizing) {
                var that = this;
                that.__isResizing = isResizing;
                that.callBase.apply(that, arguments);
                that.__isResizing = false;
                return that
            },
            _initTooltip: _noop,
            _setTooltipRendererOptions: _noop,
            _setTooltipOptions: _noop,
            _hideTooltip: _noop
        }));
        function prepareAxixOptions(scaleOptions, isCompactMode, height, axisPosition) {
            scaleOptions.label.overlappingBehavior = {mode: scaleOptions.useTicksAutoArrangement ? "enlargeTickInterval" : "ignore"};
            scaleOptions.marker.label.font = scaleOptions.label.font;
            scaleOptions.color = scaleOptions.marker.color = scaleOptions.tick.color;
            scaleOptions.opacity = scaleOptions.marker.opacity = scaleOptions.tick.opacity;
            scaleOptions.width = scaleOptions.marker.width = scaleOptions.tick.width;
            scaleOptions.placeholderSize = (scaleOptions.placeholderHeight || 0) + axisPosition;
            scaleOptions.argumentType = scaleOptions.valueType;
            scaleOptions.visible = isCompactMode;
            scaleOptions.minorTick.showCalculatedTicks = scaleOptions.isHorizontal = scaleOptions.withoutOverlappingBehavior = scaleOptions.stick = true;
            if (!isCompactMode)
                scaleOptions.minorTick.length = scaleOptions.tick.length = height;
            scaleOptions.label.indentFromAxis = scaleOptions.label.topIndent + axisPosition;
            return scaleOptions
        }
        function createDateMarkersEvent(scaleOptions, markerTrackers, setSelectedRange) {
            $.each(markerTrackers, function(_, value) {
                value.on("dxpointerdown", onPointerDown)
            });
            function onPointerDown(e) {
                var range = e.target.range,
                    minRange = scaleOptions.minRange ? dateUtils.addInterval(range.startValue, scaleOptions.minRange) : undefined,
                    maxRange = scaleOptions.maxRange ? dateUtils.addInterval(range.startValue, scaleOptions.maxRange) : undefined;
                if (!(minRange && minRange > range.endValue || maxRange && maxRange < range.endValue))
                    setSelectedRange(range)
            }
        }
        function AxisWrapper(params) {
            this._axis = new DX.viz.axes.Axis({
                renderer: params.renderer,
                axesContainerGroup: params.root,
                axisType: "xyAxes",
                drawingType: "linear",
                widgetClass: "dxrs",
                axisClass: "range-selector"
            });
            this._updateSelectedRangeCallback = params.updateSelectedRange;
            this._translator = params.translator
        }
        AxisWrapper.prototype = {
            constructor: AxisWrapper,
            dispose: function() {
                this._axis.dispose()
            },
            update: function(options, isCompactMode, canvas) {
                var axis = this._axis;
                axis.updateOptions(prepareAxixOptions(options, isCompactMode, canvas.height, canvas.height / 2 - Math.ceil(options.width / 2)));
                axis.delta = {bottom: -canvas.height / 2};
                axis.setTranslator(this._translator, {translateSpecialCase: function() {
                        return canvas.top + canvas.height
                    }});
                axis.draw();
                if (axis.getMarkerTrackers())
                    createDateMarkersEvent(options, axis.getMarkerTrackers(), this._updateSelectedRangeCallback)
            },
            getFullTicks: function() {
                return this._axis.getFullTicks()
            }
        }
    })(DevExpress, jQuery);
    /*! Module viz-rangeselector, file slidersController.js */
    (function(DX, $, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            _normalizeEnum = DX.viz.utils.normalizeEnum;
        function buildRectPoints(left, top, right, bottom) {
            return [left, top, right, top, right, bottom, left, bottom]
        }
        function valueOf(value) {
            return value && value.valueOf()
        }
        function isLess(a, b) {
            return a < b
        }
        function isGreater(a, b) {
            return a > b
        }
        function selectClosestValue(target, values) {
            var start = 0,
                end = values ? values.length - 1 : 0,
                middle,
                val = target;
            while (end - start > 1) {
                middle = start + end >> 1;
                val = values[middle];
                if (val === target)
                    return target;
                else if (target < val)
                    end = middle;
                else
                    start = middle
            }
            if (values)
                val = values[target - values[start] <= values[end] - target ? start : end];
            return val
        }
        function dummyProcessSelectionChanged() {
            this._lastSelectedRange = this.getSelectedRange();
            delete this._processSelectionChanged
        }
        function suppressSetSelectedRange(controller) {
            controller.setSelectedRange = $.noop;
            if (controller._processSelectionChanged === dummyProcessSelectionChanged)
                controller._processSelectionChanged()
        }
        function restoreSetSelectedRange(controller) {
            delete controller.setSelectedRange
        }
        function SlidersController(params) {
            var that = this,
                sliderParams = {
                    renderer: params.renderer,
                    root: params.root,
                    trackersGroup: params.trackersGroup,
                    translator: params.translator
                };
            that._params = params;
            that._areaTracker = params.renderer.path(null, "area").attr({
                "class": "area-tracker",
                fill: "#000000",
                opacity: 0.0001
            }).append(params.trackersGroup);
            that._selectedAreaTracker = params.renderer.path(null, "area").attr({
                "class": "selected-area-tracker",
                fill: "#000000",
                opacity: 0.0001
            }).append(params.trackersGroup);
            that._shutter = params.renderer.path(null, "area").append(params.root);
            that._sliders = [new rangeSelector.Slider(sliderParams, 0), new rangeSelector.Slider(sliderParams, 1)];
            that._processSelectionChanged = dummyProcessSelectionChanged
        }
        SlidersController.prototype = {
            constructor: SlidersController,
            dispose: function() {
                this._sliders[0].dispose();
                this._sliders[1].dispose()
            },
            getTrackerTargets: function() {
                return {
                        area: this._areaTracker,
                        selectedArea: this._selectedAreaTracker,
                        sliders: this._sliders
                    }
            },
            _processSelectionChanged: function() {
                var that = this,
                    selectedRange = that.getSelectedRange();
                if (valueOf(selectedRange.startValue) !== valueOf(that._lastSelectedRange.startValue) || valueOf(selectedRange.endValue) !== valueOf(that._lastSelectedRange.endValue)) {
                    that._lastSelectedRange = selectedRange;
                    that._params.updateSelectedRange(selectedRange)
                }
            },
            update: function(verticalRange, behavior, isCompactMode, sliderHandleOptions, sliderMarkerOptions, shutterOptions, rangeBounds, fullTicks, selectedRangeColor) {
                var that = this,
                    screenRange = that._params.translator.getScreenRange();
                that._verticalRange = verticalRange;
                that._minRange = rangeBounds.minRange;
                that._maxRange = rangeBounds.maxRange;
                that._animationEnabled = behavior.animationEnabled && that._params.renderer.animationEnabled();
                that._allowSlidersSwap = behavior.allowSlidersSwap;
                that._sliders[0].update(verticalRange, sliderHandleOptions, sliderMarkerOptions);
                that._sliders[1].update(verticalRange, sliderHandleOptions, sliderMarkerOptions);
                that._sliders[0]._position = that._sliders[1]._position = screenRange[0];
                that._values = !that._params.translator.isValueProlonged && behavior.snapToTicks ? fullTicks : null;
                that._areaTracker.attr({points: buildRectPoints(screenRange[0], verticalRange[0], screenRange[1], verticalRange[1])});
                that._isCompactMode = isCompactMode;
                that._shutterOffset = sliderHandleOptions.width / 2;
                that._updateSelectedView(shutterOptions, selectedRangeColor);
                that._isOnMoving = _normalizeEnum(behavior.callSelectedRangeChanged) === "onmoving";
                that._updateSelectedRange();
                that._applyTotalPosition(false)
            },
            _updateSelectedView: function(shutterOptions, selectedRangeColor) {
                var settings = {
                        fill: null,
                        "fill-opacity": null,
                        stroke: null,
                        "stroke-width": null
                    };
                if (this._isCompactMode) {
                    settings.stroke = selectedRangeColor;
                    settings["stroke-width"] = 3;
                    settings.sharp = "v"
                }
                else {
                    settings.fill = shutterOptions.color;
                    settings["fill-opacity"] = shutterOptions.opacity
                }
                this._shutter.attr(settings)
            },
            _updateSelectedRange: function() {
                var that = this,
                    sliders = that._sliders;
                sliders[0].cancelAnimation();
                sliders[1].cancelAnimation();
                that._shutter.stopAnimation();
                if (that._params.translator.isEmptyValueRange()) {
                    sliders[0]._setText(rangeSelector.consts.emptySliderMarkerText);
                    sliders[1]._setText(rangeSelector.consts.emptySliderMarkerText);
                    sliders[0]._value = sliders[1]._value = undefined;
                    sliders[0]._position = that._params.translator.getScreenRange()[0];
                    sliders[1]._position = that._params.translator.getScreenRange()[1];
                    that._applyTotalPosition(false);
                    suppressSetSelectedRange(that)
                }
                else
                    restoreSetSelectedRange(that)
            },
            _applyTotalPosition: function(isAnimated) {
                var sliders = this._sliders,
                    areOverlapped;
                isAnimated = this._animationEnabled && isAnimated;
                sliders[0].applyPosition(isAnimated);
                sliders[1].applyPosition(isAnimated);
                areOverlapped = sliders[0].getCloudBorder() > sliders[1].getCloudBorder();
                sliders[0].setOverlapped(areOverlapped);
                sliders[1].setOverlapped(areOverlapped);
                this._applyAreaTrackersPosition();
                this._applySelectedRangePosition(isAnimated)
            },
            _applyAreaTrackersPosition: function() {
                var that = this,
                    position1 = that._sliders[0].getPosition(),
                    position2 = that._sliders[1].getPosition();
                that._selectedAreaTracker.attr({points: buildRectPoints(position1, that._verticalRange[0], position2, that._verticalRange[1])}).css({cursor: Math.abs(that._params.translator.getScreenRange()[1] - that._params.translator.getScreenRange()[0] - position2 + position1) < 0.001 ? "default" : "pointer"})
            },
            _applySelectedRangePosition: function(isAnimated) {
                var that = this,
                    verticalRange = that._verticalRange,
                    pos1 = that._sliders[0].getPosition(),
                    pos2 = that._sliders[1].getPosition(),
                    screenRange,
                    points;
                if (that._isCompactMode)
                    points = [pos1 + Math.ceil(that._shutterOffset), (verticalRange[0] + verticalRange[1]) / 2, pos2 - Math.floor(that._shutterOffset), (verticalRange[0] + verticalRange[1]) / 2];
                else {
                    screenRange = that._params.translator.getScreenRange();
                    points = [buildRectPoints(screenRange[0], verticalRange[0], Math.max(pos1 - Math.floor(that._shutterOffset), screenRange[0]), verticalRange[1]), buildRectPoints(screenRange[1], verticalRange[0], Math.min(pos2 + Math.ceil(that._shutterOffset), screenRange[1]), verticalRange[1])]
                }
                if (isAnimated)
                    that._shutter.animate({points: points}, rangeSelector.utils.animationSettings);
                else
                    that._shutter.attr({points: points})
            },
            getSelectedRange: function() {
                return {
                        startValue: this._sliders[0].getValue(),
                        endValue: this._sliders[1].getValue()
                    }
            },
            setSelectedRange: function(arg) {
                arg = arg || {};
                var that = this,
                    translator = that._params.translator,
                    startValue = translator.isValid(arg.startValue) ? translator.parse(arg.startValue) : translator.getRange()[0],
                    endValue = translator.isValid(arg.endValue) ? translator.parse(arg.endValue) : translator.getRange()[1],
                    values = translator.to(startValue, -1) < translator.to(endValue, +1) ? [startValue, endValue] : [endValue, startValue];
                that._sliders[0].setDisplayValue(values[0]);
                that._sliders[1].setDisplayValue(values[1]);
                that._sliders[0]._position = translator.to(values[0], -1);
                that._sliders[1]._position = translator.to(values[1], +1);
                that._applyTotalPosition(true);
                that._processSelectionChanged()
            },
            beginSelectedAreaMoving: function(initialPosition) {
                var that = this,
                    sliders = that._sliders,
                    offset = (sliders[0].getPosition() + sliders[1].getPosition()) / 2 - initialPosition,
                    currentPosition = initialPosition;
                move.complete = function() {
                    that._dockSelectedArea()
                };
                return move;
                function move(position) {
                    if (position !== currentPosition && position > currentPosition === position > (sliders[0].getPosition() + sliders[1].getPosition()) / 2 - offset)
                        that._moveSelectedArea(position + offset, false);
                    currentPosition = position
                }
            },
            _dockSelectedArea: function() {
                var translator = this._params.translator,
                    sliders = this._sliders;
                sliders[0]._position = translator.to(sliders[0].getValue(), -1);
                sliders[1]._position = translator.to(sliders[1].getValue(), +1);
                this._applyTotalPosition(true);
                this._processSelectionChanged()
            },
            moveSelectedArea: function(screenPosition) {
                this._moveSelectedArea(screenPosition, true);
                this._dockSelectedArea()
            },
            _moveSelectedArea: function(screenPosition, isAnimated) {
                var that = this,
                    translator = that._params.translator,
                    sliders = that._sliders,
                    interval = sliders[1].getPosition() - sliders[0].getPosition(),
                    startPosition = screenPosition - interval / 2,
                    endPosition = screenPosition + interval / 2,
                    startValue,
                    endValue;
                if (startPosition < translator.getScreenRange()[0]) {
                    startPosition = translator.getScreenRange()[0];
                    endPosition = startPosition + interval
                }
                if (endPosition > translator.getScreenRange()[1]) {
                    endPosition = translator.getScreenRange()[1];
                    startPosition = endPosition - interval
                }
                startValue = translator.from(startPosition, -1);
                endValue = translator.from(endPosition, +1);
                sliders[0].setDisplayValue(selectClosestValue(startValue, that._values));
                sliders[1].setDisplayValue(selectClosestValue(endValue, that._values));
                sliders[0]._position = startPosition;
                sliders[1]._position = endPosition;
                that._applyTotalPosition(isAnimated);
                if (that._isOnMoving)
                    that._processSelectionChanged()
            },
            placeSliderAndBeginMoving: function(firstPosition, secondPosition) {
                var that = this,
                    translator = that._params.translator,
                    sliders = that._sliders,
                    index = firstPosition < secondPosition ? 0 : 1,
                    dir = index > 0 ? +1 : -1,
                    compare = index > 0 ? isGreater : isLess,
                    antiCompare = index > 0 ? isLess : isGreater,
                    thresholdPosition,
                    positions = [],
                    values = [],
                    handler;
                values[index] = translator.from(firstPosition, dir);
                values[1 - index] = translator.from(secondPosition, -dir);
                positions[1 - index] = secondPosition;
                if (translator.isValueProlonged) {
                    if (compare(firstPosition, translator.to(values[index], dir)))
                        values[index] = translator.from(firstPosition, -dir);
                    if (compare(secondPosition, translator.to(values[index], -dir)))
                        values[1 - index] = values[index]
                }
                if (that._minRange) {
                    thresholdPosition = translator.to(translator.add(selectClosestValue(values[index], that._values), that._minRange, -dir), -dir);
                    if (compare(secondPosition, thresholdPosition))
                        values[1 - index] = translator.add(values[index], that._minRange, -dir);
                    thresholdPosition = translator.to(translator.add(translator.getRange()[1 - index], that._minRange, dir), -dir);
                    if (antiCompare(firstPosition, thresholdPosition)) {
                        values[1 - index] = translator.getRange()[1 - index];
                        values[index] = translator.add(values[1 - index], that._minRange, dir);
                        positions[1 - index] = firstPosition
                    }
                }
                values[0] = selectClosestValue(values[0], that._values);
                values[1] = selectClosestValue(values[1], that._values);
                positions[index] = translator.to(values[index], dir);
                sliders[0].setDisplayValue(values[0]);
                sliders[1].setDisplayValue(values[1]);
                sliders[0]._position = positions[0];
                sliders[1]._position = positions[1];
                that._applyTotalPosition(true);
                if (that._isOnMoving)
                    that._processSelectionChanged();
                handler = that.beginSliderMoving(1 - index, secondPosition);
                sliders[1 - index]._sliderGroup.stopAnimation();
                that._shutter.stopAnimation();
                handler(secondPosition);
                return handler
            },
            beginSliderMoving: function(initialIndex, initialPosition) {
                var that = this,
                    translator = that._params.translator,
                    sliders = that._sliders,
                    minPosition = translator.getScreenRange()[0],
                    maxPosition = translator.getScreenRange()[1],
                    index = initialIndex,
                    staticPosition = sliders[1 - index].getPosition(),
                    currentPosition = initialPosition,
                    dir = index > 0 ? +1 : -1,
                    compareMin = index > 0 ? isLess : isGreater,
                    compareMax = index > 0 ? isGreater : isLess,
                    moveOffset = sliders[index].getPosition() - initialPosition,
                    swapOffset = compareMin(sliders[index].getPosition(), initialPosition) ? -moveOffset : moveOffset;
                move.complete = function() {
                    sliders[index]._setValid(true);
                    that._dockSelectedArea()
                };
                return move;
                function move(position) {
                    var isValid,
                        temp,
                        pos,
                        slider,
                        value;
                    if (position !== currentPosition) {
                        if (compareMin(position + swapOffset, staticPosition)) {
                            isValid = that._allowSlidersSwap;
                            if (isValid && !translator.isValueProlonged && that._minRange)
                                isValid = translator.isValid(translator.add(sliders[1 - index].getValue(), that._minRange, -dir));
                            if (isValid) {
                                that._changeMovingSlider(index);
                                index = 1 - index;
                                dir = -dir;
                                temp = compareMin;
                                compareMin = compareMax;
                                compareMax = temp;
                                moveOffset = -dir * Math.abs(moveOffset);
                                swapOffset = -moveOffset
                            }
                        }
                        if (compareMax(position + moveOffset, staticPosition)) {
                            isValid = true;
                            slider = sliders[index];
                            value = sliders[1 - index].getValue();
                            pos = Math.max(Math.min(position + moveOffset, maxPosition), minPosition);
                            if (isValid && translator.isValueProlonged)
                                isValid = !compareMin(pos, translator.to(value, dir));
                            if (isValid && that._minRange)
                                isValid = !compareMin(pos, translator.to(translator.add(value, that._minRange, dir), dir));
                            if (isValid && that._maxRange)
                                isValid = !compareMax(pos, translator.to(translator.add(value, that._maxRange, dir), dir));
                            slider._setValid(isValid);
                            slider.setDisplayValue(isValid ? selectClosestValue(translator.from(pos, dir), that._values) : slider.getValue());
                            slider._position = pos;
                            that._applyTotalPosition(false);
                            slider.toForeground();
                            if (that._isOnMoving)
                                that._processSelectionChanged()
                        }
                    }
                    currentPosition = position
                }
            },
            _changeMovingSlider: function(index) {
                var that = this,
                    translator = that._params.translator,
                    sliders = that._sliders,
                    position = sliders[1 - index].getPosition(),
                    dir = index > 0 ? +1 : -1,
                    newValue;
                sliders[index].setDisplayValue(selectClosestValue(translator.from(position, dir), that._values));
                newValue = translator.from(position, -dir);
                if (translator.isValueProlonged)
                    newValue = translator.from(position, dir);
                else if (that._minRange)
                    newValue = translator.add(newValue, that._minRange, -dir);
                sliders[1 - index].setDisplayValue(selectClosestValue(newValue, that._values));
                sliders[index]._setValid(true);
                sliders[index]._marker._update();
                sliders[0]._position = sliders[1]._position = position
            },
            foregroundSlider: function(index) {
                this._sliders[index].toForeground()
            }
        };
        rangeSelector.SlidersController = SlidersController
    })(DevExpress, jQuery);
    /*! Module viz-rangeselector, file tracker.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            pointerEvents = DX.require("/ui/events/pointer/ui.events.pointer"),
            msPointerEnabled = DX.require("/utils/utils.support").pointer,
            MIN_MANUAL_SELECTING_WIDTH = 10;
        function isLeftButtonPressed(event) {
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
        }
        function isMultiTouches(event) {
            var originalEvent = event.originalEvent,
                touches = event.touches,
                eventTouches = originalEvent && originalEvent.touches;
            return touches && touches.length > 1 || eventTouches && eventTouches.length > 1 || null
        }
        function preventDefault(e) {
            if (!isMultiTouches(e))
                e.preventDefault()
        }
        function stopPropagationAndPreventDefault(e) {
            if (!isMultiTouches(e)) {
                e.stopPropagation();
                e.preventDefault()
            }
        }
        function isTouchEventArgs(e) {
            return e && e.type && e.type.indexOf("touch") === 0
        }
        function getEventPageX(event) {
            var originalEvent = event.originalEvent,
                result = 0;
            if (event.pageX)
                result = event.pageX;
            else if (originalEvent && originalEvent.pageX)
                result = originalEvent.pageX;
            if (originalEvent && originalEvent.touches)
                if (originalEvent.touches.length > 0)
                    result = originalEvent.touches[0].pageX;
                else if (originalEvent.changedTouches.length > 0)
                    result = originalEvent.changedTouches[0].pageX;
            return result
        }
        function initializeAreaEvents(controller, area, state, getRootOffsetLeft) {
            var isTouchEvent,
                isActive = false,
                initialPosition,
                movingHandler = null,
                docEvents = {};
            docEvents[pointerEvents.move] = function(e) {
                var position,
                    offset;
                if (isTouchEvent !== isTouchEventArgs(e))
                    return;
                if (!isLeftButtonPressed(e))
                    cancel();
                if (isActive) {
                    position = getEventPageX(e);
                    offset = getRootOffsetLeft();
                    if (movingHandler)
                        movingHandler(position - offset);
                    else if (state.manualRangeSelectionEnabled && Math.abs(initialPosition - position) >= MIN_MANUAL_SELECTING_WIDTH)
                        movingHandler = controller.placeSliderAndBeginMoving(initialPosition - offset, position - offset)
                }
            };
            docEvents[pointerEvents.up] = function(e) {
                var position;
                if (isActive) {
                    position = getEventPageX(e);
                    if (!movingHandler && state.moveSelectedRangeByClick && Math.abs(initialPosition - position) < MIN_MANUAL_SELECTING_WIDTH)
                        controller.moveSelectedArea(position - getRootOffsetLeft());
                    cancel()
                }
            };
            function cancel() {
                if (isActive) {
                    isActive = false;
                    if (movingHandler) {
                        movingHandler.complete();
                        movingHandler = null
                    }
                }
            }
            area.on(pointerEvents.down, function(e) {
                if (!state.enabled || !isLeftButtonPressed(e) || isActive)
                    return;
                isActive = true;
                isTouchEvent = isTouchEventArgs(e);
                initialPosition = getEventPageX(e)
            });
            return docEvents
        }
        function initializeSelectedAreaEvents(controller, area, state, getRootOffsetLeft) {
            var isTouchEvent,
                isActive = false,
                movingHandler = null,
                docEvents = {};
            docEvents[pointerEvents.move] = function(e) {
                if (isTouchEvent !== isTouchEventArgs(e))
                    return;
                if (!isLeftButtonPressed(e))
                    cancel();
                if (isActive) {
                    preventDefault(e);
                    movingHandler(getEventPageX(e) - getRootOffsetLeft())
                }
            };
            docEvents[pointerEvents.up] = cancel;
            function cancel() {
                if (isActive) {
                    isActive = false;
                    movingHandler.complete();
                    movingHandler = null
                }
            }
            area.on(pointerEvents.down, function(e) {
                if (!state.enabled || !isLeftButtonPressed(e) || isActive)
                    return;
                isActive = true;
                isTouchEvent = isTouchEventArgs(e);
                movingHandler = controller.beginSelectedAreaMoving(getEventPageX(e) - getRootOffsetLeft());
                stopPropagationAndPreventDefault(e)
            });
            return docEvents
        }
        function initializeSliderEvents(controller, sliders, state, getRootOffsetLeft) {
            var isTouchEvent,
                isActive = false,
                movingHandler = null,
                docEvents = {};
            docEvents[pointerEvents.move] = function(e) {
                if (isTouchEvent !== isTouchEventArgs(e))
                    return;
                if (!isLeftButtonPressed(e))
                    cancel();
                if (isActive) {
                    preventDefault(e);
                    movingHandler(getEventPageX(e) - getRootOffsetLeft())
                }
            };
            docEvents[pointerEvents.up] = cancel;
            $.each(sliders, function(i, slider) {
                var events = {};
                events[pointerEvents.down] = function(e) {
                    if (!state.enabled || !isLeftButtonPressed(e) || isActive)
                        return;
                    isActive = true;
                    isTouchEvent = isTouchEventArgs(e);
                    movingHandler = controller.beginSliderMoving(i, getEventPageX(e) - getRootOffsetLeft());
                    stopPropagationAndPreventDefault(e)
                };
                events[pointerEvents.move] = function() {
                    if (!movingHandler)
                        controller.foregroundSlider(i)
                };
                slider.on(events)
            });
            function cancel() {
                if (isActive) {
                    isActive = false;
                    movingHandler.complete();
                    movingHandler = null
                }
            }
            return docEvents
        }
        function Tracker(params) {
            var state = this._state = {},
                targets = params.controller.getTrackerTargets();
            if (msPointerEnabled)
                params.renderer.root.css({msTouchAction: "pinch-zoom"});
            this._docEvents = [initializeSelectedAreaEvents(params.controller, targets.selectedArea, state, getRootOffsetLeft), initializeAreaEvents(params.controller, targets.area, state, getRootOffsetLeft), initializeSliderEvents(params.controller, targets.sliders, state, getRootOffsetLeft)];
            $.each(this._docEvents, function(_, events) {
                $(document).on(events)
            });
            function getRootOffsetLeft() {
                return params.renderer.getRootOffset().left
            }
        }
        Tracker.prototype = {
            constructor: Tracker,
            dispose: function() {
                $.each(this._docEvents, function(_, events) {
                    $(document).off(events)
                })
            },
            update: function(enabled, behavior) {
                var state = this._state;
                state.enabled = enabled;
                state.moveSelectedRangeByClick = behavior.moveSelectedRangeByClick;
                state.manualRangeSelectionEnabled = behavior.manualRangeSelectionEnabled
            }
        };
        rangeSelector.Tracker = Tracker
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file slider.js */
    (function(DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            rangeSelectorUtils = rangeSelector.utils,
            support = DX.require("/utils/utils.support"),
            SPLITTER_WIDTH = 8,
            TOUCH_SPLITTER_WIDTH = 20;
        function getSliderTrackerWidth(sliderHandleWidth) {
            return support.touchEvents || support.pointer ? TOUCH_SPLITTER_WIDTH : SPLITTER_WIDTH < sliderHandleWidth ? sliderHandleWidth : SPLITTER_WIDTH
        }
        function Slider(params, index) {
            var that = this;
            that._translator = params.translator;
            that._sliderGroup = params.renderer.g().attr({"class": "slider"}).append(params.root);
            that._line = params.renderer.path(null, "line").append(that._sliderGroup);
            that._marker = new rangeSelector.SliderMarker(params.renderer, that._sliderGroup, index === 1);
            that._tracker = params.renderer.rect().attr({
                "class": "slider-tracker",
                fill: "#000000",
                opacity: 0.0001
            }).css({cursor: "w-resize"}).append(params.trackersGroup)
        }
        Slider.prototype = {
            constructor: Slider,
            cancelAnimation: function() {
                this._sliderGroup.stopAnimation();
                this._tracker.stopAnimation()
            },
            applyPosition: function(isAnimated) {
                var that = this,
                    slider = that._sliderGroup,
                    tracker = that._tracker,
                    attrs = {translateX: that._position};
                that._marker.setPosition(that._position);
                if (isAnimated) {
                    slider.animate(attrs, rangeSelectorUtils.animationSettings);
                    tracker.animate(attrs, rangeSelectorUtils.animationSettings)
                }
                else {
                    slider.attr(attrs);
                    tracker.attr(attrs)
                }
            },
            _setValid: function(isValid) {
                this._marker.setValid(isValid);
                this._line.attr({stroke: this._colors[Number(isValid)]})
            },
            _setText: function(text) {
                this._marker.setText(text)
            },
            update: function(verticalRange, sliderHandleOptions, sliderMarkerOptions) {
                var that = this;
                that._formatOptions = {
                    format: sliderMarkerOptions.format,
                    precision: sliderMarkerOptions.precision,
                    customizeText: sliderMarkerOptions.customizeText
                };
                that._marker.applyOptions(sliderMarkerOptions, that._translator.getScreenRange());
                that._colors = [sliderMarkerOptions.invalidRangeColor, sliderHandleOptions.color];
                that._sliderGroup.attr({translateY: verticalRange[0]});
                that._line.attr({
                    "stroke-width": sliderHandleOptions.width,
                    stroke: sliderHandleOptions.color,
                    "stroke-opacity": sliderHandleOptions.opacity,
                    sharp: "h",
                    points: [0, 0, 0, verticalRange[1] - verticalRange[0]]
                });
                var trackerWidth = getSliderTrackerWidth(sliderHandleOptions.width);
                that._tracker.attr({
                    x: -trackerWidth / 2,
                    y: 0,
                    width: trackerWidth,
                    height: verticalRange[1] - verticalRange[0],
                    translateY: verticalRange[0]
                })
            },
            toForeground: function() {
                this._sliderGroup.toForeground()
            },
            getSliderTracker: function() {
                return this._tracker
            },
            getPosition: function() {
                return this._position
            },
            setDisplayValue: function(value) {
                this._value = value;
                this._setText(rangeSelector.formatValue(value, this._formatOptions))
            },
            setOverlapped: function(isOverlapped) {
                this._marker.setOverlapped(isOverlapped)
            },
            getValue: function() {
                return this._value
            },
            on: function(event, handler) {
                this._tracker.on(event, handler);
                this._marker.getTracker().on(event, handler)
            },
            getCloudBorder: function() {
                return this._marker.getBorderPosition()
            },
            dispose: function() {
                this._marker.dispose()
            }
        };
        rangeSelector.Slider = Slider
    })(DevExpress);
    /*! Module viz-rangeselector, file sliderMarker.js */
    (function(DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            patchFontOptions = DX.viz.utils.patchFontOptions,
            SLIDER_MARKER_UPDATE_DELAY = 75,
            POINTER_SIZE = rangeSelector.consts.pointerSize;
        function SliderMarker(renderer, root, isLeftPointer) {
            var that = this;
            that._isLeftPointer = isLeftPointer;
            that._isOverlapped = false;
            that._group = renderer.g().attr({"class": "slider-marker"}).append(root);
            that._area = renderer.path(null, "area").append(that._group);
            that._label = renderer.text().attr({align: "left"}).append(that._group);
            that._tracker = renderer.rect().attr({
                "class": "slider-marker-tracker",
                fill: "#000000",
                opacity: 0.0001
            }).css({cursor: "pointer"}).append(that._group);
            that._border = renderer.rect(0, 0, 1, 0)
        }
        SliderMarker.prototype = {
            constructor: SliderMarker,
            _getRectSize: function(textSize) {
                return {
                        width: Math.round(2 * this._paddingLeftRight + textSize.width),
                        height: Math.round(2 * this._paddingTopBottom + textSize.height)
                    }
            },
            _getTextSize: function() {
                var textSize = this._label.getBBox();
                if (!this._textHeight && isFinite(textSize.height))
                    this._textHeight = textSize.height;
                return {
                        width: textSize.width,
                        height: this._textHeight,
                        y: textSize.y
                    }
            },
            _getAreaPointsInfo: function(textSize) {
                var that = this,
                    rectSize = that._getRectSize(textSize),
                    rectWidth = rectSize.width,
                    rectHeight = rectSize.height,
                    rectLeftBorder = -rectWidth,
                    rectRightBorder = 0,
                    pointerRightPoint = POINTER_SIZE,
                    pointerCenterPoint = 0,
                    pointerLeftPoint = -POINTER_SIZE,
                    position = that._position,
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
                    if (position > that._range[1] - rectWidth) {
                        rectRightBorder = -position + that._range[1];
                        rectLeftBorder = rectRightBorder - rectWidth;
                        checkPointerBorders();
                        borderPosition += rectLeftBorder
                    }
                    else {
                        rectLeftBorder = pointerLeftPoint = 0;
                        rectRightBorder = rectWidth
                    }
                else if (position - that._range[0] < rectWidth) {
                    rectLeftBorder = -(position - that._range[0]);
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
            },
            _update: function() {
                var that = this,
                    textSize,
                    currentTextSize,
                    rectSize;
                clearTimeout(that._timeout);
                that._label.attr({text: that._text || ""});
                currentTextSize = that._getTextSize();
                rectSize = that._getRectSize(currentTextSize);
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
                    rectSize = rectSize || that._getRectSize(size);
                    that._group.attr({translateY: -(rectSize.height + POINTER_SIZE)});
                    pointsData = that._getAreaPointsInfo(size);
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
                        translateX: that._paddingLeftRight + offset,
                        translateY: rectSize.height / 2 - (size.y + size.height / 2)
                    })
                }
                updateSliderMarker(textSize)
            },
            setText: function(value) {
                this._text = value
            },
            setPosition: function(position) {
                this._position = position;
                this._update()
            },
            applyOptions: function(options, screenRange) {
                var that = this;
                that._range = screenRange;
                that._paddingLeftRight = options.paddingLeftRight;
                that._paddingTopBottom = options.paddingTopBottom;
                that._textHeight = null;
                that._colors = [options.invalidRangeColor, options.color];
                that._area.attr({fill: options.color});
                that._border.attr({fill: options.borderColor});
                that._label.css(patchFontOptions(options.font));
                that._update()
            },
            getTracker: function() {
                return this._tracker
            },
            setValid: function(isValid) {
                this._area.attr({fill: this._colors[Number(isValid)]})
            },
            setColor: function(color) {
                this._area.attr({fill: color})
            },
            dispose: function() {
                clearTimeout(this._timeout)
            },
            setOverlapped: function(isOverlapped) {
                var that = this;
                if (that._isOverlapped !== isOverlapped) {
                    if (isOverlapped)
                        that._border.append(that._group);
                    else
                        that._isOverlapped && that._border.remove();
                    that._isOverlapped = isOverlapped
                }
            },
            getBorderPosition: function() {
                return this._borderPosition
            }
        };
        rangeSelector.SliderMarker = SliderMarker
    })(DevExpress);
    /*! Module viz-rangeselector, file rangeView.js */
    (function(DX, undefined) {
        function createTranslator(valueRange, screenRange) {
            return new DX.viz.Translator2D(valueRange, {
                    top: screenRange[0],
                    height: screenRange[1]
                })
        }
        function drawSeriesView(root, seriesDataSource, translator, screenRange, isAnimationEnabled) {
            var seriesList = seriesDataSource.getSeries(),
                series,
                i,
                ii = seriesList.length,
                translators = {
                    x: translator,
                    y: createTranslator(seriesDataSource.getBoundRange().val, screenRange)
                };
            seriesDataSource.adjustSeriesDimensions(translators);
            for (i = 0; i < ii; ++i) {
                series = seriesList[i];
                series._extGroups.seriesGroup = series._extGroups.labelsGroup = root;
                series.draw(translators, isAnimationEnabled)
            }
        }
        function merge(a, b) {
            return a !== undefined ? a : b
        }
        function RangeView(params) {
            this._params = params;
            this._clipRect = params.renderer.clipRect();
            params.root.attr({clipId: this._clipRect.id})
        }
        RangeView.prototype = {
            constructor: RangeView,
            update: function(backgroundOption, backgroundTheme, canvas, isCompactMode, isAnimationEnabled, seriesDataSource) {
                var renderer = this._params.renderer,
                    root = this._params.root;
                backgroundOption = backgroundOption || {};
                root.clear();
                this._clipRect.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: canvas.width,
                    height: canvas.height
                });
                if (!isCompactMode) {
                    if (merge(backgroundOption.visible, backgroundTheme.visible)) {
                        if (backgroundOption.color)
                            renderer.rect(canvas.left, canvas.top, canvas.width + 1, canvas.height).attr({
                                fill: merge(backgroundOption.color, backgroundTheme.color),
                                "class": "dx-range-selector-background"
                            }).append(root);
                        if (backgroundOption.image && backgroundOption.image.url)
                            renderer.image(canvas.left, canvas.top, canvas.width + 1, canvas.height, backgroundOption.image.url, merge(backgroundOption.image.location, backgroundTheme.image.location)).append(root)
                    }
                    if (seriesDataSource && seriesDataSource.isShowChart())
                        drawSeriesView(root, seriesDataSource, this._params.translator, [canvas.top, canvas.top + canvas.height], isAnimationEnabled)
                }
            }
        };
        DX.viz.rangeSelector.RangeView = RangeView
    })(DevExpress);
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
        var processSeriesFamilies = function(series, equalBarWidth, minBubbleSize, maxBubbleSize, barWidth, negativesAsZeroes) {
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
                            barWidth: barWidth,
                            negativesAsZeroes: negativesAsZeroes
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
                bottomIndent,
                negativesAsZeroes,
                negativesAsZeros;
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
            that._useAggregation = options.chart.useAggregation;
            that._series = that._calculateSeries(options, templatedSeries);
            negativesAsZeroes = themeManager.getOptions("negativesAsZeroes");
            negativesAsZeros = themeManager.getOptions("negativesAsZeros");
            that._seriesFamilies = processSeriesFamilies(that._series, themeManager.getOptions('equalBarWidth'), themeManager.getOptions('minBubbleSize'), themeManager.getOptions('maxBubbleSize'), themeManager.getOptions('barWidth'), commonUtils.isDefined(negativesAsZeroes) ? negativesAsZeroes : negativesAsZeros)
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
                    newSeries;
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
                if (series.length) {
                    parsedData = viz.validateData(data, groupSeries, options.incidentOccured, chartThemeManager.getOptions("dataPrepareSettings"));
                    for (i = 0; i < series.length; i++)
                        series[i].updateData(parsedData)
                }
                return series
            },
            adjustSeriesDimensions: function(translators) {
                if (this._useAggregation)
                    $.each(this._series, function(_, s) {
                        s.resamplePoints(translators.x)
                    });
                $.each(this._seriesFamilies, function(_, family) {
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
            isEmpty: function() {
                var that = this;
                return that.getSeries().length === 0
            },
            isShowChart: function() {
                return !this._hideChart
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