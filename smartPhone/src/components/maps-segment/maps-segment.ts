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

  map: any;
  mapIsVisible: boolean;
  popup: any;
  provincias: any;
  generalInfo = (<any>general);
  lastMeasuresInfo = (<any>lastMeasures);
  maxCasosConfirmados = this.lastMeasuresInfo.miscelaneos.nacional[0]['CASOS CONFIRMADOS'];

  constructor() {

  }

  ngOnInit() {

    this.provincias = {};
    this.mapIsVisible = true;

  }

  ngAfterViewInit() {
    this.mapIsVisible = false;

    const originalProvincias = this.lastMeasuresInfo.miscelaneos.provincia;
    originalProvincias.forEach((provincia: any) => {
        this.provincias[provincia['ID_PROVINCIA']] = provincia;
    })

    this.generateMap();

  }

  onEachFeature = (feature: any, layer: any) => {
    layer.on({
        click: (event: any) => {
            const properties = event.target.feature.properties;
            this.popup.setContent(`<center><b>${properties['PROVINCIA']}</b></center>
            <center>Casos confirmados: ${properties['CASOS CONFIRMADOS']}</center>
            <center>Fallecidos: ${properties['FALLECIDOS']}</center>`)
            .setLatLng(event.latlng).openOn(this.map);
        }
    });
}

  getFeatureFillColor = (value: number) => {
      const proportion = value / this.maxCasosConfirmados;
    return proportion > 0.7 ? '#b50000' :
       //proportion > 0.6  ? '#bf1d1d' :
       proportion > 0.3  ? '#c63030' :
       //proportion > 0.1  ? '#cc4242' :
       proportion > 0.01   ? '#db6b6b' :
       //proportion > 0.005   ? '#e88e8e' :
       proportion > 0.001   ? '#f4b0b0' :
       proportion == 0  ? '#999999' :
                                                '#ffcfcf';
};

applyStylesToFeature = (feature) => {
    return {
        fillColor: this.getFeatureFillColor(feature.properties['CASOS CONFIRMADOS']),
        weight: 1,
        opacity: 1,
        color: '#555555',
        fillOpacity: 0.8
    };
};

addPropertiesToFeatures() {
    provinciasMap['features'].forEach((feature: any) => {
        const properties = feature['properties'];
        const provinciaId = properties['ID_PROVINC'];
        if (provinciaId in this.provincias){
            properties['CASOS CONFIRMADOS'] = this.provincias[provinciaId]['CASOS CONFIRMADOS'];
            properties['FALLECIDOS'] = this.provincias[provinciaId]['FALLECIDOS'] || 0;
        } else {
            properties['CASOS CONFIRMADOS'] = 0;
            properties['FALLECIDOS'] = 0;
        }
    })
}

  generateMap() {

    this.map = L.map('map').fitWorld().setView([-3.052046, -78.577079], 6);
    this.popup = L.popup();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    }).addTo(this.map);

    this.addPropertiesToFeatures();

    this.setGeoJSON().then(() => {
        this.mapIsVisible = true;
        console.log('exito');
    });
  }

  setGeoJSON() {
      return new Promise<any>((resolve, reject) => {
          setTimeout(() => {
            L.geoJSON(provinciasMap, {
                style: this.applyStylesToFeature,
                onEachFeature: this.onEachFeature
            }).addTo(this.map);
            resolve();
          }, 0);
      });
  }

  getDateFromeTimestamp(timestamp: number) {
    const date = new Date(timestamp * 1000);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }

}
