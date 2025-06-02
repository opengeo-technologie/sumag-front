import { Component, OnDestroy, OnInit } from '@angular/core';
import L from 'leaflet';
import 'leaflet-providers';
import 'leaflet-draw';
import { ToastrService } from 'ngx-toastr';
import { ApiService } from '../sumag.service';
import {
  MangroveResponse,
  CustomWMSParams,
  NbrAlerte,
} from '../Model/mangrove.model';
import { Renderer2 } from '@angular/core';
import { ThousandSeparatorPipe } from '../thousand-separator.pipe';
import { SurfaceTotaleAnnee } from '../Model/classe.model';
import { Chart, registerables } from 'chart.js';
import { SquareMeterToKmPipe } from '../square-meter-to-km.pipe';
import { SquareKiloPipe } from '../square-kilo.pipe';
import * as CanvasJS from '@canvasjs/charts';
import { interval } from 'rxjs';
declare var bootstrap: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  standalone: false,
})
export class MapComponent implements OnInit, OnDestroy {
  selectedIds: any;
  alertes: any;
  alertesMap: any;
  alertLayer: any;
  alertLayers: any;
  occupation: any;
  selectedAlertesDates: string[] = [];
  masque: any;
  statTabActive: boolean = false;
  globalStatActive: boolean = true;
  communes: any[] = [];
  selectedCommune: any;
  activeStatMangroves: boolean = true;
  activeStatAlerts: boolean = false;

  constructor(
    private apiService: ApiService,
    private toastr: ToastrService,
    private renderer: Renderer2,
    private two: ThousandSeparatorPipe,
    private squareMeterToKmPipe: SquareMeterToKmPipe,
    SquareKiloPipe: SquareKiloPipe
  ) {}

  private map!: L.Map;
  private drawnItems!: L.FeatureGroup;
  private drawControl: any;
  loading: boolean = false;
  public mangroveResponse!: MangroveResponse;
  public MangroveStats: any;
  FilterMangroveStats: any;
  public selectedMangrove: any;
  private previousSelectedLayer: L.Layer | null = null;
  error: string | null = null;
  dates: string[] = [];
  classe: {
    id: number;
    libelle: string;
    code_couleur: string;
    selected: boolean;
  }[] = [];
  especes: {
    id: number;
    libelle: string;
    code_couleur: string;
    selected: true;
  }[] = [];
  provinces: { id: number; nom: string }[] = [];
  selectedDate: string = '';
  selectedEspece: string = '';
  selectedProvince: string = '';
  private geoJsonLayer?: L.GeoJSON;
  public filteredMangroveData: any[] = [];
  public filteredMangroveDatas: any[] = [];
  selectedClassIds: number[] = [];
  selectedMangroveIds: number[] = [];
  isStatVisible = false;
  mangrove: any;
  mangroveLayers: { [key: number]: L.Layer } = {}; // Associer les calques aux IDs
  ClasseLayers: { [key: number]: L.Layer } = {};
  province: any;
  p: number = 1;
  dataAlerte: any;
  parametre: any = {};
  alertesIds: string[] = [];
  selectedYear: string = '';
  filteredDates: any[] = [];
  pagination: { [key: number]: number } = {};
  selectedDates: { [key: string]: boolean } = {};
  selectedAnnees: { [key: string]: boolean } = {};
  filteredMonths: any[] = [];
  selectedMonth: string = '';
  wmsLayers: Record<string, L.TileLayer.WMS> = {};

  ///////////// INITIALISATION     ///////////////////////////

  ngOnInit(): void {
    this.initMap();
    // this.autoLocateUser();
    this.loadFilterOptions1();
    this.loadFilterOptions();
    this.loadParametres();
    //this.loadClasses();
    this.loadDates();
    this.apiService.getCommunes().subscribe({
      next: (data) => {
        // console.log(data);
        this.communes = data;
        this.selectedCommune = data[0].id;
      },
    });

    Chart.register(...registerables);
    this.simulateSelectAllClick();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    // Initialisation de la carte Leaflet
    this.map = L.map('map', {
      center: [0.5, 9.7],
      zoom: 9,
      minZoom: 9,
      maxBounds: [
        [-0.5, 9], // Sud-Ouest
        [1.5, 11], // Nord-Est
      ],
      maxBoundsViscosity: 1.0,
    });

    // Définir les couches
    const osmLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          "OpenStreetMap © 2025 <a href='https://ageos.ga/'>AGEOS Gabon</a>",
      }
    );

    const satLayer = L.tileLayer.provider('Esri.WorldImagery', {
      attribution:
        "World Imagery © 2025 <a href='https://ageos.ga/'>AGEOS Gabon</a>",
    });

    const lightLayer = L.tileLayer.provider('CartoDB.Positron', {
      attribution: "© 2025 <a href='https://ageos.ga/'>AGEOS Gabon</a>",
    });

    const darkLayer = L.tileLayer.provider('CartoDB.DarkMatter', {
      attribution: "© 2025 <a href='https://ageos.ga/'>AGEOS Gabon</a>",
    });

    // Ajouter la couche par défaut
    satLayer.addTo(this.map);

    //Définir la couche WMS avec votre style et options

    this.masque = L.tileLayer.wms(
      'http://41.159.150.28:8080/geoserver/sco/wms',
      {
        layers: 'sco:mangroves',
        format: 'image/png',
        transparent: true,
      }
    );

    this.masque.addTo(this.map);
    this.masque.setZIndex(400);

    //Définir la couche WMS avec votre style et options

    this.mangrove = L.tileLayer.wms(
      'http://41.159.150.28:8080/geoserver/ageos_base/wms',
      {
        layers: 'ageos_base:mangroves_with_details',
        format: 'image/png',
        transparent: true,
        ...({ CQL_FILTER: '1=0' } as any),
      }
    );

    this.province = L.tileLayer.wms(
      'http://41.159.150.28:8080/geoserver/ageos_base/wms',
      {
        layers: 'ageos_base:province',
        format: 'image/png',
        transparent: true,
        ...({ CQL_FILTER: "nom='Estuaire'" } as any),
        styles: 'provinces',
      }
    );

    this.mangrove.addTo(this.map);
    this.mangrove.setZIndex(600);

    this.province.addTo(this.map);
    this.province.setZIndex(100);

    //Définir la couche WMS avec votre style et options
    this.occupation = L.tileLayer.wms(
      'http://41.159.150.28:8080/geoserver/ageos_base/wms',
      {
        layers: 'ageos_base:classe_with_details',
        format: 'image/png',
        transparent: true,
        ...({ CQL_FILTER: '1=0' } as any),
      }
    );

    this.occupation.addTo(this.map);
    this.occupation.setZIndex(500);

    // Contrôle pour basculer entre les fonds de carte
    L.control
      .layers({
        'Satellite (Esri)': satLayer,
        'Carte Light': lightLayer,
        'Carte Dark': darkLayer,
        'Plan OSM': osmLayer,
      })
      .addTo(this.map);

    // Initialisation des couches de dessin
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Configuration des contrôles de dessin
    this.drawControl = new L.Control.Draw({
      edit: {
        featureGroup: this.drawnItems,
      },
      draw: {
        polygon: {
          icon: new L.DivIcon({
            iconSize: new L.Point(8, 8),
            className: 'leaflet-div-icon leaflet-editing-icon',
          }),
          allowIntersection: false,
          shapeOptions: {
            color: '#0091ea',
            weight: 1,
          },
        },
      },
    });

    // Ajouter les contrôles de dessin à la carte
    this.map.addControl(this.drawControl);

    //Vérifier si L.Draw.Event est disponible avant de l'utiliser
    if (L.Draw && L.Draw.Event) {
      // Écouter l'événement 'draw:created'
      this.map.on(L.Draw.Event.CREATED, (event: any) => {
        const layer = event.layer;
        const layerType = event.layerType; // Vérifier le type du layer

        // Si le type de layer est un polygone, on applique le filtre
        if (layerType === 'polygon') {
          const coordinates = layer.toGeoJSON().geometry.coordinates[0];

          // Ajouter le polygone dessiné au groupe drawnItems
          this.drawnItems.addLayer(layer);

          // Appeler la méthode `filterMangroves` avec les coordonnées du polygone
          this.filterMangroves(coordinates);

          // Ajouter le polygone dessiné sur la carte
          layer.addTo(this.map);
        }
        // Si ce n'est pas un polygone (ex. une ligne ou un autre objet), on garde simplement le dessin
        else {
          // Ajouter le dessin sur la carte sans appliquer le filtre
          this.drawnItems.addLayer(layer);
          layer.addTo(this.map);
        }
      });
    } else {
      console.error("L.Draw ou L.Draw.Event n'est pas disponible");
    }
  }

  selectedTab(tab: number): void {
    if (tab == 1) {
      this.statTabActive = true;
      this.displayChartAnneeMangroveEstuaire();
      // this.displayChartAnnee();
      // this.displayAlerteAnnee();
      // this.displayEspeceProvinceAnnee();
      this.displayEspeceAnnee();
      this.displayChartArrondissement();
    } else {
      this.statTabActive = false;
    }
  }

  activateTab(tabId: string) {
    const triggerEl = document.getElementById(tabId);
    if (triggerEl) {
      const tabTrigger = new bootstrap.Tab(triggerEl);
      tabTrigger.show();
    }
  }

  // Faire un focus sur la localisation de l'utilisateur
  private autoLocateUser(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: L.LatLngExpression = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          this.map.flyTo(userCoords, 14, { animate: true, duration: 2 });
          L.marker(userCoords)
            .addTo(this.map)
            .bindPopup('You are here')
            .openPopup();
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              alert(
                'Location access was denied. Please enable it in browser settings.'
              );
              break;
            case error.POSITION_UNAVAILABLE:
              alert('Location information is unavailable.');
              break;
            case error.TIMEOUT:
              alert('Location request timed out. Try again.');
              break;
            default:
              alert('An unknown error occurred.');
              break;
          }
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds timeout
          maximumAge: 0,
        }
      );
    } else {
      alert('Geolocation is not supported on this device.');
    }
  }

  //Charger les parametres
  loadParametres(): void {
    this.apiService.getParametres().subscribe({
      next: (parametres: any) => {
        // Utilisez 'any' ici également
        // this.toastr.success('Données de parametres recues');
        this.parametre = parametres;
        // console.log('parametres',parametres);
      },
      error: (err) => {
        this.toastr.error('Erreur lors du chargement des parametres', err);
        // console.log('Erreur lors du chargement des filtres', err);
      },
    });
  }

  /////////////////////////////////      FIN DE L'INITIALISATION          ////////////////////////////////

  /////////////////////////////////  METHODE POUR L'OCCUPATION DU SOL     ///////////////////////////////////

  filterClass(): void {
    if (this.selectedClassIds.length === 0) {
      if (this.occupation) {
        this.occupation.setParams({ CQL_FILTER: '1=0' });
      }
      return;
    }

    const cqlFilter = `classe_id IN (${this.selectedClassIds.join(',')})`;

    if (this.occupation) {
      this.occupation.setParams({ CQL_FILTER: cqlFilter });
    }
  }

  // Fonction pour gérer les changements d'état des cases individuelles d'occupation du sol
  onOccupationCheckChange(c: any): void {
    // console.log('Selected IDs before change:', this.selectedClassIds);

    if (c.selected) {
      // Ajouter l'ID de la mangrove au tableau si la case est cochée
      if (!this.selectedClassIds.includes(c.id)) {
        this.selectedClassIds.push(c.id);
        // this.desOcc()
        // Appel de la méthode toggleAllOccupations pour forcer la désélection des cases "Occupation du sol"
        //this.toggleAllMangroves({ target: { checked: false } });
      }
    } else {
      // Retirer l'ID de la mangrove si la case est décochée
      this.selectedClassIds = this.selectedClassIds.filter((id) => id !== c.id);
    }

    // console.log('Updated Selected IDs:', this.selectedClassIds);

    // Mettre à jour l'état de la case principale en fonction des cases enfants
    this.updateSelectAllCheckbox1();

    // Effectuer l'appel API pour récupérer les données filtrées
    this.filterClass();
  }

  // Fonction pour gérer la sélection/désélection de toutes les cases de mangroves (toggle)
  toggleAllOccupations(event: any): void {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll(
      '#subItemtwo input[type="checkbox"]'
    );
    // console.log('Nombre de cases trouvées :', checkboxes.length);

    // Mettre à jour les cases à cocher
    checkboxes.forEach((checkbox: Element) => {
      const inputCheckbox = checkbox as HTMLInputElement;
      inputCheckbox.checked = isChecked;

      const classId = parseInt(inputCheckbox.value, 10);
      if (!isNaN(classId)) {
        if (isChecked && !this.selectedClassIds.includes(classId)) {
          this.selectedClassIds.push(classId); // Ajouter l'ID si la case est cochée
          // this.desOcc()
          //this.toggleAllMangroves({ target: { checked: false } });
        } else if (!isChecked) {
          this.selectedClassIds = this.selectedClassIds.filter(
            (id) => id !== classId
          ); // Retirer l'ID si la case est décochée
        }
      }
    });

    // Si des IDs sont sélectionnés, lancer la requête de filtrage
    this.filterClass();
  }

  // Fonction pour mettre à jour l'état de la case principale
  updateSelectAllCheckbox1(): void {
    const checkboxes = document.querySelectorAll(
      '#subItemtwo input[type="checkbox"]'
    );
    const selectAllCheckbox = document.querySelector(
      '#selectAllCheckboxs'
    ) as HTMLInputElement; // ID de la case principale

    // Vérifier si toutes les cases sont cochées
    const allChecked = Array.from(checkboxes).every((checkbox: Element) => {
      const inputCheckbox = checkbox as HTMLInputElement;
      return inputCheckbox.checked;
    });

    // Si toutes les cases sont cochées, cochez la case principale
    if (allChecked) {
      selectAllCheckbox.checked = true;
    } else {
      selectAllCheckbox.checked = false; // Si une ou plusieurs cases sont décochées, décochez la case principale
    }
  }

  // Méthode pour recuperer les options de filtrages
  loadFilterOptions1(): void {
    this.apiService.getFilterOptions1().subscribe({
      next: (data: any) => {
        this.dates = data.dates || [];
        this.classe = data.classes || [];
        this.provinces = data.provinces || [];
        // Trier les dates
        if (this.dates.length > 0) {
          this.dates.sort(
            (a: string, b: string) =>
              new Date(a).getTime() - new Date(b).getTime()
          );
          this.selectedDate = this.dates[this.dates.length - 1];
        }
        // Message si les filtres sont vides
        if (
          this.dates.length < 1 &&
          this.classe.length < 1 &&
          this.provinces.length < 1
        ) {
          this.toastr.info('Aucune donnée trouvée pour les filtres.');
        }
      },
      error: (error) => {
        this.toastr.error(
          'Erreur lors du chargement des filtres : ' +
            (error.message || 'Erreur inconnue')
        );
      },
    });
  }

  // Methode pour filter par annee, classe
  applyFilters1(): void {
    this.loading = true;

    this.apiService
      .filterData1(
        this.selectedDate,
        this.selectedEspece,
        this.selectedProvince
      )
      .subscribe({
        next: (filteredData) => {
          this.loading = false;
          // console.log(filteredData)

          // Vérification si les données sont vides
          if (filteredData.length === 0) {
            this.toastr.info('Aucune donnée trouvée');
            this.loading = false;
            return;
          }

          // Utiliser Renderer2 pour accéder à l'élément et modifier son contenu
          const surr = this.two.transform(filteredData.total_surface);
          const totalSurfaceElement = document.getElementById('total_surface1');
          if (totalSurfaceElement) {
            this.renderer.setProperty(
              totalSurfaceElement,
              'innerText',
              ` ${surr} `
            );
          }

          const mgElement = document.getElementById('mg');
          if (mgElement) {
            this.renderer.setProperty(
              mgElement,
              'innerText',
              ` ${filteredData.nbr_infras} `
            );
          }

          // Ajouter les mangroves à la carte
          const geoJsonData = filteredData.polygones;
          //this.addClassesToMap(geoJsonData);
        },
        error: (err) => {
          this.toastr.error('Erreur lors du filtrage des données', err);
          this.loading = false;
        },
      });
  }

  ////////////////// FIN DES METHODES D'OCCUPATION DU SOL  ////////////////////////

  /////////////////////         METHODE POUR LES MANGROVES     //////////////////////////////////////////////

  simulateSelectAllClick(): void {
    setTimeout(() => {
      const button = document.querySelector(
        '#selectAllCheckbox'
      ) as HTMLInputElement;
      if (button) {
        button.click();
      }
    }, 700);
  }

  // Fonction pour gérer la sélection/désélection de toutes les cases de mangroves (toggle)
  toggleAllMangroves(event: any): void {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll(
      '#subItemOne input[type="checkbox"]'
    );
    // console.log('Nombre de cases trouvées :', checkboxes.length);

    // Mettre à jour les cases à cocher
    checkboxes.forEach((checkbox: Element) => {
      const inputCheckbox = checkbox as HTMLInputElement;
      inputCheckbox.checked = isChecked;

      const mangroveId = parseInt(inputCheckbox.value, 10);
      if (!isNaN(mangroveId)) {
        if (isChecked && !this.selectedMangroveIds.includes(mangroveId)) {
          this.selectedMangroveIds.push(mangroveId); // Ajouter l'ID si la case est cochée
          // this.desMa()
          //this.toggleAllOccupations({ target: { checked: false } });
        } else if (!isChecked) {
          this.selectedMangroveIds = this.selectedMangroveIds.filter(
            (id) => id !== mangroveId
          ); // Retirer l'ID si la case est décochée
        }
      }
    });

    // console.log('IDs sélectionnés après le changement de toggle:', this.selectedMangroveIds);

    // Si des IDs sont sélectionnés, lancer la requête de filtrage
    this.filterMangrove();
  }

  // Fonction pour gérer les changements d'état des cases individuelles des mangroves
  onMangroveCheckChange(c: any): void {
    // console.log('Selected IDs before change:', this.selectedMangroveIds);

    if (c.selected) {
      // Ajouter l'ID de la mangrove au tableau si la case est cochée
      if (!this.selectedMangroveIds.includes(c.id)) {
        this.selectedMangroveIds.push(c.id);
        // this.desMa()
        // Appel de la méthode toggleAllOccupations pour forcer la désélection des cases "Occupation du sol"
        //this.toggleAllOccupations({ target: { checked: false } });
      }
    } else {
      // Retirer l'ID de la mangrove si la case est décochée
      this.selectedMangroveIds = this.selectedMangroveIds.filter(
        (id) => id !== c.id
      );
    }

    // console.log('Updated Selected IDs:', this.selectedMangroveIds);

    // Mettre à jour l'état de la case principale en fonction des cases enfants
    this.updateSelectAllCheckbox();

    // Effectuer l'appel API pour récupérer les données filtrées
    this.filterMangrove();
  }

  // Fonction pour mettre à jour l'état de la case principale
  updateSelectAllCheckbox(): void {
    const checkboxes = document.querySelectorAll(
      '#subItemOne input[type="checkbox"]'
    );
    const selectAllCheckbox = document.querySelector(
      '#selectAllCheckbox'
    ) as HTMLInputElement; // ID de la case principale

    // Vérifier si toutes les cases sont cochées
    const allChecked = Array.from(checkboxes).every((checkbox: Element) => {
      const inputCheckbox = checkbox as HTMLInputElement;
      return inputCheckbox.checked;
    });

    // Si toutes les cases sont cochées, cochez la case principale
    if (allChecked) {
      selectAllCheckbox.checked = true;
    } else {
      selectAllCheckbox.checked = false; // Si une ou plusieurs cases sont décochées, décochez la case principale
    }
  }

  //Fonction pour filtrer les mangroves en fonction des IDs sélectionnés

  filterMangrove(): void {
    // Vérifie si des IDs sont sélectionnés
    if (this.selectedMangroveIds.length === 0) {
      if (this.mangrove) {
        this.mangrove.setParams({ CQL_FILTER: '1=0' }); // Si aucun filtre, ne rien afficher
      }
      return;
    }

    // Construire le filtre CQL basé sur les IDs sélectionnés
    const cqlFilter = `type_id IN (${this.selectedMangroveIds.join(',')})`;
    //console.log("Filtrage des mangroves avec CQL_FILTER: ", cqlFilter);

    // Met à jour uniquement le `CQL_FILTER` de la couche sans la recréer
    if (this.mangrove) {
      this.mangrove.setParams({ CQL_FILTER: cqlFilter });
    }
  }

  // Méthode pour filtrer les mangroves par géométrie
  filterMangroves(coordinates: number[][]): void {
    if (!coordinates || coordinates.length === 0) {
      this.toastr.warning(
        'Veuillez fournir des coordonnées pour filtrer les mangroves.'
      );
      return;
    }
    // Récupérer la valeur de la date sélectionnée
    const date = this.selectedDate || '';
    const dates = this.selectedYear || '';
    console.log(dates);
    console.log(date);

    this.loading = true;
    this.activateTab('#statistiques');
    this.selectedTab(1);
    this.globalStatActive = false;
    this.apiService
      .filterMangrovesByGeometry(coordinates, date, dates)
      .subscribe(
        (data) => {
          this.loading = false;
          console.log(data);
          this.filteredMangroveData = data.mangroves;
          this.filteredMangroveDatas = data.alertes;

          // Gestion des classes actives
          // const statElement = document.getElementById('stat');
          // const occElement = document.getElementById('occ');

          // if (statElement) {
          //   statElement.classList.add('active');
          // }
          // if (occElement) {
          //   occElement.classList.remove('active');
          // }

          this.toastr.success('Données de mangrove filtrées avec succès.');
        },
        (error) => {
          this.loading = false;
          // console.error('Erreur lors du filtrage des mangroves:', error);
          this.toastr.error('Erreur lors du filtrage des mangroves:', error);
        }
      );
  }

  // Méthode pour recuperer les options de filtrage
  loadFilterOptions(): void {
    this.apiService.getFilterOptions().subscribe(
      (data: any) => {
        this.dates = data.dates || [];
        this.especes = data.especes || [];
        this.provinces = data.provinces || [];

        // Trier les dates par ordre croissant et sélectionner la dernière date
        if (this.dates.length > 0) {
          this.dates.sort(
            (a: string, b: string) =>
              new Date(a).getTime() - new Date(b).getTime()
          );
          this.selectedDate = this.dates[this.dates.length - 1]; // Dernière date
        }

        // Vérifier si tous les filtres sont vides
        if (
          this.dates.length < 1 &&
          this.especes.length < 1 &&
          this.provinces.length < 1
        ) {
          this.toastr.info('Aucune donnée trouvée pour les filtres.');
          console.log('date: ' + this.selectedDate);
        }
      },
      (error) => {
        this.toastr.error(
          'Erreur lors du chargement des filtres : ' +
            (error.message || 'Erreur inconnue')
        );
      }
    );
  }

  applyFilters(): void {
    if (!this.selectedDate && !this.selectedEspece && !this.selectedProvince) {
      // Si aucun filtre n'est sélectionné, supprimer la couche WMS si elle existe
      if (this.mangrove) {
        this.map.removeLayer(this.mangrove);
        this.mangrove = undefined;
      }
      return;
    }

    // Construire le filtre CQL dynamiquement
    const filters = [];
    if (this.selectedDate) filters.push(`date='${this.selectedDate}'`);
    if (this.selectedEspece) filters.push(`type_id='${this.selectedEspece}'`);
    if (this.selectedProvince)
      filters.push(`province='${this.selectedProvince}'`);

    const cqlFilter = filters.length > 0 ? filters.join(' AND ') : '';
    //console.log("Filtrage des mangroves avec CQL_FILTER: ", cqlFilter);

    // Définir la BBOX pour recentrer la carte
    const bbox = [
      9.31729806700002, -0.074224228999924, 9.98641718600004, 0.816014981000023,
    ];
    this.map.fitBounds([
      [bbox[1], bbox[0]],
      [bbox[3], bbox[2]],
    ]);

    // URL du service WMS de GeoServer
    const wmsUrl = 'http://41.159.150.28:8080/geoserver/ageos_base/wms';

    // Définition des paramètres WMS
    const wmsParams: Record<string, string> = {
      service: 'WMS',
      version: '1.1.0',
      request: 'GetMap',
      layers: 'ageos_base:mangroves_with_details',
      format: 'image/png',
      transparent: 'true',
      CQL_FILTER: cqlFilter, // Applique les filtres
    };

    // Supprimer l'ancienne couche WMS si elle existe
    if (this.mangrove) {
      this.map.removeLayer(this.mangrove);
    }

    // Ajouter la nouvelle couche WMS avec les filtres
    this.mangrove = L.tileLayer.wms(wmsUrl, wmsParams);
    this.mangrove.addTo(this.map);
  }

  ////////////////// FIN DES METHODES DE MANGROVES  /////////////////////

  ////////////////////////////// STATISTIQUES /////////////////////////////////

  // Méthode pour activer le mode de dessin de polygones
  drawPolygon(): void {
    const polygonButton = document.querySelector(
      '.leaflet-draw-draw-polygon'
    ) as HTMLButtonElement;
    if (polygonButton) {
      polygonButton.click();
    } else {
      // console.error('Bouton de dessin de polygone non trouvé');
    }
  }

  MesureDistance(): void {
    const polygonButton = document.querySelector(
      '.leaflet-draw-draw-polyline'
    ) as HTMLButtonElement;
    if (polygonButton) {
      polygonButton.click();
    } else {
      // console.error('Bouton de dessin de polygone non trouvé');
    }
  }

  //Bouton pour fermer longlet stat
  close() {
    // Gestion des classes actives
    const statElement = document.getElementById('stat');
    const occElement = document.getElementById('occ');

    if (statElement) {
      statElement.classList.remove('active');
    }
    if (occElement) {
      occElement.classList.add('active');
    }
  }

  // Methode pour netoyer la carte
  removeMap(): void {
    // Supprimer tous les polygones dessinés (s'ils existent)
    if (this.drawnItems) {
      this.drawnItems.clearLayers();
    }
    // Gestion des classes actives
    const statElement = document.getElementById('stat');
    const occElement = document.getElementById('occ');

    if (statElement) {
      statElement.classList.remove('active');
    }
    if (occElement) {
      occElement.classList.add('active');
    }
  }

  /////////////////////////// ALERTES //////////////////////////////

  onAlertesCheckChange(event: any, item: any, isParent: boolean = false) {
    // Si la case est parent (année)
    if (isParent) {
      // Vérifier si la case parent (année) est cochée ou décochée
      if (event.target.checked) {
        // Si la case parent est cochée, ajouter toutes les dates associées dans selectedDates
        item.date.forEach((date: string) => {
          this.selectedDates[date] = true; // Ajouter la date dans le tableau des dates sélectionnées
        });
      } else {
        // Si la case parent est décochée, supprimer toutes les dates associées de selectedDates
        item.date.forEach((date: string) => {
          delete this.selectedDates[date]; // Retirer la date du tableau des dates sélectionnées
        });
      }
    } else {
      // Si la case est enfant (date)
      this.selectedDates[item] = event.target.checked; // Ajouter ou supprimer la date individuelle
    }

    // Appliquer un filtre ou une autre action après avoir mis à jour les sélections
    this.filterAlertes();
    //this.showSelectedDates();
  }

  // Cette méthode va être appelée quand tu veux filtrer les alertes
  filterAlertes(): void {
    // Récupérer les dates sélectionnées
    const selectedDates = Object.keys(this.selectedDates).filter(
      (date) => this.selectedDates[date]
    );
    //console.log("Dates sélectionnées : ", selectedDates);

    // Vérifie si des dates sont sélectionnées
    if (selectedDates.length === 0) {
      // Si aucune date n'est sélectionnée, on peut quitter ou appliquer un autre comportement (par exemple, afficher toutes les alertes)
      //console.log("Aucune date sélectionnée.");
      this.map.removeLayer(this.alertesMap);
    }

    // Construire le filtre CQL
    const cqlFilter = `dates IN (${selectedDates
      .map((date) => `'${date}'`)
      .join(',')})`;
    //console.log("Filtre CQL : ", cqlFilter);

    // Appeler la fonction qui interroge GeoServer avec ce filtre
    this.getAlertesFromGeoServer(cqlFilter);
  }

  // Fonction pour interroger GeoServer avec le filtre CQL
  getAlertesFromGeoServer(cqlFilter: string): void {
    const wmsUrl = 'http://41.159.150.28:8080/geoserver/ageos_base/wms';
    // const bbox = [9.31291919056827,-0.101950225422513,10.1963288410033,1.02885613540235];

    // this.map.fitBounds([
    //   [bbox[1], bbox[0]],
    //   [bbox[3], bbox[2]],
    // ]);

    const wmsParams: Record<string, string> = {
      service: 'WMS',
      version: '1.1.0',
      request: 'GetMap',
      layers: 'ageos_base:Alerte',
      format: 'image/png',
      transparent: 'true',
      CQL_FILTER: cqlFilter,
    };

    //console.log("URL WMS : ", `${wmsUrl}?${new URLSearchParams(wmsParams).toString()}`);

    if (this.alertesMap) {
      this.map.removeLayer(this.alertesMap);
    }

    this.alertesMap = L.tileLayer.wms(wmsUrl, wmsParams);
    console.log(this.alertesMap);
    this.alertesMap.addTo(this.map);
    this.alertesMap.setZIndex(700);
  }

  toggleAllAlertes(event: any): void {
    const isChecked = event.target.checked;
    const checkboxes = document.querySelectorAll(
      '#subItemtrie input[type="checkbox"]'
    );

    checkboxes.forEach((checkbox: Element) => {
      const inputCheckbox = checkbox as HTMLInputElement;
      inputCheckbox.checked = isChecked;

      const AlerteDate = inputCheckbox.value;
      if (isChecked && !this.selectedAlertesDates.includes(AlerteDate)) {
        this.selectedAlertesDates.push(AlerteDate);
      } else if (!isChecked) {
        this.selectedAlertesDates = [];
      }
    });

    //this.filterAlertes();
  }

  onYearChange(event: any) {
    this.selectedYear = event.target.value;

    if (this.selectedYear) {
      this.filteredDates = this.alertes.filter(
        (alert: any) => alert.annee.toString() === this.selectedYear
      );

      const moisNoms = [
        'Janvier',
        'Février',
        'Mars',
        'Avril',
        'Mai',
        'Juin',
        'Juillet',
        'Août',
        'Septembre',
        'Octobre',
        'Novembre',
        'Décembre',
      ];

      this.filteredMonths = [
        ...new Set(
          this.filteredDates
            .flatMap((alert: any) =>
              alert.date.map((d: string) => {
                if (typeof d === 'string' && d.includes('-')) {
                  const monthIndex = parseInt(d.split('-')[1], 10) - 1; // Convertir '01' en 0, '02' en 1...
                  return moisNoms[monthIndex]; // Retourner le nom du mois
                } else {
                  // console.warn("Date incorrecte ou manquante:", d);
                  return null;
                }
              })
            )
            .filter((mois) => mois !== null)
        ),
      ];

      // console.log("Mois filtrés:", this.filteredMonths);
    } else {
      this.filteredMonths = [];
    }
  }

  onMonthChange(event: any) {
    this.selectedMonth = event.target.value;

    //console.log('Mois sélectionné:', this.selectedMonth);  // Log pour vérifier le mois sélectionné

    if (this.selectedMonth) {
      // Filtrer les alertes par année et mois
      this.filteredDates = this.alertes
        .filter((alert: any) => alert.annee.toString() === this.selectedYear)
        .map((alert: any) => ({
          ...alert,
          // Vérifier le format de date et filtrer par mois
          date: alert.date.filter((date: string) => {
            const alertMonth = new Date(date)
              .toLocaleString('fr-FR', { month: 'long' })
              .toLowerCase(); // Normaliser en minuscule
            // console.log('Mois de la date:', alertMonth, 'Mois sélectionné:', this.selectedMonth.toLowerCase());  // Log des mois comparés
            return alertMonth === this.selectedMonth.toLowerCase(); // Comparaison en minuscule
          }),
        }))
        .filter((alert: any) => alert.date.length > 0); // Ne garder que les alertes avec des dates valides

      //console.log('Alertes après filtre par mois:', this.filteredDates);  // Log pour vérifier les alertes après filtre
    } else {
      // Si aucun mois n'est sélectionné, réinitialiser les dates
      this.filteredDates = this.alertes.filter(
        (alert: any) => alert.annee.toString() === this.selectedYear
      );
    }
  }

  // Charger les données
  loadDates(): void {
    this.apiService.getDates().subscribe((data: any[]) => {
      this.alertes = data;

      // Vérifier les données reçues
      // console.log("Alertes données:", this.alertes);

      // Extraire toutes les années présentes dans les alertes
      const validYears: number[] = this.alertes.map(
        (alert: any) => alert.annee
      );
      // console.log("Années extraites:", validYears);

      // Par défaut, afficher la dernière année (la plus récente)
      const latestYear = Math.max(...validYears);
      this.selectedYear = latestYear.toString();
      // console.log("Dernière année:", this.selectedYear);

      // Filtrer les alertes pour la dernière année
      this.filteredDates = this.alertes.filter(
        (alert: any) => alert.annee.toString() === this.selectedYear
      );

      // Extraire les mois distincts pour la dernière année
      this.filteredMonths = this.filteredDates
        .flatMap((alert: any) =>
          alert.date.map((date: string) =>
            new Date(date).toLocaleString('default', { month: 'long' })
          )
        )
        .filter(
          (month: string, index: number, self: string[]) =>
            self.indexOf(month) === index
        ); // Mois distincts
      //  console.log("Mois extraits:", this.filteredMonths);
    });
  }

  // Méthode appelée lors du changement de sélection
  onGetAlertes(date: string) {
    // console.log('Date sélectionnée:', date);

    // Appel API pour récupérer les alertes par date
    this.apiService.getAlertesByDate(date).subscribe(
      (data) => {
        // console.log('Alertes reçues:', data);

        if (data && data.features) {
          if (this.mangrove) {
            this.map.removeLayer(this.mangrove);
          }

          // Si des alertes pour cette date existent déjà, ne pas les ajouter à nouveau
          if (this.alertesMap[date]) {
            // console.log('Alertes déjà ajoutées pour cette date:', date);
            return;
          }

          // Créer un nouveau LayerGroup pour les alertes de cette date
          const geojsonLayer = L.geoJSON(data.features, {
            onEachFeature: (feature, layer) => {
              // Ajouter des comportements pour chaque alerte
              layer.on('click', () => {
                // console.log(feature.properties);  // Exemple d'action au clic
              });
            },
            style: (feature) => {
              // Appliquer un style personnalisé à chaque polygone
              return {
                color: '#800000',
                weight: 3,
              };
            },
          });

          // Ajouter la couche au LayerGroup pour cette date
          this.alertesMap[date] = geojsonLayer;
          geojsonLayer.addTo(this.map); // Ajouter à la carte

          // Mettre à jour les IDs des alertes
          this.alertesIds = data.features.map((feature: any) => feature.id);
        }
      },
      (error) => {
        this.toastr.error('Erreur lors de la récupération des alertes', error);
      }
    );
  }

  // Méthode pour ajouter les alertes à la carte
  addAlertesToMap() {
    // Vérifier si on a des alertes à afficher
    if (this.alertes && this.alertes.length > 0) {
      if (this.mangrove) {
        this.map.removeLayer(this.mangrove);
      }
      const layer = L.geoJSON(this.alertes, {
        onEachFeature: (feature, layer) => {
          const originalColor = feature.properties?.code_couleur || '#FF69B4';

          // Gestion des événements pour chaque entité
          layer.on('mouseover', () => {
            layer
              .bindPopup(
                `
              <p>Description : ${feature.properties?.description}</p>
              <p>Type : ${feature.properties?.type}</p>
              <p>Surface : ${feature.properties?.surface} m²</p>
            `
              )
              .openPopup();
          });

          layer.on('mouseout', () => {
            layer.closePopup();
          });

          layer.on('click', () => {
            // Réinitialiser la couleur de la dernière mangrove sélectionnée
            if (this.previousSelectedLayer) {
              (this.previousSelectedLayer as L.Path).setStyle({
                color: originalColor,
              });
            }

            // Changer la couleur de la mangrove actuelle
            (layer as L.Path).setStyle({ color: '#FF0000' }); // Couleur sélectionnée
            this.previousSelectedLayer = layer; // Mettre à jour la couche sélectionnée
          });
        },
        style: (feature) => {
          const color = feature?.properties?.code_couleur || '#FF69B4';
          return {
            color: color,
            weight: 2,
            opacity: 1,
            fillOpacity: 0.5,
          };
        },
      });

      layer.addTo(this.map);
      this.alertLayer = layer; // Garder une référence du calque
    }
  }

  // Méthode pour retirer les alertes d'une date donnée
  removeAlertesByDate(date: string) {
    // console.log('Suppression des alertes pour la date:', date);

    // Vérifier si les alertes pour cette date existent
    if (this.alertesMap[date]) {
      // Supprimer les alertes de la carte
      this.alertesMap[date].clearLayers();
      delete this.alertesMap[date]; // Supprimer de la carte de suivi
    }
  }

  onCheckboxChange(event: Event, date: string) {
    const isChecked = (event.target as HTMLInputElement).checked;
    // console.log('Checkbox changé, état:', isChecked, 'pour la date:', date);

    if (isChecked) {
      this.onGetAlertes(date); // Si coché, charger les alertes
    } else {
      this.removeAlertesByDate(date); // Si décoché, supprimer les alertes
    }
  }

  //////////////////// STATISTICS //////////////////

  showStat() {
    this.isStatVisible = true;
  }

  showMap() {
    this.isStatVisible = false; // Affiche la carte
  }

  renameKeys(
    dictionary: { [key: string]: any },
    keyMap: { [key: string]: string }
  ): { [key: string]: any } {
    const renamedDictionary: { [key: string]: any } = {};
    for (const oldKey in dictionary) {
      if (dictionary.hasOwnProperty(oldKey)) {
        const newKey = keyMap[oldKey] || oldKey;
        renamedDictionary[newKey] = dictionary[oldKey];
      }
    }
    return renamedDictionary;
  }

  renameAllKeys(
    list: { [key: string]: any }[],
    keyMap: { [key: string]: string }
  ): { [key: string]: any }[] {
    return list.map((dictionary) => this.renameKeys(dictionary, keyMap));
  }

  displayChartAnnee(): void {
    this.apiService.getSurfaceTotaleAnnee().subscribe({
      next: (data: SurfaceTotaleAnnee[]) => {
        // Extraire les années uniquement pour les labels
        const labels = data.map((item) =>
          new Date(item.date).getFullYear().toString()
        );
        //const surfaces = data.map((item) => item.surface_totale);
        const surfaces = data.map((item) =>
          this.squareMeterToKmPipe.transform(item.surface_totale)
        );

        // console.log(data);

        const keyMap = {
          date: 'label',
          surface_totale: 'y',
        };

        let chartData = this.renameAllKeys(data, keyMap);

        chartData = chartData.map((dictionary) => {
          dictionary['label'] = new Date(dictionary['label'])
            .getFullYear()
            .toString();
          dictionary['y'] = Number(
            this.squareMeterToKmPipe.transform(dictionary['y']).toFixed(2)
          );
          return dictionary;
        });

        // console.log(chartData);

        // Créer un nouveau graphique
        const chart = new CanvasJS.Chart('sup-annee', {
          width: 400,
          height: 300,
          animationEnabled: true,
          title: {
            text: "Superficie totale des especes de mangrove par de l'estuaire",
            fontSize: 16,
          },

          axisX: {
            title: 'Année',
            fontSize: 12,
            // interval: 1,
            intervalType: 'year',
            // valueFormatString: 'YYYY',
            labelFormater: function (e: any) {
              return new Date(e.value).getFullYear().toString();
            },
          },
          axisY: {
            title: 'Superficie en km²',
            fontSize: 12,
            gridThickness: 0,
            tickLength: 0,
            // includeZero: true,
          },
          dataPointWidth: Math.round(180 / chartData.length),
          data: [
            {
              type: 'bar',
              toolTipContent:
                'Année: <b>{label}</b><br>Superficie: <b>{y} km²</b>',
              dataPoints: chartData,
            },
          ],
        });

        chart.render();
      },
      error: (err) => {
        this.toastr.error(
          'Erreur lors de la récupération des données pour le graphique : ' +
            (err.message || 'Erreur inconnue')
        );
      },
    });
  }

  displayAlerteAnnee(): void {
    this.apiService.getSurfaceAlertes().subscribe({
      next: (data: any[]) => {
        // Extraire les années uniquement pour les labels
        // const labels = data.map((item) => new Date(item.date).getFullYear().toString());
        // console.log(data);

        const cleanData = data.map((dictionary: any) => {
          dictionary['month'] = new Date(dictionary['dates']).getMonth() + 1;
          dictionary['year'] = new Date(dictionary['dates']).getFullYear();
          return dictionary;
        });

        const keyMap = {
          month: 'label',
          area_m2: 'y',
        };

        let chartData = this.renameAllKeys(cleanData, keyMap);

        chartData = chartData.map((dictionary: any) => {
          dictionary['label'] = `${new Date(dictionary['dates']).toLocaleString(
            'fr-FR',
            { month: 'long' }
          )} ${dictionary['year']}`;
          return dictionary;
        });

        // console.log(chartData);

        let groupedData = Object.values(
          chartData.reduce((acc: any, item: any) => {
            if (!acc[item.label]) {
              acc[item.label] = { ...item }; // Copy the object
            } else {
              acc[item.label].y += item.y; // Sum the area
            }
            return acc;
          }, {} as { [key: number]: { label: string; y: number } })
        );

        // console.log(groupedData);

        const monthNamesFr = [
          'janvier',
          'février',
          'mars',
          'avril',
          'mai',
          'juin',
          'juillet',
          'août',
          'septembre',
          'octobre',
          'novembre',
          'décembre',
        ];

        // Créer un nouveau graphique
        const chart = new CanvasJS.Chart('chartMonthlyAlerts', {
          width: 400,
          height: 300,
          animationEnabled: true,
          title: {
            text: 'Pertubations mensuelle (en m²)',
            fontSize: 16,
          },

          axisX: {
            title: 'Mois',
            fontSize: 12,
            interval: 1,
            // valueFormatString: 'YYYY',
            labelMaxWidth: 60,
            labelWrap: true,
            labelAngle: -30,
          },
          axisY: {
            title: 'Superficie en m²',
            fontSize: 12,
            gridThickness: 0,
            tickLength: 0,
            // interval: 1,
            // includeZero: true,
          },
          // dataPointWidth: Math.round(300 / chartData.length),
          data: [
            {
              type: 'bar',
              toolTipContent:
                'Mois: <b>{label}</b><br>Superficie: <b>{y} m²</b>',
              dataPoints: groupedData.sort((a: any, b: any) => {
                const [monthA, yearA] = a.label.toLowerCase().split(' ');
                const [monthB, yearB] = b.label.toLowerCase().split(' ');

                const dateA = new Date(
                  Number(yearA),
                  monthNamesFr.indexOf(monthA)
                );
                const dateB = new Date(
                  Number(yearB),
                  monthNamesFr.indexOf(monthB)
                );

                return dateA.getTime() - dateB.getTime();
              }),
            },
          ],
        });
        chart.render();
      },
      error: (err) => {
        this.toastr.error(
          'Erreur lors de la récupération des données pour le graphique : ' +
            (err.message || 'Erreur inconnue')
        );
      },
    });
  }

  displayEspeceAnnee(): void {
    this.apiService.getSurfaceParEspeceAnnee().subscribe((data: any[]) => {
      const types = [...new Set(data.map((item) => item.type))];
      const years = [
        ...new Set(data.map((item) => new Date(item.date).getFullYear())),
      ].sort();

      // console.log(data);

      // Regrouper les données par année et par espèce
      const datasets = years.map((year) => {
        return {
          label: year.toString(),
          data: types.map((type) => {
            const yearData = data.find(
              (item) =>
                item.type === type && new Date(item.date).getFullYear() === year
            );
            return yearData
              ? this.squareMeterToKmPipe.transform(yearData.surface_totale)
              : 0;
          }),
          borderWidth: 2,
          backgroundColor: types.map((type) => {
            const typeData = data.find((item) => item.type === type);
            return typeData ? typeData.code_couleur : '#CCCCCC';
          }),
        };
      });

      const keyMap = {
        type: 'label',
        surface_totale: 'y',
        code_couleur: 'color',
      };

      let chartData = this.renameAllKeys(data, keyMap);

      // console.log(chartData);

      chartData = chartData.map((dictionary) => {
        dictionary['y'] = Number(
          this.squareMeterToKmPipe.transform(dictionary['y']).toFixed(2)
        );
        return dictionary;
      });

      // Créer un nouveau graphique
      const chart = new CanvasJS.Chart('chartSuperficieEspece', {
        width: 400,
        height: 300,
        animationEnabled: true,
        title: {
          text: 'Superficie par especes (en km²)',
          fontSize: 16,
        },

        axisX: {
          title: 'Type de mangrove',
          fontSize: 12,
          interval: 1,
          // valueFormatString: 'YYYY',
          labelMaxWidth: 60,
          labelWrap: true,
          labelAngle: -30,
        },
        axisY: {
          title: 'Superficie en km²',
          fontSize: 12,
          gridThickness: 0,
          tickLength: 0,
          // interval: 1,
          // includeZero: true,
        },
        dataPointWidth: Math.round(200 / chartData.length),
        data: [
          {
            type: 'bar',
            toolTipContent:
              'Type: <b>{label}</b><br>Superficie: <b>{y} km²</b>',
            dataPoints: chartData,
          },
        ],
      });
      chart.render();
    });
  }

  displayChartArrondissement(): void {
    // Récupérer les données via le service
    this.apiService.getSuperficieParArrondissement().subscribe({
      next: (data) => {
        // console.log('Données récupérées pour les arrondissements:', data);
        // Extraire les arrondissements pour les labels
        const labels = data.map((item) => item.arrondissement);
        //console.log('Arrondissements bruts:', labels);

        // Extraire les superficies et convertir si nécessaire
        const superficies = data.map((item) => item.superficie);
        //console.log('Superficies brutes:', superficies);

        const keyMap = {
          arrondissement: 'label',
          superficie: 'y',
        };

        let chartData = this.renameAllKeys(data, keyMap);

        chartData = chartData.filter(
          (el: any) => el.commune_id == this.selectedCommune
        );

        // chartData = chartData.map((dictionary) => {
        //   dictionary['y'] = Number(
        //     this.squareMeterToKmPipe.transform(dictionary['y']).toFixed(2)
        //   );
        //   return dictionary;
        // });

        // console.log(chartData);

        // Créer et configurer le graphique
        const chart = new CanvasJS.Chart('chartMangroveCommune', {
          width: 400,
          height: 300,
          animationEnabled: true,
          title: {
            text: 'Superficie des mangroves par arrondissements (en m²)',
            fontSize: 16,
          },

          axisX: {
            title: 'Arrondissements',
            fontSize: 12,
            interval: 1,
            // valueFormatString: 'YYYY',
            labelMaxWidth: 60,
            labelWrap: true,
            labelAngle: -30,
          },
          axisY: {
            title: 'Superficie en m²',
            fontSize: 12,
            gridThickness: 0,
            tickLength: 0,
            // interval: 1,
            // includeZero: true,
          },
          // dataPointWidth: Math.round(300 / chartData.length),
          data: [
            {
              type: 'bar',
              toolTipContent:
                'Arrondissement: <b>{label}</b><br>Superficie: <b>{y} m²</b>',
              dataPoints: chartData,
            },
          ],
        });
        chart.render();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des données : ', err);
      },
    });
  }

  displayChartAnneeMangroveEstuaire(): void {
    this.apiService.getSurperficieMangroveEstuaire().subscribe({
      next: (data) => {
        // console.log(data);

        const keyMap = {
          year: 'label',
          total_area: 'y',
        };

        let chartData = this.renameAllKeys(data, keyMap);

        chartData = chartData.map((dictionary) => {
          dictionary['y'] = Number(
            this.squareMeterToKmPipe.transform(dictionary['y']).toFixed(2)
          );
          return dictionary;
        });

        // console.log(chartData);

        // Créer un nouveau graphique
        const chart = new CanvasJS.Chart('sup-annee', {
          width: 400,
          height: 300,
          animationEnabled: true,
          title: {
            text: "Superficie totale des mangrove par de l'estuaire",
            fontSize: 16,
          },

          axisX: {
            title: 'Année',
            fontSize: 5,
            // interval: 1,
            intervalType: 'year',
            // valueFormatString: 'YYYY',
            labelWrap: true,
            labelAngle: -30,
          },
          axisY: {
            title: 'Superficie en km²',
            fontSize: 5,
            gridThickness: 0,
            tickLength: 0,
            valueFormatString: '####',
            labelWrap: true,
            labelAngle: -30,
            includeZero: true,
          },
          dataPointWidth: Math.round(180 / chartData.length),
          data: [
            {
              type: 'bar',
              toolTipContent:
                'Année: <b>{label}</b><br>Superficie: <b>{y} km²</b>',
              dataPoints: chartData,
            },
          ],
        });

        chart.render();
      },
      error: (err) => {
        this.toastr.error(
          'Erreur lors de la récupération des données pour le graphique : ' +
            (err.message || 'Erreur inconnue')
        );
      },
    });
  }

  reloadChart() {
    this.displayChartArrondissement();
  }

  statsMangroves() {
    this.activeStatAlerts = false;
    this.activeStatMangroves = true;
    this.selectedTab(1);
  }

  statsAlertes() {
    this.activeStatAlerts = true;
    this.activeStatMangroves = false;
    this.displayAlerteAnnee();
  }
}
