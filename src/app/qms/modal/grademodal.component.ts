import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { SohoModalDialogService, SohoLookupComponent } from 'ids-enterprise-ng';
import { QMSService } from '../../services/qms.service';

@Component({
   templateUrl: 'grademodal.component.html',
   standalone: false
})
export class GradeModalDialogComponent {

   public static s_depth = 1;
   proposed: string;
   proposedMsg: string;

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
   }


   public get depth(): number {
      return GradeModalDialogComponent.s_depth;
   }

   openModel() {
      this.dialog
         .modal(GradeModalDialogComponent, this.placeholder)
         .title(`Modal Dialog no. '${++GradeModalDialogComponent.s_depth}'.`)
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
            GradeModalDialogComponent.s_depth--;
         })
         .open();
   }

}
