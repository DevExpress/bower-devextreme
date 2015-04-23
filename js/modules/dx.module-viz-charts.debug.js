/*! 
* DevExtreme (Charts)
* Version: 14.2.7
* Build date: Apr 17, 2015
*
* Copyright (c) 2011 - 2014 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!DevExpress.MOD_VIZ_CHARTS) {
    if (!DevExpress.MOD_VIZ_CORE)
        throw Error('Required module is not referenced: viz-core');
    /*! Module viz-charts, file chartTitle.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            vizUtils = viz.core.utils,
            isDefined = DX.utils.isDefined,
            DEFAULT_MARGIN = 10;
        function parseMargins(options) {
            options.margin = isDefined(options.margin) ? options.margin : {};
            if (typeof options.margin === 'number') {
                options.margin = options.margin >= 0 ? options.margin : DEFAULT_MARGIN;
                options.margin = {
                    top: options.margin,
                    bottom: options.margin,
                    left: options.margin,
                    right: options.margin
                }
            }
            else {
                options.margin.top = options.margin.top >= 0 ? options.margin.top : DEFAULT_MARGIN;
                options.margin.bottom = options.margin.bottom >= 0 ? options.margin.bottom : DEFAULT_MARGIN;
                options.margin.left = options.margin.left >= 0 ? options.margin.left : DEFAULT_MARGIN;
                options.margin.right = options.margin.right >= 0 ? options.margin.right : DEFAULT_MARGIN
            }
        }
        function parseAlignments(options) {
            options.verticalAlignment = (options.verticalAlignment || '').toLowerCase();
            options.horizontalAlignment = (options.horizontalAlignment || '').toLowerCase();
            if (options.verticalAlignment !== 'top' && options.verticalAlignment !== 'bottom')
                options.verticalAlignment = 'top';
            if (options.horizontalAlignment !== 'left' && options.horizontalAlignment !== 'center' && options.horizontalAlignment !== 'right')
                options.horizontalAlignment = 'center'
        }
        function endsWith(value, pattern) {
            return value.substr(value.length - pattern.length) === pattern
        }
        function startsWith(value, pattern) {
            return value.indexOf(pattern) === 0
        }
        function ChartTitle() {
            this.ctor.apply(this, arguments)
        }
        viz.charts.ChartTitle = ChartTitle;
        ChartTitle.prototype = {
            ctor: function(renderer, options, width, group) {
                var that = this;
                that.update(options, width);
                that.renderer = renderer;
                that.titleGroup = group
            },
            dispose: function() {
                var that = this;
                that.renderer = null;
                that.clipRect = null;
                that.title = null;
                that.innerTitleGroup = null;
                that.titleGroup = null;
                that.options = null
            },
            update: function(options, width) {
                var that = this;
                if (options) {
                    parseAlignments(options);
                    that.horizontalAlignment = options.horizontalAlignment;
                    that.verticalAlignment = options.verticalAlignment;
                    parseMargins(options);
                    that.margin = options.margin;
                    that.options = options
                }
                that.setSize({width: width})
            },
            _setBoundingRect: function() {
                var that = this,
                    options = that.options,
                    margin = that.changedMargin || that.margin,
                    box;
                if (!that.innerTitleGroup)
                    return;
                box = that.innerTitleGroup.getBBox();
                box.height += margin.top + margin.bottom;
                box.width += margin.left + margin.right;
                box.x -= margin.left;
                box.y -= margin.top;
                if (isDefined(options.placeholderSize))
                    box.height = options.placeholderSize;
                that.boundingRect = box
            },
            draw: function() {
                var that = this,
                    titleOptions = that.options,
                    renderer = that.renderer;
                if (!titleOptions.text)
                    return;
                that.changedMargin = null;
                if (!that.innerTitleGroup) {
                    that.innerTitleGroup = renderer.g();
                    that.clipRect = that.createClipRect();
                    that.titleGroup && that.clipRect && that.titleGroup.attr({clipId: that.clipRect.id})
                }
                else
                    that.innerTitleGroup.clear();
                that.innerTitleGroup.append(that.titleGroup);
                that.title = renderer.text(titleOptions.text, 0, 0).css(vizUtils.patchFontOptions(titleOptions.font)).attr({align: that.horizontalAlignment}).append(that.innerTitleGroup);
                that.title.text = titleOptions.text;
                that._correctTitleLength();
                that._setClipRectSettings()
            },
            _correctTitleLength: function() {
                var that = this,
                    text = that.title.text,
                    lineLength,
                    box;
                that.title.attr({text: text});
                that._setBoundingRect();
                box = that.getLayoutOptions();
                if (that._width > box.width || text.indexOf("<br/>") !== -1)
                    return;
                lineLength = text.length * that._width / box.width;
                that.title.attr({text: text.substr(0, ~~lineLength - 1 - 3) + "..."});
                that.title.setTitle(text);
                that._setBoundingRect()
            },
            changeSize: function(size) {
                var that = this,
                    margin = $.extend(true, {}, that.margin);
                if (margin.top + margin.bottom < size.height) {
                    if (that.innerTitleGroup) {
                        that.options._incidentOccured("W2103");
                        that.innerTitleGroup.dispose();
                        that.innerTitleGroup = null
                    }
                    if (that.clipRect) {
                        that.clipRect.dispose();
                        that.clipRect = null
                    }
                }
                else if (size.height > 0) {
                    vizUtils.decreaseGaps(margin, ["top", "bottom"], size.height);
                    size.height && (that.changedMargin = margin)
                }
                that._correctTitleLength();
                that._setBoundingRect();
                that._setClipRectSettings()
            },
            getLayoutOptions: function() {
                var options = this.options,
                    boundingRect = this.innerTitleGroup ? this.boundingRect : {
                        width: 0,
                        height: 0,
                        x: 0,
                        y: 0
                    };
                boundingRect.verticalAlignment = options.verticalAlignment;
                boundingRect.horizontalAlignment = options.horizontalAlignment;
                boundingRect.cutLayoutSide = options.verticalAlignment;
                return boundingRect
            },
            setSize: function(size) {
                this._width = size.width || this._width
            },
            shift: function(x, y) {
                var that = this,
                    box = that.getLayoutOptions();
                x -= box.x;
                y -= box.y;
                that.innerTitleGroup && that.innerTitleGroup.move(x, y);
                that.clipRect && that.clipRect.attr({
                    translateX: x,
                    translateY: y
                })
            },
            createClipRect: function() {
                if (isDefined(this.options.placeholderSize))
                    return this.renderer.clipRect(0, 0, 0, 0)
            },
            _setClipRectSettings: function() {
                var bbox = this.getLayoutOptions(),
                    clipRect = this.clipRect;
                if (clipRect)
                    clipRect.attr({
                        x: bbox.x,
                        y: bbox.y,
                        width: bbox.width,
                        height: bbox.height
                    })
            }
        };
        DX.viz.charts.ChartTitle.__DEFAULT_MARGIN = DEFAULT_MARGIN
    })(jQuery, DevExpress);
    /*! Module viz-charts, file axis.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            core = viz.core,
            utils = DX.utils,
            _isDefined = utils.isDefined,
            _isNumber = utils.isNumber,
            _getSignificantDigitPosition = utils.getSignificantDigitPosition,
            _roundValue = utils.roundValue,
            _math = Math,
            _abs = _math.abs,
            _round = _math.round,
            _pow = _math.pow,
            _sqrt = _math.sqrt,
            _extend = $.extend,
            _each = $.each,
            _noop = $.noop,
            _map = $.map,
            PERPENDICULAR_ANGLE = 90,
            AXIS_VALUE_MARGIN_PRIORITY = 100,
            DEFAULT_AXIS_LABEL_SPACING = 5,
            MAX_GRID_BORDER_ADHENSION = 4,
            CANVAS_POSITION_PREFIX = "canvas_position_",
            CANVAS_POSITION_START = "canvas_position_start",
            CANVAS_POSITION_BOTTOM = "canvas_position_bottom",
            CANVAS_POSITION_TOP = "canvas_position_top",
            CANVAS_POSITION_END = "canvas_position_end",
            LOGARITHMIC = "logarithmic",
            DISCRETE = "discrete",
            TOP = "top",
            BOTTOM = "bottom",
            LEFT = "left",
            RIGHT = "right",
            HALF_TICK_LENGTH = 4,
            CENTER = "center",
            LABEL_BACKGROUND_PADDING_X = 8,
            LABEL_BACKGROUND_PADDING_Y = 4,
            _Axis;
        var axesMethods = {};
        function validateOverlappingMode(mode) {
            return mode !== "ignore" ? "enlargeTickInterval" : "ignore"
        }
        function getPolarQuarter(angle) {
            var quarter;
            angle = utils.normalizeAngle(angle);
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
        function convertTicksToValues(ticks) {
            return _map(ticks || [], function(item) {
                    return item.value
                })
        }
        function convertValuesToTicks(values) {
            return _map(values || [], function(item) {
                    return {value: item}
                })
        }
        axesMethods.normal = {
            _getCssClasses: function() {
                var isHorizontal = this._options.isHorizontal;
                return {
                        axisClass: isHorizontal ? "dxc-h-axis" : "dxc-v-axis",
                        stripClass: isHorizontal ? "dxc-h-strips" : "dxc-v-strips",
                        constantLineClass: isHorizontal ? "dxc-h-constant-lines" : "dxc-v-constant-lines"
                    }
            },
            _getSharpParam: function(oposite) {
                return this._options.isHorizontal ^ oposite ? "h" : "v"
            },
            _createAxisElement: function() {
                var axisCoord = this._axisPosition,
                    canvas = this._getCanvasStartEnd(),
                    points = this._options.isHorizontal ? [canvas.start, axisCoord, canvas.end, axisCoord] : [axisCoord, canvas.start, axisCoord, canvas.end];
                return this._renderer.path(points, "line")
            },
            _getTranslatedCoord: function(value) {
                return this._translator.translate(value)
            },
            _getCanvasStartEnd: function() {
                return {
                        start: this._translator.translateSpecialCase(CANVAS_POSITION_START),
                        end: this._translator.translateSpecialCase(CANVAS_POSITION_END)
                    }
            },
            _getScreenDelta: function() {
                return _abs(this._translator.translateSpecialCase(CANVAS_POSITION_START) - this._translator.translateSpecialCase(CANVAS_POSITION_END))
            },
            _initAxisPositions: function() {
                var that = this,
                    position = that._options.position,
                    delta = 0;
                if (that.delta)
                    delta = that.delta[position] || 0;
                that._axisPosition = that._orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + position) + delta
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
                that._title = that._renderer.text(titleOptions.text, 0, 0).css(core.utils.patchFontOptions(titleOptions.font)).attr(attr).append(that._axisTitleGroup)
            },
            _adjustConstantLineLabels: function() {
                var that = this,
                    options = that._options,
                    isHorizontal = options.isHorizontal,
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
                    labelWidth;
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
                                y += labelHeight + paddingTopBottom - (box.y + labelHeight - that._orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + labelVerticalAlignment));
                                if (padding[BOTTOM] < labelHeight + paddingTopBottom)
                                    padding[BOTTOM] = labelHeight + paddingTopBottom
                            }
                            else {
                                y -= paddingTopBottom;
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
                var options = this._options,
                    position = labelOptions.position,
                    verticalAlignment = (labelOptions.verticalAlignment || "").toLowerCase(),
                    horizontalAlignment = (labelOptions.horizontalAlignment || "").toLowerCase();
                if (options.isHorizontal)
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
                    orthogonalTranslator = that._orthogonalTranslator,
                    options = that._options,
                    align = CENTER,
                    x = value,
                    y = value;
                if (options.isHorizontal)
                    y = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + lineLabelOptions.verticalAlignment);
                else
                    x = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + lineLabelOptions.horizontalAlignment);
                switch (lineLabelOptions.horizontalAlignment) {
                    case LEFT:
                        align = !options.isHorizontal && lineLabelOptions.position === "inside" ? LEFT : RIGHT;
                        break;
                    case CENTER:
                        align = CENTER;
                        break;
                    case RIGHT:
                        align = !options.isHorizontal && lineLabelOptions.position === "inside" ? RIGHT : LEFT;
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
                if (options.isHorizontal)
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
            _getTicksOptions: function() {
                var options = this._options;
                return {
                        base: options.type === LOGARITHMIC ? options.logarithmBase : undefined,
                        tickInterval: options.stubData ? null : options.tickInterval,
                        gridSpacingFactor: options.axisDivisionFactor,
                        incidentOccured: options.incidentOccured,
                        setTicksAtUnitBeginning: options.setTicksAtUnitBeginning,
                        showMinorTicks: options.minorTick.visible || options.minorGrid.visible,
                        minorTickInterval: options.minorTickInterval,
                        minorTickCount: options.minorTickCount
                    }
            },
            _getOverlappingBehaviorOptions: function() {
                var that = this,
                    options = that._options,
                    getText = function() {
                        return ""
                    },
                    overlappingBehavior = options.label.overlappingBehavior ? _extend({}, options.label.overlappingBehavior) : null;
                if (overlappingBehavior) {
                    if (!options.isHorizontal)
                        overlappingBehavior.mode = validateOverlappingMode(overlappingBehavior.mode);
                    if (overlappingBehavior.mode !== "rotate")
                        overlappingBehavior.rotationAngle = 0
                }
                if (!options.stubData)
                    getText = function(value, labelOptions) {
                        return formatLabel(value, labelOptions, {
                                min: options.min,
                                max: options.max
                            })
                    };
                return {
                        hasLabelFormat: that._hasLabelFormat,
                        labelOptions: options.label,
                        overlappingBehavior: overlappingBehavior,
                        isHorizontal: options.isHorizontal,
                        textOptions: that._textOptions,
                        textFontStyles: that._textFontStyles,
                        textSpacing: options.label.minSpacing,
                        getText: getText,
                        renderText: function(text, x, y, options) {
                            return that._renderer.text(text, x, y, options).append(that._renderer.root)
                        },
                        translate: function(value, useOrthogonalTranslator) {
                            return useOrthogonalTranslator ? that._orthogonalTranslator.translate(value) : that._translator.translate(value)
                        },
                        isInverted: that._translator.getBusinessRange().invert
                    }
            },
            getRangeData: function() {
                var options = this._options,
                    range = options.range;
                return this._getRange(options, range.min, range.max, options.categories, this.minRangeArg, this.maxRangeArg, !options.valueMarginsEnabled)
            },
            _getStripLabelCoords: function(stripLabelOptions, stripFrom, stripTo) {
                var that = this,
                    orthogonalTranslator = that._orthogonalTranslator,
                    options = that._options,
                    isHorizontal = options.isHorizontal,
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
                    y = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + stripLabelOptions.verticalAlignment)
                }
                else {
                    x = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_PREFIX + stripLabelOptions.horizontalAlignment);
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
                var that = this,
                    options = that._options,
                    categories = that._translator.getVisibleCategories() || that._range.categories,
                    categoryToSkip;
                if (categories && !!that._tickOffset && !options.valueMarginsEnabled)
                    categoryToSkip = options.inverted ? categories[0] : categories[categories.length - 1];
                return categoryToSkip
            }
        };
        axesMethods.circular = {
            _overlappingBehaviorType: "circular",
            _getCssClasses: function() {
                return {
                        axisClass: "dxc-c-axis",
                        stripClass: "dxc-c-strips",
                        constantLineClass: "dxc-c-constant-lines"
                    }
            },
            _createAxisElement: function() {
                var centerCoords = this._translator.getCenter();
                return this._renderer.circle(centerCoords.x, centerCoords.y, this._translator.getValLength())
            },
            _setBoundingRect: function() {
                this.boundingRect = {
                    width: 0,
                    height: 0
                }
            },
            _getStick: function() {
                return this._options.firstPointOnStartAngle || this._options.type !== DISCRETE
            },
            _getTicksOptions: axesMethods.normal._getTicksOptions,
            _getOverlappingBehaviorOptions: function() {
                var options = axesMethods.normal._getOverlappingBehaviorOptions.call(this),
                    translator = this._translator,
                    range = translator.getBusinessRange(),
                    indentFromAxis = this._options.label.indentFromAxis || 0;
                if (options.overlappingBehavior)
                    options.overlappingBehavior = {mode: validateOverlappingMode(options.overlappingBehavior.mode)};
                options.translate = function(value) {
                    return translator.translate(value, CANVAS_POSITION_BOTTOM)
                };
                options.addMinMax = {min: true};
                options.isInverted = range.arg.invert;
                options.circularRadius = translator.translate(CANVAS_POSITION_TOP, CANVAS_POSITION_BOTTOM).radius + indentFromAxis;
                options.circularStartAngle = options.circularEndAngle = translator.getStartAngle();
                options.isHorizontal = false;
                return options
            },
            getRangeData: function(min) {
                var options = this._options,
                    period = utils.isNumber(options.period) && options.argumentType === "numeric" ? options.period + (min || 0) : undefined;
                return this._getRange(options, undefined, period, options.categories, this.minRangeArg, this.maxRangeArg, this._getStick())
            },
            measureLabels: function() {
                var that = this,
                    options = that._options,
                    indentFromAxis = options.label.indentFromAxis || 0,
                    widthAxis = options.visible ? options.width : 0,
                    maxLabelParams;
                if (!that._axisElementsGroup || !that._options.label.visible)
                    return {
                            height: widthAxis,
                            width: widthAxis
                        };
                that._updateTickManager();
                maxLabelParams = that._tickManager.getMaxLabelParams();
                return {
                        height: maxLabelParams.height + indentFromAxis + HALF_TICK_LENGTH,
                        width: maxLabelParams.width + indentFromAxis + HALF_TICK_LENGTH
                    }
            },
            _getTranslatedCoord: function(value) {
                return this._translator.translate(value).angle
            },
            _getCanvasStartEnd: function() {
                return {
                        start: this._translator.translate(CANVAS_POSITION_START).angle,
                        end: this._translator.translate(CANVAS_POSITION_END).angle
                    }
            },
            _createStrip: function(fromAngle, toAngle, attr) {
                var center = this._translator.getCenter(),
                    r = this._translator.getValLength();
                return this._renderer.arc(center.x, center.y, 0, r, -toAngle, -fromAngle).attr(attr)
            },
            _getStripLabelCoords: function(stripLabelOptions, stripFrom, stripTo) {
                var that = this,
                    translator = that._translator,
                    angle = stripFrom + (stripTo - stripFrom) / 2,
                    cossin = utils.getCosAndSin(-angle),
                    halfRad = translator.getValLength() / 2,
                    center = translator.getCenter(),
                    x = _round(center.x + halfRad * cossin.cos),
                    y = _round(center.y - halfRad * cossin.sin);
                return {
                        x: x,
                        y: y,
                        align: CENTER
                    }
            },
            _createConstantLine: function(value, attr) {
                var center = this._translator.getCenter(),
                    r = this._translator.getValLength();
                return this._createPathElement([center.x, center.y, center.x + r, center.y], attr).rotate(value, center.x, center.y)
            },
            _getConstantLineLabelsCoords: function(value) {
                var that = this,
                    translator = that._translator,
                    cossin = utils.getCosAndSin(-value),
                    halfRad = translator.getValLength() / 2,
                    center = translator.getCenter(),
                    x = _round(center.x + halfRad * cossin.cos),
                    y = _round(center.y - halfRad * cossin.sin);
                return {
                        x: x,
                        y: y,
                        align: CENTER
                    }
            },
            _checkAlignmentConstantLineLabels: _noop,
            _getScreenDelta: function() {
                return 2 * Math.PI * this._translator.getValLength()
            },
            _getTickCoord: function(tick) {
                var center = this._translator.getCenter(),
                    r = this._translator.getValLength();
                return {
                        x1: center.x + r - HALF_TICK_LENGTH,
                        y1: center.y,
                        x2: center.x + r + HALF_TICK_LENGTH,
                        y2: center.y,
                        angle: tick.angle
                    }
            },
            _getLabelAdjustedCoord: function(tick) {
                var that = this,
                    pos = tick.labelPos,
                    cossin = utils.getCosAndSin(pos.angle),
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
                    translator = that._translator,
                    r = translator.getValLength(),
                    center = translator.getCenter();
                return function(tick) {
                        return that._createPathElement([center.x, center.y, center.x + r, center.y], tick.gridStyle).rotate(tick.angle, center.x, center.y)
                    }
            },
            _getTranslatedValue: function(value, _, offset) {
                return this._translator.translate(value, CANVAS_POSITION_BOTTOM, [-offset, 0])
            },
            _getAdjustedStripLabelCoords: function(stripOptions, label) {
                var y,
                    box = label.getBBox();
                y = label.attr("y") - box.y - box.height / 2;
                return {
                        x: 0,
                        y: y
                    }
            },
            coordsIn: function(x, y) {
                if (this._translator.untranslate(x, y).r > this._translator.getValLength())
                    return true
            },
            _rotateTick: function(tick, angle) {
                var center = this._translator.getCenter();
                tick.graphic.rotate(angle, center.x, center.y)
            }
        };
        axesMethods.linear = {
            _overlappingBehaviorType: "linear",
            getRangeData: axesMethods.circular.getRangeData,
            _getTicksOptions: axesMethods.normal._getTicksOptions,
            _getCssClasses: function() {
                return {
                        axisClass: "dxc-l-axis",
                        stripClass: "dxc-l-strips",
                        constantLineClass: "dxc-l-constant-lines"
                    }
            },
            _createAxisElement: function() {
                var centerCoord = this._translator.getCenter(),
                    points = [centerCoord.x, centerCoord.y, centerCoord.x + this._translator.getValLength(), centerCoord.y];
                return this._renderer.path(points, "line").rotate(this._translator.getBaseAngle(), centerCoord.x, centerCoord.y)
            },
            _getStick: function() {
                return !this._options.valueMarginsEnabled
            },
            _setBoundingRect: axesMethods.circular._setBoundingRect,
            _getScreenDelta: function() {
                return this._translator.getValLength()
            },
            _getTickCoord: function(tick) {
                return {
                        x1: tick.posX - HALF_TICK_LENGTH,
                        y1: tick.posY,
                        x2: tick.posX + HALF_TICK_LENGTH,
                        y2: tick.posY,
                        angle: tick.angle + PERPENDICULAR_ANGLE
                    }
            },
            _getOverlappingBehaviorOptions: function() {
                var translator = this._translator,
                    options = axesMethods.normal._getOverlappingBehaviorOptions.call(this),
                    startAngle = utils.normalizeAngle(translator.getStartAngle());
                if (options.overlappingBehavior)
                    options.overlappingBehavior = {mode: validateOverlappingMode(options.overlappingBehavior.mode)};
                options.isHorizontal = startAngle > 45 && startAngle < 135 || startAngle > 225 && startAngle < 315 ? true : false;
                options.isInverted = translator.getBusinessRange().val.invert;
                options.translate = function(value) {
                    return translator.translate(CANVAS_POSITION_TOP, value).x
                };
                return options
            },
            _getLabelAdjustedCoord: function(tick) {
                var that = this,
                    pos = tick.labelPos,
                    cossin = utils.getCosAndSin(pos.angle),
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
                    translator = that._translator,
                    pos = translator.getCenter();
                return function(tick) {
                        return that._renderer.circle(pos.x, pos.y, utils.getDistance(pos.x, pos.y, tick.posX, tick.posY)).attr(tick.gridStyle).sharp()
                    }
            },
            _getTranslatedValue: function(value, _, offset) {
                return this._translator.translate(CANVAS_POSITION_START, value, [0, offset])
            },
            _getTranslatedCoord: function(value) {
                return this._translator.translate(CANVAS_POSITION_START, value).radius
            },
            _getCanvasStartEnd: function() {
                return {
                        start: this._translator.translate(CANVAS_POSITION_START, CANVAS_POSITION_START).radius,
                        end: this._translator.translate(CANVAS_POSITION_TOP, CANVAS_POSITION_END).radius
                    }
            },
            _createStrip: function(fromPoint, toPoint, attr) {
                var center = this._translator.getCenter();
                return this._renderer.arc(center.x, center.y, fromPoint, toPoint, 0, 360).attr(attr)
            },
            _getAdjustedStripLabelCoords: axesMethods.circular._getAdjustedStripLabelCoords,
            _getStripLabelCoords: function(stripLabelOptions, stripFrom, stripTo) {
                var that = this,
                    translator = that._translator,
                    labelPos = stripFrom + (stripTo - stripFrom) / 2,
                    center = translator.getCenter(),
                    y = _round(center.y - labelPos);
                return {
                        x: center.x,
                        y: y,
                        align: CENTER
                    }
            },
            _createConstantLine: function(value, attr) {
                var center = this._translator.getCenter();
                return this._renderer.circle(center.x, center.y, value).attr(attr).sharp()
            },
            _getConstantLineLabelsCoords: function(value) {
                var that = this,
                    translator = that._translator,
                    center = translator.getCenter(),
                    y = _round(center.y - value);
                return {
                        x: center.x,
                        y: y,
                        align: CENTER
                    }
            },
            _checkAlignmentConstantLineLabels: _noop,
            _rotateTick: function(tick, angle) {
                tick.graphic.rotate(angle, tick.posX, tick.posY)
            }
        };
        axesMethods.circularSpider = _extend({}, axesMethods.circular, {
            _createAxisElement: function() {
                var points = _map(this.getSpiderTicks(), function(tick) {
                        return {
                                x: tick.posX,
                                y: tick.posY
                            }
                    });
                return this._renderer.path(points, "area")
            },
            getRangeData: function(min) {
                var range = axesMethods.circular.getRangeData.call(this, min);
                range.addSpiderCategory = range.stick = true;
                return range
            },
            getSpiderTicks: function() {
                var that = this;
                that._spiderTicks = convertValuesToTicks(that._tickManager.getFullTicks());
                that._initTicks(that._spiderTicks, {}, {});
                return that._spiderTicks
            },
            _createStrip: function(fromAngle, toAngle, attr) {
                var center = this._translator.getCenter(),
                    points = _map(this.getSpiderTicks(), function(tick) {
                        var result;
                        if (_isDefined(tick.angle) && tick.angle >= fromAngle && tick.angle <= toAngle)
                            result = {
                                x: tick.posX,
                                y: tick.posY
                            };
                        else
                            result = null;
                        return result
                    });
                points.push({
                    x: center.x,
                    y: center.y
                });
                return this._renderer.path(points, "area").attr(attr)
            },
            _getTranslatedCoord: function(value) {
                return this._translator.translate(value, false).angle
            },
            _setTickOffset: function() {
                this._tickOffset = false
            }
        });
        axesMethods.linearSpider = _extend({}, axesMethods.linear, {
            _createPathElement: function(points, attr) {
                return this._renderer.path(points, "area").attr(attr).sharp()
            },
            setSpiderTicks: function(ticks) {
                this._spiderTicks = ticks
            },
            _getGridLineDrawer: function() {
                var that = this,
                    translator = that._translator,
                    pos = translator.getCenter();
                return function(tick) {
                        var radius = utils.getDistance(pos.x, pos.y, tick.posX, tick.posY);
                        return that._createPathElement(that._getGridPoints(pos, radius), tick.gridStyle)
                    }
            },
            _getGridPoints: function(pos, radius) {
                return _map(this._spiderTicks, function(tick) {
                        var cossin = utils.getCosAndSin(tick.angle);
                        return {
                                x: _round(pos.x + radius * cossin.cos),
                                y: _round(pos.y + radius * cossin.sin)
                            }
                    })
            },
            _createStrip: function(fromPoint, toPoint, attr) {
                var center = this._translator.getCenter(),
                    innerPoints = this._getGridPoints(center, toPoint),
                    outerPoints = this._getGridPoints(center, fromPoint);
                return this._renderer.path([outerPoints, innerPoints.reverse()], "area").attr(attr)
            },
            _createConstantLine: function(value, attr) {
                var center = this._translator.getCenter(),
                    points = this._getGridPoints(center, value);
                return this._createPathElement(points, attr)
            }
        });
        var _validateAxisOptions = function(options) {
                var labelOptions = options.label,
                    position = options.position,
                    defaultPosition = options.isHorizontal ? BOTTOM : LEFT,
                    secondaryPosition = options.isHorizontal ? TOP : RIGHT;
                if (position !== defaultPosition && position !== secondaryPosition)
                    position = defaultPosition;
                if (position === RIGHT && !labelOptions.userAlignment)
                    labelOptions.alignment = LEFT;
                options.position = position;
                options.hoverMode = options.hoverMode ? options.hoverMode.toLowerCase() : "none";
                labelOptions.minSpacing = _isDefined(labelOptions.minSpacing) ? labelOptions.minSpacing : DEFAULT_AXIS_LABEL_SPACING
            };
        var getFormatObject = function(value, options, axisMinMax) {
                var formatObject = {
                        value: value,
                        valueText: DX.formatHelper.format(value, options.format, options.precision) || ""
                    };
                if (axisMinMax) {
                    formatObject.min = axisMinMax.min;
                    formatObject.max = axisMinMax.max
                }
                return formatObject
            };
        var formatLabel = function(value, options, axisMinMax) {
                var formatObject = getFormatObject(value, options, axisMinMax);
                return $.isFunction(options.customizeText) ? options.customizeText.call(formatObject, formatObject) : formatObject.valueText
            };
        var formatHint = function(value, options, axisMinMax) {
                var formatObject = getFormatObject(value, options, axisMinMax);
                return $.isFunction(options.customizeHint) ? options.customizeHint.call(formatObject, formatObject) : undefined
            };
        _Axis = DX.viz.charts.Axis = function(renderSettings, options) {
            var debug = DX.utils.debug;
            debug.assertParam(renderSettings.renderer, "renderer was not passed");
            debug.assertParam(options.label, "label was not passed");
            debug.assertParam(options.tick, "tick was not passed");
            debug.assertParam(options.grid, "grid was not passed");
            debug.assertParam(options.title, "title was not passed");
            debug.assert(options.axisDivisionFactor, "axisDivisionFactor was not passed");
            debug.assert(options.stripStyle, "stripStyle was not passed");
            debug.assert(options.constantLineStyle, "constantLineStyle was not passed");
            debug.assert(options.position, "position was not passed");
            debug.assertParam(options.isHorizontal, "isHorizontal was not passed");
            this._renderer = renderSettings.renderer;
            this._init(renderSettings, options)
        };
        _Axis.prototype = {
            constructor: _Axis,
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
                that._range = that._translator = that._orthogonalTranslator = null;
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
            _init: function(renderSettings, options) {
                var that = this,
                    opt,
                    labelOpt = options.label;
                that._options = opt = options;
                that._initTypes = {
                    type: options.type,
                    argumentType: options.argumentType,
                    valueType: options.valueType
                };
                _validateAxisOptions(opt);
                that._setType(options.drawingType);
                that._setTickOffset();
                opt.range = {
                    min: opt.min,
                    max: opt.max
                };
                that.pane = opt.pane;
                that.name = opt.name;
                that.priority = opt.priority;
                that._virtual = opt.virtual;
                that._stripsGroup = renderSettings.stripsGroup;
                that._labelAxesGroup = renderSettings.labelAxesGroup;
                that._constantLinesGroup = renderSettings.constantLinesGroup;
                that._axesContainerGroup = renderSettings.axesContainerGroup;
                that._gridContainerGroup = renderSettings.gridGroup;
                that._createAxisGroups();
                that._hasLabelFormat = labelOpt.format !== "" && _isDefined(labelOpt.format);
                that._textOptions = {
                    align: labelOpt.alignment,
                    opacity: labelOpt.opacity
                };
                that._textFontStyles = core.utils.patchFontOptions(labelOpt.font);
                that._tickManager = that._createTickManager();
                if (opt.type === LOGARITHMIC) {
                    if (opt.logarithmBaseError) {
                        opt.incidentOccured("E2104");
                        delete opt.logarithmBaseError
                    }
                    that.calcInterval = function(value, prevValue) {
                        return utils.getLog(value / prevValue, options.logarithmBase)
                    }
                }
            },
            updateSize: function(clearAxis) {
                var that = this,
                    options = that._options,
                    direction = options.isHorizontal ? "horizontal" : "vertical";
                if (options.title.text && that._axisTitleGroup) {
                    options.incidentOccured("W2105", [direction]);
                    that._axisTitleGroup.dispose();
                    that._axisTitleGroup = null
                }
                if (clearAxis && that._axisElementsGroup && options.label.visible && !options.stubData) {
                    options.incidentOccured("W2106", [direction]);
                    that._axisElementsGroup.dispose();
                    that._axisElementsGroup = null
                }
                that._setBoundingRect()
            },
            _updateTranslatorInterval: function() {
                var that = this,
                    i,
                    majorTicks,
                    majorTicksLength,
                    translator = that._translator,
                    businessRange = that._range;
                if (!businessRange.categories && !businessRange.isSynchronized) {
                    that.getMajorTicks(true);
                    businessRange.addRange(that._tickManager.getTickBounds());
                    translator.reinit()
                }
                that._majorTicks = majorTicks = that.getMajorTicks();
                if (!businessRange.categories) {
                    majorTicksLength = majorTicks.length;
                    for (i = 0; i < majorTicksLength - 1; i++)
                        businessRange.addRange({interval: _abs(majorTicks[i].value - majorTicks[i + 1].value)})
                }
                that._decimatedTicks = that._range.categories ? that.getDecimatedTicks() : [];
                that._minorTicks = that.getMinorTicks()
            },
            setTranslator: function(translator, orthogonalTranslator) {
                var debug = DX.utils.debug;
                debug.assertParam(translator, "translator was not passed");
                this._translator = translator;
                this._orthogonalTranslator = _isDefined(orthogonalTranslator) ? orthogonalTranslator : undefined;
                this.resetTicks();
                this._updateTranslatorInterval()
            },
            resetTicks: function() {
                this._deleteLabels();
                this._majorTicks = this._minorTicks = null
            },
            setRange: function(range) {
                var debug = DX.utils.debug;
                debug.assertParam(range, "range was not passed");
                var that = this,
                    options = that._options;
                options.min = range.minVisible;
                options.max = range.maxVisible;
                options.stubData = range.stubData;
                that._range = range;
                that._tickManager && that._tickManager.updateMinMax({
                    min: options.min,
                    max: options.max
                });
                that.resetTicks()
            },
            getCurrentLabelPos: function() {
                var that = this,
                    options = that._options,
                    position = options.position,
                    labelOffset = options.label.indentFromAxis,
                    axisPosition = that._axisPosition;
                return position === TOP || position === LEFT ? axisPosition - labelOffset : axisPosition + labelOffset
            },
            getUntranslatedValue: function(pos) {
                var that = this,
                    translator = that._translator,
                    value = translator.untranslate(pos);
                if (_isDefined(value))
                    return formatLabel(_isNumber(value) ? _roundValue(value, _getSignificantDigitPosition(that._range.interval)) : value, that._options.label);
                return null
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
                    newMin = utils.applyPrecisionByMinDelta(newMin, correctingValue, newMin + correctingValue)
                }
                if (newMin > max)
                    newMin = min;
                return newMin
            },
            _getTickManagerData: function() {
                var that = this,
                    options = that._options,
                    screenDelta = that._getScreenDelta(),
                    min = options.min,
                    max = options.max,
                    categories = that._translator.getVisibleCategories() || that._range.categories,
                    customTicks = $.isArray(categories) ? categories : that._majorTicks && convertTicksToValues(that._majorTicks),
                    customMinorTicks = that._minorTicks && convertTicksToValues(that._minorTicks);
                if (_isNumber(min) && options.type !== LOGARITHMIC)
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
            _createTickManager: function() {
                return DX.viz.core.CoreFactory.createTickManager({}, {}, {overlappingBehaviorType: this._overlappingBehaviorType})
            },
            _getMarginsOptions: function() {
                var range = this._range;
                return {
                        stick: range.stick,
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
                options = _extend(true, {}, this._getMarginsOptions(), overlappingOptions, this._getTicksOptions());
                this._tickManager.update(this._getTickManagerTypes(), this._getTickManagerData(), options)
            },
            _correctLabelAlignment: function() {
                var that = this,
                    labelOptions = that._options.label,
                    overlappingBehavior = that._tickManager.getOverlappingBehavior();
                if (overlappingBehavior && overlappingBehavior.mode === "rotate") {
                    that._textOptions.rotate = overlappingBehavior.rotationAngle;
                    if (!labelOptions.userAlignment)
                        that._textOptions.align = LEFT
                }
                else if (!labelOptions.userAlignment)
                    that._textOptions.align = labelOptions.alignment
            },
            _correctLabelFormat: function() {
                this._options.label = this._tickManager.getOptions().labelOptions
            },
            getTicksValues: function() {
                return {
                        majorTicksValues: convertTicksToValues(this._majorTicks || this.getMajorTicks()),
                        minorTicksValues: convertTicksToValues(this._minorTicks || this.getMinorTicks())
                    }
            },
            getMajorTicks: function(withoutOverlappingBehavior) {
                var that = this,
                    majorTicks;
                that._updateTickManager();
                that._textOptions.rotate = 0;
                majorTicks = convertValuesToTicks(that._tickManager.getTicks(withoutOverlappingBehavior));
                that._correctLabelAlignment();
                that._correctLabelFormat();
                that._testTKScreenDelta = that._screenDelta;
                that._useTicksAutoArrangement = that._options.useTicksAutoArrangement;
                if (that._options.stubData)
                    that._testSkippedFormattingAndOverlapping = true;
                return majorTicks
            },
            getMinorTicks: function() {
                return convertValuesToTicks(this._tickManager.getMinorTicks())
            },
            getDecimatedTicks: function() {
                return convertValuesToTicks(this._tickManager.getDecimatedTicks())
            },
            setTicks: function(ticks) {
                this.resetTicks();
                this._majorTicks = convertValuesToTicks(ticks.majorTicks);
                this._minorTicks = convertValuesToTicks(ticks.minorTicks)
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
                        points = that._options.isHorizontal ? [coord.x1, coord.y1, coord.x2, coord.y2] : [coord.y1, coord.x1, coord.y2, coord.x2];
                        tick.graphic = that._createPathElement(points, tick.tickStyle).append(group);
                        coord.angle && that._rotateTick(tick, coord.angle)
                    }
                })
            },
            _createPathElement: function(points, attr, oposite) {
                return this._renderer.path(points, "line").attr(attr).sharp(this._getSharpParam(oposite))
            },
            _createAxis: function(options) {
                return this._createAxisElement().attr(options).sharp(this._getSharpParam(true))
            },
            _getTickCoord: function(tick) {
                var coords;
                if (_isDefined(tick.posX) && _isDefined(tick.posY))
                    coords = {
                        x1: tick.posX,
                        y1: tick.posY - HALF_TICK_LENGTH,
                        x2: tick.posX,
                        y2: tick.posY + HALF_TICK_LENGTH
                    };
                else
                    coords = null;
                return coords
            },
            setPercentLabelFormat: function() {
                if (!this._hasLabelFormat)
                    this._options.label.format = "percent"
            },
            resetAutoLabelFormat: function() {
                if (!this._hasLabelFormat)
                    delete this._options.label.format
            },
            _drawLabels: function() {
                var that = this,
                    renderer = that._renderer,
                    group = that._axisElementsGroup,
                    options = that._options,
                    emptyStrRegExp = /^\s+$/;
                _each(that._majorTicks, function(_, tick) {
                    var text = tick.labelText,
                        xCoord,
                        yCoord;
                    if (_isDefined(text) && text !== "" && !emptyStrRegExp.test(text)) {
                        xCoord = options.isHorizontal ? tick.labelPos.x : tick.labelPos.y;
                        yCoord = options.isHorizontal ? tick.labelPos.y : tick.labelPos.x;
                        if (!tick.label)
                            tick.label = renderer.text(text, xCoord, yCoord).css(tick.labelFontStyle).attr(tick.labelStyle).append(group);
                        else
                            tick.label.css(tick.labelFontStyle).attr(tick.labelStyle).attr({
                                text: text,
                                x: xCoord,
                                y: yCoord
                            });
                        tick.label.data({argument: tick.value})
                    }
                })
            },
            getMultipleAxesSpacing: function() {
                return this._options.multipleAxesSpacing || 0
            },
            _drawTitle: _noop,
            _getGridLineDrawer: function(borderOptions) {
                var that = this,
                    translator = that._translator,
                    options = that._options,
                    orthogonalTranslator = that._orthogonalTranslator,
                    isHorizontal = options.isHorizontal,
                    canvasStart = isHorizontal ? LEFT : TOP,
                    canvasEnd = isHorizontal ? RIGHT : BOTTOM,
                    positionFrom = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_START),
                    positionTo = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_END),
                    firstBorderLinePosition = borderOptions.visible && borderOptions[canvasStart] ? translator.translateSpecialCase(CANVAS_POSITION_PREFIX + canvasStart) : undefined,
                    lastBorderLinePosition = borderOptions.visible && borderOptions[canvasEnd] ? translator.translateSpecialCase(CANVAS_POSITION_PREFIX + canvasEnd) : undefined,
                    getPoints = isHorizontal ? function(tick) {
                        return tick.posX ? [tick.posX, positionFrom, tick.posX, positionTo] : null
                    } : function(tick) {
                        return tick.posX ? [positionFrom, tick.posX, positionTo, tick.posX] : null
                    };
                return function(tick) {
                        var points;
                        if (_abs(tick.posX - firstBorderLinePosition) < MAX_GRID_BORDER_ADHENSION || _abs(tick.posX - lastBorderLinePosition) < MAX_GRID_BORDER_ADHENSION)
                            return;
                        points = getPoints(tick);
                        return points && that._createPathElement(points, tick.gridStyle)
                    }
            },
            _drawGrids: function(ticks, borderOptions) {
                var that = this,
                    group = that._axisGridGroup,
                    drawLine = that._getGridLineDrawer(borderOptions || {visible: false});
                _each(ticks || [], function(_, tick) {
                    tick.grid = drawLine(tick);
                    tick.grid && tick.grid.append(group)
                })
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
                    orthogonalTranslator = this._orthogonalTranslator,
                    positionFrom = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_START),
                    positionTo = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_END),
                    points = this._options.isHorizontal ? [value, positionTo, value, positionFrom] : [positionFrom, value, positionTo, value];
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
                if (options.stubData)
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
                text = _isDefined(text) ? text : formatLabel(parsedValue, labelOptions);
                coords = that._getConstantLineLabelsCoords(value, lineLabelOptions);
                return that._renderer.text(text, coords.x, coords.y).css(core.utils.patchFontOptions(_extend({}, labelOptions.font, lineLabelOptions.font))).attr({align: coords.align}).append(that._axisConstantLineGroup)
            },
            _adjustConstantLineLabels: _noop,
            _getStripPos: function(startValue, endValue, canvasStart, canvasEnd, range) {
                var isContinous = !!(range.minVisible || range.maxVisible),
                    categories = range.categories || [],
                    start = this._getTranslatedCoord(this._validateUnit(startValue, "E2105", "strip")),
                    end = this._getTranslatedCoord(this._validateUnit(endValue, "E2105", "strip")),
                    min = range.minVisible;
                if (!isContinous && ($.inArray(startValue, categories) === -1 || $.inArray(endValue, categories) === -1))
                    return {
                            stripFrom: 0,
                            stripTo: 0
                        };
                if (!_isDefined(start) && isContinous)
                    start = startValue < min ? canvasStart : canvasEnd;
                if (!_isDefined(end) && isContinous)
                    end = endValue < min ? canvasStart : canvasEnd;
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
                    orthogonalTranslator = this._orthogonalTranslator,
                    positionFrom = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_START),
                    positionTo = orthogonalTranslator.translateSpecialCase(CANVAS_POSITION_END);
                if (this._options.isHorizontal) {
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
                    attr;
                if (options.stubData)
                    return;
                that._strips = [];
                that._stripLabels = [];
                for (i = 0; i < stripData.length; i++) {
                    stripOptions = stripData[i];
                    stripLabelOptions = stripOptions.label || {};
                    attr = {fill: stripOptions.color};
                    if (_isDefined(stripOptions.startValue) && _isDefined(stripOptions.endValue) && _isDefined(stripOptions.color)) {
                        stripPos = that._getStripPos(stripOptions.startValue, stripOptions.endValue, canvas.start, canvas.end, that._range);
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
                return that._renderer.text(stripLabelOptions.text, coords.x, coords.y).css(core.utils.patchFontOptions(_extend({}, options.label.font, stripLabelOptions.font))).attr({align: coords.align}).append(that._axisLabelGroup)
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
            _initAxisPositions: _noop,
            _adjustLabels: function() {
                var that = this,
                    options = that._options,
                    majorTicks = that._majorTicks,
                    majorTicksLength = majorTicks.length,
                    isHorizontal = options.isHorizontal,
                    overlappingBehavior = that._tickManager ? that._tickManager.getOverlappingBehavior() : options.label.overlappingBehavior,
                    position = options.position,
                    label,
                    labelHeight,
                    isNeedLabelAdjustment,
                    staggeringSpacing,
                    i,
                    box,
                    hasLabels = false;
                _each(majorTicks, function(_, tick) {
                    if (tick.label) {
                        tick.label.attr(that._getLabelAdjustedCoord(tick));
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
                            if (position === BOTTOM)
                                label.move(0, labelHeight);
                            else if (position === TOP)
                                label.move(0, -labelHeight)
                    }
                    for (i = 0; i < majorTicksLength; i++)
                        majorTicks[i].label && majorTicks[i].label.rotate(0)
                }
            },
            _getLabelAdjustedCoord: function(tick) {
                var that = this,
                    options = that._options,
                    box = tick.label.getBBox(),
                    x,
                    y,
                    boxAxis = that._axisElementsGroup && that._axisElementsGroup.getBBox() || {},
                    isHorizontal = options.isHorizontal,
                    position = options.position,
                    shift = that.padding && that.padding[position] || 0,
                    textOptions = that._textOptions,
                    labelSettingsY = tick.label.attr("y");
                if (isHorizontal && position === BOTTOM)
                    y = 2 * labelSettingsY - box.y + shift;
                else if (!isHorizontal) {
                    if (position === LEFT)
                        if (textOptions.align === RIGHT)
                            x = box.x + box.width - shift;
                        else if (textOptions.align === CENTER)
                            x = box.x + box.width / 2 - shift - (boxAxis.width / 2 || 0);
                        else
                            x = box.x - shift - (boxAxis.width || 0);
                    else if (textOptions.align === CENTER)
                        x = box.x + box.width / 2 + (boxAxis.width / 2 || 0) + shift;
                    else if (textOptions.align === RIGHT)
                        x = box.x + box.width + (boxAxis.width || 0) + shift;
                    else
                        x = box.x + shift;
                    y = labelSettingsY + ~~(labelSettingsY - box.y - box.height / 2)
                }
                else if (isHorizontal && position === TOP)
                    y = 2 * labelSettingsY - box.y - box.height - shift;
                return {
                        x: x,
                        y: y
                    }
            },
            _adjustTitle: _noop,
            _createAxisGroups: function() {
                var that = this,
                    renderer = that._renderer,
                    classes = that._getCssClasses();
                that._axisGroup = renderer.g().attr({"class": classes.axisClass});
                that._axisStripGroup = renderer.g().attr({"class": classes.stripClass});
                that._axisGridGroup = renderer.g().attr({"class": "dxc-grid"});
                that._axisElementsGroup = renderer.g().attr({"class": "dxc-elements"}).append(that._axisGroup);
                that._axisLineGroup = renderer.g().attr({"class": "dxc-line"}).append(that._axisGroup);
                that._axisTitleGroup = renderer.g().attr({"class": "dxc-title"}).append(that._axisGroup);
                that._axisConstantLineGroup = renderer.g().attr({"class": classes.constantLineClass});
                that._axisLabelGroup = renderer.g().attr({"class": "dxc-axis-labels"})
            },
            _clearAxisGroups: function(adjustAxis) {
                var that = this;
                that._axisGroup.remove();
                that._axisStripGroup.remove();
                that._axisLabelGroup.remove();
                that._axisConstantLineGroup.remove();
                that._axisGridGroup.remove();
                if (that._axisTitleGroup)
                    that._axisTitleGroup.clear();
                else if (!adjustAxis)
                    that._axisTitleGroup = that._renderer.g().attr({"class": "dxc-title"}).append(that._axisGroup);
                if (that._axisElementsGroup)
                    that._axisElementsGroup.clear();
                else if (!adjustAxis)
                    that._axisElementsGroup = that._renderer.g().attr({"class": "dxc-elements"}).append(that._axisGroup);
                that._axisLineGroup.clear();
                that._axisStripGroup.clear();
                that._axisGridGroup.clear();
                that._axisConstantLineGroup.clear();
                that._axisLabelGroup.clear()
            },
            _initTicks: function(ticks, tickOptions, gridOptions, withLabels) {
                var that = this,
                    options = that._options,
                    tickStyle = {
                        stroke: tickOptions.color,
                        "stroke-width": 1,
                        "stroke-opacity": tickOptions.opacity
                    },
                    gridStyle = {
                        stroke: gridOptions.color,
                        "stroke-width": gridOptions.width,
                        "stroke-opacity": gridOptions.opacity
                    },
                    currentLabelConst = that.getCurrentLabelPos(),
                    categoryToSkip = that._getSkippedCategory();
                _each(ticks || [], function(_, tick) {
                    var coord;
                    if (!(categoryToSkip && categoryToSkip === tick.value)) {
                        coord = that._getTranslatedValue(tick.value, that._axisPosition, that._tickOffset);
                        tick.posX = coord.x;
                        tick.posY = coord.y;
                        tick.angle = coord.angle
                    }
                    tick.tickStyle = tickStyle;
                    tick.gridStyle = gridStyle;
                    if (withLabels) {
                        tick.labelText = formatLabel(tick.value, options.label, {
                            min: options.min,
                            max: options.max
                        });
                        tick.labelPos = that._getTranslatedValue(tick.value, currentLabelConst);
                        tick.labelStyle = that._textOptions;
                        tick.labelFontStyle = that._textFontStyles;
                        tick.labelHint = formatHint(tick.value, options.label, {
                            min: options.min,
                            max: options.max
                        })
                    }
                })
            },
            _setTickOffset: function() {
                var options = this._options,
                    discreteAxisDivisionMode = options.discreteAxisDivisionMode;
                this._tickOffset = +(discreteAxisDivisionMode !== "crossLabels" || !discreteAxisDivisionMode)
            },
            drawGrids: function(borderOptions) {
                var that = this,
                    options = that._options,
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
                var debug = DX.utils.debug;
                debug.assertParam(this._translator, "translator was not set before Draw call");
                if (that._axisGroup)
                    that._clearAxisGroups(adjustAxis);
                areLabelsVisible = options.label.visible && that._axisElementsGroup && !options.stubData;
                that._updateTranslatorInterval();
                that._initAxisPositions();
                that._initTicks(that._majorTicks, options.tick, options.grid, areLabelsVisible);
                that._initTicks(that._decimatedTicks, options.tick, options.grid, false);
                that._initTicks(that._minorTicks, options.minorTick, options.minorGrid);
                if (!that._virtual) {
                    options.visible && that._drawAxis();
                    if (options.tick.visible) {
                        that._drawTicks(that._majorTicks);
                        that._drawTicks(that._decimatedTicks)
                    }
                    options.minorTick.visible && that._drawTicks(that._minorTicks);
                    areLabelsVisible && that._drawLabels();
                    that._drawTitle()
                }
                options.strips && that._drawStrip();
                options.constantLines && that._drawConstantLine();
                that._axisStripGroup.append(that._stripsGroup);
                that._axisConstantLineGroup.append(that._constantLinesGroup);
                that._axisGroup.append(that._axesContainerGroup);
                that._axisLabelGroup.append(that._labelAxesGroup);
                that._adjustConstantLineLabels();
                areLabelsVisible && that._adjustLabels();
                that._createHints();
                that._adjustStripLabels();
                that._adjustTitle();
                that._setBoundingRect()
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
                    isHorizontal = options.isHorizontal,
                    coord = isHorizontal && "y" || "x",
                    side = isHorizontal && "height" || "width",
                    shiftCoords = options.crosshairEnabled ? isHorizontal ? LABEL_BACKGROUND_PADDING_Y : LABEL_BACKGROUND_PADDING_X : 0,
                    axisTitleBox = that._title && that._axisTitleGroup ? that._axisTitleGroup.getBBox() : axisBox;
                if (axisBox.isEmpty && axisTitleBox.isEmpty && !placeholderSize) {
                    that.boundingRect = axisBox;
                    return
                }
                start = lineBox[coord] || that._axisPosition;
                if (options.position === (isHorizontal && BOTTOM || RIGHT)) {
                    axisBox[side] = (placeholderSize || axisTitleBox[coord] + axisTitleBox[side] - start) + shiftCoords;
                    axisBox[coord] = start
                }
                else {
                    axisBox[side] = (placeholderSize || lineBox[side] + start - axisTitleBox[coord]) + shiftCoords;
                    axisBox[coord] = (axisTitleBox.isEmpty ? start : axisTitleBox[coord]) - shiftCoords
                }
                that.boundingRect = axisBox
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
                var settings = {};
                if (x)
                    settings.translateX = x;
                if (y)
                    settings.translateY = y;
                this._axisGroup.attr(settings)
            },
            applyClipRects: function(elementsClipID, canvasClipID) {
                this._axisGroup.attr({clipId: canvasClipID});
                this._axisStripGroup.attr({clipId: elementsClipID})
            },
            validate: function(isArgumentAxis, incidentOccured) {
                var that = this,
                    options = that._options,
                    range = options.range,
                    parseUtils = new core.ParseUtils,
                    dataType = isArgumentAxis ? options.argumentType : options.valueType,
                    parser = dataType ? parseUtils.getParser(dataType, "axis") : function(unit) {
                        return unit
                    };
                that.parser = parser;
                that.incidentOccured = incidentOccured;
                options.dataType = dataType;
                if (options.min)
                    options.min = that._validateUnit(options.min, "E2106");
                if (options.max)
                    options.max = that._validateUnit(options.max, "E2106");
                if (range.min)
                    range.min = that._validateUnit(range.min);
                if (range.max)
                    range.max = that._validateUnit(range.max)
            },
            _validateUnit: function(unit, idError, parameters) {
                var that = this;
                unit = that.parser(unit);
                if (unit === undefined && idError)
                    that.incidentOccured(idError, [parameters]);
                return unit
            },
            adjustZoomValues: function(min, max, skipAdjusting) {
                var that = this,
                    range = that._options.range;
                skipAdjusting = skipAdjusting || that._options.type === DISCRETE;
                min = that._validateUnit(min);
                max = that._validateUnit(max);
                if (!skipAdjusting && range) {
                    if (_isDefined(range.min)) {
                        min = _isDefined(min) ? range.min < min ? min : range.min : min;
                        max = _isDefined(max) ? range.min < max ? max : range.min : max
                    }
                    if (_isDefined(range.max)) {
                        max = _isDefined(max) ? range.max > max ? max : range.max : max;
                        min = _isDefined(min) ? range.max > min ? min : range.max : min
                    }
                }
                that.minRangeArg = min;
                that.maxRangeArg = max;
                return {
                        min: min,
                        max: max
                    }
            },
            resetZoom: function() {
                this.minRangeArg = null;
                this.maxRangeArg = null
            },
            _getRange: function(options, min, max, categories, minRangeArg, maxRangeArg, stick) {
                var range = {},
                    addValueMarginToRange = function(prefix) {
                        if (options.valueMarginsEnabled) {
                            if (_isDefined(options[prefix])) {
                                range[prefix] = options[prefix];
                                range[prefix + "Priority"] = AXIS_VALUE_MARGIN_PRIORITY
                            }
                        }
                        else {
                            range[prefix] = 0;
                            range[prefix + "Priority"] = AXIS_VALUE_MARGIN_PRIORITY
                        }
                    },
                    type = options.type,
                    isDiscrete = type === DISCRETE,
                    isLogarithmic = type === LOGARITHMIC;
                if (isLogarithmic) {
                    min = min <= 0 ? undefined : min;
                    max = max <= 0 ? undefined : max
                }
                if (isDiscrete) {
                    range.startCategories = _isDefined(minRangeArg) ? minRangeArg : min;
                    range.endCategories = _isDefined(maxRangeArg) ? maxRangeArg : max
                }
                else if (_isDefined(min) && _isDefined(max)) {
                    range.min = min < max ? min : max;
                    range.max = max > min ? max : min
                }
                else {
                    range.min = min;
                    range.max = max
                }
                addValueMarginToRange("minValueMargin");
                addValueMarginToRange("maxValueMargin");
                range.stick = stick;
                range.categories = categories;
                range.dataType = options.dataType;
                range.axisType = type;
                if (range.axisType === LOGARITHMIC)
                    range.base = options.logarithmBase;
                range.invert = options.inverted;
                range.minVisible = !isDiscrete ? _isDefined(minRangeArg) ? minRangeArg : min : undefined;
                range.maxVisible = !isDiscrete ? _isDefined(maxRangeArg) ? maxRangeArg : max : undefined;
                return range
            },
            _setType: function(type) {
                var that = this;
                _each(axesMethods[type], function(methodName, method) {
                    that[methodName] = method
                })
            },
            _getSharpParam: function() {
                return true
            },
            getSpiderTicks: _noop,
            setSpiderTicks: _noop,
            measureLabels: _noop,
            getRangeData: _noop,
            coordsIn: _noop,
            _getSkippedCategory: _noop
        };
        DX.viz.charts.Axis.__DEBUG = {axesMethods: axesMethods}
    })(jQuery, DevExpress);
    /*! Module viz-charts, file scrollBar.js */
    (function($, DX, math) {
        var MIN_SCROLL_BAR_SIZE = 2,
            isDefined = DX.utils.isDefined,
            _min = math.min,
            _max = math.max;
        DX.viz.charts.ScrollBar = function(renderer, group) {
            this._translator = DX.viz.core.CoreFactory.createTranslator2D({}, {}, {});
            this._scroll = renderer.rect().append(group);
            this._addEvents()
        };
        function _getXCoord(canvas, pos, offset, width) {
            var x = 0;
            if (pos === "right")
                x = canvas.width - canvas.right + offset;
            else if (pos === "left")
                x = canvas.left - offset - width;
            return x
        }
        function _getYCoord(canvas, pos, offset, width) {
            var y = 0;
            if (pos === "top")
                y = canvas.top - offset;
            else if (pos === "bottom")
                y = canvas.height - canvas.bottom + width + offset;
            return y
        }
        DX.viz.charts.ScrollBar.prototype = {
            _addEvents: function() {
                var that = this,
                    $scroll = $(that._scroll.element),
                    startPosX = 0,
                    startPosY = 0,
                    scrollChangeHandler = function(e) {
                        var dX = (startPosX - e.pageX) * that._scale,
                            dY = (startPosY - e.pageY) * that._scale;
                        $scroll.trigger(new $.Event("dxc-scroll-move", $.extend(e, {
                            type: "dxc-scroll-move",
                            pointers: [{
                                    pageX: startPosX + dX,
                                    pageY: startPosY + dY
                                }]
                        })))
                    };
                $scroll.on("dxpointerdown", function(e) {
                    startPosX = e.pageX;
                    startPosY = e.pageY;
                    $scroll.trigger(new $.Event("dxc-scroll-start", {pointers: [{
                                pageX: startPosX,
                                pageY: startPosY
                            }]}));
                    $(document).on("dxpointermove", scrollChangeHandler)
                });
                $(document).on("dxpointerup", function() {
                    $(document).off("dxpointermove", scrollChangeHandler)
                })
            },
            update: function(options) {
                var that = this,
                    position = options.position,
                    isVertical = options.rotated,
                    defaultPosition = isVertical ? "right" : "top",
                    secondaryPosition = isVertical ? "left" : "bottom";
                if (position !== defaultPosition && position !== secondaryPosition)
                    position = defaultPosition;
                that._scroll.attr({
                    rotate: !options.rotated ? -90 : 0,
                    rotateX: 0,
                    rotateY: 0,
                    fill: options.color,
                    width: options.width,
                    opacity: options.opacity
                });
                that._layoutOptions = {
                    width: options.width,
                    offset: options.offset,
                    vertical: isVertical,
                    position: position
                };
                return that
            },
            init: function(range, canvas) {
                var that = this;
                that._translateWithOffset = range.axisType === "discrete" && !range.stick && 1 || 0;
                that._translator.update($.extend({}, range, {
                    minVisible: null,
                    maxVisible: null,
                    visibleCategories: null,
                    startCategories: null,
                    endCategories: null
                }), $.extend({}, canvas), {direction: that._layoutOptions.vertical ? "vertical" : "horizontal"});
                return that
            },
            getOptions: function() {
                return this._layoutOptions
            },
            shift: function(x, y) {
                this._scroll.attr({
                    translateX: x,
                    translateY: y
                })
            },
            setPane: function(panes) {
                var position = this._layoutOptions.position,
                    pane;
                if (position === "left" || position === "top")
                    pane = panes[0];
                else
                    pane = panes[panes.length - 1];
                this.pane = pane.name;
                this._canvas = pane.canvas;
                return this
            },
            getMultipleAxesSpacing: function() {
                return 0
            },
            getBoundingRect: function() {
                var options = this._layoutOptions,
                    isVertical = options.vertical,
                    offset = options.offset,
                    width = options.width,
                    pos = options.position,
                    size = width + offset,
                    canvas = this._canvas;
                return isVertical ? {
                        x: _getXCoord(canvas, pos, offset, width),
                        y: canvas.top,
                        width: size,
                        height: canvas.height - canvas.top - canvas.bottom
                    } : {
                        x: canvas.left,
                        y: _getYCoord(canvas, pos, offset, width),
                        width: canvas.width - canvas.left - canvas.right,
                        height: size
                    }
            },
            applyLayout: function() {
                var canvas = this._canvas,
                    options = this._layoutOptions,
                    pos = options.position,
                    offset = options.offset,
                    width = options.width;
                this.shift(_getXCoord(canvas, pos, offset, width), _getYCoord(canvas, pos, offset, width))
            },
            setPosition: function(min, max) {
                var that = this,
                    translator = that._translator,
                    minPoint = isDefined(min) ? translator.translate(min, -that._translateWithOffset) : translator.translate("canvas_position_start"),
                    maxPoint = isDefined(max) ? translator.translate(max, that._translateWithOffset) : translator.translate("canvas_position_end");
                that._offset = _min(minPoint, maxPoint);
                that._scale = translator.getScale(min, max);
                that._applyPosition(_min(minPoint, maxPoint), _max(minPoint, maxPoint))
            },
            transform: function(translate, scale) {
                var x = this._translator.getCanvasVisibleArea().min,
                    dx = x - (x * scale - translate),
                    lx = this._offset + dx / (this._scale * scale);
                this._applyPosition(lx, lx + this._translator.canvasLength / (this._scale * scale))
            },
            dispose: function() {
                this._scroll.dispose();
                this._scroll = this._translator = null
            },
            _applyPosition: function(x1, x2) {
                var that = this,
                    visibleArea = that._translator.getCanvasVisibleArea(),
                    height;
                x1 = _max(x1, visibleArea.min);
                x1 = _min(x1, visibleArea.max);
                x2 = _min(x2, visibleArea.max);
                x2 = _max(x2, visibleArea.min);
                height = math.abs(x2 - x1);
                that._scroll.attr({
                    y: x1,
                    height: height < MIN_SCROLL_BAR_SIZE ? MIN_SCROLL_BAR_SIZE : height
                })
            }
        }
    })(jQuery, DevExpress, Math);
    /*! Module viz-charts, file baseChart.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            charts = DX.viz.charts,
            utils = DX.utils,
            ACTIONS_BY_PRIORITY = ['reinit', '_reinitDataSource', '_dataInit', 'force_render'],
            core = DX.viz.core,
            _each = $.each,
            DEFAULT_ANIMATION_OPTIONS = {asyncSeriesRendering: true},
            _isDefined = utils.isDefined;
        function createEventMapObject(name, deprecatedArgs) {
            return {
                    name: name,
                    deprecated: name,
                    deprecatedContext: function(arg) {
                        return arg.target
                    },
                    deprecatedArgs: deprecatedArgs || function(arg) {
                        return [arg.target, arg.jQueryEvent]
                    }
                }
        }
        function checkHeightLabelsInCanvas(points, canvas, isRotated) {
            var commonLabelSize = 0,
                canvasSize = canvas.end - canvas.start,
                label,
                bbox;
            for (var i = 0; i < points.length; i++) {
                label = points[i].getLabel();
                if (label.getVisibility() !== "hidden") {
                    bbox = label.getBoundingRect();
                    commonLabelSize += isRotated ? bbox.width : bbox.height
                }
                else
                    points[i] = null
            }
            if (canvasSize > 0)
                while (commonLabelSize > canvasSize)
                    commonLabelSize -= killSmallValues(points, isRotated)
        }
        function killSmallValues(points, isRotated) {
            var smallestValuePoint = {originalValue: Infinity},
                label,
                bbox,
                indexOfPoint;
            _each(points, function(index, point) {
                if (point && smallestValuePoint.originalValue >= point.originalValue) {
                    smallestValuePoint = point;
                    indexOfPoint = index
                }
            });
            if (indexOfPoint !== null) {
                label = points[indexOfPoint].getLabel();
                bbox = label.getBoundingRect();
                label.hide();
                points[indexOfPoint] = null;
                return isRotated ? bbox.width : bbox.height
            }
            return 0
        }
        function resolveLabelOverlappingInOneDirection(points, canvas, isRotated, shiftFunction) {
            var stubCanvas = {
                    start: isRotated ? canvas.left : canvas.top,
                    end: isRotated ? canvas.width - canvas.right : canvas.height - canvas.bottom
                };
            checkHeightLabelsInCanvas(points, stubCanvas, isRotated);
            var rollingStocks = $.map(points, function(point) {
                    return point && new RollingStock(point, isRotated, shiftFunction)
                });
            rollingStocks.sort(function(a, b) {
                return a.getPointPosition() - b.getPointPosition()
            });
            if (!checkStackOverlap(rollingStocks))
                return;
            rollingStocks.reverse();
            moveRollingStock(rollingStocks, stubCanvas)
        }
        function overlapRollingStock(firstRolling, secondRolling) {
            if (!firstRolling || !secondRolling)
                return;
            return firstRolling.getBoundingRect().end > secondRolling.getBoundingRect().start
        }
        function checkStackOverlap(rollingStocks) {
            var i,
                j,
                currentRollingStock,
                nextRollingStock,
                overlap;
            for (i = 0; i < rollingStocks.length; i++) {
                currentRollingStock = rollingStocks[i];
                for (j = i + 1; j < rollingStocks.length; j++) {
                    nextRollingStock = rollingStocks[j];
                    if (overlapRollingStock(currentRollingStock, nextRollingStock)) {
                        currentRollingStock.toChain(nextRollingStock);
                        overlap = true;
                        rollingStocks[j] = null
                    }
                }
            }
            return overlap
        }
        function moveRollingStock(rollingStocks, canvas) {
            var i,
                j,
                currentRollingStock,
                nextRollingStock,
                currentBBox,
                nextBBox;
            for (i = 0; i < rollingStocks.length; i++) {
                currentRollingStock = rollingStocks[i];
                if (rollingStocksIsOut(currentRollingStock, canvas)) {
                    currentBBox = currentRollingStock.getBoundingRect();
                    for (j = i + 1; j < rollingStocks.length; j++) {
                        nextRollingStock = rollingStocks[j];
                        if (!nextRollingStock)
                            continue;
                        nextBBox = nextRollingStock.getBoundingRect();
                        if (nextBBox.end > currentBBox.start - (currentBBox.end - canvas.end)) {
                            nextRollingStock.toChain(currentRollingStock);
                            rollingStocks[i] = currentRollingStock = null;
                            break
                        }
                    }
                }
                currentRollingStock && currentRollingStock.setRollingStockInCanvas(canvas)
            }
        }
        function rollingStocksIsOut(rollingStock, canvas) {
            return rollingStock && rollingStock.getBoundingRect().end > canvas.end
        }
        function RollingStock(point, isRotated, shiftFunction) {
            var label = point.getLabel(),
                bbox = label.getBoundingRect();
            this.labels = [label];
            this.points = [point];
            this.shiftFunction = shiftFunction;
            this._bbox = {
                start: isRotated ? bbox.x : bbox.y,
                width: isRotated ? bbox.width : bbox.height,
                end: isRotated ? bbox.x + bbox.width : bbox.y + bbox.height
            };
            this._pointPositionInitialize = isRotated ? point.getBoundaryCoords().x : point.getBoundaryCoords().y;
            return this
        }
        RollingStock.prototype = {
            toChain: function(nextRollingStock) {
                var nextRollingStockBBox = nextRollingStock.getBoundingRect();
                nextRollingStock.shift(nextRollingStockBBox.start - this._bbox.end);
                this._changeBoxWidth(nextRollingStockBBox.width);
                this.labels = this.labels.concat(nextRollingStock.labels);
                this.points = this.points.concat(nextRollingStock.points)
            },
            getBoundingRect: function() {
                return this._bbox
            },
            shift: function(shiftLength) {
                var shiftFunction = this.shiftFunction;
                _each(this.labels, function(index, label) {
                    var bbox = label.getBoundingRect(),
                        coords = shiftFunction(bbox, shiftLength, label);
                    label.shift(coords.x, coords.y)
                });
                this._bbox.end -= shiftLength;
                this._bbox.start -= shiftLength
            },
            setRollingStockInCanvas: function(canvas) {
                if (this._bbox.end > canvas.end)
                    this.shift(this._bbox.end - canvas.end)
            },
            getPointPosition: function() {
                return this._pointPositionInitialize
            },
            _changeBoxWidth: function(width) {
                this._bbox.end += width;
                this._bbox.width += width
            }
        };
        function getLegendFields(name) {
            return {
                    nameField: name + 'Name',
                    colorField: name + 'Color',
                    indexField: name + 'Index'
                }
        }
        function getLegendSettings(legendDataField) {
            var formatObjectFields = getLegendFields(legendDataField);
            return {
                    getFormatObject: function(data) {
                        var res = {};
                        res[formatObjectFields.indexField] = data.id;
                        res[formatObjectFields.colorField] = data.states.normal.fill;
                        res[formatObjectFields.nameField] = data.text;
                        return res
                    },
                    textField: formatObjectFields.nameField
                }
        }
        charts.overlapping = {resolveLabelOverlappingInOneDirection: resolveLabelOverlappingInOneDirection};
        charts.BaseChart = core.BaseWidget.inherit({
            _eventsMap: $.extend({}, core.BaseWidget.prototype._eventsMap, {
                onSeriesClick: createEventMapObject("seriesClick"),
                onPointClick: createEventMapObject("pointClick"),
                onArgumentAxisClick: createEventMapObject("argumentAxisClick", function(arg) {
                    return [arg.target, arg.argument, arg.jQueryEvent]
                }),
                onLegendClick: createEventMapObject("legendClick"),
                onSeriesSelectionChanged: createEventMapObject('seriesSelectionChanged'),
                onPointSelectionChanged: createEventMapObject('pointSelectionChanged'),
                onSeriesHoverChanged: createEventMapObject('seriesHoverChanged'),
                onPointHoverChanged: createEventMapObject('pointHoverChanged'),
                onTooltipShown: createEventMapObject('tooltipShown'),
                onTooltipHidden: createEventMapObject('tooltipHidden'),
                onDone: createEventMapObject("done"),
                seriesClick: {newName: 'onSeriesClick'},
                pointClick: {newName: 'onPointClick'},
                argumentAxisClick: {newName: 'onArgumentAxisClick'},
                legendClick: {newName: 'onLegendClick'},
                pointHoverChanged: {newName: 'onPointHoverChanged'},
                seriesSelectionChanged: {newName: 'onSeriesSelectionChanged'},
                pointSelectionChanged: {newName: 'onPointSelectionChanged'},
                seriesHoverChanged: {newName: 'onSeriesHoverChanged'},
                tooltipShown: {newName: 'onTooltipShown'},
                tooltipHidden: {newName: 'onTooltipHidden'},
                done: {newName: 'onDone'}
            }),
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {
                    seriesClick: {
                        since: '14.2',
                        message: "Use the 'onSeriesClick' option instead"
                    },
                    pointClick: {
                        since: '14.2',
                        message: "Use the 'onPointClick' option instead"
                    },
                    argumentAxisClick: {
                        since: '14.2',
                        message: "Use the 'onArgumentAxisClick' option instead"
                    },
                    legendClick: {
                        since: '14.2',
                        message: "Use the 'onLegendClick' option instead"
                    },
                    seriesSelectionChanged: {
                        since: '14.2',
                        message: "Use the 'onSeriesSelectionChanged' option instead"
                    },
                    pointSelectionChanged: {
                        since: '14.2',
                        message: "Use the 'onPointSelectionChanged' option instead"
                    },
                    seriesHoverChanged: {
                        since: '14.2',
                        message: "Use the 'onSeriesHoverChanged' option instead"
                    },
                    pointHoverChanged: {
                        since: '14.2',
                        message: "Use the 'onPointHoverChanged' option instead"
                    },
                    tooltipShown: {
                        since: '14.2',
                        message: "Use the 'onTooltipShown' option instead"
                    },
                    tooltipHidden: {
                        since: '14.2',
                        message: "Use the 'onTooltipHidden' option instead"
                    },
                    done: {
                        since: '14.2',
                        message: "Use the 'onDone' option instead"
                    }
                })
            },
            _init: function() {
                var that = this;
                that.themeManager = charts.factory.createThemeManager(that.option(), that._chartType);
                that.callBase.apply(that, arguments);
                that._reinit()
            },
            _initCore: function() {
                var that = this;
                that._canvasClipRect = that._renderer.clipRect();
                that._createHtmlStructure();
                that._createLegend();
                that._createTooltip();
                that._needHandleRenderComplete = true;
                that.layoutManager = charts.factory.createChartLayoutManager(that._layoutManagerOptions());
                that._createScrollBar();
                that._$element.css({webkitUserSelect: 'none'}).on('contextmenu', function(event) {
                    that.eventType = 'contextmenu';
                    if (ui.events.isTouchEvent(event) || ui.events.isPointerEvent(event))
                        event.preventDefault()
                }).on('MSHoldVisual', function(event) {
                    that.eventType = 'MSHoldVisual';
                    event.preventDefault()
                })
            },
            _layoutManagerOptions: function() {
                return this.themeManager.getOptions("adaptiveLayout")
            },
            _reinit: function(needRedraw) {
                var that = this;
                charts._setCanvasValues(that._canvas);
                that._createTracker();
                that._reinitAxes();
                that._reinitDataSource();
                if (!that.series)
                    that._dataSpecificInit();
                that._correctAxes();
                needRedraw && that._endLoading(function() {
                    that._render({force: true})
                })
            },
            _createHtmlStructure: function() {
                var that = this,
                    renderer = that._renderer;
                that._backgroundRect = renderer.rect(0, 0, 0, 0).attr({
                    fill: "gray",
                    opacity: 0.0001
                });
                that._panesBackgroundGroup = renderer.g().attr({'class': 'dxc-background'});
                that._titleGroup = renderer.g().attr({'class': 'dxc-title'});
                that._legendGroup = renderer.g().attr({
                    'class': 'dxc-legend',
                    clipId: that._getCanvasClipRectID()
                });
                that._stripsGroup = renderer.g().attr({'class': 'dxc-strips-group'});
                that._constantLinesGroup = renderer.g().attr({'class': 'dxc-constant-lines-group'});
                that._axesGroup = renderer.g().attr({'class': 'dxc-axes-group'});
                that._gridGroup = renderer.g().attr({'class': 'dxc-grids-group'});
                that._panesBorderGroup = renderer.g().attr({'class': 'dxc-border'});
                that._labelAxesGroup = renderer.g().attr({'class': 'dxc-strips-labels-group'});
                that._scrollBarGroup = renderer.g().attr({'class': 'dxc-scroll-bar'});
                that._seriesGroup = renderer.g().attr({'class': 'dxc-series-group'});
                that._labelsGroup = renderer.g().attr({'class': 'dxc-labels-group'});
                that._tooltipGroup = renderer.g().attr({'class': 'dxc-tooltip'});
                that._crosshairCursorGroup = renderer.g().attr({'class': 'dxc-crosshair-cursor'})
            },
            _disposeObjectsInArray: function(propName, fieldNames) {
                $.each(this[propName] || [], function(_, item) {
                    if (fieldNames && item)
                        $.each(fieldNames, function(_, field) {
                            item[field] && item[field].dispose()
                        });
                    else
                        item && item.dispose()
                });
                this[propName] = null
            },
            _disposeCore: function() {
                var that = this,
                    disposeObject = function(propName) {
                        if (that[propName]) {
                            that[propName].dispose();
                            that[propName] = null
                        }
                    },
                    disposeObjectsInArray = this._disposeObjectsInArray;
                clearTimeout(that._delayedRedraw);
                that._renderer.stopAllAnimations();
                disposeObjectsInArray.call(that, "businessRanges", ["arg", "val"]);
                that.translators = null;
                disposeObjectsInArray.call(that, "series");
                disposeObject("layoutManager");
                disposeObject("themeManager");
                disposeObject("tracker");
                disposeObject("tooltip");
                disposeObject("chartTitle");
                disposeObject("_crosshair");
                that.paneAxis = null;
                that._userOptions = null;
                that._canvas = null;
                disposeObject("_canvasClipRect");
                disposeObject("_panesBackgroundGroup");
                disposeObject("_titleGroup");
                disposeObject("_scrollBarGroup");
                disposeObject("_legendGroup");
                disposeObject("_stripsGroup");
                disposeObject("_constantLinesGroup");
                disposeObject("_axesGroup");
                disposeObject("_gridGroup");
                disposeObject("_labelAxesGroup");
                disposeObject("_panesBorderGroup");
                disposeObject("_seriesGroup");
                disposeObject("_labelsGroup");
                disposeObject("_tooltipGroup");
                disposeObject("_crosshairCursorGroup")
            },
            _getAnimationOptions: function() {
                return $.extend({}, DEFAULT_ANIMATION_OPTIONS, this.themeManager.getOptions("animation"))
            },
            _getRendererParameters: function() {
                return {
                        animation: this._getAnimationOptions(),
                        cssClass: 'dxc dxc-chart',
                        pathModified: this.option('pathModified'),
                        rtl: this.themeManager.getOptions('rtlEnabled')
                    }
            },
            _getDefaultSize: function() {
                return {
                        width: 400,
                        height: 400
                    }
            },
            _getOption: function(name) {
                return this.themeManager.getOptions(name)
            },
            _reinitDataSource: function() {
                this._refreshDataSource()
            },
            _applySize: $.noop,
            _resize: function() {
                this._render(this.__renderOptions || {
                    animate: false,
                    isResize: true,
                    updateTracker: false
                })
            },
            _createTracker: function() {
                var that = this;
                if (that.tracker)
                    that.tracker.dispose();
                that.tracker = charts.factory.createTracker({
                    seriesSelectionMode: that.themeManager.getOptions('seriesSelectionMode'),
                    pointSelectionMode: that.themeManager.getOptions('pointSelectionMode'),
                    seriesGroup: that._seriesGroup,
                    renderer: that._renderer,
                    tooltip: that.tooltip,
                    eventTrigger: that._eventTrigger
                }, that.NAME)
            },
            _getTrackerSettings: function() {
                var that = this;
                return {
                        series: that.series,
                        legend: that.legend,
                        legendCallback: $.proxy(that.legend.getActionCallback, that.legend)
                    }
            },
            _updateTracker: function() {
                this.tracker.update(this._getTrackerSettings())
            },
            _render: function(_options) {
                var that = this,
                    drawOptions,
                    originalCanvas;
                if (!that._initialized)
                    return;
                if (!that._canvas)
                    return;
                that._resetIsReady();
                drawOptions = that._prepareDrawOptions(_options);
                clearTimeout(that._delayedRedraw);
                originalCanvas = that._canvas;
                that._canvas = $.extend({}, that._canvas);
                if (drawOptions.recreateCanvas)
                    that.__currentCanvas = that._canvas;
                else
                    that._canvas = that.__currentCanvas;
                that.DEBUG_canvas = that._canvas;
                if (drawOptions.recreateCanvas) {
                    that._reappendLoadingIndicator();
                    that._updateCanvasClipRect()
                }
                that._renderer.stopAllAnimations(true);
                charts._setCanvasValues(that._canvas);
                that._cleanGroups(drawOptions);
                that._renderElements(drawOptions);
                that._canvas = originalCanvas
            },
            _renderElements: function(drawOptions) {
                var that = this,
                    preparedOptions = that._prepareToRender(drawOptions),
                    isRotated = that._isRotated(),
                    isLegendInside = that._isLegendInside(),
                    trackerCanvases = [],
                    layoutTargets = that._getLayoutTargets(),
                    dirtyCanvas = $.extend({}, that._canvas),
                    argBusinessRange,
                    zoomMinArg,
                    zoomMaxArg;
                !drawOptions.isResize && that._scheduleLoadingIndicatorHiding();
                that.DEBUG_dirtyCanvas = dirtyCanvas;
                that._renderTitleAndLegend(drawOptions, isLegendInside);
                that._renderAxes(drawOptions, preparedOptions, isRotated);
                if (drawOptions.drawTitle && drawOptions.drawLegend && drawOptions.adjustAxes && that.layoutManager.needMoreSpaceForPanesCanvas(that._getLayoutTargets(), isRotated)) {
                    that.layoutManager.updateDrawnElements(that._getAxesForTransform(isRotated), that._canvas, dirtyCanvas, that._getLayoutTargets(), isRotated);
                    if (that.chartTitle)
                        that.layoutManager.correctSizeElement(that.chartTitle, that._canvas);
                    that._updateCanvasClipRect(dirtyCanvas);
                    that._updateAxesLayout(drawOptions, preparedOptions, isRotated)
                }
                drawOptions.drawTitle && drawOptions.drawLegend && drawOptions.adjustAxes && that.layoutManager.placeDrawnElements(that._canvas);
                that._applyClipRects(preparedOptions);
                that._appendSeriesGroups();
                that._updateTooltip();
                that._createCrosshairCursor();
                $.each(layoutTargets, function() {
                    var canvas = this.canvas;
                    trackerCanvases.push({
                        left: canvas.left,
                        right: canvas.width - canvas.right,
                        top: canvas.top,
                        bottom: canvas.height - canvas.bottom
                    })
                });
                if (that._scrollBar) {
                    argBusinessRange = that.businessRanges[0].arg;
                    if (argBusinessRange.categories && argBusinessRange.categories.length <= 1)
                        zoomMinArg = zoomMaxArg = undefined;
                    else {
                        zoomMinArg = argBusinessRange.categories ? argBusinessRange.startCategories : argBusinessRange.minVisible;
                        zoomMaxArg = argBusinessRange.categories ? argBusinessRange.endCategories : argBusinessRange.maxVisible
                    }
                    that._scrollBar.init(argBusinessRange, layoutTargets[0].canvas).setPosition(zoomMinArg, zoomMaxArg)
                }
                drawOptions.updateTracker && that._updateTracker();
                that.tracker.setCanvases({
                    left: 0,
                    right: that._canvas.width,
                    top: 0,
                    bottom: that._canvas.height
                }, trackerCanvases);
                that._updateLegendAndTooltip(drawOptions, isLegendInside);
                var timeout = that._getSeriesRenderTimeout(drawOptions);
                if (timeout >= 0)
                    that._delayedRedraw = setTimeout(renderSeries, timeout);
                else
                    renderSeries();
                function renderSeries() {
                    that._renderSeries(drawOptions, isRotated, isLegendInside)
                }
            },
            _createCrosshairCursor: $.noop,
            _appendSeriesGroups: function() {
                var that = this,
                    root = that._renderer.root;
                that._seriesGroup.append(root);
                that._labelsGroup.append(root);
                that._appendAdditionalSeriesGroups();
                that._tooltipGroup.append(root)
            },
            _renderSeries: function(drawOptions, isRotated, isLegendInside) {
                var that = this,
                    resolveLabelOverlapping = that.themeManager.getOptions("resolveLabelOverlapping");
                drawOptions.hideLayoutLabels = that.layoutManager.needMoreSpaceForPanesCanvas(that._getLayoutTargets(), that._isRotated()) && !that.themeManager.getOptions("adaptiveLayout").keepLabels;
                that._drawSeries(drawOptions, isRotated);
                resolveLabelOverlapping !== "none" && that._resolveLabelOverlapping(resolveLabelOverlapping);
                that._adjustSeries();
                that._renderTrackers(isLegendInside);
                if (that._dataSource && that._dataSource.isLoaded())
                    that._fulfillLoadingIndicatorHiding();
                that.tracker.repairTooltip();
                that._drawn();
                that._renderCompleteHandler()
            },
            _getAnimateOption: function(series, drawOptions) {
                return drawOptions.animate && series.getPoints().length <= drawOptions.animationPointsLimit && this._renderer.animationEnabled()
            },
            _resolveLabelOverlapping: function(resolveLabelOverlapping) {
                var func;
                switch (resolveLabelOverlapping) {
                    case"stack":
                        func = this._resolveLabelOverlappingStack;
                        break;
                    case"hide":
                        func = this._resolveLabelOverlappingHide;
                        break;
                    case"shift":
                        func = this._resolveLabelOverlappingShift;
                        break
                }
                $.isFunction(func) && func.call(this)
            },
            _getVisibleSeries: function() {
                return $.grep(this.getAllSeries(), function(series) {
                        return series.isVisible()
                    })
            },
            _resolveLabelOverlappingHide: function() {
                var labels = $.map(this._getVisibleSeries(), function(series) {
                        return $.map(series.getVisiblePoints(), function(point) {
                                return point.getLabel()
                            })
                    }),
                    currenctLabel,
                    nextLabel,
                    currenctLabelRect,
                    nextLabelRect,
                    i,
                    j;
                for (i = 0; i < labels.length; i++) {
                    currenctLabel = labels[i];
                    currenctLabelRect = currenctLabel.getBoundingRect();
                    if (currenctLabel.getVisibility() === "hidden")
                        continue;
                    for (j = i + 1; j < labels.length; j++) {
                        nextLabel = labels[j];
                        nextLabelRect = nextLabel.getBoundingRect();
                        if (utils.checkOverlapping(currenctLabelRect, nextLabelRect))
                            nextLabel.hide()
                    }
                }
            },
            _cleanGroups: function(drawOptions) {
                var that = this;
                that._stripsGroup.remove();
                that._constantLinesGroup.remove();
                that._axesGroup.remove();
                that._gridGroup.remove();
                that._labelAxesGroup.remove();
                that._labelsGroup.remove();
                that._tooltipGroup.remove();
                that._crosshairCursorGroup.remove();
                if (!drawOptions || drawOptions.drawLegend)
                    that._legendGroup.remove().clear();
                if (!drawOptions || drawOptions.drawTitle)
                    that._titleGroup.remove().clear();
                that._stripsGroup.clear();
                that._constantLinesGroup.clear();
                that._axesGroup.clear();
                that._gridGroup.clear();
                that._labelAxesGroup.clear();
                that._labelsGroup.clear();
                that._tooltipGroup.clear();
                that._crosshairCursorGroup.clear()
            },
            _drawTitle: function() {
                var that = this,
                    options = that.themeManager.getOptions("title"),
                    width = that._canvas.width - that._canvas.left - that._canvas.right;
                options._incidentOccured = that._incidentOccured;
                if (that.chartTitle)
                    that.chartTitle.update(options, width);
                else
                    that.chartTitle = charts.factory.createTitle(that._renderer, options, width, that._titleGroup)
            },
            _createLegend: function() {
                var legendSettings = getLegendSettings(this._legendDataField);
                this.legend = core.CoreFactory.createLegend({
                    renderer: this._renderer,
                    group: this._legendGroup,
                    backgroundClass: 'dxc-border',
                    itemGroupClass: 'dxc-item',
                    textField: legendSettings.textField,
                    getFormatObject: legendSettings.getFormatObject
                })
            },
            _updateLegend: function() {
                var that = this,
                    themeManager = that.themeManager,
                    legendOptions = themeManager.getOptions('legend'),
                    legendData = that._getLegendData();
                legendOptions.containerBackgroundColor = themeManager.getOptions("containerBackgroundColor");
                legendOptions._incidentOccured = that._incidentOccured;
                that.legend.update(legendData, legendOptions)
            },
            _createTooltip: function() {
                this.tooltip = new DX.viz.core.Tooltip({
                    renderer: this._renderer,
                    group: this._tooltipGroup,
                    eventTrigger: this._eventTrigger
                })
            },
            _updateTooltip: function() {
                var that = this,
                    tooltipOptions = that.themeManager.getOptions('tooltip');
                if (!$.isFunction(tooltipOptions.customizeText) && _isDefined(tooltipOptions.customizeText)) {
                    that._incidentOccured("E2103", ['customizeText']);
                    tooltipOptions.customizeText = undefined
                }
                that.tooltip.update(tooltipOptions);
                that.tooltip.setSize(that._canvas.width, that._canvas.height)
            },
            _prepareDrawOptions: function(drawOptions) {
                var animationOptions = this._getAnimationOptions(),
                    options;
                options = $.extend({}, {
                    force: false,
                    adjustAxes: true,
                    drawLegend: true,
                    drawTitle: true,
                    adjustSeriesLabels: true,
                    animate: animationOptions.enabled,
                    animationPointsLimit: animationOptions.maxPointCountSupported,
                    asyncSeriesRendering: animationOptions.asyncSeriesRendering,
                    asyncTrackersRendering: animationOptions.asyncTrackersRendering,
                    trackerRenderingDelay: animationOptions.trackerRenderingDelay,
                    updateTracker: true
                }, drawOptions, this.__renderOptions);
                if (!_isDefined(options.recreateCanvas))
                    options.recreateCanvas = options.adjustAxes && options.drawLegend && options.drawTitle;
                return options
            },
            _processRefreshData: function(newRefreshAction) {
                var currentRefreshActionPosition = $.inArray(this._currentRefreshData, ACTIONS_BY_PRIORITY),
                    newRefreshActionPosition = $.inArray(newRefreshAction, ACTIONS_BY_PRIORITY);
                if (!this._currentRefreshData || currentRefreshActionPosition >= 0 && newRefreshActionPosition < currentRefreshActionPosition)
                    this._currentRefreshData = newRefreshAction
            },
            _seriesVisibilityChanged: function() {
                this._specialProcessSeries();
                this._populateBusinessRange();
                this._renderer.stopAllAnimations(true);
                this._render({
                    force: true,
                    asyncSeriesRendering: false,
                    asyncTrackersRendering: false,
                    updateTracker: false
                })
            },
            _disposeSeries: function() {
                var that = this;
                $.each(that.series || [], function(_, series) {
                    series.dispose()
                });
                that.series = null;
                $.each(that.seriesFamilies || [], function(_, family) {
                    family.dispose()
                });
                that.seriesFamilies = null;
                that._needHandleRenderComplete = true
            },
            _optionChanged: function(args) {
                var that = this,
                    name = args.name;
                that.themeManager.resetOptions(name);
                that.themeManager.update(that._options);
                that._scheduleLoadingIndicatorHiding();
                if (name === 'animation') {
                    that._renderer.updateAnimationOptions(that._getAnimationOptions());
                    return
                }
                switch (name) {
                    case'dataSource':
                        that._needHandleRenderComplete = true;
                        that._processRefreshData('_reinitDataSource');
                        break;
                    case'palette':
                        that.themeManager.updatePalette(that.option(name));
                        that._refreshSeries('_dataInit');
                        break;
                    case'series':
                    case'commonSeriesSettings':
                    case'containerBackgroundColor':
                    case'dataPrepareSettings':
                        that._refreshSeries('_dataInit');
                        break;
                    case'legend':
                    case'seriesTemplate':
                        that._processRefreshData('_dataInit');
                        break;
                    case'title':
                        that._processRefreshData('force_render');
                        break;
                    case'valueAxis':
                    case'argumentAxis':
                    case'commonAxisSettings':
                    case'panes':
                    case'defaultPane':
                        that._refreshSeries('reinit');
                        that.paneAxis = {};
                        break;
                    case'rotated':
                        that._createScrollBar();
                        that._refreshSeries('reinit');
                        break;
                    case'equalBarWidth':
                    case'customizePoint':
                    case'customizeLabel':
                        that._refreshSeries('reinit');
                        break;
                    case'theme':
                        that.themeManager.setTheme(that.option(name));
                        that._refreshSeries('reinit');
                        break;
                    case'scrollBar':
                        that._createScrollBar();
                        that._processRefreshData('force_render');
                        break;
                    default:
                        that._processRefreshData('reinit')
                }
                that.callBase.apply(that, arguments)
            },
            _refreshSeries: function(actionName) {
                this._disposeSeries();
                this._processRefreshData(actionName)
            },
            _refresh: function() {
                var that = this;
                that._renderer.stopAllAnimations(true);
                if (that._currentRefreshData) {
                    switch (that._currentRefreshData) {
                        case'force_render':
                            that._render({force: true});
                            break;
                        case'reinit':
                            that._reinit(true);
                            break;
                        default:
                            that[that._currentRefreshData] && that[that._currentRefreshData]()
                    }
                    delete that._currentRefreshData
                }
                else
                    that._render({force: true})
            },
            _dataSourceOptions: function() {
                return {
                        paginate: false,
                        _preferSync: true
                    }
            },
            _updateCanvasClipRect: function(canvas) {
                var that = this,
                    width,
                    height;
                canvas = canvas || that._canvas;
                width = Math.max(canvas.width - canvas.left - canvas.right, 0);
                height = Math.max(canvas.height - canvas.top - canvas.bottom, 0);
                that._canvasClipRect.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: width,
                    height: height
                });
                that._backgroundRect.attr({
                    x: canvas.left,
                    y: canvas.top,
                    width: width,
                    height: height
                }).append(that._renderer.root).toBackground()
            },
            _getCanvasClipRectID: function() {
                return this._canvasClipRect.id
            },
            _dataSourceChangedHandler: function() {
                this._resetZoom();
                this._scheduleLoadingIndicatorHiding();
                this._dataInit()
            },
            _dataInit: function() {
                clearTimeout(this._delayedRedraw);
                this._dataSpecificInit(true)
            },
            _dataSpecificInit: function(needRedraw) {
                this.series = this.series || this._populateSeries();
                this._repopulateSeries();
                this._seriesPopulatedHandler(needRedraw)
            },
            _seriesPopulatedHandler: function(needRedraw) {
                var that = this;
                that._seriesPopulatedHandlerCore();
                that._populateBusinessRange();
                that._updateLegend();
                needRedraw && that._endLoading(function() {
                    that._render({force: true})
                })
            },
            _repopulateSeries: function() {
                var that = this,
                    parsedData,
                    data = that._dataSource && that._dataSource.items(),
                    dataValidatorOptions = that.themeManager.getOptions('dataPrepareSettings'),
                    sharedTooltip = that.themeManager.getOptions("tooltip").shared,
                    stackPoints = {},
                    seriesTemplate = that.themeManager.getOptions('seriesTemplate');
                if (that._dataSource && seriesTemplate) {
                    that._templatedSeries = utils.processSeriesTemplate(seriesTemplate, that._dataSource.items());
                    that._populateSeries();
                    delete that._templatedSeries;
                    data = that.teamplateData || data
                }
                that._groupSeries();
                that._dataValidator = DX.viz.core.CoreFactory.createDataValidator(data, that._groupedSeries, that._incidentOccured, dataValidatorOptions);
                parsedData = that._dataValidator.validate();
                that.themeManager.resetPalette();
                $.each(that.series, function(_, singleSeries) {
                    singleSeries.updateData(parsedData);
                    that._processSingleSeries(singleSeries);
                    that._resetStackPoints(singleSeries);
                    sharedTooltip && that._prepareStackPoints(singleSeries, stackPoints, true)
                })
            },
            _renderCompleteHandler: function() {
                var that = this,
                    allSeriesInited = true;
                if (that._needHandleRenderComplete) {
                    $.each(that.series, function(_, s) {
                        allSeriesInited = allSeriesInited && s.canRenderCompleteHandle()
                    });
                    if (allSeriesInited) {
                        that._needHandleRenderComplete = false;
                        that._eventTrigger("done", {target: that})
                    }
                }
            },
            _renderTitleAndLegend: function(drawOptions, legendHasInsidePosition) {
                var that = this,
                    titleOptions = that.themeManager.getOptions("title"),
                    drawTitle = titleOptions.text && drawOptions.drawTitle,
                    drawLegend = drawOptions.drawLegend && that.legend && !legendHasInsidePosition,
                    drawElements = [];
                if (drawTitle) {
                    that._titleGroup.append(that._renderer.root);
                    that._drawTitle();
                    drawElements.push(that.chartTitle)
                }
                if (drawLegend) {
                    that._legendGroup.append(that._renderer.root);
                    drawElements.push(that.legend)
                }
                drawElements.length && that.layoutManager.drawElements(drawElements, that._canvas);
                if (drawTitle)
                    that.layoutManager.correctSizeElement(that.chartTitle, that._canvas)
            },
            _prepareStackPoints: $.noop,
            _resetStackPoints: $.noop,
            _resetZoom: $.noop,
            _dataIsReady: function() {
                return this._isDataSourceReady()
            },
            getAllSeries: function getAllSeries() {
                return this.series.slice()
            },
            getSeriesByName: function getSeriesByName(name) {
                var found = null;
                $.each(this.series, function(i, singleSeries) {
                    if (singleSeries.name === name) {
                        found = singleSeries;
                        return false
                    }
                });
                return found
            },
            getSeriesByPos: function getSeriesByPos(pos) {
                return this.series[pos]
            },
            clearSelection: function clearSelection() {
                this.tracker.clearSelection()
            },
            hideTooltip: function() {
                this.tracker._hideTooltip()
            },
            render: function(renderOptions) {
                var that = this;
                that.__renderOptions = renderOptions;
                that.__forceRender = renderOptions && renderOptions.force;
                that.callBase.apply(that, arguments);
                that.__renderOptions = that.__forceRender = null;
                return that
            },
            getSize: function() {
                var canvas = this._canvas || {};
                return {
                        width: canvas.width,
                        height: canvas.height
                    }
            }
        }).include(ui.DataHelperMixin)
    })(jQuery, DevExpress);
    /*! Module viz-charts, file advancedChart.js */
    (function($, DX, undefined) {
        var charts = DX.viz.charts,
            utils = DX.utils,
            core = DX.viz.core,
            DEFAULT_AXIS_NAME = "defaultAxisName",
            _isArray = utils.isArray,
            _isDefined = utils.isDefined,
            _each = $.each,
            _extend = $.extend,
            _map = $.map,
            MIN = 'min',
            MAX = 'max';
        function prepareAxis(axisOptions) {
            return _isArray(axisOptions) ? axisOptions.length === 0 ? [{}] : axisOptions : [axisOptions]
        }
        function unique(array) {
            var values = {},
                i,
                len = array.length;
            for (i = 0; i < len; i++)
                values[array[i]] = true;
            return _map(values, function(_, key) {
                    return key
                })
        }
        function prepareVisibleArea(visibleArea, axisRange, useAggregation, aggregationRange) {
            visibleArea.minVal = axisRange.min;
            visibleArea.maxVal = axisRange.max;
            if (useAggregation && !visibleArea.adjustOnZoom) {
                visibleArea.minVal = _isDefined(visibleArea.minVal) ? visibleArea.minVal : aggregationRange.val.min;
                visibleArea.maxVal = _isDefined(visibleArea.maxVal) ? visibleArea.maxVal : aggregationRange.val.max
            }
        }
        charts.AdvancedChart = charts.BaseChart.inherit({
            _dispose: function() {
                var that = this,
                    disposeObjectsInArray = this._disposeObjectsInArray;
                that.callBase();
                that.panes = null;
                that.legend && (that.legend.dispose(), that.legend = null);
                disposeObjectsInArray.call(that, "panesBackground");
                disposeObjectsInArray.call(that, "seriesFamilies");
                that._disposeAxes()
            },
            _reinitAxes: function() {
                this.translators = {};
                this.panes = this._createPanes();
                this._populateAxes()
            },
            _populateSeries: function() {
                var that = this,
                    themeManager = that.themeManager,
                    hasSeriesTemplate = !!themeManager.getOptions("seriesTemplate"),
                    series = hasSeriesTemplate ? that._templatedSeries : that.option("series"),
                    allSeriesOptions = _isArray(series) ? series : series ? [series] : [],
                    data,
                    extraOptions = that._getExtraOptions(),
                    particularSeriesOptions,
                    particularSeries,
                    rotated = that._isRotated(),
                    i;
                that.teamplateData = [];
                that._disposeSeries();
                that.series = [];
                themeManager.resetPalette();
                for (i = 0; i < allSeriesOptions.length; i++) {
                    particularSeriesOptions = _extend(true, {}, allSeriesOptions[i], extraOptions);
                    data = particularSeriesOptions.data;
                    particularSeriesOptions.data = null;
                    particularSeriesOptions.rotated = rotated;
                    particularSeriesOptions.customizePoint = themeManager.getOptions("customizePoint");
                    particularSeriesOptions.customizeLabel = themeManager.getOptions("customizeLabel");
                    particularSeriesOptions.visibilityChanged = $.proxy(that._seriesVisibilityChanged, that);
                    particularSeriesOptions.resolveLabelsOverlapping = themeManager.getOptions("resolveLabelsOverlapping");
                    particularSeriesOptions.incidentOccured = that._incidentOccured;
                    if (!particularSeriesOptions.name)
                        particularSeriesOptions.name = "Series " + (i + 1).toString();
                    var seriesTheme = themeManager.getOptions("series", particularSeriesOptions);
                    if (!that._checkPaneName(seriesTheme))
                        continue;
                    particularSeries = core.CoreFactory.createSeries({
                        renderer: that._renderer,
                        seriesGroup: that._seriesGroup,
                        labelsGroup: that._labelsGroup
                    }, seriesTheme);
                    if (!particularSeries.isUpdated)
                        that._incidentOccured("E2101", [seriesTheme.type]);
                    else {
                        particularSeries.index = that.series.length;
                        that.series.push(particularSeries);
                        if (hasSeriesTemplate) {
                            _each(data, function(_, data) {
                                _each(particularSeries.getTeamplatedFields(), function(_, field) {
                                    data[field.teamplateField] = data[field.originalField]
                                });
                                that.teamplateData.push(data)
                            });
                            particularSeries.updateTeamplateFieldNames()
                        }
                    }
                }
                return that.series
            },
            _populateAxes: function() {
                var that = this,
                    valueAxes = [],
                    argumentAxes,
                    panes = that.panes,
                    themeManager = that.themeManager,
                    rotated = that._isRotated(),
                    valueAxisOptions = that.option("valueAxis") || {},
                    argumentOption = that.option("argumentAxis") || {},
                    crosshairOptions = that.option("crosshair") || {},
                    argumentAxesOptions = prepareAxis(argumentOption)[0],
                    valueAxesOptions = prepareAxis(valueAxisOptions),
                    axisNames = [],
                    valueAxesCounter = 0,
                    paneWithNonVirtualAxis;
                function getNextAxisName() {
                    return DEFAULT_AXIS_NAME + valueAxesCounter++
                }
                that._disposeAxes();
                if (rotated)
                    paneWithNonVirtualAxis = argumentAxesOptions.position === "right" ? panes[panes.length - 1].name : panes[0].name;
                else
                    paneWithNonVirtualAxis = argumentAxesOptions.position === "top" ? panes[0].name : panes[panes.length - 1].name;
                argumentAxes = _map(panes, function(pane) {
                    return that._createAxis("argumentAxis", argumentAxesOptions, {
                            virtual: pane.name != paneWithNonVirtualAxis,
                            pane: pane.name,
                            crosshairEnabled: crosshairOptions.enabled
                        }, rotated)
                });
                _each(valueAxesOptions, function(priority, axisOptions) {
                    var axisPanes = [],
                        name = axisOptions.name;
                    if (name && $.inArray(name, axisNames) != -1) {
                        that._incidentOccured("E2102");
                        return
                    }
                    name && axisNames.push(name);
                    if (axisOptions.pane)
                        axisPanes.push(axisOptions.pane);
                    if (axisOptions.panes && axisOptions.panes.length)
                        axisPanes = axisPanes.concat(axisOptions.panes.slice(0));
                    axisPanes = unique(axisPanes);
                    if (!axisPanes.length)
                        axisPanes.push(undefined);
                    _each(axisPanes, function(_, pane) {
                        valueAxes.push(that._createAxis("valueAxis", axisOptions, {
                            name: name || getNextAxisName(),
                            pane: pane,
                            priority: priority,
                            crosshairEnabled: crosshairOptions.enabled
                        }, rotated))
                    })
                });
                that._valueAxes = valueAxes;
                that._argumentAxes = argumentAxes
            },
            _prepareStackPoints: function(singleSeries, stackPoints, isSharedTooltip) {
                var points = singleSeries.getPoints(),
                    stackName = singleSeries.getStackName();
                _each(points, function(index, point) {
                    var argument = point.argument;
                    if (!stackPoints[argument]) {
                        stackPoints[argument] = {};
                        stackPoints[argument][null] = []
                    }
                    if (stackName && !_isArray(stackPoints[argument][stackName])) {
                        stackPoints[argument][stackName] = [];
                        _each(stackPoints[argument][null], function(_, point) {
                            if (!point.stackName)
                                stackPoints[argument][stackName].push(point)
                        })
                    }
                    if (stackName) {
                        stackPoints[argument][stackName].push(point);
                        stackPoints[argument][null].push(point)
                    }
                    else
                        _each(stackPoints[argument], function(_, stack) {
                            stack.push(point)
                        });
                    if (isSharedTooltip) {
                        point.stackPoints = stackPoints[argument][stackName];
                        point.stackName = stackName
                    }
                })
            },
            _resetStackPoints: function(singleSeries) {
                _each(singleSeries.getPoints(), function(_, point) {
                    point.stackPoints = null;
                    point.stackName = null
                })
            },
            _disposeAxes: function() {
                var disposeObjectsInArray = this._disposeObjectsInArray;
                disposeObjectsInArray.call(this, "_argumentAxes");
                disposeObjectsInArray.call(this, "_valueAxes")
            },
            _drawAxes: function(panesBorderOptions, drawOptions, adjustUnits) {
                var that = this,
                    drawAxes = function(axes) {
                        _each(axes, function(_, axis) {
                            axis.draw(adjustUnits)
                        })
                    },
                    drawStaticAxisElements = function(axes) {
                        _each(axes, function(_i, axis) {
                            axis.drawGrids(panesBorderOptions[axis.pane])
                        })
                    };
                that._reinitTranslators();
                that._prepareAxesAndDraw(drawAxes, drawStaticAxisElements, drawOptions)
            },
            _appendAdditionalSeriesGroups: function() {
                var that = this,
                    root = that._renderer.root;
                that._crosshairCursorGroup.append(root);
                that._legendGroup.append(root);
                that._scrollBar && that._scrollBarGroup.append(root)
            },
            _getLegendData: function() {
                return _map(this.series, function(seriesItem) {
                        if (seriesItem.getOptions().showInLegend)
                            return {
                                    text: seriesItem.name,
                                    id: seriesItem.index,
                                    states: seriesItem.getLegendStyles()
                                }
                    })
            },
            _seriesPopulatedHandlerCore: function() {
                this._processSeriesFamilies();
                this._processValueAxisFormat()
            },
            _renderTrackers: function(legendHasInsidePosition) {
                var that = this,
                    i;
                for (i = 0; i < that.series.length; ++i)
                    that.series[i].drawTrackers();
                if (that.legend) {
                    legendHasInsidePosition && that._legendGroup.append(that._renderer.root);
                    legendHasInsidePosition && that._tooltipGroup.append(that._renderer.root)
                }
            },
            _specialProcessSeries: function() {
                this._processSeriesFamilies()
            },
            _processSeriesFamilies: function() {
                var that = this,
                    types = [],
                    families = [],
                    paneSeries,
                    themeManager = that.themeManager,
                    equalBarWidth = that._getEqualBarWidth();
                if (that.seriesFamilies && that.seriesFamilies.length) {
                    _each(that.seriesFamilies, function(_, family) {
                        family.adjustSeriesValues()
                    });
                    return
                }
                _each(that.series, function(_, item) {
                    if ($.inArray(item.type, types) === -1)
                        types.push(item.type)
                });
                _each(that._getLayoutTargets(), function(_, pane) {
                    paneSeries = that._getSeriesForPane(pane.name);
                    _each(types, function(_, type) {
                        var family = core.CoreFactory.createSeriesFamily({
                                type: type,
                                pane: pane.name,
                                equalBarWidth: equalBarWidth,
                                minBubbleSize: themeManager.getOptions("minBubbleSize"),
                                maxBubbleSize: themeManager.getOptions("maxBubbleSize")
                            });
                        family.add(paneSeries);
                        family.adjustSeriesValues();
                        families.push(family)
                    })
                });
                that.seriesFamilies = families
            },
            _appendAxesGroups: function() {
                var that = this,
                    root = that._renderer.root;
                that._stripsGroup.append(root);
                that._gridGroup.append(root);
                that._axesGroup.append(root);
                that._constantLinesGroup.append(root);
                that._labelAxesGroup.append(root)
            },
            _updateAxesLayout: function(drawOptions, panesBorderOptions, rotated) {
                this.layoutManager.updatePanesCanvases(this._getLayoutTargets(), this._canvas, rotated);
                this._drawAxes(panesBorderOptions, drawOptions, true)
            },
            _populateBusinessRange: function(visibleArea) {
                var that = this,
                    businessRanges = [],
                    themeManager = that.themeManager,
                    rotated = that._isRotated(),
                    useAggregation = themeManager.getOptions('useAggregation'),
                    argAxes = that._argumentAxes,
                    lastArgAxis = argAxes[argAxes.length - 1],
                    calcInterval = lastArgAxis.calcInterval,
                    argRange = new core.Range({rotated: !!rotated}),
                    argBusinessRange;
                that._disposeObjectsInArray("businessRanges", ["arg", "val"]);
                _each(argAxes, function(_, axis) {
                    argRange.addRange(axis.getRangeData(argRange.min))
                });
                _each(that._groupedSeries, function(_, group) {
                    var groupRange = new core.Range({
                            rotated: !!rotated,
                            isValueRange: true,
                            pane: group.valueAxis.pane,
                            axis: group.valueAxis.name
                        }),
                        groupAxisRange = group.valueAxis.getRangeData();
                    groupRange.addRange(groupAxisRange);
                    _each(group, function(_, series) {
                        visibleArea && prepareVisibleArea(visibleArea, groupAxisRange, useAggregation, series._originalBusinessRange);
                        var seriesRange = series.getRangeData(visibleArea, calcInterval);
                        groupRange.addRange(seriesRange.val);
                        argRange.addRange(seriesRange.arg)
                    });
                    if (!groupRange.isDefined())
                        groupRange.setStubData(group.valueAxis.getOptions().valueType === 'datetime' ? 'datetime' : undefined);
                    if (group.valueAxis.getOptions().showZero)
                        groupRange.correctValueZeroLevel();
                    groupRange.checkZeroStick();
                    businessRanges.push({
                        val: groupRange,
                        arg: argRange
                    })
                });
                if (!argRange.isDefined())
                    argRange.setStubData(argAxes[0].getOptions().argumentType);
                if (visibleArea && visibleArea.notApplyMargins && argRange.axisType !== "discrete") {
                    argBusinessRange = argAxes[0].getTranslator().getBusinessRange();
                    argRange.addRange({
                        min: argBusinessRange.min,
                        max: argBusinessRange.max,
                        stick: true
                    })
                }
                that._correctBusinessRange(argRange, lastArgAxis);
                that.businessRanges = businessRanges
            },
            _correctBusinessRange: function(range, lastArgAxis) {
                var setTicksAtUnitBeginning = lastArgAxis.getOptions().setTicksAtUnitBeginning,
                    tickIntervalRange = {},
                    tickInterval = lastArgAxis.getOptions().tickInterval,
                    originInterval = tickInterval;
                tickInterval = $.isNumeric(tickInterval) ? tickInterval : utils.convertDateTickIntervalToMilliseconds(tickInterval);
                if (tickInterval && _isDefined(range[MIN]) && _isDefined(range[MAX]) && tickInterval >= Math.abs(range[MAX] - range[MIN])) {
                    if (utils.isDate(range[MIN])) {
                        if (!$.isNumeric(originInterval)) {
                            tickIntervalRange[MIN] = utils.addInterval(range[MIN], originInterval, true);
                            tickIntervalRange[MAX] = utils.addInterval(range[MAX], originInterval, false)
                        }
                        else {
                            tickIntervalRange[MIN] = new Date(range[MIN].valueOf() - tickInterval);
                            tickIntervalRange[MAX] = new Date(range[MAX].valueOf() + tickInterval)
                        }
                        if (setTicksAtUnitBeginning) {
                            utils.correctDateWithUnitBeginning(tickIntervalRange[MAX], originInterval);
                            utils.correctDateWithUnitBeginning(tickIntervalRange[MIN], originInterval)
                        }
                    }
                    else {
                        tickIntervalRange[MIN] = range[MIN] - tickInterval;
                        tickIntervalRange[MAX] = range[MAX] + tickInterval
                    }
                    range.addRange(tickIntervalRange)
                }
            },
            _getArgumentAxes: function() {
                return this._argumentAxes
            },
            _getValueAxes: function() {
                return this._valueAxes
            },
            _processValueAxisFormat: function() {
                var that = this,
                    valueAxes = that._valueAxes,
                    axesWithFullStackedFormat = [];
                _each(that.series, function() {
                    if (this.isFullStackedSeries() && $.inArray(this.axis, axesWithFullStackedFormat) === -1)
                        axesWithFullStackedFormat.push(this.axis)
                });
                _each(valueAxes, function() {
                    if ($.inArray(this.name, axesWithFullStackedFormat) !== -1)
                        this.setPercentLabelFormat();
                    else
                        this.resetAutoLabelFormat()
                })
            },
            _createAxis: function(typeSelector, userOptions, axisOptions, rotated) {
                var that = this;
                userOptions = that._prepareStripsAndConstantLines(typeSelector, userOptions, rotated);
                return charts.factory.createAxis({
                        renderer: that._renderer,
                        stripsGroup: that._stripsGroup,
                        labelAxesGroup: that._labelAxesGroup,
                        constantLinesGroup: that._constantLinesGroup,
                        axesContainerGroup: that._axesGroup,
                        gridGroup: that._gridGroup
                    }, that._prepareAxisOptions(typeSelector, userOptions, axisOptions, rotated))
            },
            _getTrackerSettings: function() {
                return _extend(this.callBase(), {argumentAxis: this._argumentAxes})
            },
            _prepareStripsAndConstantLines: function(typeSelector, userOptions, rotated) {
                userOptions = this.themeManager.getOptions(typeSelector, userOptions, rotated);
                if (userOptions.strips)
                    _each(userOptions.strips, function(i) {
                        userOptions.strips[i] = _extend(true, {}, userOptions.stripStyle, userOptions.strips[i])
                    });
                if (userOptions.constantLines)
                    _each(userOptions.constantLines, function(i, line) {
                        userOptions.constantLines[i] = _extend(true, {}, userOptions.constantLineStyle, line)
                    });
                return userOptions
            },
            _legendDataField: 'series',
            _adjustSeries: $.noop
        })
    })(jQuery, DevExpress);
    /*! Module viz-charts, file chart.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            core = viz.core,
            charts = viz.charts,
            utils = DX.utils,
            MAX_ADJUSTMENT_ATTEMPTS = 5,
            DEFAULT_PANE_NAME = "default",
            ASYNC_SERIES_RENDERING_DELAY = 25,
            DEFAULT_PANES = [{
                    name: DEFAULT_PANE_NAME,
                    border: {}
                }],
            _map = $.map,
            _each = $.each,
            _extend = $.extend,
            _isArray = utils.isArray,
            _isDefined = utils.isDefined;
        function getFirstAxisNameForPane(axes, paneName) {
            var result;
            for (var i = 0; i < axes.length; i++)
                if (axes[i].pane === paneName) {
                    result = axes[i].name;
                    break
                }
            if (!result)
                result = axes[0].name;
            return result
        }
        function hideGridsOnNonFirstValueAxisForPane(valAxes, paneName, synchronizeMultiAxes) {
            var axesForPane = [],
                firstShownAxis;
            _each(valAxes, function(_, axis) {
                if (axis.pane === paneName)
                    axesForPane.push(axis)
            });
            if (axesForPane.length > 1 && synchronizeMultiAxes)
                _each(axesForPane, function(_, axis) {
                    var gridOpt = axis.getOptions().grid,
                        minorGridOpt = axis.getOptions().minorGrid;
                    if (firstShownAxis && gridOpt && gridOpt.visible) {
                        gridOpt.visible = false;
                        minorGridOpt && (minorGridOpt.visible = false)
                    }
                    else
                        firstShownAxis = firstShownAxis ? firstShownAxis : gridOpt && gridOpt.visible
                })
        }
        function getPaneForAxis(paneAxis, axisNameWithoutPane) {
            var result;
            _each(paneAxis, function(paneName, pane) {
                _each(pane, function(axisName) {
                    if (axisNameWithoutPane === axisName) {
                        result = paneName;
                        return false
                    }
                })
            });
            return result
        }
        function findAxisOptions(valueAxes, valueAxesOptions, axisName) {
            var result,
                axInd;
            for (axInd = 0; axInd < valueAxesOptions.length; axInd++)
                if (valueAxesOptions[axInd].name === axisName) {
                    result = valueAxesOptions[axInd];
                    result.priority = axInd;
                    break
                }
            if (!result)
                for (axInd = 0; axInd < valueAxes.length; axInd++)
                    if (valueAxes[axInd].name === axisName) {
                        result = valueAxes[axInd].getOptions();
                        result.priority = valueAxes[axInd].priority;
                        break
                    }
            return result
        }
        function findAxis(paneName, axisName, axes) {
            var axis,
                i;
            for (i = 0; i < axes.length; i++) {
                axis = axes[i];
                if (axis.name === axisName && axis.pane === paneName)
                    return axis
            }
        }
        function prepareSegmentRectPoints(left, top, width, height, borderOptions) {
            var maxSW = ~~((width < height ? width : height) / 2),
                sw = borderOptions.width || 0,
                newSW = sw < maxSW ? sw : maxSW;
            left = left + newSW / 2;
            top = top + newSW / 2;
            width = width - newSW;
            height = height - newSW;
            var right = left + width,
                bottom = top + height,
                points = [],
                segments = [],
                segmentSequence,
                visiblyOpt = 0,
                prevSegmentVisibility = 0;
            var allSegment = {
                    top: [[left, top], [right, top]],
                    right: [[right, top], [right, bottom]],
                    bottom: [[right, bottom], [left, bottom]],
                    left: [[left, bottom], [left, top]]
                };
            _each(allSegment, function(seg) {
                var visibility = !!borderOptions[seg];
                visiblyOpt = visiblyOpt * 2 + ~~visibility
            });
            switch (visiblyOpt) {
                case 13:
                case 9:
                    segmentSequence = ['left', 'top', 'right', 'bottom'];
                    break;
                case 11:
                    segmentSequence = ['bottom', 'left', 'top', 'right'];
                    break;
                default:
                    segmentSequence = ['top', 'right', 'bottom', 'left']
            }
            _each(segmentSequence, function(_, seg) {
                var segmentVisibility = !!borderOptions[seg];
                if (!prevSegmentVisibility && segments.length) {
                    points.push(segments);
                    segments = []
                }
                if (segmentVisibility)
                    _each(allSegment[seg].slice(prevSegmentVisibility), function(_, segment) {
                        segments = segments.concat(segment)
                    });
                prevSegmentVisibility = ~~segmentVisibility
            });
            segments.length && points.push(segments);
            points.length === 1 && (points = points[0]);
            return {
                    points: points,
                    pathType: visiblyOpt === 15 ? "area" : "line"
                }
        }
        function applyClipSettings(clipRects, settings) {
            _each(clipRects || [], function(_, c) {
                c && c.attr(settings)
            })
        }
        charts._test_prepareSegmentRectPoints = function() {
            var original = prepareSegmentRectPoints.original || prepareSegmentRectPoints;
            if (arguments[0])
                prepareSegmentRectPoints = arguments[0];
            prepareSegmentRectPoints.original = original;
            prepareSegmentRectPoints.restore = function() {
                prepareSegmentRectPoints = original
            };
            return prepareSegmentRectPoints
        };
        DX.registerComponent("dxChart", viz.charts, charts.AdvancedChart.inherit({
            _chartType: "chart",
            _setDefaultOptions: function() {
                this.callBase();
                this.option({defaultPane: DEFAULT_PANE_NAME})
            },
            _initCore: function() {
                this.__ASYNC_SERIES_RENDERING_DELAY = ASYNC_SERIES_RENDERING_DELAY;
                this.paneAxis = {};
                this._panesClipRects = {};
                this.callBase()
            },
            _disposeCore: function() {
                var that = this,
                    disposeObjectsInArray = this._disposeObjectsInArray,
                    panesClipRects = that._panesClipRects;
                that.callBase();
                disposeObjectsInArray.call(panesClipRects, "fixed");
                disposeObjectsInArray.call(panesClipRects, "base");
                disposeObjectsInArray.call(panesClipRects, "wide");
                that._panesClipRects = null
            },
            _correctAxes: function() {
                this.series && this._correctValueAxes()
            },
            _getExtraOptions: $.noop,
            _processSingleSeries: $.noop,
            _groupSeries: function() {
                var that = this,
                    panes = that.panes,
                    valAxes = that._valueAxes,
                    paneList = _map(panes, function(pane) {
                        return pane.name
                    }),
                    series = that.series,
                    paneAxis = that.paneAxis,
                    synchronizeMultiAxes = that.themeManager.getOptions("synchronizeMultiAxes"),
                    groupedSeries = that._groupedSeries = [];
                _each(series, function(i, particularSeries) {
                    particularSeries.axis = particularSeries.axis || getFirstAxisNameForPane(valAxes, particularSeries.pane);
                    if (particularSeries.axis) {
                        paneAxis[particularSeries.pane] = paneAxis[particularSeries.pane] || {};
                        paneAxis[particularSeries.pane][particularSeries.axis] = true
                    }
                });
                _each(valAxes, function(_, axis) {
                    if (axis.name && axis.pane && $.inArray(axis.pane, paneList) !== -1) {
                        paneAxis[axis.pane] = paneAxis[axis.pane] || {};
                        paneAxis[axis.pane][axis.name] = true
                    }
                });
                that._correctValueAxes();
                _each(paneAxis, function(paneName, pane) {
                    hideGridsOnNonFirstValueAxisForPane(valAxes, paneName, synchronizeMultiAxes);
                    _each(pane, function(axisName) {
                        var group = [];
                        _each(series, function(_, particularSeries) {
                            if (particularSeries.pane === paneName && particularSeries.axis === axisName)
                                group.push(particularSeries)
                        });
                        groupedSeries.push(group);
                        group.valueAxis = findAxis(paneName, axisName, valAxes);
                        group.valueOptions = group.valueAxis.getOptions()
                    })
                });
                groupedSeries.argumentAxes = that._argumentAxes;
                groupedSeries.argumentOptions = groupedSeries.argumentAxes[0].getOptions()
            },
            _cleanPanesClipRects: function(clipArrayName) {
                var that = this,
                    clipArray = that._panesClipRects[clipArrayName];
                _each(clipArray || [], function(_, clipRect) {
                    clipRect && clipRect.dispose()
                });
                that._panesClipRects[clipArrayName] = []
            },
            _createPanes: function() {
                var that = this,
                    panes = that.option("panes"),
                    panesNameCounter = 0,
                    bottomPaneName;
                if (panes && _isArray(panes) && !panes.length || $.isEmptyObject(panes))
                    panes = DEFAULT_PANES;
                that._cleanPanesClipRects("fixed");
                that._cleanPanesClipRects("base");
                that._cleanPanesClipRects("wide");
                that.defaultPane = that.option("defaultPane");
                panes = _extend(true, [], _isArray(panes) ? panes : panes ? [panes] : []);
                _each(panes, function(_, pane) {
                    pane.name = !_isDefined(pane.name) ? DEFAULT_PANE_NAME + panesNameCounter++ : pane.name
                });
                if (!that._doesPaneExists(panes, that.defaultPane) && panes.length > 0) {
                    bottomPaneName = panes[panes.length - 1].name;
                    that._incidentOccured("W2101", [that.defaultPane, bottomPaneName]);
                    that.defaultPane = bottomPaneName
                }
                panes = that._isRotated() ? panes.reverse() : panes;
                return panes
            },
            _doesPaneExists: function(panes, paneName) {
                var found = false;
                _each(panes, function(_, pane) {
                    if (pane.name === paneName) {
                        found = true;
                        return false
                    }
                });
                return found
            },
            _prepareAxisOptions: function(typeSelector, userOptions, axisOptions, rotated) {
                return _extend(true, {}, userOptions, axisOptions, {
                        isHorizontal: typeSelector === "argumentAxis" ? !rotated : rotated,
                        incidentOccured: this._incidentOccured,
                        drawingType: "normal"
                    })
            },
            _checkPaneName: function(seriesTheme) {
                var paneList = _map(this.panes, function(pane) {
                        return pane.name
                    });
                seriesTheme.pane = seriesTheme.pane || this.defaultPane;
                return $.inArray(seriesTheme.pane, paneList) !== -1
            },
            _correctValueAxes: function() {
                var that = this,
                    rotated = that._isRotated(),
                    valueAxisOptions = that.option("valueAxis") || {},
                    valueAxesOptions = _isArray(valueAxisOptions) ? valueAxisOptions : [valueAxisOptions],
                    valueAxes = that._valueAxes || [],
                    defaultAxisName = valueAxes[0].name,
                    paneAxis = that.paneAxis || {},
                    panes = that.panes,
                    i,
                    neededAxis = {};
                _each(valueAxes, function(_, axis) {
                    if (axis.pane)
                        return;
                    var pane = getPaneForAxis(that.paneAxis, axis.name);
                    if (!pane) {
                        pane = that.defaultPane;
                        paneAxis[pane] = paneAxis[pane] || {};
                        paneAxis[pane][axis.name] = true
                    }
                    axis.setPane(pane)
                });
                for (i = 0; i < panes.length; i++)
                    if (!paneAxis[panes[i].name]) {
                        paneAxis[panes[i].name] = {};
                        paneAxis[panes[i].name][defaultAxisName] = true
                    }
                _each(that.paneAxis, function(paneName, axisNames) {
                    _each(axisNames, function(axisName) {
                        neededAxis[axisName + "-" + paneName] = true;
                        if (!findAxis(paneName, axisName, valueAxes)) {
                            var axisOptions = findAxisOptions(valueAxes, valueAxesOptions, axisName);
                            if (!axisOptions) {
                                that._incidentOccured("W2102", [axisName]);
                                axisOptions = {
                                    name: axisName,
                                    priority: valueAxes.length
                                }
                            }
                            valueAxes.push(that._createAxis("valueAxis", axisOptions, {
                                pane: paneName,
                                name: axisName
                            }, rotated))
                        }
                    })
                });
                valueAxes = $.grep(valueAxes, function(elem) {
                    return !!neededAxis[elem.name + "-" + elem.pane]
                });
                valueAxes.sort(function(a, b) {
                    return a.priority - b.priority
                });
                that._valueAxes = valueAxes
            },
            _getSeriesForPane: function(paneName) {
                var paneSeries = [];
                _each(this.series, function(_, oneSeries) {
                    if (oneSeries.pane === paneName)
                        paneSeries.push(oneSeries)
                });
                return paneSeries
            },
            _createTranslator: function(range, canvas, options) {
                return core.CoreFactory.createTranslator2D(range, canvas, options)
            },
            _createPanesBorderOptions: function() {
                var commonBorderOptions = this.themeManager.getOptions("commonPaneSettings").border,
                    panesBorderOptions = {};
                _each(this.panes, function(_, pane) {
                    panesBorderOptions[pane.name] = _extend(true, {}, commonBorderOptions, pane.border)
                });
                return panesBorderOptions
            },
            _createScrollBar: function() {
                var that = this,
                    scrollBarOptions = that.themeManager.getOptions("scrollBar") || {},
                    scrollBarGroup = that._scrollBarGroup;
                if (scrollBarOptions.visible) {
                    scrollBarOptions.rotated = that._isRotated();
                    that._scrollBar = (that._scrollBar || charts.factory.createScrollBar(that._renderer, scrollBarGroup)).update(scrollBarOptions)
                }
                else {
                    scrollBarGroup.remove();
                    that._scrollBar && that._scrollBar.dispose();
                    that._scrollBar = null
                }
            },
            _prepareToRender: function(drawOptions) {
                var that = this,
                    panesBorderOptions = that._createPanesBorderOptions();
                that._createPanesBackground();
                that._appendAxesGroups();
                that._transformed && that._resetTransform();
                that._createTranslators(drawOptions);
                that._options.useAggregation && _each(that.series, function(_, series) {
                    series._originalBusinessRange = series._originalBusinessRange || series.getRangeData();
                    series.resamplePoints(that._getTranslator(series.pane, series.axis).arg, that._zoomMinArg, that._zoomMaxArg)
                });
                if (_isDefined(that._zoomMinArg) || _isDefined(that._zoomMaxArg))
                    that._populateBusinessRange({
                        adjustOnZoom: that.themeManager.getOptions("adjustOnZoom"),
                        minArg: that._zoomMinArg,
                        maxArg: that._zoomMaxArg,
                        notApplyMargins: that._notApplyMargins
                    });
                if (that._options.useAggregation || _isDefined(that._zoomMinArg) || _isDefined(that._zoomMaxArg))
                    that._updateTranslators();
                return panesBorderOptions
            },
            _isLegendInside: function() {
                return this.legend && this.legend.getPosition() === "inside"
            },
            _renderAxes: function(drawOptions, panesBorderOptions, rotated) {
                if (drawOptions && drawOptions.recreateCanvas)
                    this.layoutManager.updatePanesCanvases(this.panes, this._canvas, rotated);
                this._drawAxes(panesBorderOptions, drawOptions)
            },
            _isRotated: function() {
                return this.themeManager.getOptions("rotated")
            },
            _getLayoutTargets: function() {
                return this.panes
            },
            _applyClipRects: function(panesBorderOptions) {
                var that = this,
                    canvasClipRectID = that._getCanvasClipRectID(),
                    i;
                that._drawPanesBorders(panesBorderOptions);
                that._createClipRectsForPanes();
                for (i = 0; i < that._argumentAxes.length; i++)
                    that._argumentAxes[i].applyClipRects(that._getElementsClipRectID(that._argumentAxes[i].pane), canvasClipRectID);
                for (i = 0; i < that._valueAxes.length; i++)
                    that._valueAxes[i].applyClipRects(that._getElementsClipRectID(that._valueAxes[i].pane), canvasClipRectID);
                that._fillPanesBackground()
            },
            _getSeriesRenderTimeout: function(drawOptions) {
                return drawOptions.asyncSeriesRendering ? ASYNC_SERIES_RENDERING_DELAY : undefined
            },
            _updateLegendAndTooltip: function(drawOptions, legendHasInsidePosition) {
                var that = this;
                if (drawOptions.drawLegend && that.legend && legendHasInsidePosition) {
                    var panes = that.panes,
                        newCanvas = _extend({}, panes[0].canvas),
                        layoutManager = charts.factory.createChartLayoutManager();
                    newCanvas.right = panes[panes.length - 1].canvas.right;
                    newCanvas.bottom = panes[panes.length - 1].canvas.bottom;
                    that._legendGroup.append(that._renderer.root);
                    that._tooltipGroup.append(that._renderer.root);
                    layoutManager.drawElements([that.legend], newCanvas);
                    layoutManager.placeDrawnElements(newCanvas)
                }
            },
            _drawSeries: function(drawOptions, rotated) {
                var that = this;
                _each(that.seriesFamilies || [], function(_, seriesFamily) {
                    var translators = that._getTranslator(seriesFamily.pane) || {};
                    seriesFamily.updateSeriesValues(translators);
                    seriesFamily.adjustSeriesDimensions(translators)
                });
                _each(that.series, function(_, particularSeries) {
                    that._applyPaneClipRect(particularSeries);
                    particularSeries.setAdjustSeriesLabels(drawOptions.adjustSeriesLabels);
                    var tr = that._getTranslator(particularSeries.pane, particularSeries.axis),
                        translators = {};
                    translators[rotated ? "x" : "y"] = tr.val;
                    translators[rotated ? "y" : "x"] = tr.arg;
                    particularSeries.draw(translators, that._getAnimateOption(particularSeries, drawOptions), drawOptions.hideLayoutLabels, that.legend && that.legend.getActionCallback(particularSeries))
                })
            },
            _applyPaneClipRect: function(seriesOptions) {
                var that = this,
                    paneIndex = that._getPaneIndex(seriesOptions.pane),
                    panesClipRects = that._panesClipRects,
                    wideClipRect = panesClipRects.wide[paneIndex];
                seriesOptions.setClippingParams(panesClipRects.base[paneIndex].id, wideClipRect && wideClipRect.id, that._getPaneBorderVisibility(paneIndex))
            },
            _createTranslators: function(drawOptions) {
                var that = this,
                    rotated = that._isRotated(),
                    translators;
                if (!drawOptions.recreateCanvas)
                    return;
                that.translators = translators = {};
                that.layoutManager.updatePanesCanvases(that.panes, that._canvas, rotated);
                _each(that.paneAxis, function(paneName, pane) {
                    translators[paneName] = translators[paneName] || {};
                    _each(pane, function(axisName) {
                        var translator = that._createTranslator(new core.Range(that._getBusinessRange(paneName, axisName).val), that._getCanvasForPane(paneName), rotated ? {direction: "horizontal"} : {});
                        translator.pane = paneName;
                        translator.axis = axisName;
                        translators[paneName][axisName] = {val: translator}
                    })
                });
                _each(that._argumentAxes, function(_, axis) {
                    var translator = that._createTranslator(new core.Range(that._getBusinessRange(axis.pane).arg), that._getCanvasForPane(axis.pane), !rotated ? {direction: "horizontal"} : {});
                    _each(translators[axis.pane], function(valAxis, paneAxisTran) {
                        paneAxisTran.arg = translator
                    })
                })
            },
            _updateTranslators: function() {
                var that = this;
                _each(that.translators, function(pane, axisTrans) {
                    _each(axisTrans, function(axis, translator) {
                        translator.arg.updateBusinessRange(new core.Range(that._getBusinessRange(pane).arg));
                        delete translator.arg._originalBusinessRange;
                        translator.val.updateBusinessRange(new core.Range(that._getBusinessRange(pane, axis).val));
                        delete translator.val._originalBusinessRange
                    })
                })
            },
            _getAxesForTransform: function(rotated) {
                return {
                        verticalAxes: !rotated ? this._getValueAxes() : this._getArgumentAxes(),
                        horizontalAxes: !rotated ? this._getArgumentAxes() : this._getValueAxes()
                    }
            },
            _reinitTranslators: function() {
                var that = this;
                _each(that._argumentAxes, function(_, axis) {
                    var translator = that._getTranslator(axis.pane);
                    if (translator) {
                        translator.arg.reinit();
                        axis.setRange(translator.arg.getBusinessRange());
                        axis.setTranslator(translator.arg, translator.val)
                    }
                });
                _each(that._valueAxes, function(_, axis) {
                    var translator = that._getTranslator(axis.pane, axis.name);
                    if (translator) {
                        translator.val.reinit();
                        axis.setRange(translator.val.getBusinessRange());
                        axis.setTranslator(translator.val, translator.arg)
                    }
                })
            },
            _prepareAxesAndDraw: function(drawAxes, drawStaticAxisElements, drawOptions) {
                var that = this,
                    i = 0,
                    layoutManager = that.layoutManager,
                    rotated = that._isRotated(),
                    translators = that.translators,
                    adjustmentCounter = 0,
                    synchronizeMultiAxes = that.themeManager.getOptions('synchronizeMultiAxes'),
                    layoutTargets = that._getLayoutTargets(),
                    verticalAxes = rotated ? that._argumentAxes : that._valueAxes,
                    horizontalAxes = rotated ? that._valueAxes : that._argumentAxes,
                    hElements = horizontalAxes,
                    vElements = verticalAxes;
                if (that._scrollBar) {
                    that._scrollBar.setPane(layoutTargets);
                    if (rotated)
                        vElements = [that._scrollBar].concat(vElements);
                    else
                        hElements = hElements.concat([that._scrollBar])
                }
                do {
                    for (i = 0; i < that._argumentAxes.length; i++)
                        that._argumentAxes[i].resetTicks();
                    for (i = 0; i < that._valueAxes.length; i++)
                        that._valueAxes[i].resetTicks();
                    if (synchronizeMultiAxes)
                        charts.multiAxesSynchronizer.synchronize(that._valueAxes);
                    drawAxes(horizontalAxes);
                    layoutManager.requireAxesRedraw = false;
                    if (drawOptions.adjustAxes) {
                        layoutManager.applyHorizontalAxesLayout(hElements, layoutTargets, rotated);
                        !layoutManager.stopDrawAxes && _each(translators, function(pane, axisTrans) {
                            _each(axisTrans, function(axis, translator) {
                                translator.arg.reinit();
                                translator.val.reinit()
                            })
                        })
                    }
                    drawAxes(verticalAxes);
                    if (drawOptions.adjustAxes && !layoutManager.stopDrawAxes) {
                        layoutManager.applyVerticalAxesLayout(vElements, layoutTargets, rotated);
                        !layoutManager.stopDrawAxes && _each(translators, function(pane, axisTrans) {
                            _each(axisTrans, function(axis, translator) {
                                translator.arg.reinit();
                                translator.val.reinit()
                            })
                        })
                    }
                    adjustmentCounter = adjustmentCounter + 1
                } while (!layoutManager.stopDrawAxes && layoutManager.requireAxesRedraw && adjustmentCounter < MAX_ADJUSTMENT_ATTEMPTS);
                drawStaticAxisElements(verticalAxes);
                drawStaticAxisElements(horizontalAxes);
                that._scrollBar && that._scrollBar.applyLayout();
                that.__axisAdjustmentsCount = adjustmentCounter
            },
            _getPanesParameters: function() {
                var that = this,
                    panes = that.panes,
                    i,
                    params = [];
                for (i = 0; i < panes.length; i++)
                    if (that._getPaneBorderVisibility(i))
                        params.push({
                            coords: panes[i].borderCoords,
                            clipRect: that._panesClipRects.fixed[i]
                        });
                return params
            },
            _createCrosshairCursor: function() {
                var that = this,
                    options = that.themeManager.getOptions("crosshair") || {},
                    axes = !that._isRotated() ? [that._argumentAxes, that._valueAxes] : [that._valueAxes, that._argumentAxes],
                    parameters = {
                        canvas: that._getCommonCanvas(),
                        panes: that._getPanesParameters(),
                        axes: axes
                    };
                if (!options || !options.enabled)
                    return;
                if (!that._crosshair)
                    that._crosshair = charts.factory.createCrosshair(that._renderer, options, parameters, that._crosshairCursorGroup);
                else
                    that._crosshair.update(options, parameters);
                that._crosshair.render()
            },
            _getCommonCanvas: function() {
                var i,
                    canvas,
                    commonCanvas,
                    panes = this.panes;
                for (i = 0; i < panes.length; i++) {
                    canvas = panes[i].canvas;
                    if (!commonCanvas)
                        commonCanvas = _extend({}, canvas);
                    else {
                        commonCanvas.right = canvas.right;
                        commonCanvas.bottom = canvas.bottom
                    }
                }
                return commonCanvas
            },
            _createPanesBackground: function() {
                var that = this,
                    defaultBackgroundColor = that.themeManager.getOptions("commonPaneSettings").backgroundColor,
                    backgroundColor,
                    renderer = that._renderer,
                    rect,
                    i,
                    rects = [];
                that._panesBackgroundGroup && that._panesBackgroundGroup.clear();
                for (i = 0; i < that.panes.length; i++) {
                    backgroundColor = that.panes[i].backgroundColor || defaultBackgroundColor;
                    if (!backgroundColor || backgroundColor === "none") {
                        rects.push(null);
                        continue
                    }
                    rect = renderer.rect(0, 0, 0, 0).attr({
                        fill: backgroundColor,
                        "stroke-width": 0
                    }).append(that._panesBackgroundGroup);
                    rects.push(rect)
                }
                that.panesBackground = rects;
                that._panesBackgroundGroup.append(renderer.root)
            },
            _fillPanesBackground: function() {
                var that = this,
                    bc;
                _each(that.panes, function(i, pane) {
                    bc = pane.borderCoords;
                    if (that.panesBackground[i] !== null)
                        that.panesBackground[i].attr({
                            x: bc.left,
                            y: bc.top,
                            width: bc.width,
                            height: bc.height
                        })
                })
            },
            _calcPaneBorderCoords: function(pane) {
                var canvas = pane.canvas,
                    bc = pane.borderCoords = pane.borderCoords || {};
                bc.left = canvas.left;
                bc.top = canvas.top;
                bc.right = canvas.width - canvas.right;
                bc.bottom = canvas.height - canvas.bottom;
                bc.width = Math.max(bc.right - bc.left, 0);
                bc.height = Math.max(bc.bottom - bc.top, 0)
            },
            _drawPanesBorders: function(panesBorderOptions) {
                var that = this,
                    rotated = that._isRotated();
                that._panesBorderGroup && that._panesBorderGroup.remove().clear();
                _each(that.panes, function(i, pane) {
                    var bc,
                        borderOptions = panesBorderOptions[pane.name],
                        segmentRectParams,
                        attr = {
                            fill: "none",
                            stroke: borderOptions.color,
                            "stroke-opacity": borderOptions.opacity,
                            "stroke-width": borderOptions.width,
                            dashStyle: borderOptions.dashStyle,
                            "stroke-linecap": "square"
                        };
                    that._calcPaneBorderCoords(pane, rotated);
                    if (!borderOptions.visible)
                        return;
                    bc = pane.borderCoords;
                    segmentRectParams = prepareSegmentRectPoints(bc.left, bc.top, bc.width, bc.height, borderOptions);
                    that._renderer.path(segmentRectParams.points, segmentRectParams.pathType).attr(attr).append(that._panesBorderGroup)
                });
                that._panesBorderGroup.append(that._renderer.root)
            },
            _createClipRect: function(clipArray, index, left, top, width, height) {
                var that = this,
                    clipRect = clipArray[index];
                if (!clipRect) {
                    clipRect = that._renderer.clipRect(left, top, width, height);
                    clipArray[index] = clipRect
                }
                else
                    clipRect.attr({
                        x: left,
                        y: top,
                        width: width,
                        height: height
                    })
            },
            _createClipRectsForPanes: function() {
                var that = this,
                    canvas = that._canvas;
                _each(that.panes, function(i, pane) {
                    var needWideClipRect = false,
                        bc = pane.borderCoords,
                        left = bc.left,
                        top = bc.top,
                        width = bc.width,
                        height = bc.height,
                        panesClipRects = that._panesClipRects;
                    that._createClipRect(panesClipRects.fixed, i, left, top, width, height);
                    that._createClipRect(panesClipRects.base, i, left, top, width, height);
                    _each(that.series, function(_, series) {
                        if (series.pane === pane.name && (series.isFinancialSeries() || series.areErrorBarsVisible()))
                            needWideClipRect = true
                    });
                    if (needWideClipRect) {
                        if (that._isRotated()) {
                            top = 0;
                            height = canvas.height
                        }
                        else {
                            left = 0;
                            width = canvas.width
                        }
                        that._createClipRect(panesClipRects.wide, i, left, top, width, height)
                    }
                    else
                        panesClipRects.wide.push(null)
                })
            },
            _getPaneIndex: function(paneName) {
                var paneIndex;
                _each(this.panes, function(index, pane) {
                    if (pane.name === paneName) {
                        paneIndex = index;
                        return false
                    }
                });
                return paneIndex
            },
            _getPaneBorderVisibility: function(paneIndex) {
                var commonPaneBorderVisible = this.themeManager.getOptions("commonPaneSettings").border.visible,
                    pane = this.panes[paneIndex] || {},
                    paneBorder = pane.border || {};
                return "visible" in paneBorder ? paneBorder.visible : commonPaneBorderVisible
            },
            _getElementsClipRectID: function(paneName) {
                return this._panesClipRects.fixed[this._getPaneIndex(paneName)].id
            },
            _getTranslator: function(paneName, axisName) {
                var paneTrans = this.translators[paneName],
                    foundTranslator = null;
                if (!paneTrans)
                    return foundTranslator;
                foundTranslator = paneTrans[axisName];
                if (!foundTranslator)
                    _each(paneTrans, function(axis, trans) {
                        foundTranslator = trans;
                        return false
                    });
                return foundTranslator
            },
            _getCanvasForPane: function(paneName) {
                var panes = this.panes,
                    panesNumber = panes.length,
                    i;
                for (i = 0; i < panesNumber; i++)
                    if (panes[i].name === paneName)
                        return panes[i].canvas
            },
            _getBusinessRange: function(paneName, axisName) {
                var ranges = this.businessRanges || [],
                    rangesNumber = ranges.length,
                    foundRange,
                    i;
                for (i = 0; i < rangesNumber; i++)
                    if (ranges[i].val.pane === paneName && ranges[i].val.axis === axisName) {
                        foundRange = ranges[i];
                        break
                    }
                if (!foundRange)
                    for (i = 0; i < rangesNumber; i++)
                        if (ranges[i].val.pane === paneName) {
                            foundRange = ranges[i];
                            break
                        }
                return foundRange
            },
            _transformArgument: function(translate, scale) {
                var that = this,
                    rotated = that._isRotated(),
                    settings,
                    clipSettings,
                    panesClipRects = that._panesClipRects;
                if (!that._transformed) {
                    that._transformed = true;
                    that._labelsGroup.remove();
                    that._resetIsReady();
                    _each(that.series || [], function(i, s) {
                        s.applyClip()
                    })
                }
                if (rotated) {
                    settings = {
                        translateY: translate,
                        scaleY: scale
                    };
                    clipSettings = {
                        translateY: -translate / scale,
                        scaleY: 1 / scale
                    }
                }
                else {
                    settings = {
                        translateX: translate,
                        scaleX: scale
                    };
                    clipSettings = {
                        translateX: -translate / scale,
                        scaleX: 1 / scale
                    }
                }
                applyClipSettings(panesClipRects.base, clipSettings);
                applyClipSettings(panesClipRects.wide, clipSettings);
                that._seriesGroup.attr(settings);
                that._scrollBar && that._scrollBar.transform(-translate, scale)
            },
            _resetTransform: function() {
                var that = this,
                    settings = {
                        translateX: 0,
                        translateY: 0,
                        scaleX: null,
                        scaleY: null
                    },
                    panesClipRects = that._panesClipRects;
                applyClipSettings(panesClipRects.base, settings);
                applyClipSettings(panesClipRects.wide, settings);
                that._seriesGroup.attr(settings);
                _each(that.series || [], function(i, s) {
                    s.resetClip()
                });
                that._transformed = false
            },
            _getTrackerSettings: function() {
                var that = this,
                    themeManager = that.themeManager;
                return _extend(this.callBase(), {
                        chart: that,
                        zoomingMode: themeManager.getOptions("zoomingMode"),
                        scrollingMode: themeManager.getOptions("scrollingMode"),
                        rotated: that._isRotated(),
                        crosshair: that._crosshair
                    })
            },
            _resolveLabelOverlappingStack: function() {
                var that = this,
                    stackPoints = {},
                    isRotated = that._isRotated(),
                    shiftDirection = isRotated ? function(box, length) {
                        return {
                                x: box.x - length,
                                y: box.y
                            }
                    } : function(box, length) {
                        return {
                                x: box.x,
                                y: box.y - length
                            }
                    };
                _each(this._getVisibleSeries(), function(_, particularSeries) {
                    that._prepareStackPoints(particularSeries, stackPoints)
                });
                _each(stackPoints, function(_, stacks) {
                    _each(stacks, function(_, points) {
                        charts.overlapping.resolveLabelOverlappingInOneDirection(points, that._getCommonCanvas(), isRotated, shiftDirection)
                    })
                })
            },
            _getEqualBarWidth: function() {
                return this.themeManager.getOptions("equalBarWidth")
            },
            zoomArgument: function(min, max, gesturesUsed) {
                var that = this,
                    zoomArg;
                if (!_isDefined(min) && !_isDefined(max))
                    return;
                zoomArg = that._argumentAxes[0].adjustZoomValues(min, max, gesturesUsed);
                that._zoomMinArg = zoomArg.min;
                that._zoomMaxArg = zoomArg.max;
                that._notApplyMargins = gesturesUsed;
                that._render({
                    force: true,
                    drawTitle: false,
                    drawLegend: false,
                    adjustAxes: false,
                    animate: false,
                    adjustSeriesLabels: false,
                    asyncSeriesRendering: false,
                    updateTracker: false
                })
            },
            _resetZoom: function() {
                var that = this;
                that._zoomMinArg = that._zoomMaxArg = undefined;
                that._argumentAxes[0] && that._argumentAxes[0].resetZoom()
            },
            getVisibleArgumentBounds: function() {
                var range = this._argumentAxes[0].getTranslator().getBusinessRange(),
                    isDiscrete = range.axisType === "discrete",
                    categories = range.categories;
                return {
                        minVisible: isDiscrete ? range.startCategories || categories[0] : range.minVisible,
                        maxVisible: isDiscrete ? range.endCategories || categories[categories.length - 1] : range.maxVisible
                    }
            }
        }))
    })(jQuery, DevExpress);
    /*! Module viz-charts, file pieChart.js */
    (function($, DX, undefined) {
        var viz = DX.viz,
            core = viz.core,
            charts = viz.charts,
            utils = DX.utils,
            _extend = $.extend,
            _map = $.map,
            _noop = $.noop;
        DX.registerComponent("dxPieChart", viz.charts, charts.BaseChart.inherit({
            _chartType: 'pie',
            _reinitAxes: _noop,
            _correctAxes: _noop,
            _layoutManagerOptions: function() {
                var diameter = this.themeManager.getOptions('diameter');
                if (utils.isNumber(diameter)) {
                    if (diameter > 1)
                        diameter = 1;
                    else if (diameter < 0)
                        diameter = 0
                }
                else
                    diameter = undefined;
                return _extend(true, {}, this.callBase(), {piePercentage: diameter})
            },
            _groupSeries: function() {
                this.series.valueOptions = {valueType: "numeric"};
                this._groupedSeries = [this.series];
                this._groupedSeries.argumentOptions = this.series[0] && this.series[0].getOptions()
            },
            _populateBusinessRange: function() {
                var businessRanges = [],
                    series = this.series,
                    singleSeries = series[0],
                    range = new core.Range,
                    singleSeriesRange;
                this._disposeObjectsInArray("businessRanges");
                if (singleSeries) {
                    singleSeriesRange = singleSeries.getRangeData();
                    range.addRange(singleSeriesRange.val);
                    if (!range.isDefined())
                        range.setStubData();
                    businessRanges.push(range)
                }
                this.businessRanges = businessRanges
            },
            _specialProcessSeries: function() {
                this.series[0].arrangePoints()
            },
            _createTranslator: function(range) {
                return core.CoreFactory.createTranslator1D(range.min, range.max, 360, 0)
            },
            _populateSeries: function() {
                var that = this,
                    themeManager = that.themeManager,
                    hasSeriesTemplate = !!themeManager.getOptions("seriesTemplate"),
                    seriesOptions = hasSeriesTemplate ? that._templatedSeries : that.option("series"),
                    allSeriesOptions = $.isArray(seriesOptions) ? seriesOptions : seriesOptions ? [seriesOptions] : [],
                    data,
                    particularSeriesOptions,
                    particularSeries,
                    seriesTheme;
                that._disposeSeries();
                that.series = [];
                themeManager.resetPalette();
                if (allSeriesOptions.length) {
                    particularSeriesOptions = _extend(true, {}, allSeriesOptions[0]);
                    if (particularSeriesOptions.type && !utils.isString(particularSeriesOptions.type))
                        particularSeriesOptions.type = "";
                    data = particularSeriesOptions.data;
                    particularSeriesOptions.data = null;
                    particularSeriesOptions.incidentOccured = that._incidentOccured;
                    seriesTheme = themeManager.getOptions("series", particularSeriesOptions, true);
                    seriesTheme.visibilityChanged = $.proxy(that._seriesVisibilityChanged, that);
                    seriesTheme.customizePoint = themeManager.getOptions("customizePoint");
                    seriesTheme.customizeLabel = themeManager.getOptions("customizeLabel");
                    particularSeries = core.CoreFactory.createSeries({
                        renderer: that._renderer,
                        seriesGroup: that._seriesGroup,
                        labelsGroup: that._labelsGroup
                    }, seriesTheme);
                    if (!particularSeries.isUpdated)
                        that._incidentOccured("E2101", [seriesTheme.type]);
                    else {
                        that._processSingleSeries(particularSeries);
                        that.series.push(particularSeries)
                    }
                    particularSeriesOptions.data = data
                }
                return that.series
            },
            _processSingleSeries: function(singleSeries) {
                singleSeries.arrangePoints()
            },
            _seriesPopulatedHandlerCore: _noop,
            _getLegendData: function() {
                return _map(this.series[0] ? this.series[0].getPoints() : [], function(item) {
                        return {
                                text: item.argument,
                                id: item.index,
                                states: item.getLegendStyles()
                            }
                    })
            },
            _prepareToRender: _noop,
            _isLegendInside: _noop,
            _renderAxes: _noop,
            _isRotated: _noop,
            _getLayoutTargets: function() {
                return [{canvas: this._canvas}]
            },
            _getAxesForTransform: function() {
                return {
                        verticalAxes: [],
                        horizontalAxes: []
                    }
            },
            _updateAxesLayout: _noop,
            _applyClipRects: _noop,
            _appendAdditionalSeriesGroups: _noop,
            _getSeriesRenderTimeout: _noop,
            _drawSeries: function(drawOptions) {
                var that = this,
                    singleSeries = that.getSeries(),
                    legend = that.legend,
                    getActionCallbackProxy = $.proxy(legend.getActionCallback, legend);
                if (singleSeries) {
                    that.layoutManager.applyPieChartSeriesLayout(that._canvas, singleSeries, true);
                    singleSeries.canvas = that._canvas;
                    singleSeries.resetLabelSetups();
                    if (singleSeries.drawLabelsWOPoints(that._createTranslator(that.businessRanges[0], that._canvas)))
                        that.layoutManager.applyPieChartSeriesLayout(that._canvas, singleSeries, drawOptions.hideLayoutLabels);
                    singleSeries.draw(that._createTranslator(that.businessRanges[0], that._canvas), that._getAnimateOption(singleSeries, drawOptions), drawOptions.hideLayoutLabels, getActionCallbackProxy)
                }
            },
            _adjustSeries: function() {
                var singleSeries = this.getSeries();
                singleSeries && singleSeries.adjustLabels()
            },
            _updateLegendAndTooltip: _noop,
            _renderTrackers: _noop,
            _createScrollBar: _noop,
            _resolveLabelOverlappingShift: function() {
                var that = this,
                    shiftFunction = function(box, length, label) {
                        return utils.getShiftingCoordOnRad(box, {
                                x: box.x,
                                y: box.y - length
                            }, label.figure)
                    },
                    points = _map(that.getSeries().getVisiblePoints(), function(point) {
                        var angleOfPoint = utils.normalizeAngle(point.middleAngle);
                        if (angleOfPoint < 90 || angleOfPoint >= 270)
                            return point
                    });
                charts.overlapping.resolveLabelOverlappingInOneDirection(points, that._canvas, false, shiftFunction);
                points = _map(that.getSeries().getVisiblePoints(), function(point) {
                    var angleOfPoint = utils.normalizeAngle(point.middleAngle);
                    if (angleOfPoint >= 90 && angleOfPoint < 270)
                        return point
                });
                charts.overlapping.resolveLabelOverlappingInOneDirection(points, that._canvas, false, shiftFunction)
            },
            getSeries: function getSeries() {
                return this.series && this.series[0]
            },
            _legendDataField: 'point'
        }))
    })(jQuery, DevExpress);
    /*! Module viz-charts, file polarChart.js */
    (function($, DX, undefined) {
        var charts = DX.viz.charts,
            core = DX.viz.core,
            DEFAULT_PANE_NAME = 'default';
        var PolarChart = charts.AdvancedChart.inherit({
                _chartType: 'polar',
                _createPanes: function() {
                    return [{name: DEFAULT_PANE_NAME}]
                },
                _checkPaneName: function() {
                    return true
                },
                _prepareAxisOptions: function(typeSelector, axisOptions) {
                    return this.themeManager.getOptions(typeSelector, $.extend(true, axisOptions, {
                            drawingType: this._getTypeOfAxis(typeSelector),
                            incidentOccured: this._incidentOccured,
                            type: this.option("useSpiderWeb") && typeSelector === "argumentAxis" ? "discrete" : axisOptions.type
                        }))
                },
                _getTypeOfAxis: function(type) {
                    type = type === "argumentAxis" ? "circular" : "linear";
                    if (this.option("useSpiderWeb"))
                        type += "Spider";
                    return type
                },
                _getExtraOptions: function() {
                    return {spiderWidget: this.option("useSpiderWeb")}
                },
                _correctAxes: $.noop,
                _groupSeries: function() {
                    this._groupedSeries = [this.series];
                    this._groupedSeries[0].valueAxis = this._valueAxes[0];
                    this._groupedSeries[0].valueOptions = this._valueAxes[0].getOptions();
                    this._groupedSeries.argumentAxes = this._argumentAxes;
                    this._groupedSeries.argumentOptions = this._argumentAxes[0].getOptions()
                },
                _processSingleSeries: $.noop,
                _prepareToRender: function() {
                    this._appendAxesGroups();
                    return {}
                },
                _isLegendInside: $.noop,
                _renderAxes: function(drawOptions) {
                    this._drawAxes({}, drawOptions)
                },
                _reinitTranslators: function() {
                    var that = this,
                        valueAxes = that._valueAxes,
                        argumentAxes = that._argumentAxes,
                        argumentBR = new core.Range(that.businessRanges[0].arg),
                        valueBR = new core.Range(that.businessRanges[0].val),
                        translator = that._createTranslator({
                            arg: argumentBR,
                            val: valueBR
                        });
                    that.translator = translator;
                    argumentAxes[0].setRange(argumentBR);
                    argumentAxes[0].setTranslator(translator);
                    for (var i = 0; i < valueAxes.length; i++) {
                        valueAxes[i].setRange(valueBR);
                        valueAxes[i].setTranslator(translator)
                    }
                },
                _prepareAxesAndDraw: function(drawAxes, drawStaticAxisElements) {
                    var that = this,
                        valueAxes = that._valueAxes,
                        argAxes = that._argumentAxes,
                        argumentAxis = argAxes[0];
                    that._calcCanvas(argumentAxis.measureLabels());
                    that.translator.reinit();
                    argumentAxis.setTranslator(that.translator);
                    drawAxes(argAxes);
                    $.each(valueAxes, function(_, valAxis) {
                        valAxis.setSpiderTicks(argumentAxis.getSpiderTicks())
                    });
                    drawAxes(valueAxes);
                    drawStaticAxisElements(argAxes);
                    drawStaticAxisElements(valueAxes)
                },
                _calcCanvas: function(measure) {
                    var canvas = this.translator.canvas;
                    canvas.left += measure.width;
                    canvas.right += measure.width;
                    canvas.top += measure.height;
                    canvas.bottom += measure.height
                },
                _isRotated: $.noop,
                _getLayoutTargets: function() {
                    return [{canvas: this._canvas}]
                },
                _getAxesForTransform: function() {
                    var argAxes = this._getArgumentAxes();
                    return {
                            verticalAxes: argAxes,
                            horizontalAxes: argAxes
                        }
                },
                _applyClipRects: $.noop,
                _getSeriesRenderTimeout: $.noop,
                _drawSeries: function(drawOptions) {
                    var that = this,
                        i,
                        seriesFamilies = that.seriesFamilies || [],
                        series = that.series;
                    if (!series.length)
                        return;
                    for (i = 0; i < seriesFamilies.length; i++) {
                        var translators = {};
                        translators.val = that.translator;
                        translators.arg = that.translator;
                        seriesFamilies[i].updateSeriesValues(translators);
                        seriesFamilies[i].adjustSeriesDimensions(translators)
                    }
                    for (i = 0; i < series.length; i++)
                        series[i].draw(that.translator, that._getAnimateOption(series[i], drawOptions), drawOptions.hideLayoutLabels, that.legend && that.legend.getActionCallback(series[i]))
                },
                _updateLegendAndTooltip: $.noop,
                _createScrollBar: $.noop,
                _createTranslator: function(br) {
                    var themeManager = this.themeManager,
                        axisUserOptions = this.option("argumentAxis"),
                        axisOptions = themeManager.getOptions("argumentAxis", axisUserOptions) || {};
                    return new core.PolarTranslator(br, $.extend(true, {}, this._canvas), {startAngle: axisOptions.startAngle})
                },
                _getSeriesForPane: function() {
                    return this.series
                },
                _getEqualBarWidth: function() {
                    return !!this.themeManager.getOptions("equalBarWidth")
                }
            });
        DX.registerComponent('dxPolarChart', charts, PolarChart)
    })(jQuery, DevExpress);
    /*! Module viz-charts, file layoutManager.js */
    (function($, DX, undefined) {
        var _isNumber = DX.utils.isNumber,
            _decreaseGaps = DX.viz.core.utils.decreaseGaps,
            _round = Math.round,
            _min = Math.min,
            _max = Math.max,
            _floor = Math.floor,
            _sqrt = Math.sqrt,
            _each = $.each,
            _extend = $.extend;
        function correctElementsPosition(elements, direction, canvas) {
            _each(elements, function(_, element) {
                var options = element.getLayoutOptions(),
                    side = options.cutLayoutSide;
                canvas[side] -= options[direction]
            })
        }
        function placeElementAndCutCanvas(elements, canvas) {
            _each(elements, function(_, element) {
                var shiftX,
                    shiftY,
                    options = element.getLayoutOptions(),
                    length = getLength(options.cutLayoutSide);
                if (!options.width)
                    return;
                switch (options.horizontalAlignment) {
                    case"left":
                        shiftX = canvas.left;
                        break;
                    case"center":
                        shiftX = (canvas.width - canvas.left - canvas.right - options.width) / 2 + canvas.left;
                        break;
                    case"right":
                        shiftX = canvas.width - canvas.right - options.width;
                        break
                }
                switch (options.verticalAlignment) {
                    case"top":
                        shiftY = canvas.top;
                        break;
                    case"bottom":
                        shiftY = canvas.height - canvas.bottom - options.height;
                        break
                }
                element.shift(_round(shiftX), _round(shiftY));
                canvas[options.cutLayoutSide] += options[length];
                setCanvasValues(canvas)
            })
        }
        function getLength(side) {
            return side === 'left' || side === 'right' ? 'width' : 'height'
        }
        function setCanvasValues(canvas) {
            if (canvas) {
                canvas.originalTop = canvas.top;
                canvas.originalBottom = canvas.bottom;
                canvas.originalLeft = canvas.left;
                canvas.originalRight = canvas.right
            }
        }
        function updateElements(elements, length, otherLength, dirtyCanvas, canvas, needRemoveSpace) {
            _each(elements, function(_, element) {
                var options = element.getLayoutOptions(),
                    side = options.cutLayoutSide,
                    freeSpaceWidth = dirtyCanvas.width - dirtyCanvas.left - dirtyCanvas.right,
                    freeSpaceHeight = dirtyCanvas.height - dirtyCanvas.top - dirtyCanvas.bottom,
                    updateObject = {};
                element.setSize({
                    width: freeSpaceWidth,
                    height: freeSpaceHeight
                });
                updateObject[otherLength] = 0;
                updateObject[length] = needRemoveSpace[length];
                element.changeSize(updateObject);
                canvas[side] -= options[length] - element.getLayoutOptions()[length];
                needRemoveSpace[length] -= options[length] - element.getLayoutOptions()[length]
            })
        }
        function updateAxis(axes, side, needRemoveSpace) {
            if (axes && needRemoveSpace[side] > 0) {
                _each(axes, function(i, axis) {
                    var bbox = axis.getBoundingRect();
                    axis.updateSize();
                    needRemoveSpace[side] -= bbox[side] - axis.getBoundingRect()[side]
                });
                if (needRemoveSpace[side] > 0)
                    _each(axes, function(_, axis) {
                        axis.updateSize(true)
                    })
            }
        }
        function getNearestCoord(firstCoord, secondCoord, pointCenterCoord) {
            var nearestCoord;
            if (pointCenterCoord < firstCoord)
                nearestCoord = firstCoord;
            else if (secondCoord < pointCenterCoord)
                nearestCoord = secondCoord;
            else
                nearestCoord = pointCenterCoord;
            return nearestCoord
        }
        function getLengthFromCenter(x, y, paneCenterX, paneCenterY) {
            return _sqrt((x - paneCenterX) * (x - paneCenterX) + (y - paneCenterY) * (y - paneCenterY))
        }
        function getInnerRadius(series) {
            var innerRadius;
            if (series.type === "pie")
                innerRadius = 0;
            else {
                innerRadius = _isNumber(series.innerRadius) ? Number(series.innerRadius) : 0.5;
                innerRadius = innerRadius < 0.2 ? 0.2 : innerRadius;
                innerRadius = innerRadius > 0.8 ? 0.8 : innerRadius
            }
            return innerRadius
        }
        function isValidBox(box) {
            return !!(box.x || box.y || box.width || box.height)
        }
        function correctDeltaMarginValue(panes, marginSides) {
            var canvasCell,
                canvas,
                deltaSide,
                requireAxesRedraw;
            _each(panes, function(_, pane) {
                canvas = pane.canvas;
                _each(marginSides, function(_, side) {
                    deltaSide = "delta" + side;
                    canvas[deltaSide] = _max(canvas[deltaSide] - (canvas[side.toLowerCase()] - canvas["original" + side]), 0);
                    if (canvas[deltaSide] > 0)
                        requireAxesRedraw = true
                })
            });
            return requireAxesRedraw
        }
        function getPane(name, panes) {
            var findPane = panes[0];
            _each(panes, function(_, pane) {
                if (name === pane.name)
                    findPane = pane
            });
            return findPane
        }
        function applyFoundExceedings(panes, rotated) {
            var stopDrawAxes,
                maxLeft = 0,
                maxRight = 0,
                maxTop = 0,
                maxBottom = 0,
                maxColNumber = 0;
            _each(panes, function(_, pane) {
                maxLeft = _max(maxLeft, pane.canvas.deltaLeft);
                maxRight = _max(maxRight, pane.canvas.deltaRight);
                maxTop = _max(maxTop, pane.canvas.deltaTop);
                maxBottom = _max(maxBottom, pane.canvas.deltaBottom)
            });
            if (rotated)
                _each(panes, function(_, pane) {
                    pane.canvas.top += maxTop;
                    pane.canvas.bottom += maxBottom;
                    pane.canvas.right += pane.canvas.deltaRight;
                    pane.canvas.left += pane.canvas.deltaLeft
                });
            else
                _each(panes, function(_, pane) {
                    pane.canvas.top += pane.canvas.deltaTop;
                    pane.canvas.bottom += pane.canvas.deltaBottom;
                    pane.canvas.right += maxRight;
                    pane.canvas.left += maxLeft
                });
            _each(panes, function(_, pane) {
                if (pane.canvas.top + pane.canvas.bottom > pane.canvas.height)
                    stopDrawAxes = true;
                if (pane.canvas.left + pane.canvas.right > pane.canvas.width)
                    stopDrawAxes = true
            });
            return stopDrawAxes
        }
        function LayoutManager(options) {
            this._verticalElements = [];
            this._horizontalElements = [];
            this._options = options
        }
        LayoutManager.prototype = {
            constructor: LayoutManager,
            dispose: function() {
                this._verticalElements = this._horizontalElements = this._options = null
            },
            drawElements: function(elements, canvas) {
                var horizontalElements = [],
                    verticalElements = [];
                _each(elements, function(_, element) {
                    var options,
                        length;
                    element.setSize({
                        width: canvas.width - canvas.left - canvas.right,
                        height: canvas.height - canvas.top - canvas.bottom
                    });
                    element.draw();
                    options = element.getLayoutOptions();
                    if (options) {
                        length = getLength(options.cutLayoutSide);
                        (length === 'width' ? horizontalElements : verticalElements).push(element);
                        canvas[options.cutLayoutSide] += options[length];
                        setCanvasValues(canvas)
                    }
                });
                this._horizontalElements = horizontalElements;
                this._verticalElements = verticalElements;
                return this
            },
            placeDrawnElements: function(canvas) {
                correctElementsPosition(this._horizontalElements, 'width', canvas);
                placeElementAndCutCanvas(this._horizontalElements, canvas);
                correctElementsPosition(this._verticalElements, 'height', canvas);
                placeElementAndCutCanvas(this._verticalElements, canvas);
                return this
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
                    setCanvasValues(pane.canvas)
                })
            },
            applyVerticalAxesLayout: function(axes, panes, rotated) {
                this._applyAxesLayout(axes, panes, rotated)
            },
            applyHorizontalAxesLayout: function(axes, panes, rotated) {
                axes.reverse();
                this._applyAxesLayout(axes, panes, rotated);
                axes.reverse()
            },
            _applyAxesLayout: function(axes, panes, rotated) {
                var that = this,
                    canvas,
                    axisPanePosition,
                    axisPosition,
                    canvasCell,
                    box,
                    delta,
                    axis,
                    axisLength,
                    direction,
                    directionMultiplier,
                    someDirection = [],
                    pane,
                    i;
                _each(panes, function(_, pane) {
                    _extend(pane.canvas, {
                        deltaLeft: 0,
                        deltaRight: 0,
                        deltaTop: 0,
                        deltaBottom: 0
                    })
                });
                for (i = 0; i < axes.length; i++) {
                    axis = axes[i];
                    axisPosition = axis.getOptions().position || "left";
                    axis.delta = {};
                    box = axis.getBoundingRect();
                    pane = getPane(axis.pane, panes);
                    canvas = pane.canvas;
                    if (!isValidBox(box))
                        continue;
                    direction = "delta" + axisPosition.slice(0, 1).toUpperCase() + axisPosition.slice(1);
                    switch (axisPosition) {
                        case"right":
                            directionMultiplier = 1;
                            canvas.deltaLeft += axis.padding ? axis.padding.left : 0;
                            break;
                        case"left":
                            directionMultiplier = -1;
                            canvas.deltaRight += axis.padding ? axis.padding.right : 0;
                            break;
                        case"top":
                            directionMultiplier = -1;
                            canvas.deltaBottom += axis.padding ? axis.padding.bottom : 0;
                            break;
                        case"bottom":
                            directionMultiplier = 1;
                            canvas.deltaTop += axis.padding ? axis.padding.top : 0;
                            break
                    }
                    switch (axisPosition) {
                        case"right":
                        case"left":
                            if (!box.isEmpty) {
                                delta = box.y + box.height - (canvas.height - canvas.originalBottom);
                                if (delta > 0) {
                                    that.requireAxesRedraw = true;
                                    canvas.deltaBottom += delta
                                }
                                delta = canvas.originalTop - box.y;
                                if (delta > 0) {
                                    that.requireAxesRedraw = true;
                                    canvas.deltaTop += delta
                                }
                            }
                            axisLength = box.width;
                            someDirection = ["Left", "Right"];
                            break;
                        case"top":
                        case"bottom":
                            if (!box.isEmpty) {
                                delta = box.x + box.width - (canvas.width - canvas.originalRight);
                                if (delta > 0) {
                                    that.requireAxesRedraw = true;
                                    canvas.deltaRight += delta
                                }
                                delta = canvas.originalLeft - box.x;
                                if (delta > 0) {
                                    that.requireAxesRedraw = true;
                                    canvas.deltaLeft += delta
                                }
                            }
                            someDirection = ["Bottom", "Top"];
                            axisLength = box.height;
                            break
                    }
                    if (!axis.delta[axisPosition] && canvas[direction] > 0)
                        canvas[direction] += axis.getMultipleAxesSpacing();
                    axis.delta[axisPosition] = axis.delta[axisPosition] || 0;
                    axis.delta[axisPosition] += canvas[direction] * directionMultiplier;
                    canvas[direction] += axisLength
                }
                that.requireAxesRedraw = correctDeltaMarginValue(panes, someDirection) || that.requireAxesRedraw;
                that.stopDrawAxes = applyFoundExceedings(panes, rotated)
            },
            applyPieChartSeriesLayout: function(canvas, singleSeries, hideLayoutLabels) {
                var paneSpaceHeight = canvas.height - canvas.top - canvas.bottom,
                    paneSpaceWidth = canvas.width - canvas.left - canvas.right,
                    paneCenterX = paneSpaceWidth / 2 + canvas.left,
                    paneCenterY = paneSpaceHeight / 2 + canvas.top,
                    piePercentage = this._options.piePercentage,
                    accessibleRadius = _isNumber(piePercentage) ? piePercentage * _min(canvas.height, canvas.width) / 2 : _min(paneSpaceWidth, paneSpaceHeight) / 2,
                    minR = 0.7 * accessibleRadius,
                    innerRadius = getInnerRadius(singleSeries);
                if (!hideLayoutLabels && !_isNumber(piePercentage))
                    _each(singleSeries.getPoints(), function(_, point) {
                        if (point._label.hasText() && point.isVisible()) {
                            var labelBBox = point._label.getBoundingRect(),
                                nearestX = getNearestCoord(labelBBox.x, labelBBox.x + labelBBox.width, paneCenterX),
                                nearestY = getNearestCoord(labelBBox.y, labelBBox.y + labelBBox.height, paneCenterY),
                                minRadiusWithLabels = _max(getLengthFromCenter(nearestX, nearestY, paneCenterX, paneCenterY) - DX.viz.core.series.helpers.consts.pieLabelIndent, minR);
                            accessibleRadius = _min(accessibleRadius, minRadiusWithLabels)
                        }
                    });
                singleSeries.correctPosition({
                    centerX: _floor(paneCenterX),
                    centerY: _floor(paneCenterY),
                    radiusInner: _floor(accessibleRadius * innerRadius),
                    radiusOuter: _floor(accessibleRadius)
                })
            },
            updateDrawnElements: function(axes, canvas, dirtyCanvas, panes, rotated) {
                var needRemoveSpace,
                    saveDirtyCanvas = _extend({}, dirtyCanvas);
                needRemoveSpace = this.needMoreSpaceForPanesCanvas(panes, rotated);
                if (!needRemoveSpace)
                    return;
                needRemoveSpace.height = _decreaseGaps(dirtyCanvas, ["top", "bottom"], needRemoveSpace.height);
                needRemoveSpace.width = _decreaseGaps(dirtyCanvas, ["left", "right"], needRemoveSpace.width);
                canvas.top -= saveDirtyCanvas.top - dirtyCanvas.top;
                canvas.bottom -= saveDirtyCanvas.bottom - dirtyCanvas.bottom;
                canvas.left -= saveDirtyCanvas.left - dirtyCanvas.left;
                canvas.right -= saveDirtyCanvas.right - dirtyCanvas.right;
                updateElements(this._horizontalElements, "width", "height", dirtyCanvas, canvas, needRemoveSpace);
                updateElements(this._verticalElements, "height", "width", dirtyCanvas, canvas, needRemoveSpace);
                updateAxis(axes.verticalAxes, "width", needRemoveSpace);
                updateAxis(axes.horizontalAxes, "height", needRemoveSpace)
            },
            needMoreSpaceForPanesCanvas: function(panes, rotated) {
                var options = this._options,
                    width = options.width,
                    height = options.height,
                    piePercentage = options.piePercentage,
                    percentageIsValid = _isNumber(piePercentage),
                    needHorizontalSpace = 0,
                    needVerticalSpace = 0;
                _each(panes, function(_, pane) {
                    var paneCanvas = pane.canvas,
                        minSize = percentageIsValid ? _min(paneCanvas.width, paneCanvas.height) * piePercentage : undefined,
                        needPaneHorizonralSpace = (percentageIsValid ? minSize : width) - (paneCanvas.width - paneCanvas.left - paneCanvas.right),
                        needPaneVerticalSpace = (percentageIsValid ? minSize : height) - (paneCanvas.height - paneCanvas.top - paneCanvas.bottom);
                    if (rotated) {
                        needHorizontalSpace += needPaneHorizonralSpace > 0 ? needPaneHorizonralSpace : 0;
                        needVerticalSpace = _max(needPaneVerticalSpace > 0 ? needPaneVerticalSpace : 0, needVerticalSpace)
                    }
                    else {
                        needHorizontalSpace = _max(needPaneHorizonralSpace > 0 ? needPaneHorizonralSpace : 0, needHorizontalSpace);
                        needVerticalSpace += needPaneVerticalSpace > 0 ? needPaneVerticalSpace : 0
                    }
                });
                return needHorizontalSpace > 0 || needVerticalSpace > 0 ? {
                        width: needHorizontalSpace,
                        height: needVerticalSpace
                    } : false
            },
            correctSizeElement: function(element, canvas) {
                element.setSize({
                    width: canvas.width - canvas.right - canvas.left,
                    height: canvas.width - canvas.right - canvas.left
                });
                element.changeSize({
                    width: 0,
                    height: 0
                })
            }
        };
        DX.viz.charts._setCanvasValues = setCanvasValues;
        DX.viz.charts.LayoutManager = LayoutManager
    })(jQuery, DevExpress);
    /*! Module viz-charts, file multiAxesSynchronizer.js */
    (function($, DX, undefined) {
        var Range = DX.viz.core.Range,
            utils = DX.utils,
            _adjustValue = utils.adjustValue,
            _applyPrecisionByMinDelta = utils.applyPrecisionByMinDelta,
            _isDefined = utils.isDefined,
            _math = Math,
            _floor = _math.floor,
            _max = _math.max,
            _each = $.each,
            MIN_RANGE_FOR_ADJUST_BOUNDS = 0.1;
        var getValueAxesPerPanes = function(valueAxes) {
                var result = {};
                _each(valueAxes, function(_, axis) {
                    var pane = axis.pane;
                    if (!result[pane])
                        result[pane] = [];
                    result[pane].push(axis)
                });
                return result
            };
        var restoreOriginalBusinessRange = function(axis) {
                var businessRange,
                    translator = axis.getTranslator();
                if (!translator._originalBusinessRange)
                    translator._originalBusinessRange = new Range(translator.getBusinessRange());
                else {
                    businessRange = new Range(translator._originalBusinessRange);
                    translator.updateBusinessRange(businessRange);
                    axis.setRange(businessRange)
                }
            };
        var linearConvertor = {
                transform: function(v, b) {
                    return utils.getLog(v, b)
                },
                addInterval: function(v, i) {
                    return v + i
                },
                getInterval: function(base, tickInterval) {
                    return tickInterval
                },
                adjustValue: _floor
            };
        var logConvertor = {
                transform: function(v, b) {
                    return utils.raiseTo(v, b)
                },
                addInterval: function(v, i) {
                    return v * i
                },
                getInterval: function(base, tickInterval) {
                    return _math.pow(base, tickInterval)
                },
                adjustValue: _adjustValue
            };
        var convertAxisInfo = function(axisInfo, convertor) {
                if (!axisInfo.isLogarithmic)
                    return;
                var base = axisInfo.logarithmicBase,
                    tickValues = axisInfo.tickValues,
                    tick,
                    ticks = [],
                    interval;
                axisInfo.minValue = convertor.transform(axisInfo.minValue, base);
                axisInfo.oldMinValue = convertor.transform(axisInfo.oldMinValue, base);
                axisInfo.maxValue = convertor.transform(axisInfo.maxValue, base);
                axisInfo.oldMaxValue = convertor.transform(axisInfo.oldMaxValue, base);
                axisInfo.tickInterval = _math.round(axisInfo.tickInterval);
                if (axisInfo.tickInterval < 1)
                    axisInfo.tickInterval = 1;
                interval = convertor.getInterval(base, axisInfo.tickInterval);
                for (tick = convertor.adjustValue(convertor.transform(tickValues[0], base)); ticks.length < tickValues.length; tick = convertor.addInterval(tick, interval))
                    ticks.push(tick);
                ticks.tickInterval = axisInfo.tickInterval;
                axisInfo.tickValues = ticks
            };
        var populateAxesInfo = function(axes) {
                return $.map(axes, function(axis) {
                        restoreOriginalBusinessRange(axis);
                        var ticksValues = axis.getTicksValues(),
                            majorTicks = ticksValues.majorTicksValues,
                            options = axis.getOptions(),
                            minValue,
                            maxValue,
                            axisInfo = null,
                            businessRange,
                            tickInterval,
                            synchronizedValue;
                        if (majorTicks && majorTicks.length > 0 && utils.isNumber(majorTicks[0]) && options.type !== "discrete") {
                            businessRange = axis.getTranslator().getBusinessRange();
                            tickInterval = axis._tickManager.getTickInterval();
                            minValue = businessRange.minVisible;
                            maxValue = businessRange.maxVisible;
                            synchronizedValue = options.synchronizedValue;
                            if (minValue === maxValue && _isDefined(synchronizedValue)) {
                                minValue = majorTicks[0] - 1;
                                maxValue = majorTicks[0] + 1;
                                tickInterval = 1
                            }
                            axisInfo = {
                                axis: axis,
                                isLogarithmic: options.type === "logarithmic",
                                logarithmicBase: businessRange.base,
                                tickValues: majorTicks,
                                minorValues: ticksValues.minorTicksValues,
                                minValue: minValue,
                                oldMinValue: minValue,
                                maxValue: maxValue,
                                oldMaxValue: maxValue,
                                inverted: businessRange.invert,
                                tickInterval: tickInterval,
                                synchronizedValue: synchronizedValue
                            };
                            if (businessRange.stubData) {
                                axisInfo.stubData = true;
                                axisInfo.tickInterval = axisInfo.tickInterval || options.tickInterval;
                                axisInfo.isLogarithmic = false
                            }
                            convertAxisInfo(axisInfo, linearConvertor);
                            DX.utils.debug.assert(axisInfo.tickInterval !== undefined && axisInfo.tickInterval !== null, "tickInterval was not provided")
                        }
                        return axisInfo
                    })
            };
        var updateTickValues = function(axesInfo) {
                var maxTicksCount = 0;
                _each(axesInfo, function(_, axisInfo) {
                    maxTicksCount = _max(maxTicksCount, axisInfo.tickValues.length)
                });
                _each(axesInfo, function(_, axisInfo) {
                    var ticksMultiplier,
                        ticksCount,
                        additionalStartTicksCount = 0,
                        synchronizedValue = axisInfo.synchronizedValue,
                        tickValues = axisInfo.tickValues,
                        tickInterval = axisInfo.tickInterval;
                    if (_isDefined(synchronizedValue)) {
                        axisInfo.baseTickValue = axisInfo.invertedBaseTickValue = synchronizedValue;
                        axisInfo.tickValues = [axisInfo.baseTickValue]
                    }
                    else {
                        if (tickValues.length > 1 && tickInterval) {
                            ticksMultiplier = _floor((maxTicksCount + 1) / tickValues.length);
                            ticksCount = ticksMultiplier > 1 ? _floor((maxTicksCount + 1) / ticksMultiplier) : maxTicksCount;
                            additionalStartTicksCount = _floor((ticksCount - tickValues.length) / 2);
                            while (additionalStartTicksCount > 0 && tickValues[0] !== 0) {
                                tickValues.unshift(_applyPrecisionByMinDelta(tickValues[0], tickInterval, tickValues[0] - tickInterval));
                                additionalStartTicksCount--
                            }
                            while (tickValues.length < ticksCount)
                                tickValues.push(_applyPrecisionByMinDelta(tickValues[0], tickInterval, tickValues[tickValues.length - 1] + tickInterval));
                            axisInfo.tickInterval = tickInterval / ticksMultiplier
                        }
                        axisInfo.baseTickValue = tickValues[0];
                        axisInfo.invertedBaseTickValue = tickValues[tickValues.length - 1]
                    }
                })
            };
        var getAxisRange = function(axisInfo) {
                return axisInfo.maxValue - axisInfo.minValue || 1
            };
        var getMainAxisInfo = function(axesInfo) {
                for (var i = 0; i < axesInfo.length; i++)
                    if (!axesInfo[i].stubData)
                        return axesInfo[i];
                return null
            };
        var correctMinMaxValues = function(axesInfo) {
                var mainAxisInfo = getMainAxisInfo(axesInfo),
                    mainAxisInfoTickInterval = mainAxisInfo.tickInterval;
                _each(axesInfo, function(_, axisInfo) {
                    var scale,
                        move,
                        mainAxisBaseValueOffset,
                        valueFromAxisInfo;
                    if (axisInfo !== mainAxisInfo) {
                        if (mainAxisInfoTickInterval && axisInfo.tickInterval) {
                            if (axisInfo.stubData && _isDefined(axisInfo.synchronizedValue)) {
                                axisInfo.oldMinValue = axisInfo.minValue = axisInfo.baseTickValue - (mainAxisInfo.baseTickValue - mainAxisInfo.minValue) / mainAxisInfoTickInterval * axisInfo.tickInterval;
                                axisInfo.oldMaxValue = axisInfo.maxValue = axisInfo.baseTickValue - (mainAxisInfo.baseTickValue - mainAxisInfo.maxValue) / mainAxisInfoTickInterval * axisInfo.tickInterval
                            }
                            scale = mainAxisInfoTickInterval / getAxisRange(mainAxisInfo) / axisInfo.tickInterval * getAxisRange(axisInfo);
                            axisInfo.maxValue = axisInfo.minValue + getAxisRange(axisInfo) / scale
                        }
                        if (mainAxisInfo.inverted && !axisInfo.inverted || !mainAxisInfo.inverted && axisInfo.inverted)
                            mainAxisBaseValueOffset = mainAxisInfo.maxValue - mainAxisInfo.invertedBaseTickValue;
                        else
                            mainAxisBaseValueOffset = mainAxisInfo.baseTickValue - mainAxisInfo.minValue;
                        valueFromAxisInfo = getAxisRange(axisInfo);
                        move = (mainAxisBaseValueOffset / getAxisRange(mainAxisInfo) - (axisInfo.baseTickValue - axisInfo.minValue) / valueFromAxisInfo) * valueFromAxisInfo;
                        axisInfo.minValue -= move;
                        axisInfo.maxValue -= move
                    }
                })
            };
        var calculatePaddings = function(axesInfo) {
                var minPadding,
                    maxPadding,
                    startPadding = 0,
                    endPadding = 0;
                _each(axesInfo, function(_, axisInfo) {
                    var inverted = axisInfo.inverted;
                    minPadding = axisInfo.minValue > axisInfo.oldMinValue ? (axisInfo.minValue - axisInfo.oldMinValue) / getAxisRange(axisInfo) : 0;
                    maxPadding = axisInfo.maxValue < axisInfo.oldMaxValue ? (axisInfo.oldMaxValue - axisInfo.maxValue) / getAxisRange(axisInfo) : 0;
                    startPadding = _max(startPadding, inverted ? maxPadding : minPadding);
                    endPadding = _max(endPadding, inverted ? minPadding : maxPadding)
                });
                return {
                        start: startPadding,
                        end: endPadding
                    }
            };
        var correctMinMaxValuesByPaddings = function(axesInfo, paddings) {
                _each(axesInfo, function(_, info) {
                    var range = getAxisRange(info),
                        inverted = info.inverted;
                    info.minValue -= paddings[inverted ? "end" : "start"] * range;
                    info.maxValue += paddings[inverted ? "start" : "end"] * range;
                    if (range > MIN_RANGE_FOR_ADJUST_BOUNDS) {
                        info.minValue = _math.min(info.minValue, _adjustValue(info.minValue));
                        info.maxValue = _max(info.maxValue, _adjustValue(info.maxValue))
                    }
                })
            };
        var updateTickValuesIfSyncronizedValueUsed = function(axesInfo) {
                var hasSyncronizedValue = false;
                _each(axesInfo, function(_, info) {
                    hasSyncronizedValue = hasSyncronizedValue || _isDefined(info.synchronizedValue)
                });
                _each(axesInfo, function(_, info) {
                    var lastTickValue,
                        tickInterval = info.tickInterval,
                        tickValues = info.tickValues,
                        maxValue = info.maxValue,
                        minValue = info.minValue;
                    if (hasSyncronizedValue && tickInterval) {
                        while (tickValues[0] - tickInterval >= minValue)
                            tickValues.unshift(_adjustValue(tickValues[0] - tickInterval));
                        lastTickValue = tickValues[tickValues.length - 1];
                        while ((lastTickValue = lastTickValue + tickInterval) <= maxValue)
                            tickValues.push(utils.isExponential(lastTickValue) ? _adjustValue(lastTickValue) : _applyPrecisionByMinDelta(minValue, tickInterval, lastTickValue))
                    }
                    while (tickValues[0] < minValue)
                        tickValues.shift();
                    while (tickValues[tickValues.length - 1] > maxValue)
                        tickValues.pop()
                })
            };
        var applyMinMaxValues = function(axesInfo) {
                _each(axesInfo, function(_, info) {
                    var axis = info.axis,
                        range = axis.getTranslator().getBusinessRange();
                    if (range.min === range.minVisible)
                        range.min = info.minValue;
                    if (range.max === range.maxVisible)
                        range.max = info.maxValue;
                    range.minVisible = info.minValue;
                    range.maxVisible = info.maxValue;
                    if (_isDefined(info.stubData))
                        range.stubData = info.stubData;
                    if (range.min > range.minVisible)
                        range.min = range.minVisible;
                    if (range.max < range.maxVisible)
                        range.max = range.maxVisible;
                    range.isSynchronized = true;
                    axis.getTranslator().updateBusinessRange(range);
                    axis.setRange(range);
                    axis.setTicks({
                        majorTicks: info.tickValues,
                        minorTicks: info.minorValues
                    })
                })
            };
        var correctAfterSynchronize = function(axesInfo) {
                var invalidAxisInfo = [],
                    correctValue,
                    validAxisInfo;
                _each(axesInfo, function(i, info) {
                    if (info.oldMaxValue - info.oldMinValue === 0)
                        invalidAxisInfo.push(info);
                    else if (!_isDefined(correctValue) && !_isDefined(info.synchronizedValue)) {
                        correctValue = _math.abs((info.maxValue - info.minValue) / (info.tickValues[_floor(info.tickValues.length / 2)] || info.maxValue));
                        validAxisInfo = info
                    }
                });
                if (!_isDefined(correctValue))
                    return;
                _each(invalidAxisInfo, function(i, info) {
                    var firstTick = info.tickValues[0],
                        correctedTick = firstTick * correctValue,
                        tickValues = validAxisInfo.tickValues,
                        centralTick = tickValues[_floor(tickValues.length / 2)];
                    if (firstTick > 0) {
                        info.maxValue = correctedTick;
                        info.minValue = 0
                    }
                    else if (firstTick < 0) {
                        info.minValue = correctedTick;
                        info.maxValue = 0
                    }
                    else if (firstTick === 0) {
                        info.maxValue = validAxisInfo.maxValue - centralTick;
                        info.minValue = validAxisInfo.minValue - centralTick
                    }
                })
            };
        DX.viz.charts.multiAxesSynchronizer = {synchronize: function(valueAxes) {
                _each(getValueAxesPerPanes(valueAxes), function(_, axes) {
                    var axesInfo,
                        paddings;
                    if (axes.length > 1) {
                        axesInfo = populateAxesInfo(axes);
                        if (axesInfo.length === 0 || !getMainAxisInfo(axesInfo))
                            return;
                        updateTickValues(axesInfo);
                        correctMinMaxValues(axesInfo);
                        paddings = calculatePaddings(axesInfo);
                        correctMinMaxValuesByPaddings(axesInfo, paddings);
                        correctAfterSynchronize(axesInfo);
                        updateTickValuesIfSyncronizedValueUsed(axesInfo);
                        _each(axesInfo, function() {
                            convertAxisInfo(this, logConvertor)
                        });
                        applyMinMaxValues(axesInfo)
                    }
                })
            }}
    })(jQuery, DevExpress);
    /*! Module viz-charts, file tracker.js */
    (function($, DX, math) {
        var charts = DX.viz.charts,
            eventsConsts = DX.viz.core.series.helpers.consts.events,
            utils = DX.utils,
            isFunction = utils.isFunction,
            isDefined = utils.isDefined,
            _floor = math.floor,
            _each = $.each,
            MULTIPLE_MODE = 'multiple',
            SINGLE_MODE = 'single',
            ALL_ARGUMENTS_POINTS_MODE = 'allargumentpoints',
            ALL_SERIES_POINTS_MODE = 'allseriespoints',
            NONE_MODE = 'none',
            POINTER_ACTION = "dxpointerdown dxpointermove",
            POINT_SELECTION_CHANGED = "pointSelectionChanged",
            LEGEND_CLICK = "legendClick",
            SERIES_CLICK = "seriesClick",
            POINT_CLICK = "pointClick",
            RELEASE_POINT_SELECTED_STATE = "releasePointSelectedState",
            SET_POINT_SELECTED_STATE = "setPointSelectedState",
            DELAY = 100;
        function processMode(mode) {
            return (mode + "").toLowerCase()
        }
        function getNonVirtualAxis(axisArray) {
            var axis;
            _each(axisArray, function(_, a) {
                if (!a._virtual) {
                    axis = a;
                    return false
                }
            });
            return axis
        }
        function eventCanceled(event, target) {
            return event.cancel || !target.getOptions()
        }
        var baseTrackerPrototype = {
                ctor: function(options) {
                    var that = this,
                        data = {tracker: that};
                    if (processMode(options.pointSelectionMode) === MULTIPLE_MODE) {
                        that._setSelectedPoint = that._selectPointMultipleMode;
                        that._releaseSelectedPoint = that._releaseSelectedPointMultipleMode
                    }
                    else {
                        that._setSelectedPoint = that._selectPointSingleMode;
                        that._releaseSelectedPoint = that._releaseSelectedPointSingleMode
                    }
                    if (processMode(options.seriesSelectionMode) === MULTIPLE_MODE) {
                        that._releaseSelectedSeries = that._releaseSelectedSeriesMultipleMode;
                        that._setSelectedSeries = that._setSelectedSeriesMultipleMode
                    }
                    else {
                        that._releaseSelectedSeries = that._releaseSelectedSeriesSingleMode;
                        that._setSelectedSeries = that._setSelectedSeriesSingleMode
                    }
                    that._renderer = options.renderer;
                    that._tooltip = options.tooltip;
                    that._eventTrigger = options.eventTrigger;
                    options.seriesGroup.off().on(eventsConsts.selectSeries, data, that._selectSeries).on(eventsConsts.deselectSeries, data, that._deselectSeries).on(eventsConsts.selectPoint, data, that._selectPoint).on(eventsConsts.deselectPoint, data, that._deselectPoint).on(eventsConsts.showPointTooltip, data, that._showPointTooltip).on(eventsConsts.hidePointTooltip, data, that._hidePointTooltip);
                    that._renderer.root.off(POINTER_ACTION).off("dxclick dxhold").on(POINTER_ACTION, data, that._pointerHandler).on("dxclick", data, that._clickHandler).on("dxhold", {timeout: 300}, $.noop)
                },
                update: function(options) {
                    var that = this;
                    if (that._storedSeries !== options.series) {
                        that._storedSeries = options.series || [];
                        that._clean()
                    }
                    else {
                        that._hideTooltip(that.pointAtShownTooltip);
                        that._clearHover();
                        that.clearSelection()
                    }
                    that._tooltipEnabled = that._tooltip.enabled();
                    that._legend = options.legend;
                    that.legendCallback = options.legendCallback;
                    that._prepare(that._renderer.root)
                },
                setCanvases: function(mainCanvas, paneCanvases) {
                    this._mainCanvas = mainCanvas;
                    this._canvases = paneCanvases
                },
                repairTooltip: function() {
                    this._showTooltip(this.pointAtShownTooltip)
                },
                _prepare: $.noop,
                _selectPointMultipleMode: function(point) {
                    var that = this;
                    that._selectedPoint = that._selectedPoint || [];
                    if ($.inArray(point, that._selectedPoint) < 0) {
                        that._selectedPoint.push(point);
                        that._setPointState(point, SET_POINT_SELECTED_STATE, processMode(point.getOptions().selectionMode), POINT_SELECTION_CHANGED, that.legendCallback(point))
                    }
                },
                _releaseSelectedPointMultipleMode: function(point) {
                    var that = this,
                        points = that._selectedPoint || [],
                        pointIndex = $.inArray(point, points);
                    if (pointIndex >= 0) {
                        that._setPointState(point, RELEASE_POINT_SELECTED_STATE, processMode(point.getOptions().selectionMode), POINT_SELECTION_CHANGED, that.legendCallback(point));
                        points.splice(pointIndex, 1)
                    }
                    else if (!point)
                        _each(points, function(_, point) {
                            that._releaseSelectedPoint(point)
                        })
                },
                _selectPointSingleMode: function(point) {
                    var that = this;
                    if (that._selectedPoint !== point) {
                        that._releaseSelectedPoint();
                        that._selectedPoint = point;
                        that._setPointState(point, SET_POINT_SELECTED_STATE, processMode(point.getOptions().selectionMode), POINT_SELECTION_CHANGED, that.legendCallback(point))
                    }
                },
                _releaseSelectedPointSingleMode: function() {
                    var that = this,
                        point = that._selectedPoint;
                    if (point) {
                        that._setPointState(point, RELEASE_POINT_SELECTED_STATE, processMode(point.getOptions().selectionMode), POINT_SELECTION_CHANGED, that.legendCallback(point));
                        that._selectedPoint = null
                    }
                },
                _setPointState: function(point, action, mode, eventName, legendCallback) {
                    var that = this;
                    switch (mode) {
                        case ALL_ARGUMENTS_POINTS_MODE:
                            that._toAllArgumentPoints(point.argument, action, eventName);
                            break;
                        case ALL_SERIES_POINTS_MODE:
                            _each(point.series.getPoints(), function(_, point) {
                                point.series[action](point);
                                that._eventTrigger(eventName, {target: point})
                            });
                            break;
                        case NONE_MODE:
                            break;
                        default:
                            point.series[action](point, legendCallback);
                            that._eventTrigger(eventName, {target: point})
                    }
                },
                _toAllArgumentPoints: function(argument, func, eventName) {
                    var that = this;
                    _each(that._storedSeries, function(_, series) {
                        var neighborPoints = series.getPointsByArg(argument);
                        _each(neighborPoints || [], function(_, point) {
                            series[func](point);
                            eventName && that._eventTrigger(eventName, {target: point})
                        })
                    })
                },
                _setHoveredPoint: function(point, mode) {
                    var that = this;
                    var debug = DX.utils.debug;
                    debug.assert(point.series, 'series was not assigned to point or empty');
                    if (that.hoveredPoint === point || !point.series)
                        return;
                    that._releaseHoveredPoint();
                    if (point && point.getOptions() && mode !== NONE_MODE) {
                        that.hoveredPoint = point;
                        that._setPointState(point, 'setPointHoverState', mode || processMode(point.getOptions().hoverMode), "pointHoverChanged", that.legendCallback(point))
                    }
                },
                _releaseHoveredPoint: function() {
                    var that = this,
                        point = that.hoveredPoint,
                        mode;
                    if (!point || !point.getOptions())
                        return;
                    mode = processMode(point.getOptions().hoverMode);
                    if (mode === ALL_SERIES_POINTS_MODE)
                        _each(point.series.getPoints(), function(_, point) {
                            point.series.releasePointHoverState(point);
                            that._eventTrigger("pointHoverChanged", {target: point})
                        });
                    else if (mode === ALL_ARGUMENTS_POINTS_MODE)
                        that._toAllArgumentPoints(point.argument, 'releasePointHoverState', "pointHoverChanged");
                    else {
                        point.releaseHoverState(that.legendCallback(point));
                        that._eventTrigger("pointHoverChanged", {target: point})
                    }
                    if (that._tooltipEnabled)
                        that._hideTooltip(point);
                    that.hoveredPoint = null
                },
                _setSelectedSeriesMultipleMode: function(series, mode) {
                    var that = this;
                    that._selectedSeries = that._selectedSeries || [];
                    if ($.inArray(series, that._selectedSeries) < 0) {
                        that._selectedSeries.push(series);
                        series.setSelectedState(true, mode, that.legendCallback(series));
                        that._eventTrigger("seriesSelectionChanged", {target: series})
                    }
                },
                _setSelectedSeriesSingleMode: function(series, mode) {
                    var that = this;
                    if (series !== that._selectedSeries || series.lastSelectionMode !== mode) {
                        this._releaseSelectedSeries();
                        that._selectedSeries = series;
                        series.setSelectedState(true, mode, that.legendCallback(series));
                        that._eventTrigger("seriesSelectionChanged", {target: series})
                    }
                },
                _releaseSelectedSeriesMultipleMode: function(series) {
                    var that = this,
                        selectedSeries = that._selectedSeries || [],
                        seriesIndex = $.inArray(series, selectedSeries);
                    if (seriesIndex >= 0) {
                        series.setSelectedState(false, undefined, that.legendCallback(series));
                        that._eventTrigger("seriesSelectionChanged", {target: series});
                        selectedSeries.splice(seriesIndex, 1)
                    }
                    else if (!series)
                        _each(selectedSeries, function(_, series) {
                            that._releaseSelectedSeries(series)
                        })
                },
                _releaseSelectedSeriesSingleMode: function() {
                    var that = this,
                        series = that._selectedSeries;
                    if (series) {
                        series.setSelectedState(false, undefined, that.legendCallback(series));
                        that._eventTrigger("seriesSelectionChanged", {target: series});
                        that._selectedSeries = null
                    }
                },
                _setHoveredSeries: function(series, mode) {
                    var that = this;
                    if (mode !== NONE_MODE && that.hoveredSeries !== series || series.lastHoverMode !== mode) {
                        that._clearHover();
                        series.setHoverState(true, mode, that.legendCallback(series));
                        that._eventTrigger("seriesHoverChanged", {target: series})
                    }
                    that.hoveredSeries = series;
                    if (mode === NONE_MODE)
                        $(series).trigger('NoneMode')
                },
                _releaseHoveredSeries: function() {
                    var that = this;
                    if (that.hoveredSeries) {
                        that.hoveredSeries.setHoverState(false, undefined, that.legendCallback(that.hoveredSeries));
                        that._eventTrigger("seriesHoverChanged", {target: that.hoveredSeries});
                        that.hoveredSeries = null
                    }
                },
                _selectSeries: function(event, mode) {
                    event.data.tracker._setSelectedSeries(event.target, mode)
                },
                _deselectSeries: function(event, mode) {
                    event.data.tracker._releaseSelectedSeries(event.target, mode)
                },
                _selectPoint: function(event, point) {
                    event.data.tracker._setSelectedPoint(point)
                },
                _deselectPoint: function(event, point) {
                    event.data.tracker._releaseSelectedPoint(point)
                },
                clearSelection: function() {
                    this._releaseSelectedPoint();
                    this._releaseSelectedSeries()
                },
                _clean: function() {
                    var that = this;
                    that._selectedPoint = that._selectedSeries = that.hoveredPoint = that.hoveredSeries = null;
                    that._hideTooltip(that.pointAtShownTooltip)
                },
                _clearHover: function() {
                    this._releaseHoveredSeries();
                    this._releaseHoveredPoint()
                },
                _hideTooltip: function(point) {
                    var that = this,
                        eventData;
                    if (!that._tooltip || point && that.pointAtShownTooltip !== point)
                        return;
                    point = point || that.pointAtShownTooltip;
                    if (that.pointAtShownTooltip) {
                        that.pointAtShownTooltip = null;
                        eventData = {target: point}
                    }
                    that._tooltip.hide(eventData)
                },
                _showTooltip: function(point) {
                    var that = this,
                        tooltipFormatObject,
                        eventData;
                    if (point && point.getOptions()) {
                        tooltipFormatObject = point.getTooltipFormatObject(that._tooltip);
                        if (!isDefined(tooltipFormatObject.valueText) && !tooltipFormatObject.points || !point.isVisible())
                            return;
                        if (!that._tooltip.prepare(tooltipFormatObject, point.getTooltipParams(that._tooltip.getLocation())))
                            return;
                        if (!that.pointAtShownTooltip)
                            eventData = {target: point};
                        that.pointAtShownTooltip = point;
                        that._tooltip.show(eventData)
                    }
                },
                _showPointTooltip: function(event, point) {
                    event.data.tracker._showTooltip(point)
                },
                _hidePointTooltip: function(event, point) {
                    event.data.tracker._hideTooltip(point)
                },
                _enableOutHandler: function() {
                    if (this._outHandler)
                        return;
                    var that = this,
                        handler = function(e) {
                            var rootOffset = utils.getRootOffset(that._renderer),
                                x = _floor(e.pageX - rootOffset.left),
                                y = _floor(e.pageY - rootOffset.top);
                            if (!that._inCanvas(that._mainCanvas, x, y)) {
                                that._pointerOut();
                                that._disableOutHandler()
                            }
                        };
                    $(document).on(POINTER_ACTION, handler);
                    this._outHandler = handler
                },
                _disableOutHandler: function() {
                    this._outHandler && $(document).off(POINTER_ACTION, this._outHandler);
                    this._outHandler = null
                },
                _pointerOut: function() {
                    this._clearHover();
                    this._tooltipEnabled && this._hideTooltip(this.pointAtShownTooltip)
                },
                _inCanvas: function(canvas, x, y) {
                    return x >= canvas.left && x <= canvas.right && y >= canvas.top && y <= canvas.bottom
                },
                dispose: function() {
                    var that = this;
                    that._disableOutHandler();
                    _each(that, function(k) {
                        that[k] = null
                    })
                }
            };
        charts.ChartTracker = function(options) {
            this.ctor(options)
        };
        $.extend(charts.ChartTracker.prototype, baseTrackerPrototype, {
            ctor: function(options) {
                var that = this;
                baseTrackerPrototype.ctor.call(that, options);
                that._tooltip.off(POINTER_ACTION).on(POINTER_ACTION, {tracker: that}, that._tooltipPointerHandler)
            },
            _pointClick: function(point, event) {
                var that = this,
                    eventTrigger = that._eventTrigger,
                    series = point.series;
                eventTrigger(POINT_CLICK, {
                    target: point,
                    jQueryEvent: event
                }, function() {
                    !eventCanceled(event, series) && eventTrigger(SERIES_CLICK, {
                        target: series,
                        jQueryEvent: event
                    })
                })
            },
            __trackerDelay: DELAY,
            _legendClick: function(series, event) {
                var that = this,
                    evetArgs = {
                        target: series,
                        jQueryEvent: event
                    },
                    eventTrigger = that._eventTrigger;
                eventTrigger(LEGEND_CLICK, evetArgs, function() {
                    !eventCanceled(event, series) && eventTrigger(SERIES_CLICK, evetArgs)
                })
            },
            update: function(options) {
                var that = this;
                that._zoomingMode = (options.zoomingMode + '').toLowerCase();
                that._scrollingMode = (options.scrollingMode + '').toLowerCase();
                baseTrackerPrototype.update.call(this, options);
                that._argumentAxis = getNonVirtualAxis(options.argumentAxis || []);
                that._axisHoverEnabled = that._argumentAxis && processMode(that._argumentAxis.getOptions().hoverMode) === ALL_ARGUMENTS_POINTS_MODE;
                that._chart = options.chart;
                that._rotated = options.rotated;
                that._crosshair = options.crosshair
            },
            _getAxisArgument: function(event) {
                var $target = $(event.target);
                return event.target.tagName === "tspan" ? $target.parent().data('argument') : $target.data('argument')
            },
            _getCanvas: function(x, y) {
                var that = this,
                    canvases = that._canvases || [];
                for (var i = 0; i < canvases.length; i++) {
                    var c = canvases[i];
                    if (that._inCanvas(c, x, y))
                        return c
                }
                return null
            },
            _focusOnCanvas: function(canvas) {
                if (!canvas && this._stickedSeries)
                    this._pointerOut()
            },
            _resetHoveredArgument: function() {
                if (isDefined(this.hoveredArgument)) {
                    this._toAllArgumentPoints(this.hoveredArgument, 'releasePointHoverState');
                    this.hoveredArgument = null
                }
            },
            _hideCrosshair: function() {
                this._crosshair && this._crosshair.hide()
            },
            _moveCrosshair: function(point, x, y) {
                if (point && this._crosshair && point.isVisible()) {
                    var coords = point.getCrosshairCoords(x, y),
                        r = point.getPointRadius();
                    this._crosshair.shift(coords.x, coords.y, r)
                }
            },
            _prepare: function(root) {
                var that = this,
                    touchScrollingEnabled = that._scrollingMode === 'all' || that._scrollingMode === 'touch',
                    touchZoomingEnabled = that._zoomingMode === 'all' || that._zoomingMode === 'touch',
                    cssValue = (!touchScrollingEnabled ? "pan-x pan-y " : '') + (!touchZoomingEnabled ? "pinch-zoom" : '') || "none",
                    rootStyles = {
                        'touch-action': cssValue,
                        '-ms-touch-action': cssValue
                    },
                    wheelzoomingEnabled = that._zoomingMode === "all" || that._zoomingMode === "mouse";
                baseTrackerPrototype._prepare.call(that, root);
                root.off("dxmousewheel dxc-scroll-start dxc-scroll-move");
                if (!that._gestureEndHandler) {
                    that._gestureEndHandler = function() {
                        that._gestureEnd()
                    };
                    $(document).on("dxpointerup", that._gestureEndHandler)
                }
                wheelzoomingEnabled && root.on("dxmousewheel", function(e) {
                    var rootOffset = utils.getRootOffset(that._renderer),
                        x = that._rotated ? e.pageY - rootOffset.top : e.pageX - rootOffset.left,
                        scale = that._argumentAxis.getTranslator().getMinScale(e.delta > 0),
                        translate = x - x * scale,
                        zoom = that._argumentAxis.getTranslator().zoom(-translate, scale);
                    that._pointerOut();
                    that._chart.zoomArgument(zoom.min, zoom.max, true);
                    e.preventDefault()
                });
                root.on("dxc-scroll-start", function(e) {
                    that._gestureStart(that._getGestureParams(e, {
                        left: 0,
                        top: 0
                    }))
                }).on("dxc-scroll-move", function(e) {
                    that._gestureChange(that._getGestureParams(e, {
                        left: 0,
                        top: 0
                    })) && e.preventDefault()
                });
                root.css(rootStyles)
            },
            _getGestureParams: function(e, offset) {
                var that = this,
                    x1,
                    x2,
                    touches = e.pointers.length,
                    left,
                    right,
                    eventCoordField = that._rotated ? "pageY" : "pageX";
                offset = that._rotated ? offset.top : offset.left;
                if (touches === 2)
                    x1 = e.pointers[0][eventCoordField] - offset,
                    x2 = e.pointers[1][eventCoordField] - offset;
                else if (touches === 1)
                    x1 = x2 = e.pointers[0][eventCoordField] - offset;
                left = math.min(x1, x2);
                right = math.max(x1, x2);
                return {
                        center: left + (right - left) / 2,
                        distance: right - left,
                        touches: touches,
                        scale: 1,
                        pointerType: e.pointerType
                    }
            },
            _gestureStart: function(gestureParams) {
                var that = this;
                that._startGesture = that._startGesture || gestureParams;
                if (that._startGesture.touches !== gestureParams.touches)
                    that._startGesture = gestureParams
            },
            _gestureChange: function(gestureParams) {
                var that = this,
                    startGesture = that._startGesture,
                    gestureChanged = false,
                    scrollingEnabled = that._scrollingMode === 'all' || that._scrollingMode !== 'none' && that._scrollingMode === gestureParams.pointerType,
                    zoommingEnabled = that._zoomingMode === 'all' || that._zoomingMode === 'touch';
                if (!startGesture)
                    return gestureChanged;
                if (startGesture.touches === 1 && math.abs(startGesture.center - gestureParams.center) < 3) {
                    that._gestureStart(gestureParams);
                    return gestureChanged
                }
                if (startGesture.touches === 2 && zoommingEnabled) {
                    gestureChanged = true;
                    startGesture.scale = gestureParams.distance / startGesture.distance;
                    startGesture.scroll = gestureParams.center - startGesture.center + (startGesture.center - startGesture.center * startGesture.scale)
                }
                else if (startGesture.touches === 1 && scrollingEnabled) {
                    gestureChanged = true;
                    startGesture.scroll = gestureParams.center - startGesture.center
                }
                if (gestureChanged) {
                    startGesture.changed = gestureChanged;
                    that._chart._transformArgument(startGesture.scroll, startGesture.scale)
                }
                return gestureChanged
            },
            _gestureEnd: function() {
                var that = this,
                    startGesture = that._startGesture,
                    zoom,
                    renderer = that._renderer;
                that._startGesture = null;
                function complete() {
                    that._chart.zoomArgument(zoom.min, zoom.max, true)
                }
                if (startGesture && startGesture.changed) {
                    zoom = that._argumentAxis._translator.zoom(-startGesture.scroll, startGesture.scale);
                    if (renderer.animationEnabled() && (-startGesture.scroll !== zoom.translate || startGesture.scale !== zoom.scale)) {
                        var translateDelta = -(startGesture.scroll + zoom.translate),
                            scaleDelta = startGesture.scale - zoom.scale;
                        renderer.root.animate({_: 0}, {
                            step: function(pos) {
                                var translateValue = -startGesture.scroll - translateDelta * pos;
                                var scaleValue = startGesture.scale - scaleDelta * pos;
                                that._chart._transformArgument(-translateValue, scaleValue)
                            },
                            complete: complete,
                            duration: 250
                        })
                    }
                    else
                        complete()
                }
            },
            _clean: function() {
                var that = this;
                baseTrackerPrototype._clean.call(that);
                that._resetTimer();
                that._stickedSeries = null
            },
            _getSeriesForShared: function(x, y) {
                var that = this,
                    points = [],
                    point = null,
                    distance = Infinity;
                if (that._tooltip.shared() && !that.hoveredSeries) {
                    _each(that._storedSeries, function(_, series) {
                        var point = series.getNeighborPoint(x, y);
                        point && points.push(point)
                    });
                    _each(points, function(_, p) {
                        var coords = p.getCrosshairCoords(x, y),
                            d = math.sqrt((x - coords.x) * (x - coords.x) + (y - coords.y) * (y - coords.y));
                        if (d < distance) {
                            point = p;
                            distance = d
                        }
                    })
                }
                return point && point.series
            },
            _setTimeout: function(callback, keeper) {
                var that = this;
                if (that._timeoutKeeper !== keeper) {
                    that._resetTimer();
                    that._hoverTimeout = setTimeout(function() {
                        callback();
                        that._timeoutKeeper = null
                    }, DELAY);
                    that._timeoutKeeper = keeper
                }
            },
            _resetTimer: function() {
                clearTimeout(this._hoverTimeout);
                this._timeoutKeeper = this._hoverTimeout = null
            },
            _pointerHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = utils.getRootOffset(that._renderer),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    canvas = that._getCanvas(x, y),
                    series = $(e.target).data("series"),
                    point = $(e.target).data("point") || series && series.getPointByCoord(x, y);
                that._enableOutHandler();
                that._x = x;
                that._y = y;
                if (e.type === "dxpointerdown")
                    canvas && that._gestureStart(that._getGestureParams(e, rootOffset));
                else if (that._startGesture && canvas)
                    if (that._gestureChange(that._getGestureParams(e, rootOffset))) {
                        that._pointerOut();
                        e.preventDefault();
                        return
                    }
                if (that._legend.coordsIn(x, y)) {
                    var item = that._legend.getItemByCoord(x, y);
                    if (item) {
                        series = that._storedSeries[item.id];
                        that._setHoveredSeries(series, that._legend._options.hoverMode);
                        that._stickedSeries = series
                    }
                    else
                        that._clearHover();
                    that._hideCrosshair();
                    return
                }
                if (that._axisHoverEnabled && that._argumentAxis.coordsIn(x, y)) {
                    var argument = that._getAxisArgument(e),
                        argumentDefined = isDefined(argument);
                    if (argumentDefined && that.hoveredArgument !== argument) {
                        that._clearHover();
                        that._resetHoveredArgument();
                        that._toAllArgumentPoints(argument, "setPointHoverState");
                        that.hoveredArgument = argument
                    }
                    else if (!argumentDefined)
                        that._resetHoveredArgument();
                    return
                }
                that._resetHoveredArgument();
                that._focusOnCanvas(canvas);
                if (!canvas && !point)
                    return;
                if (!series && !point)
                    that._stickedSeries = that._stickedSeries || that._getSeriesForShared(x, y);
                if (series && !point) {
                    point = series.getNeighborPoint(x, y);
                    if (series !== that.hoveredSeries) {
                        that._setTimeout(function() {
                            that._setHoveredSeries(series, series.getOptions().hoverMode);
                            that._stickedSeries = series;
                            that._pointerComplete(point)
                        }, series);
                        return
                    }
                }
                else if (point) {
                    if (that.hoveredSeries)
                        that._setTimeout(function() {
                            that._pointerOnPoint(point)
                        }, point);
                    else
                        that._pointerOnPoint(point);
                    return
                }
                else if (that._stickedSeries) {
                    series = that._stickedSeries;
                    point = series.getNeighborPoint(x, y);
                    that.hoveredSeries && that._releaseHoveredSeries();
                    point && that._setHoveredPoint(point)
                }
                that._pointerComplete(point)
            },
            _pointerOnPoint: function(point) {
                var that = this;
                that._stickedSeries = point.series;
                that._setHoveredPoint(point);
                that.hoveredSeries && that._releaseHoveredSeries();
                that._pointerComplete(point)
            },
            _pointerComplete: function(point) {
                var that = this;
                that.hoveredSeries && that.hoveredSeries.updateHover(that._x, that._y);
                that._resetTimer();
                that._moveCrosshair(point, that._x, that._y);
                that.pointAtShownTooltip !== point && that._tooltipEnabled && that._showTooltip(point)
            },
            _pointerOut: function() {
                var that = this;
                that._stickedSeries = null;
                that._hideCrosshair();
                that._resetHoveredArgument();
                that._resetTimer();
                baseTrackerPrototype._pointerOut.call(that)
            },
            _clickHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = utils.getRootOffset(that._renderer),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    point = $(e.target).data("point"),
                    series = that._stickedSeries || $(e.target).data("series") || point && point.series,
                    axis = that._argumentAxis;
                if (that._legend.coordsIn(x, y)) {
                    var item = that._legend.getItemByCoord(x, y);
                    if (item) {
                        series = that._storedSeries[item.id];
                        that._legendClick(series, e)
                    }
                    return
                }
                if (axis && axis.coordsIn(x, y)) {
                    var argument = that._getAxisArgument(e);
                    if (isDefined(argument)) {
                        that._eventTrigger("argumentAxisClick", {
                            target: axis,
                            argument: argument,
                            jQueryEvent: e
                        });
                        return
                    }
                }
                if (series) {
                    point = point || series.getPointByCoord(x, y);
                    if (point)
                        that._pointClick(point, e);
                    else
                        $(e.target).data("series") && that._eventTrigger(SERIES_CLICK, {
                            target: series,
                            jQueryEvent: e
                        })
                }
            },
            _tooltipPointerHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = utils.getRootOffset(that._renderer),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    series = that._stickedSeries,
                    point;
                if (series && !series.getPointByCoord(x, y)) {
                    _each(that._storedSeries, function(_, s) {
                        point = s.getPointByCoord(x, y);
                        if (point)
                            return false
                    });
                    if (point)
                        that._stickedSeries = point.series
                }
            },
            dispose: function() {
                this._gestureEndHandler && $(document).off("dxpointerup", this._gestureEndHandler);
                this._resetTimer();
                baseTrackerPrototype.dispose.call(this)
            }
        });
        charts.PieTracker = function(options) {
            this.ctor(options)
        };
        $.extend(charts.PieTracker.prototype, baseTrackerPrototype, {
            _legendClick: function(point, event) {
                var that = this,
                    eventArg = {
                        target: point,
                        jQueryEvent: event
                    },
                    eventTrigger = that._eventTrigger;
                eventTrigger(LEGEND_CLICK, eventArg, function() {
                    !eventCanceled(event, point) && eventTrigger(POINT_CLICK, eventArg)
                })
            },
            _pointerHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = utils.getRootOffset(that._renderer),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    series = that._storedSeries[0],
                    point = $(e.target).data("point") || series && series.getPointByCoord(x, y),
                    item,
                    mode;
                that._enableOutHandler();
                if (that._legend.coordsIn(x, y)) {
                    item = that._legend.getItemByCoord(x, y);
                    if (item) {
                        point = series.getPoints()[item.id];
                        mode = that._legend._options.hoverMode
                    }
                }
                if (point && point !== that.hoveredPoint) {
                    that._tooltipEnabled && that._showTooltip(point);
                    that._setHoveredPoint(point, mode)
                }
                else if (!point)
                    that._pointerOut()
            },
            _clickHandler: function(e) {
                var that = e.data.tracker,
                    rootOffset = utils.getRootOffset(that._renderer),
                    x = _floor(e.pageX - rootOffset.left),
                    y = _floor(e.pageY - rootOffset.top),
                    storedSeries = that._storedSeries[0],
                    point;
                if (that._legend.coordsIn(x, y)) {
                    var item = that._legend.getItemByCoord(x, y);
                    if (item) {
                        point = storedSeries.getPoints()[item.id];
                        that._legendClick(point, e)
                    }
                }
                else {
                    point = $(e.target).data("point") || storedSeries && storedSeries.getPointByCoord(x, y);
                    point && that._eventTrigger(POINT_CLICK, {
                        target: point,
                        jQueryEvent: e
                    })
                }
            }
        })
    })(jQuery, DevExpress, Math);
    /*! Module viz-charts, file crosshair.js */
    (function($, DX, undefined) {
        var mathAbs = Math.abs,
            mathMin = Math.min,
            mathMax = Math.max,
            HORIZONTAL = "horizontal",
            VERTICAL = "vertical",
            LABEL_BACKGROUND_PADDING_X = 8,
            LABEL_BACKGROUND_PADDING_Y = 4,
            CENTER = "center",
            RIGHT = "right",
            LEFT = "left",
            TOP = "top",
            BOTTOM = "bottom",
            _isDefined = DX.utils.isDefined;
        function Crosshair() {
            this.ctor.apply(this, arguments)
        }
        DX.viz.charts.Crosshair = Crosshair;
        Crosshair.prototype = {
            ctor: function(renderer, options, params, group) {
                var that = this;
                that._renderer = renderer;
                that._crosshairGroup = group;
                that._options = {};
                that._init(options, params)
            },
            update: function(options, params) {
                this._init(options, params)
            },
            dispose: function() {
                var that = this;
                that._renderer = null;
                that._crosshairGroup = null;
                that._options = null;
                that._axes = null;
                that._canvas = null;
                that._horizontalGroup = null;
                that._verticalGroup = null;
                that._horizontal = null;
                that._vertical = null;
                that._circle = null;
                that._panes = null
            },
            _init: function(options, params) {
                var that = this,
                    canvas = params.canvas;
                that._canvas = {
                    top: canvas.top,
                    bottom: canvas.height - canvas.bottom,
                    left: canvas.left,
                    right: canvas.width - canvas.right,
                    width: canvas.width,
                    height: canvas.height
                };
                that._axes = params.axes;
                that._panes = params.panes;
                that._prepareOptions(options, HORIZONTAL);
                that._prepareOptions(options, VERTICAL)
            },
            _prepareOptions: function(options, direction) {
                this._options[direction] = {
                    visible: options[direction + "Line"].visible,
                    line: {
                        stroke: options[direction + "Line"].color || options.color,
                        "stroke-width": options[direction + "Line"].width || options.width,
                        dashStyle: options[direction + "Line"].dashStyle || options.dashStyle,
                        opacity: options[direction + "Line"].opacity || options.opacity,
                        "stroke-linecap": "butt"
                    },
                    label: $.extend(true, {}, options.label, options[direction + "Line"].label)
                }
            },
            _createLines: function(options, sharpParam, group) {
                var lines = [],
                    canvas = this._canvas,
                    points = [canvas.left, canvas.top, canvas.left, canvas.top];
                for (var i = 0; i < 2; i++)
                    lines.push(this._renderer.path(points, "line").attr(options).sharp(sharpParam).append(group));
                return lines
            },
            render: function() {
                var that = this,
                    renderer = that._renderer,
                    options = that._options,
                    verticalOptions = options.vertical,
                    horizontalOptions = options.horizontal,
                    extraOptions = horizontalOptions.visible ? horizontalOptions.line : verticalOptions.line,
                    circleOptions = {
                        stroke: extraOptions.stroke,
                        "stroke-width": extraOptions["stroke-width"],
                        dashStyle: extraOptions.dashStyle,
                        opacity: extraOptions.opacity
                    },
                    canvas = that._canvas;
                that._horizontal = {};
                that._vertical = {};
                that._horizontalGroup = renderer.g().append(that._crosshairGroup);
                that._verticalGroup = renderer.g().append(that._crosshairGroup);
                if (verticalOptions.visible) {
                    that._vertical.lines = that._createLines(verticalOptions.line, "h", that._verticalGroup);
                    that._vertical.labels = that._createLabels(that._axes[0], verticalOptions, false, that._verticalGroup)
                }
                if (horizontalOptions.visible) {
                    that._horizontal.lines = that._createLines(horizontalOptions.line, "v", that._horizontalGroup);
                    that._horizontal.labels = that._createLabels(that._axes[1], horizontalOptions, true, that._horizontalGroup)
                }
                if (verticalOptions.visible || horizontalOptions.visible)
                    that._circle = renderer.circle(canvas.left, canvas.top, 0).attr(circleOptions).append(that._crosshairGroup)
            },
            _createLabels: function(axes, options, isHorizontal, group) {
                var that = this,
                    canvas = that._canvas,
                    renderer = that._renderer,
                    x,
                    y,
                    text,
                    labels = [],
                    background,
                    curentLabelPos,
                    bbox;
                if (!options.label || !options.label.visible)
                    return;
                $.each(axes, function(_, axis) {
                    var axisOptions = axis.getOptions(),
                        position = axisOptions.position;
                    if (axis._virtual || axisOptions.stubData)
                        return;
                    curentLabelPos = axis.getCurrentLabelPos();
                    if (isHorizontal) {
                        y = canvas.top;
                        x = curentLabelPos
                    }
                    else {
                        x = canvas.left;
                        y = curentLabelPos
                    }
                    text = renderer.text("0", x, y).css(DX.viz.core.utils.patchFontOptions(options.label.font)).attr({align: position === TOP || position === BOTTOM ? CENTER : position === RIGHT ? LEFT : RIGHT}).append(group);
                    bbox = text.getBBox();
                    text.attr({y: isHorizontal ? 2 * y - bbox.y - bbox.height / 2 : position === BOTTOM ? 2 * y - bbox.y : 2 * y - (bbox.y + bbox.height)});
                    background = renderer.rect(0, 0, 0, 0).attr({fill: options.label.backgroundColor || options.line.stroke}).append(group).toBackground();
                    labels.push({
                        text: text,
                        background: background,
                        axis: axis,
                        pos: {
                            coord: curentLabelPos,
                            side: position
                        }
                    })
                });
                return labels
            },
            _updateText: function(coord, labels) {
                var that = this,
                    bbox,
                    text,
                    textElement,
                    position,
                    backgroundElement;
                if (!labels)
                    return;
                $.each(labels, function(i, label) {
                    textElement = label.text;
                    backgroundElement = label.background;
                    if (!textElement)
                        return;
                    text = label.axis.getUntranslatedValue(coord);
                    if (_isDefined(text)) {
                        textElement.attr({text: text});
                        bbox = textElement.getBBox();
                        that._updateLinesCanvas(label.pos.side, label.pos.coord);
                        backgroundElement.attr({
                            x: bbox.x - LABEL_BACKGROUND_PADDING_X,
                            y: bbox.y - LABEL_BACKGROUND_PADDING_Y,
                            width: bbox.width + LABEL_BACKGROUND_PADDING_X * 2,
                            height: bbox.height + LABEL_BACKGROUND_PADDING_Y * 2
                        })
                    }
                    else {
                        textElement.attr({text: ""});
                        backgroundElement.attr({
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0
                        })
                    }
                })
            },
            show: function() {
                this._crosshairGroup.attr({visibility: "visible"})
            },
            hide: function() {
                this._crosshairGroup.attr({visibility: "hidden"})
            },
            _updateLinesCanvas: function(position, labelPosition) {
                var coords = this._linesCanvas,
                    canvas = this._canvas;
                coords[position] = coords[position] !== canvas[position] && mathAbs(coords[position] - canvas[position]) < mathAbs(labelPosition - canvas[position]) ? coords[position] : labelPosition
            },
            _updateLines: function(lines, x, y, r, isHorizontal) {
                var coords = this._linesCanvas,
                    canvas = this._canvas,
                    points = isHorizontal ? [[mathMin(x - r, coords.left), canvas.top, x - r, canvas.top], [x + r, canvas.top, mathMax(coords.right, x + r), canvas.top]] : [[canvas.left, mathMin(coords.top, y - r), canvas.left, y - r], [canvas.left, y + r, canvas.left, mathMax(coords.bottom, y + r)]];
                for (var i = 0; i < 2; i++)
                    lines[i].attr({points: points[i]})
            },
            _resetLinesCanvas: function() {
                var canvas = this._canvas;
                this._linesCanvas = {
                    left: canvas.left,
                    right: canvas.right,
                    top: canvas.top,
                    bottom: canvas.bottom
                }
            },
            _getClipRectForPane: function(x, y) {
                var panes = this._panes,
                    i,
                    coords;
                for (i = 0; i < panes.length; i++) {
                    coords = panes[i].coords;
                    if (coords.left <= x && coords.right >= x && coords.top <= y && coords.bottom >= y)
                        return panes[i].clipRect
                }
                return {id: null}
            },
            shift: function(x, y, r) {
                var that = this,
                    horizontal = that._horizontal,
                    vertical = that._vertical,
                    clipRect,
                    rad = !r ? 0 : r + 3,
                    canvas = that._canvas;
                if (x >= canvas.left && x <= canvas.right && y >= canvas.top && y <= canvas.bottom) {
                    that.show();
                    that._resetLinesCanvas();
                    clipRect = that._getClipRectForPane(x, y);
                    that._circle.attr({
                        cx: x,
                        cy: y,
                        r: rad,
                        clipId: clipRect.id
                    });
                    if (horizontal.lines) {
                        that._updateText(y, horizontal.labels);
                        that._updateLines(horizontal.lines, x, y, rad, true);
                        that._horizontalGroup.attr({translateY: y - canvas.top})
                    }
                    if (vertical.lines) {
                        that._updateText(x, vertical.labels);
                        that._updateLines(vertical.lines, x, y, rad, false);
                        that._verticalGroup.attr({translateX: x - canvas.left})
                    }
                }
                else
                    that.hide()
            }
        }
    })(jQuery, DevExpress);
    DevExpress.MOD_VIZ_CHARTS = true
}