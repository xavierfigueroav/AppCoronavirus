import { Component, OnInit, AfterViewInit } from '@angular/core';

import * as provinciasMap from '../../data/provincias.json';
import * as lastMeasures from '../../data/last_measures.json';

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

  constructor() {

  }

  ngOnInit() {

    this.provincias = {};
    this.mapIsVisible = true;

  }

  ngAfterViewInit() {
    this.mapIsVisible = false;

    const originalProvincias = (<any>lastMeasures).miscelaneos.provincia;
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
            <center>Casos confirmados: ${properties['CASOS CONFIRMADOS']}</center>`)
            .setLatLng(event.latlng).openOn(this.map);
        }
    });
}

  getFeatureFillColor = (value: number) => {
    return value > 1000 ? '#800026' :
       value > 500  ? '#BD0026' :
       value > 200  ? '#E31A1C' :
       value > 100  ? '#FC4E2A' :
       value > 50   ? '#FD8D3C' :
       value > 20   ? '#FEB24C' :
       value > 10   ? '#FED976' :
       value == 0  ? '#999999' :
                      '#FFEDA0';
};

applyStylesToFeature = (feature) => {
    return {
        fillColor: this.getFeatureFillColor(feature.properties['CASOS CONFIRMADOS']),
        weight: 1,
        opacity: 1,
        color: '#555555',
        fillOpacity: 0.7
    };
};

addPropertiesToFeatures() {
    provinciasMap['features'].forEach((feature: any) => {
        const properties = feature['properties'];
        const provinciaId = properties['ID_PROVINC'];
        if (provinciaId in this.provincias){
            properties['CASOS CONFIRMADOS'] = this.provincias[provinciaId]['CASOS CONFIRMADOS'];
        } else {
            properties['CASOS CONFIRMADOS'] = 0;
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

}
