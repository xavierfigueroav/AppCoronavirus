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

    showPairEmailIdentifierErrorAlert(){
        this.showOkButtonAlert('La cédula o correo proporcionado es inválido.');
    }

    showEmailErrorAlert() {
        this.showOkButtonAlert('El correo proporcionado es inválido.');
    }

    showLocationErrorAlert() {
        this.showOkButtonAlert('No pudimos acceder a tu ubicación.');
    }

    showLocationNoPermissionAlert() {
        this.showOkButtonAlert('Por favor, danos acceso a tu ubicación para una mejor experiencia.')
    }

    showFormSentAlert() {
        this.showOkButtonAlert('Se ha enviado correctamente el formulario.')
    }

    scoreInformation(){
        const alert = this.alertController.create({
            title: '<p align="center">Nivel de exposición</p>',
            subTitle: "<br/><li>Bajo: verde</li>"+
                      "<li>Medio: naranja</li>"+
                      "<li>Alto: rojo</li>",
            buttons: ['OK']
          });
          alert.present();
    }

    infoHomeLocation() {
        const alert = this.alertController.create({
          title: '<p align="center">Registra la ubicación de tu casa</p>',
          subTitle: '<br/><li>Si el globo está de color ROJO significa que no has registrado tu domicilio.</li><br/>'+
                    '<li>Para empezar a calcular tu nivel de exposición ingresa el radio de tu casa y toca <b>GUARDAR</b>.</li><br/>'+
                    '<li>Puedes actualizar tu domocilio en cualquier momento.</li>',
          buttons: ['OK']
        });
        alert.present();
    }

    radiusError(){
        this.alertController.create({
            title: 'El radio de tu casa es incorrecto',
            subTitle: 'Ingresa un número entero positivo.',
            buttons: ['OK']
        }).present();
    }

    saveHomeInfoError(){
        this.alertController.create({
            title: 'Ocurrió un problema al almacenar la ubicación de tu casa',
            subTitle: 'Inténtalo de nuevo. Sin ella no prodremos brindarte información actualizada sobre tu nivel de exposición.',
            buttons: ['OK']
        }).present();
    }

    saveHomeInfoSuccess(){
        this.alertController.create({
            title: 'La ubicación de tu casa fue almacenada exitósamente',
            subTitle: 'Esto nos permitirá brindarte información actualizada sobre tu nivel de exposición.',
            buttons: ['OK']
        }).present();
    }
}
