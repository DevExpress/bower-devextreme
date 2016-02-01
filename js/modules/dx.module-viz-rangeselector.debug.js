/*! 
* DevExtreme (Range Selector)
* Version: 15.2.5
* Build date: Jan 27, 2016
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
        rangeSelector.consts = {
            emptySliderMarkerText: EMPTY_SLIDER_MARKER_TEXT,
            pointerSize: POINTER_SIZE
        };
        rangeSelector.HEIGHT_COMPACT_MODE = HEIGHT_COMPACT_MODE;
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
        function getSelectedRange(scaleOption, selectedRangeOption, incidentOccurred) {
            return selectedRangeOption ? {
                    startValue: processValue(selectedRangeOption, scaleOption, START_VALUE, incidentOccurred),
                    endValue: processValue(selectedRangeOption, scaleOption, END_VALUE, incidentOccurred)
                } : cloneSelectedRange(scaleOption)
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
            _invalidatingOptions: ["scale", "selectedRangeColor", "containerBackgroundColor", "sliderMarker", "sliderHandle", "shutter", OPTION_BACKGROUND, "behavior", "chart", "indent"],
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
                that._updateSelectedRangeCallback = function(selectedRange) {
                    that.option(SELECTED_RANGE, selectedRange);
                    that._eventTrigger(SELECTED_RANGE_CHANGED, cloneSelectedRange(selectedRange))
                };
                that._clipRect = renderer.clipRect();
                that._viewClipRect = renderer.clipRect();
                rangeViewGroup = renderer.g().attr({
                    "class": "dxrs-view",
                    clipId: that._viewClipRect.id
                }).append(root);
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
                this._slidersController.dispose()
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
                    hasChart = seriesDataSource && seriesDataSource.isShowChart(),
                    isCompactMode = !(hasChart || that.option("background.image.url")),
                    scaleOptions = that._scaleOptions = prepareScaleOptions(that._getOption("scale"), seriesDataSource, that._incidentOccured),
                    argTranslatorRange = calculateTranslatorRange(seriesDataSource, scaleOptions),
                    min = _isDefined(argTranslatorRange.minVisible) ? argTranslatorRange.minVisible : argTranslatorRange.min,
                    max = _isDefined(argTranslatorRange.maxVisible) ? argTranslatorRange.maxVisible : argTranslatorRange.max,
                    tickIntervalsInfo = updateTickIntervals(scaleOptions, canvas.width, that._incidentOccured, argTranslatorRange.stick, min, max),
                    shutterOptions = that._getOption("shutter"),
                    sliderMarkerOptions,
                    selectedRange,
                    indents,
                    scaleLabelsAreaHeight,
                    rangeContainerCanvas,
                    chartThemeManager;
                if (hasChart) {
                    chartThemeManager = seriesDataSource.getThemeManager();
                    checkLogarithmicOptions(chartOptions && chartOptions.valueAxis, chartThemeManager.getOptions("valueAxis").logarithmBase, that._incidentOccured)
                }
                updateScaleOptions(scaleOptions, seriesDataSource, argTranslatorRange, tickIntervalsInfo);
                updateTranslatorRangeInterval(argTranslatorRange, scaleOptions);
                sliderMarkerOptions = that._prepareSliderMarkersOptions(canvas.width, tickIntervalsInfo);
                selectedRange = getSelectedRange(scaleOptions, that.option(SELECTED_RANGE), that._incidentOccured);
                indents = calculateIndents(that._renderer, scaleOptions, sliderMarkerOptions, that.option("indent"));
                scaleLabelsAreaHeight = calculateScaleAreaHeight(that._renderer, scaleOptions, showScaleMarkers(scaleOptions));
                rangeContainerCanvas = {
                    left: canvas.left + indents.left,
                    top: canvas.top + indents.top,
                    width: _max(canvas.width - indents.left - indents.right, 1),
                    height: _max(!isCompactMode ? canvas.height - indents.top - indents.bottom - scaleLabelsAreaHeight : HEIGHT_COMPACT_MODE, 0)
                };
                updateTranslator(that._translator, argTranslatorRange, [rangeContainerCanvas.left, rangeContainerCanvas.left + rangeContainerCanvas.width]);
                that._TESTS_selectedRange = selectedRange;
                shutterOptions.color = shutterOptions.color || that._getOption(CONTAINER_BACKGROUND_COLOR, true);
                scaleOptions.minorTickInterval = scaleOptions.isEmpty ? 0 : scaleOptions.minorTickInterval;
                that._updateElements({
                    isCompactMode: isCompactMode,
                    selectedRange: selectedRange,
                    scale: scaleOptions,
                    behavior: that._getOption("behavior"),
                    chart: chartOptions,
                    sliderMarker: sliderMarkerOptions,
                    sliderHandle: that._getOption("sliderHandle"),
                    shutter: shutterOptions,
                    selectedRangeColor: that._getOption("selectedRangeColor", true)
                }, rangeContainerCanvas, seriesDataSource);
                if (hasChart)
                    chartThemeManager.dispose()
            },
            _updateElements: function(options, canvas, seriesDataSource) {
                var that = this;
                that._viewClipRect.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: canvas.width,
                    height: canvas.height
                });
                if (!options.isCompactMode)
                    that._rangeView.update(that.option("background"), that._themeManager.theme("background"), canvas, options.behavior.animationEnabled && that._renderer.animationEnabled(), seriesDataSource);
                that._axis.update(options.scale, options.isCompactMode, canvas);
                var range = that._translator.getBusinessRange();
                that._isUpdating = true;
                that._slidersController.update(canvas, options.behavior, options.scale.type, options.scale.isEmpty, options.isCompactMode, options.selectedRange, options.sliderHandle, options.sliderMarker, options.shutter, {
                    startValue: range.invert ? range.maxVisible : range.minVisible,
                    endValue: range.invert ? range.minVisible : range.maxVisible,
                    inverted: range.invert,
                    minRange: options.scale.minRange,
                    maxRange: options.scale.maxRange,
                    type: options.scale.type,
                    categories: range.categories,
                    _categoriesInfo: {categories: options.scale._categoriesInfo && options.scale._categoriesInfo.categories}
                }, that._axis.getFullTicks(), options.selectedRangeColor, options.scale.logarithmBase);
                that._isUpdating = false
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
                this.setSelectedRange(cloneSelectedRange(this._scaleOptions))
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
        DX.viz.rangeSelector.utils = {
            findLessOrEqualValue: findLessOrEqualValue,
            findNearValue: findNearValue,
            findGreaterOrEqualValue: findGreaterOrEqualValue,
            truncateSelectedRange: truncateSelectedRange,
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
    /*! Module viz-rangeselector, file slidersController.js */
    (function(DX, $, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            _normalizeEnum = DX.viz.utils.normalizeEnum,
            _truncateSelectedRange = rangeSelector.utils.truncateSelectedRange,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1,
            DISCRETE = "discrete";
        function valueOf(value) {
            return value && value.valueOf()
        }
        function validateValue(value, scaleValue, fallback) {
            return value === undefined || $.type(value) === $.type(scaleValue) ? value : fallback
        }
        function dummyProcessSelectionChanged() {
            this._lastSelectedRange = this.getSelectedRange();
            delete this._processSelectionChanged
        }
        function SlidersController(params) {
            var that = this,
                sliders = that._sliders = [],
                sliderParams = {
                    renderer: params.renderer,
                    root: params.root,
                    trackersGroup: params.trackersGroup,
                    translator: params.translator
                };
            that._params = params;
            that._areaTracker = params.renderer.rect().attr(rangeSelector.utils.trackerSettings).append(params.trackersGroup);
            that._selectedAreaTracker = params.renderer.rect().attr(rangeSelector.utils.trackerSettings).css({cursor: 'pointer'}).append(params.trackersGroup);
            sliders[0] = new rangeSelector.Slider(sliderParams, START_VALUE_INDEX);
            sliders[1] = new rangeSelector.Slider(sliderParams, END_VALUE_INDEX);
            sliders[START_VALUE_INDEX].setAnotherSlider(sliders[END_VALUE_INDEX]);
            sliders[END_VALUE_INDEX].setAnotherSlider(sliders[START_VALUE_INDEX]);
            that._processSelectionChanged = dummyProcessSelectionChanged;
            that._eventsManager = new rangeSelector.SlidersEventsManager(params.renderer, that)
        }
        SlidersController.prototype = {
            constructor: SlidersController,
            _processSelectionChanged: function() {
                var that = this,
                    selectedRange = that.getSelectedRange();
                if (valueOf(selectedRange.startValue) !== valueOf(that._lastSelectedRange.startValue) || valueOf(selectedRange.endValue) !== valueOf(that._lastSelectedRange.endValue)) {
                    that._lastSelectedRange = selectedRange;
                    that._params.updateSelectedRange(selectedRange)
                }
            },
            _callMethodForBothSliders: function(methodName, params) {
                this._sliders[START_VALUE_INDEX][methodName](params);
                this._sliders[END_VALUE_INDEX][methodName](params)
            },
            _applySelectedRangePosition: function(disableAnimation) {
                var that = this,
                    center = that._canvas.top + that._canvas.height / 2,
                    isAnimation = that._animationEnabled && !disableAnimation,
                    startSliderPos = that._sliders[START_VALUE_INDEX].getPosition(),
                    points = [startSliderPos, center, startSliderPos + that.getSelectedRangeInterval(), center],
                    selectedView = that._selectedView;
                if (!selectedView || !that._isCompactMode)
                    return;
                if (isAnimation)
                    selectedView.animate({points: points}, rangeSelector.utils.animationSettings);
                else
                    selectedView.stopAnimation().attr({points: points})
            },
            update: function(canvas, behavior, type, isEmpty, isCompactMode, selectedRange, sliderHandleOptions, sliderMarkerOptions, shutterOptions, rangeData, fullTicks, selectedRangeColor, logarithmBase) {
                var that = this,
                    values = null;
                that._canvas = canvas;
                that._isDiscrete = type === DISCRETE;
                that._isCompactMode = isCompactMode;
                that._animationEnabled = behavior.animationEnabled;
                that._rangeData = rangeData;
                that._selectedRangeOption = selectedRange;
                that._foregroundSliderIndex = END_VALUE_INDEX;
                that._sliders[0].update(canvas, behavior, that._isDiscrete, sliderHandleOptions, sliderMarkerOptions, shutterOptions, rangeData, {
                    type: type,
                    logarithmBase: logarithmBase
                });
                that._sliders[1].update(canvas, behavior, that._isDiscrete, sliderHandleOptions, sliderMarkerOptions, shutterOptions, rangeData, {
                    type: type,
                    logarithmBase: logarithmBase
                });
                if (behavior.snapToTicks && !that._isDiscrete) {
                    values = fullTicks;
                    values[0] > values[values.length - 1] && values.reverse()
                }
                that._callMethodForBothSliders("setAvailableValues", values);
                that._areaTracker.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: canvas.width,
                    height: canvas.height
                });
                that._eventsManager.update({
                    enabled: !isEmpty,
                    moveSelectedRangeByClick: behavior.moveSelectedRangeByClick,
                    manualRangeSelectionEnabled: behavior.manualRangeSelectionEnabled
                });
                if (!isEmpty)
                    that._updateSelectedView(canvas, isCompactMode, selectedRangeColor);
                that._isOnMoving = _normalizeEnum(behavior.callSelectedRangeChanged) === "onmoving";
                that.setSelectedRange(isEmpty ? {} : selectedRange)
            },
            _updateSelectedView: function(canvas, isCompactMode, selectedRangeColor) {
                var that = this,
                    lineOptions = {
                        "stroke-width": 3,
                        stroke: selectedRangeColor,
                        sharp: "v"
                    },
                    center = canvas.top + canvas.height / 2,
                    selectedView = that._selectedView,
                    selectedViewAppended = that._selectedViewAppended;
                if (!isCompactMode) {
                    if (selectedView && selectedViewAppended) {
                        selectedView.remove();
                        that._selectedViewAppended = false
                    }
                    that._appendShutters()
                }
                else {
                    if (!selectedView) {
                        that._selectedView = selectedView = that._params.renderer.path([canvas.left, center, canvas.left, center], "line").attr(lineOptions);
                        that._selectedView = selectedView
                    }
                    else
                        selectedView.attr(lineOptions);
                    if (!selectedViewAppended) {
                        selectedView.append(that._params.root);
                        that._removeShutters();
                        that._selectedViewAppended = true
                    }
                }
            },
            _processDocking: function() {
                this._callMethodForBothSliders("processDocking");
                this._setTrackersCursorStyle("default");
                this._applyAreaTrackersPosition();
                this._applySelectedRangePosition()
            },
            processDocking: function() {
                this._processDocking();
                this._processSelectionChanged()
            },
            getSelectedRangeInterval: function() {
                return this._sliders[END_VALUE_INDEX].getPosition() - this._sliders[START_VALUE_INDEX].getPosition()
            },
            moveSliders: function(postitionDelta, selectedRangeInterval) {
                var startSlider = this._sliders[START_VALUE_INDEX];
                startSlider.setPosition(startSlider.getPosition() + postitionDelta, false, selectedRangeInterval);
                this._applyPosition(true);
                if (this._isOnMoving)
                    this._processSelectionChanged()
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
                            that._swapSliders();
                            anotherSlider.applyPosition(true)
                        }
                    }
                slider.setPosition(position, true);
                slider.applyPosition(true);
                that._applyAreaTrackersPosition();
                that._applySelectedRangePosition(true);
                that._setTrackersCursorStyle("w-resize");
                if (that._isOnMoving)
                    that._processSelectionChanged()
            },
            applySelectedAreaCenterPosition: function(position) {
                var that = this,
                    startSlider = that._sliders[START_VALUE_INDEX],
                    selectedRangeInterval = that.getSelectedRangeInterval(),
                    slidersContainerHalfWidth = selectedRangeInterval / 2;
                startSlider.setPosition(position - slidersContainerHalfWidth, false, selectedRangeInterval);
                that._applyPosition(false);
                that._processDocking()
            },
            endSelection: function(isWithNotification) {
                var that = this,
                    startSlider = that._sliders[START_VALUE_INDEX],
                    endSlider = that._sliders[END_VALUE_INDEX],
                    overlappedState = startSlider.getCloudBorder() > endSlider.getCloudBorder();
                that._callMethodForBothSliders("setOverlapped", overlappedState);
                if (isWithNotification)
                    that._processSelectionChanged()
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
                movingSlider.applyPosition(true);
                if (this._isOnMoving)
                    this._processSelectionChanged()
            },
            setSelectedRange: function(range) {
                var rangeData = this._rangeData;
                this._applySelectedRange({
                    startValue: _truncateSelectedRange(validateValue(range.startValue, rangeData.startValue, this._selectedRangeOption.startValue), rangeData),
                    endValue: _truncateSelectedRange(validateValue(range.endValue, rangeData.endValue, this._selectedRangeOption.endValue), rangeData)
                })
            },
            _applySelectedRange: function(range) {
                var that = this,
                    inverted = that._rangeData.inverted,
                    startSlider = that._sliders[START_VALUE_INDEX],
                    endSlider = that._sliders[END_VALUE_INDEX],
                    startValue = range.startValue,
                    endValue = range.endValue,
                    categoriesInfo,
                    setValues = function(startValue, endValue, isInverted) {
                        (isInverted ? endSlider : startSlider).setValue(startValue);
                        (isInverted ? startSlider : endSlider).setValue(endValue)
                    };
                if (!that._isDiscrete)
                    setValues(startValue, endValue, !inverted && startValue > endValue || inverted && startValue < endValue);
                else {
                    categoriesInfo = DX.viz.utils.getCategoriesInfo(that._rangeData.categories, startValue, endValue);
                    setValues(categoriesInfo.start, categoriesInfo.end, categoriesInfo.inverted ^ inverted)
                }
                that._applyPosition(false || !that._params.renderer.animationEnabled());
                that._processSelectionChanged()
            },
            getSelectedRange: function() {
                return {
                        startValue: this._sliders[START_VALUE_INDEX].getValue(),
                        endValue: this._sliders[END_VALUE_INDEX].getValue()
                    }
            },
            _swapSliders: function() {
                this._sliders.reverse();
                this._callMethodForBothSliders("changeLocation")
            },
            _applyAreaTrackersPosition: function() {
                var that = this,
                    selectedRange = that.getSelectedRange(),
                    rangeData = that._rangeData,
                    startSliderPosition = that._sliders[START_VALUE_INDEX].getPosition();
                that._selectedAreaTracker.attr({
                    x: startSliderPosition,
                    width: Math.max(that._sliders[END_VALUE_INDEX].getPosition() - startSliderPosition, 0),
                    y: that._canvas.top,
                    height: that._canvas.height
                }).css({cursor: rangeData.endValue - rangeData.startValue === selectedRange.endValue - selectedRange.startValue ? "default" : "pointer"})
            },
            _applyPosition: function(disableAnimation) {
                var that = this;
                that._callMethodForBothSliders("applyPosition", disableAnimation);
                that._applyAreaTrackersPosition();
                that._applySelectedRangePosition(disableAnimation)
            },
            toForeground: function(slider) {
                var sliderIndex = slider.getIndex();
                if (this._foregroundSliderIndex !== sliderIndex) {
                    slider.toForeground();
                    this._foregroundSliderIndex = sliderIndex
                }
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
            _setTrackersCursorStyle: function(style) {
                style = {cursor: style};
                this._selectedAreaTracker.css(style);
                this._areaTracker.css(style)
            },
            _appendShutters: function() {
                this._callMethodForBothSliders("appendShutter")
            },
            _removeShutters: function() {
                this._callMethodForBothSliders("removeShutter")
            },
            dispose: function() {
                this._callMethodForBothSliders("dispose");
                this._eventsManager.dispose()
            }
        };
        rangeSelector.SlidersController = SlidersController
    })(DevExpress, jQuery);
    /*! Module viz-rangeselector, file slidersEventsManager.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            pointerEvents = DX.require("/ui/events/pointer/ui.events.pointer"),
            msPointerEnabled = DX.require("/utils/utils.support").pointer,
            MIN_MANUAL_SELECTING_WIDTH = 10,
            START_VALUE_INDEX = 0,
            END_VALUE_INDEX = 1;
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
                eventTouches = originalEvent ? originalEvent.touches : false;
            return touches && touches.length > 1 || eventTouches && eventTouches.length > 1 || null
        }
        function isTouchEventArgs(e) {
            return e && e.type && e.type.indexOf("touch") === 0
        }
        function getEventPageX(eventArgs) {
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
        }
        function SlidersEventsManager(renderer, controller) {
            var that = this;
            if (msPointerEnabled)
                renderer.root.css({msTouchAction: "pinch-zoom"});
            that._docEvents = [];
            that._initializeSelectedAreaEvents(controller);
            that._initializeAreaEvents(controller, getRootOffsetLeft);
            that._initializeSliderEvents(START_VALUE_INDEX, controller, getRootOffsetLeft);
            that._initializeSliderEvents(END_VALUE_INDEX, controller, getRootOffsetLeft);
            $.each(that._docEvents, function(_, events) {
                $(document).on(events)
            });
            function getRootOffsetLeft() {
                return renderer.getRootOffset().left
            }
        }
        SlidersEventsManager.prototype = {
            constructor: SlidersEventsManager,
            _initializeSliderEvents: function(sliderIndex, controller, getRootOffsetLeft) {
                var that = this,
                    isTouchEvent,
                    slider = controller.getSlider(sliderIndex),
                    fastSwap,
                    startOffsetPosition,
                    splitterMoving,
                    docEvents = {},
                    sliderEvents = {};
                docEvents[pointerEvents.move] = function(e) {
                    var pageX,
                        offsetPosition,
                        svgOffsetLeft = getRootOffsetLeft(),
                        position,
                        sliderIndex = slider.getIndex();
                    if (isTouchEvent !== isTouchEventArgs(e))
                        return;
                    if (!isLeftButtonPressed(e) && splitterMoving) {
                        splitterMoving = false;
                        controller.processDocking()
                    }
                    else if (splitterMoving) {
                        if (!isMultiTouches(e)) {
                            this.preventedDefault = true;
                            e.preventDefault()
                        }
                        pageX = getEventPageX(e);
                        position = pageX - startOffsetPosition - svgOffsetLeft;
                        offsetPosition = pageX - slider.getPosition() - svgOffsetLeft;
                        controller.moveSlider(sliderIndex, fastSwap, position, offsetPosition, startOffsetPosition, function(newStartOffsetPosition) {
                            startOffsetPosition = newStartOffsetPosition
                        })
                    }
                    controller.endSelection(false)
                };
                docEvents[pointerEvents.up] = function() {
                    if (splitterMoving) {
                        splitterMoving = false;
                        controller.endSelection(false);
                        controller.processDocking()
                    }
                };
                sliderEvents[pointerEvents.down] = function(e) {
                    if (!that._enabled || !isLeftButtonPressed(e) || splitterMoving)
                        return;
                    fastSwap = this === slider.getSliderTracker().element;
                    splitterMoving = true;
                    isTouchEvent = isTouchEventArgs(e);
                    startOffsetPosition = getEventPageX(e) - slider.getPosition() - getRootOffsetLeft();
                    if (!isMultiTouches(e)) {
                        this.preventedDefault = true;
                        e.stopPropagation();
                        e.preventDefault()
                    }
                };
                sliderEvents[pointerEvents.move] = function() {
                    controller.toForeground(slider)
                };
                slider.on(sliderEvents);
                that._docEvents.push(docEvents);
                slider.startEventHandler = sliderEvents[pointerEvents.down];
                slider.__moveEventHandler = docEvents[pointerEvents.move]
            },
            _initializeAreaEvents: function(controller, getRootOffsetLeft) {
                var that = this,
                    isTouchEvent,
                    unselectedAreaProcessing = false,
                    startPageX,
                    docEvents = {};
                docEvents[pointerEvents.move] = function(e) {
                    var pageX,
                        startPosition,
                        endPosition,
                        svgOffsetLeft = getRootOffsetLeft();
                    if (isTouchEvent !== isTouchEventArgs(e))
                        return;
                    if (unselectedAreaProcessing && !isLeftButtonPressed(e))
                        unselectedAreaProcessing = false;
                    if (unselectedAreaProcessing) {
                        pageX = getEventPageX(e);
                        if (that._manualRangeSelectionEnabled && Math.abs(startPageX - pageX) >= MIN_MANUAL_SELECTING_WIDTH) {
                            startPosition = startPageX - svgOffsetLeft;
                            endPosition = pageX - svgOffsetLeft;
                            controller.processManualSelection(startPosition, endPosition, e);
                            unselectedAreaProcessing = false
                        }
                    }
                };
                docEvents[pointerEvents.up] = function(e) {
                    var pageX;
                    if (unselectedAreaProcessing) {
                        pageX = getEventPageX(e);
                        if (that._moveSelectedRangeByClick && Math.abs(startPageX - pageX) < MIN_MANUAL_SELECTING_WIDTH)
                            controller.applySelectedAreaCenterPosition(pageX - getRootOffsetLeft());
                        unselectedAreaProcessing = false;
                        controller.endSelection(true)
                    }
                };
                controller.getAreaTracker().on(pointerEvents.down, function(e) {
                    if (!that._enabled || !isLeftButtonPressed(e) || unselectedAreaProcessing)
                        return;
                    unselectedAreaProcessing = true;
                    isTouchEvent = isTouchEventArgs(e);
                    startPageX = getEventPageX(e)
                });
                that._docEvents.push(docEvents);
                that.__areaMoveEventHandler = docEvents[pointerEvents.move]
            },
            _initializeSelectedAreaEvents: function(controller) {
                var that = this,
                    isTouchEvent,
                    selectedAreaMoving = false,
                    offsetStartPosition,
                    selectedRangeInterval,
                    docEvents = {};
                docEvents[pointerEvents.move] = function(e) {
                    var positionDelta,
                        pageX;
                    if (isTouchEvent !== isTouchEventArgs(e))
                        return;
                    if (selectedAreaMoving && !isLeftButtonPressed(e)) {
                        selectedAreaMoving = false;
                        controller.processDocking()
                    }
                    if (selectedAreaMoving) {
                        if (!isMultiTouches(e)) {
                            this.preventedDefault = true;
                            e.preventDefault()
                        }
                        pageX = getEventPageX(e);
                        positionDelta = pageX - controller.getSlider(START_VALUE_INDEX).getPosition() - offsetStartPosition;
                        controller.moveSliders(positionDelta, selectedRangeInterval)
                    }
                    controller.endSelection(false)
                };
                docEvents[pointerEvents.up] = function() {
                    if (selectedAreaMoving) {
                        selectedAreaMoving = false;
                        controller.processDocking()
                    }
                };
                controller.getSelectedAreaTracker().on(pointerEvents.down, function(e) {
                    if (!that._enabled || !isLeftButtonPressed(e) || selectedAreaMoving)
                        return;
                    selectedAreaMoving = true;
                    isTouchEvent = isTouchEventArgs(e);
                    offsetStartPosition = getEventPageX(e) - controller.getSlider(START_VALUE_INDEX).getPosition();
                    selectedRangeInterval = controller.getSelectedRangeInterval();
                    if (!isMultiTouches(e)) {
                        this.preventedDefault = true;
                        e.stopPropagation();
                        e.preventDefault()
                    }
                });
                that._docEvents.push(docEvents);
                that.__selectedAreaMoveEventHandler = docEvents[pointerEvents.move]
            },
            dispose: function() {
                $.each(this._docEvents, function(_, events) {
                    $(document).off(events)
                })
            },
            update: function(options) {
                this._enabled = options.enabled;
                this._moveSelectedRangeByClick = options.moveSelectedRangeByClick;
                this._manualRangeSelectionEnabled = options.manualRangeSelectionEnabled
            }
        };
        rangeSelector.SlidersEventsManager = SlidersEventsManager;
        SlidersEventsManager._TESTS_getEventPageX = getEventPageX
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
            addInterval = rangeSelectorUtils.addInterval;
        function checkItemsSpacing(firstSliderPosition, secondSliderPosition, distance) {
            return Math.abs(secondSliderPosition - firstSliderPosition) < distance
        }
        function createSlider(renderer, group) {
            var sliderGroup = renderer.g().attr({"class": "slider"}).append(group),
                sliderHandle = renderer.path([], "line").append(sliderGroup);
            sliderGroup.setColors = function(validColor, invalidColor) {
                sliderHandle._colors = [invalidColor, validColor]
            };
            sliderGroup.setValid = function(correct) {
                sliderHandle.attr({stroke: sliderHandle._colors[Number(!!correct)]})
            };
            sliderGroup.setCanvasHeight = function(height) {
                sliderHandle._height = height
            };
            sliderGroup.updateHeight = function() {
                sliderHandle.attr({points: [0, 0, 0, sliderHandle._height]})
            };
            sliderGroup.applyOptions = function(options) {
                sliderHandle.attr(options)
            };
            sliderGroup.__line = sliderHandle;
            return sliderGroup
        }
        function createSliderTracker(renderer, root) {
            var sliderTrackerGroup = renderer.g().attr({"class": "sliderTracker"}).append(root),
                sliderTracker = renderer.rect().attr(rangeSelectorUtils.trackerSettings).css({cursor: "w-resize"}).append(sliderTrackerGroup);
            sliderTrackerGroup.setHandleWidth = function(width) {
                var splitterWidth = SPLITTER_WIDTH < width ? width : SPLITTER_WIDTH,
                    sliderWidth = touchSupport || msPointerEnabled ? TOUCH_SPLITTER_WIDTH : splitterWidth;
                sliderTracker.attr({
                    x: -sliderWidth / 2,
                    y: 0,
                    width: sliderWidth,
                    height: sliderTracker._height
                })
            };
            sliderTrackerGroup.setCanvasHeight = function(height) {
                sliderTracker._height = height
            };
            sliderTrackerGroup.updateHeight = function() {
                sliderTracker.attr({height: sliderTracker._height})
            };
            return sliderTrackerGroup
        }
        function correctByAvailableValues(values, businessValue, skipCorrection) {
            return !skipCorrection && values ? rangeSelectorUtils.findNearValue(values, businessValue) : businessValue
        }
        function Slider(params, index) {
            var that = this,
                renderer = params.renderer;
            that._params = params;
            that._index = index;
            that._translator = params.translator;
            that._container = renderer.g().attr({"class": "sliderArea"}).append(params.root);
            that._slider = createSlider(renderer, that._container);
            that._marker = new rangeSelector.SliderMarker({
                renderer: renderer,
                root: that._slider,
                isLeftPointer: index === END_VALUE_INDEX
            });
            that._shutter = renderer.rect();
            that._sliderTracker = createSliderTracker(renderer, params.trackersGroup)
        }
        Slider.prototype = {
            constructor: Slider,
            _setPosition: function(position, correctByMinMaxRange) {
                var that = this,
                    correctedPosition = that._correctPosition(position),
                    value = that._translator.untranslate(correctedPosition, that._getValueDirection());
                that.setValue(value, correctByMinMaxRange, false);
                that._position = correctedPosition
            },
            _getValueDirection: function() {
                return this._isDiscrete ? this._index === START_VALUE_INDEX ? -1 : 1 : 0
            },
            _setPositionForBothSliders: function(startPosition, interval) {
                var that = this,
                    anotherSlider = that.getAnotherSlider(),
                    startValue,
                    endValue,
                    endPosition,
                    rangeData = that._rangeData,
                    canvas = that._canvas,
                    rightBorderCoords = canvas.left + canvas.width,
                    translator = that._translator,
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
                    endValue = rangeData.endValue;
                    endPosition = rightBorderCoords;
                    startValue = getNextValue(endValue, true, true);
                    startPosition = that._correctBounds(endPosition - interval)
                }
                else
                    endPosition = that._correctBounds(endPosition);
                if (that._values)
                    if (!rangeData.inverted ? startValue < that._values[0] : startValue > that._values[that._values.length - 1]) {
                        startValue = correctByAvailableValues(that._values, startValue, false);
                        endValue = getNextValue(startValue)
                    }
                    else {
                        endValue = correctByAvailableValues(that._values, endValue, false);
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
                    canvas = this._canvas;
                if (position < canvas.left)
                    correctedPosition = canvas.left;
                if (position > canvas.left + canvas.width)
                    correctedPosition = canvas.left + canvas.width;
                return correctedPosition
            },
            _correctValue: function(businessValue, correctByMinMaxRange, skipCorrection) {
                var that = this,
                    result = correctByAvailableValues(that._values, businessValue, skipCorrection);
                if (correctByMinMaxRange)
                    result = that._correctByMinMaxRange(result);
                if (!that._isDiscrete)
                    result = that._correctByMinRange(result);
                return result
            },
            _correctByMinMaxRange: function(businessValue) {
                var that = this,
                    result = businessValue,
                    rangeData = that._rangeData,
                    values = that._values,
                    sliderIndex = that._index,
                    anotherSlider = that.getAnotherSlider(),
                    anotherBusinessValue = anotherSlider.getValue(),
                    isValid = true,
                    minValue,
                    maxValue,
                    maxRange = rangeData.maxRange,
                    minRange = rangeData.minRange,
                    isNegative,
                    tmp;
                if (that._isDiscrete) {
                    if (checkItemsSpacing(that.getPosition(), anotherSlider.getPosition(), that._translator.getInterval())) {
                        isValid = false;
                        result = anotherBusinessValue
                    }
                }
                else {
                    isNegative = !rangeData.inverted && sliderIndex === START_VALUE_INDEX || rangeData.inverted && sliderIndex === END_VALUE_INDEX;
                    if (maxRange) {
                        tmp = addInterval(anotherBusinessValue, maxRange, isNegative, that._addIntervalOptions);
                        if (isNegative)
                            minValue = tmp;
                        else
                            maxValue = tmp
                    }
                    if (minRange) {
                        tmp = addInterval(anotherBusinessValue, minRange, isNegative, that._addIntervalOptions);
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
                    rangeData = that._rangeData,
                    startValue,
                    endValue,
                    minRange = rangeData.minRange,
                    result = businessValue;
                if (minRange)
                    if (that._index === END_VALUE_INDEX) {
                        startValue = addInterval(rangeData.startValue, minRange, rangeData.inverted, that._addIntervalOptions);
                        if (!rangeData.inverted && result < startValue || rangeData.inverted && result > startValue)
                            result = startValue
                    }
                    else {
                        endValue = addInterval(rangeData.endValue, minRange, !rangeData.inverted, that._addIntervalOptions);
                        if (!rangeData.inverted && result > endValue || rangeData.inverted && result < endValue)
                            result = endValue
                    }
                return result
            },
            _applySliderPosition: function(position, disableAnimation) {
                var that = this,
                    isAnimation = that._animationEnabled && !disableAnimation,
                    slider = that._slider,
                    sliderTracker = that._sliderTracker,
                    attrs = {
                        translateX: position,
                        translateY: that._canvas.top
                    },
                    animationSettings = rangeSelectorUtils.animationSettings;
                that._marker.setPosition(position);
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
                    isAnimation = that._animationEnabled && !disableAnimation,
                    sliderIndex = that._index,
                    canvas = that._canvas,
                    width;
                if (sliderIndex === START_VALUE_INDEX) {
                    width = position - canvas.left - Math.floor(that._halfSliderHandleWidth);
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
                        x: position + Math.ceil(that._halfSliderHandleWidth),
                        y: canvas.top,
                        width: canvas.left + canvas.width - position,
                        height: canvas.height
                    };
                if (isAnimation)
                    that._shutter.animate(shutterSettings, rangeSelectorUtils.animationSettings);
                else
                    that._shutter.stopAnimation().attr(shutterSettings)
            },
            _setValid: function(isValid) {
                this._marker.setValid(isValid);
                this._slider.setValid(isValid)
            },
            _setText: function(text) {
                this._marker.setText(text)
            },
            update: function(canvas, behavior, isDiscrete, sliderHandleOptions, sliderMarkerOptions, shutterOptions, rangeData, addIntervalOptions) {
                var that = this;
                that._canvas = canvas;
                that._isDiscrete = isDiscrete;
                that._rangeData = rangeData;
                that._formatOptions = {
                    format: sliderMarkerOptions.format,
                    precision: sliderMarkerOptions.precision,
                    customizeText: sliderMarkerOptions.customizeText
                };
                that._halfSliderHandleWidth = sliderHandleOptions.width / 2;
                that._allowSlidersSwap = behavior.allowSlidersSwap;
                that._animationEnabled = behavior.animationEnabled;
                that._addIntervalOptions = addIntervalOptions;
                that._lastPosition = null;
                that._marker.setCanvas(canvas);
                that._marker.applyOptions(sliderMarkerOptions);
                that._shutter.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: that._index === START_VALUE_INDEX ? 0 : canvas.width,
                    height: canvas.height,
                    fill: shutterOptions.color,
                    "fill-opacity": shutterOptions.opacity
                });
                that._slider.attr({
                    translateX: canvas.left,
                    translateY: canvas.top
                });
                that._slider.setCanvasHeight(canvas.height);
                that._slider.updateHeight();
                that._slider.setColors(sliderHandleOptions.color, sliderMarkerOptions.invalidRangeColor);
                that._slider.applyOptions({
                    "stroke-width": sliderHandleOptions.width,
                    stroke: sliderHandleOptions.color,
                    "stroke-opacity": sliderHandleOptions.opacity,
                    sharp: "h"
                });
                that._sliderTracker.attr({
                    translateX: 0,
                    translateY: canvas.top
                });
                that._sliderTracker.setCanvasHeight(canvas.height);
                that._sliderTracker.setHandleWidth(sliderHandleOptions.width)
            },
            toForeground: function() {
                this._container.toForeground()
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
            getSliderTracker: function() {
                return this._sliderTracker
            },
            changeLocation: function() {
                var that = this;
                that._marker.changeLocation();
                that._index = 1 - that._index;
                that._isDiscrete && that.setPosition(that._position);
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
                    canvas = that._canvas,
                    position,
                    text;
                if (value === undefined) {
                    that._value = undefined;
                    position = that._index === START_VALUE_INDEX ? canvas.left : canvas.left + canvas.width;
                    text = rangeSelector.consts.emptySliderMarkerText
                }
                else {
                    that._value = that._correctValue(value, correctByMinMaxRange, commonUtils.isDefined(skipCorrection) ? !!skipCorrection : true);
                    position = that._translator.translate(that._value, that._getValueDirection());
                    text = rangeSelector.formatValue(that._value, that._formatOptions)
                }
                that._setText(text);
                that._valuePosition = that._position = position
            },
            setOverlapped: function(isOverlapped) {
                this._marker.setOverlapped(isOverlapped)
            },
            getValue: function() {
                return this._value
            },
            canSwap: function() {
                var that = this,
                    rangeData = that._rangeData,
                    startValue,
                    endValue,
                    anotherSliderValue;
                if (that._allowSlidersSwap) {
                    if (rangeData.minRange) {
                        anotherSliderValue = that.getAnotherSlider().getValue();
                        if (that._index === START_VALUE_INDEX) {
                            endValue = addInterval(rangeData.endValue, rangeData.minRange, !rangeData.inverted, that._addIntervalOptions);
                            if (!rangeData.inverted && anotherSliderValue > endValue || rangeData.inverted && anotherSliderValue < endValue)
                                return false
                        }
                        else {
                            startValue = addInterval(rangeData.startValue, rangeData.minRange, rangeData.inverted, that._addIntervalOptions);
                            if (!rangeData.inverted && anotherSliderValue < startValue || rangeData.inverted && anotherSliderValue > startValue)
                                return false
                        }
                    }
                    return true
                }
                return false
            },
            processDocking: function() {
                this._position = this._valuePosition;
                this.applyPosition(false);
                this._setValid(true)
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
                this._sliderTracker.on(event, handler);
                this._marker.getTracker().on(event, handler)
            },
            appendShutter: function() {
                this._shutter.append(this._container)
            },
            removeShutter: function() {
                this._shutter.remove()
            },
            getCloudBorder: function() {
                return this._marker.getBorderPosition()
            },
            dispose: function() {
                this._marker.dispose()
            },
            getText: function() {
                return this._marker.getText()
            },
            getAvailableValues: function() {
                return this._values
            }
        };
        rangeSelector.Slider = Slider
    })(jQuery, DevExpress);
    /*! Module viz-rangeselector, file sliderMarker.js */
    (function($, DX, undefined) {
        var rangeSelector = DX.viz.rangeSelector,
            patchFontOptions = DX.viz.utils.patchFontOptions,
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
        function SliderMarker(params) {
            var that = this,
                renderer = params.renderer;
            that._isLeftPointer = params.isLeftPointer;
            that._isValid = true;
            that._isOverlapped = false;
            that._sliderMarkerGroup = renderer.g().attr({"class": "sliderMarker"}).append(params.root);
            that._area = renderer.path([], "area").append(that._sliderMarkerGroup);
            that._label = renderer.text().attr({align: "left"}).append(that._sliderMarkerGroup);
            that._tracker = renderer.rect().attr(rangeSelector.utils.trackerSettings).css({cursor: "pointer"}).append(that._sliderMarkerGroup);
            that._border = renderer.rect(0, 0, 1, 0)
        }
        SliderMarker.prototype = {
            constructor: SliderMarker,
            _update: function() {
                var that = this,
                    textSize,
                    options = that._options,
                    currentTextSize,
                    rectSize;
                clearTimeout(that._timeout);
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
                this._text = value
            },
            setPosition: function(position) {
                this._position = position;
                this._update()
            },
            changeLocation: function() {
                this._isLeftPointer = !this._isLeftPointer;
                this._update()
            },
            applyOptions: function(options) {
                var that = this;
                that._options = options;
                that._textHeight = null;
                that._area.attr({fill: options.color});
                that._border.attr({fill: options.borderColor});
                that._label.css(patchFontOptions(options.font));
                that._tracker.attr({
                    x: 0,
                    y: 0,
                    width: 2 * options.paddingLeftRight,
                    height: 2 * options.paddingTopBottom + POINTER_SIZE
                });
                that._update()
            },
            getTracker: function() {
                return this._tracker
            },
            setValid: function(isValid) {
                var options = this._options;
                if (this._isValid !== isValid) {
                    this._isValid = isValid;
                    this._area.attr({fill: isValid ? options.color : options.invalidRangeColor})
                }
            },
            dispose: function() {
                clearTimeout(this._timeout)
            },
            setOverlapped: function(isOverlapped) {
                var that = this;
                if (that._isOverlapped !== isOverlapped) {
                    if (isOverlapped)
                        that._border.append(that._sliderMarkerGroup);
                    else
                        that._isOverlapped && that._border.remove();
                    that._isOverlapped = isOverlapped
                }
            },
            getBorderPosition: function() {
                return this._borderPosition
            },
            setCanvas: function(canvas) {
                this._canvas = canvas
            }
        };
        rangeSelector.SliderMarker = SliderMarker;
        SliderMarker.prototype.updateDelay = SLIDER_MARKER_UPDATE_DELAY;
        SliderMarker.prototype.getText = function() {
            return this._text
        }
    })(jQuery, DevExpress);
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
            this._params = params
        }
        RangeView.prototype = {
            constructor: RangeView,
            update: function(backgroundOption, backgroundTheme, canvas, isAnimationEnabled, seriesDataSource) {
                var renderer = this._params.renderer,
                    root = this._params.root;
                backgroundOption = backgroundOption || {};
                root.clear();
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
            that._useAggregation = options.chart.useAggregation;
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