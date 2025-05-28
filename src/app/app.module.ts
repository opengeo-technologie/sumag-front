import { NgModule,LOCALE_ID} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MapComponent } from './map/map.component';
import { HomeComponent } from './home/home.component';
import { DocuComponent } from './docu/docu.component';
import { VideothequeComponent } from './videotheque/videotheque.component';
import { HttpClientModule , HttpClientJsonpModule} from '@angular/common/http';
import { ThousandSeparatorPipe } from './thousand-separator.pipe';
import { TruncatePipe } from './truncate.pipe';
import { CapitalizeFirstPipe } from './capitalize-first.pipe';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { DecimalPipe } from '@angular/common';
import { SafeUrlPipe } from './safe-url.pipe';
import { AproposComponent } from './apropos/apropos.component';
import { ForumComponent } from './forum/forum.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { FooterComponent } from './footer/footer.component';
import { SquareMeterToKmPipe } from './square-meter-to-km.pipe';
import { SquareKiloPipe } from './square-kilo.pipe';




registerLocaleData(localeFr);

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    // LoginComponent,
    HomeComponent,
    DocuComponent,
    VideothequeComponent,
    // ThousandSeparatorPipe,
    TruncatePipe,
    CapitalizeFirstPipe,
    // OcsComponent,
    SafeUrlPipe,
    AproposComponent,
    ForumComponent,
    FooterComponent,
    SquareMeterToKmPipe,
    SquareKiloPipe,
    
      
    
  ],
  imports: [
    AppRoutingModule,  
    BrowserModule,
    HttpClientModule,
    HttpClientJsonpModule,
    FormsModule,
    BrowserAnimationsModule, 
    NgxPaginationModule, 
    ToastrModule.forRoot({
      timeOut: 3000,
      positionClass: 'toast-top-left',
      preventDuplicates: true,
    }) ,
    
    
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' },  // Configure la locale en français
    DecimalPipe, 
    ThousandSeparatorPipe,
    SquareMeterToKmPipe,
    SquareKiloPipe,
  ],
  bootstrap: [AppComponent]
  
})
export class AppModule { }

























