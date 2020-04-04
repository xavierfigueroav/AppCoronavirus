import { Component, OnInit, AfterViewInit } from '@angular/core';

import * as provinciasMap from '../../data/provincias.json';
import * as lastMeasures from '../../data/last_measures.json';
import * as general from '../../data/general.json';

import * as L from 'leaflet';

/**
 * Generated class for the MapsSegmentComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'maps-segment',
  templateUrl: 'maps-segment.html',

})
export class MapsSegmentComponent implements OnInit, AfterViewInit {

  provincias: any;
  generalInfo = (<any>general);
  lastMeasuresInfo = (<any>lastMeasures);
  maxCasosConfirmados = this.lastMeasuresInfo.miscelaneos.nacional[0]['CASOS CONFIRMADOS'];
  colors: any;

  constructor() {

  }

  ngOnInit() {
    this.provincias = {};
    this.colors = {};
    const originalProvincias = this.lastMeasuresInfo.miscelaneos.provincia;
    originalProvincias.forEach((provincia: any) => {
        this.provincias[provincia['ID_PROVINCIA']] = provincia;
        this.colors[provincia['ID_PROVINCIA']] = this.getFeatureFillColor(provincia['CASOS CONFIRMADOS']);
    });
  }

  ngAfterViewInit() {

  }

  getFeatureFillColor = (value: number) => {
    const proportion = value / this.maxCasosConfirmados;
    return proportion > 0.7       ? '#c0241d' :
           //proportion > 0.6     ? '#bf1d1d' :
           proportion > 0.05       ? '#ce5140' :
           //proportion > 0.1     ? '#cc4242' :
           proportion > 0.01      ? '#e9a986' :
           //proportion > 0.005   ? '#e88e8e' :
           proportion > 0.001     ? '#f5d0a4' :
           proportion == 0        ? '#999999' :
                                    '#fff1be';
};

  getDateFromeTimestamp(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
}
