/*! 
* DevExtreme (Gauges)
* Version: 15.1.5
* Build date: Jul 15, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!DevExpress.MOD_VIZ_GAUGES) {
    if (!DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-gauges, file namespaces.js */
    (function(DX) {
        DX.viz.gauges = {__internals: {
                circularNeedles: {},
                circularMarkers: {},
                linearNeedles: {},
                linearMarkers: {}
            }};
        DX.viz.gauges.__tests = {}
    })(DevExpress);
    /*! Module viz-gauges, file factory.js */
    (function(DX, $, undefined) {
        var internals = DX.viz.gauges.__internals,
            circularNeedles = internals.circularNeedles,
            circularMarkers = internals.circularMarkers,
            linearNeedles = internals.linearNeedles,
            linearMarkers = internals.linearMarkers,
            _String = String;
        DX.viz.gauges.__factory = {
            createCircularIndicator: function(parameters, type, _strict) {
                var indicatorType;
                switch (_String(type).toLowerCase()) {
                    case'rectangleneedle':
                        indicatorType = circularNeedles.RectangleNeedle;
                        break;
                    case'triangleneedle':
                        indicatorType = circularNeedles.TriangleNeedle;
                        break;
                    case'twocolorneedle':
                        indicatorType = circularNeedles.TwoColorRectangleNeedle;
                        break;
                    case'rangebar':
                        indicatorType = internals.CircularRangeBar;
                        break;
                    case'trianglemarker':
                        indicatorType = circularMarkers.TriangleMarker;
                        break;
                    case'textcloud':
                        indicatorType = circularMarkers.TextCloudMarker;
                        break;
                    default:
                        indicatorType = _strict ? null : circularNeedles.RectangleNeedle;
                        break
                }
                return indicatorType ? new indicatorType(parameters) : null
            },
            createLinearIndicator: function(parameters, type, _strict) {
                var indicatorType = internals.LinearRangeBar;
                switch (_String(type).toLowerCase()) {
                    case'rectangle':
                        indicatorType = linearNeedles.RectangleNeedle;
                        break;
                    case'rhombus':
                        indicatorType = linearNeedles.RhombusNeedle;
                        break;
                    case'circle':
                        indicatorType = linearNeedles.CircleNeedle;
                        break;
                    case'rangebar':
                        indicatorType = internals.LinearRangeBar;
                        break;
                    case'trianglemarker':
                        indicatorType = linearMarkers.TriangleMarker;
                        break;
                    case'textcloud':
                        indicatorType = linearMarkers.TextCloudMarker;
                        break;
                    default:
                        indicatorType = _strict ? null : internals.LinearRangeBar;
                        break
                }
                return indicatorType ? new indicatorType(parameters) : null
            },
            createCircularScale: function(parameters) {
                return new internals.CircularScale(parameters)
            },
            createLinearScale: function(parameters) {
                return new internals.LinearScale(parameters)
            },
            createCircularRangeContainer: function(parameters) {
                return new internals.CircularRangeContainer(parameters)
            },
            createLinearRangeContainer: function(parameters) {
                return new internals.LinearRangeContainer(parameters)
            },
            createTitle: function(parameters) {
                return new internals.Title(parameters)
            },
            createIndicator: function() {
                return internals.Indicator && new internals.Indicator || null
            },
            createLayoutManager: function() {
                return new internals.LayoutManager
            },
            createThemeManager: function(options) {
                return new internals.ThemeManager(options)
            },
            createTracker: function(parameters) {
                return new internals.Tracker(parameters)
            }
        };
        var _isFunction = DX.utils.isFunction,
            _extend = $.extend;
        var _formatHelper = DX.formatHelper;
        internals.formatValue = function(value, options, extra) {
            options = options || {};
            var text = _formatHelper.format(value, options.format, options.precision),
                context;
            if (_isFunction(options.customizeText)) {
                context = _extend({
                    value: value,
                    valueText: text
                }, extra);
                return _String(options.customizeText.call(context, context))
            }
            return text
        };
        internals.getSampleText = function(translator, options) {
            var text1 = internals.formatValue(translator.getDomainStart(), options),
                text2 = internals.formatValue(translator.getDomainEnd(), options);
            return text1.length >= text2.length ? text1 : text2
        }
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file baseIndicator.js */
    (function(DX, $, undefined) {
        var _isFinite = isFinite,
            _Number = Number;
        DX.viz.gauges.__internals.BaseElement = DX.Class.inherit({
            ctor: function(parameters) {
                var that = this;
                $.each(parameters, function(name, value) {
                    that["_" + name] = value
                });
                that._init()
            },
            dispose: function() {
                var that = this;
                $.each(that, function(name) {
                    that[name] = null
                });
                return that
            },
            getOffset: function() {
                return _Number(this._options.offset) || 0
            }
        });
        DX.viz.gauges.__internals.BaseIndicator = DX.viz.gauges.__internals.BaseElement.inherit({
            _init: function() {
                this._rootElement = this._createRoot();
                this._trackerElement = this._createTracker()
            },
            _setupAnimation: function() {
                var that = this;
                if (that._options.animation)
                    that._animation = {
                        step: function(pos) {
                            that._actualValue = that._animation.start + that._animation.delta * pos;
                            that._actualPosition = that._translator.translate(that._actualValue);
                            that._move()
                        },
                        duration: that._options.animation.duration > 0 ? _Number(that._options.animation.duration) : 0,
                        easing: that._options.animation.easing
                    }
            },
            _runAnimation: function(value, notifyReady) {
                var that = this,
                    animation = that._animation;
                animation.start = that._actualValue;
                animation.delta = value - that._actualValue;
                that._rootElement.animate({_: 0}, {
                    step: animation.step,
                    duration: animation.duration,
                    easing: animation.easing,
                    complete: notifyReady
                })
            },
            _createRoot: function() {
                return this._renderer.g().attr({'class': this._className})
            },
            _createTracker: function() {
                return this._renderer.path([], "area")
            },
            _getTrackerSettings: $.noop,
            clean: function() {
                var that = this;
                that._animation && that._rootElement.stopAnimation();
                that._rootElement.remove();
                that._rootElement.clear();
                that._clear();
                that._tracker.detach(that._trackerElement);
                that._options = that.enabled = that._animation = null;
                return that
            },
            render: function(options) {
                var that = this;
                that.type = options.type;
                that._options = options;
                that._actualValue = that._currentValue = that._translator.adjust(that._options.currentValue);
                that.enabled = that._isEnabled();
                if (that.enabled) {
                    that._setupAnimation();
                    that._rootElement.attr({fill: that._options.color}).append(that._owner);
                    that._tracker.attach(that._trackerElement, that, that._trackerInfo)
                }
                return that
            },
            resize: function(layout) {
                var that = this;
                that._rootElement.clear();
                that._clear();
                that.visible = that._isVisible(layout);
                if (that.visible) {
                    $.extend(that._options, layout);
                    that._actualPosition = that._translator.translate(that._actualValue);
                    that._render();
                    that._trackerElement.attr(that._getTrackerSettings());
                    that._move()
                }
                return that
            },
            value: function(arg, _noAnimation) {
                var that = this,
                    immediateReady = true,
                    val;
                if (arg !== undefined) {
                    val = that._translator.adjust(arg);
                    that._notifiers.dirty();
                    if (that._currentValue !== val && _isFinite(val)) {
                        that._currentValue = val;
                        if (that.visible)
                            if (that._animation && !_noAnimation) {
                                immediateReady = false;
                                that._runAnimation(val, that._notifiers.ready)
                            }
                            else {
                                that._actualValue = val;
                                that._actualPosition = that._translator.translate(val);
                                that._move()
                            }
                    }
                    immediateReady && that._notifiers.ready();
                    return that
                }
                return that._currentValue
            },
            _isEnabled: null,
            _isVisible: null,
            _render: null,
            _clear: null,
            _move: null
        })
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file baseMarker.js */
    (function(DX, undefined) {
        var viz = DX.viz,
            core = viz.core,
            _min = Math.min,
            _round = Math.round,
            _formatValue = viz.gauges.__internals.formatValue,
            _getSampleText = viz.gauges.__internals.getSampleText,
            COEFFICIENTS_MAP = {};
        COEFFICIENTS_MAP['right-bottom'] = COEFFICIENTS_MAP['rb'] = [0, -1, -1, 0, 0, 1, 1, 0];
        COEFFICIENTS_MAP['bottom-right'] = COEFFICIENTS_MAP['br'] = [-1, 0, 0, -1, 1, 0, 0, 1];
        COEFFICIENTS_MAP['left-bottom'] = COEFFICIENTS_MAP['lb'] = [0, -1, 1, 0, 0, 1, -1, 0];
        COEFFICIENTS_MAP['bottom-left'] = COEFFICIENTS_MAP['bl'] = [1, 0, 0, -1, -1, 0, 0, 1];
        COEFFICIENTS_MAP['left-top'] = COEFFICIENTS_MAP['lt'] = [0, 1, 1, 0, 0, -1, -1, 0];
        COEFFICIENTS_MAP['top-left'] = COEFFICIENTS_MAP['tl'] = [1, 0, 0, 1, -1, 0, 0, -1];
        COEFFICIENTS_MAP['right-top'] = COEFFICIENTS_MAP['rt'] = [0, 1, -1, 0, 0, -1, 1, 0];
        COEFFICIENTS_MAP['top-right'] = COEFFICIENTS_MAP['tr'] = [-1, 0, 0, 1, 1, 0, 0, -1];
        function getTextCloudInfo(options) {
            var x = options.x,
                y = options.y,
                type = COEFFICIENTS_MAP[options.type],
                cloudWidth = options.textWidth + 2 * options.horMargin,
                cloudHeight = options.textHeight + 2 * options.verMargin,
                tailWidth,
                tailHeight,
                cx = x,
                cy = y;
            tailWidth = tailHeight = options.tailLength;
            if (type[0] & 1)
                tailHeight = _min(tailHeight, cloudHeight / 3);
            else
                tailWidth = _min(tailWidth, cloudWidth / 3);
            return {
                    cx: _round(cx + type[0] * tailWidth + (type[0] + type[2]) * cloudWidth / 2),
                    cy: _round(cy + type[1] * tailHeight + (type[1] + type[3]) * cloudHeight / 2),
                    points: [_round(x), _round(y), _round(x += type[0] * (cloudWidth + tailWidth)), _round(y += type[1] * (cloudHeight + tailHeight)), _round(x += type[2] * cloudWidth), _round(y += type[3] * cloudHeight), _round(x += type[4] * cloudWidth), _round(y += type[5] * cloudHeight), _round(x += type[6] * (cloudWidth - tailWidth)), _round(y += type[7] * (cloudHeight - tailHeight))]
                }
        }
        viz.gauges.__tests.getTextCloudInfo = getTextCloudInfo;
        viz.gauges.__internals.BaseTextCloudMarker = viz.gauges.__internals.BaseIndicator.inherit({
            _move: function() {
                var that = this,
                    bbox,
                    info,
                    textCloudOptions = that._getTextCloudOptions();
                that._text.attr({text: _formatValue(that._actualValue, that._options.text)});
                bbox = that._text.getBBox();
                info = getTextCloudInfo({
                    x: textCloudOptions.x,
                    y: textCloudOptions.y,
                    textWidth: bbox.width,
                    textHeight: bbox.height,
                    horMargin: that._options.horizontalOffset,
                    verMargin: that._options.verticalOffset,
                    tailLength: that._options.arrowLength,
                    type: textCloudOptions.type
                });
                that._text.attr({
                    x: info.cx,
                    y: info.cy + that._textVerticalOffset
                });
                that._cloud.attr({points: info.points});
                that._trackerElement && that._trackerElement.attr({points: info.points})
            },
            _measureText: function() {
                var that = this,
                    root,
                    text,
                    bbox;
                if (!that._textVerticalOffset) {
                    root = that._createRoot().append(that._owner);
                    text = that._renderer.text(_getSampleText(that._translator, that._options.text), 0, 0).attr({align: "center"}).css(core.utils.patchFontOptions(that._options.text.font)).append(root);
                    bbox = text.getBBox();
                    root.remove();
                    that._textVerticalOffset = -bbox.y - bbox.height / 2;
                    that._textWidth = bbox.width;
                    that._textHeight = bbox.height;
                    that._textFullWidth = that._textWidth + 2 * that._options.horizontalOffset;
                    that._textFullHeight = that._textHeight + 2 * that._options.verticalOffset
                }
            },
            _render: function() {
                var that = this;
                that._measureText();
                that._cloud = that._cloud || that._renderer.path([], "area").append(that._rootElement);
                that._text = that._text || that._renderer.text().append(that._rootElement);
                that._text.attr({align: "center"}).css(core.utils.patchFontOptions(that._options.text.font))
            },
            _clear: function() {
                delete this._cloud;
                delete this._text
            },
            getTooltipParameters: function() {
                var position = this._getTextCloudOptions();
                return {
                        x: position.x,
                        y: position.y,
                        value: this._currentValue,
                        color: this._options.color
                    }
            }
        })
    })(DevExpress);
    /*! Module viz-gauges, file baseRangeBar.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            core = viz.core,
            $extend = $.extend,
            formatValue = viz.gauges.__internals.formatValue,
            getSampleText = viz.gauges.__internals.getSampleText;
        viz.gauges.__internals.BaseRangeBar = viz.gauges.__internals.BaseIndicator.inherit({
            _measureText: function() {
                var that = this,
                    root,
                    text,
                    bbox;
                that._hasText = that._isTextVisible();
                if (that._hasText && !that._textVerticalOffset) {
                    root = that._createRoot().append(that._owner);
                    text = that._renderer.text(getSampleText(that._translator, that._options.text), 0, 0).attr({
                        'class': 'dxg-text',
                        align: 'center'
                    }).css(core.utils.patchFontOptions(that._options.text.font)).append(root);
                    bbox = text.getBBox();
                    root.remove();
                    that._textVerticalOffset = -bbox.y - bbox.height / 2;
                    that._textWidth = bbox.width;
                    that._textHeight = bbox.height
                }
            },
            _move: function() {
                var that = this;
                that._updateBarItemsPositions();
                if (that._hasText) {
                    that._text.attr({text: formatValue(that._actualValue, that._options.text)});
                    that._updateTextPosition();
                    that._updateLinePosition()
                }
            },
            _updateBarItems: function() {
                var that = this,
                    options = that._options,
                    backgroundColor,
                    spaceColor,
                    translator = that._translator;
                that._setBarSides();
                that._startPosition = translator.translate(translator.getDomainStart());
                that._endPosition = translator.translate(translator.getDomainEnd());
                that._basePosition = translator.translate(options.baseValue);
                that._space = that._getSpace();
                backgroundColor = options.backgroundColor || 'none';
                if (backgroundColor !== 'none' && that._space > 0)
                    spaceColor = options.containerBackgroundColor || 'none';
                else {
                    that._space = 0;
                    spaceColor = 'none'
                }
                that._backItem1.attr({fill: backgroundColor});
                that._backItem2.attr({fill: backgroundColor});
                that._spaceItem1.attr({fill: spaceColor});
                that._spaceItem2.attr({fill: spaceColor})
            },
            _getSpace: function() {
                return 0
            },
            _updateTextItems: function() {
                var that = this;
                if (that._hasText) {
                    that._line = that._line || that._renderer.path([], "line").attr({
                        'class': 'dxg-main-bar',
                        "stroke-linecap": "square"
                    }).append(that._rootElement);
                    that._text = that._text || that._renderer.text('', 0, 0).attr({'class': 'dxg-text'}).append(that._rootElement);
                    that._text.attr({align: that._getTextAlign()}).css(that._getFontOptions());
                    that._setTextItemsSides()
                }
                else {
                    if (that._line) {
                        that._line.remove();
                        delete that._line
                    }
                    if (that._text) {
                        that._text.remove();
                        delete that._text
                    }
                }
            },
            _isTextVisible: function() {
                return false
            },
            _getTextAlign: function() {
                return 'center'
            },
            _getFontOptions: function() {
                var options = this._options,
                    font = options.text.font;
                if (!font || !font.color)
                    font = $extend({}, font, {color: options.color});
                return core.utils.patchFontOptions(font)
            },
            _updateBarItemsPositions: function() {
                var that = this,
                    positions = that._getPositions();
                that._backItem1.attr(that._buildItemSettings(positions.start, positions.back1));
                that._backItem2.attr(that._buildItemSettings(positions.back2, positions.end));
                that._spaceItem1.attr(that._buildItemSettings(positions.back1, positions.main1));
                that._spaceItem2.attr(that._buildItemSettings(positions.main2, positions.back2));
                that._mainItem.attr(that._buildItemSettings(positions.main1, positions.main2));
                that._trackerElement && that._trackerElement.attr(that._buildItemSettings(positions.main1, positions.main2))
            },
            _render: function() {
                var that = this;
                that._measureText();
                if (!that._backItem1) {
                    that._backItem1 = that._createBarItem();
                    that._backItem1.attr({'class': 'dxg-back-bar'})
                }
                if (!that._backItem2) {
                    that._backItem2 = that._createBarItem();
                    that._backItem2.attr({'class': 'dxg-back-bar'})
                }
                if (!that._spaceItem1) {
                    that._spaceItem1 = that._createBarItem();
                    that._spaceItem1.attr({'class': 'dxg-space-bar'})
                }
                if (!that._spaceItem2) {
                    that._spaceItem2 = that._createBarItem();
                    that._spaceItem2.attr({'class': 'dxg-space-bar'})
                }
                if (!that._mainItem) {
                    that._mainItem = that._createBarItem();
                    that._mainItem.attr({'class': 'dxg-main-bar'})
                }
                that._updateBarItems();
                that._updateTextItems()
            },
            _clear: function() {
                var that = this;
                delete that._backItem1;
                delete that._backItem2;
                delete that._spaceItem1;
                delete that._spaceItem2;
                delete that._mainItem;
                delete that._hasText;
                delete that._line;
                delete that._text
            },
            getTooltipParameters: function() {
                var position = this._getTooltipPosition();
                return {
                        x: position.x,
                        y: position.y,
                        value: this._currentValue,
                        color: this._options.color,
                        offset: 0
                    }
            }
        })
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file circularNeedle.js */
    (function(DX, undefined) {
        var circularNeedles = DX.viz.gauges.__internals.circularNeedles,
            _Number = Number;
        circularNeedles.SimpleIndicator = DX.viz.gauges.__internals.BaseIndicator.inherit({
            _move: function() {
                var that = this,
                    options = that._options,
                    angle = DX.utils.convertAngleToRendererSpace(that._actualPosition);
                that._rootElement.rotate(angle, options.x, options.y);
                that._trackerElement && that._trackerElement.rotate(angle, options.x, options.y)
            },
            _isEnabled: function() {
                return this._options.width > 0
            },
            _isVisible: function(layout) {
                return layout.radius - _Number(this._options.indentFromCenter) > 0
            },
            _getTrackerSettings: function() {
                var options = this._options,
                    x = options.x,
                    y = options.y - (options.radius + _Number(options.indentFromCenter)) / 2,
                    width = options.width / 2,
                    length = (options.radius - _Number(options.indentFromCenter)) / 2;
                width > 10 || (width = 10);
                length > 10 || (length = 10);
                return {points: [x - width, y - length, x - width, y + length, x + width, y + length, x + width, y - length]}
            },
            _renderSpindle: function() {
                var that = this,
                    options = that._options,
                    gapSize;
                if (options.spindleSize > 0) {
                    gapSize = _Number(options.spindleGapSize) || 0;
                    if (gapSize > 0)
                        gapSize = gapSize <= options.spindleSize ? gapSize : _Number(options.spindleSize);
                    that._spindleOuter = that._spindleOuter || that._renderer.circle().append(that._rootElement);
                    that._spindleInner = that._spindleInner || that._renderer.circle().append(that._rootElement);
                    that._spindleOuter.attr({
                        'class': 'dxg-spindle-border',
                        cx: options.x,
                        cy: options.y,
                        r: options.spindleSize / 2
                    });
                    that._spindleInner.attr({
                        'class': 'dxg-spindle-hole',
                        cx: options.x,
                        cy: options.y,
                        r: gapSize / 2,
                        fill: options.containerBackgroundColor
                    })
                }
            },
            _render: function() {
                var that = this;
                that._renderPointer();
                that._renderSpindle()
            },
            _clearSpindle: function() {
                delete this._spindleOuter;
                delete this._spindleInner
            },
            _clearPointer: function() {
                delete this._element
            },
            _clear: function() {
                this._clearPointer();
                this._clearSpindle()
            },
            measure: function(layout) {
                var result = {max: layout.radius};
                if (this._options.indentFromCenter < 0)
                    result.inverseHorizontalOffset = result.inverseVerticalOffset = -_Number(this._options.indentFromCenter);
                return result
            },
            getTooltipParameters: function() {
                var options = this._options,
                    cossin = DX.utils.getCosAndSin(this._actualPosition),
                    r = (options.radius + _Number(options.indentFromCenter)) / 2;
                return {
                        x: options.x + cossin.cos * r,
                        y: options.y - cossin.sin * r,
                        value: this._currentValue,
                        color: options.color,
                        offset: options.width / 2
                    }
            }
        });
        circularNeedles.RectangleNeedle = circularNeedles.SimpleIndicator.inherit({_renderPointer: function() {
                var that = this,
                    options = that._options,
                    y2 = options.y - options.radius,
                    y1 = options.y - _Number(options.indentFromCenter),
                    x1 = options.x - options.width / 2,
                    x2 = x1 + _Number(options.width);
                that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
                that._element.attr({points: [x1, y1, x1, y2, x2, y2, x2, y1]})
            }});
        circularNeedles.TriangleNeedle = circularNeedles.SimpleIndicator.inherit({_renderPointer: function() {
                var that = this,
                    options = that._options,
                    y2 = options.y - options.radius,
                    y1 = options.y - _Number(options.indentFromCenter),
                    x1 = options.x - options.width / 2,
                    x2 = options.x + options.width / 2;
                that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
                that._element.attr({points: [x1, y1, options.x, y2, x2, y1]})
            }});
        circularNeedles.TwoColorRectangleNeedle = circularNeedles.SimpleIndicator.inherit({
            _renderPointer: function() {
                var that = this,
                    options = that._options,
                    x1 = options.x - options.width / 2,
                    x2 = options.x + options.width / 2,
                    y4 = options.y - options.radius,
                    y1 = options.y - _Number(options.indentFromCenter),
                    fraction = _Number(options.secondFraction) || 0,
                    y2,
                    y3;
                if (fraction >= 1)
                    y2 = y3 = y1;
                else if (fraction <= 0)
                    y2 = y3 = y4;
                else {
                    y3 = y4 + (y1 - y4) * fraction;
                    y2 = y3 + _Number(options.space)
                }
                that._firstElement = that._firstElement || that._renderer.path([], "area").append(that._rootElement);
                that._spaceElement = that._spaceElement || that._renderer.path([], "area").append(that._rootElement);
                that._secondElement = that._secondElement || that._renderer.path([], "area").append(that._rootElement);
                that._firstElement.attr({points: [x1, y1, x1, y2, x2, y2, x2, y1]});
                that._spaceElement.attr({
                    points: [x1, y2, x1, y3, x2, y3, x2, y2],
                    'class': 'dxg-hole',
                    fill: options.containerBackgroundColor
                });
                that._secondElement.attr({
                    points: [x1, y3, x1, y4, x2, y4, x2, y3],
                    'class': 'dxg-part',
                    fill: options.secondColor
                })
            },
            _clearPointer: function() {
                delete this._firstElement;
                delete this._secondElement;
                delete this._spaceElement
            }
        })
    })(DevExpress);
    /*! Module viz-gauges, file linearNeedle.js */
    (function(DX, undefined) {
        var linearNeedles = DX.viz.gauges.__internals.linearNeedles;
        linearNeedles.SimpleIndicator = DX.viz.gauges.__internals.BaseIndicator.inherit({
            _move: function() {
                var that = this,
                    delta = that._actualPosition - that._zeroPosition;
                that._rootElement.move(that.vertical ? 0 : delta, that.vertical ? delta : 0);
                that._trackerElement && that._trackerElement.move(that.vertical ? 0 : delta, that.vertical ? delta : 0)
            },
            _isEnabled: function() {
                this.vertical = this._options.vertical;
                return this._options.length > 0 && this._options.width > 0
            },
            _isVisible: function() {
                return true
            },
            _getTrackerSettings: function() {
                var options = this._options,
                    x1,
                    x2,
                    y1,
                    y2,
                    width = options.width / 2,
                    length = options.length / 2,
                    p = this._zeroPosition;
                width > 10 || (width = 10);
                length > 10 || (length = 10);
                if (this.vertical) {
                    x1 = options.x - length;
                    x2 = options.x + length;
                    y1 = p + width;
                    y2 = p - width
                }
                else {
                    x1 = p - width;
                    x2 = p + width;
                    y1 = options.y + length;
                    y2 = options.y - length
                }
                return {points: [x1, y1, x1, y2, x2, y2, x2, y1]}
            },
            _render: function() {
                var that = this;
                that._zeroPosition = that._translator.getCodomainStart()
            },
            _clear: function() {
                delete this._element
            },
            measure: function(layout) {
                var p = this.vertical ? layout.x : layout.y;
                return {
                        min: p - this._options.length / 2,
                        max: p + this._options.length / 2
                    }
            },
            getTooltipParameters: function() {
                var that = this,
                    options = that._options,
                    p = that._actualPosition,
                    parameters = {
                        x: p,
                        y: p,
                        value: that._currentValue,
                        color: options.color,
                        offset: options.width / 2
                    };
                that.vertical ? parameters.x = options.x : parameters.y = options.y;
                return parameters
            }
        });
        linearNeedles.RectangleNeedle = linearNeedles.SimpleIndicator.inherit({_render: function() {
                var that = this,
                    options = that._options,
                    p,
                    x1,
                    x2,
                    y1,
                    y2;
                that.callBase();
                p = that._zeroPosition;
                if (that.vertical) {
                    x1 = options.x - options.length / 2;
                    x2 = options.x + options.length / 2;
                    y1 = p + options.width / 2;
                    y2 = p - options.width / 2
                }
                else {
                    x1 = p - options.width / 2;
                    x2 = p + options.width / 2;
                    y1 = options.y + options.length / 2;
                    y2 = options.y - options.length / 2
                }
                that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
                that._element.attr({points: [x1, y1, x1, y2, x2, y2, x2, y1]})
            }});
        linearNeedles.RhombusNeedle = linearNeedles.SimpleIndicator.inherit({_render: function() {
                var that = this,
                    options = that._options,
                    x,
                    y,
                    dx,
                    dy;
                that.callBase();
                if (that.vertical) {
                    x = options.x;
                    y = that._zeroPosition;
                    dx = options.length / 2 || 0;
                    dy = options.width / 2 || 0
                }
                else {
                    x = that._zeroPosition;
                    y = options.y;
                    dx = options.width / 2 || 0;
                    dy = options.length / 2 || 0
                }
                that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
                that._element.attr({points: [x - dx, y, x, y - dy, x + dx, y, x, y + dy]})
            }});
        linearNeedles.CircleNeedle = linearNeedles.SimpleIndicator.inherit({_render: function() {
                var that = this,
                    options = that._options,
                    x,
                    y,
                    r;
                that.callBase();
                if (that.vertical) {
                    x = options.x;
                    y = that._zeroPosition
                }
                else {
                    x = that._zeroPosition;
                    y = options.y
                }
                r = options.length / 2 || 0;
                that._element = that._element || that._renderer.circle().append(that._rootElement);
                that._element.attr({
                    cx: x,
                    cy: y,
                    r: r
                })
            }})
    })(DevExpress);
    /*! Module viz-gauges, file circularMarker.js */
    (function(DX, undefined) {
        var circularMarkers = DX.viz.gauges.__internals.circularMarkers,
            _Number = Number;
        circularMarkers.TriangleMarker = DX.viz.gauges.__internals.circularNeedles.SimpleIndicator.inherit({
            _isEnabled: function() {
                return this._options.length > 0 && this._options.width > 0
            },
            _isVisible: function(layout) {
                return layout.radius > 0
            },
            _render: function() {
                var that = this,
                    options = that._options,
                    x = options.x,
                    y1 = options.y - options.radius,
                    dx = options.width / 2 || 0,
                    y2 = y1 - _Number(options.length),
                    settings;
                that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
                settings = {
                    points: [x, y1, x - dx, y2, x + dx, y2],
                    stroke: "none",
                    "stroke-width": 0,
                    "stroke-linecap": "square"
                };
                if (options.space > 0) {
                    settings["stroke-width"] = Math.min(options.space, options.width / 4) || 0;
                    settings.stroke = settings["stroke-width"] > 0 ? options.containerBackgroundColor || "none" : "none"
                }
                that._element.attr(settings).sharp()
            },
            _clear: function() {
                delete this._element
            },
            _getTrackerSettings: function() {
                var options = this._options,
                    x = options.x,
                    y = options.y - options.radius - options.length / 2,
                    width = options.width / 2,
                    length = options.length / 2;
                width > 10 || (width = 10);
                length > 10 || (length = 10);
                return {points: [x - width, y - length, x - width, y + length, x + width, y + length, x + width, y - length]}
            },
            measure: function(layout) {
                return {
                        min: layout.radius,
                        max: layout.radius + _Number(this._options.length)
                    }
            },
            getTooltipParameters: function() {
                var options = this._options,
                    cossin = DX.utils.getCosAndSin(this._actualPosition),
                    r = options.radius + options.length / 2,
                    parameters = this.callBase();
                parameters.x = options.x + cossin.cos * r;
                parameters.y = options.y - cossin.sin * r;
                parameters.offset = options.length / 2;
                return parameters
            }
        });
        circularMarkers.TextCloudMarker = DX.viz.gauges.__internals.BaseTextCloudMarker.inherit({
            _isEnabled: function() {
                return true
            },
            _isVisible: function(layout) {
                return layout.radius > 0
            },
            _getTextCloudOptions: function() {
                var that = this,
                    cossin = DX.utils.getCosAndSin(that._actualPosition),
                    nangle = DX.utils.normalizeAngle(that._actualPosition);
                return {
                        x: that._options.x + cossin.cos * that._options.radius,
                        y: that._options.y - cossin.sin * that._options.radius,
                        type: nangle > 270 ? "left-top" : nangle > 180 ? "top-right" : nangle > 90 ? "right-bottom" : "bottom-left"
                    }
            },
            measure: function(layout) {
                var that = this,
                    arrowLength = _Number(that._options.arrowLength) || 0,
                    verticalOffset,
                    horizontalOffset;
                that._measureText();
                verticalOffset = that._textFullHeight + arrowLength;
                horizontalOffset = that._textFullWidth + arrowLength;
                return {
                        min: layout.radius,
                        max: layout.radius,
                        horizontalOffset: horizontalOffset,
                        verticalOffset: verticalOffset,
                        inverseHorizontalOffset: horizontalOffset,
                        inverseVerticalOffset: verticalOffset
                    }
            }
        })
    })(DevExpress);
    /*! Module viz-gauges, file linearMarker.js */
    (function(DX, undefined) {
        var linearMarkers = DX.viz.gauges.__internals.linearMarkers,
            _Number = Number,
            _String = String;
        linearMarkers.TriangleMarker = DX.viz.gauges.__internals.linearNeedles.SimpleIndicator.inherit({
            _isEnabled: function() {
                var that = this;
                that.vertical = that._options.vertical;
                that._inverted = that.vertical ? _String(that._options.horizontalOrientation).toLowerCase() === 'right' : _String(that._options.verticalOrientation).toLowerCase() === 'bottom';
                return that._options.length > 0 && that._options.width > 0
            },
            _isVisible: function() {
                return true
            },
            _render: function() {
                var that = this,
                    options = that._options,
                    x1,
                    x2,
                    y1,
                    y2,
                    settings = {
                        stroke: 'none',
                        "stroke-width": 0,
                        "stroke-linecap": "square"
                    };
                that.callBase();
                if (that.vertical) {
                    x1 = options.x;
                    y1 = that._zeroPosition;
                    x2 = x1 + _Number(that._inverted ? options.length : -options.length);
                    settings.points = [x1, y1, x2, y1 - options.width / 2, x2, y1 + options.width / 2]
                }
                else {
                    y1 = options.y;
                    x1 = that._zeroPosition;
                    y2 = y1 + _Number(that._inverted ? options.length : -options.length);
                    settings.points = [x1, y1, x1 - options.width / 2, y2, x1 + options.width / 2, y2]
                }
                if (options.space > 0) {
                    settings["stroke-width"] = Math.min(options.space, options.width / 4) || 0;
                    settings.stroke = settings["stroke-width"] > 0 ? options.containerBackgroundColor || 'none' : 'none'
                }
                that._element = that._element || that._renderer.path([], "area").append(that._rootElement);
                that._element.attr(settings).sharp()
            },
            _getTrackerSettings: function() {
                var that = this,
                    options = that._options,
                    width = options.width / 2,
                    length = _Number(options.length),
                    x1,
                    x2,
                    y1,
                    y2,
                    result;
                width > 10 || (width = 10);
                length > 20 || (length = 20);
                if (that.vertical) {
                    x1 = x2 = options.x;
                    x2 = x1 + (that._inverted ? length : -length);
                    y1 = that._zeroPosition + width;
                    y2 = that._zeroPosition - width;
                    result = [x1, y1, x2, y1, x2, y2, x1, y2]
                }
                else {
                    y1 = options.y;
                    y2 = y1 + (that._inverted ? length : -length);
                    x1 = that._zeroPosition - width;
                    x2 = that._zeroPosition + width;
                    result = [x1, y1, x1, y2, x2, y2, x2, y1]
                }
                return {points: result}
            },
            measure: function(layout) {
                var that = this,
                    length = _Number(that._options.length),
                    minbound,
                    maxbound;
                if (that.vertical) {
                    minbound = maxbound = layout.x;
                    if (that._inverted)
                        maxbound = minbound + length;
                    else
                        minbound = maxbound - length
                }
                else {
                    minbound = maxbound = layout.y;
                    if (that._inverted)
                        maxbound = minbound + length;
                    else
                        minbound = maxbound - length
                }
                return {
                        min: minbound,
                        max: maxbound,
                        indent: that._options.width / 2
                    }
            },
            getTooltipParameters: function() {
                var that = this,
                    options = that._options,
                    s = (that._inverted ? options.length : -options.length) / 2,
                    parameters = that.callBase();
                that.vertical ? parameters.x += s : parameters.y += s;
                parameters.offset = options.length / 2;
                return parameters
            }
        });
        linearMarkers.TextCloudMarker = DX.viz.gauges.__internals.BaseTextCloudMarker.inherit({
            _isEnabled: function() {
                var that = this;
                that.vertical = that._options.vertical;
                that._inverted = that.vertical ? _String(that._options.horizontalOrientation).toLowerCase() === 'right' : _String(that._options.verticalOrientation).toLowerCase() === 'bottom';
                return true
            },
            _isVisible: function() {
                return true
            },
            _getTextCloudOptions: function() {
                var that = this,
                    x = that._actualPosition,
                    y = that._actualPosition,
                    type;
                if (that.vertical) {
                    x = that._options.x;
                    type = that._inverted ? 'top-left' : 'top-right'
                }
                else {
                    y = that._options.y;
                    type = that._inverted ? 'right-top' : 'right-bottom'
                }
                return {
                        x: x,
                        y: y,
                        type: type
                    }
            },
            measure: function(layout) {
                var that = this,
                    minbound,
                    maxbound,
                    arrowLength = _Number(that._options.arrowLength) || 0,
                    indent;
                that._measureText();
                if (that.vertical) {
                    indent = that._textFullHeight;
                    if (that._inverted) {
                        minbound = layout.x;
                        maxbound = layout.x + arrowLength + that._textFullWidth
                    }
                    else {
                        minbound = layout.x - arrowLength - that._textFullWidth;
                        maxbound = layout.x
                    }
                }
                else {
                    indent = that._textFullWidth;
                    if (that._inverted) {
                        minbound = layout.y;
                        maxbound = layout.y + arrowLength + that._textFullHeight
                    }
                    else {
                        minbound = layout.y - arrowLength - that._textFullHeight;
                        maxbound = layout.y
                    }
                }
                return {
                        min: minbound,
                        max: maxbound,
                        indent: indent
                    }
            }
        })
    })(DevExpress);
    /*! Module viz-gauges, file circularRangeBar.js */
    (function(DX, undefined) {
        var _Number = Number,
            getCosAndSin = DX.utils.getCosAndSin,
            convertAngleToRendererSpace = DX.utils.convertAngleToRendererSpace,
            max = Math.max,
            min = Math.min;
        DX.viz.gauges.__internals.CircularRangeBar = DX.viz.gauges.__internals.BaseRangeBar.inherit({
            _isEnabled: function() {
                return this._options.size > 0
            },
            _isVisible: function(layout) {
                return layout.radius - _Number(this._options.size) > 0
            },
            _createBarItem: function() {
                return this._renderer.arc().attr({"stroke-linejoin": "round"}).append(this._rootElement)
            },
            _createTracker: function() {
                return this._renderer.arc().attr({"stroke-linejoin": "round"})
            },
            _setBarSides: function() {
                var that = this;
                that._maxSide = that._options.radius;
                that._minSide = that._maxSide - _Number(that._options.size)
            },
            _getSpace: function() {
                var options = this._options;
                return options.space > 0 ? options.space * 180 / options.radius / Math.PI : 0
            },
            _isTextVisible: function() {
                var options = this._options.text || {};
                return options.indent > 0
            },
            _setTextItemsSides: function() {
                var that = this,
                    options = that._options,
                    indent = _Number(options.text.indent);
                that._lineFrom = options.y - options.radius;
                that._lineTo = that._lineFrom - indent;
                that._textRadius = options.radius + indent
            },
            _getPositions: function() {
                var that = this,
                    basePosition = that._basePosition,
                    actualPosition = that._actualPosition,
                    mainPosition1,
                    mainPosition2;
                if (basePosition >= actualPosition) {
                    mainPosition1 = basePosition;
                    mainPosition2 = actualPosition
                }
                else {
                    mainPosition1 = actualPosition;
                    mainPosition2 = basePosition
                }
                return {
                        start: that._startPosition,
                        end: that._endPosition,
                        main1: mainPosition1,
                        main2: mainPosition2,
                        back1: min(mainPosition1 + that._space, that._startPosition),
                        back2: max(mainPosition2 - that._space, that._endPosition)
                    }
            },
            _buildItemSettings: function(from, to) {
                var that = this;
                return {
                        x: that._options.x,
                        y: that._options.y,
                        innerRadius: that._minSide,
                        outerRadius: that._maxSide,
                        startAngle: to,
                        endAngle: from
                    }
            },
            _updateTextPosition: function() {
                var that = this,
                    cossin = getCosAndSin(that._actualPosition),
                    x = that._options.x + that._textRadius * cossin.cos,
                    y = that._options.y - that._textRadius * cossin.sin;
                x += cossin.cos * that._textWidth * 0.6;
                y -= cossin.sin * that._textHeight * 0.6;
                that._text.attr({
                    x: x,
                    y: y + that._textVerticalOffset
                })
            },
            _updateLinePosition: function() {
                var that = this,
                    x = that._options.x,
                    x1,
                    x2;
                if (that._basePosition > that._actualPosition) {
                    x1 = x - 2;
                    x2 = x
                }
                else if (that._basePosition < that._actualPosition) {
                    x1 = x;
                    x2 = x + 2
                }
                else {
                    x1 = x - 1;
                    x2 = x + 1
                }
                that._line.attr({points: [x1, that._lineFrom, x1, that._lineTo, x2, that._lineTo, x2, that._lineFrom]}).rotate(convertAngleToRendererSpace(that._actualPosition), x, that._options.y).sharp()
            },
            _getTooltipPosition: function() {
                var that = this,
                    cossin = getCosAndSin((that._basePosition + that._actualPosition) / 2),
                    r = (that._minSide + that._maxSide) / 2;
                return {
                        x: that._options.x + cossin.cos * r,
                        y: that._options.y - cossin.sin * r
                    }
            },
            measure: function(layout) {
                var that = this,
                    result = {
                        min: layout.radius - _Number(that._options.size),
                        max: layout.radius
                    };
                that._measureText();
                if (that._hasText) {
                    result.max += _Number(that._options.text.indent);
                    result.horizontalOffset = that._textWidth;
                    result.verticalOffset = that._textHeight
                }
                return result
            }
        })
    })(DevExpress);
    /*! Module viz-gauges, file linearRangeBar.js */
    (function(DX, undefined) {
        var _Number = Number,
            _String = String;
        DX.viz.gauges.__internals.LinearRangeBar = DX.viz.gauges.__internals.BaseRangeBar.inherit({
            _isEnabled: function() {
                var that = this;
                that.vertical = that._options.vertical;
                that._inverted = that.vertical ? _String(that._options.horizontalOrientation).toLowerCase() === 'right' : _String(that._options.verticalOrientation).toLowerCase() === 'bottom';
                return that._options.size > 0
            },
            _isVisible: function() {
                return true
            },
            _createBarItem: function() {
                return this._renderer.path([], "area").append(this._rootElement)
            },
            _createTracker: function() {
                return this._renderer.path([], "area")
            },
            _setBarSides: function() {
                var that = this,
                    options = that._options,
                    size = _Number(options.size),
                    minSide,
                    maxSide;
                if (that.vertical)
                    if (that._inverted) {
                        minSide = options.x;
                        maxSide = options.x + size
                    }
                    else {
                        minSide = options.x - size;
                        maxSide = options.x
                    }
                else if (that._inverted) {
                    minSide = options.y;
                    maxSide = options.y + size
                }
                else {
                    minSide = options.y - size;
                    maxSide = options.y
                }
                that._minSide = minSide;
                that._maxSide = maxSide;
                that._minBound = minSide;
                that._maxBound = maxSide
            },
            _getSpace: function() {
                var options = this._options;
                return options.space > 0 ? _Number(options.space) : 0
            },
            _isTextVisible: function() {
                var textOptions = this._options.text || {};
                return textOptions.indent > 0 || textOptions.indent < 0
            },
            _getTextAlign: function() {
                return this.vertical ? this._options.text.indent > 0 ? 'left' : 'right' : 'center'
            },
            _setTextItemsSides: function() {
                var that = this,
                    indent = _Number(that._options.text.indent);
                if (indent > 0) {
                    that._lineStart = that._maxSide;
                    that._lineEnd = that._maxSide + indent;
                    that._textPosition = that._lineEnd + (that.vertical ? 2 : that._textHeight / 2);
                    that._maxBound = that._textPosition + (that.vertical ? that._textWidth : that._textHeight / 2)
                }
                else if (indent < 0) {
                    that._lineStart = that._minSide;
                    that._lineEnd = that._minSide + indent;
                    that._textPosition = that._lineEnd - (that.vertical ? 2 : that._textHeight / 2);
                    that._minBound = that._textPosition - (that.vertical ? that._textWidth : that._textHeight / 2)
                }
            },
            _getPositions: function() {
                var that = this,
                    startPosition = that._startPosition,
                    endPosition = that._endPosition,
                    space = that._space,
                    basePosition = that._basePosition,
                    actualPosition = that._actualPosition,
                    mainPosition1,
                    mainPosition2,
                    backPosition1,
                    backPosition2;
                if (startPosition < endPosition) {
                    if (basePosition < actualPosition) {
                        mainPosition1 = basePosition;
                        mainPosition2 = actualPosition
                    }
                    else {
                        mainPosition1 = actualPosition;
                        mainPosition2 = basePosition
                    }
                    backPosition1 = mainPosition1 - space;
                    backPosition2 = mainPosition2 + space
                }
                else {
                    if (basePosition > actualPosition) {
                        mainPosition1 = basePosition;
                        mainPosition2 = actualPosition
                    }
                    else {
                        mainPosition1 = actualPosition;
                        mainPosition2 = basePosition
                    }
                    backPosition1 = mainPosition1 + space;
                    backPosition2 = mainPosition2 - space
                }
                return {
                        start: startPosition,
                        end: endPosition,
                        main1: mainPosition1,
                        main2: mainPosition2,
                        back1: backPosition1,
                        back2: backPosition2
                    }
            },
            _buildItemSettings: function(from, to) {
                var that = this,
                    side1 = that._minSide,
                    side2 = that._maxSide,
                    points = that.vertical ? [side1, from, side1, to, side2, to, side2, from] : [from, side1, from, side2, to, side2, to, side1];
                return {points: points}
            },
            _updateTextPosition: function() {
                var that = this;
                that._text.attr(that.vertical ? {
                    x: that._textPosition,
                    y: that._actualPosition + that._textVerticalOffset
                } : {
                    x: that._actualPosition,
                    y: that._textPosition + that._textVerticalOffset
                })
            },
            _updateLinePosition: function() {
                var that = this,
                    actualPosition = that._actualPosition,
                    side1,
                    side2,
                    points;
                if (that.vertical) {
                    if (that._basePosition >= actualPosition) {
                        side1 = actualPosition;
                        side2 = actualPosition + 2
                    }
                    else {
                        side1 = actualPosition - 2;
                        side2 = actualPosition
                    }
                    points = [that._lineStart, side1, that._lineStart, side2, that._lineEnd, side2, that._lineEnd, side1]
                }
                else {
                    if (that._basePosition <= actualPosition) {
                        side1 = actualPosition - 2;
                        side2 = actualPosition
                    }
                    else {
                        side1 = actualPosition;
                        side2 = actualPosition + 2
                    }
                    points = [side1, that._lineStart, side1, that._lineEnd, side2, that._lineEnd, side2, that._lineStart]
                }
                that._line.attr({points: points}).sharp()
            },
            _getTooltipPosition: function() {
                var that = this,
                    crossCenter = (that._minSide + that._maxSide) / 2,
                    alongCenter = (that._basePosition + that._actualPosition) / 2;
                return that.vertical ? {
                        x: crossCenter,
                        y: alongCenter
                    } : {
                        x: alongCenter,
                        y: crossCenter
                    }
            },
            measure: function(layout) {
                var that = this,
                    size = _Number(that._options.size),
                    textIndent = _Number(that._options.text.indent),
                    minbound,
                    maxbound,
                    indent;
                that._measureText();
                if (that.vertical) {
                    minbound = maxbound = layout.x;
                    if (that._inverted)
                        maxbound = maxbound + size;
                    else
                        minbound = minbound - size;
                    if (that._hasText) {
                        indent = that._textHeight / 2;
                        if (textIndent > 0)
                            maxbound += textIndent + that._textWidth;
                        if (textIndent < 0)
                            minbound += textIndent - that._textWidth
                    }
                }
                else {
                    minbound = maxbound = layout.y;
                    if (that._inverted)
                        maxbound = maxbound + size;
                    else
                        minbound = minbound - size;
                    if (that._hasText) {
                        indent = that._textWidth / 2;
                        if (textIndent > 0)
                            maxbound += textIndent + that._textHeight;
                        if (textIndent < 0)
                            minbound += textIndent - that._textHeight
                    }
                }
                return {
                        min: minbound,
                        max: maxbound,
                        indent: indent
                    }
            }
        })
    })(DevExpress);
    /*! Module viz-gauges, file scale.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            core = viz.core,
            _Number = Number,
            _String = String,
            _isFinite = isFinite,
            _math = Math,
            _min = _math.min,
            _max = _math.max,
            _abs = _math.abs,
            PI_DIV_180 = _math.PI / 180,
            utils = DX.utils,
            _isFunction = utils.isFunction,
            _isArray = utils.isArray,
            _getCosAndSin = utils.getCosAndSin,
            _convertAngleToRendererSpace = utils.convertAngleToRendererSpace,
            _map = $.map,
            _formatHelper = DX.formatHelper,
            _createTickManager = core.CoreFactory.createTickManager;
        function binarySearch(x, list) {
            var a = 0,
                b = list.length - 1,
                flag = list[a] - list[b] < 0,
                c,
                k = -1;
            if (list[a] === x)
                k = a;
            if (list[b] === x)
                k = b;
            while (k < 0 && a <= b) {
                c = ~~((a + b) / 2);
                if (list[c] === x)
                    k = c;
                else if (list[c] - x < 0 === flag)
                    a = c + 1;
                else
                    b = c - 1
            }
            return k
        }
        function sortAsc(x, y) {
            return x - y
        }
        viz.gauges.__internals.BaseScale = viz.gauges.__internals.BaseElement.inherit({
            _init: function() {
                var that = this;
                that._root = that._renderer.g().attr({'class': 'dxg-scale'});
                that._majorTicks = that._renderer.g().attr({'class': 'dxg-major-ticks'});
                that._minorTicks = that._renderer.g().attr({'class': 'dxg-minor-ticks'});
                that._labels = that._renderer.g().attr({'class': 'dxg-labels'})
            },
            clean: function() {
                var that = this;
                that._root.remove();
                that._majorTicks.remove().clear();
                that._minorTicks.remove().clear();
                that._labels.remove().clear();
                that._majorTicksEnabled = that._minorTicksEnabled = that._labelsEnabled = that._options = that.enabled = null;
                return that
            },
            render: function(options) {
                var that = this;
                that._options = options;
                that._processOptions(options);
                if (that._majorTicksEnabled || that._minorTicksEnabled || that._labelsEnabled) {
                    that.enabled = true;
                    that._root.append(that._container);
                    if (that._majorTicksEnabled)
                        that._majorTicks.append(that._root);
                    if (that._minorTicksEnabled)
                        that._minorTicks.append(that._root);
                    if (that._labelsEnabled) {
                        that._labels.append(that._root);
                        that._measureText()
                    }
                }
                return that
            },
            _processOptions: function(options) {
                var that = this;
                that._majorTicksEnabled = options.majorTick.visible && options.majorTick.length > 0 && options.majorTick.width > 0;
                that._minorTicksEnabled = options.minorTick.visible && options.minorTick.length > 0 && options.minorTick.width > 0;
                that._labelsEnabled = options.label.visible && _Number(options.label.indentFromTick) !== 0;
                that._setupOrientation()
            },
            _measureText: function() {
                var that = this,
                    domain = that._translator.getDomain(),
                    options = that._options,
                    tickManager = _createTickManager({}, {
                        min: domain[0],
                        max: domain[1],
                        screenDelta: options.approximateScreenDelta
                    }, {
                        tickInterval: options.majorTick.tickInterval > 0 ? _Number(options.majorTick.tickInterval) : undefined,
                        stick: true,
                        textFontStyles: core.utils.patchFontOptions(options.label.font),
                        gridSpacingFactor: that._getGridSpacingFactor().majorTicks,
                        renderText: function(text, x, y, options) {
                            return that._renderer.text(text, x, y, options).append(that._renderer.root)
                        },
                        getText: function(value) {
                            return that._formatValue(value)
                        },
                        overlappingBehaviorType: that._overlappingBehaviorType
                    }),
                    maxTextParams = tickManager.getMaxLabelParams();
                that._textVerticalOffset = -maxTextParams.y - maxTextParams.height / 2;
                that._textWidth = maxTextParams.width;
                that._textHeight = maxTextParams.height;
                that._textLength = maxTextParams.length
            },
            _formatValue: function(value) {
                var options = this._options.label,
                    text = _formatHelper.format(value, options.format, options.precision);
                if (_isFunction(options.customizeText)) {
                    text = {
                        value: value,
                        valueText: text
                    };
                    text = _String(options.customizeText.call(text, text))
                }
                return text
            },
            _setupOrientation: null,
            _getCustomValues: function(values, compare) {
                var translator = this._translator,
                    result = [];
                if (_isArray(values)) {
                    result = _map(values, function(x) {
                        return _isFinite(translator.translate(x)) ? _Number(x) : null
                    }).sort(compare);
                    result = _map(result, function(x, i) {
                        return x !== result[i - 1] ? x : null
                    })
                }
                return result
            },
            _getLabelPosition: function(layout) {
                return this._getAxisLabelPosition(_Number(this._options.majorTick.length), _Number(this._options.label.indentFromTick), layout)
            },
            _generateTicks: function(layout) {
                var that = this,
                    scaleOptions = that._options,
                    translatorDomains = that._translator.getDomain(),
                    data = {
                        min: translatorDomains[0],
                        max: translatorDomains[1],
                        screenDelta: that._getScreenDelta(layout)
                    },
                    gridSpacingFactors = that._getGridSpacingFactor(),
                    options = {
                        tickInterval: scaleOptions.majorTick.tickInterval > 0 ? _Number(scaleOptions.majorTick.tickInterval) : undefined,
                        minorTickInterval: scaleOptions.minorTick.tickInterval > 0 ? _Number(scaleOptions.minorTick.tickInterval) : undefined,
                        gridSpacingFactor: gridSpacingFactors.majorTicks,
                        minorGridSpacingFactor: gridSpacingFactors.minorTicks,
                        numberMultipliers: [1, 2, 5],
                        textFontStyles: core.utils.patchFontOptions(scaleOptions.label.font),
                        labelOptions: scaleOptions.label,
                        getText: function(value) {
                            return that._formatValue(value)
                        },
                        isHorizontal: !that.vertical,
                        stick: true,
                        showMinorTicks: true
                    },
                    tickManager;
                if (scaleOptions.majorTick.useTicksAutoArrangement) {
                    options.useTicksAutoArrangement = true;
                    options.renderText = function(text, x, y, options) {
                        return that._renderer.text(text, x, y, options).append(that._renderer.root)
                    };
                    options.translate = that._getTranslateFunction(layout);
                    that._applyOverlappingOptions(options, layout)
                }
                tickManager = _createTickManager({}, data, options);
                return {
                        majorTicks: tickManager.getTicks(true),
                        minorTicks: tickManager.getMinorTicks()
                    }
            },
            _getTicks: function(layout) {
                var that = this,
                    options = that._options,
                    info = that._generateTicks(layout),
                    majorValues = options.majorTick.showCalculatedTicks ? info.majorTicks : [],
                    customMajorValues = _map(that._getCustomValues(options.majorTick.customTickValues, sortAsc), function(value) {
                        return binarySearch(value, majorValues) === -1 ? value : null
                    }),
                    minorValues = _map(options.minorTick.showCalculatedTicks ? info.minorTicks : [], function(value) {
                        return binarySearch(value, customMajorValues) === -1 ? value : null
                    }),
                    customMinorValues = that._getCustomValues(options.minorTick.customTickValues, sortAsc),
                    list = majorValues.concat(minorValues, customMajorValues).sort(sortAsc);
                customMinorValues = _map(customMinorValues, function(value) {
                    return binarySearch(value, list) === -1 ? value : null
                });
                return {
                        major: _map(majorValues.concat(customMajorValues), function(value) {
                            return {
                                    value: value,
                                    position: that._translator.translate(value)
                                }
                        }),
                        minor: _map(minorValues.concat(customMinorValues), function(value) {
                            return {
                                    value: value,
                                    position: that._translator.translate(value)
                                }
                        })
                    }
            },
            _createMajorTicks: function(ticks, layout) {
                var that = this,
                    points,
                    i = 0,
                    ii = ticks.length,
                    element;
                that._majorTicks.clear().attr({fill: that._options.majorTick.color});
                points = that._getTickPoints(_Number(that._options.majorTick.length), _Number(that._options.majorTick.width), layout);
                if (points) {
                    that._options.hideFirstTick && ++i;
                    that._options.hideLastTick && --ii;
                    for (; i < ii; ++i) {
                        element = that._renderer.path(points, "area");
                        that._moveTick(element, ticks[i], layout);
                        element.append(that._majorTicks)
                    }
                }
            },
            _createMinorTicks: function(ticks, layout) {
                var that = this,
                    points,
                    i = 0,
                    ii = ticks.length,
                    element;
                that._minorTicks.clear().attr({fill: that._options.minorTick.color});
                points = that._getTickPoints(_Number(that._options.minorTick.length), _Number(that._options.minorTick.width), layout);
                if (points)
                    for (; i < ii; ++i) {
                        element = that._renderer.path(points, "area");
                        that._moveTick(element, ticks[i], layout);
                        element.append(that._minorTicks)
                    }
            },
            _createLabels: function(ticks, layout) {
                var that = this,
                    indentFromTick = _Number(that._options.label.indentFromTick),
                    textPosition,
                    i = 0,
                    ii = ticks.length,
                    points,
                    text,
                    fontStyles = {},
                    rangeContainer;
                that._labels.clear().attr({align: that._getLabelAlign(indentFromTick)}).css(core.utils.patchFontOptions(that._options.label.font));
                textPosition = that._getLabelPosition(layout);
                if (textPosition) {
                    rangeContainer = that._options.label.useRangeColors ? that._options.rangeContainer : null;
                    that._options.hideFirstLabel && ++i;
                    that._options.hideLastLabel && --ii;
                    for (; i < ii; ++i) {
                        text = that._formatValue(ticks[i].value);
                        fontStyles.fill = rangeContainer ? rangeContainer.getColorForValue(ticks[i].value) : null;
                        points = that._getLabelOptions(text, textPosition, indentFromTick, ticks[i], layout);
                        that._renderer.text(text, points.x, points.y + that._textVerticalOffset).css(fontStyles).append(that._labels)
                    }
                }
            },
            resize: function(layout) {
                var that = this,
                    ticks = that._getTicks(layout);
                if (that._majorTicksEnabled)
                    that._createMajorTicks(ticks.major, layout);
                if (that._minorTicksEnabled)
                    that._createMinorTicks(ticks.minor, layout);
                if (that._labelsEnabled)
                    that._createLabels(ticks.major, layout);
                return that
            }
        });
        viz.gauges.__internals.CircularScale = viz.gauges.__internals.BaseScale.inherit({
            _getGridSpacingFactor: function() {
                return {
                        majorTicks: 17,
                        minorTicks: 5
                    }
            },
            _getTranslateFunction: function(layout) {
                var that = this,
                    indent = _Number(that._options.label.indentFromTick),
                    translator = this._translator;
                layout = layout || {
                    x: 0,
                    y: 0,
                    radius: 0
                };
                return function(value) {
                        var position = that._getLabelPosition(layout),
                            text = that._formatValue(value);
                        return that._getLabelOptions(text, position, indent, {position: translator.translate(value)}, layout)
                    }
            },
            _overlappingBehaviorType: "circular",
            _getScreenDelta: function(layout) {
                return (this._translator.getCodomainStart() - this._translator.getCodomainEnd()) * layout.radius * PI_DIV_180
            },
            _setupOrientation: function() {
                var that = this;
                that._inner = that._outer = 0;
                switch (that._options.orientation) {
                    case'inside':
                        that._inner = 1;
                        break;
                    case'center':
                        that._inner = that._outer = 0.5;
                        break;
                    default:
                        that._outer = 1;
                        break
                }
            },
            _getTickPoints: function(length, width, layout) {
                var x1 = layout.x - width / 2,
                    x2 = layout.x + width / 2,
                    y1 = layout.y - layout.radius - length * this._outer,
                    y2 = layout.y - layout.radius + length * this._inner;
                return y1 > 0 && y2 > 0 ? [x1, y1, x2, y1, x2, y2, x1, y2] : null
            },
            _moveTick: function(element, tick, layout) {
                element.rotate(_convertAngleToRendererSpace(tick.position), layout.x, layout.y)
            },
            _getAxisLabelPosition: function(tickLength, textIndent, layout) {
                var position = layout.radius + tickLength * (textIndent >= 0 ? this._outer : -this._inner) + textIndent;
                return position > 0 ? position : null
            },
            _getLabelAlign: function() {
                return 'center'
            },
            _applyOverlappingOptions: function(options, layout) {
                options.circularRadius = this._getLabelPosition(layout);
                options.circularStartAngle = this._translator.getCodomainStart();
                options.circularEndAngle = this._translator.getCodomainEnd();
                options.overlappingBehaviorType = "circular"
            },
            _getLabelOptions: function(textValue, textPosition, textIndent, tick, layout) {
                var cossin = _getCosAndSin(tick.position),
                    x = layout.x + cossin.cos * textPosition,
                    y = layout.y - cossin.sin * textPosition,
                    dx = cossin.cos * (textValue.length / this._textLength) * this._textWidth / 2,
                    dy = cossin.sin * this._textHeight / 2;
                if (textIndent > 0) {
                    x += dx;
                    y -= dy
                }
                else {
                    x -= dx;
                    y += dy
                }
                return {
                        x: x,
                        y: y
                    }
            },
            measure: function(layout) {
                var that = this,
                    result = {
                        min: layout.radius,
                        max: layout.radius
                    };
                if (that._majorTicksEnabled) {
                    result.min = _min(result.min, layout.radius - that._inner * that._options.majorTick.length);
                    result.max = _max(result.max, layout.radius + that._outer * that._options.majorTick.length)
                }
                if (that._minorTicksEnabled) {
                    result.min = _min(result.min, layout.radius - that._inner * that._options.minorTick.length);
                    result.max = _max(result.max, layout.radius + that._outer * that._options.minorTick.length)
                }
                if (that._labelsEnabled) {
                    if (that._options.label.indentFromTick > 0) {
                        result.horizontalOffset = _Number(that._options.label.indentFromTick) + that._textWidth;
                        result.verticalOffset = _Number(that._options.label.indentFromTick) + that._textHeight
                    }
                    else {
                        result.horizontalOffset = result.verticalOffset = 0;
                        result.min -= -_Number(that._options.label.indentFromTick) + _max(that._textWidth, that._textHeight)
                    }
                    result.inverseHorizontalOffset = that._textWidth / 2;
                    result.inverseVerticalOffset = that._textHeight / 2
                }
                return result
            }
        });
        viz.gauges.__internals.LinearScale = viz.gauges.__internals.BaseScale.inherit({
            _getGridSpacingFactor: function() {
                return {
                        majorTicks: 25,
                        minorTicks: 5
                    }
            },
            _getTranslateFunction: function() {
                var tr = this._translator;
                return function(value) {
                        return tr.translate(value)
                    }
            },
            _overlappingBehaviorType: "linear",
            _getScreenDelta: function() {
                return _abs(this._translator.getCodomainEnd() - this._translator.getCodomainStart())
            },
            _setupOrientation: function() {
                var that = this;
                that.vertical = that._options.vertical;
                that._inner = that._outer = 0;
                if (that.vertical)
                    switch (that._options.horizontalOrientation) {
                        case'left':
                            that._inner = 1;
                            break;
                        case'center':
                            that._inner = that._outer = 0.5;
                            break;
                        default:
                            that._outer = 1;
                            break
                    }
                else
                    switch (that._options.verticalOrientation) {
                        case'top':
                            that._inner = 1;
                            break;
                        case'middle':
                            that._inner = that._outer = 0.5;
                            break;
                        default:
                            that._outer = 1;
                            break
                    }
            },
            _getTickPoints: function(length, width, layout) {
                var that = this,
                    x1,
                    x2,
                    y1,
                    y2;
                if (that.vertical) {
                    x1 = layout.x - length * that._inner;
                    x2 = layout.x + length * that._outer;
                    y1 = -width / 2;
                    y2 = +width / 2
                }
                else {
                    x1 = -width / 2;
                    x2 = +width / 2;
                    y1 = layout.y - length * that._inner;
                    y2 = layout.y + length * that._outer
                }
                return [x1, y1, x2, y1, x2, y2, x1, y2]
            },
            _moveTick: function(element, tick) {
                var x = 0,
                    y = 0;
                if (this.vertical)
                    y = tick.position;
                else
                    x = tick.position;
                element.move(x, y)
            },
            _getAxisLabelPosition: function(tickLength, textIndent, layout) {
                var position = tickLength * (textIndent >= 0 ? this._outer : -this._inner) + textIndent;
                if (this.vertical)
                    position += layout.x;
                else
                    position += layout.y + (textIndent >= 0 ? 1 : -1) * (this._textVerticalOffset || 0);
                return position
            },
            _getLabelAlign: function(textIndent) {
                return this.vertical ? textIndent > 0 ? 'left' : 'right' : 'center'
            },
            _applyOverlappingOptions: function(options) {
                options.overlappingBehaviorType = "linear"
            },
            _getLabelOptions: function(textValue, textPosition, textIndent, tick) {
                var x,
                    y;
                if (this.vertical) {
                    x = textPosition;
                    y = tick.position
                }
                else {
                    x = tick.position;
                    y = textPosition
                }
                return {
                        x: x,
                        y: y
                    }
            },
            measure: function(layout) {
                var that = this,
                    p = layout[that.vertical ? 'x' : 'y'],
                    result = {
                        min: p,
                        max: p
                    };
                if (that._majorTicksEnabled) {
                    result.min = _min(result.min, p - that._inner * that._options.majorTick.length);
                    result.max = _max(result.max, p + that._outer * that._options.majorTick.length)
                }
                if (that._minorTicksEnabled) {
                    result.min = _min(result.min, p - that._inner * that._options.minorTick.length);
                    result.max = _max(result.max, p + that._outer * that._options.minorTick.length)
                }
                if (that._labelsEnabled) {
                    if (that._options.label.indentFromTick > 0)
                        result.max += +_Number(that._options.label.indentFromTick) + that[that.vertical ? '_textWidth' : '_textHeight'];
                    else
                        result.min -= -_Number(that._options.label.indentFromTick) + that[that.vertical ? '_textWidth' : '_textHeight'];
                    result.indent = that[that.vertical ? '_textHeight' : '_textWidth'] / 2
                }
                return result
            }
        })
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file rangeContainer.js */
    (function(DX, $, undefined) {
        var _Number = Number,
            _String = String,
            _max = Math.max,
            _abs = Math.abs,
            _isString = DX.utils.isString,
            _isArray = DX.utils.isArray,
            _isFinite = isFinite,
            _each = $.each,
            _map = $.map,
            _Palette = DX.viz.core.Palette;
        DX.viz.gauges.__internals.BaseRangeContainer = DX.viz.gauges.__internals.BaseElement.inherit({
            _init: function() {
                this._root = this._renderer.g().attr({'class': 'dxg-range-container'})
            },
            clean: function() {
                this._root.remove().clear();
                this._options = this.enabled = null;
                return this
            },
            _getRanges: function() {
                var that = this,
                    options = that._options,
                    translator = that._translator,
                    totalStart = translator.getDomain()[0],
                    totalEnd = translator.getDomain()[1],
                    totalDelta = totalEnd - totalStart,
                    isNotEmptySegment = totalDelta >= 0 ? isNotEmptySegmentAsc : isNotEmptySegmentDes,
                    subtractSegment = totalDelta >= 0 ? subtractSegmentAsc : subtractSegmentDes,
                    list = [],
                    ranges = [],
                    backgroundRanges = [{
                            start: totalStart,
                            end: totalEnd
                        }],
                    threshold = _abs(totalDelta) / 1E4,
                    palette = new _Palette(options.palette, {
                        type: 'indicatingSet',
                        theme: options.themeName
                    }),
                    backgroundColor = _isString(options.backgroundColor) ? options.backgroundColor : 'none',
                    width = options.width || {},
                    startWidth = _Number(width > 0 ? width : width.start),
                    endWidth = _Number(width > 0 ? width : width.end),
                    deltaWidth = endWidth - startWidth;
                if (options.ranges !== undefined && !_isArray(options.ranges))
                    return null;
                if (!(startWidth >= 0 && endWidth >= 0 && startWidth + endWidth > 0))
                    return null;
                list = _map(_isArray(options.ranges) ? options.ranges : [], function(rangeOptions, i) {
                    rangeOptions = rangeOptions || {};
                    var start = translator.adjust(rangeOptions.startValue),
                        end = translator.adjust(rangeOptions.endValue);
                    return _isFinite(start) && _isFinite(end) && isNotEmptySegment(start, end, threshold) ? {
                            start: start,
                            end: end,
                            color: rangeOptions.color,
                            classIndex: i
                        } : null
                });
                _each(list, function(i, item) {
                    var paletteColor = palette.getNextColor();
                    item.color = _isString(item.color) && item.color || paletteColor || 'none';
                    item.className = 'dxg-range dxg-range-' + item.classIndex;
                    delete item.classIndex
                });
                _each(list, function(_, item) {
                    var i,
                        ii,
                        sub,
                        subs,
                        range,
                        newRanges = [],
                        newBackgroundRanges = [];
                    for (i = 0, ii = ranges.length; i < ii; ++i) {
                        range = ranges[i];
                        subs = subtractSegment(range.start, range.end, item.start, item.end);
                        (sub = subs[0]) && (sub.color = range.color) && (sub.className = range.className) && newRanges.push(sub);
                        (sub = subs[1]) && (sub.color = range.color) && (sub.className = range.className) && newRanges.push(sub)
                    }
                    newRanges.push(item);
                    ranges = newRanges;
                    for (i = 0, ii = backgroundRanges.length; i < ii; ++i) {
                        range = backgroundRanges[i];
                        subs = subtractSegment(range.start, range.end, item.start, item.end);
                        (sub = subs[0]) && newBackgroundRanges.push(sub);
                        (sub = subs[1]) && newBackgroundRanges.push(sub)
                    }
                    backgroundRanges = newBackgroundRanges
                });
                _each(backgroundRanges, function(_, range) {
                    range.color = backgroundColor;
                    range.className = 'dxg-range dxg-background-range';
                    ranges.push(range)
                });
                _each(ranges, function(_, range) {
                    range.startWidth = (range.start - totalStart) / totalDelta * deltaWidth + startWidth;
                    range.endWidth = (range.end - totalStart) / totalDelta * deltaWidth + startWidth
                });
                return ranges
            },
            render: function(options) {
                var that = this;
                that._options = options;
                that._processOptions();
                that._ranges = that._getRanges();
                if (that._ranges) {
                    that.enabled = true;
                    that._root.append(that._container)
                }
                return that
            },
            resize: function(layout) {
                var that = this;
                that._root.clear();
                if (that._isVisible(layout))
                    _each(that._ranges, function(_, range) {
                        that._createRange(range, layout).attr({
                            fill: range.color,
                            'class': range.className
                        }).append(that._root)
                    });
                return that
            },
            _processOptions: null,
            _isVisible: null,
            _createRange: null,
            getColorForValue: function(value) {
                var color = null;
                _each(this._ranges, function(_, range) {
                    if (range.start <= value && value <= range.end || range.start >= value && value >= range.end) {
                        color = range.color;
                        return false
                    }
                });
                return color
            }
        });
        function subtractSegmentAsc(segmentStart, segmentEnd, otherStart, otherEnd) {
            var result;
            if (otherStart > segmentStart && otherEnd < segmentEnd)
                result = [{
                        start: segmentStart,
                        end: otherStart
                    }, {
                        start: otherEnd,
                        end: segmentEnd
                    }];
            else if (otherStart >= segmentEnd || otherEnd <= segmentStart)
                result = [{
                        start: segmentStart,
                        end: segmentEnd
                    }];
            else if (otherStart <= segmentStart && otherEnd >= segmentEnd)
                result = [];
            else if (otherStart > segmentStart)
                result = [{
                        start: segmentStart,
                        end: otherStart
                    }];
            else if (otherEnd < segmentEnd)
                result = [{
                        start: otherEnd,
                        end: segmentEnd
                    }];
            return result
        }
        function subtractSegmentDes(segmentStart, segmentEnd, otherStart, otherEnd) {
            var result;
            if (otherStart < segmentStart && otherEnd > segmentEnd)
                result = [{
                        start: segmentStart,
                        end: otherStart
                    }, {
                        start: otherEnd,
                        end: segmentEnd
                    }];
            else if (otherStart <= segmentEnd || otherEnd >= segmentStart)
                result = [{
                        start: segmentStart,
                        end: segmentEnd
                    }];
            else if (otherStart >= segmentStart && otherEnd <= segmentEnd)
                result = [];
            else if (otherStart < segmentStart)
                result = [{
                        start: segmentStart,
                        end: otherStart
                    }];
            else if (otherEnd > segmentEnd)
                result = [{
                        start: otherEnd,
                        end: segmentEnd
                    }];
            return result
        }
        function isNotEmptySegmentAsc(start, end, threshold) {
            return end - start >= threshold
        }
        function isNotEmptySegmentDes(start, end, threshold) {
            return start - end >= threshold
        }
        DX.viz.gauges.__internals.CircularRangeContainer = DX.viz.gauges.__internals.BaseRangeContainer.inherit({
            _processOptions: function() {
                var that = this;
                that._inner = that._outer = 0;
                switch (_String(that._options.orientation).toLowerCase()) {
                    case'inside':
                        that._inner = 1;
                        break;
                    case'center':
                        that._inner = that._outer = 0.5;
                        break;
                    default:
                        that._outer = 1;
                        break
                }
            },
            _isVisible: function(layout) {
                var width = this._options.width;
                width = _Number(width) || _max(_Number(width.start), _Number(width.end));
                return layout.radius - this._inner * width > 0
            },
            _createRange: function(range, layout) {
                var that = this,
                    width = (range.startWidth + range.endWidth) / 2;
                return that._renderer.arc(layout.x, layout.y, layout.radius - that._inner * width, layout.radius + that._outer * width, that._translator.translate(range.end), that._translator.translate(range.start)).attr({"stroke-linejoin": "round"})
            },
            measure: function(layout) {
                var width = this._options.width;
                width = _Number(width) || _max(_Number(width.start), _Number(width.end));
                return {
                        min: layout.radius - this._inner * width,
                        max: layout.radius + this._outer * width
                    }
            }
        });
        DX.viz.gauges.__internals.LinearRangeContainer = DX.viz.gauges.__internals.BaseRangeContainer.inherit({
            _processOptions: function() {
                var that = this;
                that.vertical = that._options.vertical;
                that._inner = that._outer = 0;
                if (that.vertical)
                    switch (_String(that._options.horizontalOrientation).toLowerCase()) {
                        case'left':
                            that._inner = 1;
                            break;
                        case'center':
                            that._inner = that._outer = 0.5;
                            break;
                        default:
                            that._outer = 1;
                            break
                    }
                else
                    switch (_String(that._options.verticalOrientation).toLowerCase()) {
                        case'top':
                            that._inner = 1;
                            break;
                        case'middle':
                            that._inner = that._outer = 0.5;
                            break;
                        default:
                            that._outer = 1;
                            break
                    }
            },
            _isVisible: function() {
                return true
            },
            _createRange: function(range, layout) {
                var that = this,
                    inner = that._inner,
                    outer = that._outer,
                    startPosition = that._translator.translate(range.start),
                    endPosition = that._translator.translate(range.end),
                    points,
                    x = layout.x,
                    y = layout.y,
                    startWidth = range.startWidth,
                    endWidth = range.endWidth;
                if (that.vertical)
                    points = [x - startWidth * inner, startPosition, x - endWidth * inner, endPosition, x + endWidth * outer, endPosition, x + startWidth * outer, startPosition];
                else
                    points = [startPosition, y + startWidth * outer, startPosition, y - startWidth * inner, endPosition, y - endWidth * inner, endPosition, y + endWidth * outer];
                return that._renderer.path(points, "area")
            },
            measure: function(layout) {
                var result = {},
                    width;
                result.min = result.max = layout[this.vertical ? 'x' : 'y'];
                width = this._options.width;
                width = _Number(width) || _max(_Number(width.start), _Number(width.end));
                result.min -= this._inner * width;
                result.max += this._outer * width;
                return result
            }
        })
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file title.js */
    (function(DX, $, undefined) {
        var viz = DX.viz,
            core = viz.core,
            _isString = DX.utils.isString,
            _max = Math.max,
            _extend = $.extend;
        viz.gauges.__internals.Title = DX.Class.inherit({
            ctor: function(parameters) {
                this._renderer = parameters.renderer;
                this._container = parameters.container
            },
            dispose: function() {
                this._renderer = this._container = null;
                return this
            },
            clean: function() {
                var that = this;
                if (that._root) {
                    that._root.remove().clear();
                    that._root = that._layout = null
                }
                return that
            },
            render: function(titleOptions, subtitleOptions) {
                var that = this,
                    hasTitle = _isString(titleOptions.text) && titleOptions.text.length > 0,
                    hasSubtitle = _isString(subtitleOptions.text) && subtitleOptions.text.length > 0,
                    element,
                    bbox,
                    totalWidth = 0,
                    totalHeight = 0,
                    y = 0;
                if (!hasTitle && !hasSubtitle)
                    return that;
                that._root = that._renderer.g().attr({'class': 'dxg-title'}).append(that._container);
                if (hasTitle) {
                    element = that._renderer.text(titleOptions.text, 0, 0).attr({align: 'center'}).css(core.utils.patchFontOptions(titleOptions.font)).append(that._root);
                    bbox = element.getBBox();
                    y += -bbox.y;
                    element.attr({y: y});
                    y += bbox.height + bbox.y;
                    totalWidth = _max(totalWidth, bbox.width);
                    totalHeight += bbox.height
                }
                if (hasSubtitle) {
                    element = that._renderer.text(subtitleOptions.text, 0, 0).attr({align: 'center'}).css(core.utils.patchFontOptions(subtitleOptions.font)).append(that._root);
                    bbox = element.getBBox();
                    y += -bbox.y;
                    element.attr({y: y});
                    totalWidth = _max(totalWidth, bbox.width);
                    totalHeight += bbox.height
                }
                that._layout = _extend({
                    position: titleOptions.position,
                    width: totalWidth,
                    height: totalHeight
                }, titleOptions.layout);
                return that
            },
            getLayoutOptions: function() {
                return this._layout
            },
            locate: function(left, top) {
                this._root.attr({
                    translateX: left + this._layout.width / 2,
                    translateY: top
                });
                return this
            }
        })
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file layoutManager.js */
    (function(DX, $, undefined) {
        var _Number = Number,
            _String = String,
            _max = Math.max,
            _each = $.each;
        function patchLayoutOptions(options) {
            if (options.position) {
                var position = _String(options.position).toLowerCase().split('-');
                options.verticalAlignment = position[0];
                options.horizontalAlignment = position[1]
            }
        }
        DX.viz.gauges.__internals.LayoutManager = DX.Class.inherit({
            setRect: function(rect) {
                this._currentRect = rect.clone();
                return this
            },
            getRect: function() {
                return this._currentRect.clone()
            },
            beginLayout: function(rect) {
                this._rootRect = rect.clone();
                this._currentRect = rect.clone();
                this._cache = [];
                return this
            },
            applyLayout: function(target) {
                var options = target.getLayoutOptions(),
                    currentRect,
                    verticalOverlay;
                if (!options)
                    return this;
                currentRect = this._currentRect;
                verticalOverlay = _Number(options.overlay) || 0;
                patchLayoutOptions(options);
                switch (_String(options.verticalAlignment).toLowerCase()) {
                    case'bottom':
                        currentRect.bottom -= _max(options.height - verticalOverlay, 0);
                        break;
                    default:
                        currentRect.top += _max(options.height - verticalOverlay, 0);
                        break
                }
                this._cache.push({
                    target: target,
                    options: options
                });
                return this
            },
            endLayout: function() {
                var that = this,
                    rootRect = that._rootRect,
                    currentRect = that._currentRect;
                _each(that._cache, function(_, cacheItem) {
                    var options = cacheItem.options,
                        left,
                        top,
                        verticalOverlay = _Number(options.overlay) || 0;
                    switch (_String(options.verticalAlignment).toLowerCase()) {
                        case'bottom':
                            top = currentRect.bottom - verticalOverlay;
                            currentRect.bottom += _max(options.height - verticalOverlay, 0);
                            break;
                        default:
                            top = currentRect.top - options.height + verticalOverlay;
                            currentRect.top -= _max(options.height - verticalOverlay, 0);
                            break
                    }
                    switch (_String(options.horizontalAlignment).toLowerCase()) {
                        case'left':
                            left = rootRect.left;
                            break;
                        case'right':
                            left = rootRect.right - options.width;
                            break;
                        default:
                            left = rootRect.horizontalMiddle() - options.width / 2;
                            break
                    }
                    cacheItem.target.locate(left, top)
                });
                that._cache = null;
                return that
            },
            selectRectByAspectRatio: function(aspectRatio, margins) {
                var rect = this._currentRect.clone(),
                    selfAspectRatio,
                    width = 0,
                    height = 0;
                margins = margins || {};
                if (aspectRatio > 0) {
                    rect.left += margins.left || 0;
                    rect.right -= margins.right || 0;
                    rect.top += margins.top || 0;
                    rect.bottom -= margins.bottom || 0;
                    if (rect.width() > 0 && rect.height() > 0) {
                        selfAspectRatio = rect.height() / rect.width();
                        if (selfAspectRatio > 1)
                            aspectRatio < selfAspectRatio ? width = rect.width() : height = rect.height();
                        else
                            aspectRatio > selfAspectRatio ? height = rect.height() : width = rect.width();
                        width > 0 || (width = height / aspectRatio);
                        height > 0 || (height = width * aspectRatio);
                        width = (rect.width() - width) / 2;
                        height = (rect.height() - height) / 2;
                        rect.left += width;
                        rect.right -= width;
                        rect.top += height;
                        rect.bottom -= height
                    }
                    else {
                        rect.left = rect.right = rect.horizontalMiddle();
                        rect.top = rect.bottom = rect.verticalMiddle()
                    }
                }
                return rect
            },
            selectRectBySizes: function(sizes, margins) {
                var rect = this._currentRect.clone(),
                    step;
                margins = margins || {};
                if (sizes) {
                    rect.left += margins.left || 0;
                    rect.right -= margins.right || 0;
                    rect.top += margins.top || 0;
                    rect.bottom -= margins.bottom || 0;
                    if (sizes.width > 0) {
                        step = (rect.width() - sizes.width) / 2;
                        if (step > 0) {
                            rect.left += step;
                            rect.right -= step
                        }
                    }
                    if (sizes.height > 0) {
                        step = (rect.height() - sizes.height) / 2;
                        if (step > 0) {
                            rect.top += step;
                            rect.bottom -= step
                        }
                    }
                }
                return rect
            }
        })
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file themeManager.js */
    (function(DX, $, undefined) {
        var _extend = $.extend;
        DX.viz.gauges.__internals.ThemeManager = DX.viz.core.BaseThemeManager.inherit({
            _themeSection: 'gauge',
            _fontFields: ['scale.label.font', 'valueIndicators.rangebar.text.font', 'valueIndicators.textcloud.text.font', 'title.font', 'subtitle.font', 'tooltip.font', 'indicator.text.font', 'loadingIndicator.font'],
            _initializeTheme: function() {
                var that = this,
                    subTheme;
                if (that._subTheme) {
                    subTheme = _extend(true, {}, that._theme[that._subTheme], that._theme);
                    _extend(true, that._theme, subTheme)
                }
                that.callBase.apply(that, arguments)
            }
        })
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file baseGauge.js */
    (function(DX, $, undefined) {
        var _Number = Number,
            _isString = DX.utils.isString,
            _getAppropriateFormat = DX.utils.getAppropriateFormat,
            _extend = $.extend,
            _each = $.each;
        DX.viz.gauges.dxBaseGauge = DX.viz.core.BaseWidget.inherit({
            _rootClassPrefix: "dxg",
            _createThemeManager: function() {
                return this._factory.createThemeManager()
            },
            _initCore: function() {
                var that = this;
                that._root = that._renderer.root;
                that._translator = that._factory.createTranslator();
                that._initNotifiers();
                that._tracker = that._factory.createTracker({
                    renderer: that._renderer,
                    container: that._root
                });
                that._layoutManager = that._factory.createLayoutManager();
                that._title = that._factory.createTitle({
                    renderer: that._renderer,
                    container: that._root
                });
                that._deltaIndicator = that._factory.createDeltaIndicator({
                    renderer: that._renderer,
                    container: that._root
                });
                that._setupDomain();
                that._setTrackerCallbacks()
            },
            _setTrackerCallbacks: function() {
                var that = this,
                    renderer = that._renderer,
                    tooltip = that._tooltip;
                that._tracker.setCallbacks({
                    'tooltip-show': function(target, info) {
                        var tooltipParameters = target.getTooltipParameters(),
                            offset = renderer.getRootOffset(),
                            formatObject = _extend({
                                value: tooltipParameters.value,
                                valueText: tooltip.formatValue(tooltipParameters.value),
                                color: tooltipParameters.color
                            }, info);
                        return tooltip.show(formatObject, {
                                x: tooltipParameters.x + offset.left,
                                y: tooltipParameters.y + offset.top,
                                offset: tooltipParameters.offset
                            }, {target: info})
                    },
                    'tooltip-hide': function() {
                        return tooltip.hide()
                    }
                });
                that._resetTrackerCallbacks = function() {
                    that._resetTrackerCallbacks = that = renderer = tooltip = null
                }
            },
            _initNotifiers: function() {
                var that = this,
                    counter = 0;
                that._notifiers = {
                    dirty: function() {
                        that._resetIsReady();
                        ++counter
                    },
                    ready: function() {
                        if (--counter === 0)
                            that._drawn()
                    }
                }
            },
            _disposeCore: function() {
                var that = this;
                that._themeManager.dispose();
                that._tracker.dispose();
                that._title.dispose();
                that._deltaIndicator && that._deltaIndicator.dispose();
                that._root = that._translator = that._notifiers = that._tracker = that._layoutManager = that._title = null
            },
            _clean: function() {
                this._cleanCore()
            },
            _render: function() {
                var that = this;
                that._scheduleLoadingIndicatorHiding();
                that._setupCodomain();
                that._setupAnimationSettings();
                that._setupDefaultFormat();
                that._renderCore()
            },
            _cleanCore: function() {
                var that = this;
                that._title.clean();
                that._deltaIndicator && that._deltaIndicator.clean();
                that._tracker.deactivate();
                that._cleanContent()
            },
            _renderCore: function() {
                var that = this;
                if (!that._isValidDomain)
                    return;
                var theme = that._themeManager.theme(),
                    titleTheme = _extend(true, {}, theme.title, processTitleOptions(that.option("title"))),
                    subTitleTheme = _extend(true, {}, theme.subtitle, processTitleOptions(that.option("subtitle")));
                that._title.render(titleTheme, subTitleTheme);
                that._deltaIndicator && that._deltaIndicator.render(_extend(true, {}, theme.indicator, that.option("indicator")));
                that._layoutManager.beginLayout(that._rootRect);
                _each([that._deltaIndicator, that._title], function(_, item) {
                    item && that._layoutManager.applyLayout(item)
                });
                that._mainRect = that._layoutManager.getRect();
                that._renderContent();
                that._layoutManager.endLayout();
                that._tracker.setTooltipState(that._tooltip.isEnabled());
                that._tracker.activate();
                that._noAnimation = null;
                that.option("debugMode") === true && that._renderDebugInfo();
                that._debug_rendered && that._debug_rendered()
            },
            _setTooltipOptions: function() {
                var that = this;
                that.callBase();
                that._tracker && that._tracker.setTooltipState(that._tooltip.isEnabled())
            },
            _renderDebugInfo: function() {
                var that = this,
                    group = that._debugGroup || that._renderer.g().attr({"class": "debug-info"}).append(that._renderer.root),
                    rect;
                group.clear();
                rect = that._rootRect;
                that._renderer.rect(rect.left, rect.top, rect.width(), rect.height()).attr({
                    stroke: "#000000",
                    "stroke-width": 1,
                    fill: "none"
                }).append(group);
                rect = that._mainRect;
                that._renderer.rect(rect.left, rect.top, rect.width(), rect.height()).attr({
                    stroke: "#0000FF",
                    "stroke-width": 1,
                    fill: "none"
                }).append(group);
                rect = that._layoutManager.getRect();
                rect && that._renderer.rect(rect.left, rect.top, rect.width(), rect.height()).attr({
                    stroke: "#FF0000",
                    "stroke-width": 1,
                    fill: "none"
                }).append(group);
                rect = that._title.getLayoutOptions() ? that._title._root.getBBox() : null;
                rect && that._renderer.rect(rect.x, rect.y, rect.width, rect.height).attr({
                    stroke: "#00FF00",
                    "stroke-width": 1,
                    fill: "none"
                }).append(group);
                rect = that._deltaIndicator && that._deltaIndicator.getLayoutOptions() ? that._deltaIndicator._root.getBBox() : null;
                rect && that._renderer.rect(rect.x, rect.y, rect.width, rect.height).attr({
                    stroke: "#00FF00",
                    "stroke-width": 1,
                    fill: "none"
                }).append(group)
            },
            _applySize: function() {
                var canvas = this._canvas;
                this._rootRect = new DX.viz.core.Rectangle({
                    left: canvas.left,
                    top: canvas.top,
                    right: canvas.width - canvas.right,
                    bottom: canvas.height - canvas.bottom
                });
                this._width = canvas.width;
                this._height = canvas.height
            },
            _resize: function() {
                var that = this;
                that._resizing = that._noAnimation = true;
                that._cleanCore();
                that._renderCore();
                that._resizing = null
            },
            _setupDomain: function() {
                var that = this;
                that._setupDomainCore();
                that._isValidDomain = isFinite(1 / (that._translator.getDomain()[1] - that._translator.getDomain()[0]));
                if (!that._isValidDomain)
                    that._incidentOccured("W2301")
            },
            _setupAnimationSettings: function() {
                var that = this,
                    option = that.option("animation");
                that._animationSettings = null;
                if (option === undefined || option) {
                    option = _extend({
                        enabled: true,
                        duration: 1000,
                        easing: "easeOutCubic"
                    }, option);
                    if (option.enabled && option.duration > 0)
                        that._animationSettings = {
                            duration: _Number(option.duration),
                            easing: option.easing
                        }
                }
                that._containerBackgroundColor = that.option("containerBackgroundColor") || that._themeManager.theme().containerBackgroundColor
            },
            _setupDefaultFormat: function() {
                var domain = this._translator.getDomain();
                this._defaultFormatOptions = _getAppropriateFormat(domain[0], domain[1], this._getApproximateScreenRange())
            },
            _setupDomainCore: null,
            _calculateSize: null,
            _cleanContent: null,
            _renderContent: null,
            _setupCodomain: null,
            _getApproximateScreenRange: null,
            _factory: {
                createTranslator: function() {
                    return new DX.viz.core.Translator1D
                },
                createTracker: function(parameters) {
                    return new DX.viz.gauges.__internals.Tracker(parameters)
                },
                createLayoutManager: function() {
                    return new DX.viz.gauges.__internals.LayoutManager
                },
                createTitle: function(parameters) {
                    return new DX.viz.gauges.__internals.Title(parameters)
                },
                createDeltaIndicator: function(parameters) {
                    return DX.viz.gauges.__internals.DeltaIndicator ? new DX.viz.gauges.__internals.DeltaIndicator(parameters) : null
                }
            }
        });
        function processTitleOptions(options) {
            return _isString(options) ? {text: options} : options || {}
        }
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file gauge.js */
    (function(DX, $, undefined) {
        var _isDefined = DX.utils.isDefined,
            _isArray = DX.utils.isArray,
            _isNumber = DX.utils.isNumber,
            _isFinite = isFinite,
            _Number = Number,
            _String = String,
            _abs = Math.abs,
            _extend = $.extend,
            _each = $.each,
            _map = $.map,
            _noop = $.noop,
            _factory = DX.viz.gauges.__factory,
            OPTION_VALUE = 'value',
            OPTION_SUBVALUES = 'subvalues';
        function processValue(value, fallbackValue) {
            return _isFinite(value) ? _Number(value) : fallbackValue
        }
        function parseArrayOfNumbers(arg) {
            return _isArray(arg) ? arg : _isNumber(arg) ? [arg] : null
        }
        DX.viz.gauges.dxGauge = DX.viz.gauges.dxBaseGauge.inherit({
            _initCore: function() {
                var that = this;
                that._setupValue(that.option(OPTION_VALUE));
                that.__subvalues = parseArrayOfNumbers(that.option(OPTION_SUBVALUES));
                that._setupSubvalues(that.__subvalues);
                selectMode(that);
                that.callBase.apply(that, arguments);
                that._scale = that._createScale({
                    renderer: that._renderer,
                    container: that._root,
                    translator: that._translator
                });
                that._rangeContainer = that._createRangeContainer({
                    renderer: that._renderer,
                    container: that._root,
                    translator: that._translator
                })
            },
            _disposeCore: function() {
                var that = this;
                that.callBase.apply(that, arguments);
                that._scale.dispose();
                that._rangeContainer.dispose();
                that._disposeValueIndicators();
                that._scale = that._rangeContainer = null
            },
            _disposeValueIndicators: function() {
                var that = this;
                that._valueIndicator && that._valueIndicator.dispose();
                that._subvalueIndicatorsSet && that._subvalueIndicatorsSet.dispose();
                that._valueIndicator = that._subvalueIndicatorsSet = null
            },
            _setupDomainCore: function() {
                var that = this,
                    scaleOption = that.option('scale') || {},
                    startValue = that.option('startValue'),
                    endValue = that.option('endValue');
                startValue = _isNumber(startValue) ? _Number(startValue) : _isNumber(scaleOption.startValue) ? _Number(scaleOption.startValue) : 0;
                endValue = _isNumber(endValue) ? _Number(endValue) : _isNumber(scaleOption.endValue) ? _Number(scaleOption.endValue) : 100;
                that._baseValue = startValue < endValue ? startValue : endValue;
                that._translator.setDomain(startValue, endValue)
            },
            _cleanContent: function() {
                var that = this;
                that._rangeContainer.clean();
                that._scale.clean();
                that._cleanValueIndicators()
            },
            _renderContent: function() {
                var that = this,
                    elements;
                that._rangeContainer.render(_extend(that._getOption("rangeContainer"), {
                    themeName: that._themeManager.themeName(),
                    vertical: that._area.vertical
                }));
                that._scale.render(_extend(that._getOption("scale"), {
                    rangeContainer: that._rangeContainer.enabled ? that._rangeContainer : null,
                    approximateScreenDelta: that._getApproximateScreenRange(),
                    offset: 0,
                    vertical: that._area.vertical
                }));
                elements = _map([that._scale, that._rangeContainer].concat(that._prepareValueIndicators()), function(element) {
                    return element && element.enabled ? element : null
                });
                that._applyMainLayout(elements);
                _each(elements, function(_, element) {
                    element.resize(that._getElementLayout(element.getOffset()))
                });
                that._updateActiveElements()
            },
            _updateIndicatorSettings: function(settings) {
                var that = this;
                settings.currentValue = settings.baseValue = _isFinite(that._translator.translate(settings.baseValue)) ? _Number(settings.baseValue) : that._baseValue;
                settings.vertical = that._area.vertical;
                if (settings.text && !settings.text.format && !settings.text.precision) {
                    settings.text.format = that._defaultFormatOptions.format;
                    settings.text.precision = that._defaultFormatOptions.precision
                }
            },
            _prepareIndicatorSettings: function(options, defaultTypeField) {
                var that = this,
                    theme = that._themeManager.theme("valueIndicators"),
                    type = _String(options.type || that._themeManager.theme(defaultTypeField)).toLowerCase(),
                    settings = _extend(true, {}, theme._default, theme[type], options);
                settings.type = type;
                settings.animation = that._animationSettings;
                settings.containerBackgroundColor = that._containerBackgroundColor;
                that._updateIndicatorSettings(settings);
                return settings
            },
            _cleanValueIndicators: function() {
                this._valueIndicator && this._valueIndicator.clean();
                this._subvalueIndicatorsSet && this._subvalueIndicatorsSet.clean()
            },
            _prepareValueIndicators: function() {
                var that = this;
                that._prepareValueIndicator();
                that.__subvalues !== null && that._prepareSubvalueIndicators();
                return [that._valueIndicator, that._subvalueIndicatorsSet]
            },
            _updateActiveElements: function() {
                this._updateValueIndicator();
                this._updateSubvalueIndicators()
            },
            _prepareValueIndicator: function() {
                var that = this,
                    target = that._valueIndicator,
                    settings = that._prepareIndicatorSettings(that.option("valueIndicator") || {}, 'valueIndicatorType');
                if (target && target.type !== settings.type) {
                    target.dispose();
                    target = null
                }
                if (!target)
                    target = that._valueIndicator = that._createIndicator(settings.type, that._root, 'dxg-value-indicator', 'value-indicator');
                target.render(settings)
            },
            _createSubvalueIndicatorsSet: function() {
                var that = this,
                    owner = that._renderer.g().attr({'class': 'dxg-subvalue-indicators'});
                return new ValueIndicatorsSet({
                        root: owner,
                        container: that._root,
                        createIndicator: function(type, i) {
                            return that._createIndicator(type, owner, 'dxg-subvalue-indicator', 'subvalue-indicator', i)
                        }
                    })
            },
            _prepareSubvalueIndicators: function() {
                var that = this,
                    target = that._subvalueIndicatorsSet,
                    settings = that._prepareIndicatorSettings(that.option("subvalueIndicator") || {}, 'subvalueIndicatorType'),
                    isRecreate;
                if (!target)
                    target = that._subvalueIndicatorsSet = that._createSubvalueIndicatorsSet();
                isRecreate = settings.type !== target.type;
                target.type = settings.type;
                if (that._createIndicator(settings.type))
                    target.render(settings, isRecreate)
            },
            _setupValue: function(value) {
                this.__value = processValue(value, this.__value)
            },
            _setupSubvalues: function(subvalues) {
                var vals = subvalues === undefined ? this.__subvalues : parseArrayOfNumbers(subvalues),
                    i,
                    ii,
                    list;
                if (vals === null)
                    return;
                for (i = 0, ii = vals.length, list = []; i < ii; ++i)
                    list.push(processValue(vals[i], this.__subvalues[i]));
                this.__subvalues = list
            },
            _updateValueIndicator: function() {
                var that = this;
                that._valueIndicator && that._valueIndicator.value(that.__value, that._noAnimation);
                that._checkLoadingIndicatorHiding()
            },
            _updateSubvalueIndicators: function() {
                var that = this;
                that._subvalueIndicatorsSet && that._subvalueIndicatorsSet.values(that.__subvalues, that._noAnimation);
                that._checkLoadingIndicatorHiding()
            },
            _checkLoadingIndicatorHiding: function() {
                this.callBase(!this._resizing)
            },
            value: function(arg) {
                var that = this;
                if (arg !== undefined) {
                    that._setupValue(arg);
                    that._updateValueIndicator();
                    that.option(OPTION_VALUE, that.__value);
                    return that
                }
                return that.__value
            },
            subvalues: function(arg) {
                var that = this;
                if (arg !== undefined) {
                    if (that.__subvalues !== null) {
                        that._setupSubvalues(arg);
                        that._updateSubvalueIndicators();
                        that.option(OPTION_SUBVALUES, that.__subvalues)
                    }
                    return that
                }
                return that.__subvalues !== null ? that.__subvalues.slice() : undefined
            },
            _valueChangedHandler: function(name, val) {
                var that = this;
                switch (name) {
                    case OPTION_VALUE:
                        that._setupValue(val);
                        that._updateValueIndicator();
                        that.option(OPTION_VALUE, that.__value);
                        return true;
                    case OPTION_SUBVALUES:
                        if (that.__subvalues !== null) {
                            that._setupSubvalues(val);
                            that._updateSubvalueIndicators();
                            that.option(OPTION_SUBVALUES, that.__subvalues);
                            return true
                        }
                        return false;
                    default:
                        return false
                }
            },
            _optionChanged: function(args) {
                var that = this;
                that._scheduleLoadingIndicatorHiding();
                if (that._valueChangedHandler(args.name, args.value, args.previousValue))
                    return;
                if (args.name === "scale") {
                    that._setupDomain();
                    that._invalidate()
                }
                else
                    that.callBase.apply(that, arguments)
            },
            _optionValuesEqual: function(name, oldValue, newValue) {
                var result;
                switch (name) {
                    case OPTION_VALUE:
                        result = oldValue === newValue;
                        break;
                    case OPTION_SUBVALUES:
                        result = compareArrays(oldValue, newValue);
                        break;
                    default:
                        result = this.callBase.apply(this, arguments);
                        break
                }
                return result
            },
            _applyMainLayout: null,
            _getElementLayout: null,
            _createScale: function(parameters) {
                return _factory[this._factoryMethods.scale](parameters)
            },
            _createRangeContainer: function(parameters) {
                return _factory[this._factoryMethods.rangeContainer](parameters)
            },
            _createIndicator: function(type, owner, className, trackerType, trackerIndex, _strict) {
                var that = this,
                    indicator = _factory[that._factoryMethods.indicator]({
                        renderer: that._renderer,
                        translator: that._translator,
                        notifiers: that._notifiers,
                        owner: owner,
                        tracker: that._tracker,
                        className: className
                    }, type, _strict);
                if (indicator) {
                    indicator.type = type;
                    indicator._trackerInfo = {
                        type: trackerType,
                        index: trackerIndex
                    }
                }
                return indicator
            },
            _getApproximateScreenRange: null
        });
        DX.viz.gauges.dxGauge.prototype._factory = DX.utils.clone(DX.viz.gauges.dxBaseGauge.prototype._factory);
        DX.viz.gauges.dxGauge.prototype._factory.createThemeManager = function() {
            return new DX.viz.gauges.__internals.ThemeManager
        };
        function valueGetter(arg) {
            return arg ? arg.value : NaN
        }
        function setupValues(that, fieldName, optionItems) {
            var currentValues = that[fieldName],
                newValues = _isArray(optionItems) ? _map(optionItems, valueGetter) : [],
                i = 0,
                ii = newValues.length,
                list = [];
            for (; i < ii; ++i)
                list.push(processValue(newValues[i], currentValues[i]));
            that[fieldName] = list
        }
        function selectMode(gauge) {
            if (gauge.option(OPTION_VALUE) === undefined && gauge.option(OPTION_SUBVALUES) === undefined)
                if (gauge.option('valueIndicators') !== undefined) {
                    disableDefaultMode(gauge);
                    selectHardMode(gauge)
                }
        }
        function disableDefaultMode(that) {
            that.value = that.subvalues = _noop;
            that._setupValue = that._setupSubvalues = that._updateValueIndicator = that._updateSubvalueIndicators = null
        }
        function selectHardMode(that) {
            that._indicatorValues = [];
            setupValues(that, '_indicatorValues', that.option('valueIndicators'));
            that._valueIndicators = [];
            that._valueChangedHandler = valueChangedHandler_hardMode;
            that._updateActiveElements = updateActiveElements_hardMode;
            that._prepareValueIndicators = prepareValueIndicators_hardMode;
            that._disposeValueIndicators = disposeValueIndicators_hardMode;
            that._cleanValueIndicators = cleanValueIndicators_hardMode;
            that.indicatorValue = indicatorValue_hardMode
        }
        function valueChangedHandler_hardMode(name, val) {
            if (name === 'valueIndicators') {
                setupValues(this, '_indicatorValues', val);
                this._invalidate();
                return true
            }
            return false
        }
        function updateActiveElements_hardMode() {
            var that = this;
            _each(that._valueIndicators, function(_, valueIndicator) {
                valueIndicator.value(that._indicatorValues[valueIndicator.index], that._noAnimation)
            });
            that._checkLoadingIndicatorHiding()
        }
        function prepareValueIndicators_hardMode() {
            var that = this,
                valueIndicators = that._valueIndicators || [],
                userOptions = that.option('valueIndicators'),
                optionList = [],
                i = 0,
                ii;
            for (ii = _isArray(userOptions) ? userOptions.length : 0; i < ii; ++i)
                optionList.push(userOptions[i]);
            for (ii = valueIndicators.length; i < ii; ++i)
                optionList.push(null);
            var newValueIndicators = [];
            _each(optionList, function(i, userSettings) {
                var valueIndicator = valueIndicators[i];
                if (!userSettings) {
                    valueIndicator && valueIndicator.dispose();
                    return
                }
                var settings = that._prepareIndicatorSettings(userSettings, "valueIndicatorType");
                if (valueIndicator && valueIndicator.type !== settings.type) {
                    valueIndicator.dispose();
                    valueIndicator = null
                }
                if (!valueIndicator)
                    valueIndicator = that._createIndicator(settings.type, that._root, 'dxg-value-indicator', 'value-indicator', i, true);
                if (valueIndicator) {
                    valueIndicator.index = i;
                    valueIndicator.render(settings);
                    newValueIndicators.push(valueIndicator)
                }
            });
            that._valueIndicators = newValueIndicators;
            return that._valueIndicators
        }
        function disposeValueIndicators_hardMode() {
            _each(this._valueIndicators, function(_, valueIndicator) {
                valueIndicator.dispose()
            });
            this._valueIndicators = null
        }
        function cleanValueIndicators_hardMode() {
            _each(this._valueIndicators, function(_, valueIndicator) {
                valueIndicator.clean()
            })
        }
        function indicatorValue_hardMode(index, value) {
            return accessPointerValue(this, this._valueIndicators, this._indicatorValues, index, value)
        }
        function accessPointerValue(that, pointers, values, index, value) {
            if (value !== undefined) {
                if (values[index] !== undefined) {
                    values[index] = processValue(value, values[index]);
                    pointers[index] && pointers[index].value(values[index]);
                    that._checkLoadingIndicatorHiding()
                }
                return that
            }
            else
                return values[index]
        }
        function compareArrays(array1, array2) {
            var i,
                ii;
            if (array1 === array2)
                return true;
            if (_isArray(array1) && _isArray(array2) && array1.length === array2.length) {
                for (i = 0, ii = array1.length; i < ii; ++i)
                    if (_abs(array1[i] - array2[i]) > 1E-8)
                        return false;
                return true
            }
            return false
        }
        function ValueIndicatorsSet(parameters) {
            this._parameters = parameters;
            this._indicators = []
        }
        ValueIndicatorsSet.prototype = {
            costructor: ValueIndicatorsSet,
            dispose: function() {
                var that = this;
                _each(that._indicators, function(_, indicator) {
                    indicator.dispose()
                });
                that._parameters = that._options = that._indicators = that._colorPalette = that._palette = null;
                return that
            },
            clean: function() {
                var that = this;
                that._parameters.root.remove();
                that._sample && that._sample.clean().dispose();
                _each(that._indicators, function(_, indicator) {
                    indicator.clean()
                });
                that._sample = that._options = that._palette = null;
                return that
            },
            render: function(options, isRecreate) {
                var that = this;
                that._options = options;
                that._sample = that._parameters.createIndicator(that.type);
                that._sample.render(options);
                that.enabled = that._sample.enabled;
                that._palette = _isDefined(options.palette) ? new DX.viz.core.Palette(options.palette) : null;
                if (that.enabled) {
                    that._parameters.root.append(that._parameters.container);
                    that._generatePalette(that._indicators.length);
                    that._indicators = _map(that._indicators, function(indicator, i) {
                        if (isRecreate) {
                            indicator.dispose();
                            indicator = that._parameters.createIndicator(that.type, i)
                        }
                        indicator.render(that._getIndicatorOptions(i));
                        return indicator
                    })
                }
                return that
            },
            getOffset: function() {
                return _Number(this._options.offset) || 0
            },
            resize: function(layout) {
                var that = this;
                that._layout = layout;
                _each(that._indicators, function(_, indicator) {
                    indicator.resize(layout)
                });
                return that
            },
            measure: function(layout) {
                return this._sample.measure(layout)
            },
            _getIndicatorOptions: function(index) {
                var result = this._options;
                if (this._colorPalette)
                    result = _extend({}, result, {color: this._colorPalette[index]});
                return result
            },
            _generatePalette: function(count) {
                var that = this,
                    colors = null;
                if (that._palette) {
                    colors = [];
                    that._palette.reset();
                    var i = 0;
                    for (; i < count; ++i)
                        colors.push(that._palette.getNextColor())
                }
                that._colorPalette = colors
            },
            _adjustIndicatorsCount: function(count) {
                var that = this,
                    indicators = that._indicators,
                    i,
                    ii,
                    indicator,
                    indicatorsLen = indicators.length;
                if (indicatorsLen > count) {
                    for (i = count, ii = indicatorsLen; i < ii; ++i)
                        indicators[i].clean().dispose();
                    that._indicators = indicators.slice(0, count);
                    that._generatePalette(indicators.length)
                }
                else if (indicatorsLen < count) {
                    that._generatePalette(count);
                    for (i = indicatorsLen, ii = count; i < ii; ++i) {
                        indicator = that._parameters.createIndicator(that.type, i);
                        indicator.render(that._getIndicatorOptions(i)).resize(that._layout);
                        indicators.push(indicator)
                    }
                }
            },
            values: function(arg, _noAnimation) {
                var that = this;
                if (!that.enabled)
                    return;
                if (arg !== undefined) {
                    if (!_isArray(arg))
                        arg = _isFinite(arg) ? [Number(arg)] : null;
                    if (arg) {
                        that._adjustIndicatorsCount(arg.length);
                        _each(that._indicators, function(i, indicator) {
                            indicator.value(arg[i], _noAnimation)
                        })
                    }
                    return that
                }
                return _map(that._indicators, function(indicator) {
                        return indicator.value()
                    })
            }
        }
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file circularGauge.js */
    (function(DX, $, undefined) {
        var _isFinite = isFinite,
            _Number = Number,
            _normalizeAngle = DX.utils.normalizeAngle,
            _getCosAndSin = DX.utils.getCosAndSin,
            _abs = Math.abs,
            _max = Math.max,
            _min = Math.min,
            _round = Math.round,
            _each = $.each,
            PI = Math.PI;
        function getSides(startAngle, endAngle) {
            var startCosSin = _getCosAndSin(startAngle),
                endCosSin = _getCosAndSin(endAngle),
                startCos = startCosSin.cos,
                startSin = startCosSin.sin,
                endCos = endCosSin.cos,
                endSin = endCosSin.sin;
            return {
                    left: startSin <= 0 && endSin >= 0 || startSin <= 0 && endSin <= 0 && startCos <= endCos || startSin >= 0 && endSin >= 0 && startCos >= endCos ? -1 : _min(startCos, endCos, 0),
                    right: startSin >= 0 && endSin <= 0 || startSin >= 0 && endSin >= 0 && startCos >= endCos || startSin <= 0 && endSin <= 0 && startCos <= endCos ? 1 : _max(startCos, endCos, 0),
                    up: startCos <= 0 && endCos >= 0 || startCos <= 0 && endCos <= 0 && startSin >= endSin || startCos >= 0 && endCos >= 0 && startSin <= endSin ? -1 : -_max(startSin, endSin, 0),
                    down: startCos >= 0 && endCos <= 0 || startCos >= 0 && endCos >= 0 && startSin <= endSin || startCos <= 0 && endCos <= 0 && startSin >= endSin ? 1 : -_min(startSin, endSin, 0)
                }
        }
        DX.registerComponent("dxCircularGauge", DX.viz.gauges, DX.viz.gauges.dxGauge.inherit({
            _rootClass: "dxg-circular-gauge",
            _factoryMethods: {
                scale: 'createCircularScale',
                rangeContainer: 'createCircularRangeContainer',
                indicator: 'createCircularIndicator'
            },
            _setupCodomain: function() {
                var that = this,
                    geometry = that.option("geometry") || {},
                    startAngle = geometry.startAngle,
                    endAngle = geometry.endAngle,
                    sides;
                startAngle = _isFinite(startAngle) ? _normalizeAngle(startAngle) : 225;
                endAngle = _isFinite(endAngle) ? _normalizeAngle(endAngle) : -45;
                if (_abs(startAngle - endAngle) < 1) {
                    endAngle -= 360;
                    sides = {
                        left: -1,
                        up: -1,
                        right: 1,
                        down: 1
                    }
                }
                else {
                    startAngle < endAngle && (endAngle -= 360);
                    sides = getSides(startAngle, endAngle)
                }
                that._area = {
                    x: 0,
                    y: 0,
                    radius: 100,
                    startCoord: startAngle,
                    endCoord: endAngle,
                    scaleRadius: geometry.scaleRadius > 0 ? _Number(geometry.scaleRadius) : undefined,
                    sides: sides
                };
                that._translator.setCodomain(startAngle, endAngle)
            },
            _measureMainElements: function(elements) {
                var that = this,
                    radius = that._area.radius,
                    maxRadius = 0,
                    minRadius = Infinity,
                    maxHorizontalOffset = 0,
                    maxVerticalOffset = 0,
                    maxInverseHorizontalOffset = 0,
                    maxInverseVerticalOffset = 0;
                _each(elements, function(_, element) {
                    var bounds = element.measure({radius: radius - element.getOffset()});
                    bounds.min > 0 && (minRadius = _min(minRadius, bounds.min));
                    bounds.max > 0 && (maxRadius = _max(maxRadius, bounds.max));
                    bounds.horizontalOffset > 0 && (maxHorizontalOffset = _max(maxHorizontalOffset, bounds.max + bounds.horizontalOffset));
                    bounds.verticalOffset > 0 && (maxVerticalOffset = _max(maxVerticalOffset, bounds.max + bounds.verticalOffset));
                    bounds.inverseHorizontalOffset > 0 && (maxInverseHorizontalOffset = _max(maxInverseHorizontalOffset, bounds.inverseHorizontalOffset));
                    bounds.inverseVerticalOffset > 0 && (maxInverseVerticalOffset = _max(maxInverseVerticalOffset, bounds.inverseVerticalOffset))
                });
                maxHorizontalOffset = _max(maxHorizontalOffset - maxRadius, 0);
                maxVerticalOffset = _max(maxVerticalOffset - maxRadius, 0);
                return {
                        minRadius: minRadius,
                        maxRadius: maxRadius,
                        horizontalMargin: maxHorizontalOffset,
                        verticalMargin: maxVerticalOffset,
                        inverseHorizontalMargin: maxInverseHorizontalOffset,
                        inverseVerticalMargin: maxInverseVerticalOffset
                    }
            },
            _applyMainLayout: function(elements) {
                var that = this,
                    measurements = that._measureMainElements(elements),
                    area = that._area,
                    sides = area.sides,
                    margins = {
                        left: (sides.left < -0.1 ? measurements.horizontalMargin : measurements.inverseHorizontalMargin) || 0,
                        right: (sides.right > 0.1 ? measurements.horizontalMargin : measurements.inverseHorizontalMargin) || 0,
                        top: (sides.up < -0.1 ? measurements.verticalMargin : measurements.inverseVerticalMargin) || 0,
                        bottom: (sides.down > 0.1 ? measurements.verticalMargin : measurements.inverseVerticalMargin) || 0
                    },
                    rect = that._layoutManager.selectRectByAspectRatio((sides.down - sides.up) / (sides.right - sides.left), margins),
                    radius = _min(rect.width() / (sides.right - sides.left), rect.height() / (sides.down - sides.up)),
                    x,
                    y,
                    scaler = (measurements.maxRadius - area.radius + area.scaleRadius) / radius;
                if (0 < scaler && scaler < 1) {
                    rect = rect.scale(scaler);
                    radius *= scaler
                }
                radius = radius - measurements.maxRadius + area.radius;
                x = rect.left - rect.width() * sides.left / (sides.right - sides.left);
                y = rect.top - rect.height() * sides.up / (sides.down - sides.up);
                area.x = _round(x);
                area.y = _round(y);
                area.radius = radius;
                rect.left -= margins.left;
                rect.right += margins.right;
                rect.top -= margins.top;
                rect.bottom += margins.bottom;
                that._layoutManager.setRect(rect)
            },
            _getElementLayout: function(offset) {
                return {
                        x: this._area.x,
                        y: this._area.y,
                        radius: _round(this._area.radius - offset)
                    }
            },
            _getApproximateScreenRange: function() {
                var that = this,
                    area = that._area,
                    r = _min(that._canvas.width / (area.sides.right - area.sides.left), that._canvas.height / (area.sides.down - area.sides.up));
                r > area.totalRadius && (r = area.totalRadius);
                r = 0.8 * r;
                return -that._translator.getCodomainRange() * r * PI / 180
            },
            _getDefaultSize: function() {
                return {
                        width: 300,
                        height: 300
                    }
            }
        }));
        DX.viz.gauges.dxCircularGauge.prototype._factory = DX.utils.clone(DX.viz.gauges.dxBaseGauge.prototype._factory);
        DX.viz.gauges.dxCircularGauge.prototype._factory.createThemeManager = function() {
            var themeManager = new DX.viz.gauges.__internals.ThemeManager;
            themeManager._subTheme = "_circular";
            return themeManager
        }
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file linearGauge.js */
    (function(DX, $, undefined) {
        var _String = String,
            _Number = Number,
            _max = Math.max,
            _min = Math.min,
            _round = Math.round,
            _each = $.each;
        DX.registerComponent("dxLinearGauge", DX.viz.gauges, DX.viz.gauges.dxGauge.inherit({
            _rootClass: 'dxg-linear-gauge',
            _factoryMethods: {
                scale: 'createLinearScale',
                rangeContainer: 'createLinearRangeContainer',
                indicator: 'createLinearIndicator'
            },
            _setupCodomain: function() {
                var that = this,
                    geometry = that.option('geometry') || {},
                    vertical = _String(geometry.orientation).toLowerCase() === 'vertical';
                that._area = {
                    vertical: vertical,
                    x: 0,
                    y: 0,
                    startCoord: -100,
                    endCoord: 100,
                    scaleSize: geometry.scaleSize > 0 ? _Number(geometry.scaleSize) : undefined
                };
                that._scale.vertical = vertical;
                that._rangeContainer.vertical = vertical
            },
            _measureMainElements: function(elements) {
                var that = this,
                    x = that._area.x,
                    y = that._area.y,
                    minBound = 1000,
                    maxBound = 0,
                    indent = 0;
                _each(elements, function(_, element) {
                    var bounds = element.measure({
                            x: x + element.getOffset(),
                            y: y + element.getOffset()
                        });
                    maxBound = _max(maxBound, bounds.max);
                    minBound = _min(minBound, bounds.min);
                    bounds.indent > 0 && (indent = _max(indent, bounds.indent))
                });
                return {
                        minBound: minBound,
                        maxBound: maxBound,
                        indent: indent
                    }
            },
            _applyMainLayout: function(elements) {
                var that = this,
                    measurements = that._measureMainElements(elements),
                    area = that._area,
                    rect,
                    offset,
                    counterSize = area.scaleSize + 2 * measurements.indent;
                if (area.vertical) {
                    rect = that._layoutManager.selectRectBySizes({
                        width: measurements.maxBound - measurements.minBound,
                        height: counterSize
                    });
                    offset = rect.horizontalMiddle() - (measurements.minBound + measurements.maxBound) / 2;
                    area.startCoord = rect.bottom - measurements.indent;
                    area.endCoord = rect.top + measurements.indent;
                    area.x = _round(area.x + offset)
                }
                else {
                    rect = that._layoutManager.selectRectBySizes({
                        height: measurements.maxBound - measurements.minBound,
                        width: counterSize
                    });
                    offset = rect.verticalMiddle() - (measurements.minBound + measurements.maxBound) / 2;
                    area.startCoord = rect.left + measurements.indent;
                    area.endCoord = rect.right - measurements.indent;
                    area.y = _round(area.y + offset)
                }
                that._translator.setCodomain(area.startCoord, area.endCoord);
                that._layoutManager.setRect(rect)
            },
            _getElementLayout: function(offset) {
                return {
                        x: _round(this._area.x + offset),
                        y: _round(this._area.y + offset)
                    }
            },
            _getApproximateScreenRange: function() {
                var that = this,
                    area = that._area,
                    s = area.vertical ? that._canvas.height : that._canvas.width;
                s > area.totalSize && (s = area.totalSize);
                s = s * 0.8;
                return s
            },
            _getDefaultSize: function() {
                var geometry = this.option('geometry') || {};
                if (geometry.orientation === 'vertical')
                    return {
                            width: 100,
                            height: 300
                        };
                else
                    return {
                            width: 300,
                            height: 100
                        }
            }
        }));
        DX.viz.gauges.dxLinearGauge.prototype._factory = DX.utils.clone(DX.viz.gauges.dxBaseGauge.prototype._factory);
        DX.viz.gauges.dxLinearGauge.prototype._factory.createThemeManager = function() {
            var themeManager = new DX.viz.gauges.__internals.ThemeManager;
            themeManager._subTheme = '_linear';
            return themeManager
        }
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file barGauge.js */
    (function(DX, $, undefined) {
        var PI_DIV_180 = Math.PI / 180,
            _abs = Math.abs,
            _round = Math.round,
            _floor = Math.floor,
            _min = Math.min,
            _max = Math.max,
            _isArray = DX.utils.isArray,
            _convertAngleToRendererSpace = DX.utils.convertAngleToRendererSpace,
            _getCosAndSin = DX.utils.getCosAndSin,
            _patchFontOptions = DX.viz.core.utils.patchFontOptions,
            _Number = Number,
            _isFinite = isFinite,
            _noop = $.noop,
            _extend = $.extend,
            _getSampleText = DX.viz.gauges.__internals.getSampleText,
            _formatValue = DX.viz.gauges.__internals.formatValue,
            _Palette = DX.viz.core.Palette,
            OPTION_VALUES = "values";
        var dxBarGauge = DX.viz.gauges.dxBaseGauge.inherit({
                _rootClass: "dxbg-bar-gauge",
                _initCore: function() {
                    var that = this;
                    that.callBase.apply(that, arguments);
                    that._barsGroup = that._renderer.g().attr({"class": "dxbg-bars"});
                    that._values = [];
                    that._context = {
                        renderer: that._renderer,
                        translator: that._translator,
                        tracker: that._tracker,
                        group: that._barsGroup
                    };
                    that._animateStep = function(pos) {
                        var bars = that._bars,
                            i,
                            ii;
                        for (i = 0, ii = bars.length; i < ii; ++i)
                            bars[i].animate(pos)
                    };
                    that._animateComplete = function() {
                        var bars = that._bars,
                            i,
                            ii;
                        for (i = 0, ii = bars.length; i < ii; ++i)
                            bars[i].endAnimation();
                        that._notifiers.ready()
                    }
                },
                _disposeCore: function() {
                    var that = this;
                    that._barsGroup = that._values = that._context = that._animateStep = that._animateComplete = null;
                    that.callBase.apply(that, arguments)
                },
                _setupDomainCore: function() {
                    var that = this,
                        startValue = that.option("startValue"),
                        endValue = that.option("endValue");
                    _isFinite(startValue) || (startValue = 0);
                    _isFinite(endValue) || (endValue = 100);
                    that._translator.setDomain(startValue, endValue);
                    that._baseValue = that._translator.adjust(that.option("baseValue"));
                    _isFinite(that._baseValue) || (that._baseValue = startValue < endValue ? startValue : endValue)
                },
                _getDefaultSize: function() {
                    return {
                            width: 300,
                            height: 300
                        }
                },
                _setupCodomain: DX.viz.gauges.dxCircularGauge.prototype._setupCodomain,
                _getApproximateScreenRange: function() {
                    var that = this,
                        sides = that._area.sides,
                        width = that._canvas.width / (sides.right - sides.left),
                        height = that._canvas.height / (sides.down - sides.up),
                        r = width < height ? width : height;
                    return -that._translator.getCodomainRange() * r * PI_DIV_180
                },
                _setupAnimationSettings: function() {
                    var that = this;
                    that.callBase.apply(that, arguments);
                    if (that._animationSettings) {
                        that._animationSettings.step = that._animateStep;
                        that._animationSettings.complete = that._animateComplete
                    }
                },
                _cleanContent: function() {
                    var that = this,
                        i,
                        ii;
                    that._barsGroup.remove();
                    that._animationSettings && that._barsGroup.stopAnimation();
                    for (i = 0, ii = that._bars ? that._bars.length : 0; i < ii; ++i)
                        that._bars[i].dispose();
                    that._palette = that._bars = null
                },
                _renderContent: function() {
                    var that = this,
                        labelOptions = that.option("label"),
                        text,
                        bbox,
                        context = that._context;
                    that._barsGroup.append(that._root);
                    context.textEnabled = labelOptions === undefined || labelOptions && (!("visible" in labelOptions) || labelOptions.visible);
                    if (context.textEnabled) {
                        context.textColor = labelOptions && labelOptions.font && labelOptions.font.color || null;
                        labelOptions = _extend(true, {}, that._themeManager.theme().label, labelOptions);
                        context.formatOptions = {
                            format: labelOptions.format !== undefined || labelOptions.precision !== undefined ? labelOptions.format : that._defaultFormatOptions.format,
                            precision: labelOptions.format !== undefined || labelOptions.precision !== undefined ? labelOptions.precision : that._defaultFormatOptions.precision,
                            customizeText: labelOptions.customizeText
                        };
                        context.textOptions = {align: "center"};
                        context.fontStyles = _patchFontOptions(_extend({}, that._themeManager.theme().label.font, labelOptions.font, {color: null}));
                        that._textIndent = labelOptions.indent > 0 ? _Number(labelOptions.indent) : 0;
                        context.lineWidth = labelOptions.connectorWidth > 0 ? _Number(labelOptions.connectorWidth) : 0;
                        context.lineColor = labelOptions.connectorColor || null;
                        text = that._renderer.text(_getSampleText(that._translator, context.formatOptions), 0, 0).attr(context.textOptions).css(context.fontStyles).append(that._barsGroup);
                        bbox = text.getBBox();
                        text.remove();
                        context.textVerticalOffset = -bbox.y - bbox.height / 2;
                        context.textWidth = bbox.width;
                        context.textHeight = bbox.height
                    }
                    DX.viz.gauges.dxCircularGauge.prototype._applyMainLayout.call(that);
                    that._renderBars()
                },
                _measureMainElements: function() {
                    var result = {maxRadius: this._area.radius};
                    if (this._context.textEnabled) {
                        result.horizontalMargin = this._context.textWidth;
                        result.verticalMargin = this._context.textHeight
                    }
                    return result
                },
                _renderBars: function() {
                    var that = this,
                        options = _extend({}, that._themeManager.theme(), that.option()),
                        relativeInnerRadius,
                        radius,
                        area = that._area;
                    that._palette = new _Palette(options.palette, {
                        stepHighlight: 50,
                        theme: that._themeManager.themeName()
                    });
                    relativeInnerRadius = options.relativeInnerRadius > 0 && options.relativeInnerRadius < 1 ? _Number(options.relativeInnerRadius) : 0.1;
                    radius = area.radius;
                    if (that._context.textEnabled) {
                        that._textIndent = _round(_min(that._textIndent, radius / 2));
                        radius -= that._textIndent
                    }
                    that._outerRadius = _floor(radius);
                    that._innerRadius = _floor(radius * relativeInnerRadius);
                    that._barSpacing = options.barSpacing > 0 ? _Number(options.barSpacing) : 0;
                    _extend(that._context, {
                        backgroundColor: options.backgroundColor,
                        x: area.x,
                        y: area.y,
                        startAngle: area.startCoord,
                        endAngle: area.endCoord,
                        baseAngle: that._translator.translate(that._baseValue)
                    });
                    that._bars = [];
                    that._updateValues(that.option(OPTION_VALUES))
                },
                _arrangeBars: function(count) {
                    var that = this,
                        radius = that._outerRadius - that._innerRadius,
                        context = that._context,
                        spacing,
                        _count,
                        unitOffset,
                        i;
                    context.barSize = count > 0 ? _max((radius - (count - 1) * that._barSpacing) / count, 1) : 0;
                    spacing = count > 1 ? _max(_min((radius - count * context.barSize) / (count - 1), that._barSpacing), 0) : 0;
                    _count = _min(_floor((radius + spacing) / context.barSize), count);
                    that._setBarsCount(_count);
                    radius = that._outerRadius;
                    context.textRadius = radius + that._textIndent;
                    that._palette.reset();
                    unitOffset = context.barSize + spacing;
                    for (i = 0; i < _count; ++i, radius -= unitOffset)
                        that._bars[i].arrange({
                            radius: radius,
                            color: that._palette.getNextColor()
                        })
                },
                _setBarsCount: function(count) {
                    var that = this,
                        i,
                        ii;
                    if (that._bars.length > count) {
                        for (i = count, ii = that._bars.length; i < ii; ++i)
                            that._bars[i].dispose();
                        that._bars.splice(count, ii - count)
                    }
                    else if (that._bars.length < count)
                        for (i = that._bars.length, ii = count; i < ii; ++i)
                            that._bars.push(new BarWrapper(i, that._context));
                    if (that._bars.length > 0) {
                        if (that._dummyBackground) {
                            that._dummyBackground.dispose();
                            that._dummyBackground = null
                        }
                    }
                    else {
                        if (!that._dummyBackground)
                            that._dummyBackground = that._renderer.arc().attr({"stroke-linejoin": "round"}).append(that._barsGroup);
                        that._dummyBackground.attr({
                            x: that._context.x,
                            y: that._context.y,
                            outerRadius: that._outerRadius,
                            innerRadius: that._innerRadius,
                            startAngle: that._context.endAngle,
                            endAngle: that._context.startAngle,
                            fill: that._context.backgroundColor
                        })
                    }
                },
                _updateBars: function(values) {
                    var that = this,
                        i,
                        ii;
                    for (i = 0, ii = that._bars.length; i < ii; ++i)
                        that._bars[i].setValue(values[i])
                },
                _animateBars: function(values) {
                    var that = this,
                        i,
                        ii = that._bars.length;
                    if (ii > 0) {
                        for (i = 0; i < ii; ++i)
                            that._bars[i].beginAnimation(values[i]);
                        that._barsGroup.animate({_: 0}, that._animationSettings)
                    }
                },
                _updateValues: function(values) {
                    var that = this,
                        list = _isArray(values) && values || _isFinite(values) && [values] || [],
                        i,
                        ii = list.length,
                        value,
                        barValues = [],
                        immediateReady = true;
                    that._values.length = ii;
                    for (i = 0; i < ii; ++i) {
                        value = list[i];
                        that._values[i] = value = _Number(_isFinite(value) ? value : that._values[i]);
                        if (_isFinite(value))
                            barValues.push(value)
                    }
                    that._notifiers.dirty();
                    that._animationSettings && that._barsGroup.stopAnimation();
                    if (that._bars) {
                        that._arrangeBars(barValues.length);
                        if (that._animationSettings && !that._noAnimation) {
                            immediateReady = false;
                            that._animateBars(barValues)
                        }
                        else
                            that._updateBars(barValues)
                    }
                    immediateReady && that._notifiers.ready();
                    !that._resizing && that.option(OPTION_VALUES, that._values);
                    that._checkLoadingIndicatorHiding(!that._resizing)
                },
                values: function(arg) {
                    if (arg !== undefined) {
                        this._updateValues(arg);
                        return this
                    }
                    else
                        return this._values.slice(0)
                },
                _optionChanged: function(args) {
                    var that = this;
                    that._scheduleLoadingIndicatorHiding();
                    switch (args.name) {
                        case"startValue":
                        case"endValue":
                            that._setupDomain();
                            that._invalidate();
                            break;
                        case OPTION_VALUES:
                            this._updateValues(args.value);
                            break;
                        default:
                            that.callBase(args);
                            break
                    }
                },
                _optionValuesEqual: function(name, oldValue, newValue) {
                    if (name === OPTION_VALUES)
                        return compareArrays(oldValue, newValue);
                    else
                        return this.callBase.apply(this, arguments)
                }
            });
        DX.registerComponent("dxBarGauge", DX.viz.gauges, dxBarGauge);
        var ThemeManager = DX.viz.gauges.__internals.ThemeManager.inherit({
                _themeSection: "barGauge",
                _fontFields: ["label.font", "title.font", "tooltip.font", "loadingIndicator.font"]
            });
        dxBarGauge.prototype._factory = DX.utils.clone(DX.viz.gauges.dxBaseGauge.prototype._factory);
        dxBarGauge.prototype._factory.createThemeManager = function() {
            return new ThemeManager
        };
        var BarWrapper = function(index, context) {
                var that = this;
                that._context = context;
                that._background = context.renderer.arc().attr({
                    "stroke-linejoin": "round",
                    fill: context.backgroundColor
                }).append(context.group);
                that._bar = context.renderer.arc().attr({"stroke-linejoin": "round"}).append(context.group);
                if (context.textEnabled) {
                    that._line = context.renderer.path([], "line").attr({"stroke-width": context.lineWidth}).append(context.group);
                    that._text = context.renderer.text("", 0, 0).css(context.fontStyles).attr(context.textOptions).append(context.group)
                }
                that._tracker = context.renderer.arc().attr({"stroke-linejoin": "round"});
                context.tracker.attach(that._tracker, that, {index: index});
                that._index = index;
                that._angle = context.baseAngle;
                that._settings = {
                    x: context.x,
                    y: context.y,
                    startAngle: context.baseAngle,
                    endAngle: context.baseAngle
                }
            };
        _extend(BarWrapper.prototype, {
            dispose: function() {
                var that = this;
                that._background.dispose();
                that._bar.dispose();
                if (that._context.textEnabled) {
                    that._line.dispose();
                    that._text.dispose()
                }
                that._context.tracker.detach(that._tracker);
                that._context = that._settings = that._background = that._bar = that._line = that._text = that._tracker = null;
                return that
            },
            arrange: function(options) {
                var that = this,
                    context = that._context;
                that._settings.outerRadius = options.radius;
                that._settings.innerRadius = options.radius - context.barSize;
                that._background.attr(_extend({}, that._settings, {
                    startAngle: context.endAngle,
                    endAngle: context.startAngle
                }));
                that._bar.attr(that._settings);
                that._tracker.attr(that._settings);
                that._color = options.color;
                that._bar.attr({fill: options.color});
                if (context.textEnabled) {
                    that._line.attr({
                        points: [context.x, context.y - that._settings.innerRadius, context.x, context.y - context.textRadius],
                        stroke: context.lineColor || options.color
                    }).sharp();
                    that._text.css({fill: context.textColor || options.color})
                }
                return that
            },
            getTooltipParameters: function() {
                var that = this,
                    cossin = _getCosAndSin((that._angle + that._context.baseAngle) / 2);
                return {
                        x: _round(that._context.x + (that._settings.outerRadius + that._settings.innerRadius) / 2 * cossin.cos),
                        y: _round(that._context.y - (that._settings.outerRadius + that._settings.innerRadius) / 2 * cossin.sin),
                        offset: 0,
                        color: that._color,
                        value: that._value
                    }
            },
            setAngle: function(angle) {
                var that = this,
                    cossin;
                that._angle = angle;
                setAngles(that._settings, that._context.baseAngle, that._angle);
                that._bar.attr(that._settings);
                that._tracker.attr(that._settings);
                if (that._context.textEnabled) {
                    that._line.rotate(_convertAngleToRendererSpace(that._angle), that._context.x, that._context.y);
                    cossin = _getCosAndSin(that._angle);
                    that._text.attr({
                        text: _formatValue(that._value, that._context.formatOptions, {index: that._index}),
                        x: that._context.x + (that._context.textRadius + that._context.textWidth * 0.6) * cossin.cos,
                        y: that._context.y - (that._context.textRadius + that._context.textHeight * 0.6) * cossin.sin + that._context.textVerticalOffset
                    })
                }
                return that
            },
            _processValue: function(value) {
                this._value = this._context.translator.adjust(value);
                return this._context.translator.translate(this._value)
            },
            setValue: function(value) {
                return this.setAngle(this._processValue(value))
            },
            beginAnimation: function(value) {
                var that = this,
                    angle = this._processValue(value);
                if (!compareFloats(that._angle, angle)) {
                    that._start = that._angle;
                    that._delta = angle - that._angle;
                    that._tracker.attr({visibility: "hidden"});
                    if (that._context.textEnabled) {
                        that._line.attr({visibility: "hidden"});
                        that._text.attr({visibility: "hidden"})
                    }
                }
                else {
                    that.animate = _noop;
                    that.setAngle(that._angle)
                }
            },
            animate: function(pos) {
                var that = this;
                that._angle = that._start + that._delta * pos;
                setAngles(that._settings, that._context.baseAngle, that._angle);
                that._bar.attr(that._settings)
            },
            endAnimation: function() {
                var that = this;
                if (that._delta !== undefined) {
                    if (compareFloats(that._angle, that._start + that._delta)) {
                        that._tracker.attr({visibility: null});
                        if (that._context.textEnabled) {
                            that._line.attr({visibility: null});
                            that._text.attr({visibility: null})
                        }
                        that.setAngle(that._angle)
                    }
                }
                else
                    delete that.animate;
                delete that._start;
                delete that._delta
            }
        });
        function setAngles(target, angle1, angle2) {
            target.startAngle = angle1 < angle2 ? angle1 : angle2;
            target.endAngle = angle1 < angle2 ? angle2 : angle1
        }
        function compareFloats(value1, value2) {
            return _abs(value1 - value2) < 0.0001
        }
        function compareArrays(array1, array2) {
            if (array1 === array2)
                return true;
            if (_isArray(array1) && _isArray(array2) && array1.length === array2.length) {
                for (var i = 0, ii = array1.length; i < ii; ++i)
                    if (!compareFloats(array1[i], array2[i]))
                        return false;
                return true
            }
            return false
        }
        var __BarWrapper = BarWrapper;
        DX.viz.gauges.__tests.BarWrapper = __BarWrapper;
        DX.viz.gauges.__tests.stubBarWrapper = function(barWrapperType) {
            BarWrapper = barWrapperType
        };
        DX.viz.gauges.__tests.restoreBarWrapper = function() {
            BarWrapper = __BarWrapper
        }
    })(DevExpress, jQuery);
    /*! Module viz-gauges, file tracker.js */
    (function(DX, $, undefined) {
        var _abs = Math.abs,
            TOOLTIP_SHOW_DELAY = 300,
            TOOLTIP_HIDE_DELAY = 300,
            TOOLTIP_TOUCH_SHOW_DELAY = 400,
            TOOLTIP_TOUCH_HIDE_DELAY = 300;
        DX.viz.gauges.__internals.Tracker = DX.Class.inherit({
            ctor: function(parameters) {
                DX.utils.debug.assertParam(parameters, 'parameters');
                DX.utils.debug.assertParam(parameters.renderer, 'parameters.renderer');
                DX.utils.debug.assertParam(parameters.container, 'parameters.container');
                var that = this;
                that._container = parameters.container;
                that._element = parameters.renderer.g().attr({
                    'class': 'dxg-tracker',
                    stroke: 'none',
                    "stroke-width": 0,
                    fill: '#000000',
                    opacity: 0.0001
                });
                that._showTooltipCallback = function() {
                    that._showTooltipTimeout = null;
                    var target = that._tooltipEvent.target,
                        data = $(target).data();
                    that._targetEvent = null;
                    if (that._tooltipTarget !== target && that._callbacks['tooltip-show'](data.target, data.info))
                        that._tooltipTarget = target
                };
                that._hideTooltipCallback = function() {
                    that._hideTooltipTimeout = null;
                    that._targetEvent = null;
                    if (that._tooltipTarget) {
                        that._callbacks['tooltip-hide']();
                        that._tooltipTarget = null
                    }
                };
                that._dispose = function() {
                    clearTimeout(that._showTooltipTimeout);
                    clearTimeout(that._hideTooltipTimeout);
                    that._showTooltipCallback = that._hideTooltipCallback = that._dispose = null
                };
                that._DEBUG_showTooltipTimeoutSet = that._DEBUG_showTooltipTimeoutCleared = that._DEBUG_hideTooltipTimeoutSet = that._DEBUG_hideTooltipTimeoutCleared = 0;
                that.TOOLTIP_SHOW_DELAY = TOOLTIP_SHOW_DELAY;
                that.TOOLTIP_HIDE_DELAY = TOOLTIP_HIDE_DELAY;
                that.TOOLTIP_TOUCH_SHOW_DELAY = TOOLTIP_TOUCH_SHOW_DELAY;
                that.TOOLTIP_TOUCH_HIDE_DELAY = TOOLTIP_TOUCH_HIDE_DELAY
            },
            dispose: function() {
                var that = this;
                that._dispose();
                that.deactivate();
                that._element.remove();
                that._container = that._element = that._context = that._callbacks = null;
                return that
            },
            activate: function() {
                this._element.append(this._container);
                return this
            },
            deactivate: function() {
                this._element.remove().clear();
                return this
            },
            attach: function(element, target, info) {
                element.data({
                    target: target,
                    info: info
                }).append(this._element);
                return this
            },
            detach: function(element) {
                element.remove();
                return this
            },
            setTooltipState: function(state) {
                var that = this,
                    data;
                that._element.off(tooltipMouseEvents).off(tooltipTouchEvents).off(tooltipMouseWheelEvents);
                if (state) {
                    data = {tracker: that};
                    that._element.on(tooltipMouseEvents, data).on(tooltipTouchEvents, data).on(tooltipMouseWheelEvents, data)
                }
                return that
            },
            setCallbacks: function(callbacks) {
                this._callbacks = callbacks;
                return this
            },
            _showTooltip: function(event, delay) {
                var that = this;
                that._hideTooltipTimeout && ++that._DEBUG_hideTooltipTimeoutCleared;
                clearTimeout(that._hideTooltipTimeout);
                that._hideTooltipTimeout = null;
                if (that._tooltipTarget === event.target)
                    return;
                clearTimeout(that._showTooltipTimeout);
                that._tooltipEvent = event;
                ++that._DEBUG_showTooltipTimeoutSet;
                that._showTooltipTimeout = setTimeout(that._showTooltipCallback, delay)
            },
            _hideTooltip: function(delay) {
                var that = this;
                that._showTooltipTimeout && ++that._DEBUG_showTooltipTimeoutCleared;
                clearTimeout(that._showTooltipTimeout);
                that._showTooltipTimeout = null;
                clearTimeout(that._hideTooltipTimeout);
                if (delay) {
                    ++that._DEBUG_hideTooltipTimeoutSet;
                    that._hideTooltipTimeout = setTimeout(that._hideTooltipCallback, delay)
                }
                else
                    that._hideTooltipCallback()
            }
        });
        var tooltipMouseEvents = {
                'mouseover.gauge-tooltip': handleTooltipMouseOver,
                'mouseout.gauge-tooltip': handleTooltipMouseOut
            };
        var tooltipMouseMoveEvents = {'mousemove.gauge-tooltip': handleTooltipMouseMove};
        var tooltipMouseWheelEvents = {'dxmousewheel.gauge-tooltip': handleTooltipMouseWheel};
        var tooltipTouchEvents = {'touchstart.gauge-tooltip': handleTooltipTouchStart};
        function handleTooltipMouseOver(event) {
            var tracker = event.data.tracker;
            tracker._x = event.pageX;
            tracker._y = event.pageY;
            tracker._element.off(tooltipMouseMoveEvents).on(tooltipMouseMoveEvents, event.data);
            tracker._showTooltip(event, TOOLTIP_SHOW_DELAY)
        }
        function handleTooltipMouseMove(event) {
            var tracker = event.data.tracker;
            if (tracker._showTooltipTimeout && _abs(event.pageX - tracker._x) > 4 || _abs(event.pageY - tracker._y) > 4) {
                tracker._x = event.pageX;
                tracker._y = event.pageY;
                tracker._showTooltip(event, TOOLTIP_SHOW_DELAY)
            }
        }
        function handleTooltipMouseOut(event) {
            var tracker = event.data.tracker;
            tracker._element.off(tooltipMouseMoveEvents);
            tracker._hideTooltip(TOOLTIP_HIDE_DELAY)
        }
        function handleTooltipMouseWheel(event) {
            event.data.tracker._hideTooltip()
        }
        var active_touch_tooltip_tracker = null;
        DX.viz.gauges.__internals.Tracker._DEBUG_reset = function() {
            active_touch_tooltip_tracker = null
        };
        function handleTooltipTouchStart(event) {
            event.preventDefault();
            var tracker = active_touch_tooltip_tracker;
            if (tracker && tracker !== event.data.tracker)
                tracker._hideTooltip(TOOLTIP_TOUCH_HIDE_DELAY);
            tracker = active_touch_tooltip_tracker = event.data.tracker;
            tracker._showTooltip(event, TOOLTIP_TOUCH_SHOW_DELAY);
            tracker._touch = true
        }
        function handleTooltipDocumentTouchStart() {
            var tracker = active_touch_tooltip_tracker;
            if (tracker) {
                if (!tracker._touch) {
                    tracker._hideTooltip(TOOLTIP_TOUCH_HIDE_DELAY);
                    active_touch_tooltip_tracker = null
                }
                tracker._touch = null
            }
        }
        function handleTooltipDocumentTouchEnd() {
            var tracker = active_touch_tooltip_tracker;
            if (tracker)
                if (tracker._showTooltipTimeout) {
                    tracker._hideTooltip(TOOLTIP_TOUCH_HIDE_DELAY);
                    active_touch_tooltip_tracker = null
                }
        }
        $(window.document).on({
            'touchstart.gauge-tooltip': handleTooltipDocumentTouchStart,
            'touchend.gauge-tooltip': handleTooltipDocumentTouchEnd
        })
    })(DevExpress, jQuery);
    DevExpress.MOD_VIZ_GAUGES = true
}