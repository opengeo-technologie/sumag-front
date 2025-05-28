import { Component } from '@angular/core';
import { ApiService } from '../sumag.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-footer',
  standalone: false,
  
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent  {


   constructor (private apiService: ApiService, private toastr: ToastrService) {}
  parametre: any = {};
  error: string | null = null; 

 


  ngOnInit(): void {

    this.loadParametres();  
  }


  loadParametres(): void {
    this.apiService.getParametres().subscribe({
      next: (parametres: any) => { // Utilisez 'any' ici également
        // this.toastr.success('Données de parametres recues');
        this.parametre = parametres;
        // console.log('parametres',parametres);
      },
      error: (err) => {
        this.toastr.error('Erreur lors du chargement des parametres', err);
        // console.log('Erreur lors du chargement des filtres', err);
      }
    });
  }
}
