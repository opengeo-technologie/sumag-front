import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Mangrove,
  Geometry,
  SurfaceParEspeceAnnee,
  SurfaceParEspeceProvinceAnnee,
  AlertesData,
  Parametres,
  NbrAlerte,
} from './Model/mangrove.model';
import { Publication } from './Model/publication.models';
import { Archive } from './Model/archive.model';
import { Video } from './Model/videl.o.model';
import { Classe, Polygone } from './Model/classe.model';
import { ToastrService } from 'ngx-toastr';
//import {  IndexedDbService } from './services/indexed-db.service';

// Interface pour représenter la structure de la réponse de l'API
interface SuperficieData {
  arrondissement: string;
  superficie: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  // private apiUrl = 'http://41.159.150.24';
  private apiUrl = 'http://127.0.0.1:8000/';
  private geoserverUrl = 'http://41.159.150.28:8080/geoserver/ageos_base/wfs';

  constructor(private http: HttpClient, private toastr: ToastrService) {}

  FilterWFS(layer: string, cqlFilter: string): Observable<any> {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '1.1.0',
      request: 'GetFeature',
      typeName: layer,
      outputFormat: 'application/json',
      CQL_FILTER: cqlFilter,
    }).toString();

    const url = `${this.geoserverUrl}?${params}`;

    // Utilisation de fetch pour récupérer les données
    return new Observable((observer) => {
      fetch(url)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          observer.next(data);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  // Méthode pour récupérer les données des mangroves

  getParametres(): Observable<Parametres> {
    return this.http.get<Parametres>(`${this.apiUrl}/carte/api/parametres`);
  }

  // Filtre par géométrie : vérifie si chaque mangrove intersecte la géométrie donnée
  filterMangrovesByGeometry(
    coordinates: number[][],
    date: string,
    dates: string
  ): Observable<any> {
    const body = {
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates],
      },
      date: date,
      dates: dates,
    };
    return this.http.post<any>(
      `${this.apiUrl}/carte/api/mangroves/filtre`,
      body
    );
  }

  getPub(): Observable<Publication[]> {
    return this.http
      .get<Publication[]>(`${this.apiUrl}/doc/api/publications`)
      .pipe(
        map((data) => {
          return data.map((item: any) => {
            return new Publication(
              item.id,
              item.type,
              item.auteur,
              item.nom,
              item.titre,
              item.mot_cle,
              item.resume,
              item.fichier,
              item.lien,
              item.date,
              item.is_downloaded,
              item.reference
            );
          });
        })
      );
  }

  getSuperficieParArrondissement(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/carte/api/surface_arrond`);
  }

  getCommunes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/carte/api/communes`);
  }

  getSurfaceAlertes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/carte/api/surface_alertes`);
  }

  getSurperficieMangroveEstuaire(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/carte/api/superficie_mangrove_estuaire`
    );
  }

  getArchive(): Observable<Archive[]> {
    return this.http.get<Archive[]>(`${this.apiUrl}/doc/api/archives`).pipe(
      map((data) => {
        return data.map((item: any) => {
          return new Archive(item.id, item.titre, item.image);
        });
      })
    );
  }

  getVideo(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/doc/api/videos`).pipe(
      map((data) => {
        return data.map((item: any) => {
          return new Video(item.id, item.titre, item.lien, item.contenu);
        });
      })
    );
  }

  getFilterOptions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/carte/api/filter-options`);
  }

  filterData(date: string, espece: string, province: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/carte/api/filtered-data`, {
      params: {
        date: date,
        espece: espece,
        province: province,
      },
    });
  }

  getFilterOptions1(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/occupation_du_sol/api/filter-options`
    );
  }

  filterData1(date: string, classe: string, province: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/occupation_du_sol/api/filtered-data`,
      {
        params: {
          date: date,
          classe: classe,
          province: province,
        },
      }
    );
  }

  getSurfaceTotaleClasse(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/occupation_du_sol/api/surface_totale_classe`
    );
  }

  getSurfaceTotaleAnnee(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/carte/api/surface_totale_annee`);
  }

  getSurfaceTotaleproAnnee(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/carte/api/surface_totale_pro_annee`
    );
  }

  getClass(): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/occupation_du_sol/api/classes`)
      .pipe(
        map((data) => {
          if (data && data.Polygones) {
            // Conversion des polygones en objets
            const polygones: Polygone[] = data.Polygones.map((item: any) => {
              const geometrie = new Geometry(
                item.geometrie.type,
                item.geometrie.coordinates
              );
              const classe = new Classe(
                item.classe.id,
                item.classe.libelle,
                item.classe.code_couleur,
                item.classe.selected
              );

              return new Polygone(
                item.id,
                item.surface,
                item.date,
                geometrie,
                classe
              );
            });

            // Convertir en GeoJSON avant de retourner
            return this.convertClasseToGeoJSON(polygones);
          } else {
            this.toastr.error('Polygones manquants dans les données API');
            return null;
          }
        })
      );
  }

  FilterClass(selectedClasseIds: number[] = []): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/occupation_du_sol/api/classes/filter`, {
        selectedIds: selectedClasseIds,
      })
      .pipe(
        map((data) => {
          if (data && data.Polygones) {
            // Conversion des polygones en objets
            const polygones: Polygone[] = data.Polygones.map((item: any) => {
              const geometrie = new Geometry(
                item.geometrie.type,
                item.geometrie.coordinates
              );
              const classe = new Classe(
                item.classe.id,
                item.classe.libelle,
                item.classe.code_couleur,
                item.classe.selected
              );

              return new Polygone(
                item.id,
                item.surface,
                item.date,
                geometrie,
                classe
              );
            });

            // Convertir en GeoJSON avant de retourner
            return this.convertClasseToGeoJSON(polygones);
          } else {
            this.toastr.error('Polygones manquants dans les données API');
            return null;
          }
        })
      );
  }

  // Ajoutez la fonction convertToGeoJSON comme méthode privée dans le service
  private convertClasseToGeoJSON(PolygoneData: Polygone[]): any {
    return {
      type: 'FeatureCollection',
      features: PolygoneData.map((polygone) => ({
        type: 'Feature',
        properties: {
          id: polygone.id,
          classe: polygone.classe.libelle,
          code_couleur: polygone.classe.code_couleur,
          surface: polygone.surface,
          date: polygone.date,
        },
        geometry: polygone.geometrie,
      })),
    };
  }

  filterMangroves(
    selectedMangroveIds: number[] = [],
    date: string = ''
  ): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/carte/api/mangroves/filter`, {
        selectedIds: selectedMangroveIds,
        date: date, // Ajout de la date dans le corps de la requête
      })
      .pipe(
        map((data) => {
          if (data && data.mangroves) {
            // Conversion des mangroves en objets
            const mangroves = data.mangroves.features.map((item: any) => {
              const geometrie = new Geometry(
                item.geometry.type,
                item.geometry.coordinates
              );

              return new Mangrove(
                item.properties.id,
                item.properties.province,
                item.properties.type,
                item.properties.code_couleur,
                item.properties.hauteur,
                item.properties.surface,
                item.properties.date,
                geometrie
              );
            });

            // Retourner les mangroves filtrées ou les convertir en GeoJSON si nécessaire
            return this.convertMangroveToGeoJSON(mangroves);
          } else {
            // this.toastr.error('Mangroves manquantes dans les données API');
            return null;
          }
        })
      );
  }

  private convertMangroveToGeoJSON(mangroveData: Mangrove[]): any {
    return {
      type: 'FeatureCollection',
      features: mangroveData.map((mangrove) => ({
        type: 'Feature',
        properties: {
          id: mangrove.id,
          province: mangrove.province,
          type: mangrove.type,
          code_couleur: mangrove.code_couleur,
          hauteur: mangrove.hauteur,
          surface: mangrove.surface,
          date: mangrove.date,

          // selected: mangrove.selected,
        },
        geometry: mangrove.geometrie, // Assurez-vous que cela est au format correct
      })),
    };
  }

  getSurfaceParEspeceAnnee(): Observable<SurfaceParEspeceAnnee[]> {
    return this.http.get<SurfaceParEspeceAnnee[]>(
      `${this.apiUrl}/carte/api/surface_totale_type_annee/`
    );
  }

  getNbrAlertes(): Observable<NbrAlerte[]> {
    return this.http.get<NbrAlerte[]>(
      `${this.apiUrl}/alertes/api/nombre_alerte/`
    );
  }

  // Méthode pour récupérer les alertes
  getDates(): Observable<AlertesData[]> {
    return this.http.get<AlertesData[]>(`${this.apiUrl}/alertes/api/dates/`);
  }

  getAlertesByDate(date: string): Observable<any> {
    const params = new HttpParams()
      .set('service', 'WFS')
      .set('version', '1.0.0')
      .set('request', 'GetFeature')
      .set('typeName', 'ageos_base:alertes')
      .set('maxFeatures', '50')
      .set('outputFormat', 'application/json')
      .set('CQL_FILTER', `dates = '${date}'`); // Utilisation de dates pour le filtrage

    return this.http.get<any>(this.geoserverUrl, { params });
  }
}
