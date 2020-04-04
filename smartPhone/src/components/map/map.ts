import { Component, OnInit, Input } from '@angular/core';

/**
 * Generated class for the MapComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'map',
  templateUrl: 'map.html'
})
export class MapComponent implements OnInit {

  text: string;
  @Input() colors: any;
  @Input() data: any;
  @Input() parameters: any[];
  clicked: boolean;
  provincia: any;

  constructor() {
    console.log('Hello MapComponent Component');
    this.text = 'Hello World';
    this.colors = {}
    this.clicked = false;
  }

  ngOnInit() {
  }

  onClickHandler(provinciaId: number) {

    this.clicked = true;
    this.provincia = this.data[provinciaId];

  }

  onBlurHandler() {

    this.clicked = false;

  }

}
