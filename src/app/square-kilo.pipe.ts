import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'squareKilo',
  standalone: false
})
export class SquareKiloPipe implements PipeTransform {

  transform(value: number): number { // Retourne un nombre au lieu d'une string
    if (!value || value < 0) return 0;
    return value * 1_000_000; // Conversion m² → km²
  }


}
