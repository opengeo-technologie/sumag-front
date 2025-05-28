import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'capitalizeFirst',
    standalone: false
})
export class CapitalizeFirstPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value; // Retourne une chaîne vide si la valeur est nulle ou vide

    // Met la première lettre en majuscule et le reste en minuscules
    const capitalizedText = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    
    return capitalizedText;
  }
}
