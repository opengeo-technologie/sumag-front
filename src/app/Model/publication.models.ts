import { SafeResourceUrl } from '@angular/platform-browser';

export class Publication {
  constructor(
    public id: number,
    public type: string,
    public auteur: string,
    public nom: string,
    public titre: string,
    public mot_cle: string,
    public resume: string,
    public fichier: any,
    public lien: string,
    public date: string,
    public is_downloaded: boolean,
    public reference: string
  ) {}
}
