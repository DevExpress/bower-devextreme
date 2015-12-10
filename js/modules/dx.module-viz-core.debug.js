/*! 
* DevExtreme (Visualization Core Library)
* Version: 15.2.4
* Build date: Dec 8, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!window.DevExpress || !DevExpress.MOD_VIZ_CORE) {
    if (!window.DevExpress || !DevExpress.MOD_CORE)
        throw Error('Required module is not referenced: core');
    /*! Module viz-core, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz = {}
    })(DevExpress);
    /*! Module viz-core, file utils.js */
    (function(DX, $, undefined) {
        var commonUtils = DevExpress.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            log = DX.require("/errors").log,
            _mathUtils = DX.require("/utils/utils.math"),
            _inArray = $.inArray,
            _each = $.each,
            _math = Math,
            _round = _math.round,
            _extend = $.extend,
            core = DX.viz.core = {};
        function map(array, callback) {
            var i = 0,
                len = array.length,
                ret = [],
                value;
            while (i < len) {
                value = callback(array[i], i);
                if (value !== null)
                    ret.push(value);
                i++
            }
            return ret
        }
        function selectByKeys(object, keys) {
            return map(keys, function(key) {
                    return object[key] ? object[key] : null
                })
        }
        function decreaseFields(object, keys, eachDecrease, decrease) {
            var dec = decrease;
            _each(keys, function(_, key) {
                if (object[key]) {
                    object[key] -= eachDecrease;
                    dec -= eachDecrease
                }
            });
            return dec
        }
        function normalizeEnum(value) {
            return String(value).toLowerCase()
        }
        DX.viz.utils = {
            decreaseGaps: function(object, keys, decrease) {
                var arrayGaps;
                do {
                    arrayGaps = selectByKeys(object, keys);
                    arrayGaps.push(_math.ceil(decrease / arrayGaps.length));
                    decrease = decreaseFields(object, keys, _math.min.apply(null, arrayGaps), decrease)
                } while (decrease > 0 && arrayGaps.length > 1);
                return decrease
            },
            normalizeEnum: normalizeEnum,
            parseScalar: function(value, defaultValue) {
                return value !== undefined ? value : defaultValue
            },
            enumParser: function(values) {
                var stored = {},
                    i,
                    ii;
                for (i = 0, ii = values.length; i < ii; ++i)
                    stored[normalizeEnum(values[i])] = 1;
                return function(value, defaultValue) {
                        var _value = normalizeEnum(value);
                        return stored[_value] ? _value : defaultValue
                    }
            },
            patchFontOptions: function(options) {
                var fontOptions = {};
                _each(options || {}, function(key, value) {
                    if (/^(cursor|opacity)$/i.test(key));
                    else if (key === "color")
                        key = "fill";
                    else
                        key = "font-" + key;
                    fontOptions[key] = value
                });
                return fontOptions
            },
            convertPolarToXY: function(centerCoords, startAngle, angle, radius) {
                var shiftAngle = 90,
                    cossin;
                angle = _isDefined(angle) ? angle + startAngle - shiftAngle : 0;
                cossin = _mathUtils.getCosAndSin(angle);
                return {
                        x: _round(centerCoords.x + radius * cossin.cos),
                        y: _round(centerCoords.y + radius * cossin.sin)
                    }
            },
            convertXYToPolar: function(centerCoords, x, y) {
                var radius = _mathUtils.getDistance(centerCoords.x, centerCoords.y, x, y),
                    angle = _math.atan2(y - centerCoords.y, x - centerCoords.x);
                return {
                        phi: _round(_mathUtils.normalizeAngle(angle * 180 / _math.PI)),
                        r: _round(radius)
                    }
            },
            processSeriesTemplate: function(seriesTemplate, items) {
                var customizeSeries = commonUtils.isFunction(seriesTemplate.customizeSeries) ? seriesTemplate.customizeSeries : $.noop,
                    nameField = seriesTemplate.nameField || 'series',
                    generatedSeries = {},
                    seriesOrder = [],
                    series,
                    i = 0,
                    length,
                    data;
                for (length = items.length; i < length; i++) {
                    data = items[i];
                    if (nameField in data) {
                        series = generatedSeries[data[nameField]];
                        if (!series) {
                            series = generatedSeries[data[nameField]] = {
                                name: data[nameField],
                                data: []
                            };
                            seriesOrder.push(series.name)
                        }
                        series.data.push(data)
                    }
                }
                return map(seriesOrder, function(orderedName) {
                        var group = generatedSeries[orderedName];
                        return $.extend(group, customizeSeries.call(null, group.name))
                    })
            },
            getCategoriesInfo: function(categories, startValue, endValue) {
                if (!(categories && categories.length > 0))
                    return {};
                startValue = _isDefined(startValue) ? startValue : categories[0];
                endValue = _isDefined(endValue) ? endValue : categories[categories.length - 1];
                var categoriesValue = map(categories, function(category) {
                        return _isDefined(category) ? category.valueOf() : null
                    }),
                    visibleCategories,
                    indexStartValue = _isDefined(startValue) ? _inArray(startValue.valueOf(), categoriesValue) : 0,
                    indexEndValue = _isDefined(endValue) ? _inArray(endValue.valueOf(), categoriesValue) : categories.length - 1,
                    swapBuf,
                    hasVisibleCategories,
                    inverted = false,
                    visibleCategoriesLen;
                indexStartValue < 0 && (indexStartValue = 0);
                indexEndValue < 0 && (indexEndValue = categories.length - 1);
                if (indexEndValue < indexStartValue) {
                    swapBuf = indexEndValue;
                    indexEndValue = indexStartValue;
                    indexStartValue = swapBuf;
                    inverted = true
                }
                visibleCategories = categories.slice(indexStartValue, indexEndValue + 1);
                visibleCategoriesLen = visibleCategories.length;
                hasVisibleCategories = visibleCategoriesLen > 0;
                return {
                        categories: hasVisibleCategories ? visibleCategories : null,
                        start: hasVisibleCategories ? visibleCategories[inverted ? visibleCategoriesLen - 1 : 0] : null,
                        end: hasVisibleCategories ? visibleCategories[inverted ? 0 : visibleCategoriesLen - 1] : null,
                        inverted: inverted
                    }
            },
            setCanvasValues: function(canvas) {
                if (canvas) {
                    canvas.originalTop = canvas.top;
                    canvas.originalBottom = canvas.bottom;
                    canvas.originalLeft = canvas.left;
                    canvas.originalRight = canvas.right
                }
            },
            updatePanesCanvases: function(panes, canvas, rotated) {
                var weightSum = 0;
                _each(panes, function(_, pane) {
                    pane.weight = pane.weight || 1;
                    weightSum += pane.weight
                });
                var distributedSpace = 0,
                    padding = panes.padding || 10,
                    paneSpace = rotated ? canvas.width - canvas.left - canvas.right : canvas.height - canvas.top - canvas.bottom,
                    oneWeight = (paneSpace - padding * (panes.length - 1)) / weightSum,
                    startName = rotated ? "left" : "top",
                    endName = rotated ? "right" : "bottom";
                _each(panes, function(_, pane) {
                    var calcLength = _round(pane.weight * oneWeight);
                    pane.canvas = pane.canvas || {};
                    _extend(pane.canvas, {
                        deltaLeft: 0,
                        deltaRight: 0,
                        deltaTop: 0,
                        deltaBottom: 0
                    }, canvas);
                    pane.canvas[startName] = canvas[startName] + distributedSpace;
                    pane.canvas[endName] = canvas[endName] + (paneSpace - calcLength - distributedSpace);
                    distributedSpace = distributedSpace + calcLength + padding;
                    DX.viz.utils.setCanvasValues(pane.canvas)
                })
            },
            unique: function(array) {
                var values = {};
                return map(array, function(item) {
                        var result = !values[item] ? item : null;
                        values[item] = true;
                        return result
                    })
            },
            map: map,
            wrapDeprecate: function(methodName, method) {
                core[methodName] = function() {
                    log("W0002", "DevExpress.viz.core", methodName, "15.1", "Use the 'DevExpress.viz." + methodName + "' method instead");
                    return method.apply(this, arguments)
                }
            }
        }
    })(DevExpress, jQuery);
    /*! Module viz-core, file errorsWarnings.js */
    DevExpress.define("/vis/core/errorWarnings", ["/utils/utils.error", "/errors"], function(errorUtils, errors) {
        return errorUtils(errors.ERROR_MESSAGES, {
                E2001: "Invalid data source",
                E2002: "Axis type and data type are incompatible",
                E2003: "\"{0}\" data source field contains data of unsupported type",
                E2004: "\"{0}\" data source field is inconsistent",
                E2101: "Unknown series type was specified: {0}",
                E2102: "Ambiguity occurred between two value axes with the same name",
                E2103: "\"{0}\" option must be a function",
                E2104: "Invalid logarithm base",
                E2105: "Invalid value of a \"{0}\"",
                E2106: "Invalid visible range",
                E2202: "Invalid scale {0} value",
                E2203: "The \"{0}\" field of the \"selectedRange\" configuration object is not valid",
                W2002: "The {0} data field is absent",
                W2003: "Tick interval is too small",
                W2101: "\"{0}\" pane does not exist; \"{1}\" pane is used instead",
                W2102: "Value axis with the \"{0}\" name was created automatically",
                W2103: "Chart title was hidden due to container size",
                W2104: "Legend was hidden due to container size",
                W2105: "Title of \"{0}\" axis was hidden due to container size",
                W2106: "Labels of \"{0}\" axis were hidden due to container size",
                W2301: "Invalid value range"
            })
    });
    /*! Module viz-core, file numericTranslator.js */
    (function($, DX, undefined) {
        var commonUtils = DX.require("/utils/utils.common"),
            isDefined = commonUtils.isDefined,
            round = Math.round;
        DX.viz.numericTranslatorFunctions = {
            translate: function(bp) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    doubleError = canvasOptions.rangeDoubleError,
                    specialValue = that.translateSpecialCase(bp);
                if (isDefined(specialValue))
                    return specialValue;
                if (isNaN(bp) || bp.valueOf() + doubleError < canvasOptions.rangeMin || bp.valueOf() - doubleError > canvasOptions.rangeMax)
                    return null;
                return that._conversionValue(that._calculateProjection((bp - canvasOptions.rangeMinVisible) * canvasOptions.ratioOfCanvasRange))
            },
            untranslate: function(pos, _directionOffset, enableOutOfCanvas) {
                var canvasOptions = this._canvasOptions,
                    startPoint = canvasOptions.startPoint;
                if (!enableOutOfCanvas && (pos < startPoint || pos > canvasOptions.endPoint) || !isDefined(canvasOptions.rangeMin) || !isDefined(canvasOptions.rangeMax))
                    return null;
                return this._calculateUnProjection((pos - startPoint) / canvasOptions.ratioOfCanvasRange)
            },
            getInterval: function() {
                return round(this._canvasOptions.ratioOfCanvasRange * (this._businessRange.interval || Math.abs(this._canvasOptions.rangeMax - this._canvasOptions.rangeMin)))
            },
            _getValue: function(val) {
                return val
            },
            zoom: function(translate, scale) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    startPoint = canvasOptions.startPoint,
                    endPoint = canvasOptions.endPoint,
                    newStart = (startPoint + translate) / scale,
                    newEnd = (endPoint + translate) / scale,
                    translatedRangeMinMax = [that.translate(that._getValue(canvasOptions.rangeMin)), that.translate(that._getValue(canvasOptions.rangeMax))],
                    minPoint = Math.min(translatedRangeMinMax[0], translatedRangeMinMax[1]),
                    maxPoint = Math.max(translatedRangeMinMax[0], translatedRangeMinMax[1]);
                if (minPoint > newStart) {
                    newEnd -= newStart - minPoint;
                    newStart = minPoint
                }
                if (maxPoint < newEnd) {
                    newStart -= newEnd - maxPoint;
                    newEnd = maxPoint
                }
                if (maxPoint - minPoint < newEnd - newStart) {
                    newStart = minPoint;
                    newEnd = maxPoint
                }
                translate = (endPoint - startPoint) * newStart / (newEnd - newStart) - startPoint;
                scale = (startPoint + translate) / newStart || 1;
                return {
                        min: that.untranslate(newStart, undefined, true),
                        max: that.untranslate(newEnd, undefined, true),
                        translate: translate,
                        scale: scale
                    }
            },
            getMinScale: function(zoom) {
                return zoom ? 1.1 : 0.9
            },
            getScale: function(val1, val2) {
                var canvasOptions = this._canvasOptions;
                val1 = isDefined(val1) ? val1 : canvasOptions.rangeMin;
                val2 = isDefined(val2) ? val2 : canvasOptions.rangeMax;
                return (canvasOptions.rangeMax - canvasOptions.rangeMin) / Math.abs(val1 - val2)
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file datetimeTranslator.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            numericTranslator = viz.numericTranslatorFunctions;
        viz.datetimeTranslatorFunctions = {
            translate: numericTranslator.translate,
            untranslate: function() {
                var result = numericTranslator.untranslate.apply(this, arguments);
                return result === null ? result : new Date(result)
            },
            _getValue: numericTranslator._getValue,
            getInterval: numericTranslator.getInterval,
            zoom: numericTranslator.zoom,
            getMinScale: numericTranslator.getMinScale,
            getScale: numericTranslator.getScale
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file categoryTranslator.js */
    (function($, DX, undefined) {
        var commonUtils = DX.require("/utils/utils.common"),
            isDefined = commonUtils.isDefined,
            round = Math.round;
        DX.viz.categoryTranslatorFunctions = {
            translate: function(category, directionOffset) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    categoryIndex = that._categoriesToPoints[category],
                    stickDelta,
                    specialValue = that.translateSpecialCase(category),
                    startPointIndex = canvasOptions.startPointIndex || 0,
                    stickInterval = that._businessRange.stick ? 0 : 0.5;
                if (isDefined(specialValue))
                    return specialValue;
                if (!categoryIndex && categoryIndex !== 0)
                    return null;
                directionOffset = directionOffset || 0;
                stickDelta = categoryIndex + stickInterval - startPointIndex + directionOffset * 0.5;
                return round(that._calculateProjection(canvasOptions.interval * stickDelta))
            },
            untranslate: function(pos, directionOffset, enableOutOfCanvas) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    startPoint = canvasOptions.startPoint,
                    categories = that.visibleCategories || that._categories,
                    categoriesLength = categories.length,
                    result = 0,
                    stickInterval = that._businessRange.stick ? 0.5 : 0;
                if (!enableOutOfCanvas && (pos < startPoint || pos > canvasOptions.endPoint))
                    return null;
                directionOffset = directionOffset || 0;
                result = round((pos - startPoint) / canvasOptions.interval + stickInterval - 0.5 - directionOffset * 0.5);
                if (categoriesLength === result)
                    result--;
                if (result === -1)
                    result = 0;
                if (canvasOptions.invert)
                    result = categoriesLength - result - 1;
                return categories[result]
            },
            getInterval: function() {
                return this._canvasOptions.interval
            },
            zoom: function(translate, scale) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    stick = that._businessRange.stick,
                    invert = canvasOptions.invert,
                    interval = canvasOptions.interval * scale,
                    translateCaltegories = translate / interval,
                    startCategoryIndex = parseInt((canvasOptions.startPointIndex || 0) + translateCaltegories + 0.5),
                    categoriesLength = parseInt(canvasOptions.canvasLength / interval + (stick ? 1 : 0)) || 1,
                    endCategoryIndex,
                    newVisibleCategories,
                    categories = that._categories,
                    newInterval;
                if (invert)
                    startCategoryIndex = parseInt((canvasOptions.startPointIndex || 0) + (that.visibleCategories || []).length - translateCaltegories + 0.5) - categoriesLength;
                if (startCategoryIndex < 0)
                    startCategoryIndex = 0;
                endCategoryIndex = startCategoryIndex + categoriesLength;
                if (endCategoryIndex > categories.length) {
                    endCategoryIndex = categories.length;
                    startCategoryIndex = endCategoryIndex - categoriesLength;
                    if (startCategoryIndex < 0)
                        startCategoryIndex = 0
                }
                newVisibleCategories = categories.slice(parseInt(startCategoryIndex), parseInt(endCategoryIndex));
                newInterval = that._getDiscreteInterval(newVisibleCategories.length, canvasOptions);
                scale = newInterval / canvasOptions.interval;
                translate = that.translate(!invert ? newVisibleCategories[0] : newVisibleCategories[newVisibleCategories.length - 1]) * scale - (canvasOptions.startPoint + (stick ? 0 : newInterval / 2));
                return {
                        min: newVisibleCategories[0],
                        max: newVisibleCategories[newVisibleCategories.length - 1],
                        translate: translate,
                        scale: scale
                    }
            },
            getMinScale: function(zoom) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    categoriesLength = (that.visibleCategories || that._categories).length;
                categoriesLength += (parseInt(categoriesLength * 0.1) || 1) * (zoom ? -2 : 2);
                return canvasOptions.canvasLength / (Math.max(categoriesLength, 1) * canvasOptions.interval)
            },
            getScale: function(min, max) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    visibleArea = that.getCanvasVisibleArea(),
                    stickOffset = !that._businessRange.stick && 1,
                    minPoint = that.translate(min, -stickOffset),
                    maxPoint = that.translate(max, +stickOffset);
                if (!isDefined(minPoint))
                    minPoint = canvasOptions.invert ? visibleArea.max : visibleArea.min;
                if (!isDefined(maxPoint))
                    maxPoint = canvasOptions.invert ? visibleArea.min : visibleArea.max;
                return that.canvasLength / Math.abs(maxPoint - minPoint)
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file logarithmicTranslator.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            numericTranslator = viz.numericTranslatorFunctions,
            mathUtils = DX.require("/utils/utils.math"),
            commonUtils = DX.require("/utils/utils.common"),
            raiseTo = mathUtils.raiseTo,
            getLog = mathUtils.getLog;
        viz.logarithmicTranslatorFunctions = {
            translate: function(bp) {
                var that = this,
                    specialValue = that.translateSpecialCase(bp);
                if (commonUtils.isDefined(specialValue))
                    return specialValue;
                return numericTranslator.translate.call(that, getLog(bp, that._businessRange.base))
            },
            untranslate: function() {
                var result = numericTranslator.untranslate.apply(this, arguments);
                return result === null ? result : raiseTo(result, this._businessRange.base)
            },
            getInterval: numericTranslator.getInterval,
            _getValue: function(value) {
                return Math.pow(this._canvasOptions.base, value)
            },
            zoom: numericTranslator.zoom,
            getMinScale: numericTranslator.getMinScale,
            getScale: function(val1, val2) {
                var base = this._businessRange.base;
                val1 = commonUtils.isDefined(val1) ? getLog(val1, base) : undefined;
                val2 = commonUtils.isDefined(val2) ? getLog(val2, base) : undefined;
                return numericTranslator.getScale.call(this, val1, val2)
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file translator1D.js */
    (function(DX, undefined) {
        var _Number = Number;
        function Translator1D() {
            this.setDomain(arguments[0], arguments[1]).setCodomain(arguments[2], arguments[3])
        }
        Translator1D.prototype = {
            constructor: Translator1D,
            setDomain: function(domain1, domain2) {
                var that = this;
                that._domain1 = _Number(domain1);
                that._domain2 = _Number(domain2);
                that._domainDelta = that._domain2 - that._domain1;
                return that
            },
            setCodomain: function(codomain1, codomain2) {
                var that = this;
                that._codomain1 = _Number(codomain1);
                that._codomain2 = _Number(codomain2);
                that._codomainDelta = that._codomain2 - that._codomain1;
                return that
            },
            getDomain: function() {
                return [this._domain1, this._domain2]
            },
            getCodomain: function() {
                return [this._codomain1, this._codomain2]
            },
            getDomainStart: function() {
                return this._domain1
            },
            getDomainEnd: function() {
                return this._domain2
            },
            getCodomainStart: function() {
                return this._codomain1
            },
            getCodomainEnd: function() {
                return this._codomain2
            },
            getDomainRange: function() {
                return this._domainDelta
            },
            getCodomainRange: function() {
                return this._codomainDelta
            },
            translate: function(value) {
                var ratio = (_Number(value) - this._domain1) / this._domainDelta;
                return 0 <= ratio && ratio <= 1 ? this._codomain1 + ratio * this._codomainDelta : NaN
            },
            adjust: function(value) {
                var ratio = (_Number(value) - this._domain1) / this._domainDelta,
                    result = NaN;
                if (ratio < 0)
                    result = this._domain1;
                else if (ratio > 1)
                    result = this._domain2;
                else if (0 <= ratio && ratio <= 1)
                    result = _Number(value);
                return result
            }
        };
        DX.viz.Translator1D = Translator1D
    })(DevExpress);
    /*! Module viz-core, file translator2D.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            mathUtils = DX.require("/utils/utils.math"),
            commonUtils = DX.require("/utils/utils.common"),
            getLog = mathUtils.getLog,
            getPower = mathUtils.getPower,
            isDefined = commonUtils.isDefined,
            _abs = Math.abs,
            CANVAS_PROP = ["width", "height", "left", "top", "bottom", "right"],
            NUMBER_EQUALITY_CORRECTION = 1,
            DATETIME_EQUALITY_CORRECTION = 60000,
            _noop = $.noop,
            _Translator2d;
        var validateCanvas = function(canvas) {
                $.each(CANVAS_PROP, function(_, prop) {
                    canvas[prop] = parseInt(canvas[prop]) || 0
                });
                return canvas
            };
        var makeCategoriesToPoints = function(categories) {
                var categoriesToPoints = {},
                    length = categories.length,
                    i = 0;
                for (; i < length; i++)
                    categoriesToPoints[categories[i]] = i;
                return categoriesToPoints
            };
        var validateBusinessRange = function(businessRange) {
                function validate(valueSelector, baseValueSeletor) {
                    if (!isDefined(businessRange[valueSelector]) && isDefined(businessRange[baseValueSeletor]))
                        businessRange[valueSelector] = businessRange[baseValueSeletor]
                }
                validate("minVisible", "min");
                validate("maxVisible", "max");
                return businessRange
            };
        _Translator2d = viz.Translator2D = function(businessRange, canvas, options) {
            this.update(businessRange, canvas, options)
        };
        _Translator2d.prototype = {
            constructor: _Translator2d,
            reinit: function() {
                var that = this,
                    range = that._businessRange,
                    categories = range.categories || [],
                    script = {},
                    canvasOptions = that._prepareCanvasOptions(),
                    visibleCategories = viz.utils.getCategoriesInfo(categories, range.minVisible, range.maxVisible).categories,
                    categoriesLength = (visibleCategories || categories).length;
                switch (range.axisType) {
                    case"logarithmic":
                        script = viz.logarithmicTranslatorFunctions;
                        break;
                    case"discrete":
                        script = viz.categoryTranslatorFunctions;
                        that._categories = categories;
                        canvasOptions.interval = that._getDiscreteInterval(range.addSpiderCategory ? categoriesLength + 1 : categoriesLength, canvasOptions);
                        that._categoriesToPoints = makeCategoriesToPoints(categories, canvasOptions.invert);
                        if (visibleCategories && categoriesLength) {
                            canvasOptions.startPointIndex = that._categoriesToPoints[visibleCategories[0]];
                            that.visibleCategories = visibleCategories
                        }
                        break;
                    default:
                        if (range.dataType === "datetime")
                            script = viz.datetimeTranslatorFunctions;
                        else
                            script = viz.numericTranslatorFunctions
                }
                that.translate = script.translate;
                that.untranslate = script.untranslate;
                that.getInterval = script.getInterval;
                that.zoom = script.zoom;
                that.getMinScale = script.getMinScale;
                that._getValue = script._getValue;
                that.getScale = script.getScale;
                that._conversionValue = that._options.conversionValue ? function(value) {
                    return value
                } : function(value) {
                    return Math.round(value)
                };
                that._calculateSpecialValues()
            },
            _getDiscreteInterval: function(categoriesLength, canvasOptions) {
                var correctedCategoriesCount = categoriesLength - (this._businessRange.stick ? 1 : 0);
                return correctedCategoriesCount > 0 ? canvasOptions.canvasLength / correctedCategoriesCount : canvasOptions.canvasLength
            },
            _getCanvasBounds: function(range) {
                var min = range.min,
                    max = range.max,
                    minVisible = range.minVisible,
                    maxVisible = range.maxVisible,
                    newMin,
                    newMax,
                    base = range.base,
                    isDateTime = commonUtils.isDate(max) || commonUtils.isDate(min),
                    correction = isDateTime ? DATETIME_EQUALITY_CORRECTION : NUMBER_EQUALITY_CORRECTION;
                if (range.axisType === 'logarithmic') {
                    maxVisible = getLog(maxVisible, base);
                    minVisible = getLog(minVisible, base);
                    min = getLog(min, base);
                    max = getLog(max, base)
                }
                if (isDefined(min) && isDefined(max) && min.valueOf() === max.valueOf()) {
                    newMin = min.valueOf() - correction;
                    newMax = max.valueOf() + correction;
                    if (isDateTime) {
                        min = new Date(newMin);
                        max = new Date(newMax)
                    }
                    else {
                        min = min !== 0 ? newMin : 0;
                        max = newMax
                    }
                }
                if (isDefined(minVisible) && isDefined(maxVisible) && minVisible.valueOf() === maxVisible.valueOf()) {
                    newMin = minVisible.valueOf() - correction;
                    newMax = maxVisible.valueOf() + correction;
                    if (isDateTime) {
                        minVisible = newMin < min.valueOf() ? min : new Date(newMin);
                        maxVisible = newMax > max.valueOf() ? max : new Date(newMax)
                    }
                    else {
                        if (minVisible !== 0)
                            minVisible = newMin < min ? min : newMin;
                        maxVisible = newMax > max ? max : newMax
                    }
                }
                return {
                        base: base,
                        rangeMin: min,
                        rangeMax: max,
                        rangeMinVisible: minVisible,
                        rangeMaxVisible: maxVisible
                    }
            },
            _prepareCanvasOptions: function() {
                var that = this,
                    businessRange = that._businessRange,
                    canvasOptions = that._canvasOptions = that._getCanvasBounds(businessRange),
                    length,
                    canvas = that._canvas;
                if (that._options.isHorizontal) {
                    canvasOptions.startPoint = canvas.left;
                    length = canvas.width;
                    canvasOptions.endPoint = canvas.width - canvas.right;
                    canvasOptions.invert = businessRange.invert
                }
                else {
                    canvasOptions.startPoint = canvas.top;
                    length = canvas.height;
                    canvasOptions.endPoint = canvas.height - canvas.bottom;
                    canvasOptions.invert = !businessRange.invert
                }
                that.canvasLength = canvasOptions.canvasLength = canvasOptions.endPoint - canvasOptions.startPoint;
                canvasOptions.rangeDoubleError = Math.pow(10, getPower(canvasOptions.rangeMax - canvasOptions.rangeMin) - getPower(length) - 2);
                canvasOptions.ratioOfCanvasRange = canvasOptions.canvasLength / (canvasOptions.rangeMaxVisible - canvasOptions.rangeMinVisible);
                return canvasOptions
            },
            updateCanvas: function(canvas) {
                this._canvas = validateCanvas(canvas);
                this.reinit()
            },
            updateBusinessRange: function(businessRange) {
                this._businessRange = validateBusinessRange(businessRange);
                this.reinit()
            },
            update: function(businessRange, canvas, options) {
                var that = this;
                that._options = $.extend(that._options || {}, options);
                that._canvas = validateCanvas(canvas);
                that.updateBusinessRange(businessRange)
            },
            getBusinessRange: function() {
                return this._businessRange
            },
            getCanvasVisibleArea: function() {
                return {
                        min: this._canvasOptions.startPoint,
                        max: this._canvasOptions.endPoint
                    }
            },
            _calculateSpecialValues: function() {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    startPoint = canvasOptions.startPoint,
                    endPoint = canvasOptions.endPoint,
                    range = that._businessRange,
                    minVisible = range.minVisible,
                    maxVisible = range.maxVisible,
                    invert,
                    canvas_position_default,
                    canvas_position_center_middle;
                if (minVisible <= 0 && maxVisible >= 0) {
                    that.sc = {};
                    canvas_position_default = that.translate(0)
                }
                else {
                    invert = range.invert ^ (minVisible <= 0 && maxVisible <= 0);
                    if (that._options.isHorizontal)
                        canvas_position_default = invert ? endPoint : startPoint;
                    else
                        canvas_position_default = invert ? startPoint : endPoint
                }
                canvas_position_center_middle = startPoint + canvasOptions.canvasLength / 2;
                that.sc = {
                    canvas_position_default: canvas_position_default,
                    canvas_position_left: startPoint,
                    canvas_position_top: startPoint,
                    canvas_position_center: canvas_position_center_middle,
                    canvas_position_middle: canvas_position_center_middle,
                    canvas_position_right: endPoint,
                    canvas_position_bottom: endPoint,
                    canvas_position_start: canvasOptions.invert ? endPoint : startPoint,
                    canvas_position_end: canvasOptions.invert ? startPoint : endPoint
                }
            },
            translateSpecialCase: function(value) {
                return this.sc[value]
            },
            _calculateProjection: function(distance) {
                var canvasOptions = this._canvasOptions;
                return canvasOptions.invert ? canvasOptions.endPoint - distance : canvasOptions.startPoint + distance
            },
            _calculateUnProjection: function(distance) {
                var canvasOptions = this._canvasOptions;
                return canvasOptions.invert ? canvasOptions.rangeMaxVisible.valueOf() - distance : canvasOptions.rangeMinVisible.valueOf() + distance
            },
            getVisibleCategories: function() {
                return this.visibleCategories
            },
            getMinBarSize: function(minBarSize) {
                var visibleArea = this.getCanvasVisibleArea(),
                    minValue = this.untranslate(visibleArea.min + minBarSize);
                return _abs(this.untranslate(visibleArea.min) - (!isDefined(minValue) ? this.untranslate(visibleArea.max) : minValue))
            },
            translate: _noop,
            untranslate: _noop,
            getInterval: _noop,
            zoom: _noop,
            getMinScale: _noop
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file polarTranslator.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            mathUtils = DX.require("/utils/utils.math"),
            commonUtils = DX.require("/utils/utils.common"),
            SHIFT_ANGLE = 90,
            _round = Math.round;
        function PolarTranslator(businessRange, canvas, options) {
            var that = this;
            that._startAngle = options.startAngle;
            that._endAngle = options.endAngle;
            that._argCanvas = {
                left: 0,
                right: 0,
                width: this._getAngle()
            };
            that._valCanvas = {
                left: 0,
                right: 0
            };
            that.canvas = $.extend({}, canvas);
            that._init();
            that._arg = new viz.Translator2D(businessRange.arg, that._argCanvas, {
                isHorizontal: true,
                conversionValue: true
            });
            that._val = new viz.Translator2D(businessRange.val, that._valCanvas, {isHorizontal: true});
            that._businessRange = businessRange
        }
        PolarTranslator.prototype = {
            constructor: PolarTranslator,
            _init: function() {
                var canvas = this.canvas;
                this._setCoords({
                    x: canvas.left + (canvas.width - canvas.right - canvas.left) / 2,
                    y: canvas.top + (canvas.height - canvas.top - canvas.bottom) / 2,
                    r: Math.min(canvas.width - canvas.left - canvas.right, canvas.height - canvas.top - canvas.bottom) / 2
                });
                this._valCanvas.width = this._rad
            },
            reinit: function() {
                this._init();
                this._arg.reinit();
                this._val.reinit()
            },
            _setCoords: function(coord) {
                this._x0 = coord.x;
                this._y0 = coord.y;
                this._rad = coord.r < 0 ? 0 : coord.r
            },
            getBusinessRange: function() {
                return this._businessRange
            },
            translate: function(arg, val, offsets) {
                var that = this,
                    argTranslate = that._arg.translate(arg, offsets && offsets[0]),
                    radius = that._val.translate(val, offsets && offsets[1]),
                    angle = commonUtils.isDefined(argTranslate) ? argTranslate + that._startAngle - SHIFT_ANGLE : null,
                    cossin = mathUtils.getCosAndSin(angle),
                    x,
                    y;
                y = _round(that._y0 + radius * cossin.sin);
                x = _round(that._x0 + radius * cossin.cos);
                return {
                        x: x,
                        y: y,
                        angle: angle,
                        radius: radius
                    }
            },
            setCanvasDimension: function(dimension) {
                this.canvas.width = this.canvas.height = dimension;
                this.reinit()
            },
            setAngles: function(startAngle, endAngle) {
                var that = this;
                that._startAngle = startAngle;
                that._endAngle = endAngle;
                that._argCanvas.width = that._getAngle();
                that._arg.update(that._arg.getBusinessRange(), that._argCanvas)
            },
            getAngles: function() {
                return [this._startAngle, this._endAngle]
            },
            getValLength: function() {
                return this._rad
            },
            getCenter: function() {
                return {
                        x: this._x0,
                        y: this._y0
                    }
            },
            getBaseAngle: function() {
                return this._startAngle - SHIFT_ANGLE
            },
            getInterval: function() {
                return this._arg.getInterval()
            },
            getValInterval: function() {
                return this._val.getInterval()
            },
            _getAngle: function() {
                return Math.abs(this._endAngle - this._startAngle)
            },
            getComponent: function(type) {
                var that = this,
                    translator = this["_" + type];
                translator.getRadius = function() {
                    return that.getValLength()
                };
                translator.getCenter = function() {
                    return that.getCenter()
                };
                translator.getAngles = function() {
                    return that.getAngles()
                };
                return translator
            },
            _untranslate: function(x, y) {
                var radius = mathUtils.getDistance(this._x0, this._y0, x, y),
                    angle = Math.atan2(y - this._y0, x - this._x0);
                return {
                        r: radius,
                        phi: angle
                    }
            },
            untranslate: function(x, y) {
                var pos = this._untranslate(x, y);
                pos.phi = _round(mathUtils.normalizeAngle(pos.phi * 180 / Math.PI));
                pos.r = _round(pos.r);
                return pos
            },
            getVisibleCategories: $.noop,
            getCanvasVisibleArea: function() {
                return {}
            },
            getMinBarSize: function(minBarSize) {
                return this._val.getMinBarSize(minBarSize)
            }
        };
        viz.PolarTranslator = PolarTranslator
    })(jQuery, DevExpress);
    /*! Module viz-core, file rectangle.js */
    (function(DX, undefined) {
        var isFinite = window.isFinite,
            Class = DevExpress.require("/class");
        DX.viz.Rectangle = Class.inherit({
            ctor: function(options) {
                var that = this;
                options = options || {};
                that.left = Number(options.left) || 0;
                that.right = Number(options.right) || 0;
                that.top = Number(options.top) || 0;
                that.bottom = Number(options.bottom) || 0
            },
            width: function() {
                return this.right - this.left
            },
            height: function() {
                return this.bottom - this.top
            },
            horizontalMiddle: function() {
                return (this.left + this.right) / 2
            },
            verticalMiddle: function() {
                return (this.top + this.bottom) / 2
            },
            raw: function() {
                var that = this;
                return {
                        left: that.left,
                        top: that.top,
                        right: that.right,
                        bottom: that.bottom
                    }
            },
            clone: function() {
                return new this.constructor(this.raw())
            },
            move: function(dx, dy) {
                var result = this.clone();
                if (isFinite(dx) && isFinite(dy)) {
                    result.left += Number(dx);
                    result.right += Number(dx);
                    result.top += Number(dy);
                    result.bottom += Number(dy)
                }
                return result
            },
            inflate: function(dx, dy) {
                var result = this.clone();
                if (isFinite(dx) && isFinite(dy)) {
                    result.left -= Number(dx);
                    result.right += Number(dx);
                    result.top -= Number(dy);
                    result.bottom += Number(dy)
                }
                return result
            },
            scale: function(factor) {
                var that = this;
                if (factor > 0)
                    return that.inflate(that.width() * (factor - 1) / 2, that.height() * (factor - 1) / 2);
                return that.clone()
            }
        })
    })(DevExpress);
    /*! Module viz-core, file layoutElement.js */
    (function($, DX, undefined) {
        var _round = Math.round,
            objectUtils = DX.require("/utils/utils.object"),
            defaultOffset = {
                horizontal: 0,
                vertical: 0
            },
            alignFactors = {
                center: 0.5,
                right: 1,
                bottom: 1,
                left: 0,
                top: 0
            };
        function LayoutElement(options) {
            this._options = options
        }
        LayoutElement.prototype = {
            constructor: LayoutElement,
            position: function(options) {
                var that = this,
                    ofBBox = options.of.getLayoutOptions(),
                    myBBox = that.getLayoutOptions(),
                    at = options.at,
                    my = options.my,
                    offset = options.offset || defaultOffset,
                    shiftX = -alignFactors[my.horizontal] * myBBox.width + ofBBox.x + alignFactors[at.horizontal] * ofBBox.width + parseInt(offset.horizontal),
                    shiftY = -alignFactors[my.vertical] * myBBox.height + ofBBox.y + alignFactors[at.vertical] * ofBBox.height + parseInt(offset.vertical);
                that.shift(_round(shiftX), _round(shiftY))
            },
            getLayoutOptions: $.noop,
            getVerticalCuttedSize: function(canvas) {
                var that = this,
                    height = canvas.height,
                    top = canvas.top,
                    bottom = canvas.bottom,
                    layoutOptions = that.getLayoutOptions();
                if (layoutOptions) {
                    that.draw(canvas.width, canvas.height);
                    layoutOptions = that.getLayoutOptions();
                    if (layoutOptions) {
                        height -= layoutOptions.height;
                        if (layoutOptions.position.vertical === "bottom")
                            bottom += layoutOptions.height;
                        else
                            top += layoutOptions.height
                    }
                }
                return {
                        left: canvas.left,
                        right: canvas.right,
                        top: top,
                        bottom: bottom,
                        width: canvas.width,
                        height: height
                    }
            }
        };
        function WrapperLayoutElement(renderElement, bbox) {
            this._renderElement = renderElement;
            this._cacheBBox = bbox
        }
        var wrapperLayoutElementPrototype = WrapperLayoutElement.prototype = objectUtils.clone(LayoutElement.prototype);
        wrapperLayoutElementPrototype.constructor = WrapperLayoutElement;
        wrapperLayoutElementPrototype.getLayoutOptions = function() {
            return this._cacheBBox || this._renderElement.getBBox()
        };
        wrapperLayoutElementPrototype.shift = function(shiftX, shiftY) {
            var bbox = this.getLayoutOptions();
            this._renderElement.move(_round(shiftX - bbox.x), _round(shiftY - bbox.y))
        };
        DX.viz.LayoutElement = LayoutElement;
        DX.viz.WrapperLayoutElement = WrapperLayoutElement
    })(jQuery, DevExpress);
    /*! Module viz-core, file themes.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            vizUtils = viz.utils,
            wrapDeprecate = vizUtils.wrapDeprecate,
            themes = {},
            themesMapping = {},
            themesSchemeMapping = {},
            _extend = $.extend,
            _each = $.each,
            _normalizeEnum = vizUtils.normalizeEnum,
            currentThemeName = null,
            nextCacheUid = 0,
            widgetsCache = {};
        function findTheme(themeName) {
            var name = _normalizeEnum(themeName);
            return themes[name] || themes[themesMapping[name] || currentThemeName]
        }
        function findThemeNameByName(name, scheme) {
            return themesMapping[name + '.' + scheme] || themesSchemeMapping[name + '.' + scheme] || themesMapping[name]
        }
        function findThemeNameByPlatform(platform, version, scheme) {
            return findThemeNameByName(platform + version, scheme) || findThemeNameByName(platform, scheme)
        }
        function currentTheme(themeName, colorScheme) {
            if (!arguments.length)
                return currentThemeName;
            var scheme = _normalizeEnum(colorScheme);
            currentThemeName = (themeName && themeName.platform ? findThemeNameByPlatform(_normalizeEnum(themeName.platform), themeName.version, scheme) : findThemeNameByName(_normalizeEnum(themeName), scheme)) || currentThemeName;
            return this
        }
        function getThemeInfo(themeName, splitter) {
            var k = themeName.indexOf(splitter);
            return k > 0 ? {
                    name: themeName.substring(0, k),
                    scheme: themeName.substring(k + 1)
                } : null
        }
        function registerThemeName(themeName, targetThemeName) {
            var themeInfo = getThemeInfo(themeName, '.') || getThemeInfo(themeName, '-') || {name: themeName},
                name = themeInfo.name,
                scheme = themeInfo.scheme;
            if (scheme) {
                themesMapping[name] = themesMapping[name] || targetThemeName;
                themesMapping[name + '.' + scheme] = themesMapping[name + '-' + scheme] = targetThemeName
            }
            else
                themesMapping[name] = targetThemeName
        }
        function registerTheme(theme, baseThemeName) {
            var themeName = _normalizeEnum(theme && theme.name);
            if (themeName) {
                registerThemeName(themeName, themeName);
                themes[themeName] = _extend(true, {}, findTheme(baseThemeName), patchTheme(theme))
            }
        }
        function registerThemeAlias(alias, theme) {
            registerThemeName(_normalizeEnum(alias), _normalizeEnum(theme))
        }
        function registerThemeSchemeAlias(from, to) {
            themesSchemeMapping[from] = to
        }
        function mergeScalar(target, field, source, sourceValue) {
            var _value = source ? source[field] : sourceValue;
            if (_value !== undefined && target[field] === undefined)
                target[field] = _value
        }
        function mergeObject(target, field, source, sourceValue) {
            var _value = source ? source[field] : sourceValue;
            if (_value !== undefined)
                target[field] = _extend(true, {}, _value, target[field])
        }
        function patchTheme(theme) {
            theme = _extend(true, {
                loadingIndicator: {font: {}},
                legend: {
                    font: {},
                    border: {}
                },
                title: {font: {}},
                tooltip: {font: {}},
                "chart:common": {},
                "chart:common:axis": {
                    grid: {},
                    minorGrid: {},
                    tick: {},
                    minorTick: {},
                    title: {font: {}},
                    label: {font: {}}
                },
                chart: {commonSeriesSettings: {candlestick: {}}},
                pie: {},
                polar: {},
                gauge: {scale: {
                        tick: {},
                        minorTick: {},
                        label: {font: {}}
                    }},
                barGauge: {},
                map: {background: {}},
                rangeSelector: {
                    scale: {
                        tick: {},
                        minorTick: {},
                        label: {font: {}}
                    },
                    chart: {}
                },
                sparkline: {},
                bullet: {}
            }, theme);
            mergeScalar(theme.loadingIndicator, "backgroundColor", theme);
            mergeScalar(theme.chart.commonSeriesSettings.candlestick, "innerColor", null, theme.backgroundColor);
            mergeScalar(theme.map.background, "color", null, theme.backgroundColor);
            mergeScalar(theme.title.font, "color", null, theme.primaryTitleColor);
            mergeObject(theme.title, "subtitle", null, theme.title);
            mergeScalar(theme.legend.font, "color", null, theme.secondaryTitleColor);
            mergeScalar(theme.legend.border, "color", null, theme.axisColor);
            patchAxes(theme);
            _each(["chart", "pie", "polar", "gauge", "barGauge", "map", "rangeSelector", "sparkline", "bullet"], function(_, section) {
                mergeScalar(theme[section], "redrawOnResize", theme);
                mergeScalar(theme[section], "containerBackgroundColor", null, theme.backgroundColor);
                mergeObject(theme[section], "tooltip", theme)
            });
            _each(["chart", "pie", "polar", "gauge", "barGauge", "map", "rangeSelector"], function(_, section) {
                mergeObject(theme[section], "loadingIndicator", theme);
                mergeObject(theme[section], "legend", theme);
                mergeObject(theme[section], "title", theme)
            });
            _each(["chart", "pie", "polar"], function(_, section) {
                mergeObject(theme, section, null, theme["chart:common"])
            });
            _each(["chart", "polar"], function(_, section) {
                theme[section] = theme[section] || {};
                mergeObject(theme[section], "commonAxisSettings", null, theme["chart:common:axis"])
            });
            mergeObject(theme.rangeSelector.chart, "commonSeriesSettings", theme.chart);
            mergeObject(theme.rangeSelector.chart, "dataPrepareSettings", theme.chart);
            mergeScalar(theme.map.legend, "backgroundColor", theme);
            patchMapLayers(theme);
            return theme
        }
        function patchAxes(theme) {
            var commonAxisSettings = theme["chart:common:axis"],
                colorFieldName = "color";
            _each([commonAxisSettings, commonAxisSettings.grid, commonAxisSettings.minorGrid, commonAxisSettings.tick, commonAxisSettings.minorTick], function(_, obj) {
                mergeScalar(obj, colorFieldName, null, theme.axisColor)
            });
            mergeScalar(commonAxisSettings.title.font, colorFieldName, null, theme.secondaryTitleColor);
            mergeScalar(commonAxisSettings.label.font, colorFieldName, null, theme.axisLabelColor);
            mergeScalar(theme.gauge.scale.label.font, colorFieldName, null, theme.axisLabelColor);
            mergeScalar(theme.gauge.scale.tick, colorFieldName, null, theme.backgroundColor);
            mergeScalar(theme.gauge.scale.minorTick, colorFieldName, null, theme.backgroundColor);
            mergeScalar(theme.rangeSelector.scale.tick, colorFieldName, null, theme.axisColor);
            mergeScalar(theme.rangeSelector.scale.minorTick, colorFieldName, null, theme.axisColor);
            mergeScalar(theme.rangeSelector.scale.label.font, colorFieldName, null, theme.axisLabelColor)
        }
        function patchMapLayers(theme) {
            var map = theme.map;
            _each(["area", "line", "marker"], function(_, section) {
                mergeObject(map, "layer:" + section, null, map.layer)
            });
            _each(["dot", "bubble", "pie", "image"], function(_, section) {
                mergeObject(map, "layer:marker:" + section, null, map["layer:marker"])
            })
        }
        function addCacheItem(target) {
            var cacheUid = ++nextCacheUid;
            target._cache = cacheUid;
            widgetsCache[cacheUid] = target
        }
        function removeCacheItem(target) {
            delete widgetsCache[target._cache]
        }
        function refreshAll() {
            _each(widgetsCache, function() {
                this.refresh()
            });
            return this
        }
        wrapDeprecate("currentTheme", currentTheme);
        wrapDeprecate("registerTheme", registerTheme);
        _extend(viz, {
            currentTheme: currentTheme,
            registerTheme: registerTheme,
            findTheme: findTheme,
            registerThemeAlias: registerThemeAlias,
            registerThemeSchemeAlias: registerThemeSchemeAlias,
            refreshAll: refreshAll,
            addCacheItem: addCacheItem,
            removeCacheItem: removeCacheItem
        });
        _extend(viz, {
            themes: themes,
            themesMapping: themesMapping,
            themesSchemeMapping: themesSchemeMapping,
            widgetsCache: widgetsCache,
            resetCurrentTheme: function() {
                currentThemeName = null
            }
        })
    })(DevExpress, jQuery);
    /*! Module viz-core, file palette.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            vizUtils = viz.utils,
            wrapDeprecate = vizUtils.wrapDeprecate,
            _floor = Math.floor,
            _ceil = Math.ceil,
            _Color = DX.require("/color"),
            commonUtils = DX.require("/utils/utils.common"),
            _isArray = commonUtils.isArray,
            _isString = commonUtils.isString,
            _extend = $.extend,
            _normalizeEnum = vizUtils.normalizeEnum,
            HIGHLIGHTING_STEP = 50,
            DEFAULT = "default",
            currentPaletteName = DEFAULT;
        var palettes = {
                'default': {
                    simpleSet: ['#5f8b95', '#ba4d51', '#af8a53', '#955f71', '#859666', '#7e688c'],
                    indicatingSet: ['#a3b97c', '#e1b676', '#ec7f83'],
                    gradientSet: ['#5f8b95', '#ba4d51']
                },
                'harmony light': {
                    simpleSet: ['#fcb65e', '#679ec5', '#ad79ce', '#7abd5c', '#e18e92', '#b6d623', '#b7abea', '#85dbd5'],
                    indicatingSet: ['#b6d623', '#fcb65e', '#e18e92'],
                    gradientSet: ['#7abd5c', '#fcb65e']
                },
                'soft pastel': {
                    simpleSet: ['#60a69f', '#78b6d9', '#6682bb', '#a37182', '#eeba69', '#90ba58', '#456c68', '#7565a4'],
                    indicatingSet: ['#90ba58', '#eeba69', '#a37182'],
                    gradientSet: ['#78b6d9', '#eeba69']
                },
                pastel: {
                    simpleSet: ['#bb7862', '#70b3a1', '#bb626a', '#057d85', '#ab394b', '#dac599', '#153459', '#b1d2c6'],
                    indicatingSet: ['#70b3a1', '#dac599', '#bb626a'],
                    gradientSet: ['#bb7862', '#70b3a1']
                },
                bright: {
                    simpleSet: ['#70c92f', '#f8ca00', '#bd1550', '#e97f02', '#9d419c', '#7e4452', '#9ab57e', '#36a3a6'],
                    indicatingSet: ['#70c92f', '#f8ca00', '#bd1550'],
                    gradientSet: ['#e97f02', '#f8ca00']
                },
                soft: {
                    simpleSet: ['#cbc87b', '#9ab57e', '#e55253', '#7e4452', '#e8c267', '#565077', '#6babac', '#ad6082'],
                    indicatingSet: ['#9ab57e', '#e8c267', '#e55253'],
                    gradientSet: ['#9ab57e', '#e8c267']
                },
                ocean: {
                    simpleSet: ['#75c099', '#acc371', '#378a8a', '#5fa26a', '#064970', '#38c5d2', '#00a7c6', '#6f84bb'],
                    indicatingSet: ['#c8e394', '#7bc59d', '#397c8b'],
                    gradientSet: ['#acc371', '#38c5d2']
                },
                vintage: {
                    simpleSet: ['#dea484', '#efc59c', '#cb715e', '#eb9692', '#a85c4c', '#f2c0b5', '#c96374', '#dd956c'],
                    indicatingSet: ['#ffe5c6', '#f4bb9d', '#e57660'],
                    gradientSet: ['#efc59c', '#cb715e']
                },
                violet: {
                    simpleSet: ['#d1a1d1', '#eeacc5', '#7b5685', '#7e7cad', '#a13d73', '#5b41ab', '#e287e2', '#689cc1'],
                    indicatingSet: ['#d8e2f6', '#d0b2da', '#d56a8a'],
                    gradientSet: ['#eeacc5', '#7b5685']
                }
            };
        function currentPalette(name) {
            if (name === undefined)
                return currentPaletteName;
            else {
                name = _normalizeEnum(name);
                currentPaletteName = name in palettes ? name : DEFAULT
            }
        }
        function getPalette(palette, parameters) {
            var result,
                type = parameters && parameters.type;
            if (_isArray(palette))
                return palette.slice(0);
            else {
                if (_isString(palette))
                    result = palettes[_normalizeEnum(palette)];
                if (!result)
                    result = palettes[currentPaletteName]
            }
            result = result || null;
            return type ? result ? result[type].slice(0) : result : result
        }
        function registerPalette(name, palette) {
            var item = {},
                paletteName;
            if (_isArray(palette))
                item.simpleSet = palette.slice(0);
            else if (palette) {
                item.simpleSet = _isArray(palette.simpleSet) ? palette.simpleSet.slice(0) : undefined;
                item.indicatingSet = _isArray(palette.indicatingSet) ? palette.indicatingSet.slice(0) : undefined;
                item.gradientSet = _isArray(palette.gradientSet) ? palette.gradientSet.slice(0) : undefined
            }
            if (item.simpleSet || item.indicatingSet || item.gradientSet) {
                paletteName = _normalizeEnum(name);
                _extend(palettes[paletteName] = palettes[paletteName] || {}, item)
            }
        }
        function RingBuf(buf) {
            var ind = 0;
            this.next = function() {
                var res = buf[ind++];
                if (ind === buf.length)
                    this.reset();
                return res
            };
            this.reset = function() {
                ind = 0
            }
        }
        function Palette(palette, parameters) {
            parameters = parameters || {};
            var stepHighlight = parameters.useHighlight ? HIGHLIGHTING_STEP : 0;
            this._originalPalette = getPalette(palette, {type: parameters.type || "simpleSet"});
            this._paletteSteps = new RingBuf([0, stepHighlight, -stepHighlight]);
            this._resetPalette()
        }
        _extend(Palette.prototype, {
            dispose: function() {
                this._originalPalette = this._palette = this._paletteSteps = null;
                return this
            },
            getNextColor: function() {
                var that = this;
                if (that._currentColor >= that._palette.length)
                    that._resetPalette();
                return that._palette[that._currentColor++]
            },
            _resetPalette: function() {
                var that = this;
                that._currentColor = 0;
                var step = that._paletteSteps.next(),
                    originalPalette = that._originalPalette;
                if (step) {
                    var palette = that._palette = [],
                        i = 0,
                        ii = originalPalette.length;
                    for (; i < ii; ++i)
                        palette[i] = getNewColor(originalPalette[i], step)
                }
                else
                    that._palette = originalPalette.slice(0)
            },
            reset: function() {
                this._paletteSteps.reset();
                this._resetPalette();
                return this
            }
        });
        function getNewColor(currentColor, step) {
            var newColor = new _Color(currentColor).alter(step),
                lightness = getLightness(newColor);
            if (lightness > 200 || lightness < 55)
                newColor = new _Color(currentColor).alter(-step / 2);
            return newColor.toHex()
        }
        function getLightness(color) {
            return color.r * 0.3 + color.g * 0.59 + color.b * 0.11
        }
        function GradientPalette(source, size) {
            var palette = getPalette(source, {type: 'gradientSet'});
            palette = size > 0 ? createGradientColors(palette, size) : [];
            this.getColor = function(index) {
                return palette[index] || null
            };
            this._DEBUG_source = source;
            this._DEBUG_size = size
        }
        function createGradientColors(source, count) {
            var ncolors = count - 1,
                nsource = source.length - 1,
                colors = [],
                gradient = [],
                i;
            function addColor(pos) {
                var k = nsource * pos,
                    kl = _floor(k),
                    kr = _ceil(k);
                gradient.push(colors[kl].blend(colors[kr], k - kl).toHex())
            }
            for (i = 0; i <= nsource; ++i)
                colors.push(new _Color(source[i]));
            if (ncolors > 0)
                for (i = 0; i <= ncolors; ++i)
                    addColor(i / ncolors);
            else
                addColor(0.5);
            return gradient
        }
        wrapDeprecate("registerPalette", registerPalette);
        wrapDeprecate("getPalette", getPalette);
        wrapDeprecate("currentPalette", currentPalette);
        _extend(viz, {
            Palette: Palette,
            GradientPalette: GradientPalette,
            registerPalette: registerPalette,
            getPalette: getPalette,
            currentPalette: currentPalette
        });
        viz._DEBUG_palettes = palettes
    })(DevExpress, jQuery);
    /*! Module viz-core, file baseThemeManager.js */
    (function(DX, $, undefined) {
        var Class = DevExpress.require("/class"),
            commonUtils = DX.require("/utils/utils.common"),
            _isString = commonUtils.isString,
            viz = DX.viz,
            _parseScalar = viz.utils.parseScalar,
            _findTheme = viz.findTheme,
            _addCacheItem = viz.addCacheItem,
            _removeCacheItem = viz.removeCacheItem,
            _extend = $.extend,
            _each = $.each;
        function getThemePart(theme, path) {
            var _theme = theme;
            path && _each(path.split('.'), function(_, pathItem) {
                return _theme = _theme[pathItem]
            });
            return _theme
        }
        viz.BaseThemeManager = Class.inherit({
            ctor: function() {
                _addCacheItem(this)
            },
            dispose: function() {
                var that = this;
                _removeCacheItem(that);
                that._callback = that._theme = that._font = null;
                return that
            },
            setCallback: function(callback) {
                this._callback = callback;
                return this
            },
            setTheme: function(theme, rtl) {
                this._current = theme;
                this._rtl = rtl;
                return this.refresh()
            },
            refresh: function() {
                var that = this,
                    current = that._current || {},
                    theme = _findTheme(current.name || current);
                that._themeName = theme.name;
                that._defaultPalette = theme.defaultPalette;
                that._font = _extend({}, theme.font, current.font);
                that._themeSection && _each(that._themeSection.split('.'), function(_, path) {
                    theme = _extend(true, {}, theme[path], that._IE8 ? theme[path + 'IE8'] : {})
                });
                that._theme = _extend(true, {}, theme, _isString(current) ? {} : current);
                that._initializeTheme();
                if (_parseScalar(that._rtl, that._theme.rtlEnabled))
                    _extend(true, that._theme, that._theme._rtl);
                that._callback();
                return that
            },
            theme: function(path) {
                return getThemePart(this._theme, path)
            },
            themeName: function() {
                return this._themeName
            },
            createPalette: function(palette, options) {
                return new viz.Palette(palette || this._defaultPalette, options)
            },
            createGradientPalette: function(palette, count) {
                return new viz.GradientPalette(palette || this._defaultPalette, count)
            },
            _initializeTheme: function() {
                var that = this;
                _each(that._fontFields || [], function(_, path) {
                    that._initializeFont(getThemePart(that._theme, path))
                })
            },
            _initializeFont: function(font) {
                _extend(font, this._font, _extend({}, font))
            }
        })
    })(DevExpress, jQuery);
    /*! Module viz-core, file parseUtils.js */
    (function($, DX) {
        var commonUtils = DX.require("/utils/utils.common"),
            isDefined = commonUtils.isDefined,
            parsers = {
                string: function(val) {
                    return isDefined(val) ? '' + val : val
                },
                numeric: function(val) {
                    if (!isDefined(val))
                        return val;
                    var parsedVal = Number(val);
                    if (isNaN(parsedVal))
                        parsedVal = undefined;
                    return parsedVal
                },
                datetime: function(val) {
                    if (!isDefined(val))
                        return val;
                    var parsedVal,
                        numVal = Number(val);
                    if (!isNaN(numVal))
                        parsedVal = new Date(numVal);
                    else
                        parsedVal = new Date(val);
                    if (isNaN(Number(parsedVal)))
                        parsedVal = undefined;
                    return parsedVal
                }
            };
        function correctValueType(type) {
            return type === 'numeric' || type === 'datetime' || type === 'string' ? type : ''
        }
        DX.viz.parseUtils = {
            correctValueType: correctValueType,
            getParser: function(valueType) {
                return parsers[correctValueType(valueType)] || $.noop
            }
        };
        DX.viz.parseUtils.parsers = parsers
    })(jQuery, DevExpress);
    /*! Module viz-core, file loadingIndicator.js */
    (function(DX, undefined) {
        var _patchFontOptions = DX.viz.utils.patchFontOptions,
            STATE_HIDDEN = 0,
            STATE_SHOWN = 1,
            LOADING_INDICATOR_READY = "loadingIndicatorReady";
        function LoadingIndicator(parameters) {
            var that = this,
                renderer = parameters.renderer;
            that._group = renderer.g().attr({"class": "dx-loading-indicator"}).linkOn(renderer.root, "loading-indicator");
            that._rect = renderer.rect().attr({opacity: 0}).append(that._group);
            that._text = renderer.text().attr({align: "center"}).append(that._group);
            that._createStates(parameters.eventTrigger, that._group, renderer.root, parameters.notify)
        }
        LoadingIndicator.prototype = {
            constructor: LoadingIndicator,
            _createStates: function(eventTrigger, group, root, notify) {
                var that = this;
                that._states = [[0, function() {
                            notify(false)
                        }, function() {
                            group.linkRemove();
                            root.attr({"pointer-events": null});
                            eventTrigger(LOADING_INDICATOR_READY)
                        }], [0.85, function() {
                            group.linkAppend();
                            root.attr({"pointer-events": "none"});
                            notify(true)
                        }, function() {
                            eventTrigger(LOADING_INDICATOR_READY)
                        }]];
                that._state = STATE_HIDDEN
            },
            setSize: function(size) {
                var width = size.width,
                    height = size.height;
                this._rect.attr({
                    width: width,
                    height: height
                });
                this._text.attr({
                    x: width / 2,
                    y: height / 2
                })
            },
            setOptions: function(options) {
                this._rect.attr({fill: options.backgroundColor});
                this._text.css(_patchFontOptions(options.font)).attr({text: options.text});
                this[options.show ? "show" : "hide"]()
            },
            dispose: function() {
                var that = this;
                that._group.linkRemove().linkOff();
                that._group = that._rect = that._text = that._states = null
            },
            _transit: function(stateId) {
                var that = this,
                    state;
                if (that._state !== stateId) {
                    that._state = stateId;
                    that._isHiding = false;
                    state = that._states[stateId];
                    that._noHiding = true;
                    state[1]();
                    that._noHiding = false;
                    that._rect.stopAnimation().animate({opacity: state[0]}, {
                        complete: state[2],
                        easing: "linear",
                        duration: 400,
                        unstoppable: true
                    })
                }
            },
            show: function() {
                this._transit(STATE_SHOWN)
            },
            hide: function() {
                this._transit(STATE_HIDDEN)
            },
            scheduleHiding: function() {
                if (!this._noHiding)
                    this._isHiding = true
            },
            fulfillHiding: function() {
                if (this._isHiding)
                    this.hide()
            }
        };
        DX.viz.LoadingIndicator = LoadingIndicator
    })(DevExpress);
    /*! Module viz-core, file tooltip.js */
    (function(DX, $, doc, win, undefined) {
        var viz = DX.viz,
            commonUtils = DX.require("/utils/utils.common"),
            HALF_ARROW_WIDTH = 10,
            FORMAT_PRECISION = {
                argument: ["argumentFormat", "argumentPrecision"],
                percent: ["percent", "percentPrecision"],
                value: ["format", "precision"]
            },
            formatHelper = DX.require("/utils/utils.formatHelper"),
            mathCeil = Math.ceil;
        function hideElement($element) {
            $element.css({left: "-9999px"}).detach()
        }
        function Tooltip(params) {
            var that = this,
                renderer,
                root;
            that._eventTrigger = params.eventTrigger;
            that._wrapper = $("<div></div>").css({
                position: "absolute",
                overflow: "visible",
                width: 0,
                height: 0,
                "pointer-events": "none"
            }).addClass(params.cssClass);
            that._renderer = renderer = new viz.renderers.Renderer({
                pathModified: params.pathModified,
                container: that._wrapper[0]
            });
            root = renderer.root;
            root.attr({"pointer-events": "none"});
            that._cloud = renderer.path([], "area").sharp().append(root);
            that._shadow = renderer.shadowFilter();
            that._textGroup = renderer.g().attr({align: "center"}).append(root);
            that._text = renderer.text(undefined, 0, 0).append(that._textGroup);
            that._textGroupHtml = $("<div></div>").css({
                position: "absolute",
                width: 0,
                padding: 0,
                margin: 0,
                border: "0px solid transparent"
            }).appendTo(that._wrapper);
            that._textHtml = $("<div></div>").css({
                position: "relative",
                display: "inline-block",
                padding: 0,
                margin: 0,
                border: "0px solid transparent"
            }).appendTo(that._textGroupHtml)
        }
        Tooltip.prototype = {
            constructor: Tooltip,
            dispose: function() {
                this._wrapper.remove();
                this._renderer.dispose();
                this._options = null
            },
            setOptions: function(options) {
                options = options || {};
                var that = this,
                    cloudSettings = that._cloudSettigns = {
                        opacity: options.opacity,
                        filter: that._shadow.ref,
                        "stroke-width": null,
                        stroke: null
                    },
                    borderOptions = options.border || {},
                    container = $(options.container);
                that._container = (container.length ? container : $("body")).get(0);
                that._shadowSettigns = $.extend({
                    x: "-50%",
                    y: "-50%",
                    width: "200%",
                    height: "200%"
                }, options.shadow);
                that._options = options;
                if (borderOptions.visible)
                    $.extend(cloudSettings, {
                        "stroke-width": borderOptions.width,
                        stroke: borderOptions.color,
                        "stroke-opacity": borderOptions.opacity,
                        dashStyle: borderOptions.dashStyle
                    });
                that._textFontStyles = viz.utils.patchFontOptions(options.font);
                that._textFontStyles.color = options.font.color;
                that._wrapper.css({"z-index": options.zIndex});
                that._customizeTooltip = $.isFunction(options.customizeTooltip) ? options.customizeTooltip : null;
                return that
            },
            setRendererOptions: function(options) {
                this._renderer.setOptions(options);
                this._textGroupHtml.css({direction: options.rtl ? "rtl" : "ltr"});
                return this
            },
            render: function() {
                var that = this;
                hideElement(that._wrapper);
                that._cloud.attr(that._cloudSettigns);
                that._shadow.attr(that._shadowSettigns);
                that._textGroupHtml.css(that._textFontStyles);
                that._textGroup.css(that._textFontStyles);
                that._text.css(that._textFontStyles);
                that._eventData = null;
                return that
            },
            update: function(options) {
                return this.setOptions(options).render()
            },
            _prepare: function(formatObject, state) {
                var options = this._options,
                    customize = {};
                if (this._customizeTooltip) {
                    customize = this._customizeTooltip.call(formatObject, formatObject);
                    customize = $.isPlainObject(customize) ? customize : {};
                    if ("text" in customize)
                        state.text = commonUtils.isDefined(customize.text) ? String(customize.text) : "";
                    if ("html" in customize)
                        state.html = commonUtils.isDefined(customize.html) ? String(customize.html) : ""
                }
                if (!("text" in state) && !("html" in state))
                    state.text = formatObject.valueText || "";
                state.color = customize.color || options.color;
                state.borderColor = customize.borderColor || (options.border || {}).color;
                state.textColor = customize.fontColor || (options.font || {}).color;
                return !!state.text || !!state.html
            },
            show: function(formatObject, params, eventData) {
                var that = this,
                    state = {},
                    options = that._options,
                    plr = options.paddingLeftRight,
                    ptb = options.paddingTopBottom,
                    textGroupHtml = that._textGroupHtml,
                    textHtml = that._textHtml,
                    bBox,
                    contentSize,
                    ss = that._shadowSettigns,
                    xOff = ss.offsetX,
                    yOff = ss.offsetY,
                    blur = ss.blur * 2 + 1,
                    getComputedStyle = win.getComputedStyle;
                if (!that._prepare(formatObject, state))
                    return false;
                that._state = state;
                state.tc = {};
                that._wrapper.appendTo(that._container);
                that._cloud.attr({
                    fill: state.color,
                    stroke: state.borderColor
                });
                if (state.html) {
                    that._text.attr({text: ""});
                    textGroupHtml.css({
                        color: state.textColor,
                        width: that._getCanvas().width
                    });
                    textHtml.html(state.html);
                    if (getComputedStyle) {
                        bBox = getComputedStyle(textHtml.get(0));
                        bBox = {
                            x: 0,
                            y: 0,
                            width: mathCeil(parseFloat(bBox.width)),
                            height: mathCeil(parseFloat(bBox.height))
                        }
                    }
                    else {
                        bBox = textHtml.get(0).getBoundingClientRect();
                        bBox = {
                            x: 0,
                            y: 0,
                            width: mathCeil(bBox.width ? bBox.width : bBox.right - bBox.left),
                            height: mathCeil(bBox.height ? bBox.height : bBox.bottom - bBox.top)
                        }
                    }
                    textGroupHtml.width(bBox.width);
                    textGroupHtml.height(bBox.height)
                }
                else {
                    textHtml.html("");
                    that._text.css({fill: state.textColor}).attr({text: state.text});
                    bBox = that._textGroup.css({fill: state.textColor}).getBBox()
                }
                contentSize = state.contentSize = {
                    x: bBox.x - plr,
                    y: bBox.y - ptb,
                    width: bBox.width + 2 * plr,
                    height: bBox.height + 2 * ptb,
                    lm: blur - xOff > 0 ? blur - xOff : 0,
                    rm: blur + xOff > 0 ? blur + xOff : 0,
                    tm: blur - yOff > 0 ? blur - yOff : 0,
                    bm: blur + yOff > 0 ? blur + yOff : 0
                };
                contentSize.fullWidth = contentSize.width + contentSize.lm + contentSize.rm;
                contentSize.fullHeight = contentSize.height + contentSize.tm + contentSize.bm + options.arrowLength;
                that.move(params.x, params.y, params.offset);
                that._eventData && that._eventTrigger("tooltipHidden", that._eventData);
                that._eventData = eventData;
                that._eventTrigger("tooltipShown", that._eventData);
                return true
            },
            hide: function() {
                var that = this;
                hideElement(that._wrapper);
                that._eventData && that._eventTrigger("tooltipHidden", that._eventData);
                that._eventData = null
            },
            move: function(x, y, offset) {
                offset = offset || 0;
                var that = this,
                    canvas = that._getCanvas(),
                    state = that._state,
                    coords = state.tc,
                    contentSize = state.contentSize;
                if (that._calculatePosition(x, y, offset, canvas)) {
                    that._cloud.attr({points: coords.cloudPoints}).move(contentSize.lm, contentSize.tm);
                    if (state.html)
                        that._textGroupHtml.css({
                            left: -contentSize.x + contentSize.lm,
                            top: -contentSize.y + contentSize.tm + coords.correction
                        });
                    else
                        that._textGroup.move(-contentSize.x + contentSize.lm, -contentSize.y + contentSize.tm + coords.correction);
                    that._renderer.resize(coords.hp === "out" ? canvas.fullWidth - canvas.left : contentSize.fullWidth, coords.vp === "out" ? canvas.fullHeight - canvas.top : contentSize.fullHeight)
                }
                offset = that._wrapper.css({
                    left: 0,
                    top: 0
                }).offset();
                that._wrapper.css({
                    left: coords.x - offset.left,
                    top: coords.y - offset.top
                })
            },
            formatValue: function(value, specialFormat) {
                var formatObj = FORMAT_PRECISION[specialFormat || "value"],
                    format = formatObj[0] in this._options ? this._options[formatObj[0]] : specialFormat;
                return formatHelper.format(value, format, this._options[formatObj[1]] || 0)
            },
            getLocation: function() {
                return viz.utils.normalizeEnum(this._options.location)
            },
            isEnabled: function() {
                return !!this._options.enabled
            },
            isShared: function() {
                return !!this._options.shared
            },
            _calculatePosition: function(x, y, offset, canvas) {
                var that = this,
                    options = that._options,
                    arrowLength = options.arrowLength,
                    state = that._state,
                    coords = state.tc,
                    contentSize = state.contentSize,
                    contentWidth = contentSize.width,
                    halfContentWidth = contentWidth / 2,
                    contentHeight = contentSize.height,
                    cTop = y - canvas.top,
                    cBottom = canvas.top + canvas.height - y,
                    cLeft = x - canvas.left,
                    cRight = canvas.width + canvas.left - x,
                    tTop = contentHeight + arrowLength + offset + contentSize.tm,
                    tBottom = contentHeight + arrowLength + offset + contentSize.bm,
                    tLeft = contentWidth + contentSize.lm,
                    tRight = contentWidth + contentSize.rm,
                    tHalfLeft = halfContentWidth + contentSize.lm,
                    tHalfRight = halfContentWidth + contentSize.rm,
                    correction = 0,
                    cloudPoints,
                    arrowPoints = [6, 0],
                    x1 = halfContentWidth + HALF_ARROW_WIDTH,
                    x2 = halfContentWidth,
                    x3 = halfContentWidth - HALF_ARROW_WIDTH,
                    y1,
                    y3,
                    y2 = contentHeight + arrowLength,
                    hp = "center",
                    vp = "bottom",
                    hasDeprecatedPosition;
                y1 = y3 = contentHeight;
                switch (options.verticalAlignment) {
                    case"top":
                        vp = "bottom";
                        hasDeprecatedPosition = true;
                        break;
                    case"bottom":
                        vp = "top";
                        hasDeprecatedPosition = true;
                        break
                }
                if (!hasDeprecatedPosition)
                    if (tTop > cTop && tBottom > cBottom)
                        vp = "out";
                    else if (tTop > cTop)
                        vp = "top";
                hasDeprecatedPosition = false;
                switch (options.horizontalAlignment) {
                    case"left":
                        hp = "right";
                        hasDeprecatedPosition = true;
                        break;
                    case"center":
                        hp = "center";
                        hasDeprecatedPosition = true;
                        break;
                    case"right":
                        hp = "left";
                        hasDeprecatedPosition = true;
                        break
                }
                if (!hasDeprecatedPosition)
                    if (tLeft > cLeft && tRight > cRight)
                        hp = "out";
                    else if (tHalfLeft > cLeft && tRight < cRight)
                        hp = "left";
                    else if (tHalfRight > cRight && tLeft < cLeft)
                        hp = "right";
                if (hp === "out")
                    x = canvas.left;
                else if (hp === "left") {
                    x1 = HALF_ARROW_WIDTH;
                    x2 = x3 = 0
                }
                else if (hp === "right") {
                    x1 = x2 = contentWidth;
                    x3 = contentWidth - HALF_ARROW_WIDTH;
                    x = x - contentWidth
                }
                else if (hp === "center")
                    x = x - halfContentWidth;
                if (vp === "out")
                    y = canvas.top;
                else if (vp === "top") {
                    hp !== "out" && (correction = arrowLength);
                    arrowPoints[0] = 2;
                    y1 = y3 = arrowLength;
                    y2 = x1;
                    x1 = x3;
                    x3 = y2;
                    y2 = 0;
                    y = y + offset
                }
                else
                    y = y - (contentHeight + arrowLength + offset);
                coords.x = x - contentSize.lm;
                coords.y = y - contentSize.tm;
                coords.correction = correction;
                if (hp === coords.hp && vp === coords.vp)
                    return false;
                coords.hp = hp;
                coords.vp = vp;
                cloudPoints = [0, 0 + correction, contentWidth, 0 + correction, contentWidth, contentHeight + correction, 0, contentHeight + correction];
                if (hp !== "out" && vp !== "out") {
                    arrowPoints.splice(2, 0, x1, y1, x2, y2, x3, y3);
                    cloudPoints.splice.apply(cloudPoints, arrowPoints)
                }
                coords.cloudPoints = cloudPoints;
                return true
            },
            _getCanvas: function() {
                var html = doc.documentElement,
                    body = doc.body;
                return {
                        left: win.pageXOffset || html.scrollLeft || 0,
                        top: win.pageYOffset || html.scrollTop || 0,
                        width: html.clientWidth || 0,
                        height: html.clientHeight || 0,
                        fullWidth: Math.max(body.scrollWidth, html.scrollWidth, body.offsetWidth, html.offsetWidth, body.clientWidth, html.clientWidth),
                        fullHeight: Math.max(body.scrollHeight, html.scrollHeight, body.offsetHeight, html.offsetHeight, body.clientHeight, html.clientHeight)
                    }
            }
        };
        viz.Tooltip = Tooltip
    })(DevExpress, jQuery, document, window);
    /*! Module viz-core, file legend.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            vizUtils = viz.utils,
            WrapperLayoutElement = viz.WrapperLayoutElement,
            _Number = Number,
            _math = Math,
            _round = _math.round,
            _max = _math.max,
            _min = _math.min,
            _ceil = _math.ceil,
            objectUtils = DX.require("/utils/utils.object"),
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _isFunction = commonUtils.isFunction,
            _enumParser = vizUtils.enumParser,
            _normalizeEnum = vizUtils.normalizeEnum,
            _extend = $.extend,
            _each = $.each,
            DEFAULT_MARGIN = 10,
            DEFAULT_MARKER_HATCHING_WIDTH = 2,
            DEFAULT_MARKER_HATCHING_STEP = 5,
            CENTER = "center",
            RIGHT = "right",
            LEFT = "left",
            TOP = "top",
            BOTTOM = "bottom",
            HORIZONTAL = "horizontal",
            VERTICAL = "vertical",
            INSIDE = "inside",
            OUTSIDE = "outside",
            NONE = "none",
            HEIGHT = "height",
            WIDTH = "width",
            parseHorizontalAlignment = _enumParser([LEFT, CENTER, RIGHT]),
            parseVerticalAlignment = _enumParser([TOP, BOTTOM]),
            parseOrientation = _enumParser([VERTICAL, HORIZONTAL]),
            parseItemTextPosition = _enumParser([LEFT, RIGHT, TOP, BOTTOM]),
            parsePosition = _enumParser([OUTSIDE, INSIDE]),
            parseItemsAlignment = _enumParser([LEFT, CENTER, RIGHT]);
        function getPattern(renderer, states, action, color) {
            if (!states || !states[action])
                return;
            var direction = states[action].hatching.direction,
                hatching,
                colorFromAction = states[action].fill;
            color = colorFromAction === NONE ? color : colorFromAction;
            direction = !direction || direction === NONE ? RIGHT : direction;
            hatching = _extend({}, states[action].hatching, {
                direction: direction,
                step: DEFAULT_MARKER_HATCHING_STEP,
                width: DEFAULT_MARKER_HATCHING_WIDTH
            });
            return renderer.pattern(color, hatching)
        }
        function parseMargins(options) {
            var margin = options.margin;
            if (margin >= 0) {
                margin = _Number(options.margin);
                margin = {
                    top: margin,
                    bottom: margin,
                    left: margin,
                    right: margin
                }
            }
            else
                margin = {
                    top: margin.top >= 0 ? _Number(margin.top) : DEFAULT_MARGIN,
                    bottom: margin.bottom >= 0 ? _Number(margin.bottom) : DEFAULT_MARGIN,
                    left: margin.left >= 0 ? _Number(margin.left) : DEFAULT_MARGIN,
                    right: margin.right >= 0 ? _Number(margin.right) : DEFAULT_MARGIN
                };
            options.margin = margin
        }
        function getSizeItem(options, markerSize, labelBBox) {
            var defaultXMargin = 7,
                defaultTopMargin = 4,
                width,
                height;
            switch (options.itemTextPosition) {
                case LEFT:
                case RIGHT:
                    width = markerSize + defaultXMargin + labelBBox.width;
                    height = _max(markerSize, labelBBox.height);
                    break;
                case TOP:
                case BOTTOM:
                    width = _max(markerSize, labelBBox.width);
                    height = markerSize + defaultTopMargin + labelBBox.height;
                    break
            }
            return {
                    width: width,
                    height: height
                }
        }
        function calculateBboxLabelAndMarker(markerBBox, labelBBox) {
            var bbox = {};
            bbox.left = _min(markerBBox.x, labelBBox.x);
            bbox.top = _min(markerBBox.y, labelBBox.y);
            bbox.right = _max(markerBBox.x + markerBBox.width, labelBBox.x + labelBBox.width);
            bbox.bottom = _max(markerBBox.y + markerBBox.height, labelBBox.y + labelBBox.height);
            return bbox
        }
        function applyMarkerState(id, idToIndexMap, items, stateName) {
            var item = idToIndexMap && items[idToIndexMap[id]];
            if (item)
                item.marker.attr(item.states[stateName])
        }
        function parseOptions(options, textField) {
            if (!options)
                return null;
            var debug = DX.require("/utils/utils.console").debug;
            debug.assertParam(options.visible, "Visibility was not passed");
            debug.assertParam(options.markerSize, "markerSize was not passed");
            debug.assertParam(options.font.color, "fontColor was not passed");
            debug.assertParam(options.font.family, "fontFamily was not passed");
            debug.assertParam(options.font.size, "fontSize was not passed");
            debug.assertParam(options.paddingLeftRight, "paddingLeftRight was not passed");
            debug.assertParam(options.paddingTopBottom, "paddingTopBottom was not passed");
            debug.assertParam(options.columnItemSpacing, "columnItemSpacing was not passed");
            debug.assertParam(options.rowItemSpacing, "rowItemSpacing was not passed");
            parseMargins(options);
            options.horizontalAlignment = parseHorizontalAlignment(options.horizontalAlignment, RIGHT);
            options.verticalAlignment = parseVerticalAlignment(options.verticalAlignment, options.horizontalAlignment === CENTER ? BOTTOM : TOP);
            options.orientation = parseOrientation(options.orientation, options.horizontalAlignment === CENTER ? HORIZONTAL : VERTICAL);
            options.itemTextPosition = parseItemTextPosition(options.itemTextPosition, options.orientation === HORIZONTAL ? BOTTOM : RIGHT);
            options.position = parsePosition(options.position, OUTSIDE);
            options.itemsAlignment = parseItemsAlignment(options.itemsAlignment, null);
            options.hoverMode = _normalizeEnum(options.hoverMode);
            options.customizeText = _isFunction(options.customizeText) ? options.customizeText : function() {
                return this[textField]
            };
            options.customizeHint = _isFunction(options.customizeHint) ? options.customizeHint : $.noop;
            options._incidentOccured = options._incidentOccured || $.noop;
            return options
        }
        function createSquareMarker(renderer, size) {
            return renderer.rect(0, 0, size, size)
        }
        function createCircleMarker(renderer, size) {
            return renderer.circle(size / 2, size / 2, size / 2)
        }
        function isCircle(type) {
            return _normalizeEnum(type) === "circle"
        }
        function getMarkerCreator(type) {
            return isCircle(type) ? createCircleMarker : createSquareMarker
        }
        function inRect(rect, x, y) {
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
        }
        function checkLinesSize(lines, layoutOptions, countItems) {
            var position = {
                    x: 0,
                    y: 0
                },
                maxMeasureLength = 0,
                maxOrtMeasureLength = 0;
            _each(lines, function(i, line) {
                var firstItem = line[0];
                _each(line, function(_, item) {
                    var offset = item.offset || layoutOptions.spacing;
                    position[layoutOptions.direction] += item[layoutOptions.measure] + offset;
                    maxMeasureLength = _max(maxMeasureLength, position[layoutOptions.direction])
                });
                position[layoutOptions.direction] = 0;
                position[layoutOptions.ortDirection] += firstItem[layoutOptions.ortMeasure] + firstItem.ortOffset || layoutOptions.ortSpacing;
                maxOrtMeasureLength = _max(maxOrtMeasureLength, position[layoutOptions.ortDirection])
            });
            if (maxMeasureLength > layoutOptions.length) {
                layoutOptions.countItem = decreaseItemCount(layoutOptions, countItems);
                return true
            }
        }
        function decreaseItemCount(layoutOptions, countItems) {
            layoutOptions.ortCountItem++;
            return _ceil(countItems / layoutOptions.ortCountItem)
        }
        function getLineLength(line, layoutOptions) {
            var lineLength = 0;
            _each(line, function(_, item) {
                var offset = item.offset || layoutOptions.spacing;
                lineLength += item[layoutOptions.measure] + offset
            });
            return lineLength
        }
        function getMaxLineLength(lines, layoutOptions) {
            var maxLineLength = 0;
            _each(lines, function(_, line) {
                maxLineLength = _max(maxLineLength, getLineLength(line, layoutOptions))
            });
            return maxLineLength
        }
        function getInitPositionForDirection(line, layoutOptions, maxLineLength) {
            var lineLength = getLineLength(line, layoutOptions),
                initPosition;
            switch (layoutOptions.itemsAlignment) {
                case RIGHT:
                    initPosition = maxLineLength - lineLength;
                    break;
                case CENTER:
                    initPosition = (maxLineLength - lineLength) / 2;
                    break;
                default:
                    initPosition = 0
            }
            return initPosition
        }
        function getPos(layoutOptions) {
            switch (layoutOptions.itemTextPosition) {
                case BOTTOM:
                    return {
                            horizontal: CENTER,
                            vertical: TOP
                        };
                case TOP:
                    return {
                            horizontal: CENTER,
                            vertical: BOTTOM
                        };
                case LEFT:
                    return {
                            horizontal: RIGHT,
                            vertical: CENTER
                        };
                case RIGHT:
                    return {
                            horizontal: LEFT,
                            vertical: CENTER
                        }
            }
        }
        function getLines(lines, layoutOptions, itemIndex) {
            var tableLine = {};
            if (itemIndex % layoutOptions.countItem === 0)
                if (layoutOptions.markerOffset)
                    lines.push([], []);
                else
                    lines.push([]);
            if (layoutOptions.markerOffset) {
                tableLine.firstLine = lines[lines.length - 1];
                tableLine.secondLine = lines[lines.length - 2]
            }
            else
                tableLine.firstLine = tableLine.secondLine = lines[lines.length - 1];
            return tableLine
        }
        function setMaxInLine(line, mesuare) {
            var maxLineSize = 0;
            _each(line, function(_, item) {
                if (!item)
                    return;
                maxLineSize = _max(maxLineSize, item[mesuare])
            });
            _each(line, function(_, item) {
                if (!item)
                    return;
                item[mesuare] = maxLineSize
            })
        }
        function transpose(array) {
            var width = array.length,
                height = array[0].length,
                i,
                j,
                transposeArray = [];
            for (i = 0; i < height; i++) {
                transposeArray[i] = [];
                for (j = 0; j < width; j++)
                    transposeArray[i][j] = array[j][i]
            }
            return transposeArray
        }
        function getAlign(position) {
            switch (position) {
                case TOP:
                case BOTTOM:
                    return CENTER;
                case LEFT:
                    return RIGHT;
                case RIGHT:
                    return LEFT
            }
        }
        var _Legend = viz.Legend = function(settings) {
                var that = this;
                that._renderer = settings.renderer;
                that._legendGroup = settings.group;
                that._backgroundClass = settings.backgroundClass;
                that._itemGroupClass = settings.itemGroupClass;
                that._textField = settings.textField;
                that._getCustomizeObject = settings.getFormatObject;
                that._patterns = []
            };
        var legendPrototype = _Legend.prototype = objectUtils.clone(DX.viz.LayoutElement.prototype);
        $.extend(legendPrototype, {
            constructor: _Legend,
            update: function(data, options) {
                var that = this;
                that._data = data;
                that._boundingRect = {
                    width: 0,
                    height: 0,
                    x: 0,
                    y: 0
                };
                that._options = parseOptions(options, that._textField);
                return that
            },
            draw: function(width, height) {
                var that = this,
                    options = that._options,
                    renderer = that._renderer,
                    items = that._data;
                this._size = {
                    width: width,
                    height: height
                };
                that.erase();
                if (!(options && options.visible && items && items.length))
                    return that;
                that._insideLegendGroup = renderer.g().append(that._legendGroup);
                that._createBackground();
                that._createItems(that._getItemData());
                that._locateElements(options);
                that._finalUpdate(options);
                if (that.getLayoutOptions().width > width || that.getLayoutOptions().height > height) {
                    that._options._incidentOccured("W2104");
                    that.erase()
                }
                return that
            },
            probeDraw: function(width, height) {
                return this.draw(width, height)
            },
            _createItems: function(items) {
                var that = this,
                    options = that._options,
                    initMarkerSize = options.markerSize,
                    renderer = that._renderer,
                    i = 0,
                    bbox,
                    maxBboxHeight = 0,
                    createMarker = getMarkerCreator(options.markerType);
                that._markersId = {};
                for (; i < that._patterns.length; i++)
                    that._patterns[i].dispose();
                that._patterns = [];
                that._items = vizUtils.map(items, function(dataItem, i) {
                    var group = that._insideLegendGroup,
                        markerSize = _Number(dataItem.size > 0 ? dataItem.size : initMarkerSize),
                        stateOfDataItem = dataItem.states,
                        normalState = stateOfDataItem.normal,
                        normalStateFill = normalState.fill,
                        marker = createMarker(renderer, markerSize).attr({
                            fill: normalStateFill || options.markerColor,
                            opacity: normalState.opacity
                        }).append(group),
                        label = that._createLabel(dataItem, group),
                        hoverPattern = getPattern(renderer, stateOfDataItem, "hover", normalStateFill),
                        selectionPattern = getPattern(renderer, stateOfDataItem, "selection", normalStateFill),
                        states = {normal: {fill: normalStateFill}},
                        labelBBox = label.getBBox();
                    if (hoverPattern) {
                        states.hovered = {fill: hoverPattern.id};
                        that._patterns.push(hoverPattern)
                    }
                    if (selectionPattern) {
                        states.selected = {fill: selectionPattern.id};
                        that._patterns.push(selectionPattern)
                    }
                    if (dataItem.id !== undefined)
                        that._markersId[dataItem.id] = i;
                    bbox = getSizeItem(options, markerSize, labelBBox);
                    maxBboxHeight = _max(maxBboxHeight, bbox.height);
                    that._createHint(dataItem, label);
                    return {
                            label: label,
                            labelBBox: labelBBox,
                            group: group,
                            bbox: bbox,
                            marker: marker,
                            markerSize: markerSize,
                            tracker: {
                                id: dataItem.id,
                                argument: dataItem.argument
                            },
                            states: states,
                            itemTextPosition: options.itemTextPosition,
                            markerOffset: 0,
                            bboxs: []
                        }
                });
                if (options.equalRowHeight)
                    _each(that._items, function(_, item) {
                        item.bbox.height = maxBboxHeight
                    })
            },
            _getItemData: function() {
                var items = this._data;
                if (this._options.inverted)
                    items = items.slice().reverse();
                return items
            },
            _finalUpdate: function(options) {
                this._adjustBackgroundSettings(options);
                this._setBoundingRect(options.margin)
            },
            erase: function() {
                var that = this,
                    insideLegendGroup = that._insideLegendGroup;
                insideLegendGroup && insideLegendGroup.dispose();
                that._insideLegendGroup = that._x1 = that._x2 = that._y2 = that._y2 = null;
                return that
            },
            _locateElements: function(locationOptions) {
                this._moveInInitialValues();
                this._locateRowsColumns(locationOptions)
            },
            _moveInInitialValues: function() {
                var that = this;
                that._legendGroup && that._legendGroup.move(0, 0);
                that._background && that._background.attr({
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                })
            },
            applySelected: function(id) {
                applyMarkerState(id, this._markersId, this._items, "selected");
                return this
            },
            applyHover: function(id) {
                applyMarkerState(id, this._markersId, this._items, "hovered");
                return this
            },
            resetItem: function(id) {
                applyMarkerState(id, this._markersId, this._items, "normal");
                return this
            },
            _createLabel: function(data, group) {
                var labelFormatObject = this._getCustomizeObject(data),
                    align = getAlign(this._options.itemTextPosition),
                    text = this._options.customizeText.call(labelFormatObject, labelFormatObject),
                    fontStyle = _isDefined(data.textOpacity) ? _extend({}, this._options.font, {opacity: data.textOpacity}) : this._options.font;
                return this._renderer.text(text, 0, 0).css(vizUtils.patchFontOptions(fontStyle)).attr({align: align}).append(group)
            },
            _createHint: function(data, label) {
                var labelFormatObject = this._getCustomizeObject(data),
                    text = this._options.customizeHint.call(labelFormatObject, labelFormatObject);
                if (_isDefined(text) && text !== "")
                    label.setTitle(text)
            },
            _createBackground: function() {
                var that = this,
                    isInside = that._options.position === INSIDE,
                    color = that._options.backgroundColor,
                    fill = color || (isInside ? that._options.containerBackgroundColor : NONE);
                if (that._options.border.visible || (isInside || color) && color !== NONE)
                    that._background = that._renderer.rect(0, 0, 0, 0).attr({
                        fill: fill,
                        'class': that._backgroundClass
                    }).append(that._insideLegendGroup)
            },
            _locateRowsColumns: function() {
                var that = this,
                    iteration = 0,
                    layoutOptions = that._getItemsLayoutOptions(),
                    countItems = that._items.length,
                    lines;
                do {
                    lines = [];
                    that._createLines(lines, layoutOptions);
                    that._alignLines(lines, layoutOptions);
                    iteration++
                } while (checkLinesSize(lines, layoutOptions, countItems) && iteration < countItems);
                that._applyItemPosition(lines, layoutOptions)
            },
            _createLines: function(lines, layoutOptions) {
                _each(this._items, function(i, item) {
                    var tableLine = getLines(lines, layoutOptions, i),
                        labelBox = {
                            width: item.labelBBox.width,
                            height: item.labelBBox.height,
                            element: item.label,
                            bbox: item.labelBBox,
                            pos: getPos(layoutOptions),
                            itemIndex: i
                        },
                        markerBox = {
                            width: item.markerSize,
                            height: item.markerSize,
                            element: item.marker,
                            pos: {
                                horizontal: CENTER,
                                vertical: CENTER
                            },
                            bbox: {
                                width: item.markerSize,
                                height: item.markerSize,
                                x: 0,
                                y: 0
                            },
                            itemIndex: i
                        },
                        firstItem,
                        secondItem,
                        offsetDirection = layoutOptions.markerOffset ? "ortOffset" : "offset";
                    if (layoutOptions.inverseLabelPosition) {
                        firstItem = labelBox;
                        secondItem = markerBox
                    }
                    else {
                        firstItem = markerBox;
                        secondItem = labelBox
                    }
                    firstItem[offsetDirection] = layoutOptions.labelOffset;
                    tableLine.secondLine.push(firstItem);
                    tableLine.firstLine.push(secondItem)
                })
            },
            _alignLines: function(lines, layoutOptions) {
                var i,
                    measure = layoutOptions.ortMeasure;
                _each(lines, processLine);
                measure = layoutOptions.measure;
                if (layoutOptions.itemsAlignment) {
                    if (layoutOptions.markerOffset)
                        for (i = 0; i < lines.length; )
                            _each(transpose([lines[i++], lines[i++]]), processLine)
                }
                else
                    _each(transpose(lines), processLine);
                function processLine(_, line) {
                    setMaxInLine(line, measure)
                }
            },
            _applyItemPosition: function(lines, layoutOptions) {
                var that = this,
                    position = {
                        x: 0,
                        y: 0
                    },
                    maxLineLength = getMaxLineLength(lines, layoutOptions),
                    itemIndex = 0;
                _each(lines, function(i, line) {
                    var firstItem = line[0],
                        ortOffset = firstItem.ortOffset || layoutOptions.ortSpacing;
                    position[layoutOptions.direction] = getInitPositionForDirection(line, layoutOptions, maxLineLength);
                    _each(line, function(_, item) {
                        var offset = item.offset || layoutOptions.spacing,
                            wrap = new WrapperLayoutElement(item.element, item.bbox),
                            itemBBox = new WrapperLayoutElement(null, {
                                x: position.x,
                                y: position.y,
                                width: item.width,
                                height: item.height
                            }),
                            itemLegend = that._items[item.itemIndex];
                        wrap.position({
                            of: itemBBox,
                            my: item.pos,
                            at: item.pos
                        });
                        itemLegend.bboxs.push(itemBBox);
                        position[layoutOptions.direction] += item[layoutOptions.measure] + offset;
                        itemIndex++
                    });
                    position[layoutOptions.ortDirection] += firstItem[layoutOptions.ortMeasure] + ortOffset
                });
                _each(this._items, function(_, item) {
                    var itemBBox = calculateBboxLabelAndMarker(item.bboxs[0].getLayoutOptions(), item.bboxs[1].getLayoutOptions()),
                        horizontal = that._options.columnItemSpacing / 2,
                        vertical = that._options.rowItemSpacing / 2;
                    item.tracker.left = itemBBox.left - horizontal;
                    item.tracker.right = itemBBox.right + horizontal;
                    item.tracker.top = itemBBox.top - vertical;
                    item.tracker.bottom = itemBBox.bottom + vertical
                })
            },
            _getItemsLayoutOptions: function() {
                var that = this,
                    options = that._options,
                    orientation = options.orientation,
                    layoutOptions = {
                        itemsAlignment: options.itemsAlignment,
                        orientation: options.orientation
                    },
                    width = that._size.width - 2 * options.paddingLeftRight,
                    height = that._size.height - 2 * options.paddingTopBottom;
                if (orientation === HORIZONTAL) {
                    layoutOptions.length = width;
                    layoutOptions.ortLength = height;
                    layoutOptions.spacing = options.columnItemSpacing;
                    layoutOptions.direction = "x";
                    layoutOptions.measure = WIDTH;
                    layoutOptions.ortMeasure = HEIGHT;
                    layoutOptions.ortDirection = "y";
                    layoutOptions.ortSpacing = options.rowItemSpacing;
                    layoutOptions.countItem = options.columnCount;
                    layoutOptions.ortCountItem = options.rowCount;
                    layoutOptions.marginTextLabel = 4;
                    layoutOptions.labelOffset = 7;
                    if (options.itemTextPosition === BOTTOM || options.itemTextPosition === TOP) {
                        layoutOptions.labelOffset = 4;
                        layoutOptions.markerOffset = true
                    }
                }
                else {
                    layoutOptions.length = height;
                    layoutOptions.ortLength = width;
                    layoutOptions.spacing = options.rowItemSpacing;
                    layoutOptions.direction = "y";
                    layoutOptions.measure = HEIGHT;
                    layoutOptions.ortMeasure = WIDTH;
                    layoutOptions.ortDirection = "x";
                    layoutOptions.ortSpacing = options.columnItemSpacing;
                    layoutOptions.countItem = options.rowCount;
                    layoutOptions.ortCountItem = options.columnCount;
                    layoutOptions.marginTextLabel = 7;
                    layoutOptions.labelOffset = 4;
                    if (options.itemTextPosition === RIGHT || options.itemTextPosition === LEFT) {
                        layoutOptions.labelOffset = 7;
                        layoutOptions.markerOffset = true
                    }
                }
                if (!layoutOptions.countItem)
                    if (layoutOptions.ortCountItem)
                        layoutOptions.countItem = _ceil(that._items.length / layoutOptions.ortCountItem);
                    else
                        layoutOptions.countItem = that._items.length;
                if (options.itemTextPosition === TOP || options.itemTextPosition === LEFT)
                    layoutOptions.inverseLabelPosition = true;
                layoutOptions.itemTextPosition = options.itemTextPosition;
                layoutOptions.ortCountItem = layoutOptions.ortCountItem || _ceil(that._items.length / layoutOptions.countItem);
                return layoutOptions
            },
            _adjustBackgroundSettings: function(locationOptions) {
                if (!this._background)
                    return;
                var border = locationOptions.border,
                    legendBox = this._insideLegendGroup.getBBox(),
                    backgroundSettings = {
                        x: _round(legendBox.x - locationOptions.paddingLeftRight),
                        y: _round(legendBox.y - locationOptions.paddingTopBottom),
                        width: _round(legendBox.width) + 2 * locationOptions.paddingLeftRight,
                        height: _round(legendBox.height) + 2 * locationOptions.paddingTopBottom,
                        opacity: locationOptions.backgroundOpacity
                    };
                if (border.visible && border.width && border.color && border.color !== NONE) {
                    backgroundSettings["stroke-width"] = border.width;
                    backgroundSettings.stroke = border.color;
                    backgroundSettings["stroke-opacity"] = border.opacity;
                    backgroundSettings.dashStyle = border.dashStyle;
                    backgroundSettings.rx = border.cornerRadius || 0;
                    backgroundSettings.ry = border.cornerRadius || 0
                }
                this._background.attr(backgroundSettings)
            },
            _setBoundingRect: function(margin) {
                if (!this._insideLegendGroup)
                    return;
                var box = this._insideLegendGroup.getBBox();
                box.height += margin.top + margin.bottom;
                box.width += margin.left + margin.right;
                box.x -= margin.left;
                box.y -= margin.top;
                this._boundingRect = box
            },
            getActionCallback: function(point) {
                var that = this;
                if (that._options.visible)
                    return function(act) {
                            var pointType = point.type,
                                seriesType = pointType || point.series.type;
                            if (pointType || seriesType === "pie" || seriesType === "doughnut" || seriesType === "donut")
                                that[act] && that[act](point.index)
                        };
                else
                    return $.noop
            },
            getLayoutOptions: function() {
                var options = this._options,
                    boundingRect = this._insideLegendGroup ? this._boundingRect : {
                        width: 0,
                        height: 0,
                        x: 0,
                        y: 0
                    };
                if (options) {
                    boundingRect.verticalAlignment = options.verticalAlignment;
                    boundingRect.horizontalAlignment = options.horizontalAlignment;
                    if (options.orientation === HORIZONTAL) {
                        boundingRect.cutLayoutSide = options.verticalAlignment;
                        boundingRect.cutSide = "vertical"
                    }
                    else if (options.horizontalAlignment === CENTER) {
                        boundingRect.cutLayoutSide = options.verticalAlignment;
                        boundingRect.cutSide = "vertical"
                    }
                    else {
                        boundingRect.cutLayoutSide = options.horizontalAlignment;
                        boundingRect.cutSide = "horizontal"
                    }
                    boundingRect.position = {
                        horizontal: options.horizontalAlignment,
                        vertical: options.verticalAlignment
                    };
                    return boundingRect
                }
                return null
            },
            shift: function(x, y) {
                var that = this,
                    box = {};
                if (that._insideLegendGroup) {
                    that._insideLegendGroup.attr({
                        translateX: x - that._boundingRect.x,
                        translateY: y - that._boundingRect.y
                    });
                    box = that._legendGroup.getBBox()
                }
                that._x1 = box.x;
                that._y1 = box.y;
                that._x2 = box.x + box.width;
                that._y2 = box.y + box.height;
                return that
            },
            getPosition: function() {
                return this._options.position
            },
            coordsIn: function(x, y) {
                return x >= this._x1 && x <= this._x2 && y >= this._y1 && y <= this._y2
            },
            getItemByCoord: function(x, y) {
                var items = this._items,
                    legendGroup = this._insideLegendGroup;
                x = x - legendGroup.attr("translateX");
                y = y - legendGroup.attr("translateY");
                for (var i = 0; i < items.length; i++)
                    if (inRect(items[i].tracker, x, y))
                        return items[i].tracker;
                return null
            },
            dispose: function() {
                var that = this;
                that._legendGroup = that._insideLegendGroup = that._renderer = that._options = that._data = that._items = null;
                return that
            }
        });
        var __getMarkerCreator = getMarkerCreator;
        viz._DEBUG_stubMarkerCreator = function(callback) {
            getMarkerCreator = function() {
                return callback
            }
        };
        viz._DEBUG_restoreMarkerCreator = function() {
            getMarkerCreator = __getMarkerCreator
        }
    })(DevExpress, jQuery);
    /*! Module viz-core, file range.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _isDate = commonUtils.isDate,
            NUMBER_EQUALITY_CORRECTION = 1,
            DATETIME_EQUALITY_CORRECTION = 60000,
            minSelector = "min",
            maxSelector = "max",
            minVisibleSelector = "minVisible",
            maxVisibleSelector = "maxVisible",
            categoriesSelector = "categories",
            baseSelector = "base",
            axisTypeSelector = "axisType",
            _Range;
        function otherLessThan(thisValue, otherValue) {
            return otherValue < thisValue
        }
        function otherGreaterThan(thisValue, otherValue) {
            return otherValue > thisValue
        }
        function compareAndReplace(thisValue, otherValue, setValue, compare) {
            var otherValueDefined = _isDefined(otherValue);
            if (_isDefined(thisValue)) {
                if (otherValueDefined && compare(thisValue, otherValue))
                    setValue(otherValue)
            }
            else if (otherValueDefined)
                setValue(otherValue)
        }
        function returnValue(value) {
            return value
        }
        function returnValueOf(value) {
            return value.valueOf()
        }
        function getUniqueCategories(categories, otherCategories, dataType) {
            var length = categories.length,
                found,
                i,
                j,
                valueOf = dataType === "datetime" ? returnValueOf : returnValue;
            if (otherCategories && otherCategories.length)
                for (i = 0; i < otherCategories.length; i++) {
                    for (j = 0, found = false; j < length; j++)
                        if (valueOf(categories[j]) === valueOf(otherCategories[i])) {
                            found = true;
                            break
                        }
                    !found && categories.push(otherCategories[i])
                }
            return categories
        }
        DX.viz.__NUMBER_EQUALITY_CORRECTION = NUMBER_EQUALITY_CORRECTION;
        DX.viz.__DATETIME_EQUALITY_CORRECTION = DATETIME_EQUALITY_CORRECTION;
        _Range = viz.Range = function(range) {
            range && $.extend(this, range)
        };
        _Range.prototype = {
            constructor: _Range,
            dispose: function() {
                this[categoriesSelector] = null
            },
            addRange: function(otherRange) {
                var that = this,
                    categories = that[categoriesSelector],
                    otherCategories = otherRange[categoriesSelector];
                var compareAndReplaceByField = function(field, compare) {
                        compareAndReplace(that[field], otherRange[field], function(value) {
                            that[field] = value
                        }, compare)
                    };
                var controlValuesByVisibleBounds = function(valueField, visibleValueField, compare) {
                        compareAndReplace(that[valueField], that[visibleValueField], function(value) {
                            _isDefined(that[valueField]) && (that[valueField] = value)
                        }, compare)
                    };
                var checkField = function(field) {
                        that[field] = that[field] || otherRange[field]
                    };
                if (commonUtils.isDefined(otherRange.stick))
                    that.stick = otherRange.stick;
                checkField("addSpiderCategory");
                checkField("percentStick");
                checkField("minSpaceCorrection");
                checkField("maxSpaceCorrection");
                checkField("invert");
                checkField(axisTypeSelector);
                checkField("dataType");
                if (that[axisTypeSelector] === "logarithmic")
                    checkField(baseSelector);
                else
                    that[baseSelector] = undefined;
                compareAndReplaceByField(minSelector, otherLessThan);
                compareAndReplaceByField(maxSelector, otherGreaterThan);
                if (that[axisTypeSelector] === "discrete") {
                    checkField(minVisibleSelector);
                    checkField(maxVisibleSelector)
                }
                else {
                    compareAndReplaceByField(minVisibleSelector, otherLessThan);
                    compareAndReplaceByField(maxVisibleSelector, otherGreaterThan)
                }
                compareAndReplaceByField("interval", otherLessThan);
                controlValuesByVisibleBounds(minSelector, minVisibleSelector, otherLessThan);
                controlValuesByVisibleBounds(minSelector, maxVisibleSelector, otherLessThan);
                controlValuesByVisibleBounds(maxSelector, maxVisibleSelector, otherGreaterThan);
                controlValuesByVisibleBounds(maxSelector, minVisibleSelector, otherGreaterThan);
                if (categories === undefined)
                    that[categoriesSelector] = otherCategories;
                else
                    that[categoriesSelector] = getUniqueCategories(categories, otherCategories, that.dataType);
                return this
            },
            isDefined: function() {
                return _isDefined(this[minSelector]) && _isDefined(this[maxSelector]) || _isDefined(this[categoriesSelector])
            },
            setStubData: function(dataType) {
                var that = this,
                    year = (new Date).getYear() - 1,
                    isDate = dataType === "datetime",
                    isCategories = that[axisTypeSelector] === "discrete";
                if (isCategories)
                    that.categories = ["0", "1", "2"];
                else {
                    that[minSelector] = isDate ? new Date(year, 0, 1) : 0;
                    that[maxSelector] = isDate ? new Date(year, 11, 31) : 10
                }
                that.stubData = true;
                return that
            },
            correctValueZeroLevel: function() {
                var that = this;
                if (that[axisTypeSelector] === "logarithmic" || _isDate(that[maxSelector]) || _isDate(that[minSelector]))
                    return that;
                function setZeroLevel(min, max) {
                    that[min] < 0 && that[max] < 0 && (that[max] = 0);
                    that[min] > 0 && that[max] > 0 && (that[min] = 0)
                }
                setZeroLevel(minSelector, maxSelector);
                setZeroLevel(minVisibleSelector, maxVisibleSelector);
                return that
            },
            checkZeroStick: function() {
                var that = this;
                if (that.min >= 0 && that.max >= 0)
                    that.minStickValue = 0;
                else if (that.min <= 0 && that.max <= 0)
                    that.maxStickValue = 0;
                return that
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file title.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            vizUtils = viz.utils,
            objectUtils = DX.require("/utils/utils.object"),
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            DEFAULT_MARGIN = 10,
            DEFAULT_GAP = 3;
        function hasText(text) {
            return _isDefined(text) && text.length > 0
        }
        function processTitleLength(elem, text, width) {
            var hasEllipsis = elem.attr({text: text}).applyEllipsis(width);
            hasEllipsis && elem.setTitle(text)
        }
        function validateMargins(options) {
            if (options.margin >= 0)
                options.margin = {
                    top: options.margin,
                    bottom: options.margin,
                    left: options.margin,
                    right: options.margin
                };
            else {
                options.margin = options.margin || {};
                options.margin = {
                    top: options.margin.top >= 0 ? options.margin.top : DEFAULT_MARGIN,
                    bottom: options.margin.bottom >= 0 ? options.margin.bottom : DEFAULT_MARGIN,
                    left: options.margin.left >= 0 ? options.margin.left : DEFAULT_MARGIN,
                    right: options.margin.right >= 0 ? options.margin.right : DEFAULT_MARGIN
                }
            }
        }
        function validateAlignments(options) {
            if (options.verticalAlignment !== "bottom")
                options.verticalAlignment = "top";
            if (options.horizontalAlignment !== "left" && options.horizontalAlignment !== "right")
                options.horizontalAlignment = "center"
        }
        function Title(params) {
            this._renderer = params.renderer;
            this._incidentOccured = params.incidentOccured;
            this._group = params.renderer.g().attr({"class": params.cssClass}).linkOn(params.renderer.root, {
                name: "title",
                after: "peripheral"
            })
        }
        viz.Title = Title;
        var titlePrototype = Title.prototype = objectUtils.clone(DX.viz.LayoutElement.prototype);
        $.extend(titlePrototype, {
            constructor: Title,
            dispose: function() {
                var that = this;
                that._group.linkOff();
                that._renderer = that._group = null;
                that._disposeInnerElements();
                that._options = null
            },
            _updateOptions: function(options) {
                validateAlignments(options);
                validateMargins(options);
                this._options = options
            },
            _updateStructure: function() {
                var that = this,
                    renderer = that._renderer,
                    group = that._group,
                    alignObj = {align: that._options.horizontalAlignment};
                if (!that._titleElement) {
                    that._titleElement = renderer.text().attr(alignObj).append(group);
                    that._subtitleElement = renderer.text().attr(alignObj);
                    that._clipRect = renderer.clipRect();
                    group.attr({clipId: that._clipRect.id})
                }
                group.linkAppend();
                hasText(that._options.subtitle.text) ? that._subtitleElement.append(group) : that._subtitleElement.remove()
            },
            _updateTexts: function() {
                var that = this,
                    options = that._options,
                    subtitleOptions = options.subtitle,
                    titleElement = that._titleElement,
                    subtitleElement = that._subtitleElement,
                    testText = "A",
                    titleBox,
                    y;
                titleElement.attr({
                    text: testText,
                    y: 0
                }).css(vizUtils.patchFontOptions(options.font));
                titleBox = titleElement.getBBox();
                that._titleTextY = titleBox.height + titleBox.y;
                titleElement.attr({text: options.text});
                titleBox = titleElement.getBBox();
                y = -titleBox.y;
                titleElement.attr({y: y});
                if (hasText(subtitleOptions.text)) {
                    y += titleBox.height + titleBox.y;
                    subtitleElement.attr({
                        text: subtitleOptions.text,
                        y: 0
                    }).css(vizUtils.patchFontOptions(subtitleOptions.font));
                    y += -subtitleElement.getBBox().y - that._titleTextY + DEFAULT_GAP;
                    subtitleElement.attr({y: y})
                }
            },
            _updateBoundingRectAlignment: function() {
                var boundingRect = this._boundingRect,
                    options = this._options;
                boundingRect.verticalAlignment = options.verticalAlignment;
                boundingRect.horizontalAlignment = options.horizontalAlignment;
                boundingRect.cutLayoutSide = options.verticalAlignment;
                boundingRect.cutSide = "vertical";
                boundingRect.position = {
                    horizontal: options.horizontalAlignment,
                    vertical: options.verticalAlignment
                }
            },
            update: function(options) {
                if (hasText(options.text)) {
                    this._updateOptions(options);
                    this._updateStructure();
                    this._updateTexts();
                    this._boundingRect = {};
                    this._updateBoundingRect();
                    this._updateBoundingRectAlignment()
                }
                else {
                    this._group.linkRemove();
                    this._boundingRect = null
                }
                return this
            },
            draw: function(width, height) {
                var that = this,
                    layoutOptions;
                that._group.linkAppend();
                that._correctTitleLength(width);
                layoutOptions = that.getLayoutOptions();
                if (layoutOptions.width > width || layoutOptions.height > height) {
                    that._incidentOccured("W2103");
                    that._group.linkRemove();
                    that._boundingRect.width = that._boundingRect.height = 0
                }
                return that
            },
            probeDraw: function(width, height) {
                this.draw(width, height);
                return this
            },
            _correctTitleLength: function(width) {
                var that = this,
                    options = that._options,
                    margin = options.margin,
                    maxWidth = width - margin.left - margin.right;
                processTitleLength(that._titleElement, options.text, maxWidth);
                that._subtitleElement && processTitleLength(that._subtitleElement, options.subtitle.text, maxWidth);
                that._updateBoundingRect()
            },
            _disposeInnerElements: function() {
                if (this._titleElement) {
                    this._titleElement.dispose();
                    this._subtitleElement.dispose();
                    this._clipRect.dispose();
                    this._titleElement = this._subtitleElement = this._clipRect = null
                }
            },
            getLayoutOptions: function() {
                return this._boundingRect || null
            },
            shift: function(x, y) {
                var that = this,
                    box = that.getLayoutOptions();
                that._group.move(x - box.x, y - box.y);
                that._setClipRectSettings();
                return that
            },
            _setClipRectSettings: function() {
                var bbox = this.getLayoutOptions();
                this._clipRect.attr({
                    x: bbox.x,
                    y: bbox.y,
                    width: bbox.width,
                    height: bbox.height
                })
            },
            _updateBoundingRect: function() {
                var that = this,
                    options = that._options,
                    margin = options.margin,
                    boundingRect = that._boundingRect,
                    box;
                box = that._group.getBBox();
                box.height += margin.top + margin.bottom - that._titleTextY;
                box.width += margin.left + margin.right;
                box.x -= margin.left;
                box.y += that._titleTextY - margin.top;
                if (options.placeholderSize > 0)
                    box.height = options.placeholderSize;
                boundingRect.height = box.height;
                boundingRect.width = box.width;
                boundingRect.x = box.x;
                boundingRect.y = box.y
            }
        });
        DX.viz.Title.prototype.DEBUG_getOptions = function() {
            return this._options
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file dataSource.js */
    (function($, DX, undefined) {
        var NONE_TYPE = 0,
            ARRAY_TYPE = 1,
            DX_DATA_SOURCE_TYPE = 2,
            CUSTOM_TYPE = 3,
            dxData = DX.data,
            commonUtils = DX.require("/utils/utils.common");
        function DataSource(dataSourceOnLoadCallback) {
            this._type = NONE_TYPE;
            this._changedCallback = dataSourceOnLoadCallback
        }
        DataSource.prototype = {
            constructor: DataSource,
            isLoaded: function() {
                var isLoaded = false;
                switch (this._type) {
                    case NONE_TYPE:
                        isLoaded = false;
                        break;
                    case ARRAY_TYPE:
                        isLoaded = true;
                        break;
                    case CUSTOM_TYPE:
                    case DX_DATA_SOURCE_TYPE:
                        isLoaded = this._dxDataSource.isLoaded();
                        break
                }
                return isLoaded
            },
            items: function() {
                var type = this._type;
                return type === DX_DATA_SOURCE_TYPE || type === CUSTOM_TYPE ? this._dxDataSource.items() : this._items
            },
            update: function(data) {
                var that = this,
                    dataSource,
                    changedCallback = that._changedCallback;
                that._clean();
                if (commonUtils.isDefined(data))
                    if (commonUtils.isArray(data)) {
                        that._items = data;
                        that._type = ARRAY_TYPE;
                        changedCallback()
                    }
                    else {
                        if (data instanceof dxData.DataSource) {
                            that._type = DX_DATA_SOURCE_TYPE;
                            dataSource = data
                        }
                        else {
                            that._type = CUSTOM_TYPE;
                            dataSource = new dxData.DataSource($.extend({paginate: false}, dxData.utils.normalizeDataSourceOptions(data)))
                        }
                        that._dxDataSource = dataSource;
                        dataSource.on("changed", changedCallback);
                        if (dataSource.isLoaded())
                            changedCallback();
                        else
                            dataSource.load()
                    }
            },
            dispose: function() {
                this._clean();
                this._changedCallback = null
            },
            _clean: function() {
                var that = this,
                    dxDataSource = that._dxDataSource;
                if (that._type === DX_DATA_SOURCE_TYPE)
                    dxDataSource.off("changed", that._changedCallback);
                else if (that._type === CUSTOM_TYPE)
                    dxDataSource.dispose();
                that._dxDataSource = that._items = that._type = null
            }
        };
        DX.viz.DataSource = DataSource
    })(jQuery, DevExpress);
    /*! Module viz-core, file numericTickManager.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            mathUtils = DX.require("/utils/utils.math"),
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _adjustValue = mathUtils.adjustValue,
            _math = Math,
            _abs = _math.abs,
            _ceil = _math.ceil,
            _floor = _math.floor,
            _noop = $.noop,
            MINOR_TICKS_COUNT_LIMIT = 200,
            DEFAULT_MINOR_NUMBER_MULTIPLIERS = [2, 4, 5, 8, 10];
        viz.outOfScreen = {
            x: -1000,
            y: -1000
        };
        viz.tickManager = {continuous: {
                _hasUnitBeginningTickCorrection: _noop,
                _checkBoundedDatesOverlapping: _noop,
                _correctInterval: function(step) {
                    this._tickInterval *= step
                },
                _correctMax: function(tickInterval) {
                    this._max = this._adjustNumericTickValue(_ceil(this._max / tickInterval) * tickInterval, tickInterval, this._min)
                },
                _correctMin: function(tickInterval) {
                    this._min = this._adjustNumericTickValue(_floor(this._min / tickInterval) * tickInterval, tickInterval, this._min)
                },
                _findBusinessDelta: function(min, max) {
                    return _adjustValue(_abs(min - max))
                },
                _findTickIntervalForCustomTicks: function() {
                    return _abs(this._customTicks[1] - this._customTicks[0])
                },
                _getBoundInterval: function() {
                    var that = this,
                        boundCoef = that._options.boundCoef;
                    return _isDefined(boundCoef) && isFinite(boundCoef) ? that._tickInterval * _abs(boundCoef) : that._tickInterval / 2
                },
                _getInterval: function(deltaCoef, numberMultipliers) {
                    var interval = deltaCoef || this._getDeltaCoef(this._screenDelta, this._businessDelta, this._options.gridSpacingFactor),
                        multipliers = numberMultipliers || this._options.numberMultipliers,
                        factor,
                        result = 0,
                        newResult,
                        hasResult = false,
                        i;
                    if (interval > 1.0)
                        for (factor = 1; !hasResult; factor *= 10)
                            for (i = 0; i < multipliers.length; i++) {
                                result = multipliers[i] * factor;
                                if (interval <= result) {
                                    hasResult = true;
                                    break
                                }
                            }
                    else if (interval > 0) {
                        result = 1;
                        for (factor = 0.1; !hasResult; factor /= 10)
                            for (i = multipliers.length - 1; i >= 0; i--) {
                                newResult = multipliers[i] * factor;
                                if (interval > newResult) {
                                    hasResult = true;
                                    break
                                }
                                result = newResult
                            }
                    }
                    return _adjustValue(result)
                },
                _getMarginValue: function(min, max, margin) {
                    return mathUtils.applyPrecisionByMinDelta(min, margin, _abs(max - min) * margin)
                },
                _getDefaultMinorInterval: function(screenDelta, businessDelta) {
                    var deltaCoef = this._getDeltaCoef(screenDelta, businessDelta, this._options.minorGridSpacingFactor),
                        multipliers = DEFAULT_MINOR_NUMBER_MULTIPLIERS,
                        i = multipliers.length - 1,
                        result;
                    for (i; i >= 0; i--) {
                        result = businessDelta / multipliers[i];
                        if (deltaCoef <= result)
                            return _adjustValue(result)
                    }
                    return 0
                },
                _getMinorInterval: function(screenDelta, businessDelta) {
                    var that = this,
                        options = that._options,
                        minorTickInterval = options.minorTickInterval,
                        minorTickCount = options.minorTickCount,
                        interval,
                        intervalsCount,
                        count;
                    if (isFinite(minorTickInterval) && that._isTickIntervalCorrect(minorTickInterval, MINOR_TICKS_COUNT_LIMIT, businessDelta)) {
                        interval = minorTickInterval;
                        count = interval < businessDelta ? _ceil(businessDelta / interval) - 1 : 0
                    }
                    else if (_isDefined(minorTickCount)) {
                        intervalsCount = _isDefined(minorTickCount) ? minorTickCount + 1 : _floor(screenDelta / options.minorGridSpacingFactor);
                        count = intervalsCount - 1;
                        interval = count > 0 ? businessDelta / intervalsCount : 0
                    }
                    else {
                        interval = that._getDefaultMinorInterval(screenDelta, businessDelta);
                        count = interval < businessDelta ? _floor(businessDelta / interval) - 1 : 0
                    }
                    that._minorTickInterval = interval;
                    that._minorTickCount = count
                },
                _getNextTickValue: function(value, tickInterval, isTickIntervalNegative) {
                    tickInterval = _isDefined(isTickIntervalNegative) && isTickIntervalNegative ? -tickInterval : tickInterval;
                    value += tickInterval;
                    return this._adjustNumericTickValue(value, tickInterval, this._min)
                },
                _isTickIntervalValid: function(tickInterval) {
                    return _isDefined(tickInterval) && isFinite(tickInterval) && tickInterval !== 0
                }
            }}
    })(jQuery, DevExpress);
    /*! Module viz-core, file datetimeTickManager.js */
    (function($, DX, undefined) {
        var dateUtils = DX.require("/utils/utils.date"),
            commonUtils = DX.require("/utils/utils.common"),
            tickManager = DX.viz.tickManager,
            _isDefined = commonUtils.isDefined,
            _convertDateUnitToMilliseconds = dateUtils.convertDateUnitToMilliseconds,
            _correctDateWithUnitBeginning = dateUtils.correctDateWithUnitBeginning,
            _dateToMilliseconds = dateUtils.dateToMilliseconds,
            _convertMillisecondsToDateUnits = dateUtils.convertMillisecondsToDateUnits,
            _math = Math,
            _abs = _math.abs,
            _ceil = _math.ceil,
            _floor = _math.floor,
            _round = _math.round,
            MINOR_TICKS_COUNT_LIMIT = 50,
            DEFAULT_DATETIME_MULTIPLIERS = {
                millisecond: [1, 2, 5, 10, 25, 100, 250, 300, 500],
                second: [1, 2, 3, 5, 10, 15, 20, 30],
                minute: [1, 2, 3, 5, 10, 15, 20, 30],
                hour: [1, 2, 3, 4, 6, 8, 12],
                day: [1, 2, 3, 5, 7, 10, 14],
                month: [1, 2, 3, 6]
            };
        function correctDate(date, tickInterval, correctionMethod) {
            var interval = _dateToMilliseconds(tickInterval),
                timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
            return new Date(Math[correctionMethod]((date - 0 - timezoneOffset) / interval) * interval + timezoneOffset)
        }
        tickManager.datetime = $.extend({}, tickManager.continuous, {
            _correctInterval: function(step) {
                var tickIntervalInMs = _dateToMilliseconds(this._tickInterval);
                this._tickInterval = _convertMillisecondsToDateUnits(tickIntervalInMs * step)
            },
            _correctMax: function(tickInterval) {
                this._max = correctDate(this._max, tickInterval, "ceil")
            },
            _correctMin: function(tickInterval) {
                this._min = correctDate(this._min, tickInterval, "floor");
                if (this._options.setTicksAtUnitBeginning)
                    _correctDateWithUnitBeginning(this._min, tickInterval)
            },
            _findTickIntervalForCustomTicks: function() {
                return _convertMillisecondsToDateUnits(_abs(this._customTicks[1] - this._customTicks[0]))
            },
            _getBoundInterval: function() {
                var that = this,
                    interval = that._tickInterval,
                    intervalInMs = _dateToMilliseconds(interval),
                    boundCoef = that._options.boundCoef,
                    boundIntervalInMs = _isDefined(boundCoef) && isFinite(boundCoef) ? intervalInMs * _abs(boundCoef) : intervalInMs / 2;
                return _convertMillisecondsToDateUnits(boundIntervalInMs)
            },
            _getInterval: function(deltaCoef) {
                var interval = deltaCoef || this._getDeltaCoef(this._screenDelta, this._businessDelta, this._options.gridSpacingFactor),
                    multipliers = this._options.numberMultipliers,
                    result = {},
                    factor,
                    i,
                    key,
                    specificMultipliers,
                    yearsCount;
                if (interval > 0 && interval < 1.0)
                    return {milliseconds: 1};
                if (interval === 0)
                    return 0;
                for (key in DEFAULT_DATETIME_MULTIPLIERS)
                    if (DEFAULT_DATETIME_MULTIPLIERS.hasOwnProperty(key)) {
                        specificMultipliers = DEFAULT_DATETIME_MULTIPLIERS[key];
                        for (i = 0; i < specificMultipliers.length; i++)
                            if (interval <= _convertDateUnitToMilliseconds(key, specificMultipliers[i])) {
                                result[key + 's'] = specificMultipliers[i];
                                return result
                            }
                    }
                for (factor = 1; ; factor *= 10)
                    for (i = 0; i < multipliers.length; i++) {
                        yearsCount = factor * multipliers[i];
                        if (interval <= _convertDateUnitToMilliseconds('year', yearsCount))
                            return {years: yearsCount}
                    }
                return 0
            },
            _getMarginValue: function(min, max, margin) {
                return _convertMillisecondsToDateUnits(_round(_abs(max - min) * margin))
            },
            _getMinorInterval: function(screenDelta, businessDelta) {
                var that = this,
                    options = that._options,
                    interval,
                    intervalInMs,
                    intervalsCount,
                    count;
                if (_isDefined(options.minorTickInterval) && that._isTickIntervalCorrect(options.minorTickInterval, MINOR_TICKS_COUNT_LIMIT, businessDelta)) {
                    interval = options.minorTickInterval;
                    intervalInMs = _dateToMilliseconds(interval);
                    count = intervalInMs < businessDelta ? _ceil(businessDelta / intervalInMs) - 1 : 0
                }
                else {
                    intervalsCount = _isDefined(options.minorTickCount) ? options.minorTickCount + 1 : _floor(screenDelta / options.minorGridSpacingFactor);
                    count = intervalsCount - 1;
                    interval = count > 0 ? _convertMillisecondsToDateUnits(businessDelta / intervalsCount) : 0
                }
                that._minorTickInterval = interval;
                that._minorTickCount = count
            },
            _getNextTickValue: function(value, tickInterval, isTickIntervalNegative, isTickIntervalWithPow, withCorrection) {
                var newValue = dateUtils.addInterval(value, tickInterval, isTickIntervalNegative);
                if (this._options.setTicksAtUnitBeginning && withCorrection !== false) {
                    _correctDateWithUnitBeginning(newValue, tickInterval, true);
                    this._correctDateWithUnitBeginningCalled = true
                }
                return newValue
            },
            _getUnitBeginningMinorTicks: function(minorTicks) {
                var that = this,
                    ticks = that._ticks,
                    tickInterval = that._findMinorTickInterval(ticks[1], ticks[2]),
                    isTickIntervalNegative = true,
                    isTickIntervalWithPow = false,
                    needCorrectTick = false,
                    startTick = that._getNextTickValue(ticks[1], tickInterval, isTickIntervalNegative, isTickIntervalWithPow, needCorrectTick);
                if (that._isTickIntervalValid(tickInterval))
                    minorTicks = that._createTicks(minorTicks, tickInterval, startTick, ticks[0], isTickIntervalNegative, isTickIntervalWithPow, needCorrectTick);
                return minorTicks
            },
            _hasUnitBeginningTickCorrection: function() {
                var ticks = this._ticks;
                if (ticks.length < 3)
                    return false;
                return ticks[1] - ticks[0] !== ticks[2] - ticks[1] && this._options.setTicksAtUnitBeginning && this._options.minorTickCount
            },
            _isTickIntervalValid: function(tickInterval) {
                return _isDefined(tickInterval) && _dateToMilliseconds(tickInterval) !== 0
            },
            _checkBoundedDatesOverlapping: function() {
                var dates = this._ticks,
                    overlappingBehavior = this.getOverlappingBehavior();
                return dates.length > 2 && overlappingBehavior.mode !== "stagger" && overlappingBehavior.mode !== "ignore" && !this._areDisplayValuesValid(dates[0], dates[1])
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file logarithmicTickManager.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            mathUtils = DX.require("/utils/utils.math"),
            dateUtils = DX.require("/utils/utils.date"),
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _addInterval = dateUtils.addInterval,
            _adjustValue = mathUtils.adjustValue,
            tickManager = viz.tickManager,
            tickManagerContinuous = tickManager.continuous,
            _getLog = mathUtils.getLog,
            _raiseTo = mathUtils.raiseTo,
            _math = Math,
            _abs = _math.abs,
            _ceil = _math.ceil,
            _floor = _math.floor,
            _round = _math.round;
        tickManager.logarithmic = $.extend({}, tickManagerContinuous, {
            _correctMax: function() {
                var base = this._options.base;
                this._max = _adjustValue(_raiseTo(_ceil(_adjustValue(_getLog(this._max, base))), base))
            },
            _correctMin: function() {
                var base = this._options.base;
                this._min = _adjustValue(_raiseTo(_floor(_adjustValue(_getLog(this._min, base))), base))
            },
            _findBusinessDelta: function(min, max, isTickIntervalWithPow) {
                var delta;
                if (min <= 0 || max <= 0)
                    return 0;
                if (isTickIntervalWithPow === false)
                    delta = tickManagerContinuous._findBusinessDelta(min, max);
                else
                    delta = _round(_abs(_getLog(min, this._options.base) - _getLog(max, this._options.base)));
                return delta
            },
            _findTickIntervalForCustomTicks: function() {
                return _adjustValue(_getLog(this._customTicks[1] / this._customTicks[0], this._options.base))
            },
            _getInterval: function(deltaCoef) {
                var interval = deltaCoef || this._getDeltaCoef(this._screenDelta, this._businessDelta, this._options.gridSpacingFactor),
                    multipliers = this._options.numberMultipliers,
                    factor,
                    result = 0,
                    hasResult = false,
                    i;
                if (interval !== 0)
                    for (factor = 1; !hasResult; factor *= 10)
                        for (i = 0; i < multipliers.length; i++) {
                            result = multipliers[i] * factor;
                            if (interval <= result) {
                                hasResult = true;
                                break
                            }
                        }
                return _adjustValue(result)
            },
            _getMinorInterval: function(screenDelta, businessDelta) {
                var that = this,
                    options = that._options,
                    minorTickCount = options.minorTickCount,
                    intervalsCount = _isDefined(minorTickCount) ? minorTickCount + 1 : _floor(screenDelta / options.minorGridSpacingFactor),
                    count = intervalsCount - 1,
                    interval = count > 0 ? businessDelta / intervalsCount : 0;
                that._minorTickInterval = interval;
                that._minorTickCount = count
            },
            _getMarginValue: function() {
                return null
            },
            _getNextTickValue: function(value, tickInterval, isTickIntervalNegative, isTickIntervalWithPow) {
                var that = this,
                    pow,
                    nextTickValue;
                tickInterval = _isDefined(isTickIntervalNegative) && isTickIntervalNegative ? -tickInterval : tickInterval;
                if (isTickIntervalWithPow === false)
                    nextTickValue = value + tickInterval;
                else {
                    pow = _addInterval(_getLog(value, that._options.base), tickInterval, that._min > that._max);
                    nextTickValue = _adjustValue(_raiseTo(pow, that._options.base))
                }
                return nextTickValue
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file tickOverlappingManager.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            tickManagerNS = viz.tickManager,
            overlappingMethods,
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _isNumber = commonUtils.isNumber,
            _math = Math,
            _abs = _math.abs,
            _ceil = _math.ceil,
            _floor = _math.floor,
            _atan = _math.atan,
            _max = _math.max,
            _each = $.each,
            _noop = $.noop,
            _isFunction = $.isFunction,
            _extend = $.extend,
            SCREEN_DELTA_KOEF = 4,
            AXIS_STAGGER_OVERLAPPING_KOEF = 2,
            STAGGER = "stagger",
            MIN_ARRANGEMENT_TICKS_COUNT = 2;
        function defaultGetTextFunc(value) {
            return value.toString()
        }
        overlappingMethods = tickManagerNS.overlappingMethods = {};
        overlappingMethods.base = {
            _applyOverlappingBehavior: function() {
                var that = this,
                    options = that._options,
                    overlappingBehavior = options.overlappingBehavior;
                if (overlappingBehavior.mode !== "ignore") {
                    that._useAutoArrangement = true;
                    that._correctTicks();
                    if (overlappingBehavior.mode === STAGGER)
                        that._screenDelta *= AXIS_STAGGER_OVERLAPPING_KOEF;
                    that._applyAutoArrangement()
                }
            },
            checkBoundedTicksOverlapping: function() {
                return {
                        overlappedDates: this._checkBoundedDatesOverlapping(),
                        overlappedStartEnd: this._checkStartEndOverlapping()
                    }
            },
            getMaxLabelParams: function(ticks) {
                var that = this,
                    getText = that._options.getText || defaultGetTextFunc,
                    tickWithMaxLength,
                    tickTextWithMaxLength,
                    maxLength = 0;
                ticks = ticks || that._calculateMajorTicks();
                _each(ticks, function(_, item) {
                    var text = getText(item, that._options.labelOptions),
                        length = _isDefined(text) ? text.length : -1;
                    if (maxLength < length) {
                        maxLength = length;
                        tickWithMaxLength = item;
                        tickTextWithMaxLength = text
                    }
                });
                return maxLength > 0 ? that._getTextElementBbox(tickWithMaxLength, tickTextWithMaxLength) : {
                        width: 0,
                        height: 0,
                        length: 0,
                        y: 0
                    }
            },
            _applyAutoArrangement: function() {
                var that = this,
                    options = that._options,
                    arrangementStep,
                    maxDisplayValueSize;
                if (that._useAutoArrangement) {
                    maxDisplayValueSize = that._getTicksSize();
                    arrangementStep = that._getAutoArrangementStep(maxDisplayValueSize);
                    if (arrangementStep > 1)
                        if (_isDefined(that._tickInterval) || _isDefined(that._customTicks))
                            that._ticks = that._getAutoArrangementTicks(arrangementStep);
                        else {
                            options.gridSpacingFactor = maxDisplayValueSize;
                            that._ticks = that._createTicks([], that._findTickInterval(), that._min, that._max)
                        }
                }
            },
            _getAutoArrangementTicks: function(step) {
                var that = this,
                    ticks = that._ticks,
                    ticksLength = ticks.length,
                    resultTicks = ticks,
                    decimatedTicks = that._decimatedTicks || [],
                    i;
                if (step > 1) {
                    resultTicks = [];
                    for (i = 0; i < ticksLength; i++)
                        if (i % step === 0)
                            resultTicks.push(ticks[i]);
                        else
                            decimatedTicks.push(ticks[i]);
                    that._correctInterval(step)
                }
                return resultTicks
            },
            _isOverlappedTicks: function(screenDelta) {
                return this._getAutoArrangementStep(this._getTicksSize(), screenDelta, -1) > 1
            },
            _areDisplayValuesValid: function(value1, value2) {
                var that = this,
                    options = that._options,
                    getText = options.getText || defaultGetTextFunc,
                    rotationAngle = options.overlappingBehavior && _isNumber(options.overlappingBehavior.rotationAngle) ? options.overlappingBehavior.rotationAngle : 0,
                    bBox1 = that._getTextElementBbox(value1, getText(value1, options.labelOptions)),
                    bBox2 = that._getTextElementBbox(value2, getText(value2, options.labelOptions)),
                    horizontalInverted = bBox1.x > bBox2.x,
                    verticalInverted = bBox1.y > bBox2.y,
                    hasHorizontalOverlapping,
                    hasVerticalOverlapping,
                    result;
                if (rotationAngle !== 0)
                    result = that._getDistanceByAngle(bBox1.height, rotationAngle) <= _abs(bBox2.x - bBox1.x);
                else {
                    hasHorizontalOverlapping = !horizontalInverted ? bBox1.x + bBox1.width > bBox2.x : bBox2.x + bBox2.width > bBox1.x;
                    hasVerticalOverlapping = !verticalInverted ? bBox1.y + bBox1.height > bBox2.y : bBox2.y + bBox2.height > bBox1.y;
                    result = !(hasHorizontalOverlapping && hasVerticalOverlapping)
                }
                return result
            }
        };
        overlappingMethods.circular = _extend({}, overlappingMethods.base, {
            _correctTicks: _noop,
            _getTextElementBbox: function(value, text) {
                var textOptions = _extend({}, this._options.textOptions, {rotate: 0}),
                    delta = _isFunction(this._options.translate) ? this._options.translate(value) : {
                        x: 0,
                        y: 0
                    },
                    bbox;
                text = this._options.renderText(text, delta.x, delta.y).css(this._options.textFontStyles).attr(textOptions);
                bbox = text.getBBox();
                text.remove();
                return bbox
            },
            _getTicksSize: function() {
                return this.getMaxLabelParams(this._ticks)
            },
            _checkStartEndOverlapping: function() {
                var ticks = this._ticks,
                    lastTick = ticks[ticks.length - 1];
                return ticks.length > 1 && !this._areDisplayValuesValid(ticks[0], lastTick)
            },
            _getAutoArrangementStep: function(maxDisplayValueSize) {
                var that = this,
                    options = that._options,
                    radius = options.circularRadius,
                    startAngle = options.circularStartAngle,
                    endAngle = options.circularEndAngle,
                    circleDelta = startAngle === endAngle ? 360 : _abs(startAngle - endAngle),
                    businessDelta = that._businessDelta || that._ticks.length,
                    degreesPerTick = that._tickInterval * circleDelta / businessDelta,
                    width = maxDisplayValueSize.width,
                    height = maxDisplayValueSize.height,
                    angle1 = _abs(2 * _atan(height / (2 * radius - width)) * 180 / _math.PI),
                    angle2 = _abs(2 * _atan(width / (2 * radius - height)) * 180 / _math.PI),
                    minAngleForTick = _max(angle1, angle2),
                    step = 1;
                if (degreesPerTick < minAngleForTick)
                    step = _ceil(minAngleForTick / degreesPerTick);
                return _max(1, step)
            }
        });
        overlappingMethods.linear = _extend({}, overlappingMethods.base, {
            _correctTicks: function() {
                var getIntervalFunc = tickManagerNS.continuous._getInterval,
                    arrangementStep;
                if (this._testingGetIntervalFunc)
                    getIntervalFunc = this._testingGetIntervalFunc;
                arrangementStep = _ceil(getIntervalFunc.call(this, this._getDeltaCoef(this._screenDelta * SCREEN_DELTA_KOEF, this._ticks.length))) || this._ticks.length;
                this._appliedArrangementStep = arrangementStep;
                this._ticks = this._getAutoArrangementTicks(arrangementStep)
            },
            _getTextElementBbox: function(value, text) {
                var textOptions = _extend({}, this._options.textOptions, {rotate: 0}),
                    x = 0,
                    y = 0,
                    delta = _isFunction(this._options.translate) ? this._options.translate(value) : 0,
                    bbox;
                if (this._options.isHorizontal)
                    x += delta;
                else
                    y += delta;
                text = this._options.renderText(text, x, y).css(this._options.textFontStyles).attr(textOptions);
                bbox = text.getBBox();
                text.remove();
                return bbox
            },
            _checkStartEndOverlapping: _noop,
            _getAutoArrangementStep: function(maxDisplayValueSize, screenDelta, minArrangementTicksStep) {
                var that = this,
                    options = that._options,
                    requiredValuesCount,
                    textSpacing = options.textSpacing || 0,
                    addedSpacing = options.isHorizontal ? textSpacing : 0;
                screenDelta = screenDelta || that._screenDelta;
                minArrangementTicksStep = _isDefined(minArrangementTicksStep) ? minArrangementTicksStep : 1;
                if (options.getCustomAutoArrangementStep)
                    return options.getCustomAutoArrangementStep(that._ticks, options);
                if (maxDisplayValueSize > 0) {
                    requiredValuesCount = _floor((screenDelta + textSpacing) / (maxDisplayValueSize + addedSpacing));
                    requiredValuesCount = requiredValuesCount <= minArrangementTicksStep ? MIN_ARRANGEMENT_TICKS_COUNT : requiredValuesCount;
                    return _ceil((options.ticksCount || that._ticks.length) / requiredValuesCount)
                }
                return 1
            },
            _getDistanceByAngle: function(elementHeight, rotationAngle) {
                return elementHeight / _abs(_math.sin(rotationAngle * (_math.PI / 180)))
            },
            _getTicksSize: function() {
                var bBox = this.getMaxLabelParams(this._ticks),
                    options = this._options,
                    rotationAngle = options.overlappingBehavior ? options.overlappingBehavior.rotationAngle : 0,
                    isRotate = _isNumber(rotationAngle) && rotationAngle !== 0;
                return _ceil(isRotate ? this._getDistanceByAngle(bBox.height, rotationAngle) : options.isHorizontal ? bBox.width : bBox.height)
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseTickManager.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            coreTickManager = viz.tickManager,
            TickManager,
            dateUtils = DX.require("/utils/utils.date"),
            commonUtils = DX.require("/utils/utils.common"),
            formatHelper = DX.require("/utils/utils.formatHelper"),
            _isDefined = commonUtils.isDefined,
            _isNumber = commonUtils.isNumber,
            _addInterval = dateUtils.addInterval,
            mathUtils = DX.require("/utils/utils.math"),
            _adjustValue = mathUtils.adjustValue,
            _map = viz.utils.map,
            _each = $.each,
            _inArray = $.inArray,
            _noop = $.noop,
            DEFAULT_GRID_SPACING_FACTOR = 30,
            DEFAULT_MINOR_GRID_SPACING_FACTOR = 15,
            DEFAULT_NUMBER_MULTIPLIERS = [1, 2, 3, 5],
            TICKS_COUNT_LIMIT = 2000,
            MIN_ARRANGEMENT_TICKS_COUNT = 2;
        function getUniqueValues(array) {
            var lastValue = array[0],
                currentValue,
                result = [lastValue.obj],
                length = array.length,
                i = 1;
            for (i; i < length; i++) {
                currentValue = array[i];
                if (lastValue.value !== currentValue.value) {
                    result.push(currentValue.obj);
                    lastValue = currentValue
                }
            }
            return result
        }
        function concatAndSort(array1, array2) {
            if (!array1.length && !array2.length)
                return [];
            var array = array1.concat(array2),
                values = [],
                length = array.length,
                hasNull = false,
                i = 0;
            for (i; i < length; i++)
                if (array[i] !== null)
                    values.push({
                        obj: array[i],
                        value: array[i].valueOf()
                    });
                else
                    hasNull = true;
            values.sort(function(x, y) {
                return x.value - y.value
            });
            values = getUniqueValues(values);
            hasNull && values.push(null);
            return values
        }
        coreTickManager.discrete = $.extend({}, coreTickManager.continuous, {
            _calculateMinorTicks: _noop,
            _findTickInterval: _noop,
            _createTicks: function() {
                return []
            },
            _getMarginValue: _noop,
            _generateBounds: _noop,
            _correctMin: _noop,
            _correctMax: _noop,
            _findBusinessDelta: _noop,
            _addBoundedTicks: _noop,
            getFullTicks: function() {
                return this._customTicks
            },
            getMinorTicks: function() {
                return this._decimatedTicks || []
            },
            _findTickIntervalForCustomTicks: function() {
                return 1
            }
        });
        TickManager = coreTickManager.TickManager = function(types, data, options) {
            options = options || {};
            this.update(types || {}, data || {}, options);
            this._initOverlappingMethods(options.overlappingBehaviorType)
        };
        TickManager.prototype = {
            constructor: TickManager,
            dispose: function() {
                this._ticks = null;
                this._minorTicks = null;
                this._decimatedTicks = null;
                this._boundaryTicks = null;
                this._options = null
            },
            update: function(types, data, options) {
                this._updateOptions(options || {});
                this._min = data.min;
                this._updateTypes(types || {});
                this._updateData(data || {})
            },
            _updateMinMax: function(data) {
                var min = data.min || 0,
                    max = data.max || 0,
                    newMinMax = this._applyMinMaxMargins(min, max);
                this._min = this._originalMin = newMinMax.min;
                this._max = this._originalMax = newMinMax.max;
                this._updateBusinessDelta()
            },
            _updateBusinessDelta: function() {
                this._businessDelta = this._findBusinessDelta && this._findBusinessDelta(this._min, this._max)
            },
            _updateTypes: function(types) {
                var that = this,
                    axisType = that._validateAxisType(types.axisType),
                    dataType = that._validateDataType(types.dataType);
                that._resetMethods();
                this._axisType = axisType;
                this._dataType = dataType;
                this._initMethods()
            },
            _updateData: function(data) {
                data = $.extend({}, data);
                data.min = _isDefined(data.min) ? data.min : this._originalMin;
                data.max = _isDefined(data.max) ? data.max : this._originalMax;
                this._updateMinMax(data);
                this._customTicks = data.customTicks && data.customTicks.slice();
                this._customMinorTicks = data.customMinorTicks;
                this._screenDelta = data.screenDelta || 0
            },
            _updateOptions: function(options) {
                var opt;
                this._options = opt = options;
                this._useAutoArrangement = !!this._options.useTicksAutoArrangement;
                opt.gridSpacingFactor = opt.gridSpacingFactor || DEFAULT_GRID_SPACING_FACTOR;
                opt.minorGridSpacingFactor = opt.minorGridSpacingFactor || DEFAULT_MINOR_GRID_SPACING_FACTOR;
                opt.numberMultipliers = opt.numberMultipliers || DEFAULT_NUMBER_MULTIPLIERS
            },
            getTickBounds: function() {
                return {
                        minVisible: this._minBound,
                        maxVisible: this._maxBound
                    }
            },
            getTicks: function(withoutOverlappingBehavior) {
                var that = this,
                    options = that._options;
                that._ticks = that._calculateMajorTicks();
                that._checkLabelFormat();
                that._decimatedTicks = [];
                that._applyAutoArrangement();
                !withoutOverlappingBehavior && that._applyOverlappingBehavior();
                that._generateBounds();
                if (options.showMinorTicks)
                    that._minorTicks = that._calculateMinorTicks();
                that._addBoundedTicks();
                return that._ticks
            },
            getMinorTicks: function() {
                var that = this,
                    decimatedTicks = that.getDecimatedTicks(),
                    options = that._options || {},
                    hasDecimatedTicks = decimatedTicks.length,
                    hasMinorTickOptions = _isDefined(options.minorTickInterval) || _isDefined(options.minorTickCount),
                    hasCustomMinorTicks = that._customMinorTicks && that._customMinorTicks.length,
                    hasMinorTicks = options.showMinorTicks && (hasMinorTickOptions || hasCustomMinorTicks),
                    ticks = hasDecimatedTicks && !hasMinorTicks ? decimatedTicks : that._minorTicks || [];
                return concatAndSort(ticks, [])
            },
            getDecimatedTicks: function() {
                return this._decimatedTicks || []
            },
            getFullTicks: function() {
                var that = this,
                    needCalculateMinorTicks = that._ticks && !that._minorTicks,
                    minorTicks = needCalculateMinorTicks ? that._calculateMinorTicks() : that._minorTicks || [];
                return concatAndSort(that._ticks || [], minorTicks.concat(that.getBoundaryTicks()))
            },
            getBoundaryTicks: function() {
                return this._boundaryTicks || []
            },
            getTickInterval: function() {
                return this._tickInterval
            },
            getMinorTickInterval: function() {
                return this._minorTickInterval
            },
            getOverlappingBehavior: function() {
                return this._options.overlappingBehavior
            },
            getOptions: function() {
                return this._options
            },
            _calculateMajorTicks: function() {
                var that = this,
                    ticks;
                if (that._options.showCalculatedTicks || !that._customTicks)
                    ticks = that._createTicks(that._options.showCalculatedTicks ? that._customTicks || [] : [], that._findTickInterval(), that._min, that._max);
                else {
                    ticks = that._customTicks.slice();
                    that._tickInterval = ticks.length > 1 ? that._findTickIntervalForCustomTicks() : 0
                }
                return ticks
            },
            _applyMargin: function(margin, min, max, isNegative) {
                var coef,
                    value = min;
                if (isFinite(margin)) {
                    coef = this._getMarginValue(min, max, margin);
                    if (coef)
                        value = this._getNextTickValue(min, coef, isNegative, false)
                }
                return value
            },
            _applyMinMaxMargins: function(min, max) {
                var options = this._options,
                    newMin = min > max ? max : min,
                    newMax = max > min ? max : min;
                this._minCorrectionEnabled = this._getCorrectionEnabled(min, "min");
                this._maxCorrectionEnabled = this._getCorrectionEnabled(max, "max");
                if (options && !options.stick) {
                    newMin = this._applyMargin(options.minValueMargin, min, max, true);
                    newMax = this._applyMargin(options.maxValueMargin, max, min, false)
                }
                return {
                        min: newMin,
                        max: newMax
                    }
            },
            _checkBoundedTickInArray: function(value, array) {
                var arrayValues = _map(array || [], function(item) {
                        return item.valueOf()
                    }),
                    minorTicksIndex = _inArray(value.valueOf(), arrayValues);
                if (minorTicksIndex !== -1)
                    array.splice(minorTicksIndex, 1)
            },
            _checkLabelFormat: function() {
                var options = this._options;
                if (this._dataType === "datetime" && !options.hasLabelFormat && this._ticks.length)
                    options.labelOptions.format = options.isMarkersVisible ? dateUtils.getDateUnitInterval(this._tickInterval) : formatHelper.getDateFormatByTicks(this._ticks)
            },
            _generateBounds: function() {
                var that = this,
                    interval = that._getBoundInterval(),
                    stick = that._options.stick,
                    minStickValue = that._options.minStickValue,
                    maxStickValue = that._options.maxStickValue,
                    minBound = that._minCorrectionEnabled && !stick ? that._getNextTickValue(that._min, interval, true) : that._originalMin,
                    maxBound = that._maxCorrectionEnabled && !stick ? that._getNextTickValue(that._max, interval) : that._originalMax;
                that._minBound = minBound < minStickValue ? minStickValue : minBound;
                that._maxBound = maxBound > maxStickValue ? maxStickValue : maxBound
            },
            _initOverlappingMethods: function(type) {
                this._initMethods(coreTickManager.overlappingMethods[type || "linear"])
            },
            _addBoundedTicks: function() {
                var that = this,
                    tickValues = _map(that._ticks, function(tick) {
                        return tick.valueOf()
                    }),
                    min = that._originalMin,
                    max = that._originalMax,
                    addMinMax = that._options.addMinMax || {};
                that._boundaryTicks = [];
                if (addMinMax.min && _inArray(min.valueOf(), tickValues) === -1) {
                    that._boundaryTicks.push(min);
                    that._checkBoundedTickInArray(min, that._minorTicks);
                    that._checkBoundedTickInArray(min, that._decimatedTicks)
                }
                if (addMinMax.max && _inArray(max.valueOf(), tickValues) === -1) {
                    that._boundaryTicks.push(max);
                    that._checkBoundedTickInArray(max, that._minorTicks);
                    that._checkBoundedTickInArray(max, that._decimatedTicks)
                }
            },
            _getCorrectionEnabled: function(value, marginSelector) {
                var options = this._options || {},
                    hasPercentStick = options.percentStick && Math.abs(value) === 1,
                    hasValueMargin = options[marginSelector + "ValueMargin"];
                return !hasPercentStick && !hasValueMargin
            },
            _validateAxisType: function(type) {
                var defaultType = "continuous",
                    allowedTypes = {
                        continuous: true,
                        discrete: true,
                        logarithmic: true
                    };
                return allowedTypes[type] ? type : defaultType
            },
            _validateDataType: function(type) {
                var allowedTypes = {
                        numeric: true,
                        datetime: true,
                        string: true
                    };
                if (!allowedTypes[type])
                    type = _isDefined(this._min) ? this._getDataType(this._min) : "numeric";
                return type
            },
            _getDataType: function(value) {
                return commonUtils.isDate(value) ? "datetime" : "numeric"
            },
            _getMethods: function() {
                var methods;
                if (this._axisType === "continuous")
                    methods = this._dataType === "datetime" ? coreTickManager.datetime : coreTickManager.continuous;
                else
                    methods = coreTickManager[this._axisType] || coreTickManager.continuous;
                return methods
            },
            _resetMethods: function() {
                var that = this,
                    methods = that._getMethods();
                _each(methods, function(name) {
                    if (that[name])
                        delete that[name]
                })
            },
            _initMethods: function(methods) {
                var that = this;
                methods = methods || that._getMethods();
                _each(methods, function(name, func) {
                    that[name] = func
                })
            },
            _getDeltaCoef: function(screenDelta, businessDelta, gridSpacingFactor) {
                var count;
                gridSpacingFactor = gridSpacingFactor || this._options.gridSpacingFactor;
                screenDelta = screenDelta || this._screenDelta;
                businessDelta = businessDelta || this._businessDelta;
                count = screenDelta / gridSpacingFactor;
                count = count <= 1 ? MIN_ARRANGEMENT_TICKS_COUNT : count;
                return businessDelta / count
            },
            _adjustNumericTickValue: function(value, interval, min) {
                return commonUtils.isExponential(value) ? _adjustValue(value) : mathUtils.applyPrecisionByMinDelta(min, interval, value)
            },
            _isTickIntervalCorrect: function(tickInterval, tickCountLimit, businessDelta) {
                var date;
                businessDelta = businessDelta || this._businessDelta;
                if (!_isNumber(tickInterval)) {
                    date = new Date;
                    tickInterval = _addInterval(date, tickInterval) - date;
                    if (!tickInterval)
                        return false
                }
                if (_isNumber(tickInterval))
                    if (tickInterval > 0 && businessDelta / tickInterval > tickCountLimit) {
                        if (this._options.incidentOccured)
                            this._options.incidentOccured("W2003")
                    }
                    else
                        return true;
                return false
            },
            _correctValue: function(valueTypeSelector, tickInterval, correctionMethod) {
                var that = this,
                    correctionEnabledSelector = "_" + valueTypeSelector + "CorrectionEnabled",
                    spaceCorrectionSelector = valueTypeSelector + "SpaceCorrection",
                    valueSelector = "_" + valueTypeSelector,
                    minStickValue = that._options.minStickValue,
                    maxStickValue = that._options.maxStickValue;
                if (that[correctionEnabledSelector]) {
                    if (that._options[spaceCorrectionSelector])
                        that[valueSelector] = that._getNextTickValue(that[valueSelector], tickInterval, valueTypeSelector === "min");
                    correctionMethod.call(this, tickInterval)
                }
                if (valueTypeSelector === "min")
                    that[valueSelector] = that[valueSelector] < minStickValue ? minStickValue : that[valueSelector];
                if (valueTypeSelector === "max")
                    that[valueSelector] = that[valueSelector] > maxStickValue ? maxStickValue : that[valueSelector]
            },
            _findTickInterval: function() {
                var that = this,
                    options = that._options,
                    tickInterval;
                tickInterval = that._isTickIntervalValid(options.tickInterval) && that._isTickIntervalCorrect(options.tickInterval, TICKS_COUNT_LIMIT) ? options.tickInterval : that._getInterval();
                if (that._isTickIntervalValid(tickInterval)) {
                    that._correctValue("min", tickInterval, that._correctMin);
                    that._correctValue("max", tickInterval, that._correctMax);
                    that._updateBusinessDelta()
                }
                that._tickInterval = tickInterval;
                return tickInterval
            },
            _findMinorTickInterval: function(firstTick, secondTick) {
                var that = this,
                    ticks = that._ticks,
                    intervals = that._options.stick ? ticks.length - 1 : ticks.length;
                if (intervals < 1)
                    intervals = 1;
                that._getMinorInterval(that._screenDelta / intervals, that._findBusinessDelta(firstTick, secondTick, false));
                return that._minorTickInterval
            },
            _createMinorTicks: function(ticks, firstTick, secondTick) {
                var that = this,
                    tickInterval = that._findMinorTickInterval(firstTick, secondTick),
                    isTickIntervalNegative = false,
                    isTickIntervalWithPow = false,
                    needCorrectTick = false,
                    startTick = that._getNextTickValue(firstTick, tickInterval, isTickIntervalNegative, isTickIntervalWithPow, needCorrectTick);
                if (that._isTickIntervalValid(tickInterval))
                    ticks = that._createCountedTicks(ticks, tickInterval, startTick, secondTick, that._minorTickCount, isTickIntervalNegative, isTickIntervalWithPow, needCorrectTick);
                return ticks
            },
            _calculateMinorTicks: function() {
                var that = this,
                    options = that._options,
                    minorTicks = [],
                    ticks = that._ticks,
                    ticksLength = ticks.length,
                    hasUnitBeginningTick = that._hasUnitBeginningTickCorrection(),
                    i = hasUnitBeginningTick ? 1 : 0;
                if (options.showMinorCalculatedTicks || !that._customMinorTicks) {
                    if (ticks.length) {
                        minorTicks = that._getBoundedMinorTicks(minorTicks, that._minBound, ticks[0], true);
                        if (hasUnitBeginningTick)
                            minorTicks = that._getUnitBeginningMinorTicks(minorTicks);
                        for (i; i < ticksLength - 1; i++)
                            minorTicks = that._createMinorTicks(minorTicks, ticks[i], ticks[i + 1]);
                        minorTicks = that._getBoundedMinorTicks(minorTicks, that._maxBound, ticks[ticksLength - 1])
                    }
                    else
                        minorTicks = that._createMinorTicks(minorTicks, that._minBound, that._maxBound);
                    options.showMinorCalculatedTicks && (minorTicks = minorTicks.concat(that._customMinorTicks || []))
                }
                else
                    minorTicks = that._customMinorTicks;
                return minorTicks
            },
            _createCountedTicks: function(ticks, tickInterval, min, max, count, isTickIntervalWithPow, needMax) {
                var value = min,
                    i;
                for (i = 0; i < count; i++) {
                    if (!(needMax === false && value.valueOf() === max.valueOf()))
                        ticks.push(value);
                    value = this._getNextTickValue(value, tickInterval, false, isTickIntervalWithPow, false)
                }
                return ticks
            },
            _createTicks: function(ticks, tickInterval, min, max, isTickIntervalNegative, isTickIntervalWithPow, withCorrection) {
                var that = this,
                    value = min,
                    newValue = min,
                    leftBound,
                    rightBound,
                    boundedRule;
                if (that._isTickIntervalValid(tickInterval)) {
                    boundedRule = min - max < 0;
                    do {
                        value = newValue;
                        if (that._options.stick) {
                            if (value >= that._originalMin && value <= that._originalMax)
                                ticks.push(value)
                        }
                        else
                            ticks.push(value);
                        newValue = that._getNextTickValue(value, tickInterval, isTickIntervalNegative, isTickIntervalWithPow, withCorrection);
                        if (value.valueOf() === newValue.valueOf())
                            break;
                        leftBound = newValue - min >= 0;
                        rightBound = max - newValue >= 0
                    } while (boundedRule === leftBound && boundedRule === rightBound)
                }
                else
                    ticks.push(value);
                return ticks
            },
            _getBoundedMinorTicks: function(minorTicks, boundedTick, tick, isNegative) {
                var that = this,
                    needCorrectTick = false,
                    nextTick = that._tickInterval ? this._getNextTickValue(tick, that._tickInterval, isNegative, true, needCorrectTick) : boundedTick,
                    tickInterval = that._findMinorTickInterval(tick, nextTick),
                    isTickIntervalCorrect = that._isTickIntervalCorrect(tickInterval, TICKS_COUNT_LIMIT, that._findBusinessDelta(tick, boundedTick, false)),
                    startTick,
                    endTick,
                    boundedTickValue = boundedTick.valueOf();
                if (isTickIntervalCorrect && that._isTickIntervalValid(tickInterval) && that._minorTickCount > 0) {
                    if (isNegative) {
                        if (tick.valueOf() <= boundedTickValue)
                            return minorTicks;
                        while (nextTick.valueOf() < boundedTickValue)
                            nextTick = this._getNextTickValue(nextTick, tickInterval, false, false, needCorrectTick);
                        startTick = nextTick;
                        endTick = that._getNextTickValue(tick, tickInterval, true, false, false)
                    }
                    else {
                        startTick = that._getNextTickValue(tick, tickInterval, false, false, false);
                        endTick = boundedTick
                    }
                    minorTicks = that._createTicks(minorTicks, tickInterval, startTick, endTick, false, false, needCorrectTick)
                }
                return minorTicks
            },
            getTypes: function() {
                return {
                        axisType: this._axisType,
                        dataType: this._dataType
                    }
            },
            getData: function() {
                return {
                        min: this._min,
                        max: this._max,
                        customTicks: this._customTicks,
                        customMinorTicks: this._customMinorTicks,
                        screenDelta: this._screenDelta
                    }
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file axesConstants.js */
    (function($, DX, undefined) {
        var _map = DX.viz.utils.map,
            formatHelper = DX.require("/utils/utils.formatHelper");
        function getFormatObject(value, options, axisMinMax) {
            var formatObject = {
                    value: value,
                    valueText: formatHelper.format(value, options.format, options.precision) || ""
                };
            if (axisMinMax) {
                formatObject.min = axisMinMax.min;
                formatObject.max = axisMinMax.max
            }
            return formatObject
        }
        DX.viz.axes = {constants: {
                logarithmic: "logarithmic",
                discrete: "discrete",
                numeric: "numeric",
                left: "left",
                right: "right",
                top: "top",
                bottom: "bottom",
                center: "center",
                canvasPositionPrefix: "canvas_position_",
                canvasPositionTop: "canvas_position_top",
                canvasPositionBottom: "canvas_position_bottom",
                canvasPositionLeft: "canvas_position_left",
                canvasPositionRight: "canvas_position_right",
                canvasPositionStart: "canvas_position_start",
                canvasPositionEnd: "canvas_position_end",
                horizontal: "horizontal",
                vertical: "vertical",
                convertTicksToValues: function(ticks) {
                    return _map(ticks || [], function(item) {
                            return item.value
                        })
                },
                convertValuesToTicks: function(values) {
                    return _map(values || [], function(item) {
                            return {value: item}
                        })
                },
                validateOverlappingMode: function(mode) {
                    return mode !== "ignore" ? "enlargeTickInterval" : "ignore"
                },
                formatLabel: function(value, options, axisMinMax) {
                    var formatObject = getFormatObject(value, options, axisMinMax);
                    return $.isFunction(options.customizeText) ? options.customizeText.call(formatObject, formatObject) : formatObject.valueText
                },
                formatHint: function(value, options, axisMinMax) {
                    var formatObject = getFormatObject(value, options, axisMinMax);
                    return $.isFunction(options.customizeHint) ? options.customizeHint.call(formatObject, formatObject) : undefined
                }
            }}
    })(jQuery, DevExpress);
    /*! Module viz-core, file xyAxes.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            formatHelper = DX.require("/utils/utils.formatHelper"),
            dateUtils = DX.require("/utils/utils.date"),
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            axes = viz.axes,
            constants = axes.constants,
            _extend = $.extend,
            CANVAS_POSITION_PREFIX = constants.canvasPositionPrefix,
            TOP = constants.top,
            BOTTOM = constants.bottom,
            LEFT = constants.left,
            RIGHT = constants.right,
            CENTER = constants.center;
        var dateSetters = {
                millisecond: function(date) {
                    date.setMilliseconds(0)
                },
                second: function(date) {
                    date.setSeconds(0, 0)
                },
                minute: function(date) {
                    date.setMinutes(0, 0, 0)
                },
                hour: function(date) {
                    date.setHours(0, 0, 0, 0)
                },
                month: function(date) {
                    date.setMonth(0);
                    dateSetters.day(date)
                },
                quarter: function(date) {
                    date.setMonth(dateUtils.getFirstQuarterMonth(date.getMonth()));
                    dateSetters.day(date)
                }
            };
        dateSetters.week = dateSetters.day = function(date) {
            date.setDate(1);
            dateSetters.hour(date)
        };
        function getMarkerDate(date, tickInterval) {
            var markerDate = new Date(date.getTime()),
                setter = dateSetters[tickInterval];
            setter && setter(markerDate);
            return markerDate
        }
        axes.xyAxes = {linear: {
                measureLabels: function() {
                    return this._tickManager.getMaxLabelParams()
                },
                getMarkerTrackers: function() {
                    return this._markerTrackers
                },
                _prepareDatesDifferences: function(datesDifferences, tickInterval) {
                    var dateUnitInterval,
                        i;
                    if (tickInterval === "week")
                        tickInterval = "day";
                    if (tickInterval === "quarter")
                        tickInterval = "month";
                    if (datesDifferences[tickInterval])
                        for (i = 0; i < dateUtils.dateUnitIntervals.length; i++) {
                            dateUnitInterval = dateUtils.dateUnitIntervals[i];
                            if (datesDifferences[dateUnitInterval]) {
                                datesDifferences[dateUnitInterval] = false;
                                datesDifferences.count--
                            }
                            if (dateUnitInterval === tickInterval)
                                break
                        }
                },
                _getSharpParam: function(oposite) {
                    return this._isHorizontal ^ oposite ? "h" : "v"
                },
                _createAxisElement: function() {
                    var axisCoord = this._axisPosition,
                        canvas = this._getCanvasStartEnd(),
                        points = this._isHorizontal ? [canvas.start, axisCoord, canvas.end, axisCoord] : [axisCoord, canvas.start, axisCoord, canvas.end];
                    return this._renderer.path(points, "line")
                },
                _getTranslatedCoord: function(value, offset) {
                    return this._translator.translate(value, offset)
                },
                _getCanvasStartEnd: function() {
                    return {
                            start: this._translator.translateSpecialCase(constants.canvasPositionStart),
                            end: this._translator.translateSpecialCase(constants.canvasPositionEnd)
                        }
                },
                _getScreenDelta: function() {
                    return Math.abs(this._translator.translateSpecialCase(constants.canvasPositionStart) - this._translator.translateSpecialCase(constants.canvasPositionEnd))
                },
                _initAxisPositions: function() {
                    var that = this,
                        position = that._options.position,
                        delta = 0;
                    if (that.delta)
                        delta = that.delta[position] || 0;
                    that._axisPosition = that._additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + position) + delta
                },
                _getTickCoord: function(tick) {
                    var coords,
                        corrections = {
                            top: -1,
                            middle: -0.5,
                            bottom: 0,
                            left: -1,
                            center: -0.5,
                            right: 0
                        },
                        tickCorrection = corrections[this._options.tickOrientation || "center"];
                    if (_isDefined(tick.posX) && _isDefined(tick.posY))
                        coords = {
                            x1: tick.posX,
                            y1: tick.posY + tickCorrection * tick.length,
                            x2: tick.posX,
                            y2: tick.posY + tickCorrection * tick.length + tick.length
                        };
                    else
                        coords = null;
                    return coords
                },
                _drawTitle: function() {
                    var that = this,
                        options = that._options,
                        titleOptions = options.title,
                        attr = {
                            opacity: titleOptions.opacity,
                            align: CENTER
                        };
                    if (!titleOptions.text || !that._axisTitleGroup)
                        return;
                    that._title = that._renderer.text(titleOptions.text, 0, 0).css(viz.utils.patchFontOptions(titleOptions.font)).attr(attr).append(that._axisTitleGroup)
                },
                _drawDateMarker: function(dateMarker, options) {
                    var that = this,
                        markerOptions = that._options.marker,
                        labelPosX,
                        labelPosY,
                        textElement,
                        textSize,
                        textIndent,
                        pathElement;
                    if (options.x === null)
                        return;
                    if (!options.withoutStick)
                        pathElement = that._renderer.path([options.x, options.y, options.x, options.y + markerOptions.separatorHeight], "line").attr({
                            "stroke-width": markerOptions.width,
                            stroke: markerOptions.color,
                            "stroke-opacity": markerOptions.opacity,
                            sharp: "h"
                        }).append(that._axisElementsGroup);
                    textElement = that._renderer.text(String(constants.formatLabel(dateMarker, options.labelFormat)), 0, 0).attr({align: "left"}).css(viz.utils.patchFontOptions(markerOptions.label.font)).append(that._axisElementsGroup);
                    textSize = textElement.getBBox();
                    textIndent = markerOptions.width + markerOptions.textLeftIndent;
                    labelPosX = this._translator.getBusinessRange().invert ? options.x - textIndent - textSize.width : options.x + textIndent;
                    labelPosY = options.y + markerOptions.textTopIndent + textSize.height / 2;
                    textElement.move(labelPosX, labelPosY);
                    return {
                            labelStartPosX: labelPosX,
                            labelEndPosX: labelPosX + textSize.width,
                            path: pathElement,
                            text: textElement,
                            date: dateMarker,
                            dateMarkerStartPosX: options.x
                        }
                },
                _disposeDateMarker: function(marker) {
                    marker.path && marker.path.dispose();
                    marker.path = null;
                    marker.text.dispose();
                    marker.text = null
                },
                _getDiff: function(currentValue, previousValue) {
                    var datesDifferences = dateUtils.getDatesDifferences(previousValue, currentValue);
                    this._prepareDatesDifferences(datesDifferences, this._dateUnitInterval);
                    return datesDifferences
                },
                _drawDateMarkers: function() {
                    var that = this,
                        options = that._options,
                        ticks = that._majorTicks,
                        boundaryTicks = that._boundaryTicks,
                        lastIndexOfBoundaryTicks = boundaryTicks.length - 1,
                        length = ticks.length,
                        dateMarkers = [],
                        prevDateMarker,
                        markersAreaTop,
                        dateMarker,
                        markerDate,
                        diff,
                        i = 1;
                    boundaryTicks[0] && ticks[0].value > boundaryTicks[0].value && ticks.unshift(boundaryTicks[0]);
                    boundaryTicks[lastIndexOfBoundaryTicks] && ticks[length - 1].value < boundaryTicks[lastIndexOfBoundaryTicks].value && ticks.push(boundaryTicks[lastIndexOfBoundaryTicks]);
                    length = ticks.length;
                    if (options.argumentType !== "datetime" || options.type === "discrete" || length <= 1)
                        return;
                    markersAreaTop = that._axisPosition + this._axisElementsGroup.getBBox().height + options.label.indentFromAxis + options.marker.topIndent;
                    that._dateUnitInterval = dateUtils.getDateUnitInterval(this._tickManager.getTickInterval());
                    for (i; i < length; i++) {
                        diff = that._getDiff(ticks[i].value, ticks[i - 1].value);
                        if (diff.count > 0) {
                            markerDate = getMarkerDate(ticks[i].value, that._dateUnitInterval);
                            dateMarker = that._drawDateMarker(markerDate, {
                                x: that._translator.translate(markerDate),
                                y: markersAreaTop,
                                labelFormat: that._getLabelFormatOptions(formatHelper.getDateFormatByDifferences(diff))
                            });
                            if (dateMarker)
                                if (that._checkMarkersPosition(dateMarker, prevDateMarker)) {
                                    dateMarkers.push(dateMarker);
                                    prevDateMarker = dateMarker
                                }
                                else
                                    that._disposeDateMarker(dateMarker)
                        }
                    }
                    if (dateMarkers.length) {
                        dateMarker = that._drawDateMarker(ticks[0].value, {
                            x: that._translator.translate(ticks[0].value),
                            y: markersAreaTop,
                            labelFormat: that._getLabelFormatOptions(formatHelper.getDateFormatByDifferences(that._getDiff(ticks[0].value, dateMarkers[0].date))),
                            withoutStick: true
                        });
                        if (dateMarker) {
                            !that._checkMarkersPosition(dateMarker, dateMarkers[0]) && that._disposeDateMarker(dateMarker);
                            dateMarkers.unshift(dateMarker)
                        }
                    }
                    that._initializeMarkersTrackers(dateMarkers, that._axisElementsGroup, that._axisGroup.getBBox().width, markersAreaTop)
                },
                _initializeMarkersTrackers: function(dateMarkers, group, axisWidth, markersAreaTop) {
                    var that = this,
                        separatorHeight = that._options.marker.separatorHeight,
                        renderer = that._renderer,
                        markerTracker,
                        nextMarker,
                        i,
                        x,
                        length = dateMarkers.length,
                        businessRange = this._translator.getBusinessRange(),
                        currentMarker;
                    that._markerTrackers = [];
                    for (i = 0; i < length; i++) {
                        currentMarker = dateMarkers[i];
                        nextMarker = dateMarkers[i + 1] || {
                            dateMarkerStartPosX: businessRange.invert ? this._translator.translateSpecialCase("canvas_position_end") : axisWidth,
                            date: businessRange.max
                        };
                        x = currentMarker.dateMarkerStartPosX;
                        markerTracker = renderer.path([x, markersAreaTop, x, markersAreaTop + separatorHeight, nextMarker.dateMarkerStartPosX, markersAreaTop + separatorHeight, nextMarker.dateMarkerStartPosX, markersAreaTop, x, markersAreaTop]).attr({
                            "stroke-width": 1,
                            stroke: "grey",
                            fill: "grey",
                            "fill-opacity": 0.0001,
                            "stroke-opacity": 0.0001
                        }).append(group);
                        markerTracker.data("range", {
                            startValue: currentMarker.date,
                            endValue: nextMarker.date
                        });
                        that._markerTrackers.push(markerTracker)
                    }
                },
                _checkMarkersPosition: function(dateMarker, prevDateMarker) {
                    return prevDateMarker === undefined || dateMarker.labelStartPosX > prevDateMarker.labelEndPosX || dateMarker.labelEndPosX < prevDateMarker.labelStartPosX
                },
                _getLabelFormatOptions: function(formatString) {
                    var that = this,
                        markerLabelOptions = that._markerLabelOptions;
                    if (!markerLabelOptions)
                        that._markerLabelOptions = markerLabelOptions = _extend(true, {}, that._options.marker.label);
                    if (!_isDefined(that._options.marker.label.format))
                        markerLabelOptions.format = formatString;
                    return markerLabelOptions
                },
                _adjustConstantLineLabels: function() {
                    var that = this,
                        options = that._options,
                        isHorizontal = that._isHorizontal,
                        lines = that._constantLines,
                        labels = that._constantLineLabels,
                        label,
                        line,
                        lineBox,
                        linesOptions,
                        labelOptions,
                        box,
                        x,
                        y,
                        i,
                        padding = isHorizontal ? {
                            top: 0,
                            bottom: 0
                        } : {
                            left: 0,
                            right: 0
                        },
                        paddingTopBottom,
                        paddingLeftRight,
                        labelVerticalAlignment,
                        labelHorizontalAlignment,
                        labelIsInside,
                        labelHeight,
                        labelWidth,
                        delta = 0;
                    if (labels === undefined && lines === undefined)
                        return;
                    for (i = 0; i < labels.length; i++) {
                        x = y = 0;
                        linesOptions = options.constantLines[i];
                        paddingTopBottom = linesOptions.paddingTopBottom;
                        paddingLeftRight = linesOptions.paddingLeftRight;
                        labelOptions = linesOptions.label;
                        labelVerticalAlignment = labelOptions.verticalAlignment;
                        labelHorizontalAlignment = labelOptions.horizontalAlignment;
                        labelIsInside = labelOptions.position === "inside";
                        label = labels[i];
                        if (label !== null) {
                            line = lines[i];
                            box = label.getBBox();
                            lineBox = line.getBBox();
                            labelHeight = box.height;
                            labelWidth = box.width;
                            if (isHorizontal)
                                if (labelIsInside) {
                                    if (labelHorizontalAlignment === LEFT)
                                        x -= paddingLeftRight;
                                    else
                                        x += paddingLeftRight;
                                    switch (labelVerticalAlignment) {
                                        case CENTER:
                                            y += lineBox.y + lineBox.height / 2 - box.y - labelHeight / 2;
                                            break;
                                        case BOTTOM:
                                            y += lineBox.y + lineBox.height - box.y - labelHeight - paddingTopBottom;
                                            break;
                                        default:
                                            y += lineBox.y - box.y + paddingTopBottom;
                                            break
                                    }
                                }
                                else if (labelVerticalAlignment === BOTTOM) {
                                    delta = that.delta && that.delta[BOTTOM] || 0;
                                    y += paddingTopBottom - box.y + that._additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + BOTTOM) + delta;
                                    if (padding[BOTTOM] < labelHeight + paddingTopBottom)
                                        padding[BOTTOM] = labelHeight + paddingTopBottom
                                }
                                else {
                                    delta = that.delta && that.delta[TOP] || 0;
                                    y -= paddingTopBottom + box.y + labelHeight - that._additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + TOP) - delta;
                                    if (padding[TOP] < paddingTopBottom + labelHeight)
                                        padding[TOP] = paddingTopBottom + labelHeight
                                }
                            else if (labelIsInside) {
                                switch (labelHorizontalAlignment) {
                                    case CENTER:
                                        x += lineBox.x + labelWidth / 2 - box.x - labelWidth / 2;
                                        break;
                                    case RIGHT:
                                        x -= paddingLeftRight;
                                        break;
                                    default:
                                        x += paddingLeftRight;
                                        break
                                }
                                if (labelVerticalAlignment === BOTTOM)
                                    y += lineBox.y - box.y + paddingTopBottom;
                                else
                                    y += lineBox.y - box.y - labelHeight - paddingTopBottom
                            }
                            else {
                                y += lineBox.y + lineBox.height / 2 - box.y - labelHeight / 2;
                                if (labelHorizontalAlignment === RIGHT) {
                                    x += paddingLeftRight;
                                    if (padding[RIGHT] < paddingLeftRight + labelWidth)
                                        padding[RIGHT] = paddingLeftRight + labelWidth
                                }
                                else {
                                    x -= paddingLeftRight;
                                    if (padding[LEFT] < paddingLeftRight + labelWidth)
                                        padding[LEFT] = paddingLeftRight + labelWidth
                                }
                            }
                            label.move(x, y)
                        }
                    }
                    that.padding = padding
                },
                _checkAlignmentConstantLineLabels: function(labelOptions) {
                    var position = labelOptions.position,
                        verticalAlignment = (labelOptions.verticalAlignment || "").toLowerCase(),
                        horizontalAlignment = (labelOptions.horizontalAlignment || "").toLowerCase();
                    if (this._isHorizontal)
                        if (position === "outside") {
                            verticalAlignment = verticalAlignment === BOTTOM ? BOTTOM : TOP;
                            horizontalAlignment = CENTER
                        }
                        else {
                            verticalAlignment = verticalAlignment === CENTER ? CENTER : verticalAlignment === BOTTOM ? BOTTOM : TOP;
                            horizontalAlignment = horizontalAlignment === LEFT ? LEFT : RIGHT
                        }
                    else if (position === "outside") {
                        verticalAlignment = CENTER;
                        horizontalAlignment = horizontalAlignment === LEFT ? LEFT : RIGHT
                    }
                    else {
                        verticalAlignment = verticalAlignment === BOTTOM ? BOTTOM : TOP;
                        horizontalAlignment = horizontalAlignment === RIGHT ? RIGHT : horizontalAlignment === CENTER ? CENTER : LEFT
                    }
                    labelOptions.verticalAlignment = verticalAlignment;
                    labelOptions.horizontalAlignment = horizontalAlignment
                },
                _getConstantLineLabelsCoords: function(value, lineLabelOptions) {
                    var that = this,
                        additionalTranslator = that._additionalTranslator,
                        align = CENTER,
                        x = value,
                        y = value;
                    if (that._isHorizontal)
                        y = additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + lineLabelOptions.verticalAlignment);
                    else
                        x = additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + lineLabelOptions.horizontalAlignment);
                    switch (lineLabelOptions.horizontalAlignment) {
                        case LEFT:
                            align = !that._isHorizontal && lineLabelOptions.position === "inside" ? LEFT : RIGHT;
                            break;
                        case CENTER:
                            align = CENTER;
                            break;
                        case RIGHT:
                            align = !that._isHorizontal && lineLabelOptions.position === "inside" ? RIGHT : LEFT;
                            break
                    }
                    return {
                            x: x,
                            y: y,
                            align: align
                        }
                },
                _getAdjustedStripLabelCoords: function(stripOptions, label, rect) {
                    var x = 0,
                        y = 0,
                        horizontalAlignment = stripOptions.label.horizontalAlignment,
                        verticalAlignment = stripOptions.label.verticalAlignment,
                        box = label.getBBox(),
                        rectBox = rect.getBBox();
                    if (horizontalAlignment === LEFT)
                        x += stripOptions.paddingLeftRight;
                    else if (horizontalAlignment === RIGHT)
                        x -= stripOptions.paddingLeftRight;
                    if (verticalAlignment === TOP)
                        y += rectBox.y - box.y + stripOptions.paddingTopBottom;
                    else if (verticalAlignment === CENTER)
                        y += rectBox.y + rectBox.height / 2 - box.y - box.height / 2;
                    else if (verticalAlignment === BOTTOM)
                        y -= stripOptions.paddingTopBottom;
                    return {
                            x: x,
                            y: y
                        }
                },
                _adjustTitle: function() {
                    var that = this,
                        options = that._options,
                        position = options.position,
                        title = that._title,
                        margin = options.title.margin,
                        boxGroup,
                        boxTitle,
                        params,
                        centerPosition = that._translator.translateSpecialCase(CANVAS_POSITION_PREFIX + CENTER),
                        axisElementsGroup = that._axisElementsGroup,
                        heightTitle,
                        axisPosition = that._axisPosition,
                        noLabels;
                    if (!title || !axisElementsGroup)
                        return;
                    boxTitle = title.getBBox();
                    boxGroup = axisElementsGroup.getBBox();
                    noLabels = boxGroup.isEmpty;
                    heightTitle = boxTitle.height;
                    if (that._isHorizontal)
                        if (position === BOTTOM)
                            params = {
                                y: (noLabels ? axisPosition : boxGroup.y + boxGroup.height) - boxTitle.y + margin,
                                x: centerPosition
                            };
                        else
                            params = {
                                y: (noLabels ? axisPosition : boxGroup.y) - heightTitle - boxTitle.y - margin,
                                x: centerPosition
                            };
                    else {
                        if (position === LEFT)
                            params = {
                                x: (noLabels ? axisPosition : boxGroup.x) - heightTitle - boxTitle.y - margin,
                                y: centerPosition
                            };
                        else
                            params = {
                                x: (noLabels ? axisPosition : boxGroup.x + boxGroup.width) + heightTitle + boxTitle.y + margin,
                                y: centerPosition
                            };
                        params.rotate = options.position === LEFT ? 270 : 90
                    }
                    title.attr(params)
                },
                coordsIn: function(x, y) {
                    var rect = this.getBoundingRect();
                    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
                },
                _boundaryTicksVisibility: {
                    min: true,
                    max: true
                },
                _getOverlappingBehaviorOptions: function() {
                    var that = this,
                        options = that._options,
                        getText = function() {
                            return ""
                        },
                        overlappingBehavior = options.label.overlappingBehavior ? _extend({}, options.label.overlappingBehavior) : null;
                    if (overlappingBehavior) {
                        if (!that._isHorizontal)
                            overlappingBehavior.mode = constants.validateOverlappingMode(overlappingBehavior.mode);
                        if (overlappingBehavior.mode !== "rotate")
                            overlappingBehavior.rotationAngle = 0
                    }
                    if (!that._translator.getBusinessRange().stubData)
                        getText = function(value, labelOptions) {
                            return constants.formatLabel(value, labelOptions, {
                                    min: options.min,
                                    max: options.max
                                })
                        };
                    return {
                            hasLabelFormat: that._hasLabelFormat,
                            labelOptions: options.label,
                            isMarkersVisible: options.type === "discrete" ? false : options.marker.visible,
                            overlappingBehavior: overlappingBehavior,
                            isHorizontal: that._isHorizontal,
                            textOptions: that._textOptions,
                            textFontStyles: that._textFontStyles,
                            textSpacing: options.label.minSpacing,
                            getText: getText,
                            renderText: function(text, x, y, options) {
                                return that._renderer.text(text, x, y, options).append(that._renderer.root)
                            },
                            translate: function(value, useAdditionalTranslator) {
                                return useAdditionalTranslator ? that._additionalTranslator.translate(value) : that._translator.translate(value)
                            },
                            addMinMax: options.showCustomBoundaryTicks ? that._boundaryTicksVisibility : undefined
                        }
                },
                _getMinMax: function() {
                    return {
                            min: this._options.min,
                            max: this._options.max
                        }
                },
                _getStick: function() {
                    return !this._options.valueMarginsEnabled
                },
                _getStripLabelCoords: function(stripLabelOptions, stripFrom, stripTo) {
                    var that = this,
                        additionalTranslator = that._additionalTranslator,
                        isHorizontal = that._isHorizontal,
                        align = isHorizontal ? CENTER : LEFT,
                        x,
                        y;
                    if (isHorizontal) {
                        if (stripLabelOptions.horizontalAlignment === CENTER) {
                            x = stripFrom + (stripTo - stripFrom) / 2;
                            align = CENTER
                        }
                        else if (stripLabelOptions.horizontalAlignment === LEFT) {
                            x = stripFrom;
                            align = LEFT
                        }
                        else if (stripLabelOptions.horizontalAlignment === RIGHT) {
                            x = stripTo;
                            align = RIGHT
                        }
                        y = additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + stripLabelOptions.verticalAlignment)
                    }
                    else {
                        x = additionalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + stripLabelOptions.horizontalAlignment);
                        align = stripLabelOptions.horizontalAlignment;
                        if (stripLabelOptions.verticalAlignment === TOP)
                            y = stripFrom;
                        else if (stripLabelOptions.verticalAlignment === CENTER)
                            y = stripTo + (stripFrom - stripTo) / 2;
                        else if (stripLabelOptions.verticalAlignment === BOTTOM)
                            y = stripTo
                    }
                    return {
                            x: x,
                            y: y,
                            align: align
                        }
                },
                _getTranslatedValue: function(value, y, offset) {
                    return {
                            x: this._translator.translate(value, offset),
                            y: y
                        }
                },
                _getSkippedCategory: function() {
                    var skippedCategory,
                        categories = this._translator.getVisibleCategories() || this._translator.getBusinessRange().categories;
                    if (categories && !!this._tickOffset)
                        skippedCategory = categories[categories.length - 1];
                    return skippedCategory
                },
                _getSpiderCategoryOption: $.noop
            }}
    })(jQuery, DevExpress);
    /*! Module viz-core, file polarAxes.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            mathUtils = DX.require("/utils/utils.math"),
            commonUtils = DX.require("/utils/utils.common"),
            axes = viz.axes,
            constants = axes.constants,
            circularAxes,
            xyAxesLinear = axes.xyAxes.linear,
            polarAxes,
            vizUtils = viz.utils,
            _map = vizUtils.map,
            _math = Math,
            _abs = _math.abs,
            _round = _math.round,
            convertPolarToXY = vizUtils.convertPolarToXY,
            _extend = $.extend,
            _noop = $.noop,
            HALF_PI_ANGLE = 90;
        function getPolarQuarter(angle) {
            var quarter;
            angle = mathUtils.normalizeAngle(angle);
            if (angle >= 315 && angle <= 360 || angle < 45 && angle >= 0)
                quarter = 1;
            else if (angle >= 45 && angle < 135)
                quarter = 2;
            else if (angle >= 135 && angle < 225)
                quarter = 3;
            else if (angle >= 225 && angle < 315)
                quarter = 4;
            return quarter
        }
        polarAxes = axes.polarAxes = {};
        circularAxes = polarAxes.circular = {
            _overlappingBehaviorType: "circular",
            _createAxisElement: function() {
                var additionalTranslator = this._additionalTranslator;
                return this._renderer.circle(additionalTranslator.getCenter().x, additionalTranslator.getCenter().y, additionalTranslator.getRadius())
            },
            _setBoundingRect: function() {
                this.boundingRect = {
                    width: 0,
                    height: 0
                }
            },
            _boundaryTicksVisibility: {min: true},
            _getOverlappingBehaviorOptions: function() {
                var that = this,
                    additionalTranslator = that._additionalTranslator,
                    angles = additionalTranslator.getAngles(),
                    options = xyAxesLinear._getOverlappingBehaviorOptions.call(that),
                    translator = that._translator,
                    indentFromAxis = that._options.label.indentFromAxis || 0;
                if (options.overlappingBehavior)
                    options.overlappingBehavior = {mode: constants.validateOverlappingMode(options.overlappingBehavior.mode)};
                options.translate = function(value) {
                    return convertPolarToXY(additionalTranslator.getCenter(), angles[0], translator.translate(value), additionalTranslator.translate(constants.canvasPositionBottom))
                };
                options.circularRadius = additionalTranslator.getRadius() + indentFromAxis;
                options.circularStartAngle = angles[0];
                options.circularEndAngle = angles[1];
                options.isHorizontal = false;
                return options
            },
            _addBoundaryTick: function(ticks) {
                var boundaryTicks = this._tickManager.getBoundaryTicks();
                boundaryTicks.length && ticks.unshift({value: boundaryTicks[0]})
            },
            _getSpiderCategoryOption: function() {
                return this._options.firstPointOnStartAngle
            },
            _getMinMax: function() {
                var options = this._options;
                return {
                        min: undefined,
                        max: commonUtils.isNumber(options.period) && options.argumentType === constants.numeric ? options.period : undefined
                    }
            },
            _getStick: function() {
                return this._options.firstPointOnStartAngle || this._options.type !== constants.discrete
            },
            measureLabels: function(withIndents) {
                var that = this,
                    options = that._options,
                    indentFromAxis = options.label.indentFromAxis || 0,
                    widthAxis = options.visible ? options.width : 0,
                    maxLabelParams,
                    halfTickLength = options.tick.length * 0.5,
                    indent = withIndents ? indentFromAxis + halfTickLength : 0;
                if (!that._axisElementsGroup || !that._options.label.visible)
                    return {
                            height: widthAxis,
                            width: widthAxis
                        };
                that._updateTickManager();
                maxLabelParams = that._tickManager.getMaxLabelParams();
                return {
                        height: maxLabelParams.height + indent,
                        width: maxLabelParams.width + indent
                    }
            },
            _getTranslatedCoord: function(value, offset) {
                return this._translator.translate(value, offset) - HALF_PI_ANGLE
            },
            _getCanvasStartEnd: function() {
                return {
                        start: 0 - HALF_PI_ANGLE,
                        end: 360 - HALF_PI_ANGLE
                    }
            },
            _createStrip: function(fromAngle, toAngle, attr) {
                var center = this._additionalTranslator.getCenter(),
                    r = this._additionalTranslator.getRadius();
                return this._renderer.arc(center.x, center.y, 0, r, -toAngle, -fromAngle).attr(attr)
            },
            _getStripLabelCoords: function(_, stripFrom, stripTo) {
                var that = this,
                    angle = stripFrom + (stripTo - stripFrom) / 2,
                    cossin = mathUtils.getCosAndSin(-angle),
                    halfRad = that._additionalTranslator.getRadius() / 2,
                    center = that._additionalTranslator.getCenter(),
                    x = _round(center.x + halfRad * cossin.cos),
                    y = _round(center.y - halfRad * cossin.sin);
                return {
                        x: x,
                        y: y,
                        align: constants.center
                    }
            },
            _createConstantLine: function(value, attr) {
                var center = this._additionalTranslator.getCenter(),
                    r = this._additionalTranslator.getRadius();
                return this._createPathElement([center.x, center.y, center.x + r, center.y], attr).rotate(value, center.x, center.y)
            },
            _getConstantLineLabelsCoords: function(value) {
                var that = this,
                    cossin = mathUtils.getCosAndSin(-value),
                    halfRad = that._additionalTranslator.getRadius() / 2,
                    center = that._additionalTranslator.getCenter(),
                    x = _round(center.x + halfRad * cossin.cos),
                    y = _round(center.y - halfRad * cossin.sin);
                return {
                        x: x,
                        y: y,
                        align: constants.center
                    }
            },
            _checkAlignmentConstantLineLabels: _noop,
            _getScreenDelta: function() {
                return 2 * Math.PI * this._additionalTranslator.getRadius()
            },
            _getTickCoord: function(tick) {
                var center = this._additionalTranslator.getCenter(),
                    r = this._additionalTranslator.getRadius(),
                    corrections = {
                        inside: -1,
                        center: -0.5,
                        outside: 0
                    },
                    tickCorrection = tick.length * corrections[this._options.tickOrientation || "center"],
                    radiusWithTicks = r + tickCorrection;
                return {
                        x1: center.x + radiusWithTicks,
                        y1: center.y,
                        x2: center.x + radiusWithTicks + tick.length,
                        y2: center.y,
                        angle: tick.angle
                    }
            },
            _getLabelAdjustedCoord: function(tick) {
                var that = this,
                    pos = tick.labelPos,
                    cossin = mathUtils.getCosAndSin(pos.angle),
                    cos = cossin.cos,
                    sin = cossin.sin,
                    box = tick.label.getBBox(),
                    halfWidth = box.width / 2,
                    halfHeight = box.height / 2,
                    indentFromAxis = that._options.label.indentFromAxis || 0,
                    x = pos.x + indentFromAxis * cos,
                    y = pos.y + (pos.y - box.y - halfHeight) + indentFromAxis * sin;
                switch (getPolarQuarter(pos.angle)) {
                    case 1:
                        x += halfWidth;
                        y += halfHeight * sin;
                        break;
                    case 2:
                        x += halfWidth * cos;
                        y += halfHeight;
                        break;
                    case 3:
                        x += -halfWidth;
                        y += halfHeight * sin;
                        break;
                    case 4:
                        x += halfWidth * cos;
                        y += -halfHeight;
                        break
                }
                return {
                        x: x,
                        y: y
                    }
            },
            _getGridLineDrawer: function() {
                var that = this,
                    r = that._additionalTranslator.getRadius(),
                    center = that._additionalTranslator.getCenter();
                return function(tick) {
                        return that._createPathElement([center.x, center.y, center.x + r, center.y], tick.gridStyle).rotate(tick.angle, center.x, center.y)
                    }
            },
            _getTranslatedValue: function(value, _, offset) {
                var additionalTranslator = this._additionalTranslator,
                    startAngle = additionalTranslator.getAngles()[0],
                    angle = this._translator.translate(value, -offset),
                    coords = convertPolarToXY(additionalTranslator.getCenter(), startAngle, angle, additionalTranslator.translate(constants.canvasPositionBottom));
                return {
                        x: coords.x,
                        y: coords.y,
                        angle: angle + startAngle - HALF_PI_ANGLE
                    }
            },
            _getAdjustedStripLabelCoords: function(_, label) {
                var y,
                    box = label.getBBox();
                y = label.attr("y") - box.y - box.height / 2;
                return {
                        x: 0,
                        y: y
                    }
            },
            coordsIn: function(x, y) {
                return vizUtils.convertXYToPolar(this._additionalTranslator.getCenter(), x, y).r > this._additionalTranslator.getRadius()
            },
            _rotateTick: function(tick, angle) {
                var center = this._additionalTranslator.getCenter();
                tick.graphic.rotate(angle, center.x, center.y)
            }
        };
        polarAxes.circularSpider = _extend({}, circularAxes, {
            _createAxisElement: function() {
                var points = _map(this.getSpiderTicks(), function(tick) {
                        return {
                                x: tick.posX,
                                y: tick.posY
                            }
                    });
                return this._renderer.path(points, "area")
            },
            _getStick: function() {
                return true
            },
            _getSpiderCategoryOption: function() {
                return true
            },
            getSpiderTicks: function() {
                var that = this;
                that._spiderTicks = constants.convertValuesToTicks(that._tickManager.getFullTicks());
                that._initTicks(that._spiderTicks, {
                    tickStyle: {},
                    gridStyle: {}
                }, false, that._getSkippedCategory(), that._tickOffset);
                return that._spiderTicks
            },
            _createStrip: function(fromAngle, toAngle, attr) {
                var center = this._additionalTranslator.getCenter(),
                    spiderTicks = this.getSpiderTicks(),
                    firstTick,
                    lastTick,
                    nextTick,
                    tick,
                    points = [],
                    i = 0,
                    len = spiderTicks.length;
                while (i < len) {
                    tick = spiderTicks[i];
                    if (tick.angle >= fromAngle && tick.angle <= toAngle) {
                        if (!firstTick) {
                            firstTick = spiderTicks[i - 1] || spiderTicks[spiderTicks.length - 1];
                            points.push((tick.posX + firstTick.posX) / 2, (tick.posY + firstTick.posY) / 2)
                        }
                        points.push(tick.posX, tick.posY);
                        nextTick = spiderTicks[i + 1] || spiderTicks[0];
                        lastTick = {
                            x: (tick.posX + nextTick.posX) / 2,
                            y: (tick.posY + nextTick.posY) / 2
                        }
                    }
                    i++
                }
                points.push(lastTick.x, lastTick.y);
                points.push(center.x, center.y);
                return this._renderer.path(points, "area").attr(attr)
            },
            _getTranslatedCoord: function(value, offset) {
                return this._translator.translate(value, offset) - HALF_PI_ANGLE
            },
            _setTickOffset: function() {
                this._tickOffset = false
            }
        });
        polarAxes.linear = {
            _overlappingBehaviorType: "linear",
            _getMinMax: circularAxes._getMinMax,
            _getStick: xyAxesLinear._getStick,
            _getSpiderCategoryOption: $.noop,
            _createAxisElement: function() {
                var additionalTranslator = this._additionalTranslator,
                    centerCoord = additionalTranslator.getCenter(),
                    points = [centerCoord.x, centerCoord.y, centerCoord.x + additionalTranslator.getRadius(), centerCoord.y];
                return this._renderer.path(points, "line").rotate(additionalTranslator.getAngles()[0] - HALF_PI_ANGLE, centerCoord.x, centerCoord.y)
            },
            _setBoundingRect: circularAxes._setBoundingRect,
            _getScreenDelta: function() {
                return this._additionalTranslator.getRadius()
            },
            _getTickCoord: function(tick) {
                return {
                        x1: tick.posX - tick.length / 2,
                        y1: tick.posY,
                        x2: tick.posX + tick.length / 2,
                        y2: tick.posY,
                        angle: tick.angle + HALF_PI_ANGLE
                    }
            },
            _getOverlappingBehaviorOptions: function() {
                var that = this,
                    translator = that._translator,
                    orthTranslator = that._additionalTranslator,
                    options = xyAxesLinear._getOverlappingBehaviorOptions.call(this),
                    startAngle = mathUtils.normalizeAngle(that._additionalTranslator.getAngles()[0]);
                if (options.overlappingBehavior)
                    options.overlappingBehavior = {mode: constants.validateOverlappingMode(options.overlappingBehavior.mode)};
                options.isHorizontal = startAngle > 45 && startAngle < 135 || startAngle > 225 && startAngle < 315 ? true : false;
                options.translate = function(value) {
                    return convertPolarToXY(orthTranslator.getCenter(), that._options.startAngle, orthTranslator.translate(constants.canvasPositionTop), translator.translate(value)).x
                };
                return options
            },
            _getLabelAdjustedCoord: function(tick) {
                var that = this,
                    pos = tick.labelPos,
                    cossin = mathUtils.getCosAndSin(pos.angle),
                    indentFromAxis = that._options.label.indentFromAxis || 0,
                    box = tick.label.getBBox(),
                    x,
                    y;
                x = pos.x - _abs(indentFromAxis * cossin.sin) + _abs(box.width / 2 * cossin.cos);
                y = pos.y + (pos.y - box.y) - _abs(box.height / 2 * cossin.sin) + _abs(indentFromAxis * cossin.cos);
                return {
                        x: x,
                        y: y
                    }
            },
            _getGridLineDrawer: function() {
                var that = this,
                    pos = that._additionalTranslator.getCenter();
                return function(tick) {
                        return that._renderer.circle(pos.x, pos.y, mathUtils.getDistance(pos.x, pos.y, tick.posX, tick.posY)).attr(tick.gridStyle).sharp()
                    }
            },
            _getTranslatedValue: function(value, _, offset) {
                var additionalTranslator = this._additionalTranslator,
                    startAngle = additionalTranslator.getAngles()[0],
                    angle = additionalTranslator.translate(constants.canvasPositionStart),
                    xy = convertPolarToXY(additionalTranslator.getCenter(), startAngle, angle, this._translator.translate(value, offset));
                return {
                        x: xy.x,
                        y: xy.y,
                        angle: angle + startAngle - HALF_PI_ANGLE
                    }
            },
            _getTranslatedCoord: function(value, offset) {
                return this._translator.translate(value, offset)
            },
            _getCanvasStartEnd: function() {
                return {
                        start: 0,
                        end: this._additionalTranslator.getRadius()
                    }
            },
            _createStrip: function(fromPoint, toPoint, attr) {
                var center = this._additionalTranslator.getCenter();
                return this._renderer.arc(center.x, center.y, fromPoint, toPoint, 0, 360).attr(attr)
            },
            _getAdjustedStripLabelCoords: circularAxes._getAdjustedStripLabelCoords,
            _getStripLabelCoords: function(_, stripFrom, stripTo) {
                var that = this,
                    labelPos = stripFrom + (stripTo - stripFrom) / 2,
                    center = that._additionalTranslator.getCenter(),
                    y = _round(center.y - labelPos);
                return {
                        x: center.x,
                        y: y,
                        align: constants.center
                    }
            },
            _createConstantLine: function(value, attr) {
                var center = this._additionalTranslator.getCenter();
                return this._renderer.circle(center.x, center.y, value).attr(attr).sharp()
            },
            _getConstantLineLabelsCoords: function(value) {
                var that = this,
                    center = that._additionalTranslator.getCenter(),
                    y = _round(center.y - value);
                return {
                        x: center.x,
                        y: y,
                        align: constants.center
                    }
            },
            _checkAlignmentConstantLineLabels: _noop,
            _rotateTick: function(tick, angle) {
                tick.graphic.rotate(angle, tick.posX, tick.posY)
            }
        };
        polarAxes.linearSpider = _extend({}, polarAxes.linear, {
            _createPathElement: function(points, attr) {
                return this._renderer.path(points, "area").attr(attr).sharp()
            },
            setSpiderTicks: function(ticks) {
                this._spiderTicks = ticks
            },
            _getGridLineDrawer: function() {
                var that = this,
                    pos = that._additionalTranslator.getCenter();
                return function(tick) {
                        var radius = mathUtils.getDistance(pos.x, pos.y, tick.posX, tick.posY);
                        return that._createPathElement(that._getGridPoints(pos, radius), tick.gridStyle)
                    }
            },
            _getGridPoints: function(pos, radius) {
                return _map(this._spiderTicks, function(tick) {
                        var cossin = mathUtils.getCosAndSin(tick.angle);
                        return {
                                x: _round(pos.x + radius * cossin.cos),
                                y: _round(pos.y + radius * cossin.sin)
                            }
                    })
            },
            _createStrip: function(fromPoint, toPoint, attr) {
                var center = this._additionalTranslator.getCenter(),
                    innerPoints = this._getGridPoints(center, toPoint),
                    outerPoints = this._getGridPoints(center, fromPoint);
                return this._renderer.path([outerPoints, innerPoints.reverse()], "area").attr(attr)
            },
            _createConstantLine: function(value, attr) {
                var center = this._additionalTranslator.getCenter(),
                    points = this._getGridPoints(center, value);
                return this._createPathElement(points, attr)
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseAxis.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            mathUtils = DX.require("/utils/utils.math"),
            commonUtils = DX.require("/utils/utils.common"),
            constants = viz.axes.constants,
            parseUtils = viz.parseUtils,
            _isDefined = commonUtils.isDefined,
            _isNumber = commonUtils.isNumber,
            _isString = commonUtils.isString,
            _getSignificantDigitPosition = mathUtils.getSignificantDigitPosition,
            _roundValue = mathUtils.roundValue,
            patchFontOptions = viz.utils.patchFontOptions,
            _math = Math,
            _abs = _math.abs,
            _round = _math.round,
            _extend = $.extend,
            _each = $.each,
            _noop = $.noop,
            DEFAULT_AXIS_LABEL_SPACING = 5,
            MAX_GRID_BORDER_ADHENSION = 4,
            LABEL_BACKGROUND_PADDING_X = 8,
            LABEL_BACKGROUND_PADDING_Y = 4,
            Axis;
        function validateAxisOptions(options) {
            var labelOptions = options.label,
                position = options.position,
                defaultPosition = options.isHorizontal ? constants.bottom : constants.left,
                secondaryPosition = options.isHorizontal ? constants.top : constants.right;
            if (position !== defaultPosition && position !== secondaryPosition)
                position = defaultPosition;
            if (position === constants.right && !labelOptions.userAlignment)
                labelOptions.alignment = constants.left;
            options.position = position;
            options.hoverMode = options.hoverMode ? options.hoverMode.toLowerCase() : "none";
            labelOptions.minSpacing = _isDefined(labelOptions.minSpacing) ? labelOptions.minSpacing : DEFAULT_AXIS_LABEL_SPACING
        }
        function findSkippedIndexCategory(ticks, skippedCategory) {
            var i = ticks.length;
            if (skippedCategory !== undefined)
                while (i--)
                    if (ticks[i].value === skippedCategory)
                        return i;
            return -1
        }
        Axis = DX.viz.axes.Axis = function(renderSettings) {
            var that = this;
            that._renderer = renderSettings.renderer;
            that._incidentOccured = renderSettings.incidentOccured;
            that._stripsGroup = renderSettings.stripsGroup;
            that._labelAxesGroup = renderSettings.labelAxesGroup;
            that._constantLinesGroup = renderSettings.constantLinesGroup;
            that._axesContainerGroup = renderSettings.axesContainerGroup;
            that._gridContainerGroup = renderSettings.gridGroup;
            that._axisCssPrefix = renderSettings.widgetClass + "-" + (renderSettings.axisClass ? renderSettings.axisClass + "-" : "");
            that._setType(renderSettings.axisType, renderSettings.drawingType);
            that._createAxisGroups();
            that._tickManager = that._createTickManager()
        };
        Axis.prototype = {
            constructor: Axis,
            _updateBusinessRangeInterval: function() {
                var i,
                    ticks = this._majorTicks,
                    length = ticks.length,
                    businessRange = this._translator.getBusinessRange(),
                    minInterval;
                if (length < 2 || businessRange.categories)
                    return;
                minInterval = _abs(ticks[0].value - ticks[1].value);
                for (i = 1; i < length - 1; i++)
                    minInterval = Math.min(_abs(ticks[i].value - ticks[i + 1].value), minInterval);
                businessRange.addRange({interval: minInterval})
            },
            _createAllTicks: function(businessRange) {
                var that = this;
                that._boundaryTicks = that._getBoundaryTicks();
                that._majorTicks = that.getMajorTicks(that._options.withoutOverlappingBehavior);
                that._decimatedTicks = businessRange.categories ? that.getDecimatedTicks() : [];
                that._minorTicks = that.getMinorTicks()
            },
            _updateTranslatorInterval: function() {
                var that = this,
                    translator = that._translator,
                    businessRange = translator.getBusinessRange();
                if (!businessRange.categories && !businessRange.isSynchronized) {
                    that.getMajorTicks(true);
                    businessRange.addRange(that._tickManager.getTickBounds());
                    translator.reinit()
                }
            },
            _drawAxis: function() {
                var that = this,
                    options = that._options,
                    axis = that._createAxis({
                        "stroke-width": options.width,
                        stroke: options.color,
                        "stroke-opacity": options.opacity
                    });
                axis.append(that._axisLineGroup)
            },
            _correctMinForTicks: function(min, max, screenDelta) {
                var digitPosition = _getSignificantDigitPosition(_abs(max - min) / screenDelta),
                    newMin = _roundValue(Number(min), digitPosition),
                    correctingValue;
                if (newMin < min) {
                    correctingValue = _math.pow(10, -digitPosition);
                    newMin = mathUtils.applyPrecisionByMinDelta(newMin, correctingValue, newMin + correctingValue)
                }
                if (newMin > max)
                    newMin = min;
                return newMin
            },
            _getTickManagerData: function() {
                var that = this,
                    options = that._options,
                    screenDelta = that._getScreenDelta(),
                    min = that._minBound,
                    max = that._maxBound,
                    categories = that._translator.getVisibleCategories() || that._translator.getBusinessRange().categories,
                    customTicks = options.customTicks || ($.isArray(categories) ? categories : that._majorTicks && that._majorTicks.length && constants.convertTicksToValues(that._majorTicks)),
                    customMinorTicks = options.customMinorTicks || that._minorTicks && that._minorTicks.length && constants.convertTicksToValues(that._minorTicks);
                if (_isNumber(min) && options.type !== constants.logarithmic)
                    min = that._correctMinForTicks(min, max, screenDelta);
                return {
                        min: min,
                        max: max,
                        customTicks: customTicks,
                        customMinorTicks: customMinorTicks,
                        screenDelta: screenDelta
                    }
            },
            _getTickManagerTypes: function() {
                return {
                        axisType: this._options.type,
                        dataType: this._options.dataType
                    }
            },
            _getTicksOptions: function() {
                var options = this._options;
                return {
                        base: options.type === constants.logarithmic ? options.logarithmBase : undefined,
                        tickInterval: this._translator.getBusinessRange().stubData ? null : options.tickInterval,
                        gridSpacingFactor: options.axisDivisionFactor,
                        minorGridSpacingFactor: options.minorAxisDivisionFactor,
                        numberMultipliers: options.numberMultipliers,
                        incidentOccured: options.incidentOccured,
                        setTicksAtUnitBeginning: options.setTicksAtUnitBeginning,
                        showMinorTicks: options.minorTick.visible || options.minorGrid.visible,
                        minorTickInterval: options.minorTickInterval,
                        minorTickCount: options.minorTickCount,
                        useTicksAutoArrangement: options.useTicksAutoArrangement,
                        showCalculatedTicks: options.tick.showCalculatedTicks,
                        showMinorCalculatedTicks: options.minorTick.showCalculatedTicks
                    }
            },
            _getBoundaryTicks: function() {
                var categories = this._translator.getVisibleCategories() || this._translator.getBusinessRange().categories,
                    boundaryValues = categories && this._tickOffset ? [categories[0], categories[categories.length - 1]] : this._tickManager.getBoundaryTicks();
                return constants.convertValuesToTicks(boundaryValues)
            },
            _createTickManager: function() {
                return viz.CoreFactory.createTickManager({}, {}, {overlappingBehaviorType: this._overlappingBehaviorType})
            },
            _getMarginsOptions: function() {
                var range = this._translator.getBusinessRange();
                return {
                        stick: range.stick || this._options.stick,
                        minStickValue: range.minStickValue,
                        maxStickValue: range.maxStickValue,
                        percentStick: range.percentStick,
                        minValueMargin: this._options.minValueMargin,
                        maxValueMargin: this._options.maxValueMargin,
                        minSpaceCorrection: range.minSpaceCorrection,
                        maxSpaceCorrection: range.maxSpaceCorrection
                    }
            },
            _updateTickManager: function() {
                var overlappingOptions = this._getOverlappingBehaviorOptions(),
                    options;
                options = _extend(true, this._getMarginsOptions(), overlappingOptions, this._getTicksOptions());
                this._tickManager.update(this._getTickManagerTypes(), this._getTickManagerData(), options)
            },
            _correctLabelAlignment: function() {
                var that = this,
                    labelOptions = that._options.label,
                    overlappingBehavior = that._tickManager.getOverlappingBehavior();
                if (overlappingBehavior && overlappingBehavior.mode === "rotate") {
                    that._textOptions.rotate = overlappingBehavior.rotationAngle;
                    if (!labelOptions.userAlignment)
                        that._textOptions.align = constants.left
                }
                else if (!labelOptions.userAlignment)
                    that._textOptions.align = labelOptions.alignment
            },
            _correctLabelFormat: function() {
                this._options.label = this._tickManager.getOptions().labelOptions
            },
            _deleteLabels: function() {
                this._axisElementsGroup && this._axisElementsGroup.clear()
            },
            _drawTicks: function(ticks) {
                var that = this,
                    group = that._axisLineGroup;
                _each(ticks || [], function(_, tick) {
                    var coord = that._getTickCoord(tick),
                        points;
                    if (coord) {
                        points = that._isHorizontal ? [coord.x1, coord.y1, coord.x2, coord.y2] : [coord.y1, coord.x1, coord.y2, coord.x2];
                        tick.graphic = that._createPathElement(points, tick.tickStyle).append(group);
                        coord.angle && that._rotateTick(tick, coord.angle)
                    }
                })
            },
            _createPathElement: function(points, attr) {
                return this._renderer.path(points, "line").attr(attr).sharp(this._getSharpParam())
            },
            _createAxis: function(options) {
                return this._createAxisElement().attr(options).sharp(this._getSharpParam(true))
            },
            _drawLabels: function() {
                var that = this,
                    renderer = that._renderer,
                    group = that._axisElementsGroup,
                    emptyStrRegExp = /^\s+$/;
                _each(that._majorTicks, function(_, tick) {
                    var text = tick.labelText,
                        xCoord,
                        yCoord;
                    if (_isDefined(text) && text !== "" && !emptyStrRegExp.test(text)) {
                        xCoord = that._isHorizontal ? tick.labelPos.x : tick.labelPos.y;
                        yCoord = that._isHorizontal ? tick.labelPos.y : tick.labelPos.x;
                        if (!tick.label)
                            tick.label = renderer.text(text, xCoord, yCoord).css(tick.labelFontStyle).attr(tick.labelStyle).append(group);
                        else
                            tick.label.css(tick.labelFontStyle).attr(tick.labelStyle).attr({
                                text: text,
                                x: xCoord,
                                y: yCoord
                            });
                        tick.label.data({"chart-data-argument": tick.value})
                    }
                })
            },
            _getGridLineDrawer: function(borderOptions) {
                var that = this,
                    translator = that._translator,
                    additionalTranslator = that._additionalTranslator,
                    isHorizontal = that._isHorizontal,
                    canvasStart = isHorizontal ? constants.left : constants.top,
                    canvasEnd = isHorizontal ? constants.right : constants.bottom,
                    positionFrom = additionalTranslator.translateSpecialCase(constants.canvasPositionStart),
                    positionTo = additionalTranslator.translateSpecialCase(constants.canvasPositionEnd),
                    firstBorderLinePosition = borderOptions.visible && borderOptions[canvasStart] ? translator.translateSpecialCase(constants.canvasPositionPrefix + canvasStart) : undefined,
                    lastBorderLinePosition = borderOptions.visible && borderOptions[canvasEnd] ? translator.translateSpecialCase(constants.canvasPositionPrefix + canvasEnd) : undefined,
                    getPoints = isHorizontal ? function(tick) {
                        return tick.posX !== null ? [tick.posX, positionFrom, tick.posX, positionTo] : null
                    } : function(tick) {
                        return tick.posX !== null ? [positionFrom, tick.posX, positionTo, tick.posX] : null
                    },
                    minDelta = MAX_GRID_BORDER_ADHENSION + firstBorderLinePosition,
                    maxDelta = lastBorderLinePosition - MAX_GRID_BORDER_ADHENSION;
                return function(tick) {
                        if (tick.posX === undefined || tick.posX < minDelta || tick.posX > maxDelta)
                            return;
                        var points = getPoints(tick);
                        return points && that._createPathElement(points, tick.gridStyle)
                    }
            },
            _drawGrids: function(ticks, borderOptions) {
                var that = this,
                    group = that._axisGridGroup,
                    tick,
                    i = 0,
                    length = ticks.length,
                    drawLine = that._getGridLineDrawer(borderOptions || {visible: false});
                for (i; i < length; i++) {
                    tick = ticks[i];
                    tick.grid = drawLine(tick);
                    tick.grid && tick.grid.append(group)
                }
            },
            _getConstantLinePos: function(lineValue, canvasStart, canvasEnd) {
                var parsedValue = this._validateUnit(lineValue, "E2105", "constantLine"),
                    value = this._getTranslatedCoord(parsedValue);
                if (!_isDefined(value) || value < _math.min(canvasStart, canvasEnd) || value > _math.max(canvasStart, canvasEnd))
                    return {};
                return {
                        value: value,
                        parsedValue: parsedValue
                    }
            },
            _createConstantLine: function(value, attr) {
                var that = this,
                    additionalTranslator = this._additionalTranslator,
                    positionFrom = additionalTranslator.translateSpecialCase(constants.canvasPositionStart),
                    positionTo = additionalTranslator.translateSpecialCase(constants.canvasPositionEnd),
                    points = this._isHorizontal ? [value, positionTo, value, positionFrom] : [positionFrom, value, positionTo, value];
                return that._createPathElement(points, attr)
            },
            _drawConstantLinesAndLabels: function(lineOptions, canvasStart, canvasEnd) {
                if (!_isDefined(lineOptions.value))
                    return;
                var that = this,
                    pos = that._getConstantLinePos(lineOptions.value, canvasStart, canvasEnd),
                    labelOptions = lineOptions.label || {},
                    value = pos.value,
                    attr = {
                        stroke: lineOptions.color,
                        "stroke-width": lineOptions.width,
                        dashStyle: lineOptions.dashStyle
                    };
                if (!_isDefined(value)) {
                    that._constantLines.push(null);
                    if (labelOptions.visible)
                        that._constantLineLabels.push(null);
                    return
                }
                that._constantLines.push(that._createConstantLine(value, attr).append(that._axisConstantLineGroup));
                that._constantLineLabels.push(labelOptions.visible ? that._drawConstantLineLabels(pos.parsedValue, labelOptions, value) : null)
            },
            _drawConstantLine: function() {
                var that = this,
                    options = that._options,
                    data = options.constantLines,
                    canvas = that._getCanvasStartEnd();
                if (that._translator.getBusinessRange().stubData)
                    return;
                that._constantLines = [];
                that._constantLineLabels = [];
                _each(data, function(_, dataItem) {
                    that._drawConstantLinesAndLabels(dataItem, canvas.start, canvas.end)
                })
            },
            _drawConstantLineLabels: function(parsedValue, lineLabelOptions, value) {
                var that = this,
                    text = lineLabelOptions.text,
                    options = that._options,
                    labelOptions = options.label,
                    coords;
                that._checkAlignmentConstantLineLabels(lineLabelOptions);
                text = _isDefined(text) ? text : constants.formatLabel(parsedValue, labelOptions);
                coords = that._getConstantLineLabelsCoords(value, lineLabelOptions);
                return that._renderer.text(text, coords.x, coords.y).css(patchFontOptions(_extend({}, labelOptions.font, lineLabelOptions.font))).attr({align: coords.align}).append(that._axisConstantLineGroup)
            },
            _getStripPos: function(startValue, endValue, canvasStart, canvasEnd, range) {
                var isContinous = !!(range.minVisible || range.maxVisible),
                    categories = range.categories || [],
                    start,
                    end,
                    firstValue = startValue,
                    lastValue = endValue,
                    startCategoryIndex,
                    endCategoryIndex,
                    min = range.minVisible;
                if (!isContinous) {
                    startCategoryIndex = $.inArray(startValue, categories);
                    endCategoryIndex = $.inArray(endValue, categories);
                    if (startCategoryIndex === -1 || endCategoryIndex === -1)
                        return {
                                stripFrom: 0,
                                stripTo: 0
                            };
                    if (startCategoryIndex > endCategoryIndex) {
                        firstValue = endValue;
                        lastValue = startValue
                    }
                }
                firstValue = this._validateUnit(firstValue, "E2105", "strip");
                lastValue = this._validateUnit(lastValue, "E2105", "strip");
                start = this._getTranslatedCoord(firstValue, -1);
                end = this._getTranslatedCoord(lastValue, 1);
                if (!_isDefined(start) && isContinous)
                    start = firstValue < min ? canvasStart : canvasEnd;
                if (!_isDefined(end) && isContinous)
                    end = lastValue < min ? canvasStart : canvasEnd;
                return start < end ? {
                        stripFrom: start,
                        stripTo: end
                    } : {
                        stripFrom: end,
                        stripTo: start
                    }
            },
            _createStrip: function(fromPoint, toPoint, attr) {
                var x,
                    y,
                    width,
                    height,
                    additionalTranslator = this._additionalTranslator,
                    positionFrom = additionalTranslator.translateSpecialCase(constants.canvasPositionStart),
                    positionTo = additionalTranslator.translateSpecialCase(constants.canvasPositionEnd);
                if (this._isHorizontal) {
                    x = fromPoint;
                    y = _math.min(positionFrom, positionTo);
                    width = toPoint - fromPoint;
                    height = _abs(positionFrom - positionTo)
                }
                else {
                    x = _math.min(positionFrom, positionTo);
                    y = fromPoint;
                    width = _abs(positionFrom - positionTo);
                    height = _abs(fromPoint - toPoint)
                }
                return this._renderer.rect(x, y, width, height).attr(attr)
            },
            _drawStrip: function() {
                var that = this,
                    options = that._options,
                    stripData = options.strips,
                    canvas = this._getCanvasStartEnd(),
                    i,
                    stripOptions,
                    stripPos,
                    stripLabelOptions,
                    attr,
                    range = that._translator.getBusinessRange();
                if (range.stubData)
                    return;
                that._strips = [];
                that._stripLabels = [];
                for (i = 0; i < stripData.length; i++) {
                    stripOptions = stripData[i];
                    stripLabelOptions = stripOptions.label || {};
                    attr = {fill: stripOptions.color};
                    if (_isDefined(stripOptions.startValue) && _isDefined(stripOptions.endValue) && _isDefined(stripOptions.color)) {
                        stripPos = that._getStripPos(stripOptions.startValue, stripOptions.endValue, canvas.start, canvas.end, range);
                        if (stripPos.stripTo - stripPos.stripFrom === 0 || !_isDefined(stripPos.stripTo) || !_isDefined(stripPos.stripFrom)) {
                            that._strips.push(null);
                            if (stripLabelOptions.text)
                                that._stripLabels.push(null);
                            continue
                        }
                        that._strips.push(that._createStrip(stripPos.stripFrom, stripPos.stripTo, attr).append(that._axisStripGroup));
                        that._stripLabels.push(stripLabelOptions.text ? that._drawStripLabel(stripLabelOptions, stripPos.stripFrom, stripPos.stripTo) : null)
                    }
                }
            },
            _drawStripLabel: function(stripLabelOptions, stripFrom, stripTo) {
                var that = this,
                    options = that._options,
                    coords = that._getStripLabelCoords(stripLabelOptions, stripFrom, stripTo);
                return that._renderer.text(stripLabelOptions.text, coords.x, coords.y).css(patchFontOptions(_extend({}, options.label.font, stripLabelOptions.font))).attr({align: coords.align}).append(that._axisLabelGroup)
            },
            _adjustStripLabels: function() {
                var that = this,
                    labels = that._stripLabels,
                    rects = that._strips,
                    i,
                    coords;
                if (labels === undefined && rects === undefined)
                    return;
                for (i = 0; i < labels.length; i++)
                    if (labels[i] !== null) {
                        coords = that._getAdjustedStripLabelCoords(that._options.strips[i], labels[i], rects[i]);
                        labels[i].move(coords.x, coords.y)
                    }
            },
            _adjustLabels: function() {
                var that = this,
                    options = that._options,
                    majorTicks = that._majorTicks,
                    majorTicksLength = majorTicks.length,
                    isHorizontal = that._isHorizontal,
                    overlappingBehavior = that._tickManager ? that._tickManager.getOverlappingBehavior() : options.label.overlappingBehavior,
                    position = options.position,
                    label,
                    labelHeight,
                    isNeedLabelAdjustment,
                    staggeringSpacing,
                    i,
                    box,
                    hasLabels = false,
                    boxAxis = that._axisElementsGroup && that._axisElementsGroup.getBBox() || {};
                _each(majorTicks, function(_, tick) {
                    if (tick.label) {
                        tick.label.attr(that._getLabelAdjustedCoord(tick, boxAxis));
                        hasLabels = true
                    }
                });
                isNeedLabelAdjustment = hasLabels && isHorizontal && overlappingBehavior && overlappingBehavior.mode === "stagger";
                if (isNeedLabelAdjustment) {
                    labelHeight = 0;
                    for (i = 0; i < majorTicksLength; i = i + 2) {
                        label = majorTicks[i].label;
                        box = label && label.getBBox() || {};
                        if (box.height > labelHeight)
                            labelHeight = box.height
                    }
                    staggeringSpacing = overlappingBehavior.staggeringSpacing;
                    labelHeight = _round(labelHeight) + staggeringSpacing;
                    for (i = 1; i < majorTicksLength; i = i + 2) {
                        label = majorTicks[i].label;
                        if (label)
                            if (position === constants.bottom)
                                label.move(0, labelHeight);
                            else if (position === constants.top)
                                label.move(0, -labelHeight)
                    }
                    for (i = 0; i < majorTicksLength; i++)
                        majorTicks[i].label && majorTicks[i].label.rotate(0)
                }
            },
            _getLabelAdjustedCoord: function(tick, boxAxis) {
                var that = this,
                    options = that._options,
                    box = tick.label.getBBox(),
                    x,
                    y,
                    isHorizontal = that._isHorizontal,
                    position = options.position,
                    shift = that.padding && that.padding[position] || 0,
                    textOptions = that._textOptions,
                    labelSettingsY = tick.label.attr("y");
                if (isHorizontal && position === constants.bottom)
                    y = 2 * labelSettingsY - box.y + shift;
                else if (!isHorizontal) {
                    if (position === constants.left)
                        if (textOptions.align === constants.right)
                            x = box.x + box.width - shift;
                        else if (textOptions.align === constants.center)
                            x = box.x + box.width / 2 - shift - (boxAxis.width / 2 || 0);
                        else
                            x = box.x - shift - (boxAxis.width || 0);
                    else if (textOptions.align === constants.center)
                        x = box.x + box.width / 2 + (boxAxis.width / 2 || 0) + shift;
                    else if (textOptions.align === constants.right)
                        x = box.x + box.width + (boxAxis.width || 0) + shift;
                    else
                        x = box.x + shift;
                    y = labelSettingsY + ~~(labelSettingsY - box.y - box.height / 2)
                }
                else if (isHorizontal && position === constants.top)
                    y = 2 * labelSettingsY - box.y - box.height - shift;
                return {
                        x: x,
                        y: y
                    }
            },
            _createAxisGroups: function() {
                var that = this,
                    renderer = that._renderer,
                    classSelector = that._axisCssPrefix;
                that._axisGroup = renderer.g().attr({"class": classSelector + "axis"});
                that._axisStripGroup = renderer.g().attr({"class": classSelector + "strips"});
                that._axisGridGroup = renderer.g().attr({"class": classSelector + "grid"});
                that._axisElementsGroup = renderer.g().attr({"class": classSelector + "elements"}).append(that._axisGroup);
                that._axisLineGroup = renderer.g().attr({"class": classSelector + "line"}).append(that._axisGroup);
                that._axisTitleGroup = renderer.g().attr({"class": classSelector + "title"}).append(that._axisGroup);
                that._axisConstantLineGroup = renderer.g().attr({"class": classSelector + "constant-lines"});
                that._axisLabelGroup = renderer.g().attr({"class": classSelector + "axis-labels"})
            },
            _clearAxisGroups: function(adjustAxis) {
                var that = this,
                    classSelector = that._axisCssPrefix;
                that._axisGroup.remove();
                that._axisStripGroup.remove();
                that._axisLabelGroup.remove();
                that._axisConstantLineGroup.remove();
                that._axisGridGroup.remove();
                if (that._axisTitleGroup)
                    that._axisTitleGroup.clear();
                else if (!adjustAxis)
                    that._axisTitleGroup = that._renderer.g().attr({"class": classSelector + "title"}).append(that._axisGroup);
                if (that._axisElementsGroup)
                    that._axisElementsGroup.clear();
                else if (!adjustAxis)
                    that._axisElementsGroup = that._renderer.g().attr({"class": classSelector + "elements"}).append(that._axisGroup);
                that._axisLineGroup && that._axisLineGroup.clear();
                that._axisStripGroup && that._axisStripGroup.clear();
                that._axisGridGroup && that._axisGridGroup.clear();
                that._axisConstantLineGroup && that._axisConstantLineGroup.clear();
                that._axisLabelGroup && that._axisLabelGroup.clear();
                that._labelAxesGroup && that._labelAxesGroup.clear()
            },
            _initTickCoord: function(tick, offset) {
                var coord = this._getTranslatedValue(tick.value, this._axisPosition, offset);
                tick.posX = coord.x;
                tick.posY = coord.y;
                tick.angle = coord.angle
            },
            _initTickStyle: function(tick, style) {
                tick.length = style.length;
                tick.tickStyle = tick.withoutPath ? {
                    stroke: "none",
                    "stroke-width": 0,
                    "stroke-opacity": 0
                } : style.tickStyle;
                tick.gridStyle = style.gridStyle
            },
            _initTickLabel: function(tick, position) {
                var that = this,
                    customizeColor = that._options.label.customizeColor;
                tick.labelText = constants.formatLabel(tick.value, that._options.label, {
                    min: that._minBound,
                    max: that._maxBound
                });
                tick.labelPos = that._getTranslatedValue(tick.value, position);
                tick.labelStyle = that._textOptions;
                tick.labelFontStyle = _extend({}, that._textFontStyles);
                if (customizeColor && customizeColor.call)
                    tick.labelFontStyle.fill = customizeColor.call(tick, tick);
                tick.labelHint = constants.formatHint(tick.value, that._options.label, {
                    min: that._minBound,
                    max: that._maxBound
                })
            },
            _getTickStyle: function(tickOptions, gridOptions) {
                return {
                        tickStyle: {
                            stroke: tickOptions.color,
                            "stroke-width": tickOptions.width,
                            "stroke-opacity": tickOptions.opacity
                        },
                        gridStyle: {
                            stroke: gridOptions.color,
                            "stroke-width": gridOptions.width,
                            "stroke-opacity": gridOptions.opacity
                        },
                        length: tickOptions.length
                    }
            },
            _initTicks: function(ticks, style, withLabels, skippedCategory, offset, labelPosition) {
                var that = this,
                    i = 0,
                    length = ticks.length,
                    indexSkippedCategory = findSkippedIndexCategory(ticks, skippedCategory),
                    tick;
                for (i; i < length; i++) {
                    tick = ticks[i];
                    i !== indexSkippedCategory && that._initTickCoord(tick, offset);
                    that._initTickStyle(tick, style);
                    withLabels && !tick.withoutLabel && that._initTickLabel(tick, labelPosition)
                }
            },
            _initAllTicks: function() {
                var that = this,
                    options = that._options,
                    majorTickStyle = that._getTickStyle(options.tick, options.grid),
                    minorTickStyle = that._getTickStyle(options.minorTick, options.minorGrid),
                    skippedCategory = that._getSkippedCategory(),
                    boundaryTicks = this._boundaryTicks,
                    withLabels = options.label.visible && that._axisElementsGroup && !that._translator.getBusinessRange().stubData,
                    labelPosition = that.getCurrentLabelPos(),
                    offset = that._tickOffset;
                that._initTicks(that._majorTicks, majorTickStyle, withLabels, skippedCategory, offset, labelPosition);
                that._initTicks(that._minorTicks, minorTickStyle, false, undefined, offset);
                that._initTicks(that._decimatedTicks, majorTickStyle, false, skippedCategory, offset);
                if (options.showCustomBoundaryTicks && boundaryTicks.length) {
                    that._initTicks([boundaryTicks[0]], majorTickStyle, false, -1, -1);
                    boundaryTicks.length > 1 && that._initTicks([boundaryTicks[1]], majorTickStyle, false, -1, 1)
                }
            },
            _buildTicks: function() {
                var that = this;
                that._createAllTicks(that._translator.getBusinessRange());
                that._correctLabelAlignment();
                that._correctLabelFormat()
            },
            _setTickOffset: function() {
                var options = this._options,
                    discreteAxisDivisionMode = options.discreteAxisDivisionMode;
                this._tickOffset = +(discreteAxisDivisionMode !== "crossLabels" || !discreteAxisDivisionMode)
            },
            _createHints: function() {
                var that = this;
                _each(that._majorTicks || [], function(_, tick) {
                    var labelHint = tick.labelHint;
                    if (_isDefined(labelHint) && labelHint !== "")
                        tick.label.setTitle(labelHint)
                })
            },
            _setBoundingRect: function() {
                var that = this,
                    options = that._options,
                    axisBox = that._axisElementsGroup ? that._axisElementsGroup.getBBox() : {
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0,
                        isEmpty: true
                    },
                    lineBox = that._axisLineGroup.getBBox(),
                    placeholderSize = options.placeholderSize,
                    start,
                    isHorizontal = that._isHorizontal,
                    coord = isHorizontal ? "y" : "x",
                    side = isHorizontal ? "height" : "width",
                    shiftCoords = options.crosshairEnabled ? isHorizontal ? LABEL_BACKGROUND_PADDING_Y : LABEL_BACKGROUND_PADDING_X : 0,
                    axisTitleBox = that._title && that._axisTitleGroup ? that._axisTitleGroup.getBBox() : axisBox;
                if (axisBox.isEmpty && axisTitleBox.isEmpty && !placeholderSize) {
                    that.boundingRect = axisBox;
                    return
                }
                start = lineBox[coord] || that._axisPosition;
                if (options.position === (isHorizontal && constants.bottom || constants.right)) {
                    axisBox[side] = placeholderSize || axisTitleBox[coord] + axisTitleBox[side] - start + shiftCoords;
                    axisBox[coord] = start
                }
                else {
                    axisBox[side] = placeholderSize || lineBox[side] + start - axisTitleBox[coord] + shiftCoords;
                    axisBox[coord] = axisTitleBox.isEmpty ? start : axisTitleBox[coord] - shiftCoords
                }
                that.boundingRect = axisBox
            },
            _validateUnit: function(unit, idError, parameters) {
                var that = this;
                unit = that.parser(unit);
                if (unit === undefined && idError)
                    that._incidentOccured(idError, [parameters]);
                return unit
            },
            _setType: function(axisType, drawingType) {
                var that = this;
                _each(viz.axes[axisType][drawingType], function(methodName, method) {
                    that[methodName] = method
                })
            },
            _getSharpParam: function() {
                return true
            },
            dispose: function() {
                var that = this;
                that._axisElementsGroup && that._axisElementsGroup.dispose();
                that._stripLabels = that._strips = null;
                that._title = null;
                that._axisStripGroup = that._axisConstantLineGroup = that._axisLabelGroup = null;
                that._axisLineGroup = that._axisElementsGroup = that._axisGridGroup = null;
                that._axisGroup = that._axisTitleGroup = null;
                that._axesContainerGroup = that._stripsGroup = that._constantLinesGroup = null;
                that._renderer = that._options = that._textOptions = that._textFontStyles = null;
                that._translator = that._additionalTranslator = null;
                that._majorTicks = that._minorTicks = null;
                that._tickManager = null
            },
            getOptions: function() {
                return this._options
            },
            setPane: function(pane) {
                this.pane = pane;
                this._options.pane = pane
            },
            setTypes: function(type, axisType, typeSelector) {
                this._options.type = type || this._options.type;
                this._options[typeSelector] = axisType || this._options[typeSelector]
            },
            resetTypes: function(typeSelector) {
                this._options.type = this._initTypes.type;
                this._options[typeSelector] = this._initTypes[typeSelector]
            },
            getTranslator: function() {
                return this._translator
            },
            updateOptions: function(options) {
                var that = this,
                    labelOpt = options.label;
                that._options = options;
                options.tick = options.tick || {};
                options.minorTick = options.minorTick || {};
                options.grid = options.grid || {};
                options.minorGrid = options.minorGrid || {};
                options.title = options.title || {};
                options.marker = options.marker || {};
                that._initTypes = {
                    type: options.type,
                    argumentType: options.argumentType,
                    valueType: options.valueType
                };
                validateAxisOptions(options);
                that._setTickOffset();
                that._isHorizontal = options.isHorizontal;
                that.pane = options.pane;
                that.name = options.name;
                that.priority = options.priority;
                that._hasLabelFormat = labelOpt.format !== "" && _isDefined(labelOpt.format);
                that._textOptions = {
                    align: labelOpt.alignment,
                    opacity: labelOpt.opacity
                };
                that._textFontStyles = viz.utils.patchFontOptions(labelOpt.font);
                if (options.type === constants.logarithmic) {
                    if (options.logarithmBaseError) {
                        that._incidentOccured("E2104");
                        delete options.logarithmBaseError
                    }
                    that.calcInterval = function(value, prevValue) {
                        return mathUtils.getLog(value / prevValue, options.logarithmBase)
                    }
                }
            },
            updateSize: function(clearAxis) {
                var that = this,
                    options = that._options,
                    direction = that._isHorizontal ? "horizontal" : "vertical";
                if (options.title.text && that._axisTitleGroup) {
                    that._incidentOccured("W2105", [direction]);
                    that._axisTitleGroup.dispose();
                    that._axisTitleGroup = null
                }
                if (clearAxis && that._axisElementsGroup && options.label.visible && !that._translator.getBusinessRange().stubData) {
                    that._incidentOccured("W2106", [direction]);
                    that._axisElementsGroup.dispose();
                    that._axisElementsGroup = null
                }
                that._setBoundingRect()
            },
            setTranslator: function(translator, additionalTranslator) {
                var that = this,
                    range = translator.getBusinessRange();
                this._minBound = range.minVisible;
                this._maxBound = range.maxVisible;
                that._translator = translator;
                that._additionalTranslator = additionalTranslator;
                that.resetTicks();
                that._updateTranslatorInterval();
                that._buildTicks();
                that._updateBusinessRangeInterval()
            },
            resetTicks: function() {
                this._deleteLabels();
                this._majorTicks = this._minorTicks = null
            },
            getCurrentLabelPos: function() {
                var that = this,
                    options = that._options,
                    position = options.position,
                    labelOffset = options.label.indentFromAxis,
                    axisPosition = that._axisPosition;
                return position === constants.top || position === constants.left ? axisPosition - labelOffset : axisPosition + labelOffset
            },
            getFormattedValue: function(value) {
                if (_isDefined(value))
                    return constants.formatLabel(_isNumber(value) && !_isString(value) ? _roundValue(value, _getSignificantDigitPosition(this._translator.getBusinessRange().interval)) : value, this._options.label);
                return null
            },
            getTicksValues: function() {
                return {
                        majorTicksValues: constants.convertTicksToValues(this._majorTicks || this.getMajorTicks()),
                        minorTicksValues: constants.convertTicksToValues(this._minorTicks || this.getMinorTicks())
                    }
            },
            getMajorTicks: function(withoutOverlappingBehavior) {
                var that = this,
                    overlappingBehavior = that._options.label.overlappingBehavior,
                    majorTicks,
                    boundedOverlappedTicks;
                that._updateTickManager();
                that._textOptions.rotate = 0;
                majorTicks = constants.convertValuesToTicks(that._tickManager.getTicks(withoutOverlappingBehavior));
                if (majorTicks.length)
                    if (overlappingBehavior.hideFirstTick || overlappingBehavior.hideLastTick || overlappingBehavior.hideFirstLabel || overlappingBehavior.hideLastLabel) {
                        overlappingBehavior.hideFirstLabel && (majorTicks[0].withoutLabel = true);
                        overlappingBehavior.hideLastLabel && (majorTicks[majorTicks.length - 1].withoutLabel = true);
                        overlappingBehavior.hideFirstTick && (majorTicks[0].withoutPath = true);
                        overlappingBehavior.hideLastTick && (majorTicks[majorTicks.length - 1].withoutPath = true)
                    }
                    else if (!withoutOverlappingBehavior && overlappingBehavior.mode !== "ignore") {
                        boundedOverlappedTicks = that._tickManager.checkBoundedTicksOverlapping();
                        boundedOverlappedTicks.overlappedDates && (majorTicks[1].withoutLabel = true);
                        if (boundedOverlappedTicks.overlappedStartEnd)
                            overlappingBehavior.hideFirstOrLast === "first" ? majorTicks[0].withoutLabel = true : majorTicks[majorTicks.length - 1].withoutLabel = true
                    }
                that._addBoundaryTick(majorTicks);
                return majorTicks
            },
            getMinorTicks: function() {
                return constants.convertValuesToTicks(this._tickManager.getMinorTicks())
            },
            getDecimatedTicks: function() {
                return constants.convertValuesToTicks(this._tickManager.getDecimatedTicks())
            },
            setTicks: function(ticks) {
                this.resetTicks();
                this._majorTicks = constants.convertValuesToTicks(ticks.majorTicks);
                this._minorTicks = constants.convertValuesToTicks(ticks.minorTicks)
            },
            setPercentLabelFormat: function() {
                if (!this._hasLabelFormat)
                    this._options.label.format = "percent"
            },
            resetAutoLabelFormat: function() {
                if (!this._hasLabelFormat)
                    delete this._options.label.format
            },
            getMultipleAxesSpacing: function() {
                return this._options.multipleAxesSpacing || 0
            },
            drawGrids: function(borderOptions) {
                var that = this,
                    options = that._options;
                borderOptions = borderOptions || {};
                that._axisGridGroup.append(that._gridContainerGroup);
                if (options.grid.visible)
                    that._drawGrids(that._majorTicks.concat(that._decimatedTicks), borderOptions);
                options.minorGrid.visible && that._drawGrids(that._minorTicks, borderOptions)
            },
            draw: function(adjustAxis) {
                var that = this,
                    options = that._options,
                    areLabelsVisible;
                that._axisGroup && that._clearAxisGroups(adjustAxis);
                areLabelsVisible = options.label.visible && that._axisElementsGroup && !that._translator.getBusinessRange().stubData;
                that._updateTranslatorInterval();
                that._buildTicks();
                that._updateBusinessRangeInterval();
                that._initAxisPositions();
                that._initAllTicks();
                options.visible && that._drawAxis();
                if (options.tick.visible) {
                    that._drawTicks(that._majorTicks);
                    that._drawTicks(that._decimatedTicks)
                }
                options.minorTick.visible && that._drawTicks(that._minorTicks);
                areLabelsVisible && that._drawLabels();
                options.showCustomBoundaryTicks && this._drawTicks(that._boundaryTicks);
                that._drawTitle();
                options.strips && that._drawStrip();
                options.constantLines && that._drawConstantLine();
                that._stripsGroup && that._axisStripGroup.append(that._stripsGroup);
                that._constantLinesGroup && that._axisConstantLineGroup.append(that._constantLinesGroup);
                that._axisGroup.append(that._axesContainerGroup);
                that._labelAxesGroup && that._axisLabelGroup.append(that._labelAxesGroup);
                that._adjustConstantLineLabels();
                areLabelsVisible && that._adjustLabels();
                options.marker.visible && that._drawDateMarkers();
                that._createHints();
                that._adjustStripLabels();
                that._adjustTitle();
                that._setBoundingRect()
            },
            getBoundingRect: function() {
                return this._axisElementsGroup ? this.boundingRect : {
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0
                    }
            },
            shift: function(x, y) {
                this._axisGroup.attr({
                    translateX: x,
                    translateY: y
                })
            },
            applyClipRects: function(elementsClipID, canvasClipID) {
                this._axisGroup.attr({clipId: canvasClipID});
                this._axisStripGroup.attr({clipId: elementsClipID})
            },
            validate: function(isArgumentAxis) {
                var that = this,
                    options = that._options,
                    dataType = isArgumentAxis ? options.argumentType : options.valueType,
                    parser = dataType ? parseUtils.getParser(dataType) : function(unit) {
                        return unit
                    };
                that.parser = parser;
                options.dataType = dataType;
                if (options.min !== undefined)
                    options.min = that._validateUnit(options.min, "E2106");
                if (options.max !== undefined)
                    options.max = that._validateUnit(options.max, "E2106");
                if (that._minBound !== undefined)
                    that._minBound = that._validateUnit(that._minBound);
                if (that._maxBound !== undefined)
                    that._maxBound = that._validateUnit(that._maxBound)
            },
            zoom: function(min, max, skipAdjusting) {
                var that = this,
                    minOpt = that._options.min,
                    maxOpt = that._options.max;
                skipAdjusting = skipAdjusting || that._options.type === constants.discrete;
                min = that._validateUnit(min);
                max = that._validateUnit(max);
                if (!skipAdjusting) {
                    if (minOpt !== undefined) {
                        min = minOpt > min ? minOpt : min;
                        max = minOpt > max ? minOpt : max
                    }
                    if (maxOpt !== undefined) {
                        max = maxOpt < max ? maxOpt : max;
                        min = maxOpt < min ? maxOpt : min
                    }
                }
                that._zoomArgs = {
                    min: min,
                    max: max
                };
                return that._zoomArgs
            },
            resetZoom: function() {
                this._zoomArgs = null
            },
            getRangeData: function() {
                var that = this,
                    options = that._options,
                    minMax = that._getMinMax(),
                    min = minMax.min,
                    max = minMax.max,
                    zoomArgs = that._zoomArgs || {},
                    type = options.type,
                    rangeMin,
                    rangeMax,
                    rangeMinVisible,
                    rangeMaxVisible;
                if (type === constants.logarithmic) {
                    min = min <= 0 ? undefined : min;
                    max = max <= 0 ? undefined : max
                }
                if (type !== constants.discrete) {
                    rangeMin = min;
                    rangeMax = max;
                    if (_isDefined(min) && _isDefined(max)) {
                        rangeMin = min < max ? min : max;
                        rangeMax = max > min ? max : min
                    }
                    rangeMinVisible = _isDefined(zoomArgs.min) ? zoomArgs.min : rangeMin;
                    rangeMaxVisible = _isDefined(zoomArgs.max) ? zoomArgs.max : rangeMax
                }
                else {
                    rangeMinVisible = _isDefined(zoomArgs.min) ? zoomArgs.min : min;
                    rangeMaxVisible = _isDefined(zoomArgs.max) ? zoomArgs.max : max
                }
                return {
                        min: rangeMin,
                        max: rangeMax,
                        stick: that._getStick(),
                        categories: options.categories,
                        dataType: options.dataType,
                        axisType: type,
                        base: options.logarithmBase,
                        invert: options.inverted,
                        addSpiderCategory: that._getSpiderCategoryOption(),
                        minVisible: rangeMinVisible,
                        maxVisible: rangeMaxVisible
                    }
            },
            getFullTicks: function() {
                return this._tickManager.getFullTicks()
            },
            _addBoundaryTick: _noop,
            getMarkerTrackers: _noop,
            measureLabels: _noop,
            _drawDateMarkers: _noop,
            coordsIn: _noop,
            _getSkippedCategory: _noop,
            _initAxisPositions: _noop,
            _drawTitle: _noop,
            _adjustConstantLineLabels: _noop,
            _adjustTitle: _noop,
            getSpiderTicks: _noop,
            setSpiderTicks: _noop,
            _getTickCoord: DX.abstract
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file svgRenderer.js */
    (function($, DX, doc, undefined) {
        var rendererNS = DX.viz.renderers = {},
            commonUtils = DX.require("/utils/utils.common"),
            math = Math,
            mathMin = math.min,
            mathMax = math.max,
            mathCeil = math.ceil,
            mathFloor = math.floor,
            mathRound = math.round,
            mathSin = math.sin,
            mathCos = math.cos,
            mathAbs = math.abs,
            mathPI = math.PI,
            _isDefined = commonUtils.isDefined,
            _normalizeEnum = DX.viz.utils.normalizeEnum,
            PI_DIV_180 = mathPI / 180,
            _parseInt = parseInt,
            MAX_PIXEL_COUNT = 1E10,
            SHARPING_CORRECTION = 0.5,
            ARC_COORD_PREC = 5;
        var pxAddingExceptions = {
                "column-count": true,
                "fill-opacity": true,
                "flex-grow": true,
                "flex-shrink": true,
                "font-weight": true,
                "line-height": true,
                opacity: true,
                order: true,
                orphans: true,
                widows: true,
                "z-index": true,
                zoom: true
            };
        var KEY_TEXT = "text",
            KEY_STROKE = "stroke",
            KEY_STROKE_WIDTH = "stroke-width",
            KEY_STROKE_OPACITY = "stroke-opacity",
            KEY_FONT_SIZE = "font-size",
            KEY_FONT_STYLE = "font-style",
            KEY_FONT_WEIGHT = "font-weight",
            KEY_TEXT_DECORATION = "text-decoration",
            NONE = "none";
        var objectCreate = function() {
                if (!Object.create)
                    return function(proto) {
                            var F = function(){};
                            F.prototype = proto;
                            return new F
                        };
                else
                    return function(proto) {
                            return Object.create(proto)
                        }
            }();
        var DEFAULTS = {
                scaleX: 1,
                scaleY: 1
            };
        var backupContainer = doc.createElement("div"),
            backupCounter = 0;
        backupContainer.style.left = "-9999px";
        backupContainer.style.position = "absolute";
        function backupRoot(root) {
            if (backupCounter === 0)
                doc.body.appendChild(backupContainer);
            ++backupCounter;
            root.append({element: backupContainer})
        }
        function restoreRoot(root, container) {
            root.append({element: container});
            --backupCounter;
            if (backupCounter === 0)
                doc.body.removeChild(backupContainer)
        }
        var getNextDefsSvgId = function() {
                var numDefsSvgElements = 1;
                return function() {
                        return "DevExpress_" + numDefsSvgElements++
                    }
            }();
        function isObjectArgument(value) {
            return value && typeof value !== "string"
        }
        function createElement(tagName) {
            return doc.createElementNS("http://www.w3.org/2000/svg", tagName)
        }
        function getPatternUrl(id, pathModified) {
            return id !== null ? "url(" + (pathModified ? window.location.href : "") + "#" + id + ")" : ""
        }
        function extend(target, source) {
            var key;
            for (key in source)
                target[key] = source[key];
            return target
        }
        function rotateBBox(bbox, center, angle) {
            var cos = Number(mathCos(angle * PI_DIV_180).toFixed(3)),
                sin = Number(mathSin(angle * PI_DIV_180).toFixed(3)),
                w2 = bbox.width / 2,
                h2 = bbox.height / 2,
                xc = bbox.x + w2,
                yc = bbox.y + h2,
                w2_ = mathAbs(w2 * cos) + mathAbs(h2 * sin),
                h2_ = mathAbs(w2 * sin) + mathAbs(h2 * cos),
                xc_ = center[0] + (xc - center[0]) * cos + (yc - center[1]) * sin,
                yc_ = center[1] - (xc - center[0]) * sin + (yc - center[1]) * cos;
            return normalizeBBox({
                    x: xc_ - w2_,
                    y: yc_ - h2_,
                    width: 2 * w2_,
                    height: 2 * h2_
                })
        }
        function normalizeBBoxField(value) {
            return -MAX_PIXEL_COUNT < value && value < +MAX_PIXEL_COUNT ? value : 0
        }
        function normalizeBBox(bbox) {
            var rxl = normalizeBBoxField(mathFloor(bbox.x)),
                ryt = normalizeBBoxField(mathFloor(bbox.y)),
                rxr = normalizeBBoxField(mathCeil(bbox.width + bbox.x)),
                ryb = normalizeBBoxField(mathCeil(bbox.height + bbox.y)),
                result = {
                    x: rxl,
                    y: ryt,
                    width: rxr - rxl,
                    height: ryb - ryt
                };
            result.isEmpty = !result.x && !result.y && !result.width && !result.height;
            return result
        }
        var preserveAspectRatioMap = {
                full: NONE,
                lefttop: "xMinYMin",
                leftcenter: "xMinYMid",
                leftbottom: "xMinYMax",
                centertop: "xMidYMin",
                center: "xMidYMid",
                centerbottom: "xMidYMax",
                righttop: "xMaxYMin",
                rightcenter: "xMaxYMid",
                rightbottom: "xMaxYMax"
            };
        rendererNS._normalizeArcParams = function(x, y, innerR, outerR, startAngle, endAngle) {
            var isCircle,
                noArc = true;
            if (mathRound(startAngle) !== mathRound(endAngle)) {
                if (mathAbs(endAngle - startAngle) % 360 === 0) {
                    startAngle = 0;
                    endAngle = 360;
                    isCircle = true;
                    endAngle -= 0.01
                }
                if (startAngle > 360)
                    startAngle = startAngle % 360;
                if (endAngle > 360)
                    endAngle = endAngle % 360;
                if (startAngle > endAngle)
                    startAngle -= 360;
                noArc = false
            }
            startAngle = startAngle * PI_DIV_180;
            endAngle = endAngle * PI_DIV_180;
            return [x, y, mathMin(outerR, innerR), mathMax(outerR, innerR), mathCos(startAngle), mathSin(startAngle), mathCos(endAngle), mathSin(endAngle), isCircle, mathFloor(mathAbs(endAngle - startAngle) / mathPI) % 2 ? "1" : "0", noArc]
        };
        var applyEllipsis = getEllipsis(prepareLines, setNewText, removeTextSpan);
        var buildArcPath = function(x, y, innerR, outerR, startAngleCos, startAngleSin, endAngleCos, endAngleSin, isCircle, longFlag) {
                return ["M", (x + outerR * startAngleCos).toFixed(ARC_COORD_PREC), (y - outerR * startAngleSin).toFixed(ARC_COORD_PREC), "A", outerR.toFixed(ARC_COORD_PREC), outerR.toFixed(ARC_COORD_PREC), 0, longFlag, 0, (x + outerR * endAngleCos).toFixed(ARC_COORD_PREC), (y - outerR * endAngleSin).toFixed(ARC_COORD_PREC), isCircle ? "M" : "L", (x + innerR * endAngleCos).toFixed(5), (y - innerR * endAngleSin).toFixed(ARC_COORD_PREC), "A", innerR.toFixed(ARC_COORD_PREC), innerR.toFixed(ARC_COORD_PREC), 0, longFlag, 1, (x + innerR * startAngleCos).toFixed(ARC_COORD_PREC), (y - innerR * startAngleSin).toFixed(ARC_COORD_PREC), "Z"].join(" ")
            };
        function buildPathSegments(points, type) {
            var list = [["M", 0, 0]];
            switch (type) {
                case"line":
                    list = buildLineSegments(points);
                    break;
                case"area":
                    list = buildLineSegments(points, true);
                    break;
                case"bezier":
                    list = buildCurveSegments(points);
                    break;
                case"bezierarea":
                    list = buildCurveSegments(points, true);
                    break
            }
            return list
        }
        function buildLineSegments(points, close) {
            return buildSegments(points, buildSimpleLineSegment, close)
        }
        function buildCurveSegments(points, close) {
            return buildSegments(points, buildSimpleCurveSegment, close)
        }
        function buildSegments(points, buildSimpleSegment, close) {
            var i,
                ii,
                list = [];
            if (points[0] && points[0].length)
                for (i = 0, ii = points.length; i < ii; ++i)
                    buildSimpleSegment(points[i], close, list);
            else
                buildSimpleSegment(points, close, list);
            return list
        }
        function buildSimpleLineSegment(points, close, list) {
            var i = 0,
                k0 = list.length,
                k = k0,
                ii = (points || []).length;
            if (ii) {
                if (points[0].x !== undefined)
                    for (; i < ii; )
                        list[k++] = ["L", points[i].x, points[i++].y];
                else
                    for (; i < ii; )
                        list[k++] = ["L", points[i++], points[i++]];
                list[k0][0] = "M"
            }
            else
                list[k] = ["M", 0, 0];
            close && list.push(["Z"]);
            return list
        }
        function buildSimpleCurveSegment(points, close, list) {
            var i,
                k = list.length,
                ii = (points || []).length;
            if (ii)
                if (points[0].x !== undefined) {
                    list[k++] = ["M", points[0].x, points[0].y];
                    for (i = 1; i < ii; )
                        list[k++] = ["C", points[i].x, points[i++].y, points[i].x, points[i++].y, points[i].x, points[i++].y]
                }
                else {
                    list[k++] = ["M", points[0], points[1]];
                    for (i = 2; i < ii; )
                        list[k++] = ["C", points[i++], points[i++], points[i++], points[i++], points[i++], points[i++]]
                }
            else
                list[k] = ["M", 0, 0];
            close && list.push(["Z"]);
            return list
        }
        function combinePathParam(segments) {
            var d = [],
                k = 0,
                i,
                ii = segments.length,
                segment,
                j,
                jj;
            for (i = 0; i < ii; ++i) {
                segment = segments[i];
                for (j = 0, jj = segment.length; j < jj; ++j)
                    d[k++] = segment[j]
            }
            return d.join(" ")
        }
        function compensateSegments(oldSegments, newSegments, type) {
            var oldLength = oldSegments.length,
                newLength = newSegments.length,
                i,
                originalNewSegments,
                makeEqualSegments = type.indexOf("area") !== -1 ? makeEqualAreaSegments : makeEqualLineSegments;
            if (oldLength === 0)
                for (i = 0; i < newLength; i++)
                    oldSegments.push(newSegments[i].slice(0));
            else if (oldLength < newLength)
                makeEqualSegments(oldSegments, newSegments, type);
            else if (oldLength > newLength) {
                originalNewSegments = newSegments.slice(0);
                makeEqualSegments(newSegments, oldSegments, type)
            }
            return originalNewSegments
        }
        function prepareConstSegment(constSeg, type) {
            var x = constSeg[constSeg.length - 2],
                y = constSeg[constSeg.length - 1];
            switch (type) {
                case"line":
                case"area":
                    constSeg[0] = "L";
                    break;
                case"bezier":
                case"bezierarea":
                    constSeg[0] = "C";
                    constSeg[1] = constSeg[3] = constSeg[5] = x;
                    constSeg[2] = constSeg[4] = constSeg[6] = y;
                    break
            }
        }
        function makeEqualLineSegments(short, long, type) {
            var constSeg = short[short.length - 1].slice(),
                i = short.length;
            prepareConstSegment(constSeg, type);
            for (; i < long.length; i++)
                short[i] = constSeg.slice(0)
        }
        function makeEqualAreaSegments(short, long, type) {
            var i,
                head,
                shortLength = short.length,
                longLength = long.length,
                constsSeg1,
                constsSeg2;
            if ((shortLength - 1) % 2 === 0 && (longLength - 1) % 2 === 0) {
                i = (shortLength - 1) / 2 - 1;
                head = short.slice(0, i + 1);
                constsSeg1 = head[head.length - 1].slice(0);
                constsSeg2 = short.slice(i + 1)[0].slice(0);
                prepareConstSegment(constsSeg1, type);
                prepareConstSegment(constsSeg2, type);
                for (var j = i; j < (longLength - 1) / 2 - 1; j++) {
                    short.splice(j + 1, 0, constsSeg1);
                    short.splice(j + 3, 0, constsSeg2)
                }
            }
        }
        function baseCss(that, styles) {
            var elemStyles = that._styles,
                str = "",
                key,
                value;
            styles = styles || {};
            for (key in styles) {
                value = styles[key];
                if (_isDefined(value)) {
                    if (typeof value === "number" && !pxAddingExceptions[key])
                        value += "px";
                    elemStyles[key] = value !== "" ? value : null
                }
            }
            for (key in elemStyles) {
                value = elemStyles[key];
                if (value)
                    str += key + ":" + value + ";"
            }
            str && that.element.setAttribute("style", str);
            return that
        }
        function baseAttr(that, attrs, inh) {
            attrs = attrs || {};
            var settings = that._settings,
                attributes = {},
                key,
                value,
                elem = that.element,
                renderer = that.renderer,
                rtl = renderer.rtl,
                hasTransformations,
                recalculateDashStyle,
                sw,
                i;
            if (!isObjectArgument(attrs)) {
                if (attrs in settings)
                    return settings[attrs];
                if (attrs in DEFAULTS)
                    return DEFAULTS[attrs];
                return 0
            }
            extend(attributes, attrs);
            for (key in attributes) {
                value = attributes[key];
                if (value === undefined)
                    continue;
                settings[key] = value;
                if (key === "align") {
                    key = "text-anchor";
                    value = {
                        left: rtl ? "end" : "start",
                        center: "middle",
                        right: rtl ? "start" : "end"
                    }[value] || ""
                }
                else if (key === "dashStyle") {
                    recalculateDashStyle = true;
                    continue
                }
                else if (key === KEY_STROKE_WIDTH)
                    recalculateDashStyle = true;
                else if (key === "clipId") {
                    key = "clip-path";
                    value = getPatternUrl(value, renderer.pathModified)
                }
                else if (/^(translate(X|Y)|rotate[XY]?|scale(X|Y)|sharp)$/i.test(key)) {
                    hasTransformations = true;
                    continue
                }
                else if (/^(x|y|d)$/i.test(key))
                    hasTransformations = true;
                if (value === null)
                    elem.removeAttribute(key);
                else
                    elem.setAttribute(key, value)
            }
            if (recalculateDashStyle && "dashStyle" in settings) {
                value = settings.dashStyle;
                sw = ("_originalSW" in that ? that._originalSW : settings[KEY_STROKE_WIDTH]) || 1;
                key = "stroke-dasharray";
                value = value === null ? "" : _normalizeEnum(value);
                if (value === "" || value === "solid" || value === NONE)
                    that.element.removeAttribute(key);
                else {
                    value = value.replace(/longdash/g, "8,3,").replace(/dash/g, "4,3,").replace(/dot/g, "1,3,").replace(/,$/, "").split(",");
                    i = value.length;
                    while (i--)
                        value[i] = _parseInt(value[i]) * sw;
                    that.element.setAttribute(key, value.join(","))
                }
            }
            if (hasTransformations)
                that._applyTransformation();
            return that
        }
        function createPathAttr(baseAttr) {
            return function(attrs, inh) {
                    var that = this,
                        segments;
                    if (isObjectArgument(attrs)) {
                        attrs = extend({}, attrs);
                        segments = attrs.segments;
                        if ("points" in attrs) {
                            segments = buildPathSegments(attrs.points, that.type);
                            delete attrs.points
                        }
                        if (segments) {
                            attrs.d = combinePathParam(segments);
                            that.segments = segments;
                            delete attrs.segments
                        }
                    }
                    return baseAttr(that, attrs, inh)
                }
        }
        function createArcAttr(baseAttr, buildArcPath) {
            return function(attrs, inh) {
                    var settings = this._settings,
                        x,
                        y,
                        innerRadius,
                        outerRadius,
                        startAngle,
                        endAngle;
                    if (isObjectArgument(attrs)) {
                        attrs = extend({}, attrs);
                        if ("x" in attrs || "y" in attrs || "innerRadius" in attrs || "outerRadius" in attrs || "startAngle" in attrs || "endAngle" in attrs) {
                            settings.x = x = "x" in attrs ? attrs.x : settings.x;
                            delete attrs.x;
                            settings.y = y = "y" in attrs ? attrs.y : settings.y;
                            delete attrs.y;
                            settings.innerRadius = innerRadius = "innerRadius" in attrs ? attrs.innerRadius : settings.innerRadius;
                            delete attrs.innerRadius;
                            settings.outerRadius = outerRadius = "outerRadius" in attrs ? attrs.outerRadius : settings.outerRadius;
                            delete attrs.outerRadius;
                            settings.startAngle = startAngle = "startAngle" in attrs ? attrs.startAngle : settings.startAngle;
                            delete attrs.startAngle;
                            settings.endAngle = endAngle = "endAngle" in attrs ? attrs.endAngle : settings.endAngle;
                            delete attrs.endAngle;
                            attrs.d = buildArcPath.apply(null, rendererNS._normalizeArcParams(x, y, innerRadius, outerRadius, startAngle, endAngle))
                        }
                    }
                    return baseAttr(this, attrs, inh)
                }
        }
        function createRectAttr(baseAttr) {
            return function(attrs, inh) {
                    var that = this,
                        x,
                        y,
                        width,
                        height,
                        sw,
                        maxSW,
                        newSW;
                    if (isObjectArgument(attrs)) {
                        attrs = extend({}, attrs);
                        if (!inh && (attrs.x !== undefined || attrs.y !== undefined || attrs.width !== undefined || attrs.height !== undefined || attrs[KEY_STROKE_WIDTH] !== undefined)) {
                            attrs.x !== undefined ? x = that._originalX = attrs.x : x = that._originalX || 0;
                            attrs.y !== undefined ? y = that._originalY = attrs.y : y = that._originalY || 0;
                            attrs.width !== undefined ? width = that._originalWidth = attrs.width : width = that._originalWidth || 0;
                            attrs.height !== undefined ? height = that._originalHeight = attrs.height : height = that._originalHeight || 0;
                            attrs[KEY_STROKE_WIDTH] !== undefined ? sw = that._originalSW = attrs[KEY_STROKE_WIDTH] : sw = that._originalSW;
                            maxSW = ~~((width < height ? width : height) / 2);
                            newSW = (sw || 0) < maxSW ? sw || 0 : maxSW;
                            attrs.x = x + newSW / 2;
                            attrs.y = y + newSW / 2;
                            attrs.width = width - newSW;
                            attrs.height = height - newSW;
                            ((sw || 0) !== newSW || !(newSW === 0 && sw === undefined)) && (attrs[KEY_STROKE_WIDTH] = newSW)
                        }
                        if ("sharp" in attrs)
                            delete attrs.sharp
                    }
                    return baseAttr(that, attrs, inh)
                }
        }
        var pathAttr = createPathAttr(baseAttr),
            arcAttr = createArcAttr(baseAttr, buildArcPath),
            rectAttr = createRectAttr(baseAttr);
        function textAttr(attrs) {
            var that = this,
                settings,
                isResetRequired,
                wasStroked,
                isStroked;
            if (!isObjectArgument(attrs))
                return baseAttr(that, attrs);
            attrs = extend({}, attrs);
            settings = that._settings;
            wasStroked = _isDefined(settings[KEY_STROKE]) && _isDefined(settings[KEY_STROKE_WIDTH]);
            if (attrs[KEY_TEXT] !== undefined) {
                settings[KEY_TEXT] = attrs[KEY_TEXT];
                delete attrs[KEY_TEXT];
                isResetRequired = true
            }
            if (attrs[KEY_STROKE] !== undefined) {
                settings[KEY_STROKE] = attrs[KEY_STROKE];
                delete attrs[KEY_STROKE]
            }
            if (attrs[KEY_STROKE_WIDTH] !== undefined) {
                settings[KEY_STROKE_WIDTH] = attrs[KEY_STROKE_WIDTH];
                delete attrs[KEY_STROKE_WIDTH]
            }
            if (attrs[KEY_STROKE_OPACITY] !== undefined) {
                settings[KEY_STROKE_OPACITY] = attrs[KEY_STROKE_OPACITY];
                delete attrs[KEY_STROKE_OPACITY]
            }
            isStroked = _isDefined(settings[KEY_STROKE]) && _isDefined(settings[KEY_STROKE_WIDTH]);
            baseAttr(that, attrs);
            isResetRequired = isResetRequired || isStroked !== wasStroked && settings[KEY_TEXT];
            if (isResetRequired)
                createTextNodes(that, settings.text, isStroked);
            if (isResetRequired || attrs["x"] !== undefined || attrs["y"] !== undefined)
                locateTextNodes(that);
            if (isStroked)
                strokeTextNodes(that);
            return that
        }
        function textCss(styles) {
            styles = styles || {};
            baseCss(this, styles);
            if (KEY_FONT_SIZE in styles)
                locateTextNodes(this);
            return this
        }
        function orderHtmlTree(list, line, node, parentStyle, parentClassName) {
            var style,
                realStyle,
                i,
                ii,
                nodes;
            if (node.wholeText !== undefined)
                list.push({
                    value: node.wholeText,
                    style: parentStyle,
                    className: parentClassName,
                    line: line,
                    height: parentStyle[KEY_FONT_SIZE] || 0
                });
            else if (node.tagName === "BR")
                ++line;
            else {
                extend(style = {}, parentStyle);
                switch (node.tagName) {
                    case"B":
                    case"STRONG":
                        style[KEY_FONT_WEIGHT] = "bold";
                        break;
                    case"I":
                    case"EM":
                        style[KEY_FONT_STYLE] = "italic";
                        break;
                    case"U":
                        style[KEY_TEXT_DECORATION] = "underline";
                        break
                }
                realStyle = node.style;
                realStyle.color && (style.fill = realStyle.color);
                realStyle.fontSize && (style[KEY_FONT_SIZE] = _parseInt(realStyle.fontSize, 10));
                realStyle.fontStyle && (style[KEY_FONT_STYLE] = realStyle.fontStyle);
                realStyle.fontWeight && (style[KEY_FONT_WEIGHT] = realStyle.fontWeight);
                realStyle.textDecoration && (style[KEY_TEXT_DECORATION] = realStyle.textDecoration);
                for (i = 0, nodes = node.childNodes, ii = nodes.length; i < ii; ++i)
                    line = orderHtmlTree(list, line, nodes[i], style, node.className || parentClassName)
            }
            return line
        }
        function adjustLineHeights(items) {
            var i,
                ii,
                currentItem = items[0],
                item;
            for (i = 1, ii = items.length; i < ii; ++i) {
                item = items[i];
                if (item.line === currentItem.line) {
                    currentItem.height = mathMax(currentItem.height, item.height);
                    currentItem.inherits = currentItem.inherits || item.height === 0;
                    item.height = NaN
                }
                else
                    currentItem = item
            }
        }
        function parseHTML(text) {
            var items = [],
                div = doc.createElement("div");
            div.innerHTML = text.replace(/\r/g, "").replace(/\n/g, "<br/>");
            orderHtmlTree(items, 0, div, {}, "");
            adjustLineHeights(items);
            return items
        }
        function parseMultiline(text) {
            var texts = text.replace(/\r/g, "").split("\n"),
                i = 0,
                items = [];
            for (; i < texts.length; i++)
                items.push({
                    value: texts[i],
                    height: 0
                });
            return items
        }
        function createTspans(items, element, fieldName) {
            var i,
                ii,
                item;
            for (i = 0, ii = items.length; i < ii; ++i) {
                item = items[i];
                item[fieldName] = createElement("tspan");
                item[fieldName].appendChild(doc.createTextNode(item.value));
                item.style && baseCss({
                    element: item[fieldName],
                    _styles: {}
                }, item.style);
                item.className && item[fieldName].setAttribute("class", item.className);
                element.appendChild(item[fieldName])
            }
        }
        function getEllipsis(prepareLines, setNewText, removeTextSpan) {
            return function(maxWidth) {
                    var element = this.element,
                        lines,
                        width = this.getBBox().width,
                        maxLength = 0,
                        requiredLength,
                        hasEllipsis = false,
                        i,
                        ii,
                        lineParts,
                        j,
                        jj,
                        text;
                    if (maxWidth < 0)
                        maxWidth = 0;
                    if (width > maxWidth) {
                        lines = prepareLines(element, this._texts);
                        for (i = 0, ii = lines.length; i < ii; ++i)
                            maxLength = mathMax(maxLength, lines[i].commonLength);
                        requiredLength = mathFloor(maxLength * maxWidth / width);
                        for (i = 0; i < ii; ++i) {
                            lineParts = lines[i].parts;
                            for (j = 0, jj = lineParts.length; j < jj; ++j) {
                                text = lineParts[j];
                                if (text.startIndex <= requiredLength && text.endIndex > requiredLength) {
                                    setNewText(text, requiredLength - text.startIndex - 4);
                                    hasEllipsis = true
                                }
                                else if (text.startIndex > requiredLength)
                                    removeTextSpan(text)
                            }
                        }
                    }
                    return hasEllipsis
                }
        }
        function prepareLines(element, texts) {
            var lines = [],
                i,
                ii,
                text;
            if (texts)
                for (i = 0, ii = texts.length; i < ii; ++i) {
                    text = texts[i];
                    if (!lines[text.line]) {
                        text.startIndex = 0;
                        text.endIndex = text.value.length;
                        lines.push({
                            commonLength: text.value.length,
                            parts: [text]
                        })
                    }
                    else {
                        text.startIndex = lines[text.line].commonLength + 1;
                        text.endIndex = lines[text.line].commonLength + text.value.length;
                        lines[text.line].parts.push(text);
                        lines[text.line].commonLength += text.value.length
                    }
                }
            else
                lines = [{
                        commonLength: element.textContent.length,
                        parts: [{
                                value: element.textContent,
                                tspan: element,
                                startIndex: 0,
                                endIndex: element.textContent.length
                            }]
                    }];
            return lines
        }
        function setNewText(text, index) {
            var newText = text.value.substr(0, index) + "...";
            text.tspan.textContent = newText;
            text.stroke && (text.stroke.textContent = newText)
        }
        function removeTextSpan(text) {
            text.tspan.parentNode.removeChild(text.tspan);
            text.stroke && text.stroke.parentNode.removeChild(text.stroke)
        }
        function createTextNodes(wrapper, text, isStroked) {
            var items;
            wrapper._texts = null;
            wrapper.clear();
            if (text === null)
                return;
            text = "" + text;
            if (!wrapper.renderer.encodeHtml && (text.indexOf("<") !== -1 || text.indexOf("&") !== -1))
                items = parseHTML(text);
            else if (text.indexOf("\n") !== -1)
                items = parseMultiline(text);
            else if (isStroked)
                items = [{
                        value: text,
                        height: 0
                    }];
            if (items) {
                if (items.length) {
                    wrapper._texts = items;
                    if (isStroked)
                        createTspans(items, wrapper.element, KEY_STROKE);
                    createTspans(items, wrapper.element, "tspan")
                }
            }
            else
                wrapper.element.appendChild(doc.createTextNode(text))
        }
        function setTextNodeAttribute(item, name, value) {
            item.tspan.setAttribute(name, value);
            item.stroke && item.stroke.setAttribute(name, value)
        }
        function locateTextNodes(wrapper) {
            if (!wrapper._texts)
                return;
            var items = wrapper._texts,
                x = wrapper._settings.x,
                lineHeight = _parseInt(wrapper._styles[KEY_FONT_SIZE], 10) || 12,
                i,
                ii,
                item = items[0];
            setTextNodeAttribute(item, "x", x);
            setTextNodeAttribute(item, "y", wrapper._settings.y);
            for (i = 1, ii = items.length; i < ii; ++i) {
                item = items[i];
                if (item.height >= 0) {
                    setTextNodeAttribute(item, "x", x);
                    setTextNodeAttribute(item, "dy", item.inherits ? mathMax(item.height, lineHeight) : item.height || lineHeight)
                }
            }
        }
        function strokeTextNodes(wrapper) {
            if (!wrapper._texts)
                return;
            var items = wrapper._texts,
                stroke = wrapper._settings[KEY_STROKE],
                strokeWidth = wrapper._settings[KEY_STROKE_WIDTH],
                strokeOpacity = wrapper._settings[KEY_STROKE_OPACITY] || 1,
                tspan,
                i,
                ii;
            for (i = 0, ii = items.length; i < ii; ++i) {
                tspan = items[i].stroke;
                tspan.setAttribute(KEY_STROKE, stroke);
                tspan.setAttribute(KEY_STROKE_WIDTH, strokeWidth);
                tspan.setAttribute(KEY_STROKE_OPACITY, strokeOpacity);
                tspan.setAttribute("stroke-linejoin", "round")
            }
        }
        function baseAnimate(that, params, options, complete) {
            options = options || {};
            var key,
                value,
                renderer = that.renderer,
                settings = that._settings,
                animationParams = {};
            var defaults = {
                    translateX: 0,
                    translateY: 0,
                    scaleX: 1,
                    scaleY: 1,
                    rotate: 0,
                    rotateX: 0,
                    rotateY: 0
                };
            if (complete)
                options.complete = complete;
            if (renderer.animationEnabled()) {
                for (key in params) {
                    value = params[key];
                    if (/^(translate(X|Y)|rotate[XY]?|scale(X|Y))$/i.test(key)) {
                        animationParams.transform = animationParams.transform || {
                            from: {},
                            to: {}
                        };
                        animationParams.transform.from[key] = key in settings ? settings[key] : defaults[key];
                        animationParams.transform.to[key] = value
                    }
                    else if (key === "arc" || key === "segments")
                        animationParams[key] = value;
                    else
                        animationParams[key] = {
                            from: key in settings ? settings[key] : parseFloat(that.element.getAttribute(key) || 0),
                            to: value
                        }
                }
                renderer.animateElement(that, animationParams, extend(extend({}, renderer._animation), options))
            }
            else {
                options.step && options.step.call(that, 1, 1);
                options.complete && options.complete.call(that);
                that.attr(params)
            }
            return that
        }
        function pathAnimate(params, options, complete) {
            var that = this,
                curSegments = that.segments || [],
                newSegments,
                endSegments;
            if (that.renderer.animationEnabled() && "points" in params) {
                newSegments = buildPathSegments(params.points, that.type);
                endSegments = compensateSegments(curSegments, newSegments, that.type);
                params.segments = {
                    from: curSegments,
                    to: newSegments,
                    end: endSegments
                };
                delete params.points
            }
            return baseAnimate(that, params, options, complete)
        }
        function arcAnimate(params, options, complete) {
            var that = this,
                settings = that._settings,
                arcParams = {
                    from: {},
                    to: {}
                };
            if (that.renderer.animationEnabled() && ("x" in params || "y" in params || "innerRadius" in params || "outerRadius" in params || "startAngle" in params || "endAngle" in params)) {
                arcParams.from.x = settings.x || 0;
                arcParams.from.y = settings.y || 0;
                arcParams.from.innerRadius = settings.innerRadius || 0;
                arcParams.from.outerRadius = settings.outerRadius || 0;
                arcParams.from.startAngle = settings.startAngle || 0;
                arcParams.from.endAngle = settings.endAngle || 0;
                arcParams.to.x = "x" in params ? params.x : settings.x;
                delete params.x;
                arcParams.to.y = "y" in params ? params.y : settings.y;
                delete params.y;
                arcParams.to.innerRadius = "innerRadius" in params ? params.innerRadius : settings.innerRadius;
                delete params.innerRadius;
                arcParams.to.outerRadius = "outerRadius" in params ? params.outerRadius : settings.outerRadius;
                delete params.outerRadius;
                arcParams.to.startAngle = "startAngle" in params ? params.startAngle : settings.startAngle;
                delete params.startAngle;
                arcParams.to.endAngle = "endAngle" in params ? params.endAngle : settings.endAngle;
                delete params.endAngle;
                params.arc = arcParams
            }
            return baseAnimate(that, params, options, complete)
        }
        rendererNS.DEBUG_set_getNextDefsSvgId = function(newFunction) {
            getNextDefsSvgId = newFunction
        };
        rendererNS.DEBUG_removeBackupContainer = function() {
            if (backupCounter) {
                backupCounter = 0;
                doc.body.removeChild(backupContainer)
            }
        };
        function buildLink(target, parameters) {
            var obj = {
                    is: false,
                    name: parameters.name || parameters,
                    after: parameters.after
                };
            if (target)
                obj.to = target;
            else
                obj.virtual = true;
            return obj
        }
        function SvgElement(renderer, tagName, type) {
            var that = this;
            that.renderer = renderer;
            that.element = createElement(tagName);
            that._settings = {};
            that._styles = {};
            if (tagName === "path")
                that.type = type || "line"
        }
        rendererNS.SvgElement = SvgElement;
        SvgElement.prototype = {
            constructor: SvgElement,
            _getJQElement: function() {
                return this._$element || (this._$element = $(this.element))
            },
            dispose: function() {
                this._getJQElement().remove();
                return this
            },
            append: function(parent) {
                (parent || this.renderer.root).element.appendChild(this.element);
                return this
            },
            remove: function() {
                var element = this.element;
                element.parentNode && element.parentNode.removeChild(element);
                return this
            },
            enableLinks: function() {
                this._links = [];
                return this
            },
            checkLinks: function() {
                var count = 0,
                    links = this._links,
                    i,
                    ii = links.length;
                for (i = 0; i < ii; ++i)
                    if (!links[i]._link.virtual)
                        ++count;
                if (count > 0)
                    throw new Error("There are non disposed links!");
            },
            virtualLink: function(parameters) {
                linkItem({_link: buildLink(null, parameters)}, this);
                return this
            },
            linkAfter: function(name) {
                this._linkAfter = name;
                return this
            },
            linkOn: function(target, parameters) {
                this._link = buildLink(target, parameters);
                linkItem(this, target);
                return this
            },
            linkOff: function() {
                unlinkItem(this);
                this._link = null;
                return this
            },
            linkAppend: function() {
                var link = this._link,
                    items = link.to._links,
                    i,
                    next;
                for (i = link.i + 1; (next = items[i]) && !next._link.is; ++i);;
                this._insert(link.to, next);
                link.is = true;
                return this
            },
            _insert: function(parent, next) {
                parent.element.insertBefore(this.element, next ? next.element : null)
            },
            linkRemove: function() {
                this.remove();
                this._link.is = false;
                return this
            },
            clear: function() {
                this._getJQElement().empty();
                return this
            },
            toBackground: function() {
                var elem = this.element,
                    parent = elem.parentNode;
                parent && parent.insertBefore(elem, parent.firstChild);
                return this
            },
            toForeground: function() {
                var elem = this.element,
                    parent = elem.parentNode;
                parent && parent.appendChild(elem);
                return this
            },
            attr: function(attrs, inh) {
                return baseAttr(this, attrs, inh)
            },
            css: function(styles) {
                return baseCss(this, styles)
            },
            animate: function(params, options, complete) {
                return baseAnimate(this, params, options, complete)
            },
            sharp: function(pos) {
                return this.attr({sharp: pos || true})
            },
            _applyTransformation: function() {
                var tr = this._settings,
                    scaleXDefined,
                    scaleYDefined,
                    transformations = [],
                    rotateX,
                    rotateY,
                    sharpMode = tr.sharp,
                    strokeOdd = tr[KEY_STROKE_WIDTH] % 2,
                    correctionX = strokeOdd && (sharpMode === "h" || sharpMode === true) ? SHARPING_CORRECTION : 0,
                    correctionY = strokeOdd && (sharpMode === "v" || sharpMode === true) ? SHARPING_CORRECTION : 0;
                transformations.push("translate(" + ((tr.translateX || 0) + correctionX) + "," + ((tr.translateY || 0) + correctionY) + ")");
                if (tr.rotate) {
                    if ("rotateX" in tr)
                        rotateX = tr.rotateX;
                    else
                        rotateX = tr.x;
                    if ("rotateY" in tr)
                        rotateY = tr.rotateY;
                    else
                        rotateY = tr.y;
                    transformations.push("rotate(" + tr.rotate + "," + (rotateX || 0) + "," + (rotateY || 0) + ")")
                }
                scaleXDefined = _isDefined(tr.scaleX);
                scaleYDefined = _isDefined(tr.scaleY);
                if (scaleXDefined || scaleYDefined)
                    transformations.push("scale(" + (scaleXDefined ? tr.scaleX : 1) + "," + (scaleYDefined ? tr.scaleY : 1) + ")");
                if (transformations.length)
                    this.element.setAttribute("transform", transformations.join(" "))
            },
            move: function(x, y, animate, animOptions) {
                var obj = {};
                _isDefined(x) && (obj.translateX = x);
                _isDefined(y) && (obj.translateY = y);
                if (!animate)
                    this.attr(obj);
                else
                    this.animate(obj, animOptions);
                return this
            },
            rotate: function(angle, x, y, animate, animOptions) {
                var obj = {rotate: angle || 0};
                _isDefined(x) && (obj.rotateX = x);
                _isDefined(y) && (obj.rotateY = y);
                if (!animate)
                    this.attr(obj);
                else
                    this.animate(obj, animOptions);
                return this
            },
            getBBox: function() {
                var elem = this.element,
                    transformation = this._settings,
                    bBox;
                try {
                    bBox = elem.getBBox && elem.getBBox()
                }
                catch(e) {}
                bBox = bBox || {
                    x: 0,
                    y: 0,
                    width: elem.offsetWidth || 0,
                    height: elem.offsetHeight || 0
                };
                if (transformation.rotate)
                    bBox = rotateBBox(bBox, [("rotateX" in transformation ? transformation.rotateX : transformation.x) || 0, ("rotateY" in transformation ? transformation.rotateY : transformation.y) || 0], -transformation.rotate);
                else
                    bBox = normalizeBBox(bBox);
                return bBox
            },
            markup: function() {
                var temp = doc.createElement('div'),
                    node = this.element.cloneNode(true);
                temp.appendChild(node);
                return temp.innerHTML
            },
            getOffset: function() {
                return this._getJQElement().offset()
            },
            stopAnimation: function(disableComplete) {
                var animation = this.animation;
                animation && animation.stop(disableComplete);
                return this
            },
            setTitle: function(text) {
                var titleElem = createElement('title');
                titleElem.textContent = text || '';
                this.element.appendChild(titleElem)
            },
            data: function(obj, val) {
                var elem = this.element,
                    key;
                if (val !== undefined)
                    elem[obj] = val;
                else
                    for (key in obj)
                        elem[key] = obj[key];
                return this
            },
            on: function() {
                $.fn.on.apply(this._getJQElement(), arguments);
                return this
            },
            off: function() {
                $.fn.off.apply(this._getJQElement(), arguments);
                return this
            },
            trigger: function() {
                $.fn.trigger.apply(this._getJQElement(), arguments);
                return this
            }
        };
        function PathSvgElement(renderer, type) {
            SvgElement.call(this, renderer, "path", type)
        }
        rendererNS.PathSvgElement = PathSvgElement;
        PathSvgElement.prototype = objectCreate(SvgElement.prototype);
        extend(PathSvgElement.prototype, {
            constructor: PathSvgElement,
            attr: pathAttr,
            animate: pathAnimate
        });
        function ArcSvgElement(renderer) {
            SvgElement.call(this, renderer, "path", "arc")
        }
        rendererNS.ArcSvgElement = ArcSvgElement;
        ArcSvgElement.prototype = objectCreate(SvgElement.prototype);
        extend(ArcSvgElement.prototype, {
            constructor: ArcSvgElement,
            attr: arcAttr,
            animate: arcAnimate
        });
        function RectSvgElement(renderer) {
            SvgElement.call(this, renderer, "rect")
        }
        rendererNS.RectSvgElement = RectSvgElement;
        RectSvgElement.prototype = objectCreate(SvgElement.prototype);
        extend(RectSvgElement.prototype, {
            constructor: RectSvgElement,
            attr: rectAttr
        });
        function TextSvgElement(renderer) {
            SvgElement.call(this, renderer, "text")
        }
        rendererNS.TextSvgElement = TextSvgElement;
        TextSvgElement.prototype = objectCreate(SvgElement.prototype);
        extend(TextSvgElement.prototype, {
            constructor: TextSvgElement,
            attr: textAttr,
            css: textCss,
            applyEllipsis: applyEllipsis
        });
        function updateIndexes(items, k) {
            var i,
                item;
            for (i = k; !!(item = items[i]); ++i)
                item._link.i = i
        }
        function linkItem(target, container) {
            var items = container._links,
                key = target._link.after = target._link.after || container._linkAfter,
                i,
                item;
            if (key) {
                for (i = 0; (item = items[i]) && item._link.name !== key; ++i);;
                if (item)
                    for (++i; (item = items[i]) && item._link.after === key; ++i);
            }
            else
                i = items.length;
            items.splice(i, 0, target);
            updateIndexes(items, i)
        }
        function unlinkItem(target) {
            var i,
                items = target._link.to._links;
            for (i = 0; items[i] !== target; ++i);;
            items.splice(i, 1);
            updateIndexes(items, i)
        }
        function SvgRenderer(options) {
            var that = this;
            that.root = that._createElement(that._rootTag, that._rootAttr).attr({"class": options.cssClass}).css(that._rootCss);
            that._init();
            that.pathModified = !!options.pathModified;
            that._$container = $(options.container);
            that.root.append({element: options.container});
            that._locker = 0;
            that._backed = false
        }
        rendererNS.SvgRenderer = SvgRenderer;
        SvgRenderer.prototype = {
            constructor: SvgRenderer,
            _rootTag: "svg",
            _rootAttr: {
                xmlns: "http://www.w3.org/2000/svg",
                "xmlns:xlink": "http://www.w3.org/1999/xlink",
                version: "1.1",
                fill: NONE,
                stroke: NONE,
                "stroke-width": 0
            },
            _rootCss: {
                "line-height": "normal",
                "-ms-user-select": NONE,
                "-moz-user-select": NONE,
                "-webkit-user-select": NONE,
                "-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)",
                display: "block",
                overflow: "hidden"
            },
            _init: function() {
                var that = this;
                that._defs = that._createElement("defs").append(that.root);
                that._animationController = new rendererNS.AnimationController(that.root.element);
                that._animation = {
                    enabled: true,
                    duration: 1000,
                    easing: "easeOutCubic"
                }
            },
            setOptions: function(options) {
                var that = this;
                that.rtl = !!options.rtl;
                that.encodeHtml = !!options.encodeHtml,
                that.updateAnimationOptions(options.animation || {});
                that.root.attr({direction: that.rtl ? "rtl" : "ltr"});
                return that
            },
            _createElement: function(tagName, attr, type) {
                var elem = new rendererNS.SvgElement(this, tagName, type);
                attr && elem.attr(attr);
                return elem
            },
            lock: function() {
                var that = this;
                if (that._locker === 0) {
                    that._backed = !that._$container.is(":visible");
                    if (that._backed)
                        backupRoot(that.root)
                }
                ++that._locker;
                return that
            },
            unlock: function() {
                var that = this;
                --that._locker;
                if (that._locker === 0) {
                    if (that._backed)
                        restoreRoot(that.root, that._$container[0]);
                    that._backed = false
                }
                return that
            },
            resize: function(width, height) {
                if (width >= 0 && height >= 0)
                    this.root.attr({
                        width: width,
                        height: height
                    });
                return this
            },
            dispose: function() {
                var that = this,
                    key;
                that.root.dispose();
                that._defs.dispose();
                that._animationController.dispose();
                for (key in that)
                    that[key] = null;
                return that
            },
            animationEnabled: function() {
                return !!this._animation.enabled
            },
            updateAnimationOptions: function(newOptions) {
                extend(this._animation, newOptions);
                return this
            },
            stopAllAnimations: function(lock) {
                this._animationController[lock ? "lock" : "stop"]();
                return this
            },
            animateElement: function(element, params, options) {
                this._animationController.animateElement(element, params, options);
                return this
            },
            svg: function() {
                return this.root.markup()
            },
            getRootOffset: function() {
                return this.root.getOffset()
            },
            onEndAnimation: function(endAnimation) {
                this._animationController.onEndAnimation(endAnimation)
            },
            rect: function(x, y, width, height) {
                var elem = new rendererNS.RectSvgElement(this);
                return elem.attr({
                        x: x || 0,
                        y: y || 0,
                        width: width || 0,
                        height: height || 0
                    })
            },
            circle: function(x, y, r) {
                return this._createElement("circle", {
                        cx: x || 0,
                        cy: y || 0,
                        r: r || 0
                    })
            },
            g: function() {
                return this._createElement("g")
            },
            image: function(x, y, w, h, href, location) {
                var image = this._createElement("image", {
                        x: x || 0,
                        y: y || 0,
                        width: w || 0,
                        height: h || 0,
                        preserveAspectRatio: preserveAspectRatioMap[_normalizeEnum(location)] || NONE
                    });
                image.element.setAttributeNS("http://www.w3.org/1999/xlink", "href", href || "");
                return image
            },
            path: function(points, type) {
                var elem = new rendererNS.PathSvgElement(this, type);
                return elem.attr({points: points || []})
            },
            arc: function(x, y, innerRadius, outerRadius, startAngle, endAngle) {
                var elem = new rendererNS.ArcSvgElement(this);
                return elem.attr({
                        x: x || 0,
                        y: y || 0,
                        innerRadius: innerRadius || 0,
                        outerRadius: outerRadius || 0,
                        startAngle: startAngle || 0,
                        endAngle: endAngle || 0
                    })
            },
            text: function(text, x, y) {
                var elem = new rendererNS.TextSvgElement(this);
                return elem.attr({
                        text: text,
                        x: x || 0,
                        y: y || 0
                    })
            },
            pattern: function(color, hatching) {
                hatching = hatching || {};
                var that = this,
                    id,
                    d,
                    pattern,
                    rect,
                    path,
                    step = hatching.step || 6,
                    stepTo2 = step / 2,
                    stepBy15 = step * 1.5,
                    direction = _normalizeEnum(hatching.direction);
                if (direction !== "right" && direction !== "left")
                    return {
                            id: color,
                            append: function() {
                                return this
                            },
                            clear: function(){},
                            dispose: function(){},
                            remove: function(){}
                        };
                id = getNextDefsSvgId();
                d = direction === "right" ? "M " + stepTo2 + " " + -stepTo2 + " L " + -stepTo2 + " " + stepTo2 + " M 0 " + step + " L " + step + " 0 M " + stepBy15 + " " + stepTo2 + " L " + stepTo2 + " " + stepBy15 : "M 0 0 L " + step + " " + step + " M " + -stepTo2 + " " + stepTo2 + " L " + stepTo2 + " " + stepBy15 + " M " + stepTo2 + " " + -stepTo2 + " L " + stepBy15 + " " + stepTo2;
                pattern = that._createElement("pattern", {
                    id: id,
                    width: step,
                    height: step,
                    patternUnits: "userSpaceOnUse"
                }).append(that._defs);
                pattern.id = getPatternUrl(id, that.pathModified);
                rect = that.rect(0, 0, step, step).attr({
                    fill: color,
                    opacity: hatching.opacity
                }).append(pattern);
                path = new rendererNS.PathSvgElement(this).attr({
                    d: d,
                    "stroke-width": hatching.width || 1,
                    stroke: color
                }).append(pattern);
                pattern.rect = rect;
                pattern.path = path;
                return pattern
            },
            clipRect: function(x, y, width, height) {
                var that = this,
                    id = getNextDefsSvgId(),
                    clipPath = that._createElement("clipPath", {id: id}).append(that._defs),
                    rect = that.rect(x, y, width, height).append(clipPath);
                rect.id = id;
                rect.clipPath = clipPath;
                rect.remove = function() {
                    throw"Not implemented";
                };
                rect.dispose = function() {
                    clipPath.dispose();
                    clipPath = null;
                    return this
                };
                return rect
            },
            shadowFilter: function(x, y, width, height, offsetX, offsetY, blur, color, opacity) {
                var that = this,
                    id = getNextDefsSvgId(),
                    filter = that._createElement("filter", {
                        id: id,
                        x: x || 0,
                        y: y || 0,
                        width: width || 0,
                        height: height || 0
                    }).append(that._defs),
                    gaussianBlur = that._createElement("feGaussianBlur", {
                        "in": "SourceGraphic",
                        result: "gaussianBlurResult",
                        stdDeviation: blur || 0
                    }).append(filter),
                    offset = that._createElement("feOffset", {
                        "in": "gaussianBlurResult",
                        result: "offsetResult",
                        dx: offsetX || 0,
                        dy: offsetY || 0
                    }).append(filter),
                    flood = that._createElement("feFlood", {
                        result: "floodResult",
                        "flood-color": color || "",
                        "flood-opacity": opacity
                    }).append(filter),
                    composite = that._createElement("feComposite", {
                        "in": "floodResult",
                        in2: "offsetResult",
                        operator: "in",
                        result: "compositeResult"
                    }).append(filter),
                    finalComposite = that._createElement("feComposite", {
                        "in": "SourceGraphic",
                        in2: "compositeResult",
                        operator: "over"
                    }).append(filter);
                filter.ref = getPatternUrl(id, that.pathModified);
                filter.gaussianBlur = gaussianBlur;
                filter.offset = offset;
                filter.flood = flood;
                filter.composite = composite;
                filter.finalComposite = finalComposite;
                filter.attr = function(attrs) {
                    var that = this,
                        filterAttrs = {},
                        offsetAttrs = {},
                        floodAttrs = {};
                    "x" in attrs && (filterAttrs.x = attrs.x);
                    "y" in attrs && (filterAttrs.y = attrs.y);
                    "width" in attrs && (filterAttrs.width = attrs.width);
                    "height" in attrs && (filterAttrs.height = attrs.height);
                    baseAttr(that, filterAttrs);
                    "blur" in attrs && that.gaussianBlur.attr({stdDeviation: attrs.blur});
                    "offsetX" in attrs && (offsetAttrs.dx = attrs.offsetX);
                    "offsetY" in attrs && (offsetAttrs.dy = attrs.offsetY);
                    that.offset.attr(offsetAttrs);
                    "color" in attrs && (floodAttrs["flood-color"] = attrs.color);
                    "opacity" in attrs && (floodAttrs["flood-opacity"] = attrs.opacity);
                    that.flood.attr(floodAttrs);
                    return that
                };
                return filter
            }
        };
        rendererNS.rotateBBox = rotateBBox;
        rendererNS._getEllipsis = getEllipsis;
        rendererNS._createArcAttr = createArcAttr;
        rendererNS._createPathAttr = createPathAttr;
        rendererNS._createRectAttr = createRectAttr
    })(jQuery, DevExpress, document);
    /*! Module viz-core, file vmlRenderer.js */
    (function($, DX, doc) {
        DX.viz.renderers = DX.viz.renderers || {};
        var rendererNS = DX.viz.renderers,
            commonUtils = DX.require("/utils/utils.common"),
            math = Math,
            mathMin = math.min,
            mathMax = math.max,
            mathFloor = math.floor,
            mathSin = math.sin,
            mathCos = math.cos,
            isDefined = commonUtils.isDefined,
            _each = $.each,
            _normalizeEnum = DX.viz.utils.normalizeEnum,
            baseElementPrototype = rendererNS.SvgElement.prototype,
            documentFragment = doc.createDocumentFragment(),
            STROKEWIDTH = "stroke-width",
            XMLNS = "urn:schemas-microsoft-com:vml",
            DEFAULT_STYLE = {
                behavior: "url(#default#VML)",
                display: "inline-block",
                position: "absolute"
            },
            DEFAULT_ATTRS = {xmlns: XMLNS},
            INHERITABLE_PROPERTIES = {
                stroke: true,
                fill: true,
                opacity: true,
                "stroke-width": true,
                align: true,
                dashStyle: true,
                "stroke-opacity": true,
                "fill-opacity": true,
                rotate: true,
                rotateX: true,
                rotateY: true
            },
            stub = function(){},
            stubReturnedThis = function() {
                return this
            },
            svgToVmlConv = {
                circle: "oval",
                g: "div",
                path: "shape",
                text: "span"
            },
            FONT_HEIGHT_OFFSET_K = 0.55 + 0.45 / 2,
            DEFAULTS = {
                scaleX: 1,
                scaleY: 1
            },
            pathAttr = rendererNS._createPathAttr(vmlAttr),
            arcAttr = rendererNS._createArcAttr(vmlAttr, buildArcPath),
            rectAttr = rendererNS._createRectAttr(vmlAttr),
            applyEllipsis = rendererNS._getEllipsis(prepareLines, setNewText, removeTextSpan);
        function extend(a, b) {
            for (var key in b)
                a[key] = b[key];
            return a
        }
        function inArray(array, elem) {
            var i = 0;
            for (; i < array.length; i++)
                if (elem === array[i])
                    return i;
            return -1
        }
        function buildArcPath(x, y, innerR, outerR, startAngleCos, startAngleSin, endAngleCos, endAngleSin, isCircle, longFlag, noArc) {
            var xOuterStart = x + outerR * startAngleCos,
                yOuterStart = y - outerR * startAngleSin,
                xOuterEnd = x + outerR * endAngleCos,
                yOuterEnd = y - outerR * endAngleSin,
                xInnerStart = x + innerR * endAngleCos,
                yInnerStart = y - innerR * endAngleSin,
                xInnerEnd = x + innerR * startAngleCos,
                yInnerEnd = y - innerR * startAngleSin;
            return !noArc ? ["wr", mathFloor(x - innerR), mathFloor(y - innerR), mathFloor(x + innerR), mathFloor(y + innerR), mathFloor(xInnerStart), mathFloor(yInnerStart), mathFloor(xInnerEnd), mathFloor(yInnerEnd), isCircle ? "wr " : "at ", mathFloor(x - outerR), mathFloor(y - outerR), mathFloor(x + outerR), mathFloor(y + outerR), mathFloor(xOuterStart), mathFloor(yOuterStart), mathFloor(xOuterEnd), mathFloor(yOuterEnd), "x e"].join(" ") : "m 0 0 x e"
        }
        function getInheritSettings(settings) {
            var result = {},
                prop,
                value;
            for (prop in INHERITABLE_PROPERTIES) {
                value = settings[prop];
                value !== undefined && (result[prop] = value)
            }
            return result
        }
        function correctBoundingRectWithStrokeWidth(rect, strokeWidth) {
            strokeWidth = Math.ceil(parseInt(strokeWidth) / 2);
            if (strokeWidth && strokeWidth > 1) {
                rect.left -= strokeWidth;
                rect.top -= strokeWidth;
                rect.right += strokeWidth;
                rect.bottom += strokeWidth
            }
            return rect
        }
        function shapeBBox() {
            var points = (this._settings.d || "").match(/[-0-9]+/g),
                i,
                value,
                resultRect = {};
            for (i = 0; i < points.length; i++) {
                value = parseInt(points[i]);
                if (i % 2) {
                    resultRect.top = resultRect.top === undefined || value < resultRect.top ? value : resultRect.top;
                    resultRect.bottom = resultRect.bottom === undefined || value > resultRect.bottom ? value : resultRect.bottom
                }
                else {
                    resultRect.left = resultRect.left === undefined || value < resultRect.left ? value : resultRect.left;
                    resultRect.right = resultRect.right === undefined || value > resultRect.right ? value : resultRect.right
                }
            }
            resultRect.left = resultRect.left || 0;
            resultRect.top = resultRect.top || 0;
            resultRect.right = resultRect.right || 0;
            resultRect.bottom = resultRect.bottom || 0;
            return correctBoundingRectWithStrokeWidth(resultRect, this._fullSettings[STROKEWIDTH])
        }
        function baseAttr(that, attrs, inh) {
            var element = that.element,
                settings = that._settings,
                fullSettings = that._fullSettings,
                value,
                key,
                params = {style: {}},
                appliedAttr,
                elem;
            if (typeof attrs === "string") {
                if (attrs in settings)
                    return settings[attrs];
                if (attrs in DEFAULTS)
                    return DEFAULTS[attrs];
                return 0
            }
            if (attrs && attrs.fill === "transparent")
                attrs.fill = "none";
            for (key in attrs) {
                value = attrs[key];
                if (value === undefined)
                    continue;
                appliedAttr = fullSettings[key];
                !inh && (settings[key] = value);
                fullSettings[key] = value;
                if (INHERITABLE_PROPERTIES[key])
                    value = value === null ? that._parent && that._parent._fullSettings[key] || value : value;
                appliedAttr !== value && that.processAttr(element, key, value, params)
            }
            that._applyTransformation(params);
            that.css(params.style);
            for (var i = 0; i < that._children.length; i++) {
                elem = that._children[i];
                elem !== that._clipRect && elem.attr(extend(getInheritSettings(that._fullSettings), elem._settings), true);
                elem._applyStyleSheet()
            }
            !inh && that._applyStyleSheet();
            if (element)
                if (element.strokecolor && element.strokecolor.value !== "none" && element.strokeweight)
                    element.stroked = "t";
                else
                    element.stroked = "f";
            return that
        }
        function vmlAttr(that, attrs, inh) {
            var elem = that.element,
                result = baseAttr(that, attrs, inh);
            for (var i = 0; i < elem.childNodes.length; i++) {
                elem.childNodes[i].xmlns = XMLNS;
                elem.childNodes[i].style.behavior = "url(#default#VML)";
                elem.childNodes[i].style.display = "inline-block"
            }
            return result
        }
        function processVmlAttr(element, attr, value, params) {
            switch (attr) {
                case"stroke":
                    value = value || "none";
                    attr += "color";
                    break;
                case"fill":
                    value = value || "none";
                    element.filled = value === "none" ? "f" : "t";
                    attr += "color";
                    break;
                case STROKEWIDTH:
                    attr = "strokeweight";
                    value = value + "px";
                    break;
                case"stroke-linejoin":
                    element.stroke.joinstyle = value;
                    return;
                case"stroke-linecap":
                    element.stroke.endcap = value === "butt" ? "flat" : value;
                    return;
                case"opacity":
                    value = adjustOpacityValue(value);
                    element.fill.opacity = value;
                    element.stroke.opacity = value;
                    return;
                case"fill-opacity":
                    element.fill.opacity = adjustOpacityValue(value);
                    return;
                case"stroke-opacity":
                    element.stroke.opacity = adjustOpacityValue(value);
                    return;
                case"dashStyle":
                    if (value === null)
                        element.stroke[attr] = "";
                    else {
                        value = _normalizeEnum(value);
                        if (value === "solid" || value === "none")
                            value = "";
                        else
                            value = value.replace(/longdash/g, "8,3,").replace(/dash/g, "4,3,").replace(/dot/g, "1,3,").replace(/,$/, "");
                        element.stroke[attr] = value
                    }
                    return;
                case"d":
                    attr = "path";
                    value = _normalizeEnum(value).replace("z", "x e").replace(/([.]\d+)/g, "");
                    break;
                case"href":
                    attr = "src";
                    break;
                case"width":
                case"height":
                case"visibility":
                    params.style[attr] = value || "";
                    return;
                case"class":
                    attr += "Name";
                    break;
                case"translateX":
                case"translateY":
                case"rotate":
                case"rotateX":
                case"rotateY":
                case"scale":
                case"scaleX":
                case"scaleY":
                case"x":
                case"y":
                    return
            }
            element[attr] = value
        }
        function adjustOpacityValue(value) {
            return value >= 0.002 ? value : value === null ? 1 : 0.002
        }
        function createElement(tagName) {
            var element = document.createElement(tagName);
            return documentFragment.appendChild(element)
        }
        var VmlElement = function() {
                this.ctor.apply(this, arguments)
            };
        function processAttr(element, attr, value, params) {
            if (!INHERITABLE_PROPERTIES[attr])
                if (attr === "visibility")
                    params.style[attr] = value || "";
                else if (attr === "width" || attr === "height")
                    params.style[attr] = value;
                else if (attr === "clipId")
                    this.applyClipID(value);
                else if (attr === "translateX" || attr === "translateY" || attr === "x" || attr === "y")
                    return;
                else if (attr === "class")
                    element.className = value;
                else
                    element[attr] = value
        }
        function prepareLines(element) {
            var lines = [{
                        commonLength: 0,
                        parts: []
                    }],
                lineIndex = 0;
            _each(element.childNodes || [], function(i, text) {
                if (text.nodeName !== "BR") {
                    var length = lines[lineIndex].commonLength,
                        textContent = $(text).text();
                    lines[lineIndex].parts.push({
                        span: text,
                        startIndex: length ? length + 1 : 0,
                        endIndex: length + textContent.length
                    });
                    lines[lineIndex].commonLength += textContent.length
                }
                else {
                    lines.push({
                        commonLength: 0,
                        parts: []
                    });
                    lineIndex++
                }
            });
            return lines
        }
        function setNewText(text, index) {
            var newText = $(text.span).text().substr(0, index) + "...";
            if (text.span.nodeName === "#text")
                text.span.data = newText;
            else
                text.span.innerHTML = newText
        }
        function removeTextSpan(text) {
            text.span.parentNode.removeChild(text.span)
        }
        var elementMixin = {
                div: {
                    processAttr: processAttr,
                    attr: function(attrs, inh) {
                        return baseAttr(this, attrs, inh)
                    },
                    _applyTransformation: function(params) {
                        var style = params.style,
                            settings = this._settings,
                            fullSettings = this._fullSettings;
                        if (fullSettings.rotate) {
                            fullSettings.rotateX = fullSettings.rotateX || 0;
                            fullSettings.rotateY = fullSettings.rotateY || 0
                        }
                        style.left = (settings.x || 0) + (settings.translateX || 0);
                        style.top = (settings.y || 0) + (settings.translateY || 0)
                    },
                    _getBBox: function() {
                        var left = Infinity,
                            top = Infinity,
                            right = -Infinity,
                            bottom = -Infinity,
                            i = 0,
                            child,
                            children = this._children,
                            translateX,
                            translateY,
                            childBBox,
                            childSettings;
                        if (!children.length)
                            left = top = bottom = right = 0;
                        else
                            for (; i < children.length; i++) {
                                child = children[i];
                                if (child === this._clipRect)
                                    continue;
                                translateX = child._fullSettings.translateX || 0;
                                translateY = child._fullSettings.translateY || 0;
                                childSettings = child._fullSettings;
                                childBBox = child._getBBox();
                                left = mathMin(left, childBBox.left + translateX);
                                right = mathMax(right, childBBox.right + translateX);
                                top = mathMin(top, childBBox.top + translateY);
                                bottom = mathMax(bottom, childBBox.bottom + translateY)
                            }
                        return {
                                left: left,
                                right: right,
                                top: top,
                                bottom: bottom
                            }
                    },
                    defaultAttrs: {},
                    defaultStyle: {position: "absolute"}
                },
                shape: {
                    defaultAttrs: extend({
                        coordsize: "1,1",
                        "stroke-linejoin": "miter"
                    }, DEFAULT_ATTRS),
                    defaultStyle: extend({
                        width: 1,
                        height: 1
                    }, DEFAULT_STYLE),
                    _getBBox: shapeBBox
                },
                image: {processAttr: function(element, attr, value, params) {
                        if (attr === "fill" || attr === "stroke")
                            return;
                        processVmlAttr(element, attr, value, params)
                    }},
                oval: {
                    processAttr: function(element, attr, value, params) {
                        if (attr === "cx" || attr === "cy")
                            attr = attr[1];
                        else if (attr === "r") {
                            value *= 2;
                            processVmlAttr(element, "width", value, params);
                            attr = "height"
                        }
                        else if (attr === "x" || attr === "y")
                            return;
                        processVmlAttr(element, attr, value, params)
                    },
                    _getBBox: function() {
                        var settings = this._fullSettings,
                            x = settings.cx || 0,
                            y = settings.cy || 0,
                            r = settings.r || 0;
                        return correctBoundingRectWithStrokeWidth({
                                left: x - r,
                                top: y - r,
                                right: x + r,
                                bottom: y + r
                            }, settings[STROKEWIDTH] || 1)
                    }
                },
                span: {
                    defaultAttrs: {},
                    defaultStyle: {
                        position: "absolute",
                        whiteSpace: "nowrap"
                    },
                    processAttr: function(element, attr, value, params) {
                        if (attr === "text") {
                            value = isDefined(value) ? value.toString().replace(/\r/g, "") : "";
                            if (this.renderer.encodeHtml)
                                value = value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            element.innerHTML = value.replace(/\n/g, "<br/>");
                            this.css({filter: ""});
                            this._bbox = null
                        }
                        else
                            processAttr(element, attr, value, params)
                    },
                    attr: function(attrs, inh) {
                        return baseAttr(this, attrs, inh)
                    },
                    applyEllipsis: applyEllipsis,
                    _applyTransformation: function(params) {
                        this.element.offsetHeight;
                        var that = this,
                            style = params.style,
                            settings = that._fullSettings,
                            x = isDefined(settings.x) ? settings.x : 0,
                            y = isDefined(settings.y) ? settings.y : 0,
                            bbox = that._bbox || that.element.getBoundingClientRect(),
                            textHeight = bbox.bottom - bbox.top,
                            textWidth = bbox.right - bbox.left,
                            rotateAngle = settings.rotate,
                            cos = 1,
                            sin = 0,
                            rotateX = isDefined(settings.rotateX) ? settings.rotateX : x,
                            rotateY = isDefined(settings.rotateY) ? settings.rotateY : y,
                            radianAngle,
                            marginLeft = 0,
                            marginTop = 0,
                            fontHeightOffset = textHeight * FONT_HEIGHT_OFFSET_K,
                            filter = "",
                            alignMultiplier = {
                                center: 0.5,
                                right: 1
                            }[settings.align],
                            opacity = this._styles.opacity || settings.opacity || settings["fill-opacity"];
                        if (textHeight && textWidth) {
                            if (rotateAngle) {
                                radianAngle = rotateAngle * Math.PI / 180.0;
                                cos = mathCos(radianAngle);
                                sin = mathSin(radianAngle);
                                marginLeft = (x - rotateX) * cos - (y - rotateY) * sin + rotateX - x;
                                marginTop = (x - rotateX) * sin + (y - rotateY) * cos + rotateY - y;
                                filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand', M11 = " + cos.toFixed(5) + ", M12 = " + (-sin).toFixed(5) + ", M21 = " + sin.toFixed(5) + ", M22 = " + cos.toFixed(5) + ")"
                            }
                            if (rotateAngle < 90) {
                                marginTop -= fontHeightOffset * cos;
                                marginLeft -= (textHeight - fontHeightOffset) * sin
                            }
                            else if (rotateAngle < 180) {
                                marginTop += (textHeight - fontHeightOffset) * cos;
                                marginLeft += textWidth * cos - (textHeight - fontHeightOffset) * sin
                            }
                            else if (rotateAngle < 270) {
                                marginTop += (textHeight - fontHeightOffset) * cos + textWidth * sin;
                                marginLeft += textWidth * cos + fontHeightOffset * sin
                            }
                            else {
                                marginTop += textWidth * sin - fontHeightOffset * cos;
                                marginLeft += fontHeightOffset * sin
                            }
                            if (rotateAngle && this.renderer.rtl)
                                marginLeft -= textWidth - (textHeight * Math.abs(sin) + textWidth * Math.abs(cos));
                            if (alignMultiplier) {
                                marginLeft -= textWidth * alignMultiplier * cos;
                                marginTop -= textWidth * alignMultiplier * sin
                            }
                            if (isDefined(opacity))
                                filter += " progid:DXImageTransform.Microsoft.Alpha(Opacity=" + opacity * 100 + ")";
                            x += marginLeft;
                            y += marginTop;
                            this._bbox = bbox;
                            style.filter = (style.filter || "") + filter;
                            style.left = x + (settings.translateX || 0);
                            style.top = y + (settings.translateY || 0)
                        }
                    },
                    _getBBox: function textBBox() {
                        var element = this.element,
                            settings = this._fullSettings,
                            parentRect = (element.parentNode && element.parentNode.getBoundingClientRect ? element.parentNode : this.renderer.root.element).getBoundingClientRect(),
                            boundingRect = element.getBoundingClientRect(),
                            left = boundingRect.left - (settings.translateX || 0) - parentRect.left,
                            top = boundingRect.top - (settings.translateY || 0) - parentRect.top;
                        return {
                                left: left,
                                top: top,
                                right: left + element.offsetWidth,
                                bottom: top + element.offsetHeight
                            }
                    }
                }
            };
        extend(VmlElement.prototype, baseElementPrototype);
        extend(VmlElement.prototype, {
            defaultStyle: DEFAULT_STYLE,
            defaultAttrs: DEFAULT_ATTRS,
            ctor: function(renderer, tagName, type) {
                var that = this,
                    tagPrefix = "<";
                that.renderer = renderer;
                that.type = type || "line";
                that._children = [];
                that._settings = {};
                that._fullSettings = {};
                that._styles = {};
                if (tagName !== "div" && tagName !== "span")
                    tagPrefix = "<vml:";
                if (tagName === "shape")
                    if (that.type === "arc")
                        that.attr = arcAttr;
                    else
                        that.attr = pathAttr;
                else if (tagName === "rect")
                    that.attr = rectAttr;
                extend(that, elementMixin[tagName]);
                that.element = createElement(tagPrefix + tagName + "/>");
                that.css(that.defaultStyle).attr(that.defaultAttrs);
                that._$element = $(that.element)
            },
            dispose: function() {
                this.remove();
                this._$element.remove();
                return this
            },
            attr: function(attrs, inh) {
                return vmlAttr(this, attrs, inh)
            },
            processAttr: processVmlAttr,
            css: function(css) {
                var elem = this.element,
                    value,
                    appliedValue,
                    key;
                for (key in css) {
                    appliedValue = this._styles[key];
                    value = css[key];
                    if (!isDefined(value))
                        continue;
                    this._styles[key] = value;
                    if (appliedValue === value)
                        continue;
                    switch (key) {
                        case"fill":
                            key = "color";
                            break;
                        case"font-size":
                            key = "fontSize";
                            if (typeof value === "number")
                                value += "px";
                            break;
                        case"font-weight":
                            key = "fontWeight";
                            break;
                        case"z-index":
                            key = "zIndex";
                            break;
                        case"opacity":
                            continue
                    }
                    try {
                        elem.style[key] = value
                    }
                    catch(_) {
                        continue
                    }
                }
                return this
            },
            applyClipID: function(id) {
                var clipRect,
                    cssValue,
                    renderer = this.renderer;
                clipRect = renderer.getClipRect(id);
                if (clipRect) {
                    cssValue = clipRect.getValue();
                    clipRect.addElement(this)
                }
                else
                    cssValue = "rect(-9999px 9999px 9999px -9999px)";
                this._clipRect = this._clipRect || renderer.rect(0, 0, 0, 0).attr({
                    "class": "dxc-vml-clip",
                    fill: "none",
                    opacity: 0.001
                });
                this._clipRect.attr({
                    width: renderer.root.attr("width"),
                    height: renderer.root.attr("height")
                });
                this.css({
                    clip: cssValue,
                    width: renderer.root.attr("width"),
                    height: renderer.root.attr("height")
                })
            },
            _onAppended: function(parent) {
                var that = this;
                if (parent._children) {
                    that._parent = parent;
                    if (inArray(parent._children, that) === -1)
                        parent._children.push(that);
                    that.attr(extend(getInheritSettings(parent._fullSettings), that._settings), true)
                }
                that._applyStyleSheet();
                if (parent._clipRect && that !== parent._clipRect)
                    parent._clipRect.append(parent)
            },
            append: function(parent) {
                baseElementPrototype.append.apply(this, arguments);
                this._onAppended(parent || this.renderer.root);
                return this
            },
            _insert: function(parent) {
                baseElementPrototype._insert.apply(this, arguments);
                this._onAppended(parent)
            },
            _applyTransformation: function(params) {
                var that = this,
                    style = params.style,
                    element = that.element,
                    settings = that._fullSettings,
                    x = that.type !== "arc" ? settings.x || settings.cx - settings.r || 0 : 0,
                    y = that.type !== "arc" ? settings.y || settings.cy - settings.r || 0 : 0;
                if (settings.rotate) {
                    var radianAngle = settings.rotate * Math.PI / 180.0,
                        rotateX = isDefined(settings.rotateX) ? settings.rotateX : x,
                        rotateY = isDefined(settings.rotateY) ? settings.rotateY : y,
                        rx = x + (settings.width || 0 || parseInt(element.style.width || 0)) / 2,
                        ry = y + (settings.height || 0 || parseInt(element.style.height || 0)) / 2,
                        cos = mathCos(radianAngle),
                        sin = mathSin(radianAngle),
                        marginLeft = (rx - rotateX) * cos - (ry - rotateY) * sin + rotateX - rx,
                        marginTop = (rx - rotateX) * sin + (ry - rotateY) * cos + rotateY - ry;
                    x += marginLeft;
                    y += marginTop;
                    style.rotation = settings.rotate
                }
                style.left = x + (settings.translateX || 0);
                style.top = y + (settings.translateY || 0)
            },
            remove: function() {
                var parent = this._parent;
                parent && parent._children.splice(inArray(parent._children, this), 1);
                this._parent = null;
                return baseElementPrototype.remove.apply(this, arguments)
            },
            clear: function() {
                this._children = [];
                return baseElementPrototype.clear.apply(this, arguments)
            },
            getBBox: function() {
                var clientRect = this._getBBox(),
                    x = clientRect.left,
                    y = clientRect.top,
                    width = clientRect.right - x,
                    height = clientRect.bottom - y;
                return {
                        x: x,
                        y: y,
                        width: width,
                        height: height,
                        isEmpty: !x && !y && !width && !height
                    }
            },
            _getBBox: function() {
                var element = this.element,
                    settings = this._fullSettings,
                    x = settings.x || 0,
                    y = settings.y || 0,
                    width = parseInt(element.style.width || 0),
                    height = parseInt(element.style.height || 0);
                return correctBoundingRectWithStrokeWidth({
                        left: x,
                        top: y,
                        right: x + width,
                        bottom: y + height
                    }, settings[STROKEWIDTH] || 1)
            },
            _applyStyleSheet: function() {
                if (this._useCSSTheme)
                    this.attr(getInheritSettings(this.element.currentStyle), true)
            },
            setTitle: function(text) {
                this.element.setAttribute("title", text)
            }
        });
        var ClipRect = function() {
                this.ctor.apply(this, arguments)
            };
        extend(ClipRect.prototype, VmlElement.prototype);
        extend(ClipRect.prototype, {
            ctor: function(renderer, id) {
                this._settings = this._fullSettings = {};
                this.renderer = renderer;
                this._children = [];
                this._elements = [];
                this.id = id
            },
            attr: function(attrs, inh) {
                var result = baseAttr(this, attrs, inh),
                    elements = this._elements.slice(),
                    element,
                    i;
                if (result === this)
                    for (i = 0; i < elements.length; i++) {
                        element = elements[i];
                        if (element._fullSettings.clipId === this.id)
                            elements[i].applyClipID(this.id);
                        else
                            this.removeElement(element)
                    }
                return result
            },
            processAttr: stub,
            _applyTransformation: stub,
            append: stubReturnedThis,
            dispose: function() {
                this._elements = null;
                this.renderer.removeClipRect(this.id);
                return this
            },
            addElement: function(element) {
                var elements = this._elements;
                if (inArray(elements, element) === -1)
                    elements.push(element)
            },
            removeElement: function(element) {
                var index = inArray(this._elements, element);
                index > -1 && this._elements.splice(index, 1)
            },
            getValue: function() {
                var settings = this._settings,
                    left = (settings.x || 0) + (settings.translateX || 0),
                    top = (settings.y || 0) + (settings.translateY || 0);
                return "rect(" + top + "px, " + (left + (settings.width || 0)) + "px, " + (top + (settings.height || 0)) + "px, " + left + "px)"
            },
            css: stubReturnedThis,
            remove: stubReturnedThis
        });
        function VmlRenderer() {
            rendererNS.SvgRenderer.apply(this, arguments)
        }
        extend(VmlRenderer.prototype, rendererNS.SvgRenderer.prototype);
        extend(VmlRenderer.prototype, {
            constructor: VmlRenderer,
            _rootTag: "div",
            _rootAttr: {
                fill: "none",
                stroke: "none",
                "stroke-width": 0
            },
            _rootCss: {
                position: "relative",
                display: "inline-block",
                overflow: "hidden"
            },
            _init: function() {
                this._clipRects = [];
                this._animationController = {dispose: stubReturnedThis};
                this._animation = {enabled: false};
                this._defs = {
                    clear: stubReturnedThis,
                    remove: stubReturnedThis,
                    append: stubReturnedThis,
                    dispose: stubReturnedThis
                }
            },
            setOptions: function() {
                rendererNS.SvgRenderer.prototype.setOptions.apply(this, arguments);
                this.root.css({direction: this.rtl ? "rtl" : "ltr"});
                return this
            },
            _createElement: function(tagName, attr, type) {
                tagName = svgToVmlConv[tagName] || tagName;
                var elem = new rendererNS.VmlElement(this, tagName, type);
                attr && elem.attr(attr);
                return elem
            },
            shadowFilter: function() {
                return {
                        ref: null,
                        append: stubReturnedThis,
                        dispose: stubReturnedThis,
                        attr: stubReturnedThis,
                        css: stubReturnedThis
                    }
            },
            clipRect: function(x, y, width, height) {
                var clipRects = this._clipRects,
                    id = clipRects.length,
                    clipRect = new ClipRect(this, id).attr({
                        x: x || 0,
                        y: y || 0,
                        width: width || 0,
                        height: height || 0
                    });
                clipRects.push(clipRect);
                return clipRect
            },
            getClipRect: function(id) {
                return this._clipRects[id]
            },
            removeClipRect: function(id) {
                delete this._clipRects[id]
            },
            pattern: function(color) {
                return {
                        id: color,
                        append: stubReturnedThis,
                        remove: stubReturnedThis,
                        dispose: stubReturnedThis
                    }
            },
            image: function(x, y, w, h, href, location) {
                var image = this._createElement("image", {
                        x: x || 0,
                        y: y || 0,
                        width: w || 0,
                        height: h || 0,
                        location: location,
                        href: href
                    });
                return image
            },
            rect: function(x, y, width, height) {
                return this._createElement("rect", {
                        x: x || 0,
                        y: y || 0,
                        width: width || 0,
                        height: height || 0
                    })
            },
            path: function(points, type) {
                return this._createElement("path", {points: points || []}, type)
            },
            arc: function(x, y, innerRadius, outerRadius, startAngle, endAngle) {
                return this._createElement("path", {
                        x: x || 0,
                        y: y || 0,
                        innerRadius: innerRadius || 0,
                        outerRadius: outerRadius || 0,
                        startAngle: startAngle || 0,
                        endAngle: endAngle || 0
                    }, "arc")
            },
            text: function(text, x, y) {
                return this._createElement("text", {
                        text: text,
                        x: x || 0,
                        y: y || 0
                    })
            },
            updateAnimationOptions: stubReturnedThis,
            stopAllAnimations: stubReturnedThis,
            svg: function() {
                return ""
            },
            onEndAnimation: function(callback) {
                callback()
            }
        });
        rendererNS.VmlRenderer = VmlRenderer;
        rendererNS.VmlElement = VmlElement;
        rendererNS._VmlClipRect = ClipRect
    })(jQuery, DevExpress, document);
    /*! Module viz-core, file animation.js */
    (function(DX) {
        var animationFrame = DX.require("/utils/utils.animationFrame"),
            rendererNS = DX.viz.renderers,
            noop = function(){},
            easingFunctions = {
                easeOutCubic: function(pos, start, end) {
                    return pos === 1 ? end : (1 - Math.pow(1 - pos, 3)) * (end - start) + +start
                },
                linear: function(pos, start, end) {
                    return pos === 1 ? end : pos * (end - start) + +start
                }
            };
        rendererNS.easingFunctions = easingFunctions;
        rendererNS.animationSvgStep = {
            segments: function(elem, params, progress, easing, currentParams) {
                var from = params.from,
                    to = params.to,
                    curSeg,
                    seg,
                    i,
                    j,
                    segments = [];
                for (i = 0; i < from.length; i++) {
                    curSeg = from[i];
                    seg = [curSeg[0]];
                    if (curSeg.length > 1)
                        for (j = 1; j < curSeg.length; j++)
                            seg.push(easing(progress, curSeg[j], to[i][j]));
                    segments.push(seg)
                }
                currentParams.segments = params.end && progress === 1 ? params.end : segments;
                elem.attr({segments: segments})
            },
            arc: function(elem, params, progress, easing) {
                var from = params.from,
                    to = params.to,
                    current = {};
                for (var i in from)
                    current[i] = easing(progress, from[i], to[i]);
                elem.attr(current)
            },
            transform: function(elem, params, progress, easing, currentParams) {
                var from = params.from,
                    to = params.to,
                    current = {};
                for (var i in from)
                    current[i] = currentParams[i] = easing(progress, from[i], to[i]);
                elem.attr(current)
            },
            base: function(elem, params, progress, easing, currentParams, attributeName) {
                var obj = {};
                obj[attributeName] = currentParams[attributeName] = easing(progress, params.from, params.to);
                elem.attr(obj)
            },
            _: noop,
            complete: function(element, currentSettings) {
                element.attr(currentSettings)
            }
        };
        function step(now) {
            var that = this,
                animateStep = that._animateStep,
                attrName;
            that._progress = that._calcProgress(now);
            for (attrName in that.params) {
                var anim = animateStep[attrName] || animateStep.base;
                anim(that.element, that.params[attrName], that._progress, that._easing, that._currentParams, attrName)
            }
            that.options.step && that.options.step(that._easing(that._progress, 0, 1), that._progress);
            if (that._progress === 1)
                return that.stop();
            return true
        }
        function start(now) {
            this._startTime = now;
            this.tick = step;
            return true
        }
        function Animation(element, params, options) {
            var that = this;
            that._progress = 0;
            that.element = element;
            that.params = params;
            that.options = options;
            that.duration = options.partitionDuration ? options.duration * options.partitionDuration : options.duration;
            that._animateStep = options.animateStep || rendererNS.animationSvgStep;
            that._easing = easingFunctions[options.easing] || easingFunctions["easeOutCubic"];
            that._currentParams = {};
            that.tick = start
        }
        Animation.prototype = {
            _calcProgress: function(now) {
                return Math.min(1, (now - this._startTime) / this.duration)
            },
            stop: function(disableComplete) {
                var that = this,
                    options = that.options,
                    animateStep = that._animateStep;
                that.stop = that.tick = noop;
                animateStep.complete && animateStep.complete(that.element, that._currentParams);
                options.complete && !disableComplete && options.complete()
            }
        };
        function AnimationController(element) {
            var that = this;
            that._animationCount = 0;
            that._timerId = null;
            that._animations = {};
            that.element = element
        }
        rendererNS.AnimationController = AnimationController;
        AnimationController.prototype = {
            _loop: function() {
                var that = this,
                    animations = that._animations,
                    activeAnimation = 0,
                    now = (new Date).getTime(),
                    an,
                    endAnimation = that._endAnimation;
                for (an in animations) {
                    if (!animations[an].tick(now))
                        delete animations[an];
                    activeAnimation++
                }
                if (activeAnimation === 0) {
                    that.stop();
                    that._endAnimationTimer = endAnimation && setTimeout(function() {
                        if (that._animationCount === 0) {
                            endAnimation();
                            that._endAnimation = null
                        }
                    });
                    return
                }
                that._timerId = animationFrame.request.call(null, function() {
                    that._loop()
                }, that.element)
            },
            addAnimation: function(animation) {
                var that = this;
                that._animations[that._animationCount++] = animation;
                clearTimeout(that._endAnimationTimer);
                if (!that._timerId) {
                    clearTimeout(that._startDelay);
                    that._startDelay = setTimeout(function() {
                        that._timerId = 1;
                        that._loop()
                    }, 0)
                }
            },
            animateElement: function(elem, params, options) {
                if (elem && params && options) {
                    elem.animation && elem.animation.stop();
                    this.addAnimation(elem.animation = new Animation(elem, params, options))
                }
            },
            onEndAnimation: function(endAnimation) {
                this._animationCount ? this._endAnimation = endAnimation : endAnimation()
            },
            dispose: function() {
                this.stop();
                this.element = null
            },
            stop: function() {
                var that = this;
                that._animations = {};
                that._animationCount = 0;
                animationFrame.cancel(that._timerId);
                clearTimeout(that._startDelay);
                clearTimeout(that._endAnimationTimer);
                that._timerId = null
            },
            lock: function() {
                var an,
                    animations = this._animations,
                    unstoppable,
                    hasUnstoppableInAnimations;
                for (an in animations) {
                    unstoppable = animations[an].options.unstoppable;
                    hasUnstoppableInAnimations = hasUnstoppableInAnimations || unstoppable;
                    if (!unstoppable) {
                        animations[an].stop(true);
                        delete animations[an]
                    }
                }
                !hasUnstoppableInAnimations && this.stop()
            }
        };
        rendererNS.Animation = Animation;
        rendererNS.noop = noop
    })(DevExpress);
    /*! Module viz-core, file renderer.js */
    (function($, DX, document) {
        var renderers = DX.viz.renderers,
            browser = DX.require("/utils/utils.browser");
        function isSvg() {
            return !(browser.msie && browser.version < 9) || !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect
        }
        if (!isSvg()) {
            if (document.namespaces && !document.namespaces.vml) {
                document.namespaces.add('vml', 'urn:schemas-microsoft-com:vml');
                document.createStyleSheet().cssText = 'vml\\:* { behavior:url(#default#VML); display: inline-block; } '
            }
            renderers.Renderer = renderers.VmlRenderer
        }
        else
            renderers.Renderer = renderers.SvgRenderer;
        renderers.isSvg = isSvg
    })(jQuery, DevExpress, document);
    /*! Module viz-core, file seriesConsts.js */
    (function(DX) {
        DX.viz.series = {helpers: {consts: {
                    events: {
                        mouseover: "mouseover",
                        mouseout: "mouseout",
                        mousemove: "mousemove",
                        touchstart: "touchstart",
                        touchmove: "touchmove",
                        touchend: "touchend",
                        mousedown: "mousedown",
                        mouseup: "mouseup",
                        click: "click",
                        selectSeries: "selectseries",
                        deselectSeries: "deselectseries",
                        selectPoint: "selectpoint",
                        deselectPoint: "deselectpoint",
                        showPointTooltip: "showpointtooltip",
                        hidePointTooltip: "hidepointtooltip"
                    },
                    states: {
                        hover: "hover",
                        normal: "normal",
                        selected: "selected",
                        normalMark: 0,
                        hoverMark: 1,
                        selectedMark: 2
                    },
                    animations: {
                        showDuration: {duration: 400},
                        hideGroup: {opacity: 0.0001},
                        showGroup: {opacity: 1}
                    },
                    pieLabelIndent: 30,
                    pieLabelSpacing: 10,
                    pieSeriesSpacing: 4
                }}}
    })(DevExpress);
    /*! Module viz-core, file seriesFamily.js */
    (function($, DX) {
        var viz = DX.viz,
            commonUtils = DX.require("/utils/utils.common"),
            _math = Math,
            _round = _math.round,
            _abs = _math.abs,
            _pow = _math.pow,
            _each = $.each,
            _noop = $.noop,
            _normalizeEnum = viz.utils.normalizeEnum;
        function getStacksWithArgument(stackKeepers, argument) {
            var stacksWithArgument = [];
            _each(stackKeepers, function(stackName, seriesInStack) {
                _each(seriesInStack, function(_, singleSeries) {
                    var points = singleSeries.getPointsByArg(argument),
                        pointsLength = points.length,
                        i;
                    for (i = 0; i < pointsLength; ++i)
                        if (points[i].value) {
                            stacksWithArgument.push(stackName);
                            return false
                        }
                })
            });
            return stacksWithArgument
        }
        function correctPointCoordinatesForStacks(stackKeepers, stacksWithArgument, argument, parameters) {
            _each(stackKeepers, function(stackName, seriesInStack) {
                var stackIndex = $.inArray(stackName, stacksWithArgument),
                    offset;
                if (stackIndex === -1)
                    return;
                offset = getOffset(stackIndex, parameters);
                _each(seriesInStack, function(_, singleSeries) {
                    correctPointCoordinates(singleSeries.getPointsByArg(argument) || [], parameters.width, offset)
                })
            })
        }
        function adjustBarSeriesDimensionsCore(series, interval, stackCount, options, seriesStackIndexCallback) {
            var percentWidth,
                stackIndex,
                i,
                points,
                stackName,
                argumentsKeeper = {},
                stackKeepers = {},
                stacksWithArgument,
                barsArea = interval * 0.7,
                barWidth = options.barWidth,
                parameters;
            if (options.equalBarWidth) {
                percentWidth = barWidth && (barWidth < 0 || barWidth > 1) ? 0 : barWidth;
                parameters = calculateParams(barsArea, stackCount, percentWidth);
                for (i = 0; i < series.length; i++) {
                    stackIndex = seriesStackIndexCallback(i, stackCount);
                    points = series[i].getPoints();
                    correctPointCoordinates(points, parameters.width, getOffset(stackIndex, parameters))
                }
            }
            else {
                _each(series, function(i, singleSeries) {
                    stackName = singleSeries.getStackName && singleSeries.getStackName();
                    stackName = stackName || i.toString();
                    if (!stackKeepers[stackName])
                        stackKeepers[stackName] = [];
                    stackKeepers[stackName].push(singleSeries);
                    _each(singleSeries.getPoints(), function(_, point) {
                        var argument = point.argument;
                        if (!argumentsKeeper.hasOwnProperty(argument))
                            argumentsKeeper[argument.valueOf()] = 1
                    })
                });
                for (var argument in argumentsKeeper) {
                    stacksWithArgument = getStacksWithArgument(stackKeepers, argument);
                    parameters = calculateParams(barsArea, stacksWithArgument.length);
                    correctPointCoordinatesForStacks(stackKeepers, stacksWithArgument, argument, parameters)
                }
            }
        }
        function calculateParams(barsArea, count, percentWidth) {
            var spacing,
                width,
                middleIndex = count / 2;
            if (!percentWidth) {
                spacing = _round(barsArea / count * 0.2);
                width = _round((barsArea - spacing * (count - 1)) / count);
                width < 2 && (width = 2)
            }
            else {
                width = _round(barsArea * percentWidth / count);
                spacing = _round(count > 1 ? (barsArea - barsArea * percentWidth) / (count - 1) : 0)
            }
            return {
                    width: width,
                    spacing: spacing,
                    middleIndex: middleIndex
                }
        }
        function getOffset(stackIndex, parameters) {
            return (stackIndex - parameters.middleIndex + 0.5) * parameters.width - (parameters.middleIndex - stackIndex - 0.5) * parameters.spacing
        }
        function correctPointCoordinates(points, width, offset) {
            _each(points, function(_, point) {
                point.correctCoordinates({
                    width: width,
                    offset: offset
                })
            })
        }
        function checkMinBarSize(value, minShownValue) {
            return _abs(value) < minShownValue ? value >= 0 ? minShownValue : -minShownValue : value
        }
        function getValueType(value) {
            return value >= 0 ? "positive" : "negative"
        }
        function getVisibleSeries(that) {
            return viz.utils.map(that.series, function(s) {
                    return s.isVisible() ? s : null
                })
        }
        function getAbsStackSumByArg(stackKeepers, stackName, argument) {
            var positiveStackValue = (stackKeepers.positive[stackName] || {})[argument] || 0,
                negativeStackValue = -(stackKeepers.negative[stackName] || {})[argument] || 0;
            return positiveStackValue + negativeStackValue
        }
        function getSeriesStackIndexCallback(rotated, series, stackIndexes) {
            if (!rotated)
                return function(seriesIndex, stackCount) {
                        return stackIndexes ? stackIndexes[series[seriesIndex].getStackName()] : seriesIndex
                    };
            else
                return function(seriesIndex, stackCount) {
                        return stackCount - (stackIndexes ? stackIndexes[series[seriesIndex].getStackName()] : seriesIndex) - 1
                    }
        }
        function adjustBarSeriesDimensions(translators) {
            var debug = DX.require("/utils/utils.console").debug;
            debug.assert(translators, "translator was not passed or empty");
            var that = this,
                series = getVisibleSeries(that);
            adjustBarSeriesDimensionsCore(series, translators.arg.getInterval(), series.length, that._options, getSeriesStackIndexCallback(that.rotated, series))
        }
        function adjustStackedBarSeriesDimensions(translators) {
            var debug = DX.require("/utils/utils.console").debug;
            debug.assert(translators, "translators was not passed or empty");
            var that = this,
                series = getVisibleSeries(that),
                stackIndexes = {},
                stackCount = 0;
            _each(series, function() {
                var stackName = this.getStackName();
                if (!stackIndexes.hasOwnProperty(stackName))
                    stackIndexes[stackName] = stackCount++
            });
            adjustBarSeriesDimensionsCore(series, translators.arg.getInterval(), stackCount, that._options, getSeriesStackIndexCallback(that.rotated, series, stackIndexes))
        }
        function adjustStackedSeriesValues() {
            var that = this,
                series = getVisibleSeries(that),
                stackKeepers = {
                    positive: {},
                    negative: {}
                },
                holesStack = {
                    left: {},
                    right: {}
                };
            _each(series, function(seriesIndex, singleSeries) {
                var points = singleSeries.getPoints(),
                    hole = false;
                singleSeries._prevSeries = series[seriesIndex - 1];
                singleSeries.holes = $.extend(true, {}, holesStack);
                _each(points, function(index, point) {
                    var value = point.initialValue,
                        argument = point.argument.valueOf(),
                        stackName = singleSeries.getStackName(),
                        stacks = value >= 0 ? stackKeepers.positive : stackKeepers.negative,
                        currentStack;
                    stacks[stackName] = stacks[stackName] || {};
                    currentStack = stacks[stackName];
                    if (currentStack[argument]) {
                        point.correctValue(currentStack[argument]);
                        currentStack[argument] += value
                    }
                    else {
                        currentStack[argument] = value;
                        point.resetCorrection()
                    }
                    if (!point.hasValue()) {
                        var prevPoint = points[index - 1];
                        if (!hole && prevPoint && prevPoint.hasValue()) {
                            argument = prevPoint.argument.valueOf();
                            prevPoint._skipSetRightHole = true;
                            holesStack.right[argument] = (holesStack.right[argument] || 0) + (prevPoint.value - (isFinite(prevPoint.minValue) ? prevPoint.minValue : 0))
                        }
                        hole = true
                    }
                    else if (hole) {
                        hole = false;
                        holesStack.left[argument] = (holesStack.left[argument] || 0) + (point.value - (isFinite(point.minValue) ? point.minValue : 0));
                        point._skipSetLeftHole = true
                    }
                })
            });
            _each(series, function(seriesIndex, singleSeries) {
                var points = singleSeries.getPoints(),
                    holes = singleSeries.holes;
                _each(points, function(index, point) {
                    var argument = point.argument.valueOf();
                    point.resetHoles();
                    !point._skipSetLeftHole && point.setHole(holes.left[argument] || holesStack.left[argument] && 0, "left");
                    !point._skipSetRightHole && point.setHole(holes.right[argument] || holesStack.right[argument] && 0, "right");
                    point._skipSetLeftHole = null;
                    point._skipSetRightHole = null
                })
            });
            that._stackKeepers = stackKeepers;
            _each(series, function(_, singleSeries) {
                _each(singleSeries.getPoints(), function(_, point) {
                    var argument = point.argument.valueOf();
                    point.setPercentValue(getAbsStackSumByArg(stackKeepers, singleSeries.getStackName(), argument), that.fullStacked, holesStack.left[argument], holesStack.right[argument])
                })
            })
        }
        function updateStackedSeriesValues(translators) {
            var that = this,
                series = getVisibleSeries(that),
                stack = that._stackKeepers,
                stackKeepers = {
                    positive: {},
                    negative: {}
                };
            _each(series, function(_, singleSeries) {
                var minBarSize = singleSeries.getOptions().minBarSize,
                    minShownBusinessValue = minBarSize && translators.val.getMinBarSize(minBarSize),
                    stackName = singleSeries.getStackName();
                _each(singleSeries.getPoints(), function(index, point) {
                    if (!point.hasValue())
                        return;
                    var value = point.initialValue,
                        argument = point.argument.valueOf(),
                        updateValue,
                        valueType,
                        currentStack;
                    if (that.fullStacked)
                        value = value / getAbsStackSumByArg(stack, stackName, argument) || 0;
                    updateValue = checkMinBarSize(value, minShownBusinessValue);
                    valueType = getValueType(updateValue);
                    currentStack = stackKeepers[valueType][stackName] = stackKeepers[valueType][stackName] || {};
                    if (currentStack[argument]) {
                        point.minValue = currentStack[argument];
                        currentStack[argument] += updateValue
                    }
                    else
                        currentStack[argument] = updateValue;
                    point.value = currentStack[argument]
                })
            });
            if (that.fullStacked)
                updateFullStackedSeriesValues(series, stackKeepers)
        }
        function updateFullStackedSeriesValues(series, stackKeepers) {
            _each(series, function(_, singleSeries) {
                var stackName = singleSeries.getStackName ? singleSeries.getStackName() : "default";
                _each(singleSeries.getPoints(), function(index, point) {
                    var stackSum = getAbsStackSumByArg(stackKeepers, stackName, point.argument.valueOf());
                    point.value = point.value / stackSum;
                    if (commonUtils.isNumber(point.minValue))
                        point.minValue = point.minValue / stackSum
                })
            })
        }
        function updateBarSeriesValues(translators) {
            _each(this.series, function(_, singleSeries) {
                var minBarSize = singleSeries.getOptions().minBarSize,
                    minShownBusinessValue = minBarSize && translators.val.getMinBarSize(minBarSize);
                if (minShownBusinessValue)
                    _each(singleSeries.getPoints(), function(index, point) {
                        if (point.hasValue())
                            point.value = checkMinBarSize(point.initialValue, minShownBusinessValue)
                    })
            })
        }
        function adjustCandlestickSeriesDimensions(translators) {
            var debug = DX.require("/utils/utils.console").debug;
            debug.assert(translators, "translator was not passed or empty");
            var series = getVisibleSeries(this);
            adjustBarSeriesDimensionsCore(series, translators.arg.getInterval(), series.length, {
                barWidth: null,
                equalBarWidth: true
            }, getSeriesStackIndexCallback(this.rotated, series))
        }
        function adjustBubbleSeriesDimensions(translators) {
            var debug = DX.require("/utils/utils.console").debug;
            debug.assert(translators, "translator was not passed or empty");
            var that = this,
                series = getVisibleSeries(that),
                options = that._options,
                visibleAreaX = translators.arg.getCanvasVisibleArea(),
                visibleAreaY = translators.val.getCanvasVisibleArea(),
                min = _math.min(visibleAreaX.max - visibleAreaX.min, visibleAreaY.max - visibleAreaY.min),
                minBubbleArea = _pow(options.minBubbleSize, 2),
                maxBubbleArea = _pow(min * options.maxBubbleSize, 2),
                equalBubbleSize = (min * options.maxBubbleSize + options.minBubbleSize) / 2,
                minPointSize = Infinity,
                maxPointSize = 0,
                pointSize,
                bubbleArea,
                sizeProportion,
                sizeDispersion,
                areaDispersion;
            _each(series, function(_, seriesItem) {
                _each(seriesItem.getPoints(), function(_, point) {
                    maxPointSize = maxPointSize > point.size ? maxPointSize : point.size;
                    minPointSize = minPointSize < point.size ? minPointSize : point.size
                })
            });
            sizeDispersion = maxPointSize - minPointSize;
            areaDispersion = _abs(maxBubbleArea - minBubbleArea);
            minPointSize = minPointSize < 0 ? 0 : minPointSize;
            _each(series, function(_, seriesItem) {
                _each(seriesItem.getPoints(), function(_, point) {
                    if (maxPointSize === minPointSize)
                        pointSize = _round(equalBubbleSize);
                    else {
                        sizeProportion = _abs(point.size - minPointSize) / sizeDispersion;
                        bubbleArea = areaDispersion * sizeProportion + minBubbleArea;
                        pointSize = _round(_math.sqrt(bubbleArea))
                    }
                    point.correctCoordinates(pointSize)
                })
            })
        }
        function SeriesFamily(options) {
            var debug = DX.require("/utils/utils.console").debug;
            debug.assert(options.type, "type was not passed or empty");
            var that = this;
            that.type = _normalizeEnum(options.type);
            that.pane = options.pane;
            that.rotated = !!(options.rotated && options.sortSeriesPointsByAxis);
            that.series = [];
            that.updateOptions(options);
            switch (that.type) {
                case"bar":
                    that.adjustSeriesDimensions = adjustBarSeriesDimensions;
                    that.updateSeriesValues = updateBarSeriesValues;
                    break;
                case"rangebar":
                    that.adjustSeriesDimensions = adjustBarSeriesDimensions;
                    break;
                case"fullstackedbar":
                    that.fullStacked = true;
                    that.adjustSeriesDimensions = adjustStackedBarSeriesDimensions;
                    that.adjustSeriesValues = adjustStackedSeriesValues;
                    that.updateSeriesValues = updateStackedSeriesValues;
                    break;
                case"stackedbar":
                    that.adjustSeriesDimensions = adjustStackedBarSeriesDimensions;
                    that.adjustSeriesValues = adjustStackedSeriesValues;
                    that.updateSeriesValues = updateStackedSeriesValues;
                    break;
                case"fullstackedarea":
                case"fullstackedline":
                case"fullstackedspline":
                case"fullstackedsplinearea":
                    that.fullStacked = true;
                    that.adjustSeriesValues = adjustStackedSeriesValues;
                    break;
                case"stackedarea":
                case"stackedsplinearea":
                case"stackedline":
                case"stackedspline":
                    that.adjustSeriesValues = adjustStackedSeriesValues;
                    break;
                case"candlestick":
                case"stock":
                    that.adjustSeriesDimensions = adjustCandlestickSeriesDimensions;
                    break;
                case"bubble":
                    that.adjustSeriesDimensions = adjustBubbleSeriesDimensions;
                    break
            }
        }
        viz.series.helpers.SeriesFamily = SeriesFamily;
        SeriesFamily.prototype = {
            constructor: SeriesFamily,
            adjustSeriesDimensions: _noop,
            adjustSeriesValues: _noop,
            updateSeriesValues: _noop,
            updateOptions: function(options) {
                this._options = options
            },
            dispose: function() {
                this.series = this.translators = null
            },
            add: function(series) {
                var type = this.type;
                this.series = viz.utils.map(series, function(singleSeries) {
                    return singleSeries.type === type ? singleSeries : null
                })
            },
            getStackPoints: function() {
                var stackPoints = {};
                $.each(this.series, function(_, singleSeries) {
                    var points = singleSeries.getPoints(),
                        stackName = singleSeries.getStackName() || null;
                    if (!singleSeries.isVisible())
                        return;
                    _each(points, function(_, point) {
                        var argument = point.argument;
                        if (!stackPoints[argument])
                            stackPoints[argument] = {};
                        if (!stackPoints[argument][stackName])
                            stackPoints[argument][stackName] = [];
                        stackPoints[argument][stackName].push(point)
                    })
                });
                return stackPoints
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseSeries.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            seriesNS = viz.series,
            dateUtils = DevExpress.require("/utils/utils.date"),
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _map = viz.utils.map,
            _each = $.each,
            _extend = $.extend,
            _isEmptyObject = $.isEmptyObject,
            _normalizeEnum = viz.utils.normalizeEnum,
            _Event = $.Event,
            _noop = $.noop,
            SELECTED_STATE = 2,
            HOVER_STATE = 1,
            NONE_MODE = "none",
            INCLUDE_POINTS = "includepoints",
            EXLUDE_POINTS = "excludepoints",
            NEAREST_POINT = "nearestpoint",
            APPLY_SELECTED = "applySelected",
            APPLY_HOVER = "applyHover",
            SYMBOL_POINT = "symbolPoint",
            POLAR_SYMBOL_POINT = "polarSymbolPoint",
            BAR_POINT = "barPoint",
            POLAR_BAR_POINT = "polarBarPoint",
            PIE_POINT = "piePoint",
            HOVER = "hover",
            NORMAL = "normal",
            SELECTION = "selection",
            RESET_ITEM = "resetItem",
            getEmptyBusinessRange = function() {
                return {
                        arg: {},
                        val: {}
                    }
            };
        function triggerEvent(element, event, point) {
            element && element.trigger(event, point)
        }
        seriesNS.mixins = {
            chart: {pointTypes: {
                    scatter: SYMBOL_POINT,
                    line: SYMBOL_POINT,
                    spline: SYMBOL_POINT,
                    stepline: SYMBOL_POINT,
                    stackedline: SYMBOL_POINT,
                    fullstackedline: SYMBOL_POINT,
                    stackedspline: SYMBOL_POINT,
                    fullstackedspline: SYMBOL_POINT,
                    stackedsplinearea: SYMBOL_POINT,
                    fullstackedsplinearea: SYMBOL_POINT,
                    area: SYMBOL_POINT,
                    splinearea: SYMBOL_POINT,
                    steparea: SYMBOL_POINT,
                    stackedarea: SYMBOL_POINT,
                    fullstackedarea: SYMBOL_POINT,
                    rangearea: "rangeSymbolPoint",
                    bar: BAR_POINT,
                    stackedbar: BAR_POINT,
                    fullstackedbar: BAR_POINT,
                    rangebar: "rangeBarPoint",
                    bubble: "bubblePoint",
                    stock: "stockPoint",
                    candlestick: "candlestickPoint"
                }},
            pie: {pointTypes: {
                    pie: PIE_POINT,
                    doughnut: PIE_POINT,
                    donut: PIE_POINT
                }},
            polar: {pointTypes: {
                    scatter: POLAR_SYMBOL_POINT,
                    line: POLAR_SYMBOL_POINT,
                    area: POLAR_SYMBOL_POINT,
                    bar: POLAR_BAR_POINT,
                    stackedbar: POLAR_BAR_POINT
                }}
        };
        function includePointsMode(mode) {
            return mode === INCLUDE_POINTS || mode === "allseriespoints"
        }
        function getLabelOptions(labelOptions, defaultColor) {
            var opt = labelOptions || {},
                labelFont = _extend({}, opt.font) || {},
                labelBorder = opt.border || {},
                labelConnector = opt.connector || {},
                backgroundAttr = {
                    fill: opt.backgroundColor || defaultColor,
                    "stroke-width": labelBorder.visible ? labelBorder.width || 0 : 0,
                    stroke: labelBorder.visible && labelBorder.width ? labelBorder.color : "none",
                    dashStyle: labelBorder.dashStyle
                },
                connectorAttr = {
                    stroke: labelConnector.visible && labelConnector.width ? labelConnector.color || defaultColor : "none",
                    "stroke-width": labelConnector.visible ? labelConnector.width || 0 : 0
                };
            labelFont.color = opt.backgroundColor === "none" && _normalizeEnum(labelFont.color) === "#ffffff" && opt.position !== "inside" ? defaultColor : labelFont.color;
            return {
                    alignment: opt.alignment,
                    format: opt.format,
                    argumentFormat: opt.argumentFormat,
                    precision: opt.precision,
                    argumentPrecision: opt.argumentPrecision,
                    percentPrecision: opt.percentPrecision,
                    customizeText: $.isFunction(opt.customizeText) ? opt.customizeText : undefined,
                    attributes: {font: labelFont},
                    visible: labelFont.size !== 0 ? opt.visible : false,
                    showForZeroValues: opt.showForZeroValues,
                    horizontalOffset: opt.horizontalOffset,
                    verticalOffset: opt.verticalOffset,
                    radialOffset: opt.radialOffset,
                    background: backgroundAttr,
                    position: opt.position,
                    connector: connectorAttr,
                    rotationAngle: opt.rotationAngle
                }
        }
        function isInInterval(argument, ticks, nowIndexTicks, ticksInterval) {
            var minTick = ticks[nowIndexTicks],
                maxTick = ticks[nowIndexTicks + 1],
                sumMinTickTicksInterval;
            ticksInterval = $.isNumeric(ticksInterval) ? ticksInterval : dateUtils.dateToMilliseconds(ticksInterval);
            sumMinTickTicksInterval = commonUtils.isDate(minTick) ? new Date(minTick.getTime() + ticksInterval) : minTick + ticksInterval;
            if (argument >= minTick && argument < sumMinTickTicksInterval)
                return true;
            if (argument < minTick || maxTick === undefined)
                return false;
            return "nextInterval"
        }
        function applyPointStyle(point, styleName) {
            !point.isSelected() && !point.hasSelectedView && point.applyStyle(styleName)
        }
        function Series(renderSettings, options) {
            var that = this;
            that.fullState = 0;
            that._extGroups = renderSettings;
            that._renderer = renderSettings.renderer;
            that._group = renderSettings.renderer.g().attr({"class": "dxc-series"});
            that.updateOptions(options)
        }
        seriesNS.Series = Series;
        Series.prototype = {
            constructor: Series,
            _createLegendState: _noop,
            getLegendStyles: function() {
                return this._styles.legendStyles
            },
            _createStyles: function(options) {
                var that = this,
                    mainSeriesColor = options.mainSeriesColor,
                    specialMainColor = that._getSpecialColor(mainSeriesColor);
                that._styles = {
                    normal: that._parseStyle(options, mainSeriesColor, mainSeriesColor),
                    hover: that._parseStyle(options.hoverStyle || {}, specialMainColor, mainSeriesColor),
                    selection: that._parseStyle(options.selectionStyle || {}, specialMainColor, mainSeriesColor),
                    legendStyles: {
                        normal: that._createLegendState(options, mainSeriesColor),
                        hover: that._createLegendState(options.hoverStyle || {}, specialMainColor),
                        selection: that._createLegendState(options.selectionStyle || {}, specialMainColor)
                    }
                }
            },
            setClippingParams: function(baseId, wideId, forceClipping) {
                this._paneClipRectID = baseId;
                this._widePaneClipRectID = wideId;
                this._forceClipping = forceClipping
            },
            applyClip: function() {
                this._group.attr({clipId: this._paneClipRectID})
            },
            resetClip: function() {
                this._group.attr({clipId: null})
            },
            getTagField: function() {
                return this._options.tagField || "tag"
            },
            getValueFields: _noop,
            getArgumentField: _noop,
            getPoints: function() {
                return this._points
            },
            _createPoint: function(data, pointsArray, index) {
                data.index = index;
                var that = this,
                    point = pointsArray[index],
                    pointsByArgument = that.pointsByArgument,
                    options,
                    arg,
                    pba;
                if (that._checkData(data)) {
                    options = that._customizePoint(data) || that._getCreatingPointOptions(data);
                    if (point)
                        point.update(data, options);
                    else {
                        point = viz.CoreFactory.createPoint(that, data, options);
                        pointsArray.push(point)
                    }
                    arg = point.argument.valueOf();
                    pba = pointsByArgument[arg];
                    if (pba)
                        pba.push(point);
                    else
                        pointsByArgument[arg] = [point];
                    return true
                }
            },
            getRangeData: function(zoomArgs, calcIntervalFunction) {
                return this._visible ? _extend(true, {}, this._getRangeData(zoomArgs, calcIntervalFunction)) : getEmptyBusinessRange()
            },
            _deleteGroup: function(groupName) {
                var group = this[groupName];
                if (group) {
                    group.dispose();
                    this[groupName] = null
                }
            },
            _saveOldAnimationMethods: function() {
                var that = this;
                that._oldClearingAnimation = that._clearingAnimation;
                that._oldUpdateElement = that._updateElement;
                that._oldgetAffineCoordOptions = that._getAffineCoordOptions
            },
            _deleteOldAnimationMethods: function() {
                this._oldClearingAnimation = null;
                this._oldUpdateElement = null;
                this._oldgetAffineCoordOptions = null
            },
            updateOptions: function(newOptions) {
                var that = this,
                    widgetType = newOptions.widgetType,
                    oldType = that.type,
                    newType = newOptions.type;
                that.type = newType && _normalizeEnum(newType.toString());
                if (!that._checkType(widgetType) || that._checkPolarBarType(widgetType, newOptions)) {
                    that.dispose();
                    that.isUpdated = false;
                    return
                }
                if (oldType !== that.type) {
                    that._firstDrawing = true;
                    that._saveOldAnimationMethods();
                    that._resetType(oldType, widgetType);
                    that._setType(that.type, widgetType)
                }
                that._options = newOptions;
                that._pointOptions = null;
                that._deletePatterns();
                that.name = newOptions.name;
                that.pane = newOptions.pane;
                that.axis = newOptions.axis;
                that.tag = newOptions.tag;
                that._createStyles(newOptions);
                that._updateOptions(newOptions);
                that._visible = newOptions.visible;
                that.isUpdated = true;
                that._createGroups()
            },
            _disposePoints: function(points) {
                _each(points || [], function(_, p) {
                    p.dispose()
                })
            },
            _correctPointsLength: function(length, points) {
                this._disposePoints(this._oldPoints);
                this._oldPoints = points.splice(length, points.length)
            },
            _getTicksForAggregation: function(min, max, screenDelta, pointSize) {
                var types = {
                        axisType: "continuous",
                        dataType: commonUtils.isDate(min) ? "datetime" : "numeric"
                    },
                    data = {
                        min: min,
                        max: max,
                        screenDelta: screenDelta
                    },
                    options = {
                        gridSpacingFactor: pointSize,
                        labelOptions: {},
                        stick: true
                    },
                    tickManager = new viz.tickManager.TickManager(types, data, options);
                return {
                        ticks: tickManager.getTicks(true),
                        tickInterval: tickManager.getTickInterval()
                    }
            },
            getErrorBarRangeCorrector: _noop,
            updateDataType: function(settings) {
                var that = this;
                that.argumentType = settings.argumentType;
                that.valueType = settings.valueType;
                that.argumentAxisType = settings.argumentAxisType;
                that.valueAxisType = settings.valueAxisType;
                that.showZero = settings.showZero;
                return that
            },
            getOptions: function() {
                return this._options
            },
            _resetRangeData: function() {
                this._rangeData = getEmptyBusinessRange()
            },
            updateData: function(data) {
                var that = this,
                    points = that._originalPoints || [],
                    lastPointIndex = 0,
                    options = that._options,
                    i = 0,
                    len = data.length,
                    lastPoint = null,
                    curPoint,
                    rangeCorrector = that.getErrorBarRangeCorrector();
                that.pointsByArgument = {};
                that._resetRangeData();
                if (data && data.length)
                    that._canRenderCompleteHandle = true;
                that._beginUpdateData(data);
                while (i < len) {
                    if (that._createPoint(that._getPointData(data[i], options), points, lastPointIndex)) {
                        curPoint = points[lastPointIndex];
                        that._processRange(curPoint, lastPoint, rangeCorrector);
                        lastPoint = curPoint;
                        lastPointIndex++
                    }
                    i++
                }
                that._disposePoints(that._aggregatedPoints);
                that._aggregatedPoints = null;
                that._points = that._originalPoints = points;
                that._correctPointsLength(lastPointIndex, points);
                that._endUpdateData()
            },
            getTeamplatedFields: function() {
                var that = this,
                    fields = that.getValueFields(),
                    teampleteFields = [];
                fields.push(that.getTagField());
                _each(fields, function(_, field) {
                    var fieldsObject = {};
                    fieldsObject.teamplateField = field + that.name;
                    fieldsObject.originalField = field;
                    teampleteFields.push(fieldsObject)
                });
                return teampleteFields
            },
            resamplePoints: function(argTranslator, min, max) {
                var that = this,
                    originalPoints = that.getAllPoints(),
                    minI,
                    maxI,
                    sizePoint,
                    tickObject,
                    ticks,
                    tickInterval;
                if (originalPoints.length) {
                    _each(originalPoints, function(i, point) {
                        minI = point.argument - min <= 0 ? i : minI;
                        if (!maxI)
                            maxI = point.argument - max > 0 ? i : null
                    });
                    minI = minI ? minI : 1;
                    maxI = _isDefined(maxI) ? maxI : originalPoints.length - 1;
                    min = originalPoints[minI - 1].argument;
                    max = originalPoints[maxI].argument;
                    sizePoint = that._getPointSize();
                    if (that.argumentAxisType !== "discrete" && that.valueAxisType !== "discrete") {
                        tickObject = that._getTicksForAggregation(min, max, argTranslator.canvasLength, sizePoint);
                        ticks = tickObject.ticks;
                        tickInterval = tickObject.tickInterval;
                        if (ticks.length === 1) {
                            that._points = originalPoints;
                            return
                        }
                    }
                    else
                        ticks = argTranslator.canvasLength / sizePoint;
                    that._points = that._resample(ticks, tickInterval, argTranslator)
                }
            },
            _removeOldSegments: function(startIndex) {
                var that = this;
                _each(that._graphics.splice(startIndex, that._graphics.length) || [], function(_, elem) {
                    that._removeElement(elem)
                });
                if (that._trackers)
                    _each(that._trackers.splice(startIndex, that._trackers.length) || [], function(_, elem) {
                        elem.remove()
                    })
            },
            draw: function(translators, animationEnabled, hideLayoutLabels, legendCallback) {
                var that = this,
                    drawComplete;
                if (that._oldClearingAnimation && animationEnabled && that._firstDrawing) {
                    drawComplete = function() {
                        that._draw(translators, true, hideLayoutLabels)
                    };
                    that._oldClearingAnimation(translators, drawComplete)
                }
                else
                    that._draw(translators, animationEnabled, hideLayoutLabels, legendCallback)
            },
            _draw: function(translators, animationEnabled, hideLayoutLabels, legendCallback) {
                var that = this,
                    points = that._points || [],
                    segment = [],
                    segmentCount = 0,
                    firstDrawing = that._firstDrawing,
                    closeSegment = points[0] && points[0].hasValue() && that._options.closed,
                    groupForPoint;
                that._graphics = that._graphics || [];
                that._prepareSeriesToDrawing();
                if (!that._visible) {
                    animationEnabled = false;
                    that._group.remove();
                    return
                }
                that._group.append(that._extGroups.seriesGroup);
                that.translators = translators;
                that._applyVisibleArea();
                that._setGroupsSettings(animationEnabled, firstDrawing);
                that._segments = [];
                that._drawedPoints = [];
                that._firstDrawing = points.length ? false : true;
                groupForPoint = {
                    markers: that._markersGroup,
                    errorBars: that._errorBarGroup
                };
                _each(points, function(i, p) {
                    p.translate(translators);
                    if (p.hasValue()) {
                        that._drawPoint({
                            point: p,
                            groups: groupForPoint,
                            hasAnimation: animationEnabled,
                            firstDrawing: firstDrawing,
                            legendCallback: legendCallback
                        });
                        segment.push(p)
                    }
                    else if (segment.length) {
                        that._drawSegment(segment, animationEnabled, segmentCount++);
                        segment = []
                    }
                });
                segment.length && that._drawSegment(segment, animationEnabled, segmentCount++, closeSegment);
                that._removeOldSegments(segmentCount);
                that._defaultSegments = that._generateDefaultSegments();
                hideLayoutLabels && that.hideLabels();
                animationEnabled && that._animate(firstDrawing);
                if (that.isSelected())
                    that._changeStyle(legendCallback, APPLY_SELECTED);
                else if (that.isHovered())
                    that._changeStyle(legendCallback, APPLY_HOVER)
            },
            _setLabelGroupSettings: function(animationEnabled) {
                var that = this,
                    settings = {
                        "class": "dxc-labels",
                        visibility: that.getLabelVisibility() ? "visible" : "hidden"
                    };
                that._applyElementsClipRect(settings);
                that._applyClearingSettings(settings);
                animationEnabled && (settings.opacity = 0.001);
                that._labelsGroup.attr(settings).append(that._extGroups.labelsGroup)
            },
            _checkType: function(widgetType) {
                return !!seriesNS.mixins[widgetType][this.type]
            },
            _checkPolarBarType: function(widgetType, options) {
                return widgetType === "polar" && options.spiderWidget && this.type.indexOf("bar") !== -1
            },
            _resetType: function(seriesType, widgetType) {
                var methodName,
                    methods;
                if (seriesType) {
                    methods = seriesNS.mixins[widgetType][seriesType];
                    for (methodName in methods)
                        delete this[methodName]
                }
            },
            _setType: function(seriesType, widgetType) {
                var methodName,
                    methods = seriesNS.mixins[widgetType][seriesType];
                for (methodName in methods)
                    this[methodName] = methods[methodName]
            },
            setSelectedState: function(state, mode, legendCallback) {
                var that = this;
                that.lastSelectionMode = _normalizeEnum(mode || that._options.selectionMode);
                if (state && !that.isSelected()) {
                    that.fullState = that.fullState | SELECTED_STATE;
                    that._nearestPoint && applyPointStyle(that._nearestPoint, "normal");
                    that._nearestPoint = null;
                    that._changeStyle(legendCallback, APPLY_SELECTED)
                }
                else if (!state && that.isSelected()) {
                    that.fullState = that.fullState & ~SELECTED_STATE;
                    if (that.isHovered())
                        that._changeStyle(legendCallback, APPLY_HOVER, SELECTION);
                    else
                        that._changeStyle(legendCallback, RESET_ITEM)
                }
            },
            setHoverState: function(state, mode, legendCallback) {
                var that = this;
                that.lastHoverMode = _normalizeEnum(mode || that._options.hoverMode);
                if (state && !that.isHovered()) {
                    that.fullState = that.fullState | HOVER_STATE;
                    !that.isSelected() && that._changeStyle(legendCallback, APPLY_HOVER)
                }
                else if (!state && that.isHovered()) {
                    that._nearestPoint = null;
                    that.fullState = that.fullState & ~HOVER_STATE;
                    !that.isSelected() && that._changeStyle(legendCallback, RESET_ITEM)
                }
            },
            setHoverView: function() {
                if (this._canShangeView()) {
                    this._applyStyle(this._styles.hover);
                    return this
                }
                return null
            },
            releaseHoverView: function(legendCallback) {
                this._canShangeView() && this._applyStyle(this._styles.normal)
            },
            isFullStackedSeries: function() {
                return this.type.indexOf("fullstacked") === 0
            },
            isStackedSeries: function() {
                return this.type.indexOf("stacked") === 0
            },
            isFinancialSeries: function() {
                return this.type === "stock" || this.type === "candlestick"
            },
            _canShangeView: function() {
                return !this.isSelected() && _normalizeEnum(this._options.hoverMode) !== NONE_MODE
            },
            _changeStyle: function(legendCallBack, legendAction, prevStyle) {
                var that = this,
                    style = that._calcStyle(prevStyle),
                    pointStyle;
                if (style.mode === NONE_MODE)
                    return;
                legendCallBack && legendCallBack(legendAction);
                if (includePointsMode(style.mode)) {
                    pointStyle = style.pointStyle;
                    _each(that._points || [], function(_, p) {
                        applyPointStyle(p, pointStyle)
                    })
                }
                that._applyStyle(style.series)
            },
            _calcStyle: function(prevStyle) {
                var that = this,
                    styles = that._styles,
                    pointNormalState = false,
                    result;
                switch (that.fullState & 3) {
                    case 0:
                        result = {
                            pointStyle: NORMAL,
                            mode: INCLUDE_POINTS,
                            series: styles.normal
                        };
                        break;
                    case 1:
                        pointNormalState = prevStyle === SELECTION && that.lastHoverMode === EXLUDE_POINTS || that.lastHoverMode === NEAREST_POINT && includePointsMode(that.lastSelectionMode);
                        result = {
                            pointStyle: pointNormalState ? NORMAL : HOVER,
                            mode: pointNormalState ? INCLUDE_POINTS : that.lastHoverMode,
                            series: styles.hover
                        };
                        break;
                    case 2:
                        result = {
                            pointStyle: SELECTION,
                            mode: that.lastSelectionMode,
                            series: styles.selection
                        };
                        break;
                    case 3:
                        pointNormalState = that.lastSelectionMode === EXLUDE_POINTS && includePointsMode(that.lastHoverMode);
                        result = {
                            pointStyle: pointNormalState ? NORMAL : SELECTION,
                            mode: pointNormalState ? INCLUDE_POINTS : that.lastSelectionMode,
                            series: styles.selection
                        }
                }
                return result
            },
            updateHover: function(x, y) {
                var that = this,
                    currentNearestPoint = that._nearestPoint,
                    point = that.isHovered() && that.lastHoverMode === NEAREST_POINT && that.getNeighborPoint(x, y);
                if (point !== currentNearestPoint && !that.isSelected()) {
                    currentNearestPoint && applyPointStyle(currentNearestPoint, "normal");
                    if (point) {
                        applyPointStyle(point, "hover");
                        that._nearestPoint = point
                    }
                }
            },
            _getMainAxisName: function() {
                return this._options.rotated ? "X" : "Y"
            },
            areLabelsVisible: function() {
                return !_isDefined(this._options.maxLabelCount) || this._points.length <= this._options.maxLabelCount
            },
            getLabelVisibility: function() {
                return this.areLabelsVisible() && this._options.label && this._options.label.visible
            },
            _customizePoint: function(pointData) {
                var that = this,
                    options = that._options,
                    customizePoint = options.customizePoint,
                    customizeObject,
                    pointOptions,
                    customLabelOptions,
                    customOptions,
                    customizeLabel = options.customizeLabel,
                    useLabelCustomOptions,
                    usePointCustomOptions;
                if (customizeLabel && customizeLabel.call) {
                    customizeObject = _extend({seriesName: that.name}, pointData);
                    customizeObject.series = that;
                    customLabelOptions = customizeLabel.call(customizeObject, customizeObject);
                    useLabelCustomOptions = customLabelOptions && !_isEmptyObject(customLabelOptions);
                    customLabelOptions = useLabelCustomOptions ? _extend(true, {}, options.label, customLabelOptions) : null
                }
                if (customizePoint && customizePoint.call) {
                    customizeObject = customizeObject || _extend({seriesName: that.name}, pointData);
                    customizeObject.series = that;
                    customOptions = customizePoint.call(customizeObject, customizeObject);
                    usePointCustomOptions = customOptions && !_isEmptyObject(customOptions)
                }
                if (useLabelCustomOptions || usePointCustomOptions) {
                    pointOptions = that._parsePointOptions(that._preparePointOptions(customOptions), customLabelOptions || options.label, pointData);
                    pointOptions.styles.useLabelCustomOptions = useLabelCustomOptions;
                    pointOptions.styles.usePointCustomOptions = usePointCustomOptions
                }
                return pointOptions
            },
            show: function() {
                if (!this._visible)
                    this._changeVisibility(true)
            },
            hide: function() {
                if (this._visible)
                    this._changeVisibility(false)
            },
            _changeVisibility: function(visibility) {
                var that = this;
                that._visible = that._options.visible = visibility;
                that._updatePointsVisibility();
                that.hidePointTooltip();
                that._options.visibilityChanged()
            },
            _updatePointsVisibility: _noop,
            hideLabels: function() {
                _each(this._points, function(_, point) {
                    point._label.hide()
                })
            },
            _parsePointOptions: function(pointOptions, labelOptions, data) {
                var that = this,
                    options = that._options,
                    styles = that._createPointStyles(pointOptions, data),
                    parsedOptions = _extend(true, {}, pointOptions, {
                        type: options.type,
                        tag: that.tag,
                        rotated: options.rotated,
                        styles: styles,
                        widgetType: options.widgetType,
                        visibilityChanged: options.visibilityChanged
                    });
                parsedOptions.label = getLabelOptions(labelOptions, styles.normal.fill);
                if (that.areErrorBarsVisible())
                    parsedOptions.errorBars = options.valueErrorBar;
                return parsedOptions
            },
            _preparePointOptions: function(customOptions) {
                var point = this._getOptionsForPoint();
                return customOptions ? _extend(true, {}, point, customOptions) : point
            },
            _getMarkerGroupOptions: function() {
                return _extend(false, {}, this._getOptionsForPoint(), {
                        hoverStyle: {},
                        selectionStyle: {}
                    })
            },
            _resample: function(ticks, ticksInterval, argTranslator) {
                var that = this,
                    fusPoints = [],
                    arrayFusPoints,
                    nowIndexTicks = 0,
                    lastPointIndex = 0,
                    originalPoints = that.getAllPoints(),
                    visibleArea;
                if (that.argumentAxisType === "discrete" || that.valueAxisType === "discrete") {
                    visibleArea = argTranslator.getCanvasVisibleArea();
                    originalPoints = _map(originalPoints, function(p) {
                        var pos = argTranslator.translate(p.argument),
                            result = null;
                        if (pos >= visibleArea.min && pos <= visibleArea.max)
                            result = p;
                        else
                            p.setInvisibility();
                        return result
                    });
                    ticksInterval = originalPoints.length / ticks;
                    arrayFusPoints = _map(originalPoints, function(point, index) {
                        if (Math.floor(nowIndexTicks) <= index) {
                            nowIndexTicks += ticksInterval;
                            return point
                        }
                        point.setInvisibility();
                        return null
                    });
                    return arrayFusPoints
                }
                that._aggregatedPoints = that._aggregatedPoints || [];
                _each(originalPoints, function(_, point) {
                    point.setInvisibility();
                    switch (isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval)) {
                        case true:
                            fusPoints.push(point);
                            break;
                        case"nextInterval":
                            var pointData = that._fusionPoints(fusPoints, ticks[nowIndexTicks], nowIndexTicks);
                            while (isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval) === "nextInterval")
                                nowIndexTicks++;
                            fusPoints = [];
                            isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval) === true && fusPoints.push(point);
                            if (that._createPoint(pointData, that._aggregatedPoints, lastPointIndex))
                                lastPointIndex++
                    }
                });
                if (fusPoints.length) {
                    var pointData = that._fusionPoints(fusPoints, ticks[nowIndexTicks], nowIndexTicks);
                    if (that._createPoint(pointData, that._aggregatedPoints, lastPointIndex))
                        lastPointIndex++
                }
                that._correctPointsLength(lastPointIndex, that._aggregatedPoints);
                that._endUpdateData();
                return that._aggregatedPoints
            },
            canRenderCompleteHandle: function() {
                var result = this._canRenderCompleteHandle;
                delete this._canRenderCompleteHandle;
                return !!result
            },
            isHovered: function() {
                return !!(this.fullState & 1)
            },
            isSelected: function() {
                return !!(this.fullState & 2)
            },
            isVisible: function() {
                return this._visible
            },
            getAllPoints: function() {
                return (this._originalPoints || []).slice()
            },
            getPointByPos: function(pos) {
                return (this._points || [])[pos]
            },
            getVisiblePoints: function() {
                return (this._drawedPoints || []).slice()
            },
            setPointHoverState: function(data) {
                var point = data.point,
                    legendCallback = data.legendCallback;
                if (data.setState)
                    point.fullState = point.fullState | HOVER_STATE;
                if (!(this.isSelected() && includePointsMode(this.lastSelectionMode)) && !point.isSelected() && !point.hasSelectedView) {
                    point.applyStyle(HOVER);
                    legendCallback && legendCallback("applyHover")
                }
            },
            releasePointHoverState: function(data) {
                var that = this,
                    point = data.point,
                    legendCallback = data.legendCallback;
                if (data.setState)
                    point.fullState = point.fullState & ~HOVER_STATE;
                if (!(that.isSelected() && includePointsMode(that.lastSelectionMode)) && !point.isSelected() && !point.hasSelectedView)
                    if (!(that.isHovered() && includePointsMode(that.lastHoverMode)) || that.isSelected() && that.lastSelectionMode === EXLUDE_POINTS) {
                        point.applyStyle(NORMAL);
                        legendCallback && legendCallback(RESET_ITEM)
                    }
            },
            setPointSelectedState: function(data) {
                var legendCallback = data.legendCallback,
                    point = data.point;
                if (data.setState)
                    point.fullState = point.fullState | SELECTED_STATE;
                else
                    point.hasSelectedView = true;
                point.applyStyle(SELECTION);
                legendCallback && legendCallback("applySelected")
            },
            releasePointSelectedState: function(data) {
                var that = this,
                    pointStyle,
                    point = data.point,
                    legendCallback = data.legendCallback,
                    legendAction;
                if (data.setState)
                    point.fullState = point.fullState & ~SELECTED_STATE;
                else
                    point.hasSelectedView = false;
                if (that.isHovered() && includePointsMode(that.lastHoverMode) || point.isHovered()) {
                    pointStyle = HOVER;
                    legendAction = "applyHover"
                }
                else if (that.isSelected() && includePointsMode(that.lastSelectionMode)) {
                    pointStyle = SELECTION;
                    legendAction = "applySelected"
                }
                else {
                    pointStyle = NORMAL;
                    legendAction = RESET_ITEM
                }
                point.applyStyle(pointStyle);
                legendCallback && legendCallback(legendAction)
            },
            selectPoint: function(point) {
                triggerEvent(this._extGroups.seriesGroup, new _Event("selectpoint"), point)
            },
            deselectPoint: function(point) {
                triggerEvent(this._extGroups.seriesGroup, new _Event("deselectpoint"), point)
            },
            showPointTooltip: function(point) {
                triggerEvent(this._extGroups.seriesGroup, new _Event("showpointtooltip"), point)
            },
            hidePointTooltip: function(point) {
                triggerEvent(this._extGroups.seriesGroup, new _Event("hidepointtooltip"), point)
            },
            select: function() {
                var that = this;
                triggerEvent(that._extGroups.seriesGroup, new _Event("selectseries", {target: that}), that._options.selectionMode);
                that._group.toForeground()
            },
            clearSelection: function clearSelection() {
                var that = this;
                triggerEvent(that._extGroups.seriesGroup, new _Event("deselectseries", {target: that}), that._options.selectionMode)
            },
            getPointsByArg: function(arg) {
                return this.pointsByArgument[arg.valueOf()] || []
            },
            _deletePoints: function() {
                var that = this;
                that._disposePoints(that._originalPoints);
                that._disposePoints(that._aggregatedPoints);
                that._disposePoints(that._oldPoints);
                that._points = that._oldPoints = that._aggregatedPoints = that._originalPoints = that._drawedPoints = null
            },
            _deletePatterns: function() {
                _each(this._patterns || [], function(_, pattern) {
                    pattern && pattern.dispose()
                });
                this._patterns = []
            },
            _deleteTrackers: function() {
                var that = this;
                _each(that._trackers || [], function(_, tracker) {
                    tracker.remove()
                });
                that._trackersGroup && that._trackersGroup.dispose();
                that._trackers = that._trackersGroup = null
            },
            dispose: function() {
                var that = this;
                that._deletePoints();
                that._group.dispose();
                that._labelsGroup && that._labelsGroup.dispose();
                that._errorBarGroup && that._errorBarGroup.dispose();
                that._deletePatterns();
                that._deleteTrackers();
                that._group = that._extGroups = that._markersGroup = that._elementsGroup = that._bordersGroup = that._labelsGroup = that._errorBarGroup = that._graphics = that._rangeData = that._renderer = that.translators = that._styles = that._options = that._pointOptions = that._drawedPoints = that._aggregatedPoints = that.pointsByArgument = that._segments = that._prevSeries = that._patterns = null
            },
            correctPosition: _noop,
            drawTrackers: _noop,
            getNeighborPoint: _noop,
            areErrorBarsVisible: _noop,
            getColor: function() {
                return this.getLegendStyles().normal.fill
            },
            getOpacity: function() {
                return this._options.opacity
            },
            getStackName: function() {
                return this.type === "stackedbar" || this.type === "fullstackedbar" ? this._stackName : null
            },
            getPointByCoord: function(x, y) {
                var point = this.getNeighborPoint(x, y);
                return point && point.coordsIn(x, y) ? point : null
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeDataCalculator.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            _math = Math,
            _abs = _math.abs,
            _min = _math.min,
            _max = _math.max,
            _each = $.each,
            _isEmptyObject = $.isEmptyObject,
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _isFinite = isFinite,
            unique = viz.utils.unique,
            MIN_VISIBLE = "minVisible",
            MAX_VISIBLE = "maxVisible",
            DISCRETE = "discrete";
        function _truncateValue(data, value) {
            var min = data.min,
                max = data.max;
            data.min = value < min || !_isDefined(min) ? value : min;
            data.max = value > max || !_isDefined(max) ? value : max
        }
        function _processValue(series, type, value, prevValue, calcInterval) {
            var isDiscrete = (type === "arg" ? series.argumentAxisType : series.valueAxisType) === DISCRETE,
                data = series._rangeData[type],
                minInterval = data.interval,
                interval;
            if (isDiscrete) {
                data.categories = data.categories || [];
                data.categories.push(value)
            }
            else {
                _truncateValue(data, value);
                if (type === "arg") {
                    interval = (_isDefined(prevValue) ? _abs(calcInterval ? calcInterval(value, prevValue) : value - prevValue) : interval) || minInterval;
                    data.interval = _isDefined(interval) && (interval < minInterval || !_isDefined(minInterval)) ? interval : minInterval
                }
            }
        }
        function _addToVisibleRange(series, value) {
            var data = series._rangeData.val,
                isDiscrete = series.valueAxisType === DISCRETE;
            if (!isDiscrete) {
                if (value < data.minVisible || !_isDefined(data.minVisible))
                    data.minVisible = value;
                if (value > data.maxVisible || !_isDefined(data.maxVisible))
                    data.maxVisible = value
            }
        }
        function _processRangeValue(series, val, minVal) {
            var data = series._rangeData.val;
            if (series.valueAxisType === DISCRETE) {
                data.categories = data.categories || [];
                data.categories.push(val, minVal)
            }
            else {
                _truncateValue(data, val);
                _truncateValue(data, minVal)
            }
        }
        function _processZoomArgument(series, zoomArgs, isDiscrete) {
            var data = series._rangeData.arg,
                minArg,
                maxArg;
            if (isDiscrete) {
                data.minVisible = zoomArgs.minArg;
                data.maxVisible = zoomArgs.maxArg;
                return
            }
            minArg = zoomArgs.minArg < zoomArgs.maxArg ? zoomArgs.minArg : zoomArgs.maxArg;
            maxArg = zoomArgs.maxArg > zoomArgs.minArg ? zoomArgs.maxArg : zoomArgs.minArg;
            data.min = minArg < data.min ? minArg : data.min;
            data.max = maxArg > data.max ? maxArg : data.max;
            data.minVisible = minArg;
            data.maxVisible = maxArg
        }
        function _correctZoomValue(series, zoomArgs) {
            var minVal,
                maxVal;
            if (_isDefined(zoomArgs.minVal) && _isDefined(zoomArgs.maxVal)) {
                minVal = zoomArgs.minVal < zoomArgs.maxVal ? zoomArgs.minVal : zoomArgs.maxVal;
                maxVal = zoomArgs.maxVal > zoomArgs.minVal ? zoomArgs.maxVal : zoomArgs.minVal
            }
            if (_isDefined(zoomArgs.minVal)) {
                series._rangeData.val.min = minVal < series._rangeData.val.min ? minVal : series._rangeData.val.min;
                series._rangeData.val.minVisible = minVal
            }
            if (_isDefined(zoomArgs.maxVal)) {
                series._rangeData.val.max = maxVal > series._rangeData.val.max ? maxVal : series._rangeData.val.max;
                series._rangeData.val.maxVisible = maxVal
            }
        }
        function _processZoomValue(series, zoomArgs) {
            var adjustOnZoom = zoomArgs.adjustOnZoom,
                points = series._points || [],
                lastVisibleIndex,
                prevPointAdded = false,
                rangeData = series._rangeData,
                errorBarCorrector = series.getErrorBarRangeCorrector();
            _each(points, function(index, point) {
                var arg = point.argument,
                    prevPoint = index > 0 ? points[index - 1] : null;
                if (adjustOnZoom && series.argumentAxisType !== DISCRETE && arg >= rangeData.arg.minVisible && arg <= rangeData.arg.maxVisible) {
                    if (!prevPointAdded) {
                        if (prevPoint && prevPoint.hasValue()) {
                            _addToVisibleRange(series, prevPoint.value);
                            _correctMinMaxByErrorBar(rangeData.val, prevPoint, errorBarCorrector, MIN_VISIBLE, MAX_VISIBLE)
                        }
                        prevPointAdded = true
                    }
                    if (point.hasValue()) {
                        _addToVisibleRange(series, point.value);
                        _correctMinMaxByErrorBar(rangeData.val, point, errorBarCorrector, MIN_VISIBLE, MAX_VISIBLE)
                    }
                    lastVisibleIndex = index
                }
            });
            if (_isDefined(lastVisibleIndex) && lastVisibleIndex < points.length - 1 && points[lastVisibleIndex + 1].hasValue())
                _addToVisibleRange(series, points[lastVisibleIndex + 1].value);
            _correctZoomValue(series, zoomArgs)
        }
        function _processZoomRangeValue(series, zoomArgs, maxValueName, minValueName) {
            var adjustOnZoom = zoomArgs.adjustOnZoom,
                points = series._points || [],
                argRangeData = series._rangeData.arg,
                lastVisibleIndex,
                prevPointAdded = false;
            _each(points, function(index, point) {
                var arg = point.argument,
                    prevPoint = index > 0 ? points[index - 1] : null;
                if (adjustOnZoom && series.argumentAxisType !== DISCRETE && arg >= argRangeData.minVisible && arg <= argRangeData.maxVisible) {
                    if (!prevPointAdded) {
                        if (prevPoint && prevPoint.hasValue()) {
                            _addToVisibleRange(series, prevPoint[maxValueName]);
                            _addToVisibleRange(series, prevPoint[minValueName])
                        }
                        prevPointAdded = true
                    }
                    if (point.hasValue()) {
                        _addToVisibleRange(series, point[maxValueName]);
                        _addToVisibleRange(series, point[minValueName])
                    }
                    lastVisibleIndex = index
                }
            });
            if (_isDefined(lastVisibleIndex) && lastVisibleIndex < points.length - 1 && points[lastVisibleIndex + 1].hasValue())
                _addToVisibleRange(series, points[lastVisibleIndex + 1].value);
            _correctZoomValue(series, zoomArgs)
        }
        function _processNewInterval(series, calcInterval) {
            var data = series._rangeData,
                points = series._points || [],
                isArgumentAxisDiscrete = series.argumentAxisType === DISCRETE;
            delete data.arg.interval;
            _each(points, function(index, point) {
                var arg = point.argument,
                    prevPoint = index > 0 ? points[index - 1] : null,
                    prevArg = prevPoint && prevPoint.argument;
                !isArgumentAxisDiscrete && _processValue(series, "arg", arg, prevArg, calcInterval)
            })
        }
        function _fillRangeData(series) {
            var data = series._rangeData;
            data.arg.categories && (data.arg.categories = unique(data.arg.categories));
            data.val.categories && (data.val.categories = unique(data.val.categories));
            data.arg.axisType = series.argumentAxisType;
            data.arg.dataType = series.argumentType;
            data.val.axisType = series.valueAxisType;
            data.val.dataType = series.valueType;
            data.val.isValueRange = true
        }
        function processTwoValues(series, point, prevPoint, highValueName, lowValueName) {
            var val = point[highValueName],
                minVal = point[lowValueName],
                arg = point.argument,
                prevVal = prevPoint && prevPoint[highValueName],
                prevMinVal = prevPoint && prevPoint[lowValueName],
                prevArg = prevPoint && prevPoint.argument;
            point.hasValue() && _processRangeValue(series, val, minVal, prevVal, prevMinVal);
            _processValue(series, "arg", arg, prevArg)
        }
        function calculateRangeMinValue(series, zoomArgs) {
            var data = series._rangeData.val,
                minVisible = data[MIN_VISIBLE],
                maxVisible = data[MAX_VISIBLE];
            zoomArgs = zoomArgs || {};
            if (data)
                if (series.valueAxisType !== "logarithmic" && series.valueType !== "datetime" && series.showZero !== false) {
                    data[MIN_VISIBLE] = minVisible > (zoomArgs.minVal || 0) ? zoomArgs.minVal || 0 : minVisible;
                    data[MAX_VISIBLE] = maxVisible < (zoomArgs.maxVal || 0) ? zoomArgs.maxVal || 0 : maxVisible;
                    data.min = data.min > 0 ? 0 : data.min;
                    data.max = data.max < 0 ? 0 : data.max
                }
        }
        function processFullStackedRange(series) {
            var data = series._rangeData.val,
                isRangeEmpty = _isEmptyObject(data);
            data.percentStick = true;
            if (!isRangeEmpty) {
                data.min = data.min > 0 ? 0 : data.min;
                data.max = data.max < 0 ? 0 : data.max
            }
        }
        function _correctMinMaxByErrorBar(data, point, getMinMaxCorrector, minSelector, maxSelector) {
            if (!getMinMaxCorrector)
                return;
            var correctionData = getMinMaxCorrector(point),
                minError = _min.apply(undefined, correctionData),
                maxError = _max.apply(undefined, correctionData);
            if (_isFinite(minError) && data[minSelector] > minError)
                data[minSelector] = minError;
            if (_isFinite(maxError) && data[maxSelector] < maxError)
                data[maxSelector] = maxError
        }
        function processRange(series, point, prevPoint, getMinMaxCorrector) {
            var val = point.value,
                arg = point.argument,
                prevVal = prevPoint && prevPoint.value,
                prevArg = prevPoint && prevPoint.argument;
            point.hasValue() && _processValue(series, "val", val, prevVal);
            _processValue(series, "arg", arg, prevArg);
            _correctMinMaxByErrorBar(series._rangeData.val, point, getMinMaxCorrector, "min", "max")
        }
        function addLabelPaddings(series) {
            var labelOptions = series.getOptions().label,
                valueData;
            if (series.areLabelsVisible() && labelOptions && labelOptions.visible && labelOptions.position !== "inside") {
                valueData = series._rangeData.val;
                if (valueData.min < 0)
                    valueData.minSpaceCorrection = true;
                if (valueData.max > 0)
                    valueData.maxSpaceCorrection = true
            }
        }
        function addRangeSeriesLabelPaddings(series) {
            var data = series._rangeData.val;
            if (series.areLabelsVisible() && series._options.label.visible && series._options.label.position !== "inside")
                data.minSpaceCorrection = data.maxSpaceCorrection = true
        }
        function calculateRangeData(series, zoomArgs, calcIntervalFunction, maxValueName, minValueName) {
            var valueData = series._rangeData.val,
                isRangeSeries = !!maxValueName && !!minValueName,
                isDiscrete = series.argumentAxisType === DISCRETE;
            if (zoomArgs && _isDefined(zoomArgs.minArg) && _isDefined(zoomArgs.maxArg)) {
                if (!isDiscrete) {
                    valueData[MIN_VISIBLE] = zoomArgs.minVal;
                    valueData[MAX_VISIBLE] = zoomArgs.maxVal
                }
                _processZoomArgument(series, zoomArgs, isDiscrete);
                if (isRangeSeries)
                    _processZoomRangeValue(series, zoomArgs, maxValueName, minValueName);
                else
                    _processZoomValue(series, zoomArgs)
            }
            else if (!zoomArgs && calcIntervalFunction)
                _processNewInterval(series, calcIntervalFunction);
            _fillRangeData(series)
        }
        viz.series.helpers.rangeDataCalculator = {
            processRange: processRange,
            calculateRangeData: calculateRangeData,
            addLabelPaddings: addLabelPaddings,
            addRangeSeriesLabelPaddings: addRangeSeriesLabelPaddings,
            processFullStackedRange: processFullStackedRange,
            calculateRangeMinValue: calculateRangeMinValue,
            processTwoValues: processTwoValues
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file scatterSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            series = viz.series,
            rangeCalculator = series.helpers.rangeDataCalculator,
            chartSeries = series.mixins.chart,
            _each = $.each,
            _extend = $.extend,
            _noop = $.noop,
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _isString = commonUtils.isString,
            _map = viz.utils.map,
            _normalizeEnum = viz.utils.normalizeEnum,
            math = Math,
            _floor = math.floor,
            _abs = math.abs,
            _sqrt = math.sqrt,
            _min = math.min,
            _max = math.max,
            DEFAULT_SYMBOL_POINT_SIZE = 2,
            DEFAULT_TRACKER_WIDTH = 12,
            DEFAULT_DURATION = 400,
            HIGH_ERROR = "highError",
            LOW_ERROR = "lowError",
            ORIGINAL = "original",
            VARIANCE = "variance",
            STANDARD_DEVIATION = "stddeviation",
            STANDARD_ERROR = "stderror",
            PERCENT = "percent",
            FIXED = "fixed",
            UNDEFINED = "undefined",
            DISCRETE = "discrete",
            LOGARITHMIC = "logarithmic",
            DATETIME = "datetime";
        function sum(array) {
            var summa = 0;
            _each(array, function(_, value) {
                summa += value
            });
            return summa
        }
        function isErrorBarTypeCorrect(type) {
            return $.inArray(type, [FIXED, PERCENT, VARIANCE, STANDARD_DEVIATION, STANDARD_ERROR]) !== -1
        }
        function variance(array, expectedValue) {
            return sum(_map(array, function(value) {
                    return (value - expectedValue) * (value - expectedValue)
                })) / array.length
        }
        var baseScatterMethods = {
                _defaultDuration: DEFAULT_DURATION,
                _defaultTrackerWidth: DEFAULT_TRACKER_WIDTH,
                _applyStyle: _noop,
                _updateOptions: _noop,
                _parseStyle: _noop,
                _prepareSegment: _noop,
                _drawSegment: _noop,
                _generateDefaultSegments: _noop,
                _prepareSeriesToDrawing: function() {
                    var that = this;
                    that._deleteOldAnimationMethods();
                    that._disposePoints(that._oldPoints);
                    that._oldPoints = null
                },
                _createLegendState: function(styleOptions, defaultColor) {
                    return {
                            fill: styleOptions.color || defaultColor,
                            hatching: styleOptions.hatching
                        }
                },
                updateTeamplateFieldNames: function() {
                    var that = this,
                        options = that._options;
                    options.valueField = that.getValueFields()[0] + that.name;
                    options.tagField = that.getTagField() + that.name
                },
                _applyElementsClipRect: function(settings) {
                    settings.clipId = this._paneClipRectID
                },
                _applyMarkerClipRect: function(settings) {
                    settings.clipId = this._forceClipping ? this._paneClipRectID : null
                },
                _createGroup: function(groupName, parent, target, settings) {
                    var group = parent[groupName] = parent[groupName] || this._renderer.g();
                    target && group.append(target);
                    settings && group.attr(settings)
                },
                _applyClearingSettings: function(settings) {
                    settings.opacity = null;
                    settings.scale = null;
                    if (this._options.rotated)
                        settings.translateX = null;
                    else
                        settings.translateY = null
                },
                _createGroups: function() {
                    var that = this;
                    that._createGroup("_markersGroup", that, that._group);
                    that._createGroup("_labelsGroup", that)
                },
                _setMarkerGroupSettings: function() {
                    var that = this,
                        settings = that._createPointStyles(that._getMarkerGroupOptions()).normal;
                    settings["class"] = "dxc-markers";
                    settings.opacity = 1;
                    that._applyMarkerClipRect(settings);
                    that._markersGroup.attr(settings)
                },
                _applyVisibleArea: function() {
                    var that = this,
                        visibleX = that.translators.x.getCanvasVisibleArea(),
                        visibleY = that.translators.y.getCanvasVisibleArea();
                    that._visibleArea = {
                        minX: visibleX.min,
                        maxX: visibleX.max,
                        minY: visibleY.min,
                        maxY: visibleY.max
                    }
                },
                areErrorBarsVisible: function() {
                    var errorBarOptions = this._options.valueErrorBar;
                    return errorBarOptions && this._errorBarsEnabled() && errorBarOptions.displayMode !== "none" && (isErrorBarTypeCorrect(_normalizeEnum(errorBarOptions.type)) || _isDefined(errorBarOptions.lowValueField) || _isDefined(errorBarOptions.highValueField))
                },
                _createErrorBarGroup: function(animationEnabled) {
                    var that = this,
                        errorBarOptions = that._options.valueErrorBar,
                        settings;
                    if (that.areErrorBarsVisible()) {
                        settings = {
                            "class": "dxc-error-bars",
                            stroke: errorBarOptions.color,
                            'stroke-width': errorBarOptions.lineWidth,
                            opacity: animationEnabled ? 0.001 : errorBarOptions.opacity || 1,
                            "stroke-linecap": "square",
                            sharp: true,
                            clipId: that._forceClipping ? that._paneClipRectID : that._widePaneClipRectID
                        };
                        that._createGroup("_errorBarGroup", that, that._group, settings)
                    }
                },
                _setGroupsSettings: function(animationEnabled) {
                    var that = this;
                    that._setMarkerGroupSettings();
                    that._setLabelGroupSettings(animationEnabled);
                    that._createErrorBarGroup(animationEnabled)
                },
                _getCreatingPointOptions: function() {
                    var that = this,
                        defaultPointOptions,
                        creatingPointOptions = that._predefinedPointOptions,
                        normalStyle;
                    if (!creatingPointOptions) {
                        defaultPointOptions = that._getPointOptions();
                        that._predefinedPointOptions = creatingPointOptions = _extend(true, {styles: {}}, defaultPointOptions);
                        normalStyle = defaultPointOptions.styles && defaultPointOptions.styles.normal || {};
                        creatingPointOptions.styles = creatingPointOptions.styles || {};
                        creatingPointOptions.styles.normal = {
                            "stroke-width": normalStyle["stroke-width"],
                            r: normalStyle.r,
                            opacity: normalStyle.opacity
                        }
                    }
                    return creatingPointOptions
                },
                _getSpecialColor: function(mainSeriesColor) {
                    return mainSeriesColor
                },
                _getPointOptions: function() {
                    return this._parsePointOptions(this._preparePointOptions(), this._options.label)
                },
                _getOptionsForPoint: function() {
                    return this._options.point
                },
                _parsePointStyle: function(style, defaultColor, defaultBorderColor) {
                    var border = style.border || {};
                    return {
                            fill: style.color || defaultColor,
                            stroke: border.color || defaultBorderColor,
                            "stroke-width": border.visible ? border.width : 0,
                            r: style.size / 2 + (border.visible && style.size !== 0 ? ~~(border.width / 2) || 0 : 0)
                        }
                },
                _createPointStyles: function(pointOptions) {
                    var that = this,
                        mainPointColor = pointOptions.color || that._options.mainSeriesColor,
                        containerColor = that._options.containerBackgroundColor,
                        normalStyle = that._parsePointStyle(pointOptions, mainPointColor, mainPointColor);
                    normalStyle.visibility = pointOptions.visible ? "visible" : "hidden";
                    return {
                            normal: normalStyle,
                            hover: that._parsePointStyle(pointOptions.hoverStyle, containerColor, mainPointColor),
                            selection: that._parsePointStyle(pointOptions.selectionStyle, containerColor, mainPointColor)
                        }
                },
                _checkData: function(data) {
                    return _isDefined(data.argument) && data.value !== undefined
                },
                getErrorBarRangeCorrector: function() {
                    var mode,
                        func;
                    if (this.areErrorBarsVisible()) {
                        mode = _normalizeEnum(this._options.valueErrorBar.displayMode);
                        func = function(point) {
                            var lowError = point.lowError,
                                highError = point.highError;
                            switch (mode) {
                                case"low":
                                    return [lowError];
                                case"high":
                                    return [highError];
                                case"none":
                                    return [];
                                default:
                                    return [lowError, highError]
                            }
                        }
                    }
                    return func
                },
                _processRange: function(point, prevPoint, errorBarCorrector) {
                    rangeCalculator.processRange(this, point, prevPoint, errorBarCorrector)
                },
                _getRangeData: function(zoomArgs, calcIntervalFunction) {
                    rangeCalculator.calculateRangeData(this, zoomArgs, calcIntervalFunction);
                    rangeCalculator.addLabelPaddings(this);
                    return this._rangeData
                },
                _getPointData: function(data, options) {
                    var pointData = {
                            value: data[options.valueField || "val"],
                            argument: data[options.argumentField || "arg"],
                            tag: data[options.tagField || "tag"]
                        };
                    this._fillErrorBars(data, pointData, options);
                    return pointData
                },
                _errorBarsEnabled: function() {
                    return this.valueAxisType !== DISCRETE && this.valueAxisType !== LOGARITHMIC && this.valueType !== DATETIME
                },
                _fillErrorBars: function(data, pointData, options) {
                    var errorBars = options.valueErrorBar;
                    if (this.areErrorBarsVisible()) {
                        pointData.lowError = data[errorBars.lowValueField || LOW_ERROR];
                        pointData.highError = data[errorBars.highValueField || HIGH_ERROR]
                    }
                },
                _drawPoint: function(options) {
                    var point = options.point;
                    if (point.isInVisibleArea()) {
                        point.clearVisibility();
                        point.draw(this._renderer, options.groups, options.hasAnimation, options.firstDrawing);
                        this._drawedPoints.push(point)
                    }
                    else
                        point.setInvisibility()
                },
                _clearingAnimation: function(translators, drawComplete) {
                    var that = this,
                        params = {opacity: 0.001},
                        options = {
                            duration: that._defaultDuration,
                            partitionDuration: 0.5
                        };
                    that._labelsGroup && that._labelsGroup.animate(params, options, function() {
                        that._markersGroup && that._markersGroup.animate(params, options, drawComplete)
                    })
                },
                _animateComplete: function() {
                    var that = this,
                        animationSettings = {duration: that._defaultDuration};
                    that._labelsGroup && that._labelsGroup.animate({opacity: 1}, animationSettings);
                    that._errorBarGroup && that._errorBarGroup.animate({opacity: that._options.valueErrorBar.opacity || 1}, animationSettings)
                },
                _animate: function() {
                    var that = this,
                        lastPointIndex = that._drawedPoints.length - 1;
                    _each(that._drawedPoints || [], function(i, p) {
                        p.animate(i === lastPointIndex ? function() {
                            that._animateComplete()
                        } : undefined, {
                            translateX: p.x,
                            translateY: p.y
                        })
                    })
                },
                _getPointSize: function() {
                    return this._options.point.visible ? this._options.point.size : DEFAULT_SYMBOL_POINT_SIZE
                },
                _calcMedianValue: function(fusionPoints, valueField) {
                    var result,
                        allValue = _map(fusionPoints, function(point) {
                            return _isDefined(point[valueField]) ? point[valueField] : null
                        });
                    allValue.sort(function(a, b) {
                        return a - b
                    });
                    result = allValue[_floor(allValue.length / 2)];
                    return _isDefined(result) ? result : null
                },
                _calcErrorBarValues: function(fusionPoints) {
                    if (!fusionPoints.length)
                        return {};
                    var lowValue = fusionPoints[0].lowError,
                        highValue = fusionPoints[0].highError,
                        i = 1,
                        length = fusionPoints.length,
                        lowError,
                        highError;
                    for (i; i < length; i++) {
                        lowError = fusionPoints[i].lowError;
                        highError = fusionPoints[i].highError;
                        if (_isDefined(lowError) && _isDefined(highError)) {
                            lowValue = _min(lowError, lowValue);
                            highValue = _max(highError, highValue)
                        }
                    }
                    return {
                            low: lowValue,
                            high: highValue
                        }
                },
                _fusionPoints: function(fusionPoints, tick, index) {
                    var errorBarValues = this._calcErrorBarValues(fusionPoints);
                    return {
                            value: this._calcMedianValue(fusionPoints, "value"),
                            argument: tick,
                            tag: null,
                            index: index,
                            seriesName: this.name,
                            lowError: errorBarValues.low,
                            highError: errorBarValues.high
                        }
                },
                _endUpdateData: function() {
                    delete this._predefinedPointOptions
                },
                getArgumentField: function() {
                    return this._options.argumentField || "arg"
                },
                getValueFields: function() {
                    var options = this._options,
                        errorBarsOptions = options.valueErrorBar,
                        valueFields = [options.valueField || "val"],
                        lowValueField,
                        highValueField;
                    if (errorBarsOptions) {
                        lowValueField = errorBarsOptions.lowValueField;
                        highValueField = errorBarsOptions.highValueField;
                        _isString(lowValueField) && valueFields.push(lowValueField);
                        _isString(highValueField) && valueFields.push(highValueField)
                    }
                    return valueFields
                },
                _calculateErrorBars: function(data) {
                    if (!this.areErrorBarsVisible())
                        return;
                    var that = this,
                        options = that._options,
                        errorBarsOptions = options.valueErrorBar,
                        errorBarType = _normalizeEnum(errorBarsOptions.type),
                        floatErrorValue = parseFloat(errorBarsOptions.value),
                        valueField = that.getValueFields()[0],
                        value,
                        lowValueField = errorBarsOptions.lowValueField || LOW_ERROR,
                        highValueField = errorBarsOptions.highValueField || HIGH_ERROR,
                        valueArray,
                        valueArrayLength,
                        meanValue,
                        processDataItem,
                        addSubError = function(_i, item) {
                            value = item[valueField];
                            item[lowValueField] = value - floatErrorValue;
                            item[highValueField] = value + floatErrorValue
                        };
                    switch (errorBarType) {
                        case FIXED:
                            processDataItem = addSubError;
                            break;
                        case PERCENT:
                            processDataItem = function(_, item) {
                                value = item[valueField];
                                var error = value * floatErrorValue / 100;
                                item[lowValueField] = value - error;
                                item[highValueField] = value + error
                            };
                            break;
                        case UNDEFINED:
                            processDataItem = function(_, item) {
                                item[lowValueField] = item[ORIGINAL + lowValueField];
                                item[highValueField] = item[ORIGINAL + highValueField]
                            };
                            break;
                        default:
                            valueArray = _map(data, function(item) {
                                return _isDefined(item[valueField]) ? item[valueField] : null
                            });
                            valueArrayLength = valueArray.length;
                            floatErrorValue = floatErrorValue || 1;
                            switch (errorBarType) {
                                case VARIANCE:
                                    floatErrorValue = variance(valueArray, sum(valueArray) / valueArrayLength) * floatErrorValue;
                                    processDataItem = addSubError;
                                    break;
                                case STANDARD_DEVIATION:
                                    meanValue = sum(valueArray) / valueArrayLength;
                                    floatErrorValue = _sqrt(variance(valueArray, meanValue)) * floatErrorValue;
                                    processDataItem = function(_, item) {
                                        item[lowValueField] = meanValue - floatErrorValue;
                                        item[highValueField] = meanValue + floatErrorValue
                                    };
                                    break;
                                case STANDARD_ERROR:
                                    floatErrorValue = _sqrt(variance(valueArray, sum(valueArray) / valueArrayLength) / valueArrayLength) * floatErrorValue;
                                    processDataItem = addSubError;
                                    break
                            }
                    }
                    processDataItem && _each(data, processDataItem)
                },
                _beginUpdateData: function(data) {
                    this._calculateErrorBars(data)
                }
            };
        chartSeries.scatter = _extend({}, baseScatterMethods, {
            drawTrackers: function() {
                var that = this,
                    trackers,
                    trackersGroup,
                    segments = that._segments || [],
                    rotated = that._options.rotated,
                    cat = [];
                if (!that.isVisible())
                    return;
                if (segments.length) {
                    trackers = that._trackers = that._trackers || [];
                    trackersGroup = that._trackersGroup = (that._trackersGroup || that._renderer.g().attr({
                        fill: "gray",
                        opacity: 0.001,
                        stroke: "gray",
                        "class": "dxc-trackers"
                    })).attr({clipId: this._paneClipRectID || null}).append(that._group);
                    _each(segments, function(i, segment) {
                        if (!trackers[i])
                            trackers[i] = that._drawTrackerElement(segment).data({"chart-data-series": that}).append(trackersGroup);
                        else
                            that._updateTrackerElement(segment, trackers[i])
                    })
                }
                that._trackersTranslator = cat;
                _each(that.getVisiblePoints(), function(_, p) {
                    var pointCoord = parseInt(rotated ? p.vy : p.vx);
                    if (!cat[pointCoord])
                        cat[pointCoord] = p;
                    else
                        $.isArray(cat[pointCoord]) ? cat[pointCoord].push(p) : cat[pointCoord] = [cat[pointCoord], p]
                })
            },
            getNeighborPoint: function(x, y) {
                var pCoord = this._options.rotated ? y : x,
                    nCoord = pCoord,
                    cat = this._trackersTranslator,
                    point = null,
                    minDistance,
                    oppositeCoord = this._options.rotated ? x : y,
                    opositeCoordName = this._options.rotated ? "vx" : "vy";
                if (this.isVisible() && cat) {
                    point = cat[pCoord];
                    do {
                        point = cat[nCoord] || cat[pCoord];
                        pCoord--;
                        nCoord++
                    } while ((pCoord >= 0 || nCoord < cat.length) && !point);
                    if ($.isArray(point)) {
                        minDistance = _abs(point[0][opositeCoordName] - oppositeCoord);
                        _each(point, function(i, p) {
                            var distance = _abs(p[opositeCoordName] - oppositeCoord);
                            if (minDistance >= distance) {
                                minDistance = distance;
                                point = p
                            }
                        })
                    }
                }
                return point
            }
        });
        series.mixins.polar.scatter = _extend({}, baseScatterMethods, {
            drawTrackers: function() {
                chartSeries.scatter.drawTrackers.call(this);
                var cat = this._trackersTranslator,
                    index;
                if (!this.isVisible())
                    return;
                _each(cat, function(i, category) {
                    if (category) {
                        index = i;
                        return false
                    }
                });
                cat[index + 360] = cat[index]
            },
            getNeighborPoint: function(x, y) {
                var pos = this.translators.untranslate(x, y);
                return chartSeries.scatter.getNeighborPoint.call(this, pos.phi, pos.r)
            },
            _applyVisibleArea: function() {
                var that = this,
                    canvas = that.translators.canvas;
                that._visibleArea = {
                    minX: canvas.left,
                    maxX: canvas.width - canvas.right,
                    minY: canvas.top,
                    maxY: canvas.height - canvas.bottom
                }
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file lineSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            series = viz.series,
            chartSeries = series.mixins.chart,
            polarSeries = series.mixins.polar,
            objectUtils = DX.require("/utils/utils.object"),
            scatterSeries = chartSeries.scatter,
            mathUtils = DX.require("/utils/utils.math"),
            normalizeAngle = mathUtils.normalizeAngle,
            CANVAS_POSITION_START = "canvas_position_start",
            CANVAS_POSITION_TOP = "canvas_position_top",
            DISCRETE = "discrete",
            _map = viz.utils.map,
            _extend = $.extend,
            _each = $.each;
        function clonePoint(point, newX, newY, newAngle) {
            var p = objectUtils.clone(point);
            p.x = newX;
            p.y = newY;
            p.angle = newAngle;
            return p
        }
        function getTangentPoint(point, prevPoint, centerPoint, tan, nextStepAngle) {
            var currectAngle = point.angle + nextStepAngle,
                cossin = mathUtils.getCosAndSin(currectAngle),
                x = centerPoint.x + (point.radius + tan * nextStepAngle) * cossin.cos,
                y = centerPoint.y - (point.radius + tan * nextStepAngle) * cossin.sin;
            return clonePoint(prevPoint, x, y, currectAngle)
        }
        var lineMethods = {
                _applyGroupSettings: function(style, settings, group) {
                    var that = this;
                    settings = _extend(settings, style);
                    that._applyElementsClipRect(settings);
                    group.attr(settings)
                },
                _setGroupsSettings: function(animationEnabled) {
                    var that = this,
                        style = that._styles.normal;
                    that._applyGroupSettings(style.elements, {"class": "dxc-elements"}, that._elementsGroup);
                    that._bordersGroup && that._applyGroupSettings(style.border, {"class": "dxc-borders"}, that._bordersGroup);
                    scatterSeries._setGroupsSettings.call(that, animationEnabled);
                    animationEnabled && that._markersGroup && that._markersGroup.attr({opacity: 0.001})
                },
                _createGroups: function() {
                    var that = this;
                    that._createGroup("_elementsGroup", that, that._group);
                    that._areBordersVisible() && that._createGroup("_bordersGroup", that, that._group);
                    scatterSeries._createGroups.call(that)
                },
                _areBordersVisible: function() {
                    return false
                },
                _getDefaultSegment: function(segment) {
                    return {line: _map(segment.line || [], function(pt) {
                                return pt.getDefaultCoords()
                            })}
                },
                _prepareSegment: function(points) {
                    return {line: points}
                },
                _parseLineOptions: function(options, defaultColor) {
                    return {
                            stroke: options.color || defaultColor,
                            "stroke-width": options.width,
                            dashStyle: options.dashStyle || 'solid'
                        }
                },
                _parseStyle: function(options, defaultColor) {
                    return {elements: this._parseLineOptions(options, defaultColor)}
                },
                _applyStyle: function(style) {
                    var that = this;
                    that._elementsGroup && that._elementsGroup.attr(style.elements);
                    _each(that._graphics || [], function(_, graphic) {
                        graphic.line && graphic.line.attr({'stroke-width': style.elements["stroke-width"]}).sharp()
                    })
                },
                _drawElement: function(segment, group) {
                    return {line: this._createMainElement(segment.line, {"stroke-width": this._styles.normal.elements["stroke-width"]}).append(group)}
                },
                _removeElement: function(element) {
                    element.line.remove()
                },
                _generateDefaultSegments: function() {
                    var that = this;
                    return _map(that._segments || [], function(segment) {
                            return that._getDefaultSegment(segment)
                        })
                },
                _updateElement: function(element, segment, animate, animateParams, complete) {
                    var params = {points: segment.line},
                        lineElement = element.line;
                    animate ? lineElement.animate(params, animateParams, complete) : lineElement.attr(params)
                },
                _clearingAnimation: function(translator, drawComplete) {
                    var that = this,
                        lastIndex = that._graphics.length - 1,
                        settings = {opacity: 0.001},
                        options = {
                            duration: that._defaultDuration,
                            partitionDuration: 0.5
                        };
                    that._labelsGroup && that._labelsGroup.animate(settings, options, function() {
                        that._markersGroup && that._markersGroup.animate(settings, options, function() {
                            _each(that._defaultSegments || [], function(i, segment) {
                                that._oldUpdateElement(that._graphics[i], segment, true, {partitionDuration: 0.5}, i === lastIndex ? drawComplete : undefined)
                            })
                        })
                    })
                },
                _animateComplete: function() {
                    var that = this;
                    scatterSeries._animateComplete.call(this);
                    that._markersGroup && that._markersGroup.animate({opacity: 1}, {duration: that._defaultDuration})
                },
                _animate: function() {
                    var that = this,
                        lastIndex = that._graphics.length - 1;
                    _each(that._graphics || [], function(i, elem) {
                        that._updateElement(elem, that._segments[i], true, {complete: i === lastIndex ? function() {
                                that._animateComplete()
                            } : undefined})
                    })
                },
                _drawPoint: function(options) {
                    scatterSeries._drawPoint.call(this, {
                        point: options.point,
                        groups: options.groups
                    })
                },
                _createMainElement: function(points, settings) {
                    return this._renderer.path(points, "line").attr(settings).sharp()
                },
                _drawSegment: function(points, animationEnabled, segmentCount, lastSegment) {
                    var that = this,
                        segment = that._prepareSegment(points, that._options.rotated, lastSegment);
                    that._segments.push(segment);
                    if (!that._graphics[segmentCount])
                        that._graphics[segmentCount] = that._drawElement(animationEnabled ? that._getDefaultSegment(segment) : segment, that._elementsGroup);
                    else if (!animationEnabled)
                        that._updateElement(that._graphics[segmentCount], segment)
                },
                _getTrackerSettings: function() {
                    var that = this,
                        defaultTrackerWidth = that._defaultTrackerWidth,
                        strokeWidthFromElements = that._styles.normal.elements["stroke-width"];
                    return {
                            "stroke-width": strokeWidthFromElements > defaultTrackerWidth ? strokeWidthFromElements : defaultTrackerWidth,
                            fill: "none"
                        }
                },
                _getMainPointsFromSegment: function(segment) {
                    return segment.line
                },
                _drawTrackerElement: function(segment) {
                    return this._createMainElement(this._getMainPointsFromSegment(segment), this._getTrackerSettings(segment))
                },
                _updateTrackerElement: function(segment, element) {
                    var settings = this._getTrackerSettings(segment);
                    settings.points = this._getMainPointsFromSegment(segment);
                    element.attr(settings)
                }
            };
        chartSeries.line = _extend({}, scatterSeries, lineMethods);
        chartSeries.stepline = _extend({}, chartSeries.line, {
            _calculateStepLinePoints: function(points) {
                var segment = [];
                _each(points, function(i, pt) {
                    var stepY,
                        point;
                    if (!i) {
                        segment.push(pt);
                        return
                    }
                    stepY = segment[segment.length - 1].y;
                    if (stepY !== pt.y) {
                        point = objectUtils.clone(pt);
                        point.y = stepY;
                        segment.push(point)
                    }
                    segment.push(pt)
                });
                return segment
            },
            _prepareSegment: function(points) {
                return chartSeries.line._prepareSegment(this._calculateStepLinePoints(points))
            }
        });
        chartSeries.spline = _extend({}, chartSeries.line, {
            _calculateBezierPoints: function(src, rotated) {
                var bezierPoints = [],
                    pointsCopy = src,
                    checkExtr = function(otherPointCoord, pointCoord, controlCoord) {
                        return otherPointCoord > pointCoord && controlCoord > otherPointCoord || otherPointCoord < pointCoord && controlCoord < otherPointCoord ? otherPointCoord : controlCoord
                    };
                if (pointsCopy.length !== 1)
                    _each(pointsCopy, function(i, curPoint) {
                        var leftControlX,
                            leftControlY,
                            rightControlX,
                            rightControlY,
                            prevPoint,
                            nextPoint,
                            xCur,
                            yCur,
                            x1,
                            x2,
                            y1,
                            y2,
                            lambda = 0.5,
                            curIsExtremum,
                            leftPoint,
                            rightPoint,
                            a,
                            b,
                            c,
                            xc,
                            yc,
                            shift;
                        if (!i) {
                            bezierPoints.push(curPoint);
                            bezierPoints.push(curPoint);
                            return
                        }
                        prevPoint = pointsCopy[i - 1];
                        if (i < pointsCopy.length - 1) {
                            nextPoint = pointsCopy[i + 1];
                            xCur = curPoint.x;
                            yCur = curPoint.y;
                            x1 = prevPoint.x;
                            x2 = nextPoint.x;
                            y1 = prevPoint.y;
                            y2 = nextPoint.y;
                            curIsExtremum = !!(!rotated && (yCur <= prevPoint.y && yCur <= nextPoint.y || yCur >= prevPoint.y && yCur >= nextPoint.y) || rotated && (xCur <= prevPoint.x && xCur <= nextPoint.x || xCur >= prevPoint.x && xCur >= nextPoint.x));
                            if (curIsExtremum)
                                if (!rotated) {
                                    rightControlY = leftControlY = yCur;
                                    rightControlX = (xCur + nextPoint.x) / 2;
                                    leftControlX = (xCur + prevPoint.x) / 2
                                }
                                else {
                                    rightControlX = leftControlX = xCur;
                                    rightControlY = (yCur + nextPoint.y) / 2;
                                    leftControlY = (yCur + prevPoint.y) / 2
                                }
                            else {
                                a = y2 - y1;
                                b = x1 - x2;
                                c = y1 * x2 - x1 * y2;
                                if (!rotated) {
                                    xc = xCur;
                                    yc = -1 * (a * xc + c) / b;
                                    shift = yc - yCur || 0;
                                    y1 -= shift;
                                    y2 -= shift
                                }
                                else {
                                    yc = yCur;
                                    xc = -1 * (b * yc + c) / a;
                                    shift = xc - xCur || 0;
                                    x1 -= shift;
                                    x2 -= shift
                                }
                                rightControlX = (xCur + lambda * x2) / (1 + lambda);
                                rightControlY = (yCur + lambda * y2) / (1 + lambda);
                                leftControlX = (xCur + lambda * x1) / (1 + lambda);
                                leftControlY = (yCur + lambda * y1) / (1 + lambda)
                            }
                            if (!rotated) {
                                leftControlY = checkExtr(prevPoint.y, yCur, leftControlY);
                                rightControlY = checkExtr(nextPoint.y, yCur, rightControlY)
                            }
                            else {
                                leftControlX = checkExtr(prevPoint.x, xCur, leftControlX);
                                rightControlX = checkExtr(nextPoint.x, xCur, rightControlX)
                            }
                            leftPoint = clonePoint(curPoint, leftControlX, leftControlY);
                            rightPoint = clonePoint(curPoint, rightControlX, rightControlY);
                            bezierPoints.push(leftPoint, curPoint, rightPoint)
                        }
                        else {
                            bezierPoints.push(curPoint, curPoint);
                            return
                        }
                    });
                else
                    bezierPoints.push(pointsCopy[0]);
                return bezierPoints
            },
            _prepareSegment: function(points, rotated) {
                return chartSeries.line._prepareSegment(this._calculateBezierPoints(points, rotated))
            },
            _createMainElement: function(points, settings) {
                return this._renderer.path(points, "bezier").attr(settings).sharp()
            }
        });
        polarSeries.line = _extend({}, polarSeries.scatter, lineMethods, {
            _prepareSegment: function(points, rotated, lastSegment) {
                var preparedPoints = [],
                    centerPoint = this.translators.translate(CANVAS_POSITION_START, CANVAS_POSITION_TOP),
                    i;
                lastSegment && this._closeSegment(points);
                if (this.argumentAxisType !== DISCRETE && this.valueAxisType !== DISCRETE) {
                    for (i = 1; i < points.length; i++)
                        preparedPoints = preparedPoints.concat(this._getTangentPoints(points[i], points[i - 1], centerPoint));
                    if (!preparedPoints.length)
                        preparedPoints = points
                }
                else
                    return chartSeries.line._prepareSegment.apply(this, arguments);
                return {line: preparedPoints}
            },
            _getRemainingAngle: function(angle) {
                var normAngle = normalizeAngle(angle);
                return angle >= 0 ? 360 - normAngle : -normAngle
            },
            _closeSegment: function(points) {
                var point,
                    differenceAngle;
                if (this._segments.length)
                    point = this._segments[0].line[0];
                else
                    point = clonePoint(points[0], points[0].x, points[0].y, points[0].angle);
                if (points[points.length - 1].angle !== point.angle) {
                    if (normalizeAngle(Math.round(points[points.length - 1].angle)) === normalizeAngle(Math.round(point.angle)))
                        point.angle = points[points.length - 1].angle;
                    else {
                        differenceAngle = points[points.length - 1].angle - point.angle;
                        point.angle = points[points.length - 1].angle + this._getRemainingAngle(differenceAngle)
                    }
                    points.push(point)
                }
            },
            _getTangentPoints: function(point, prevPoint, centerPoint) {
                var tangentPoints = [],
                    betweenAngle = Math.round(prevPoint.angle - point.angle),
                    tan = (prevPoint.radius - point.radius) / betweenAngle,
                    i;
                if (betweenAngle === 0)
                    tangentPoints = [prevPoint, point];
                else if (betweenAngle > 0)
                    for (i = betweenAngle; i >= 0; i--)
                        tangentPoints.push(getTangentPoint(point, prevPoint, centerPoint, tan, i));
                else
                    for (i = 0; i >= betweenAngle; i--)
                        tangentPoints.push(getTangentPoint(point, prevPoint, centerPoint, tan, betweenAngle - i));
                return tangentPoints
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file areaSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            objectUtils = DX.require("/utils/utils.object"),
            commonUtils = DX.require("/utils/utils.common"),
            Color = DX.require("/color"),
            series = viz.series,
            chartSeries = series.mixins.chart,
            polarSeries = series.mixins.polar,
            lineSeries = chartSeries.line,
            rangeCalculator = viz.series.helpers.rangeDataCalculator,
            _map = viz.utils.map,
            _extend = $.extend,
            HOVER_COLOR_HIGHLIGHTING = 20;
        var baseAreaMethods = {
                _createBorderElement: lineSeries._createMainElement,
                _createLegendState: function(styleOptions, defaultColor) {
                    var legendState = chartSeries.scatter._createLegendState.call(this, styleOptions, defaultColor);
                    legendState.opacity = styleOptions.opacity;
                    return legendState
                },
                _getSpecialColor: function(color) {
                    return this._options._IE8 ? new Color(color).highlight(HOVER_COLOR_HIGHLIGHTING) : color
                },
                _getRangeData: function(zoomArgs, calcIntervalFunction) {
                    rangeCalculator.calculateRangeData(this, zoomArgs, calcIntervalFunction);
                    rangeCalculator.addLabelPaddings(this);
                    rangeCalculator.calculateRangeMinValue(this, zoomArgs);
                    return this._rangeData
                },
                _getDefaultSegment: function(segment) {
                    var defaultSegment = lineSeries._getDefaultSegment(segment);
                    defaultSegment.area = defaultSegment.line.concat(defaultSegment.line.slice().reverse());
                    return defaultSegment
                },
                _updateElement: function(element, segment, animate, animateParams, complete) {
                    var lineParams = {points: segment.line},
                        areaParams = {points: segment.area},
                        borderElement = element.line;
                    if (animate) {
                        borderElement && borderElement.animate(lineParams, animateParams);
                        element.area.animate(areaParams, animateParams, complete)
                    }
                    else {
                        borderElement && borderElement.attr(lineParams);
                        element.area.attr(areaParams)
                    }
                },
                _removeElement: function(element) {
                    element.line && element.line.remove();
                    element.area.remove()
                },
                _drawElement: function(segment) {
                    return {
                            line: this._bordersGroup && this._createBorderElement(segment.line, {"stroke-width": this._styles.normal.border["stroke-width"]}).append(this._bordersGroup),
                            area: this._createMainElement(segment.area).append(this._elementsGroup)
                        }
                },
                _applyStyle: function(style) {
                    var that = this;
                    that._elementsGroup && that._elementsGroup.attr(style.elements);
                    that._bordersGroup && that._bordersGroup.attr(style.border);
                    $.each(that._graphics || [], function(_, graphic) {
                        graphic.line && graphic.line.attr({'stroke-width': style.border["stroke-width"]}).sharp()
                    })
                },
                _createPattern: function(color, hatching) {
                    if (hatching && commonUtils.isObject(hatching)) {
                        var pattern = this._renderer.pattern(color, hatching);
                        this._patterns.push(pattern);
                        return pattern.id
                    }
                    return color
                },
                _parseStyle: function(options, defaultColor, defaultBorderColor) {
                    var borderOptions = options.border || {},
                        borderStyle = lineSeries._parseLineOptions(borderOptions, defaultBorderColor);
                    borderStyle["stroke-width"] = borderOptions.visible ? borderStyle["stroke-width"] : 0;
                    return {
                            border: borderStyle,
                            elements: {
                                stroke: "none",
                                fill: this._createPattern(options.color || defaultColor, options.hatching),
                                opacity: options.opacity
                            }
                        }
                },
                _areBordersVisible: function() {
                    var options = this._options;
                    return options.border.visible || options.hoverStyle.border.visible || options.selectionStyle.border.visible
                },
                _createMainElement: function(points, settings) {
                    return this._renderer.path(points, "area").attr(settings)
                },
                _getTrackerSettings: function(segment) {
                    return {"stroke-width": segment.singlePointSegment ? this._defaultTrackerWidth : 0}
                },
                _getMainPointsFromSegment: function(segment) {
                    return segment.area
                }
            };
        chartSeries.area = _extend({}, lineSeries, baseAreaMethods, {
            _prepareSegment: function(points, rotated) {
                var processedPoints = this._processSinglePointsAreaSegment(points, rotated);
                return {
                        line: processedPoints,
                        area: _map(processedPoints, function(pt) {
                            return pt.getCoords()
                        }).concat(_map(processedPoints.slice().reverse(), function(pt) {
                            return pt.getCoords(true)
                        })),
                        singlePointSegment: processedPoints !== points
                    }
            },
            _processSinglePointsAreaSegment: function(points, rotated) {
                if (points.length === 1) {
                    var p = points[0],
                        p1 = objectUtils.clone(p);
                    p1[rotated ? "y" : "x"] += 1;
                    p1.argument = null;
                    return [p, p1]
                }
                return points
            }
        });
        polarSeries.area = _extend({}, polarSeries.line, baseAreaMethods, {
            _prepareSegment: function(points, rotated, lastSegment) {
                lastSegment && polarSeries.line._closeSegment.call(this, points);
                var preparedPoints = chartSeries.area._prepareSegment.call(this, points);
                return preparedPoints
            },
            _processSinglePointsAreaSegment: function(points) {
                return polarSeries.line._prepareSegment.call(this, points).line
            }
        });
        chartSeries.steparea = _extend({}, chartSeries.area, {_prepareSegment: function(points, rotated) {
                points = chartSeries.area._processSinglePointsAreaSegment(points, rotated);
                return chartSeries.area._prepareSegment.call(this, chartSeries.stepline._calculateStepLinePoints(points))
            }});
        chartSeries.splinearea = _extend({}, chartSeries.area, {
            _areaPointsToSplineAreaPoints: function(areaPoints) {
                var lastFwPoint = areaPoints[areaPoints.length / 2 - 1],
                    firstBwPoint = areaPoints[areaPoints.length / 2];
                areaPoints.splice(areaPoints.length / 2, 0, {
                    x: lastFwPoint.x,
                    y: lastFwPoint.y
                }, {
                    x: firstBwPoint.x,
                    y: firstBwPoint.y
                });
                if (lastFwPoint.defaultCoords)
                    areaPoints[areaPoints.length / 2].defaultCoords = true;
                if (firstBwPoint.defaultCoords)
                    areaPoints[areaPoints.length / 2 - 1].defaultCoords = true
            },
            _prepareSegment: function(points, rotated) {
                var areaSeries = chartSeries.area,
                    processedPoints = areaSeries._processSinglePointsAreaSegment(points, rotated),
                    areaSegment = areaSeries._prepareSegment.call(this, chartSeries.spline._calculateBezierPoints(processedPoints, rotated));
                this._areaPointsToSplineAreaPoints(areaSegment.area);
                areaSegment.singlePointSegment = processedPoints !== points;
                return areaSegment
            },
            _getDefaultSegment: function(segment) {
                var areaDefaultSegment = chartSeries.area._getDefaultSegment(segment);
                this._areaPointsToSplineAreaPoints(areaDefaultSegment.area);
                return areaDefaultSegment
            },
            _createMainElement: function(points, settings) {
                return this._renderer.path(points, "bezierarea").attr(settings)
            },
            _createBorderElement: chartSeries.spline._createMainElement
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file barSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            series = viz.series,
            chartSeries = series.mixins.chart,
            polarSeries = series.mixins.polar,
            scatterSeries = chartSeries.scatter,
            areaSeries = chartSeries.area,
            _extend = $.extend,
            _each = $.each,
            DEFAULT_BAR_POINT_SIZE = 3;
        var baseBarSeriesMethods = {
                _getSpecialColor: areaSeries._getSpecialColor,
                _createPattern: areaSeries._createPattern,
                _updateOptions: function(options) {
                    this._stackName = "axis_" + (options.axis || "default") + "_stack_" + (options.stack || "default")
                },
                _parsePointStyle: function(style, defaultColor, defaultBorderColor) {
                    var color = this._createPattern(style.color || defaultColor, style.hatching),
                        base = scatterSeries._parsePointStyle.call(this, style, color, defaultBorderColor);
                    base.fill = color;
                    base.dashStyle = style.border && style.border.dashStyle || "solid";
                    delete base.r;
                    return base
                },
                _applyMarkerClipRect: function(settings) {
                    settings.clipId = null
                },
                _clearingAnimation: function(translators, drawComplete) {
                    var that = this,
                        settings = that._oldgetAffineCoordOptions(translators) || that._getAffineCoordOptions(translators);
                    that._labelsGroup && that._labelsGroup.animate({opacity: 0.001}, {
                        duration: that._defaultDuration,
                        partitionDuration: 0.5
                    }, function() {
                        that._markersGroup.animate(settings, {partitionDuration: 0.5}, function() {
                            that._markersGroup.attr({
                                scaleX: null,
                                scaleY: null,
                                translateX: 0,
                                translateY: 0
                            });
                            drawComplete()
                        })
                    })
                },
                _setGroupsSettings: function(animationEnabled, firstDrawing) {
                    var that = this,
                        settings = {};
                    scatterSeries._setGroupsSettings.apply(that, arguments);
                    if (animationEnabled && firstDrawing)
                        settings = this._getAffineCoordOptions(that.translators, true);
                    else if (!animationEnabled)
                        settings = {
                            scaleX: 1,
                            scaleY: 1,
                            translateX: 0,
                            translateY: 0
                        };
                    that._markersGroup.attr(settings)
                },
                _drawPoint: function(options) {
                    options.hasAnimation = options.hasAnimation && !options.firstDrawing;
                    options.firstDrawing = false;
                    scatterSeries._drawPoint.call(this, options)
                },
                _getMainColor: function() {
                    return this._options.mainSeriesColor
                },
                _createPointStyles: function(pointOptions) {
                    var that = this,
                        mainColor = pointOptions.color || that._getMainColor(),
                        specialMainColor = that._getSpecialColor(mainColor);
                    return {
                            normal: that._parsePointStyle(pointOptions, mainColor, mainColor),
                            hover: that._parsePointStyle(pointOptions.hoverStyle || {}, specialMainColor, mainColor),
                            selection: that._parsePointStyle(pointOptions.selectionStyle || {}, specialMainColor, mainColor)
                        }
                },
                _updatePointsVisibility: function() {
                    var visibility = this._options.visible;
                    $.each(this._points, function(_, point) {
                        point._options.visible = visibility
                    })
                },
                _getOptionsForPoint: function() {
                    return this._options
                },
                _animate: function(firstDrawing) {
                    var that = this,
                        complete = function() {
                            that._animateComplete()
                        },
                        animateFunc = function(drawedPoints, complete) {
                            var lastPointIndex = drawedPoints.length - 1;
                            _each(drawedPoints || [], function(i, point) {
                                point.animate(i === lastPointIndex ? complete : undefined, point.getMarkerCoords())
                            })
                        };
                    that._animatePoints(firstDrawing, complete, animateFunc)
                },
                _getPointSize: function() {
                    return DEFAULT_BAR_POINT_SIZE
                },
                _beginUpdateData: function(data) {
                    scatterSeries._beginUpdateData.call(this, data);
                    this._deletePatterns()
                }
            };
        chartSeries.bar = _extend({}, scatterSeries, baseBarSeriesMethods, {
            _getAffineCoordOptions: function(translators) {
                var rotated = this._options.rotated,
                    direction = rotated ? "x" : "y",
                    settings = {
                        scaleX: rotated ? 0.001 : 1,
                        scaleY: rotated ? 1 : 0.001
                    };
                settings["translate" + direction.toUpperCase()] = translators[direction].translate("canvas_position_default");
                return settings
            },
            _getRangeData: function() {
                var rangeData = areaSeries._getRangeData.apply(this, arguments);
                rangeData.arg.stick = false;
                return rangeData
            },
            _animatePoints: function(firstDrawing, complete, animateFunc) {
                var that = this;
                that._markersGroup.animate({
                    scaleX: 1,
                    scaleY: 1,
                    translateY: 0,
                    translateX: 0
                }, undefined, complete);
                if (!firstDrawing)
                    animateFunc(that._drawedPoints, complete)
            }
        });
        polarSeries.bar = _extend({}, polarSeries.scatter, baseBarSeriesMethods, {
            _animatePoints: function(firstDrawing, complete, animateFunc) {
                animateFunc(this._drawedPoints, complete)
            },
            _setGroupsSettings: scatterSeries._setGroupsSettings,
            _drawPoint: function(point, groups, animationEnabled) {
                scatterSeries._drawPoint.call(this, point, groups, animationEnabled)
            },
            _parsePointStyle: function(style) {
                var base = baseBarSeriesMethods._parsePointStyle.apply(this, arguments);
                base.opacity = style.opacity;
                return base
            },
            _createGroups: scatterSeries._createGroups,
            _setMarkerGroupSettings: function() {
                var that = this,
                    markersSettings = that._createPointStyles(that._getMarkerGroupOptions()).normal,
                    groupSettings;
                markersSettings["class"] = "dxc-markers";
                that._applyMarkerClipRect(markersSettings);
                groupSettings = _extend({}, markersSettings);
                delete groupSettings.opacity;
                that._markersGroup.attr(groupSettings)
            },
            _createLegendState: areaSeries._createLegendState,
            _getRangeData: areaSeries._getRangeData
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            series = viz.series.mixins.chart,
            commonUtils = DX.require("/utils/utils.common"),
            _extend = $.extend,
            _isDefined = commonUtils.isDefined,
            _map = viz.utils.map,
            _noop = $.noop,
            rangeCalculator = viz.series.helpers.rangeDataCalculator,
            areaSeries = series.area;
        var baseRangeSeries = {
                _beginUpdateData: _noop,
                areErrorBarsVisible: _noop,
                _createErrorBarGroup: _noop,
                _checkData: function(data) {
                    return _isDefined(data.argument) && data.value !== undefined && data.minValue !== undefined
                },
                updateTeamplateFieldNames: function() {
                    var that = this,
                        options = that._options,
                        valueFields = that.getValueFields(),
                        name = that.name;
                    options.rangeValue1Field = valueFields[0] + name;
                    options.rangeValue2Field = valueFields[1] + name;
                    options.tagField = that.getTagField() + name
                },
                _processRange: function(point, prevPoint) {
                    rangeCalculator.processTwoValues(this, point, prevPoint, "value", "minValue")
                },
                _getRangeData: function(zoomArgs, calcIntervalFunction) {
                    rangeCalculator.calculateRangeData(this, zoomArgs, calcIntervalFunction, "value", "minValue");
                    rangeCalculator.addRangeSeriesLabelPaddings(this);
                    return this._rangeData
                },
                _getPointData: function(data, options) {
                    return {
                            tag: data[options.tagField || "tag"],
                            minValue: data[options.rangeValue1Field || "val1"],
                            value: data[options.rangeValue2Field || "val2"],
                            argument: data[options.argumentField || "arg"]
                        }
                },
                _fusionPoints: function(fusionPoints, tick) {
                    var calcMedianValue = series.scatter._calcMedianValue,
                        value = calcMedianValue.call(this, fusionPoints, "value"),
                        minValue = calcMedianValue.call(this, fusionPoints, "minValue");
                    if (value === null || minValue === null)
                        value = minValue = null;
                    return {
                            minValue: minValue,
                            value: value,
                            argument: tick,
                            tag: null
                        }
                },
                getValueFields: function() {
                    return [this._options.rangeValue1Field || "val1", this._options.rangeValue2Field || "val2"]
                }
            };
        series.rangebar = _extend({}, series.bar, baseRangeSeries);
        series.rangearea = _extend({}, areaSeries, {
            _drawPoint: function(options) {
                var point = options.point;
                if (point.isInVisibleArea()) {
                    point.clearVisibility();
                    point.draw(this._renderer, options.groups);
                    this._drawedPoints.push(point);
                    if (!point.visibleTopMarker)
                        point.hideMarker("top");
                    if (!point.visibleBottomMarker)
                        point.hideMarker("bottom")
                }
                else
                    point.setInvisibility()
            },
            _prepareSegment: function(points, rotated) {
                var processedPoints = this._processSinglePointsAreaSegment(points, rotated),
                    processedMinPointsCoords = _map(processedPoints, function(pt) {
                        return pt.getCoords(true)
                    });
                return {
                        line: processedPoints,
                        bottomLine: processedMinPointsCoords,
                        area: _map(processedPoints, function(pt) {
                            return pt.getCoords()
                        }).concat(processedMinPointsCoords.slice().reverse()),
                        singlePointSegment: processedPoints !== points
                    }
            },
            _getDefaultSegment: function(segment) {
                var defaultSegment = areaSeries._getDefaultSegment.call(this, segment);
                defaultSegment.bottomLine = defaultSegment.line;
                return defaultSegment
            },
            _removeElement: function(element) {
                areaSeries._removeElement.call(this, element);
                element.bottomLine && element.bottomLine.remove()
            },
            _drawElement: function(segment, group) {
                var that = this,
                    drawnElement = areaSeries._drawElement.call(that, segment, group);
                drawnElement.bottomLine = that._bordersGroup && that._createBorderElement(segment.bottomLine, {"stroke-width": that._styles.normal.border["stroke-width"]}).append(that._bordersGroup);
                return drawnElement
            },
            _applyStyle: function(style) {
                var that = this,
                    elementsGroup = that._elementsGroup,
                    bordersGroup = that._bordersGroup;
                elementsGroup && elementsGroup.attr(style.elements);
                bordersGroup && bordersGroup.attr(style.border);
                $.each(that._graphics || [], function(_, graphic) {
                    graphic.line && graphic.line.attr({"stroke-width": style.border["stroke-width"]});
                    graphic.bottomLine && graphic.bottomLine.attr({"stroke-width": style.border["stroke-width"]})
                })
            },
            _updateElement: function(element, segment, animate, animateParams, complete) {
                areaSeries._updateElement.call(this, element, segment, animate, animateParams, complete);
                var bottomLineParams = {points: segment.bottomLine},
                    bottomBorderElement = element.bottomLine;
                if (bottomBorderElement)
                    animate ? bottomBorderElement.animate(bottomLineParams, animateParams) : bottomBorderElement.attr(bottomLineParams)
            }
        }, baseRangeSeries)
    })(jQuery, DevExpress);
    /*! Module viz-core, file bubbleSeries.js */
    (function($, DX) {
        var mixins = DX.viz.series.mixins,
            series = mixins.chart,
            scatterSeries = series.scatter,
            barSeries = series.bar,
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _extend = $.extend,
            _each = $.each,
            _noop = $.noop;
        series.bubble = _extend({}, scatterSeries, {
            _fillErrorBars: _noop,
            getErrorBarRangeCorrector: _noop,
            _calculateErrorBars: _noop,
            _getMainColor: barSeries._getMainColor,
            _createPointStyles: barSeries._createPointStyles,
            _createPattern: barSeries._createPattern,
            _updatePointsVisibility: barSeries._updatePointsVisibility,
            _getOptionsForPoint: barSeries._getOptionsForPoint,
            _getSpecialColor: barSeries._getSpecialColor,
            _applyMarkerClipRect: series.line._applyElementsClipRect,
            _parsePointStyle: mixins.polar.bar._parsePointStyle,
            _createLegendState: series.area._createLegendState,
            _setMarkerGroupSettings: mixins.polar.bar._setMarkerGroupSettings,
            areErrorBarsVisible: _noop,
            _createErrorBarGroup: _noop,
            _checkData: function(data) {
                return _isDefined(data.argument) && _isDefined(data.size) && data.value !== undefined
            },
            _getPointData: function(data, options) {
                var pointData = scatterSeries._getPointData.call(this, data, options);
                pointData.size = data[options.sizeField || "size"];
                return pointData
            },
            _fusionPoints: function(fusionPoints, tick) {
                var calcMedianValue = scatterSeries._calcMedianValue;
                return {
                        size: calcMedianValue.call(this, fusionPoints, "size"),
                        value: calcMedianValue.call(this, fusionPoints, "value"),
                        argument: tick,
                        tag: null
                    }
            },
            getValueFields: function() {
                var options = this._options;
                return [options.valueField || "val", options.sizeField || "size"]
            },
            updateTeamplateFieldNames: function() {
                var that = this,
                    options = that._options,
                    valueFields = that.getValueFields(),
                    name = that.name;
                options.valueField = valueFields[0] + name;
                options.sizeField = valueFields[1] + name;
                options.tagField = that.getTagField() + name
            },
            _clearingAnimation: function(translators, drawComplete) {
                var that = this,
                    partitionDuration = 0.5,
                    lastPointIndex = that._drawedPoints.length - 1,
                    labelsGroup = that._labelsGroup;
                labelsGroup && labelsGroup.animate({opacity: 0.001}, {
                    duration: that._defaultDuration,
                    partitionDuration: partitionDuration
                }, function() {
                    _each(that._drawedPoints || [], function(i, p) {
                        p.animate(i === lastPointIndex ? drawComplete : undefined, {r: 0}, partitionDuration)
                    })
                })
            },
            _animate: function() {
                var that = this,
                    lastPointIndex = that._drawedPoints.length - 1,
                    labelsGroup = that._labelsGroup,
                    labelAnimFunc = function() {
                        labelsGroup && labelsGroup.animate({opacity: 1}, {duration: that._defaultDuration})
                    };
                _each(that._drawedPoints || [], function(i, p) {
                    p.animate(i === lastPointIndex ? labelAnimFunc : undefined, {
                        r: p.bubbleSize,
                        translateX: p.x,
                        translateY: p.y
                    })
                })
            },
            _beginUpdateData: barSeries._beginUpdateData
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file pieSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            mixins = viz.series.mixins,
            pieSeries = mixins.pie,
            mathUtils = DX.require("/utils/utils.math"),
            scatterSeries = mixins.chart.scatter,
            barSeries = mixins.chart.bar,
            _extend = $.extend,
            _each = $.each,
            _noop = $.noop,
            _map = viz.utils.map,
            _isFinite = isFinite,
            _max = Math.max;
        pieSeries.pie = _extend({}, barSeries, {
            _setGroupsSettings: scatterSeries._setGroupsSettings,
            _createErrorBarGroup: _noop,
            _drawPoint: function(options) {
                var point = options.point,
                    legendCallback = options.legendCallback;
                scatterSeries._drawPoint.call(this, options);
                !point.isVisible() && point.setInvisibility();
                legendCallback && point.isSelected() && legendCallback(point)("applySelected")
            },
            adjustLabels: function() {
                var that = this,
                    points = that._points || [],
                    maxLabelLength,
                    labelsBBoxes = [];
                _each(points, function(_, point) {
                    if (point._label.isVisible() && point._label.getLayoutOptions().position !== "inside") {
                        point.setLabelEllipsis();
                        point.setLabelTrackerData();
                        labelsBBoxes.push(point._label.getBoundingRect().width)
                    }
                });
                if (labelsBBoxes.length)
                    maxLabelLength = _max.apply(null, labelsBBoxes);
                _each(points, function(_, point) {
                    if (point._label.isVisible() && point._label.getLayoutOptions().position !== "inside") {
                        point._maxLabelLength = maxLabelLength;
                        point.updateLabelCoord()
                    }
                })
            },
            _processRange: _noop,
            _applyElementsClipRect: _noop,
            getColor: _noop,
            areErrorBarsVisible: _noop,
            _prepareSeriesToDrawing: _noop,
            _endUpdateData: function() {
                this._arrayArguments = {};
                scatterSeries._prepareSeriesToDrawing.call(this)
            },
            drawLabelsWOPoints: function(translators) {
                var that = this,
                    options = that._options,
                    points = that._points || [];
                if (options.label.position === "inside")
                    return false;
                that._labelsGroup.append(that._extGroups.labelsGroup);
                _each(points, function(_, point) {
                    point.drawLabel(translators)
                });
                return true
            },
            _getCreatingPointOptions: function(data) {
                return this._getPointOptions(data)
            },
            _updateOptions: function(options) {
                this.labelSpace = 0;
                this.innerRadius = this.type === "pie" ? 0 : options.innerRadius
            },
            _checkData: function(data) {
                var base = barSeries._checkData(data);
                return this._options.paintNullPoints ? base : base && data.value !== null
            },
            _createGroups: scatterSeries._createGroups,
            _setMarkerGroupSettings: function() {
                var that = this;
                that._markersGroup.attr({"class": "dxc-markers"})
            },
            _getMainColor: function(data) {
                var that = this,
                    arr = that._arrayArguments || {},
                    argument = data.argument;
                arr[argument] = ++arr[argument] || 0;
                that._arrayArguments = arr;
                return that._options.mainSeriesColor(argument, arr[argument])
            },
            _getPointOptions: function(data) {
                return this._parsePointOptions(this._preparePointOptions(), this._options.label, data)
            },
            _getRangeData: function() {
                return this._rangeData
            },
            _getArrangeTotal: function(points) {
                var total = 0;
                _each(points, function(_, point) {
                    if (point.isVisible())
                        total += point.initialValue
                });
                return total
            },
            _createPointStyles: function(pointOptions, data) {
                var that = this,
                    mainColor = pointOptions.color || that._getMainColor(data),
                    specialMainColor = that._getSpecialColor(mainColor);
                return {
                        normal: that._parsePointStyle(pointOptions, mainColor, mainColor),
                        hover: that._parsePointStyle(pointOptions.hoverStyle, specialMainColor, mainColor),
                        selection: that._parsePointStyle(pointOptions.selectionStyle, specialMainColor, mainColor),
                        legendStyles: {
                            normal: that._createLegendState(pointOptions, mainColor),
                            hover: that._createLegendState(pointOptions.hoverStyle, specialMainColor),
                            selection: that._createLegendState(pointOptions.selectionStyle, specialMainColor)
                        }
                    }
            },
            _getArrangeMinShownValue: function(points, total) {
                var minSegmentSize = this._options.minSegmentSize,
                    totalMinSegmentSize = 0,
                    totalNotMinValues = 0;
                total = total || points.length;
                _each(points, function(_, point) {
                    if (point.isVisible())
                        if (point.initialValue < minSegmentSize * total / 360)
                            totalMinSegmentSize += minSegmentSize;
                        else
                            totalNotMinValues += point.initialValue
                });
                return totalMinSegmentSize < 360 ? minSegmentSize * totalNotMinValues / (360 - totalMinSegmentSize) : 0
            },
            _applyArrangeCorrection: function(points, minShownValue, total) {
                var options = this._options,
                    isClockWise = options.segmentsDirection !== "anticlockwise",
                    shiftedAngle = _isFinite(options.startAngle) ? mathUtils.normalizeAngle(options.startAngle) : 0,
                    minSegmentSize = options.minSegmentSize,
                    percent,
                    correction = 0,
                    zeroTotalCorrection = 0;
                if (total === 0) {
                    total = points.length;
                    zeroTotalCorrection = 1
                }
                _each(isClockWise ? points : points.concat([]).reverse(), function(_, point) {
                    var val = point.isVisible() ? zeroTotalCorrection || point.initialValue : 0,
                        updatedZeroValue;
                    if (minSegmentSize && point.isVisible() && val < minShownValue)
                        updatedZeroValue = minShownValue;
                    percent = val / total;
                    point.correctValue(correction, percent, zeroTotalCorrection + (updatedZeroValue || 0));
                    point.shiftedAngle = shiftedAngle;
                    correction = correction + (updatedZeroValue || val)
                });
                this._rangeData = {val: {
                        min: 0,
                        max: correction
                    }}
            },
            arrangePoints: function() {
                var that = this,
                    originalPoints = that._originalPoints || [],
                    minSegmentSize = that._options.minSegmentSize,
                    minShownValue,
                    total,
                    isAllPointsNegative = true,
                    points,
                    i = 0,
                    len = originalPoints.length;
                while (i < len && isAllPointsNegative) {
                    isAllPointsNegative = originalPoints[i].value <= 0;
                    i++
                }
                points = that._originalPoints = that._points = _map(originalPoints, function(point) {
                    if (point.value === null || !isAllPointsNegative && point.value < 0) {
                        point.dispose();
                        return null
                    }
                    else
                        return point
                });
                total = that._getArrangeTotal(points);
                if (minSegmentSize)
                    minShownValue = this._getArrangeMinShownValue(points, total);
                that._applyArrangeCorrection(points, minShownValue, total)
            },
            correctPosition: function(correction) {
                var debug = DX.require("/utils/utils.console").debug;
                debug.assert(correction, "correction was not passed");
                debug.assertParam(correction.centerX, "correction.centerX was not passed");
                debug.assertParam(correction.centerY, "correction.centerY was not passed");
                debug.assertParam(correction.radiusInner, "correction.radiusInner was not passed");
                debug.assertParam(correction.radiusOuter, "correction.radiusOuter was not passed");
                debug.assertParam(correction.canvas, "correction.canvas was not passed");
                _each(this._points, function(_, point) {
                    point.correctPosition(correction)
                });
                this.setVisibleArea(correction.canvas)
            },
            correctRadius: function(correction) {
                _each(this._points, function(_, point) {
                    point.correctRadius(correction)
                })
            },
            correctLabelRadius: function(labelRadius) {
                _each(this._points, function(_, point) {
                    point.correctLabelRadius(labelRadius)
                })
            },
            setVisibleArea: function(canvas) {
                this._visibleArea = {
                    minX: canvas.left,
                    maxX: canvas.width - canvas.right,
                    minY: canvas.top,
                    maxY: canvas.height - canvas.bottom
                }
            },
            _applyVisibleArea: _noop,
            _animate: function(firstDrawing) {
                var that = this,
                    index = 0,
                    timeThreshold = 0.2,
                    points = that._points,
                    pointsCount = points && points.length,
                    duration = 1 / (timeThreshold * (pointsCount - 1) + 1),
                    completeFunc = function() {
                        that._animateComplete()
                    },
                    animateP = function() {
                        points[index] && points[index].animate(index === pointsCount - 1 ? completeFunc : undefined, duration, stepFunc);
                        index++
                    },
                    stepFunc = function(_, progress) {
                        if (progress >= timeThreshold) {
                            this.step = null;
                            animateP()
                        }
                    };
                if (firstDrawing)
                    animateP();
                else
                    $.each(points, function(i, p) {
                        p.animate(i === pointsCount - 1 ? completeFunc : undefined)
                    })
            },
            getVisiblePoints: function() {
                return _map(this._points, function(p) {
                        return p.isVisible() ? p : null
                    })
            },
            _beginUpdateData: function() {
                this._deletePatterns()
            }
        });
        pieSeries.doughnut = pieSeries.donut = pieSeries.pie
    })(jQuery, DevExpress);
    /*! Module viz-core, file financialSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            seriesNS = viz.series,
            series = seriesNS.mixins.chart,
            scatterSeries = series.scatter,
            barSeries = series.bar,
            rangeCalculator = seriesNS.helpers.rangeDataCalculator,
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            _normalizeEnum = DX.viz.utils.normalizeEnum,
            _extend = $.extend,
            _each = $.each,
            _noop = $.noop,
            DEFAULT_FINANCIAL_POINT_SIZE = 10;
        series.stock = _extend({}, scatterSeries, {
            _animate: _noop,
            _applyMarkerClipRect: function(settings) {
                settings.clipId = this._forceClipping ? this._paneClipRectID : this._widePaneClipRectID
            },
            _updatePointsVisibility: barSeries._updatePointsVisibility,
            _getOptionsForPoint: barSeries._getOptionsForPoint,
            getErrorBarRangeCorrector: _noop,
            _createErrorBarGroup: _noop,
            areErrorBarsVisible: _noop,
            _createGroups: scatterSeries._createGroups,
            _setMarkerGroupSettings: function() {
                var that = this,
                    markersGroup = that._markersGroup,
                    styles = that._createPointStyles(that._getMarkerGroupOptions()),
                    defaultStyle = _extend(styles.normal, {"class": "default-markers"}),
                    defaultPositiveStyle = _extend(styles.positive.normal, {"class": "default-positive-markers"}),
                    reductionStyle = _extend(styles.reduction.normal, {"class": "reduction-markers"}),
                    reductionPositiveStyle = _extend(styles.reductionPositive.normal, {"class": "reduction-positive-markers"}),
                    markerSettings = {"class": "dxc-markers"};
                that._applyMarkerClipRect(markerSettings);
                markersGroup.attr(markerSettings);
                that._createGroup("defaultMarkersGroup", markersGroup, markersGroup, defaultStyle);
                that._createGroup("reductionMarkersGroup", markersGroup, markersGroup, reductionStyle);
                that._createGroup("defaultPositiveMarkersGroup", markersGroup, markersGroup, defaultPositiveStyle);
                that._createGroup("reductionPositiveMarkersGroup", markersGroup, markersGroup, reductionPositiveStyle)
            },
            _setGroupsSettings: function() {
                scatterSeries._setGroupsSettings.call(this, false)
            },
            _clearingAnimation: function(translators, drawComplete) {
                drawComplete()
            },
            _getCreatingPointOptions: function() {
                var that = this,
                    defaultPointOptions,
                    creatingPointOptions = that._predefinedPointOptions;
                if (!creatingPointOptions) {
                    defaultPointOptions = this._getPointOptions();
                    that._predefinedPointOptions = creatingPointOptions = _extend(true, {styles: {}}, defaultPointOptions);
                    creatingPointOptions.styles.normal = creatingPointOptions.styles.positive.normal = creatingPointOptions.styles.reduction.normal = creatingPointOptions.styles.reductionPositive.normal = {"stroke-width": defaultPointOptions.styles && defaultPointOptions.styles.normal && defaultPointOptions.styles.normal["stroke-width"]}
                }
                return creatingPointOptions
            },
            _checkData: function(data) {
                return _isDefined(data.argument) && data.highValue !== undefined && data.lowValue !== undefined && data.openValue !== undefined && data.closeValue !== undefined
            },
            _processRange: function(point, prevPoint) {
                rangeCalculator.processTwoValues(this, point, prevPoint, "highValue", "lowValue")
            },
            _getRangeData: function(zoomArgs, calcIntervalFunction) {
                rangeCalculator.calculateRangeData(this, zoomArgs, calcIntervalFunction, "highValue", "lowValue");
                rangeCalculator.addRangeSeriesLabelPaddings(this);
                return this._rangeData
            },
            _getPointData: function(data, options) {
                var that = this,
                    level,
                    openValueField = options.openValueField || "open",
                    closeValueField = options.closeValueField || "close",
                    highValueField = options.highValueField || "high",
                    lowValueField = options.lowValueField || "low",
                    reductionValue;
                that.level = options.reduction.level;
                switch (_normalizeEnum(that.level)) {
                    case"open":
                        level = openValueField;
                        break;
                    case"high":
                        level = highValueField;
                        break;
                    case"low":
                        level = lowValueField;
                        break;
                    default:
                        level = closeValueField;
                        that.level = "close";
                        break
                }
                reductionValue = data[level];
                return {
                        argument: data[options.argumentField || "date"],
                        highValue: data[highValueField],
                        lowValue: data[lowValueField],
                        closeValue: data[closeValueField],
                        openValue: data[openValueField],
                        reductionValue: reductionValue,
                        tag: data[options.tagField || "tag"],
                        isReduction: that._checkReduction(reductionValue)
                    }
            },
            _parsePointStyle: function(style, defaultColor, innerColor) {
                return {
                        stroke: style.color || defaultColor,
                        "stroke-width": style.width,
                        fill: style.color || innerColor
                    }
            },
            updateTeamplateFieldNames: function() {
                var that = this,
                    options = that._options,
                    valueFields = that.getValueFields(),
                    name = that.name;
                options.openValueField = valueFields[0] + name;
                options.highValueField = valueFields[1] + name;
                options.lowValueField = valueFields[2] + name;
                options.closeValueField = valueFields[3] + name;
                options.tagField = that.getTagField() + name
            },
            _getDefaultStyle: function(options) {
                var that = this,
                    mainPointColor = options.color || that._options.mainSeriesColor;
                return {
                        normal: that._parsePointStyle(options, mainPointColor, mainPointColor),
                        hover: that._parsePointStyle(options.hoverStyle, mainPointColor, mainPointColor),
                        selection: that._parsePointStyle(options.selectionStyle, mainPointColor, mainPointColor)
                    }
            },
            _getReductionStyle: function(options) {
                var that = this,
                    reductionColor = options.reduction.color;
                return {
                        normal: that._parsePointStyle({
                            color: reductionColor,
                            width: options.width,
                            hatching: options.hatching
                        }, reductionColor, reductionColor),
                        hover: that._parsePointStyle(options.hoverStyle, reductionColor, reductionColor),
                        selection: that._parsePointStyle(options.selectionStyle, reductionColor, reductionColor)
                    }
            },
            _createPointStyles: function(pointOptions) {
                var that = this,
                    innerColor = that._options.innerColor,
                    styles = that._getDefaultStyle(pointOptions),
                    positiveStyle,
                    reductionStyle,
                    reductionPositiveStyle;
                positiveStyle = _extend(true, {}, styles);
                reductionStyle = that._getReductionStyle(pointOptions);
                reductionPositiveStyle = _extend(true, {}, reductionStyle);
                positiveStyle.normal.fill = positiveStyle.hover.fill = positiveStyle.selection.fill = innerColor;
                reductionPositiveStyle.normal.fill = reductionPositiveStyle.hover.fill = reductionPositiveStyle.selection.fill = innerColor;
                styles.positive = positiveStyle;
                styles.reduction = reductionStyle;
                styles.reductionPositive = reductionPositiveStyle;
                return styles
            },
            _endUpdateData: function() {
                delete this.prevLevelValue;
                delete this._predefinedPointOptions
            },
            _checkReduction: function(value) {
                var that = this,
                    result = false;
                if (value !== null) {
                    if (_isDefined(that.prevLevelValue))
                        result = value < that.prevLevelValue;
                    that.prevLevelValue = value
                }
                return result
            },
            _fusionPoints: function(fusionPoints, tick) {
                var fusedPointData = {},
                    reductionLevel,
                    highValue = -Infinity,
                    lowValue = +Infinity,
                    openValue,
                    closeValue;
                if (!fusionPoints.length)
                    return {};
                _each(fusionPoints, function(_, point) {
                    if (!point.hasValue())
                        return;
                    highValue = Math.max(highValue, point.highValue);
                    lowValue = Math.min(lowValue, point.lowValue);
                    openValue = openValue !== undefined ? openValue : point.openValue;
                    closeValue = point.closeValue !== undefined ? point.closeValue : closeValue
                });
                fusedPointData.argument = tick;
                fusedPointData.openValue = openValue;
                fusedPointData.closeValue = closeValue;
                fusedPointData.highValue = highValue;
                fusedPointData.lowValue = lowValue;
                fusedPointData.tag = null;
                switch (_normalizeEnum(this.level)) {
                    case"open":
                        reductionLevel = openValue;
                        break;
                    case"high":
                        reductionLevel = highValue;
                        break;
                    case"low":
                        reductionLevel = lowValue;
                        break;
                    default:
                        reductionLevel = closeValue;
                        break
                }
                fusedPointData.reductionValue = reductionLevel;
                fusedPointData.isReduction = this._checkReduction(reductionLevel);
                return fusedPointData
            },
            _getPointSize: function() {
                return DEFAULT_FINANCIAL_POINT_SIZE
            },
            getValueFields: function() {
                var options = this._options;
                return [options.openValueField || "open", options.highValueField || "high", options.lowValueField || "low", options.closeValueField || "close"]
            },
            getArgumentField: function() {
                return this._options.argumentField || "date"
            },
            _beginUpdateData: _noop
        });
        series.candlestick = _extend({}, series.stock, {
            _createPattern: barSeries._createPattern,
            _beginUpdateData: barSeries._beginUpdateData,
            _parsePointStyle: function(style, defaultColor, innerColor) {
                var color = this._createPattern(style.color || innerColor, style.hatching),
                    base = series.stock._parsePointStyle.call(this, style, defaultColor, color);
                base.fill = color;
                return base
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file stackedSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            series = viz.series,
            chartSeries = series.mixins.chart,
            polarSeries = series.mixins.polar,
            areaSeries = chartSeries.area,
            barSeries = chartSeries.bar,
            lineSeries = chartSeries.line,
            rangeCalculator = viz.series.helpers.rangeDataCalculator,
            _extend = $.extend,
            objectUtils = DX.require("/utils/utils.object"),
            _noop = $.noop,
            baseStackedSeries = {
                _processRange: _noop,
                getErrorBarRangeCorrector: _noop,
                _fillErrorBars: _noop,
                _calculateErrorBars: _noop,
                _processStackedRange: function() {
                    var that = this,
                        prevPoint;
                    that._resetRangeData();
                    $.each(that.getAllPoints(), function(i, p) {
                        rangeCalculator.processRange(that, p, prevPoint);
                        prevPoint = p
                    })
                },
                _getRangeData: function() {
                    this._processStackedRange();
                    return areaSeries._getRangeData.apply(this, arguments)
                }
            },
            baseFullStackedSeries = _extend({}, baseStackedSeries, {
                _getRangeData: function(zoomArgs, calcIntervalFunction) {
                    var that = this;
                    that._processStackedRange();
                    rangeCalculator.calculateRangeData(that, zoomArgs, calcIntervalFunction);
                    rangeCalculator.addLabelPaddings(that);
                    rangeCalculator.processFullStackedRange(that);
                    rangeCalculator.calculateRangeMinValue(that, zoomArgs);
                    return that._rangeData
                },
                isFullStackedSeries: function() {
                    return true
                }
            });
        chartSeries.stackedline = _extend({}, lineSeries, baseStackedSeries, {_getRangeData: function() {
                this._processStackedRange();
                return lineSeries._getRangeData.apply(this, arguments)
            }});
        chartSeries.stackedspline = _extend({}, chartSeries.spline, baseStackedSeries, {_getRangeData: chartSeries.stackedline._getRangeData});
        chartSeries.fullstackedline = _extend({}, lineSeries, baseFullStackedSeries, {_getRangeData: function(zoomArgs, calcIntervalFunction) {
                var that = this;
                that._processStackedRange();
                rangeCalculator.calculateRangeData(that, zoomArgs, calcIntervalFunction);
                rangeCalculator.addLabelPaddings(that);
                rangeCalculator.processFullStackedRange(that);
                return that._rangeData
            }});
        chartSeries.fullstackedspline = _extend({}, chartSeries.spline, baseFullStackedSeries, {_getRangeData: chartSeries.fullstackedline._getRangeData});
        chartSeries.stackedbar = _extend({}, barSeries, baseStackedSeries, {_getRangeData: function() {
                this._processStackedRange();
                return barSeries._getRangeData.apply(this, arguments)
            }});
        chartSeries.fullstackedbar = _extend({}, barSeries, baseFullStackedSeries, {_getRangeData: function() {
                var rangeData = baseFullStackedSeries._getRangeData.apply(this, arguments);
                rangeData.arg.stick = false;
                return rangeData
            }});
        function clonePoint(point, value, minValue, position) {
            point = objectUtils.clone(point);
            point.value = value;
            point.minValue = minValue;
            point.translate();
            point.argument = point.argument + position;
            return point
        }
        function preparePointsForStackedAreaSegment(points) {
            var i = 0,
                p,
                result = [],
                array,
                len = points.length;
            while (i < len) {
                p = points[i];
                array = [p];
                if (p.leftHole)
                    array = [clonePoint(p, p.leftHole, p.minLeftHole, "left"), p];
                if (p.rightHole)
                    array.push(clonePoint(p, p.rightHole, p.minRightHole, "right"));
                result.push(array);
                i++
            }
            return [].concat.apply([], result)
        }
        chartSeries.stackedarea = _extend({}, areaSeries, baseStackedSeries, {_prepareSegment: function(points, rotated) {
                return areaSeries._prepareSegment.call(this, preparePointsForStackedAreaSegment(points, this._prevSeries), rotated)
            }});
        function getPointsByArgFromPrevSeries(prevSeries, argument) {
            var result;
            while (prevSeries) {
                result = prevSeries._segmentByArg[argument];
                if (result)
                    break;
                prevSeries = prevSeries._prevSeries
            }
            return result
        }
        chartSeries.stackedsplinearea = _extend({}, chartSeries.splinearea, baseStackedSeries, {_prepareSegment: function(points, rotated) {
                var that = this,
                    areaSegment;
                points = preparePointsForStackedAreaSegment(points, that._prevSeries);
                if (!this._prevSeries || points.length === 1)
                    areaSegment = chartSeries.splinearea._prepareSegment.call(this, points, rotated);
                else {
                    var fwPoints = chartSeries.spline._calculateBezierPoints(points, rotated),
                        bwPoints = viz.utils.map(points, function(p) {
                            var point = p.getCoords(true);
                            point.argument = p.argument;
                            return point
                        }),
                        prevSeriesFwPoints = [],
                        pointByArg = {},
                        i = 0,
                        len = that._prevSeries._segments.length;
                    while (i < len) {
                        prevSeriesFwPoints = prevSeriesFwPoints.concat(that._prevSeries._segments[i].line);
                        i++
                    }
                    $.each(prevSeriesFwPoints, function(_, p) {
                        if (p.argument !== null) {
                            var argument = p.argument.valueOf();
                            if (!pointByArg[argument])
                                pointByArg[argument] = [p];
                            else
                                pointByArg[argument].push(p)
                        }
                    });
                    that._prevSeries._segmentByArg = pointByArg;
                    bwPoints = chartSeries.spline._calculateBezierPoints(bwPoints, rotated);
                    $.each(bwPoints, function(i, p) {
                        var argument = p.argument.valueOf(),
                            prevSeriesPoints;
                        if (i % 3 === 0) {
                            prevSeriesPoints = pointByArg[argument] || getPointsByArgFromPrevSeries(that._prevSeries, argument);
                            if (prevSeriesPoints) {
                                bwPoints[i - 1] && prevSeriesPoints[0] && (bwPoints[i - 1] = prevSeriesPoints[0]);
                                bwPoints[i + 1] && (bwPoints[i + 1] = prevSeriesPoints[2] || p)
                            }
                        }
                    });
                    areaSegment = {
                        line: fwPoints,
                        area: fwPoints.concat(bwPoints.reverse())
                    };
                    that._areaPointsToSplineAreaPoints(areaSegment.area)
                }
                return areaSegment
            }});
        chartSeries.fullstackedarea = _extend({}, areaSeries, baseFullStackedSeries, {_prepareSegment: chartSeries.stackedarea._prepareSegment});
        chartSeries.fullstackedsplinearea = _extend({}, chartSeries.splinearea, baseFullStackedSeries, {_prepareSegment: chartSeries.stackedsplinearea._prepareSegment});
        polarSeries.stackedbar = _extend({}, polarSeries.bar, baseStackedSeries, {_getRangeData: function() {
                this._processStackedRange();
                return polarSeries.bar._getRangeData.apply(this, arguments)
            }})
    })(jQuery, DevExpress);
    /*! Module viz-core, file basePoint.js */
    (function($, DX) {
        DX.viz.series.points = {};
        var seriesNS = DX.viz.series,
            pointsNS = seriesNS.points,
            statesConsts = seriesNS.helpers.consts.states,
            _each = $.each,
            _extend = $.extend,
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            seiresMixins = seriesNS.mixins,
            _noop = $.noop;
        function Point(series, dataItem, options) {
            this.series = series;
            this.update(dataItem, options);
            this._emptySettings = {
                fill: null,
                stroke: null,
                dashStyle: null
            }
        }
        seriesNS.points.Point = Point;
        Point.prototype = {
            constructor: Point,
            getColor: function() {
                return this._styles.normal.fill || this.series.getColor()
            },
            _getStyle: function() {
                var that = this,
                    styles = that._styles,
                    style;
                if (that._currentStyle)
                    style = that._currentStyle;
                else if (that.isSelected())
                    style = styles.selection;
                else if (that.isHovered())
                    style = styles.hover;
                else {
                    that.fullState = statesConsts.normalMark;
                    style = styles.normal
                }
                return style
            },
            update: function(dataItem, options) {
                this.updateOptions(options);
                this.updateData(dataItem)
            },
            updateData: function(dataItem) {
                var that = this;
                that.argument = that.initialArgument = that.originalArgument = dataItem.argument;
                that.tag = dataItem.tag;
                that.index = dataItem.index;
                that.lowError = dataItem.lowError;
                that.highError = dataItem.highError;
                that._updateData(dataItem);
                !that.hasValue() && that.setInvisibility();
                that._fillStyle();
                that._updateLabelData()
            },
            deleteMarker: function() {
                var that = this;
                if (that.graphic)
                    that.graphic.dispose();
                that.graphic = null
            },
            _drawErrorBar: _noop,
            draw: function(renderer, groups, animationEnabled, firstDrawing) {
                var that = this;
                if (that._needDeletingOnDraw) {
                    that.deleteMarker();
                    that._needDeletingOnDraw = false
                }
                if (that._needClearingOnDraw) {
                    that.clearMarker();
                    that._needClearingOnDraw = false
                }
                if (!that._hasGraphic())
                    that._getMarkerVisibility() && that._drawMarker(renderer, groups.markers, animationEnabled, firstDrawing);
                else
                    that._updateMarker(animationEnabled, undefined, groups.markers);
                that._drawLabel();
                that._drawErrorBar(renderer, groups.errorBars, animationEnabled);
                return that
            },
            applyStyle: function(style) {
                var that = this;
                if (that.graphic) {
                    if (style === "normal") {
                        if (that.isHovered()) {
                            that.applyStyle("hover");
                            return
                        }
                        that.clearMarker()
                    }
                    else
                        that.graphic.toForeground();
                    that._currentStyle = that._styles[style];
                    that._updateMarker(true, that._styles[style])
                }
                return that
            },
            setHoverState: function() {
                this.series.setPointHoverState({
                    point: this,
                    setState: true
                })
            },
            releaseHoverState: function(callback) {
                var that = this;
                that.series.releasePointHoverState({
                    point: that,
                    legendCallback: callback,
                    setState: true
                });
                if (that.graphic)
                    !that.isSelected() && that.graphic.toBackground()
            },
            setSelectedState: function() {
                this.series.setPointSelectedState({
                    point: this,
                    setState: true
                })
            },
            releaseSelectedState: function() {
                this.series.releasePointSelectedState({
                    point: this,
                    setState: true
                })
            },
            select: function() {
                this.series.selectPoint(this)
            },
            clearSelection: function() {
                this.series.deselectPoint(this)
            },
            showTooltip: function() {
                this.series.showPointTooltip(this)
            },
            hideTooltip: function() {
                this.series.hidePointTooltip(this)
            },
            _checkLabelsChanging: function(oldType, newType) {
                var isNewRange = ~newType.indexOf("range"),
                    isOldRange = ~oldType.indexOf("range");
                return isOldRange && !isNewRange || !isOldRange && isNewRange
            },
            updateOptions: function(newOptions) {
                if (!newOptions)
                    return;
                var that = this,
                    oldOptions = that._options,
                    widgetType = newOptions.widgetType,
                    oldType = oldOptions && oldOptions.type,
                    newType = newOptions.type,
                    pointTypes = seiresMixins[widgetType].pointTypes,
                    newPointTypeMixin = pointTypes[newType];
                if (oldType !== newType) {
                    that._needDeletingOnDraw = true;
                    that._needClearingOnDraw = false;
                    if (oldType) {
                        that._checkLabelsChanging(oldType, newType) && that.deleteLabel();
                        that._resetType(pointsNS.mixins[pointTypes[oldType]])
                    }
                    that._setType(pointsNS.mixins[newPointTypeMixin])
                }
                else {
                    that._needDeletingOnDraw = that._checkSymbol(oldOptions, newOptions);
                    that._needClearingOnDraw = that._checkCustomize(oldOptions, newOptions)
                }
                that._options = newOptions;
                that._fillStyle();
                that._updateLabelOptions(newPointTypeMixin)
            },
            translate: function(translators) {
                var that = this;
                that.translators = translators || that.translators;
                that.translators && that.hasValue() && that._translate(that.translators)
            },
            _checkCustomize: function(oldOptions, newOptions) {
                return oldOptions.styles.usePointCustomOptions && !newOptions.styles.usePointCustomOptions
            },
            _getCustomLabelVisibility: function() {
                return this._styles.useLabelCustomOptions ? !!this._options.label.visible : null
            },
            getBoundingRect: function() {
                return this._getGraphicBbox()
            },
            _resetType: function(methods) {
                for (var methodName in methods)
                    delete this[methodName]
            },
            _setType: function(methods) {
                for (var methodName in methods)
                    this[methodName] = methods[methodName]
            },
            isInVisibleArea: function() {
                return this.inVisibleArea
            },
            isSelected: function() {
                return !!(this.fullState & statesConsts.selectedMark)
            },
            isHovered: function() {
                return !!(this.fullState & statesConsts.hoverMark)
            },
            getOptions: function() {
                return this._options
            },
            animate: function(complete, settings, partitionDuration) {
                if (!this.graphic) {
                    complete && complete();
                    return
                }
                this.graphic.animate(settings, {partitionDuration: partitionDuration}, complete)
            },
            getCoords: function(min) {
                var that = this;
                if (!min)
                    return {
                            x: that.x,
                            y: that.y
                        };
                if (!that._options.rotated)
                    return {
                            x: that.x,
                            y: that.minY
                        };
                return {
                        x: that.minX,
                        y: that.y
                    }
            },
            getDefaultCoords: function() {
                var that = this;
                return !that._options.rotated ? {
                        x: that.x,
                        y: that.defaultY
                    } : {
                        x: that.defaultX,
                        y: that.y
                    }
            },
            _getVisibleArea: function() {
                return this.series._visibleArea
            },
            _calculateVisibility: function(x, y, width, height) {
                var that = this,
                    visibleAreaX,
                    visibleAreaY,
                    rotated = that._options.rotated;
                if (that.translators) {
                    visibleAreaX = that.translators.x.getCanvasVisibleArea();
                    visibleAreaY = that.translators.y.getCanvasVisibleArea();
                    if (visibleAreaX.min > x + (width || 0) || visibleAreaX.max < x || visibleAreaY.min > y + (height || 0) || visibleAreaY.max < y || rotated && _isDefined(width) && width !== 0 && (visibleAreaX.min === x + width || visibleAreaX.max === x) || !rotated && _isDefined(height) && height !== 0 && (visibleAreaY.min === y + height || visibleAreaY.max === y))
                        that.inVisibleArea = false;
                    else
                        that.inVisibleArea = true
                }
            },
            hasValue: function() {
                return this.value !== null && this.minValue !== null
            },
            getBoundaryCoords: function() {
                return this.getBoundingRect()
            },
            correctPosition: _noop,
            correctRadius: _noop,
            correctLabelRadius: _noop,
            getCrosshairData: _noop,
            getPointRadius: _noop,
            _populatePointShape: _noop,
            _checkSymbol: _noop,
            getMarkerCoords: _noop,
            hide: _noop,
            show: _noop,
            hideMarker: _noop,
            setInvisibility: _noop,
            clearVisibility: _noop,
            isVisible: _noop,
            resetCorrection: _noop,
            correctValue: _noop,
            setPercentValue: _noop,
            correctCoordinates: _noop,
            coordsIn: _noop,
            getTooltipParams: _noop,
            setLabelEllipsis: _noop,
            setLabelTrackerData: _noop,
            updateLabelCoord: _noop,
            drawLabel: _noop,
            correctLabelPosition: _noop,
            dispose: function() {
                var that = this;
                that.deleteMarker();
                that.deleteLabel();
                that._errorBar && this._errorBar.dispose();
                that._options = that._styles = that.series = that.translators = that._errorBar = null
            },
            getTooltipFormatObject: function(tooltip) {
                var that = this,
                    tooltipFormatObject = that._getFormatObject(tooltip),
                    sharedTooltipValuesArray = [],
                    tooltipStackPointsFormatObject = [];
                if (that.stackPoints) {
                    _each(that.stackPoints, function(_, point) {
                        if (!point.isVisible())
                            return;
                        var formatObject = point._getFormatObject(tooltip);
                        tooltipStackPointsFormatObject.push(formatObject);
                        sharedTooltipValuesArray.push(formatObject.seriesName + ": " + formatObject.valueText)
                    });
                    _extend(tooltipFormatObject, {
                        points: tooltipStackPointsFormatObject,
                        valueText: sharedTooltipValuesArray.join("\n"),
                        stackName: that.stackPoints.stackName
                    })
                }
                return tooltipFormatObject
            },
            setHole: function(holeValue, position) {
                var that = this,
                    minValue = isFinite(that.minValue) ? that.minValue : 0;
                if (_isDefined(holeValue))
                    if (position === "left") {
                        that.leftHole = that.value - holeValue;
                        that.minLeftHole = minValue - holeValue
                    }
                    else {
                        that.rightHole = that.value - holeValue;
                        that.minRightHole = minValue - holeValue
                    }
            },
            resetHoles: function() {
                this.leftHole = null;
                this.minLeftHole = null;
                this.rightHole = null;
                this.minRightHole = null
            },
            getLabel: function() {
                return this._label
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file label.js */
    (function(DX, $, undefined) {
        var formatHelper = DX.require("/utils/utils.formatHelper"),
            mathUtils = DX.require("/utils/utils.math"),
            _degreesToRadians = mathUtils.degreesToRadians,
            _patchFontOptions = DX.viz.utils.patchFontOptions,
            _round = Math.round,
            _getCosAndSin = mathUtils.getCosAndSin,
            _rotateBBox = DX.viz.renderers.rotateBBox,
            LABEL_BACKGROUND_PADDING_X = 8,
            LABEL_BACKGROUND_PADDING_Y = 4;
        function getClosestCoord(point, coords) {
            var closestDistase = Infinity,
                closestCoord;
            $.each(coords, function(_, coord) {
                var x = point[0] - coord[0],
                    y = point[1] - coord[1],
                    distance = x * x + y * y;
                if (distance < closestDistase) {
                    closestDistase = distance;
                    closestCoord = coord
                }
            });
            return closestCoord
        }
        var barPointStrategy = {
                isLabelInside: function(labelPoint, figure) {
                    return labelPoint.x >= figure.x && labelPoint.x <= figure.x + figure.width && labelPoint.y >= figure.y && labelPoint.y <= figure.y + figure.height
                },
                prepareLabelPoints: function(points) {
                    return points
                },
                getFigureCenter: function(figure) {
                    return [figure.x + figure.width / 2, figure.y + figure.height / 2]
                },
                findFigurePoint: function(figure, labelPoint) {
                    var figureCenter = barPointStrategy.getFigureCenter(figure),
                        point = getClosestCoord(labelPoint, [[figure.x, figureCenter[1]], [figureCenter[0], figure.y + figure.height], [figure.x + figure.width, figureCenter[1]], [figureCenter[0], figure.y]]);
                    return [_round(point[0]), _round(point[1])]
                }
            };
        var symbolPointStrategy = {
                isLabelInside: function() {
                    return false
                },
                prepareLabelPoints: barPointStrategy.prepareLabelPoints,
                getFigureCenter: function(figure) {
                    return [figure.x, figure.y]
                },
                findFigurePoint: function(figure, labelPoint) {
                    var angle = Math.atan2(figure.y - labelPoint[1], labelPoint[0] - figure.x);
                    return [_round(figure.x + figure.r * Math.cos(angle)), _round(figure.y - figure.r * Math.sin(angle))]
                }
            };
        var piePointStrategy = {
                isLabelInside: function(_0, _1, isOutside) {
                    return !isOutside
                },
                prepareLabelPoints: function(points, center, angle) {
                    var rotatedPoints = [],
                        x0 = center[0],
                        y0 = center[1],
                        cossin = _getCosAndSin(angle || 0);
                    $.each(points, function(_, point) {
                        rotatedPoints.push([_round((point[0] - x0) * cossin.cos + (point[1] - y0) * cossin.sin + x0), _round(-(point[0] - x0) * cossin.sin + (point[1] - y0) * cossin.cos + y0)])
                    });
                    return rotatedPoints
                },
                getFigureCenter: symbolPointStrategy.getFigureCenter,
                findFigurePoint: function(figure, labelPoint) {
                    var x = figure.x + (figure.y - labelPoint[1]) / Math.tan(_degreesToRadians(figure.angle)),
                        point = [figure.x, figure.y];
                    if (figure.x <= x && x <= labelPoint[0] || figure.x >= x && x >= labelPoint[0])
                        point.push(_round(x), labelPoint[1]);
                    return point
                }
            };
        function selectStrategy(figure) {
            return figure.angle !== undefined && piePointStrategy || figure.r !== undefined && symbolPointStrategy || barPointStrategy
        }
        function disposeItem(obj, field) {
            obj[field] && obj[field].dispose();
            obj[field] = null
        }
        function checkBackground(background) {
            return background && (background.fill && background.fill !== "none" || background["stroke-width"] > 0 && background.stroke && background.stroke !== "none")
        }
        function checkConnector(connector) {
            return connector && connector["stroke-width"] > 0 && connector.stroke && connector.stroke !== "none"
        }
        function formatValue(value, format, precision) {
            return formatHelper.format(value, format, precision)
        }
        function formatText(data, options) {
            var format = options.format,
                precision = options.precision;
            data.valueText = formatValue(data.value, format, precision);
            data.argumentText = formatValue(data.argument, options.argumentFormat, options.argumentPrecision);
            if (data.percent !== undefined)
                data.percentText = formatValue(data.percent, "percent", options.percentPrecision);
            if (data.total !== undefined)
                data.totalText = formatValue(data.total, format, precision);
            if (data.openValue !== undefined)
                data.openValueText = formatValue(data.openValue, format, precision);
            if (data.closeValue !== undefined)
                data.closeValueText = formatValue(data.closeValue, format, precision);
            if (data.lowValue !== undefined)
                data.lowValueText = formatValue(data.lowValue, format, precision);
            if (data.highValue !== undefined)
                data.highValueText = formatValue(data.highValue, format, precision);
            if (data.reductionValue !== undefined)
                data.reductionValueText = formatValue(data.reductionValue, format, precision);
            return options.customizeText ? options.customizeText.call(data, data) : data.valueText
        }
        function Label(renderSettings) {
            this._renderer = renderSettings.renderer;
            this._container = renderSettings.labelsGroup;
            this._point = renderSettings.point
        }
        Label.prototype = {
            constructor: Label,
            _setVisibility: function(value, state) {
                this._group && this._group.attr({visibility: value});
                this._visible = state
            },
            clearVisibility: function() {
                this._setVisibility(null, true)
            },
            hide: function() {
                this._setVisibility("hidden", false)
            },
            show: function() {
                var that = this;
                if (that._point.hasValue()) {
                    that._draw();
                    that._point.correctLabelPosition(that)
                }
            },
            isVisible: function() {
                return this._visible
            },
            setColor: function(color) {
                this._color = color
            },
            setOptions: function(options) {
                this._options = options
            },
            setData: function(data) {
                this._data = data
            },
            setDataField: function(fieldName, fieldValue) {
                this._data = this._data || {};
                this._data[fieldName] = fieldValue
            },
            getData: function() {
                return this._data
            },
            setFigureToDrawConnector: function(figure) {
                this._figure = figure
            },
            dispose: function() {
                var that = this;
                disposeItem(that, "_group");
                that._data = that._options = that._textContent = that._visible = that._insideGroup = that._text = that._background = that._connector = that._figure = null
            },
            _draw: function() {
                var that = this,
                    renderer = that._renderer,
                    container = that._container,
                    options = that._options || {},
                    text = that._textContent = formatText(that._data, that._options) || null;
                that.clearVisibility();
                if (text) {
                    if (!that._group) {
                        that._group = renderer.g().append(container);
                        that._insideGroup = renderer.g().append(that._group);
                        that._text = renderer.text("", 0, 0).append(that._insideGroup)
                    }
                    that._text.css(options.attributes ? _patchFontOptions(options.attributes.font) : {});
                    if (checkBackground(options.background)) {
                        that._background = that._background || renderer.rect().append(that._insideGroup).toBackground();
                        that._background.attr(options.background);
                        that._color && that._background.attr({fill: that._color})
                    }
                    else
                        disposeItem(that, "_background");
                    if (checkConnector(options.connector)) {
                        that._connector = that._connector || renderer.path([], "line").sharp().append(that._group).toBackground();
                        that._connector.attr(options.connector);
                        that._color && that._connector.attr({stroke: that._color})
                    }
                    else
                        disposeItem(that, "_connector");
                    that._text.attr({text: text});
                    that._updateBackground(that._text.getBBox());
                    that._setVisibility("visible", true)
                }
                else
                    that.hide();
                return that
            },
            _updateBackground: function(bbox) {
                var that = this;
                that._textSize = [bbox.width, bbox.height];
                if (that._background) {
                    bbox.x -= LABEL_BACKGROUND_PADDING_X;
                    bbox.y -= LABEL_BACKGROUND_PADDING_Y;
                    bbox.width += 2 * LABEL_BACKGROUND_PADDING_X;
                    bbox.height += 2 * LABEL_BACKGROUND_PADDING_Y;
                    that._background.attr(bbox)
                }
                if (that._options.rotationAngle) {
                    that._insideGroup.rotate(that._options.rotationAngle, bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
                    bbox = _rotateBBox(bbox, [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2], -that._options.rotationAngle)
                }
                that._bbox = bbox
            },
            _getConnectorPoints: function() {
                var that = this,
                    figure = that._figure,
                    strategy = selectStrategy(figure),
                    bbox = that.getBoundingRect(),
                    labelPoint,
                    figurePoint,
                    xc,
                    yc,
                    points = [];
                if (!strategy.isLabelInside(bbox, figure, that._options.position !== "inside")) {
                    xc = bbox.x + bbox.width / 2;
                    yc = bbox.y + bbox.height / 2;
                    points = strategy.prepareLabelPoints([[xc, yc - that._textSize[1] / 2], [xc + that._textSize[0] / 2, yc], [xc, yc + that._textSize[1] / 2], [xc - that._textSize[0] / 2, yc]], [xc, yc], -that._options.rotationAngle || 0);
                    labelPoint = getClosestCoord(strategy.getFigureCenter(figure), points);
                    labelPoint = [_round(labelPoint[0]), _round(labelPoint[1])];
                    figurePoint = strategy.findFigurePoint(figure, labelPoint);
                    points = figurePoint.concat(labelPoint)
                }
                return points
            },
            fit: function(maxWidth) {
                this._text && this._text.applyEllipsis(maxWidth);
                this._updateBackground(this._text.getBBox())
            },
            setTrackerData: function(point) {
                this._text.data({"chart-data-point": point});
                this._background && this._background.data({"chart-data-point": point})
            },
            shift: function(x, y) {
                var that = this;
                if (that._textContent) {
                    that._insideGroup.attr({
                        translateX: that._x = _round(x - that._bbox.x),
                        translateY: that._y = _round(y - that._bbox.y)
                    });
                    if (that._connector)
                        that._connector.attr({points: that._getConnectorPoints()})
                }
                return that
            },
            getBoundingRect: function() {
                var bbox = this._bbox;
                return this._textContent ? {
                        x: bbox.x + this._x,
                        y: bbox.y + this._y,
                        width: bbox.width,
                        height: bbox.height
                    } : {}
            },
            getLayoutOptions: function() {
                var options = this._options;
                return {
                        alignment: options.alignment,
                        background: checkBackground(options.background),
                        horizontalOffset: options.horizontalOffset,
                        verticalOffset: options.verticalOffset,
                        radialOffset: options.radialOffset,
                        position: options.position
                    }
            }
        };
        DX.viz.series.points.Label = Label;
        Label._DEBUG_formatText = formatText
    })(DevExpress, jQuery);
    /*! Module viz-core, file symbolPoint.js */
    (function($, DX) {
        var viz = DX.viz,
            seriesNS = viz.series,
            commonUtils = DX.require("/utils/utils.common"),
            _extend = $.extend,
            _isDefined = commonUtils.isDefined,
            _normalizeEnum = DX.viz.utils.normalizeEnum,
            _math = Math,
            _round = _math.round,
            _floor = _math.floor,
            _ceil = _math.ceil,
            DEFAULT_IMAGE_WIDTH = 20,
            DEFAULT_IMAGE_HEIGHT = 20,
            LABEL_OFFSET = 10,
            CANVAS_POSITION_DEFAULT = "canvas_position_default";
        function getSquareMarkerCoords(radius) {
            return [-radius, -radius, radius, -radius, radius, radius, -radius, radius, -radius, -radius]
        }
        function getPolygonMarkerCoords(radius) {
            var r = _ceil(radius);
            return [-r, 0, 0, -r, r, 0, 0, r, -r, 0]
        }
        function getCrossMarkerCoords(radius) {
            var r = _ceil(radius),
                floorHalfRadius = _floor(r / 2),
                ceilHalfRadius = _ceil(r / 2);
            return [-r, -floorHalfRadius, -floorHalfRadius, -r, 0, -ceilHalfRadius, floorHalfRadius, -r, r, -floorHalfRadius, ceilHalfRadius, 0, r, floorHalfRadius, floorHalfRadius, r, 0, ceilHalfRadius, -floorHalfRadius, r, -r, floorHalfRadius, -ceilHalfRadius, 0]
        }
        function getTriangleDownMarkerCoords(radius) {
            return [-radius, -radius, radius, -radius, 0, radius, -radius, -radius]
        }
        function getTriangleUpMarkerCoords(radius) {
            return [-radius, radius, radius, radius, 0, -radius, -radius, radius]
        }
        seriesNS.points.mixins = seriesNS.points.mixins || {};
        seriesNS.points.mixins.symbolPoint = {
            deleteLabel: function() {
                this._label.dispose();
                this._label = null
            },
            _hasGraphic: function() {
                return this.graphic
            },
            clearVisibility: function() {
                var that = this,
                    graphic = that.graphic;
                if (graphic && graphic.attr("visibility"))
                    graphic.attr({visibility: null});
                that._label.clearVisibility()
            },
            isVisible: function() {
                return this.inVisibleArea && this.series.isVisible()
            },
            setInvisibility: function() {
                var that = this,
                    graphic = that.graphic;
                if (graphic && graphic.attr("visibility") !== "hidden")
                    graphic.attr({visibility: "hidden"});
                that._errorBar && that._errorBar.attr({visibility: "hidden"});
                that._label.hide()
            },
            clearMarker: function() {
                var graphic = this.graphic;
                graphic && graphic.attr(this._emptySettings)
            },
            _createLabel: function() {
                this._label = viz.CoreFactory.createLabel({
                    renderer: this.series._renderer,
                    labelsGroup: this.series._labelsGroup,
                    point: this
                })
            },
            _updateLabelData: function() {
                this._label.setData(this._getLabelFormatObject())
            },
            _updateLabelOptions: function() {
                !this._label && this._createLabel();
                this._label.setOptions(this._options.label)
            },
            _checkImage: function(image) {
                return _isDefined(image) && (typeof image === "string" || _isDefined(image.url))
            },
            _fillStyle: function() {
                this._styles = this._options.styles
            },
            _checkSymbol: function(oldOptions, newOptions) {
                var oldSymbol = oldOptions.symbol,
                    newSymbol = newOptions.symbol,
                    symbolChanged = oldSymbol === "circle" && newSymbol !== "circle" || oldSymbol !== "circle" && newSymbol === "circle",
                    imageChanged = this._checkImage(oldOptions.image) !== this._checkImage(newOptions.image);
                return !!(symbolChanged || imageChanged)
            },
            _populatePointShape: function(symbol, radius) {
                switch (symbol) {
                    case"square":
                        return getSquareMarkerCoords(radius);
                    case"polygon":
                        return getPolygonMarkerCoords(radius);
                    case"triangle":
                    case"triangleDown":
                        return getTriangleDownMarkerCoords(radius);
                    case"triangleUp":
                        return getTriangleUpMarkerCoords(radius);
                    case"cross":
                        return getCrossMarkerCoords(radius)
                }
            },
            correctValue: function(correction) {
                var that = this;
                if (that.hasValue()) {
                    that.value = that.initialValue + correction;
                    that.minValue = correction;
                    that.translate()
                }
            },
            resetCorrection: function() {
                this.value = this.initialValue;
                this.minValue = CANVAS_POSITION_DEFAULT
            },
            _getTranslates: function(animationEnabled) {
                var translateX = this.x,
                    translateY = this.y;
                if (animationEnabled)
                    if (this._options.rotated)
                        translateX = this.defaultX;
                    else
                        translateY = this.defaultY;
                return {
                        x: translateX,
                        y: translateY
                    }
            },
            _createImageMarker: function(renderer, settings, options) {
                var width = options.width || DEFAULT_IMAGE_WIDTH,
                    height = options.height || DEFAULT_IMAGE_HEIGHT;
                return renderer.image(-_round(width * 0.5), -_round(height * 0.5), width, height, options.url ? options.url.toString() : options.toString(), "center").attr({
                        translateX: settings.translateX,
                        translateY: settings.translateY,
                        visibility: settings.visibility
                    })
            },
            _createSymbolMarker: function(renderer, pointSettings) {
                var marker,
                    symbol = this._options.symbol;
                if (symbol === "circle") {
                    delete pointSettings.points;
                    marker = renderer.circle().attr(pointSettings)
                }
                else if (symbol === "square" || symbol === "polygon" || symbol === "triangle" || symbol === "triangleDown" || symbol === "triangleUp" || symbol === "cross")
                    marker = renderer.path([], "area").attr(pointSettings).sharp();
                return marker
            },
            _createMarker: function(renderer, group, image, settings, animationEnabled) {
                var that = this,
                    marker = that._checkImage(image) ? that._createImageMarker(renderer, settings, image) : that._createSymbolMarker(renderer, settings);
                if (marker)
                    marker.data({"chart-data-point": that}).append(group);
                return marker
            },
            _getSymbolBbox: function(x, y, r) {
                return {
                        x: x - r,
                        y: y - r,
                        width: r * 2,
                        height: r * 2
                    }
            },
            _getImageBbox: function(x, y) {
                var image = this._options.image,
                    width = image.width || DEFAULT_IMAGE_WIDTH,
                    height = image.height || DEFAULT_IMAGE_HEIGHT;
                return {
                        x: x - _round(width / 2),
                        y: y - _round(height / 2),
                        width: width,
                        height: height
                    }
            },
            _getGraphicBbox: function() {
                var that = this,
                    options = that._options,
                    x = that.x,
                    y = that.y,
                    bbox;
                if (options.visible)
                    bbox = that._checkImage(options.image) ? that._getImageBbox(x, y) : that._getSymbolBbox(x, y, options.styles.normal.r);
                else
                    bbox = {
                        x: x,
                        y: y,
                        width: 0,
                        height: 0
                    };
                return bbox
            },
            _isLabelInsidePoint: $.noop,
            _getShiftLabelCoords: function(label) {
                var coord = this._addLabelAlignmentAndOffset(label, this._getLabelCoords(label));
                return this._checkLabelPosition(label, coord)
            },
            _drawLabel: function() {
                var that = this,
                    customVisibility = that._getCustomLabelVisibility(),
                    label = that._label;
                if ((that.series.getLabelVisibility() || customVisibility) && that._showForZeroValues() && that.hasValue())
                    label.show();
                else
                    label.hide()
            },
            correctLabelPosition: function(label) {
                var that = this,
                    coord;
                if (!that._isLabelInsidePoint(label)) {
                    coord = that._getShiftLabelCoords(label);
                    label.setFigureToDrawConnector(that._getLabelConnector(label.pointPosition));
                    label.shift(_round(coord.x), _round(coord.y))
                }
            },
            _showForZeroValues: function() {
                return true
            },
            _getLabelConnector: function(pointPosition) {
                var bbox = this._getGraphicBbox(pointPosition),
                    w2 = bbox.width / 2,
                    h2 = bbox.height / 2;
                return {
                        x: bbox.x + w2,
                        y: bbox.y + h2,
                        r: this._options.visible ? Math.max(w2, h2) : 0
                    }
            },
            _getPositionFromLocation: function() {
                return {
                        x: this.x,
                        y: this.y
                    }
            },
            _isPointInVisibleArea: function(visibleArea, graphicBbox) {
                return visibleArea.minX <= graphicBbox.x + graphicBbox.width && visibleArea.maxX >= graphicBbox.x && visibleArea.minY <= graphicBbox.y + graphicBbox.height && visibleArea.maxY >= graphicBbox.y
            },
            _checkLabelPosition: function(label, coord) {
                var that = this,
                    visibleArea = that._getVisibleArea(),
                    labelBbox = label.getBoundingRect(),
                    graphicBbox = that._getGraphicBbox(label.pointPosition),
                    offset = LABEL_OFFSET;
                if (that._isPointInVisibleArea(visibleArea, graphicBbox))
                    if (!that._options.rotated) {
                        if (visibleArea.minX > coord.x)
                            coord.x = visibleArea.minX;
                        if (visibleArea.maxX < coord.x + labelBbox.width)
                            coord.x = visibleArea.maxX - labelBbox.width;
                        if (visibleArea.minY > coord.y)
                            coord.y = graphicBbox.y + graphicBbox.height + offset;
                        if (visibleArea.maxY < coord.y + labelBbox.height)
                            coord.y = graphicBbox.y - labelBbox.height - offset
                    }
                    else {
                        if (visibleArea.minX > coord.x)
                            coord.x = graphicBbox.x + graphicBbox.width + offset;
                        if (visibleArea.maxX < coord.x + labelBbox.width)
                            coord.x = graphicBbox.x - offset - labelBbox.width;
                        if (visibleArea.minY > coord.y)
                            coord.y = visibleArea.minY;
                        if (visibleArea.maxY < coord.y + labelBbox.height)
                            coord.y = visibleArea.maxY - labelBbox.height
                    }
                return coord
            },
            _addLabelAlignmentAndOffset: function(label, coord) {
                var labelBBox = label.getBoundingRect(),
                    labelOptions = label.getLayoutOptions();
                if (!this._options.rotated)
                    if (labelOptions.alignment === "left")
                        coord.x += labelBBox.width / 2;
                    else if (labelOptions.alignment === "right")
                        coord.x -= labelBBox.width / 2;
                coord.x += labelOptions.horizontalOffset;
                coord.y += labelOptions.verticalOffset;
                return coord
            },
            _getLabelCoords: function(label) {
                return this._getLabelCoordOfPosition(label, this._getLabelPosition(label.pointPosition))
            },
            _getLabelCoordOfPosition: function(label, position) {
                var that = this,
                    labelBBox = label.getBoundingRect(),
                    graphicBbox = that._getGraphicBbox(label.pointPosition),
                    offset = LABEL_OFFSET,
                    centerY = graphicBbox.height / 2 - labelBBox.height / 2,
                    centerX = graphicBbox.width / 2 - labelBBox.width / 2,
                    x = graphicBbox.x,
                    y = graphicBbox.y;
                switch (position) {
                    case"left":
                        x -= labelBBox.width + offset;
                        y += centerY;
                        break;
                    case"right":
                        x += graphicBbox.width + offset;
                        y += centerY;
                        break;
                    case"top":
                        x += centerX;
                        y -= labelBBox.height + offset;
                        break;
                    case"bottom":
                        x += centerX;
                        y += graphicBbox.height + offset;
                        break;
                    case"inside":
                        x += centerX;
                        y += centerY;
                        break
                }
                return {
                        x: x,
                        y: y
                    }
            },
            _drawMarker: function(renderer, group, animationEnabled) {
                var that = this,
                    options = that._options,
                    translates = that._getTranslates(animationEnabled),
                    style = that._getStyle();
                that.graphic = that._createMarker(renderer, group, options.image, _extend({
                    translateX: translates.x,
                    translateY: translates.y,
                    points: that._populatePointShape(options.symbol, style.r)
                }, style), animationEnabled)
            },
            _getErrorBarSettings: function() {
                return {visibility: "visible"}
            },
            _drawErrorBar: function(renderer, group) {
                if (!this._options.errorBars)
                    return;
                var that = this,
                    options = that._options,
                    errorBarOptions = options.errorBars,
                    points = [],
                    settings,
                    pos = that._errorBarPos,
                    high = that._highErrorCoord,
                    low = that._lowErrorCoord,
                    displayMode = _normalizeEnum(errorBarOptions.displayMode),
                    isHighDisplayMode = displayMode === "high",
                    isLowDisplayMode = displayMode === "low",
                    edgeLength = _floor(parseInt(errorBarOptions.edgeLength) / 2),
                    highErrorOnly = (isHighDisplayMode || !_isDefined(low)) && _isDefined(high) && !isLowDisplayMode,
                    lowErrorOnly = (isLowDisplayMode || !_isDefined(high)) && _isDefined(low) && !isHighDisplayMode;
                highErrorOnly && (low = that._baseErrorBarPos);
                lowErrorOnly && (high = that._baseErrorBarPos);
                if (displayMode !== "none" && _isDefined(high) && _isDefined(low) && _isDefined(pos)) {
                    !lowErrorOnly && points.push([pos - edgeLength, high, pos + edgeLength, high]);
                    points.push([pos, high, pos, low]);
                    !highErrorOnly && points.push([pos + edgeLength, low, pos - edgeLength, low]);
                    options.rotated && $.each(points, function(_, p) {
                        p.reverse()
                    });
                    settings = that._getErrorBarSettings(errorBarOptions);
                    if (!that._errorBar)
                        that._errorBar = renderer.path(points, "line").attr(settings).append(group);
                    else {
                        settings.points = points;
                        that._errorBar.attr(settings)
                    }
                }
                else
                    that._errorBar && that._errorBar.attr({visibility: "hidden"})
            },
            getTooltipParams: function() {
                var that = this,
                    graphic = that.graphic;
                return {
                        x: that.x,
                        y: that.y,
                        offset: graphic ? graphic.getBBox().height / 2 : 0
                    }
            },
            setPercentValue: function(total, fullStacked, leftHoleTotal, rightHoleTotal) {
                var that = this,
                    valuePercent = that.value / total || 0,
                    minValuePercent = that.minValue / total || 0,
                    percent = valuePercent - minValuePercent;
                that._label.setDataField("percent", percent);
                that._label.setDataField("total", total);
                if (that.series.isFullStackedSeries() && that.hasValue()) {
                    if (that.leftHole) {
                        that.leftHole /= total - leftHoleTotal;
                        that.minLeftHole /= total - leftHoleTotal
                    }
                    if (that.rightHole) {
                        that.rightHole /= total - rightHoleTotal;
                        that.minRightHole /= total - rightHoleTotal
                    }
                    that.value = valuePercent;
                    that.minValue = !minValuePercent ? that.minValue : minValuePercent;
                    that.translate()
                }
            },
            _storeTrackerR: function() {
                var that = this,
                    navigator = window.navigator,
                    r = that._options.styles.normal.r,
                    minTrackerSize;
                navigator = that.__debug_navigator || navigator;
                that.__debug_browserNavigator = navigator;
                minTrackerSize = "ontouchstart" in window || navigator.msPointerEnabled && navigator.msMaxTouchPoints || navigator.pointerEnabled && navigator.maxTouchPoints ? 20 : 6;
                that._options.trackerR = r < minTrackerSize ? minTrackerSize : r;
                return that._options.trackerR
            },
            _translateErrorBars: function(valueTranslator) {
                var that = this,
                    options = that._options,
                    rotated = options.rotated,
                    errorBars = options.errorBars;
                if (!errorBars)
                    return;
                _isDefined(that.lowError) && (that._lowErrorCoord = valueTranslator.translate(that.lowError));
                _isDefined(that.highError) && (that._highErrorCoord = valueTranslator.translate(that.highError));
                that._errorBarPos = _floor(rotated ? that.vy : that.vx);
                that._baseErrorBarPos = errorBars.type === "stdDeviation" ? that._lowErrorCoord + (that._highErrorCoord - that._lowErrorCoord) / 2 : rotated ? that.vx : that.vy
            },
            _translate: function(translators) {
                var that = this,
                    valueTranslator;
                if (that._options.rotated) {
                    valueTranslator = translators.x;
                    that.vx = that.x = valueTranslator.translate(that.value);
                    that.vy = that.y = translators.y.translate(that.argument);
                    that.minX = valueTranslator.translate(that.minValue);
                    that.defaultX = valueTranslator.translate(CANVAS_POSITION_DEFAULT);
                    that._translateErrorBars(valueTranslator)
                }
                else {
                    valueTranslator = translators.y;
                    that.vy = that.y = valueTranslator.translate(that.value);
                    that.vx = that.x = translators.x.translate(that.argument);
                    that.minY = valueTranslator.translate(that.minValue);
                    that.defaultY = valueTranslator.translate(CANVAS_POSITION_DEFAULT);
                    that._translateErrorBars(valueTranslator)
                }
                that._calculateVisibility(that.x, that.y)
            },
            _updateData: function(data) {
                var that = this;
                that.value = that.initialValue = that.originalValue = data.value;
                that.minValue = that.initialMinValue = that.originalMinValue = _isDefined(data.minValue) ? data.minValue : CANVAS_POSITION_DEFAULT
            },
            _getImageSettings: function(image) {
                return {
                        href: image.url || image.toString(),
                        width: image.width || DEFAULT_IMAGE_WIDTH,
                        height: image.height || DEFAULT_IMAGE_HEIGHT
                    }
            },
            getCrosshairData: function() {
                var that = this,
                    r = that._options.rotated,
                    value = that.value,
                    argument = that.argument;
                return {
                        x: that.vx,
                        y: that.vy,
                        xValue: r ? value : argument,
                        yValue: r ? argument : value,
                        axis: that.series.axis
                    }
            },
            getPointRadius: function() {
                var style = this._currentStyle || this._getStyle(),
                    options = this._options,
                    r = style.r,
                    extraSpace,
                    symbol = options.symbol,
                    isSquare = symbol === "square",
                    isTriangle = symbol === "triangle" || symbol === "triangleDown" || symbol === "triangleUp";
                if (options.visible && !options.image && r) {
                    extraSpace = style["stroke-width"] / 2;
                    return (isSquare || isTriangle ? 1.4 * r : r) + extraSpace
                }
                return 0
            },
            _updateMarker: function(animationEnabled, style) {
                var that = this,
                    options = that._options,
                    settings,
                    image = options.image,
                    visibility = !that.isVisible() ? {visibility: "hidden"} : {};
                style = style || that._getStyle();
                if (that._checkImage(image))
                    settings = _extend({}, {visibility: style.visibility}, visibility, that._getImageSettings(image));
                else
                    settings = _extend({}, style, visibility, {points: that._populatePointShape(options.symbol, style.r)});
                if (!animationEnabled) {
                    settings.translateX = that.x;
                    settings.translateY = that.y
                }
                that.graphic.attr(settings).sharp()
            },
            _getLabelFormatObject: function() {
                var that = this;
                return {
                        argument: that.initialArgument,
                        value: that.initialValue,
                        originalArgument: that.originalArgument,
                        originalValue: that.originalValue,
                        seriesName: that.series.name,
                        lowErrorValue: that.lowError,
                        highErrorValue: that.highError,
                        point: that
                    }
            },
            _getLabelPosition: function() {
                var rotated = this._options.rotated;
                if (this.initialValue > 0)
                    return rotated ? "right" : "top";
                else
                    return rotated ? "left" : "bottom"
            },
            _getFormatObject: function(tooltip) {
                var that = this,
                    labelFormatObject = that._label.getData();
                return _extend({}, labelFormatObject, {
                        argumentText: tooltip.formatValue(that.initialArgument, "argument"),
                        valueText: tooltip.formatValue(that.initialValue)
                    }, _isDefined(labelFormatObject.percent) ? {percentText: tooltip.formatValue(labelFormatObject.percent, "percent")} : {}, _isDefined(labelFormatObject.total) ? {totalText: tooltip.formatValue(labelFormatObject.total)} : {})
            },
            _getMarkerVisibility: function() {
                return this._options.visible
            },
            coordsIn: function(x, y) {
                var trackerRadius = this._storeTrackerR();
                return x >= this.x - trackerRadius && x <= this.x + trackerRadius && y >= this.y - trackerRadius && y <= this.y + trackerRadius
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file barPoint.js */
    (function($, DX) {
        var points = DX.viz.series.points.mixins,
            _extend = $.extend,
            _math = Math,
            _floor = _math.floor,
            _abs = _math.abs,
            _min = _math.min,
            CANVAS_POSITION_DEFAULT = "canvas_position_default",
            DEFAULT_BAR_TRACKER_SIZE = 9,
            CORRECTING_BAR_TRACKER_VALUE = 4,
            RIGHT = "right",
            LEFT = "left",
            TOP = "top",
            BOTTOM = "bottom";
        points.barPoint = _extend({}, points.symbolPoint, {
            correctCoordinates: function(correctOptions) {
                var correction = _floor(correctOptions.offset - correctOptions.width / 2),
                    rotated = this._options.rotated,
                    valueSelector = rotated ? "height" : "width",
                    correctionSelector = (rotated ? "y" : "x") + "Correction";
                this[valueSelector] = correctOptions.width;
                this[correctionSelector] = correction
            },
            _getGraphicBbox: function() {
                var that = this,
                    bbox = {};
                bbox.x = that.x;
                bbox.y = that.y;
                bbox.width = that.width;
                bbox.height = that.height;
                return bbox
            },
            _getLabelConnector: function(location) {
                return this._getGraphicBbox(location)
            },
            _getLabelPosition: function() {
                var that = this,
                    position,
                    translators = that.translators,
                    initialValue = that.initialValue,
                    invertX = translators.x.getBusinessRange().invert,
                    invertY = translators.y.getBusinessRange().invert,
                    isDiscreteValue = that.series.valueAxisType === "discrete",
                    isFullStacked = that.series.isFullStackedSeries(),
                    notVerticalInverted = !isDiscreteValue && (initialValue >= 0 && !invertY || initialValue < 0 && invertY) || isDiscreteValue && !invertY || isFullStacked,
                    notHorizontalInverted = !isDiscreteValue && (initialValue >= 0 && !invertX || initialValue < 0 && invertX) || isDiscreteValue && !invertX || isFullStacked;
                if (!that._options.rotated)
                    position = notVerticalInverted ? TOP : BOTTOM;
                else
                    position = notHorizontalInverted ? RIGHT : LEFT;
                return position
            },
            _getLabelCoords: function(label) {
                var that = this,
                    coords;
                if (that.initialValue === 0 && that.series.isFullStackedSeries())
                    if (!this._options.rotated)
                        coords = that._getLabelCoordOfPosition(label, TOP);
                    else
                        coords = that._getLabelCoordOfPosition(label, RIGHT);
                else if (label.getLayoutOptions().position === "inside")
                    coords = that._getLabelCoordOfPosition(label, "inside");
                else
                    coords = points.symbolPoint._getLabelCoords.call(this, label);
                return coords
            },
            _checkLabelPosition: function(label, coord) {
                var that = this,
                    visibleArea = that._getVisibleArea();
                if (that._isPointInVisibleArea(visibleArea, that._getGraphicBbox()))
                    return that._moveLabelOnCanvas(coord, visibleArea, label.getBoundingRect());
                return coord
            },
            _isLabelInsidePoint: function(label) {
                var that = this,
                    graphicBbox = that._getGraphicBbox(),
                    labelBbox = label.getBoundingRect();
                if (that._options.resolveLabelsOverlapping && label.getLayoutOptions().position === "inside")
                    if (labelBbox.width > graphicBbox.width || labelBbox.height > graphicBbox.height) {
                        label.hide();
                        return true
                    }
                return false
            },
            _moveLabelOnCanvas: function(coord, visibleArea, labelBbox) {
                var x = coord.x,
                    y = coord.y;
                if (visibleArea.minX > x)
                    x = visibleArea.minX;
                if (visibleArea.maxX < x + labelBbox.width)
                    x = visibleArea.maxX - labelBbox.width;
                if (visibleArea.minY > y)
                    y = visibleArea.minY;
                if (visibleArea.maxY < y + labelBbox.height)
                    y = visibleArea.maxY - labelBbox.height;
                return {
                        x: x,
                        y: y
                    }
            },
            _showForZeroValues: function() {
                return this._options.label.showForZeroValues || this.initialValue
            },
            _drawMarker: function(renderer, group, animationEnabled) {
                var that = this,
                    style = that._getStyle(),
                    x = that.x,
                    y = that.y,
                    width = that.width,
                    height = that.height,
                    r = that._options.cornerRadius;
                if (animationEnabled)
                    if (that._options.rotated) {
                        width = 0;
                        x = that.defaultX
                    }
                    else {
                        height = 0;
                        y = that.defaultY
                    }
                that.graphic = renderer.rect(x, y, width, height).attr({
                    rx: r,
                    ry: r
                }).attr(style).data({"chart-data-point": that}).append(group)
            },
            _getSettingsForTracker: function() {
                var that = this,
                    y = that.y,
                    height = that.height,
                    x = that.x,
                    width = that.width;
                if (that._options.rotated) {
                    if (width === 1) {
                        width = DEFAULT_BAR_TRACKER_SIZE;
                        x -= CORRECTING_BAR_TRACKER_VALUE
                    }
                }
                else if (height === 1) {
                    height = DEFAULT_BAR_TRACKER_SIZE;
                    y -= CORRECTING_BAR_TRACKER_VALUE
                }
                return {
                        x: x,
                        y: y,
                        width: width,
                        height: height
                    }
            },
            getGraphicSettings: function() {
                var graphic = this.graphic;
                return {
                        x: graphic.attr("x"),
                        y: graphic.attr("y"),
                        height: graphic.attr("height"),
                        width: graphic.attr("width")
                    }
            },
            _getEdgeTooltipParams: function(x, y, width, height) {
                var isPositive = this.value >= 0,
                    invertedY = this.translators.y.getBusinessRange().invert,
                    invertedX = this.translators.x.getBusinessRange().invert,
                    xCoord,
                    yCoord;
                if (this._options.rotated) {
                    yCoord = y + height / 2;
                    if (invertedX)
                        xCoord = isPositive ? x : x + width;
                    else
                        xCoord = isPositive ? x + width : x
                }
                else {
                    xCoord = x + width / 2;
                    if (invertedY)
                        yCoord = isPositive ? y + height : y;
                    else
                        yCoord = isPositive ? y : y + height
                }
                return {
                        x: xCoord,
                        y: yCoord,
                        offset: 0
                    }
            },
            getTooltipParams: function(location) {
                var x = this.x,
                    y = this.y,
                    width = this.width,
                    height = this.height;
                return location === 'edge' ? this._getEdgeTooltipParams(x, y, width, height) : {
                        x: x + width / 2,
                        y: y + height / 2,
                        offset: 0
                    }
            },
            _truncateCoord: function(coord, minBounce, maxBounce) {
                if (coord < minBounce)
                    return minBounce;
                if (coord > maxBounce)
                    return maxBounce;
                return coord
            },
            _translateErrorBars: function(valueTranslator, argVisibleArea) {
                points.symbolPoint._translateErrorBars.call(this, valueTranslator);
                if (this._errorBarPos < argVisibleArea.min || this._errorBarPos > argVisibleArea.max)
                    this._errorBarPos = undefined
            },
            _translate: function(translators) {
                var that = this,
                    rotated = that._options.rotated,
                    valAxis = rotated ? "x" : "y",
                    argAxis = rotated ? "y" : "x",
                    valIntervalName = rotated ? "width" : "height",
                    argIntervalName = rotated ? "height" : "width",
                    argTranslator = translators[argAxis],
                    valTranslator = translators[valAxis],
                    argVisibleArea = argTranslator.getCanvasVisibleArea(),
                    valVisibleArea = valTranslator.getCanvasVisibleArea(),
                    arg,
                    minArg,
                    val,
                    minVal;
                arg = minArg = argTranslator.translate(that.argument) + (that[argAxis + "Correction"] || 0);
                val = valTranslator.translate(that.value);
                minVal = valTranslator.translate(that.minValue);
                that["v" + valAxis] = val;
                that["v" + argAxis] = arg + that[argIntervalName] / 2;
                that[valIntervalName] = _abs(val - minVal);
                that._calculateVisibility(rotated ? _min(val, minVal) : _min(arg, minArg), rotated ? _min(arg, minArg) : _min(val, minVal), that.width, that.height);
                val = that._truncateCoord(val, valVisibleArea.min, valVisibleArea.max);
                minVal = that._truncateCoord(minVal, valVisibleArea.min, valVisibleArea.max);
                that[argAxis] = arg;
                that["min" + argAxis.toUpperCase()] = minArg;
                that[valIntervalName] = _abs(val - minVal);
                that[valAxis] = _min(val, minVal) + (that[valAxis + "Correction"] || 0);
                that["min" + valAxis.toUpperCase()] = minVal + (that[valAxis + "Correction"] || 0);
                that["default" + valAxis.toUpperCase()] = valTranslator.translate(CANVAS_POSITION_DEFAULT);
                that._translateErrorBars(valTranslator, argVisibleArea);
                if (that.inVisibleArea) {
                    if (that[argAxis] < argVisibleArea.min) {
                        that[argIntervalName] = that[argIntervalName] - (argVisibleArea.min - that[argAxis]);
                        that[argAxis] = argVisibleArea.min;
                        that["min" + argAxis.toUpperCase()] = argVisibleArea.min
                    }
                    if (that[argAxis] + that[argIntervalName] > argVisibleArea.max)
                        that[argIntervalName] = argVisibleArea.max - that[argAxis]
                }
            },
            _updateMarker: function(animationEnabled, style) {
                this.graphic.attr(_extend({}, style || this._getStyle(), !animationEnabled ? this.getMarkerCoords() : {}))
            },
            getMarkerCoords: function() {
                return {
                        x: this.x,
                        y: this.y,
                        width: this.width,
                        height: this.height
                    }
            },
            coordsIn: function(x, y) {
                var that = this;
                return x >= that.x && x <= that.x + that.width && y >= that.y && y <= that.y + that.height
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file bubblePoint.js */
    (function($, DX) {
        var points = DX.viz.series.points.mixins,
            _extend = $.extend,
            MIN_BUBBLE_HEIGHT = 20;
        points.bubblePoint = _extend({}, points.symbolPoint, {
            correctCoordinates: function(diameter) {
                this.bubbleSize = diameter / 2
            },
            _drawMarker: function(renderer, group, animationEnabled) {
                var that = this,
                    attr = _extend({
                        translateX: that.x,
                        translateY: that.y
                    }, that._getStyle());
                that.graphic = renderer.circle(0, 0, animationEnabled ? 0 : that.bubbleSize).attr(attr).data({"chart-data-point": that}).append(group)
            },
            getTooltipParams: function(location) {
                var that = this,
                    graphic = that.graphic,
                    height;
                if (!graphic)
                    return;
                height = graphic.getBBox().height;
                return {
                        x: that.x,
                        y: height < MIN_BUBBLE_HEIGHT || location === 'edge' ? this.y - height / 2 : this.y,
                        offset: 0
                    }
            },
            _getLabelFormatObject: function() {
                var formatObject = points.symbolPoint._getLabelFormatObject.call(this);
                formatObject.size = this.initialSize;
                return formatObject
            },
            _updateData: function(data) {
                points.symbolPoint._updateData.call(this, data);
                this.size = this.initialSize = data.size
            },
            _getGraphicBbox: function() {
                var that = this;
                return that._getSymbolBbox(that.x, that.y, that.bubbleSize)
            },
            _updateMarker: function(animationEnabled, style) {
                var that = this;
                style = style || that._getStyle();
                if (!animationEnabled)
                    style = $.extend({
                        r: that.bubbleSize,
                        translateX: that.x,
                        translateY: that.y
                    }, style);
                that.graphic.attr(style)
            },
            _getFormatObject: function(tooltip) {
                var formatObject = points.symbolPoint._getFormatObject.call(this, tooltip);
                formatObject.sizeText = tooltip.formatValue(this.initialSize);
                return formatObject
            },
            _storeTrackerR: function() {
                return this.bubbleSize
            },
            _getLabelCoords: function(label) {
                var coords;
                if (label.getLayoutOptions().position === "inside")
                    coords = this._getLabelCoordOfPosition(label, "inside");
                else
                    coords = points.symbolPoint._getLabelCoords.call(this, label);
                return coords
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file piePoint.js */
    (function($, DX) {
        var CONNECTOR_LENGTH = 20,
            viz = DX.viz,
            series = viz.series,
            points = series.points.mixins,
            _extend = $.extend,
            _round = Math.round,
            _sqrt = Math.sqrt,
            _acos = Math.acos,
            DEG = 180 / Math.PI,
            _abs = Math.abs,
            mathUtils = DX.require("/utils/utils.math"),
            _normalizeAngle = mathUtils.normalizeAngle,
            _getCosAndSin = mathUtils.getCosAndSin,
            commonUtils = DX.require("/utils/utils.common"),
            _isDefined = commonUtils.isDefined,
            INDENT_FROM_PIE = series.helpers.consts.pieLabelIndent;
        function getVerticallyShiftedAngularCoords(bbox, dy, center) {
            var isPositive = bbox.x + bbox.width / 2 >= center.x,
                dx1 = (isPositive ? bbox.x : bbox.x + bbox.width) - center.x,
                dy1 = bbox.y - center.y,
                dy2 = dy1 + dy,
                dx2 = _round(_sqrt(dx1 * dx1 + dy1 * dy1 - dy2 * dy2)),
                dx = (isPositive ? +dx2 : -dx2) || dx1;
            return {
                    x: center.x + (isPositive ? dx : dx - bbox.width),
                    y: bbox.y + dy
                }
        }
        viz.utils.getVerticallyShiftedAngularCoords = getVerticallyShiftedAngularCoords;
        points.piePoint = _extend({}, points.symbolPoint, {
            _updateData: function(data) {
                var that = this;
                points.symbolPoint._updateData.call(this, data);
                that._visible = true;
                that.minValue = that.initialMinValue = that.originalMinValue = _isDefined(data.minValue) ? data.minValue : 0
            },
            animate: function(complete, duration, step) {
                var that = this;
                that.graphic.animate({
                    x: that.centerX,
                    y: that.centerY,
                    outerRadius: that.radiusOuter,
                    innerRadius: that.radiusInner,
                    startAngle: that.toAngle,
                    endAngle: that.fromAngle
                }, {
                    partitionDuration: duration,
                    step: step
                }, complete)
            },
            correctPosition: function(correction) {
                var that = this;
                that.correctRadius(correction);
                that.correctLabelRadius(correction.radiusOuter);
                that.centerX = correction.centerX;
                that.centerY = correction.centerY
            },
            correctRadius: function(correction) {
                this.radiusInner = correction.radiusInner;
                this.radiusOuter = correction.radiusOuter
            },
            correctLabelRadius: function(radiusLabels) {
                this.radiusLabels = radiusLabels
            },
            correctValue: function(correction, percent, base) {
                var that = this;
                that.value = (base || that.initialValue) + correction;
                that.minValue = correction;
                that.percent = percent;
                that._label.setDataField("percent", percent)
            },
            _updateLabelData: function() {
                this._label.setData(this._getLabelFormatObject())
            },
            _getShiftLabelCoords: function() {
                var that = this,
                    bbox = that._label.getBoundingRect(),
                    coord = that._getLabelCoords(that._label),
                    visibleArea = that._getVisibleArea();
                if (that._isLabelDrawingWithoutPoints)
                    return that._checkLabelPosition(coord, bbox, visibleArea);
                else
                    return that._getLabelExtraCoord(coord, that._checkVerticalLabelPosition(coord, bbox, visibleArea), bbox)
            },
            _getLabelPosition: function(options) {
                return options.position
            },
            _getLabelCoords: function(label) {
                var that = this,
                    bbox = label.getBoundingRect(),
                    options = label.getLayoutOptions(),
                    angleFunctions = _getCosAndSin(that.middleAngle),
                    position = that._getLabelPosition(options),
                    radiusInner = that.radiusInner,
                    radiusOuter = that.radiusOuter,
                    radiusLabels = that.radiusLabels,
                    rad,
                    x;
                if (position === 'inside') {
                    rad = radiusInner + (radiusOuter - radiusInner) / 2 + options.radialOffset;
                    x = that.centerX + rad * angleFunctions.cos - bbox.width / 2
                }
                else {
                    rad = radiusLabels + options.radialOffset + INDENT_FROM_PIE;
                    if (angleFunctions.cos > 0.1)
                        x = that.centerX + rad * angleFunctions.cos;
                    else if (angleFunctions.cos < -0.1)
                        x = that.centerX + rad * angleFunctions.cos - bbox.width;
                    else
                        x = that.centerX + rad * angleFunctions.cos - bbox.width / 2
                }
                return {
                        x: x,
                        y: _round(that.centerY - rad * angleFunctions.sin - bbox.height / 2)
                    }
            },
            _getColumnsCoord: function(coord) {
                var that = this,
                    label = that._label,
                    bbox = label.getBoundingRect(),
                    options = label.getLayoutOptions(),
                    rad = that.radiusLabels + options.radialOffset,
                    visibleArea = that._getVisibleArea(),
                    rightBorderX = visibleArea.maxX - bbox.width,
                    leftBorderX = visibleArea.minX,
                    angleOfPoint = _normalizeAngle(that.middleAngle),
                    x;
                if (options.position !== 'columns')
                    return coord;
                rad += CONNECTOR_LENGTH;
                if (angleOfPoint < 90 || angleOfPoint >= 270) {
                    x = that._maxLabelLength ? that.centerX + rad + that._maxLabelLength - bbox.width : rightBorderX;
                    x = x > rightBorderX ? rightBorderX : x
                }
                else {
                    x = that._maxLabelLength ? that.centerX - rad - that._maxLabelLength : leftBorderX;
                    x = x < leftBorderX ? leftBorderX : x
                }
                coord.x = x;
                return coord
            },
            drawLabel: function(translators) {
                this.translate(translators);
                this._isLabelDrawingWithoutPoints = true;
                this._drawLabel();
                this._isLabelDrawingWithoutPoints = false
            },
            updateLabelCoord: function() {
                var that = this,
                    bbox = that._label.getBoundingRect(),
                    coord = that._getColumnsCoord(bbox);
                coord = that._checkHorizontalLabelPosition(coord, bbox, that._getVisibleArea());
                that._label.shift(_round(coord.x), _round(bbox.y))
            },
            _checkVerticalLabelPosition: function(coord, box, visibleArea) {
                var x = coord.x,
                    y = coord.y;
                if (coord.y + box.height > visibleArea.maxY)
                    y = visibleArea.maxY - box.height;
                else if (coord.y < visibleArea.minY)
                    y = visibleArea.minY;
                return {
                        x: x,
                        y: y
                    }
            },
            _getLabelExtraCoord: function(coord, shiftCoord, box) {
                return coord.y !== shiftCoord.y ? getVerticallyShiftedAngularCoords({
                        x: coord.x,
                        y: coord.y,
                        width: box.width,
                        height: box.height
                    }, shiftCoord.y - coord.y, {
                        x: this.centerX,
                        y: this.centerY
                    }) : coord
            },
            _checkHorizontalLabelPosition: function(coord, box, visibleArea) {
                var x = coord.x,
                    y = coord.y;
                if (coord.x + box.width > visibleArea.maxX)
                    x = visibleArea.maxX - box.width;
                else if (coord.x < visibleArea.minX)
                    x = visibleArea.minX;
                return {
                        x: x,
                        y: y
                    }
            },
            setLabelEllipsis: function() {
                var that = this,
                    bbox = that._label.getBoundingRect(),
                    coord = that._checkHorizontalLabelPosition(bbox, bbox, that._getVisibleArea());
                that._label.fit(bbox.width - _abs(coord.x - bbox.x))
            },
            setLabelTrackerData: function() {
                this._label.setTrackerData(this)
            },
            _checkLabelPosition: function(coord, bbox, visibleArea) {
                coord = this._checkHorizontalLabelPosition(coord, bbox, visibleArea);
                return this._checkVerticalLabelPosition(coord, bbox, visibleArea)
            },
            getBoundaryCoords: function() {
                var that = this,
                    rad = that.radiusOuter,
                    seriesStyle = that._options.styles.normal,
                    strokeWidthBy2 = seriesStyle["stroke-width"] / 2,
                    borderWidth = that.series.getOptions().containerBackgroundColor === seriesStyle.stroke ? _round(strokeWidthBy2) : _round(-strokeWidthBy2),
                    angleFunctions = _getCosAndSin(_round(that.middleAngle));
                return {
                        x: _round(that.centerX + (rad - borderWidth) * angleFunctions.cos),
                        y: _round(that.centerY - (rad - borderWidth) * angleFunctions.sin)
                    }
            },
            _getLabelConnector: function() {
                var coords = this.getBoundaryCoords();
                coords.angle = this.middleAngle;
                return coords
            },
            _drawMarker: function(renderer, group, animationEnabled, firstDrawing) {
                var that = this,
                    radiusOuter = that.radiusOuter,
                    radiusInner = that.radiusInner,
                    fromAngle = that.fromAngle,
                    toAngle = that.toAngle;
                if (animationEnabled) {
                    radiusInner = radiusOuter = 0;
                    if (!firstDrawing)
                        fromAngle = toAngle = that.shiftedAngle
                }
                that.graphic = renderer.arc(that.centerX, that.centerY, radiusInner, radiusOuter, toAngle, fromAngle).attr({"stroke-linejoin": "round"}).attr(that._getStyle()).data({"chart-data-point": that}).sharp().append(group)
            },
            getTooltipParams: function() {
                var that = this,
                    angleFunctions = _getCosAndSin(that.middleAngle),
                    radiusInner = that.radiusInner,
                    radiusOuter = that.radiusOuter;
                return {
                        x: that.centerX + (radiusInner + (radiusOuter - radiusInner) / 2) * angleFunctions.cos,
                        y: that.centerY - (radiusInner + (radiusOuter - radiusInner) / 2) * angleFunctions.sin,
                        offset: 0
                    }
            },
            _translate: function(translator) {
                var that = this,
                    angle = that.shiftedAngle || 0,
                    value = that.value,
                    minValue = that.minValue;
                that.fromAngle = translator.translate(minValue) + angle;
                that.toAngle = translator.translate(value) + angle;
                that.middleAngle = translator.translate((value - minValue) / 2 + minValue) + angle;
                if (!that.isVisible())
                    that.middleAngle = that.toAngle = that.fromAngle = that.fromAngle || angle
            },
            _getMarkerVisibility: function() {
                return true
            },
            _updateMarker: function(animationEnabled, style) {
                var that = this;
                style = style || that._getStyle();
                if (!animationEnabled)
                    style = _extend({
                        x: that.centerX,
                        y: that.centerY,
                        outerRadius: that.radiusOuter,
                        innerRadius: that.radiusInner,
                        startAngle: that.toAngle,
                        endAngle: that.fromAngle
                    }, style);
                that.graphic.attr(style).sharp()
            },
            getLegendStyles: function() {
                return this._styles.legendStyles
            },
            isInVisibleArea: function() {
                return true
            },
            hide: function() {
                var that = this;
                if (that._visible) {
                    that._visible = false;
                    that.hideTooltip();
                    that._options.visibilityChanged(that)
                }
            },
            show: function() {
                var that = this;
                if (!that._visible) {
                    that._visible = true;
                    that._options.visibilityChanged(that)
                }
            },
            setInvisibility: function() {
                this._label.hide()
            },
            isVisible: function() {
                return this._visible
            },
            _getFormatObject: function(tooltip) {
                var formatObject = points.symbolPoint._getFormatObject.call(this, tooltip),
                    percent = this.percent;
                formatObject.percent = percent;
                formatObject.percentText = tooltip.formatValue(percent, "percent");
                return formatObject
            },
            getColor: function() {
                return this._styles.normal.fill
            },
            coordsIn: function(x, y) {
                var that = this,
                    lx = x - that.centerX,
                    ly = y - that.centerY,
                    r = _sqrt(lx * lx + ly * ly),
                    fromAngle = that.fromAngle % 360,
                    toAngle = that.toAngle % 360,
                    angle;
                if (r < that.radiusInner || r > that.radiusOuter || r === 0)
                    return false;
                angle = _acos(lx / r) * DEG * (ly > 0 ? -1 : 1);
                if (angle < 0)
                    angle += 360;
                if (fromAngle === toAngle && _abs(that.toAngle - that.fromAngle) > 1E-4)
                    return true;
                else
                    return fromAngle >= toAngle ? angle <= fromAngle && angle >= toAngle : !(angle >= fromAngle && angle <= toAngle)
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeSymbolPoint.js */
    (function($, DX) {
        var viz = DX.viz,
            points = viz.series.points.mixins,
            commonUtils = DX.require("/utils/utils.common"),
            _extend = $.extend,
            _isDefined = commonUtils.isDefined,
            _math = Math,
            _abs = _math.abs,
            _min = _math.min,
            _max = _math.max,
            _round = _math.round,
            DEFAULT_IMAGE_WIDTH = 20,
            DEFAULT_IMAGE_HEIGHT = 20;
        points.rangeSymbolPoint = _extend({}, points.symbolPoint, {
            deleteLabel: function() {
                var that = this;
                that._topLabel.dispose();
                that._topLabel = null;
                that._bottomLabel.dispose();
                that._bottomLabel = null
            },
            hideMarker: function(type) {
                var graphic = this.graphic,
                    marker = graphic && graphic[type + "Marker"],
                    label = this["_" + type + "Label"];
                if (marker && marker.attr("visibility") !== "hidden")
                    marker.attr({visibility: "hidden"});
                label.hide()
            },
            setInvisibility: function() {
                this.hideMarker("top");
                this.hideMarker("bottom")
            },
            clearVisibility: function() {
                var that = this,
                    graphic = that.graphic,
                    topMarker = graphic && graphic.topMarker,
                    bottomMarker = graphic && graphic.bottomMarker;
                if (topMarker && topMarker.attr("visibility"))
                    topMarker.attr({visibility: null});
                if (bottomMarker && bottomMarker.attr("visibility"))
                    bottomMarker.attr({visibility: null});
                that._topLabel.clearVisibility();
                that._bottomLabel.clearVisibility()
            },
            clearMarker: function() {
                var that = this,
                    graphic = that.graphic,
                    topMarker = graphic && graphic.topMarker,
                    bottomMarker = graphic && graphic.bottomMarker,
                    emptySettings = that._emptySettings;
                topMarker && topMarker.attr(emptySettings);
                bottomMarker && bottomMarker.attr(emptySettings)
            },
            _getLabelPosition: function(markerType) {
                var position,
                    labelsInside = this._options.label.position === "inside";
                if (!this._options.rotated)
                    position = markerType === "top" ^ labelsInside ? "top" : "bottom";
                else
                    position = markerType === "top" ^ labelsInside ? "right" : "left";
                return position
            },
            _getLabelMinFormatObject: function() {
                var that = this;
                return {
                        index: 0,
                        argument: that.initialArgument,
                        value: that.initialMinValue,
                        seriesName: that.series.name,
                        originalValue: that.originalMinValue,
                        originalArgument: that.originalArgument,
                        point: that
                    }
            },
            _updateLabelData: function() {
                var maxFormatObject = this._getLabelFormatObject();
                maxFormatObject.index = 1;
                this._topLabel.setData(maxFormatObject);
                this._bottomLabel.setData(this._getLabelMinFormatObject())
            },
            _updateLabelOptions: function() {
                var that = this,
                    options = this._options.label;
                (!that._topLabel || !that._bottomLabel) && that._createLabel();
                that._topLabel.setOptions(options);
                that._bottomLabel.setOptions(options)
            },
            _createLabel: function() {
                var options = {
                        renderer: this.series._renderer,
                        labelsGroup: this.series._labelsGroup,
                        point: this
                    };
                this._topLabel = viz.CoreFactory.createLabel(options);
                this._bottomLabel = viz.CoreFactory.createLabel(options)
            },
            _getGraphicBbox: function(location) {
                var options = this._options,
                    images = this._getImage(options.image),
                    image = location === "top" ? this._checkImage(images.top) : this._checkImage(images.bottom),
                    bbox,
                    coord = this._getPositionFromLocation(location);
                if (options.visible)
                    bbox = image ? this._getImageBbox(coord.x, coord.y) : this._getSymbolBbox(coord.x, coord.y, options.styles.normal.r);
                else
                    bbox = {
                        x: coord.x,
                        y: coord.y,
                        width: 0,
                        height: 0
                    };
                return bbox
            },
            _getPositionFromLocation: function(location) {
                var x,
                    y,
                    isTop = location === "top";
                if (!this._options.rotated) {
                    x = this.x;
                    y = isTop ? _min(this.y, this.minY) : _max(this.y, this.minY)
                }
                else {
                    x = isTop ? _max(this.x, this.minX) : _min(this.x, this.minX);
                    y = this.y
                }
                return {
                        x: x,
                        y: y
                    }
            },
            _checkOverlay: function(bottomCoord, topCoord, topValue) {
                return bottomCoord < topCoord + topValue
            },
            _getOverlayCorrections: function(type, topCoords, bottomCoords) {
                var isVertical = type === "vertical",
                    coordSelector = isVertical ? "y" : "x",
                    valueSelector = isVertical ? "height" : "width",
                    visibleArea = this.translators[coordSelector].getCanvasVisibleArea(),
                    minBound = visibleArea.min,
                    maxBound = visibleArea.max,
                    delta = _round((topCoords[coordSelector] + topCoords[valueSelector] - bottomCoords[coordSelector]) / 2),
                    coord1 = topCoords[coordSelector] - delta,
                    coord2 = bottomCoords[coordSelector] + delta;
                if (coord1 < minBound) {
                    delta = minBound - topCoords[coordSelector];
                    coord1 += delta;
                    coord2 += delta
                }
                else if (coord2 + bottomCoords[valueSelector] > maxBound) {
                    delta = -(bottomCoords[coordSelector] + bottomCoords[valueSelector] - maxBound);
                    coord1 += delta;
                    coord2 += delta
                }
                return {
                        coord1: coord1,
                        coord2: coord2
                    }
            },
            _checkLabelsOverlay: function(topLocation) {
                var that = this,
                    topCoords = that._topLabel.getBoundingRect(),
                    bottomCoords = that._bottomLabel.getBoundingRect(),
                    corrections = {};
                if (!that._options.rotated) {
                    if (topLocation === "top") {
                        if (this._checkOverlay(bottomCoords.y, topCoords.y, topCoords.height)) {
                            corrections = this._getOverlayCorrections("vertical", topCoords, bottomCoords);
                            that._topLabel.shift(topCoords.x, corrections.coord1);
                            that._bottomLabel.shift(bottomCoords.x, corrections.coord2)
                        }
                    }
                    else if (this._checkOverlay(topCoords.y, bottomCoords.y, bottomCoords.height)) {
                        corrections = this._getOverlayCorrections("vertical", bottomCoords, topCoords);
                        that._topLabel.shift(topCoords.x, corrections.coord2);
                        that._bottomLabel.shift(bottomCoords.x, corrections.coord1)
                    }
                }
                else if (topLocation === "top") {
                    if (this._checkOverlay(topCoords.x, bottomCoords.x, bottomCoords.width)) {
                        corrections = this._getOverlayCorrections("horizontal", bottomCoords, topCoords);
                        that._topLabel.shift(corrections.coord2, topCoords.y);
                        that._bottomLabel.shift(corrections.coord1, bottomCoords.y)
                    }
                }
                else if (this._checkOverlay(bottomCoords.x, topCoords.x, topCoords.width)) {
                    corrections = this._getOverlayCorrections("horizontal", topCoords, bottomCoords);
                    that._topLabel.shift(corrections.coord1, topCoords.y);
                    that._bottomLabel.shift(corrections.coord2, bottomCoords.y)
                }
            },
            _drawLabel: function() {
                var that = this,
                    labels = [],
                    notInverted = that._options.rotated ? that.x >= that.minX : that.y < that.minY,
                    customVisibility = that._getCustomLabelVisibility(),
                    topLabel = that._topLabel,
                    bottomLabel = that._bottomLabel;
                topLabel.pointPosition = notInverted ? "top" : "bottom";
                bottomLabel.pointPosition = notInverted ? "bottom" : "top";
                if ((that.series.getLabelVisibility() || customVisibility) && that.hasValue()) {
                    that.visibleTopMarker !== false && labels.push(topLabel);
                    that.visibleBottomMarker !== false && labels.push(bottomLabel);
                    $.each(labels, function(_, label) {
                        label.show()
                    });
                    that._checkLabelsOverlay(that._topLabel.pointPosition)
                }
                else {
                    topLabel.hide();
                    bottomLabel.hide()
                }
            },
            _getImage: function(imageOption) {
                var image = {};
                if (_isDefined(imageOption))
                    if (typeof imageOption === "string")
                        image.top = image.bottom = imageOption;
                    else {
                        image.top = {
                            url: typeof imageOption.url === "string" ? imageOption.url : imageOption.url && imageOption.url.rangeMaxPoint,
                            width: typeof imageOption.width === "number" ? imageOption.width : imageOption.width && imageOption.width.rangeMaxPoint,
                            height: typeof imageOption.height === "number" ? imageOption.height : imageOption.height && imageOption.height.rangeMaxPoint
                        };
                        image.bottom = {
                            url: typeof imageOption.url === "string" ? imageOption.url : imageOption.url && imageOption.url.rangeMinPoint,
                            width: typeof imageOption.width === "number" ? imageOption.width : imageOption.width && imageOption.width.rangeMinPoint,
                            height: typeof imageOption.height === "number" ? imageOption.height : imageOption.height && imageOption.height.rangeMinPoint
                        }
                    }
                return image
            },
            _checkSymbol: function(oldOptions, newOptions) {
                var that = this,
                    oldSymbol = oldOptions.symbol,
                    newSymbol = newOptions.symbol,
                    symbolChanged = oldSymbol === "circle" && newSymbol !== "circle" || oldSymbol !== "circle" && newSymbol === "circle",
                    oldImages = that._getImage(oldOptions.image),
                    newImages = that._getImage(newOptions.image),
                    topImageChanged = that._checkImage(oldImages.top) !== that._checkImage(newImages.top),
                    bottomImageChanged = that._checkImage(oldImages.bottom) !== that._checkImage(newImages.bottom);
                return symbolChanged || topImageChanged || bottomImageChanged
            },
            _getSettingsForTwoMarkers: function(style) {
                var that = this,
                    options = that._options,
                    settings = {},
                    x = options.rotated ? _min(that.x, that.minX) : that.x,
                    y = options.rotated ? that.y : _min(that.y, that.minY),
                    radius = style.r,
                    points = that._populatePointShape(options.symbol, radius);
                settings.top = _extend({
                    translateX: x + that.width,
                    translateY: y,
                    r: radius
                }, style);
                settings.bottom = _extend({
                    translateX: x,
                    translateY: y + that.height,
                    r: radius
                }, style);
                if (points)
                    settings.top.points = settings.bottom.points = points;
                return settings
            },
            _hasGraphic: function() {
                return this.graphic && this.graphic.topMarker && this.graphic.bottomMarker
            },
            _drawOneMarker: function(renderer, markerType, imageSettings, settings) {
                var that = this,
                    graphic = that.graphic;
                if (graphic[markerType])
                    that._updateOneMarker(markerType, settings);
                else
                    graphic[markerType] = that._createMarker(renderer, graphic, imageSettings, settings)
            },
            _drawMarker: function(renderer, group, animationEnabled, firstDrawing, style) {
                var that = this,
                    settings = that._getSettingsForTwoMarkers(style || that._getStyle()),
                    image = that._getImage(that._options.image);
                if (that._checkImage(image.top))
                    settings.top = that._getImageSettings(settings.top, image.top);
                if (that._checkImage(image.bottom))
                    settings.bottom = that._getImageSettings(settings.bottom, image.bottom);
                that.graphic = that.graphic || renderer.g().append(group);
                that.visibleTopMarker && that._drawOneMarker(renderer, 'topMarker', image.top, settings.top);
                that.visibleBottomMarker && that._drawOneMarker(renderer, 'bottomMarker', image.bottom, settings.bottom)
            },
            _getSettingsForTracker: function(radius) {
                var that = this,
                    rotated = that._options.rotated;
                return {
                        translateX: rotated ? _min(that.x, that.minX) - radius : that.x - radius,
                        translateY: rotated ? that.y - radius : _min(that.y, that.minY) - radius,
                        width: that.width + 2 * radius,
                        height: that.height + 2 * radius
                    }
            },
            isInVisibleArea: function() {
                var that = this,
                    rotated = that._options.rotated,
                    argument = !rotated ? that.x : that.y,
                    maxValue = !rotated ? _max(that.minY, that.y) : _max(that.minX, that.x),
                    minValue = !rotated ? _min(that.minY, that.y) : _min(that.minX, that.x),
                    translators = that.translators,
                    notVisibleByArg,
                    notVisibleByVal,
                    tmp,
                    visibleTopMarker = true,
                    visibleBottomMarker = true,
                    visibleRangeArea = true,
                    visibleArgArea,
                    visibleValArea;
                if (translators) {
                    visibleArgArea = translators[!rotated ? "x" : "y"].getCanvasVisibleArea();
                    visibleValArea = translators[!rotated ? "y" : "x"].getCanvasVisibleArea();
                    notVisibleByArg = visibleArgArea.max < argument || visibleArgArea.min > argument;
                    notVisibleByVal = visibleValArea.min > minValue && visibleValArea.min > maxValue || visibleValArea.max < minValue && visibleValArea.max < maxValue;
                    if (notVisibleByArg || notVisibleByVal)
                        visibleTopMarker = visibleBottomMarker = visibleRangeArea = false;
                    else {
                        visibleTopMarker = visibleValArea.min <= minValue && visibleValArea.max > minValue;
                        visibleBottomMarker = visibleValArea.min < maxValue && visibleValArea.max >= maxValue;
                        if (rotated) {
                            tmp = visibleTopMarker;
                            visibleTopMarker = visibleBottomMarker;
                            visibleBottomMarker = tmp
                        }
                    }
                }
                that.visibleTopMarker = visibleTopMarker;
                that.visibleBottomMarker = visibleBottomMarker;
                return visibleRangeArea
            },
            getTooltipParams: function() {
                var that = this,
                    x,
                    y,
                    min,
                    max,
                    minValue,
                    translators = that.translators,
                    visibleAreaX = translators.x.getCanvasVisibleArea(),
                    visibleAreaY = translators.y.getCanvasVisibleArea();
                if (!that._options.rotated) {
                    minValue = _min(that.y, that.minY);
                    x = that.x;
                    min = visibleAreaY.min > minValue ? visibleAreaY.min : minValue;
                    max = visibleAreaY.max < minValue + that.height ? visibleAreaY.max : minValue + that.height;
                    y = min + (max - min) / 2
                }
                else {
                    minValue = _min(that.x, that.minX);
                    y = that.y;
                    min = visibleAreaX.min > minValue ? visibleAreaX.min : minValue;
                    max = visibleAreaX.max < minValue + that.width ? visibleAreaX.max : minValue + that.width;
                    x = min + (max - min) / 2
                }
                return {
                        x: x,
                        y: y,
                        offset: 0
                    }
            },
            _translate: function(translators) {
                var that = this,
                    rotated = that._options.rotated;
                that.minX = that.minY = translators.y.translate(that.minValue);
                points.symbolPoint._translate.call(that, translators);
                that.height = rotated ? 0 : _abs(that.minY - that.y);
                that.width = rotated ? _abs(that.x - that.minX) : 0
            },
            _updateData: function(data) {
                var that = this;
                points.symbolPoint._updateData.call(that, data);
                that.minValue = that.initialMinValue = that.originalMinValue = data.minValue
            },
            _getImageSettings: function(settings, image) {
                return {
                        href: image.url || image.toString(),
                        width: image.width || DEFAULT_IMAGE_WIDTH,
                        height: image.height || DEFAULT_IMAGE_HEIGHT,
                        translateX: settings.translateX,
                        translateY: settings.translateY
                    }
            },
            getCrosshairData: function(x, y) {
                var that = this,
                    rotated = that._options.rotated,
                    minX = that.minX,
                    minY = that.minY,
                    vx = that.vx,
                    vy = that.vy,
                    value = that.value,
                    minValue = that.minValue,
                    argument = that.argument,
                    coords = {
                        axis: that.series.axis,
                        x: vx,
                        y: vy,
                        yValue: value,
                        xValue: argument
                    };
                if (rotated) {
                    coords.yValue = argument;
                    if (_abs(vx - x) < _abs(minX - x))
                        coords.xValue = value;
                    else {
                        coords.x = minX;
                        coords.xValue = minValue
                    }
                }
                else if (_abs(vy - y) >= _abs(minY - y)) {
                    coords.y = minY;
                    coords.yValue = minValue
                }
                return coords
            },
            _updateOneMarker: function(markerType, settings) {
                this.graphic && this.graphic[markerType] && this.graphic[markerType].attr(settings)
            },
            _updateMarker: function(animationEnabled, style) {
                this._drawMarker(undefined, undefined, false, false, style)
            },
            _getFormatObject: function(tooltip) {
                var that = this,
                    initialMinValue = that.initialMinValue,
                    initialValue = that.initialValue,
                    initialArgument = that.initialArgument,
                    minValue = tooltip.formatValue(initialMinValue),
                    value = tooltip.formatValue(initialValue);
                return {
                        argument: initialArgument,
                        argumentText: tooltip.formatValue(initialArgument, "argument"),
                        valueText: minValue + " - " + value,
                        rangeValue1Text: minValue,
                        rangeValue2Text: value,
                        rangeValue1: initialMinValue,
                        rangeValue2: initialValue,
                        seriesName: that.series.name,
                        point: that,
                        originalMinValue: that.originalMinValue,
                        originalValue: that.originalValue,
                        originalArgument: that.originalArgument
                    }
            },
            getLabel: function() {
                return [this._topLabel, this._bottomLabel]
            },
            getBoundingRect: $.noop,
            coordsIn: function(x, y) {
                var trackerRadius = this._storeTrackerR(),
                    xCond = x >= this.x - trackerRadius && x <= this.x + trackerRadius,
                    yCond = y >= this.y - trackerRadius && y <= this.y + trackerRadius;
                if (this._options.rotated)
                    return yCond && (xCond || x >= this.minX - trackerRadius && x <= this.minX + trackerRadius);
                else
                    return xCond && (yCond || y >= this.minY - trackerRadius && y <= this.minY + trackerRadius)
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeBarPoint.js */
    (function($, DX) {
        var points = DX.viz.series.points.mixins,
            rangeSymbolPointMethods = points.rangeSymbolPoint,
            _extend = $.extend;
        points.rangeBarPoint = _extend({}, points.barPoint, {
            deleteLabel: rangeSymbolPointMethods.deleteLabel,
            _getFormatObject: rangeSymbolPointMethods._getFormatObject,
            clearVisibility: function() {
                var graphic = this.graphic;
                if (graphic && graphic.attr("visibility"))
                    graphic.attr({visibility: null});
                this._topLabel.clearVisibility();
                this._bottomLabel.clearVisibility()
            },
            setInvisibility: function() {
                var graphic = this.graphic;
                if (graphic && graphic.attr("visibility") !== "hidden")
                    graphic.attr({visibility: "hidden"});
                this._topLabel.hide();
                this._bottomLabel.hide()
            },
            getTooltipParams: function(location) {
                var that = this,
                    edgeLocation = location === 'edge',
                    x,
                    y;
                if (that._options.rotated) {
                    x = edgeLocation ? that.x + that.width : that.x + that.width / 2;
                    y = that.y + that.height / 2
                }
                else {
                    x = that.x + that.width / 2;
                    y = edgeLocation ? that.y : that.y + that.height / 2
                }
                return {
                        x: x,
                        y: y,
                        offset: 0
                    }
            },
            _translate: function(translator) {
                var that = this,
                    barMethods = points.barPoint;
                barMethods._translate.call(that, translator);
                if (that._options.rotated)
                    that.width = that.width || 1;
                else
                    that.height = that.height || 1
            },
            _updateData: rangeSymbolPointMethods._updateData,
            _getLabelPosition: rangeSymbolPointMethods._getLabelPosition,
            _getLabelMinFormatObject: rangeSymbolPointMethods._getLabelMinFormatObject,
            _updateLabelData: rangeSymbolPointMethods._updateLabelData,
            _updateLabelOptions: rangeSymbolPointMethods._updateLabelOptions,
            getCrosshairData: rangeSymbolPointMethods.getCrosshairData,
            _createLabel: rangeSymbolPointMethods._createLabel,
            _checkOverlay: rangeSymbolPointMethods._checkOverlay,
            _checkLabelsOverlay: rangeSymbolPointMethods._checkLabelsOverlay,
            _getOverlayCorrections: rangeSymbolPointMethods._getOverlayCorrections,
            _drawLabel: rangeSymbolPointMethods._drawLabel,
            _getLabelCoords: rangeSymbolPointMethods._getLabelCoords,
            _getGraphicBbox: function(location) {
                var isTop = location === "top",
                    bbox = points.barPoint._getGraphicBbox.call(this);
                if (!this._options.rotated) {
                    bbox.y = isTop ? bbox.y : bbox.y + bbox.height;
                    bbox.height = 0
                }
                else {
                    bbox.x = isTop ? bbox.x + bbox.width : bbox.x;
                    bbox.width = 0
                }
                return bbox
            },
            getLabel: rangeSymbolPointMethods.getLabel,
            getBoundingRect: $.noop
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file candlestickPoint.js */
    (function($, DX) {
        var viz = DX.viz,
            points = viz.series.points.mixins,
            _isNumeric = $.isNumeric,
            _extend = $.extend,
            _math = Math,
            _abs = _math.abs,
            _min = _math.min,
            _max = _math.max,
            _round = _math.round,
            DEFAULT_FINANCIAL_TRACKER_MARGIN = 2;
        points.candlestickPoint = _extend({}, points.barPoint, {
            _getContinuousPoints: function(minValueName, maxValueName) {
                var that = this,
                    x = that.x,
                    createPoint = that._options.rotated ? function(x, y) {
                        return [y, x]
                    } : function(x, y) {
                        return [x, y]
                    },
                    width = that.width,
                    min = that[minValueName],
                    max = that[maxValueName],
                    points;
                if (min === max)
                    points = [].concat(createPoint(x, that.highY)).concat(createPoint(x, that.lowY)).concat(createPoint(x, that.closeY)).concat(createPoint(x - width / 2, that.closeY)).concat(createPoint(x + width / 2, that.closeY)).concat(createPoint(x, that.closeY));
                else
                    points = [].concat(createPoint(x, that.highY)).concat(createPoint(x, max)).concat(createPoint(x + width / 2, max)).concat(createPoint(x + width / 2, min)).concat(createPoint(x, min)).concat(createPoint(x, that.lowY)).concat(createPoint(x, min)).concat(createPoint(x - width / 2, min)).concat(createPoint(x - width / 2, max)).concat(createPoint(x, max));
                return points
            },
            _getCategoryPoints: function(y) {
                var that = this,
                    x = that.x,
                    createPoint = that._options.rotated ? function(x, y) {
                        return [y, x]
                    } : function(x, y) {
                        return [x, y]
                    };
                return [].concat(createPoint(x, that.highY)).concat(createPoint(x, that.lowY)).concat(createPoint(x, y)).concat(createPoint(x - that.width / 2, y)).concat(createPoint(x + that.width / 2, y)).concat(createPoint(x, y))
            },
            _getPoints: function() {
                var that = this,
                    points,
                    minValueName,
                    maxValueName,
                    openValue = that.openValue,
                    closeValue = that.closeValue;
                if (_isNumeric(openValue) && _isNumeric(closeValue)) {
                    minValueName = openValue > closeValue ? "closeY" : "openY";
                    maxValueName = openValue > closeValue ? "openY" : "closeY";
                    points = that._getContinuousPoints(minValueName, maxValueName)
                }
                else if (openValue === closeValue)
                    points = [that.x, that.highY, that.x, that.lowY];
                else
                    points = that._getCategoryPoints(_isNumeric(openValue) ? that.openY : that.closeY);
                return points
            },
            getColor: function() {
                var that = this;
                return that._isReduction ? that._options.reduction.color : that._styles.normal.stroke || that.series.getColor()
            },
            _drawMarkerInGroup: function(group, attributes, renderer) {
                var that = this;
                that.graphic = renderer.path(that._getPoints(), "area").attr({"stroke-linecap": "square"}).attr(attributes).data({"chart-data-point": that}).sharp().append(group)
            },
            _fillStyle: function() {
                var that = this,
                    styles = that._options.styles;
                if (that._isReduction && that._isPositive)
                    that._styles = styles.reductionPositive;
                else if (that._isReduction)
                    that._styles = styles.reduction;
                else if (that._isPositive)
                    that._styles = styles.positive;
                else
                    that._styles = styles
            },
            _getMinTrackerWidth: function() {
                return 2 + 2 * this._styles.normal['stroke-width']
            },
            correctCoordinates: function(correctOptions) {
                var minWidth = this._getMinTrackerWidth(),
                    maxWidth = 10,
                    width = correctOptions.width;
                width = width < minWidth ? minWidth : width > maxWidth ? maxWidth : width;
                this.width = width + width % 2;
                this.xCorrection = correctOptions.offset
            },
            _getMarkerGroup: function(group) {
                var that = this,
                    markerGroup;
                if (that._isReduction && that._isPositive)
                    markerGroup = group.reductionPositiveMarkersGroup;
                else if (that._isReduction)
                    markerGroup = group.reductionMarkersGroup;
                else if (that._isPositive)
                    markerGroup = group.defaultPositiveMarkersGroup;
                else
                    markerGroup = group.defaultMarkersGroup;
                return markerGroup
            },
            _drawMarker: function(renderer, group) {
                this._drawMarkerInGroup(this._getMarkerGroup(group), this._getStyle(), renderer)
            },
            _getSettingsForTracker: function() {
                var that = this,
                    highY = that.highY,
                    lowY = that.lowY,
                    rotated = that._options.rotated,
                    x,
                    y,
                    width,
                    height;
                if (highY === lowY) {
                    highY = rotated ? highY + DEFAULT_FINANCIAL_TRACKER_MARGIN : highY - DEFAULT_FINANCIAL_TRACKER_MARGIN;
                    lowY = rotated ? lowY - DEFAULT_FINANCIAL_TRACKER_MARGIN : lowY + DEFAULT_FINANCIAL_TRACKER_MARGIN
                }
                if (rotated) {
                    x = _min(lowY, highY);
                    y = that.x - that.width / 2;
                    width = _abs(lowY - highY);
                    height = that.width
                }
                else {
                    x = that.x - that.width / 2;
                    y = _min(lowY, highY);
                    width = that.width;
                    height = _abs(lowY - highY)
                }
                return {
                        x: x,
                        y: y,
                        width: width,
                        height: height
                    }
            },
            _getGraphicBbox: function() {
                var that = this,
                    rotated = that._options.rotated,
                    x = that.x,
                    width = that.width,
                    lowY = that.lowY,
                    highY = that.highY;
                return {
                        x: !rotated ? x - _round(width / 2) : lowY,
                        y: !rotated ? highY : x - _round(width / 2),
                        width: !rotated ? width : highY - lowY,
                        height: !rotated ? lowY - highY : width
                    }
            },
            getTooltipParams: function(location) {
                var that = this;
                if (that.graphic) {
                    var x,
                        y,
                        min,
                        max,
                        minValue = _min(that.lowY, that.highY),
                        maxValue = _max(that.lowY, that.highY),
                        visibleAreaX = that.translators.x.getCanvasVisibleArea(),
                        visibleAreaY = that.translators.y.getCanvasVisibleArea(),
                        edgeLocation = location === 'edge';
                    if (!that._options.rotated) {
                        min = _max(visibleAreaY.min, minValue);
                        max = _min(visibleAreaY.max, maxValue);
                        x = that.x;
                        y = edgeLocation ? min : min + (max - min) / 2
                    }
                    else {
                        min = _max(visibleAreaX.min, minValue);
                        max = _min(visibleAreaX.max, maxValue);
                        y = that.x;
                        x = edgeLocation ? max : min + (max - min) / 2
                    }
                    return {
                            x: x,
                            y: y,
                            offset: 0
                        }
                }
            },
            hasValue: function() {
                return this.highValue !== null && this.lowValue !== null
            },
            _translate: function() {
                var that = this,
                    rotated = that._options.rotated,
                    translators = that.translators,
                    argTranslator = rotated ? translators.y : translators.x,
                    valTranslator = rotated ? translators.x : translators.y,
                    centerValue,
                    height;
                that.vx = that.vy = that.x = argTranslator.translate(that.argument) + (that.xCorrection || 0);
                that.openY = that.openValue !== null ? valTranslator.translate(that.openValue) : null;
                that.highY = valTranslator.translate(that.highValue);
                that.lowY = valTranslator.translate(that.lowValue);
                that.closeY = that.closeValue !== null ? valTranslator.translate(that.closeValue) : null;
                height = _abs(that.lowY - that.highY);
                centerValue = _min(that.lowY, that.highY) + _abs(that.lowY - that.highY) / 2;
                that._calculateVisibility(!rotated ? that.x : centerValue, !rotated ? centerValue : that.x)
            },
            getCrosshairData: function(x, y) {
                var that = this,
                    rotated = that._options.rotated,
                    origY = rotated ? x : y,
                    yValue,
                    argument = that.argument,
                    coords,
                    coord = "low";
                if (_abs(that.lowY - origY) < _abs(that.closeY - origY))
                    yValue = that.lowY;
                else {
                    yValue = that.closeY;
                    coord = "close"
                }
                if (_abs(yValue - origY) >= _abs(that.openY - origY)) {
                    yValue = that.openY;
                    coord = "open"
                }
                if (_abs(yValue - origY) >= _abs(that.highY - origY)) {
                    yValue = that.highY;
                    coord = "high"
                }
                if (rotated)
                    coords = {
                        y: that.vy,
                        x: yValue,
                        xValue: that[coord + "Value"],
                        yValue: argument
                    };
                else
                    coords = {
                        x: that.vx,
                        y: yValue,
                        xValue: argument,
                        yValue: that[coord + "Value"]
                    };
                coords.axis = that.series.axis;
                return coords
            },
            _updateData: function(data) {
                var that = this,
                    label = that._label,
                    reductionColor = this._options.reduction.color;
                that.value = that.initialValue = data.reductionValue;
                that.originalValue = data.value;
                that.lowValue = that.originalLowValue = data.lowValue;
                that.highValue = that.originalHighValue = data.highValue;
                that.openValue = that.originalOpenValue = data.openValue;
                that.closeValue = that.originalCloseValue = data.closeValue;
                that._isPositive = data.openValue < data.closeValue;
                that._isReduction = data.isReduction;
                if (that._isReduction)
                    label.setColor(reductionColor)
            },
            _updateMarker: function(animationEnabled, style, group) {
                var that = this,
                    graphic = that.graphic;
                graphic.attr({points: that._getPoints()}).attr(style || that._getStyle()).sharp();
                group && graphic.append(that._getMarkerGroup(group))
            },
            _getLabelFormatObject: function() {
                var that = this;
                return {
                        openValue: that.openValue,
                        highValue: that.highValue,
                        lowValue: that.lowValue,
                        closeValue: that.closeValue,
                        reductionValue: that.initialValue,
                        argument: that.initialArgument,
                        value: that.initialValue,
                        seriesName: that.series.name,
                        originalOpenValue: that.originalOpenValue,
                        originalCloseValue: that.originalCloseValue,
                        originalLowValue: that.originalLowValue,
                        originalHighValue: that.originalHighValue,
                        originalArgument: that.originalArgument,
                        point: that
                    }
            },
            _getFormatObject: function(tooltip) {
                var that = this,
                    highValue = tooltip.formatValue(that.highValue),
                    openValue = tooltip.formatValue(that.openValue),
                    closeValue = tooltip.formatValue(that.closeValue),
                    lowValue = tooltip.formatValue(that.lowValue),
                    symbolMethods = points.symbolPoint,
                    formatObject = symbolMethods._getFormatObject.call(that, tooltip);
                return _extend({}, formatObject, {
                        valueText: "h: " + highValue + (openValue !== "" ? " o: " + openValue : "") + (closeValue !== "" ? " c: " + closeValue : "") + " l: " + lowValue,
                        highValueText: highValue,
                        openValueText: openValue,
                        closeValueText: closeValue,
                        lowValueText: lowValue
                    })
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file stockPoint.js */
    (function($, DX) {
        var points = DX.viz.series.points.mixins,
            _extend = $.extend,
            _isNumeric = $.isNumeric;
        points.stockPoint = _extend({}, points.candlestickPoint, {
            _getPoints: function() {
                var that = this,
                    createPoint = that._options.rotated ? function(x, y) {
                        return [y, x]
                    } : function(x, y) {
                        return [x, y]
                    },
                    openYExist = _isNumeric(that.openY),
                    closeYExist = _isNumeric(that.closeY),
                    x = that.x,
                    width = that.width,
                    points;
                points = [].concat(createPoint(x, that.highY));
                openYExist && (points = points.concat(createPoint(x, that.openY)));
                openYExist && (points = points.concat(createPoint(x - width / 2, that.openY)));
                openYExist && (points = points.concat(createPoint(x, that.openY)));
                closeYExist && (points = points.concat(createPoint(x, that.closeY)));
                closeYExist && (points = points.concat(createPoint(x + width / 2, that.closeY)));
                closeYExist && (points = points.concat(createPoint(x, that.closeY)));
                points = points.concat(createPoint(x, that.lowY));
                return points
            },
            _drawMarkerInGroup: function(group, attributes, renderer) {
                this.graphic = renderer.path(this._getPoints(), "line").attr({"stroke-linecap": "square"}).attr(attributes).data({"chart-data-point": this}).sharp().append(group)
            },
            _getMinTrackerWidth: function() {
                var width = 2 + this._styles.normal['stroke-width'];
                return width + width % 2
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file polarPoint.js */
    (function($, DX, undefined) {
        var _extend = $.extend,
            viz = DX.viz,
            points = viz.series.points.mixins,
            commonUtils = DX.require("/utils/utils.common"),
            isDefined = commonUtils.isDefined,
            mathUtils = DX.require("/utils/utils.math"),
            normalizeAngle = mathUtils.normalizeAngle,
            _math = Math,
            _max = _math.max,
            ERROR_BARS_ANGLE_OFFSET = 90,
            CANVAS_POSITION_START = "canvas_position_start",
            CANVAS_POSITION_TOP = "canvas_position_top",
            CANVAS_POSITION_END = "canvas_position_end",
            CANVAS_POSITION_DEFAULT = "canvas_position_default";
        points.polarSymbolPoint = _extend({}, points.symbolPoint, {
            _getLabelCoords: points.piePoint._getLabelCoords,
            _moveLabelOnCanvas: points.barPoint._moveLabelOnCanvas,
            _getLabelPosition: function() {
                return "outside"
            },
            _translate: function(translator) {
                var that = this,
                    coord = translator.translate(that.argument, that.value),
                    center = translator.translate(CANVAS_POSITION_START, CANVAS_POSITION_TOP);
                that.vx = normalizeAngle(coord.angle);
                that.vy = that.radiusOuter = that.radiusLabels = coord.radius;
                that.radius = coord.radius;
                that.middleAngle = -coord.angle;
                that.angle = -coord.angle;
                that.x = coord.x;
                that.y = coord.y;
                that.defaultX = that.centerX = center.x;
                that.defaultY = that.centerY = center.y;
                that._translateErrorBars(translator);
                that.inVisibleArea = true
            },
            _translateErrorBars: function(translator) {
                var that = this,
                    errorBars = that._options.errorBars;
                if (!errorBars)
                    return;
                isDefined(that.lowError) && (that._lowErrorCoord = that.centerY - translator.translate(that.argument, that.lowError).radius);
                isDefined(that.highError) && (that._highErrorCoord = that.centerY - translator.translate(that.argument, that.highError).radius);
                that._errorBarPos = that.centerX;
                that._baseErrorBarPos = errorBars.type === "stdDeviation" ? that._lowErrorCoord + (that._highErrorCoord - that._lowErrorCoord) / 2 : that.centerY - that.radius
            },
            _getTranslates: function(animationEnabled) {
                return animationEnabled ? this.getDefaultCoords() : {
                        x: this.x,
                        y: this.y
                    }
            },
            getDefaultCoords: function() {
                var cossin = mathUtils.getCosAndSin(-this.angle),
                    radius = this.translators.translate(CANVAS_POSITION_START, CANVAS_POSITION_DEFAULT).radius,
                    x = this.defaultX + radius * cossin.cos,
                    y = this.defaultY + radius * cossin.sin;
                return {
                        x: x,
                        y: y
                    }
            },
            _addLabelAlignmentAndOffset: function(label, coord) {
                return coord
            },
            _checkLabelPosition: function(label, coord) {
                var that = this,
                    visibleArea = that._getVisibleArea(),
                    graphicBbox = that._getGraphicBbox();
                if (that._isPointInVisibleArea(visibleArea, graphicBbox))
                    coord = that._moveLabelOnCanvas(coord, visibleArea, label.getBoundingRect());
                return coord
            },
            _getErrorBarSettings: function(errorBarOptions, animationEnabled) {
                var settings = points.symbolPoint._getErrorBarSettings.call(this, errorBarOptions, animationEnabled);
                settings.rotate = ERROR_BARS_ANGLE_OFFSET - this.angle;
                settings.rotateX = this.centerX;
                settings.rotateY = this.centerY;
                return settings
            },
            getCoords: function(min) {
                return min ? this.getDefaultCoords() : {
                        x: this.x,
                        y: this.y
                    }
            }
        });
        points.polarBarPoint = _extend({}, points.barPoint, {
            _translateErrorBars: points.polarSymbolPoint._translateErrorBars,
            _getErrorBarSettings: points.polarSymbolPoint._getErrorBarSettings,
            _moveLabelOnCanvas: points.barPoint._moveLabelOnCanvas,
            _getLabelCoords: points.piePoint._getLabelCoords,
            _getLabelConnector: points.piePoint._getLabelConnector,
            getBoundaryCoords: points.piePoint.getBoundaryCoords,
            getTooltipParams: points.piePoint.getTooltipParams,
            _getLabelPosition: points.piePoint._getLabelPosition,
            _translate: function(translator) {
                var that = this,
                    maxRadius = translator.translate(CANVAS_POSITION_TOP, CANVAS_POSITION_END).radius;
                that.radiusInner = translator.translate(that.argument, that.minValue).radius;
                points.polarSymbolPoint._translate.call(that, translator);
                if (that.radiusInner === null)
                    that.radiusInner = that.radius = maxRadius;
                else if (that.radius === null)
                    this.radius = this.value >= 0 ? maxRadius : 0;
                that.radiusOuter = that.radiusLabels = _max(that.radiusInner, that.radius);
                that.radiusInner = that.defaultRadius = _math.min(that.radiusInner, that.radius);
                that.middleAngle = that.angle = -normalizeAngle(that.middleAngleCorrection - that.angle)
            },
            _checkVisibility: function(translator) {
                return translator.checkVisibility(this.radius, this.radiusInner)
            },
            getMarkerCoords: function() {
                return {
                        x: this.centerX,
                        y: this.centerY,
                        outerRadius: this.radiusOuter,
                        innerRadius: this.defaultRadius,
                        startAngle: this.middleAngle - this.interval / 2,
                        endAngle: this.middleAngle + this.interval / 2
                    }
            },
            _drawMarker: function(renderer, group, animationEnabled) {
                var that = this,
                    styles = that._getStyle(),
                    coords = that.getMarkerCoords(),
                    innerRadius = coords.innerRadius,
                    outerRadius = coords.outerRadius,
                    start = that.translators.translate(that.argument, CANVAS_POSITION_DEFAULT),
                    x = coords.x,
                    y = coords.y;
                if (animationEnabled) {
                    innerRadius = 0;
                    outerRadius = 0;
                    x = start.x;
                    y = start.y
                }
                that.graphic = renderer.arc(x, y, innerRadius, outerRadius, coords.startAngle, coords.endAngle).attr(styles).data({"chart-data-point": that}).append(group)
            },
            _checkLabelPosition: function(label, coord) {
                var that = this,
                    visibleArea = that._getVisibleArea(),
                    angleFunctions = mathUtils.getCosAndSin(that.middleAngle),
                    x = that.centerX + that.defaultRadius * angleFunctions.cos,
                    y = that.centerY - that.defaultRadius * angleFunctions.sin;
                if (x > visibleArea.minX && x < visibleArea.maxX && y > visibleArea.minY && y < visibleArea.maxY)
                    coord = that._moveLabelOnCanvas(coord, visibleArea, label.getBoundingRect());
                return coord
            },
            _addLabelAlignmentAndOffset: function(label, coord) {
                return coord
            },
            correctCoordinates: function(correctOptions) {
                this.middleAngleCorrection = correctOptions.offset;
                this.interval = correctOptions.width
            },
            coordsIn: function(x, y) {
                var val = this.translators.untranslate(x, y),
                    coords = this.getMarkerCoords(),
                    isBetweenAngles = coords.startAngle < coords.endAngle ? -val.phi >= coords.startAngle && -val.phi <= coords.endAngle : -val.phi <= coords.startAngle && -val.phi >= coords.endAngle;
                return val.r >= coords.innerRadius && val.r <= coords.outerRadius && isBetweenAngles
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file dataValidator.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            commonUtils = DX.require("/utils/utils.common"),
            STRING = "string",
            NUMERIC = "numeric",
            DATETIME = "datetime",
            DISCRETE = "discrete",
            CONTINUOUS = "continuous",
            LOGARITHMIC = "logarithmic",
            VALUE_TYPE = "valueType",
            ARGUMENT_TYPE = "argumentType",
            axisTypeParser = viz.utils.enumParser([STRING, NUMERIC, DATETIME]),
            _getParser = viz.parseUtils.getParser,
            _isDefined = commonUtils.isDefined,
            _isFunction = commonUtils.isFunction,
            _isArray = commonUtils.isArray,
            _isString = commonUtils.isString,
            _isDate = commonUtils.isDate,
            _isNumber = commonUtils.isNumber,
            _isObject = commonUtils.isObject,
            _each = $.each;
        function groupingValues(data, others, valueField, index) {
            if (index >= 0)
                _each(data.slice(index), function(_, cell) {
                    if (_isDefined(cell[valueField])) {
                        others[valueField] += cell[valueField];
                        cell[valueField] = cell["original" + valueField] = undefined
                    }
                })
        }
        function mergeSort(data, field) {
            function merge_sort(array, low, high, field) {
                if (low < high) {
                    var mid = Math.floor((low + high) / 2);
                    merge_sort(array, low, mid, field);
                    merge_sort(array, mid + 1, high, field);
                    merge(array, low, mid, high, field)
                }
            }
            var n = data.length;
            merge_sort(data, 0, n - 1, field);
            return data
        }
        function merge(array, low, mid, high, field) {
            var newArray = new Array(high - low + 1),
                countL = low,
                countR = mid + 1,
                k,
                i = 0;
            while (countL <= mid && countR <= high) {
                if (array[countL][field] <= array[countR][field] || !_isDefined(array[countR][field])) {
                    newArray[i] = array[countL];
                    countL++
                }
                else {
                    newArray[i] = array[countR];
                    countR++
                }
                i++
            }
            if (countL > mid)
                for (k = countR; k <= high; k++, i++)
                    newArray[i] = array[k];
            else
                for (k = countL; k <= mid; k++, i++)
                    newArray[i] = array[k];
            for (k = 0; k <= high - low; k++)
                array[k + low] = newArray[k];
            return array
        }
        function processGroup(_, group) {
            group.valueType = group.valueAxisType = null;
            _each(group, processSeries);
            group.valueAxis && group.valueAxis.resetTypes(VALUE_TYPE)
        }
        function processSeries(_, series) {
            series.updateDataType({})
        }
        function resetAxisTypes(_, axis) {
            axis.resetTypes(ARGUMENT_TYPE)
        }
        function filterForLogAxis(val, field, incidentOccurred) {
            if (val <= 0) {
                incidentOccurred("E2004", [field]);
                val = null
            }
            return val
        }
        function eigen(x) {
            return x
        }
        function getType(unit, type) {
            var result = type;
            if (type === STRING || _isString(unit))
                result = STRING;
            else if (type === DATETIME || _isDate(unit))
                result = DATETIME;
            else if (_isNumber(unit))
                result = NUMERIC;
            return result
        }
        function correctAxisType(type, axisType, hasCategories, incidentOccurred) {
            if (type === STRING && (axisType === CONTINUOUS || axisType === LOGARITHMIC))
                incidentOccurred("E2002");
            return axisType === LOGARITHMIC ? LOGARITHMIC : hasCategories || axisType === DISCRETE || type === STRING ? DISCRETE : CONTINUOUS
        }
        function validUnit(unit, field, incidentOccurred) {
            if (unit)
                incidentOccurred(!_isNumber(unit) && !_isDate(unit) && !_isString(unit) ? "E2003" : "E2004", [field])
        }
        function createParserUnit(type, axisType, ignoreEmptyPoints, skipFields, incidentOccurred) {
            var parser = type ? _getParser(type) : eigen,
                filter = axisType === LOGARITHMIC ? filterForLogAxis : eigen;
            return function(unit, field) {
                    var parseUnit = filter(parser(unit), field, incidentOccurred);
                    parseUnit === null && ignoreEmptyPoints && (parseUnit = undefined);
                    if (parseUnit === undefined) {
                        skipFields[field] = (skipFields[field] || 0) + 1;
                        validUnit(unit, field, incidentOccurred)
                    }
                    return parseUnit
                }
        }
        function createParsers(groups, skipFields, incidentOccurred) {
            var argumentParser = createParserUnit(groups.argumentType, groups.argumentAxisType, false, skipFields, incidentOccurred),
                cache = {},
                list = [];
            _each(groups, function(_, group) {
                _each(group, function(_, series) {
                    var valueParser = createParserUnit(group.valueType, group.valueAxisType, series.getOptions().ignoreEmptyPoints, skipFields, incidentOccurred);
                    cache[series.getArgumentField()] = argumentParser;
                    _each(series.getValueFields(), function(_, field) {
                        cache[field] = valueParser
                    });
                    if (series.getTagField())
                        cache[series.getTagField()] = eigen
                })
            });
            _each(cache, function(field, parser) {
                list.push([field, parser])
            });
            return list
        }
        function getParsedCell(cell, parsers) {
            var i,
                ii = parsers.length,
                obj = {},
                field,
                value;
            for (i = 0; i < ii; ++i) {
                field = parsers[i][0];
                value = cell[field];
                obj[field] = parsers[i][1](value, field);
                obj["original" + field] = value
            }
            return obj
        }
        function parse(data, parsers) {
            var parsedData = [],
                i,
                ii = data.length;
            parsedData.length = ii;
            for (i = 0; i < ii; ++i)
                parsedData[i] = getParsedCell(data[i], parsers);
            return parsedData
        }
        function findIndexByThreshold(data, valueField, threshold) {
            var i,
                ii = data.length,
                value;
            for (i = 0; i < ii; ++i) {
                value = data[i][valueField];
                if (_isDefined(value) && threshold > value)
                    break
            }
            return i
        }
        function groupMinSlices(originalData, argumentField, valueField, smallValuesGrouping) {
            smallValuesGrouping = smallValuesGrouping || {};
            var mode = smallValuesGrouping.mode,
                others = {},
                data;
            if (!mode || mode === "none")
                return;
            others[argumentField] = String(smallValuesGrouping.groupName || "others");
            others[valueField] = 0;
            data = originalData.slice();
            data.sort(function(a, b) {
                var isA = _isDefined(a[valueField]) ? 1 : 0,
                    isB = _isDefined(b[valueField]) ? 1 : 0;
                return isA && isB ? b[valueField] - a[valueField] : isB - isA
            });
            groupingValues(data, others, valueField, mode === "smallValueThreshold" ? findIndexByThreshold(data, valueField, smallValuesGrouping.threshold) : smallValuesGrouping.topCount);
            others[valueField] && originalData.push(others)
        }
        function groupData(data, groups) {
            var isPie = groups[0] && groups[0][0] && (groups[0][0].type === "pie" || groups[0][0].type === "doughnut" || groups[0][0].type === "donut");
            if (!isPie)
                return;
            _each(groups, function(_, group) {
                _each(group, function(_, series) {
                    groupMinSlices(data, series.getArgumentField(), series.getValueFields()[0], series.getOptions().smallValuesGrouping)
                })
            })
        }
        function sort(data, groups, sortingMethod, userArgumentCategories) {
            var hash = {},
                argumentField = groups.length && groups[0].length && groups[0][0].getArgumentField();
            if (_isFunction(sortingMethod))
                data.sort(sortingMethod);
            else if (userArgumentCategories.length) {
                _each(userArgumentCategories, function(index, value) {
                    hash[value] = index
                });
                data.sort(function sortCat(a, b) {
                    a = a[argumentField];
                    b = b[argumentField];
                    return hash[a] - hash[b]
                })
            }
            else if (sortingMethod === true && groups.argumentType !== STRING)
                mergeSort(data, argumentField)
        }
        function checkValueTypeOfGroup(group, cell) {
            _each(group, function(_, series) {
                _each(series.getValueFields(), function(_, field) {
                    group.valueType = getType(cell[field], group.valueType)
                })
            });
            return group.valueType
        }
        function checkArgumentTypeOfGroup(group, cell, groups) {
            _each(group, function(_, series) {
                groups.argumentType = getType(cell[series.getArgumentField()], groups.argumentType)
            });
            return groups.argumentType
        }
        function checkType(data, groups, checkTypeForAllData) {
            var groupsWithUndefinedValueType = [],
                groupsWithUndefinedArgumentType = [],
                argumentTypeGroup = groups.argumentOptions && axisTypeParser(groups.argumentOptions.argumentType);
            _each(groups, function(_, group) {
                if (!group.length)
                    return null;
                var valueTypeGroup = group.valueOptions && axisTypeParser(group.valueOptions.valueType);
                group.valueType = valueTypeGroup;
                groups.argumentType = argumentTypeGroup;
                !valueTypeGroup && groupsWithUndefinedValueType.push(group);
                !argumentTypeGroup && groupsWithUndefinedArgumentType.push(group)
            });
            if (groupsWithUndefinedValueType.length || groupsWithUndefinedArgumentType.length)
                _each(data, function(_, cell) {
                    var defineVal,
                        defineArg;
                    _each(groupsWithUndefinedValueType, function(_, group) {
                        defineVal = checkValueTypeOfGroup(group, cell)
                    });
                    _each(groupsWithUndefinedArgumentType, function(_, group) {
                        defineArg = checkArgumentTypeOfGroup(group, cell, groups)
                    });
                    if (!checkTypeForAllData && defineVal && defineArg)
                        return false
                })
        }
        function checkAxisType(groups, userArgumentCategories, incidentOccurred) {
            var argumentOptions = groups.argumentOptions || {},
                argumentAxisType = correctAxisType(groups.argumentType, argumentOptions.type, !!userArgumentCategories.length, incidentOccurred);
            _each(groups, function(_, group) {
                var valueOptions = group.valueOptions || {},
                    valueCategories = valueOptions.categories || [],
                    valueAxisType = correctAxisType(group.valueType, valueOptions.type, !!valueCategories.length, incidentOccurred);
                _each(group, function(_, series) {
                    var optionsSeries = {};
                    optionsSeries.argumentAxisType = argumentAxisType;
                    optionsSeries.valueAxisType = valueAxisType;
                    groups.argumentAxisType = groups.argumentAxisType || optionsSeries.argumentAxisType;
                    group.valueAxisType = group.valueAxisType || optionsSeries.valueAxisType;
                    optionsSeries.argumentType = groups.argumentType;
                    optionsSeries.valueType = group.valueType;
                    optionsSeries.showZero = valueOptions.showZero;
                    series.updateDataType(optionsSeries)
                });
                group.valueAxisType = group.valueAxisType || valueAxisType;
                if (group.valueAxis) {
                    group.valueAxis.setTypes(group.valueAxisType, group.valueType, VALUE_TYPE);
                    group.valueAxis.validate(false)
                }
            });
            groups.argumentAxisType = groups.argumentAxisType || argumentAxisType;
            if (groups.argumentAxes)
                _each(groups.argumentAxes, function(_, axis) {
                    axis.setTypes(groups.argumentAxisType, groups.argumentType, ARGUMENT_TYPE);
                    axis.validate(true)
                })
        }
        function verifyData(source, incidentOccurred) {
            var data = [],
                hasError = !_isArray(source),
                i,
                ii,
                k,
                item;
            if (!hasError)
                for (i = 0, ii = source.length, k = 0; i < ii; ++i) {
                    item = source[i];
                    if (_isObject(item))
                        data[k++] = item;
                    else if (item)
                        hasError = true
                }
            if (hasError)
                incidentOccurred("E2001");
            return data
        }
        function validateData(data, groups, incidentOccurred, options) {
            var parsers,
                skipFields = {},
                userArgumentCategories = groups.argumentOptions && groups.argumentOptions.categories || [],
                dataLength;
            data = verifyData(data, incidentOccurred);
            groups.argumentType = groups.argumentAxisType = null;
            _each(groups, processGroup);
            if (groups.argumentAxes)
                _each(groups.argumentAxes, resetAxisTypes);
            checkType(data, groups, options.checkTypeForAllData);
            checkAxisType(groups, userArgumentCategories, incidentOccurred);
            if (options.convertToAxisDataType) {
                parsers = createParsers(groups, skipFields, incidentOccurred);
                data = parse(data, parsers)
            }
            groupData(data, groups);
            sort(data, groups, options.sortingMethod, userArgumentCategories);
            dataLength = data.length;
            _each(skipFields, function(field, fieldValue) {
                if (fieldValue === dataLength)
                    incidentOccurred("W2002", [field])
            });
            return data
        }
        viz.validateData = validateData;
        viz.DEBUG_validateData_sort = sort
    })(DevExpress, jQuery);
    /*! Module viz-core, file default.js */
    (function(DX, undefined) {
        var WHITE = "#ffffff",
            BLACK = "#000000",
            LIGHT_GREY = "#d3d3d3",
            GREY_GREEN = "#303030",
            SOME_GREY = "#2b2b2b",
            RED = "#ff0000",
            PRIMARY_TITLE_COLOR = "#232323",
            SECONDARY_TITLE_COLOR = "#767676",
            CONTRAST_ACTIVE = "#cf00da",
            MARKER_COLOR = "#f8ca00",
            TARGET_COLOR = "#8e8e8e",
            POSITIVE_COLOR = "#b8b8b8",
            LINE_COLOR = "#c7c7c7",
            AREA_LAYER_COLOR = "#686868",
            RANGE_COLOR = "#b5b5b5",
            NONE = "none",
            SOLID = "solid",
            TOP = "top",
            RIGHT = "right",
            BOTTOM = "bottom",
            LEFT = "left",
            CENTER = "center",
            INSIDE = "inside",
            OUTSIDE = "outside",
            viz = DX.viz,
            registerTheme = viz.registerTheme,
            registerThemeAlias = viz.registerThemeAlias;
        registerTheme({
            name: "generic.light",
            font: {
                color: SECONDARY_TITLE_COLOR,
                family: "'Segoe UI', 'Helvetica Neue', 'Trebuchet MS', Verdana",
                weight: 400,
                size: 12,
                cursor: "default"
            },
            redrawOnResize: true,
            backgroundColor: WHITE,
            primaryTitleColor: PRIMARY_TITLE_COLOR,
            secondaryTitleColor: SECONDARY_TITLE_COLOR,
            axisColor: LIGHT_GREY,
            axisLabelColor: SECONDARY_TITLE_COLOR,
            title: {
                font: {
                    size: 28,
                    family: "'Segoe UI Light', 'Helvetica Neue Light', 'Segoe UI', 'Helvetica Neue', 'Trebuchet MS', Verdana",
                    weight: 200
                },
                subtitle: {font: {size: 16}}
            },
            loadingIndicator: {text: "Loading..."},
            tooltip: {
                enabled: false,
                border: {
                    width: 1,
                    color: LIGHT_GREY,
                    dashStyle: SOLID,
                    visible: true
                },
                font: {color: PRIMARY_TITLE_COLOR},
                color: WHITE,
                arrowLength: 10,
                paddingLeftRight: 18,
                paddingTopBottom: 15,
                shared: false,
                location: CENTER,
                format: "",
                argumentFormat: "",
                precision: 0,
                argumentPrecision: 0,
                percentPrecision: 0,
                shadow: {
                    opacity: 0.4,
                    offsetX: 0,
                    offsetY: 4,
                    blur: 2,
                    color: BLACK
                }
            },
            legend: {
                hoverMode: "includePoints",
                verticalAlignment: TOP,
                horizontalAlignment: RIGHT,
                position: OUTSIDE,
                visible: true,
                margin: 10,
                markerSize: 12,
                border: {
                    visible: false,
                    width: 1,
                    cornerRadius: 0,
                    dashStyle: SOLID
                },
                paddingLeftRight: 20,
                paddingTopBottom: 15,
                columnCount: 0,
                rowCount: 0,
                columnItemSpacing: 20,
                rowItemSpacing: 8
            },
            "chart:common": {
                animation: {
                    enabled: true,
                    duration: 1000,
                    easing: "easeOutCubic",
                    maxPointCountSupported: 300
                },
                commonSeriesSettings: {
                    border: {
                        visible: false,
                        width: 2
                    },
                    showInLegend: true,
                    visible: true,
                    hoverMode: "nearestPoint",
                    selectionMode: "includePoints",
                    hoverStyle: {
                        hatching: {
                            direction: RIGHT,
                            width: 2,
                            step: 6,
                            opacity: 0.75
                        },
                        border: {
                            visible: false,
                            width: 3
                        }
                    },
                    selectionStyle: {
                        hatching: {
                            direction: RIGHT,
                            width: 2,
                            step: 6,
                            opacity: 0.5
                        },
                        border: {
                            visible: false,
                            width: 3
                        }
                    },
                    valueErrorBar: {
                        displayMode: "auto",
                        value: 1,
                        color: BLACK,
                        lineWidth: 2,
                        edgeLength: 8
                    },
                    label: {
                        visible: false,
                        alignment: CENTER,
                        rotationAngle: 0,
                        horizontalOffset: 0,
                        verticalOffset: 0,
                        radialOffset: 0,
                        format: "",
                        argumentFormat: "",
                        precision: 0,
                        argumentPrecision: 0,
                        percentPrecision: 0,
                        showForZeroValues: true,
                        customizeText: undefined,
                        maxLabelCount: undefined,
                        position: OUTSIDE,
                        font: {color: WHITE},
                        border: {
                            visible: false,
                            width: 1,
                            color: LIGHT_GREY,
                            dashStyle: SOLID
                        },
                        connector: {
                            visible: false,
                            width: 1
                        }
                    }
                },
                seriesSelectionMode: "single",
                pointSelectionMode: "single",
                equalRowHeight: true,
                dataPrepareSettings: {
                    checkTypeForAllData: false,
                    convertToAxisDataType: true,
                    sortingMethod: true
                },
                title: {margin: 10},
                adaptiveLayout: {
                    width: 80,
                    height: 80,
                    keepLabels: true
                },
                _rtl: {legend: {itemTextPosition: LEFT}},
                resolveLabelOverlapping: NONE
            },
            "chart:common:axis": {
                visible: false,
                setTicksAtUnitBeginning: true,
                valueMarginsEnabled: true,
                placeholderSize: null,
                logarithmBase: 10,
                discreteAxisDivisionMode: "betweenLabels",
                width: 1,
                label: {
                    visible: true,
                    precision: 0,
                    format: ""
                },
                grid: {
                    visible: false,
                    width: 1
                },
                minorGrid: {
                    visible: false,
                    width: 1,
                    opacity: 0.3
                },
                tick: {
                    visible: false,
                    width: 1,
                    length: 8
                },
                minorTick: {
                    visible: false,
                    width: 1,
                    opacity: 0.3,
                    length: 8
                },
                stripStyle: {
                    paddingLeftRight: 10,
                    paddingTopBottom: 5
                },
                constantLineStyle: {
                    width: 1,
                    color: BLACK,
                    dashStyle: SOLID,
                    label: {
                        visible: true,
                        position: INSIDE
                    }
                },
                marker: {label: {}}
            },
            chart: {
                commonSeriesSettings: {
                    type: "line",
                    stack: "default",
                    point: {
                        visible: true,
                        symbol: "circle",
                        size: 12,
                        border: {
                            visible: false,
                            width: 1
                        },
                        hoverMode: "onlyPoint",
                        selectionMode: "onlyPoint",
                        hoverStyle: {
                            border: {
                                visible: true,
                                width: 4
                            },
                            size: 12
                        },
                        selectionStyle: {
                            border: {
                                visible: true,
                                width: 4
                            },
                            size: 12
                        }
                    },
                    scatter: {},
                    line: {
                        width: 2,
                        dashStyle: SOLID,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3}
                    },
                    stackedline: {
                        width: 2,
                        dashStyle: SOLID,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3}
                    },
                    stackedspline: {
                        width: 2,
                        dashStyle: SOLID,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3}
                    },
                    fullstackedline: {
                        width: 2,
                        dashStyle: SOLID,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3}
                    },
                    fullstackedspline: {
                        width: 2,
                        dashStyle: SOLID,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3}
                    },
                    stepline: {
                        width: 2,
                        dashStyle: SOLID,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3}
                    },
                    area: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    stackedarea: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    fullstackedarea: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    fullstackedsplinearea: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    steparea: {
                        border: {
                            visible: true,
                            width: 2
                        },
                        point: {visible: false},
                        hoverStyle: {border: {
                                visible: true,
                                width: 3
                            }},
                        selectionStyle: {border: {
                                visible: true,
                                width: 3
                            }},
                        opacity: 0.5
                    },
                    spline: {
                        width: 2,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3}
                    },
                    splinearea: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    stackedsplinearea: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    bar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        }
                    },
                    stackedbar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        },
                        label: {position: INSIDE}
                    },
                    fullstackedbar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        },
                        label: {position: INSIDE}
                    },
                    rangebar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        }
                    },
                    rangearea: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    rangesplinearea: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    bubble: {
                        opacity: 0.5,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        }
                    },
                    candlestick: {
                        width: 1,
                        reduction: {color: RED},
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3},
                        point: {border: {visible: true}}
                    },
                    stock: {
                        width: 1,
                        reduction: {color: RED},
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3},
                        point: {border: {visible: true}}
                    }
                },
                crosshair: {
                    enabled: false,
                    color: "#f05b41",
                    width: 1,
                    dashStyle: SOLID,
                    label: {
                        visible: false,
                        font: {
                            color: WHITE,
                            size: 12
                        }
                    },
                    verticalLine: {visible: true},
                    horizontalLine: {visible: true}
                },
                commonAxisSettings: {
                    multipleAxesSpacing: 5,
                    label: {
                        overlappingBehavior: {
                            mode: "enlargeTickInterval",
                            rotationAngle: 90,
                            staggeringSpacing: 5
                        },
                        indentFromAxis: 10
                    },
                    title: {
                        font: {size: 16},
                        margin: 6
                    },
                    constantLineStyle: {
                        paddingLeftRight: 10,
                        paddingTopBottom: 10
                    }
                },
                horizontalAxis: {
                    position: BOTTOM,
                    axisDivisionFactor: 50,
                    label: {alignment: CENTER},
                    stripStyle: {label: {
                            horizontalAlignment: CENTER,
                            verticalAlignment: TOP
                        }},
                    constantLineStyle: {label: {
                            horizontalAlignment: RIGHT,
                            verticalAlignment: TOP
                        }},
                    constantLines: {}
                },
                verticalAxis: {
                    position: LEFT,
                    axisDivisionFactor: 30,
                    label: {
                        alignment: RIGHT,
                        overlappingBehavior: {mode: "enlargeTickInterval"}
                    },
                    stripStyle: {label: {
                            horizontalAlignment: LEFT,
                            verticalAlignment: CENTER
                        }},
                    constantLineStyle: {label: {
                            horizontalAlignment: LEFT,
                            verticalAlignment: TOP
                        }},
                    constantLines: {}
                },
                argumentAxis: {},
                valueAxis: {grid: {visible: true}},
                commonPaneSettings: {
                    backgroundColor: NONE,
                    border: {
                        color: LIGHT_GREY,
                        width: 1,
                        visible: false,
                        top: true,
                        bottom: true,
                        left: true,
                        right: true,
                        dashStyle: SOLID
                    }
                },
                scrollBar: {
                    visible: false,
                    offset: 5,
                    color: "gray",
                    width: 10
                },
                useAggregation: false,
                adjustOnZoom: true,
                rotated: false,
                zoomingMode: NONE,
                scrollingMode: NONE,
                synchronizeMultiAxes: true,
                equalBarWidth: true,
                minBubbleSize: 12,
                maxBubbleSize: 0.2
            },
            pie: {
                innerRadius: 0.5,
                type: "pie",
                commonSeriesSettings: {
                    pie: {
                        border: {
                            visible: false,
                            width: 2,
                            color: WHITE
                        },
                        hoverStyle: {
                            hatching: {
                                direction: RIGHT,
                                width: 4,
                                step: 10,
                                opacity: 0.75
                            },
                            border: {
                                visible: false,
                                width: 2
                            }
                        },
                        selectionStyle: {
                            hatching: {
                                direction: RIGHT,
                                width: 4,
                                step: 10,
                                opacity: 0.5
                            },
                            border: {
                                visible: false,
                                width: 2
                            }
                        }
                    },
                    doughnut: {
                        border: {
                            visible: false,
                            width: 2,
                            color: WHITE
                        },
                        hoverStyle: {
                            hatching: {
                                direction: RIGHT,
                                width: 4,
                                step: 10,
                                opacity: 0.75
                            },
                            border: {
                                visible: false,
                                width: 2
                            }
                        },
                        selectionStyle: {
                            hatching: {
                                direction: RIGHT,
                                width: 4,
                                step: 10,
                                opacity: 0.5
                            },
                            border: {
                                visible: false,
                                width: 2
                            }
                        }
                    },
                    donut: {
                        border: {
                            visible: false,
                            width: 2,
                            color: WHITE
                        },
                        hoverStyle: {
                            hatching: {
                                direction: RIGHT,
                                width: 4,
                                step: 10,
                                opacity: 0.75
                            },
                            border: {
                                visible: false,
                                width: 2
                            }
                        },
                        selectionStyle: {
                            hatching: {
                                direction: RIGHT,
                                width: 4,
                                step: 10,
                                opacity: 0.5
                            },
                            border: {
                                visible: false,
                                width: 2
                            }
                        }
                    }
                },
                legend: {
                    hoverMode: "allArgumentPoints",
                    backgroundColor: NONE
                },
                adaptiveLayout: {keepLabels: false}
            },
            pieIE8: {commonSeriesSettings: {
                    pie: {
                        hoverStyle: {border: {
                                visible: true,
                                color: WHITE
                            }},
                        selectionStyle: {border: {
                                visible: true,
                                color: WHITE
                            }}
                    },
                    donut: {
                        hoverStyle: {border: {
                                visible: true,
                                color: WHITE
                            }},
                        selectionStyle: {border: {
                                visible: true,
                                color: WHITE
                            }}
                    },
                    doughnut: {
                        hoverStyle: {border: {
                                visible: true,
                                color: WHITE
                            }},
                        selectionStyle: {border: {
                                visible: true,
                                color: WHITE
                            }}
                    }
                }},
            gauge: {
                scale: {
                    tick: {
                        visible: true,
                        length: 5,
                        width: 2,
                        opacity: 1
                    },
                    minorTick: {
                        visible: false,
                        length: 3,
                        width: 1,
                        opacity: 1
                    },
                    label: {
                        visible: true,
                        alignment: CENTER,
                        overlappingBehavior: {
                            hideFirstOrLast: "last",
                            useAutoArrangement: true
                        }
                    },
                    position: TOP
                },
                rangeContainer: {
                    offset: 0,
                    width: 5,
                    backgroundColor: "#808080"
                },
                valueIndicators: {
                    _default: {color: "#c2c2c2"},
                    rangebar: {
                        space: 2,
                        size: 10,
                        color: "#cbc5cf",
                        backgroundColor: NONE,
                        text: {
                            indent: 0,
                            font: {
                                size: 14,
                                color: null
                            }
                        }
                    },
                    twocolorneedle: {secondColor: "#e18e92"},
                    trianglemarker: {
                        space: 2,
                        length: 14,
                        width: 13,
                        color: "#8798a5"
                    },
                    textcloud: {
                        arrowLength: 5,
                        horizontalOffset: 6,
                        verticalOffset: 3,
                        color: "#679ec5",
                        text: {font: {
                                color: WHITE,
                                size: 18
                            }}
                    }
                },
                indicator: {
                    hasPositiveMeaning: true,
                    layout: {
                        horizontalAlignment: CENTER,
                        verticalAlignment: BOTTOM
                    },
                    text: {font: {size: 18}}
                },
                _circular: {
                    scale: {
                        orientation: OUTSIDE,
                        label: {indentFromTick: 10}
                    },
                    rangeContainer: {orientation: OUTSIDE},
                    valueIndicatorType: "rectangleneedle",
                    subvalueIndicatorType: "trianglemarker",
                    valueIndicators: {
                        _type: "rectangleneedle",
                        _default: {
                            offset: 20,
                            indentFromCenter: 0,
                            width: 2,
                            spindleSize: 14,
                            spindleGapSize: 10
                        },
                        triangleneedle: {width: 4},
                        twocolorneedle: {
                            space: 2,
                            secondFraction: 0.4
                        },
                        rangebar: {offset: 30},
                        trianglemarker: {offset: 6},
                        textcloud: {offset: -6}
                    }
                },
                _linear: {
                    scale: {
                        horizontalOrientation: RIGHT,
                        verticalOrientation: BOTTOM,
                        label: {indentFromTick: -10}
                    },
                    rangeContainer: {
                        horizontalOrientation: RIGHT,
                        verticalOrientation: BOTTOM
                    },
                    valueIndicatorType: "rangebar",
                    subvalueIndicatorType: "trianglemarker",
                    valueIndicators: {
                        _type: "rectangle",
                        _default: {
                            offset: 2.5,
                            length: 15,
                            width: 15
                        },
                        rectangle: {width: 10},
                        rangebar: {
                            offset: 10,
                            horizontalOrientation: RIGHT,
                            verticalOrientation: BOTTOM
                        },
                        trianglemarker: {
                            offset: 10,
                            horizontalOrientation: LEFT,
                            verticalOrientation: TOP
                        },
                        textcloud: {
                            offset: -1,
                            horizontalOrientation: LEFT,
                            verticalOrientation: TOP
                        }
                    }
                }
            },
            barGauge: {
                backgroundColor: "#e0e0e0",
                relativeInnerRadius: 0.3,
                barSpacing: 4,
                label: {
                    indent: 20,
                    connectorWidth: 2,
                    font: {size: 16}
                },
                indicator: {
                    hasPositiveMeaning: true,
                    layout: {
                        horizontalAlignment: CENTER,
                        verticalAlignment: BOTTOM
                    },
                    text: {font: {size: 18}}
                }
            },
            rangeSelector: {
                scale: {
                    width: 1,
                    color: "#000000",
                    opacity: 0.1,
                    showCustomBoundaryTicks: true,
                    showMinorTicks: true,
                    useTicksAutoArrangement: true,
                    setTicksAtUnitBeginning: true,
                    label: {
                        alignment: "center",
                        visible: true,
                        topIndent: 7,
                        font: {size: 11}
                    },
                    tick: {
                        width: 1,
                        opacity: 1,
                        visible: true,
                        length: 12
                    },
                    minorTick: {
                        width: 1,
                        opacity: 0.3,
                        visible: true,
                        length: 12
                    },
                    marker: {
                        width: 1,
                        color: "#000000",
                        opacity: 0.1,
                        visible: true,
                        separatorHeight: 33,
                        topIndent: 10,
                        textLeftIndent: 7,
                        textTopIndent: 11,
                        label: {}
                    },
                    logarithmBase: 10
                },
                selectedRangeColor: "#606060",
                sliderMarker: {
                    visible: true,
                    paddingTopBottom: 2,
                    paddingLeftRight: 4,
                    color: "#606060",
                    invalidRangeColor: RED,
                    font: {
                        color: WHITE,
                        size: 11
                    }
                },
                sliderHandle: {
                    width: 1,
                    color: BLACK,
                    opacity: 0.2
                },
                shutter: {opacity: 0.75},
                background: {
                    color: "#c0bae1",
                    visible: true,
                    image: {location: "full"}
                },
                behavior: {
                    snapToTicks: true,
                    animationEnabled: true,
                    moveSelectedRangeByClick: true,
                    manualRangeSelectionEnabled: true,
                    allowSlidersSwap: true,
                    callSelectedRangeChanged: "onMovingComplete"
                },
                redrawOnResize: true,
                chart: {
                    useAggregation: false,
                    equalBarWidth: true,
                    minBubbleSize: 12,
                    maxBubbleSize: 0.2,
                    topIndent: 0.1,
                    bottomIndent: 0,
                    valueAxis: {
                        inverted: false,
                        logarithmBase: 10
                    },
                    commonSeriesSettings: {
                        type: "area",
                        point: {visible: false},
                        scatter: {point: {visible: true}}
                    }
                }
            },
            map: {
                title: {margin: 10},
                background: {
                    borderWidth: 1,
                    borderColor: "#cacaca"
                },
                layer: {label: {
                        enabled: false,
                        stroke: WHITE,
                        "stroke-width": 1,
                        "stroke-opacity": 0.5,
                        font: {
                            color: SOME_GREY,
                            size: 12
                        }
                    }},
                "layer:area": {
                    borderWidth: 1,
                    borderColor: WHITE,
                    color: "#d2d2d2",
                    hoveredBorderColor: GREY_GREEN,
                    selectedBorderWidth: 2,
                    selectedBorderColor: GREY_GREEN,
                    label: {
                        "stroke-width": 2,
                        font: {
                            size: 16,
                            opacity: 0.5
                        }
                    }
                },
                "layer:line": {
                    borderWidth: 2,
                    color: "#ba8365",
                    hoveredColor: "#a94813",
                    selectedBorderWidth: 3,
                    selectedColor: "#e55100",
                    label: {
                        "stroke-width": 2,
                        font: {
                            size: 16,
                            opacity: 0.5
                        }
                    }
                },
                "layer:marker": {label: {
                        enabled: true,
                        "stroke-width": 1,
                        font: {size: 12}
                    }},
                "layer:marker:dot": {
                    borderWidth: 2,
                    borderColor: WHITE,
                    color: "#ba4d51",
                    size: 8,
                    selectedStep: 2,
                    backStep: 18,
                    backColor: WHITE,
                    backOpacity: 0.32,
                    shadow: true
                },
                "layer:marker:bubble": {
                    minSize: 20,
                    maxSize: 50,
                    color: "#ba4d51",
                    hoveredBorderWidth: 1,
                    hoveredBorderColor: GREY_GREEN,
                    selectedBorderWidth: 2,
                    selectedBorderColor: GREY_GREEN
                },
                "layer:marker:pie": {
                    size: 50,
                    hoveredBorderWidth: 1,
                    hoveredBorderColor: GREY_GREEN,
                    selectedBorderWidth: 2,
                    selectedBorderColor: GREY_GREEN
                },
                "layer:marker:image": {size: 20},
                legend: {
                    verticalAlignment: BOTTOM,
                    horizontalAlignment: RIGHT,
                    position: INSIDE,
                    backgroundOpacity: 0.65,
                    border: {visible: true},
                    paddingLeftRight: 16,
                    paddingTopBottom: 12,
                    markerColor: "#ba4d51"
                },
                controlBar: {
                    borderColor: "#5d5d5d",
                    borderWidth: 3,
                    color: WHITE,
                    margin: 20,
                    opacity: 0.3
                },
                _rtl: {legend: {itemTextPosition: LEFT}}
            },
            sparkline: {
                lineColor: "#666666",
                lineWidth: 2,
                areaOpacity: 0.2,
                minColor: "#e8c267",
                maxColor: "#e55253",
                barPositiveColor: "#a9a9a9",
                barNegativeColor: "#d7d7d7",
                winColor: "#a9a9a9",
                lossColor: "#d7d7d7",
                firstLastColor: "#666666",
                pointSymbol: "circle",
                pointColor: WHITE,
                pointSize: 4,
                type: "line",
                argumentField: "arg",
                valueField: "val",
                winlossThreshold: 0,
                showFirstLast: true,
                showMinMax: false,
                tooltip: {enabled: true}
            },
            bullet: {
                color: "#e8c267",
                targetColor: "#666666",
                targetWidth: 4,
                showTarget: true,
                showZeroLevel: true,
                tooltip: {enabled: true}
            },
            polar: {
                commonSeriesSettings: {
                    type: "scatter",
                    closed: true,
                    point: {
                        visible: true,
                        symbol: "circle",
                        size: 12,
                        border: {
                            visible: false,
                            width: 1
                        },
                        hoverMode: "onlyPoint",
                        selectionMode: "onlyPoint",
                        hoverStyle: {
                            border: {
                                visible: true,
                                width: 4
                            },
                            size: 12
                        },
                        selectionStyle: {
                            border: {
                                visible: true,
                                width: 4
                            },
                            size: 12
                        }
                    },
                    scatter: {},
                    line: {
                        width: 2,
                        dashStyle: SOLID,
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: NONE}
                        },
                        selectionStyle: {width: 3}
                    },
                    area: {
                        point: {visible: false},
                        opacity: 0.5
                    },
                    stackedline: {width: 2},
                    bar: {opacity: 0.8},
                    stackedbar: {opacity: 0.8}
                },
                adaptiveLayout: {
                    width: 170,
                    height: 170,
                    keepLabels: true
                },
                equalBarWidth: true,
                commonAxisSettings: {
                    visible: true,
                    label: {
                        overlappingBehavior: {mode: "enlargeTickInterval"},
                        indentFromAxis: 5
                    },
                    grid: {visible: true},
                    minorGrid: {visible: true},
                    tick: {visible: true},
                    title: {
                        font: {size: 16},
                        margin: 10
                    }
                },
                argumentAxis: {
                    startAngle: 0,
                    firstPointOnStartAngle: false,
                    period: undefined
                },
                valueAxis: {tick: {visible: false}},
                horizontalAxis: {
                    position: TOP,
                    axisDivisionFactor: 50,
                    label: {alignment: CENTER}
                },
                verticalAxis: {
                    position: TOP,
                    axisDivisionFactor: 30,
                    label: {alignment: RIGHT}
                }
            }
        });
        registerTheme({
            name: "generic.dark",
            font: {color: "#808080"},
            backgroundColor: GREY_GREEN,
            primaryTitleColor: "#dbdbdb",
            secondaryTitleColor: "#a3a3a3",
            axisColor: "#555555",
            axisLabelColor: "#a3a3a3",
            tooltip: {
                color: SOME_GREY,
                border: {color: "#494949"},
                font: {color: "#929292"}
            },
            "chart:common": {commonSeriesSettings: {
                    label: {border: {color: "#494949"}},
                    valueErrorBar: {color: WHITE}
                }},
            "chart:common:axis": {constantLineStyle: {color: WHITE}},
            chart: {commonPaneSettings: {border: {color: "#494949"}}},
            pieIE8: {commonSeriesSettings: {
                    pie: {
                        hoverStyle: {border: {color: SOME_GREY}},
                        selectionStyle: {border: {color: SOME_GREY}}
                    },
                    donut: {
                        hoverStyle: {border: {color: SOME_GREY}},
                        selectionStyle: {border: {color: SOME_GREY}}
                    },
                    doughnut: {
                        hoverStyle: {border: {color: SOME_GREY}},
                        selectionStyle: {border: {color: SOME_GREY}}
                    }
                }},
            gauge: {
                rangeContainer: {backgroundColor: RANGE_COLOR},
                valueIndicators: {
                    _default: {color: RANGE_COLOR},
                    rangebar: {color: "#84788b"},
                    twocolorneedle: {secondColor: "#ba544d"},
                    trianglemarker: {color: "#b7918f"},
                    textcloud: {color: "#ba544d"}
                }
            },
            barGauge: {backgroundColor: "#3c3c3c"},
            rangeSelector: {
                selectedRangeColor: RANGE_COLOR,
                sliderMarker: {
                    color: RANGE_COLOR,
                    font: {color: GREY_GREEN}
                },
                sliderHandle: {
                    color: WHITE,
                    opacity: 0.2
                },
                shutter: {
                    color: SOME_GREY,
                    opacity: 0.9
                }
            },
            map: {
                background: {borderColor: "#3f3f3f"},
                layer: {label: {
                        stroke: BLACK,
                        font: {color: WHITE}
                    }},
                "layer:area": {
                    borderColor: GREY_GREEN,
                    color: AREA_LAYER_COLOR,
                    hoveredBorderColor: WHITE,
                    selectedBorderColor: WHITE
                },
                "layer:line": {
                    color: "#c77244",
                    hoveredColor: "#ff5d04",
                    selectedColor: "#ff784f"
                },
                "layer:marker:bubble": {
                    hoveredBorderColor: WHITE,
                    selectedBorderColor: WHITE
                },
                "layer:marker:pie": {
                    hoveredBorderColor: WHITE,
                    selectedBorderColor: WHITE
                },
                legend: {
                    border: {color: "#3f3f3f"},
                    font: {color: WHITE}
                },
                controlBar: {
                    borderColor: LINE_COLOR,
                    color: GREY_GREEN
                }
            },
            sparkline: {
                lineColor: LINE_COLOR,
                firstLastColor: LINE_COLOR,
                barPositiveColor: POSITIVE_COLOR,
                barNegativeColor: TARGET_COLOR,
                winColor: POSITIVE_COLOR,
                lossColor: TARGET_COLOR,
                pointColor: GREY_GREEN
            },
            bullet: {targetColor: TARGET_COLOR}
        }, "generic.light");
        registerTheme({
            name: "generic.contrast",
            defaultPalette: "Bright",
            font: {color: WHITE},
            backgroundColor: BLACK,
            primaryTitleColor: WHITE,
            secondaryTitleColor: WHITE,
            axisColor: WHITE,
            axisLabelColor: WHITE,
            tooltip: {
                border: {color: WHITE},
                font: {color: WHITE},
                color: BLACK
            },
            "chart:common": {commonSeriesSettings: {
                    valueErrorBar: {color: WHITE},
                    hoverStyle: {hatching: {opacity: 0.5}},
                    selectionStyle: {hatching: {opacity: 0.35}},
                    label: {
                        font: {color: WHITE},
                        border: {color: WHITE}
                    }
                }},
            "chart:common:axis": {constantLineStyle: {color: WHITE}},
            chart: {
                commonSeriesSettings: {},
                commonPaneSettings: {
                    backgroundColor: BLACK,
                    border: {color: WHITE}
                },
                scrollBar: {color: WHITE}
            },
            pie: {
                commonSeriesSettings: {
                    pie: {
                        hoverStyle: {hatching: {opacity: 0.5}},
                        selectionStyle: {hatching: {opacity: 0.35}}
                    },
                    doughnut: {
                        hoverStyle: {hatching: {opacity: 0.5}},
                        selectionStyle: {hatching: {opacity: 0.35}}
                    },
                    donut: {
                        hoverStyle: {hatching: {opacity: 0.5}},
                        selectionStyle: {hatching: {opacity: 0.35}}
                    }
                },
                legend: {backgroundColor: BLACK}
            },
            gauge: {
                rangeContainer: {backgroundColor: WHITE},
                valueIndicators: {
                    _default: {color: WHITE},
                    rangebar: {
                        color: WHITE,
                        backgroundColor: BLACK
                    },
                    twocolorneedle: {secondColor: WHITE},
                    trianglemarker: {color: WHITE},
                    textcloud: {
                        color: WHITE,
                        text: {font: {color: BLACK}}
                    }
                }
            },
            barGauge: {backgroundColor: "#3c3c3c"},
            rangeSelector: {
                electedRangeColor: CONTRAST_ACTIVE,
                sliderMarker: {color: CONTRAST_ACTIVE},
                sliderHandle: {
                    color: CONTRAST_ACTIVE,
                    opacity: 1
                },
                shutter: {opacity: 0.75},
                background: {color: BLACK}
            },
            map: {
                background: {borderColor: WHITE},
                layer: {label: {
                        stroke: BLACK,
                        font: {color: WHITE}
                    }},
                "layer:area": {
                    borderColor: BLACK,
                    color: AREA_LAYER_COLOR,
                    hoveredBorderColor: WHITE,
                    selectedBorderColor: WHITE,
                    label: {font: {opacity: 1}}
                },
                "layer:line": {
                    color: "#267cff",
                    hoveredColor: "#f613ff",
                    selectedColor: WHITE
                },
                "layer:marker:dot": {
                    borderColor: BLACK,
                    color: MARKER_COLOR,
                    backColor: BLACK,
                    backOpacity: 0.32
                },
                "layer:marker:bubble": {
                    color: MARKER_COLOR,
                    hoveredBorderColor: WHITE,
                    selectedBorderColor: WHITE
                },
                "layer:marker:pie": {
                    hoveredBorderColor: WHITE,
                    selectedBorderColor: WHITE
                },
                legend: {markerColor: MARKER_COLOR},
                controlBar: {
                    borderColor: WHITE,
                    color: BLACK,
                    opacity: 0.3
                }
            },
            sparkline: {pointColor: BLACK},
            bullet: {},
            polar: {commonSeriesSettings: {}}
        }, "generic.light");
        DX.viz.currentTheme("generic.light");
        registerThemeAlias("desktop.light", "generic.light");
        registerThemeAlias("desktop.dark", "generic.dark")
    })(DevExpress);
    /*! Module viz-core, file android.js */
    (function(DX) {
        var ANDROID5_LIGHT = "android5.light",
            registerThemeAlias = DX.viz.registerThemeAlias;
        DX.viz.registerTheme({
            name: ANDROID5_LIGHT,
            backgroundColor: "#ffffff",
            primaryTitleColor: "#232323",
            secondaryTitleColor: "#767676",
            axisColor: "#d3d3d3",
            axisLabelColor: "#767676",
            tooltip: {
                color: "#e8e8e8",
                font: {color: "#767676"}
            },
            legend: {font: {color: "#000000"}},
            pieIE8: {commonSeriesSettings: {
                    pie: {
                        hoverStyle: {border: {color: '#e8e8e8'}},
                        selectionStyle: {border: {color: '#e8e8e8'}}
                    },
                    donut: {
                        hoverStyle: {border: {color: '#e8e8e8'}},
                        selectionStyle: {border: {color: '#e8e8e8'}}
                    },
                    doughnut: {
                        hoverStyle: {border: {color: '#e8e8e8'}},
                        selectionStyle: {border: {color: '#e8e8e8'}}
                    }
                }}
        }, "generic.light");
        registerThemeAlias("android", ANDROID5_LIGHT);
        registerThemeAlias("android.holo-dark", ANDROID5_LIGHT);
        registerThemeAlias("android.holo-light", ANDROID5_LIGHT);
        registerThemeAlias("android.dark", ANDROID5_LIGHT);
        registerThemeAlias("android.light", ANDROID5_LIGHT)
    })(DevExpress);
    /*! Module viz-core, file ios.js */
    (function(DX) {
        var IOS7_DEFAULT = "ios7.default",
            viz = DX.viz;
        viz.registerTheme({
            name: IOS7_DEFAULT,
            backgroundColor: "#ffffff",
            primaryTitleColor: "#000000",
            secondaryTitleColor: "#767676",
            axisColor: "#ececec",
            axisLabelColor: "#767676",
            legend: {font: {color: "#000000"}},
            tooltip: {font: {color: "#767676"}},
            "chart:common": {commonSeriesSettings: {label: {border: {color: "#d3d3d3"}}}},
            chart: {commonPaneSettings: {border: {color: "#d3d3d3"}}}
        }, "generic.light");
        viz.registerThemeAlias("ios", IOS7_DEFAULT)
    })(DevExpress);
    /*! Module viz-core, file win.js */
    (function(DX) {
        var viz = DX.viz,
            registerTheme = viz.registerTheme,
            registerThemeSchemeAlias = viz.registerThemeSchemeAlias,
            BLACK = "#000000",
            WHITE = "#ffffff",
            WIN10_WHITE = "win10.white",
            WIN10_BLACK = "win10.black",
            WIN8_WHITE = "win8.white",
            WIN8_BLACK = "win8.black";
        registerTheme({
            name: WIN10_BLACK,
            backgroundColor: BLACK,
            primaryTitleColor: WHITE,
            secondaryTitleColor: "#d8d8d8",
            axisColor: "#4c4c4c",
            axisLabelColor: WHITE,
            title: {font: {color: WHITE}},
            legend: {font: {color: WHITE}},
            tooltip: {
                color: BLACK,
                font: {color: WHITE}
            },
            "chart:common": {commonSeriesSettings: {label: {border: {color: '#454545'}}}},
            chart: {commonPaneSettings: {border: {color: '#454545'}}},
            pieIE8: {commonSeriesSettings: {
                    pie: {
                        hoverStyle: {border: {color: BLACK}},
                        selectionStyle: {border: {color: BLACK}}
                    },
                    donut: {
                        hoverStyle: {border: {color: BLACK}},
                        selectionStyle: {border: {color: BLACK}}
                    },
                    doughnut: {
                        hoverStyle: {border: {color: BLACK}},
                        selectionStyle: {border: {color: BLACK}}
                    }
                }},
            barGauge: {backgroundColor: "#2b3036"}
        }, "generic.dark");
        registerTheme({
            name: WIN10_WHITE,
            backgroundColor: WHITE,
            primaryTitleColor: BLACK,
            secondaryTitleColor: "#767676",
            axisColor: "#ececec",
            axisLabelColor: BLACK,
            title: {font: {color: BLACK}},
            legend: {font: {color: BLACK}},
            tooltip: {font: {color: BLACK}}
        }, "generic.light");
        registerThemeSchemeAlias("win10.dark", WIN10_BLACK);
        registerThemeSchemeAlias("win10.light", WIN10_WHITE);
        registerTheme({name: WIN8_BLACK}, WIN10_BLACK);
        registerTheme({name: WIN8_WHITE}, WIN10_WHITE);
        registerThemeSchemeAlias("win8.dark", WIN8_BLACK);
        registerThemeSchemeAlias("win8.light", WIN8_WHITE)
    })(DevExpress);
    /*! Module viz-core, file themeManager.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            isIE8 = !viz.renderers.isSvg(),
            commonUtils = DX.require("/utils/utils.common"),
            _isString = commonUtils.isString,
            _isDefined = commonUtils.isDefined,
            _normalizeEnum = viz.utils.normalizeEnum,
            FONT = "font",
            COMMON_AXIS_SETTINGS = "commonAxisSettings",
            PIE_FONT_FIELDS = ["legend." + FONT, "title." + FONT, "title.subtitle." + FONT, "tooltip." + FONT, "loadingIndicator." + FONT, "commonSeriesSettings.label." + FONT],
            POLAR_FONT_FIELDS = PIE_FONT_FIELDS.concat([COMMON_AXIS_SETTINGS + ".label." + FONT, COMMON_AXIS_SETTINGS + ".title." + FONT]),
            CHART_FONT_FIELDS = POLAR_FONT_FIELDS.concat(["crosshair.label." + FONT]),
            chartToFontFieldsMap = {
                pie: PIE_FONT_FIELDS,
                chart: CHART_FONT_FIELDS,
                polar: POLAR_FONT_FIELDS
            };
        viz.charts = viz.charts || {};
        viz.charts.ThemeManager = viz.BaseThemeManager.inherit(function() {
            var ctor = function(options, themeGroupName) {
                    var that = this;
                    that.callBase.apply(that, arguments);
                    options = options || {};
                    that._userOptions = options;
                    that._mergeAxisTitleOptions = [];
                    that._multiPieColors = {};
                    that._themeSection = themeGroupName;
                    that._fontFields = chartToFontFieldsMap[themeGroupName];
                    that._IE8 = isIE8;
                    that._callback = $.noop
                };
            var dispose = function() {
                    var that = this;
                    that.palette && that.palette.dispose();
                    that.palette = that._userOptions = that._mergedSettings = that._multiPieColors = null;
                    return that.callBase.apply(that, arguments)
                };
            var resetPalette = function() {
                    this.palette.reset();
                    this._multiPieColors = {}
                };
            var updatePalette = function(palette) {
                    this.palette = this.createPalette(palette, {useHighlight: true})
                };
            var processTitleOptions = function(options) {
                    return _isString(options) ? {text: options} : options
                };
            var processAxisOptions = function(axisOptions) {
                    if (!axisOptions)
                        return;
                    axisOptions = $.extend(true, {}, axisOptions);
                    axisOptions.title = processTitleOptions(axisOptions.title);
                    if (axisOptions.type === "logarithmic" && axisOptions.logarithmBase <= 0 || axisOptions.logarithmBase && !$.isNumeric(axisOptions.logarithmBase)) {
                        axisOptions.logarithmBase = undefined;
                        axisOptions.logarithmBaseError = true
                    }
                    if (axisOptions.label) {
                        if (axisOptions.label.alignment)
                            axisOptions.label["userAlignment"] = true;
                        if (_isString(axisOptions.label.overlappingBehavior))
                            axisOptions.label.overlappingBehavior = {mode: axisOptions.label.overlappingBehavior};
                        if (!axisOptions.label.overlappingBehavior || !axisOptions.label.overlappingBehavior.mode)
                            axisOptions.label.overlappingBehavior = axisOptions.label.overlappingBehavior || {}
                    }
                    return axisOptions
                };
            var applyParticularAxisOptions = function(name, userOptions, rotated) {
                    var theme = this._theme,
                        position = !(rotated ^ name === "valueAxis") ? "horizontalAxis" : "verticalAxis",
                        commonAxisSettings = processAxisOptions(this._userOptions["commonAxisSettings"], name);
                    return $.extend(true, {}, theme.commonAxisSettings, theme[position], theme[name], commonAxisSettings, processAxisOptions(userOptions, name))
                };
            var mergeOptions = function(name, userOptions) {
                    userOptions = userOptions || this._userOptions[name];
                    var theme = this._theme[name],
                        result = this._mergedSettings[name];
                    if (result)
                        return result;
                    if ($.isPlainObject(theme) && $.isPlainObject(userOptions))
                        result = $.extend(true, {}, theme, userOptions);
                    else
                        result = _isDefined(userOptions) ? userOptions : theme;
                    this._mergedSettings[name] = result;
                    return result
                };
            var applyParticularTheme = {
                    base: mergeOptions,
                    argumentAxis: applyParticularAxisOptions,
                    valueAxisRangeSelector: function() {
                        return mergeOptions.call(this, "valueAxis")
                    },
                    valueAxis: applyParticularAxisOptions,
                    series: function(name, userOptions) {
                        var that = this,
                            theme = that._theme,
                            userCommonSettings = that._userOptions.commonSeriesSettings || {},
                            themeCommonSettings = theme.commonSeriesSettings,
                            widgetType = that._themeSection.split(".").slice(-1)[0],
                            type = _normalizeEnum(userOptions.type || userCommonSettings.type || themeCommonSettings.type || widgetType === "pie" && theme.type),
                            settings,
                            palette = that.palette,
                            isBar = ~type.indexOf("bar"),
                            isLine = ~type.indexOf("line"),
                            isArea = ~type.indexOf("area"),
                            isBubble = type === "bubble",
                            mainSeriesColor,
                            resolveLabelsOverlapping = that.getOptions("resolveLabelsOverlapping"),
                            resolveLabelOverlapping = that.getOptions("resolveLabelOverlapping"),
                            containerBackgroundColor = that.getOptions("containerBackgroundColor"),
                            seriesVisibility;
                        if (isBar || isBubble) {
                            userOptions = $.extend(true, {}, userCommonSettings, userCommonSettings[type], userOptions);
                            seriesVisibility = userOptions.visible;
                            userCommonSettings = {type: {}};
                            $.extend(true, userOptions, userOptions.point);
                            userOptions.visible = seriesVisibility
                        }
                        settings = $.extend(true, {}, themeCommonSettings, themeCommonSettings[type], userCommonSettings, userCommonSettings[type], userOptions);
                        settings.type = type;
                        settings.widgetType = widgetType;
                        settings.containerBackgroundColor = containerBackgroundColor;
                        if (widgetType !== "pie")
                            mainSeriesColor = settings.color || palette.getNextColor();
                        else
                            mainSeriesColor = function(argument, index) {
                                var cat = argument + index;
                                if (!that._multiPieColors[cat])
                                    that._multiPieColors[cat] = palette.getNextColor();
                                return that._multiPieColors[cat]
                            };
                        settings.mainSeriesColor = mainSeriesColor;
                        settings._IE8 = isIE8;
                        settings.resolveLabelOverlapping = resolveLabelOverlapping;
                        settings.resolveLabelsOverlapping = resolveLabelsOverlapping;
                        if (settings.label && (isLine || isArea && type !== "rangearea" || type === "scatter"))
                            settings.label.position = "outside";
                        return settings
                    },
                    animation: function(name) {
                        var userOptions = this._userOptions[name];
                        userOptions = $.isPlainObject(userOptions) ? userOptions : _isDefined(userOptions) ? {enabled: !!userOptions} : {};
                        return mergeOptions.call(this, name, userOptions)
                    }
                };
            return {
                    _themeSection: "chart",
                    ctor: ctor,
                    dispose: dispose,
                    resetPalette: resetPalette,
                    getOptions: function(name) {
                        return (applyParticularTheme[name] || applyParticularTheme.base).apply(this, arguments)
                    },
                    refresh: function() {
                        this._mergedSettings = {};
                        return this.callBase.apply(this, arguments)
                    },
                    _initializeTheme: function() {
                        var that = this;
                        that.callBase.apply(that, arguments);
                        that.updatePalette(that.getOptions("palette"))
                    },
                    resetOptions: function(name) {
                        this._mergedSettings[name] = null
                    },
                    update: function(options) {
                        this._userOptions = options
                    },
                    updatePalette: updatePalette
                }
        }());
        DevExpress.viz._setIE8Mode = function(isIE8Mode) {
            var initIEMode = isIE8;
            isIE8 = isIE8Mode;
            return initIEMode
        };
        DevExpress.viz._resetIE8Mode = function(initIEMode) {
            isIE8 = initIEMode
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file factory.js */
    (function($, DX) {
        var viz = DX.viz,
            charts = viz.charts;
        charts.factory = function() {
            var createThemeManager = function(options, groupName) {
                    return new charts.ThemeManager(options, groupName)
                };
            var createTracker = function(options, name) {
                    return name === "dxPieChart" ? new charts.PieTracker(options) : new charts.ChartTracker(options)
                };
            var createCrosshair = function(renderer, options, params, group) {
                    return new charts.Crosshair(renderer, options, params, group)
                };
            return {
                    createThemeManager: createThemeManager,
                    createTracker: createTracker,
                    createCrosshair: createCrosshair,
                    createScrollBar: function(renderer, group) {
                        return new DevExpress.viz.charts.ScrollBar(renderer, group)
                    }
                }
        }()
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseWidget.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            _windowResizeCallbacks = DX.require("/utils/utils.window").resizeCallbacks,
            _Number = Number,
            DOMComponent = DX.require("/domComponent"),
            commonUtils = DX.require("/utils/utils.common"),
            _isString = commonUtils.isString,
            _stringFormat = DX.require("/utils/utils.string").format,
            _parseScalar = viz.utils.parseScalar,
            errors = DX.require("/vis/core/errorWarnings"),
            _log = errors.log,
            OPTION_RTL_ENABLED = "rtlEnabled",
            OPTION_LOADING_INDICATOR = "loadingIndicator";
        function getTrue() {
            return true
        }
        function getFalse() {
            return false
        }
        function areCanvasesDifferent(canvas1, canvas2) {
            return !(canvas1.width === canvas2.width && canvas1.height === canvas2.height && canvas1.left === canvas2.left && canvas1.top === canvas2.top && canvas1.right === canvas2.right && canvas1.bottom === canvas2.bottom)
        }
        function createResizeHandler(callback) {
            var $window = $(window),
                width,
                height,
                timeout;
            handler.dispose = function() {
                clearTimeout(timeout);
                return this
            };
            return handler;
            function handler() {
                width = $window.width();
                height = $window.height();
                clearTimeout(timeout);
                timeout = setTimeout(trigger, 100)
            }
            function trigger() {
                $window.width() === width && $window.height() === height && callback()
            }
        }
        function defaultOnIncidentOccurred(e) {
            _log.apply(null, [e.target.id].concat(e.target.args || []))
        }
        var createIncidentOccurred = function(widgetName, eventTrigger) {
                return incidentOccurred;
                function incidentOccurred(id, args) {
                    eventTrigger("incidentOccurred", {target: {
                            id: id,
                            type: id[0] === "E" ? "error" : "warning",
                            args: args,
                            text: _stringFormat.apply(null, [errors.ERROR_MESSAGES[id]].concat(args || [])),
                            widget: widgetName,
                            version: DX.VERSION
                        }})
                }
            };
        function processTitleOptions(options) {
            var newOptions = _isString(options) ? {text: options} : options || {};
            newOptions.subtitle = _isString(newOptions.subtitle) ? {text: newOptions.subtitle} : newOptions.subtitle || {};
            return newOptions
        }
        function pickPositiveValue(value, defaultValue) {
            return _Number(value > 0 ? value : defaultValue || 0)
        }
        viz.DEBUG_createResizeHandler = createResizeHandler;
        viz.BaseWidget = DOMComponent.inherit({
            _eventsMap: {
                onIncidentOccurred: {name: "incidentOccurred"},
                onDrawn: {name: 'drawn'},
                onTooltipShown: {name: 'tooltipShown'},
                onTooltipHidden: {name: 'tooltipHidden'},
                onLoadingIndicatorReady: {name: "loadingIndicatorReady"}
            },
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {onIncidentOccurred: defaultOnIncidentOccurred})
            },
            _useLinks: true,
            _init: function() {
                var that = this,
                    linkTarget;
                that.callBase.apply(that, arguments);
                that._themeManager = that._createThemeManager();
                that._themeManager.setCallback(function() {
                    that._handleThemeOptions()
                });
                that._initRenderer();
                linkTarget = that._useLinks && that._renderer.root;
                linkTarget && linkTarget.enableLinks().virtualLink("core").virtualLink("peripheral");
                that._renderVisibilityChange();
                that._initEventTrigger();
                that._incidentOccured = createIncidentOccurred(that.NAME, that._eventTrigger);
                that._initTooltip();
                that._initTitle();
                linkTarget && linkTarget.linkAfter("core");
                that._initDataSource();
                that._initCore();
                linkTarget && linkTarget.linkAfter();
                that._initLoadingIndicator();
                that._setThemeAndRtl();
                that._setContentSize();
                that._setupResizeHandler()
            },
            _initRenderer: function() {
                var that = this;
                that._canvas = that._calculateCanvas();
                that._renderer = new viz.renderers.Renderer({
                    cssClass: that._rootClassPrefix + " " + that._rootClass,
                    pathModified: that.option("pathModified"),
                    container: that._$element[0]
                });
                that._renderer.resize(that._canvas.width, that._canvas.height)
            },
            _disposeRenderer: function() {
                this._useLinks && this._renderer.root.checkLinks();
                this._renderer.dispose()
            },
            _initTitle: function() {
                this._title = new viz.Title({
                    renderer: this._renderer,
                    cssClass: this._rootClassPrefix + "-title",
                    incidentOccured: this._incidentOccured
                })
            },
            _disposeTitle: function() {
                this._title && this._title.dispose()
            },
            _initTooltip: function() {
                var that = this;
                that._tooltip = new viz.Tooltip({
                    cssClass: that._rootClassPrefix + "-tooltip",
                    eventTrigger: that._eventTrigger,
                    pathModified: that.option("pathModified")
                })
            },
            _disposeTooltip: function() {
                this._tooltip && this._tooltip.dispose()
            },
            _initDataSource: function() {
                var that = this;
                that._dataSource = new viz.DataSource(function() {
                    that._dataSourceChangedHandler()
                })
            },
            _disposeDataSource: function() {
                this._dataSource.dispose()
            },
            _updateDataSource: function() {
                this._dataSource.update(this.option("dataSource"))
            },
            _getAnimationOptions: $.noop,
            render: function() {
                this._updateSize();
                if (!this._$element.is(":visible"))
                    this._hideTooltip()
            },
            _dispose: function() {
                var that = this;
                that.callBase.apply(that, arguments);
                that._removeResizeHandler();
                that._eventTrigger.dispose();
                that._disposeCore();
                that._disposeDataSource();
                that._disposeLoadingIndicator();
                that._disposeTooltip();
                that._disposeTitle();
                that._disposeRenderer();
                that._themeManager.dispose();
                that._themeManager = that._renderer = that._eventTrigger = that._tooltip = that._title = that._dataSource = null
            },
            _initEventTrigger: function() {
                var that = this;
                that._eventTrigger = createEventTrigger(that._eventsMap, function(name) {
                    return that._createActionByOption(name)
                })
            },
            _calculateCanvas: function() {
                var that = this,
                    size = that.option("size") || {},
                    margin = that.option("margin") || {},
                    defaultCanvas = that._getDefaultSize() || {},
                    canvas = {
                        width: size.width <= 0 ? 0 : pickPositiveValue(size.width, that._$element.width() || defaultCanvas.width),
                        height: size.height <= 0 ? 0 : pickPositiveValue(size.height, that._$element.height() || defaultCanvas.height),
                        left: pickPositiveValue(margin.left, defaultCanvas.left || 0),
                        top: pickPositiveValue(margin.top, defaultCanvas.top || 0),
                        right: pickPositiveValue(margin.right, defaultCanvas.right || 0),
                        bottom: pickPositiveValue(margin.bottom, defaultCanvas.bottom || 0)
                    };
                if (canvas.width - canvas.left - canvas.right <= 0 || canvas.height - canvas.top - canvas.bottom <= 0)
                    canvas = {
                        width: 0,
                        height: 0
                    };
                return canvas
            },
            _updateSize: function() {
                var that = this,
                    canvas = that._calculateCanvas();
                if (areCanvasesDifferent(that._canvas, canvas) || that.__forceRender) {
                    that._canvas = canvas;
                    that._renderer.resize(canvas.width, canvas.height);
                    that._setContentSize();
                    that._updateLoadingIndicatorSize();
                    that._resize()
                }
            },
            _setContentSize: function() {
                this._applySize();
                this._updateLoadingIndicatorSize()
            },
            DEBUG_getCanvas: function() {
                return this._canvas
            },
            DEBUG_getEventTrigger: function() {
                return this._eventTrigger
            },
            _getOption: function(name, isScalar) {
                var theme = this._themeManager.theme(name),
                    option = this.option(name);
                return isScalar ? option !== undefined ? option : theme : $.extend(true, {}, theme, option)
            },
            _setupResizeHandler: function() {
                if (_parseScalar(this._getOption('redrawOnResize', true), true))
                    this._addResizeHandler();
                else
                    this._removeResizeHandler()
            },
            _addResizeHandler: function() {
                var that = this;
                if (!that._resizeHandler) {
                    that._resizeHandler = createResizeHandler(function() {
                        that._updateSize()
                    });
                    _windowResizeCallbacks.add(that._resizeHandler)
                }
            },
            _removeResizeHandler: function() {
                if (this._resizeHandler) {
                    _windowResizeCallbacks.remove(this._resizeHandler);
                    this._resizeHandler.dispose();
                    this._resizeHandler = null
                }
            },
            beginUpdate: function() {
                var that = this;
                that.callBase.apply(that, arguments);
                if (that._initialized && that._updateLockCount === 1)
                    that._changedOptions = {
                        _has: hasAnyOfFields,
                        _num: 0
                    };
                return that
            },
            endUpdate: function() {
                var that = this;
                if (that._initialized && that._updateLockCount === 1) {
                    if (that._changedOptions._num) {
                        that._renderer.lock();
                        that._handleChangedOptions(that._changedOptions);
                        that._renderer.unlock()
                    }
                    that._changedOptions = null
                }
                that.callBase.apply(that, arguments);
                return that
            },
            _optionChanged: function(args) {
                ++this._changedOptions._num;
                this._changedOptions[args.name] = args.value;
                this.callBase.apply(this, arguments)
            },
            _handleChangedOptions: function(options) {
                var that = this;
                that._scheduleLoadingIndicatorHiding();
                $.each(options, function(name) {
                    that._eventTrigger.update(name)
                });
                if ("redrawOnResize" in options)
                    that._setupResizeHandler();
                if ("theme" in options || OPTION_RTL_ENABLED in options)
                    that._setThemeAndRtl();
                if ("encodeHtml" in options)
                    that._handleThemeOptions();
                if ("tooltip" in options)
                    that._setTooltipOptions();
                if ("title" in options)
                    that._updateTitle();
                if (OPTION_LOADING_INDICATOR in options)
                    that._updateLoadingIndicatorOptions();
                if ("size" in options || "margin" in options)
                    that._updateSize();
                if (options._has(that._invalidatingOptions || []))
                    that._invalidate()
            },
            _handleThemeOptions: function() {
                var that = this,
                    options = {
                        rtl: that.option(OPTION_RTL_ENABLED),
                        encodeHtml: that.option("encodeHtml"),
                        animation: that._getAnimationOptions()
                    };
                that._renderer.setOptions(options);
                that._setTooltipRendererOptions(options);
                that._setTooltipOptions();
                that._renderer.lock();
                that._updateTitle();
                that._updateLoadingIndicatorOptions();
                that._handleThemeOptionsCore();
                that._renderer.unlock()
            },
            _handleThemeOptionsCore: function() {
                this._initialized && this._refresh()
            },
            _visibilityChanged: function() {
                this.render()
            },
            _setThemeAndRtl: function() {
                this._themeManager.setTheme(this.option("theme"), this.option(OPTION_RTL_ENABLED))
            },
            _setTooltipRendererOptions: function(options) {
                this._tooltip.setRendererOptions(options)
            },
            _setTooltipOptions: function() {
                this._tooltip.update(this._getOption("tooltip"))
            },
            _updateTitle: function() {
                this._title.update($.extend(true, {}, this._themeManager.theme("title"), processTitleOptions(this.option("title"))))
            },
            _hideTooltip: function() {
                this._tooltip.hide()
            },
            _normalizeHtml: function(html) {
                var re = /xmlns="[\s\S]*?"/gi,
                    first = true;
                html = html.replace(re, function(match) {
                    if (!first)
                        return "";
                    first = false;
                    return match
                });
                return html.replace(/xmlns:NS1="[\s\S]*?"/gi, "").replace(/NS1:xmlns:xlink="([\s\S]*?)"/gi, 'xmlns:xlink="$1"')
            },
            svg: function() {
                return this._normalizeHtml(this._renderer.svg())
            },
            isReady: getFalse,
            _dataIsReady: getTrue,
            _resetIsReady: function() {
                this.isReady = getFalse
            },
            _drawn: function() {
                var that = this;
                that.isReady = getFalse;
                that._dataIsReady() && that._renderer.onEndAnimation(function() {
                    that.isReady = getTrue
                });
                that._eventTrigger('drawn', {})
            },
            _initLoadingIndicator: function() {
                var that = this;
                that._loadingIndicator = new viz.LoadingIndicator({
                    eventTrigger: that._eventTrigger,
                    renderer: that._renderer,
                    notify: notify
                });
                function notify(state) {
                    that._skipLoadingIndicatorOptions = true;
                    that.option(OPTION_LOADING_INDICATOR, {show: state});
                    that._skipLoadingIndicatorOptions = false;
                    if (state)
                        that._hideTooltip()
                }
            },
            _disposeLoadingIndicator: function() {
                this._loadingIndicator.dispose();
                this._loadingIndicator = null
            },
            _updateLoadingIndicatorSize: function() {
                this._loadingIndicator.setSize(this._canvas)
            },
            _updateLoadingIndicatorOptions: function() {
                if (!this._skipLoadingIndicatorOptions)
                    this._loadingIndicator.setOptions(this._getOption(OPTION_LOADING_INDICATOR))
            },
            _scheduleLoadingIndicatorHiding: function() {
                this._loadingIndicator.scheduleHiding()
            },
            _fulfillLoadingIndicatorHiding: function() {
                this._loadingIndicator.fulfillHiding()
            },
            showLoadingIndicator: function() {
                this._loadingIndicator.show()
            },
            hideLoadingIndicator: function() {
                this._loadingIndicator.hide()
            }
        });
        function hasAnyOfFields(fields) {
            var i,
                ii = fields.length;
            for (i = 0; !(fields[i] in this) && i < ii; ++i);;
            return i < ii
        }
        function createEventTrigger(eventsMap, callbackGetter) {
            var triggers = {};
            $.each(eventsMap, function(name, info) {
                if (info.name)
                    createEvent(name)
            });
            triggerEvent.update = function(name) {
                var eventInfo = eventsMap[name];
                if (eventInfo)
                    createEvent(eventInfo.newName || name);
                return !!eventInfo
            };
            triggerEvent.dispose = function() {
                eventsMap = callbackGetter = triggers = null
            };
            return triggerEvent;
            function createEvent(name) {
                var eventInfo = eventsMap[name];
                triggers[eventInfo.name] = callbackGetter(name)
            }
            function triggerEvent(name, arg, complete) {
                triggers[name](arg);
                complete && complete()
            }
        }
        viz.DEBUG_createEventTrigger = createEventTrigger;
        viz.DEBUG_createIncidentOccurred = createIncidentOccurred;
        viz.DEBUG_stub_createIncidentOccurred = function(stub) {
            createIncidentOccurred = stub
        };
        viz.DEBUG_restore_createIncidentOccurred = function() {
            createIncidentOccurred = viz.DEBUG_createIncidentOccurred
        }
    })(DevExpress, jQuery);
    /*! Module viz-core, file CoreFactory.js */
    (function(DX, undefined) {
        var viz = DX.viz,
            seriesNS = viz.series,
            pointsNS = seriesNS.points;
        viz.CoreFactory = {
            createSeries: function(renderSettings, options) {
                return new seriesNS.Series(renderSettings, options)
            },
            createPoint: function(series, data, options) {
                return new pointsNS.Point(series, data, options)
            },
            createLabel: function(options) {
                return new pointsNS.Label(options)
            },
            createTranslator1D: function(fromValue, toValue, fromAngle, toAngle) {
                return (new viz.Translator1D).setDomain(fromValue, toValue).setCodomain(fromAngle, toAngle)
            },
            createTranslator2D: function(range, canvas, options) {
                return new viz.Translator2D(range, canvas, options)
            },
            createTickManager: function(types, data, options) {
                return new viz.tickManager.TickManager(types, data, options)
            },
            createLegend: function(settings) {
                return new viz.Legend(settings)
            },
            createSeriesFamily: function(options) {
                return new seriesNS.helpers.SeriesFamily(options)
            }
        }
    })(DevExpress);
    DevExpress.MOD_VIZ_CORE = true
}