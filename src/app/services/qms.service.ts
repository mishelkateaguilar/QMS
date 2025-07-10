

import { Injectable } from "@angular/core";
import { CoreBase, IMIRequest, IMIResponse, MIRecord, IUserContext } from "@infor-up/m3-odin";
import { MIService, UserService } from "@infor-up/m3-odin-angular";
import { SohoMessageService, SohoMessageRef } from "ids-enterprise-ng";
import { CommonService } from "./common.service";
import { DatePipe } from '@angular/common';
//import { difference } from "d3";

@Injectable({
   providedIn: 'root'
})
export class QMSService {
   userContext: IUserContext = null;
   proposedGrade: string;
   proposedMsg: string = "";
   proposedP: string = "";
   proposedS: string = "";
   proposedC: string = "";
   proposedD: string = "";
   proposedN: string = "";
   proposals: any[] = [];
   itemno: string;
   nitemno: string;
   lotno: string;
   dateToday: string;
   datePipe: DatePipe = new DatePipe('en-US');
   constructor(public datepipe: DatePipe, private miService: MIService, private messageService: SohoMessageService, private commonService: CommonService, private userService: UserService) {
      var currDate = new Date();
      this.dateToday = this.datePipe.transform(currDate, 'yyyyMMdd');
   }

   //List Facility to load in browse filter
   async ListFacility(cono: string) {
      const request: IMIRequest = {
         program: 'CRS008MI',
         transaction: 'ListFacility',
         maxReturnedRecords: 0,
         outputFields: ['FACI', 'FACN', 'DIVI']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('CONO', cono);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  resolve(items);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //List Items to load in browse filter
   async ListItems() {
      const request: IMIRequest = {
         program: 'EXPORTMI',
         transaction: 'Select',
         maxReturnedRecords: 0,
         outputFields: ['REPL']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('SEPC', ',');
      inputRecord.setString('QERY', 'MMITNO,MMITDS,MMFUDS from MITMAS');
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res: any[] = [];
                  for (let obj of items) {
                     const arr = obj['REPL'].split(",");
                     res.push({ "ITNO": arr[0], "ITDS": arr[1], "FUDS": arr[2] });
                  }
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //List Lot Numbers to load in browse filter
   async ListLotNumber(itno) {
      const request: IMIRequest = {
         program: 'MMS235MI',
         transaction: 'LstItmLot',
         maxReturnedRecords: 0,
         outputFields: ['ITNO', 'BANO']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('ITNO', itno);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  resolve(items);
               }
               else resolve([]);
            }
            else {
               resolve([]);
            }
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //Load all QI Requests for all facilities
   async ListAllQIRequest() {
      const request: IMIRequest = {
         program: 'EXPORTMI',
         transaction: 'Select',
         maxReturnedRecords: 0,
         outputFields: ['REPL']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('QERY', "RHFACI, RHQRID, RHITNO, RHBANO, RHQSTA, RHQAPR, RHRORN, RHQNXA from QMSRQH");
      inputRecord.setString('SEPC', ",");
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res: any[] = [];
                  for (let obj of items) {
                     const arr = obj['REPL'].split(",");
                     res.push({ "FACI": arr[0], "QRID": arr[1], "ITNO": arr[2], "BANO": arr[3], "QSTA": arr[4], "QAPR": arr[5], "RORN": arr[6], "QNXA": arr[7] });
                  }
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //List QI Requests based on filter
   async ListQIRequest(faci, qrid, itno, bano) {
      const request: IMIRequest = {
         program: 'EXPORTMI',
         transaction: 'Select',
         maxReturnedRecords: 0,
         outputFields: ['REPL']
      };

      const inputRecord: MIRecord = new MIRecord();
      //Set Query
      var query = "RHFACI, RHQRID, RHITNO, RHBANO, RHQSTA, RHQAPR, RHRORN, RHQNXA from QMSRQH";
      var count = 0;
      if (faci != "" && faci != null) {
         count++;
         if (count == 1) {
            query += " where RHFACI = '" + faci + "'";
         }
      }
      if (qrid != "" && qrid != null) {
         count++;
         if (count == 1) {
            query += " where RHQRID = '" + qrid + "'";
         }
         else {
            query += " and RHQRID = '" + qrid + "'";
         }
      }
      if (itno != "" && itno != null) {
         count++;
         if (count == 1) {
            query += " where RHITNO = '" + itno + "'";
         }
         else {
            query += " and RHITNO = '" + itno + "'";
         }
      }
      if (bano != "" && bano != null) {
         count++;
         if (count == 1) {
            query += " where RHBANO = '" + bano + "'";
         }
         else {
            query += " and RHBANO = '" + bano + "'";
         }
      }
      inputRecord.setString('QERY', query);
      inputRecord.setString('SEPC', ",");
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res: any[] = [];
                  for (let obj of items) {
                     const arr = obj['REPL'].split(",");
                     res.push({ "FACI": arr[0], "QRID": arr[1], "ITNO": arr[2], "BANO": arr[3], "QSTA": arr[4], "QAPR": arr[5], "RORN": arr[6], "QNXA": arr[7] });
                  }
                  resolve(res);
               }
               else {
                  resolve("");
               }

            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               console.log("Error3 " + error.errorMessage);
               //this.commonService.handleError(error.errorMessage, "Error in retrieving search results");
               resolve("");
            });
      });
   }

   //List QI Results QMS400
   async ListQIResult(faci, qrid, itno, bano) {
      const request: IMIRequest = {
         program: 'QMS400MI',
         transaction: 'LstTestResults',
         maxReturnedRecords: 0,
         outputFields: ['QTST', 'TSEQ', 'QOP1', 'QTRS', 'QLCD', 'TTDT', 'TTUS', 'TTTE', 'TSTY', 'SPEC', 'ITNO', 'VLEN', 'SI01', 'QTE1', 'QSE1', 'QTE2', 'QSE2', 'PRVL']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('BANO', bano);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res: any[] = [];
                  for (let obj of items) {
                     //Map operator
                     var newOp = "";
                     if (obj['QOP1'] == "1") {
                        newOp = ">"
                     }
                     if (obj['QOP1'] == "2") {
                        newOp = "="
                     }
                     if (obj['QOP1'] == "3") {
                        newOp = "<"
                     }
                     if (obj['QOP1'] == "4") {
                        newOp = "="
                     }
                     if (obj['QOP1'] == "5") {
                        newOp = "="
                     }

                     var qireq = await this.ListQIReq(faci, qrid, obj['SPEC'], obj['QTST'], obj['QSE1'], obj['QSE2'], obj['QTE1'], obj['QTE2'], obj['TSTY']);
                     for (let obj1 of qireq) {
                        var origQOP1 = obj1['origQOP1'];
                        if (newOp == "") {
                           if (origQOP1 == "1") {
                              newOp = ">"
                           }
                           if (origQOP1 == "2") {
                              newOp = "="
                           }
                           if (origQOP1 == "3") {
                              newOp = "<"
                           }
                           if (origQOP1 == "4") {
                              newOp = "="
                           }
                           if (origQOP1 == "5") {
                              newOp = "="
                           }
                        }

                        //Map status
                        var tstt = obj1['TSTT'];
                        var tsttDesc = tstt;
                        if (tstt == "0") {
                           tsttDesc = "0-Not tested";
                        }
                        if (tstt == "1") {
                           tsttDesc = "1-Passed";
                        }
                        else if (tstt == "2") {
                           tsttDesc = "2-On hold";
                        }
                        else if (tstt == "3") {
                           tsttDesc = "3-Failed";
                        }
                        else if (tstt == "4") {
                           tsttDesc = "4-In process";
                        }
                        res.push({ "QTST": obj['QTST'], "TSEQ": obj['TSEQ'], "QOP1": newOp, "QTRS": obj['QTRS'], "QLCD": obj['QLCD'], "TTDT": obj['TTDT'], "QOP12": obj1['QOP1'], "EVMX": obj1['EVMX'], "EVMN": obj1['EVMN'], "EVTG": obj1['EVTG'], "EXSQ": obj1['EXSQ'], "ITNO": obj['ITNO'], "SPEC": obj['SPEC'], "TSTY": obj['TSTY'], "TSTT": tsttDesc, 'QSE1': obj['QSE1'], 'QTE1': obj['QTE1'], 'QSE2': obj['QSE2'], 'QTE2': obj['QTE2'], 'TCAL': obj1['TCAL'], 'VLTP': obj1['VLTP'], 'FMID': obj1['FMID'], 'QLCD2': obj1['QLCD2'], 'origQOP1': obj1['origQOP1'], 'QTCD': obj1['QTCD'], 'SI01': obj['SI01'] });
                     }
                  }
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //List QI Req
   async ListQIReq(faci, qrid, spec, qtst, qse1, qse2, qte1, qte2, tsty) {
      const request: IMIRequest = {
         program: 'QMS302MI',
         transaction: 'GetTestQIReq',
         maxReturnedRecords: 0,
         outputFields: ['QTST', 'TSTY', 'EVMX', 'EVMN', 'EVTG', 'TSTT', 'TCAL', 'EXSQ', 'QOP1', 'VLTP', 'FMID', 'QLCD', 'QTCD']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('SPEC', spec)
      inputRecord.setString('QSE1', qse1)
      inputRecord.setString('QSE2', qse2)
      inputRecord.setString('QTST', qtst)
      inputRecord.setString('QTE1', qte1)
      inputRecord.setString('QTE2', qte2)
      inputRecord.setString('TSTY', tsty)
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res: any[] = [];
                  for (let obj of items) {
                     if (obj['QTST'] == qtst && obj['TSTY'] == tsty) {
                        var newEVMX = obj['EVMX'];
                        var newEVMN = obj['EVMN'];
                        var newEVTG = obj['EVTG'];
                        if (obj['EVMX'] == '0.000000') {
                           newEVMX = "";
                        }
                        if (obj['EVMN'] == '0.000000') {
                           newEVMN = "";
                        }
                        if (obj['EVTG'] == '0.000000') {
                           newEVTG = "";
                        }
                        //Map operator
                        var newOp = "";
                        if (obj['QOP1'] == "1") {
                           newOp = ">"
                        }
                        if (obj['QOP1'] == "2") {
                           newOp = ">="
                        }
                        if (obj['QOP1'] == "3") {
                           newOp = "<"
                        }
                        if (obj['QOP1'] == "4") {
                           newOp = "<="
                        }
                        if (obj['QOP1'] == "5") {
                           newOp = "="
                        }
                        res.push({ 'QTST': obj['QTST'], 'TSTY': obj['TSTY'], 'TSTT': obj['TSTT'], 'TCAL': obj['TCAL'], 'EVMX': newEVMX, 'EVMN': newEVMN, 'EVTG': newEVTG, 'EXSQ': obj['EXSQ'], 'QOP1': newOp, 'VLTP': obj['VLTP'], 'FMID': obj['FMID'], 'QLCD2': obj['QLCD'], 'QTCD': obj['QTCD'], 'origQOP1': obj['QOP1'] });
                     }
                  }
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //List Spec Information
   async ListSpec(spec, itno, currdate) {
      const request: IMIRequest = {
         program: 'QMS200MI',
         transaction: 'LstSpec',
         maxReturnedRecords: 0,
         outputFields: ['SPEC', 'ITNO', 'QSE1', 'STAT', 'QSI1']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('SPEC', spec);
      inputRecord.setString('ITNO', itno);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res = [];
                  for (let obj of items) {
                     if (itno == obj['ITNO'] && spec == obj['SPEC'] && obj['STAT'] == 20 && currdate > obj['QSE1'] && currdate < obj['QSI1']) {
                        res.push(obj);
                     }
                  }
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   async UpdTestResult(faci, qrid, itno, qtst, tsty, tseq, qtrs, qlcd, qop1, si01, ttdt) {
      var errm = "";
      const request: IMIRequest = {
         program: 'QMS400MI',
         transaction: 'UpdTestResult'
      };

      //Map operator
      var newOp = "";
      if (qop1 == ">") {
         newOp = "1"
      }
      if (qop1 == ">=") {
         newOp = "2"
      }
      if (qop1 == "<") {
         newOp = "3"
      }
      if (qop1 == "<=") {
         newOp = "4"
      }
      if (qop1 == "=") {
         newOp = "5"
      }
      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('QTST', qtst);
      inputRecord.setString('TSTY', tsty);
      inputRecord.setString('TSEQ', tseq);
      inputRecord.setString('VLEN', "1");
      if (newOp != "") {
         inputRecord.setString('QOP1', newOp);
      }
      if (qtrs != "") {
         inputRecord.setString('QTRS', qtrs);
      }
      if (qlcd != "") {
         inputRecord.setString('QLCD', qlcd);
      }
      if (si01 != "") {
         inputRecord.setString('SI01', si01);
      }
      if (ttdt != "") {
         inputRecord.setString('TTDT', ttdt);
      }


      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               console.log("Updated test result successfully.");
               resolve(true);
            }
            else {
               resolve(false);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, " Error in updating test result.");
               resolve(false);
            });
      });
   }

   //Get TSTT from QMSRQT
   async GetTSTT(faci, qrid, spec, itno, qtst) {
      const request: IMIRequest = {
         program: 'EXPORTMI',
         transaction: 'Select',
         maxReturnedRecords: 0,
         outputFields: ['REPL']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('QERY', "RTTSTT from QMSRQT where RTFACI = '" + faci + "' and RTQRID = '" + qrid + "' and RTSPEC = '" + spec + "' and RTITNO = '" + itno + "' and RTQTST = '" + qtst + "'");
      inputRecord.setString('SEPC', ",");
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  for (let obj of items) {
                     var tstt = obj['REPL'];
                     var tsttDesc = tstt;
                     if (tstt == "0") {
                        tsttDesc = "0-Not tested";
                     }
                     if (tstt == "1") {
                        tsttDesc = "1-Passed";
                     }
                     else if (tstt == "2") {
                        tsttDesc = "2-On hold";
                     }
                     else if (tstt == "3") {
                        tsttDesc = "3-Failed";
                     }
                     else if (tstt == "4") {
                        tsttDesc = "4-In process";
                     }
                  }
                  resolve(tsttDesc);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   async AddTestResult(faci, qrid, itno, qtst, tsty, nbex) {
      var errm = "";
      const request: IMIRequest = {
         program: 'QMS400MI',
         transaction: 'AddResultSeq'
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('QTST', qtst);
      inputRecord.setString('TSTY', tsty);
      inputRecord.setString('NBEX', nbex);

      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               console.log("Added new test result successfully.");
               resolve(true);
            }
            else {
               reject(false);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, " Error in adding test result.");
               resolve(false);
            });
      });
   }

   async securityCheck(user): Promise<boolean> {
      let check: boolean = false;
      const request: IMIRequest = {
         program: 'MNS410MI',
         transaction: 'Get',
         record: null,
         maxReturnedRecords: 1,
         outputFields: [],
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString("USID", user);
      inputRecord.setString("ROLL", 'FABQA');
      request.record = inputRecord;

      await this.miService
         .execute(request)
         .toPromise()
         .then((response: IMIResponse) => {
            if (response.items.length > 0) {
               check = true;
            }
         })
         .catch((error) => {
            //this.logError('load failed: ' + error);
            console.log('load failed: ' + error);
         });
      return check;
   }

   //Get Pallet Count
   async GetPallet(faci, bano, itno) {
      const request: IMIRequest = {
         program: 'CRS008MI',
         transaction: 'Get',
         maxReturnedRecords: 1,
         outputFields: ['WHLO']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  for (let obj of items) {
                     var whlo = obj['WHLO'];
                     var palletCount = await this.ListLot(whlo, bano, itno);
                  }

                  resolve(palletCount);
                  //resolve(5);
               }
               else resolve(0);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, "Error in getting number of lots");
               resolve(0);
            });
      });
   }

   //List Lot
   async ListLot(whlo, bano, itno) {
      const request: IMIRequest = {
         program: 'MMS060MI',
         transaction: 'LstLot',
         maxReturnedRecords: 1000,
         outputFields: []
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('WHLO', whlo);
      inputRecord.setString('BANO', bano);
      inputRecord.setString('ITNO', itno);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var count = 0;
                  for (let obj of items) {
                     count++;
                  }
                  resolve(count);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, "Error in getting number of lots");
               resolve([]);
            });
      });
   }

   //Add test results for pallet wise testing to XtendM3 table
   async AddXtendTestResult(cono, faci, qrid, qtst, tsty, tseq, qop1, itno, bano, prvl, si01, ttdt, qtrs, qlcd, tstt, exsq, evmx, evmn, evtg, spec, qse1, qse2, qte1, qte2, vltp, tcal, fmid, qtcd, qlc2, pall) {
      var errm = "";
      const request: IMIRequest = {
         program: 'EXT400MI',
         transaction: 'AddEXTQMS'
      };

      //Map operator
      var newOp = "";
      if (qop1 == ">") {
         newOp = "1"
      }
      if (qop1 == ">=") {
         newOp = "2"
      }
      if (qop1 == "<") {
         newOp = "3"
      }
      if (qop1 == "<=") {
         newOp = "4"
      }
      if (qop1 == "=") {
         newOp = "5"
      }

      //Map status
      var newTSTT = "";;
      if (tstt == "0-Not tested") {
         newTSTT = "0";
      }
      if (tstt == "1-Passed") {
         newTSTT = "1";
      }
      else if (tstt == "2-On hold") {
         newTSTT = "2";
      }
      else if (tstt == "3-Failed") {
         newTSTT = "3";
      }
      else if (tstt == "4-In process") {
         newTSTT = "4";
      }

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('CONO', cono);
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('QTST', qtst);
      inputRecord.setString('TSTY', tsty);
      inputRecord.setString('TSEQ', tseq);
      if (newOp != "") {
         inputRecord.setString('QOP1', newOp);
      }
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('BANO', bano);
      inputRecord.setString('PRVL', prvl);
      inputRecord.setString('SI01', si01);
      if (ttdt == "") {
         ttdt = this.dateToday;
      }
      inputRecord.setString('TTDT', ttdt);
      inputRecord.setString('QTRS', qtrs);
      inputRecord.setString('QLCD', qlcd);
      inputRecord.setString('TSTT', newTSTT);
      inputRecord.setString('EXSQ', exsq);
      inputRecord.setString('EVMX', evmx);
      inputRecord.setString('EVMN', evmn);
      inputRecord.setString('EVTG', evtg);
      inputRecord.setString('SPEC', spec);
      inputRecord.setString('QSE1', qse1);
      inputRecord.setString('QSE2', qse2);
      inputRecord.setString('QTE1', qte1);
      inputRecord.setString('QTE2', qte2);
      inputRecord.setString('VLTP', vltp);
      if (tcal == "0" || tcal == 0 || tcal == "") {
         tcal = "0";
      }
      inputRecord.setString('TCAL', tcal);
      inputRecord.setString('FMID', fmid);
      inputRecord.setString('QTCD', qtcd);
      inputRecord.setString('QLC2', qlc2);
      inputRecord.setString('PALL', pall);
      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               console.log("Added new test result successfully.");
               resolve(true);
            }
            else {
               reject(false);
            }
         }
            , error => {
               console.log(error.errorMessage + ": Error in adding test result.");
               resolve(false);
            });
      });
   }

   //List XtendM3 table test results - pallet wise testing
   async ListXtendTestResults(cono, faci, qrid, itno, bano) {
      const request: IMIRequest = {
         program: 'EXT400MI',
         transaction: 'LstEXTQMS',
         maxReturnedRecords: 0,
         outputFields: ['QTST', 'TSTY', 'TSEQ', 'ITNO', 'QOP1', 'QTRS', 'QLCD', 'TTUS', 'TTDT', 'TTTE', 'PRVL', 'SI01', 'TSTT', 'SPEC', 'EVMX', 'EVMN', 'EVTG', 'QSE1', 'QSE2', 'QTE1', 'QTE2', 'QTCD', 'QLC2', 'VLTP', 'TCAL', 'FMID', 'EXSQ', 'PALL']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('CONO', cono);
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var tstt = "";
                  var tsttDesc = "";
                  var newOp = "";
                  var exOp = "";
                  var Op = "";
                  var res: any[] = [];
                  /**var SPEC, QSE1, QSE2, QTE1, QTE2;
                  var spec = await this.ListSpecQI(faci, qrid);
                  for (let obj1 of spec) {
                     if (itno == obj1['ITNO'] && bano == obj1['BANO']) {
                        SPEC = obj1['SPEC'];
                        QSE1 = obj1['QSE1'];
                        QSE2 = obj1['QSE2'];
                     }
                  }
                  var prevTest = "";
                  for (let obj of items) {
                     tstt = obj['TSTT'];
                     tsttDesc = tstt;
                     //Map test status
                     if (tstt == "0") {
                        tsttDesc = "0-Not tested";
                     }
                     if (tstt == "1") {
                        tsttDesc = "1-Passed";
                     }
                     else if (tstt == "2") {
                        tsttDesc = "2-On hold";
                     }
                     else if (tstt == "3") {
                        tsttDesc = "3-Failed";
                     }
                     else if (tstt == "4") {
                        tsttDesc = "4-In process";
                     }
                     //Map operator
                     newOp = "";
                     Op = obj['QOP1'];
                     if (Op == "1") {
                        newOp = ">"
                     }
                     else if (Op == "2") {
                        newOp = "="
                     }
                     else if (Op == "3") {
                        newOp = "<"
                     }
                     else if (Op == "4") {
                        newOp = "="
                     }
                     else if (Op == "5") {
                        newOp = "="
                     }
                     //Only call for next test
                     console.log("comp " + obj['QTST'] + " and " + prevTest);
                     if (prevTest == "" || obj['QTST'] != prevTest) {
                        var spectest = await this.GetSpecTest(SPEC, QSE1, itno, obj['QTST'], obj['TSTY']);
                        for (let obj2 of spectest) {
                           QTE1 = obj2['QTE1'];
                           QTE2 = obj2['QTE2'];
                        }
                        prevTest = obj['QTST'];
                     }
                     var qireq = await this.ListQIReq(faci, qrid, SPEC, obj['QTST'], QSE1, QSE2, QTE1, QTE2, obj['TSTY']);
                     for (let obj3 of qireq) {
                        res.push({ "QTST": obj['QTST'], "TSEQ": obj['TSEQ'], "QOP1": newOp, "QTRS1": obj['QTRS'], "QLCD1": obj['QLCD'], "TTDT": obj['TTDT'], "QOP12": obj3['QOP1'], "EVMX": obj3['EVMX'], "EVMN": obj3['EVMN'], "EVTG": obj3['EVTG'], "EXSQ": obj3['EXSQ'], "ITNO": obj['ITNO'], "SPEC": spec, "TSTY": obj['TSTY'], "TSTT": tsttDesc, 'QSE1': obj['QSE1'], 'QSE2': QSE2, 'QTE2': QTE2, 'QTE1': obj['QTE1'], 'TCAL': obj3['TCAL'], 'VLTP': obj3['VLTP'], 'FMID': obj3['FMID'], 'QLCD2': obj3['QLCD2'], 'origQOP1': obj['QOP1'], 'QTCD': obj3['QTCD'] });
                     }
                     **/
                  for (let obj of items) {
                     tstt = obj['TSTT'];
                     tsttDesc = tstt;
                     //Map test status
                     if (tstt == "0") {
                        tsttDesc = "0-Not tested";
                     }
                     if (tstt == "1") {
                        tsttDesc = "1-Passed";
                     }
                     else if (tstt == "2") {
                        tsttDesc = "2-On hold";
                     }
                     else if (tstt == "3") {
                        tsttDesc = "3-Failed";
                     }
                     else if (tstt == "4") {
                        tsttDesc = "4-In process";
                     }
                     //Map operator
                     newOp = "";
                     exOp = "";
                     Op = obj['QOP1'];
                     if (Op == "1") {
                        newOp = ">"
                        exOp = newOp;
                     }
                     else if (Op == "2") {
                        newOp = "="
                        exOp = ">=";
                     }
                     else if (Op == "3") {
                        newOp = "<"
                        exOp = newOp;
                     }
                     else if (Op == "4") {
                        newOp = "="
                        exOp = "<=";
                     }
                     else if (Op == "5") {
                        newOp = "="
                        exOp = newOp;
                     }


                     //Add test result to custom value fields (pallet wise testing)
                     if (obj['PALL'] == 1) {
                        res.push({ "QTST": obj['QTST'], "TSEQ": obj['TSEQ'], "QOP1": newOp, "QTRS1": obj['QTRS'], "QLCD1": obj['QLCD'], "TTDT": obj['TTDT'], "QOP12": exOp, "EVMX": obj['EVMX'], "EVMN": obj['EVMN'], "EVTG": obj['EVTG'], "ITNO": obj['ITNO'], "SPEC": obj['SPEC'], "TSTY": obj['TSTY'], "TSTT": tsttDesc, 'QSE1': obj['QSE1'], 'QSE2': obj['QSE2'], 'QTE2': obj['QTE2'], 'QTE1': obj['QTE1'], 'TCAL': obj['TCAL'], 'VLTP': obj['VLTP'], 'FMID': obj['FMID'], 'QLCD2': obj['QLC2'], 'origQOP1': obj['QOP1'], 'QTCD': obj['QTCD'], 'EXSQ': obj['EXSQ'], 'SI01': obj['SI01'] });
                     }
                     //Else, add test result to standard value field
                     else res.push({ "QTST": obj['QTST'], "TSEQ": obj['TSEQ'], "QOP1": newOp, "QTRS": obj['QTRS'], "QLCD": obj['QLCD'], "TTDT": obj['TTDT'], "QOP12": exOp, "EVMX": obj['EVMX'], "EVMN": obj['EVMN'], "EVTG": obj['EVTG'], "ITNO": obj['ITNO'], "SPEC": obj['SPEC'], "TSTY": obj['TSTY'], "TSTT": tsttDesc, 'QSE1': obj['QSE1'], 'QSE2': obj['QSE2'], 'QTE2': obj['QTE2'], 'QTE1': obj['QTE1'], 'TCAL': obj['TCAL'], 'VLTP': obj['VLTP'], 'FMID': obj['FMID'], 'QLCD2': obj['QLC2'], 'origQOP1': obj['QOP1'], 'QTCD': obj['QTCD'], 'EXSQ': obj['EXSQ'], 'SI01': obj['SI01'] });
                  }

                  /**var spectest = await this.ListSpecTest(SPEC, QSE1, itno, obj['QTST'], obj['TSTY']);
                  for (let obj2 of spectest) {
                     if (newOp == "") {
                        newOp = obj2['QOP1'];
                     }
                     res.push({ "QTST": obj['QTST'], "TSEQ": obj['TSEQ'], "QOP1": newOp, "QTRS": obj['QTRS'], "QLCD": obj['QLCD'], "TTDT": obj['TTDT'], "QOP12": obj2['QOP1'], "EVMX": obj2['EVMX'], "EVMN": obj2['EVMN'], "EVTG": obj2['EVTG'], "EXSQ": obj2['EXSQ'], "ITNO": obj['ITNO'], "SPEC": obj['SPEC'], "TSTY": obj['TSTY'], "TSTT": tsttDesc });
                  }
               }**/
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               //reject(response.errorMessage);
               resolve([]);
            }
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }


   async GetSpecTest(spec, qse1, itno, qtst, tsty) {
      const request: IMIRequest = {
         program: 'QMS201MI',
         transaction: 'LstSpecTest',
         maxReturnedRecords: 0,
         outputFields: ['QTE1', 'QTE2', 'QTST', 'TSTY']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('SPEC', spec);
      inputRecord.setString('QSE1', qse1);
      inputRecord.setString('ITNO', itno);

      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res: any[] = [];
                  for (let obj of items) {
                     if (obj['QTST'] == qtst && obj['TSTY'] == tsty) {
                        res.push({ 'QTE1': obj['QTE1'], 'QTE2': obj['QTE2'] });
                     }
                  }
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               resolve([]);
            }
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   async UpdXtendTestResult(cono, faci, qrid, itno, qtst, tsty, tseq, qtrs, qlcd, qop1, tstt, ttdt, ttus, pall, si01) {
      var errm = "";
      const request: IMIRequest = {
         program: 'EXT400MI',
         transaction: 'UpdEXTQMS'
      };

      //Map operator
      var newOp = "";
      if (qop1 == ">") {
         newOp = "1"
      }
      if (qop1 == ">=") {
         newOp = "2"
      }
      if (qop1 == "<") {
         newOp = "3"
      }
      if (qop1 == "<=") {
         newOp = "4"
      }
      if (qop1 == "=") {
         newOp = "5"
      }
      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('CONO', cono);
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('QTST', qtst);
      inputRecord.setString('TSTY', tsty);
      inputRecord.setString('TSEQ', tseq);
      if (newOp != "") {
         inputRecord.setString('QOP1', newOp);
      }
      if (ttdt != "") {
         inputRecord.setString('TTDT', ttdt);
      }
      if (ttus != "") {
         inputRecord.setString('TTUS', ttus);
      }
      inputRecord.setString('VLEN', "1");
      if (qtrs != "") {
         inputRecord.setString('QTRS', qtrs);
      }
      if (qlcd != "") {
         inputRecord.setString('QLCD', qlcd);
      }
      if (pall != "") {
         inputRecord.setString('PALL', pall);
      }
      if (si01 != "") {
         inputRecord.setString('SI01', si01);
      }
      if (tstt != "") {
         inputRecord.setString('TSTT', tstt);
      }


      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               console.log("Updated test result successfully.");
               resolve(true);
            }
            else {
               reject(false);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, " Error in updating test result.");
               resolve(false);
            });
      });
   }

   //List Spec
   async ListSpecQI(faci, qrid) {
      const request: IMIRequest = {
         program: 'QMS301MI',
         transaction: 'LstSpecQIReqt',
         maxReturnedRecords: 0,
         outputFields: ['SPEC', 'QSE1', 'QSE2', 'ITNO', 'BANO']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  resolve(items);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //Get QSTA
   async GetQSTA(faci, qrid) {
      const request: IMIRequest = {
         program: 'QMS300MI',
         transaction: 'GetQIRequest',
         maxReturnedRecords: 0,
         outputFields: ['QSTA', 'QAPR']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var newRep = "";
                  for (let obj of items) {
                     newRep = obj['QSTA'] + "_" + obj['QAPR'];
                  }
                  resolve(newRep);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   /**
    *
    * @param api Lists the Qualitative Values
    * @param response
    * @returns
    */
   ListQLCD(api: any, response: any) {
      let list: any = [];
      const req: IMIRequest = {
         program: 'QMS001MI',
         transaction: 'LstQualitative',
         outputFields: ['QLCD', 'TX40'],
         maxReturnedRecords: 9999,
      };

      api.settings.options.columns = [
         { id: 'QLCD', field: 'QLCD', name: "Qualitative Code" },
         { id: 'TX40', field: 'TX40', name: "Description" }
      ];

      api.settings.options.paging = true;
      api.settings.options.hidePagerOnOnePage = true;
      api.settings.options.rowHeight = 'medium';

      return this.miService.execute(req).subscribe({
         next: (res: IMIResponse) => {
            list = [...res.items];
            api.settings.options.dataset = list;
            response();
         },
         error: (err: IMIResponse) => {
            api.settings.options.dataset = [];
            response();
         }
      });
   }

   /**
       *
       * @param api Lists the Numeric Qualitative Value
       * @param response
       * @returns
       */
   ListQTCD(api: any, response: any, qtcd: any) {
      let list: any = [];
      const req: IMIRequest = {
         program: 'QMS003MI',
         transaction: 'LstNumericQualV',
         outputFields: ['QTCD', 'QTVL', 'DSCR'],
         maxReturnedRecords: 9999,
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('QTCD', qtcd);
      req.record = inputRecord;

      api.settings.options.columns = [
         { id: 'QTVL', field: 'QTVL', name: "Numeric Qualitative Value" },
         { id: 'DSCR', field: 'DSCR', name: "Description" }
      ];

      api.settings.options.paging = true;
      api.settings.options.hidePagerOnOnePage = true;
      api.settings.options.rowHeight = 'medium';

      return this.miService.execute(req).subscribe({
         next: (res: IMIResponse) => {
            const item = res.items;
            var resp = [];
            for (let obj of item) {
               console.log("QTCD " + obj['QTCD']);
               if (obj['QTCD'] == qtcd) {
                  resp.push({ "QTVL": obj['QTVL'], "DSCR": obj['DSCR'] });
               }
            }
            list = [...resp];
            api.settings.options.dataset = list;
            response();
         },
         error: (err: IMIResponse) => {
            api.settings.options.dataset = [];
            response();
         }
      });
   }

   //Check Product Group
   async CheckProductGroup(itno, nitno): Promise<boolean> {
      var itnoITCL = await this.GetProductGroup(itno);
      var nitnoITCL = await this.GetProductGroup(nitno);
      if (itnoITCL != nitnoITCL) {
         return false;
      }
      else return true;
   }

   //Get Product Group
   async GetProductGroup(itno) {
      const request: IMIRequest = {
         program: 'MMS200MI',
         transaction: 'Get',
         maxReturnedRecords: 0,
         outputFields: ['ITCL']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('ITNO', itno);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var itcl = "";
                  for (let obj of items) {
                     itcl = obj['ITCL'];
                  }
                  resolve(itcl);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //List Formula
   async ListFormula(fmid) {
      const request: IMIRequest = {
         program: 'CMS100MI',
         transaction: 'LstFormulaLine',
         maxReturnedRecords: 0,
         outputFields: ['QDFAC1', 'QDFAC2', 'QDOBJ1', 'QDOBJ2']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('QDFMID', fmid);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res: any = [];
                  console.log('LstFormula ' + JSON.stringify(items));
                  for (let obj of items) {
                     res.push(obj['QDFAC1'] + "_" + obj['QDFAC2'] + "_" + obj['QDOBJ1'] + "_" + obj['QDOBJ2']);
                  }
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //Set Formula
   async SetFormula(fmid) {
      const request: IMIRequest = {
         program: 'CMS100MI',
         transaction: 'LstFormulaLine',
         maxReturnedRecords: 0,
         outputFields: ['FAC2', 'FAC1', 'OPE2']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FMID', fmid);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  resolve(items);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   //List QI Results QMS400
   async GetQIResult(faci, qrid, itno, qtst, tsty, tseq) {
      const request: IMIRequest = {
         program: 'QMS400MI',
         transaction: 'GetTestResults',
         maxReturnedRecords: 0,
         outputFields: ['QTST', 'TSEQ', 'QOP1', 'QTRS', 'QLCD', 'TTDT', 'TTUS', 'TTTE', 'TSTY', 'SPEC', 'ITNO', 'VLEN', 'SI01', 'QTE1', 'QSE1', 'QTE2', 'QSE2', 'PRVL']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('QTST', qtst);
      inputRecord.setString('TSTY', tsty);
      inputRecord.setString('TSEQ', tseq);
      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var res: any[] = [];
                  for (let obj of items) {
                     //Map operator
                     var newOp = "";
                     if (obj['QOP1'] == "1") {
                        newOp = ">"
                     }
                     if (obj['QOP1'] == "2") {
                        newOp = "="
                     }
                     if (obj['QOP1'] == "3") {
                        newOp = "<"
                     }
                     if (obj['QOP1'] == "4") {
                        newOp = "="
                     }
                     if (obj['QOP1'] == "5") {
                        newOp = "="
                     }

                     var qireq = await this.ListQIReq(faci, qrid, obj['SPEC'], obj['QTST'], obj['QSE1'], obj['QSE2'], obj['QTE1'], obj['QTE2'], obj['TSTY']);
                     for (let obj1 of qireq) {
                        if (newOp == "") {
                           newOp = obj1['QOP1'];
                        }
                        //Map status
                        var tstt = obj1['TSTT'];
                        var tsttDesc = tstt;
                        if (tstt == "0") {
                           tsttDesc = "0-Not tested";
                        }
                        if (tstt == "1") {
                           tsttDesc = "1-Passed";
                        }
                        else if (tstt == "2") {
                           tsttDesc = "2-On hold";
                        }
                        else if (tstt == "3") {
                           tsttDesc = "3-Failed";
                        }
                        else if (tstt == "4") {
                           tsttDesc = "4-In process";
                        }
                        res.push({ "QTST": obj['QTST'], "TSEQ": obj['TSEQ'], "QOP1": newOp, "QTRS": obj['QTRS'], "QLCD": obj['QLCD'], "TTDT": obj['TTDT'], "QOP12": obj1['QOP1'], "EVMX": obj1['EVMX'], "EVMN": obj1['EVMN'], "EVTG": obj1['EVTG'], "EXSQ": obj1['EXSQ'], "ITNO": obj['ITNO'], "SPEC": obj['SPEC'], "TSTY": obj['TSTY'], "TSTT": tsttDesc, 'QSE1': obj['QSE1'], 'QTE1': obj['QTE1'], 'QSE2': obj['QSE2'], 'QTE2': obj['QTE2'], 'TCAL': obj1['TCAL'], 'VLTP': obj1['VLTP'], 'FMID': obj1['FMID'], 'QLCD2': obj1['QLCD2'], 'origQOP1': obj1['QOP1'], 'QTCD': obj1['QTCD'] });
                     }
                  }
                  resolve(res);
               }
               else resolve([]);
            }
            else {
               reject(response.errorMessage);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   async LstSpecTest(spec, qse1, itno) {
      const request: IMIRequest = {
         program: 'QMS201MI',
         transaction: 'LstSpecTest',
         maxReturnedRecords: 0,
         outputFields: ['QTE1', 'QTI1', 'QTST', 'TSTY', 'QTCD', 'QLCD', 'QOP1', 'EVMX', 'EVMN', 'EVTG', 'VLTP', 'TCAL']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('SPEC', spec);
      inputRecord.setString('QSE1', qse1);
      inputRecord.setString('ITNO', itno);

      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  resolve(items);
               }
               else resolve([]);
            }
            else {
               resolve([]);
            }
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }

   async itemPutAway(cono, itno, bano, qapr) {
      const request: IMIRequest = {
         program: 'MMS060MI',
         transaction: 'LstViaItem',
         maxReturnedRecords: 0,
         outputFields: ['WHLO', 'CAMU', 'STAS']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('CONO', cono);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('BANO', bano);

      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  for (let obj of items) {
                     //var isPutaway = await this.putAway(itno, bano, obj['STAS'], obj['WHLO'], obj['CAMU']);
                     var isPutaway = await this.putAway(itno, bano, obj['WHLO'], obj['CAMU'], qapr);
                     if (isPutaway) {
                        console.log("Putaway successful for container " + obj['CAMU']);
                        resolve(true);
                     }
                     else {
                        console.log("Putaway not successful for container " + obj['CAMU']);
                        resolve(false);
                     }
                  }

               }
               else resolve(false);
            }
            else {
               resolve(false);
            }
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve(false);
            });
      });
   }

   async putAway(itno, bano, whlo, camu, qapr) {
      var errm = "";
      const request: IMIRequest = {
         program: 'PMS130MI',
         transaction: 'SetQIItmPutAway'
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('BANO', bano);
      if (qapr == "1") {
         inputRecord.setString('STAS', "2");
      }
      if (qapr == "2") {
         inputRecord.setString('STAS', "1");
      }

      inputRecord.setString('WHLO', whlo);
      inputRecord.setString('CAMU', camu);

      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               resolve(true);
            }
            else {
               resolve(false);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, " Error item putaway.");
               resolve(false);
            });
      });
   }

   async reportGrade(cono, itno, bano, nitno, qrid, faci) {
      var whlo, whsl, camu;
      const request: IMIRequest = {
         program: 'MMS060MI',
         transaction: 'LstViaItem',
         maxReturnedRecords: 0,
         outputFields: ['WHLO', 'WHSL', 'CAMU']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('CONO', cono);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('BANO', bano);

      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  var count = 0;
                  const items = response.items;
                  for (let obj of items) {
                     count++;
                     whlo = obj['WHLO'];
                     whsl = obj['WHSL'];
                     camu = obj['CAMU'];
                     var reportGrade;
                     //Set QRBS to 0
                     if (count == 1) {
                        reportGrade = await this.addReclass(itno, bano, whlo, camu, whsl, nitno, "0", "", "1");
                     }
                     //Set qrbs to 3
                     else {
                        reportGrade = await this.addReclass(itno, bano, whlo, camu, whsl, nitno, "3", "", "1");
                     }
                     if (reportGrade) {
                        console.log("Report grade item - AddReclass successful: " + itno + " to " + nitno);
                        var copy = await this.LstTestbyLot(bano, faci, nitno, qrid, whlo, camu, whsl);
                        if (copy) {
                           console.log("Report grade item - QMS450 Copy successful");
                           resolve(true);
                        }
                        else {
                           console.log("Report grade item - QMS450 Copy not successful");
                           resolve(false);
                        }
                     }
                     else {
                        console.log("Report grade item - AddReclass not successful " + itno + " to " + nitno);
                     }
                  }
               }

               else {
                  console.log("No MMS060MI record...");
                  resolve(false);
               }
            }
            else resolve(false);
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve(false);
            });
      });
   }

   async reclass(cono, itno, bano, nitno, qrid, faci) {
      var whlo, whsl, camu;
      const request: IMIRequest = {
         program: 'MMS060MI',
         transaction: 'LstViaItem',
         maxReturnedRecords: 0,
         outputFields: ['WHLO', 'WHSL', 'CAMU']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('CONO', cono);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('BANO', bano);

      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var count = 0;
                  for (let obj of items) {
                     whlo = obj['WHLO'];
                     whsl = obj['WHSL'];
                     camu = obj['CAMU'];
                     count++;
                     var reportGrade;
                     //Set QRBS to 0
                     if (count == 1) {
                        reportGrade = await this.addReclass(itno, bano, whlo, camu, whsl, nitno, "0", "", "1");
                     }
                     //Set QRBS to 3
                     else {
                        reportGrade = await this.addReclass(itno, bano, whlo, camu, whsl, nitno, "3", "", "1");
                     }

                     if (reportGrade) {
                        console.log("Reclassification - AddReclass successful: " + itno + " to " + nitno);
                        var copy = await this.LstTestbyLot(bano, faci, nitno, qrid, whlo, camu, whsl);
                        if (copy) {
                           console.log("Reclassification - QMS450 Copy successful");
                           resolve(true);
                        }
                        else {
                           console.log("Reclassification - QMS450 Copy not successful");
                           resolve(false);
                        }
                     }
                     else {
                        console.log("Reclassification - AddReclass unsuccessful: " + itno + " to " + nitno);
                        resolve(false);
                     }
                  }
               }
               else resolve(false);
            }
            else {
               resolve(false);
            }
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve(false);
            });
      });
   }

   async addReclass(itno, bano, whlo, camu, whsl, nitno, qrbs, calt, stas) {
      var errm = "";
      const request: IMIRequest = {
         program: 'MMS850MI',
         transaction: 'AddReclass'
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('PRFL', "*EXE");
      inputRecord.setString('E0PA', "WS");
      inputRecord.setString('E065', "WMS");
      inputRecord.setString('WHLO', whlo);
      inputRecord.setString('WHSL', whsl);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('BANO', bano);
      if (camu != "") {
         inputRecord.setString('CAMU', camu);
      }
      inputRecord.setString('NITN', nitno);
      inputRecord.setString('NBAN', bano);
      inputRecord.setString('STAS', stas);
      if (calt != "") {
         inputRecord.setString('CALT', calt);
      }
      inputRecord.setString('QRBS', qrbs);
      inputRecord.setString('ALOC', '1');

      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               resolve(true);
            }
            else {
               reject(false);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, " Error in AddReclass");
               resolve(false);
            });
      });
   }

   async LstTestbyLot(bano, faci, nitno, qrid, whlo, camu, whsl) {
      const request: IMIRequest = {
         program: 'CMS100MI',
         transaction: 'LstTestbyLot',
         maxReturnedRecords: 0,
         outputFields: ['RHITNO', 'RHQRID']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('RHFACI', faci);
      inputRecord.setString('RHBANO', bano);

      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  var toid;
                  for (let obj of items) {
                     if (obj['RHITNO'] == nitno) {
                        toid = obj['RHQRID'];
                     }
                  }
                  if (toid != "") {
                     var isCopy = await this.copyTest(qrid, toid, faci);
                     if (isCopy) {
                        await this.addReclass2(nitno, bano, whlo, camu, whsl);
                        resolve(true);
                     }
                     else {
                        resolve(false);
                     }
                  }
               }
               else resolve(false);
            }
            else {
               resolve(false);
            }
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve(false);
            });
      });
   }

   async copyTest(qrid, toid, faci) {
      var errm = "";
      const request: IMIRequest = {
         program: 'QMS450MI',
         transaction: 'UpdTestResults'
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('TOID', toid);
      inputRecord.setString('FACI', faci);

      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               resolve(true);
            }
            else {
               reject(false);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, " Error item putaway.");
               resolve(false);
            });
      });
   }

   async addReclass2(itno, bano, whlo, camu, whsl) {
      var errm = "";
      const request: IMIRequest = {
         program: 'MMS850MI',
         transaction: 'AddReclass'
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('PRFL', "*EXE");
      inputRecord.setString('E0PA', "WS");
      inputRecord.setString('E065', "WMS");
      inputRecord.setString('WHLO', whlo);
      inputRecord.setString('WHSL', whsl);
      inputRecord.setString('ITNO', itno);
      inputRecord.setString('BANO', bano);
      if (camu != "") {
         inputRecord.setString('CAMU', camu);
      }
      inputRecord.setString('STAS', "2");
      inputRecord.setString('CALT', "1");

      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               console.log("Reclass call 2 successful.");
               resolve(true);
            }
            else {
               console.log("Reclass call 2 unsuccessful.");
               resolve(false);
            }
         }
            , error => {
               this.commonService.handleError(error.errorMessage, " Error in AddReclass");
               resolve(false);
            });
      });
   }

   async UpdCalcTests(faci, qrid) {
      var errm = "";
      const request: IMIRequest = {
         program: 'QMS400MI',
         transaction: 'UpdCalcTests'
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);

      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               resolve(true);
            }
            else {
               reject(false);
            }
         }
            , error => {
               console.log(error.errorMessage + "; Error item putaway.");
               resolve(false);
            });
      });
   }

   async UpdTesttoQIReq(faci, qrid, spec, qse1, qse2, qtst, qte1, qte2, tsty, tstt) {
      const request: IMIRequest = {
         program: 'QMS302MI',
         transaction: 'UpdTesttoQIReq'
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('QRID', qrid);
      inputRecord.setString('SPEC', spec);
      inputRecord.setString('QSE1', qse1);
      inputRecord.setString('QSE2', qse2);
      inputRecord.setString('QTST', qtst);
      inputRecord.setString('QTE1', qte1);
      inputRecord.setString('QTE2', qte2);
      inputRecord.setString('TSTY', tsty);
      inputRecord.setString('QRSN', "ZZZZZZZZZZ");
      inputRecord.setString('TSTT', tstt);

      request.record = inputRecord;

      return new Promise((resolve, reject) => {
         this.miService.execute(request).subscribe((response: IMIResponse) => {
            if (!response.hasError()) {
               console.log("UpdTesttoQIReq successfully executed.");
               resolve(true);
            }
            else {
               resolve(false);
            }
         }
            , error => {
               console.log(error.errorMessage, " Error in UpdTesttoQIReq call.");
               resolve(false);
            });
      });
   }

   async GetMOText(faci, itno, rorn) {
      const request: IMIRequest = {
         program: 'PMS100MI',
         transaction: 'Get',
         maxReturnedRecords: 0,
         outputFields: ['TXT1', 'TXT2']
      };

      const inputRecord: MIRecord = new MIRecord();
      inputRecord.setString('FACI', faci);
      inputRecord.setString('PRNO', itno);
      inputRecord.setString('MFNO', rorn);

      request.record = inputRecord;

      return new Promise<any>((resolve, reject) => {
         this.miService.execute(request).subscribe(async (response: IMIResponse) => {
            if (!response.hasError()) {
               if (response.items.length > 0) {
                  const items = response.items;
                  resolve(items);
               }
               else resolve([]);
            }
            else {
               resolve([]);
            }
         }
            , error => {
               //this.commonService.handleError(error.errorMessage);
               resolve([]);
            });
      });
   }
}
