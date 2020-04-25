import { Component } from '@angular/core';
import { LoadingController, AlertController, MenuController, App } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { Storage } from '@ionic/storage';
import { SurveyPage } from '../survey/survey';
import { File } from '@ionic-native/file';
import { APIProvider } from '../../providers/api/api';
import { AlertProvider } from '../../providers/alert/alert';
import { DatabaseProvider } from '../../providers/database/database';
import { ValidationsProvider } from '../../providers/validations/validations';

@Component({
    selector: 'page-auth',
    templateUrl: 'auth.html'
})

export class AuthPage {
    appPIN: string;

    constructor(
        private appCtrl: App,
        private menuCtrl: MenuController,
        private storage: Storage,
        private file: File,
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController,
        private database: DatabaseProvider,
        private api: APIProvider,
        private alerts: AlertProvider,
        private validations: ValidationsProvider) {

        this.menuCtrl.enable(false);
        this.storage.set('notifications', null);
        this.crearDirectorio();
    }

    crearDirectorio() {
        this.file.checkDir(this.file.externalApplicationStorageDirectory, 'AppCoronavirus').then(response => {
            console.log('EL DIRECTORIO YA EXISTE');
            console.log(this.file.externalApplicationStorageDirectory + "/AppCoronavirus");
        }).catch(err => {
            console.log('EL DIRECTORIO NO EXISTE');
            this.file.createDir(this.file.externalApplicationStorageDirectory, 'AppCoronavirus', false).then(response => {
                console.log('SE CREÓ EL DIRECTORIO');
            }).catch(err => {
                console.log('ERROR AL CREAR EL DIRECTORIO');
            });
        });
    }

    async attemptAuth() {
        const loader = this.loadingCtrl.create({
            content: "Espere...",
        });
        loader.present();

        try {
            const appIdIsValid = await this.api.validateAppCode(this.appPIN);
            if(!appIdIsValid){
                loader.dismiss();
                this.alerts.showInvalidAppIdAlert();
                return;
            }
        } catch {
            loader.dismiss();
            this.alerts.showConnectionErrorAlert();
            return;
        }

        let datasetCreated: any;
        try {
            datasetCreated = await this.api.createFormsDataSet(this.appPIN);
        } catch {
            loader.dismiss();
            this.alerts.showConnectionErrorAlert();
            return;
        } finally {
            loader.dismiss();
        }

        try {
            await this.storeUser();
            await this.checkforInestimableScores();
        } catch {
            loader.dismiss();
            this.alerts.showLocalStorageError();
            return;
        }

        if(datasetCreated === 0) { // Already created
            this.appCtrl.getRootNav().setRoot(TabsPage);
        } else {
            this.appCtrl.getRootNav().setRoot(SurveyPage);
        }
    }

    async storeUser() {
        await this.storage.set('id_dataset', this.appPIN);
        await this.storage.set('linkedUser', {
            codigo_app: this.appPIN,
            sesion: true
        });
    }

    async checkforInestimableScores(){
        const scores = await this.database.getScores();
        if(scores.length === 0){
            const date = new Date();
            const currentHour = date.getHours();
            for (let hour = 1; hour <= currentHour -1; hour++) {
                this.database.saveScore(-1, hour, 0, 0, '');
            }
        }
    }

    passwordRecover(){
        const prompt = this.alertCtrl.create({
            title: '<p align="center">Recuperación de contraseña</p>',
            message: "Escriba una dirección de correo electrónico válida a la que podamos enviar su contraseña.",
            inputs: [
              {
                name: 'id',
                type: "text",
                placeholder: 'Ingresa tu cédula'
              },
              {
                name: 'email',
                type: "email",
                placeholder: 'usuario@correo.com'
              },
            ],
            buttons: [
              {
                text: 'Cancelar',
                handler: data => { console.log('Cancel envio de correo.');}
              },
              {
                text: 'Enviar',
                handler: data => {
                    if (this.validations.validateEmail(data.email) && this.validations.validateIdentificationCard(data.id)) {
                        console.log('Enviar correo.');
                        this.confirmacionEnvioCorreo(data.cedula, data.email);
                    }else{
                        console.log((this.validations.validateEmail(data.email)));
                        this.alerts.showPairEmailIdentifierErrorAlert();
                    }
                }
              }
            ]
        });
        prompt.present();
    }

    confirmacionEnvioCorreo(cedula: string, emailAddress: string) {
        const loader = this.loadingCtrl.create({
            content: "Espere...",
        });
        loader.present();
        this.api.sendAppIdToEmail(cedula, emailAddress).then(sent => {
            loader.dismiss();
            if(sent) {
                this.alerts.showSentEmailSuccessAlert();
            } else {
                this.alerts.showPairEmailIdentifierErrorAlert();
            }
        }).catch(() => {
            loader.dismiss();
            this.alerts.showConnectionErrorAlert();
        });
    }

    onEnterKey(e) {
        if (e.keyCode == 13) {
            let activeElement = <HTMLElement>document.activeElement;
            activeElement && activeElement.blur && activeElement.blur();
        }
      }
}
