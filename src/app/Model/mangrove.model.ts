// src/app/models/mangrove.model.ts

// Classe pour la géométrie
export class Geometry {
    type: string;              // Type de géométrie (ex: "MultiPolygon")
    coordinates: number[][][]; // Coordonnées, typiquement un tableau de tableaux

    constructor(type: string, coordinates: number[][][]) {
        this.type = type;
        this.coordinates = coordinates;
    }
}

// export class Type {
//     id: number;              // Type de géométrie (ex: "MultiPolygon")
//     libelle: string; 
//     code_couleur:string

//     constructor(id: number, libelle:string, code_couleur:string) {
//         this.id = id;
//         this.libelle = libelle;
//         this.code_couleur = code_couleur;
//     }
// }

// Classe pour les mangroves
export class Mangrove {
    id: number;               // ID de la mangrove
    province: string;         // Province de la mangrove
    type: string;     
    code_couleur: string;          // Type de mangrove
    hauteur: number;          // Hauteur de la mangrove
    surface: number;          // Surface de la mangrove
    date: string;             // Date d'observation
    geometrie: Geometry;      // Géométrie associée à la mangrove

    constructor(id: number, province: string, type: string,code_couleur: string, hauteur: number, surface: number, date: string, geometrie: Geometry) {
        this.id = id;
        this.province = province;
        this.type = type;
        this.code_couleur = code_couleur;
        this.hauteur = hauteur;
        this.surface = surface;
        this.date = date;
        this.geometrie = geometrie;
    }
}

// Interface pour la réponse avec les statistiques
export interface MangroveResponse {
    mangroves: Mangrove[];    
    total_surface: number;     
    hauteur_moyenne: number;   
    provinces_count: number;  
    nbr_mangroves: number;  
}


export interface MangroveStats {
    date: string;
    provinces_count: number;
    total_surface: number;
    hauteur_moyenne: number;
    nbr_mangroves: number;
} 



export interface SupProAnnee {
    provinces: string; // Nom de la province
    dates: Date;          // Année
    surface_totale: number; // Surface totale
  }


  export interface SurfaceParEspeceAnnee {
    type: string;
    date: string;
    surface_totale: number;
    code_couleur : string;
  }
  
  
  export interface SurfaceParEspeceProvinceAnnee {
    type: string;
    province: string;
    date: string;
    surface_totale: number;
    code_couleur : string;
  }

 export interface SurfaceTotale {
    year: number;
    surface: number;
  }
  
  export interface AlertesData {
    annee: number;
    dates: string[];
  }
  

 export interface AlerteFeatureProperties {
    id: string;
    type: string;
    description: string;
  }
  
  //type AlerteFeature = GeoJSON.Feature<GeoJSON.Geometry, AlerteFeatureProperties>;
  

  export interface Parametres {
    Copyrith: string;
    surface_totale: number;
    last_date: Date;
  }

// Étendre WMSParams pour inclure CQL_FILTER
export interface CustomWMSParams extends L.WMSParams {
  CQL_FILTER?: string;  // Ajouter le paramètre CQL_FILTER en option
}

  export interface Annee {
    annee: number;
    date: string[];
  }
  


  export interface NbrAlerte {
    annee: number;
    nombre_alerte: number;
  }