import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { SohoModalDialogService, SohoLookupComponent } from 'ids-enterprise-ng';
import { QMSService } from '../../services/qms.service';

@Component({
   templateUrl: 'grademodalpallet.component.html',
   standalone: false
})
export class GradeModalPalletDialogComponent {

   public static s_depth = 1;
   proposedPremium: string;
   proposedStandard: string;
   proposedDowngrade: string;
   proposedNoChange: string;

   @ViewChild('dialogPlaceholder', { read: ViewContainerRef, static: true })
   placeholder?: ViewContainerRef;
   @ViewChild(SohoLookupComponent, { static: true }) sohoLookup?: SohoLookupComponent;


   /**
    * Constructor, taking the interface to the Soho Modal Dialog Api.
    */
   constructor(
      private dialog: SohoModalDialogService, private qmsService: QMSService, private modalService: SohoModalDialogService) {
      this.proposedPremium = this.qmsService.proposedP;
      this.proposedStandard = this.qmsService.proposedS;
      this.proposedDowngrade = this.qmsService.proposedD;
      this.proposedNoChange = this.qmsService.proposedN;
   }


   public get depth(): number {
      return GradeModalPalletDialogComponent.s_depth;
   }

   openModel() {
      this.dialog
         .modal(GradeModalPalletDialogComponent, this.placeholder)
         .title(`Modal Dialog no. '${++GradeModalPalletDialogComponent.s_depth}'.`)
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
            GradeModalPalletDialogComponent.s_depth--;
         })
         .open();
   }

}
