import { Component, OnInit } from '@angular/core';
import { ApiService} from '../sumag.service';
import { Archive } from '../Model/archive.model';
import { DomSanitizer, SafeHtml,SafeResourceUrl } from '@angular/platform-browser'; 
import { Video } from '../Model/videl.o.model';


@Component({
    selector: 'app-videotheque',
    templateUrl: './videotheque.component.html',
    styleUrl: './videotheque.component.css',
    standalone: false
})
export class VideothequeComponent implements OnInit {

  archives: Archive[] = [];
  groupedArchives: any[] = [];
  currentPage = 1;
  itemsPerPage = 9;  
  videos: Video[] = [];  
  videoContent: SafeHtml = ''; 
  lien: SafeResourceUrl = '';
  selectedVideo: any = null;
  videoALaUne: any | null = null; 
  searchTerm: string = ''; 
  filteredArchives: any[] = []; 
   


  constructor(private ApiService: ApiService, private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    this.loadArchives();
    this.loadVideoContent();
    
    
  }

  
  loadVideoContent(): void {
    this.ApiService.getVideo().subscribe((data: Video[]) => {
      this.videos = data; // Récupère toutes les vidéos depuis l'API
      // console.log(this.videos);
  
      if (this.videos && this.videos.length > 0) {
        // Définir la première vidéo comme "Vidéo à la une"
        this.videoALaUne = this.videos[0];
        this.videoContent = this.sanitizer.bypassSecurityTrustHtml(this.videoALaUne.contenu);
      }
    }, error => {
      //this.toastr.error('Erreur lors du chargement des parametres', error);
    });
  }
  
  // Méthode pour extraire l'ID YouTube de l'URL
  extractYouTubeId(url: string): string {
    const regex = /(?:youtube\.com\/(?:[^/]+\/[^/]+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches && matches[1] ? matches[1] : ''; // Retourne une chaîne vide si l'ID est introuvable
  }

  // Méthode pour vérifier si c'est une vidéo YouTube
  isYouTubeVideo(url: string): boolean {
    const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/[^/]+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  }
 

  selectVideo(event: Event, archive: any): void {
    event.preventDefault(); // Empêche l'action par défaut
    event.stopPropagation(); // Stoppe la propagation de l'événement
    this.videoALaUne = archive; // Met à jour la vidéo à la une
    this.videoContent = this.sanitizer.bypassSecurityTrustHtml(this.videoALaUne.contenu);
    //console.log(this.videoALaUne, 'ssssssssssssssssssss');
  }

  loadArchives(): void {
    this.ApiService.getVideo().subscribe(
      (data: any[]) => {
        this.archives = data;
        this.filteredArchives = [...this.archives]; // ✅ Initialise avec toutes les vidéos
        this.updatePagination(); // ✅ Mettre à jour l'affichage
      },
      (error) => {
        //console.error('Erreur lors du chargement des archives', error);
      }
    );
  }
  
  

 // Appliquer la pagination après le filtrage
updatePagination(): void {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  const paginated = this.filteredArchives.slice(startIndex, endIndex);

  this.groupedArchives = this.groupByThree(paginated);
}

groupByThree(arr: any[]): any[] {
  const grouped = [];
  for (let i = 0; i < arr.length; i += 3) {
    grouped.push(arr.slice(i, i + 3));
  }
  return grouped;
}

// Mettre à jour la pagination lors du changement de page
NextPage(): void {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.updatePagination();
  }
}

PreviousPage(): void {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.updatePagination();
  }
}


get totalPages(): number {
  return Math.ceil(this.filteredArchives.length / this.itemsPerPage);
}




// Fonction de filtrage
filterArchives(): void {
  if (!this.searchTerm) {
    this.filteredArchives = this.archives; // Pas de filtre
  } else {
    const lowerSearch = this.searchTerm.toLowerCase();
    this.filteredArchives = this.archives.filter(archive =>
      archive.titre.toLowerCase().includes(lowerSearch)
    );
  }
  this.currentPage = 1; // ✅ Revenir à la première page après filtrage
  this.updatePagination(); // ✅ Mettre à jour la pagination
}



sharePage(): void {
  if (navigator.share) {
      navigator.share({
          title: document.title,
          text: "Regarde cette page incroyable !",
          url: window.location.href
      }).then(() => console.log('Partage réussi'))
      .catch((error) => console.log('Erreur de partage', error));
  } else {
      alert("Le partage n'est pas supporté sur ce navigateur.");
  }
}

}
