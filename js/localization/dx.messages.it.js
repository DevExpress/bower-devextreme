/*!
* DevExtreme (dx.messages.it.js)
* Version: 17.2.16
* Build date: Fri Oct 09 2020
*
* Copyright (c) 2012 - 2020 Developer Express Inc. ALL RIGHTS RESERVED
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
        it: {
            Yes: "Sì",
            No: "No",
            Cancel: "Annulla",
            Clear: "Cancella",
            Done: "Fatto",
            Loading: "Caricamento...",
            Select: "Seleziona...",
            Search: "Cerca",
            Back: "Indietro",
            OK: "OK",
            "dxCollectionWidget-noDataText": "Nessun dato da mostrare",
            "validation-required": "Richiesto",
            "validation-required-formatted": "{0} è richiesto",
            "validation-numeric": "Il valore deve essere numerico",
            "validation-numeric-formatted": "{0} deve essere numerico",
            "validation-range": "Il valore non è compreso nell'intervallo",
            "validation-range-formatted": "{0} non è compreso nell'intervallo",
            "validation-stringLength": "Lunghezza del valore errata",
            "validation-stringLength-formatted": "La lunghezza di {0} è errata",
            "validation-custom": "Il valore non è corretto",
            "validation-custom-formatted": "{0} non è corretto",
            "validation-compare": "I valori non corrispondono",
            "validation-compare-formatted": "{0} non corrisponde",
            "validation-pattern": "Il valore non è corretto",
            "validation-pattern-formatted": "{0} non è corretto",
            "validation-email": "L'Email non è corretta",
            "validation-email-formatted": "{0} non è una email corretta",
            "validation-mask": "Il valore non è corretto",
            "dxLookup-searchPlaceholder": "Lunghezza minima: {0}",
            "dxList-pullingDownText": "Trascina in basso per aggiornare...",
            "dxList-pulledDownText": "Rilascia per aggiornare...",
            "dxList-refreshingText": "Aggiornamento...",
            "dxList-pageLoadingText": "Caricamento...",
            "dxList-nextButtonText": "Carica altri risultati",
            "dxList-selectAll": "Seleziona tutti",
            "dxListEditDecorator-delete": "Elimina",
            "dxListEditDecorator-more": "Ancora",
            "dxScrollView-pullingDownText": "Trascina in basso per aggiornare...",
            "dxScrollView-pulledDownText": "Rilascia per aggiornare...",
            "dxScrollView-refreshingText": "Aggiornamento...",
            "dxScrollView-reachBottomText": "Caricamento...",
            "dxDateBox-simulatedDataPickerTitleTime": "Seleziona orario",
            "dxDateBox-simulatedDataPickerTitleDate": "Seleziona data",
            "dxDateBox-simulatedDataPickerTitleDateTime": "Seleziona data e ora",
            "dxDateBox-validation-datetime": "Il valore deve essere una data o un orario",
            "dxFileUploader-selectFile": "Seleziona file",
            "dxFileUploader-dropFile": "o trascina il file qui",
            "dxFileUploader-bytes": "bytes",
            "dxFileUploader-kb": "kb",
            "dxFileUploader-Mb": "Mb",
            "dxFileUploader-Gb": "Gb",
            "dxFileUploader-upload": "Carica",
            "dxFileUploader-uploaded": "Caricato",
            "dxFileUploader-readyToUpload": "Pronto per caricare",
            "dxFileUploader-uploadFailedMessage": "Caricamento fallito",
            "dxRangeSlider-ariaFrom": "Da",
            "dxRangeSlider-ariaTill": "fino a",
            "dxSwitch-onText": "ON",
            "dxSwitch-offText": "OFF",
            "dxForm-optionalMark": "opzionale",
            "dxForm-requiredMessage": "{0} è richiesto",
            "dxNumberBox-invalidValueMessage": "Il valore deve essere numerico",
            "dxDataGrid-columnChooserTitle": "Selezione colonne",
            "dxDataGrid-columnChooserEmptyText": "Trascina qui una colonna per nasconderla",
            "dxDataGrid-groupContinuesMessage": "Pagina successiva",
            "dxDataGrid-groupContinuedMessage": "Continua da pagina precedente",
            "dxDataGrid-groupHeaderText": "Raggruppa per questa colonna",
            "dxDataGrid-ungroupHeaderText": "Separa",
            "dxDataGrid-ungroupAllText": "Separa tutti",
            "dxDataGrid-editingEditRow": "Modifica",
            "dxDataGrid-editingSaveRowChanges": "Salva",
            "dxDataGrid-editingCancelRowChanges": "Annulla",
            "dxDataGrid-editingDeleteRow": "Elimina",
            "dxDataGrid-editingUndeleteRow": "Ripristina",
            "dxDataGrid-editingConfirmDeleteMessage": "Sei certo di voler eliminare questo record?",
            "dxDataGrid-validationCancelChanges": "Annulla le modifiche",
            "dxDataGrid-groupPanelEmptyText": "Trascina qui l'intestazione di una colonna per raggrupparla",
            "dxDataGrid-noDataText": "Nessun dato",
            "dxDataGrid-searchPanelPlaceholder": "Cerca...",
            "dxDataGrid-filterRowShowAllText": "(Tutti)",
            "dxDataGrid-filterRowResetOperationText": "Annulla",
            "dxDataGrid-filterRowOperationEquals": "Uguale",
            "dxDataGrid-filterRowOperationNotEquals": "Diverso",
            "dxDataGrid-filterRowOperationLess": "Minore di",
            "dxDataGrid-filterRowOperationLessOrEquals": "Minore o uguale a",
            "dxDataGrid-filterRowOperationGreater": "Maggiore di",
            "dxDataGrid-filterRowOperationGreaterOrEquals": "Maggiore o uguale a",
            "dxDataGrid-filterRowOperationStartsWith": "Inizia con",
            "dxDataGrid-filterRowOperationContains": "Contiene",
            "dxDataGrid-filterRowOperationNotContains": "Non contiene",
            "dxDataGrid-filterRowOperationEndsWith": "Termina con",
            "dxDataGrid-filterRowOperationBetween": "Compreso",
            "dxDataGrid-filterRowOperationBetweenStartText": "Inizio",
            "dxDataGrid-filterRowOperationBetweenEndText": "Fine",
            "dxDataGrid-applyFilterText": "Applica filtro",
            "dxDataGrid-trueText": "vero",
            "dxDataGrid-falseText": "falso",
            "dxDataGrid-sortingAscendingText": "Ordinamento ascendente",
            "dxDataGrid-sortingDescendingText": "Ordinamento discendente",
            "dxDataGrid-sortingClearText": "Annulla ordinamento",
            "dxDataGrid-editingSaveAllChanges": "Salva le modifiche",
            "dxDataGrid-editingCancelAllChanges": "Annulla le modifiche",
            "dxDataGrid-editingAddRow": "Aggiungi una riga",
            "dxDataGrid-summaryMin": "Min: {0}",
            "dxDataGrid-summaryMinOtherColumn": "Min di {1} è {0}",
            "dxDataGrid-summaryMax": "Max: {0}",
            "dxDataGrid-summaryMaxOtherColumn": "Max di {1} è {0}",
            "dxDataGrid-summaryAvg": "Media: {0}",
            "dxDataGrid-summaryAvgOtherColumn": "Media di {1} è {0}",
            "dxDataGrid-summarySum": "Somma: {0}",
            "dxDataGrid-summarySumOtherColumn": "Somma di {1} è {0}",
            "dxDataGrid-summaryCount": "Elementi: {0}",
            "dxDataGrid-columnFixingFix": "Blocca",
            "dxDataGrid-columnFixingUnfix": "Sblocca",
            "dxDataGrid-columnFixingLeftPosition": "Alla sinistra",
            "dxDataGrid-columnFixingRightPosition": "Alla destra",
            "dxDataGrid-exportTo": "Esporta",
            "dxDataGrid-exportToExcel": "Esporta in Excel",
            "dxDataGrid-excelFormat": "File Excel",
            "dxDataGrid-selectedRows": "Righe selezionate",
            "dxDataGrid-exportSelectedRows": "Esporta le righe selezionate",
            "dxDataGrid-exportAll": "Esporta tutti i dati",
            "dxDataGrid-headerFilterEmptyValue": "(vuoto)",
            "dxDataGrid-headerFilterOK": "OK",
            "dxDataGrid-headerFilterCancel": "Annulla",
            "dxDataGrid-ariaColumn": "Colonna",
            "dxDataGrid-ariaValue": "Valore",
            "dxDataGrid-ariaFilterCell": "Filtra cella",
            "dxDataGrid-ariaCollapse": "Chiudi",
            "dxDataGrid-ariaExpand": "Espandi",
            "dxDataGrid-ariaDataGrid": "Griglia dati",
            "dxDataGrid-ariaSearchInGrid": "Cerca nella griglia",
            "dxDataGrid-ariaSelectAll": "Seleziona tutti",
            "dxDataGrid-ariaSelectRow": "Seleziona riga",
            "dxTreeList-ariaTreeList": "Albero",
            "dxTreeList-editingAddRowToNode": "Aggiungi",
            "dxPager-infoText": "Pagina {0} di {1} ({2} elementi)",
            "dxPager-pagesCountText": "di",
            "dxPivotGrid-grandTotal": "Totale",
            "dxPivotGrid-total": "{0} Totale",
            "dxPivotGrid-fieldChooserTitle": "Selezione campi",
            "dxPivotGrid-showFieldChooser": "Mostra selezione campi",
            "dxPivotGrid-expandAll": "Espandi tutto",
            "dxPivotGrid-collapseAll": "Comprimi tutto",
            "dxPivotGrid-sortColumnBySummary": 'Ordina "{0}" per questa colonna',
            "dxPivotGrid-sortRowBySummary": 'Ordina "{0}" per questa riga',
            "dxPivotGrid-removeAllSorting": "Rimuovi ordinamenti",
            "dxPivotGrid-dataNotAvailable": "N/A",
            "dxPivotGrid-rowFields": "Campi riga",
            "dxPivotGrid-columnFields": "Campi colonna",
            "dxPivotGrid-dataFields": "Campi dati",
            "dxPivotGrid-filterFields": "Campi filtro",
            "dxPivotGrid-allFields": "Tutti i campi",
            "dxPivotGrid-columnFieldArea": "Trascina qui i campi colonna",
            "dxPivotGrid-dataFieldArea": "Trascina qui i campi dati",
            "dxPivotGrid-rowFieldArea": "Trascina qui i campi riga",
            "dxPivotGrid-filterFieldArea": "Trascina qui i campi filtro",
            "dxScheduler-editorLabelTitle": "Oggetto",
            "dxScheduler-editorLabelStartDate": "Data inizio",
            "dxScheduler-editorLabelEndDate": "Data fine",
            "dxScheduler-editorLabelDescription": "Descrizione",
            "dxScheduler-editorLabelRecurrence": "Ripeti",
            "dxScheduler-openAppointment": "Apri appuntamento",
            "dxScheduler-recurrenceNever": "Mai",
            "dxScheduler-recurrenceDaily": "Giornaliero",
            "dxScheduler-recurrenceWeekly": "Settimanale",
            "dxScheduler-recurrenceMonthly": "Mensile",
            "dxScheduler-recurrenceYearly": "Annuale",
            "dxScheduler-recurrenceEvery": "Ogni",
            "dxScheduler-recurrenceEnd": "Termina ripetizione",
            "dxScheduler-recurrenceAfter": "Dopo",
            "dxScheduler-recurrenceOn": "Di",
            "dxScheduler-recurrenceRepeatDaily": "giorno(i)",
            "dxScheduler-recurrenceRepeatWeekly": "settimana(e)",
            "dxScheduler-recurrenceRepeatMonthly": "mese(i)",
            "dxScheduler-recurrenceRepeatYearly": "anno(i)",
            "dxScheduler-switcherDay": "Giorno",
            "dxScheduler-switcherWeek": "Settimana",
            "dxScheduler-switcherWorkWeek": "Settimana lavorativa",
            "dxScheduler-switcherMonth": "Mese",
            "dxScheduler-switcherAgenda": "Agenda",
            "dxScheduler-switcherTimelineDay": "Cronologia giornaliera",
            "dxScheduler-switcherTimelineWeek": "Cronologia settimanale",
            "dxScheduler-switcherTimelineWorkWeek": "Cronologia settimana lavorativa",
            "dxScheduler-switcherTimelineMonth": "Cronologia mensile",
            "dxScheduler-recurrenceRepeatOnDate": "alla data",
            "dxScheduler-recurrenceRepeatCount": "occorrenza(e)",
            "dxScheduler-allDay": "Tutto il giorno",
            "dxScheduler-confirmRecurrenceEditMessage": "Vuoi modificare solo questo appuntamento o tutte le sue ricorrenze?",
            "dxScheduler-confirmRecurrenceDeleteMessage": "Vuoi eliminare solo questo appuntamento o tutte le sue ricorrenze?",
            "dxScheduler-confirmRecurrenceEditSeries": "Modifica serie",
            "dxScheduler-confirmRecurrenceDeleteSeries": "Elimina serie",
            "dxScheduler-confirmRecurrenceEditOccurrence": "Modifica appuntamento",
            "dxScheduler-confirmRecurrenceDeleteOccurrence": "Elimina appuntamento",
            "dxScheduler-noTimezoneTitle": "Nessun fuso orario",
            "dxScheduler-moreAppointments": "{0} ancora",
            "dxCalendar-todayButtonText": "Oggi",
            "dxCalendar-ariaWidgetName": "Calendario",
            "dxColorView-ariaRed": "Rosso",
            "dxColorView-ariaGreen": "Verde",
            "dxColorView-ariaBlue": "Blu",
            "dxColorView-ariaAlpha": "Trasparenza",
            "dxColorView-ariaHex": "Colore",
            "dxTagBox-selected": "{0} selezionati",
            "dxTagBox-allSelected": "Tutti selezionati ({0})",
            "dxTagBox-moreSelected": "{0} ancora",
            "vizExport-printingButtonText": "Stampa",
            "vizExport-titleMenuText": "Esportazione/Stampa",
            "vizExport-exportButtonText": "{0} file",
            "dxFilterBuilder-and": "E",
            "dxFilterBuilder-or": "O",
            "dxFilterBuilder-notAnd": "E non",
            "dxFilterBuilder-notOr": "O non",
            "dxFilterBuilder-addCondition": "Aggiungi condizione",
            "dxFilterBuilder-addGroup": "Aggiungi gruppo",
            "dxFilterBuilder-enterValueText": "<inserire un valore>",
            "dxFilterBuilder-filterOperationEquals": "Uguale",
            "dxFilterBuilder-filterOperationNotEquals": "Diverso",
            "dxFilterBuilder-filterOperationLess": "Minore di",
            "dxFilterBuilder-filterOperationLessOrEquals": "Minore o uguale a",
            "dxFilterBuilder-filterOperationGreater": "Maggiore di",
            "dxFilterBuilder-filterOperationGreaterOrEquals": "Maggiore o uguale a",
            "dxFilterBuilder-filterOperationStartsWith": "Inizia con",
            "dxFilterBuilder-filterOperationContains": "Contiene",
            "dxFilterBuilder-filterOperationNotContains": "Non contiene",
            "dxFilterBuilder-filterOperationEndsWith": "Termina con",
            "dxFilterBuilder-filterOperationIsBlank": "È vuoto",
            "dxFilterBuilder-filterOperationIsNotBlank": "Non è vuoto"
        }
    })
});
