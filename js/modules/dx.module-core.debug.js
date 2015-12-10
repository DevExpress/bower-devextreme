/*! 
* DevExtreme (Core Library)
* Version: 15.2.4
* Build date: Dec 8, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!window.DevExpress || !DevExpress.MOD_CORE) {
    /*! Module core, file modules.js */
    (function(global, $) {
        global.DevExpress = global.DevExpress || {};
        var ModuleDefinitions = function(DevExpress) {
                var DeferModule = function() {
                        var loadedModules = {};
                        return function(name) {
                                var __definition = null;
                                this.define = function(definition) {
                                    if (__definition)
                                        throw"'" + name + "' module definition is already present";
                                    __definition = definition
                                };
                                this.load = function() {
                                    loadedModules[name] = loadedModules[name] || __definition();
                                    return loadedModules[name]
                                }
                            }
                    }();
                var deferModules = {};
                var requireSingle = function(name) {
                        var module = deferModules[name];
                        if (!module)
                            throw"'" + name + "' module definition is absent";
                        return module.load()
                    };
                var mapDependencies = function(dependencies) {
                        return $.map(dependencies, function(name) {
                                switch (name) {
                                    case"jquery":
                                    case"domReady":
                                        return jQuery;
                                    case"domReady!":
                                        return name;
                                    case"require":
                                        return require;
                                    default:
                                        return requireSingle(name)
                                }
                            })
                    };
                var require = function(dependencies, callback) {
                        if (!$.isArray(dependencies))
                            return requireSingle(dependencies);
                        if (DevExpress.preserveRequire)
                            return;
                        dependencies = mapDependencies(dependencies);
                        callback = callback || $.noop;
                        var exec = function() {
                                callback.apply(global, dependencies)
                            };
                        $.inArray("domReady!", dependencies) ? $(exec) : exec()
                    };
                var define = function(name, dependencies, definition) {
                        deferModules[name] = deferModules[name] || new DeferModule(name);
                        deferModules[name].define(function() {
                            return definition.apply(global, mapDependencies(dependencies))
                        })
                    };
                return {
                        require: require,
                        define: define
                    }
            }(global.DevExpress);
        global.DevExpress.require = ModuleDefinitions.require;
        global.DevExpress.define = ModuleDefinitions.define
    })(this, jQuery);
    /*! Module core, file utils.animationFrame.js */
    DevExpress.define("/utils/utils.animationFrame", ["jquery"], function($) {
        var FRAME_ANIMATION_STEP_TIME = 1000 / 60,
            requestAnimationFrame = function(callback) {
                return this.setTimeout(callback, FRAME_ANIMATION_STEP_TIME)
            },
            cancelAnimationFrame = function(requestID) {
                this.clearTimeout(requestID)
            },
            nativeRequestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame,
            nativeCancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame;
        if (nativeRequestAnimationFrame && nativeCancelAnimationFrame) {
            requestAnimationFrame = nativeRequestAnimationFrame;
            cancelAnimationFrame = nativeCancelAnimationFrame
        }
        if (nativeRequestAnimationFrame && !nativeCancelAnimationFrame) {
            var cancelledRequests = {};
            requestAnimationFrame = function(callback) {
                var requestId = nativeRequestAnimationFrame.call(window, function() {
                        try {
                            if (requestId in cancelledRequests)
                                return;
                            callback.apply(this, arguments)
                        }
                        finally {
                            delete cancelledRequests[requestId]
                        }
                    });
                return requestId
            };
            cancelAnimationFrame = function(requestId) {
                cancelledRequests[requestId] = true
            }
        }
        requestAnimationFrame = $.proxy(requestAnimationFrame, window);
        cancelAnimationFrame = $.proxy(cancelAnimationFrame, window);
        return {
                request: requestAnimationFrame,
                cancel: cancelAnimationFrame
            }
    });
    /*! Module core, file utils.array.js */
    DevExpress.define("/utils/utils.array", ["jquery", "/utils/utils.common", "/utils/utils.object"], function($, commonUtils, objectUtils) {
        var isEmpty = function(entity) {
                return $.isArray(entity) && !entity.length
            };
        var wrapToArray = function(entity) {
                return $.isArray(entity) ? entity : [entity]
            };
        var intersection = function(a, b) {
                if (!$.isArray(a) || a.length === 0 || !$.isArray(b) || b.length === 0)
                    return [];
                var result = [];
                $.each(a, function(_, value) {
                    var index = $.inArray(value, b);
                    if (index !== -1)
                        result.push(value)
                });
                return result
            };
        var removeDublicates = function(from, what) {
                if (!$.isArray(from) || from.length === 0)
                    return [];
                if (!$.isArray(what) || what.length === 0)
                    return from.slice();
                var result = [];
                $.each(from, function(_, value) {
                    var index = $.inArray(value, what);
                    if (index === -1)
                        result.push(value)
                });
                return result
            };
        var normalizeIndexes = function(items, indexParameterName, currentItem, needIndexCallback) {
                var indexedItems = {},
                    parameterIndex = 0;
                $.each(items, function(index, item) {
                    index = item[indexParameterName];
                    if (commonUtils.isDefined(index)) {
                        indexedItems[index] = indexedItems[index] || [];
                        if (item === currentItem)
                            indexedItems[index].unshift(item);
                        else
                            indexedItems[index].push(item);
                        delete item[indexParameterName]
                    }
                });
                objectUtils.orderEach(indexedItems, function(index, items) {
                    $.each(items, function() {
                        if (index >= 0)
                            this[indexParameterName] = parameterIndex++
                    })
                });
                $.each(items, function() {
                    if (!commonUtils.isDefined(this[indexParameterName]) && (!needIndexCallback || needIndexCallback(this)))
                        this[indexParameterName] = parameterIndex++
                });
                return parameterIndex
            };
        return {
                isEmpty: isEmpty,
                wrapToArray: wrapToArray,
                intersection: intersection,
                removeDublicates: removeDublicates,
                normalizeIndexes: normalizeIndexes
            }
    });
    /*! Module core, file utils.browser.js */
    DevExpress.define("/utils/utils.browser", ["jquery"], function($) {
        var webkitRegExp = /(webkit)[ \/]([\w.]+)/,
            ieRegExp = /(msie) (\d{1,2}\.\d)/,
            ie11RegExp = /(trident).*rv:(\d{1,2}\.\d)/,
            msEdge = /(edge)\/((\d+)?[\w\.]+)/,
            mozillaRegExp = /(mozilla)(?:.*? rv:([\w.]+))/;
        var browserFromUA = function(ua) {
                ua = ua.toLowerCase();
                var result = {},
                    matches = ieRegExp.exec(ua) || ie11RegExp.exec(ua) || msEdge.exec(ua) || ua.indexOf("compatible") < 0 && mozillaRegExp.exec(ua) || webkitRegExp.exec(ua) || [],
                    browserName = matches[1],
                    browserVersion = matches[2];
                if (browserName === "trident" || browserName === "edge")
                    browserName = "msie";
                if (browserName) {
                    result[browserName] = true;
                    result.version = browserVersion
                }
                return result
            };
        return $.extend({_fromUA: browserFromUA}, browserFromUA(navigator.userAgent))
    });
    /*! Module core, file utils.caret.js */
    DevExpress.define("/utils/utils.caret", ["jquery", "/utils/utils.common"], function($, commonUtils) {
        var getCaret = function(input) {
                if (isObsoleteBrowser(input))
                    return getCaretForObsoleteBrowser(input);
                return {
                        start: input.selectionStart,
                        end: input.selectionEnd
                    }
            };
        var setCaret = function(input, position) {
                if (isObsoleteBrowser(input)) {
                    setCaretForObsoleteBrowser(input, position);
                    return
                }
                if (!$.contains(document, input))
                    return;
                input.selectionStart = position.start;
                input.selectionEnd = position.end
            };
        var isObsoleteBrowser = function(input) {
                return !input.setSelectionRange
            };
        var getCaretForObsoleteBrowser = function(input) {
                var range = document.selection.createRange();
                var rangeCopy = range.duplicate();
                range.move('character', -input.value.length);
                range.setEndPoint('EndToStart', rangeCopy);
                return {
                        start: range.text.length,
                        end: range.text.length + rangeCopy.text.length
                    }
            };
        var setCaretForObsoleteBrowser = function(input, position) {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveStart("character", position.start);
                range.moveEnd("character", position.end - position.start);
                range.select()
            };
        var caret = function(input, position) {
                input = $(input).get(0);
                if (!commonUtils.isDefined(position))
                    return getCaret(input);
                setCaret(input, position)
            };
        return caret
    });
    /*! Module core, file utils.common.js */
    DevExpress.define("/utils/utils.common", ["jquery"], function($) {
        var isDefined = function(object) {
                return object !== null && object !== undefined
            };
        var isString = function(object) {
                return $.type(object) === 'string'
            };
        var isNumber = function(object) {
                return typeof object === "number" && isFinite(object) || $.isNumeric(object)
            };
        var isObject = function(object) {
                return $.type(object) === 'object'
            };
        var isArray = function(object) {
                return $.type(object) === 'array'
            };
        var isDate = function(object) {
                return $.type(object) === 'date'
            };
        var isFunction = function(object) {
                return $.type(object) === 'function'
            };
        var isPrimitive = function(value) {
                return $.inArray($.type(value), ["object", "array", "function"]) === -1
            };
        var isExponential = function(value) {
                return isNumber(value) && value.toString().indexOf('e') !== -1
            };
        var ensureDefined = function(value, defaultValue) {
                return isDefined(value) ? value : defaultValue
            };
        var getDefaultAlignment = function(isRtlEnabled) {
                var rtlEnabled = isRtlEnabled || DevExpress.rtlEnabled;
                return rtlEnabled ? "right" : "left"
            };
        var executeAsync = function(action, context) {
                var deferred = $.Deferred(),
                    normalizedContext = context || this,
                    timerId,
                    task = {
                        promise: deferred.promise(),
                        abort: function() {
                            clearTimeout(timerId);
                            deferred.rejectWith(normalizedContext)
                        }
                    },
                    callback = function() {
                        var result = action.call(normalizedContext);
                        if (result && result.done && $.isFunction(result.done))
                            result.done(function() {
                                deferred.resolveWith(normalizedContext)
                            });
                        else
                            deferred.resolveWith(normalizedContext)
                    };
                timerId = (arguments[2] || setTimeout)(callback, 0);
                return task
            };
        var findBestMatches = function(targetFilter, items, mapFn) {
                var bestMatches = [],
                    maxMatchCount = 0;
                $.each(items, function(index, itemSrc) {
                    var matchCount = 0,
                        item = mapFn ? mapFn(itemSrc) : itemSrc;
                    $.each(targetFilter, function(paramName) {
                        var value = item[paramName];
                        if (value === undefined)
                            return;
                        if (value === targetFilter[paramName]) {
                            matchCount++;
                            return
                        }
                        matchCount = -1;
                        return false
                    });
                    if (matchCount < maxMatchCount)
                        return;
                    if (matchCount > maxMatchCount) {
                        bestMatches.length = 0;
                        maxMatchCount = matchCount
                    }
                    bestMatches.push(itemSrc)
                });
                return bestMatches
            };
        var splitPair = function(raw) {
                switch (typeof raw) {
                    case"string":
                        return raw.split(/\s+/, 2);
                    case"object":
                        return [raw.x || raw.h, raw.y || raw.v];
                    case"number":
                        return [raw];
                    default:
                        return raw
                }
            };
        var splitQuad = function(raw) {
                switch (typeof raw) {
                    case"string":
                        return raw.split(/\s+/, 4);
                    case"object":
                        return [raw.x || raw.h || raw.left, raw.y || raw.v || raw.top, raw.x || raw.h || raw.right, raw.y || raw.v || raw.bottom];
                    case"number":
                        return [raw];
                    default:
                        return raw
                }
            };
        return {
                isDefined: isDefined,
                isString: isString,
                isNumber: isNumber,
                isObject: isObject,
                isArray: isArray,
                isDate: isDate,
                isFunction: isFunction,
                isPrimitive: isPrimitive,
                isExponential: isExponential,
                ensureDefined: ensureDefined,
                executeAsync: executeAsync,
                splitPair: splitPair,
                splitQuad: splitQuad,
                findBestMatches: findBestMatches,
                getDefaultAlignment: getDefaultAlignment
            }
    });
    /*! Module core, file utils.console.js */
    DevExpress.define("/utils/utils.console", ["jquery"], function($) {
        var logger = function() {
                var console = window.console;
                function info(text) {
                    if (!console || !$.isFunction(console.info))
                        return;
                    console.info(text)
                }
                function warn(text) {
                    if (!console || !$.isFunction(console.warn))
                        return;
                    console.warn(text)
                }
                function error(text) {
                    if (!console || !$.isFunction(console.error))
                        return;
                    console.error(text)
                }
                return {
                        info: info,
                        warn: warn,
                        error: error
                    }
            }();
        var debug = function() {
                function assert(condition, message) {
                    if (!condition)
                        throw new Error(message);
                }
                function assertParam(parameter, message) {
                    assert(parameter !== null && parameter !== undefined, message)
                }
                return {
                        assert: assert,
                        assertParam: assertParam
                    }
            }();
        return {
                logger: logger,
                debug: debug
            }
    });
    /*! Module core, file utils.date.js */
    DevExpress.define("/utils/utils.date", ["jquery", "/utils/utils.common", "/utils/utils.inflector"], function($, commonUtils, inflector) {
        var isObject = commonUtils.isObject,
            isString = commonUtils.isString,
            isDate = commonUtils.isDate,
            isDefined = commonUtils.isDefined,
            camelize = inflector.camelize;
        var dateUnitIntervals = ['millisecond', 'second', 'minute', 'hour', 'day', 'week', 'month', 'quarter', 'year'];
        var addSubValues = function(value1, value2, isSub) {
                return value1 + (isSub ? -1 : 1) * value2
            };
        var toMilliseconds = function(value) {
                switch (value) {
                    case'millisecond':
                        return 1;
                    case'second':
                        return toMilliseconds('millisecond') * 1000;
                    case'minute':
                        return toMilliseconds('second') * 60;
                    case'hour':
                        return toMilliseconds('minute') * 60;
                    case'day':
                        return toMilliseconds('hour') * 24;
                    case'week':
                        return toMilliseconds('day') * 7;
                    case'month':
                        return toMilliseconds('day') * 30;
                    case'quarter':
                        return toMilliseconds('month') * 3;
                    case'year':
                        return toMilliseconds('day') * 365;
                    default:
                        return 0
                }
            };
        var getDatesInterval = function(startDate, endDate, intervalUnit) {
                var delta = endDate.getTime() - startDate.getTime(),
                    millisecondCount = toMilliseconds(intervalUnit) || 1;
                return Math.floor(delta / millisecondCount)
            };
        var convertMillisecondsToDateUnits = function(value) {
                var i,
                    dateUnitCount,
                    dateUnitInterval,
                    dateUnitIntervals = ['millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year'],
                    result = {};
                for (i = dateUnitIntervals.length - 1; i >= 0; i--) {
                    dateUnitInterval = dateUnitIntervals[i];
                    dateUnitCount = Math.floor(value / toMilliseconds(dateUnitInterval));
                    if (dateUnitCount > 0) {
                        result[dateUnitInterval + 's'] = dateUnitCount;
                        value -= convertDateUnitToMilliseconds(dateUnitInterval, dateUnitCount)
                    }
                }
                return result
            };
        var dateToMilliseconds = function(tickInterval) {
                var milliseconds = 0;
                if (isObject(tickInterval))
                    $.each(tickInterval, function(key, value) {
                        milliseconds += convertDateUnitToMilliseconds(key.substr(0, key.length - 1), value)
                    });
                if (isString(tickInterval))
                    milliseconds = convertDateUnitToMilliseconds(tickInterval, 1);
                return milliseconds
            };
        var convertDateUnitToMilliseconds = function(dateUnit, count) {
                return toMilliseconds(dateUnit) * count
            };
        var getDateUnitInterval = function(tickInterval) {
                var maxInterval = -1,
                    i;
                if (isString(tickInterval))
                    return tickInterval;
                if (isObject(tickInterval)) {
                    $.each(tickInterval, function(key, value) {
                        for (i = 0; i < dateUnitIntervals.length; i++)
                            if (value && (key === dateUnitIntervals[i] + 's' || key === dateUnitIntervals[i]) && maxInterval < i)
                                maxInterval = i
                    });
                    return dateUnitIntervals[maxInterval]
                }
                return ''
            };
        var getQuarter = function(month) {
                return Math.floor(month / 3)
            };
        var getFirstQuarterMonth = function(month) {
                return getQuarter(month) * 3
            };
        var correctDateWithUnitBeginning = function(date, dateInterval, withCorrection) {
                var oldDate = new Date(date.getTime()),
                    dayMonth,
                    firstQuarterMonth,
                    dateUnitInterval = getDateUnitInterval(dateInterval);
                switch (dateUnitInterval) {
                    case'second':
                        date.setMilliseconds(0);
                        break;
                    case'minute':
                        date.setSeconds(0, 0);
                        break;
                    case'hour':
                        date.setMinutes(0, 0, 0);
                        break;
                    case'year':
                        date.setMonth(0);
                    case'month':
                        date.setDate(1);
                    case'day':
                        date.setHours(0, 0, 0, 0);
                        break;
                    case'week':
                        dayMonth = date.getDate();
                        if (date.getDay() !== 0)
                            dayMonth += 7 - date.getDay();
                        date.setDate(dayMonth);
                        date.setHours(0, 0, 0, 0);
                        break;
                    case'quarter':
                        firstQuarterMonth = getFirstQuarterMonth(date.getMonth());
                        if (date.getMonth() !== firstQuarterMonth)
                            date.setMonth(firstQuarterMonth);
                        date.setDate(1);
                        date.setHours(0, 0, 0, 0);
                        break
                }
                if (withCorrection && dateUnitInterval !== "hour" && dateUnitInterval !== "minute" && dateUnitInterval !== "second")
                    fixTimezoneGap(oldDate, date)
            };
        var getDatesDifferences = function(date1, date2) {
                var differences,
                    counter = 0;
                differences = {
                    year: date1.getFullYear() !== date2.getFullYear(),
                    month: date1.getMonth() !== date2.getMonth(),
                    day: date1.getDate() !== date2.getDate(),
                    hour: date1.getHours() !== date2.getHours(),
                    minute: date1.getMinutes() !== date2.getMinutes(),
                    second: date1.getSeconds() !== date2.getSeconds()
                };
                $.each(differences, function(key, value) {
                    if (value)
                        counter++
                });
                differences.count = counter;
                return differences
            };
        var addInterval = function(value, interval, isNegative) {
                var result = null,
                    intervalObject;
                if (isDate(value)) {
                    intervalObject = isString(interval) ? getDateIntervalByString(interval.toLowerCase()) : interval;
                    result = new Date(value.getTime());
                    if (intervalObject.years)
                        result.setFullYear(addSubValues(result.getFullYear(), intervalObject.years, isNegative));
                    if (intervalObject.quarters)
                        result.setMonth(addSubValues(result.getMonth(), 3 * intervalObject.quarters, isNegative));
                    if (intervalObject.months)
                        result.setMonth(addSubValues(result.getMonth(), intervalObject.months, isNegative));
                    if (intervalObject.weeks)
                        result.setDate(addSubValues(result.getDate(), 7 * intervalObject.weeks, isNegative));
                    if (intervalObject.days)
                        result.setDate(addSubValues(result.getDate(), intervalObject.days, isNegative));
                    if (intervalObject.hours)
                        result.setHours(addSubValues(result.getHours(), intervalObject.hours, isNegative));
                    if (intervalObject.minutes)
                        result.setMinutes(addSubValues(result.getMinutes(), intervalObject.minutes, isNegative));
                    if (intervalObject.seconds)
                        result.setSeconds(addSubValues(result.getSeconds(), intervalObject.seconds, isNegative));
                    if (intervalObject.milliseconds)
                        result.setMilliseconds(addSubValues(value.getMilliseconds(), intervalObject.milliseconds, isNegative))
                }
                else
                    result = addSubValues(value, interval, isNegative);
                return result
            };
        var getViewFirstCellDate = function(viewType, date) {
                if (viewType === "month")
                    return new Date(date.getFullYear(), date.getMonth(), 1);
                if (viewType === "year")
                    return new Date(date.getFullYear(), 0, date.getDate());
                if (viewType === "decade")
                    return new Date(getFirstYearInDecade(date), date.getMonth(), date.getDate());
                if (viewType === "century")
                    return new Date(getFirstDecadeInCentury(date), date.getMonth(), date.getDate())
            };
        var getViewLastCellDate = function(viewType, date) {
                if (viewType === "month")
                    return new Date(date.getFullYear(), date.getMonth(), getLastMonthDay(date));
                if (viewType === "year")
                    return new Date(date.getFullYear(), 11, date.getDate());
                if (viewType === "decade")
                    return new Date(getFirstYearInDecade(date) + 9, date.getMonth(), date.getDate());
                if (viewType === "century")
                    return new Date(getFirstDecadeInCentury(date) + 90, date.getMonth(), date.getDate())
            };
        var getViewMinBoundaryDate = function(viewType, date) {
                var resultDate = new Date(date.getFullYear(), date.getMonth(), 1);
                if (viewType === "month")
                    return resultDate;
                resultDate.setMonth(0);
                if (viewType === "year")
                    return resultDate;
                if (viewType === "decade")
                    resultDate.setFullYear(getFirstYearInDecade(date));
                if (viewType === "century")
                    resultDate.setFullYear(getFirstDecadeInCentury(date));
                return resultDate
            };
        var getViewMaxBoundaryDate = function(viewType, date) {
                var resultDate = new Date(date.getFullYear(), date.getMonth(), getLastMonthDay(date));
                if (viewType === "month")
                    return resultDate;
                resultDate.setMonth(11);
                resultDate.setDate(getLastMonthDay(resultDate));
                if (viewType === "year")
                    return resultDate;
                if (viewType === "decade")
                    resultDate.setFullYear(getFirstYearInDecade(date) + 9);
                if (viewType === "century")
                    resultDate.setFullYear(getFirstDecadeInCentury(date) + 99);
                return resultDate
            };
        var getLastMonthDay = function(date) {
                var resultDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                return resultDate.getDate()
            };
        var sameView = function(view, date1, date2) {
                return dateUtils[camelize("same " + view)](date1, date2)
            };
        var getViewUp = function(typeView) {
                switch (typeView) {
                    case"month":
                        return "year";
                    case"year":
                        return "decade";
                    case"decade":
                        return "century";
                    default:
                        break
                }
            };
        var getViewDown = function(typeView) {
                switch (typeView) {
                    case"century":
                        return "decade";
                    case"decade":
                        return "year";
                    case"year":
                        return "month";
                    default:
                        break
                }
            };
        var getDifferenceInMonth = function(typeView) {
                var difference = 1;
                if (typeView === "year")
                    difference = 12;
                if (typeView === "decade")
                    difference = 12 * 10;
                if (typeView === "century")
                    difference = 12 * 100;
                return difference
            };
        var getDifferenceInMonthForCells = function(typeView) {
                var difference = 1;
                if (typeView === "decade")
                    difference = 12;
                if (typeView === "century")
                    difference = 12 * 10;
                return difference
            };
        var getDateIntervalByString = function(intervalString) {
                var result = {};
                switch (intervalString) {
                    case'year':
                        result.years = 1;
                        break;
                    case'month':
                        result.months = 1;
                        break;
                    case'quarter':
                        result.months = 3;
                        break;
                    case'week':
                        result.days = 7;
                        break;
                    case'day':
                        result.days = 1;
                        break;
                    case'hour':
                        result.hours = 1;
                        break;
                    case'minute':
                        result.minutes = 1;
                        break;
                    case'second':
                        result.seconds = 1;
                        break;
                    case'millisecond':
                        result.milliseconds = 1;
                        break
                }
                return result
            };
        var sameMonthAndYear = function(date1, date2) {
                return date1 && date2 && date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth()
            };
        var sameYear = function(date1, date2) {
                return date1 && date2 && date1.getFullYear() === date2.getFullYear()
            };
        var sameDecade = function(date1, date2) {
                if (!isDefined(date1) || !isDefined(date2))
                    return;
                var startDecadeDate1 = date1.getFullYear() - date1.getFullYear() % 10,
                    startDecadeDate2 = date2.getFullYear() - date2.getFullYear() % 10;
                return date1 && date2 && startDecadeDate1 === startDecadeDate2
            };
        var sameCentury = function(date1, date2) {
                if (!isDefined(date1) || !isDefined(date2))
                    return;
                var startCenturyDate1 = date1.getFullYear() - date1.getFullYear() % 100,
                    startCenturyDate2 = date2.getFullYear() - date2.getFullYear() % 100;
                return date1 && date2 && startCenturyDate1 === startCenturyDate2
            };
        var getFirstDecadeInCentury = function(date) {
                return date && date.getFullYear() - date.getFullYear() % 100
            };
        var getFirstYearInDecade = function(date) {
                return date && date.getFullYear() - date.getFullYear() % 10
            };
        var getShortDate = function(date) {
                return Globalize.format(date, "yyyy/M/d")
            };
        var getFirstMonthDate = function(date) {
                if (!isDefined(date))
                    return;
                var newDate = new Date(date.getFullYear(), date.getMonth(), 1);
                return newDate
            };
        var getLastMonthDate = function(date) {
                if (!isDefined(date))
                    return;
                var newDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                return newDate
            };
        var getFirstWeekDate = function(date, firstDayOfWeek) {
                firstDayOfWeek = firstDayOfWeek || Globalize.culture().calendar.firstDay;
                var delta = (date.getDay() - firstDayOfWeek + 7) % 7;
                var result = new Date(date);
                result.setDate(date.getDate() - delta);
                return result
            };
        var dateInRange = function(date, min, max, format) {
                if (format === "date") {
                    min = min && new Date(min.getFullYear(), min.getMonth(), min.getDate());
                    max = max && new Date(max.getFullYear(), max.getMonth(), max.getDate());
                    date = date && new Date(date.getFullYear(), date.getMonth(), date.getDate())
                }
                return normalizeDate(date, min, max) === date
            };
        var normalizeDate = function(date, min, max) {
                var normalizedDate = date;
                if (!isDefined(date))
                    return date;
                if (isDefined(min) && date < min)
                    normalizedDate = min;
                if (isDefined(max) && date > max)
                    normalizedDate = max;
                return normalizedDate
            };
        var fixTimezoneGap = function(oldDate, newDate) {
                if (!isDefined(oldDate))
                    return;
                var diff = newDate.getHours() - oldDate.getHours(),
                    sign,
                    trial;
                if (diff === 0)
                    return;
                sign = diff === 1 || diff === -23 ? -1 : 1,
                trial = new Date(newDate.getTime() + sign * 3600000);
                if (sign > 0 || trial.getDate() === newDate.getDate())
                    newDate.setTime(trial.getTime())
            };
        var makeDate = function(date) {
                if (!(date instanceof Date))
                    date = new Date(date);
                return date
            };
        var deserializeDate = function(value, serializationFormat) {
                var parsedValue;
                if (!serializationFormat || serializationFormat === "number" || serializationFormat === "yyyy/MM/dd") {
                    parsedValue = serializationFormat === "number" ? value : !isDate(value) && Date.parse(value);
                    return parsedValue ? new Date(parsedValue) : value
                }
                if (value !== undefined)
                    return Globalize.parseDate(value, serializationFormat)
            };
        var serializeDate = function(value, serializationFormat) {
                if (serializationFormat === "number")
                    return value && value.valueOf && value.valueOf();
                if (serializationFormat)
                    return Globalize.format(value, serializationFormat);
                return value
            };
        var dateUtils = {
                dateUnitIntervals: dateUnitIntervals,
                convertMillisecondsToDateUnits: convertMillisecondsToDateUnits,
                dateToMilliseconds: dateToMilliseconds,
                convertDateUnitToMilliseconds: convertDateUnitToMilliseconds,
                getDateUnitInterval: getDateUnitInterval,
                getDatesDifferences: getDatesDifferences,
                correctDateWithUnitBeginning: correctDateWithUnitBeginning,
                addInterval: addInterval,
                getDateIntervalByString: getDateIntervalByString,
                sameMonthAndYear: sameMonthAndYear,
                sameMonth: sameMonthAndYear,
                sameYear: sameYear,
                sameDecade: sameDecade,
                sameCentury: sameCentury,
                sameView: sameView,
                getDifferenceInMonth: getDifferenceInMonth,
                getDifferenceInMonthForCells: getDifferenceInMonthForCells,
                getFirstYearInDecade: getFirstYearInDecade,
                getFirstDecadeInCentury: getFirstDecadeInCentury,
                getShortDate: getShortDate,
                getViewFirstCellDate: getViewFirstCellDate,
                getViewLastCellDate: getViewLastCellDate,
                getViewDown: getViewDown,
                getViewUp: getViewUp,
                getLastMonthDay: getLastMonthDay,
                getLastMonthDate: getLastMonthDate,
                getFirstMonthDate: getFirstMonthDate,
                getFirstWeekDate: getFirstWeekDate,
                getQuarter: getQuarter,
                getFirstQuarterMonth: getFirstQuarterMonth,
                dateInRange: dateInRange,
                normalizeDate: normalizeDate,
                getViewMinBoundaryDate: getViewMinBoundaryDate,
                getViewMaxBoundaryDate: getViewMaxBoundaryDate,
                fixTimezoneGap: fixTimezoneGap,
                makeDate: makeDate,
                deserializeDate: deserializeDate,
                serializeDate: serializeDate,
                getDatesInterval: getDatesInterval
            };
        return dateUtils
    });
    /*! Module core, file utils.dom.js */
    DevExpress.define("/utils/utils.dom", ["jquery", "/errors", "/utils/utils.support", "/utils/utils.window", "/utils/utils.common", "/devices"], function($, errors, support, windowUtils, commonUtils, devices) {
        var resetActiveElement = function() {
                var activeElement = document.activeElement;
                if (activeElement && activeElement !== document.body && activeElement.blur)
                    activeElement.blur()
            };
        var clearSelection = function() {
                if (window.getSelection) {
                    if (window.getSelection().empty)
                        window.getSelection().empty();
                    else if (window.getSelection().removeAllRanges)
                        window.getSelection().removeAllRanges()
                }
                else if (document.selection)
                    document.selection.empty()
            };
        var closestCommonParent = function(startTarget, endTarget) {
                var $startParents = $(startTarget).parents().addBack(),
                    $endParents = $(endTarget).parents().addBack(),
                    startingParent = Math.min($startParents.length, $endParents.length) - 1;
                for (var i = startingParent; i >= 0; i--)
                    if ($startParents.eq(i).is($endParents.eq(i)))
                        return $startParents.get(i)
            };
        var initMobileViewport = function(options) {
                options = $.extend({}, options);
                var realDevice = devices.real();
                var allowZoom = options.allowZoom;
                var allowPan = options.allowPan;
                var allowSelection = "allowSelection" in options ? options.allowSelection : realDevice.platform === "generic";
                var metaSelector = "meta[name=viewport]";
                if (!$(metaSelector).length)
                    $("<meta />").attr("name", "viewport").appendTo("head");
                var metaVerbs = ["width=device-width"],
                    msTouchVerbs = [];
                if (allowZoom)
                    msTouchVerbs.push("pinch-zoom");
                else
                    metaVerbs.push("initial-scale=1.0", "maximum-scale=1.0, user-scalable=no");
                if (allowPan)
                    msTouchVerbs.push("pan-x", "pan-y");
                if (!allowPan && !allowZoom)
                    $("html, body").css({
                        "-ms-content-zooming": "none",
                        "-ms-user-select": "none",
                        overflow: "hidden"
                    });
                else
                    $("html").css("-ms-overflow-style", "-ms-autohiding-scrollbar");
                if (!allowSelection && support.supportProp("user-select"))
                    $(".dx-viewport").css(support.styleProp("user-select"), "none");
                $(metaSelector).attr("content", metaVerbs.join());
                $("html").css("-ms-touch-action", msTouchVerbs.join(" ") || "none");
                if (support.touch)
                    $(document).off(".dxInitMobileViewport").on("dxpointermove.dxInitMobileViewport", function(e) {
                        var count = e.pointers.length,
                            isTouchEvent = e.pointerType === "touch",
                            zoomDisabled = !allowZoom && count > 1,
                            panDisabled = !allowPan && count === 1 && !e.isScrollingEvent;
                        if (isTouchEvent && (zoomDisabled || panDisabled))
                            e.preventDefault()
                    });
                realDevice = devices.real();
                if (realDevice.ios) {
                    var isPhoneGap = document.location.protocol === "file:";
                    if (!isPhoneGap)
                        windowUtils.resizeCallbacks.add(function() {
                            var windowWidth = $(window).width();
                            $("body").width(windowWidth)
                        })
                }
                if (realDevice.android)
                    windowUtils.resizeCallbacks.add(function() {
                        document.activeElement.scrollIntoViewIfNeeded()
                    })
            };
        var triggerVisibilityChangeEvent = function(eventName) {
                var VISIBILITY_CHANGE_SELECTOR = ".dx-visibility-change-handler";
                return function(element) {
                        var $element = $(element || "body");
                        var $changeHandlers = $element.find(VISIBILITY_CHANGE_SELECTOR).add($element.filter(VISIBILITY_CHANGE_SELECTOR));
                        $changeHandlers.each(function() {
                            $(this).triggerHandler(eventName)
                        })
                    }
            };
        var uniqueId = function() {
                var counter = 0;
                return function(prefix) {
                        return (prefix || "") + counter++
                    }
            }();
        var dataOptionsAttributeName = "data-options";
        var getElementOptions = function(element) {
                var optionsString = $(element).attr(dataOptionsAttributeName),
                    result;
                if ($.trim(optionsString).charAt(0) !== "{")
                    optionsString = "{" + optionsString + "}";
                try {
                    result = new Function("return " + optionsString)()
                }
                catch(ex) {
                    throw errors.Error("E3018", ex, optionsString);
                }
                return result
            };
        var createComponents = function(elements, componentTypes) {
                var result = [],
                    selector = "[" + dataOptionsAttributeName + "]";
                elements.find(selector).addBack(selector).each(function(index, element) {
                    var $element = $(element),
                        options = getElementOptions(element);
                    for (var componentName in options)
                        if (!componentTypes || $.inArray(componentName, componentTypes) > -1)
                            if ($element[componentName]) {
                                $element[componentName](options[componentName]);
                                result.push($element[componentName]("instance"))
                            }
                });
                return result
            };
        var createMarkupFromString = function(str) {
                var tempElement = $("<div />");
                if (window.WinJS)
                    WinJS.Utilities.setInnerHTMLUnsafe(tempElement.get(0), str);
                else
                    tempElement.append(str);
                return tempElement.contents()
            };
        var normalizeTemplateElement = function(element) {
                var $element = commonUtils.isDefined(element) && (element.nodeType || element.jquery) ? $(element) : $("<div>").html(element).contents();
                if ($element.length === 1 && $element.is("script"))
                    $element = normalizeTemplateElement(element.html());
                return $element
            };
        var toggleAttr = function($target, attr, value) {
                value ? $target.attr(attr, value) : $target.removeAttr(attr)
            };
        var clipboardText = function(event, text) {
                var clipboard = event.originalEvent && event.originalEvent.clipboardData || window.clipboardData;
                if (arguments.length === 1)
                    return clipboard && clipboard.getData("Text");
                clipboard && clipboard.setData("Text", text)
            };
        return {
                resetActiveElement: resetActiveElement,
                createMarkupFromString: createMarkupFromString,
                triggerShownEvent: triggerVisibilityChangeEvent("dxshown"),
                triggerHidingEvent: triggerVisibilityChangeEvent("dxhiding"),
                triggerResizeEvent: triggerVisibilityChangeEvent("dxresize"),
                initMobileViewport: initMobileViewport,
                getElementOptions: getElementOptions,
                createComponents: createComponents,
                normalizeTemplateElement: normalizeTemplateElement,
                clearSelection: clearSelection,
                uniqueId: uniqueId,
                closestCommonParent: closestCommonParent,
                clipboardText: clipboardText,
                toggleAttr: toggleAttr
            }
    });
    /*! Module core, file utils.error.js */
    DevExpress.define("/utils/utils.error", ["jquery", "/utils/utils.console", "/utils/utils.string", "/version"], function($, consoleUtils, stringUtils, version) {
        var ERROR_URL = "http://js.devexpress.com/error/" + version.split(".").slice(0, 2).join("_") + "/";
        return function(baseErrors, errors) {
                var exports = {
                        ERROR_MESSAGES: $.extend(errors, baseErrors),
                        Error: function() {
                            return makeError($.makeArray(arguments))
                        },
                        log: function(id) {
                            var method = "log";
                            if (/^E\d+$/.test(id))
                                method = "error";
                            else if (/^W\d+$/.test(id))
                                method = "warn";
                            consoleUtils.logger[method](method === "log" ? id : combineMessage($.makeArray(arguments)))
                        }
                    };
                var combineMessage = function(args) {
                        var id = args[0];
                        args = args.slice(1);
                        return formatMessage(id, formatDetails(id, args))
                    };
                var formatDetails = function(id, args) {
                        args = [exports.ERROR_MESSAGES[id]].concat(args);
                        return stringUtils.format.apply(this, args).replace(/\.*\s*?$/, '')
                    };
                var formatMessage = function(id, details) {
                        return stringUtils.format.apply(this, ["{0} - {1}. See:\n{2}", id, details, ERROR_URL + id])
                    };
                var makeError = function(args) {
                        var id,
                            details,
                            message;
                        id = args[0];
                        args = args.slice(1);
                        details = formatDetails(id, args);
                        message = formatMessage(id, details);
                        return $.extend(new Error(message), {
                                __id: id,
                                __details: details
                            })
                    };
                return exports
            }
    });
    /*! Module core, file utils.formatHelper.js */
    DevExpress.define("/utils/utils.formatHelper", ["jquery", "/utils/utils.common", "/utils/utils.string", "/utils/utils.date"], function($, commonUtils, stringUtils, dateUtils) {
        var MAX_LARGE_NUMBER_POWER = 4,
            DECIMAL_BASE = 10;
        var NumericFormat = {
                currency: 'C',
                fixedpoint: 'N',
                exponential: '',
                percent: 'P',
                decimal: 'D'
            };
        var LargeNumberFormatPostfixes = {
                1: 'K',
                2: 'M',
                3: 'B',
                4: 'T'
            };
        var LargeNumberFormatPowers = {
                largenumber: 'auto',
                thousands: 1,
                millions: 2,
                billions: 3,
                trillions: 4
            };
        var DateTimeFormat = {
                longdate: 'D',
                longtime: 'T',
                monthandday: 'M',
                monthandyear: 'Y',
                quarterandyear: 'qq',
                shortdate: 'd',
                shorttime: 't',
                millisecond: 'fff',
                second: 'T',
                minute: 't',
                hour: 't',
                day: 'dd',
                week: 'dd',
                month: 'MMMM',
                quarter: 'qq',
                year: 'yyyy',
                longdatelongtime: 'D',
                shortdateshorttime: 'd',
                shortyear: 'yy'
            };
        var formatHelper = {
                defaultQuarterFormat: 'Q{0}',
                defaultLargeNumberFormatPostfixes: LargeNumberFormatPostfixes,
                defaultDateTimeFormat: DateTimeFormat,
                romanDigits: ['I', 'II', 'III', 'IV'],
                _addFormatSeparator: function(format1, format2) {
                    var separator = ' ';
                    if (format2)
                        return format1 + separator + format2;
                    return format1
                },
                _getDateTimeFormatPattern: function(dateTimeFormat) {
                    return Globalize.findClosestCulture().calendar.patterns[DateTimeFormat[dateTimeFormat.toLowerCase()]]
                },
                _isDateFormatContains: function(format) {
                    return format.toLowerCase() in DateTimeFormat
                },
                _getQuarterString: function(date, format) {
                    var quarter = dateUtils.getQuarter(date.getMonth());
                    switch (format) {
                        case'q':
                            return formatHelper.romanDigits[quarter];
                        case'qq':
                            return stringUtils.format(formatHelper.defaultQuarterFormat, formatHelper.romanDigits[quarter]);
                        case'Q':
                            return (quarter + 1).toString();
                        case'QQ':
                            return stringUtils.format(formatHelper.defaultQuarterFormat, (quarter + 1).toString())
                    }
                    return ''
                },
                _formatCustomString: function(value, format) {
                    var regExp = /qq|q|QQ|Q/g,
                        quarterFormat,
                        result = '',
                        index = 0;
                    regExp.lastIndex = 0;
                    while (index < format.length) {
                        quarterFormat = regExp.exec(format);
                        if (!quarterFormat || quarterFormat.index > index)
                            result += Globalize.format(value, format.substring(index, quarterFormat ? quarterFormat.index : format.length));
                        if (quarterFormat) {
                            result += formatHelper._getQuarterString(value, quarterFormat[0]);
                            index = quarterFormat.index + quarterFormat[0].length
                        }
                        else
                            index = format.length
                    }
                    return result
                },
                _parseNumberFormatString: function(format) {
                    var formatList,
                        formatObject = {};
                    if (!format || typeof format !== 'string')
                        return;
                    formatList = format.toLowerCase().split(' ');
                    $.each(formatList, function(index, value) {
                        if (value in NumericFormat)
                            formatObject.formatType = value;
                        else if (value in LargeNumberFormatPowers)
                            formatObject.power = LargeNumberFormatPowers[value]
                    });
                    if (formatObject.power && !formatObject.formatType)
                        formatObject.formatType = 'fixedpoint';
                    if (formatObject.formatType)
                        return formatObject
                },
                _calculateNumberPower: function(value, base, minPower, maxPower) {
                    var number = Math.abs(value);
                    var power = 0;
                    if (number > 1)
                        while (number && number >= base && (maxPower === undefined || power < maxPower)) {
                            power++;
                            number = number / base
                        }
                    else if (number > 0 && number < 1)
                        while (number < 1 && (minPower === undefined || power > minPower)) {
                            power--;
                            number = number * base
                        }
                    return power
                },
                _getNumberByPower: function(number, power, base) {
                    var result = number;
                    while (power > 0) {
                        result = result / base;
                        power--
                    }
                    while (power < 0) {
                        result = result * base;
                        power++
                    }
                    return result
                },
                _formatNumber: function(value, formatObject, precision) {
                    var powerPostfix;
                    if (formatObject.power === 'auto')
                        formatObject.power = formatHelper._calculateNumberPower(value, 1000, 0, MAX_LARGE_NUMBER_POWER);
                    if (formatObject.power)
                        value = formatHelper._getNumberByPower(value, formatObject.power, 1000);
                    powerPostfix = formatHelper.defaultLargeNumberFormatPostfixes[formatObject.power] || '';
                    return formatHelper._formatNumberCore(value, formatObject.formatType, precision) + powerPostfix
                },
                _formatNumberExponential: function(value, precision) {
                    var power = formatHelper._calculateNumberPower(value, DECIMAL_BASE),
                        number = formatHelper._getNumberByPower(value, power, DECIMAL_BASE),
                        powString;
                    precision = precision === undefined ? 1 : precision;
                    if (number.toFixed(precision || 0) >= DECIMAL_BASE) {
                        power++;
                        number = number / DECIMAL_BASE
                    }
                    powString = (power >= 0 ? '+' : '') + power.toString();
                    return formatHelper._formatNumberCore(number, 'fixedpoint', precision) + 'E' + powString
                },
                _formatNumberCore: function(value, format, precision) {
                    if (format === 'exponential')
                        return formatHelper._formatNumberExponential(value, precision);
                    else
                        return Globalize.format(value, NumericFormat[format] + (commonUtils.isNumber(precision) ? precision : 0))
                },
                _formatDate: function(date, format) {
                    var resultFormat = DateTimeFormat[format.toLowerCase()];
                    format = format.toLowerCase();
                    if (format === 'quarterandyear')
                        resultFormat = formatHelper._getQuarterString(date, resultFormat) + ' yyyy';
                    if (format === 'quarter')
                        return formatHelper._getQuarterString(date, resultFormat);
                    if (format === 'longdatelongtime')
                        return formatHelper._formatDate(date, 'longdate') + ' ' + formatHelper._formatDate(date, 'longtime');
                    if (format === 'shortdateshorttime')
                        return formatHelper._formatDate(date, 'shortDate') + ' ' + formatHelper._formatDate(date, 'shortTime');
                    return Globalize.format(date, resultFormat)
                },
                format: function(value, format, precision) {
                    if ($.isPlainObject(format) && format.format)
                        if (format.dateType)
                            return formatHelper._formatDateEx(value, format);
                        else if (commonUtils.isNumber(value) && isFinite(value))
                            return formatHelper._formatNumberEx(value, format);
                    return formatHelper._format(value, format, precision)
                },
                _format: function(value, format, precision) {
                    var numberFormatObject;
                    if (!commonUtils.isString(format) || format === '' || !commonUtils.isNumber(value) && !commonUtils.isDate(value))
                        return commonUtils.isDefined(value) ? value.toString() : '';
                    numberFormatObject = formatHelper._parseNumberFormatString(format);
                    if (commonUtils.isNumber(value) && numberFormatObject)
                        return formatHelper._formatNumber(value, numberFormatObject, precision);
                    if (commonUtils.isDate(value) && formatHelper._isDateFormatContains(format))
                        return formatHelper._formatDate(value, format);
                    if (!numberFormatObject && !formatHelper._isDateFormatContains(format))
                        return formatHelper._formatCustomString(value, format)
                },
                _formatNumberEx: function(value, formatInfo) {
                    var that = formatHelper,
                        numericFormatType = NumericFormat[formatInfo.format.toLowerCase()],
                        numberFormat = Globalize.culture().numberFormat,
                        currencyFormat = formatInfo.currencyCulture && Globalize.cultures[formatInfo.currencyCulture] ? Globalize.cultures[formatInfo.currencyCulture].numberFormat.currency : numberFormat.currency,
                        percentFormat = numberFormat.percent,
                        formatSettings = that._getUnitFormatSettings(value, formatInfo),
                        unitPower = formatSettings.unitPower,
                        precision = formatSettings.precision,
                        showTrailingZeros = formatSettings.showTrailingZeros,
                        includeGroupSeparator = formatSettings.includeGroupSeparator,
                        groupSymbol = numberFormat[","],
                        floatingSymbol = numberFormat["."],
                        number,
                        isNegative,
                        pattern,
                        currentFormat,
                        regexParts = /n|\$|-|%/g,
                        result = "";
                    if (!commonUtils.isDefined(value))
                        return '';
                    value = formatHelper._getNumberByPower(value, unitPower, 1000);
                    number = Math.abs(value);
                    isNegative = value < 0;
                    switch (numericFormatType) {
                        case NumericFormat.decimal:
                            pattern = "n";
                            number = Math[isNegative ? "ceil" : "floor"](number);
                            if (precision > 0) {
                                var str = "" + number;
                                for (var i = str.length; i < precision; i += 1)
                                    str = "0" + str;
                                number = str
                            }
                            if (isNegative)
                                number = "-" + number;
                            break;
                        case NumericFormat.fixedpoint:
                            currentFormat = numberFormat;
                        case NumericFormat.currency:
                            currentFormat = currentFormat || currencyFormat;
                        case NumericFormat.percent:
                            currentFormat = currentFormat || percentFormat;
                            pattern = isNegative ? currentFormat.pattern[0] : currentFormat.pattern[1] || "n";
                            number = Globalize.format(number * (numericFormatType === NumericFormat.percent ? 100 : 1), "N" + precision);
                            if (!showTrailingZeros)
                                number = that._excludeTrailingZeros(number, floatingSymbol);
                            if (!includeGroupSeparator)
                                number = number.replace(new RegExp('\\' + groupSymbol, 'g'), '');
                            break;
                        case NumericFormat.exponential:
                            return that._formatNumberExponential(value, precision);
                        default:
                            throw"Illegal numeric format: '" + numericFormatType + "'";
                    }
                    for (; ; ) {
                        var lastIndex = regexParts.lastIndex,
                            matches = regexParts.exec(pattern);
                        result += pattern.slice(lastIndex, matches ? matches.index : pattern.length);
                        if (matches)
                            switch (matches[0]) {
                                case"-":
                                    if (/[1-9]/.test(number))
                                        result += numberFormat["-"];
                                    break;
                                case"$":
                                    result += currencyFormat.symbol;
                                    break;
                                case"%":
                                    result += percentFormat.symbol;
                                    break;
                                case"n":
                                    result += number + (unitPower > 0 ? formatHelper.defaultLargeNumberFormatPostfixes[unitPower] : "");
                                    break
                            }
                        else
                            break
                    }
                    return (formatInfo.plus && value > 0 ? "+" : '') + result
                },
                _excludeTrailingZeros: function(strValue, floatingSymbol) {
                    var floatingIndex = strValue.indexOf(floatingSymbol),
                        stopIndex,
                        i;
                    if (floatingIndex < 0)
                        return strValue;
                    stopIndex = strValue.length;
                    for (i = stopIndex - 1; i >= floatingIndex && (strValue[i] === '0' || i === floatingIndex); i--)
                        stopIndex--;
                    return strValue.substring(0, stopIndex)
                },
                _getUnitFormatSettings: function(value, formatInfo) {
                    var unitPower = formatInfo.unitPower || '',
                        precision = formatInfo.precision || 0,
                        includeGroupSeparator = formatInfo.includeGroupSeparator || false,
                        showTrailingZeros = formatInfo.showTrailingZeros === undefined ? true : formatInfo.showTrailingZeros,
                        significantDigits = formatInfo.significantDigits || 1,
                        absValue;
                    if (unitPower.toString().toLowerCase() === 'auto') {
                        showTrailingZeros = false;
                        absValue = Math.abs(value);
                        if (significantDigits < 1)
                            significantDigits = 1;
                        if (absValue >= 1000000000) {
                            unitPower = 3;
                            absValue /= 1000000000
                        }
                        else if (absValue >= 1000000) {
                            unitPower = 2;
                            absValue /= 1000000
                        }
                        else if (absValue >= 1000) {
                            unitPower = 1;
                            absValue /= 1000
                        }
                        else
                            unitPower = 0;
                        if (absValue === 0)
                            precision = 0;
                        else if (absValue < 1) {
                            precision = significantDigits;
                            var smallValue = Math.pow(10, -significantDigits);
                            while (absValue < smallValue) {
                                smallValue /= 10;
                                precision++
                            }
                        }
                        else if (absValue >= 100)
                            precision = significantDigits - 3;
                        else if (absValue >= 10)
                            precision = significantDigits - 2;
                        else
                            precision = significantDigits - 1
                    }
                    if (precision < 0)
                        precision = 0;
                    return {
                            unitPower: unitPower,
                            precision: precision,
                            showTrailingZeros: showTrailingZeros,
                            includeGroupSeparator: includeGroupSeparator
                        }
                },
                _formatDateEx: function(value, formatInfo) {
                    var that = formatHelper,
                        format = formatInfo.format,
                        dateType = formatInfo.dateType,
                        calendar = Globalize.culture().calendars.standard,
                        time,
                        index,
                        dateStr;
                    format = format.toLowerCase();
                    if (!commonUtils.isDefined(value))
                        return '';
                    if (dateType !== 'num' || format === 'dayofweek')
                        switch (format) {
                            case'monthyear':
                                return that._formatDate(value, 'monthandyear');
                            case'quarteryear':
                                return that._getQuarterString(value, 'QQ') + ' ' + value.getFullYear();
                            case'daymonthyear':
                                return that._formatDate(value, dateType + 'Date');
                            case'datehour':
                                time = new Date(value.getTime());
                                time.setMinutes(0);
                                dateStr = dateType === 'timeOnly' ? '' : that._formatDate(value, dateType + 'Date');
                                return dateType === 'timeOnly' ? that._formatDate(time, 'shorttime') : dateStr + ' ' + that._formatDate(time, 'shorttime');
                            case'datehourminute':
                                dateStr = dateType === 'timeOnly' ? '' : that._formatDate(value, dateType + 'Date');
                                return dateType === 'timeOnly' ? that._formatDate(value, 'shorttime') : dateStr + ' ' + that._formatDate(value, 'shorttime');
                            case'datehourminutesecond':
                                dateStr = dateType === 'timeOnly' ? '' : that._formatDate(value, dateType + 'Date');
                                return dateType === 'timeOnly' ? that._formatDate(value, 'longtime') : dateStr + ' ' + that._formatDate(value, 'longtime');
                            case'year':
                                dateStr = value.toString();
                                return dateType === 'abbr' ? dateStr.slice(2, 4) : dateStr;
                            case'dateyear':
                                return dateType === 'abbr' ? that._formatDate(value, 'shortyear') : that._formatDate(value, 'year');
                            case'quarter':
                                return stringUtils.format(that.defaultQuarterFormat, value.toString());
                            case'month':
                                index = value - 1;
                                return dateType === 'abbr' ? calendar.months.namesAbbr[index] : calendar.months.names[index];
                            case'hour':
                                if (dateType === 'long') {
                                    time = new Date;
                                    time.setHours(value);
                                    time.setMinutes(0);
                                    return that._formatDate(time, 'shorttime')
                                }
                                return value.toString();
                            case'dayofweek':
                                index = commonUtils.isString(value) ? $.inArray(value, ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) : value;
                                if (dateType !== 'num')
                                    return dateType === 'abbr' ? calendar.days.namesAbbr[index] : calendar.days.names[index];
                                return ((index - calendar.firstDay + 1 + 7) % 8).toString();
                            default:
                                return value.toString()
                        }
                    else
                        return value.toString()
                },
                getTimeFormat: function(showSecond) {
                    if (showSecond)
                        return formatHelper._getDateTimeFormatPattern('longtime');
                    return formatHelper._getDateTimeFormatPattern('shorttime')
                },
                getDateFormatByDifferences: function(dateDifferences) {
                    var resultFormat = '';
                    if (dateDifferences.millisecond)
                        resultFormat = DateTimeFormat.millisecond;
                    if (dateDifferences.hour || dateDifferences.minute || dateDifferences.second)
                        resultFormat = formatHelper._addFormatSeparator(formatHelper.getTimeFormat(dateDifferences.second), resultFormat);
                    if (dateDifferences.year && dateDifferences.month && dateDifferences.day)
                        return formatHelper._addFormatSeparator(formatHelper._getDateTimeFormatPattern('shortdate'), resultFormat);
                    if (dateDifferences.year && dateDifferences.month)
                        return DateTimeFormat['monthandyear'];
                    if (dateDifferences.year)
                        return DateTimeFormat['year'];
                    if (dateDifferences.month && dateDifferences.day)
                        return formatHelper._addFormatSeparator(formatHelper._getDateTimeFormatPattern('monthandday'), resultFormat);
                    if (dateDifferences.month)
                        return DateTimeFormat['month'];
                    if (dateDifferences.day)
                        return formatHelper._addFormatSeparator('dddd, dd', resultFormat);
                    return resultFormat
                },
                getDateFormatByTicks: function(ticks) {
                    var resultFormat,
                        maxDif,
                        currentDif,
                        i;
                    if (ticks.length > 1) {
                        maxDif = dateUtils.getDatesDifferences(ticks[0], ticks[1]);
                        for (i = 1; i < ticks.length - 1; i++) {
                            currentDif = dateUtils.getDatesDifferences(ticks[i], ticks[i + 1]);
                            if (maxDif.count < currentDif.count)
                                maxDif = currentDif
                        }
                    }
                    else
                        maxDif = {
                            year: true,
                            month: true,
                            day: true,
                            hour: ticks[0].getHours() > 0,
                            minute: ticks[0].getMinutes() > 0,
                            second: ticks[0].getSeconds() > 0
                        };
                    resultFormat = formatHelper.getDateFormatByDifferences(maxDif);
                    return resultFormat
                },
                getDateFormatByTickInterval: function(startValue, endValue, tickInterval) {
                    var resultFormat,
                        dateDifferences,
                        dateUnitInterval,
                        dateDifferencesConverter = {
                            quarter: 'month',
                            week: 'day'
                        },
                        correctDateDifferences = function(dateDifferences, tickInterval, value) {
                            switch (tickInterval) {
                                case'year':
                                    dateDifferences.month = value;
                                case'quarter':
                                case'month':
                                    dateDifferences.day = value;
                                case'week':
                                case'day':
                                    dateDifferences.hour = value;
                                case'hour':
                                    dateDifferences.minute = value;
                                case'minute':
                                    dateDifferences.second = value;
                                case'second':
                                    dateDifferences.millisecond = value
                            }
                        },
                        correctDifferencesByMaxDate = function(differences, minDate, maxDate) {
                            if (!maxDate.getMilliseconds() && maxDate.getSeconds()) {
                                if (maxDate.getSeconds() - minDate.getSeconds() === 1) {
                                    differences.millisecond = true;
                                    differences.second = false
                                }
                            }
                            else if (!maxDate.getSeconds() && maxDate.getMinutes()) {
                                if (maxDate.getMinutes() - minDate.getMinutes() === 1) {
                                    differences.second = true;
                                    differences.minute = false
                                }
                            }
                            else if (!maxDate.getMinutes() && maxDate.getHours()) {
                                if (maxDate.getHours() - minDate.getHours() === 1) {
                                    differences.minute = true;
                                    differences.hour = false
                                }
                            }
                            else if (!maxDate.getHours() && maxDate.getDate() > 1) {
                                if (maxDate.getDate() - minDate.getDate() === 1) {
                                    differences.hour = true;
                                    differences.day = false
                                }
                            }
                            else if (maxDate.getDate() === 1 && maxDate.getMonth()) {
                                if (maxDate.getMonth() - minDate.getMonth() === 1) {
                                    differences.day = true;
                                    differences.month = false
                                }
                            }
                            else if (!maxDate.getMonth() && maxDate.getFullYear())
                                if (maxDate.getFullYear() - minDate.getFullYear() === 1) {
                                    differences.month = true;
                                    differences.year = false
                                }
                        };
                    tickInterval = commonUtils.isString(tickInterval) ? tickInterval.toLowerCase() : tickInterval;
                    dateDifferences = dateUtils.getDatesDifferences(startValue, endValue);
                    if (startValue !== endValue)
                        correctDifferencesByMaxDate(dateDifferences, startValue > endValue ? endValue : startValue, startValue > endValue ? startValue : endValue);
                    dateUnitInterval = dateUtils.getDateUnitInterval(dateDifferences);
                    correctDateDifferences(dateDifferences, dateUnitInterval, true);
                    dateUnitInterval = dateUtils.getDateUnitInterval(tickInterval || 'second');
                    correctDateDifferences(dateDifferences, dateUnitInterval, false);
                    dateDifferences[dateDifferencesConverter[dateUnitInterval] || dateUnitInterval] = true;
                    resultFormat = formatHelper.getDateFormatByDifferences(dateDifferences);
                    return resultFormat
                }
            };
        return formatHelper
    });
    /*! Module core, file utils.hardwareBack.js */
    DevExpress.define("/utils/utils.hardwareBack", ["jquery"], function($) {
        var hardwareBack = $.Callbacks();
        return {
                process: function() {
                    hardwareBack.fire()
                },
                processCallback: hardwareBack
            }
    });
    /*! Module core, file utils.icon.js */
    DevExpress.define("/utils/utils.icon", ["jquery"], function($) {
        var getImageSourceType = function(source) {
                if (!source || typeof source !== "string")
                    return false;
                if (/data:.*base64|\.|\//.test(source))
                    return "image";
                if (/^[\w-_]+$/.test(source))
                    return "dxIcon";
                return "fontIcon"
            };
        var getImageContainer = function(source) {
                var imageType = getImageSourceType(source),
                    ICON_CLASS = "dx-icon";
                switch (imageType) {
                    case"image":
                        return $("<img>", {src: source}).addClass(ICON_CLASS);
                    case"fontIcon":
                        return $("<i>", {"class": ICON_CLASS + " " + source});
                    case"dxIcon":
                        return $("<i>", {"class": ICON_CLASS + " " + ICON_CLASS + "-" + source});
                    default:
                        return null
                }
            };
        return {
                getImageSourceType: getImageSourceType,
                getImageContainer: getImageContainer
            }
    });
    /*! Module core, file utils.inflector.js */
    DevExpress.define("/utils/utils.inflector", ["jquery"], function($) {
        var _normalize = function(text) {
                if (text === undefined || text === null)
                    return "";
                return String(text)
            };
        var _ucfirst = function(text) {
                return _normalize(text).charAt(0).toUpperCase() + text.substr(1)
            };
        var _chop = function(text) {
                return _normalize(text).replace(/([a-z\d])([A-Z])/g, "$1 $2").split(/[\s_-]+/)
            };
        var dasherize = function(text) {
                return $.map(_chop(text), function(p) {
                        return p.toLowerCase()
                    }).join("-")
            };
        var underscore = function(text) {
                return dasherize(text).replace(/-/g, "_")
            };
        var camelize = function(text, upperFirst) {
                return $.map(_chop(text), function(p, i) {
                        p = p.toLowerCase();
                        if (upperFirst || i > 0)
                            p = _ucfirst(p);
                        return p
                    }).join("")
            };
        var humanize = function(text) {
                return _ucfirst(dasherize(text).replace(/-/g, " "))
            };
        var titleize = function(text) {
                return $.map(_chop(text), function(p) {
                        return _ucfirst(p.toLowerCase())
                    }).join(" ")
            };
        var captionize = function(name) {
                var captionList = [],
                    i,
                    char,
                    isPrevCharNewWord = false,
                    isNewWord = false;
                for (i = 0; i < name.length; i++) {
                    char = name.charAt(i);
                    isNewWord = char === char.toUpperCase() || char in ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
                    if (char === "_" || char === ".") {
                        char = " ";
                        isNewWord = true
                    }
                    else if (i === 0) {
                        char = char.toUpperCase();
                        isNewWord = true
                    }
                    else if (!isPrevCharNewWord && isNewWord)
                        if (captionList.length > 0)
                            captionList.push(" ");
                    captionList.push(char);
                    isPrevCharNewWord = isNewWord
                }
                return captionList.join("")
            };
        return {
                dasherize: dasherize,
                camelize: camelize,
                humanize: humanize,
                titleize: titleize,
                underscore: underscore,
                captionize: captionize
            }
    });
    /*! Module core, file utils.inkRipple.js */
    DevExpress.define("/utils/utils.inkRipple", ["jquery", "/action"], function($, Action) {
        var DX = DevExpress,
            fx = DX.fx;
        var INKRIPPLE_CLASS = "dx-inkripple",
            INKRIPPLE_WAVE_CLASS = "dx-inkripple-wave",
            INKRIPPLE_REMOVING_CLASS = "dx-inkripple-removing";
        var DEFAULT_WAVE_SIZE_COEFFICIENT = 2.8,
            MAX_WAVE_SIZE = 4000;
        var render = function(args) {
                args = args || {};
                var config = {
                        waveSizeCoefficient: args.waveSizeCoefficient || DEFAULT_WAVE_SIZE_COEFFICIENT,
                        isCentered: args.isCentered || false
                    };
                return {
                        renderWave: $.proxy(renderWave, null, config),
                        removeWave: $.proxy(removeWave, null, config)
                    }
            };
        var renderWave = function(args, config) {
                var element = config.element,
                    inkRipple = element.children("." + INKRIPPLE_CLASS);
                if (inkRipple.length === 0)
                    inkRipple = $("<div>").addClass(INKRIPPLE_CLASS).appendTo(element);
                var elementWidth = element.width(),
                    elementHeight = element.height(),
                    maxContentSize = Math.max(elementWidth, elementHeight),
                    rippleSize = Math.min(MAX_WAVE_SIZE, parseInt(maxContentSize * args.waveSizeCoefficient)),
                    left,
                    top;
                var $wave = $("<div>").appendTo(inkRipple).addClass(INKRIPPLE_WAVE_CLASS);
                if (args.isCentered) {
                    left = (elementWidth - rippleSize) / 2;
                    top = (elementHeight - rippleSize) / 2
                }
                else {
                    var event = config.jQueryEvent,
                        position = element.offset(),
                        x = event.pageX - position.left,
                        y = event.pageY - position.top;
                    left = x - rippleSize / 2;
                    top = y - rippleSize / 2
                }
                var duration = parseInt(rippleSize * 3);
                $wave.css({
                    left: left,
                    top: top,
                    height: rippleSize,
                    width: rippleSize
                });
                fx.animate($wave, {
                    type: "pop",
                    from: {scale: 0},
                    to: {scale: 1},
                    duration: duration
                })
            };
        var removeWave = function(args, config) {
                var $inkRipple = config.element.find("." + INKRIPPLE_CLASS),
                    $wave = $inkRipple.children(":not(." + INKRIPPLE_REMOVING_CLASS + ")").eq(0);
                if ($wave.length === 0)
                    return;
                if (fx.isAnimating($wave))
                    fx.stop($wave);
                $wave.addClass(INKRIPPLE_REMOVING_CLASS);
                fx.animate($wave, {
                    complete: function() {
                        $wave.remove()
                    },
                    type: "fadeOut",
                    duration: 100
                })
            };
        return {render: render}
    });
    /*! Module core, file utils.knockout.js */
    DevExpress.define("/utils/utils.knockout", ["/utils/utils.support"], function(support) {
        var ko = window.ko;
        var unwrapObservable = function(value) {
                if (support.hasKo)
                    return ko.utils.unwrapObservable(value);
                return value
            };
        var isObservable = function(value) {
                return support.hasKo && ko.isObservable(value)
            };
        return {
                unwrapObservable: unwrapObservable,
                isObservable: isObservable
            }
    });
    /*! Module core, file utils.math.js */
    DevExpress.define("/utils/utils.math", ["/utils/utils.common"], function(commonUtils) {
        var PI = Math.PI,
            LN10 = Math.LN10;
        var cos = Math.cos,
            sin = Math.sin,
            abs = Math.abs,
            log = Math.log,
            floor = Math.floor,
            ceil = Math.ceil,
            max = Math.max,
            isNaN = window.isNaN,
            Number = window.Number,
            NaN = window.NaN;
        var isNumber = commonUtils.isNumber,
            isExponential = commonUtils.isExponential;
        var getPrecision = function(value) {
                var stringFraction,
                    stringValue = value.toString(),
                    pointIndex = stringValue.indexOf('.'),
                    startIndex,
                    precision;
                if (isExponential(value)) {
                    precision = getDecimalOrder(value);
                    if (precision < 0)
                        return Math.abs(precision);
                    else
                        return 0
                }
                if (pointIndex !== -1) {
                    startIndex = pointIndex + 1;
                    stringFraction = stringValue.substring(startIndex, startIndex + 20);
                    return stringFraction.length
                }
                return 0
            };
        var getLog = function(value, base) {
                if (!value)
                    return NaN;
                return Math.log(value) / Math.log(base)
            };
        var raiseTo = function(power, base) {
                return Math.pow(base, power)
            };
        var sign = function(value) {
                if (value === 0)
                    return 0;
                return value / abs(value)
            };
        var normalizeAngle = function(angle) {
                return (angle % 360 + 360) % 360
            };
        var convertAngleToRendererSpace = function(angle) {
                return 90 - angle
            };
        var degreesToRadians = function(value) {
                return PI * value / 180
            };
        var getCosAndSin = function(angle) {
                var angleInRadians = degreesToRadians(angle);
                return {
                        cos: cos(angleInRadians),
                        sin: sin(angleInRadians)
                    }
            };
        var DECIMAL_ORDER_THRESHOLD = 1E-14;
        var getDistance = function(x1, y1, x2, y2) {
                var diffX = x2 - x1,
                    diffY = y2 - y1;
                return Math.sqrt(diffY * diffY + diffX * diffX)
            };
        var getDecimalOrder = function(number) {
                var n = abs(number),
                    cn;
                if (!isNaN(n)) {
                    if (n > 0) {
                        n = log(n) / LN10;
                        cn = ceil(n);
                        return cn - n < DECIMAL_ORDER_THRESHOLD ? cn : floor(n)
                    }
                    return 0
                }
                return NaN
            };
        var getAppropriateFormat = function(start, end, count) {
                var order = max(getDecimalOrder(start), getDecimalOrder(end)),
                    precision = -getDecimalOrder(abs(end - start) / count),
                    format;
                if (!isNaN(order) && !isNaN(precision)) {
                    if (abs(order) <= 4) {
                        format = 'fixedPoint';
                        precision < 0 && (precision = 0);
                        precision > 4 && (precision = 4)
                    }
                    else {
                        format = 'exponential';
                        precision += order - 1;
                        precision > 3 && (precision = 3)
                    }
                    return {
                            format: format,
                            precision: precision
                        }
                }
                return null
            };
        var getFraction = function(value) {
                var valueString,
                    dotIndex;
                if (isNumber(value)) {
                    valueString = value.toString();
                    dotIndex = valueString.indexOf('.');
                    if (dotIndex >= 0)
                        if (isExponential(value))
                            return valueString.substr(dotIndex + 1, valueString.indexOf('e') - dotIndex - 1);
                        else {
                            valueString = value.toFixed(20);
                            return valueString.substr(dotIndex + 1, valueString.length - dotIndex + 1)
                        }
                }
                return ''
            };
        var getSignificantDigitPosition = function(value) {
                var fraction = getFraction(value),
                    i;
                if (fraction)
                    for (i = 0; i < fraction.length; i++)
                        if (fraction.charAt(i) !== '0')
                            return i + 1;
                return 0
            };
        var adjustValue = function(value) {
                var fraction = getFraction(value),
                    nextValue,
                    i;
                if (fraction)
                    for (i = 1; i <= fraction.length; i++) {
                        nextValue = roundValue(value, i);
                        if (nextValue !== 0 && fraction[i - 2] && fraction[i - 1] && fraction[i - 2] === fraction[i - 1])
                            return nextValue
                    }
                return value
            };
        var roundValue = function(value, precision) {
                if (precision > 20)
                    precision = 20;
                if (isNumber(value))
                    if (isExponential(value))
                        return Number(value.toExponential(precision));
                    else
                        return Number(value.toFixed(precision))
            };
        var applyPrecisionByMinDelta = function(min, delta, value) {
                var minPrecision = getPrecision(min),
                    deltaPrecision = getPrecision(delta);
                return roundValue(value, minPrecision < deltaPrecision ? deltaPrecision : minPrecision)
            };
        var fitIntoRange = function(value, minValue, maxValue) {
                return Math.min(Math.max(value, minValue), maxValue)
            };
        var getPower = function(value) {
                return value.toExponential().split("e")[1]
            };
        return {
                getPrecision: getPrecision,
                getLog: getLog,
                raiseTo: raiseTo,
                sign: sign,
                normalizeAngle: normalizeAngle,
                convertAngleToRendererSpace: convertAngleToRendererSpace,
                degreesToRadians: degreesToRadians,
                getCosAndSin: getCosAndSin,
                getDecimalOrder: getDecimalOrder,
                getAppropriateFormat: getAppropriateFormat,
                getDistance: getDistance,
                getFraction: getFraction,
                adjustValue: adjustValue,
                roundValue: roundValue,
                applyPrecisionByMinDelta: applyPrecisionByMinDelta,
                getSignificantDigitPosition: getSignificantDigitPosition,
                getPower: getPower,
                fitIntoRange: fitIntoRange
            }
    });
    /*! Module core, file utils.memorizedCallbacks.js */
    DevExpress.define("/utils/utils.memorizedCallbacks", ["jquery"], function($) {
        var MemorizedCallbacks = function() {
                var memory = [];
                var callbacks = $.Callbacks();
                this.add = function(fn) {
                    $.each(memory, function(_, item) {
                        fn.apply(fn, item)
                    });
                    callbacks.add(fn)
                };
                this.fire = function() {
                    memory.push(arguments);
                    callbacks.fire.apply(callbacks, arguments)
                }
            };
        return MemorizedCallbacks
    });
    /*! Module core, file utils.object.js */
    DevExpress.define("/utils/utils.object", ["jquery", "/utils/utils.common"], function($, commonUtils) {
        var clone = function() {
                function Clone(){}
                return function(obj) {
                        Clone.prototype = obj;
                        return new Clone
                    }
            }();
        var extendFromObject = function(target, source, overrideExistingValues) {
                target = target || {};
                for (var prop in source)
                    if (source.hasOwnProperty(prop)) {
                        var value = source[prop];
                        if (!(prop in target) || overrideExistingValues)
                            target[prop] = value
                    }
                return target
            };
        var orderEach = function(map, func) {
                var keys = [],
                    key,
                    i;
                for (key in map)
                    keys.push(key);
                keys.sort(function(x, y) {
                    var isNumberX = commonUtils.isNumber(x),
                        isNumberY = commonUtils.isNumber(y);
                    if (isNumberX && isNumberY)
                        return x - y;
                    if (isNumberX && !isNumberY)
                        return -1;
                    if (!isNumberX && isNumberY)
                        return 1;
                    if (x < y)
                        return -1;
                    if (x > y)
                        return 1;
                    return 0
                });
                for (i = 0; i < keys.length; i++) {
                    key = keys[i];
                    func(key, map[key])
                }
            };
        var deepExtendArraySafe = function(target, changes) {
                var prevValue,
                    newValue;
                for (var name in changes) {
                    prevValue = target[name];
                    newValue = changes[name];
                    if (target === newValue)
                        continue;
                    if ($.isPlainObject(newValue) && !(newValue instanceof $.Event))
                        target[name] = deepExtendArraySafe($.isPlainObject(prevValue) ? prevValue : {}, newValue);
                    else if (newValue !== undefined)
                        target[name] = newValue
                }
                return target
            };
        return {
                clone: clone,
                extendFromObject: extendFromObject,
                orderEach: orderEach,
                deepExtendArraySafe: deepExtendArraySafe
            }
    });
    /*! Module core, file utils.position.js */
    DevExpress.define("/utils/utils.position", ["/utils/utils.translator", "/utils/utils.string", "/utils/utils.support", "/utils/utils.common"], function(translator, stringUtils, support, commonUtils) {
        var horzRe = /left|right/,
            vertRe = /top|bottom/,
            collisionRe = /fit|flip|none/;
        var normalizeAlign = function(raw) {
                var result = {
                        h: "center",
                        v: "center"
                    };
                var pair = commonUtils.splitPair(raw);
                if (pair)
                    $.each(pair, function() {
                        var w = String(this).toLowerCase();
                        if (horzRe.test(w))
                            result.h = w;
                        else if (vertRe.test(w))
                            result.v = w
                    });
                return result
            };
        var normalizeOffset = function(raw) {
                return stringUtils.pairToObject(raw)
            };
        var normalizeCollision = function(raw) {
                var pair = commonUtils.splitPair(raw),
                    h = String(pair && pair[0]).toLowerCase(),
                    v = String(pair && pair[1]).toLowerCase();
                if (!collisionRe.test(h))
                    h = "none";
                if (!collisionRe.test(v))
                    v = h;
                return {
                        h: h,
                        v: v
                    }
            };
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
        var inverseAlign = function(align) {
                switch (align) {
                    case"left":
                        return "right";
                    case"right":
                        return "left";
                    case"top":
                        return "bottom";
                    case"bottom":
                        return "top";
                    default:
                        return align
                }
            };
        var calculateOversize = function(data, bounds) {
                var oversize = 0;
                if (data.myLocation < bounds.min)
                    oversize += bounds.min - data.myLocation;
                if (data.myLocation > bounds.max)
                    oversize += data.myLocation - bounds.max;
                return oversize
            };
        var collisionSide = function(direction, data, bounds) {
                if (data.myLocation < bounds.min)
                    return direction === "h" ? "left" : "top";
                if (data.myLocation > bounds.max)
                    return direction === "h" ? "right" : "bottom";
                return "none"
            };
        var initMyLocation = function(data) {
                data.myLocation = data.atLocation + getAlignFactor(data.atAlign) * data.atSize - getAlignFactor(data.myAlign) * data.mySize + data.offset
            };
        var decolliders = {
                fit: function(data, bounds) {
                    var result = false;
                    if (data.myLocation > bounds.max) {
                        data.myLocation = bounds.max;
                        result = true
                    }
                    if (data.myLocation < bounds.min) {
                        data.myLocation = bounds.min;
                        result = true
                    }
                    data.fit = result
                },
                flip: function(data, bounds) {
                    data.flip = false;
                    if (data.myAlign === "center" && data.atAlign === "center")
                        return;
                    if (data.myLocation < bounds.min || data.myLocation > bounds.max) {
                        var inverseData = $.extend({}, data, {
                                myAlign: inverseAlign(data.myAlign),
                                atAlign: inverseAlign(data.atAlign),
                                offset: -data.offset
                            });
                        initMyLocation(inverseData);
                        inverseData.oversize = calculateOversize(inverseData, bounds);
                        if (inverseData.myLocation >= bounds.min && inverseData.myLocation <= bounds.max || data.oversize > inverseData.oversize) {
                            data.myLocation = inverseData.myLocation;
                            data.oversize = inverseData.oversize;
                            data.flip = true
                        }
                    }
                },
                flipfit: function(data, bounds) {
                    this.flip(data, bounds);
                    this.fit(data, bounds)
                },
                none: function(data, bounds) {
                    data.oversize = 0
                }
            };
        var scrollbarWidth;
        var calculateScrollbarWidth = function() {
                var $scrollDiv = $("<div>").css({
                        width: 100,
                        height: 100,
                        overflow: "scroll",
                        position: "absolute",
                        top: -9999
                    }).appendTo($("body")),
                    result = $scrollDiv.get(0).offsetWidth - $scrollDiv.get(0).clientWidth;
                $scrollDiv.remove();
                scrollbarWidth = result
            };
        var defaultPositionResult = {
                h: {
                    location: 0,
                    flip: false,
                    fit: false,
                    oversize: 0
                },
                v: {
                    location: 0,
                    flip: false,
                    fit: false,
                    oversize: 0
                }
            };
        var calculatePosition = function(what, options) {
                var $what = $(what),
                    currentOffset = $what.offset(),
                    result = $.extend(true, {}, defaultPositionResult, {
                        h: {location: currentOffset.left},
                        v: {location: currentOffset.top}
                    });
                if (!options)
                    return result;
                var my = normalizeAlign(options.my),
                    at = normalizeAlign(options.at),
                    of = options.of || window,
                    offset = normalizeOffset(options.offset),
                    collision = normalizeCollision(options.collision),
                    boundary = options.boundary,
                    boundaryOffset = normalizeOffset(options.boundaryOffset);
                var h = {
                        mySize: $what.outerWidth(),
                        myAlign: my.h,
                        atAlign: at.h,
                        offset: offset.h,
                        collision: collision.h,
                        boundaryOffset: boundaryOffset.h
                    };
                var v = {
                        mySize: $what.outerHeight(),
                        myAlign: my.v,
                        atAlign: at.v,
                        offset: offset.v,
                        collision: collision.v,
                        boundaryOffset: boundaryOffset.v
                    };
                if (of.preventDefault) {
                    h.atLocation = of.pageX;
                    v.atLocation = of.pageY;
                    h.atSize = 0;
                    v.atSize = 0
                }
                else {
                    of = $(of);
                    if ($.isWindow(of[0])) {
                        h.atLocation = of.scrollLeft();
                        v.atLocation = of.scrollTop();
                        h.atSize = of.width();
                        v.atSize = of.height()
                    }
                    else if (of[0].nodeType === 9) {
                        h.atLocation = 0;
                        v.atLocation = 0;
                        h.atSize = of.width();
                        v.atSize = of.height()
                    }
                    else {
                        var o = of.offset();
                        h.atLocation = o.left;
                        v.atLocation = o.top;
                        h.atSize = of.outerWidth();
                        v.atSize = of.outerHeight()
                    }
                }
                initMyLocation(h);
                initMyLocation(v);
                var bounds = function() {
                        var win = $(window),
                            windowWidth = win.width(),
                            windowHeight = win.height(),
                            left = win.scrollLeft(),
                            top = win.scrollTop(),
                            hScrollbar = document.width > document.documentElement.clientWidth,
                            vScrollbar = document.height > document.documentElement.clientHeight,
                            hZoomLevel = support.touch ? document.documentElement.clientWidth / (vScrollbar ? windowWidth - scrollbarWidth : windowWidth) : 1,
                            vZoomLevel = support.touch ? document.documentElement.clientHeight / (hScrollbar ? windowHeight - scrollbarWidth : windowHeight) : 1;
                        if (scrollbarWidth === undefined)
                            calculateScrollbarWidth();
                        var boundaryWidth = windowWidth,
                            boundaryHeight = windowHeight;
                        if (boundary) {
                            var $boundary = $(boundary),
                                boundaryPosition = $boundary.offset();
                            left = boundaryPosition.left;
                            top = boundaryPosition.top;
                            boundaryWidth = $boundary.width();
                            boundaryHeight = $boundary.height()
                        }
                        return {
                                h: {
                                    min: left + h.boundaryOffset,
                                    max: left + boundaryWidth / hZoomLevel - h.mySize - h.boundaryOffset
                                },
                                v: {
                                    min: top + v.boundaryOffset,
                                    max: top + boundaryHeight / vZoomLevel - v.mySize - v.boundaryOffset
                                }
                            }
                    }();
                h.oversize = calculateOversize(h, bounds.h);
                v.oversize = calculateOversize(v, bounds.v);
                h.collisionSide = collisionSide("h", h, bounds.h);
                v.collisionSide = collisionSide("v", v, bounds.v);
                if (decolliders[h.collision])
                    decolliders[h.collision](h, bounds.h);
                if (decolliders[v.collision])
                    decolliders[v.collision](v, bounds.v);
                var preciser = function(number) {
                        return options.precise ? number : Math.round(number)
                    };
                $.extend(true, result, {
                    h: {
                        location: preciser(h.myLocation),
                        oversize: preciser(h.oversize),
                        fit: h.fit,
                        flip: h.flip,
                        collisionSide: h.collisionSide
                    },
                    v: {
                        location: preciser(v.myLocation),
                        oversize: preciser(v.oversize),
                        fit: v.fit,
                        flip: v.flip,
                        collisionSide: v.collisionSide
                    },
                    precise: options.precise
                });
                return result
            };
        var position = function(what, options) {
                var $what = $(what);
                if (!options)
                    return $what.offset();
                translator.resetPosition($what);
                var offset = $what.offset(),
                    targetPosition = options.h && options.v ? options : calculatePosition($what, options);
                var preciser = function(number) {
                        return options.precise ? number : Math.round(number)
                    };
                translator.move($what, {
                    left: targetPosition.h.location - preciser(offset.left),
                    top: targetPosition.v.location - preciser(offset.top)
                });
                return targetPosition
            };
        $.extend(position, {
            inverseAlign: inverseAlign,
            normalizeAlign: normalizeAlign
        });
        return {
                calculateScrollbarWidth: calculateScrollbarWidth,
                calculate: calculatePosition,
                setup: position
            }
    });
    /*! Module core, file utils.proxyUrlFormatter.js */
    DevExpress.define("/utils/utils.proxyUrlFormatter", ["jquery"], function($) {
        var location = window.location,
            DXPROXY_HOST = "dxproxy.devexpress.com:8000",
            IS_DXPROXY_ORIGIN = location.host === DXPROXY_HOST,
            urlMapping = {};
        var parseUrl = function() {
                var a = document.createElement("a"),
                    props = ["protocol", "hostname", "port", "pathname", "search", "hash"];
                var normalizePath = function(value) {
                        if (value.charAt(0) !== "/")
                            value = "/" + value;
                        return value
                    };
                return function(url) {
                        a.href = url;
                        var result = {};
                        $.each(props, function() {
                            result[this] = a[this]
                        });
                        result.pathname = normalizePath(result.pathname);
                        return result
                    }
            }();
        var extractProxyAppId = function() {
                return location.pathname.split("/")[1]
            };
        return {
                parseUrl: parseUrl,
                isProxyUsed: function() {
                    return IS_DXPROXY_ORIGIN
                },
                formatProxyUrl: function(localUrl) {
                    var urlData = parseUrl(localUrl);
                    if (!/^(localhost$|127\.)/i.test(urlData.hostname))
                        return localUrl;
                    var proxyUrlPart = DXPROXY_HOST + "/" + extractProxyAppId() + "_" + urlData.port;
                    urlMapping[proxyUrlPart] = urlData.hostname + ":" + urlData.port;
                    var resultUrl = "http://" + proxyUrlPart + urlData.pathname + urlData.search;
                    return resultUrl
                },
                formatLocalUrl: function(proxyUrl) {
                    if (proxyUrl.indexOf(DXPROXY_HOST) < 0)
                        return proxyUrl;
                    var resultUrl = proxyUrl;
                    for (var proxyUrlPart in urlMapping)
                        if (urlMapping.hasOwnProperty(proxyUrlPart))
                            if (proxyUrl.indexOf(proxyUrlPart) >= 0) {
                                resultUrl = proxyUrl.replace(proxyUrlPart, urlMapping[proxyUrlPart]);
                                break
                            }
                    return resultUrl
                }
            }
    });
    /*! Module core, file utils.publicComponent.js */
    DevExpress.define("/utils/utils.publicComponent", ["jquery", "/utils/utils.weakMap", "/utils/utils.common"], function($, WeakMap, commonUtils) {
        var COMPONENT_NAMES_DATA_KEY = "dxComponents",
            ANONIMIOUS_COMPONENT_DATA_KEY = "dxPrivateComponent";
        var componentNames = new WeakMap,
            nextAnonimiousComponent = 0;
        return {
                attachInstanceToElement: function(element, name, component) {
                    element = $(element).get(0);
                    $.data(element, name, component);
                    if (!$.data(element, COMPONENT_NAMES_DATA_KEY))
                        $.data(element, COMPONENT_NAMES_DATA_KEY, []);
                    $.data(element, COMPONENT_NAMES_DATA_KEY).push(name)
                },
                getInstanceByElement: function(element, name) {
                    element = $(element).get(0);
                    return $.data(element, name)
                },
                getName: function(newName) {
                    if (commonUtils.isDefined(newName)) {
                        componentNames.set(this, newName);
                        return
                    }
                    if (!componentNames.has(this)) {
                        var generatedName = ANONIMIOUS_COMPONENT_DATA_KEY + nextAnonimiousComponent++;
                        componentNames.set(this, generatedName);
                        return generatedName
                    }
                    return componentNames.get(this)
                }
            }
    });
    /*! Module core, file utils.queue.js */
    DevExpress.define("/utils/utils.queue", ["jquery", "/errors"], function($, errors) {
        function createQueue(discardPendingTasks) {
            var _tasks = [],
                _busy = false;
            function exec() {
                while (_tasks.length) {
                    _busy = true;
                    var task = _tasks.shift(),
                        result = task();
                    if (result === undefined)
                        continue;
                    if (result.then) {
                        $.when(result).always(exec);
                        return
                    }
                    throw errors.Error("E0015");
                }
                _busy = false
            }
            function add(task, removeTaskCallback) {
                if (!discardPendingTasks)
                    _tasks.push(task);
                else {
                    if (_tasks[0] && removeTaskCallback)
                        removeTaskCallback(_tasks[0]);
                    _tasks = [task]
                }
                if (!_busy)
                    exec()
            }
            function busy() {
                return _busy
            }
            return {
                    add: add,
                    busy: busy
                }
        }
        return {
                create: createQueue,
                enqueue: createQueue().add
            }
    });
    /*! Module core, file utils.recurrence.js */
    DevExpress.define("/utils/utils.recurrence", ["jquery", "/errors", "/utils/utils.date"], function($, errors, dateUtils) {
        var intervalMap = {
                secondly: "seconds",
                minutely: "minutes",
                hourly: "hours",
                daily: "days",
                weekly: "weeks",
                monthly: "months",
                yearly: "years"
            };
        var dateSetterMap = {
                bysecond: function(date, value) {
                    date.setSeconds(value)
                },
                byminute: function(date, value) {
                    date.setMinutes(value)
                },
                byhour: function(date, value) {
                    date.setHours(value)
                },
                bymonth: function(date, value) {
                    date.setMonth(value)
                },
                bymonthday: function(date, value) {
                    date.setDate(value)
                },
                byday: function(date, dayOfWeek) {
                    date.setDate(date.getDate() - date.getDay() + dayOfWeek)
                }
            };
        var dateGetterMap = {
                bysecond: "getSeconds",
                byminute: "getMinutes",
                byhour: "getHours",
                bymonth: "getMonth",
                bymonthday: "getDate",
                byday: "getDay"
            };
        var ruleNames = ["freq", "interval", "byday", "bymonth", "bymonthday", "count", "until", "byhour", "byminute", "bysecond"],
            freqNames = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "SECONDLY", "MINUTELY", "HOURLY"],
            days = {
                SU: 0,
                MO: 1,
                TU: 2,
                WE: 3,
                TH: 4,
                FR: 5,
                SA: 6
            };
        var dateInRecurrenceRange = function(recurrenceString, currentDate, viewStartDate, viewEndDate, recurrenceException) {
                var result = [];
                if (recurrenceString)
                    result = getDatesByRecurrence(recurrenceString, currentDate, viewStartDate, viewEndDate, recurrenceException);
                return !!result.length
            };
        var normalizeInterval = function(freq, interval) {
                var intervalObject = {},
                    intervalField = intervalMap[freq.toLowerCase()];
                intervalObject[intervalField] = interval;
                return intervalObject
            };
        var getDatesByRecurrenceException = function(recurrenceException) {
                var result = [];
                if (!recurrenceException)
                    return result;
                var ruleValues = recurrenceException.split(",");
                for (var i = 0, len = ruleValues.length; i < len; i++)
                    result[i] = getDateByAsciiString(ruleValues[i]);
                return result
            };
        var dateInArray = function(date, dates) {
                var result = false;
                for (var i = 0, len = dates.length; i < len; i++)
                    if (date.getTime() === dates[i].getTime())
                        result = true;
                return result
            };
        var getDatesByRecurrence = function(recurrenceString, recurrenceStartDate, viewStartDate, viewEndDate, recurrenceException) {
                var result = [],
                    recurrenceRule = getRecurrenceRule(recurrenceString);
                if (!recurrenceRule.isValid)
                    return [];
                var rule = recurrenceRule.rule;
                if (!rule.freq)
                    return result;
                rule.interval = normalizeInterval(rule.freq, rule.interval);
                viewEndDate = dateUtils.normalizeDate(viewEndDate, viewStartDate, rule.until);
                var recurrenceCounter = 0,
                    dateCounter = 0,
                    dateRules = splitDateRules(rule),
                    ruleDates = getDatesByRules(dateRules, recurrenceStartDate),
                    currentDate = ruleDates[0],
                    firstDate = new Date(recurrenceStartDate),
                    exceptDates = getDatesByRecurrenceException(recurrenceException);
                dateUtils.correctDateWithUnitBeginning(firstDate, rule.interval);
                var firstDateInterval = getDatePartDiffs(recurrenceStartDate, firstDate);
                while (currentDate <= viewEndDate && rule.count !== recurrenceCounter) {
                    if (checkDateByRule(currentDate, dateRules)) {
                        if (currentDate >= viewStartDate && !dateInArray(currentDate, exceptDates)) {
                            viewStartDate = new Date(currentDate);
                            viewStartDate.setMilliseconds(viewStartDate.getMilliseconds() + 1);
                            result.push(new Date(currentDate))
                        }
                        recurrenceCounter++
                    }
                    dateCounter++;
                    currentDate = ruleDates[dateCounter % ruleDates.length];
                    if (dateCounter / ruleDates.length >= 1) {
                        dateCounter = 0;
                        firstDate = dateUtils.addInterval(firstDate, rule.interval);
                        ruleDates = getDatesByRules(dateRules, dateUtils.addInterval(firstDate, firstDateInterval));
                        currentDate = ruleDates[0]
                    }
                }
                return result
            };
        var getDatePartDiffs = function(date1, date2) {
                return {
                        years: date1.getFullYear() - date2.getFullYear(),
                        months: date1.getMonth() - date2.getMonth(),
                        days: date1.getDate() - date2.getDate(),
                        hours: date1.getHours() - date2.getHours(),
                        minutes: date1.getMinutes() - date2.getMinutes(),
                        seconds: date1.getSeconds() - date2.getSeconds()
                    }
            };
        var getRecurrenceRule = function(recurrence) {
                var result = {
                        rule: {},
                        isValid: false
                    };
                if (recurrence) {
                    result.rule = parseRecurrenceRule(recurrence);
                    result.isValid = validateRRule(result.rule, recurrence)
                }
                return result
            };
        var loggedWarnings = [];
        var validateRRule = function(rule, recurrence) {
                if (brokenRuleNameExists(rule) || $.inArray(rule.freq, freqNames) === -1 || wrongCountRule(rule) || wrongIntervalRule(rule) || wrongDayOfWeek(rule) || wrongByMonthDayRule(rule) || wrongByMonth(rule) || wrongUntilRule(rule)) {
                    logBrokenRule(recurrence);
                    return false
                }
                return true
            };
        var wrongUntilRule = function(rule) {
                var wrongUntil = false,
                    until = rule.until;
                if (until !== undefined && !(until instanceof Date))
                    wrongUntil = true;
                return wrongUntil
            };
        var wrongCountRule = function(rule) {
                var wrongCount = false,
                    count = rule.count;
                if (count && typeof count === "string")
                    wrongCount = true;
                return wrongCount
            };
        var wrongByMonthDayRule = function(rule) {
                var wrongByMonthDay = false,
                    byMonthDay = rule.bymonthday;
                if (byMonthDay && isNaN(parseInt(byMonthDay)))
                    wrongByMonthDay = true;
                return wrongByMonthDay
            };
        var wrongByMonth = function(rule) {
                var wrongByMonth = false,
                    byMonth = rule.bymonth;
                if (byMonth && isNaN(parseInt(byMonth)))
                    wrongByMonth = true;
                return wrongByMonth
            };
        var wrongIntervalRule = function(rule) {
                var wrongInterval = false,
                    interval = rule.interval;
                if (interval && typeof interval === "string")
                    wrongInterval = true;
                return wrongInterval
            };
        var wrongDayOfWeek = function(rule) {
                var daysByRule = daysFromByDayRule(rule),
                    brokenDaysExist = false;
                $.each(daysByRule, function(_, day) {
                    if (!days.hasOwnProperty(day)) {
                        brokenDaysExist = true;
                        return false
                    }
                });
                return brokenDaysExist
            };
        var brokenRuleNameExists = function(rule) {
                var brokenRuleExists = false;
                $.each(rule, function(ruleName, _) {
                    if ($.inArray(ruleName, ruleNames) === -1) {
                        brokenRuleExists = true;
                        return false
                    }
                });
                return brokenRuleExists
            };
        var logBrokenRule = function(recurrence) {
                if ($.inArray(recurrence, loggedWarnings) === -1) {
                    errors.log("W0006", recurrence);
                    loggedWarnings.push(recurrence)
                }
            };
        var parseRecurrenceRule = function(recurrence) {
                var ruleObject = {},
                    ruleParts = recurrence.split(";");
                for (var i = 0, len = ruleParts.length; i < len; i++) {
                    var rule = ruleParts[i].split("="),
                        ruleName = rule[0].toLowerCase(),
                        ruleValue = rule[1];
                    ruleObject[ruleName] = ruleValue
                }
                var count = parseInt(ruleObject.count);
                if (!isNaN(count))
                    ruleObject.count = count;
                if (ruleObject.interval) {
                    var interval = parseInt(ruleObject.interval);
                    if (!isNaN(interval))
                        ruleObject.interval = interval
                }
                else
                    ruleObject.interval = 1;
                if (ruleObject.freq && ruleObject.until)
                    ruleObject.until = getDateByAsciiString(ruleObject.until);
                return ruleObject
            };
        var getDateByAsciiString = function(string) {
                if (typeof string !== "string")
                    return string;
                var date = Globalize.parseDate(string, "yyyyMMddThhmmss");
                if (!date)
                    date = Globalize.parseDate(string, "yyyyMMdd");
                return date
            };
        var daysFromByDayRule = function(rule) {
                var result = [];
                if (rule.byday)
                    result = rule.byday.split(",");
                return result
            };
        var getAsciiStringByDate = function(date) {
                return date.getFullYear() + ('0' + (date.getMonth() + 1)).slice(-2) + ('0' + date.getDate()).slice(-2)
            };
        var splitDateRules = function(rule) {
                var result = [];
                for (var field in dateSetterMap) {
                    if (!rule[field])
                        continue;
                    var ruleFieldValues = rule[field].split(","),
                        ruleArray = getDateRuleArray(field, ruleFieldValues);
                    result = result.length ? extendObjectArray(ruleArray, result) : ruleArray
                }
                return result
            };
        var getDateRuleArray = function(field, values) {
                var result = [];
                for (var i = 0, length = values.length; i < length; i++) {
                    var dateRule = {};
                    dateRule[field] = handleRuleFieldValue(field, values[i]);
                    result.push(dateRule)
                }
                return result
            };
        var handleRuleFieldValue = function(field, value) {
                var result = parseInt(value);
                if (field === "bymonth")
                    result -= 1;
                if (field === "byday")
                    result = days[value];
                return result
            };
        var extendObjectArray = function(firstArray, secondArray) {
                var result = [];
                for (var i = 0, firstArrayLength = firstArray.length; i < firstArrayLength; i++)
                    for (var j = 0, secondArrayLength = secondArray.length; j < secondArrayLength; j++)
                        result.push($.extend({}, firstArray[i], secondArray[j]));
                return result
            };
        var getDatesByRules = function(dateRules, startDate) {
                var updatedDate = new Date(startDate),
                    result = [];
                for (var i = 0, len = dateRules.length; i < len; i++) {
                    var current = dateRules[i];
                    for (var field in current)
                        dateSetterMap[field](updatedDate, current[field]);
                    result.push(new Date(updatedDate))
                }
                if (!result.length)
                    result.push(updatedDate);
                return result
            };
        var checkDateByRule = function(date, rules) {
                var result = false;
                for (var i = 0; i < rules.length; i++) {
                    var current = rules[i],
                        currentRuleResult = true;
                    for (var field in current)
                        if (current[field] !== date[dateGetterMap[field]]())
                            currentRuleResult = false;
                    result = result || currentRuleResult
                }
                return result || !rules.length
            };
        var getRecurrenceString = function(object) {
                if (!object || !object.freq)
                    return;
                var result = "";
                for (var field in object) {
                    var value = object[field];
                    if (field === "interval" && value < 2)
                        continue;
                    if (field === "until")
                        value = getAsciiStringByDate(value);
                    result += field + "=" + value + ";"
                }
                result = result.substring(0, result.length - 1);
                return result.toUpperCase()
            };
        return {
                getRecurrenceString: getRecurrenceString,
                getRecurrenceRule: getRecurrenceRule,
                getAsciiStringByDate: getAsciiStringByDate,
                getDatesByRecurrence: getDatesByRecurrence,
                dateInRecurrenceRange: dateInRecurrenceRange,
                getDateByAsciiString: getDateByAsciiString,
                daysFromByDayRule: daysFromByDayRule
            }
    });
    /*! Module core, file utils.storage.js */
    DevExpress.define("/utils/utils.storage", [], function() {
        var getSessionStorage = function() {
                var sessionStorage;
                try {
                    sessionStorage = window.sessionStorage
                }
                catch(e) {}
                return sessionStorage
            };
        return {sessionStorage: getSessionStorage}
    });
    /*! Module core, file utils.string.js */
    DevExpress.define("/utils/utils.string", ["jquery", "/utils/utils.common"], function($, commonUtils) {
        var encodeHtml = function() {
                var exncodeRegExp = [new RegExp("&", "g"), new RegExp('"', "g"), new RegExp("'", "g"), new RegExp("<", "g"), new RegExp(">", "g")];
                return function(str) {
                        return String(str).replace(exncodeRegExp[0], '&amp;').replace(exncodeRegExp[1], '&quot;').replace(exncodeRegExp[2], '&#39;').replace(exncodeRegExp[3], '&lt;').replace(exncodeRegExp[4], '&gt;')
                    }
            }();
        var pairToObject = function(raw) {
                var pair = commonUtils.splitPair(raw),
                    h = parseInt(pair && pair[0], 10),
                    v = parseInt(pair && pair[1], 10);
                if (!isFinite(h))
                    h = 0;
                if (!isFinite(v))
                    v = h;
                return {
                        h: h,
                        v: v
                    }
            };
        var quadToObject = function(raw) {
                var quad = commonUtils.splitQuad(raw),
                    left = parseInt(quad && quad[0], 10),
                    top = parseInt(quad && quad[1], 10),
                    right = parseInt(quad && quad[2], 10),
                    bottom = parseInt(quad && quad[3], 10);
                if (!isFinite(left))
                    left = 0;
                if (!isFinite(top))
                    top = left;
                if (!isFinite(right))
                    right = left;
                if (!isFinite(bottom))
                    bottom = top;
                return {
                        top: top,
                        right: right,
                        bottom: bottom,
                        left: left
                    }
            };
        var stringFormat = function() {
                var s = arguments[0],
                    replaceDollarCount,
                    reg,
                    argument;
                for (var i = 0; i < arguments.length - 1; i++) {
                    reg = new RegExp("\\{" + i + "\\}", "gm");
                    argument = arguments[i + 1];
                    if ($.type(argument) === "string" && argument.indexOf("$") >= 0) {
                        replaceDollarCount = "$".replace("$", "$$").length;
                        argument = argument.replace("$", replaceDollarCount === 1 ? "$$$$" : "$$")
                    }
                    s = s.replace(reg, argument)
                }
                return s
            };
        var replaceAll = function() {
                var preg_quote = function(str) {
                        return (str + "").replace(/([\+\*\?\\\.\[\^\]\$\(\)\{\}\><\|\=\!\:])/g, "\\$1")
                    };
                return function(text, searchToken, replacementToken) {
                        return text.replace(new RegExp("(" + preg_quote(searchToken) + ")", "gi"), replacementToken)
                    }
            }();
        return {
                encodeHtml: encodeHtml,
                pairToObject: pairToObject,
                quadToObject: quadToObject,
                format: stringFormat,
                replaceAll: replaceAll
            }
    });
    /*! Module core, file utils.support.js */
    DevExpress.define("/utils/utils.support", ["jquery", "/utils/utils.inflector", "/devices"], function($, inflector, devices) {
        var camelize = inflector.camelize;
        var jsPrefixes = ["", "Webkit", "Moz", "O", "Ms"],
            cssPrefixes = {
                "": "",
                Webkit: "-webkit-",
                Moz: "-moz-",
                O: "-o-",
                ms: "-ms-"
            },
            styles = document.createElement("dx").style;
        var transitionEndEventNames = {
                webkitTransition: 'webkitTransitionEnd',
                MozTransition: 'transitionend',
                OTransition: 'oTransitionEnd',
                msTransition: 'MsTransitionEnd',
                transition: 'transitionend'
            };
        var forEachPrefixes = function(prop, callBack) {
                prop = camelize(prop, true);
                var result;
                for (var i = 0, cssPrefixesCount = jsPrefixes.length; i < cssPrefixesCount; i++) {
                    var jsPrefix = jsPrefixes[i];
                    var prefixedProp = jsPrefix + prop;
                    var lowerPrefixedProp = camelize(prefixedProp);
                    result = callBack(lowerPrefixedProp, jsPrefix);
                    if (result === undefined)
                        result = callBack(prefixedProp, jsPrefix);
                    if (result !== undefined)
                        break
                }
                return result
            };
        var styleProp = function(prop) {
                return forEachPrefixes(prop, function(specific) {
                        if (specific in styles)
                            return specific
                    })
            };
        var stylePropPrefix = function(prop) {
                return forEachPrefixes(prop, function(specific, jsPrefix) {
                        if (specific in styles)
                            return cssPrefixes[jsPrefix]
                    })
            };
        var supportProp = function(prop) {
                return !!styleProp(prop)
            };
        var isNativeScrollingSupported = function() {
                var realDevice = devices.real(),
                    realPlatform = realDevice.platform,
                    realVersion = realDevice.version,
                    isObsoleteAndroid = realVersion && realVersion[0] < 4 && realPlatform === "android",
                    isNativeScrollDevice = !isObsoleteAndroid && $.inArray(realPlatform, ["ios", "android", "win"]) > -1 || realDevice.mac;
                return isNativeScrollDevice
            };
        var inputType = function(type) {
                if (type === "text")
                    return true;
                var input = document.createElement("input");
                try {
                    input.setAttribute("type", type);
                    input.value = "wrongValue";
                    return !input.value
                }
                catch(e) {
                    return false
                }
            };
        var touchEvents = "ontouchstart" in window && !('callPhantom' in window),
            pointerEvents = !!window.navigator.pointerEnabled || !!window.navigator.msPointerEnabled;
        return {
                touchEvents: touchEvents,
                pointer: pointerEvents,
                touch: touchEvents || pointerEvents,
                transform: supportProp("transform"),
                transition: supportProp("transition"),
                transitionEndEventName: transitionEndEventNames[styleProp("transition")],
                animation: supportProp("animation"),
                nativeScrolling: isNativeScrollingSupported(),
                winJS: "WinJS" in window,
                styleProp: styleProp,
                stylePropPrefix: stylePropPrefix,
                supportProp: supportProp,
                hasKo: !!window.ko,
                hasNg: !!window.angular,
                inputType: inputType
            }
    });
    /*! Module core, file utils.topOverlay.js */
    DevExpress.define("/utils/utils.topOverlay", ["jquery"], function($) {
        var hideCallback = function() {
                var callbacks = [];
                return {
                        add: function(callback) {
                            var indexOfCallback = $.inArray(callback, callbacks);
                            if (indexOfCallback === -1)
                                callbacks.push(callback)
                        },
                        remove: function(callback) {
                            var indexOfCallback = $.inArray(callback, callbacks);
                            if (indexOfCallback !== -1)
                                callbacks.splice(indexOfCallback, 1)
                        },
                        fire: function() {
                            var callback = callbacks.pop(),
                                result = !!callback;
                            if (result)
                                callback();
                            return result
                        },
                        hasCallback: function() {
                            return callbacks.length > 0
                        },
                        reset: function() {
                            callbacks = []
                        }
                    }
            }();
        return {
                hide: function() {
                    return hideCallback.fire()
                },
                hideCallback: hideCallback
            }
    });
    /*! Module core, file utils.translator.js */
    DevExpress.define("/utils/utils.translator", ["jquery", "/utils/utils.support"], function($, support) {
        var TRANSLATOR_DATA_KEY = "dxTranslator",
            TRANSFORM_MATRIX_REGEX = /matrix(3d)?\((.+?)\)/,
            TRANSLATE_REGEX = /translate(?:3d)?\((.+?)\)/;
        var locate = function($element) {
                var translate = support.transform ? getTranslate($element) : getTranslateFallback($element);
                return {
                        left: translate.x,
                        top: translate.y
                    }
            };
        var move = function($element, position) {
                if (!support.transform) {
                    $element.css(position);
                    return
                }
                var translate = getTranslate($element),
                    left = position.left,
                    top = position.top;
                if (left !== undefined)
                    translate.x = left || 0;
                if (top !== undefined)
                    translate.y = top || 0;
                $element.css({transform: getTranslateCss(translate)});
                if (isPersentValue(left) || isPersentValue(top))
                    clearCache($element)
            };
        var isPersentValue = function(value) {
                return $.type(value) === "string" && value[value.length - 1] === "%"
            };
        var getTranslateFallback = function($element) {
                var result;
                try {
                    var originalTop = $element.css("top"),
                        originalLeft = $element.css("left");
                    var position = $element.position();
                    $element.css({
                        transform: "none",
                        top: 0,
                        left: 0
                    });
                    clearCache($element);
                    var finalPosition = $element.position();
                    result = {
                        x: position.left - finalPosition.left || parseInt(originalLeft) || 0,
                        y: position.top - finalPosition.top || parseInt(originalTop) || 0
                    };
                    $element.css({
                        top: originalTop,
                        left: originalLeft
                    })
                }
                catch(e) {
                    result = {
                        x: 0,
                        y: 0
                    }
                }
                return result
            };
        var getTranslate = function($element) {
                var result = $element.length ? $.data($element.get(0), TRANSLATOR_DATA_KEY) : null;
                if (!result) {
                    var transformValue = $element.css("transform") || getTranslateCss({
                            x: 0,
                            y: 0
                        }),
                        matrix = transformValue.match(TRANSFORM_MATRIX_REGEX),
                        is3D = matrix && matrix[1];
                    if (matrix) {
                        matrix = matrix[2].split(",");
                        if (is3D === "3d")
                            matrix = matrix.slice(12, 15);
                        else {
                            matrix.push(0);
                            matrix = matrix.slice(4, 7)
                        }
                    }
                    else
                        matrix = [0, 0, 0];
                    result = {
                        x: parseFloat(matrix[0]),
                        y: parseFloat(matrix[1]),
                        z: parseFloat(matrix[2])
                    };
                    cacheTranslate($element, result)
                }
                return result
            };
        var cacheTranslate = function($element, translate) {
                if ($element.length)
                    $.data($element.get(0), TRANSLATOR_DATA_KEY, translate)
            };
        var clearCache = function($element) {
                if ($element.length)
                    $.removeData($element.get(0), TRANSLATOR_DATA_KEY)
            };
        var resetPosition = function($element) {
                $element.css({
                    left: 0,
                    top: 0,
                    transform: "none"
                });
                clearCache($element)
            };
        var parseTranslate = function(translateString) {
                var result = translateString.match(TRANSLATE_REGEX);
                if (!result || !result[1])
                    return;
                result = result[1].split(",");
                result = {
                    x: parseFloat(result[0]),
                    y: parseFloat(result[1]),
                    z: parseFloat(result[2])
                };
                return result
            };
        var getTranslateCss = function(translate) {
                translate.x = translate.x || 0;
                translate.y = translate.y || 0;
                var xValueString = isPersentValue(translate.x) ? translate.x : translate.x + "px";
                var yValueString = isPersentValue(translate.y) ? translate.y : translate.y + "px";
                return "translate(" + xValueString + ", " + yValueString + ")"
            };
        return {
                move: move,
                locate: locate,
                clearCache: clearCache,
                parseTranslate: parseTranslate,
                getTranslate: getTranslate,
                getTranslateCss: getTranslateCss,
                resetPosition: resetPosition
            }
    });
    /*! Module core, file utils.version.js */
    DevExpress.define("/utils/utils.version", ["jquery"], function($) {
        var compare = function(x, y, maxLevel) {
                function normalizeArg(value) {
                    if (typeof value === "string")
                        return value.split(".");
                    if (typeof value === "number")
                        return [value];
                    return value
                }
                x = normalizeArg(x);
                y = normalizeArg(y);
                var length = Math.max(x.length, y.length);
                if (isFinite(maxLevel))
                    length = Math.min(length, maxLevel);
                for (var i = 0; i < length; i++) {
                    var xItem = parseInt(x[i] || 0, 10),
                        yItem = parseInt(y[i] || 0, 10);
                    if (xItem < yItem)
                        return -1;
                    if (xItem > yItem)
                        return 1
                }
                return 0
            };
        return {compare: compare}
    });
    /*! Module core, file utils.viewPort.js */
    DevExpress.define("/utils/utils.viewPort", ["jquery"], function($) {
        var changeCallback = $.Callbacks();
        var value = function() {
                var $current;
                return function(element) {
                        if (!arguments.length)
                            return $current;
                        var $element = $(element);
                        var isNewViewportFound = !!$element.length;
                        var prevViewPort = value();
                        $current = isNewViewportFound ? $element : $("body");
                        changeCallback.fire(isNewViewportFound ? value() : $(), prevViewPort)
                    }
            }();
        $(function() {
            value(".dx-viewport")
        });
        return {
                value: value,
                changeCallback: changeCallback
            }
    });
    /*! Module core, file utils.weakMap.js */
    DevExpress.define("/utils/utils.weakMap", ["jquery"], function($) {
        var WeakMap = window.WeakMap;
        if (!WeakMap)
            WeakMap = function() {
                var keys = [],
                    values = [];
                this.set = function(key, value) {
                    keys.push(key);
                    values.push(value)
                };
                this.get = function(key) {
                    var index = $.inArray(key, keys);
                    if (index === -1)
                        return undefined;
                    return values[index]
                };
                this.has = function(key) {
                    var index = $.inArray(key, keys);
                    if (index === -1)
                        return false;
                    return true
                }
            };
        return WeakMap
    });
    /*! Module core, file utils.window.js */
    DevExpress.define("/utils/utils.window", ["jquery"], function($) {
        var resizeCallbacks = function() {
                var prevSize,
                    callbacks = $.Callbacks(),
                    jqWindow = $(window),
                    resizeEventHandlerAttached = false,
                    originalCallbacksAdd = callbacks.add,
                    originalCallbacksRemove = callbacks.remove;
                var formatSize = function() {
                        return [jqWindow.width(), jqWindow.height()].join()
                    };
                var handleResize = function() {
                        var now = formatSize();
                        if (now === prevSize)
                            return;
                        prevSize = now;
                        setTimeout(callbacks.fire)
                    };
                prevSize = formatSize();
                callbacks.add = function() {
                    var result = originalCallbacksAdd.apply(callbacks, arguments);
                    if (!resizeEventHandlerAttached && callbacks.has()) {
                        jqWindow.on("resize", handleResize);
                        resizeEventHandlerAttached = true
                    }
                    return result
                };
                callbacks.remove = function() {
                    var result = originalCallbacksRemove.apply(callbacks, arguments);
                    if (!callbacks.has() && resizeEventHandlerAttached) {
                        jqWindow.off("resize", handleResize);
                        resizeEventHandlerAttached = false
                    }
                    return result
                };
                return callbacks
            }();
        return {resizeCallbacks: resizeCallbacks}
    });
    /*! Module core, file utilsNamespace.js */
    DevExpress.define("/utils/utilsNamespace", ["/coreNamespace"], function(baseNamespace) {
        var ns = baseNamespace.utils = baseNamespace.utils || {};
        return ns
    });
    /*! Module core, file utils.js */
    DevExpress.define("/utils/utils", ["/utils/utilsNamespace", "/utils/utils.animationFrame", "/utils/utils.object", "/utils/utils.dom", "/utils/utils.date", "/utils/utils.common"], function(namespace, animationFrame, objectUtils, domUtils, dateUtils, commonUtils) {
        namespace.requestAnimationFrame = animationFrame.request;
        namespace.cancelAnimationFrame = animationFrame.cancel;
        namespace.initMobileViewport = domUtils.initMobileViewport;
        namespace.extendFromObject = objectUtils.extendFromObject;
        namespace.createComponents = domUtils.createComponents;
        namespace.triggerShownEvent = domUtils.triggerShownEvent;
        namespace.triggerHiddingEvent = domUtils.triggerHiddingEvent;
        namespace.makeDate = dateUtils.makeDate;
        namespace.resetActiveElement = domUtils.resetActiveElement;
        namespace.findBestMatches = commonUtils.findBestMatches;
        return namespace
    });
    /*! Module core, file localization.js */
    (function($, DX, undefined) {
        var humanize = DX.require("/utils/utils.inflector").humanize;
        Globalize._findClosestNeutralCulture = function(cultureSelector) {
            var neutral = (cultureSelector || this.cultureSelector || "").substring(0, 2),
                culture = this.findClosestCulture(neutral);
            return culture || {messages: {}}
        };
        Globalize.localize = function(key, cultureSelector) {
            return this.findClosestCulture(cultureSelector).messages[key] || this._findClosestNeutralCulture(cultureSelector).messages[key] || this.cultures["default"].messages[key]
        };
        var localization = function() {
                var newMessages = {};
                return {
                        setup: function(localizablePrefix) {
                            this.localizeString = function(text) {
                                var regex = new RegExp("(^|[^a-zA-Z_0-9" + localizablePrefix + "-]+)(" + localizablePrefix + "{1,2})([a-zA-Z_0-9-]+)", "g"),
                                    escapeString = localizablePrefix + localizablePrefix;
                                return text.replace(regex, function(str, prefix, escape, localizationKey) {
                                        var result = prefix + localizablePrefix + localizationKey;
                                        if (escape !== escapeString)
                                            if (Globalize.cultures["default"].messages[localizationKey])
                                                result = prefix + Globalize.localize(localizationKey);
                                            else
                                                newMessages[localizationKey] = humanize(localizationKey);
                                        return result
                                    })
                            }
                        },
                        localizeNode: function(node) {
                            var that = this;
                            $(node).each(function(index, nodeItem) {
                                if (!nodeItem.nodeType)
                                    return;
                                if (nodeItem.nodeType === 3)
                                    nodeItem.nodeValue = that.localizeString(nodeItem.nodeValue);
                                else if (!$(nodeItem).is("iframe")) {
                                    $.each(nodeItem.attributes || [], function(index, attr) {
                                        if (typeof attr.value === "string") {
                                            var localizedValue = that.localizeString(attr.value);
                                            if (attr.value !== localizedValue)
                                                attr.value = localizedValue
                                        }
                                    });
                                    $(nodeItem).contents().each(function(index, node) {
                                        that.localizeNode(node)
                                    })
                                }
                            })
                        },
                        getDictionary: function(onlyNew) {
                            if (onlyNew)
                                return newMessages;
                            return $.extend({}, newMessages, Globalize.cultures["default"].messages)
                        }
                    }
            }();
        localization.setup("@");
        DX.localization = localization
    })(jQuery, DevExpress);
    /*! Module core, file core.en.js */
    Globalize.addCultureInfo("default", {messages: {
            Yes: "Yes",
            No: "No",
            Cancel: "Cancel",
            Clear: "Clear",
            Done: "Done",
            Loading: "Loading...",
            Select: "Select...",
            Search: "Search",
            Back: "Back",
            OK: "OK",
            "dxCollectionWidget-noDataText": "No data to display",
            "validation-required": "Required",
            "validation-required-formatted": "{0} is required",
            "validation-numeric": "Value must be a number",
            "validation-numeric-formatted": "{0} must be a number",
            "validation-range": "Value is out of range",
            "validation-range-formatted": "{0} is out of range",
            "validation-stringLength": "The length of the value is not correct",
            "validation-stringLength-formatted": "The length of {0} is not correct",
            "validation-custom": "Value is invalid",
            "validation-custom-formatted": "{0} is invalid",
            "validation-compare": "Values do not match",
            "validation-compare-formatted": "{0} does not match",
            "validation-pattern": "Value does not match pattern",
            "validation-pattern-formatted": "{0} does not match pattern",
            "validation-email": "Email is invalid",
            "validation-email-formatted": "{0} is invalid",
            "validation-mask": "Value is invalid"
        }});
    /*! Module core, file widgets-base.en.js */
    Globalize.addCultureInfo("default", {messages: {
            "dxLookup-searchPlaceholder": "Minimum character number: {0}",
            "dxList-pullingDownText": "Pull down to refresh...",
            "dxList-pulledDownText": "Release to refresh...",
            "dxList-refreshingText": "Refreshing...",
            "dxList-pageLoadingText": "Loading...",
            "dxList-nextButtonText": "More",
            "dxList-selectAll": "Select All",
            "dxListEditDecorator-delete": "Delete",
            "dxListEditDecorator-more": "More",
            "dxScrollView-pullingDownText": "Pull down to refresh...",
            "dxScrollView-pulledDownText": "Release to refresh...",
            "dxScrollView-refreshingText": "Refreshing...",
            "dxScrollView-reachBottomText": "Loading...",
            "dxDateBox-simulatedDataPickerTitleTime": "Select time",
            "dxDateBox-simulatedDataPickerTitleDate": "Select date",
            "dxDateBox-simulatedDataPickerTitleDateTime": "Select date and time",
            "dxDateBox-validation-datetime": "Value must be a date or time",
            "dxFileUploader-selectFile": "Select file",
            "dxFileUploader-dropFile": "or Drop file here",
            "dxFileUploader-bytes": "bytes",
            "dxFileUploader-kb": "kb",
            "dxFileUploader-Mb": "Mb",
            "dxFileUploader-Gb": "Gb",
            "dxFileUploader-upload": "Upload",
            "dxFileUploader-uploaded": "Uploaded",
            "dxFileUploader-readyToUpload": "Ready to upload",
            "dxFileUploader-uploadFailedMessage": "Upload failed",
            "dxRangeSlider-ariaFrom": "From {0}",
            "dxRangeSlider-ariaTill": "Till {0}",
            "dxSwitch-onText": "ON",
            "dxSwitch-offText": "OFF",
            "dxForm-optionalMark": "optional"
        }});
    /*! Module core, file widgets-mobile.en.js */
    /*! Module core, file widgets-web.en.js */
    Globalize.addCultureInfo("default", {messages: {
            "dxDataGrid-columnChooserTitle": "Column Chooser",
            "dxDataGrid-columnChooserEmptyText": "Drag a column here to hide it",
            "dxDataGrid-groupContinuesMessage": "Continues on the next page",
            "dxDataGrid-groupContinuedMessage": "Continued from the previous page",
            "dxDataGrid-editingEditRow": "Edit",
            "dxDataGrid-editingSaveRowChanges": "Save",
            "dxDataGrid-editingCancelRowChanges": "Cancel",
            "dxDataGrid-editingDeleteRow": "Delete",
            "dxDataGrid-editingUndeleteRow": "Undelete",
            "dxDataGrid-editingConfirmDeleteMessage": "Are you sure you want to delete this record?",
            "dxDataGrid-editingConfirmDeleteTitle": "",
            "dxDataGrid-validationCancelChanges": "Cancel changes",
            "dxDataGrid-groupPanelEmptyText": "Drag a column header here to group by that column",
            "dxDataGrid-noDataText": "No data",
            "dxDataGrid-searchPanelPlaceholder": "Search...",
            "dxDataGrid-filterRowShowAllText": "(All)",
            "dxDataGrid-filterRowResetOperationText": "Reset",
            "dxDataGrid-filterRowOperationEquals": "Equals",
            "dxDataGrid-filterRowOperationNotEquals": "Does not equal",
            "dxDataGrid-filterRowOperationLess": "Less than",
            "dxDataGrid-filterRowOperationLessOrEquals": "Less than or equal to",
            "dxDataGrid-filterRowOperationGreater": "Greater than",
            "dxDataGrid-filterRowOperationGreaterOrEquals": "Greater than or equal to",
            "dxDataGrid-filterRowOperationStartsWith": "Starts with",
            "dxDataGrid-filterRowOperationContains": "Contains",
            "dxDataGrid-filterRowOperationNotContains": "Does not contain",
            "dxDataGrid-filterRowOperationEndsWith": "Ends with",
            "dxDataGrid-filterRowOperationBetween": "Between",
            "dxDataGrid-filterRowOperationBetweenStartText": "Start",
            "dxDataGrid-filterRowOperationBetweenEndText": "End",
            "dxDataGrid-applyFilterText": "Apply filter",
            "dxDataGrid-trueText": "true",
            "dxDataGrid-falseText": "false",
            "dxDataGrid-sortingAscendingText": "Sort Ascending",
            "dxDataGrid-sortingDescendingText": "Sort Descending",
            "dxDataGrid-sortingClearText": "Clear Sorting",
            "dxDataGrid-editingSaveAllChanges": "Save changes",
            "dxDataGrid-editingCancelAllChanges": "Discard changes",
            "dxDataGrid-editingAddRow": "Add a row",
            "dxDataGrid-summaryMin": "Min: {0}",
            "dxDataGrid-summaryMinOtherColumn": "Min of {1} is {0}",
            "dxDataGrid-summaryMax": "Max: {0}",
            "dxDataGrid-summaryMaxOtherColumn": "Max of {1} is {0}",
            "dxDataGrid-summaryAvg": "Avg: {0}",
            "dxDataGrid-summaryAvgOtherColumn": "Avg of {1} is {0}",
            "dxDataGrid-summarySum": "Sum: {0}",
            "dxDataGrid-summarySumOtherColumn": "Sum of {1} is {0}",
            "dxDataGrid-summaryCount": "Count: {0}",
            "dxDataGrid-columnFixingFix": "Fix",
            "dxDataGrid-columnFixingUnfix": "Unfix",
            "dxDataGrid-columnFixingLeftPosition": "To the left",
            "dxDataGrid-columnFixingRightPosition": "To the right",
            "dxDataGrid-exportTo": "Export to",
            "dxDataGrid-exportToExcel": "Export to Excel file",
            "dxDataGrid-excelFormat": "Excel file",
            "dxDataGrid-selectedRows": "Selected rows",
            "dxDataGrid-headerFilterEmptyValue": "(Blanks)",
            "dxDataGrid-headerFilterOK": "OK",
            "dxDataGrid-headerFilterCancel": "Cancel",
            "dxDataGrid-ariaColumn": "Column",
            "dxDataGrid-ariaValue": "Value",
            "dxDataGrid-ariaFilterCell": "Filter cell",
            "dxDataGrid-ariaCollapse": "Collapse",
            "dxDataGrid-ariaExpand": "Expand",
            "dxDataGrid-ariaDataGrid": "Data grid",
            "dxDataGrid-ariaSearchInGrid": "Search in data grid",
            "dxDataGrid-ariaSelectAll": "Select all",
            "dxDataGrid-ariaSelectRow": "Select row",
            "dxPager-infoText": "Page {0} of {1} ({2} items)",
            "dxPivotGrid-grandTotal": "Grand Total",
            "dxPivotGrid-total": "{0} Total",
            "dxPivotGrid-fieldChooserTitle": "Field Chooser",
            "dxPivotGrid-showFieldChooser": "Show Field Chooser",
            "dxPivotGrid-expandAll": "Expand All",
            "dxPivotGrid-collapseAll": "Collapse All",
            "dxPivotGrid-sortColumnBySummary": "Sort \"{0}\" by This Column",
            "dxPivotGrid-sortRowBySummary": "Sort \"{0}\" by This Row",
            "dxPivotGrid-removeAllSorting": "Remove All Sorting",
            "dxPivotGrid-rowFields": "Row Fields",
            "dxPivotGrid-columnFields": "Column Fields",
            "dxPivotGrid-dataFields": "Data Fields",
            "dxPivotGrid-filterFields": "Filter Fields",
            "dxPivotGrid-allFields": "All Fields",
            "dxScheduler-editorLabelTitle": "Subject",
            "dxScheduler-editorLabelStartDate": "Start Date",
            "dxScheduler-editorLabelEndDate": "End Date",
            "dxScheduler-editorLabelDescription": "Description",
            "dxScheduler-editorLabelRecurrence": "Repeat",
            "dxScheduler-openAppointment": "Open appointment",
            "dxScheduler-recurrenceNever": "Never",
            "dxScheduler-recurrenceDaily": "Daily",
            "dxScheduler-recurrenceWeekly": "Weekly",
            "dxScheduler-recurrenceMonthly": "Monthly",
            "dxScheduler-recurrenceYearly": "Yearly",
            "dxScheduler-recurrenceEvery": "Every",
            "dxScheduler-recurrenceEnd": "End repeat",
            "dxScheduler-recurrenceAfter": "After",
            "dxScheduler-recurrenceOn": "On",
            "dxScheduler-recurrenceRepeatDaily": "day(s)",
            "dxScheduler-recurrenceRepeatWeekly": "week(s)",
            "dxScheduler-recurrenceRepeatMonthly": "month(s)",
            "dxScheduler-recurrenceRepeatYearly": "year(s)",
            "dxScheduler-switcherDay": "Day",
            "dxScheduler-switcherWeek": "Week",
            "dxScheduler-switcherWorkWeek": "Work week",
            "dxScheduler-switcherMonth": "Month",
            "dxScheduler-switcherTimelineDay": "Timeline Day",
            "dxScheduler-switcherTimelineWeek": "Timeline Week",
            "dxScheduler-switcherTimelineWorkWeek": "Timeline Work week",
            "dxScheduler-switcherTimelineMonth": "Timeline Month",
            "dxScheduler-recurrenceRepeatOnDate": "on date",
            "dxScheduler-recurrenceRepeatCount": "occurrence(s)",
            "dxScheduler-allDay": "All day",
            "dxScheduler-confirmRecurrenceEditMessage": "Do you want to edit only this appointment or the whole series?",
            "dxScheduler-confirmRecurrenceDeleteMessage": "Do you want to delete only this appointment or the whole series?",
            "dxScheduler-confirmRecurrenceEditSeries": "Edit series",
            "dxScheduler-confirmRecurrenceDeleteSeries": "Delete series",
            "dxScheduler-confirmRecurrenceEditOccurrence": "Edit appointment",
            "dxScheduler-confirmRecurrenceDeleteOccurrence": "Delete appointment",
            "dxCalendar-todayButtonText": "Today",
            "dxCalendar-ariaWidgetName": "Calendar",
            "dxColorView-ariaRed": "Red",
            "dxColorView-ariaGreen": "Green",
            "dxColorView-ariaBlue": "Blue",
            "dxColorView-ariaAlpha": "Transparency",
            "dxColorView-ariaHex": "Color code"
        }});
    /*! Module core, file coreNamespace.js */
    DevExpress.define("/coreNamespace", ["/version", "/actionExecutors"], function(version) {
        var ns = window.DevExpress = window.DevExpress || {};
        ns.VERSION = version;
        ns.rtlEnabled = false;
        return ns
    });
    /*! Module core, file componentRegistrator.js */
    DevExpress.define("/componentRegistrator", ["jquery", "/errors", "/coreNamespace", "/utils/utils.memorizedCallbacks", "/utils/utils.publicComponent"], function($, errors, coreNamespace, MemorizedCallbacks, publicComponentUtils) {
        var callbacks = new MemorizedCallbacks;
        var registerComponent = function(name, namespace, componentClass) {
                if (!componentClass) {
                    componentClass = namespace;
                    namespace = coreNamespace
                }
                namespace[name] = componentClass;
                componentClass.publicName(name);
                callbacks.fire(name, componentClass)
            };
        registerComponent.callbacks = callbacks;
        var registerJQueryComponent = function(name, componentClass) {
                $.fn[name] = function(options) {
                    var isMemberInvoke = typeof options === "string",
                        result;
                    if (isMemberInvoke) {
                        var memberName = options,
                            memberArgs = $.makeArray(arguments).slice(1);
                        this.each(function() {
                            var instance = componentClass.getInstance(this);
                            if (!instance)
                                throw errors.Error("E0009", name);
                            var member = instance[memberName],
                                memberValue = member.apply(instance, memberArgs);
                            if (result === undefined)
                                result = memberValue
                        })
                    }
                    else {
                        this.each(function() {
                            var instance = componentClass.getInstance(this);
                            if (instance)
                                instance.option(options);
                            else
                                new componentClass(this, options)
                        });
                        result = this
                    }
                    return result
                }
            };
        callbacks.add(registerJQueryComponent);
        return registerComponent
    });
    /*! Module core, file component.js */
    DevExpress.define("/component", ["/class", "/eventsMixin", "/action", "/errors", "/utils/utils.inflector", "/utils/utils.common", "/utils/utils.publicComponent", "/devices"], function(Class, EventsMixin, Action, errors, inflector, commonUtils, publicComponentUtils, devices) {
        var dataUtils = DevExpress.data.utils;
        var cachedGetters = {};
        var cachedSetters = {};
        var Component = Class.inherit({
                _setDeprecatedOptions: function() {
                    this._deprecatedOptions = {}
                },
                _getDeprecatedOptions: function() {
                    return this._deprecatedOptions
                },
                _setOptionAliases: function() {
                    var aliases = this._optionAliases = {};
                    $.each(this._getDeprecatedOptions(), function(optionName, info) {
                        var optionAlias = info.alias;
                        if (optionAlias)
                            aliases[optionName] = optionAlias
                    })
                },
                _getOptionAliases: function() {
                    return this._optionAliases
                },
                _getOptionAliasesByName: function(optionName) {
                    return $.map(this._getOptionAliases(), function(aliasedOption, aliasName) {
                            return optionName === aliasedOption ? aliasName : undefined
                        })
                },
                _getDefaultOptions: function() {
                    return {
                            onInitialized: null,
                            onOptionChanged: null,
                            onDisposing: null,
                            defaultOptionsRules: null
                        }
                },
                _setDefaultOptions: function() {
                    $.extend(this._options, this._getDefaultOptions())
                },
                _defaultOptionsRules: function() {
                    return []
                },
                _setOptionsByDevice: function(userRules) {
                    var rules = this._defaultOptionsRules();
                    if (this._customRules)
                        rules = rules.concat(this._customRules);
                    if ($.isArray(userRules))
                        rules = rules.concat(userRules);
                    this.option(this._convertRulesToOptions(rules))
                },
                _convertRulesToOptions: function(rules) {
                    var options = {};
                    var currentDevice = devices.current();
                    var deviceMatch = function(device, filter) {
                            filter = $.makeArray(filter);
                            return filter.length === 1 && $.isEmptyObject(filter[0]) || commonUtils.findBestMatches(device, filter).length > 0
                        };
                    $.each(rules, function(index, rule) {
                        var deviceFilter = rule.device || {},
                            match;
                        if ($.isFunction(deviceFilter))
                            match = deviceFilter(currentDevice);
                        else
                            match = deviceMatch(currentDevice, deviceFilter);
                        if (match)
                            $.extend(options, rule.options)
                    });
                    return options
                },
                _isInitialOptionValue: function(name) {
                    var isCustomOption = this._customRules && this._convertRulesToOptions(this._customRules).hasOwnProperty(name);
                    var isInitialOption = this.option(name) === this._initialOptions[name];
                    return !isCustomOption && isInitialOption
                },
                _setOptionsByReference: function() {
                    this._optionsByReference = {}
                },
                _getOptionsByReference: function() {
                    return this._optionsByReference
                },
                ctor: function(options) {
                    this.NAME = this.constructor.publicName();
                    options = options || {};
                    this._options = {};
                    this._updateLockCount = 0;
                    this._optionChangedCallbacks = options._optionChangedCallbacks || $.Callbacks();
                    this._disposingCallbacks = options._disposingCallbacks || $.Callbacks();
                    this.beginUpdate();
                    try {
                        this._suppressDeprecatedWarnings();
                        this._setOptionsByReference();
                        this._setDeprecatedOptions();
                        this._setOptionAliases();
                        this._setDefaultOptions();
                        this._setOptionsByDevice(options.defaultOptionsRules);
                        this._resumeDeprecatedWarnings();
                        this._initialOptions = $.extend({}, this.option());
                        this._initOptions(options)
                    }
                    finally {
                        this.endUpdate()
                    }
                },
                _initOptions: function(options) {
                    this.option(options)
                },
                _optionValuesEqual: function(name, oldValue, newValue) {
                    oldValue = dataUtils.toComparable(oldValue, true);
                    newValue = dataUtils.toComparable(newValue, true);
                    if (oldValue && newValue && oldValue.jquery && newValue.jquery)
                        return newValue.is(oldValue);
                    var oldValueIsNaN = oldValue !== oldValue,
                        newValueIsNaN = newValue !== newValue;
                    if (oldValueIsNaN && newValueIsNaN)
                        return true;
                    if (oldValue === null || typeof oldValue !== "object")
                        return oldValue === newValue;
                    return false
                },
                _init: function() {
                    this._createOptionChangedAction();
                    this.on("optionChanged", function(args) {
                        this._optionChangedCallbacks.fireWith(this, [args])
                    });
                    this.on("disposing", function(args) {
                        this._disposingCallbacks.fireWith(this, [args])
                    })
                },
                _createOptionChangedAction: function() {
                    this._optionChangedAction = this._createActionByOption("onOptionChanged", {excludeValidators: ["disabled", "readOnly", "designMode"]})
                },
                _createDisposingAction: function() {
                    this._disposingAction = this._createActionByOption("onDisposing", {excludeValidators: ["disabled", "readOnly", "designMode"]})
                },
                _optionChanged: function(args) {
                    switch (args.name) {
                        case"onDisposing":
                        case"onInitialized":
                            break;
                        case"onOptionChanged":
                            this._createOptionChangedAction();
                            break;
                        case"defaultOptionsRules":
                            break
                    }
                },
                _dispose: function() {
                    this._createDisposingAction();
                    this._disposingAction();
                    this._disposeEvents();
                    this._disposed = true
                },
                instance: function() {
                    return this
                },
                beginUpdate: function() {
                    this._updateLockCount++
                },
                endUpdate: function() {
                    this._updateLockCount = Math.max(this._updateLockCount - 1, 0);
                    if (!this._updateLockCount)
                        if (!this._initializing && !this._initialized) {
                            this._initializing = true;
                            try {
                                this._init()
                            }
                            finally {
                                this._initializing = false;
                                this._updateLockCount++;
                                this._createActionByOption("onInitialized", {excludeValidators: ["disabled", "readOnly", "designMode"]})();
                                this._updateLockCount--;
                                this._initialized = true
                            }
                        }
                },
                _logWarningIfDeprecated: function(option) {
                    var info = this._getDeprecatedOptions()[option];
                    if (info && !this._deprecatedOptionsSuppressed)
                        this._logDeprecatedWarning(option, info)
                },
                _logDeprecatedWarningCount: 0,
                _logDeprecatedWarning: function(option, info) {
                    var message = info.message || "Use the '" + info.alias + "' option instead";
                    errors.log("W0001", this.NAME, option, info.since, message);
                    ++this._logDeprecatedWarningCount
                },
                _suppressDeprecatedWarnings: function() {
                    this._deprecatedOptionsSuppressed = true
                },
                _resumeDeprecatedWarnings: function() {
                    this._deprecatedOptionsSuppressed = false
                },
                _notifyOptionChanged: function(option, value, previousValue) {
                    var that = this;
                    if (this._initialized)
                        $.each(that._getOptionAliasesByName(option).concat([option]), function(index, name) {
                            var args = {
                                    name: name.split(/[.\[]/)[0],
                                    fullName: name,
                                    value: value,
                                    previousValue: previousValue
                                };
                            that._optionChangedAction($.extend({}, args));
                            if (!that._disposed)
                                that._optionChanged(args)
                        })
                },
                initialOption: function(optionName) {
                    var options = this._initialOptions;
                    return options[optionName]
                },
                _defaultActionConfig: function() {
                    return {
                            context: this,
                            component: this
                        }
                },
                _defaultActionArgs: function() {
                    return {component: this}
                },
                _createAction: function(actionSource, config) {
                    var that = this,
                        action;
                    return function(e) {
                            if (!arguments.length)
                                e = {};
                            if (e instanceof $.Event)
                                throw Error("Action must be executed with jQuery.Event like action({ jQueryEvent: event })");
                            if (!$.isPlainObject(e))
                                e = {actionValue: e};
                            action = action || new Action(actionSource, $.extend(config, that._defaultActionConfig()));
                            return action.execute.call(action, $.extend(e, that._defaultActionArgs()))
                        }
                },
                _createActionByOptionCore: function(optionName, config) {
                    config = config || {};
                    if (typeof optionName !== "string")
                        throw errors.Error("E0008");
                    var matches = /^on(\w+)/.exec(optionName);
                    if (matches) {
                        var eventName = inflector.camelize(matches[1]),
                            beforeExecute = config.beforeExecute || $.noop,
                            that = this;
                        config.beforeExecute = function(args) {
                            that.fireEvent(eventName, args.args);
                            return beforeExecute.apply(this, arguments)
                        }
                    }
                    else
                        throw Error("The '" + optionName + "' option name should start with 'on' prefix");
                    this._suppressDeprecatedWarnings();
                    var action = this._createAction(this.option(optionName), config);
                    this._resumeDeprecatedWarnings();
                    return action
                },
                _createActionByOption: function(optionName, config) {
                    var that = this,
                        action;
                    var result = function() {
                            action = action || that._createActionByOptionCore(optionName, config);
                            return action.apply(that, arguments)
                        };
                    var onActionCreated = this.option("onActionCreated") || $.noop;
                    result = onActionCreated(this, result, config) || result;
                    return result
                },
                option: function(options) {
                    var that = this,
                        name = options,
                        value = arguments[1],
                        optionAliases = this._getOptionAliases();
                    var normalizeOptionName = function(name) {
                            if (name) {
                                that._logWarningIfDeprecated(name);
                                if (optionAliases[name])
                                    name = optionAliases[name]
                            }
                            return name
                        };
                    var getOptionValue = function(name, unwrapObservables) {
                            if (!cachedGetters[name])
                                cachedGetters[name] = dataUtils.compileGetter(name);
                            return cachedGetters[name](that._options, {
                                    functionsAsIs: true,
                                    unwrapObservables: unwrapObservables
                                })
                        };
                    var setOptionValue = function(name, value) {
                            if (!cachedSetters[name])
                                cachedSetters[name] = dataUtils.compileSetter(name);
                            cachedSetters[name](that._options, value, {
                                functionsAsIs: true,
                                merge: !that._getOptionsByReference()[name],
                                unwrapObservables: false
                            });
                            if ($.isPlainObject(value))
                                $.each(value, function(optionName, optionValue) {
                                    optionName = name + "." + optionName;
                                    var normalizedOptionName = normalizeOptionName(optionName);
                                    if (normalizedOptionName !== optionName) {
                                        setOptionValue(optionName, undefined);
                                        setOptionValue(normalizedOptionName, optionValue)
                                    }
                                })
                        };
                    if (arguments.length < 2 && $.type(name) !== "object") {
                        name = normalizeOptionName(name);
                        return getOptionValue(name)
                    }
                    if (typeof name === "string") {
                        options = {};
                        options[name] = value
                    }
                    that.beginUpdate();
                    try {
                        $.each(options, function(name, value) {
                            name = normalizeOptionName(name);
                            var prevValue = getOptionValue(name, false);
                            if (that._optionValuesEqual(name, prevValue, value))
                                return;
                            setOptionValue(name, value);
                            that._notifyOptionChanged(name, value, prevValue)
                        })
                    }
                    finally {
                        that.endUpdate()
                    }
                }
            }).include(EventsMixin);
        Component.publicName = publicComponentUtils.getName;
        return Component
    });
    /*! Module core, file domComponent.js */
    DevExpress.define("/domComponent", ["jquery", "/component", "/errors", "/utils/utils.window", "/utils/utils.common", "/utils/utils.publicComponent", "/ui/events/ui.events.remove"], function($, Component, errors, windowUtils, commonUtils, publicComponentUtils, removeEvent) {
        var abstract = Component.abstract,
            windowResizeCallbacks = windowUtils.resizeCallbacks;
        var RTL_DIRECTION_CLASS = "dx-rtl",
            VISIBILITY_CHANGE_CLASS = "dx-visibility-change-handler",
            VISIBILITY_CHANGE_EVENTNAMESPACE = "VisibilityChange";
        var DOMComponent = Component.inherit({
                _getDefaultOptions: function() {
                    return $.extend(this.callBase(), {
                            width: undefined,
                            height: undefined,
                            rtlEnabled: DevExpress.rtlEnabled,
                            disabled: false
                        })
                },
                ctor: function(element, options) {
                    this._$element = $(element);
                    publicComponentUtils.attachInstanceToElement(this._$element, this.constructor.publicName(), this);
                    this.element().one(removeEvent.name, $.proxy(function() {
                        this._dispose()
                    }, this));
                    this.callBase(options)
                },
                _visibilityChanged: abstract,
                _dimensionChanged: abstract,
                _init: function() {
                    this.callBase();
                    this._attachWindowResizeCallback()
                },
                _attachWindowResizeCallback: function() {
                    if (this._isDimensionChangeSupported()) {
                        var windowResizeCallBack = this._windowResizeCallBack = $.proxy(this._dimensionChanged, this);
                        windowResizeCallbacks.add(windowResizeCallBack)
                    }
                },
                _isDimensionChangeSupported: function() {
                    return this._dimensionChanged !== abstract
                },
                _render: function() {
                    this._toggleRTLDirection(this.option("rtlEnabled"));
                    this._renderVisibilityChange();
                    this._renderDimensions()
                },
                _renderVisibilityChange: function() {
                    if (this._isDimensionChangeSupported())
                        this._attachDimensionChangeHandlers();
                    if (!this._isVisibilityChangeSupported())
                        return;
                    this.element().addClass(VISIBILITY_CHANGE_CLASS);
                    this._attachVisiblityChangeHandlers()
                },
                _renderDimensions: function() {
                    var width = this.option("width"),
                        height = this.option("height"),
                        $element = this.element();
                    $element.outerWidth(width);
                    $element.outerHeight(height)
                },
                _attachDimensionChangeHandlers: function() {
                    var that = this;
                    var resizeEventName = "dxresize." + this.NAME + VISIBILITY_CHANGE_EVENTNAMESPACE;
                    that.element().off(resizeEventName).on(resizeEventName, function() {
                        that._dimensionChanged()
                    })
                },
                _attachVisiblityChangeHandlers: function() {
                    var that = this;
                    var hiddingEventName = "dxhiding." + this.NAME + VISIBILITY_CHANGE_EVENTNAMESPACE;
                    var shownEventName = "dxshown." + this.NAME + VISIBILITY_CHANGE_EVENTNAMESPACE;
                    that._isHidden = !that._isVisible();
                    that.element().off(hiddingEventName).on(hiddingEventName, function() {
                        that._checkVisibilityChanged("hiding")
                    }).off(shownEventName).on(shownEventName, function() {
                        that._checkVisibilityChanged("shown")
                    })
                },
                _isVisible: function() {
                    return this.element().is(":visible")
                },
                _checkVisibilityChanged: function(event) {
                    if (event === "hiding" && this._isVisible() && !this._isHidden) {
                        this._visibilityChanged(false);
                        this._isHidden = true
                    }
                    else if (event === "shown" && this._isVisible() && this._isHidden) {
                        this._isHidden = false;
                        this._visibilityChanged(true)
                    }
                },
                _isVisibilityChangeSupported: function() {
                    return this._visibilityChanged !== abstract
                },
                _clean: $.noop,
                _modelByElement: function() {
                    var modelByElement = this.option("modelByElement") || $.noop;
                    return modelByElement(this.element())
                },
                _invalidate: function() {
                    if (!this._updateLockCount)
                        throw errors.Error("E0007");
                    this._requireRefresh = true
                },
                _refresh: function() {
                    this._clean();
                    this._render()
                },
                _dispose: function() {
                    this.callBase();
                    this._clean();
                    this._detachWindowResizeCallback()
                },
                _detachWindowResizeCallback: function() {
                    if (this._isDimensionChangeSupported())
                        windowResizeCallbacks.remove(this._windowResizeCallBack)
                },
                _toggleRTLDirection: function(rtl) {
                    this.element().toggleClass(RTL_DIRECTION_CLASS, rtl)
                },
                _createComponent: function(element, component, config) {
                    var that = this;
                    config = config || {};
                    var synchronizableOptions = $.grep(["rtlEnabled", "disabled"], function(value) {
                            return !(value in config)
                        });
                    var nestedComponentOptions = that.option("nestedComponentOptions") || $.noop;
                    that._extendConfig(config, $.extend({
                        rtlEnabled: this.option("rtlEnabled"),
                        disabled: this.option("disabled")
                    }, nestedComponentOptions(this)));
                    var instance;
                    if (commonUtils.isString(component)) {
                        var $element = $(element)[component](config);
                        instance = $element[component]("instance")
                    }
                    else {
                        instance = component.getInstance(element);
                        if (instance)
                            instance.option(config);
                        else
                            instance = new component(element, config)
                    }
                    if (instance) {
                        var optionChangedHandler = function(args) {
                                if ($.inArray(args.name, synchronizableOptions) >= 0)
                                    instance.option(args.name, args.value)
                            };
                        that.on("optionChanged", optionChangedHandler);
                        instance.on("disposing", function() {
                            that.off("optionChanged", optionChangedHandler)
                        })
                    }
                    return instance
                },
                _extendConfig: function(config, extendConfig) {
                    $.each(extendConfig, function(key, value) {
                        config[key] = config.hasOwnProperty(key) ? config[key] : value
                    })
                },
                _defaultActionConfig: function() {
                    return $.extend(this.callBase(), {context: this._modelByElement(this.element())})
                },
                _defaultActionArgs: function() {
                    var element = this.element(),
                        model = this._modelByElement(this.element());
                    return $.extend(this.callBase(), {
                            element: element,
                            model: model
                        })
                },
                _optionChanged: function(args) {
                    switch (args.name) {
                        case"width":
                        case"height":
                            this._renderDimensions();
                            break;
                        case"rtlEnabled":
                            this._invalidate();
                            break;
                        case"disabled":
                            break;
                        default:
                            this.callBase(args);
                            break
                    }
                },
                endUpdate: function() {
                    var requireRender = !this._initializing && !this._initialized;
                    this.callBase.apply(this, arguments);
                    if (!this._updateLockCount)
                        if (requireRender)
                            this._render();
                        else if (this._requireRefresh) {
                            this._requireRefresh = false;
                            this._refresh()
                        }
                },
                element: function() {
                    return this._$element
                }
            });
        DOMComponent.getInstance = function($element) {
            return publicComponentUtils.getInstanceByElement($element, this.publicName())
        };
        DOMComponent.defaultOptions = function(rule) {
            this.prototype._customRules = this.prototype._customRules || [];
            this.prototype._customRules.push(rule)
        };
        return DOMComponent
    });
    /*! Module core, file version.js */
    DevExpress.define("/version", [], function() {
        return "15.2.4"
    });
    /*! Module core, file errors.js */
    DevExpress.define("/errors", ["/utils/utils.error"], function(errorUtils) {
        return errorUtils({
                E0001: "Method is not implemented",
                E0002: "Member name collision: {0}",
                E0003: "A class must be instantiated using the 'new' keyword",
                E0004: "The NAME property of the component is not specified",
                E0005: "Unknown device",
                E0006: "Unknown endpoint key is requested",
                E0007: "'Invalidate' method is called outside the update transaction",
                E0008: "Type of the option name is not appropriate to create an action",
                E0009: "Component '{0}' has not been initialized for an element",
                E0010: "Animation configuration with the '{0}' type requires '{1}' configuration as {2}",
                E0011: "Unknown animation type '{0}'",
                E0012: "jQuery version is too old. Please upgrade jQuery to 1.10.0 or later",
                E0013: "KnockoutJS version is too old. Please upgrade KnockoutJS to 2.3.0 or later",
                E0014: "The 'release' method shouldn't be called for an unlocked Lock object",
                E0015: "Queued task returned an unexpected result",
                E0017: "Event namespace is not defined",
                E0018: "DevExpress.ui.DevExpressPopup widget is required",
                E0020: "Template engine '{0}' is not supported",
                E0021: "Unknown theme is set: {0}",
                E0022: "LINK[rel=DevExpress-theme] tags must go before DevExpress included scripts",
                E0023: "Template name is not specified",
                E0100: "Unknown validation type is detected",
                E0101: "Misconfigured range validation rule is detected",
                E0102: "Misconfigured comparison validation rule is detected",
                E0110: "Unknown validation group is detected",
                E0120: "Adapter for a DevExpressValidator component cannot be configured",
                W0000: "'{0}' is deprecated in {1}. {2}",
                W0001: "{0} - '{1}' option is deprecated in {2}. {3}",
                W0002: "{0} - '{1}' method is deprecated in {2}. {3}",
                W0003: "{0} - '{1}' property is deprecated in {2}. {3}",
                W0004: "Timeout for theme loading is over: {0}",
                W0005: "'{0}' event is deprecated in {1}. {2}",
                W0006: "Invalid recurrence rule: '{0}'",
                W0007: "The cellDuration option value is invalid"
            })
    });
    /*! Module core, file eventsMixin.js */
    DevExpress.define("/eventsMixin", ["jquery", "/errors"], function($, errors) {
        return {
                ctor: function() {
                    this._events = {}
                },
                fireEvent: function(eventName, eventArgs) {
                    var callbacks = this._events[eventName];
                    if (callbacks)
                        callbacks.fireWith(this, eventArgs);
                    return this
                },
                on: function(eventName, eventHandler) {
                    if ($.isPlainObject(eventName))
                        $.each(eventName, $.proxy(function(e, h) {
                            this.on(e, h)
                        }, this));
                    else {
                        var callbacks = this._events[eventName],
                            addFn;
                        if (!callbacks) {
                            callbacks = $.Callbacks();
                            this._events[eventName] = callbacks
                        }
                        addFn = callbacks.originalAdd || callbacks.add;
                        addFn.call(callbacks, eventHandler)
                    }
                    return this
                },
                off: function(eventName, eventHandler) {
                    var callbacks = this._events[eventName];
                    if (callbacks)
                        if ($.isFunction(eventHandler))
                            callbacks.remove(eventHandler);
                        else
                            callbacks.empty();
                    return this
                },
                _disposeEvents: function() {
                    $.each(this._events, function() {
                        this.empty()
                    })
                }
            }
    });
    /*! Module core, file class.js */
    DevExpress.define("/class", ["jquery", "/errors"], function($, errors) {
        var wrapOverridden = function(baseProto, methodName, method) {
                return function() {
                        var prevCallBase = this.callBase;
                        this.callBase = baseProto[methodName];
                        try {
                            return method.apply(this, arguments)
                        }
                        finally {
                            this.callBase = prevCallBase
                        }
                    }
            };
        var clonePrototype = function(obj) {
                var func = function(){};
                func.prototype = obj.prototype;
                return new func
            };
        var redefine = function(members) {
                var that = this;
                if (!members)
                    return that;
                var memberNames = $.map(members, function(_, k) {
                        return k
                    });
                $.each(["toString", "toLocaleString", "valueOf"], function() {
                    if (members[this])
                        memberNames.push(this)
                });
                $.each(memberNames, function() {
                    var overridden = $.isFunction(that.prototype[this]) && $.isFunction(members[this]);
                    that.prototype[this] = overridden ? wrapOverridden(that.parent.prototype, this, members[this]) : members[this]
                });
                return that
            };
        var include = function() {
                var classObj = this;
                $.each(arguments, function() {
                    if (this.ctor)
                        classObj._includedCtors.push(this.ctor);
                    if (this.postCtor)
                        classObj._includedPostCtors.push(this.postCtor);
                    for (var name in this) {
                        if (name === "ctor" || name === "postCtor")
                            continue;
                        if (name in classObj.prototype)
                            throw errors.Error("E0002", name);
                        classObj.prototype[name] = this[name]
                    }
                });
                return classObj
            };
        var subclassOf = function(parentClass) {
                if (this.parent === parentClass)
                    return true;
                if (!this.parent || !this.parent.subclassOf)
                    return false;
                return this.parent.subclassOf(parentClass)
            };
        var abstract = function() {
                throw errors.Error("E0001");
            };
        var copyStatic = function() {
                var hasOwn = Object.prototype.hasOwnProperty;
                return function(source, destination) {
                        $.each(source, function(key) {
                            if (!hasOwn.call(source, key))
                                return;
                            destination[key] = source[key]
                        })
                    }
            }();
        var classImpl = function(){};
        classImpl.inherit = function(members) {
            var inheritor = function() {
                    if (!this || this === window || typeof this.constructor !== "function")
                        throw errors.Error("E0003");
                    var instance = this,
                        ctor = instance.ctor;
                    $.each(instance.constructor._includedCtors, function() {
                        this.call(instance)
                    });
                    if (ctor)
                        ctor.apply(instance, arguments);
                    $.each(instance.constructor._includedPostCtors, function() {
                        this.call(instance)
                    })
                };
            inheritor.prototype = clonePrototype(this);
            copyStatic(this, inheritor);
            inheritor.inherit = this.inherit;
            inheritor.abstract = abstract;
            inheritor.redefine = redefine;
            inheritor.include = include;
            inheritor.subclassOf = subclassOf;
            inheritor.parent = this;
            inheritor._includedCtors = this._includedCtors ? this._includedCtors.slice(0) : [];
            inheritor._includedPostCtors = this._includedPostCtors ? this._includedPostCtors.slice(0) : [];
            inheritor.prototype.constructor = inheritor;
            inheritor.redefine(members);
            return inheritor
        };
        classImpl.abstract = abstract;
        return classImpl
    });
    /*! Module core, file devices.js */
    DevExpress.define("/devices", ["jquery", "/class", "/eventsMixin", "/errors", "/utils/utils.storage", "/utils/utils.viewPort", "/utils/utils.window"], function($, Class, EventsMixin, errors, storageUtils, viewPort, windowUtils) {
        var KNOWN_UA_TABLE = {
                iPhone: "iPhone",
                iPhone5: "iPhone",
                iPhone6: "iPhone",
                iPhone6plus: "iPhone",
                iPad: "iPad",
                iPadMini: "iPad Mini",
                androidPhone: "Android Mobile",
                androidTablet: "Android",
                win8: "MSAppHost",
                win8Phone: "Windows Phone 8.0",
                msSurface: "MSIE ARM Tablet PC",
                desktop: "desktop",
                win10Phone: "Windows Phone 10.0",
                win10: "MSAppHost/3.0"
            };
        var DEFAULT_DEVICE = {
                deviceType: "",
                platform: "",
                version: [],
                phone: false,
                tablet: false,
                android: false,
                ios: false,
                win: false,
                generic: false,
                grade: "A",
                mac: false
            };
        $.extend(DEFAULT_DEVICE, {
            platform: "generic",
            deviceType: "desktop",
            generic: true
        });
        var uaParsers = {
                win: function(userAgent) {
                    var isPhone = /windows phone/i.test(userAgent) || userAgent.match(/WPDesktop/),
                        isTablet = !isPhone && /arm(.*)trident/i.test(userAgent),
                        isDesktop = !isPhone && !isTablet && /msapphost/i.test(userAgent);
                    if (!(isPhone || isTablet || isDesktop))
                        return;
                    var matches = userAgent.match(/windows phone (\d+).(\d+)/i) || userAgent.match(/windows nt (\d+).(\d+)/i),
                        version = [];
                    if (matches)
                        version.push(parseInt(matches[1], 10), parseInt(matches[2], 10));
                    else {
                        matches = userAgent.match(/msapphost(\/(\d+).(\d+))?/i);
                        matches && version.push(parseInt(matches[2], 10) === 3 ? 10 : 8)
                    }
                    return {
                            deviceType: isPhone ? "phone" : isTablet ? "tablet" : "desktop",
                            platform: "win",
                            version: version,
                            grade: "A"
                        }
                },
                ios: function(userAgent) {
                    if (!/ip(hone|od|ad)/i.test(userAgent))
                        return;
                    var isPhone = /ip(hone|od)/i.test(userAgent),
                        matches = userAgent.match(/os (\d+)_(\d+)_?(\d+)?/i),
                        version = matches ? [parseInt(matches[1], 10), parseInt(matches[2], 10), parseInt(matches[3] || 0, 10)] : [],
                        isIPhone4 = window.screen.height === 960 / 2,
                        grade = isIPhone4 ? "B" : "A";
                    return {
                            deviceType: isPhone ? "phone" : "tablet",
                            platform: "ios",
                            version: version,
                            grade: grade
                        }
                },
                android: function(userAgent) {
                    if (!/android|htc_|silk/i.test(userAgent))
                        return;
                    var isPhone = /mobile/i.test(userAgent),
                        matches = userAgent.match(/android (\d+)\.(\d+)\.?(\d+)?/i),
                        version = matches ? [parseInt(matches[1], 10), parseInt(matches[2], 10), parseInt(matches[3] || 0, 10)] : [],
                        worseThan4_4 = version.length > 1 && (version[0] < 4 || version[0] === 4 && version[1] < 4),
                        grade = worseThan4_4 ? "B" : "A";
                    return {
                            deviceType: isPhone ? "phone" : "tablet",
                            platform: "android",
                            version: version,
                            grade: grade
                        }
                }
            };
        var Devices = Class.inherit({
                ctor: function(options) {
                    this._window = options && options.window || window;
                    this._realDevice = this._getDevice();
                    this._currentDevice = undefined;
                    this._currentOrientation = undefined;
                    this.changed = $.Callbacks();
                    this._recalculateOrientation();
                    windowUtils.resizeCallbacks.add($.proxy(this._recalculateOrientation, this))
                },
                current: function(deviceOrName) {
                    if (deviceOrName) {
                        this._currentDevice = this._getDevice(deviceOrName);
                        this._forced = true;
                        this.changed.fire()
                    }
                    else {
                        if (!this._currentDevice) {
                            deviceOrName = undefined;
                            try {
                                deviceOrName = this._getDeviceOrNameFromWindowScope()
                            }
                            catch(e) {
                                deviceOrName = this._getDeviceNameFromSessionStorage()
                            }
                            finally {
                                if (!deviceOrName)
                                    deviceOrName = this._getDeviceNameFromSessionStorage();
                                if (deviceOrName)
                                    this._forced = true
                            }
                            this._currentDevice = this._getDevice(deviceOrName)
                        }
                        return this._currentDevice
                    }
                },
                real: function() {
                    var forceDevice = arguments[0];
                    if ($.isPlainObject(forceDevice)) {
                        $.extend(this._realDevice, forceDevice);
                        return
                    }
                    return $.extend({}, this._realDevice)
                },
                orientation: function() {
                    return this._currentOrientation
                },
                isForced: function() {
                    return this._forced
                },
                isRippleEmulator: function() {
                    return !!this._window.tinyHippos
                },
                _getCssClasses: function(device) {
                    var result = [];
                    var realDevice = this._realDevice;
                    device = device || this.current();
                    if (device.deviceType) {
                        result.push("dx-device-" + device.deviceType);
                        if (device.deviceType !== "desktop")
                            result.push("dx-device-mobile")
                    }
                    result.push("dx-device-" + realDevice.platform);
                    if (realDevice.version && realDevice.version.length)
                        result.push("dx-device-" + realDevice.platform + "-" + realDevice.version[0]);
                    if (devices.isSimulator())
                        result.push("dx-simulator");
                    if (DevExpress.rtlEnabled)
                        result.push("dx-rtl");
                    return result
                },
                attachCssClasses: function(element, device) {
                    this._deviceClasses = this._getCssClasses(device).join(" ");
                    $(element).addClass(this._deviceClasses)
                },
                detachCssClasses: function(element) {
                    $(element).removeClass(this._deviceClasses)
                },
                isSimulator: function() {
                    try {
                        return this._isSimulator || this._window.top !== this._window.self && this._window.top["dx-force-device"] || this.isRippleEmulator()
                    }
                    catch(e) {
                        return false
                    }
                },
                forceSimulator: function() {
                    this._isSimulator = true
                },
                _getDevice: function(deviceName) {
                    if (deviceName === "genericPhone")
                        deviceName = {
                            deviceType: "phone",
                            platform: "generic",
                            generic: true
                        };
                    if ($.isPlainObject(deviceName))
                        return this._fromConfig(deviceName);
                    else {
                        var ua;
                        if (deviceName) {
                            ua = KNOWN_UA_TABLE[deviceName];
                            if (!ua)
                                throw errors.Error("E0005");
                        }
                        else
                            ua = navigator.userAgent;
                        return this._fromUA(ua)
                    }
                },
                _getDeviceOrNameFromWindowScope: function() {
                    var result;
                    if (this._window.top["dx-force-device-object"] || this._window.top["dx-force-device"])
                        result = this._window.top["dx-force-device-object"] || this._window.top["dx-force-device"];
                    return result
                },
                _getDeviceNameFromSessionStorage: function() {
                    var sessionStorage = storageUtils.sessionStorage();
                    if (!sessionStorage)
                        return;
                    var deviceOrName = sessionStorage.getItem("dx-force-device");
                    try {
                        return $.parseJSON(deviceOrName)
                    }
                    catch(ex) {
                        return deviceOrName
                    }
                },
                _fromConfig: function(config) {
                    var result = $.extend({}, DEFAULT_DEVICE, this._currentDevice, config),
                        shortcuts = {
                            phone: result.deviceType === "phone",
                            tablet: result.deviceType === "tablet",
                            android: result.platform === "android",
                            ios: result.platform === "ios",
                            win: result.platform === "win",
                            generic: result.platform === "generic"
                        };
                    return $.extend(result, shortcuts)
                },
                _fromUA: function(ua) {
                    var config;
                    $.each(uaParsers, function(platform, parser) {
                        config = parser(ua);
                        return !config
                    });
                    if (config)
                        return this._fromConfig(config);
                    var isMac = /(mac os)/.test(ua.toLowerCase()),
                        deviceWithOS = DEFAULT_DEVICE;
                    deviceWithOS.mac = isMac;
                    return deviceWithOS
                },
                _changeOrientation: function() {
                    var $window = $(this._window),
                        orientation = $window.height() > $window.width() ? "portrait" : "landscape";
                    if (this._currentOrientation === orientation)
                        return;
                    this._currentOrientation = orientation;
                    this.fireEvent("orientationChanged", [{orientation: orientation}])
                },
                _recalculateOrientation: function() {
                    var windowWidth = $(this._window).width();
                    if (this._currentWidth === windowWidth)
                        return;
                    this._currentWidth = windowWidth;
                    this._changeOrientation()
                }
            }).include(EventsMixin);
        var devices = new Devices;
        viewPort.changeCallback.add(function(viewPort, prevViewport) {
            devices.detachCssClasses(prevViewport);
            devices.attachCssClasses(viewPort)
        });
        return devices
    });
    /*! Module core, file action.js */
    DevExpress.define("/action", ["jquery", "/class"], function($, Class) {
        var Action = Class.inherit({
                ctor: function(action, config) {
                    config = config || {};
                    this._action = action;
                    this._context = config.context || window;
                    this._beforeExecute = config.beforeExecute;
                    this._afterExecute = config.afterExecute;
                    this._component = config.component;
                    this._validatingTargetName = config.validatingTargetName;
                    var excludeValidators = this._excludeValidators = {};
                    $.each(config.excludeValidators || [], function(_, name) {
                        excludeValidators[name] = true
                    })
                },
                execute: function() {
                    var e = {
                            action: this._action,
                            args: Array.prototype.slice.call(arguments),
                            context: this._context,
                            component: this._component,
                            validatingTargetName: this._validatingTargetName,
                            cancel: false,
                            handled: false
                        };
                    var beforeExecute = this._beforeExecute,
                        afterExecute = this._afterExecute;
                    if (!this._validateAction(e))
                        return;
                    beforeExecute && beforeExecute.call(this._context, e);
                    if (e.cancel)
                        return;
                    var result = this._executeAction(e);
                    var argsBag = e.args[0];
                    if (argsBag && argsBag.cancel)
                        return;
                    afterExecute && afterExecute.call(this._context, e);
                    return result
                },
                _validateAction: function(e) {
                    var excludeValidators = this._excludeValidators,
                        executors = Action.executors;
                    for (var name in executors)
                        if (!excludeValidators[name]) {
                            var executor = executors[name];
                            if (executor.validate)
                                executor.validate(e);
                            if (e.cancel)
                                return false
                        }
                    return true
                },
                _executeAction: function(e) {
                    var result,
                        executors = Action.executors;
                    for (var name in executors) {
                        var executor = executors[name];
                        if (executor.execute)
                            executor.execute(e);
                        if (e.handled) {
                            result = e.result;
                            break
                        }
                    }
                    return result
                }
            });
        Action.executors = {};
        Action.registerExecutor = function(name, executor) {
            if ($.isPlainObject(name)) {
                $.each(name, Action.registerExecutor);
                return
            }
            Action.executors[name] = executor
        };
        Action.unregisterExecutor = function() {
            var args = $.makeArray(arguments);
            $.each(args, function() {
                delete Action.executors[this]
            })
        };
        return Action
    });
    /*! Module core, file actionExecutors.js */
    DevExpress.define("/actionExecutors", ["jquery", "/action"], function($, Action) {
        Action.registerExecutor({
            undefined: {execute: function(e) {
                    if (!e.action) {
                        e.result = undefined;
                        e.handled = true
                    }
                }},
            func: {execute: function(e) {
                    if ($.isFunction(e.action)) {
                        e.result = e.action.call(e.context, e.args[0]);
                        e.handled = true
                    }
                }},
            url: {execute: function(e) {
                    if (typeof e.action === "string" && e.action.charAt(0) !== "#")
                        document.location = e.action
                }},
            hash: {execute: function(e) {
                    if (typeof e.action === "string" && e.action.charAt(0) === "#")
                        document.location.hash = e.action
                }}
        })
    });
    /*! Module core, file animator.js */
    DevExpress.define("/animator", ["jquery", "/class", "/utils/utils.animationFrame"], function($, Class, animationFrame) {
        var abstract = Class.abstract;
        return Class.inherit({
                ctor: function() {
                    this._finished = true;
                    this._stopped = false;
                    this._proxiedStepCore = $.proxy(this._stepCore, this)
                },
                start: function() {
                    this._stopped = false;
                    this._finished = false;
                    this._stepCore()
                },
                stop: function() {
                    this._stopped = true;
                    animationFrame.cancel(this._stepAnimationFrame)
                },
                _stepCore: function() {
                    if (this._isStopped()) {
                        this._stop();
                        return
                    }
                    if (this._isFinished()) {
                        this._finished = true;
                        this._complete();
                        return
                    }
                    this._step();
                    this._stepAnimationFrame = animationFrame.request(this._proxiedStepCore)
                },
                _step: abstract,
                _isFinished: $.noop,
                _stop: $.noop,
                _complete: $.noop,
                _isStopped: function() {
                    return this._stopped
                },
                inProgress: function() {
                    return !(this._stopped || this._finished)
                }
            })
    });
    /*! Module core, file endpointSelector.js */
    DevExpress.define("/endpointSelector", ["jquery", "/errors", "/utils/utils.proxyUrlFormatter"], function($, errors, proxyUrlFormatter) {
        var location = window.location,
            IS_WINJS_ORIGIN = location.protocol === "ms-appx:",
            IS_LOCAL_ORIGIN = isLocalHostName(location.hostname);
        function isLocalHostName(url) {
            return /^(localhost$|127\.)/i.test(url)
        }
        var EndpointSelector = function(config) {
                this.config = config
            };
        EndpointSelector.prototype = {urlFor: function(key) {
                var bag = this.config[key];
                if (!bag)
                    throw errors.Error("E0006");
                if (proxyUrlFormatter.isProxyUsed())
                    return proxyUrlFormatter.formatProxyUrl(bag.local);
                if (bag.production)
                    if (IS_WINJS_ORIGIN && !Debug.debuggerEnabled || !IS_WINJS_ORIGIN && !IS_LOCAL_ORIGIN)
                        return bag.production;
                return bag.local
            }};
        return EndpointSelector
    });
    /*! Module core, file color.js */
    DevExpress.define("/color", [], function() {
        var standardColorNames = {
                aliceblue: 'f0f8ff',
                antiquewhite: 'faebd7',
                aqua: '00ffff',
                aquamarine: '7fffd4',
                azure: 'f0ffff',
                beige: 'f5f5dc',
                bisque: 'ffe4c4',
                black: '000000',
                blanchedalmond: 'ffebcd',
                blue: '0000ff',
                blueviolet: '8a2be2',
                brown: 'a52a2a',
                burlywood: 'deb887',
                cadetblue: '5f9ea0',
                chartreuse: '7fff00',
                chocolate: 'd2691e',
                coral: 'ff7f50',
                cornflowerblue: '6495ed',
                cornsilk: 'fff8dc',
                crimson: 'dc143c',
                cyan: '00ffff',
                darkblue: '00008b',
                darkcyan: '008b8b',
                darkgoldenrod: 'b8860b',
                darkgray: 'a9a9a9',
                darkgreen: '006400',
                darkkhaki: 'bdb76b',
                darkmagenta: '8b008b',
                darkolivegreen: '556b2f',
                darkorange: 'ff8c00',
                darkorchid: '9932cc',
                darkred: '8b0000',
                darksalmon: 'e9967a',
                darkseagreen: '8fbc8f',
                darkslateblue: '483d8b',
                darkslategray: '2f4f4f',
                darkturquoise: '00ced1',
                darkviolet: '9400d3',
                deeppink: 'ff1493',
                deepskyblue: '00bfff',
                dimgray: '696969',
                dodgerblue: '1e90ff',
                feldspar: 'd19275',
                firebrick: 'b22222',
                floralwhite: 'fffaf0',
                forestgreen: '228b22',
                fuchsia: 'ff00ff',
                gainsboro: 'dcdcdc',
                ghostwhite: 'f8f8ff',
                gold: 'ffd700',
                goldenrod: 'daa520',
                gray: '808080',
                green: '008000',
                greenyellow: 'adff2f',
                honeydew: 'f0fff0',
                hotpink: 'ff69b4',
                indianred: 'cd5c5c',
                indigo: '4b0082',
                ivory: 'fffff0',
                khaki: 'f0e68c',
                lavender: 'e6e6fa',
                lavenderblush: 'fff0f5',
                lawngreen: '7cfc00',
                lemonchiffon: 'fffacd',
                lightblue: 'add8e6',
                lightcoral: 'f08080',
                lightcyan: 'e0ffff',
                lightgoldenrodyellow: 'fafad2',
                lightgrey: 'd3d3d3',
                lightgreen: '90ee90',
                lightpink: 'ffb6c1',
                lightsalmon: 'ffa07a',
                lightseagreen: '20b2aa',
                lightskyblue: '87cefa',
                lightslateblue: '8470ff',
                lightslategray: '778899',
                lightsteelblue: 'b0c4de',
                lightyellow: 'ffffe0',
                lime: '00ff00',
                limegreen: '32cd32',
                linen: 'faf0e6',
                magenta: 'ff00ff',
                maroon: '800000',
                mediumaquamarine: '66cdaa',
                mediumblue: '0000cd',
                mediumorchid: 'ba55d3',
                mediumpurple: '9370d8',
                mediumseagreen: '3cb371',
                mediumslateblue: '7b68ee',
                mediumspringgreen: '00fa9a',
                mediumturquoise: '48d1cc',
                mediumvioletred: 'c71585',
                midnightblue: '191970',
                mintcream: 'f5fffa',
                mistyrose: 'ffe4e1',
                moccasin: 'ffe4b5',
                navajowhite: 'ffdead',
                navy: '000080',
                oldlace: 'fdf5e6',
                olive: '808000',
                olivedrab: '6b8e23',
                orange: 'ffa500',
                orangered: 'ff4500',
                orchid: 'da70d6',
                palegoldenrod: 'eee8aa',
                palegreen: '98fb98',
                paleturquoise: 'afeeee',
                palevioletred: 'd87093',
                papayawhip: 'ffefd5',
                peachpuff: 'ffdab9',
                peru: 'cd853f',
                pink: 'ffc0cb',
                plum: 'dda0dd',
                powderblue: 'b0e0e6',
                purple: '800080',
                red: 'ff0000',
                rosybrown: 'bc8f8f',
                royalblue: '4169e1',
                saddlebrown: '8b4513',
                salmon: 'fa8072',
                sandybrown: 'f4a460',
                seagreen: '2e8b57',
                seashell: 'fff5ee',
                sienna: 'a0522d',
                silver: 'c0c0c0',
                skyblue: '87ceeb',
                slateblue: '6a5acd',
                slategray: '708090',
                snow: 'fffafa',
                springgreen: '00ff7f',
                steelblue: '4682b4',
                tan: 'd2b48c',
                teal: '008080',
                thistle: 'd8bfd8',
                tomato: 'ff6347',
                turquoise: '40e0d0',
                violet: 'ee82ee',
                violetred: 'd02090',
                wheat: 'f5deb3',
                white: 'ffffff',
                whitesmoke: 'f5f5f5',
                yellow: 'ffff00',
                yellowgreen: '9acd32'
            };
        var standardColorTypes = [{
                    re: /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
                    process: function(colorString) {
                        return [parseInt(colorString[1], 10), parseInt(colorString[2], 10), parseInt(colorString[3], 10)]
                    }
                }, {
                    re: /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*\.*\d+)\)$/,
                    process: function(colorString) {
                        return [parseInt(colorString[1], 10), parseInt(colorString[2], 10), parseInt(colorString[3], 10), parseFloat(colorString[4])]
                    }
                }, {
                    re: /^#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/,
                    process: function(colorString) {
                        return [parseInt(colorString[1], 16), parseInt(colorString[2], 16), parseInt(colorString[3], 16)]
                    }
                }, {
                    re: /^#([a-f0-9]{1})([a-f0-9]{1})([a-f0-9]{1})$/,
                    process: function(colorString) {
                        return [parseInt(colorString[1] + colorString[1], 16), parseInt(colorString[2] + colorString[2], 16), parseInt(colorString[3] + colorString[3], 16)]
                    }
                }, {
                    re: /^hsv\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
                    process: function(colorString) {
                        var h = parseInt(colorString[1], 10),
                            s = parseInt(colorString[2], 10),
                            v = parseInt(colorString[3], 10),
                            rgb = hsvToRgb(h, s, v);
                        return [rgb[0], rgb[1], rgb[2], 1, [h, s, v]]
                    }
                }, {
                    re: /^hsl\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/,
                    process: function(colorString) {
                        var h = parseInt(colorString[1], 10),
                            s = parseInt(colorString[2], 10),
                            l = parseInt(colorString[3], 10),
                            rgb = hslToRgb(h, s, l);
                        return [rgb[0], rgb[1], rgb[2], 1, null, [h, s, l]]
                    }
                }];
        function Color(value) {
            this.baseColor = value;
            var color;
            if (value) {
                color = String(value).toLowerCase().replace(/ /g, '');
                color = standardColorNames[color] ? '#' + standardColorNames[color] : color;
                color = parseColor(color)
            }
            if (!color)
                this.colorIsInvalid = true;
            color = color || {};
            this.r = normalize(color[0]);
            this.g = normalize(color[1]);
            this.b = normalize(color[2]);
            this.a = normalize(color[3], 1, 1);
            if (color[4])
                this.hsv = {
                    h: color[4][0],
                    s: color[4][1],
                    v: color[4][2]
                };
            else
                this.hsv = toHsvFromRgb(this.r, this.g, this.b);
            if (color[5])
                this.hsl = {
                    h: color[5][0],
                    s: color[5][1],
                    l: color[5][2]
                };
            else
                this.hsl = toHslFromRgb(this.r, this.g, this.b)
        }
        function parseColor(color) {
            if (color === "transparent")
                return [0, 0, 0, 0];
            var i = 0,
                ii = standardColorTypes.length,
                str;
            for (; i < ii; ++i) {
                str = standardColorTypes[i].re.exec(color);
                if (str)
                    return standardColorTypes[i].process(str)
            }
            return null
        }
        function normalize(colorComponent, def, max) {
            def = def || 0;
            max = max || 255;
            return colorComponent < 0 || isNaN(colorComponent) ? def : colorComponent > max ? max : colorComponent
        }
        function toHexFromRgb(r, g, b) {
            return '#' + (0X01000000 | r << 16 | g << 8 | b).toString(16).slice(1)
        }
        function toHsvFromRgb(r, g, b) {
            var max = Math.max(r, g, b),
                min = Math.min(r, g, b),
                delta = max - min,
                H,
                S,
                V;
            V = max;
            S = max === 0 ? 0 : 1 - min / max;
            if (max === min)
                H = 0;
            else
                switch (max) {
                    case r:
                        H = 60 * ((g - b) / delta);
                        if (g < b)
                            H = H + 360;
                        break;
                    case g:
                        H = 60 * ((b - r) / delta) + 120;
                        break;
                    case b:
                        H = 60 * ((r - g) / delta) + 240;
                        break
                }
            S *= 100;
            V *= 100 / 255;
            return {
                    h: Math.round(H),
                    s: Math.round(S),
                    v: Math.round(V)
                }
        }
        function hsvToRgb(h, s, v) {
            var Vdec,
                Vinc,
                Vmin,
                Hi,
                a,
                r,
                g,
                b;
            Hi = Math.floor(h % 360 / 60);
            Vmin = (100 - s) * v / 100;
            a = (v - Vmin) * (h % 60 / 60);
            Vinc = Vmin + a;
            Vdec = v - a;
            switch (Hi) {
                case 0:
                    r = v;
                    g = Vinc;
                    b = Vmin;
                    break;
                case 1:
                    r = Vdec;
                    g = v;
                    b = Vmin;
                    break;
                case 2:
                    r = Vmin;
                    g = v;
                    b = Vinc;
                    break;
                case 3:
                    r = Vmin;
                    g = Vdec;
                    b = v;
                    break;
                case 4:
                    r = Vinc;
                    g = Vmin;
                    b = v;
                    break;
                case 5:
                    r = v;
                    g = Vmin;
                    b = Vdec;
                    break
            }
            return [Math.round(r * 2.55), Math.round(g * 2.55), Math.round(b * 2.55)]
        }
        function calculateHue(r, g, b, delta) {
            var max = Math.max(r, g, b);
            switch (max) {
                case r:
                    return (g - b) / delta + (g < b ? 6 : 0);
                case g:
                    return (b - r) / delta + 2;
                case b:
                    return (r - g) / delta + 4
            }
        }
        function toHslFromRgb(r, g, b) {
            r = convertTo01Bounds(r, 255);
            g = convertTo01Bounds(g, 255);
            b = convertTo01Bounds(b, 255);
            var max = Math.max(r, g, b),
                min = Math.min(r, g, b),
                maxMinSumm = max + min,
                h,
                s,
                l = maxMinSumm / 2;
            if (max === min)
                h = s = 0;
            else {
                var delta = max - min;
                if (l > 0.5)
                    s = delta / (2 - maxMinSumm);
                else
                    s = delta / maxMinSumm;
                h = calculateHue(r, g, b, delta);
                h /= 6
            }
            return {
                    h: _round(h * 360),
                    s: _round(s * 100),
                    l: _round(l * 100)
                }
        }
        function makeTc(colorPart, h) {
            var Tc = h;
            if (colorPart === "r")
                Tc = h + 1 / 3;
            if (colorPart === "b")
                Tc = h - 1 / 3;
            return Tc
        }
        function modifyTc(Tc) {
            if (Tc < 0)
                Tc += 1;
            if (Tc > 1)
                Tc -= 1;
            return Tc
        }
        function hueToRgb(p, q, Tc) {
            Tc = modifyTc(Tc);
            if (Tc < 1 / 6)
                return p + (q - p) * 6 * Tc;
            if (Tc < 1 / 2)
                return q;
            if (Tc < 2 / 3)
                return p + (q - p) * (2 / 3 - Tc) * 6;
            return p
        }
        function hslToRgb(h, s, l) {
            var r,
                g,
                b;
            h = convertTo01Bounds(h, 360),
            s = convertTo01Bounds(s, 100),
            l = convertTo01Bounds(l, 100);
            if (s === 0)
                r = g = b = l;
            else {
                var q = l < 0.5 ? l * (1 + s) : l + s - l * s,
                    p = 2 * l - q;
                r = hueToRgb(p, q, makeTc("r", h));
                g = hueToRgb(p, q, makeTc("g", h));
                b = hueToRgb(p, q, makeTc("b", h))
            }
            return [_round(r * 255), _round(g * 255), _round(b * 255)]
        }
        function convertTo01Bounds(n, max) {
            n = Math.min(max, Math.max(0, parseFloat(n)));
            if (Math.abs(n - max) < 0.000001)
                return 1;
            return n % max / parseFloat(max)
        }
        function isIntegerBtwMinAndMax(number, min, max) {
            min = min || 0;
            max = max || 255;
            if (number % 1 !== 0 || number < min || number > max || typeof number !== 'number' || isNaN(number))
                return false;
            return true
        }
        var _round = Math.round;
        Color.prototype = {
            constructor: Color,
            highlight: function(step) {
                step = step || 10;
                return this.alter(step).toHex()
            },
            darken: function(step) {
                step = step || 10;
                return this.alter(-step).toHex()
            },
            alter: function(step) {
                var result = new Color;
                result.r = normalize(this.r + step);
                result.g = normalize(this.g + step);
                result.b = normalize(this.b + step);
                return result
            },
            blend: function(blendColor, opacity) {
                var other = blendColor instanceof Color ? blendColor : new Color(blendColor),
                    result = new Color;
                result.r = normalize(_round(this.r * (1 - opacity) + other.r * opacity));
                result.g = normalize(_round(this.g * (1 - opacity) + other.g * opacity));
                result.b = normalize(_round(this.b * (1 - opacity) + other.b * opacity));
                return result
            },
            toHex: function() {
                return toHexFromRgb(this.r, this.g, this.b)
            },
            getPureColor: function() {
                var rgb = hsvToRgb(this.hsv.h, 100, 100);
                return new Color("rgb(" + rgb.join(",") + ")")
            },
            isValidHex: function(hex) {
                return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(hex)
            },
            isValidRGB: function(r, g, b) {
                if (!isIntegerBtwMinAndMax(r) || !isIntegerBtwMinAndMax(g) || !isIntegerBtwMinAndMax(b))
                    return false;
                return true
            },
            isValidAlpha: function(a) {
                if (isNaN(a) || a < 0 || a > 1 || typeof a !== 'number')
                    return false;
                return true
            },
            colorIsInvalid: false
        };
        return Color
    });
    /*! Module core, file data.errors.js */
    DevExpress.define("/data/data.errors", ["/utils/utils.error", "/errors"], function(errorUtils, errors) {
        return errorUtils(errors.ERROR_MESSAGES, {
                E4000: "[DevExpress.data]: {0}",
                E4001: "Unknown aggregating function is detected: '{0}'",
                E4002: "Unsupported OData protocol version is used",
                E4003: "Unknown filter operation is used: {0}",
                E4004: "The thenby() method is called before the sortby() method",
                E4005: "Store requires a key expression for this operation",
                E4006: "ArrayStore 'data' option must be an array",
                E4007: "Compound keys cannot be auto-generated",
                E4008: "Attempt to insert an item with the a duplicated key",
                E4009: "Data item cannot be found",
                E4010: "CustomStore does not support creating queries",
                E4011: "Custom Store method is not implemented or is not a function: {0}",
                E4012: "Custom Store method returns an invalid value: {0}",
                E4013: "Local Store requires the 'name' configuration option is specified",
                E4014: "Unknown key type is detected: {0}",
                E4015: "Unknown entity name or alias is used: {0}",
                E4016: "The compileSetter(expr) method is called with 'self' passed as a parameter",
                E4017: "Keys cannot be modified",
                E4018: "The server has returned a non-numeric value in a response to an item count request",
                E4019: "Mixing of group operators inside a single group of filter expression is not allowed"
            })
    });
    /*! Module core, file data.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            errors = DevExpress.require("/data/data.errors"),
            objectUtils = DX.require("/utils/utils.object"),
            knockoutUtils = DX.require("/utils/utils.knockout"),
            unwrapObservable = knockoutUtils.unwrapObservable,
            isObservable = knockoutUtils.isObservable;
        var bracketsToDots = function(expr) {
                return expr.replace(/\[/g, ".").replace(/\]/g, "")
            };
        var readPropValue = function(obj, propName) {
                if (propName === "this")
                    return obj;
                return obj[propName]
            };
        var assignPropValue = function(obj, propName, value, options) {
                if (propName === "this")
                    throw new errors.Error("E4016");
                var propValue = obj[propName];
                if (options.unwrapObservables && isObservable(propValue))
                    propValue(value);
                else
                    obj[propName] = value
            };
        var prepareOptions = function(options) {
                options = options || {};
                options.unwrapObservables = options.unwrapObservables !== undefined ? options.unwrapObservables : true;
                return options
            };
        var unwrap = function(value, options) {
                return options.unwrapObservables ? unwrapObservable(value) : value
            };
        var compileGetter = function(expr) {
                if (arguments.length > 1)
                    expr = $.makeArray(arguments);
                if (!expr || expr === "this")
                    return function(obj) {
                            return obj
                        };
                if (typeof expr === "string") {
                    expr = bracketsToDots(expr);
                    var path = expr.split(".");
                    return function(obj, options) {
                            options = prepareOptions(options);
                            var functionAsIs = options.functionsAsIs,
                                current = unwrap(obj, options);
                            for (var i = 0; i < path.length; i++) {
                                if (!current)
                                    break;
                                var next = unwrap(current[path[i]], options);
                                if (!functionAsIs && $.isFunction(next))
                                    next = next.call(current);
                                current = next
                            }
                            return current
                        }
                }
                if ($.isArray(expr))
                    return combineGetters(expr);
                if ($.isFunction(expr))
                    return expr
            };
        var combineGetters = function(getters) {
                var compiledGetters = {};
                for (var i = 0, l = getters.length; i < l; i++) {
                    var getter = getters[i];
                    compiledGetters[getter] = compileGetter(getter)
                }
                return function(obj, options) {
                        var result;
                        $.each(compiledGetters, function(name) {
                            var value = this(obj, options),
                                current,
                                path,
                                last,
                                i;
                            if (value === undefined)
                                return;
                            current = result || (result = {});
                            path = name.split(".");
                            last = path.length - 1;
                            for (i = 0; i < last; i++)
                                current = current[path[i]] = {};
                            current[path[i]] = value
                        });
                        return result
                    }
            };
        var compileSetter = function(expr) {
                expr = expr || "this";
                expr = bracketsToDots(expr);
                var pos = expr.lastIndexOf("."),
                    targetGetter = compileGetter(expr.substr(0, pos)),
                    targetPropName = expr.substr(1 + pos);
                return function(obj, value, options) {
                        options = prepareOptions(options);
                        var target = targetGetter(obj, {
                                functionsAsIs: options.functionsAsIs,
                                unwrapObservables: options.unwrapObservables
                            }),
                            prevTargetValue = readPropValue(target, targetPropName);
                        if (!options.functionsAsIs && $.isFunction(prevTargetValue) && !isObservable(prevTargetValue))
                            target[targetPropName](value);
                        else {
                            prevTargetValue = unwrap(prevTargetValue, options);
                            if (options.merge && $.isPlainObject(value) && (prevTargetValue === undefined || $.isPlainObject(prevTargetValue)) && !(value instanceof $.Event)) {
                                if (!prevTargetValue)
                                    assignPropValue(target, targetPropName, {}, options);
                                objectUtils.deepExtendArraySafe(unwrap(readPropValue(target, targetPropName), options), value)
                            }
                            else
                                assignPropValue(target, targetPropName, value, options)
                        }
                    }
            };
        var normalizeBinaryCriterion = function(crit) {
                return [crit[0], crit.length < 3 ? "=" : String(crit[1]).toLowerCase(), crit.length < 2 ? true : crit[crit.length - 1]]
            };
        var normalizeSortingInfo = function(info) {
                if (!$.isArray(info))
                    info = [info];
                return $.map(info, function(i) {
                        return {
                                selector: $.isFunction(i) || typeof i === "string" ? i : i.getter || i.field || i.selector,
                                desc: !!(i.desc || String(i.dir).charAt(0).toLowerCase() === "d")
                            }
                    })
            };
        var Guid = Class.inherit({
                ctor: function(value) {
                    if (value)
                        value = String(value);
                    this._value = this._normalize(value || this._generate())
                },
                _normalize: function(value) {
                    value = value.replace(/[^a-f0-9]/ig, "").toLowerCase();
                    while (value.length < 32)
                        value += "0";
                    return [value.substr(0, 8), value.substr(8, 4), value.substr(12, 4), value.substr(16, 4), value.substr(20, 12)].join("-")
                },
                _generate: function() {
                    var value = "";
                    for (var i = 0; i < 32; i++)
                        value += Math.round(Math.random() * 15).toString(16);
                    return value
                },
                toString: function() {
                    return this._value
                },
                valueOf: function() {
                    return this._value
                },
                toJSON: function() {
                    return this._value
                }
            });
        var toComparable = function(value, caseSensitive) {
                if (value instanceof Date)
                    return value.getTime();
                if (value instanceof Guid)
                    return value.valueOf();
                if (!caseSensitive && typeof value === "string")
                    return value.toLowerCase();
                return value
            };
        var keysEqual = function(keyExpr, key1, key2) {
                if ($.isArray(keyExpr)) {
                    var names = $.map(key1, function(v, k) {
                            return k
                        }),
                        name;
                    for (var i = 0; i < names.length; i++) {
                        name = names[i];
                        if (toComparable(key1[name], true) != toComparable(key2[name], true))
                            return false
                    }
                    return true
                }
                return toComparable(key1, true) == toComparable(key2, true)
            };
        var BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var base64_encode = function(input) {
                if (!$.isArray(input))
                    input = stringToByteArray(String(input));
                var result = "";
                function getBase64Char(index) {
                    return BASE64_CHARS.charAt(index)
                }
                for (var i = 0; i < input.length; i += 3) {
                    var octet1 = input[i],
                        octet2 = input[i + 1],
                        octet3 = input[i + 2];
                    result += $.map([octet1 >> 2, (octet1 & 3) << 4 | octet2 >> 4, isNaN(octet2) ? 64 : (octet2 & 15) << 2 | octet3 >> 6, isNaN(octet3) ? 64 : octet3 & 63], getBase64Char).join("")
                }
                return result
            };
        var stringToByteArray = function(str) {
                var bytes = [],
                    code,
                    i;
                for (i = 0; i < str.length; i++) {
                    code = str.charCodeAt(i);
                    if (code < 128)
                        bytes.push(code);
                    else if (code < 2048)
                        bytes.push(192 + (code >> 6), 128 + (code & 63));
                    else if (code < 65536)
                        bytes.push(224 + (code >> 12), 128 + (code >> 6 & 63), 128 + (code & 63));
                    else if (code < 2097152)
                        bytes.push(240 + (code >> 18), 128 + (code >> 12 & 63), 128 + (code >> 6 & 63), 128 + (code & 63))
                }
                return bytes
            };
        var errorMessageFromXhr = function() {
                var textStatusMessages = {
                        timeout: "Network connection timeout",
                        error: "Unspecified network error",
                        parsererror: "Unexpected server response"
                    };
                var textStatusDetails = {
                        timeout: "possible causes: the remote host is not accessible, overloaded or is not included into the domain white-list when being run in the native container",
                        error: "if the remote host is located on another domain, make sure it properly supports cross-origin resource sharing (CORS), or use the JSONP approach instead",
                        parsererror: "the remote host did not respond with valid JSON data"
                    };
                var explainTextStatus = function(textStatus) {
                        var result = textStatusMessages[textStatus];
                        if (!result)
                            return textStatus;
                        result += " (" + textStatusDetails[textStatus] + ")";
                        return result
                    };
                return function(xhr, textStatus) {
                        if (xhr.status < 400)
                            return explainTextStatus(textStatus);
                        return xhr.statusText
                    }
            }();
        var aggregators = {
                count: {
                    seed: 0,
                    step: function(count) {
                        return 1 + count
                    }
                },
                sum: {
                    seed: 0,
                    step: function(sum, item) {
                        return sum + item
                    }
                },
                min: {step: function(min, item) {
                        return item < min ? item : min
                    }},
                max: {step: function(max, item) {
                        return item > max ? item : max
                    }},
                avg: {
                    seed: [0, 0],
                    step: function(pair, value) {
                        return [pair[0] + value, pair[1] + 1]
                    },
                    finalize: function(pair) {
                        return pair[1] ? pair[0] / pair[1] : NaN
                    }
                }
            };
        function handleError(error) {
            var id = "E4000";
            if (error && "__id" in error)
                id = error.__id;
            errors.log(id, error)
        }
        var processRequestResultLock = function() {
                var lockCount = 0,
                    lockDeferred;
                var obtain = function() {
                        if (lockCount === 0)
                            lockDeferred = $.Deferred();
                        lockCount++
                    };
                var release = function() {
                        lockCount--;
                        if (lockCount < 1)
                            lockDeferred.resolve()
                    };
                var promise = function() {
                        var deferred = lockCount === 0 ? $.Deferred().resolve() : lockDeferred;
                        return deferred.promise()
                    };
                var reset = function() {
                        lockCount = 0;
                        if (lockDeferred)
                            lockDeferred.resolve()
                    };
                return {
                        obtain: obtain,
                        release: release,
                        promise: promise,
                        reset: reset
                    }
            }();
        function isDisjunctiveOperator(condition) {
            return /^(or|\|\||\|)$/i.test(condition)
        }
        function isConjunctiveOperator(condition) {
            return /^(and|\&\&|\&)$/i.test(condition)
        }
        var data = DX.data = {
                utils: {
                    compileGetter: compileGetter,
                    compileSetter: compileSetter,
                    normalizeBinaryCriterion: normalizeBinaryCriterion,
                    normalizeSortingInfo: normalizeSortingInfo,
                    toComparable: toComparable,
                    keysEqual: keysEqual,
                    errorMessageFromXhr: errorMessageFromXhr,
                    aggregators: aggregators,
                    isDisjunctiveOperator: isDisjunctiveOperator,
                    isConjunctiveOperator: isConjunctiveOperator,
                    processRequestResultLock: processRequestResultLock
                },
                Guid: Guid,
                base64_encode: base64_encode,
                queryImpl: {},
                queryAdapters: {},
                query: function() {
                    var impl = $.isArray(arguments[0]) ? "array" : "remote";
                    return data.queryImpl[impl].apply(this, arguments)
                },
                errorHandler: null,
                _errorHandler: function(error) {
                    handleError(error);
                    if (data.errorHandler)
                        data.errorHandler(error)
                }
            }
    })(jQuery, DevExpress);
    /*! Module core, file data.aggregateCalculator.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            errors = DevExpress.require("/data/data.errors"),
            data = DX.data,
            utils = data.utils;
        function isCount(aggregator) {
            return aggregator === utils.aggregators.count
        }
        function normalizeAggregate(aggregate) {
            var selector = utils.compileGetter(aggregate.selector),
                aggregator = aggregate.aggregator;
            if (typeof aggregator === "string") {
                aggregator = data.utils.aggregators[aggregator];
                if (!aggregator)
                    throw errors.Error("E4001", aggregate.aggregator);
            }
            return {
                    selector: selector,
                    aggregator: aggregator
                }
        }
        data.AggregateCalculator = Class.inherit({
            ctor: function(options) {
                this._data = options.data;
                this._groupLevel = options.groupLevel || 0;
                this._totalAggregates = $.map(options.totalAggregates || [], normalizeAggregate);
                this._groupAggregates = $.map(options.groupAggregates || [], normalizeAggregate);
                this._totals = []
            },
            calculate: function() {
                if (this._totalAggregates.length)
                    this._calculateTotals(0, {items: this._data});
                if (this._groupAggregates.length && this._groupLevel > 0)
                    this._calculateGroups(0, {items: this._data})
            },
            totalAggregates: function() {
                return this._totals
            },
            _aggregate: function(data, aggregates, container) {
                var i,
                    j;
                for (i = 0; i < aggregates.length; i++) {
                    if (isCount(aggregates[i].aggregator)) {
                        container[i] = (container[i] || 0) + data.items.length;
                        continue
                    }
                    for (j = 0; j < data.items.length; j++)
                        this._accumulate(i, aggregates[i], container, data.items[j])
                }
            },
            _calculateTotals: function(level, data) {
                var i;
                if (level === 0)
                    this._totals = this._seed(this._totalAggregates);
                if (level === this._groupLevel)
                    this._aggregate(data, this._totalAggregates, this._totals);
                else
                    for (i = 0; i < data.items.length; i++)
                        this._calculateTotals(level + 1, data.items[i]);
                if (level === 0)
                    this._totals = this._finalize(this._totalAggregates, this._totals)
            },
            _calculateGroups: function(level, data, outerAggregates) {
                var i,
                    innerAggregates;
                if (level === this._groupLevel)
                    this._aggregate(data, this._groupAggregates, outerAggregates);
                else
                    for (i = 0; i < data.items.length; i++) {
                        innerAggregates = this._seed(this._groupAggregates);
                        this._calculateGroups(level + 1, data.items[i], innerAggregates);
                        data.items[i].aggregates = this._finalize(this._groupAggregates, innerAggregates);
                        if (level > 0) {
                            outerAggregates = outerAggregates || this._seed(this._groupAggregates);
                            this._calculateGroups(level + 1, data.items[i], outerAggregates)
                        }
                    }
            },
            _seed: function(aggregates) {
                return $.map(aggregates, function(aggregate) {
                        var aggregator = aggregate.aggregator,
                            seed = "seed" in aggregator ? $.isFunction(aggregator.seed) ? aggregator.seed() : aggregator.seed : NaN;
                        return $.isArray(seed) ? [seed] : seed
                    })
            },
            _accumulate: function(aggregateIndex, aggregate, results, item) {
                var value = aggregate.selector(item),
                    aggregator = aggregate.aggregator;
                results[aggregateIndex] = results[aggregateIndex] !== results[aggregateIndex] ? value : aggregator.step(results[aggregateIndex], value)
            },
            _finalize: function(aggregates, results) {
                return $.map(aggregates, function(aggregate, index) {
                        var fin = aggregate.aggregator.finalize;
                        return fin ? fin(results[index]) : results[index]
                    })
            }
        })
    })(jQuery, DevExpress);
    /*! Module core, file data.query.array.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            errors = DevExpress.require("/data/data.errors"),
            commonUtils = DX.require("/utils/utils.common"),
            data = DX.data,
            queryImpl = data.queryImpl,
            compileGetter = data.utils.compileGetter,
            toComparable = data.utils.toComparable;
        var Iterator = Class.inherit({
                toArray: function() {
                    var result = [];
                    this.reset();
                    while (this.next())
                        result.push(this.current());
                    return result
                },
                countable: function() {
                    return false
                }
            });
        var ArrayIterator = Iterator.inherit({
                ctor: function(array) {
                    this.array = array;
                    this.index = -1
                },
                next: function() {
                    if (this.index + 1 < this.array.length) {
                        this.index++;
                        return true
                    }
                    return false
                },
                current: function() {
                    return this.array[this.index]
                },
                reset: function() {
                    this.index = -1
                },
                toArray: function() {
                    return this.array.slice(0)
                },
                countable: function() {
                    return true
                },
                count: function() {
                    return this.array.length
                }
            });
        var WrappedIterator = Iterator.inherit({
                ctor: function(iter) {
                    this.iter = iter
                },
                next: function() {
                    return this.iter.next()
                },
                current: function() {
                    return this.iter.current()
                },
                reset: function() {
                    return this.iter.reset()
                }
            });
        var MapIterator = WrappedIterator.inherit({
                ctor: function(iter, mapper) {
                    this.callBase(iter);
                    this.index = -1;
                    this.mapper = mapper
                },
                current: function() {
                    return this.mapper(this.callBase(), this.index)
                },
                next: function() {
                    var hasNext = this.callBase();
                    if (hasNext)
                        this.index++;
                    return hasNext
                }
            });
        var SortIterator = Iterator.inherit({
                ctor: function(iter, getter, desc) {
                    if (!(iter instanceof MapIterator))
                        iter = new MapIterator(iter, this._wrap);
                    this.iter = iter;
                    this.rules = [{
                            getter: getter,
                            desc: desc
                        }]
                },
                thenBy: function(getter, desc) {
                    var result = new SortIterator(this.sortedIter || this.iter, getter, desc);
                    if (!this.sortedIter)
                        result.rules = this.rules.concat(result.rules);
                    return result
                },
                next: function() {
                    this._ensureSorted();
                    return this.sortedIter.next()
                },
                current: function() {
                    this._ensureSorted();
                    return this.sortedIter.current()
                },
                reset: function() {
                    delete this.sortedIter
                },
                countable: function() {
                    return this.sortedIter || this.iter.countable()
                },
                count: function() {
                    if (this.sortedIter)
                        return this.sortedIter.count();
                    return this.iter.count()
                },
                _ensureSorted: function() {
                    var that = this;
                    if (that.sortedIter)
                        return;
                    $.each(that.rules, function() {
                        this.getter = compileGetter(this.getter)
                    });
                    that.sortedIter = new MapIterator(new ArrayIterator(this.iter.toArray().sort(function(x, y) {
                        return that._compare(x, y)
                    })), that._unwrap)
                },
                _wrap: function(record, index) {
                    return {
                            index: index,
                            value: record
                        }
                },
                _unwrap: function(wrappedItem) {
                    return wrappedItem.value
                },
                _compare: function(x, y) {
                    var xIndex = x.index,
                        yIndex = y.index;
                    x = x.value;
                    y = y.value;
                    if (x === y)
                        return xIndex - yIndex;
                    for (var i = 0, rulesCount = this.rules.length; i < rulesCount; i++) {
                        var rule = this.rules[i],
                            xValue = toComparable(rule.getter(x)),
                            yValue = toComparable(rule.getter(y)),
                            factor = rule.desc ? -1 : 1;
                        if (xValue === null || yValue === undefined)
                            return -factor;
                        if (yValue === null || xValue === undefined)
                            return factor;
                        if (xValue < yValue)
                            return -factor;
                        if (xValue > yValue)
                            return factor;
                        if (xValue !== yValue)
                            return !xValue ? -factor : factor
                    }
                    return xIndex - yIndex
                }
            });
        var compileCriteria = function() {
                var compileGroup = function(crit) {
                        var idx = 0,
                            bag = [],
                            ops = [],
                            groupOperator,
                            nextGroupOperator;
                        $.each(crit, function() {
                            if ($.isArray(this) || $.isFunction(this)) {
                                if (bag.length > 1 && groupOperator !== nextGroupOperator)
                                    throw new errors.Error("E4019");
                                ops.push(compileCriteria(this));
                                bag.push("op[" + idx + "](d)");
                                idx++;
                                groupOperator = nextGroupOperator;
                                nextGroupOperator = "&&"
                            }
                            else
                                nextGroupOperator = data.utils.isConjunctiveOperator(this) ? "&&" : "||"
                        });
                        return new Function("op", "return function(d) { return " + bag.join(" " + groupOperator + " ") + " }")(ops)
                    };
                var toString = function(value) {
                        return commonUtils.isDefined(value) ? value.toString() : ''
                    };
                var compileBinary = function(crit) {
                        crit = data.utils.normalizeBinaryCriterion(crit);
                        var getter = compileGetter(crit[0]),
                            op = crit[1],
                            value = crit[2];
                        value = toComparable(value);
                        switch (op.toLowerCase()) {
                            case"=":
                                return compileEquals(getter, value);
                            case"<>":
                                return compileEquals(getter, value, true);
                            case">":
                                return function(obj) {
                                        return toComparable(getter(obj)) > value
                                    };
                            case"<":
                                return function(obj) {
                                        return toComparable(getter(obj)) < value
                                    };
                            case">=":
                                return function(obj) {
                                        return toComparable(getter(obj)) >= value
                                    };
                            case"<=":
                                return function(obj) {
                                        return toComparable(getter(obj)) <= value
                                    };
                            case"startswith":
                                return function(obj) {
                                        return toComparable(toString(getter(obj))).indexOf(value) === 0
                                    };
                            case"endswith":
                                return function(obj) {
                                        var getterValue = toComparable(toString(getter(obj))),
                                            searchValue = toString(value);
                                        if (getterValue.length < searchValue.length)
                                            return false;
                                        return getterValue.lastIndexOf(value) === getterValue.length - value.length
                                    };
                            case"contains":
                                return function(obj) {
                                        return toComparable(toString(getter(obj))).indexOf(value) > -1
                                    };
                            case"notcontains":
                                return function(obj) {
                                        return toComparable(toString(getter(obj))).indexOf(value) === -1
                                    }
                        }
                        throw errors.Error("E4003", op);
                    };
                function compileEquals(getter, value, negate) {
                    return function(obj) {
                            obj = toComparable(getter(obj));
                            var result = useStrictComparison(value) ? obj === value : obj == value;
                            if (negate)
                                result = !result;
                            return result
                        }
                }
                function useStrictComparison(value) {
                    return value === "" || value === 0 || value === false
                }
                return function(crit) {
                        if ($.isFunction(crit))
                            return crit;
                        if ($.isArray(crit[0]))
                            return compileGroup(crit);
                        return compileBinary(crit)
                    }
            }();
        var FilterIterator = WrappedIterator.inherit({
                ctor: function(iter, criteria) {
                    this.callBase(iter);
                    this.criteria = compileCriteria(criteria)
                },
                next: function() {
                    while (this.iter.next())
                        if (this.criteria(this.current()))
                            return true;
                    return false
                }
            });
        var GroupIterator = Iterator.inherit({
                ctor: function(iter, getter) {
                    this.iter = iter;
                    this.getter = getter
                },
                next: function() {
                    this._ensureGrouped();
                    return this.groupedIter.next()
                },
                current: function() {
                    this._ensureGrouped();
                    return this.groupedIter.current()
                },
                reset: function() {
                    delete this.groupedIter
                },
                countable: function() {
                    return !!this.groupedIter
                },
                count: function() {
                    return this.groupedIter.count()
                },
                _ensureGrouped: function() {
                    if (this.groupedIter)
                        return;
                    var hash = {},
                        keys = [],
                        iter = this.iter,
                        getter = compileGetter(this.getter);
                    iter.reset();
                    while (iter.next()) {
                        var current = iter.current(),
                            key = getter(current);
                        if (key in hash)
                            hash[key].push(current);
                        else {
                            hash[key] = [current];
                            keys.push(key)
                        }
                    }
                    this.groupedIter = new ArrayIterator($.map(keys, function(key) {
                        return {
                                key: key,
                                items: hash[key]
                            }
                    }))
                }
            });
        var SelectIterator = WrappedIterator.inherit({
                ctor: function(iter, getter) {
                    this.callBase(iter);
                    this.getter = compileGetter(getter)
                },
                current: function() {
                    return this.getter(this.callBase())
                },
                countable: function() {
                    return this.iter.countable()
                },
                count: function() {
                    return this.iter.count()
                }
            });
        var SliceIterator = WrappedIterator.inherit({
                ctor: function(iter, skip, take) {
                    this.callBase(iter);
                    this.skip = Math.max(0, skip);
                    this.take = Math.max(0, take);
                    this.pos = 0
                },
                next: function() {
                    if (this.pos >= this.skip + this.take)
                        return false;
                    while (this.pos < this.skip && this.iter.next())
                        this.pos++;
                    this.pos++;
                    return this.iter.next()
                },
                reset: function() {
                    this.callBase();
                    this.pos = 0
                },
                countable: function() {
                    return this.iter.countable()
                },
                count: function() {
                    return Math.min(this.iter.count() - this.skip, this.take)
                }
            });
        queryImpl.array = function(iter, queryOptions) {
            queryOptions = queryOptions || {};
            if (!(iter instanceof Iterator))
                iter = new ArrayIterator(iter);
            var handleError = function(error) {
                    var handler = queryOptions.errorHandler;
                    if (handler)
                        handler(error);
                    data._errorHandler(error)
                };
            var aggregateCore = function(aggregator) {
                    var d = $.Deferred().fail(handleError),
                        seed,
                        step = aggregator.step,
                        finalize = aggregator.finalize;
                    try {
                        iter.reset();
                        if ("seed" in aggregator)
                            seed = aggregator.seed;
                        else
                            seed = iter.next() ? iter.current() : NaN;
                        var accumulator = seed;
                        while (iter.next())
                            accumulator = step(accumulator, iter.current());
                        d.resolve(finalize ? finalize(accumulator) : accumulator)
                    }
                    catch(x) {
                        d.reject(x)
                    }
                    return d.promise()
                };
            var aggregate = function(seed, step, finalize) {
                    if (arguments.length < 2)
                        return aggregateCore({step: arguments[0]});
                    return aggregateCore({
                            seed: seed,
                            step: step,
                            finalize: finalize
                        })
                };
            var standardAggregate = function(name) {
                    return aggregateCore(data.utils.aggregators[name])
                };
            var select = function(getter) {
                    if (!$.isFunction(getter) && !$.isArray(getter))
                        getter = $.makeArray(arguments);
                    return chainQuery(new SelectIterator(iter, getter))
                };
            var selectProp = function(name) {
                    return select(compileGetter(name))
                };
            var chainQuery = function(iter) {
                    return queryImpl.array(iter, queryOptions)
                };
            return {
                    toArray: function() {
                        return iter.toArray()
                    },
                    enumerate: function() {
                        var d = $.Deferred().fail(handleError);
                        try {
                            d.resolve(iter.toArray())
                        }
                        catch(x) {
                            d.reject(x)
                        }
                        return d.promise()
                    },
                    sortBy: function(getter, desc) {
                        return chainQuery(new SortIterator(iter, getter, desc))
                    },
                    thenBy: function(getter, desc) {
                        if (iter instanceof SortIterator)
                            return chainQuery(iter.thenBy(getter, desc));
                        throw errors.Error("E4004");
                    },
                    filter: function(criteria) {
                        if (!$.isArray(criteria))
                            criteria = $.makeArray(arguments);
                        return chainQuery(new FilterIterator(iter, criteria))
                    },
                    slice: function(skip, take) {
                        if (take === undefined)
                            take = Number.MAX_VALUE;
                        return chainQuery(new SliceIterator(iter, skip, take))
                    },
                    select: select,
                    groupBy: function(getter) {
                        return chainQuery(new GroupIterator(iter, getter))
                    },
                    aggregate: aggregate,
                    count: function() {
                        if (iter.countable()) {
                            var d = $.Deferred().fail(handleError);
                            try {
                                d.resolve(iter.count())
                            }
                            catch(x) {
                                d.reject(x)
                            }
                            return d.promise()
                        }
                        return standardAggregate("count")
                    },
                    sum: function(getter) {
                        if (getter)
                            return selectProp(getter).sum();
                        return standardAggregate("sum")
                    },
                    min: function(getter) {
                        if (getter)
                            return selectProp(getter).min();
                        return standardAggregate("min")
                    },
                    max: function(getter) {
                        if (getter)
                            return selectProp(getter).max();
                        return standardAggregate("max")
                    },
                    avg: function(getter) {
                        if (getter)
                            return selectProp(getter).avg();
                        return standardAggregate("avg")
                    }
                }
        }
    })(jQuery, DevExpress);
    /*! Module core, file data.query.remote.js */
    (function($, DX, undefined) {
        var data = DX.data,
            queryImpl = data.queryImpl,
            errors = DevExpress.require("/data/data.errors");
        queryImpl.remote = function(url, queryOptions, tasks) {
            tasks = tasks || [];
            queryOptions = queryOptions || {};
            var createTask = function(name, args) {
                    return {
                            name: name,
                            args: args
                        }
                };
            var exec = function(executorTask) {
                    var d = $.Deferred(),
                        _adapterFactory,
                        _adapter,
                        _taskQueue,
                        _currentTask,
                        _mergedSortArgs;
                    var rejectWithNotify = function(error) {
                            var handler = queryOptions.errorHandler;
                            if (handler)
                                handler(error);
                            data._errorHandler(error);
                            d.reject(error)
                        };
                    function mergeSortTask(task) {
                        switch (task.name) {
                            case"sortBy":
                                _mergedSortArgs = [task.args];
                                return true;
                            case"thenBy":
                                if (!_mergedSortArgs)
                                    throw errors.Error("E4004");
                                _mergedSortArgs.push(task.args);
                                return true
                        }
                        return false
                    }
                    function unmergeSortTasks() {
                        var head = _taskQueue[0],
                            unmergedTasks = [];
                        if (head && head.name === "multiSort") {
                            _taskQueue.shift();
                            $.each(head.args[0], function() {
                                unmergedTasks.push(createTask(unmergedTasks.length ? "thenBy" : "sortBy", this))
                            })
                        }
                        _taskQueue = unmergedTasks.concat(_taskQueue)
                    }
                    try {
                        _adapterFactory = queryOptions.adapter || "odata";
                        if (!$.isFunction(_adapterFactory))
                            _adapterFactory = data.queryAdapters[_adapterFactory];
                        _adapter = _adapterFactory(queryOptions);
                        _taskQueue = [].concat(tasks).concat(executorTask);
                        while (_taskQueue.length) {
                            _currentTask = _taskQueue[0];
                            if (!mergeSortTask(_currentTask)) {
                                if (_mergedSortArgs) {
                                    _taskQueue.unshift(createTask("multiSort", [_mergedSortArgs]));
                                    _mergedSortArgs = null;
                                    continue
                                }
                                if (String(_currentTask.name) !== "enumerate")
                                    if (!_adapter[_currentTask.name] || _adapter[_currentTask.name].apply(_adapter, _currentTask.args) === false)
                                        break
                            }
                            _taskQueue.shift()
                        }
                        unmergeSortTasks();
                        _adapter.exec(url).done(function(result, extra) {
                            if (!_taskQueue.length)
                                d.resolve(result, extra);
                            else {
                                var clientChain = queryImpl.array(result, {errorHandler: queryOptions.errorHandler});
                                $.each(_taskQueue, function() {
                                    clientChain = clientChain[this.name].apply(clientChain, this.args)
                                });
                                clientChain.done(d.resolve).fail(d.reject)
                            }
                        }).fail(rejectWithNotify)
                    }
                    catch(x) {
                        rejectWithNotify(x)
                    }
                    return d.promise()
                };
            var query = {};
            $.each(["sortBy", "thenBy", "filter", "slice", "select", "groupBy"], function() {
                var name = String(this);
                query[name] = function() {
                    return queryImpl.remote(url, queryOptions, tasks.concat(createTask(name, arguments)))
                }
            });
            $.each(["count", "min", "max", "sum", "avg", "aggregate", "enumerate"], function() {
                var name = String(this);
                query[name] = function() {
                    return exec.call(this, createTask(name, arguments))
                }
            });
            return query
        }
    })(jQuery, DevExpress);
    /*! Module core, file data.odata.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            errors = DevExpress.require("/data/data.errors"),
            data = DX.data,
            Guid = data.Guid,
            commonUtils = DX.require("/utils/utils.common"),
            isDefined = commonUtils.isDefined;
        var DEFAULT_PROTOCOL_VERSION = 2;
        var GUID_REGEX = /^(\{{0,1}([0-9a-fA-F]){8}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){4}-([0-9a-fA-F]){12}\}{0,1})$/;
        var VERBOSE_DATE_REGEX = /^\/Date\((-?\d+)((\+|-)?(\d+)?)\)\/$/;
        var ISO8601_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[-+]{1}\d{2}(:?)(\d{2})?)?$/;
        var JSON_VERBOSE_MIME_TYPE = "application/json;odata=verbose";
        function formatISO8601(date, skipZeroTime, skipTimezone) {
            var ret = [];
            var pad = function(n) {
                    if (n < 10)
                        return "0".concat(n);
                    return String(n)
                };
            var isZeroTime = function() {
                    return date.getHours() + date.getMinutes() + date.getSeconds() + date.getMilliseconds() < 1
                };
            ret.push(date.getFullYear());
            ret.push("-");
            ret.push(pad(date.getMonth() + 1));
            ret.push("-");
            ret.push(pad(date.getDate()));
            if (!(skipZeroTime && isZeroTime())) {
                ret.push("T");
                ret.push(pad(date.getHours()));
                ret.push(":");
                ret.push(pad(date.getMinutes()));
                ret.push(":");
                ret.push(pad(date.getSeconds()));
                if (date.getMilliseconds()) {
                    ret.push(".");
                    ret.push(date.getMilliseconds())
                }
                if (!skipTimezone)
                    ret.push("Z")
            }
            return ret.join("")
        }
        function parseISO8601(isoString) {
            var result = new Date(0);
            var chunks = isoString.replace("Z", "").split("T"),
                date = /(\d{4})-(\d{2})-(\d{2})/.exec(chunks[0]),
                time = /(\d{2}):(\d{2}):(\d{2})\.?(\d{0,7})?/.exec(chunks[1]);
            result.setDate(Number(date[3]));
            result.setMonth(Number(date[2]) - 1);
            result.setFullYear(Number(date[1]));
            if ($.isArray(time) && time.length) {
                result.setHours(Number(time[1]));
                result.setMinutes(Number(time[2]));
                result.setSeconds(Number(time[3]));
                result.setMilliseconds(Number(String(time[4]).substr(0, 3)) || 0)
            }
            return result
        }
        function isAbsoluteUrl(url) {
            return /^(?:[a-z]+:)?\/\//i.test(url)
        }
        function toAbsoluteUrl(basePath, relativePath) {
            var part;
            var baseParts = stripParams(basePath).split("/");
            var relativeParts = relativePath.split("/");
            function stripParams(url) {
                var index = url.indexOf("?");
                if (index > -1)
                    return url.substr(0, index);
                return url
            }
            baseParts.pop();
            while (relativeParts.length) {
                part = relativeParts.shift();
                if (part === "..")
                    baseParts.pop();
                else
                    baseParts.push(part)
            }
            return baseParts.join("/")
        }
        var ajaxOptionsForRequest = function(protocolVersion, request, requestOptions) {
                request = $.extend({
                    async: true,
                    method: "get",
                    url: "",
                    params: {},
                    payload: null,
                    headers: {},
                    timeout: 30000
                }, request);
                requestOptions = requestOptions || {};
                var beforeSend = requestOptions.beforeSend;
                if (beforeSend)
                    beforeSend(request);
                var method = (request.method || "get").toLowerCase(),
                    isGet = method === "get",
                    useJsonp = isGet && requestOptions.jsonp,
                    params = $.extend({}, request.params),
                    ajaxData = isGet ? params : formatPayload(request.payload),
                    qs = !isGet && $.param(params),
                    url = request.url,
                    contentType = !isGet && JSON_VERBOSE_MIME_TYPE;
                if (qs)
                    url += (url.indexOf("?") > -1 ? "&" : "?") + qs;
                if (useJsonp)
                    ajaxData["$format"] = "json";
                return {
                        url: url,
                        data: ajaxData,
                        dataType: useJsonp ? "jsonp" : "json",
                        jsonp: useJsonp && "$callback",
                        type: method,
                        async: request.async,
                        timeout: request.timeout,
                        headers: request.headers,
                        contentType: contentType,
                        accepts: {json: [JSON_VERBOSE_MIME_TYPE, "text/plain"].join()},
                        xhrFields: {withCredentials: requestOptions.withCredentials}
                    };
                function formatPayload(payload) {
                    return JSON.stringify(payload, function(key, value) {
                            if (!(this[key] instanceof Date))
                                return value;
                            value = formatISO8601(this[key]);
                            switch (protocolVersion) {
                                case 2:
                                    return value.substr(0, value.length - 1);
                                case 3:
                                case 4:
                                    return value;
                                default:
                                    throw errors.Error("E4002");
                            }
                        })
                }
            };
        var sendRequest = function(protocolVersion, request, requestOptions, deserializeDates) {
                var d = $.Deferred();
                var options = ajaxOptionsForRequest(protocolVersion, request, requestOptions);
                $.ajax(options).always(function(obj, textStatus) {
                    var tuplet = interpretJsonFormat(obj, textStatus, deserializeDates),
                        error = tuplet.error,
                        data = tuplet.data,
                        nextUrl = tuplet.nextUrl,
                        extra;
                    if (error)
                        d.reject(error);
                    else if (requestOptions.countOnly)
                        if (isFinite(tuplet.count))
                            d.resolve(tuplet.count);
                        else
                            d.reject(new errors.Error("E4018"));
                    else if (nextUrl) {
                        if (!isAbsoluteUrl(nextUrl))
                            nextUrl = toAbsoluteUrl(options.url, nextUrl);
                        sendRequest(protocolVersion, {url: nextUrl}, requestOptions, deserializeDates).fail(d.reject).done(function(nextData) {
                            d.resolve(data.concat(nextData))
                        })
                    }
                    else {
                        if (isFinite(tuplet.count))
                            extra = {totalCount: tuplet.count};
                        d.resolve(data, extra)
                    }
                });
                return d.promise()
            };
        var formatDotNetError = function(errorObj) {
                var message,
                    currentError = errorObj;
                if ("message" in errorObj)
                    if (errorObj.message.value)
                        message = errorObj.message.value;
                    else
                        message = errorObj.message;
                while (currentError = currentError.innererror || currentError.internalexception) {
                    message = currentError.message;
                    if (currentError.internalexception && message.indexOf("inner exception") === -1)
                        break
                }
                return message
            };
        var errorFromResponse = function(obj, textStatus) {
                if (textStatus === "nocontent")
                    return null;
                var httpStatus = 200,
                    message = "Unknown error",
                    response = obj;
                if (textStatus !== "success") {
                    httpStatus = obj.status;
                    message = data.utils.errorMessageFromXhr(obj, textStatus);
                    try {
                        response = $.parseJSON(obj.responseText)
                    }
                    catch(x) {}
                }
                var errorObj = response && (response.error || response["odata.error"] || response["@odata.error"]);
                if (errorObj) {
                    message = formatDotNetError(errorObj) || message;
                    if (httpStatus === 200)
                        httpStatus = 500;
                    if (errorObj.code)
                        httpStatus = Number(errorObj.code);
                    return $.extend(Error(message), {
                            httpStatus: httpStatus,
                            errorDetails: errorObj
                        })
                }
                else if (httpStatus !== 200)
                    return $.extend(Error(message), {httpStatus: httpStatus})
            };
        var interpretJsonFormat = function(obj, textStatus, deserializeDates) {
                var error = errorFromResponse(obj, textStatus),
                    value;
                if (error)
                    return {error: error};
                if (!$.isPlainObject(obj))
                    return {data: obj};
                if ("d" in obj && (commonUtils.isArray(obj.d) || commonUtils.isObject(obj.d)))
                    value = interpretVerboseJsonFormat(obj, textStatus);
                else
                    value = interpretLightJsonFormat(obj, textStatus);
                transformTypes(value, deserializeDates);
                return value
            };
        var interpretVerboseJsonFormat = function(obj) {
                var data = obj.d;
                if (!isDefined(data))
                    return {error: Error("Malformed or unsupported JSON response received")};
                data = data;
                if (isDefined(data.results))
                    data = data.results;
                return {
                        data: data,
                        nextUrl: obj.d.__next,
                        count: parseInt(obj.d.__count, 10)
                    }
            };
        var interpretLightJsonFormat = function(obj) {
                var data = obj;
                if (isDefined(data.value))
                    data = data.value;
                return {
                        data: data,
                        nextUrl: obj["@odata.nextLink"],
                        count: parseInt(obj["@odata.count"], 10)
                    }
            };
        var EdmLiteral = Class.inherit({
                ctor: function(value) {
                    this._value = value
                },
                valueOf: function() {
                    return this._value
                }
            });
        var transformTypes = function(obj, deserializeDates) {
                $.each(obj, function(key, value) {
                    if (value !== null && typeof value === "object") {
                        if ("results" in value)
                            obj[key] = value.results;
                        transformTypes(obj[key], deserializeDates)
                    }
                    else if (typeof value === "string") {
                        if (GUID_REGEX.test(value))
                            obj[key] = new Guid(value);
                        if (deserializeDates !== false)
                            if (value.match(VERBOSE_DATE_REGEX)) {
                                var date = new Date(Number(RegExp.$1) + RegExp.$2 * 60 * 1000);
                                obj[key] = new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000)
                            }
                            else if (ISO8601_DATE_REGEX.test(value))
                                obj[key] = new Date(parseISO8601(obj[key]).valueOf())
                    }
                })
            };
        var serializeDate = function(date) {
                return "datetime'" + formatISO8601(date, true, true) + "'"
            };
        var serializeString = function(value) {
                return "'" + value.replace(/'/g, "''") + "'"
            };
        var serializePropName = function(propName) {
                if (propName instanceof EdmLiteral)
                    return propName.valueOf();
                return propName.replace(/\./g, "/")
            };
        var serializeValueV4 = function(value) {
                if (value instanceof Date)
                    return formatISO8601(value, false, false);
                if (value instanceof Guid)
                    return value.valueOf();
                return serializeValueV2(value)
            };
        var serializeValueV2 = function(value) {
                if (value instanceof Date)
                    return serializeDate(value);
                if (value instanceof Guid)
                    return "guid'" + value + "'";
                if (value instanceof EdmLiteral)
                    return value.valueOf();
                if (typeof value === "string")
                    return serializeString(value);
                return String(value)
            };
        var serializeValue = function(value, protocolVersion) {
                switch (protocolVersion) {
                    case 2:
                    case 3:
                        return serializeValueV2(value);
                    case 4:
                        return serializeValueV4(value);
                    default:
                        throw errors.Error("E4002");
                }
            };
        var serializeKey = function(key, protocolVersion) {
                if ($.isPlainObject(key)) {
                    var parts = [];
                    $.each(key, function(k, v) {
                        parts.push(serializePropName(k) + "=" + serializeValue(v, protocolVersion))
                    });
                    return parts.join()
                }
                return serializeValue(key, protocolVersion)
            };
        var keyConverters = {
                String: function(value) {
                    return value + ""
                },
                Int32: function(value) {
                    return Math.floor(value)
                },
                Int64: function(value) {
                    if (value instanceof EdmLiteral)
                        return value;
                    return new EdmLiteral(value + "L")
                },
                Guid: function(value) {
                    if (value instanceof Guid)
                        return value;
                    return new Guid(value)
                },
                Boolean: function(value) {
                    return !!value
                },
                Single: function(value) {
                    if (value instanceof EdmLiteral)
                        return value;
                    return new EdmLiteral(value + "f")
                },
                Decimal: function(value) {
                    if (value instanceof EdmLiteral)
                        return value;
                    return new EdmLiteral(value + "m")
                }
            };
        var compileCriteria = function() {
                var createBinaryOperationFormatter = function(op) {
                        return function(prop, val) {
                                return prop + " " + op + " " + val
                            }
                    };
                var createStringFuncFormatter = function(op, reverse) {
                        return function(prop, val) {
                                var bag = [op, "("];
                                if (reverse)
                                    bag.push(val, ",", prop);
                                else
                                    bag.push(prop, ",", val);
                                bag.push(")");
                                return bag.join("")
                            }
                    };
                var formatters = {
                        "=": createBinaryOperationFormatter("eq"),
                        "<>": createBinaryOperationFormatter("ne"),
                        ">": createBinaryOperationFormatter("gt"),
                        ">=": createBinaryOperationFormatter("ge"),
                        "<": createBinaryOperationFormatter("lt"),
                        "<=": createBinaryOperationFormatter("le"),
                        startswith: createStringFuncFormatter("startswith"),
                        endswith: createStringFuncFormatter("endswith")
                    };
                var formattersV2 = $.extend({}, formatters, {
                        contains: createStringFuncFormatter("substringof", true),
                        notcontains: createStringFuncFormatter("not substringof", true)
                    });
                var formattersV4 = $.extend({}, formatters, {
                        contains: createStringFuncFormatter("contains"),
                        notcontains: createStringFuncFormatter("not contains")
                    });
                var compileBinary = function(criteria, protocolVersion) {
                        criteria = data.utils.normalizeBinaryCriterion(criteria);
                        var op = criteria[1],
                            formatters = protocolVersion === 4 ? formattersV4 : formattersV2,
                            formatter = formatters[op.toLowerCase()];
                        if (!formatter)
                            throw errors.Error("E4003", op);
                        return formatter(serializePropName(criteria[0]), serializeValue(criteria[2], protocolVersion))
                    };
                var compileGroup = function(criteria, protocolVersion) {
                        var bag = [],
                            groupOperator,
                            nextGroupOperator;
                        $.each(criteria, function(index, criterion) {
                            if ($.isArray(criterion)) {
                                if (bag.length > 1 && groupOperator !== nextGroupOperator)
                                    throw new errors.Error("E4019");
                                bag.push("(" + compileCore(criterion, protocolVersion) + ")");
                                groupOperator = nextGroupOperator;
                                nextGroupOperator = "and"
                            }
                            else
                                nextGroupOperator = data.utils.isConjunctiveOperator(this) ? "and" : "or"
                        });
                        return bag.join(" " + groupOperator + " ")
                    };
                var compileCore = function(criteria, protocolVersion) {
                        if ($.isArray(criteria[0]))
                            return compileGroup(criteria, protocolVersion);
                        return compileBinary(criteria, protocolVersion)
                    };
                return function(criteria, protocolVersion) {
                        return compileCore(criteria, protocolVersion)
                    }
            }();
        var createODataQueryAdapter = function(queryOptions) {
                var _sorting = [],
                    _criteria = [],
                    _select,
                    _skip,
                    _take,
                    _countQuery;
                var hasSlice = function() {
                        return _skip || _take !== undefined
                    };
                var hasFunction = function(criterion) {
                        for (var i = 0; i < criterion.length; i++) {
                            if ($.isFunction(criterion[i]))
                                return true;
                            if ($.isArray(criterion[i]) && hasFunction(criterion[i]))
                                return true
                        }
                        return false
                    };
                var generateExpand = function() {
                        var hash = {};
                        if (queryOptions.expand)
                            $.each($.makeArray(queryOptions.expand), function() {
                                hash[serializePropName(this)] = 1
                            });
                        if (_select)
                            $.each(_select, function() {
                                var path = this.split(".");
                                if (path.length < 2)
                                    return;
                                path.pop();
                                hash[serializePropName(path.join("."))] = 1
                            });
                        return $.map(hash, function(k, v) {
                                return v
                            }).join() || undefined
                    };
                var requestData = function() {
                        var result = {};
                        if (!_countQuery) {
                            if (_sorting.length)
                                result["$orderby"] = _sorting.join(",");
                            if (_skip)
                                result["$skip"] = _skip;
                            if (_take !== undefined)
                                result["$top"] = _take;
                            if (_select)
                                result["$select"] = serializePropName(_select.join());
                            result["$expand"] = generateExpand()
                        }
                        if (_criteria.length)
                            result["$filter"] = compileCriteria(_criteria.length < 2 ? _criteria[0] : _criteria, queryOptions.version);
                        if (_countQuery)
                            result["$top"] = 0;
                        if (queryOptions.requireTotalCount || _countQuery)
                            if (queryOptions.version !== 4)
                                result["$inlinecount"] = "allpages";
                            else
                                result["$count"] = "true";
                        return result
                    };
                queryOptions.version = queryOptions.version || DEFAULT_PROTOCOL_VERSION;
                return {
                        exec: function(url) {
                            return sendRequest(queryOptions.version, {
                                    url: url,
                                    params: $.extend(requestData(), queryOptions && queryOptions.params)
                                }, {
                                    beforeSend: queryOptions.beforeSend,
                                    jsonp: queryOptions.jsonp,
                                    withCredentials: queryOptions.withCredentials,
                                    countOnly: _countQuery
                                })
                        },
                        multiSort: function(args) {
                            var rules;
                            if (hasSlice())
                                return false;
                            for (var i = 0; i < args.length; i++) {
                                var getter = args[i][0],
                                    desc = !!args[i][1],
                                    rule;
                                if (typeof getter !== "string")
                                    return false;
                                rule = serializePropName(getter);
                                if (desc)
                                    rule += " desc";
                                rules = rules || [];
                                rules.push(rule)
                            }
                            _sorting = rules
                        },
                        slice: function(skipCount, takeCount) {
                            if (hasSlice())
                                return false;
                            _skip = skipCount;
                            _take = takeCount
                        },
                        filter: function(criterion) {
                            if (hasSlice())
                                return false;
                            if (!$.isArray(criterion))
                                criterion = $.makeArray(arguments);
                            if (hasFunction(criterion))
                                return false;
                            if (_criteria.length)
                                _criteria.push("and");
                            _criteria.push(criterion)
                        },
                        select: function(expr) {
                            if (_select || $.isFunction(expr))
                                return false;
                            if (!$.isArray(expr))
                                expr = $.makeArray(arguments);
                            _select = expr
                        },
                        count: function() {
                            _countQuery = true
                        }
                    }
            };
        $.extend(true, data, {
            EdmLiteral: EdmLiteral,
            utils: {odata: {
                    sendRequest: sendRequest,
                    serializePropName: serializePropName,
                    serializeValue: serializeValue,
                    serializeKey: serializeKey,
                    keyConverters: keyConverters
                }},
            queryAdapters: {odata: createODataQueryAdapter}
        });
        data.OData__internals = {interpretJsonFormat: interpretJsonFormat}
    })(jQuery, DevExpress);
    /*! Module core, file data.store.abstract.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            EventsMixin = DX.require("/eventsMixin"),
            abstract = Class.abstract,
            errors = DevExpress.require("/data/data.errors"),
            data = DX.data,
            normalizeSortingInfo = data.utils.normalizeSortingInfo;
        function multiLevelGroup(query, groupInfo) {
            query = query.groupBy(groupInfo[0].selector);
            if (groupInfo.length > 1)
                query = query.select(function(g) {
                    return $.extend({}, g, {items: multiLevelGroup(data.query(g.items), groupInfo.slice(1)).toArray()})
                });
            return query
        }
        data.utils.multiLevelGroup = multiLevelGroup;
        function arrangeSortingInfo(groupInfo, sortInfo) {
            var filteredGroup = [];
            $.each(groupInfo, function(_, group) {
                var collision = $.grep(sortInfo, function(sort) {
                        return group.selector === sort.selector
                    });
                if (collision.length < 1)
                    filteredGroup.push(group)
            });
            return filteredGroup.concat(sortInfo)
        }
        data.utils.arrangeSortingInfo = arrangeSortingInfo;
        data.Store = Class.inherit({
            ctor: function(options) {
                var that = this;
                options = options || {};
                $.each(["onLoaded", "onLoading", "onInserted", "onInserting", "onUpdated", "onUpdating", "onRemoved", "onRemoving", "onModified", "onModifying"], function(_, optionName) {
                    if (optionName in options)
                        that.on(optionName.slice(2).toLowerCase(), options[optionName])
                });
                this._key = options.key;
                this._errorHandler = options.errorHandler;
                this._useDefaultSearch = true
            },
            _customLoadOptions: function() {
                return null
            },
            key: function() {
                return this._key
            },
            keyOf: function(obj) {
                if (!this._keyGetter)
                    this._keyGetter = data.utils.compileGetter(this.key());
                return this._keyGetter(obj)
            },
            _requireKey: function() {
                if (!this.key())
                    throw errors.Error("E4005");
            },
            load: function(options) {
                var that = this;
                options = options || {};
                this.fireEvent("loading", [options]);
                return this._withLock(this._loadImpl(options)).done(function(result, extra) {
                        that.fireEvent("loaded", [result, options])
                    })
            },
            _loadImpl: function(options) {
                var filter = options.filter,
                    sort = options.sort,
                    select = options.select,
                    group = options.group,
                    skip = options.skip,
                    take = options.take,
                    q = this.createQuery(options);
                if (filter)
                    q = q.filter(filter);
                if (group)
                    group = normalizeSortingInfo(group);
                if (sort || group) {
                    sort = normalizeSortingInfo(sort || []);
                    if (group)
                        sort = arrangeSortingInfo(group, sort);
                    $.each(sort, function(index) {
                        q = q[index ? "thenBy" : "sortBy"](this.selector, this.desc)
                    })
                }
                if (select)
                    q = q.select(select);
                if (group)
                    q = multiLevelGroup(q, group);
                if (take || skip)
                    q = q.slice(skip || 0, take);
                return q.enumerate()
            },
            _withLock: function(task) {
                var result = $.Deferred();
                task.done(function() {
                    var that = this,
                        args = arguments;
                    DX.data.utils.processRequestResultLock.promise().done(function() {
                        result.resolveWith(that, args)
                    })
                }).fail(function() {
                    result.rejectWith(this, arguments)
                });
                return result
            },
            createQuery: abstract,
            totalCount: function(options) {
                return this._totalCountImpl(options)
            },
            _totalCountImpl: function(options) {
                options = options || {};
                var q = this.createQuery(),
                    group = options.group,
                    filter = options.filter;
                if (filter)
                    q = q.filter(filter);
                if (group) {
                    group = normalizeSortingInfo(group);
                    q = multiLevelGroup(q, group)
                }
                return q.count()
            },
            byKey: function(key, extraOptions) {
                return this._addFailHandlers(this._withLock(this._byKeyImpl(key, extraOptions)))
            },
            _byKeyImpl: abstract,
            insert: function(values) {
                var that = this;
                that.fireEvent("modifying");
                that.fireEvent("inserting", [values]);
                return that._addFailHandlers(that._insertImpl(values).done(function(callbackValues, callbackKey) {
                        that.fireEvent("inserted", [callbackValues, callbackKey]);
                        that.fireEvent("modified")
                    }))
            },
            _insertImpl: abstract,
            update: function(key, values) {
                var that = this;
                that.fireEvent("modifying");
                that.fireEvent("updating", [key, values]);
                return that._addFailHandlers(that._updateImpl(key, values).done(function(callbackKey, callbackValues) {
                        that.fireEvent("updated", [callbackKey, callbackValues]);
                        that.fireEvent("modified")
                    }))
            },
            _updateImpl: abstract,
            remove: function(key) {
                var that = this;
                that.fireEvent("modifying");
                that.fireEvent("removing", [key]);
                return that._addFailHandlers(that._removeImpl(key).done(function(callbackKey) {
                        that.fireEvent("removed", [callbackKey]);
                        that.fireEvent("modified")
                    }))
            },
            _removeImpl: abstract,
            _addFailHandlers: function(deferred) {
                return deferred.fail(this._errorHandler, data._errorHandler)
            }
        }).include(EventsMixin)
    })(jQuery, DevExpress);
    /*! Module core, file data.store.array.js */
    (function($, DX, undefined) {
        var data = DX.data,
            Guid = data.Guid,
            errors = DevExpress.require("/data/data.errors"),
            objectUtils = DX.require("/utils/utils.object");
        var trivialPromise = function() {
                var d = $.Deferred();
                return d.resolve.apply(d, arguments).promise()
            };
        var rejectedPromise = function() {
                var d = $.Deferred();
                return d.reject.apply(d, arguments).promise()
            };
        data.ArrayStore = data.Store.inherit({
            ctor: function(options) {
                if ($.isArray(options))
                    options = {data: options};
                else
                    options = options || {};
                this.callBase(options);
                var initialArray = options.data;
                if (initialArray && !$.isArray(initialArray))
                    throw errors.Error("E4006");
                this._array = initialArray || []
            },
            createQuery: function() {
                return data.query(this._array, {errorHandler: this._errorHandler})
            },
            _byKeyImpl: function(key) {
                var index = this._indexByKey(key);
                if (index === -1)
                    return rejectedPromise(errors.Error("E4009"));
                return trivialPromise(this._array[index])
            },
            _insertImpl: function(values) {
                var keyExpr = this.key(),
                    keyValue,
                    obj;
                if ($.isPlainObject(values))
                    obj = $.extend({}, values);
                else
                    obj = values;
                if (keyExpr) {
                    keyValue = this.keyOf(obj);
                    if (keyValue === undefined || typeof keyValue === "object" && $.isEmptyObject(keyValue)) {
                        if ($.isArray(keyExpr))
                            throw errors.Error("E4007");
                        keyValue = obj[keyExpr] = String(new Guid)
                    }
                    else if (this._array[this._indexByKey(keyValue)] !== undefined)
                        return rejectedPromise(errors.Error("E4008"))
                }
                else
                    keyValue = obj;
                this._array.push(obj);
                return trivialPromise(values, keyValue)
            },
            _updateImpl: function(key, values) {
                var target,
                    index;
                if (this.key()) {
                    if (this.keyOf(values))
                        if (!data.utils.keysEqual(this.key(), key, this.keyOf(values)))
                            return rejectedPromise(errors.Error("E4017"));
                    index = this._indexByKey(key);
                    if (index < 0)
                        return rejectedPromise(errors.Error("E4009"));
                    target = this._array[index]
                }
                else
                    target = key;
                objectUtils.deepExtendArraySafe(target, values);
                return trivialPromise(key, values)
            },
            _removeImpl: function(key) {
                var index = this._indexByKey(key);
                if (index > -1)
                    this._array.splice(index, 1);
                return trivialPromise(key)
            },
            _indexByKey: function(key) {
                for (var i = 0, arrayLength = this._array.length; i < arrayLength; i++)
                    if (data.utils.keysEqual(this.key(), this.keyOf(this._array[i]), key))
                        return i;
                return -1
            },
            clear: function() {
                this._array = []
            }
        })
    })(jQuery, DevExpress);
    /*! Module core, file data.store.local.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            abstract = Class.abstract,
            errors = DevExpress.require("/data/data.errors"),
            data = DX.data;
        var LocalStoreBackend = Class.inherit({
                ctor: function(store, storeOptions) {
                    this._store = store;
                    this._dirty = false;
                    var immediate = this._immediate = storeOptions.immediate;
                    var flushInterval = Math.max(100, storeOptions.flushInterval || 10 * 1000);
                    if (!immediate) {
                        var saveProxy = $.proxy(this.save, this);
                        setInterval(saveProxy, flushInterval);
                        $(window).on("beforeunload", saveProxy);
                        if (window.cordova)
                            document.addEventListener("pause", saveProxy, false)
                    }
                },
                notifyChanged: function() {
                    this._dirty = true;
                    if (this._immediate)
                        this.save()
                },
                load: function() {
                    this._store._array = this._loadImpl();
                    this._dirty = false
                },
                save: function() {
                    if (!this._dirty)
                        return;
                    this._saveImpl(this._store._array);
                    this._dirty = false
                },
                _loadImpl: abstract,
                _saveImpl: abstract
            });
        var DomLocalStoreBackend = LocalStoreBackend.inherit({
                ctor: function(store, storeOptions) {
                    this.callBase(store, storeOptions);
                    var name = storeOptions.name;
                    if (!name)
                        throw errors.Error("E4013");
                    this._key = "dx-data-localStore-" + name
                },
                _loadImpl: function() {
                    var raw = localStorage.getItem(this._key);
                    if (raw)
                        return JSON.parse(raw);
                    return []
                },
                _saveImpl: function(array) {
                    if (!array.length)
                        localStorage.removeItem(this._key);
                    else
                        localStorage.setItem(this._key, JSON.stringify(array))
                }
            });
        var localStoreBackends = {dom: DomLocalStoreBackend};
        data.LocalStore = data.ArrayStore.inherit({
            ctor: function(options) {
                if (typeof options === "string")
                    options = {name: options};
                else
                    options = options || {};
                this.callBase(options);
                this._backend = new localStoreBackends[options.backend || "dom"](this, options);
                this._backend.load()
            },
            clear: function() {
                this.callBase();
                this._backend.notifyChanged()
            },
            _insertImpl: function(values) {
                var b = this._backend;
                return this.callBase(values).done($.proxy(b.notifyChanged, b))
            },
            _updateImpl: function(key, values) {
                var b = this._backend;
                return this.callBase(key, values).done($.proxy(b.notifyChanged, b))
            },
            _removeImpl: function(key) {
                var b = this._backend;
                return this.callBase(key).done($.proxy(b.notifyChanged, b))
            }
        })
    })(jQuery, DevExpress);
    /*! Module core, file data.store.odata.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            errors = DevExpress.require("/data/data.errors"),
            proxyUrlFormatter = DX.require("/utils/utils.proxyUrlFormatter"),
            stringUtils = DX.require("/utils/utils.string"),
            commonUtils = DX.require("/utils/utils.common"),
            data = DX.data,
            odataUtils = data.utils.odata;
        var DEFAULT_PROTOCOL_VERSION = 2;
        var formatFunctionInvocationUrl = function(baseUrl, args) {
                return stringUtils.format("{0}({1})", baseUrl, $.map(args || {}, function(value, key) {
                        return stringUtils.format("{0}={1}", key, value)
                    }).join(","))
            };
        var escapeServiceOperationParams = function(params, version) {
                if (!params)
                    return params;
                var result = {};
                $.each(params, function(k, v) {
                    result[k] = odataUtils.serializeValue(v, version)
                });
                return result
            };
        var convertSimpleKey = function(keyType, keyValue) {
                var converter = odataUtils.keyConverters[keyType];
                if (!converter)
                    throw errors.Error("E4014", keyType);
                return converter(keyValue)
            };
        var SharedMethods = {
                _extractServiceOptions: function(options) {
                    options = options || {};
                    this._url = String(options.url).replace(/\/+$/, "");
                    this._beforeSend = options.beforeSend;
                    this._jsonp = options.jsonp;
                    this._version = options.version || DEFAULT_PROTOCOL_VERSION;
                    this._withCredentials = options.withCredentials
                },
                _sendRequest: function(url, method, params, payload) {
                    return odataUtils.sendRequest(this.version(), {
                            url: url,
                            method: method,
                            params: params || {},
                            payload: payload
                        }, {
                            beforeSend: this._beforeSend,
                            jsonp: this._jsonp,
                            withCredentials: this._withCredentials
                        }, this._deserializeDates)
                },
                version: function() {
                    return this._version
                }
            };
        var ODataStore = data.Store.inherit({
                ctor: function(options) {
                    this.callBase(options);
                    this._extractServiceOptions(options);
                    this._keyType = options.keyType;
                    this._deserializeDates = options.deserializeDates;
                    if (this.version() === 2)
                        this._updateMethod = "MERGE";
                    else
                        this._updateMethod = "PATCH"
                },
                _customLoadOptions: function() {
                    return ["expand", "customQueryParams"]
                },
                _byKeyImpl: function(key, extraOptions) {
                    var params = {};
                    if (extraOptions)
                        if (extraOptions.expand)
                            params["$expand"] = $.map($.makeArray(extraOptions.expand), odataUtils.serializePropName).join();
                    return this._sendRequest(this._byKeyUrl(key), "GET", params)
                },
                createQuery: function(loadOptions) {
                    var url,
                        queryOptions;
                    loadOptions = loadOptions || {};
                    queryOptions = {
                        beforeSend: this._beforeSend,
                        errorHandler: this._errorHandler,
                        jsonp: this._jsonp,
                        version: this._version,
                        withCredentials: this._withCredentials,
                        deserializeDates: this._deserializeDates,
                        expand: loadOptions.expand,
                        requireTotalCount: loadOptions.requireTotalCount
                    };
                    if (commonUtils.isDefined(loadOptions.urlOverride))
                        url = loadOptions.urlOverride;
                    else
                        url = this._url;
                    if ("customQueryParams" in loadOptions) {
                        var params = escapeServiceOperationParams(loadOptions.customQueryParams, this.version());
                        if (this.version() === 4)
                            url = formatFunctionInvocationUrl(url, params);
                        else
                            queryOptions.params = params
                    }
                    return data.query(url, queryOptions)
                },
                _insertImpl: function(values) {
                    this._requireKey();
                    var that = this,
                        d = $.Deferred();
                    $.when(this._sendRequest(this._url, "POST", null, values)).done(function(serverResponse) {
                        d.resolve(values, that.keyOf(serverResponse))
                    }).fail(d.reject);
                    return d.promise()
                },
                _updateImpl: function(key, values) {
                    var d = $.Deferred();
                    $.when(this._sendRequest(this._byKeyUrl(key), this._updateMethod, null, values)).done(function() {
                        d.resolve(key, values)
                    }).fail(d.reject);
                    return d.promise()
                },
                _removeImpl: function(key) {
                    var d = $.Deferred();
                    $.when(this._sendRequest(this._byKeyUrl(key), "DELETE")).done(function() {
                        d.resolve(key)
                    }).fail(d.reject);
                    return d.promise()
                },
                _byKeyUrl: function(key, useOriginalHost) {
                    var keyObj = key,
                        keyType = this._keyType,
                        baseUrl = useOriginalHost ? proxyUrlFormatter.formatLocalUrl(this._url) : this._url;
                    if ($.isPlainObject(keyType)) {
                        keyObj = {};
                        $.each(keyType, function(subKeyName, subKeyType) {
                            keyObj[subKeyName] = convertSimpleKey(subKeyType, key[subKeyName])
                        })
                    }
                    else if (keyType)
                        keyObj = convertSimpleKey(keyType, key);
                    return baseUrl + "(" + encodeURIComponent(odataUtils.serializeKey(keyObj, this._version)) + ")"
                }
            }).include(SharedMethods);
        var ODataContext = Class.inherit({
                ctor: function(options) {
                    var that = this;
                    that._extractServiceOptions(options);
                    that._errorHandler = options.errorHandler;
                    $.each(options.entities || [], function(entityAlias, entityOptions) {
                        that[entityAlias] = new ODataStore($.extend({}, options, {url: that._url + "/" + encodeURIComponent(entityOptions.name || entityAlias)}, entityOptions))
                    })
                },
                get: function(operationName, params) {
                    return this.invoke(operationName, params, "GET")
                },
                invoke: function(operationName, params, httpMethod) {
                    params = params || {};
                    httpMethod = (httpMethod || "POST").toLowerCase();
                    var d = $.Deferred(),
                        url = this._url + "/" + encodeURIComponent(operationName),
                        payload;
                    if (this.version() === 4)
                        if (httpMethod === "get") {
                            url = formatFunctionInvocationUrl(url, escapeServiceOperationParams(params, this.version()));
                            params = null
                        }
                        else if (httpMethod === "post") {
                            payload = params;
                            params = null
                        }
                    $.when(this._sendRequest(url, httpMethod, escapeServiceOperationParams(params, this.version()), payload)).done(function(r) {
                        if ($.isPlainObject(r) && operationName in r)
                            r = r[operationName];
                        d.resolve(r)
                    }).fail([this._errorHandler, data._errorHandler, d.reject]);
                    return d.promise()
                },
                objectLink: function(entityAlias, key) {
                    var store = this[entityAlias];
                    if (!store)
                        throw errors.Error("E4015", entityAlias);
                    if (!commonUtils.isDefined(key))
                        return null;
                    return {__metadata: {uri: store._byKeyUrl(key, true)}}
                }
            }).include(SharedMethods);
        $.extend(data, {
            ODataStore: ODataStore,
            ODataContext: ODataContext
        })
    })(jQuery, DevExpress);
    /*! Module core, file data.store.custom.js */
    (function($, DX, undefined) {
        var data = DX.data,
            errors = DevExpress.require("/data/data.errors");
        var TOTAL_COUNT = "totalCount",
            LOAD = "load",
            BY_KEY = "byKey",
            INSERT = "insert",
            UPDATE = "update",
            REMOVE = "remove";
        function isPromise(obj) {
            return obj && $.isFunction(obj.then)
        }
        function trivialPromise(value) {
            return $.Deferred().resolve(value).promise()
        }
        function ensureRequiredFuncOption(name, obj) {
            if (!$.isFunction(obj))
                throw errors.Error("E4011", name);
        }
        function throwInvalidUserFuncResult(name) {
            throw errors.Error("E4012", name);
        }
        function createUserFuncFailureHandler(pendingDeferred) {
            function errorMessageFromXhr(promiseArguments) {
                var xhr = promiseArguments[0],
                    textStatus = promiseArguments[1];
                if (!xhr || !xhr.getResponseHeader)
                    return null;
                return data.utils.errorMessageFromXhr(xhr, textStatus)
            }
            return function(arg) {
                    var error;
                    if (arg instanceof Error)
                        error = arg;
                    else
                        error = new Error(errorMessageFromXhr(arguments) || arg && String(arg) || "Unknown error");
                    pendingDeferred.reject(error)
                }
        }
        data.CustomStore = data.Store.inherit({
            ctor: function(options) {
                options = options || {};
                this.callBase(options);
                this._useDefaultSearch = false;
                this._loadFunc = options[LOAD];
                this._totalCountFunc = options[TOTAL_COUNT];
                this._byKeyFunc = options[BY_KEY];
                this._insertFunc = options[INSERT];
                this._updateFunc = options[UPDATE];
                this._removeFunc = options[REMOVE]
            },
            createQuery: function() {
                throw errors.Error("E4010");
            },
            _totalCountImpl: function(options) {
                var userFunc = this._totalCountFunc,
                    userResult,
                    d = $.Deferred();
                ensureRequiredFuncOption(TOTAL_COUNT, userFunc);
                userResult = userFunc.apply(this, [options]);
                if (!isPromise(userResult)) {
                    userResult = Number(userResult);
                    if (!isFinite(userResult))
                        throwInvalidUserFuncResult(TOTAL_COUNT);
                    userResult = trivialPromise(userResult)
                }
                userResult.then(function(count) {
                    d.resolve(Number(count))
                }, createUserFuncFailureHandler(d));
                return this._addFailHandlers(d.promise())
            },
            _loadImpl: function(options) {
                var userFunc = this._loadFunc,
                    userResult,
                    d = $.Deferred();
                ensureRequiredFuncOption(LOAD, userFunc);
                userResult = userFunc.apply(this, [options]);
                if ($.isArray(userResult))
                    userResult = trivialPromise(userResult);
                else if (userResult === null || userResult === undefined)
                    userResult = trivialPromise([]);
                else if (!isPromise(userResult))
                    throwInvalidUserFuncResult(LOAD);
                userResult.then(function(data, extra) {
                    d.resolve(data, extra)
                }, createUserFuncFailureHandler(d));
                return this._addFailHandlers(d.promise())
            },
            _byKeyImpl: function(key, extraOptions) {
                var userFunc = this._byKeyFunc,
                    userResult,
                    d = $.Deferred();
                ensureRequiredFuncOption(BY_KEY, userFunc);
                userResult = userFunc.apply(this, [key, extraOptions]);
                if (!isPromise(userResult))
                    userResult = trivialPromise(userResult);
                userResult.then(function(obj) {
                    d.resolve(obj)
                }, createUserFuncFailureHandler(d));
                return d.promise()
            },
            _insertImpl: function(values) {
                var userFunc = this._insertFunc,
                    userResult,
                    d = $.Deferred();
                ensureRequiredFuncOption(INSERT, userFunc);
                userResult = userFunc.apply(this, [values]);
                if (!isPromise(userResult))
                    userResult = trivialPromise(userResult);
                userResult.then(function(newKey) {
                    d.resolve(values, newKey)
                }, createUserFuncFailureHandler(d));
                return d.promise()
            },
            _updateImpl: function(key, values) {
                var userFunc = this._updateFunc,
                    userResult,
                    d = $.Deferred();
                ensureRequiredFuncOption(UPDATE, userFunc);
                userResult = userFunc.apply(this, [key, values]);
                if (!isPromise(userResult))
                    userResult = trivialPromise();
                userResult.then(function() {
                    d.resolve(key, values)
                }, createUserFuncFailureHandler(d));
                return d.promise()
            },
            _removeImpl: function(key) {
                var userFunc = this._removeFunc,
                    userResult,
                    d = $.Deferred();
                ensureRequiredFuncOption(REMOVE, userFunc);
                userResult = userFunc.apply(this, [key]);
                if (!isPromise(userResult))
                    userResult = trivialPromise();
                userResult.then(function() {
                    d.resolve(key)
                }, createUserFuncFailureHandler(d));
                return d.promise()
            }
        })
    })(jQuery, DevExpress);
    /*! Module core, file data.dataSource.js */
    (function($, DX, undefined) {
        var data = DX.data,
            CustomStore = data.CustomStore,
            Class = DX.require("/class"),
            EventsMixin = DX.require("/eventsMixin"),
            errors = DX.require("/data/data.errors"),
            array = DX.require("/utils/utils.array"),
            queue = DX.require("/utils/utils.queue"),
            commonUtils = DX.require("/utils/utils.common");
        var CANCELED_TOKEN = "canceled";
        function OperationManager() {
            this._counter = -1;
            this._deferreds = {}
        }
        OperationManager.prototype.constructor = OperationManager;
        OperationManager.prototype.add = function addOperation(deferred) {
            this._counter += 1;
            this._deferreds[this._counter] = deferred;
            return this._counter
        };
        OperationManager.prototype.remove = function removeOperation(operationId) {
            return delete this._deferreds[operationId]
        };
        OperationManager.prototype.cancel = function cancelOperation(operationId) {
            if (operationId in this._deferreds) {
                this._deferreds[operationId].reject(CANCELED_TOKEN);
                return true
            }
            return false
        };
        var operationManager = new OperationManager;
        var storeTypeRegistry = {
                jaydata: "JayDataStore",
                breeze: "BreezeStore",
                odata: "ODataStore",
                local: "LocalStore",
                array: "ArrayStore"
            };
        function isPending(deferred) {
            return deferred.state() === "pending"
        }
        function normalizeDataSourceOptions(options) {
            var store;
            function createCustomStoreFromLoadFunc() {
                var storeConfig = {};
                $.each(["key", "load", "byKey", "lookup", "totalCount", "insert", "update", "remove"], function() {
                    storeConfig[this] = options[this];
                    delete options[this]
                });
                return new CustomStore(storeConfig)
            }
            function createStoreFromConfig(storeConfig) {
                var storeCtor = data[storeTypeRegistry[storeConfig.type]];
                delete storeConfig.type;
                return new storeCtor(storeConfig)
            }
            function createCustomStoreFromUrl(url) {
                return new CustomStore({load: function() {
                            return $.getJSON(url)
                        }})
            }
            if (typeof options === "string")
                options = {
                    paginate: false,
                    store: createCustomStoreFromUrl(options)
                };
            if (options === undefined)
                options = [];
            if ($.isArray(options) || options instanceof data.Store)
                options = {store: options};
            else
                options = $.extend({}, options);
            if (options.store === undefined)
                options.store = [];
            store = options.store;
            if ("load" in options)
                store = createCustomStoreFromLoadFunc();
            else if ($.isArray(store))
                store = new data.ArrayStore(store);
            else if ($.isPlainObject(store))
                store = createStoreFromConfig($.extend({}, store));
            options.store = store;
            return options
        }
        function normalizeStoreLoadOptionAccessorArguments(originalArguments) {
            switch (originalArguments.length) {
                case 0:
                    return undefined;
                case 1:
                    return originalArguments[0]
            }
            return $.makeArray(originalArguments)
        }
        function generateStoreLoadOptionAccessor(optionName) {
            return function() {
                    var args = normalizeStoreLoadOptionAccessorArguments(arguments);
                    if (args === undefined)
                        return this._storeLoadOptions[optionName];
                    this._storeLoadOptions[optionName] = args
                }
        }
        function mapDataRespectingGrouping(items, mapper, groupInfo) {
            function mapRecursive(items, level) {
                if (!commonUtils.isArray(items))
                    return items;
                return level ? mapGroup(items, level) : $.map(items, mapper)
            }
            function mapGroup(group, level) {
                return $.map(group, function(item) {
                        var result = {
                                key: item.key,
                                items: mapRecursive(item.items, level - 1)
                            };
                        if ("aggregates" in item)
                            result.aggregates = item.aggregates;
                        return result
                    })
            }
            return mapRecursive(items, groupInfo ? data.utils.normalizeSortingInfo(groupInfo).length : 0)
        }
        var DataSource = Class.inherit({
                ctor: function(options) {
                    var that = this;
                    options = normalizeDataSourceOptions(options);
                    this._store = options.store;
                    this._storeLoadOptions = this._extractLoadOptions(options);
                    this._mapFunc = options.map;
                    this._postProcessFunc = options.postProcess;
                    this._pageIndex = options.pageIndex !== undefined ? options.pageIndex : 0;
                    this._pageSize = options.pageSize !== undefined ? options.pageSize : 20;
                    this._items = [];
                    this._totalCount = -1;
                    this._isLoaded = false;
                    this._loadingCount = 0;
                    this._loadQueue = this._createLoadQueue();
                    this._searchValue = "searchValue" in options ? options.searchValue : null;
                    this._searchOperation = options.searchOperation || "contains";
                    this._searchExpr = options.searchExpr;
                    this._paginate = options.paginate;
                    if (this._paginate === undefined)
                        this._paginate = !this.group();
                    this._isLastPage = !this._paginate;
                    this._userData = {};
                    $.each(["onChanged", "onLoadError", "onLoadingChanged", "onCustomizeLoadResult", "onCustomizeStoreLoadOptions"], function(_, optionName) {
                        if (optionName in options)
                            that.on(optionName.substr(2, 1).toLowerCase() + optionName.substr(3), options[optionName])
                    })
                },
                dispose: function() {
                    this._disposeEvents();
                    delete this._store;
                    if (this._delayedLoadTask)
                        this._delayedLoadTask.abort();
                    this._disposed = true
                },
                _extractLoadOptions: function(options) {
                    var result = {},
                        names = ["sort", "filter", "select", "group", "requireTotalCount"],
                        customNames = this._store._customLoadOptions();
                    if (customNames)
                        names = names.concat(customNames);
                    $.each(names, function() {
                        result[this] = options[this]
                    });
                    return result
                },
                loadOptions: function() {
                    return this._storeLoadOptions
                },
                items: function() {
                    return this._items
                },
                pageIndex: function(newIndex) {
                    if (newIndex === undefined)
                        return this._pageIndex;
                    this._pageIndex = newIndex;
                    this._isLastPage = !this._paginate
                },
                paginate: function(value) {
                    if (arguments.length < 1)
                        return this._paginate;
                    value = !!value;
                    if (this._paginate !== value) {
                        this._paginate = value;
                        this.pageIndex(0)
                    }
                },
                pageSize: function(value) {
                    if (arguments.length < 1)
                        return this._pageSize;
                    this._pageSize = value
                },
                isLastPage: function() {
                    return this._isLastPage
                },
                sort: generateStoreLoadOptionAccessor("sort"),
                filter: function() {
                    var newFilter = normalizeStoreLoadOptionAccessorArguments(arguments);
                    if (newFilter === undefined)
                        return this._storeLoadOptions.filter;
                    this._storeLoadOptions.filter = newFilter;
                    this.pageIndex(0)
                },
                group: generateStoreLoadOptionAccessor("group"),
                select: generateStoreLoadOptionAccessor("select"),
                requireTotalCount: generateStoreLoadOptionAccessor("requireTotalCount"),
                searchValue: function(value) {
                    if (value === undefined)
                        return this._searchValue;
                    this.pageIndex(0);
                    this._searchValue = value
                },
                searchOperation: function(op) {
                    if (op === undefined)
                        return this._searchOperation;
                    this.pageIndex(0);
                    this._searchOperation = op
                },
                searchExpr: function(expr) {
                    var argc = arguments.length;
                    if (argc === 0)
                        return this._searchExpr;
                    if (argc > 1)
                        expr = $.makeArray(arguments);
                    this.pageIndex(0);
                    this._searchExpr = expr
                },
                store: function() {
                    return this._store
                },
                key: function() {
                    return this._store && this._store.key()
                },
                totalCount: function() {
                    return this._totalCount
                },
                isLoaded: function() {
                    return this._isLoaded
                },
                isLoading: function() {
                    return this._loadingCount > 0
                },
                _createLoadQueue: function() {
                    return queue.create()
                },
                _changeLoadingCount: function(increment) {
                    var oldLoading = this.isLoading(),
                        newLoading;
                    this._loadingCount += increment;
                    newLoading = this.isLoading();
                    if (oldLoading ^ newLoading)
                        this.fireEvent("loadingChanged", [newLoading])
                },
                _scheduleLoadCallbacks: function(deferred) {
                    var that = this;
                    that._changeLoadingCount(1);
                    deferred.always(function() {
                        that._changeLoadingCount(-1)
                    })
                },
                _scheduleFailCallbacks: function(deferred) {
                    var that = this;
                    deferred.fail(function() {
                        if (arguments[0] === CANCELED_TOKEN)
                            return;
                        that.fireEvent("loadError", arguments)
                    })
                },
                _scheduleChangedCallbacks: function(deferred) {
                    var that = this;
                    deferred.done(function() {
                        that.fireEvent("changed")
                    })
                },
                loadSingle: function(propName, propValue) {
                    var that = this;
                    var d = $.Deferred(),
                        key = this.key(),
                        store = this._store,
                        options = this._createStoreLoadOptions(),
                        handleDone = function(data) {
                            if (!commonUtils.isDefined(data) || array.isEmpty(data))
                                d.reject(new errors.Error("E4009"));
                            else
                                d.resolve(that._applyMapFunction($.makeArray(data))[0])
                        };
                    this._scheduleFailCallbacks(d);
                    if (arguments.length < 2) {
                        propValue = propName;
                        propName = key
                    }
                    delete options.skip;
                    delete options.group;
                    delete options.refresh;
                    delete options.pageIndex;
                    delete options.searchString;
                    (function() {
                        if (propName === key || store instanceof data.CustomStore)
                            return store.byKey(propValue, options);
                        options.take = 1;
                        options.filter = options.filter ? [options.filter, [propName, propValue]] : [propName, propValue];
                        return store.load(options)
                    })().fail(d.reject).done(handleDone);
                    return d.promise()
                },
                load: function() {
                    var that = this,
                        d = $.Deferred(),
                        loadOperation;
                    function loadTask() {
                        if (that._disposed)
                            return undefined;
                        if (!isPending(d))
                            return;
                        return that._loadFromStore(loadOperation, d)
                    }
                    this._scheduleLoadCallbacks(d);
                    this._scheduleFailCallbacks(d);
                    this._scheduleChangedCallbacks(d);
                    loadOperation = this._createLoadOperation(d);
                    this.fireEvent("customizeStoreLoadOptions", [loadOperation]);
                    this._loadQueue.add(function() {
                        if (typeof loadOperation.delay === "number")
                            that._delayedLoadTask = commonUtils.executeAsync(loadTask, loadOperation.delay);
                        else
                            loadTask();
                        return d.promise()
                    });
                    return d.promise({operationId: loadOperation.operationId})
                },
                _createLoadOperation: function(deferred) {
                    var id = operationManager.add(deferred),
                        options = this._createStoreLoadOptions();
                    deferred.always(function() {
                        operationManager.remove(id)
                    });
                    return {
                            operationId: id,
                            storeLoadOptions: options
                        }
                },
                reload: function() {
                    var prop,
                        userData = this._userData;
                    for (prop in userData)
                        if (userData.hasOwnProperty(prop))
                            delete userData[prop];
                    this._totalCount = -1;
                    this._isLoaded = false;
                    return this.load()
                },
                cancel: function(loadOperationId) {
                    return operationManager.cancel(loadOperationId)
                },
                _addSearchOptions: function(storeLoadOptions) {
                    if (this._disposed)
                        return;
                    if (this.store()._useDefaultSearch)
                        this._addSearchFilter(storeLoadOptions);
                    else {
                        storeLoadOptions.searchOperation = this._searchOperation;
                        storeLoadOptions.searchValue = this._searchValue;
                        storeLoadOptions.searchExpr = this._searchExpr
                    }
                },
                _createStoreLoadOptions: function() {
                    var result = $.extend({}, this._storeLoadOptions);
                    this._addSearchOptions(result);
                    if (this._paginate)
                        if (this._pageSize) {
                            result.skip = this._pageIndex * this._pageSize;
                            result.take = this._pageSize
                        }
                    result.userData = this._userData;
                    return result
                },
                _addSearchFilter: function(storeLoadOptions) {
                    var value = this._searchValue,
                        op = this._searchOperation,
                        selector = this._searchExpr,
                        searchFilter = [];
                    if (!value)
                        return;
                    if (!selector)
                        selector = "this";
                    if (!$.isArray(selector))
                        selector = [selector];
                    $.each(selector, function(i, item) {
                        if (searchFilter.length)
                            searchFilter.push("or");
                        searchFilter.push([item, op, value])
                    });
                    if (storeLoadOptions.filter)
                        storeLoadOptions.filter = [searchFilter, storeLoadOptions.filter];
                    else
                        storeLoadOptions.filter = searchFilter
                },
                _loadFromStore: function(loadOptions, pendingDeferred) {
                    var that = this;
                    function handleSuccess(data, extra) {
                        function processResult() {
                            var loadResult;
                            loadResult = $.extend({
                                data: data,
                                extra: extra
                            }, loadOptions);
                            that.fireEvent("customizeLoadResult", [loadResult]);
                            $.when(loadResult.data).done(function(data) {
                                loadResult.data = data;
                                that._processStoreLoadResult(loadResult, pendingDeferred)
                            }).fail(pendingDeferred.reject)
                        }
                        if (that._disposed)
                            return;
                        if (!isPending(pendingDeferred))
                            return;
                        processResult()
                    }
                    if (loadOptions.data)
                        return $.Deferred().resolve(loadOptions.data).done(handleSuccess);
                    return this.store().load(loadOptions.storeLoadOptions).done(handleSuccess).fail(pendingDeferred.reject)
                },
                _processStoreLoadResult: function(loadResult, pendingDeferred) {
                    var that = this;
                    var data = $.makeArray(loadResult.data),
                        extra = loadResult.extra,
                        storeLoadOptions = loadResult.storeLoadOptions;
                    function resolvePendingDeferred() {
                        that._isLoaded = true;
                        that._totalCount = isFinite(extra.totalCount) ? extra.totalCount : -1;
                        return pendingDeferred.resolve(data, extra)
                    }
                    function proceedLoadingTotalCount() {
                        that.store().totalCount(storeLoadOptions).done(function(count) {
                            extra.totalCount = count;
                            resolvePendingDeferred()
                        }).fail(pendingDeferred.reject)
                    }
                    if (that._disposed)
                        return;
                    data = that._applyPostProcessFunction(that._applyMapFunction(data));
                    if (!$.isPlainObject(extra))
                        extra = {};
                    that._items = data;
                    if (!data.length || !that._paginate || that._pageSize && data.length < that._pageSize)
                        that._isLastPage = true;
                    if (storeLoadOptions.requireTotalCount && !isFinite(extra.totalCount))
                        proceedLoadingTotalCount();
                    else
                        resolvePendingDeferred()
                },
                _applyMapFunction: function(data) {
                    if (this._mapFunc)
                        return mapDataRespectingGrouping(data, this._mapFunc, this.group());
                    return data
                },
                _applyPostProcessFunction: function(data) {
                    if (this._postProcessFunc)
                        return this._postProcessFunc(data);
                    return data
                }
            }).include(EventsMixin);
        $.extend(true, data, {
            DataSource: DataSource,
            utils: {
                storeTypeRegistry: storeTypeRegistry,
                normalizeDataSourceOptions: normalizeDataSourceOptions
            }
        })
    })(jQuery, DevExpress);
    /*! Module core, file uiNamespace.js */
    DevExpress.define("/ui/uiNamespace", ["/coreNamespace", "/ui/ui.themes", "/ui/templates/ui.templateBase", "/integration/jquery/jquery.template", "/ui/ui.actionExecutors"], function(coreNamespace, themes, TemplateBase, Template) {
        var uiNamespace = coreNamespace.ui = coreNamespace.ui || {};
        uiNamespace.themes = {current: themes.current};
        uiNamespace.setTemplateEngine = Template.setTemplateEngine;
        uiNamespace.templateRendered = TemplateBase.renderedCallbacks;
        return uiNamespace
    });
    /*! Module core, file ui.themes.js */
    DevExpress.define("/ui/ui.themes", ["jquery", "/ui/ui.errors", "/utils/utils.dom", "/devices", "/utils/utils.viewPort"], function($, errors, domUtils, devices, viewPortUtils) {
        var viewPort = viewPortUtils.value,
            viewPortChanged = viewPortUtils.changeCallback;
        var DX_LINK_SELECTOR = "link[rel=dx-theme]",
            THEME_ATTR = "data-theme",
            ACTIVE_ATTR = "data-active",
            DX_HAIRLINES_CLASS = "dx-hairlines";
        var context,
            $activeThemeLink,
            knownThemes,
            currentThemeName,
            pendingThemeName;
        var THEME_MARKER_PREFIX = "dx.";
        function readThemeMarker() {
            var element = $("<div></div>", context).addClass("dx-theme-marker").appendTo(context.documentElement),
                result;
            try {
                result = element.css("font-family");
                if (!result)
                    return null;
                result = result.replace(/["']/g, "");
                if (result.substr(0, THEME_MARKER_PREFIX.length) !== THEME_MARKER_PREFIX)
                    return null;
                return result.substr(THEME_MARKER_PREFIX.length)
            }
            finally {
                element.remove()
            }
        }
        function waitForThemeLoad(themeName, callback) {
            var timerId,
                waitStartTime;
            pendingThemeName = themeName;
            function handleLoaded() {
                pendingThemeName = null;
                callback()
            }
            if (isPendingThemeLoaded())
                handleLoaded();
            else {
                waitStartTime = $.now();
                timerId = setInterval(function() {
                    var isLoaded = isPendingThemeLoaded(),
                        isTimeout = !isLoaded && $.now() - waitStartTime > 15 * 1000;
                    if (isTimeout)
                        errors.log("W0004", pendingThemeName);
                    if (isLoaded || isTimeout) {
                        clearInterval(timerId);
                        handleLoaded()
                    }
                }, 10)
            }
        }
        function isPendingThemeLoaded() {
            return !pendingThemeName || readThemeMarker() === pendingThemeName
        }
        function processMarkup() {
            var $allThemeLinks = $(DX_LINK_SELECTOR, context);
            if (!$allThemeLinks.length)
                return;
            knownThemes = {};
            $activeThemeLink = $(domUtils.createMarkupFromString("<link rel=stylesheet>"), context);
            $allThemeLinks.each(function() {
                var link = $(this, context),
                    fullThemeName = link.attr(THEME_ATTR),
                    url = link.attr("href"),
                    isActive = link.attr(ACTIVE_ATTR) === "true";
                knownThemes[fullThemeName] = {
                    url: url,
                    isActive: isActive
                }
            });
            $allThemeLinks.last().after($activeThemeLink);
            $allThemeLinks.remove()
        }
        function resolveFullThemeName(desiredThemeName) {
            var desiredThemeParts = desiredThemeName.split("."),
                result = null;
            if (knownThemes)
                $.each(knownThemes, function(knownThemeName, themeData) {
                    var knownThemeParts = knownThemeName.split(".");
                    if (knownThemeParts[0] !== desiredThemeParts[0])
                        return;
                    if (desiredThemeParts[1] && desiredThemeParts[1] !== knownThemeParts[1])
                        return;
                    if (desiredThemeParts[2] && desiredThemeParts[2] !== knownThemeParts[2])
                        return;
                    if (!result || themeData.isActive)
                        result = knownThemeName;
                    if (themeData.isActive)
                        return false
                });
            return result
        }
        function initContext(newContext) {
            try {
                if (newContext !== context)
                    knownThemes = null
            }
            catch(x) {
                knownThemes = null
            }
            context = newContext
        }
        function init(options) {
            options = options || {};
            initContext(options.context || document);
            processMarkup();
            currentThemeName = undefined;
            current(options)
        }
        function current(options) {
            if (!arguments.length)
                return currentThemeName || readThemeMarker();
            detachCssClasses(viewPort(), currentThemeName);
            options = options || {};
            if (typeof options === "string")
                options = {theme: options};
            var isAutoInit = options._autoInit,
                loadCallback = options.loadCallback,
                currentThemeData;
            currentThemeName = options.theme || currentThemeName;
            if (isAutoInit && !currentThemeName)
                currentThemeName = themeNameFromDevice(devices.current());
            currentThemeName = resolveFullThemeName(currentThemeName);
            if (currentThemeName)
                currentThemeData = knownThemes[currentThemeName];
            if (currentThemeData) {
                $activeThemeLink.attr("href", knownThemes[currentThemeName].url);
                if (loadCallback)
                    waitForThemeLoad(currentThemeName, loadCallback);
                else if (pendingThemeName)
                    pendingThemeName = currentThemeName
            }
            else if (isAutoInit) {
                if (loadCallback)
                    loadCallback()
            }
            else
                throw errors.Error("E0021", currentThemeName);
            attachCssClasses(viewPort(), currentThemeName)
        }
        function themeNameFromDevice(device) {
            var themeName = device.platform;
            var majorVersion = device.version && device.version[0];
            var isForced = devices.isForced();
            switch (themeName) {
                case"ios":
                    themeName += "7";
                    break;
                case"android":
                    themeName += "5";
                    break;
                case"win":
                    themeName += majorVersion && majorVersion === 8 && isForced ? "8" : "10";
                    break
            }
            return themeName
        }
        function getCssClasses(themeName) {
            themeName = themeName || current();
            var result = [],
                themeNameParts = themeName && themeName.split(".");
            if (themeNameParts) {
                result.push("dx-theme-" + themeNameParts[0], "dx-theme-" + themeNameParts[0] + "-typography");
                if (themeNameParts.length > 1)
                    result.push("dx-color-scheme-" + themeNameParts[1])
            }
            return result
        }
        var themeClasses;
        function attachCssClasses(element, themeName) {
            themeClasses = getCssClasses(themeName).join(" ");
            $(element).addClass(themeClasses);
            var activateHairlines = function() {
                    var pixelRatio = window.devicePixelRatio;
                    if (!pixelRatio || pixelRatio < 2)
                        return;
                    var $tester = $("<div>");
                    $tester.css("border", ".5px solid transparent");
                    $("body").append($tester);
                    if ($tester.outerHeight() === 1) {
                        $(element).addClass(DX_HAIRLINES_CLASS);
                        themeClasses += " " + DX_HAIRLINES_CLASS
                    }
                    $tester.remove()
                };
            activateHairlines()
        }
        function detachCssClasses(element, themeName) {
            $(element).removeClass(themeClasses)
        }
        $.holdReady(true);
        init({
            _autoInit: true,
            loadCallback: function() {
                $.holdReady(false)
            }
        });
        $(function() {
            if ($(DX_LINK_SELECTOR, context).length)
                throw errors.Error("E0022");
        });
        viewPortChanged.add(function(viewPort, prevViewPort) {
            detachCssClasses(prevViewPort);
            attachCssClasses(viewPort)
        });
        devices.changed.add(function() {
            init({_autoInit: true})
        });
        return {
                init: init,
                current: current,
                attachCssClasses: attachCssClasses,
                detachCssClasses: detachCssClasses,
                themeNameFromDevice: themeNameFromDevice,
                waitForThemeLoad: waitForThemeLoad,
                resetTheme: function() {
                    $activeThemeLink.attr("href", "about:blank");
                    currentThemeName = null;
                    pendingThemeName = null
                }
            }
    });
    /*! Module core, file ui.keyboardProcessor.js */
    DevExpress.define("/ui/ui.keyboardProcessor", ["jquery", "/class", "/ui/events/ui.events.utils"], function($, Class, eventUtils) {
        var KeyboardProcessor = Class.inherit({
                _keydown: eventUtils.addNamespace("keydown", "KeyboardProcessor"),
                codes: {
                    "8": "backspace",
                    "9": "tab",
                    "13": "enter",
                    "27": "escape",
                    "33": "pageUp",
                    "34": "pageDown",
                    "35": "end",
                    "36": "home",
                    "37": "leftArrow",
                    "38": "upArrow",
                    "39": "rightArrow",
                    "40": "downArrow",
                    "46": "del",
                    "32": "space",
                    "70": "F",
                    "65": "A",
                    "106": "asterisk",
                    "109": "minus"
                },
                ctor: function(options) {
                    var _this = this;
                    options = options || {};
                    if (options.element)
                        this._element = $(options.element);
                    if (options.focusTarget)
                        this._focusTarget = options.focusTarget;
                    this._handler = options.handler;
                    this._context = options.context;
                    this._childProcessors = [];
                    if (this._element)
                        this._element.on(this._keydown, function(e) {
                            _this.process(e)
                        })
                },
                dispose: function() {
                    if (this._element)
                        this._element.off(this._keydown);
                    this._element = undefined;
                    this._handler = undefined;
                    this._context = undefined;
                    this._childProcessors = undefined
                },
                clearChildren: function() {
                    this._childProcessors = []
                },
                push: function(child) {
                    if (!this._childProcessors)
                        this.clearChildren();
                    this._childProcessors.push(child);
                    return child
                },
                attachChildProcessor: function() {
                    var childProcessor = new KeyboardProcessor;
                    this._childProcessors.push(childProcessor);
                    return childProcessor
                },
                reinitialize: function(childHandler, childContext) {
                    this._context = childContext;
                    this._handler = childHandler;
                    return this
                },
                process: function(e) {
                    if (this._focusTarget && this._focusTarget !== e.target && $.inArray(e.target, this._focusTarget) < 0)
                        return false;
                    var args = {
                            key: this.codes[e.which] || e.which,
                            ctrl: e.ctrlKey,
                            shift: e.shiftKey,
                            alt: e.altKey,
                            originalEvent: e
                        };
                    var handlerResult = this._handler && this._handler.call(this._context, args);
                    if (handlerResult && this._childProcessors)
                        $.each(this._childProcessors, function(index, childProcessor) {
                            childProcessor.process(e)
                        })
                }
            });
        return KeyboardProcessor
    });
    /*! Module core, file ui.widget.js */
    DevExpress.define("/ui/ui.widget", ["jquery", "/ui/ui.errors", "/action", "/utils/utils.dom", "/utils/utils.common", "/devices", "/domComponent", "/ui/templates/ui.templateBase", "/ui/templates/ui.template.dynamic", "/ui/templates/ui.template.empty", "/ui/templates/ui.template.move", "/integration/jquery/jquery.templateProvider", "/ui/ui.keyboardProcessor", "/integration/jquery/jquery.selectors", "/ui/events/ui.events.utils", "/ui/events/ui.events.hover", "/ui/events/ui.events.emitter.feedback"], function($, errors, Action, domUtils, commonUtils, devices, DOMComponent, TemplateBase, DynamicTemplate, EmptyTemplate, MoveTemplate, TemplateProvider, KeyboardProcessor, selectors, eventUtils, hoverEvents, feedbackEvents) {
        var UI_FEEDBACK = "UIFeedback",
            WIDGET_CLASS = "dx-widget",
            ACTIVE_STATE_CLASS = "dx-state-active",
            DISABLED_STATE_CLASS = "dx-state-disabled",
            INVISIBLE_STATE_CLASS = "dx-state-invisible",
            HOVER_STATE_CLASS = "dx-state-hover",
            FOCUSED_STATE_CLASS = "dx-state-focused",
            FEEDBACK_SHOW_TIMEOUT = 30,
            FEEDBACK_HIDE_TIMEOUT = 400,
            FOCUS_NAMESPACE = "Focus",
            ANONYMOUS_TEMPLATE_NAME = "template",
            TEXT_NODE = 3,
            TEMPLATE_SELECTOR = "[data-options*='dxTemplate']",
            TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper";
        var Widget = DOMComponent.inherit({
                _supportedKeys: function() {
                    return {}
                },
                _getDefaultOptions: function() {
                    return $.extend(this.callBase(), {
                            disabled: false,
                            visible: true,
                            hint: undefined,
                            activeStateEnabled: false,
                            onContentReady: null,
                            hoverStateEnabled: false,
                            focusStateEnabled: false,
                            tabIndex: 0,
                            accessKey: null,
                            onFocusIn: null,
                            onFocusOut: null,
                            templateProvider: TemplateProvider,
                            _keyboardProcessor: undefined,
                            _templates: {}
                        })
                },
                _init: function() {
                    this.callBase();
                    this._feedbackShowTimeout = FEEDBACK_SHOW_TIMEOUT;
                    this._feedbackHideTimeout = FEEDBACK_HIDE_TIMEOUT;
                    this._tempTemplates = [];
                    this._dynamicTemplates = {};
                    this._initTemplates();
                    this._initContentReadyAction()
                },
                _initTemplates: function() {
                    this._extractTemplates();
                    this._extractAnonymousTemplate()
                },
                _extractTemplates: function() {
                    var templates = this.option("_templates"),
                        templateElements = this.element().contents().filter(TEMPLATE_SELECTOR);
                    var templatesMap = {};
                    templateElements.each(function(_, template) {
                        var templateOptions = domUtils.getElementOptions(template).dxTemplate;
                        if (!templateOptions)
                            return;
                        if (!templateOptions.name)
                            throw errors.Error("E0023");
                        $(template).addClass(TEMPLATE_WRAPPER_CLASS).detach();
                        templatesMap[templateOptions.name] = templatesMap[templateOptions.name] || [];
                        templatesMap[templateOptions.name].push(template)
                    });
                    $.each(templatesMap, $.proxy(function(templateName, value) {
                        var deviceTemplate = this._findTemplateByDevice(value);
                        if (deviceTemplate)
                            templates[templateName] = this._createTemplate(deviceTemplate, this)
                    }, this))
                },
                _findTemplateByDevice: function(templates) {
                    var suitableTemplate = commonUtils.findBestMatches(devices.current(), templates, function(template) {
                            return domUtils.getElementOptions(template).dxTemplate
                        })[0];
                    $.each(templates, function(index, template) {
                        if (template !== suitableTemplate)
                            $(template).remove()
                    });
                    return suitableTemplate
                },
                _extractAnonymousTemplate: function() {
                    var templates = this.option("_templates"),
                        anonymiousTemplateName = this._getAnonymousTemplateName(),
                        $anonymiousTemplate = this.element().contents().detach();
                    var $notJunkTemplateContent = $anonymiousTemplate.filter(function(_, element) {
                            var isTextNode = element.nodeType === TEXT_NODE,
                                isEmptyText = $.trim($(element).text()).length < 1;
                            return !(isTextNode && isEmptyText)
                        }),
                        onlyJunkTemplateContent = $notJunkTemplateContent.length < 1;
                    if (!templates[anonymiousTemplateName] && !onlyJunkTemplateContent)
                        templates[anonymiousTemplateName] = this._createTemplate($anonymiousTemplate, this)
                },
                _getAriaTarget: function() {
                    return this._focusTarget()
                },
                _getAnonymousTemplateName: function() {
                    return ANONYMOUS_TEMPLATE_NAME
                },
                _getTemplateByOption: function(optionName) {
                    return this._getTemplate(this.option(optionName))
                },
                _getTemplate: function(templateSource) {
                    if ($.isFunction(templateSource)) {
                        var that = this;
                        return new DynamicTemplate(function() {
                                var templateSourceResult = templateSource.apply(that, arguments);
                                if (commonUtils.isDefined(templateSourceResult))
                                    return that._acquireTemplate(templateSourceResult, this, true);
                                else
                                    return new EmptyTemplate
                            }, this)
                    }
                    return this._acquireTemplate(templateSource, this)
                },
                _acquireTemplate: function(templateSource, owner, preferRenderer) {
                    if (templateSource == null)
                        return this._createTemplate(domUtils.normalizeTemplateElement(templateSource), owner);
                    if (templateSource instanceof TemplateBase)
                        return templateSource;
                    if (templateSource.nodeType || templateSource.jquery) {
                        templateSource = $(templateSource);
                        if (preferRenderer && !templateSource.is("script"))
                            return new MoveTemplate(templateSource, owner);
                        return this._createTemplate(templateSource, owner)
                    }
                    if (typeof templateSource === "string") {
                        var userTemplate = this.option("_templates")[templateSource];
                        if (userTemplate)
                            return userTemplate;
                        var dynamicTemplate = this._dynamicTemplates[templateSource];
                        if (dynamicTemplate)
                            return dynamicTemplate;
                        var defaultTemplate = this.option("templateProvider").getTemplates(this)[templateSource];
                        if (defaultTemplate)
                            return defaultTemplate;
                        return this._createTemplate(domUtils.normalizeTemplateElement(templateSource), owner)
                    }
                    return this._acquireTemplate(templateSource.toString(), owner)
                },
                _createTemplate: function(element, owner) {
                    var template = this.option("templateProvider").createTemplate(element, owner);
                    this._tempTemplates.push(template);
                    return template
                },
                _cleanTemplates: function() {
                    var that = this;
                    $.each(this.option("_templates"), function(_, template) {
                        if (that === template.owner())
                            template.dispose()
                    });
                    $.each(this._tempTemplates, function(_, template) {
                        template.dispose()
                    })
                },
                _initContentReadyAction: function() {
                    this._contentReadyAction = this._createActionByOption("onContentReady", {excludeValidators: ["designMode", "disabled", "readOnly"]})
                },
                _render: function() {
                    this.element().addClass(WIDGET_CLASS);
                    this.callBase();
                    this._toggleDisabledState(this.option("disabled"));
                    this._toggleVisibility(this.option("visible"));
                    this._renderHint();
                    this._renderContent();
                    this._renderFocusState();
                    this._attachFeedbackEvents();
                    this._attachHoverEvents()
                },
                _renderHint: function() {
                    domUtils.toggleAttr(this.element(), "title", this.option("hint"))
                },
                _renderContent: function() {
                    this._renderContentImpl();
                    this._fireContentReadyAction()
                },
                _renderContentImpl: $.noop,
                _fireContentReadyAction: function() {
                    this._contentReadyAction()
                },
                _dispose: function() {
                    this._cleanTemplates();
                    this._contentReadyAction = null;
                    this.callBase()
                },
                _clean: function() {
                    this._cleanFocusState();
                    this.callBase();
                    this.element().empty()
                },
                _toggleVisibility: function(visible) {
                    this.element().toggleClass(INVISIBLE_STATE_CLASS, !visible);
                    this.setAria("hidden", !visible || undefined)
                },
                _renderFocusState: function() {
                    if (!this.option("focusStateEnabled") || this.option("disabled"))
                        return;
                    this._renderFocusTarget();
                    this._attachFocusEvents();
                    this._attachKeyboardEvents();
                    this._renderAccessKey()
                },
                _renderAccessKey: function() {
                    var focusTarget = this._focusTarget();
                    focusTarget.attr("accesskey", this.option("accessKey"));
                    var clickNamespace = eventUtils.addNamespace("dxclick", UI_FEEDBACK);
                    focusTarget.off(clickNamespace);
                    this.option("accessKey") && focusTarget.on(clickNamespace, $.proxy(function(e) {
                        if (eventUtils.isFakeClickEvent(e)) {
                            e.stopImmediatePropagation();
                            this.focus()
                        }
                    }, this))
                },
                _eventBindingTarget: function() {
                    return this.element()
                },
                _focusTarget: function() {
                    return this._getActiveElement()
                },
                _getActiveElement: function() {
                    var activeElement = this._eventBindingTarget();
                    if (this._activeStateUnit)
                        activeElement = activeElement.find(this._activeStateUnit).not("." + DISABLED_STATE_CLASS);
                    return activeElement
                },
                _renderFocusTarget: function() {
                    this._focusTarget().attr("tabindex", this.option("tabIndex"))
                },
                _keyboardEventBindingTarget: function() {
                    return this._eventBindingTarget()
                },
                _detachFocusEvents: function() {
                    var $element = this._focusTarget(),
                        focusInEvent = eventUtils.addNamespace("focusin", this.NAME + FOCUS_NAMESPACE),
                        focusOutEvent = eventUtils.addNamespace("focusout", this.NAME + FOCUS_NAMESPACE),
                        beforeactivateEvent = eventUtils.addNamespace("beforeactivate", this.NAME + FOCUS_NAMESPACE);
                    $element.off(focusInEvent + " " + focusOutEvent + " " + beforeactivateEvent)
                },
                _attachFocusEvents: function() {
                    var focusInEvent = eventUtils.addNamespace("focusin", this.NAME + FOCUS_NAMESPACE),
                        focusOutEvent = eventUtils.addNamespace("focusout", this.NAME + FOCUS_NAMESPACE),
                        beforeactivateEvent = eventUtils.addNamespace("beforeactivate", this.NAME + FOCUS_NAMESPACE);
                    this._focusTarget().on(focusInEvent, $.proxy(this._focusInHandler, this)).on(focusOutEvent, $.proxy(this._focusOutHandler, this)).on(beforeactivateEvent, function(e) {
                        if (!$(e.target).is(selectors.focusable))
                            e.preventDefault()
                    })
                },
                _refreshFocusEvent: function() {
                    this._detachFocusEvents();
                    this._attachFocusEvents()
                },
                _focusInHandler: function(e) {
                    var that = this;
                    that._createActionByOption("onFocusIn", {
                        beforeExecute: function() {
                            that._updateFocusState(e, true)
                        },
                        excludeValidators: ["readOnly"]
                    })({jQueryEvent: e})
                },
                _focusOutHandler: function(e) {
                    var that = this;
                    that._createActionByOption("onFocusOut", {
                        beforeExecute: function() {
                            that._updateFocusState(e, false)
                        },
                        excludeValidators: ["readOnly"]
                    })({jQueryEvent: e})
                },
                _updateFocusState: function(e, isFocused) {
                    var target = e.target;
                    if ($.inArray(target, this._focusTarget()) !== -1)
                        this._toggleFocusClass(isFocused, target)
                },
                _toggleFocusClass: function(isFocused, element) {
                    var $focusTarget = $(element || this._focusTarget());
                    $focusTarget.toggleClass(FOCUSED_STATE_CLASS, isFocused)
                },
                _hasFocusClass: function(element) {
                    var $focusTarget = $(element || this._focusTarget());
                    return $focusTarget.hasClass(FOCUSED_STATE_CLASS)
                },
                _attachKeyboardEvents: function() {
                    var processor = this.option("_keyboardProcessor") || new KeyboardProcessor({
                            element: this._keyboardEventBindingTarget(),
                            focusTarget: this._focusTarget()
                        });
                    this._keyboardProcessor = processor.reinitialize(this._keyboardHandler, this)
                },
                _keyboardHandler: function(options) {
                    var e = options.originalEvent,
                        key = options.key;
                    var keys = this._supportedKeys(),
                        func = keys[key];
                    if (func !== undefined) {
                        var handler = $.proxy(func, this);
                        return handler(e) || false
                    }
                    else
                        return true
                },
                _refreshFocusState: function() {
                    this._cleanFocusState();
                    this._renderFocusState()
                },
                _cleanFocusState: function() {
                    var $element = this._focusTarget();
                    this._detachFocusEvents();
                    this._toggleFocusClass(false);
                    $element.removeAttr("tabindex");
                    if (this._keyboardProcessor)
                        this._keyboardProcessor.dispose()
                },
                _attachHoverEvents: function() {
                    var that = this,
                        hoverableSelector = that._activeStateUnit,
                        nameStart = eventUtils.addNamespace(hoverEvents.start, UI_FEEDBACK),
                        nameEnd = eventUtils.addNamespace(hoverEvents.end, UI_FEEDBACK);
                    that._eventBindingTarget().off(nameStart, hoverableSelector).off(nameEnd, hoverableSelector);
                    if (that.option("hoverStateEnabled")) {
                        var startAction = new Action(function(args) {
                                that._hoverStartHandler(args.event);
                                var $target = args.element;
                                that._refreshHoveredElement($target)
                            });
                        that._eventBindingTarget().on(nameStart, hoverableSelector, function(e) {
                            startAction.execute({
                                element: $(e.target),
                                event: e
                            })
                        }).on(nameEnd, hoverableSelector, function(e) {
                            that._hoverEndHandler(e);
                            that._forgetHoveredElement()
                        })
                    }
                    else
                        that._toggleHoverClass(false)
                },
                _hoverStartHandler: $.noop,
                _hoverEndHandler: $.noop,
                _attachFeedbackEvents: function() {
                    var that = this,
                        feedbackSelector = that._activeStateUnit,
                        activeEventName = eventUtils.addNamespace(feedbackEvents.active, UI_FEEDBACK),
                        inactiveEventName = eventUtils.addNamespace(feedbackEvents.inactive, UI_FEEDBACK),
                        feedbackAction,
                        feedbackActionDisabled;
                    that._eventBindingTarget().off(activeEventName, feedbackSelector).off(inactiveEventName, feedbackSelector);
                    if (that.option("activeStateEnabled")) {
                        var feedbackActionHandler = function(args) {
                                var $element = args.element,
                                    value = args.value,
                                    jQueryEvent = args.jQueryEvent;
                                that._toggleActiveState($element, value, jQueryEvent)
                            };
                        that._eventBindingTarget().on(activeEventName, feedbackSelector, {timeout: that._feedbackShowTimeout}, function(e) {
                            feedbackAction = feedbackAction || new Action(feedbackActionHandler),
                            feedbackAction.execute({
                                element: $(e.currentTarget),
                                value: true,
                                jQueryEvent: e
                            })
                        }).on(inactiveEventName, feedbackSelector, {timeout: that._feedbackHideTimeout}, function(e) {
                            feedbackActionDisabled = feedbackActionDisabled || new Action(feedbackActionHandler, {excludeValidators: ["disabled", "readOnly"]}),
                            feedbackActionDisabled.execute({
                                element: $(e.currentTarget),
                                value: false,
                                jQueryEvent: e
                            })
                        })
                    }
                },
                _toggleActiveState: function($element, value) {
                    this._toggleHoverClass(!value);
                    $element.toggleClass(ACTIVE_STATE_CLASS, value)
                },
                _refreshHoveredElement: function(hoveredElement) {
                    var selector = this._activeStateUnit || this._eventBindingTarget();
                    this._forgetHoveredElement();
                    this._hoveredElement = hoveredElement.closest(selector);
                    this._toggleHoverClass(true)
                },
                _forgetHoveredElement: function() {
                    this._toggleHoverClass(false);
                    delete this._hoveredElement
                },
                _toggleHoverClass: function(value) {
                    if (this._hoveredElement)
                        this._hoveredElement.toggleClass(HOVER_STATE_CLASS, value && this.option("hoverStateEnabled"))
                },
                _toggleDisabledState: function(value) {
                    this.element().toggleClass(DISABLED_STATE_CLASS, Boolean(value));
                    this._toggleHoverClass(!value);
                    this.setAria("disabled", value || undefined)
                },
                _setWidgetOption: function(widgetName, args) {
                    if (!this[widgetName])
                        return;
                    if ($.isPlainObject(args[0])) {
                        $.each(args[0], $.proxy(function(option, value) {
                            this._setWidgetOption(widgetName, [option, value])
                        }, this));
                        return
                    }
                    var optionName = args[0];
                    var value = args[1];
                    if (args.length === 1)
                        value = this.option(optionName);
                    var widgetOptionMap = this[widgetName + "OptionMap"];
                    this[widgetName].option(widgetOptionMap ? widgetOptionMap(optionName) : optionName, value)
                },
                _createComponent: function(element, name, config) {
                    config = config || {};
                    this._extendConfig(config, {
                        templateProvider: this.option("templateProvider"),
                        _templates: this.option("_templates")
                    });
                    return this.callBase(element, name, config)
                },
                _optionChanged: function(args) {
                    switch (args.name) {
                        case"disabled":
                            this._toggleDisabledState(args.value);
                            this._refreshFocusState();
                            break;
                        case"hint":
                            this._renderHint();
                            break;
                        case"activeStateEnabled":
                            this._attachFeedbackEvents();
                            break;
                        case"hoverStateEnabled":
                            this._attachHoverEvents();
                            break;
                        case"tabIndex":
                        case"_keyboardProcessor":
                        case"focusStateEnabled":
                            this._refreshFocusState();
                            break;
                        case"onFocusIn":
                        case"onFocusOut":
                            break;
                        case"accessKey":
                            this._renderAccessKey();
                            break;
                        case"visible":
                            var visible = args.value;
                            this._toggleVisibility(visible);
                            if (this._isVisibilityChangeSupported())
                                this._checkVisibilityChanged(args.value ? "shown" : "hiding");
                            break;
                        case"onContentReady":
                            this._initContentReadyAction();
                            break;
                        case"_templates":
                        case"templateProvider":
                            break;
                        default:
                            this.callBase(args)
                    }
                },
                _isVisible: function() {
                    return this.callBase() && this.option("visible")
                },
                beginUpdate: function() {
                    this._ready(false);
                    this.callBase()
                },
                endUpdate: function() {
                    this.callBase();
                    if (this._initialized)
                        this._ready(true)
                },
                _ready: function(value) {
                    if (arguments.length === 0)
                        return this._isReady;
                    this._isReady = value
                },
                setAria: function() {
                    var setAttribute = function(option) {
                            var attrName = $.inArray(option.name, ["role", "id"]) + 1 ? option.name : "aria-" + option.name,
                                attrValue = option.value;
                            if (attrValue === null || attrValue === undefined)
                                attrValue = undefined;
                            else
                                attrValue = attrValue.toString();
                            domUtils.toggleAttr(option.target, attrName, attrValue)
                        };
                    if (!$.isPlainObject(arguments[0]))
                        setAttribute({
                            name: arguments[0],
                            value: arguments[1],
                            target: arguments[2] || this._getAriaTarget()
                        });
                    else {
                        var $target = arguments[1] || this._getAriaTarget();
                        $.each(arguments[0], function(key, value) {
                            setAttribute({
                                name: key,
                                value: value,
                                target: $target
                            })
                        })
                    }
                },
                isReady: function() {
                    return this._ready()
                },
                repaint: function() {
                    this._refresh()
                },
                focus: function() {
                    this._focusTarget().focus()
                },
                registerKeyHandler: function(key, handler) {
                    var currentKeys = this._supportedKeys(),
                        addingKeys = {};
                    addingKeys[key] = handler;
                    this._supportedKeys = function() {
                        return $.extend(currentKeys, addingKeys)
                    }
                }
            });
        return Widget
    });
    /*! Module core, file ui.validationMixin.js */
    DevExpress.define("/ui/ui.validationMixin", ["jquery"], function($) {
        var ValidationMixin = {_findGroup: function() {
                    var group = this.option("validationGroup"),
                        $dxGroup;
                    if (!group) {
                        $dxGroup = this.element().parents(".dx-validationgroup:first");
                        if ($dxGroup.length)
                            group = $dxGroup.dxValidationGroup("instance");
                        else
                            group = this._modelByElement(this.element())
                    }
                    return group
                }};
        return ValidationMixin
    });
    /*! Module core, file ui.editor.js */
    DevExpress.define("/ui/ui.editor", ["jquery", "/ui/uiNamespace", "/utils/utils.common", "/ui/ui.themes", "/ui/ui.widget", "/ui/ui.validationMixin"], function($, uiNamespace, commonUtils, themes, Widget, ValidationMixin) {
        var READONLY_STATE_CLASS = "dx-state-readonly",
            INVALID_CLASS = "dx-invalid",
            INVALID_MESSAGE = "dx-invalid-message",
            INVALID_MESSAGE_AUTO = "dx-invalid-message-auto",
            INVALID_MESSAGE_ALWAYS = "dx-invalid-message-always";
        var Editor = Widget.inherit({
                _init: function() {
                    this.callBase();
                    this.validationRequest = $.Callbacks();
                    var $element = this.element();
                    if ($element) {
                        $element.data("dx-validation-target", this);
                        this.on("disposing", function() {
                            $element.data("dx-validation-target", null)
                        })
                    }
                },
                _getDefaultOptions: function() {
                    return $.extend(this.callBase(), {
                            value: null,
                            onValueChanged: null,
                            readOnly: false,
                            isValid: true,
                            validationError: null,
                            validationMessageMode: "auto",
                            validationTooltipOffset: {
                                h: 0,
                                v: -10
                            }
                        })
                },
                _defaultOptionsRules: function() {
                    return this.callBase().concat([{
                                device: function() {
                                    var currentTheme = (themes.current() || "").split(".")[0];
                                    return currentTheme === "android5"
                                },
                                options: {validationTooltipOffset: {v: -18}}
                            }, {
                                device: function() {
                                    var currentTheme = (themes.current() || "").split(".")[0];
                                    return currentTheme === "win10"
                                },
                                options: {validationTooltipOffset: {v: -4}}
                            }])
                },
                _attachKeyboardEvents: function() {
                    if (this.option("readOnly"))
                        return;
                    this.callBase.apply(this, arguments);
                    this._attachChildKeyboardEvents()
                },
                _attachChildKeyboardEvents: $.noop,
                _setOptionsByReference: function() {
                    this.callBase();
                    $.extend(this._optionsByReference, {validationError: true})
                },
                _createValueChangeAction: function() {
                    this._valueChangeAction = this._createActionByOption("onValueChanged", {excludeValidators: ["disabled", "readOnly"]})
                },
                _suppressValueChangeAction: function() {
                    this._valueChangeActionSuppressed = true
                },
                _resumeValueChangeAction: function() {
                    this._valueChangeActionSuppressed = false
                },
                _render: function() {
                    this._renderValidationState();
                    this._toggleReadOnlyState();
                    this.callBase()
                },
                _raiseValueChangeAction: function(value, previousValue, extraArguments) {
                    if (!this._valueChangeAction)
                        this._createValueChangeAction();
                    this._valueChangeAction(this._valueChangeArgs(value, previousValue))
                },
                _valueChangeArgs: function(value, previousValue) {
                    return {
                            value: value,
                            previousValue: previousValue,
                            jQueryEvent: this._valueChangeEventInstance
                        }
                },
                _saveValueChangeEvent: function(e) {
                    this._valueChangeEventInstance = e
                },
                _renderValidationState: function() {
                    var isValid = this.option("isValid"),
                        validationError = this.option("validationError"),
                        validationMessageMode = this.option("validationMessageMode"),
                        $element = this.element();
                    $element.toggleClass(INVALID_CLASS, !isValid);
                    this.setAria("invalid", !isValid || undefined);
                    if (this._$validationMessage) {
                        this._$validationMessage.remove();
                        this._$validationMessage = null
                    }
                    if (!isValid && validationError && validationError.message) {
                        this._$validationMessage = $("<div/>", {"class": INVALID_MESSAGE}).text(validationError.message).appendTo($element);
                        this._createComponent(this._$validationMessage, "dxTooltip", {
                            target: this._getValidationTooltipTarget(),
                            container: $element,
                            position: this._getValidationTooltipPosition("below"),
                            closeOnOutsideClick: false,
                            closeOnTargetScroll: false,
                            animation: null,
                            visible: true
                        });
                        this._$validationMessage.toggleClass(INVALID_MESSAGE_AUTO, validationMessageMode === "auto").toggleClass(INVALID_MESSAGE_ALWAYS, validationMessageMode === "always")
                    }
                },
                _getValidationTooltipTarget: function() {
                    return this.element()
                },
                _getValidationTooltipPosition: function(positionRequest) {
                    var rtlEnabled = this.option("rtlEnabled"),
                        tooltipPositionSide = commonUtils.getDefaultAlignment(rtlEnabled),
                        tooltipOriginalOffset = this.option("validationTooltipOffset"),
                        tooltipOffset = {
                            h: tooltipOriginalOffset.h,
                            v: tooltipOriginalOffset.v
                        },
                        verticalPositions = positionRequest === "below" ? [" top", " bottom"] : [" bottom", " top"];
                    if (rtlEnabled)
                        tooltipOffset.h = -tooltipOffset.h;
                    if (positionRequest !== "below")
                        tooltipOffset.v = -tooltipOffset.v;
                    return {
                            offset: tooltipOffset,
                            my: tooltipPositionSide + verticalPositions[0],
                            at: tooltipPositionSide + verticalPositions[1],
                            collision: "none"
                        }
                },
                _toggleReadOnlyState: function() {
                    this.element().toggleClass(READONLY_STATE_CLASS, this.option("readOnly"));
                    this.setAria("readonly", this.option("readOnly") || undefined)
                },
                _optionChanged: function(args) {
                    switch (args.name) {
                        case"onValueChanged":
                            this._createValueChangeAction();
                            break;
                        case"isValid":
                        case"validationError":
                        case"validationMessageMode":
                            this._renderValidationState();
                            break;
                        case"readOnly":
                            this._toggleReadOnlyState();
                            this._refreshFocusState();
                            break;
                        case"value":
                            if (!this._valueChangeActionSuppressed) {
                                this._raiseValueChangeAction(args.value, args.previousValue);
                                this._saveValueChangeEvent(undefined)
                            }
                            if (args.value != args.previousValue)
                                this.validationRequest.fire({
                                    value: args.value,
                                    editor: this
                                });
                            break;
                        default:
                            this.callBase(args)
                    }
                },
                reset: function() {
                    this.option("value", null)
                }
            }).include(ValidationMixin);
        return Editor
    });
    /*! Module core, file ui.errors.js */
    DevExpress.define("/ui/ui.errors", ["/utils/utils.error", "/errors"], function(errorUtils, errors) {
        return errorUtils(errors.ERROR_MESSAGES, {
                E1001: "Module '{0}'. Controller '{1}' is already registered",
                E1002: "Module '{0}'. Controller '{1}' must be inheritor of DevExpress.ui.dxDataGrid.Controller",
                E1003: "Module '{0}'. View '{1}' is already registered",
                E1004: "Module '{0}'. View '{1}' must be inheritor of DevExpress.ui.dxDataGrid.View",
                E1005: "Public method '{0}' is already registered",
                E1006: "Public method '{0}.{1}' is not exists",
                E1007: "State storing can not be provided due to the restrictions of your browser",
                E1010: "A template should contain dxTextBox widget",
                E1011: "You have to implement 'remove' method in dataStore used by dxList to be able to delete items",
                E1012: "Editing type '{0}' with name '{1}' not supported",
                E1016: "Unexpected type of data source is provided for a lookup column",
                E1018: "The 'collapseAll' method cannot be called when using a remote data source",
                E1019: "Search mode '{0}' is unavailable",
                E1020: "Type can not be changed after initialization",
                E1021: "{0} '{1}' you are trying to remove does not exist",
                E1022: "Markers option should be an array",
                E1023: "Routes option should be an array",
                E1024: "Google provider cannot be used in WinJS application",
                E1025: "This layout is too complex to render",
                E1026: "The 'custom' value is set to a summary item's summaryType option, but a function for calculating the custom summary is not assigned to the grid's calculateCustomSummary option",
                E1030: "Unknown dxScrollView refresh strategy: '{0}'",
                E1031: "Unknown subscription is detected in the dxScheduler widget: '{0}'",
                E1032: "Unknown start date is detected in an appointment of the dxScheduler widget: '{0}'",
                E1033: "Unknown step is specified for the scheduler's navigator: '{0}'",
                E1034: "The current browser does not implement an API required for saving files",
                E1035: "The editor could not be created because of the internal error: {0}",
                E1036: "Validation rules are not defined for any form item",
                W1001: "Key option can not be modified after initialization",
                W1002: "Item '{0}' you are trying to select does not exist",
                W1003: "Group with key '{0}' in which you are trying to select items does not exist",
                W1004: "Item '{0}' you are trying to select in group '{1}' does not exist",
                W1005: "Due to column data types being unspecified, data has been loaded twice in order to apply initial filter settings. To resolve this issue, specify data types for all grid columns."
            })
    });
    /*! Module core, file ui.actionExecutors.js */
    DevExpress.define("/ui/ui.actionExecutors", ["jquery", "/action"], function($, Action) {
        var createValidatorByTargetElement = function(condition) {
                return function(e) {
                        if (!e.args.length)
                            return;
                        var args = e.args[0],
                            element = args[e.validatingTargetName] || args.element;
                        if (element && condition(element))
                            e.cancel = true
                    }
            };
        Action.registerExecutor({
            designMode: {validate: function(e) {
                    if (DevExpress.designMode)
                        e.cancel = true
                }},
            disabled: {validate: createValidatorByTargetElement(function($target) {
                    return $target.is(".dx-state-disabled, .dx-state-disabled *")
                })},
            readOnly: {validate: createValidatorByTargetElement(function($target) {
                    return $target.is(".dx-state-readonly, .dx-state-readonly *")
                })}
        })
    });
    /*! Module core, file ui.dialog.js */
    DevExpress.define("/ui/ui.dialog", ["jquery", "/component", "/action", "/ui/ui.errors", "/utils/utils.dom", "/utils/utils.viewPort", "/devices", "/ui/ui.themes"], function($, Component, Action, errors, domUtils, viewPortUtils, devices, themes) {
        var DEFAULT_BUTTON = {
                text: "OK",
                onClick: function() {
                    return true
                }
            };
        var DX_DIALOG_CLASSNAME = "dx-dialog",
            DX_DIALOG_WRAPPER_CLASSNAME = DX_DIALOG_CLASSNAME + "-wrapper",
            DX_DIALOG_ROOT_CLASSNAME = DX_DIALOG_CLASSNAME + "-root",
            DX_DIALOG_CONTENT_CLASSNAME = DX_DIALOG_CLASSNAME + "-content",
            DX_DIALOG_MESSAGE_CLASSNAME = DX_DIALOG_CLASSNAME + "-message",
            DX_DIALOG_BUTTONS_CLASSNAME = DX_DIALOG_CLASSNAME + "-buttons",
            DX_DIALOG_BUTTON_CLASSNAME = DX_DIALOG_CLASSNAME + "-button";
        var FakeDialogComponent = Component.inherit({
                ctor: function(element, options) {
                    this.callBase(options)
                },
                _defaultOptionsRules: function() {
                    return this.callBase().concat([{
                                device: {platform: "ios"},
                                options: {width: 276}
                            }, {
                                device: {platform: "android"},
                                options: {
                                    lWidth: "60%",
                                    pWidth: "80%"
                                }
                            }, {
                                device: function(device) {
                                    var currentTheme = (themes.current() || "").split(".")[0];
                                    return !device.phone && currentTheme === "win8"
                                },
                                options: {width: function() {
                                        return $(window).width()
                                    }}
                            }, {
                                device: function(device) {
                                    var currentTheme = (themes.current() || "").split(".")[0];
                                    return device.phone && currentTheme === "win8"
                                },
                                options: {position: {
                                        my: "top center",
                                        at: "top center",
                                        of: window,
                                        offset: "0 0"
                                    }}
                            }])
                }
            });
        var dialog = function(options) {
                if (!DevExpress.ui.dxPopup)
                    throw errors.Error("E0018");
                var deferred = $.Deferred();
                var defaultOptions = (new FakeDialogComponent).option();
                options = $.extend(defaultOptions, options);
                var $element = $("<div>").addClass(DX_DIALOG_CLASSNAME).appendTo(viewPortUtils.value());
                var $message = $("<div>").addClass(DX_DIALOG_MESSAGE_CLASSNAME).html(String(options.message));
                var popupButtons = [];
                $.each(options.buttons || [DEFAULT_BUTTON], function() {
                    var action = new Action(this.onClick, {context: popupInstance});
                    popupButtons.push({
                        toolbar: 'bottom',
                        location: devices.current().android ? 'after' : 'center',
                        widget: 'button',
                        options: {
                            text: this.text,
                            onClick: function() {
                                var result = action.execute(arguments);
                                hide(result)
                            }
                        }
                    })
                });
                var popupInstance = $element.dxPopup({
                        title: options.title || this.title,
                        showTitle: function() {
                            var isTitle = options.showTitle === undefined ? true : options.showTitle;
                            return isTitle
                        }(),
                        height: "auto",
                        width: function() {
                            var isPortrait = $(window).height() > $(window).width(),
                                key = (isPortrait ? "p" : "l") + "Width",
                                widthOption = options.hasOwnProperty(key) ? options[key] : options["width"];
                            return $.isFunction(widthOption) ? widthOption() : widthOption
                        },
                        showCloseButton: options.showCloseButton || false,
                        focusStateEnabled: false,
                        onContentReady: function(args) {
                            args.component.content().addClass(DX_DIALOG_CONTENT_CLASSNAME).append($message)
                        },
                        onShowing: function(e) {
                            e.component.bottomToolbar().addClass(DX_DIALOG_BUTTONS_CLASSNAME).find(".dx-button").addClass(DX_DIALOG_BUTTON_CLASSNAME);
                            domUtils.resetActiveElement()
                        },
                        onShown: function(e) {
                            e.component.bottomToolbar().find(".dx-button").first().focus()
                        },
                        onHiding: function() {
                            deferred.reject()
                        },
                        buttons: popupButtons,
                        animation: {
                            show: {
                                type: "pop",
                                duration: 400
                            },
                            hide: {
                                type: "pop",
                                duration: 400,
                                to: {
                                    opacity: 0,
                                    scale: 0
                                },
                                from: {
                                    opacity: 1,
                                    scale: 1
                                }
                            }
                        },
                        rtlEnabled: DevExpress.rtlEnabled,
                        boundaryOffset: {
                            h: 10,
                            v: 0
                        }
                    }).dxPopup("instance");
                popupInstance._wrapper().addClass(DX_DIALOG_WRAPPER_CLASSNAME);
                if (options.position)
                    popupInstance.option("position", options.position);
                popupInstance._wrapper().addClass(DX_DIALOG_ROOT_CLASSNAME);
                function show() {
                    popupInstance.show();
                    return deferred.promise()
                }
                function hide(value) {
                    deferred.resolve(value);
                    popupInstance.hide().done(function() {
                        popupInstance.element().remove()
                    })
                }
                return {
                        show: show,
                        hide: hide
                    }
            };
        var alert = function(message, title, showTitle) {
                var dialogInstance,
                    options = $.isPlainObject(message) ? message : {
                        title: title,
                        message: message,
                        showTitle: showTitle
                    };
                dialogInstance = this.custom(options);
                return dialogInstance.show()
            };
        var confirm = function(message, title, showTitle) {
                var dialogInstance,
                    options = $.isPlainObject(message) ? message : {
                        title: title,
                        message: message,
                        showTitle: showTitle,
                        buttons: [{
                                text: Globalize.localize("Yes"),
                                onClick: function() {
                                    return true
                                }
                            }, {
                                text: Globalize.localize("No"),
                                onClick: function() {
                                    return false
                                }
                            }]
                    };
                dialogInstance = this.custom(options);
                return dialogInstance.show()
            };
        var $notify = null;
        var notify = function(message, type, displayTime) {
                var options = $.isPlainObject(message) ? message : {message: message};
                if (!DevExpress.ui.dxToast) {
                    alert(options.message);
                    return
                }
                var userHiddenAction = options.onHidden;
                $.extend(options, {
                    type: type,
                    displayTime: displayTime,
                    onHidden: function(args) {
                        args.element.remove();
                        new Action(userHiddenAction, {context: args.model}).execute(arguments)
                    }
                });
                $notify = $("<div>").appendTo(viewPortUtils.value()).dxToast(options);
                $notify.dxToast("instance").show()
            };
        return {
                FakeDialogComponent: FakeDialogComponent,
                notify: notify,
                custom: dialog,
                alert: alert,
                confirm: confirm
            }
    });
    /*! Module core, file ui.templateBase.js */
    DevExpress.define("/ui/templates/ui.templateBase", ["jquery", "/utils/utils.dom", "/class"], function($, domUtils, Class) {
        var triggerShownEvent = domUtils.triggerShownEvent,
            abstract = Class.abstract;
        var renderedCallbacks = $.Callbacks();
        var TemplateBase = Class.inherit({
                ctor: function(element, owner) {
                    this._element = $(element);
                    this._owner = owner
                },
                owner: function() {
                    return this._owner
                },
                render: function(data, $container, index) {
                    if (data instanceof jQuery) {
                        $container = data;
                        data = undefined
                    }
                    if ($container)
                        data = this._prepareDataForContainer(data, $container);
                    var $result = this._renderCore(data, index, $container);
                    renderedCallbacks.fire($result);
                    this._ensureResultInContainer($result, $container);
                    return $result
                },
                _ensureResultInContainer: function($result, $container) {
                    if (!$container)
                        return;
                    var resultInContainer = $.contains($container.get(0), $result.get(0));
                    $container.append($result);
                    if (resultInContainer)
                        return;
                    var resultInBody = $.contains(document.body, $container.get(0));
                    if (!resultInBody)
                        return;
                    triggerShownEvent($result)
                },
                source: function() {
                    return this._element.clone()
                },
                _prepareDataForContainer: function(data) {
                    return data
                },
                _renderCore: abstract,
                dispose: function() {
                    this._owner = null
                }
            });
        TemplateBase.renderedCallbacks = renderedCallbacks;
        return TemplateBase
    });
    /*! Module core, file ui.template.function.js */
    DevExpress.define("/ui/templates/ui.template.function", ["jquery", "/ui/templates/ui.templateBase", "/utils/utils.dom"], function($, TemplateBase, domUtils) {
        var FunctionTemplate = TemplateBase.inherit({
                ctor: function(render, owner) {
                    this.callBase($(), owner);
                    this._render = render
                },
                _renderCore: function(data, index, container) {
                    return domUtils.normalizeTemplateElement(this._render(data, index, container))
                }
            });
        return FunctionTemplate
    });
    /*! Module core, file ui.template.dynamic.js */
    DevExpress.define("/ui/templates/ui.template.dynamic", ["jquery", "/ui/templates/ui.templateBase"], function($, TemplateBase) {
        var DynamicTemplate = TemplateBase.inherit({
                ctor: function(compileFunction, owner) {
                    this.callBase($(), owner);
                    this._compileFunction = compileFunction
                },
                _renderCore: function(data, index, container) {
                    if (data === undefined && index === undefined) {
                        data = container;
                        container = undefined
                    }
                    var compiledTemplate = index === undefined ? this._compileFunction(data, container) : this._compileFunction(data, index, container);
                    var renderResult = compiledTemplate.render(data, container, index);
                    if (compiledTemplate.owner() === this)
                        compiledTemplate.dispose();
                    return renderResult
                }
            });
        return DynamicTemplate
    });
    /*! Module core, file ui.template.empty.js */
    DevExpress.define("/ui/templates/ui.template.empty", ["jquery", "/ui/templates/ui.templateBase"], function($, TemplateBase) {
        var EmptyTemplate = TemplateBase.inherit({
                ctor: function(owner) {
                    this.callBase($(), owner)
                },
                _renderCore: function() {
                    return $()
                }
            });
        return EmptyTemplate
    });
    /*! Module core, file ui.template.move.js */
    DevExpress.define("/ui/templates/ui.template.move", ["jquery", "/ui/templates/ui.templateBase"], function($, TemplateBase) {
        var MoveTemplate = TemplateBase.inherit({_renderCore: function() {
                    return this._element
                }});
        return MoveTemplate
    });
    /*! Module core, file ui.templateProviderBase.js */
    DevExpress.define("/ui/templates/ui.templateProviderBase", ["jquery", "/class"], function($, Class) {
        var abstract = Class.abstract;
        var TemplateProviderBase = Class.inherit({
                ctor: function() {
                    this.widgetTemplatesCache = {}
                },
                createTemplate: abstract,
                getTemplates: function(widget) {
                    return this._getWidgetTemplates(widget.constructor)
                },
                _getWidgetTemplates: function(widgetConstructor) {
                    if (!widgetConstructor.publicName)
                        return {};
                    return this._getCachedWidgetTemplates(widgetConstructor)
                },
                _getCachedWidgetTemplates: function(widgetConstructor) {
                    var widgetName = widgetConstructor.publicName(),
                        templatesCache = this.widgetTemplatesCache;
                    if (!templatesCache[widgetName])
                        templatesCache[widgetName] = $.extend({}, this._getWidgetTemplates(widgetConstructor.parent), this._templatesForWidget(widgetName));
                    return templatesCache[widgetName]
                },
                _templatesForWidget: abstract
            });
        return TemplateProviderBase
    });
    /*! Module core, file ui.events.eventRegistrator.js */
    DevExpress.define("/ui/events/ui.events.eventRegistrator", ["jquery", "/utils/utils.memorizedCallbacks"], function($, MemorizedCallbacks) {
        var eventNS = $.event,
            hooksNS = eventNS.fixHooks,
            specialNS = $.event.special;
        var DX_EVENT_HOOKS = {props: eventNS.mouseHooks.props.concat(["pointerType", "pointerId", "pointers"])};
        var callbacks = new MemorizedCallbacks;
        var registerEvent = function(name, eventObject) {
                var strategy = {};
                if ("noBubble" in eventObject)
                    strategy.noBubble = eventObject.noBubble;
                if ("bindType" in eventObject)
                    strategy.bindType = eventObject.bindType;
                if ("delegateType" in eventObject)
                    strategy.delegateType = eventObject.delegateType;
                $.each(["setup", "teardown", "add", "remove", "trigger", "handle", "_default", "dispose"], function(_, methodName) {
                    if (!eventObject[methodName])
                        return;
                    strategy[methodName] = function() {
                        var args = $.makeArray(arguments);
                        args.unshift(this);
                        return eventObject[methodName].apply(eventObject, args)
                    }
                });
                hooksNS[name] = DX_EVENT_HOOKS;
                callbacks.fire(name, strategy)
            };
        registerEvent.callbacks = callbacks;
        var registerJQueryEvent = function(name, eventObject) {
                specialNS[name] = eventObject
            };
        callbacks.add(registerJQueryEvent);
        return registerEvent
    });
    /*! Module core, file ui.events.utils.js */
    DevExpress.define("/ui/events/ui.events.utils", ["jquery", "/ui/ui.errors"], function($, errors) {
        var eventNS = $.event,
            hooksNS = eventNS.fixHooks;
        var eventSource = function() {
                var EVENT_SOURCES_REGEX = {
                        dx: /^dx/i,
                        mouse: /(mouse|wheel)/i,
                        touch: /^touch/i,
                        keyboard: /^key/i,
                        pointer: /^(ms)?pointer/i
                    };
                return function(e) {
                        var result = "other";
                        $.each(EVENT_SOURCES_REGEX, function(key) {
                            if (this.test(e.type)) {
                                result = key;
                                return false
                            }
                        });
                        return result
                    }
            }();
        var isDxEvent = function(e) {
                return eventSource(e) === "dx"
            };
        var isNativeMouseEvent = function(e) {
                return eventSource(e) === "mouse"
            };
        var isNativeTouchEvent = function(e) {
                return eventSource(e) === "touch"
            };
        var isPointerEvent = function(e) {
                return eventSource(e) === "pointer"
            };
        var isMouseEvent = function(e) {
                return isNativeMouseEvent(e) || (isPointerEvent(e) || isDxEvent(e)) && e.pointerType === "mouse"
            };
        var isTouchEvent = function(e) {
                return isNativeTouchEvent(e) || (isPointerEvent(e) || isDxEvent(e)) && e.pointerType === "touch"
            };
        var isKeyboardEvent = function(e) {
                return eventSource(e) === "keyboard"
            };
        var isFakeClickEvent = function(e) {
                return e.screenX === 0 && !e.offsetX && e.pageX === 0
            };
        var eventData = function(e) {
                return {
                        x: e.pageX,
                        y: e.pageY,
                        time: e.timeStamp
                    }
            };
        var eventDelta = function(from, to) {
                return {
                        x: to.x - from.x,
                        y: to.y - from.y,
                        time: to.time - from.time || 1
                    }
            };
        var hasTouches = function(e) {
                if (isNativeTouchEvent(e))
                    return (e.originalEvent.touches || []).length;
                if (isDxEvent(e))
                    return (e.pointers || []).length;
                return 0
            };
        var needSkipEvent = function(e) {
                var $target = $(e.target),
                    touchInInput = $target.is("input, textarea, select");
                if ($target.is(".dx-skip-gesture-event *, .dx-skip-gesture-event"))
                    return true;
                if (e.type === 'dxmousewheel')
                    return $target.is("input[type='number'], textarea, select") && $target.is(':focus');
                if (isMouseEvent(e))
                    return touchInInput || e.which > 1;
                if (isTouchEvent(e))
                    return touchInInput && $target.is(":focus")
            };
        var createEvent = function(originalEvent, args) {
                var event = $.Event(originalEvent),
                    fixHook = hooksNS[originalEvent.type] || eventNS.mouseHooks;
                var props = fixHook.props ? eventNS.props.concat(fixHook.props) : eventNS.props,
                    propIndex = props.length;
                while (propIndex--) {
                    var prop = props[propIndex];
                    event[prop] = originalEvent[prop]
                }
                if (args)
                    $.extend(event, args);
                return fixHook.filter ? fixHook.filter(event, originalEvent) : event
            };
        var fireEvent = function(props) {
                var event = createEvent(props.originalEvent, props);
                eventNS.trigger(event, null, props.delegateTarget || event.target);
                return event
            };
        var addNamespace = function(eventNames, namespace) {
                if (!namespace)
                    throw errors.Error("E0017");
                if (typeof eventNames === "string")
                    return addNamespace(eventNames.split(/\s+/g), namespace);
                $.each(eventNames, function(index, eventName) {
                    eventNames[index] = eventName + "." + namespace
                });
                return eventNames.join(" ")
            };
        return {
                eventSource: eventSource,
                isPointerEvent: isPointerEvent,
                isMouseEvent: isMouseEvent,
                isTouchEvent: isTouchEvent,
                isKeyboardEvent: isKeyboardEvent,
                isFakeClickEvent: isFakeClickEvent,
                hasTouches: hasTouches,
                eventData: eventData,
                eventDelta: eventDelta,
                needSkipEvent: needSkipEvent,
                createEvent: createEvent,
                fireEvent: fireEvent,
                addNamespace: addNamespace
            }
    });
    /*! Module core, file ui.events.remove.js */
    DevExpress.define("/ui/events/ui.events.remove", ["jquery", "/ui/events/ui.events.eventRegistrator"], function($, registerEvent) {
        var eventName = "dxremove",
            eventPropName = "dxRemoveEvent",
            cleanData = $.cleanData;
        $.cleanData = function(elements) {
            for (var i = 0; i < elements.length; i++) {
                var $element = $(elements[i]);
                if ($element.prop(eventPropName)) {
                    $element.removeProp(eventPropName);
                    $element.triggerHandler(eventName)
                }
            }
            return cleanData(elements)
        };
        registerEvent(eventName, {
            noBubble: true,
            setup: function(element) {
                $(element).prop(eventPropName, true)
            }
        });
        return {name: eventName}
    });
    /*! Module core, file ui.events.pointer.touchHooks.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer.touchHooks", ["jquery"], function($) {
        var touchEventHook = {
                filter: function(event, originalEvent) {
                    var touches = originalEvent.touches.length ? originalEvent.touches : originalEvent.changedTouches;
                    $.each(["pageX", "pageY", "screenX", "screenY", "clientX", "clientY"], function() {
                        event[this] = touches[0][this]
                    });
                    return event
                },
                props: $.event.mouseHooks.props.concat(["touches", "changedTouches", "targetTouches", "detail", "result", "originalTarget", "charCode", "prevValue"])
            };
        $.each(["touchstart", "touchmove", "touchend", "touchcancel"], function() {
            $.event.fixHooks[this] = touchEventHook
        })
    });
    /*! Module core, file ui.events.pointer.mspointerHooks.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer.mspointerHooks", ["jquery"], function($) {
        var POINTER_TYPE_MAP = {
                2: "touch",
                3: "pen",
                4: "mouse"
            };
        var pointerEventHook = {
                filter: function(event, originalEvent) {
                    var pointerType = originalEvent.pointerType;
                    if ($.isNumeric(pointerType))
                        event.pointerType = POINTER_TYPE_MAP[pointerType];
                    return event
                },
                props: $.event.mouseHooks.props.concat(["pointerId", "pointerType", "originalTarget", "width", "height", "pressure", "result", "tiltX", "charCode", "tiltY", "detail", "isPrimary", "prevValue"])
            };
        $.each(["MSPointerDown", "MSPointerMove", "MSPointerUp", "MSPointerCancel", "MSPointerOver", "MSPointerOut", "mouseenter", "mouseleave", "pointerdown", "pointermove", "pointerup", "pointercancel", "pointerover", "pointerout", "pointerenter", "pointerleave"], function() {
            $.event.fixHooks[this] = pointerEventHook
        })
    });
    /*! Module core, file ui.events.pointer.base.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer.base", ["jquery", "/utils/utils.browser", "/class", "/ui/events/ui.events.utils"], function($, browser, Class, eventUtils) {
        var POINTER_EVENTS_NAMESPACE = "dxPointerEvents";
        var BaseStrategy = Class.inherit({
                ctor: function(eventName, originalEvents) {
                    this._eventName = eventName;
                    this._originalEvents = eventUtils.addNamespace(originalEvents, POINTER_EVENTS_NAMESPACE);
                    this._handlerCount = 0;
                    this.noBubble = this._isNoBubble()
                },
                _isNoBubble: function() {
                    var eventName = this._eventName;
                    return eventName === "dxpointerenter" || eventName === "dxpointerleave"
                },
                _handler: function(e) {
                    var delegateTarget = this._getDelegateTarget(e);
                    return this._fireEvent({
                            type: this._eventName,
                            pointerType: e.pointerType || eventUtils.eventSource(e),
                            originalEvent: e,
                            delegateTarget: delegateTarget,
                            timeStamp: browser.mozilla ? (new Date).getTime() : e.timeStamp
                        })
                },
                _getDelegateTarget: function(e) {
                    var delegateTarget;
                    if (this.noBubble)
                        delegateTarget = e.delegateTarget;
                    return delegateTarget
                },
                _fireEvent: function(args) {
                    return eventUtils.fireEvent(args)
                },
                setup: function() {
                    return true
                },
                add: function(element, handleObj) {
                    if (this._handlerCount <= 0 || this.noBubble) {
                        this._selector = handleObj.selector;
                        element = this.noBubble ? element : document;
                        var that = this;
                        $(element).on(this._originalEvents, this._selector, function(e) {
                            that._handler(e)
                        })
                    }
                    if (!this.noBubble)
                        this._handlerCount++
                },
                remove: function(element) {
                    if (!this.noBubble)
                        this._handlerCount--
                },
                teardown: function(element) {
                    if (this._handlerCount && !this.noBubble)
                        return;
                    element = this.noBubble ? element : document;
                    $(element).off(this._originalEvents, this._selector)
                },
                dispose: function(element) {
                    element = this.noBubble ? element : document;
                    $(element).off(this._originalEvents)
                }
            });
        return BaseStrategy
    });
    /*! Module core, file ui.events.pointer.observer.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer.observer", [], function() {
        var addEventsListener = function(events, handler) {
                events = events.split(" ");
                $.each(events, function(_, event) {
                    if (document.addEventListener)
                        document.addEventListener(event, handler, true);
                    else
                        document.attachEvent("on" + event, handler)
                })
            };
        var Observer = function(eventMap, pointerEquals) {
                var pointers = [];
                var getPointerIndex = function(e) {
                        var index = -1;
                        $.each(pointers, function(i, pointer) {
                            if (!pointerEquals(e, pointer))
                                return true;
                            index = i;
                            return false
                        });
                        return index
                    };
                var addPointer = function(e) {
                        if (getPointerIndex(e) === -1)
                            pointers.push(e)
                    };
                var removePointer = function(e) {
                        var index = getPointerIndex(e);
                        if (index > -1)
                            pointers.splice(index, 1)
                    };
                var updatePointer = function(e) {
                        pointers[getPointerIndex(e)] = e
                    };
                addEventsListener(eventMap.dxpointerdown, addPointer);
                addEventsListener(eventMap.dxpointermove, updatePointer);
                addEventsListener(eventMap.dxpointerup, removePointer);
                addEventsListener(eventMap.dxpointercancel, removePointer);
                this.pointers = function() {
                    return pointers
                };
                this.reset = function() {
                    pointers = []
                }
            };
        return Observer
    });
    /*! Module core, file ui.events.pointer.mouse.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer.mouse", ["jquery", "/ui/events/pointer/ui.events.pointer.base", "/ui/events/pointer/ui.events.pointer.observer"], function($, BaseStrategy, Observer) {
        var eventMap = {
                dxpointerdown: "mousedown",
                dxpointermove: "mousemove",
                dxpointerup: "mouseup",
                dxpointercancel: "",
                dxpointerover: "mouseover",
                dxpointerout: "mouseout",
                dxpointerenter: "mouseenter",
                dxpointerleave: "mouseleave"
            };
        var normalizeMouseEvent = function(e) {
                e.pointerId = 1;
                return {
                        pointers: observer.pointers(),
                        pointerId: 1
                    }
            };
        var observer;
        var activated = false;
        var activateStrategy = function() {
                if (activated)
                    return;
                observer = new Observer(eventMap, function(a, b) {
                    return true
                });
                activated = true
            };
        var MouseStrategy = BaseStrategy.inherit({
                ctor: function() {
                    this.callBase.apply(this, arguments);
                    activateStrategy()
                },
                _fireEvent: function(args) {
                    return this.callBase($.extend(normalizeMouseEvent(args.originalEvent), args))
                }
            });
        MouseStrategy.map = eventMap;
        MouseStrategy.normalize = normalizeMouseEvent;
        MouseStrategy.activate = activateStrategy;
        MouseStrategy.resetObserver = function() {
            observer.reset()
        };
        return MouseStrategy
    });
    /*! Module core, file ui.events.pointer.touch.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer.touch", ["jquery", "/devices", "/ui/events/pointer/ui.events.pointer.base", "/ui/events/pointer/ui.events.pointer.touchHooks"], function($, devices, BaseStrategy) {
        var eventMap = {
                dxpointerdown: "touchstart",
                dxpointermove: "touchmove",
                dxpointerup: "touchend",
                dxpointercancel: "touchcancel",
                dxpointerover: "",
                dxpointerout: "",
                dxpointerenter: "",
                dxpointerleave: ""
            };
        var normalizeTouchEvent = function(e) {
                var pointers = [];
                $.each(e.touches, function(_, touch) {
                    pointers.push($.extend({pointerId: touch.identifier}, touch))
                });
                return {
                        pointers: pointers,
                        pointerId: e.changedTouches[0].identifier
                    }
            };
        var skipTouchWithSameIdentifier = function(pointerEvent) {
                return devices.real().platform === "ios" && (pointerEvent === "dxpointerdown" || pointerEvent === "dxpointerup")
            };
        var TouchStrategy = BaseStrategy.inherit({
                ctor: function() {
                    this.callBase.apply(this, arguments);
                    this._pointerId = 0
                },
                _handler: function(e) {
                    if (skipTouchWithSameIdentifier(this._eventName)) {
                        var touch = e.changedTouches[0];
                        if (this._pointerId === touch.identifier && this._pointerId !== 0)
                            return;
                        this._pointerId = touch.identifier
                    }
                    return this.callBase.apply(this, arguments)
                },
                _fireEvent: function(args) {
                    return this.callBase($.extend(normalizeTouchEvent(args.originalEvent), args))
                }
            });
        TouchStrategy.map = eventMap;
        TouchStrategy.normalize = normalizeTouchEvent;
        return TouchStrategy
    });
    /*! Module core, file ui.events.pointer.mouseAndTouch.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer.mouseAndTouch", ["jquery", "/ui/events/pointer/ui.events.pointer.base", "/ui/events/pointer/ui.events.pointer.mouse", "/ui/events/pointer/ui.events.pointer.touch", "/ui/events/ui.events.utils"], function($, BaseStrategy, MouseStrategy, TouchStrategy, eventUtils) {
        var eventMap = {
                dxpointerdown: "touchstart mousedown",
                dxpointermove: "touchmove mousemove",
                dxpointerup: "touchend mouseup",
                dxpointercancel: "touchcancel",
                dxpointerover: "mouseover",
                dxpointerout: "mouseout",
                dxpointerenter: "mouseenter",
                dxpointerleave: "mouseleave"
            };
        var activated = false;
        var activateStrategy = function() {
                if (activated)
                    return;
                MouseStrategy.activate();
                activated = true
            };
        var MouseAndTouchStrategy = BaseStrategy.inherit({
                EVENT_LOCK_TIMEOUT: 100,
                ctor: function() {
                    this.callBase.apply(this, arguments);
                    activateStrategy()
                },
                _handler: function(e) {
                    var isMouseEvent = eventUtils.isMouseEvent(e);
                    if (!isMouseEvent)
                        this._skipNextEvents = true;
                    if (isMouseEvent && this._mouseLocked)
                        return;
                    if (isMouseEvent && this._skipNextEvents) {
                        this._skipNextEvents = false;
                        this._mouseLocked = true;
                        clearTimeout(this._unlockMouseTimer);
                        var that = this;
                        this._unlockMouseTimer = setTimeout(function() {
                            that._mouseLocked = false
                        }, this.EVENT_LOCK_TIMEOUT);
                        return
                    }
                    return this.callBase(e)
                },
                _fireEvent: function(args) {
                    var isMouseEvent = eventUtils.isMouseEvent(args.originalEvent),
                        normalizer = isMouseEvent ? MouseStrategy.normalize : TouchStrategy.normalize;
                    return this.callBase($.extend(normalizer(args.originalEvent), args))
                },
                dispose: function() {
                    this.callBase();
                    this._skipNextEvents = false;
                    this._mouseLocked = false;
                    clearTimeout(this._unlockMouseTimer)
                }
            });
        MouseAndTouchStrategy.map = eventMap;
        MouseAndTouchStrategy.resetObserver = MouseStrategy.resetObserver;
        return MouseAndTouchStrategy
    });
    /*! Module core, file ui.events.pointer.mspointer.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer.mspointer", ["jquery", "/ui/events/pointer/ui.events.pointer.base", "/ui/events/pointer/ui.events.pointer.observer", "/ui/events/pointer/ui.events.pointer.mspointerHooks"], function($, BaseStrategy, Observer) {
        var eventMap = {
                dxpointerdown: "MSPointerDown pointerdown",
                dxpointermove: "MSPointerMove pointermove",
                dxpointerup: "MSPointerUp pointerup",
                dxpointercancel: "MSPointerCancel pointercancel",
                dxpointerover: "MSPointerOver pointerover",
                dxpointerout: "MSPointerOut pointerout",
                dxpointerenter: "MSPointerEnter pointerenter",
                dxpointerleave: "MSPointerLeave pointerleave"
            };
        var observer;
        var activated = false;
        var activateStrategy = function() {
                if (activated)
                    return;
                observer = new Observer(eventMap, function(a, b) {
                    return a.pointerId === b.pointerId
                });
                activated = true
            };
        var MsPointerStrategy = BaseStrategy.inherit({
                ctor: function() {
                    this.callBase.apply(this, arguments);
                    activateStrategy()
                },
                _fireEvent: function(args) {
                    return this.callBase($.extend({
                            pointers: observer.pointers(),
                            pointerId: args.originalEvent.pointerId
                        }, args))
                }
            });
        MsPointerStrategy.map = eventMap;
        MsPointerStrategy.resetObserver = function() {
            observer.reset()
        };
        return MsPointerStrategy
    });
    /*! Module core, file ui.events.pointer.js */
    DevExpress.define("/ui/events/pointer/ui.events.pointer", ["jquery", "/utils/utils.support", "/devices", "/ui/events/ui.events.eventRegistrator", "/ui/events/pointer/ui.events.pointer.touch", "/ui/events/pointer/ui.events.pointer.mspointer", "/ui/events/pointer/ui.events.pointer.mouse", "/ui/events/pointer/ui.events.pointer.mouseAndTouch"], function($, support, devices, registerEvent, TouchStrategy, MsPointerStrategy, MouseStrategy, MouseAndTouchStrategy) {
        var EventStrategy = function() {
                if (support.pointer)
                    return MsPointerStrategy;
                var device = devices.real();
                if (support.touch && !(device.tablet || device.phone))
                    return MouseAndTouchStrategy;
                if (support.touch)
                    return TouchStrategy;
                return MouseStrategy
            }();
        $.each(EventStrategy.map, function(pointerEvent, originalEvents) {
            registerEvent(pointerEvent, new EventStrategy(pointerEvent, originalEvents))
        });
        return {
                down: "dxpointerdown",
                up: "dxpointerup",
                move: "dxpointermove",
                cancel: "dxpointercancel",
                enter: "dxpointerenter",
                leave: "dxpointerleave",
                over: "dxpointerover",
                out: "dxpointerout"
            }
    });
    /*! Module core, file ui.events.wheel.js */
    DevExpress.define("/ui/events/ui.events.wheel", ["jquery", "/ui/events/ui.events.eventRegistrator", "/ui/events/ui.events.utils"], function($, registerEvent, eventUtils) {
        var EVENT_NAME = "dxmousewheel",
            EVENT_NAMESPACE = "dxWheel";
        $.event.fixHooks["wheel"] = $.event.mouseHooks;
        var wheelEvent = document.onmousewheel !== undefined ? "mousewheel" : "wheel";
        var wheel = {
                setup: function(element, data) {
                    var $element = $(element);
                    $element.on(eventUtils.addNamespace(wheelEvent, EVENT_NAMESPACE), $.proxy(wheel._wheelHandler, wheel))
                },
                teardown: function(element) {
                    var $element = $(element);
                    $element.off("." + EVENT_NAMESPACE)
                },
                _wheelHandler: function(e) {
                    var delta = this._getWheelDelta(e.originalEvent);
                    eventUtils.fireEvent({
                        type: EVENT_NAME,
                        originalEvent: e,
                        delta: delta,
                        pointerType: "mouse"
                    });
                    e.stopPropagation()
                },
                _getWheelDelta: function(event) {
                    return event.wheelDelta ? event.wheelDelta : -event.deltaY * 30
                }
            };
        registerEvent(EVENT_NAME, wheel);
        return {name: EVENT_NAME}
    });
    /*! Module core, file ui.events.hover.js */
    DevExpress.define("/ui/events/ui.events.hover", ["jquery", "/class", "/devices", "/ui/events/ui.events.eventRegistrator", "/ui/events/ui.events.utils", "/ui/events/pointer/ui.events.pointer"], function($, Class, devices, registerEvent, eventUtils, pointerEvents) {
        var HOVERSTART_NAMESPACE = "dxHoverStart",
            HOVERSTART = "dxhoverstart",
            POINTERENTER_NAMESPACED_EVENT_NAME = eventUtils.addNamespace(pointerEvents.enter, HOVERSTART_NAMESPACE),
            HOVEREND_NAMESPACE = "dxHoverEnd",
            HOVEREND = "dxhoverend",
            POINTERLEAVE_NAMESPACED_EVENT_NAME = eventUtils.addNamespace(pointerEvents.leave, HOVEREND_NAMESPACE);
        var Hover = Class.inherit({
                noBubble: true,
                add: function(element, handleObj) {
                    var that = this,
                        $element = $(element);
                    $element.off(this._originalEventName).on(this._originalEventName, handleObj.selector, function(e) {
                        that._handler(e)
                    })
                },
                _handler: function(e) {
                    if (eventUtils.isTouchEvent(e) || devices.isSimulator())
                        return;
                    eventUtils.fireEvent({
                        type: this._eventName,
                        originalEvent: e,
                        delegateTarget: e.delegateTarget
                    })
                },
                teardown: function(element) {
                    $(element).off(this._originalEventName)
                }
            });
        var HoverStart = Hover.inherit({
                ctor: function() {
                    this._eventName = HOVERSTART;
                    this._originalEventName = POINTERENTER_NAMESPACED_EVENT_NAME;
                    this._isMouseDown = false
                },
                _handler: function(e) {
                    var pointers = e.pointers || [];
                    if (!pointers.length)
                        this.callBase(e)
                }
            });
        var HoverEnd = Hover.inherit({ctor: function() {
                    this._eventName = HOVEREND;
                    this._originalEventName = POINTERLEAVE_NAMESPACED_EVENT_NAME
                }});
        registerEvent(HOVERSTART, new HoverStart);
        registerEvent(HOVEREND, new HoverEnd);
        return {
                start: HOVERSTART,
                end: HOVEREND
            }
    });
    /*! Module core, file ui.events.emitterRegistrator.js */
    DevExpress.define("/ui/events/ui.events.emitterRegistrator", ["jquery", "/class", "/ui/events/ui.events.eventRegistrator", "/ui/events/ui.events.utils", "/ui/events/pointer/ui.events.pointer", "/ui/events/ui.events.emitter.gesture", "/ui/events/ui.events.wheel"], function($, Class, registerEvent, eventUtils, pointerEvents, GestureEmitter, wheelEvent) {
        var MANAGER_EVENT = "dxEventManager",
            EMITTER_DATA = "dxEmitter";
        var EventManager = Class.inherit({
                ctor: function() {
                    this._attachHandlers();
                    this.reset();
                    this._proxiedCancelHandler = $.proxy(this._cancelHandler, this);
                    this._proxiedAcceptHandler = $.proxy(this._acceptHandler, this)
                },
                _attachHandlers: function() {
                    $(document).on(eventUtils.addNamespace(pointerEvents.down, MANAGER_EVENT), $.proxy(this._pointerDownHandler, this)).on(eventUtils.addNamespace(pointerEvents.move, MANAGER_EVENT), $.proxy(this._pointerMoveHandler, this)).on(eventUtils.addNamespace([pointerEvents.up, pointerEvents.cancel].join(" "), MANAGER_EVENT), $.proxy(this._pointerUpHandler, this)).on(eventUtils.addNamespace(wheelEvent.name, MANAGER_EVENT), $.proxy(this._mouseWheelHandler, this))
                },
                _eachEmitter: function(callback) {
                    var activeEmitters = this._activeEmitters || [];
                    var i = 0;
                    while (activeEmitters.length > i) {
                        var emitter = activeEmitters[i];
                        if (callback(emitter) === false)
                            break;
                        if (activeEmitters[i] === emitter)
                            i++
                    }
                },
                _applyToEmitters: function(method, arg) {
                    this._eachEmitter(function(emitter) {
                        emitter[method].call(emitter, arg)
                    })
                },
                reset: function() {
                    this._eachEmitter(this._proxiedCancelHandler);
                    this._activeEmitters = []
                },
                resetEmitter: function(emitter) {
                    this._proxiedCancelHandler(emitter)
                },
                _pointerDownHandler: function(e) {
                    if (eventUtils.isMouseEvent(e) && e.which > 1)
                        return;
                    this._updateEmitters(e)
                },
                _updateEmitters: function(e) {
                    if (!this._isSetChanged(e))
                        return;
                    this._cleanEmitters(e);
                    this._fetchEmitters(e)
                },
                _isSetChanged: function(e) {
                    var currentSet = this._closestEmitter(e);
                    var previousSet = this._emittersSet || [];
                    var setChanged = currentSet.length !== previousSet.length;
                    $.each(currentSet, function(index, emitter) {
                        setChanged = setChanged || previousSet[index] !== emitter;
                        return !setChanged
                    });
                    this._emittersSet = currentSet;
                    return setChanged
                },
                _closestEmitter: function(e) {
                    var that = this,
                        result = [],
                        $element = $(e.target);
                    function handleEmitter(_, emitter) {
                        if (!!emitter && emitter.validatePointers(e) && emitter.validate(e)) {
                            emitter.addCancelCallback(that._proxiedCancelHandler);
                            emitter.addAcceptCallback(that._proxiedAcceptHandler);
                            result.push(emitter)
                        }
                    }
                    while ($element.length) {
                        var emitters = $.data($element.get(0), EMITTER_DATA) || [];
                        $.each(emitters, handleEmitter);
                        $element = $element.parent()
                    }
                    return result
                },
                _acceptHandler: function(acceptedEmitter, e) {
                    var that = this;
                    this._eachEmitter(function(emitter) {
                        if (emitter !== acceptedEmitter)
                            that._cancelEmitter(emitter, e)
                    })
                },
                _cancelHandler: function(canceledEmitter, e) {
                    this._cancelEmitter(canceledEmitter, e)
                },
                _cancelEmitter: function(emitter, e) {
                    var activeEmitters = this._activeEmitters;
                    if (e)
                        emitter.cancel(e);
                    else
                        emitter.reset();
                    emitter.removeCancelCallback();
                    emitter.removeAcceptCallback();
                    var emitterIndex = $.inArray(emitter, activeEmitters);
                    if (emitterIndex > -1)
                        activeEmitters.splice(emitterIndex, 1)
                },
                _cleanEmitters: function(e) {
                    this._applyToEmitters("end", e);
                    this.reset(e)
                },
                _fetchEmitters: function(e) {
                    this._activeEmitters = this._emittersSet.slice();
                    this._applyToEmitters("start", e)
                },
                _pointerMoveHandler: function(e) {
                    this._applyToEmitters("move", e)
                },
                _pointerUpHandler: function(e) {
                    this._updateEmitters(e)
                },
                _mouseWheelHandler: function(e) {
                    if (!this._allowInterruptionByMousewheel())
                        return;
                    e.pointers = [null];
                    this._pointerDownHandler(e);
                    this._adjustWheelEvent(e);
                    this._pointerMoveHandler(e);
                    e.pointers = [];
                    this._pointerUpHandler(e)
                },
                _allowInterruptionByMousewheel: function() {
                    var allowInterruption = true;
                    this._eachEmitter(function(emitter) {
                        allowInterruption = emitter.allowInterruptionByMousewheel() && allowInterruption;
                        return allowInterruption
                    });
                    return allowInterruption
                },
                _adjustWheelEvent: function(e) {
                    var closestGestureEmitter = null;
                    this._eachEmitter(function(emitter) {
                        if (!(emitter instanceof GestureEmitter))
                            return;
                        var direction = emitter.getDirection(e);
                        if (direction !== "horizontal" && !e.shiftKey || direction !== "vertical" && e.shiftKey) {
                            closestGestureEmitter = emitter;
                            return false
                        }
                    });
                    if (!closestGestureEmitter)
                        return;
                    var direction = closestGestureEmitter.getDirection(e),
                        verticalGestureDirection = direction === "both" && !e.shiftKey || direction === "vertical",
                        prop = verticalGestureDirection ? "pageY" : "pageX";
                    e[prop] += e.delta
                },
                isActive: function(element) {
                    var result = false;
                    this._eachEmitter(function(emitter) {
                        result = result || emitter.getElement().is(element)
                    });
                    return result
                }
            });
        var eventManager = new EventManager;
        var EMITTER_SUBSCRIPTION_DATA = "dxEmitterSubscription";
        var registerEmitter = function(emitterConfig) {
                var emitterClass = emitterConfig.emitter,
                    emitterName = emitterConfig.events[0],
                    emitterEvents = emitterConfig.events;
                $.each(emitterEvents, function(_, eventName) {
                    registerEvent(eventName, {
                        noBubble: !emitterConfig.bubble,
                        setup: function(element, data) {
                            var subscriptions = $.data(element, EMITTER_SUBSCRIPTION_DATA) || {},
                                emitters = $.data(element, EMITTER_DATA) || {},
                                emitter = emitters[emitterName] || new emitterClass(element);
                            subscriptions[eventName] = true;
                            emitters[emitterName] = emitter;
                            $.data(element, EMITTER_DATA, emitters);
                            $.data(element, EMITTER_SUBSCRIPTION_DATA, subscriptions)
                        },
                        add: function(element, handleObj) {
                            var emitters = $.data(element, EMITTER_DATA),
                                emitter = emitters[emitterName];
                            emitter.configurate($.extend({delegateSelector: handleObj.selector}, handleObj.data), handleObj.type)
                        },
                        teardown: function(element) {
                            var subscriptions = $.data(element, EMITTER_SUBSCRIPTION_DATA),
                                emitters = $.data(element, EMITTER_DATA),
                                emitter = emitters[emitterName];
                            delete subscriptions[eventName];
                            var disposeEmitter = true;
                            $.each(emitterEvents, function(_, eventName) {
                                disposeEmitter = disposeEmitter && !subscriptions[eventName];
                                return disposeEmitter
                            });
                            if (disposeEmitter) {
                                if (eventManager.isActive(element))
                                    eventManager.resetEmitter(emitter);
                                emitter && emitter.dispose();
                                delete emitters[emitterName]
                            }
                        }
                    })
                })
            };
        return registerEmitter
    });
    /*! Module core, file ui.events.emitter.js */
    DevExpress.define("/ui/events/ui.events.emitter", ["jquery", "/class", "/ui/events/ui.events.utils"], function($, Class, eventUtils) {
        var Emitter = Class.inherit({
                ctor: function(element) {
                    this._$element = $(element);
                    this._cancelCallback = $.Callbacks();
                    this._acceptCallback = $.Callbacks()
                },
                getElement: function() {
                    return this._$element
                },
                validate: function(e) {
                    return e.type !== "dxmousewheel"
                },
                validatePointers: function(e) {
                    return eventUtils.hasTouches(e) === 1
                },
                allowInterruptionByMousewheel: function() {
                    return true
                },
                configurate: function(data) {
                    $.extend(this, data)
                },
                addCancelCallback: function(callback) {
                    this._cancelCallback.add(callback)
                },
                removeCancelCallback: function() {
                    this._cancelCallback.empty()
                },
                _cancel: function(e) {
                    this._cancelCallback.fire(this, e)
                },
                addAcceptCallback: function(callback) {
                    this._acceptCallback.add(callback)
                },
                removeAcceptCallback: function() {
                    this._acceptCallback.empty()
                },
                _accept: function(e) {
                    this._acceptCallback.fire(this, e)
                },
                _requestAccept: function(e) {
                    this._acceptRequestEvent = e
                },
                _forgetAccept: function() {
                    this._accept(this._acceptRequestEvent);
                    this._acceptRequestEvent = null
                },
                start: $.noop,
                move: $.noop,
                end: $.noop,
                cancel: $.noop,
                reset: function() {
                    if (this._acceptRequestEvent)
                        this._accept(this._acceptRequestEvent)
                },
                _fireEvent: function(eventName, e, params) {
                    var eventData = $.extend({
                            type: eventName,
                            originalEvent: e,
                            target: this._getEmitterTarget(e),
                            delegateTarget: this.getElement().get(0)
                        }, params);
                    e = eventUtils.fireEvent(eventData);
                    if (e.cancel)
                        this._cancel(e);
                    return e
                },
                _getEmitterTarget: function(e) {
                    return (this.delegateSelector ? $(e.target).closest(this.delegateSelector) : this.getElement()).get(0)
                },
                dispose: $.noop
            });
        return Emitter
    });
    /*! Module core, file ui.events.emitter.gesture.js */
    DevExpress.define("/ui/events/ui.events.emitter.gesture", ["jquery", "/devices", "/utils/utils.support", "/utils/utils.browser", "/utils/utils.dom", "/utils/utils.math", "/utils/utils.common", "/ui/events/ui.events.utils", "/ui/events/ui.events.emitter"], function($, devices, support, browser, domUtils, mathUtils, commonUtils, eventUtils, Emitter) {
        var sign = mathUtils.sign,
            abs = Math.abs;
        var SLEEP = 0,
            INITED = 1,
            STARTED = 2,
            TOUCH_BOUNDARY = 10,
            IMMEDIATE_TOUCH_BOUNDARY = 0,
            IMMEDIATE_TIMEOUT = 180;
        var isMousewheelEvent = function(e) {
                return e && e.type === "dxmousewheel"
            };
        var supportPointerEvents = function() {
                var cssSupport = support.styleProp("pointer-events");
                var msieLess11 = browser.msie && parseInt(browser.version, 10) < 11;
                return cssSupport && !msieLess11
            };
        var gestureCover = function() {
                var GESTURE_COVER_CLASS = "dx-gesture-cover";
                var isDesktop = devices.real().platform === "generic";
                if (!supportPointerEvents() || !isDesktop)
                    return $.noop;
                var $cover = $("<div>").addClass(GESTURE_COVER_CLASS).css("pointerEvents", "none");
                $(function() {
                    $cover.appendTo("body")
                });
                return function(toggle, cursor) {
                        $cover.css("pointerEvents", toggle ? "all" : "none");
                        toggle && $cover.css("cursor", cursor)
                    }
            }();
        var GestureEmitter = Emitter.inherit({
                configurate: function(data) {
                    this.getElement().css("msTouchAction", data.immediate ? "pinch-zoom" : "");
                    this.callBase(data)
                },
                allowInterruptionByMousewheel: function() {
                    return this._stage !== STARTED
                },
                getDirection: function() {
                    return this.direction
                },
                _cancel: function(e) {
                    this.callBase.apply(this, arguments);
                    this._toggleGestureCover(false);
                    this._stage = SLEEP
                },
                start: function(e) {
                    if (eventUtils.needSkipEvent(e)) {
                        this._cancel(e);
                        return
                    }
                    this._startEvent = eventUtils.createEvent(e);
                    this._startEventData = eventUtils.eventData(e);
                    this._prevEventData = this._startEventData;
                    this._stage = INITED;
                    this._init(e);
                    this._setupImmediateTimer()
                },
                _setupImmediateTimer: function() {
                    clearTimeout(this._immediateTimer);
                    this._immedeateAccepted = false;
                    if (!this.immediate)
                        return;
                    this._immediateTimer = setTimeout($.proxy(function() {
                        this._immedeateAccepted = true
                    }, this), IMMEDIATE_TIMEOUT)
                },
                move: function(e) {
                    if (this._stage === INITED && this._directionConfirmed(e)) {
                        this._stage = STARTED;
                        this._resetActiveElement();
                        this._toggleGestureCover(true, e);
                        this._clearSelection(e);
                        this._adjustStartEvent(e);
                        this._start(this._startEvent);
                        this._prevEventData = eventUtils.eventData(this._startEvent);
                        if (this._stage === SLEEP)
                            return;
                        this._requestAccept(e);
                        this._move(e);
                        this._forgetAccept()
                    }
                    else if (this._stage === STARTED) {
                        this._clearSelection(e);
                        this._move(e)
                    }
                    this._prevEventData = eventUtils.eventData(e)
                },
                _directionConfirmed: function(e) {
                    var touchBoundary = this._getTouchBoundary(e),
                        delta = eventUtils.eventDelta(this._startEventData, eventUtils.eventData(e)),
                        deltaX = abs(delta.x),
                        deltaY = abs(delta.y);
                    var horizontalMove = this._validateMove(touchBoundary, deltaX, deltaY),
                        verticalMove = this._validateMove(touchBoundary, deltaY, deltaX);
                    var direction = this.getDirection(e),
                        bothAccepted = direction === "both" && (horizontalMove || verticalMove),
                        horizontalAccepted = direction === "horizontal" && horizontalMove,
                        verticalAccepted = direction === "vertical" && verticalMove;
                    return bothAccepted || horizontalAccepted || verticalAccepted || this._immedeateAccepted
                },
                _validateMove: function(touchBoundary, mainAxis, crossAxis) {
                    return mainAxis && mainAxis >= touchBoundary && (this.immediate ? mainAxis >= crossAxis : true)
                },
                _getTouchBoundary: function(e) {
                    return this.immediate || isMousewheelEvent(e) ? IMMEDIATE_TOUCH_BOUNDARY : TOUCH_BOUNDARY
                },
                _adjustStartEvent: function(e) {
                    var touchBoundary = this._getTouchBoundary(e),
                        delta = eventUtils.eventDelta(this._startEventData, eventUtils.eventData(e));
                    this._startEvent.pageX += sign(delta.x) * touchBoundary;
                    this._startEvent.pageY += sign(delta.y) * touchBoundary
                },
                _resetActiveElement: function() {
                    if (devices.real().platform === "ios" && $(":focus", this.getElement()).length)
                        domUtils.resetActiveElement()
                },
                _toggleGestureCover: function(toggle, e) {
                    var isStarted = this._stage === STARTED;
                    if (isStarted)
                        gestureCover(toggle, this.getElement().css("cursor"))
                },
                _clearSelection: function(e) {
                    if (isMousewheelEvent(e) || eventUtils.isTouchEvent(e))
                        return;
                    domUtils.clearSelection()
                },
                end: function(e) {
                    this._toggleGestureCover(false, e);
                    if (this._stage === STARTED)
                        this._end(e);
                    else if (this._stage === INITED)
                        this._stop(e);
                    this._stage = SLEEP
                },
                dispose: function() {
                    clearTimeout(this._immediateTimer);
                    this.callBase.apply(this, arguments);
                    this._toggleGestureCover(false)
                },
                _init: $.noop,
                _start: $.noop,
                _move: $.noop,
                _stop: $.noop,
                _end: $.noop
            });
        GestureEmitter.initialTouchBoundary = TOUCH_BOUNDARY;
        GestureEmitter.touchBoundary = function(newBoundary) {
            if (commonUtils.isDefined(newBoundary)) {
                TOUCH_BOUNDARY = newBoundary;
                return
            }
            return TOUCH_BOUNDARY
        };
        return GestureEmitter
    });
    /*! Module core, file ui.events.emitter.feedback.js */
    DevExpress.define("/ui/events/ui.events.emitter.feedback", ["jquery", "/class", "/utils/utils.common", "/devices", "/ui/events/ui.events.utils", "/ui/events/pointer/ui.events.pointer", "/ui/events/ui.events.emitter", "/ui/events/ui.events.emitterRegistrator"], function($, Class, commonUtils, devices, eventUtils, pointerEvents, Emitter, registerEmitter) {
        var ACTIVE_EVENT_NAME = "dxactive",
            INACTIVE_EVENT_NAME = "dxinactive",
            ACTIVE_TIMEOUT = 30,
            INACTIVE_TIMEOUT = 400;
        var FeedbackEvent = Class.inherit({
                ctor: function(timeout, fire) {
                    this._timeout = timeout;
                    this._fire = fire
                },
                start: function() {
                    var that = this;
                    this._schedule(function() {
                        that.force()
                    })
                },
                _schedule: function(fn) {
                    this._timer = window.setTimeout(fn, this._timeout)
                },
                stop: function() {
                    clearTimeout(this._timer)
                },
                force: function() {
                    if (this._fired)
                        return;
                    this.stop();
                    this._fire();
                    this._fired = true
                },
                fired: function() {
                    return this._fired
                }
            });
        var activeFeedback;
        var FeedbackEmitter = Emitter.inherit({
                ctor: function() {
                    this.callBase.apply(this, arguments);
                    this._active = new FeedbackEvent(0, $.noop);
                    this._inactive = new FeedbackEvent(0, $.noop)
                },
                configurate: function(data, eventName) {
                    switch (eventName) {
                        case ACTIVE_EVENT_NAME:
                            data.activeTimeout = data.timeout;
                            break;
                        case INACTIVE_EVENT_NAME:
                            data.inactiveTimeout = data.timeout;
                            break
                    }
                    this.callBase(data)
                },
                start: function(e) {
                    if (activeFeedback) {
                        var activeChildExists = $.contains(this.getElement().get(0), activeFeedback.getElement().get(0));
                        var childJustActivated = !activeFeedback._active.fired();
                        if (activeChildExists && childJustActivated) {
                            this._cancel();
                            return
                        }
                        activeFeedback._inactive.force()
                    }
                    activeFeedback = this;
                    this._initEvents(e);
                    this._active.start()
                },
                _initEvents: function(e) {
                    var that = this,
                        eventTarget = this._getEmitterTarget(e),
                        mouseEvent = eventUtils.isMouseEvent(e),
                        isSimulator = devices.isSimulator(),
                        deferFeedback = isSimulator || !mouseEvent,
                        activeTimeout = commonUtils.ensureDefined(this.activeTimeout, ACTIVE_TIMEOUT),
                        inactiveTimeout = commonUtils.ensureDefined(this.inactiveTimeout, INACTIVE_TIMEOUT);
                    this._active = new FeedbackEvent(deferFeedback ? activeTimeout : 0, function() {
                        that._fireEvent(ACTIVE_EVENT_NAME, e, {target: eventTarget})
                    });
                    this._inactive = new FeedbackEvent(deferFeedback ? inactiveTimeout : 0, function() {
                        that._fireEvent(INACTIVE_EVENT_NAME, e, {target: eventTarget});
                        activeFeedback = null
                    })
                },
                cancel: function(e) {
                    this.end(e)
                },
                end: function(e) {
                    var skipTimers = e.type !== pointerEvents.up;
                    if (skipTimers)
                        this._active.stop();
                    else
                        this._active.force();
                    this._inactive.start();
                    if (skipTimers)
                        this._inactive.force()
                },
                dispose: function() {
                    this._active.stop();
                    this._inactive.stop();
                    this.callBase()
                },
                lockInactive: function() {
                    this._active.force();
                    this._inactive.stop();
                    activeFeedback = null;
                    this._cancel();
                    return $.proxy(this._inactive.force, this._inactive)
                }
            });
        FeedbackEmitter.lock = function(deferred) {
            var lockInactive = activeFeedback ? activeFeedback.lockInactive() : $.noop;
            $.when(deferred).always(lockInactive)
        };
        registerEmitter({
            emitter: FeedbackEmitter,
            events: [ACTIVE_EVENT_NAME, INACTIVE_EVENT_NAME]
        });
        return {
                lock: FeedbackEmitter.lock,
                active: ACTIVE_EVENT_NAME,
                inactive: INACTIVE_EVENT_NAME
            }
    });
    /*! Module core, file fx.js */
    (function($, DX, undefined) {
        var errors = DX.require("/errors"),
            translator = DX.require("/utils/utils.translator"),
            animationFrame = DX.require("/utils/utils.animationFrame"),
            support = DX.require("/utils/utils.support"),
            positionUtils = DX.require("/utils/utils.position"),
            removeEvent = DX.require("/ui/events/ui.events.remove"),
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            transitionEndEventName = support.transitionEndEventName + ".dxFX",
            removeEventName = eventUtils.addNamespace(removeEvent.name, "dxFX");
        var CSS_TRANSITION_EASING_REGEX = /cubic-bezier\((\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\)/,
            RELATIVE_VALUE_REGEX = /^([+-])=(.*)/i,
            ANIM_DATA_KEY = "dxAnimData",
            ANIM_QUEUE_KEY = "dxAnimQueue",
            TRANSFORM_PROP = "transform";
        var TransitionAnimationStrategy = {
                initAnimation: function($element, config) {
                    $element.css({transitionProperty: "none"});
                    if (typeof config.from === "string")
                        $element.addClass(config.from);
                    else
                        setProps($element, config.from);
                    var that = this,
                        deferred = $.Deferred(),
                        cleanupWhen = config.cleanupWhen;
                    config.transitionAnimation = {
                        deferred: deferred,
                        finish: function() {
                            that._finishTransition($element, config);
                            if (cleanupWhen)
                                $.when(deferred, cleanupWhen).always(function() {
                                    that._cleanup($element, config)
                                });
                            else
                                that._cleanup($element, config);
                            deferred.resolveWith($element, [config, $element])
                        }
                    };
                    this._completeAnimationCallback($element, config).done(function() {
                        config.transitionAnimation.finish()
                    }).fail(function() {
                        deferred.rejectWith($element, [config, $element])
                    });
                    if (!config.duration)
                        config.transitionAnimation.finish();
                    $element.css("transform");
                    $element.css({
                        transitionProperty: "all",
                        transitionDelay: config.delay + "ms",
                        transitionDuration: config.duration + "ms",
                        transitionTimingFunction: config.easing
                    })
                },
                animate: function($element, config) {
                    this._startAnimation($element, config);
                    return config.transitionAnimation.deferred.promise()
                },
                _completeAnimationCallback: function($element, config) {
                    var that = this,
                        startTime = $.now() + config.delay,
                        deferred = $.Deferred(),
                        transitionEndFired = $.Deferred(),
                        simulatedTransitionEndFired = $.Deferred(),
                        simulatedEndEventTimer,
                        waitForJSCompleteTimer;
                    config.transitionAnimation.cleanup = function() {
                        clearTimeout(simulatedEndEventTimer);
                        clearTimeout(waitForJSCompleteTimer);
                        $element.off(transitionEndEventName);
                        $element.off(removeEventName)
                    };
                    $element.one(transitionEndEventName, function() {
                        if ($.now() - startTime >= config.duration)
                            transitionEndFired.reject()
                    }).off(removeEventName).on(removeEventName, function() {
                        that.stop($element, config);
                        deferred.reject()
                    });
                    waitForJSCompleteTimer = setTimeout(function() {
                        simulatedEndEventTimer = setTimeout(function() {
                            simulatedTransitionEndFired.reject()
                        }, config.duration + config.delay + DX.fx._simulatedTransitionEndDelay);
                        $.when(transitionEndFired, simulatedTransitionEndFired).fail($.proxy(function() {
                            deferred.resolve()
                        }, this))
                    });
                    return deferred.promise()
                },
                _startAnimation: function($element, config) {
                    if (typeof config.to === "string")
                        $element[0].className += " " + config.to;
                    else if (config.to)
                        setProps($element, config.to)
                },
                _finishTransition: function($element, config) {
                    $element.css("transition", "none")
                },
                _cleanup: function($element, config) {
                    config.transitionAnimation.cleanup();
                    if (typeof config.from === "string") {
                        $element.removeClass(config.from);
                        $element.removeClass(config.to)
                    }
                },
                stop: function($element, config, jumpToEnd) {
                    if (!config)
                        return;
                    if (jumpToEnd)
                        config.transitionAnimation.finish();
                    else {
                        if ($.isPlainObject(config.to))
                            $.each(config.to, function(key) {
                                $element.css(key, $element.css(key))
                            });
                        this._finishTransition($element, config);
                        this._cleanup($element, config)
                    }
                }
            };
        var FrameAnimationStrategy = {
                initAnimation: function($element, config) {
                    setProps($element, config.from)
                },
                animate: function($element, config) {
                    var deferred = $.Deferred(),
                        that = this;
                    if (!config)
                        return deferred.reject().promise();
                    $.each(config.to, function(prop) {
                        if (config.from[prop] === undefined)
                            config.from[prop] = that._normalizeValue($element.css(prop))
                    });
                    if (config.to[TRANSFORM_PROP]) {
                        config.from[TRANSFORM_PROP] = that._parseTransform(config.from[TRANSFORM_PROP]);
                        config.to[TRANSFORM_PROP] = that._parseTransform(config.to[TRANSFORM_PROP])
                    }
                    config.frameAnimation = {
                        to: config.to,
                        from: config.from,
                        currentValue: config.from,
                        easing: convertTransitionTimingFuncToJQueryEasing(config.easing),
                        duration: config.duration,
                        startTime: (new Date).valueOf(),
                        finish: function() {
                            this.currentValue = this.to;
                            this.draw();
                            animationFrame.cancel(config.frameAnimation.animationFrameId);
                            deferred.resolve()
                        },
                        draw: function() {
                            if (config.draw) {
                                config.draw(this.currentValue);
                                return
                            }
                            var currentValue = $.extend({}, this.currentValue);
                            if (currentValue[TRANSFORM_PROP])
                                currentValue[TRANSFORM_PROP] = $.map(currentValue[TRANSFORM_PROP], function(value, prop) {
                                    if (prop === "translate")
                                        return translator.getTranslateCss(value);
                                    else if (prop === "scale")
                                        return "scale(" + value + ")";
                                    else if (prop.substr(0, prop.length - 1) === "rotate")
                                        return prop + "(" + value + "deg)"
                                }).join(" ");
                            $element.css(currentValue)
                        }
                    };
                    if (config.delay) {
                        config.frameAnimation.startTime += config.delay;
                        config.frameAnimation.delayTimeout = setTimeout(function() {
                            that._startAnimation($element, config)
                        }, config.delay)
                    }
                    else
                        that._startAnimation($element, config);
                    return deferred.promise()
                },
                _startAnimation: function($element, config) {
                    $element.off(removeEventName).on(removeEventName, function() {
                        if (config.frameAnimation)
                            animationFrame.cancel(config.frameAnimation.animationFrameId)
                    });
                    this._animationStep($element, config)
                },
                _parseTransform: function(transformString) {
                    var result = {};
                    $.each(transformString.match(/(\w|\d)+\([^\)]*\)\s*/g), function(i, part) {
                        var translateData = translator.parseTranslate(part),
                            scaleData = part.match(/scale\((.+?)\)/),
                            rotateData = part.match(/(rotate.)\((.+)deg\)/);
                        if (translateData)
                            result.translate = translateData;
                        if (scaleData && scaleData[1])
                            result.scale = parseFloat(scaleData[1]);
                        if (rotateData && rotateData[1])
                            result[rotateData[1]] = parseFloat(rotateData[2])
                    });
                    return result
                },
                stop: function($element, config, jumpToEnd) {
                    var frameAnimation = config && config.frameAnimation;
                    if (!frameAnimation)
                        return;
                    animationFrame.cancel(frameAnimation.animationFrameId);
                    clearTimeout(frameAnimation.delayTimeout);
                    if (jumpToEnd)
                        frameAnimation.finish();
                    delete config.frameAnimation
                },
                _animationStep: function($element, config) {
                    var frameAnimation = config && config.frameAnimation;
                    if (!frameAnimation)
                        return;
                    var now = (new Date).valueOf();
                    if (now >= frameAnimation.startTime + frameAnimation.duration) {
                        frameAnimation.finish();
                        return
                    }
                    frameAnimation.currentValue = this._calcStepValue(frameAnimation, now - frameAnimation.startTime);
                    frameAnimation.draw();
                    var that = this;
                    frameAnimation.animationFrameId = animationFrame.request(function() {
                        that._animationStep($element, config)
                    })
                },
                _calcStepValue: function(frameAnimation, currentDuration) {
                    var calcValueRecursively = function(from, to) {
                            var result = $.isArray(to) ? [] : {};
                            var calcEasedValue = function(propName) {
                                    var x = currentDuration / frameAnimation.duration,
                                        t = currentDuration,
                                        b = 1 * from[propName],
                                        c = to[propName] - from[propName],
                                        d = frameAnimation.duration;
                                    return $.easing[frameAnimation.easing](x, t, b, c, d)
                                };
                            $.each(to, function(propName, endPropValue) {
                                if (typeof endPropValue === "string" && parseFloat(endPropValue, 10) === false)
                                    return true;
                                result[propName] = typeof endPropValue === "object" ? calcValueRecursively(from[propName], endPropValue) : calcEasedValue(propName)
                            });
                            return result
                        };
                    return calcValueRecursively(frameAnimation.from, frameAnimation.to)
                },
                _normalizeValue: function(value) {
                    var numericValue = parseFloat(value, 10);
                    if (numericValue === false)
                        return value;
                    return numericValue
                }
            };
        var FallbackToNoAnimationStrategy = {
                initAnimation: function($element, config){},
                animate: function($element, config) {
                    return $.Deferred().resolve().promise()
                },
                stop: $.noop,
                isSynchronous: true
            };
        var animationStrategies = {
                transition: support.transition ? TransitionAnimationStrategy : FrameAnimationStrategy,
                frame: FrameAnimationStrategy,
                noAnimation: FallbackToNoAnimationStrategy
            };
        var getAnimationStrategy = function(config) {
                config = config || {};
                var strategy = config.strategy || "transition";
                if (config.type === "css" && !support.transition)
                    strategy = "noAnimation";
                return animationStrategies[strategy]
            };
        var TransitionTimingFuncMap = {
                linear: "cubic-bezier(0, 0, 1, 1)",
                ease: "cubic-bezier(0.25, 0.1, 0.25, 1)",
                "ease-in": "cubic-bezier(0.42, 0, 1, 1)",
                "ease-out": "cubic-bezier(0, 0, 0.58, 1)",
                "ease-in-out": "cubic-bezier(0.42, 0, 0.58, 1)"
            };
        var convertTransitionTimingFuncToJQueryEasing = function(cssTransitionEasing) {
                cssTransitionEasing = TransitionTimingFuncMap[cssTransitionEasing] || cssTransitionEasing;
                var bezCoeffs = cssTransitionEasing.match(CSS_TRANSITION_EASING_REGEX);
                if (!bezCoeffs)
                    return "linear";
                bezCoeffs = bezCoeffs.slice(1, 5);
                $.each(bezCoeffs, function(index, value) {
                    bezCoeffs[index] = parseFloat(value)
                });
                var easingName = "cubicbezier_" + bezCoeffs.join("_").replace(/\./g, "p");
                if (!$.isFunction($.easing[easingName])) {
                    var polynomBezier = function(x1, y1, x2, y2) {
                            var Cx = 3 * x1,
                                Bx = 3 * (x2 - x1) - Cx,
                                Ax = 1 - Cx - Bx,
                                Cy = 3 * y1,
                                By = 3 * (y2 - y1) - Cy,
                                Ay = 1 - Cy - By;
                            var bezierX = function(t) {
                                    return t * (Cx + t * (Bx + t * Ax))
                                };
                            var bezierY = function(t) {
                                    return t * (Cy + t * (By + t * Ay))
                                };
                            var findXfor = function(t) {
                                    var x = t,
                                        i = 0,
                                        z;
                                    while (i < 14) {
                                        z = bezierX(x) - t;
                                        if (Math.abs(z) < 1e-3)
                                            break;
                                        x = x - z / derivativeX(x);
                                        i++
                                    }
                                    return x
                                };
                            var derivativeX = function(t) {
                                    return Cx + t * (2 * Bx + t * 3 * Ax)
                                };
                            return function(t) {
                                    return bezierY(findXfor(t))
                                }
                        };
                    $.easing[easingName] = function(x, t, b, c, d) {
                        return c * polynomBezier(bezCoeffs[0], bezCoeffs[1], bezCoeffs[2], bezCoeffs[3])(t / d) + b
                    }
                }
                return easingName
            };
        var baseConfigValidator = function(config, animationType, validate, typeMessage) {
                $.each(["from", "to"], function() {
                    if (!validate(config[this]))
                        throw errors.Error("E0010", animationType, this, typeMessage);
                })
            };
        var isObjectConfigValidator = function(config, animationType) {
                return baseConfigValidator(config, animationType, function(target) {
                        return $.isPlainObject(target)
                    }, "a plain object")
            };
        var isStringConfigValidator = function(config, animationType) {
                return baseConfigValidator(config, animationType, function(target) {
                        return typeof target === "string"
                    }, "a string")
            };
        var CustomAnimationConfigurator = {setup: function($element, config){}};
        var CssAnimationConfigurator = {
                validateConfig: function(config) {
                    isStringConfigValidator(config, "css")
                },
                setup: function($element, config){}
            };
        var positionAliases = {
                top: {
                    my: "bottom center",
                    at: "top center"
                },
                bottom: {
                    my: "top center",
                    at: "bottom center"
                },
                right: {
                    my: "left center",
                    at: "right center"
                },
                left: {
                    my: "right center",
                    at: "left center"
                }
            };
        var SlideAnimationConfigurator = {
                validateConfig: function(config) {
                    isObjectConfigValidator(config, "slide")
                },
                setup: function($element, config) {
                    var location = translator.locate($element);
                    if (config.type !== "slide") {
                        var positioningConfig = config.type === "slideIn" ? config.from : config.to;
                        positioningConfig.position = $.extend({of: window}, positionAliases[config.direction]);
                        setupPosition($element, positioningConfig)
                    }
                    this._setUpConfig(location, config.from);
                    this._setUpConfig(location, config.to);
                    translator.clearCache($element);
                    if (!support.transform && $element.css("position") === "static")
                        $element.css("position", "relative")
                },
                _setUpConfig: function(location, config) {
                    config.left = "left" in config ? config.left : "+=0";
                    config.top = "top" in config ? config.top : "+=0";
                    this._initNewPosition(location, config)
                },
                _initNewPosition: function(location, config) {
                    var position = {
                            left: config.left,
                            top: config.top
                        };
                    delete config.left;
                    delete config.top;
                    var relativeValue = this._getRelativeValue(position.left);
                    if (relativeValue !== undefined)
                        position.left = relativeValue + location.left;
                    else
                        config.left = 0;
                    relativeValue = this._getRelativeValue(position.top);
                    if (relativeValue !== undefined)
                        position.top = relativeValue + location.top;
                    else
                        config.top = 0;
                    var translate = {
                            x: 0,
                            y: 0
                        };
                    if (support.transform)
                        translate = {
                            x: position.left,
                            y: position.top
                        };
                    else {
                        config.left = position.left;
                        config.top = position.top
                    }
                    config[TRANSFORM_PROP] = translator.getTranslateCss(translate)
                },
                _getRelativeValue: function(value) {
                    var relativeValue;
                    if (typeof value === "string" && (relativeValue = RELATIVE_VALUE_REGEX.exec(value)))
                        return parseInt(relativeValue[1] + "1") * relativeValue[2]
                }
            };
        var FadeAnimationConfigurator = {setup: function($element, config) {
                    var from = config.from,
                        fromOpacity = $.isPlainObject(from) ? config.skipElementInitialStyles ? 0 : $element.css("opacity") : String(from),
                        toOpacity;
                    switch (config.type) {
                        case"fadeIn":
                            toOpacity = 1;
                            break;
                        case"fadeOut":
                            toOpacity = 0;
                            break;
                        default:
                            toOpacity = String(config.to)
                    }
                    config.from = {
                        visibility: "visible",
                        opacity: fromOpacity
                    };
                    config.to = {opacity: toOpacity}
                }};
        var PopAnimationConfigurator = {
                validateConfig: function(config) {
                    isObjectConfigValidator(config, "pop")
                },
                setup: function($element, config) {
                    var from = config.from,
                        to = config.to,
                        fromOpacity = "opacity" in from ? from.opacity : $element.css("opacity"),
                        toOpacity = "opacity" in to ? to.opacity : 1,
                        fromScale = "scale" in from ? from.scale : 0,
                        toScale = "scale" in to ? to.scale : 1;
                    config.from = {opacity: fromOpacity};
                    var translate = translator.getTranslate($element);
                    config.from[TRANSFORM_PROP] = this._getCssTransform(translate, fromScale);
                    config.to = {opacity: toOpacity};
                    config.to[TRANSFORM_PROP] = this._getCssTransform(translate, toScale)
                },
                _getCssTransform: function(translate, scale) {
                    return translator.getTranslateCss(translate) + "scale(" + scale + ")"
                }
            };
        var animationConfigurators = {
                custom: CustomAnimationConfigurator,
                slide: SlideAnimationConfigurator,
                slideIn: SlideAnimationConfigurator,
                slideOut: SlideAnimationConfigurator,
                fade: FadeAnimationConfigurator,
                fadeIn: FadeAnimationConfigurator,
                fadeOut: FadeAnimationConfigurator,
                pop: PopAnimationConfigurator,
                css: CssAnimationConfigurator
            };
        var getAnimationConfigurator = function(config) {
                var result = animationConfigurators[config.type];
                if (!result)
                    throw errors.Error("E0011", config.type);
                return result
            };
        var defaultJSConfig = {
                type: "custom",
                from: {},
                to: {},
                duration: 400,
                start: $.noop,
                complete: $.noop,
                easing: "ease",
                delay: 0
            },
            defaultCssConfig = {
                duration: 400,
                easing: "ease",
                delay: 0
            };
        var setupAnimationOnElement = function() {
                var animation = this,
                    $element = animation.element,
                    config = animation.config;
                setupPosition($element, config.from);
                setupPosition($element, config.to);
                animation.configurator.setup($element, config);
                $element.data(ANIM_DATA_KEY, animation);
                if (DX.fx.off) {
                    config.duration = 0;
                    config.delay = 0
                }
                animation.strategy.initAnimation($element, config);
                if (config.start)
                    config.start.apply(this, [$element, config])
            };
        var onElementAnimationComplete = function(animation) {
                var $element = animation.element,
                    config = animation.config;
                $element.removeData(ANIM_DATA_KEY);
                if (config.complete)
                    config.complete.apply(this, [$element, config]);
                animation.deferred.resolveWith(this, [$element, config])
            };
        var startAnimationOnElement = function() {
                var animation = this,
                    $element = animation.element,
                    config = animation.config;
                animation.isStarted = true;
                return animation.strategy.animate($element, config).done(function() {
                        onElementAnimationComplete(animation)
                    }).fail(function() {
                        animation.deferred.rejectWith(this, [$element, config])
                    })
            };
        var stopAnimationOnElement = function(jumpToEnd) {
                var animation = this,
                    $element = animation.element,
                    config = animation.config;
                clearTimeout(animation.startTimeout);
                if (!animation.isStarted)
                    animation.start();
                animation.strategy.stop($element, config, jumpToEnd)
            };
        var createAnimation = function(element, initialConfig) {
                var defaultConfig = initialConfig.type === "css" ? defaultCssConfig : defaultJSConfig,
                    config = $.extend(true, {}, defaultConfig, initialConfig),
                    configurator = getAnimationConfigurator(config),
                    strategy = getAnimationStrategy(config),
                    animation = {
                        element: $(element),
                        config: config,
                        configurator: configurator,
                        strategy: strategy,
                        isSynchronous: strategy.isSynchronous,
                        setup: setupAnimationOnElement,
                        start: startAnimationOnElement,
                        stop: stopAnimationOnElement,
                        deferred: $.Deferred()
                    };
                if ($.isFunction(configurator.validateConfig))
                    configurator.validateConfig(config);
                return animation
            };
        var animate = function(element, config) {
                var $element = $(element);
                if (!$element.length)
                    return $.Deferred().resolve().promise();
                var animation = createAnimation($element, config);
                pushInAnimationQueue($element, animation);
                return animation.deferred.promise()
            };
        var pushInAnimationQueue = function($element, animation) {
                var queueData = getAnimQueueData($element);
                writeAnimQueueData($element, queueData);
                queueData.push(animation);
                if (!isAnimating($element))
                    shiftFromAnimationQueue($element, queueData)
            };
        var getAnimQueueData = function($element) {
                return $element.data(ANIM_QUEUE_KEY) || []
            };
        var writeAnimQueueData = function($element, queueData) {
                $element.data(ANIM_QUEUE_KEY, queueData)
            };
        var destroyAnimQueueData = function($element) {
                $element.removeData(ANIM_QUEUE_KEY)
            };
        var isAnimating = function($element) {
                return !!$element.data(ANIM_DATA_KEY)
            };
        var shiftFromAnimationQueue = function($element, queueData) {
                queueData = getAnimQueueData($element);
                if (!queueData.length)
                    return;
                var animation = queueData.shift();
                if (queueData.length === 0)
                    destroyAnimQueueData($element);
                executeAnimation(animation).done(function() {
                    shiftFromAnimationQueue($element)
                })
            };
        var executeAnimation = function(animation) {
                animation.setup();
                if (DX.fx.off || animation.isSynchronous)
                    animation.start();
                else {
                    animation.startTimeout = setTimeout(function() {
                        animation.start()
                    });
                    var namespacedRemoveEvent = eventUtils.addNamespace(removeEvent.name, "dxFXStartAnimation");
                    animation.element.off(namespacedRemoveEvent).on(namespacedRemoveEvent, function() {
                        clearTimeout(animation.startTimeout)
                    })
                }
                return animation.deferred.promise()
            };
        var setupPosition = function($element, config) {
                if (!config || !config.position)
                    return;
                var position = positionUtils.calculate($element, config.position),
                    offset = $element.offset(),
                    currentPosition = $element.position();
                $.extend(config, {
                    left: position.h.location - offset.left + currentPosition.left,
                    top: position.v.location - offset.top + currentPosition.top
                });
                delete config.position
            };
        var setProps = function($element, props) {
                $.each(props, function(key, value) {
                    try {
                        $element.css(key, value)
                    }
                    catch(e) {}
                })
            };
        var stop = function(element, jumpToEnd) {
                var $element = $(element),
                    queueData = getAnimQueueData($element);
                $.each(queueData, function(_, animation) {
                    animation.config.duration = 0;
                    animation.isSynchronous = true
                });
                if (!isAnimating($element))
                    shiftFromAnimationQueue($element, queueData);
                var animation = $element.data(ANIM_DATA_KEY);
                if (animation)
                    animation.stop(jumpToEnd);
                $element.removeData(ANIM_DATA_KEY);
                destroyAnimQueueData($element)
            };
        DX.fx = {
            off: false,
            animationTypes: animationConfigurators,
            animate: animate,
            createAnimation: createAnimation,
            isAnimating: isAnimating,
            stop: stop,
            _simulatedTransitionEndDelay: 100
        };
        DX.fx.__internals = {convertTransitionTimingFuncToJQueryEasing: convertTransitionTimingFuncToJQueryEasing}
    })(jQuery, DevExpress);
    /*! Module core, file validationEngine.js */
    (function($, DX, undefined) {
        var Class = DevExpress.require("/class"),
            EventsMixin = DX.require("/eventsMixin"),
            errors = DevExpress.require("/errors"),
            commonUtils = DX.require("/utils/utils.common");
        var rulesValidators = {
                required: {
                    validate: function(value, rule) {
                        if (!commonUtils.isDefined(value))
                            return false;
                        if (value === false)
                            return false;
                        value = String(value);
                        if (rule.trim || !commonUtils.isDefined(rule.trim))
                            value = $.trim(value);
                        return value !== ""
                    },
                    defaultMessage: function() {
                        return Globalize.localize("validation-required")
                    },
                    defaultFormattedMessage: function() {
                        return Globalize.localize("validation-required-formatted")
                    }
                },
                numeric: {
                    validate: function(value, rule) {
                        if (!rulesValidators.required.validate(value, {}))
                            return true;
                        if (rule.useCultureSettings && commonUtils.isString(value))
                            return !isNaN(Globalize.parseFloat(value));
                        else
                            return $.isNumeric(value)
                    },
                    defaultMessage: function() {
                        return Globalize.localize("validation-numeric")
                    },
                    defaultFormattedMessage: function() {
                        return Globalize.localize("validation-numeric-formatted")
                    }
                },
                range: {
                    validate: function(value, rule) {
                        if (!rulesValidators.required.validate(value, {}))
                            return true;
                        var validNumber = rulesValidators["numeric"].validate(value, rule),
                            validValue = commonUtils.isDefined(value),
                            number = validNumber ? parseFloat(value) : validValue && value.valueOf(),
                            min = rule.min,
                            max = rule.max;
                        if (!(validNumber || commonUtils.isDate(value)) && !validValue)
                            return false;
                        if (commonUtils.isDefined(min)) {
                            if (commonUtils.isDefined(max))
                                return number >= min && number <= max;
                            return number >= min
                        }
                        else if (commonUtils.isDefined(max))
                            return number <= max;
                        else
                            throw errors.Error("E0101");
                        return false
                    },
                    defaultMessage: function() {
                        return Globalize.localize("validation-range")
                    },
                    defaultFormattedMessage: function() {
                        return Globalize.localize("validation-range-formatted")
                    }
                },
                stringLength: {
                    validate: function(value, rule) {
                        value = commonUtils.isDefined(value) ? String(value) : "";
                        if (rule.trim || !commonUtils.isDefined(rule.trim))
                            value = $.trim(value);
                        return rulesValidators.range.validate(value.length, $.extend({}, rule))
                    },
                    defaultMessage: function() {
                        return Globalize.localize("validation-stringLength")
                    },
                    defaultFormattedMessage: function() {
                        return Globalize.localize("validation-stringLength-formatted")
                    }
                },
                custom: {
                    validate: function(value, rule) {
                        return rule.validationCallback({
                                value: value,
                                validator: rule.validator,
                                rule: rule
                            })
                    },
                    defaultMessage: function() {
                        return Globalize.localize("validation-custom")
                    },
                    defaultFormattedMessage: function() {
                        return Globalize.localize("validation-custom-formatted")
                    }
                },
                compare: {
                    validate: function(value, rule) {
                        if (!rule.comparisonTarget)
                            throw errors.Error("E0102");
                        $.extend(rule, {reevaluate: true});
                        var otherValue = rule.comparisonTarget(),
                            type = rule.comparisonType || "==";
                        switch (type) {
                            case"==":
                                return value == otherValue;
                            case"!=":
                                return value != otherValue;
                            case"===":
                                return value === otherValue;
                            case"!==":
                                return value !== otherValue;
                            case">":
                                return value > otherValue;
                            case">=":
                                return value >= otherValue;
                            case"<":
                                return value < otherValue;
                            case"<=":
                                return value <= otherValue
                        }
                    },
                    defaultMessage: function() {
                        return Globalize.localize("validation-compare")
                    },
                    defaultFormattedMessage: function() {
                        return Globalize.localize("validation-compare-formatted")
                    }
                },
                pattern: {
                    validate: function(value, rule) {
                        if (!rulesValidators.required.validate(value, {}))
                            return true;
                        var pattern = rule.pattern;
                        if (commonUtils.isString(pattern))
                            pattern = new RegExp(pattern);
                        return pattern.test(value)
                    },
                    defaultMessage: function() {
                        return Globalize.localize("validation-pattern")
                    },
                    defaultFormattedMessage: function() {
                        return Globalize.localize("validation-pattern-formatted")
                    }
                },
                email: {
                    validate: function(value, rule) {
                        if (!rulesValidators.required.validate(value, {}))
                            return true;
                        return rulesValidators.pattern.validate(value, $.extend({}, rule, {pattern: /^[\d\w\._\-]+@([\d\w\._\-]+\.)+[\w]+$/i}))
                    },
                    defaultMessage: function() {
                        return Globalize.localize("validation-email")
                    },
                    defaultFormattedMessage: function() {
                        return Globalize.localize("validation-email-formatted")
                    }
                }
            };
        var GroupConfig = Class.inherit({
                ctor: function(group) {
                    this.group = group;
                    this.validators = []
                },
                validate: function() {
                    var result = {
                            isValid: true,
                            brokenRules: [],
                            validators: []
                        };
                    $.each(this.validators, function(_, validator) {
                        var validatorResult = validator.validate();
                        result.isValid = result.isValid && validatorResult.isValid;
                        if (validatorResult.brokenRule)
                            result.brokenRules.push(validatorResult.brokenRule);
                        result.validators.push(validator)
                    });
                    this.fireEvent("validated", [{
                            validators: result.validators,
                            brokenRules: result.brokenRules,
                            isValid: result.isValid
                        }]);
                    return result
                },
                reset: function() {
                    $.each(this.validators, function(_, validator) {
                        validator.reset()
                    })
                }
            }).include(EventsMixin);
        DX.validationEngine = {
            groups: [],
            getGroupConfig: function(group) {
                var result = $.grep(this.groups, function(config) {
                        return config.group === group
                    });
                if (result.length)
                    return result[0]
            },
            initGroups: function() {
                this.groups = [];
                this.addGroup()
            },
            addGroup: function(group) {
                var config = this.getGroupConfig(group);
                if (!config) {
                    config = new GroupConfig(group);
                    this.groups.push(config)
                }
                return config
            },
            removeGroup: function(group) {
                var config = this.getGroupConfig(group),
                    index = $.inArray(config, this.groups);
                if (index > -1)
                    this.groups.splice(index, 1);
                return config
            },
            _setDefaultMessage: function(rule, validator, name) {
                if (!commonUtils.isDefined(rule.message))
                    if (validator.defaultFormattedMessage && commonUtils.isDefined(name))
                        rule.message = validator.defaultFormattedMessage().replace(/\{0\}/, name);
                    else
                        rule.message = validator.defaultMessage()
            },
            validate: function validate(value, rules, name) {
                var result = {
                        name: name,
                        value: value,
                        brokenRule: null,
                        isValid: true,
                        validationRules: rules
                    },
                    that = this;
                $.each(rules || [], function(_, rule) {
                    var ruleValidator = rulesValidators[rule.type],
                        ruleValidationResult;
                    if (ruleValidator) {
                        if (commonUtils.isDefined(rule.isValid) && rule.value === value && !rule.reevaluate) {
                            if (!rule.isValid) {
                                result.isValid = false;
                                result.brokenRule = rule;
                                return false
                            }
                            return true
                        }
                        rule.value = value;
                        ruleValidationResult = ruleValidator.validate(value, rule);
                        rule.isValid = ruleValidationResult;
                        if (!ruleValidationResult) {
                            result.isValid = false;
                            that._setDefaultMessage(rule, ruleValidator, name);
                            result.brokenRule = rule
                        }
                        if (!rule.isValid)
                            return false
                    }
                    else
                        throw errors.Error("E0100");
                });
                return result
            },
            registerValidatorInGroup: function(group, validator) {
                var groupConfig = DX.validationEngine.addGroup(group);
                if ($.inArray(validator, groupConfig.validators) < 0)
                    groupConfig.validators.push(validator)
            },
            removeRegistredValidator: function(group, validator) {
                var config = DX.validationEngine.getGroupConfig(group),
                    validatorsInGroup = config && config.validators;
                var index = $.inArray(validator, validatorsInGroup);
                if (index > -1)
                    validatorsInGroup.splice(index, 1)
            },
            validateGroup: function(group) {
                var groupConfig = DX.validationEngine.getGroupConfig(group);
                if (!groupConfig)
                    throw errors.Error("E0110");
                return groupConfig.validate()
            },
            resetGroup: function(group) {
                var groupConfig = DX.validationEngine.getGroupConfig(group);
                if (!groupConfig)
                    throw errors.Error("E0110");
                return groupConfig.reset()
            }
        };
        DX.validationEngine.initGroups()
    })(jQuery, DevExpress);
    /*! Module core, file transitionExecutor.js */
    (function($, DX) {
        var Class = DevExpress.require("/class"),
            commonUtils = DX.require("/utils/utils.common"),
            Component = DX.require("/component"),
            devices = DX.require("/devices");
        var directionPostfixes = {
                forward: " dx-forward",
                backward: " dx-backward",
                none: " dx-no-direction",
                undefined: " dx-no-direction"
            },
            DX_ANIMATING_CLASS = "dx-animating";
        var TransitionExecutor = Class.inherit({
                ctor: function() {
                    this._accumulatedDelays = {
                        enter: 0,
                        leave: 0
                    };
                    this._animations = [];
                    this.reset()
                },
                _createAnimations: function($elements, initialConfig, configModifier, type) {
                    var that = this,
                        result = [],
                        animationConfig;
                    configModifier = configModifier || {};
                    animationConfig = this._prepareElementAnimationConfig(initialConfig, configModifier, type);
                    if (animationConfig)
                        $elements.each(function() {
                            var animation = that._createAnimation($(this), animationConfig, configModifier);
                            if (animation) {
                                animation.element.addClass(DX_ANIMATING_CLASS);
                                animation.setup();
                                result.push(animation)
                            }
                        });
                    return result
                },
                _prepareElementAnimationConfig: function(config, configModifier, type) {
                    var result;
                    if (typeof config === "string") {
                        var presetName = config;
                        config = DX.animationPresets.getPreset(presetName)
                    }
                    if (!config)
                        result = undefined;
                    else if ($.isFunction(config[type]))
                        result = config[type];
                    else {
                        result = $.extend({
                            skipElementInitialStyles: true,
                            cleanupWhen: this._completePromise
                        }, config, configModifier);
                        if (!result.type || result.type === "css") {
                            var cssClass = "dx-" + type,
                                extraCssClasses = (result.extraCssClasses ? " " + result.extraCssClasses : "") + directionPostfixes[result.direction];
                            result.type = "css";
                            result.from = (result.from || cssClass) + extraCssClasses;
                            result.to = result.to || cssClass + "-active"
                        }
                        result.staggerDelay = result.staggerDelay || 0;
                        result.delay = result.delay || 0;
                        if (result.staggerDelay) {
                            result.delay += this._accumulatedDelays[type];
                            this._accumulatedDelays[type] += result.staggerDelay
                        }
                    }
                    return result
                },
                _createAnimation: function($element, animationConfig, configModifier) {
                    var result;
                    if ($.isPlainObject(animationConfig))
                        result = DX.fx.createAnimation($element, animationConfig);
                    else if ($.isFunction(animationConfig))
                        result = animationConfig($element, configModifier);
                    return result
                },
                _startAnimations: function() {
                    var animations = this._animations;
                    for (var i = 0; i < animations.length; i++)
                        animations[i].start()
                },
                _stopAnimations: function() {
                    var animations = this._animations;
                    for (var i = 0; i < animations.length; i++)
                        animations[i].stop()
                },
                _clearAnimations: function() {
                    var animations = this._animations;
                    for (var i = 0; i < animations.length; i++)
                        animations[i].element.removeClass(DX_ANIMATING_CLASS);
                    this._animations.length = 0
                },
                reset: function() {
                    this._accumulatedDelays.enter = 0;
                    this._accumulatedDelays.leave = 0;
                    this._clearAnimations();
                    this._completeDeferred = $.Deferred();
                    this._completePromise = this._completeDeferred.promise()
                },
                enter: function($elements, animationConfig, configModifier) {
                    var animations = this._createAnimations($elements, animationConfig, configModifier, "enter");
                    this._animations.push.apply(this._animations, animations)
                },
                leave: function($elements, animationConfig, configModifier) {
                    var animations = this._createAnimations($elements, animationConfig, configModifier, "leave");
                    this._animations.push.apply(this._animations, animations)
                },
                start: function() {
                    var that = this,
                        result;
                    if (!this._animations.length) {
                        that.reset();
                        result = $.Deferred().resolve().promise()
                    }
                    else {
                        var animationDeferreds = $.map(this._animations, function(animation) {
                                var result = $.Deferred();
                                animation.deferred.always(function() {
                                    result.resolve()
                                });
                                return result.promise()
                            });
                        result = $.when.apply($, animationDeferreds).always(function() {
                            that._completeDeferred.resolve();
                            that.reset()
                        });
                        commonUtils.executeAsync(function() {
                            that._startAnimations()
                        })
                    }
                    return result
                },
                stop: function() {
                    this._stopAnimations()
                }
            });
        var optionPrefix = "preset_";
        var AnimationPresetCollection = Component.inherit({
                ctor: function() {
                    this.callBase.apply(this, arguments);
                    this._customRules = [];
                    this._registeredPresets = [];
                    this.resetToDefaults()
                },
                _getDefaultOptions: function() {
                    return $.extend(this.callBase(), {
                            defaultAnimationDuration: 400,
                            defaultAnimationDelay: 0,
                            defaultStaggerAnimationDuration: 300,
                            defaultStaggerAnimationDelay: 40,
                            defaultStaggerAnimationStartDelay: 500
                        })
                },
                _defaultOptionsRules: function() {
                    return this.callBase().concat([{
                                device: function(device) {
                                    return device.phone
                                },
                                options: {
                                    defaultStaggerAnimationDuration: 350,
                                    defaultStaggerAnimationDelay: 50,
                                    defaultStaggerAnimationStartDelay: 0
                                }
                            }, {
                                device: function() {
                                    return devices.current().android || devices.real.android
                                },
                                options: {defaultAnimationDelay: 100}
                            }])
                },
                _getPresetOptionName: function(animationName) {
                    return optionPrefix + animationName
                },
                _createAndroidSlideAnimationConfig: function(throughOpacity, widthMultiplier) {
                    var that = this;
                    return {
                            enter: function($element, configModifier) {
                                var width = $element.parent().width() * widthMultiplier,
                                    direction = configModifier.direction,
                                    config = {
                                        type: "slide",
                                        delay: that.option("defaultAnimationDelay"),
                                        duration: configModifier.duration === undefined ? that.option("defaultAnimationDuration") : configModifier.duration,
                                        to: {
                                            left: 0,
                                            opacity: 1
                                        }
                                    };
                                if (direction === "forward")
                                    config.from = {
                                        left: width,
                                        opacity: throughOpacity
                                    };
                                else if (direction === "backward")
                                    config.from = {
                                        left: -width,
                                        opacity: throughOpacity
                                    };
                                else
                                    config.from = {
                                        left: 0,
                                        opacity: 0
                                    };
                                return DX.fx.createAnimation($element, config)
                            },
                            leave: function($element, configModifier) {
                                var width = $element.parent().width() * widthMultiplier,
                                    direction = configModifier.direction,
                                    config = {
                                        type: "slide",
                                        delay: that.option("defaultAnimationDelay"),
                                        duration: configModifier.duration === undefined ? that.option("defaultAnimationDuration") : configModifier.duration,
                                        from: {
                                            left: 0,
                                            opacity: 1
                                        }
                                    };
                                if (direction === "forward")
                                    config.to = {
                                        left: -width,
                                        opacity: throughOpacity
                                    };
                                else if (direction === "backward")
                                    config.to = {
                                        left: width,
                                        opacity: throughOpacity
                                    };
                                else
                                    config.to = {
                                        left: 0,
                                        opacity: 0
                                    };
                                return DX.fx.createAnimation($element, config)
                            }
                        }
                },
                _createOpenDoorConfig: function() {
                    var that = this,
                        baseConfig = {
                            type: "css",
                            extraCssClasses: "dx-opendoor-animation",
                            duration: that.option("defaultAnimationDuration")
                        };
                    return {
                            enter: function($element, configModifier) {
                                var config = baseConfig,
                                    direction = configModifier.direction;
                                config.delay = direction === "none" ? that.option("defaultAnimationDelay") : that.option("defaultAnimationDuration");
                                config.from = "dx-enter dx-opendoor-animation" + directionPostfixes[direction];
                                config.to = "dx-enter-active";
                                return DX.fx.createAnimation($element, config)
                            },
                            leave: function($element, configModifier) {
                                var config = baseConfig,
                                    direction = configModifier.direction;
                                config.delay = that.option("defaultAnimationDelay");
                                config.from = "dx-leave dx-opendoor-animation" + directionPostfixes[direction];
                                config.to = "dx-leave-active";
                                return DX.fx.createAnimation($element, config)
                            }
                        }
                },
                resetToDefaults: function() {
                    this.clear();
                    this.registerDefaultPresets();
                    this.applyChanges()
                },
                clear: function(name) {
                    var that = this,
                        newRegisteredPresets = [];
                    $.each(this._registeredPresets, function(index, preset) {
                        if (!name || name === preset.name)
                            that.option(that._getPresetOptionName(preset.name), undefined);
                        else
                            newRegisteredPresets.push(preset)
                    });
                    this._registeredPresets = newRegisteredPresets;
                    this.applyChanges()
                },
                registerPreset: function(name, config) {
                    this._registeredPresets.push({
                        name: name,
                        config: config
                    })
                },
                applyChanges: function() {
                    var that = this;
                    this._customRules.length = 0;
                    $.each(this._registeredPresets, function(index, preset) {
                        var rule = {
                                device: preset.config.device,
                                options: {}
                            };
                        rule.options[that._getPresetOptionName(preset.name)] = preset.config.animation;
                        that._customRules.push(rule)
                    });
                    this._setOptionsByDevice()
                },
                getPreset: function(name) {
                    var result = name;
                    while (typeof result === "string")
                        result = this.option(this._getPresetOptionName(result));
                    return result
                },
                registerDefaultPresets: function() {
                    this.registerPreset("pop", {animation: {
                            extraCssClasses: "dx-android-pop-animation",
                            delay: this.option("defaultAnimationDelay"),
                            duration: this.option("defaultAnimationDuration")
                        }});
                    this.registerPreset("openDoor", {animation: this._createOpenDoorConfig()});
                    this.registerPreset("fade", {animation: {
                            extraCssClasses: "dx-fade-animation",
                            delay: this.option("defaultAnimationDelay"),
                            duration: this.option("defaultAnimationDuration")
                        }});
                    this.registerPreset("slide", {
                        device: function() {
                            return devices.current().android || devices.real.android
                        },
                        animation: this._createAndroidSlideAnimationConfig(1, 1)
                    });
                    this.registerPreset("slide", {
                        device: function() {
                            return !devices.current().android && !devices.real.android
                        },
                        animation: {
                            extraCssClasses: "dx-slide-animation",
                            delay: this.option("defaultAnimationDelay"),
                            duration: this.option("defaultAnimationDuration")
                        }
                    });
                    this.registerPreset("ios7-slide", {animation: {
                            extraCssClasses: "dx-ios7-slide-animation",
                            delay: this.option("defaultAnimationDelay"),
                            duration: this.option("defaultAnimationDuration")
                        }});
                    this.registerPreset("overflow", {animation: {
                            extraCssClasses: "dx-overflow-animation",
                            delay: this.option("defaultAnimationDelay"),
                            duration: this.option("defaultAnimationDuration")
                        }});
                    this.registerPreset("ios7-toolbar", {
                        device: function() {
                            return !devices.current().android && !devices.real.android
                        },
                        animation: {
                            extraCssClasses: "dx-ios7-toolbar-animation",
                            delay: this.option("defaultAnimationDelay"),
                            duration: this.option("defaultAnimationDuration")
                        }
                    });
                    this.registerPreset("ios7-toolbar", {
                        device: function() {
                            return devices.current().android || devices.real.android
                        },
                        animation: this._createAndroidSlideAnimationConfig(0, 0.4)
                    });
                    this.registerPreset("stagger-fade", {animation: {
                            extraCssClasses: "dx-fade-animation",
                            staggerDelay: this.option("defaultStaggerAnimationDelay"),
                            duration: this.option("defaultStaggerAnimationDuration"),
                            delay: this.option("defaultStaggerAnimationStartDelay")
                        }});
                    this.registerPreset("stagger-slide", {animation: {
                            extraCssClasses: "dx-slide-animation",
                            staggerDelay: this.option("defaultStaggerAnimationDelay"),
                            duration: this.option("defaultStaggerAnimationDuration"),
                            delay: this.option("defaultStaggerAnimationStartDelay")
                        }});
                    this.registerPreset("stagger-fade-slide", {animation: {
                            extraCssClasses: "dx-fade-slide-animation",
                            staggerDelay: this.option("defaultStaggerAnimationDelay"),
                            duration: this.option("defaultStaggerAnimationDuration"),
                            delay: this.option("defaultStaggerAnimationStartDelay")
                        }});
                    this.registerPreset("stagger-drop", {animation: {
                            extraCssClasses: "dx-drop-animation",
                            staggerDelay: this.option("defaultStaggerAnimationDelay"),
                            duration: this.option("defaultStaggerAnimationDuration"),
                            delay: this.option("defaultStaggerAnimationStartDelay")
                        }});
                    this.registerPreset("stagger-fade-drop", {animation: {
                            extraCssClasses: "dx-fade-drop-animation",
                            staggerDelay: this.option("defaultStaggerAnimationDelay"),
                            duration: this.option("defaultStaggerAnimationDuration"),
                            delay: this.option("defaultStaggerAnimationStartDelay")
                        }});
                    this.registerPreset("stagger-3d-drop", {animation: {
                            extraCssClasses: "dx-3d-drop-animation",
                            staggerDelay: this.option("defaultStaggerAnimationDelay"),
                            duration: this.option("defaultStaggerAnimationDuration"),
                            delay: this.option("defaultStaggerAnimationStartDelay")
                        }});
                    this.registerPreset("stagger-fade-zoom", {animation: {
                            extraCssClasses: "dx-fade-zoom-animation",
                            staggerDelay: this.option("defaultStaggerAnimationDelay"),
                            duration: this.option("defaultStaggerAnimationDuration"),
                            delay: this.option("defaultStaggerAnimationStartDelay")
                        }})
                }
            });
        DX.TransitionExecutor = TransitionExecutor;
        DX.AnimationPresetCollection = AnimationPresetCollection;
        DX.animationPresets = new AnimationPresetCollection
    })(jQuery, DevExpress);
    /*! Module core, file jquery.defaultTemplates.js */
    DevExpress.define("/integration/jquery/jquery.defaultTemplates", ["jquery", "/utils/utils.inflector", "/utils/utils.icon", "/utils/utils.date"], function($, inflector, iconUtils, dateUtils) {
        var camelize = inflector.camelize;
        var TEMPLATE_GENERATORS = {};
        var emptyTemplate = function() {
                return $()
            };
        var ITEM_CONTENT_PLACEHOLDER_CLASS = "dx-item-content-placeholder";
        TEMPLATE_GENERATORS.CollectionWidget = {
            item: function(itemData) {
                var $itemContent = $("<div>");
                if ($.isPlainObject(itemData)) {
                    if (itemData.text)
                        $itemContent.text(itemData.text);
                    if (itemData.html)
                        $itemContent.html(itemData.html)
                }
                else
                    $itemContent.text(String(itemData));
                return $itemContent
            },
            itemFrame: function(itemData) {
                var $itemFrame = $("<div>");
                $itemFrame.toggleClass("dx-state-invisible", itemData.visible !== undefined && !itemData.visible);
                $itemFrame.toggleClass("dx-state-disabled", !!itemData.disabled);
                var $placeholder = $("<div>").addClass(ITEM_CONTENT_PLACEHOLDER_CLASS);
                $itemFrame.append($placeholder);
                return $itemFrame
            }
        };
        var BUTTON_TEXT_CLASS = "dx-button-text";
        TEMPLATE_GENERATORS.dxButton = {content: function(itemData) {
                var $itemContent = $("<div>"),
                    $iconElement = iconUtils.getImageContainer(itemData.icon),
                    $textContainer = itemData.text ? $("<span>").text(itemData.text).addClass(BUTTON_TEXT_CLASS) : undefined;
                $itemContent.append($iconElement).append($textContainer);
                return $itemContent
            }};
        var LIST_ITEM_BADGE_CONTAINER_CLASS = "dx-list-item-badge-container",
            LIST_ITEM_BADGE_CLASS = "dx-list-item-badge",
            BADGE_CLASS = "dx-badge",
            LIST_ITEM_CHEVRON_CONTAINER_CLASS = "dx-list-item-chevron-container",
            LIST_ITEM_CHEVRON_CLASS = "dx-list-item-chevron";
        TEMPLATE_GENERATORS.dxList = {
            item: function(itemData) {
                var $itemContent = TEMPLATE_GENERATORS.CollectionWidget.item(itemData);
                if (itemData.key) {
                    var $key = $("<div>").text(itemData.key);
                    $key.appendTo($itemContent)
                }
                return $itemContent
            },
            itemFrame: function(itemData) {
                var $itemFrame = TEMPLATE_GENERATORS.CollectionWidget.itemFrame(itemData);
                if (itemData.badge) {
                    var $badgeContainer = $("<div>").addClass(LIST_ITEM_BADGE_CONTAINER_CLASS),
                        $badge = $("<div>").addClass(LIST_ITEM_BADGE_CLASS).addClass(BADGE_CLASS);
                    $badge.text(itemData.badge);
                    $badgeContainer.append($badge).appendTo($itemFrame)
                }
                if (itemData.showChevron) {
                    var $chevronContainer = $("<div>").addClass(LIST_ITEM_CHEVRON_CONTAINER_CLASS),
                        $chevron = $("<div>").addClass(LIST_ITEM_CHEVRON_CLASS);
                    $chevronContainer.append($chevron).appendTo($itemFrame)
                }
                return $itemFrame
            },
            group: function(groupData) {
                var $groupContent = $("<div>");
                if ($.isPlainObject(groupData)) {
                    if (groupData.key)
                        $groupContent.text(groupData.key)
                }
                else
                    $groupContent.html(String(groupData));
                return $groupContent
            }
        };
        TEMPLATE_GENERATORS.dxDropDownMenu = {
            item: TEMPLATE_GENERATORS.dxList.item,
            content: TEMPLATE_GENERATORS.dxButton.content
        };
        TEMPLATE_GENERATORS.dxDropDownList = {item: TEMPLATE_GENERATORS.dxList.item};
        TEMPLATE_GENERATORS.dxRadioGroup = {item: TEMPLATE_GENERATORS.CollectionWidget.item};
        TEMPLATE_GENERATORS.dxScheduler = {
            item: function(itemData) {
                var $itemContent = TEMPLATE_GENERATORS.CollectionWidget.item(itemData);
                var $details = $("<div>").addClass("dx-scheduler-appointment-content-details");
                if (itemData.startDate)
                    $("<div>").text(Globalize.format(dateUtils.makeDate(itemData.startDate), "t")).addClass("dx-scheduler-appointment-content-date").appendTo($details);
                if (itemData.endDate) {
                    $("<div>").text(" - ").addClass("dx-scheduler-appointment-content-date").appendTo($details);
                    $("<div>").text(Globalize.format(dateUtils.makeDate(itemData.endDate), "t")).addClass("dx-scheduler-appointment-content-date").appendTo($details)
                }
                $details.appendTo($itemContent);
                if (itemData.recurrenceRule)
                    $("<span>").addClass("dx-scheduler-appointment-recurrence-icon dx-icon-repeat").appendTo($itemContent);
                return $itemContent
            },
            appointmentTooltip: emptyTemplate,
            appointmentPopup: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxOverlay = {content: emptyTemplate};
        TEMPLATE_GENERATORS.dxSlideOutView = {
            menu: emptyTemplate,
            content: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxSlideOut = {
            menuItem: TEMPLATE_GENERATORS.dxList.item,
            menuGroup: TEMPLATE_GENERATORS.dxList.group,
            content: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxAccordion = {
            title: function(titleData) {
                var $titleContent = $("<div>"),
                    icon = titleData.icon,
                    iconSrc = titleData.iconSrc,
                    $iconElement = iconUtils.getImageContainer(icon || iconSrc);
                if ($.isPlainObject(titleData)) {
                    if (titleData.title)
                        $titleContent.text(titleData.title)
                }
                else
                    $titleContent.html(String(titleData));
                $iconElement && $iconElement.prependTo($titleContent);
                return $titleContent
            },
            item: TEMPLATE_GENERATORS.CollectionWidget.item
        };
        TEMPLATE_GENERATORS.dxActionSheet = {item: function(itemData) {
                return $("<div>").append($("<div>").dxButton($.extend({onClick: itemData.click}, itemData)))
            }};
        var GALLERY_IMAGE_CLASS = "dx-gallery-item-image";
        TEMPLATE_GENERATORS.dxGallery = {item: function(itemData) {
                var $itemContent = $("<div>"),
                    $img = $('<img>').addClass(GALLERY_IMAGE_CLASS);
                if ($.isPlainObject(itemData))
                    $img.attr({
                        src: itemData.imageSrc,
                        alt: itemData.imageAlt
                    }).appendTo($itemContent);
                else
                    $img.attr('src', String(itemData)).appendTo($itemContent);
                return $itemContent
            }};
        var DX_MENU_ITEM_CAPTION_CLASS = 'dx-menu-item-text',
            DX_MENU_ITEM_POPOUT_CLASS = 'dx-menu-item-popout',
            DX_MENU_ITEM_POPOUT_CONTAINER_CLASS = 'dx-menu-item-popout-container';
        TEMPLATE_GENERATORS.dxMenuBase = {item: function(itemData) {
                var $itemContent = $("<div>"),
                    icon = itemData.icon,
                    iconSrc = itemData.iconSrc,
                    $iconElement = iconUtils.getImageContainer(icon || iconSrc);
                $iconElement && $iconElement.appendTo($itemContent);
                var $itemCaption;
                if ($.isPlainObject(itemData) && itemData.text)
                    $itemCaption = $('<span>').addClass(DX_MENU_ITEM_CAPTION_CLASS).text(itemData.text);
                else if (!$.isPlainObject(itemData))
                    $itemCaption = $('<span>').addClass(DX_MENU_ITEM_CAPTION_CLASS).html(String(itemData));
                $itemContent.append($itemCaption);
                var $popOutImage,
                    $popOutContainer;
                if (itemData.items && itemData.items.length > 0) {
                    $popOutContainer = $('<span>').addClass(DX_MENU_ITEM_POPOUT_CONTAINER_CLASS).appendTo($itemContent);
                    $popOutImage = $('<div>').addClass(DX_MENU_ITEM_POPOUT_CLASS).appendTo($popOutContainer)
                }
                return $itemContent
            }};
        var PANORAMA_ITEM_TITLE_CLASS = "dx-panorama-item-title";
        TEMPLATE_GENERATORS.dxPanorama = {itemFrame: function(itemData) {
                var $itemContent = TEMPLATE_GENERATORS.CollectionWidget.itemFrame(itemData);
                if (itemData.title) {
                    var $itemHeader = $("<div>").addClass(PANORAMA_ITEM_TITLE_CLASS).text(itemData.title);
                    $itemContent.prepend($itemHeader)
                }
                return $itemContent
            }};
        TEMPLATE_GENERATORS.dxPivotTabs = {item: function(itemData) {
                var $itemContent = $("<div>");
                var $itemText;
                if (itemData && itemData.title)
                    $itemText = $("<span>").text(itemData.title);
                else
                    $itemText = $("<span>").text(String(itemData));
                $itemContent.html($itemText);
                return $itemContent
            }};
        TEMPLATE_GENERATORS.dxPivot = {
            title: TEMPLATE_GENERATORS.dxPivotTabs.item,
            content: emptyTemplate
        };
        var TABS_ITEM_TEXT_CLASS = "dx-tab-text";
        TEMPLATE_GENERATORS.dxTabs = {
            item: function(itemData) {
                var $itemContent = TEMPLATE_GENERATORS.CollectionWidget.item(itemData);
                if (itemData.html)
                    return $itemContent;
                var icon = itemData.icon,
                    iconSrc = itemData.iconSrc,
                    $iconElement = iconUtils.getImageContainer(icon || iconSrc);
                if (!itemData.html)
                    $itemContent.wrapInner($("<span>").addClass(TABS_ITEM_TEXT_CLASS));
                $iconElement && $iconElement.prependTo($itemContent);
                return $itemContent
            },
            itemFrame: function(itemData) {
                var $badge = $(),
                    $itemFrame = TEMPLATE_GENERATORS.CollectionWidget.itemFrame(itemData);
                if (itemData.badge)
                    $badge = $("<div>", {"class": "dx-tabs-item-badge dx-badge"}).text(itemData.badge);
                $itemFrame.append($badge);
                return $itemFrame
            }
        };
        TEMPLATE_GENERATORS.dxTabPanel = {
            item: TEMPLATE_GENERATORS.CollectionWidget.item,
            title: function(itemData) {
                var itemTitleData = itemData;
                if ($.isPlainObject(itemData))
                    itemTitleData = $.extend({}, itemData, {
                        text: itemData.title,
                        html: null
                    });
                var $title = TEMPLATE_GENERATORS.dxTabs.item(itemTitleData);
                return $title
            }
        };
        var NAVBAR_ITEM_BADGE_CLASS = "dx-navbar-item-badge";
        TEMPLATE_GENERATORS.dxNavBar = {itemFrame: function(itemData) {
                var $itemFrame = TEMPLATE_GENERATORS.CollectionWidget.itemFrame(itemData);
                if (itemData.badge) {
                    var $badge = $("<div>").addClass(NAVBAR_ITEM_BADGE_CLASS).addClass(BADGE_CLASS);
                    $badge.text(itemData.badge);
                    $badge.appendTo($itemFrame)
                }
                return $itemFrame
            }};
        TEMPLATE_GENERATORS.dxToolbar = {
            item: function(itemData) {
                var $itemContent = TEMPLATE_GENERATORS.CollectionWidget.item(itemData);
                var widget = itemData.widget;
                if (widget) {
                    var widgetElement = $("<div>").appendTo($itemContent),
                        widgetName = camelize("dx-" + widget),
                        options = itemData.options || {};
                    widgetElement[widgetName](options)
                }
                else if (itemData.text)
                    $itemContent.wrapInner("<div>");
                return $itemContent
            },
            menuItem: TEMPLATE_GENERATORS.dxList.item,
            actionSheetItem: TEMPLATE_GENERATORS.dxActionSheet.item
        };
        TEMPLATE_GENERATORS.dxTreeView = {item: function(itemData) {
                var $itemContent = $("<div>"),
                    icon = itemData.icon,
                    iconSrc = itemData.iconSrc,
                    $iconElement = iconUtils.getImageContainer(icon || iconSrc);
                if (itemData.html)
                    $itemContent.html(itemData.html);
                else {
                    $iconElement && $iconElement.appendTo($itemContent);
                    $("<span>").text(itemData.text).appendTo($itemContent)
                }
                return $itemContent
            }};
        var popupTitleAndBottom = function(itemData) {
                return $("<div>").append($("<div>").dxToolbar({items: itemData}))
            };
        TEMPLATE_GENERATORS.dxPopup = {
            title: popupTitleAndBottom,
            bottom: popupTitleAndBottom
        };
        TEMPLATE_GENERATORS.dxLookup = {
            title: TEMPLATE_GENERATORS.dxPopup.title,
            group: TEMPLATE_GENERATORS.dxList.group
        };
        TEMPLATE_GENERATORS.dxTagBox = {tag: function(itemData) {
                return $("<div>").append($("<span>").text(itemData))
            }};
        TEMPLATE_GENERATORS.dxCalendar = {cell: function(itemData) {
                return $("<div>").append($("<span>").text(itemData.text || String(itemData)))
            }};
        return TEMPLATE_GENERATORS
    });
    /*! Module core, file jquery.template.js */
    DevExpress.define("/integration/jquery/jquery.template", ["jquery", "/ui/templates/ui.templateBase", "/errors", "/utils/utils.common", "/utils/utils.dom"], function($, TemplateBase, errors, commonUtils, domUtils) {
        var templateEngines = {};
        var registerTemplateEngine = function(name, templateEngine) {
                templateEngines[name] = templateEngine
            };
        var outerHtml = function(element) {
                element = $(element);
                if (!element.length || element[0].nodeName.toLowerCase() !== "script")
                    element = $("<div>").append(element);
                return element.html()
            };
        registerTemplateEngine("default", {
            compile: function(element) {
                return domUtils.normalizeTemplateElement(element)
            },
            render: function(template, data) {
                return template.clone()
            }
        });
        registerTemplateEngine("jquery-tmpl", {
            compile: function(element) {
                return $("<div>").append(domUtils.normalizeTemplateElement(element))
            },
            render: function(template, data) {
                return template.tmpl(data)
            }
        });
        registerTemplateEngine("jsrender", {
            compile: function(element) {
                return $.templates(outerHtml(element))
            },
            render: function(template, data) {
                return template.render(data)
            }
        });
        registerTemplateEngine("mustache", {
            compile: function(element) {
                return Mustache.compile(outerHtml(element))
            },
            render: function(template, data) {
                return template(data)
            }
        });
        registerTemplateEngine("hogan", {
            compile: function(element) {
                return Hogan.compile(outerHtml(element))
            },
            render: function(template, data) {
                return template.render(data)
            }
        });
        registerTemplateEngine("underscore", {
            compile: function(element) {
                return _.template(outerHtml(element))
            },
            render: function(template, data) {
                return template(data)
            }
        });
        registerTemplateEngine("handlebars", {
            compile: function(element) {
                return Handlebars.compile(outerHtml(element))
            },
            render: function(template, data) {
                return template(data)
            }
        });
        registerTemplateEngine("doT", {
            compile: function(element) {
                return doT.template(outerHtml(element))
            },
            render: function(template, data) {
                return template(data)
            }
        });
        var currentTemplateEngine;
        var setTemplateEngine = function(templateEngine) {
                if (commonUtils.isString(templateEngine)) {
                    currentTemplateEngine = templateEngines[templateEngine];
                    if (!currentTemplateEngine)
                        throw errors.Error("E0020", templateEngine);
                }
                else
                    currentTemplateEngine = templateEngine
            };
        setTemplateEngine("default");
        var Template = TemplateBase.inherit({
                ctor: function(element, owner) {
                    this.callBase(element, owner);
                    this._compiledTemplate = currentTemplateEngine.compile(element)
                },
                _renderCore: function(data) {
                    return $("<div>").append(currentTemplateEngine.render(this._compiledTemplate, data)).contents()
                }
            });
        Template.setTemplateEngine = setTemplateEngine;
        return Template
    });
    /*! Module core, file jquery.templateProvider.js */
    DevExpress.define("/integration/jquery/jquery.templateProvider", ["jquery", "/ui/templates/ui.templateProviderBase", "/integration/jquery/jquery.template", "/ui/templates/ui.template.function", "/integration/jquery/jquery.defaultTemplates"], function($, TemplateProviderBase, Template, FunctionTempalte, defaultTemplates) {
        var TemplateProvider = TemplateProviderBase.inherit({
                createTemplate: function(element, owner) {
                    return new Template(element, owner)
                },
                _templatesForWidget: function(widgetName) {
                    var templateGenerators = defaultTemplates[widgetName] || {},
                        templates = {};
                    $.each(templateGenerators, function(name, generator) {
                        templates[name] = new FunctionTempalte(function() {
                            var $markup = generator.apply(this, arguments);
                            if (name !== "itemFrame")
                                $markup = $markup.contents();
                            return $markup
                        }, templateProvider)
                    });
                    return templates
                }
            });
        var templateProvider = new TemplateProvider;
        return templateProvider
    });
    /*! Module core, file jquery.selectors.js */
    DevExpress.define("/integration/jquery/jquery.selectors", ["jquery"], function($) {
        var focusable = function(element, tabIndex) {
                var nodeName = element.nodeName.toLowerCase(),
                    isTabIndexNotNaN = !isNaN(tabIndex),
                    isVisible = visible(element),
                    isDisabled = element.disabled,
                    isDefaultFocus = /^(input|select|textarea|button|object|iframe)$/.test(nodeName),
                    isHyperlink = nodeName === "a",
                    isFocusable = true;
                if (isDefaultFocus)
                    isFocusable = !isDisabled;
                else if (isHyperlink)
                    isFocusable = element.href || isTabIndexNotNaN;
                else
                    isFocusable = isTabIndexNotNaN;
                return isVisible ? isFocusable : false
            };
        var visible = function(element) {
                var $element = $(element);
                return $element.is(":visible") && $element.css("visibility") !== "hidden" && $element.parents().css("visibility") !== "hidden"
            };
        var icontains = function(elem, text) {
                var result = false;
                $.each($(elem).contents(), function(index, content) {
                    if (content.nodeType === 3 && (content.textContent || content.nodeValue || "").toLowerCase().indexOf((text || "").toLowerCase()) > -1) {
                        result = true;
                        return false
                    }
                });
                return result
            };
        $.extend($.expr[':'], {
            "dx-focusable": function(element) {
                return focusable(element, $.attr(element, "tabindex"))
            },
            "dx-tabbable": function(element) {
                var tabIndex = $.attr(element, "tabindex");
                return (isNaN(tabIndex) || tabIndex >= 0) && focusable(element, tabIndex)
            },
            "dx-icontains": $.expr.createPseudo(function(text) {
                return function(elem) {
                        return icontains(elem, text)
                    }
            })
        });
        return {
                focusable: ":dx-focusable",
                tabbable: ":dx-tabbable",
                icontains: ":dx-icontains"
            }
    });
    /*! Module core, file ko.componentRegistrator.js */
    DevExpress.define("/integration/knockout/ko.componentRegistrator", ["jquery", "/componentRegistrator", "/errors", "/ui/ui.widget", "/integration/knockout/ko.templateProvider", "/ui/ui.editor"], function($, registerComponent, errors, Widget, KoTemplateProvider, Editor) {
        var ko = window.ko;
        var LOCKS_DATA_KEY = "dxKoLocks",
            CREATED_WITH_KO_DATA_KEY = "dxKoCreation";
        var Locks = function() {
                var info = {};
                var currentCount = function(lockName) {
                        return info[lockName] || 0
                    };
                return {
                        obtain: function(lockName) {
                            info[lockName] = currentCount(lockName) + 1
                        },
                        release: function(lockName) {
                            var count = currentCount(lockName);
                            if (count < 1)
                                throw errors.Error("E0014");
                            if (count === 1)
                                delete info[lockName];
                            else
                                info[lockName] = count - 1
                        },
                        locked: function(lockName) {
                            return currentCount(lockName) > 0
                        }
                    }
            };
        var editorsBingindHandlers = [];
        var registerComponentKoBinding = function(componentName, componentClass) {
                if (componentClass.subclassOf(Editor))
                    editorsBingindHandlers.push(componentName);
                ko.bindingHandlers[componentName] = {init: function(domNode, valueAccessor) {
                        var $element = $(domNode),
                            optionChangedCallbacks = $.Callbacks(),
                            ctorOptions = {
                                templateProvider: KoTemplateProvider,
                                modelByElement: function($element) {
                                    if ($element.length)
                                        return ko.dataFor($element.get(0))
                                },
                                nestedComponentOptions: function(component) {
                                    return {
                                            modelByElement: component.option("modelByElement"),
                                            nestedComponentOptions: component.option("nestedComponentOptions")
                                        }
                                },
                                _optionChangedCallbacks: optionChangedCallbacks
                            },
                            optionNameToModelMap = {};
                        var applyModelValueToOption = function(optionName, modelValue) {
                                var component = $element.data(componentName),
                                    locks = $element.data(LOCKS_DATA_KEY),
                                    optionValue = ko.unwrap(modelValue);
                                if (ko.isWriteableObservable(modelValue))
                                    optionNameToModelMap[optionName] = modelValue;
                                if (component) {
                                    if (locks.locked(optionName))
                                        return;
                                    locks.obtain(optionName);
                                    try {
                                        component.option(optionName, optionValue)
                                    }
                                    finally {
                                        locks.release(optionName)
                                    }
                                }
                                else
                                    ctorOptions[optionName] = optionValue
                            };
                        var handleOptionChanged = function(args) {
                                var optionName = args.fullName,
                                    optionValue = args.value;
                                if (!(optionName in optionNameToModelMap))
                                    return;
                                var $element = this._$element,
                                    locks = $element.data(LOCKS_DATA_KEY);
                                if (locks.locked(optionName))
                                    return;
                                locks.obtain(optionName);
                                try {
                                    optionNameToModelMap[optionName](optionValue)
                                }
                                finally {
                                    locks.release(optionName)
                                }
                            };
                        var createComponent = function() {
                                optionChangedCallbacks.add(handleOptionChanged);
                                $element.data(CREATED_WITH_KO_DATA_KEY, true).data(LOCKS_DATA_KEY, new Locks)[componentName](ctorOptions);
                                ctorOptions = null
                            };
                        var unwrapModelValue = function(currentModel, propertyName, propertyPath) {
                                var unwrappedPropertyValue;
                                ko.computed(function() {
                                    var propertyValue = currentModel[propertyName];
                                    applyModelValueToOption(propertyPath, propertyValue);
                                    unwrappedPropertyValue = ko.unwrap(propertyValue)
                                }, null, {disposeWhenNodeIsRemoved: domNode});
                                if ($.isPlainObject(unwrappedPropertyValue))
                                    unwrapModel(unwrappedPropertyValue, propertyPath)
                            };
                        var unwrapModel = function(model, propertyPath) {
                                for (var propertyName in model)
                                    if (model.hasOwnProperty(propertyName))
                                        unwrapModelValue(model, propertyName, propertyPath ? [propertyPath, propertyName].join(".") : propertyName)
                            };
                        ko.computed(function() {
                            var component = $element.data(componentName),
                                model = ko.unwrap(valueAccessor());
                            if (component)
                                component.beginUpdate();
                            unwrapModel(model);
                            if (component)
                                component.endUpdate();
                            else
                                createComponent()
                        }, null, {disposeWhenNodeIsRemoved: domNode});
                        return {controlsDescendantBindings: componentClass.subclassOf(Widget)}
                    }};
                if (componentName === "dxValidator")
                    ko.bindingHandlers["dxValidator"].after = editorsBingindHandlers
            };
        registerComponent.callbacks.add(function(name, componentClass) {
            registerComponentKoBinding(name, componentClass)
        })
    });
    /*! Module core, file ko.components.js */
    DevExpress.define("/integration/knockout/ko.components", ["/utils/utils.icon", "/utils/utils.inflector", "/action"], function(iconUtils, inflector, Action) {
        var ko = window.ko;
        ko.bindingHandlers.dxAction = {update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
                var $element = $(element);
                var unwrappedValue = ko.utils.unwrapObservable(valueAccessor()),
                    actionSource = unwrappedValue,
                    actionOptions = {context: element};
                if (unwrappedValue.execute) {
                    actionSource = unwrappedValue.execute;
                    $.extend(actionOptions, unwrappedValue)
                }
                var action = new Action(actionSource, actionOptions);
                $element.off(".dxActionBinding").on("dxclick.dxActionBinding", function(e) {
                    action.execute({
                        element: $element,
                        model: viewModel,
                        evaluate: function(expression) {
                            var context = viewModel;
                            if (expression.length > 0 && expression[0] === "$")
                                context = ko.contextFor(element);
                            var getter = DevExpress.data.utils.compileGetter(expression);
                            return getter(context)
                        },
                        jQueryEvent: e
                    });
                    if (!actionOptions.bubbling)
                        e.stopPropagation()
                })
            }};
        ko.bindingHandlers.dxControlsDescendantBindings = {init: function(_, valueAccessor) {
                return {controlsDescendantBindings: ko.unwrap(valueAccessor())}
            }};
        ko.bindingHandlers.dxPolymorphWidget = {init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
                var widgetName = ko.utils.unwrapObservable(valueAccessor()).name;
                if (!widgetName)
                    return;
                ko.virtualElements.emptyNode(element);
                var markup = $("<div data-bind=\"" + inflector.camelize("dx-" + widgetName) + ": options\">").get(0);
                ko.virtualElements.prepend(element, markup);
                var innerBindingContext = bindingContext.extend(valueAccessor);
                ko.applyBindingsToDescendants(innerBindingContext, element);
                return {controlsDescendantBindings: true}
            }};
        ko.virtualElements.allowedBindings.dxPolymorphWidget = true;
        ko.bindingHandlers.dxIcon = {
            init: function(element, valueAccessor) {
                var options = ko.utils.unwrapObservable(valueAccessor()) || {},
                    iconElement = iconUtils.getImageContainer(options);
                ko.virtualElements.emptyNode(element);
                if (iconElement)
                    ko.virtualElements.prepend(element, iconElement.get(0))
            },
            update: function(element, valueAccessor) {
                var options = ko.utils.unwrapObservable(valueAccessor()) || {},
                    iconElement = iconUtils.getImageContainer(options);
                ko.virtualElements.emptyNode(element);
                if (iconElement)
                    ko.virtualElements.prepend(element, iconElement.get(0))
            }
        };
        ko.virtualElements.allowedBindings.dxIcon = true
    });
    /*! Module core, file ko.defaultTemplates.js */
    DevExpress.define("/integration/knockout/ko.defaultTemplates", ["jquery"], function($) {
        var TEMPLATE_GENERATORS = {};
        var createElementWithBindAttr = function(tagName, bindings, closeTag, additionalProperties) {
                closeTag = closeTag === undefined ? true : closeTag;
                var bindAttr = $.map(bindings, function(value, key) {
                        return key + ":" + value
                    }).join(",");
                additionalProperties = additionalProperties || "";
                return "<" + tagName + " data-bind=\"" + bindAttr + "\" " + additionalProperties + ">" + (closeTag ? "</" + tagName + ">" : "")
            };
        var defaultKoTemplateBasicBindings = {css: "{ 'dx-state-disabled': $data.disabled, 'dx-state-invisible': !($data.visible === undefined || ko.unwrap($data.visible)) }"};
        var emptyTemplate = function() {
                return ""
            };
        TEMPLATE_GENERATORS.CollectionWidget = {
            itemFrame: function() {
                var markup = [createElementWithBindAttr("div", defaultKoTemplateBasicBindings, false), "<div class='dx-item-content-placeholder'></div>", "</div>"];
                return markup.join("")
            },
            item: function() {
                var htmlBinding = createElementWithBindAttr("div", {html: "html"}),
                    textBinding = createElementWithBindAttr("div", {text: "text"}),
                    primitiveBinding = createElementWithBindAttr("div", {text: "String($data)"});
                var markup = ["<div>", "<!-- ko if: $data.html -->", htmlBinding, "<!-- /ko -->", "<!-- ko if: !$data.html && $data.text -->", textBinding, "<!-- /ko -->", "<!-- ko ifnot: $.isPlainObject($data) -->", primitiveBinding, "<!-- /ko -->", "</div>"];
                return markup.join("")
            }
        };
        var BUTTON_TEXT_CLASS = "dx-button-text";
        TEMPLATE_GENERATORS.dxButton = {content: function() {
                var textBinding = createElementWithBindAttr("span", {
                        text: "$data.text",
                        css: "{ '" + BUTTON_TEXT_CLASS + "' : !!$data.text }"
                    });
                var markup = ["<div>", "<!-- ko dxIcon: $data.icon || $data.iconSrc --><!-- /ko -->", textBinding, "</div>"];
                return markup.join("")
            }};
        var LIST_ITEM_BADGE_CONTAINER_CLASS = "dx-list-item-badge-container",
            LIST_ITEM_BADGE_CLASS = "dx-list-item-badge",
            BADGE_CLASS = "dx-badge",
            LIST_ITEM_CHEVRON_CONTAINER_CLASS = "dx-list-item-chevron-container",
            LIST_ITEM_CHEVRON_CLASS = "dx-list-item-chevron";
        TEMPLATE_GENERATORS.dxList = {
            item: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.item(),
                    keyBinding = createElementWithBindAttr("div", {text: "key"});
                template = [template.substring(0, template.length - 6), "<!-- ko if: $data.key -->" + keyBinding + "<!-- /ko -->", "</div>"];
                return template.join("")
            },
            itemFrame: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.itemFrame(),
                    badgeBinding = createElementWithBindAttr("div", {text: "badge"}, true, 'class="' + LIST_ITEM_BADGE_CLASS + " " + BADGE_CLASS + '"');
                var markup = [template.substring(0, template.length - 6), "<!-- ko if: $data.badge -->", "<div class=\"" + LIST_ITEM_BADGE_CONTAINER_CLASS + "\">", badgeBinding, "</div>", "<!-- /ko -->", "<!-- ko if: $data.showChevron -->", "<div class=\"" + LIST_ITEM_CHEVRON_CONTAINER_CLASS + "\">", "<div class=\"" + LIST_ITEM_CHEVRON_CLASS + "\"></div>", "</div>", "<!-- /ko -->", "</div>"];
                return markup.join("")
            },
            group: function() {
                var keyBinding = createElementWithBindAttr("div", {text: "key"}),
                    primitiveBinding = createElementWithBindAttr("div", {text: "String($data)"});
                var markup = ["<div>", "<!-- ko if: $data.key -->", keyBinding, "<!-- /ko -->", "<!-- ko ifnot: $.isPlainObject($data) -->", primitiveBinding, "<!-- /ko -->", "</div>"];
                return markup.join("")
            }
        };
        TEMPLATE_GENERATORS.dxDropDownMenu = {
            item: TEMPLATE_GENERATORS.dxList.item,
            content: TEMPLATE_GENERATORS.dxButton.content
        };
        TEMPLATE_GENERATORS.dxDropDownList = {item: TEMPLATE_GENERATORS.dxList.item};
        TEMPLATE_GENERATORS.dxRadioGroup = {item: TEMPLATE_GENERATORS.CollectionWidget.item};
        TEMPLATE_GENERATORS.dxScheduler = {
            item: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.item(),
                    startDateBinding = createElementWithBindAttr("div class='dx-scheduler-appointment-content-date'", {text: "Globalize.format(DevExpress.utils.makeDate($data.startDate), 't')"}),
                    endDateBinding = createElementWithBindAttr("div class='dx-scheduler-appointment-content-date'", {text: "Globalize.format(DevExpress.utils.makeDate($data.endDate), 't')"}),
                    dash = createElementWithBindAttr("div class='dx-scheduler-appointment-content-date'", {text: "' - '"});
                template = [template.substring(0, template.length - 6), "<div class='dx-scheduler-appointment-content-details'>", "<!-- ko if: $data.startDate -->" + startDateBinding + "<!-- /ko -->", "<!-- ko if: $data.endDate -->" + dash + "<!-- /ko -->", "<!-- ko if: $data.endDate -->" + endDateBinding + "<!-- /ko -->", "</div>", "<!-- ko if: $data.recurrenceRule --><span class='dx-scheduler-appointment-recurrence-icon dx-icon-repeat'></span><!-- /ko -->", "</div>"];
                return template.join("")
            },
            appointmentTooltip: emptyTemplate,
            appointmentPopup: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxOverlay = {content: emptyTemplate};
        TEMPLATE_GENERATORS.dxSlideOutView = {
            menu: emptyTemplate,
            content: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxSlideOut = {
            menuItem: TEMPLATE_GENERATORS.dxList.item,
            menuGroup: TEMPLATE_GENERATORS.dxList.group,
            content: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxAccordion = {
            title: function() {
                var titleBinding = createElementWithBindAttr("span", {text: "$.isPlainObject($data) ? $data.title : String($data)"});
                var markup = ["<div>", "<!-- ko dxIcon: $data.icon || $data.iconSrc --><!-- /ko -->", titleBinding, "</div>"];
                return markup.join("")
            },
            item: TEMPLATE_GENERATORS.CollectionWidget.item
        };
        TEMPLATE_GENERATORS.dxResponsiveBox = {item: TEMPLATE_GENERATORS.CollectionWidget.item},
        TEMPLATE_GENERATORS.dxPivotTabs = {item: function() {
                var titleBinding = createElementWithBindAttr("span", {text: "title"}),
                    primitiveBinding = createElementWithBindAttr("div", {text: "String($data)"});
                var markup = ["<div>", "<!-- ko if: $data.title -->", titleBinding, "<!-- /ko -->", "<!-- ko ifnot: $data.title || $.isPlainObject($data) -->", primitiveBinding, "<!-- /ko -->", "</div>"];
                return markup.join("")
            }};
        TEMPLATE_GENERATORS.dxPivot = {
            title: TEMPLATE_GENERATORS.dxPivotTabs.item,
            content: emptyTemplate
        };
        var PANORAMA_ITEM_TITLE_CLASS = "dx-panorama-item-title";
        TEMPLATE_GENERATORS.dxPanorama = {itemFrame: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.itemFrame(),
                    headerBinding = createElementWithBindAttr("div", {text: "title"}, true, 'class="' + PANORAMA_ITEM_TITLE_CLASS + '"');
                var divInnerStart = template.indexOf(">") + 1;
                template = [template.substring(0, divInnerStart), "<!-- ko if: $data.title -->", headerBinding, "<!-- /ko -->", template.substring(divInnerStart, template.length)];
                return template.join("")
            }};
        TEMPLATE_GENERATORS.dxActionSheet = {item: function() {
                return ["<div>", createElementWithBindAttr("div", {dxButton: "{ text: $data.text, onClick: $data.clickAction || $data.onClick, type: $data.type, disabled: !!ko.unwrap($data.disabled) }"}), "</div>"].join("")
            }};
        TEMPLATE_GENERATORS.dxToolbar = {
            item: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.item();
                template = [template.substring(0, template.length - 6), "<!-- ko if: $data.widget -->"];
                template.push("<!-- ko dxPolymorphWidget: { name: $data.widget, options: $data.options } --><!-- /ko -->");
                template.push("<!-- /ko -->");
                return template.join("")
            },
            menuItem: TEMPLATE_GENERATORS.dxList.item,
            actionSheetItem: TEMPLATE_GENERATORS.dxActionSheet.item
        };
        var GALLERY_IMAGE_CLASS = "dx-gallery-item-image";
        TEMPLATE_GENERATORS.dxGallery = {item: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.item(),
                    primitiveBinding = createElementWithBindAttr("div", {text: "String($data)"}),
                    imgBinding = createElementWithBindAttr("img", {attr: "{ src: String($data) }"}, false, 'class="' + GALLERY_IMAGE_CLASS + '"');
                template = [template.substring(0, template.length - 6).replace(primitiveBinding, imgBinding), "<!-- ko if: $data.imageSrc -->", createElementWithBindAttr("img", {attr: "{ src: $data.imageSrc, alt: $data.imageAlt }"}, false, 'class="' + GALLERY_IMAGE_CLASS + '"'), "<!-- /ko -->"].join("");
                return template
            }};
        TEMPLATE_GENERATORS.dxTabs = {
            item: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.item(),
                    basePrimitiveBinding = createElementWithBindAttr("div", {text: "String($data)"}),
                    primitiveBinding = "<span class=\"dx-tab-text\" data-bind=\"text: String($data)\"></span>",
                    baseTextBinding = createElementWithBindAttr("div", {text: "text"}),
                    textBinding = "<!-- ko dxIcon: $data.icon || $data.iconSrc --><!-- /ko -->" + "<span class=\"dx-tab-text\" data-bind=\"text: $data.text\"></span>";
                template = template.replace("<!-- ko if: !$data.html && $data.text -->", "<!-- ko if: !$data.html && ($data.text || $data.icon || $data.iconSrc) -->").replace(basePrimitiveBinding, primitiveBinding).replace(baseTextBinding, textBinding);
                return template
            },
            itemFrame: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.itemFrame(),
                    badgeBinding = createElementWithBindAttr("div", {
                        attr: "{ 'class': 'dx-tabs-item-badge dx-badge' }",
                        text: "badge"
                    });
                var markup = [template.substring(0, template.length - 6), "<!-- ko if: $data.badge -->", badgeBinding, "<!-- /ko -->", "</div>"];
                return markup.join("")
            }
        };
        TEMPLATE_GENERATORS.dxTabPanel = {
            item: TEMPLATE_GENERATORS.CollectionWidget.item,
            title: function() {
                var template = TEMPLATE_GENERATORS.dxTabs.item(),
                    htmlBinding = "<!-- ko if: $data.html -->" + createElementWithBindAttr("div", {html: "html"}) + "<!-- /ko -->";
                return template.replace(/\$data\.text/g, '$data.title').replace(/\!\$data\.html\ \&\&\ /, "").replace(htmlBinding, "")
            }
        };
        var NAVBAR_ITEM_BADGE_CLASS = "dx-navbar-item-badge";
        TEMPLATE_GENERATORS.dxNavBar = {itemFrame: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.itemFrame(),
                    badgeBinding = createElementWithBindAttr("div", {text: "badge"}, true, 'class="' + NAVBAR_ITEM_BADGE_CLASS + " " + BADGE_CLASS + '"');
                var markup = [template.substring(0, template.length - 6), "<!-- ko if: $data.badge -->", badgeBinding, "<!-- /ko -->", "</div>"];
                return markup.join("")
            }};
        TEMPLATE_GENERATORS.dxMenuBase = {item: function() {
                var template = [createElementWithBindAttr("div", defaultKoTemplateBasicBindings, false)],
                    textBinding = createElementWithBindAttr("span", {
                        text: "text",
                        css: "{ 'dx-menu-item-text': true }"
                    }),
                    primitiveBinding = createElementWithBindAttr("span", {
                        text: "String($data)",
                        css: "{ 'dx-menu-item-text': true }"
                    }),
                    popout = "<span class='dx-menu-item-popout-container'><div class='dx-menu-item-popout'></div></span>";
                template.push("<!-- ko dxIcon: $data.icon || $data.iconSrc --><!-- /ko -->", "<!-- ko if: $.isPlainObject($data) && $data.text -->", textBinding, "<!-- /ko -->", "<!-- ko ifnot: $.isPlainObject($data) -->", primitiveBinding, "<!-- /ko -->", "<!-- ko if: $data.items -->", popout, "<!-- /ko -->", "</div>");
                return template.join("")
            }};
        TEMPLATE_GENERATORS.dxTreeView = {item: function() {
                var node = [],
                    link = createElementWithBindAttr("span", {text: "text"}, true),
                    htmlBinding = createElementWithBindAttr("div", {html: "html"});
                node.push("<div>", "<!-- ko if: $data.html && !$data.text -->", htmlBinding, "<!-- /ko -->", "<!-- ko dxIcon: $data.icon || $data.iconSrc --><!-- /ko -->", "<!-- ko if: !$data.html && $data.text -->" + link + "<!-- /ko -->", "</div>");
                return node.join("")
            }};
        var popupTitleAndBottom = function() {
                return ["<div>", createElementWithBindAttr("div", {dxToolbar: "{ items: $data }"}), "</div>"].join("")
            };
        TEMPLATE_GENERATORS.dxPopup = {
            title: popupTitleAndBottom,
            bottom: popupTitleAndBottom
        };
        TEMPLATE_GENERATORS.dxLookup = {
            title: TEMPLATE_GENERATORS.dxPopup.title,
            group: TEMPLATE_GENERATORS.dxList.group
        };
        TEMPLATE_GENERATORS.dxTagBox = {tag: function() {
                return ["<div>", createElementWithBindAttr("span", {text: "$data"})].join("")
            }};
        return TEMPLATE_GENERATORS
    });
    /*! Module core, file ko.template.js */
    DevExpress.define("/integration/knockout/ko.template", ["jquery", "/ui/templates/ui.templateBase", "/utils/utils.dom"], function($, TemplateBase, domUtils) {
        var ko = window.ko;
        var KoTemplate = TemplateBase.inherit({
                ctor: function(element, owner) {
                    this.callBase(element, owner);
                    this._template = $("<div>").append(domUtils.normalizeTemplateElement(element));
                    this._registerKoTemplate()
                },
                _registerKoTemplate: function() {
                    var template = this._template.get(0);
                    new ko.templateSources.anonymousTemplate(template)['nodes'](template)
                },
                _prepareDataForContainer: function(data, container) {
                    var result = data,
                        containerElement,
                        containerContext;
                    if (container.length) {
                        containerElement = container.get(0);
                        data = data !== undefined ? data : ko.dataFor(containerElement) || {};
                        containerContext = ko.contextFor(containerElement);
                        if (containerContext)
                            result = data === containerContext.$data ? containerContext : containerContext.createChildContext(data);
                        else
                            result = data
                    }
                    return result
                },
                _renderCore: function(data, index, $container) {
                    var $placeholder = $("<div>").appendTo($container);
                    var $result;
                    ko.renderTemplate(this._template.get(0), data, {afterRender: function(nodes) {
                            $result = $(nodes)
                        }}, $placeholder.get(0), "replaceNode");
                    return $result
                },
                dispose: function() {
                    this.callBase();
                    this._template.remove()
                }
            });
        return KoTemplate
    });
    /*! Module core, file ko.templateProvider.js */
    DevExpress.define("/integration/knockout/ko.templateProvider", ["jquery", "/utils/utils.dom", "/integration/jquery/jquery.templateProvider", "/integration/knockout/ko.template", "/integration/knockout/ko.defaultTemplates"], function($, domUtils, jqTemplateProvider, KoTemplate, defaultTemplates) {
        var ko = window.ko;
        var KoTemplateProvider = jqTemplateProvider.constructor.inherit({
                createTemplate: function(element, owner) {
                    return new KoTemplate(element, owner)
                },
                applyTemplate: function(element, model) {
                    ko.applyBindings(model, element)
                },
                _templatesForWidget: function(widgetName) {
                    var templateGenerators = defaultTemplates[widgetName];
                    if (!templateGenerators)
                        return this.callBase(widgetName);
                    var templates = {};
                    $.each(templateGenerators, function(name, generator) {
                        var $markup = domUtils.createMarkupFromString(generator());
                        if (name !== "itemFrame")
                            $markup = $markup.contents();
                        templates[name] = new KoTemplate($markup, koTemplateProvider)
                    });
                    return templates
                }
            });
        var koTemplateProvider = new KoTemplateProvider;
        return koTemplateProvider
    });
    /*! Module core, file ko.validation.js */
    DevExpress.define("/integration/knockout/ko.validation", ["jquery", "/class", "/eventsMixin"], function($, Class, EventsMixin) {
        var ko = window.ko;
        var koDxValidator = Class.inherit({
                ctor: function(target, option) {
                    var that = this;
                    that.target = target;
                    that.validationRules = option.validationRules;
                    that.name = option.name;
                    that.isValid = ko.observable(true);
                    that.validationError = ko.observable();
                    $.each(this.validationRules, function(_, rule) {
                        rule.validator = that
                    })
                },
                validate: function() {
                    var result = DevExpress.validationEngine.validate(this.target(), this.validationRules, this.name);
                    this._applyValidationResult(result);
                    return result
                },
                reset: function() {
                    this.target(null);
                    var result = {
                            isValid: true,
                            brokenRule: null
                        };
                    this._applyValidationResult(result);
                    return result
                },
                _applyValidationResult: function(result) {
                    result.validator = this;
                    this.target.dxValidator.isValid(result.isValid);
                    this.target.dxValidator.validationError(result.brokenRule);
                    this.fireEvent("validated", [result])
                }
            }).include(EventsMixin);
        ko.extenders.dxValidator = function(target, option) {
            target.dxValidator = new koDxValidator(target, option);
            target.subscribe($.proxy(target.dxValidator.validate, target.dxValidator));
            return target
        };
        DevExpress.validationEngine.registerModelForValidation = function(model) {
            $.each(model, function(name, member) {
                if (ko.isObservable(member) && member.dxValidator)
                    DevExpress.validationEngine.registerValidatorInGroup(model, member.dxValidator)
            })
        };
        DevExpress.validationEngine.validateModel = DevExpress.validationEngine.validateGroup
    });
    /*! Module core, file ko.eventRegistrator.js */
    DevExpress.define("/integration/knockout/ko.eventRegistrator", ["jquery", "/ui/events/ui.events.eventRegistrator", "/ui/events/ui.events.utils"], function($, eventRegistrator, eventUtils) {
        var ko = window.ko;
        eventRegistrator.callbacks.add(function(name, eventObject) {
            var koBindingEventName = eventUtils.addNamespace(name, name + "Binding");
            ko.bindingHandlers[name] = {update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
                    var $element = $(element),
                        unwrappedValue = ko.utils.unwrapObservable(valueAccessor()),
                        eventSource = unwrappedValue.execute ? unwrappedValue.execute : unwrappedValue;
                    $element.off(koBindingEventName).on(koBindingEventName, $.isPlainObject(unwrappedValue) ? unwrappedValue : {}, function(e) {
                        eventSource.call(viewModel, viewModel, e)
                    })
                }}
        })
    });
    /*! Module core, file ko.cleanNode.js */
    DevExpress.define("/integration/knockout/ko.cleanNode", ["jquery"], function($) {
        var ko = window.ko,
            nodesToCleanByJquery,
            cleanData = $.cleanData,
            cleanNode = ko.cleanNode;
        $.cleanData = function(nodes) {
            var result = cleanData(nodes);
            for (var i = 0; i < nodes.length; i++) {
                if (!nodes[i].cleanedByKo)
                    cleanNode(nodes[i]);
                delete nodes[i].cleanedByKo
            }
            nodesToCleanByJquery = null;
            return result
        };
        ko.cleanNode = function(node) {
            var result = cleanNode(node);
            if (nodesToCleanByJquery)
                cleanData(nodesToCleanByJquery);
            return result
        };
        ko.utils.domNodeDisposal.cleanExternalData = function(node) {
            node.cleanedByKo = true;
            nodesToCleanByJquery = nodesToCleanByJquery || [];
            nodesToCleanByJquery.push(node)
        };
        return {
                cleanData: function(value) {
                    if (value)
                        cleanData = value;
                    return cleanData
                },
                cleanNode: function(value) {
                    if (value)
                        cleanNode = value;
                    return cleanNode
                }
            }
    });
    /*! Module core, file ko.cleanNodeIE8.js */
    DevExpress.define("/integration/knockout/ko.cleanNodeIE8", ["jquery"], function($) {
        var ko = window.ko;
        var cleanKoData = function(element, andSelf) {
                var cleanNode = function() {
                        ko.cleanNode(this)
                    };
                if (andSelf)
                    element.each(cleanNode);
                else
                    element.find("*").each(cleanNode)
            };
        var originalEmpty = $.fn.empty;
        $.fn.empty = function() {
            cleanKoData(this, false);
            return originalEmpty.apply(this, arguments)
        };
        var originalRemove = $.fn.remove;
        $.fn.remove = function(selector, keepData) {
            if (!keepData) {
                var subject = this;
                if (selector)
                    subject = subject.filter(selector);
                cleanKoData(subject, true)
            }
            return originalRemove.call(this, selector, keepData)
        };
        var originalHtml = $.fn.html;
        $.fn.html = function(value) {
            if (typeof value === "string")
                cleanKoData(this, false);
            return originalHtml.apply(this, arguments)
        };
        var originalReplaceWith = $.fn.replaceWith;
        $.fn.replaceWith = function(value) {
            var result = originalReplaceWith.apply(this, arguments);
            if (!this.parent().length)
                cleanKoData(this, true);
            return result
        }
    });
    /*! Module core, file ng.componentRegistrator.js */
    DevExpress.define("/integration/angular/ng.componentRegistrator", ["jquery", "/componentRegistrator", "/class", "/utils/utils.common", "/utils/utils.dom", "/ui/ui.widget", "/ui/ui.editor", "/integration/angular/ng.templateProvider", "/integration/angular/ng.module"], function($, registerComponent, Class, commonUtils, domUtils, Widget, Editor, NgTemplateProvider, ngModule) {
        var compileSetter = DevExpress.data.utils.compileSetter,
            compileGetter = DevExpress.data.utils.compileGetter;
        var ITEM_ALIAS_ATTRIBUTE_NAME = "dxItemAlias",
            DEFAULT_MODEL_ALIAS = "scopeValue",
            ELEMENT_MODEL_DATA_KEY = "dxElementModel",
            SKIP_APPLY_ACTION_CATEGORIES = ["rendering"];
        var safeApply = function(func, scope) {
                if (scope.$root.$$phase)
                    func(scope);
                else
                    scope.$apply(function() {
                        func(scope)
                    })
            };
        var ComponentBuilder = Class.inherit({
                ctor: function(options) {
                    this._componentDisposing = $.Callbacks();
                    this._optionChangedCallbacks = $.Callbacks();
                    this._scope = options.scope;
                    this._$element = options.$element;
                    this._$element.data(ELEMENT_MODEL_DATA_KEY, this._scope);
                    this._$templates = options.$templates;
                    this._componentClass = options.componentClass;
                    this._parse = options.parse;
                    this._compile = options.compile;
                    this._itemAlias = options.itemAlias;
                    this._normalizeOptions(options.ngOptions);
                    this._initComponentBindings();
                    this._initComponent(this._scope);
                    if (options.ngOptions)
                        this._triggerShownEvent();
                    else
                        this._addOptionsStringWatcher(options.ngOptionsString)
                },
                _addOptionsStringWatcher: function(optionsString) {
                    var that = this;
                    var clearOptionsStringWatcher = that._scope.$watch(optionsString, function(newOptions) {
                            if (!newOptions)
                                return;
                            clearOptionsStringWatcher();
                            that._normalizeOptions(newOptions);
                            that._initComponentBindings();
                            that._component.option(that._evalOptions(that._scope));
                            that._triggerShownEvent()
                        });
                    that._componentDisposing.add(clearOptionsStringWatcher)
                },
                _normalizeOptions: function(options) {
                    var that = this;
                    that._ngOptions = $.extend({}, options);
                    if (!options)
                        return;
                    if (options.bindingOptions)
                        $.each(options.bindingOptions, function(key, value) {
                            if ($.type(value) === 'string')
                                that._ngOptions.bindingOptions[key] = {dataPath: value}
                        });
                    if (options.data)
                        that._initDataScope(options.data)
                },
                _triggerShownEvent: function() {
                    var that = this;
                    that._shownEventTimer = setTimeout(function() {
                        domUtils.triggerShownEvent(that._$element)
                    });
                    that._componentDisposing.add(function() {
                        clearTimeout(that._shownEventTimer)
                    })
                },
                _initDataScope: function(data) {
                    if (typeof data === "string") {
                        var dataStr = data,
                            rootScope = this._scope;
                        data = rootScope.$eval(data);
                        this._scope = rootScope.$new();
                        this._synchronizeDataScopes(rootScope, this._scope, data, dataStr)
                    }
                    $.extend(this._scope, data)
                },
                _synchronizeDataScopes: function(parentScope, childScope, data, parentPrefix) {
                    var that = this;
                    $.each(data, function(fieldPath) {
                        that._synchronizeScopeField({
                            parentScope: parentScope,
                            childScope: childScope,
                            fieldPath: fieldPath,
                            parentPrefix: parentPrefix
                        })
                    })
                },
                _initComponent: function(scope) {
                    this._component = new this._componentClass(this._$element, this._evalOptions(scope));
                    this._component._isHidden = true
                },
                _initComponentBindings: function() {
                    var that = this,
                        optionDependencies = {};
                    if (!that._ngOptions.bindingOptions)
                        return;
                    $.each(that._ngOptions.bindingOptions, function(optionPath, value) {
                        var separatorIndex = optionPath.search(/\[|\./),
                            optionForSubscribe = separatorIndex > -1 ? optionPath.substring(0, separatorIndex) : optionPath,
                            prevWatchMethod,
                            clearWatcher,
                            valuePath = value.dataPath,
                            deepWatch = true,
                            forcePlainWatchMethod = false;
                        if (value.deep !== undefined)
                            forcePlainWatchMethod = deepWatch = !!value.deep;
                        if (!optionDependencies[optionForSubscribe])
                            optionDependencies[optionForSubscribe] = {};
                        optionDependencies[optionForSubscribe][optionPath] = valuePath;
                        var watchCallback = function(newValue) {
                                that._component.option(optionPath, newValue);
                                updateWatcher()
                            };
                        var updateWatcher = function() {
                                var watchMethod = $.isArray(that._scope.$eval(valuePath)) && !forcePlainWatchMethod ? "$watchCollection" : "$watch";
                                if (prevWatchMethod !== watchMethod) {
                                    if (clearWatcher)
                                        clearWatcher();
                                    clearWatcher = that._scope[watchMethod](valuePath, watchCallback, deepWatch);
                                    prevWatchMethod = watchMethod
                                }
                            };
                        updateWatcher();
                        that._componentDisposing.add(clearWatcher)
                    });
                    that._optionChangedCallbacks.add(function(args) {
                        var optionName = args.name,
                            component = args.component;
                        if (that._scope.$root.$$phase === "$digest" || !optionDependencies || !optionDependencies[optionName])
                            return;
                        safeApply(function(scope) {
                            $.each(optionDependencies[optionName], function(optionPath, valuePath) {
                                var value = component.option(optionPath);
                                that._parse(valuePath).assign(that._scope, value)
                            })
                        }, that._scope)
                    })
                },
                _compilerByTemplate: function(template) {
                    var that = this,
                        scopeItemsPath = this._getScopeItemsPath();
                    return function(data, index, $container) {
                            var $resultMarkup = $(template).clone(),
                                templateScope;
                            $resultMarkup.appendTo($container);
                            if (commonUtils.isDefined(data)) {
                                var dataIsScope = data.$id;
                                templateScope = dataIsScope ? data : that._createScopeWithData(data);
                                $resultMarkup.on("$destroy", function() {
                                    var destroyAlreadyCalled = !templateScope.$parent;
                                    if (destroyAlreadyCalled)
                                        return;
                                    templateScope.$destroy()
                                })
                            }
                            else
                                templateScope = that._scope;
                            if (scopeItemsPath)
                                that._synchronizeScopes(templateScope, scopeItemsPath, index);
                            safeApply(that._compile($resultMarkup), templateScope);
                            return $resultMarkup
                        }
                },
                _getScopeItemsPath: function() {
                    if (this._componentClass.subclassOf(DevExpress.ui.CollectionWidget) && this._ngOptions.bindingOptions && this._ngOptions.bindingOptions.items)
                        return this._ngOptions.bindingOptions.items.dataPath
                },
                _createScopeWithData: function(data) {
                    var newScope = this._scope.$new(true);
                    data = this._enshureDataIsPlainObject(data);
                    $.extend(newScope, data);
                    return newScope
                },
                _synchronizeScopes: function(itemScope, parentPrefix, itemIndex) {
                    var that = this,
                        item = compileGetter(parentPrefix + "[" + itemIndex + "]")(this._scope);
                    item = that._enshureDataIsPlainObject(item);
                    $.each(item, function(itemPath) {
                        that._synchronizeScopeField({
                            parentScope: that._scope,
                            childScope: itemScope,
                            fieldPath: itemPath,
                            parentPrefix: parentPrefix,
                            itemIndex: itemIndex
                        })
                    })
                },
                _synchronizeScopeField: function(args) {
                    var parentScope = args.parentScope,
                        childScope = args.childScope,
                        fieldPath = args.fieldPath,
                        parentPrefix = args.parentPrefix,
                        itemIndex = args.itemIndex;
                    var innerPathSuffix = fieldPath === (this._itemAlias || DEFAULT_MODEL_ALIAS) ? "" : "." + fieldPath,
                        collectionField = itemIndex !== undefined,
                        optionOuterBag = [parentPrefix],
                        optionOuterPath;
                    if (collectionField)
                        optionOuterBag.push("[", itemIndex, "]");
                    optionOuterBag.push(innerPathSuffix);
                    optionOuterPath = optionOuterBag.join("");
                    var clearParentWatcher = parentScope.$watch(optionOuterPath, function(newValue, oldValue) {
                            if (newValue !== oldValue)
                                compileSetter(fieldPath)(childScope, newValue)
                        });
                    var clearItemWatcher = childScope.$watch(fieldPath, function(newValue, oldValue) {
                            if (newValue !== oldValue) {
                                if (collectionField && !compileGetter(parentPrefix)(parentScope)[itemIndex]) {
                                    clearItemWatcher();
                                    return
                                }
                                compileSetter(optionOuterPath)(parentScope, newValue)
                            }
                        });
                    this._componentDisposing.add([clearParentWatcher, clearItemWatcher])
                },
                _evalOptions: function(scope) {
                    var result = $.extend({}, this._ngOptions);
                    delete result.data;
                    delete result.bindingOptions;
                    if (this._ngOptions.bindingOptions)
                        $.each(this._ngOptions.bindingOptions, function(key, value) {
                            result[key] = scope.$eval(value.dataPath)
                        });
                    result._optionChangedCallbacks = this._optionChangedCallbacks;
                    result._disposingCallbacks = this._componentDisposing;
                    result.templateProvider = NgTemplateProvider;
                    result.templateCompiler = $.proxy(function($template) {
                        return this._compilerByTemplate($template)
                    }, this);
                    result.modelByElement = function(element) {
                        if (element.length)
                            return element.data(ELEMENT_MODEL_DATA_KEY)
                    };
                    result.onActionCreated = function(component, action, config) {
                        if (config && $.inArray(config.category, SKIP_APPLY_ACTION_CATEGORIES) > -1)
                            return action;
                        var wrappedAction = function() {
                                var that = this,
                                    scope = result.modelByElement(component.element()),
                                    args = arguments;
                                if (!scope || !scope.$root || scope.$root.$$phase)
                                    return action.apply(that, args);
                                return scope.$apply(function() {
                                        return action.apply(that, args)
                                    })
                            };
                        return wrappedAction
                    };
                    result.nestedComponentOptions = function(component) {
                        return {
                                templateCompiler: component.option("templateCompiler"),
                                modelByElement: component.option("modelByElement"),
                                onActionCreated: component.option("onActionCreated"),
                                nestedComponentOptions: component.option("nestedComponentOptions")
                            }
                    };
                    return result
                },
                _enshureDataIsPlainObject: function(object) {
                    var result;
                    if ($.isPlainObject(object))
                        result = object;
                    else {
                        result = {};
                        result[DEFAULT_MODEL_ALIAS] = object
                    }
                    if (this._itemAlias)
                        result[this._itemAlias] = object;
                    return result
                }
            });
        ComponentBuilder = ComponentBuilder.inherit({
            ctor: function(options) {
                this._componentName = options.componentName;
                this._ngModel = options.ngModel;
                this._ngModelController = options.ngModelController;
                this.callBase.apply(this, arguments)
            },
            _isNgModelRequired: function() {
                return this._componentClass.subclassOf(Editor) && this._ngModel
            },
            _initComponentBindings: function() {
                this.callBase.apply(this, arguments);
                this._initNgModelBinding()
            },
            _initNgModelBinding: function() {
                if (!this._isNgModelRequired())
                    return;
                var that = this;
                var clearNgModelWatcher = this._scope.$watch(this._ngModel, function(newValue, oldValue) {
                        if (newValue === oldValue)
                            return;
                        that._component.option(that._ngModelOption(), newValue)
                    });
                that._optionChangedCallbacks.add(function(args) {
                    if (args.name !== that._ngModelOption())
                        return;
                    that._ngModelController.$setViewValue(args.value)
                });
                this._componentDisposing.add(clearNgModelWatcher)
            },
            _ngModelOption: function() {
                if ($.inArray(this._componentName, ["dxFileUploader", "dxTagBox"]) > -1)
                    return "values";
                return "value"
            },
            _evalOptions: function() {
                if (!this._isNgModelRequired())
                    return this.callBase.apply(this, arguments);
                var result = this.callBase.apply(this, arguments);
                result[this._ngModelOption()] = this._parse(this._ngModel)(this._scope);
                return result
            }
        });
        var registeredComponents = {};
        var registerComponentDirective = function(name) {
                var priority = name !== "dxValidator" ? 1 : 10;
                ngModule.directive(name, ["$compile", "$parse", function($compile, $parse) {
                        return {
                                restrict: "A",
                                require: "^?ngModel",
                                priority: priority,
                                compile: function($element) {
                                    var componentClass = registeredComponents[name],
                                        $content = componentClass.subclassOf(Widget) ? $element.contents().detach() : null;
                                    return function(scope, $element, attrs, ngModelController) {
                                            $element.append($content);
                                            new ComponentBuilder({
                                                componentClass: componentClass,
                                                componentName: name,
                                                compile: $compile,
                                                parse: $parse,
                                                $element: $element,
                                                scope: scope,
                                                ngOptionsString: attrs[name],
                                                ngOptions: attrs[name] ? scope.$eval(attrs[name]) : {},
                                                ngModel: attrs.ngModel,
                                                ngModelController: ngModelController,
                                                itemAlias: attrs[ITEM_ALIAS_ATTRIBUTE_NAME]
                                            })
                                        }
                                }
                            }
                    }])
            };
        registerComponent.callbacks.add(function(name, componentClass) {
            if (!registeredComponents[name])
                registerComponentDirective(name);
            registeredComponents[name] = componentClass
        })
    });
    /*! Module core, file ng.components.js */
    DevExpress.define("/integration/angular/ng.components", ["/integration/angular/ng.module", "/utils/utils.icon", "/utils/utils.inflector"], function(ngModule, iconUtils, inflector) {
        ngModule.filter('dxGlobalize', function() {
            return function(input, param) {
                    return Globalize.format(input, param)
                }
        });
        ngModule.directive("dxIcon", ["$compile", function($compile) {
                return {
                        restrict: 'E',
                        link: function($scope, $element, $attrs) {
                            var html = iconUtils.getImageContainer($scope.icon || $scope.iconSrc);
                            if (html) {
                                var e = $compile(html.get(0))($scope);
                                $element.replaceWith(e)
                            }
                        }
                    }
            }]);
        ngModule.directive("dxPolymorphWidget", ["$compile", function($compile) {
                return {
                        restrict: 'E',
                        scope: {
                            name: "=",
                            options: "="
                        },
                        link: function($scope, $element, $attrs) {
                            var widgetName = $scope.name;
                            if (!widgetName)
                                return;
                            var markup = $("<div " + inflector.dasherize("dx-" + widgetName) + "=\"options\">").get(0);
                            $element.after(markup);
                            $compile(markup)($scope)
                        }
                    }
            }])
    });
    /*! Module core, file ng.defaultTemplates.js */
    DevExpress.define("/integration/angular/ng.defaultTemplates", ["jquery"], function($) {
        var TEMPLATE_GENERATORS = {};
        var TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper";
        var baseElements = {
                container: function() {
                    return $("<div>").addClass(TEMPLATE_WRAPPER_CLASS)
                },
                html: function() {
                    return $("<div>").attr("ng-if", "html").attr("ng-bind-html", "html")
                },
                text: function(element) {
                    element = element || "<div>";
                    return $(element).attr("ng-if", "text").attr("ng-if", "!html").attr("ng-bind", "text")
                },
                primitive: function() {
                    return $("<div>").attr("ng-if", "scopeValue").attr("ng-bind", "'' + scopeValue")
                }
            };
        var emptyTemplate = function() {
                return $()
            };
        TEMPLATE_GENERATORS.CollectionWidget = {
            item: function() {
                return baseElements.container().append(baseElements.html()).append(baseElements.text()).append(baseElements.primitive())
            },
            itemFrame: function() {
                var $container = $("<div>").attr("ng-class", "{ 'dx-state-invisible': !visible && visible != undefined, 'dx-state-disabled': !!disabled }"),
                    $placeholder = $("<div>").addClass("dx-item-content-placeholder");
                $container.append($placeholder);
                return $container
            }
        };
        var BUTTON_TEXT_CLASS = "dx-button-text";
        TEMPLATE_GENERATORS.dxButton = {content: function() {
                var $titleBinding = $("<span>").attr("ng-bind", "text").attr("ng-class", "{ '" + BUTTON_TEXT_CLASS + "' : !!text }"),
                    icon = $("<dx-icon>");
                return baseElements.container().append(icon).append($titleBinding).append(baseElements.primitive())
            }};
        var LIST_ITEM_BADGE_CONTAINER_CLASS = "dx-list-item-badge-container",
            LIST_ITEM_BADGE_CLASS = "dx-list-item-badge",
            BADGE_CLASS = "dx-badge",
            LIST_ITEM_CHEVRON_CONTAINER_CLASS = "dx-list-item-chevron-container",
            LIST_ITEM_CHEVRON_CLASS = "dx-list-item-chevron";
        TEMPLATE_GENERATORS.dxList = {
            item: function() {
                return TEMPLATE_GENERATORS.CollectionWidget.item().append($("<div>").attr("ng-if", "key").attr("ng-bind", "key"))
            },
            itemFrame: function() {
                var $badgeContainer = $("<div>").addClass(LIST_ITEM_BADGE_CONTAINER_CLASS).attr("ng-if", "badge"),
                    $badge = $("<div>").addClass(LIST_ITEM_BADGE_CLASS).addClass(BADGE_CLASS).attr("ng-bind", "badge");
                var $chevronContainer = $("<div>").addClass(LIST_ITEM_CHEVRON_CONTAINER_CLASS).attr("ng-if", "showChevron"),
                    $chevron = $("<div>").addClass(LIST_ITEM_CHEVRON_CLASS);
                return TEMPLATE_GENERATORS.CollectionWidget.itemFrame().append($badgeContainer.append($badge)).append($chevronContainer.append($chevron))
            },
            group: function() {
                var $keyBinding = $("<div>").attr("ng-if", "key").attr("ng-bind", "key");
                return baseElements.container().append($keyBinding).append(baseElements.primitive())
            }
        };
        TEMPLATE_GENERATORS.dxDropDownMenu = {
            item: TEMPLATE_GENERATORS.dxList.item,
            content: TEMPLATE_GENERATORS.dxButton.content
        };
        TEMPLATE_GENERATORS.dxDropDownList = {item: TEMPLATE_GENERATORS.dxList.item};
        TEMPLATE_GENERATORS.dxRadioGroup = {item: TEMPLATE_GENERATORS.CollectionWidget.item};
        TEMPLATE_GENERATORS.dxScheduler = {
            item: function() {
                var $itemContent = TEMPLATE_GENERATORS.CollectionWidget.item();
                var $details = $("<div>").addClass("dx-scheduler-appointment-content-details");
                $("<div>").attr("ng-if", "startDate").addClass("dx-scheduler-appointment-content-date").text("{{startDate | date : 'shortTime' }}").appendTo($details);
                $("<div>").attr("ng-if", "endDate").addClass("dx-scheduler-appointment-content-date").text(" - ").appendTo($details);
                $("<div>").attr("ng-if", "endDate").addClass("dx-scheduler-appointment-content-date").text("{{endDate | date : 'shortTime' }}").appendTo($details);
                $details.appendTo($itemContent);
                $("<span>").attr("ng-if", "recurrenceRule").addClass("dx-scheduler-appointment-recurrence-icon dx-icon-repeat").appendTo($itemContent);
                return $itemContent
            },
            appointmentTooltip: emptyTemplate,
            appointmentPopup: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxOverlay = {content: emptyTemplate};
        TEMPLATE_GENERATORS.dxSlideOutView = {
            menu: emptyTemplate,
            content: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxSlideOut = {
            menuItem: TEMPLATE_GENERATORS.dxList.item,
            menuGroup: TEMPLATE_GENERATORS.dxList.group,
            content: emptyTemplate
        };
        TEMPLATE_GENERATORS.dxAccordion = {
            title: function() {
                var $titleBinding = $("<span>").attr("ng-if", "title").attr("ng-bind", "title"),
                    icon = $("<dx-icon>");
                return baseElements.container().append(icon).append($titleBinding).append(baseElements.primitive())
            },
            content: TEMPLATE_GENERATORS.CollectionWidget.item
        };
        TEMPLATE_GENERATORS.dxPivotTabs = {item: function() {
                return baseElements.container().append($("<span>").attr("ng-if", "title || scopeValue && scopeValue.title").attr("ng-bind", "title || scopeValue && scopeValue.title")).append(baseElements.primitive().attr("ng-if", "scopeValue && !scopeValue.title"))
            }};
        TEMPLATE_GENERATORS.dxPivot = {
            title: TEMPLATE_GENERATORS.dxPivotTabs.item,
            content: emptyTemplate
        };
        var PANORAMA_ITEM_TITLE_CLASS = "dx-panorama-item-title";
        TEMPLATE_GENERATORS.dxPanorama = {itemFrame: function() {
                return TEMPLATE_GENERATORS.CollectionWidget.itemFrame().prepend($("<div>").addClass(PANORAMA_ITEM_TITLE_CLASS).attr("ng-if", "title").attr("ng-bind", "title"))
            }};
        TEMPLATE_GENERATORS.dxActionSheet = {item: function() {
                return baseElements.container().append($("<div>").attr("dx-button", "{ bindingOptions: { text: 'text', onClick: 'onClick', type: 'type', disabled: 'disabled' } }"))
            }};
        TEMPLATE_GENERATORS.dxToolbar = {
            item: function() {
                var template = TEMPLATE_GENERATORS.CollectionWidget.item();
                $("<dx-polymorph-widget name=\"widget\" options=\"options\">").appendTo(template);
                return template
            },
            menuItem: TEMPLATE_GENERATORS.dxList.item,
            actionSheetItem: TEMPLATE_GENERATORS.dxActionSheet.item
        };
        var GALLERY_IMAGE_CLASS = "dx-gallery-item-image";
        TEMPLATE_GENERATORS.dxGallery = {item: function() {
                return baseElements.container().append(baseElements.html()).append(baseElements.text()).append($("<img>").addClass(GALLERY_IMAGE_CLASS).attr("ng-if", "scopeValue").attr("ng-src", "{{'' + scopeValue}}")).append($("<img>").addClass(GALLERY_IMAGE_CLASS).attr("ng-if", "imageSrc").attr("ng-src", "{{imageSrc}}").attr("ng-attr-alt", "{{imageAlt}}"))
            }};
        var TABS_ITEM_TEXT_CLASS = "dx-tab-text";
        TEMPLATE_GENERATORS.dxTabs = {
            item: function() {
                var container = baseElements.container();
                var icon = $("<dx-icon>"),
                    text = baseElements.text("<span>").addClass(TABS_ITEM_TEXT_CLASS);
                return container.append(baseElements.html()).append(icon).append(text).append(baseElements.primitive().addClass(TABS_ITEM_TEXT_CLASS))
            },
            itemFrame: function() {
                var $badge = $("<div>").addClass("dx-tabs-item-badge dx-badge").attr("ng-bind", "badge").attr("ng-if", "badge");
                return TEMPLATE_GENERATORS.CollectionWidget.itemFrame().append($badge)
            }
        };
        var NAVBAR_ITEM_BADGE_CLASS = "dx-navbar-item-badge";
        TEMPLATE_GENERATORS.dxNavBar = {itemFrame: function() {
                var $badge = $("<div>").addClass(NAVBAR_ITEM_BADGE_CLASS).addClass(BADGE_CLASS).attr("ng-if", "badge").attr("ng-bind", "badge");
                return TEMPLATE_GENERATORS.CollectionWidget.itemFrame().append($badge)
            }};
        TEMPLATE_GENERATORS.dxMenuBase = {item: function() {
                var container = baseElements.container();
                var text = $("<span>").attr("ng-if", "text").addClass("dx-menu-item-text").attr("ng-bind", "text"),
                    icon = $("<dx-icon>"),
                    popout = $("<span>").addClass("dx-menu-item-popout-container").attr("ng-if", "items").append($("<div>").addClass("dx-menu-item-popout"));
                container.append(baseElements.html()).append(icon).append(text).append(popout).append(baseElements.primitive()).appendTo(container);
                return container
            }};
        TEMPLATE_GENERATORS.dxTreeView = {item: function() {
                var content = baseElements.container(),
                    link = $("<span/>").attr("ng-bind", "text"),
                    icon = $("<dx-icon>");
                content.append(baseElements.html()).append(icon).append(link).append(baseElements.primitive());
                return content
            }};
        TEMPLATE_GENERATORS.dxTabPanel = {
            item: TEMPLATE_GENERATORS.CollectionWidget.item,
            title: function() {
                var content = TEMPLATE_GENERATORS.dxTabs.item();
                content.find(".dx-tab-text").eq(0).attr("ng-bind", "title").attr("ng-if", "title");
                content.find("[ng-if='html']").remove();
                return content
            }
        };
        var popupTitleAndBottom = function() {
                return $("<div>").attr("dx-toolbar", "{ bindingOptions: { items: 'scopeValue' } }")
            };
        TEMPLATE_GENERATORS.dxPopup = {
            title: popupTitleAndBottom,
            bottom: popupTitleAndBottom
        };
        TEMPLATE_GENERATORS.dxLookup = {
            title: TEMPLATE_GENERATORS.dxPopup.title,
            group: TEMPLATE_GENERATORS.dxList.group
        };
        TEMPLATE_GENERATORS.dxTagBox = {tag: function() {
                return $("<div>").append($("<span>").attr("ng-bind", "scopeValue"))
            }};
        return TEMPLATE_GENERATORS
    });
    /*! Module core, file ng.template.js */
    DevExpress.define("/integration/angular/ng.template", ["jquery", "/ui/templates/ui.templateBase", "/utils/utils.dom"], function($, TemplateBase, domUtils) {
        var NgTemplate = TemplateBase.inherit({
                ctor: function(element, owner) {
                    this.callBase(element, owner);
                    this.setCompiler(this._getParentTemplateCompiler())
                },
                _getParentTemplateCompiler: function() {
                    var templateCompiler = null,
                        owner = this.owner();
                    while (!templateCompiler && owner) {
                        templateCompiler = $.isFunction(owner.option) ? owner.option("templateCompiler") : null;
                        owner = $.isFunction(owner.owner) ? owner.owner() : null
                    }
                    return templateCompiler
                },
                _renderCore: function(data, index, $container) {
                    var compiledTemplate = this._compiledTemplate,
                        result = $.isFunction(compiledTemplate) ? compiledTemplate(data, index, $container) : compiledTemplate;
                    return result
                },
                setCompiler: function(templateCompiler) {
                    if (!templateCompiler)
                        return;
                    this._compiledTemplate = templateCompiler(domUtils.normalizeTemplateElement(this._element))
                }
            });
        return NgTemplate
    });
    /*! Module core, file ng.templateProvider.js */
    DevExpress.define("/integration/angular/ng.templateProvider", ["jquery", "/utils/utils.dom", "/integration/jquery/jquery.templateProvider", "/integration/angular/ng.template", "/integration/angular/ng.defaultTemplates"], function($, domUtils, jqTemplateProvider, NgTemplate, defaultTemplates) {
        var NgTemplateProvider = jqTemplateProvider.constructor.inherit({
                createTemplate: function(element, owner) {
                    return new NgTemplate(element, owner)
                },
                getTemplates: function(widget) {
                    var templateCompiler = widget.option("templateCompiler"),
                        templates = this.callBase.apply(this, arguments);
                    $.each(templates, function(_, template) {
                        template.setCompiler && template.setCompiler(templateCompiler)
                    });
                    return templates
                },
                _templatesForWidget: function(widgetName) {
                    var templateGenerators = defaultTemplates[widgetName];
                    if (!templateGenerators)
                        return this.callBase(widgetName);
                    var templates = {};
                    $.each(templateGenerators, function(name, generator) {
                        var $markup = domUtils.createMarkupFromString(generator());
                        templates[name] = new NgTemplate($markup.wrap(), ngTemplateProvider)
                    });
                    return templates
                }
            });
        var ngTemplateProvider = new NgTemplateProvider;
        return ngTemplateProvider
    });
    /*! Module core, file ng.eventRegistrator.js */
    DevExpress.define("/integration/angular/ng.eventRegistrator", ["jquery", "/ui/events/ui.events.eventRegistrator", "/integration/angular/ng.module"], function($, eventRegistrator, ngModule) {
        eventRegistrator.callbacks.add(function(name, eventObject) {
            var ngEventName = name.slice(0, 2) + name.charAt(2).toUpperCase() + name.slice(3);
            ngModule.directive(ngEventName, ['$parse', function($parse) {
                    return function(scope, element, attr) {
                            var attrValue = $.trim(attr[ngEventName]),
                                handler,
                                eventOptions = {};
                            if (attrValue.charAt(0) === "{") {
                                eventOptions = scope.$eval(attrValue);
                                handler = $parse(eventOptions.execute)
                            }
                            else
                                handler = $parse(attr[ngEventName]);
                            element.on(name, eventOptions, function(e) {
                                scope.$apply(function() {
                                    handler(scope, {$event: e})
                                })
                            })
                        }
                }])
        })
    });
    /*! Module core, file ng.module.js */
    DevExpress.define("/integration/angular/ng.module", [], function() {
        return window.angular.module("dx", ["ngSanitize"])
    });
    /*! Module core, file ui.events.js */
    DevExpress.define("/ui/events/ui.events", ["/ui/uiNamespace", "/ui/events/pointer/ui.events.pointer"], function(uiNamespace) {
        uiNamespace.events = {}
    });
    DevExpress.require("/ui/events/ui.events");
    /*! Module core, file core.js */
    DevExpress.define("/core", ["/coreNamespace", "/errors", "/utils/utils.animationFrame", "/utils/utils.viewPort", "/utils/utils.hardwareBack", "/utils/utils.topOverlay", "/utils/utils.queue", "/eventsMixin", "/endpointSelector", "/color", "/devices", "/componentRegistrator", "/utils/utils"], function(namespace, errors, animationFrame, viewPortUtils, hardwareBack, topOverlay, queueUtils, EventsMixin, EndpointSelector, Color, devices, componentRegistrator) {
        namespace.requestAnimationFrame = function() {
            errors.log("W0000", "DevExpress.requestAnimationFrame", "15.2", "Use the 'DevExpress.utils.requestAnimationFrame' method instead.");
            return animationFrame.request.apply(animationFrame, arguments)
        };
        namespace.cancelAnimationFrame = function() {
            errors.log("W0000", "DevExpress.cancelAnimationFrame", "15.2", "Use the 'DevExpress.utils.cancelAnimationFrame' method instead.");
            return animationFrame.cancel.apply(animationFrame, arguments)
        };
        namespace.processHardwareBackButton = hardwareBack.process;
        namespace.hideTopOverlay = topOverlay.hide;
        namespace.registerComponent = componentRegistrator;
        namespace.EventsMixin = EventsMixin;
        namespace.EndpointSelector = EndpointSelector;
        namespace.devices = devices;
        namespace.createQueue = queueUtils.create;
        namespace.viewPort = viewPortUtils.value;
        namespace.Color = Color;
        return namespace
    });
    DevExpress.require(["/core"]);
    /*! Module core, file ui.js */
    DevExpress.define("/ui/ui", ["/ui/uiNamespace", "/ui/ui.dialog", "/core", "/ui/events/ui.events"], function(uiNamespace, dialog) {
        uiNamespace.notify = dialog.notify;
        uiNamespace.dialog = {
            custom: dialog.custom,
            alert: dialog.alert,
            confirm: dialog.confirm
        };
        return uiNamespace
    });
    DevExpress.require(["/ui/ui"]);
    /*! Module core, file jquery.js */
    DevExpress.define("/integration/jquery/jquery", ["jquery", "/errors", "/utils/utils.version"], function($, errors, versionUtils) {
        if (versionUtils.compare($.fn.jquery, [1, 10]) < 0)
            throw errors.Error("E0012");
    });
    DevExpress.require(["/integration/jquery/jquery"]);
    /*! Module core, file ko.js */
    DevExpress.define("/integration/knockout/ko", ["/utils/utils.support", "/errors", "/utils/utils.version", "require"], function(support, errors, versionUtils, require) {
        if (!support.hasKo)
            return;
        var ko = window.ko;
        if (versionUtils.compare(ko.version, [2, 3]) < 0)
            throw errors.Error("E0013");
        require(["/integration/knockout/ko.componentRegistrator", "/integration/knockout/ko.eventRegistrator", "/integration/knockout/ko.components", "/integration/knockout/ko.validation"]);
        if (versionUtils.compare($.fn.jquery, [2, 0]) >= 0)
            require(["/integration/knockout/ko.cleanNode"]);
        else
            require(["/integration/knockout/ko.cleanNodeIE8"])
    });
    DevExpress.require(["/integration/knockout/ko"]);
    /*! Module core, file ng.js */
    DevExpress.define("/integration/angular/ng", ["/utils/utils.support", "require"], function(support, require) {
        if (!support.hasNg)
            return;
        require(["/integration/angular/ng.componentRegistrator", "/integration/angular/ng.eventRegistrator", "/integration/angular/ng.components"])
    });
    DevExpress.require(["/integration/angular/ng"]);
    /*! Module core, file ui.events.emitter.click.js */
    (function($, DX, wnd, undefined) {
        var abs = Math.abs,
            events = DX.ui.events,
            devices = DX.require("/devices"),
            domUtils = DX.require("/utils/utils.dom"),
            animationFrame = DX.require("/utils/utils.animationFrame"),
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            pointerEvents = DX.require("/ui/events/pointer/ui.events.pointer"),
            Emitter = DX.require("/ui/events/ui.events.emitter"),
            registerEmitter = DX.require("/ui/events/ui.events.emitterRegistrator"),
            CLICK_EVENT_NAME = "dxclick",
            TOUCH_BOUNDARY = 10;
        DX.ui.events.__internals = DX.ui.events.__internals || {};
        var isInput = function(element) {
                return $(element).is("input, textarea, select, button ,:focus, :focus *")
            };
        var misc = {requestAnimationFrame: animationFrame.request};
        var ClickEmitter = Emitter.inherit({
                ctor: function(element) {
                    this.callBase(element);
                    this._makeElementClickable($(element))
                },
                _makeElementClickable: function($element) {
                    if (!$element.attr("onclick"))
                        $element.attr("onclick", "void(0)")
                },
                start: function(e) {
                    this._blurPrevented = e.dxPreventBlur;
                    this._startTarget = e.target;
                    this._startEventData = eventUtils.eventData(e)
                },
                end: function(e) {
                    if (this._eventOutOfElement(e, this.getElement().get(0)) || e.type === pointerEvents.cancel) {
                        this._cancel(e);
                        return
                    }
                    if (!isInput(e.target) && !this._blurPrevented)
                        domUtils.resetActiveElement();
                    this._accept(e);
                    misc.requestAnimationFrame($.proxy(function() {
                        this._fireClickEvent(e)
                    }, this))
                },
                _eventOutOfElement: function(e, element) {
                    var target = e.target,
                        targetChanged = !$.contains(element, target) && element !== target,
                        gestureDelta = eventUtils.eventDelta(eventUtils.eventData(e), this._startEventData),
                        boundsExceeded = abs(gestureDelta.x) > TOUCH_BOUNDARY || abs(gestureDelta.y) > TOUCH_BOUNDARY;
                    return targetChanged || boundsExceeded
                },
                _fireClickEvent: function(e) {
                    this._fireEvent(CLICK_EVENT_NAME, e, {target: domUtils.closestCommonParent(this._startTarget, e.target)})
                }
            });
        (function() {
            var useNativeClick = devices.real().generic;
            if (useNativeClick) {
                var prevented = null;
                ClickEmitter = ClickEmitter.inherit({
                    start: function() {
                        prevented = null
                    },
                    end: $.noop,
                    cancel: function() {
                        prevented = true
                    }
                });
                var clickHandler = function(e) {
                        if ((!e.which || e.which === 1) && !prevented)
                            eventUtils.fireEvent({
                                type: CLICK_EVENT_NAME,
                                originalEvent: e
                            })
                    };
                $(document).on(eventUtils.addNamespace("click", "NATIVE_DXCLICK_STRATEGY"), clickHandler)
            }
            $.extend(events.__internals, {useNativeClick: useNativeClick})
        })();
        (function() {
            var fixBuggyInertia = devices.real().ios;
            if (fixBuggyInertia) {
                var GESTURE_LOCK_KEY = "dxGestureLock";
                ClickEmitter = ClickEmitter.inherit({_fireClickEvent: function(e) {
                        var $element = $(e.target);
                        while ($element.length) {
                            if ($.data($element.get(0), GESTURE_LOCK_KEY))
                                return;
                            $element = $element.parent()
                        }
                        this.callBase.apply(this, arguments)
                    }})
            }
            $.extend(events.__internals, {fixBuggyInertia: fixBuggyInertia})
        })();
        (function() {
            var desktopDevice = devices.real().generic;
            if (!desktopDevice) {
                var startTarget = null,
                    blurPrevented = false;
                var pointerDownHandler = function(e) {
                        startTarget = e.target;
                        blurPrevented = e.dxPreventBlur
                    };
                var clickHandler = function(e) {
                        var $target = $(e.target);
                        if (!blurPrevented && startTarget && !$target.is(startTarget) && !$(startTarget).is("label") && isInput($target))
                            domUtils.resetActiveElement();
                        startTarget = null;
                        blurPrevented = false
                    };
                var NATIVE_CLICK_FIXER_NAMESPACE = "NATIVE_CLICK_FIXER";
                $(document).on(eventUtils.addNamespace(pointerEvents.down, NATIVE_CLICK_FIXER_NAMESPACE), pointerDownHandler).on(eventUtils.addNamespace("click", NATIVE_CLICK_FIXER_NAMESPACE), clickHandler)
            }
        })();
        registerEmitter({
            emitter: ClickEmitter,
            bubble: true,
            events: [CLICK_EVENT_NAME]
        });
        $.extend(events.__internals, {
            useFastClick: !events.__internals.useNativeClick && !events.__internals.fixBuggyInertia,
            misc: misc
        })
    })(jQuery, DevExpress, window);
    /*! Module core, file ui.events.emitter.hold.js */
    (function($, DX, undefined) {
        var eventUtils = DX.require("/ui/events/ui.events.utils"),
            Emitter = DX.require("/ui/events/ui.events.emitter"),
            registerEmitter = DX.require("/ui/events/ui.events.emitterRegistrator"),
            abs = Math.abs,
            HOLD_EVENT_NAME = "dxhold",
            HOLD_TIMEOUT = 750,
            TOUCH_BOUNDARY = 5;
        var HoldEmitter = Emitter.inherit({
                start: function(e) {
                    this._startEventData = eventUtils.eventData(e);
                    this._startTimer(e)
                },
                _startTimer: function(e) {
                    var holdTimeout = "timeout" in this ? this.timeout : HOLD_TIMEOUT;
                    this._holdTimer = setTimeout($.proxy(function() {
                        this._requestAccept(e);
                        this._fireEvent(HOLD_EVENT_NAME, e, {target: e.target});
                        this._forgetAccept()
                    }, this), holdTimeout)
                },
                move: function(e) {
                    if (this._touchWasMoved(e))
                        this._cancel(e)
                },
                _touchWasMoved: function(e) {
                    var delta = eventUtils.eventDelta(this._startEventData, eventUtils.eventData(e));
                    return abs(delta.x) > TOUCH_BOUNDARY || abs(delta.y) > TOUCH_BOUNDARY
                },
                end: function() {
                    this._stopTimer()
                },
                _stopTimer: function() {
                    clearTimeout(this._holdTimer)
                },
                cancel: function() {
                    this._stopTimer()
                }
            });
        registerEmitter({
            emitter: HoldEmitter,
            bubble: true,
            events: [HOLD_EVENT_NAME]
        })
    })(jQuery, DevExpress);
    /*! Module core, file ui.events.emitter.gesture.scroll.js */
    (function($, DX, undefined) {
        var eventUtils = DX.require("/ui/events/ui.events.utils"),
            GestureEmitter = DX.require("/ui/events/ui.events.emitter.gesture"),
            registerEmitter = DX.require("/ui/events/ui.events.emitterRegistrator");
        var SCROLL_INIT_EVENT = "dxscrollinit",
            SCROLL_START_EVENT = "dxscrollstart",
            SCROLL_MOVE_EVENT = "dxscroll",
            SCROLL_END_EVENT = "dxscrollend",
            SCROLL_STOP_EVENT = "dxscrollstop",
            SCROLL_CANCEL_EVENT = "dxscrollcancel",
            INERTIA_TIMEOUT = 100,
            VELOCITY_CALC_TIMEOUT = 200,
            FRAME_DURATION = Math.round(1000 / 60),
            GESTURE_LOCK_KEY = "dxGestureLock",
            GESTURE_UNLOCK_TIMEOUT = 400,
            NAMESPACED_SCROLL_EVENT = eventUtils.addNamespace("scroll", "dxScrollEmitter");
        var isWheelEvent = function(e) {
                return e.type === "dxmousewheel"
            };
        var ScrollEmitter = GestureEmitter.inherit({
                ctor: function(element) {
                    this.callBase.apply(this, arguments);
                    this.direction = "both";
                    this._lastWheelDirection = null;
                    this._proxiedTreatScroll = $.proxy(this._treatScroll, this);
                    $(element).on(NAMESPACED_SCROLL_EVENT, this._proxiedTreatScroll)
                },
                validate: function() {
                    return true
                },
                _domElement: function() {
                    return this.getElement().get(0)
                },
                _treatScroll: function() {
                    this._prepareGesture();
                    this._forgetGesture()
                },
                _prepareGesture: function() {
                    if (this._gestureEndTimer)
                        this._clearGestureTimer();
                    $.data(this._domElement(), GESTURE_LOCK_KEY, true)
                },
                _clearGestureTimer: function() {
                    clearTimeout(this._gestureEndTimer);
                    $.data(this._domElement(), GESTURE_LOCK_KEY, false);
                    this._gestureEndTimer = null
                },
                _forgetGesture: function() {
                    var that = this;
                    this._gestureEndTimer = setTimeout(function() {
                        that._clearGestureTimer()
                    }, GESTURE_UNLOCK_TIMEOUT)
                },
                _init: function(e) {
                    if (!this._wheelDirectionChanged(e) && $.data(this._domElement(), GESTURE_LOCK_KEY))
                        this._accept(e);
                    else
                        this._clearGestureTimer();
                    this._fireEvent(SCROLL_INIT_EVENT, e)
                },
                _wheelDirectionChanged: function(e) {
                    if (!isWheelEvent(e))
                        return false;
                    var direction = e.shiftKey;
                    var result = this._lastWheelDirection !== null && direction !== this._lastWheelDirection;
                    this._lastWheelDirection = direction;
                    return result
                },
                move: function(e) {
                    this.callBase.apply(this, arguments);
                    e.isScrollingEvent = this.isNative || e.isScrollingEvent
                },
                _start: function(e) {
                    this._savedEventData = eventUtils.eventData(e);
                    this._fireEvent(SCROLL_START_EVENT, e, {delta: eventUtils.eventDelta(this._savedEventData, eventUtils.eventData(e))})
                },
                _move: function(e) {
                    var currentEventData = eventUtils.eventData(e);
                    this._fireEvent(SCROLL_MOVE_EVENT, e, {delta: eventUtils.eventDelta(this._prevEventData, currentEventData)});
                    var eventDelta = eventUtils.eventDelta(this._savedEventData, currentEventData);
                    if (eventDelta.time > VELOCITY_CALC_TIMEOUT)
                        this._savedEventData = this._prevEventData
                },
                _end: function(e) {
                    var endEventDelta = eventUtils.eventDelta(this._prevEventData, eventUtils.eventData(e));
                    var velocity = {
                            x: 0,
                            y: 0
                        };
                    if (!isWheelEvent(e) && endEventDelta.time < INERTIA_TIMEOUT) {
                        var eventDelta = eventUtils.eventDelta(this._savedEventData, this._prevEventData),
                            velocityMultiplier = FRAME_DURATION / eventDelta.time;
                        velocity = {
                            x: eventDelta.x * velocityMultiplier,
                            y: eventDelta.y * velocityMultiplier
                        }
                    }
                    this._fireEvent(SCROLL_END_EVENT, e, {velocity: velocity})
                },
                _stop: function(e) {
                    this._fireEvent(SCROLL_STOP_EVENT, e)
                },
                cancel: function(e) {
                    this.callBase.apply(this, arguments);
                    this._fireEvent(SCROLL_CANCEL_EVENT, e)
                },
                dispose: function() {
                    this.callBase.apply(this, arguments);
                    this._clearGestureTimer();
                    this.getElement().off(NAMESPACED_SCROLL_EVENT, this._proxiedTreatScroll)
                }
            });
        registerEmitter({
            emitter: ScrollEmitter,
            events: [SCROLL_INIT_EVENT, SCROLL_START_EVENT, SCROLL_MOVE_EVENT, SCROLL_END_EVENT, SCROLL_STOP_EVENT, SCROLL_CANCEL_EVENT]
        })
    })(jQuery, DevExpress);
    /*! Module core, file ui.events.emitter.gesture.swipe.js */
    (function($, DX, undefined) {
        var eventUtils = DX.require("/ui/events/ui.events.utils"),
            GestureEmitter = DX.require("/ui/events/ui.events.emitter.gesture"),
            registerEmitter = DX.require("/ui/events/ui.events.emitterRegistrator"),
            SWIPE_START_EVENT = "dxswipestart",
            SWIPE_EVENT = "dxswipe",
            SWIPE_END_EVENT = "dxswipeend";
        var HorizontalStrategy = {
                defaultItemSizeFunc: function() {
                    return this.getElement().width()
                },
                getBounds: function() {
                    return [this._maxLeftOffset, this._maxRightOffset]
                },
                calcOffsetRatio: function(e) {
                    var endEventData = eventUtils.eventData(e);
                    return (endEventData.x - (this._savedEventData && this._savedEventData.x || 0)) / this._itemSizeFunc().call(this, e)
                },
                isFastSwipe: function(e) {
                    var endEventData = eventUtils.eventData(e);
                    return this.FAST_SWIPE_SPEED_LIMIT * Math.abs(endEventData.x - this._tickData.x) >= endEventData.time - this._tickData.time
                }
            };
        var VerticalStrategy = {
                defaultItemSizeFunc: function() {
                    return this.getElement().height()
                },
                getBounds: function() {
                    return [this._maxTopOffset, this._maxBottomOffset]
                },
                calcOffsetRatio: function(e) {
                    var endEventData = eventUtils.eventData(e);
                    return (endEventData.y - (this._savedEventData && this._savedEventData.y || 0)) / this._itemSizeFunc().call(this, e)
                },
                isFastSwipe: function(e) {
                    var endEventData = eventUtils.eventData(e);
                    return this.FAST_SWIPE_SPEED_LIMIT * Math.abs(endEventData.y - this._tickData.y) >= endEventData.time - this._tickData.time
                }
            };
        var STRATEGIES = {
                horizontal: HorizontalStrategy,
                vertical: VerticalStrategy
            };
        var SwipeEmitter = GestureEmitter.inherit({
                TICK_INTERVAL: 300,
                FAST_SWIPE_SPEED_LIMIT: 10,
                ctor: function(element) {
                    this.callBase(element);
                    this.direction = "horizontal";
                    this.elastic = true
                },
                _getStrategy: function() {
                    return STRATEGIES[this.direction]
                },
                _defaultItemSizeFunc: function() {
                    return this._getStrategy().defaultItemSizeFunc.call(this)
                },
                _itemSizeFunc: function() {
                    return this.itemSizeFunc || this._defaultItemSizeFunc
                },
                _init: function(e) {
                    this._tickData = eventUtils.eventData(e)
                },
                _start: function(e) {
                    this._savedEventData = eventUtils.eventData(e);
                    e = this._fireEvent(SWIPE_START_EVENT, e);
                    if (!e.cancel) {
                        this._maxLeftOffset = e.maxLeftOffset;
                        this._maxRightOffset = e.maxRightOffset;
                        this._maxTopOffset = e.maxTopOffset;
                        this._maxBottomOffset = e.maxBottomOffset
                    }
                },
                _move: function(e) {
                    var strategy = this._getStrategy(),
                        moveEventData = eventUtils.eventData(e),
                        offset = strategy.calcOffsetRatio.call(this, e);
                    offset = this._fitOffset(offset, this.elastic);
                    if (moveEventData.time - this._tickData.time > this.TICK_INTERVAL)
                        this._tickData = moveEventData;
                    this._fireEvent(SWIPE_EVENT, e, {offset: offset});
                    e.preventDefault()
                },
                _end: function(e) {
                    var strategy = this._getStrategy(),
                        offsetRatio = strategy.calcOffsetRatio.call(this, e),
                        isFast = strategy.isFastSwipe.call(this, e),
                        startOffset = offsetRatio,
                        targetOffset = this._calcTargetOffset(offsetRatio, isFast);
                    startOffset = this._fitOffset(startOffset, this.elastic);
                    targetOffset = this._fitOffset(targetOffset, false);
                    this._fireEvent(SWIPE_END_EVENT, e, {
                        offset: startOffset,
                        targetOffset: targetOffset
                    })
                },
                _fitOffset: function(offset, elastic) {
                    var strategy = this._getStrategy(),
                        bounds = strategy.getBounds.call(this);
                    if (offset < -bounds[0])
                        return elastic ? (-2 * bounds[0] + offset) / 3 : -bounds[0];
                    if (offset > bounds[1])
                        return elastic ? (2 * bounds[1] + offset) / 3 : bounds[1];
                    return offset
                },
                _calcTargetOffset: function(offsetRatio, isFast) {
                    var result;
                    if (isFast) {
                        result = Math.ceil(Math.abs(offsetRatio));
                        if (offsetRatio < 0)
                            result = -result
                    }
                    else
                        result = Math.round(offsetRatio);
                    return result
                }
            });
        registerEmitter({
            emitter: SwipeEmitter,
            events: [SWIPE_START_EVENT, SWIPE_EVENT, SWIPE_END_EVENT]
        })
    })(jQuery, DevExpress);
    /*! Module core, file ui.events.emitter.gesture.drag.js */
    (function($, DX, undefined) {
        var wrapToArray = DX.require("/utils/utils.array").wrapToArray,
            registerEvent = DX.require("/ui/events/ui.events.eventRegistrator"),
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            GestureEmitter = DX.require("/ui/events/ui.events.emitter.gesture"),
            registerEmitter = DX.require("/ui/events/ui.events.emitterRegistrator");
        var DRAG_START_EVENT = "dxdragstart",
            DRAG_EVENT = "dxdrag",
            DRAG_END_EVENT = "dxdragend",
            DRAG_ENTER_EVENT = "dxdragenter",
            DRAG_LEAVE_EVENT = "dxdragleave",
            DROP_EVENT = "dxdrop";
        var knownDropTargets = [],
            knownDropTargetSelectors = [],
            knownDropTargetConfigs = [];
        var dropTargetRegistration = {
                setup: function(element, data) {
                    var knownDropTarget = $.inArray(element, knownDropTargets) !== -1;
                    if (!knownDropTarget) {
                        knownDropTargets.push(element);
                        knownDropTargetSelectors.push([]);
                        knownDropTargetConfigs.push(data || {})
                    }
                },
                add: function(element, handleObj) {
                    var index = $.inArray(element, knownDropTargets);
                    var selector = handleObj.selector;
                    if ($.inArray(selector, knownDropTargetSelectors[index]) === -1)
                        knownDropTargetSelectors[index].push(selector)
                },
                teardown: function(element, data) {
                    var elementEvents = $._data(element, "events"),
                        handlersCount = 0;
                    $.each([DRAG_ENTER_EVENT, DRAG_LEAVE_EVENT, DROP_EVENT], function(_, eventName) {
                        var eventHandlers = elementEvents[eventName];
                        if (eventHandlers)
                            handlersCount += eventHandlers.length
                    });
                    if (!handlersCount) {
                        var index = $.inArray(element, knownDropTargets);
                        knownDropTargets.splice(index, 1);
                        knownDropTargetSelectors.splice(index, 1);
                        knownDropTargetConfigs.splice(index, 1)
                    }
                }
            };
        registerEvent(DRAG_ENTER_EVENT, dropTargetRegistration);
        registerEvent(DRAG_LEAVE_EVENT, dropTargetRegistration);
        registerEvent(DROP_EVENT, dropTargetRegistration);
        var getItemDelegatedTargets = function($element) {
                var dropTargetIndex = $.inArray($element.get(0), knownDropTargets),
                    dropTargetSelectors = knownDropTargetSelectors[dropTargetIndex];
                var $delegatedTargets = $element.find(dropTargetSelectors.join(", "));
                if ($.inArray(undefined, dropTargetSelectors) !== -1)
                    $delegatedTargets = $delegatedTargets.addBack();
                return $delegatedTargets
            };
        var getItemConfig = function($element) {
                var dropTargetIndex = $.inArray($element.get(0), knownDropTargets);
                return knownDropTargetConfigs[dropTargetIndex]
            };
        var getItemPosition = function(dropTargetConfig, $element) {
                if (dropTargetConfig.itemPositionFunc)
                    return dropTargetConfig.itemPositionFunc($element);
                else
                    return $element.offset()
            };
        var getItemSize = function(dropTargetConfig, $element) {
                if (dropTargetConfig.itemSizeFunc)
                    return dropTargetConfig.itemSizeFunc($element);
                return {
                        width: $element.width(),
                        height: $element.height()
                    }
            };
        var DragEmitter = GestureEmitter.inherit({
                ctor: function(element) {
                    this.callBase(element);
                    this.direction = "both"
                },
                _init: function(e) {
                    this._initEvent = e
                },
                _start: function(e) {
                    e = this._fireEvent(DRAG_START_EVENT, this._initEvent);
                    this._maxLeftOffset = e.maxLeftOffset;
                    this._maxRightOffset = e.maxRightOffset;
                    this._maxTopOffset = e.maxTopOffset;
                    this._maxBottomOffset = e.maxBottomOffset;
                    var dropTargets = wrapToArray(e.targetElements || (e.targetElements === null ? [] : knownDropTargets));
                    this._dropTargets = $.map(dropTargets, function(element) {
                        return $(element).get(0)
                    })
                },
                _move: function(e) {
                    var eventData = eventUtils.eventData(e),
                        dragOffset = this._calculateOffset(eventData);
                    this._fireEvent(DRAG_EVENT, e, {offset: dragOffset});
                    this._processDropTargets(e, dragOffset);
                    e.preventDefault()
                },
                _calculateOffset: function(eventData) {
                    return {
                            x: this._calculateXOffset(eventData),
                            y: this._calculateYOffset(eventData)
                        }
                },
                _calculateXOffset: function(eventData) {
                    if (this.direction !== "vertical") {
                        var offset = eventData.x - this._startEventData.x;
                        return this._fitOffset(offset, this._maxLeftOffset, this._maxRightOffset)
                    }
                    return 0
                },
                _calculateYOffset: function(eventData) {
                    if (this.direction !== "horizontal") {
                        var offset = eventData.y - this._startEventData.y;
                        return this._fitOffset(offset, this._maxTopOffset, this._maxBottomOffset)
                    }
                    return 0
                },
                _fitOffset: function(offset, minOffset, maxOffset) {
                    if (minOffset != null)
                        offset = Math.max(offset, -minOffset);
                    if (maxOffset != null)
                        offset = Math.min(offset, maxOffset);
                    return offset
                },
                _processDropTargets: function(e, dragOffset) {
                    var target = this._findDropTarget(e),
                        sameTarget = target === this._currentDropTarget;
                    if (!sameTarget) {
                        this._fireDropTargetEvent(e, DRAG_LEAVE_EVENT);
                        this._currentDropTarget = target;
                        this._fireDropTargetEvent(e, DRAG_ENTER_EVENT)
                    }
                },
                _fireDropTargetEvent: function(event, eventName) {
                    if (!this._currentDropTarget)
                        return;
                    var eventData = {
                            type: eventName,
                            originalEvent: event,
                            draggingElement: this._$element.get(0),
                            target: this._currentDropTarget
                        };
                    eventUtils.fireEvent(eventData)
                },
                _findDropTarget: function(e) {
                    var that = this,
                        result;
                    $.each(knownDropTargets, function(_, target) {
                        if (!that._checkDropTargetActive(target))
                            return;
                        var $target = $(target);
                        $.each(getItemDelegatedTargets($target), function(_, delegatedTarget) {
                            var $delegatedTarget = $(delegatedTarget);
                            if (that._checkDropTarget(getItemConfig($target), $delegatedTarget, e))
                                result = delegatedTarget
                        })
                    });
                    return result
                },
                _checkDropTargetActive: function(target) {
                    var active = false;
                    $.each(this._dropTargets, function(_, activeTarget) {
                        active = active || activeTarget === target || $.contains(activeTarget, target);
                        return !active
                    });
                    return active
                },
                _checkDropTarget: function(config, $target, e) {
                    var isDraggingElement = $target.get(0) === this._$element.get(0);
                    if (isDraggingElement)
                        return false;
                    var targetPosition = getItemPosition(config, $target);
                    if (e.pageX < targetPosition.left)
                        return false;
                    if (e.pageY < targetPosition.top)
                        return false;
                    var targetSize = getItemSize(config, $target);
                    if (e.pageX > targetPosition.left + targetSize.width)
                        return false;
                    if (e.pageY > targetPosition.top + targetSize.height)
                        return false;
                    return $target
                },
                _end: function(e) {
                    var eventData = eventUtils.eventData(e);
                    this._fireEvent(DRAG_END_EVENT, e, {offset: this._calculateOffset(eventData)});
                    this._fireDropTargetEvent(e, DROP_EVENT);
                    delete this._currentDropTarget
                }
            });
        registerEmitter({
            emitter: DragEmitter,
            events: [DRAG_START_EVENT, DRAG_EVENT, DRAG_END_EVENT]
        });
        DX.ui.events.__internals = DX.ui.events.__internals || {};
        $.extend(DX.ui.events.__internals, {dropTargets: knownDropTargets})
    })(jQuery, DevExpress);
    /*! Module core, file ui.events.emitter.transform.js */
    (function($, DX, undefined) {
        var mathUtils = DX.require("/utils/utils.math"),
            errors = DX.require("/ui/ui.errors"),
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            Emitter = DX.require("/ui/events/ui.events.emitter"),
            registerEmitter = DX.require("/ui/events/ui.events.emitterRegistrator");
        var DX_PREFIX = "dx",
            TRANSFORM = "transform",
            TRANSLATE = "translate",
            ZOOM = "zoom",
            PINCH = "pinch",
            ROTATE = "rotate",
            START_POSTFIX = "start",
            UPDATE_POSTFIX = "",
            END_POSTFIX = "end";
        var eventAliases = [];
        var addAlias = function(eventName, eventArgs) {
                eventAliases.push({
                    name: eventName,
                    args: eventArgs
                })
            };
        addAlias(TRANSFORM, {
            scale: true,
            deltaScale: true,
            rotation: true,
            deltaRotation: true,
            translation: true,
            deltaTranslation: true
        });
        addAlias(TRANSLATE, {
            translation: true,
            deltaTranslation: true
        });
        addAlias(ZOOM, {
            scale: true,
            deltaScale: true
        });
        addAlias(PINCH, {
            scale: true,
            deltaScale: true
        });
        addAlias(ROTATE, {
            rotation: true,
            deltaRotation: true
        });
        var getVector = function(first, second) {
                return {
                        x: second.pageX - first.pageX,
                        y: -second.pageY + first.pageY,
                        centerX: (second.pageX + first.pageX) * 0.5,
                        centerY: (second.pageY + first.pageY) * 0.5
                    }
            };
        var getEventVector = function(e) {
                var pointers = e.pointers;
                return getVector(pointers[0], pointers[1])
            };
        var getDistance = function(vector) {
                return Math.sqrt(vector.x * vector.x + vector.y * vector.y)
            };
        var getScale = function(firstVector, secondVector) {
                return getDistance(firstVector) / getDistance(secondVector)
            };
        var getRotation = function(firstVector, secondVector) {
                var scalarProduct = firstVector.x * secondVector.x + firstVector.y * secondVector.y;
                var distanceProduct = getDistance(firstVector) * getDistance(secondVector);
                if (distanceProduct === 0)
                    return 0;
                var sign = mathUtils.sign(firstVector.x * secondVector.y - secondVector.x * firstVector.y);
                var angle = Math.acos(mathUtils.fitIntoRange(scalarProduct / distanceProduct, -1, 1));
                return sign * angle
            };
        var getTranslation = function(firstVector, secondVector) {
                return {
                        x: firstVector.centerX - secondVector.centerX,
                        y: firstVector.centerY - secondVector.centerY
                    }
            };
        var TransformEmitter = Emitter.inherit({
                configurate: function(data, eventName) {
                    if (eventName.indexOf(ZOOM) > -1)
                        errors.log("W0005", eventName, "15.1", "Use '" + eventName.replace(ZOOM, PINCH) + "' event instead");
                    this.callBase(data)
                },
                validatePointers: function(e) {
                    return eventUtils.hasTouches(e) > 1
                },
                start: function(e) {
                    this._accept(e);
                    var startVector = getEventVector(e);
                    this._startVector = startVector;
                    this._prevVector = startVector;
                    this._fireEventAliases(START_POSTFIX, e)
                },
                move: function(e) {
                    var currentVector = getEventVector(e),
                        eventArgs = this._getEventArgs(currentVector);
                    this._fireEventAliases(UPDATE_POSTFIX, e, eventArgs);
                    this._prevVector = currentVector
                },
                end: function(e) {
                    var eventArgs = this._getEventArgs(this._prevVector);
                    this._fireEventAliases(END_POSTFIX, e, eventArgs)
                },
                _getEventArgs: function(vector) {
                    return {
                            scale: getScale(vector, this._startVector),
                            deltaScale: getScale(vector, this._prevVector),
                            rotation: getRotation(vector, this._startVector),
                            deltaRotation: getRotation(vector, this._prevVector),
                            translation: getTranslation(vector, this._startVector),
                            deltaTranslation: getTranslation(vector, this._prevVector)
                        }
                },
                _fireEventAliases: function(eventPostfix, originalEvent, eventArgs) {
                    eventArgs = eventArgs || {};
                    $.each(eventAliases, $.proxy(function(_, eventAlias) {
                        var args = {};
                        $.each(eventAlias.args, function(name) {
                            if (name in eventArgs)
                                args[name] = eventArgs[name]
                        });
                        this._fireEvent(DX_PREFIX + eventAlias.name + eventPostfix, originalEvent, args)
                    }, this))
                }
            });
        registerEmitter({
            emitter: TransformEmitter,
            events: $.map(eventAliases, function(eventAlias) {
                var eventNames = [];
                $.each([START_POSTFIX, UPDATE_POSTFIX, END_POSTFIX], function(_, eventPostfix) {
                    eventNames.push(DX_PREFIX + eventAlias.name + eventPostfix)
                });
                return eventNames
            })
        })
    })(jQuery, DevExpress);
    /*! Module core, file ui.events.dblclick.js */
    (function($, DX, undefined) {
        var domUtils = DX.require("/utils/utils.dom"),
            Class = DX.require("/class"),
            registerEvent = DX.require("/ui/events/ui.events.eventRegistrator"),
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            DBLCLICK_EVENT_NAME = "dxdblclick",
            DBLCLICK_NAMESPACE = "dxDblClick",
            NAMESPACED_CLICK_EVENT = eventUtils.addNamespace("dxclick", DBLCLICK_NAMESPACE),
            DBLCLICK_TIMEOUT = 300;
        var DblClick = Class.inherit({
                ctor: function() {
                    this._handlerCount = 0;
                    this._forgetLastClick()
                },
                _forgetLastClick: function() {
                    this._firstClickTarget = null;
                    this._lastClickTimeStamp = -DBLCLICK_TIMEOUT
                },
                add: function() {
                    if (this._handlerCount <= 0)
                        $(document).on(NAMESPACED_CLICK_EVENT, $.proxy(this._clickHandler, this));
                    this._handlerCount++
                },
                _clickHandler: function(e) {
                    var timeStamp = e.timeStamp || $.now();
                    if (timeStamp - this._lastClickTimeStamp < DBLCLICK_TIMEOUT) {
                        eventUtils.fireEvent({
                            type: DBLCLICK_EVENT_NAME,
                            target: domUtils.closestCommonParent(this._firstClickTarget, e.target),
                            originalEvent: e
                        });
                        this._forgetLastClick()
                    }
                    else {
                        this._firstClickTarget = e.target;
                        this._lastClickTimeStamp = timeStamp
                    }
                },
                remove: function() {
                    this._handlerCount--;
                    if (this._handlerCount <= 0) {
                        this._forgetLastClick();
                        $(document).off(NAMESPACED_CLICK_EVENT)
                    }
                }
            });
        registerEvent(DBLCLICK_EVENT_NAME, new DblClick)
    })(jQuery, DevExpress);
    /*! Module core, file ui.events.contextmenu.js */
    (function($, DX, undefined) {
        var support = DX.require("/utils/utils.support"),
            devices = DX.require("/devices"),
            Class = DX.require("/class"),
            registerEvent = DX.require("/ui/events/ui.events.eventRegistrator"),
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            CONTEXTMENU_NAMESPACE = "dxContexMenu",
            CONTEXTMENU_NAMESPACED_EVENT_NAME = eventUtils.addNamespace("contextmenu", CONTEXTMENU_NAMESPACE),
            HOLD_NAMESPACED_EVENT_NAME = eventUtils.addNamespace("dxhold", CONTEXTMENU_NAMESPACE),
            CONTEXTMENU_EVENT_NAME = "dxcontextmenu";
        var ContextMenu = Class.inherit({
                setup: function(element, data) {
                    var $element = $(element);
                    $element.on(CONTEXTMENU_NAMESPACED_EVENT_NAME, $.proxy(this._contextMenuHandler, this));
                    if (support.touch || devices.isSimulator())
                        $element.on(HOLD_NAMESPACED_EVENT_NAME, $.proxy(this._holdHandler, this))
                },
                _holdHandler: function(e) {
                    if (eventUtils.isMouseEvent(e) && !devices.isSimulator())
                        return;
                    this._fireContextMenu(e)
                },
                _contextMenuHandler: function(e) {
                    e = this._fireContextMenu(e);
                    if (!e.cancel)
                        e.preventDefault()
                },
                _fireContextMenu: function(e) {
                    return eventUtils.fireEvent({
                            type: CONTEXTMENU_EVENT_NAME,
                            originalEvent: e
                        })
                },
                teardown: function(element) {
                    $(element).off("." + CONTEXTMENU_NAMESPACE)
                }
            });
        registerEvent(CONTEXTMENU_EVENT_NAME, new ContextMenu)
    })(jQuery, DevExpress);
    /*! Module core, file ui.dataHelper.js */
    DevExpress.define("/ui/ui.dataHelper", ["jquery"], function($) {
        var data = DevExpress.data;
        var DATA_SOURCE_OPTIONS_METHOD = "_dataSourceOptions",
            DATA_SOURCE_CHANGED_METHOD = "_dataSourceChangedHandler",
            DATA_SOURCE_LOAD_ERROR_METHOD = "_dataSourceLoadErrorHandler",
            DATA_SOURCE_LOADING_CHANGED_METHOD = "_dataSourceLoadingChangedHandler";
        var DataHelperMixin = {
                postCtor: function() {
                    this.on("disposing", function() {
                        this._disposeDataSource()
                    })
                },
                _refreshDataSource: function() {
                    this._initDataSource();
                    this._loadDataSource()
                },
                _initDataSource: function() {
                    var dataSourceOptions = this.option("dataSource"),
                        widgetDataSourceOptions,
                        dataSourceType;
                    this._disposeDataSource();
                    if (dataSourceOptions) {
                        if (dataSourceOptions instanceof data.DataSource) {
                            this._isSharedDataSource = true;
                            this._dataSource = dataSourceOptions
                        }
                        else {
                            widgetDataSourceOptions = DATA_SOURCE_OPTIONS_METHOD in this ? this[DATA_SOURCE_OPTIONS_METHOD]() : {};
                            dataSourceType = this._dataSourceType ? this._dataSourceType() : data.DataSource;
                            this._dataSource = new dataSourceType($.extend(true, {}, widgetDataSourceOptions, data.utils.normalizeDataSourceOptions(dataSourceOptions)))
                        }
                        this._addDataSourceHandlers()
                    }
                },
                _addDataSourceHandlers: function() {
                    if (DATA_SOURCE_CHANGED_METHOD in this)
                        this._addDataSourceChangeHandler();
                    if (DATA_SOURCE_LOAD_ERROR_METHOD in this)
                        this._addDataSourceLoadErrorHandler();
                    if (DATA_SOURCE_LOADING_CHANGED_METHOD in this)
                        this._addDataSourceLoadingChangedHandler();
                    this._addReadyWatcher()
                },
                _addReadyWatcher: function() {
                    this._dataSource.on("loadingChanged", $.proxy(function(isLoading) {
                        this._ready && this._ready(!isLoading)
                    }, this))
                },
                _addDataSourceChangeHandler: function() {
                    var dataSource = this._dataSource;
                    this._proxiedDataSourceChangedHandler = $.proxy(function() {
                        this[DATA_SOURCE_CHANGED_METHOD](dataSource.items())
                    }, this);
                    dataSource.on("changed", this._proxiedDataSourceChangedHandler)
                },
                _addDataSourceLoadErrorHandler: function() {
                    this._proxiedDataSourceLoadErrorHandler = $.proxy(this[DATA_SOURCE_LOAD_ERROR_METHOD], this);
                    this._dataSource.on("loadError", this._proxiedDataSourceLoadErrorHandler)
                },
                _addDataSourceLoadingChangedHandler: function() {
                    this._proxiedDataSourceLoadingChangedHandler = $.proxy(this[DATA_SOURCE_LOADING_CHANGED_METHOD], this);
                    this._dataSource.on("loadingChanged", this._proxiedDataSourceLoadingChangedHandler)
                },
                _loadDataSource: function() {
                    if (this._dataSource) {
                        var dataSource = this._dataSource;
                        if (dataSource.isLoaded())
                            this._proxiedDataSourceChangedHandler && this._proxiedDataSourceChangedHandler();
                        else
                            dataSource.load()
                    }
                },
                _loadSingle: function(key, value) {
                    key = key === "this" ? this._dataSource.key() || "this" : key;
                    return this._dataSource.loadSingle(key, value)
                },
                _isLastPage: function() {
                    return !this._dataSource || this._dataSource.isLastPage() || !this._dataSource._pageSize
                },
                _isDataSourceLoading: function() {
                    return this._dataSource && this._dataSource.isLoading()
                },
                _disposeDataSource: function() {
                    if (this._dataSource) {
                        if (this._isSharedDataSource) {
                            delete this._isSharedDataSource;
                            this._proxiedDataSourceChangedHandler && this._dataSource.off("changed", this._proxiedDataSourceChangedHandler);
                            this._proxiedDataSourceLoadErrorHandler && this._dataSource.off("loadError", this._proxiedDataSourceLoadErrorHandler);
                            this._proxiedDataSourceLoadingChangedHandler && this._dataSource.off("loadingChanged", this._proxiedDataSourceLoadingChangedHandler)
                        }
                        else
                            this._dataSource.dispose();
                        delete this._dataSource;
                        delete this._proxiedDataSourceChangedHandler;
                        delete this._proxiedDataSourceLoadErrorHandler;
                        delete this._proxiedDataSourceLoadingChangedHandler
                    }
                }
            };
        return DataHelperMixin
    });
    /*! Module core, file ui.dataExpression.js */
    DevExpress.define("/ui/ui.dataExpression", ["jquery", "/utils/utils.knockout", "/utils/utils.common", "/ui/templates/ui.template.function", "/ui/ui.dataHelper"], function($, koUtils, commonUtils, FunctionTempalte, DataHelperMixin) {
        var dataUtils = DevExpress.data.utils;
        var DataExpressionMixin = $.extend(DataHelperMixin, {
                _dataExpressionDefaultOptions: function() {
                    return {
                            items: [],
                            dataSource: null,
                            itemTemplate: "item",
                            value: null,
                            valueExpr: "this",
                            displayExpr: undefined
                        }
                },
                _initDataExpressions: function() {
                    this._compileValueGetter();
                    this._compileDisplayGetter();
                    this._initDynamicTemplates();
                    this._initDataSource();
                    this._itemsToDataSource()
                },
                _itemsToDataSource: function() {
                    if (!this.option("dataSource"))
                        this._dataSource = new DevExpress.data.DataSource({
                            store: new DevExpress.data.ArrayStore(this.option("items")),
                            pageSize: 0
                        })
                },
                _compileDisplayGetter: function() {
                    this._displayGetter = dataUtils.compileGetter(this._displayGetterExpr())
                },
                _displayGetterExpr: function() {
                    return this.option("displayExpr")
                },
                _compileValueGetter: function() {
                    this._valueGetter = dataUtils.compileGetter(this._valueGetterExpr())
                },
                _valueGetterExpr: function() {
                    return this.option("valueExpr") || "this"
                },
                _loadValue: function(value) {
                    var deferred = $.Deferred();
                    value = this._unwrappedValue(value);
                    if (!commonUtils.isDefined(value))
                        return deferred.reject().promise();
                    this._loadSingle(this._valueGetterExpr(), value).done($.proxy(function(item) {
                        this._isValueEquals(this._valueGetter(item), value) ? deferred.resolve(item) : deferred.reject()
                    }, this)).fail(function() {
                        deferred.reject()
                    });
                    return deferred.promise()
                },
                _unwrappedValue: function(value) {
                    value = commonUtils.isDefined(value) ? value : this.option("value");
                    if (value && this._dataSource && this._valueGetterExpr() === "this") {
                        var key = this._dataSource.key();
                        if (key && typeof value === "object")
                            value = value[key]
                    }
                    return koUtils.unwrapObservable(value)
                },
                _isValueEquals: function(value1, value2) {
                    var isDefined = commonUtils.isDefined;
                    var ensureDefined = commonUtils.ensureDefined;
                    var unwrapObservable = koUtils.unwrapObservable;
                    var dataSourceKey = this._dataSource && this._dataSource.key();
                    var result = this._compareValues(value1, value2);
                    if (!result && isDefined(value1) && isDefined(value2) && dataSourceKey) {
                        var valueKey1 = ensureDefined(unwrapObservable(value1[dataSourceKey]), value1);
                        var valueKey2 = ensureDefined(unwrapObservable(value2[dataSourceKey]), value2);
                        result = this._compareValues(valueKey1, valueKey2)
                    }
                    return result
                },
                _compareValues: function(value1, value2) {
                    return dataUtils.toComparable(value1) === dataUtils.toComparable(value2)
                },
                _initDynamicTemplates: function() {
                    if (this._displayGetterExpr())
                        this._dynamicTemplates["item"] = new FunctionTempalte($.proxy(function(data) {
                            return this._displayGetter(data)
                        }, this));
                    else
                        delete this._dynamicTemplates["item"]
                },
                _setCollectionWidgetItemTemplate: function() {
                    this._initDynamicTemplates();
                    this._setCollectionWidgetOption("itemTemplate", this._getTemplateByOption("itemTemplate"))
                },
                _dataExpressionOptionChanged: function(args) {
                    switch (args.name) {
                        case"items":
                            this._itemsToDataSource();
                            this._setCollectionWidgetOption("items");
                            break;
                        case"dataSource":
                            this._initDataSource();
                            break;
                        case"itemTemplate":
                            this._setCollectionWidgetItemTemplate();
                            break;
                        case"valueExpr":
                            this._compileValueGetter();
                            break;
                        case"displayExpr":
                            this._compileDisplayGetter();
                            this._setCollectionWidgetItemTemplate();
                            break
                    }
                }
            });
        return DataExpressionMixin
    });
    /*! Module core, file ui.CollectionWidget.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            domUtils = DX.require("/utils/utils.dom"),
            commonUtils = DX.require("/utils/utils.common"),
            Action = DX.require("/action"),
            Widget = DX.require("/ui/ui.widget"),
            eventUtils = DX.require("/ui/events/ui.events.utils"),
            pointerEvents = DX.require("/ui/events/pointer/ui.events.pointer"),
            DataHelperMixin = DX.require("/ui/ui.dataHelper"),
            selectors = DX.require("/integration/jquery/jquery.selectors");
        var COLLECTION_CLASS = "dx-collection",
            ITEM_CLASS = "dx-item",
            CONTENT_CLASS_POSTFIX = "-content",
            ITEM_CONTENT_PLACEHOLDER_CLASS = "dx-item-content-placeholder",
            ITEM_DATA_KEY = "dxItemData",
            ITEM_INDEX_KEY = "dxItemIndex",
            ITEM_TEMPLATE_ID_PREFIX = "tmpl-",
            ITEMS_SELECTOR = "[data-options*='dxItem']",
            SELECTED_ITEM_CLASS = "dx-item-selected",
            ITEM_RESPONSE_WAIT_CLASS = "dx-item-response-wait",
            EMPTY_COLLECTION = "dx-empty-collection",
            TEMPLATE_WRAPPER_CLASS = "dx-template-wrapper",
            DISABLED_STATE_CLASS = "dx-state-disabled",
            INVISIBLE_STATE_CLASS = "dx-state-invisible",
            ITEM_PATH_REGEX = /^items[\[\.](\d+)[\.\]].(\w+)/;
        var FOCUS_UP = "up",
            FOCUS_DOWN = "down",
            FOCUS_LEFT = "left",
            FOCUS_RIGHT = "right",
            FOCUS_PAGE_UP = "pageup",
            FOCUS_PAGE_DOWN = "pagedown",
            FOCUS_LAST = "last",
            FOCUS_FIRST = "first";
        var CollectionWidget = Widget.inherit({
                _activeStateUnit: "." + ITEM_CLASS,
                _supportedKeys: function() {
                    var click = function(e) {
                            var $itemElement = this.option("focusedElement");
                            if (!$itemElement)
                                return;
                            e.target = $itemElement;
                            e.currentTarget = $itemElement;
                            this._itemClickHandler(e)
                        },
                        move = function(location, e) {
                            e.preventDefault();
                            e.stopPropagation();
                            this._moveFocus(location, e)
                        };
                    return $.extend(this.callBase(), {
                            space: click,
                            enter: click,
                            leftArrow: $.proxy(move, this, FOCUS_LEFT),
                            rightArrow: $.proxy(move, this, FOCUS_RIGHT),
                            upArrow: $.proxy(move, this, FOCUS_UP),
                            downArrow: $.proxy(move, this, FOCUS_DOWN),
                            pageUp: $.proxy(move, this, FOCUS_UP),
                            pageDown: $.proxy(move, this, FOCUS_DOWN),
                            home: $.proxy(move, this, FOCUS_FIRST),
                            end: $.proxy(move, this, FOCUS_LAST)
                        })
                },
                _getDefaultOptions: function() {
                    return $.extend(this.callBase(), {
                            selectOnFocus: false,
                            loopItemFocus: true,
                            items: [],
                            itemTemplate: "item",
                            onItemRendered: null,
                            onItemClick: null,
                            onItemHold: null,
                            itemHoldTimeout: 750,
                            onItemContextMenu: null,
                            onFocusedItemChanged: null,
                            noDataText: Globalize.localize("dxCollectionWidget-noDataText"),
                            dataSource: null,
                            _itemAttributes: {},
                            itemTemplateProperty: "template",
                            focusOnSelectedItem: true,
                            focusedElement: null
                        })
                },
                _getAnonymousTemplateName: function() {
                    return "item"
                },
                _init: function() {
                    this.callBase();
                    this._cleanRenderedItems();
                    this._refreshDataSource()
                },
                _initTemplates: function() {
                    this._initItemsFromMarkup();
                    this.callBase()
                },
                _initItemsFromMarkup: function() {
                    var $items = this.element().contents().filter(ITEMS_SELECTOR);
                    if (!$items.length || this.option("items").length)
                        return;
                    var items = $.map($items, $.proxy(function(item) {
                            var $item = $(item);
                            var result = domUtils.getElementOptions(item).dxItem;
                            var isTemplateRequired = $.trim($item.html()) && !result.template;
                            if (isTemplateRequired)
                                result.template = this._prepareItemTemplate($item);
                            else
                                $item.remove();
                            return result
                        }, this));
                    this.option("items", items)
                },
                _prepareItemTemplate: function($item) {
                    var templateId = ITEM_TEMPLATE_ID_PREFIX + new DX.data.Guid;
                    var templateOptions = "dxTemplate: { name: \"" + templateId + "\" }";
                    $item.attr("data-options", templateOptions).data("options", templateOptions);
                    return templateId
                },
                _dataSourceOptions: function() {
                    return {paginate: false}
                },
                _cleanRenderedItems: function() {
                    this._renderedItemsCount = 0
                },
                _focusTarget: function() {
                    return this.element()
                },
                _focusInHandler: function(e) {
                    this.callBase.apply(this, arguments);
                    if ($.inArray(e.target, this._focusTarget()) === -1)
                        return;
                    var $focusedElement = this.option("focusedElement");
                    if ($focusedElement && $focusedElement.length)
                        this._setFocusedItem($focusedElement);
                    else {
                        var $activeItem = this._getActiveItem();
                        this.option("focusedElement", $activeItem)
                    }
                },
                _focusOutHandler: function(e) {
                    this.callBase.apply(this, arguments);
                    var $target = this.option("focusedElement");
                    if ($target)
                        this._toggleFocusClass(false, $target)
                },
                _getActiveItem: function(last) {
                    var $focusedElement = this.option("focusedElement");
                    if ($focusedElement && $focusedElement.length)
                        return $focusedElement;
                    var index = this.option("focusOnSelectedItem") ? this.option("selectedIndex") : 0,
                        activeElements = this._getActiveElement(),
                        lastIndex = activeElements.length - 1;
                    if (index < 0)
                        index = last ? lastIndex : 0;
                    return activeElements.eq(index)
                },
                _renderFocusTarget: function() {
                    this.callBase.apply(this, arguments);
                    this._refreshActiveDescendant()
                },
                _moveFocus: function(location) {
                    var $items = this._itemElements().filter(":visible").not(".dx-state-disabled"),
                        $newTarget;
                    switch (location) {
                        case FOCUS_PAGE_UP:
                        case FOCUS_UP:
                            $newTarget = this._prevItem($items);
                            break;
                        case FOCUS_PAGE_DOWN:
                        case FOCUS_DOWN:
                            $newTarget = this._nextItem($items);
                            break;
                        case FOCUS_RIGHT:
                            $newTarget = this.option("rtlEnabled") ? this._prevItem($items) : this._nextItem($items);
                            break;
                        case FOCUS_LEFT:
                            $newTarget = this.option("rtlEnabled") ? this._nextItem($items) : this._prevItem($items);
                            break;
                        case FOCUS_FIRST:
                            $newTarget = $items.first();
                            break;
                        case FOCUS_LAST:
                            $newTarget = $items.last();
                            break;
                        default:
                            return false
                    }
                    if ($newTarget.length !== 0)
                        this.option("focusedElement", $newTarget)
                },
                _prevItem: function($items) {
                    var $target = this._getActiveItem(),
                        targetIndex = $items.index($target),
                        $last = $items.last(),
                        $item = $($items[targetIndex - 1]),
                        loop = this.option("loopItemFocus");
                    if ($item.length === 0 && loop)
                        $item = $last;
                    return $item
                },
                _nextItem: function($items) {
                    var $target = this._getActiveItem(true),
                        targetIndex = $items.index($target),
                        $first = $items.first(),
                        $item = $($items[targetIndex + 1]),
                        loop = this.option("loopItemFocus");
                    if ($item.length === 0 && loop)
                        $item = $first;
                    return $item
                },
                _selectFocusedItem: function($target) {
                    this.selectItem($target)
                },
                _removeFocusedItem: function($target) {
                    if ($target && $target.length) {
                        this._toggleFocusClass(false, $target);
                        $target.removeAttr("id")
                    }
                },
                _refreshActiveDescendant: function() {
                    this.setAria("activedescendant", "");
                    this.setAria("activedescendant", this.getFocusedItemId())
                },
                _setFocusedItem: function($target) {
                    if (!$target || !$target.length)
                        return;
                    $target.attr("id", this.getFocusedItemId());
                    this._toggleFocusClass(true, $target);
                    this.onFocusedItemChanged(this.getFocusedItemId());
                    this._refreshActiveDescendant();
                    if (this.option("selectOnFocus"))
                        this._selectFocusedItem($target)
                },
                _findItemElementByIndex: function(index) {
                    var result = $();
                    this.itemElements().each(function() {
                        var $item = $(this);
                        if ($item.data(ITEM_INDEX_KEY) === index) {
                            result = $item;
                            return false
                        }
                    });
                    return result
                },
                _itemOptionChanged: function(index, property, value) {
                    var $item = this._findItemElementByIndex(index),
                        itemData = this._getItemData($item);
                    switch (property) {
                        case"visible":
                            this._renderItemVisibleState($item, value);
                            break;
                        case"disabled":
                            this._renderItemDisableState($item, value);
                            break;
                        default:
                            this._renderItem(index, itemData, null, $item);
                            break
                    }
                },
                _renderItemVisibleState: function($item, value) {
                    $item.toggleClass(INVISIBLE_STATE_CLASS, !value)
                },
                _renderItemDisableState: function($item, value) {
                    $item.toggleClass(DISABLED_STATE_CLASS, !!value)
                },
                _optionChanged: function(args) {
                    if (args.name === "items") {
                        var matches = args.fullName.match(ITEM_PATH_REGEX);
                        if (matches && matches.length) {
                            this._itemOptionChanged(parseInt(matches[1], 10), matches[2], args.value);
                            return
                        }
                    }
                    switch (args.name) {
                        case"items":
                        case"_itemAttributes":
                        case"itemTemplateProperty":
                            this._cleanRenderedItems();
                            this._invalidate();
                            break;
                        case"dataSource":
                            this._refreshDataSource();
                            if (!this._dataSource)
                                this.option("items", []);
                            this._renderEmptyMessage();
                            break;
                        case"noDataText":
                            this._renderEmptyMessage();
                            break;
                        case"itemTemplate":
                            this._invalidate();
                            break;
                        case"onItemRendered":
                            this._createItemRenderAction();
                            break;
                        case"onItemClick":
                            break;
                        case"onItemHold":
                        case"itemHoldTimeout":
                            this._attachHoldEvent();
                            break;
                        case"onItemContextMenu":
                            this._attachContextMenuEvent();
                            break;
                        case"onFocusedItemChanged":
                            this.onFocusedItemChanged = this._createActionByOption("onFocusedItemChanged");
                            break;
                        case"selectOnFocus":
                        case"loopItemFocus":
                        case"focusOnSelectedItem":
                            break;
                        case"focusedElement":
                            this._removeFocusedItem(args.previousValue);
                            this._setFocusedItem(args.value);
                            break;
                        default:
                            this.callBase(args)
                    }
                },
                _loadNextPage: function() {
                    var dataSource = this._dataSource;
                    this._expectNextPageLoading();
                    dataSource.pageIndex(1 + dataSource.pageIndex());
                    return dataSource.load()
                },
                _expectNextPageLoading: function() {
                    this._startIndexForAppendedItems = 0
                },
                _expectLastItemLoading: function() {
                    this._startIndexForAppendedItems = -1
                },
                _forgetNextPageLoading: function() {
                    this._startIndexForAppendedItems = null
                },
                _dataSourceChangedHandler: function(newItems) {
                    var items = this.option("items");
                    if (this._initialized && items && this._shouldAppendItems()) {
                        this._renderedItemsCount = items.length;
                        if (!this._isLastPage() || this._startIndexForAppendedItems !== -1)
                            this.option().items = items.concat(newItems.slice(this._startIndexForAppendedItems));
                        this._forgetNextPageLoading();
                        this._renderContent();
                        this._renderFocusTarget()
                    }
                    else
                        this.option("items", newItems)
                },
                _dataSourceLoadErrorHandler: function() {
                    this._forgetNextPageLoading();
                    this.option("items", this.option("items"))
                },
                _shouldAppendItems: function() {
                    return this._startIndexForAppendedItems != null && this._allowDinamicItemsAppend()
                },
                _allowDinamicItemsAppend: function() {
                    return false
                },
                _clean: function() {
                    this._cleanFocusState();
                    this._cleanItemContainer()
                },
                _cleanItemContainer: function() {
                    this._itemContainer().empty()
                },
                _refresh: function() {
                    this._cleanRenderedItems();
                    this.callBase.apply(this, arguments)
                },
                _itemContainer: function() {
                    return this.element()
                },
                _itemClass: function() {
                    return ITEM_CLASS
                },
                _itemContentClass: function() {
                    return this._itemClass() + CONTENT_CLASS_POSTFIX
                },
                _selectedItemClass: function() {
                    return SELECTED_ITEM_CLASS
                },
                _itemResponseWaitClass: function() {
                    return ITEM_RESPONSE_WAIT_CLASS
                },
                _itemSelector: function() {
                    return "." + this._itemClass()
                },
                _itemDataKey: function() {
                    return ITEM_DATA_KEY
                },
                _itemIndexKey: function() {
                    return ITEM_INDEX_KEY
                },
                _itemElements: function() {
                    return this._itemContainer().find(this._itemSelector())
                },
                _render: function() {
                    this.onFocusedItemChanged = this._createActionByOption("onFocusedItemChanged");
                    this.callBase();
                    this.element().addClass(COLLECTION_CLASS);
                    this._attachClickEvent();
                    this._attachHoldEvent();
                    this._attachContextMenuEvent()
                },
                _attachClickEvent: function() {
                    var itemSelector = this._itemSelector(),
                        clickEventNamespace = eventUtils.addNamespace("dxclick", this.NAME),
                        pointerDownEventNamespace = eventUtils.addNamespace(pointerEvents.down, this.NAME),
                        that = this;
                    var pointerDownAction = new Action(function(args) {
                            var event = args.event;
                            that._itemPointerDownHandler(event)
                        });
                    this._itemContainer().off(clickEventNamespace, itemSelector).off(pointerDownEventNamespace, itemSelector).on(clickEventNamespace, itemSelector, $.proxy(function(e) {
                        this._itemClickHandler(e)
                    }, this)).on(pointerDownEventNamespace, itemSelector, function(e) {
                        pointerDownAction.execute({
                            element: $(e.target),
                            event: e
                        })
                    })
                },
                _itemClickHandler: function(e, args, config) {
                    this._itemJQueryEventHandler(e, "onItemClick", args, config)
                },
                _itemPointerDownHandler: function(e) {
                    if (!this.option("focusStateEnabled"))
                        return;
                    var $target = $(e.target),
                        $closestItem = $target.closest(this._itemElements()),
                        $closestFocusable = $target.closest(selectors.focusable);
                    if ($closestItem.length && $.inArray($closestFocusable.get(0), this._focusTarget()) !== -1)
                        this.option("focusedElement", $closestItem)
                },
                _attachHoldEvent: function() {
                    var $itemContainer = this._itemContainer(),
                        itemSelector = this._itemSelector(),
                        eventName = eventUtils.addNamespace("dxhold", this.NAME);
                    $itemContainer.off(eventName, itemSelector);
                    if (this._shouldAttachHoldEvent())
                        $itemContainer.on(eventName, itemSelector, {timeout: this._getHoldTimeout()}, $.proxy(this._itemHoldHandler, this))
                },
                _getHoldTimeout: function() {
                    return this.option("itemHoldTimeout")
                },
                _shouldAttachHoldEvent: function() {
                    return this.option("onItemHold")
                },
                _itemHoldHandler: function(e) {
                    this._itemJQueryEventHandler(e, "onItemHold")
                },
                _attachContextMenuEvent: function() {
                    var $itemContainer = this._itemContainer(),
                        itemSelector = this._itemSelector(),
                        eventName = eventUtils.addNamespace("dxcontextmenu", this.NAME);
                    $itemContainer.off(eventName, itemSelector);
                    if (this._shouldAttachContextMenuEvent())
                        $itemContainer.on(eventName, itemSelector, $.proxy(this._itemContextMenuHandler, this))
                },
                _shouldAttachContextMenuEvent: function() {
                    return this.option("onItemContextMenu")
                },
                _itemContextMenuHandler: function(e) {
                    this._itemJQueryEventHandler(e, "onItemContextMenu")
                },
                _renderContentImpl: function() {
                    var items = this.option("items") || [];
                    if (this._renderedItemsCount)
                        this._renderItems(items.slice(this._renderedItemsCount));
                    else
                        this._renderItems(items)
                },
                _renderItems: function(items) {
                    if (items.length)
                        $.each(items, $.proxy(this._renderItem, this));
                    this._renderEmptyMessage()
                },
                _renderItem: function(index, itemData, $container, $itemToReplace) {
                    $container = $container || this._itemContainer();
                    var $itemFrame = this._renderItemFrame(index, itemData, $container, $itemToReplace);
                    this._setElementData($itemFrame, itemData, index);
                    $itemFrame.attr(this.option("_itemAttributes"));
                    this._attachItemClickEvent(itemData, $itemFrame);
                    var $itemContent = $itemFrame.find("." + ITEM_CONTENT_PLACEHOLDER_CLASS);
                    $itemContent.removeClass(ITEM_CONTENT_PLACEHOLDER_CLASS);
                    var renderContentPromise = this._renderItemContent(index, itemData, $itemContent);
                    var that = this;
                    $.when(renderContentPromise).done(function($itemContent) {
                        that._postprocessRenderItem({
                            itemElement: $itemFrame,
                            itemContent: $itemContent,
                            itemData: itemData,
                            itemIndex: index
                        });
                        that._executeItemRenderAction(index, itemData, $itemFrame)
                    });
                    return $itemFrame
                },
                _attachItemClickEvent: function(itemData, $itemElement) {
                    if (!itemData || !itemData.onClick)
                        return;
                    $itemElement.on("dxclick", $.proxy(function(e) {
                        this._itemEventHandlerByHandler($itemElement, itemData.onClick, {jQueryEvent: e})
                    }, this))
                },
                _renderItemContent: function(index, itemData, $container) {
                    var $itemNode = itemData && itemData.node;
                    var itemTemplateName = this._getItemTemplateName(itemData);
                    var itemTemplate = this._getTemplate(itemTemplateName, itemData, index, $container);
                    var renderArgs = {
                            index: index,
                            item: itemData,
                            container: $container
                        };
                    if ($itemNode) {
                        $container.replaceWith($itemNode);
                        $container = $itemNode;
                        this._addItemContentClasses($container, itemData)
                    }
                    else {
                        this._addItemContentClasses($container, itemData);
                        var $result = this._createItemByTemplate(itemTemplate, renderArgs);
                        if ($result.hasClass(TEMPLATE_WRAPPER_CLASS)) {
                            $container.replaceWith($result);
                            $container = $result;
                            this._addItemContentClasses($container, itemData)
                        }
                    }
                    return $container
                },
                _addItemContentClasses: function($container) {
                    $container.addClass([ITEM_CLASS + CONTENT_CLASS_POSTFIX, this._itemContentClass()].join(" "))
                },
                _renderItemFrame: function(index, itemData, $container, $itemToReplace) {
                    var itemFrameTemplate = this.option("templateProvider").getTemplates(this)["itemFrame"],
                        $itemFrame = itemFrameTemplate.render(commonUtils.isDefined(itemData) ? itemData : {}, $container, index);
                    if ($itemToReplace && $itemToReplace.length)
                        $itemToReplace.replaceWith($itemFrame);
                    else
                        $itemFrame.appendTo($container);
                    return $itemFrame
                },
                _postprocessRenderItem: $.noop,
                _executeItemRenderAction: function(index, itemData, itemElement) {
                    this._getItemRenderAction()({
                        itemElement: itemElement,
                        itemIndex: index,
                        itemData: itemData
                    })
                },
                _setElementData: function(element, data, index) {
                    element.addClass([ITEM_CLASS, this._itemClass()].join(" ")).data(this._itemDataKey(), data).data(this._itemIndexKey(), index)
                },
                _createItemRenderAction: function() {
                    return this._itemRenderAction = this._createActionByOption("onItemRendered", {
                            element: this.element(),
                            excludeValidators: ["designMode", "disabled", "readOnly"],
                            category: "rendering"
                        })
                },
                _getItemRenderAction: function() {
                    return this._itemRenderAction || this._createItemRenderAction()
                },
                _getItemTemplateName: function(itemData) {
                    var templateProperty = this.option("itemTemplateProperty");
                    return itemData && itemData[templateProperty] || this.option("itemTemplate")
                },
                _createItemByTemplate: function(itemTemplate, renderArgs) {
                    return itemTemplate.render(renderArgs.item, renderArgs.container, renderArgs.index, "ignoreTarget")
                },
                _renderEmptyMessage: function() {
                    var noDataText = this.option("noDataText"),
                        items = this.option("items"),
                        hideNoData = !noDataText || items && items.length || this._isDataSourceLoading();
                    if (hideNoData && this._$nodata) {
                        this._$nodata.remove();
                        this._$nodata = null;
                        this.setAria("label", undefined)
                    }
                    if (!hideNoData) {
                        this._$nodata = this._$nodata || $("<div>").addClass("dx-empty-message");
                        this._$nodata.appendTo(this._itemContainer()).html(noDataText);
                        this.setAria("label", noDataText)
                    }
                    this.element().toggleClass(EMPTY_COLLECTION, !hideNoData)
                },
                _itemJQueryEventHandler: function(jQueryEvent, handlerOptionName, actionArgs, actionConfig) {
                    this._itemEventHandler(jQueryEvent.target, handlerOptionName, $.extend(actionArgs, {jQueryEvent: jQueryEvent}), actionConfig)
                },
                _itemEventHandler: function(initiator, handlerOptionName, actionArgs, actionConfig) {
                    var action = this._createActionByOption(handlerOptionName, $.extend({validatingTargetName: "itemElement"}, actionConfig));
                    return this._itemEventHandlerImpl(initiator, action, actionArgs)
                },
                _itemEventHandlerByHandler: function(initiator, handler, actionArgs, actionConfig) {
                    var action = this._createAction(handler, $.extend({validatingTargetName: "itemElement"}, actionConfig));
                    return this._itemEventHandlerImpl(initiator, action, actionArgs)
                },
                _itemEventHandlerImpl: function(initiator, action, actionArgs) {
                    var $itemElement = this._closestItemElement($(initiator));
                    return action($.extend(this._extendActionArgs($itemElement), actionArgs))
                },
                _extendActionArgs: function($itemElement) {
                    return {
                            itemElement: $itemElement,
                            itemIndex: this._itemElements().index($itemElement),
                            itemData: this._getItemData($itemElement)
                        }
                },
                _closestItemElement: function($element) {
                    return $($element).closest(this._itemSelector())
                },
                _getItemData: function(itemElement) {
                    return $(itemElement).data(this._itemDataKey())
                },
                getFocusedItemId: function() {
                    if (!this._focusedItemId)
                        this._focusedItemId = new DevExpress.data.Guid;
                    return this._focusedItemId
                },
                itemElements: function() {
                    return this._itemElements()
                },
                itemsContainer: function() {
                    return this._itemContainer()
                }
            }).include(DataHelperMixin);
        CollectionWidget.publicName("CollectionWidget");
        ui.CollectionWidget = CollectionWidget
    })(jQuery, DevExpress);
    /*! Module core, file ui.CollectionWidget.edit.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            errors = DX.require("/ui/ui.errors"),
            arrayUtils = DX.require("/utils/utils.array"),
            commonUtils = DX.require("/utils/utils.common");
        var ITEM_DELETING_DATA_KEY = "dxItemDeleting";
        var CollectionWidget = ui.CollectionWidget.inherit({
                _setOptionsByReference: function() {
                    this.callBase();
                    $.extend(this._optionsByReference, {selectedItem: true})
                },
                _getDefaultOptions: function() {
                    return $.extend(this.callBase(), {
                            selectionMode: 'none',
                            selectionRequired: false,
                            selectionByClick: true,
                            selectedItems: [],
                            selectedIndex: -1,
                            selectedItem: null,
                            onSelectionChanged: null,
                            onItemReordered: null,
                            onItemDeleting: null,
                            onItemDeleted: null
                        })
                },
                _init: function() {
                    this._initEditStrategy();
                    this.callBase();
                    this._selectedItemIndices = []
                },
                _initEditStrategy: function() {
                    var strategy = ui.CollectionWidget.PlainEditStrategy;
                    this._editStrategy = new strategy(this)
                },
                _forgetNextPageLoading: function() {
                    this.callBase();
                    this._selectedItemIndices = this._editStrategy.selectedItemIndices()
                },
                _render: function() {
                    this._syncSelectionOptions();
                    this._normalizeSelectedItems();
                    this._initSelectedItems();
                    this.callBase();
                    this._renderSelection(this._selectedItemIndices, [])
                },
                _syncSelectionOptions: function(byOption) {
                    byOption = byOption || this._chooseSelectOption();
                    var selectedItem,
                        selectedItems;
                    switch (byOption) {
                        case"selectedIndex":
                            selectedItem = this._editStrategy.getItemDataByIndex(this.option("selectedIndex"));
                            if (commonUtils.isDefined(selectedItem)) {
                                this._setOptionSilent("selectedItems", [selectedItem]);
                                this._setOptionSilent("selectedItem", selectedItem)
                            }
                            else {
                                this._setOptionSilent("selectedItems", []);
                                this._setOptionSilent("selectedItem", null)
                            }
                            break;
                        case"selectedItems":
                            selectedItems = this.option("selectedItems") || [];
                            this._setOptionSilent("selectedItem", selectedItems[0]);
                            this._setOptionSilent("selectedIndex", this._editStrategy.getIndexByItemData(selectedItems[0]));
                            break;
                        case"selectedItem":
                            selectedItem = this.option("selectedItem");
                            if (commonUtils.isDefined(selectedItem)) {
                                this._setOptionSilent("selectedItems", [selectedItem]);
                                this._setOptionSilent("selectedIndex", this._editStrategy.getIndexByItemData(selectedItem))
                            }
                            else {
                                this._setOptionSilent("selectedItems", []);
                                this._setOptionSilent("selectedIndex", -1)
                            }
                            break
                    }
                },
                _chooseSelectOption: function() {
                    var optionName = "selectedIndex";
                    if (this.option("selectedItems").length)
                        optionName = "selectedItems";
                    else if (commonUtils.isDefined(this.option("selectedItem")))
                        optionName = "selectedItem";
                    return optionName
                },
                _normalizeSelectedItems: function() {
                    if (this.option("selectionMode") === "none") {
                        this._setOptionSilent("selectedItems", []);
                        this._syncSelectionOptions("selectedItems")
                    }
                    else if (this.option("selectionMode") === "single") {
                        var newSelection = this._editStrategy.selectedItemIndices(this.option("selectedItems"));
                        if (newSelection.length > 1 || !newSelection.length && this.option("selectionRequired") && this.option("items") && this.option("items").length) {
                            var normalizedSelection = [newSelection[0] || this._selectedItemIndices[0] || 0];
                            this._setOptionSilent("selectedItems", this._editStrategy.fetchSelectedItems(normalizedSelection));
                            this._syncSelectionOptions("selectedItems")
                        }
                    }
                },
                _initSelectedItems: function() {
                    this._selectedItemIndices = this._editStrategy.selectedItemIndices(this.option("selectedItems"))
                },
                _renderSelection: $.noop,
                _itemClickHandler: function(e) {
                    this._createAction($.proxy(function(e) {
                        this._itemSelectHandler(e.jQueryEvent)
                    }, this), {validatingTargetName: "itemElement"})({
                        itemElement: $(e.currentTarget),
                        jQueryEvent: e
                    });
                    this.callBase.apply(this, arguments)
                },
                _itemSelectHandler: function(e) {
                    if (!this.option("selectionByClick"))
                        return;
                    var $itemElement = e.currentTarget;
                    if (this.isItemSelected($itemElement))
                        this.unselectItem(e.currentTarget);
                    else
                        this.selectItem(e.currentTarget)
                },
                _selectedItemElement: function(index) {
                    return this._itemElements().eq(index)
                },
                _postprocessRenderItem: function(args) {
                    var $itemElement = $(args.itemElement);
                    if (this._isItemSelected(this._editStrategy.getNormalizedIndex($itemElement))) {
                        $itemElement.addClass(this._selectedItemClass());
                        this._setAriaSelected($itemElement, "true")
                    }
                    else
                        this._setAriaSelected($itemElement, "false")
                },
                _updateSelectedItems: function() {
                    var that = this,
                        oldSelection = this._selectedItemIndices.slice(),
                        newSelection = this._editStrategy.selectedItemIndices(),
                        addedSelection = arrayUtils.removeDublicates(newSelection, oldSelection),
                        removedSelection = arrayUtils.removeDublicates(oldSelection, newSelection);
                    $.each(removedSelection, function(_, normalizedIndex) {
                        that._removeSelection(normalizedIndex)
                    });
                    $.each(addedSelection, function(_, normalizedIndex) {
                        that._addSelection(normalizedIndex)
                    });
                    if (removedSelection.length || addedSelection.length) {
                        var selectionChangePromise = this._selectionChangePromise;
                        this._updateSelection(addedSelection, removedSelection);
                        $.when(selectionChangePromise).done(function() {
                            that._fireSelectionChangeEvent(addedSelection, removedSelection)
                        })
                    }
                },
                _fireSelectionChangeEvent: function(addedSelection, removedSelection) {
                    this._createActionByOption("onSelectionChanged", {excludeValidators: ["disabled", "readOnly"]})(this._editStrategy.fetchSelectionDifference(addedSelection, removedSelection))
                },
                _updateSelection: function() {
                    this._renderSelection.apply(this, arguments)
                },
                _setAriaSelected: function($target, value) {
                    this.setAria("selected", value, $target)
                },
                _removeSelection: function(normalizedIndex) {
                    var $itemElement = this._editStrategy.getItemElement(normalizedIndex),
                        itemSelectionIndex = $.inArray(normalizedIndex, this._selectedItemIndices);
                    if (itemSelectionIndex > -1) {
                        $itemElement.removeClass(this._selectedItemClass());
                        this._setAriaSelected($itemElement, "false");
                        this._selectedItemIndices.splice(itemSelectionIndex, 1);
                        $itemElement.triggerHandler("stateChanged")
                    }
                },
                _addSelection: function(normalizedIndex) {
                    var $itemElement = this._editStrategy.getItemElement(normalizedIndex);
                    if (normalizedIndex > -1 && !this._isItemSelected(normalizedIndex)) {
                        $itemElement.addClass(this._selectedItemClass());
                        this._setAriaSelected($itemElement, "true");
                        this._selectedItemIndices.push(normalizedIndex);
                        $itemElement.triggerHandler("stateChanged")
                    }
                },
                _isItemSelected: function(index) {
                    return $.inArray(index, this._selectedItemIndices) > -1
                },
                _optionChanged: function(args) {
                    if (this._cancelOptionChange)
                        return;
                    switch (args.name) {
                        case"selectionMode":
                            this._invalidate();
                            break;
                        case"selectedIndex":
                        case"selectedItem":
                        case"selectedItems":
                            this._syncSelectionOptions(args.name);
                            this._normalizeSelectedItems();
                            this._updateSelectedItems();
                            break;
                        case"selectionRequired":
                            this._normalizeSelectedItems();
                            this._updateSelectedItems();
                            break;
                        case"selectionByClick":
                        case"onSelectionChanged":
                        case"onItemDeleting":
                        case"onItemDeleted":
                        case"onItemReordered":
                            break;
                        default:
                            this.callBase(args)
                    }
                },
                _clearSelectedItems: function() {
                    this._selectedItemIndices = [];
                    this._setOptionSilent("selectedItems", []);
                    this._syncSelectionOptions("selectedItems")
                },
                _setOptionSilent: function(name, value) {
                    this._cancelOptionChange = true;
                    this.option(name, value);
                    this._cancelOptionChange = false
                },
                _waitDeletingPrepare: function($itemElement) {
                    if ($itemElement.data(ITEM_DELETING_DATA_KEY))
                        return $.Deferred().resolve().promise();
                    $itemElement.data(ITEM_DELETING_DATA_KEY, true);
                    var deferred = $.Deferred(),
                        deletePromise = this._itemEventHandler($itemElement, "onItemDeleting", {}, {excludeValidators: ["disabled", "readOnly"]});
                    $.when(deletePromise).always($.proxy(function(value) {
                        var deletePromiseExists = !deletePromise,
                            deletePromiseResolved = !deletePromiseExists && deletePromise.state() === "resolved",
                            argumentsSpecified = !!arguments.length,
                            shouldDelete = deletePromiseExists || deletePromiseResolved && !argumentsSpecified || deletePromiseResolved && value;
                        $itemElement.data(ITEM_DELETING_DATA_KEY, false);
                        shouldDelete ? deferred.resolve() : deferred.reject()
                    }, this));
                    return deferred.promise()
                },
                _deleteItemFromDS: function($item) {
                    if (!this._dataSource)
                        return $.Deferred().resolve().promise();
                    var deferred = $.Deferred(),
                        disabledState = this.option("disabled"),
                        dataStore = this._dataSource.store();
                    this.option("disabled", true);
                    if (!dataStore.remove)
                        throw errors.Error("E1011");
                    dataStore.remove(dataStore.keyOf(this._getItemData($item))).done(function(key) {
                        if (key !== undefined)
                            deferred.resolve();
                        else
                            deferred.reject()
                    }).fail(function() {
                        deferred.reject()
                    });
                    deferred.always($.proxy(function() {
                        this.option("disabled", disabledState)
                    }, this));
                    return deferred
                },
                _tryRefreshLastPage: function() {
                    var deferred = $.Deferred();
                    if (this._isLastPage() || this.option("grouped"))
                        deferred.resolve();
                    else
                        this._refreshLastPage().done(function() {
                            deferred.resolve()
                        });
                    return deferred.promise()
                },
                _refreshLastPage: function() {
                    this._expectLastItemLoading();
                    return this._dataSource.load()
                },
                _updateSelectionAfterDelete: function(fromIndex) {
                    var itemIndex = $.inArray(fromIndex, this._selectedItemIndices);
                    if (itemIndex > -1)
                        this._selectedItemIndices.splice(itemIndex, 1);
                    this._editStrategy.updateSelectionAfterDelete(fromIndex);
                    this.option("selectedItems", this._editStrategy.fetchSelectedItems())
                },
                _simulateOptionChange: function(optionName) {
                    var optionValue = this.option(optionName);
                    if (optionValue instanceof DX.data.DataSource)
                        return;
                    this.fireEvent("optionChanged", [{
                            name: optionName,
                            fullName: optionName,
                            value: optionValue
                        }])
                },
                isItemSelected: function(itemElement) {
                    return this._isItemSelected(this._editStrategy.getNormalizedIndex(itemElement))
                },
                selectItem: function(itemElement) {
                    var itemIndex = this._editStrategy.getNormalizedIndex(itemElement);
                    if (itemIndex === -1)
                        return;
                    var itemSelectionIndex = $.inArray(itemIndex, this._selectedItemIndices);
                    if (itemSelectionIndex !== -1)
                        return;
                    if (this.option("selectionMode") === "single")
                        this.option("selectedItems", this._editStrategy.fetchSelectedItems([itemIndex]));
                    else {
                        var newSelectedIndices = this._selectedItemIndices.slice();
                        newSelectedIndices.push(itemIndex);
                        this.option("selectedItems", this._editStrategy.fetchSelectedItems(newSelectedIndices))
                    }
                },
                unselectItem: function(itemElement) {
                    var itemIndex = this._editStrategy.getNormalizedIndex(itemElement);
                    if (itemIndex === -1)
                        return;
                    var itemSelectionIndex = $.inArray(itemIndex, this._selectedItemIndices);
                    if (itemSelectionIndex === -1)
                        return;
                    var newSelectedIndices = this._selectedItemIndices.slice();
                    newSelectedIndices.splice(itemSelectionIndex, 1);
                    if (this.option("selectionRequired") && newSelectedIndices.length === 0)
                        return;
                    this.option("selectedItems", this._editStrategy.fetchSelectedItems(newSelectedIndices))
                },
                deleteItem: function(itemElement) {
                    var that = this,
                        deferred = $.Deferred(),
                        $item = this._editStrategy.getItemElement(itemElement),
                        index = this._editStrategy.getNormalizedIndex(itemElement),
                        changingOption = this._dataSource ? "dataSource" : "items",
                        itemResponseWaitClass = this._itemResponseWaitClass();
                    if (index > -1)
                        this._waitDeletingPrepare($item).done(function() {
                            $item.addClass(itemResponseWaitClass);
                            var deletedActionArgs = that._extendActionArgs($item);
                            that._deleteItemFromDS($item).done(function() {
                                that._editStrategy.deleteItemAtIndex(index);
                                that._simulateOptionChange(changingOption);
                                that._updateSelectionAfterDelete(index);
                                that._itemEventHandler($item, "onItemDeleted", deletedActionArgs, {
                                    beforeExecute: function() {
                                        $item.detach()
                                    },
                                    excludeValidators: ["disabled", "readOnly"]
                                });
                                that._renderEmptyMessage();
                                that._tryRefreshLastPage().done(function() {
                                    deferred.resolveWith(that)
                                })
                            }).fail(function() {
                                $item.removeClass(itemResponseWaitClass);
                                deferred.rejectWith(that)
                            })
                        }).fail(function() {
                            deferred.rejectWith(that)
                        });
                    else
                        deferred.rejectWith(that);
                    return deferred.promise()
                },
                reorderItem: function(itemElement, toItemElement) {
                    var deferred = $.Deferred(),
                        that = this,
                        strategy = this._editStrategy,
                        $movingItem = strategy.getItemElement(itemElement),
                        $destinationItem = strategy.getItemElement(toItemElement),
                        movingIndex = strategy.getNormalizedIndex(itemElement),
                        destinationIndex = strategy.getNormalizedIndex(toItemElement),
                        changingOption;
                    var canMoveItems = movingIndex > -1 && destinationIndex > -1 && movingIndex !== destinationIndex;
                    if (canMoveItems)
                        if (this._dataSource) {
                            changingOption = "dataSource";
                            deferred.resolveWith(this)
                        }
                        else {
                            changingOption = "items";
                            deferred.resolveWith(this)
                        }
                    else
                        deferred.rejectWith(this);
                    return deferred.promise().done(function() {
                            $destinationItem[strategy.itemPlacementFunc(movingIndex, destinationIndex)]($movingItem);
                            var newSelectedItems = strategy.getSelectedItemsAfterReorderItem(movingIndex, destinationIndex);
                            strategy.moveItemAtIndexToIndex(movingIndex, destinationIndex);
                            that._selectedItemIndices = strategy.selectedItemIndices(newSelectedItems);
                            that.option("selectedItems", strategy.fetchSelectedItems());
                            that._simulateOptionChange(changingOption);
                            that._itemEventHandler($movingItem, "onItemReordered", {
                                fromIndex: strategy.getIndex(movingIndex),
                                toIndex: strategy.getIndex(destinationIndex)
                            }, {excludeValidators: ["disabled", "readOnly"]})
                        })
                }
            });
        ui.CollectionWidget = CollectionWidget
    })(jQuery, DevExpress);
    /*! Module core, file ui.collectionWidget.edit.strategy.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            Class = DevExpress.require("/class"),
            abstract = Class.abstract;
        ui.CollectionWidget.EditStrategy = Class.inherit({
            ctor: function(collectionWidget) {
                this._collectionWidget = collectionWidget
            },
            getIndexByItemData: abstract,
            getItemDataByIndex: abstract,
            getNormalizedIndex: function(value) {
                if (this._isNormalisedItemIndex(value))
                    return value;
                if (this._isItemIndex(value))
                    return this._normalizeItemIndex(value);
                if (this._isDOMNode(value))
                    return this._getNormalizedItemIndex(value);
                return this._normalizeItemIndex(this.getIndexByItemData(value))
            },
            getIndex: function(value) {
                if (this._isNormalisedItemIndex(value))
                    return this._denormalizeItemIndex(value);
                if (this._isItemIndex(value))
                    return value;
                if (this._isDOMNode(value))
                    return this._denormalizeItemIndex(this._getNormalizedItemIndex(value));
                return this.getIndexByItemData(value)
            },
            getItemElement: function(value) {
                if (this._isNormalisedItemIndex(value))
                    return this._getItemByNormalizedIndex(value);
                if (this._isItemIndex(value))
                    return this._getItemByNormalizedIndex(this._normalizeItemIndex(value));
                if (this._isDOMNode(value))
                    return $(value);
                return this._getItemByNormalizedIndex(this.getIndexByItemData(value))
            },
            deleteItemAtIndex: abstract,
            updateSelectionAfterDelete: abstract,
            fetchSelectedItems: abstract,
            fetchSelectionDifference: function(addedSelection, removedSelection) {
                return {
                        addedItems: this.fetchSelectedItems(addedSelection),
                        removedItems: this.fetchSelectedItems(removedSelection)
                    }
            },
            selectedItemIndices: abstract,
            itemPlacementFunc: function(movingIndex, destinationIndex) {
                return this._itemsFromSameParent(movingIndex, destinationIndex) && movingIndex < destinationIndex ? "after" : "before"
            },
            moveItemAtIndexToIndex: abstract,
            getSelectedItemsAfterReorderItem: function() {
                return this._collectionWidget.option("selectedItems")
            },
            _isNormalisedItemIndex: function(index) {
                return $.isNumeric(index)
            },
            _isDOMNode: function(value) {
                var $value = $(value);
                return $value.length && $value.get(0).nodeType
            },
            _isItemIndex: abstract,
            _getNormalizedItemIndex: abstract,
            _normalizeItemIndex: abstract,
            _denormalizeItemIndex: abstract,
            _getItemByNormalizedIndex: abstract,
            _itemsFromSameParent: abstract
        })
    })(jQuery, DevExpress);
    /*! Module core, file ui.collectionWidget.edit.strategy.plain.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            errors = DX.require("/ui/ui.errors"),
            arrayUtils = DX.require("/utils/utils.array");
        ui.CollectionWidget.PlainEditStrategy = ui.CollectionWidget.EditStrategy.inherit({
            _getPlainItems: function() {
                return this._collectionWidget.option("items") || []
            },
            getIndexByItemData: function(itemData) {
                return $.inArray(itemData, this._getPlainItems())
            },
            getItemDataByIndex: function(index) {
                return this._getPlainItems()[index]
            },
            deleteItemAtIndex: function(index) {
                this._getPlainItems().splice(index, 1)
            },
            updateSelectionAfterDelete: function(fromIndex) {
                var selectedItemIndices = this._collectionWidget._selectedItemIndices;
                $.each(selectedItemIndices, function(i, index) {
                    if (index > fromIndex)
                        selectedItemIndices[i] -= 1
                })
            },
            fetchSelectedItems: function(indices) {
                indices = indices || this._collectionWidget._selectedItemIndices;
                indices.sort(function(a, b) {
                    return a - b
                });
                var items = this._getPlainItems(),
                    selectedItems = [];
                $.each(indices, function(_, index) {
                    selectedItems.push(items[index])
                });
                if (this._collectionWidget._dataSource) {
                    var allSelectedItems = this._collectionWidget.option("selectedItems"),
                        unavaliableItems = $.grep(allSelectedItems, function(item) {
                            return $.inArray(item, items) === -1
                        });
                    selectedItems = selectedItems.concat(unavaliableItems)
                }
                return selectedItems
            },
            fetchSelectionDifference: function(addedSelection, removedSelection) {
                var difference = this.callBase(addedSelection, removedSelection);
                if (this._collectionWidget._dataSource) {
                    var addedItems = difference.addedItems,
                        removedItems = difference.removedItems,
                        duplicatedItems = arrayUtils.intersection(addedItems, removedItems);
                    $.each(duplicatedItems, function(_, item) {
                        var addedItemIndex = $.inArray(item, addedItems),
                            removedItemIndex = $.inArray(item, removedItems);
                        addedItems.splice(addedItemIndex, 1);
                        removedItems.splice(removedItemIndex, 1)
                    })
                }
                return difference
            },
            selectedItemIndices: function() {
                var selectedIndices = [],
                    items = this._getPlainItems(),
                    selected = this._collectionWidget.option("selectedItems"),
                    dataSource = this._collectionWidget._dataSource;
                $.each(selected, function(_, selectedItem) {
                    var index = $.inArray(selectedItem, items);
                    if (index !== -1)
                        selectedIndices.push(index);
                    else if (!dataSource)
                        errors.log("W1002", selectedItem)
                });
                return selectedIndices
            },
            moveItemAtIndexToIndex: function(movingIndex, destinationIndex) {
                var items = this._getPlainItems(),
                    movedItemData = items[movingIndex];
                items.splice(movingIndex, 1);
                items.splice(destinationIndex, 0, movedItemData)
            },
            _isItemIndex: function(index) {
                return $.isNumeric(index)
            },
            _getNormalizedItemIndex: function(itemElement) {
                return this._collectionWidget._itemElements().index(itemElement)
            },
            _normalizeItemIndex: function(index) {
                return index
            },
            _denormalizeItemIndex: function(index) {
                return index
            },
            _getItemByNormalizedIndex: function(index) {
                return index > -1 ? this._collectionWidget._itemElements().eq(index) : null
            },
            _itemsFromSameParent: function() {
                return true
            }
        })
    })(jQuery, DevExpress);
    /*! Module core, file ui.tooltip.js */
    DevExpress.define("/ui/ui.tooltip", ["jquery", "/utils/utils.viewPort"], function($, viewPortUtils) {
        var $tooltip = null;
        var createTooltip = function(options) {
                options = $.extend({position: "top"}, options);
                var content = options.content;
                delete options.content;
                return $("<div />").html(content).appendTo(viewPortUtils.value()).dxTooltip(options)
            };
        var removeTooltip = function() {
                if (!$tooltip)
                    return;
                $tooltip.remove();
                $tooltip = null
            };
        var tooltip = {
                show: function(options) {
                    removeTooltip();
                    $tooltip = createTooltip(options);
                    return $tooltip.dxTooltip("show")
                },
                hide: function() {
                    if (!$tooltip)
                        return $.when();
                    return $tooltip.dxTooltip("hide").done(removeTooltip).promise()
                }
            };
        return tooltip
    });
    DevExpress.MOD_CORE = true
}