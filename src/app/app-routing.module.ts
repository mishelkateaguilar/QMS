import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainPanelComponent } from "./qms/main/main.component";
import { ModuleWithProviders } from "@angular/core";

const routes: Routes = [
   { path: 'qms', component: MainPanelComponent },
   { path: '', redirectTo: '/qms', pathMatch: 'full' }
];

//@NgModule({
//   imports: [RouterModule.forRoot(routes, { useHash: true })],
//   exports: [RouterModule]
//})
export const AppRoutingModule: ModuleWithProviders<RouterModule> = RouterModule.forRoot(routes, { useHash: true, relativeLinkResolution: 'legacy' });
//export class AppRoutingModule { }
