import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MapComponent } from './map/map.component';
// import { AppComponent } from './app.component';
// import { LoginComponent } from './authentification/login/login.component';
import { HomeComponent } from './home/home.component';
import { DocuComponent } from './docu/docu.component';
import { VideothequeComponent } from './videotheque/videotheque.component';
// import { OcsComponent } from './ocs/ocs.component';
 import { AproposComponent } from './apropos/apropos.component';
 import { ForumComponent } from './forum/forum.component';

  
  const routes: Routes = [
    
     { path: '', component: HomeComponent }, 
     { path: 'documentation', component: DocuComponent },  
     { path: 'videotheque', component: VideothequeComponent },  
  //   { path: 'login', component: LoginComponent }, 
     { path: 'map', component: MapComponent }, 
     { path: 'Apropos', component: AproposComponent }, 
  //   { path: 'occupation_du_sol', component: OcsComponent }, 
     { path: 'communauté', component: ForumComponent }, 
   ];
  


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
