/*!
* DevExtreme (dx.messages.hu.js)
* Version: 19.1.16
* Build date: Tue Oct 18 2022
*
* Copyright (c) 2012 - 2022 Developer Express Inc. ALL RIGHTS RESERVED
* Read about DevExtreme licensing here: https://js.devexpress.com/Licensing/
*/
"use strict";

! function(root, factory) {
    if ("function" === typeof define && define.amd) {
        define(function(require) {
            factory(require("devextreme/localization"))
        })
    } else {
        if ("object" === typeof module && module.exports) {
            factory(require("devextreme/localization"))
        } else {
            factory(DevExpress.localization)
        }
    }
}(this, function(localization) {
    localization.loadMessages({
        hu: {
            Yes: "Igen",
            No: "Nem",
            Cancel: "M\xe9gse",
            Clear: "T\xf6rl\xe9s",
            Done: "K\xe9sz",
            Loading: "Bet\xf6lt\xe9s...",
            Select: "V\xe1laszt\xe1s...",
            Search: "Keres\xe9s",
            Back: "Vissza",
            OK: "OK",
            "dxCollectionWidget-noDataText": "Nincs megjelen\xedthet\u0151 adat",
            "dxDropDownEditor-selectLabel": "V\xe1laszt\xe1s",
            "validation-required": "K\xf6telez\u0151",
            "validation-required-formatted": "{0} k\xf6telez\u0151",
            "validation-numeric": "Az \xe9rt\xe9k sz\xe1m kell legyen",
            "validation-numeric-formatted": "{0} sz\xe1m kell legyen",
            "validation-range": "Az \xe9rt\xe9k tartom\xe1nyon k\xedv\xfclre esik",
            "validation-range-formatted": "{0} tartom\xe1nyon k\xedv\xfclre esik",
            "validation-stringLength": "Az \xe9rt\xe9k hossza helytelen",
            "validation-stringLength-formatted": "{0} hossza helytelen",
            "validation-custom": "\xc9rv\xe9nytelen \xe9rt\xe9k",
            "validation-custom-formatted": "{0} \xe9rv\xe9nytelen",
            "validation-compare": "Az \xe9rt\xe9kek nem egyeznek",
            "validation-compare-formatted": "{0} nem egyezik",
            "validation-pattern": "Az \xe9rt\xe9k nem illeszthet\u0151 a mint\xe1ra",
            "validation-pattern-formatted": "{0} nem illeszthet\u0151 a mint\xe1ra",
            "validation-email": "\xc9rv\xe9nytelen email",
            "validation-email-formatted": "{0} \xe9rv\xe9nytelen email",
            "validation-mask": "\xc9rv\xe9nytelen \xe9rt\xe9k",
            "dxLookup-searchPlaceholder": "Minimum karaktersz\xe1m: {0}",
            "dxList-pullingDownText": "H\xfazza le a friss\xedt\xe9shez...",
            "dxList-pulledDownText": "Engedje el a friss\xedt\xe9shez...",
            "dxList-refreshingText": "Friss\xedt\xe9s...",
            "dxList-pageLoadingText": "Bet\xf6lt\xe9s...",
            "dxList-nextButtonText": "Tov\xe1bb",
            "dxList-selectAll": "\xd6sszes kiv\xe1laszt\xe1sa",
            "dxListEditDecorator-delete": "T\xf6rl\xe9s",
            "dxListEditDecorator-more": "T\xf6bb",
            "dxScrollView-pullingDownText": "H\xfazza le a friss\xedt\xe9shez...",
            "dxScrollView-pulledDownText": "Engedje el a friss\xedt\xe9shez...",
            "dxScrollView-refreshingText": "Friss\xedt\xe9s...",
            "dxScrollView-reachBottomText": "Bet\xf6lt\xe9s...",
            "dxDateBox-simulatedDataPickerTitleTime": "V\xe1lasszon id\u0151t",
            "dxDateBox-simulatedDataPickerTitleDate": "V\xe1lasszon d\xe1tumot",
            "dxDateBox-simulatedDataPickerTitleDateTime": "V\xe1lasszon d\xe1tumot \xe9s id\u0151t",
            "dxDateBox-validation-datetime": "Az \xe9rt\xe9k d\xe1tum vagy id\u0151 kell legyen",
            "dxFileUploader-selectFile": "V\xe1lasszon f\xe1jlt",
            "dxFileUploader-dropFile": "vagy h\xfazza a f\xe1jlt ide",
            "dxFileUploader-bytes": "b\xe1jt",
            "dxFileUploader-kb": "kb",
            "dxFileUploader-Mb": "Mb",
            "dxFileUploader-Gb": "Gb",
            "dxFileUploader-upload": "Felt\xf6lt\xe9s",
            "dxFileUploader-uploaded": "Felt\xf6ltve",
            "dxFileUploader-readyToUpload": "Felt\xf6lt\xe9sre k\xe9sz",
            "dxFileUploader-uploadFailedMessage": "A felt\xf6lt\xe9s sikertelen",
            "dxFileUploader-invalidFileExtension": "Nem enged\xe9lyezett f\xe1jlt\xedpus",
            "dxFileUploader-invalidMaxFileSize": "T\xfal nagy f\xe1jl",
            "dxFileUploader-invalidMinFileSize": "T\xfal kicsi f\xe1jl",
            "dxRangeSlider-ariaFrom": "-t\xf3l",
            "dxRangeSlider-ariaTill": "-ig",
            "dxSwitch-switchedOnText": "BE",
            "dxSwitch-switchedOffText": "KI",
            "dxForm-optionalMark": "v\xe1laszthat\xf3",
            "dxForm-requiredMessage": "{0} k\xf6telez\u0151",
            "dxNumberBox-invalidValueMessage": "Az \xe9rt\xe9k sz\xe1m kell legyen",
            "dxNumberBox-noDataText": "Nincs adat",
            "dxDataGrid-columnChooserTitle": "Oszlopv\xe1laszt\xf3",
            "dxDataGrid-columnChooserEmptyText": "H\xfazza ide az oszlopot az elrejt\xe9shez",
            "dxDataGrid-groupContinuesMessage": "A k\xf6vetkez\u0151 oldalon folytat\xf3dik",
            "dxDataGrid-groupContinuedMessage": "Folytat\xe1s az el\u0151z\u0151 oldalr\xf3l",
            "dxDataGrid-groupHeaderText": "Csoportos\xedt\xe1s ezen oszlop szerint",
            "dxDataGrid-ungroupHeaderText": "Csoportbont\xe1s",
            "dxDataGrid-ungroupAllText": "\xd6sszes csoportbont\xe1sa",
            "dxDataGrid-editingEditRow": "Szerkeszt\xe9s",
            "dxDataGrid-editingSaveRowChanges": "Ment\xe9s",
            "dxDataGrid-editingCancelRowChanges": "M\xe9gse",
            "dxDataGrid-editingDeleteRow": "T\xf6rl\xe9s",
            "dxDataGrid-editingUndeleteRow": "Vissza\xe1ll\xedt\xe1s",
            "dxDataGrid-editingConfirmDeleteMessage": "Biztosan t\xf6rli ezt a rekordot?",
            "dxDataGrid-validationCancelChanges": "M\xf3dos\xedt\xe1sok elvet\xe9se",
            "dxDataGrid-groupPanelEmptyText": "H\xfazzon ide egy oszlopfejl\xe9cet a csoportos\xedt\xe1shoz",
            "dxDataGrid-noDataText": "Nincs adat",
            "dxDataGrid-searchPanelPlaceholder": "Keres\xe9s...",
            "dxDataGrid-filterRowShowAllText": "(Mind)",
            "dxDataGrid-filterRowResetOperationText": "Vissza\xe1ll\xedt\xe1s",
            "dxDataGrid-filterRowOperationEquals": "Egyenl\u0151",
            "dxDataGrid-filterRowOperationNotEquals": "Nem egyenl\u0151",
            "dxDataGrid-filterRowOperationLess": "Kisebb",
            "dxDataGrid-filterRowOperationLessOrEquals": "Kisebb vagy egyenl\u0151",
            "dxDataGrid-filterRowOperationGreater": "Nagyobb",
            "dxDataGrid-filterRowOperationGreaterOrEquals": "Nagyobb vagy egyenl\u0151",
            "dxDataGrid-filterRowOperationStartsWith": "Kezd\u0151dik",
            "dxDataGrid-filterRowOperationContains": "Tartalmazza",
            "dxDataGrid-filterRowOperationNotContains": "Nem tartalmazza",
            "dxDataGrid-filterRowOperationEndsWith": "V\xe9gz\u0151dik",
            "dxDataGrid-filterRowOperationBetween": "K\xf6z\xf6tt",
            "dxDataGrid-filterRowOperationBetweenStartText": "Kezdete",
            "dxDataGrid-filterRowOperationBetweenEndText": "V\xe9ge",
            "dxDataGrid-applyFilterText": "Sz\u0171r\u0151 alkalmaz\xe1sa",
            "dxDataGrid-trueText": "igaz",
            "dxDataGrid-falseText": "hamis",
            "dxDataGrid-sortingAscendingText": "N\xf6vekv\u0151",
            "dxDataGrid-sortingDescendingText": "Cs\xf6kken\u0151",
            "dxDataGrid-sortingClearText": "Rendez\xe9s t\xf6rl\xe9se",
            "dxDataGrid-editingSaveAllChanges": "M\xf3dos\xedt\xe1sok ment\xe9se",
            "dxDataGrid-editingCancelAllChanges": "M\xf3dos\xedt\xe1sok elvet\xe9se",
            "dxDataGrid-editingAddRow": "Sor hozz\xe1ad\xe1sa",
            "dxDataGrid-summaryMin": "Minimum: {0}",
            "dxDataGrid-summaryMinOtherColumn": "{1} minimuma: {0}",
            "dxDataGrid-summaryMax": "Maximum: {0}",
            "dxDataGrid-summaryMaxOtherColumn": "{1} maximuma: {0}",
            "dxDataGrid-summaryAvg": "\xc1tlag: {0}",
            "dxDataGrid-summaryAvgOtherColumn": "{1} \xe1tlaga: {0}",
            "dxDataGrid-summarySum": "\xd6sszeg: {0}",
            "dxDataGrid-summarySumOtherColumn": "{1} \xf6sszege: {0}",
            "dxDataGrid-summaryCount": "Darabsz\xe1m: {0}",
            "dxDataGrid-columnFixingFix": "R\xf6gz\xedt\xe9s",
            "dxDataGrid-columnFixingUnfix": "Felold\xe1s",
            "dxDataGrid-columnFixingLeftPosition": "Balra",
            "dxDataGrid-columnFixingRightPosition": "Jobbra",
            "dxDataGrid-exportTo": "Export\xe1l\xe1s",
            "dxDataGrid-exportToExcel": "Export\xe1l\xe1s Excel f\xe1jlba",
            "dxDataGrid-exporting": "Export\xe1l\xe1s...",
            "dxDataGrid-excelFormat": "Excel f\xe1jl",
            "dxDataGrid-selectedRows": "Kiv\xe1lasztott sorok",
            "dxDataGrid-exportSelectedRows": "Kiv\xe1lasztott sorok export\xe1l\xe1sa",
            "dxDataGrid-exportAll": "Az \xf6sszes adat export\xe1l\xe1sa",
            "dxDataGrid-headerFilterEmptyValue": "(\xdcresek)",
            "dxDataGrid-headerFilterOK": "OK",
            "dxDataGrid-headerFilterCancel": "M\xe9gse",
            "dxDataGrid-ariaColumn": "Oszlop",
            "dxDataGrid-ariaValue": "\xc9rt\xe9k",
            "dxDataGrid-ariaFilterCell": "Sz\u0171r\u0151 cella",
            "dxDataGrid-ariaCollapse": "\xd6sszecsuk\xe1s",
            "dxDataGrid-ariaExpand": "Kibont\xe1s",
            "dxDataGrid-ariaDataGrid": "Adatr\xe1cs",
            "dxDataGrid-ariaSearchInGrid": "Keres\xe9s az adatr\xe1csban",
            "dxDataGrid-ariaSelectAll": "\xd6sszes kiv\xe1laszt\xe1sa",
            "dxDataGrid-ariaSelectRow": "Sor kiv\xe1laszt\xe1sa",
            "dxDataGrid-filterBuilderPopupTitle": "Sz\u0171r\u0151k\xe9sz\xedt\u0151",
            "dxDataGrid-filterPanelCreateFilter": "Sz\u0171r\u0151 l\xe9trehoz\xe1sa",
            "dxDataGrid-filterPanelClearFilter": "T\xf6rl\xe9s",
            "dxDataGrid-filterPanelFilterEnabledHint": "Sz\u0171r\u0151 enged\xe9lyez\xe9se",
            "dxTreeList-ariaTreeList": "Fa lista",
            "dxTreeList-editingAddRowToNode": "Hozz\xe1ad\xe1s",
            "dxPager-infoText": "Oldal: {0}/{1} ({2} elem)",
            "dxPager-pagesCountText": "/",
            "dxPivotGrid-grandTotal": "Teljes \xf6sszeg",
            "dxPivotGrid-total": "{0} \xd6sszeg",
            "dxPivotGrid-fieldChooserTitle": "Mez\u0151v\xe1laszt\xf3",
            "dxPivotGrid-showFieldChooser": "Mez\u0151v\xe1laszt\xf3 megjelen\xedt\xe9se",
            "dxPivotGrid-expandAll": "\xd6sszes kibont\xe1sa",
            "dxPivotGrid-collapseAll": "\xd6sszes \xf6sszecsuk\xe1sa",
            "dxPivotGrid-sortColumnBySummary": 'Rendez\xe9s "{0}" ezen oszlop alapj\xe1n',
            "dxPivotGrid-sortRowBySummary": 'Rendez\xe9s "{0}" ezen sor alapj\xe1n',
            "dxPivotGrid-removeAllSorting": "\xd6sszes rendez\xe9s t\xf6rl\xe9se",
            "dxPivotGrid-dataNotAvailable": "N/A",
            "dxPivotGrid-rowFields": "Sormez\u0151",
            "dxPivotGrid-columnFields": "Oszlopmez\u0151",
            "dxPivotGrid-dataFields": "Adatmez\u0151",
            "dxPivotGrid-filterFields": "Sz\u0171r\u0151mez\u0151",
            "dxPivotGrid-allFields": "\xd6sszes mez\u0151",
            "dxPivotGrid-columnFieldArea": "H\xfazza az oszlopmez\u0151ket ide",
            "dxPivotGrid-dataFieldArea": "H\xfazza az adatmez\u0151ket ide",
            "dxPivotGrid-rowFieldArea": "H\xfazza a sormez\u0151ket ide",
            "dxPivotGrid-filterFieldArea": "H\xfazza a sz\u0171r\u0151mez\u0151ket ide",
            "dxScheduler-editorLabelTitle": "T\xe1rgy",
            "dxScheduler-editorLabelStartDate": "Kezd\xe9s d\xe1tuma",
            "dxScheduler-editorLabelEndDate": "Befejez\xe9s d\xe1tuma",
            "dxScheduler-editorLabelDescription": "Le\xedr\xe1s",
            "dxScheduler-editorLabelRecurrence": "Ism\xe9tl\u0151d\xe9s",
            "dxScheduler-openAppointment": "Tal\xe1lkoz\xf3 megnyit\xe1sa",
            "dxScheduler-recurrenceNever": "Soha",
            "dxScheduler-recurrenceDaily": "Naponta",
            "dxScheduler-recurrenceWeekly": "Hetente",
            "dxScheduler-recurrenceMonthly": "Havonta",
            "dxScheduler-recurrenceYearly": "\xc9vente",
            "dxScheduler-recurrenceRepeatEvery": "Ism\xe9tl\u0151d\xe9s minden",
            "dxScheduler-recurrenceRepeatOn": "Ism\xe9tl\u0151d\xe9s",
            "dxScheduler-recurrenceEnd": "Ism\xe9tl\u0151d\xe9s v\xe9ge",
            "dxScheduler-recurrenceAfter": "Ut\xe1n",
            "dxScheduler-recurrenceOn": "Ekkor",
            "dxScheduler-recurrenceRepeatDaily": "nap(ok)",
            "dxScheduler-recurrenceRepeatWeekly": "h\xe9t(ek)",
            "dxScheduler-recurrenceRepeatMonthly": "h\xf3nap(ok)",
            "dxScheduler-recurrenceRepeatYearly": "\xe9v(ek)",
            "dxScheduler-switcherDay": "Nap",
            "dxScheduler-switcherWeek": "H\xe9t",
            "dxScheduler-switcherWorkWeek": "Munkah\xe9t",
            "dxScheduler-switcherMonth": "H\xf3nap",
            "dxScheduler-switcherAgenda": "Napt\xe1r",
            "dxScheduler-switcherTimelineDay": "Id\u0151vonal nap",
            "dxScheduler-switcherTimelineWeek": "Id\u0151vonal h\xe9t",
            "dxScheduler-switcherTimelineWorkWeek": "Id\u0151vonal munkah\xe9t",
            "dxScheduler-switcherTimelineMonth": "Id\u0151vonal h\xf3nap",
            "dxScheduler-recurrenceRepeatOnDate": "d\xe1tumon",
            "dxScheduler-recurrenceRepeatCount": "el\u0151fordul\xe1s(ok)",
            "dxScheduler-allDay": "Eg\xe9sz nap",
            "dxScheduler-confirmRecurrenceEditMessage": "Csak ezt az alkalmat szeretn\xe9 szerkeszteni, vagy az \xf6sszes ism\xe9tl\u0151d\xe9st?",
            "dxScheduler-confirmRecurrenceDeleteMessage": "Csak ezt az alkalmat szeretn\xe9 t\xf6r\xf6lni, vagy az \xf6sszes ism\xe9tl\u0151d\xe9st?",
            "dxScheduler-confirmRecurrenceEditSeries": "Ism\xe9tl\u0151d\xe9s szerkeszt\xe9se",
            "dxScheduler-confirmRecurrenceDeleteSeries": "Ism\xe9tl\u0151d\xe9s t\xf6rl\xe9se",
            "dxScheduler-confirmRecurrenceEditOccurrence": "Alkalom szerkeszt\xe9se",
            "dxScheduler-confirmRecurrenceDeleteOccurrence": "Alkalom t\xf6rl\xe9se",
            "dxScheduler-noTimezoneTitle": "Nincs id\u0151z\xf3na",
            "dxScheduler-moreAppointments": "{0} t\xf6bb",
            "dxCalendar-todayButtonText": "Ma",
            "dxCalendar-ariaWidgetName": "Napt\xe1r",
            "dxColorView-ariaRed": "Piros",
            "dxColorView-ariaGreen": "Z\xf6ld",
            "dxColorView-ariaBlue": "K\xe9k",
            "dxColorView-ariaAlpha": "\xc1tl\xe1tsz\xf3s\xe1g",
            "dxColorView-ariaHex": "Sz\xednk\xf3d",
            "dxTagBox-selected": "{0} kiv\xe1lasztva",
            "dxTagBox-allSelected": "\xd6sszes kiv\xe1lasztva ({0})",
            "dxTagBox-moreSelected": "{0} t\xf6bb",
            "vizExport-printingButtonText": "Nyomtat\xe1s",
            "vizExport-titleMenuText": "Export\xe1l\xe1s/Nyomtat\xe1s",
            "vizExport-exportButtonText": "{0} f\xe1jl",
            "dxFilterBuilder-and": "\xc9s",
            "dxFilterBuilder-or": "Vagy",
            "dxFilterBuilder-notAnd": "Nem \xc9s",
            "dxFilterBuilder-notOr": "Nem Vagy",
            "dxFilterBuilder-addCondition": "Felt\xe9tel hozz\xe1ad\xe1sa",
            "dxFilterBuilder-addGroup": "Csoport hozz\xe1ad\xe1sa",
            "dxFilterBuilder-enterValueText": "<\xedrjon be egy \xe9rt\xe9ket>",
            "dxFilterBuilder-filterOperationEquals": "Egyenl\u0151",
            "dxFilterBuilder-filterOperationNotEquals": "Nem egyenl\u0151",
            "dxFilterBuilder-filterOperationLess": "Kisebb",
            "dxFilterBuilder-filterOperationLessOrEquals": "Kisebb vagy egyenl\u0151",
            "dxFilterBuilder-filterOperationGreater": "Nagyobb",
            "dxFilterBuilder-filterOperationGreaterOrEquals": "Nagyobb vagy egyenl\u0151",
            "dxFilterBuilder-filterOperationStartsWith": "Kezd\u0151dik",
            "dxFilterBuilder-filterOperationContains": "Tartalmazza",
            "dxFilterBuilder-filterOperationNotContains": "Nem tartalmazza",
            "dxFilterBuilder-filterOperationEndsWith": "V\xe9gz\u0151dik",
            "dxFilterBuilder-filterOperationIsBlank": "\xdcres",
            "dxFilterBuilder-filterOperationIsNotBlank": "Nem \xfcres",
            "dxFilterBuilder-filterOperationBetween": "K\xf6z\xf6tt",
            "dxFilterBuilder-filterOperationAnyOf": "Valamelyik",
            "dxFilterBuilder-filterOperationNoneOf": "Egyik sem",
            "dxHtmlEditor-dialogColorCaption": "Bet\u0171sz\xedn v\xe1laszt\xe1s",
            "dxHtmlEditor-dialogBackgroundCaption": "H\xe1tt\xe9rsz\xedn v\xe1laszt\xe1s",
            "dxHtmlEditor-dialogLinkCaption": "Link hozz\xe1ad\xe1sa",
            "dxHtmlEditor-dialogLinkUrlField": "URL",
            "dxHtmlEditor-dialogLinkTextField": "Sz\xf6veg",
            "dxHtmlEditor-dialogLinkTargetField": "Link megnyit\xe1sa \xfaj ablakban",
            "dxHtmlEditor-dialogImageCaption": "K\xe9p hozz\xe1ad\xe1sa",
            "dxHtmlEditor-dialogImageUrlField": "URL",
            "dxHtmlEditor-dialogImageAltField": "Alternat\xedv sz\xf6veg",
            "dxHtmlEditor-dialogImageWidthField": "Sz\xe9less\xe9g (px)",
            "dxHtmlEditor-dialogImageHeightField": "Magass\xe1g (px)",
            "dxHtmlEditor-heading": "Fejl\xe9c",
            "dxHtmlEditor-normalText": "Norm\xe1l sz\xf6veg",
            "dxFileManager-newFolderName": "N\xe9vtelen k\xf6nyvt\xe1r",
            "dxFileManager-errorNoAccess": "Hozz\xe1f\xe9r\xe9s megtagadva. A m\u0171veletet nem lehet befejezni.",
            "dxFileManager-errorDirectoryExistsFormat": "'{0}' nev\u0171 k\xf6nyvt\xe1r m\xe1r l\xe9tezik.",
            "dxFileManager-errorFileExistsFormat": "'{0}' nev\u0171 f\xe1jl m\xe1r l\xe9tezik.",
            "dxFileManager-errorFileNotFoundFormat": "'{0}' nev\u0171 f\xe1jl nem tal\xe1lhat\xf3",
            "dxFileManager-errorDefault": "Ismeretlen hiba."
        }
    })
});
