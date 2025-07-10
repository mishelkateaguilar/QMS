import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { SohoModalDialogService, SohoLookupComponent, SohoDataGridComponent } from 'ids-enterprise-ng';
import { QMSService } from '../../services/qms.service';

@Component({
   templateUrl: 'gradereport.component.html',
   standalone: false
})
export class GradeReportDialogComponent {

   public static s_depth = 1;
   proposed: string;
   proposedMsg: string;
   gradeOptions: SohoDataGridOptions;
   allProposals: any[] = [];

   @ViewChild('gradeGrid') gradeGrid: SohoDataGridComponent;
   @ViewChild('dialogPlaceholder', { read: ViewContainerRef, static: true })
   placeholder?: ViewContainerRef;
   @ViewChild(SohoLookupComponent, { static: true }) sohoLookup?: SohoLookupComponent;


   /**
    * Constructor, taking the interface to the Soho Modal Dialog Api.
    */
   constructor(
      private dialog: SohoModalDialogService, private qmsService: QMSService, private modalService: SohoModalDialogService) {
      this.proposed = this.qmsService.proposedGrade;
      this.proposedMsg = this.qmsService.proposedMsg;
      this.allProposals = this.qmsService.proposals;
      this.initGrid();
   }


   public get depth(): number {
      return GradeReportDialogComponent.s_depth;
   }

   openModel() {
      this.dialog
         .modal(GradeReportDialogComponent, this.placeholder)
         .title(`Modal Dialog no. '${++GradeReportDialogComponent.s_depth}'.`)
         .buttons(
            [{
               text: 'Cancel', click: (_e: any, modal: any) => {
                  modal.close(true);
               }
            },
            {
               text: 'OK', click: (_e: any, modal: any) => {
                  modal.close(true);
               }, isDefault: true
            }])
         .afterClose((_f: any) => {
            GradeReportDialogComponent.s_depth--;
         })
         .open();
   }

   private initGrid() {
      this.gradeOptions = {
         selectable: 'multiple' as SohoDataGridSelectable,
         clickToSelect: true,
         alternateRowShading: false,
         cellNavigation: false,
         filterable: true,
         paging: true,
         pagesize: 10,
         rowHeight: 'extra-small',
         columns: [
            { id: 'selectionCheckbox', sortable: false, resizable: false, width: '1', formatter: Soho.Formatters.SelectionCheckbox, align: 'center' },
            { field: 'PALL', id: 'PALL', name: 'Pallet', filterType: 'text', sortable: true, resizable: true, width: '2' },
            { field: 'PROP', id: 'PROP', name: 'Proposed Item Grade', filterType: 'text', sortable: true, resizable: true, width: '3' },
            { field: 'ITNO', id: 'ITNO', name: 'New Item Number', filterType: 'text', sortable: true, resizable: true, width: '5' },
         ],
         dataset: this.allProposals,
         emptyMessage: {
            title: 'No Grade Item Change Proposed',
            icon: 'icon-empty-no-data'
         }
      };
   }

}
