import { Component, ViewChild, ViewContainerRef } from '@angular/core';
import { SohoModalDialogService, SohoLookupComponent, SohoMessageService } from 'ids-enterprise-ng';
import { QMSService } from '../../services/qms.service';

/**
 * This is an example of a nested dialog component, that can be instantiated
 * numerous times using the SohoModalDialogService.
 */
@Component({
   templateUrl: 'modal.component.html',
   standalone: false
})
export class NestedModalDialogComponent {

   public static s_depth = 1;
   proposed: string;
   isITNOselected: boolean = false;

   /**
    * The 'dialogPlaceholder' is where the reference dialog component will be
    * parented when it is instantiated.
    *
    * This can be the ViewContainerRef of this component, or another component.
    */
   @ViewChild('dialogPlaceholder', { read: ViewContainerRef, static: true })
   placeholder?: ViewContainerRef;
   @ViewChild(SohoLookupComponent, { static: true }) sohoLookup?: SohoLookupComponent;

   //Set Item Number Browse Function
   itemnoitems: any[];
   itemITNO: string;
   itemITDS: string;
   itemFUDS: string;

   itemnoColumns = [
      { id: 'ITNO', field: 'ITNO', name: 'Item Number', resizable: true, width: '40%', sortable: false },
      { id: 'ITDS', field: 'ITDS', name: 'Name', resizable: true, width: '25%', sortable: false },
      { id: 'FUDS', field: 'FUDS', name: 'Description', resizable: true, width: '35%', sortable: false }
   ]

   //Set Lot Number Browse Function
   lotnoitems: any[];
   lotnITNO: string;
   lotnBANO: string;

   lotnoColumns = [
      { id: 'ITNO', field: 'ITNO', name: 'Item Number', resizable: true, width: '35%', sortable: false },
      { id: 'BANO', field: 'BANO', name: 'Lot Number', resizable: true, width: '65%', sortable: false }
   ]

   public modelSelected = {
      NItemno: null,
      Itemno: null,
      Lotno: null,
   }

   //Set Item Number Browse Function
   nitemnoitems: any[];
   nitemITNO: string;
   nitemITDS: string;
   nitemFUDS: string;

   nitemnoColumns = [
      { id: 'ITNO', field: 'ITNO', name: 'Item Number', resizable: true, width: '40%', sortable: false },
      { id: 'ITDS', field: 'ITDS', name: 'Name', resizable: true, width: '25%', sortable: false },
      { id: 'FUDS', field: 'FUDS', name: 'Description', resizable: true, width: '35%', sortable: false }
   ]

   /**
    * Constructor, taking the interface to the Soho Modal Dialog Api.
    */
   constructor(
      private dialog: SohoModalDialogService, private qmsService: QMSService, private modalService: SohoModalDialogService, private messageService: SohoMessageService) {
      this.proposed = this.qmsService.proposedGrade;
      this.qmsService.itemno = "";
      this.qmsService.nitemno = "";
      this.qmsService.lotno = "";
   }

   async ngAfterViewInit() {
      this.itemnoitems = await this.qmsService.ListItems();
      this.nitemnoitems = this.itemnoitems;
   }

   public get depth(): number {
      return NestedModalDialogComponent.s_depth;
   }

   openModel() {
      this.dialog
         .modal(NestedModalDialogComponent, this.placeholder)
         .title(`Modal Dialog no. '${++NestedModalDialogComponent.s_depth}'.`)
         .buttons(
            [{
               text: 'Cancel', click: (_e: any, modal: any) => {
                  modal.close(true);
               }
            },
            {
               text: 'Submit', click: (_e: any, modal: any) => {

                  var itemno = this.modelSelected.Itemno;
                  var nitemno = this.modelSelected.NItemno;
                  this.qmsService.itemno = itemno;
                  this.qmsService.nitemno = nitemno;
                  this.qmsService.lotno = this.modelSelected.Lotno;
                  var isSame = this.qmsService.CheckProductGroup(itemno, nitemno);
                  if (isSame) {
                     //Proceed with reclassification
                  }
                  else this.handleError("Target item belong to different product group.");
                  modal.close(true);
               }, isDefault: true
            }])
         .afterClose((_f: any) => {
            NestedModalDialogComponent.s_depth--;
         })
         .open();
   }

   //Item Lookup
   async onChangeLookupItem(event: any) {
      this.qmsService.itemno = this.modelSelected.Itemno;
      if (this.modelSelected.Itemno != "" && this.modelSelected.Itemno != null) {
         this.isITNOselected = true;
         console.log("On change " + this.modelSelected.Itemno + ". Enabling...");
         this.lotnoitems = await this.qmsService.ListLotNumber(this.modelSelected.Itemno);
      }
      else {
         this.isITNOselected = false;
      }
      let selectedItem = this.itemnoitems.find(o => o.ITNO === event[0].data.ITNO);
      this.itemITNO = selectedItem.ITNO;
      this.itemITDS = selectedItem.ITDS;
      this.itemFUDS = selectedItem.FUDS;
      this.qmsService.itemno = this.modelSelected.Itemno;
   }

   //Lot Lookup
   async onChangeLookupLot(event: any) {
      this.qmsService.lotno = this.modelSelected.Lotno;
      let selectedLot = this.lotnoitems.find(o => o.BANO === event[0].data.BANO);
      this.lotnITNO = selectedLot.ITNO;
      this.lotnBANO = selectedLot.BANO;
   }

   //New Item Lookup
   async onChangeLookupNItem(event: any) {
      this.qmsService.nitemno = this.modelSelected.NItemno;
      let selectedNItem = this.nitemnoitems.find(o => o.ITNO === event[0].data.ITNO);
      this.nitemITNO = selectedNItem.ITNO;
      this.nitemITDS = selectedNItem.ITDS;
      this.nitemFUDS = selectedNItem.FUDS;
   }

   private handleError(message: string, error?: any) {
      const buttons = [{ text: 'Ok', click: (e, modal) => { modal.close(); } }];
      const errorMessage = error ? error.errorMessage : '';
      this.messageService.error()
         .title('An error occured')
         .message(message + ' ' + errorMessage)
         .buttons(buttons)
         .open();
   }
}
