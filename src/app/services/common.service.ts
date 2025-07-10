import { Injectable } from "@angular/core";
import { MIService, UserService } from "@infor-up/m3-odin-angular";
import { SohoMessageService, SohoMessageRef } from "ids-enterprise-ng";
import { IMIRequest, IMIResponse, MIRecord } from "@infor-up/m3-odin";
import { Router } from '@angular/router';

@Injectable({
   providedIn: 'root'
})

export class CommonService {
   dialog?: SohoMessageRef;
   constructor(private userService: UserService, private messageService: SohoMessageService, private router: Router, private miService: MIService) { }

   showMessage(message: string) {
      const buttons = [{ text: 'OK', click: (e, modal) => { modal.close(); } }];
      this.messageService.alert()
         .title('Alert message')
         .message(message)
         .buttons(buttons)
         .open();
   }


   showSuccess(message: string) {
      const buttons = [{ text: 'OK', click: (e, modal) => { modal.close(); } }];
      this.messageService.alert()
         .title('Success!')
         .message(message)
         .buttons(buttons)
         .open();
   }

   showError(message: string, buttontext: string) {

      const buttons = [
         {
            text: buttontext, click: (_e: any, modal: any) => {
               modal.close(true); (this.dialog as any) = null;
            }, isDefault: true
         }
      ];

      this.dialog = this.messageService
         .error()
         .title('<span>Error</span>')
         .message(message)
         .buttons(buttons)
         .beforeOpen(() => {
            return true;
         })
         .beforeClose(() => {
            return true;
         })
         .open();
   }

   handleError(error?: any, msg?: string) {
      const buttons = [{ text: 'Ok', click: (e, modal) => { modal.close(); } }];
      this.messageService.error()
         .title('Error')
         .message(msg + ": " + error)
         .buttons(buttons)
         .open();
   }
}
