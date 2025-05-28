import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'thousandSeparator',
    standalone: false
})
export class ThousandSeparatorPipe implements PipeTransform {
  transform(value: number, decimalPlaces: number = 3): string {
    if (isNaN(value)) return '';

    // Séparer la partie entière et la partie décimale
    const parts = value.toString().split('.');

    // Ajouter des séparateurs de milliers à la partie entière
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    // Limiter la partie décimale sans arrondir
    const decimalPart = parts[1] ? parts[1].substring(0, decimalPlaces) : '';

    // Combiner la partie entière et la partie décimale
    return decimalPart ? `${integerPart},${decimalPart}` : integerPart;
  }
}
