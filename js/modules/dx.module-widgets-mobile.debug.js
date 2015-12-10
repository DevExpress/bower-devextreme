/*! 
* DevExtreme (Mobile Widgets)
* Version: 15.2.4
* Build date: Dec 8, 2015
*
* Copyright (c) 2012 - 2015 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!window.DevExpress || !DevExpress.MOD_WIDGETS_MOBILE) {
    if (!window.DevExpress || !DevExpress.MOD_WIDGETS_BASE)
        throw Error('Required module is not referenced: widgets-base');
    /*! Module widgets-mobile, file ui.pivotTabs.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            fx = DX.fx,
            translator = DX.require("/utils/utils.translator"),
            registerComponent = DX.require("/componentRegistrator"),
            eventUtils = DX.require("/ui/events/ui.events.utils");
        var PIVOT_TABS_CLASS = "dx-pivottabs",
            PIVOT_TAB_CLASS = "dx-pivottabs-tab",
            PIVOT_TAB_SELECTED_CLASS = "dx-pivottabs-tab-selected",
            PIVOT_GHOST_TAB_CLASS = "dx-pivottabs-ghosttab",
            PIVOT_TAB_DATA_KEY = "dxPivotTabData",
            PIVOT_TAB_MOVE_DURATION = 200,
            PIVOT_TAB_MOVE_EASING = "cubic-bezier(.40, .80, .60, 1)";
        var animation = {
                moveTo: function($tab, position, completeAction) {
                    return fx.animate($tab, {
                            type: "slide",
                            to: {left: position},
                            duration: PIVOT_TAB_MOVE_DURATION,
                            easing: PIVOT_TAB_MOVE_EASING,
                            complete: completeAction
                        })
                },
                slideAppear: function($tab, position) {
                    return fx.animate($tab, {
                            type: "slide",
                            to: {
                                left: position,
                                opacity: 1
                            },
                            duration: PIVOT_TAB_MOVE_DURATION,
                            easing: PIVOT_TAB_MOVE_EASING
                        })
                },
                slideDisappear: function($tab, position) {
                    return fx.animate($tab, {
                            type: "slide",
                            to: {
                                left: position,
                                opacity: 0
                            },
                            duration: PIVOT_TAB_MOVE_DURATION,
                            easing: PIVOT_TAB_MOVE_EASING
                        })
                },
                complete: function(elements) {
                    if (!elements)
                        return;
                    $.each(elements, function(_, $element) {
                        fx.stop($element, true)
                    })
                },
                stop: function(elements) {
                    if (!elements)
                        return;
                    $.each(elements, function(_, $element) {
                        fx.stop($element)
                    })
                }
            };
        registerComponent("dxPivotTabs", ui, ui.CollectionWidget.inherit({
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                        selectedIndex: 0,
                        onPrepare: null,
                        onUpdatePosition: null,
                        onRollback: null,
                        focusStateEnabled: false,
                        selectionMode: "single",
                        selectionRequired: true,
                        swipeEnabled: true
                    })
            },
            _itemClass: function() {
                return PIVOT_TAB_CLASS
            },
            _itemDataKey: function() {
                return PIVOT_TAB_DATA_KEY
            },
            _itemContainer: function() {
                return this.element()
            },
            _elementWidth: function() {
                if (!this._elementWidthCache)
                    this._elementWidthCache = this.element().width();
                return this._elementWidthCache
            },
            _clearElementWidthCache: function() {
                delete this._elementWidthCache
            },
            _itemWidths: function() {
                if (!this._itemWidthsCache) {
                    var $tabs = this._itemElements(),
                        widths = [];
                    $tabs.each(function() {
                        widths.push($(this).outerWidth())
                    });
                    this._itemWidthsCache = widths
                }
                return this._itemWidthsCache
            },
            _init: function() {
                this.callBase();
                this._initGhostTab();
                this._initSwipeHandlers();
                this._initActions()
            },
            _dimensionChanged: function() {
                this._clearElementWidthCache();
                this._cleanPositionCache();
                this._updateTabsPositions()
            },
            _initGhostTab: function() {
                this._$ghostTab = $("<div>").addClass(PIVOT_GHOST_TAB_CLASS)
            },
            _initActions: function() {
                this._updatePositionAction = this._createActionByOption("onUpdatePosition");
                this._rollbackAction = this._createActionByOption("onRollback");
                this._prepareAction = this._createActionByOption("onPrepare")
            },
            _render: function() {
                this.element().addClass(PIVOT_TABS_CLASS);
                this.callBase();
                this._renderGhostTab()
            },
            _renderGhostTab: function() {
                this._itemContainer().append(this._$ghostTab);
                this._toggleGhostTab(false)
            },
            _toggleGhostTab: function(visible) {
                var $ghostTab = this._$ghostTab;
                if (visible) {
                    this._updateGhostTabContent();
                    $ghostTab.css("opacity", 1)
                }
                else
                    $ghostTab.css("opacity", 0)
            },
            _isGhostTabVisible: function() {
                return this._$ghostTab.css("opacity") === "1"
            },
            _updateGhostTabContent: function(prevIndex) {
                prevIndex = prevIndex === undefined ? this._previousIndex() : prevIndex;
                var $ghostTab = this._$ghostTab,
                    $items = this._itemElements();
                $ghostTab.html($items.eq(prevIndex).html())
            },
            _updateTabsPositions: function(offset) {
                offset = this._applyOffsetBoundaries(offset);
                var isPrevSwipeHandled = this.option("rtlEnabled") ^ offset > 0 && offset !== 0,
                    tabPositions = this._calculateTabPositions(isPrevSwipeHandled ? "replace" : "append");
                this._moveTabs(tabPositions, offset);
                this._toggleGhostTab(isPrevSwipeHandled)
            },
            _moveTabs: function(positions, offset) {
                offset = offset || 0;
                var $tabs = this._allTabElements();
                $tabs.each(function(index) {
                    translator.move($(this), {left: positions[index] + offset})
                })
            },
            _applyOffsetBoundaries: function(offset) {
                offset = offset || 0;
                var maxOffset = offset > 0 ? this._maxRightOffset : this._maxLeftOffset;
                return offset * maxOffset
            },
            _animateRollback: function() {
                var that = this,
                    $tabs = this._itemElements(),
                    positions = this._calculateTabPositions("prepend");
                if (this._isGhostTabVisible()) {
                    this._swapGhostWithTab($tabs.eq(this._previousIndex()));
                    animation.moveTo(this._$ghostTab, positions[this._indexBoundary()], function() {
                        that._toggleGhostTab(false)
                    })
                }
                $tabs.each(function(index) {
                    animation.moveTo($(this), positions[index])
                })
            },
            _animateComplete: function(newIndex, currentIndex) {
                var $tabs = this._itemElements(),
                    isPrevSwipeHandled = this._isGhostTabVisible();
                $tabs.eq(currentIndex).removeClass(PIVOT_TAB_SELECTED_CLASS);
                if (isPrevSwipeHandled)
                    this._animateIndexDecreasing(newIndex);
                else
                    this._animateIndexIncreasing(newIndex);
                $tabs.eq(newIndex).addClass(PIVOT_TAB_SELECTED_CLASS)
            },
            _animateIndexDecreasing: function(newIndex) {
                var $tabs = this._itemElements(),
                    positions = this._calculateTabPositions("append", newIndex),
                    animations = [];
                $tabs.each(function(index) {
                    animations.push(animation.moveTo($(this), positions[index]))
                });
                animations.push(animation.slideDisappear(this._$ghostTab, positions[this._indexBoundary()]));
                return $.when.apply($, animations)
            },
            _animateIndexIncreasing: function(newIndex) {
                var that = this,
                    $tabs = this._itemElements(),
                    positions = this._calculateTabPositions("prepend", newIndex),
                    previousIndex = this._previousIndex(newIndex),
                    $prevTab = $tabs.eq(previousIndex),
                    prevTabPosition = translator.locate($prevTab).left,
                    rtl = this.option("rtlEnabled"),
                    bound = rtl ? this._elementWidth() - this._itemWidths()[previousIndex] : 0,
                    isNextSwipeHandled = (prevTabPosition - bound) * this._getRTLSignCorrection() < 0,
                    animations = [];
                if (!isNextSwipeHandled)
                    this._moveTabs(this._calculateTabPositions("append", previousIndex));
                this._updateGhostTabContent(previousIndex);
                this._swapGhostWithTab($tabs.eq(previousIndex));
                $tabs.each(function(index) {
                    var $tab = $(this),
                        newPosition = positions[index];
                    animations.push(index === previousIndex ? animation.slideAppear($tab, newPosition) : animation.moveTo($tab, newPosition))
                });
                animations.push(animation.moveTo(this._$ghostTab, positions[this._indexBoundary()], function() {
                    that._toggleGhostTab(false)
                }));
                return $.when.apply($, animations)
            },
            _swapGhostWithTab: function($tab) {
                var $ghostTab = this._$ghostTab,
                    lastTabPosition = translator.locate($tab).left,
                    lastTabOpacity = $tab.css("opacity");
                translator.move($tab, {left: translator.locate($ghostTab).left});
                $tab.css("opacity", $ghostTab.css("opacity"));
                translator.move($ghostTab, {left: lastTabPosition});
                $ghostTab.css("opacity", lastTabOpacity)
            },
            _calculateTabPositions: function(ghostPosition, index) {
                index = index === undefined ? this.option("selectedIndex") : index;
                var mark = index + ghostPosition;
                if (this._calculetedPositionsMark !== mark) {
                    this._calculetedPositions = this._calculateTabPositionsImpl(index, ghostPosition);
                    this._calculetedPositionsMark = mark
                }
                return this._calculetedPositions
            },
            _calculateTabPositionsImpl: function(currentIndex, ghostPosition) {
                var prevIndex = this._normalizeIndex(currentIndex - 1),
                    widths = this._itemWidths();
                var rtl = this.option("rtlEnabled"),
                    signCorrection = this._getRTLSignCorrection(),
                    tabsContainerWidth = this._elementWidth(),
                    nextPosition = rtl ? tabsContainerWidth : 0,
                    positions = [];
                var calculateTabPosition = function(currentIndex, width) {
                        var rtlOffset = rtl * width;
                        positions.splice(currentIndex, 0, nextPosition - rtlOffset);
                        nextPosition += width * signCorrection
                    };
                $.each(widths.slice(currentIndex), calculateTabPosition);
                $.each(widths.slice(0, currentIndex), calculateTabPosition);
                switch (ghostPosition) {
                    case"replace":
                        var lastTabPosition = positions[prevIndex];
                        positions.splice(prevIndex, 1, rtl ? tabsContainerWidth : -widths[prevIndex]);
                        positions.push(lastTabPosition);
                        break;
                    case"prepend":
                        positions.push(rtl ? tabsContainerWidth : -widths[prevIndex]);
                        break;
                    case"append":
                        positions.push(nextPosition - widths[currentIndex] * rtl);
                        break
                }
                return positions
            },
            _allTabElements: function() {
                return this._itemContainer().find("." + PIVOT_TAB_CLASS + ", ." + PIVOT_GHOST_TAB_CLASS)
            },
            _initSwipeHandlers: function() {
                this.element().on(eventUtils.addNamespace("dxswipestart", this.NAME), {itemSizeFunc: $.proxy(this._elementWidth, this)}, $.proxy(this._swipeStartHandler, this)).on(eventUtils.addNamespace("dxswipe", this.NAME), $.proxy(this._swipeUpdateHandler, this)).on(eventUtils.addNamespace("dxswipeend", this.NAME), $.proxy(this._swipeEndHandler, this))
            },
            _swipeStartHandler: function(e) {
                this._prepareAnimation();
                this._prepareAction();
                e.maxLeftOffset = 1;
                e.maxRightOffset = 1;
                if (DX.designMode || this.option("disabled") || !this.option("swipeEnabled") || this._indexBoundary() <= 1)
                    e.cancel = true;
                else
                    this._swipeGestureRunning = true
            },
            _prepareAnimation: function() {
                this._stopAnimation()
            },
            _stopAnimation: function() {
                animation.complete(this._allTabElements())
            },
            _swipeUpdateHandler: function(e) {
                var offset = e.offset;
                this._updateTabsPositions(offset);
                this._updatePositionAction({offset: offset})
            },
            _swipeEndHandler: function(e) {
                var targetOffset = e.targetOffset * this._getRTLSignCorrection();
                if (targetOffset === 0) {
                    this._animateRollback();
                    this._rollbackAction()
                }
                else {
                    var newIndex = this._normalizeIndex(this.option("selectedIndex") - targetOffset);
                    this.option("selectedIndex", newIndex)
                }
                this._swipeGestureRunning = false
            },
            _previousIndex: function(atIndex) {
                atIndex = atIndex === undefined ? this.option("selectedIndex") : atIndex;
                return this._normalizeIndex(atIndex - 1)
            },
            _normalizeIndex: function(index) {
                var boundary = this._indexBoundary();
                if (index < 0)
                    index = boundary + index;
                if (index >= boundary)
                    index = index - boundary;
                return index
            },
            _indexBoundary: function() {
                return this.option("items").length
            },
            _renderSelection: function(current) {
                this._calculateMaxOffsets(current);
                this._updateTabsPositions();
                this._itemElements().eq(current).addClass(PIVOT_TAB_SELECTED_CLASS)
            },
            _updateSelection: function(addedItems, removedItems) {
                var newIndex = addedItems[0],
                    oldIndex = removedItems[0];
                this._calculateMaxOffsets(newIndex);
                if (!this._swipeGestureRunning)
                    this._prepareAnimation();
                if (this._itemElements().length)
                    this._animateComplete(newIndex, oldIndex)
            },
            _calculateMaxOffsets: function(index) {
                var currentTabWidth = this._itemWidths()[index],
                    prevTabWidth = this._itemWidths()[this._previousIndex(index)],
                    rtl = this.option("rtlEnabled");
                this._maxLeftOffset = rtl ? prevTabWidth : currentTabWidth;
                this._maxRightOffset = rtl ? currentTabWidth : prevTabWidth
            },
            _getRTLSignCorrection: function() {
                return this.option("rtlEnabled") ? -1 : 1
            },
            _visibilityChanged: function(visible) {
                if (visible)
                    this._dimensionChanged()
            },
            _clean: function() {
                animation.stop(this._allTabElements());
                this._clearElementWidthCache();
                this._cleanPositionCache();
                this.callBase()
            },
            _cleanPositionCache: function() {
                delete this._itemWidthsCache;
                delete this._calculetedPositionsMark
            },
            _optionChanged: function(args) {
                switch (args.name) {
                    case"items":
                    case"rtlEnabled":
                        this._cleanPositionCache();
                        this.callBase(args);
                        break;
                    case"onPrepare":
                    case"swipeEnabled":
                        break;
                    case"onUpdatePosition":
                    case"onRollback":
                        this._initActions();
                        break;
                    default:
                        this.callBase(args)
                }
            },
            prepare: function() {
                this._prepareAnimation()
            },
            updatePosition: function(offset) {
                this._updateTabsPositions(offset)
            },
            rollback: function() {
                this._animateRollback()
            }
        }));
        ui.dxPivotTabs.__internals = {animation: animation}
    })(jQuery, DevExpress);
    /*! Module widgets-mobile, file ui.pivot.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            fx = DX.fx,
            translator = DX.require("/utils/utils.translator"),
            domUtils = DX.require("/utils/utils.dom"),
            commonUtils = DX.require("/utils/utils.common"),
            registerComponent = DX.require("/componentRegistrator"),
            eventUtils = DX.require("/ui/events/ui.events.utils");
        var PIVOT_CLASS = "dx-pivot",
            PIVOT_AUTOHEIGHT_CLASS = "dx-pivot-autoheight",
            PIVOT_WRAPPER_CLASS = "dx-pivot-wrapper",
            PIVOT_TABS_CONTAINER_CLASS = "dx-pivottabs-container",
            PIVOT_ITEM_CONTAINER_CLASS = "dx-pivot-itemcontainer",
            PIVOT_ITEM_WRAPPER_CLASS = "dx-pivot-itemwrapper",
            PIVOT_ITEM_CLASS = "dx-pivot-item",
            PIVOT_ITEM_HIDDEN_CLASS = "dx-pivot-item-hidden",
            PIVOT_ITEM_DATA_KEY = "dxPivotItemData",
            PIVOT_RETURN_BACK_DURATION = 200,
            PIVOT_SLIDE_AWAY_DURATION = 50,
            PIVOT_SLIDE_BACK_DURATION = 250,
            PIVOT_SLIDE_BACK_EASING = "cubic-bezier(.10, 1, 0, 1)";
        var animation = {
                returnBack: function($element) {
                    fx.animate($element, {
                        type: "slide",
                        to: {left: 0},
                        duration: PIVOT_RETURN_BACK_DURATION
                    })
                },
                slideAway: function($element, position, complete) {
                    fx.animate($element, {
                        type: "slide",
                        to: {left: position},
                        duration: PIVOT_SLIDE_AWAY_DURATION,
                        complete: complete
                    })
                },
                slideBack: function($element) {
                    fx.animate($element, {
                        type: "slide",
                        to: {left: 0},
                        easing: PIVOT_SLIDE_BACK_EASING,
                        duration: PIVOT_SLIDE_BACK_DURATION
                    })
                },
                complete: function($element) {
                    fx.stop($element, true)
                }
            };
        registerComponent("dxPivot", ui, ui.CollectionWidget.inherit({
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                        selectedIndex: 0,
                        swipeEnabled: true,
                        itemTitleTemplate: "title",
                        contentTemplate: "content",
                        focusStateEnabled: false,
                        selectionMode: "single",
                        selectionRequired: true,
                        selectionByClick: false
                    })
            },
            _itemClass: function() {
                return PIVOT_ITEM_CLASS
            },
            _itemDataKey: function() {
                return PIVOT_ITEM_DATA_KEY
            },
            _itemContainer: function() {
                return this._$itemWrapper
            },
            _elementWidth: function() {
                if (!this._elementWidthCache)
                    this._elementWidthCache = this.element().width();
                return this._elementWidthCache
            },
            _clearElementWidthCache: function() {
                delete this._elementWidthCache
            },
            _init: function() {
                this.callBase();
                this.element().addClass(PIVOT_CLASS);
                this._initWrapper();
                this._initTabs();
                this._initItemContainer();
                this._clearItemsCache();
                this._initSwipeHandlers()
            },
            _dimensionChanged: function() {
                this._clearElementWidthCache()
            },
            _initWrapper: function() {
                this._$wrapper = $("<div>").addClass(PIVOT_WRAPPER_CLASS).appendTo(this.element())
            },
            _initItemContainer: function() {
                var $itemContainer = $("<div>").addClass(PIVOT_ITEM_CONTAINER_CLASS);
                this._$wrapper.append($itemContainer);
                this._$itemWrapper = $("<div>").addClass(PIVOT_ITEM_WRAPPER_CLASS);
                $itemContainer.append(this._$itemWrapper)
            },
            _clearItemsCache: function() {
                this._itemsCache = []
            },
            _initTabs: function() {
                var that = this,
                    $tabsContainer = $("<div>").addClass(PIVOT_TABS_CONTAINER_CLASS);
                this._$wrapper.append($tabsContainer);
                this._tabs = this._createComponent($tabsContainer, "dxPivotTabs", {
                    itemTemplateProperty: "titleTemplate",
                    itemTemplate: this._getTemplateByOption("itemTitleTemplate"),
                    items: this.option("items"),
                    selectedIndex: this.option("selectedIndex"),
                    onPrepare: function() {
                        that._prepareAnimation()
                    },
                    onUpdatePosition: function(args) {
                        that._updateContentPosition(args.offset)
                    },
                    onRollback: function() {
                        that._animateRollback()
                    },
                    onSelectionChanged: function(args) {
                        that.option("selectedItem", args.addedItems[0])
                    },
                    swipeEnabled: this.option("swipeEnabled")
                })
            },
            _render: function() {
                this._renderContentTemplate();
                this.callBase();
                var selectedIndex = this.option("selectedIndex");
                this._renderCurrentContent(selectedIndex, selectedIndex)
            },
            _renderContentTemplate: function() {
                if (commonUtils.isDefined(this._singleContent))
                    return;
                this._getTemplateByOption("contentTemplate").render(this._$itemWrapper);
                this._singleContent = !this._$itemWrapper.is(":empty")
            },
            _renderDimensions: function() {
                this.callBase();
                this.element().toggleClass(PIVOT_AUTOHEIGHT_CLASS, this.option("height") === "auto")
            },
            _visibilityChanged: function(visible) {
                if (visible)
                    this._tabs._dimensionChanged()
            },
            _renderCurrentContent: function(currentIndex, previousIndex) {
                var itemsCache = this._itemsCache;
                itemsCache[previousIndex] = this._selectedItemElement();
                var $hidingItem = itemsCache[previousIndex],
                    $showingItem = itemsCache[currentIndex];
                domUtils.triggerHidingEvent($hidingItem);
                $hidingItem.addClass(PIVOT_ITEM_HIDDEN_CLASS);
                if ($showingItem) {
                    $showingItem.removeClass(PIVOT_ITEM_HIDDEN_CLASS);
                    domUtils.triggerShownEvent($showingItem)
                }
                else
                    this._renderContent();
                this._selectionChangePromise && this._selectionChangePromise.resolve();
                this._selectionChangePromise = $.Deferred()
            },
            _updateContentPosition: function(offset) {
                translator.move(this._$itemWrapper, {left: this._calculatePixelOffset(offset)})
            },
            _animateRollback: function() {
                animation.returnBack(this._$itemWrapper)
            },
            _animateComplete: function(newIndex, currentIndex) {
                var $itemWrapper = this._$itemWrapper,
                    rtlSignCorrection = this._getRTLSignCorrection(),
                    intermediatePosition = this._elementWidth() * (this._isPrevSwipeHandled() ? 1 : -1) * rtlSignCorrection;
                animation.slideAway($itemWrapper, intermediatePosition, $.proxy(function() {
                    translator.move($itemWrapper, {left: -intermediatePosition});
                    this._renderCurrentContent(newIndex, currentIndex)
                }, this));
                animation.slideBack($itemWrapper)
            },
            _calculatePixelOffset: function(offset) {
                offset = offset || 0;
                return offset * this._elementWidth()
            },
            _isPrevSwipeHandled: function() {
                var wrapperOffset = translator.locate(this._$itemWrapper).left,
                    rtl = this.option("rtlEnabled");
                return rtl ^ wrapperOffset > 0 && wrapperOffset !== 0
            },
            _initSwipeHandlers: function() {
                this.element().on(eventUtils.addNamespace("dxswipestart", this.NAME), {itemSizeFunc: $.proxy(this._elementWidth, this)}, $.proxy(this._swipeStartHandler, this)).on(eventUtils.addNamespace("dxswipe", this.NAME), $.proxy(this._swipeUpdateHandler, this)).on(eventUtils.addNamespace("dxswipeend", this.NAME), $.proxy(this._swipeEndHandler, this))
            },
            _swipeStartHandler: function(e) {
                this._prepareAnimation();
                this._tabs.prepare();
                if (DX.designMode || this.option("disabled") || !this.option("swipeEnabled") || this._indexBoundary() <= 1)
                    e.cancel = true;
                else
                    this._swipeGestureRunning = true;
                e.maxLeftOffset = 1;
                e.maxRightOffset = 1
            },
            _prepareAnimation: function() {
                this._stopAnimation()
            },
            _stopAnimation: function() {
                animation.complete(this._$itemWrapper)
            },
            _swipeUpdateHandler: function(e) {
                var offset = e.offset;
                this._updateContentPosition(offset);
                this._tabs.updatePosition(offset)
            },
            _swipeEndHandler: function(e) {
                var targetOffset = e.targetOffset * this._getRTLSignCorrection();
                if (targetOffset === 0) {
                    this._animateRollback();
                    this._tabs.rollback()
                }
                else {
                    var newIndex = this._normalizeIndex(this.option("selectedIndex") - targetOffset);
                    this.option("selectedIndex", newIndex)
                }
                this._swipeGestureRunning = false
            },
            _normalizeIndex: function(index) {
                var boundary = this._indexBoundary();
                if (index < 0)
                    index = boundary + index;
                if (index >= boundary)
                    index = index - boundary;
                return index
            },
            _indexBoundary: function() {
                return this.option("items").length
            },
            _renderContentImpl: function() {
                if (this._singleContent)
                    return;
                var items = this.option("items"),
                    selectedIndex = this.option("selectedIndex");
                if (items.length)
                    this._renderItems([items[selectedIndex]])
            },
            _selectedItemElement: function() {
                return this._$itemWrapper.children("." + PIVOT_ITEM_CLASS + ":not(." + PIVOT_ITEM_HIDDEN_CLASS + ")")
            },
            _getRTLSignCorrection: function() {
                return this.option("rtlEnabled") ? -1 : 1
            },
            _clean: function() {
                animation.complete(this._$itemWrapper);
                this.callBase()
            },
            _cleanItemContainer: function() {
                if (this._singleContent)
                    return;
                this.callBase()
            },
            _refresh: function() {
                this._tabs._refresh();
                this.callBase()
            },
            _updateSelection: function(addedItems, removedItems) {
                var newIndex = addedItems[0],
                    oldIndex = removedItems[0];
                if (!this._swipeGestureRunning)
                    this._prepareAnimation();
                this._animateComplete(newIndex, oldIndex);
                this._tabs.option("selectedIndex", newIndex)
            },
            _optionChanged: function(args) {
                var value = args.value;
                switch (args.name) {
                    case"disabled":
                        this._tabs.option("disabled", value);
                        this.callBase(args);
                        break;
                    case"items":
                        this._tabs.option("items", value);
                        this._clearItemsCache();
                        this.callBase(args);
                        break;
                    case"rtlEnabled":
                        this._tabs.option("rtlEnabled", value);
                        this._clearItemsCache();
                        this.callBase(args);
                        break;
                    case"itemTitleTemplate":
                        this._tabs.option("itemTemplate", this._getTemplate(value));
                        break;
                    case"swipeEnabled":
                        this._tabs.option("swipeEnabled", value);
                        break;
                    case"contentTemplate":
                        this._singleContent = null;
                        this._invalidate();
                        break;
                    default:
                        this.callBase(args)
                }
            }
        }));
        ui.dxPivot.__internals = {animation: animation}
    })(jQuery, DevExpress);
    /*! Module widgets-mobile, file ui.actionSheet.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            support = DX.require("/utils/utils.support"),
            registerComponent = DX.require("/componentRegistrator"),
            Button = DX.require("/ui/widgets/ui.button");
        var ACTION_SHEET_CLASS = "dx-actionsheet",
            ACTION_SHEET_CONTAINER_CLASS = "dx-actionsheet-container",
            ACTION_SHEET_POPUP_WRAPPER_CLASS = "dx-actionsheet-popup-wrapper",
            ACTION_SHEET_POPOVER_WRAPPER_CLASS = "dx-actionsheet-popover-wrapper",
            ACTION_SHEET_CANCEL_BUTTON_CLASS = "dx-actionsheet-cancel",
            ACTION_SHEET_ITEM_CLASS = "dx-actionsheet-item",
            ACTION_SHEET_ITEM_DATA_KEY = "dxActionSheetItemData",
            ACTION_SHEET_WITHOUT_TITLE_CLASS = "dx-actionsheet-without-title";
        registerComponent("dxActionSheet", ui, ui.CollectionWidget.inherit({
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                        usePopover: false,
                        target: null,
                        title: "",
                        showTitle: true,
                        showCancelButton: true,
                        cancelText: Globalize.localize("Cancel"),
                        onCancelClick: null,
                        visible: false,
                        noDataText: "",
                        focusStateEnabled: false,
                        selectionByClick: false
                    })
            },
            _defaultOptionsRules: function() {
                return this.callBase().concat([{
                            device: {
                                platform: "ios",
                                tablet: true
                            },
                            options: {usePopover: true}
                        }])
            },
            _itemContainer: function() {
                return this._$itemContainer
            },
            _itemClass: function() {
                return ACTION_SHEET_ITEM_CLASS
            },
            _itemDataKey: function() {
                return ACTION_SHEET_ITEM_DATA_KEY
            },
            _toggleVisibility: $.noop,
            _renderDimensions: $.noop,
            _render: function() {
                this.element().addClass(ACTION_SHEET_CLASS);
                this._createItemContainer();
                this._renderPopup()
            },
            _createItemContainer: function() {
                this._$itemContainer = $("<div>").addClass(ACTION_SHEET_CONTAINER_CLASS);
                this._renderDisabled()
            },
            _renderDisabled: function() {
                this._$itemContainer.toggleClass("dx-state-disabled", this.option("disabled"))
            },
            _renderPopup: function() {
                this._$popup = $("<div>").appendTo(this.element());
                this._isPopoverMode() ? this._createPopover() : this._createPopup();
                this._renderPopupTitle();
                this._mapPopupOption("visible")
            },
            _mapPopupOption: function(optionName) {
                this._popup.option(optionName, this.option(optionName))
            },
            _isPopoverMode: function() {
                return this.option("usePopover") && this.option("target")
            },
            _renderPopupTitle: function() {
                this._mapPopupOption("showTitle");
                this._popup._wrapper().toggleClass(ACTION_SHEET_WITHOUT_TITLE_CLASS, !this.option("showTitle"))
            },
            _clean: function() {
                if (this._$popup)
                    this._$popup.remove();
                this.callBase()
            },
            _overlayConfig: function() {
                return {
                        onInitialized: $.proxy(function(args) {
                            this._popup = args.component
                        }, this),
                        disabled: false,
                        showTitle: true,
                        title: this.option("title"),
                        deferRendering: !support.hasNg,
                        onContentReady: $.proxy(this._popupContentReadyAction, this),
                        onHidden: $.proxy(this.hide, this)
                    }
            },
            _createPopover: function() {
                this._createComponent(this._$popup, "dxPopover", $.extend(this._overlayConfig(), {
                    width: this.option("width") || 200,
                    height: this.option("height") || "auto",
                    target: this.option("target")
                }));
                this._popup._wrapper().addClass(ACTION_SHEET_POPOVER_WRAPPER_CLASS)
            },
            _createPopup: function() {
                this._createComponent(this._$popup, "dxPopup", $.extend(this._overlayConfig(), {
                    dragEnabled: false,
                    width: this.option("width") || "100%",
                    height: this.option("height") || "auto",
                    showCloseButton: false,
                    position: {
                        my: "bottom",
                        at: "bottom",
                        of: window
                    },
                    animation: {
                        show: {
                            type: "slide",
                            duration: 400,
                            from: {position: {
                                    my: "top",
                                    at: "bottom",
                                    of: window
                                }},
                            to: {position: {
                                    my: "bottom",
                                    at: "bottom",
                                    of: window
                                }}
                        },
                        hide: {
                            type: "slide",
                            duration: 400,
                            from: {position: {
                                    my: "bottom",
                                    at: "bottom",
                                    of: window
                                }},
                            to: {position: {
                                    my: "top",
                                    at: "bottom",
                                    of: window
                                }}
                        }
                    }
                }));
                this._popup._wrapper().addClass(ACTION_SHEET_POPUP_WRAPPER_CLASS)
            },
            _popupContentReadyAction: function() {
                this._popup.content().append(this._$itemContainer);
                this._attachClickEvent();
                this._attachHoldEvent();
                this._renderContent();
                this._renderCancelButton()
            },
            _renderCancelButton: function() {
                if (this._isPopoverMode())
                    return;
                if (this._$cancelButton)
                    this._$cancelButton.remove();
                if (this.option("showCancelButton")) {
                    var cancelClickAction = this._createActionByOption("onCancelClick") || $.noop,
                        that = this;
                    this._$cancelButton = $("<div>").addClass(ACTION_SHEET_CANCEL_BUTTON_CLASS).appendTo(this._popup.content());
                    this._createComponent(this._$cancelButton, Button, {
                        disabled: false,
                        text: this.option("cancelText"),
                        onClick: function(e) {
                            var hidingArgs = {
                                    jQueryEvent: e,
                                    cancel: false
                                };
                            cancelClickAction(hidingArgs);
                            if (!hidingArgs.cancel)
                                that.hide()
                        },
                        _templates: {}
                    })
                }
            },
            _attachItemClickEvent: $.noop,
            _itemClickHandler: function(e) {
                this.callBase(e);
                if (!$(e.target).is(".dx-state-disabled, .dx-state-disabled *"))
                    this.hide()
            },
            _itemHoldHandler: function(e) {
                this.callBase(e);
                if (!$(e.target).is(".dx-state-disabled, .dx-state-disabled *"))
                    this.hide()
            },
            _optionChanged: function(args) {
                switch (args.name) {
                    case"width":
                    case"height":
                    case"visible":
                    case"title":
                        this._mapPopupOption(args.name);
                        break;
                    case"disabled":
                        this._renderDisabled();
                        break;
                    case"showTitle":
                        this._renderPopupTitle();
                        break;
                    case"showCancelButton":
                    case"onCancelClick":
                    case"cancelText":
                        this._renderCancelButton();
                        break;
                    case"target":
                    case"usePopover":
                    case"items":
                        this._invalidate();
                        break;
                    default:
                        this.callBase(args)
                }
            },
            toggle: function(showing) {
                var that = this,
                    d = $.Deferred();
                that._popup.toggle(showing).done(function() {
                    that.option("visible", showing);
                    d.resolveWith(that)
                });
                return d.promise()
            },
            show: function() {
                return this.toggle(true)
            },
            hide: function() {
                return this.toggle(false)
            }
        }))
    })(jQuery, DevExpress);
    /*! Module widgets-mobile, file ui.panorama.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            fx = DX.fx,
            translator = DX.require("/utils/utils.translator"),
            Class = DevExpress.require("/class"),
            abstract = Class.abstract,
            registerComponent = DX.require("/componentRegistrator"),
            eventUtils = DX.require("/ui/events/ui.events.utils");
        var PANORAMA_CLASS = "dx-panorama",
            PANORAMA_WRAPPER_CLASS = "dx-panorama-wrapper",
            PANORAMA_TITLE_CLASS = "dx-panorama-title",
            PANORAMA_GHOST_TITLE_CLASS = "dx-panorama-ghosttitle",
            PANORAMA_ITEMS_CONTAINER_CLASS = "dx-panorama-itemscontainer",
            PANORAMA_ITEM_CLASS = "dx-panorama-item",
            PANORAMA_GHOST_ITEM_CLASS = "dx-panorama-ghostitem",
            PANORAMA_ITEM_DATA_KEY = "dxPanoramaItemData",
            PANORAMA_ITEM_MARGIN_SCALE = 0.02,
            PANORAMA_TITLE_MARGIN_SCALE = 0.02,
            PANORAMA_BACKGROUND_MOVE_DURATION = 300,
            PANORAMA_BACKGROUND_MOVE_EASING = "cubic-bezier(.40, .80, .60, 1)",
            PANORAMA_TITLE_MOVE_DURATION = 300,
            PANORAMA_TITLE_MOVE_EASING = "cubic-bezier(.40, .80, .60, 1)",
            PANORAMA_ITEM_MOVE_DURATION = 300,
            PANORAMA_ITEM_MOVE_EASING = "cubic-bezier(.40, .80, .60, 1)";
        var moveBackground = function($element, position) {
                $element.css("background-position", position + "px 0%")
            };
        var position = function($element) {
                return translator.locate($element).left
            };
        var move = function($element, position) {
                translator.move($element, {left: position});
                $element.css("visibility", "")
            };
        var animation = {
                backgroundMove: function($element, position, completeAction) {
                    return fx.animate($element, {
                            to: {"background-position": position + "px 0%"},
                            duration: PANORAMA_BACKGROUND_MOVE_DURATION,
                            easing: PANORAMA_BACKGROUND_MOVE_EASING,
                            complete: completeAction
                        })
                },
                titleMove: function($title, position, completeAction) {
                    return fx.animate($title, {
                            type: "slide",
                            to: {left: position},
                            duration: PANORAMA_TITLE_MOVE_DURATION,
                            easing: PANORAMA_TITLE_MOVE_EASING,
                            complete: completeAction
                        })
                },
                itemMove: function($item, itemPosition, completeAction) {
                    return fx.animate($item, {
                            type: "slide",
                            to: {left: itemPosition},
                            duration: PANORAMA_ITEM_MOVE_DURATION,
                            easing: PANORAMA_ITEM_MOVE_EASING,
                            complete: function() {
                                completeAction && completeAction.apply(this, arguments);
                                $item.css("visibility", position($item) > 0 ? "" : "hidden")
                            }
                        })
                }
            };
        var endAnimation = function(elements) {
                if (!elements)
                    return;
                $.each(elements, function(_, element) {
                    fx.stop(element, true)
                })
            };
        var PanoramaItemsRenderStrategy = Class.inherit({
                ctor: function(panorama) {
                    this._panorama = panorama
                },
                init: $.noop,
                render: $.noop,
                allItemElements: function() {
                    return this._panorama._itemElements()
                },
                updatePositions: abstract,
                animateRollback: abstract,
                detectBoundsTransition: abstract,
                animateComplete: abstract,
                _getRTLSignCorrection: function() {
                    return this._panorama._getRTLSignCorrection()
                },
                _isRTLEnabled: function() {
                    return this._panorama.option("rtlEnabled")
                },
                _itemMargin: function() {
                    return this._containerWidth() * PANORAMA_ITEM_MARGIN_SCALE
                },
                _containerWidth: function() {
                    return this._panorama._elementWidth()
                },
                _itemWidth: function() {
                    return this._panorama._itemWidth()
                },
                _indexBoundary: function() {
                    return this._panorama._indexBoundary()
                },
                _normalizeIndex: function(index) {
                    return this._panorama._normalizeIndex(index)
                },
                _startNextPosition: function() {
                    if (this._isRTLEnabled())
                        return this._containerWidth() - (this._itemMargin() + this._itemWidth());
                    else
                        return this._itemMargin()
                },
                _startPrevPosition: function() {
                    if (this._isRTLEnabled())
                        return this._containerWidth();
                    else
                        return -this._itemWidth()
                }
            });
        var PanoramaOneAndLessItemsRenderStrategy = PanoramaItemsRenderStrategy.inherit({
                updatePositions: function() {
                    var $items = this._panorama._itemElements(),
                        startPosition = this._startNextPosition();
                    $items.each(function() {
                        move($(this), startPosition)
                    })
                },
                animateRollback: $.noop,
                detectBoundsTransition: $.noop,
                animateComplete: $.noop
            });
        var PanoramaTwoItemsRenderStrategy = PanoramaItemsRenderStrategy.inherit({
                init: function() {
                    this._initGhostItem()
                },
                render: function() {
                    this._renderGhostItem()
                },
                _initGhostItem: function() {
                    this._$ghostItem = $("<div>").addClass(PANORAMA_GHOST_ITEM_CLASS)
                },
                _renderGhostItem: function() {
                    this._panorama._itemContainer().append(this._$ghostItem);
                    this._toggleGhostItem(false)
                },
                _toggleGhostItem: function(visible) {
                    var $ghostItem = this._$ghostItem;
                    if (visible)
                        $ghostItem.css("opacity", 1);
                    else
                        $ghostItem.css("opacity", 0)
                },
                _updateGhostItemContent: function(index) {
                    if (index !== false && index !== this._prevGhostIndex) {
                        this._$ghostItem.html(this._panorama._itemElements().eq(index).html());
                        this._prevGhostIndex = index
                    }
                },
                _isGhostItemVisible: function() {
                    return this._$ghostItem.css("opacity") === "1"
                },
                _swapGhostWithItem: function($item) {
                    var $ghostItem = this._$ghostItem,
                        lastItemPosition = position($item);
                    move($item, position($ghostItem));
                    move($ghostItem, lastItemPosition)
                },
                allItemElements: function() {
                    return this._panorama._itemContainer().find("." + PANORAMA_ITEM_CLASS + ", ." + PANORAMA_GHOST_ITEM_CLASS)
                },
                updatePositions: function(offset) {
                    var $items = this.allItemElements(),
                        selectedIndex = this._panorama.option("selectedIndex"),
                        adjustedOffset = offset * this._getRTLSignCorrection(),
                        isGhostReplaceLast = adjustedOffset > 0 && selectedIndex === 0 || adjustedOffset < 0 && selectedIndex === 1,
                        isGhostReplaceFirst = adjustedOffset < 0 && selectedIndex === 0 || adjustedOffset > 0 && selectedIndex === 1,
                        ghostPosition = isGhostReplaceLast && "replaceLast" || isGhostReplaceFirst && "replaceFirst",
                        ghostContentIndex = isGhostReplaceLast && 1 || isGhostReplaceFirst && 0,
                        positions = this._calculateItemPositions(selectedIndex, ghostPosition);
                    this._updateGhostItemContent(ghostContentIndex);
                    this._toggleGhostItem(isGhostReplaceLast || isGhostReplaceFirst);
                    $items.each(function(index) {
                        move($(this), positions[index] + offset)
                    })
                },
                animateRollback: function(currentIndex) {
                    var that = this,
                        $items = this._panorama._itemElements(),
                        startPosition = this._startNextPosition(),
                        signCorrection = this._getRTLSignCorrection(),
                        offset = (position($items.eq(currentIndex)) - startPosition) * signCorrection,
                        ghostOffset = (position(this._$ghostItem) - startPosition) * signCorrection,
                        positions = this._calculateItemPositions(currentIndex, ghostOffset > 0 ? "prepend" : "append"),
                        isLastReplasedByGhost = currentIndex === 0 && offset > 0 && ghostOffset > 0 || currentIndex === 1 && ghostOffset < 0;
                    if (isLastReplasedByGhost)
                        this._swapGhostWithItem($items.eq(1));
                    else
                        this._swapGhostWithItem($items.eq(0));
                    $items.each(function(index) {
                        animation.itemMove($(this), positions[index])
                    });
                    animation.itemMove(this._$ghostItem, positions[2], function() {
                        that._toggleGhostItem(false)
                    })
                },
                detectBoundsTransition: function(newIndex, currentIndex) {
                    var ghostLocation = position(this._$ghostItem),
                        startPosition = this._startNextPosition(),
                        rtl = this._isRTLEnabled();
                    if (newIndex === 0 && rtl ^ ghostLocation < startPosition)
                        return "left";
                    if (currentIndex === 0 && rtl ^ ghostLocation > startPosition)
                        return "right"
                },
                animateComplete: function(boundCross, newIndex, currentIndex) {
                    var that = this,
                        ghostPosition = !boundCross ^ currentIndex !== 0 ? "prepend" : "append",
                        $items = this._panorama._itemElements(),
                        positions = this._calculateItemPositions(newIndex, ghostPosition),
                        animations = [];
                    $items.each(function(index) {
                        animations.push(animation.itemMove($(this), positions[index]))
                    });
                    animations.push(animation.itemMove(this._$ghostItem, positions[2], function() {
                        that._toggleGhostItem(false)
                    }));
                    return $.when.apply($, animations)
                },
                _calculateItemPositions: function(atIndex, ghostPosition) {
                    var positions = [],
                        itemMargin = this._itemMargin(),
                        itemWidth = this._itemWidth(),
                        itemPositionOffset = (itemWidth + itemMargin) * this._getRTLSignCorrection(),
                        normalFlow = atIndex === 0,
                        prevPosition = this._startPrevPosition(),
                        nextPosition = this._startNextPosition();
                    positions.push(nextPosition);
                    nextPosition += itemPositionOffset;
                    if (normalFlow)
                        positions.push(nextPosition);
                    else
                        positions.splice(0, 0, nextPosition);
                    nextPosition += itemPositionOffset;
                    switch (ghostPosition) {
                        case"replaceFirst":
                            positions.push(positions[0]);
                            if (normalFlow)
                                positions[0] = nextPosition;
                            else
                                positions[0] = prevPosition;
                            break;
                        case"replaceLast":
                            if (normalFlow)
                                positions.splice(1, 0, prevPosition);
                            else
                                positions.splice(1, 0, nextPosition);
                            break;
                        case"prepend":
                            positions.push(prevPosition);
                            break;
                        case"append":
                            positions.push(nextPosition);
                            break
                    }
                    return positions
                }
            });
        var PanoramaThreeAndMoreItemsRenderStrategy = PanoramaItemsRenderStrategy.inherit({
                updatePositions: function(offset) {
                    var $items = this._panorama._itemElements(),
                        movingBack = offset * this._getRTLSignCorrection() < 0,
                        positions = this._calculateItemPositions(this._panorama.option("selectedIndex"), movingBack);
                    $items.each(function(index) {
                        move($(this), positions[index] + offset)
                    })
                },
                animateRollback: function(selectedIndex) {
                    var $items = this._panorama._itemElements(),
                        positions = this._calculateItemPositions(selectedIndex),
                        animatingItems = [selectedIndex, this._normalizeIndex(selectedIndex + 1)];
                    if (this._isRTLEnabled() ^ position($items.eq(selectedIndex)) > this._startNextPosition())
                        animatingItems.push(this._normalizeIndex(selectedIndex - 1));
                    $items.each(function(index) {
                        var $item = $(this);
                        if ($.inArray(index, animatingItems) !== -1)
                            animation.itemMove($item, positions[index]);
                        else
                            move($item, positions[index])
                    })
                },
                detectBoundsTransition: function(newIndex, currentIndex) {
                    var lastIndex = this._indexBoundary() - 1;
                    if (currentIndex === lastIndex && newIndex === 0)
                        return "left";
                    if (currentIndex === 0 && newIndex === lastIndex)
                        return "right"
                },
                animateComplete: function(boundCross, newIndex, currentIndex) {
                    var animations = [],
                        $items = this._panorama._itemElements(),
                        positions = this._calculateItemPositions(newIndex);
                    var transitionBack = this._normalizeIndex(currentIndex - 1) === newIndex,
                        cyclingItemIndex = $items.length === 3 && transitionBack ? this._normalizeIndex(currentIndex + 1) : null,
                        cyclingItemPosition = positions[this._indexBoundary()];
                    var animatingItems = [newIndex, currentIndex],
                        backAnimatedItemIndex = transitionBack ? currentIndex : newIndex;
                    if (!transitionBack)
                        animatingItems.push(this._normalizeIndex(backAnimatedItemIndex + 1));
                    $items.each(function(index) {
                        var $item = $(this);
                        if ($.inArray(index, animatingItems) === -1) {
                            move($item, positions[index]);
                            return
                        }
                        animations.push(index !== cyclingItemIndex ? animation.itemMove($item, positions[index]) : animation.itemMove($item, cyclingItemPosition, function() {
                            move($item, positions[index])
                        }))
                    });
                    return $.when.apply($, animations)
                },
                _calculateItemPositions: function(atIndex, movingBack) {
                    var previousIndex = this._normalizeIndex(atIndex - 1),
                        itemMargin = this._itemMargin(),
                        itemWidth = this._itemWidth(),
                        itemPositionOffset = (itemWidth + itemMargin) * this._getRTLSignCorrection(),
                        positions = [],
                        prevPosition = this._startPrevPosition(),
                        nextPosition = this._startNextPosition();
                    for (var i = atIndex; i !== previousIndex; i = this._normalizeIndex(i + 1)) {
                        positions[i] = nextPosition;
                        nextPosition += itemPositionOffset
                    }
                    if (movingBack) {
                        positions[previousIndex] = nextPosition;
                        nextPosition += itemPositionOffset
                    }
                    else
                        positions[previousIndex] = prevPosition;
                    positions.push(nextPosition);
                    return positions
                }
            });
        registerComponent("dxPanorama", ui, ui.CollectionWidget.inherit({
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                        selectedIndex: 0,
                        title: "panorama",
                        backgroundImage: {
                            url: null,
                            width: 0,
                            height: 0
                        },
                        focusStateEnabled: false,
                        selectionMode: "single",
                        selectionRequired: true,
                        selectionByClick: false
                    })
            },
            _itemClass: function() {
                return PANORAMA_ITEM_CLASS
            },
            _itemDataKey: function() {
                return PANORAMA_ITEM_DATA_KEY
            },
            _itemContainer: function() {
                return this._$itemsContainer
            },
            _itemWidth: function() {
                if (!this._itemWidthCache)
                    this._itemWidthCache = this._itemElements().eq(0).outerWidth();
                return this._itemWidthCache
            },
            _clearItemWidthCache: function() {
                delete this._itemWidthCache
            },
            _elementWidth: function() {
                if (!this._elementWidthCache)
                    this._elementWidthCache = this.element().width();
                return this._elementWidthCache
            },
            _clearElementWidthCache: function() {
                delete this._elementWidthCache
            },
            _titleWidth: function() {
                if (!this._titleWidthCache)
                    this._titleWidthCache = this._$title.outerWidth();
                return this._titleWidthCache
            },
            _clearTitleWidthCache: function() {
                delete this._titleWidthCache
            },
            _init: function() {
                this.callBase();
                this._initItemsRenderStrategy();
                this._initWrapper();
                this._initTitle();
                this._initItemsContainer();
                this._initSwipeHandlers()
            },
            _dimensionChanged: function() {
                this._clearItemWidthCache();
                this._clearElementWidthCache();
                this._clearTitleWidthCache();
                this._updatePositions()
            },
            _initWrapper: function() {
                this._$wrapper = $("<div>").addClass(PANORAMA_WRAPPER_CLASS).appendTo(this.element())
            },
            _initItemsRenderStrategy: function() {
                var itemsRenderStrategy;
                switch (this.option("items").length) {
                    case 0:
                    case 1:
                        itemsRenderStrategy = PanoramaOneAndLessItemsRenderStrategy;
                        break;
                    case 2:
                        itemsRenderStrategy = PanoramaTwoItemsRenderStrategy;
                        break;
                    default:
                        itemsRenderStrategy = PanoramaThreeAndMoreItemsRenderStrategy
                }
                this._itemsRenderStrategy = new itemsRenderStrategy(this);
                this._itemsRenderStrategy.init()
            },
            _initBackgroundImage: function() {
                var bgUrl = this.option("backgroundImage.url");
                if (bgUrl)
                    this.element().css("background-image", "url(" + bgUrl + ")")
            },
            _initTitle: function() {
                this._$title = $("<div>").addClass(PANORAMA_TITLE_CLASS);
                this._$ghostTitle = $("<div>").addClass(PANORAMA_GHOST_TITLE_CLASS);
                this._$wrapper.append(this._$title);
                this._$wrapper.append(this._$ghostTitle);
                this._updateTitle()
            },
            _updateTitle: function() {
                var title = this.option("title");
                this._$title.text(title);
                this._$ghostTitle.text(title);
                this._toggleGhostTitle(false)
            },
            _toggleGhostTitle: function(visible) {
                var $ghostTitle = this._$ghostTitle;
                if (visible)
                    $ghostTitle.css("opacity", 1);
                else
                    $ghostTitle.css("opacity", 0)
            },
            _getRTLSignCorrection: function() {
                return this.option("rtlEnabled") ? -1 : 1
            },
            _initItemsContainer: function() {
                this._$itemsContainer = $("<div>").addClass(PANORAMA_ITEMS_CONTAINER_CLASS);
                this._$wrapper.append(this._$itemsContainer)
            },
            _render: function() {
                this.element().addClass(PANORAMA_CLASS);
                this.callBase();
                this._initBackgroundImage();
                this._itemsRenderStrategy.render()
            },
            _updatePositions: function(offset) {
                offset = offset || 0;
                this._updateBackgroundPosition(offset * this._calculateBackgroundStep());
                this._updateTitlePosition(offset * this._calculateTitleStep());
                this._itemsRenderStrategy.updatePositions(offset * this._elementWidth())
            },
            _updateBackgroundPosition: function(offset) {
                moveBackground(this.element(), this._calculateBackgroundPosition(this.option("selectedIndex")) + offset)
            },
            _updateTitlePosition: function(offset) {
                move(this._$title, this._calculateTitlePosition(this.option("selectedIndex")) + offset)
            },
            _animateRollback: function(currentIndex) {
                this._animateBackgroundMove(currentIndex);
                this._animateTitleMove(currentIndex);
                this._itemsRenderStrategy.animateRollback(currentIndex)
            },
            _animateBackgroundMove: function(toIndex) {
                return animation.backgroundMove(this.element(), this._calculateBackgroundPosition(toIndex))
            },
            _animateTitleMove: function(toIndex) {
                return animation.titleMove(this._$title, this._calculateTitlePosition(toIndex))
            },
            _animateComplete: function(newIndex, currentIndex) {
                var that = this,
                    boundCross = this._itemsRenderStrategy.detectBoundsTransition(newIndex, currentIndex);
                var backgroundAnimation = this._performBackgroundAnimation(boundCross, newIndex);
                var titleAnimation = this._performTitleAnimation(boundCross, newIndex);
                var itemsAnimation = this._itemsRenderStrategy.animateComplete(boundCross, newIndex, currentIndex);
                $.when(backgroundAnimation, titleAnimation, itemsAnimation).done(function() {
                    that._indexChangeOnAnimation = true;
                    that.option("selectedIndex", newIndex);
                    that._indexChangeOnAnimation = false
                })
            },
            _performBackgroundAnimation: function(boundCross, newIndex) {
                if (boundCross)
                    return this._animateBackgroundBoundsTransition(boundCross, newIndex);
                return this._animateBackgroundMove(newIndex)
            },
            _animateBackgroundBoundsTransition: function(bound, newIndex) {
                var that = this,
                    isLeft = bound === "left",
                    afterAnimationPosition = this._calculateBackgroundPosition(newIndex),
                    animationEndPositionShift = isLeft ^ this.option("rtlEnabled") ? -this._calculateBackgroundScaledWidth() : this._calculateBackgroundScaledWidth(),
                    animationEndPosition = afterAnimationPosition + animationEndPositionShift;
                return animation.backgroundMove(this.element(), animationEndPosition, function() {
                        moveBackground(that.element(), afterAnimationPosition)
                    })
            },
            _performTitleAnimation: function(boundCross, newIndex) {
                if (boundCross)
                    return this._animateTitleBoundsTransition(boundCross, newIndex);
                return this._animateTitleMove(newIndex)
            },
            _animateTitleBoundsTransition: function(bound, newIndex) {
                var that = this,
                    $ghostTitle = this._$ghostTitle,
                    ghostWidth = this._titleWidth(),
                    panoramaWidth = this._elementWidth(),
                    isLeft = bound === "left",
                    rtl = this.option("rtlEnabled"),
                    ghostTitleStartPosition = isLeft ^ rtl ? panoramaWidth : -ghostWidth,
                    ghostTitleEndPosition = isLeft ^ rtl ? -(panoramaWidth + ghostWidth) : panoramaWidth;
                move($ghostTitle, ghostTitleStartPosition);
                this._toggleGhostTitle(true);
                this._swapGhostWithTitle();
                var ghostAnimation = animation.titleMove($ghostTitle, ghostTitleEndPosition, function() {
                        that._toggleGhostTitle(false)
                    });
                var titleAnimation = animation.titleMove(this._$title, this._calculateTitlePosition(newIndex));
                return $.when(ghostAnimation, titleAnimation)
            },
            _swapGhostWithTitle: function() {
                var $ghostTitle = this._$ghostTitle,
                    $title = this._$title,
                    lastTitlePosition = position($title);
                move($title, position($ghostTitle));
                move($ghostTitle, lastTitlePosition)
            },
            _calculateTitlePosition: function(atIndex) {
                var panoramaWidth = this._elementWidth(),
                    titleWidth = this._titleWidth(),
                    titleMargin = panoramaWidth * PANORAMA_TITLE_MARGIN_SCALE,
                    titleStartPosition = this.option("rtlEnabled") ? panoramaWidth - titleMargin - titleWidth : titleMargin,
                    titleStep = atIndex * this._calculateTitleStep() * this._getRTLSignCorrection();
                return titleStartPosition - titleStep
            },
            _calculateTitleStep: function() {
                var panoramaWidth = this._elementWidth(),
                    titleWidth = this._titleWidth(),
                    indexBoundary = this._indexBoundary() || 1;
                return Math.max((titleWidth - panoramaWidth) / indexBoundary, titleWidth / indexBoundary)
            },
            _calculateBackgroundPosition: function(atIndex) {
                var panoramaWidth = this._elementWidth(),
                    backgroundScaledWidth = this._calculateBackgroundScaledWidth(),
                    backgroundStartPosition = this.option("rtlEnabled") ? panoramaWidth - backgroundScaledWidth : 0,
                    backgroundOffset = atIndex * this._calculateBackgroundStep() * this._getRTLSignCorrection();
                return backgroundStartPosition - backgroundOffset
            },
            _calculateBackgroundStep: function() {
                var itemWidth = this._itemWidth(),
                    backgroundScaledWidth = this._calculateBackgroundScaledWidth();
                return Math.max((backgroundScaledWidth - itemWidth) / (this._indexBoundary() || 1), 0)
            },
            _calculateBackgroundScaledWidth: function() {
                return this.element().height() * this.option("backgroundImage.width") / (this.option("backgroundImage.height") || 1)
            },
            _initSwipeHandlers: function() {
                this.element().on(eventUtils.addNamespace("dxswipestart", this.NAME), {itemSizeFunc: $.proxy(this._elementWidth, this)}, $.proxy(this._swipeStartHandler, this)).on(eventUtils.addNamespace("dxswipe", this.NAME), $.proxy(this._swipeUpdateHandler, this)).on(eventUtils.addNamespace("dxswipeend", this.NAME), $.proxy(this._swipeEndHandler, this))
            },
            _swipeStartHandler: function(e) {
                this._stopAnimations();
                e.maxLeftOffset = 1;
                e.maxRightOffset = 1;
                if (DX.designMode || this.option("disabled") || this._indexBoundary() <= 1)
                    e.cancel = true
            },
            _stopAnimations: function() {
                endAnimation([this.element(), this._$ghostTitle, this._$title]);
                endAnimation(this._itemsRenderStrategy.allItemElements())
            },
            _swipeUpdateHandler: function(e) {
                this._updatePositions(e.offset)
            },
            _swipeEndHandler: function(e) {
                var currentIndex = this.option("selectedIndex"),
                    targetOffset = e.targetOffset * this._getRTLSignCorrection();
                if (targetOffset === 0)
                    this._animateRollback(currentIndex);
                else
                    this._animateComplete(this._normalizeIndex(currentIndex - targetOffset), currentIndex)
            },
            _renderSelection: function(current, previous) {
                if (!this._indexChangeOnAnimation)
                    this._updatePositions()
            },
            _normalizeIndex: function(index) {
                var boundary = this._indexBoundary();
                if (index < 0)
                    index = boundary + index;
                if (index >= boundary)
                    index = index - boundary;
                return index
            },
            _indexBoundary: function() {
                return this.option("items").length
            },
            _visibilityChanged: function(visible) {
                if (visible)
                    this._dimensionChanged()
            },
            _optionChanged: function(args) {
                switch (args.name) {
                    case"width":
                        this.callBase(args);
                        this._dimensionChanged();
                        break;
                    case"backgroundImage":
                        this._invalidate();
                        break;
                    case"title":
                        this._updateTitle();
                        break;
                    case"items":
                        this._initItemsRenderStrategy();
                        this.callBase(args);
                        break;
                    default:
                        this.callBase(args)
                }
            }
        }));
        ui.dxPanorama.__internals = {animation: animation}
    })(jQuery, DevExpress);
    /*! Module widgets-mobile, file ui.slideOutView.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            fx = DX.fx,
            translator = DX.require("/utils/utils.translator"),
            hideTopOverlayCallback = DX.require("/utils/utils.topOverlay").hideCallback,
            registerComponent = DX.require("/componentRegistrator"),
            Widget = DX.require("/ui/ui.widget");
        var SLIDEOUTVIEW_CLASS = "dx-slideoutview",
            SLIDEOUTVIEW_WRAPPER_CLASS = "dx-slideoutview-wrapper",
            SLIDEOUTVIEW_MENU_CONTENT_CLASS = "dx-slideoutview-menu-content",
            SLIDEOUTVIEW_CONTENT_CLASS = "dx-slideoutview-content",
            SLIDEOUTVIEW_SHIELD_CLASS = "dx-slideoutview-shield",
            INVISIBLE_STATE_CLASS = "dx-state-invisible",
            ANONYMOUS_TEMPLATE_NAME = "content",
            ANIMATION_DURATION = 400;
        var animation = {
                moveTo: function($element, position, completeAction) {
                    fx.animate($element, {
                        type: "slide",
                        to: {left: position},
                        duration: ANIMATION_DURATION,
                        complete: completeAction
                    })
                },
                complete: function($element) {
                    fx.stop($element, true)
                }
            };
        registerComponent("dxSlideOutView", ui, Widget.inherit({
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                        menuPosition: "normal",
                        menuVisible: false,
                        swipeEnabled: true,
                        menuTemplate: "menu",
                        contentTemplate: "content",
                        contentOffset: 45
                    })
            },
            _defaultOptionsRules: function() {
                return this.callBase().concat([{
                            device: {android: true},
                            options: {contentOffset: 54}
                        }, {
                            device: function(device) {
                                return device.platform === "generic" && device.deviceType !== "desktop"
                            },
                            options: {contentOffset: 56}
                        }, {
                            device: {
                                win: true,
                                phone: false
                            },
                            options: {contentOffset: 76}
                        }])
            },
            _getAnonymousTemplateName: function() {
                return ANONYMOUS_TEMPLATE_NAME
            },
            _init: function() {
                this.callBase();
                this.element().addClass(SLIDEOUTVIEW_CLASS);
                this._deferredAnimate = undefined;
                this._initHideTopOverlayHandler()
            },
            _initHideTopOverlayHandler: function() {
                this._hideMenuHandler = $.proxy(this.hideMenu, this)
            },
            _render: function() {
                this.callBase();
                this._renderShield();
                this._toggleMenuPositionClass();
                this._initSwipeHandlers();
                this._dimensionChanged()
            },
            _renderContentImpl: function() {
                this._renderMarkup();
                var menuTemplate = this._getTemplate(this.option("menuTemplate")),
                    contentTemplate = this._getTemplate(this.option("contentTemplate"));
                menuTemplate && menuTemplate.render(this.menuContent());
                contentTemplate && contentTemplate.render(this.content())
            },
            _renderMarkup: function() {
                var $wrapper = $("<div>").addClass(SLIDEOUTVIEW_WRAPPER_CLASS);
                this._$menu = $("<div>").addClass(SLIDEOUTVIEW_MENU_CONTENT_CLASS);
                this._$container = $("<div>").addClass(SLIDEOUTVIEW_CONTENT_CLASS);
                $wrapper.append(this._$menu);
                $wrapper.append(this._$container);
                this.element().append($wrapper);
                this._$container.on("MSPointerDown", $.noop)
            },
            _renderShield: function() {
                this._$shield = this._$shield || $("<div>").addClass(SLIDEOUTVIEW_SHIELD_CLASS);
                this._$shield.appendTo(this.content());
                this._$shield.off("dxclick").on("dxclick", $.proxy(this.hideMenu, this));
                this._toggleShieldVisibility(this.option("menuVisible"))
            },
            _initSwipeHandlers: function() {
                this._createComponent(this.content(), "dxSwipeable", {
                    disabled: !this.option("swipeEnabled"),
                    elastic: false,
                    itemSizeFunc: $.proxy(this._getMenuWidth, this),
                    onStart: $.proxy(this._swipeStartHandler, this),
                    onUpdated: $.proxy(this._swipeUpdateHandler, this),
                    onEnd: $.proxy(this._swipeEndHandler, this)
                })
            },
            _isRightMenuPosition: function() {
                var invertedPosition = this.option("menuPosition") === "inverted",
                    rtl = this.option("rtlEnabled");
                return rtl && !invertedPosition || !rtl && invertedPosition
            },
            _swipeStartHandler: function(e) {
                animation.complete(this.content());
                var event = e.jQueryEvent,
                    menuVisible = this.option("menuVisible"),
                    rtl = this._isRightMenuPosition();
                event.maxLeftOffset = +(rtl ? !menuVisible : menuVisible);
                event.maxRightOffset = +(rtl ? menuVisible : !menuVisible);
                this._toggleShieldVisibility(true)
            },
            _swipeUpdateHandler: function(e) {
                var event = e.jQueryEvent,
                    offset = this.option("menuVisible") ? event.offset + 1 * this._getRTLSignCorrection() : event.offset;
                offset *= this._getRTLSignCorrection();
                this._renderPosition(offset, false)
            },
            _swipeEndHandler: function(e) {
                var targetOffset = e.jQueryEvent.targetOffset * this._getRTLSignCorrection() + this.option("menuVisible"),
                    menuVisible = targetOffset !== 0;
                if (this.option("menuVisible") === menuVisible)
                    this._renderPosition(this.option("menuVisible"), true);
                else
                    this.option("menuVisible", menuVisible)
            },
            _toggleMenuPositionClass: function() {
                var left = SLIDEOUTVIEW_CLASS + "-left",
                    right = SLIDEOUTVIEW_CLASS + "-right",
                    menuPosition = this._isRightMenuPosition() ? "right" : "left";
                this._$menu.removeClass(left + " " + right);
                this._$menu.addClass(SLIDEOUTVIEW_CLASS + "-" + menuPosition)
            },
            _renderPosition: function(offset, animate) {
                var pos = this._calculatePixelOffset(offset) * this._getRTLSignCorrection();
                this._toggleHideMenuCallback(offset);
                if (animate) {
                    this._toggleShieldVisibility(true);
                    animation.moveTo(this.content(), pos, $.proxy(this._animationCompleteHandler, this))
                }
                else
                    translator.move(this.content(), {left: pos})
            },
            _calculatePixelOffset: function(offset) {
                offset = offset || 0;
                return offset * this._getMenuWidth()
            },
            _getMenuWidth: function() {
                if (!this._menuWidth) {
                    var maxMenuWidth = this.element().width() - this.option("contentOffset");
                    this.menuContent().css("max-width", maxMenuWidth);
                    var currentMenuWidth = this.menuContent().width();
                    this._menuWidth = Math.min(currentMenuWidth, maxMenuWidth)
                }
                return this._menuWidth
            },
            _animationCompleteHandler: function() {
                this._toggleShieldVisibility(this.option("menuVisible"));
                if (this._deferredAnimate)
                    this._deferredAnimate.resolveWith(this)
            },
            _toggleHideMenuCallback: function(subscribe) {
                if (subscribe)
                    hideTopOverlayCallback.add(this._hideMenuHandler);
                else
                    hideTopOverlayCallback.remove(this._hideMenuHandler)
            },
            _getRTLSignCorrection: function() {
                return this._isRightMenuPosition() ? -1 : 1
            },
            _dispose: function() {
                animation.complete(this.content());
                this._toggleHideMenuCallback(false);
                this.callBase()
            },
            _visibilityChanged: function(visible) {
                if (visible)
                    this._dimensionChanged()
            },
            _dimensionChanged: function() {
                delete this._menuWidth;
                this._renderPosition(this.option("menuVisible"), false)
            },
            _toggleShieldVisibility: function(visible) {
                this._$shield.toggleClass(INVISIBLE_STATE_CLASS, !visible)
            },
            _optionChanged: function(args) {
                switch (args.name) {
                    case"width":
                        this.callBase(args);
                        this._dimensionChanged();
                        break;
                    case"contentOffset":
                        this._dimensionChanged();
                        break;
                    case"menuVisible":
                        this._renderPosition(args.value, true);
                        break;
                    case"menuPosition":
                        this._renderPosition(this.option("menuVisible"), true);
                        this._toggleMenuPositionClass();
                        break;
                    case"swipeEnabled":
                        this._initSwipeHandlers();
                        break;
                    case"contentTemplate":
                    case"menuTemplate":
                        this._invalidate();
                        break;
                    default:
                        this.callBase(args)
                }
            },
            menuContent: function() {
                return this._$menu
            },
            content: function() {
                return this._$container
            },
            showMenu: function() {
                return this.toggleMenuVisibility(true)
            },
            hideMenu: function() {
                return this.toggleMenuVisibility(false)
            },
            toggleMenuVisibility: function(showing) {
                showing = showing === undefined ? !this.option("menuVisible") : showing;
                this._deferredAnimate = $.Deferred();
                this.option("menuVisible", showing);
                return this._deferredAnimate.promise()
            }
        }));
        ui.dxSlideOutView.__internals = {animation: animation}
    })(jQuery, DevExpress);
    /*! Module widgets-mobile, file ui.slideOut.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            commonUtils = DX.require("/utils/utils.common"),
            registerComponent = DX.require("/componentRegistrator");
        var SLIDEOUT_CLASS = "dx-slideout",
            SLIDEOUT_ITEM_CONTAINER_CLASS = "dx-slideout-item-container",
            SLIDEOUT_MENU = "dx-slideout-menu",
            SLIDEOUT_ITEM_CLASS = "dx-slideout-item",
            SLIDEOUT_ITEM_DATA_KEY = "dxSlideoutItemData";
        registerComponent("dxSlideOut", ui, ui.CollectionWidget.inherit({
            _getDefaultOptions: function() {
                return $.extend(this.callBase(), {
                        activeStateEnabled: false,
                        menuItemTemplate: "menuItem",
                        swipeEnabled: true,
                        menuVisible: false,
                        menuPosition: "normal",
                        menuGrouped: false,
                        menuGroupTemplate: "menuGroup",
                        onMenuItemRendered: null,
                        onMenuGroupRendered: null,
                        contentTemplate: "content",
                        selectionMode: "single",
                        selectionRequired: true
                    })
            },
            _itemClass: function() {
                return SLIDEOUT_ITEM_CLASS
            },
            _itemDataKey: function() {
                return SLIDEOUT_ITEM_DATA_KEY
            },
            _itemContainer: function() {
                return this._slideOutView.content()
            },
            _init: function() {
                this.callBase();
                this.element().addClass(SLIDEOUT_CLASS);
                this._initSlideOutView()
            },
            _initEditStrategy: function() {
                if (this.option("menuGrouped")) {
                    var strategy = ui.CollectionWidget.PlainEditStrategy.inherit({_getPlainItems: function() {
                                return $.map(this.callBase(), function(group) {
                                        return group.items
                                    })
                            }});
                    this._editStrategy = new strategy(this)
                }
                else
                    this.callBase()
            },
            _initSlideOutView: function() {
                this._slideOutView = this._createComponent(this.element(), "dxSlideOutView", {
                    _templates: [],
                    menuVisible: this.option("menuVisible"),
                    swipeEnabled: this.option("swipeEnabled"),
                    menuPosition: this.option("menuPosition"),
                    onOptionChanged: $.proxy(this._slideOutViewOptionChanged, this)
                });
                this._itemContainer().addClass(SLIDEOUT_ITEM_CONTAINER_CLASS)
            },
            _slideOutViewOptionChanged: function(args) {
                if (args.name === "menuVisible")
                    this.option(args.name, args.value)
            },
            _render: function() {
                this._slideOutView._renderShield();
                this._renderList();
                this._renderContentTemplate();
                this.callBase()
            },
            _renderList: function() {
                this._$list = this._$list || $("<div>").addClass(SLIDEOUT_MENU).appendTo(this._slideOutView.menuContent());
                this._renderItemClickAction();
                this._createComponent(this._$list, "dxList", {
                    itemTemplateProperty: "menuTemplate",
                    indicateLoading: false,
                    onItemClick: $.proxy(this._listItemClickHandler, this),
                    items: this.option("items"),
                    dataSource: this.option("dataSource"),
                    itemTemplate: this._getTemplateByOption("menuItemTemplate"),
                    grouped: this.option("menuGrouped"),
                    groupTemplate: this.option("menuGroupTemplate"),
                    onItemRendered: this.option("onMenuItemRendered"),
                    onGroupRendered: this.option("onMenuGroupRendered"),
                    onContentReady: $.proxy(this._updateSlideOutView, this)
                })
            },
            _updateSlideOutView: function() {
                this._slideOutView._dimensionChanged()
            },
            _renderItemClickAction: function() {
                this._itemClickAction = this._createActionByOption("onItemClick")
            },
            _listItemClickHandler: function(e) {
                var selectedIndex = this._$list.find(".dx-list-item").index(e.itemElement);
                this.option("selectedIndex", selectedIndex);
                this._itemClickAction(e)
            },
            _renderContentTemplate: function() {
                if (commonUtils.isDefined(this._singleContent))
                    return;
                var $result = this._getTemplateByOption("contentTemplate").render(this._itemContainer());
                this._singleContent = !!$result.length || $result.is(":empty")
            },
            _itemClickHandler: $.noop,
            _renderContentImpl: function(template) {
                if (this._singleContent)
                    return;
                var items = this.option("items"),
                    selectedIndex = this.option("selectedIndex");
                if (items.length && selectedIndex > -1) {
                    var selectedItem = this._$list.dxList("instance").getItemByIndex(selectedIndex);
                    this._renderItems([selectedItem])
                }
            },
            _renderItem: function(index, item, container) {
                this._itemContainer().find("." + SLIDEOUT_ITEM_CLASS).remove();
                this.callBase(index, item)
            },
            _selectedItemElement: function(index) {
                return this._itemElements().eq(0)
            },
            _renderSelection: function() {
                this._renderContent()
            },
            _getListWidth: function() {
                return this._slideOutView._getMenuWidth()
            },
            _changeMenuOption: function(name, value) {
                this._$list.dxList("instance").option(name, value);
                this._updateSlideOutView()
            },
            _cleanItemContainer: function() {
                if (this._singleContent)
                    return;
                this.callBase()
            },
            beginUpdate: function() {
                this.callBase();
                this._$list && this._$list.dxList("beginUpdate")
            },
            endUpdate: function() {
                this._$list && this._$list.dxList("endUpdate");
                this.callBase()
            },
            _optionChanged: function(args) {
                var name = args.name;
                var value = args.value;
                switch (name) {
                    case"menuVisible":
                    case"swipeEnabled":
                    case"rtlEnabled":
                    case"menuPosition":
                        this._slideOutView.option(name, value);
                        break;
                    case"width":
                        this.callBase(args);
                        this._updateSlideOutView();
                        break;
                    case"menuItemTemplate":
                        this._changeMenuOption("itemTemplate", this._getTemplate(value));
                        break;
                    case"items":
                        this._changeMenuOption("items", this.option("items"));
                        break;
                    case"dataSource":
                        this._changeMenuOption(name, value);
                        this.callBase(args);
                        break;
                    case"menuGrouped":
                        this._initEditStrategy();
                        this._changeMenuOption("grouped", value);
                        break;
                    case"menuGroupTemplate":
                        this._changeMenuOption("groupTemplate", this._getTemplate(value));
                        break;
                    case"onMenuItemRendered":
                        this._changeMenuOption("onItemRendered", value);
                        break;
                    case"onMenuGroupRendered":
                        this._changeMenuOption("onGroupRendered", value);
                        break;
                    case"onItemClick":
                        this._renderItemClickAction();
                        break;
                    case"contentTemplate":
                        this._singleContent = null;
                        this._invalidate();
                        break;
                    default:
                        this.callBase(args)
                }
            },
            showMenu: function() {
                return this._slideOutView.toggleMenuVisibility(true)
            },
            hideMenu: function() {
                return this._slideOutView.toggleMenuVisibility(false)
            },
            toggleMenuVisibility: function(showing) {
                return this._slideOutView.toggleMenuVisibility(showing)
            }
        }))
    })(jQuery, DevExpress);
    DevExpress.MOD_WIDGETS_MOBILE = true
}