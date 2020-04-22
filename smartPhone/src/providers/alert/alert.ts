import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';

/*
  Generated class for the AlertProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class AlertProvider {

    constructor(private alertController: AlertController) {
        console.log('Hello AlertProvider Provider');
    }

    private showOkButtonAlert(subTitle: string){
        const alert = this.alertController.create({
            subTitle: subTitle,
            buttons: ['OK']
        });
        alert.present();
    }

    showConnectionErrorAlert() {
        this.showOkButtonAlert('Hubo un problema al comunicarse con el servidor. Por favor, verifique su conexión a internet o inténtelo más tarde.');
    }

    showInvalidAppIdAlert() {
        this.showOkButtonAlert('El código de app no es válido.');
    }

    showLocalStorageError() {
        this.showOkButtonAlert('Hubo un problema al intentar acceder al almacenamiento local.');
    }

    showSentEmailSuccessAlert() {
        this.showOkButtonAlert('Se ha enviado su contraseña al correo electrónico que ha proporcionado. Por favor, revise su bandeja de entrada.')
    }

    showPairCedulaEmailErrorAlert() {
        this.showOkButtonAlert('La combinación cédula/correo que ha proporcionado no existe.')
    }

    showEmailErrorAlert() {
        this.showOkButtonAlert('El correo proporcionado es inválido.')
    }

    showLocationErrorAlert() {
        this.showOkButtonAlert('No pudimos acceder a tu ubicación.');
    }

    showLocationNoPermissionAlert() {
        this.showOkButtonAlert('Por favor, danos acceso a tu ubicación para una mejor experiencia.')
    }

}
