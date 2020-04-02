import { Component, OnInit } from '@angular/core';

import * as info from '../../data/history.json';
import * as general from '../../data/general.json';

/**
 * Generated class for the StatsSegmentComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'stats-segment',
  templateUrl: 'stats-segment.html'
})
export class StatsSegmentComponent implements OnInit {

    misc = (<any>info).miscelaneos;
    ages = (<any>info).edades;

    nacionalInfo = this.misc.nacional;
    provinciasInfo = this.misc.provincia;
    cantonesInfo = this.misc.canton;
    fullInfo = [...this.nacionalInfo, ...this.provinciasInfo, ...this.cantonesInfo];

    generalInfo = (<any>general);
    cantones = new Set<string>(this.generalInfo.CANTONES);
    provincias = new Set<string>(this.generalInfo.PROVINCIAS);

    places = ['NACIONAL', ...this.provincias, ...this.cantones];

    selectedCanton: string;
    selectedProvincia: string;
    selectedPlace: string;

    parameters: any[];
    selectedParameter: string;


    selectedPlace1: string;
    selectedPlace2: string;

    selectedParameter1: string;
    selectedParameter2: string;

  constructor() {
    console.log('Hello StatsSegmentComponent Component');
  }

    ngOnInit() {

        this.selectedPlace = 'NACIONAL';
        this.selectedCanton = 'GUAYAQUIL';
        this.selectedProvincia = this.provincias[0];

        this.parameters = ['CERCO EPIDEMIOLOGICO', 'CASOS CONFIRMADOS', 'MUESTRAS TOMADAS', 'FALLECIDOS', 'RECUPERADOS', 'AISLAMIENTO DOMILICIARIO', 'HOSPITALIZADOS ESTABLES', 'HOSPITALIZADOS PRON. RESERV.', 'CASOS SOSPECHOSOS'];
        this.selectedParameter = this.parameters[0];

        this.selectedParameter1 = 'CASOS CONFIRMADOS';
        this.selectedParameter2 = 'CASOS SOSPECHOSOS';
        this.selectedPlace1 = 'NACIONAL';
        this.selectedPlace2 = 'QUITO';

    }

    getAvailablePlaces(selectedPlace: string) {
        return this.places.filter(place => place !== selectedPlace);
    }

    getAvailableParametersBySelectedParameter(selectedParameter: string){
        return this.parameters.filter(parameter => parameter !== selectedParameter);
    }

    getAvailableParametersByPlace(selectedPlace: string){

        if (selectedPlace === 'NACIONAL') {
            return this.parameters;
        }

        if (this.provincias.has(selectedPlace)) {
            return ['CASOS CONFIRMADOS', 'FALLECIDOS'];
        }

        return ['CASOS CONFIRMADOS'];
    }

    getInfoByPlace(selectedPlace: string) {
        if (selectedPlace === 'NACIONAL') {
            return this.nacionalInfo;
        }

        if (this.provincias.has(selectedPlace)) {
            return this.provinciasInfo;
        }

        return this.cantonesInfo;
    }

    getDateFromeTimestamp(timestamp: number) {
        const date = new Date(timestamp * 1000);
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }

    placeChangeHandler() {
        this.selectedParameter = '<seleccione un parámetro>';
    }
}
