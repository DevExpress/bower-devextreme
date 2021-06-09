/*!
* DevExtreme (dx.messages.vi.js)
* Version: 19.1.13 (build 21160-0311)
* Build date: Wed Jun 09 2021
*
* Copyright (c) 2012 - 2021 Developer Express Inc. ALL RIGHTS RESERVED
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
        vi: {
            Yes: "C\xf3",
            No: "Kh\xf4ng",
            Cancel: "H\u1ee7y",
            Clear: "L\xe0m s\u1ea1ch",
            Done: "Ho\xe0n t\u1ea5t",
            Loading: "\u0110ang t\u1ea3i...",
            Select: "L\u1ef1a ch\u1ecdn...",
            Search: "T\xecm ki\u1ebfm",
            Back: "Quay l\u1ea1i",
            OK: "OK",
            "dxCollectionWidget-noDataText": "Kh\xf4ng c\xf3 d\u1eef li\u1ec7u \u0111\u1ec3 hi\u1ec3n th\u1ecb",
            "dxDropDownEditor-selectLabel": "L\u1ef1a ch\u1ecdn",
            "validation-required": "B\u1eaft bu\u1ed9c",
            "validation-required-formatted": "{0} l\xe0 b\u1eaft bu\u1ed9c",
            "validation-numeric": "Gi\xe1 tr\u1ecb ph\u1ea3i l\xe0 m\u1ed9t s\u1ed1",
            "validation-numeric-formatted": "{0} ph\u1ea3i l\xe0 m\u1ed9t s\u1ed1",
            "validation-range": "Gi\xe1 tr\u1ecb ngo\xe0i kho\u1ea3ng",
            "validation-range-formatted": "{0} ngo\xe0i kho\u1ea3ng",
            "validation-stringLength": "\u0110\u1ed9 d\xe0i c\u1ee7a gi\xe1 tr\u1ecb kh\xf4ng \u0111\xfang",
            "validation-stringLength-formatted": "\u0110\u1ed9 d\xe0i c\u1ee7a {0} kh\xf4ng \u0111\xfang",
            "validation-custom": "Gi\xe1 tr\u1ecb kh\xf4ng h\u1ee3p l\u1ec7",
            "validation-custom-formatted": "{0} kh\xf4ng h\u1ee3p l\u1ec7",
            "validation-compare": "C\xe1c gi\xe1 tr\u1ecb kh\xf4ng kh\u1edbp",
            "validation-compare-formatted": "{0} kh\xf4ng kh\u1edbp",
            "validation-pattern": "Gi\xe1 tr\u1ecb kh\xf4ng kh\u1edbp v\u1edbi khu\xf4n m\u1eabu",
            "validation-pattern-formatted": "{0} kh\xf4ng kh\u1edbp v\u1edbi khu\xf4n m\u1eabu",
            "validation-email": "Email kh\xf4ng h\u1ee3p l\u1ec7",
            "validation-email-formatted": "{0} kh\xf4ng h\u1ee3p l\u1ec7",
            "validation-mask": "Gi\xe1 tr\u1ecb kh\xf4ng h\u1ee3p l\u1ec7",
            "dxLookup-searchPlaceholder": "S\u1ed1 k\xfd t\u1ef1 t\u1ed1i thi\u1ec3u: {0}",
            "dxList-pullingDownText": "K\xe9o xu\u1ed1ng \u0111\u1ec3 l\xe0m t\u01b0\u01a1i...",
            "dxList-pulledDownText": "Nh\u1ea3 ra \u0111\u1ec3 l\xe0m t\u01b0\u01a1i...",
            "dxList-refreshingText": "\u0110ang l\xe0m t\u01b0\u01a1i...",
            "dxList-pageLoadingText": "\u0110ang t\u1ea3i...",
            "dxList-nextButtonText": "Th\xeam",
            "dxList-selectAll": "Ch\u1ecdn T\u1ea5t c\u1ea3",
            "dxListEditDecorator-delete": "X\xf3a",
            "dxListEditDecorator-more": "Th\xeam",
            "dxScrollView-pullingDownText": "K\xe9o xu\u1ed1ng \u0111\u1ec3 l\xe0m t\u01b0\u01a1i...",
            "dxScrollView-pulledDownText": "Nh\u1ea3 ra \u0111\u1ec3 l\xe0m t\u01b0\u01a1i...",
            "dxScrollView-refreshingText": "L\xe0m t\u01b0\u01a1i...",
            "dxScrollView-reachBottomText": "\u0110ang t\u1ea3i...",
            "dxDateBox-simulatedDataPickerTitleTime": "L\u1ef1a ch\u1ecdn th\u1eddi gian",
            "dxDateBox-simulatedDataPickerTitleDate": "L\u1ef1a ch\u1ecdn ng\xe0y",
            "dxDateBox-simulatedDataPickerTitleDateTime": "Ch\u1ecdn ng\xe0y v\xe0 gi\u1edd",
            "dxDateBox-validation-datetime": "Gi\xe1 tr\u1ecb ph\u1ea3i l\xe0 ng\xe0y ho\u1eb7c gi\u1edd",
            "dxFileUploader-selectFile": "Ch\u1ecdn t\u1eadp tin",
            "dxFileUploader-dropFile": "ho\u1eb7c Th\u1ea3 t\u1eadp tin v\xe0o \u0111\xe2y",
            "dxFileUploader-bytes": "byte",
            "dxFileUploader-kb": "kb",
            "dxFileUploader-Mb": "Mb",
            "dxFileUploader-Gb": "Gb",
            "dxFileUploader-upload": "Upload",
            "dxFileUploader-uploaded": "\u0110\xe3 upload",
            "dxFileUploader-readyToUpload": "S\u1eb5n s\xe0ng \u0111\u1ec3 upload",
            "dxFileUploader-uploadFailedMessage": "Upload th\u1ea5t b\u1ea1i",
            "dxFileUploader-invalidFileExtension": "Ki\u1ec3u t\u1eadp tin kh\xf4ng cho ph\xe9p",
            "dxFileUploader-invalidMaxFileSize": "T\u1eadp tin qu\xe1 l\u1edbn",
            "dxFileUploader-invalidMinFileSize": "T\u1eadp tin qu\xe1 nh\u1ecf",
            "dxRangeSlider-ariaFrom": "T\u1eeb",
            "dxRangeSlider-ariaTill": "V\u1eabn",
            "dxSwitch-switchedOnText": "ON",
            "dxSwitch-switchedOffText": "OFF",
            "dxForm-optionalMark": "t\xf9y ch\u1ecdn",
            "dxForm-requiredMessage": "{0} l\xe0 b\u1eaft bu\u1ed9c",
            "dxNumberBox-invalidValueMessage": "Gi\xe1 tr\u1ecb ph\u1ea3i l\xe0 m\u1ed9t s\u1ed1",
            "dxNumberBox-noDataText": "Kh\xf4ng c\xf3 d\u1eef li\u1ec7u",
            "dxDataGrid-columnChooserTitle": "Tr\xecnh ch\u1ecdn c\u1ed9t",
            "dxDataGrid-columnChooserEmptyText": "K\xe9o m\u1ed9t c\u1ed9t v\xe0o \u0111\xe2y \u0111\u1ec3 \u1ea9n n\xf3 \u0111i",
            "dxDataGrid-groupContinuesMessage": "Ti\u1ebfp t\u1ee5c \u1edf trang ti\u1ebfp theo",
            "dxDataGrid-groupContinuedMessage": "\u0110\u01b0\u1ee3c ti\u1ebfp t\u1ee5c t\u1eeb trang tr\u01b0\u1edbc",
            "dxDataGrid-groupHeaderText": "Nh\xf3m theo C\u1ed9t n\xe0y",
            "dxDataGrid-ungroupHeaderText": "B\u1ecf Nh\xf3m",
            "dxDataGrid-ungroupAllText": "B\u1ecf Nh\xf3m t\u1ea5t c\u1ea3",
            "dxDataGrid-editingEditRow": "S\u1eeda",
            "dxDataGrid-editingSaveRowChanges": "L\u01b0u",
            "dxDataGrid-editingCancelRowChanges": "H\u1ee7y",
            "dxDataGrid-editingDeleteRow": "X\xf3a",
            "dxDataGrid-editingUndeleteRow": "Kh\xf4ng x\xf3a",
            "dxDataGrid-editingConfirmDeleteMessage": "B\u1ea1n c\xf3 th\u1eadt s\u1ef1 mu\u1ed1n x\xf3a b\u1ea3n ghi n\xe0y kh\xf4ng?",
            "dxDataGrid-validationCancelChanges": "H\u1ee7y b\u1ecf c\xe1c thay \u0111\u1ed5i",
            "dxDataGrid-groupPanelEmptyText": "K\xe9o ti\xeau \u0111\u1ec1 m\u1ed9t c\u1ed9t v\xe0o \u0111\xe2y \u0111\u1ec3 \u0111\u1ec3 nh\xf3m c\u1ed9t \u0111\xf3",
            "dxDataGrid-noDataText": "Kh\xf4ng c\xf3 d\u1eef li\u1ec7u",
            "dxDataGrid-searchPanelPlaceholder": "T\xecm ki\u1ebfm...",
            "dxDataGrid-filterRowShowAllText": "(T\u1ea5t c\u1ea3)",
            "dxDataGrid-filterRowResetOperationText": "L\xe0m l\u1ea1i",
            "dxDataGrid-filterRowOperationEquals": "B\u1eb1ng",
            "dxDataGrid-filterRowOperationNotEquals": "Kh\xf4ng b\u1eb1ng",
            "dxDataGrid-filterRowOperationLess": "Nh\u1ecf h\u01a1n",
            "dxDataGrid-filterRowOperationLessOrEquals": "Nh\u1ecf h\u01a1n ho\u1eb7c b\u1eb1ng",
            "dxDataGrid-filterRowOperationGreater": "L\u1edbn h\u01a1n",
            "dxDataGrid-filterRowOperationGreaterOrEquals": "L\u1edbn h\u01a1n ho\u1eb7c b\u1eb1ng",
            "dxDataGrid-filterRowOperationStartsWith": "B\u1eaft \u0111\u1ea7u b\u1edfi",
            "dxDataGrid-filterRowOperationContains": "Ch\u1ee9a",
            "dxDataGrid-filterRowOperationNotContains": "Kh\xf4ng ch\u1ee9a",
            "dxDataGrid-filterRowOperationEndsWith": "K\u1ebft th\xfac b\u1edfi",
            "dxDataGrid-filterRowOperationBetween": "Gi\u1eefa",
            "dxDataGrid-filterRowOperationBetweenStartText": "B\u1eaft \u0111\u1ea7u",
            "dxDataGrid-filterRowOperationBetweenEndText": "K\u1ebft th\xfac",
            "dxDataGrid-applyFilterText": "\xc1p d\u1ee5ng b\u1ed9 l\u1ecdc",
            "dxDataGrid-trueText": "\u0111\xfang",
            "dxDataGrid-falseText": "sai",
            "dxDataGrid-sortingAscendingText": "S\u1eafp x\u1ebfp T\u0103ng d\u1ea7n",
            "dxDataGrid-sortingDescendingText": "S\u1eafp x\u1ebfp Gi\u1ea3m d\u1ea7n",
            "dxDataGrid-sortingClearText": "Lo\u1ea1i b\u1ecf vi\u1ec7c s\u1eafp x\u1ebfp",
            "dxDataGrid-editingSaveAllChanges": "L\u01b0u l\u1ea1i c\xe1c thay \u0111\u1ed5i",
            "dxDataGrid-editingCancelAllChanges": "Lo\u1ea1i b\u1ecf c\xe1c thay \u0111\u1ed5i",
            "dxDataGrid-editingAddRow": "Th\xeam m\u1ed9t h\xe0ng",
            "dxDataGrid-summaryMin": "Nh\u1ecf nh\u1ea5t: {0}",
            "dxDataGrid-summaryMinOtherColumn": "Nh\u1ecf nh\u1ea5t c\u1ee7a {1} l\xe0 {0}",
            "dxDataGrid-summaryMax": "L\u1edbn nh\u1ea5t: {0}",
            "dxDataGrid-summaryMaxOtherColumn": "L\u1edbn nh\u1ea5t c\u1ee7a {1} l\xe0 {0}",
            "dxDataGrid-summaryAvg": "Trung b\xecnh: {0}",
            "dxDataGrid-summaryAvgOtherColumn": "Trung b\xecnh c\u1ee7a {1} l\xe0 {0}",
            "dxDataGrid-summarySum": "T\u1ed5ng: {0}",
            "dxDataGrid-summarySumOtherColumn": "T\u1ed5ng c\u1ee7a {1} l\xe0 {0}",
            "dxDataGrid-summaryCount": "S\u1ed1 l\u01b0\u1ee3ng: {0}",
            "dxDataGrid-columnFixingFix": "C\u1ed1 \u0111\u1ecbnh",
            "dxDataGrid-columnFixingUnfix": "Kh\xf4ng c\u1ed1 \u0111\u1ecbnh",
            "dxDataGrid-columnFixingLeftPosition": "\u0110\u1ebfn b\xean tr\xe1i",
            "dxDataGrid-columnFixingRightPosition": "\u0110\u1ebfn b\xean ph\u1ea3i",
            "dxDataGrid-exportTo": "Xu\u1ea5t ra",
            "dxDataGrid-exportToExcel": "Xu\u1ea5t ra T\u1eadp tin Excel",
            "dxDataGrid-exporting": "Xu\u1ea5t kh\u1ea9u...",
            "dxDataGrid-excelFormat": "T\u1eadp tin Excel",
            "dxDataGrid-selectedRows": "C\xe1c h\xe0ng \u0111\u01b0\u1ee3c ch\u1ecdn",
            "dxDataGrid-exportSelectedRows": "Xu\u1ea5t ra c\xe1c h\xe0ng \u0111\u01b0\u1ee3c ch\u1ecdn",
            "dxDataGrid-exportAll": "Xu\u1ea5t ra t\u1ea5t c\u1ea3 d\u1eef li\u1ec7u",
            "dxDataGrid-headerFilterEmptyValue": "(Tr\u1ed1ng)",
            "dxDataGrid-headerFilterOK": "OK",
            "dxDataGrid-headerFilterCancel": "H\u1ee7y",
            "dxDataGrid-ariaColumn": "C\u1ed9t",
            "dxDataGrid-ariaValue": "Gi\xe1 tr\u1ecb",
            "dxDataGrid-ariaFilterCell": "L\u1ecdc \xf4",
            "dxDataGrid-ariaCollapse": "Thu l\u1ea1i",
            "dxDataGrid-ariaExpand": "M\u1edf ra",
            "dxDataGrid-ariaDataGrid": "L\u01b0\u1edbi d\u1eef li\u1ec7u",
            "dxDataGrid-ariaSearchInGrid": "T\xecm ki\u1ebfm trong l\u01b0\u1edbi d\u1eef li\u1ec7u",
            "dxDataGrid-ariaSelectAll": "Ch\u1ecdn t\u1ea5t c\u1ea3",
            "dxDataGrid-ariaSelectRow": "Ch\u1ecdn h\xe0ng",
            "dxDataGrid-filterBuilderPopupTitle": "Tr\xecnh d\u1ef1ng B\u1ed9 l\u1ecdc",
            "dxDataGrid-filterPanelCreateFilter": "T\u1ea1o B\u1ed9 l\u1ecdc",
            "dxDataGrid-filterPanelClearFilter": "Lo\u1ea1i b\u1ecf",
            "dxDataGrid-filterPanelFilterEnabledHint": "K\xedch ho\u1ea1t B\u1ed9 l\u1ecdc",
            "dxTreeList-ariaTreeList": "Danh s\xe1ch c\xe2y",
            "dxTreeList-editingAddRowToNode": "Th\xeam",
            "dxPager-infoText": "Trang {0} c\u1ee7a {1} ({2} m\u1ee5c)",
            "dxPager-pagesCountText": "c\u1ee7a",
            "dxPivotGrid-grandTotal": "T\u1ed5ng t\u1ea5t c\u1ea3",
            "dxPivotGrid-total": "{0} T\u1ed5ng",
            "dxPivotGrid-fieldChooserTitle": "Tr\xecnh l\u1ef1a ch\u1ecdn Tr\u01b0\u1eddng",
            "dxPivotGrid-showFieldChooser": "Hi\u1ec3n th\u1ecb Tr\xecnh l\u1ef1a ch\u1ecdn Tr\u01b0\u1eddng",
            "dxPivotGrid-expandAll": "M\u1edf r\u1ed9ng t\u1ea5t c\u1ea3",
            "dxPivotGrid-collapseAll": "Thu l\u1ea1i t\u1ea5t c\u1ea3",
            "dxPivotGrid-sortColumnBySummary": 'S\u1eafp x\u1ebfp "{0}" theo C\u1ed9t n\xe0y',
            "dxPivotGrid-sortRowBySummary": 'S\u1eafp x\u1ebfp "{0}" theo H\xe0ng n\xe0y',
            "dxPivotGrid-removeAllSorting": "Lo\u1ea1i b\u1ecf t\u1ea5t c\u1ea3 vi\u1ec7c s\u1eafp x\u1ebfp",
            "dxPivotGrid-dataNotAvailable": "Kh\xf4ng c\xf3 s\u1eb5n",
            "dxPivotGrid-rowFields": "C\xe1c tr\u01b0\u1eddng c\u1ee7a h\xe0ng",
            "dxPivotGrid-columnFields": "C\xe1c tr\u01b0\u1eddng c\u1ee7a c\u1ed9t",
            "dxPivotGrid-dataFields": "C\xe1c tr\u01b0\u1eddng D\u1eef li\u1ec7u",
            "dxPivotGrid-filterFields": "L\u1ecdc c\xe1c tr\u01b0\u1eddng",
            "dxPivotGrid-allFields": "T\u1ea5t c\u1ea3 c\xe1c tr\u01b0\u1eddng",
            "dxPivotGrid-columnFieldArea": "Th\u1ea3 c\xe1c tr\u01b0\u1eddng c\u1ee7a c\u1ed9t v\xe0o \u0111\xe2y",
            "dxPivotGrid-dataFieldArea": "Th\u1ea3 c\xe1c tr\u01b0\u1eddng d\u1eef li\u1ec7u v\xe0o \u0111\xe2y",
            "dxPivotGrid-rowFieldArea": "Th\u1ea3 c\xe1c tr\u01b0\u1eddng c\u1ee7a h\xe0ng v\xe0o \u0111\xe2y",
            "dxPivotGrid-filterFieldArea": "Th\u1ea3 b\u1ed9 l\u1ecdc c\xe1c tr\u01b0\u1eddng v\xe0o \u0111\xe2y",
            "dxScheduler-editorLabelTitle": "Ch\u1ee7 \u0111\u1ec1",
            "dxScheduler-editorLabelStartDate": "Ng\xe0y b\u1eaft \u0111\u1ea7u",
            "dxScheduler-editorLabelEndDate": "Ng\xe0y k\u1ebft th\xfac",
            "dxScheduler-editorLabelDescription": "M\xf4 t\u1ea3",
            "dxScheduler-editorLabelRecurrence": "L\u1eb7p l\u1ea1i",
            "dxScheduler-openAppointment": "M\u1edf l\u1ecbch h\u1eb9n",
            "dxScheduler-recurrenceNever": "Kh\xf4ng bao gi\u1edd",
            "dxScheduler-recurrenceDaily": "H\xe0ng ng\xe0y",
            "dxScheduler-recurrenceWeekly": "H\xe0ng tu\u1ea7n",
            "dxScheduler-recurrenceMonthly": "H\xe0ng th\xe1ng",
            "dxScheduler-recurrenceYearly": "H\xe0ng n\u0103m",
            "dxScheduler-recurrenceRepeatEvery": "L\u1eb7p l\u1ea1i m\xe3i",
            "dxScheduler-recurrenceRepeatOn": "B\u1eadt ch\u1ebf \u0111\u1ed9 L\u1eb7p l\u1ea1i",
            "dxScheduler-recurrenceEnd": "K\u1ebft th\xfac vi\u1ec7c l\u1eb7p l\u1ea1i",
            "dxScheduler-recurrenceAfter": "Sau",
            "dxScheduler-recurrenceOn": "V\xe0o",
            "dxScheduler-recurrenceRepeatDaily": "ng\xe0y",
            "dxScheduler-recurrenceRepeatWeekly": "tu\u1ea7n",
            "dxScheduler-recurrenceRepeatMonthly": "th\xe1ng",
            "dxScheduler-recurrenceRepeatYearly": "n\u0103m",
            "dxScheduler-switcherDay": "Ng\xe0y",
            "dxScheduler-switcherWeek": "Tu\u1ea7n",
            "dxScheduler-switcherWorkWeek": "Tu\u1ea7n L\xe0m vi\u1ec7c",
            "dxScheduler-switcherMonth": "Th\xe1ng",
            "dxScheduler-switcherAgenda": "L\u1ecbch tr\xecnh",
            "dxScheduler-switcherTimelineDay": "D\xf2ng th\u1eddi gian Ng\xe0y",
            "dxScheduler-switcherTimelineWeek": "D\xf2ng th\u1eddi gian Tu\u1ea7n",
            "dxScheduler-switcherTimelineWorkWeek": "D\xf2ng th\u1eddi gian Tu\u1ea7n l\xe0m vi\u1ec7c",
            "dxScheduler-switcherTimelineMonth": "D\xf2ng th\u1eddi gian Th\xe1ng",
            "dxScheduler-recurrenceRepeatOnDate": "v\xe0o ng\xe0y",
            "dxScheduler-recurrenceRepeatCount": "s\u1ed1 l\u1ea7n di\u1ec5n ra",
            "dxScheduler-allDay": "C\u1ea3 ng\xe0y",
            "dxScheduler-confirmRecurrenceEditMessage": "B\u1ea1n c\xf3 mu\u1ed1n s\u1eeda ch\u1ec9 L\u1ecbch h\u1eb9n n\xe0y ho\u1eb7c To\xe0n b\u1ed9 chu\u1ed7i?",
            "dxScheduler-confirmRecurrenceDeleteMessage": "B\u1ea1n c\xf3 mu\u1ed1n x\xf3a ch\u1ec9 L\u1ecbch h\u1eb9n n\xe0y ho\u1eb7c To\xe0n b\u1ed9 chu\u1ed7i?",
            "dxScheduler-confirmRecurrenceEditSeries": "S\u1eeda chu\u1ed7i",
            "dxScheduler-confirmRecurrenceDeleteSeries": "X\xf3a chu\u1ed7i",
            "dxScheduler-confirmRecurrenceEditOccurrence": "S\u1eeda L\u1ecbch h\u1eb9n",
            "dxScheduler-confirmRecurrenceDeleteOccurrence": "X\xf3a L\u1ecbch h\u1eb9n",
            "dxScheduler-noTimezoneTitle": "Kh\xf4ng c\xf3 m\xfai gi\u1edd",
            "dxScheduler-moreAppointments": "{0} th\xeam",
            "dxCalendar-todayButtonText": "H\xf4m nay",
            "dxCalendar-ariaWidgetName": "L\u1ecbch",
            "dxColorView-ariaRed": "\u0110\u1ecf",
            "dxColorView-ariaGreen": "Xanh l\xe1",
            "dxColorView-ariaBlue": "Xanh n\u01b0\u1edbc bi\u1ec3n",
            "dxColorView-ariaAlpha": "Trong su\u1ed1t",
            "dxColorView-ariaHex": "M\xe3 m\xe0u",
            "dxTagBox-selected": "{0} \u0111\xe3 \u0111\u01b0\u1ee3c ch\u1ecdn",
            "dxTagBox-allSelected": "T\u1ea5t c\u1ea3 \u0111\xe3 \u0111\u01b0\u1ee3c ch\u1ecdn ({0})",
            "dxTagBox-moreSelected": "{0} th\xeam",
            "vizExport-printingButtonText": "In",
            "vizExport-titleMenuText": "Xu\u1ea5t ra/In",
            "vizExport-exportButtonText": "{0} t\u1eadp tin",
            "dxFilterBuilder-and": "V\xe0",
            "dxFilterBuilder-or": "Ho\u1eb7c",
            "dxFilterBuilder-notAnd": "Kh\xf4ng V\xe0",
            "dxFilterBuilder-notOr": "Kh\xf4ng ho\u1eb7c",
            "dxFilterBuilder-addCondition": "Th\xeam \u0110i\u1ec1u ki\u1ec7n",
            "dxFilterBuilder-addGroup": "Th\xeam nh\xf3m",
            "dxFilterBuilder-enterValueText": "<nh\u1eadp gi\xe1 tr\u1ecb>",
            "dxFilterBuilder-filterOperationEquals": "B\u1eb1ng",
            "dxFilterBuilder-filterOperationNotEquals": "Kh\xf4ng b\u1eb1ng",
            "dxFilterBuilder-filterOperationLess": "Nh\u1ecf h\u01a1n",
            "dxFilterBuilder-filterOperationLessOrEquals": "Nh\u1ecf h\u01a1n ho\u1eb7c b\u1eb1ng",
            "dxFilterBuilder-filterOperationGreater": "L\xe0 l\u1edbn h\u01a1n",
            "dxFilterBuilder-filterOperationGreaterOrEquals": "L\xe0 l\u1edbn h\u01a1n ho\u1eb7c b\u1eb1ng",
            "dxFilterBuilder-filterOperationStartsWith": "B\u1eaft \u0111\u1ea7u v\u1edbi",
            "dxFilterBuilder-filterOperationContains": "Ch\u1ee9a",
            "dxFilterBuilder-filterOperationNotContains": "Kh\xf4ng ch\u1ee9a",
            "dxFilterBuilder-filterOperationEndsWith": "K\u1ebft th\xfac b\u1edfi",
            "dxFilterBuilder-filterOperationIsBlank": "L\xe0 tr\u1ed1ng",
            "dxFilterBuilder-filterOperationIsNotBlank": "L\xe0 kh\xf4ng tr\u1ed1ng",
            "dxFilterBuilder-filterOperationBetween": "L\xe0 gi\u1eefa",
            "dxFilterBuilder-filterOperationAnyOf": "L\xe0 b\u1ea5t k\u1ef3 c\u1ee7a",
            "dxFilterBuilder-filterOperationNoneOf": "Kh\xf4ng kh\xf4ng c\xf3 c\u1ee7a",
            "dxHtmlEditor-dialogColorCaption": "\u0110\u1ed5i m\xe0u ph\xf4ng ch\u1eef",
            "dxHtmlEditor-dialogBackgroundCaption": "\u0110\u1ed5i m\xe0u n\u1ec1n",
            "dxHtmlEditor-dialogLinkCaption": "Th\xeam Li\xean k\u1ebft",
            "dxHtmlEditor-dialogLinkUrlField": "\u0110\u01b0\u1eddng d\u1eabn",
            "dxHtmlEditor-dialogLinkTextField": "V\u0103n b\u1ea3n",
            "dxHtmlEditor-dialogLinkTargetField": "M\u1edf li\xean k\u1ebft \u1edf c\u1eeda s\u1ed5 m\u1edbi",
            "dxHtmlEditor-dialogImageCaption": "Th\xeam h\xecnh \u1ea3nh",
            "dxHtmlEditor-dialogImageUrlField": "\u0110\u01b0\u1eddng d\u1eabn",
            "dxHtmlEditor-dialogImageAltField": "V\u0103n b\u1ea3n thay th\u1ebf",
            "dxHtmlEditor-dialogImageWidthField": "R\u1ed9ng (px)",
            "dxHtmlEditor-dialogImageHeightField": "Cao (px)",
            "dxHtmlEditor-heading": "Ti\xeau \u0111\u1ec1",
            "dxHtmlEditor-normalText": "Ch\u1eef b\xecnh th\u01b0\u1eddng",
            "dxFileManager-newFolderName": "Th\u01b0 m\u1ee5c kh\xf4ng t\xean",
            "dxFileManager-errorNoAccess": "T\u1eeb ch\u1ed1i truy c\u1eadp. Thao t\xe1c kh\xf4ng th\u1ec3 ho\xe0n t\u1ea5t.",
            "dxFileManager-errorDirectoryExistsFormat": "Th\u01b0 m\u1ee5c '{0}' \u0111\xe3 t\u1ed3n t\u1ea1i.",
            "dxFileManager-errorFileExistsFormat": "T\u1eadp tin '{0}' \u0111\xe3 t\u1ed3n t\u1ea1i.",
            "dxFileManager-errorFileNotFoundFormat": "T\u1eadp tin '{0}' kh\xf4ng t\xecm th\u1ea5y",
            "dxFileManager-errorDefault": "L\u1ed7i kh\xf4ng x\xe1c \u0111\u1ecbnh."
        }
    })
});
