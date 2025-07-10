import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { M3OdinModule } from '@infor-up/m3-odin-angular';
import { SohoComponentsModule } from 'ids-enterprise-ng';
import { DatePipe } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainPanelComponent } from './qms/main/main.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonService } from './services/common.service';
import { Log } from '@infor-up/m3-odin';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';
import { NestedModalDialogComponent } from './qms/modal/modal.component';
import { GradeModalDialogComponent } from './qms/modal/grademodal.component';
import { GradeModalPalletDialogComponent } from './qms/modal/grademodalpallet.component';
import { GradeReportDialogComponent } from './qms/modal/gradereport.component';

@NgModule({
   declarations: [
      AppComponent,
      MainPanelComponent,
      NestedModalDialogComponent,
      GradeModalDialogComponent,
      GradeModalPalletDialogComponent,
      GradeReportDialogComponent
   ],
   imports: [
      BrowserModule,
      FormsModule,
      SohoComponentsModule,
      AppRoutingModule,
      ReactiveFormsModule,
      CanvasJSAngularChartsModule,
      M3OdinModule
   ],
   providers: [
      DatePipe,
      [CommonService],
      {
         provide: LOCALE_ID,
         useValue: 'en-US',
      },
      {
         provide: APP_INITIALIZER,
         multi: true,
         useFactory: (locale: string) => () => {
            Soho.Locale.culturesPath = 'assets/ids-enterprise/js/cultures/';
            return Soho.Locale.set(locale).catch(err => {
               Log.error('Failed to set IDS locale', err);
            });
         },
         deps: [LOCALE_ID],
      }
   ],
   bootstrap: [AppComponent]
})
export class AppModule { }
