import { Injectable } from '@angular/core';

import { Diagnostic } from '@ionic-native/diagnostic';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Geolocation } from '@ionic-native/geolocation';
import { AlertController, LoadingController } from 'ionic-angular';

/*
  Generated class for the LocationProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocationProvider {

  constructor(
    private diagnostic: Diagnostic,
    private locationAccuracy: LocationAccuracy,
    private geoLocation: Geolocation,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController) {

    console.log('Hello LocationProvider Provider');

  }

  getCurrentLocation() {
    return new Promise<any>((resolve, reject) => {

        this.requestLocationAuthorization()
        .then(location => resolve(location))
        .catch(error => reject(error));

    });
  }

  private requestLocationAuthorization() {
      return  new Promise<any>((resolve, reject) => {

        this.diagnostic.requestLocationAuthorization().then(status => {

            switch(status){
                case this.diagnostic.permissionStatus.GRANTED:
                case this.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
                    console.log("Permission granted");
                    this.requestGPSAccess()
                    .then(location => resolve(location))
                    .catch(error => reject(error));
                    break;
                case this.diagnostic.permissionStatus.DENIED:
                case this.diagnostic.permissionStatus.DENIED_ALWAYS:
                    reject('error');
                    break;
                case this.diagnostic.permissionStatus.RESTRICTED:

                    this.alertCtrl.create({
                        title: 'Sin permisos para usar tu ubicación',
                        subTitle: 'Tu dispositivo tiene restringidos los permisos para hacer uso de tu ubicación.',
                        buttons: ['OK']
                    }).present();

                    reject('error');
                    break;
            }

        }).catch(() => {
            this.alertCtrl.create({
                title: 'Error al solicitar permisos para usar tu ubicación',
                subTitle: 'No pudimos obtener permisos para usar tu ubicación.',
                buttons: ['OK']
            }).present();
        });

    });
  }

  private requestGPSAccess() {

    return new Promise<any>((resolve, reject) => {

        this.locationAccuracy.canRequest().then(ableToRequest => {

            if(ableToRequest) {

                this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY)
                .then(() => this.requestGPSPosition())
                .then(location => resolve(location))
                .catch((error) => reject(error));

            } else {
                this.alertCtrl.create({
                    title: 'Sin permisos para acceder a la ubicación',
                    subTitle: 'No pudimos obtener permisos para acceder a tu ubicación.',
                    buttons: ['OK']
                }).present();
            }


        }).catch(() => {
            this.alertCtrl.create({
                title: 'Error al iniciar la petición de tu ubucación',
                subTitle: 'No pudimos iniciar la petición de tu ubicación, asegúrate de que tienes activado el GPS y que nos otorgaste el permiso para usarlo.',
                buttons: ['OK']
            }).present();
        });

    });

  }

  private requestGPSPosition() {
    return new Promise<any>((resolve, reject) => {

        const loading = this.loadingCtrl.create({
            content: 'Estamos obteniendo ubicación...',
        });

        loading.present();

        this.geoLocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
        }).then((location) => {
            loading.dismiss();
            resolve(location);
        }).catch(() => {
            loading.dismiss();

            this.alertCtrl.create({
                title: 'Error al obtener la ubicación',
                subTitle: 'No pudimos acceder a tu ubicación, asegúrate de que tienes activado el GPS.',
                buttons: ['OK']
            });
        });

    });
  }

}
