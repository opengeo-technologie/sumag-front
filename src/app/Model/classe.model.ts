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

export class Classe {
    id:string; //
    libelle: string;             
    code_couleur: string; 
    selected: boolean;

    constructor(id:string,libelle: string, code_couleur: string, selected: boolean) {
        this.id = id;
        this.libelle= libelle;
        this.code_couleur = code_couleur;
        this.selected = selected;
    }
}

export class Polygone {
    id: number;               
    surface: number;          
    date: string;             
    geometrie: Geometry;      
    classe : Classe
    

    constructor(id: number,  surface: number, date: string, geometrie: Geometry, classe:Classe, ) {
        this.id = id;
        this.surface = surface;
        this.date = date;
        this.geometrie = geometrie;
        this.classe = classe;
        
    }
}


 

export class SurfaceTotaleClasse {
                   
    surface_totale: number;          
    libelle : string; 
    code_couleur : string;
    

    constructor( surface_totale: number, libelle: string, code_couleur: string, ) {
        this.surface_totale = surface_totale;
        this.libelle = libelle;
        this.code_couleur = code_couleur;
        
    }
}


export class SurfaceTotaleAnnee {
                   
    surface_totale: number;          
    date : string; 
   

    constructor( surface_totale: number, date: string, ) {
        this.surface_totale = surface_totale;
        this.date= date;
        
        
    }
}
