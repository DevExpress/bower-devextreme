/*! 
* DevExtreme (Visualization Core Library)
* Version: 15.1.5
* Build date: Jul 15, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!DevExpress.MOD_VIZ_CORE) {
    if (!window.DevExpress)
        throw Error('Required module is not referenced: core');
    /*! Module viz-core, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz = {}
    })(DevExpress);
    /*! Module viz-core, file namespaces.js */
    (function(DevExpress) {
        DevExpress.viz.core = {}
    })(DevExpress);
    /*! Module viz-core, file errorsWarnings.js */
    (function($, DX) {
        $.extend(DX.ERROR_MESSAGES, {
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
            W2001: "{0} cannot be drawn because its container is invisible",
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
    })(jQuery, DevExpress);
    /*! Module viz-core, file numericTickManager.js */
    (function($, DX, undefined) {
        var core = DX.viz.core,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _adjustValue = utils.adjustValue,
            _math = Math,
            _abs = _math.abs,
            _ceil = _math.ceil,
            _floor = _math.floor,
            _noop = $.noop,
            MINOR_TICKS_COUNT_LIMIT = 200,
            DEFAULT_MINOR_NUMBER_MULTIPLIERS = [2, 4, 5, 8, 10];
        core.outOfScreen = {
            x: -1000,
            y: -1000
        };
        core.tickManager = {};
        core.tickManager.continuous = {
            _hasUnitBeginningTickCorrection: _noop,
            _removeBoundedOverlappingDates: _noop,
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
                return utils.applyPrecisionByMinDelta(min, margin, _abs(max - min) * margin)
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
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file datetimeTickManager.js */
    (function($, DX, undefined) {
        var core = DX.viz.core,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _convertDateUnitToMilliseconds = utils.convertDateUnitToMilliseconds,
            _correctDateWithUnitBeginning = utils.correctDateWithUnitBeginning,
            _dateToMilliseconds = utils.dateToMilliseconds,
            _convertMillisecondsToDateUnits = utils.convertMillisecondsToDateUnits,
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
        core.tickManager.datetime = $.extend({}, core.tickManager.continuous, {
            _correctInterval: function(step) {
                var tickIntervalInMs = _dateToMilliseconds(this._tickInterval);
                this._tickInterval = _convertMillisecondsToDateUnits(tickIntervalInMs * step)
            },
            _correctMax: function(tickInterval) {
                var interval = _dateToMilliseconds(tickInterval);
                this._max = new Date(_ceil(this._max / interval) * interval)
            },
            _correctMin: function(tickInterval) {
                var interval = _dateToMilliseconds(tickInterval);
                this._min = new Date(_floor(this._min / interval) * interval);
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
                var newValue = utils.addInterval(value, tickInterval, isTickIntervalNegative);
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
            _removeBoundedOverlappingDates: function() {
                var dates = this._ticks;
                if (dates.length > 2 && this.getOverlappingBehavior().mode !== "stagger" && !this._areDisplayValuesValid(dates[0], dates[1]))
                    dates.splice(1, 1)
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file logarithmicTickManager.js */
    (function($, DX, undefined) {
        var core = DX.viz.core,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _addInterval = utils.addInterval,
            _adjustValue = utils.adjustValue,
            _getLog = utils.getLog,
            _raiseTo = utils.raiseTo,
            _math = Math,
            _abs = _math.abs,
            _ceil = _math.ceil,
            _floor = _math.floor,
            _round = _math.round;
        core.tickManager.logarithmic = $.extend({}, core.tickManager.continuous, {
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
                    delta = core.tickManager.continuous._findBusinessDelta(min, max);
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
        var core = DX.viz.core,
            coreTickManager = core.tickManager,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _isNumber = utils.isNumber,
            _math = Math,
            _abs = _math.abs,
            _ceil = _math.ceil,
            _floor = _math.floor,
            _atan = _math.atan,
            _max = _math.max,
            _each = $.each,
            _map = $.map,
            _noop = $.noop,
            _isFunction = $.isFunction,
            SCREEN_DELTA_KOEF = 4,
            AXIS_STAGGER_OVERLAPPING_KOEF = 2,
            STAGGER = "stagger",
            ROTATE = "rotate",
            MIN_ARRANGEMENT_TICKS_COUNT = 2;
        function nextState(state) {
            switch (state) {
                case"overlap":
                    return STAGGER;
                case STAGGER:
                    return ROTATE;
                default:
                    return "end"
            }
        }
        function defaultGetTextFunc(value) {
            return value.toString()
        }
        coreTickManager.overlappingMethods = {};
        coreTickManager.overlappingMethods.base = {
            _applyOverlappingBehavior: function() {
                var that = this,
                    options = that._options,
                    overlappingBehavior = options && options.overlappingBehavior;
                if (overlappingBehavior && overlappingBehavior.mode !== "ignore") {
                    that._useAutoArrangement = true;
                    that._correctTicks();
                    if (overlappingBehavior.mode === "auto") {
                        that._applyAutoOverlappingBehavior();
                        that._useAutoArrangement = options.overlappingBehavior.isOverlapped
                    }
                    if (that._useAutoArrangement) {
                        if (overlappingBehavior.mode === STAGGER)
                            that._screenDelta *= AXIS_STAGGER_OVERLAPPING_KOEF;
                        that._applyAutoArrangement()
                    }
                }
            },
            _checkBoundedTicksOverlapping: function() {
                this._removeBoundedOverlappingDates();
                this._applyStartEndTicksCorrection()
            },
            getMaxLabelParams: function(ticks) {
                var that = this,
                    getText = that._options.getText || defaultGetTextFunc,
                    tickWithMaxLength,
                    tickTextWithMaxLength,
                    maxLength = 0,
                    bbox;
                ticks = ticks || that._getMajorTicks();
                if (!ticks.length)
                    return {
                            width: 0,
                            height: 0,
                            length: 0,
                            y: 0
                        };
                _each(ticks, function(_, item) {
                    var text = getText(item, that._options.labelOptions),
                        length = text.length;
                    if (maxLength < length) {
                        maxLength = length;
                        tickWithMaxLength = item;
                        tickTextWithMaxLength = text
                    }
                });
                bbox = that._getTextElementBbox(tickWithMaxLength, tickTextWithMaxLength);
                return {
                        width: bbox.width,
                        height: bbox.height,
                        y: bbox.y,
                        length: maxLength
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
        coreTickManager.overlappingMethods.circular = $.extend({}, coreTickManager.overlappingMethods.base, {
            _correctTicks: _noop,
            _applyAutoOverlappingBehavior: function() {
                this._options.overlappingBehavior.isOverlapped = true
            },
            _getTextElementBbox: function(value, text) {
                var textOptions = $.extend({}, this._options.textOptions, {rotate: 0}),
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
            _applyStartEndTicksCorrection: function() {
                var ticks = this._ticks,
                    lastTick = ticks[ticks.length - 1];
                if (ticks.length > 1 && !this._areDisplayValuesValid(ticks[0], lastTick))
                    ticks.pop()
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
        coreTickManager.overlappingMethods.linear = $.extend({}, coreTickManager.overlappingMethods.base, {
            _correctTicks: function() {
                var getIntervalFunc = coreTickManager.continuous._getInterval,
                    arrangementStep;
                if (this._testingGetIntervalFunc)
                    getIntervalFunc = this._testingGetIntervalFunc;
                arrangementStep = _ceil(getIntervalFunc.call(this, this._getDeltaCoef(this._screenDelta * SCREEN_DELTA_KOEF, this._ticks.length))) || this._ticks.length;
                this._appliedArrangementStep = arrangementStep;
                this._ticks = this._getAutoArrangementTicks(arrangementStep)
            },
            _getTextElementBbox: function(value, text) {
                var textOptions = $.extend({}, this._options.textOptions, {rotate: 0}),
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
            _applyStartEndTicksCorrection: _noop,
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
            _getOptimalRotationAngle: function() {
                var that = this,
                    options = that._options,
                    tick1 = that._ticks[0],
                    tick2 = that._ticks[1],
                    outOfScreen = core.outOfScreen,
                    textOptions = that._textOptions,
                    getText = options.getText || defaultGetTextFunc,
                    textFontStyles = options.textFontStyles,
                    svgElement1 = options.renderText(getText(tick1, options.labelOptions), outOfScreen.x + options.translate(tick1, !options.isHorizontal), outOfScreen.y).css(textFontStyles).attr(textOptions),
                    svgElement2 = options.renderText(getText(tick2, options.labelOptions), outOfScreen.x + options.translate(tick2, !options.isHorizontal), outOfScreen.y).css(textFontStyles).attr(textOptions),
                    bBox1 = svgElement1.getBBox(),
                    bBox2 = svgElement2.getBBox(),
                    angle = _math.asin((bBox1.height + options.textSpacing) / (bBox2.x - bBox1.x)) * 180 / Math.PI;
                svgElement1.remove();
                svgElement2.remove();
                return isNaN(angle) ? 90 : _ceil(angle)
            },
            _applyAutoOverlappingBehavior: function() {
                var that = this,
                    overlappingBehavior = that._options.overlappingBehavior,
                    screenDelta = that._screenDelta,
                    isOverlapped = false,
                    rotationAngle = null,
                    mode = null,
                    state = "overlap";
                while (state !== "end") {
                    isOverlapped = rotationAngle && rotationAngle !== 90 ? false : that._isOverlappedTicks(screenDelta);
                    state = nextState(isOverlapped ? state : null);
                    switch (state) {
                        case STAGGER:
                            screenDelta *= AXIS_STAGGER_OVERLAPPING_KOEF;
                            mode = state;
                            break;
                        case ROTATE:
                            rotationAngle = that._getOptimalRotationAngle();
                            screenDelta = that._screenDelta;
                            mode = state;
                            break
                    }
                }
                overlappingBehavior.isOverlapped = isOverlapped;
                overlappingBehavior.mode = mode;
                overlappingBehavior.rotationAngle = rotationAngle
            },
            _getDistanceByAngle: function(elementHeight, rotationAngle) {
                return elementHeight / _abs(_math.sin(rotationAngle * (_math.PI / 180)))
            },
            _getTicksSize: function() {
                var that = this,
                    options = that._options,
                    ticks = that._ticks,
                    ticksString,
                    rotationAngle = options.overlappingBehavior ? options.overlappingBehavior.rotationAngle : 0,
                    bBox,
                    result,
                    getText = options.getText || defaultGetTextFunc,
                    isRotate = _isNumber(rotationAngle) && rotationAngle !== 0,
                    joinNeeded = !isRotate && options.isHorizontal;
                if (ticks.length === 0)
                    return 0;
                ticksString = joinNeeded ? _map(ticks, function(tick) {
                    return getText(tick, options.labelOptions)
                }).join("\n") : getText(ticks[0], options.labelOptions);
                bBox = that._getTextElementBbox(ticksString, ticksString);
                result = isRotate ? that._getDistanceByAngle(bBox.height, rotationAngle) : options.isHorizontal ? bBox.width : bBox.height;
                return _ceil(result)
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseTickManager.js */
    (function($, DX, undefined) {
        var core = DX.viz.core,
            coreTickManager = core.tickManager,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _isNumber = utils.isNumber,
            _addInterval = utils.addInterval,
            _adjustValue = utils.adjustValue,
            _each = $.each,
            _map = $.map,
            _inArray = $.inArray,
            _noop = $.noop,
            DEFAULT_GRID_SPACING_FACTOR = 30,
            DEFAULT_MINOR_GRID_SPACING_FACTOR = 15,
            DEFAULT_NUMBER_MULTIPLIERS = [1, 2, 3, 5],
            TICKS_COUNT_LIMIT = 2000,
            MIN_ARRANGEMENT_TICKS_COUNT = 2;
        function concatAndSort(array1, array2) {
            var array = array1.concat(array2).sort(function(x, y) {
                    return _isDefined(x) && _isDefined(y) && x.valueOf() - y.valueOf()
                }),
                length = array.length,
                i;
            for (i = length - 1; i > 0; i--)
                if (_isDefined(array[i]) && _isDefined(array[i - 1]) && array[i].valueOf() === array[i - 1].valueOf())
                    array.splice(i, 1);
            return array
        }
        coreTickManager.discrete = $.extend({}, coreTickManager.continuous, {
            _getMinorTicks: _noop,
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
        coreTickManager.TickManager = DX.Class.inherit({
            ctor: function(types, data, options) {
                options = options || {};
                this.update(types || {}, data || {}, options);
                this._initOverlappingMethods(options.overlappingBehaviorType)
            },
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
                that._ticks = that._getMajorTicks();
                that._checkLabelFormat();
                that._decimatedTicks = [];
                that._applyAutoArrangement();
                !withoutOverlappingBehavior && that._applyOverlappingBehavior();
                that._generateBounds();
                if (options.showMinorTicks)
                    that._minorTicks = that._customMinorTicks || that._getMinorTicks();
                that._addBoundedTicks();
                !withoutOverlappingBehavior && that._checkBoundedTicksOverlapping();
                return that._ticks
            },
            getMinorTicks: function() {
                var that = this,
                    decimatedTicks = that._decimatedTicks || [],
                    options = that._options || {},
                    hasDecimatedTicks = decimatedTicks.length,
                    hasMinorTickOptions = _isDefined(options.minorTickInterval) || _isDefined(options.minorTickCount),
                    hasCustomMinorTicks = that._customMinorTicks && that._customMinorTicks.length,
                    hasMinorTicks = options.showMinorTicks && (hasMinorTickOptions || hasCustomMinorTicks),
                    ticks = hasDecimatedTicks && !hasMinorTicks ? decimatedTicks : that._minorTicks || [];
                return concatAndSort(ticks, [])
            },
            getDecimatedTicks: function() {
                return concatAndSort(this._decimatedTicks || [], [])
            },
            getFullTicks: function() {
                return concatAndSort(this._ticks || [], this.getMinorTicks(), this._axisType)
            },
            getBoundaryTicks: function() {
                return concatAndSort(this._boundaryTicks || [], [])
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
            _getMajorTicks: function() {
                var ticks;
                if (this._customTicks) {
                    ticks = this._customTicks.slice();
                    this._tickInterval = ticks.length > 1 ? this._findTickIntervalForCustomTicks() : 0
                }
                else
                    ticks = this._createTicks([], this._findTickInterval(), this._min, this._max);
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
                    options.labelOptions.format = DX.formatHelper.getDateFormatByTicks(this._ticks)
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
                    that._ticks.splice(0, 0, min);
                    that._boundaryTicks.push(min);
                    that._checkBoundedTickInArray(min, that._minorTicks);
                    that._checkBoundedTickInArray(min, that._decimatedTicks)
                }
                if (addMinMax.max && _inArray(max.valueOf(), tickValues) === -1) {
                    that._ticks.push(max);
                    that._boundaryTicks.push(max);
                    that._checkBoundedTickInArray(max, that._minorTicks);
                    that._checkBoundedTickInArray(max, that._decimatedTicks)
                }
            },
            _getCorrectionEnabled: function(value, marginSelector) {
                var options = this._options || {},
                    hasPercentStick = options.percentStick && value === 1,
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
                return utils.isDate(value) ? 'datetime' : 'numeric'
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
                return utils.isExponential(value) ? _adjustValue(value) : utils.applyPrecisionByMinDelta(min, interval, value)
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
                            this._options.incidentOccured('W2003')
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
            _getMinorTicks: function() {
                var that = this,
                    minorTicks = [],
                    ticks = that._ticks,
                    ticksLength = ticks.length,
                    hasUnitBeginningTick = that._hasUnitBeginningTickCorrection(),
                    i = hasUnitBeginningTick ? 1 : 0;
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
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file numericTranslator.js */
    (function($, DX, undefined) {
        var utils = DX.utils,
            isDefined = utils.isDefined,
            round = Math.round;
        DX.viz.core.numericTranslatorFunctions = {
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
                    minPoint = Math.min(that.translate(that._getValue(canvasOptions.rangeMin)), that.translate(that._getValue(canvasOptions.rangeMax))),
                    maxPoint = Math.max(that.translate(that._getValue(canvasOptions.rangeMin)), that.translate(that._getValue(canvasOptions.rangeMax)));
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
        var core = DX.viz.core,
            numericTranslator = core.numericTranslatorFunctions;
        core.datetimeTranslatorFunctions = {
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
        var isDefined = DX.utils.isDefined,
            round = Math.round;
        DX.viz.core.categoryTranslatorFunctions = {
            translate: function(category, directionOffset) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    categoryRecord = that._categoriesToPoints[category],
                    stickDelta,
                    specialValue = that.translateSpecialCase(category),
                    startPointIndex = canvasOptions.startPointIndex || 0,
                    stickInterval = that._businessRange.stick ? 0 : 0.5;
                if (isDefined(specialValue))
                    return specialValue;
                if (!categoryRecord)
                    return null;
                directionOffset = directionOffset || 0;
                directionOffset = canvasOptions.invert ? -directionOffset : directionOffset;
                stickDelta = categoryRecord.index + stickInterval - startPointIndex + directionOffset * 0.5;
                return round(canvasOptions.startPoint + canvasOptions.interval * stickDelta)
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
                    interval = canvasOptions.interval * scale,
                    translateCaltegories = translate / interval,
                    stick = that._businessRange.stick,
                    startCategoryIndex = parseInt((canvasOptions.startPointIndex || 0) + translateCaltegories + 0.5),
                    categoriesLength = parseInt(canvasOptions.canvasLength / interval + (stick ? 1 : 0)) || 1,
                    endCategoryIndex,
                    newVisibleCategories,
                    categories = that._categories,
                    newInterval;
                canvasOptions.invert && (categories = categories.slice().reverse());
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
                translate = that.translate(newVisibleCategories[0]) * scale - (canvasOptions.startPoint + (stick ? 0 : newInterval / 2));
                return {
                        min: !canvasOptions.invert ? newVisibleCategories[0] : newVisibleCategories[newVisibleCategories.length - 1],
                        max: !canvasOptions.invert ? newVisibleCategories[newVisibleCategories.length - 1] : newVisibleCategories[0],
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
        var core = DX.viz.core,
            numericTranslator = core.numericTranslatorFunctions,
            utils = DX.utils,
            raiseTo = utils.raiseTo,
            getLog = utils.getLog;
        core.logarithmicTranslatorFunctions = {
            translate: function(bp) {
                var that = this,
                    specialValue = that.translateSpecialCase(bp);
                if (utils.isDefined(specialValue))
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
                val1 = utils.isDefined(val1) ? getLog(val1, base) : undefined;
                val2 = utils.isDefined(val2) ? getLog(val2, base) : undefined;
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
        DX.viz.core.Translator1D = Translator1D
    })(DevExpress);
    /*! Module viz-core, file translator2D.js */
    (function($, DX, undefined) {
        var core = DX.viz.core,
            utils = DX.utils,
            getLog = utils.getLog,
            getPower = utils.getPower,
            isDefined = utils.isDefined,
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
        var makeCategoriesToPoints = function(categories, invert) {
                var categoriesToPoints = {},
                    category,
                    length = categories.length,
                    i;
                for (i = 0; i < length; i++) {
                    category = categories[i];
                    categoriesToPoints[category] = {
                        name: category,
                        index: invert ? length - 1 - i : i
                    }
                }
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
        _Translator2d = core.Translator2D = function(businessRange, canvas, options) {
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
                    visibleCategories = utils.getCategoriesInfo(categories, range.minVisible, range.maxVisible).categories,
                    categoriesLength = (visibleCategories || categories).length;
                switch (range.axisType) {
                    case"logarithmic":
                        script = core.logarithmicTranslatorFunctions;
                        break;
                    case"discrete":
                        script = core.categoryTranslatorFunctions;
                        that._categories = categories;
                        canvasOptions.interval = that._getDiscreteInterval(range.addSpiderCategory ? categoriesLength + 1 : categoriesLength, canvasOptions);
                        that._categoriesToPoints = makeCategoriesToPoints(categories, canvasOptions.invert);
                        if (visibleCategories && visibleCategories.length) {
                            canvasOptions.startPointIndex = that._categoriesToPoints[visibleCategories[canvasOptions.invert ? visibleCategories.length - 1 : 0]].index;
                            that.visibleCategories = visibleCategories
                        }
                        break;
                    default:
                        if (range.dataType === "datetime")
                            script = core.datetimeTranslatorFunctions;
                        else
                            script = core.numericTranslatorFunctions
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
                }
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
                    isDateTime = utils.isDate(max) || utils.isDate(min),
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
                if (that._options.direction === "horizontal") {
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
            translateSpecialCase: function(value) {
                var that = this,
                    canvasOptions = that._canvasOptions,
                    startPoint = canvasOptions.startPoint,
                    endPoint = canvasOptions.endPoint,
                    range = that._businessRange,
                    minVisible = range.minVisible,
                    maxVisible = range.maxVisible,
                    invert,
                    result = null;
                switch (value) {
                    case"canvas_position_default":
                        if (minVisible <= 0 && maxVisible >= 0)
                            result = that.translate(0);
                        else {
                            invert = range.invert ^ (minVisible <= 0 && maxVisible <= 0);
                            if (that._options.direction === "horizontal")
                                result = invert ? endPoint : startPoint;
                            else
                                result = invert ? startPoint : endPoint
                        }
                        break;
                    case"canvas_position_left":
                    case"canvas_position_top":
                        result = startPoint;
                        break;
                    case"canvas_position_center":
                    case"canvas_position_middle":
                        result = startPoint + canvasOptions.canvasLength / 2;
                        break;
                    case"canvas_position_right":
                    case"canvas_position_bottom":
                        result = endPoint;
                        break;
                    case"canvas_position_start":
                        result = canvasOptions.invert ? endPoint : startPoint;
                        break;
                    case"canvas_position_end":
                        result = canvasOptions.invert ? startPoint : endPoint;
                        break
                }
                return result
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
        var utils = DX.utils,
            SHIFT_ANGLE = 90,
            _round = Math.round;
        function PolarTranslator(businessRange, canvas, options) {
            var that = this;
            that._argCanvas = {
                left: 0,
                right: 0,
                width: this._getAngle()
            };
            that._valCanvas = {
                left: 0,
                right: 0
            };
            that.canvas = canvas;
            that._init();
            that._arg = new DX.viz.core.Translator2D(businessRange.arg, that._argCanvas, {
                direction: "horizontal",
                conversionValue: true
            });
            that._val = new DX.viz.core.Translator2D(businessRange.val, that._valCanvas, {direction: "horizontal"});
            that._businessRange = businessRange;
            that.startAngle = utils.isNumber(options.startAngle) ? options.startAngle : 0
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
                    angle = utils.isDefined(argTranslate) ? argTranslate + that.startAngle - SHIFT_ANGLE : null,
                    cossin = utils.getCosAndSin(angle),
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
                return this.startAngle - SHIFT_ANGLE
            },
            getInterval: function() {
                return this._arg.getInterval()
            },
            getValInterval: function() {
                return this._val.getInterval()
            },
            _getAngle: function() {
                return 360
            },
            getStartAngle: function() {
                return this.startAngle
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
                translator.getStartAngle = function() {
                    return that.getStartAngle()
                };
                return translator
            },
            _untranslate: function(x, y) {
                var radius = utils.getDistance(this._x0, this._y0, x, y),
                    angle = Math.atan2(y - this._y0, x - this._x0);
                return {
                        r: radius,
                        phi: angle
                    }
            },
            untranslate: function(x, y) {
                var pos = this._untranslate(x, y);
                pos.phi = _round(utils.normalizeAngle(pos.phi * 180 / Math.PI));
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
        DX.viz.core.PolarTranslator = PolarTranslator
    })(jQuery, DevExpress);
    /*! Module viz-core, file rectangle.js */
    (function(DX, undefined) {
        var isFinite = window.isFinite;
        DX.viz.core.Rectangle = DX.Class.inherit({
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
        var core = DX.viz.core,
            _round = Math.round;
        var _splitPair = DX.utils.splitPair;
        var defaultPosition = ["center", "center"],
            defaultOffset = [0, 0];
        var getAlignFactor = function(align) {
                switch (align) {
                    case"center":
                        return 0.5;
                    case"right":
                    case"bottom":
                        return 1;
                    default:
                        return 0
                }
            };
        function WrapperLayoutElement(renderElement, bbox) {
            this._renderElement = renderElement;
            this._cacheBBox = bbox
        }
        WrapperLayoutElement.prototype = {
            position: function(options) {
                var that = this,
                    ofBBox = options.of.getBBox ? options.of.getBBox() : options.of,
                    myBBox = this.getBBox(),
                    at = _splitPair(options.at) || defaultPosition,
                    my = _splitPair(options.my) || defaultPosition,
                    offset = _splitPair(options.offset) || defaultOffset,
                    shiftX = -getAlignFactor(my[0]) * myBBox.width + ofBBox.x - myBBox.x + getAlignFactor(at[0]) * ofBBox.width + parseInt(offset[0]),
                    shiftY = -getAlignFactor(my[1]) * myBBox.height + ofBBox.y - myBBox.y + getAlignFactor(at[1]) * ofBBox.height + parseInt(offset[1]);
                that._renderElement.move(_round(shiftX), _round(shiftY))
            },
            getBBox: function() {
                return this._cacheBBox || this._renderElement.getBBox()
            },
            draw: function(){}
        };
        core.WrapperLayoutElement = WrapperLayoutElement
    })(jQuery, DevExpress);
    /*! Module viz-core, file themes.js */
    (function(DX, $, undefined) {
        var themes = {},
            themesMapping = {},
            themesSchemeMapping = {},
            _extend = $.extend,
            _each = $.each,
            currentThemeName = null,
            nextCacheUid = 0,
            widgetsCache = {};
        function normalizeName(name) {
            return name ? String(name).toLowerCase() : null
        }
        function findTheme(themeName) {
            var name = normalizeName(themeName);
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
            var scheme = normalizeName(colorScheme);
            currentThemeName = (themeName && themeName.platform ? findThemeNameByPlatform(normalizeName(themeName.platform), themeName.version, scheme) : findThemeNameByName(normalizeName(themeName), scheme)) || currentThemeName;
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
            var themeName = normalizeName(theme && theme.name);
            if (themeName) {
                registerThemeName(themeName, themeName);
                themes[themeName] = _extend(true, {}, findTheme(baseThemeName), patchTheme(theme))
            }
        }
        function registerThemeAlias(alias, theme) {
            registerThemeName(normalizeName(alias), normalizeName(theme))
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
                        majorTick: {},
                        minorTick: {},
                        label: {font: {}}
                    }},
                barGauge: {},
                map: {background: {}},
                rangeSelector: {
                    scale: {label: {font: {}}},
                    chart: {}
                },
                sparkline: {},
                bullet: {}
            }, theme);
            mergeScalar(theme.loadingIndicator, "backgroundColor", theme);
            mergeScalar(theme.chart.commonSeriesSettings.candlestick, "innerColor", null, theme.backgroundColor);
            mergeScalar(theme.map.background, "color", null, theme.backgroundColor);
            mergeScalar(theme.title.font, "color", null, theme.primaryTitleColor);
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
                mergeObject(theme[section], "legend", theme)
            });
            _each(["chart", "pie", "polar", "gauge", "barGauge"], function(_, section) {
                mergeObject(theme[section], "title", theme)
            });
            _each(["gauge", "barGauge"], function(_, section) {
                mergeObject(theme[section], "subtitle", null, theme.title)
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
            mergeScalar(theme.gauge.scale.majorTick, colorFieldName, null, theme.backgroundColor);
            mergeScalar(theme.gauge.scale.minorTick, colorFieldName, null, theme.backgroundColor);
            mergeScalar(theme.rangeSelector.scale.label.font, colorFieldName, null, theme.axisLabelColor)
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
        _extend(DX.viz.core, {
            findTheme: findTheme,
            currentTheme: currentTheme,
            registerTheme: registerTheme,
            registerThemeAlias: registerThemeAlias,
            registerThemeSchemeAlias: registerThemeSchemeAlias,
            refreshAll: refreshAll,
            addCacheItem: addCacheItem,
            removeCacheItem: removeCacheItem
        });
        _extend(DX.viz.core, {
            themes: themes,
            themesMapping: themesMapping,
            themesSchemeMapping: themesSchemeMapping,
            widgetsCache: widgetsCache
        })
    })(DevExpress, jQuery);
    /*! Module viz-core, file palette.js */
    (function(DX, $, undefined) {
        var _String = window.String,
            _floor = Math.floor,
            _ceil = Math.ceil,
            _Color = DX.Color,
            _isArray = DX.utils.isArray,
            _isString = DX.utils.isString,
            _extend = $.extend;
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
        var currentPaletteName = 'default';
        function currentPalette(name) {
            if (name === undefined)
                return currentPaletteName;
            else {
                name = String(name).toLowerCase();
                currentPaletteName = name in palettes ? name : 'default'
            }
        }
        function getPalette(palette, parameters) {
            var result;
            if (_isArray(palette))
                result = palette;
            else {
                parameters = parameters || {};
                var type = parameters.type || 'simpleSet';
                if (_isString(palette)) {
                    var name = palette.toLowerCase(),
                        baseContainer = palettes[name],
                        themedContainer = parameters.theme && palettes[name + '_' + _String(parameters.theme).toLowerCase()];
                    result = themedContainer && themedContainer[type] || baseContainer && baseContainer[type]
                }
                if (!result)
                    result = palettes[currentPaletteName][type]
            }
            return result ? result.slice(0) : null
        }
        function registerPalette(name, palette, theme) {
            var item = {};
            if (_isArray(palette))
                item.simpleSet = palette.slice(0);
            else if (palette) {
                item.simpleSet = _isArray(palette.simpleSet) ? palette.simpleSet.slice(0) : undefined;
                item.indicatingSet = _isArray(palette.indicatingSet) ? palette.indicatingSet.slice(0) : undefined;
                item.gradientSet = _isArray(palette.gradientSet) ? palette.gradientSet.slice(0) : undefined
            }
            if (item.simpleSet || item.indicatingSet || item.gradientSet) {
                var paletteName = _String(name).toLowerCase();
                if (theme)
                    paletteName = paletteName + '_' + _String(theme).toLowerCase();
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
            this._originalPalette = getPalette(palette, parameters);
            var stepHighlight = parameters ? parameters.stepHighlight || 0 : 0;
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
            for (i = 0; i <= nsource; ++i)
                colors.push(new _Color(source[i]));
            if (ncolors > 0)
                for (i = 0; i <= ncolors; ++i)
                    addColor(i / ncolors);
            else
                addColor(0.5);
            return gradient;
            function addColor(pos) {
                var k = nsource * pos,
                    kl = _floor(k),
                    kr = _ceil(k);
                gradient.push(colors[kl].blend(colors[kr], k - kl).toHex())
            }
        }
        _extend(DX.viz.core, {
            registerPalette: registerPalette,
            getPalette: getPalette,
            Palette: Palette,
            GradientPalette: GradientPalette,
            currentPalette: currentPalette
        });
        DX.viz.core._DEBUG_palettes = palettes
    })(DevExpress, jQuery);
    /*! Module viz-core, file utils.js */
    (function(DX, $, undefined) {
        var _ceil = Math.ceil,
            _min = Math.min,
            _round = Math.round;
        function selectByKeys(object, keys) {
            return $.map(keys, function(key) {
                    return object[key] ? object[key] : null
                })
        }
        function decreaseFields(object, keys, eachDecrease, decrease) {
            var dec = decrease;
            $.each(keys, function(_, key) {
                if (object[key]) {
                    object[key] -= eachDecrease;
                    dec -= eachDecrease
                }
            });
            return dec
        }
        DX.viz.core.utils = {
            decreaseGaps: function(object, keys, decrease) {
                var arrayGaps;
                do {
                    arrayGaps = selectByKeys(object, keys);
                    arrayGaps.push(_ceil(decrease / arrayGaps.length));
                    decrease = decreaseFields(object, keys, _min.apply(null, arrayGaps), decrease)
                } while (decrease > 0 && arrayGaps.length > 1);
                return decrease
            },
            parseScalar: function(value, defaultValue) {
                return value !== undefined ? value : defaultValue
            },
            enumParser: function(values) {
                var stored = {},
                    i,
                    ii;
                for (i = 0, ii = values.length; i < ii; ++i)
                    stored[String(values[i]).toLowerCase()] = 1;
                return function(value, defaultValue) {
                        var _value = String(value).toLowerCase();
                        return stored[_value] ? _value : defaultValue
                    }
            },
            patchFontOptions: function(options) {
                var fontOptions = {};
                $.each(options || {}, function(key, value) {
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
                angle = DX.utils.isDefined(angle) ? angle + startAngle - shiftAngle : 0;
                cossin = DX.utils.getCosAndSin(angle);
                return {
                        x: _round(centerCoords.x + radius * cossin.cos),
                        y: _round(centerCoords.y + radius * cossin.sin)
                    }
            },
            convertXYToPolar: function(centerCoords, x, y) {
                var radius = DX.utils.getDistance(centerCoords.x, centerCoords.y, x, y),
                    angle = Math.atan2(y - centerCoords.y, x - centerCoords.x);
                return {
                        phi: _round(DX.utils.normalizeAngle(angle * 180 / Math.PI)),
                        r: _round(radius)
                    }
            }
        }
    })(DevExpress, jQuery);
    /*! Module viz-core, file baseThemeManager.js */
    (function(DX, $, undefined) {
        var _isString = DX.utils.isString,
            _parseScalar = DX.viz.core.utils.parseScalar,
            _findTheme = DX.viz.core.findTheme,
            _addCacheItem = DX.viz.core.addCacheItem,
            _removeCacheItem = DX.viz.core.removeCacheItem,
            _extend = $.extend,
            _each = $.each;
        function getThemePart(theme, path) {
            var _theme = theme;
            path && _each(path.split('.'), function(_, pathItem) {
                return _theme = _theme[pathItem]
            });
            return _theme
        }
        DX.viz.core.BaseThemeManager = DX.Class.inherit({
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
        var viz = DX.viz,
            core = viz.core,
            Class = DX.Class,
            isDefined = DX.utils.isDefined;
        var parseUtils = Class.inherit({
                correctValueType: function(type) {
                    return type === 'numeric' || type === 'datetime' || type === 'string' ? type : ''
                },
                _parsers: {
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
                },
                getParser: function(valueType) {
                    return this._parsers[this.correctValueType(valueType)] || $.noop
                }
            });
        core.ParseUtils = parseUtils
    })(jQuery, DevExpress);
    /*! Module viz-core, file loadIndicator.js */
    (function(DX, $, undefined) {
        var _patchFontOptions = DX.viz.core.utils.patchFontOptions;
        var STATE_HIDE = 0,
            STATE_SHOW = 1,
            STATE_ENDLOADING = 2,
            LOADING_INDICATOR_READY = "loadingIndicatorReady";
        function LoadIndicator(parameters) {
            var that = this,
                renderer = parameters.renderer,
                group = that._group = renderer.g().attr({"class": "dx-l-i"});
            that._renderer = renderer;
            that._rect = renderer.rect().attr({opacity: 0}).append(group);
            that._text = renderer.text().attr({align: "center"}).append(group);
            that._createStates(parameters.eventTrigger)
        }
        LoadIndicator.prototype = {
            constructor: LoadIndicator,
            _createStates: function(eventTrigger) {
                var that = this;
                that._states = {};
                that._states[STATE_HIDE] = {
                    o: 0,
                    c: function() {
                        that._group.remove();
                        that._renderer.root.attr({"pointer-events": null});
                        eventTrigger(LOADING_INDICATOR_READY)
                    }
                };
                that._states[STATE_SHOW] = {
                    o: 0.85,
                    c: function() {
                        eventTrigger(LOADING_INDICATOR_READY)
                    }
                };
                that._states[STATE_ENDLOADING] = {
                    o: 1,
                    c: function() {
                        var onEndLoading = that._onEndLoading;
                        that._onEndLoading = null;
                        that._noHiding = true;
                        onEndLoading && onEndLoading();
                        that._noHiding = false;
                        that._onCompleteAction && that[that._onCompleteAction]()
                    }
                }
            },
            append: function() {
                this._visible && this._group.append(this._renderer.root)
            },
            applyCanvas: function(canvas) {
                var width = canvas.width,
                    height = canvas.height;
                this._rect.attr({
                    width: width,
                    height: height
                });
                this._text.attr({
                    x: width / 2,
                    y: height / 2
                })
            },
            applyOptions: function(options) {
                this._rect.attr({fill: options.backgroundColor});
                this._text.css(_patchFontOptions(options.font)).attr({text: options.text})
            },
            dispose: function() {
                var that = this;
                that._group.remove();
                that._group = that._renderer = that._rect = that._text = that._states = null
            },
            forceShow: function() {
                this._rect.stopAnimation(false).attr({opacity: 1})
            },
            _transit: function(stateId) {
                var state = this._states[stateId];
                this._rect.stopAnimation(true).animate({opacity: state.o}, {
                    complete: state.c,
                    easing: "linear",
                    duration: 150,
                    unstoppable: true
                })
            },
            show: function() {
                var that = this;
                that._isHiding = false;
                if (that._onEndLoading)
                    that._onCompleteAction = "show";
                else {
                    that._onCompleteAction = null;
                    if (!that._visible) {
                        that._visible = true;
                        that._renderer.root.attr({"pointer-events": "none"});
                        that.append()
                    }
                    that._transit(STATE_SHOW)
                }
            },
            endLoading: function(complete) {
                var that = this;
                if (!that._onEndLoading)
                    if (that._visible) {
                        that._onEndLoading = complete;
                        that._transit(STATE_ENDLOADING)
                    }
                    else
                        complete()
            },
            hide: function() {
                var that = this;
                that._isHiding = false;
                if (that._onEndLoading)
                    that._onCompleteAction = "hide";
                else {
                    that._onCompleteAction = null;
                    if (that._visible) {
                        that._visible = false;
                        that._transit(STATE_HIDE)
                    }
                }
            },
            scheduleHiding: function() {
                if (!this._noHiding) {
                    this._isHiding = true;
                    this._onCompleteAction = null
                }
            },
            fulfillHiding: function() {
                var isHiding = this._isHiding;
                isHiding && this.hide();
                return isHiding
            }
        };
        DX.viz.core.LoadIndicator = LoadIndicator
    })(DevExpress, jQuery);
    /*! Module viz-core, file tooltip.js */
    (function(DX, $, doc, undefined) {
        var HALF_ARROW_WIDTH = 10,
            FORMAT_PRECISION = {
                argument: ["argumentFormat", "argumentPrecision"],
                percent: ["percent", "percentPrecision"],
                value: ["format", "precision"]
            },
            formatHelper = DX.formatHelper,
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
            that._renderer = renderer = new DX.viz.renderers.Renderer({});
            root = renderer.root;
            root.attr({"pointer-events": "none"});
            renderer.draw(that._wrapper.get(0));
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
                    borderOptions = options.border || {};
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
                that._textFontStyles = DX.viz.core.utils.patchFontOptions(options.font);
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
                        state.text = DX.utils.isDefined(customize.text) ? String(customize.text) : "";
                    if ("html" in customize)
                        state.html = DX.utils.isDefined(customize.html) ? String(customize.html) : ""
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
                    blur = ss.blur * 2 + 1;
                if (!that._prepare(formatObject, state))
                    return false;
                that._state = state;
                state.tc = {};
                that._wrapper.appendTo($("body"));
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
                    bBox = textHtml.get(0).getBoundingClientRect();
                    bBox = {
                        x: 0,
                        y: 0,
                        width: mathCeil(bBox.right - bBox.left),
                        height: mathCeil(bBox.bottom - bBox.top)
                    };
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
                if (that._calculatePosition(x, y, offset)) {
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
                that._wrapper.css({
                    left: coords.x,
                    top: coords.y
                })
            },
            formatValue: function(value, specialFormat) {
                var formatObj = FORMAT_PRECISION[specialFormat || "value"],
                    format = formatObj[0] in this._options ? this._options[formatObj[0]] : specialFormat;
                return formatHelper.format(value, format, this._options[formatObj[1]] || 0)
            },
            getLocation: function() {
                return (this._options.location + "").toLowerCase()
            },
            isEnabled: function() {
                return !!this._options.enabled
            },
            isShared: function() {
                return !!this._options.shared
            },
            _calculatePosition: function(x, y, offset) {
                var that = this,
                    canvas = that._getCanvas(),
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
                    body = doc.body,
                    win = window;
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
        DX.viz.core.Tooltip = Tooltip
    })(DevExpress, jQuery, document);
    /*! Module viz-core, file legend.js */
    (function(DX, $, undefined) {
        var core = DX.viz.core,
            coreUtils = core.utils,
            WrapperLayoutElement = core.WrapperLayoutElement,
            _Number = Number,
            _String = String,
            _math = Math,
            _round = _math.round,
            _max = _math.max,
            _min = _math.min,
            _ceil = _math.ceil,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _isFunction = utils.isFunction,
            _enumParser = coreUtils.enumParser,
            _extend = $.extend,
            _each = $.each,
            _map = $.map,
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
            DX.utils.debug.assertParam(options.visible, "Visibility was not passed");
            DX.utils.debug.assertParam(options.markerSize, "markerSize was not passed");
            DX.utils.debug.assertParam(options.font.color, "fontColor was not passed");
            DX.utils.debug.assertParam(options.font.family, "fontFamily was not passed");
            DX.utils.debug.assertParam(options.font.size, "fontSize was not passed");
            DX.utils.debug.assertParam(options.paddingLeftRight, "paddingLeftRight was not passed");
            DX.utils.debug.assertParam(options.paddingTopBottom, "paddingTopBottom was not passed");
            DX.utils.debug.assertParam(options.columnItemSpacing, "columnItemSpacing was not passed");
            DX.utils.debug.assertParam(options.rowItemSpacing, "rowItemSpacing was not passed");
            parseMargins(options);
            options.horizontalAlignment = parseHorizontalAlignment(options.horizontalAlignment, RIGHT);
            options.verticalAlignment = parseVerticalAlignment(options.verticalAlignment, options.horizontalAlignment === CENTER ? BOTTOM : TOP);
            options.orientation = parseOrientation(options.orientation, options.horizontalAlignment === CENTER ? HORIZONTAL : VERTICAL);
            options.itemTextPosition = parseItemTextPosition(options.itemTextPosition, options.orientation === HORIZONTAL ? BOTTOM : RIGHT);
            options.position = parsePosition(options.position, OUTSIDE);
            options.itemsAlignment = parseItemsAlignment(options.itemsAlignment, null);
            options.hoverMode = _String(options.hoverMode || "").toLowerCase();
            options.customizeText = _isFunction(options.customizeText) ? options.customizeText : function() {
                return this[textField]
            };
            options.customizeHint = _isFunction(options.customizeHint) ? options.customizeHint : $.noop;
            return options
        }
        function createSquareMarker(renderer, size) {
            return renderer.rect(0, 0, size, size)
        }
        function createCircleMarker(renderer, size) {
            return renderer.circle(size / 2, size / 2, size / 2)
        }
        function isCircle(type) {
            return _String(type).toLowerCase() === "circle"
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
            $.each(lines, function(i, line) {
                var firstItem = line[0];
                $.each(line, function(_, item) {
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
            $.each(line, function(_, item) {
                var offset = item.offset || layoutOptions.spacing;
                lineLength += item[layoutOptions.measure] + offset
            });
            return lineLength
        }
        function getMaxLineLength(lines, layoutOptions) {
            var maxLineLength = 0;
            $.each(lines, function(_, line) {
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
                    return CENTER + " " + TOP;
                case TOP:
                    return CENTER + " " + BOTTOM;
                case LEFT:
                    return RIGHT + " " + CENTER;
                case RIGHT:
                    return LEFT + " " + CENTER
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
            $.each(line, function(_, item) {
                if (!item)
                    return;
                maxLineSize = _max(maxLineSize, item[mesuare])
            });
            $.each(line, function(_, item) {
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
        var _Legend = DX.viz.core.Legend = function(settings) {
                var that = this;
                that._renderer = settings.renderer;
                that._legendGroup = settings.group;
                that._backgroundClass = settings.backgroundClass;
                that._itemGroupClass = settings.itemGroupClass;
                that._textField = settings.textField;
                that._getCustomizeObject = settings.getFormatObject;
                that._patterns = []
            };
        _Legend.prototype = {
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
            setSize: function(size) {
                this._size = {
                    width: size.width,
                    height: size.height
                };
                return this
            },
            draw: function(size) {
                var that = this,
                    options = that._options,
                    renderer = that._renderer,
                    items = that._data;
                size && that.setSize(size);
                that.erase();
                if (!(options && options.visible && items && items.length))
                    return that;
                that._insideLegendGroup = renderer.g().append(that._legendGroup);
                that._createBackground();
                that._createItems(that._getItemData());
                that._locateElements(options);
                that._finalUpdate(options);
                return that
            },
            _createItems: function(items) {
                var that = this,
                    options = that._options,
                    initMarkerSize = options.markerSize,
                    renderer = that._renderer,
                    markersOptions = [],
                    maxMarkerSize = 0,
                    i = 0,
                    bbox,
                    maxBboxWidth = 0,
                    maxBboxHeight = 0,
                    createMarker = getMarkerCreator(options.markerType);
                _each(items, function(_i, item) {
                    maxMarkerSize = _max(maxMarkerSize, _Number(item.size > 0 ? item.size : initMarkerSize))
                });
                that._markersId = {};
                for (; i < that._patterns.length; i++)
                    that._patterns[i].dispose();
                that._patterns = [];
                that._items = _map(items, function(dataItem, i) {
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
                    maxBboxWidth = _max(maxBboxWidth, bbox.width);
                    maxBboxHeight = _max(maxBboxHeight, bbox.height);
                    markersOptions.push({
                        size: markerSize,
                        marker: marker
                    });
                    that._createHint(dataItem, label);
                    return {
                            label: label,
                            labelBBox: labelBBox,
                            group: group,
                            bbox: bbox,
                            marker: marker,
                            markerSize: markerSize,
                            tracker: {id: dataItem.id},
                            states: states,
                            itemTextPosition: options.itemTextPosition,
                            markerOffset: 0,
                            bboxs: []
                        }
                });
                if (options.equalRowHeight)
                    $.each(that._items, function(_, item) {
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
                return this._renderer.text(text, 0, 0).css(coreUtils.patchFontOptions(fontStyle)).attr({align: align}).append(group)
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
                $.each(this._items, function(i, item) {
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
                $.each(lines, function(i, line) {
                    var firstItem = line[0],
                        ortOffset = firstItem.ortOffset || layoutOptions.ortSpacing;
                    position[layoutOptions.direction] = getInitPositionForDirection(line, layoutOptions, maxLineLength);
                    $.each(line, function(_, item) {
                        var offset = item.offset || layoutOptions.spacing,
                            wrap = new WrapperLayoutElement(item.element, item.bbox),
                            itemBBox = {
                                x: position.x,
                                y: position.y,
                                width: item.width,
                                height: item.height
                            },
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
                $.each(this._items, function(_, item) {
                    var itemBBox = calculateBboxLabelAndMarker(item.bboxs[0], item.bboxs[1]),
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
                    border = options.border.visible,
                    orientation = options.orientation,
                    layoutOptions = {
                        itemsAlignment: options.itemsAlignment,
                        orientation: options.orientation
                    },
                    width = that._size.width - (border ? 2 * options.paddingLeftRight : 0),
                    height = that._size.height - (border ? 2 * options.paddingTopBottom : 0);
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
            changeSize: function() {
                this.fit.apply(this, arguments)
            },
            fit: function(sizeForDecrease) {
                var that = this,
                    beforeFit = that.getLayoutOptions(),
                    afterFit;
                function fitLegendToDirection(direction) {
                    var size = $.extend({}, that._size);
                    size[direction] = beforeFit[direction] - sizeForDecrease[direction];
                    that.draw(size);
                    afterFit = that.getLayoutOptions();
                    if (that._insideLegendGroup)
                        if (beforeFit[direction] - sizeForDecrease[direction] < afterFit[direction]) {
                            that._options._incidentOccured("W2104");
                            that.erase()
                        }
                }
                if (sizeForDecrease.width > 0)
                    fitLegendToDirection(WIDTH);
                if (sizeForDecrease.height > 0)
                    fitLegendToDirection(HEIGHT);
                return this
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
                    if (options.orientation === HORIZONTAL)
                        boundingRect.cutLayoutSide = options.verticalAlignment;
                    else
                        boundingRect.cutLayoutSide = options.horizontalAlignment === CENTER ? options.verticalAlignment : options.horizontalAlignment;
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
        };
        var __getMarkerCreator = getMarkerCreator;
        DX.viz.core._DEBUG_stubMarkerCreator = function(callback) {
            getMarkerCreator = function() {
                return callback
            }
        };
        DX.viz.core._DEBUG_restoreMarkerCreator = function() {
            getMarkerCreator = __getMarkerCreator
        }
    })(DevExpress, jQuery);
    /*! Module viz-core, file range.js */
    (function($, DX, undefined) {
        var core = DX.viz.core,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _isDate = utils.isDate,
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
        DX.viz.core.__NUMBER_EQUALITY_CORRECTION = NUMBER_EQUALITY_CORRECTION;
        DX.viz.core.__DATETIME_EQUALITY_CORRECTION = DATETIME_EQUALITY_CORRECTION;
        _Range = core.Range = function(range) {
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
                if (utils.isDefined(otherRange.stick))
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
                    isCategories = that.axisType === "discrete";
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
                if (_isDate(that[maxSelector]) || _isDate(that[minSelector]))
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
    /*! Module viz-core, file svgRenderer.js */
    (function($, DX, doc, undefined) {
        var rendererNS = DX.viz.renderers = {},
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
        var DEFAULTS = {
                scaleX: 1,
                scaleY: 1
            };
        var getNextDefsSvgId = function() {
                var numDefsSvgElements = 1;
                return function() {
                        return "DevExpress_" + numDefsSvgElements++
                    }
            }();
        function isObjectArgument(value) {
            return typeof value !== "string"
        }
        function isDefined(value) {
            return value !== null && value !== undefined
        }
        function isArray(value) {
            return Object.prototype.toString.call(value) === "[object Array]"
        }
        function isObject(value) {
            return Object.prototype.toString.call(value) === "[object Object]"
        }
        function createElement(tagName) {
            return doc.createElementNS("http://www.w3.org/2000/svg", tagName)
        }
        function getPatternUrl(id, pathModified) {
            return id !== null ? "url(" + (pathModified ? window.location.href : "") + "#" + id + ")" : ""
        }
        function extend(a, b, skipNonDefined) {
            var value;
            for (var key in b) {
                value = b[key];
                if (!skipNonDefined || skipNonDefined && value !== undefined && value !== null)
                    a[key] = value
            }
            return a
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
        function getPreserveAspectRatio(location) {
            return {
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
                }[(location || "").toLowerCase()] || NONE
        }
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
            var i = 0,
                ii = (points || []).length,
                list = [];
            if (isArray(points[0]))
                for (; i < ii; )
                    buildSimpleSegment(points[i++], close, list);
            else
                buildSimpleSegment(points, close, list);
            return list
        }
        function buildSimpleLineSegment(points, close, list) {
            var i = 0,
                ii = (points || []).length;
            if (ii)
                if (isObject(points[0]))
                    for (; i < ii; )
                        list.push([!i ? "M" : "L", points[i].x, points[i++].y]);
                else
                    for (; i < ii; )
                        list.push([!i ? "M" : "L", points[i++], points[i++]]);
            else
                list.push(["M", 0, 0]);
            close && list.push(["Z"]);
            return list
        }
        function buildSimpleCurveSegment(points, close, list) {
            var i = 2,
                ii = (points || []).length;
            if (ii)
                if (isObject(points[0])) {
                    i = 1;
                    list.push(["M", points[0].x, points[0].y]);
                    for (; i < ii; )
                        list.push(["C", points[i].x, points[i++].y, points[i].x, points[i++].y, points[i].x, points[i++].y])
                }
                else {
                    list.push(["M", points[0], points[1]]);
                    for (; i < ii; )
                        list.push(["C", points[i++], points[i++], points[i++], points[i++], points[i++], points[i++]])
                }
            else
                list.push(["M", 0, 0]);
            close && list.push(["Z"]);
            return list
        }
        function combinePathParam(segments) {
            var d = [],
                i = 0,
                length = segments.length;
            for (; i < length; i++)
                d.push(segments[i].join(" "));
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
        function baseCss(styles) {
            var elemStyles = this._styles,
                str = "",
                key,
                value;
            extend(elemStyles, styles || {}, true);
            for (key in elemStyles) {
                value = elemStyles[key];
                if (value === "")
                    continue;
                if (typeof value === "number" && !pxAddingExceptions[key])
                    value += "px";
                str += key + ":" + value + ";"
            }
            str && this.element.setAttribute("style", str);
            return this
        }
        function baseAttr(attrs) {
            attrs = attrs || {};
            var that = this,
                settings = that._settings,
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
                value = value === null ? "" : value.toLowerCase();
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
                    return baseAttr.call(that, attrs, inh)
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
                            attrs.d = buildArcPath.apply(this, rendererNS._normalizeArcParams(x, y, innerRadius, outerRadius, startAngle, endAngle))
                        }
                    }
                    return baseAttr.call(this, attrs, inh)
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
                    return baseAttr.call(that, attrs, inh)
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
                return baseAttr.call(that, attrs);
            attrs = extend({}, attrs);
            settings = that._settings;
            wasStroked = isDefined(settings[KEY_STROKE]) && isDefined(settings[KEY_STROKE_WIDTH]);
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
            isStroked = isDefined(settings[KEY_STROKE]) && isDefined(settings[KEY_STROKE_WIDTH]);
            baseAttr.call(that, attrs);
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
            baseCss.call(this, styles);
            if (KEY_FONT_SIZE in styles)
                locateTextNodes(this);
            return this
        }
        function orderHtmlTree(strCount, node, textArray) {
            var nodeParams = node.params = node.params || {style: {}},
                nodeStyle = nodeParams.style,
                parentStyle = node.parentNode && node.parentNode.params && node.parentNode.params.style || {},
                nativeElementStyle = node.style,
                childCount = node.childNodes.length,
                count = 0;
            if (node.nodeName !== '#text')
                extend(nodeStyle, parentStyle);
            switch (node.tagName) {
                case'B':
                case'STRONG':
                    nodeStyle[KEY_FONT_WEIGHT] = 'bold';
                    break;
                case'I':
                case'EM':
                    nodeStyle[KEY_FONT_STYLE] = 'italic';
                    break;
                case'U':
                    nodeStyle[KEY_TEXT_DECORATION] = 'underline';
                    break;
                case'BR':
                    strCount++;
                    break
            }
            if (nativeElementStyle) {
                if (nativeElementStyle.fontSize)
                    nodeStyle[KEY_FONT_SIZE] = (_parseInt(nativeElementStyle.fontSize, 10) || nodeStyle[KEY_FONT_SIZE]) + 'px';
                nodeStyle.fill = nativeElementStyle.color || nodeStyle.fill;
                nodeStyle[KEY_FONT_STYLE] = nativeElementStyle.fontStyle || nodeStyle[KEY_FONT_STYLE];
                nodeStyle[KEY_FONT_WEIGHT] = nativeElementStyle.fontWeight || nodeStyle[KEY_FONT_WEIGHT];
                nodeStyle[KEY_TEXT_DECORATION] = nativeElementStyle.textDecoration || nodeStyle[KEY_TEXT_DECORATION]
            }
            while (count !== childCount)
                strCount = orderHtmlTree(strCount, node.childNodes[count++], textArray);
            if (node.wholeText !== undefined) {
                extend(nodeStyle, parentStyle);
                textArray.push({
                    value: node.wholeText,
                    style: nodeStyle,
                    line: strCount,
                    height: _parseInt(nodeStyle[KEY_FONT_SIZE], 10) || 0
                })
            }
            return strCount
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
            orderHtmlTree(0, div, items);
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
                item.style && baseCss.call({
                    element: item[fieldName],
                    _styles: {}
                }, item.style);
                element.appendChild(item[fieldName])
            }
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
                lineHeight = wrapper._styles[KEY_FONT_SIZE] || 12,
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
        function baseAnimate(params, options, complete) {
            options = options || {};
            var that = this,
                key,
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
            return baseAnimate.call(that, params, options, complete)
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
            return baseAnimate.call(that, params, options, complete)
        }
        rendererNS.__mockPrivateFunctions = function(fs) {
            fs = fs || {};
            function mockFunction(mock, orig) {
                if (!mock)
                    return orig;
                var originalFunction = orig;
                orig = mock;
                orig._originalFunction = originalFunction;
                return orig
            }
            createElement = mockFunction(fs.createElement, createElement);
            baseAttr = mockFunction(fs.baseAttr, baseAttr);
            baseAnimate = mockFunction(fs.baseAnimate, baseAnimate);
            getNextDefsSvgId = mockFunction(fs.getNextDefsSvgId, getNextDefsSvgId);
            compensateSegments = mockFunction(fs.compensateSegments, compensateSegments);
            buildPathSegments = mockFunction(fs.buildPathSegments, buildPathSegments);
            buildArcPath = mockFunction(fs.buildArcPath, buildArcPath);
            pathAttr = createPathAttr(baseAttr);
            arcAttr = createArcAttr(baseAttr, buildArcPath);
            rectAttr = createRectAttr(baseAttr);
            return {
                    createElement: createElement,
                    baseAttr: baseAttr,
                    baseAnimate: baseAnimate,
                    getNextDefsSvgId: getNextDefsSvgId,
                    compensateSegments: compensateSegments,
                    buildPathSegments: buildPathSegments,
                    buildArcPath: buildArcPath
                }
        };
        rendererNS.__restoreMockPrivateFunctions = function() {
            function restoreFunction(func) {
                return func._originalFunction || func
            }
            createElement = restoreFunction(createElement);
            baseAttr = restoreFunction(baseAttr);
            baseAnimate = restoreFunction(baseAnimate);
            getNextDefsSvgId = restoreFunction(getNextDefsSvgId);
            compensateSegments = restoreFunction(compensateSegments);
            buildPathSegments = restoreFunction(buildPathSegments);
            buildArcPath = restoreFunction(buildArcPath);
            pathAttr = createPathAttr(baseAttr);
            arcAttr = createArcAttr(baseAttr, buildArcPath);
            rectAttr = createRectAttr(baseAttr)
        };
        function SvgElement() {
            this.ctor.apply(this, arguments)
        }
        rendererNS.SvgElement = SvgElement;
        SvgElement.prototype = {
            ctor: function(renderer, tagName, type) {
                var that = this;
                that.renderer = renderer;
                that.element = createElement(tagName);
                that._settings = {};
                that._styles = {};
                if (tagName === "path")
                    that.type = type || "line";
                if (tagName === "text") {
                    that.attr = textAttr;
                    that.css = textCss
                }
                else if (tagName === "path")
                    if (that.type === "arc") {
                        that.attr = arcAttr;
                        that.animate = arcAnimate
                    }
                    else {
                        that.attr = pathAttr;
                        that.animate = pathAnimate
                    }
                else if (tagName === "rect") {
                    that.attr = rectAttr;
                    that.sharp = function() {
                        return this
                    }
                }
                that._$element = $(that.element)
            },
            dispose: function() {
                this._$element.remove();
                return this
            },
            append: function(parent) {
                parent = parent || this.renderer.root;
                (parent.element || parent).appendChild(this.element);
                return this
            },
            remove: function() {
                var elem = this.element,
                    parent = elem.parentNode;
                parent && parent.removeChild(elem);
                return this
            },
            clear: function() {
                this._$element.empty();
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
            css: baseCss,
            attr: baseAttr,
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
                if (!("rotateX" in tr))
                    rotateX = tr.x;
                else
                    rotateX = tr.rotateX;
                if (!("rotateY" in tr))
                    rotateY = tr.y;
                else
                    rotateY = tr.rotateY;
                transformations.push("translate(" + ((tr.translateX || 0) + correctionX) + "," + ((tr.translateY || 0) + correctionY) + ")");
                if (tr.rotate)
                    transformations.push("rotate(" + tr.rotate + "," + (rotateX || 0) + "," + (rotateY || 0) + ")");
                scaleXDefined = isDefined(tr.scaleX);
                scaleYDefined = isDefined(tr.scaleY);
                if (scaleXDefined || scaleYDefined)
                    transformations.push("scale(" + (scaleXDefined ? tr.scaleX : 1) + "," + (scaleYDefined ? tr.scaleY : 1) + ")");
                if (transformations.length)
                    this.element.setAttribute("transform", transformations.join(" "))
            },
            move: function(x, y, animate, animOptions) {
                var obj = {};
                isDefined(x) && (obj.translateX = x);
                isDefined(y) && (obj.translateY = y);
                if (!animate)
                    this.attr(obj);
                else
                    this.animate(obj, animOptions);
                return this
            },
            rotate: function(angle, x, y, animate, animOptions) {
                var obj = {rotate: angle || 0};
                isDefined(x) && (obj.rotateX = x);
                isDefined(y) && (obj.rotateY = y);
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
                return this._$element.offset()
            },
            animate: baseAnimate,
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
            on: function() {
                $.fn.on.apply(this._$element, arguments);
                return this
            },
            off: function() {
                $.fn.off.apply(this._$element, arguments);
                return this
            },
            trigger: function() {
                $.fn.trigger.apply(this._$element, arguments);
                return this
            },
            data: function() {
                $.fn.data.apply(this._$element, arguments);
                return this
            }
        };
        function SvgRenderer(options) {
            var that = this;
            that.root = that._createElement("svg", {
                xmlns: "http://www.w3.org/2000/svg",
                "xmlns:xlink": "http://www.w3.org/1999/xlink",
                version: "1.1",
                fill: NONE,
                stroke: NONE,
                "stroke-width": 0,
                "class": options.cssClass
            }).css({
                "line-height": "normal",
                "-ms-user-select": NONE,
                "-moz-user-select": NONE,
                "-webkit-user-select": NONE,
                "-webkit-tap-highlight-color": "rgba(0, 0, 0, 0)",
                display: "block",
                overflow: "hidden"
            });
            that._defs = that._createElement("defs");
            that._animationController = new rendererNS.AnimationController(that.root.element);
            that._animation = {
                enabled: true,
                duration: 1000,
                easing: "easeOutCubic"
            }
        }
        rendererNS.SvgRenderer = SvgRenderer;
        SvgRenderer.prototype = {
            constructor: SvgRenderer,
            setOptions: function(options) {
                var that = this;
                that.pathModified = !!options.pathModified;
                that.rtl = !!options.rtl;
                that.encodeHtml = !!options.encodeHtml,
                that.updateAnimationOptions(options.animation || {});
                that.root.attr({direction: that.rtl ? "rtl" : "ltr"})
            },
            _createElement: function(tagName, attr, type) {
                var elem = new rendererNS.SvgElement(this, tagName, type);
                attr && elem.attr(attr);
                return elem
            },
            draw: function(container) {
                var that = this;
                if (!container || that.drawn)
                    return that;
                that.root.append(container);
                that._defs.append(that.root);
                that.drawn = true;
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
            clear: function() {
                var that = this;
                that.root.remove();
                that._defs.remove();
                that.drawn = null;
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
                return null
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
                return this._createElement("rect", {
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
                        preserveAspectRatio: getPreserveAspectRatio(location)
                    });
                image.element.setAttributeNS("http://www.w3.org/1999/xlink", "href", href || "");
                return image
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
                    direction = (hatching.direction || "").toLowerCase();
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
                path = that._createElement("path", {
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
                    baseAttr.call(that, filterAttrs);
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
        rendererNS._createArcAttr = createArcAttr;
        rendererNS._createPathAttr = createPathAttr;
        rendererNS._createRectAttr = createRectAttr
    })(jQuery, DevExpress, document);
    /*! Module viz-core, file vmlRenderer.js */
    (function($, DX, doc) {
        DX.viz.renderers = DX.viz.renderers || {};
        var rendererNS = DX.viz.renderers,
            math = Math,
            mathMin = math.min,
            mathMax = math.max,
            mathFloor = math.floor,
            mathSin = math.sin,
            mathCos = math.cos,
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
            rectAttr = rendererNS._createRectAttr(vmlAttr);
        function isDefined(value) {
            return value !== null && value !== undefined
        }
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
        function baseAttr(attrs, inh) {
            var element = this.element,
                settings = this._settings,
                fullSettings = this._fullSettings,
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
                    value = value === null ? this._parent && this._parent._fullSettings[key] || value : value;
                appliedAttr !== value && this.processAttr(element, key, value, params)
            }
            this._applyTransformation(params);
            this.css(params.style);
            for (var i = 0; i < this._children.length; i++) {
                elem = this._children[i];
                elem !== this._clipRect && elem.attr(extend(getInheritSettings(this._fullSettings), elem._settings), true);
                elem._applyStyleSheet()
            }
            !inh && this._applyStyleSheet();
            if (element)
                if (element.strokecolor && element.strokecolor.value !== "none" && element.strokeweight)
                    element.stroked = "t";
                else
                    element.stroked = "f";
            return this
        }
        function vmlAttr() {
            var elem = this.element,
                result = baseAttr.apply(this, arguments);
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
                        value = value.toLowerCase();
                        if (value === "solid" || value === "none")
                            value = "";
                        else
                            value = value.replace(/longdash/g, "8,3,").replace(/dash/g, "4,3,").replace(/dot/g, "1,3,").replace(/,$/, "");
                        element.stroke[attr] = value
                    }
                    return;
                case"d":
                    attr = "path";
                    value = (value + "").toLowerCase().replace("z", "x e").replace(/([.]\d+)/g, "");
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
        var elementMixin = {
                div: {
                    processAttr: processAttr,
                    attr: baseAttr,
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
                    attr: baseAttr,
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
                that.type = type;
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
            attr: vmlAttr,
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
            append: function(parent) {
                parent = parent || this.renderer.root;
                (parent.element || parent).appendChild(this.element);
                if (parent._children) {
                    this._parent = parent;
                    if (inArray(parent._children, this) === -1)
                        parent._children.push(this);
                    this.attr(extend(getInheritSettings(parent._fullSettings), this._settings), true)
                }
                this._applyStyleSheet();
                if (parent._clipRect && this !== parent._clipRect)
                    parent._clipRect.append(parent);
                return this
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
                var that = this,
                    parent = that._parent;
                if (parent)
                    parent._children.splice(inArray(parent._children, that), 1);
                that._parent = null;
                return baseElementPrototype.remove.call(that)
            },
            clear: function() {
                this._children = [];
                return baseElementPrototype.clear.call(this)
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
            attr: function() {
                var result = baseAttr.apply(this, arguments),
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
        var VmlRenderer = function(options) {
                var that = this;
                that.root = that._createElement("div", {
                    fill: "none",
                    stroke: "none",
                    "stroke-width": 0
                }).css({
                    position: "relative",
                    display: "inline-block",
                    overflow: "hidden"
                });
                that._clipRects = [];
                that._animation = {enabled: false};
                that._defs = {
                    clear: stubReturnedThis,
                    remove: stubReturnedThis,
                    append: stubReturnedThis,
                    dispose: stubReturnedThis
                };
                that.setOptions(options)
            };
        extend(VmlRenderer.prototype, rendererNS.SvgRenderer.prototype);
        extend(VmlRenderer.prototype, {
            constructor: VmlRenderer,
            setOptions: function() {
                rendererNS.SvgRenderer.prototype.setOptions.apply(this, arguments);
                this.root.css({direction: this.rtl ? "rtl" : "ltr"})
            },
            _createElement: function(tagName, attr, type) {
                tagName = svgToVmlConv[tagName] || tagName;
                var elem = new rendererNS.VmlElement(this, tagName, type);
                attr && elem.attr(attr);
                return elem
            },
            dispose: function() {
                this.root.dispose();
                return null
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
        var rendererNS = DX.viz.renderers,
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
                that._timerId = DX.requestAnimationFrame.call(null, function() {
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
                DX.cancelAnimationFrame(that._timerId);
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
            browser = DX.browser;
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
        DX.viz.core.series = DX.viz.core.series || {};
        DX.viz.core.series.helpers = DX.viz.core.series.helpers || {};
        DX.viz.core.series.helpers.consts = {
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
            pieLabelIndent: 30
        }
    })(DevExpress);
    /*! Module viz-core, file seriesFamily.js */
    (function($, DX, undefined) {
        var utils = DX.utils,
            _math = Math,
            _round = _math.round,
            _abs = _math.abs,
            _pow = _math.pow,
            _each = $.each;
        DX.viz.core.series.helpers.SeriesFamily = DX.Class.inherit(function() {
            var ctor = function(options) {
                    var debug = DX.utils.debug;
                    debug.assert(options.type, "type was not passed or empty");
                    var that = this,
                        stubFunction = $.noop;
                    that.type = options.type.toLowerCase();
                    that.pane = options.pane;
                    that.series = [];
                    that.updateOptions(options);
                    switch (that.type) {
                        case"bar":
                            that.adjustSeriesDimensions = adjustBarSeriesDimensions;
                            that.adjustSeriesValues = stubFunction;
                            that.updateSeriesValues = updateBarSeriesValues;
                            break;
                        case"rangebar":
                            that.adjustSeriesDimensions = adjustBarSeriesDimensions;
                            that.adjustSeriesValues = stubFunction;
                            that.updateSeriesValues = stubFunction;
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
                            that.adjustSeriesDimensions = stubFunction;
                            that.adjustSeriesValues = adjustStackedSeriesValues;
                            that.updateSeriesValues = stubFunction;
                            break;
                        case"stackedarea":
                        case"stackedsplinearea":
                        case"stackedline":
                        case"stackedspline":
                            that.adjustSeriesDimensions = stubFunction;
                            that.adjustSeriesValues = adjustStackedSeriesValues;
                            that.updateSeriesValues = stubFunction;
                            break;
                        case"candlestick":
                        case"stock":
                            that.adjustSeriesDimensions = adjustCandlestickSeriesDimensions;
                            that.adjustSeriesValues = stubFunction;
                            that.updateSeriesValues = stubFunction;
                            break;
                        case"bubble":
                            that.adjustSeriesDimensions = adjustBubbleSeriesDimensions;
                            that.adjustSeriesValues = stubFunction;
                            that.updateSeriesValues = stubFunction;
                            break;
                        default:
                            that.adjustSeriesDimensions = stubFunction;
                            that.adjustSeriesValues = stubFunction;
                            that.updateSeriesValues = stubFunction;
                            break
                    }
                };
            var updateOptions = function(options) {
                    this.equalBarWidth = options.equalBarWidth;
                    this.minBubbleSize = options.minBubbleSize;
                    this.maxBubbleSize = options.maxBubbleSize
                };
            var dispose = function() {
                    this.series = null;
                    this.translators = null
                };
            var add = function(series) {
                    var that = this,
                        singleSeries,
                        i;
                    if (!$.isArray(series))
                        series = [series];
                    for (i = 0; i < series.length; i++) {
                        singleSeries = series[i];
                        if (singleSeries.type.toLowerCase() === that.type)
                            that.series.push(singleSeries)
                    }
                };
            function correctPointCoordinates(points, width, offset) {
                _each(points, function(_, point) {
                    point.correctCoordinates({
                        width: width,
                        offset: offset
                    })
                })
            }
            function getStacksWithArgument(stackKeepers, argument) {
                var stacksWithArgument = [];
                _each(stackKeepers, function(stackName, seriesInStack) {
                    _each(seriesInStack, function(_, singleSeries) {
                        var points = singleSeries.getPointsByArg(argument),
                            pointsLength = points.length,
                            i;
                        for (i = 0; i < pointsLength; ++i)
                            if (points[i] && points[i].value) {
                                stacksWithArgument.push(stackName);
                                return false
                            }
                    })
                });
                return stacksWithArgument
            }
            function correctPointCoordinatesForStacks(stackKeepers, stacksWithArgument, argument, middleIndex, width, spacing) {
                _each(stackKeepers, function(stackName, seriesInStack) {
                    var stackIndex = $.inArray(stackName, stacksWithArgument),
                        offset;
                    if (stackIndex === -1)
                        return;
                    offset = (stackIndex - middleIndex + 0.5) * width - (middleIndex - stackIndex - 0.5) * spacing;
                    _each(seriesInStack, function(_, singleSeries) {
                        _each(singleSeries.getPointsByArg(argument) || [], function(_, point) {
                            if (point && point.value)
                                point.correctCoordinates({
                                    width: width,
                                    offset: offset
                                })
                        })
                    })
                })
            }
            var adjustBarSeriesDimensionsCore = function(series, interval, stackCount, equalBarWidth, seriesStackIndexCallback) {
                    var spacing,
                        width,
                        maxWidth,
                        middleIndex,
                        stackIndex,
                        i,
                        points,
                        seriesOffset,
                        stackName,
                        argumentsKeeper = {},
                        stackKeepers = {},
                        stacksWithArgument,
                        count;
                    if (equalBarWidth) {
                        width = equalBarWidth.width && equalBarWidth.width < 0 ? 0 : equalBarWidth.width;
                        spacing = equalBarWidth.spacing && equalBarWidth.spacing < 0 ? 0 : equalBarWidth.spacing;
                        if (!spacing)
                            if (stackCount > 1) {
                                spacing = width ? _round((interval * 0.7 - width * stackCount) / (stackCount - 1)) : _round(interval * 0.7 / stackCount * 0.2);
                                if (spacing < 1)
                                    spacing = 1
                            }
                            else
                                spacing = 0;
                        if (!width) {
                            width = _round((interval * 0.7 - spacing * (stackCount - 1)) / stackCount);
                            if (width < 2)
                                width = 2
                        }
                        if (width * stackCount + spacing * (stackCount - 1) > interval) {
                            spacing = _round((interval * 0.7 - width * stackCount) / (stackCount - 1));
                            if (spacing < 1) {
                                spacing = 1;
                                maxWidth = _round((interval * 0.7 - spacing * (stackCount - 1)) / stackCount)
                            }
                        }
                        middleIndex = stackCount / 2;
                        for (i = 0; i < series.length; i++) {
                            stackIndex = seriesStackIndexCallback(i);
                            points = series[i].getPoints();
                            seriesOffset = (stackIndex - middleIndex + 0.5) * (maxWidth || width) - (middleIndex - stackIndex - 0.5) * spacing;
                            correctPointCoordinates(points, width, seriesOffset)
                        }
                    }
                    else {
                        _each(series, function(i, singleSeries) {
                            stackName = singleSeries.getStackName && singleSeries.getStackName();
                            stackName = stackName || i.toString();
                            if (!stackKeepers[stackName])
                                stackKeepers[stackName] = [];
                            stackKeepers[stackName].push(singleSeries)
                        });
                        _each(series, function(i, singleSeries) {
                            _each(singleSeries.getPoints(), function(_, point) {
                                var argument = point.argument;
                                if (!argumentsKeeper.hasOwnProperty(argument))
                                    argumentsKeeper[argument.valueOf()] = 1
                            })
                        });
                        for (var argument in argumentsKeeper) {
                            if (!argumentsKeeper.hasOwnProperty(argument))
                                continue;
                            stacksWithArgument = getStacksWithArgument(stackKeepers, argument);
                            count = stacksWithArgument.length;
                            spacing = _round(interval * 0.7 / count * 0.2);
                            if (spacing < 1)
                                spacing = 1;
                            width = _round((interval * 0.7 - spacing * (count - 1)) / count);
                            if (width < 2)
                                width = 2;
                            middleIndex = count / 2;
                            correctPointCoordinatesForStacks(stackKeepers, stacksWithArgument, argument, middleIndex, width, spacing)
                        }
                    }
                };
            function checkMinBarSize(value, minShownValue) {
                return _abs(value) < minShownValue ? value >= 0 ? minShownValue : -minShownValue : value
            }
            function getValueType(value) {
                return value >= 0 ? "positive" : "negative"
            }
            function getVisibleSeries(that) {
                return $.map(that.series, function(s) {
                        return s.isVisible() ? s : null
                    })
            }
            function getAbsStackSumByArg(stackKeepers, stackName, argument) {
                var positiveStackValue = (stackKeepers.positive[stackName] || {})[argument] || 0,
                    negativeStackValue = -(stackKeepers.negative[stackName] || {})[argument] || 0;
                return positiveStackValue + negativeStackValue
            }
            var adjustBarSeriesDimensions = function(translators) {
                    var debug = DX.utils.debug;
                    debug.assert(translators, "translator was not passed or empty");
                    var that = this,
                        equalBarWidth = that.equalBarWidth,
                        series = getVisibleSeries(that);
                    adjustBarSeriesDimensionsCore(series, getInterval(that, translators), series.length, equalBarWidth, function(seriesIndex) {
                        return seriesIndex
                    })
                };
            var adjustStackedBarSeriesDimensions = function(translators) {
                    var debug = DX.utils.debug;
                    debug.assert(translators, "translators was not passed or empty");
                    var that = this,
                        series = getVisibleSeries(that),
                        stackIndexes = {},
                        stackCount = 0,
                        equalBarWidth = that.equalBarWidth;
                    _each(series, function() {
                        var stackName = this.getStackName();
                        if (!stackIndexes.hasOwnProperty(stackName))
                            stackIndexes[stackName] = stackCount++
                    });
                    adjustBarSeriesDimensionsCore(series, getInterval(that, translators), stackCount, equalBarWidth, function(seriesIndex) {
                        return stackIndexes[series[seriesIndex].getStackName()]
                    })
                };
            var adjustStackedSeriesValues = function() {
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
                        singleSeries._prevSeries = series[seriesIndex - 1],
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
                    setPercentStackedValues(series, stackKeepers, that.fullStacked, holesStack)
                };
            var setPercentStackedValues = function(series, stackKeepers, fullStacked, holeStack) {
                    _each(series, function(_, singleSeries) {
                        _each(singleSeries.getPoints(), function(_, point) {
                            var argument = point.argument.valueOf();
                            point.setPercentValue(getAbsStackSumByArg(stackKeepers, singleSeries.getStackName(), argument), fullStacked, holeStack.left[argument], holeStack.right[argument])
                        })
                    })
                };
            var updateStackedSeriesValues = function(translators) {
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
                                value = _abs(value) / getAbsStackSumByArg(stack, stackName, argument) || 0;
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
                };
            var updateFullStackedSeriesValues = function(series, stackKeepers) {
                    _each(series, function(_, singleSeries) {
                        var stackName = singleSeries.getStackName ? singleSeries.getStackName() : "default";
                        _each(singleSeries.getPoints(), function(index, point) {
                            var value = _abs(point.value),
                                argument = point.argument.valueOf(),
                                valueType = getValueType(value),
                                currentStack;
                            stackKeepers[valueType][stackName] = stackKeepers[valueType][stackName] || {};
                            currentStack = stackKeepers[valueType][stackName];
                            point.value = point.value / currentStack[argument] || 0;
                            if (utils.isNumber(point.minValue))
                                point.minValue = point.minValue / currentStack[argument] || 0
                        })
                    })
                };
            var updateBarSeriesValues = function(translators) {
                    _each(this.series, function(_, singleSeries) {
                        var minBarSize = singleSeries.getOptions().minBarSize,
                            minShownBusinessValue = minBarSize && translators.val.getMinBarSize(minBarSize);
                        if (minShownBusinessValue)
                            _each(singleSeries.getPoints(), function(index, point) {
                                if (point.hasValue())
                                    point.value = checkMinBarSize(point.initialValue, minShownBusinessValue)
                            })
                    })
                };
            var adjustCandlestickSeriesDimensions = function(translators) {
                    var debug = DX.utils.debug;
                    debug.assert(translators, "translator was not passed or empty");
                    var that = this,
                        series = getVisibleSeries(that);
                    adjustBarSeriesDimensionsCore(series, getInterval(that, translators), series.length, true, function(seriesIndex) {
                        return seriesIndex
                    })
                };
            var getInterval = function(that, translators) {
                    var argTranslator = translators.arg;
                    that.interval = argTranslator.getInterval();
                    return that.interval
                };
            var adjustBubbleSeriesDimensions = function(translators) {
                    var debug = DX.utils.debug;
                    debug.assert(translators, "translator was not passed or empty");
                    var that = this,
                        series = getVisibleSeries(that),
                        visibleAreaX = translators.arg.getCanvasVisibleArea(),
                        visibleAreaY = translators.val.getCanvasVisibleArea(),
                        min = Math.min(visibleAreaX.max - visibleAreaX.min, visibleAreaY.max - visibleAreaY.min),
                        minBubbleArea = _pow(that.minBubbleSize, 2),
                        maxBubbleArea = _pow(min * that.maxBubbleSize, 2),
                        equalBubbleSize = (min * that.maxBubbleSize + that.minBubbleSize) / 2,
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
                                pointSize = _round(Math.sqrt(bubbleArea))
                            }
                            point.correctCoordinates(pointSize)
                        })
                    })
                };
            return {
                    ctor: ctor,
                    dispose: dispose,
                    add: add,
                    updateOptions: updateOptions
                }
        }())
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            core = viz.core,
            seriesNS = core.series,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _each = $.each,
            _extend = $.extend,
            _isEmptyObject = $.isEmptyObject,
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
        function Series() {
            this.ctor.apply(this, arguments)
        }
        function applyPointStyle(point, styleName) {
            !point.isSelected() && point.applyStyle(styleName)
        }
        seriesNS.Series = Series;
        Series.prototype = {
            ctor: function(renderSettings, options) {
                var that = this;
                that.fullState = 0;
                that._extGroups = renderSettings;
                that._renderer = renderSettings.renderer;
                that._group = renderSettings.renderer.g().attr({"class": "dxc-series"});
                that.updateOptions(options)
            },
            update: function(data, options) {
                this.updateOptions(options);
                this.updateData(data)
            },
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
            setAdjustSeriesLabels: function(adjustSeriesLabels) {
                _each(this._points || [], function(_, point) {
                    point.setAdjustSeriesLabels(adjustSeriesLabels)
                })
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
                    options;
                if (that._checkData(data)) {
                    options = that._customizePoint(data) || that._getCreatingPointOptions();
                    if (point)
                        point.update(data, options);
                    else {
                        point = core.CoreFactory.createPoint(that, data, options);
                        pointsArray.push(point)
                    }
                    pointsByArgument[point.argument.valueOf()] = pointsByArgument[point.argument.valueOf()] || [];
                    pointsByArgument[point.argument.valueOf()].push(point);
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
                that.type = newType && newType.toString().toLowerCase();
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
                that._patterns = [];
                that.name = newOptions.name;
                that.pane = newOptions.pane;
                that.axis = newOptions.axis;
                that.tag = newOptions.tag;
                that._createStyles(newOptions);
                that._updateOptions(newOptions);
                that._visible = newOptions.visible;
                that.isUpdated = true
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
                        dataType: utils.isDate(min) ? "datetime" : "numeric"
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
                    tickManager = new viz.core.tickManager.TickManager(types, data, options);
                return {
                        ticks: tickManager.getTicks(true),
                        tickInterval: tickManager.getTickInterval()
                    }
            },
            _getRangeCorrector: _noop,
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
                    pointData,
                    rangeCorrector;
                that._rangeErrorBarCorrector = rangeCorrector = that._getRangeCorrector();
                that.pointsByArgument = {};
                that._resetRangeData();
                if (data && data.length)
                    that._canRenderCompleteHandle = true;
                that._beginUpdateData(data);
                _each(data, function(_, dataItem) {
                    pointData = that._getPointData(dataItem, options);
                    if (that._createPoint(pointData, points, lastPointIndex)) {
                        that._processRange(points[lastPointIndex], lastPointIndex > 0 ? points[lastPointIndex - 1] : null, rangeCorrector);
                        lastPointIndex++
                    }
                });
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
            _clearSeries: function() {
                var that = this;
                that._deleteGroup("_elementsGroup");
                that._deleteGroup("_bordersGroup");
                that._deleteTrackers();
                that._graphics = [];
                that._trackers = []
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
                that._createGroups(animationEnabled, undefined, firstDrawing);
                that._segments = [];
                that._drawedPoints = [];
                that._firstDrawing = points.length ? false : true;
                groupForPoint = {
                    markers: that._markersGroup,
                    labels: that._labelsGroup,
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
            _checkType: function(widgetType) {
                return !!seriesNS.mixins[widgetType][this.type]
            },
            _checkPolarBarType: function(widgetType, options) {
                return widgetType === "polar" && options.spiderWidget && this.type.indexOf("bar") !== -1
            },
            _resetType: function(seriesType, widgetType) {
                var that = this;
                if (seriesType)
                    _each(seriesNS.mixins[widgetType][seriesType], function(methodName) {
                        delete that[methodName]
                    })
            },
            _setType: function(seriesType, widgetType) {
                var that = this;
                _each(seriesNS.mixins[widgetType][seriesType], function(methodName, method) {
                    that[methodName] = method
                })
            },
            setSelectedState: function(state, mode, legendCallback) {
                var that = this;
                that.lastSelectionMode = (mode || that._options.selectionMode).toLowerCase();
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
                        that._changeStyle(legendCallback, "resetItem")
                }
            },
            setHoverState: function(state, mode, legendCallback) {
                var that = this;
                that.lastHoverMode = (mode || that._options.hoverMode).toLowerCase();
                if (state && !that.isHovered()) {
                    that.fullState = that.fullState | HOVER_STATE;
                    !that.isSelected() && that._changeStyle(legendCallback, APPLY_HOVER)
                }
                else if (!state && that.isHovered()) {
                    that._nearestPoint = null;
                    that.fullState = that.fullState & ~HOVER_STATE;
                    !that.isSelected() && that._changeStyle(legendCallback, "resetItem")
                }
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
                    pointOptions = that._parsePointOptions(that._preparePointOptions(customOptions), customLabelOptions || options.label, true);
                    pointOptions.styles.useLabelCustomOptions = useLabelCustomOptions;
                    pointOptions.styles.usePointCustomOptions = usePointCustomOptions
                }
                return pointOptions
            },
            _getLabelOptions: function(labelOptions, defaultColor) {
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
                labelFont.color = opt.backgroundColor === "none" && labelFont.color.toLowerCase() === "#ffffff" && opt.position !== "inside" ? defaultColor : labelFont.color;
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
            _updatePointsVisibility: $.noop,
            hideLabels: function() {
                _each(this._points, function(_, point) {
                    point._label.hide()
                })
            },
            _parsePointOptions: function(pointOptions, labelOptions, isCustomPointOptions) {
                var that = this,
                    options = that._options,
                    styles = that._createPointStyles(pointOptions, isCustomPointOptions),
                    parsedOptions = _extend(true, {}, pointOptions, {
                        type: options.type,
                        tag: that.tag,
                        rotated: options.rotated,
                        styles: styles,
                        widgetType: options.widgetType,
                        visibilityChanged: options.visibilityChanged
                    });
                parsedOptions.label = that._getLabelOptions(labelOptions, styles.normal.fill);
                parsedOptions.errorBars = options.valueErrorBar;
                return parsedOptions
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
                    originalPoints = $.map(originalPoints, function(p) {
                        var pos = argTranslator.translate(p.argument),
                            result;
                        if (pos >= visibleArea.min && pos <= visibleArea.max)
                            result = p;
                        else {
                            p.setInvisibility();
                            result = null
                        }
                        return result
                    });
                    ticksInterval = originalPoints.length / ticks;
                    arrayFusPoints = $.map(originalPoints, function(point, index) {
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
                    switch (that._isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval)) {
                        case true:
                            fusPoints.push(point);
                            break;
                        case"nextInterval":
                            var pointData = that._fusionPoints(fusPoints, ticks[nowIndexTicks], nowIndexTicks);
                            while (that._isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval) === "nextInterval")
                                nowIndexTicks++;
                            fusPoints = [];
                            that._isInInterval(point.argument, ticks, nowIndexTicks, ticksInterval) === true && fusPoints.push(point);
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
            _isInInterval: function(argument, ticks, nowIndexTicks, ticksInterval) {
                var minTick = ticks[nowIndexTicks],
                    maxTick = ticks[nowIndexTicks + 1],
                    sumMinTickTicksInterval;
                ticksInterval = $.isNumeric(ticksInterval) ? ticksInterval : utils.dateToMilliseconds(ticksInterval);
                sumMinTickTicksInterval = utils.isDate(minTick) ? new Date(minTick.getTime() + ticksInterval) : minTick + ticksInterval;
                if (argument >= minTick && argument < sumMinTickTicksInterval)
                    return true;
                if (argument < minTick || maxTick === undefined)
                    return false;
                return "nextInterval"
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
            setPointHoverState: function(point, legendCallback) {
                point.fullState = point.fullState | HOVER_STATE;
                if (!(this.isSelected() && includePointsMode(this.lastSelectionMode)) && !point.isSelected()) {
                    point.applyStyle(HOVER);
                    legendCallback && legendCallback("applyHover")
                }
            },
            releasePointHoverState: function(point, legendCallback) {
                var that = this;
                point.fullState = point.fullState & ~HOVER_STATE;
                if (!(that.isSelected() && includePointsMode(that.lastSelectionMode)) && !point.isSelected())
                    if (!(that.isHovered() && includePointsMode(that.lastHoverMode)) || that.isSelected() && that.lastSelectionMode === EXLUDE_POINTS) {
                        point.applyStyle(NORMAL);
                        legendCallback && legendCallback("resetItem")
                    }
            },
            setPointSelectedState: function(point, legendCallback) {
                point.fullState = point.fullState | SELECTED_STATE;
                point.applyStyle(SELECTION);
                legendCallback && legendCallback("applySelected")
            },
            releasePointSelectedState: function(point, legendCallback) {
                var that = this;
                point.fullState = point.fullState & ~SELECTED_STATE;
                if (that.isHovered() && includePointsMode(that.lastHoverMode) || point.isHovered()) {
                    point.applyStyle(HOVER);
                    legendCallback && legendCallback("applyHover")
                }
                else if (that.isSelected() && includePointsMode(that.lastSelectionMode)) {
                    point.applyStyle(SELECTION);
                    legendCallback && legendCallback("applySelected")
                }
                else {
                    point.applyStyle(NORMAL);
                    legendCallback && legendCallback("resetItem")
                }
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
            getPointByArg: function(arg) {
                return this.getPointsByArg(arg)[0] || null
            },
            getPointsByArg: function(arg) {
                return this.pointsByArgument[arg.valueOf()] || []
            },
            _deletePoints: function() {
                var that = this;
                that._disposePoints(that._originalPoints);
                that._disposePoints(that._aggregatedPoints);
                that._disposePoints(that._oldPoints);
                that._points = null;
                that._oldPoints = null;
                that._aggregatedPoints = null;
                that._originalPoints = null;
                that._drawedPoints = null
            },
            _deletePatterns: function() {
                _each(this._patterns || [], function(_, pattern) {
                    pattern && pattern.dispose()
                });
                this._patterns = null
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
                that._group = that._extGroups = that._markersGroup = that._elementsGroup = that._bordersGroup = that._labelsGroup = that._errorBarGroup = that._graphics = that._rangeData = that._renderer = that.translators = that._styles = that._options = that._pointOptions = that._drawedPoints = that._aggregatedPoints = that.pointsByArgument = that._segments = that._prevSeries = null
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
        var _math = Math,
            _abs = _math.abs,
            _min = _math.min,
            _max = _math.max,
            _each = $.each,
            _isEmptyObject = $.isEmptyObject,
            _isDefined = DX.utils.isDefined,
            _isFinite = isFinite,
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
            var axis = type === "arg" ? "argument" : "value",
                data = series._rangeData[type],
                minInterval = data.interval,
                interval;
            if (series[axis + "AxisType"] === DISCRETE) {
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
        function _unique(array) {
            var values = {};
            return $.map(array, function(item) {
                    var result = !values[item] ? item : null;
                    values[item] = true;
                    return result
                })
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
                errorBarCorrector = series._rangeErrorBarCorrector;
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
            data.arg.categories && (data.arg.categories = _unique(data.arg.categories));
            data.val.categories && (data.val.categories = _unique(data.val.categories));
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
            !isRangeEmpty && (data.min = 0)
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
        DX.viz.core.series.helpers.rangeDataCalculator = {
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
        var series = DX.viz.core.series,
            rangeCalculator = series.helpers.rangeDataCalculator,
            chartSeries = series.mixins.chart,
            _each = $.each,
            _extend = $.extend,
            _map = $.map,
            _noop = $.noop,
            _utils = DX.utils,
            _isDefined = _utils.isDefined,
            _isString = _utils.isString,
            math = Math,
            _floor = math.floor,
            _abs = math.abs,
            _sqrt = math.sqrt,
            _min = math.min,
            _max = math.max,
            DEFAULT_SYMBOL_POINT_SIZE = 2,
            DEFAULT_TRACKER_WIDTH = 20,
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
        function toLowerCase(value) {
            return value.toLowerCase()
        }
        function isErrorBarTypeCorrect(type) {
            return $.inArray(type, [FIXED, PERCENT, VARIANCE, STANDARD_DEVIATION, STANDARD_ERROR, UNDEFINED]) !== -1
        }
        function variance(array, expectedValue) {
            return sum($.map(array, function(value) {
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
                    that._firstDrawing && that._clearSeries();
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
                    group.attr(settings).append(target)
                },
                _applyClearingSettings: function(settings) {
                    settings.opacity = null;
                    settings.scale = null;
                    if (this._options.rotated)
                        settings.translateX = null;
                    else
                        settings.translateY = null
                },
                _createMarkerGroup: function() {
                    var that = this,
                        settings = that._getPointOptions().styles.normal;
                    settings["class"] = "dxc-markers";
                    settings.opacity = 1;
                    that._applyMarkerClipRect(settings);
                    that._createGroup("_markersGroup", that, that._group, settings)
                },
                _createLabelGroup: function() {
                    var that = this,
                        settings = {
                            "class": "dxc-labels",
                            visibility: that.getLabelVisibility() ? "visible" : "hidden"
                        };
                    that._applyElementsClipRect(settings);
                    that._applyClearingSettings(settings);
                    that._createGroup("_labelsGroup", that, that._extGroups.labelsGroup, settings)
                },
                areErrorBarsVisible: function() {
                    var errorBarOptions = this._options.valueErrorBar || {};
                    return this._errorBarsEnabled() && errorBarOptions.displayMode !== "none" && (isErrorBarTypeCorrect(toLowerCase(errorBarOptions.type + "")) || _isDefined(errorBarOptions.lowValueField) || _isDefined(errorBarOptions.highValueField))
                },
                _createErrorBarGroup: function(animationEnabled) {
                    var that = this,
                        errorBarOptions = that._options.valueErrorBar || {},
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
                _createGroups: function(animationEnabled) {
                    var that = this;
                    that._createMarkerGroup();
                    that._createLabelGroup();
                    that._createErrorBarGroup(animationEnabled);
                    animationEnabled && that._labelsGroup && that._labelsGroup.attr({opacity: 0.001})
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
                _preparePointOptions: function(customOptions) {
                    var point = this._options.point;
                    return customOptions ? _extend(true, {}, point, customOptions) : point
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
                _getRangeCorrector: function() {
                    var errorBars = this.getOptions().valueErrorBar || {},
                        mode = toLowerCase(errorBars.displayMode + "");
                    return errorBars ? function(point) {
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
                        } : undefined
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
                    var errorBars = options.valueErrorBar || {};
                    if (this._errorBarsEnabled()) {
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
                    that._errorBarGroup && that._errorBarGroup.animate({opacity: (that._options.valueErrorBar || {}).opacity || 1}, animationSettings)
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
                            return point[valueField]
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
                        errorBarsOptions = options.valueErrorBar || {},
                        valueFields = [options.valueField || "val"],
                        lowValueField = errorBarsOptions.lowValueField,
                        highValueField = errorBarsOptions.highValueField;
                    _isString(lowValueField) && valueFields.push(lowValueField);
                    _isString(highValueField) && valueFields.push(highValueField);
                    return valueFields
                },
                _calculateErrorBars: function(data) {
                    var that = this,
                        options = that._options,
                        errorBarsOptions = options.valueErrorBar || {},
                        errorBarType = toLowerCase(errorBarsOptions.type + ""),
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
                    if (!that._errorBarsEnabled() || !isErrorBarTypeCorrect(errorBarType))
                        return;
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
                            valueArray = $.map(data, function(item) {
                                return item[valueField]
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
                            trackers[i] = that._drawTrackerElement(segment).data({series: that}).append(trackersGroup);
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
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file lineSeries.js */
    (function($, DX) {
        var core = DX.viz.core,
            series = core.series,
            chartSeries = series.mixins.chart,
            polarSeries = series.mixins.polar,
            utils = DX.utils,
            scatterSeries = chartSeries.scatter,
            rangeCalculator = core.series.helpers.rangeDataCalculator,
            CANVAS_POSITION_START = "canvas_position_start",
            CANVAS_POSITION_TOP = "canvas_position_top",
            DISCRETE = "discrete",
            _extend = $.extend,
            _map = $.map,
            _each = $.each;
        function clonePoint(point, newX, newY, newAngle) {
            var p = utils.clone(point);
            p.x = newX;
            p.y = newY;
            p.angle = newAngle;
            return p
        }
        function getTangentPoint(point, prevPoint, centerPoint, tan, nextStepAngle) {
            var currectAngle = point.angle + nextStepAngle,
                cossin = utils.getCosAndSin(currectAngle),
                x = centerPoint.x + (point.radius + tan * nextStepAngle) * cossin.cos,
                y = centerPoint.y - (point.radius + tan * nextStepAngle) * cossin.sin;
            return clonePoint(prevPoint, x, y, currectAngle)
        }
        var lineMethods = {
                _createElementsGroup: function(elementsStyle) {
                    var that = this,
                        settings = _extend({"class": "dxc-elements"}, elementsStyle);
                    that._applyElementsClipRect(settings);
                    that._createGroup("_elementsGroup", that, that._group, settings)
                },
                _createBordersGroup: function(borderStyle) {
                    var that = this,
                        settings = _extend({"class": "dxc-borders"}, borderStyle);
                    that._applyElementsClipRect(settings);
                    that._createGroup("_bordersGroup", that, that._group, settings)
                },
                _createGroups: function(animationEnabled, style) {
                    var that = this;
                    style = style || that._styles.normal;
                    that._createElementsGroup(style.elements);
                    that._areBordersVisible() && that._createBordersGroup(style.border);
                    scatterSeries._createGroups.call(that, animationEnabled, {});
                    animationEnabled && that._markersGroup && that._markersGroup.attr({opacity: 0.001})
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
                        elements = that._styles.normal.elements;
                    return {
                            "stroke-width": elements["stroke-width"] > that._defaultTrackerWidth ? elements["stroke-width"] : that._defaultTrackerWidth,
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
                        point = utils.clone(pt);
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
        chartSeries.stackedline = _extend({}, chartSeries.line, {});
        chartSeries.fullstackedline = _extend({}, chartSeries.line, {_getRangeData: function(zoomArgs, calcIntervalFunction) {
                var that = this;
                rangeCalculator.calculateRangeData(that, zoomArgs, calcIntervalFunction);
                rangeCalculator.addLabelPaddings(that);
                rangeCalculator.processFullStackedRange(that);
                return that._rangeData
            }});
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
                var normAngle = utils.normalizeAngle(angle);
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
                    if (utils.normalizeAngle(Math.round(points[points.length - 1].angle)) === utils.normalizeAngle(Math.round(point.angle)))
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
        var core = DX.viz.core,
            utils = DX.utils,
            series = core.series,
            chartSeries = series.mixins.chart,
            polarSeries = series.mixins.polar,
            lineSeries = chartSeries.line,
            rangeCalculator = core.series.helpers.rangeDataCalculator,
            _map = $.map,
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
                    return this._options._IE8 ? new DX.Color(color).highlight(HOVER_COLOR_HIGHLIGHTING) : color
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
                _createPattern: function(color, hatching, custom) {
                    if (hatching && utils.isObject(hatching)) {
                        var pattern = this._renderer.pattern(color, hatching);
                        pattern._custom = custom;
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
                        p1 = utils.clone(p);
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
            series = viz.core.series,
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
                _parsePointStyle: function(style, defaultColor, defaultBorderColor, isCustomPointOptions) {
                    var color = this._createPattern(style.color || defaultColor, style.hatching, isCustomPointOptions),
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
                _createGroups: function(animationEnabled, style, firstDrawing) {
                    var that = this,
                        settings = {};
                    scatterSeries._createGroups.apply(that, arguments);
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
                _createPointStyles: function(pointOptions, isCustomPointOptions) {
                    var that = this,
                        mainColor = pointOptions.color || that._getMainColor(),
                        specialMainColor = that._getSpecialColor(mainColor);
                    return {
                            normal: that._parsePointStyle(pointOptions, mainColor, mainColor, isCustomPointOptions),
                            hover: that._parsePointStyle(pointOptions.hoverStyle || {}, specialMainColor, mainColor, isCustomPointOptions),
                            selection: that._parsePointStyle(pointOptions.selectionStyle || {}, specialMainColor, mainColor, isCustomPointOptions)
                        }
                },
                _updatePointsVisibility: function() {
                    var visibility = this._options.visible;
                    $.each(this._points, function(_, point) {
                        point._options.visible = visibility
                    })
                },
                _preparePointOptions: function(customOptions) {
                    var options = this._options;
                    return customOptions ? _extend(true, {}, options, customOptions) : options
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
                    this._patterns = $.map(this._patterns, function(pattern) {
                        if (pattern._custom) {
                            pattern.remove();
                            return null
                        }
                        else
                            return pattern
                    })
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
            _createGroups: function() {
                scatterSeries._createGroups.apply(this, arguments)
            },
            _drawPoint: function(point, groups, animationEnabled) {
                scatterSeries._drawPoint.call(this, point, groups, animationEnabled)
            },
            _parsePointStyle: function(style) {
                var base = baseBarSeriesMethods._parsePointStyle.apply(this, arguments);
                base.opacity = style.opacity;
                return base
            },
            _createMarkerGroup: function() {
                var that = this,
                    markersSettings = that._getPointOptions().styles.normal,
                    groupSettings;
                markersSettings["class"] = "dxc-markers";
                that._applyMarkerClipRect(markersSettings);
                groupSettings = _extend({}, markersSettings);
                delete groupSettings.opacity;
                that._createGroup("_markersGroup", that, that._group, groupSettings)
            },
            _createLegendState: areaSeries._createLegendState,
            _getRangeData: areaSeries._getRangeData
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file rangeSeries.js */
    (function($, DX) {
        var core = DX.viz.core,
            series = core.series.mixins.chart,
            _extend = $.extend,
            _isDefined = DX.utils.isDefined,
            _noop = $.noop,
            rangeCalculator = core.series.helpers.rangeDataCalculator,
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
                    processedMinPointsCoords = $.map(processedPoints, function(pt) {
                        return pt.getCoords(true)
                    });
                return {
                        line: processedPoints,
                        bottomLine: processedMinPointsCoords,
                        area: $.map(processedPoints, function(pt) {
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
        var mixins = DX.viz.core.series.mixins,
            series = mixins.chart,
            scatterSeries = series.scatter,
            barSeries = series.bar,
            _isDefined = DX.utils.isDefined,
            _extend = $.extend,
            _each = $.each,
            _noop = $.noop;
        series.bubble = _extend({}, scatterSeries, {
            _fillErrorBars: _noop,
            _getRangeCorrector: _noop,
            _calculateErrorBars: _noop,
            _getMainColor: barSeries._getMainColor,
            _createPointStyles: barSeries._createPointStyles,
            _createPattern: barSeries._createPattern,
            _updatePointsVisibility: barSeries._updatePointsVisibility,
            _preparePointOptions: barSeries._preparePointOptions,
            _getSpecialColor: barSeries._getSpecialColor,
            _applyMarkerClipRect: series.line._applyElementsClipRect,
            _parsePointStyle: mixins.polar.bar._parsePointStyle,
            _createLegendState: series.area._createLegendState,
            _createMarkerGroup: mixins.polar.bar._createMarkerGroup,
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
        var mixins = DX.viz.core.series.mixins,
            pieSeries = mixins.pie,
            _utils = DX.utils,
            scatterSeries = mixins.chart.scatter,
            barSeries = mixins.chart.bar,
            _extend = $.extend,
            _each = $.each,
            _noop = $.noop,
            _map = $.map,
            _isFinite = isFinite,
            _max = Math.max;
        pieSeries.pie = _extend({}, barSeries, {
            _createLabelGroup: scatterSeries._createLabelGroup,
            _createGroups: scatterSeries._createGroups,
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
            _endUpdateData: scatterSeries._prepareSeriesToDrawing,
            resetLabelSetups: function() {
                _each(this._points || [], function(_, point) {
                    point._label.clearVisibility()
                })
            },
            drawLabelsWOPoints: function(translators) {
                var that = this,
                    options = that._options,
                    points = that._points || [],
                    labelsGroup;
                if (options.label.position === "inside")
                    return false;
                that._createGroups();
                labelsGroup = that._labelsGroup;
                _each(points, function(_, point) {
                    point.drawLabel(translators, that._renderer, labelsGroup)
                });
                return true
            },
            _getCreatingPointOptions: function() {
                return this._getPointOptions()
            },
            _updateOptions: function(options) {
                this.labelSpace = 0;
                this.innerRadius = this.type === "pie" ? 0 : options.innerRadius
            },
            _checkData: function(data) {
                var base = barSeries._checkData(data);
                return this._options.paintNullPoints ? base : base && data.value !== null
            },
            _createMarkerGroup: function() {
                var that = this;
                if (!that._markersGroup)
                    that._markersGroup = that._renderer.g().attr({"class": "dxc-markers"}).append(that._group)
            },
            _getMainColor: function() {
                return this._options.mainSeriesColor()
            },
            _getPointOptions: function() {
                return this._parsePointOptions(this._preparePointOptions(), this._options.label)
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
            _createPointStyles: function(pointOptions) {
                var that = this,
                    mainColor = pointOptions.color || that._getMainColor(),
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
                    shiftedAngle = _isFinite(options.startAngle) ? _utils.normalizeAngle(options.startAngle) : 0,
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
                    pointIndex = 0,
                    total,
                    isAllPointsNegative = _max.apply(null, _map(originalPoints, function(p) {
                        return p.value
                    })) <= 0,
                    points = that._originalPoints = that._points = _map(originalPoints, function(point) {
                        if (point.value === null || !isAllPointsNegative && point.value < 0 || point.value === 0 && !minSegmentSize) {
                            point.dispose();
                            return null
                        }
                        else {
                            point.index = pointIndex++;
                            return point
                        }
                    });
                total = that._getArrangeTotal(points);
                if (minSegmentSize)
                    minShownValue = this._getArrangeMinShownValue(points, total);
                that._applyArrangeCorrection(points, minShownValue, total)
            },
            correctPosition: function(correction) {
                var debug = DX.utils.debug;
                debug.assert(correction, "correction was not passed");
                debug.assertParam(correction.centerX, "correction.centerX was not passed");
                debug.assertParam(correction.centerY, "correction.centerY was not passed");
                debug.assertParam(correction.radiusInner, "correction.radiusInner was not passed");
                debug.assertParam(correction.radiusOuter, "correction.radiusOuter was not passed");
                _each(this._points, function(_, point) {
                    point.correctPosition(correction)
                });
                this._centerX = correction.centerX;
                this._centerY = correction.centerY;
                this._radiusOuter = correction.radiusOuter
            },
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
            getPointByCoord: function(x, y) {
                var points = this._points;
                for (var i = 0; i < points.length; i++)
                    if (points[i].coordsIn(x, y))
                        return points[i]
            },
            _beginUpdateData: function() {
                this._deletePatterns();
                this._patterns = []
            },
            getCenter: function() {
                return {
                        x: this._centerX,
                        y: this._centerY
                    }
            }
        });
        pieSeries.doughnut = pieSeries.donut = pieSeries.pie
    })(jQuery, DevExpress);
    /*! Module viz-core, file financialSeries.js */
    (function($, DX) {
        var viz = DX.viz,
            seriesNS = viz.core.series,
            series = seriesNS.mixins.chart,
            scatterSeries = series.scatter,
            barSeries = series.bar,
            rangeCalculator = seriesNS.helpers.rangeDataCalculator,
            _isDefined = DX.utils.isDefined,
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
            _preparePointOptions: barSeries._preparePointOptions,
            _getRangeCorrector: _noop,
            _createErrorBarGroup: _noop,
            areErrorBarsVisible: _noop,
            _createMarkerGroup: function() {
                var that = this,
                    markersGroup,
                    styles = that._getPointOptions().styles,
                    defaultStyle = styles.normal,
                    defaultPositiveStyle = styles.positive.normal,
                    reductionStyle = styles.reduction.normal,
                    reductionPositiveStyle = styles.reductionPositive.normal,
                    markerSettings = {"class": "dxc-markers"};
                that._applyMarkerClipRect(markerSettings);
                defaultStyle["class"] = "default-markers";
                defaultPositiveStyle["class"] = "default-positive-markers";
                reductionStyle["class"] = "reduction-markers";
                reductionPositiveStyle["class"] = "reduction-positive-markers";
                that._createGroup("_markersGroup", that, that._group, markerSettings);
                markersGroup = that._markersGroup;
                that._createGroup("defaultMarkersGroup", markersGroup, markersGroup, defaultStyle);
                that._createGroup("reductionMarkersGroup", markersGroup, markersGroup, reductionStyle);
                that._createGroup("defaultPositiveMarkersGroup", markersGroup, markersGroup, defaultPositiveStyle);
                that._createGroup("reductionPositiveMarkersGroup", markersGroup, markersGroup, reductionPositiveStyle)
            },
            _createGroups: function() {
                scatterSeries._createGroups.call(this, false)
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
                switch ((that.level || "").toLowerCase()) {
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
            _getDefaultStyle: function(options, isCustomPointOptions) {
                var that = this,
                    mainPointColor = options.color || that._options.mainSeriesColor;
                return {
                        normal: that._parsePointStyle(options, mainPointColor, mainPointColor, isCustomPointOptions),
                        hover: that._parsePointStyle(options.hoverStyle, mainPointColor, mainPointColor, isCustomPointOptions),
                        selection: that._parsePointStyle(options.selectionStyle, mainPointColor, mainPointColor, isCustomPointOptions)
                    }
            },
            _getReductionStyle: function(options, isCustomPointOptions) {
                var that = this,
                    reductionColor = options.reduction.color;
                return {
                        normal: that._parsePointStyle({
                            color: reductionColor,
                            width: options.width,
                            hatching: options.hatching
                        }, reductionColor, reductionColor, isCustomPointOptions),
                        hover: that._parsePointStyle(options.hoverStyle, reductionColor, reductionColor, isCustomPointOptions),
                        selection: that._parsePointStyle(options.selectionStyle, reductionColor, reductionColor, isCustomPointOptions)
                    }
            },
            _createPointStyles: function(pointOptions, isCustomPointOptions) {
                var that = this,
                    innerColor = that._options.innerColor,
                    styles = that._getDefaultStyle(pointOptions, isCustomPointOptions),
                    positiveStyle,
                    reductionStyle,
                    reductionPositiveStyle;
                positiveStyle = _extend(true, {}, styles);
                reductionStyle = that._getReductionStyle(pointOptions, isCustomPointOptions);
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
                switch ((this.level || "").toLowerCase()) {
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
            _parsePointStyle: function(style, defaultColor, innerColor, isCustomPointOptions) {
                var color = this._createPattern(style.color || innerColor, style.hatching, isCustomPointOptions),
                    base = series.stock._parsePointStyle.call(this, style, defaultColor, color);
                base.fill = color;
                return base
            }
        })
    })(jQuery, DevExpress);
    /*! Module viz-core, file stackedSeries.js */
    (function($, DX) {
        var core = DX.viz.core,
            series = core.series,
            chartSeries = series.mixins.chart,
            polarSeries = series.mixins.polar,
            areaSeries = chartSeries.area,
            barSeries = chartSeries.bar,
            lineSeries = chartSeries.line,
            rangeCalculator = core.series.helpers.rangeDataCalculator,
            _extend = $.extend,
            utils = DX.utils,
            _noop = $.noop,
            baseStackedSeries = {
                _processRange: _noop,
                _getRangeCorrector: _noop,
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
            point = utils.clone(point);
            point.value = value;
            point.minValue = minValue;
            point.translate();
            point.argument = point.argument + position;
            return point
        }
        function preparePointsForStackedAreaSegment(points) {
            points = $.map(points, function(p) {
                var result = [p];
                if (p.leftHole)
                    result = [clonePoint(p, p.leftHole, p.minLeftHole, "left"), p];
                if (p.rightHole)
                    result.push(clonePoint(p, p.rightHole, p.minRightHole, "right"));
                return result
            });
            return points
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
                        bwPoints = $.map(points, function(p) {
                            var point = p.getCoords(true);
                            point.argument = p.argument;
                            return point
                        }),
                        prevSeriesFwPoints = $.map(that._prevSeries._segments, function(seg) {
                            return seg.line
                        }),
                        pointByArg = {};
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
        var seriesNS = DX.viz.core.series,
            statesConsts = seriesNS.helpers.consts.states,
            _each = $.each,
            _extend = $.extend,
            _isDefined = DX.utils.isDefined,
            seiresMixins = seriesNS.mixins,
            _noop = $.noop;
        function Point() {
            this.ctor.apply(this, arguments)
        }
        seriesNS.points = {Point: Point};
        Point.prototype = {
            ctor: function(series, dataItem, options) {
                this.series = series;
                this.update(dataItem, options);
                this._emptySettings = {
                    fill: null,
                    stroke: null,
                    dashStyle: null
                }
            },
            getColor: function() {
                return this._styles.normal.fill || this.series.getColor()
            },
            _getStyle: function() {
                var that = this,
                    styles = that._styles,
                    style;
                if (that.isSelected())
                    style = styles.selection;
                else if (that.isHovered())
                    style = styles.hover;
                else {
                    that.fullState = statesConsts.normalMark;
                    style = styles.normal
                }
                that._currentStyle = style;
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
                that._drawLabel(renderer, groups.labels);
                that._drawErrorBar(renderer, groups.errorBars, animationEnabled)
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
                    that._updateMarker(true, that._currentStyle)
                }
            },
            setHoverState: function() {
                this.series.setPointHoverState(this)
            },
            releaseHoverState: function(callback) {
                var that = this;
                that.series.releasePointHoverState(that, callback);
                if (that.graphic)
                    !that.isSelected() && that.graphic.toBackground()
            },
            setSelectedState: function() {
                this.series.setPointSelectedState(this)
            },
            releaseSelectedState: function() {
                this.series.releasePointSelectedState(this)
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
                if (oldType) {
                    var isNewRange = ~newType.indexOf("range"),
                        isOldRange = ~oldType.indexOf("range");
                    return isOldRange && !isNewRange || !isOldRange && isNewRange
                }
                else
                    return false
            },
            updateOptions: function(newOptions) {
                if (!_isDefined(newOptions))
                    return;
                var that = this,
                    oldOptions = that._options,
                    widgetType = newOptions.widgetType,
                    oldType = oldOptions && oldOptions.type,
                    newType = newOptions.type;
                if (seiresMixins[widgetType].pointTypes[oldType] !== seiresMixins[widgetType].pointTypes[newType]) {
                    that._needDeletingOnDraw = true;
                    that._needClearingOnDraw = false;
                    that._checkLabelsChanging(oldType, newType) && that.deleteLabel();
                    that._resetType(oldType, widgetType);
                    that._setType(newType, widgetType)
                }
                else {
                    that._needDeletingOnDraw = that._checkSymbol(oldOptions, newOptions);
                    that._needClearingOnDraw = that._checkCustomize(oldOptions, newOptions)
                }
                that._options = newOptions;
                that._fillStyle();
                that._updateLabelOptions(seiresMixins[widgetType].pointTypes[newType])
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
            _resetType: function(type, widgetType) {
                var that = this;
                if (type)
                    _each(seriesNS.points.mixins[seiresMixins[widgetType].pointTypes[type]], function(methodName) {
                        delete that[methodName]
                    })
            },
            _setType: function(type, widgetType) {
                var that = this;
                _each(seriesNS.points.mixins[seiresMixins[widgetType].pointTypes[type]], function(methodName, method) {
                    that[methodName] = method
                })
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
            correctPosition: _noop,
            hasValue: function() {
                return this.value !== null && this.minValue !== null
            },
            getBoundaryCoords: function() {
                return this.getBoundingRect()
            },
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
            updateLabelCoord: _noop,
            drawLabel: _noop,
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
        var _degreesToRadians = DX.utils.degreesToRadians,
            _patchFontOptions = DX.viz.core.utils.patchFontOptions,
            _round = Math.round,
            _abs = Math.abs,
            _min = Math.min,
            _max = Math.max,
            _ceil = Math.ceil,
            _getCosAndSin = DX.utils.getCosAndSin,
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
                prepareLabelPoints: function(points, center, angle, hasBackground) {
                    return !hasBackground ? points : [center]
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
            return DX.formatHelper.format(value, format, precision)
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
        function Label(){}
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
                this._setVisibility("visible", true)
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
            draw: function(renderer, container, customVisibility) {
                var that = this,
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
                    that._updateText(text);
                    if (customVisibility !== null)
                        customVisibility ? that.show() : that.hide()
                }
                else
                    that.hide();
                return that
            },
            _updateText: function(text) {
                var that = this,
                    bbox = that._text.attr({text: text}).getBBox();
                that._textSize = [bbox.width, bbox.height];
                if (that._background) {
                    bbox.x -= LABEL_BACKGROUND_PADDING_X;
                    bbox.y -= LABEL_BACKGROUND_PADDING_Y;
                    bbox.width += 2 * LABEL_BACKGROUND_PADDING_X;
                    bbox.height += 2 * LABEL_BACKGROUND_PADDING_Y;
                    that._background.attr(bbox)
                }
                that._labelSize = [bbox.width / 2, bbox.height / 2];
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
                    points = strategy.prepareLabelPoints([[xc, yc - that._labelSize[1]], [xc + that._labelSize[0], yc], [xc, yc + that._labelSize[1]], [xc - that._labelSize[0], yc]], [xc, yc], -that._options.rotationAngle || 0, !!that._background);
                    labelPoint = getClosestCoord(strategy.getFigureCenter(figure), points);
                    labelPoint = [_round(labelPoint[0]), _round(labelPoint[1])];
                    figurePoint = strategy.findFigurePoint(figure, labelPoint);
                    points = figurePoint.concat(labelPoint)
                }
                return points
            },
            fit: function(size) {
                var that = this;
                if (!that._textContent)
                    return that;
                var cossin = _getCosAndSin(-that._options.rotationAngle || 0),
                    textSize = _min(_abs(that._textSize[0] / cossin.cos), _abs(that._textSize[1] / cossin.sin)),
                    requiredTextSize = _min(_abs(size.width / cossin.cos), _abs(size.height / cossin.sin)),
                    text = that._textContent,
                    i,
                    ii,
                    line,
                    lines,
                    lineLength,
                    requiredLineLength;
                if (textSize > requiredTextSize) {
                    lines = text.split(/\r\n|\n|<br\s*\/?>/g);
                    for (i = 0, ii = lines.length, lineLength = 0; i < ii; ++i) {
                        line = lines[i] = lines[i].replace(/<[^>]+>/g, '');
                        lineLength = _max(lineLength, line.length)
                    }
                    requiredLineLength = _ceil(lineLength * requiredTextSize / textSize);
                    for (i = 0; i < ii; ++i)
                        lines[i] = (line = lines[i]).length > requiredLineLength ? line.substr(0, requiredLineLength - 4) + "..." : line;
                    text = lines.join("<br/>")
                }
                that._updateText(text);
                return that
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
        DX.viz.core.series.points.Label = Label;
        Label._DEBUG_formatText = formatText
    })(DevExpress, jQuery);
    /*! Module viz-core, file symbolPoint.js */
    (function($, DX) {
        var core = DX.viz.core,
            seriesNS = core.series,
            _extend = $.extend,
            _isDefined = DX.utils.isDefined,
            _math = Math,
            _round = _math.round,
            _floor = _math.floor,
            _ceil = _math.ceil,
            _abs = _math.abs,
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
            setAdjustSeriesLabels: function(adjustSeriesLabels) {
                this.adjustSeriesLabels = adjustSeriesLabels
            },
            _createLabel: function() {
                this._label = core.CoreFactory.createLabel()
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
                    options = this._options;
                switch (options.symbol) {
                    case"circle":
                        delete pointSettings.points;
                        marker = renderer.circle().attr(pointSettings);
                        break;
                    case"square":
                    case"polygon":
                    case"triangle":
                    case"triangleDown":
                    case"triangleUp":
                    case"cross":
                        marker = renderer.path([], "area").attr(pointSettings).sharp();
                        break
                }
                return marker
            },
            _createMarker: function(renderer, group, image, settings, animationEnabled) {
                var that = this,
                    marker = that._checkImage(image) ? that._createImageMarker(renderer, settings, image) : that._createSymbolMarker(renderer, settings, animationEnabled);
                if (marker)
                    marker.data({point: that}).append(group);
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
            _getVisibleArea: function() {
                var translators = this.translators,
                    visibleX,
                    visibleY;
                if (translators) {
                    visibleX = translators.x.getCanvasVisibleArea();
                    visibleY = translators.y.getCanvasVisibleArea();
                    return {
                            minX: visibleX.min,
                            maxX: visibleX.max,
                            minY: visibleY.min,
                            maxY: visibleY.max
                        }
                }
            },
            _isLabelInsidePoint: $.noop,
            _getShiftLabelCoords: function(label) {
                var coord = this._addLabelAlignmentAndOffset(label, this._getLabelCoords(label));
                return this._checkLabelPosition(label, coord)
            },
            _drawLabel: function(renderer, group) {
                var that = this,
                    customVisibility = that._getCustomLabelVisibility(),
                    coord,
                    label = that._label;
                if ((that.series.getLabelVisibility() || customVisibility !== null) && that.hasValue() && that._showForZeroValues()) {
                    label.draw(renderer, group, customVisibility);
                    if (!that._isLabelInsidePoint(label)) {
                        coord = that._getShiftLabelCoords(label);
                        label.setFigureToDrawConnector(that._getLabelConnector());
                        label.shift(_round(coord.x), _round(coord.y))
                    }
                }
                else
                    label.hide()
            },
            _showForZeroValues: function() {
                return true
            },
            _getLabelConnector: function() {
                var bbox = this._getGraphicBbox(),
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
            _checkLabelPosition: function(label, coord, pointPosition) {
                var that = this,
                    visibleArea = that._getVisibleArea(),
                    labelBbox = label.getBoundingRect(),
                    graphicBbox = that._getGraphicBbox(pointPosition),
                    offset = LABEL_OFFSET;
                if (that._isPointInVisibleArea(visibleArea, graphicBbox))
                    if (!that._options.rotated) {
                        if (visibleArea.minX > coord.x && that.adjustSeriesLabels)
                            coord.x = visibleArea.minX;
                        if (visibleArea.maxX < coord.x + labelBbox.width && that.adjustSeriesLabels)
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
                        if (visibleArea.minY > coord.y && that.adjustSeriesLabels)
                            coord.y = visibleArea.minY;
                        if (visibleArea.maxY < coord.y + labelBbox.height && that.adjustSeriesLabels)
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
            _getLabelCoords: function(label, pointPosition) {
                return this._getLabelCoordOfPosition(label, this._getLabelPosition(pointPosition), pointPosition)
            },
            _getLabelCoordOfPosition: function(label, position, pointPosition) {
                var that = this,
                    labelBBox = label.getBoundingRect(),
                    graphicBbox = that._getGraphicBbox(pointPosition),
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
                var that = this,
                    errorBarOptions = that._options.errorBars || {},
                    points = [],
                    settings,
                    pos = that._errorBarPos,
                    high = that._highErrorCoord,
                    low = that._lowErrorCoord,
                    displayMode = (errorBarOptions.displayMode + "").toLowerCase(),
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
                    that._options.rotated && $.each(points, function(_, p) {
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
            hasValue: function() {
                return this.value !== null && this.minValue !== null
            },
            setPercentValue: function(total, fullStacked, leftHoleTotal, rightHoleTotal) {
                var that = this,
                    valuePercent = _abs(that.value / total || 0),
                    minValuePercent = _abs(that.minValue / total || 0),
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
                    errorBars = options.errorBars || {};
                _isDefined(that.lowError) && (that._lowErrorCoord = valueTranslator.translate(that.lowError));
                _isDefined(that.highError) && (that._highErrorCoord = valueTranslator.translate(that.highError));
                that._errorBarPos = _floor(that._options.rotated ? that.vy : that.vx);
                that._baseErrorBarPos = errorBars.type === "stdDeviation" ? that._lowErrorCoord + (that._highErrorCoord - that._lowErrorCoord) / 2 : that._options.rotated ? that.vx : that.vy
            },
            _translate: function(translators) {
                var that = this,
                    valueAxis = that._options.rotated ? "x" : "y",
                    upperValueAxis = valueAxis.toUpperCase(),
                    valueTranslator = translators[valueAxis],
                    argumentAxis = that._options.rotated ? "y" : "x";
                that["v" + valueAxis] = that[valueAxis] = valueTranslator.translate(that.value);
                that["v" + argumentAxis] = that[argumentAxis] = translators[argumentAxis].translate(that.argument);
                that["min" + upperValueAxis] = valueTranslator.translate(that.minValue);
                that["default" + upperValueAxis] = valueTranslator.translate(CANVAS_POSITION_DEFAULT);
                that._translateErrorBars(valueTranslator);
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
                if (this.series.isFullStackedSeries() || this.initialValue > 0)
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
        var points = DX.viz.core.series.points.mixins,
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
            _getLabelConnector: function() {
                return this._getGraphicBbox()
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
                    visibleArea = that._getVisibleArea(),
                    rotated = that._options.rotated,
                    graphicBbox = that._getGraphicBbox(),
                    labelBbox = label.getBoundingRect();
                if (that._isPointInVisibleArea(visibleArea, graphicBbox))
                    return that._moveLabelOnCanvas(coord, visibleArea, labelBbox, that.adjustSeriesLabels || rotated, that.adjustSeriesLabels || !rotated);
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
            _moveLabelOnCanvas: function(coord, visibleArea, labelBbox, horizontalAdjust, verticalAdjust) {
                var x = coord.x,
                    y = coord.y;
                if (visibleArea.minX > x && horizontalAdjust)
                    x = visibleArea.minX;
                if (visibleArea.maxX < x + labelBbox.width && horizontalAdjust)
                    x = visibleArea.maxX - labelBbox.width;
                if (visibleArea.minY > y && verticalAdjust)
                    y = visibleArea.minY;
                if (visibleArea.maxY < y + labelBbox.height && verticalAdjust)
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
                }).attr(style).data({point: that}).append(group)
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
        var points = DX.viz.core.series.points.mixins,
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
                that.graphic = renderer.circle(0, 0, animationEnabled ? 0 : that.bubbleSize).attr(attr).data({point: that}).append(group)
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
            series = DX.viz.core.series,
            points = series.points.mixins,
            _extend = $.extend,
            _round = Math.round,
            _sqrt = Math.sqrt,
            _acos = Math.acos,
            DEG = 180 / Math.PI,
            _abs = Math.abs,
            _normalizeAngle = DX.utils.normalizeAngle,
            _getCosAndSin = DX.utils.getCosAndSin,
            _isDefined = DX.utils.isDefined,
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
        DX.viz.core.utils.getVerticallyShiftedAngularCoords = getVerticallyShiftedAngularCoords;
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
                that.radiusInner = correction.radiusInner;
                that.radiusOuter = correction.radiusOuter;
                that.centerX = correction.centerX;
                that.centerY = correction.centerY
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
            _updateLabelOptions: function() {
                var that = this;
                !that._label && that._createLabel();
                that._label.setOptions(that._options.label)
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
                    rad,
                    x;
                if (position === 'inside') {
                    rad = radiusInner + (radiusOuter - radiusInner) / 2 + options.radialOffset;
                    x = that.centerX + rad * angleFunctions.cos - bbox.width / 2
                }
                else {
                    rad = radiusOuter + options.radialOffset + INDENT_FROM_PIE;
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
                    rad = that.radiusOuter + options.radialOffset,
                    canvas = that.series.canvas,
                    rightBorderX = canvas.width - canvas.right - bbox.width,
                    leftBorderX = canvas.left,
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
            drawLabel: function(translators, renderer, group) {
                this.translate(translators);
                this._isLabelDrawingWithoutPoints = true;
                this._drawLabel(renderer, group);
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
                that._label.fit({
                    width: bbox.width - _abs(coord.x - bbox.x),
                    height: bbox.height - _abs(coord.y - bbox.y)
                })
            },
            _getVisibleArea: function() {
                var canvas = this.series.canvas;
                return {
                        minX: canvas.left,
                        maxX: canvas.width - canvas.right,
                        minY: canvas.top,
                        maxY: canvas.height - canvas.bottom
                    }
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
                that.graphic = renderer.arc(that.centerX, that.centerY, radiusInner, radiusOuter, toAngle, fromAngle).attr({"stroke-linejoin": "round"}).attr(that._getStyle()).data({point: that}).sharp().append(group)
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
        var core = DX.viz.core,
            points = core.series.points.mixins,
            _extend = $.extend,
            _isDefined = DX.utils.isDefined,
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
                this._topLabel = core.CoreFactory.createLabel();
                this._bottomLabel = core.CoreFactory.createLabel()
            },
            _getGraphicBbox: function(location) {
                location = location || this._labelLocation;
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
            _drawLabel: function(renderer, group) {
                var that = this,
                    coord,
                    labels = [],
                    notInverted = that._options.rotated ? that.x >= that.minX : that.y < that.minY,
                    customVisibility = that._getCustomLabelVisibility();
                that._topLabel.pointPosition = notInverted ? "top" : "bottom";
                that._bottomLabel.pointPosition = notInverted ? "bottom" : "top";
                if ((that.series.getLabelVisibility() || customVisibility !== null) && that.hasValue()) {
                    that.visibleTopMarker !== false && labels.push(that._topLabel);
                    that.visibleBottomMarker !== false && labels.push(that._bottomLabel);
                    $.each(labels, function(_, label) {
                        var pointPosition = label.pointPosition;
                        label.draw(renderer, group, customVisibility);
                        coord = that._addLabelAlignmentAndOffset(label, that._getLabelCoords(label, pointPosition));
                        coord = that._checkLabelPosition(label, coord, pointPosition);
                        that._labelLocation = label.pointPosition;
                        label.setFigureToDrawConnector(that._getLabelConnector());
                        that._labelLocation = null;
                        label.shift(_round(coord.x), _round(coord.y))
                    });
                    that._checkLabelsOverlay(that._topLabel.pointPosition)
                }
                else {
                    that._topLabel.hide();
                    that._bottomLabel.hide()
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
        var points = DX.viz.core.series.points.mixins,
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
                var edgeLocation = location === 'edge',
                    x,
                    y;
                if (this._options.rotated) {
                    x = edgeLocation ? this.x + this.width : this.x + this.width / 2;
                    y = this.y + this.height / 2
                }
                else {
                    x = this.x + this.width / 2;
                    y = edgeLocation ? this.y : this.y + this.height / 2
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
                location = location || this._labelLocation;
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
            points = viz.core.series.points.mixins,
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
                that.graphic = renderer.path(that._getPoints(), "area").attr({"stroke-linecap": "square"}).attr(attributes).data({point: that}).sharp().append(group)
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
        var points = DX.viz.core.series.points.mixins,
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
                this.graphic = renderer.path(this._getPoints(), "line").attr({"stroke-linecap": "square"}).attr(attributes).data({point: this}).sharp().append(group)
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
            points = viz.core.series.points.mixins,
            utils = DX.utils,
            isDefined = utils.isDefined,
            normalizeAngle = utils.normalizeAngle,
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
                that.vy = that.radiusOuter = coord.radius;
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
                var that = this;
                isDefined(that.lowError) && (that._lowErrorCoord = that.centerY - translator.translate(that.argument, that.lowError).radius);
                isDefined(that.highError) && (that._highErrorCoord = that.centerY - translator.translate(that.argument, that.highError).radius);
                that._errorBarPos = that.centerX;
                that._baseErrorBarPos = (that._options.errorBars || {}).type === "stdDeviation" ? that._lowErrorCoord + (that._highErrorCoord - that._lowErrorCoord) / 2 : that.centerY - that.radius
            },
            _getTranslates: function(animationEnabled) {
                return animationEnabled ? this.getDefaultCoords() : {
                        x: this.x,
                        y: this.y
                    }
            },
            getDefaultCoords: function() {
                var cossin = utils.getCosAndSin(-this.angle),
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
            _getVisibleArea: function() {
                var canvas = this.translators.canvas;
                return {
                        minX: canvas.left,
                        maxX: canvas.width - canvas.right,
                        minY: canvas.top,
                        maxY: canvas.height - canvas.bottom
                    }
            },
            _checkLabelPosition: function(label, coord) {
                var that = this,
                    visibleArea = that._getVisibleArea(),
                    graphicBbox = that._getGraphicBbox();
                if (that._isPointInVisibleArea(visibleArea, graphicBbox))
                    coord = that._moveLabelOnCanvas(coord, visibleArea, label.getBoundingRect(), true, true);
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
            _getVisibleArea: points.polarSymbolPoint._getVisibleArea,
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
                that.radiusOuter = _max(that.radiusInner, that.radius);
                that.radiusInner = that.defaultRadius = _math.min(that.radiusInner, that.radius);
                that.middleAngle = that.angle = -utils.normalizeAngle(that.middleAngleCorrection - that.angle)
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
                that.graphic = renderer.arc(x, y, innerRadius, outerRadius, coords.startAngle, coords.endAngle).attr(styles).data({point: that}).append(group)
            },
            _checkLabelPosition: function(label, coord) {
                var that = this,
                    visibleArea = that._getVisibleArea(),
                    angleFunctions = utils.getCosAndSin(that.middleAngle),
                    x = that.centerX + that.defaultRadius * angleFunctions.cos,
                    y = that.centerY - that.defaultRadius * angleFunctions.sin;
                if (x > visibleArea.minX && x < visibleArea.maxX && y > visibleArea.minY && y < visibleArea.maxY)
                    coord = that._moveLabelOnCanvas(coord, visibleArea, label.getBoundingRect(), true, true);
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
    (function($, DX, undefined) {
        var viz = DX.viz,
            parseUtils = new viz.core.ParseUtils,
            STRING = "string",
            NUMERIC = "numeric",
            DATETIME = "datetime",
            DISCRETE = "discrete",
            CONTINUOUS = "continuous",
            LOGARITHMIC = "logarithmic",
            VALUE_TYPE = "valueType",
            ARGUMENT_TYPE = "argumentType",
            axisTypeParser = viz.core.utils.enumParser([STRING, NUMERIC, DATETIME]),
            utils = DX.utils,
            _each = $.each,
            _isDefined = utils.isDefined;
        function groupingValues(data, others, valueField, index) {
            if (!_isDefined(index) || index < 0)
                return;
            _each(data.slice(index), function(_, cell) {
                if (!_isDefined(cell[valueField]))
                    return;
                others[valueField] += cell[valueField];
                cell[valueField] = undefined;
                cell["original" + valueField] = undefined
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
        function DataValidator(data, groups, incidentOccured, dataPrepareOptions) {
            var that = this;
            groups = groups || [[]];
            that._nullData = !data;
            that.groups = groups;
            that.data = data || [];
            that._parsers = {};
            that._errorShowList = {};
            that._skipFields = {};
            that.options = dataPrepareOptions || {};
            that.incidentOccured = incidentOccured;
            that.userArgumentCategories = that.groups.argumentOptions && that.groups.argumentOptions.categories || [];
            if (!incidentOccured)
                that.incidentOccured = $.noop
        }
        viz.core.DataValidator = DataValidator;
        DataValidator.prototype = {
            ctor: DataValidator,
            validate: function validate() {
                var that = this,
                    dataLength;
                that._data = that.data;
                that.groups.argumentType = null;
                that.groups.argumentAxisType = null;
                _each(that.groups, function(_, group) {
                    group.valueType = null;
                    group.valueAxisType = null;
                    _each(group, function(_, series) {
                        series.updateDataType({})
                    });
                    group.valueAxis && group.valueAxis.resetTypes(VALUE_TYPE)
                });
                if (that.groups.argumentAxes)
                    _each(that.groups.argumentAxes, function(_, axis) {
                        axis.resetTypes(ARGUMENT_TYPE)
                    });
                that._checkType();
                that._checkAxisType();
                if (!utils.isArray(that.data) || that._nullData)
                    that._incorrectDataMessage();
                if (that.options.convertToAxisDataType) {
                    that._createParser();
                    that._parse()
                }
                that._groupData();
                that._sort();
                dataLength = that._data.length;
                _each(that._skipFields, function(field, fieldValue) {
                    if (fieldValue === dataLength)
                        that.incidentOccured("W2002", [field])
                });
                return that._data
            },
            _checkValueTypeOfGroup: function(group, cell) {
                var that = this;
                _each(group, function(_, series) {
                    _each(series.getValueFields(), function(_, field) {
                        group.valueType = that._getType(cell[field], group.valueType)
                    })
                });
                return group.valueType
            },
            _checkArgumentTypeOfGroup: function(group, cell) {
                var that = this;
                _each(group, function(_, series) {
                    that.groups.argumentType = that._getType(cell[series.getArgumentField()], that.groups.argumentType)
                });
                return that.groups.argumentType
            },
            _checkType: function _checkType() {
                var that = this,
                    groupsWithUndefinedValueType = [],
                    groupsWithUndefinedArgumentType = [],
                    groups = that.groups,
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
                    _each(that.data, function(_, cell) {
                        var defineVal,
                            defineArg;
                        if (!utils.isObject(cell))
                            return;
                        _each(groupsWithUndefinedValueType, function(_, group) {
                            defineVal = that._checkValueTypeOfGroup(group, cell)
                        });
                        _each(groupsWithUndefinedArgumentType, function(_, group) {
                            defineArg = that._checkArgumentTypeOfGroup(group, cell)
                        });
                        if (!that.options.checkTypeForAllData && defineVal && defineArg)
                            return false
                    })
            },
            _checkAxisType: function _checkAxisType() {
                var that = this,
                    groups = that.groups,
                    argumentOptions = groups.argumentOptions || {};
                _each(groups, function(_, group) {
                    _each(group, function(_, series) {
                        var optionsSeries = {},
                            valueOptions = group.valueOptions || {},
                            valueCategories = valueOptions.categories || [];
                        optionsSeries.argumentAxisType = that._correctAxisType(groups.argumentType, argumentOptions.type, !!that.userArgumentCategories.length);
                        optionsSeries.valueAxisType = that._correctAxisType(group.valueType, valueOptions.type, !!valueCategories.length);
                        groups.argumentAxisType = groups.argumentAxisType || optionsSeries.argumentAxisType;
                        group.valueAxisType = group.valueAxisType || optionsSeries.valueAxisType;
                        optionsSeries.argumentType = groups.argumentType;
                        optionsSeries.valueType = group.valueType;
                        optionsSeries.showZero = valueOptions.showZero;
                        series.updateDataType(optionsSeries)
                    });
                    if (group.valueAxis) {
                        group.valueAxis.setTypes(group.valueAxisType, group.valueType, VALUE_TYPE);
                        group.valueAxis.validate(false)
                    }
                });
                if (that.groups.argumentAxes)
                    _each(that.groups.argumentAxes, function(_, axis) {
                        axis.setTypes(that.groups.argumentAxisType, that.groups.argumentType, ARGUMENT_TYPE);
                        axis.validate(true)
                    })
            },
            _createParser: function _createParser() {
                var that = this,
                    groups = that.groups;
                _each(groups, function(_, group) {
                    _each(group, function(_, series) {
                        that._parsers[series.getArgumentField()] = that._createParserUnit(groups.argumentType, groups.argumentAxisType === LOGARITHMIC ? that._filterForLogAxis : null);
                        _each(series.getValueFields(), function(_, field) {
                            that._parsers[field] = that._createParserUnit(group.valueType, group.valueAxisType === LOGARITHMIC ? that._filterForLogAxis : null, series.getOptions().ignoreEmptyPoints)
                        });
                        if (series.getTagField())
                            that._parsers[series.getTagField()] = null
                    })
                })
            },
            _parse: function _parse() {
                var that = this,
                    parsedData = [];
                _each(that.data, function(_, cell) {
                    var parserObject = {};
                    if (!utils.isObject(cell)) {
                        cell && that._incorrectDataMessage();
                        return
                    }
                    _each(that._parsers, function(field, parser) {
                        parserObject[field] = parser ? parser(cell[field], field) : cell[field];
                        parserObject["original" + field] = cell[field]
                    });
                    parsedData.push(parserObject)
                });
                this._data = parsedData
            },
            _groupMinSlices: function(argumentField, valueField, smallValuesGrouping) {
                smallValuesGrouping = smallValuesGrouping || {};
                var that = this,
                    mode = smallValuesGrouping.mode,
                    count = smallValuesGrouping.topCount,
                    threshold = smallValuesGrouping.threshold,
                    name = smallValuesGrouping.groupName || "others",
                    others = {},
                    data = that._data.slice(),
                    index;
                if (!mode || mode === "none")
                    return;
                others[argumentField] = name + "";
                others[valueField] = 0;
                data.sort(function(a, b) {
                    if (_isDefined(b[valueField]) && _isDefined(a[valueField]))
                        return b[valueField] - a[valueField];
                    else if (!_isDefined(b[valueField]) && a[valueField])
                        return -1;
                    else if (!_isDefined(a[valueField]) && b[valueField])
                        return 1
                });
                if (mode === "smallValueThreshold") {
                    _each(data, function(i, cell) {
                        if (_isDefined(index) || !_isDefined(cell[valueField]))
                            return;
                        if (threshold > cell[valueField])
                            index = i
                    });
                    groupingValues(data, others, valueField, index)
                }
                else if (mode === "topN")
                    groupingValues(data, others, valueField, count);
                others[valueField] && that._data.push(others)
            },
            _groupData: function() {
                var that = this,
                    groups = that.groups,
                    isPie = groups.length && groups[0].length && (groups[0][0].type === "pie" || groups[0][0].type === "doughnut" || groups[0][0].type === "donut"),
                    argumentField,
                    valueFields;
                if (!isPie)
                    return;
                _each(groups, function(_, group) {
                    _each(group, function(_, series) {
                        argumentField = series.getArgumentField();
                        valueFields = series.getValueFields();
                        if (groups.argumentAxisType === DISCRETE)
                            that._groupSameArguments(argumentField, valueFields);
                        that._groupMinSlices(argumentField, valueFields[0], series.getOptions().smallValuesGrouping)
                    })
                })
            },
            _groupSameArguments: function(argumentField, valueFields) {
                var that = this,
                    argument,
                    dataOfArguments = {},
                    parsedData = that._data;
                _each(parsedData, function(i, cell) {
                    if (!_isDefined(cell[argumentField]) || !_isDefined(cell[valueFields[0]]))
                        return;
                    argument = cell[argumentField];
                    if (_isDefined(dataOfArguments[argument])) {
                        var data = parsedData[dataOfArguments[argument]];
                        _each(valueFields, function(_, field) {
                            data[field] += cell[field];
                            cell[field] = undefined;
                            cell["original" + field] = undefined
                        })
                    }
                    else
                        dataOfArguments[argument] = i
                })
            },
            _getType: function _getType(unit, type) {
                if (type === STRING || utils.isString(unit))
                    return STRING;
                if (type === DATETIME || utils.isDate(unit))
                    return DATETIME;
                if (utils.isNumber(unit))
                    return NUMERIC;
                return type
            },
            _correctAxisType: function _correctAxisType(type, axisType, hasCategories) {
                if (type === STRING && (axisType === CONTINUOUS || axisType === LOGARITHMIC))
                    this.incidentOccured("E2002");
                if (axisType === LOGARITHMIC)
                    return LOGARITHMIC;
                axisType = (hasCategories || axisType === DISCRETE || type === STRING) && DISCRETE;
                return axisType || CONTINUOUS
            },
            _filterForLogAxis: function(val, field) {
                if (val <= 0) {
                    this.incidentOccured("E2004", [field]);
                    return null
                }
                return val
            },
            _createParserUnit: function _createParserUnit(type, filter, ignoreEmptyPoints) {
                var that = this,
                    parser = type ? parseUtils.getParser(type, undefined, true) : function(unit) {
                        return unit
                    };
                return function(unit, field) {
                        var parseUnit = parser(unit);
                        if (filter)
                            parseUnit = filter.call(that, parseUnit, field);
                        parseUnit === null && ignoreEmptyPoints && (parseUnit = undefined);
                        if (parseUnit === undefined) {
                            that._addSkipFields(field);
                            that._validUnit(unit, field, type)
                        }
                        return parseUnit
                    }
            },
            _validUnit: function _validUnit(unit, field) {
                if (!unit)
                    return;
                if (!utils.isNumber(unit) && !utils.isDate(unit) && !utils.isString(unit)) {
                    this.incidentOccured("E2003", [field]);
                    return
                }
                this.incidentOccured("E2004", [field])
            },
            _sort: function _sort() {
                var that = this,
                    sortingMethod = that.options.sortingMethod,
                    data = that._data,
                    groups = that.groups,
                    hash = {},
                    argumentField = groups.length && groups[0].length && groups[0][0].getArgumentField();
                if (utils.isFunction(sortingMethod))
                    data.sort(sortingMethod);
                else if (that.userArgumentCategories.length) {
                    _each(that.userArgumentCategories, function(index, value) {
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
            },
            _addSkipFields: function _addSkipFields(field) {
                this._skipFields[field] = (this._skipFields[field] || 0) + 1
            },
            _incorrectDataMessage: function() {
                if (this._erorrDataSource !== true) {
                    this._erorrDataSource = true;
                    this.incidentOccured("E2001")
                }
            }
        }
    })(jQuery, DevExpress);
    /*! Module viz-core, file default.js */
    (function(DX, undefined) {
        var WHITE = "#ffffff",
            BLACK = "#000000",
            LIGHT_GREY = "#d3d3d3",
            GREY_GREEN = "#303030",
            RED = "#ff0000";
        DX.viz.core.registerTheme({
            name: "generic.light",
            font: {
                color: '#767676',
                family: "'Segoe UI', 'Helvetica Neue', 'Trebuchet MS', Verdana",
                weight: 400,
                size: 12,
                cursor: 'default'
            },
            redrawOnResize: true,
            backgroundColor: WHITE,
            primaryTitleColor: "#232323",
            secondaryTitleColor: "#767676",
            axisColor: LIGHT_GREY,
            axisLabelColor: "#a8a8a8",
            title: {font: {
                    family: "'Segoe UI Light', 'Helvetica Neue Light', 'Segoe UI', 'Helvetica Neue', 'Trebuchet MS', Verdana",
                    weight: 200
                }},
            loadingIndicator: {text: "Loading..."},
            tooltip: {
                enabled: false,
                border: {
                    width: 1,
                    color: LIGHT_GREY,
                    dashStyle: 'solid',
                    visible: true
                },
                font: {color: '#232323'},
                color: WHITE,
                arrowLength: 10,
                paddingLeftRight: 18,
                paddingTopBottom: 15,
                shared: false,
                location: 'center',
                format: '',
                argumentFormat: '',
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
                hoverMode: 'includePoints',
                verticalAlignment: 'top',
                horizontalAlignment: 'right',
                position: 'outside',
                visible: true,
                margin: 10,
                markerSize: 12,
                border: {
                    visible: false,
                    width: 1,
                    cornerRadius: 0,
                    dashStyle: 'solid'
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
                    easing: 'easeOutCubic',
                    maxPointCountSupported: 300
                },
                commonSeriesSettings: {
                    border: {
                        visible: false,
                        width: 2
                    },
                    showInLegend: true,
                    visible: true,
                    hoverMode: 'nearestPoint',
                    selectionMode: 'includePoints',
                    hoverStyle: {
                        hatching: {
                            direction: 'right',
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
                            direction: 'right',
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
                        alignment: 'center',
                        rotationAngle: 0,
                        horizontalOffset: 0,
                        verticalOffset: 0,
                        radialOffset: 0,
                        format: '',
                        argumentFormat: '',
                        precision: 0,
                        argumentPrecision: 0,
                        percentPrecision: 0,
                        showForZeroValues: true,
                        customizeText: undefined,
                        maxLabelCount: undefined,
                        position: 'outside',
                        font: {color: WHITE},
                        border: {
                            visible: false,
                            width: 1,
                            color: LIGHT_GREY,
                            dashStyle: 'solid'
                        },
                        connector: {
                            visible: false,
                            width: 1
                        }
                    }
                },
                seriesSelectionMode: 'single',
                pointSelectionMode: 'single',
                equalRowHeight: true,
                dataPrepareSettings: {
                    checkTypeForAllData: false,
                    convertToAxisDataType: true,
                    sortingMethod: true
                },
                title: {
                    font: {size: 28},
                    margin: 10
                },
                adaptiveLayout: {
                    width: 80,
                    height: 80,
                    keepLabels: true
                },
                _rtl: {legend: {itemTextPosition: 'left'}},
                resolveLabelOverlapping: "none"
            },
            "chart:common:axis": {
                visible: false,
                setTicksAtUnitBeginning: true,
                valueMarginsEnabled: true,
                placeholderSize: null,
                logarithmBase: 10,
                discreteAxisDivisionMode: 'betweenLabels',
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
                tick: {visible: false},
                minorTick: {
                    visible: false,
                    opacity: 0.3
                },
                stripStyle: {
                    paddingLeftRight: 10,
                    paddingTopBottom: 5
                },
                constantLineStyle: {
                    width: 1,
                    color: BLACK,
                    dashStyle: "solid",
                    label: {
                        visible: true,
                        position: "inside"
                    }
                }
            },
            chart: {
                commonSeriesSettings: {
                    type: 'line',
                    stack: 'default',
                    point: {
                        visible: true,
                        symbol: 'circle',
                        size: 12,
                        border: {
                            visible: false,
                            width: 1
                        },
                        hoverMode: 'onlyPoint',
                        selectionMode: 'onlyPoint',
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
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    stackedline: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    stackedspline: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    fullstackedline: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    fullstackedspline: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3}
                    },
                    stepline: {
                        width: 2,
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
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
                            hatching: {direction: 'none'}
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
                        label: {position: "inside"}
                    },
                    fullstackedbar: {
                        cornerRadius: 0,
                        point: {
                            hoverStyle: {border: {visible: false}},
                            selectionStyle: {border: {visible: false}}
                        },
                        label: {position: "inside"}
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
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3},
                        point: {border: {visible: true}}
                    },
                    stock: {
                        width: 1,
                        reduction: {color: RED},
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
                        },
                        selectionStyle: {width: 3},
                        point: {border: {visible: true}}
                    }
                },
                crosshair: {
                    enabled: false,
                    color: '#f78119',
                    width: 1,
                    dashStyle: 'solid',
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
                            mode: 'auto',
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
                    position: 'bottom',
                    axisDivisionFactor: 50,
                    label: {alignment: "center"},
                    stripStyle: {label: {
                            horizontalAlignment: 'center',
                            verticalAlignment: 'top'
                        }},
                    constantLineStyle: {label: {
                            horizontalAlignment: 'right',
                            verticalAlignment: 'top'
                        }},
                    constantLines: {}
                },
                verticalAxis: {
                    position: 'left',
                    axisDivisionFactor: 30,
                    label: {
                        alignment: 'right',
                        overlappingBehavior: {mode: 'enlargeTickInterval'}
                    },
                    stripStyle: {label: {
                            horizontalAlignment: 'left',
                            verticalAlignment: 'center'
                        }},
                    constantLineStyle: {label: {
                            horizontalAlignment: 'left',
                            verticalAlignment: 'top'
                        }},
                    constantLines: {}
                },
                argumentAxis: {},
                valueAxis: {grid: {visible: true}},
                commonPaneSettings: {
                    backgroundColor: 'none',
                    border: {
                        color: LIGHT_GREY,
                        width: 1,
                        visible: false,
                        top: true,
                        bottom: true,
                        left: true,
                        right: true,
                        dashStyle: 'solid'
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
                zoomingMode: 'none',
                scrollingMode: 'none',
                synchronizeMultiAxes: true,
                equalBarWidth: true,
                minBubbleSize: 12,
                maxBubbleSize: 0.2
            },
            pie: {
                commonSeriesSettings: {
                    type: 'pie',
                    pie: {
                        border: {
                            visible: false,
                            width: 2,
                            color: WHITE
                        },
                        hoverStyle: {
                            hatching: {
                                direction: 'right',
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
                                direction: 'right',
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
                        innerRadius: 0.5,
                        border: {
                            visible: false,
                            width: 2,
                            color: WHITE
                        },
                        hoverStyle: {
                            hatching: {
                                direction: 'right',
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
                                direction: 'right',
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
                        innerRadius: 0.5,
                        border: {
                            visible: false,
                            width: 2,
                            color: WHITE
                        },
                        hoverStyle: {
                            hatching: {
                                direction: 'right',
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
                                direction: 'right',
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
                    hoverMode: 'markPoint',
                    backgroundColor: "none"
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
                    majorTick: {
                        visible: true,
                        length: 5,
                        width: 2,
                        showCalculatedTicks: true,
                        useTicksAutoArrangement: true
                    },
                    minorTick: {
                        visible: false,
                        length: 3,
                        width: 1,
                        showCalculatedTicks: true
                    },
                    label: {visible: true}
                },
                rangeContainer: {
                    offset: 0,
                    width: 5,
                    backgroundColor: '#808080'
                },
                valueIndicators: {
                    _default: {color: '#c2c2c2'},
                    rangebar: {
                        space: 2,
                        size: 10,
                        color: '#cbc5cf',
                        backgroundColor: 'none',
                        text: {
                            indent: 0,
                            font: {
                                size: 14,
                                color: null
                            }
                        }
                    },
                    twocolorneedle: {secondColor: '#e18e92'},
                    trianglemarker: {
                        space: 2,
                        length: 14,
                        width: 13,
                        color: '#8798a5'
                    },
                    textcloud: {
                        arrowLength: 5,
                        horizontalOffset: 6,
                        verticalOffset: 3,
                        color: '#679ec5',
                        text: {font: {
                                color: WHITE,
                                size: 18
                            }}
                    }
                },
                title: {
                    layout: {
                        horizontalAlignment: 'center',
                        verticalAlignment: 'top',
                        overlay: 0
                    },
                    font: {size: 16}
                },
                subtitle: {font: {size: 14}},
                indicator: {
                    hasPositiveMeaning: true,
                    layout: {
                        horizontalAlignment: 'center',
                        verticalAlignment: 'bottom',
                        overlay: 0
                    },
                    text: {font: {size: 18}}
                },
                _circular: {
                    scale: {
                        orientation: 'outside',
                        label: {indentFromTick: 10}
                    },
                    rangeContainer: {orientation: 'outside'},
                    valueIndicatorType: 'rectangleneedle',
                    subvalueIndicatorType: 'trianglemarker',
                    valueIndicators: {
                        _type: 'rectangleneedle',
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
                        horizontalOrientation: 'right',
                        verticalOrientation: 'bottom',
                        label: {indentFromTick: -10}
                    },
                    rangeContainer: {
                        horizontalOrientation: 'right',
                        verticalOrientation: 'bottom'
                    },
                    valueIndicatorType: 'rangebar',
                    subvalueIndicatorType: 'trianglemarker',
                    valueIndicators: {
                        _type: 'rectangle',
                        _default: {
                            offset: 2.5,
                            length: 15,
                            width: 15
                        },
                        rectangle: {width: 10},
                        rangebar: {
                            offset: 10,
                            horizontalOrientation: 'right',
                            verticalOrientation: 'bottom'
                        },
                        trianglemarker: {
                            offset: 10,
                            horizontalOrientation: 'left',
                            verticalOrientation: 'top'
                        },
                        textcloud: {
                            offset: -1,
                            horizontalOrientation: 'left',
                            verticalOrientation: 'top'
                        }
                    }
                }
            },
            barGauge: {
                backgroundColor: '#e0e0e0',
                relativeInnerRadius: 0.3,
                barSpacing: 4,
                label: {
                    indent: 20,
                    connectorWidth: 2,
                    font: {size: 16}
                },
                title: {
                    layout: {
                        horizontalAlignment: 'center',
                        verticalAlignment: 'top',
                        overlay: 0
                    },
                    font: {size: 16}
                },
                subtitle: {font: {size: 14}},
                indicator: {
                    hasPositiveMeaning: true,
                    layout: {
                        horizontalAlignment: 'center',
                        verticalAlignment: 'bottom',
                        overlay: 0
                    },
                    text: {font: {size: 18}}
                }
            },
            rangeSelector: {
                scale: {
                    showCustomBoundaryTicks: true,
                    showMinorTicks: true,
                    useTicksAutoArrangement: true,
                    setTicksAtUnitBeginning: true,
                    label: {
                        visible: true,
                        topIndent: 7,
                        font: {size: 11}
                    },
                    tick: {
                        width: 1,
                        color: BLACK,
                        opacity: 0.1
                    },
                    marker: {
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
                    color: '#606060',
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
                    image: {location: 'full'}
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
                        point: {visible: false}
                    }
                }
            },
            map: {
                background: {
                    borderWidth: 1,
                    borderColor: '#cacaca'
                },
                areaSettings: {
                    borderWidth: 1,
                    borderColor: WHITE,
                    color: '#d2d2d2',
                    hoveredBorderColor: GREY_GREEN,
                    selectedBorderWidth: 2,
                    selectedBorderColor: GREY_GREEN,
                    label: {
                        enabled: false,
                        stroke: WHITE,
                        'stroke-width': 2,
                        'stroke-opacity': 0.5,
                        font: {
                            color: '#2b2b2b',
                            size: 16,
                            opacity: 0.5
                        }
                    }
                },
                markerSettings: {
                    label: {
                        enabled: true,
                        stroke: WHITE,
                        'stroke-width': 1,
                        'stroke-opacity': 0.5,
                        font: {
                            color: '#2b2b2b',
                            size: 12
                        }
                    },
                    _dot: {
                        borderWidth: 2,
                        borderColor: WHITE,
                        color: '#ba4d51',
                        size: 8,
                        selectedStep: 2,
                        backStep: 18,
                        backColor: WHITE,
                        backOpacity: 0.32,
                        shadow: true
                    },
                    _bubble: {
                        minSize: 20,
                        maxSize: 50,
                        color: '#ba4d51',
                        hoveredBorderWidth: 1,
                        hoveredBorderColor: GREY_GREEN,
                        selectedBorderWidth: 2,
                        selectedBorderColor: GREY_GREEN
                    },
                    _pie: {
                        size: 50,
                        hoveredBorderWidth: 1,
                        hoveredBorderColor: GREY_GREEN,
                        selectedBorderWidth: 2,
                        selectedBorderColor: GREY_GREEN
                    },
                    _image: {size: 20}
                },
                legend: {
                    verticalAlignment: 'bottom',
                    horizontalAlignment: 'right',
                    position: 'inside',
                    backgroundOpacity: 0.65,
                    border: {
                        visible: true,
                        color: '#cacaca'
                    },
                    paddingLeftRight: 16,
                    paddingTopBottom: 12,
                    markerColor: '#ba4d51'
                },
                controlBar: {
                    borderColor: '#5d5d5d',
                    borderWidth: 3,
                    color: WHITE,
                    margin: 20,
                    opacity: 0.3
                },
                _rtl: {legend: {itemTextPosition: 'left'}}
            },
            sparkline: {
                lineColor: '#666666',
                lineWidth: 2,
                areaOpacity: 0.2,
                minColor: '#e8c267',
                maxColor: '#e55253',
                barPositiveColor: '#a9a9a9',
                barNegativeColor: '#d7d7d7',
                winColor: '#a9a9a9',
                lossColor: '#d7d7d7',
                firstLastColor: '#666666',
                pointSymbol: 'circle',
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
                color: '#e8c267',
                targetColor: '#666666',
                targetWidth: 4,
                showTarget: true,
                showZeroLevel: true,
                tooltip: {enabled: true}
            },
            polar: {
                commonSeriesSettings: {
                    type: 'scatter',
                    closed: true,
                    point: {
                        visible: true,
                        symbol: 'circle',
                        size: 12,
                        border: {
                            visible: false,
                            width: 1
                        },
                        hoverMode: 'onlyPoint',
                        selectionMode: 'onlyPoint',
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
                        dashStyle: 'solid',
                        hoverStyle: {
                            width: 3,
                            hatching: {direction: 'none'}
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
                        overlappingBehavior: {mode: 'enlargeTickInterval'},
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
                    position: 'top',
                    axisDivisionFactor: 50,
                    label: {alignment: "center"}
                },
                verticalAxis: {
                    position: 'top',
                    axisDivisionFactor: 30,
                    label: {alignment: "right"}
                }
            }
        });
        DX.viz.core.registerTheme({
            name: "generic.dark",
            font: {color: '#808080'},
            backgroundColor: GREY_GREEN,
            primaryTitleColor: "#dbdbdb",
            secondaryTitleColor: "#a3a3a3",
            axisColor: "#555555",
            axisLabelColor: "#707070",
            tooltip: {
                color: '#2b2b2b',
                border: {color: '#494949'},
                font: {color: '#929292'}
            },
            "chart:common": {commonSeriesSettings: {
                    label: {border: {color: '#494949'}},
                    valueErrorBar: {color: WHITE}
                }},
            "chart:common:axis": {constantLineStyle: {color: WHITE}},
            chart: {
                crosshair: {color: '#515151'},
                commonPaneSettings: {border: {color: '#494949'}}
            },
            pieIE8: {commonSeriesSettings: {
                    pie: {
                        hoverStyle: {border: {color: '#2b2b2b'}},
                        selectionStyle: {border: {color: '#2b2b2b'}}
                    },
                    donut: {
                        hoverStyle: {border: {color: '#2b2b2b'}},
                        selectionStyle: {border: {color: '#2b2b2b'}}
                    },
                    doughnut: {
                        hoverStyle: {border: {color: '#2b2b2b'}},
                        selectionStyle: {border: {color: '#2b2b2b'}}
                    }
                }},
            gauge: {
                rangeContainer: {backgroundColor: '#b5b5b5'},
                valueIndicators: {
                    _default: {color: '#b5b5b5'},
                    rangebar: {color: '#84788b'},
                    twocolorneedle: {secondColor: '#ba544d'},
                    trianglemarker: {color: '#b7918f'},
                    textcloud: {color: '#ba544d'}
                }
            },
            barGauge: {backgroundColor: "#3c3c3c"},
            rangeSelector: {
                selectedRangeColor: '#b5b5b5',
                scale: {tick: {
                        color: WHITE,
                        opacity: 0.05
                    }},
                sliderMarker: {
                    color: '#b5b5b5',
                    font: {color: GREY_GREEN}
                },
                sliderHandle: {
                    color: WHITE,
                    opacity: 0.2
                },
                shutter: {
                    color: '#2b2b2b',
                    opacity: 0.9
                }
            },
            map: {
                background: {borderColor: '#3f3f3f'},
                areaSettings: {
                    borderColor: GREY_GREEN,
                    color: '#686868',
                    hoveredBorderColor: WHITE,
                    selectedBorderColor: WHITE,
                    label: {
                        stroke: BLACK,
                        font: {color: WHITE}
                    }
                },
                markerSettings: {
                    label: {
                        stroke: BLACK,
                        font: {color: WHITE}
                    },
                    _bubble: {
                        hoveredBorderColor: WHITE,
                        selectedBorderColor: WHITE
                    },
                    _pie: {
                        hoveredBorderColor: WHITE,
                        selectedBorderColor: WHITE
                    }
                },
                legend: {
                    border: {color: '#3f3f3f'},
                    font: {color: WHITE}
                },
                controlBar: {
                    borderColor: '#c7c7c7',
                    color: GREY_GREEN
                }
            },
            sparkline: {
                lineColor: '#c7c7c7',
                firstLastColor: '#c7c7c7',
                barPositiveColor: '#b8b8b8',
                barNegativeColor: '#8e8e8e',
                winColor: '#b8b8b8',
                lossColor: '#8e8e8e',
                pointColor: GREY_GREEN
            },
            bullet: {targetColor: '#8e8e8e'}
        }, "generic.light");
        DX.viz.core.currentTheme("generic.light");
        DX.viz.core.registerThemeAlias("desktop.light", "generic.light");
        DX.viz.core.registerThemeAlias("desktop.dark", "generic.dark")
    })(DevExpress);
    /*! Module viz-core, file android.js */
    (function(DX) {
        var ANDROID5_LIGHT = "android5.light",
            registerThemeAlias = DX.viz.core.registerThemeAlias;
        DX.viz.core.registerTheme({
            name: ANDROID5_LIGHT,
            backgroundColor: "#ffffff",
            primaryTitleColor: "#232323",
            secondaryTitleColor: "#767676",
            axisColor: "#d3d3d3",
            axisLabelColor: "#a8a8a8",
            tooltip: {
                color: "#e8e8e8",
                font: {color: "#808080"}
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
            core = DX.viz.core;
        core.registerTheme({
            name: IOS7_DEFAULT,
            backgroundColor: "#ffffff",
            primaryTitleColor: "#000000",
            secondaryTitleColor: "#767676",
            axisColor: "#ececec",
            axisLabelColor: "#b8b8b8",
            legend: {font: {color: '#000000'}},
            tooltip: {font: {color: '#808080'}},
            "chart:common": {commonSeriesSettings: {label: {border: {color: '#d3d3d3'}}}},
            chart: {commonPaneSettings: {border: {color: '#d3d3d3'}}}
        }, "generic.light");
        core.registerThemeAlias("ios", IOS7_DEFAULT)
    })(DevExpress);
    /*! Module viz-core, file win8.js */
    (function(DX) {
        var core = DX.viz.core,
            registerTheme = core.registerTheme,
            registerThemeSchemeAlias = core.registerThemeSchemeAlias,
            BLACK = "#000000",
            WHITE = "#ffffff";
        registerTheme({
            name: "win8.black",
            backgroundColor: BLACK,
            primaryTitleColor: WHITE,
            secondaryTitleColor: "#d8d8d8",
            axisColor: "#4c4c4c",
            axisLabelColor: "#a0a0a0",
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
            barGauge: {backgroundColor: "#2b3036"},
            rangeSelector: {scale: {tick: {opacity: 0.15}}}
        }, "generic.dark");
        registerTheme({
            name: "win8.white",
            backgroundColor: WHITE,
            primaryTitleColor: BLACK,
            secondaryTitleColor: "#767676",
            axisColor: "#ececec",
            axisLabelColor: "#b8b8b8",
            title: {font: {color: '#808080'}},
            legend: {font: {color: BLACK}},
            tooltip: {font: {color: '#808080'}}
        }, "generic.light");
        registerThemeSchemeAlias("win8.dark", "win8.black");
        registerThemeSchemeAlias("win8.light", "win8.white")
    })(DevExpress);
    /*! Module viz-core, file themeManager.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            Palette = viz.core.Palette,
            utils = DX.utils,
            _findTheme = DX.viz.core.findTheme,
            _isString = utils.isString,
            _isDefined = utils.isDefined,
            HOVER_COLOR_HIGHLIGHTING = 20,
            HIGHLIGHTING_STEP = 50,
            FONT = "font",
            COMMON_AXIS_SETTINGS = "commonAxisSettings",
            PIE_FONT_FIELDS = ["legend." + FONT, "title." + FONT, "tooltip." + FONT, "loadingIndicator." + FONT, "commonSeriesSettings.label." + FONT],
            POLAR_FONT_FIELDS = PIE_FONT_FIELDS.concat([COMMON_AXIS_SETTINGS + ".label." + FONT, COMMON_AXIS_SETTINGS + ".title." + FONT]),
            CHART_FONT_FIELDS = POLAR_FONT_FIELDS.concat(["crosshair.label." + FONT]),
            chartToFontFieldsMap = {
                pie: PIE_FONT_FIELDS,
                chart: CHART_FONT_FIELDS,
                polar: POLAR_FONT_FIELDS
            };
        viz.charts = viz.charts || {};
        viz.charts.ThemeManager = viz.core.BaseThemeManager.inherit(function() {
            var ctor = function(options, themeGroupName) {
                    var that = this,
                        themeObj;
                    that.callBase.apply(that, arguments);
                    options = options || {};
                    that._userOptions = options;
                    that._mergeAxisTitleOptions = [];
                    that._themeSection = themeGroupName;
                    that._fontFields = chartToFontFieldsMap[themeGroupName];
                    that._IE8 = DX.browser.msie && DX.browser.version < 9;
                    themeObj = options.theme && _findTheme(_isString(options.theme) ? options.theme : options.theme.name) || {};
                    that.palette = new Palette(options.palette, {
                        stepHighlight: HIGHLIGHTING_STEP,
                        theme: themeObj.name
                    });
                    that._callback = $.noop
                };
            var dispose = function() {
                    var that = this;
                    that.palette.dispose();
                    that.palette = that._userOptions = that._mergedSettings = null;
                    return that.callBase.apply(that, arguments)
                };
            var resetPalette = function() {
                    this.palette.reset()
                };
            var updatePalette = function(palette) {
                    this.palette = new Palette(palette || this._theme.defaultPalette, {
                        stepHighlight: HIGHLIGHTING_STEP,
                        theme: this.themeName
                    })
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
                    title: function(name) {
                        var userOptions = processTitleOptions(this._userOptions[name]);
                        return mergeOptions.call(this, name, userOptions)
                    },
                    series: function(name, userOptions) {
                        var theme = this._theme,
                            userCommonSettings = this._userOptions.commonSeriesSettings || {},
                            themeCommonSettings = theme.commonSeriesSettings,
                            type = ((userOptions.type || userCommonSettings.type || themeCommonSettings.type) + "").toLowerCase(),
                            settings,
                            palette = this.palette,
                            isBar = ~type.indexOf("bar"),
                            isLine = ~type.indexOf("line"),
                            isArea = ~type.indexOf("area"),
                            isBubble = type === "bubble",
                            mainSeriesColor,
                            resolveLabelsOverlapping = this.getOptions("resolveLabelsOverlapping"),
                            resolveLabelOverlapping = this.getOptions("resolveLabelOverlapping"),
                            containerBackgroundColor = this.getOptions("containerBackgroundColor"),
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
                        settings.widgetType = this._themeSection.split(".").slice(-1)[0];
                        settings.containerBackgroundColor = containerBackgroundColor;
                        if (settings.widgetType !== "pie")
                            mainSeriesColor = settings.color || palette.getNextColor();
                        else
                            mainSeriesColor = function() {
                                return palette.getNextColor()
                            };
                        settings.mainSeriesColor = mainSeriesColor;
                        settings._IE8 = this._IE8;
                        settings.resolveLabelOverlapping = resolveLabelOverlapping;
                        settings.resolveLabelsOverlapping = resolveLabelsOverlapping;
                        if (settings.label && (isLine || isArea && type !== "rangearea" || type === "scatter"))
                            settings.label.position = "outside";
                        return settings
                    },
                    pieSegment: function(name, seriesSettings, segmentSettings) {
                        var settings = $.extend(true, {}, seriesSettings, segmentSettings),
                            mainColor = new DX.Color(settings.color || this.palette.getNextColor());
                        settings.color = mainColor.toHex();
                        settings.border.color = settings.border.color || mainColor.toHex();
                        settings.hoverStyle.color = settings.hoverStyle.color || this._IE8 && mainColor.highlight(HOVER_COLOR_HIGHLIGHTING) || mainColor.toHex();
                        settings.hoverStyle.border.color = settings.hoverStyle.border.color || mainColor.toHex();
                        settings.selectionStyle.color = settings.selectionStyle.color || this._IE8 && mainColor.highlight(HOVER_COLOR_HIGHLIGHTING) || mainColor.toHex();
                        settings.selectionStyle.border.color = settings.selectionStyle.border.color || mainColor.toHex();
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
                    resetOptions: function(name) {
                        this._mergedSettings[name] = null
                    },
                    update: function(options) {
                        this._userOptions = options
                    },
                    updatePalette: updatePalette
                }
        }())
    })(jQuery, DevExpress);
    /*! Module viz-core, file factory.js */
    (function($, DX) {
        var viz = DX.viz,
            charts = viz.charts,
            series = charts.series;
        charts.factory = function() {
            var createSeriesFamily = function(options) {
                    return new series.SeriesFamily(options)
                };
            var createThemeManager = function(options, groupName) {
                    return new charts.ThemeManager(options, groupName)
                };
            var createTracker = function(options, name) {
                    return name === "dxPieChart" ? new charts.PieTracker(options) : new charts.ChartTracker(options)
                };
            var createTitle = function(renderer, options, group) {
                    return new charts.ChartTitle(renderer, options, group)
                };
            var createChartLayoutManager = function(options) {
                    return new charts.LayoutManager(options)
                };
            var createCrosshair = function(renderer, options, params, group) {
                    return new charts.Crosshair(renderer, options, params, group)
                };
            return {
                    createSeriesFamily: createSeriesFamily,
                    createThemeManager: createThemeManager,
                    createTracker: createTracker,
                    createChartLayoutManager: createChartLayoutManager,
                    createTitle: createTitle,
                    createCrosshair: createCrosshair,
                    createScrollBar: function(renderer, group) {
                        return new DevExpress.viz.charts.ScrollBar(renderer, group)
                    }
                }
        }()
    })(jQuery, DevExpress);
    /*! Module viz-core, file baseWidget.js */
    (function(DX, $, undefined) {
        var core = DX.viz.core,
            _windowResizeCallbacks = DX.utils.windowResizeCallbacks,
            _Number = Number,
            _stringFormat = DX.utils.stringFormat,
            _isFunction = DX.utils.isFunction,
            _parseScalar = core.utils.parseScalar,
            OPTION_RTL_ENABLED = "rtlEnabled",
            OPTION_LOADING_INDICATOR = "loadingIndicator",
            INCIDENTOCCURED = "incidentOccured";
        function defaultIncidentOccured(options) {
            var args = [options.id];
            args.push.apply(args, options.args || []);
            DX.log.apply(null, args)
        }
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
        core.DEBUG_createResizeHandler = createResizeHandler;
        core.BaseWidget = DX.DOMComponent.inherit({
            _eventsMap: {
                onIncidentOccurred: {
                    name: INCIDENTOCCURED,
                    deprecated: INCIDENTOCCURED,
                    deprecatedContext: $.noop,
                    deprecatedArgs: function(arg) {
                        return [arg.target]
                    }
                },
                onDrawn: {
                    name: 'drawn',
                    deprecated: 'drawn',
                    deprecatedContext: $.noop,
                    deprecatedArgs: function(arg) {
                        return [arg.component]
                    }
                },
                incidentOccured: {newName: 'onIncidentOccurred'},
                drawn: {newName: 'onDrawn'},
                onTooltipShown: {name: 'tooltipShown'},
                onTooltipHidden: {name: 'tooltipHidden'},
                onLoadingIndicatorReady: {name: "loadingIndicatorReady"}
            },
            _setDeprecatedOptions: function() {
                this.callBase.apply(this, arguments);
                $.extend(this._deprecatedOptions, {
                    incidentOccured: {
                        since: '14.2',
                        message: "Use the 'onIncidentOccurred' option instead"
                    },
                    drawn: {
                        since: '14.2',
                        message: "Use the 'onDrawn' option instead"
                    }
                })
            },
            _setDefaultOptions: function() {
                this.callBase.apply(this, arguments);
                this.option({incidentOccured: defaultIncidentOccured})
            },
            _init: function() {
                var that = this;
                that.callBase.apply(that, arguments);
                that._themeManager = that._createThemeManager();
                that._themeManager.setCallback(function() {
                    that._handleThemeOptions()
                });
                that._renderer = new DX.viz.renderers.Renderer({cssClass: that._rootClassPrefix + " " + that._rootClass});
                that._initIncidentOccured();
                that._renderVisibilityChange();
                that._initEventTrigger();
                that._initTooltip();
                that._initCore();
                that._initLoadingIndicator();
                that._setThemeAndRtl();
                that._initSize();
                that._setupResizeHandler();
                that._initialShowLoadingIndicator()
            },
            _initTooltip: function() {
                this._tooltip = new core.Tooltip({
                    cssClass: this._rootClassPrefix + "-tooltip",
                    eventTrigger: this._eventTrigger
                })
            },
            _getAnimationOptions: $.noop,
            _initSize: function() {
                var canvas = null;
                if (this._isContainerVisible()) {
                    canvas = this._calculateCanvas();
                    if (canvas)
                        this._updateSize(canvas, true)
                }
                if (!canvas)
                    this._setHiddenState()
            },
            _setHiddenState: function() {
                var that = this;
                that._clean = that._render = $.noop;
                that._canvas = null;
                that._incidentOccured('W2001', [that.NAME])
            },
            _setVisibleState: function() {
                delete this._clean;
                delete this._render
            },
            _updateSize: function(canvas, isDrawRequired) {
                var that = this;
                that._renderer.resize(canvas.width, canvas.height);
                isDrawRequired && that._renderer.draw(that._$element[0]);
                that._canvas = canvas;
                that._applySize();
                that._updateLoadingIndicatorCanvas()
            },
            _updateCanvasAndResize: function() {
                var that = this,
                    canvas = that._calculateCanvas();
                if (canvas)
                    if (areCanvasesDifferent(canvas, that._canvas) || that.__forceRender) {
                        that._updateSize(canvas);
                        that._resize()
                    }
                return canvas
            },
            render: function() {
                var that = this,
                    canvas,
                    visible = that._isContainerVisible();
                if (that._canvas) {
                    if (visible)
                        canvas = that._updateCanvasAndResize();
                    if (!canvas) {
                        that._clean();
                        that._renderer.clear();
                        that._setHiddenState()
                    }
                }
                else {
                    if (visible) {
                        canvas = that._calculateCanvas();
                        if (canvas) {
                            that._setVisibleState();
                            that._updateSize(canvas, true);
                            that._render()
                        }
                    }
                    if (!canvas)
                        that._setHiddenState()
                }
            },
            _handleResize: function() {
                if (this._canvas)
                    this._updateCanvasAndResize()
            },
            _dispose: function() {
                var that = this;
                that.callBase.apply(that, arguments);
                that._removeResizeHandler();
                that._eventTrigger.dispose();
                that._disposeCore();
                that._disposeLoadingIndicator();
                that._renderer.dispose();
                that._tooltip && that._tooltip.dispose();
                that._themeManager.dispose();
                that._themeManager = that._renderer = that._eventTrigger = that._tooltip = null
            },
            _initEventTrigger: function() {
                var that = this;
                that._eventTrigger = createEventTrigger(that._eventsMap, function(name, deprecatedName) {
                    var data = {callback: that._createActionByOption(name)};
                    that._suppressDeprecatedWarnings();
                    if (that.option(name) === undefined)
                        data.deprecatedCallback = that.option(deprecatedName);
                    that._resumeDeprecatedWarnings();
                    return data
                })
            },
            _isContainerVisible: function() {
                return this._$element.is(':visible')
            },
            _calculateCanvas: function() {
                var that = this,
                    size = that.option('size') || {},
                    margin = that.option('margin') || {},
                    defaultCanvas = that._getDefaultSize() || {},
                    canvas = {};
                if (size.width <= 0 || size.height <= 0)
                    canvas = null;
                else {
                    canvas.width = size.width > 0 ? _Number(size.width) : that._$element.width() || defaultCanvas.width;
                    canvas.height = size.height > 0 ? _Number(size.height) : that._$element.height() || defaultCanvas.height;
                    canvas.left = margin.left > 0 ? _Number(margin.left) : defaultCanvas.left || 0;
                    canvas.top = margin.top > 0 ? _Number(margin.top) : defaultCanvas.top || 0;
                    canvas.right = margin.right > 0 ? _Number(margin.right) : defaultCanvas.right || 0;
                    canvas.bottom = margin.bottom > 0 ? _Number(margin.bottom) : defaultCanvas.bottom || 0;
                    canvas = canvas.width - canvas.left - canvas.right > 0 && canvas.height - canvas.top - canvas.bottom > 0 ? canvas : null
                }
                return canvas
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
                        that._handleResize()
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
            _optionChanged: function(args) {
                var that = this;
                if (!that._eventTrigger.update(args.name))
                    switch (args.name) {
                        case'size':
                        case'margin':
                            that.render();
                            break;
                        case'redrawOnResize':
                            that._setupResizeHandler();
                            break;
                        case OPTION_LOADING_INDICATOR:
                            that._handleLoadingIndicatorOptionChanged();
                            break;
                        case"theme":
                        case OPTION_RTL_ENABLED:
                            that._setThemeAndRtl();
                            break;
                        case"encodeHtml":
                        case"pathModified":
                            that._handleThemeOptions();
                            break;
                        case"tooltip":
                            that._setTooltipOptions();
                            break;
                        default:
                            that._invalidate();
                            that.callBase.apply(that, arguments)
                    }
            },
            _handleThemeOptions: function() {
                var that = this,
                    options = {
                        rtl: that.option(OPTION_RTL_ENABLED),
                        encodeHtml: that.option("encodeHtml"),
                        pathModified: that.option("pathModified"),
                        animation: that._getAnimationOptions()
                    };
                that._renderer.setOptions(options);
                that._setTooltipRendererOptions(options);
                that._setTooltipOptions();
                that._updateLoadingIndicatorOptions();
                that._handleThemeOptionsCore()
            },
            _handleThemeOptionsCore: function() {
                this._initialized && this._refresh()
            },
            _visibilityChanged: function() {
                this.render()
            },
            _initIncidentOccured: function() {
                var that = this;
                that._incidentOccured = function(errorOrWarningId, options) {
                    that._eventTrigger(INCIDENTOCCURED, {target: {
                            id: errorOrWarningId,
                            type: errorOrWarningId[0] === 'E' ? 'error' : 'warning',
                            args: options,
                            text: _stringFormat.apply(null, [DX.ERROR_MESSAGES[errorOrWarningId]].concat(options ? options.slice(0) : [])),
                            widget: that.NAME,
                            version: DX.VERSION
                        }})
                }
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
            _initLoadingIndicator: function() {
                this._loadIndicator = new core.LoadIndicator({
                    eventTrigger: this._eventTrigger,
                    renderer: this._renderer
                })
            },
            _initialShowLoadingIndicator: function() {
                var loadingIndicator = this._loadIndicator;
                if (loadingIndicator && this._getOption(OPTION_LOADING_INDICATOR).show) {
                    this.showLoadingIndicator();
                    loadingIndicator.forceShow()
                }
            },
            _handleLoadingIndicatorOptionChanged: function() {
                var that = this;
                if (!that._skipOptionChanged) {
                    that._updateLoadingIndicatorOptions();
                    if (that._getOption(OPTION_LOADING_INDICATOR).show)
                        that.showLoadingIndicator();
                    else
                        that.hideLoadingIndicator()
                }
            },
            _updateLoadingIndicatorCanvas: function() {
                this._loadIndicator.applyCanvas(this._canvas)
            },
            _updateLoadingIndicatorOptions: function() {
                this._loadIndicator.applyOptions(this._getOption(OPTION_LOADING_INDICATOR))
            },
            _endLoading: function(complete) {
                this._resetIsReady();
                this._loadIndicator.endLoading(complete)
            },
            _repairLoadIndicator: function() {
                this._loadIndicator.append()
            },
            _disposeLoadingIndicator: function() {
                this._loadIndicator.dispose();
                this._loadIndicator = null
            },
            _scheduleLoadingIndicatorHiding: function() {
                this._loadIndicator.scheduleHiding()
            },
            _fulfillLoadingIndicatorHiding: function() {
                this._loadIndicator.fulfillHiding() && this._toggleLoadingIndicatorState(false)
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
            _checkLoadingIndicatorHiding: function(bool) {
                this._repairLoadIndicator();
                if (bool)
                    this._fulfillLoadingIndicatorHiding()
            },
            _refresh: function() {
                var that = this,
                    callBase = that.callBase;
                that._endLoading(function() {
                    callBase.call(that)
                })
            },
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
            _toggleLoadingIndicatorState: function(state) {
                if (Boolean(this._getOption(OPTION_LOADING_INDICATOR).show) !== state) {
                    this._skipOptionChanged = true;
                    this.option(OPTION_LOADING_INDICATOR, {show: state});
                    this._skipOptionChanged = false
                }
            },
            _handleLoadingIndicatorShown: function() {
                this._tooltip.hide()
            },
            showLoadingIndicator: function() {
                this._toggleLoadingIndicatorState(true);
                this._loadIndicator.show();
                this._handleLoadingIndicatorShown()
            },
            hideLoadingIndicator: function() {
                this._toggleLoadingIndicatorState(false);
                this._loadIndicator.hide()
            },
            svg: function() {
                return this._normalizeHtml(this._renderer.svg())
            },
            isReady: getFalse
        });
        function createEventTrigger(eventsMap, callbackGetter) {
            var triggers = {};
            $.each(eventsMap, function(name, info) {
                if (info.name)
                    createItem(name)
            });
            trigger.update = function(name) {
                var eventInfo = eventsMap[name];
                if (eventInfo)
                    createItem(eventInfo.newName || name);
                return !!eventInfo
            };
            trigger.dispose = function() {
                eventsMap = callbackGetter = triggers = null
            };
            return trigger;
            function trigger(eventName, arg, complete) {
                triggers[eventName](arg, complete)
            }
            function createItem(name) {
                var eventInfo = eventsMap[name],
                    data = callbackGetter(name, eventInfo.deprecated);
                triggers[eventInfo.name] = createCallback(data.callback, _isFunction(data.deprecatedCallback) && data.deprecatedCallback, eventInfo.deprecatedContext, eventInfo.deprecatedArgs)
            }
            function createCallback(callback, deprectatedCallback, deprecatedContext, deprecatedArgs) {
                return function(arg, complete) {
                        callback(arg);
                        deprectatedCallback && deprectatedCallback.apply(deprecatedContext(arg), deprecatedArgs(arg));
                        complete && complete()
                    }
            }
        }
        core.DEBUG_createEventTrigger = createEventTrigger
    })(DevExpress, jQuery);
    /*! Module viz-core, file CoreFactory.js */
    (function(DX, undefined) {
        var viz = DX.viz,
            core = viz.core,
            seriesNS = core.series;
        core.CoreFactory = {
            createSeries: function(renderSettings, options) {
                return new seriesNS.Series(renderSettings, options)
            },
            createPoint: function(series, data, options) {
                return new seriesNS.points.Point(series, data, options)
            },
            createLabel: function() {
                return new core.series.points.Label
            },
            createTranslator1D: function(fromValue, toValue, fromAngle, toAngle) {
                return (new core.Translator1D).setDomain(fromValue, toValue).setCodomain(fromAngle, toAngle)
            },
            createTranslator2D: function(range, canvas, options) {
                return new core.Translator2D(range, canvas, options)
            },
            createTickManager: function(types, data, options) {
                return new core.tickManager.TickManager(types, data, options)
            },
            createLegend: function(settings) {
                return new core.Legend(settings)
            },
            createSeriesFamily: function(options) {
                return new seriesNS.helpers.SeriesFamily(options)
            },
            createDataValidator: function(data, groups, incidentOccured, dataPrepareOptions) {
                return new core.DataValidator(data, groups, incidentOccured, dataPrepareOptions)
            }
        }
    })(DevExpress);
    DevExpress.MOD_VIZ_CORE = true
}