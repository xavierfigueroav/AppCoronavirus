import { Component, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { IonicPage, NavController, NavParams, MenuController, Events, AlertController, Platform, LoadingController, App } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { File } from '@ionic-native/file';
import { AuthPage } from '../auth/auth';
import { HTTP } from '@ionic-native/http';
import { HttpClient } from '@angular/common/http';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Diagnostic } from '@ionic-native/diagnostic';
import { Geolocation } from '@ionic-native/geolocation';
import { FormPage } from '../form/form';
import { FollowUpPage } from '../followUp/followUp';
import uuid from 'uuid/v4';

@Component({
	selector: 'page-diagnostic',
	templateUrl: 'diagnostic.html',
})

export class DiagnosticPage {
	sentForms;
    templates;
    infoTemplates = [];
    pendingForms = [];
    formsData = {};
    geolocationAuth;
    coordinates = null;
    loading;
    selectedSection;
    select_tipo_compuesta;
    select_tipo_multiform;
    linkedUser;
    notifications;
    id;
    loader;

	constructor(private diagnostic: Diagnostic,
        private events: Events,
        private platform: Platform,
        public menuCtrl: MenuController,
        private locationAccuracy: LocationAccuracy,
        private geolocation: Geolocation,
        private storage: Storage,
        public alertCtrl: AlertController,
        public loadingController: LoadingController,
        public navCtrl: NavController,
        public http: HTTP,
        public httpClient: HttpClient,
        public appCtrl: App,
        private localNotifications: LocalNotifications,
        public loadingCtrl: LoadingController,
        private file: File) {

        this.menuCtrl.enable(true);

        this.loader = this.loadingCtrl.create({
            content: "Espere ...",
        });
        this.loader.present();

        this.storage.get('sentForms').then((sentForms) => {
            this.sentForms = sentForms;
        });

        this.storage.get('templates').then((templates) => {
            this.templates = templates;
        });

        this.storage.get('linkedUser').then((linkedUser) => {
            this.linkedUser = linkedUser;
        });

        this.storage.get('pendingForms').then((pendingForms) => {
            this.pendingForms = pendingForms;
        });

        this.storage.get('infoTemplates').then((templates) => {
            this.infoTemplates = templates;
            this.selectedSection = templates[0];
            var info_template = templates[0];
            this.startForm(info_template, 'follow_up', 0);
        });

        this.httpClient.get('./assets/calculos/calculo.json').subscribe(res => {
            this.storage.set('calculos', res);
        }, err => {
            console.log('Hubo un error al obtener los cálculos');
            console.log(err);
        });

        this.storage.get("formsData").then((formsData) => {
            if (formsData != null && (Object.keys(formsData).length > 0)) {
                this.formsData = formsData;
            }
        });

	}

	/*ionViewDidEnter() {
        try {
            this.storage.get('pendingForms').then((pendingForms) => {
                this.pendingForms = pendingForms;
            });

            this.storage.get('infoTemplates').then((templates) => {
                this.infoTemplates = templates;
                this.selectedSection = templates[0];
            });
        } catch(e){
            console.log("ionViewDidEnter");
        }
    }

    ionViewWillEnter(){
        this.storage.get('infoTemplates').then((templates) => {
            this.infoTemplates = templates;
            this.selectedSection = templates[0];
        });
    }*/

    async startFollowUpForm(template, selectedTemplate, templateUuid, index) {
        this.formsData = await this.storage.get("formsData");
        let forms;
        if (this.formsData != null && (Object.keys(this.formsData).length > 0)) {
            forms = this.formsData[templateUuid];
            let initialForms = [];
            for (let form of forms) {
                if (form.type == "initial")
                    initialForms.push(form);
            }
            this.storage.get('pendingForms').then((pendingForms) => {
                this.pendingForms = pendingForms;
                this.navCtrl.push(FollowUpPage, {
                    template: template,
                    coordinates: this.coordinates,
                    geolocationAuth: this.geolocationAuth,
                    selectedTemplate: selectedTemplate,
                    forms: initialForms,
                    formsData: this.formsData,
                    pendingForms: this.pendingForms,
                    infoTemplates: this.infoTemplates,
                    infoTemplateIndex: index
                });
            });
        } else {
            let alert = this.alertCtrl.create({
                subTitle: "No existen formularios iniciales.",
                buttons: ["cerrar"]
            });
            alert.present();
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
                this.loader.dismiss();
                this.appCtrl.getRootNav().setRoot(FormPage);
            });
        });
    }

    requestLocationAuthorization(template, templateUuid, type, index) {
        this.diagnostic.requestLocationAuthorization().then(res => {
            this.geolocationAuth = res;
            this.locationAccuracy.canRequest().then((canRequest: boolean) => {
                if (canRequest) {
                    this.locationAccuracy.request(this.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY).then(
                        () => {
                            this.loading = this.loadingController.create({
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
        } else if (type == "SIMPLE") {
            let formUuid = uuid();
            this.startSimpleForm(template, template.data.simple, templateUuid, formUuid, type, index);
        }
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

    cerrarSesion() {
        this.appCtrl.getRootNav().setRoot(AuthPage);
    }

    /*setNotificaciones() {
        this.storage.get('notifications').then((notifications) => {
            if(notifications) {
                this.notifications = notifications;
            } else {
                this.notifications = {};
            }
            this.id = 0;
        });
        this.storage.get('templates').then((templates) => {
            for (let template of templates) {
                if(this.notifications[template.name]) {
                    this.localNotifications.cancel(this.notifications[template.name]);
                }
                this.notifications[template.name] = new Array();
                if (template.notifications) {
                    for (let noti of template.notifications) {
                        var nombre = template.name;
                        var tipo = template.type;

                        if (noti.type == 'SIMPLE') {
                            for (let no of noti.children) {
                                var fecha = no.date.split('-');
                                var hora = no.time.split(':');
                                this.localNotifications.schedule({
                                    id: this.id,
                                    icon: 'file://assets/imgs/logo_notification.png',
                                    title: 'NUEVO FORMULARIO',
                                    text: 'Tiene un nuevo formulario llamado ' + nombre + ' de tipo ' + tipo + ' por realizar',
                                    trigger: { at: new Date(fecha[0], fecha[1] - 1, fecha[2], hora[0], hora[1], 0) },
                                    led: 'FF0000'
                                });
                                this.notifications[template.name].push(this.id);
                                this.id++;
                            }
                        } else if (noti.type == 'PERIÓDICA') {
                            var interval_type = noti.interval_type;
                            var interval_value = noti.interval_value;
                            var fecha_noti;

                            for (let no of noti.children) {
                                var fecha = no.date.split('-');
                                var hora = no.time.split(':');
                                if (no.type == 'start') {
                                    var fecha_inicio = new Date(fecha[0], fecha[1] - 1, fecha[2], hora[0], hora[1], 0);
                                } else {
                                    var fecha_fin = new Date(fecha[0], fecha[1] - 1, fecha[2], hora[0], hora[1], 0);
                                }
                            }

                            fecha_noti = new Date(fecha_inicio.getFullYear(), fecha_inicio.getMonth(), fecha_inicio.getDate(), fecha_inicio.getHours(), fecha_inicio.getMinutes(), 0);

                            do {
                                this.localNotifications.schedule({
                                    id: this.id,
                                    icon: 'file://assets/imgs/logo_notification.png',
                                    title: 'NUEVO FORMULARIO',
                                    text: 'Tiene un nuevo formulario llamado ' + nombre + ' de tipo ' + tipo + ' por realizar',
                                    trigger: { at: new Date(fecha_noti.getFullYear(), fecha_noti.getMonth(), fecha_noti.getDate(), fecha_noti.getHours(), fecha_noti.getMinutes(), 0) },
                                    led: 'FF0000'
                                });

                                this.notifications[template.name].push(this.id);

                                if (interval_type == 'minute') {
                                    fecha_noti.setTime(fecha_noti.getTime() + (interval_value * 60 * 1000));
                                } else if (interval_type == 'hour') {
                                    fecha_noti.setTime(fecha_noti.getTime() + (interval_value * 60 * 60 * 1000));
                                } else if (interval_type == 'day') {
                                    fecha_noti.setTime(fecha_noti.getTime() + (interval_value * 24 * 60 * 60 * 1000));
                                } else if (interval_type == 'week') {
                                    fecha_noti.setTime(fecha_noti.getTime() + (interval_value * 7 * 24 * 60 * 60 * 1000));
                                } else if (interval_type == 'month') {
                                    fecha_noti.setTime(fecha_noti.getTime() + (interval_value * 30 * 24 * 60 * 60 * 1000));
                                }

                                this.id++;

                            } while (fecha_noti.getTime() <= fecha_fin.getTime());
                        } else if(noti.type == 'PERIÓDICA_HORA_FIJA') {
                            var interval_type = noti.interval_type;
                            var interval_value = noti.interval_value;
                            var fecha_noti, fecha;
                            var dias = [];
                            var f2, f1;
                            var fecha_i = noti.dates[0];
                            var fecha_fi = noti.dates[noti.dates.length - 1];
                            var temp = fecha_fi.split('-');
                            var fecha_f = new Date(temp[0], temp[1] - 1, temp[2], 0, 0);

                            do {
                                dias.push(fecha_i);
                                f1 = fecha_i.split('-');
                                f1 = new Date(f1[0], f1[1] - 1, f1[2], 0, 0);
                                f2 = new Date(f1.getTime() + (interval_value * 24 * 60 * 60 * 1000));
                                fecha_i = f2.getFullYear() + '-' + (f2.getMonth()+1) + '-' + f2.getDate();
                            } while(f2.getTime() <= fecha_f.getTime());

                            for(let fe of dias) {
                                fecha = fe.split('-');

                                for(let ti of noti.times) {
                                    var hora = ti.split(':');
                                    fecha_noti = new Date(fecha[0], fecha[1] - 1, fecha[2], hora[0], hora[1], 0);

                                    this.localNotifications.schedule({
                                        id: this.id,
                                        icon: 'file://assets/imgs/logo_notification.png',
                                        title: 'NUEVO FORMULARIO',
                                        text: 'Tiene un nuevo formulario llamado ' + nombre + ' de tipo ' + tipo + ' por realizar',
                                        trigger: {at: new Date(fecha_noti.getFullYear(), fecha_noti.getMonth(), fecha_noti.getDate(), fecha_noti.getHours(), fecha_noti.getMinutes(), 0)},
                                        led: 'FF0000'
                                    });

                                    this.notifications[template.name].push(this.id);
                                    this.id++;
                                }
                            }
                        }
                    }
                }
            }
            this.notifications['totalQuantity'] = this.id;
            this.storage.set('notifications', this.notifications);
        });
    }*/

    startSimpleForm(template, selectedTemplate, templateUuid, formUuid, type, index) {
        // Generate a code for Interviewed
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
            }
            else {
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
                        setId: template.set_id,
                        formData: currentForm,
                        index: idx
                    });
                } else {
                    pendingForms = [{
                        template: templateUuid,
                        setId: template.set_id,
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
                };
                this.storage.set("formulario_uso", formulario_uso);
                this.loader.dismiss();
                this.appCtrl.getRootNav().setRoot(FormPage);
            });
        });
    }

}
