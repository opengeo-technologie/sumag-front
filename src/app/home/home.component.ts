import { Component, OnInit } from '@angular/core';
declare var $: any;  // Si vous utilisez jQuery pour slick-carousel

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    standalone: false
})
export class HomeComponent implements OnInit {

  constructor() {}

  ngOnInit(): void {
    

    this.SlideInit();
  }

  SlideInit(): void {
    // Initialisation de slick-carousel avec jQuery
    $('.customer-logos').slick({
      slidesToShow: 5,
      slidesToScroll: 1,
      autoplay: true,
      autoplaySpeed: 1500,
      arrows: false,
      dots: false,
      pauseOnHover: false,
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 4,
          }
        },
        {
          breakpoint: 520,
          settings: {
            slidesToShow: 3,
          }
        }
      ]
    });
  }
}
