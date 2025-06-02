import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'squareMeterToKm',
  standalone: false,
})
export class SquareMeterToKmPipe implements PipeTransform {
  transform(value: number): number {
    // Retourne un nombre au lieu d'une string
    if (!value || value < 0) return 0;
    return value / 1_000_000; // Conversion m² → km²
  }
}
