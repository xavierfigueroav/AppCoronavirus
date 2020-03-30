import { Component } from '@angular/core';

/**
 * Generated class for the MapsSegmentComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'maps-segment',
  templateUrl: 'maps-segment.html'
})
export class MapsSegmentComponent {

  text: string;

  constructor() {
    console.log('Hello MapsSegmentComponent Component');
    this.text = 'Hello World';
  }

}
