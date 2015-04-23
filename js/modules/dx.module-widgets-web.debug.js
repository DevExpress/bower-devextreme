/*! 
* DevExtreme (Web Widgets)
* Version: 14.2.7
* Build date: Apr 17, 2015
*
* Copyright (c) 2011 - 2014 Developer Express Inc. ALL RIGHTS RESERVED
* EULA: https://www.devexpress.com/Support/EULAs/DevExtreme.xml
*/

"use strict";
if (!DevExpress.MOD_WIDGETS_WEB) {
    if (!DevExpress.MOD_WIDGETS_BASE)
        throw Error('Required module is not referenced: widgets-base');
    /*! Module widgets-web, file ui.accordion.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            events = ui.events,
            fx = DX.fx,
            utils = DX.utils,
            translator = DX.translator;
        var ACCORDION_CLASS = "dx-accordion",
            ACCORDION_WRAPPER_CLASS = "dx-accordion-wrapper",
            ACCORDION_ITEM_CLASS = "dx-accordion-item",
            ACCORDION_ITEM_OPENED_CLASS = "dx-accordion-item-opened",
            ACCORDION_ITEM_TITLE_CLASS = "dx-accordion-item-title",
            ACCORDION_ITEM_BODY_CLASS = "dx-accordion-item-body",
            ACCORDION_ITEM_DATA_KEY = "dxAccordionItemData",
            ACCORDION_ITEM_TITLE_DATA_KEY = "dxAccordionItemTitleData",
            ACCORDION_ITEM_CONTENT_DATA_KEY = "dxAccordionItemContentData";
        DX.registerComponent("dxAccordion", ui, ui.CollectionWidget.inherit({
            _activeStateUnit: "." + ACCORDION_ITEM_CLASS,
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    height: undefined,
                    itemTitleTemplate: "title",
                    onItemTitleClick: null,
                    onItemTitleHold: null,
                    selectedIndex: 0,
                    collapsible: false,
                    multiple: false,
                    animationDuration: 300,
                    selectionByClick: true,
                    activeStateEnabled: true
                })
            },
            _defaultOptionsRules: function() {
                return this.callBase().concat([{
                            device: function(device) {
                                return DX.devices.real().generic && !DX.devices.isSimulator()
                            },
                            options: {
                                hoverStateEnabled: true,
                                focusStateEnabled: true
                            }
                        }])
            },
            _init: function() {
                this.callBase();
                this.option("selectionRequired", !this.option("collapsible"));
                this.option("selectionMode", this.option("multiple") ? "multi" : "single");
                var $element = this.element();
                $element.addClass(ACCORDION_CLASS);
                this._$container = $("<div>").addClass(ACCORDION_WRAPPER_CLASS);
                $element.append(this._$container)
            },
            _render: function() {
                this.callBase();
                this._attachItemTitleClickAction()
            },
            _itemDataKey: function() {
                return ACCORDION_ITEM_DATA_KEY
            },
            _itemClass: function() {
                return ACCORDION_ITEM_CLASS
            },
            _itemContainer: function() {
                return this._$container
            },
            _itemTitles: function() {
                return this._itemElements().find("." + ACCORDION_ITEM_TITLE_CLASS)
            },
            _itemContents: function() {
                return this._itemElements().find("." + ACCORDION_ITEM_BODY_CLASS)
            },
            _getItemData: function(target) {
                return $(target).parent().data(this._itemDataKey()) || this.callBase.apply(this, arguments)
            },
            _executeItemRenderAction: function(itemData, itemElement) {
                if (itemData.type)
                    return;
                this.callBase.apply(this, arguments)
            },
            _itemSelectHandler: function(e) {
                if ($(e.target).closest("." + ACCORDION_ITEM_BODY_CLASS).length)
                    return;
                this.callBase.apply(this, arguments)
            },
            _renderItemContent: function(index, itemData, $container) {
                $container = $container || this._itemContainer();
                var $itemContent = this.callBase.apply(this, [index, $.extend({
                            type: "content",
                            template: this._getTemplateByOption("itemTemplate")
                        }, itemData), $container]);
                var $item = $itemContent.parent(),
                    $itemTitle = $("<div>").prependTo($item);
                this.callBase.apply(this, [index, $.extend({
                        type: "title",
                        titleTemplate: this._getTemplateByOption("itemTitleTemplate")
                    }, itemData), $itemTitle]);
                return $item
            },
            _getItemTemplateName: function(itemData) {
                var templateProperty = this.option("itemTemplateProperty");
                if (itemData.type === "title")
                    templateProperty = "titleTemplate";
                return itemData && itemData[templateProperty] || this.option("itemTemplate")
            },
            _addItemContentClasses: function($container, itemData) {
                switch (itemData.type) {
                    case"title":
                        $container.addClass(ACCORDION_ITEM_TITLE_CLASS).data(ACCORDION_ITEM_TITLE_DATA_KEY, itemData);
                        break;
                    case"content":
                        $container.addClass(ACCORDION_ITEM_BODY_CLASS).data(ACCORDION_ITEM_CONTENT_DATA_KEY, itemData);
                        break;
                    default:
                        this.callBase.apply(this, arguments)
                }
            },
            _attachItemTitleClickAction: function() {
                var itemSelector = "." + ACCORDION_ITEM_TITLE_CLASS,
                    eventName = events.addNamespace("dxclick", this.NAME);
                this._itemContainer().off(eventName, itemSelector).on(eventName, itemSelector, $.proxy(this._itemTitleClickHandler, this))
            },
            _itemTitleClickHandler: function(e) {
                this._itemJQueryEventHandler(e, "onItemTitleClick")
            },
            _renderSelection: function(addedSelection, removedSelection) {
                this._updateItems(addedSelection, removedSelection, true)
            },
            _updateSelection: function(addedSelection, removedSelection) {
                this._updateItems(addedSelection, removedSelection, false)
            },
            _updateItems: function(addedSelection, removedSelection, skipAnimation) {
                var $items = this._itemElements();
                $.each(addedSelection, function(_, index) {
                    $items.eq(index).addClass(ACCORDION_ITEM_OPENED_CLASS)
                });
                $.each(removedSelection, function(_, index) {
                    $items.eq(index).removeClass(ACCORDION_ITEM_OPENED_CLASS)
                });
                this._updateItemHeights(skipAnimation)
            },
            _updateItemHeights: function(skipAnimation) {
                var $items = this._itemElements();
                var itemHeight = this._splitFreeSpace(this._calculateFreeSpace());
                $.each($items, $.proxy(function(_, item) {
                    var $item = $(item),
                        $title = $item.children("." + ACCORDION_ITEM_TITLE_CLASS);
                    var startItemHeight = $item.outerHeight();
                    var finalItemHeight = $item.hasClass(ACCORDION_ITEM_OPENED_CLASS) ? itemHeight + $title.outerHeight() || $item.height("auto").outerHeight() : $title.outerHeight();
                    if (fx.isAnimating($item))
                        fx.stop($item);
                    if (!skipAnimation)
                        this._animateItem($item, startItemHeight, finalItemHeight);
                    else
                        $item.css("height", finalItemHeight)
                }, this))
            },
            _animateItem: function(element, startHeight, endHeight) {
                fx.animate(element, {
                    type: "slide",
                    from: {height: startHeight},
                    to: {height: endHeight},
                    duration: this.option("animationDuration"),
                    complete: $.proxy(function() {
                        if (this._deferredAnimate)
                            this._deferredAnimate.resolveWith(this)
                    }, this)
                })
            },
            _splitFreeSpace: function(freeSpace) {
                if (!freeSpace)
                    return freeSpace;
                return freeSpace / this.option("selectedItems").length
            },
            _calculateFreeSpace: function() {
                var height = this.option("height");
                if (height === undefined || height === "auto")
                    return;
                var $titles = this._itemTitles(),
                    itemsHeight = 0;
                $.each($titles, function(_, title) {
                    itemsHeight += $(title).outerHeight()
                });
                return this.element().height() - itemsHeight
            },
            _visibilityChanged: function(visible) {
                if (visible)
                    this._dimensionChanged()
            },
            _dimensionChanged: function() {
                this._updateItemHeights(true)
            },
            _optionChanged: function(args) {
                switch (args.name) {
                    case"animationDuration":
                    case"onItemTitleClick":
                        break;
                    case"collapsible":
                        this.option("selectionRequired", !this.option("collapsible"));
                        break;
                    case"itemTitleTemplate":
                    case"itemContentTemplate":
                    case"onItemTitleHold":
                    case"height":
                        this._invalidate();
                        break;
                    case"itemTitleRender":
                        this._itemTitleRender = null;
                        this._invalidate();
                        break;
                    case"itemContentRender":
                        this._itemContentRender = null;
                        this._invalidate();
                        break;
                    case"multiple":
                        this.option("selectionMode", args.value ? "multi" : "single");
                        break;
                    default:
                        this.callBase(args)
                }
            },
            expandItem: function(index) {
                this._deferredAnimate = $.Deferred();
                this.selectItem(index);
                return this._deferredAnimate.promise()
            },
            collapseItem: function(index) {
                this._deferredAnimate = $.Deferred();
                this.unselectItem(index);
                return this._deferredAnimate.promise()
            }
        }))
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.pager.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            utils = DX.utils,
            events = ui.events,
            Class = DX.Class;
        var PAGES_LIMITER = 4,
            PAGER_CLASS = 'dx-pager',
            PAGER_PAGE_CLASS = 'dx-page',
            PAGER_PAGES_CLASS = 'dx-pages',
            PAGER_SELECTION_CLASS = 'dx-selection',
            PAGER_PAGE_SEPARATOR_CLASS = 'dx-separator',
            PAGER_PAGE_SIZES_CLASS = 'dx-page-sizes',
            PAGER_PAGE_SIZE_CLASS = 'dx-page-size',
            PAGER_NAVIGATE_BUTTON = 'dx-navigate-button',
            PAGER_PREV_BUTTON_CLASS = "dx-prev-button",
            PAGER_NEXT_BUTTON_CLASS = "dx-next-button",
            PAGER_INFO_CLASS = "dx-info",
            PAGER_BUTTON_DISABLE_CLASS = "dx-button-disable";
        var Page = Class.inherit({
                ctor: function(value, index) {
                    var that = this;
                    that.index = index;
                    that._$page = $('<div />').text(value).addClass(PAGER_PAGE_CLASS)
                },
                value: function(value) {
                    var that = this;
                    if (utils.isDefined(value))
                        that._$page.text(value);
                    else {
                        var text = that._$page.text();
                        if (utils.isNumber(text))
                            return parseInt(text);
                        else
                            return text
                    }
                },
                select: function(value) {
                    this._$page.toggleClass(PAGER_SELECTION_CLASS, value)
                },
                render: function(rootElement, rtlEnabled) {
                    rtlEnabled ? this._$page.prependTo(rootElement) : this._$page.appendTo(rootElement)
                }
            });
        DX.registerComponent("dxPager", ui, ui.Widget.inherit({
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    visible: true,
                    pageIndex: 1,
                    maxPagesCount: 10,
                    pageCount: 10,
                    pageSize: 5,
                    showPageSizes: true,
                    pageSizes: [5, 10],
                    hasKnownLastPage: true,
                    showNavigationButtons: false,
                    showInfo: false,
                    infoText: Globalize.localize("dxPager-infoText"),
                    rtlEnabled: false,
                    pageIndexChanged: $.noop,
                    pageSizeChanged: $.noop
                })
            },
            _toggleVisibility: function(value) {
                var $element = this.element();
                if ($element)
                    $element.css("display", value ? "" : "none")
            },
            _getPages: function(currentPage, count) {
                var pages = [],
                    showMoreButton = !this.option("hasKnownLastPage"),
                    firstValue,
                    i;
                this._testPagesCount = count;
                this._testShowMoreButton = showMoreButton;
                if (count > 0 || showMoreButton)
                    if (count <= this.option("maxPagesCount")) {
                        for (i = 1; i <= count; i++)
                            pages.push(new Page(i, i - 1));
                        if (showMoreButton)
                            pages.push(new Page('>', i - 1))
                    }
                    else {
                        pages.push(new Page(1, 0));
                        firstValue = currentPage ? currentPage.value() - currentPage.index : 1;
                        for (i = 1; i <= PAGES_LIMITER; i++)
                            pages.push(new Page(firstValue + i, i));
                        pages.push(new Page(count, PAGES_LIMITER + 1));
                        if (showMoreButton)
                            pages.push(new Page('>', PAGES_LIMITER + 1))
                    }
                return pages
            },
            _getPageByValue: function(value) {
                var that = this,
                    page,
                    i;
                for (i = 0; i < that._pages.length; i++) {
                    page = that._pages[i];
                    if (page.value() === value)
                        return page
                }
            },
            _processSelectedPage: function(maxPagesCount, pageIndex, pageCount) {
                var that = this,
                    isPageIndexValid = false,
                    selectedPageIndex;
                if (that._pages) {
                    $.each(that._pages, function(key, page) {
                        if (pageIndex === page.value())
                            isPageIndexValid = true
                    });
                    if (!isPageIndexValid)
                        that.selectedPage = null
                }
                if (utils.isDefined(that.selectedPage)) {
                    if (pageIndex === pageCount && pageCount > maxPagesCount && that.selectedPage.index !== PAGES_LIMITER + 1)
                        that.selectedPage.index = PAGES_LIMITER + 1
                }
                else if (pageIndex > PAGES_LIMITER && pageIndex < pageCount) {
                    selectedPageIndex = pageCount - PAGES_LIMITER < pageIndex ? PAGES_LIMITER - (pageCount - pageIndex) + 1 : 2;
                    that.selectedPage = new Page(pageIndex, selectedPageIndex)
                }
            },
            _selectPageByValue: function(value) {
                var that = this,
                    i,
                    page = that._getPageByValue(value),
                    pages = that._pages,
                    pagesLength = pages.length,
                    prevPage,
                    nextPage,
                    morePage;
                if (!utils.isDefined(page))
                    return;
                prevPage = that._pages[page.index - 1];
                nextPage = that._pages[page.index + 1];
                if (nextPage && nextPage.value() === '>') {
                    morePage = nextPage;
                    nextPage = undefined;
                    pagesLength--;
                    pages.pop()
                }
                if (that.selectedPage)
                    that.selectedPage.select(false);
                page.select(true);
                that.selectedPage = page;
                if (nextPage && nextPage.value() - value > 1)
                    if (page.index !== 0) {
                        prevPage.value(value + 1);
                        that._pages.splice(page.index, 1);
                        that._pages.splice(page.index - 1, 0, page);
                        that._pages[page.index].index = page.index;
                        page.index = page.index - 1;
                        for (i = page.index - 1; i > 0; i--)
                            that._pages[i].value(that._pages[i + 1].value() - 1)
                    }
                    else
                        for (i = 0; i < pagesLength - 1; i++)
                            that._pages[i].value(i + 1);
                if (prevPage && value - prevPage.value() > 1)
                    if (page.index !== pagesLength - 1) {
                        nextPage.value(value - 1);
                        that._pages.splice(page.index, 1);
                        that._pages.splice(page.index + 1, 0, page);
                        that._pages[page.index].index = page.index;
                        page.index = page.index + 1;
                        for (i = page.index + 1; i < pagesLength - 1; i++)
                            that._pages[i].value(that._pages[i - 1].value() + 1)
                    }
                    else
                        for (i = 1; i <= pagesLength - 2; i++)
                            that._pages[pagesLength - 1 - i].value(that._pages[pagesLength - 1].value() - i);
                if (morePage)
                    pages.push(morePage)
            },
            _nextPage: function(direction) {
                var pageIndex = this.selectedPage && this.selectedPage.value(),
                    pageCount = this.option("pageCount");
                if (utils.isDefined(pageIndex)) {
                    pageIndex = direction === "next" ? ++pageIndex : --pageIndex;
                    if (pageIndex > 0 && pageIndex <= pageCount)
                        this.option("pageIndex", pageIndex)
                }
            },
            _renderPages: function(pages) {
                var that = this,
                    $separator,
                    pageslength = pages.length,
                    clickPagesIndexAction = that._createAction(function(args) {
                        var e = args.jQueryEvent,
                            pageNumber = $(e.target).text(),
                            pageIndex = pageNumber === '>' ? that.option("pageCount") + 1 : Number(pageNumber);
                        that._testPageIndex = pageIndex;
                        that.option("pageIndex", pageIndex)
                    }),
                    page;
                if (pageslength > 1) {
                    that._pageClickHandler = function(e) {
                        clickPagesIndexAction({jQueryEvent: e})
                    };
                    that.$pagesChooser.on(events.addNamespace("dxclick", that.Name + "Pages"), '.' + PAGER_PAGE_CLASS, that._pageClickHandler)
                }
                for (var i = 0; i < pageslength; i++) {
                    page = pages[i];
                    page.render(that.$pagesChooser, that.option('rtlEnabled'));
                    if (pages[i + 1] && pages[i + 1].value() - page.value() > 1) {
                        $separator = $("<div>. . .</div>").addClass(PAGER_PAGE_SEPARATOR_CLASS);
                        that.option('rtlEnabled') ? $separator.prependTo(that.$pagesChooser) : $separator.appendTo(that.$pagesChooser)
                    }
                }
            },
            _renderPagesChooser: function() {
                var that = this,
                    $element = that.element();
                if (!$element)
                    return;
                if (that._pages.length === 0) {
                    that.selectedPage = null;
                    return
                }
                if (utils.isDefined(that.$pagesChooser))
                    that.$pagesChooser.empty();
                else
                    that.$pagesChooser = $('<div />').addClass(PAGER_PAGES_CLASS);
                that._renderInfo();
                that._renderNavigateButton("prev");
                that._renderPages(that._pages);
                that._renderNavigateButton("next");
                if (!utils.isDefined(that.$pagesChooser[0].parentElement))
                    that.$pagesChooser.appendTo($element)
            },
            _renderPagesSizeChooser: function() {
                var that = this,
                    i,
                    $pageSize,
                    currentPageSize = that.option("pageSize"),
                    pageSizes = that.option("pageSizes"),
                    showPageSizes = that.option("showPageSizes"),
                    pageSizeValue,
                    pagesSizesLength = pageSizes && pageSizes.length,
                    $element = that.element();
                if (!$element)
                    return;
                that._clickPagesSizeAction = that._createAction(function(args) {
                    var e = args.jQueryEvent;
                    pageSizeValue = parseInt($(e.target).text());
                    that._testPageSizeIndex = pageSizeValue;
                    that.option("pageSize", pageSizeValue)
                });
                if (utils.isDefined(that.pagesSizeChooserElement))
                    that.pagesSizeChooserElement.empty();
                else
                    that.pagesSizeChooserElement = $('<div />').addClass(PAGER_PAGE_SIZES_CLASS).on(events.addNamespace("dxclick", that.Name + "PageSize"), '.' + PAGER_PAGE_SIZE_CLASS, function(e) {
                        that._clickPagesSizeAction({jQueryEvent: e})
                    });
                if (!showPageSizes || !pagesSizesLength)
                    return;
                that._testCurrentPageSize = currentPageSize;
                for (i = 0; i < pagesSizesLength; i++) {
                    $pageSize = $('<div />').text(pageSizes[i]).addClass(PAGER_PAGE_SIZE_CLASS);
                    if (currentPageSize === pageSizes[i])
                        $pageSize.addClass(PAGER_SELECTION_CLASS);
                    that.option('rtlEnabled') ? that.pagesSizeChooserElement.prepend($pageSize) : that.pagesSizeChooserElement.append($pageSize)
                }
                if (!utils.isDefined(that.pagesSizeChooserElement[0].parentElement))
                    that.pagesSizeChooserElement.appendTo($element)
            },
            _renderInfo: function() {
                var infoText = this.option("infoText");
                if (this.option("showInfo") && utils.isDefined(infoText))
                    $("<div>").addClass(PAGER_INFO_CLASS).text(utils.stringFormat(infoText, this.selectedPage && this.selectedPage.value(), this.option("pageCount"))).appendTo(this.$pagesChooser)
            },
            _renderNavigateButton: function(direction) {
                var that = this,
                    currentPageIndex,
                    clickAction = that._createAction(function(e) {
                        that._nextPage(direction)
                    }),
                    $button,
                    enabled;
                if (that.option("showNavigationButtons")) {
                    currentPageIndex = that.option("pageIndex");
                    enabled = currentPageIndex > 1 && direction === "prev" || currentPageIndex < that.option("pageCount") && direction === "next";
                    $button = $("<div>").addClass(PAGER_NAVIGATE_BUTTON).addClass(!enabled ? PAGER_BUTTON_DISABLE_CLASS : "").on(events.addNamespace("dxclick", that.Name + "Pages"), function(e) {
                        clickAction({jQueryEvent: e})
                    });
                    if (that.option("rtlEnabled")) {
                        $button.addClass(direction === "prev" ? PAGER_NEXT_BUTTON_CLASS : PAGER_PREV_BUTTON_CLASS);
                        $button.prependTo(this.$pagesChooser)
                    }
                    else {
                        $button.addClass(direction === "prev" ? PAGER_PREV_BUTTON_CLASS : PAGER_NEXT_BUTTON_CLASS);
                        $button.appendTo(this.$pagesChooser)
                    }
                }
            },
            _render: function() {
                this.callBase();
                this._update();
                this.element().addClass(PAGER_CLASS);
                this._toggleVisibility(this.option("visible"));
                this._renderPagesSizeChooser();
                this._renderPagesChooser()
            },
            _update: function() {
                var pageCount = this.option("pageCount"),
                    pageIndex = this.option("pageIndex");
                this._processSelectedPage(this.option("maxPagesCount"), pageIndex, pageCount);
                this._pages = this._getPages(this.selectedPage, pageCount);
                this._selectPageByValue(pageIndex)
            },
            _optionChanged: function(args) {
                switch (args.name) {
                    case"visible":
                        this._toggleVisibility(args.value);
                        break;
                    case"pageIndex":
                        var pageIndexChanged = this.option("pageIndexChanged");
                        if (pageIndexChanged)
                            pageIndexChanged(args.value);
                    case"maxPagesCount":
                    case"pageCount":
                    case"hasKnownLastPage":
                    case"showNavigationButtons":
                        this._update();
                        this._renderPagesChooser();
                        break;
                    case"pageSize":
                        var pageSizeChanged = this.option("pageSizeChanged");
                        if (pageSizeChanged)
                            pageSizeChanged(args.value);
                    case"pageSizes":
                        this._renderPagesSizeChooser();
                        break;
                    default:
                        this._invalidate()
                }
            },
            _clean: function() {
                this.$pagesChooser && this.$pagesChooser.off(events.addNamespace("dxclick", this.Name + "Pages"), '.' + PAGER_PAGE_CLASS, this._pageClickHandler)
            },
            getHeight: function() {
                return this.option("visible") ? this.element().outerHeight() : 0
            }
        }));
        ui.dxPager.__internals = {
            PAGER_CLASS: PAGER_CLASS,
            PAGER_PAGE_CLASS: PAGER_PAGE_CLASS,
            PAGER_PAGES_CLASS: PAGER_PAGES_CLASS,
            PAGER_SELECTION_CLASS: PAGER_SELECTION_CLASS,
            PAGER_PAGE_SEPARATOR_CLASS: PAGER_PAGE_SEPARATOR_CLASS,
            PAGER_PAGE_SIZES_CLASS: PAGER_PAGE_SIZES_CLASS,
            PAGER_PAGE_SIZE_CLASS: PAGER_PAGE_SIZE_CLASS,
            PAGER_NAVIGATE_BUTTON: PAGER_NAVIGATE_BUTTON,
            PAGER_PREV_BUTTON_CLASS: PAGER_PREV_BUTTON_CLASS,
            PAGER_NEXT_BUTTON_CLASS: PAGER_NEXT_BUTTON_CLASS,
            PAGER_INFO_CLASS: PAGER_INFO_CLASS,
            PAGER_BUTTON_DISABLE_CLASS: PAGER_BUTTON_DISABLE_CLASS
        }
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.colorView.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            events = ui.events,
            utils = DX.utils,
            translator = DX.translator;
        var COLOR_VIEW_CLASS = "dx-colorview",
            COLOR_VIEW_CONTAINER_CLASS = "dx-colorview-container",
            COLOR_VIEW_ROW_CLASS = "dx-colorview-container-row",
            COLOR_VIEW_CELL_CLASS = "dx-colorview-container-cell",
            COLOR_VIEW_PALETTE_CLASS = "dx-colorview-palette",
            COLOR_VIEW_PALETTE_CELL_CLASS = "dx-colorview-palette-cell",
            COLOR_VIEW_PALETTE_HANDLE_CLASS = "dx-colorview-palette-handle",
            COLOR_VIEW_PALETTE_GRADIENT_CLASS = "dx-colorview-palette-gradient",
            COLOR_VIEW_PALETTE_GRADIENT_WHITE_CLASS = "dx-colorview-palette-gradient-white",
            COLOR_VIEW_PALETTE_GRADIENT_BLACK_CLASS = "dx-colorview-palette-gradient-black",
            COLOR_VIEW_HUE_SCALE_CLASS = "dx-colorview-hue-scale",
            COLOR_VIEW_HUE_SCALE_CELL_CLASS = "dx-colorview-hue-scale-cell",
            COLOR_VIEW_HUE_SCALE_HANDLE_CLASS = "dx-colorview-hue-scale-handle",
            COLOR_VIEW_HUE_SCALE_WRAPPER_CLASS = "dx-colorview-hue-scale-wrapper",
            COLOR_VIEW_CONTROLS_CONTAINER_CLASS = "dx-colorview-controls-container",
            COLOR_VIEW_LABEL_PREFIX = "dx-colorview-label",
            COLOR_VIEW_RED_LABEL_CLASS = "dx-colorview-label-red",
            COLOR_VIEW_GREEN_LABEL_CLASS = "dx-colorview-label-green",
            COLOR_VIEW_BLUE_LABEL_CLASS = "dx-colorview-label-blue",
            COLOR_VIEW_HEX_LABEL_CLASS = "dx-colorview-label-hex",
            COLOR_VIEW_ALPHA_CHANNEL_PREFIX = "dx-colorview-alpha-channel",
            COLOR_VIEW_ALPHA_CHANNEL_SCALE_CLASS = "dx-colorview-alpha-channel-scale",
            COLOR_VIEW_APLHA_CHANNEL_ROW_CLASS = "dx-colorview-alpha-channel-row",
            COLOR_VIEW_ALPHA_CHANNEL_SCALE_WRAPPER_CLASS = "dx-colorview-alpha-channel-wrapper",
            COLOR_VIEW_ALPHA_CHANNEL_LABEL_CLASS = "dx-colorview-alpha-channel-label",
            COLOR_VIEW_ALPHA_CHANNEL_HANDLE_CLASS = "dx-colorview-alpha-channel-handle",
            COLOR_VIEW_ALPHA_CHANNEL_CELL_CLASS = "dx-colorview-alpha-channel-cell",
            COLOR_VIEW_ALPHA_CHANNEL_BORDER_CLASS = "dx-colorview-alpha-channel-border",
            COLOR_VIEW_COLOR_PREVIEW = "dx-colorview-color-preview",
            COLOR_VIEW_COLOR_PREVIEW_CONTAINER_CLASS = "dx-colorview-color-preview-container",
            COLOR_VIEW_COLOR_PREVIEW_CONTAINER_INNER_CLASS = "dx-colorview-color-preview-container-inner",
            COLOR_VIEW_COLOR_PREVIEW_COLOR_CURRENT = "dx-colorview-color-preview-color-current",
            COLOR_VIEW_COLOR_PREVIEW_COLOR_NEW = "dx-colorview-color-preview-color-new";
        DX.registerComponent("dxColorView", ui, ui.Editor.inherit({
            _supportedKeys: function() {
                var isRTL = this.option("rtlEnabled");
                var that = this,
                    getHorizontalPaletteStep = function() {
                        var step = 100 / that._paletteWidth;
                        step = step > 1 ? step : 1;
                        return step
                    },
                    updateHorizontalPaletteValue = function(step) {
                        that._currentColor.hsv.s += step;
                        updatePaletteValue()
                    },
                    getVerticalPaletteStep = function() {
                        var step = 100 / that._paletteHeight;
                        step = step > 1 ? step : 1;
                        return step
                    },
                    updateVerticalPaletteValue = function(step) {
                        that._currentColor.hsv.v += step;
                        updatePaletteValue()
                    },
                    updatePaletteValue = function() {
                        that._placePaletteHandle();
                        var handleLocation = translator.locate(that._$paletteHandle);
                        that._updateColorFromHsv(that._currentColor.hsv.h, that._currentColor.hsv.s, that._currentColor.hsv.v)
                    },
                    getHueScaleStep = function() {
                        var step = 360 / (that._hueScaleWrapperHeight - that._hueScaleHandleHeight);
                        step = step > 1 ? step : 1;
                        return step
                    },
                    updateHueScaleValue = function(step) {
                        that._currentColor.hsv.h += step;
                        that._placeHueScaleHandle();
                        var handleLocation = translator.locate(that._$hueScaleHandle);
                        that._updateColorHue(handleLocation.top + that._hueScaleHandleHeight / 2)
                    },
                    getAlphaScaleStep = function() {
                        var step = 1 / that._alphaChannelScaleWorkWidth;
                        step = step > 0.01 ? step : 0.01;
                        step = isRTL ? -step : step;
                        return step
                    },
                    updateAlphaScaleValue = function(step) {
                        that._currentColor.a += step;
                        that._placeAlphaChannelHandle();
                        var handleLocation = translator.locate(that._$alphaChannelHandle);
                        that._calculateColorTransparenceByScaleWidth(handleLocation.left + that._alphaChannelHandleWidth / 2)
                    };
                return $.extend(this.callBase(), {
                        upArrow: function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.ctrlKey) {
                                if (this._currentColor.hsv.h <= 360 && !this._isTopColorHue)
                                    updateHueScaleValue(getHueScaleStep())
                            }
                            else if (this._currentColor.hsv.v < 100)
                                updateVerticalPaletteValue(getVerticalPaletteStep())
                        },
                        downArrow: function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.ctrlKey) {
                                if (this._currentColor.hsv.h >= 0) {
                                    if (this._isTopColorHue)
                                        this._currentColor.hsv.h = 360;
                                    updateHueScaleValue(-getHueScaleStep())
                                }
                            }
                            else if (this._currentColor.hsv.v > 0)
                                updateVerticalPaletteValue(-getVerticalPaletteStep())
                        },
                        rightArrow: function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.ctrlKey) {
                                if (isRTL ? this._currentColor.a < 1 : this._currentColor.a > 0 && this.option("editAlphaChannel"))
                                    updateAlphaScaleValue(-getAlphaScaleStep())
                            }
                            else if (this._currentColor.hsv.s < 100)
                                updateHorizontalPaletteValue(getHorizontalPaletteStep())
                        },
                        leftArrow: function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.ctrlKey) {
                                if (isRTL ? this._currentColor.a > 0 : this._currentColor.a < 1 && this.option("editAlphaChannel"))
                                    updateAlphaScaleValue(getAlphaScaleStep())
                            }
                            else if (this._currentColor.hsv.s > 0)
                                updateHorizontalPaletteValue(-getHorizontalPaletteStep())
                        },
                        enter: function(e) {
                            if (this.option("applyValueMode") === "useButtons") {
                                var newValue = e.target.value,
                                    oldValue = this.option("editAlphaChannel") ? this._makeRgba(this.option("value")) : this.option("value");
                                if (newValue && newValue != oldValue)
                                    this._setCurrentColor(newValue);
                                this.applyColor()
                            }
                        }
                    })
            },
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    value: null,
                    editAlphaChannel: false,
                    applyValueMode: "useButtons"
                })
            },
            _defaultOptionsRules: function() {
                return this.callBase().concat([{
                            device: function(device) {
                                return DX.devices.real().generic && !DX.devices.isSimulator()
                            },
                            options: {focusStateEnabled: true}
                        }])
            },
            _init: function() {
                this.callBase();
                this._initColorAndOpacity()
            },
            _initColorAndOpacity: function() {
                this._setCurrentColor(this.option("value"))
            },
            _setCurrentColor: function(value) {
                value = value || "#000000";
                var newColor = new DX.Color(value);
                if (!newColor.colorIsInvalid) {
                    if (!this._currentColor || this._makeRgba(this._currentColor) != this._makeRgba(newColor)) {
                        this._currentColor = newColor;
                        if (this._$currentColor)
                            this._makeTransparentBackground(this._$currentColor, newColor)
                    }
                }
                else
                    this.option("value", this._currentColor.baseColor)
            },
            _render: function() {
                this.callBase();
                this.element().addClass(COLOR_VIEW_CLASS);
                this._renderColorPickerContainer()
            },
            _makeTransparentBackground: function($el, color) {
                if (!(color instanceof DX.Color))
                    color = new DX.Color(color);
                if (DX.browser.msie && DX.browser.version === "8.0")
                    $el.css({
                        background: color.toHex(),
                        filter: "progid:DXImageTransform.Microsoft.Alpha(Opacity=" + color.a * 100 + ")"
                    });
                else
                    $el.css("backgroundColor", this._makeRgba(color))
            },
            _makeRgba: function(color) {
                if (!(color instanceof DX.Color))
                    color = new DX.Color(color);
                return "rgba(" + [color.r, color.g, color.b, color.a].join(", ") + ")"
            },
            _renderValue: function() {
                this.callBase(this.option("editAlphaChannel") ? this._makeRgba(this._currentColor) : this.option("value"))
            },
            _renderColorPickerContainer: function() {
                var $parent = this.element();
                this._$colorPickerContainer = $("<div>", {
                    "class": COLOR_VIEW_CONTAINER_CLASS,
                    appendTo: $parent
                });
                this._renderHtmlRows();
                this._renderPalette();
                this._renderHueScale();
                this._renderControlsContainer();
                this._renderControls();
                this._renderAlphaChannelElements()
            },
            _renderHtmlRows: function(updatedOption) {
                var $renderedRows = this._$colorPickerContainer.find("." + COLOR_VIEW_ROW_CLASS),
                    renderedRowsCount = $renderedRows.length,
                    rowCount = this._calculateRowsCount(),
                    delta = renderedRowsCount - rowCount;
                if (delta > 0) {
                    var index = this._calculateRemovedHtmlRowIndex(renderedRowsCount, updatedOption);
                    $renderedRows.eq(index).remove()
                }
                if (delta < 0) {
                    delta = Math.abs(delta);
                    var rows = [];
                    for (var i = 0; i < delta; i++)
                        rows.push($("<div>", {"class": COLOR_VIEW_ROW_CLASS}));
                    if (renderedRowsCount) {
                        var previousRowIndex = this._calculateHtmlRowIndex(renderedRowsCount, updatedOption);
                        $renderedRows.eq(previousRowIndex).after(rows)
                    }
                    else
                        this._$colorPickerContainer.append(rows)
                }
            },
            _renderHtmlCellInsideRow: function(rowSelector, $rowParent, additionalClass) {
                return $("<div>", {
                        "class": COLOR_VIEW_CELL_CLASS,
                        addClass: additionalClass,
                        appendTo: $rowParent.find("." + COLOR_VIEW_ROW_CLASS + rowSelector)
                    })
            },
            _calculateRowsCount: function() {
                if (this.option("editAlphaChannel"))
                    return this.option("applyValueMode") === "instantly" ? 2 : 3;
                return this.option("applyValueMode") === "instantly" ? 1 : 2
            },
            _calculateRemovedHtmlRowIndex: function(renderedRowsCount, updatedOption) {
                var index = -1;
                if (renderedRowsCount === 3) {
                    if (updatedOption === "editAlphaChannel")
                        index = -2;
                    if (updatedOption === "applyValueMode")
                        index = -1
                }
                return index
            },
            _calculateHtmlRowIndex: function(renderedRowsCount, updatedOption) {
                var index = 0;
                if (renderedRowsCount === 2)
                    if (updatedOption === "applyValueMode")
                        index = 1;
                return index
            },
            _renderPalette: function() {
                var $paletteCell = this._renderHtmlCellInsideRow(":first", this._$colorPickerContainer, COLOR_VIEW_PALETTE_CELL_CLASS),
                    $paletteGradientWhite = $("<div>", {"class": [COLOR_VIEW_PALETTE_GRADIENT_CLASS, COLOR_VIEW_PALETTE_GRADIENT_WHITE_CLASS].join(" ")}),
                    $paletteGradientBlack = $("<div>", {"class": [COLOR_VIEW_PALETTE_GRADIENT_CLASS, COLOR_VIEW_PALETTE_GRADIENT_BLACK_CLASS].join(" ")});
                this._$palette = $("<div>", {
                    "class": COLOR_VIEW_PALETTE_CLASS,
                    css: {backgroundColor: this._currentColor.getPureColor().toHex()},
                    appendTo: $paletteCell
                });
                this._paletteHeight = this._$palette.height();
                this._paletteWidth = this._$palette.width();
                this._renderPaletteHandle();
                this._$palette.append([$paletteGradientWhite, $paletteGradientBlack])
            },
            _renderPaletteHandle: function() {
                this._$paletteHandle = $("<div>", {
                    "class": COLOR_VIEW_PALETTE_HANDLE_CLASS,
                    appendTo: this._$palette
                }).dxDraggable({
                    area: this._$palette,
                    allowMoveByClick: true,
                    boundOffset: $.proxy(function() {
                        return -this._paletteHandleHeight / 2
                    }, this),
                    onDrag: $.proxy(function(e) {
                        var paletteHandlePosition = translator.locate(this._$paletteHandle);
                        this._updateByDrag = true;
                        this._updateColorFromHsv(this._currentColor.hsv.h, this._calculateColorSaturation(paletteHandlePosition), this._calculateColorValue(paletteHandlePosition))
                    }, this)
                });
                this._paletteHandleWidth = this._$paletteHandle.width();
                this._paletteHandleHeight = this._$paletteHandle.height();
                this._placePaletteHandle()
            },
            _placePaletteHandle: function() {
                translator.move(this._$paletteHandle, {
                    left: Math.round(this._paletteWidth * this._currentColor.hsv.s / 100 - this._paletteHandleWidth / 2),
                    top: Math.round(this._paletteHeight - this._paletteHeight * this._currentColor.hsv.v / 100 - this._paletteHandleHeight / 2)
                })
            },
            _calculateColorValue: function(paletteHandlePosition) {
                var value = Math.floor(paletteHandlePosition.top + this._paletteHandleHeight / 2);
                return 100 - Math.round(value * 100 / this._paletteHeight)
            },
            _calculateColorSaturation: function(paletteHandlePosition) {
                var saturation = Math.floor(paletteHandlePosition.left + this._paletteHandleWidth / 2);
                return Math.round(saturation * 100 / this._paletteWidth)
            },
            _updateColorFromHsv: function(hue, saturation, value) {
                var a = this._currentColor.a;
                this._currentColor = new DX.Color("hsv(" + [hue, saturation, value].join(",") + ")");
                this._currentColor.a = a;
                this._updateColorParamsAndColorPreview();
                if (this.option("applyValueMode") === "instantly")
                    this.applyColor()
            },
            _renderHueScale: function() {
                var $hueScaleCell = this._renderHtmlCellInsideRow(":first", this._$colorPickerContainer, COLOR_VIEW_HUE_SCALE_CELL_CLASS);
                this._$hueScaleWrapper = $("<div>", {
                    "class": COLOR_VIEW_HUE_SCALE_WRAPPER_CLASS,
                    appendTo: $hueScaleCell
                });
                this._$hueScale = $("<div>", {
                    "class": COLOR_VIEW_HUE_SCALE_CLASS,
                    appendTo: this._$hueScaleWrapper
                });
                this._hueScaleHeight = this._$hueScale.height();
                this._hueScaleWrapperHeight = this._$hueScaleWrapper.outerHeight();
                this._renderHueScaleHandle()
            },
            _renderHueScaleHandle: function() {
                this._$hueScaleHandle = $("<div>", {
                    "class": COLOR_VIEW_HUE_SCALE_HANDLE_CLASS,
                    appendTo: this._$hueScaleWrapper
                }).dxDraggable({
                    area: this._$hueScaleWrapper,
                    allowMoveByClick: true,
                    direction: "vertical",
                    onDrag: $.proxy(function(e) {
                        this._updateByDrag = true;
                        this._updateColorHue(translator.locate(this._$hueScaleHandle).top + this._hueScaleHandleHeight / 2)
                    }, this)
                });
                this._hueScaleHandleHeight = this._$hueScaleHandle.height();
                this._placeHueScaleHandle()
            },
            _placeHueScaleHandle: function() {
                var hueScaleHeight = this._hueScaleWrapperHeight,
                    handleHeight = this._hueScaleHandleHeight,
                    top = (hueScaleHeight - handleHeight) * (360 - this._currentColor.hsv.h) / 360;
                if (hueScaleHeight < top + handleHeight)
                    top = hueScaleHeight - handleHeight;
                if (top < 0)
                    top = 0;
                translator.move(this._$hueScaleHandle, {top: Math.round(top)})
            },
            _updateColorHue: function(handlePosition) {
                var hue = 360 - Math.round((handlePosition - this._hueScaleHandleHeight / 2) * 360 / (this._hueScaleWrapperHeight - this._hueScaleHandleHeight)),
                    saturation = this._currentColor.hsv.s,
                    value = this._currentColor.hsv.v;
                this._isTopColorHue = false;
                hue = hue < 0 ? 0 : hue;
                if (hue >= 360) {
                    this._isTopColorHue = true;
                    hue = 0
                }
                this._updateColorFromHsv(hue, saturation, value);
                this._$palette.css("backgroundColor", this._currentColor.getPureColor().toHex())
            },
            _renderControlsContainer: function() {
                var $controlsContainerCell = this._renderHtmlCellInsideRow(":first", this._$colorPickerContainer);
                this._$controlsContainer = $("<div>", {
                    "class": COLOR_VIEW_CONTROLS_CONTAINER_CLASS,
                    appendTo: $controlsContainerCell
                })
            },
            _renderControls: function() {
                this._renderColorsPreview();
                this._renderRgbInputs();
                this._renderHexInput()
            },
            _renderColorsPreview: function() {
                var $colorsPreviewContainer = $("<div>", {
                        "class": COLOR_VIEW_COLOR_PREVIEW_CONTAINER_CLASS,
                        appendTo: this._$controlsContainer
                    }),
                    $colorsPreviewContainerInner = $("<div>", {
                        "class": COLOR_VIEW_COLOR_PREVIEW_CONTAINER_INNER_CLASS,
                        appendTo: $colorsPreviewContainer
                    });
                this._$currentColor = $("<div>", {"class": [COLOR_VIEW_COLOR_PREVIEW, COLOR_VIEW_COLOR_PREVIEW_COLOR_CURRENT].join(" ")});
                this._$newColor = $("<div>", {"class": [COLOR_VIEW_COLOR_PREVIEW, COLOR_VIEW_COLOR_PREVIEW_COLOR_NEW].join(" ")});
                this._makeTransparentBackground(this._$currentColor, this._currentColor);
                this._makeTransparentBackground(this._$newColor, this._currentColor);
                $colorsPreviewContainerInner.append([this._$currentColor, this._$newColor])
            },
            _renderAlphaChannelElements: function() {
                if (this.option("editAlphaChannel")) {
                    this._$colorPickerContainer.find("." + COLOR_VIEW_ROW_CLASS).eq(1).addClass(COLOR_VIEW_APLHA_CHANNEL_ROW_CLASS);
                    this._renderAlphaChannelScale();
                    this._renderAlphaChannelInput()
                }
            },
            _renderRgbInputs: function() {
                this._rgbInputsWithLabels = [this._renderEditorWithLabel({
                        editorType: "dxNumberBox",
                        value: this._currentColor.r,
                        onValueChanged: $.proxy(this._updateColor, this, false),
                        labelText: "R",
                        labelClass: COLOR_VIEW_RED_LABEL_CLASS
                    }), this._renderEditorWithLabel({
                        editorType: "dxNumberBox",
                        value: this._currentColor.g,
                        onValueChanged: $.proxy(this._updateColor, this, false),
                        labelText: "G",
                        labelClass: COLOR_VIEW_GREEN_LABEL_CLASS
                    }), this._renderEditorWithLabel({
                        editorType: "dxNumberBox",
                        value: this._currentColor.b,
                        onValueChanged: $.proxy(this._updateColor, this, false),
                        labelText: "B",
                        labelClass: COLOR_VIEW_BLUE_LABEL_CLASS
                    })];
                this._$controlsContainer.append(this._rgbInputsWithLabels);
                this._rgbInputs = [this._rgbInputsWithLabels[0].find(".dx-numberbox").dxNumberBox("instance"), this._rgbInputsWithLabels[1].find(".dx-numberbox").dxNumberBox("instance"), this._rgbInputsWithLabels[2].find(".dx-numberbox").dxNumberBox("instance")]
            },
            _renderEditorWithLabel: function(options) {
                var $editor = $("<div>"),
                    $label = $("<label>", {
                        "class": options.labelClass,
                        text: options.labelText + ":",
                        append: $editor
                    }).off("dxclick").on("dxclick", function(e) {
                        e.preventDefault()
                    }),
                    editorType = options.editorType,
                    editorOptions = {
                        value: options.value,
                        onValueChanged: options.onValueChanged
                    };
                if (editorType === "dxNumberBox") {
                    editorOptions.min = options.min || 0;
                    editorOptions.max = options.max || 255;
                    editorOptions.step = options.step || 1
                }
                $editor[editorType](editorOptions);
                return $label
            },
            _renderHexInput: function() {
                this._hexInput = this._renderEditorWithLabel({
                    editorType: "dxTextBox",
                    value: this._currentColor.toHex().replace("#", ""),
                    onValueChanged: $.proxy(this._updateColor, this, true),
                    labelClass: COLOR_VIEW_HEX_LABEL_CLASS,
                    labelText: "#"
                }).appendTo(this._$controlsContainer).find(".dx-textbox").dxTextBox("instance")
            },
            _renderAlphaChannelScale: function() {
                var $alphaChannelScaleCell = this._renderHtmlCellInsideRow(":eq(1)", this._$colorPickerContainer, COLOR_VIEW_ALPHA_CHANNEL_CELL_CLASS),
                    $alphaChannelBorder = $("<div>", {
                        "class": COLOR_VIEW_ALPHA_CHANNEL_BORDER_CLASS,
                        appendTo: $alphaChannelScaleCell
                    }),
                    $alphaChannelScaleWrapper = $("<div>", {
                        "class": COLOR_VIEW_ALPHA_CHANNEL_SCALE_WRAPPER_CLASS,
                        appendTo: $alphaChannelBorder
                    });
                this._$alphaChannelScale = $("<div>", {
                    "class": COLOR_VIEW_ALPHA_CHANNEL_SCALE_CLASS,
                    appendTo: $alphaChannelScaleWrapper
                });
                this._makeCSSLinearGradient(this._$alphaChannelScale);
                this._renderAlphaChannelHandle($alphaChannelScaleCell)
            },
            _makeCSSLinearGradient: function($el) {
                var color = this._currentColor,
                    colorAsRgb = [color.r, color.g, color.b].join(","),
                    colorAsHex = color.toHex().replace("#", "");
                var combineGradientString = function(colorAsRgb, colorAsHex) {
                        var rtlEnabled = this.option("rtlEnabled"),
                            startColor = "rgba(" + colorAsRgb + ", " + (rtlEnabled ? "1" : "0") + ")",
                            finishColor = "rgba(" + colorAsRgb + ", " + (rtlEnabled ? "0" : "1") + ")",
                            startColorIE = "'#" + (rtlEnabled ? "00" : "") + colorAsHex + "'",
                            finishColorIE = "'#" + (rtlEnabled ? "" : "00") + colorAsHex + "'";
                        return ["background-image: -webkit-linear-gradient(180deg, " + startColor + ", " + finishColor + ")", "background-image: -moz-linear-gradient(-90deg, " + startColor + ", " + finishColor + ")", "background-image: -ms-linear-gradient(-90deg, " + startColor + ", " + finishColor + ")", "background-image: -o-linear-gradient(-90deg, " + startColor + ", " + finishColor + ")", "background-image: linear-gradient(-90deg, " + startColor + ", " + finishColor + ")", "filter: progid:DXImageTransform.Microsoft.gradient(GradientType=1,startColorstr=" + startColorIE + ", endColorstr=" + finishColorIE + ")", "-ms-filter: progid:DXImageTransform.Microsoft.gradient(GradientType=1,startColorstr=" + startColorIE + ", endColorstr=" + finishColorIE + ")"].join(";")
                    };
                $el.attr("style", combineGradientString.call(this, colorAsRgb, colorAsHex))
            },
            _renderAlphaChannelInput: function() {
                var that = this,
                    $alphaChannelInputCell = this._renderHtmlCellInsideRow(":eq(1)", this._$colorPickerContainer);
                that._alphaChannelInput = this._renderEditorWithLabel({
                    editorType: "dxNumberBox",
                    value: this._currentColor.a,
                    max: 1,
                    step: 0.1,
                    onValueChanged: function(e) {
                        var value = e.value;
                        value = that._currentColor.isValidAlpha(value) ? value : that._currentColor.a;
                        that._updateColorTransparence(value);
                        that._placeAlphaChannelHandle()
                    },
                    labelClass: COLOR_VIEW_ALPHA_CHANNEL_LABEL_CLASS,
                    labelText: "Alpha"
                }).appendTo($alphaChannelInputCell).find(".dx-numberbox").dxNumberBox("instance")
            },
            _updateColorTransparence: function(transparence) {
                this._currentColor.a = transparence;
                this._makeTransparentBackground(this._$newColor, this._currentColor);
                if (this.option("applyValueMode") === "instantly")
                    this.applyColor()
            },
            _renderAlphaChannelHandle: function($parent) {
                this._$alphaChannelHandle = $("<div>", {
                    "class": COLOR_VIEW_ALPHA_CHANNEL_HANDLE_CLASS,
                    appendTo: $parent
                }).dxDraggable({
                    area: $parent,
                    allowMoveByClick: true,
                    direction: "horizontal",
                    onDrag: $.proxy(function(e) {
                        this._updateByDrag = true;
                        var $alphaChannelHandle = this._$alphaChannelHandle,
                            alphaChannelHandlePosition = translator.locate($alphaChannelHandle).left + this._alphaChannelHandleWidth / 2;
                        this._calculateColorTransparenceByScaleWidth(alphaChannelHandlePosition)
                    }, this)
                });
                this._alphaChannelHandleWidth = this._$alphaChannelHandle.width();
                this._alphaChannelScaleWorkWidth = $parent.width() - this._alphaChannelHandleWidth;
                this._placeAlphaChannelHandle()
            },
            _calculateColorTransparenceByScaleWidth: function(handlePosition) {
                var transparence = (handlePosition - this._alphaChannelHandleWidth / 2) / this._alphaChannelScaleWorkWidth,
                    rtlEnabled = this.option("rtlEnabled");
                transparence = rtlEnabled ? transparence : 1 - transparence;
                if (handlePosition >= this._alphaChannelScaleWorkWidth + this._alphaChannelHandleWidth / 2)
                    transparence = rtlEnabled ? 1 : 0;
                else if (transparence < 1)
                    transparence = transparence.toFixed(2);
                this._alphaChannelInput.option("value", transparence)
            },
            _placeAlphaChannelHandle: function() {
                var left = this._alphaChannelScaleWorkWidth * (1 - this._currentColor.a);
                if (left < 0)
                    left = 0;
                if (this._alphaChannelScaleWorkWidth < left)
                    left = this._alphaChannelScaleWorkWidth;
                translator.move(this._$alphaChannelHandle, {left: this.option("rtlEnabled") ? this._alphaChannelScaleWorkWidth - left : left})
            },
            applyColor: function() {
                var colorValue = this.option("editAlphaChannel") ? this._makeRgba(this._currentColor) : this._currentColor.toHex();
                this._makeTransparentBackground(this._$currentColor, this._currentColor);
                this.option("value", colorValue)
            },
            cancelColor: function() {
                this._initColorAndOpacity();
                this._refreshMarkup()
            },
            _updateColor: function(isHex) {
                var rgba,
                    newColor;
                if (isHex)
                    newColor = this._validateHex("#" + this._hexInput.option("value"));
                else {
                    rgba = this._validateRgb();
                    if (this._alphaChannelInput) {
                        rgba.push(this._alphaChannelInput.option("value"));
                        newColor = "rgba(" + rgba.join(", ") + ")"
                    }
                    else
                        newColor = "rgb(" + rgba.join(", ") + ")"
                }
                if (!this._suppressEditorsValueUpdating) {
                    this._currentColor = new DX.Color(newColor);
                    this._refreshMarkup();
                    if (this.option("applyValueMode") === "instantly")
                        this.applyColor()
                }
            },
            _validateHex: function(hex) {
                return this._currentColor.isValidHex(hex) ? hex : this._currentColor.toHex()
            },
            _validateRgb: function() {
                var r = this._rgbInputs[0].option("value"),
                    g = this._rgbInputs[1].option("value"),
                    b = this._rgbInputs[2].option("value");
                if (!this._currentColor.isValidRGB(r, g, b)) {
                    r = this._currentColor.r;
                    g = this._currentColor.g;
                    b = this._currentColor.b
                }
                return [r, g, b]
            },
            _refreshMarkup: function() {
                this._placeHueScaleHandle();
                this._placePaletteHandle();
                this._updateColorParamsAndColorPreview();
                this._$palette.css("backgroundColor", this._currentColor.getPureColor().toHex());
                if (this._$alphaChannelHandle) {
                    this._updateColorTransparence(this._currentColor.a);
                    this._placeAlphaChannelHandle()
                }
            },
            _updateColorParamsAndColorPreview: function() {
                this._suppressEditorsValueUpdating = true;
                this._hexInput.option("value", this._currentColor.toHex().replace("#", ""));
                this._rgbInputs[0].option("value", this._currentColor.r);
                this._rgbInputs[1].option("value", this._currentColor.g);
                this._rgbInputs[2].option("value", this._currentColor.b);
                this._suppressEditorsValueUpdating = false;
                this._makeTransparentBackground(this._$newColor, this._currentColor);
                if (this.option("editAlphaChannel")) {
                    this._makeCSSLinearGradient.call(this, this._$alphaChannelScale);
                    this._alphaChannelInput.option("value", this._currentColor.a)
                }
            },
            _optionChanged: function(args) {
                var value = args.value;
                switch (args.name) {
                    case"value":
                        this._setCurrentColor(value);
                        if (!this._updateByDrag)
                            this._refreshMarkup();
                        this._updateByDrag = false;
                        this.callBase(args);
                        break;
                    case"editAlphaChannel":
                        if (this._$colorPickerContainer) {
                            this._renderHtmlRows("editAlphaChannel");
                            this._renderAlphaChannelElements()
                        }
                        break;
                    case"applyValueMode":
                        if (this._$colorPickerContainer)
                            this._renderHtmlRows("applyValueMode");
                        break;
                    default:
                        this.callBase(args)
                }
            }
        }))
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.colorBox.js */
    (function($, DX, undefined) {
        var ui = DX.ui;
        var COLOR_BOX_CLASS = "dx-colorbox",
            COLOR_BOX_INPUT_CLASS = COLOR_BOX_CLASS + "-input",
            COLOR_BOX_INPUT_CONTAINER_CLASS = COLOR_BOX_INPUT_CLASS + "-container",
            COLOR_BOX_COLOR_RESULT_PREVIEW_CLASS = COLOR_BOX_CLASS + "-color-result-preview",
            COLOR_BOX_COLOR_IS_NOT_DEFINED = COLOR_BOX_CLASS + "-color-is-not-defined",
            COLOR_BOX_OVERLAY_CLASS = COLOR_BOX_CLASS + "-overlay",
            COLOR_BOX_CONTAINER_CELL_CLASS = "dx-colorview-container-cell",
            COLOR_BOX_BUTTON_CELL_CLASS = "dx-colorview-button-cell",
            COLOR_BOX_BUTTONS_CONTAINER_CLASS = "dx-colorview-buttons-container",
            COLOR_BOX_APPLY_BUTTON_CLASS = "dx-colorview-apply-button",
            COLOR_BOX_CANCEL_BUTTON_CLASS = "dx-colorview-cancel-button";
        var colorEditorPrototype = ui.dxColorView.prototype,
            colorUtils = {
                makeTransparentBackground: $.proxy(colorEditorPrototype._makeTransparentBackground, colorEditorPrototype),
                makeRgba: $.proxy(colorEditorPrototype._makeRgba, colorEditorPrototype)
            };
        DX.registerComponent("dxColorBox", ui, ui.dxDropDownEditor.inherit({
            _supportedKeys: function() {
                var arrowHandler = function(e) {
                        e.stopPropagation();
                        if (this.option("opened")) {
                            e.preventDefault();
                            return true
                        }
                    };
                var upArrowHandler = function(e) {
                        if (!this.option("opened")) {
                            e.preventDefault();
                            return false
                        }
                        if (e.altKey) {
                            this.close();
                            return false
                        }
                        return true
                    };
                var downArrowHandler = function(e) {
                        if (!this.option("opened") && !e.altKey) {
                            e.preventDefault();
                            return false
                        }
                        if (!this.option("opened") && e.altKey) {
                            this._validatedOpening();
                            return false
                        }
                        return true
                    };
                return $.extend(this.callBase(), {
                        tab: function(e) {
                            if (this.option("opened")) {
                                e.preventDefault();
                                this._colorView._rgbInputs[0].focus()
                            }
                        },
                        enter: function(e) {
                            if (this.option("opened")) {
                                e.preventDefault();
                                this.close()
                            }
                            return true
                        },
                        leftArrow: arrowHandler,
                        rightArrow: arrowHandler,
                        upArrow: upArrowHandler,
                        downArrow: downArrowHandler
                    })
            },
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    editAlphaChannel: false,
                    applyButtonText: Globalize.localize("OK"),
                    cancelButtonText: Globalize.localize("Cancel"),
                    applyValueMode: "useButtons",
                    onApplyButtonClick: null,
                    onCancelButtonClick: null,
                    buttonsLocation: "bottom after"
                })
            },
            _defaultOptionsRules: function() {
                return this.callBase().concat([{
                            device: function(device) {
                                return DX.devices.real().generic && !DX.devices.isSimulator()
                            },
                            options: {focusStateEnabled: true}
                        }])
            },
            _popupConfig: function() {
                return $.extend(this.callBase(), {
                        height: "auto",
                        width: ""
                    })
            },
            _contentReadyHandler: function() {
                this._createColorView();
                var $popupBottom = this._popup.bottomToolbar();
                if ($popupBottom) {
                    $popupBottom.addClass(COLOR_BOX_CONTAINER_CELL_CLASS).addClass(COLOR_BOX_BUTTON_CELL_CLASS).find(".dx-toolbar-items-container").addClass(COLOR_BOX_BUTTONS_CONTAINER_CLASS);
                    $popupBottom.find(".dx-popup-done").addClass(COLOR_BOX_APPLY_BUTTON_CLASS);
                    $popupBottom.find(".dx-popup-cancel").addClass(COLOR_BOX_CANCEL_BUTTON_CLASS)
                }
            },
            _createColorView: function() {
                var that = this;
                this._popup.overlayContent().addClass(COLOR_BOX_OVERLAY_CLASS);
                var $colorView = $("<div>").appendTo(this._popup.content());
                this._colorView = this._createComponent($colorView, "dxColorView", this._colorViewConfig());
                $colorView.on("focus", $.proxy(function() {
                    this.focus()
                }, this))
            },
            _colorViewConfig: function() {
                var that = this,
                    isAttachKeyboardEvent = that.option("focusStateEnabled") && !that.option("disabled");
                return {
                        value: that.option("value"),
                        editAlphaChannel: that.option("editAlphaChannel"),
                        applyValueMode: that.option("applyValueMode"),
                        rtlEnabled: that.option("rtlEnabled"),
                        focusStateEnabled: that.option("focusStateEnabled"),
                        onValueChanged: function(args) {
                            var value = args.value;
                            that.option("value", value);
                            if (value)
                                colorUtils.makeTransparentBackground(that._$colorResultPreview, value)
                        },
                        _keyboardProcessor: isAttachKeyboardEvent ? that._keyboardProcessor.attachChildProcessor() : null
                    }
            },
            _applyButtonHandler: function() {
                this._colorView.applyColor();
                if ($.isFunction(this.option("onApplyButtonClick")))
                    this.option("onApplyButtonClick")();
                this.callBase()
            },
            _cancelButtonHandler: function() {
                this._colorView.cancelColor();
                if ($.isFunction(this.option("onCancelButtonClick")))
                    this.option("onCancelButtonClick")();
                this.callBase()
            },
            _attachChildKeyboardEvents: function() {
                var child = this._keyboardProcessor.attachChildProcessor();
                if (this._colorView) {
                    this._colorView.option("_keyboardProcessor", child);
                    return
                }
            },
            _init: function() {
                this.callBase()
            },
            _render: function() {
                this.callBase();
                this.element().addClass(COLOR_BOX_CLASS)
            },
            _renderInput: function() {
                this.callBase();
                this.element().wrapInner($("<div/>").addClass(COLOR_BOX_INPUT_CONTAINER_CLASS));
                this._$colorBoxInputContainer = this.element().children().eq(0);
                this._$colorResultPreview = $("<div>", {
                    "class": COLOR_BOX_COLOR_RESULT_PREVIEW_CLASS,
                    appendTo: this._$colorBoxInputContainer
                });
                if (!this.option("value"))
                    this._$colorBoxInputContainer.addClass(COLOR_BOX_COLOR_IS_NOT_DEFINED);
                else
                    colorUtils.makeTransparentBackground(this._$colorResultPreview, this.option("value"));
                this._input().addClass(COLOR_BOX_INPUT_CLASS)
            },
            _renderValue: function() {
                var value = this.option("value");
                this.option("text", this.option("editAlphaChannel") ? colorUtils.makeRgba(value) : value);
                this.callBase()
            },
            _valueChangeEventHandler: function(e) {
                var value = this._input().val();
                if (value) {
                    var newColor = new DX.Color(value);
                    if (newColor.colorIsInvalid) {
                        value = this.option("value");
                        this._input().val(value)
                    }
                    if (this._colorView) {
                        this._colorView._setCurrentColor(value);
                        this._colorView._refreshMarkup()
                    }
                }
                this.callBase(e, value)
            },
            _optionChanged: function(args) {
                var value = args.value,
                    name = args.name;
                switch (name) {
                    case"value":
                        this._$colorBoxInputContainer.toggleClass(COLOR_BOX_COLOR_IS_NOT_DEFINED, !value);
                        if (value)
                            colorUtils.makeTransparentBackground(this._$colorResultPreview, value);
                        else
                            this._$colorResultPreview.removeAttr("style");
                        if (this._colorView)
                            this._colorView.option("value", value);
                        this.callBase(args);
                        break;
                    case"applyButtonText":
                    case"cancelButtonText":
                    case"editAlphaChannel":
                    case"onCancelButtonClick":
                    case"onApplyButtonClick":
                        if (this._colorView)
                            this._colorView.option(name, value);
                        break;
                    case"applyValueMode":
                        if (this._colorView)
                            this._colorView.option(name, value);
                        this.callBase(args);
                        break;
                    case"rtlEnabled":
                        if (this._colorView)
                            this._colorView.option(name, value);
                        this.callBase(args);
                        break;
                    default:
                        this.callBase(args)
                }
            }
        }));
        DX.registerComponent("dxColorPicker", ui, ui.dxColorBox.inherit({ctor: function() {
                DX.log("W0000", this.NAME, "14.2", "Use 'dxColorBox' instead");
                this.callBase.apply(this, arguments)
            }}));
        ui.dxColorBox.__internals = {
            COLOR_BOX_CLASS: COLOR_BOX_CLASS,
            COLOR_BOX_INPUT_CLASS: COLOR_BOX_INPUT_CLASS,
            COLOR_BOX_INPUT_CONTAINER_CLASS: COLOR_BOX_INPUT_CONTAINER_CLASS,
            COLOR_BOX_COLOR_RESULT_PREVIEW_CLASS: COLOR_BOX_COLOR_RESULT_PREVIEW_CLASS,
            COLOR_BOX_COLOR_IS_NOT_DEFINED: COLOR_BOX_COLOR_IS_NOT_DEFINED,
            COLOR_BOX_OVERLAY_CLASS: COLOR_BOX_OVERLAY_CLASS
        }
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.menuBase.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            utils = DX.utils,
            events = ui.events;
        var DX_MENU_CLASS = 'dx-menu',
            DX_MENU_BASE_CLASS = 'dx-menu-base',
            DX_MENU_ITEM_CLASS = DX_MENU_CLASS + '-item',
            DX_MENU_SELECTED_ITEM_CLASS = DX_MENU_ITEM_CLASS + '-selected',
            DX_MENU_ITEM_WRAPPER_CLASS = DX_MENU_ITEM_CLASS + '-wrapper',
            DX_MENU_ITEMS_CONTAINER_CLASS = DX_MENU_CLASS + '-items-container',
            DX_MENU_ITEM_EXPANDED_CLASS = DX_MENU_ITEM_CLASS + '-expanded',
            DX_MENU_SEPARATOR_CLASS = DX_MENU_CLASS + '-separator',
            DX_MENU_ITEM_LAST_GROUP_ITEM = DX_MENU_CLASS + '-last-group-item',
            DX_ITEM_HAS_TEXT = DX_MENU_ITEM_CLASS + '-has-text',
            DX_ITEM_HAS_ICON = DX_MENU_ITEM_CLASS + '-has-icon',
            DX_ITEM_HAS_SUBMENU = DX_MENU_ITEM_CLASS + '-has-submenu',
            DX_STATE_DISABLED_CLASS = 'dx-state-disabled',
            DX_MENU_ITEM_CLASS_SELECTOR = '.' + DX_MENU_ITEM_CLASS,
            DX_ITEM_SELECTED_SELECTOR = '.' + DX_MENU_SELECTED_ITEM_CLASS,
            SINGLE_SELECTION_MODE = 'single',
            NONE_SELECTION_MODE = 'none',
            FIRST_SUBMENU_LEVEL = 1;
        var dxMenuBase = ui.CollectionWidget.inherit({
                NAME: "dxMenuBase",
                _setDefaultOptions: function() {
                    this.callBase();
                    this.option({
                        items: [],
                        cssClass: '',
                        activeStateEnabled: true,
                        showSubmenuMode: 'onHover',
                        animation: {
                            show: {
                                type: "fade",
                                from: 0,
                                to: 1,
                                duration: 100
                            },
                            hide: {
                                type: 'fade',
                                from: 1,
                                to: 0,
                                duration: 100
                            }
                        },
                        selectionByClick: false,
                        selectionMode: 'none',
                        focusOnSelectedItem: false,
                        _remoteSelectionSync: false,
                        hoverStateEnabled: true
                    })
                },
                _defaultOptionsRules: function() {
                    return this.callBase().concat([{
                                device: function(device) {
                                    return DX.devices.real().generic && !DX.devices.isSimulator()
                                },
                                options: {focusStateEnabled: true}
                            }])
                },
                _activeStateUnit: DX_MENU_ITEM_CLASS_SELECTOR,
                _itemDataKey: function() {
                    return 'dxMenuItemDataKey'
                },
                _itemClass: function() {
                    return DX_MENU_ITEM_CLASS
                },
                _selectedItemClass: function() {
                    return DX_MENU_SELECTED_ITEM_CLASS
                },
                _focusTarget: function() {
                    return this._itemContainer()
                },
                _eventBindingTarget: function() {
                    return this._itemContainer()
                },
                _supportedKeys: function() {
                    var selectItem = function(e) {
                            var $item = this.option("focusedElement");
                            if (!$item || !this._isSelectionEnabled())
                                return;
                            this.selectItem($item)
                        };
                    return $.extend(this.callBase(), {
                            space: selectItem,
                            pageUp: $.noop,
                            pageDown: $.noop
                        })
                },
                _isSelectionEnabled: function() {
                    return this._getSelectionMode() === SINGLE_SELECTION_MODE
                },
                _getSelectionMode: function() {
                    return this.option('selectionMode') === SINGLE_SELECTION_MODE ? SINGLE_SELECTION_MODE : NONE_SELECTION_MODE
                },
                _init: function() {
                    this.callBase();
                    this._initActions()
                },
                _initActions: $.noop,
                _render: function() {
                    var $element = this.element();
                    this.callBase(arguments);
                    this._addCustomCssClass($element);
                    this._itemContainer().addClass(DX_MENU_BASE_CLASS)
                },
                _getShowSubmenuMode: function() {
                    return this._isDesktopDevice() ? this.option("showSubmenuMode") : "onClick"
                },
                _isDesktopDevice: function() {
                    return DX.devices.real().deviceType === "desktop"
                },
                _initEditStrategy: function() {
                    var strategy = ui.CollectionWidget.MenuBaseEditStrategy;
                    this._editStrategy = new strategy(this)
                },
                _addCustomCssClass: function($element) {
                    $element.addClass(this.option('cssClass'))
                },
                _itemWrapperSelector: function() {
                    return '.' + DX_MENU_ITEM_WRAPPER_CLASS
                },
                _hoverStartHandler: function(e) {
                    var showSubmenuMode = this._getShowSubmenuMode(),
                        $itemElement = this._getItemElementByEventArgs(e),
                        isItemDisabled;
                    if ($itemElement) {
                        if (this._isItemDisabled($itemElement))
                            return;
                        e.stopPropagation();
                        this.option("focusedElement", $itemElement);
                        if (showSubmenuMode === 'onHover')
                            this._showSubmenu($itemElement);
                        else if (showSubmenuMode === 'onHoverStay')
                            setTimeout($.proxy(this._showSubmenuOnHoverStay, this), 300, $itemElement)
                    }
                },
                _isItemDisabled: function($item) {
                    return $item.data(this._itemDataKey()).disabled
                },
                _showSubmenuOnHoverStay: function($itemElement) {
                    if ($itemElement.hasClass('dx-state-focused'))
                        this._showSubmenu($itemElement)
                },
                _showSubmenu: function($itemElement) {
                    $itemElement.addClass(DX_MENU_ITEM_EXPANDED_CLASS)
                },
                _getItemElementByEventArgs: function(eventArgs) {
                    var $target = $(eventArgs.target),
                        currentTarget = eventArgs.currentTarget;
                    if ($target.hasClass(this._itemClass()) || $target.get(0) === currentTarget)
                        return $target;
                    while (!$target.hasClass(this._itemClass())) {
                        $target = $target.parent();
                        if ($target.hasClass("dx-submenu"))
                            return null
                    }
                    return $target
                },
                _hoverEndHandler: $.noop,
                _hasSubmenu: function(item) {
                    return item.items && item.items.length > 0
                },
                _renderItems: function(items, submenuLevel, submenuContainer) {
                    var that = this,
                        $itemsContainer,
                        submenuLevel = submenuLevel || FIRST_SUBMENU_LEVEL;
                    if (items.length) {
                        $itemsContainer = this._renderContainer(submenuLevel, submenuContainer);
                        $.each(items, function(index, item) {
                            that._renderItem(index, item, $itemsContainer, submenuLevel)
                        })
                    }
                    this._setSelectionFromItems()
                },
                _renderContainer: function(submenuLevel) {
                    var $container = this._createItemsContainer();
                    $container.addClass(DX_MENU_ITEMS_CONTAINER_CLASS);
                    return $container
                },
                _createItemsContainer: function() {
                    var $rootGroup = $('<div>').appendTo(this.element());
                    return $('<ul>').appendTo($rootGroup)
                },
                _renderItem: function(index, item, $itemsContainer, submenuLevel) {
                    var items = this.option('items'),
                        $itemWrapper = $('<li>'),
                        $item;
                    this._renderSeparator(item, index, $itemsContainer);
                    $itemWrapper.appendTo($itemsContainer).addClass(DX_MENU_ITEM_WRAPPER_CLASS);
                    if (items[index + 1] && items[index + 1].beginGroup)
                        $itemWrapper.addClass(DX_MENU_ITEM_LAST_GROUP_ITEM);
                    if (!utils.isObject(item))
                        item = {text: item};
                    if (!utils.isDefined(item.selected))
                        item.selected = false;
                    $item = this.callBase(index, item, $itemWrapper);
                    this._addContentClasses(item, $item);
                    this._renderSubmenuItems(item, $item, submenuLevel)
                },
                _addContentClasses: function(item, $item) {
                    if (item.text)
                        $item.addClass(DX_ITEM_HAS_TEXT);
                    if (item.icon || item.iconSrc)
                        $item.addClass(DX_ITEM_HAS_ICON);
                    if (item.items && item.items.length > 0)
                        $item.addClass(DX_ITEM_HAS_SUBMENU)
                },
                _setSelectionFromItems: function() {
                    var selectedIndex = this.option('selectedIndex'),
                        searchSelectedFromItems = !selectedIndex || selectedIndex === -1;
                    if (this.option('_remoteSelectionSync') || !searchSelectedFromItems)
                        return;
                    $.each(this._editStrategy._getPlainItems(), function(index, item) {
                        if (item.selected && item.selectable !== false)
                            selectedIndex = index
                    });
                    selectedIndex && this.option("selectedIndex", selectedIndex)
                },
                _renderSeparator: function(item, index, $itemsContainer) {
                    if (item.beginGroup && index > 0)
                        $('<li>').appendTo($itemsContainer).addClass(DX_MENU_SEPARATOR_CLASS)
                },
                _renderSubmenuItems: $.noop,
                _itemClickHandler: function(e) {
                    var itemClickActionHandler = this._createAction($.proxy(this._updateSubmenuVisibilityOnClick, this));
                    this._itemJQueryEventHandler(e, "onItemClick", {}, {afterExecute: $.proxy(itemClickActionHandler, this)})
                },
                _updateSubmenuVisibilityOnClick: function(actionArgs) {
                    this._updateSelectedItemOnClick(actionArgs);
                    if (this._getShowSubmenuMode() === 'onClick')
                        this._showSubmenu(actionArgs.args[0].itemElement)
                },
                _updateSelectedItemOnClick: function(actionArgs) {
                    var args = actionArgs.args ? actionArgs.args[0] : actionArgs,
                        isSelectionByClickEnabled = this._isSelectionEnabled() && this.option('selectionByClick'),
                        $selectedItem,
                        selectedItemData;
                    if (isSelectionByClickEnabled && args.itemData.selectable !== false && !this._hasSubmenu(args.itemData)) {
                        $selectedItem = this._itemContainer().find(DX_ITEM_SELECTED_SELECTOR);
                        if ($selectedItem.length) {
                            selectedItemData = this._getItemData($selectedItem);
                            $selectedItem.removeClass(DX_MENU_SELECTED_ITEM_CLASS);
                            if (selectedItemData) {
                                selectedItemData.selected = false;
                                this._clearSelectedItems()
                            }
                            if (!$selectedItem.is(args.itemElement))
                                this._setSelectedItems(args)
                        }
                        else
                            this._setSelectedItems(args)
                    }
                },
                _setSelectedItems: function(args) {
                    args.itemData.selected = true;
                    this.option('selectedItems', [args.itemData])
                },
                _syncSelectionOptions: function(byOption) {
                    var items = this._editStrategy._getPlainItems() || [],
                        selectedItems = this.option("selectedItems") || [],
                        selectedItem = this.option("selectedItem"),
                        selectedIndex = this.option("selectedIndex");
                    byOption = byOption || this._chooseSelectOption();
                    switch (byOption) {
                        case"selectedItems":
                            this._setOptionSilent("selectedItem", selectedItems[0]);
                            this._setOptionSilent("selectedIndex", $.inArray(selectedItems[0], items));
                            break;
                        case"selectedItem":
                            if (utils.isDefined(selectedItem)) {
                                this._setOptionSilent("selectedItems", [selectedItem]);
                                this._setOptionSilent("selectedIndex", $.inArray(selectedItem, items))
                            }
                            else {
                                this._setOptionSilent("selectedItems", []);
                                this._setOptionSilent("selectedIndex", -1)
                            }
                            break;
                        case"selectedIndex":
                            if (utils.isDefined(items[selectedIndex])) {
                                this._setOptionSilent("selectedItems", [items[selectedIndex]]);
                                this._setOptionSilent("selectedItem", items[selectedIndex])
                            }
                            else {
                                this._setOptionSilent("selectedItems", []);
                                this._setOptionSilent("selectedItem", null)
                            }
                            break
                    }
                },
                _getStringifiedArray: function(array) {
                    return $.map(array, function(item) {
                            return JSON.stringify(item)
                        })
                },
                _isOwnItem: function(item) {
                    var plainItems = this._editStrategy._getPlainItems();
                    return $.inArray(JSON.stringify(item), this._getStringifiedArray(plainItems)) >= 0
                },
                _optionChanged: function(args) {
                    switch (args.name) {
                        case"showSubmenuMode":
                            break;
                        case"_remoteSelectionSync":
                        case"cssClass":
                        case"position":
                        case"selectionByClick":
                        case"animation":
                            this._invalidate();
                            break;
                        default:
                            this.callBase(args)
                    }
                },
                selectItem: function(itemElement) {
                    var itemIndex = this._editStrategy.getNormalizedIndex(itemElement),
                        itemData = this._getItemData(itemElement);
                    if (itemIndex === -1)
                        return;
                    var itemSelectionIndex = $.inArray(itemIndex, this._selectedItemIndices);
                    if (itemSelectionIndex !== -1)
                        return;
                    if (this.option("selectionMode") === "single" && itemData.selectable !== false) {
                        var items = this._editStrategy.fetchSelectedItems([itemIndex]);
                        items[0].selected = true;
                        this.option("selectedItems", items)
                    }
                },
                unselectItem: function(itemElement) {
                    var itemIndex = this._editStrategy.getNormalizedIndex(itemElement);
                    if (itemIndex === -1)
                        return;
                    var itemSelectionIndex = $.inArray(itemIndex, this._selectedItemIndices);
                    if (itemSelectionIndex === -1)
                        return;
                    var items = this._editStrategy.fetchSelectedItems([itemSelectionIndex]);
                    items[0].selected = false;
                    this.option("selectedItems", [])
                }
            });
        ui.dxMenuBase = dxMenuBase
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.menuBase.edit.strategy.js */
    (function($, DX, undefined) {
        var ui = DX.ui;
        ui.CollectionWidget.MenuBaseEditStrategy = ui.CollectionWidget.PlainEditStrategy.inherit({
            _getPlainItems: function() {
                return $.map(this._collectionWidget.option("items"), function getMenuItems(item) {
                        return item.items ? [item].concat($.map(item.items, getMenuItems)) : item
                    })
            },
            _getStringifiedArray: function(array) {
                var that = this;
                return $.map(array, function(item) {
                        return that._stringifyItem(item)
                    })
            },
            _stringifyItem: function(item) {
                var that = this;
                return JSON.stringify(item, function(key, value) {
                        if (key === "template")
                            return that._getTemplateString(value);
                        return value
                    })
            },
            _getTemplateString: function(template) {
                var result;
                if (typeof template === "object")
                    result = $(template).text();
                else
                    result = template.toString();
                return result
            },
            selectedItemIndices: function() {
                var selectedIndices = [],
                    items = this._getStringifiedArray(this._getPlainItems()),
                    selectedItems = this._collectionWidget.option("selectedItems");
                $.each(selectedItems, function(_, selectedItem) {
                    var index = $.inArray(JSON.stringify(selectedItem), items);
                    if (index !== -1)
                        selectedIndices.push(index);
                    else
                        DX.log("W1002", selectedItem)
                });
                return selectedIndices
            },
            fetchSelectedItems: function(indices) {
                indices = indices || this._collectionWidget._selectedItemIndices;
                var items = this._getPlainItems(),
                    selectedItems = [];
                $.each(indices, function(_, index) {
                    selectedItems.push(items[index])
                });
                return selectedItems
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.contextMenu.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            utils = DX.utils,
            events = ui.events,
            fx = DX.fx;
        var DX_MENU_CLASS = 'dx-menu',
            DX_MENU_ITEM_CLASS = DX_MENU_CLASS + '-item',
            DX_MENU_ITEM_EXPANDED_CLASS = DX_MENU_ITEM_CLASS + '-expanded',
            DX_MENU_PHONE_CLASS = 'dx-menu-phone-overlay',
            DX_MENU_ITEMS_CONTAINER_CLASS = DX_MENU_CLASS + '-items-container',
            DX_MENU_ITEM_WRAPPER_CLASS = DX_MENU_ITEM_CLASS + '-wrapper',
            DX_SUBMENU_CLASS = 'dx-submenu',
            DX_CONTEXT_MENU_CLASS = 'dx-context-menu',
            DX_CONTEXT_MENU_CONTENT_DELIMITER_CLASS = DX_CONTEXT_MENU_CLASS + '-content-delimiter',
            DX_HAS_CONTEXT_MENU_CLASS = 'dx-has-context-menu',
            DX_STATE_DISABLED_CLASS = "dx-state-disabled",
            DX_SUBMENU_LEVEL_ID = 'dxSubmenuLevel',
            FOCUS_UP = "up",
            FOCUS_DOWN = "down",
            FOCUS_LEFT = "left",
            FOCUS_RIGHT = "right",
            FOCUS_FIRST = "first",
            FOCUS_LAST = "last",
            ACTIONS = ["onShowing", "onShown", "onHiding", "onHidden", "onPositioning", "onLeftFirstItem", "onLeftLastItem", "onCloseRootSubmenu", "onExpandLastSubmenu"],
            LOCAL_SUBMENU_DIRECTIONS = [FOCUS_UP, FOCUS_DOWN, FOCUS_FIRST, FOCUS_LAST];
        DX.registerComponent("dxContextMenu", ui, ui.dxMenuBase.inherit({
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {
                    direction: {
                        since: "14.1",
                        alias: "submenuDirection"
                    },
                    allowSelectItem: {
                        since: "14.1",
                        alias: "allowSelection"
                    },
                    showingAction: {
                        since: "14.1",
                        alias: "onShowing"
                    },
                    shownAction: {
                        since: "14.1",
                        alias: "onShown"
                    },
                    hiddenAction: {
                        since: "14.1",
                        alias: "onHidden"
                    },
                    hidingAction: {
                        since: "14.1",
                        alias: "onHiding"
                    },
                    positioningAction: {
                        since: "14.1",
                        alias: "onPositioning"
                    }
                })
            },
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    invokeOnlyFromCode: false,
                    position: {
                        at: 'top left',
                        my: 'top left'
                    },
                    onShowing: null,
                    onShown: null,
                    onHiding: null,
                    onHidden: null,
                    onPositioning: null,
                    submenuDirection: 'auto',
                    visible: false,
                    target: window,
                    onLeftFirstItem: null,
                    onLeftLastItem: null,
                    onCloseRootSubmenu: null,
                    onExpandLastSubmenu: null
                })
            },
            _initActions: function() {
                this._actions = {};
                $.each(ACTIONS, $.proxy(function(index, action) {
                    this._actions[action] = this._createActionByOption(action) || $.noop
                }, this))
            },
            _setOptionsByReference: function() {
                this.callBase();
                $.extend(this._optionsByReference, {
                    animation: true,
                    position: true,
                    selectedItem: true
                })
            },
            _itemContainer: function() {
                return this._overlay.content()
            },
            _supportedKeys: function() {
                return $.extend(this.callBase(), {esc: this.hide})
            },
            _moveFocus: function(location) {
                var $items = this._getItemsByLocation(location),
                    $oldTarget = this._getActiveItem(true),
                    $newTarget,
                    $focusedItem = this.option("focusedElement");
                switch (location) {
                    case FOCUS_UP:
                        $newTarget = $focusedItem ? this._prevItem($items) : $items.last();
                        if ($oldTarget.is($items.first()))
                            this._actions.onLeftFirstItem($oldTarget);
                        break;
                    case FOCUS_DOWN:
                        $newTarget = $focusedItem ? this._nextItem($items) : $items.first();
                        if ($oldTarget.is($items.last()))
                            this._actions.onLeftLastItem($oldTarget);
                        break;
                    case FOCUS_RIGHT:
                        $newTarget = this.option("rtlEnabled") ? this._hideSubmenuHandler($items) : this._expandSubmenuHandler($items);
                        break;
                    case FOCUS_LEFT:
                        $newTarget = this.option("rtlEnabled") ? this._expandSubmenuHandler($items) : this._hideSubmenuHandler($items);
                        break;
                    case FOCUS_FIRST:
                        $newTarget = $items.first();
                        break;
                    case FOCUS_LAST:
                        $newTarget = $items.last();
                        break;
                    default:
                        return this.callBase(location)
                }
                if ($newTarget.length !== 0)
                    this.option("focusedElement", $newTarget)
            },
            _getItemsByLocation: function(location) {
                var $items,
                    $activeItem = this._getActiveItem(true),
                    expandedLocation = this.option("rtlEnabled") ? FOCUS_LEFT : FOCUS_RIGHT;
                if ($.inArray(location, LOCAL_SUBMENU_DIRECTIONS) >= 0)
                    $items = $activeItem.closest('.' + DX_MENU_ITEMS_CONTAINER_CLASS).children().children();
                else {
                    $items = this._itemElements();
                    if (location !== expandedLocation)
                        $items = $items.filter(":visible")
                }
                return $items
            },
            _hideSubmenuHandler: function($items) {
                var $curItem = this._getActiveItem(true),
                    $parentItem = $curItem.parents("." + DX_MENU_ITEM_EXPANDED_CLASS).first();
                if ($parentItem.length) {
                    this._hideSubmenusOnSameLevel($parentItem);
                    return $parentItem
                }
                this._actions.onCloseRootSubmenu($curItem);
                return $curItem
            },
            _expandSubmenuHandler: function($items) {
                var $curItem = this._getActiveItem(true),
                    $submenu = $curItem.children('.' + DX_SUBMENU_CLASS);
                if ($submenu.length && !$curItem.hasClass(DX_STATE_DISABLED_CLASS)) {
                    if ($submenu.css("visibility") === "hidden")
                        this._showSubmenu($curItem);
                    return this._nextItem($items)
                }
                this._actions.onExpandLastSubmenu($curItem);
                return $curItem
            },
            _render: function() {
                this.element().addClass(DX_HAS_CONTEXT_MENU_CLASS);
                this.callBase()
            },
            _renderContentImpl: function() {
                var $target = $(this.option('target'));
                this._renderContextMenuOverlay();
                this._detachShowContextMenuEvents($target);
                this._attachShowContextMenuEvents($target);
                this.callBase()
            },
            _renderContextMenuOverlay: function() {
                var overlayOptions = this._getOverlayOptions(),
                    $overlayElement = $('<div>'),
                    $overlayContent;
                $overlayElement.appendTo(this._$element).dxOverlay(overlayOptions);
                this._overlay = $overlayElement.dxOverlay('instance');
                $overlayContent = this._overlay.content();
                $overlayContent.addClass(DX_CONTEXT_MENU_CLASS);
                this._addCustomCssClass($overlayContent);
                this._addPlatformDependentClass($overlayContent);
                if (this.option('visible'))
                    this._show()
            },
            _addPlatformDependentClass: function($element) {
                if (DX.devices.current().phone)
                    $element.addClass(DX_MENU_PHONE_CLASS)
            },
            _detachShowContextMenuEvents: function($target) {
                var eventName = events.addNamespace('dxcontextmenu', this.NAME);
                $target.off(eventName);
                this._overlay && this._overlay.content().off(eventName)
            },
            _attachShowContextMenuEvents: function($target) {
                var that = this,
                    eventName = events.addNamespace('dxcontextmenu', this.NAME),
                    contextMenuAction = this._createAction($.proxy(function(e) {
                        if (!that.option('invokeOnlyFromCode'))
                            that._show(e.jQueryEvent)
                    }, this));
                this._overlay && this._overlay.content().on(eventName, $.noop);
                $target.on(eventName, $.proxy(function(e) {
                    contextMenuAction({jQueryEvent: e})
                }, this))
            },
            _hoverEndHandler: function(e) {
                e.stopPropagation()
            },
            _renderDimensions: $.noop,
            _renderContainer: function(submenuLevel, submenuContainer) {
                var $submenu = $('<div>'),
                    $itemsContainer = $('<ul>'),
                    $holder = submenuLevel === 1 ? this._itemContainer() : submenuContainer;
                $submenu.appendTo($holder).addClass(DX_SUBMENU_CLASS).data(DX_SUBMENU_LEVEL_ID, submenuLevel).css('visibility', submenuLevel === 1 ? 'visible' : 'hidden');
                $itemsContainer.appendTo($submenu).addClass(DX_MENU_ITEMS_CONTAINER_CLASS);
                if (submenuLevel === 1) {
                    if (this.option('width'))
                        $itemsContainer.css('min-width', this.option('width'));
                    if (this.option('height'))
                        $itemsContainer.css('min-height', this.option('height'))
                }
                return $itemsContainer
            },
            _renderSubmenuItems: function(item, $item, submenuLevel) {
                if (this._hasSubmenu(item))
                    this._renderItems(item.items, ++submenuLevel, $item)
            },
            _getOverlayOptions: function() {
                var position = this.option('position'),
                    overlayAnimation = this.option('animation'),
                    overlayOptions = {
                        focusStateEnabled: this.option('focusStateEnabled'),
                        animation: overlayAnimation,
                        closeOnOutsideClick: $.proxy(this._closeOnOutsideClickHandler, this),
                        closeOnTargetScroll: true,
                        deferRendering: false,
                        disabled: this.option('disabled'),
                        position: {
                            at: position.at,
                            my: position.my,
                            of: this.option('target')
                        },
                        shading: false,
                        showTitle: false,
                        height: 'auto',
                        width: 'auto',
                        rtlEnabled: this.option('rtlEnabled'),
                        onShowing: $.proxy(this._overlayShowingActionHandler, this),
                        onShown: $.proxy(this._overlayShownActionHandler, this),
                        onHiding: $.proxy(this._overlayHidingActionHandler, this),
                        onHidden: $.proxy(this._overlayHiddenActionHandler, this),
                        onPositioned: $.proxy(this._overlayPositionedActionHandler, this),
                        onPositioning: $.proxy(this._overlayPositioningActionHandler, this)
                    };
                return overlayOptions
            },
            _overlayShowingActionHandler: function(arg) {
                this._actions.onShowing(arg);
                this._clearFocusedItem()
            },
            _overlayShownActionHandler: function(arg) {
                this._actions.onShown(arg);
                this._clearFocusedItem()
            },
            _clearFocusedItem: function() {
                this._removeFocusedItem();
                this.option("focusedElement", null)
            },
            _overlayHidingActionHandler: function(arg) {
                this._actions.onHiding(arg);
                if (!arg.cancel)
                    this._hideAllShownSubmenus()
            },
            _overlayHiddenActionHandler: function(arg) {
                this._actions.onHidden(arg);
                this._setOptionSilent('visible', false)
            },
            _overlayPositionedActionHandler: $.noop,
            _overlayPositioningActionHandler: function(arg) {
                var $what = this.element(),
                    targetPosition = arg.position,
                    newPosition = targetPosition;
                if ((targetPosition.h.oversize !== 0 || targetPosition.v.oversize !== 0) && !this.option('_notChangePosition')) {
                    newPosition.h.location = Math.round(targetPosition.h.location - targetPosition.h.oversize);
                    newPosition.v.location = Math.round(targetPosition.v.location - targetPosition.v.oversize);
                    DX.position($what, newPosition)
                }
            },
            _closeOnOutsideClickHandler: function(e) {
                var $clickedItem,
                    $activeItemContainer,
                    $itemContainers,
                    $rootItem,
                    isRootItemClicked,
                    isInnerOverlayClicked;
                if (e.target === document)
                    return true;
                $activeItemContainer = this._getActiveItemsContainer(e.target);
                $itemContainers = this._getItemsContainers();
                $clickedItem = this._searchActiveItem(e.target);
                $rootItem = this.element().parents('.' + DX_MENU_ITEM_CLASS);
                isRootItemClicked = $clickedItem[0] === $rootItem[0] && $clickedItem.length && $rootItem.length;
                isInnerOverlayClicked = this._isIncludeOverlay($activeItemContainer, $itemContainers) && $clickedItem.length;
                if (isInnerOverlayClicked || isRootItemClicked) {
                    if (this._getShowSubmenuMode() === 'onClick')
                        this._hideAllShownChildSubmenus($clickedItem);
                    return false
                }
                return true
            },
            _getActiveItemsContainer: function(target) {
                return $(target).closest('.' + DX_MENU_ITEMS_CONTAINER_CLASS)
            },
            _getItemsContainers: function() {
                return this._overlay._$content.find('.' + DX_MENU_ITEMS_CONTAINER_CLASS)
            },
            _searchActiveItem: function(target) {
                return $(target).closest('.' + DX_MENU_ITEM_CLASS).eq(0)
            },
            _isIncludeOverlay: function($activeOverlay, $allOverlays) {
                var isSame = false;
                $.each($allOverlays, function(index, $overlay) {
                    if ($activeOverlay.is($overlay) && !isSame)
                        isSame = true
                });
                return isSame
            },
            _hideAllShownChildSubmenus: function($clickedItem) {
                var that = this,
                    $submenuElements = $clickedItem.find('.' + DX_SUBMENU_CLASS),
                    shownSubmenus = $.extend([], this._shownSubmenus),
                    $context;
                if ($submenuElements.length > 0)
                    $.each(shownSubmenus, function(index, $submenu) {
                        $context = that._searchActiveItem($submenu.context).parent();
                        if ($context.parent().is($clickedItem.parent().parent()) && !$context.is($clickedItem.parent()))
                            that._hideSubmenu($submenu)
                    })
            },
            _showSubmenu: function($item) {
                var isItemHasSubmenu = $item.children('.' + DX_SUBMENU_CLASS).length,
                    isSubmenuVisible;
                this._hideSubmenusOnSameLevel($item);
                if (isItemHasSubmenu) {
                    this.callBase($item);
                    $item.closest('.' + DX_MENU_ITEMS_CONTAINER_CLASS).find('.' + DX_MENU_ITEM_EXPANDED_CLASS).removeClass(DX_MENU_ITEM_EXPANDED_CLASS);
                    isSubmenuVisible = this._isSubmenuVisible($item.children('.' + DX_SUBMENU_CLASS));
                    if (!isSubmenuVisible) {
                        $item.addClass(DX_MENU_ITEM_EXPANDED_CLASS);
                        this._drawSubmenu($item)
                    }
                }
            },
            _hideSubmenusOnSameLevel: function($item) {
                var $expandedItems = $item.closest('.' + DX_MENU_ITEMS_CONTAINER_CLASS).find('.' + DX_MENU_ITEM_EXPANDED_CLASS);
                if ($expandedItems.length) {
                    $expandedItems.removeClass(DX_MENU_ITEM_EXPANDED_CLASS);
                    this._hideSubmenu($expandedItems.find('.' + DX_SUBMENU_CLASS))
                }
            },
            _hideSubmenuGroup: function($submenu) {
                if (this._isSubmenuVisible($submenu))
                    this._hideSubmenuCore($submenu)
            },
            _isSubmenuVisible: function($submenu) {
                return $submenu.css("visibility") === "visible"
            },
            _drawSubmenu: function($itemElement) {
                var animation = this.option('animation') ? this.option('animation').show : {},
                    position = this._getSubmenuPosition($itemElement),
                    $submenu = $itemElement.children('.' + DX_SUBMENU_CLASS);
                if (this._overlay && this._overlay.option('visible')) {
                    if (!utils.isDefined(this._shownSubmenus))
                        this._shownSubmenus = [];
                    if ($.inArray($submenu, this._shownSubmenus))
                        this._shownSubmenus.push($submenu);
                    DX.position($submenu, position);
                    animation && this._animate($submenu, animation);
                    $submenu.css('visibility', 'visible');
                    this._stopAnimate($submenu)
                }
            },
            _animate: function($container, options) {
                fx.animate($container, options)
            },
            _getSubmenuPosition: function($rootItem) {
                var submenuDirection = this.option('submenuDirection').toLowerCase(),
                    rtlEnabled = this.option('rtlEnabled'),
                    $rootItemWrapper = $rootItem.parent('.' + DX_MENU_ITEM_WRAPPER_CLASS),
                    position = {
                        collision: 'flip',
                        of: $rootItemWrapper,
                        offset: {
                            h: 0,
                            v: -1
                        }
                    };
                switch (submenuDirection) {
                    case'left':
                        position.at = 'left top';
                        position.my = 'right top';
                        break;
                    case'right':
                        position.at = 'right top';
                        position.my = 'left top';
                        break;
                    default:
                        if (rtlEnabled) {
                            position.at = 'left top';
                            position.my = 'right top'
                        }
                        else {
                            position.at = 'right top';
                            position.my = 'left top'
                        }
                        break
                }
                return position
            },
            _updateSubmenuVisibilityOnClick: function(actionArgs) {
                var $itemElement,
                    $submenuElement;
                if (actionArgs.args.length && actionArgs.args[0]) {
                    actionArgs.args[0].jQueryEvent.stopPropagation();
                    $itemElement = actionArgs.args[0].itemElement;
                    $submenuElement = $itemElement.children('.' + DX_SUBMENU_CLASS);
                    if ($itemElement.context === $submenuElement.context && $submenuElement.css("visibility") === "visible")
                        return;
                    if (!$itemElement.data(this._itemDataKey()) || $itemElement.data(this._itemDataKey()).disabled)
                        return;
                    this._updateSelectedItemOnClick(actionArgs);
                    if ($submenuElement.length === 0) {
                        var $prevSubmenu = $($itemElement.parents('.' + DX_SUBMENU_CLASS)[0]);
                        this._hideSubmenu($prevSubmenu);
                        if (!actionArgs.canceled && this._overlay && this._overlay.option('visible'))
                            this.option('visible', false)
                    }
                    else {
                        if (this._shownSubmenus && this._shownSubmenus.length > 0)
                            if (this._shownSubmenus[0].is($submenuElement) || this._shownSubmenus[0].has($submenuElement).length === 1)
                                this._hideSubmenu($submenuElement);
                            else
                                this._hideAllShownSubmenus();
                        this._showSubmenu($itemElement)
                    }
                }
            },
            _hideSubmenu: function($curSubmenu) {
                var that = this,
                    shownSubmenus = $.extend([], that._shownSubmenus);
                $.each(shownSubmenus, function(index, $submenu) {
                    if ($curSubmenu.is($submenu) || $curSubmenu.has($submenu).length) {
                        $submenu.parent().removeClass(DX_MENU_ITEM_EXPANDED_CLASS);
                        that._hideSubmenuCore($submenu)
                    }
                })
            },
            _hideSubmenuCore: function($submenu) {
                var index = $.inArray($submenu, this._shownSubmenus),
                    animation = this.option('animation') ? this.option('animation').hide : null;
                if (index >= 0)
                    this._shownSubmenus.splice(index, 1);
                this._stopAnimate($submenu);
                animation && this._animate($submenu, animation);
                $submenu.css('visibility', 'hidden')
            },
            _stopAnimate: function($container) {
                fx.stop($container, true)
            },
            _hideAllShownSubmenus: function() {
                var that = this,
                    shownSubmenus = $.extend([], that._shownSubmenus),
                    $expandedItems = this._overlay.content().find('.' + DX_MENU_ITEM_EXPANDED_CLASS);
                $expandedItems.removeClass(DX_MENU_ITEM_EXPANDED_CLASS);
                $.each(shownSubmenus, function(_, $submenu) {
                    that._hideSubmenuCore($submenu)
                })
            },
            _optionChanged: function(args) {
                if (this._cancelOptionChange)
                    return;
                if ($.inArray(args.name, ACTIONS) > -1) {
                    this._initActions();
                    return
                }
                switch (args.name) {
                    case'visible':
                        this._toggleVisibility(args.value);
                        break;
                    case'invokeOnlyFromCode':
                        break;
                    case'items':
                        if (this._overlay.option('visible'))
                            this._overlay.hide();
                        this.callBase(args);
                        break;
                    case"position":
                    case"submenuDirection":
                        this._invalidate();
                        break;
                    case"target":
                        args.previousValue && this._detachShowContextMenuEvents($(args.previousValue));
                        this._invalidate();
                        break;
                    case"focusedElement":
                        this.callBase(args);
                        break;
                    default:
                        if (this._overlay)
                            if (this._overlay.option('visible'))
                                this._overlay.hide();
                        this.callBase(args)
                }
            },
            _toggleVisibility: function(showing) {
                showing ? this._show() : this._hide()
            },
            _show: function(jQEvent) {
                var canShowMenu = !(this._overlay && this._positionContextMenu(jQEvent)),
                    promise;
                if (canShowMenu && this._overlay) {
                    this.option("focusedElement", this._itemElements().first());
                    promise = this._overlay.show();
                    this._setOptionSilent('visible', true)
                }
                return promise || $.Deferred().reject().promise()
            },
            _positionContextMenu: function(jQEvent) {
                var position = this.option('position'),
                    positioningAction = this._createActionByOption('onPositioning', actionArgs),
                    actionArgs;
                if (jQEvent && jQEvent.preventDefault)
                    position = {
                        at: 'top left',
                        my: 'top left',
                        of: jQEvent
                    };
                if (!position.of)
                    position.of = this.option('target');
                actionArgs = {
                    position: position,
                    jQueryEvent: jQEvent
                };
                positioningAction(actionArgs);
                if (!actionArgs.canceled && this._overlay)
                    position && this._overlay.option('position', position);
                else
                    actionArgs.jQueryEvent.cancel = true;
                return actionArgs.canceled
            },
            _hide: function() {
                var promise;
                if (this._overlay) {
                    promise = this._overlay.hide();
                    this._setOptionSilent('visible', false)
                }
                return promise || $.Deferred().reject().promise()
            },
            _clean: function() {
                if (this._overlay) {
                    this._overlay.element().remove();
                    this._overlay = null
                }
                this._detachShowContextMenuEvents($(this.option('target')))
            },
            toggle: function(showing) {
                var isMenuShown,
                    visible = this.option("visible");
                showing = showing === undefined ? !visible : showing;
                return showing ? this._show() : this._hide()
            },
            show: function() {
                return this.toggle(true)
            },
            hide: function() {
                return this.toggle(false)
            }
        }))
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.menu.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            utils = DX.utils,
            events = ui.events,
            fx = DX.fx;
        var DX_MENU_CLASS = 'dx-menu',
            DX_MENU_VERTICAL_CLASS = DX_MENU_CLASS + '-vertical',
            DX_MENU_HORIZONTAL_CLASS = DX_MENU_CLASS + '-horizontal',
            DX_MENU_ITEM_CLASS = DX_MENU_CLASS + '-item',
            DX_MENU_ITEMS_CONTAINER_CLASS = DX_MENU_CLASS + '-items-container',
            DX_MENU_ITEM_EXPANDED_CLASS = DX_MENU_ITEM_CLASS + "-expanded",
            DX_CONTEXT_MENU_CLASS = 'dx-context-menu',
            DX_CONTEXT_MENU_CONTAINER_BORDER_CLASS = DX_CONTEXT_MENU_CLASS + '-container-border',
            DX_MENU_SELECTED_ITEM_CLASS = DX_MENU_ITEM_CLASS + '-selected',
            DX_STATE_DISABLED_CLASS = "dx-state-disabled",
            DX_CONTEXT_MENU_CONTENT_DELIMITER_CLASS = 'dx-context-menu-content-delimiter',
            DX_SUBMENU_CLASS = 'dx-submenu',
            DX_ITEM_SELECTED_SELECTOR = '.' + DX_MENU_SELECTED_ITEM_CLASS,
            DX_MENU_HOVERSTAY_TIMEOUT = 50,
            DX_MENU_HOVER_TIMEOUT = 50,
            FOCUS_UP = "up",
            FOCUS_DOWN = "down",
            FOCUS_LEFT = "left",
            FOCUS_RIGHT = "right",
            SHOW_SUBMENU_OPERATION = "showSubmenu",
            NEXTITEM_OPERATION = "nextItem",
            PREVITEM_OPERATION = "prevItem",
            ACTIONS = ["onSubmenuShowing", "onSubmenuShown", "onSubmenuHiding", "onSubmenuHidden"],
            dxSubmenu = ui.dxContextMenu.inherit({
                _setDefaultOptions: function() {
                    this.callBase();
                    this.option({orientation: 'horizontal'})
                },
                _renderContentImpl: function() {
                    this.callBase();
                    this._renderDelimiter()
                },
                _renderDelimiter: function() {
                    this.$contentDelimiter = $('<div>').appendTo(this._itemContainer()).addClass(DX_CONTEXT_MENU_CONTENT_DELIMITER_CLASS)
                },
                _overlayPositionedActionHandler: function(arg) {
                    this._showDelimiter(arg)
                },
                _showDelimiter: function(arg) {
                    var $submenu = this._itemContainer().children('.' + DX_SUBMENU_CLASS).eq(0),
                        $rootItem = this.option('position').of,
                        positionAt = this.option('position').at,
                        positionMy = this.option('position').my,
                        position = {of: $submenu},
                        containerOffset,
                        rootOffset;
                    if (this.$contentDelimiter) {
                        containerOffset = arg.position;
                        rootOffset = $rootItem.offset();
                        this.$contentDelimiter.css('display', 'block');
                        if (this.option('orientation') === 'horizontal') {
                            this.$contentDelimiter.width($rootItem.width() < $submenu.width() ? $rootItem.width() - 2 : $submenu.width() - 2);
                            this.$contentDelimiter.height(2);
                            if (containerOffset.v.location > rootOffset.top)
                                if (Math.round(containerOffset.h.location) === Math.round(rootOffset.left)) {
                                    position.offset = '1 -1';
                                    position.at = 'left top';
                                    position.my = 'left top'
                                }
                                else {
                                    position.offset = '-1 -1';
                                    position.at = 'right top';
                                    position.my = 'right top'
                                }
                            else {
                                this.$contentDelimiter.height(4);
                                if (Math.round(containerOffset.h.location) === Math.round(rootOffset.left)) {
                                    position.offset = '1 2';
                                    position.at = 'left bottom';
                                    position.my = 'left bottom'
                                }
                                else {
                                    position.offset = '-1 2';
                                    position.at = 'right bottom';
                                    position.my = 'right bottom'
                                }
                            }
                        }
                        else if (this.option('orientation') === 'vertical') {
                            this.$contentDelimiter.width(2);
                            this.$contentDelimiter.height($rootItem.height() < $submenu.height() ? $rootItem.height() - 2 : $submenu.height() - 2);
                            if (containerOffset.h.location > rootOffset.left)
                                if (Math.round(containerOffset.v.location) === Math.round(rootOffset.top)) {
                                    position.offset = '-1 1';
                                    position.at = 'left top';
                                    position.my = 'left top'
                                }
                                else {
                                    position.offset = '-1 -1';
                                    position.at = 'left bottom';
                                    position.my = 'left bottom'
                                }
                            else if (Math.round(containerOffset.v.location) === Math.round(rootOffset.top)) {
                                position.offset = '1 1';
                                position.at = 'right top';
                                position.my = 'right top'
                            }
                            else {
                                position.offset = '1 -1';
                                position.at = 'right bottom';
                                position.my = 'right bottom'
                            }
                        }
                        DX.position(this.$contentDelimiter, position)
                    }
                }
            });
        DX.registerComponent("dxMenu", ui, ui.dxMenuBase.inherit({
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {
                    firstSubMenuDirection: {
                        since: "14.1",
                        alias: "submenuDirection"
                    },
                    showPopupMode: {
                        since: "14.1",
                        alias: "showFirstSubmenuMode"
                    },
                    allowSelectItem: {
                        since: "14.1",
                        alias: "allowSelection"
                    },
                    allowSelection: {
                        since: "14.2",
                        message: "Use the 'selectionMode' option instead"
                    },
                    submenuHiddenAction: {
                        since: "14.2",
                        alias: "onSubmenuHidden"
                    },
                    submenuHidingAction: {
                        since: "14.2",
                        alias: "onSubmenuHiding"
                    },
                    submenuShowingAction: {
                        since: "14.2",
                        alias: "onSubmenuShowing"
                    },
                    submenuShownAction: {
                        since: "14.2",
                        alias: "onSubmenuShown"
                    }
                })
            },
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    orientation: 'horizontal',
                    submenuDirection: 'auto',
                    showFirstSubmenuMode: 'onClick',
                    onSubmenuShowing: null,
                    onSubmenuShown: null,
                    onSubmenuHiding: null,
                    onSubmenuHidden: null
                })
            },
            _setOptionsByReference: function() {
                this.callBase();
                $.extend(this._optionsByReference, {
                    animation: true,
                    selectedItem: true
                })
            },
            _focusTarget: function() {
                return this.element()
            },
            _eventBindingTarget: function() {
                return this.element()
            },
            _getOrientation: function() {
                return this.option("orientation") === "vertical" ? "vertical" : "horizontal"
            },
            _isMenuHorizontal: function() {
                return this._getOrientation() === "horizontal"
            },
            _moveFocus: function(location) {
                var $items = this._itemElements().filter(":visible"),
                    isMenuHorizontal = this._isMenuHorizontal(),
                    argument,
                    $activeItem = this._getActiveItem(true),
                    operation,
                    navigationAction,
                    $newTarget;
                switch (location) {
                    case FOCUS_UP:
                        operation = isMenuHorizontal ? SHOW_SUBMENU_OPERATION : this._getItemsNavigationOperation(PREVITEM_OPERATION);
                        argument = isMenuHorizontal ? $activeItem : $items;
                        navigationAction = this._getKeyboardNavigationAction(operation, argument);
                        $newTarget = navigationAction();
                        break;
                    case FOCUS_DOWN:
                        operation = isMenuHorizontal ? SHOW_SUBMENU_OPERATION : this._getItemsNavigationOperation(NEXTITEM_OPERATION);
                        argument = isMenuHorizontal ? $activeItem : $items;
                        navigationAction = this._getKeyboardNavigationAction(operation, argument);
                        $newTarget = navigationAction();
                        break;
                    case FOCUS_RIGHT:
                        operation = isMenuHorizontal ? this._getItemsNavigationOperation(NEXTITEM_OPERATION) : SHOW_SUBMENU_OPERATION;
                        argument = isMenuHorizontal ? $items : $activeItem;
                        navigationAction = this._getKeyboardNavigationAction(operation, argument);
                        $newTarget = navigationAction();
                        break;
                    case FOCUS_LEFT:
                        operation = isMenuHorizontal ? this._getItemsNavigationOperation(PREVITEM_OPERATION) : SHOW_SUBMENU_OPERATION;
                        argument = isMenuHorizontal ? $items : $activeItem;
                        navigationAction = this._getKeyboardNavigationAction(operation, argument);
                        $newTarget = navigationAction();
                        break;
                    default:
                        return this.callBase(location)
                }
                if ($newTarget && $newTarget.length !== 0)
                    this.option("focusedElement", $newTarget)
            },
            _getItemsNavigationOperation: function(operation) {
                var navOperation = operation;
                if (this.option("rtlEnabled"))
                    navOperation = operation === PREVITEM_OPERATION ? NEXTITEM_OPERATION : PREVITEM_OPERATION;
                return navOperation
            },
            _getKeyboardNavigationAction: function(operation, argument) {
                var action = $.noop;
                switch (operation) {
                    case SHOW_SUBMENU_OPERATION:
                        if (!argument.hasClass(DX_STATE_DISABLED_CLASS))
                            action = $.proxy(this._showSubmenu, this, argument);
                        break;
                    case NEXTITEM_OPERATION:
                        action = $.proxy(this._nextItem, this, argument);
                        break;
                    case PREVITEM_OPERATION:
                        action = $.proxy(this._prevItem, this, argument);
                        break
                }
                return action
            },
            _init: function() {
                this.callBase();
                this._submenus = []
            },
            _initActions: function() {
                this._actions = {};
                $.each(ACTIONS, $.proxy(function(index, action) {
                    this._actions[action] = this._createActionByOption(action) || $.noop
                }, this))
            },
            _render: function() {
                this._visibleSubmenu = [];
                this.callBase();
                this.element().addClass(DX_MENU_CLASS)
            },
            _renderContainer: function() {
                var isVerticalMenu = this.option('orientation') === 'vertical',
                    $rootGroup = $('<div>'),
                    $itemsContainer = $('<ul>');
                $rootGroup.appendTo(this.element()).addClass(isVerticalMenu ? DX_MENU_VERTICAL_CLASS : DX_MENU_HORIZONTAL_CLASS);
                $itemsContainer.appendTo($rootGroup).addClass(DX_MENU_ITEMS_CONTAINER_CLASS).css('min-height', this._getValueHeight($rootGroup));
                return $itemsContainer
            },
            _getValueHeight: function($root) {
                var $div = $("<div>").html("Jj").css({
                        width: "auto",
                        position: "fixed",
                        top: "-3000px",
                        left: "-3000px"
                    }).appendTo($root),
                    height = $div.height();
                $div.remove();
                return height
            },
            _renderSubmenuItems: function(item, $item) {
                if (this._hasSubmenu(item)) {
                    var submenu = this._createSubmenu(item.items, $item);
                    this._submenus.push(submenu);
                    this._renderBorderElement($item)
                }
            },
            _createSubmenu: function(items, $rootItem) {
                var $submenuContainer = $('<div>').addClass(DX_CONTEXT_MENU_CLASS).appendTo($rootItem);
                var result = this._createComponent($submenuContainer, "dxSubmenu", $.extend(this._getSubmenuOptions(), {
                        items: items,
                        position: this.getSubmenuPosition($rootItem)
                    }));
                this._attachSubmenuHandlers($rootItem, result);
                return result
            },
            _getSubmenuOptions: function() {
                var $submenuTarget = $('<div>'),
                    isMenuHorizontal = this._isMenuHorizontal();
                return {
                        itemTemplate: this.option("itemTemplate"),
                        templateProvider: this.option("templateProvider"),
                        target: $submenuTarget,
                        orientation: this.option('orientation'),
                        selectionMode: this.option('selectionMode'),
                        selectionByClick: this.option('selectionByClick'),
                        cssClass: this.option('cssClass'),
                        hoverStateEnabled: this.option('hoverStateEnabled'),
                        activeStateEnabled: this.option('activeStateEnabled'),
                        focusStateEnabled: this.option('focusStateEnabled'),
                        animation: this.option('animation'),
                        rtlEnabled: this.option('rtlEnabled'),
                        disabled: this.option('disabled'),
                        showSubmenuMode: this._getShowSubmenuMode(),
                        onSelectionChanged: $.proxy(this._nestedItemOnSelectionChangedHandler, this),
                        onItemClick: $.proxy(this._nestedItemOnItemClickHandler, this),
                        onLeftFirstItem: isMenuHorizontal ? null : $.proxy(this._moveMainMenuFocus, this, PREVITEM_OPERATION),
                        onLeftLastItem: isMenuHorizontal ? null : $.proxy(this._moveMainMenuFocus, this, NEXTITEM_OPERATION),
                        onCloseRootSubmenu: isMenuHorizontal ? $.proxy(this._moveMainMenuFocus, this, PREVITEM_OPERATION) : null,
                        onExpandLastSubmenu: isMenuHorizontal ? $.proxy(this._moveMainMenuFocus, this, NEXTITEM_OPERATION) : null,
                        _remoteSelectionSync: true,
                        _notChangePosition: true
                    }
            },
            _getShowFirstSubmenuMode: function() {
                var isDesktop = DX.devices.real().deviceType === "desktop";
                return isDesktop ? this.option("showFirstSubmenuMode") : "onClick"
            },
            _moveMainMenuFocus: function(direction) {
                var $expandedItem = this.element().find("." + DX_MENU_ITEM_EXPANDED_CLASS).first(),
                    $newItem;
                switch (direction) {
                    case PREVITEM_OPERATION:
                        $newItem = $expandedItem.parent().prev();
                        if (!$newItem.length)
                            $newItem = $expandedItem.parent().siblings().last();
                        $newItem = $newItem.children();
                        break;
                    case NEXTITEM_OPERATION:
                        $newItem = $expandedItem.parent().next();
                        if (!$newItem.length)
                            $newItem = $expandedItem.parent().siblings().first();
                        $newItem = $newItem.children();
                        break
                }
                this._visibleSubmenu.length && this._hideSubmenu(this._visibleSubmenu);
                this.focus();
                this.option("focusedElement", $newItem)
            },
            _nestedItemOnSelectionChangedHandler: function(args) {
                var selectedItems = args.addedItems,
                    submenu = args.element.dxSubmenu("instance");
                this._clearSelectionInSubmenus(selectedItems[0], submenu);
                this._clearRootSelection();
                this.option("selectedItems", selectedItems)
            },
            _clearSelectionInSubmenus: function(item, targetSubmenu) {
                var that = this,
                    cleanAllSubmenus = !arguments.length;
                $.each(this._submenus, function(index, submenu) {
                    var $submenu = submenu._itemContainer(),
                        isOtherItem = !$submenu.is(targetSubmenu && targetSubmenu._itemContainer()),
                        $selectedItem = $submenu.find(DX_ITEM_SELECTED_SELECTOR);
                    if (isOtherItem && $selectedItem.length || cleanAllSubmenus) {
                        var selectedItemData;
                        $selectedItem.removeClass(DX_MENU_SELECTED_ITEM_CLASS);
                        selectedItemData = that._getItemData($selectedItem);
                        if (selectedItemData)
                            selectedItemData.selected = false;
                        submenu._clearSelectedItems()
                    }
                })
            },
            _clearRootSelection: function() {
                var $prevSelectedItem = this.element().find("." + DX_MENU_ITEMS_CONTAINER_CLASS).first().children().children().filter("." + DX_MENU_SELECTED_ITEM_CLASS);
                if ($prevSelectedItem.length) {
                    var prevSelectedItemData;
                    prevSelectedItemData = this._getItemData($prevSelectedItem);
                    prevSelectedItemData.selected = false;
                    $prevSelectedItem.removeClass(DX_MENU_SELECTED_ITEM_CLASS)
                }
                this._clearSelectedItems()
            },
            _nestedItemOnItemClickHandler: function(arg) {
                var $selectedItem,
                    onItemClick = this._createActionByOption('onItemClick', {});
                onItemClick(arg)
            },
            _updateSelectedItemOnClick: function(actionArgs) {
                var selectedIndex = this.option("selectedIndex");
                this.callBase(actionArgs);
                if (selectedIndex !== this.option("selectedIndex"))
                    this._clearSelectionInSubmenus()
            },
            _attachSubmenuHandlers: function($rootItem, submenu) {
                var that = this,
                    $submenuOverlayContent = submenu._overlay.content(),
                    submenus = $submenuOverlayContent.find('.dx-submenu'),
                    submenuMouseEnterName = events.addNamespace('dxhoverstart', this.NAME + '_submenu'),
                    submenuMouseLeaveName = events.addNamespace('dxhoverend', this.NAME + '_submenu');
                submenu.option({
                    onShowing: $.proxy(this._submenuOnShowingHandler, this, $rootItem, submenu),
                    onShown: $.proxy(this._submenuOnShownHandler, this, $rootItem, submenu),
                    onHiding: $.proxy(this._submenuOnHidingHandler, this, $rootItem, submenu),
                    onHidden: $.proxy(this._submenuOnHiddenHandler, this, $rootItem, submenu)
                });
                $.each(submenus, function(index, submenu) {
                    $(submenu).off(submenuMouseEnterName).off(submenuMouseLeaveName).on(submenuMouseEnterName, null, $.proxy(that._submenuMouseEnterHandler, that, $rootItem)).on(submenuMouseLeaveName, null, $.proxy(that._submenuMouseLeaveHandler, that, $rootItem))
                })
            },
            _submenuOnShowingHandler: function($rootItem, submenu) {
                var $border = $rootItem.children('.' + DX_CONTEXT_MENU_CONTAINER_BORDER_CLASS),
                    animation = this.option('animation') ? this.option('animation').show : {};
                this._actions.onSubmenuShowing({
                    rootItem: $rootItem,
                    submenu: submenu
                });
                if (this._options.width !== undefined)
                    if (this._options.rtlEnabled)
                        $border.css("width", this._$element.width() - $rootItem.position().right);
                    else
                        $border.css("width", this._$element.width() - $rootItem.position().left);
                $border.show();
                $rootItem.addClass(DX_MENU_ITEM_EXPANDED_CLASS)
            },
            _submenuOnShownHandler: function($rootItem, submenu) {
                this._actions.onSubmenuShown({
                    rootItem: $rootItem,
                    submenu: submenu
                })
            },
            _submenuOnHidingHandler: function($rootItem, submenu, eventArgs) {
                var $border = $rootItem.children("." + DX_CONTEXT_MENU_CONTAINER_BORDER_CLASS),
                    args = eventArgs;
                args.rootItem = $rootItem;
                args.submenu = submenu;
                this._actions.onSubmenuHiding(args);
                eventArgs = args;
                if (!eventArgs.cancel) {
                    $border.hide();
                    $rootItem.removeClass(DX_MENU_ITEM_EXPANDED_CLASS)
                }
            },
            _submenuOnHiddenHandler: function($rootItem, submenu) {
                this._actions.onSubmenuHidden({
                    rootItem: $rootItem,
                    submenu: submenu
                })
            },
            _submenuMouseEnterHandler: function($rootItem) {
                this._hoveredContextMenuContainer = $rootItem
            },
            _submenuMouseLeaveHandler: function($rootItem) {
                var that = this,
                    showFirstSubmenuMode = this._getShowFirstSubmenuMode(),
                    $submenu;
                if (showFirstSubmenuMode !== 'onClick')
                    setTimeout(function() {
                        if (!that._hoveredContextMenuContainer || !that._hoveredContextMenuContainer.is(that._hoveredRootItem)) {
                            $submenu = that._getSubmenuElementByRootElement($rootItem);
                            if ($submenu.length)
                                that._hideSubmenu($submenu)
                        }
                        that._hoveredContextMenuContainer = null
                    }, DX_MENU_HOVERSTAY_TIMEOUT)
            },
            _getSubmenuElementByRootElement: function($rootItem) {
                return $rootItem && $rootItem.children('.' + DX_CONTEXT_MENU_CLASS)
            },
            _getSubmenuInstanceByRootElement: function($rootItem) {
                var $submenu = this._getSubmenuElementByRootElement($rootItem);
                return $submenu.length && $submenu.dxSubmenu('instance')
            },
            getSubmenuPosition: function($rootItem) {
                var isVerticalMenu = this.option('orientation').toLowerCase() == 'vertical',
                    submenuDirection = this.option('submenuDirection').toLowerCase(),
                    rtlEnabled = this.option('rtlEnabled'),
                    submenuPosition = {
                        collision: 'flip',
                        of: $rootItem
                    };
                switch (submenuDirection) {
                    case'leftortop':
                        submenuPosition.at = isVerticalMenu ? 'left top' : 'left top';
                        submenuPosition.my = isVerticalMenu ? 'right top' : 'left bottom';
                        break;
                    case'rightorbottom':
                        submenuPosition.at = isVerticalMenu ? 'right top' : 'left bottom';
                        submenuPosition.my = isVerticalMenu ? 'left top' : 'left top';
                        break;
                    case'auto':
                    default:
                        if (isVerticalMenu) {
                            submenuPosition.at = rtlEnabled ? 'left top' : 'right top';
                            submenuPosition.my = rtlEnabled ? 'right top' : 'left top'
                        }
                        else {
                            submenuPosition.at = rtlEnabled ? 'right bottom' : 'left bottom';
                            submenuPosition.my = rtlEnabled ? 'right top' : 'left top'
                        }
                        break
                }
                return submenuPosition
            },
            _renderBorderElement: function($item) {
                $('<div>').appendTo($item).addClass(DX_CONTEXT_MENU_CONTAINER_BORDER_CLASS).hide()
            },
            _hoverStartHandler: function(e) {
                var that = this,
                    mouseMoveEventName = events.addNamespace('dxpointermove', this.NAME),
                    $item = this._getItemElementByEventArgs(e),
                    submenu = this._getSubmenuInstanceByRootElement($item),
                    showFirstSubmenuMode = this._getShowFirstSubmenuMode(),
                    isHoverStayMode = showFirstSubmenuMode !== 'onHover',
                    isSelectionActive = utils.isDefined(e.buttons) && e.buttons === 1 || !utils.isDefined(e.buttons) && e.which === 1;
                if (this._isItemDisabled($item))
                    return;
                $item.off(mouseMoveEventName);
                if (showFirstSubmenuMode !== 'onClick' && submenu && !isSelectionActive) {
                    clearTimeout(this._hideSubmenuTimer);
                    clearTimeout(this._showSubmenuTimer);
                    if (isHoverStayMode && !submenu._overlay.option('visible')) {
                        $item.on(mouseMoveEventName, $.proxy(this._itemMouseMoveHandler, this));
                        this._showSubmenuTimer = DX_MENU_HOVERSTAY_TIMEOUT
                    }
                    else
                        this._showSubmenu($item)
                }
            },
            _hoverEndHandler: function(eventArg) {
                var that = this,
                    $item = this._getItemElementByEventArgs(eventArg),
                    $submenu,
                    showFirstSubmenuMode = this._getShowFirstSubmenuMode(),
                    timeout = this._getShowFirstSubmenuMode() !== 'onHover' ? DX_MENU_HOVERSTAY_TIMEOUT : DX_MENU_HOVER_TIMEOUT;
                if (this._isItemDisabled($item))
                    return;
                if ($(eventArg.relatedTarget).hasClass(DX_CONTEXT_MENU_CONTENT_DELIMITER_CLASS))
                    return;
                if (showFirstSubmenuMode !== 'onClick') {
                    clearTimeout(this._showSubmenuTimer);
                    clearTimeout(this._hideSubmenuTimer);
                    this._hideSubmenuTimer = setTimeout(function() {
                        $submenu = that._getSubmenuElementByRootElement($item);
                        if ($submenu.length)
                            that._hideSubmenu($submenu)
                    }, timeout)
                }
            },
            _showSubmenu: function($itemElement) {
                var $submenu = this._getSubmenuElementByRootElement($itemElement);
                if (this._visibleSubmenu.length && !this._visibleSubmenu.is($submenu))
                    this._hideSubmenu(this._visibleSubmenu);
                $submenu.length && $submenu.dxSubmenu('instance').show();
                this._visibleSubmenu = $submenu;
                this._hoveredRootItem = $itemElement
            },
            _hideSubmenu: function($submenu) {
                if (!this._hoveredRootItem || !this._hoveredRootItem.is(this._hoveredContextMenuContainer)) {
                    $submenu.length && $submenu.dxSubmenu('instance').hide();
                    if (this._visibleSubmenu.length && this._visibleSubmenu.is($submenu))
                        this._visibleSubmenu = []
                }
                this._hoveredRootItem = null
            },
            _itemMouseMoveHandler: function(e) {
                var that = this,
                    $item = $(e.currentTarget),
                    submenu = this._getSubmenuInstanceByRootElement($item);
                if (this._showSubmenuTimer) {
                    clearTimeout(this._hideSubmenuTimer);
                    clearTimeout(this._showSubmenuTimer);
                    this._showSubmenuTimer = setTimeout(function() {
                        if (!submenu._overlay.option('visible'))
                            that._showSubmenu($item)
                    }, DX_MENU_HOVERSTAY_TIMEOUT)
                }
            },
            _updateSubmenuVisibilityOnClick: function(actionArgs) {
                var $item,
                    item,
                    submenu,
                    args = actionArgs.args.length && actionArgs.args[0];
                if (args) {
                    args.jQueryEvent.stopPropagation();
                    item = args.itemData;
                    $item = args.itemElement;
                    if (item.disabled)
                        return;
                    submenu = this._getSubmenuInstanceByRootElement($item);
                    this._updateSelectedItemOnClick(actionArgs);
                    if (submenu)
                        if (submenu._overlay.option('visible')) {
                            if (this._getShowFirstSubmenuMode() === 'onClick')
                                this._hideSubmenu(submenu.element())
                        }
                        else
                            this._showSubmenu($item);
                    else if (this._visibleSubmenu.length)
                        this._hideSubmenu(this._visibleSubmenu)
                }
            },
            _optionChanged: function(args) {
                if (this._cancelOptionChange)
                    return;
                this._hideShownSubmenuOnOptionChange(args.name);
                switch (args.name) {
                    case'selectedItems':
                        var item = args.value[0];
                        if (this._isItemInSubmenu(item)) {
                            this._syncSelectionOptions(args.name);
                            this._normalizeSelectedItems()
                        }
                        else
                            this.callBase(args);
                        break;
                    case'orientation':
                    case'submenuDirection':
                        this._invalidate();
                        break;
                    case'showFirstSubmenuMode':
                        this._getShowSubmenuMode() === 'auto' && this._changeSubmenusOption('showSubmenuMode', this._getShowFirstSubmenuMode());
                        break;
                    case'showSubmenuMode':
                        this._changeSubmenusOption(args.name, args.value);
                        break;
                    case'onSubmenuShowing':
                    case'onSubmenuShown':
                    case'onSubmenuHiding':
                    case'onSubmenuHidden':
                        this._initActions();
                        break;
                    default:
                        this.callBase(args)
                }
            },
            _hideShownSubmenuOnOptionChange: function(optionName) {
                if (optionName !== "focusedElement" && this._visibleSubmenu.length)
                    this._hideSubmenu(this._visibleSubmenu)
            },
            _changeSubmenusOption: function(name, value) {
                $.each(this._submenus, function(index, submenu) {
                    submenu.option(name, value)
                })
            },
            _isItemInSubmenu: function(item) {
                return $.inArray(JSON.stringify(item), this._getStringifiedArray(this.option("items"))) < 0
            },
            selectItem: function(itemElement) {
                var itemData = this._getItemData(itemElement);
                if (this._isItemInSubmenu(itemData))
                    $.each(this._submenus, function(index, submenu) {
                        if (submenu._isOwnItem(itemData))
                            submenu.selectItem(itemElement)
                    });
                else
                    this.callBase(itemElement)
            }
        }));
        DX.registerComponent("dxSubmenu", ui.dxMenu, dxSubmenu);
        ui.dxMenu.__internals = {}
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.treeView.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            events = ui.events,
            dataUtils = DX.data.utils,
            utils = DX.utils;
        var WIDGET_CLASS = "dx-treeview",
            NODE_CONTAINER_CLASS = "dx-treeview-node-container",
            OPENED_NODE_CONTAINER_CLASS = "dx-treeview-node-container-opened",
            NODE_CLASS = "dx-treeview-node",
            ITEM_CLASS = "dx-treeview-item",
            ITEM_WITH_CHECKBOX_CLASS = "dx-treeview-item-with-checkbox",
            ITEM_DATA_KEY = "dx-treeview-item-data",
            IS_LEAF = "dx-treeview-node-is-leaf",
            TOGGLE_ITEM_VISIBILITY_CLASS = "dx-treeview-toggle-item-visibility",
            TOGGLE_ITEM_VISIBILITY_OPENED_CLASS = "dx-treeview-toggle-item-visibility-opened",
            SELECT_ALL_ITEM_CLASS = "dx-treeview-select-all-item",
            FOCUSED_STATE_CLASS = "dx-state-focused",
            DISABLED_STATE_CLASS = "dx-state-disabled",
            DATA_ITEM_ID = "data-item-id",
            DBLCLICK_EVENT_NAME = "dxdblclick";
        var scrollableContainerUpdatedOnInit = $.noop;
        DX.registerComponent("dxTreeView", ui, ui.CollectionWidget.inherit({
            _supportedKeys: function(e) {
                var click = function(e) {
                        var $itemElement = this.option("focusedElement");
                        if (!$itemElement)
                            return;
                        e.target = $itemElement;
                        e.currentTarget = $itemElement;
                        this._itemClickHandler(e, $itemElement.find(">." + ITEM_CLASS))
                    };
                var select = function(e) {
                        e.preventDefault();
                        this._changeCheckBoxState(this.option("focusedElement"))
                    };
                var expandAllItems = function(e) {
                        if (!this.option("expandAllEnabled"))
                            return;
                        e.preventDefault();
                        var $rootElement = this.option("focusedElement");
                        if (!$rootElement)
                            return;
                        var rootItem = this._getItemData($rootElement.find("." + ITEM_CLASS)),
                            firstItems = [rootItem];
                        var expandedItems = [];
                        this._expandAllItems(firstItems, expandedItems);
                        this._suppressDeprecatedWarnings();
                        this.option("expandedItems", expandedItems);
                        this._resumeDeprecatedWarnings()
                    };
                var collapseAllItems = function(e) {
                        if (!this.option("expandAllEnabled"))
                            return;
                        e.preventDefault();
                        var $rootElement = this.option("focusedElement");
                        if (!$rootElement)
                            return;
                        var rootItem = this._getItemData($rootElement.find("." + ITEM_CLASS)),
                            firstItems = [rootItem];
                        this._suppressDeprecatedWarnings();
                        var collapsedItems = [];
                        this._collapseAllItems(firstItems, collapsedItems);
                        var expandedItems = $.grep(this.option("expandedItems"), function(value) {
                                return $.inArray(value, collapsedItems) == -1
                            });
                        this.option("expandedItems", expandedItems);
                        this._resumeDeprecatedWarnings()
                    };
                return $.extend(this.callBase(), {
                        enter: this.option("showCheckBoxes") ? select : click,
                        space: this.option("showCheckBoxes") ? select : click,
                        asterisk: expandAllItems,
                        minus: collapseAllItems
                    })
            },
            _changeCheckBoxState: function($element) {
                var $checkbox = $element.find("> .dx-checkbox");
                var checkboxInstance = $checkbox.dxCheckBox("instance"),
                    currentState = checkboxInstance.option("value");
                if (!checkboxInstance.option("disabled"))
                    this._updateItemSelection(!currentState, $element.find("." + ITEM_CLASS).get(0), true, $element)
            },
            _expandAllItems: function(items, expandedItems) {
                if (!items)
                    return;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    expandedItems.push(item);
                    var node = this._getNodeByKey(this._keyGetter(item));
                    this._fireExpandedStateUpdatedEvt(true, item);
                    this._commonExpandedSetter(item, node, true);
                    if (item.items)
                        this._expandAllItems(item.items, expandedItems)
                }
            },
            _getNodeElementById: function(id) {
                return this.element().find("[" + DATA_ITEM_ID + "='" + id + "']")
            },
            _collapseAllItems: function(items, collapsedItems) {
                if (!items)
                    return;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var node = this._getNodeByKey(this._keyGetter(item));
                    this._fireExpandedStateUpdatedEvt(false, item);
                    this._commonExpandedSetter(item, node, false);
                    collapsedItems.push(item);
                    if (item.items)
                        this._collapseAllItems(item.items, collapsedItems)
                }
            },
            _activeStateUnit: "." + ITEM_CLASS,
            _setDefaultOptions: function() {
                this.callBase();
                this.option({
                    dataStructure: "tree",
                    expandedItems: [],
                    expandAllEnabled: false,
                    keyExpr: "id",
                    displayExpr: null,
                    selectedExpr: "selected",
                    expandedExpr: "expanded",
                    disabledExpr: "disabled",
                    itemsExpr: "items",
                    parentIdExpr: "parentId",
                    showCheckBoxes: false,
                    selectNodesRecursive: true,
                    selectAllEnabled: false,
                    selectAllText: "(" + Globalize.localize("dxList-selectAll") + ")",
                    onItemSelected: null,
                    onItemExpanded: null,
                    onItemCollapsed: null,
                    scrollDirection: "vertical",
                    focusStateEnabled: false,
                    selectionMode: "multi"
                })
            },
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {
                    selectedItems: {
                        since: "14.2",
                        message: "Use item.selected instead"
                    },
                    expandedItems: {
                        since: "14.2",
                        message: "Use item.expanded instead"
                    }
                })
            },
            _initSelectedItems: $.noop,
            _syncSelectionOptions: $.noop,
            _fireSelectionChanged: function() {
                var selectionChangePromise = this._selectionChangePromise;
                $.when(selectionChangePromise).done($.proxy(function() {
                    this._createActionByOption("onSelectionChanged", {excludeValidators: ["disabled", "readOnly"]})()
                }, this))
            },
            _initExpressions: function() {
                this._compileKeyAccessors();
                this._compileDisplayAccessors();
                this._compileSelectedAccessors();
                this._compileExpandedAccessors();
                this._compileItemsAccessors();
                this._compileParentIdAccessors();
                this._compileDisabledAccessors()
            },
            _initDynamicTemplates: function() {
                if (this.option("displayExpr"))
                    this._dynamicTemplates["item"] = new ui.DefaultTemplate($.proxy(function(itemData) {
                        var $itemContent = $("<div>");
                        if (itemData.icon)
                            $('<span>').addClass("dx-icon-" + itemData.icon).addClass("dx-icon").appendTo($itemContent);
                        if (itemData.iconSrc)
                            $('<img>').attr("src", itemData.iconSrc).addClass("dx-icon").appendTo($itemContent);
                        $("<span>").text(this._displayGetter(itemData)).appendTo($itemContent);
                        return $itemContent
                    }, this));
                else
                    delete this._dynamicTemplates["item"]
            },
            _compileKeyAccessors: function() {
                this._keyGetter = dataUtils.compileGetter(this.option("keyExpr"));
                this._keySetter = dataUtils.compileSetter(this.option("keyExpr"))
            },
            _compileDisplayAccessors: function() {
                if (!this.option("displayExpr") && this.option("dataStructure") === "plain")
                    this.option("displayExpr", "text");
                this._displayGetter = dataUtils.compileGetter(this.option("displayExpr"));
                this._displaySetter = dataUtils.compileSetter(this.option("displayExpr"))
            },
            _compileSelectedAccessors: function() {
                this._selectedGetter = dataUtils.compileGetter(this.option("selectedExpr"));
                this._selectedSetter = dataUtils.compileSetter(this.option("selectedExpr"))
            },
            _compileExpandedAccessors: function() {
                this._expandedGetter = dataUtils.compileGetter(this.option("expandedExpr"));
                this._expandedSetter = dataUtils.compileSetter(this.option("expandedExpr"))
            },
            _compileItemsAccessors: function() {
                this._itemsGetter = dataUtils.compileGetter(this.option("itemsExpr"));
                this._itemsSetter = dataUtils.compileSetter(this.option("itemsExpr"))
            },
            _compileParentIdAccessors: function() {
                this._parentIdGetter = dataUtils.compileGetter(this.option("parentIdExpr"));
                this._parentIdSetter = dataUtils.compileSetter(this.option("parentIdExpr"))
            },
            _compileDisabledAccessors: function() {
                this._disabledGetter = dataUtils.compileGetter(this.option("disabledExpr"));
                this._disabledSetter = dataUtils.compileSetter(this.option("disabledExpr"))
            },
            _defaultOptionsRules: function() {
                return this.callBase().concat([{
                            device: function(device) {
                                return DX.devices.real().generic && !DX.devices.isSimulator()
                            },
                            options: {
                                hoverStateEnabled: true,
                                focusStateEnabled: true
                            }
                        }])
            },
            _optionChanged: function(args) {
                var name = args.name,
                    value = args.value;
                switch (name) {
                    case"selectAllEnabled":
                        if (value) {
                            if (!this._$selectAllItem || !this._$selectAllItem.length)
                                this._renderSelectAllItem()
                        }
                        else if (this._$selectAllItem) {
                            this._$selectAllItem.remove();
                            delete this._$selectAllItem
                        }
                        break;
                    case"selectAllText":
                        if (this._$selectAllItem)
                            this._$selectAllItem.dxCheckBox("instance").option("text", value);
                        break;
                    case"scrollDirection":
                        this._scrollableContainer.option("direction", value);
                        break;
                    case"selectedItems":
                        if (this._$selectAllItem) {
                            var selectAllItem = this._$selectAllItem.dxCheckBox("instance"),
                                selectAllItemValue = selectAllItem.option("value");
                            if (selectAllItemValue && this._itemsCount === value.length)
                                return;
                            this._suppressUpdateSelectAllItemValue = true;
                            selectAllItem.option("value", this._calculateSelectAllItemValue());
                            this._suppressUpdateSelectAllItemValue = false
                        }
                        break;
                    case"items":
                        this._suppressDeprecatedWarnings();
                        delete this._$selectAllItem;
                        this.callBase(args);
                        this._resumeDeprecatedWarnings();
                        break;
                    case"keyExpr":
                    case"displayExpr":
                        if (!this._dynamicTemplates["item"])
                            this._initDynamicTemplates();
                    case"itemsExpr":
                    case"selectedExpr":
                    case"expandedExpr":
                    case"parentIdExpr":
                    case"disabledExpr":
                        this._initExpressions();
                    case"dataStructure":
                    case"showCheckBoxes":
                        this.repaint();
                        break;
                    case"expandedItems":
                        var isFocused = this.element().hasClass(FOCUSED_STATE_CLASS);
                        this.repaint();
                        if (isFocused) {
                            this.element().focus();
                            var key = this.option("focusedElement").attr(DATA_ITEM_ID);
                            var $node = this._getNodeElementById(key);
                            this.option("focusedElement", $node)
                        }
                        break;
                    case"selectNodesRecursive":
                    case"onItemSelected":
                    case"onItemExpanded":
                    case"onItemCollapsed":
                    case"expandAllEnabled":
                        break;
                    default:
                        this.callBase(args)
                }
            },
            _nodes: [],
            _init: function() {
                this._initExpressions();
                this.callBase();
                this._initDynamicTemplates()
            },
            _render: function() {
                var that = this;
                this.element().addClass(WIDGET_CLASS);
                this._itemsCount = 0;
                this.element().off("dxpointerdown").on("dxpointerdown", function(e) {
                    var $target = $(e.target).closest(that._activeStateUnit);
                    if (!$target.length)
                        e.preventDefault()
                });
                this._makeNodes();
                this._setKeyForItems(this._nodes, 1);
                this.callBase()
            },
            _makeNodes: function() {
                this._nodes = this._getSmartItemsCopy(this.option("items"));
                if (this.option("dataStructure") === "plain")
                    this._nodes = this._createHierarchicalStructure(this._nodes)
            },
            _getSmartItemsCopy: function(items) {
                var that = this,
                    result = [];
                $.each(items, function(_, item) {
                    var itemCopy = $.extend(true, {}, item);
                    if (that._itemHasChildren(itemCopy)) {
                        var children = that._itemsGetter(itemCopy);
                        var childrenCopy = that._getSmartItemsCopy(children);
                        that._itemsSetter(itemCopy, childrenCopy)
                    }
                    result.push(itemCopy)
                });
                return result
            },
            _setKeyForItems: function(items, startKey) {
                var that = this;
                $.each(items, function(index, item) {
                    if (that._isPrimitiveValue(item))
                        item = that._makeObjectFromPrimitive(item);
                    if (utils.isDefined(that._keyGetter(item)))
                        return false;
                    that._keySetter(item, startKey);
                    startKey++;
                    if (that._itemHasChildren(item))
                        startKey = that._setKeyForItems(that._itemsGetter(item), startKey)
                });
                return startKey
            },
            _makePlainItems: function() {
                return this._makePlainList(this.option("items"), null, true)
            },
            _makePlainNodes: function() {
                return this._makePlainList(this._nodes, null, true)
            },
            _updateSelectionItemsOption: function() {
                var that = this,
                    selectedItems = [];
                $.each(that._plainItems, function(_, item) {
                    if (that._selectedGetter(item))
                        selectedItems.push(item)
                });
                return selectedItems
            },
            _renderContentImpl: function() {
                var items = this._nodes;
                if (items.length) {
                    this._ind = 1;
                    this._plainItems = this._makePlainItems();
                    this._ind = 1;
                    this._plainNodes = this._makePlainNodes();
                    this._applyExpandedItemsFromOption();
                    this._applySelectedItemsFromOption(items);
                    var plainList = this._makePlainList(items, null);
                    if (this.option("selectNodesRecursive")) {
                        items = this._calculateChildrenSelectedState(items);
                        this._calculateParentSelectedState(plainList)
                    }
                    this._calculateParentExpandedState(plainList);
                    this._createParentFieldForEachItem(items);
                    this._suppressDeprecatedWarnings();
                    var selectedItems = this._updateSelectionItemsOption();
                    if (selectedItems.length)
                        this.option("selectedItems", selectedItems);
                    this._resumeDeprecatedWarnings();
                    this._renderScrollableContainer();
                    var $nodeContainer = this._renderNodeContainer();
                    this._scrollableContainer.content().append($nodeContainer);
                    this._renderItems($nodeContainer, items, true);
                    if (this.option("selectAllEnabled"))
                        this._renderSelectAllItem($nodeContainer)
                }
                this._renderEmptyMessage()
            },
            _fireContentReadyAction: function() {
                this.callBase();
                if (this._scrollableContainer && this._scrollableContainer.content().height() > this.element().height()) {
                    this._scrollableContainer.update();
                    scrollableContainerUpdatedOnInit()
                }
            },
            _createHierarchicalStructure: function(items) {
                var result = [],
                    lookup = {},
                    itemCount = items.length;
                for (var i = 0; i < itemCount; i++) {
                    lookup[this._keyGetter(items[i])] = items[i];
                    this._itemsSetter(items[i], [])
                }
                for (var i = 0; i < itemCount; i++) {
                    var parentId = this._parentIdGetter(items[i]),
                        node = this._createNode(items[i]);
                    if (parentId) {
                        var children = this._itemsGetter(lookup[parentId]);
                        children.push(node)
                    }
                    else
                        result.push(node)
                }
                return result
            },
            _createNode: function(itemData) {
                var node = {};
                this._keySetter(node, this._keyGetter(itemData));
                this._displaySetter(node, this._displayGetter(itemData));
                this._itemsSetter(node, this._itemsGetter(itemData));
                this._expandedSetter(node, this._expandedGetter(itemData));
                this._disabledSetter(node, this._disabledGetter(itemData));
                if (itemData.hasOwnProperty(this.option("selectedExpr")) && typeof this._selectedGetter(itemData) !== "undefined")
                    this._selectedSetter(node, this._selectedGetter(itemData));
                else
                    this._selectedSetter(node, false);
                return node
            },
            _createParentFieldForEachItem: function(items, parent) {
                var that = this,
                    parent = parent ? $.extend(true, {}, parent) : null;
                $.each(items, function(_, item) {
                    that._itemsCount++;
                    if (utils.isDefined(parent) && that._itemsGetter(parent))
                        that._itemsSetter(parent, null);
                    if (that._isPrimitiveValue(item))
                        item = that._makeObjectFromPrimitive(item);
                    item.parent = parent;
                    that._plainNodes[that._keyGetter(item)].parent = parent;
                    if (that._itemHasChildren(item))
                        that._createParentFieldForEachItem(that._itemsGetter(item), item)
                })
            },
            _makeObjectFromPrimitive: function(item) {
                var key = item;
                item = {};
                this._keySetter(item, key);
                return item
            },
            _isPrimitiveValue: function(value) {
                return $.inArray($.type(value), ["object", "array", "function"]) === -1
            },
            _itemHasChildren: function(item) {
                var items = this._itemsGetter(item);
                return items && items.length
            },
            _renderScrollableContainer: function() {
                var $scrollableContainer = $("<div />").dxScrollable({
                        direction: this.option("scrollDirection"),
                        useKeyboard: false
                    }).appendTo(this.element());
                this._scrollableContainer = $scrollableContainer.dxScrollable("instance")
            },
            _renderNodeContainer: function($parent) {
                var $container = $("<ul />").addClass(NODE_CONTAINER_CLASS);
                if ($parent) {
                    var itemData = this._getItemData($parent.find("> ." + ITEM_CLASS));
                    if (this._expandedGetter(itemData))
                        $container.addClass(OPENED_NODE_CONTAINER_CLASS);
                    $container.appendTo($parent)
                }
                return $container
            },
            _renderItems: function($nodeContainer, items) {
                var that = this,
                    showCheckBoxes = that.option("showCheckBoxes");
                $.each(items, function(i, item) {
                    if (that._isPrimitiveValue(item))
                        item = that._makeObjectFromPrimitive(item);
                    var key = that._keyGetter(item);
                    var $node = $("<li />").addClass(NODE_CLASS).appendTo($nodeContainer).attr(DATA_ITEM_ID, key);
                    var sourceItem = that._getSourceItemByKey(key);
                    var $item = that._renderItem.call(that, i, sourceItem, $node);
                    that._attachDblclickToItem($item);
                    if (showCheckBoxes)
                        that._renderCheckBox($node, item);
                    var nestedItems = that._itemsGetter(item);
                    if ($.isArray(nestedItems) && nestedItems.length) {
                        that._renderToggleItemVisibilityIcon($node, item);
                        var $nestedNodeContainer = that._renderNodeContainer($node);
                        if (that._expandedGetter(item)) {
                            that._renderItems($nestedNodeContainer, nestedItems, false);
                            $nestedNodeContainer.addClass(OPENED_NODE_CONTAINER_CLASS)
                        }
                    }
                    else
                        $node.addClass(IS_LEAF)
                });
                this._renderFocusTarget()
            },
            _attachDblclickToItem: function($item) {
                var that = this,
                    eventName = events.addNamespace(DBLCLICK_EVENT_NAME, that.NAME);
                $item.off(eventName).on(eventName, function() {
                    var itemData = that._getItemData($item);
                    that._toggleExpandedState(itemData)
                })
            },
            _toggleExpandedState: function(itemData, state, e) {
                if (this._disabledGetter(itemData))
                    return;
                if (!utils.isDefined(state))
                    state = !this._expandedGetter(itemData);
                this._updateExpandedState(itemData, state);
                this._updateExpandedItemsUI(itemData);
                this._fireExpandedStateUpdatedEvt(state, itemData, e)
            },
            _getSourceItemByKey: function(key) {
                return this._plainItems[key]
            },
            _getItemKey: function(itemData) {
                var result = this._keyGetter(itemData);
                if (!utils.isDefined(result))
                    result = this._getKeyForSourceItem(itemData);
                return result
            },
            _getKeyForSourceItem: function(itemData) {
                var result = null;
                $.each(this._plainItems, function(key, item) {
                    if (itemData === item) {
                        result = key;
                        return false
                    }
                });
                return result
            },
            _getNodeByKey: function(key) {
                return this._plainNodes[key]
            },
            _renderSelectAllItem: function($container) {
                $container = $container || this.element().find("." + NODE_CONTAINER_CLASS).first();
                this._$selectAllItem = $("<div />").dxCheckBox({
                    value: this._calculateSelectAllItemValue(),
                    text: this.option("selectAllText"),
                    onValueChanged: $.proxy(this._toggleSelectAll, this)
                }).addClass(SELECT_ALL_ITEM_CLASS);
                $container.before(this._$selectAllItem)
            },
            _calculateSelectAllItemValue: function() {
                this._suppressDeprecatedWarnings();
                var result = false,
                    selectedItemsCount = this.option("selectedItems").length;
                if (selectedItemsCount)
                    result = this._itemsCount === selectedItemsCount ? true : undefined;
                this._resumeDeprecatedWarnings();
                return result
            },
            _toggleSelectAll: function(args) {
                if (!this._suppressUpdateSelectAllItemValue) {
                    this._suppressDeprecatedWarnings();
                    this._updateAllItems(this._nodes, args.value);
                    if (!args.value)
                        this.option("selectedItems", []);
                    else {
                        var selectedItems = this._updateSelectionItemsOption();
                        this.option("selectedItems", selectedItems)
                    }
                    this._resumeDeprecatedWarnings();
                    this._fireSelectionChanged()
                }
            },
            _updateAllItems: function(nodes, value) {
                var that = this;
                $.each(nodes, function(_, node) {
                    var $node = that._getNodeElementById(that._keyGetter(node));
                    var itemData = that._getSourceItemByKey(that._keyGetter(node)),
                        currentState = that._selectedGetter(node);
                    if (currentState === value)
                        return true;
                    if ($node.length)
                        $node.find("> .dx-checkbox").dxCheckBox("instance").option("value", value);
                    that._selectedSetter(node, value);
                    that._selectedSetter(itemData, value);
                    $node = null;
                    if (that._itemHasChildren(node))
                        that._updateAllItems(that._itemsGetter(node), value)
                })
            },
            _applySelectedItemsFromOption: function(items) {
                var that = this;
                this._suppressDeprecatedWarnings();
                $.each(this.option("selectedItems"), function(_, item) {
                    var currentItem = that._getItemFromArray(item, items);
                    if (currentItem) {
                        var currentNode = that._getNodeByKey(that._keyGetter(currentItem));
                        that._selectedSetter(currentItem, true);
                        that._selectedSetter(currentNode, true)
                    }
                    var node = that._getNodeByKey(that._getItemKey(item));
                    that._selectedSetter(item, true);
                    that._selectedSetter(node, true)
                });
                this._resumeDeprecatedWarnings()
            },
            _applyExpandedItemsFromOption: function() {
                var that = this;
                this._suppressDeprecatedWarnings();
                $.each(this.option("expandedItems"), function(_, item) {
                    var node = that._getNodeByKey(that._getItemKey(item));
                    that._commonExpandedSetter(item, node, true)
                });
                this._resumeDeprecatedWarnings()
            },
            _commonExpandedSetter: function(item, node, value) {
                this._expandedSetter(item, value);
                this._expandedSetter(node, value)
            },
            _calculateChildrenSelectedState: function(items) {
                var that = this;
                $.each(items, function(_, item) {
                    if (that._selectedGetter(item))
                        if (that._itemHasChildren(item))
                            $.each(that._itemsGetter(item), function(_, child) {
                                var sourceItem = that._getSourceItemByKey(that._keyGetter(child));
                                that._selectedSetter(child, true);
                                that._selectedSetter(sourceItem, true)
                            });
                    if (that._itemHasChildren(item))
                        that._itemsSetter(item, that._calculateChildrenSelectedState(that._itemsGetter(item)))
                });
                return items
            },
            _makePlainList: function(items, plainList, makeHash) {
                var that = this,
                    dataStructure = makeHash ? {} : [];
                plainList = plainList || dataStructure;
                $.each(items, function(_, item) {
                    if (makeHash) {
                        if (that._isPrimitiveValue(item))
                            item = that._makeObjectFromPrimitive(item);
                        var index = that._keyGetter(item);
                        if (!utils.isDefined(index))
                            index = that._ind;
                        plainList[index] = item;
                        that._ind++
                    }
                    else
                        plainList.push(item);
                    if (that._itemHasChildren(item))
                        that._makePlainList(that._itemsGetter(item), plainList, makeHash)
                });
                return plainList
            },
            _calculateParentSelectedState: function(list) {
                var listSize = list.length - 1,
                    that = this;
                for (var i = listSize; i >= 0; i--) {
                    if (this._selectedGetter(list[i]))
                        continue;
                    var children = this._itemsGetter(list[i]),
                        childrenCount = 0;
                    if (children && children.length)
                        childrenCount = children.length;
                    if (childrenCount) {
                        var selectedChildren = $.grep(children, function(child) {
                                return that._selectedGetter(child) === true
                            });
                        var indeterminateChildren = $.grep(children, function(child) {
                                return child.hasOwnProperty(that.option("selectedExpr")) && typeof that._selectedGetter(child) === "undefined"
                            });
                        var sourceItem = this._getSourceItemByKey(this._keyGetter(list[i]));
                        if (selectedChildren.length) {
                            var selected = selectedChildren.length === childrenCount ? true : undefined;
                            this._selectedSetter(list[i], selected);
                            this._selectedSetter(sourceItem, selected)
                        }
                        else if (indeterminateChildren.length) {
                            this._selectedSetter(list[i], undefined);
                            this._selectedSetter(sourceItem, undefined)
                        }
                        else {
                            this._selectedSetter(list[i], false);
                            this._selectedSetter(sourceItem, false)
                        }
                    }
                }
                return list
            },
            _calculateParentExpandedState: function(list) {
                var listSize = list.length - 1,
                    that = this;
                for (var i = listSize; i >= 0; i--) {
                    if (this._expandedGetter(list[i]))
                        continue;
                    var children = this._itemsGetter(list[i]),
                        childrenCount = 0;
                    if (children && children.length)
                        childrenCount = children.length;
                    if (childrenCount) {
                        var expandedChildren = $.grep(children, function(child) {
                                return that._expandedGetter(child) === true
                            });
                        if (expandedChildren.length) {
                            var sourceItem = this._getSourceItemByKey(this._keyGetter(list[i]));
                            this._commonExpandedSetter(list[i], sourceItem, true)
                        }
                    }
                }
            },
            _renderCheckBox: function($node, node) {
                var checkBoxValue = this._calculateCheckBoxValue(node);
                $node.addClass(ITEM_WITH_CHECKBOX_CLASS);
                var $checkbox = $("<div />").dxCheckBox({
                        value: checkBoxValue,
                        onValueChanged: $.proxy(this._changeCheckboxValue, this),
                        focusStateEnabled: false,
                        disabled: this._disabledGetter(node)
                    }).appendTo($node);
                this._attachCheckboxClick($checkbox, node)
            },
            _attachCheckboxClick: function($checkbox, node) {
                var eventName = events.addNamespace("dxclick", this.NAME),
                    key = this._keyGetter(node);
                var handleItemSelected = function(e) {
                        this._itemJQueryEventHandler(e, "onItemSelected", {node: this._getNodeByKey(key)})
                    };
                $checkbox.off(eventName).on(eventName, $.proxy(handleItemSelected, this))
            },
            _renderToggleItemVisibilityIcon: function($node, itemData) {
                var $icon = $("<div />").addClass(TOGGLE_ITEM_VISIBILITY_CLASS).appendTo($node);
                if (this._expandedGetter(itemData)) {
                    $icon.addClass(TOGGLE_ITEM_VISIBILITY_OPENED_CLASS);
                    $node.parent().addClass(OPENED_NODE_CONTAINER_CLASS)
                }
                if (this._disabledGetter(itemData))
                    $icon.addClass(DISABLED_STATE_CLASS);
                this._renderToggleItemVisibilityIconClick($icon, itemData)
            },
            _renderToggleItemVisibilityIconClick: function($icon, itemData) {
                var eventName = events.addNamespace("dxclick", this.NAME),
                    that = this;
                $icon.off(eventName).on(eventName, function(e) {
                    var $item = $icon.parent().find(">." + ITEM_CLASS),
                        itemData = that._getItemData($item);
                    that._toggleExpandedState(itemData, undefined, e)
                })
            },
            _updateExpandedState: function(itemData, isExpanded) {
                this._suppressDeprecatedWarnings();
                var expandedItems = this.option("expandedItems"),
                    key = this._getItemKey(itemData),
                    node = this._getNodeByKey(key),
                    that = this;
                that._commonExpandedSetter(itemData, node, isExpanded);
                if (isExpanded) {
                    if (!that._getItemFromArray(itemData, expandedItems))
                        expandedItems.push(itemData)
                }
                else
                    $.each(expandedItems, function(i, item) {
                        if (that._keyGetter(item) === key) {
                            expandedItems.splice(i, 1);
                            return false
                        }
                    });
                this._resumeDeprecatedWarnings()
            },
            _updateExpandedItemsUI: function(itemData) {
                var $node = this._getNodeElementById(this._getItemKey(itemData)),
                    $icon = $node.find(">." + TOGGLE_ITEM_VISIBILITY_CLASS),
                    $nodeContainer = $node.find(" > ." + NODE_CONTAINER_CLASS);
                $icon.toggleClass(TOGGLE_ITEM_VISIBILITY_OPENED_CLASS);
                this._renderNestedItems($nodeContainer);
                $nodeContainer.toggleClass(OPENED_NODE_CONTAINER_CLASS);
                this._scrollableContainer.update()
            },
            _fireExpandedStateUpdatedEvt: function(isExpanded, itemData, e) {
                var optionName = isExpanded ? "onItemExpanded" : "onItemCollapsed",
                    itemKey = this._getItemKey(itemData),
                    node = this._getNodeByKey(itemKey);
                var handler = this.option(optionName);
                if (handler)
                    handler.call(this, {
                        itemData: itemData,
                        node: node,
                        itemElement: this._getNodeElementById(this._keyGetter(itemData)).find(">." + ITEM_CLASS),
                        jQueryEvent: e
                    })
            },
            _renderNestedItems: function($container) {
                if (!$container.is(":empty"))
                    return;
                var itemData = this._getItemData($container.parent().find(">." + ITEM_CLASS)),
                    itemKey = this._getItemKey(itemData),
                    node = this._getNodeByKey(itemKey);
                this._renderItems($container, this._itemsGetter(node), false)
            },
            _calculateCheckBoxValue: function(itemData) {
                return itemData.hasOwnProperty(this.option("selectedExpr")) ? this._selectedGetter(itemData) : false
            },
            _changeCheckboxValue: function(e) {
                var $node = e.element.parent("." + NODE_CLASS),
                    itemData = this._getItemData($node.find("> ." + ITEM_CLASS)),
                    value = e.value,
                    key = this._getItemKey(itemData),
                    node = this._getNodeByKey(key);
                this._selectedSetter(itemData, value);
                this._selectedSetter(node, value);
                if (e.jQueryEvent && !this.option("selectNodesRecursive"))
                    this._fireSelectionChanged();
                if (!e.jQueryEvent || !this.option("selectNodesRecursive"))
                    return;
                this._updateParentsAndChildren(this._getNodeByKey(key), value, false, $node)
            },
            _updateParentsAndChildren: function(node, childValue, suppressOnSelectionChanged, $node) {
                if (node.parent)
                    this._updateParentsState(node, $node);
                if (this._itemHasChildren(node))
                    this._updateChildrenState(this._itemsGetter(node), childValue, $node);
                this._suppressDeprecatedWarnings();
                var selectedItems = this._updateSelectionItemsOption();
                this.option("selectedItems", selectedItems);
                this._resumeDeprecatedWarnings();
                if (!suppressOnSelectionChanged)
                    this._fireSelectionChanged()
            },
            _itemRenderDefault: function(item, index, $itemElement) {
                var $itemContent = $("<div />");
                $("<span>").text(this._displayGetter(item)).appendTo($itemContent);
                $itemContent.appendTo($itemElement)
            },
            _getItemFromArray: function(itemData, data) {
                var result = null,
                    that = this,
                    key = that._keyGetter(itemData);
                $.each(data, function(_, item) {
                    if (key === that._keyGetter(item)) {
                        result = item;
                        return false
                    }
                });
                return result
            },
            _calculateSelectedItemsOption: function(value, itemData) {
                var key = this._getItemKey(itemData),
                    node = this._getNodeByKey(key);
                this._selectedSetter(itemData, value);
                this._selectedSetter(node, value)
            },
            _reduceSelectedItemsOption: function(selectedItems, itemData) {
                var that = this,
                    itemDataKey = that._keyGetter(itemData);
                $.each(selectedItems, function(index, item) {
                    if (itemDataKey === that._keyGetter(item)) {
                        var unselectedItem = selectedItems.splice(index, 1)[0];
                        return false
                    }
                })
            },
            _updateParentsState: function(node, $node) {
                var currentItemData = this._getSourceItemByKey(this._keyGetter(node)),
                    parentNode = this._getNodeByKey(this._keyGetter(node.parent)),
                    that = this;
                $.each(this._itemsGetter(parentNode), function(_, item) {
                    if (that._keyGetter(node) === that._keyGetter(item))
                        that._selectedSetter(item, that._selectedGetter(node))
                });
                var nodesCount = this._itemsGetter(parentNode).length,
                    selectedNodesCount = this._getSelectedChildrenFromNode(parentNode),
                    intermediateNodesCount = this._getIntermediateChildrenFromNode(parentNode),
                    parentValue = undefined;
                if (selectedNodesCount === nodesCount)
                    parentValue = true;
                else if (!selectedNodesCount && !intermediateNodesCount)
                    parentValue = false;
                if ($node) {
                    var $parentNode = $($node.parents("." + NODE_CLASS)[0]);
                    $parentNode.find("> .dx-checkbox").dxCheckBox("instance").option("value", parentValue)
                }
                this._updateParentField(currentItemData, parentValue);
                if (parentNode.parent)
                    this._updateParentsState(parentNode, $parentNode);
                this._calculateSelectedItemsOption(parentValue, this._getSourceItemByKey(this._keyGetter(node.parent)))
            },
            _getSelectedChildrenFromNode: function(node) {
                var items = this._itemsGetter(node),
                    that = this;
                if (items && items.length)
                    return $.grep(items, function(item) {
                            return that._selectedGetter(item) === true
                        }).length;
                return 0
            },
            _getIntermediateChildrenFromNode: function(node) {
                var items = this._itemsGetter(node),
                    that = this;
                if (items && items.length)
                    return $.grep(items, function(item) {
                            return item.hasOwnProperty(that.option("selectedExpr")) && that._selectedGetter(item) === undefined
                        }).length;
                return 0
            },
            _updateChildrenState: function(childNodes, value, $node) {
                var that = this;
                $.each(childNodes, function(_, childNode) {
                    var itemData = that._getSourceItemByKey(that._keyGetter(childNode));
                    that._updateParentField(itemData, value);
                    that._calculateSelectedItemsOption(value, itemData);
                    if (that._itemHasChildren(childNode))
                        that._updateChildrenState(that._itemsGetter(childNode), value)
                });
                if ($node) {
                    var $childrenContainer = $node.find("> ." + NODE_CONTAINER_CLASS);
                    $childrenContainer.find(".dx-checkbox").each(function(_, checkbox) {
                        $(checkbox).dxCheckBox("instance").option("value", value)
                    })
                }
            },
            _updateParentField: function(itemData, value) {
                var node = this._getNodeByKey(this._getItemKey(itemData));
                if (node.parent !== null)
                    this._selectedSetter(node.parent, value)
            },
            _itemEventHandlerImpl: function(initiator, action, actionArgs) {
                var $itemElement = $(initiator).closest("." + NODE_CLASS).find("> ." + ITEM_CLASS);
                actionArgs = $.extend({
                    itemElement: $itemElement,
                    itemData: this._getItemData($itemElement)
                }, actionArgs);
                return action(actionArgs)
            },
            _itemClass: function() {
                return ITEM_CLASS
            },
            _itemDataKey: function() {
                return ITEM_DATA_KEY
            },
            _selectionEnabled: function() {
                return true
            },
            _attachClickEvent: function() {
                var that = this,
                    itemSelector = that._itemSelector(),
                    eventName = events.addNamespace("dxclick", that.NAME),
                    pointerDownEvent = events.addNamespace("dxpointerdown", this.NAME);
                that._itemContainer().off(eventName, itemSelector).on(eventName, itemSelector, function(e) {
                    that._itemClickHandler(e, $(this))
                }).off(pointerDownEvent, itemSelector).on(pointerDownEvent, itemSelector, $.proxy(this._itemPointerDownHandler, this))
            },
            _itemClickHandler: function(e, $item) {
                var itemData = this._getItemData($item);
                var node = this._getNodeByKey(this._getItemKey(itemData));
                this._itemJQueryEventHandler(e, "onItemClick", {node: node})
            },
            _updateItemSelection: function(value, itemElement, suppressOnSelectionChanged, $node) {
                var itemData = itemElement.nodeType ? this._getItemData(itemElement) : itemElement,
                    key = this._getItemKey(itemData),
                    node = this._getNodeByKey(key);
                if (this._disabledGetter(itemData))
                    return;
                var currentState = this._selectedGetter(node);
                if (currentState === value)
                    return;
                if (!$node) {
                    var $tmpNode = this._getNodeElementById(key);
                    if ($tmpNode.length)
                        $node = $tmpNode
                }
                if ($node)
                    $node.find("> .dx-checkbox").dxCheckBox("instance").option("value", value);
                this._selectedSetter(node, value);
                this._selectedSetter(itemData, value);
                this._calculateSelectedItemsOption(value, node);
                if (this.option("selectNodesRecursive"))
                    this._updateParentsAndChildren(node, value, suppressOnSelectionChanged, $node);
                else {
                    this._suppressDeprecatedWarnings();
                    var selectedItems = this._updateSelectionItemsOption();
                    this.option("selectedItems", selectedItems);
                    this._resumeDeprecatedWarnings()
                }
                var handler = this.option("onItemSelected");
                if (handler)
                    handler.call(this, {
                        itemData: itemData,
                        node: node
                    })
            },
            _updateSelectionToFirstItem: function($items, startIndex) {
                var itemIndex = startIndex;
                while (itemIndex >= 0) {
                    var $item = $($items[itemIndex]);
                    this._updateItemSelection(true, $item.find("." + ITEM_CLASS).get(0), true, $item);
                    itemIndex--
                }
            },
            _updateSelectionToLastItem: function($items, startIndex) {
                var itemIndex = startIndex,
                    length = $items.length;
                while (itemIndex < length) {
                    var $item = $($items[itemIndex]);
                    this._updateItemSelection(true, $item.find("." + ITEM_CLASS).get(0), true, $item);
                    itemIndex++
                }
            },
            _enlargeExpandedItemsOption: function(itemData, expandedItems) {
                if (!this._getItemFromArray(itemData, expandedItems)) {
                    expandedItems.push(itemData);
                    this._expandedSetter(itemData, true)
                }
                if (itemData.parent)
                    this._enlargeExpandedItemsOption(itemData.parent, expandedItems);
                return expandedItems
            },
            _reduceExpandedItemsOption: function(node, expandedItems) {
                var that = this,
                    nodeKey = that._keyGetter(node);
                var sourceItem = that._getSourceItemByKey(nodeKey);
                that._commonExpandedSetter(sourceItem, node, false);
                $.each(expandedItems, function(i, item) {
                    if (that._keyGetter(item) === nodeKey) {
                        expandedItems.splice(i, 1);
                        if (that._itemHasChildren(node))
                            $.each(that._itemsGetter(node), function(_, child) {
                                var sourceItemChild = that._getSourceItemByKey(that._keyGetter(child));
                                that._commonExpandedSetter(sourceItemChild, child, false);
                                that._reduceExpandedItemsOption(child, expandedItems)
                            })
                    }
                });
                return expandedItems
            },
            _focusInHandler: function(e) {
                var currentTarget = e.currentTarget,
                    focusTargets = this._focusTarget();
                if ($.inArray(currentTarget, focusTargets) !== -1)
                    $(e.currentTarget).addClass(FOCUSED_STATE_CLASS);
                if (!this.option("focusedElement")) {
                    var $activeItem = this._getActiveItem();
                    this.option("focusedElement", $activeItem.closest("." + NODE_CLASS))
                }
                else
                    this._setFocusedItem(this.option("focusedElement"))
            },
            _itemPointerDownHandler: function(e) {
                if (!this.option("focusStateEnabled"))
                    return;
                var $target = $(e.target).closest("." + NODE_CLASS);
                if ($target.hasClass(NODE_CLASS))
                    this.option("focusedElement", $target)
            },
            _moveFocus: function(location, e) {
                var FOCUS_UP = "up",
                    FOCUS_DOWN = "down",
                    FOCUS_FIRST = "first",
                    FOCUS_LAST = "last",
                    FOCUS_ENTER = "enter",
                    FOCUS_LEFT = this.option("rtlEnabled") ? "right" : "left",
                    FOCUS_RIGHT = this.option("rtlEnabled") ? "left" : "right";
                var $items = this._nodeElements().not(function(index) {
                        return $(this).find(">." + ITEM_CLASS).hasClass(DISABLED_STATE_CLASS)
                    });
                switch (location) {
                    case FOCUS_UP:
                        var $prevItem = this._prevItem($items);
                        this.option("focusedElement", $prevItem);
                        if (e.shiftKey)
                            this._updateItemSelection(true, $prevItem.find("." + ITEM_CLASS).get(0), true, $prevItem);
                        break;
                    case FOCUS_DOWN:
                        var $nextItem = this._nextItem($items);
                        this.option("focusedElement", $nextItem);
                        if (e.shiftKey)
                            this._updateItemSelection(true, $nextItem.find("." + ITEM_CLASS).get(0), true, $nextItem);
                        break;
                    case FOCUS_FIRST:
                        var $firstItem = $items.first();
                        if (e.shiftKey)
                            this._updateSelectionToFirstItem($items, $items.index(this._prevItem($items)));
                        this.option("focusedElement", $firstItem);
                        break;
                    case FOCUS_LAST:
                        var $lastItem = $items.last();
                        if (e.shiftKey)
                            this._updateSelectionToLastItem($items, $items.index(this._nextItem($items)));
                        this.option("focusedElement", $lastItem);
                        break;
                    case FOCUS_RIGHT:
                        this._expandFocusedContainer();
                        break;
                    case FOCUS_LEFT:
                        this._collapseFocusedContainer();
                        break;
                    default:
                        this.callBase.apply(this, arguments);
                        return
                }
            },
            _nodeElements: function() {
                return this.element().find("." + NODE_CLASS).not(":hidden")
            },
            _expandFocusedContainer: function() {
                if (!this.option("focusedElement"))
                    return;
                var $focusedItem = this.option("focusedElement");
                if ($focusedItem.hasClass(IS_LEAF))
                    return;
                var $node = $focusedItem.find("." + NODE_CONTAINER_CLASS).eq(0);
                if ($node.hasClass(OPENED_NODE_CONTAINER_CLASS)) {
                    this.option("focusedElement", this._nextItem(this._nodeElements()));
                    return
                }
                var $nodes = $focusedItem.find("> ." + NODE_CONTAINER_CLASS);
                this._renderNestedItems($nodes);
                $focusedItem.find("." + NODE_CONTAINER_CLASS).eq(0).toggleClass(OPENED_NODE_CONTAINER_CLASS, true);
                this._refreshActiveNode($focusedItem, true);
                var itemData = this._getItemData($focusedItem.find(">." + ITEM_CLASS));
                this._updateExpandedState(itemData, true);
                this._fireExpandedStateUpdatedEvt(true, itemData)
            },
            _collapseFocusedContainer: function() {
                if (!this.option("focusedElement"))
                    return;
                var collapsedNode,
                    toggleIcon,
                    $focusedItem = this.option("focusedElement"),
                    nodeElement = $focusedItem.find("." + NODE_CONTAINER_CLASS).eq(0);
                var itemData = this._getItemData($focusedItem.find(">." + ITEM_CLASS)),
                    key = this._getItemKey(itemData);
                if (!$focusedItem.hasClass(IS_LEAF) && nodeElement.hasClass(OPENED_NODE_CONTAINER_CLASS)) {
                    nodeElement.toggleClass(OPENED_NODE_CONTAINER_CLASS, false);
                    collapsedNode = $focusedItem;
                    this._updateExpandedState(itemData, false);
                    toggleIcon = false
                }
                else {
                    var parentElement = $focusedItem.parent("." + NODE_CONTAINER_CLASS);
                    collapsedNode = parentElement.parent("." + NODE_CLASS).eq(0);
                    toggleIcon = true;
                    if (!collapsedNode.length) {
                        collapsedNode = $focusedItem;
                        toggleIcon = false
                    }
                }
                this._refreshActiveNode(collapsedNode, toggleIcon);
                this._fireExpandedStateUpdatedEvt(false, itemData)
            },
            _refreshActiveNode: function($node, iconState) {
                this._scrollableContainer.update();
                this.option("focusedElement", $node);
                this._toggleFocusedNodeIcon(iconState)
            },
            _toggleFocusedNodeIcon: function(value) {
                if (!this.option("focusedElement"))
                    return;
                var $focusedItem = this.option("focusedElement");
                $focusedItem.find("." + TOGGLE_ITEM_VISIBILITY_CLASS).eq(0).toggleClass(TOGGLE_ITEM_VISIBILITY_OPENED_CLASS, value)
            },
            updateDimensions: function() {
                var that = this,
                    deferred = $.Deferred();
                if (that._scrollableContainer)
                    that._scrollableContainer.update().done(function() {
                        deferred.resolveWith(that)
                    });
                else
                    deferred.resolveWith(that);
                return deferred.promise()
            },
            selectItem: function(itemElement) {
                this._updateItemSelection(true, itemElement)
            },
            unselectItem: function(itemElement) {
                this._updateItemSelection(false, itemElement)
            },
            expandItem: function(itemElement) {
                var itemData = this._getItemData($(itemElement));
                this._toggleExpandedState(itemData, true)
            },
            collapseItem: function(itemElement) {
                var itemData = this._getItemData($(itemElement));
                this._toggleExpandedState(itemData, false)
            },
            getNodes: function() {
                return this._nodes
            },
            selectAll: function() {
                this._toggleSelectAll({value: true})
            },
            unselectAll: function() {
                this._toggleSelectAll({value: false})
            }
        }));
        ui.dxTreeView.__internals = {
            WIDGET_CLASS: WIDGET_CLASS,
            NODE_CONTAINER_CLASS: NODE_CONTAINER_CLASS,
            OPENED_NODE_CONTAINER_CLASS: OPENED_NODE_CONTAINER_CLASS,
            ITEM_CLASS: ITEM_CLASS,
            NODE_CLASS: NODE_CLASS,
            ITEM_WITH_CHECKBOX_CLASS: ITEM_WITH_CHECKBOX_CLASS,
            ITEM_DATA_KEY: ITEM_DATA_KEY,
            IS_LEAF: IS_LEAF,
            TOGGLE_ITEM_VISIBILITY_CLASS: TOGGLE_ITEM_VISIBILITY_CLASS,
            TOGGLE_ITEM_VISIBILITY_OPENED_CLASS: TOGGLE_ITEM_VISIBILITY_OPENED_CLASS,
            SELECT_ALL_ITEM_CLASS: SELECT_ALL_ITEM_CLASS,
            scrollableContainerUpdatedOnInitAccessor: function(value) {
                if (value)
                    scrollableContainerUpdatedOnInit = value;
                return scrollableContainerUpdatedOnInit
            }
        }
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils;
        var DATAGRID_ROW_SELECTOR = ".dx-row",
            DATAGRID_DEPRECATED_TEMPLATE_WARNING = "Specifying grid templates with the name of a jQuery selector is now deprecated. Instead, use the jQuery object that references this selector.";
        var ModuleItem = DX.Class.inherit({
                ctor: function(component) {
                    var that = this;
                    that.component = component;
                    that._actions = {};
                    that._actionConfigs = {};
                    $.each(this.callbackNames() || [], function(index, name) {
                        var flags = that.callbackFlags(name);
                        that[this] = $.Callbacks(flags)
                    })
                },
                callbackNames: function(){},
                callbackFlags: function(name){},
                publicMethods: function(){},
                init: function(){},
                option: function() {
                    return this.component.option.apply(this.component, arguments)
                },
                on: function() {
                    return this.component.on.apply(this.component, arguments)
                },
                off: function() {
                    return this.component.off.apply(this.component, arguments)
                },
                optionChanged: function(args) {
                    if (args.name in this._actions) {
                        this.createAction(args.name, this._actionConfigs[args.name]);
                        args.handled = true
                    }
                },
                _createComponent: function() {
                    return this.component._createComponent.apply(this.component, arguments)
                },
                getController: function(name) {
                    return this.component._controllers[name]
                },
                createAction: function(actionName, config) {
                    var action;
                    if (utils.isFunction(actionName)) {
                        action = this.component._createAction($.proxy(actionName, this), config);
                        return function(e) {
                                action({jQueryEvent: e})
                            }
                    }
                    else {
                        this._actions[actionName] = this.component._createActionByOption(actionName, config);
                        this._actionConfigs[actionName] = config
                    }
                },
                executeAction: function(actionName, options) {
                    var action = this._actions[actionName];
                    return action && action(options)
                },
                dispose: function() {
                    var that = this;
                    $.each(that.callbackNames() || [], function() {
                        that[this].empty()
                    })
                }
            });
        var Controller = ModuleItem;
        var ViewController = Controller.inherit({
                getView: function(name) {
                    return this.component._views[name]
                },
                getViews: function() {
                    return this.component._views
                }
            });
        var View = ModuleItem.inherit({
                element: function() {
                    return this._$element
                },
                _renderCore: function(options){},
                _resizeCore: function(){},
                _afterRender: function($root){},
                _parentElement: function() {
                    return this._$parent
                },
                ctor: function(component) {
                    this.callBase(component);
                    this.renderCompleted = $.Callbacks();
                    this.resizeCompleted = $.Callbacks()
                },
                isVisible: function() {
                    return true
                },
                getTemplate: function(name) {
                    return this.component._getTemplate(name)
                },
                render: function($parent, options) {
                    var $element = this._$element,
                        isVisible = this.isVisible();
                    if (!$element) {
                        $element = this._$element = $('<div />').appendTo($parent);
                        this._$parent = $parent
                    }
                    $element.toggle(isVisible);
                    if (isVisible) {
                        this._renderCore(options);
                        this._afterRender($parent);
                        this.renderCompleted.fire()
                    }
                },
                resize: function() {
                    this.isResizing = true;
                    this._resizeCore();
                    this.resizeCompleted.fire();
                    this.isResizing = false
                },
                focus: function() {
                    this.element().focus()
                }
            });
        var processModules = function(that, modules) {
                var controllerTypes = {},
                    viewTypes = {};
                $.each(modules, function() {
                    var controllers = this.controllers,
                        moduleName = this.name,
                        views = this.views;
                    controllers && $.each(controllers, function(name, type) {
                        if (controllerTypes[name])
                            throw DX.Error("E1001", moduleName, name);
                        else if (!(type && type.subclassOf && type.subclassOf(Controller))) {
                            type.subclassOf(Controller);
                            throw DX.Error("E1002", moduleName, name);
                        }
                        controllerTypes[name] = type
                    });
                    views && $.each(views, function(name, type) {
                        if (viewTypes[name])
                            throw DX.Error("E1003", moduleName, name);
                        else if (!(type && type.subclassOf && type.subclassOf(View)))
                            throw DX.Error("E1004", moduleName, name);
                        viewTypes[name] = type
                    })
                });
                $.each(modules, function() {
                    var extenders = this.extenders;
                    if (extenders) {
                        extenders.controllers && $.each(extenders.controllers, function(name, extender) {
                            if (controllerTypes[name])
                                controllerTypes[name] = controllerTypes[name].inherit(extender)
                        });
                        extenders.views && $.each(extenders.views, function(name, extender) {
                            if (viewTypes[name])
                                viewTypes[name] = viewTypes[name].inherit(extender)
                        })
                    }
                });
                var registerPublicMethods = function(that, name, moduleItem) {
                        var publicMethods = moduleItem.publicMethods();
                        if (publicMethods)
                            $.each(publicMethods, function(index, methodName) {
                                if (moduleItem[methodName])
                                    if (!that[methodName])
                                        that[methodName] = function() {
                                            return moduleItem[methodName].apply(moduleItem, arguments)
                                        };
                                    else
                                        throw DX.Error("E1005", methodName);
                                else
                                    throw DX.Error("E1006", name, methodName);
                            })
                    };
                var createModuleItems = function(moduleTypes) {
                        var moduleItems = {};
                        $.each(moduleTypes, function(name, moduleType) {
                            var moduleItem = new moduleType(that);
                            moduleItem.name = name;
                            registerPublicMethods(that, name, moduleItem);
                            moduleItems[name] = moduleItem
                        });
                        return moduleItems
                    };
                that._controllers = createModuleItems(controllerTypes);
                that._views = createModuleItems(viewTypes)
            };
        var callModuleItemsMethod = function(that, methodName, args) {
                args = args || [];
                if (that._controllers)
                    $.each(that._controllers, function() {
                        this[methodName] && this[methodName].apply(this, args)
                    });
                if (that._views)
                    $.each(that._views, function() {
                        this[methodName] && this[methodName].apply(this, args)
                    })
            };
        DX.registerComponent("dxDataGrid", ui, ui.Widget.inherit({
            _activeStateUnit: DATAGRID_ROW_SELECTOR,
            _setDeprecatedOptions: function() {
                this.callBase();
                $.extend(this._deprecatedOptions, {
                    rowClick: {
                        since: "14.2",
                        alias: "onRowClick"
                    },
                    cellClick: {
                        since: "14.2",
                        alias: "onCellClick"
                    },
                    cellHoverChanged: {
                        since: "14.2",
                        alias: "onCellHoverChanged"
                    },
                    cellPrepared: {
                        since: "14.2",
                        message: "The cellPrepared option is deprecated. Use the onCellPrepared option instead. For further information, see http://js.devexpress.com/Documentation/ApiReference/UI_Widgets/dxDataGrid/Configuration/?version=14_2#onCellPrepared"
                    },
                    rowPrepared: {
                        since: "14.2",
                        message: "The rowPrepared option is deprecated. Use the onRowPrepared option instead. For further information, see http://js.devexpress.com/Documentation/ApiReference/UI_Widgets/dxDataGrid/Configuration/?version=14_2#onRowPrepared"
                    },
                    selectionChanged: {
                        since: "14.2",
                        alias: "onSelectionChanged"
                    },
                    "editing.texts.recoverRow": {
                        since: "14.1",
                        alias: "editing.texts.undeleteRow"
                    },
                    dataErrorOccurred: {
                        since: "14.2",
                        alias: "onDataErrorOccurred"
                    },
                    initNewRow: {
                        since: "14.2",
                        alias: "onInitNewRow"
                    },
                    rowInserting: {
                        since: "14.2",
                        alias: "onRowInserting"
                    },
                    rowInserted: {
                        since: "14.2",
                        alias: "onRowInserted"
                    },
                    editingStart: {
                        since: "14.2",
                        alias: "onEditingStart"
                    },
                    rowUpdating: {
                        since: "14.2",
                        alias: "onRowUpdating"
                    },
                    rowUpdated: {
                        since: "14.2",
                        alias: "onRowUpdated"
                    },
                    rowRemoving: {
                        since: "14.2",
                        alias: "onRowRemoving"
                    },
                    rowRemoved: {
                        since: "14.2",
                        alias: "onRowRemoved"
                    },
                    editorPreparing: {
                        since: "14.2",
                        message: "The editorPreparing option is deprecated. Use the onEditorPreparing option instead. For further information, see http://js.devexpress.com/Documentation/ApiReference/UI_Widgets/dxDataGrid/Configuration/?version=14_2#onEditorPreparing"
                    },
                    editorPrepared: {
                        since: "14.2",
                        message: "The editorPrepared option is deprecated. Use the onEditorPrepared option instead. For further information, see http://js.devexpress.com/Documentation/ApiReference/UI_Widgets/dxDataGrid/Configuration/?version=14_2#onEditorPrepared"
                    },
                    contentReadyAction: {
                        since: "14.2",
                        alias: "onContentReady"
                    }
                })
            },
            _setDefaultOptions: function() {
                var that = this;
                that.callBase();
                $.each(ui.dxDataGrid.modules, function() {
                    if ($.isFunction(this.defaultOptions))
                        that.option(this.defaultOptions())
                })
            },
            _defaultOptionsRules: function() {
                return this.callBase().concat([{
                            device: {platform: "ios"},
                            options: {showRowLines: true}
                        }, {
                            device: function() {
                                return DevExpress.browser.webkit
                            },
                            options: {loadPanel: {animation: {show: {
                                            easing: 'cubic-bezier(1, 0, 1, 0)',
                                            duration: 500,
                                            from: {opacity: 0},
                                            to: {opacity: 1}
                                        }}}}
                        }])
            },
            _init: function() {
                var that = this;
                that.callBase();
                processModules(that, ui.dxDataGrid.modules);
                callModuleItemsMethod(that, 'init')
            },
            _clean: $.noop,
            _optionChanged: function(args) {
                var that = this;
                callModuleItemsMethod(that, 'optionChanged', [args]);
                if (!args.handled)
                    that.callBase(args)
            },
            _dimensionChanged: function() {
                this.resize()
            },
            _visibilityChanged: function() {
                this.resize()
            },
            _renderContentImpl: function() {
                var that = this;
                that.getView('gridView').render(that.element())
            },
            _renderContent: function() {
                this._renderContentImpl()
            },
            _getTemplate: function(templateName) {
                var template = templateName;
                if (DX.utils.isString(template) && template[0] === '#') {
                    template = $(templateName);
                    DX.utils.logger.warn(DATAGRID_DEPRECATED_TEMPLATE_WARNING)
                }
                return this.callBase(template)
            },
            _dispose: function() {
                var that = this;
                that.callBase();
                callModuleItemsMethod(that, 'dispose')
            },
            isReady: function() {
                return this.getController("data").isReady()
            },
            beginUpdate: function() {
                var that = this;
                that.callBase();
                callModuleItemsMethod(that, 'beginUpdate')
            },
            endUpdate: function() {
                var that = this;
                callModuleItemsMethod(that, 'endUpdate');
                that.callBase()
            },
            getController: function(name) {
                return this._controllers[name]
            },
            getView: function(name) {
                return this._views[name]
            }
        }));
        var MAX_EQUAL_KEYS_LEVEL = 3;
        $.extend(ui.dxDataGrid, {
            __internals: {},
            modules: [],
            View: View,
            ViewController: ViewController,
            Controller: Controller,
            registerModule: function(name, module) {
                var modules = this.modules,
                    i;
                for (i = 0; i < modules.length; i++)
                    if (modules[i].name === name)
                        return;
                module.name = name;
                modules.push(module)
            },
            unregisterModule: function(name) {
                this.modules = $.grep(this.modules, function(module) {
                    return module.name !== name
                })
            },
            processModules: processModules,
            formatValue: function(value, options) {
                var valueText = DX.formatHelper.format(value, options.format, options.precision) || value && value.toString() || '',
                    formatObject = {
                        value: value,
                        valueText: options.getDisplayFormat ? options.getDisplayFormat(valueText) : valueText
                    };
                return options.customizeText ? options.customizeText.call(options, formatObject) : formatObject.valueText
            },
            getSummaryText: function(summaryItem, summaryTexts) {
                var displayFormat = summaryItem.displayFormat || summaryItem.columnCaption && summaryTexts[summaryItem.summaryType + "OtherColumn"] || summaryTexts[summaryItem.summaryType];
                return this.formatValue(summaryItem.value, {
                        format: summaryItem.valueFormat,
                        precision: summaryItem.precision,
                        getDisplayFormat: function(valueText) {
                            return displayFormat ? utils.stringFormat(displayFormat, valueText, summaryItem.columnCaption) : valueText
                        },
                        customizeText: summaryItem.customizeText
                    })
            },
            equalKeys: function(key1, key2, level) {
                var propertyName,
                    i;
                level = level || 0;
                if (level < MAX_EQUAL_KEYS_LEVEL)
                    if (utils.isObject(key1) && utils.isObject(key2)) {
                        for (propertyName in key1)
                            if (key1.hasOwnProperty(propertyName) && !ui.dxDataGrid.equalKeys(key1[propertyName], key2[propertyName], level + 1))
                                return false;
                        for (propertyName in key2)
                            if (!(propertyName in key1))
                                return false;
                        return true
                    }
                    else if (utils.isArray(key1) && utils.isArray(key2)) {
                        if (key1.length !== key2.length)
                            return false;
                        for (i = 0; i < key1.length; i++)
                            if (!ui.dxDataGrid.equalKeys(key1[i], key2[i], level + 1))
                                return false;
                        return true
                    }
                    else if (utils.isDate(key1) && utils.isDate(key2))
                        return key1.getTime() === key2.getTime();
                    else
                        return key1 === key2;
                return true
            },
            getIndexByKey: function(key, items) {
                var index = -1;
                $.each(items, function(i, item) {
                    if (ui.dxDataGrid.equalKeys(key, item.key)) {
                        index = i;
                        return false
                    }
                });
                return index
            },
            normalizeSortingInfo: function(sort) {
                sort = sort || [];
                var result,
                    i;
                result = DX.data.utils.normalizeSortingInfo(sort);
                for (i = 0; i < sort.length; i++)
                    if (sort && sort[i] && sort[i].isExpanded !== undefined)
                        result[i].isExpanded = sort[i].isExpanded;
                return result
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.stateStoring.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        dataGrid.StateStoringController = dataGrid.ViewController.inherit(function() {
            var getStorage = function(options) {
                    var storage = options.type === 'sessionStorage' ? sessionStorage : localStorage;
                    if (!storage)
                        throw new Error("E1007");
                    return storage
                };
            var getUniqueStorageKey = function(options) {
                    return 'dx_datagrid_' + (utils.isDefined(options.storageKey) ? options.storageKey : 'storage')
                };
            var dateReviver = function(key, value) {
                    var date;
                    if (typeof value === 'string') {
                        date = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                        if (date)
                            return new Date(Date.UTC(+date[1], +date[2] - 1, +date[3], +date[4], +date[5], +date[6]))
                    }
                    return value
                };
            var processLoadState = function(that) {
                    var columnsController = that.getController('columns'),
                        selectionController = that.getController('selection'),
                        dataController = that.getController('data'),
                        pagerView = that.getView('pagerView');
                    if (columnsController)
                        columnsController.columnsChanged.add(function() {
                            $.extend(that._state, {columns: columnsController.getUserState()});
                            that.isEnabled() && that.save()
                        });
                    if (selectionController)
                        selectionController.selectionChanged.add(function(keys) {
                            $.extend(that._state, {selectedRowKeys: keys});
                            that.isEnabled() && that.save()
                        });
                    if (dataController)
                        dataController.changed.add(function() {
                            $.extend(that._state, {
                                searchText: that.option("searchPanel.text"),
                                pageIndex: dataController.pageIndex(),
                                pageSize: dataController.pageSize(),
                                allowedPageSizes: pagerView ? pagerView.getPageSizes() : undefined
                            });
                            that.isEnabled() && that.save()
                        })
                };
            var applyState = function(that, state) {
                    var allowedPageSizes = state.allowedPageSizes,
                        searchText = state.searchText,
                        selectedRowKeys = state.selectedRowKeys,
                        columnsController = that.getController('columns'),
                        dataController = that.getController('data');
                    that.component.beginUpdate();
                    if (columnsController)
                        columnsController.setUserState(state.columns);
                    that.option('selectedRowKeys', selectedRowKeys || []);
                    if (allowedPageSizes && that.option('pager.allowedPageSizes') === 'auto')
                        that.option('pager').allowedPageSizes = allowedPageSizes;
                    that.option('searchPanel.text', searchText || '');
                    that.option('paging', {
                        enabled: that.option('paging.enabled'),
                        pageIndex: state.pageIndex,
                        pageSize: state.pageSize || 20
                    });
                    that.component.endUpdate()
                };
            return {
                    _loadState: function() {
                        var options = this.option('stateStoring');
                        if (options.type === 'custom')
                            return options.customLoad && options.customLoad();
                        try {
                            return JSON.parse(getStorage(options).getItem(getUniqueStorageKey(options)), dateReviver)
                        }
                        catch(e) {
                            DX.utils.logger.error(e.message)
                        }
                    },
                    _saveState: function(state) {
                        var options = this.option('stateStoring');
                        if (options.type === 'custom') {
                            options.customSave && options.customSave(state);
                            return
                        }
                        try {
                            getStorage(options).setItem(getUniqueStorageKey(options), JSON.stringify(state))
                        }
                        catch(e) {}
                    },
                    publicMethods: function() {
                        return ['state']
                    },
                    isEnabled: function() {
                        return this.option('stateStoring.enabled')
                    },
                    init: function() {
                        var that = this;
                        that._state = {};
                        that._isLoaded = false;
                        that._isLoading = false;
                        that._windowUnloadHandler = function() {
                            if (that._savingTimeoutID !== undefined)
                                that._saveState(that.state())
                        },
                        $(window).on('unload', that._windowUnloadHandler);
                        processLoadState(that)
                    },
                    isLoaded: function() {
                        return this._isLoaded
                    },
                    isLoading: function() {
                        return this._isLoading
                    },
                    load: function() {
                        var that = this,
                            loadResult;
                        that._isLoading = true;
                        loadResult = that._loadState();
                        if (!loadResult || !$.isFunction(loadResult.done))
                            loadResult = $.Deferred().resolve(loadResult);
                        loadResult.done(function(state) {
                            that._isLoaded = true;
                            that._isLoading = false;
                            that.state(state)
                        });
                        return loadResult
                    },
                    state: function(state) {
                        var that = this;
                        if (!state)
                            return $.extend(true, {}, that._state);
                        else {
                            $.extend(that._state, state);
                            applyState(that, $.extend({}, that._state))
                        }
                    },
                    save: function() {
                        var that = this;
                        clearTimeout(that._savingTimeoutID);
                        that._savingTimeoutID = setTimeout(function() {
                            that._saveState(that.state());
                            that._savingTimeoutID = undefined
                        }, that.option('stateStoring.savingTimeout'))
                    },
                    optionChanged: function(args) {
                        var that = this;
                        switch (args.name) {
                            case'stateStoring':
                                if (that.isEnabled())
                                    that.load();
                                args.handled = true;
                                break;
                            default:
                                that.callBase(args)
                        }
                    },
                    dispose: function() {
                        clearTimeout(this._savingTimeoutID);
                        $(window).off('unload', this._windowUnloadHandler)
                    }
                }
        }());
        dataGrid.registerModule('stateStoring', {
            defaultOptions: function() {
                return {stateStoring: {
                            enabled: false,
                            storageKey: null,
                            type: 'localStorage',
                            customLoad: null,
                            customSave: null,
                            savingTimeout: 2000
                        }}
            },
            controllers: {stateStoring: ui.dxDataGrid.StateStoringController},
            extenders: {controllers: {
                    columns: {getVisibleColumns: function() {
                            var visibleColumns = this.callBase();
                            return this.getController('stateStoring').isLoading() ? [] : visibleColumns
                        }},
                    data: {
                        _refreshDataSource: function() {
                            var that = this,
                                callBase = that.callBase,
                                stateStoringController = that.getController('stateStoring');
                            if (stateStoringController.isEnabled() && !stateStoringController.isLoaded()) {
                                clearTimeout(that._restoreStateTimeoutID);
                                that._restoreStateTimeoutID = setTimeout(function() {
                                    stateStoringController.load().always(function() {
                                        that._restoreStateTimeoutID = null;
                                        callBase.call(that)
                                    })
                                })
                            }
                            else if (!that._restoreStateTimeoutID)
                                callBase.call(that)
                        },
                        isLoading: function() {
                            var that = this,
                                stateStoringController = that.getController('stateStoring');
                            return this.callBase() || stateStoringController.isLoading()
                        },
                        dispose: function() {
                            clearTimeout(this._restoreStateTimeoutID);
                            this.callBase()
                        }
                    }
                }}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.columnsController.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            dataGrid = ui.dxDataGrid,
            normalizeSortingInfo = dataGrid.normalizeSortingInfo,
            utils = DX.utils,
            dataUtils = DX.data.utils,
            isDefined = utils.isDefined;
        var USER_STATE_FIELD_NAMES = ['visibleIndex', 'dataField', 'dataType', 'width', 'visibleWidth', 'visible', 'sortOrder', 'sortIndex', 'groupIndex', 'filterValue', 'selectedFilterOperation'],
            DATAGRID_COMMAND_EXPAND_CLASS = 'dx-command-expand';
        dataGrid.checkChanges = function(changes, changeNames) {
            var changesWithChangeNamesCount = 0,
                i;
            for (i = 0; i < changeNames.length; i++)
                if (changes[changeNames[i]])
                    changesWithChangeNamesCount++;
            return changes.length && changes.length === changesWithChangeNamesCount
        };
        var ColumnsController = dataGrid.Controller.inherit(function() {
                var DEFAULT_COLUMN_OPTIONS = {
                        visible: true,
                        showInColumnChooser: true
                    },
                    DATATYPE_OPERATIONS = {
                        number: ['=', '<>', '<', '>', '<=', '>='],
                        string: ['contains', 'notcontains', 'startswith', 'endswith', '=', '<>'],
                        date: ['=', '<>', '<', '>', '<=', '>=']
                    },
                    GROUP_LOCATION = 'group',
                    COLUMN_CHOOSER_LOCATION = 'columnChooser';
                var convertNameToCaption = function(name) {
                        var captionList = [],
                            i,
                            char,
                            isPrevCharNewWord = false,
                            isNewWord = false;
                        for (i = 0; i < name.length; i++) {
                            char = name.charAt(i);
                            isNewWord = char === char.toUpperCase() || char in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
                            if (char === '_' || char === '.') {
                                char = ' ';
                                isNewWord = true
                            }
                            else if (i === 0) {
                                char = char.toUpperCase();
                                isNewWord = true
                            }
                            else if (!isPrevCharNewWord && isNewWord)
                                if (captionList.length > 0)
                                    captionList.push(' ');
                            captionList.push(char);
                            isPrevCharNewWord = isNewWord
                        }
                        return captionList.join('')
                    };
                var createColumn = function(that, columnOptions) {
                        var result,
                            commonColumnOptions,
                            calculatedColumnOptions;
                        if (columnOptions) {
                            if (utils.isString(columnOptions))
                                columnOptions = {dataField: columnOptions};
                            if (columnOptions.command)
                                return $.extend(true, {}, columnOptions);
                            else {
                                commonColumnOptions = that.getCommonSettings();
                                calculatedColumnOptions = that._createCalculatedColumnOptions(columnOptions);
                                return $.extend(true, {}, DEFAULT_COLUMN_OPTIONS, commonColumnOptions, calculatedColumnOptions, columnOptions)
                            }
                        }
                    };
                var createColumnsFromOptions = function(that, columnsOptions) {
                        var result = [];
                        if (columnsOptions)
                            $.each(columnsOptions, function(index, value) {
                                var column = createColumn(that, value);
                                if (column)
                                    result.push(column)
                            });
                        return result
                    };
                var getValueDataType = function(value) {
                        var dataType = $.type(value);
                        if (dataType !== 'string' && dataType !== 'boolean' && dataType !== 'number' && dataType !== 'date')
                            dataType = undefined;
                        return dataType
                    };
                var getSerializationFormat = function(dataType, value) {
                        switch (dataType) {
                            case'date':
                                if (utils.isNumber(value))
                                    return 'number';
                                else if (utils.isString(value))
                                    return 'yyyy/MM/dd';
                            case'number':
                                if (utils.isString(value))
                                    return 'string'
                        }
                    };
                var updateSerializers = function(options, dataType) {
                        if (!options.deserializeValue) {
                            if (dataType === 'date') {
                                options.deserializeValue = function(value) {
                                    var serializationFormat = this.serializationFormat,
                                        parsedValue;
                                    if (!serializationFormat || serializationFormat === 'number' || serializationFormat === 'yyyy/MM/dd') {
                                        parsedValue = serializationFormat === 'number' ? value : !utils.isDate(value) && Date.parse(value);
                                        return parsedValue ? new Date(parsedValue) : value
                                    }
                                    else if (value !== undefined)
                                        return Globalize.parseDate(value, serializationFormat)
                                };
                                options.serializeValue = function(value) {
                                    var serializationFormat = this.serializationFormat;
                                    if (serializationFormat === 'number')
                                        return value && value.valueOf && value.valueOf();
                                    else if (serializationFormat)
                                        return Globalize.format(value, serializationFormat);
                                    else
                                        return value
                                }
                            }
                            if (dataType === 'number') {
                                options.deserializeValue = function(value) {
                                    return value ? Number(value) : value
                                };
                                options.serializeValue = function(value) {
                                    return value ? value.toString() : value
                                }
                            }
                        }
                    };
                var getAlignmentByDataType = function(dataType, isRTL) {
                        switch (dataType) {
                            case'number':
                                return 'right';
                            case'boolean':
                                return 'center';
                            case'date':
                                return 'left';
                            default:
                                return isRTL ? 'right' : 'left'
                        }
                    };
                var getFormatByDataType = function(dataType) {
                        switch (dataType) {
                            case"date":
                                return "shortDate"
                        }
                    };
                var getCustomizeTextByDataType = function(dataType) {
                        if (dataType === 'boolean')
                            return function(e) {
                                    if (e.value === true)
                                        return this.trueText || 'true';
                                    else if (e.value === false)
                                        return this.falseText || 'false';
                                    else
                                        return e.valueText || ''
                                }
                    };
                var createColumnsFromDataSource = function(that, dataSource) {
                        var firstItems = getFirstItems(dataSource),
                            fieldName,
                            processedFields = {},
                            i,
                            result = [];
                        for (i = 0; i < firstItems.length; i++)
                            if (firstItems[i])
                                for (fieldName in firstItems[i])
                                    processedFields[fieldName] = true;
                        for (fieldName in processedFields)
                            if (fieldName.indexOf('__') !== 0) {
                                var column = createColumn(that, fieldName);
                                result.push(column)
                            }
                        return result
                    };
                var equalSortParameters = function(sortParameters1, sortParameters2) {
                        var i;
                        if ($.isArray(sortParameters1) && $.isArray(sortParameters2)) {
                            if (sortParameters1.length !== sortParameters2.length)
                                return false;
                            else
                                for (i = 0; i < sortParameters1.length; i++)
                                    if (sortParameters1[i].selector !== sortParameters2[i].selector || sortParameters1[i].desc !== sortParameters2[i].desc || !sortParameters1[i].isExpanded !== !sortParameters2[i].isExpanded)
                                        return false;
                            return true
                        }
                        else
                            return (!sortParameters1 || !sortParameters1.length) === (!sortParameters2 || !sortParameters2.length)
                    };
                var getFirstItems = function(dataSource) {
                        var groupsCount,
                            item,
                            items = [];
                        var getFirstItemsCore = function(items, groupsCount) {
                                var i,
                                    childItems;
                                if (!items || !groupsCount)
                                    return items;
                                for (i = 0; i < items.length; i++) {
                                    childItems = getFirstItemsCore(items[i].items || items[i].collapsedItems, groupsCount - 1);
                                    if (childItems && childItems.length)
                                        return childItems
                                }
                            };
                        if (dataSource && dataSource.items().length > 0) {
                            groupsCount = normalizeSortingInfo(dataSource.group()).length;
                            items = getFirstItemsCore(dataSource.items(), groupsCount) || []
                        }
                        return items
                    };
                var updateColumnIndexes = function(that) {
                        $.each(that._columns, function(index, column) {
                            column.index = index
                        });
                        $.each(that._commandColumns, function(index, column) {
                            column.index = -(index + 1)
                        })
                    };
                var updateColumnParameterIndexes = function(that, indexParameterName, currentColumn) {
                        var indexedColumns = {},
                            parameterIndex = 0,
                            index;
                        $.each(that._columns, function(index, column) {
                            var index = column[indexParameterName];
                            if (isDefined(index)) {
                                indexedColumns[index] = indexedColumns[index] || [];
                                if (column === currentColumn)
                                    indexedColumns[index].unshift(column);
                                else
                                    indexedColumns[index].push(column);
                                delete column[indexParameterName]
                            }
                        });
                        for (index in indexedColumns)
                            $.each(indexedColumns[index], function() {
                                if (index >= 0)
                                    this[indexParameterName] = parameterIndex++
                            });
                        return parameterIndex
                    };
                var updateColumnGroupIndexes = function(that, currentColumn) {
                        var indexPropertyName = 'groupIndex',
                            groupIndex = updateColumnParameterIndexes(that, indexPropertyName, currentColumn);
                        $.each(that._columns, function(index, column) {
                            if (!isDefined(column[indexPropertyName]) && column.grouped)
                                column[indexPropertyName] = groupIndex++;
                            delete column.grouped
                        })
                    };
                var updateColumnSortIndexes = function(that, currentColumn) {
                        $.each(that._columns, function(index, column) {
                            if (isDefined(column.sortIndex) && !isSortOrderValid(column.sortOrder))
                                delete column.sortIndex
                        });
                        var sortIndex = updateColumnParameterIndexes(that, 'sortIndex', currentColumn);
                        $.each(that._columns, function(index, column) {
                            if (!isDefined(column.sortIndex) && !isDefined(column.groupIndex) && isSortOrderValid(column.sortOrder))
                                column.sortIndex = sortIndex++
                        })
                    };
                var updateColumnVisibleIndexes = function(that, currentColumn) {
                        var indexPropertyName = 'visibleIndex',
                            visibleIndex = updateColumnParameterIndexes(that, indexPropertyName, currentColumn);
                        $.each(that._columns, function(index, column) {
                            if (!isDefined(column[indexPropertyName]))
                                column[indexPropertyName] = visibleIndex++
                        })
                    };
                var getColumnIndexByVisibleIndex = function(that, visibleIndex, location) {
                        var columns = location === GROUP_LOCATION ? that.getGroupColumns() : location === COLUMN_CHOOSER_LOCATION ? that.getChooserColumns() : that.getVisibleColumns(),
                            column = columns[visibleIndex];
                        return column && isDefined(column.index) ? column.index : -1
                    };
                var moveColumnToGroup = function(that, column, groupIndex) {
                        var groupColumns = that.getGroupColumns(),
                            i;
                        if (groupIndex >= 0) {
                            for (i = 0; i < groupColumns.length; i++)
                                if (groupColumns[i].groupIndex >= groupIndex)
                                    groupColumns[i].groupIndex++
                        }
                        else {
                            groupIndex = 0;
                            for (i = 0; i < groupColumns.length; i++)
                                groupIndex = Math.max(groupIndex, groupColumns[i].groupIndex + 1)
                        }
                        column.groupIndex = groupIndex
                    };
                var applyUserState = function(that) {
                        var columnsUserState = that._columnsUserState,
                            columns = that._columns,
                            resultColumns = [],
                            column,
                            i;
                        if (columnsUserState) {
                            if (columns.length !== columnsUserState.length)
                                return;
                            for (i = 0; i < columnsUserState.length; i++) {
                                column = isDefined(columnsUserState[i].initialIndex) ? columns[columnsUserState[i].initialIndex] : columns[i];
                                if (column && columnsUserState[i].dataField === column.dataField && columnsUserState[i].name === column.name) {
                                    column = $.extend({}, column);
                                    $.each(USER_STATE_FIELD_NAMES, function(index, fieldName) {
                                        if (fieldName === 'dataType')
                                            column[fieldName] = column[fieldName] || columnsUserState[i][fieldName];
                                        else
                                            column[fieldName] = columnsUserState[i][fieldName]
                                    });
                                    resultColumns.push(column)
                                }
                                else
                                    return
                            }
                            assignColumns(that, resultColumns)
                        }
                    };
                var updateIndexes = function(that, column) {
                        updateColumnIndexes(that);
                        updateColumnGroupIndexes(that, column);
                        updateColumnSortIndexes(that, column);
                        updateColumnVisibleIndexes(that, column)
                    };
                var isLocalDataSource = function(dataSource) {
                        return dataSource && dataSource.store && dataSource.store() instanceof DX.data.ArrayStore
                    };
                var assignColumns = function(that, columns) {
                        that._columns = columns;
                        that._visibleColumns = undefined;
                        that.updateColumnDataTypes()
                    };
                var updateColumnChanges = function(that, changeType, optionName, columnIndex) {
                        var columnChanges = that._columnChanges || {
                                optionNames: {length: 0},
                                changeTypes: {length: 0},
                                columnIndex: columnIndex
                            };
                        optionName = optionName || 'all';
                        var changeTypes = columnChanges.changeTypes;
                        if (changeType && !changeTypes[changeType]) {
                            changeTypes[changeType] = true;
                            changeTypes.length++
                        }
                        var optionNames = columnChanges.optionNames;
                        if (optionName && !optionNames[optionName]) {
                            optionNames[optionName] = true;
                            optionNames.length++
                        }
                        if (columnIndex === undefined || columnIndex !== columnChanges.columnIndex)
                            delete columnChanges.columnIndex;
                        that._columnChanges = columnChanges;
                        that._visibleColumns = undefined
                    };
                var fireColumnsChanged = function(that) {
                        var onColumnsChanging = that.option("onColumnsChanging"),
                            columnChanges = that._columnChanges;
                        if (that.isInitialized() && !that._updateLockCount && columnChanges) {
                            if (onColumnsChanging) {
                                that._updateLockCount++;
                                onColumnsChanging($.extend({component: that.component}, columnChanges));
                                that._updateLockCount--
                            }
                            that._columnChanges = undefined;
                            that.columnsChanged.fire(columnChanges)
                        }
                    };
                var columnOptionCore = function(that, column, optionName, value, notFireEvent) {
                        var optionGetter = dataUtils.compileGetter(optionName),
                            changeType;
                        if (arguments.length === 3)
                            return optionGetter(column, {functionsAsIs: true});
                        if (optionGetter(column, {functionsAsIs: true}) !== value) {
                            if (optionName === 'groupIndex')
                                changeType = 'grouping';
                            else if (optionName === 'sortIndex' || optionName === 'sortOrder')
                                changeType = 'sorting';
                            else
                                changeType = 'columns';
                            dataUtils.compileSetter(optionName)(column, value, {functionsAsIs: true});
                            if (!notFireEvent)
                                updateColumnChanges(that, changeType, optionName, column.index)
                        }
                    };
                var isSortOrderValid = function(sortOrder) {
                        return sortOrder === 'asc' || sortOrder === 'desc'
                    };
                var addExpandColumn = function(that) {
                        that.addCommandColumn({
                            command: 'expand',
                            width: 'auto',
                            cssClass: DATAGRID_COMMAND_EXPAND_CLASS,
                            allowEditing: false,
                            allowGrouping: false,
                            allowSorting: false,
                            allowResizing: false,
                            allowReordering: false,
                            allowHiding: false
                        })
                    };
                return {
                        init: function() {
                            var that = this,
                                columns = that.option('columns');
                            that._updateLockCount = that._updateLockCount || 0;
                            that._commandColumns = that._commandColumns || [];
                            addExpandColumn(that);
                            assignColumns(that, columns ? createColumnsFromOptions(that, columns) : []);
                            that._isColumnsFromOptions = !!columns;
                            if (that._isColumnsFromOptions)
                                applyUserState(that);
                            else
                                assignColumns(that, that._columnsUserState ? createColumnsFromOptions(that, that._columnsUserState) : that._columns);
                            if (that._dataSourceApplied)
                                that.applyDataSource(that._dataSource, true);
                            else
                                updateIndexes(that)
                        },
                        callbackNames: function() {
                            return ['columnsChanged']
                        },
                        optionChanged: function(args) {
                            switch (args.name) {
                                case'columns':
                                    this._columnsUserState = null;
                                    this.init();
                                    args.handled = true;
                                    break;
                                case'commonColumnSettings':
                                case'columnAutoWidth':
                                case'allowColumnResizing':
                                case'allowColumnReordering':
                                case'grouping':
                                case'groupPanel':
                                case'regenerateColumnsByVisibleItems':
                                case'customizeColumns':
                                case'editing':
                                    args.handled = true;
                                case'rtlEnabled':
                                    this._columnsUserState = this.getUserState();
                                    this.init();
                                    break;
                                default:
                                    this.callBase(args)
                            }
                        },
                        publicMethods: function() {
                            return ['addColumn', 'columnOption', 'columnCount', 'clearSorting', 'clearGrouping']
                        },
                        applyDataSource: function(dataSource, forceApplying) {
                            var that = this,
                                isDataSourceLoaded = dataSource && dataSource.isLoaded();
                            that._dataSource = dataSource;
                            if (!that._dataSourceApplied || that._dataSourceColumnsCount === 0 || forceApplying || that.option('regenerateColumnsByVisibleItems'))
                                if (isDataSourceLoaded) {
                                    if (!that._isColumnsFromOptions) {
                                        assignColumns(that, createColumnsFromDataSource(that, dataSource));
                                        that._dataSourceColumnsCount = that._columns.length;
                                        applyUserState(that)
                                    }
                                    return that.updateColumns(dataSource)
                                }
                        },
                        reset: function() {
                            this._dataSourceApplied = false;
                            this._dataSourceColumnsCount = undefined;
                            this._columnsUserState = this.getUserState();
                            this.init()
                        },
                        isInitialized: function() {
                            return !!this._columns.length
                        },
                        isDataSourceApplied: function() {
                            return this._dataSourceApplied
                        },
                        beginUpdate: function() {
                            this._updateLockCount++
                        },
                        endUpdate: function() {
                            var that = this,
                                lastChange = {},
                                change;
                            that._updateLockCount--;
                            if (!that._updateLockCount)
                                fireColumnsChanged(that)
                        },
                        getCommonSettings: function() {
                            var commonColumnSettings = this.option('commonColumnSettings') || {},
                                groupingOptions = this.option('grouping') || {},
                                groupPanelOptions = this.option('groupPanel') || {};
                            return $.extend({
                                    allowResizing: this.option('allowColumnResizing'),
                                    allowReordering: this.option('allowColumnReordering'),
                                    autoExpandGroup: groupingOptions.autoExpandAll,
                                    allowCollapsing: groupingOptions.allowCollapsing,
                                    allowGrouping: groupPanelOptions.allowColumnDragging && groupPanelOptions.visible
                                }, commonColumnSettings)
                        },
                        isColumnOptionUsed: function(optionName) {
                            for (var i = 0; i < this._columns.length; i++)
                                if (this._columns[i][optionName])
                                    return true
                        },
                        isAllDataTypesDefined: function() {
                            var columns = this._columns,
                                i;
                            if (!columns.length)
                                return false;
                            for (i = 0; i < columns.length; i++)
                                if (!columns[i].dataType)
                                    return false;
                            return true
                        },
                        getColumns: function() {
                            return $.extend(true, [], this._columns)
                        },
                        getGroupColumns: function() {
                            var result = [];
                            $.each(this._columns, function() {
                                var column = this;
                                if (isDefined(column.groupIndex))
                                    result[column.groupIndex] = column
                            });
                            return result
                        },
                        getVisibleColumns: function() {
                            var that = this;
                            that._visibleColumns = that._visibleColumns || that._getVisibleColumnsCore();
                            return that._visibleColumns
                        },
                        _getExpandColumnsCore: function() {
                            return this.getGroupColumns()
                        },
                        getExpandColumns: function() {
                            var expandColumns = this._getExpandColumnsCore(),
                                expandColumn;
                            if (expandColumns.length)
                                expandColumn = this.columnOption("command:expand");
                            expandColumns = $.map(expandColumns, function(column) {
                                return $.extend({}, column, {visibleWidth: "auto"}, expandColumn, {index: column.index})
                            });
                            return expandColumns
                        },
                        _getVisibleColumnsCore: function() {
                            var visibleColumns = this.getExpandColumns(),
                                positiveIndexedColumns = {},
                                negativeIndexedColumns = {},
                                notGroupedColumnsCount = 0,
                                columns = this._columns.length ? this._commandColumns.concat(this._columns) : [],
                                visibleIndex;
                            $.each(columns, function() {
                                var column = this,
                                    visibleIndex = column.visibleIndex,
                                    indexedColumns;
                                if (column.visible && (!isDefined(column.groupIndex) || column.showWhenGrouped)) {
                                    column = $.extend(true, {}, column);
                                    if (visibleIndex < 0) {
                                        visibleIndex = -visibleIndex;
                                        indexedColumns = negativeIndexedColumns
                                    }
                                    else
                                        indexedColumns = positiveIndexedColumns;
                                    indexedColumns[visibleIndex] = indexedColumns[visibleIndex] || [];
                                    indexedColumns[visibleIndex].push(column);
                                    notGroupedColumnsCount++
                                }
                            });
                            for (visibleIndex in negativeIndexedColumns)
                                visibleColumns.unshift.apply(visibleColumns, negativeIndexedColumns[visibleIndex]);
                            for (visibleIndex in positiveIndexedColumns)
                                visibleColumns.push.apply(visibleColumns, positiveIndexedColumns[visibleIndex]);
                            if (!notGroupedColumnsCount && this._columns.length)
                                visibleColumns.push({command: 'empty'});
                            return visibleColumns
                        },
                        getHiddenColumns: function() {
                            var result = [];
                            $.each(this._columns, function(_, column) {
                                if (!column.visible)
                                    result.push(column)
                            });
                            return result
                        },
                        getChooserColumns: function() {
                            return $.grep(this.getHiddenColumns(), function(column) {
                                    return column.showInColumnChooser
                                })
                        },
                        allowMoveColumn: function(fromVisibleIndex, toVisibleIndex, sourceLocation, targetLocation) {
                            var that = this,
                                columnIndex = getColumnIndexByVisibleIndex(that, fromVisibleIndex, sourceLocation),
                                sourceColumn = that._columns[columnIndex];
                            if (sourceColumn && (sourceColumn.allowReordering || sourceColumn.allowGrouping || sourceColumn.allowHiding)) {
                                if (sourceLocation === targetLocation) {
                                    if (sourceLocation === COLUMN_CHOOSER_LOCATION)
                                        return false;
                                    return fromVisibleIndex !== toVisibleIndex && fromVisibleIndex + 1 !== toVisibleIndex
                                }
                                else if (sourceLocation === GROUP_LOCATION && targetLocation !== COLUMN_CHOOSER_LOCATION || targetLocation === GROUP_LOCATION)
                                    return sourceColumn && sourceColumn.allowGrouping;
                                else if (sourceLocation === COLUMN_CHOOSER_LOCATION || targetLocation === COLUMN_CHOOSER_LOCATION)
                                    return sourceColumn && sourceColumn.allowHiding;
                                return true
                            }
                            return false
                        },
                        moveColumn: function(fromVisibleIndex, toVisibleIndex, sourceLocation, targetLocation) {
                            var that = this,
                                fromIndex,
                                toIndex,
                                targetGroupIndex,
                                isGroupMoving = sourceLocation === GROUP_LOCATION || targetLocation === GROUP_LOCATION,
                                column;
                            fromIndex = getColumnIndexByVisibleIndex(that, fromVisibleIndex, sourceLocation);
                            toIndex = getColumnIndexByVisibleIndex(that, toVisibleIndex, targetLocation);
                            if (fromIndex >= 0) {
                                column = that._columns[fromIndex];
                                targetGroupIndex = toIndex >= 0 ? that._columns[toIndex].groupIndex : -1;
                                if (isDefined(column.groupIndex) && sourceLocation === GROUP_LOCATION) {
                                    if (targetGroupIndex > column.groupIndex)
                                        targetGroupIndex--;
                                    delete column.groupIndex;
                                    delete column.sortOrder;
                                    updateColumnGroupIndexes(that)
                                }
                                if (targetLocation === GROUP_LOCATION) {
                                    moveColumnToGroup(that, column, targetGroupIndex);
                                    updateColumnGroupIndexes(that)
                                }
                                else if (toVisibleIndex >= 0) {
                                    if (toIndex < 0)
                                        column.visibleIndex = undefined;
                                    else
                                        column.visibleIndex = that._columns[toIndex].visibleIndex;
                                    updateColumnVisibleIndexes(that, column)
                                }
                                column.visible = targetLocation !== COLUMN_CHOOSER_LOCATION;
                                updateColumnChanges(that, isGroupMoving ? 'grouping' : 'columns');
                                fireColumnsChanged(that)
                            }
                        },
                        changeSortOrder: function(columnIndex, sortOrder) {
                            var that = this,
                                commonColumnSettings = that.getCommonSettings(),
                                sortingOptions = that.option('sorting'),
                                sortingMode = sortingOptions && sortingOptions.mode,
                                needResetSorting = sortingMode === 'single' || !sortOrder,
                                allowSorting = sortingMode === 'single' || sortingMode === 'multiple',
                                column = that._columns[columnIndex],
                                nextSortOrder = function(column) {
                                    if (sortOrder === "ctrl") {
                                        if (!("sortOrder" in column && "sortIndex" in column))
                                            return false;
                                        delete column.sortOrder;
                                        delete column.sortIndex
                                    }
                                    else if (isDefined(column.groupIndex) || isDefined(column.sortIndex))
                                        column.sortOrder = column.sortOrder === 'desc' ? 'asc' : 'desc';
                                    else
                                        column.sortOrder = 'asc';
                                    return true
                                },
                                isSortingChanged = false;
                            if (allowSorting && column && column.allowSorting) {
                                if (needResetSorting && !isDefined(column.groupIndex))
                                    $.each(that._columns, function(index) {
                                        if (index !== columnIndex && this.sortOrder && !isDefined(this.groupIndex)) {
                                            delete this.sortOrder;
                                            delete this.sortIndex;
                                            isSortingChanged = true
                                        }
                                    });
                                if (isSortOrderValid(sortOrder)) {
                                    if (column.sortOrder !== sortOrder) {
                                        column.sortOrder = sortOrder;
                                        isSortingChanged = true
                                    }
                                }
                                else if (sortOrder === 'none') {
                                    if (column.sortOrder) {
                                        delete column.sortIndex;
                                        delete column.sortOrder;
                                        isSortingChanged = true
                                    }
                                }
                                else
                                    isSortingChanged = nextSortOrder(column)
                            }
                            if (isSortingChanged) {
                                updateColumnSortIndexes(that);
                                updateColumnChanges(that, 'sorting');
                                fireColumnsChanged(that)
                            }
                        },
                        getSortDataSourceParameters: function() {
                            var that = this,
                                sortColumns = [],
                                sort = [];
                            $.each(that._columns, function() {
                                if ((this.dataField || this.selector || this.calculateCellValue) && isDefined(this.sortIndex) && !isDefined(this.groupIndex))
                                    sortColumns[this.sortIndex] = this
                            });
                            $.each(sortColumns, function() {
                                var sortOrder = this && this.sortOrder;
                                if (isSortOrderValid(sortOrder))
                                    sort.push({
                                        selector: this.selector || this.dataField || this.calculateCellValue,
                                        desc: this.sortOrder === 'desc'
                                    })
                            });
                            return sort.length > 0 ? sort : null
                        },
                        getGroupDataSourceParameters: function() {
                            var group = [];
                            $.each(this.getGroupColumns(), function() {
                                var selector = this.calculateGroupValue || this.selector || this.dataField || this.calculateCellValue;
                                if (selector)
                                    group.push({
                                        selector: selector,
                                        desc: this.sortOrder === 'desc',
                                        isExpanded: !!this.autoExpandGroup
                                    })
                            });
                            return group.length > 0 ? group : null
                        },
                        refresh: function(updateNewLookupsOnly) {
                            var deferreds = [];
                            $.each(this._columns, function() {
                                var lookup = this.lookup;
                                if (lookup) {
                                    if (updateNewLookupsOnly && lookup.valueMap)
                                        return;
                                    if (lookup.update)
                                        deferreds.push(lookup.update())
                                }
                            });
                            return $.when.apply($, deferreds)
                        },
                        updateColumnDataTypes: function(dataSource) {
                            var firstItems = getFirstItems(dataSource),
                                isLocalData = isLocalDataSource(dataSource),
                                rtlEnabled = this.option("rtlEnabled");
                            $.each(this._columns, function(index, column) {
                                var i,
                                    value,
                                    dataType,
                                    lookupDataType,
                                    valueDataType,
                                    getter,
                                    lookup = column.lookup;
                                if (column.calculateCellValue && firstItems.length) {
                                    if (!column.dataType || lookup && !lookup.dataType) {
                                        for (i = 0; i < firstItems.length; i++) {
                                            value = column.calculateCellValue(firstItems[i]);
                                            valueDataType = column.dataType || getValueDataType(value);
                                            dataType = dataType || valueDataType;
                                            if (dataType && valueDataType && dataType !== valueDataType)
                                                dataType = "string";
                                            if (lookup) {
                                                valueDataType = lookup.dataType || getValueDataType(lookup.calculateCellValue(value));
                                                lookupDataType = lookupDataType || valueDataType;
                                                if (lookupDataType && valueDataType && lookupDataType !== valueDataType)
                                                    lookupDataType = "string"
                                            }
                                        }
                                        column.dataType = dataType;
                                        if (lookup)
                                            lookup.dataType = lookupDataType
                                    }
                                    if (!column.serializationFormat || lookup && !lookup.serializationFormat)
                                        for (i = 0; i < firstItems.length; i++) {
                                            value = column.calculateCellValue(firstItems[i], true);
                                            column.serializationFormat = column.serializationFormat || getSerializationFormat(column.dataType, value);
                                            if (lookup)
                                                lookup.serializationFormat = lookup.serializationFormat || getSerializationFormat(lookup.dataType, lookup.calculateCellValue(value, true))
                                        }
                                }
                                if (isLocalData && column.userDataType || !column.dataField)
                                    column.selector = column.selector || $.proxy(column, 'calculateCellValue');
                                updateSerializers(column, column.dataType);
                                if (lookup)
                                    updateSerializers(lookup, lookup.dataType);
                                dataType = lookup ? lookup.dataType : column.dataType;
                                if (dataType) {
                                    column.alignment = column.alignment || getAlignmentByDataType(dataType, rtlEnabled);
                                    column.format = column.format || getFormatByDataType(dataType);
                                    column.customizeText = column.customizeText || getCustomizeTextByDataType(dataType);
                                    if (!isDefined(column.filterOperations))
                                        column.filterOperations = !lookup && DATATYPE_OPERATIONS[dataType] || [];
                                    column.defaultFilterOperation = column.filterOperations && column.filterOperations[0] || '=';
                                    column.defaultSelectedFilterOperation = column.selectedFilterOperation;
                                    column.showEditorAlways = isDefined(column.showEditorAlways) ? column.showEditorAlways : dataType === 'boolean'
                                }
                            })
                        },
                        _customizeColumns: function(columns) {
                            var that = this,
                                customizeColumns = that.option('customizeColumns');
                            if (customizeColumns) {
                                customizeColumns(columns);
                                assignColumns(that, createColumnsFromOptions(that, columns))
                            }
                        },
                        updateColumns: function(dataSource) {
                            var that = this,
                                sortParameters,
                                groupParameters;
                            that.updateSortingGrouping(dataSource);
                            if (!dataSource || dataSource.isLoaded()) {
                                sortParameters = dataSource ? dataSource.sort() || [] : that.getSortDataSourceParameters();
                                groupParameters = dataSource ? dataSource.group() || [] : that.getGroupDataSourceParameters();
                                that._customizeColumns(that._columns);
                                updateIndexes(that);
                                return $.when(that.refresh(true)).always(function() {
                                        if (dataSource) {
                                            that.updateColumnDataTypes(dataSource);
                                            that._dataSourceApplied = true
                                        }
                                        if (!equalSortParameters(sortParameters, that.getSortDataSourceParameters()))
                                            updateColumnChanges(that, 'sorting');
                                        if (!equalSortParameters(groupParameters, that.getGroupDataSourceParameters()))
                                            updateColumnChanges(that, 'grouping');
                                        updateColumnChanges(that, 'columns');
                                        fireColumnsChanged(that)
                                    })
                            }
                        },
                        updateSortingGrouping: function(dataSource, fromDataSource) {
                            var that = this,
                                sortParameters,
                                groupParameters,
                                columnsGroupParameters,
                                columnsSortParameters,
                                isColumnsChanged,
                                updateSortGroupParameterIndexes = function(columns, sortParameters, indexParameterName) {
                                    var i,
                                        selector,
                                        isExpanded;
                                    $.each(columns, function(index, column) {
                                        delete column[indexParameterName];
                                        if (sortParameters)
                                            for (i = 0; i < sortParameters.length; i++) {
                                                selector = sortParameters[i].selector;
                                                isExpanded = sortParameters[i].isExpanded;
                                                if (selector === column.dataField || selector === column.name || selector === column.selector || selector === column.calculateCellValue || selector === column.calculateGroupValue) {
                                                    column.sortOrder = column.sortOrder || (sortParameters[i].desc ? 'desc' : 'asc');
                                                    if (isExpanded !== undefined)
                                                        column.autoExpandGroup = isExpanded;
                                                    column[indexParameterName] = i;
                                                    break
                                                }
                                            }
                                    })
                                };
                            if (dataSource) {
                                sortParameters = normalizeSortingInfo(dataSource.sort());
                                groupParameters = normalizeSortingInfo(dataSource.group());
                                columnsGroupParameters = that.getGroupDataSourceParameters();
                                columnsSortParameters = that.getSortDataSourceParameters();
                                if (!that._columns.length) {
                                    $.each(groupParameters, function(index, group) {
                                        that._columns.push(group.selector)
                                    });
                                    $.each(sortParameters, function(index, sort) {
                                        that._columns.push(sort.selector)
                                    });
                                    assignColumns(that, createColumnsFromOptions(that, that._columns))
                                }
                                if ((fromDataSource || !columnsGroupParameters) && !equalSortParameters(groupParameters, columnsGroupParameters)) {
                                    that.__groupingUpdated = true;
                                    updateSortGroupParameterIndexes(that._columns, groupParameters, 'groupIndex');
                                    if (fromDataSource) {
                                        updateColumnChanges(that, 'grouping');
                                        isColumnsChanged = true
                                    }
                                }
                                if ((fromDataSource || !columnsSortParameters) && !equalSortParameters(sortParameters, columnsSortParameters)) {
                                    that.__sortingUpdated = true;
                                    updateSortGroupParameterIndexes(that._columns, sortParameters, 'sortIndex');
                                    if (fromDataSource) {
                                        updateColumnChanges(that, 'sorting');
                                        isColumnsChanged = true
                                    }
                                }
                                if (isColumnsChanged)
                                    fireColumnsChanged(that)
                            }
                        },
                        updateFilter: function(dataSource, filter) {
                            var that = this,
                                isLocalData = isLocalDataSource(dataSource);
                            var updateFilterCore = function(filter) {
                                    if (!utils.isArray(filter))
                                        return;
                                    var calculateCellValue,
                                        column,
                                        i;
                                    if (utils.isString(filter[0])) {
                                        column = that.columnOption(filter[0]);
                                        if (column && column.calculateCellValue)
                                            filter[0] = $.proxy(column, 'calculateCellValue')
                                    }
                                    for (i = 0; i < filter.length; i++)
                                        updateFilterCore(filter[i])
                                };
                            if (isLocalData)
                                updateFilterCore(filter)
                        },
                        columnCount: function() {
                            return this._columns.length
                        },
                        columnOption: function(identificator, option, value, notFireEvent) {
                            var that = this,
                                i,
                                identificatorOptionName = utils.isString(identificator) && identificator.substr(0, identificator.indexOf(":")),
                                columns = identificator < 0 || identificatorOptionName === "command" ? that._commandColumns : that._columns,
                                column;
                            if (identificator === undefined)
                                return;
                            if (identificatorOptionName)
                                identificator = identificator.substr(identificatorOptionName.length + 1);
                            for (i = 0; i < columns.length; i++)
                                if (identificatorOptionName) {
                                    if ("" + columns[i][identificatorOptionName] === identificator) {
                                        column = columns[i];
                                        break
                                    }
                                }
                                else if (columns[i].index === identificator || columns[i].name === identificator || columns[i].dataField === identificator || columns[i].caption === identificator) {
                                    column = columns[i];
                                    break
                                }
                            if (column) {
                                if (arguments.length === 1)
                                    return $.extend({}, column);
                                if (utils.isString(option))
                                    if (arguments.length === 2)
                                        return columnOptionCore(that, column, option);
                                    else
                                        columnOptionCore(that, column, option, value, notFireEvent);
                                else if (utils.isObject(option))
                                    $.each(option, function(optionName, value) {
                                        columnOptionCore(that, column, optionName, value, notFireEvent)
                                    });
                                updateIndexes(that, column);
                                fireColumnsChanged(that)
                            }
                        },
                        clearSorting: function() {
                            var that = this,
                                columnCount = this.columnCount(),
                                i;
                            that.beginUpdate();
                            for (i = 0; i < columnCount; i++)
                                that.columnOption(i, "sortOrder", undefined);
                            that.endUpdate()
                        },
                        clearGrouping: function() {
                            var that = this,
                                columnCount = this.columnCount(),
                                i;
                            that.beginUpdate();
                            for (i = 0; i < columnCount; i++)
                                that.columnOption(i, "groupIndex", undefined);
                            that.endUpdate()
                        },
                        getVisibleIndex: function(index) {
                            var i,
                                visibleColumns = this.getVisibleColumns();
                            for (i = 0; i < visibleColumns.length; i++)
                                if (visibleColumns[i].index === index)
                                    return i;
                            return -1
                        },
                        addColumn: function(options) {
                            var that = this,
                                column = createColumn(that, options);
                            that._columns.push(column);
                            updateIndexes(that, column);
                            that.updateColumns(that._dataSource)
                        },
                        addCommandColumn: function(options) {
                            var commandColumns = this._commandColumns,
                                i;
                            for (i = 0; i < commandColumns.length; i++)
                                if (commandColumns[i].command === options.command)
                                    return;
                            commandColumns.push(options)
                        },
                        getUserState: function() {
                            var columns = this._columns,
                                result = [],
                                i;
                            for (i = 0; i < columns.length; i++) {
                                result[i] = {};
                                $.each(USER_STATE_FIELD_NAMES, function(index, value) {
                                    if (columns[i][value] !== undefined)
                                        result[i][value] = columns[i][value]
                                })
                            }
                            return result
                        },
                        setUserState: function(state) {
                            this._columnsUserState = state;
                            this.init()
                        },
                        _createCalculatedColumnOptions: function(columnOptions) {
                            var calculatedColumnOptions = {},
                                getter,
                                setter;
                            if (columnOptions.dataField && utils.isString(columnOptions.dataField)) {
                                getter = dataUtils.compileGetter(columnOptions.dataField);
                                calculatedColumnOptions = {
                                    caption: convertNameToCaption(columnOptions.dataField),
                                    calculateCellValue: function(data, skipDeserialization) {
                                        var value = getter(data);
                                        return this.deserializeValue && !skipDeserialization ? this.deserializeValue(value) : value
                                    },
                                    setCellValue: function(data, value) {
                                        var path = this.dataField.split("."),
                                            dotCount = path.length - 1,
                                            name,
                                            i;
                                        if (this.serializeValue)
                                            value = this.serializeValue(value);
                                        for (i = 0; i < dotCount; i++) {
                                            name = path[i];
                                            data = data[name] = data[name] || {}
                                        }
                                        data[path[dotCount]] = value
                                    },
                                    parseValue: function(text) {
                                        var column = this,
                                            result,
                                            parsedValue;
                                        if (column.dataType === 'number') {
                                            if (utils.isString(text)) {
                                                parsedValue = Globalize.parseFloat(text);
                                                if (utils.isNumber(parsedValue))
                                                    result = parsedValue
                                            }
                                            else if (utils.isDefined(text))
                                                result = Number(text)
                                        }
                                        else if (column.dataType === 'boolean') {
                                            if (text === column.trueText)
                                                result = true;
                                            else if (text === column.falseText)
                                                result = false
                                        }
                                        else if (column.dataType === 'date') {
                                            parsedValue = Globalize.parseDate(text);
                                            if (parsedValue)
                                                result = parsedValue
                                        }
                                        else
                                            result = text;
                                        return result
                                    }
                                }
                            }
                            else
                                $.extend(true, calculatedColumnOptions, {
                                    allowSorting: false,
                                    allowGrouping: false,
                                    calculateCellValue: function() {
                                        return null
                                    }
                                });
                            if (columnOptions.dataType)
                                calculatedColumnOptions.userDataType = columnOptions.dataType;
                            if (columnOptions.lookup)
                                calculatedColumnOptions.lookup = {
                                    calculateCellValue: function(value, skipDeserialization) {
                                        var value = this.valueMap && this.valueMap[value];
                                        return this.deserializeValue && !skipDeserialization ? this.deserializeValue(value) : value
                                    },
                                    updateValueMap: function() {
                                        var calculateValue,
                                            calculateDisplayValue,
                                            item,
                                            i;
                                        this.valueMap = {};
                                        if (this.items) {
                                            calculateValue = dataUtils.compileGetter(this.valueExpr);
                                            calculateDisplayValue = dataUtils.compileGetter(this.displayExpr);
                                            for (i = 0; i < this.items.length; i++) {
                                                item = this.items[i];
                                                this.valueMap[calculateValue(item)] = calculateDisplayValue(item)
                                            }
                                        }
                                    },
                                    update: function() {
                                        var that = this,
                                            dataSource = that.dataSource;
                                        if (dataSource)
                                            if (utils.isObject(dataSource) || utils.isArray(dataSource)) {
                                                dataSource = new DX.data.DataSource($.extend(true, {
                                                    paginate: false,
                                                    _preferSync: true
                                                }, dataUtils.normalizeDataSourceOptions(dataSource)));
                                                return dataSource.load().done(function(data) {
                                                        that.items = data;
                                                        that.updateValueMap && that.updateValueMap()
                                                    })
                                            }
                                            else
                                                DX.log("E1016");
                                        else
                                            that.updateValueMap && that.updateValueMap()
                                    }
                                };
                            calculatedColumnOptions.resizedCallbacks = $.Callbacks();
                            if (columnOptions.resized)
                                calculatedColumnOptions.resizedCallbacks.add($.proxy(columnOptions.resized, columnOptions));
                            updateSerializers(calculatedColumnOptions, columnOptions.dataType);
                            return calculatedColumnOptions
                        }
                    }
            }());
        ui.dxDataGrid.ColumnsController = ColumnsController;
        dataGrid.registerModule('columns', {
            defaultOptions: function() {
                return {
                        commonColumnSettings: {
                            allowFiltering: true,
                            allowHiding: true,
                            allowSorting: true,
                            allowEditing: true,
                            encodeHtml: true,
                            trueText: Globalize.localize("dxDataGrid-trueText"),
                            falseText: Globalize.localize("dxDataGrid-falseText")
                        },
                        allowColumnReordering: false,
                        allowColumnResizing: false,
                        columns: undefined,
                        regenerateColumnsByVisibleItems: false,
                        sorting: {
                            mode: 'single',
                            ascendingText: Globalize.localize("dxDataGrid-sortingAscendingText"),
                            descendingText: Globalize.localize("dxDataGrid-sortingDescendingText"),
                            clearText: Globalize.localize("dxDataGrid-sortingClearText")
                        },
                        customizeColumns: null
                    }
            },
            controllers: {columns: ColumnsController}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.selection.js */
    (function($, DX) {
        var dataGrid = DX.ui.dxDataGrid,
            events = DX.ui.events,
            utils = DX.utils;
        var DATAGRID_EDITOR_CELL_CLASS = "dx-editor-cell",
            DATAGRID_ROW_CLASS = "dx-row",
            DATAGRID_ROW_SELECTION_CLASS = "dx-selection",
            DATAGRID_ROW_INSERTED = "dx-row-inserted",
            DATAGRID_SELECT_CHECKBOX_CLASS = "dx-select-checkbox",
            DATAGRID_CHECKBOXES_HIDDEN_CLASS = "dx-select-checkboxes-hidden",
            DATAGRID_COMMAND_SELECT_CLASS = "dx-command-select",
            DATAGRID_SELECTION_DISABLED_CLASS = "dx-selection-disabled",
            DATAGRID_DATA_ROW_CLASS = "dx-data-row";
        $.extend(dataGrid.__internals, {
            DATAGRID_ROW_SELECTION_CLASS: DATAGRID_ROW_SELECTION_CLASS,
            DATAGRID_SELECTION_DISABLED_CLASS: DATAGRID_SELECTION_DISABLED_CLASS,
            DATAGRID_COMMAND_SELECT_CLASS: DATAGRID_COMMAND_SELECT_CLASS
        });
        var SHOW_CHECKBOXES_MODE = 'selection.showCheckBoxesInMultipleMode';
        var SELECTION_MODE = 'selection.mode';
        var isSelectable = function(selectionMode) {
                return selectionMode === 'single' || selectionMode === 'multiple'
            };
        dataGrid.SelectionController = dataGrid.Controller.inherit(function() {
            var indexOfSelectedItemKey = function(that, key, isSelectAll) {
                    var index,
                        selectedItemKeys = isSelectAll ? that._unselectedItemKeys : that._selectedItemKeys;
                    if (utils.isObject(key)) {
                        for (index = 0; index < selectedItemKeys.length; index++)
                            if (equalKeys(selectedItemKeys[index], key))
                                return index;
                        return -1
                    }
                    else
                        return $.inArray(key, selectedItemKeys)
                };
            var getKeyIndex = function(key, keys) {
                    var index = -1;
                    $.each(keys, function(i, rowKey) {
                        if (dataGrid.equalKeys(key, rowKey)) {
                            index = i;
                            return false
                        }
                    });
                    return index
                };
            var addSelectedItem = function(that, itemData) {
                    var key = that.getController('data').keyOf(itemData),
                        keyIndex;
                    if (indexOfSelectedItemKey(that, key) === -1) {
                        that._selectedItemKeys.push(key);
                        that._addedItemKeys.push(key);
                        that._selectedItems.push(itemData)
                    }
                };
            var removeSelectedItem = function(that, key) {
                    var keyIndex = indexOfSelectedItemKey(that, key);
                    if (keyIndex >= 0) {
                        that._selectedItemKeys.splice(keyIndex, 1);
                        that._removedItemKeys.push(key);
                        that._selectedItems.splice(keyIndex, 1)
                    }
                };
            var clearSelectedItems = function(that) {
                    setSelectedItems(that, [], [])
                };
            var setSelectedItems = function(that, keys, items) {
                    var i,
                        oldSelectedItemKeys = that._selectedItemKeys;
                    that._selectedItemKeys = keys;
                    that._selectedItems = items;
                    that._unselectedItemKeys = [];
                    for (i = 0; i < oldSelectedItemKeys.length; i++)
                        if ($.inArray(oldSelectedItemKeys[i], keys) === -1)
                            that._removedItemKeys.push(oldSelectedItemKeys[i]);
                    for (i = 0; i < keys.length; i++)
                        if ($.inArray(keys[i], oldSelectedItemKeys) === -1)
                            that._addedItemKeys.push(keys[i])
                };
            var equalKeys = dataGrid.equalKeys;
            var resetItemSelectionWhenShiftKeyPressed = function(that) {
                    delete that._shiftFocusedItemIndex
                };
            var isDataItem = function(row) {
                    return row && row.rowType === "data" && !row.inserted
                };
            var changeItemSelectionWhenShiftKeyPressed = function(that, itemIndex, items) {
                    var isSelectedItemsChanged = false,
                        itemIndexStep,
                        index,
                        dataController = that.getController('data'),
                        isFocusedItemSelected = items[that._focusedItemIndex] && that.isRowSelected(dataController.keyOf(items[that._focusedItemIndex].data));
                    var addRemoveSelectedItem = function(that, data, isRemove) {
                            if (isRemove)
                                removeSelectedItem(that, dataController.keyOf(data));
                            else
                                addSelectedItem(that, data)
                        };
                    if (!utils.isDefined(that._shiftFocusedItemIndex))
                        that._shiftFocusedItemIndex = that._focusedItemIndex;
                    if (that._shiftFocusedItemIndex !== that._focusedItemIndex) {
                        itemIndexStep = that._focusedItemIndex < that._shiftFocusedItemIndex ? 1 : -1;
                        for (index = that._focusedItemIndex; index !== that._shiftFocusedItemIndex; index += itemIndexStep)
                            if (isDataItem(items[index])) {
                                addRemoveSelectedItem(that, items[index].data, true);
                                isSelectedItemsChanged = true
                            }
                    }
                    if (itemIndex !== that._shiftFocusedItemIndex) {
                        itemIndexStep = itemIndex < that._shiftFocusedItemIndex ? 1 : -1;
                        for (index = itemIndex; index !== that._shiftFocusedItemIndex; index += itemIndexStep)
                            if (isDataItem(items[index])) {
                                addRemoveSelectedItem(that, items[index].data, false);
                                isSelectedItemsChanged = true
                            }
                    }
                    if (isDataItem(items[that._focusedItemIndex]) && !isFocusedItemSelected) {
                        addRemoveSelectedItem(that, items[that._focusedItemIndex].data, false);
                        isSelectedItemsChanged = true
                    }
                    return isSelectedItemsChanged
                };
            var createSelectedItemsFilterCriteria = function(dataSource, selectedItemKeys, isSelectAll) {
                    var keyCriteria,
                        i,
                        key = dataSource && dataSource.key(),
                        criteria = [];
                    if (dataSource)
                        if (key)
                            $.each(selectedItemKeys, function(index, keyValue) {
                                if (criteria.length > 0)
                                    criteria.push(isSelectAll ? 'and' : 'or');
                                if ($.isArray(key)) {
                                    keyCriteria = [];
                                    for (i = 0; i < key.length; i++) {
                                        if (i > 0)
                                            keyCriteria.push(isSelectAll ? 'or' : 'and');
                                        keyCriteria.push([key[i], isSelectAll ? '<>' : '=', keyValue[key[i]]])
                                    }
                                    criteria.push(keyCriteria)
                                }
                                else
                                    criteria.push([key, isSelectAll ? '<>' : '=', keyValue])
                            });
                        else
                            criteria = function(item) {
                                var i;
                                for (i = 0; i < selectedItemKeys.length; i++)
                                    if (equalKeys(selectedItemKeys[i], item))
                                        return !isSelectAll;
                                return isSelectAll
                            };
                    if (criteria.length > 0 || $.isFunction(criteria))
                        return criteria
                };
            var updateSelectedItems = function(that) {
                    var changedItemIndexes = [],
                        dataController = that.getController('data'),
                        addedItemKeys,
                        removedItemKeys;
                    if (dataController) {
                        $.each(dataController.items(), function(index, row) {
                            if (isDataItem(row) && row.isSelected !== that.isRowSelected(row.key))
                                changedItemIndexes.push(index)
                        });
                        if (that.option(SHOW_CHECKBOXES_MODE) === 'onClick')
                            if (that._selectedItemKeys.length > 1)
                                that.startSelectionWithCheckboxes();
                            else if (that._selectedItemKeys.length === 0 && changedItemIndexes.length)
                                that.stopSelectionWithCheckboxes();
                        if (changedItemIndexes.length)
                            dataController.updateItems({
                                changeType: 'updateSelection',
                                itemIndexes: changedItemIndexes
                            });
                        addedItemKeys = that._addedItemKeys;
                        removedItemKeys = that._removedItemKeys;
                        if (addedItemKeys.length || removedItemKeys.length) {
                            that._selectedItemsInternalChange = true;
                            that.option("selectedRowKeys", that._selectedItemKeys.slice(0));
                            that._selectedItemsInternalChange = false;
                            that.selectionChanged.fire(that._selectedItemKeys);
                            that.executeAction("onSelectionChanged", {
                                selectedRowsData: that._selectedItems,
                                selectedRowKeys: that._selectedItemKeys,
                                currentSelectedRowKeys: addedItemKeys,
                                currentDeselectedRowKeys: removedItemKeys
                            })
                        }
                        that._addedItemKeys = [];
                        that._removedItemKeys = []
                    }
                };
            var updateSelectColumn = function(that) {
                    var columnsController = that.getController("columns"),
                        isSelectColumnVisible = that.isSelectColumnVisible();
                    columnsController.addCommandColumn({
                        command: 'select',
                        visible: isSelectColumnVisible,
                        visibleIndex: -1,
                        dataType: 'boolean',
                        alignment: 'center',
                        cssClass: DATAGRID_COMMAND_SELECT_CLASS,
                        width: "auto"
                    });
                    columnsController.columnOption("command:select", "visible", isSelectColumnVisible)
                };
            return {
                    init: function() {
                        var that = this;
                        that._isSelectionWithCheckboxes = false;
                        that._focusedItemIndex = -1;
                        that._selectedItemKeys = [];
                        that._unselectedItemKeys = [];
                        that._selectedItems = [];
                        that._addedItemKeys = [];
                        that._removedItemKeys = [];
                        updateSelectColumn(that);
                        that.createAction("onSelectionChanged", {excludeValidators: ["disabled", "readOnly"]})
                    },
                    callbackNames: function() {
                        return ['selectionChanged']
                    },
                    optionChanged: function(args) {
                        var that = this;
                        that.callBase(args);
                        switch (args.name) {
                            case"selection":
                                that.init();
                                that.getController('columns').updateColumns();
                                args.handled = true;
                                break;
                            case"selectedRowKeys":
                                if (utils.isArray(args.value) && !that._selectedItemsInternalChange)
                                    that.selectRows(args.value);
                                args.handled = true;
                                break
                        }
                    },
                    publicMethods: function() {
                        return ['selectRows', 'deselectRows', 'selectRowsByIndexes', 'getSelectedRowKeys', 'getSelectedRowsData', 'clearSelection', 'selectAll', 'startSelectionWithCheckboxes', 'stopSelectionWithCheckboxes', 'isRowSelected']
                    },
                    isRowSelected: function(key) {
                        var index = indexOfSelectedItemKey(this, key);
                        return index !== -1
                    },
                    isSelectColumnVisible: function() {
                        var showCheckboxesMode = this.option(SHOW_CHECKBOXES_MODE);
                        return this.option(SELECTION_MODE) === 'multiple' && (showCheckboxesMode === 'always' || showCheckboxesMode === 'onClick' || this._isSelectionWithCheckboxes)
                    },
                    isSelectAll: function() {
                        var dataController = this.getController('data'),
                            items = dataController.items(),
                            combinedFilter = dataController.combinedFilter(),
                            selectedItems = this.getSelectedRowsData(),
                            i;
                        if (combinedFilter)
                            DX.data.query(selectedItems).filter(combinedFilter).enumerate().done(function(items) {
                                selectedItems = items
                            });
                        if (!selectedItems.length) {
                            for (i = 0; i < items.length; i++)
                                if (items[i].selected)
                                    return;
                            return false
                        }
                        else if (selectedItems.length >= dataController.totalCount())
                            return true
                    },
                    selectAll: function() {
                        if (this.option(SHOW_CHECKBOXES_MODE) === 'onClick')
                            this.startSelectionWithCheckboxes();
                        return this.selectedItemKeys([], true, false, true)
                    },
                    deselectAll: function() {
                        return this.selectedItemKeys([], true, true, true)
                    },
                    clearSelection: function() {
                        this.selectedItemKeys([])
                    },
                    refresh: function() {
                        return this.selectedItemKeys(this.option("selectedRowKeys") || [])
                    },
                    selectedItemKeys: function(value, preserve, isDeselect, isSelectAll) {
                        var that = this,
                            keys,
                            criteria,
                            isFunctionCriteria,
                            deferred,
                            dataController = that.getController('data'),
                            dataSource = dataController.dataSource(),
                            store = dataSource && dataSource.store(),
                            dataSourceFilter,
                            filter,
                            deselectItems = [];
                        if (utils.isDefined(value)) {
                            if (store) {
                                keys = $.isArray(value) ? $.extend([], value) : [value];
                                if (keys.length || isSelectAll) {
                                    criteria = createSelectedItemsFilterCriteria(dataSource, keys, isSelectAll);
                                    isFunctionCriteria = $.isFunction(criteria);
                                    if (criteria || isSelectAll) {
                                        if (isSelectAll)
                                            dataSourceFilter = dataController.combinedFilter();
                                        if (criteria && !isFunctionCriteria && dataSourceFilter) {
                                            filter = [];
                                            filter.push(criteria);
                                            filter.push(dataSourceFilter)
                                        }
                                        else if (dataSourceFilter)
                                            filter = dataSourceFilter;
                                        else if (criteria && !isFunctionCriteria)
                                            filter = criteria;
                                        deferred = $.Deferred();
                                        if (isDeselect)
                                            new DX.data.ArrayStore(that._selectedItems).load({filter: filter}).done(function(items) {
                                                deselectItems = items
                                            });
                                        dataController.setSelectionLoading(true);
                                        $.when(deselectItems.length ? deselectItems : store.load({filter: filter})).done(function(items) {
                                            new DX.data.ArrayStore(items).load({filter: criteria}).done(deferred.resolve)
                                        }).fail($.proxy(deferred.reject, deferred)).always(function() {
                                            dataController.setSelectionLoading(false)
                                        })
                                    }
                                }
                            }
                            deferred = deferred || $.Deferred().resolve([]);
                            deferred.done(function(items) {
                                var i,
                                    key,
                                    item,
                                    keys = [];
                                if (store && items.length > 0)
                                    for (i = 0; i < items.length; i++) {
                                        item = items[i];
                                        key = store.keyOf(item);
                                        if (preserve)
                                            if (isDeselect)
                                                removeSelectedItem(that, key);
                                            else
                                                addSelectedItem(that, item);
                                        else
                                            keys.push(key)
                                    }
                                if (!preserve)
                                    setSelectedItems(that, keys, items);
                                updateSelectedItems(that)
                            });
                            return deferred
                        }
                        else
                            return that._selectedItemKeys
                    },
                    getSelectedRowKeys: function() {
                        return this.selectedItemKeys()
                    },
                    selectRows: function(keys, preserve) {
                        return this.selectedItemKeys(keys, preserve)
                    },
                    deselectRows: function(keys) {
                        return this.selectedItemKeys(keys, true, true)
                    },
                    selectRowsByIndexes: function(indexes) {
                        var items = this.getController('data').items(),
                            i,
                            keys = [];
                        if (!utils.isArray(indexes))
                            indexes = Array.prototype.slice.call(arguments, 0);
                        $.each(indexes, function() {
                            var item = items[this];
                            if (item && item.rowType === 'data')
                                keys.push(item.key)
                        });
                        return this.selectRows(keys)
                    },
                    getSelectedRowsData: function() {
                        return this._selectedItems
                    },
                    changeItemSelection: function(itemIndex, keys) {
                        var that = this,
                            dataController = that.getController('data'),
                            items = dataController.items(),
                            item = items[itemIndex],
                            itemData = item && item.data,
                            selectionMode = that.option(SELECTION_MODE),
                            isSelectedItemsChanged,
                            isSelected,
                            itemKey;
                        if (isSelectable(selectionMode) && isDataItem(item)) {
                            itemKey = dataController.keyOf(itemData);
                            keys = keys || {};
                            if (that.isSelectionWithCheckboxes())
                                keys.control = true;
                            if (keys.shift && selectionMode === 'multiple' && that._focusedItemIndex >= 0)
                                isSelectedItemsChanged = changeItemSelectionWhenShiftKeyPressed(that, itemIndex, items);
                            else if (keys.control) {
                                resetItemSelectionWhenShiftKeyPressed(that);
                                isSelected = that.isRowSelected(itemKey);
                                if (selectionMode === 'single')
                                    clearSelectedItems(that);
                                if (isSelected)
                                    removeSelectedItem(that, itemKey);
                                else
                                    addSelectedItem(that, itemData);
                                isSelectedItemsChanged = true
                            }
                            else {
                                resetItemSelectionWhenShiftKeyPressed(that);
                                if (that._selectedItemKeys.length !== 1 || !equalKeys(that._selectedItemKeys[0], itemKey)) {
                                    setSelectedItems(that, [itemKey], [itemData]);
                                    isSelectedItemsChanged = true
                                }
                            }
                            if (isSelectedItemsChanged) {
                                that._focusedItemIndex = itemIndex;
                                updateSelectedItems(that);
                                return true
                            }
                        }
                        return false
                    },
                    focusedItemIndex: function(itemIndex) {
                        var that = this;
                        if (utils.isDefined(itemIndex))
                            that._focusedItemIndex = itemIndex;
                        else
                            return that._focusedItemIndex
                    },
                    isSelectionWithCheckboxes: function() {
                        var selectionMode = this.option(SELECTION_MODE),
                            showCheckboxesMode = this.option(SHOW_CHECKBOXES_MODE);
                        return selectionMode === 'multiple' && (showCheckboxesMode === 'always' || this._isSelectionWithCheckboxes)
                    },
                    startSelectionWithCheckboxes: function() {
                        var that = this,
                            isSelectColumnVisible = that.isSelectColumnVisible();
                        if (that.option(SELECTION_MODE) === 'multiple' && !that.isSelectionWithCheckboxes()) {
                            that._isSelectionWithCheckboxes = true;
                            updateSelectColumn(that);
                            if (isSelectColumnVisible === that.isSelectColumnVisible() && that.option(SHOW_CHECKBOXES_MODE) === 'onClick')
                                updateSelectedItems(that);
                            return true
                        }
                        return false
                    },
                    stopSelectionWithCheckboxes: function() {
                        var that = this,
                            isSelectColumnVisible = that.isSelectColumnVisible();
                        if (that._isSelectionWithCheckboxes) {
                            that._isSelectionWithCheckboxes = false;
                            updateSelectColumn(that);
                            return true
                        }
                        return false
                    }
                }
        }());
        $.extend(dataGrid.__internals, {DATAGRID_CHECKBOXES_HIDDEN_CLASS: DATAGRID_CHECKBOXES_HIDDEN_CLASS});
        dataGrid.registerModule('selection', {
            defaultOptions: function() {
                return {
                        selection: {
                            mode: 'none',
                            showCheckBoxesInMultipleMode: 'onClick',
                            allowSelectAll: true
                        },
                        selectedRowKeys: []
                    }
            },
            controllers: {selection: dataGrid.SelectionController},
            extenders: {
                controllers: {data: {
                        setDataSource: function(dataSource) {
                            this.callBase(dataSource);
                            if (dataSource)
                                this.getController('selection').refresh()
                        },
                        setSelectionLoading: function(isLoading) {
                            this._isSelectionLoading = isLoading;
                            this._fireLoadingChanged()
                        },
                        isLoading: function() {
                            var isLoading = this.callBase();
                            return isLoading || !!this._isSelectionLoading
                        },
                        pageIndex: function(value) {
                            var that = this,
                                dataSource = that._dataSource;
                            if (dataSource && value && dataSource.pageIndex() !== value)
                                that.getController('selection').focusedItemIndex(-1);
                            return that.callBase(value)
                        },
                        _processDataItem: function() {
                            var that = this,
                                selectionController = that.getController('selection'),
                                hasSelectColumn = selectionController.isSelectColumnVisible(),
                                dataItem = this.callBase.apply(this, arguments);
                            dataItem.isSelected = selectionController.isRowSelected(dataItem.key);
                            if (hasSelectColumn && dataItem.values)
                                dataItem.values[0] = dataItem.isSelected;
                            return dataItem
                        },
                        refresh: function() {
                            return $.when(this.getController('selection').refresh(), this.callBase.apply(this, arguments))
                        }
                    }},
                views: {
                    columnHeadersView: {
                        _renderCore: function(options) {
                            var that = this;
                            that.getController('selection').selectionChanged.remove(that._selectionChangedHandler);
                            that.callBase(options)
                        },
                        _renderHeaderContent: function(rootElement, column, columnIndex) {
                            var that = this,
                                groupElement,
                                selectionController = that.getController('selection'),
                                dataController = that.getController('data');
                            if (column.command === 'select') {
                                rootElement.addClass(DATAGRID_EDITOR_CELL_CLASS);
                                groupElement = $('<div />').appendTo(rootElement).addClass(DATAGRID_SELECT_CHECKBOX_CLASS);
                                that.getController('editorFactory').createEditor(groupElement, $.extend({}, column, {
                                    parentType: "headerRow",
                                    value: selectionController.isSelectAll(),
                                    setValue: function(value, e) {
                                        if (e.jQueryEvent && selectionController.isSelectAll() !== value) {
                                            if (e.previousValue === undefined || e.previousValue) {
                                                selectionController.deselectAll();
                                                e.component.option('value', false)
                                            }
                                            if (e.previousValue === false)
                                                if (that.option("selection.allowSelectAll"))
                                                    selectionController.selectAll();
                                                else
                                                    e.component.option('value', false);
                                            e.jQueryEvent.preventDefault()
                                        }
                                    }
                                }));
                                rootElement.on('dxclick', that.createAction(function(e) {
                                    var event = e.jQueryEvent;
                                    if (!$(event.target).closest('.' + DATAGRID_SELECT_CHECKBOX_CLASS).length)
                                        $(event.currentTarget).children().trigger('dxclick');
                                    event.preventDefault()
                                }));
                                dataController.changed.remove(that._dataChangedHandler);
                                selectionController.selectionChanged.remove(that._selectionChangedHandler);
                                that._selectionChangedHandler = function() {
                                    groupElement.dxCheckBox('instance').option('value', selectionController.isSelectAll())
                                };
                                that._dataChangedHandler = function(e) {
                                    if (!e || e.changeType === "refresh")
                                        that._selectionChangedHandler()
                                };
                                dataController.changed.add(that._dataChangedHandler);
                                selectionController.selectionChanged.add(that._selectionChangedHandler)
                            }
                            else
                                that.callBase(rootElement, column, columnIndex)
                        }
                    },
                    rowsView: {
                        _getDefaultTemplate: function(column) {
                            var that = this,
                                groupElement;
                            if (column.command === 'select')
                                return function(container, options) {
                                        if (options.rowType === 'data' && !options.row.inserted) {
                                            container.addClass(DATAGRID_EDITOR_CELL_CLASS);
                                            container.on('dxclick', that.createAction(function(e) {
                                                var selectionController = that.getController('selection'),
                                                    event = e.jQueryEvent,
                                                    rowIndex = that.getRowIndex($(event.currentTarget).closest('.' + DATAGRID_ROW_CLASS));
                                                if (rowIndex >= 0) {
                                                    selectionController.startSelectionWithCheckboxes();
                                                    selectionController.changeItemSelection(rowIndex, {shift: event.shiftKey})
                                                }
                                            }));
                                            groupElement = $('<div />').addClass(DATAGRID_SELECT_CHECKBOX_CLASS).appendTo(container);
                                            that.getController('editorFactory').createEditor(groupElement, $.extend({}, column, {
                                                parentType: "dataRow",
                                                value: options.value,
                                                setValue: function(value, e) {
                                                    if (e && e.jQueryEvent && e.jQueryEvent.type === 'keydown')
                                                        container.trigger('dxclick', e)
                                                }
                                            }))
                                        }
                                    };
                            else
                                return that.callBase(column)
                        },
                        _update: function(change) {
                            var that = this;
                            if (change.changeType === 'updateSelection') {
                                if (that._tableElement.length > 0)
                                    $.each(change.itemIndexes || [], function(_, index) {
                                        var $row,
                                            isSelected;
                                        if (change.items[index]) {
                                            $row = that._getRowElements().eq(index);
                                            isSelected = !!change.items[index].isSelected;
                                            $row.toggleClass(DATAGRID_ROW_SELECTION_CLASS, isSelected);
                                            $row.find('.' + DATAGRID_SELECT_CHECKBOX_CLASS).dxCheckBox('option', 'value', isSelected)
                                        }
                                    });
                                that._updateCheckboxesClass()
                            }
                            else
                                that.callBase(change)
                        },
                        _createTable: function() {
                            var that = this,
                                selectionMode = that.option("selection.mode"),
                                $table = that.callBase.apply(that, arguments);
                            if (selectionMode !== "none")
                                $table.on(events.addNamespace("dxhold", "dxDataGridRowsView"), "." + DATAGRID_DATA_ROW_CLASS, that.createAction(function(e) {
                                    var selectionController = that.getController('selection'),
                                        event = e.jQueryEvent,
                                        rowIndex = $(event.target).closest("." + DATAGRID_DATA_ROW_CLASS).index();
                                    if (that.option(SHOW_CHECKBOXES_MODE) === 'onLongTap')
                                        if (selectionController.isSelectionWithCheckboxes())
                                            selectionController.stopSelectionWithCheckboxes();
                                        else
                                            selectionController.startSelectionWithCheckboxes();
                                    else {
                                        if (that.option(SHOW_CHECKBOXES_MODE) === 'onClick')
                                            selectionController.startSelectionWithCheckboxes();
                                        selectionController.changeItemSelection(rowIndex, {control: true})
                                    }
                                })).on('mousedown selectstart', that.createAction(function(e) {
                                    var event = e.jQueryEvent;
                                    if (event.shiftKey)
                                        event.preventDefault()
                                }));
                            return $table
                        },
                        _createRow: function(rowOptions) {
                            var $row = this.callBase(rowOptions);
                            rowOptions && $row.toggleClass(DATAGRID_ROW_SELECTION_CLASS, !!rowOptions.isSelected);
                            return $row
                        },
                        _rowClick: function(e) {
                            var that = this,
                                jQueryEvent = e.jQueryEvent,
                                isCommandSelect = $(jQueryEvent.target).closest("." + DATAGRID_COMMAND_SELECT_CLASS).length,
                                isSelectionDisabled = $(jQueryEvent.target).closest("." + DATAGRID_SELECTION_DISABLED_CLASS).length;
                            if (!isCommandSelect) {
                                if (!isSelectionDisabled)
                                    if (that.getController('selection').changeItemSelection(e.rowIndex, {
                                        control: jQueryEvent.ctrlKey,
                                        shift: jQueryEvent.shiftKey
                                    })) {
                                        jQueryEvent.preventDefault();
                                        e.handled = true
                                    }
                                that.callBase(e)
                            }
                        },
                        _renderCore: function(change) {
                            this.callBase(change);
                            this._updateCheckboxesClass()
                        },
                        _updateCheckboxesClass: function() {
                            var selectionController = this.getController('selection'),
                                isCheckBoxesHidden = selectionController.isSelectColumnVisible() && !selectionController.isSelectionWithCheckboxes();
                            this._tableElement && this._tableElement.toggleClass(DATAGRID_CHECKBOXES_HIDDEN_CLASS, isCheckBoxesHidden)
                        }
                    }
                }
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.editorFactory.js */
    (function($, DX) {
        var dataGrid = DX.ui.dxDataGrid,
            utils = DX.utils,
            addNamespace = DX.ui.events.addNamespace;
        var DATAGRID_CHECKBOX_SIZE_CLASS = "dx-datagrid-checkbox-size",
            DATAGRID_CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled",
            DATAGRID_MODULE_NAMESPACE = 'dxDataGridEditorFactory',
            DATAGRID_UPDATE_FOCUS_EVENTS = addNamespace('focusin dxpointerdown dxclick', DATAGRID_MODULE_NAMESPACE),
            DATAGRID_FOCUS_OVERLAY_CLASS = 'dx-datagrid-focus-overlay',
            DATAGRID_FOCUSED_ELEMENT_CLASS = 'dx-focused',
            DATAGRID_CONTENT_CLASS = 'dx-datagrid-content',
            DATAGRID_HIGHLIGHT_OUTLINE_CLASS = 'dx-highlight-outline',
            TAB_KEY = 9;
        dataGrid.EditorFactoryController = dataGrid.ViewController.inherit(function() {
            var getResultConfig = function(config, options) {
                    return $.extend(config, {
                            readOnly: options.readOnly,
                            rtlEnabled: options.rtlEnabled,
                            disabled: options.disabled
                        })
                };
            var getTextEditorConfig = function($container, options) {
                    return getResultConfig({
                            placeholder: options.placeholder,
                            width: options.width,
                            value: options.value,
                            onValueChanged: function(e) {
                                var updateValue = function(e) {
                                        options && options.setValue(e.value)
                                    };
                                window.clearTimeout($container._valueChangeTimeoutID);
                                if (e.jQueryEvent && e.jQueryEvent.type === 'keyup')
                                    $container._valueChangeTimeoutID = window.setTimeout(function() {
                                        updateValue(e)
                                    }, utils.isDefined(options.updateValueTimeout) ? options.updateValueTimeout : 0);
                                else
                                    updateValue(e)
                            },
                            valueChangeEvent: 'change' + (options.parentType === 'filterRow' ? ' keyup' : '')
                        }, options)
                };
            var createDateBox = function($container, options) {
                    $container.dxDateBox(getResultConfig({
                        value: options.value,
                        useCalendar: true,
                        customOverlayCssClass: 'dx-datagrid',
                        onValueChanged: function(args) {
                            options.setValue(args.value)
                        },
                        formatString: DX.utils.isString(options.format) && DX.DateTimeFormat[options.format.toLowerCase()] || options.format,
                        formatWidthCalculator: null
                    }, options))
                };
            var createTextBox = function($container, options) {
                    var config = getTextEditorConfig($container, options),
                        isSearching = options.parentType === 'searchPanel',
                        toString = function(value) {
                            return DX.utils.isDefined(value) ? value.toString() : ''
                        };
                    config.value = toString(options.value);
                    config.valueChangeEvent += isSearching ? ' keyup search' : '';
                    config.mode = isSearching ? 'search' : 'text';
                    $container.dxTextBox(config);
                    $container.dxTextBox("instance").registerKeyHandler("enter", $.noop)
                };
            var createNumberBox = function($container, options) {
                    var config = getTextEditorConfig($container, options);
                    config.value = utils.isDefined(options.value) ? options.value : null;
                    $container.dxNumberBox(config)
                };
            var createBooleanEditor = function($container, options) {
                    if (options.parentType === 'filterRow')
                        createSelectBox($container, $.extend({lookup: {
                                displayExpr: function(data) {
                                    if (data === true)
                                        return options.trueText || 'true';
                                    else if (data === false)
                                        return options.falseText || 'false'
                                },
                                items: [true, false],
                                rtlEnabled: options.rtlEnabled,
                                disabled: options.disabled
                            }}, options));
                    else
                        createCheckBox($container, options)
                };
            var createSelectBox = function($container, options) {
                    var lookup = options.lookup,
                        items,
                        displayGetter,
                        isFilterRow = options.parentType === "filterRow";
                    if (lookup) {
                        items = lookup.items;
                        displayGetter = DX.data.utils.compileGetter(lookup.displayExpr);
                        if (isFilterRow && items) {
                            items = items.slice(0);
                            items.unshift(null)
                        }
                        $container.dxSelectBox(getResultConfig({
                            searchEnabled: true,
                            value: options.value,
                            valueExpr: options.lookup.valueExpr,
                            showClearButton: lookup.allowClearing && !isFilterRow,
                            displayExpr: function(data) {
                                if (data === null)
                                    return options.showAllText;
                                return displayGetter(data)
                            },
                            items: items,
                            onValueChanged: function(e) {
                                options.setValue(e.value, e)
                            }
                        }, options))
                    }
                };
            var createCheckBox = function($container, options) {
                    $container.addClass(DATAGRID_CHECKBOX_SIZE_CLASS).dxCheckBox(getResultConfig({
                        value: options.value,
                        onValueChanged: function(e) {
                            options.setValue && options.setValue(e.value, e)
                        }
                    }, options))
                };
            var elementFromAbsolutePoint = function(x, y) {
                    var element,
                        scrollX = window.pageXOffset,
                        scrollY = window.pageYOffset;
                    window.scrollTo(x, y);
                    element = document.elementFromPoint(x - window.pageXOffset, y - window.pageYOffset);
                    window.scrollTo(scrollX, scrollY);
                    return element
                };
            return {
                    _getFocusedElement: function($dataGridElement) {
                        return $dataGridElement.find('[tabindex]:focus, input:focus')
                    },
                    _updateFocusCore: function() {
                        var $focus = this._$focusedElement,
                            $dataGridElement = this.component && this.component.element();
                        if ($dataGridElement) {
                            $focus = this._getFocusedElement($dataGridElement);
                            if ($focus.length) {
                                if (!$focus.hasClass(DATAGRID_CELL_FOCUS_DISABLED_CLASS))
                                    $focus = $focus.closest('.dx-row > td, .' + DATAGRID_CELL_FOCUS_DISABLED_CLASS);
                                if ($focus.length && !$focus.hasClass(DATAGRID_CELL_FOCUS_DISABLED_CLASS)) {
                                    this.focus($focus);
                                    return
                                }
                            }
                        }
                        this.loseFocus()
                    },
                    _updateFocus: function(e) {
                        var that = this,
                            isFocusOverlay = e && e.jQueryEvent && $(e.jQueryEvent.target).hasClass(DATAGRID_FOCUS_OVERLAY_CLASS);
                        that._isFocusOverlay = that._isFocusOverlay || isFocusOverlay;
                        clearTimeout(that._updateFocusTimeoutID);
                        that._updateFocusTimeoutID = setTimeout(function() {
                            delete that._updateFocusTimeoutID;
                            if (!that._isFocusOverlay)
                                that._updateFocusCore();
                            that._isFocusOverlay = false
                        })
                    },
                    _updateFocusOverlaySize: function($element, position) {
                        var location = DX.calculatePosition($element, position);
                        if (location.h.oversize > 0)
                            $element.outerWidth($element.outerWidth() - location.h.oversize);
                        if (location.v.oversize > 0)
                            $element.outerHeight($element.outerHeight() - location.v.oversize)
                    },
                    callbackNames: function() {
                        return ["focused"]
                    },
                    focus: function($element, hideBorder) {
                        var that = this;
                        if ($element === undefined)
                            return that._$focusedElement;
                        else if ($element)
                            setTimeout(function() {
                                var $focusOverlay = that._$focusOverlay = that._$focusOverlay || $('<div>').addClass(DATAGRID_FOCUS_OVERLAY_CLASS),
                                    focusOverlayPosition;
                                if (hideBorder)
                                    that._$focusOverlay && that._$focusOverlay.hide();
                                else {
                                    var align = DevExpress.browser.mozilla ? "right bottom" : "left top",
                                        $content = $element.closest('.' + DATAGRID_CONTENT_CLASS);
                                    $focusOverlay.show().appendTo($content).outerWidth($element.outerWidth() + 1).outerHeight($element.outerHeight() + 1);
                                    focusOverlayPosition = {
                                        my: align,
                                        at: align,
                                        of: $element,
                                        boundary: $content.length && $content
                                    };
                                    that._updateFocusOverlaySize($focusOverlay, focusOverlayPosition);
                                    DX.position($focusOverlay, focusOverlayPosition);
                                    $focusOverlay.css('visibility', 'visible')
                                }
                                that._$focusedElement && that._$focusedElement.removeClass(DATAGRID_FOCUSED_ELEMENT_CLASS);
                                $element.addClass(DATAGRID_FOCUSED_ELEMENT_CLASS);
                                that._$focusedElement = $element;
                                that.focused.fire($element)
                            })
                    },
                    resize: function() {
                        var $focusedElement = this._$focusedElement;
                        if ($focusedElement)
                            this.focus($focusedElement)
                    },
                    loseFocus: function() {
                        this._$focusedElement && this._$focusedElement.removeClass(DATAGRID_FOCUSED_ELEMENT_CLASS);
                        this._$focusedElement = null;
                        this._$focusOverlay && this._$focusOverlay.hide()
                    },
                    init: function() {
                        this.createAction("onEditorPreparing", {excludeValidators: ["designMode", "disabled", "readOnly"]});
                        this.createAction("onEditorPrepared", {excludeValidators: ["designMode", "disabled", "readOnly"]});
                        this._updateFocusHandler = this._updateFocusHandler || this.createAction($.proxy(this._updateFocus, this));
                        $(document).on(DATAGRID_UPDATE_FOCUS_EVENTS, this._updateFocusHandler);
                        this._attachContainerEventHandlers()
                    },
                    _attachContainerEventHandlers: function() {
                        var that = this,
                            $container = that.component && that.component.element(),
                            isIE10OrLower = DX.browser.msie && parseInt(DX.browser.version) < 11;
                        if ($container) {
                            $container.on(addNamespace('keydown', DATAGRID_MODULE_NAMESPACE), function(e) {
                                if (e.which === TAB_KEY)
                                    that._updateFocusHandler(e)
                            });
                            isIE10OrLower && $container.on('dxclick dxpointerup dxpointerdown', '.' + DATAGRID_FOCUS_OVERLAY_CLASS + ", ." + DATAGRID_HIGHLIGHT_OUTLINE_CLASS, $.proxy(that._focusOverlayEventProxy, that))
                        }
                    },
                    _focusOverlayEventProxy: function(e) {
                        var $target = $(e.target),
                            element,
                            $focusedElement = this._$focusedElement;
                        var className = $target.get(0).className;
                        if (!className)
                            return;
                        $target.removeClass(className);
                        element = elementFromAbsolutePoint(e.pageX, e.pageY);
                        $(element).trigger(jQuery.Event(e.type, {
                            pageX: e.pageX,
                            pageY: e.pageY
                        }));
                        $target.addClass(className);
                        $focusedElement && $focusedElement.find('input').focus()
                    },
                    dispose: function() {
                        clearTimeout(this._updateFocusTimeoutID);
                        $(document).off(DATAGRID_UPDATE_FOCUS_EVENTS, this._updateFocusHandler)
                    },
                    createEditor: function($container, options) {
                        this.component._suppressDeprecatedWarnings();
                        var editorPreparing = this.option("editorPreparing"),
                            editorPrepared = this.option("editorPrepared");
                        this.component._resumeDeprecatedWarnings();
                        options.rtlEnabled = this.option('rtlEnabled');
                        options.disabled = options.disabled || this.option("disabled");
                        options.cancel = false;
                        options.editorElement = $container;
                        editorPreparing && editorPreparing($container, options);
                        this.executeAction("onEditorPreparing", options);
                        if (options.cancel)
                            return;
                        if (options.lookup)
                            createSelectBox($container, options);
                        else
                            switch (options.dataType) {
                                case'date':
                                    createDateBox($container, options);
                                    break;
                                case'boolean':
                                    createBooleanEditor($container, options);
                                    break;
                                case'number':
                                    createNumberBox($container, options);
                                    break;
                                default:
                                    createTextBox($container, options);
                                    break
                            }
                        editorPrepared && editorPrepared($container, options);
                        this.executeAction("onEditorPrepared", options)
                    }
                }
        }());
        $.extend(dataGrid.__internals, {DATAGRID_FOCUSED_ELEMENT_CLASS: DATAGRID_FOCUSED_ELEMENT_CLASS});
        dataGrid.registerModule('editorFactory', {
            defaultOptions: function() {
                return {}
            },
            controllers: {editorFactory: dataGrid.EditorFactoryController}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.columnsView.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_SORT_CLASS = "dx-sort",
            DATAGRID_SORTUP_CLASS = "dx-sort-up",
            DATAGRID_SORTDOWN_CLASS = "dx-sort-down",
            DATAGRID_SORT_ALIGNMENT_CLASS = "dx-sort-alignment-",
            DATAGRID_CELL_CONTENT_CLASS = "dx-datagrid-text-content",
            DATAGRID_SCROLL_CONTAINER_CLASS = "dx-datagrid-scroll-container",
            DATAGRID_ROW_CLASS = "dx-row",
            DATAGRID_GROUP_ROW_CLASS = "dx-group-row",
            DATAGRID_CONTENT_CLASS = "dx-datagrid-content",
            DATAGRID_TABLE_CLASS = "dx-datagrid-table",
            DATAGRID_TABLE_FIXED_CLASS = "dx-datagrid-table-fixed",
            DATAGRID_CELL_HINT_VISIBLE = "dxCellHintVisible";
        dataGrid.createColGroup = function(columns) {
            var colgroupElement = $('<colgroup />'),
                columnsLength = columns.length,
                i;
            for (i = 0; i < columnsLength; i++)
                $('<col />').width(columns[i].visibleWidth || columns[i].width).appendTo(colgroupElement);
            return colgroupElement
        };
        dataGrid.ColumnsView = dataGrid.View.inherit({
            _applySorting: function(rootElement, column, showColumnLines) {
                var $span,
                    columnAlignment;
                function getAlignment(columnAlignment) {
                    return columnAlignment === 'right' ? 'left' : 'right'
                }
                rootElement.find('.' + DATAGRID_SORT_CLASS).remove();
                if (utils.isDefined(column.sortOrder)) {
                    if (column.alignment === 'center') {
                        var align = this.option('rtlEnabled') ? 'right' : 'left';
                        $('<span />').addClass(DATAGRID_SORT_CLASS).css('float', align).prependTo(rootElement)
                    }
                    columnAlignment = column.alignment || 'left';
                    $span = $('<span />').addClass(DATAGRID_SORT_CLASS).css('float', showColumnLines ? getAlignment(column.alignment) : columnAlignment).toggleClass(DATAGRID_SORTUP_CLASS, column.sortOrder === 'asc').toggleClass(DATAGRID_SORTDOWN_CLASS, column.sortOrder === 'desc');
                    if (this.option("showColumnLines"))
                        $span.prependTo(rootElement);
                    else
                        $span.addClass(DATAGRID_SORT_ALIGNMENT_CLASS + columnAlignment).appendTo(rootElement)
                }
            },
            _updateSortIndicatorPositions: function(rootElement) {
                if (!rootElement)
                    return;
                var sortIndicators = rootElement.find('.' + DATAGRID_SORT_CLASS);
                $.each(sortIndicators, function() {
                    var $sortIndicator = $(this),
                        $sortIndicatorContainer = $sortIndicator.parent(),
                        $textContent = $sortIndicatorContainer.find('.' + DATAGRID_CELL_CONTENT_CLASS);
                    $sortIndicator.height("auto");
                    $sortIndicator.height($textContent.height() || $sortIndicatorContainer.height())
                })
            },
            _createRow: function() {
                return $("<tr />").addClass(DATAGRID_ROW_CLASS)
            },
            _createTable: function(columns) {
                var that = this,
                    $table = $('<table />').addClass(DATAGRID_TABLE_CLASS).addClass(DATAGRID_TABLE_CLASS + '-fixed');
                if (columns) {
                    $table.append(dataGrid.createColGroup(columns));
                    if (DX.devices.real().ios)
                        $table.append("<thead><tr></tr></thead>")
                }
                if (that.option("cellHintEnabled"))
                    $table.on("mousemove", ".dx-row > td", this.createAction(function(args) {
                        var e = args.jQueryEvent,
                            $element = $(e.target),
                            $cell = $(e.currentTarget),
                            $row = $cell.parent(),
                            isDataRow = $row.hasClass('dx-data-row'),
                            $cells = $row.children(),
                            visibleColumns = that._columnsController.getVisibleColumns(),
                            visibleColumnIndex = $cells.index($cell),
                            column = visibleColumns[visibleColumnIndex];
                        if (!isDataRow || isDataRow && column && !column.cellTemplate) {
                            if ($element.data(DATAGRID_CELL_HINT_VISIBLE)) {
                                $element.removeAttr("title");
                                $element.data(DATAGRID_CELL_HINT_VISIBLE, false)
                            }
                            if ($element[0].scrollWidth > $element[0].clientWidth && !$element.attr("title")) {
                                $element.attr("title", $element.text());
                                $element.data(DATAGRID_CELL_HINT_VISIBLE, true)
                            }
                        }
                    }));
                return $table
            },
            _columnOptionChanged: function(e) {
                var optionNames = e.optionNames;
                if (dataGrid.checkChanges(optionNames, ['width', 'visibleWidth'])) {
                    var visibleColumns = this._columnsController.getVisibleColumns();
                    var widths = $.map(visibleColumns, function(column) {
                            return column.visibleWidth || column.width || 'auto'
                        });
                    this.setColumnWidths(widths);
                    return
                }
                this.render()
            },
            _getTableElements: function() {
                return this._tableElement || []
            },
            optionChanged: function(args) {
                if (args.name === 'cellHintEnabled') {
                    this.render();
                    args.handled = true
                }
                else
                    this.callBase(args)
            },
            init: function() {
                var that = this;
                that._columnsController = that.getController('columns');
                that._dataController = that.getController('data');
                that._columnsController.columnsChanged.add($.proxy(that._columnOptionChanged, that));
                that._dataController && that._dataController.changed.add($.proxy(that._handleDataChanged, that))
            },
            _handleDataChanged: function(e){},
            scrollOffset: function(pos) {
                var that = this,
                    $element = that.element(),
                    $scrollContainer = $element && $element.find('.' + DATAGRID_SCROLL_CONTAINER_CLASS);
                if (pos === undefined)
                    return $scrollContainer && $scrollContainer.scrollLeft();
                else if (that._scrollLeft !== pos) {
                    that._scrollLeft = pos;
                    $scrollContainer && $scrollContainer.scrollLeft(pos)
                }
            },
            wrapTableInScrollContainer: function($table) {
                return $('<div/>').addClass(DATAGRID_CONTENT_CLASS).addClass(DATAGRID_SCROLL_CONTAINER_CLASS).append($table)
            },
            getColumnWidths: function() {
                var that = this,
                    cells,
                    result = [],
                    width,
                    clientRect;
                if (that._tableElement) {
                    cells = that._tableElement.children('tbody').children('tr').filter(':not(.' + DATAGRID_GROUP_ROW_CLASS + ')').first().find('td');
                    $.each(cells, function(index, item) {
                        width = $(item).outerWidth(true);
                        if (item.getBoundingClientRect) {
                            clientRect = item.getBoundingClientRect();
                            if (clientRect.width > width)
                                width = Math.ceil(clientRect.width)
                        }
                        result.push(width)
                    })
                }
                return result
            },
            setColumnWidths: function(widths) {
                var $cols,
                    i,
                    columnIndex,
                    tableElements = this._getTableElements();
                if (widths)
                    for (i = 0; i < tableElements.length; i++) {
                        $cols = tableElements.eq(i).find('col');
                        for (columnIndex = 0; columnIndex < widths.length; columnIndex++)
                            $cols.eq(columnIndex).width(widths[columnIndex] || 'auto')
                    }
            },
            getColumnElements: function(){},
            getColumns: function(){},
            getCell: function(cellPosition) {
                var row;
                if (this._tableElement && this._tableElement.length === 1) {
                    row = this._tableElement[0].rows[cellPosition.rowIndex];
                    return row ? $(row.cells[cellPosition.columnIndex]) : null
                }
            },
            getRowsCount: function() {
                if (this._tableElement && this._tableElement.length === 1)
                    return this._tableElement[0].rows.length;
                return 0
            },
            getBoundingRect: function(){},
            getName: function(){},
            tableElement: function() {
                return this._tableElement
            }
        });
        $.extend(dataGrid.__internals, {
            DATAGRID_SORT_CLASS: DATAGRID_SORT_CLASS,
            DATAGRID_SORTUP_CLASS: DATAGRID_SORTUP_CLASS,
            DATAGRID_SORTDOWN_CLASS: DATAGRID_SORTDOWN_CLASS,
            DATAGRID_SORT_ALIGNMENT_CLASS: DATAGRID_SORT_ALIGNMENT_CLASS,
            DATAGRID_CELL_CONTENT_CLASS: DATAGRID_CELL_CONTENT_CLASS,
            DATAGRID_ROW_CLASS: DATAGRID_ROW_CLASS,
            DATAGRID_GROUP_ROW_CLASS: DATAGRID_GROUP_ROW_CLASS,
            DATAGRID_TABLE_CLASS: DATAGRID_TABLE_CLASS,
            DATAGRID_TABLE_FIXED_CLASS: DATAGRID_TABLE_FIXED_CLASS,
            DATAGRID_SCROLL_CONTAINER_CLASS: DATAGRID_SCROLL_CONTAINER_CLASS
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.columnChooserModule.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_COLUMN_CHOOSER_CLASS = 'dx-datagrid-column-chooser',
            DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS = 'dx-datagrid-column-chooser-button',
            DATAGRID_COLUMN_CHOOSER_ICON_NAME = 'column-chooser',
            DATAGRID_COLUMN_CHOOSER_ITEM_CLASS = "dx-column-chooser-item",
            DATAGRID_COLUMN_CHOOSER_MESSAGE_CLASS = "dx-column-chooser-message",
            DATAGRID_HEADERS_DRAG_ACTION_CLASS = "dx-datagrid-drag-action";
        dataGrid.ColumnChooserController = dataGrid.ViewController.inherit({
            renderShowColumnChooserButton: function($element) {
                var that = this,
                    columnChooserEnabled = that.option("columnChooser.enabled"),
                    $showColumnChooserButton = $element.find("." + DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS),
                    $columnChooserButton;
                if (columnChooserEnabled)
                    if (!$showColumnChooserButton.length) {
                        $columnChooserButton = $('<div />').addClass(DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS).appendTo($element);
                        that._createComponent($columnChooserButton, "dxButton", {
                            icon: DATAGRID_COLUMN_CHOOSER_ICON_NAME,
                            onClick: function(e) {
                                that.getView("columnChooserView").showColumnChooser()
                            },
                            hint: that.option("columnChooser.title")
                        })
                    }
                    else
                        $showColumnChooserButton.show();
                else
                    $showColumnChooserButton.hide()
            },
            getPosition: function() {
                var rowsView = this.getView("rowsView");
                return {
                        my: "right bottom",
                        at: "right bottom",
                        of: rowsView && rowsView.element(),
                        collision: 'fit',
                        offset: "-2 -2",
                        boundaryOffset: "2 2"
                    }
            }
        });
        dataGrid.ColumnChooserView = dataGrid.ColumnsView.inherit({
            _updateItems: function() {
                var chooserColumns = this._columnsController.getChooserColumns(),
                    columnChooserOptions = this.option("columnChooser"),
                    $content = this._popupContainer.content(),
                    scrollableInstance = this._createComponent($content, "dxScrollable", dataGrid.createScrollableOptions(this));
                this._renderColumnChooserItems($content, chooserColumns);
                if (!chooserColumns.length)
                    $('<span />').addClass(DATAGRID_COLUMN_CHOOSER_MESSAGE_CLASS).text(columnChooserOptions ? columnChooserOptions.emptyPanelText : "").appendTo(scrollableInstance.content())
            },
            _initializePopupContainer: function() {
                var that = this,
                    $element = that.element().addClass(DATAGRID_COLUMN_CHOOSER_CLASS),
                    columnChooserOptions = that.option("columnChooser"),
                    theme = DevExpress.ui.themes.current(),
                    isGenericTheme = theme && theme.indexOf("generic") > -1,
                    isAndroid5Theme = theme && theme.indexOf("android5") > -1,
                    dxPopupOptions = {
                        visible: false,
                        shading: false,
                        showCloseButton: false,
                        buttons: [{
                                text: columnChooserOptions.title,
                                toolbar: "top",
                                location: isGenericTheme || isAndroid5Theme ? "before" : "center"
                            }],
                        position: that.getController("columnChooser").getPosition(),
                        width: columnChooserOptions.width,
                        height: columnChooserOptions.height,
                        rtlEnabled: that.option('rtlEnabled'),
                        container: columnChooserOptions.container
                    };
                if (isGenericTheme)
                    $.extend(dxPopupOptions, {showCloseButton: true});
                else
                    dxPopupOptions.buttons[dxPopupOptions.buttons.length] = {shortcut: "cancel"};
                if (!utils.isDefined(this._popupContainer)) {
                    that._popupContainer = that._createComponent($element, "dxPopup", dxPopupOptions);
                    that._popupContainer.on("optionChanged", function(args) {
                        if (args.name === "visible")
                            that.renderCompleted.fire()
                    })
                }
                else
                    this._popupContainer.option(dxPopupOptions)
            },
            _renderCore: function() {
                if (this._popupContainer)
                    this._updateItems()
            },
            _renderColumnChooserItems: function($container, chooserColumns) {
                var dxScrollable = $container.dxScrollable("instance"),
                    $scrollableContainer = dxScrollable.content(),
                    $item;
                $scrollableContainer.empty();
                $.each(chooserColumns, function(index, chooserColumn) {
                    $item = $('<div />').addClass(chooserColumn.cssClass).addClass(DATAGRID_COLUMN_CHOOSER_ITEM_CLASS).toggleClass(DATAGRID_HEADERS_DRAG_ACTION_CLASS, chooserColumn.allowHiding).text(chooserColumn.caption).appendTo($scrollableContainer)
                });
                dxScrollable.update()
            },
            getColumnElements: function() {
                var $content = this._popupContainer && this._popupContainer.content();
                return $content && $content.find('.' + DATAGRID_COLUMN_CHOOSER_ITEM_CLASS)
            },
            getName: function() {
                return 'columnChooser'
            },
            getColumns: function() {
                return this._columnsController.getChooserColumns()
            },
            allowDragging: function(column) {
                return this.isColumnChooserVisible() && column && column.allowHiding
            },
            getBoundingRect: function() {
                var that = this,
                    container = that._popupContainer && that._popupContainer._container(),
                    offset;
                if (container && container.is(':visible')) {
                    offset = container.offset();
                    return {
                            left: offset.left,
                            top: offset.top,
                            right: offset.left + container.outerWidth(),
                            bottom: offset.top + container.outerHeight()
                        }
                }
                return null
            },
            showColumnChooser: function() {
                this._isPopupContainerShown = true;
                if (!this._popupContainer) {
                    this._initializePopupContainer();
                    this.render()
                }
                this._popupContainer.show()
            },
            hideColumnChooser: function() {
                if (this._popupContainer) {
                    this._popupContainer.hide();
                    this._isPopupContainerShown = false
                }
            },
            isColumnChooserVisible: function() {
                var popupContainer = this._popupContainer;
                return popupContainer && popupContainer.option("visible")
            },
            publicMethods: function() {
                return ['showColumnChooser', 'hideColumnChooser']
            }
        });
        $.extend(dataGrid.__internals, {
            DATAGRID_COLUMN_CHOOSER_CLASS: DATAGRID_COLUMN_CHOOSER_CLASS,
            DATAGRID_COLUMN_CHOOSER_ITEM_CLASS: DATAGRID_COLUMN_CHOOSER_ITEM_CLASS,
            DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS: DATAGRID_COLUMN_CHOOSER_BUTTON_CLASS,
            DATAGRID_COLUMN_CHOOSER_MESSAGE_CLASS: DATAGRID_COLUMN_CHOOSER_MESSAGE_CLASS
        });
        dataGrid.registerModule('columnChooser', {
            defaultOptions: function() {
                return {columnChooser: {
                            enabled: false,
                            width: 250,
                            height: 260,
                            title: Globalize.localize("dxDataGrid-columnChooserTitle"),
                            emptyPanelText: Globalize.localize("dxDataGrid-columnChooserEmptyText"),
                            container: undefined
                        }}
            },
            controllers: {columnChooser: dataGrid.ColumnChooserController},
            views: {columnChooserView: dataGrid.ColumnChooserView},
            extenders: {views: {headerPanel: {
                        _renderShowColumnChooserButton: function() {
                            this.getController("columnChooser").renderShowColumnChooserButton(this.element())
                        },
                        _renderCore: function() {
                            this.callBase();
                            this._renderShowColumnChooserButton()
                        },
                        optionChanged: function(args) {
                            switch (args.name) {
                                case'columnChooser':
                                    this._renderShowColumnChooserButton();
                                    args.handled = true;
                                    break;
                                default:
                                    this.callBase(args)
                            }
                        },
                        isVisible: function() {
                            var that = this,
                                columnChooserEnabled = that.option('columnChooser.enabled');
                            return that.callBase() || columnChooserEnabled
                        }
                    }}}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.editing.js */
    (function($, DX) {
        var dataGrid = DX.ui.dxDataGrid,
            events = DX.ui.events,
            addNamespace = events.addNamespace,
            utils = DX.utils,
            getIndexByKey = dataGrid.getIndexByKey;
        var DATAGRID_LINK_CLASS = "dx-link",
            DATAGRID_STATE_HOVER_CLASS = "dx-state-hover",
            DATAGRID_EDITOR_CELL_CLASS = "dx-editor-cell",
            DATAGRID_ROW_SELECTED = "dx-selection",
            DATAGRID_EDIT_ROW = "dx-edit-row",
            DATAGRID_EDIT_BUTTON_CLASS = "dx-edit-button",
            DATAGRID_INSERT_INDEX = "__DX_INSERT_INDEX__",
            DATAGRID_ROW_REMOVED = "dx-row-removed",
            DATAGRID_ROW_INSERTED = "dx-row-inserted",
            DATAGRID_ROW_MODIFIED = "dx-row-modified",
            DATAGRID_CELL_MODIFIED = "dx-cell-modified",
            DATAGRID_CELL_HIGHLIGHT_OUTLINE = "dx-highlight-outline",
            DATAGRID_EDITING_NAMESPACE = "dxDataGridEditing",
            DATAGRID_FOCUS_OVERLAY_CLASS = "dx-datagrid-focus-overlay",
            DATAGRID_READONLY_CLASS = "dx-datagrid-readonly",
            DATAGRID_DATA_ROW_CLASS = "dx-data-row",
            CHECKBOX_CLASS = "dx-checkbox",
            DATAGRID_EDITOR_INLINE_BLOCK = "dx-editor-inline-block",
            DATAGRID_CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled",
            DATAGRID_EDIT_MODE_BATCH = "batch",
            DATAGRID_EDIT_MODE_ROW = "row",
            DATAGRID_EDIT_MODE_CELL = "cell",
            DATA_EDIT_DATA_INSERT_TYPE = "insert",
            DATA_EDIT_DATA_UPDATE_TYPE = "update",
            DATA_EDIT_DATA_REMOVE_TYPE = "remove";
        var getEditMode = function(that) {
                var editMode = that.option('editing.editMode');
                if (editMode === DATAGRID_EDIT_MODE_BATCH || editMode === DATAGRID_EDIT_MODE_CELL)
                    return editMode;
                return DATAGRID_EDIT_MODE_ROW
            };
        dataGrid.EditingController = dataGrid.ViewController.inherit(function() {
            var getDefaultEditorTemplate = function(that) {
                    return function(container, options) {
                            var $editor = $('<div/>').appendTo(container);
                            that.getController('editorFactory').createEditor($editor, $.extend({}, options.column, {
                                value: options.value,
                                setValue: options.setValue,
                                parentType: 'dataRow',
                                width: null,
                                readOnly: options.setValue === undefined
                            }))
                        }
                };
            var getDataController = function(that) {
                    return that.getController('data')
                };
            return {
                    init: function() {
                        var that = this;
                        that._insertIndex = 1;
                        that._editRowIndex = -1;
                        that._editData = [];
                        that._editColumnIndex = -1;
                        that._columnsController = that.getController("columns");
                        that.createAction("onInitNewRow", {excludeValidators: ["disabled", "readOnly"]});
                        that.createAction("onRowInserting", {excludeValidators: ["disabled", "readOnly"]});
                        that.createAction("onRowInserted", {excludeValidators: ["disabled", "readOnly"]});
                        that.createAction("onEditingStart", {excludeValidators: ["disabled", "readOnly"]});
                        that.createAction("onRowUpdating", {excludeValidators: ["disabled", "readOnly"]});
                        that.createAction("onRowUpdated", {excludeValidators: ["disabled", "readOnly"]});
                        that.createAction("onRowRemoving", {excludeValidators: ["disabled", "readOnly"]});
                        that.createAction("onRowRemoved", {excludeValidators: ["disabled", "readOnly"]});
                        if (!that._saveEditorHandler) {
                            that._saveEditorHandler = that.createAction(function(e) {
                                var event = e.jQueryEvent,
                                    visibleColumns,
                                    isEditorPopup,
                                    isDomElement,
                                    isFocusOverlay,
                                    $targetCell,
                                    allowEditing,
                                    cellIndex,
                                    isDataRow;
                                if (getEditMode(that) !== DATAGRID_EDIT_MODE_ROW && that.isEditing() && !that._editCellInProgress) {
                                    isEditorPopup = $(event.target).closest('.dx-overlay-wrapper').length;
                                    isDomElement = $(event.target).closest(document).length;
                                    isFocusOverlay = $(event.target).hasClass(DATAGRID_FOCUS_OVERLAY_CLASS);
                                    isDataRow = $(event.target).closest('.' + DATAGRID_DATA_ROW_CLASS).length;
                                    visibleColumns = that._columnsController.getVisibleColumns();
                                    $targetCell = $(event.target).closest('td');
                                    cellIndex = $targetCell[0] && $targetCell[0].cellIndex;
                                    allowEditing = visibleColumns[cellIndex] && visibleColumns[cellIndex].allowEditing;
                                    if ((!isDataRow || isDataRow && !allowEditing) && !isEditorPopup && !isFocusOverlay && isDomElement)
                                        that.closeEditCell()
                                }
                            });
                            $(document).on('dxclick', that._saveEditorHandler)
                        }
                        that._updateEditColumn();
                        that._updateEditButtons()
                    },
                    getEditMode: function() {
                        return getEditMode(this)
                    },
                    getFirstEditableColumnIndex: function() {
                        var columnsController = this.getController("columns"),
                            visibleColumns = columnsController.getVisibleColumns(),
                            columnIndex;
                        $.each(visibleColumns, function(index, column) {
                            if (column.allowEditing) {
                                columnIndex = index;
                                return false
                            }
                        });
                        return columnIndex
                    },
                    getFirstEditableCellInRow: function(rowIndex) {
                        return this.getView('rowsView').getCellElement(rowIndex ? rowIndex : 0, this.getFirstEditableColumnIndex())
                    },
                    getIndexByKey: function(key, items) {
                        return getIndexByKey(key, items)
                    },
                    hasChanges: function() {
                        var that = this,
                            result = false;
                        $.each(that._editData, function(_, editData) {
                            result = result || !!editData.type
                        });
                        return result
                    },
                    dispose: function() {
                        this.callBase();
                        $(document).off('dxclick', this._saveEditorHandler)
                    },
                    optionChanged: function(args) {
                        if (args.name === "editing") {
                            this.init();
                            args.handled = true
                        }
                        else
                            this.callBase(args)
                    },
                    publicMethods: function() {
                        return ['insertRow', 'editRow', 'editCell', 'closeEditCell', 'removeRow', 'saveEditData', 'recoverRow', 'undeleteRow', 'cancelEditData']
                    },
                    refresh: function() {
                        var editRowIndex = this._editRowIndex,
                            editData = this._editData;
                        if (getEditMode(this) === DATAGRID_EDIT_MODE_ROW || getEditMode(this) === DATAGRID_EDIT_MODE_CELL)
                            this.init();
                        else {
                            this._editRowIndex = -1;
                            this._editColumnIndex = -1
                        }
                    },
                    isEditing: function() {
                        return this._editRowIndex > -1
                    },
                    isEditRow: function(rowIndex) {
                        return getEditMode(this) === DATAGRID_EDIT_MODE_ROW && this._editRowIndex === rowIndex
                    },
                    isEditCell: function(rowIndex, columnIndex) {
                        return this._editRowIndex === rowIndex && this._editColumnIndex === columnIndex
                    },
                    processItems: function(items, changeType) {
                        var that = this,
                            editData = that._editData,
                            i,
                            key,
                            data;
                        that.update();
                        for (i = 0; i < editData.length; i++) {
                            key = editData[i].key;
                            data = {key: key};
                            if (editData[i].type === DATA_EDIT_DATA_INSERT_TYPE && key.pageIndex === that._pageIndex) {
                                data[DATAGRID_INSERT_INDEX] = key[DATAGRID_INSERT_INDEX];
                                items.splice(key.rowIndex, 0, data)
                            }
                        }
                        return items
                    },
                    processDataItem: function(item, columns, generateDataValues) {
                        var that = this,
                            editIndex,
                            editData,
                            data,
                            key = item.data[DATAGRID_INSERT_INDEX] ? item.data.key : item.key,
                            editMode = getEditMode(that);
                        editIndex = getIndexByKey(key, that._editData);
                        if (editIndex >= 0) {
                            editData = that._editData[editIndex];
                            data = editData.data;
                            switch (editData.type) {
                                case DATA_EDIT_DATA_INSERT_TYPE:
                                    item.inserted = true;
                                    item.key = key;
                                    item.data = data;
                                    break;
                                case DATA_EDIT_DATA_UPDATE_TYPE:
                                    item.modified = true;
                                    item.data = $.extend(true, {}, item.data, data);
                                    item.modifiedValues = generateDataValues(data, columns);
                                    break;
                                case DATA_EDIT_DATA_REMOVE_TYPE:
                                    if (editMode === DATAGRID_EDIT_MODE_BATCH)
                                        item.data = $.extend(true, {}, item.data, data);
                                    item.removed = true;
                                    break
                            }
                        }
                    },
                    insertRow: function() {
                        var that = this,
                            dataController = getDataController(that),
                            rowsView = that.getView('rowsView'),
                            param = {data: {}},
                            insertKey = {
                                pageIndex: dataController.pageIndex(),
                                rowIndex: rowsView ? rowsView.getTopVisibleItemIndex() : 0
                            },
                            oldEditRowIndex = that._editRowIndex,
                            editMode = getEditMode(that),
                            $firstCell;
                        that.refresh();
                        if (editMode !== DATAGRID_EDIT_MODE_BATCH) {
                            if (that._insertIndex > 1)
                                return;
                            that._editRowIndex = insertKey.rowIndex
                        }
                        that.executeAction("onInitNewRow", param);
                        insertKey[DATAGRID_INSERT_INDEX] = that._insertIndex++;
                        that._addEditData({
                            key: insertKey,
                            data: param.data,
                            type: DATA_EDIT_DATA_INSERT_TYPE
                        });
                        dataController.updateItems({
                            changeType: 'update',
                            rowIndices: [oldEditRowIndex, insertKey.rowIndex]
                        });
                        $firstCell = that.getFirstEditableCellInRow();
                        that._delayedInputFocus($firstCell, $.proxy(that._triggerClickOnFirstCellOfRow, that));
                        that._afterInsertRow({
                            key: insertKey,
                            data: param.data
                        })
                    },
                    _triggerClickOnFirstCellOfRow: function(rowIndex) {
                        var $cell = this.getFirstEditableCellInRow(rowIndex);
                        $cell && $cell.trigger("dxclick")
                    },
                    _isEditingStart: function(options) {
                        this.executeAction("onEditingStart", options);
                        return options.cancel
                    },
                    editRow: function(rowIndex) {
                        var that = this,
                            dataController = getDataController(that),
                            items = dataController.items(),
                            item = items[rowIndex],
                            params = {
                                data: item.data,
                                cancel: false
                            },
                            oldEditRowIndex = that._editRowIndex,
                            $firstCell;
                        if (rowIndex === oldEditRowIndex)
                            return true;
                        if (!item.inserted)
                            params.key = item.key;
                        if (that._isEditingStart(params))
                            return;
                        that.init();
                        that._pageIndex = dataController.pageIndex();
                        that._editRowIndex = items[0].inserted ? rowIndex - 1 : rowIndex;
                        that._addEditData({
                            data: {},
                            key: item.key,
                            oldData: item.data
                        });
                        dataController.updateItems({
                            changeType: 'update',
                            rowIndices: [oldEditRowIndex, rowIndex]
                        });
                        $firstCell = that.getFirstEditableCellInRow(that._editRowIndex);
                        that._delayedInputFocus($firstCell, $.proxy(that._triggerClickOnFirstCellOfRow, that, that._editRowIndex))
                    },
                    editCell: function(rowIndex, columnIndex) {
                        var that = this,
                            dataController = getDataController(that),
                            items = dataController.items(),
                            item = items[rowIndex],
                            params = {
                                data: item && item.data,
                                cancel: false,
                                column: that._columnsController.getVisibleColumns()[columnIndex]
                            },
                            editMode = getEditMode(that),
                            oldEditRowIndex = that._editRowIndex,
                            oldEditColumnIndex = that._editColumnIndex,
                            columns = that._columnsController.getVisibleColumns(),
                            isCellEditingAllowed = params.column && params.column.allowEditing,
                            showEditorAlways = params.column && params.column.showEditorAlways,
                            $editCell;
                        if (isCellEditingAllowed && item && item.rowType === 'data' && !item.removed && editMode !== DATAGRID_EDIT_MODE_ROW) {
                            if (that.isEditCell(rowIndex, columnIndex))
                                return true;
                            if (editMode === DATAGRID_EDIT_MODE_CELL && !item.inserted && that.hasChanges()) {
                                that.saveEditData();
                                if (that.hasChanges())
                                    return true
                            }
                            if (!item.inserted)
                                params.key = item.key;
                            if (that._isEditingStart(params))
                                return true;
                            that._editRowIndex = rowIndex;
                            that._editColumnIndex = columnIndex;
                            that._pageIndex = dataController.pageIndex();
                            that._addEditData({
                                data: {},
                                key: item.key,
                                oldData: item.data
                            });
                            if (!showEditorAlways || columns[oldEditColumnIndex] && !columns[oldEditColumnIndex].showEditorAlways) {
                                that._editCellInProgress = true;
                                dataController.updateItems({
                                    changeType: 'update',
                                    rowIndices: [oldEditRowIndex, that._editRowIndex]
                                })
                            }
                            $editCell = that.getView("rowsView").getCellElement(that._editRowIndex, that._editColumnIndex);
                            that._delayedInputFocus($editCell, function() {
                                that._editCellInProgress = false
                            });
                            return true
                        }
                        return false
                    },
                    _delayedInputFocus: function($cell, afterFocusCallback) {
                        setTimeout(function() {
                            $cell && $cell.find('[tabindex], input').focus();
                            afterFocusCallback && afterFocusCallback()
                        })
                    },
                    removeRow: function(rowIndex) {
                        var that = this,
                            editingOptions = that.option("editing"),
                            editingTexts = editingOptions && editingOptions.texts,
                            confirmDeleteTitle = editingTexts && editingTexts.confirmDeleteTitle,
                            isBatchMode = editingOptions && editingOptions.editMode === DATAGRID_EDIT_MODE_BATCH,
                            confirmDeleteMessage = editingTexts && editingTexts.confirmDeleteMessage,
                            dataController = getDataController(that),
                            removeByKey,
                            oldEditRowIndex = that._editRowIndex,
                            item = dataController.items()[rowIndex],
                            key = item && item.key;
                        if (item) {
                            removeByKey = function(key) {
                                that.refresh();
                                var editIndex = getIndexByKey(key, that._editData);
                                if (editIndex >= 0)
                                    if (that._editData[editIndex].type === DATA_EDIT_DATA_INSERT_TYPE)
                                        that._editData.splice(editIndex, 1);
                                    else
                                        that._editData[editIndex].type = DATA_EDIT_DATA_REMOVE_TYPE;
                                else
                                    that._addEditData({
                                        key: key,
                                        oldData: item.data,
                                        type: DATA_EDIT_DATA_REMOVE_TYPE
                                    });
                                if (isBatchMode)
                                    dataController.updateItems({
                                        changeType: 'update',
                                        rowIndices: [oldEditRowIndex, rowIndex]
                                    });
                                else
                                    that.saveEditData()
                            };
                            if (isBatchMode || !confirmDeleteMessage)
                                removeByKey(key);
                            else
                                DX.ui.dialog.confirm(confirmDeleteMessage, confirmDeleteTitle).done(function(confirmResult) {
                                    if (confirmResult)
                                        removeByKey(key)
                                })
                        }
                    },
                    recoverRow: function(rowIndex) {
                        DX.log("W1002", "recoverRow", "14.1", "Use the 'undeleteRow' method instead");
                        return this.undeleteRow(rowIndex)
                    },
                    undeleteRow: function(rowIndex) {
                        var that = this,
                            dataController = getDataController(that),
                            item = dataController.items()[rowIndex],
                            oldEditRowIndex = that._editRowIndex,
                            key = item && item.key;
                        if (item) {
                            var editIndex = getIndexByKey(key, that._editData),
                                editData;
                            if (editIndex >= 0) {
                                editData = that._editData[editIndex];
                                if ($.isEmptyObject(editData.data))
                                    that._editData.splice(editIndex, 1);
                                else
                                    editData.type = DATA_EDIT_DATA_UPDATE_TYPE;
                                dataController.updateItems({
                                    changeType: 'update',
                                    rowIndices: [oldEditRowIndex, rowIndex]
                                })
                            }
                        }
                    },
                    saveEditData: function() {
                        var that = this,
                            dataController = getDataController(that),
                            store = dataController.store(),
                            item,
                            key,
                            processedKeys = [],
                            deferreds = [],
                            rowIndex = that._editRowIndex,
                            editData = $.extend({}, that._editData),
                            editMode = getEditMode(that);
                        var removeEditData = function(that, keys) {
                                $.each(keys, function(index, key) {
                                    var editIndex = getIndexByKey(key, that._editData);
                                    if (editIndex >= 0)
                                        that._editData.splice(editIndex, 1)
                                })
                            };
                        var resetEditIndeces = function(that) {
                                that._editColumnIndex = -1;
                                that._editRowIndex = -1
                            };
                        if (that._beforeSaveEditData())
                            return;
                        $.each(that._editData, function(index, editData) {
                            var data = editData.data,
                                oldData = editData.oldData,
                                key = editData.key,
                                type = editData.type,
                                deferred,
                                params;
                            if (that._beforeSaveEditData(editData, index))
                                return;
                            switch (type) {
                                case DATA_EDIT_DATA_REMOVE_TYPE:
                                    params = {
                                        data: oldData,
                                        key: key,
                                        cancel: false
                                    };
                                    that.executeAction("onRowRemoving", params);
                                    if (params.cancel)
                                        return;
                                    deferred = store.remove(key);
                                    break;
                                case DATA_EDIT_DATA_INSERT_TYPE:
                                    params = {
                                        data: data,
                                        cancel: false
                                    };
                                    that.executeAction("onRowInserting", params);
                                    if (params.cancel)
                                        return;
                                    deferred = store.insert(params.data);
                                    break;
                                case DATA_EDIT_DATA_UPDATE_TYPE:
                                    params = {
                                        newData: data,
                                        oldData: oldData,
                                        key: key,
                                        cancel: false
                                    };
                                    that.executeAction("onRowUpdating", params);
                                    if (params.cancel)
                                        return;
                                    deferred = store.update(key, params.newData);
                                    break
                            }
                            if (deferred) {
                                deferred.done($.proxy(processedKeys.push, processedKeys, key));
                                deferreds.push(deferred)
                            }
                        });
                        if (deferreds.length) {
                            $.when.apply($, deferreds).always(function(e) {
                                var isError = e && e.name === "Error";
                                if (isError) {
                                    dataController.dataErrorOccurred.fire(e);
                                    if (editMode !== DATAGRID_EDIT_MODE_BATCH)
                                        return
                                }
                                removeEditData(that, processedKeys);
                                resetEditIndeces(that);
                                $.when(dataController.refresh()).always(function() {
                                    $.each(editData, function(_, itemData) {
                                        var data = itemData.data,
                                            key = itemData.key,
                                            type = itemData.type,
                                            params = {
                                                key: key,
                                                data: data
                                            };
                                        if (isError)
                                            params.error = e;
                                        switch (type) {
                                            case DATA_EDIT_DATA_REMOVE_TYPE:
                                                that.executeAction("onRowRemoved", $.extend({}, params, {data: itemData.oldData}));
                                                break;
                                            case DATA_EDIT_DATA_INSERT_TYPE:
                                                that.executeAction("onRowInserted", params);
                                                break;
                                            case DATA_EDIT_DATA_UPDATE_TYPE:
                                                that.executeAction("onRowUpdated", params);
                                                break
                                        }
                                    });
                                    that._afterSaveEditData()
                                })
                            });
                            return
                        }
                        if (editMode === DATAGRID_EDIT_MODE_ROW) {
                            if (!that.hasChanges())
                                that.cancelEditData()
                        }
                        else {
                            resetEditIndeces(that);
                            dataController.updateItems(rowIndex >= 0 && {
                                changeType: 'update',
                                rowIndices: [rowIndex]
                            })
                        }
                        that._afterSaveEditData()
                    },
                    _updateEditColumn: function() {
                        var that = this,
                            editing = that.option('editing'),
                            isEditColumnVisible = editing && ((editing.editEnabled || editing.insertEnabled) && getEditMode(that) === DATAGRID_EDIT_MODE_ROW || editing.removeEnabled);
                        that._columnsController.addCommandColumn({
                            command: 'edit',
                            visible: isEditColumnVisible,
                            cssClass: "dx-command-edit",
                            width: "auto"
                        });
                        that._columnsController.columnOption("command:edit", "visible", isEditColumnVisible)
                    },
                    _updateEditButtons: function() {
                        var that = this,
                            saveChangesButton = that._saveChangesButton,
                            cancelChangesButton = that._cancelChangesButton,
                            hasChanges = that.hasChanges();
                        if (saveChangesButton)
                            saveChangesButton.option('disabled', !hasChanges);
                        if (cancelChangesButton)
                            cancelChangesButton.option('disabled', !hasChanges)
                    },
                    cancelEditData: function() {
                        var that = this,
                            dataController = getDataController(that);
                        that._beforeCancelEditData();
                        that.init();
                        dataController.updateItems()
                    },
                    closeEditCell: function() {
                        var that = this,
                            editMode = getEditMode(that),
                            oldEditRowIndex = that._editRowIndex,
                            dataController = getDataController(that);
                        if (editMode !== DATAGRID_EDIT_MODE_ROW)
                            setTimeout(function() {
                                if (editMode === DATAGRID_EDIT_MODE_CELL && that.hasChanges())
                                    that.saveEditData();
                                else if (oldEditRowIndex >= 0) {
                                    that._editRowIndex = -1;
                                    that._editColumnIndex = -1;
                                    dataController.updateItems({
                                        changeType: 'update',
                                        rowIndices: [oldEditRowIndex]
                                    })
                                }
                            })
                    },
                    update: function() {
                        var that = this,
                            dataController = getDataController(that);
                        if (that._pageIndex !== dataController.pageIndex()) {
                            that.refresh();
                            that._pageIndex = dataController.pageIndex()
                        }
                        that._updateEditButtons()
                    },
                    updateFieldValue: function(options, value) {
                        var that = this,
                            data = {},
                            rowKey = options.key,
                            $cellElement = options.cellElement,
                            params;
                        if (rowKey !== undefined && options.column.setCellValue) {
                            $cellElement && $cellElement.addClass(DATAGRID_CELL_MODIFIED);
                            options.value = value;
                            options.column.setCellValue(data, value);
                            params = {
                                data: data,
                                key: rowKey,
                                type: DATA_EDIT_DATA_UPDATE_TYPE
                            };
                            that._addEditData(params);
                            that._updateEditButtons()
                        }
                    },
                    _addEditData: function(options) {
                        var that = this,
                            editDataIndex = getIndexByKey(options.key, that._editData);
                        if (editDataIndex < 0) {
                            editDataIndex = that._editData.length;
                            that._editData.push(options)
                        }
                        if (that._editData[editDataIndex]) {
                            options.type = that._editData[editDataIndex].type || options.type;
                            $.extend(true, that._editData[editDataIndex], {
                                data: options.data,
                                type: options.type
                            })
                        }
                        return editDataIndex
                    },
                    getColumnTemplate: function(options) {
                        var that = this,
                            column = options.column,
                            rowIndex = options.row && options.row.rowIndex,
                            template,
                            editingOptions,
                            editingTexts,
                            editEnabled = that.option("editing.editEnabled"),
                            isRowMode = getEditMode(that) === DATAGRID_EDIT_MODE_ROW,
                            isRowEditing = that.isEditRow(rowIndex),
                            isCellEditing = that.isEditCell(rowIndex, options.columnIndex);
                        if ((column.showEditorAlways || column.allowEditing && column.dataField && (isRowEditing || isCellEditing)) && options.rowType === 'data' && !utils.isDefined(column.command)) {
                            if (column.allowEditing && (editEnabled || isRowEditing || isCellEditing) && (isRowMode && isRowEditing || !isRowMode))
                                options.setValue = function(value) {
                                    that.updateFieldValue(options, value)
                                };
                            template = column.editCellTemplate || getDefaultEditorTemplate(that)
                        }
                        else if (column.command === 'edit')
                            template = function(container, options) {
                                var createLink = function(container, text, methodName, options) {
                                        var $link = $('<a />').addClass(DATAGRID_LINK_CLASS).text(text).on(addNamespace('dxclick', DATAGRID_EDITING_NAMESPACE), that.createAction(function(params) {
                                                var e = params.jQueryEvent;
                                                e.stopPropagation();
                                                setTimeout(function() {
                                                    options.row && that[methodName](options.row.rowIndex)
                                                })
                                            }));
                                        options.rtlEnabled ? container.prepend($link, "&nbsp;") : container.append($link, "&nbsp;")
                                    };
                                container.css('text-align', 'center');
                                options.rtlEnabled = that.option('rtlEnabled');
                                editingOptions = that.option("editing") || {};
                                editingTexts = editingOptions.texts || {};
                                if (options.row && options.row.rowIndex === that._editRowIndex && isRowMode) {
                                    createLink(container, editingTexts.saveRowChanges, 'saveEditData', options);
                                    createLink(container, editingTexts.cancelRowChanges, 'cancelEditData', options)
                                }
                                else {
                                    if (editingOptions.editEnabled && isRowMode)
                                        createLink(container, editingTexts.editRow, 'editRow', options);
                                    if (editingOptions.removeEnabled)
                                        if (options.row.removed)
                                            createLink(container, editingTexts.undeleteRow, 'undeleteRow', options);
                                        else
                                            createLink(container, editingTexts.deleteRow, 'removeRow', options)
                                }
                            };
                        return template
                    },
                    renderEditButtons: function(rootElement) {
                        var that = this,
                            insertButton = rootElement.find('.' + DATAGRID_EDIT_BUTTON_CLASS),
                            editingOptions = that.option("editing") || {},
                            editingTexts = that.option("editing.texts") || {},
                            titleButtonTextByClassNames = {
                                cancel: editingTexts.cancelAllChanges,
                                save: editingTexts.saveAllChanges,
                                addrow: editingTexts.addRow
                            };
                        var createEditButton = function(rootElement, className, methodName) {
                                return $('<div />').addClass(DATAGRID_EDIT_BUTTON_CLASS).addClass("dx-datagrid-" + className + "-button").appendTo(rootElement).dxButton({
                                        icon: "edit-button-" + className,
                                        onClick: function(options) {
                                            var e = options.jQueryEvent;
                                            e.stopPropagation();
                                            that[methodName]()
                                        },
                                        hint: titleButtonTextByClassNames && titleButtonTextByClassNames[className]
                                    }).dxButton('instance')
                            };
                        if (insertButton.length)
                            insertButton.remove();
                        if ((editingOptions.editEnabled || editingOptions.insertEnabled || editingOptions.removeEnabled) && getEditMode(that) === DATAGRID_EDIT_MODE_BATCH) {
                            that._cancelChangesButton = createEditButton(rootElement, "cancel", 'cancelEditData');
                            that._saveChangesButton = createEditButton(rootElement, "save", 'saveEditData');
                            that._updateEditButtons()
                        }
                        if (editingOptions.insertEnabled)
                            createEditButton(rootElement, "addrow", 'insertRow')
                    },
                    createHighlightCell: function($cell) {
                        var $highlight = $cell.find("." + DATAGRID_CELL_HIGHLIGHT_OUTLINE);
                        if (!$highlight.length)
                            $cell.wrapInner($("<div>").addClass(DATAGRID_CELL_HIGHLIGHT_OUTLINE))
                    },
                    _afterInsertRow: function(options){},
                    _beforeEditCell: function(){},
                    _beforeSaveEditData: function(editData, editIndex){},
                    _afterSaveEditData: function(){},
                    _beforeCancelEditData: function(){}
                }
        }());
        dataGrid.registerModule('editing', {
            defaultOptions: function() {
                return {editing: {
                            editMode: 'row',
                            insertEnabled: false,
                            editEnabled: false,
                            removeEnabled: false,
                            texts: {
                                editRow: Globalize.localize("dxDataGrid-editingEditRow"),
                                saveAllChanges: Globalize.localize("dxDataGrid-editingSaveAllChanges"),
                                saveRowChanges: Globalize.localize("dxDataGrid-editingSaveRowChanges"),
                                cancelAllChanges: Globalize.localize("dxDataGrid-editingCancelAllChanges"),
                                cancelRowChanges: Globalize.localize("dxDataGrid-editingCancelRowChanges"),
                                addRow: Globalize.localize("dxDataGrid-editingAddRow"),
                                deleteRow: Globalize.localize("dxDataGrid-editingDeleteRow"),
                                recoverRow: Globalize.localize("dxDataGrid-editingUndeleteRow"),
                                undeleteRow: Globalize.localize("dxDataGrid-editingUndeleteRow"),
                                confirmDeleteMessage: Globalize.localize("dxDataGrid-editingConfirmDeleteMessage"),
                                confirmDeleteTitle: Globalize.localize("dxDataGrid-editingConfirmDeleteTitle")
                            }
                        }}
            },
            controllers: {editing: dataGrid.EditingController},
            extenders: {
                controllers: {data: {
                        init: function() {
                            this._editingController = this.getController('editing');
                            this.callBase()
                        },
                        reload: function() {
                            this._editingController.refresh();
                            return this.callBase()
                        },
                        _processItems: function(items, changeType) {
                            items = this._editingController.processItems(items, changeType);
                            return this.callBase(items, changeType)
                        },
                        _processDataItem: function(dataItem, options) {
                            this._editingController.processDataItem(dataItem, options.visibleColumns, this._generateDataValues);
                            return this.callBase(dataItem, options)
                        }
                    }},
                views: {
                    rowsView: {
                        _getColumnTemplate: function(options) {
                            var that = this,
                                template = that.getController('editing').getColumnTemplate(options);
                            return template || that.callBase(options)
                        },
                        _createTable: function() {
                            var that = this,
                                editing = that.option("editing"),
                                $table = that.callBase.apply(that, arguments);
                            if (editing && editing.editMode !== DATAGRID_EDIT_MODE_ROW && editing.editEnabled)
                                $table.on(events.addNamespace("dxhold", "dxDataGridRowsView"), "td:not(." + DATAGRID_EDITOR_CELL_CLASS + ")", that.createAction(function(e) {
                                    var editingController = that.getController("editing");
                                    if (editingController.isEditing())
                                        editingController.closeEditCell()
                                }));
                            return $table
                        },
                        _createRow: function(options) {
                            var $row = this.callBase(options),
                                editingController,
                                isEditRow,
                                isRowRemoved,
                                isRowInserted,
                                isRowModified;
                            if (options) {
                                editingController = this.getController('editing');
                                isEditRow = editingController.isEditRow(options.rowIndex);
                                isRowRemoved = !!options.removed;
                                isRowInserted = !!options.inserted;
                                isRowModified = !!options.modified;
                                if (getEditMode(this) === DATAGRID_EDIT_MODE_BATCH)
                                    $row.toggleClass(DATAGRID_ROW_REMOVED, isRowRemoved);
                                else
                                    $row.toggleClass(DATAGRID_EDIT_ROW, isEditRow);
                                $row.toggleClass(DATAGRID_ROW_INSERTED, isRowInserted);
                                $row.toggleClass(DATAGRID_ROW_MODIFIED, isRowModified);
                                if (isEditRow || isRowInserted || isRowRemoved)
                                    $row.removeClass(DATAGRID_ROW_SELECTED)
                            }
                            return $row
                        },
                        _rowClick: function(e) {
                            var that = this,
                                editingController = that.getController('editing'),
                                $targetCell = $(e.jQueryEvent.target).closest('td'),
                                columnIndex = $targetCell.length ? $targetCell[0].cellIndex : -1,
                                editEnabled = that.option("editing.editEnabled");
                            if (!(editEnabled && editingController.editCell(e.rowIndex, columnIndex)) && !editingController.isEditRow(e.rowIndex))
                                that.callBase(e)
                        },
                        _cellPrepared: function($cell, parameters) {
                            var modifiedValues = parameters.row && (parameters.row.inserted ? parameters.row.values : parameters.row.modifiedValues),
                                columnIndex = parameters.columnIndex,
                                alignment = parameters.column.alignment,
                                editingController = this.getController('editing'),
                                editMode = editingController.getEditMode();
                            parameters.isEditing = editingController.isEditCell(parameters.rowIndex, parameters.columnIndex) || editingController.isEditRow(parameters.rowIndex) && parameters.column.allowEditing;
                            if (!utils.isDefined(parameters.column.command) && (parameters.isEditing || parameters.column.showEditorAlways)) {
                                $cell.addClass(DATAGRID_EDITOR_CELL_CLASS).toggleClass(DATAGRID_READONLY_CLASS, !parameters.setValue);
                                if (alignment)
                                    $cell.find('input').first().css('text-align', alignment)
                            }
                            if ($cell.children('.' + CHECKBOX_CLASS).length === 1) {
                                $cell.addClass(DATAGRID_EDITOR_INLINE_BLOCK);
                                $cell.addClass(DATAGRID_CELL_FOCUS_DISABLED_CLASS)
                            }
                            if (editMode === DATAGRID_EDIT_MODE_BATCH || editMode === DATAGRID_EDIT_MODE_CELL && parameters.row.inserted)
                                if (modifiedValues && modifiedValues[columnIndex] !== undefined && parameters.column && parameters.column.allowEditing) {
                                    editingController.createHighlightCell($cell);
                                    $cell.addClass(DATAGRID_CELL_MODIFIED)
                                }
                                else if (parameters.setValue)
                                    editingController.createHighlightCell($cell, true);
                            this.callBase.apply(this, arguments)
                        },
                        _update: function(change) {
                            this.callBase(change);
                            if (change.changeType === 'updateSelection')
                                this._tableElement.children('tbody').children('.' + DATAGRID_EDIT_ROW).removeClass(DATAGRID_ROW_SELECTED)
                        }
                    },
                    headerPanel: {
                        _renderCore: function() {
                            this.callBase();
                            this.getController('editing').renderEditButtons(this.element())
                        },
                        isVisible: function() {
                            var that = this,
                                editingOptions = that.getController('editing').option('editing');
                            return that.callBase() || editingOptions && (editingOptions.insertEnabled || (editingOptions.editEnabled || editingOptions.removeEnabled) && editingOptions.editMode === DATAGRID_EDIT_MODE_BATCH)
                        }
                    }
                }
            }
        });
        $.extend(dataGrid.__internals, {
            DATAGRID_LINK_CLASS: DATAGRID_LINK_CLASS,
            DATAGRID_EDITOR_CELL_CLASS: DATAGRID_EDITOR_CELL_CLASS,
            DATAGRID_EDIT_ROW: DATAGRID_EDIT_ROW,
            DATAGRID_EDIT_BUTTON_CLASS: DATAGRID_EDIT_BUTTON_CLASS,
            DATAGRID_CELL_MODIFIED: DATAGRID_CELL_MODIFIED,
            DATAGRID_ROW_REMOVED: DATAGRID_ROW_REMOVED,
            DATAGRID_ROW_INSERTED: DATAGRID_ROW_INSERTED,
            DATAGRID_ROW_MODIFIED: DATAGRID_ROW_MODIFIED,
            DATAGRID_CELL_HIGHLIGHT_OUTLINE: DATAGRID_CELL_HIGHLIGHT_OUTLINE,
            DATAGRID_FOCUS_OVERLAY_CLASS: DATAGRID_FOCUS_OVERLAY_CLASS,
            DATAGRID_READONLY_CLASS: DATAGRID_READONLY_CLASS
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.validationModule.js */
    (function($, DX) {
        var dataGrid = DX.ui.dxDataGrid,
            utils = DX.utils;
        var DATAGRID_INVALIDATE_CLASS = "dx-datagrid-invalid",
            DATAGRID_CELL_HIGHLIGHT_OUTLINE = "dx-highlight-outline",
            DATAGRID_INVALID_MESSAGE_CLASS = "dx-invalid-message",
            DATAGRID_INVALID_MESSAGE_ALWAYS_CLASS = "dx-invalid-message-always",
            DATAGRID_INSERT_INDEX = "__DX_INSERT_INDEX__",
            DATAGRID_EDIT_MODE_ROW = "row",
            DATAGRID_EDIT_MODE_BATCH = "batch",
            DATAGRID_EDIT_MODE_CELL = "cell",
            DATA_EDIT_DATA_INSERT_TYPE = "insert";
        dataGrid.ValidatingController = dataGrid.Controller.inherit(function() {
            return {
                    init: function() {
                        this._editingController = this.getController("editing");
                        this.createAction("onRowValidating")
                    },
                    _rowValidating: function(editData, validate) {
                        var that = this,
                            brokenRules = validate.brokenRules || validate.brokenRule && [validate.brokenRule],
                            items = that.getController("data").items(),
                            parameters = {
                                brokenRules: brokenRules,
                                isValid: validate.isValid,
                                key: editData.key,
                                newData: editData.data,
                                oldData: editData.oldData,
                                errorText: null
                            };
                        that.executeAction("onRowValidating", parameters);
                        return {
                                isValid: parameters.isValid,
                                errorText: parameters.errorText,
                                rowIndex: that._editingController.getIndexByKey(editData.key, items),
                                brokenRules: brokenRules
                            }
                    },
                    validate: function(isFull) {
                        var that = this,
                            isValid = true,
                            editingController = that._editingController,
                            isFull = isFull || editingController.getEditMode() === DATAGRID_EDIT_MODE_ROW;
                        if (that._isValidationInProgress)
                            return false;
                        that._isValidationInProgress = true;
                        if (isFull)
                            $.each(editingController._editData, function(index, editData) {
                                var validationResult;
                                if (editData.type) {
                                    validationResult = that.validateGroup(editData);
                                    if (!validationResult.isValid)
                                        $.each(validationResult.brokenRules, function() {
                                            if (this.validator.option("adapter").getValue() === undefined)
                                                editingController.updateFieldValue({
                                                    key: editData.key,
                                                    column: this.column
                                                }, null, true)
                                        });
                                    isValid = isValid && validationResult.isValid
                                }
                            });
                        else if (that._currentCellValidator) {
                            var group = that._currentCellValidator._findGroup(),
                                validate = that._currentCellValidator.validate();
                            isValid = that._rowValidating(group, validate).isValid
                        }
                        that._isValidationInProgress = false;
                        return isValid
                    },
                    validateGroup: function(editData) {
                        var that = this,
                            isHasValidateGroup = DX.validationEngine.getGroupConfig(editData),
                            validationResults,
                            result = {isValid: true};
                        if (isHasValidateGroup) {
                            validationResults = DX.validationEngine.validateGroup(editData);
                            $.extend(true, result, that._rowValidating(editData, validationResults))
                        }
                        return result
                    },
                    updateEditData: function(editData) {
                        this.setDisableApplyValidationResults(true);
                        editData.isValid = DX.validationEngine.getGroupConfig(editData) ? DX.validationEngine.validateGroup(editData).isValid : true;
                        this.setDisableApplyValidationResults(false)
                    },
                    setValidator: function(validator) {
                        this._currentCellValidator = validator
                    },
                    getValidator: function() {
                        return this._currentCellValidator
                    },
                    removeValidators: function(editIndex) {
                        var that = this,
                            editingController = that._editingController;
                        $.each(editingController._editData, function(index, editData) {
                            var validateGroup = DX.validationEngine.getGroupConfig(editData),
                                validationResults;
                            if (!utils.isDefined(editIndex) || editIndex === index)
                                if (validateGroup)
                                    for (var i = 0; i < validateGroup.validators.length; i++) {
                                        validateGroup.validators[i]._dispose();
                                        i--
                                    }
                        })
                    },
                    createValidator: function(parameters, $container) {
                        var that = this,
                            editingController = that._editingController,
                            column = parameters.column,
                            editData,
                            editIndex = editingController.getIndexByKey(parameters.key, editingController._editData),
                            defaultValidationResult = function(options) {
                                if (options.brokenRule) {
                                    options.brokenRule.columnIndex = column.index;
                                    options.brokenRule.column = column
                                }
                                if ($container && !that.getDisableApplyValidationResults()) {
                                    !options.isValid && editingController.createHighlightCell($container, true);
                                    $container.toggleClass(DATAGRID_INVALIDATE_CLASS, !options.isValid)
                                }
                            };
                        if (editIndex < 0 && column.showEditorAlways)
                            editIndex = editingController._addEditData({key: parameters.key});
                        if (editIndex >= 0) {
                            editData = editingController._editData[editIndex];
                            return new DX.ui.dxValidator($container || {}, {
                                    name: column.caption,
                                    validationRules: $.extend(true, [], column.validationRules),
                                    validationGroup: editData,
                                    adapter: {
                                        getValue: function() {
                                            return parameters.value
                                        },
                                        applyValidationResults: defaultValidationResult
                                    }
                                })
                        }
                    },
                    setDisableApplyValidationResults: function(flag) {
                        this._disableApplyValidationResults = flag
                    },
                    getDisableApplyValidationResults: function() {
                        return this._disableApplyValidationResults
                    }
                }
        }());
        dataGrid.registerModule('validating', {
            defaultOptions: function() {
                return {}
            },
            controllers: {validating: dataGrid.ValidatingController},
            extenders: {
                controllers: {
                    data: {reload: function() {
                            var d = this.callBase(),
                                editingController = this.getController("editing");
                            return d.done(function() {
                                    editingController.resetRowAndPageIndeces(true)
                                })
                        }},
                    editing: {
                        _addEditData: function(options) {
                            var that = this,
                                validatingController = that.getController("validating"),
                                editDataIndex = that.getIndexByKey(options.key, that._editData),
                                editData;
                            if (editDataIndex >= 0) {
                                editData = that._editData[editDataIndex];
                                validatingController.updateEditData(editData)
                            }
                            return that.callBase(options)
                        },
                        _updateRowAndPageIndeces: function() {
                            var that = this,
                                startInsertIndex = that.getView('rowsView').getTopVisibleItemIndex(),
                                rowIndex = startInsertIndex;
                            $.each(that._editData, function(_, editData) {
                                if (!editData.isValid && editData.pageIndex !== that._pageIndex) {
                                    editData.pageIndex = that._pageIndex;
                                    if (editData.type === "insert")
                                        editData.rowIndex = startInsertIndex;
                                    else
                                        editData.rowIndex = rowIndex;
                                    rowIndex++
                                }
                            })
                        },
                        resetRowAndPageIndeces: function(alwaysRest) {
                            var that = this;
                            $.each(that._editData, function(_, editData) {
                                if (editData.pageIndex !== that._pageIndex || alwaysRest) {
                                    delete editData.pageIndex;
                                    delete editData.rowIndex
                                }
                            })
                        },
                        init: function() {
                            var that = this;
                            that.callBase();
                            that.getController("data").changed.add(function(change) {
                                if (that.option("scrolling.mode") === "standard")
                                    that.resetRowAndPageIndeces();
                                $.each(that._editData, function(_, editData) {
                                    if (change && change.changeType === 'prepend')
                                        editData.rowIndex += change.items.length
                                })
                            })
                        },
                        processItems: function(items, changeType) {
                            var that = this,
                                dataController = that.getController("data"),
                                i,
                                editData = that._editData,
                                itemsCount = items.length,
                                insertCount = 0,
                                getIndexByEditData = function(editData, items) {
                                    var index = -1,
                                        isInsert = editData.type === "insert",
                                        key = editData.key;
                                    $.each(items, function(i, item) {
                                        if (dataGrid.equalKeys(key, isInsert ? item : dataController.keyOf(item))) {
                                            index = i;
                                            return false
                                        }
                                    });
                                    return index
                                },
                                addInValidItem = function(editData) {
                                    var data = {key: editData.key},
                                        index = getIndexByEditData(editData, items),
                                        rowIndex;
                                    if (index >= 0 && that.option("scrolling.mode") === "standard")
                                        return;
                                    editData.rowIndex = editData.rowIndex > itemsCount ? editData.rowIndex % itemsCount : editData.rowIndex;
                                    rowIndex = editData.rowIndex;
                                    data[DATAGRID_INSERT_INDEX] = 1;
                                    if (index >= 0) {
                                        items.splice(index, 1);
                                        rowIndex -= insertCount
                                    }
                                    items.splice(rowIndex, 0, data);
                                    insertCount++
                                };
                            that.update();
                            if (that.getEditMode() === DATAGRID_EDIT_MODE_BATCH && changeType !== "prepend" && changeType !== "append")
                                for (i = 0; i < editData.length; i++)
                                    if (editData[i].type && editData[i].pageIndex === that._pageIndex && editData[i].key.pageIndex !== that._pageIndex)
                                        addInValidItem(editData[i]);
                            return that.callBase(items, changeType)
                        },
                        processDataItem: function(item, columns, generateDataValues) {
                            var that = this,
                                editIndex,
                                editData,
                                isInserted = item.data[DATAGRID_INSERT_INDEX],
                                key = isInserted ? item.data.key : item.key,
                                editMode = that.getEditMode();
                            if (editMode === DATAGRID_EDIT_MODE_BATCH && isInserted && key) {
                                editIndex = dataGrid.getIndexByKey(key, that._editData);
                                if (editIndex >= 0) {
                                    editData = that._editData[editIndex];
                                    if (editData.type !== "insert") {
                                        item.data = $.extend(true, {}, editData.oldData, editData.data);
                                        item.key = key
                                    }
                                }
                            }
                            that.callBase.apply(that, arguments)
                        },
                        saveEditData: function() {
                            this._updateRowAndPageIndeces();
                            this.callBase()
                        },
                        _afterInsertRow: function(options) {
                            var validatingController = this.getController("validating"),
                                hiddenColumns = this.getController("columns").getHiddenColumns();
                            $.each(hiddenColumns, function(_, column) {
                                if (utils.isArray(column.validationRules))
                                    validatingController.createValidator({
                                        column: column,
                                        key: options.key,
                                        value: options.data[column.dataField]
                                    })
                            });
                            this.callBase(options)
                        },
                        _beforeSaveEditData: function(editData, editIndex) {
                            var that = this,
                                isValid,
                                isFullValid,
                                result = that.callBase.apply(that, arguments),
                                validatingController = that.getController("validating");
                            if (editData) {
                                editData.isValid === undefined && validatingController.updateEditData(editData);
                                isValid = editData.type === "remove" || editData.isValid;
                                if (isValid)
                                    validatingController.removeValidators(editIndex);
                                else if (utils.isDefined(that._hasInvalidRules))
                                    that._hasInvalidRules = true;
                                result = result || !isValid
                            }
                            else if (that.getEditMode() === DATAGRID_EDIT_MODE_CELL) {
                                isValid = validatingController.validate();
                                isFullValid = validatingController.validate(true);
                                if (isValid && that._hasInvalidRules) {
                                    that.cancelEditData();
                                    that._hasInvalidRules = false;
                                    result = true
                                }
                                else if (!isFullValid) {
                                    that._hasInvalidRules = true;
                                    result = true
                                }
                            }
                            return result
                        },
                        _afterSaveEditData: function() {
                            this.getController("validating").validate(true)
                        },
                        _beforeCancelEditData: function() {
                            var validatingController = this.getController("validating");
                            validatingController.removeValidators();
                            this.callBase()
                        },
                        createHighlightCell: function($cell, skipValidation) {
                            var isValid = true,
                                validator;
                            if (!skipValidation) {
                                validator = $cell.data("dxValidator");
                                if (validator)
                                    isValid = validator.validate().isValid
                            }
                            if (isValid)
                                this.callBase($cell)
                        },
                        updateFieldValue: function(options, value, skipInvalidRules) {
                            var that = this,
                                editMode = that.getEditMode();
                            that.callBase.apply(that, arguments);
                            if (!skipInvalidRules)
                                that._hasInvalidRules = false
                        }
                    },
                    editorFactory: {
                        loseFocus: function(skipValidator) {
                            if (!skipValidator)
                                this.getController('validating').setValidator(null);
                            this.callBase()
                        },
                        focus: function($element) {
                            var that = this,
                                hideBorder = false,
                                rowsView = that.getView("rowsView"),
                                $tdElement = $element && $element.closest("td"),
                                validator = $tdElement && $tdElement.data("dxValidator"),
                                validatingController = that.getController('validating'),
                                $tooltip = $tdElement && $tdElement.closest(".dx-datagrid-rowsview").find(".dx-tooltip"),
                                column = $tdElement && that.getController("columns").getVisibleColumns()[$tdElement.index()];
                            $tooltip && $tooltip.remove();
                            if (validator) {
                                var value = validator.option("adapter").getValue();
                                validatingController.setValidator(validator);
                                if (value !== undefined) {
                                    var validationResult = validator.validate();
                                    if (!validationResult.isValid) {
                                        var alignment = column.alignment;
                                        hideBorder = true;
                                        $("<div/>").addClass(DATAGRID_INVALID_MESSAGE_CLASS).addClass(DATAGRID_INVALID_MESSAGE_ALWAYS_CLASS).text(validationResult.brokenRule.message).appendTo($tdElement).dxTooltip({
                                            target: $tdElement,
                                            container: $tdElement,
                                            visible: true,
                                            closeOnOutsideClick: false,
                                            closeOnTargetScroll: false,
                                            arrowPosition: {
                                                offset: alignment === "left" ? "5 0" : "-5 0",
                                                my: "bottom " + alignment,
                                                at: "top " + alignment
                                            },
                                            position: {
                                                collision: "fit flip",
                                                boundary: rowsView.element(),
                                                boundaryOffset: "0 0",
                                                offset: "0 -9",
                                                my: "top " + alignment,
                                                at: "bottom " + alignment
                                            },
                                            onPositioned: function() {
                                                rowsView.element() && rowsView.updateFreeSpaceRowHeight()
                                            }
                                        })
                                    }
                                }
                            }
                            !hideBorder && rowsView.element() && rowsView.updateFreeSpaceRowHeight();
                            return that.callBase($element, hideBorder)
                        }
                    }
                },
                views: {rowsView: {
                        updateFreeSpaceRowHeight: function() {
                            var that = this,
                                $rowElements = that._getRowElements(),
                                $freeSpaceRowElement = that._getFreeSpaceRowElement(),
                                $tooltipContent = that.element().find(".dx-invalid-message .dx-overlay-content");
                            that.callBase();
                            if ($tooltipContent.length && $freeSpaceRowElement && $rowElements.length === 1 && (!$freeSpaceRowElement.is(":visible") || $tooltipContent.outerHeight() > $freeSpaceRowElement.outerHeight())) {
                                $freeSpaceRowElement.show();
                                $freeSpaceRowElement.height($tooltipContent.outerHeight())
                            }
                        },
                        _cellPrepared: function($cell, parameters) {
                            var validatingController = this.getController("validating"),
                                column = parameters.column;
                            if (utils.isArray(column.validationRules))
                                validatingController.createValidator(parameters, $cell);
                            this.callBase.apply(this, arguments)
                        }
                    }}
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.dataController.js */
    (function($, DX, undefined) {
        var ui = DX.ui,
            dataGrid = ui.dxDataGrid,
            utils = DX.utils;
        dataGrid.proxyMethod = function(instance, methodName, defaultResult) {
            if (!instance[methodName])
                instance[methodName] = function() {
                    var dataSource = this._dataSource;
                    return dataSource ? dataSource[methodName].apply(dataSource, arguments) : defaultResult
                }
        };
        dataGrid.DataController = dataGrid.Controller.inherit({}).include(ui.DataHelperMixin).inherit(function() {
            var members = {
                    init: function() {
                        var that = this;
                        that._items = [];
                        that._columnsController = that.getController('columns');
                        that._columnsChangedHandler = $.proxy(that._handleColumnsChanged, that);
                        that._dataChangedHandler = $.proxy(that._handleDataChanged, that);
                        that._loadingChangedHandler = $.proxy(that._handleLoadingChanged, that);
                        that._loadErrorHandler = $.proxy(that._handleLoadError, that);
                        that._customizeStoreLoadOptionsHandler = $.proxy(that._handleCustomizeStoreLoadOptions, that);
                        that._columnsController.columnsChanged.add(that._columnsChangedHandler);
                        that._isLoading = false;
                        that._isCustomLoading = false;
                        that._refreshDataSource();
                        that.createAction('onDataErrorOccurred');
                        that.dataErrorOccurred.add(function(error) {
                            return that.executeAction('onDataErrorOccurred', {error: error})
                        })
                    },
                    callbackNames: function() {
                        return ['changed', 'loadingChanged', 'dataErrorOccurred', 'pageIndexChanged', 'pageSizeChanged', 'filterChanged', 'dataSourceChanged']
                    },
                    callbackFlags: function(name) {
                        if (name === 'dataErrorOccurred')
                            return 'stopOnFalse'
                    },
                    publicMethods: function() {
                        return ['beginCustomLoading', 'endCustomLoading', 'refresh', 'filter', 'clearFilter', 'combinedFilter', 'keyOf', 'byKey', 'getDataByKeys', 'pageIndex', 'pageSize', 'pageCount', 'totalCount', '_disposeDataSource', 'getKeyByRowIndex', 'getRowIndexByKey']
                    },
                    optionChanged: function(args) {
                        var that = this;
                        switch (args.name) {
                            case'loadingTimeout':
                            case'remoteOperations':
                                args.handled = true;
                                break;
                            case'dataSource':
                            case'scrolling':
                            case'paging':
                                args.handled = true;
                            case'rtlEnabled':
                                that._columnsController.reset();
                                that._refreshDataSource();
                                break;
                            default:
                                that.callBase(args)
                        }
                    },
                    isReady: function() {
                        return !this._isLoading
                    },
                    _combineFilters: function(filters, operation) {
                        var resultFilter = [],
                            i;
                        operation = operation || 'and';
                        for (i = 0; i < filters.length; i++) {
                            if (!filters[i])
                                continue;
                            if (resultFilter.length)
                                resultFilter.push(operation);
                            resultFilter.push(filters[i])
                        }
                        if (resultFilter.length === 1)
                            resultFilter = resultFilter[0];
                        if (resultFilter.length)
                            return resultFilter
                    },
                    combinedFilter: function(filter) {
                        var that = this,
                            dataSource = that._dataSource,
                            columnsController = that._columnsController,
                            additionalFilter;
                        if (dataSource) {
                            if (filter === undefined)
                                filter = dataSource.filter();
                            additionalFilter = that._calculateAdditionalFilter();
                            if (additionalFilter)
                                if (columnsController.isDataSourceApplied() || columnsController.isAllDataTypesDefined())
                                    filter = that._combineFilters([additionalFilter, filter]);
                            columnsController.updateFilter(dataSource, filter)
                        }
                        return filter
                    },
                    _handleCustomizeStoreLoadOptions: function(e) {
                        var columnsController = this._columnsController,
                            dataSource = this._dataSource,
                            storeLoadOptions = e.storeLoadOptions;
                        storeLoadOptions.filter = this.combinedFilter(storeLoadOptions.filter);
                        if (!columnsController.isDataSourceApplied())
                            columnsController.updateColumnDataTypes(dataSource);
                        this._columnsUpdating = true;
                        columnsController.updateSortingGrouping(dataSource, !this._isFirstLoading);
                        this._columnsUpdating = false;
                        storeLoadOptions.sort = columnsController.getSortDataSourceParameters();
                        storeLoadOptions.group = columnsController.getGroupDataSourceParameters();
                        dataSource.sort(storeLoadOptions.sort);
                        dataSource.group(storeLoadOptions.group);
                        this._isFirstLoading = false
                    },
                    _handleColumnsChanged: function(e) {
                        var that = this,
                            changeTypes = e.changeTypes,
                            optionNames = e.optionNames,
                            filterValue;
                        var updateItemsHandler = function() {
                                that._columnsController.columnsChanged.remove(updateItemsHandler);
                                that.updateItems()
                            };
                        if (changeTypes.sorting || changeTypes.grouping) {
                            if (that._dataSource && !that._columnsUpdating) {
                                that._dataSource.group(that._columnsController.getGroupDataSourceParameters());
                                that._dataSource.sort(that._columnsController.getSortDataSourceParameters());
                                that.reload()
                            }
                        }
                        else if (changeTypes.columns) {
                            if (optionNames.filterValue || optionNames.selectedFilterOperation)
                                if (this.option("filterRow.applyFilter") !== "onClick") {
                                    filterValue = that._columnsController.columnOption(e.columnIndex, 'filterValue');
                                    if (e.columnIndex === undefined || utils.isDefined(filterValue) || !optionNames.selectedFilterOperation || optionNames.filterValue)
                                        that._applyFilter()
                                }
                            if (!that._needApplyFilter && !dataGrid.checkChanges(optionNames, ['width', 'visibleWidth', 'filterValue', 'selectedFilterOperation']))
                                that._columnsController.columnsChanged.add(updateItemsHandler)
                        }
                    },
                    _handleDataChanged: function(e) {
                        var that = this,
                            dataSource = that._dataSource,
                            columnsController = that._columnsController,
                            isAllDataTypesDefined = columnsController.isAllDataTypesDefined();
                        if (dataSource && !that._isDataSourceApplying) {
                            that._isDataSourceApplying = true;
                            $.when(that._columnsController.applyDataSource(dataSource)).done(function() {
                                if (that._isLoading)
                                    that._handleLoadingChanged(false);
                                that._isDataSourceApplying = false;
                                var additionalFilter = that._calculateAdditionalFilter(),
                                    needApplyFilter = that._needApplyFilter;
                                that._needApplyFilter = false;
                                if (needApplyFilter && additionalFilter && additionalFilter.length && !isAllDataTypesDefined) {
                                    DX.log("W1005", that.component.NAME);
                                    that._applyFilter()
                                }
                                else
                                    that.updateItems(e)
                            });
                            if (that._isDataSourceApplying)
                                that._handleLoadingChanged(true);
                            that._needApplyFilter = !that._columnsController.isDataSourceApplied()
                        }
                    },
                    _handleLoadingChanged: function(isLoading) {
                        this._isLoading = isLoading;
                        this._fireLoadingChanged()
                    },
                    _handleLoadError: function(e) {
                        this.dataErrorOccurred.fire(e)
                    },
                    _dataSourceOptions: function() {
                        return {_preferSync: true}
                    },
                    _initDataSource: function() {
                        var that = this,
                            columnsController = that._columnsController,
                            sort,
                            group,
                            dataSource = this.option("dataSource"),
                            pageIndex = this.option("paging.pageIndex"),
                            pageSize = this.option("paging.pageSize"),
                            scrollingMode = that.option('scrolling.mode'),
                            pagingEnabled = this.option("paging.enabled"),
                            appendMode = scrollingMode === 'infinite',
                            virtualMode = scrollingMode === 'virtual',
                            oldDataSource = this._dataSource;
                        that.callBase();
                        dataSource = that._dataSource;
                        that._dataSource = oldDataSource;
                        that._isFirstLoading = true;
                        if (dataSource) {
                            dataSource.requireTotalCount(!appendMode);
                            if (pagingEnabled !== undefined)
                                dataSource.paginate(pagingEnabled || virtualMode || appendMode);
                            if (pageSize !== undefined)
                                dataSource.pageSize(pageSize);
                            if (pageIndex !== undefined)
                                dataSource.pageIndex(pageIndex);
                            that.setDataSource(dataSource)
                        }
                    },
                    _loadDataSource: function() {
                        var dataSource = this._dataSource;
                        dataSource && dataSource.load()
                    },
                    _processItems: function(items, changeType) {
                        var that = this,
                            visibleColumns = that._columnsController.getVisibleColumns(),
                            options = {
                                visibleColumns: visibleColumns,
                                dataIndex: 0
                            },
                            result = [];
                        $.each(items, function(index, item) {
                            if (utils.isDefined(item)) {
                                item = that._processItem(item, options);
                                result.push(item)
                            }
                        });
                        return result
                    },
                    _processItem: function(item, options) {
                        item = this._generateDataItem(item);
                        item = this._processDataItem(item, options);
                        item.dataIndex = options.dataIndex++;
                        return item
                    },
                    _generateDataItem: function(data) {
                        return {
                                rowType: 'data',
                                data: data,
                                key: this.keyOf(data)
                            }
                    },
                    _processDataItem: function(dataItem, options) {
                        dataItem.values = this._generateDataValues(dataItem.data, options.visibleColumns);
                        return dataItem
                    },
                    _generateDataValues: function(data, columns) {
                        var values = [];
                        $.each(columns, function() {
                            var value = null;
                            if (this.command)
                                value = null;
                            else if (this.calculateCellValue)
                                value = this.calculateCellValue(data);
                            else if (this.dataField)
                                value = data[this.dataField];
                            values.push(value)
                        });
                        return values
                    },
                    _updateItemsCore: function(change) {
                        var that = this,
                            items,
                            dataSource = that._dataSource,
                            changes = [],
                            changeType = change.changeType;
                        if (dataSource) {
                            items = change.items || dataSource.items();
                            items = that._processItems(items.slice(0), changeType);
                            change.items = items;
                            change.changeType = changeType || 'refresh';
                            switch (changeType) {
                                case'prepend':
                                    that._items.unshift.apply(that._items, items);
                                    break;
                                case'append':
                                    that._items.push.apply(that._items, items);
                                    break;
                                case'update':
                                    var rowIndices = change.rowIndices.slice(0),
                                        rowIndexCorrection = 0,
                                        i;
                                    rowIndices.sort(function(a, b) {
                                        return a - b
                                    });
                                    for (var i = 0; i < rowIndices.length; i++)
                                        if (rowIndices[i] < 0 || rowIndices[i - 1] === rowIndices[i]) {
                                            rowIndices.splice(i, 1);
                                            i--
                                        }
                                    change.items = [];
                                    change.rowIndices = [];
                                    change.changeTypes = [];
                                    var equalItems = function(item1, item2) {
                                            return dataGrid.equalKeys(item1.key, item2.key) && item1.rowType === item2.rowType
                                        };
                                    $.each(rowIndices, function(index, rowIndex) {
                                        var oldItem,
                                            newItem,
                                            oldNextItem,
                                            newNextItem;
                                        rowIndex += rowIndexCorrection;
                                        change.rowIndices.push(rowIndex);
                                        oldItem = that._items[rowIndex];
                                        oldNextItem = that._items[rowIndex + 1];
                                        newItem = items[rowIndex];
                                        newNextItem = items[rowIndex + 1];
                                        if (newItem)
                                            change.items.push(newItem);
                                        if (oldItem && newItem && equalItems(oldItem, newItem)) {
                                            changeType = 'update';
                                            that._items[rowIndex] = newItem;
                                            if (oldItem.visible !== newItem.visible)
                                                change.items.splice(-1, 1, {visible: newItem.visible})
                                        }
                                        else if (newItem && !oldItem || newNextItem && equalItems(oldItem, newNextItem)) {
                                            changeType = 'insert';
                                            that._items.splice(rowIndex, 0, newItem);
                                            rowIndexCorrection++
                                        }
                                        else if (oldItem && !newItem || oldNextItem && equalItems(newItem, oldNextItem)) {
                                            changeType = 'remove';
                                            that._items.splice(rowIndex, 1);
                                            rowIndexCorrection--
                                        }
                                        change.changeTypes.push(changeType)
                                    });
                                    break;
                                default:
                                    that._items = items.slice(0);
                                    break
                            }
                            $.each(that._items, function(index, item) {
                                item.rowIndex = index
                            })
                        }
                    },
                    updateItems: function(change) {
                        var that = this;
                        change = change || {};
                        if (that._dataSource && that._columnsController.isDataSourceApplied()) {
                            that._updateItemsCore(change);
                            that.changed.fire(change)
                        }
                    },
                    isLoading: function() {
                        return this._isLoading || this._isCustomLoading
                    },
                    _fireLoadingChanged: function(messageText) {
                        this.loadingChanged.fire(this.isLoading(), messageText)
                    },
                    _calculateAdditionalFilter: function() {
                        return null
                    },
                    _applyFilter: function() {
                        var that = this,
                            dataSource = that._dataSource;
                        if (dataSource) {
                            dataSource.pageIndex(0);
                            return that.reload().done($.proxy(that.filterChanged, 'fire'))
                        }
                    },
                    filter: function(filterExpr) {
                        var dataSource = this._dataSource;
                        if (arguments.length === 0)
                            return dataSource ? dataSource.filter() : undefined;
                        filterExpr = arguments.length > 1 ? Array.prototype.slice.call(arguments, 0) : filterExpr;
                        if (dataSource)
                            dataSource.filter(filterExpr);
                        this._applyFilter()
                    },
                    clearFilter: function() {
                        this.filter(null)
                    },
                    _fireDataSourceChanged: function() {
                        var that = this;
                        var changedHandler = function() {
                                that.changed.remove(changedHandler);
                                that.dataSourceChanged.fire()
                            };
                        that.changed.add(changedHandler)
                    },
                    _getDataSourceAdapterType: function(remoteOperations) {
                        return remoteOperations && remoteOperations.filtering && remoteOperations.sorting && remoteOperations.paging ? dataGrid.DataSourceAdapterServer : dataGrid.DataSourceAdapterClient
                    },
                    _createDataSourceAdapterCore: function(dataSource, remoteOperations) {
                        var dataSourceAdapterType,
                            dataSourceAdapter;
                        if (remoteOperations === 'auto')
                            remoteOperations = !(dataSource.store() instanceof DX.data.ArrayStore);
                        if (remoteOperations === true)
                            remoteOperations = {
                                filtering: true,
                                sorting: true,
                                paging: true
                            };
                        dataSourceAdapterType = this._getDataSourceAdapterType(remoteOperations);
                        dataSourceAdapter = new dataSourceAdapterType(this.component);
                        dataSourceAdapter.init(dataSource, remoteOperations);
                        return dataSourceAdapter
                    },
                    _createDataSourceAdapter: function(dataSource) {
                        var remoteOperations = this.option("remoteOperations");
                        return this._createDataSourceAdapterCore(dataSource, remoteOperations)
                    },
                    setDataSource: function(dataSource) {
                        var that = this;
                        if (that._dataSource) {
                            that._dataSource.changed.remove(that._dataChangedHandler);
                            that._dataSource.loadingChanged.remove(that._loadingChangedHandler);
                            that._dataSource.loadError.remove(that._loadErrorHandler);
                            that._dataSource.customizeStoreLoadOptions.remove(that._customizeStoreLoadOptionsHandler);
                            that._dataSource.dispose(that._isSharedDataSource)
                        }
                        if (dataSource)
                            dataSource = that._createDataSourceAdapter(dataSource);
                        that._dataSource = dataSource;
                        if (dataSource) {
                            that._fireDataSourceChanged();
                            that._isLoading = !dataSource.isLoaded();
                            that._needApplyFilter = true;
                            dataSource.changed.add(that._dataChangedHandler);
                            dataSource.loadingChanged.add(that._loadingChangedHandler);
                            dataSource.loadError.add(that._loadErrorHandler);
                            dataSource.customizeStoreLoadOptions.add(that._customizeStoreLoadOptionsHandler)
                        }
                    },
                    items: function() {
                        return this._items
                    },
                    pageCount: function() {
                        return this._dataSource ? this._dataSource.pageCount() : 1
                    },
                    dataSource: function() {
                        return this._dataSource
                    },
                    store: function() {
                        var dataSource = this._dataSource;
                        return dataSource && dataSource.store()
                    },
                    getKeyByRowIndex: function(rowIndex) {
                        var item = this.items()[rowIndex];
                        if (item)
                            return item.key
                    },
                    getRowIndexByKey: function(key) {
                        return dataGrid.getIndexByKey(key, this.items())
                    },
                    keyOf: function(data) {
                        var store = this.store();
                        if (store)
                            return store.keyOf(data)
                    },
                    byKey: function(key) {
                        var store = this.store(),
                            rowIndex = this.getRowIndexByKey(key),
                            result;
                        if (!store)
                            return;
                        if (rowIndex >= 0)
                            result = $.Deferred().resolve(this.items()[rowIndex].data);
                        return result || store.byKey(key)
                    },
                    getDataByKeys: function(rowKeys) {
                        var that = this,
                            result = $.Deferred(),
                            deferreds = [],
                            data = [];
                        $.each(rowKeys, function(index, key) {
                            deferreds.push(that.byKey(key).done(function(keyData) {
                                data[index] = keyData
                            }))
                        });
                        $.when.apply($, deferreds).always(function() {
                            result.resolve(data)
                        });
                        return result
                    },
                    pageIndex: function(value) {
                        var that = this,
                            dataSource = that._dataSource;
                        if (dataSource) {
                            if (value !== undefined)
                                if (dataSource.pageIndex() !== value) {
                                    dataSource.pageIndex(value);
                                    return dataSource.load().done($.proxy(that.pageIndexChanged, 'fire'))
                                }
                            return dataSource.pageIndex()
                        }
                        return 0
                    },
                    pageSize: function(value) {
                        var that = this,
                            pagingOptions = that.option("paging"),
                            dataSource = that._dataSource;
                        if (value === undefined)
                            return dataSource ? dataSource.pageSize() : 0;
                        if (dataSource) {
                            dataSource.pageIndex(0);
                            dataSource.pageSize(value);
                            if (pagingOptions)
                                pagingOptions.pageSize = value;
                            return dataSource.reload().done($.proxy(that.pageSizeChanged, 'fire'))
                        }
                    },
                    beginCustomLoading: function(messageText) {
                        this._isCustomLoading = true;
                        this._fireLoadingChanged(messageText)
                    },
                    endCustomLoading: function() {
                        this._isCustomLoading = false;
                        this._fireLoadingChanged()
                    },
                    refresh: function() {
                        var that = this,
                            d = $.Deferred();
                        $.when(this._columnsController.refresh()).always(function() {
                            $.when(that.reload()).done(d.resolve).fail(d.reject)
                        });
                        return d
                    },
                    _disposeDataSource: function() {
                        this.setDataSource(null)
                    }
                };
            dataGrid.proxyMethod(members, 'load');
            dataGrid.proxyMethod(members, 'reload');
            dataGrid.proxyMethod(members, 'itemsCount', 0);
            dataGrid.proxyMethod(members, 'totalItemsCount', 0);
            dataGrid.proxyMethod(members, 'hasKnownLastPage', true);
            dataGrid.proxyMethod(members, 'isLoaded', false);
            dataGrid.proxyMethod(members, 'totalCount', 0);
            return members
        }());
        dataGrid.registerModule('data', {
            defaultOptions: function() {
                return {
                        loadingTimeout: 0,
                        dataSource: null,
                        onDataErrorOccurred: null,
                        remoteOperations: 'auto'
                    }
            },
            controllers: {data: ui.dxDataGrid.DataController}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.dataSourceAdapter.js */
    (function($, DX) {
        var ui = DX.ui,
            dataGrid = ui.dxDataGrid,
            utils = DX.utils;
        dataGrid.DataSourceAdapterServer = dataGrid.Controller.inherit(function() {
            return {
                    init: function(dataSource, remoteOperations) {
                        var that = this;
                        that._dataSource = dataSource;
                        that._remoteOperations = remoteOperations;
                        that._isLastPage = !dataSource.isLastPage();
                        that._hasLastPage = false;
                        that._currentTotalCount = 0;
                        that.changed = $.Callbacks();
                        that.loadingChanged = $.Callbacks();
                        that.loadError = $.Callbacks();
                        that.customizeStoreLoadOptions = $.Callbacks();
                        that._dataChangedHandler = $.proxy(that._handleDataChanged, that);
                        that._dataLoadingHandler = $.proxy(that._handleDataLoading, that);
                        that._dataLoadedHandler = $.proxy(that._handleDataLoaded, that);
                        that._loadingChangedHandler = $.proxy(that._handleLoadingChanged, that);
                        that._loadErrorHandler = $.proxy(that._handleLoadError, that);
                        dataSource.on("changed", that._dataChangedHandler);
                        dataSource.on("customizeStoreLoadOptions", that._dataLoadingHandler);
                        dataSource.on("customizeLoadResult", that._dataLoadedHandler);
                        dataSource.on("loadingChanged", that._loadingChangedHandler);
                        dataSource.on("loadError", that._loadErrorHandler);
                        $.each(dataSource, function(memberName, member) {
                            if (!that[memberName] && $.isFunction(member))
                                that[memberName] = function() {
                                    return this._dataSource[memberName].apply(this._dataSource, arguments)
                                }
                        })
                    },
                    dispose: function(isSharedDataSource) {
                        var that = this,
                            dataSource = that._dataSource;
                        dataSource.off("changed", that._dataChangedHandler);
                        dataSource.off("customizeStoreLoadOptions", that._dataLoadingHandler);
                        dataSource.off("customizeLoadResult", that._dataLoadedHandler);
                        dataSource.off("loadingChanged", that._loadingChangedHandler);
                        dataSource.off("loadError", that._loadErrorHandler);
                        if (!isSharedDataSource)
                            dataSource.dispose()
                    },
                    refresh: function(storeLoadOptions, isReload) {
                        var that = this,
                            dataSource = that._dataSource;
                        if (isReload) {
                            that._currentTotalCount = 0;
                            that._isLastPage = !dataSource.paginate();
                            that._hasLastPage = that._isLastPage
                        }
                    },
                    _handleDataLoading: function(options) {
                        var that = this;
                        that.customizeStoreLoadOptions.fire(options);
                        options.delay = this.option("loadingTimeout");
                        options.originalStoreLoadOptions = options.storeLoadOptions;
                        var isReload = !that.isLoaded() && !that._isRefreshing;
                        that._isRefreshing = true;
                        $.when(that.refresh(options.storeLoadOptions, isReload)).always(function() {
                            if (that._lastOperationId === options.operationId)
                                that.load();
                            that._isRefreshing = false
                        });
                        that._dataSource.cancel(that._lastOperationId);
                        that._lastOperationId = options.operationId;
                        if (that._isRefreshing)
                            that._dataSource.cancel(that._lastOperationId)
                    },
                    _handleDataLoaded: function(options) {
                        options.storeLoadOptions = options.originalStoreLoadOptions
                    },
                    _handleLoadingChanged: function(isLoading) {
                        this.loadingChanged.fire(isLoading)
                    },
                    _handleLoadError: function(error) {
                        this.changed.fire({
                            changeType: 'loadError',
                            error: error
                        });
                        this.loadError.fire(error)
                    },
                    _handleDataChanged: function(args) {
                        var that = this,
                            currentTotalCount,
                            dataSource = that._dataSource,
                            itemsCount = that.itemsCount();
                        that._isLastPage = !itemsCount || !that.pageSize() || itemsCount < that.pageSize();
                        if (that._isLastPage)
                            that._hasLastPage = true;
                        if (dataSource.totalCount() >= 0) {
                            if (dataSource.pageIndex() >= that.pageCount()) {
                                dataSource.pageIndex(that.pageCount() - 1);
                                dataSource.load()
                            }
                        }
                        else {
                            currentTotalCount = dataSource.pageIndex() * that.pageSize() + itemsCount;
                            that._currentTotalCount = Math.max(that._currentTotalCount, currentTotalCount);
                            if (itemsCount === 0 && dataSource.pageIndex() >= that.pageCount()) {
                                dataSource.pageIndex(that.pageCount() - 1);
                                dataSource.load()
                            }
                        }
                        if (!dataSource.isLoading())
                            this.changed.fire(args)
                    },
                    isLastPage: function() {
                        return this._isLastPage
                    },
                    totalCount: function() {
                        return parseInt(this._currentTotalCount || this._dataSource.totalCount())
                    },
                    itemsCount: function() {
                        return this._dataSource.items().length
                    },
                    totalItemsCount: function() {
                        return this.totalCount()
                    },
                    pageSize: function() {
                        var dataSource = this._dataSource;
                        if (!arguments.length && !dataSource.paginate())
                            return 0;
                        return dataSource.pageSize.apply(dataSource, arguments)
                    },
                    pageCount: function() {
                        var that = this,
                            count = that.totalItemsCount(),
                            pageSize = that.pageSize();
                        if (pageSize && count > 0)
                            return Math.max(1, Math.ceil(count / pageSize));
                        return 1
                    },
                    hasKnownLastPage: function() {
                        return this._hasLastPage || this._dataSource.totalCount() >= 0
                    }
                }
        }());
        dataGrid.DataSourceAdapterClient = dataGrid.DataSourceAdapterServer.inherit({
            _handleDataLoading: function(options) {
                this.callBase(options);
                var remoteOperations = this._remoteOperations || {},
                    loadOptions = options.loadOptions = options.storeLoadOptions;
                options.storeLoadOptions = {userData: loadOptions.userData};
                if (remoteOperations.filtering) {
                    options.storeLoadOptions.filter = loadOptions.filter;
                    delete loadOptions.filter
                }
                if (remoteOperations.sorting) {
                    options.storeLoadOptions.sort = loadOptions.sort;
                    delete loadOptions.sort
                }
                this._handleDataLoadingCore(options)
            },
            _handleDataLoadingCore: function(){},
            _handleDataLoaded: function(options) {
                var callBase = this.callBase,
                    loadOptions = options.loadOptions;
                if (!loadOptions) {
                    this._dataSource.cancel(options.operationId);
                    return
                }
                options.skip = loadOptions.skip;
                options.take = loadOptions.take;
                delete loadOptions.skip;
                delete loadOptions.take;
                new DX.data.ArrayStore(options.data).load(loadOptions).done(function(data) {
                    options.data = data;
                    if (loadOptions.requireTotalCount)
                        options.extra = options.extra || {totalCount: data.length}
                });
                this._handleDataLoadedCore(options);
                callBase.apply(this, arguments)
            },
            _handleDataLoadedCore: function(options) {
                if (options.skip !== undefined)
                    options.data = options.data.slice(options.skip);
                if (options.take !== undefined)
                    options.data = options.data.slice(0, options.take)
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.groupingModule.js */
    (function($, DX) {
        var ui = DX.ui,
            dataGrid = ui.dxDataGrid,
            events = ui.events,
            utils = DX.utils,
            normalizeSortingInfo = DX.data.utils.normalizeSortingInfo;
        var DATAGRID_GROUP_PANEL_CLASS = "dx-datagrid-group-panel",
            DATAGRID_GROUP_PANEL_MESSAGE_CLASS = "dx-group-panel-message",
            DATAGRID_GROUP_PANEL_ITEM_CLASS = "dx-group-panel-item",
            DATAGRID_HEADERS_ACTION_CLASS = "dx-datagrid-action",
            DATAGRID_GROUP_SPACE_CLASS = "dx-datagrid-group-space",
            DATAGRID_GROUP_OPENED_CLASS = "dx-datagrid-group-opened",
            DATAGRID_GROUP_CLOSED_CLASS = "dx-datagrid-group-closed",
            DATAGRID_EXPAND_CLASS = "dx-datagrid-expand",
            DATAGRID_SELECTION_DISABLED_CLASS = "dx-selection-disabled";
        var GroupingDataSourceAdapterExtender = function() {
                var findGroupInfoByKey = function(groupsInfo, key) {
                        var i;
                        for (i = 0; i < groupsInfo.length; i++)
                            if (DX.data.utils.keysEqual(null, groupsInfo[i].key, key))
                                return groupsInfo[i]
                    };
                var getGroupInfoIndexByOffset = function(groupsInfo, offset) {
                        var index;
                        for (index = 0; index < groupsInfo.length; index++)
                            if (groupsInfo[index].offset > offset)
                                break;
                        return index
                    };
                var updateGroupInfoOffsets = function(groupsInfo) {
                        var groupInfo,
                            index,
                            newIndex;
                        for (index = 0; index < groupsInfo.length; index++) {
                            groupInfo = groupsInfo[index];
                            if (groupInfo.data && groupInfo.data.offset !== groupInfo.offset) {
                                groupsInfo.splice(index, 1);
                                groupInfo.offset = groupInfo.data.offset;
                                newIndex = getGroupInfoIndexByOffset(groupsInfo, groupInfo.offset);
                                groupsInfo.splice(newIndex, 0, groupInfo);
                                if (newIndex > index)
                                    index--
                            }
                        }
                    };
                var cleanGroupsInfo = function(groupsInfo, groupIndex, groupsCount) {
                        var i;
                        for (i = 0; i < groupsInfo.length; i++)
                            if (groupIndex + 1 >= groupsCount)
                                groupsInfo[i].children = [];
                            else
                                cleanGroupsInfo(groupsInfo[i].children, groupIndex + 1, groupsCount)
                    };
                return {
                        init: function() {
                            this.callBase.apply(this, arguments);
                            this.reset()
                        },
                        reset: function() {
                            this._groupsInfo = [];
                            this._totalCountCorrection = 0
                        },
                        totalItemsCount: function() {
                            var that = this,
                                totalCount = that.callBase();
                            return totalCount > 0 && that._dataSource.group() && that._dataSource.requireTotalCount() ? totalCount + that._totalCountCorrection : totalCount
                        },
                        itemsCount: function() {
                            return this._dataSource.group() ? this._itemsCount || 0 : this.callBase()
                        },
                        updateTotalItemsCount: function(totalCountCorrection) {
                            this._totalCountCorrection = totalCountCorrection || 0
                        },
                        _isGroupItemCountable: function(item) {
                            return !this._isVirtualPaging() || !item.isContinuation
                        },
                        _isVirtualPaging: function() {
                            var scrollingMode = this.option("scrolling.mode");
                            return scrollingMode === 'virtual' || scrollingMode === 'infinite'
                        },
                        updateItemsCount: function(data, groupsCount) {
                            function calculateItemsCount(that, items, groupsCount) {
                                var i,
                                    result = 0;
                                if (items)
                                    if (!groupsCount)
                                        result = items.length;
                                    else
                                        for (i = 0; i < items.length; i++) {
                                            if (that._isGroupItemCountable(items[i]))
                                                result++;
                                            result += calculateItemsCount(that, items[i].items, groupsCount - 1)
                                        }
                                return result
                            }
                            this._itemsCount = calculateItemsCount(this, data, groupsCount)
                        },
                        foreachGroups: function(callback, childrenAtFirst, foreachCollapsedGroups) {
                            var that = this;
                            function foreachGroupsCore(groupsInfo, callback, childrenAtFirst, parents) {
                                var i,
                                    callbackResult,
                                    callbackResults = [];
                                function executeCallback(callback, data, parents, callbackResults) {
                                    var callbackResult = data && callback(data, parents);
                                    callbackResults.push(callbackResult);
                                    return callbackResult
                                }
                                for (i = 0; i < groupsInfo.length; i++) {
                                    parents.push(groupsInfo[i].data);
                                    if (!childrenAtFirst && executeCallback(callback, groupsInfo[i].data, parents, callbackResults) === false)
                                        return false;
                                    if (!groupsInfo[i].data || groupsInfo[i].data.isExpanded || foreachCollapsedGroups) {
                                        callbackResult = foreachGroupsCore(groupsInfo[i].children, callback, childrenAtFirst, parents);
                                        callbackResults.push(callbackResult);
                                        if (callbackResult === false)
                                            return false
                                    }
                                    if (childrenAtFirst && executeCallback(callback, groupsInfo[i].data, parents, callbackResults) === false)
                                        return false;
                                    parents.pop()
                                }
                                return $.when.apply($, callbackResults).always(function() {
                                        updateGroupInfoOffsets(groupsInfo)
                                    })
                            }
                            return foreachGroupsCore(that._groupsInfo, callback, childrenAtFirst, [])
                        },
                        findGroupInfo: function(path) {
                            var that = this,
                                i,
                                pathIndex,
                                groupInfo,
                                groupsInfo = that._groupsInfo;
                            for (pathIndex = 0; groupsInfo && pathIndex < path.length; pathIndex++) {
                                groupInfo = findGroupInfoByKey(groupsInfo, path[pathIndex]);
                                groupsInfo = groupInfo && groupInfo.children
                            }
                            return groupInfo && groupInfo.data
                        },
                        addGroupInfo: function(groupInfoData) {
                            var that = this,
                                index,
                                groupInfo,
                                path = groupInfoData.path,
                                pathIndex,
                                groupsInfo = that._groupsInfo;
                            for (pathIndex = 0; pathIndex < path.length; pathIndex++) {
                                groupInfo = findGroupInfoByKey(groupsInfo, path[pathIndex]);
                                if (!groupInfo) {
                                    groupInfo = {
                                        key: path[pathIndex],
                                        offset: groupInfoData.offset,
                                        children: []
                                    };
                                    index = getGroupInfoIndexByOffset(groupsInfo, groupInfoData.offset);
                                    groupsInfo.splice(index, 0, groupInfo)
                                }
                                if (pathIndex === path.length - 1) {
                                    groupInfo.data = groupInfoData;
                                    updateGroupInfoOffsets(groupsInfo)
                                }
                                groupsInfo = groupInfo.children
                            }
                        },
                        allowCollapseAll: function() {
                            return true
                        },
                        isRowExpanded: function(key) {
                            var groupInfo = this.findGroupInfo(key);
                            return groupInfo ? groupInfo.isExpanded : false
                        },
                        collapseAll: function(groupIndex) {
                            if (!this.allowCollapseAll()) {
                                DX.log("E1018");
                                return false
                            }
                            return this._collapseExpandAll(groupIndex, false)
                        },
                        expandAll: function(groupIndex) {
                            return this._collapseExpandAll(groupIndex, true)
                        },
                        _collapseExpandAll: function(groupIndex, isExpand) {
                            var that = this,
                                dataSource = that._dataSource,
                                group = dataSource.group(),
                                groups = normalizeSortingInfo(group || []),
                                i;
                            if (groups.length) {
                                for (i = 0; i < groups.length; i++)
                                    if (groupIndex === undefined || groupIndex === i)
                                        groups[i].isExpanded = isExpand;
                                    else if (group && group[i])
                                        groups[i].isExpanded = group[i].isExpanded;
                                dataSource.group(groups);
                                that.foreachGroups(function(groupInfo, parents) {
                                    if (groupIndex === undefined || groupIndex === parents.length - 1)
                                        groupInfo.isExpanded = isExpand
                                }, false, true)
                            }
                            return true
                        },
                        refresh: function(storeLoadOptions) {
                            this.callBase.apply(this, arguments);
                            var that = this,
                                groupIndex,
                                oldGroups = normalizeSortingInfo(that._group || []),
                                groups = normalizeSortingInfo(storeLoadOptions.group || []),
                                groupsCount = Math.min(oldGroups.length, groups.length);
                            that._group = storeLoadOptions.group;
                            for (groupIndex = 0; groupIndex < groupsCount; groupIndex++)
                                if (oldGroups[groupIndex].selector !== groups[groupIndex].selector) {
                                    groupsCount = groupIndex;
                                    break
                                }
                            if (!groupsCount)
                                that.reset();
                            else
                                cleanGroupsInfo(that._groupsInfo, 0, groupsCount)
                        },
                        changeRowExpand: function(path) {
                            var that = this,
                                dataSource = that._dataSource;
                            if (dataSource.group()) {
                                dataSource._changeLoadingCount(1);
                                return that._changeRowExpandCore(path).always(function() {
                                        dataSource._changeLoadingCount(-1)
                                    })
                            }
                        }
                    }
            }();
        dataGrid.DataSourceAdapterClient = dataGrid.DataSourceAdapterClient.inherit(GroupingDataSourceAdapterExtender);
        dataGrid.DataSourceAdapterServer = dataGrid.DataSourceAdapterServer.inherit(GroupingDataSourceAdapterExtender);
        var GroupingDataControllerExtender = function() {
                return {
                        _processItems: function(items) {
                            var groupColumns = this._columnsController.getGroupColumns();
                            if (items.length && groupColumns.length)
                                items = this._processGroupItems(items, groupColumns.length);
                            return this.callBase(items)
                        },
                        _processItem: function(item, options) {
                            if (utils.isDefined(item.groupIndex) && utils.isString(item.rowType) && item.rowType.indexOf("group") === 0) {
                                item = this._processGroupItem(item, options);
                                options.dataIndex = 0
                            }
                            else
                                item = this.callBase.apply(this, arguments);
                            return item
                        },
                        _processGroupItem: function(item, options) {
                            return item
                        },
                        _processGroupItems: function(items, groupsCount, options) {
                            var that = this,
                                scrollingMode,
                                i,
                                item,
                                resultItems,
                                path;
                            if (!options) {
                                scrollingMode = that.option('scrolling.mode');
                                options = {
                                    collectContinuationItems: scrollingMode !== 'virtual' && scrollingMode !== 'infinite',
                                    resultItems: [],
                                    path: []
                                }
                            }
                            resultItems = options.resultItems;
                            path = options.path;
                            if (options.data)
                                if (options.collectContinuationItems || !options.data.isContinuation)
                                    resultItems.push({
                                        rowType: 'group',
                                        data: options.data,
                                        groupIndex: path.length - 1,
                                        isExpanded: !!options.data.items,
                                        key: path,
                                        values: path
                                    });
                            if (items)
                                if (groupsCount === 0)
                                    resultItems.push.apply(resultItems, items);
                                else
                                    for (i = 0; i < items.length; i++) {
                                        item = items[i];
                                        if (item) {
                                            options.data = item;
                                            options.path = path.concat(item.key);
                                            that._processGroupItems(item.items, groupsCount - 1, options);
                                            options.data = undefined;
                                            options.path = path
                                        }
                                    }
                            return resultItems
                        },
                        publicMethods: function() {
                            return this.callBase().concat(['collapseAll', 'expandAll', 'isRowExpanded', 'expandRow', 'collapseRow'])
                        },
                        collapseAll: function(groupIndex) {
                            var dataSource = this._dataSource;
                            if (dataSource && dataSource.collapseAll(groupIndex)) {
                                dataSource.pageIndex(0);
                                dataSource.reload()
                            }
                        },
                        expandAll: function(groupIndex) {
                            var dataSource = this._dataSource;
                            if (dataSource && dataSource.expandAll(groupIndex)) {
                                dataSource.pageIndex(0);
                                dataSource.reload()
                            }
                        },
                        changeRowExpand: function(path) {
                            var that = this,
                                dataSource = this._dataSource;
                            if (!dataSource)
                                return;
                            $.when(dataSource.changeRowExpand(path)).done(function() {
                                that.load()
                            })
                        },
                        isRowExpanded: function(key) {
                            var dataSource = this._dataSource;
                            return dataSource && dataSource.isRowExpanded(key)
                        },
                        expandRow: function(key) {
                            if (!this.isRowExpanded(key))
                                this.changeRowExpand(key)
                        },
                        collapseRow: function(key) {
                            if (this.isRowExpanded(key))
                                this.changeRowExpand(key)
                        },
                        optionChanged: function(args) {
                            if (args.name === "grouping")
                                args.name = "dataSource";
                            this.callBase(args)
                        }
                    }
            }();
        var GroupingHeaderPanelExtender = function() {
                return {
                        _renderGroupPanel: function() {
                            var that = this,
                                $element = that.element(),
                                groupPanelOptions = that.option("groupPanel"),
                                $groupPanel,
                                groupColumns = that.getController('columns').getGroupColumns();
                            $groupPanel = $element.find('.' + DATAGRID_GROUP_PANEL_CLASS);
                            if (groupPanelOptions && groupPanelOptions.visible) {
                                if (!$groupPanel.length)
                                    $groupPanel = $('<div />').addClass(DATAGRID_GROUP_PANEL_CLASS).prependTo($element);
                                else
                                    $groupPanel.show();
                                that._renderGroupPanelItems($groupPanel, groupColumns);
                                if (groupPanelOptions.allowColumnDragging && !groupColumns.length)
                                    $('<div />').addClass(DATAGRID_GROUP_PANEL_MESSAGE_CLASS).text(groupPanelOptions.emptyPanelText).appendTo($groupPanel)
                            }
                            else
                                $groupPanel.hide()
                        },
                        _renderGroupPanelItems: function($groupPanel, groupColumns) {
                            var that = this,
                                $item;
                            $groupPanel.empty();
                            $.each(groupColumns, function(index, groupColumn) {
                                $item = $('<div />').addClass(groupColumn.cssClass).addClass(DATAGRID_GROUP_PANEL_ITEM_CLASS).toggleClass(DATAGRID_HEADERS_ACTION_CLASS, groupColumn.allowSorting).appendTo($groupPanel).text(groupColumn.caption).on(events.addNamespace("dxclick", "dxDataGridHeaderPanel"), that.createAction(function(e) {
                                    setTimeout(function() {
                                        that.getController('columns').changeSortOrder(groupColumn.index)
                                    })
                                }));
                                that._applySorting($item, {
                                    alignment: 'left',
                                    sortOrder: groupColumn.sortOrder === 'desc' ? 'desc' : 'asc'
                                }, true)
                            });
                            that._updateSortIndicatorPositions($groupPanel)
                        },
                        _renderCore: function() {
                            this.callBase.apply(this, arguments);
                            this._renderGroupPanel()
                        },
                        _resizeCore: function() {
                            var that = this,
                                $element = that.element(),
                                $groupPanel = $element && $element.find('.' + DATAGRID_GROUP_PANEL_CLASS),
                                groupPanelOptions = that.option('groupPanel');
                            that.callBase();
                            that._updateSortIndicatorPositions($groupPanel)
                        },
                        allowDragging: function(column) {
                            var groupPanelOptions = this.option("groupPanel");
                            return groupPanelOptions && groupPanelOptions.visible && groupPanelOptions.allowColumnDragging && column && column.allowGrouping
                        },
                        getColumnElements: function() {
                            var $element = this.element();
                            return $element && $element.find('.' + DATAGRID_GROUP_PANEL_ITEM_CLASS)
                        },
                        getColumns: function() {
                            return this.getController('columns').getGroupColumns()
                        },
                        getBoundingRect: function() {
                            var that = this,
                                $element = that.element(),
                                offset;
                            if ($element && $element.find('.' + DATAGRID_GROUP_PANEL_CLASS).length) {
                                offset = $element.offset();
                                return {
                                        top: offset.top,
                                        bottom: offset.top + $element.height()
                                    }
                            }
                            return null
                        },
                        getName: function() {
                            return 'group'
                        },
                        isVisible: function() {
                            return this.callBase() || this.option('groupPanel.visible')
                        },
                        optionChanged: function(args) {
                            if (args.name === "groupPanel") {
                                this._renderGroupPanel();
                                args.handled = true
                            }
                            else
                                this.callBase(args)
                        }
                    }
            }();
        dataGrid.GroupingHeaderPanelExtender = GroupingHeaderPanelExtender;
        var GroupingRowsViewExtender = function() {
                return {
                        _rowClick: function(e) {
                            var that = this,
                                dataController = that.getController('data'),
                                $expandElement = $(e.jQueryEvent.target).closest('.' + DATAGRID_EXPAND_CLASS),
                                key;
                            if ($expandElement.length) {
                                key = dataController.getKeyByRowIndex(e.rowIndex);
                                dataController.changeRowExpand(key);
                                e.jQueryEvent.preventDefault();
                                e.handled = true
                            }
                            that.callBase(e)
                        },
                        _getDefaultTemplate: function(column) {
                            var that = this;
                            if (column.command === "expand")
                                return function(container, options) {
                                        if (!utils.isDefined(options.value) || options.data && options.data.isContinuation || options.row.inserted)
                                            container.addClass(DATAGRID_GROUP_SPACE_CLASS);
                                        else
                                            container.addClass(DATAGRID_GROUP_SPACE_CLASS).addClass(DATAGRID_EXPAND_CLASS).addClass(DATAGRID_SELECTION_DISABLED_CLASS).addClass(options.value ? DATAGRID_GROUP_OPENED_CLASS : DATAGRID_GROUP_CLOSED_CLASS)
                                    };
                            return that.callBase(column)
                        }
                    }
            }();
        $.extend(dataGrid.__internals, {
            DATAGRID_GROUP_PANEL_CLASS: DATAGRID_GROUP_PANEL_CLASS,
            DATAGRID_GROUP_PANEL_MESSAGE_CLASS: DATAGRID_GROUP_PANEL_MESSAGE_CLASS,
            DATAGRID_GROUP_PANEL_ITEM_CLASS: DATAGRID_GROUP_PANEL_ITEM_CLASS,
            DATAGRID_GROUP_SPACE_CLASS: DATAGRID_GROUP_SPACE_CLASS,
            DATAGRID_GROUP_OPENED_CLASS: DATAGRID_GROUP_OPENED_CLASS,
            DATAGRID_GROUP_CLOSED_CLASS: DATAGRID_GROUP_CLOSED_CLASS,
            DATAGRID_EXPAND_CLASS: DATAGRID_EXPAND_CLASS,
            DATAGRID_SELECTION_DISABLED_CLASS: DATAGRID_SELECTION_DISABLED_CLASS
        });
        dataGrid.registerModule('grouping', {
            defaultOptions: function() {
                return {
                        grouping: {
                            autoExpandAll: true,
                            allowCollapsing: true,
                            groupContinuesMessage: Globalize.localize("dxDataGrid-groupContinuesMessage"),
                            groupContinuedMessage: Globalize.localize("dxDataGrid-groupContinuedMessage")
                        },
                        groupPanel: {
                            visible: false,
                            emptyPanelText: Globalize.localize("dxDataGrid-groupPanelEmptyText"),
                            allowColumnDragging: true
                        }
                    }
            },
            extenders: {
                controllers: {data: GroupingDataControllerExtender},
                views: {
                    headerPanel: GroupingHeaderPanelExtender,
                    rowsView: GroupingRowsViewExtender
                }
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.grouping.server.js */
    (function($, DX) {
        var utils = DX.utils,
            dataUtils = DX.data.utils,
            dataGrid = DX.ui.dxDataGrid,
            normalizeSortingInfo = dataGrid.normalizeSortingInfo,
            keysEqual = dataUtils.keysEqual;
        var loadTotalCount = function(store, options) {
                var d = $.Deferred(),
                    loadOptions = $.extend({
                        skip: 0,
                        take: 1,
                        requireTotalCount: true
                    }, options);
                store.load(loadOptions).done(function(data, extra) {
                    if (extra && isFinite(extra.totalCount))
                        d.resolve(extra.totalCount);
                    else
                        store.totalCount(options).done($.proxy(d.resolve, d)).fail($.proxy(d.reject, d))
                }).fail($.proxy(d.reject, d));
                return d
            };
        dataGrid.DataSourceAdapterServer = dataGrid.DataSourceAdapterServer.inherit(function() {
            var foreachCollapsedGroups = function(that, callback) {
                    return that.foreachGroups(function(groupInfo) {
                            if (!groupInfo.isExpanded)
                                return callback(groupInfo)
                        })
                };
            var correctSkipLoadOption = function(that, skip) {
                    var skipCorrection = 0,
                        resultSkip = skip || 0;
                    if (skip) {
                        foreachCollapsedGroups(that, function(groupInfo) {
                            if (groupInfo.offset - skipCorrection >= skip)
                                return false;
                            skipCorrection += groupInfo.count - 1
                        });
                        resultSkip += skipCorrection
                    }
                    return resultSkip
                };
            var processGroupItems = function(that, items, path, offset, skipFirstItem, take) {
                    var i,
                        item,
                        offsetInfo,
                        removeLastItemsCount = 0,
                        needRemoveFirstItem = false;
                    for (i = 0; i < items.length; i++) {
                        item = items[i];
                        if (item.items !== undefined) {
                            path.push(item.key);
                            var groupInfo = that.findGroupInfo(path);
                            if (groupInfo && !groupInfo.isExpanded) {
                                item.collapsedItems = item.items;
                                item.items = null;
                                offset += groupInfo.count;
                                take--;
                                if (take < 0)
                                    removeLastItemsCount++;
                                if (skipFirstItem)
                                    needRemoveFirstItem = true
                            }
                            else if (item.items) {
                                offsetInfo = processGroupItems(that, item.items, path, offset, skipFirstItem, take);
                                if (skipFirstItem)
                                    if (offsetInfo.offset - offset > 1)
                                        item.isContinuation = true;
                                    else
                                        needRemoveFirstItem = true;
                                offset = offsetInfo.offset;
                                take = offsetInfo.take;
                                if (take < 0)
                                    if (item.items.length)
                                        item.isContinuationOnNextPage = true;
                                    else
                                        removeLastItemsCount++
                            }
                            path.pop()
                        }
                        else {
                            if (skipFirstItem)
                                needRemoveFirstItem = true;
                            offset++;
                            take--;
                            if (take < 0)
                                removeLastItemsCount++
                        }
                        skipFirstItem = false
                    }
                    if (needRemoveFirstItem)
                        items.splice(0, 1);
                    if (removeLastItemsCount)
                        items.splice(-removeLastItemsCount, removeLastItemsCount);
                    return {
                            offset: offset,
                            take: take
                        }
                };
            var pathEquals = function(path1, path2) {
                    var i;
                    if (path1.length !== path2.length)
                        return false;
                    for (i = 0; i < path1.length; i++)
                        if (!keysEqual(null, path1[i], path2[i]))
                            return false;
                    return true
                };
            var updateGroupOffsets = function(that, items, path, offset, additionalGroupInfo) {
                    var i,
                        item,
                        groupsInfo = that._groupsInfo;
                    if (!items)
                        return;
                    for (i = 0; i < items.length; i++) {
                        item = items[i];
                        if ('key' in item && item.items !== undefined) {
                            path.push(item.key);
                            if (additionalGroupInfo && pathEquals(additionalGroupInfo.path, path) && !item.isContinuation)
                                additionalGroupInfo.offset = offset;
                            var groupInfo = that.findGroupInfo(path);
                            if (groupInfo && !groupInfo.isExpanded) {
                                if (!item.isContinuation) {
                                    groupInfo.offset = offset;
                                    offset += groupInfo.count
                                }
                            }
                            else
                                offset = updateGroupOffsets(that, item.items, path, offset, additionalGroupInfo);
                            path.pop()
                        }
                        else
                            offset++
                    }
                    return offset
                };
            var removeGroupLoadOption = function(storeLoadOptions) {
                    var groups,
                        sorts;
                    if (storeLoadOptions.group) {
                        groups = normalizeSortingInfo(storeLoadOptions.group);
                        sorts = normalizeSortingInfo(storeLoadOptions.sort);
                        storeLoadOptions.sort = dataUtils.arrangeSortingInfo(groups, sorts);
                        delete storeLoadOptions.group
                    }
                };
            var createGroupFilter = function(path, storeLoadOptions) {
                    var groups = normalizeSortingInfo(storeLoadOptions.group),
                        i,
                        filter = [];
                    for (i = 0; i < path.length; i++)
                        filter.push([groups[i].selector, '=', path[i]]);
                    if (storeLoadOptions.filter)
                        filter.push(storeLoadOptions.filter);
                    return filter
                };
            var createNotGroupFilter = function(path, storeLoadOptions, group) {
                    var groups = normalizeSortingInfo(group || storeLoadOptions.group),
                        i,
                        j,
                        filterElement,
                        filter = [];
                    for (i = 0; i < path.length; i++) {
                        filterElement = [];
                        for (j = 0; j <= i; j++)
                            filterElement.push([groups[j].selector, i === j ? '<>' : '=', path[j]]);
                        if (filter.length)
                            filter.push('or');
                        filter.push(filterElement)
                    }
                    if (path.length > 1)
                        filter = [filter];
                    if (storeLoadOptions.filter)
                        filter.push(storeLoadOptions.filter);
                    return filter
                };
            var createOffsetFilter = function(path, storeLoadOptions) {
                    var groups = normalizeSortingInfo(storeLoadOptions.group),
                        i,
                        j,
                        filterElement,
                        filter = [];
                    for (i = 0; i < path.length; i++) {
                        filterElement = [];
                        for (j = 0; j <= i; j++)
                            filterElement.push([groups[j].selector, i === j ? groups[j].desc ? '>' : '<' : '=', path[j]]);
                        if (filter.length)
                            filter.push('or');
                        filter.push(filterElement)
                    }
                    if (storeLoadOptions.filter)
                        filter.push(storeLoadOptions.filter);
                    return filter
                };
            return {
                    _handleDataLoading: function(options) {
                        this.callBase(options);
                        var that = this,
                            storeLoadOptions = options.storeLoadOptions,
                            currentTake,
                            loadOptions,
                            collapsedPaths = [],
                            collapsedItemsCount = 0,
                            skipFirstItem = false,
                            take,
                            group = storeLoadOptions.group,
                            skipCorrection = 0;
                        removeGroupLoadOption(storeLoadOptions);
                        loadOptions = $.extend({}, storeLoadOptions);
                        loadOptions.skip = correctSkipLoadOption(that, storeLoadOptions.skip);
                        if (loadOptions.skip && loadOptions.take && group) {
                            loadOptions.skip--;
                            loadOptions.take++;
                            skipFirstItem = true
                        }
                        if (loadOptions.take && group) {
                            take = loadOptions.take;
                            loadOptions.take++
                        }
                        foreachCollapsedGroups(that, function(groupInfo) {
                            if (groupInfo.offset >= loadOptions.skip + loadOptions.take + skipCorrection)
                                return false;
                            else if (groupInfo.offset >= loadOptions.skip + skipCorrection && groupInfo.count) {
                                skipCorrection += groupInfo.count - 1;
                                collapsedPaths.push(groupInfo.path);
                                collapsedItemsCount += groupInfo.count
                            }
                        });
                        $.each(collapsedPaths, function() {
                            loadOptions.filter = createNotGroupFilter(this, loadOptions, group)
                        });
                        options.storeLoadOptions = loadOptions;
                        options.collapsedPaths = collapsedPaths;
                        options.collapsedItemsCount = collapsedItemsCount;
                        options.skip = loadOptions.skip || 0;
                        options.skipFirstItem = skipFirstItem;
                        options.take = take;
                        options.group = group
                    },
                    _handleDataLoaded: function(options) {
                        var that = this,
                            data = options.data,
                            i,
                            pathIndex,
                            query,
                            collapsedPaths = options.collapsedPaths,
                            groups = normalizeSortingInfo(options.group),
                            groupCount = groups.length;
                        function appendCollapsedPath(data, path, groups) {
                            if (!data || !path.length || !groups.length)
                                return;
                            var i,
                                items,
                                keyValue,
                                pathValue = dataUtils.toComparable(path[0], true);
                            for (i = 0; i < data.length; i++) {
                                keyValue = dataUtils.toComparable(data[i].key, true);
                                if (groups[0].desc ? pathValue >= keyValue : pathValue <= keyValue)
                                    break
                            }
                            if (!data.length || pathValue !== keyValue)
                                data.splice(i, 0, {
                                    key: path[0],
                                    items: []
                                });
                            appendCollapsedPath(data[i].items, path.slice(1), groups.slice(1))
                        }
                        this.callBase(options);
                        if (groupCount) {
                            query = DX.data.query(data);
                            DX.data.utils.multiLevelGroup(query, groups).enumerate().done(function(groupedData) {
                                data = groupedData
                            });
                            if (collapsedPaths)
                                for (pathIndex = 0; pathIndex < collapsedPaths.length; pathIndex++)
                                    appendCollapsedPath(data, collapsedPaths[pathIndex], groups);
                            processGroupItems(that, data, [], options.skip, options.skipFirstItem, options.take);
                            that.updateItemsCount(data, groupCount);
                            options.data = data;
                            if (options.collapsedItemsCount && options.extra && options.extra.totalCount >= 0)
                                options.extra.totalCount += options.collapsedItemsCount
                        }
                    },
                    updateTotalItemsCount: function() {
                        var itemsCountCorrection = 0;
                        foreachCollapsedGroups(this, function(groupInfo) {
                            if (groupInfo.count)
                                itemsCountCorrection -= groupInfo.count - 1
                        });
                        this.callBase(itemsCountCorrection)
                    },
                    _changeRowExpandCore: function(path) {
                        var that = this,
                            dataSource = that._dataSource,
                            basePageIndex = that.basePageIndex && that.basePageIndex() || that.pageIndex(),
                            dataSourceItems = that.items(),
                            offset = correctSkipLoadOption(that, basePageIndex * that.pageSize()),
                            groupInfo = that.findGroupInfo(path),
                            groupCountQuery;
                        if (groupInfo && !groupInfo.isExpanded)
                            groupCountQuery = $.Deferred().resolve(groupInfo.count);
                        else
                            groupCountQuery = loadTotalCount(dataSource.store(), {filter: createGroupFilter(path, {
                                    filter: dataSource.filter(),
                                    group: dataSource.group()
                                })});
                        return $.when(groupCountQuery).done(function(count) {
                                count = parseInt(count.length ? count[0] : count);
                                if (groupInfo) {
                                    updateGroupOffsets(that, dataSourceItems, [], offset);
                                    groupInfo.isExpanded = !groupInfo.isExpanded;
                                    groupInfo.count = count
                                }
                                else {
                                    groupInfo = {
                                        offset: -1,
                                        count: count,
                                        path: path,
                                        isExpanded: false
                                    };
                                    updateGroupOffsets(that, dataSourceItems, [], offset, groupInfo);
                                    if (groupInfo.offset >= 0)
                                        that.addGroupInfo(groupInfo)
                                }
                                that.updateTotalItemsCount()
                            }).fail($.proxy(dataSource.loadError.fire, dataSource.loadError))
                    },
                    allowCollapseAll: function() {
                        return false
                    },
                    refresh: function(storeLoadOptions, isReload) {
                        var that = this,
                            dataSource = that._dataSource,
                            store = dataSource.store();
                        this.callBase.apply(this, arguments);
                        if (isReload)
                            return foreachCollapsedGroups(that, function(groupInfo) {
                                    var groupCountQuery = loadTotalCount(store, {filter: createGroupFilter(groupInfo.path, storeLoadOptions)}),
                                        groupOffsetQuery = loadTotalCount(store, {filter: createOffsetFilter(groupInfo.path, storeLoadOptions)});
                                    dataSource._changeLoadingCount(1);
                                    return $.when(groupOffsetQuery, groupCountQuery).done(function(offset, count) {
                                            offset = parseInt(offset.length ? offset[0] : offset);
                                            count = parseInt(count.length ? count[0] : count);
                                            groupInfo.offset = offset;
                                            if (groupInfo.count !== count) {
                                                groupInfo.count = count;
                                                that.updateTotalItemsCount()
                                            }
                                        }).fail($.proxy(that._dataSource.loadError.fire, that._dataSource.loadError)).always(function() {
                                            dataSource._changeLoadingCount(-1)
                                        })
                                })
                    }
                }
        }());
        $.extend(DX.ui.dxDataGrid.__internals, {loadTotalCount: loadTotalCount})
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.grouping.client.js */
    (function($, DX) {
        var utils = DX.utils,
            dataUtils = DX.data.utils,
            dataGrid = DX.ui.dxDataGrid,
            normalizeSortingInfo = dataGrid.normalizeSortingInfo,
            keysEqual = dataUtils.keysEqual;
        dataGrid.DataSourceAdapterClient = dataGrid.DataSourceAdapterClient.inherit(function() {
            var foreachExpandedGroups = function(that, callback) {
                    return that.foreachGroups(function(groupInfo, parents) {
                            if (groupInfo.isExpanded)
                                return callback(groupInfo, parents)
                        }, true)
                };
            var processGroupItems = function(that, items, path, groupsCount) {
                    var i,
                        item;
                    if (!groupsCount)
                        return;
                    for (i = 0; i < items.length; i++) {
                        item = items[i];
                        if (item.items !== undefined) {
                            path.push(item.key);
                            var groupInfo = that.findGroupInfo(path);
                            if (!groupInfo || !groupInfo.isExpanded) {
                                item.collapsedItems = item.items;
                                item.items = null
                            }
                            else
                                processGroupItems(that, item.items, path, groupsCount - 1);
                            path.pop()
                        }
                    }
                };
            var hasExpandedGroup = function(that, group) {
                    var hasExpandedGroup = false,
                        i,
                        groupsCount = normalizeSortingInfo(group).length;
                    for (i = 0; i < groupsCount; i++)
                        if (that._isGroupExpanded(i))
                            hasExpandedGroup = true;
                    return hasExpandedGroup
                };
            var updateGroupInfos = function(that, items, groupsCount, offset) {
                    return updateGroupInfosCore(that, items, 0, groupsCount, [], offset)
                };
            var updateGroupInfosCore = function(that, items, groupIndex, groupsCount, path, offset) {
                    var item,
                        totalCount = 0,
                        i,
                        groupInfo;
                    if (groupIndex >= groupsCount)
                        return items.length;
                    for (i = 0; i < items.length; i++) {
                        item = items[i];
                        if (item) {
                            path.push(item.key);
                            groupInfo = that.findGroupInfo(path);
                            if (!groupInfo)
                                that.addGroupInfo({
                                    isExpanded: that._isGroupExpanded(groupIndex),
                                    path: path.slice(0),
                                    offset: offset + i,
                                    count: item.items.length
                                });
                            else {
                                groupInfo.count = item.items.length;
                                groupInfo.offset = offset + i
                            }
                            totalCount += updateGroupInfosCore(that, item.items, groupIndex + 1, groupsCount, path, 0);
                            path.pop()
                        }
                    }
                    return totalCount
                };
            var isGroupExpanded = function(groups, groupIndex) {
                    return groups && groups.length && groups[groupIndex] && !!groups[groupIndex].isExpanded
                };
            var getTotalOffset = function(groupInfos, pageSize, offset) {
                    var groupIndex,
                        prevOffset = 0,
                        groupSize,
                        totalOffset = offset;
                    for (groupIndex = 0; groupIndex < groupInfos.length; groupIndex++) {
                        groupSize = groupInfos[groupIndex].offset + 1;
                        if (groupIndex > 0) {
                            groupSize += groupInfos[groupIndex - 1].childrenTotalCount;
                            if (pageSize)
                                groupSize += getContinuationGroupCount(totalOffset, pageSize, groupSize, groupIndex - 1) * groupIndex
                        }
                        totalOffset += groupSize
                    }
                    return totalOffset
                };
            var getContinuationGroupCount = function(groupOffset, pageSize, groupSize, groupIndex) {
                    groupIndex = groupIndex || 0;
                    if (pageSize > 1 && groupSize > 0) {
                        var pageOffset = groupOffset - Math.floor(groupOffset / pageSize) * pageSize || pageSize;
                        pageOffset += groupSize - groupIndex - 2;
                        if (pageOffset < 0)
                            pageOffset += pageSize;
                        return Math.floor(pageOffset / (pageSize - groupIndex - 1))
                    }
                    return 0
                };
            DX.ui.dxDataGrid.getContinuationGroupCount = getContinuationGroupCount;
            return {
                    updateTotalItemsCount: function(options) {
                        var totalItemsCount = 0,
                            totalCount = options.extra && options.extra.totalCount || 0,
                            pageSize = this.pageSize(),
                            isVirtualPaging = this._isVirtualPaging();
                        foreachExpandedGroups(this, function(groupInfo, parents) {
                            groupInfo.childrenTotalCount = 0
                        });
                        foreachExpandedGroups(this, function(groupInfo, parents) {
                            var totalOffset = getTotalOffset(parents, isVirtualPaging ? 0 : pageSize, totalItemsCount),
                                count = groupInfo.count + groupInfo.childrenTotalCount,
                                i;
                            if (!isVirtualPaging)
                                count += getContinuationGroupCount(totalOffset, pageSize, count, parents.length - 1);
                            if (parents[parents.length - 2])
                                parents[parents.length - 2].childrenTotalCount += count;
                            else
                                totalItemsCount += count
                        });
                        this.callBase(totalItemsCount - totalCount + options.data.length)
                    },
                    _isGroupExpanded: function(groupIndex) {
                        var groups = this._dataSource.group();
                        return isGroupExpanded(groups, groupIndex)
                    },
                    _updatePagingOptions: function(options) {
                        var that = this,
                            storeLoadOptions = options.loadOptions,
                            dataSource = this._dataSource,
                            isVirtualPaging = that._isVirtualPaging(),
                            pageSize = that.pageSize(),
                            groups = normalizeSortingInfo(storeLoadOptions.group),
                            sorts = normalizeSortingInfo(storeLoadOptions.sort),
                            skips = [],
                            takes = [],
                            skipChildrenTotalCount = 0,
                            childrenTotalCount = 0;
                        if (options.take) {
                            foreachExpandedGroups(this, function(groupInfo) {
                                groupInfo.childrenTotalCount = 0;
                                groupInfo.skipChildrenTotalCount = 0
                            });
                            foreachExpandedGroups(that, function(groupInfo, parents) {
                                var skip,
                                    take,
                                    takeCorrection = 0,
                                    parentTakeCorrection = 0,
                                    totalOffset = getTotalOffset(parents, isVirtualPaging ? 0 : pageSize, childrenTotalCount),
                                    continuationGroupCount = 0,
                                    skipContinuationGroupCount = 0,
                                    groupInfoCount = groupInfo.count + groupInfo.childrenTotalCount,
                                    childrenGroupInfoCount = groupInfoCount;
                                skip = options.skip - totalOffset;
                                if (totalOffset <= options.skip + options.take && groupInfoCount) {
                                    take = options.take;
                                    if (!isVirtualPaging) {
                                        continuationGroupCount = getContinuationGroupCount(totalOffset, pageSize, groupInfoCount, parents.length - 1);
                                        groupInfoCount += continuationGroupCount * parents.length;
                                        childrenGroupInfoCount += continuationGroupCount;
                                        if (pageSize && skip >= 0) {
                                            takeCorrection = parents.length;
                                            parentTakeCorrection = parents.length - 1;
                                            skipContinuationGroupCount = Math.floor(skip / pageSize)
                                        }
                                    }
                                    if (skip >= 0) {
                                        if (totalOffset + groupInfoCount > options.skip)
                                            skips.unshift(skip - skipContinuationGroupCount * takeCorrection - groupInfo.skipChildrenTotalCount);
                                        if (totalOffset + groupInfoCount >= options.skip + take)
                                            takes.unshift(take - takeCorrection - groupInfo.childrenTotalCount + groupInfo.skipChildrenTotalCount)
                                    }
                                    else if (totalOffset + groupInfoCount >= options.skip + take)
                                        takes.unshift(take + skip - groupInfo.childrenTotalCount)
                                }
                                if (totalOffset <= options.skip)
                                    if (parents[parents.length - 2])
                                        parents[parents.length - 2].skipChildrenTotalCount += Math.min(childrenGroupInfoCount, skip + 1 - skipContinuationGroupCount * parentTakeCorrection);
                                    else
                                        skipChildrenTotalCount += Math.min(childrenGroupInfoCount, skip + 1);
                                if (totalOffset <= options.skip + take) {
                                    groupInfoCount = Math.min(childrenGroupInfoCount, skip + take - (skipContinuationGroupCount + 1) * parentTakeCorrection);
                                    if (parents[parents.length - 2])
                                        parents[parents.length - 2].childrenTotalCount += groupInfoCount;
                                    else
                                        childrenTotalCount += groupInfoCount
                                }
                            });
                            options.skip -= skipChildrenTotalCount;
                            options.take -= childrenTotalCount - skipChildrenTotalCount
                        }
                        options.skips = skips;
                        options.takes = takes
                    },
                    _changeRowExpandCore: function(path) {
                        var that = this,
                            groupInfo = that.findGroupInfo(path);
                        if (groupInfo) {
                            groupInfo.isExpanded = !groupInfo.isExpanded;
                            return $.Deferred().resolve()
                        }
                        return $.Deferred().reject()
                    },
                    _handleDataLoadedCore: function(options) {
                        var that = this,
                            callBase = that.callBase,
                            data = options.data,
                            groupCount = normalizeSortingInfo(options.loadOptions.group).length,
                            summary = that.summary(),
                            totalCount,
                            skips,
                            takes,
                            i,
                            item,
                            items;
                        totalCount = updateGroupInfos(that, options.data, groupCount, 0);
                        if (groupCount && options.extra)
                            options.extra.totalCount = totalCount;
                        that.updateTotalItemsCount(options);
                        that._updatePagingOptions(options);
                        callBase.call(that, options);
                        skips = options.skips;
                        takes = options.takes;
                        items = options.data;
                        for (i = 0; items && i < groupCount; i++) {
                            item = items[0];
                            items = item && item.items;
                            if (items && skips[i] !== undefined) {
                                item.isContinuation = true;
                                items = items.slice(skips[i]);
                                item.items = items
                            }
                        }
                        items = options.data;
                        for (i = 0; items && i < groupCount; i++) {
                            item = items[items.length - 1];
                            items = item && item.items;
                            if (items && takes[i] !== undefined && items.length > takes[i]) {
                                item.isContinuationOnNextPage = true;
                                items = items.slice(0, takes[i]);
                                item.items = items
                            }
                        }
                        processGroupItems(that, options.data, [], groupCount);
                        that.updateItemsCount(options.data, groupCount)
                    },
                    refresh: function(storeLoadOptions) {
                        var that = this,
                            oldGroups = normalizeSortingInfo(that._group),
                            groups = normalizeSortingInfo(storeLoadOptions.group),
                            isExpanded,
                            groupIndex;
                        for (groupIndex = 0; groupIndex < oldGroups.length; groupIndex++) {
                            isExpanded = isGroupExpanded(storeLoadOptions.group, groupIndex);
                            if (isGroupExpanded(that._group, groupIndex) !== isExpanded)
                                that.foreachGroups(function(groupInfo, parents) {
                                    if (parents.length === groupIndex + 1)
                                        groupInfo.isExpanded = isExpanded
                                })
                        }
                        that.callBase.apply(this, arguments);
                        that.foreachGroups(function(groupInfo) {
                            groupInfo.count = 0
                        })
                    }
                }
        }())
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.virtualScrollingModule.js */
    (function($, DX) {
        var ui = DX.ui,
            dataGrid = ui.dxDataGrid,
            utils = DX.utils;
        var DATAGRID_TABLE_CLASS = "dx-datagrid-table",
            DATAGRID_ROW_CLASS = "dx-row",
            DATAGRID_FREESPACE_CLASS = "dx-freespace-row",
            DATAGRID_COLUMN_LINES_CLASS = "dx-column-lines",
            DATAGRID_BOTTOM_LOAD_PANEL_CLASS = "dx-datagrid-bottom-load-panel",
            DATAGRID_TABLE_CONTENT_CLASS = "dx-datagrid-table-content",
            DATAGRID_GROUP_SPACE_CLASS = "dx-datagrid-group-space",
            SCROLLING_MODE_INFINITE = 'infinite',
            SCROLLING_MODE_VIRTUAL = 'virtual',
            PIXELS_LIMIT = 250000;
        var VirtualScrollingDataSourceAdapterExtender = function() {
                var getPreloadPageCount = function(that) {
                        return that.option('scrolling.preloadEnabled') ? 2 : 1
                    };
                var isVirtualMode = function(that) {
                        return that.option('scrolling.mode') === SCROLLING_MODE_VIRTUAL
                    };
                var isAppendMode = function(that) {
                        return that.option('scrolling.mode') === SCROLLING_MODE_INFINITE
                    };
                var getBasePageIndex = function(that) {
                        return that._cache[0] ? that._cache[0].pageIndex : -1
                    };
                var updateLoading = function(that) {
                        var basePageIndex = getBasePageIndex(that),
                            pageCount = that._cache.length;
                        if (isVirtualMode(that))
                            if (basePageIndex < 0 || that._viewportItemIndex >= 0 && (basePageIndex * that.pageSize() > that._viewportItemIndex || basePageIndex * that.pageSize() + that.itemsCount() < that._viewportItemIndex + that._viewportSize) && that._dataSource.isLoading()) {
                                if (!that._isLoading) {
                                    that._isLoading = true;
                                    that.loadingChanged.fire(true)
                                }
                            }
                            else if (that._isLoading) {
                                that._isLoading = false;
                                that.loadingChanged.fire(false)
                            }
                    };
                var processDelayChanged = function(that, changed) {
                        if (that._isDelayChanged) {
                            that._isDelayChanged = false;
                            changed.call(that)
                        }
                    };
                var processChanged = function(that, changed, changeType, isDelayChanged) {
                        var dataSource = that._dataSource,
                            items = dataSource.items();
                        if (changeType === 'append')
                            that._items.push.apply(that._items, items);
                        else if (changeType === 'prepend')
                            that._items.unshift.apply(that._items, items);
                        else
                            that._items = items;
                        updateLoading(that);
                        that._lastPageIndex = that.pageIndex();
                        that._isDelayChanged = isDelayChanged;
                        if (!isDelayChanged)
                            changed.call(that, changeType && {
                                changeType: changeType,
                                items: items
                            })
                    };
                return {
                        init: function(dataSource) {
                            var that = this;
                            that.callBase.apply(that, arguments);
                            that._isLoading = true;
                            that._pageIndex = dataSource.pageIndex();
                            that._lastPageIndex = that._pageIndex;
                            that._viewportSize = 0;
                            that._viewportItemIndex = -1;
                            that._userPageSize = that.option("paging.pageSize");
                            that._items = [];
                            that._isLoaded = true;
                            that._cache = [];
                            if (dataSource.isLoaded())
                                that._handleDataChanged()
                        },
                        _handleLoadingChanged: function(isLoading) {
                            var that = this;
                            if (!isVirtualMode(that)) {
                                that._isLoading = isLoading;
                                that.callBase.apply(that, arguments)
                            }
                        },
                        _handleLoadError: function() {
                            var that = this;
                            that._isLoading = false;
                            that.loadingChanged.fire(false);
                            that.callBase.apply(that, arguments)
                        },
                        _handleDataChanged: function() {
                            var that = this,
                                basePageIndex,
                                callBase = that.callBase,
                                dataSource = that._dataSource,
                                lastCacheLength = that._cache.length,
                                changeType,
                                cacheItem;
                            if (isVirtualMode(that)) {
                                basePageIndex = getBasePageIndex(that);
                                if (basePageIndex >= 0)
                                    if (basePageIndex + that._cache.length === dataSource.pageIndex());
                                    else if (basePageIndex - 1 === dataSource.pageIndex());
                                    else
                                        that._cache = [];
                                cacheItem = {
                                    pageIndex: dataSource.pageIndex(),
                                    itemsCount: that.itemsCount(true)
                                };
                                processDelayChanged(that, callBase);
                                if (basePageIndex === dataSource.pageIndex() + 1) {
                                    changeType = 'prepend';
                                    that._cache.unshift(cacheItem)
                                }
                                else {
                                    changeType = 'append';
                                    that._cache.push(cacheItem)
                                }
                                processChanged(that, callBase, that._cache.length > 1 ? changeType : undefined, lastCacheLength === 0);
                                that.load().done(function() {
                                    processDelayChanged(that, callBase)
                                })
                            }
                            else
                                processChanged(that, callBase, isAppendMode(that) && dataSource.pageIndex() !== 0 ? 'append' : undefined)
                        },
                        items: function() {
                            return this._items
                        },
                        itemsCount: function(isBase) {
                            var itemsCount = 0;
                            if (!isBase && isVirtualMode(this))
                                $.each(this._cache, function() {
                                    itemsCount += this.itemsCount
                                });
                            else
                                itemsCount = this.callBase();
                            return itemsCount
                        },
                        virtualItemsCount: function() {
                            var that = this,
                                pageIndex,
                                itemsCount = 0,
                                i,
                                beginItemsCount,
                                endItemsCount;
                            if (isVirtualMode(that)) {
                                pageIndex = getBasePageIndex(that);
                                if (pageIndex < 0)
                                    pageIndex = 0;
                                beginItemsCount = pageIndex * that.pageSize();
                                itemsCount = that._cache.length * that.pageSize();
                                endItemsCount = Math.max(0, that.totalItemsCount() - itemsCount - beginItemsCount);
                                return {
                                        begin: beginItemsCount,
                                        end: endItemsCount
                                    }
                            }
                        },
                        setViewportItemIndex: function(itemIndex) {
                            var that = this,
                                pageSize = that.pageSize(),
                                dataSource = that._dataSource,
                                pageCount = that.pageCount(),
                                virtualMode = isVirtualMode(that),
                                appendMode = isAppendMode(that),
                                totalItemsCount = that.totalItemsCount(),
                                lastPageSize,
                                needLoad = that._viewportItemIndex < 0,
                                maxPageIndex,
                                newPageIndex;
                            that._viewportItemIndex = itemIndex;
                            if (pageSize && (virtualMode || appendMode) && totalItemsCount >= 0) {
                                if (that._viewportSize && itemIndex + that._viewportSize >= totalItemsCount)
                                    if (that.hasKnownLastPage()) {
                                        newPageIndex = pageCount - 1;
                                        lastPageSize = totalItemsCount % pageSize;
                                        if (newPageIndex > 0 && lastPageSize > 0 && lastPageSize < pageSize / 2)
                                            newPageIndex--
                                    }
                                    else
                                        newPageIndex = pageCount;
                                else {
                                    newPageIndex = Math.floor(itemIndex / pageSize);
                                    maxPageIndex = pageCount - 1;
                                    newPageIndex = Math.max(newPageIndex, 0);
                                    newPageIndex = Math.min(newPageIndex, maxPageIndex)
                                }
                                if (that.pageIndex() !== newPageIndex || needLoad) {
                                    that.pageIndex(newPageIndex);
                                    that.load()
                                }
                            }
                        },
                        setViewportSize: function(size) {
                            var that = this,
                                pageSize;
                            if (that._viewportSize !== size) {
                                that._viewportSize = size;
                                if ((isVirtualMode(that) || isAppendMode(that)) && !that._userPageSize) {
                                    pageSize = Math.ceil(size / 5) * 10;
                                    if (pageSize !== that.pageSize()) {
                                        that.pageSize(pageSize);
                                        that.reload()
                                    }
                                }
                            }
                        },
                        getViewportSize: function() {
                            return this._viewportSize
                        },
                        pageIndex: function(pageIndex) {
                            if (isVirtualMode(this) || isAppendMode(this)) {
                                if (pageIndex !== undefined)
                                    this._pageIndex = pageIndex;
                                return this._pageIndex
                            }
                            else
                                return this._dataSource.pageIndex(pageIndex)
                        },
                        basePageIndex: function() {
                            var basePageIndex = getBasePageIndex(this);
                            return basePageIndex > 0 ? basePageIndex : 0
                        },
                        load: function() {
                            var basePageIndex = getBasePageIndex(this),
                                pageIndexForLoad = -1,
                                dataSource = this._dataSource,
                                result;
                            var loadCore = function(that, pageIndex) {
                                    var dataSource = that._dataSource;
                                    if (pageIndex === that.pageIndex() || !dataSource.isLoading() && pageIndex < that.pageCount() || !that.hasKnownLastPage() && pageIndex === that.pageCount()) {
                                        dataSource.pageIndex(pageIndex);
                                        return dataSource.load()
                                    }
                                };
                            if (isVirtualMode(this)) {
                                if (basePageIndex < 0 || !this._cache[this._pageIndex - basePageIndex])
                                    pageIndexForLoad = this._pageIndex;
                                if (basePageIndex >= 0 && pageIndexForLoad < 0 && this._viewportItemIndex >= 0 && basePageIndex + this._cache.length <= this._pageIndex + getPreloadPageCount(this))
                                    pageIndexForLoad = basePageIndex + this._cache.length;
                                if (pageIndexForLoad >= 0)
                                    result = loadCore(this, pageIndexForLoad);
                                updateLoading(this)
                            }
                            else if (isAppendMode(this)) {
                                if (!dataSource.isLoaded() || this.pageIndex() === this.pageCount()) {
                                    dataSource.pageIndex(this.pageIndex());
                                    result = dataSource.load()
                                }
                            }
                            else
                                result = dataSource.load();
                            if (!result && this._lastPageIndex !== this.pageIndex())
                                this.changed.fire({changeType: 'pageIndex'});
                            return result || $.Deferred().resolve()
                        },
                        isLoading: function() {
                            return this._isLoading
                        },
                        isLoaded: function() {
                            return this._dataSource.isLoaded() && this._isLoaded
                        },
                        changeRowExpand: function() {
                            this._cache = [];
                            updateLoading(this);
                            return this.callBase.apply(this, arguments)
                        },
                        refresh: function(storeLoadOptions, isReload) {
                            var that = this,
                                dataSource = that._dataSource;
                            if (isReload) {
                                that._cache = [];
                                that._isLoaded = false;
                                updateLoading(that);
                                that._isLoaded = true;
                                if (isAppendMode(that)) {
                                    that.pageIndex(0);
                                    dataSource.pageIndex(0);
                                    storeLoadOptions.pageIndex = 0;
                                    storeLoadOptions.skip = 0
                                }
                                else {
                                    dataSource.pageIndex(that.pageIndex());
                                    if (dataSource.paginate())
                                        storeLoadOptions.skip = that.pageIndex() * that.pageSize()
                                }
                            }
                            return that.callBase.apply(that, arguments)
                        }
                    }
            }();
        dataGrid.DataSourceAdapterServer = dataGrid.DataSourceAdapterServer.inherit(VirtualScrollingDataSourceAdapterExtender);
        dataGrid.DataSourceAdapterClient = dataGrid.DataSourceAdapterClient.inherit(VirtualScrollingDataSourceAdapterExtender);
        var VirtualScrollingRowsViewExtender = function() {
                return {
                        _renderCore: function() {
                            var that = this;
                            that.callBase.apply(that, arguments);
                            that._updateContentPosition()
                        },
                        _renderContent: function(contentElement, tableElement) {
                            var that = this,
                                virtualItemsCount = that._dataController.virtualItemsCount();
                            if (virtualItemsCount) {
                                tableElement.addClass(DATAGRID_TABLE_CONTENT_CLASS);
                                if (!contentElement.children().length)
                                    contentElement.append(tableElement);
                                else
                                    contentElement.children().first().replaceWith(tableElement);
                                if (contentElement.children('table').length === 1) {
                                    contentElement.append(that._createTable());
                                    that._contentHeight = 0
                                }
                            }
                            else
                                return that.callBase.apply(that, arguments)
                        },
                        _updateContent: function(contentElement, change, tableElement) {
                            var that = this,
                                contentTable,
                                changeType = change && change.changeType;
                            if (changeType === 'append' || changeType === 'prepend') {
                                contentTable = contentElement.children().first();
                                tableElement.children('tbody').children('tr')[changeType === 'append' ? 'appendTo' : 'prependTo'](contentTable)
                            }
                            else
                                that.callBase.apply(that, arguments);
                            that._updateBottomLoading()
                        },
                        _updateContentPosition: function() {
                            var that = this,
                                contentElement,
                                contentHeight,
                                $tables,
                                $contentTable,
                                virtualTable,
                                rowHeight = that._rowHeight || 20,
                                virtualItemsCount = that._dataController.virtualItemsCount(),
                                isRenderVirtualTableContentRequired;
                            if (virtualItemsCount) {
                                contentElement = that._findContentElement();
                                $tables = contentElement.children();
                                $contentTable = $tables.first();
                                virtualTable = $tables.eq(1);
                                DX.translator.move($contentTable, {top: Math.floor(virtualItemsCount.begin * rowHeight)});
                                contentHeight = (virtualItemsCount.begin + virtualItemsCount.end) * rowHeight + $contentTable.outerHeight();
                                isRenderVirtualTableContentRequired = that._contentHeight !== contentHeight || contentHeight === 0 || !that._isTableLinesDisplaysCorrect(virtualTable) || !that._isColumnElementsEqual($contentTable.find("col"), virtualTable.find("col"));
                                if (isRenderVirtualTableContentRequired) {
                                    that._contentHeight = contentHeight;
                                    that._renderVirtualTableContent(virtualTable, contentHeight)
                                }
                            }
                        },
                        _isTableLinesDisplaysCorrect: function(table) {
                            return !!table.find("." + DATAGRID_COLUMN_LINES_CLASS).length === this.option('showColumnLines')
                        },
                        _isColumnElementsEqual: function($columns, $virtualColumns) {
                            var result = $columns.length === $virtualColumns.length;
                            if (result)
                                $.each($columns, function(index, element) {
                                    if (element.style.width !== $virtualColumns[index].style.width) {
                                        result = false;
                                        return result
                                    }
                                });
                            return result
                        },
                        _renderVirtualTableContent: function(container, height) {
                            var that = this,
                                columns = that._columnsController.getVisibleColumns(),
                                html = dataGrid.createColGroup(columns).prop('outerHTML'),
                                freeSpaceCellsHtml = '',
                                i,
                                columnLinesClass = that.option('showColumnLines') ? DATAGRID_COLUMN_LINES_CLASS : '',
                                createFreeSpaceRowHtml = function(height) {
                                    return '<tr style="height:' + height + 'px;" class="' + DATAGRID_FREESPACE_CLASS + ' ' + DATAGRID_ROW_CLASS + ' ' + columnLinesClass + '" >' + freeSpaceCellsHtml + '</tr>'
                                };
                            for (i = 0; i < columns.length; i++)
                                freeSpaceCellsHtml += columns[i].command === "expand" ? '<td class="' + DATAGRID_GROUP_SPACE_CLASS + '"/>' : '<td />';
                            while (height > PIXELS_LIMIT) {
                                html += createFreeSpaceRowHtml(PIXELS_LIMIT);
                                height -= PIXELS_LIMIT
                            }
                            html += createFreeSpaceRowHtml(height);
                            container.addClass(DATAGRID_TABLE_CLASS);
                            container.html(html)
                        },
                        _findBottomLoadPanel: function() {
                            var $bottomLoadPanel = this.element().find('.' + DATAGRID_BOTTOM_LOAD_PANEL_CLASS);
                            if ($bottomLoadPanel.length)
                                return $bottomLoadPanel
                        },
                        _updateBottomLoading: function() {
                            var that = this,
                                scrollingMode = that.option("scrolling.mode"),
                                virtualMode = scrollingMode === SCROLLING_MODE_VIRTUAL,
                                appendMode = scrollingMode === SCROLLING_MODE_INFINITE,
                                showBottomLoading = !that._dataController.hasKnownLastPage() && that._dataController.isLoaded() && (virtualMode || appendMode),
                                bottomLoadPanelElement = that._findBottomLoadPanel();
                            if (showBottomLoading) {
                                if (!bottomLoadPanelElement)
                                    $('<div />').addClass(DATAGRID_BOTTOM_LOAD_PANEL_CLASS).append($('<div />').dxLoadIndicator()).appendTo(that._findContentElement())
                            }
                            else if (bottomLoadPanelElement)
                                bottomLoadPanelElement.remove()
                        },
                        _handleScroll: function(e) {
                            var that = this;
                            if (that._hasHeight && that._rowHeight)
                                that._dataController.setViewportItemIndex(e.scrollOffset.top / that._rowHeight);
                            that.callBase.apply(that, arguments)
                        },
                        _renderScrollableCore: function($element) {
                            var that = this;
                            that.callBase.apply(that, arguments);
                            that._subscribeToWindowScrollEvents($element)
                        },
                        _subscribeToWindowScrollEvents: function($element) {
                            var that = this,
                                disposing = that.disposing,
                                $componentContainer = that.component.element(),
                                $scrollElement;
                            if (!$componentContainer)
                                return;
                            if (!that._windowScrollEvents) {
                                that._windowScrollEvents = true;
                                var createWindowScrollHandler = function($scrollElement, oldHandler) {
                                        var handler = function(e) {
                                                var contentOffset,
                                                    scrollTop = $scrollElement.scrollTop();
                                                if (!that._hasHeight && that._rowHeight) {
                                                    scrollTop -= $element.offset().top;
                                                    scrollTop = scrollTop > 0 ? scrollTop : 0;
                                                    that._scrollTop = scrollTop;
                                                    that._dataController.setViewportItemIndex(scrollTop / that._rowHeight)
                                                }
                                            };
                                        if (oldHandler)
                                            return function(e) {
                                                    handler(e);
                                                    oldHandler(e)
                                                };
                                        return handler
                                    };
                                var subscribeToScrollEvents = function($scrollElement) {
                                        var dxScrollable = $scrollElement.data("dxScrollable"),
                                            scrollHandler,
                                            oldScrollHandler;
                                        if (dxScrollable) {
                                            oldScrollHandler = dxScrollable.option('onScroll');
                                            scrollHandler = createWindowScrollHandler($scrollElement, oldScrollHandler);
                                            dxScrollable.option('onScroll', scrollHandler);
                                            that.on("disposing", function() {
                                                if (dxScrollable.option('onScroll') === scrollHandler)
                                                    dxScrollable.option('onScroll', oldScrollHandler)
                                            })
                                        }
                                        else if ($scrollElement.is(document) || $scrollElement.css("overflow-y") === "auto") {
                                            if ($scrollElement.is(document))
                                                $scrollElement = $(window);
                                            scrollHandler = createWindowScrollHandler($scrollElement);
                                            $scrollElement.on('scroll', scrollHandler);
                                            that.on("disposing", function() {
                                                $scrollElement.off('scroll', scrollHandler)
                                            })
                                        }
                                    };
                                for ($scrollElement = that.component.element().parent(); $scrollElement.length; $scrollElement = $scrollElement.parent())
                                    subscribeToScrollEvents($scrollElement)
                            }
                        },
                        _needUpdateRowHeight: function(itemsCount) {
                            var that = this;
                            return that.callBase.apply(that, arguments) || itemsCount > 0 && that.option('scrolling.mode') === SCROLLING_MODE_INFINITE
                        },
                        _updateRowHeight: function() {
                            var that = this,
                                lastRowHeight = that._rowHeight,
                                viewportHeight;
                            that.callBase.apply(that, arguments);
                            if (!lastRowHeight && that._rowHeight) {
                                that._updateContentPosition();
                                viewportHeight = that._hasHeight ? that.element().outerHeight() : $(window).outerHeight();
                                that._dataController.setViewportSize(Math.round(viewportHeight / that._rowHeight))
                            }
                        },
                        setLoading: function(isLoading, messageText) {
                            var that = this,
                                callBase = that.callBase,
                                hasBottomLoadPanel = !!that._findBottomLoadPanel() && that._dataController.isLoaded();
                            if (hasBottomLoadPanel)
                                isLoading = false;
                            callBase.call(that, isLoading, messageText)
                        }
                    }
            }();
        $.extend(dataGrid.__internals, {
            DATAGRID_BOTTOM_LOAD_PANEL_CLASS: DATAGRID_BOTTOM_LOAD_PANEL_CLASS,
            DATAGRID_TABLE_CONTENT_CLASS: DATAGRID_TABLE_CONTENT_CLASS
        });
        dataGrid.registerModule('virtualScrolling', {
            defaultOptions: function() {
                return {scrolling: {
                            mode: 'standard',
                            preloadEnabled: false,
                            useNativeScrolling: 'auto'
                        }}
            },
            extenders: {
                controllers: {data: function() {
                        var members = {};
                        dataGrid.proxyMethod(members, "virtualItemsCount");
                        dataGrid.proxyMethod(members, "setViewportSize");
                        dataGrid.proxyMethod(members, "setViewportItemIndex");
                        return members
                    }()},
                views: {rowsView: VirtualScrollingRowsViewExtender}
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.columnHeadersView.js */
    (function($, DX) {
        var ui = DX.ui,
            events = ui.events,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_CELL_CONTENT_CLASS = "dx-datagrid-text-content",
            DATAGRID_HEADERS_ACTION_CLASS = "dx-datagrid-action",
            DATAGRID_HEADERS_CLASS = "dx-datagrid-headers",
            DATAGRID_HEADER_ROW_CLASS = "dx-header-row",
            DATAGRID_NOWRAP_CLASS = "dx-datagrid-nowrap",
            DATAGRID_GROUP_SPACE_CLASS = "dx-datagrid-group-space",
            DATAGRID_COLUMN_LINES_CLASS = "dx-column-lines",
            DATAGRID_CONTEXT_MENU_SORT_ASC_ICON = "context-menu-sort-asc",
            DATAGRID_CONTEXT_MENU_SORT_DESC_ICON = "context-menu-sort-desc",
            DATAGRID_CONTEXT_MENU_SORT_NONE_ICON = "context-menu-sort-none",
            DATAGRID_SORT_CLASS = "dx-sort",
            DATAGRID_CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled",
            COLUMN_HEADERS_VIEW_NAMESPACE = 'dxDataGridColumnHeadersView',
            DATAGRID_BORDER_COLLAPSE_CORRECTION = 1;
        dataGrid.ColumnHeadersView = dataGrid.ColumnsView.inherit({
            _renderHeaderContent: function($cell, column, columnIndex) {
                var that = this,
                    $group = $('<div />'),
                    headerCellTemplate = column.headerCellTemplate;
                if (column.command) {
                    $cell.html('&nbsp;');
                    $cell.addClass(column.cssClass);
                    if (column.command === "expand")
                        $cell.addClass(DATAGRID_GROUP_SPACE_CLASS)
                }
                else {
                    that._applySorting($cell, column, that.option('showColumnLines'));
                    var $content = $('<div />').addClass(DATAGRID_CELL_CONTENT_CLASS);
                    if (that.option("showColumnLines"))
                        $content.appendTo($cell);
                    else
                        $content.css("float", column.alignment || 'left').prependTo($cell);
                    var templateOptions = {
                            column: column,
                            columnIndex: columnIndex
                        };
                    if ($.isFunction(headerCellTemplate))
                        headerCellTemplate($content, templateOptions);
                    else if (utils.isString(headerCellTemplate)) {
                        headerCellTemplate = that.getTemplate(headerCellTemplate);
                        if (headerCellTemplate)
                            headerCellTemplate.render(templateOptions, $content)
                    }
                    else
                        $content.text(column.caption)
                }
            },
            _renderHeader: function(rootElement, column, columnIndex) {
                var that = this,
                    sortingMode = that.option('sorting.mode'),
                    cellElement;
                cellElement = $('<td />').css('text-align', column.alignment || 'left').toggleClass(column.cssClass, !utils.isDefined(column.groupIndex)).addClass(DATAGRID_CELL_FOCUS_DISABLED_CLASS);
                that._renderHeaderContent(cellElement, column, columnIndex);
                if ((sortingMode === 'single' || sortingMode === 'multiple') && column.allowSorting)
                    cellElement.addClass(DATAGRID_HEADERS_ACTION_CLASS);
                cellElement.appendTo(rootElement)
            },
            _handleDataChanged: function(e) {
                if (this._isGroupingChanged) {
                    this._isGroupingChanged = false;
                    this.render()
                }
            },
            _renderCore: function() {
                var that = this,
                    $container = that.element(),
                    columns = that._columnsController.getVisibleColumns(),
                    scrollLeft = that._scrollLeft;
                that._tableElement = that._createTable(columns);
                $container.addClass(DATAGRID_HEADERS_CLASS).toggleClass(DATAGRID_NOWRAP_CLASS, !!that.option("columnAutoWidth") || !that.option("wordWrapEnabled")).empty();
                that._renderContent(that._tableElement);
                that.wrapTableInScrollContainer(that._tableElement).appendTo($container);
                that._scrollLeft = 0;
                that.scrollOffset(scrollLeft)
            },
            _renderContent: function($table) {
                var that = this,
                    columns = that._columnsController.getVisibleColumns(),
                    $row,
                    i;
                if (that.option('showColumnHeaders')) {
                    $row = that._createRow().addClass(DATAGRID_HEADER_ROW_CLASS).toggleClass(DATAGRID_COLUMN_LINES_CLASS, that.option('showColumnLines'));
                    $row.on(events.addNamespace("dxclick", COLUMN_HEADERS_VIEW_NAMESPACE), 'td', that.createAction(function(e) {
                        var keyName = null,
                            event = e.jQueryEvent;
                        event.stopPropagation();
                        that._changeSortOrderTimeoutID = setTimeout(function() {
                            var column = columns[event.currentTarget.cellIndex];
                            if (event.shiftKey)
                                keyName = "shift";
                            else if (event.ctrlKey)
                                keyName = "ctrl";
                            if (column && !utils.isDefined(column.groupIndex))
                                that._columnsController.changeSortOrder(column.index, keyName)
                        })
                    }));
                    for (i = 0; i < columns.length; i++)
                        that._renderHeader($row, columns[i], i);
                    $table.append($row)
                }
            },
            _afterRender: function($root) {
                var that = this;
                that._updateSortIndicatorPositions(that.element());
                that.processSizeChanged()
            },
            _updateSortIndicatorPositions: function(element) {
                var that = this,
                    columnElements = that.getColumnElements(),
                    $cell,
                    i;
                that.callBase(element);
                if (!that.option('showColumnLines') && columnElements)
                    for (i = 0; i < columnElements.length; i++) {
                        $cell = columnElements.eq(i);
                        that._setColumnTextWidth($cell, $cell.outerWidth())
                    }
            },
            _updateSortIndicators: function() {
                var that = this,
                    columns = that._columnsController.getVisibleColumns(),
                    $element = that.element(),
                    $cells = $element.find('.' + DATAGRID_HEADER_ROW_CLASS + ' > td'),
                    i;
                for (i = 0; i < columns.length; i++)
                    if (!utils.isDefined(columns[i].groupIndex))
                        that._applySorting($cells.eq(i), columns[i], that.option('showColumnLines'));
                that._updateSortIndicatorPositions($element)
            },
            _columnOptionChanged: function(e) {
                var changeTypes = e.changeTypes,
                    optionNames = e.optionNames;
                if (e.changeTypes.grouping) {
                    this._isGroupingChanged = true;
                    return
                }
                if (changeTypes.length === 1 && changeTypes.sorting) {
                    this._updateSortIndicators();
                    return
                }
                this.callBase(e);
                if (optionNames.width || optionNames.visibleWidth) {
                    this._updateSortIndicatorPositions(this.element());
                    this.resizeCompleted.fire()
                }
            },
            _setColumnTextWidth: function($column, columnWidth) {
                var $sortElement = $column.find("." + DATAGRID_SORT_CLASS),
                    indicatorOuterWidth = $sortElement.outerWidth(),
                    columnPaddings = $column.outerWidth() - $column.width(),
                    columnContentIndent = indicatorOuterWidth + columnPaddings;
                $column.find("." + DATAGRID_CELL_CONTENT_CLASS).css("max-width", columnWidth - columnContentIndent - DATAGRID_BORDER_COLLAPSE_CORRECTION)
            },
            _isElementVisible: function(elementOptions) {
                return elementOptions && elementOptions.visible
            },
            _resizeCore: function() {
                this.callBase();
                this._updateSortIndicatorPositions(this.element())
            },
            getHeadersRowHeight: function() {
                if (this._tableElement) {
                    var $headerRow = this._tableElement.find('.' + DATAGRID_HEADER_ROW_CLASS).first();
                    return $headerRow && $headerRow.height()
                }
                return 0
            },
            setColumnWidths: function(widths) {
                var that = this,
                    scrollLeft = that._scrollLeft;
                that.callBase(widths);
                that._scrollLeft = 0;
                that.scrollOffset(scrollLeft)
            },
            processSizeChanged: function() {
                var that = this,
                    $element = that.element();
                if (!utils.isDefined(that._headersHeight) || that._headersHeight !== $element.height()) {
                    that._headersHeight = $element.height();
                    that.sizeChanged.fire()
                }
            },
            getHeaderElement: function(index) {
                var columnElements = this.getColumnElements();
                return columnElements && columnElements.eq(index)
            },
            getColumnElements: function() {
                var that = this,
                    columnElements;
                if (that._tableElement) {
                    columnElements = that._tableElement.find('.' + DATAGRID_HEADER_ROW_CLASS).find('td');
                    if (columnElements.length)
                        return columnElements
                }
                return null
            },
            allowDragging: function(column, draggingPanels) {
                var i,
                    result = false,
                    columns = this.getColumns(),
                    draggableColumnCount = 0,
                    draggingPanel,
                    allowDrag = function(column) {
                        return column.allowReordering || column.allowGrouping || column.allowHiding
                    };
                for (i = 0; i < columns.length; i++)
                    if (allowDrag(columns[i]))
                        draggableColumnCount++;
                if (draggableColumnCount <= 1)
                    return false;
                else if (!draggingPanels)
                    return (this.option("allowColumnReordering") || this._columnsController.isColumnOptionUsed("allowReordering")) && column && column.allowReordering;
                for (i = 0; i < draggingPanels.length; i++) {
                    draggingPanel = draggingPanels[i];
                    if (draggingPanel && draggingPanel.allowDragging(column))
                        return true
                }
                return false
            },
            getColumns: function() {
                return this._columnsController.getVisibleColumns()
            },
            getBoundingRect: function() {
                var that = this,
                    offset,
                    $columnElements = that.getColumnElements();
                if ($columnElements && $columnElements.length) {
                    offset = that._tableElement.offset();
                    return {top: offset.top}
                }
                return null
            },
            getName: function() {
                return 'headers'
            },
            getColumnCount: function() {
                var $columnElements = this.getColumnElements();
                return $columnElements ? $columnElements.length : 0
            },
            init: function() {
                var that = this;
                that.callBase();
                that._scrollerWidth = 0;
                that.sizeChanged = $.Callbacks()
            },
            isVisible: function() {
                return this.option('showColumnHeaders')
            },
            setScrollerSpacing: function(width) {
                var that = this,
                    $element = that.element(),
                    rtlEnabled = that.option("rtlEnabled");
                that._scrollerWidth = width;
                $element && $element.css(rtlEnabled ? {paddingLeft: width} : {paddingRight: width})
            },
            optionChanged: function(args) {
                var that = this;
                switch (args.name) {
                    case'showColumnHeaders':
                    case'wordWrapEnabled':
                    case'showColumnLines':
                    case'sorting':
                        that.render();
                        args.handled = true;
                        break;
                    default:
                        that.callBase(args)
                }
            },
            getHeight: function() {
                var that = this,
                    $element = that.element();
                return $element ? $element.height() : 0
            },
            getContextMenuItems: function($targetElement) {
                var that = this,
                    $cell,
                    column,
                    onItemClick,
                    sortingOptions;
                if ($targetElement.closest("." + DATAGRID_HEADER_ROW_CLASS).length) {
                    $cell = $targetElement.closest("td");
                    column = $cell.length && that.getColumns()[$cell[0].cellIndex];
                    sortingOptions = that.option("sorting");
                    if (sortingOptions && sortingOptions.mode !== "none" && column && column.allowSorting) {
                        onItemClick = function(params) {
                            setTimeout(function() {
                                that._columnsController.changeSortOrder(column.index, params.itemData.value)
                            })
                        };
                        return [{
                                    text: sortingOptions.ascendingText,
                                    value: "asc",
                                    icon: DATAGRID_CONTEXT_MENU_SORT_ASC_ICON,
                                    onItemClick: onItemClick
                                }, {
                                    text: sortingOptions.descendingText,
                                    value: "desc",
                                    icon: DATAGRID_CONTEXT_MENU_SORT_DESC_ICON,
                                    onItemClick: onItemClick
                                }, {
                                    text: sortingOptions.clearText,
                                    value: "none",
                                    icon: DATAGRID_CONTEXT_MENU_SORT_NONE_ICON,
                                    onItemClick: onItemClick
                                }]
                    }
                    return []
                }
            },
            dispose: function() {
                this.callBase();
                clearTimeout(this._changeSortOrderTimeoutID)
            }
        });
        $.extend(dataGrid.__internals, {
            DATAGRID_CELL_CONTENT_CLASS: DATAGRID_CELL_CONTENT_CLASS,
            DATAGRID_HEADERS_ACTION_CLASS: DATAGRID_HEADERS_ACTION_CLASS,
            DATAGRID_HEADERS_CLASS: DATAGRID_HEADERS_CLASS,
            DATAGRID_HEADER_ROW_CLASS: DATAGRID_HEADER_ROW_CLASS,
            DATAGRID_NOWRAP_CLASS: DATAGRID_NOWRAP_CLASS,
            DATAGRID_BORDER_COLLAPSE_CORRECTION: DATAGRID_BORDER_COLLAPSE_CORRECTION
        });
        dataGrid.registerModule('columnHeaders', {
            defaultOptions: function() {
                return {
                        showColumnHeaders: true,
                        cellHintEnabled: true
                    }
            },
            views: {columnHeadersView: dataGrid.ColumnHeadersView}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.filterRow.js */
    (function($, DX) {
        var ui = DX.ui,
            events = ui.events,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var OPERATION_ICONS = {
                '=': 'filter-operation-equals',
                '<>': 'filter-operation-not-equals',
                '<': 'filter-operation-less',
                '<=': 'filter-operation-less-equal',
                '>': 'filter-operation-greater',
                '>=': 'filter-operation-greater-equal',
                'default': 'filter-operation-default',
                notcontains: 'filter-operation-not-contains',
                contains: 'filter-operation-contains',
                startswith: 'filter-operation-starts-with',
                endswith: 'filter-operation-ends-with'
            };
        var FILTERING_TIMEOUT = 700,
            DATAGRID_CLASS = "dx-datagrid",
            DATAGRID_FILTER_ROW_CLASS = "dx-datagrid-filter-row",
            DATAGRID_MENU_CLASS = "dx-menu",
            DATAGRID_MENU_IMAGE_CLASS = 'dx-menu-image',
            DATAGRID_CELL_CONTENT_CLASS = "dx-datagrid-text-content",
            DATAGRID_GROUP_SPACE_CLASS = "dx-datagrid-group-space",
            DATAGRID_EDITOR_WITH_MENU_CLASS = "dx-editor-with-menu",
            DATAGRID_EDITOR_CONTAINER_CLASS = "dx-editor-container",
            DATAGRID_COLUMN_LINES_CLASS = "dx-column-lines",
            DATAGRID_EDITOR_CELL_CLASS = "dx-editor-cell",
            DATAGRID_APPLY_BUTTON_CLASS = "dx-apply-button",
            DATAGRID_HIGHLIGHT_OUTLINE_CLASS = "dx-highlight-outline",
            DATAGRID_FOCUSED_CLASS = "dx-focused",
            DATAGRID_CELL_FOCUS_DISABLED_CLASS = "dx-cell-focus-disabled",
            TEXTEDITOR_CLASS = "dx-texteditor";
        var ColumnHeadersViewFilterRowExtender = {
                _columnOptionChanged: function(e) {
                    var that = this,
                        optionNames = e.optionNames,
                        visibleIndex,
                        column,
                        $cell,
                        $editor,
                        componentNames,
                        editor,
                        $menu;
                    if (dataGrid.checkChanges(optionNames, ['filterValue', 'selectedFilterOperation']) && e.columnIndex !== undefined) {
                        visibleIndex = that.getController('columns').getVisibleIndex(e.columnIndex);
                        column = that.getController('columns').columnOption(e.columnIndex);
                        $cell = that.element().find('.' + DATAGRID_FILTER_ROW_CLASS).children().eq(visibleIndex);
                        $editor = $cell.find("." + TEXTEDITOR_CLASS);
                        if (optionNames.filterValue)
                            if ($editor.length) {
                                componentNames = $editor.data("dxComponents");
                                editor = componentNames.length && $editor.data(componentNames[0]);
                                if (editor instanceof ui.Editor)
                                    editor && editor.option("value", column.filterValue)
                            }
                        if (optionNames.selectedFilterOperation)
                            if (visibleIndex >= 0 && column) {
                                $menu = $cell.find('.' + DATAGRID_MENU_CLASS);
                                if ($menu.length)
                                    that._updateFilterOperationChooser($menu, column, $editor.parent())
                            }
                        return
                    }
                    that.callBase(e)
                },
                isFilterRowVisible: function() {
                    return this._isElementVisible(this.option('filterRow'))
                },
                isVisible: function() {
                    return this.callBase() || this.isFilterRowVisible()
                },
                init: function() {
                    this.callBase();
                    this._applyFilterViewController = this.getController("applyFilter")
                },
                _renderContent: function($table) {
                    this.callBase($table);
                    var that = this,
                        columns = that._columnsController.getVisibleColumns(),
                        i,
                        rowElement;
                    if (that.isFilterRowVisible()) {
                        rowElement = that._createRow().appendTo($table);
                        rowElement.addClass(DATAGRID_FILTER_ROW_CLASS).toggleClass(DATAGRID_COLUMN_LINES_CLASS, that.option('showColumnLines'));
                        for (i = 0; i < columns.length; i++)
                            that._renderFilterRowCell(rowElement, columns[i])
                    }
                },
                _updateFilterOperationChooser: function($menu, column, $editorContainer) {
                    var that = this,
                        isCellWasFocused;
                    $menu.dxMenu({
                        activeStateEnabled: false,
                        selectionMode: "single",
                        cssClass: DATAGRID_CLASS + " " + DATAGRID_CELL_FOCUS_DISABLED_CLASS,
                        showFirstSubmenuMode: 'onHoverStay',
                        items: [{
                                disabled: column.filterOperations && column.filterOperations.length ? false : true,
                                icon: OPERATION_ICONS[column.selectedFilterOperation || "default"],
                                selectable: false,
                                items: that._getFilterOperationMenuItems(column)
                            }],
                        onItemClick: function(properties) {
                            var selectedFilterOperation = properties.itemData.name;
                            if (properties.itemData.items)
                                return;
                            if (selectedFilterOperation)
                                that._columnsController.columnOption(column.index, 'selectedFilterOperation', selectedFilterOperation);
                            else
                                that._columnsController.columnOption(column.index, {
                                    selectedFilterOperation: column.defaultSelectedFilterOperation,
                                    filterValue: undefined
                                });
                            that._applyFilterViewController.setHighLight($editorContainer, true);
                            that._focusEditor($editorContainer)
                        },
                        onSubmenuShown: function() {
                            isCellWasFocused = that._isEditorFocused($editorContainer);
                            that.getController('editorFactory').loseFocus()
                        },
                        onSubmenuHiding: function() {
                            $menu.blur();
                            $menu.dxMenu("instance").option("focusedElement", null);
                            isCellWasFocused && that._focusEditor($editorContainer)
                        },
                        rtlEnabled: that.option('rtlEnabled')
                    })
                },
                _isEditorFocused: function($container) {
                    return $container.hasClass(DATAGRID_FOCUSED_CLASS) || $container.parents("." + DATAGRID_FOCUSED_CLASS).length
                },
                _focusEditor: function($container, showCellFocus) {
                    this.getController('editorFactory').focus($container);
                    $container.find("input").focus()
                },
                _renderFilterOperationChooser: function($container, column, $editorContainer) {
                    var that = this,
                        $menu;
                    if (that.option("filterRow.showOperationChooser")) {
                        $container.addClass(DATAGRID_EDITOR_WITH_MENU_CLASS);
                        $menu = $('<div />').prependTo($container);
                        that._updateFilterOperationChooser($menu, column, $editorContainer)
                    }
                },
                _getFilterOperationMenuItems: function(column) {
                    var that = this,
                        result = [{}],
                        filterRowOptions = that.option("filterRow"),
                        operationDescriptions = filterRowOptions && filterRowOptions.operationDescriptions || {};
                    if (column.filterOperations && column.filterOperations.length) {
                        result = $.map(column.filterOperations, function(value) {
                            return {
                                    name: value,
                                    selected: (column.selectedFilterOperation || column.defaultFilterOperation) === value,
                                    text: operationDescriptions[value],
                                    icon: OPERATION_ICONS[value]
                                }
                        });
                        result.push({
                            name: null,
                            text: filterRowOptions && filterRowOptions.resetOperationText,
                            icon: OPERATION_ICONS['default']
                        })
                    }
                    return result
                },
                _renderFilterRowCell: function(rootElement, column) {
                    var that = this,
                        $cell = $('<td />').toggleClass(column.cssClass, !utils.isDefined(column.groupIndex)).appendTo(rootElement),
                        columnsController = that._columnsController,
                        $container,
                        $editorContainer,
                        $editor;
                    var updateFilterValue = function(that, column, value) {
                            if (value === '')
                                value = undefined;
                            if (!utils.isDefined(column.filterValue) && !utils.isDefined(value))
                                return;
                            that._applyFilterViewController.setHighLight($editorContainer, column.filterValue !== value);
                            column.filterValue = value;
                            columnsController.columnOption(column.index, 'filterValue', value)
                        };
                    if (column.command) {
                        $cell.html('&nbsp;');
                        if (column.command === "expand")
                            $cell.addClass(DATAGRID_GROUP_SPACE_CLASS)
                    }
                    else if (column.allowFiltering) {
                        $cell.addClass(DATAGRID_EDITOR_CELL_CLASS);
                        $container = $('<div />').appendTo($cell),
                        $editorContainer = $('<div />').addClass(DATAGRID_EDITOR_CONTAINER_CLASS).appendTo($container),
                        $editor = $('<div />').appendTo($editorContainer);
                        that.getController('editorFactory').createEditor($editor, $.extend({}, column, {
                            value: columnsController.isDataSourceApplied() ? column.filterValue : undefined,
                            setValue: function(value) {
                                updateFilterValue(that, column, value)
                            },
                            parentType: "filterRow",
                            showAllText: that.option('filterRow.showAllText'),
                            updateValueTimeout: that.option("filterRow.applyFilter") === "onClick" ? 0 : FILTERING_TIMEOUT,
                            width: null
                        }));
                        if (column.alignment)
                            $cell.find('input').first().css('text-align', column.alignment);
                        if (column.filterOperations && column.filterOperations.length)
                            that._renderFilterOperationChooser($container, column, $editorContainer)
                    }
                },
                optionChanged: function(args) {
                    var that = this;
                    switch (args.name) {
                        case'filterRow':
                        case'showColumnLines':
                        case'disabled':
                            that.render();
                            args.handled = true;
                            break;
                        default:
                            that.callBase(args);
                            break
                    }
                }
            };
        var DataControllerFilterRowExtender = {_calculateAdditionalFilter: function() {
                    var that = this,
                        filters = [that.callBase()],
                        columns = that._columnsController.getVisibleColumns();
                    $.each(columns, function() {
                        var filter;
                        if (this.allowFiltering && this.calculateFilterExpression && utils.isDefined(this.filterValue)) {
                            filter = this.calculateFilterExpression(this.filterValue, this.selectedFilterOperation || this.defaultFilterOperation);
                            filters.push(filter)
                        }
                    });
                    return that._combineFilters(filters)
                }};
        var ColumnsControllerFilterRowExtender = {_createCalculatedColumnOptions: function(columnOptions) {
                    var calculatedColumnOptions = this.callBase(columnOptions);
                    if (columnOptions.dataField)
                        $.extend(calculatedColumnOptions, {
                            calculateFilterExpression: function(value, selectedFilterOperation) {
                                var column = this,
                                    dataField = column.dataField,
                                    filter = null;
                                if (utils.isDefined(value))
                                    if (column.dataType === 'string' && !column.lookup)
                                        filter = [dataField, selectedFilterOperation || 'contains', value];
                                    else if (column.dataType === 'date') {
                                        if (utils.isDate(value)) {
                                            var dateStart = new Date(value.getFullYear(), value.getMonth(), value.getDate()),
                                                dateEnd = new Date(value.getFullYear(), value.getMonth(), value.getDate() + 1);
                                            switch (selectedFilterOperation) {
                                                case'<':
                                                    return [dataField, '<', dateStart];
                                                case'<=':
                                                    return [dataField, '<', dateEnd];
                                                case'>':
                                                    return [dataField, '>=', dateEnd];
                                                case'>=':
                                                    return [dataField, '>=', dateStart];
                                                case'<>':
                                                    return [[dataField, '<', dateStart], 'or', [dataField, '>=', dateEnd]];
                                                default:
                                                    return [[dataField, '>=', dateStart], 'and', [dataField, '<', dateEnd]]
                                            }
                                        }
                                    }
                                    else
                                        filter = [dataField, selectedFilterOperation || '=', value];
                                return filter
                            },
                            allowFiltering: true
                        });
                    else
                        $.extend(calculatedColumnOptions, {allowFiltering: !!columnOptions.calculateFilterExpression});
                    return calculatedColumnOptions
                }};
        dataGrid.ApplyFilterViewController = dataGrid.ViewController.inherit({
            _isOnClick: function() {
                return this.option("filterRow.applyFilter") === "onClick"
            },
            _getHeaderPanel: function() {
                if (!this._headerPanel)
                    this._headerPanel = this.getView("headerPanel");
                return this._headerPanel
            },
            setHighLight: function($element, value) {
                if (this._isOnClick()) {
                    $element && $element.toggleClass(DATAGRID_HIGHLIGHT_OUTLINE_CLASS, value);
                    this._getHeaderPanel().enableApplyButton(value)
                }
            },
            removeHighLights: function() {
                if (this._isOnClick()) {
                    var columnHeadersView = this.getView("columnHeadersView");
                    columnHeadersView.element().find("." + DATAGRID_FILTER_ROW_CLASS + " ." + DATAGRID_HIGHLIGHT_OUTLINE_CLASS).removeClass(DATAGRID_HIGHLIGHT_OUTLINE_CLASS);
                    this._getHeaderPanel().enableApplyButton(false)
                }
            }
        });
        dataGrid.registerModule('filterRow', {
            defaultOptions: function() {
                return {filterRow: {
                            visible: false,
                            showOperationChooser: true,
                            showAllText: Globalize.localize("dxDataGrid-filterRowShowAllText"),
                            resetOperationText: Globalize.localize("dxDataGrid-filterRowResetOperationText"),
                            applyFilter: "auto",
                            applyFilterText: Globalize.localize("dxDataGrid-applyFilterText"),
                            operationDescriptions: {
                                '=': Globalize.localize("dxDataGrid-filterRowOperationEquals"),
                                '<>': Globalize.localize("dxDataGrid-filterRowOperationNotEquals"),
                                '<': Globalize.localize("dxDataGrid-filterRowOperationLess"),
                                '<=': Globalize.localize("dxDataGrid-filterRowOperationLessOrEquals"),
                                '>': Globalize.localize("dxDataGrid-filterRowOperationGreater"),
                                '>=': Globalize.localize("dxDataGrid-filterRowOperationGreaterOrEquals"),
                                startswith: Globalize.localize("dxDataGrid-filterRowOperationStartsWith"),
                                contains: Globalize.localize("dxDataGrid-filterRowOperationContains"),
                                notcontains: Globalize.localize("dxDataGrid-filterRowOperationNotContains"),
                                endswith: Globalize.localize("dxDataGrid-filterRowOperationEndsWith")
                            }
                        }}
            },
            controllers: {applyFilter: dataGrid.ApplyFilterViewController},
            extenders: {
                controllers: {
                    data: DataControllerFilterRowExtender,
                    columns: ColumnsControllerFilterRowExtender
                },
                views: {
                    columnHeadersView: ColumnHeadersViewFilterRowExtender,
                    headerPanel: {
                        _isShowApplyFilterButton: function() {
                            var filterRowOptions = this.option("filterRow");
                            return filterRowOptions && filterRowOptions.visible && filterRowOptions.applyFilter === "onClick"
                        },
                        _renderCore: function() {
                            var that = this,
                                disabled = that._applyButton ? that._applyButton.option("disabled") : true;
                            that.callBase();
                            that._$applyButton && that._$applyButton.remove();
                            if (this._isShowApplyFilterButton()) {
                                that._$applyButton = $("<div>").addClass(DATAGRID_APPLY_BUTTON_CLASS).dxButton({
                                    disabled: disabled,
                                    hint: that.option("filterRow.applyFilterText"),
                                    icon: "apply-filter",
                                    onClick: function() {
                                        that._dataController._applyFilter();
                                        that._applyFilterViewController.removeHighLights()
                                    }
                                }).appendTo(that.element());
                                that._applyButton = that._$applyButton.dxButton("instance")
                            }
                        },
                        init: function() {
                            this.callBase();
                            this._dataController = this.getController("data");
                            this._applyFilterViewController = this.getController("applyFilter")
                        },
                        enableApplyButton: function(value) {
                            this._applyButton && this._applyButton.option("disabled", !value)
                        },
                        isVisible: function() {
                            return this.callBase() || this._isShowApplyFilterButton()
                        },
                        optionChanged: function(args) {
                            if (args.name === "filterRow") {
                                this.render();
                                args.handled = true
                            }
                            else
                                this.callBase(args)
                        }
                    }
                }
            }
        });
        $.extend(dataGrid.__internals, {
            DATAGRID_FILTER_ROW_CLASS: DATAGRID_FILTER_ROW_CLASS,
            DATAGRID_MENU_CLASS: DATAGRID_MENU_CLASS,
            DATAGRID_MENU_IMAGE_CLASS: DATAGRID_MENU_IMAGE_CLASS,
            DATAGRID_CELL_CONTENT_CLASS: DATAGRID_CELL_CONTENT_CLASS,
            DATAGRID_EDITOR_WITH_MENU_CLASS: DATAGRID_EDITOR_WITH_MENU_CLASS,
            DATAGRID_EDITOR_CONTAINER_CLASS: DATAGRID_EDITOR_CONTAINER_CLASS,
            DATAGRID_HIGHLIGHT_OUTLINE_CLASS: DATAGRID_HIGHLIGHT_OUTLINE_CLASS,
            DATAGRID_APPLY_BUTTON_CLASS: DATAGRID_APPLY_BUTTON_CLASS
        });
        dataGrid.ColumnHeadersViewFilterRowExtender = ColumnHeadersViewFilterRowExtender;
        dataGrid.DataControllerFilterRowExtender = DataControllerFilterRowExtender
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.headerPanel.js */
    (function($, DX) {
        var ui = DX.ui,
            events = ui.events,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_HEADER_PANEL_CLASS = "dx-datagrid-header-panel";
        dataGrid.HeaderPanel = dataGrid.ColumnsView.inherit({
            _renderCore: function() {
                this.element().addClass(DATAGRID_HEADER_PANEL_CLASS)
            },
            getHeaderPanel: function() {
                return this.element()
            },
            getHeight: function() {
                var $element = this.element();
                return $element ? $element.outerHeight(true) : 0
            },
            isVisible: function() {
                return false
            },
            optionChanged: function(args) {
                var that = this;
                switch (args.name) {
                    case'disabled':
                        that.render();
                        args.handled = true;
                        break;
                    default:
                        that.callBase(args)
                }
            }
        });
        $.extend(dataGrid.__internals, {DATAGRID_HEADER_PANEL_CLASS: DATAGRID_HEADER_PANEL_CLASS});
        dataGrid.registerModule('headerPanel', {
            defaultOptions: function() {
                return {}
            },
            views: {headerPanel: dataGrid.HeaderPanel}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.search.js */
    (function($, DX) {
        var ui = DX.ui,
            events = ui.events,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_SEARCH_PANEL_CLASS = "dx-datagrid-search-panel",
            FILTERING_TIMEOUT = 700,
            MARGIN_RIGHT = 10;
        dataGrid.registerModule('search', {
            defaultOptions: function() {
                return {searchPanel: {
                            visible: false,
                            width: 160,
                            placeholder: Globalize.localize("dxDataGrid-searchPanelPlaceholder"),
                            highlightSearchText: true,
                            text: ""
                        }}
            },
            extenders: {
                controllers: {data: function() {
                        var calculateSearchFilter = function(that, text) {
                                var i,
                                    column,
                                    columns = that._columnsController.getColumns(),
                                    filterValue,
                                    lookup,
                                    filters = [];
                                if (!text)
                                    return null;
                                for (i = 0; i < columns.length; i++) {
                                    column = columns[i];
                                    if (column.allowFiltering && column.calculateFilterExpression) {
                                        lookup = column.lookup;
                                        if (lookup && lookup.items) {
                                            filterValue = column.parseValue.call(lookup, text);
                                            DX.data.query(lookup.items).filter(column.calculateFilterExpression.call({
                                                dataField: lookup.displayExpr,
                                                dataType: lookup.dataType
                                            }, filterValue)).enumerate().done(function(items) {
                                                var i,
                                                    valueGetter = DX.data.utils.compileGetter(lookup.valueExpr),
                                                    value;
                                                for (i = 0; i < items.length; i++) {
                                                    value = valueGetter(items[i]);
                                                    filters.push(column.calculateFilterExpression(value))
                                                }
                                            })
                                        }
                                        else {
                                            filterValue = column.parseValue ? column.parseValue(text) : text;
                                            if (filterValue !== undefined)
                                                filters.push(column.calculateFilterExpression(filterValue))
                                        }
                                    }
                                }
                                return that._combineFilters(filters, 'or')
                            };
                        return {
                                publicMethods: function() {
                                    return this.callBase().concat(['searchByText'])
                                },
                                _calculateAdditionalFilter: function() {
                                    var that = this,
                                        filter = that.callBase(),
                                        searchFilter = calculateSearchFilter(that, that.option("searchPanel.text"));
                                    return that._combineFilters([filter, searchFilter])
                                },
                                searchByText: function(text) {
                                    this.option("searchPanel.text", text)
                                },
                                optionChanged: function(args) {
                                    var that = this;
                                    switch (args.fullName) {
                                        case"searchPanel.text":
                                        case"searchPanel":
                                            that._applyFilter();
                                            args.handled = true;
                                            break;
                                        default:
                                            that.callBase(args)
                                    }
                                }
                            }
                    }()},
                views: {headerPanel: function() {
                        var getSearchPanelOptions = function(that) {
                                return that.option('searchPanel')
                            };
                        return {
                                _renderSearchPanel: function() {
                                    var that = this,
                                        $element = that.element(),
                                        dataController = that.getController('data'),
                                        searchPanelOptions = getSearchPanelOptions(that);
                                    if (searchPanelOptions && searchPanelOptions.visible) {
                                        if (!that._$searchPanel)
                                            that._$searchPanel = $('<div/>').addClass(DATAGRID_SEARCH_PANEL_CLASS).prependTo($element);
                                        else
                                            that._$searchPanel.show();
                                        that.getController('editorFactory').createEditor(that._$searchPanel, {
                                            width: searchPanelOptions.width,
                                            placeholder: searchPanelOptions.placeholder,
                                            parentType: "searchPanel",
                                            value: that.option("searchPanel.text"),
                                            updateValueTimeout: FILTERING_TIMEOUT,
                                            setValue: function(value) {
                                                dataController.searchByText(value)
                                            }
                                        });
                                        that.resize()
                                    }
                                    else
                                        that._$searchPanel && that._$searchPanel.hide()
                                },
                                _renderCore: function() {
                                    this.callBase();
                                    this._renderSearchPanel()
                                },
                                focus: function() {
                                    var textBox = this._$searchPanel.dxTextBox("instance");
                                    if (textBox)
                                        textBox.focus()
                                },
                                isVisible: function() {
                                    var searchPanelOptions = getSearchPanelOptions(this);
                                    return this.callBase() || searchPanelOptions && searchPanelOptions.visible
                                },
                                optionChanged: function(args) {
                                    if (args.name === "searchPanel") {
                                        this._renderSearchPanel();
                                        args.handled = true
                                    }
                                    else
                                        this.callBase(args)
                                }
                            }
                    }()}
            }
        });
        dataGrid.__internals = $.extend({}, dataGrid.__internals, {DATAGRID_SEARCH_PANEL_CLASS: DATAGRID_SEARCH_PANEL_CLASS})
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.rowsView.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_CELL_CONTENT_CLASS = "dx-datagrid-text-content",
            DATAGRID_GROUP_ROW_CLASS = "dx-group-row",
            DATAGRID_SEARCH_TEXT_CLASS = "dx-datagrid-search-text",
            DATAGRID_ROWS_VIEW_CLASS = "dx-datagrid-rowsview",
            DATAGRID_TABLE_CLASS = "dx-datagrid-table",
            DATAGRID_DATA_ROW_CLASS = "dx-data-row",
            DATAGRID_FREESPACE_CLASS = "dx-freespace-row",
            DATAGRID_NODATA_TEXT_CLASS = "dx-datagrid-nodata",
            DATAGRID_CONTENT_CLASS = "dx-datagrid-content",
            DATAGRID_NOWRAP_CLASS = "dx-datagrid-nowrap",
            DATAGRID_ROW_LINES_CLASS = "dx-row-lines",
            DATAGRID_COLUMN_LINES_CLASS = "dx-column-lines",
            DATAGRID_ROW_ALTERNATION_CLASS = "dx-row-alt",
            DATAGRID_SCROLLABLE_CONTAINER = "dx-scrollable-container",
            DATAGRID_SCROLLABLE_CONTENT = "dx-scrollable-content",
            DATAGRID_LOADPANEL_HIDE_TIMEOUT = 200;
        var appendElementTemplate = {render: function(element, container) {
                    container.append(element)
                }};
        var createScrollableOptions = function(that) {
                var useNativeScrolling = that.option("scrolling.useNativeScrolling");
                var options = {
                        direction: "both",
                        rtlEnabled: that.option("rtlEnabled") || DX.rtlEnabled,
                        disabled: that.option("disabled"),
                        bounceEnabled: false,
                        useKeyboard: false
                    };
                if (useNativeScrolling === undefined)
                    useNativeScrolling = true;
                if (useNativeScrolling !== 'auto') {
                    options.useNative = !!useNativeScrolling;
                    options.useSimulatedScrollbar = !useNativeScrolling
                }
                return options
            };
        dataGrid.createScrollableOptions = createScrollableOptions;
        dataGrid.RowsView = dataGrid.ColumnsView.inherit({
            _getDefaultTemplate: function(column) {
                var that = this;
                switch (column.command) {
                    case"empty":
                        return function(container) {
                                container.html('&nbsp;')
                            };
                    default:
                        return function(container, options) {
                                var isDataTextEmpty = !options.text && options.rowType === "data",
                                    text = isDataTextEmpty ? "&nbsp;" : options.text;
                                if (column.encodeHtml && !isDataTextEmpty)
                                    container.text(text);
                                else
                                    container.html(text)
                            }
                }
            },
            _getDefaultGroupTemplate: function() {
                var that = this,
                    summaryTexts = that.option("summary.texts");
                return function(container, options) {
                        var data = options.data,
                            i,
                            summaryItem,
                            text = options.column.caption + ": " + options.text;
                        if (options.summaryItems && options.summaryItems.length) {
                            text += " (";
                            for (i = 0; i < options.summaryItems.length; i++) {
                                summaryItem = options.summaryItems[i];
                                text += (i > 0 ? ", " : "") + dataGrid.getSummaryText(summaryItem, summaryTexts)
                            }
                            text += ")"
                        }
                        if (data)
                            if (options.groupContinuedMessage && options.groupContinuesMessage)
                                text += ' (' + options.groupContinuedMessage + '. ' + options.groupContinuesMessage + ')';
                            else if (options.groupContinuesMessage)
                                text += ' (' + options.groupContinuesMessage + ')';
                            else if (options.groupContinuedMessage)
                                text += ' (' + options.groupContinuedMessage + ')';
                        container.css('text-align', that.option('rtlEnabled') ? 'right' : 'left').text(text)
                    }
            },
            _update: function(change){},
            _createRow: function(rowOptions) {
                var $row = this.callBase(),
                    isGroup,
                    isDataRow;
                if (rowOptions) {
                    isGroup = rowOptions.rowType === 'group';
                    isDataRow = rowOptions.rowType === 'data';
                    $row.toggleClass(DATAGRID_DATA_ROW_CLASS, isDataRow).toggleClass(DATAGRID_ROW_ALTERNATION_CLASS, isDataRow && rowOptions.dataIndex % 2 === 1 && this.option('rowAlternationEnabled')).toggleClass(DATAGRID_ROW_LINES_CLASS, isDataRow && this.option('showRowLines')).toggleClass(DATAGRID_COLUMN_LINES_CLASS, this.option('showColumnLines')).toggleClass(DATAGRID_GROUP_ROW_CLASS, isGroup)
                }
                return $row
            },
            _highlightSearchText: function(cellElement, isEquals) {
                var that = this,
                    $parent,
                    searchHTML,
                    searchText = that.option("searchPanel.text");
                if (searchText && that.option("searchPanel.highlightSearchText")) {
                    searchHTML = $('<div>').text(searchText).html();
                    $parent = cellElement.parent();
                    if (!$parent.length)
                        $parent = $('<div>').append(cellElement);
                    $.each($parent.find(":dxicontains('" + searchText + "')"), function(index, element) {
                        $.each($(element).contents(), function(index, content) {
                            if (content.nodeType !== 3)
                                return;
                            var highlightSearchTextInTextNode = function($content, searchText) {
                                    var $searchTextSpan = $('<span />').addClass(DATAGRID_SEARCH_TEXT_CLASS),
                                        text = $content.text(),
                                        index = text.toLowerCase().indexOf(searchText.toLowerCase());
                                    if (index >= 0) {
                                        if ($content[0].textContent)
                                            $content[0].textContent = text.substr(0, index);
                                        else
                                            $content[0].nodeValue = text.substr(0, index);
                                        $content.after($searchTextSpan.text(text.substr(index, searchText.length)));
                                        $content = $(document.createTextNode(text.substr(index + searchText.length))).insertAfter($searchTextSpan);
                                        return highlightSearchTextInTextNode($content, searchText)
                                    }
                                };
                            if (isEquals) {
                                if ($(content).text().toLowerCase() === searchText.toLowerCase())
                                    $(this).replaceWith($('<span />').addClass(DATAGRID_SEARCH_TEXT_CLASS).text($(content).text()))
                            }
                            else
                                highlightSearchTextInTextNode($(content), searchText)
                        })
                    })
                }
            },
            _renderTemplate: function(container, template, options) {
                var that = this,
                    renderingTemplate;
                if ($.isFunction(template))
                    renderingTemplate = {render: function(options, container) {
                            template(container, options)
                        }};
                else {
                    if (!that._templatesCache[template])
                        that._templatesCache[template] = that.getTemplate(template);
                    renderingTemplate = that._templatesCache[template]
                }
                if (renderingTemplate)
                    if (options.denyRenderToDetachedContainer || renderingTemplate.denyRenderToDetachedContainer)
                        that._delayedTemplates.push({
                            template: renderingTemplate,
                            container: container,
                            options: options
                        });
                    else {
                        renderingTemplate.render(options, container);
                        return true
                    }
                return false
            },
            _getColumnTemplate: function(options) {
                var that = this,
                    column = options.column,
                    template;
                if (options.rowType === 'group' && column.groupIndex !== undefined)
                    template = column.groupCellTemplate || that._getDefaultGroupTemplate();
                else
                    template = column.cellTemplate || that._getDefaultTemplate(column);
                return template
            },
            _updateCell: function($cell, parameters) {
                var that = this,
                    column = parameters.column,
                    isEquals = column.dataType !== "string";
                if (column.allowFiltering)
                    that._highlightSearchText($cell, isEquals);
                if (parameters.rowType === "data")
                    that._cellPrepared($cell, parameters)
            },
            _createCell: function(value, item, rowIndex, column, columnIndex) {
                var that = this,
                    template,
                    groupingOptions = that.option('grouping'),
                    scrollingMode = that.option('scrolling.mode'),
                    data = item && item.data,
                    summaryCells = item && item.summaryCells,
                    displayValue = column.lookup ? column.lookup.calculateCellValue(value) : value,
                    $cell = $('<td />').addClass(column.cssClass),
                    parameters = {
                        value: value,
                        displayValue: displayValue,
                        row: item,
                        key: item && item.key,
                        data: data,
                        rowType: item && item.rowType,
                        values: item && item.values,
                        text: !utils.isDefined(column.command) && dataGrid.formatValue(displayValue, column),
                        rowIndex: rowIndex,
                        columnIndex: columnIndex,
                        column: column,
                        summaryItems: summaryCells && summaryCells[columnIndex],
                        resized: column.resizedCallbacks
                    };
                if (utils.isDefined(column.groupIndex) && scrollingMode !== 'virtual' && scrollingMode !== 'infinite') {
                    parameters.groupContinuesMessage = data && data.isContinuationOnNextPage && groupingOptions && groupingOptions.groupContinuesMessage;
                    parameters.groupContinuedMessage = data && data.isContinuation && groupingOptions && groupingOptions.groupContinuedMessage
                }
                template = that._getColumnTemplate(parameters);
                if (that._renderTemplate($cell, template, parameters))
                    that._updateCell($cell, parameters);
                return $cell
            },
            _cellPrepared: function($cell, options) {
                var that = this,
                    cellPrepared,
                    alignment = options.column.alignment,
                    extendOptions = function(event) {
                        return {
                                cellElement: $(event.target).closest('td'),
                                jQueryEvent: event,
                                eventType: event.type
                            }
                    };
                if (alignment)
                    $cell[0].style.textAlign = alignment;
                if (that.option("onCellClick"))
                    $cell.on("dxclick", function(e) {
                        that.executeAction("onCellClick", $.extend({}, options, extendOptions(e)))
                    });
                if (that.option("onCellHoverChanged")) {
                    $cell.on("mouseover", function(e) {
                        that.executeAction("onCellHoverChanged", $.extend({}, options, extendOptions(e)))
                    });
                    $cell.on("mouseout", function(e) {
                        that.executeAction("onCellHoverChanged", $.extend({}, options, extendOptions(e)))
                    })
                }
                this.component._suppressDeprecatedWarnings();
                cellPrepared = that.option("cellPrepared");
                this.component._resumeDeprecatedWarnings();
                cellPrepared && cellPrepared($cell, options);
                options.cellElement = $cell;
                that.executeAction("onCellPrepared", options)
            },
            _rowPrepared: function($row, options) {
                var that = this,
                    rowPrepared;
                this.component._suppressDeprecatedWarnings();
                rowPrepared = that.option("rowPrepared");
                this.component._resumeDeprecatedWarnings();
                rowPrepared && rowPrepared($row, options);
                options.rowElement = $row;
                this.executeAction("onRowPrepared", options)
            },
            _renderScrollable: function($table) {
                var that = this,
                    $element = that.element();
                if (!utils.isDefined(that._tableElement)) {
                    that._tableElement = $table;
                    if (!$element.children().length)
                        $element.append('<div />');
                    that._renderLoadPanel($element);
                    that._renderScrollableCore($element)
                }
            },
            _handleScroll: function(e) {
                var that = this;
                that._scrollTop = e.scrollOffset.top;
                that._scrollLeft = e.scrollOffset.left;
                that.scrollOffsetChanged.fire(e.scrollOffset)
            },
            _renderScrollableCore: function($element) {
                var that = this,
                    dxScrollableOptions = createScrollableOptions(that),
                    scrollHandler = $.proxy(that._handleScroll, that);
                dxScrollableOptions.onScroll = scrollHandler;
                dxScrollableOptions.onStop = scrollHandler;
                $element.dxScrollable(dxScrollableOptions);
                that._scrollable = $element.data('dxScrollable');
                that._scrollableContainer = that._scrollable._$container
            },
            _renderLoadPanel: function($element) {
                var that = this,
                    loadPanelOptions;
                if ($element.dxLoadPanel) {
                    loadPanelOptions = that.option("loadPanel");
                    if (loadPanelOptions && loadPanelOptions.enabled) {
                        loadPanelOptions = $.extend({
                            shading: false,
                            message: loadPanelOptions.text,
                            position: {of: $element},
                            container: $element
                        }, loadPanelOptions);
                        if (that._loadPanel)
                            that._loadPanel.option(loadPanelOptions);
                        else
                            that._loadPanel = $('<div />').appendTo($element.parent()).dxLoadPanel(loadPanelOptions).dxLoadPanel('instance')
                    }
                    else {
                        that._loadPanel && that._loadPanel.element().remove();
                        that._loadPanel = null
                    }
                }
            },
            _renderContent: function(contentElement, tableElement) {
                return contentElement.replaceWith($('<div>').addClass(DATAGRID_CONTENT_CLASS).append(tableElement))
            },
            _updateContent: function(contentElement, change, tableElement) {
                var that = this,
                    changeType = change && change.changeType,
                    executors = [];
                switch (changeType) {
                    case'update':
                        $.each(change.rowIndices, function(index, rowIndex) {
                            var $newRowElement = that._getRowElements(tableElement).eq(index),
                                changeType = change.changeTypes[index],
                                item = change.items && change.items[index];
                            executors.push(function() {
                                var $rowsElement = that._getRowElements(),
                                    $rowElement = $rowsElement.eq(rowIndex);
                                switch (changeType) {
                                    case'update':
                                        if (utils.isDefined(item.visible) && item.visible !== $rowElement.is(":visible"))
                                            $rowElement.toggle(item.visible);
                                        else
                                            $rowElement.replaceWith($newRowElement);
                                        break;
                                    case'insert':
                                        if (!$rowsElement.length)
                                            $newRowElement.prependTo(that._tableElement);
                                        else if ($rowElement.length)
                                            $newRowElement.insertBefore($rowElement);
                                        else
                                            $newRowElement.insertAfter($rowsElement.last());
                                        break;
                                    case'remove':
                                        $rowElement.remove();
                                        break
                                }
                            })
                        });
                        $.each(executors, function() {
                            this()
                        });
                        break;
                    default:
                        that._tableElement = tableElement;
                        contentElement.addClass(DATAGRID_CONTENT_CLASS);
                        that._renderContent(contentElement, tableElement);
                        break
                }
            },
            _renderFreeSpaceRow: function(tableElement, columns) {
                var that = this,
                    i,
                    freeSpaceRowElement = that._createRow(),
                    column;
                freeSpaceRowElement.addClass(DATAGRID_FREESPACE_CLASS).toggleClass(DATAGRID_COLUMN_LINES_CLASS, that.option('showColumnLines'));
                for (i = 0; i < columns.length; i++) {
                    column = {
                        command: columns[i].command === 'expand' ? columns[i].command : '',
                        cssClass: utils.isDefined(columns[i].cssClass) ? columns[i].cssClass : ''
                    };
                    freeSpaceRowElement.append(that._createCell(null, null, null, column))
                }
                that._appendRow(tableElement, freeSpaceRowElement)
            },
            _needUpdateRowHeight: function(itemsCount) {
                return itemsCount > 0 && !this._rowHeight
            },
            _updateRowHeight: function() {
                var that = this,
                    tableElement = that._tableElement,
                    tableHeight,
                    itemsCount = that._dataController.items().length,
                    freeSpaceRowElement;
                if (tableElement && that._needUpdateRowHeight(itemsCount)) {
                    tableHeight = tableElement.outerHeight();
                    freeSpaceRowElement = that._getFreeSpaceRowElement();
                    if (freeSpaceRowElement && freeSpaceRowElement.is(':visible'))
                        tableHeight -= freeSpaceRowElement.outerHeight();
                    that._rowHeight = tableHeight / itemsCount
                }
            },
            _findContentElement: function() {
                var $element = this.element(),
                    $scrollableContent;
                if ($element) {
                    $scrollableContent = $element.find('.dx-scrollable-content');
                    if (!$scrollableContent)
                        $scrollableContent = $element;
                    return $scrollableContent.children().first()
                }
            },
            _getRowElements: function(tableElement) {
                tableElement = tableElement || this._tableElement;
                return tableElement && tableElement.children('tbody').children('.dx-row').not('.' + DATAGRID_FREESPACE_CLASS)
            },
            _getFreeSpaceRowElement: function() {
                var tableElement = this._tableElement;
                return tableElement && tableElement.children('tbody').children('.' + DATAGRID_FREESPACE_CLASS)
            },
            _appendRow: function($table, $row) {
                var that = this;
                if (that.option("rowTemplate") && that._delayedTemplates.length && $row)
                    that._delayedTemplates.push({
                        container: $table,
                        template: appendElementTemplate,
                        options: $row
                    });
                else
                    $table.append($row)
            },
            _updateNoDataText: function() {
                var noDataElement = this.element().find('.' + DATAGRID_NODATA_TEXT_CLASS),
                    isVisible = !this._dataController.items().length,
                    isLoading = this._dataController.isLoading(),
                    rtlEnabled = this.option("rtlEnabled"),
                    noDataElementCSSConfig = {};
                if (!noDataElement.length)
                    noDataElement = $('<span>').addClass(DATAGRID_NODATA_TEXT_CLASS).hide().appendTo(this.element());
                noDataElement.text(this.option("noDataText"));
                noDataElementCSSConfig = {
                    marginTop: -Math.floor(noDataElement.height() / 2),
                    marginRight: rtlEnabled ? -Math.floor(noDataElement.width() / 2) : 0,
                    marginLeft: rtlEnabled ? 0 : -Math.floor(noDataElement.width() / 2)
                };
                noDataElement.css(noDataElementCSSConfig);
                if (isVisible && !isLoading)
                    noDataElement.show();
                else
                    noDataElement.hide()
            },
            _createTable: function() {
                var that = this;
                return that.callBase.apply(that, arguments).on("dxclick", '.dx-row', that.createAction(function(e) {
                        var jQueryEvent = e.jQueryEvent;
                        if (!$(jQueryEvent.target).closest('a').length) {
                            e.rowIndex = that.getRowIndex(jQueryEvent.currentTarget);
                            e.rowElement = $(jQueryEvent.currentTarget);
                            that._rowClick(e)
                        }
                    }))
            },
            _rowClick: function(e) {
                var item = this._dataController.items()[e.rowIndex] || {};
                this.executeAction("onRowClick", $.extend({
                    columns: this._columnsController.getVisibleColumns(),
                    evaluate: function(expr) {
                        var getter = DX.data.utils.compileGetter(expr);
                        return getter(item.data)
                    }
                }, e, item))
            },
            _renderCells: function(item, options) {
                var $groupCell,
                    $cells = [],
                    i,
                    columns = options.columns,
                    rowIndex = item.rowIndex,
                    isExpanded,
                    groupEmptyCellsCount,
                    groupColumn;
                if (item.rowType === 'group') {
                    groupEmptyCellsCount = (item.groupIndex || 0) + options.columnsCountBeforeGroups;
                    for (i = 0; i <= groupEmptyCellsCount; i++) {
                        if (i === groupEmptyCellsCount && columns[i].allowCollapsing && options.scrollingMode !== "infinite")
                            isExpanded = !!item.isExpanded;
                        else
                            isExpanded = null;
                        $cells.push(this._createCell(isExpanded, item, rowIndex, {
                            command: "expand",
                            cssClass: columns[i].cssClass
                        }))
                    }
                    groupColumn = $.extend({}, columns[groupEmptyCellsCount], {
                        command: null,
                        cssClass: null
                    });
                    $groupCell = this._createCell(item.values[item.groupIndex], item, rowIndex, groupColumn, groupEmptyCellsCount);
                    $groupCell.attr('colspan', columns.length - groupEmptyCellsCount - 1);
                    $cells.push($groupCell)
                }
                else if (item.values)
                    for (i = 0; i < columns.length; i++)
                        $cells.push(this._createCell(item.values[i], item, rowIndex, columns[i], i));
                return $cells
            },
            _renderTable: function(items) {
                var itemsLength = items.length,
                    item,
                    $row,
                    i,
                    $cells,
                    columnsCountBeforeGroups = 0,
                    columns = this._columnsController.getVisibleColumns(),
                    groupColumns = this._columnsController.getGroupColumns(),
                    rowTemplate = this.option("rowTemplate"),
                    scrollingMode = this.option("scrolling.mode"),
                    $table = this._createTable(columns);
                for (i = 0; i < columns.length; i++)
                    if (columns[i].command === 'expand') {
                        columnsCountBeforeGroups = i;
                        break
                    }
                for (i = 0; i < itemsLength; i++) {
                    item = items[i];
                    if (!utils.isDefined(item.groupIndex) && rowTemplate)
                        this._renderTemplate($table, rowTemplate, $.extend({columns: columns}, item));
                    else {
                        $cells = this._renderCells(item, {
                            columns: columns,
                            scrollingMode: scrollingMode,
                            columnsCountBeforeGroups: columnsCountBeforeGroups,
                            groupColumns: groupColumns
                        });
                        $row = this._createRow(item);
                        $row.append($cells);
                        this._rowPrepared($row, $.extend({columns: columns}, item));
                        this._appendRow($table, $row)
                    }
                }
                if (rowTemplate)
                    this._highlightSearchText($table);
                this._renderFreeSpaceRow($table, columns);
                return $table
            },
            _renderCore: function(change) {
                var that = this,
                    items = change && change.items || that._dataController.items(),
                    $table,
                    $content,
                    $element = that.element(),
                    $root = $element.parent();
                change = change || {};
                $element.addClass(DATAGRID_ROWS_VIEW_CLASS).toggleClass(DATAGRID_NOWRAP_CLASS, !that.option("wordWrapEnabled"));
                $table = that._renderTable(items);
                that._renderScrollable($table);
                $content = that._findContentElement();
                that._updateContent($content, change, $table);
                if (!$root || $root.parent().length)
                    that.renderDelayedTemplates();
                that._lastColumnWidths = null
            },
            _getTableElements: function() {
                return this.element().find("> ." + DATAGRID_SCROLLABLE_CONTAINER + " > ." + DATAGRID_SCROLLABLE_CONTENT + "> ." + DATAGRID_CONTENT_CLASS + "> ." + DATAGRID_TABLE_CLASS)
            },
            getRowIndex: function($row) {
                return this._getRowElements().index($row)
            },
            getRow: function(index) {
                var rows = this._getRowElements();
                if (rows.length > index)
                    return $(rows[index])
            },
            getCell: function(cellPosition) {
                var rows = this._getRowElements(),
                    cells;
                if (rows.length > 0 && cellPosition.rowIndex >= 0) {
                    cellPosition.rowIndex = cellPosition.rowIndex < rows.length ? cellPosition.rowIndex : rows.length - 1;
                    cells = rows[cellPosition.rowIndex].cells;
                    if (cells && cells.length > 0)
                        return $(cells[cells.length > cellPosition.columnIndex ? cellPosition.columnIndex : cells.length - 1])
                }
            },
            updateFreeSpaceRowHeight: function() {
                var that = this,
                    elementHeight,
                    contentElement = that._findContentElement(),
                    freeSpaceRowElement = that._getFreeSpaceRowElement(),
                    contentHeight = 0,
                    freespaceRowCount,
                    scrollingMode,
                    resultHeight;
                if (freeSpaceRowElement && contentElement) {
                    freeSpaceRowElement.hide();
                    elementHeight = that.element().height();
                    contentHeight = contentElement.outerHeight();
                    resultHeight = elementHeight - contentHeight - that.getScrollbarWidth(true);
                    if (that._dataController.items().length > 0) {
                        if (resultHeight > 0 || !that._dataController.items().length) {
                            freeSpaceRowElement.height(resultHeight);
                            freeSpaceRowElement.show()
                        }
                        else if (!that._hasHeight) {
                            freespaceRowCount = that._dataController.pageSize() - that._dataController.items().length;
                            scrollingMode = that.option('scrolling.mode');
                            if (freespaceRowCount > 0 && that._dataController.pageCount() > 1 && scrollingMode !== 'virtual' && scrollingMode !== 'infinite') {
                                freeSpaceRowElement.height(freespaceRowCount * that._rowHeight);
                                freeSpaceRowElement.show()
                            }
                        }
                    }
                    else {
                        freeSpaceRowElement.height(0);
                        freeSpaceRowElement.show()
                    }
                }
            },
            _columnOptionChanged: function(e) {
                var optionNames = e.optionNames;
                if (e.changeTypes.grouping)
                    return;
                if (optionNames.width || optionNames.visibleWidth) {
                    this.callBase(e);
                    this._fireColumnResizedCallbacks()
                }
            },
            getScrollable: function() {
                return this._scrollable
            },
            callbackNames: function() {
                return ['scrollOffsetChanged']
            },
            init: function() {
                var that = this,
                    dataController = that.getController('data');
                that.callBase();
                that._editorFactoryController = that.getController("editorFactory");
                that._rowHeight = 0;
                that._scrollTop = 0;
                that._scrollLeft = 0;
                that._hasHeight = false;
                dataController.loadingChanged.add(function(isLoading, messageText) {
                    that.setLoading(isLoading, messageText)
                });
                that._delayedTemplates = [];
                that._templatesCache = {};
                that.createAction("onRowClick");
                that.createAction("onCellClick");
                that.createAction("onCellHoverChanged", {excludeValidators: ["disabled", "readOnly"]});
                that.createAction("onCellPrepared", {excludeValidators: ["designMode", "disabled", "readOnly"]});
                that.createAction("onRowPrepared", {excludeValidators: ["designMode", "disabled", "readOnly"]});
                var scrollToCurrentPageHandler = function() {
                        that.scrollToPage(dataController.pageIndex())
                    };
                dataController.pageIndexChanged.add(scrollToCurrentPageHandler);
                dataController.pageSizeChanged.add(scrollToCurrentPageHandler);
                dataController.filterChanged.add(scrollToCurrentPageHandler);
                dataController.dataSourceChanged.add(function() {
                    that._handleScroll({scrollOffset: {
                            top: that._scrollTop,
                            left: that._scrollLeft
                        }})
                })
            },
            _handleDataChanged: function(change) {
                var that = this;
                switch (change.changeType) {
                    case'refresh':
                    case'prepend':
                    case'append':
                    case'update':
                        that.render(null, change);
                        break;
                    default:
                        that._update(change);
                        break
                }
            },
            publicMethods: function() {
                return ['isScrollbarVisible', 'getTopVisibleRowData', 'getScrollbarWidth', 'getCellElement']
            },
            contentWidth: function() {
                return this.element().width() - this.getScrollbarWidth()
            },
            renderDelayedTemplates: function() {
                var templateParameters,
                    delayedTemplates = this._delayedTemplates;
                while (delayedTemplates.length) {
                    templateParameters = delayedTemplates.shift();
                    templateParameters.template.render(templateParameters.options, templateParameters.container);
                    if (templateParameters.options.column)
                        this._updateCell(templateParameters.container, templateParameters.options)
                }
            },
            getScrollbarWidth: function(isHorizontal) {
                var scrollableContainer = this._scrollableContainer && this._scrollableContainer.get(0),
                    scrollbarWidth = 0;
                if (scrollableContainer)
                    if (!isHorizontal)
                        scrollbarWidth = scrollableContainer.offsetWidth - scrollableContainer.clientWidth;
                    else
                        scrollbarWidth = scrollableContainer.offsetHeight - scrollableContainer.clientHeight;
                return scrollbarWidth
            },
            _fireColumnResizedCallbacks: function() {
                var that = this,
                    lastColumnWidths = that._lastColumnWidths || [],
                    columnWidths = [],
                    columns = that._columnsController.getVisibleColumns(),
                    i;
                for (i = 0; i < columns.length; i++) {
                    columnWidths[i] = columns[i].visibleWidth;
                    if (columns[i].resizedCallbacks && !utils.isDefined(columns[i].groupIndex) && lastColumnWidths[i] !== columnWidths[i])
                        columns[i].resizedCallbacks.fire(columnWidths[i])
                }
                that._lastColumnWidths = columnWidths
            },
            _resizeCore: function() {
                var that = this,
                    dxScrollable;
                that.callBase();
                that._fireColumnResizedCallbacks();
                that._updateRowHeight();
                that._updateNoDataText();
                that.updateFreeSpaceRowHeight();
                dxScrollable = that.element().data('dxScrollable');
                if (dxScrollable)
                    dxScrollable.update();
                that.setLoading(that._dataController.isLoading())
            },
            scrollToPage: function(pageIndex) {
                var that = this,
                    scrollingMode = that.option('scrolling.mode'),
                    dataController = that._dataController,
                    pageSize = dataController ? dataController.pageSize() : 0,
                    scrollPosition;
                if (scrollingMode === 'virtual' || scrollingMode === 'infinite')
                    scrollPosition = pageIndex * that._rowHeight * pageSize;
                else
                    scrollPosition = 0;
                that.scrollTo({
                    y: scrollPosition,
                    x: that._scrollLeft
                })
            },
            scrollTo: function(location) {
                var $element = this.element(),
                    dxScrollable = $element && $element.data('dxScrollable');
                if (dxScrollable)
                    dxScrollable.scrollTo(location)
            },
            height: function(height) {
                var that = this,
                    $element = this.element(),
                    freeSpaceRowElement;
                if (utils.isDefined(height)) {
                    that._hasHeight = height !== 'auto';
                    if ($element)
                        $element.height(height);
                    freeSpaceRowElement = this._getFreeSpaceRowElement();
                    freeSpaceRowElement && freeSpaceRowElement.hide()
                }
                else
                    return $element ? $element.height() : 0
            },
            setLoading: function(isLoading, messageText) {
                var that = this,
                    loadPanel = that._loadPanel,
                    dataController = that._dataController,
                    loadPanelOptions = that.option("loadPanel") || {},
                    animation = dataController.isLoaded() ? loadPanelOptions.animation : null,
                    visibilityOptions;
                if (loadPanel) {
                    visibilityOptions = {
                        message: messageText || loadPanelOptions.text,
                        animation: animation,
                        visible: isLoading
                    };
                    clearTimeout(that._hideLoadingTimeoutID);
                    if (loadPanel.option('visible') && !isLoading)
                        that._hideLoadingTimeoutID = setTimeout(function() {
                            loadPanel.option(visibilityOptions)
                        }, DATAGRID_LOADPANEL_HIDE_TIMEOUT);
                    else
                        loadPanel.option(visibilityOptions);
                    that._updateNoDataText()
                }
            },
            isScrollbarVisible: function() {
                var $element = this.element();
                return $element ? this._findContentElement().outerHeight() - $element.height() > 0 : false
            },
            setRowsOpacity: function(columnIndex, value) {
                var that = this,
                    $rows = that._getRowElements().not('.' + DATAGRID_GROUP_ROW_CLASS) || [];
                $.each($rows, function(_, row) {
                    $(row).children().eq(columnIndex).css({opacity: value})
                })
            },
            getTopVisibleItemIndex: function() {
                var that = this,
                    itemIndex = 0,
                    prevOffsetTop = 0,
                    offsetTop = 0,
                    rowElements,
                    scrollPosition = that._scrollTop,
                    contentElementOffsetTop = that._findContentElement().offset().top,
                    items = that._dataController.items();
                if (items.length && that._tableElement) {
                    rowElements = that._tableElement.children('tbody').children('.dx-row:visible, .dx-error-row').not('.' + DATAGRID_FREESPACE_CLASS);
                    for (itemIndex = 0; itemIndex < items.length; itemIndex++) {
                        prevOffsetTop = offsetTop;
                        offsetTop = rowElements.eq(itemIndex).offset().top - contentElementOffsetTop;
                        if (offsetTop > scrollPosition) {
                            if (scrollPosition * 2 < offsetTop + prevOffsetTop && itemIndex)
                                itemIndex--;
                            break
                        }
                    }
                    if (itemIndex && itemIndex === items.length)
                        itemIndex--
                }
                return itemIndex
            },
            getTopVisibleRowData: function() {
                var itemIndex = this.getTopVisibleItemIndex(),
                    items = this._dataController.items();
                if (items[itemIndex])
                    return items[itemIndex].data
            },
            getCellElement: function(rowIndex, columnIdentificator) {
                var that = this,
                    $row = that._getRowElements().eq(rowIndex),
                    $cell,
                    columnsController = that._columnsController,
                    columnIndex,
                    columnVisibleIndex = columnIdentificator;
                if (utils.isString(columnIdentificator)) {
                    columnIndex = columnsController.columnOption(columnIdentificator, 'index');
                    columnVisibleIndex = columnsController.getVisibleIndex(columnIndex)
                }
                if ($row.length && columnVisibleIndex >= 0)
                    $cell = $row.children().eq(columnVisibleIndex);
                if ($cell && $cell.length)
                    return $cell
            },
            optionChanged: function(args) {
                var that = this;
                that.callBase(args);
                switch (args.name) {
                    case'wordWrapEnabled':
                    case'hoverStateEnabled':
                    case'showColumnLines':
                    case'showRowLines':
                    case'rowAlternationEnabled':
                    case'rowTemplate':
                    case'onCellPrepared':
                    case'onRowPrepared':
                        that.render();
                        that.component.resize();
                        args.handled = true;
                        break;
                    case'scrolling':
                        args.handled = true;
                    case'rtlEnabled':
                        that._rowHeight = null;
                        that._tableElement = null;
                        break;
                    case"disabled":
                    case'loadPanel':
                        that._tableElement = null;
                        that.render();
                        that.component.resize();
                        args.handled = true;
                        break;
                    case'noDataText':
                        that._updateNoDataText();
                        args.handled = true;
                        break;
                    case'onCellHoverChanged':
                        that.render();
                        that.component.resize();
                        args.handled = true;
                        break
                }
            },
            dispose: function() {
                clearTimeout(this._hideLoadingTimeoutID)
            }
        });
        $.extend(dataGrid.__internals, {
            DATAGRID_CELL_CONTENT_CLASS: DATAGRID_CELL_CONTENT_CLASS,
            DATAGRID_GROUP_ROW_CLASS: DATAGRID_GROUP_ROW_CLASS,
            DATAGRID_SEARCH_TEXT_CLASS: DATAGRID_SEARCH_TEXT_CLASS,
            DATAGRID_ROWS_VIEW_CLASS: DATAGRID_ROWS_VIEW_CLASS,
            DATAGRID_TABLE_CLASS: DATAGRID_TABLE_CLASS,
            DATAGRID_FREESPACE_CLASS: DATAGRID_FREESPACE_CLASS,
            DATAGRID_NODATA_TEXT_CLASS: DATAGRID_NODATA_TEXT_CLASS,
            DATAGRID_NOWRAP_CLASS: DATAGRID_NOWRAP_CLASS,
            DATAGRID_ROW_LINES_CLASS: DATAGRID_ROW_LINES_CLASS,
            DATAGRID_COLUMN_LINES_CLASS: DATAGRID_COLUMN_LINES_CLASS,
            DATAGRID_ROW_ALTERNATION_CLASS: DATAGRID_ROW_ALTERNATION_CLASS
        });
        dataGrid.registerModule('rows', {
            defaultOptions: function() {
                return {
                        hoverStateEnabled: false,
                        loadPanel: {
                            enabled: true,
                            text: Globalize.localize("Loading"),
                            width: 200,
                            height: 70,
                            showIndicator: true,
                            indicatorSrc: "",
                            showPane: true
                        },
                        rowTemplate: null,
                        columnAutoWidth: false,
                        noDataText: Globalize.localize("dxDataGrid-noDataText"),
                        wordWrapEnabled: false,
                        showColumnLines: true,
                        showRowLines: false,
                        rowAlternationEnabled: false,
                        activeStateEnabled: false
                    }
            },
            views: {rowsView: dataGrid.RowsView}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.pager.js */
    (function($, DX) {
        var ui = DX.ui,
            events = ui.events,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_PAGER_CLASS = "dx-datagrid-pager";
        var MAX_PAGES_COUNT = 10;
        dataGrid.PagerView = dataGrid.View.inherit({
            init: function() {
                var that = this,
                    dataController = that.getController('data');
                that._isVisible = false;
                dataController.changed.add(function() {
                    that.render()
                })
            },
            _getPager: function() {
                var $element = this.element();
                return $element && $element.data('dxPager')
            },
            _renderCore: function() {
                var that = this,
                    $element = that.element().addClass(DATAGRID_PAGER_CLASS),
                    pagerOptions = that.option('pager') || {},
                    dataController = that.getController('data'),
                    rtlEnabled = that.option('rtlEnabled'),
                    options = {
                        maxPagesCount: MAX_PAGES_COUNT,
                        pageIndex: dataController.pageIndex() + 1,
                        pageCount: dataController.pageCount(),
                        pageSize: dataController.pageSize(),
                        showPageSizes: pagerOptions.showPageSizeSelector,
                        showInfo: pagerOptions.showInfo,
                        showNavigationButtons: pagerOptions.showNavigationButtons,
                        pageSizes: that.getPageSizes(),
                        rtlEnabled: rtlEnabled,
                        hasKnownLastPage: dataController.hasKnownLastPage(),
                        pageIndexChanged: function(pageIndex) {
                            if (dataController.pageIndex() !== pageIndex - 1)
                                setTimeout(function() {
                                    dataController.pageIndex(pageIndex - 1)
                                })
                        },
                        pageSizeChanged: function(pageSize) {
                            setTimeout(function() {
                                dataController.pageSize(pageSize)
                            })
                        }
                    };
                if (utils.isDefined(pagerOptions.infoText))
                    options.infoText = pagerOptions.infoText;
                $element.dxPager(options)
            },
            getPageSizes: function() {
                var that = this,
                    dataController = that.getController('data'),
                    pagerOptions = that.option('pager'),
                    allowedPageSizes = pagerOptions && pagerOptions.allowedPageSizes,
                    pageSize = dataController.pageSize();
                if (!utils.isDefined(that._pageSizes) || $.inArray(pageSize, that._pageSizes) === -1) {
                    that._pageSizes = [];
                    if (pagerOptions)
                        if ($.isArray(allowedPageSizes))
                            that._pageSizes = allowedPageSizes;
                        else if (allowedPageSizes && pageSize > 1)
                            that._pageSizes = [Math.floor(pageSize / 2), pageSize, pageSize * 2]
                }
                return that._pageSizes
            },
            isVisible: function() {
                var that = this,
                    dataController = that.getController('data'),
                    pagerOptions = that.option('pager'),
                    pagerVisible = pagerOptions && pagerOptions.visible,
                    scrolling = that.option('scrolling');
                if (that._isVisible)
                    return true;
                if (pagerVisible === 'auto')
                    if (scrolling && (scrolling.mode === 'virtual' || scrolling.mode === 'infinite'))
                        pagerVisible = false;
                    else
                        pagerVisible = dataController.pageCount() > 1 || dataController.isLoaded() && !dataController.hasKnownLastPage();
                that._isVisible = pagerVisible;
                return pagerVisible
            },
            getHeight: function() {
                var pager = this._getPager();
                return pager && this.isVisible() ? pager.getHeight() : 0
            },
            optionChanged: function(args) {
                var that = this;
                switch (args.name) {
                    case'paging':
                    case'pager':
                        that._pageSizes = null;
                    case'scrolling':
                        that._isVisible = false;
                        that.render();
                        if (args.name === 'pager')
                            that.component && that.component.resize();
                        args.handled = true;
                        break
                }
            }
        });
        dataGrid.registerModule('pager', {
            defaultOptions: function() {
                return {
                        paging: {
                            enabled: true,
                            pageSize: undefined,
                            pageIndex: undefined
                        },
                        pager: {
                            visible: 'auto',
                            showPageSizeSelector: false,
                            allowedPageSizes: 'auto'
                        }
                    }
            },
            views: {pagerView: dataGrid.PagerView}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.gridView.js */
    (function($, DX) {
        var dataGrid = DX.ui.dxDataGrid,
            utils = DX.utils;
        var DATAGRID_CLASS = "dx-datagrid",
            DATAGRID_HIDDEN_CLASS = "dx-hidden",
            DATAGRID_TABLE_CLASS = "dx-datagrid-table",
            DATAGRID_TABLE_FIXED_CLASS = "dx-datagrid-table-fixed",
            DATAGRID_BORDERS_CLASS = "dx-datagrid-borders",
            DATAGRID_COLUMN_HEADERS_HIDDEN = "dx-datagrid-headers-hidden",
            DATAGRID_IMPORTANT_MARGIN_CLASS = "dx-datagrid-important-margin",
            EMPTY_GRID_ROWS_HEIGHT = 100,
            LOADPANEL_MARGIN = 50,
            VIEW_NAMES = ['columnsSeparatorView', 'blockSeparatorView', 'trackerView', 'headerPanel', 'columnHeadersView', 'rowsView', 'footerView', 'columnChooserView', 'pagerView', 'draggingHeaderView', 'contextMenuView', 'errorView'];
        var mergeArraysByMaxValue = function(values1, values2) {
                var result = [],
                    i;
                if (values1 && values2 && values1.length && values1.length === values2.length)
                    for (i = 0; i < values1.length; i++)
                        result.push(values1[i] > values2[i] ? values1[i] : values2[i]);
                else if (values1)
                    result = values1;
                return result
            };
        var isPercentWidth = function(width) {
                return utils.isString(width) && width.slice(-1) === '%'
            };
        dataGrid.ResizingController = dataGrid.ViewController.inherit({
            _initPostRenderHandlers: function() {
                var that = this;
                if (!that._refreshSizesHandler) {
                    that._refreshSizesHandler = function(e) {
                        that._dataController.changed.remove(that._refreshSizesHandler);
                        var changeType = e && e.changeType;
                        if (!e || changeType === 'refresh' || changeType === 'append' || changeType === 'update')
                            that.resize();
                        if (changeType)
                            that.component._fireContentReadyAction()
                    };
                    that._dataController.changed.add(function() {
                        that._dataController.changed.add(that._refreshSizesHandler)
                    });
                    that._columnHeadersView.sizeChanged.add(that._refreshSizesHandler)
                }
            },
            _getBestFitWidths: function() {
                var that = this,
                    rowsColumnWidths = that._rowsView.getColumnWidths(),
                    headerColumnWidths = that._columnHeadersView && that._columnHeadersView.getColumnWidths(),
                    footerColumnWidths = that._footerView && that._footerView.getColumnWidths(),
                    resultWidths;
                resultWidths = mergeArraysByMaxValue(rowsColumnWidths, headerColumnWidths);
                resultWidths = mergeArraysByMaxValue(resultWidths, footerColumnWidths);
                return resultWidths
            },
            _setVisibleWidths: function(visibleColumns, widths) {
                var columnsController = this._columnsController;
                columnsController.beginUpdate();
                $.each(visibleColumns, function(index, column) {
                    var columnId = column.command ? "command:" + column.command : column.index;
                    columnsController.columnOption(columnId, 'visibleWidth', widths[index])
                });
                columnsController.endUpdate()
            },
            _toggleBestFitMode: function(isBestFit) {
                var $element = this.component.element();
                $element.find('.' + DATAGRID_TABLE_CLASS).toggleClass(DATAGRID_TABLE_FIXED_CLASS, !isBestFit);
                $element.find('input').toggleClass(DATAGRID_HIDDEN_CLASS, isBestFit)
            },
            _synchronizeColumns: function() {
                var that = this,
                    $gridViewElement = that.getView("gridView").element(),
                    columnsController = that._columnsController,
                    visibleColumns = columnsController.getVisibleColumns(),
                    columnAutoWidth = that.option("columnAutoWidth"),
                    needBestFit = columnAutoWidth,
                    lastWidthReseted = false,
                    resultWidths = [];
                $.each(visibleColumns, function(index, column) {
                    if (column.width === "auto") {
                        needBestFit = true;
                        return false
                    }
                });
                that._setVisibleWidths(visibleColumns, []);
                if (needBestFit) {
                    that._toggleBestFitMode(true);
                    resultWidths = that._getBestFitWidths();
                    $.each(visibleColumns, function(index, column) {
                        var columnId = column.command ? "command:" + column.command : column.index;
                        columnsController.columnOption(columnId, 'bestFitWidth', resultWidths[index], true)
                    })
                }
                $.each(visibleColumns, function(index) {
                    if (this.width !== 'auto')
                        if (this.width)
                            resultWidths[index] = this.width;
                        else if (!columnAutoWidth)
                            resultWidths[index] = undefined
                });
                lastWidthReseted = that._correctColumnWidths(resultWidths, visibleColumns);
                if (columnAutoWidth)
                    that._processStretch(resultWidths, visibleColumns);
                if (needBestFit)
                    that._toggleBestFitMode(false);
                if (needBestFit || lastWidthReseted)
                    that._setVisibleWidths(visibleColumns, resultWidths)
            },
            _correctColumnWidths: function(resultWidths, visibleColumns) {
                var that = this,
                    hasPercentWidth = false,
                    hasAutoWidth = false,
                    lastWidthReseted = false,
                    $element = that.component.element(),
                    hasWidth = that._hasWidth,
                    lastColumnIndex;
                $.each(visibleColumns, function(index) {
                    if (this.width !== 'auto')
                        if (this.width)
                            resultWidths[index] = this.width;
                        else
                            hasAutoWidth = true;
                    if (isPercentWidth(this.width))
                        hasPercentWidth = true
                });
                if ($element && that._maxWidth) {
                    delete that._maxWidth;
                    $element.css('max-width', '')
                }
                if (!hasAutoWidth && resultWidths.length) {
                    var contentWidth = that._rowsView.contentWidth();
                    var totalWidth = that._getTotalWidth(resultWidths, contentWidth);
                    if (totalWidth <= contentWidth) {
                        lastColumnIndex = resultWidths.length - 1;
                        while (lastColumnIndex >= 0 && visibleColumns[lastColumnIndex].command)
                            lastColumnIndex--;
                        resultWidths[lastColumnIndex] = 'auto';
                        lastWidthReseted = true;
                        if (!hasWidth && !hasPercentWidth) {
                            that._maxWidth = totalWidth;
                            $element.css('max-width', that._maxWidth)
                        }
                    }
                }
                return lastWidthReseted
            },
            _processStretch: function(resultSizes, visibleColumns) {
                var groupSize = this._rowsView.contentWidth(),
                    tableSize = this._getTotalWidth(resultSizes, groupSize),
                    unusedIndexes = {length: 0},
                    diff,
                    diffElement,
                    onePixelElementsCount,
                    i;
                if (!resultSizes.length)
                    return;
                $.each(visibleColumns, function(index) {
                    if (this.width) {
                        unusedIndexes[index] = true;
                        unusedIndexes.length++
                    }
                });
                diff = groupSize - tableSize;
                diffElement = Math.floor(diff / (resultSizes.length - unusedIndexes.length));
                onePixelElementsCount = diff - diffElement * (resultSizes.length - unusedIndexes.length);
                if (diff >= 0)
                    for (i = 0; i < resultSizes.length; i++) {
                        if (unusedIndexes[i])
                            continue;
                        resultSizes[i] += diffElement;
                        if (i < onePixelElementsCount)
                            resultSizes[i]++
                    }
            },
            _getTotalWidth: function(widths, groupWidth) {
                var result = 0,
                    width,
                    i;
                for (i = 0; i < widths.length; i++) {
                    width = widths[i];
                    if (width)
                        result += isPercentWidth(width) ? parseInt(width) * groupWidth / 100 : parseInt(width)
                }
                return Math.round(result)
            },
            updateSize: function($rootElement) {
                var that = this,
                    $groupElement,
                    width;
                if (that._hasHeight === undefined && $rootElement && $rootElement.closest(document).length) {
                    $groupElement = $rootElement.children('.' + DATAGRID_CLASS);
                    if ($groupElement.length)
                        $groupElement.detach();
                    that._hasHeight = !!$rootElement.height();
                    width = $rootElement.width();
                    $rootElement.addClass(DATAGRID_IMPORTANT_MARGIN_CLASS);
                    that._hasWidth = $rootElement.width() === width;
                    $rootElement.removeClass(DATAGRID_IMPORTANT_MARGIN_CLASS);
                    if ($groupElement.length)
                        $groupElement.appendTo($rootElement)
                }
            },
            publicMethods: function() {
                return ["resize"]
            },
            resize: function() {
                var that = this,
                    dataController = that._dataController,
                    $rootElement = that.component.element(),
                    rootElementHeight = $rootElement && ($rootElement.get(0).clientHeight || $rootElement.height()),
                    loadPanelOptions = that.option('loadPanel'),
                    height = that.option('height'),
                    rowsViewHeight,
                    editorFactory = that.getController('editorFactory'),
                    $testDiv;
                that._initPostRenderHandlers();
                that.updateSize($rootElement);
                if (height && that._hasHeight ^ height !== 'auto') {
                    $testDiv = $('<div>').height(height).appendTo($rootElement);
                    that._hasHeight = !!$testDiv.height();
                    $testDiv.remove()
                }
                if (that._hasHeight && rootElementHeight > 0 && that.option('scrolling')) {
                    rowsViewHeight = rootElementHeight;
                    $.each(that.getViews(), function() {
                        if (this.isVisible() && this.getHeight)
                            rowsViewHeight -= this.getHeight()
                    })
                }
                else if (!that._hasHeight && dataController.items().length === 0)
                    rowsViewHeight = loadPanelOptions && loadPanelOptions.visible ? loadPanelOptions.height + LOADPANEL_MARGIN : EMPTY_GRID_ROWS_HEIGHT;
                else
                    rowsViewHeight = 'auto';
                that._rowsView.height(rowsViewHeight);
                that._columnHeadersView.setScrollerSpacing(that._rowsView.getScrollbarWidth());
                that._synchronizeColumns();
                $.each(VIEW_NAMES, function(index, viewName) {
                    var view = that.getView(viewName);
                    if (view)
                        view.resize()
                });
                editorFactory && editorFactory.resize()
            },
            optionChanged: function(args) {
                switch (args.name) {
                    case"width":
                    case"height":
                        this.component._renderDimensions();
                        this.resize();
                    default:
                        this.callBase(args)
                }
            },
            init: function() {
                var that = this;
                that._dataController = that.getController('data');
                that._columnsController = that.getController('columns');
                that._columnHeadersView = that.getView('columnHeadersView');
                that._footerView = that.getView("footerView");
                that._rowsView = that.getView('rowsView');
                that._footerView = that.getView('footerView');
                that._rowsView.scrollOffsetChanged.add(function(e) {
                    that._columnHeadersView.scrollOffset(e.left);
                    that._footerView.scrollOffset(e.left)
                })
            }
        });
        dataGrid.GridView = dataGrid.View.inherit({
            init: function() {
                var that = this;
                that._dataController = that.getController('data');
                that._rowsView = that.getView('rowsView')
            },
            getView: function(name) {
                return this.component._views[name]
            },
            element: function() {
                return this._groupElement
            },
            optionChanged: function(args) {
                var that = this;
                if (utils.isDefined(that._groupElement) && args.name === "showBorders") {
                    that._groupElement.toggleClass(DATAGRID_BORDERS_CLASS, !!args.value);
                    args.handled = true
                }
                else
                    that.callBase(args)
            },
            render: function($rootElement) {
                var that = this,
                    resizingController = that.getController('resizing'),
                    groupElement = that._groupElement || $('<div />').addClass(DATAGRID_CLASS).toggleClass(DATAGRID_BORDERS_CLASS, !!that.option("showBorders"));
                that._rootElement = $rootElement || that._rootElement;
                that._groupElement = groupElement;
                $.each(VIEW_NAMES, function(index, viewName) {
                    var view = that.getView(viewName);
                    if (view)
                        view.render(groupElement)
                });
                that.update()
            },
            update: function() {
                var that = this,
                    $rootElement = that._rootElement,
                    $groupElement = that._groupElement,
                    resizingController = that.getController('resizing');
                if ($rootElement && $groupElement) {
                    if (!$groupElement.parent().length) {
                        resizingController.updateSize($rootElement);
                        $groupElement.appendTo($rootElement);
                        that._rowsView.renderDelayedTemplates()
                    }
                    resizingController.resize();
                    if (that._dataController.isLoaded())
                        that.component._fireContentReadyAction()
                }
            }
        });
        dataGrid.registerModule("gridView", {
            defaultOptions: function() {
                showBorders:false
            },
            controllers: {resizing: dataGrid.ResizingController},
            views: {gridView: dataGrid.GridView}
        });
        $.extend(dataGrid.__internals, {
            viewNames: VIEW_NAMES,
            DATAGRID_CLASS: DATAGRID_CLASS,
            DATAGRID_COLUMN_HEADERS_HIDDEN: DATAGRID_COLUMN_HEADERS_HIDDEN,
            DATAGRID_BORDERS_CLASS: DATAGRID_BORDERS_CLASS
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.columnsResizingReorderingModule.js */
    (function($, DX) {
        var ui = DX.ui,
            events = ui.events,
            addNamespace = events.addNamespace,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid,
            fx = DX.fx;
        var DATAGRID_COLUMNS_SEPARATOR_CLASS = "dx-datagrid-columns-separator",
            DATAGRID_COLUMNS_SEPARATOR_TRANSPARENT = "dx-datagrid-columns-separator-transparent",
            DATAGRID_DRAGGING_HEADER_CLASS = "dx-datagrid-drag-header",
            DATAGRID_CELL_CONTENT_CLASS = "dx-datagrid-text-content",
            DATAGRID_HEADERS_DRAG_ACTION_CLASS = "dx-datagrid-drag-action",
            DATAGRID_TRACKER_CLASS = "dx-datagrid-tracker",
            DATAGRID_BLOCK_SEPARATOR_CLASS = "dx-block-separator",
            DATAGRID_HEADERS_DROP_HIGHLIGHT_CLASS = 'dx-datagrid-drop-highlight',
            DATAGRID_HEADER_ROW_CLASS = "dx-header-row",
            WIDGET_CLASS = "dx-widget",
            DATAGRID_MODULE_NAMESPACE = "dxDataGridResizingReordering",
            COLUMNS_SEPARATOR_TOUCH_TRACKER_WIDTH = 10,
            DRAGGING_DELTA = 5;
        var allowResizing = function(that) {
                return that.option("allowColumnResizing") || that.getController("columns").isColumnOptionUsed("allowResizing")
            };
        var allowReordering = function(that) {
                return that.option("allowColumnReordering") || that.getController("columns").isColumnOptionUsed("allowReordering")
            };
        dataGrid.getPointsByColumns = function(items, pointCreated, isVertical) {
            var cellsLength = items.length,
                cancel = false,
                i,
                point,
                item,
                offset,
                result = [],
                rtlEnabled,
                columnIndex = 0;
            for (i = 0; i <= cellsLength; i++) {
                if (i < cellsLength) {
                    item = items.eq(columnIndex);
                    offset = item.offset();
                    rtlEnabled = item.css('direction') === 'rtl'
                }
                point = {
                    index: i,
                    x: offset ? offset.left + (!isVertical && rtlEnabled ^ i === cellsLength ? item.outerWidth() : 0) : 0,
                    y: offset ? offset.top + (isVertical && i === cellsLength ? item.outerHeight() : 0) : 0,
                    columnIndex: columnIndex
                };
                if (pointCreated)
                    cancel = pointCreated(point);
                if (!cancel)
                    result.push(point);
                columnIndex++
            }
            return result
        };
        dataGrid.TrackerView = dataGrid.View.inherit({
            _renderCore: function(options) {
                this.callBase();
                this.element().addClass(DATAGRID_TRACKER_CLASS);
                this.hide()
            },
            init: function() {
                var that = this,
                    $element;
                that.callBase();
                that.getController("tablePosition").positionChanged.add(function(position) {
                    $element = that.element();
                    if ($element && $element.hasClass(DATAGRID_TRACKER_CLASS)) {
                        $element.css({top: position.top});
                        $element.height(position.height)
                    }
                })
            },
            isVisible: function() {
                return allowResizing(this)
            },
            show: function() {
                this.element().show()
            },
            hide: function() {
                this.element().hide()
            },
            setHeight: function(value) {
                this.element().height(value)
            }
        });
        dataGrid.SeparatorView = dataGrid.View.inherit({
            _renderSeparator: function(){},
            _renderCore: function(options) {
                this.callBase(options);
                this._isShown = true;
                this._renderSeparator();
                this.hide()
            },
            show: function() {
                this._isShown = true
            },
            hide: function() {
                this._isShown = false
            },
            height: function(value) {
                var $element = this.element();
                if ($element)
                    if (utils.isDefined(value))
                        $element.height(value);
                    else
                        return $element.height()
            },
            width: function(value) {
                var $element = this.element();
                if ($element)
                    if (utils.isDefined(value))
                        $element.width(value);
                    else
                        return $element.width()
            }
        });
        dataGrid.ColumnsSeparatorView = dataGrid.SeparatorView.inherit({
            _renderSeparator: function() {
                this.callBase();
                var $element = this.element();
                $element.addClass(DATAGRID_COLUMNS_SEPARATOR_CLASS)
            },
            _subscribeToEvent: function() {
                var that = this,
                    $element;
                that.getController("tablePosition").positionChanged.add(function(position) {
                    $element = that.element();
                    if ($element) {
                        $element.css({top: position.top});
                        $element.height(position.height)
                    }
                })
            },
            isVisible: function() {
                return this.option('showColumnHeaders') && (allowReordering(this) || allowResizing(this))
            },
            init: function() {
                this.callBase();
                this._isTransparent = allowResizing(this);
                if (this.isVisible())
                    this._subscribeToEvent()
            },
            show: function() {
                var that = this,
                    $element = this.element();
                if ($element && !that._isShown)
                    if (that._isTransparent)
                        $element.removeClass(DATAGRID_COLUMNS_SEPARATOR_TRANSPARENT);
                    else
                        $element.show();
                this.callBase()
            },
            hide: function() {
                var $element = this.element();
                if ($element && this._isShown)
                    if (this._isTransparent)
                        $element.addClass(DATAGRID_COLUMNS_SEPARATOR_TRANSPARENT);
                    else
                        $element.hide();
                this.callBase()
            },
            moveByX: function(outerX) {
                var $element = this.element();
                if ($element) {
                    $element.css("left", outerX - this._parentElement().offset().left);
                    this._testPosx = outerX
                }
            },
            changeCursor: function(cursorName) {
                cursorName = utils.isDefined(cursorName) ? cursorName : "";
                var $element = this.element();
                if ($element) {
                    $element.css('cursor', cursorName);
                    this._testCursorName = cursorName
                }
            }
        });
        dataGrid.BlockSeparatorView = dataGrid.SeparatorView.inherit({
            _renderSeparator: function() {
                this.callBase();
                this.element().addClass(DATAGRID_BLOCK_SEPARATOR_CLASS).html('&nbsp;')
            },
            hide: function() {
                var that = this,
                    $parent = this._parentElement(),
                    $element = this.element();
                if ($element && this._isShown)
                    $element.hide();
                if ($parent && !$parent.children('.' + DATAGRID_BLOCK_SEPARATOR_CLASS).length)
                    $parent.prepend(that.element());
                that.callBase()
            },
            isVisible: function() {
                var groupPanelOptions = this.option("groupPanel"),
                    columnChooserOptions = this.option('columnChooser');
                return groupPanelOptions && groupPanelOptions.visible || columnChooserOptions && columnChooserOptions.enabled
            },
            show: function(targetLocation) {
                var that = this,
                    $element = this.element(),
                    startAnimate = function(toOptions) {
                        fx.stop($element, true);
                        fx.animate($element, {
                            type: "slide",
                            from: {
                                width: 0,
                                display: toOptions.display
                            },
                            to: toOptions,
                            duration: 300,
                            easing: "swing"
                        })
                    };
                if ($element && !that._isShown)
                    switch (targetLocation) {
                        case"group":
                            startAnimate({
                                width: "50px",
                                display: "inline-block"
                            });
                            break;
                        case"columnChooser":
                            startAnimate({
                                width: "100%",
                                display: "block"
                            });
                            break;
                        default:
                            $element.show()
                    }
                that.callBase()
            }
        });
        dataGrid.DraggingHeaderView = dataGrid.View.inherit({
            _isDragging: false,
            _getDropOptions: function() {
                var that = this;
                if (that._dragOptions)
                    return {
                            sourceColumnIndex: that._dragOptions.columnIndex,
                            sourceColumnElement: that._dragOptions.columnElement,
                            sourceLocation: that._dragOptions.sourceLocation,
                            targetColumnIndex: that._dropColumnIndex,
                            targetLocation: that._dropLocation
                        }
            },
            _dropHeader: function(args) {
                var e = args.jQueryEvent,
                    that = e.data.that,
                    controller = that._controller;
                that.element().hide();
                if (controller && that._isDragging)
                    controller.drop(that._getDropOptions());
                that.element().appendTo(that._parentElement());
                that._dragOptions = null;
                that._isDragging = false;
                document.onselectstart = that._onSelectStart || null
            },
            _getDraggingPanelByPos: function(pos) {
                var that = this,
                    result;
                $.each(that._dragOptions.draggingPanels, function(index, draggingPanel) {
                    if (draggingPanel) {
                        var boundingRect = draggingPanel.getBoundingRect();
                        if (boundingRect && (boundingRect.bottom === undefined || pos.y < boundingRect.bottom) && (boundingRect.top === undefined || pos.y > boundingRect.top) && (boundingRect.left === undefined || pos.x > boundingRect.left) && (boundingRect.right === undefined || pos.x < boundingRect.right)) {
                            result = draggingPanel;
                            return false
                        }
                    }
                });
                return result
            },
            _pointCreated: function(point, columns, location, sourceColumn) {
                var targetColumn = columns[point.columnIndex],
                    prevColumn = columns[point.columnIndex - 1];
                switch (location) {
                    case"columnChooser":
                        return true;
                    case"headers":
                        return sourceColumn && !sourceColumn.allowReordering || (!targetColumn || !targetColumn.allowReordering) && (!prevColumn || !prevColumn.allowReordering);
                    default:
                        return columns.length === 0
                }
            },
            _moveHeader: function(args) {
                var e = args.jQueryEvent,
                    that = e.data.that,
                    columnElements,
                    pointsByColumns,
                    newLeft,
                    newTop,
                    moveDeltaX,
                    moveDeltaY,
                    eventData = events.eventData(e),
                    targetDraggingPanel,
                    controller = that._controller,
                    isResizing = that._columnsResizerViewController ? that._columnsResizerViewController.isResizing() : false,
                    i,
                    params,
                    dragOptions = that._dragOptions,
                    isVerticalOrientation,
                    centerPosition,
                    axisName,
                    rtlEnabled;
                if (that._isDragging && !isResizing) {
                    moveDeltaX = Math.abs(eventData.x - dragOptions.columnElement.offset().left - dragOptions.deltaX);
                    moveDeltaY = Math.abs(eventData.y - dragOptions.columnElement.offset().top - dragOptions.deltaY);
                    if (that.element().is(':visible') || moveDeltaX > DRAGGING_DELTA || moveDeltaY > DRAGGING_DELTA) {
                        that.element().show();
                        newLeft = eventData.x - dragOptions.deltaX;
                        newTop = eventData.y - dragOptions.deltaY;
                        that.element().offset({
                            left: newLeft,
                            top: newTop
                        });
                        targetDraggingPanel = that._getDraggingPanelByPos(eventData);
                        if (targetDraggingPanel) {
                            rtlEnabled = that.option('rtlEnabled');
                            isVerticalOrientation = targetDraggingPanel.getName() === 'columnChooser';
                            axisName = isVerticalOrientation ? 'y' : 'x';
                            columnElements = targetDraggingPanel.getColumnElements() || [];
                            pointsByColumns = dataGrid.getPointsByColumns(columnElements, function(point) {
                                return that._pointCreated(point, targetDraggingPanel.getColumns(), targetDraggingPanel.getName(), dragOptions.sourceColumn)
                            }, axisName === 'y');
                            that._dropLocation = targetDraggingPanel.getName();
                            if (pointsByColumns.length > 0)
                                for (i = 0; i < pointsByColumns.length; i++) {
                                    centerPosition = pointsByColumns[i + 1] && (pointsByColumns[i][axisName] + pointsByColumns[i + 1][axisName]) / 2;
                                    if (centerPosition === undefined || (rtlEnabled && axisName === 'x' ? eventData[axisName] > centerPosition : eventData[axisName] < centerPosition)) {
                                        that._dropColumnIndex = pointsByColumns[i].columnIndex;
                                        params = that._getDropOptions();
                                        if (columnElements[i])
                                            params.targetColumnElement = columnElements.eq(i);
                                        else {
                                            params.targetColumnElement = columnElements.last();
                                            params.isLast = true
                                        }
                                        params.posX = pointsByColumns[i].x;
                                        controller.dock(params);
                                        break
                                    }
                                }
                            else {
                                that._dropColumnIndex = -1;
                                params = that._getDropOptions();
                                controller.dock(params)
                            }
                        }
                    }
                    e.preventDefault()
                }
            },
            _subscribeToEvents: function(rootElement) {
                var that = this;
                that._moveHeaderAction = this.createAction(this._moveHeader);
                that._dropHeaderAction = this.createAction(this._dropHeader);
                $(document).on(addNamespace('dxpointermove', DATAGRID_MODULE_NAMESPACE), {
                    that: that,
                    rootElement: rootElement
                }, that._moveHeaderAction);
                that.element().on(addNamespace('dxpointerup', DATAGRID_MODULE_NAMESPACE), {that: that}, that._dropHeaderAction);
                $(document).on(addNamespace('dxpointerup', DATAGRID_MODULE_NAMESPACE), {that: that}, that._dropHeaderAction)
            },
            _renderCore: function() {
                this.element().addClass(DATAGRID_DRAGGING_HEADER_CLASS + ' ' + DATAGRID_CELL_CONTENT_CLASS + ' ' + WIDGET_CLASS).css('display', 'none')
            },
            _afterRender: function($parent) {
                this._unsubscribeFromEvents();
                this._subscribeToEvents($parent)
            },
            _unsubscribeFromEvents: function() {
                if (this._dropHeaderAction) {
                    this.element().off(addNamespace('dxpointerup', DATAGRID_MODULE_NAMESPACE), this._dropHeaderAction);
                    $(document).off(addNamespace('dxpointerup', DATAGRID_MODULE_NAMESPACE), this._dropHeaderAction)
                }
                if (this._moveHeaderAction)
                    $(document).off(addNamespace('dxpointermove', DATAGRID_MODULE_NAMESPACE), this._moveHeaderAction)
            },
            dispose: function() {
                this._dragOptions = null;
                this._unsubscribeFromEvents();
                this.element().parent().find('.' + DATAGRID_DRAGGING_HEADER_CLASS).remove()
            },
            isVisible: function() {
                var columnsController = this.getController("columns"),
                    commonColumnSettings = columnsController.getCommonSettings();
                return this.option('showColumnHeaders') && (allowReordering(this) || commonColumnSettings.allowGrouping || commonColumnSettings.allowHiding)
            },
            init: function() {
                this.callBase();
                this._controller = this.getController("draggingHeader");
                this._columnsResizerViewController = this.getController("columnsResizer")
            },
            drag: function(options) {
                var that = this,
                    columnElement = options.columnElement;
                that._dragOptions = options;
                that._isDragging = true;
                that._dropColumnIndex = options.columnIndex;
                that._dropLocation = options.sourceLocation;
                that._onSelectStart = document.onselectstart;
                document.onselectstart = function() {
                    return false
                };
                that.element().css({
                    textAlign: columnElement && columnElement.css('text-align'),
                    height: columnElement && columnElement.height(),
                    width: columnElement && columnElement.width(),
                    whiteSpace: columnElement && columnElement.css('white-space')
                }).addClass(DATAGRID_HEADERS_DRAG_ACTION_CLASS).text(options.sourceColumn.caption);
                that.element().appendTo($(document.body))
            }
        });
        dataGrid.ColumnsResizerViewController = dataGrid.ViewController.inherit({
            _isHeadersRowArea: function(posY) {
                if (this._columnHeadersView) {
                    var element = this._columnHeadersView.element(),
                        headersRowHeight,
                        offsetTop;
                    if (element) {
                        offsetTop = element.offset().top;
                        headersRowHeight = this._columnHeadersView.getHeadersRowHeight();
                        return posY >= offsetTop && posY <= offsetTop + headersRowHeight
                    }
                }
                return false
            },
            _pointCreated: function(point, cellsLength, columns) {
                var currentColumn,
                    nextColumn;
                if (point.index > 0 && point.index < cellsLength) {
                    point.columnIndex -= 1;
                    currentColumn = columns[point.columnIndex] || {};
                    nextColumn = columns[point.columnIndex + 1] || {};
                    return !(currentColumn.allowResizing && nextColumn.allowResizing)
                }
                return true
            },
            _getTargetPoint: function(pointsByColumns, currentX, deltaX) {
                if (pointsByColumns)
                    for (var i = 0; i < pointsByColumns.length; i++)
                        if (pointsByColumns[i].x - deltaX <= currentX && currentX <= pointsByColumns[i].x + deltaX)
                            return pointsByColumns[i];
                return null
            },
            _moveSeparator: function(args) {
                var e = args.jQueryEvent,
                    that = e.data,
                    pointsByColumns = that._pointsByColumns,
                    columnsSeparatorWidth = that._columnsSeparatorView.width(),
                    columnsSeparatorOffset = that._columnsSeparatorView.element().offset(),
                    deltaX = columnsSeparatorWidth / 2,
                    parentOffsetLeft = that._$parentContainer.offset().left,
                    eventData = events.eventData(e);
                if (that._isResizing) {
                    if (parentOffsetLeft <= eventData.x && eventData.x <= parentOffsetLeft + that._$parentContainer.width())
                        if (that._updateColumnsWidthIfNeeded(that._targetPoint.columnIndex, eventData.x)) {
                            that._columnsSeparatorView.moveByX(that._targetPoint.x + (eventData.x - that._resizingInfo.startPosX));
                            that._tablePositionController.update();
                            e.preventDefault()
                        }
                }
                else if (that._isHeadersRowArea(eventData.y)) {
                    that._targetPoint = that._getTargetPoint(pointsByColumns, eventData.x, columnsSeparatorWidth);
                    that._isReadyResizing = false;
                    that._columnsSeparatorView.changeCursor();
                    if (that._targetPoint && columnsSeparatorOffset.top <= eventData.y && columnsSeparatorOffset.top + that._columnsSeparatorView.height() >= eventData.y) {
                        that._columnsSeparatorView.changeCursor('col-resize');
                        that._columnsSeparatorView.moveByX(that._targetPoint.x - deltaX);
                        that._isReadyResizing = true;
                        e.preventDefault()
                    }
                }
                else {
                    that._isReadyResizing = false;
                    that._columnsSeparatorView.changeCursor()
                }
            },
            _endResizing: function(args) {
                var e = args.jQueryEvent,
                    that = e.data;
                if (that._isResizing) {
                    that._updatePointsByColumns();
                    that._resizingInfo = null;
                    that._columnsSeparatorView.hide();
                    that._columnsSeparatorView.changeCursor();
                    that._trackerView.hide();
                    that._isReadyResizing = false;
                    that._isResizing = false
                }
            },
            _setupResizingInfo: function(posX) {
                var that = this,
                    currentHeader = that._columnHeadersView.getHeaderElement(that._targetPoint.columnIndex),
                    nextHeader = that._columnHeadersView.getHeaderElement(that._targetPoint.columnIndex + 1);
                that._resizingInfo = {
                    startPosX: posX,
                    currentColumnWidth: currentHeader && currentHeader.length > 0 ? currentHeader.outerWidth() : 0,
                    nextColumnWidth: nextHeader && nextHeader.length > 0 ? nextHeader.outerWidth() : 0
                }
            },
            _startResizing: function(args) {
                var e = args.jQueryEvent,
                    that = e.data,
                    eventData = events.eventData(e);
                if (events.isTouchEvent(e))
                    if (that._isHeadersRowArea(eventData.y)) {
                        that._targetPoint = that._getTargetPoint(that._pointsByColumns, eventData.x, COLUMNS_SEPARATOR_TOUCH_TRACKER_WIDTH);
                        if (that._targetPoint) {
                            that._columnsSeparatorView.moveByX(that._targetPoint.x - that._columnsSeparatorView.width() / 2);
                            that._isReadyResizing = true
                        }
                    }
                    else
                        that._isReadyResizing = false;
                if (that._isReadyResizing) {
                    if (that._targetPoint)
                        that._testColumnIndex = that._targetPoint.columnIndex;
                    that._setupResizingInfo(eventData.x);
                    that._columnsSeparatorView.show();
                    that._trackerView.show();
                    that._isResizing = true;
                    e.preventDefault()
                }
            },
            _generatePointsByColumns: function() {
                var that = this,
                    columns = that._columnsController ? that._columnsController.getVisibleColumns() : [],
                    cells = that._columnHeadersView.getColumnElements(),
                    pointsByColumns = [];
                if (cells && cells.length > 0)
                    pointsByColumns = dataGrid.getPointsByColumns(cells, function(point) {
                        return that._pointCreated(point, cells.length, columns)
                    });
                that._pointsByColumns = pointsByColumns
            },
            _unsubscribeFromEvents: function() {
                this._moveSeparatorHandler && this._$parentContainer.off(addNamespace('dxpointermove', DATAGRID_MODULE_NAMESPACE), this._moveSeparatorHandler);
                this._startResizingHandler && this._$parentContainer.off(addNamespace('dxpointerdown', DATAGRID_MODULE_NAMESPACE), this._startResizingHandler);
                if (this._endResizingHandler) {
                    this._columnsSeparatorView.element().off(addNamespace('dxpointerup', DATAGRID_MODULE_NAMESPACE), this._endResizingHandler);
                    $(document).off(addNamespace('dxpointerup', DATAGRID_MODULE_NAMESPACE), this._endResizingHandler)
                }
            },
            _subscribeToEvents: function() {
                this._moveSeparatorHandler = this.createAction(this._moveSeparator);
                this._startResizingHandler = this.createAction(this._startResizing);
                this._endResizingHandler = this.createAction(this._endResizing);
                this._$parentContainer.on(addNamespace('dxpointermove', DATAGRID_MODULE_NAMESPACE), this, this._moveSeparatorHandler);
                this._$parentContainer.on(addNamespace('dxpointerdown', DATAGRID_MODULE_NAMESPACE), this, this._startResizingHandler);
                this._columnsSeparatorView.element().on(addNamespace('dxpointerup', DATAGRID_MODULE_NAMESPACE), this, this._endResizingHandler);
                $(document).on(addNamespace('dxpointerup', DATAGRID_MODULE_NAMESPACE), this, this._endResizingHandler)
            },
            _updateColumnsWidthIfNeeded: function(columnIndex, posX) {
                var deltaX,
                    isUpdated = false,
                    nextCellWidth,
                    columnsController = this._columnsController,
                    visibleColumns = columnsController.getVisibleColumns(),
                    columnsSeparatorWidth = this._columnsSeparatorView.width(),
                    column,
                    nextColumn,
                    cellWidth;
                deltaX = posX - this._resizingInfo.startPosX;
                if (this.option("rtlEnabled"))
                    deltaX = -deltaX;
                cellWidth = this._resizingInfo.currentColumnWidth + deltaX;
                nextCellWidth = this._resizingInfo.nextColumnWidth - deltaX;
                isUpdated = !(cellWidth <= columnsSeparatorWidth || nextCellWidth <= columnsSeparatorWidth);
                if (isUpdated) {
                    column = visibleColumns[columnIndex];
                    nextColumn = visibleColumns[columnIndex + 1];
                    columnsController.beginUpdate();
                    column && columnsController.columnOption(column.index, 'visibleWidth', undefined);
                    nextColumn && columnsController.columnOption(nextColumn.index, 'visibleWidth', undefined);
                    column && columnsController.columnOption(column.index, 'width', Math.floor(cellWidth));
                    nextColumn && columnsController.columnOption(nextColumn.index, 'width', Math.floor(nextCellWidth));
                    columnsController.endUpdate()
                }
                return isUpdated
            },
            _updatePointsByColumns: function() {
                var i,
                    point,
                    rtlEnabled = this.option("rtlEnabled"),
                    headerElement;
                for (i = 0; i < this._pointsByColumns.length; i++) {
                    point = this._pointsByColumns[i];
                    headerElement = this._columnHeadersView.getHeaderElement(point.columnIndex + 1);
                    if (headerElement && headerElement.length > 0)
                        point.x = headerElement.offset().left + (rtlEnabled ? headerElement.outerWidth() : 0)
                }
            },
            isResizing: function() {
                return this._isResizing
            },
            init: function() {
                var that = this,
                    gridView,
                    previousScrollbarVisibility,
                    generatePointsByColumnsScrollHandler = function(offset) {
                        if (that._scrollLeft !== offset.left) {
                            that._scrollLeft = offset.left;
                            that._generatePointsByColumns()
                        }
                    },
                    generatePointsByColumnsHandler = function() {
                        that._generatePointsByColumns()
                    };
                that.callBase();
                if (allowResizing(that)) {
                    that._columnsSeparatorView = that.getView("columnsSeparatorView");
                    that._columnHeadersView = that.getView("columnHeadersView");
                    that._trackerView = that.getView("trackerView");
                    that._rowsView = that.getView("rowsView");
                    that._columnsController = that.getController("columns");
                    that._tablePositionController = that.getController("tablePosition");
                    that._$parentContainer = that._columnsSeparatorView.component.element();
                    that._columnHeadersView.renderCompleted.add(generatePointsByColumnsHandler);
                    that._columnHeadersView.resizeCompleted.add(generatePointsByColumnsHandler);
                    that._columnsSeparatorView.renderCompleted.add(function() {
                        that._unsubscribeFromEvents();
                        that._subscribeToEvents()
                    });
                    that._rowsView.renderCompleted.add(function() {
                        that._rowsView.scrollOffsetChanged.remove(generatePointsByColumnsScrollHandler);
                        that._rowsView.scrollOffsetChanged.add(generatePointsByColumnsScrollHandler)
                    });
                    gridView = that.getView("gridView");
                    previousScrollbarVisibility = that._rowsView.getScrollbarWidth() !== 0;
                    that.getController("tablePosition").positionChanged.add(function() {
                        if (that._isResizing && !that._rowsView.isResizing) {
                            var scrollbarVisibility = that._rowsView.getScrollbarWidth() !== 0;
                            if (previousScrollbarVisibility !== scrollbarVisibility) {
                                previousScrollbarVisibility = scrollbarVisibility;
                                gridView.resize()
                            }
                            else {
                                that._rowsView.updateFreeSpaceRowHeight();
                                that._columnHeadersView.processSizeChanged()
                            }
                        }
                    })
                }
            },
            dispose: function() {
                this._unsubscribeFromEvents()
            }
        });
        dataGrid.TablePositionViewController = dataGrid.ViewController.inherit({
            update: function() {
                var $element = this._columnHeadersView.element(),
                    columnsHeadersHeight = this._columnHeadersView ? this._columnHeadersView.getHeight() : 0,
                    rowsHeight = this._rowsView ? this._rowsView.height() - this._rowsView.getScrollbarWidth(true) : 0;
                this.positionChanged.fire({
                    height: columnsHeadersHeight + rowsHeight,
                    top: $element && $element.length > 0 ? Math.floor($element[0].offsetTop) : 0
                })
            },
            init: function() {
                var that = this;
                that.callBase();
                that._columnHeadersView = this.getView("columnHeadersView");
                that._rowsView = this.getView("rowsView");
                that._pagerView = this.getView("pagerView");
                that._rowsView.resizeCompleted.add(function() {
                    that.update()
                })
            },
            ctor: function(component) {
                this.callBase(component);
                this.positionChanged = $.Callbacks()
            }
        });
        dataGrid.DraggingHeaderViewController = dataGrid.ViewController.inherit({
            _subscribeToEvent: function(draggingHeader, draggingPanels) {
                var that = this;
                $.each(draggingPanels, function(_, draggingPanel) {
                    if (draggingPanel) {
                        var columnElements = draggingPanel.getColumnElements() || [],
                            nameDraggingPanel = draggingPanel.getName(),
                            columns = draggingPanel.getColumns() || [];
                        $.each(columnElements, function(index, columnElement) {
                            $(columnElement).off(addNamespace('dxpointerdown', DATAGRID_MODULE_NAMESPACE));
                            $(columnElement).removeClass(DATAGRID_HEADERS_DRAG_ACTION_CLASS);
                            if (draggingPanel.allowDragging(columns[index], draggingPanels)) {
                                $(columnElement).addClass(DATAGRID_HEADERS_DRAG_ACTION_CLASS);
                                $(columnElement).on(addNamespace('dxpointerdown', DATAGRID_MODULE_NAMESPACE), that.createAction(function(args) {
                                    var e = args.jQueryEvent,
                                        eventData = events.eventData(e);
                                    e.preventDefault();
                                    draggingHeader.drag({
                                        deltaX: eventData.x - $(e.currentTarget).offset().left,
                                        deltaY: eventData.y - $(e.currentTarget).offset().top,
                                        sourceColumn: columns[index],
                                        columnIndex: index,
                                        columnElement: $(columnElement),
                                        sourceLocation: draggingPanel.getName(),
                                        draggingPanels: draggingPanels
                                    })
                                }))
                            }
                        })
                    }
                })
            },
            _getSeparator: function(targetLocation) {
                return targetLocation === "headers" ? this._columnsSeparatorView : this._blockSeparatorView
            },
            hideSeparators: function() {
                var blockSeparator = this._blockSeparatorView,
                    columnsSeparator = this._columnsSeparatorView;
                this._animationColumnIndex = null;
                blockSeparator && blockSeparator.hide();
                columnsSeparator && columnsSeparator.hide()
            },
            init: function() {
                var that = this,
                    subscribeToEvent;
                that.callBase();
                that._columnsController = that.getController("columns");
                that._columnHeadersView = that.getView("columnHeadersView");
                that._columnsSeparatorView = that.getView("columnsSeparatorView");
                that._draggingHeaderView = that.getView("draggingHeaderView");
                that._rowsView = that.getView('rowsView');
                that._blockSeparatorView = that.getView("blockSeparatorView");
                that._headerPanelView = that.getView("headerPanel");
                that._columnChooserView = that.getView("columnChooserView");
                subscribeToEvent = function() {
                    if (that._draggingHeaderView)
                        that._subscribeToEvent(that._draggingHeaderView, [that._columnChooserView, that._columnHeadersView, that._headerPanelView])
                };
                that._columnHeadersView.renderCompleted.add(subscribeToEvent);
                that._headerPanelView.renderCompleted.add(subscribeToEvent);
                that._columnChooserView && that._columnChooserView.renderCompleted.add(subscribeToEvent)
            },
            allowDrop: function(parameters) {
                return this._columnsController.allowMoveColumn(parameters.sourceColumnIndex, parameters.targetColumnIndex, parameters.sourceLocation, parameters.targetLocation)
            },
            allowDragColumn: function(columns, index, namePanel) {
                var column = columns[index],
                    i,
                    draggableColumnCount = 0;
                var allowDragFromHeaders = function(column) {
                        return column.allowReordering || column.allowGrouping || column.allowHiding
                    };
                if (!column)
                    return false;
                switch (namePanel) {
                    case"headers":
                        for (i = 0; i < columns.length; i++)
                            if (allowDragFromHeaders(columns[i]))
                                draggableColumnCount++;
                        return draggableColumnCount > 1 && allowDragFromHeaders(column);
                    case"group":
                        return column.allowGrouping;
                    case"columnChooser":
                        return column.allowHiding
                }
            },
            dock: function(parameters) {
                var that = this,
                    targetColumnIndex = parameters.targetColumnIndex,
                    sourceLocation = parameters.sourceLocation,
                    sourceColumnIndex = parameters.sourceColumnIndex,
                    sourceColumnElement = parameters.sourceColumnElement,
                    targetLocation = parameters.targetLocation,
                    separator = that._getSeparator(targetLocation),
                    hasTargetColumnIndex = targetColumnIndex >= 0;
                var showSeparator = function() {
                        if (that._animationColumnIndex !== targetColumnIndex) {
                            that.hideSeparators();
                            separator.element()[parameters.isLast ? 'insertAfter' : 'insertBefore'](parameters.targetColumnElement);
                            that._animationColumnIndex = targetColumnIndex;
                            separator.show(targetLocation)
                        }
                    };
                that._columnHeadersView.element().find('.' + DATAGRID_HEADER_ROW_CLASS).first().toggleClass(DATAGRID_HEADERS_DROP_HIGHLIGHT_CLASS, sourceLocation !== 'headers' && targetLocation === 'headers' && !hasTargetColumnIndex);
                if (separator) {
                    if (sourceColumnElement) {
                        sourceColumnElement.css({opacity: 0.5});
                        if (sourceLocation === 'headers')
                            that._rowsView.setRowsOpacity(sourceColumnIndex, 0.5)
                    }
                    if (that.allowDrop(parameters) && hasTargetColumnIndex)
                        if (targetLocation === 'group' || targetLocation === 'columnChooser')
                            showSeparator();
                        else {
                            that.hideSeparators();
                            separator.moveByX(parameters.posX - separator.width());
                            separator.show()
                        }
                    else
                        that.hideSeparators()
                }
            },
            drop: function(parameters) {
                var sourceColumnElement = parameters.sourceColumnElement;
                if (sourceColumnElement) {
                    sourceColumnElement.css({opacity: ''});
                    this._rowsView.setRowsOpacity(parameters.sourceColumnIndex, '');
                    this._columnHeadersView.element().find('.' + DATAGRID_HEADER_ROW_CLASS).first().removeClass(DATAGRID_HEADERS_DROP_HIGHLIGHT_CLASS)
                }
                if (this.allowDrop(parameters)) {
                    var separator = this._getSeparator(parameters.targetLocation);
                    if (separator)
                        separator.hide();
                    this._columnsController.moveColumn(parameters.sourceColumnIndex, parameters.targetColumnIndex, parameters.sourceLocation, parameters.targetLocation)
                }
            }
        });
        dataGrid.__internals = $.extend({}, dataGrid.__internals, {
            DATAGRID_COLUMNS_SEPARATOR_CLASS: DATAGRID_COLUMNS_SEPARATOR_CLASS,
            DATAGRID_COLUMNS_SEPARATOR_TRANSPARENT: DATAGRID_COLUMNS_SEPARATOR_TRANSPARENT,
            DATAGRID_DRAGGING_HEADER_CLASS: DATAGRID_DRAGGING_HEADER_CLASS,
            DATAGRID_HEADERS_DRAG_ACTION_CLASS: DATAGRID_HEADERS_DRAG_ACTION_CLASS,
            DATAGRID_CELL_CONTENT_CLASS: DATAGRID_CELL_CONTENT_CLASS,
            DATAGRID_TRACKER_CLASS: DATAGRID_TRACKER_CLASS,
            DATAGRID_MODULE_NAMESPACE: DATAGRID_MODULE_NAMESPACE,
            DATAGRID_HEADERS_DROP_HIGHLIGHT_CLASS: DATAGRID_HEADERS_DROP_HIGHLIGHT_CLASS,
            WIDGET_CLASS: WIDGET_CLASS
        });
        dataGrid.registerModule("columnsResizingReordering", {
            views: {
                columnsSeparatorView: dataGrid.ColumnsSeparatorView,
                blockSeparatorView: dataGrid.BlockSeparatorView,
                draggingHeaderView: dataGrid.DraggingHeaderView,
                trackerView: dataGrid.TrackerView
            },
            controllers: {
                draggingHeader: dataGrid.DraggingHeaderViewController,
                tablePosition: dataGrid.TablePositionViewController,
                columnsResizer: dataGrid.ColumnsResizerViewController
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.contextMenuView.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_CLASS = "dx-datagrid",
            DATAGRID_CONTEXT_MENU = "dx-context-menu";
        dataGrid.ContextMenuController = dataGrid.ViewController.inherit({getContextMenuItems: function($targetElement) {
                var menuItems;
                $.each(this.getViews(), function() {
                    if (this.getContextMenuItems) {
                        menuItems = this.getContextMenuItems($targetElement);
                        if (menuItems)
                            return false
                    }
                });
                return menuItems
            }});
        dataGrid.ContextMenuView = dataGrid.View.inherit({
            viewNames: function() {
                return ["columnHeadersView"]
            },
            _renderCore: function() {
                var that = this;
                that.element().addClass(DATAGRID_CONTEXT_MENU).dxContextMenu({
                    onPositioning: function(actionArgs) {
                        var event = actionArgs.jQueryEvent,
                            $targetElement = $(event.target),
                            contextMenuInstance = actionArgs.component,
                            items = items = that.getController('contextMenu').getContextMenuItems($targetElement);
                        if (items)
                            contextMenuInstance.option('items', items);
                        else
                            actionArgs.canceled = true
                    },
                    onItemClick: function(params) {
                        params.itemData.onItemClick && params.itemData.onItemClick(params)
                    },
                    rtlEnabled: that.option('rtlEnabled'),
                    cssClass: DATAGRID_CLASS,
                    target: that.component.element()
                })
            }
        });
        dataGrid.registerModule("contextMenu", {
            controllers: {contextMenu: dataGrid.ContextMenuController},
            views: {contextMenuView: dataGrid.ContextMenuView}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.keyboardNavigation.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils,
            events = ui.events,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_ROW_CLASS = "dx-row",
            DATAGRID_GROUP_ROW_CLASS = "dx-group-row",
            DATAGRID_ROWS_VIEW_CLASS = "dx-datagrid-rowsview",
            DATAGRID_MASTER_DETAIL_ROW_CLASS = "dx-master-detail-row",
            DATAGRID_GROUP_FOOTER_CLASS = "dx-datagrid-group-footer",
            DATAGRID_COMMAND_EXPAND_CLASS = "dx-command-expand",
            DATAGRID_VIEWS = ["rowsView"],
            DATAGRID_EDIT_MODE_ROW = "row";
        dataGrid.KeyboardNavigationController = dataGrid.ViewController.inherit({
            _focusView: function(view, viewIndex) {
                this._focusedViews.viewIndex = viewIndex;
                this._focusedView = view
            },
            _focusInput: function($cell) {
                var $input = $cell.find('input').first();
                this._testFocusedInput = $input;
                $input.focus()
            },
            _updateFocus: function() {
                var that = this,
                    $cell = that._getFocusedCell();
                if ($cell) {
                    if (that._hasSkipRow($cell.parent()))
                        $cell = that._getNextCell("upArrow");
                    if ($cell && $cell.length > 0)
                        setTimeout(function() {
                            if (that.getController('editorFactory').focus())
                                that._focus($cell);
                            that._editingController.isEditing() && $.proxy(that._focusInput, that)($cell)
                        })
                }
            },
            _clickHandler: function(e) {
                var event = e.jQueryEvent,
                    $cell = $(event.currentTarget);
                if (this._isCellValid($cell, true)) {
                    this._focusView(event.data.view, event.data.viewIndex);
                    this._updateFocusedCellPosition($cell);
                    if (!this._editingController.isEditing()) {
                        $cell.focus();
                        this._testCellIsFocused = true
                    }
                }
                else
                    this._resetFocusedCell(this)
            },
            _initFocusedViews: function() {
                var that = this,
                    clickAction = that.createAction(that._clickHandler);
                that._focusedViews = [];
                $.each(DATAGRID_VIEWS, function(key, viewName) {
                    var view = that.getView(viewName);
                    if (view.isVisible())
                        that._focusedViews.push(view)
                });
                $.each(that._focusedViews, function(index, view) {
                    if (view)
                        view.renderCompleted.add(function() {
                            var $element = view.element();
                            $element.off(events.addNamespace("dxpointerdown", "dxDataGridKeyboardNavigation"), clickAction);
                            $element.on(events.addNamespace("dxpointerdown", "dxDataGridKeyboardNavigation"), "." + DATAGRID_ROW_CLASS + " td", {
                                viewIndex: index,
                                view: view
                            }, clickAction);
                            that._initKeyDownProcessor(that, $element, that._keyDownHandler);
                            if (that._focusedView && that._focusedView.name === view.name && that._isNeedFocus)
                                that._updateFocus()
                        })
                })
            },
            _initKeyDownProcessor: function(context, element, handler) {
                if (this._keyDownProcessor) {
                    this._keyDownProcessor.dispose();
                    this._keyDownProcessor = null
                }
                this._keyDownProcessor = new ui.KeyboardProcessor({
                    element: element,
                    context: context,
                    handler: handler
                })
            },
            _getFocusedCell: function() {
                if (this._focusedView && this._focusedCellPosition)
                    return this._focusedView.getCell(this._focusedCellPosition)
            },
            _updateFocusedCellPosition: function($cell) {
                var that = this;
                if ($cell.length > 0)
                    this._focusedCellPosition = {
                        columnIndex: $cell[0].cellIndex,
                        rowIndex: $cell.parent().length > 0 && that._focusedView ? that._focusedView.getRowIndex($cell.parent()) : null
                    }
            },
            _isCellValid: function($cell, allCommandColumns) {
                if (utils.isDefined($cell)) {
                    var visibleColumns = this._columnsController.getVisibleColumns(),
                        columnIndex = $cell[0].cellIndex,
                        isExpandColumn = !allCommandColumns ? visibleColumns[columnIndex].command === "expand" : false;
                    if (visibleColumns.length > columnIndex && !utils.isDefined(visibleColumns[columnIndex].groupIndex))
                        return !utils.isDefined(visibleColumns[columnIndex].command) || isExpandColumn
                }
            },
            _isGroupRow: function($row) {
                return $row && $row.hasClass(DATAGRID_GROUP_ROW_CLASS)
            },
            _focus: function($cell) {
                var $row = $cell.parent(),
                    $focusedCell = this._getFocusedCell(),
                    $focusElement;
                $focusedCell && $focusedCell.attr("tabindex", null);
                if (this._isGroupRow($row)) {
                    $focusElement = $row;
                    this._focusedCellPosition.rowIndex = this._focusedView.getRowIndex($row)
                }
                else {
                    $focusElement = $cell;
                    this._updateFocusedCellPosition($cell)
                }
                $focusElement.attr("tabindex", 0);
                $focusElement.focus();
                this.getController('editorFactory').focus($focusElement)
            },
            _hasSkipRow: function($row) {
                return $row && ($row.hasClass(DATAGRID_MASTER_DETAIL_ROW_CLASS) || $row.hasClass(DATAGRID_GROUP_FOOTER_CLASS))
            },
            _enterKeyHandler: function(eventArgs, isEditing) {
                var $cell = this._getFocusedCell(),
                    editingOptions = this.option("editing"),
                    rowIndex = this._focusedCellPosition ? this._focusedCellPosition.rowIndex : null,
                    $row = this._focusedView && this._focusedView.getRow(rowIndex);
                if (this.option("grouping.allowCollapsing") && this._isGroupRow($row) || this.option("masterDetail.enabled") && $cell.hasClass(DATAGRID_COMMAND_EXPAND_CLASS)) {
                    var key = this._dataController.getKeyByRowIndex(rowIndex),
                        item = this._dataController.items()[rowIndex];
                    if (key !== undefined && item && item.data && !item.data.isContinuation)
                        this._dataController.changeRowExpand(key)
                }
                else {
                    var isRowEditMode = this._editingController.getEditMode() === DATAGRID_EDIT_MODE_ROW;
                    if (isEditing) {
                        this._updateFocusedCellPosition($(eventArgs.originalEvent.target).closest('td'));
                        if (isRowEditMode)
                            setTimeout($.proxy(this._editingController.saveEditData, this._editingController));
                        else
                            this._editingController.closeEditCell()
                    }
                    else if (editingOptions.editEnabled)
                        if (isRowEditMode)
                            this._editingController.editRow(rowIndex);
                        else
                            this._focusedCellPosition && this._editingController.editCell(rowIndex, this._focusedCellPosition.columnIndex)
                }
            },
            _leftRightKeysHandler: function(eventArgs, isEditing) {
                var rowIndex = this._focusedCellPosition ? this._focusedCellPosition.rowIndex : null,
                    $row = this._focusedView && this._focusedView.getRow(rowIndex),
                    $cell;
                if (!isEditing && !this._isGroupRow($row)) {
                    $cell = this._getNextCell(eventArgs.key);
                    if ($cell && this._isCellValid($cell))
                        this._focus($cell);
                    eventArgs.originalEvent.preventDefault()
                }
            },
            _upDownKeysHandler: function(eventArgs, isEditing) {
                var rowIndex = this._focusedCellPosition ? this._focusedCellPosition.rowIndex : null,
                    $cell;
                if (!isEditing) {
                    if (rowIndex === 0 || this._focusedView && rowIndex === this._focusedView.getRowsCount() - 1);
                    $cell = this._getNextCell(eventArgs.key);
                    if ($cell && this._isCellValid($cell))
                        this._focus($cell);
                    eventArgs.originalEvent.preventDefault()
                }
            },
            _pageUpKeyHandler: function(eventArgs) {
                var scrollingMode = this.option("scrolling.mode"),
                    pageIndex = this._dataController.pageIndex(),
                    isVirtualScrolling = scrollingMode === "virtual" || scrollingMode === "infinite";
                if (pageIndex > 0 && !isVirtualScrolling) {
                    this._dataController.pageIndex(pageIndex - 1);
                    eventArgs.originalEvent.preventDefault()
                }
            },
            _pageDownKeyHandler: function(eventArgs) {
                var scrollingMode = this.option("scrolling.mode"),
                    isVirtualScrolling = scrollingMode === "virtual" || scrollingMode === "infinite",
                    pageIndex = this._dataController.pageIndex(),
                    pageCount = this._dataController.pageCount();
                if (pageIndex < pageCount - 1 && !isVirtualScrolling) {
                    this._dataController.pageIndex(pageIndex + 1);
                    eventArgs.originalEvent.preventDefault()
                }
            },
            _spaceKeyHandler: function(eventArgs, isEditing) {
                var rowIndex = this._focusedCellPosition ? this._focusedCellPosition.rowIndex : null;
                if (this.option("selection") && this.option("selection").mode !== "none" && !isEditing) {
                    this._selectionController.changeItemSelection(rowIndex, {
                        shift: eventArgs.shift,
                        control: eventArgs.ctrl
                    });
                    eventArgs.originalEvent.preventDefault()
                }
            },
            _crtlAKeyHandler: function(eventArgs) {
                if (eventArgs.ctrl && this.option("selection.mode") === "multiple" && this.option("selection.allowSelectAll")) {
                    this._selectionController.selectAll();
                    eventArgs.originalEvent.preventDefault()
                }
            },
            _tabKeyHandler: function(eventArgs, isEditing) {
                var editingOptions = this.option('editing'),
                    $cell;
                if (editingOptions && eventArgs.originalEvent.target && isEditing) {
                    if (!editingOptions.editEnabled)
                        this._editingController.closeEditCell();
                    this._updateFocusedCellPosition($(eventArgs.originalEvent.target).closest('td'));
                    $cell = this._getNextCell("rightArrow");
                    if (this._isCellValid($cell)) {
                        this._focus($cell);
                        if (this._editingController.getEditMode() !== DATAGRID_EDIT_MODE_ROW && editingOptions.editEnabled)
                            this._editingController.editCell(this._focusedCellPosition.rowIndex, this._focusedCellPosition.columnIndex);
                        else
                            this._focusInput($cell)
                    }
                }
                eventArgs.originalEvent.preventDefault()
            },
            _escapeKeyHandler: function(eventArgs, isEditing) {
                if (isEditing) {
                    this._updateFocusedCellPosition($(eventArgs.originalEvent.target).closest('td'));
                    if (this._editingController.getEditMode() !== DATAGRID_EDIT_MODE_ROW)
                        this._editingController.closeEditCell();
                    else
                        this._editingController.cancelEditData();
                    eventArgs.originalEvent.preventDefault()
                }
            },
            _ctrlFKeyHandler: function(eventArgs) {
                if (eventArgs.ctrl && this.option("searchPanel") && this.option("searchPanel").visible) {
                    this._testHeaderPanelFocused = true;
                    this._headerPanel.focus();
                    eventArgs.originalEvent.preventDefault()
                }
            },
            _keyDownHandler: function(e) {
                var isEditing = this._editingController.isEditing();
                if (e.originalEvent.isDefaultPrevented())
                    return;
                this._isNeedFocus = true;
                switch (e.key) {
                    case"leftArrow":
                    case"rightArrow":
                        this._leftRightKeysHandler(e, isEditing);
                        break;
                    case"upArrow":
                    case"downArrow":
                        this._upDownKeysHandler(e, isEditing);
                        break;
                    case"pageUp":
                        this._pageUpKeyHandler(e);
                        break;
                    case"pageDown":
                        this._pageDownKeyHandler(e);
                        break;
                    case"space":
                        this._spaceKeyHandler(e, isEditing);
                        break;
                    case"A":
                        this._crtlAKeyHandler(e);
                        break;
                    case"tab":
                        this._tabKeyHandler(e, isEditing);
                        break;
                    case"enter":
                        this._enterKeyHandler(e, isEditing);
                        break;
                    case"escape":
                        this._escapeKeyHandler(e, isEditing);
                        break;
                    case"F":
                        this._ctrlFKeyHandler(e);
                        break
                }
                e.originalEvent.stopPropagation()
            },
            _isLastRow: function(rowIndex) {
                return rowIndex === this._dataController.items().length - 1
            },
            _getNextCell: function(keyCode, cellPosition) {
                var focusedCellPosition = cellPosition || this._focusedCellPosition,
                    columnIndex,
                    rowIndex,
                    $cell,
                    $row,
                    visibleColumnsCount;
                if (this._focusedView && focusedCellPosition) {
                    columnIndex = focusedCellPosition.columnIndex;
                    rowIndex = focusedCellPosition.rowIndex;
                    visibleColumnsCount = this.getController("columns").getVisibleColumns().length;
                    switch (keyCode) {
                        case"rightArrow":
                            columnIndex = columnIndex < visibleColumnsCount - 1 ? columnIndex + 1 : columnIndex;
                            break;
                        case"leftArrow":
                            columnIndex = columnIndex > 0 ? columnIndex - 1 : columnIndex;
                            break;
                        case"upArrow":
                            rowIndex = rowIndex > 0 ? rowIndex - 1 : rowIndex;
                            break;
                        case"downArrow":
                            rowIndex = !this._isLastRow(rowIndex) ? rowIndex + 1 : rowIndex;
                            break
                    }
                    $cell = this._focusedView.getCell({
                        columnIndex: columnIndex,
                        rowIndex: rowIndex
                    });
                    if (!this._isCellValid($cell) && columnIndex > 0 && columnIndex < visibleColumnsCount - 1)
                        $cell = this._getNextCell(keyCode, $.extend({}, focusedCellPosition, {columnIndex: columnIndex}));
                    $row = $cell.parent();
                    if (this._hasSkipRow($row)) {
                        rowIndex = this._focusedView.getRowIndex($row);
                        if (!this._isLastRow(rowIndex))
                            $cell = this._getNextCell(keyCode, $.extend({}, focusedCellPosition, {rowIndex: rowIndex}));
                        else
                            return null
                    }
                    return $cell
                }
                return null
            },
            _resetFocusedCell: function(that) {
                var $cell = that._getFocusedCell();
                $cell && $cell.attr("tabindex", null);
                that._isNeedFocus = false
            },
            init: function() {
                var that = this;
                if (that.option("useKeyboard")) {
                    that._dataController = that.getController("data");
                    that._selectionController = that.getController("selection");
                    that._editingController = that.getController("editing");
                    that._headerPanel = that.getView("headerPanel");
                    that._columnsController = that.getController("columns");
                    that.getController("editorFactory").focused.add(function($element) {
                        that.setupFocusedView();
                        if (that._isNeedFocus)
                            if (that._focusedView && that._focusedView.getScrollable) {
                                that._focusedView.getScrollable().scrollToElement($element);
                                that._isNeedFocus = false
                            }
                    });
                    that._focusedCellPosition = {
                        columnIndex: 0,
                        rowIndex: 0
                    };
                    that._dataController.changed.add(function(change) {
                        if (that._focusedCellPosition && change && change.changeType === 'prepend')
                            that._focusedCellPosition.rowIndex += change.items.length
                    });
                    that._initFocusedViews();
                    that._documentClickHandler = that.createAction(function(e) {
                        if (!$(e.jQueryEvent.target).closest("." + DATAGRID_ROWS_VIEW_CLASS).length)
                            that._resetFocusedCell(that)
                    });
                    $(document).on(events.addNamespace("dxpointerdown", "dxDataGridKeyboardNavigation"), that._documentClickHandler)
                }
            },
            setupFocusedView: function() {
                if (!utils.isDefined(this._focusedView))
                    this.focusViewByName("rowsView")
            },
            focusViewByName: function(viewName) {
                var view = this.getFocusViewByName(viewName);
                this._focusView(view.view, view.viewIndex)
            },
            getFocusViewByName: function(viewName) {
                var focusView;
                $.each(this._focusedViews, function(index, view) {
                    if (view.name === viewName)
                        return focusView = {
                                viewIndex: index,
                                view: view
                            }
                });
                return focusView
            },
            optionChanged: function(args) {
                var that = this;
                switch (args.name) {
                    case'useKeyboard':
                        args.handled = true;
                        break;
                    default:
                        that.callBase(args)
                }
            },
            dispose: function() {
                this.callBase();
                this._focusedView = null;
                this._focusedViews = null;
                this._keyDownProcessor && this._keyDownProcessor.dispose();
                $(document).off(events.addNamespace("dxpointerdown", "dxDataGridKeyboardNavigation"), this._documentClickHandler)
            }
        });
        $.extend(dataGrid.__internals, {
            DATAGRID_GROUP_ROW_CLASS: DATAGRID_GROUP_ROW_CLASS,
            DATAGRID_ROW_CLASS: DATAGRID_ROW_CLASS
        });
        dataGrid.registerModule("keyboardNavigation", {
            defaultOptions: function() {
                return {useKeyboard: true}
            },
            controllers: {keyboardNavigation: dataGrid.KeyboardNavigationController},
            extenders: {
                views: {rowsView: {_renderCore: function(change) {
                            this.callBase(change);
                            this.element().attr("tabindex", this.option("useKeyboard") ? 0 : null)
                        }}},
                controllers: {editing: {editCell: function(rowIndex, columnIndex) {
                            var isCellEditing = this.callBase(rowIndex, columnIndex),
                                keyboardNavigationController = this.getController("keyboardNavigation");
                            if (isCellEditing)
                                keyboardNavigationController.setupFocusedView();
                            return isCellEditing
                        }}}
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.errorHandling.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid;
        var DATAGRID_ERROR_ROW_CLASS = "dx-error-row",
            DATAGRID_ROW_CLASS = "dx-row",
            DATAGRID_DATA_ROW_CLASS = "dx-data-row",
            DATAGRID_ERROR_MESSAGE_CLASS = "dx-error-message",
            DATAGRID_ERROR_CLOSEBUTTON_CLASS = "dx-closebutton",
            DATAGRID_ACTION_CLASS = "dx-datagrid-action";
        dataGrid.ErrorHandlingController = dataGrid.ViewController.inherit({
            init: function() {
                var that = this;
                that._columnHeadersView = that.getView("columnHeadersView");
                that._rowsView = that.getView("rowsView")
            },
            renderErrorRow: function(message, rowIndex) {
                var that = this,
                    viewElement = rowIndex >= 0 ? that._rowsView : that._columnHeadersView,
                    $tableElement = viewElement.tableElement(),
                    $errorRow = $("<tr />").addClass(DATAGRID_ERROR_ROW_CLASS),
                    $row = $tableElement.find("." + DATAGRID_DATA_ROW_CLASS).eq(rowIndex),
                    $errorMessage = $("<div/>").addClass(DATAGRID_ERROR_MESSAGE_CLASS).text(message),
                    $closeButton = $("<div/>").addClass(DATAGRID_ERROR_CLOSEBUTTON_CLASS).addClass(DATAGRID_ACTION_CLASS);
                if (rowIndex >= 0) {
                    that.removeErrorRow($tableElement.find("tr").eq($row.index() + 1));
                    $errorRow.insertAfter($row)
                }
                else {
                    that.removeErrorRow($tableElement.find("tr").last());
                    $tableElement.append($errorRow)
                }
                $closeButton.on("dxclick", that.createAction(function(args) {
                    var e = args.jQueryEvent,
                        $currentErrorRow = $(e.currentTarget).closest("." + DATAGRID_ERROR_ROW_CLASS);
                    e.stopPropagation();
                    that.removeErrorRow($currentErrorRow)
                }));
                $("<td/>").attr("colspan", that._columnHeadersView.getColumnCount()).prepend($closeButton).append($errorMessage).appendTo($errorRow)
            },
            removeErrorRow: function($row) {
                $row.hasClass(DATAGRID_ERROR_ROW_CLASS) && $row.remove()
            },
            optionChanged: function(args) {
                var that = this;
                switch (args.name) {
                    case'errorRowEnabled':
                        args.handled = true;
                        break;
                    default:
                        that.callBase(args)
                }
            }
        });
        dataGrid.registerModule('errorHandling', {
            defaultOptions: function() {
                return {errorRowEnabled: true}
            },
            controllers: {errorHandling: dataGrid.ErrorHandlingController},
            extenders: {controllers: {
                    data: {init: function() {
                            var that = this,
                                errorHandlingController = that.getController('errorHandling');
                            that.callBase();
                            that.dataErrorOccurred.add(function(error) {
                                var message = error && error.message || error;
                                if (that.option("errorRowEnabled"))
                                    errorHandlingController.renderErrorRow(message)
                            })
                        }},
                    validating: {_rowValidating: function(group, validate) {
                            var that = this,
                                errorHandlingController = that.getController('errorHandling'),
                                result = that.callBase(group, validate);
                            if (!result.isValid && result.errorText)
                                errorHandlingController.renderErrorRow(result.errorText, result.rowIndex);
                            return result
                        }}
                }}
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.summaryModule.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid,
            normalizeSortingInfo = DX.data.utils.normalizeSortingInfo;
        var DATAGRID_TOTAL_FOOTER_CLASS = "dx-datagrid-total-footer",
            DATAGRID_SUMMARY_ITEM_CLASS = "dx-datagrid-summary-item",
            DATAGRID_TEXT_CONTENT_CLASS = "dx-datagrid-text-content",
            DATAGRID_GROUP_FOOTER_CLASS = "dx-datagrid-group-footer",
            DATAGRID_GROUP_FOOTER_ROW_TYPE = "groupFooter";
        var renderSummaryCell = function(summaryItems, column, summaryTexts) {
                var i,
                    $cell = $("<td>"),
                    summaryItem,
                    $summaryItems = [];
                if (!column.command && summaryItems) {
                    for (i = 0; i < summaryItems.length; i++) {
                        summaryItem = summaryItems[i];
                        $summaryItems.push($("<div>").css('text-align', summaryItem.alignment || column.alignment).addClass(DATAGRID_SUMMARY_ITEM_CLASS).addClass(DATAGRID_TEXT_CONTENT_CLASS).addClass(summaryItem.cssClass).text(dataGrid.getSummaryText(summaryItem, summaryTexts)))
                    }
                    $cell.append($summaryItems)
                }
                return $cell
            };
        dataGrid.FooterView = dataGrid.ColumnsView.inherit(function() {
            return {
                    _renderTable: function(totalItem) {
                        var columns = this._columnsController.getVisibleColumns(),
                            $table = this._createTable(columns),
                            $row = this._createRow(),
                            summaryTexts = this.option("summary.texts"),
                            columnsLength = columns.length,
                            column,
                            i;
                        for (i = 0; i < columnsLength; i++) {
                            column = columns[i];
                            $row.append(renderSummaryCell(totalItem.summaryCells[i], column, summaryTexts))
                        }
                        return $table.append($row)
                    },
                    _renderCore: function() {
                        var totalItem = this._dataController.footerItems()[0];
                        this.element().empty().addClass(DATAGRID_TOTAL_FOOTER_CLASS);
                        if (totalItem && totalItem.summaryCells && totalItem.summaryCells.length) {
                            this._tableElement = this._renderTable(totalItem);
                            this.wrapTableInScrollContainer(this._tableElement).appendTo(this.element())
                        }
                    },
                    _columnOptionChanged: function(e) {
                        var optionNames = e.optionNames;
                        if (e.changeTypes.grouping)
                            return;
                        if (optionNames.width || optionNames.visibleWidth)
                            this.callBase(e)
                    },
                    _handleDataChanged: function() {
                        this.render()
                    },
                    getHeight: function() {
                        var $element = this.element();
                        return $element ? $element.outerHeight() : 0
                    },
                    isVisible: function() {
                        return !!this._dataController.footerItems().length
                    }
                }
        }());
        var SummaryDataSourceAdapterExtender = function() {
                return {
                        init: function() {
                            this.callBase.apply(this, arguments);
                            this._totalAggregates = []
                        },
                        summary: function(summary) {
                            if (!arguments.length)
                                return this._summary;
                            this._summary = summary
                        },
                        totalAggregates: function() {
                            return this._totalAggregates
                        }
                    }
            }();
        var SummaryDataSourceAdapterClientExtender = function() {
                var calculateAggregates = function(that, summary, data, groupLevel) {
                        var calculator;
                        if (summary) {
                            calculator = new DX.data.AggregateCalculator({
                                totalAggregates: summary.totalAggregates,
                                groupAggregates: summary.groupAggregates,
                                data: data,
                                groupLevel: groupLevel
                            });
                            calculator.calculate()
                        }
                        that._totalAggregates = calculator ? calculator.totalAggregates() : []
                    };
                var sortGroupsBySummaryCore = function(items, groups, sortByGroups) {
                        if (!items || !groups.length)
                            return items;
                        var group = groups[0],
                            sorts = sortByGroups[0],
                            query;
                        if (group && sorts && sorts.length) {
                            query = DX.data.query(items);
                            $.each(sorts, function(index) {
                                if (index === 0)
                                    query = query.sortBy(this.selector, this.desc);
                                else
                                    query = query.thenBy(this.selector, this.desc)
                            });
                            query.enumerate().done(function(sortedItems) {
                                items = sortedItems
                            })
                        }
                        groups = groups.slice(1);
                        sortByGroups = sortByGroups.slice(1);
                        if (groups.length && sortByGroups.length)
                            $.each(items, function() {
                                this.items = sortGroupsBySummaryCore(this.items, groups, sortByGroups)
                            });
                        return items
                    };
                var sortGroupsBySummary = function(data, group, summary) {
                        var sortByGroups = summary && summary.sortByGroups && summary.sortByGroups();
                        if (sortByGroups && sortByGroups.length)
                            return sortGroupsBySummaryCore(data, group, sortByGroups);
                        return data
                    };
                return {_handleDataLoadedCore: function(options) {
                            var that = this,
                                groups = normalizeSortingInfo(options.loadOptions.group || []),
                                summary = that.summary();
                            calculateAggregates(that, summary, options.data, groups.length);
                            options.data = sortGroupsBySummary(options.data, groups, summary);
                            that.callBase(options)
                        }}
            }();
        dataGrid.DataSourceAdapterServer = dataGrid.DataSourceAdapterServer.inherit(SummaryDataSourceAdapterExtender);
        dataGrid.DataSourceAdapterClient = dataGrid.DataSourceAdapterClient.inherit(SummaryDataSourceAdapterExtender).inherit(SummaryDataSourceAdapterClientExtender);
        dataGrid.renderSummaryCell = renderSummaryCell;
        $.extend(dataGrid.__internals, {
            DATAGRID_TOTAL_FOOTER_CLASS: DATAGRID_TOTAL_FOOTER_CLASS,
            DATAGRID_SUMMARY_ITEM_CLASS: DATAGRID_SUMMARY_ITEM_CLASS,
            DATAGRID_GROUP_FOOTER_CLASS: DATAGRID_GROUP_FOOTER_CLASS
        });
        dataGrid.registerModule('summary', {
            defaultOptions: function() {
                return {
                        summary: {
                            groupItems: undefined,
                            totalItems: undefined,
                            calculateCustomSummary: undefined,
                            texts: {
                                sum: Globalize.localize("dxDataGrid-summarySum"),
                                sumOtherColumn: Globalize.localize("dxDataGrid-summarySumOtherColumn"),
                                min: Globalize.localize("dxDataGrid-summaryMin"),
                                minOtherColumn: Globalize.localize("dxDataGrid-summaryMinOtherColumn"),
                                max: Globalize.localize("dxDataGrid-summaryMax"),
                                maxOtherColumn: Globalize.localize("dxDataGrid-summaryMaxOtherColumn"),
                                avg: Globalize.localize("dxDataGrid-summaryAvg"),
                                avgOtherColumn: Globalize.localize("dxDataGrid-summaryAvgOtherColumn"),
                                count: Globalize.localize("dxDataGrid-summaryCount")
                            }
                        },
                        sortByGroupSummaryInfo: undefined
                    }
            },
            views: {footerView: dataGrid.FooterView},
            extenders: {
                controllers: {data: function() {
                        return {
                                _isDataColumn: function(column) {
                                    return column && (!utils.isDefined(column.groupIndex) || column.showWhenGrouped)
                                },
                                _isGroupFooterVisible: function() {
                                    var groupItems = this.option("summary.groupItems") || [],
                                        groupItem,
                                        column,
                                        i;
                                    for (i = 0; i < groupItems.length; i++) {
                                        groupItem = groupItems[i];
                                        column = this._columnsController.columnOption(groupItem.column);
                                        if (groupItem.showInGroupFooter && this._isDataColumn(column))
                                            return true
                                    }
                                    return false
                                },
                                _processGroupItems: function(items, groupCount, options) {
                                    var result = this.callBase.apply(this, arguments);
                                    if (options) {
                                        if (options.isGroupFooterVisible === undefined)
                                            options.isGroupFooterVisible = this._isGroupFooterVisible();
                                        if (options.data && options.data.items && options.isGroupFooterVisible)
                                            result.push({
                                                rowType: DATAGRID_GROUP_FOOTER_ROW_TYPE,
                                                data: options.data,
                                                groupIndex: options.path.length - 1,
                                                values: options.path
                                            })
                                    }
                                    return result
                                },
                                _processGroupItem: function(groupItem, options) {
                                    var that = this;
                                    if (!options.summaryGroupItems)
                                        options.summaryGroupItems = that.option("summary.groupItems") || [];
                                    if (groupItem.rowType === "group") {
                                        var groupColumnIndex = -1;
                                        $.each(options.visibleColumns, function() {
                                            if (groupItem.groupIndex === this.groupIndex) {
                                                groupColumnIndex = this.index;
                                                return false
                                            }
                                        });
                                        groupItem.summaryCells = this._calculateSummaryCells(options.summaryGroupItems, groupItem.data.aggregates || [], options.visibleColumns, function(summaryItem, column) {
                                            if (summaryItem.showInGroupFooter)
                                                return -1;
                                            if (summaryItem.groupRowDisplayMode === "alignByColumn" && column && !utils.isDefined(column.groupIndex))
                                                return column.index;
                                            else
                                                return groupColumnIndex
                                        })
                                    }
                                    if (groupItem.rowType === DATAGRID_GROUP_FOOTER_ROW_TYPE)
                                        groupItem.summaryCells = this._calculateSummaryCells(options.summaryGroupItems, groupItem.data.aggregates || [], options.visibleColumns, function(summaryItem, column) {
                                            return summaryItem.showInGroupFooter && that._isDataColumn(column) ? column.index : -1
                                        });
                                    return groupItem
                                },
                                _calculateSummaryCells: function(summaryItems, aggregates, visibleColumns, calculateTargetColumnIndex) {
                                    var that = this,
                                        summaryCells = [],
                                        summaryCellsByColumns = {};
                                    $.each(summaryItems, function(summaryIndex, summaryItem) {
                                        var column = that._columnsController.columnOption(summaryItem.column),
                                            showInColumn = summaryItem.showInColumn && that._columnsController.columnOption(summaryItem.showInColumn) || column,
                                            columnIndex = calculateTargetColumnIndex(summaryItem, showInColumn),
                                            aggregate;
                                        if (columnIndex >= 0) {
                                            if (!summaryCellsByColumns[columnIndex])
                                                summaryCellsByColumns[columnIndex] = [];
                                            aggregate = aggregates[summaryIndex];
                                            if (utils.isDefined(aggregate) && !isNaN(aggregate))
                                                summaryCellsByColumns[columnIndex].push($.extend({}, summaryItem, {
                                                    value: aggregate,
                                                    columnCaption: column && column.index !== columnIndex ? column.caption : undefined
                                                }))
                                        }
                                    });
                                    if (!$.isEmptyObject(summaryCellsByColumns))
                                        $.each(visibleColumns, function() {
                                            summaryCells.push(summaryCellsByColumns[this.index] || [])
                                        });
                                    return summaryCells
                                },
                                _updateItemsCore: function(change) {
                                    var that = this,
                                        summaryCells,
                                        visibleColumns,
                                        totalAggregates,
                                        columnsController = that._columnsController,
                                        dataSource = that._dataSource,
                                        summaryTotalItems = that.option("summary.totalItems");
                                    that.callBase(change);
                                    that._footerItems = [];
                                    if (dataSource && summaryTotalItems && summaryTotalItems.length) {
                                        totalAggregates = dataSource.totalAggregates();
                                        visibleColumns = columnsController.getVisibleColumns();
                                        summaryCells = that._calculateSummaryCells(summaryTotalItems, totalAggregates, visibleColumns, function(summaryItem, column) {
                                            return that._isDataColumn(column) ? column.index : -1
                                        });
                                        if (summaryCells.length)
                                            that._footerItems.push({
                                                rowType: 'totalFooter',
                                                summaryCells: summaryCells
                                            })
                                    }
                                },
                                _getAggregates: function(summaryItems) {
                                    var that = this,
                                        columnsController = that.getController("columns"),
                                        calculateCustomSummary = that.option("summary.calculateCustomSummary");
                                    return $.map(summaryItems || [], function(summaryItem) {
                                            var column = columnsController.columnOption(summaryItem.column),
                                                calculateCellValue = column && column.calculateCellValue ? $.proxy(column, "calculateCellValue") : DX.data.utils.compileGetter(column ? column.dataField : summaryItem.column),
                                                aggregator = summaryItem.summaryType || "count",
                                                selector = calculateCellValue,
                                                options;
                                            if (aggregator === 'avg' || aggregator === 'sum')
                                                selector = function(data) {
                                                    return Number(calculateCellValue(data))
                                                };
                                            if (aggregator === "custom") {
                                                if (!calculateCustomSummary) {
                                                    DX.log("E1026");
                                                    calculateCustomSummary = function(){}
                                                }
                                                options = {
                                                    component: that.component,
                                                    name: summaryItem.name,
                                                    summaryProcess: "start",
                                                    totalValue: undefined
                                                };
                                                calculateCustomSummary(options);
                                                options.summaryProcess = "calculate";
                                                aggregator = {
                                                    seed: options.totalValue,
                                                    step: function(totalValue, value) {
                                                        options.summaryProcess = "calculate";
                                                        options.totalValue = totalValue;
                                                        options.value = value;
                                                        calculateCustomSummary(options);
                                                        return options.totalValue
                                                    },
                                                    finalize: function(totalValue) {
                                                        options.summaryProcess = "finalize";
                                                        options.totalValue = totalValue;
                                                        delete options.value;
                                                        calculateCustomSummary(options);
                                                        return options.totalValue
                                                    }
                                                }
                                            }
                                            return {
                                                    selector: selector,
                                                    aggregator: aggregator
                                                }
                                        })
                                },
                                _addSortInfo: function(sortByGroups, groupColumn, selector, sortOrder) {
                                    var groupIndex;
                                    if (groupColumn) {
                                        groupIndex = groupColumn.groupIndex;
                                        sortOrder = sortOrder || groupColumn.sortOrder;
                                        if (utils.isDefined(groupIndex)) {
                                            sortByGroups[groupIndex] = sortByGroups[groupIndex] || [];
                                            sortByGroups[groupIndex].push({
                                                selector: selector,
                                                desc: sortOrder === "desc"
                                            })
                                        }
                                    }
                                },
                                _findSummaryItem: function(summaryItems, name) {
                                    var summaryItemIndex = -1;
                                    var getFullName = function(summaryItem) {
                                            var summaryType = summaryItem.summaryType,
                                                column = summaryItem.column;
                                            return summaryType && column && summaryType + "_" + column
                                        };
                                    if (utils.isDefined(name))
                                        $.each(summaryItems || [], function(index) {
                                            if (this.name === name || index === name || this.summaryType === name || this.column === name || getFullName(this) === name) {
                                                summaryItemIndex = index;
                                                return false
                                            }
                                        });
                                    return summaryItemIndex
                                },
                                _getSummarySortByGroups: function(sortByGroupSummaryInfo, groupSummaryItems) {
                                    var that = this,
                                        columnsController = that._columnsController,
                                        groupColumns = columnsController.getGroupColumns(),
                                        sortByGroups = [];
                                    if (!groupSummaryItems || !groupSummaryItems.length)
                                        return;
                                    $.each(sortByGroupSummaryInfo || [], function() {
                                        var groupIndex,
                                            sortOrder = this.sortOrder,
                                            groupColumn = this.groupColumn,
                                            summaryItemIndex = that._findSummaryItem(groupSummaryItems, this.summaryItem),
                                            sortItem;
                                        if (summaryItemIndex < 0)
                                            return;
                                        var selector = function(data) {
                                                return data.aggregates[summaryItemIndex]
                                            };
                                        if (utils.isDefined(groupColumn)) {
                                            groupColumn = columnsController.columnOption(groupColumn);
                                            that._addSortInfo(sortByGroups, groupColumn, selector, sortOrder)
                                        }
                                        else
                                            $.each(groupColumns, function(groupIndex, groupColumn) {
                                                that._addSortInfo(sortByGroups, groupColumn, selector, sortOrder)
                                            })
                                    });
                                    return sortByGroups
                                },
                                _createDataSourceAdapterCore: function(dataSource, remoteOperations) {
                                    var summary = this._getSummaryOptions(),
                                        dataSourceAdapter;
                                    if (remoteOperations === 'auto' && summary)
                                        remoteOperations = {
                                            filtering: true,
                                            sorting: true,
                                            paging: false
                                        };
                                    dataSourceAdapter = this.callBase(dataSource, remoteOperations);
                                    dataSourceAdapter.summary(summary);
                                    return dataSourceAdapter
                                },
                                _getSummaryOptions: function() {
                                    var that = this,
                                        groupSummaryItems = that.option("summary.groupItems"),
                                        totalSummaryItems = that.option("summary.totalItems"),
                                        sortByGroupSummaryInfo = that.option("sortByGroupSummaryInfo"),
                                        groupAggregates = that._getAggregates(groupSummaryItems),
                                        totalAggregates = that._getAggregates(totalSummaryItems),
                                        sortByGroups = function() {
                                            return that._getSummarySortByGroups(sortByGroupSummaryInfo, groupSummaryItems)
                                        };
                                    if (groupAggregates.length || totalAggregates.length)
                                        return {
                                                groupAggregates: groupAggregates,
                                                totalAggregates: totalAggregates,
                                                sortByGroups: sortByGroups
                                            }
                                },
                                publicMethods: function() {
                                    var methods = this.callBase();
                                    methods.push("getTotalSummaryValue");
                                    return methods
                                },
                                getTotalSummaryValue: function(summaryItemName) {
                                    var summaryItemIndex = this._findSummaryItem(this.option("summary.totalItems"), summaryItemName),
                                        aggregates = this._dataSource.totalAggregates();
                                    if (aggregates.length && summaryItemIndex > -1)
                                        return aggregates[summaryItemIndex]
                                },
                                optionChanged: function(args) {
                                    if (args.name === "summary" || args.name === "sortByGroupSummaryInfo")
                                        args.name = "dataSource";
                                    this.callBase(args)
                                },
                                init: function() {
                                    this._footerItems = [];
                                    this.callBase()
                                },
                                footerItems: function() {
                                    return this._footerItems
                                }
                            }
                    }()},
                views: {rowsView: function() {
                        return {
                                _createRow: function(item) {
                                    var $row = this.callBase(item);
                                    item && $row.addClass(item.rowType === DATAGRID_GROUP_FOOTER_ROW_TYPE ? DATAGRID_GROUP_FOOTER_CLASS : "");
                                    return $row
                                },
                                _renderCells: function(item, options) {
                                    var columns = options.columns,
                                        summaryCells,
                                        $summaryCells = [],
                                        summaryTexts = this.option("summary.texts"),
                                        i;
                                    if (item.rowType === DATAGRID_GROUP_FOOTER_ROW_TYPE) {
                                        summaryCells = item.summaryCells;
                                        for (i = 0; i < columns.length; i++)
                                            $summaryCells.push(renderSummaryCell(summaryCells[i], columns[i], summaryTexts));
                                        return $summaryCells
                                    }
                                    else
                                        return this.callBase(item, options)
                                }
                            }
                    }()}
            }
        })
    })(jQuery, DevExpress);
    /*! Module widgets-web, file ui.dataGrid.masterDetailModule.js */
    (function($, DX) {
        var ui = DX.ui,
            utils = DX.utils,
            dataGrid = ui.dxDataGrid,
            DATAGRID_MASTER_DETAIL_CELL_CLASS = "dx-master-detail-cell",
            DATAGRID_MASTER_DETAIL_ROW_CLASS = "dx-master-detail-row",
            DATAGRID_ROW_LINES_CLASS = "dx-row-lines";
        $.extend(dataGrid.__internals, {
            DATAGRID_MASTER_DETAIL_CELL_CLASS: DATAGRID_MASTER_DETAIL_CELL_CLASS,
            DATAGRID_MASTER_DETAIL_ROW_CLASS: DATAGRID_MASTER_DETAIL_ROW_CLASS,
            DATAGRID_ROW_LINES_CLASS: DATAGRID_ROW_LINES_CLASS
        });
        dataGrid.registerModule('masterDetail', {
            defaultOptions: function() {
                return {masterDetail: {
                            enabled: false,
                            autoExpandAll: false,
                            template: null
                        }}
            },
            extenders: {
                controllers: {
                    editorFactory: {focus: function($element) {
                            if ($element && $element.hasClass(DATAGRID_MASTER_DETAIL_CELL_CLASS))
                                this.loseFocus();
                            else
                                return this.callBase($element)
                        }},
                    columns: {_getExpandColumnsCore: function() {
                            var expandColumns = this.callBase();
                            if (this.option('masterDetail.enabled'))
                                expandColumns.push({});
                            return expandColumns
                        }},
                    data: function() {
                        var initMasterDetail = function(that) {
                                that._expandedItems = [];
                                that._isExpandAll = that.option('masterDetail.autoExpandAll')
                            };
                        return {
                                init: function() {
                                    var that = this;
                                    initMasterDetail(that);
                                    that.loadingChanged.add(function(isLoading) {
                                        if (!isLoading)
                                            that._expandedItems = $.grep(that._expandedItems, function(item) {
                                                return item.visible
                                            })
                                    });
                                    that.callBase()
                                },
                                expandAll: function(groupIndex) {
                                    var that = this;
                                    if (groupIndex < 0) {
                                        that._isExpandAll = true;
                                        that._expandedItems = [];
                                        that.updateItems()
                                    }
                                    else
                                        that.callBase.apply(that, arguments)
                                },
                                collapseAll: function(groupIndex) {
                                    var that = this;
                                    if (groupIndex < 0) {
                                        that._isExpandAll = false;
                                        that._expandedItems = [];
                                        that.updateItems()
                                    }
                                    else
                                        that.callBase.apply(that, arguments)
                                },
                                isRowExpanded: function(key) {
                                    var that = this,
                                        expandIndex = dataGrid.getIndexByKey(key, that._expandedItems);
                                    if (utils.isArray(key))
                                        return that.callBase.apply(that, arguments);
                                    else
                                        return !!(that._isExpandAll ^ (expandIndex >= 0 && that._expandedItems[expandIndex].visible))
                                },
                                changeRowExpand: function(key) {
                                    var that = this,
                                        expandIndex;
                                    if (utils.isArray(key))
                                        return that.callBase.apply(that, arguments);
                                    else {
                                        expandIndex = dataGrid.getIndexByKey(key, that._expandedItems);
                                        if (expandIndex >= 0) {
                                            var visible = that._expandedItems[expandIndex].visible;
                                            that._expandedItems[expandIndex].visible = !visible
                                        }
                                        else
                                            that._expandedItems.push({
                                                key: key,
                                                visible: true
                                            });
                                        var rowIndex = that.getRowIndexByKey(key);
                                        that.updateItems({
                                            changeType: 'update',
                                            rowIndices: [rowIndex, rowIndex + 1]
                                        })
                                    }
                                },
                                _processDataItem: function(data, options) {
                                    var that = this,
                                        dataItem = that.callBase.apply(that, arguments);
                                    dataItem.isExpanded = that.isRowExpanded(dataItem.key);
                                    if (options.detailColumnIndex === undefined) {
                                        options.detailColumnIndex = -1;
                                        $.each(options.visibleColumns, function(index, column) {
                                            if (column.command === 'expand' && !utils.isDefined(column.groupIndex)) {
                                                options.detailColumnIndex = index;
                                                return false
                                            }
                                        })
                                    }
                                    if (options.detailColumnIndex >= 0)
                                        dataItem.values[options.detailColumnIndex] = dataItem.isExpanded;
                                    return dataItem
                                },
                                _processItems: function() {
                                    var that = this,
                                        items = that.callBase.apply(that, arguments),
                                        expandIndex,
                                        result = [];
                                    $.each(items, function(index, item) {
                                        result.push(item);
                                        expandIndex = dataGrid.getIndexByKey(item.key, that._expandedItems);
                                        if (item.rowType === 'data' && (item.isExpanded || expandIndex >= 0))
                                            result.push({
                                                visible: item.isExpanded,
                                                rowType: 'detail',
                                                key: item.key,
                                                data: item.data,
                                                values: []
                                            })
                                    });
                                    return result
                                },
                                optionChanged: function(args) {
                                    var that = this,
                                        value,
                                        previousValue,
                                        isEnabledChanged,
                                        isAutoExpandAllChanged;
                                    if (args.name === 'masterDetail') {
                                        args.name = 'dataSource';
                                        switch (args.fullName) {
                                            case'masterDetail':
                                                value = args.value || {};
                                                previousValue = args.previousValue || {};
                                                isEnabledChanged = value.enabled !== previousValue.enabled;
                                                isAutoExpandAllChanged = value.autoExpandAll !== previousValue.autoExpandAll;
                                                break;
                                            case'masterDetail.enabled':
                                                isEnabledChanged = true;
                                                break;
                                            case'masterDetail.autoExpandAll':
                                                isAutoExpandAllChanged = true;
                                                break
                                        }
                                        if (isEnabledChanged || isAutoExpandAllChanged)
                                            initMasterDetail(that)
                                    }
                                    that.callBase(args)
                                },
                                refresh: function() {
                                    var that = this;
                                    initMasterDetail(that);
                                    return that.callBase.apply(that, arguments)
                                }
                            }
                    }()
                },
                views: {rowsView: function() {
                        return {
                                _getColumnTemplate: function(options) {
                                    var that = this,
                                        column = options.column,
                                        template;
                                    if (column.command === 'detail') {
                                        template = that.option('masterDetail.template') || that._getDefaultTemplate(column);
                                        options.denyRenderToDetachedContainer = true
                                    }
                                    else
                                        template = that.callBase.apply(that, arguments);
                                    return template
                                },
                                _createRow: function(rowOptions) {
                                    var $row = this.callBase(rowOptions);
                                    if (rowOptions && rowOptions.rowType === "detail") {
                                        this.option('showRowLines') && $row.addClass(DATAGRID_ROW_LINES_CLASS);
                                        $row.addClass(DATAGRID_MASTER_DETAIL_ROW_CLASS).toggle(rowOptions.visible)
                                    }
                                    return $row
                                },
                                _renderCells: function(item, options) {
                                    var groupEmptyCellsCount,
                                        $detailCell,
                                        $cells,
                                        emptyCellsCount,
                                        i;
                                    if (item.rowType === 'detail') {
                                        $cells = [];
                                        groupEmptyCellsCount = options.groupColumns.length + options.columnsCountBeforeGroups;
                                        emptyCellsCount = groupEmptyCellsCount + Number(this.option("masterDetail.enabled"));
                                        for (i = 0; i < emptyCellsCount; i++)
                                            $cells.push(this._createCell(null, item, item.rowIndex, options.columns[i]));
                                        $detailCell = this._createCell(null, item, item.rowIndex, {command: 'detail'}, groupEmptyCellsCount);
                                        $detailCell.addClass(DATAGRID_MASTER_DETAIL_CELL_CLASS).attr('colspan', options.columns.length - emptyCellsCount);
                                        $cells.push($detailCell)
                                    }
                                    else
                                        $cells = this.callBase.apply(this, arguments);
                                    return $cells
                                }
                            }
                    }()}
            }
        })
    })(jQuery, DevExpress);
    DevExpress.MOD_WIDGETS_WEB = true
}