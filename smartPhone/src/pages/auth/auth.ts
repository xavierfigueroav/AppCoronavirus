import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController, MenuController, App } from 'ionic-angular';
import { HTTP } from '@ionic-native/http';
import { Network } from '@ionic-native/network';
import { TabsPage } from '../tabs/tabs';
import { Storage } from '@ionic/storage';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage';
import { HttpClient } from '@angular/common/http';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { FormPage } from '../form/form';
import { SurveyPage } from '../survey/survey';
import { DiagnosticPage } from '../diagnostic/diagnostic';
import { File } from '@ionic-native/file';
import uuid from 'uuid/v4';
import { DatabaseService } from '../../service/database-service';
import { APIProvider } from '../../providers/api/api';
import { AlertProvider } from '../../providers/alert/alert';
import { EmailValidator } from '@angular/forms/src/directives/validators';

import * as plantilla from '../../assets/plantilla/plantilla.json';

@Component({
    selector: 'page-auth',
    templateUrl: 'auth.html'
})

export class AuthPage {
    templates = (<any>plantilla);
    linkedUser = null;
    codigo_app;
    infoTemplates = [];
    string_codigo;
    id_dataset;
    geolocationAuth;
    loading;
    coordinates = null;
    formsData = {};
    pendingForms = [];
    loader;
    sentForms;

    constructor(public httpClient: HttpClient, public appCtrl: App,
        public menuCtrl: MenuController, private secureStorage: SecureStorage,
        private storage: Storage, public navCtrl: NavController,
        public navParams: NavParams, public http: HTTP, private file: File,
        public network: Network, public loadingCtrl: LoadingController, private geolocation: Geolocation,
        public alertCtrl: AlertController, private diagnostic: Diagnostic, private locationAccuracy: LocationAccuracy,
        public database:DatabaseService, public api: APIProvider,
        private alerts: AlertProvider) {

        this.menuCtrl.enable(false);
        this.file = file;
        this.storage.get('linkedUser').then((val) => {
            if(val) {
                this.linkedUser = val;
            }
        }, err => {
            console.log('Hubo un error al obtener linkedUser');
            console.log(err);
        });

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

    llenarAutodiagnostico() {
        this.storage.get('sentForms').then((sentForms) => {
            this.sentForms = sentForms;
            if(this.sentForms != null && this.sentForms.length >0) {
                var fecha_ultimo_autodiagnostico = null;
                for(let sentForm of this.sentForms) {
                    if(sentForm.formData.type=='follow_up') {
                        fecha_ultimo_autodiagnostico = (sentForm.formData.saveDate).substr(0, 10);
                        console.log("FECHA SAVE DATE: ", sentForm.formData.saveDate);
                        console.log("FECHA ULTIMO AUTODIAGNOSTICO: ", fecha_ultimo_autodiagnostico);
                    }
                }
                if(fecha_ultimo_autodiagnostico != null) {
                    var fecha = new Date();
                    var fecha_hoy = fecha.getFullYear() + '-' + (fecha.getMonth()+1) + '-' + fecha.getDate();
                    console.log("FECHA HOY", fecha_hoy);
                    if(fecha_ultimo_autodiagnostico == fecha_hoy) {
                        this.appCtrl.getRootNav().setRoot(TabsPage);
                    } else {
                        const alert = this.alertCtrl.create({
                            subTitle: 'No ha llenado su reporte diario de salud. Por favor hágalo ahora',
                            buttons: ['OK']
                        });
                        alert.present();
                        this.appCtrl.getRootNav().setRoot(DiagnosticPage);
                    }
                } else {
                    const alert = this.alertCtrl.create({
                        subTitle: 'No ha llenado su reporte diario de salud. Por favor hágalo ahora',
                        buttons: ['OK']
                    });
                    alert.present();
                    this.appCtrl.getRootNav().setRoot(DiagnosticPage);
                }
            }
        });
    }

    async attemptAuth() {
        this.loader = this.loadingCtrl.create({
            content: "Espere...",
        });
        this.loader.present();

        try {
            const appIdIsValid = await this.api.validateAppCode(this.codigo_app);
            if(!appIdIsValid){
                this.loader.dismiss();
                this.alerts.showInvalidAppIdAlert();
                return;
            }
        } catch {
            this.loader.dismiss();
            this.alerts.showConnectionErrorAlert();
            return;
        }

        let datasetCreated: any;
        try {
            datasetCreated = await this.api.createFormsDataSet(this.codigo_app);
        } catch {
            this.loader.dismiss();
            this.alerts.showConnectionErrorAlert();
            return;
        } finally {
            this.loader.dismiss();
        }

        try {
            await this.storeUser();
            await this.checkforInestimableScores();
        } catch {
            this.loader.dismiss();
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
        await this.storage.set('id_dataset', this.codigo_app);
        await this.storage.set('linkedUser', {
            codigo_app: this.codigo_app,
            sesion: true
        });
    }

    async getInfoPlantilla() {
        for (let template of this.templates) {
            if (template.type == "SIMPLE") {
                this.infoTemplates.push({
                    uuid: template.uid,
                    name: template.name,
                    type: template.type,
                    gps: template.gps,
                    set_id: template.set_id,
                    data: template.data
                });
            } else {
                this.infoTemplates.push({
                    uuid: template.uid,
                    name: template.name,
                    type: template.type,
                    gps: template.gps,
                    set_id: template.set_id,
                    data: template.data
                });
            }
        }
        await this.storage.set('infoTemplates', this.infoTemplates);
    }

    async startForm(template, type, index) {
        // Genereate an uuid for form
        let templateUuid = template.uuid;
        this.storage.get('infoTemplates').then((templates) => {
            for (let temp of templates) {
                if (temp.uuid == template.uuid) {
                    template = temp;
                    break;
                }
            }
            if (template.gps == "required") {
                this.requestLocationAuthorization(template, templateUuid, type, index);
            } else {
                this.chooseFormTypeToInit(template, templateUuid, type, index)
            }
        });
    }

    requestLocationAuthorization(template, templateUuid, type, index) {
        this.diagnostic.requestLocationAuthorization().then(res => {
            this.geolocationAuth = res;
            this.locationAccuracy.canRequest().then((canRequest: boolean) => {
                if (canRequest) {
                    this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
                        () => {
                            this.loading = this.loadingCtrl.create({
                                content: 'Obteniendo ubicación ...',
                            });
                            this.loading.present();
                            this.geolocation.getCurrentPosition({
                                enableHighAccuracy: true,
                                timeout: 12000
                            }).then((res) => {
                                this.loading.dismiss();
                                this.coordinates = {
                                    latitude: res.coords.latitude,
                                    longitude: res.coords.longitude
                                };
                                this.chooseFormTypeToInit(
                                    template,
                                    templateUuid,
                                    type,
                                    index);
                            }).catch((error) => {
                                this.loading.dismiss();
                                let alert = this.alertCtrl.create({
                                    title: "Error",
                                    subTitle: "No pudimos acceder a tu ubicación.",
                                    buttons: ["ok"]
                                });
                                alert.present();
                                this.chooseFormTypeToInit(
                                    template,
                                    templateUuid,
                                    type,
                                    index);
                            });
                        }).catch(err => {
                            this.geolocationAuth = "DENIED";
                            let alert = this.alertCtrl.create({
                                title: "Error",
                                subTitle: "Por favor, danos acceso a tu ubicación para una mejor experiencia",
                                buttons: ["ok"]
                            });
                            alert.present();
                            return 0;
                        });
                } else {
                    let alert = this.alertCtrl.create({
                        title: "Error",
                        subTitle: "Por favor, danos acceso a tu ubicación para una mejor experiencia",
                        buttons: ["ok"]
                    });
                    alert.present();
                    return 0;
                }
            }).catch(err => {
                console.log(JSON.stringify(err));
                let alert = this.alertCtrl.create({
                    title: "Error",
                    subTitle: "Por favor, danos acceso a tu ubicación para una mejor experiencia",
                    buttons: ["ok"]
                });
                alert.present();
                return 0;
            });

        }).catch(err => {
            console.log(JSON.stringify(err));
            this.chooseFormTypeToInit(
                template,
                templateUuid,
                type,
                index);
        });
    }

    chooseFormTypeToInit(template, templateUuid, type, index) {
        if (type == "follow_up") {
            //this.startFollowUpForm(template, template.data.follow_up, templateUuid, index);
            let formUuid = uuid();
            this.startInitialForm(template, template.data.follow_up, templateUuid, formUuid, type, index);
        } else if (type == "initial") {
            let formUuid = uuid();
            this.startInitialForm(template, template.data.initial, templateUuid, formUuid, type, index);
        }
    }

    startInitialForm(template, selectedTemplate, templateUuid, formUuid, type, index) {
        this.storage.get('formsData').then((formsData) => {
            this.formsData = formsData;
            let currentForm = {};
            let forms;
            if (this.formsData != null && (Object.keys(this.formsData).length > 0) && this.formsData.hasOwnProperty(templateUuid)) {
                forms = this.formsData[templateUuid].slice(0);
            }
            if (forms != null && (forms.length > 0)) {
                let form = forms[forms.length - 1];
                currentForm = {
                    uuid: formUuid,
                    version: 0,
                    type: type,
                    name: template.name,
                    gps: template.gps,
                    data: {},
                    createdDate: new Date()
                };
                if (template.gps == "required") {
                    currentForm["coordinates"] = this.coordinates;
                }
                forms.push(currentForm);
            } else {
                currentForm = {
                    uuid: formUuid,
                    version: 0,
                    type: type,
                    name: template.name,
                    gps: template.gps,
                    data: {},
                    createdDate: new Date()
                };
                if (template.gps == "required") {
                    currentForm["coordinates"] = this.coordinates;
                }
                forms = [currentForm];
            }
            var pendingForms = []
            this.storage.get('pendingForms').then((pendingForms) => {
                this.pendingForms = pendingForms;
                if (this.pendingForms != null && (this.pendingForms.length > 0)) {
                    pendingForms = this.pendingForms.slice(0);
                    let idx = 0;
                    if (this.formsData != null && this.formsData[templateUuid] != null) {
                        idx = this.formsData[templateUuid].length;
                    }
                    pendingForms.push({
                        template: templateUuid,
                        score_movilidad: 0,
                        score_salud_personal: 0,
                        formData: currentForm,
                        index: idx
                    });
                } else {
                    pendingForms = [{
                        template: templateUuid,
                        score_movilidad: 0,
                        score_salud_personal: 0,
                        formData: currentForm,
                        index: 0
                    }];
                }
                var formulario_uso = {
                    template: template,
                    selectedTemplate: selectedTemplate,
                    formData: selectedTemplate,
                    currentForm: currentForm,
                    forms: forms,
                    formsData: this.formsData,
                    pendingForms: pendingForms,
                    geolocationAuth: this.geolocationAuth,
                    infoTemplates: this.infoTemplates,
                    infoTemplateIndex: index,
                    indice_seccion: 0
                };
                this.storage.set("formulario_uso", formulario_uso);
                this.appCtrl.getRootNav().setRoot(FormPage);
            });
        });
    }

    desvincular() {
        const confirm = this.alertCtrl.create({
            title: 'Seguro que quieres ingresar con otra cuenta?',
            message: 'Se borrara la cuenta registrada y podras registrarte de nuevo cuando inicies sesion con internet',
            buttons: [
                {
                    text: 'Iniciar con otra cuenta',
                    handler: () => {
                        console.log('Desvincular clicked');
                        this.storage.clear().then(() => {
                            this.linkedUser = null;
                            this.secureStorage.create('security')
                                .then((storage: SecureStorageObject) => {
                                    storage.clear();
                                });
                        });
                    }
                },
                {
                    text: 'Cancelar',
                    handler: () => {
                        console.log('Cancelar');
                    }
                }
            ]
        });
        confirm.present();
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

    validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    passwordRecover(){
        const prompt = this.alertCtrl.create({
            title: '<p align="center">Recuperación de contraseña</p>',
            message: "Escriba una dirección de correo electrónico válida a la que podamos enviar su contraseña.",
            inputs: [
              {
                name: 'cedula',
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
                    if (this.validateEmail(data.email)) {
                        console.log('Enviar correo.');
                        this.confirmacionEnvioCorreo(data.cedula, data.email);
                    }else{
                        console.log((this.validateEmail(data.email)));
                        this.alerts.showEmailErrorAlert();
                    }
                }
              }
            ]
        });
        prompt.present();
    }

    confirmacionEnvioCorreo(cedula: string, emailAddress: string) {
        this.loader = this.loadingCtrl.create({
            content: "Espere...",
        });
        this.loader.present();
        this.api.sendAppIdToEmail(cedula, emailAddress).then(sent => {
            this.loader.dismiss();
            if(sent) {
                this.alerts.showSentEmailSuccessAlert();
            } else {
                this.alerts.showPairCedulaEmailErrorAlert();
            }
        }).catch(() => {
            this.loader.dismiss();
            this.alerts.showConnectionErrorAlert();
        });
    }
}
