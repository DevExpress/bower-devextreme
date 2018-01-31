/*!
* DevExtreme (dx.all.ja.js)
* Version: 17.1.9 (build 18031)
* Build date: Wed Jan 31 2018
*
* Copyright (c) 2012 - 2018 Developer Express Inc. ALL RIGHTS RESERVED
* Read about DevExtreme licensing here: https://js.devexpress.com/Licensing/
*/
"use strict";

! function(root, factory) {
    if ("function" === typeof define && define.amd) {
        define(function(require) {
            factory(require("devextreme/localization"), require("devextreme/core/errors"))
        })
    } else {
        factory(DevExpress.localization, DevExpress.errors)
    }
}(this, function(localization, errors) {
    errors.log("W0013", "devextreme/dist/js/localization/dx.all.ja.js", "16.2", "Use the 'devextreme/dist/js/localization/dx.messages.ja.js' file instead.");
    localization.loadMessages({
        ja: {
            Yes: "はい",
            No: "いいえ",
            Cancel: "キャンセル",
            Clear: "クリア",
            Done: "完了",
            Loading: "読み込み中…",
            Select: "選択…",
            Search: "検索",
            Back: "戻る",
            OK: "OK",
            "dxCollectionWidget-noDataText": "表示するデータがありません。",
            "validation-required": "必須",
            "validation-required-formatted": "{0} は必須です。",
            "validation-numeric": "数値を指定してください。",
            "validation-numeric-formatted": "{0} は数値でなければいけません。",
            "validation-range": "値が範囲外です",
            "validation-range-formatted": "{0} の長さが正しくありません。",
            "validation-stringLength": "値の長さが正しくありません。",
            "validation-stringLength-formatted": "{0} の長さが正しくありません",
            "validation-custom": "値が無効です。",
            "validation-custom-formatted": "{0} が無効です。",
            "validation-compare": "値が一致しません。",
            "validation-compare-formatted": " {0} が一致しません。",
            "validation-pattern": "値がパターンと一致しません",
            "validation-pattern-formatted": "{0} がパターンと一致しません",
            "validation-email": "電子メール アドレスが無効です。",
            "validation-email-formatted": "{0} が無効です。",
            "validation-mask": "値が無効です。",
            "dxLookup-searchPlaceholder": "最低文字数: {0}",
            "dxList-pullingDownText": "引っ張って更新…",
            "dxList-pulledDownText": "指を離して更新…",
            "dxList-refreshingText": "更新中…",
            "dxList-pageLoadingText": "読み込み中…",
            "dxList-nextButtonText": "もっと表示する",
            "dxList-selectAll": "すべてを選択",
            "dxListEditDecorator-delete": "削除",
            "dxListEditDecorator-more": "もっと",
            "dxScrollView-pullingDownText": "引っ張って更新…",
            "dxScrollView-pulledDownText": "指を離して更新…",
            "dxScrollView-refreshingText": "更新中…",
            "dxScrollView-reachBottomText": "読み込み中",
            "dxDateBox-simulatedDataPickerTitleTime": "時刻を選択してください。",
            "dxDateBox-simulatedDataPickerTitleDate": "日付を選択してください。",
            "dxDateBox-simulatedDataPickerTitleDateTime": "日付と時刻を選択してください。",
            "dxDateBox-validation-datetime": "日付または時刻を指定してください。",
            "dxFileUploader-selectFile": "ファイルを選択",
            "dxFileUploader-dropFile": "またはファイルをこちらにドロップしてください。",
            "dxFileUploader-bytes": "バイト",
            "dxFileUploader-kb": "kb",
            "dxFileUploader-Mb": "Mb",
            "dxFileUploader-Gb": "Gb",
            "dxFileUploader-upload": "アップロード",
            "dxFileUploader-uploaded": "アップロード済み",
            "dxFileUploader-readyToUpload": "アップロードの準備中",
            "dxFileUploader-uploadFailedMessage": "アップロードに失敗しました",
            "dxRangeSlider-ariaFrom": "から",
            "dxRangeSlider-ariaTill": "まで",
            "dxSwitch-onText": "オン",
            "dxSwitch-offText": "オフ",
            "dxForm-optionalMark": "任意",
            "dxForm-requiredMessage": "{0} は必須フィールドです",
            "dxNumberBox-invalidValueMessage": "数値を指定してください。",
            "dxDataGrid-columnChooserTitle": "列の選択",
            "dxDataGrid-columnChooserEmptyText": "隠したい列のヘッダーをここにドラッグしてください。",
            "dxDataGrid-groupContinuesMessage": "次ページに続く",
            "dxDataGrid-groupContinuedMessage": "前ページから続く",
            "dxDataGrid-groupHeaderText": "この列でグループ化",
            "dxDataGrid-ungroupHeaderText": "グループ解除",
            "dxDataGrid-ungroupAllText": "すべてのグループを解除",
            "dxDataGrid-editingEditRow": "編集",
            "dxDataGrid-editingSaveRowChanges": "保存",
            "dxDataGrid-editingCancelRowChanges": "キャンセル",
            "dxDataGrid-editingDeleteRow": "削除",
            "dxDataGrid-editingUndeleteRow": "復元",
            "dxDataGrid-editingConfirmDeleteMessage": "このレコードを削 除してもよろしいですか?",
            "dxDataGrid-validationCancelChanges": "変更をキャンセル",
            "dxDataGrid-groupPanelEmptyText": "グループ化したい列のヘッダーをここにドラッグしてください。",
            "dxDataGrid-noDataText": "データがありません",
            "dxDataGrid-searchPanelPlaceholder": "検索",
            "dxDataGrid-filterRowShowAllText": "(すべて)",
            "dxDataGrid-filterRowResetOperationText": "リセット",
            "dxDataGrid-filterRowOperationEquals": "指定の値に等しい",
            "dxDataGrid-filterRowOperationNotEquals": "指定の値に等しくない",
            "dxDataGrid-filterRowOperationLess": "指定の値より小さい",
            "dxDataGrid-filterRowOperationLessOrEquals": "指定の値以下",
            "dxDataGrid-filterRowOperationGreater": "指定の値より大きい",
            "dxDataGrid-filterRowOperationGreaterOrEquals": "指定の値以上",
            "dxDataGrid-filterRowOperationStartsWith": "指定の値で始まる",
            "dxDataGrid-filterRowOperationContains": "指定の値を含む",
            "dxDataGrid-filterRowOperationNotContains": "指定の値を含まない",
            "dxDataGrid-filterRowOperationEndsWith": "指定の値で終わる",
            "dxDataGrid-filterRowOperationBetween": "～から～の間",
            "dxDataGrid-filterRowOperationBetweenStartText": "開始値",
            "dxDataGrid-filterRowOperationBetweenEndText": "終了値",
            "dxDataGrid-applyFilterText": "フィルターを適用",
            "dxDataGrid-trueText": "true",
            "dxDataGrid-falseText": "false",
            "dxDataGrid-sortingAscendingText": "昇順に並べ替え",
            "dxDataGrid-sortingDescendingText": "降順に並べ替え",
            "dxDataGrid-sortingClearText": "並べ替えをクリア",
            "dxDataGrid-editingSaveAllChanges": "変更を保存",
            "dxDataGrid-editingCancelAllChanges": "変更を破棄",
            "dxDataGrid-editingAddRow": "行を追加",
            "dxDataGrid-summaryMin": "Min: {0}",
            "dxDataGrid-summaryMinOtherColumn": "{1} の最小は {0}",
            "dxDataGrid-summaryMax": "Max: {0}",
            "dxDataGrid-summaryMaxOtherColumn": "{1} の最小は {0}",
            "dxDataGrid-summaryAvg": "Avg: {0}",
            "dxDataGrid-summaryAvgOtherColumn": "{1} の平均は {0}",
            "dxDataGrid-summarySum": "合計: {0}",
            "dxDataGrid-summarySumOtherColumn": "{1} の合計は {0}",
            "dxDataGrid-summaryCount": "総数: {0}",
            "dxDataGrid-columnFixingFix": "固定",
            "dxDataGrid-columnFixingUnfix": "固定の解除",
            "dxDataGrid-columnFixingLeftPosition": "左に固定",
            "dxDataGrid-columnFixingRightPosition": "右に固定",
            "dxDataGrid-exportTo": "エクスポート",
            "dxDataGrid-exportToExcel": "Excel ファイルにエクスポート",
            "dxDataGrid-excelFormat": "Excel ファイル",
            "dxDataGrid-selectedRows": "選択された行",
            "dxDataGrid-exportAll": "すべてのデータをエクスポート",
            "dxDataGrid-exportSelectedRows": "選択された行をエクスポート",
            "dxDataGrid-headerFilterEmptyValue": "(空白)",
            "dxDataGrid-headerFilterOK": "OK",
            "dxDataGrid-headerFilterCancel": "キャンセル",
            "dxDataGrid-ariaColumn": "列",
            "dxDataGrid-ariaValue": "値",
            "dxDataGrid-ariaFilterCell": "フィルター セル",
            "dxDataGrid-ariaCollapse": "折りたたむ",
            "dxDataGrid-ariaExpand": "展開",
            "dxDataGrid-ariaDataGrid": "データ グリッド",
            "dxDataGrid-ariaSearchInGrid": "データ グリッド内で検索",
            "dxDataGrid-ariaSelectAll": "すべてを選択",
            "dxDataGrid-ariaSelectRow": "行の選択",
            "dxTreeList-ariaTreeList": "ツリー リスト",
            "dxTreeList-editingAddRowToNode": "追加",
            "dxPager-infoText": "ページ {0} / {1} ({2} アイテム)",
            "dxPager-pagesCountText": "/",
            "dxPivotGrid-grandTotal": "総計",
            "dxPivotGrid-total": "{0} 合計",
            "dxPivotGrid-fieldChooserTitle": "フィールドの選択",
            "dxPivotGrid-showFieldChooser": "フィールドの選択を表示",
            "dxPivotGrid-expandAll": "すべて展開",
            "dxPivotGrid-collapseAll": "すべて折りたたむ",
            "dxPivotGrid-sortColumnBySummary": 'この列で "{0}" を並べ替え',
            "dxPivotGrid-sortRowBySummary": "この行で {0} を並べ替え",
            "dxPivotGrid-removeAllSorting": "すべての並べ替えを削除",
            "dxPivotGrid-dataNotAvailable": "N/A",
            "dxPivotGrid-rowFields": "行のフィールド",
            "dxPivotGrid-columnFields": "列のフィールド",
            "dxPivotGrid-dataFields": "データ  フィールド",
            "dxPivotGrid-filterFields": "フィルター フィールド",
            "dxPivotGrid-allFields": "すべてのフィールド",
            "dxPivotGrid-columnFieldArea": "列フィールドをこちらへドラッグ＆ドロップ",
            "dxPivotGrid-dataFieldArea": "データ フィールドをこちらへドラッグ＆ドロップ",
            "dxPivotGrid-rowFieldArea": "行フィールドをこちらへドラッグ＆ドロップ",
            "dxPivotGrid-filterFieldArea": "フィルター フィールドをこちらへドラッグ＆ドロップ",
            "dxScheduler-editorLabelTitle": "件名",
            "dxScheduler-editorLabelStartDate": "開始時刻",
            "dxScheduler-editorLabelEndDate": "終了時刻",
            "dxScheduler-editorLabelDescription": "説明",
            "dxScheduler-editorLabelRecurrence": "リピート",
            "dxScheduler-openAppointment": "オープンの予定",
            "dxScheduler-recurrenceNever": "無効",
            "dxScheduler-recurrenceDaily": "日間毎日",
            "dxScheduler-recurrenceWeekly": "毎週",
            "dxScheduler-recurrenceMonthly": "毎月",
            "dxScheduler-recurrenceYearly": "毎年",
            "dxScheduler-recurrenceEvery": "リピートの頻度",
            "dxScheduler-recurrenceEnd": "リピートの終了日",
            "dxScheduler-recurrenceAfter": "次の発生回数後に終了",
            "dxScheduler-recurrenceOn": "リピート解除の日付",
            "dxScheduler-recurrenceRepeatDaily": "日後",
            "dxScheduler-recurrenceRepeatWeekly": "週間後",
            "dxScheduler-recurrenceRepeatMonthly": "カ月後",
            "dxScheduler-recurrenceRepeatYearly": "年後",
            "dxScheduler-switcherDay": "日ビュー",
            "dxScheduler-switcherWeek": "週ビュー",
            "dxScheduler-switcherWorkWeek": "稼働週ビュー",
            "dxScheduler-switcherMonth": "月ビュー",
            "dxScheduler-switcherTimelineDay": "タイムライン 日ビュー",
            "dxScheduler-switcherTimelineWeek": "タイムライン 週ビュー",
            "dxScheduler-switcherTimelineWorkWeek": "タイムライン 稼働週ビュー",
            "dxScheduler-switcherTimelineMonth": "タイムライン 月ビュー",
            "dxScheduler-switcherAgenda": "予定一覧",
            "dxScheduler-recurrenceRepeatOnDate": "次の日付に終了",
            "dxScheduler-recurrenceRepeatCount": "出現",
            "dxScheduler-allDay": "終日イベント",
            "dxScheduler-confirmRecurrenceEditMessage": "この予定のみを編集しますか、または定期的な予定を編集しますか？",
            "dxScheduler-confirmRecurrenceDeleteMessage": "この予定のみを削除しますか、または定期的な予定を削除しますか？",
            "dxScheduler-confirmRecurrenceEditSeries": "定期的なアイテムを編集",
            "dxScheduler-confirmRecurrenceDeleteSeries": "定期的なアイテムを削除",
            "dxScheduler-confirmRecurrenceEditOccurrence": "予定を編集",
            "dxScheduler-confirmRecurrenceDeleteOccurrence": "予定を削除",
            "dxScheduler-noTimezoneTitle": "時間帯なし",
            "dxCalendar-todayButtonText": "今日",
            "dxCalendar-ariaWidgetName": "カレンダー",
            "dxColorView-ariaRed": "赤",
            "dxColorView-ariaGreen": "緑",
            "dxColorView-ariaBlue": "青",
            "dxColorView-ariaAlpha": "透明度",
            "dxColorView-ariaHex": "色コード",
            "vizExport-printingButtonText": "印刷",
            "vizExport-titleMenuText": "エクスポート / 印刷",
            "vizExport-exportButtonText": "{0} ファイル"
        }
    })
});
