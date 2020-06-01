import { Component } from '@angular/core';
import { LoadingController, AlertController, App } from 'ionic-angular';
import { TabsPage } from '../tabs/tabs';
import { StorageProvider } from '../../providers/storage/storage';
import { File } from '@ionic-native/file';
import { APIProvider } from '../../providers/api/api';
import { AlertProvider } from '../../providers/alert/alert';
import { DatabaseProvider } from '../../providers/database/database';
import { ValidationsProvider } from '../../providers/validations/validations';
import { FormPage } from '../form/form';
import { ScoreProvider } from '../../providers/score/score';

@Component({
    selector: 'page-auth',
    templateUrl: 'auth.html'
})

export class AuthPage {
    appPIN: string;

    constructor(
        private app: App,
        private storage: StorageProvider,
        private file: File,
        private loadingCtrl: LoadingController,
        private alertCtrl: AlertController,
        private database: DatabaseProvider,
        private api: APIProvider,
        private alerts: AlertProvider,
        private validations: ValidationsProvider,
        private scoreProvider: ScoreProvider) {

        this.storage.setNotifications(null);
        this.crearDirectorio();
    }

    crearDirectorio() {
        this.file.checkDir(this.file.externalApplicationStorageDirectory, 'AppCoronavirus').then(response => {
            console.log('EL DIRECTORIO YA EXISTE');
            console.log(this.file.externalApplicationStorageDirectory + "/AppCoronavirus");
        }).catch(() => {
            console.log('EL DIRECTORIO NO EXISTE');
            this.file.createDir(this.file.externalApplicationStorageDirectory, 'AppCoronavirus', false).then(response => {
                console.log('SE CREÓ EL DIRECTORIO');
            }).catch(() => {
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
            await this.api.getFormsDataset(this.appPIN);
        } catch {
            try {
                datasetCreated = await this.api.createFormsDataSet(this.appPIN);
            } catch {
                this.alerts.showConnectionErrorAlert();
                return;
            }
        } finally {
            loader.dismiss();
        }

        try {
            await this.storeUser();
            await this.scoreProvider.checkforInestimableScores();
        } catch {
            loader.dismiss();
            this.alerts.showLocalStorageError();
            return;
        }

        this.scoreProvider.restartTrackingIfStopped();

        if(!datasetCreated) { // Already created
            this.app.getRootNav().setRoot(TabsPage);
            this.storage.get('firstUseDate').then(firstUseDate => {
                if(firstUseDate == null) {
                    this.storage.set('firstUseDate', new Date()); // This may not be the real first use date
                }
            });
        } else {
            this.app.getRootNav().setRoot(FormPage, { 'formType': 'initial' });
        }
    }

    async storeUser() {
        await this.storage.setDatasetId(this.appPIN);
        await this.storage.setUser(this.appPIN);
        await this.storage.setUserData(this.appPIN);
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
                handler: () => { console.log('Cancel envio de correo.');}
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
