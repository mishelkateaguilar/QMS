import { Component, OnInit, QueryList, ViewChild, ViewChildren, HostListener, ViewContainerRef } from '@angular/core';
import { CoreBase, IUserContext } from '@infor-up/m3-odin';
import { MIService, UserService, ApplicationService, FormService } from '@infor-up/m3-odin-angular';
import { SohoMessageService, SohoModalDialogService, SohoBusyIndicatorDirective, SohoDropDownComponent, SohoDataGridComponent, SohoLookupComponent, SohoErrorDirective } from 'ids-enterprise-ng';
import { QMSService } from '../../services/qms.service';
import { CommonService } from '../../services/common.service';
import { DatePipe } from '@angular/common';
import { NestedModalDialogComponent } from '../modal/modal.component';
import { GradeModalDialogComponent } from '../modal/grademodal.component';
import { GradeModalPalletDialogComponent } from '../modal/grademodalpallet.component';
import { GradeReportDialogComponent } from '../modal/gradereport.component';
import { Subject, switchMap } from "rxjs";
import { FormControl, FormGroup } from "@angular/forms";

@Component({
   templateUrl: './main.component.html',
   styleUrls: ['./main.component.css'],
   providers: [DatePipe]
})
export class MainPanelComponent extends CoreBase implements OnInit {
   @ViewChild('qridGrid') qridGrid: SohoDataGridComponent;
   @ViewChild('qiresGrid') qiresGrid: SohoDataGridComponent;
   @ViewChild(SohoBusyIndicatorDirective, { static: true }) busyIndicator?: SohoBusyIndicatorDirective;
   @ViewChild(SohoLookupComponent, { static: true }) sohoLookup?: SohoLookupComponent;
   @ViewChild('dialogPlaceholder', { read: ViewContainerRef, static: true })
   placeholder?: ViewContainerRef;
   @ViewChildren(SohoDropDownComponent) dropDownComponents?: QueryList<SohoDropDownComponent>;
   public closeResult = '(N/A)';
   lookupValue = '';
   userContext: any;
   userContext1 = {} as IUserContext;
   division: string;
   company: string;
   qridOptions: SohoDataGridOptions;
   isBusyQrid: boolean;
   qrid: any = [];
   qridset: any = [];
   isSuperUser: boolean = false;
   itemno: any = [];
   faci: any = [];
   bano: any = [];
   isBusyQiRes: boolean;
   isBusyStatus: boolean;
   isEnter: boolean = false;
   qiresOptions: SohoDataGridOptions;
   qires: any = [];
   qibeforeEdit: any = [];
   textfieldQRID = '';
   textfieldQty = '';
   textfieldfPallet = '';
   textfieldtPallet = '';
   rowData: any;
   rowSelected: boolean;
   fbRow: any;
   selectedRow: any;
   datePipe: DatePipe = new DatePipe('en-US');
   palletwiseFlag: boolean;
   putawayFlag: boolean;
   approvedFlag: boolean = false;
   reportGradeFlag: boolean = false;
   isITNOselected: boolean;
   CONO: string;
   requestSelected: boolean = false;
   testSelected: boolean = false;
   rowQIRes: any;
   dateToday: string;
   usid: string;
   formulaBased = new Map();
   palletCount: any;
   nitemno: any;
   uri: string;
   newVal: any;

   //Dropdown for status
   childrenPreload: Subject<any> = new Subject<any>();
   public form?: FormGroup;
   arr = [];
   public model = { value: '5', label: '5-All' };
   selectedItem: string;
   statusSelected: string;


   //Set Facility Browse Function
   facilityitems: any[];
   faciFACI: string;
   faciFACN: string;
   faciDIVI: string;

   facilityColumns = [
      { id: 'FACI', field: 'FACI', name: 'Facility', resizable: true, width: 'auto', sortable: false },
      { id: 'FACN', field: 'FACN', name: 'Name', resizable: true, width: 'auto', sortable: false },
      { id: 'DIVI', field: 'DIVI', name: 'Division', resizable: true, width: 'auto', sortable: false }
   ]

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
      Facility: null,
      Itemno: null,
      Lotno: null,
   }

   //Grade item proposal arrays for pallet wise testing
   proposePremium: any[] = [];
   proposeStandard: any[] = [];
   proposeStandardC: any[] = [];
   proposeDowngrade: any[] = [];
   noProposal: any[] = [];
   allProposals: any[] = [];

   //Mo Text fields
   moText1: string = "";
   moText2: string = "";

   constructor(private userService: UserService, private messageService: SohoMessageService,
      private modalService: SohoModalDialogService, private qmsService: QMSService, private commonService: CommonService,
      public datepipe: DatePipe, private appService: ApplicationService, private formService: FormService) {
      super('MainPanelComponent');
      var currDate = new Date();
      this.dateToday = this.datePipe.transform(currDate, 'yyyyMMdd');
      this.palletwiseFlag = false;
      this.putawayFlag = false;
      this.qmsService.proposedGrade = "NoChange";
      this.isITNOselected = false;
      this.LoadUserInfo();
      this.initGrid();
      console.log("QMS App running");
   }

   async ngOnInit() {
      //On init, load ALL QI Requests to grid
      console.log("Version Checker 36");
      this.setBusy(true, 'qrid');
      await this.setAllQIRequests();
      this.setBusy(false, 'qrid');

      const group: { [key: string]: any } = [];
      group['statControl'] = new FormControl(this.model.value, null);
      this.form = new FormGroup(group);
   }

   async ngAfterViewInit() {
      //Set Browse Functions
      this.facilityitems = await this.qmsService.ListFacility(this.company);
      this.itemnoitems = await this.qmsService.ListItems();
      //Initialize options for onLoad dropdown
      const dropdown = (this.dropDownComponents as any).toArray()[0];
      this.bindDropdown(this.childrenPreload, dropdown);
   }

   ngOnDestroy() {
      this.userContext.unsubscribe();
   }

   //Get current user info
   LoadUserInfo(): void {
      this.userService.getUserContext().subscribe(async (userContext: IUserContext) => {
         this.userContext = userContext;
         let CONO = userContext.CONO;
         this.company = CONO;
         this.division = userContext.currentDivision;
         this.usid = userContext.USID;
         this.isSuperUser = await this.qmsService.securityCheck(this.usid);
      }, (error) => {
         console.log('Unable to get userContext ' + error);
      });
   }


   /******************************************************PANEL A (TOP) QR Requests *******************************************************/
   //OnClick of search button
   async searchRecords() {
      //Get filter field values
      var filterFACI = this.modelSelected.Facility;
      var filterQRID = this.textfieldQRID;
      var filterITNO = this.modelSelected.Itemno;
      var filterBANO = this.modelSelected.Lotno;
      this.setBusy(true, 'qrid');
      this.qridset = await this.qmsService.ListQIRequest(filterFACI, filterQRID, filterITNO, filterBANO);
      if (this.qridset != "") {
         this.qridGrid ? this.qridGrid.dataset = this.qridset : this.qridOptions.dataset = this.qridset;
      }
      else {
         this.handleError("A record with these values does not exist.");
      }
      this.setBusy(false, 'qrid');
   }

   //Displays the QI requests in datagrid
   async setAllQIRequests() {
      this.qridset = await this.qmsService.ListAllQIRequest();
      this.qridGrid ? this.qridGrid.dataset = this.qridset : this.qridOptions.dataset = this.qridset;
   }

   //Gets QI Result info after datagrid selection
   async onSelected(e: SohoDataGridSelectedEvent) {
      var qsta = "";
      var rorn = "";
      if (e.rows && e.rows.forEach) {
         e.rows.forEach((r) => {
            if (r.data) {
               this.qrid = `${r.data.QRID}`;
               this.itemno = `${r.data.ITNO}`;
               this.faci = `${r.data.FACI}`;
               this.bano = `${r.data.BANO}`;
               qsta = `${r.data.QSTA}`;
               rorn = `${r.data.RORN}`;
            }
         });
      }

      this.isSuperUser = await this.qmsService.securityCheck(this.usid);
      this.palletwiseFlag = false;
      this.putawayFlag = false;
      this.approvedFlag = false;
      this.reportGradeFlag = false;
      this.textfieldfPallet = "";
      this.textfieldtPallet = "";

      var res = await this.qmsService.GetQSTA(this.faci, this.qrid);
      const arr = res.split("_");
      qsta = arr[0];

      if (e.type == "deselect" || e.type == "deselectall") {
         console.log("deselect");
         //Set QR Test Grid to empty
         this.setBusy(true, 'qires');
         this.qiresGrid.dataset = [];
         this.setBusy(false, 'qires');
         this.requestSelected = false;
         this.moText1 = "";
         this.moText2 = "";
      }
      else {
         //Load MO texts
         var res = await this.qmsService.GetMOText(this.faci, this.itemno, rorn);
         for (let obj of res) {
            this.moText1 = obj['TXT1'];
            this.moText2 = obj['TXT2'];
         }
         //Load QR Test Grid
         this.requestSelected = true;
         this.setBusy(true, 'qires');
         this.setBusy(true, 'qrid');
         await this.setQIResult(this.faci, this.qrid, this.itemno, this.bano);
         this.setBusy(false, 'qires');
         this.setBusy(false, 'qrid');
         //If status 3, enable buttons
         if (qsta == "3") {
            this.approvedFlag = true;
         }
         else this.approvedFlag = false

         //Reset Formula-based Map
         this.formulaBased.clear();

         //Set Formula-based Map
         for (let obj of this.qires) {
            if (obj['TCAL'] == 1) {
               console.log("adding formula to array: " + obj['FMID'] + obj['QTST']);
               var formula = obj['FMID'];
               var factors = await this.qmsService.ListFormula(formula);
               this.formulaBased.set((formula + ";" + obj['QTST']), factors);
            }
         }

      }
   }

   /******************************************************* LOOKUPS - Search fields *******************************************************/
   //Facility Lookup
   async onChangeLookupFacility(event: any) {
      console.log('lookup.onchange', event);
      let selectedFaci = this.facilityitems.find(o => o.FACI === event[0].data.FACI);
      this.faciFACI = selectedFaci.FACI;
      this.faciFACN = selectedFaci.FACN;
      this.faciDIVI = selectedFaci.DIVI;
   }

   //Item Lookup
   async onChangeLookupItem(event: any) {
      console.log('lookup.onchange', event);
      if (this.modelSelected.Itemno != "" && this.modelSelected.Itemno != null) {
         this.isITNOselected = true;
         console.log("On change " + this.modelSelected.Itemno + ". Enabling...");
         this.lotnoitems = await this.qmsService.ListLotNumber(this.modelSelected.Itemno);
      }
      else {
         this.isITNOselected = false;
      }
      let selectedItem = this.itemnoitems.find(o => o.FACI === event[0].data.FACI);
      this.itemITNO = selectedItem.ITNO;
      this.itemITDS = selectedItem.ITDS;
      this.itemFUDS = selectedItem.FUDS;
   }

   //Lot Lookup
   async onChangeLookupLot(event: any) {
      console.log('lookup.onchange', event);
      let selectedLot = this.lotnoitems.find(o => o.FACI === event[0].data.FACI);
      this.lotnITNO = selectedLot.ITNO;
      this.lotnBANO = selectedLot.BANO;
   }

   //After Selection
   async onAfterOpen(event: any) {
      console.log('lookup.onafteropen', event);
   }

   /************************************************** QI TEST RESULTS FILTER SECTION *****************************************************/
   //On change of status dropdown value
   async selectStatusDropdown() {
      this.statusSelected = this.form.value.statControl;
      //Filter grid dataset by status
      var tempArr = [];
      if (this.statusSelected == "5") {
         tempArr = this.qires;
      }
      else {
         for (let obj of this.qires) {
            console.log("Comparing " + obj['TSTT'] + " and " + this.statusSelected);
            if (obj['TSTT'] == this.statusSelected) {
               tempArr.push(obj);
            }
         }
      }

      this.setBusy(true, 'qires');
      this.qiresGrid ? this.qiresGrid.dataset = tempArr : this.qiresOptions.dataset = tempArr;
      this.setBusy(false, 'qires');
   }

   //On change of pallet filter fields
   async onblurPallet() {
      var tempArr: any = [];
      var from = this.textfieldfPallet;
      var to = this.textfieldtPallet;
      const fromNum = parseFloat(from);
      const toNum = parseFloat(to);
      if ((isNaN(fromNum) && from != "") || (isNaN(toNum) && to != "")) {
         this.handleError("Entered value is not numeric.");
      }
      else {
         if (from == "" && to == "") {
            this.handleError("Please enter To/From Pallet.");
         }
         if (from != "") {
            if (to == "") {
               this.textfieldtPallet = this.palletCount;
            }
         }
         if (to != "") {
            if (from == "") {
               this.textfieldfPallet = "1";
            }
         }
         if (Number(to) > this.palletCount) {
            this.handleError("To Pallet is greater than total number of pallets.");
            this.textfieldtPallet = this.palletCount;
            this.textfieldfPallet = "1";
         }
         else if (Number(to) < Number(from)) {
            this.handleError("To Pallet should be greater than From Pallet.");
            this.textfieldtPallet = this.palletCount;
            this.textfieldfPallet = "1";
         }
         else {
            if (Number(to) == this.palletCount && Number(from) == 1) {
               tempArr = this.qires;
            }
            else {
               for (let obj of this.qires) {
                  if (obj['TSEQ'] >= Number(from) && obj['TSEQ'] <= Number(to)) {
                     tempArr.push(obj);
                  }
               }
            }
            this.setBusy(true, 'qires');
            this.qiresGrid ? this.qiresGrid.dataset = tempArr : this.qiresOptions.dataset = tempArr;
            this.setBusy(false, 'qires');
         }
      }
   }

   //Bind status values to dropdown
   async bindDropdown(subject: any, _dropdown: any) {
      this.setBusy(true, 'cuno');
      this.arr.push({ value: "0-Not Tested", label: "0-Not Tested" });
      this.arr.push({ value: "1-Passed", label: "1-Passed" });
      this.arr.push({ value: "2-On hold", label: "2-On hold" });
      this.arr.push({ value: "3-Failed", label: "3-Failed" });
      this.arr.push({ value: "4-In Process", label: "4-In Process" });
      this.arr.push({ value: "5", label: "5-All" });
      setTimeout(() => {
         subject.next(this.arr);
      }, 2000);
      await new Promise(f => setTimeout(f, 2000));
      this.setBusy(false, 'cuno');
   }

   /************************************************** PANEL B (BOTTOM) QI Test Results ***************************************************/
   //Displays the items in datagrid
   async setQIResult(faci, qrid, itno, bano) {
      //Check first if Pallet-wise testing is selected for request (check if XtendM3 records exist for selected QRID)
      this.qiresGrid ? this.qiresGrid.dataset = [] : this.qiresOptions.dataset = [];
      //If Pallet-Wise Testing selected, load from XtendM3 table
      this.qires = await this.qmsService.ListXtendTestResults(this.company, faci, qrid, itno, bano);
      if (this.qires.length == 0) {
         this.palletwiseFlag == false;
         //Load from standard
         await this.setOptionsStandard();
         this.qires = await this.qmsService.ListQIResult(faci, qrid, itno, bano);
         //this.qiresGrid ? this.qiresGrid.dataset = this.qires : this.qiresOptions.dataset = this.qires;
      }
      else {
         //Load from XtendM3
         this.palletwiseFlag = true;
         await this.setOptionsPallet();
         this.palletCount = await this.qmsService.GetPallet(faci, bano, itno);
         this.textfieldfPallet = "1";
         this.textfieldtPallet = this.palletCount;
      }
      this.qiresGrid ? this.qiresGrid.dataset = this.qires : this.qiresOptions.dataset = this.qires;
   }

   /**
   * HostListener for key presses, specifically Enter key.
   * @param event The key event.
   */
   /**
    @HostListener('document:keydown.enter', ['$event'])
    onEnterKey(event: KeyboardEvent): void {
       console.log("Test entered QTRS " + this.rowData['QTRS']);
    }
 */

   async onkeyDown(event: SohoDataGridKeyDownEvent): Promise<void> {
      console.log(event);
      if (event.e['key'] == 'Enter') {
         this.isEnter = true;
         this.qibeforeEdit = this.qiresGrid.dataset;
      }
   }

   async onEnterEdit(event: SohoDataGridKeyDownEvent): Promise<void> {
      this.isEnter = false;
   }

   /***************************************************** ON ENTER - QI TEST RESULT GRID ***************************************************/
   async onblur(event: SohoDataGridEditModeEvent): Promise<void> {
      console.log(event);
      this.rowQIRes = event.row;
      if (this.isEnter) {
         this.setBusy(true, 'qires');
         var newQTRS = "";
         var newQLCD = "";
         var testRow = event.item;
         var ttdt = "";
         var formulaRes = new Map();
         //Flags
         var secondSeqFlag = false;
         //Event values
         var oldVal = event.oldValue;
         var columnName = event.column['field'];
         var sequence = event.item['TSEQ'];

         //Date validation values
         const inputyyyymmdd = event.item['TTDT'];
         const year = parseInt(inputyyyymmdd.substring(0, 4), 10);
         const month = parseInt(inputyyyymmdd.substring(4, 6), 10) - 1; // Month is 0-indexed
         const day = parseInt(inputyyyymmdd.substring(6, 8), 10);

         const inputDate = new Date(year, month, day);
         const currentDate = new Date();

         // Set time components of currentDate to 0 to compare only dates
         currentDate.setHours(0, 0, 0, 0);

         console.log("Dates " + inputDate + "_" + currentDate);
         //Operator validation
         if (event.item['QOP1'] != "<" && event.item['QOP1'] != ">" && event.item['QOP1'] != "=" && event.item['QOP1'] != "" && (event.item['TSTY'] == "0" || event.item['TSTY'] == "1")) {
            this.handleError("Actual operator entered is invalid. Accepted values are >, <, and = only.");
         }
         //Date validation

         else if (inputDate > currentDate) {
            this.handleError("Future dates are not allowed.");
         }
         else {
            ttdt = event.item['TTDT'];
            //If ttdt is empty, change to date today
            if (ttdt == "" || ttdt == undefined) {
               ttdt = this.dateToday;
            }
            //Check if pallet-wise selected for the test updated
            var countTest = 0;
            for (let obj of this.qires) {
               if (obj['QTST'] == event.item['QTST']) {
                  countTest++;
               }
            }

            if (countTest < 3) {
               if (event.item['TSTY'] == "0" || event.item['TSTY'] == "1") {
                  //Set QTRS value to at least one decimal place and convert ',' to '.'
                  newQTRS = event.item['QTRS'];
                  if (newQTRS.includes(',')) {
                     console.log("QTRS has ,");
                     newQTRS = event.item['QTRS'].replace(',', '.');
                  }
                  else if (newQTRS.includes('.')) {
                     console.log("has decimal");
                     newQTRS = event.item['QTRS'];
                  }
                  else {
                     console.log("has no decimal");
                     newQTRS = event.item['QTRS'] + '.0';
                  }
                  newQLCD = "";
               }
               else {
                  newQLCD = event.item['QLCD'];
                  newQTRS = "";
               }

               var isUpdate = await this.qmsService.UpdTestResult(this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], event.item['TSEQ'], newQTRS, newQLCD, event.item['QOP1'], event.item['SI01'], ttdt);
               if (isUpdate == true) {
                  /************************************************ SEQUENCE 1 UPDATES ****************************************************/
                  //On Pass
                  if (event.item['TSEQ'] == 1) {
                     var tstt = "";
                     //Get TSTT value
                     var TSTT = await this.qmsService.GetTSTT(this.faci, this.qrid, event.item['SPEC'], this.itemno, event.item['QTST']);
                     //Update row TSTT based on returned value
                     if (TSTT == "1-Passed") {
                        testRow['QTRS'] = newQTRS;
                        testRow['TSTT'] = "1-Passed";
                        testRow['TTDT'] = ttdt;
                        tstt = "1";
                        this.qiresGrid.updateRow(this.rowQIRes, testRow);
                        //If pallet wise flag is true, update test in XtendM3 table too
                        if (this.palletwiseFlag) {
                           var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], event.item['TSEQ'], newQTRS, newQLCD, event.item['QOP12'], tstt, ttdt, this.usid, "0", event.item['SI01']);
                        }
                     }

                     //On Fail
                     else if (TSTT == "3-Failed") {
                        testRow['QTRS'] = newQTRS;
                        testRow['TSTT'] = "3-Failed";
                        tstt = "3";
                        if (countTest == 1) {
                           //Scenario 2 triggered > Copy test to sequence 2
                           secondSeqFlag = false;
                           //Update formula-based test before update, so that we can get values before creating second sequence
                           for (let entry of this.formulaBased.entries()) {
                              //entry[0] - formula;qtst, entry[1] - factors
                              const arr = entry[0].split(";");
                              var formula = arr[0];
                              var ftest = arr[1];
                              var ftsty, ftseq;
                              var findex = 0;
                              var index = 0;
                              var factors = entry[1];
                              var isTestIncluded = false;
                              var testCount = 0;
                              //Check if any formula contains the test changed - check if factors 1 or 2 == qtst
                              for (let test of factors) {
                                 const arr2 = test.split("_");
                                 var fac1 = arr2[0];
                                 var fac2 = arr2[1];
                                 if (this.rowData['QTST'] == fac1 || this.rowData['QTST'] == fac2) {
                                    isTestIncluded = true;
                                    console.log("Updated test " + this.rowData['QTST'] + " is included in formula " + ftest);
                                 }
                              }
                              if (isTestIncluded) {
                                 for (let obj of this.qires) {
                                    index++;
                                    if (obj['QTST'] == ftest) {
                                       countTest++;
                                       ftsty = obj['TSTY'];
                                       ftseq = obj['TSEQ'];
                                       this.fbRow = obj;
                                       findex = index - 1;
                                    }
                                 }
                                 var updCalc = await this.qmsService.UpdCalcTests(this.faci, this.qrid);
                                 if (updCalc) {
                                    var fbTest = await this.qmsService.GetQIResult(this.faci, this.qrid, this.itemno, ftest, ftsty, ftseq);
                                    formulaRes.set(ftest, fbTest);
                                 }
                              }
                           }

                           //Add the second sequence
                           await this.qmsService.AddTestResult(this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], 1);
                           //If pallet wise flag is true, add second sequence test in XtendM3 table too
                           if (this.palletwiseFlag) {
                              var isOK = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, event.item['QTST'], event.item['TSTY'], "2", event.item['QOP12'], this.itemno, this.bano, "", "", event.item['TTDT'], "", "", "", event.item['EXSQ'], event.item['EVMX'], event.item['EVMN'], event.item['EVTG'], event.item['SPEC'], event.item['QSE1'], event.item['QSE2'], event.item['QTE1'], event.item['QTE2'], event.item['VLTP'], event.item['TCAL'], event.item['FMID'], event.item['QTCD'], event.item['QLCD2'], "0");
                           }
                           //If pallet wise flag is true, update the updated test in XtendM3 table too
                           if (this.palletwiseFlag) {
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], event.item['TSEQ'], newQTRS, newQLCD, event.item['QOP12'], tstt, ttdt, this.usid, "0", event.item['SI01']);
                           }
                           //Reload QR Test Grid
                           await this.setQIResult(this.faci, this.qrid, this.itemno, this.bano);
                        }

                        //If pallet wise testing triggered for updated test, only update XtendM3 table
                        else {
                           testRow['TTDT'] = ttdt;
                           this.qiresGrid.updateRow(this.rowQIRes, testRow);
                           //If pallet wise flag is true, update test in XtendM3 table too
                           if (this.palletwiseFlag) {
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], event.item['TSEQ'], newQTRS, newQLCD, event.item['QOP12'], tstt, ttdt, this.usid, "0", event.item['SI01']);
                           }
                        }
                     }
                  }

                  /************************************************ SEQUENCE 2 UPDATES ****************************************************/
                  else if (event.item['TSEQ'] == 2) {
                     var count = 0;
                     for (let obj of this.qiresGrid.dataset) {
                        if (obj['QTST'] == event.item['QTST']) {
                           count++;
                        }
                     }
                     if (count == 2) {
                        var tstt = "";
                        //Get TSTT value
                        var TSTT = await this.qmsService.GetTSTT(this.faci, this.qrid, event.item['SPEC'], this.itemno, event.item['QTST']);
                        if (TSTT == "1-Passed") {
                           testRow['QTRS'] = newQTRS;
                           testRow['TSTT'] = "1-Passed";
                           testRow['TTDT'] = ttdt;
                           tstt = "1";
                           this.qiresGrid.updateRow(this.rowQIRes, testRow);

                           var firstSeq: any[];
                           var firstSeqIdx = 0;
                           var idx = 0;
                           //Update first sequence test as well
                           for (let obj1 of this.qires) {
                              idx++;
                              if (obj1['QTST'] == event.item['QTST'] && obj1['TSEQ'] == 1) {
                                 firstSeq = obj1;
                                 firstSeqIdx = idx - 1;
                              }

                           }
                           firstSeq['TSTT'] = "1-Passed";
                           firstSeq['TTDT'] = ttdt;
                           this.qiresGrid.updateRow(firstSeqIdx, firstSeq);

                           //If pallet wise flag is true, update test in XtendM3 table too
                           if (this.palletwiseFlag) {
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], event.item['TSEQ'], newQTRS, newQLCD, event.item['QOP12'], tstt, ttdt, this.usid, "0", event.item['SI01']);
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, firstSeq['QTST'], firstSeq['TSTY'], firstSeq['TSEQ'], firstSeq['QTRS'], firstSeq['QLCD'], firstSeq['QOP12'], tstt, ttdt, this.usid, "0", firstSeq['SI01']);
                           }
                        }
                        if (TSTT == "3-Failed") {
                           testRow['QTRS'] = newQTRS;
                           testRow['TSTT'] = "3-Failed";
                           testRow['TTDT'] = ttdt;
                           tstt = "3";
                           //Scenario 3 Copy test > Pallet Wise Testing
                           //Get number of lots to create number of pallet copies
                           var PalletCount = await this.qmsService.GetPallet(this.faci, this.bano, this.itemno);
                           //If number of pallets is less than 3, cannot trigger pallet wise testing
                           if (PalletCount < 3) {
                              this.handleError("Pallet count less than or equal 2, cannot trigger pallet wise testing");
                              this.qiresGrid.updateRow(this.rowQIRes, testRow);
                           }
                           else {
                              var i;
                              var prvl = "";
                              if (event.item['TSTY'] == "0") {//Quantitative
                                 prvl = event.item['QTRS'];
                              }
                              else if (event.item['TSTY'] == "2") {//Qualitative
                                 prvl = event.item['QLCD'];
                              }
                              let map = new Map();
                              //Add already existing tests to XtendM3
                              //If Pallet-Wise Testing not yet selected for other tests, add all existing tests
                              var XtendM3tests = await this.qmsService.ListXtendTestResults(this.company, this.faci, this.qrid, this.itemno, this.bano);
                              if (XtendM3tests.length == 0) {
                                 for (let obj of this.qires) {
                                    var isOK = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, obj['QTST'], obj['TSTY'], obj['TSEQ'], obj['QOP12'], this.itemno, this.bano, "", obj['SI01'], obj['TTDT'], obj['QTRS'], obj['QLCD'], obj['TSTT'], obj['EXSQ'], obj['EVMX'], obj['EVMN'], obj['EVTG'], obj['SPEC'], obj['QSE1'], obj['QSE2'], obj['QTE1'], obj['QTE2'], obj['VLTP'], obj['TCAL'], obj['FMID'], obj['QTCD'], obj['QLCD2'], "0");
                                    if (!isOK) {
                                       this.handleError("Existing test " + obj['QTST'] + " sequence " + obj['TSEQ'] + " has not been added to the XtendM3 table. Check console for errors.");
                                    }
                                 }
                              }

                              //Add 3rd sequence for test that failed
                              var isOK = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, event.item['QTST'], event.item['TSTY'], 3, event.item['QOP12'], this.itemno, this.bano, prvl, "", "", "", "", "", event.item['EXSQ'], event.item['EVMX'], event.item['EVMN'], event.item['EVTG'], event.item['SPEC'], event.item['QSE1'], event.item['QSE2'], event.item['QTE1'], event.item['QTE2'], event.item['VLTP'], event.item['TCAL'], event.item['FMID'], event.item['QTCD'], event.item['QLCD2'], "1");
                              if (!isOK) {
                                 this.handleError("3rd sequence test has not been added to the XtendM3 table. Check console for errors.");
                              }
                              //Add 4th sequence and so on for test that failed
                              var ind = 4;
                              var tstCount = 0;
                              var passCount = 0;
                              for (i = 0; i < (parseInt(PalletCount) - 3); i++) {
                                 tstCount++;
                                 var isOK = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, event.item['QTST'], event.item['TSTY'], ind, event.item['QOP12'], this.itemno, this.bano, "", "", "", "", "", "", event.item['EXSQ'], event.item['EVMX'], event.item['EVMN'], event.item['EVTG'], event.item['SPEC'], event.item['QSE1'], event.item['QSE2'], event.item['QTE1'], event.item['QTE2'], event.item['VLTP'], event.item['TCAL'], event.item['FMID'], event.item['QTCD'], event.item['QLCD2'], "1");
                                 if (isOK) {
                                    passCount++;
                                 }
                                 ind++;
                              }
                              if (passCount != tstCount) {
                                 this.handleError("One or more tests have not been added to the XtendM3 table.");
                              }

                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], "1", "", "", "", "", "", "", "1", "");
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], event.item['TSEQ'], newQTRS, newQLCD, event.item['QOP12'], tstt, ttdt, this.usid, "1", event.item['SI01']);

                              this.palletwiseFlag = true;
                              await this.setOptionsPallet();
                              //this.setPalletWiseEditorOptions();
                              //Load QR Test Grid
                              await this.setQIResult(this.faci, this.qrid, this.itemno, this.bano);
                           }
                        }

                     }
                  }
               }
               //If update fails, change back to old value
               else {
                  console.log("Update failed");
                  testRow[columnName] = oldVal;
                  this.qiresGrid.updateRow(this.rowQIRes, testRow);
               }
            }


            //************************************************ PALLET WISE TEST UPDATES ***************************************************/
            else {
               var isValid = true;
               if (event.item['TSTY'] == "0" || event.item['TSTY'] == "1") {
                  newQTRS = event.item['QTRS1'];
                  if (newQTRS.includes(',')) {
                     console.log("QTRS1 has ,");
                     newQTRS = event.item['QTRS1'].replace(',', '.');
                  }
                  else if (newQTRS.includes('.')) {
                     console.log("has decimal");
                     newQTRS = event.item['QTRS1'];
                  }
                  else {
                     console.log("has no decimal");
                     newQTRS = event.item['QTRS1'] + '.0';
                  }
                  const num = parseFloat(newQTRS);
                  if (isNaN(num)) {
                     console.log("QTRS value is not a number");
                     isValid = false;
                  }
                  newQLCD = "";
               }
               else {
                  newQLCD = event.item['QLCD1'];
                  newQTRS = "";
               }

               var tstt = await this.getStatus(event.item['VLTP'], event.item['EVMX'], event.item['EVMN'], event.item['EVTG'], event.item['TSTY'], newQLCD, newQTRS, event.item['QLCD1'], event.item['QOP12'], event.item['QOP1'], event.item['origQOP1']);
               console.log("TSTT is " + tstt);
               if (isValid) {
                  var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, event.item['QTST'], event.item['TSTY'], event.item['TSEQ'], newQTRS, newQLCD, event.item['QOP12'], tstt, ttdt, this.usid, "1", event.item['SI01']);
                  if (isUpdate) {
                     this.rowData['TTDT'] = ttdt;
                     //Update row status
                     this.rowData['QTRS1'] = newQTRS;
                     if (tstt == "1") {
                        this.rowData['TSTT'] = "1-Passed";
                     }
                     else if (tstt == "3") {
                        this.rowData['TSTT'] = "3-Failed";
                     }
                     this.qiresGrid.updateRow(this.rowQIRes, this.rowData);
                  }
                  //If update fails, change back to dataset
                  else {
                     console.log("Update failed");
                     this.rowData[columnName] = oldVal;
                     this.qiresGrid.updateRow(this.rowQIRes, this.rowData);
                  }
               }
               //If value is invalid, change back to dataset
               else {
                  console.log("Value is invalid");
                  this.rowData[columnName] = oldVal;
                  this.qiresGrid.updateRow(this.rowQIRes, this.rowData);
               }

               //Check if all pallet-wise sequences have been tested, if yes, call QMS302MI to update test status
               var noTests = 0;
               var noTested = 0;
               var tstt = "1";
               for (let test of this.qires) {
                  if (test['QTST'] == event.item['QTST']) {
                     noTests++;
                     if (test['TSTT'] == "1-Passed" || test['TSTT'] == "3-Failed") {
                        noTested++;
                        if (test['TSTT'] == "3-Failed") {
                           tstt = "3";
                        }
                     }
                  }
               }
               if (noTests == noTested) {
                  await this.qmsService.UpdTesttoQIReq(this.faci, this.qrid, event.item['SPEC'], event.item['QSE1'], event.item['QSE2'], event.item['QTST'], event.item['QTE1'], event.item['QTE2'], event.item['TSTY'], tstt);
               }
            }

            /*************************************************** FORMULA-BASED UPDATES ****************************************************/
            //Check if test is included in Formula-based test
            localStorage.setItem("QMS_SDK", "true");
            for (let entry of this.formulaBased.entries()) {
               //entry[0] - formula;qtst, entry[1] - factors
               const arr = entry[0].split(";");
               var formula = arr[0];
               var ftest = arr[1];
               var ftsty, ftseq;
               var findex = 0;
               var index = 0;
               var factors = entry[1];
               var isTestIncluded = false;
               var testCount = 0;
               var changedVal = "";

               //Check if any formula contains the test changed - check if factors 1 or 2 == qtst
               for (let test of factors) {
                  testCount++;
                  const arr2 = test.split("_");
                  var fac1 = arr2[0];
                  var fac2 = arr2[1];
                  if (this.rowData['QTST'] == fac1 || this.rowData['QTST'] == fac2) {
                     isTestIncluded = true;
                     console.log("Updated test " + this.rowData['QTST'] + " is included in formula " + ftest);
                  }
               }

               //Retrieve latest formula-based test index and row details
               if (isTestIncluded) {
                  var countTest = 0; //Number of sequence for formula-based test
                  var countFac = 0; //Number of factors in formula
                  var facPalletWise = 0; //Number of factors in pallet wise
                  var changedPalletWise = 0; //Number of sequences for test changed
                  for (let obj of this.qires) {
                     index++;
                     if (obj['QTST'] == ftest) {
                        countTest++;
                        ftsty = obj['TSTY'];
                        ftseq = obj['TSEQ'];
                        this.fbRow = obj;
                        findex = index - 1;
                     }
                     if (obj['QTST'] == this.rowData['QTST'] && obj['TSEQ'] == this.rowData['TSEQ']) {
                        changedVal = this.rowData['QTRS'];
                     }
                  }

                  //Check if any test included in the formula is pallet wise
                  for (let test of factors) {
                     var countTestFac = 0; //Number of sequence for factors
                     const arr = test.split("_");
                     var fac1 = arr[0];
                     var fac2 = arr[1];
                     for (let obj of this.qires) {
                        if (fac2 == obj['QTST'] || fac1 == obj['QTST']) {
                           countTestFac++;
                           if (fac2 == this.rowData['QTST'] || fac1 == this.rowData['QTST']) {
                              changedPalletWise++;
                           }
                        }
                     }
                     if (countTestFac != 0) {
                        countFac++;
                     }
                     if (countTestFac > 2) {
                        facPalletWise++;
                     }
                  }

                  console.log("Number of formula-based test sequence:" + countTest);
                  console.log("Number of factors in formula:" + countFac);
                  console.log("Number of changed test sequence:" + changedPalletWise);
                  console.log("Number tests in pallet wise:" + facPalletWise);

                  var tstt = "";
                  //No test included in the formula is pallet wise
                  if (facPalletWise == 0) {
                     console.log("No test included in formula is pallet-wise, triggering standard process...");
                     //If formula-based test has only 1 sequence
                     if (countTest == 1) {
                        var updCalc = await this.qmsService.UpdCalcTests(this.faci, this.qrid);
                        if (updCalc) {
                           var fbTest = await this.qmsService.GetQIResult(this.faci, this.qrid, this.itemno, ftest, ftsty, ftseq);
                           for (let obj1 of fbTest) {
                              this.fbRow['QTRS'] = obj1['QTRS'];
                           }
                           //Get test result before update if second sequence of test created
                           var TSTT;
                           if (secondSeqFlag) {
                              for (let entry of formulaRes.entries()) {
                                 if (entry[0] == ftest) {
                                    TSTT = entry[1];
                                 }
                              }
                           }
                           else {
                              TSTT = await this.qmsService.GetTSTT(this.faci, this.qrid, this.fbRow['SPEC'], this.itemno, ftest);
                           }
                           //Update row TSTT
                           if (TSTT == "1-Passed") {
                              this.fbRow['TSTT'] = "1-Passed";
                              this.fbRow['TTDT'] = ttdt;
                              tstt = "1";
                              this.qiresGrid.updateRow(findex, this.fbRow);
                           }
                           else if (TSTT == "3-Failed") {
                              this.fbRow['TSTT'] = "3-Failed";
                              this.fbRow['TTDT'] = ttdt;
                              tstt = "3";

                              //Scenario 2 Copy Formula-based Test to Seq 2
                              await this.qmsService.AddTestResult(this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], 1);
                              //Scenario 2 Copy Tests in the formula to Seq 2
                              //Loop in factors included in formula
                              for (let test of factors) {
                                 const arr = test.split("_");
                                 var fac1 = arr[0];
                                 var fac2 = arr[1];
                                 var countSeq = 0;
                                 var countSeq1 = 0;
                                 var facTSTY = "";
                                 var facQOP1 = "";
                                 var facEXSQ, facEVMX, facEVMN, facEVTG, facSPEC, facQSE1, facQSE2, facQTE1, facQTE2, facVLTP, facTCAL, facFMID, facQTCD, facQLC2;
                                 var fac1EXSQ, fac1EVMX, fac1EVMN, fac1EVTG, fac1SPEC, fac1QSE1, fac1QSE2, fac1QTE1, fac1QTE2, fac1VLTP, fac1TCAL, fac1FMID, fac1QTCD, fac1QLC2;
                                 var fac1TSTY = "";
                                 var fac1QOP1 = "";
                                 //Check if sequence 2 already triggered for test included in formula
                                 for (let obj of this.qires) {
                                    //For FAC2
                                    if (obj['QTST'] == fac2) {
                                       facTSTY = obj['TSTY'];
                                       facQOP1 = obj['QOP12'];
                                       facEXSQ = obj['EXSQ'];
                                       facEVMX = obj['EVMX'];
                                       facEVMN = obj['EVMN'];
                                       facEVTG = obj['EVTG'];
                                       facSPEC = obj['SPEC'];
                                       facQSE1 = obj['QSE1'];
                                       facQSE2 = obj['QSE2'];
                                       facQTE1 = obj['QTE1'];
                                       facQTE2 = obj['QTE2'];
                                       facVLTP = obj['VLTP'];
                                       facTCAL = obj['TCAL'];
                                       facFMID = obj['FMID'];
                                       facQTCD = obj['QTCD'];
                                       facQLC2 = obj['QLC2'];
                                       countSeq++;
                                    }
                                    //For FAC1
                                    if (obj['QTST'] == fac1) {
                                       fac1TSTY = obj['TSTY'];
                                       fac1QOP1 = obj['QOP12'];
                                       fac1EXSQ = obj['EXSQ'];
                                       fac1EVMX = obj['EVMX'];
                                       fac1EVMN = obj['EVMN'];
                                       fac1EVTG = obj['EVTG'];
                                       fac1SPEC = obj['SPEC'];
                                       fac1QSE1 = obj['QSE1'];
                                       fac1QSE2 = obj['QSE2'];
                                       fac1QTE1 = obj['QTE1'];
                                       fac1QTE2 = obj['QTE2'];
                                       fac1VLTP = obj['VLTP'];
                                       fac1TCAL = obj['TCAL'];
                                       fac1FMID = obj['FMID'];
                                       fac1QTCD = obj['QTCD'];
                                       fac1QLC2 = obj['QLC2'];
                                       countSeq1++;
                                    }
                                 }

                                 //For FAC2
                                 //If already has sequence 2, no need to copy
                                 if (countSeq >= 2) {
                                    console.log("No need to copy fac2 " + fac2 + ". Second sequence already exists.");
                                 }
                                 //If no sequence 2 yet, copy to 2nd sequence
                                 else if (countSeq == 1) {
                                    console.log("Copying second sequence for test (fac2) " + fac2 + ".");
                                    await this.qmsService.AddTestResult(this.faci, this.qrid, this.itemno, fac2, facTSTY, 1);
                                    //If pallet wise flag is true, add test in XtendM3 table too
                                    var newOp = "";
                                    if (facQOP1 == ">") {
                                       newOp = "1"
                                    }
                                    if (facQOP1 == ">=") {
                                       newOp = "2"
                                    }
                                    if (facQOP1 == "<") {
                                       newOp = "3"
                                    }
                                    if (facQOP1 == "<=") {
                                       newOp = "4"
                                    }
                                    if (facQOP1 == "=") {
                                       newOp = "5"
                                    }
                                    //If records exist in XtendM3, add 2nd sequence to XtendM3 as well
                                    if (this.palletwiseFlag) {
                                       var isUpdate = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, fac2, facTSTY, "2", newOp, this.itemno, this.bano, "", "", "", "", "", "", facEXSQ, facEVMX, facEVMN, facEVTG, facSPEC, facQSE1, facQSE2, facQTE1, facQTE2, facVLTP, facTCAL, facFMID, facQTCD, facQLC2, "0");
                                    }
                                 }

                                 //For FAC1
                                 //If already has sequence 2, no need to copy
                                 if (countSeq1 >= 2) {
                                    console.log("No need to copy fac1 " + fac1 + ". Second sequence already exists.");
                                 }
                                 //If no sequence 2 yet, copy to 2nd sequence
                                 else if (countSeq1 == 1) {
                                    console.log("Copying second sequence for test (fac1) " + fac1 + ".");
                                    await this.qmsService.AddTestResult(this.faci, this.qrid, this.itemno, fac1, facTSTY, 1);
                                    //If pallet wise flag is true, add test in XtendM3 table too
                                    var newOp1 = "";
                                    if (fac1QOP1 == ">") {
                                       newOp1 = "1"
                                    }
                                    if (fac1QOP1 == ">=") {
                                       newOp1 = "2"
                                    }
                                    if (fac1QOP1 == "<") {
                                       newOp1 = "3"
                                    }
                                    if (fac1QOP1 == "<=") {
                                       newOp1 = "4"
                                    }
                                    if (fac1QOP1 == "=") {
                                       newOp1 = "5"
                                    }
                                    //If records exist in XtendM3, add 2nd sequence to XtendM3 as well
                                    if (this.palletwiseFlag) {
                                       var isUpdate = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, fac1, fac1TSTY, "2", newOp1, this.itemno, this.bano, "", "", "", "", "", "", fac1EXSQ, fac1EVMX, fac1EVMN, fac1EVTG, fac1SPEC, fac1QSE1, fac1QSE2, fac1QTE1, fac1QTE2, fac1VLTP, fac1TCAL, fac1FMID, fac1QTCD, fac1QLC2, "0");
                                    }
                                 }
                              }
                              //Load QR Test Grid
                              await this.setQIResult(this.faci, this.qrid, this.itemno, this.bano);
                           }

                           //If pallet wise flag is true, update formula-based test in XtendM3 table too
                           if (this.palletwiseFlag) {
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], this.fbRow['TSEQ'], this.fbRow['QTRS'], this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "0", this.fbRow['SI01']);
                           }
                        }

                        else {
                           console.log("Formula-based test calculation failed.");
                           //Setting formula-based value to 0
                           this.fbRow['TSTT'] = "0-Not Tested";
                           this.fbRow['TTDT'] = "";
                           this.fbRow['QTRS'] = "0.00";
                           this.qiresGrid.updateRow(findex, this.fbRow);
                        }
                     }

                     //If formula-based test has only 2 sequences
                     else if (countTest == 2) {
                        var updCalc = await this.qmsService.UpdCalcTests(this.faci, this.qrid);
                        if (updCalc) {
                           var fbTest = await this.qmsService.GetQIResult(this.faci, this.qrid, this.itemno, ftest, ftsty, ftseq);
                           for (let obj1 of fbTest) {
                              this.fbRow['QTRS'] = obj1['QTRS'];
                           }
                           var TSTT = await this.qmsService.GetTSTT(this.faci, this.qrid, this.fbRow['SPEC'], this.itemno, ftest);
                           //Update row TSTT
                           if (TSTT == "1-Passed") {
                              this.fbRow['TSTT'] = "1-Passed";
                              this.fbRow['TTDT'] = ttdt;
                              tstt = "1";
                              this.qiresGrid.updateRow(findex, this.fbRow);
                              //If pallet wise flag is true, update test in XtendM3 table too
                              if (this.palletwiseFlag) {
                                 var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], this.fbRow['TSEQ'], this.fbRow['QTRS'], this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "0", this.fbRow['SI01']);
                              }
                           }
                           //Scenario 3 Copy test > Pallet Wise Testing
                           else if (TSTT == "3-Failed") {
                              this.fbRow['TSTT'] = "3-Failed";
                              this.fbRow['TTDT'] = ttdt;
                              tstt = "3";
                              //Get number of lots to create number of pallet copies
                              var PalletCount = await this.qmsService.GetPallet(this.faci, this.bano, this.itemno);
                              //PallCount: number = 5;
                              //If number of pallets is less than 3, cannot trigger pallet wise testing
                              if (PalletCount < 3) {
                                 this.handleError("Pallet count less than or equal 2, cannot trigger pallet wise testing");
                                 this.qiresGrid.updateRow(findex, this.fbRow);
                              }
                              else {
                                 var i;
                                 var prvl = "";
                                 if (this.fbRow['TSTY'] == "0") {//Quantitative
                                    prvl = this.fbRow['QTRS'];
                                 }
                                 else if (this.fbRow['TSTY'] == "2") {//Qualitative
                                    prvl = this.fbRow['QLCD'];
                                 }
                                 let map = new Map();
                                 //If Pallet-Wise Testing not yet selected for other tests, add all existing tests
                                 var XtendM3tests = await this.qmsService.ListXtendTestResults(this.company, this.faci, this.qrid, this.itemno, this.bano);
                                 if (XtendM3tests.length == 0) {
                                    for (let obj of this.qires) {
                                       await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, obj['QTST'], obj['TSTY'], obj['TSEQ'], obj['QOP12'], this.itemno, this.bano, "", obj['SI01'], obj['TTDT'], obj['QTRS'], obj['QLCD'], obj['TSTT'], obj['EXSQ'], obj['EVMX'], obj['EVMN'], obj['EVTG'], obj['SPEC'], obj['QSE1'], obj['QSE2'], obj['QTE1'], obj['QTE2'], obj['VLTP'], obj['TCAL'], obj['FMID'], obj['QTCD'], obj['QLCD2'], "0");
                                    }
                                 }
                                 //Add 3rd sequence for Formula-based test that failed
                                 await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], 3, this.fbRow['QOP12'], this.itemno, this.bano, prvl, "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");

                                 //Add 4th sequence and so on for Formula-based test that failed
                                 var ind = 4;
                                 for (i = 0; i < (parseInt(PalletCount) - 3); i++) {
                                    //for (i = 0; i < (PallCount - 3); i++) {
                                    await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], ind, this.fbRow['QOP12'], this.itemno, this.bano, "", "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                                    ind++;
                                 }

                                 //Update PALL for sequences 1 and 2
                                 var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], "1", "", "", "", "", "", "", "1", "");
                                 var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], this.fbRow['TSEQ'], this.fbRow['QTRS'], this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "1", this.fbRow['SI01']);


                                 this.palletwiseFlag = true;
                                 await this.setOptionsPallet();
                                 //this.setPalletWiseEditorOptions();
                                 //Load QR Test Grid
                                 await this.setQIResult(this.faci, this.qrid, this.itemno, this.bano);
                              }
                           }
                        }
                     }
                     //If formula-based test is already pallet wise, update second sequence test still
                     else {
                        //Get second sequence row and details
                        var index1 = 0;
                        for (let obj of this.qires) {
                           index1++;
                           if (obj['QTST'] == ftest && obj['TSEQ'] == 2) {
                              ftsty = obj['TSTY'];
                              this.fbRow = obj;
                              findex = index1 - 1;
                              console.log("Formula based test to update: " + this.fbRow + " @ index " + findex);
                           }
                        }
                        var updCalc = await this.qmsService.UpdCalcTests(this.faci, this.qrid);
                        if (updCalc) {
                           var fbTest = await this.qmsService.GetQIResult(this.faci, this.qrid, this.itemno, ftest, ftsty, "2");
                           var newVal = "";
                           for (let obj1 of fbTest) {
                              newVal = obj1['QTRS'];
                           }
                           var TSTT = await this.qmsService.GetTSTT(this.faci, this.qrid, this.fbRow['SPEC'], this.itemno, ftest);
                           //Update row TSTT
                           if (TSTT == "1-Passed") {
                              this.fbRow['QTRS1'] = newVal;
                              this.fbRow['TSTT'] = "1-Passed";
                              this.fbRow['TTDT'] = ttdt;
                              tstt = "1";
                              this.qiresGrid.updateRow(findex, this.fbRow);
                           }
                           //Scenario 3 Copy test > Pallet Wise Testing
                           else if (TSTT == "3-Failed") {
                              this.fbRow['QTRS1'] = newVal;
                              this.fbRow['TSTT'] = "3-Failed";
                              this.fbRow['TTDT'] = ttdt;
                              tstt = "3";
                              this.qiresGrid.updateRow(findex, this.fbRow);

                           }
                        }
                        //If pallet wise flag is true, update test in XtendM3 table too
                        if (this.palletwiseFlag) {
                           var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], "2", newVal, this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "1", this.fbRow['SI01']);
                        }
                     }
                  }

                  //If any of the tests included is pallet wise
                  else if (countFac > facPalletWise) {
                     //If the changed test is pallet-wise
                     if (changedPalletWise > 3) {
                        //Trigger pallet wise for formula-based test as well, if not yet triggered
                        if (countTest < 3) {
                           //Scenario 3 Copy test > Pallet Wise Testing
                           //Get number of lots to create number of pallet copies
                           var PalletCount = await this.qmsService.GetPallet(this.faci, this.bano, this.itemno);
                           //If number of pallets is less than 3, cannot trigger pallet wise testing
                           if (PalletCount < 3) {
                              this.handleError("Pallet count less than or equal 2, cannot trigger pallet wise testing");
                              this.qiresGrid.updateRow(findex, this.fbRow);
                           }
                           else {
                              var i;
                              var prvl = "";
                              if (this.fbRow['TSTY'] == "0") {//Quantitative
                                 prvl = this.fbRow['QTRS'];
                              }
                              else if (this.fbRow['TSTY'] == "2") {//Qualitative
                                 prvl = this.fbRow['QLCD'];
                              }

                              if (countTest == 1) {
                                 //Add 2nd and 3rd sequence for FB
                                 await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], 2, this.fbRow['QOP12'], this.itemno, this.bano, prvl, "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                                 await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], 3, this.fbRow['QOP12'], this.itemno, this.bano, "", "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                              }
                              else {
                                 //Add only 3rd and so on for FB
                                 await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], 3, this.fbRow['QOP12'], this.itemno, this.bano, prvl, "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                              }

                              //Add 4th sequence and so on for FB
                              var ind = 4;
                              for (i = 0; i < (parseInt(PalletCount) - 3); i++) {
                                 await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], ind, this.fbRow['QOP12'], this.itemno, this.bano, "", "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                                 ind++;
                              }

                              //If pallet wise flag is true, update test in XtendM3 table too
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], "1", "", "", "", "", "", "", "1", "");
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], this.fbRow['TSEQ'], this.fbRow['QTRS'], this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "1", this.fbRow['SI01']);

                              await this.setQIResult(this.faci, this.qrid, this.itemno, this.bano);
                           }

                        }
                        var i: any = 0;
                        this.uri = "<%3fxml+version=\"1.0\"+encoding=\"utf-8\"%3f><sequence>";
                        this.AddStep("RUN", "CRS570");
                        this.AddField("W1FMID", formula);
                        this.AddStep("KEY", "F5");
                        this.AddStep("LSTOPT", "13");

                        for (let test of factors) {
                           i++;
                           const arr3 = test.split("_");
                           var fac1 = arr3[0];
                           var fac2 = arr3[1];
                           var OBJ1 = arr3[2];
                           var OBJ2 = arr3[3];
                           var testCount = 0;
                           var QTRS1 = "";
                           var QTRS2 = "";
                           var index2: any = 0;
                           var latestVal1 = "";
                           var latestVal2 = "";
                           var seqVal1 = "";
                           var seqVal2 = "";
                           var countFactor = 0;
                           var countFactor1 = 0;
                           //Check if factor is pallet-wise
                           for (let obj1 of this.qires) {
                              if (obj1['QTST'] == fac2) {
                                 countFactor++;
                              }
                              if (obj1['QTST'] == fac1) {
                                 countFactor1++;
                              }
                           }
                           for (let obj1 of this.qires) {
                              index2++;
                              //FAC1
                              if (obj1['QTST'] == fac1) {
                                 if (countFactor1 < 3) {
                                    QTRS1 = obj1['QTRS'].replace(".", ",");
                                    console.log("QTRS value for fac 1 " + fac1 + " is " + obj1['QTRS']);
                                 }
                                 else {
                                    QTRS1 = obj1['QTRS1'].replace(".", ",");
                                    console.log("QTRS value for fac 1 " + fac1 + " is " + obj1['QTRS1']);
                                 }
                                 latestVal1 = QTRS1;
                                 if (obj1['TSEQ'] == sequence) {
                                    seqVal1 = QTRS1;
                                 }
                              }
                              //FAC2
                              if (obj1['QTST'] == fac2) {
                                 if (countFactor < 3) {
                                    QTRS2 = obj1['QTRS'].replace(".", ",");
                                    console.log("QTRS value for fac 2" + fac2 + " is " + obj1['QTRS']);
                                 }
                                 else {
                                    QTRS2 = obj1['QTRS1'].replace(".", ",");
                                    console.log("QTRS value for fac2 " + fac2 + " is " + obj1['QTRS1']);
                                 }
                                 latestVal2 = QTRS2;
                                 if (obj1['TSEQ'] == sequence) {
                                    seqVal2 = QTRS2;
                                 }
                              }
                           }

                           //FAC1
                           var val1 = latestVal1;
                           if (seqVal1 != "") {
                              val1 = seqVal1;
                           }
                           if (OBJ1 == "6") {
                              var fieldID1 = "R" + (i) + "C6";
                              this.AddField(fieldID1, val1);
                              console.log("obj1 is 6 adding fac1 " + val1 + " to " + fieldID1);
                              this.AddStep("KEY", "ENTER");
                              this.AddStep("KEY", "ENTER");
                           }

                           //FAC2
                           var val2 = latestVal2;
                           if (seqVal2 != "") {
                              val2 = seqVal2;
                           }
                           if (OBJ2 == "6") {
                              var fieldID2 = "R" + (i) + "C12";
                              this.AddField(fieldID2, val2);
                              console.log("obj2 is 6 adding fac2 " + val2 + " to " + fieldID2);
                              this.AddStep("KEY", "ENTER");
                              this.AddStep("KEY", "ENTER");
                           }

                        }
                        this.AddStep("KEY", "ENTER");
                        this.AddStep("KEY", "F5");
                        //this.AddStep("KEY", "F3");
                        //this.AddStep("KEY", "F3");

                        console.log("Executing uri");
                        this.EncodeURI();
                        this.uri = "mforms://_automation?data=" + this.uri;
                        this.appService.launch(this.uri);


                        setTimeout(async () => {
                           //Code to execute after the delay
                           //Get formula-based test result
                           var newVal = localStorage.getItem("QMS");
                           newVal = newVal.replace(",", ".");
                           console.log("localStorage " + newVal);
                           console.log("Changing formula based test result " + ftest + " to " + newVal);
                           //Get correct sequence for formula-based test
                           var indexFB = 0;
                           for (let obj of this.qires) {
                              indexFB++;
                              if (obj['QTST'] == ftest && obj['TSEQ'] == sequence) {
                                 ftsty = obj['TSTY'];
                                 ftseq = obj['TSEQ'];
                                 this.fbRow = obj;
                                 findex = indexFB - 1;
                              }
                           }
                           this.fbRow['TTDT'] = ttdt;
                           this.fbRow['QTRS1'] = newVal.replace(/['"]+/g, '');
                           newVal = newVal.replace(/['"]+/g, '');
                           //Update Formula-based test result
                           //Pallet-wise; Update value in XtendM3 table
                           var tstt = await this.getStatus(this.fbRow['VLTP'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['TSTY'], this.fbRow['QLCD2'], this.fbRow['QTRS1'], this.fbRow['QLCD1'], this.fbRow['QOP12'], this.fbRow['QOP1'], this.fbRow['origQOP1']);
                           var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], this.fbRow['TSEQ'], newVal, this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "1", this.fbRow['SI01']);

                           //Update row status
                           if (tstt == "1") {
                              this.fbRow['TSTT'] = "1-Passed";
                           }
                           else if (tstt == "3") {
                              this.fbRow['TSTT'] = "3-Failed";
                           }
                           this.qiresGrid.updateRow(findex, this.fbRow);

                           localStorage.setItem("QMS_SDK", "false");
                        }, 4500); // 4500 milliseconds = 4.5 seconds

                     }

                     //Changed test is not pallet-wise
                     else {
                        //Check if test value entered is latest, if yes, should update formula-based value
                        if (sequence == 2) {
                           //No need to trigger pallet-wise testing for formula-based test
                           //as that should already be triggered when existing test was triggered for pallet-wise testing
                           var i: any = 0;
                           this.uri = "<%3fxml+version=\"1.0\"+encoding=\"utf-8\"%3f><sequence>";
                           this.AddStep("RUN", "CRS570");
                           this.AddField("W1FMID", formula);
                           this.AddStep("KEY", "F5");
                           this.AddStep("LSTOPT", "13");

                           for (let test of factors) {
                              i++;
                              const arr3 = test.split("_");
                              var fac1 = arr3[0];
                              var OBJ1 = arr3[2];
                              var fac2 = arr3[1];
                              var OBJ2 = arr3[3];
                              var testCount = 0;
                              var QTRS1 = "";
                              var QTRS2 = "";
                              var index2: any = 0;
                              var latestVal1 = "";
                              var countFactor1 = 0;
                              var latestVal2 = "";
                              var countFactor2 = 0;
                              //Check if factor is pallet-wise
                              for (let obj1 of this.qires) {
                                 if (obj1['QTST'] == fac2) {
                                    countFactor2++;
                                 }
                                 if (obj1['QTST'] == fac1) {
                                    countFactor1++;
                                 }
                              }
                              for (let obj1 of this.qires) {
                                 index2++;
                                 //FAC1
                                 if (obj1['QTST'] == fac1) {
                                    if (countFactor1 < 3) {
                                       QTRS1 = obj1['QTRS'].replace(".", ",");
                                       console.log("QTRS value for fac 1 " + fac1 + " is " + obj1['QTRS']);
                                    }
                                    else {
                                       QTRS1 = obj1['QTRS1'].replace(".", ",");
                                       console.log("QTRS value for fac 1" + fac1 + " is " + obj1['QTRS1']);
                                    }
                                    latestVal1 = QTRS1;
                                 }
                                 //FAC2
                                 if (obj1['QTST'] == fac2) {
                                    if (countFactor2 < 3) {
                                       QTRS2 = obj1['QTRS'].replace(".", ",");
                                       console.log("QTRS value for fac2 " + fac2 + " is " + obj1['QTRS']);
                                    }
                                    else {
                                       QTRS2 = obj1['QTRS1'].replace(".", ",");
                                       console.log("QTRS value for fac2 " + fac2 + " is " + obj1['QTRS1']);
                                    }
                                    latestVal2 = QTRS2;
                                 }
                              }

                              //FAC1
                              var val1 = latestVal1;
                              if (OBJ1 == "6") {
                                 var fieldID1 = "R" + (i) + "C6";
                                 this.AddField(fieldID1, val1);
                                 console.log("obj is 1; adding " + val1 + " to " + fieldID1);
                                 this.AddStep("KEY", "ENTER");
                                 this.AddStep("KEY", "ENTER");
                              }

                              //FAC2
                              var val2 = latestVal2;
                              if (OBJ2 == "6") {
                                 var fieldID2 = "R" + (i) + "C12";
                                 this.AddField(fieldID2, val2);
                                 console.log("obj is 1; adding " + val2 + " to " + fieldID2);
                                 this.AddStep("KEY", "ENTER");
                                 this.AddStep("KEY", "ENTER");
                              }
                           }
                           this.AddStep("KEY", "ENTER");
                           this.AddStep("KEY", "F5");
                           //this.AddStep("KEY", "F3");
                           //this.AddStep("KEY", "F3");

                           console.log("Executing uri");
                           this.EncodeURI();
                           this.uri = "mforms://_automation?data=" + this.uri;
                           this.appService.launch(this.uri);


                           setTimeout(async () => {
                              //Code to execute after the delay
                              //Get formula-based test result
                              var newVal = localStorage.getItem("QMS");
                              newVal = newVal.replace(",", ".");
                              console.log("localStorage " + newVal);
                              console.log("Changing formula based test result " + ftest + " to " + newVal);
                              //Get correct sequence for formula-based test
                              var indexFB = 0;
                              for (let obj of this.qires) {
                                 indexFB++;
                                 if (obj['QTST'] == ftest && obj['TSEQ'] == sequence) {
                                    ftsty = obj['TSTY'];
                                    ftseq = obj['TSEQ'];
                                    this.fbRow = obj;
                                    findex = indexFB - 1;
                                 }
                              }
                              //Update Formula-based test result
                              //Pallet-wise; Update value in XtendM3 table
                              var tstt = await this.getStatus(this.fbRow['VLTP'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['TSTY'], this.fbRow['QLCD2'], this.fbRow['QTRS1'], this.fbRow['QLCD1'], this.fbRow['QOP12'], this.fbRow['QOP1'], this.fbRow['origQOP1']);
                              var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], this.fbRow['TSEQ'], this.fbRow['QTRS'], this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "1", this.fbRow['SI01']);
                              this.fbRow['TTDT'] = ttdt;
                              this.fbRow['QTRS1'] = newVal.replace(/['"]+/g, '');
                              //Update row status
                              if (tstt == "1") {
                                 this.fbRow['TSTT'] = "1-Passed";
                              }
                              else if (tstt == "3") {
                                 this.fbRow['TSTT'] = "3-Failed";
                              }
                              this.qiresGrid.updateRow(findex, this.fbRow);

                              localStorage.setItem("QMS_SDK", "false");
                           }, 4500); // 4500 milliseconds = 4.5 seconds
                        }

                        //Else, do not update
                     }

                  }

                  //If ALL tests are pallet wise, trigger pallet wise for formula-based test if not already triggered
                  else if (countFac == facPalletWise) {
                     //Trigger pallet wise for formula-based test as well
                     if (countTest < 3) {
                        //Scenario 3 Copy test > Pallet Wise Testing
                        //Get number of lots to create number of pallet copies
                        var PalletCount = await this.qmsService.GetPallet(this.faci, this.bano, this.itemno);
                        //If number of pallets is less than 3, cannot trigger pallet wise testing
                        if (PalletCount < 3) {
                           console.log("Pallet count less than or equal 2, cannot trigger pallet wise testing");
                           this.qiresGrid.updateRow(findex, this.fbRow);
                        }
                        else {
                           var i;
                           var prvl = "";
                           if (this.fbRow['TSTY'] == "0") {//Quantitative
                              prvl = this.fbRow['QTRS'];
                           }
                           else if (this.fbRow['TSTY'] == "2") {//Qualitative
                              prvl = this.fbRow['QLCD'];
                           }
                           let map = new Map();
                           //If Pallet-Wise Testing not yet selected for other tests, add all existing tests
                           var XtendM3tests = await this.qmsService.ListXtendTestResults(this.company, this.faci, this.qrid, this.itemno, this.bano);
                           if (XtendM3tests.length == 0) {
                              for (let obj of this.qires) {
                                 await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, obj['QTST'], obj['TSTY'], obj['TSEQ'], obj['QOP12'], this.itemno, this.bano, "", obj['SI01'], obj['TTDT'], obj['QTRS'], obj['QLCD'], obj['TSTT'], obj['EXSQ'], obj['EVMX'], obj['EVMN'], obj['EVTG'], obj['SPEC'], obj['QSE1'], obj['QSE2'], obj['QTE1'], obj['QTE2'], obj['VLTP'], obj['TCAL'], obj['FMID'], obj['QTCD'], obj['QLCD2'], "0");
                              }
                           }

                           if (countTest == 1) {
                              //Add 2nd and 3rd sequence for FB
                              await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], 2, this.fbRow['QOP12'], this.itemno, this.bano, prvl, "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                              await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], 3, this.fbRow['QOP12'], this.itemno, this.bano, "", "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                           }
                           else {
                              //Add only 3rd and so on for FB
                              await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], 3, this.fbRow['QOP12'], this.itemno, this.bano, prvl, "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                           }

                           //Add 4th sequence and so on for test that failed
                           var ind = 4;
                           for (i = 0; i < (parseInt(PalletCount) - 3); i++) {
                              await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.fbRow['QTST'], this.fbRow['TSTY'], ind, this.fbRow['QOP12'], this.itemno, this.bano, "", "", "", "", "", "", this.fbRow['EXSQ'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['SPEC'], this.fbRow['QSE1'], this.fbRow['QSE2'], this.fbRow['QTE1'], this.fbRow['QTE2'], this.fbRow['VLTP'], this.fbRow['TCAL'], this.fbRow['FMID'], this.fbRow['QTCD'], this.fbRow['QLCD2'], "1");
                              ind++;
                           }

                           //If pallet wise flag is true, update test in XtendM3 table too
                           var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], "1", "", "", "", "", "", "", "1", "");
                           var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], this.fbRow['TSEQ'], this.fbRow['QTRS'], this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "1", this.fbRow['SI01']);

                           await this.setQIResult(this.faci, this.qrid, this.itemno, this.bano);
                        }
                     }

                     var i: any = 0;
                     this.uri = "<%3fxml+version=\"1.0\"+encoding=\"utf-8\"%3f><sequence>";
                     this.AddStep("RUN", "CRS570");
                     this.AddField("W1FMID", formula);
                     this.AddStep("KEY", "F5");
                     this.AddStep("LSTOPT", "13");

                     for (let test of factors) {
                        i++;
                        const arr3 = test.split("_");
                        var fac1 = arr3[0];
                        var OBJ1 = arr3[2];
                        var fac2 = arr3[1];
                        var OBJ2 = arr3[3];
                        var testCount = 0;
                        var QTRS1 = "";
                        var QTRS2 = "";
                        var index2: any = 0;
                        for (let obj1 of this.qires) {
                           index2++;
                           //FAC1
                           if (obj1['QTST'] == fac1 && obj1['TSEQ'] == sequence) {
                              QTRS1 = obj1['QTRS1'].replace(".", ",");
                              console.log("QTRS value for fac1 " + fac1 + " is " + obj1['QTRS1'])
                              if (OBJ1 == "6") {
                                 var fieldID1 = "R" + (i) + "C6";
                                 this.AddField(fieldID1, QTRS1);
                                 console.log("obj is 1; adding " + QTRS1 + " to " + fieldID1);
                                 this.AddStep("KEY", "ENTER");
                                 this.AddStep("KEY", "ENTER");
                              }
                           }
                           //FAC2
                           if (obj1['QTST'] == fac2 && obj1['TSEQ'] == sequence) {
                              QTRS2 = obj1['QTRS1'].replace(".", ",");
                              console.log("QTRS value for fac2 " + fac2 + " is " + obj1['QTRS1'])
                              if (OBJ2 == "6") {
                                 var fieldID2 = "R" + (i) + "C12";
                                 this.AddField(fieldID2, QTRS2);
                                 console.log("obj is 1; adding " + QTRS2 + " to " + fieldID2);
                                 this.AddStep("KEY", "ENTER");
                                 this.AddStep("KEY", "ENTER");
                              }
                           }
                        }
                     }
                     this.AddStep("KEY", "ENTER");
                     this.AddStep("KEY", "F5");
                     //this.AddStep("KEY", "F3");
                     //this.AddStep("KEY", "F3");

                     console.log("Executing uri");
                     this.EncodeURI();
                     this.uri = "mforms://_automation?data=" + this.uri;
                     this.appService.launch(this.uri);


                     setTimeout(async () => {
                        //Code to execute after the delay
                        //Get formula-based test result
                        var newVal = localStorage.getItem("QMS");
                        console.log("localStorage " + newVal);
                        console.log("Changing formula based test result " + ftest + " to " + newVal);
                        //Get correct sequence for formula-based test
                        var indexFB = 0;
                        for (let obj of this.qires) {
                           indexFB++;
                           if (obj['QTST'] == ftest && obj['TSEQ'] == sequence) {
                              ftsty = obj['TSTY'];
                              ftseq = obj['TSEQ'];
                              this.fbRow = obj;
                              findex = indexFB - 1;
                           }
                        }
                        //Update Formula-based test result
                        //Pallet-wise; Update value in XtendM3 table
                        var tstt = await this.getStatus(this.fbRow['VLTP'], this.fbRow['EVMX'], this.fbRow['EVMN'], this.fbRow['EVTG'], this.fbRow['TSTY'], this.fbRow['QLCD2'], this.fbRow['QTRS1'], this.fbRow['QLCD1'], this.fbRow['QOP12'], this.fbRow['QOP1'], this.fbRow['origQOP1']);
                        var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.fbRow['QTST'], this.fbRow['TSTY'], this.fbRow['TSEQ'], this.fbRow['QTRS'], this.fbRow['QLCD'], this.fbRow['QOP12'], tstt, ttdt, this.usid, "1", this.fbRow['SI01']);
                        this.fbRow['TTDT'] = ttdt;
                        this.fbRow['QTRS1'] = newVal.replace(/['"]+/g, '');
                        //Update row status
                        if (tstt == "1") {
                           this.fbRow['TSTT'] = "1-Passed";
                        }
                        else if (tstt == "3") {
                           this.fbRow['TSTT'] = "3-Failed";
                        }
                        this.qiresGrid.updateRow(findex, this.fbRow);

                        localStorage.setItem("QMS_SDK", "false");
                     }, 4500); // 4500 milliseconds = 4.5 seconds
                  }
               }
            }

            //After all updates in standard and XtendM3 tables, check Status to enable buttons if value has been changed to 3
            var res = await this.qmsService.GetQSTA(this.faci, this.qrid);
            const arr = res.split("_");
            console.log("QAPR: " + arr[1] + " QSTA: " + arr[0]);
            //Check QSTA; If 3, enable buttons
            if (arr[0] == "3") {
               this.approvedFlag = true;
            }
            else this.approvedFlag = false;

            this.isEnter = false;
         }
         this.setBusy(false, 'qires');
      }
   }


   /**
   * On row selection, checks if user is super user.
   * If yes, enable ALL edit fields
   * If no, check if test has been done.
   * If yes, disable edit fields. If no, enable edit fields.
   * @param event
   */
   async onSelectData(event: { rows: { data: any; }[]; row; index }) {
      this.rowSelected = event.rows.length > 0 ? true : false;
      if (this.rowSelected) {
         var tstt = event.rows[0].data['TSTT'];
         var qtrs = event.rows[0].data['QTRS'];
         var qlcd = event.rows[0].data['QLCD'];
         var tsty = event.rows[0].data['TSTY'];
         var qtcd = event.rows[0].data['QTCD'];
         var qtst = event.rows[0].data['QTST'];
         this.rowData = event.rows[0].data;
         this.testSelected = true;

         //Check if pallet-wise selected for specific test
         var countTest = 0;
         for (let obj of this.qires) {
            if (obj['QTST'] == qtst) {
               countTest++;
            }
         }

         //Enable edit on test value fields based on test type
         if (countTest < 3) {
            this.setQLCDEditorOptions(tsty);
            this.setQTRSEditorOptions(tsty, qtcd);
         }

         else {
            this.setQLCD1EditorOptions(tsty);
            this.setQTRS1EditorOptions(tsty, qtcd);
         }

         //Disable test value fields for formula-based tests
         if (event.rows[0].data['TCAL'] == "1") {
            this.setFormulaEditorOptions();
         }

         //Enable edit columns based on test status and user role
         if (((qtrs == 0 || qtrs == "") && qlcd == "") || tstt == "0-Not tested" || tstt == "3-Failed" || this.isSuperUser) {
            if (event.rows[0].data['QTST'] == "FoodSafety") {
               if (!this.isSuperUser) {
                  this.enableEditFields(false);
               }
               else this.enableEditFields(true);
            }
            else this.enableEditFields(true);
         }
         else {
            this.enableEditFields(false);
         }
      }
      else this.testSelected = false;
   }

   /***************************************************** MANUAL RETRIEVAL OF STATUS ******************************************************/
   async getStatus(vltp, evmx, evmn, evtg, tsty, qlcd2, qtrs, qlcd, exOp, acOp, orOp): Promise<string> {
      console.log("Checking status: " + vltp + ", " + evmx + ", " + evmn + ", " + evtg + ", " + tsty + ", " + qlcd2 + ", " + qtrs + ", " + qlcd + ", " + exOp + ", " + acOp + ", " + orOp);
      //Quantitative
      var status = "";
      if (tsty == "0" || tsty == "1") {
         if (vltp == "1") {
            if (Number(qtrs) >= Number(evmn) && Number(qtrs) <= Number(evmx)) {
               status = "1";
            }
            else status = "3";
         }
         else if (vltp == "2") {
            //Greater than
            if (orOp == "1") {
               if (acOp == ">") {
                  if (Number(qtrs) >= Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else if (acOp == "=") {
                  if (Number(qtrs) > Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else status = "3";
            }

            //Greater than or equal
            else if (orOp == "2") {
               if (acOp == ">") {
                  if (Number(qtrs) >= Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else if (acOp == "=") {
                  if (Number(qtrs) >= Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else status = "3";
            }

            //Less than
            else if (orOp == "3") {
               if (acOp == "<") {
                  if (Number(qtrs) <= Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else if (acOp == "=") {
                  if (Number(qtrs) < Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else status = "3";
            }
            //Less than or equal
            else if (orOp == "4") {
               if (acOp == "<") {
                  if (Number(qtrs) <= Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else if (acOp == "=") {
                  if (Number(qtrs) <= Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else status = "3";
            }
            //Equal
            else if (orOp == "5") {
               if (acOp == "=") {
                  if (Number(qtrs) == Number(evtg)) {
                     status = "1";
                  }
                  else status = "3";
               }
               else status = "3";
            }
         }

      }
      //Qualitative
      else {
         if (vltp == "0") {
            if (qlcd == qlcd2) {
               return "1";
            }
            else return "3";
         }
      }
      return status;
   }

   /****************************************************** ROW AND EDITORS SETTING ********************************************************/
   /**
    * Sets the columns of the row if can be edited
    * @param iEdit
    */
   enableEditFields(iEdit: boolean) {
      this.qiresGrid.gridOptions.editable = iEdit;
      //this.qiresGrid.updateColumns(newCol, []);
   }

   /**
   * Populates data options for QLCD column depending on TSTY - Standard Testing
   */
   setQLCDEditorOptions(tsty) {
      const qlcd1 = this.qiresOptions.columns.find(column => column.id === 'QLCD1');
      qlcd1.editor = "";
      //Quantitative
      if (tsty == "0" || tsty == "1") {
         const qlcd = this.qiresOptions.columns.find(column => column.id === 'QLCD');
         qlcd.editor = "";
      }
      //Qualitative
      else if (tsty == "2") {
         const qlcd = this.qiresOptions.columns.find(column => column.id === 'QLCD');
         qlcd.editor = Soho.Editors.Lookup;
         qlcd.editorOptions = {
            field: (row: any, _field: any, _grid: any) => {
               return row.QLCD;
            },
            beforeShow: (api: any, response: any): void => {
               this.qmsService.ListQLCD(api, response);
            },
            options: {
               field: 'QLCD',
               selectable: 'single',
               // toolbar: { results: true, keywordFilter: true, fullWidth: false }
            }
         };

         const qop1 = this.qiresOptions.columns.find(column => column.id === 'QOP1');
         qop1.editor = "";
      }
   }

   /**
   * Populates data options for QLCD1 column depending on TSTY - Pallet Wise Testing
   */
   setQLCD1EditorOptions(tsty) {
      const qlcd = this.qiresOptions.columns.find(column => column.id === 'QLCD');
      qlcd.editor = "";
      //Quantitative or Numeric Qualitative
      if (tsty == "0" || tsty == "1") {

         const qlcd1 = this.qiresOptions.columns.find(column => column.id === 'QLCD1');
         qlcd1.editor = "";
      }
      //Qualitative
      else if (tsty == "2") {
         const qlcd = this.qiresOptions.columns.find(column => column.id === 'QLCD1');
         qlcd.editor = Soho.Editors.Lookup;
         qlcd.editorOptions = {
            field: (row: any, _field: any, _grid: any) => {
               return row.QLCD;
            },
            beforeShow: (api: any, response: any): void => {
               this.qmsService.ListQLCD(api, response);
            },
            options: {
               field: 'QLCD',
               selectable: 'single',
               // toolbar: { results: true, keywordFilter: true, fullWidth: false }
            }
         };
         const qop1 = this.qiresOptions.columns.find(column => column.id === 'QOP1');
         qop1.editor = "";
      }
   }

   /**
   * Populates data options for QTRS column depending on TSTY - Standard Testing
   */
   setQTRSEditorOptions(tsty, qtcd) {
      const qtrs1 = this.qiresOptions.columns.find(column => column.id === 'QTRS1');
      qtrs1.editor = "";

      const qtrs = this.qiresOptions.columns.find(column => column.id === 'QTRS');
      //Quantitative
      if (tsty == "0") {
         qtrs.editor = Soho.Editors.Input;
         const qop1 = this.qiresOptions.columns.find(column => column.id === 'QOP1');
         qop1.editor = Soho.Editors.Input;
      }
      //Numeric Qualitative
      else if (tsty == "1") {
         const qtrs = this.qiresOptions.columns.find(column => column.id === 'QTRS');
         qtrs.editor = Soho.Editors.Lookup;
         qtrs.editorOptions = {
            field: (row: any, _field: any, _grid: any) => {
               return row.QTVL;
            },
            beforeShow: (api: any, response: any): void => {
               //Change to logic for Numeric Qualitative
               this.qmsService.ListQTCD(api, response, qtcd);
            },
            options: {
               field: 'QTRS',
               selectable: 'single',

               // toolbar: { results: true, keywordFilter: true, fullWidth: false }
            }
         };
         const qop1 = this.qiresOptions.columns.find(column => column.id === 'QOP1');
         qop1.editor = Soho.Editors.Input;
      }
      //Qualitative
      else {
         qtrs.editor = "";
      }
   }

   /**
   * Populates data options for QTRS column depending on TSTY - Pallet-Wise Testing
   */
   setQTRS1EditorOptions(tsty, qtcd) {
      const qtrs1 = this.qiresOptions.columns.find(column => column.id === 'QTRS');
      qtrs1.editor = "";

      const qtrs = this.qiresOptions.columns.find(column => column.id === 'QTRS1');
      //Quantitative
      if (tsty == "0") {
         qtrs.editor = Soho.Editors.Input;
         const qop1 = this.qiresOptions.columns.find(column => column.id === 'QOP1');
         qop1.editor = Soho.Editors.Input;
      }
      //Numeric Qualitative
      else if (tsty == "1") {
         const qtrs = this.qiresOptions.columns.find(column => column.id === 'QTRS1');
         qtrs.editor = Soho.Editors.Lookup;
         qtrs.editorOptions = {
            field: (row: any, _field: any, _grid: any) => {
               return row.QTVL;
            },
            beforeShow: (api: any, response: any): void => {
               //Change to logic for Numeric Qualitative
               this.qmsService.ListQTCD(api, response, qtcd);
            },
            options: {
               field: 'QTCD',
               selectable: 'single',

               // toolbar: { results: true, keywordFilter: true, fullWidth: false }
            }
         };
         const qop1 = this.qiresOptions.columns.find(column => column.id === 'QOP1');
         qop1.editor = Soho.Editors.Input;
      }
      //Qualitative
      else {
         qtrs.editor = "";
      }
   }

   /**
   * Populates data options for QTRS and QLCD column if Pallet Wise Testing
   */
   setPalletWiseEditorOptions() {
      const qtrs = this.qiresOptions.columns.find(column => column.id === 'QTRS');
      qtrs.editor = "";
      const qlcd = this.qiresOptions.columns.find(column => column.id === 'QLCD');
      qlcd.editor = "";
   }

   /**
   * Disable all value fields when formula-based test selected
   */
   setFormulaEditorOptions() {
      const qtrs = this.qiresOptions.columns.find(column => column.id === 'QTRS');
      qtrs.editor = "";
      const qlcd = this.qiresOptions.columns.find(column => column.id === 'QLCD');
      qlcd.editor = "";
      const qtrs1 = this.qiresOptions.columns.find(column => column.id === 'QTRS1');
      qtrs1.editor = "";
      const qlcd1 = this.qiresOptions.columns.find(column => column.id === 'QLCD1');
      qlcd1.editor = "";
   }

   /********************************************** MANUAL TRIGGER FOR PALLET WISE TESTING *************************************************/
   async palletWise() {
      this.setBusy(true, 'qires');
      //Check if test selected
      var copies = 0;
      if (!this.rowSelected) {
         this.handleError("Please select a test first.");
         this.setBusy(false, 'qires');
      }
      else {
         //Check if pallet wise testing not yet triggered; get pallet count
         var palletCount = await this.qmsService.GetPallet(this.faci, this.bano, this.itemno);
         //Check number of records in test results grid
         var count: number = 0;
         //Loop to check count
         for (let obj of this.qires) {
            if (obj['QTST'] == this.rowData['QTST']) {
               count++;
            }
         }
         if (palletCount == 0) {
            console.log("Number of lot is 0, or API to retrieve lots failed...");
         }
         else if (count >= palletCount) {
            this.handleError("Pallet-wise testing already triggered for selected test: " + this.rowData['QTST'] + ".");
         }
         else {
            //If Pallet-Wise Testing not yet selected for other tests, add all existing tests
            var XtendM3tests = await this.qmsService.ListXtendTestResults(this.company, this.faci, this.qrid, this.itemno, this.bano);
            if (XtendM3tests.length == 0) {
               //Add already existing tests to XtendM3
               for (let obj of this.qires) {
                  var isOK;
                  if (obj['QTST'] == this.rowData['QTST']) {
                     isOK = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, obj['QTST'], obj['TSTY'], obj['TSEQ'], obj['QOP12'], this.itemno, this.bano, "", obj['SI01'], obj['TTDT'], obj['QTRS'], obj['QLCD'], obj['TSTT'], obj['EXSQ'], obj['EVMX'], obj['EVMN'], obj['EVTG'], obj['SPEC'], obj['QSE1'], obj['QSE2'], obj['QTE1'], obj['QTE2'], obj['VLTP'], obj['TCAL'], obj['FMID'], obj['QTCD'], obj['QLCD2'], "1");
                  }
                  else isOK = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, obj['QTST'], obj['TSTY'], obj['TSEQ'], obj['QOP12'], this.itemno, this.bano, "", obj['SI01'], obj['TTDT'], obj['QTRS'], obj['QLCD'], obj['TSTT'], obj['EXSQ'], obj['EVMX'], obj['EVMN'], obj['EVTG'], obj['SPEC'], obj['QSE1'], obj['QSE2'], obj['QTE1'], obj['QTE2'], obj['VLTP'], obj['TCAL'], obj['FMID'], obj['QTCD'], obj['QLCD2'], "0");
                  if (!isOK) {
                     this.handleError("Existing test " + obj['QTST'] + " sequence " + obj['TSEQ'] + " has not been added to the XtendM3 table. Check console for errors.");
                  }
               }
            }

            //Already existing in XtendM3, update PALL
            else {
               var count = 0;
               for (let obj of XtendM3tests) {
                  if (obj['QTST'] == this.rowData['QTST']) {
                     count++;
                     var isUpdate = await this.qmsService.UpdXtendTestResult(this.company, this.faci, this.qrid, this.itemno, this.rowData['QTST'], this.rowData['TSTY'], count, "", "", "", "", "", "", "1", "");
                  }
               }
            }

            //Calculate number of copies to be added (number of pallets - number of existing tests)
            copies = palletCount - count;
            //Copy test
            var ind = count + 1;
            var testCount = 0;
            var passCount = 0;
            for (var i = 0; i < copies; i++) {
               var isOK;
               testCount++;
               isOK = await this.qmsService.AddXtendTestResult(this.company, this.faci, this.qrid, this.rowData['QTST'], this.rowData['TSTY'], ind, this.rowData['QOP12'], this.itemno, this.bano, "", "", "", "", "", "", this.rowData['EXSQ'], this.rowData['EVMX'], this.rowData['EVMN'], this.rowData['EVTG'], this.rowData['SPEC'], this.rowData['QSE1'], this.rowData['QSE2'], this.rowData['QTE1'], this.rowData['QTE2'], this.rowData['VLTP'], this.rowData['TCAL'], this.rowData['FMID'], this.rowData['QTCD'], this.rowData['QLCD2'], "1");
               if (isOK) {
                  passCount++;
               }
               ind++;
            }
            if (passCount != testCount) {
               this.handleError("One or more tests have not been added to the XtendM3 table.");
            }
            //Reload grid
            this.palletwiseFlag = true;
            await this.setQIResult(this.faci, this.qrid, this.itemno, this.bano);
         }
      }
      this.setBusy(false, 'qires');
   }

   /******************************************* GRID OPTION CHANGE (STANDARD OR PALLET WISE) **********************************************/
   async setOptionsPallet() {
      this.qiresGrid.dataset = [];
      this.qiresOptions = {
         selectable: 'single' as SohoDataGridSelectable,
         //: "multiple" as SohoDataGridSelectable,
         //disableRowDeactivation: true,
         clickToSelect: true,
         alternateRowShading: false,
         cellNavigation: false,
         filterable: true,
         paging: false,
         editable: true,
         pagesize: 1000,
         //indeterminate: false,
         rowHeight: 'extra-small',
         columns: [
            { field: 'QTST', id: 'QTST', name: 'Test', filterType: 'text', sortable: false, resizable: true, width: '3' },
            { field: 'TSEQ', id: 'TSEQ', name: 'Sno', filterType: 'text', sortable: false, resizable: true, width: '1.5' },
            { field: 'QOP1', id: 'QOP1', name: 'Op', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '1' },
            { field: 'QTRS', id: 'QTRS', name: 'Test result val', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '4', },
            { field: 'QLCD', id: 'QLCD', name: 'Test result val', editor: Soho.Editors.Lookup, sortable: false, resizable: true, width: '5', },
            { field: 'TTDT', id: 'TTDT', name: 'Tstdt', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '2.5' },
            { field: 'QOP12', id: 'QOP12', name: 'Ex', sortable: false, resizable: true, width: '1' },
            { field: 'EVMX', id: 'EVMX', name: 'Expected Max', sortable: false, resizable: true, width: '4.5' },
            { field: 'EVTG', id: 'EVTG', name: 'Target Value', sortable: false, resizable: true, width: '4.5' },
            //{ field: 'QSTD', id: 'QSTD', name: 'Standing', sortable: true, resizable: true, width: '5' },
            { field: 'EVMN', id: 'EVMN', name: 'Expected Min', sortable: false, resizable: true, width: '4.5' },
            { field: 'EXSQ', id: 'EXSQ', name: 'Ord', sortable: false, resizable: true, width: '1.5' },
            { field: 'TSTT', id: 'TSTT', name: 'Sts', sortable: false, resizable: true, width: '3' },
            { field: 'ITNO', id: 'ITNO', name: 'Item Number', sortable: false, resizable: true, width: '5' },
            { field: 'SI01', id: 'SI01', name: 'Comments', sortable: false, resizable: true, width: '6.5', editor: Soho.Editors.Textarea, maxLength: 50 },
            { field: 'SPEC', id: 'SPEC', name: 'Specification', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'TSTY', id: 'TSTY', name: 'TestType', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QSE1', id: 'QSE1', name: 'SDate', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QTE1', id: 'QTE1', name: 'TDate', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QSE2', id: 'QSE2', name: 'STime', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QTE2', id: 'QTE2', name: 'TTime', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'TCAL', id: 'TCAL', name: 'Calc', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'VLTP', id: 'VLTP', name: 'Val Setup', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'FMID', id: 'FMID', name: 'Formula', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QLCD2', id: 'QLCD2', name: 'ExpQual', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QTCD', id: 'QTCD', name: 'NumQual', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'origQOP1', id: 'origQOP1', name: 'OrigOp', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QTRS1', id: 'QTRS1', name: 'Quantitative Retest val', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '4' },
            { field: 'QLCD1', id: 'QLCD1', name: 'Qualitative Retest val', editor: Soho.Editors.Lookup, sortable: false, resizable: true, width: '5' },
         ],
         dataset: [],
         emptyMessage: {
            title: 'No selected QI Request',
            icon: 'icon-empty-no-data'
         }
      };
   }

   async setOptionsStandard() {
      this.qiresGrid.dataset = [];
      this.qiresOptions = {
         selectable: 'single' as SohoDataGridSelectable,
         //disableRowDeactivation: true,
         clickToSelect: true,
         alternateRowShading: false,
         cellNavigation: false,
         filterable: true,
         paging: false,
         editable: true,
         pagesize: 1000,
         //indeterminate: false,
         rowHeight: 'extra-small',
         columns: [
            { field: 'QTST', id: 'QTST', name: 'Test', filterType: 'text', sortable: false, resizable: true, maxWidth: 3 },
            { field: 'TSEQ', id: 'TSEQ', name: 'Sno', filterType: 'text', sortable: false, resizable: true, maxWidth: 1.5 },
            { field: 'QOP1', id: 'QOP1', name: 'Op', editor: Soho.Editors.Input, sortable: false, resizable: true, maxWidth: 1 },
            { field: 'QTRS', id: 'QTRS', name: 'Test result val', editor: Soho.Editors.Input, sortable: false, resizable: true, maxWidth: 4 },
            { field: 'QLCD', id: 'QLCD', name: 'Test result val', editor: Soho.Editors.Lookup, sortable: false, resizable: true, maxWidth: 5 },
            { field: 'TTDT', id: 'TTDT', name: 'Tstdt', editor: Soho.Editors.Input, sortable: false, resizable: true, maxWidth: 2.5 },
            { field: 'QOP12', id: 'QOP12', name: 'Ex', sortable: false, resizable: true, maxWidth: 1 },
            { field: 'EVMX', id: 'EVMX', name: 'Expected Max', sortable: false, resizable: true, maxWidth: 4.5 },
            { field: 'EVTG', id: 'EVTG', name: 'Target Value', sortable: false, resizable: true, maxWidth: 4.5 },
            //{ field: 'QSTD', id: 'QSTD', name: 'Standing', sortable: true, resizable: true, width: 5 },
            { field: 'EVMN', id: 'EVMN', name: 'Expected Min', sortable: false, resizable: true, maxWidth: 4.5 },
            { field: 'EXSQ', id: 'EXSQ', name: 'Ord', sortable: false, resizable: true, maxWidth: 1.5 },
            { field: 'TSTT', id: 'TSTT', name: 'Sts', sortable: false, resizable: true, maxWidth: 3 },
            { field: 'ITNO', id: 'ITNO', name: 'Item Number', sortable: false, resizable: true, maxWidth: 5 },
            { field: 'SI01', id: 'SI01', name: 'Comments', sortable: false, resizable: true, maxWidth: 6.5, editor: Soho.Editors.Textarea, maxLength: 50 },
            { field: 'SPEC', id: 'SPEC', name: 'Specification', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'TSTY', id: 'TSTY', name: 'TestType', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'QSE1', id: 'QSE1', name: 'SDate', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'QTE1', id: 'QTE1', name: 'TDate', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'QSE2', id: 'QSE2', name: 'STime', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'QTE2', id: 'QTE2', name: 'TTime', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'TCAL', id: 'TCAL', name: 'Calc', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'VLTP', id: 'VLTP', name: 'Val Setup', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'FMID', id: 'FMID', name: 'Formula', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'QLCD2', id: 'QLCD2', name: 'ExpQual', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'QTCD', id: 'QTCD', name: 'NumQual', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'origQOP1', id: 'origQOP1', name: 'OrigOp', sortable: false, resizable: true, maxWidth: 1, hidden: true },
            { field: 'QTRS1', id: 'QTRS1', name: 'Quantitative Retest val', editor: Soho.Editors.Input, sortable: false, resizable: true, maxWidth: 4, hidden: true },
            { field: 'QLCD1', id: 'QLCD1', name: 'Qualitative Retest val', editor: Soho.Editors.Lookup, sortable: false, resizable: true, maxWidth: 5, hidden: true },
         ],
         dataset: [],
         emptyMessage: {
            title: 'No selected QI Request',
            icon: 'icon-empty-no-data'
         }
      };
   }

   /********************************************************** RECLASS MODAL **************************************************************/
   openModal() {
      const dialogRef = this.modalService
         .modal<NestedModalDialogComponent>(NestedModalDialogComponent, this.placeholder)
         .buttons(
            [{
               text: 'Cancel', click: () => {
                  dialogRef.close();
               }
            },
            {
               text: 'Submit', click: async () => {
                  var itemno = this.qmsService.itemno;
                  var nitemno = this.qmsService.nitemno;
                  var lotno = this.qmsService.lotno;
                  if (itemno == "" || nitemno == "" || lotno == "") {
                     this.handleError("Please provide an input for all fields.");
                  }
                  var isSame = await this.qmsService.CheckProductGroup(itemno, nitemno);
                  if (isSame) {
                     //Proceed with reclassification
                     //Get QRID for specified lot number and item number
                     this.qridset = await this.qmsService.ListQIRequest("", "", itemno, lotno);
                     var qridReclass = "";
                     var faciReclass = "";
                     if (this.qridset != "") {
                        for (let qireq of this.qridset) {
                           qridReclass = qireq['QRID'];
                           faciReclass = qireq['FACI'];
                        }
                        //Get quality test id for newly reclassified item then call QMS450 to copy from old test to new test id
                        var pass = await this.qmsService.reclass(this.company, itemno, lotno, nitemno, qridReclass, faciReclass);
                        if (pass) {
                           this.showSuccess("Reclassification successful.");
                           dialogRef.close();
                        }
                        else this.handleError("Reclassification not successful.");
                     }
                     else {
                        this.handleError("A QI request with these values does not exist.");
                     }
                  }
                  else {
                     this.handleError("Target item belongs to different product group.");
                  }
               }, isDefault: true
            }])
         .title("Balance ID - Reclassification")
         .frameWidth(600)
         .open()
         .afterClose((result: any) => {
            this.closeResult = result;
         });
   }

   /***************************************************** GRADE ITEM RETRIEVAL ************************************************************/
   async retrieveProposal() {
      this.setBusy(true, 'qires');
      this.setBusy(true, 'qrid');
      var pSpecTest, sSpecTest, cSpecTest;
      var pPassed: boolean = true;
      var sPassed: boolean = true;
      var cPassed: boolean = true;
      var pVLTP, pEVMX, pEVMN, pEVTG, pQOP1, pQSE1, pQLCD;
      var sVLTP, sEVMX, sEVMN, sEVTG, sQOP1, sQSE1, sQLCD;
      var cVLTP, cEVMX, cEVMN, cEVTG, cQOP1, cQSE1, cQLCD;
      var itno = this.itemno;
      var baseItno = itno.substring(0, itno.length - 1);
      var sSpec: any = [];
      var cSpec: any = [];
      var pSpec: any = [];
      var spec = this.qires[0].SPEC;
      const testMap = new Map<string, boolean>();
      console.log("Spec is " + spec);
      if (spec == "Premium") {
         //Retrieve from QMS200 Specification Standard B
         sSpec = await this.qmsService.ListSpec("Standard", baseItno + "B", this.dateToday);
         for (let det of sSpec) {
            sQSE1 = det['QSE1'];
         }
         sSpecTest = await this.qmsService.LstSpecTest("Standard", sQSE1, baseItno + "B");

         //If Lactoferrin, standard grade C exists
         if (baseItno == "LF001-04-001") {
            //Retrieve from QMS200 Specification Standard C
            sSpec = await this.qmsService.ListSpec("Standard", baseItno + "C", this.dateToday);
            for (let det of sSpec) {
               sQSE1 = det['QSE1'];
            }
            sSpecTest = await this.qmsService.LstSpecTest("Standard", sQSE1, baseItno + "C");
         }
      }
      if (spec == "Standard") {
         //Retrieve from QMS200 Specification Premium
         pSpec = await this.qmsService.ListSpec("Premium", baseItno + "A", this.dateToday);
         for (let det of pSpec) {
            pQSE1 = det['QSE1'];
         }
         pSpecTest = await this.qmsService.LstSpecTest("Premium", pQSE1, baseItno + "A");
      }
      //No checks needed for downgrade, if all fails, propose downgrade automatically

      //Grade retrieval for pallet wise
      if (this.palletwiseFlag) {

         //Initialize arrays for pallet proposals, one for each item grade
         var testResults: any[] = [];
         var prevTest = ""; //Checker if test is same as current to skip if already processed

         //Get all tests for the selected request and store into array
         for (let obj of this.qires) {
            if (testResults.indexOf(obj['QTST']) == -1) {
               testResults.push(obj['QTST']);
            }
         }

         //Loop per pallet
         this.palletCount = await this.qmsService.GetPallet(this.faci, this.bano, this.itemno);
         for (var i = 1; i < Number(this.palletCount) + 1; i++) {
            console.log("Retrieve proposal: Pallet " + i);
            //Check if all test passed for pallet. If yes, no change. Else, check with other specifications
            var isPassed = true;
            sPassed = true;
            pPassed = true;


            //Check if all tests for pallet are passed
            for (let obj of testResults) {
               var noTest = 0;
               for (let obj1 of this.qires) {
                  if (obj1['QTST'] == obj) {
                     noTest++;
                  }
               }
               console.log("no tests is " + noTest);
               if (noTest == this.palletCount) {
                  console.log(obj + " is palletwise");
                  for (let obj1 of this.qires) {
                     if (obj1['QTST'] == obj && obj1['TSEQ'] == i) {
                        var tstt = obj1['TSTT'];
                        console.log("tstt " + tstt);
                        if (tstt != "1-Passed") {
                           isPassed = false;
                        }
                     }
                  }
               }
               else {
                  console.log(obj + " is standard");
                  for (let obj1 of this.qires) {
                     if (obj1['QTST'] == obj && obj1['TSEQ'] == noTest) {
                        var tstt = obj1['TSTT'];
                        console.log("tstt " + tstt);
                        if (tstt != "1-Passed") {
                           isPassed = false;
                        }
                     }
                  }
               }
            }
            if (isPassed) {
               console.log("Tests for pallet have all passed.");
            }
            if (isPassed && spec == "Premium") {
               console.log("Spec is premium and all tests passed for pallet " + i + ".");
               this.noProposal.push(i);
               this.allProposals.push({ "PALL": i, "PROP": "No Change", "ITNO": "" });
            }
            else {
               for (let obj of testResults) {
                  console.log("Retrieve proposal: Test " + obj);
                  var testSeq;

                  //Add checker if current test is pallet wise
                  var noTest = 0;
                  for (let obj1 of this.qires) {
                     if (obj1['QTST'] == obj) {
                        noTest++;
                     }
                  }

                  if (noTest == this.palletCount) {
                     testSeq = i;
                     console.log("Retrieve proposal: Pallet wise");
                     testMap.set(obj, true);
                  }
                  else {
                     testSeq = noTest;
                     console.log("Retrieve proposal: Standard");
                     testMap.set(obj, false);
                  }

                  for (let obj1 of this.qires) {
                     if (obj1['QTST'] == obj && obj1['TSEQ'] == testSeq) {
                        var qtst = obj1['QTST'];
                        var tsty = obj1['TSTY'];
                        var tseq = obj1['TSEQ'];
                        var qtrs: any = "";
                        var qlcd: any = "";
                        if (noTest == this.palletCount) {
                           qtrs = obj1['QTRS1'];
                           qlcd = obj1['QLCD1'];
                        }
                        else {
                           qtrs = obj1['QTRS'];
                           qlcd = obj1['QLCD'];
                        }
                        var spec = obj1['SPEC'];
                        var actualOp = obj1['QOP1'];
                        if (spec == "Premium") {
                           //Check with Standard
                           console.log("Testing against Standard B...");
                           for (let det of sSpecTest) {
                              if (det['QTST'] == qtst && det['TSTY'] == tsty) {
                                 sVLTP = det['VLTP'];
                                 sEVMX = det['EVMX'];
                                 sEVMN = det['EVMN'];
                                 sEVTG = det['EVTG'];
                                 sQOP1 = det['QOP1'];
                                 sQLCD = det['QLCD'];
                                 if (tsty == "0" || tsty == "1") {
                                    var passed = await this.compareQTRS(qtrs, actualOp, sVLTP, sQOP1, sEVTG, sEVMN, sEVMX);
                                    if (passed) {
                                       console.log(qtst + " passed");
                                    }
                                    else {
                                       sPassed = false;
                                       console.log(qtst + " failed");
                                    }
                                 }
                                 else {
                                    var passed = await this.compareQLCD(qlcd, sVLTP, sQLCD);
                                    if (passed) {
                                       console.log(qtst + " passed");
                                    }
                                    else {
                                       sPassed = false;
                                       console.log(qtst + " failed");
                                    }
                                 }
                              }
                           }
                           if (baseItno == "LF001-04-001") {
                              console.log("Testing against Standard C...");
                              for (let det of cSpecTest) {
                                 if (det['QTST'] == qtst && det['TSTY'] == tsty) {
                                    cVLTP = det['VLTP'];
                                    cEVMX = det['EVMX'];
                                    cEVMN = det['EVMN'];
                                    cEVTG = det['EVTG'];
                                    cQOP1 = det['QOP1'];
                                    cQLCD = det['QLCD'];
                                    if (tsty == "0" || tsty == "1") {
                                       var passed = await this.compareQTRS(qtrs, actualOp, cVLTP, cQOP1, cEVTG, cEVMN, cEVMX);
                                       if (passed) {
                                          console.log(qtst + " passed");
                                       }
                                       else {
                                          cPassed = false;
                                          console.log(qtst + " failed");
                                       }
                                    }
                                    else {
                                       var passed = await this.compareQLCD(qlcd, cVLTP, cQLCD);
                                       if (passed) {
                                          console.log(qtst + " passed");
                                       }
                                       else {
                                          cPassed = false;
                                          console.log(qtst + " failed");
                                       }
                                    }
                                 }
                              }
                           }
                        }

                        else if (spec == "Standard") {
                           if (isPassed) {
                              console.log("Testing against Premium...");
                              //Check with Premium
                              for (let det of pSpecTest) {
                                 if (det['QTST'] == qtst && det['TSTY'] == tsty) {
                                    pVLTP = det['VLTP'];
                                    pEVMX = det['EVMX'];
                                    pEVMN = det['EVMN'];
                                    pEVTG = det['EVTG'];
                                    pQOP1 = det['QOP1'];
                                    pQLCD = det['QLCD'];
                                    if (tsty == "0" || tsty == "1") {
                                       var passed = await this.compareQTRS(qtrs, actualOp, pVLTP, pQOP1, pEVTG, pEVMN, pEVMX);
                                       if (passed) {
                                          console.log(qtst + " passed");
                                       }
                                       else {
                                          pPassed = false;
                                          console.log(qtst + " failed");
                                       }
                                    }
                                    else {
                                       var passed = await this.compareQLCD(qlcd, pVLTP, pQLCD);
                                       if (passed) {
                                          console.log(qtst + " passed");
                                       }
                                       else {
                                          pPassed = false;
                                          console.log(qtst + " failed");
                                       }
                                    }
                                 }
                              }
                           }
                        }
                     }
                  }
               }
            }


            //Check after all tests for pallet have been checked
            if (spec == "Premium") {
               if (sPassed) {
                  this.proposeStandard.push(i);
                  this.allProposals.push({ "PALL": i, "PROP": "Standard", "ITNO": baseItno + "B" });
               }
               else {
                  if (baseItno == "LF001-04-001") {
                     if (cPassed) {
                        this.proposeStandardC.push(i);
                        this.allProposals.push({ "PALL": i, "PROP": "Standard", "ITNO": baseItno + "C" });
                     }
                     else {
                        this.proposeDowngrade.push(i);
                        this.allProposals.push({ "PALL": i, "PROP": "Downgrade", "ITNO": baseItno + "D" });
                     }
                  }
                  else {
                     this.proposeDowngrade.push(i);
                     this.allProposals.push({ "PALL": i, "PROP": "Downgrade", "ITNO": baseItno + "D" });
                  }
               }
            }

            else if (spec == "Standard") {
               if (isPassed) {
                  if (pPassed) {
                     //20250709 No upgrade will be performed ever
                     //this.proposePremium.push(i);
                     //this.allProposals.push({ "PALL": i, "PROP": "Premium", "ITNO": baseItno + "A" });
                     this.noProposal.push(i);
                     this.allProposals.push({ "PALL": i, "PROP": "No Change", "ITNO": "" });
                  }
                  else {
                     this.noProposal.push(i);
                     this.allProposals.push({ "PALL": i, "PROP": "No Change", "ITNO": "" });
                  }
               }
               else {
                  this.proposeDowngrade.push(i);
                  this.allProposals.push({ "PALL": i, "PROP": "Downgrade", "ITNO": baseItno + "D" });
               }
            }
            else {
               this.noProposal.push(i);
               this.allProposals.push({ "PALL": i, "PROP": "No Change", "ITNO": "" });
            }
         }
         this.qmsService.proposals = this.allProposals;
         //Open modal for selection of grade report
         console.log("Premium " + JSON.stringify(this.proposePremium));
         console.log("Standard " + JSON.stringify(this.proposeStandard));
         console.log("Standard C" + JSON.stringify(this.proposeStandard));
         console.log("Downgrade " + JSON.stringify(this.proposeDowngrade));
         console.log("No change " + JSON.stringify(this.noProposal));
         this.qmsService.proposedP = JSON.stringify(this.proposePremium);
         this.qmsService.proposedS = JSON.stringify(this.proposeStandard);
         this.qmsService.proposedC = JSON.stringify(this.proposeStandardC);
         this.qmsService.proposedD = JSON.stringify(this.proposeDowngrade);
         this.qmsService.proposedN = JSON.stringify(this.noProposal);
         this.openGradeModalPallet(baseItno, testMap);
      }


      //Grade retrieval for standard
      else {
         //Check if all test passed. If yes, no change. Else, check with other specifications
         var isPassed = true;
         for (let res of this.qires) {
            //Retrieve from test result grid; check per test
            var tstt = res['TSTT'];
            if (tstt != "1-Passed") {
               isPassed = false;
            }
         }
         if (isPassed && spec == "Premium") {
            this.reportGradeFlag = false;
            this.qmsService.proposedGrade = "NoChange";
            this.qmsService.proposedMsg = "No change required";
            this.openGradeModal(baseItno);
         }
         else {
            for (let obj of this.qires) {
               //Retrieve from test result grid; check per test
               var qtst = obj['QTST'];
               var tsty = obj['TSTY'];
               var tseq = obj['TSEQ'];
               var qtrs = obj['QTRS'];
               var spec = obj['SPEC'];
               var qlcd = obj['QLCD'];
               var actualOp = obj['QOP1'];

               //Add checker - if first sequence, and only two sequences, only test second sequence
               var noTest = 0;
               for (let obj1 of this.qires) {
                  if (obj1['QTST'] == obj['QTST']) {
                     noTest++;
                  }
               }

               if (noTest == 2 && tseq == 1) {
                  console.log("Skipping first sequence in testing...")
               }
               else {
                  if (spec == "Premium") {
                     //Check with Standard
                     console.log("Testing against Standard...");
                     for (let det of sSpecTest) {
                        if (det['QTST'] == qtst && det['TSTY'] == tsty) {
                           sVLTP = det['VLTP'];
                           sEVMX = det['EVMX'];
                           sEVMN = det['EVMN'];
                           sEVTG = det['EVTG'];
                           sQOP1 = det['QOP1'];
                           sQLCD = det['QLCD'];
                           if (tsty == "0" || tsty == "1") {
                              var passed = await this.compareQTRS(qtrs, actualOp, sVLTP, sQOP1, sEVTG, sEVMN, sEVMX);
                              if (passed) {
                                 console.log(qtst + " passed");
                              }
                              else {
                                 sPassed = false;
                                 console.log(qtst + " failed");
                              }
                           }
                           else {
                              var passed = await this.compareQLCD(qlcd, sVLTP, sQLCD);
                              if (passed) {
                                 console.log(qtst + " passed");
                              }
                              else {
                                 sPassed = false;
                                 console.log(qtst + " failed");
                              }
                           }
                        }
                     }
                     if (sPassed) {
                        this.qmsService.proposedGrade = "Standard";
                        this.qmsService.proposedMsg = "Item grade proposed specification: Standard";
                        this.reportGradeFlag = true;
                     }
                     else {
                        this.qmsService.proposedGrade = "Downgrade";
                        this.qmsService.proposedMsg = "Item grade proposed specification: Downgrade";
                        this.reportGradeFlag = true;
                     }
                  }

                  else if (spec == "Standard") {
                     if (isPassed) {
                        console.log("Testing against Premium...");
                        //Check with Premium
                        for (let det of pSpecTest) {
                           if (det['QTST'] == qtst && det['TSTY'] == tsty) {
                              pVLTP = det['VLTP'];
                              pEVMX = det['EVMX'];
                              pEVMN = det['EVMN'];
                              pEVTG = det['EVTG'];
                              pQOP1 = det['QOP1'];
                              pQLCD = det['QLCD'];
                              if (tsty == "0" || tsty == "1") {
                                 var passed = await this.compareQTRS(qtrs, actualOp, pVLTP, pQOP1, pEVTG, pEVMN, pEVMX);
                                 if (passed) {
                                    console.log(qtst + " passed");
                                 }
                                 else {
                                    pPassed = false;
                                    console.log(qtst + " failed");
                                 }
                              }
                              else {
                                 var passed = await this.compareQLCD(qlcd, pVLTP, pQLCD);
                                 if (passed) {
                                    console.log(qtst + " passed");
                                 }
                                 else {
                                    pPassed = false;
                                    console.log(qtst + " failed");
                                 }
                              }
                           }
                        }
                        if (pPassed) {
                           this.qmsService.proposedGrade = "Premium";
                           this.qmsService.proposedMsg = "Item grade proposed specification: Premium";
                           this.reportGradeFlag = true;
                        }
                        else {
                           this.reportGradeFlag = false;
                           this.qmsService.proposedGrade = "NoChange";
                           this.qmsService.proposedMsg = "No change required";
                        }
                     }
                     else {
                        this.qmsService.proposedGrade = "Downgrade";
                        this.qmsService.proposedMsg = "Item grade proposed specification: Downgrade";
                        this.reportGradeFlag = true;
                     }
                  }
                  //Downgrade
                  else {
                     this.reportGradeFlag = false;
                     this.qmsService.proposedGrade = "NoChange";
                     this.qmsService.proposedMsg = "Item grade is Downgrade, no change required.";
                  }
               }
            }

            this.openGradeModal(baseItno);
         }
      }
      this.setBusy(false, 'qires');
      this.setBusy(false, 'qrid');
   }

   compareQLCD(qlcd, vltp, qlcd2): boolean {
      var isPass: boolean = false;
      if (vltp == "0") {
         if (qlcd == qlcd2) {
            isPass = true;
         }
         else isPass = false;
      }
      return isPass;
   }

   compareQTRS(qtrs, acOp, vltp, qop1, evtg, evmn, evmx): boolean {
      var isPass: boolean = false;
      console.log("Grade Check: " + qtrs + ", vltp: " + vltp + ", qop1:" + qop1 + ", evtg/evmx/evmn:" + evtg + "/" + evmx + "/" + evmn);
      if (vltp == "1") {
         if (Number(evmx) >= Number(qtrs) && Number(qtrs) >= Number(evmn)) {
            isPass = true;
         }
         else isPass = false;
      }
      else if (vltp == "2") {
         //Greater than
         if (qop1 == "1") {
            if (acOp == ">") {
               if (Number(qtrs) >= Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else if (acOp == "=") {
               if (Number(qtrs) > Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else isPass = false;
         }

         //Greater than or equal
         else if (qop1 == "2") {
            if (acOp == ">") {
               if (Number(qtrs) >= Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else if (acOp == "=") {
               if (Number(qtrs) >= Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else isPass = false;
         }

         //Less than
         else if (qop1 == "3") {
            if (acOp == "<") {
               if (Number(qtrs) <= Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else if (acOp == "=") {
               if (Number(qtrs) < Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else isPass = false;
         }
         //Less than or equal
         else if (qop1 == "4") {
            if (acOp == "<") {
               if (Number(qtrs) <= Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else if (acOp == "=") {
               if (Number(qtrs) <= Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else isPass = false;
         }
         //Equal
         else if (qop1 == "5") {
            if (acOp == "=") {
               if (Number(qtrs) == Number(evtg)) {
                  isPass = true;
               }
               else isPass = false;
            }
            else isPass = false;
         }

      }
      return isPass;
   }

   /****************************************************** FORMULA BASED MFA LOGIC *******************************************************/
   async onClickRunAutomationButton() {
      //LAC test only
      var testCount = 0;
      var OBJ1;
      var FAC2 = await this.qmsService.ListFormula("LAC");
      for (let obj of FAC2) {
         testCount++;
         OBJ1 = obj['QDOBJ1'];
      }
      var i;
      this.uri = "<%3fxml+version=\"1.0\"+encoding=\"utf-8\"%3f><sequence>";
      this.AddStep("RUN", "CRS570");
      this.AddField("W1FMID", "LAC");
      this.AddStep("KEY", "F5");
      this.AddStep("LSTOPT", "13");

      this.AddField("R2C12", "1");
      this.AddField("R3C12", "1");
      this.AddField("R4C12", "1");

      if (OBJ1 == "1") {
         console.log("OBJ1 is 1");
         for (i = 1; i < testCount + 1; i++) {
            var fieldID = "R" + (i) + "C12";
            //var test = FAC2[i - 1]['QDFAC2'];
            //console.log("Filling in for " + test);
            this.AddField(fieldID, "5");
            this.AddStep("KEY", "ENTER");
         }
      }
      this.AddStep("KEY", "F5");
      //this.AddStep("KEY", "F3");
      //this.AddStep("KEY", "F3");

      this.EncodeURI();
      this.uri = "mforms://_automation?data=" + this.uri;
      this.appService.launch(this.uri);

      setTimeout(() => {
         //Code to execute after the delay
         console.log('This message appears after 3 seconds');
         console.log("localStorage " + localStorage.getItem('QMS'));
      }, 3000); // 3000 milliseconds = 3 seconds

      //localStorage.setItem('dataSource', this.dataSource.length);
   }

   private AddStep(command: string, value: string): void {
      const stepModel = "<step+command=\"" + command + "\"+value=\"" + value + "\"+/>";
      this.uri = this.uri + stepModel;
   };

   private AddField(field: string, value: string): void {
      this.uri = this.uri + "<step+command=\"" + "AUTOSET" + "\"+/>";

      const length = this.uri.length;
      const fieldModel = "<field+name=\"" + field + "\">" + value + "</field>";

      if (this.uri.substring(length - 2, length) == "/>") {
         this.uri = this.uri.substring(0, length - 3)
            + ">"
            + fieldModel
            + "</step>";
      } else {
         this.uri = this.uri.substring(0, length - 7)
            + fieldModel
            + "</step>";
      }
   }

   private EncodeURI(): void {
      this.uri = this.uri + "</sequence>";

      this.ReplaceAll("<", "%3c");
      this.ReplaceAll(">", "%3e");
      this.ReplaceAll("=", "%3d");
      this.ReplaceAll("\"", "%22");
      this.ReplaceAll("/", "%2f");
   }

   private ReplaceAll(search: string, replacement: string): void {
      this.uri = this.uri.replace(new RegExp(search, 'g'), replacement);
   }

   /****************************************************** PERFORM ITEM CHANGE ************************************************************/
   async reportProposal() {
      var res = await this.qmsService.GetQSTA(this.faci, this.qrid);
      const arr = res.split("_");
      console.log("QAPR: " + arr[1] + " QSTA: " + arr[0]);
      //Check QAPR; If 1 (Approved) or , call putaway
      if (arr[1] == "1" || arr[1] == "2") {
         var isOK = await this.qmsService.itemPutAway(this.company, this.itemno, this.bano, arr[1]);
         if (isOK) {
            this.showSuccess("Item putaway is successful.");
         }
         else {
            this.handleError("Item putaway failed.");
         }
      }
      //Check QSTA; If 3, enable buttons
      if (arr[0] == "3") {
         this.approvedFlag = true;
      }
      else this.approvedFlag = false;

      if (this.reportGradeFlag) {
         //Report grade for pallet wise
         if (this.palletwiseFlag) {
            //Show modal for selection of pallet/s to report
            this.openReportGradeModal();
         }
         else {
            var pass = await this.qmsService.reportGrade(this.company, this.itemno, this.bano, this.nitemno, this.qrid, this.faci);
            if (pass) {
               this.showSuccess("Report grade item successful.")
            }
            else this.handleError("Report grade item not successful.");
         }
      }
   }

   /************************************************* GRADE CHANGE MODAL - CONFIRMATION ***************************************************/
   openGradeModal(baseItno) {
      const dialogRef = this.modalService
         .modal<GradeModalDialogComponent>(GradeModalDialogComponent, this.placeholder)
         .buttons(
            [{
               text: 'Cancel', click: () => {
                  this.reportGradeFlag = false;
                  dialogRef.close();
               }
            },
            {
               text: 'OK', click: async () => {
                  //Update row Item Numbers
                  if (this.qmsService.proposedGrade != "NoChange") {
                     if (this.qmsService.proposedGrade == "Premium") {
                        var newItem = baseItno + "A";
                     }
                     else if (this.qmsService.proposedGrade == "Standard") {
                        var newItem = baseItno + "B";
                     }
                     else if (this.qmsService.proposedGrade == "Downgrade") {
                        var newItem = baseItno + "D";
                     }


                     await this.setOptionsStandard();
                     this.nitemno = newItem;
                     var index = 0;
                     for (let row of this.qires) {
                        console.log("current row " + JSON.stringify(row) + " qtst:" + row['QTST']);
                        row['ITNO'] = "TEST";
                        this.qiresGrid.updateRow(index, row);
                        index++;
                     }
                     this.reportGradeFlag = true;

                  }
                  else {
                     this.nitemno = "";
                     console.log("No change for grade...");
                  }
                  dialogRef.close();
                  //dialogRef.close();
               }, isDefault: true
            }])
         .title("Retrieve Grade Item")
         .open()
         .afterClose((result: any) => {
            this.closeResult = result;
         });
   }

   openGradeModalPallet(baseItno, testMap, standardType?) {
      const dialogRef = this.modalService
         .modal<GradeModalPalletDialogComponent>(GradeModalPalletDialogComponent, this.placeholder)
         .buttons(
            [{
               text: 'Cancel', click: () => {
                  this.reportGradeFlag = false;
                  dialogRef.close();
               }
            },
            {
               text: 'OK', click: async () => {
                  //Update row Item Numbers
                  var newItemP = baseItno + "A";
                  //Standard needs additional check if B or C
                  var newItemS = baseItno + "B";
                  var newItemC = baseItno + "C";
                  var newItemD = baseItno + "D";
                  for (var i = 1; i < Number(this.palletCount) + 1; i++) {
                     console.log("Setting for pallet " + i);
                     var ind = 0;
                     for (let obj of this.qires) {
                        var seq = obj['TSEQ'];
                        console.log("current test is " + obj['QTST'] + " seq " + seq);
                        var isPalletFlag = testMap.get(obj['QTST']);
                        if (isPalletFlag) {
                           console.log("Pallet wise: true");
                           if (seq == i) {
                              if (this.proposePremium.indexOf(i) != -1) {
                                 obj['ITNO'] = newItemP;
                                 this.qiresGrid.updateRow(ind, obj);
                              }
                              if (this.proposeStandard.indexOf(i) != -1) {
                                 obj['ITNO'] = newItemS;
                                 this.qiresGrid.updateRow(ind, obj);
                              }
                              if (this.proposeStandardC.indexOf(i) != -1) {
                                 obj['ITNO'] = newItemC;
                                 this.qiresGrid.updateRow(ind, obj);
                              }
                              if (this.proposeDowngrade.indexOf(i) != -1) {
                                 obj['ITNO'] = newItemD;
                                 this.qiresGrid.updateRow(ind, obj);
                              }
                           }
                        }
                        ind++;
                     }
                  }

                  this.reportGradeFlag = true;
                  dialogRef.close();
                  //dialogRef.close();
               }, isDefault: true
            }])
         .title("Retrieve Grade Item")
         .open()
         .afterClose((result: any) => {
            this.closeResult = result;
         });
   }

   openReportGradeModal() {
      const dialogRef = this.modalService
         .modal<GradeReportDialogComponent>(GradeReportDialogComponent, this.placeholder)
         .buttons(
            [{
               text: 'Cancel', click: () => {
                  dialogRef.close();
               }
            },
            {
               text: 'OK', click: async () => {
                  //Call AddReclass for all selected
                  dialogRef.close();
                  //dialogRef.close();
               }, isDefault: true
            }])
         .title("Pallet Wise Grade Report")
         .open()
         .afterClose((result: any) => {
            this.closeResult = result;
         });
   }

   /****************************************************** INIT GRID OPTIONS ONLOAD *******************************************************/
   private initGrid() {
      this.qridOptions = {
         selectable: 'single' as SohoDataGridSelectable,
         clickToSelect: true,
         alternateRowShading: false,
         cellNavigation: false,
         filterable: true,
         paging: true,
         pagesize: 5,
         rowHeight: 'extra-small',
         columns: [
            { field: 'FACI', id: 'FACI', name: 'Facility', filterType: 'text', sortable: true, resizable: true, width: '3' },
            { field: 'QRID', id: 'QRID', name: 'Request ID', filterType: 'text', sortable: true, resizable: true, width: '3' },
            { field: 'ITNO', id: 'ITNO', name: 'Item Number', filterType: 'text', sortable: true, resizable: true, width: '5' },
            { field: 'BANO', id: 'BANO', name: 'Lot Number', filterType: 'text', sortable: true, resizable: true, width: '5' },
            { field: 'QSTA', id: 'QSTA', name: 'Request Status', filterType: 'text', sortable: true, resizable: true, width: '3' },
            { field: 'QAPR', id: 'QAPR', name: 'Approval Status', filterType: 'text', sortable: true, resizable: true, width: '3' },
            { field: 'QNXA', id: 'QNXA', name: 'Next Action', filterType: 'text', sortable: true, resizable: true, width: '3' },
            { field: 'RORN', id: 'RORN', name: 'Ref Order No', filterType: 'text', sortable: true, resizable: true, width: '3', hidden: true },
         ],
         dataset: [],
         emptyMessage: {
            title: 'No QI Requests available',
            icon: 'icon-empty-no-data'
         }
      };

      this.qiresOptions = {
         selectable: 'single' as SohoDataGridSelectable,
         //disableRowDeactivation: true,
         clickToSelect: true,
         alternateRowShading: false,
         cellNavigation: false,
         filterable: true,
         paging: false,
         editable: true,
         pagesize: 1000,

         //indeterminate: false,
         rowHeight: 'extra-small',
         columns: [
            { field: 'QTST', id: 'QTST', name: 'Test', filterType: 'text', sortable: false, resizable: true, width: '3' },
            { field: 'TSEQ', id: 'TSEQ', name: 'Sno', filterType: 'text', sortable: false, resizable: true, width: '1.5' },
            { field: 'QOP1', id: 'QOP1', name: 'Op', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '1' },
            { field: 'QTRS', id: 'QTRS', name: 'Test result val', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '4' },
            { field: 'QLCD', id: 'QLCD', name: 'Test result val', editor: Soho.Editors.Lookup, sortable: false, resizable: true, width: '5' },
            { field: 'TTDT', id: 'TTDT', name: 'Tstdt', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '2.5' },
            { field: 'QOP12', id: 'QOP12', name: 'Ex', sortable: false, resizable: true, width: '1' },
            { field: 'EVMX', id: 'EVMX', name: 'Expected Max', sortable: false, resizable: true, width: '4.5' },
            { field: 'EVTG', id: 'EVTG', name: 'Target Value', sortable: false, resizable: true, width: '4.5' },
            //{ field: 'QSTD', id: 'QSTD', name: 'Standing', sortable: true, resizable: true, width: '5' },
            { field: 'EVMN', id: 'EVMN', name: 'Expected Min', sortable: false, resizable: true, width: '4.5' },
            { field: 'EXSQ', id: 'EXSQ', name: 'Ord', sortable: false, resizable: true, width: '1.5' },
            { field: 'TSTT', id: 'TSTT', name: 'Sts', sortable: false, resizable: true, width: '3' },
            { field: 'ITNO', id: 'ITNO', name: 'Item Number', sortable: false, resizable: true, width: '5' },
            { field: 'SI01', id: 'SI01', name: 'Comments', sortable: false, editor: Soho.Editors.Textarea, resizable: true, width: '6.5', maxLength: 50 },
            { field: 'SPEC', id: 'SPEC', name: 'Specification', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'TSTY', id: 'TSTY', name: 'TestType', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QSE1', id: 'QSE1', name: 'SDate', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QTE1', id: 'QTE1', name: 'TDate', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QSE2', id: 'QSE2', name: 'STime', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QTE2', id: 'QTE2', name: 'TTime', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'TCAL', id: 'TCAL', name: 'Calc', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'VLTP', id: 'VLTP', name: 'Val Setup', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'FMID', id: 'FMID', name: 'Formula', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QLCD2', id: 'QLCD2', name: 'ExpQual', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QTCD', id: 'QTCD', name: 'NumQual', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'origQOP1', id: 'origQOP1', name: 'OrigOp', sortable: false, resizable: true, width: '1', hidden: true },
            { field: 'QTRS1', id: 'QTRS1', name: 'Quantitative Retest val', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '4', hidden: true },
            { field: 'QLCD1', id: 'QLCD1', name: 'Qualitative Retest val', editor: Soho.Editors.Input, sortable: false, resizable: true, width: '5', hidden: true },
         ],
         dataset: [],
         emptyMessage: {
            title: 'No selected QI Request',
            icon: 'icon-empty-no-data'
         }
      };
   }

   //Set busy
   private setBusy(isBusy: boolean, panel: string) {
      if (panel === 'qrid') {
         this.isBusyQrid = isBusy;
      }
      if (panel === 'qires') {
         this.isBusyQiRes = isBusy;
      }
      if (panel === 'cuno') {
         this.isBusyStatus = isBusy;
      }
   }


   private handleError(message: string, error?: any) {
      this.logError(message, error ? '- Error: ' + JSON.stringify(error) : '');
      const buttons = [{ text: 'Ok', click: (e, modal) => { modal.close(); } }];
      const errorMessage = error ? error.errorMessage : '';
      this.messageService.error()
         .title('An error occured')
         .message(message + ' ' + errorMessage)
         .buttons(buttons)
         .open();
   }

   private showSuccess(message: string) {
      const buttons = [{ text: 'Ok', click: (e, modal) => { modal.close(); } }];
      this.messageService.alert()
         .title('Success')
         .message(message)
         .buttons(buttons)
         .open();
   }
}
