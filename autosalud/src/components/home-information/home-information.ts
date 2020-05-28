import { Component, OnInit } from '@angular/core';
import { ViewController, LoadingController } from 'ionic-angular';
import { ScoreProvider } from '../../providers/score/score';
import { StorageProvider } from '../../providers/storage/storage';
import { LocationProvider } from '../../providers/location/location';
import { APIProvider } from '../../providers/api/api';
import { AlertProvider } from '../../providers/alert/alert';

/**
 * Generated class for the HomeInformationComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
    selector: 'home-information',
    templateUrl: 'home-information.html'
})
export class HomeInformationComponent implements OnInit {

    latitude: number;
    longitude: number;
    area: number;
    homeWifiNetworks: number;

    constructor(
        private viewController: ViewController,
        private loadingController: LoadingController,
        private scoreProvider: ScoreProvider,
        private storage: StorageProvider,
        private location: LocationProvider,
        private api: APIProvider,
        private alerts: AlertProvider) {
        console.log('Hello HomeInformationComponent Component');
    }

    ngOnInit() {
        this.storage.get('homeLocation').then(homeLocation => {
            this.latitude = homeLocation.latitude;
            this.longitude = homeLocation.longitude;
            return this.storage.get('homeArea');
        }).then(homeArea => {
            this.area = homeArea;
        });
    }

    async calculate() {
        const loader = this.loadingController.create({
            content: 'Obteniendo ubicación...',
        });
        loader.present();
        this.homeWifiNetworks = await this.scoreProvider.startScan();
        const location = await this.location.getCurrentLocation();
        this.latitude = location.coords.latitude;
        this.longitude = location.coords.longitude;
        try {
            const homeArea = await this.api.getAreaByLocation(this.latitude, this.longitude);
            this.area = Math.round(homeArea);
            loader.dismiss();
        } catch {
            loader.dismiss();
            this.alerts.showAreaServerConnectionErrorAlert();
        }
    }

    async save() {
        if(!this.latitude || !this.longitude || !this.area) {
            this.alerts.showFieldValueErrorAlert();
            return;
        }
        const loader = this.loadingController.create({
            content: 'Guardando...',
        });
        loader.present();
        await this.storage.set('homeWifiNetworks', this.homeWifiNetworks);
        await this.storage.set('homeLocation', {
            latitude: Number(this.latitude),
            longitude: Number(this.longitude)
        });
        await this.storage.set('homeArea', this.area);

        this.api.postHomeInformation();
        this.scoreProvider.startOrReconfigureTracking();

        loader.dismiss();
        this.viewController.dismiss();

        this.updateScores();
    }

    cancel() {
        this.viewController.dismiss();
    }

    updateScores() {
        const loader = this.loadingController.create({
            content: 'Actualizando niveles de exposición...',
        });
        loader.present();
        this.scoreProvider.updateScores().then(() => {
            loader.dismiss();
        }).catch(() => {
            loader.dismiss();
        });
    }

    onEnterKey(e: any) {
        if (e.keyCode == 13) {
            let activeElement = <HTMLElement>document.activeElement;
            activeElement && activeElement.blur && activeElement.blur();
        }
    }
}
