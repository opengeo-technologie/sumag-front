import { Component, OnInit } from '@angular/core';
import { ApiService } from '../sumag.service';
import { Publication } from '../Model/publication.models';
import { ToastrService } from 'ngx-toastr';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-docu',
  templateUrl: './docu.component.html',
  styleUrls: ['./docu.component.css'],
  standalone: false,
})
export class DocuComponent implements OnInit {
  publications: Publication[] = [];
  loading: boolean = true;
  selectedPublication: any;
  groupedPublications: { [type: string]: Publication[] } = {};
  Math = Math;
  searchTerm: string = ''; // Pour stocker le terme de recherche
  filteredPublications: Publication[] = []; // Pour stocker les publications filtrées
  isLoading: boolean = true;

  // Pagination pour les publications scientifiques
  currentPageByType: { [key: string]: number } = {};
  itemsPerPage = 12;

  constructor(
    private ApiService: ApiService,
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadPublications();
  }

  groupPublicationsByType(): void {
    this.groupedPublications = this.publications.reduce(
      (acc: { [key: string]: Publication[] }, pub: Publication) => {
        const type = pub.type; // Remplacez `type` par le champ réel qui représente le type dans `Publication`.
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(pub);
        return acc;
      },
      {}
    );
  }

  loadPublications(): void {
    this.ApiService.getPub().subscribe(
      (data: Publication[]) => {
        // console.log(data);
        this.publications = data;
        this.filteredPublications = [...this.publications]; // Initialiser avec toutes les publications
        this.groupPublicationsByType();
        this.initializePagination();
        this.toastr.success('Les publications ont bien été chargées');
        this.loading = false;
        this.isLoading = false;
        //console.log(this.publications);
      },
      (error) => {
        this.toastr.error('Erreur lors du chargement des publications', error);
        this.loading = false;
        this.isLoading = false;
      }
    );
  }

  // Méthode de filtrage des publications
  filterPublications(): void {
    if (!this.searchTerm) {
      console.log(
        'Aucun terme de recherche, affichage de toutes les publications'
      );
      this.filteredPublications = [...this.publications]; // Si pas de recherche, réinitialise aux données d'origine
    } else {
      const lowerSearch = this.searchTerm.toLowerCase();
      console.log('Recherche en cours pour:', lowerSearch);

      this.filteredPublications = this.publications.filter((pub) => {
        const matchTitre =
          pub.titre && pub.titre.toLowerCase().includes(lowerSearch);
        const matchAuteur =
          pub.auteur && pub.auteur.toLowerCase().includes(lowerSearch);
        const matchMotCle =
          pub.mot_cle && pub.mot_cle.toLowerCase().includes(lowerSearch);
        const matchNom = pub.nom && pub.nom.toLowerCase().includes(lowerSearch);

        console.log('Matches:', {
          titre: matchTitre,
          auteur: matchAuteur,
          mot_cle: matchMotCle,
          nom: matchNom,
        });

        return matchTitre || matchAuteur || matchMotCle || matchNom;
      });
    }

    console.log('Publications filtrées:', this.filteredPublications);

    this.groupPublicationsByType(); // Regroupe après filtrage
    this.initializePagination(); // Met à jour la pagination après filtrage
  }

  // Méthode d'initialisation de la pagination
  initializePagination(): void {
    for (const type in this.groupedPublications) {
      this.currentPageByType[type] = 1; // Initialisation de la première page
    }
  }

  // Méthode de récupération des publications paginées
  getPaginatedPublications(type: string): Publication[] {
    const publicationsByType = this.filteredPublications.filter(
      (pub) => pub.type === type
    ); // Filtrer par type
    const startIndex = (this.currentPageByType[type] - 1) * this.itemsPerPage;
    return publicationsByType.slice(startIndex, startIndex + this.itemsPerPage); // Appliquer la pagination
  }

  // Méthode de passage à la page suivante
  nextPage(type: string): void {
    const totalPages = this.totalPagesForType(type);
    if (this.currentPageByType[type] < totalPages) {
      this.currentPageByType[type]++;
    }
  }

  // Méthode de passage à la page précédente
  previousPage(type: string): void {
    if (this.currentPageByType[type] > 1) {
      this.currentPageByType[type]--;
    }
  }

  // Méthode pour obtenir le nombre total de pages pour chaque type de publication
  totalPagesForType(type: string): number {
    const publicationsByType = this.filteredPublications.filter(
      (pub) => pub.type === type
    ); // Filtrer par type
    return Math.ceil(publicationsByType.length / this.itemsPerPage); // Calculer les pages correctement
  }

  // Fonction pour ouvrir le modal
  openModal(publication: any): void {
    this.selectedPublication = publication;
  }

  downloadFile(fileUrl: string, fileName: string): void {
    if (!fileUrl) {
      this.toastr.error('URL du fichier invalide.');
      return;
    }

    // Extraire l'extension du fichier depuis l'URL (par exemple, .pdf)
    const fileExtension = fileUrl.split('.').pop(); // Récupère l'extension après le dernier point

    // Si l'extension est présente, ajouter au nom du fichier si ce n'est pas déjà le cas
    if (fileExtension) {
      fileName = `${fileName}.${fileExtension}`;
    } else {
      fileName += '.pdf'; // Par défaut, si l'extension n'est pas trouvée, on ajoute .pdf
    }

    // Créer un objet XMLHttpRequest pour obtenir le contenu du fichier
    const xhr = new XMLHttpRequest();
    xhr.open('GET', fileUrl, true);
    xhr.responseType = 'blob'; // On récupère le fichier sous forme de blob (binary large object)

    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = xhr.response; // Contenu du fichier
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob); // Créer une URL d'objet blob
        link.href = url;
        link.download = fileName; // Nom du fichier à télécharger, avec extension
        document.body.appendChild(link); // Ajouter le lien à la page
        link.click(); // Simuler un clic pour déclencher le téléchargement
        document.body.removeChild(link); // Retirer le lien du DOM

        // Libérer l'objet URL créé
        window.URL.revokeObjectURL(url);
      } else {
        this.toastr.error('Erreur lors du téléchargement du fichier.');
      }
    };

    xhr.onerror = () => {
      this.toastr.error('Erreur de réseau lors du téléchargement.');
    };

    xhr.send(); // Envoyer la requête pour récupérer le fichier
  }

  // Fonction pour obtenir les publications filtrées par type
  getFilteredPublicationsByType(type: string): Publication[] {
    const publicationsByType = this.groupedPublications[type] || [];
    if (!this.searchTerm.trim()) {
      return publicationsByType;
    }

    const lowerCaseSearchTerm = this.searchTerm.toLowerCase();

    return publicationsByType.filter(
      (pub) =>
        pub.titre.toLowerCase().includes(lowerCaseSearchTerm) ||
        pub.mot_cle.toLowerCase().includes(lowerCaseSearchTerm) ||
        pub.auteur.toLowerCase().includes(lowerCaseSearchTerm) ||
        pub.nom.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }
}
