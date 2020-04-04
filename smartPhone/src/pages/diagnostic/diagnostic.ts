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
        private file: File) {

        this.menuCtrl.enable(true);
        this.file = file;

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

        //AQUÍ ENVIAR ALGÚN PENDINGFORM SI HAY 
        this.crearDirectorio();

	}

	ionViewDidEnter() {
        try {
            this.storage.get('pendingForms').then((pendingForms) => {
                this.pendingForms = pendingForms;
            });

            this.storage.get('infoTemplates').then((templates) => {
                this.infoTemplates = templates;
                this.selectedSection = templates[0];
            });
            console.log("ENVIAR FORMULARIO ENTER");
            this.enviarFormulario();
        } catch(e){
            console.log("ionViewDidEnter");
        }
    }

    ionViewWillEnter(){
        this.storage.get('infoTemplates').then((templates) => {
            this.infoTemplates = templates;
            this.selectedSection = templates[0];
        });
    }

    enviarFormulario() {
        console.log("ENVIAR FORMULARIO");
        this.storage.get('pendingForms').then((pendingForms) => {
            console.log("ENVIAR FORMULARIO 2");
            if((pendingForms != null) && (pendingForms.length > 0)) {
                console.log("HAY PENDING FORMS");
                var url = "http://ec2-3-17-143-36.us-east-2.compute.amazonaws.com:5000/api/3/action/resource_create";
                //for(let pendingForm of pendingForms) {
                    var pendingForm = pendingForms[pendingForms.length - 1];
                    var id_dataset = pendingForm.id_dataset;
                    var string_cuerpo = '{"id_dataset":"'+id_dataset+'","form":"'+pendingForm+'"}';
                    var objeto = JSON.parse(string_cuerpo);
                    this.subirArchivo(pendingForm, id_dataset);
                //}
            }
        });
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

    obtenerFechaActual() {
        var fecha_actual = new Date();
        var dia = fecha_actual.getDate();
        if(dia < 10) {
            var dia_actual = "0" + dia.toString();
        } else {
            var dia_actual = dia.toString();
        }
        var mes = Number(fecha_actual.getMonth()) + 1;
        if(mes < 10) {
            var mes_actual = "0" + mes.toString();
        } else {
            var mes_actual = mes.toString();
        }
        var hora = fecha_actual.getHours();
        if(hora < 10) {
            var hora_actual = "0" + hora.toString();
        } else {
            var hora_actual = hora.toString();
        }
        var minutos = fecha_actual.getMinutes();
        if(minutos < 10) {
            var minutos_actual = "0" + minutos.toString();
        } else {
            var minutos_actual = minutos.toString();
        }
        var segundos = fecha_actual.getSeconds();
        if(segundos < 10) {
            var segundos_actual = "0" + segundos.toString();
        } else {
            var segundos_actual = segundos.toString();
        }
        var fecha = dia_actual + "-" + mes_actual + "-" + fecha_actual.getFullYear() + "_" + hora_actual + "-"+ minutos_actual + "-" + segundos_actual;
        return fecha;
    }

    subirArchivo(pendingForm, id_dataset) {
        var tipo_form = pendingForm.formData.type;
        if(tipo_form == 'initial') {
            var nombre_archivo = 'DATOS-PERSONALES';
        } else {
            var nombre_archivo = 'AUTODIAGNÓSTICO';
        }

        var fecha_formateada = this.obtenerFechaActual();
        var nombre_archivo = nombre_archivo + "_" + fecha_formateada + ".json";
        var string_form = JSON.stringify(pendingForm, null, 2);
        
        this.file.createFile(this.file.externalApplicationStorageDirectory+"AppCoronavirus", nombre_archivo, true).then((response) => {
            console.log('SE CREÓ EL ARCHIVO');
            this.file.writeFile(this.file.externalApplicationStorageDirectory+"AppCoronavirus", nombre_archivo, string_form, {replace:true, append:false}).then((response) => {
                console.log('SE ESCRIBIÓ EL ARCHIVO');
                var url = "http://ec2-3-17-143-36.us-east-2.compute.amazonaws.com:5000/api/3/action/resource_create";
                console.log("ID DATASET: ", id_dataset);
                var carpeta = this.file.externalApplicationStorageDirectory+"AppCoronavirus/";
                var ruta_completa = carpeta + nombre_archivo;
                console.log("RUTA ARCHIVO:", ruta_completa);

                this.http.uploadFile(url, {package_id: id_dataset, name: nombre_archivo}, {'Content-Type':'application/json','Authorization':'491c5713-dd3e-4dda-adda-e36a95d7af77'}, ruta_completa, 'upload').then((response) => {
                    var respuesta = JSON.parse(response.data);
                    console.log("ID RECURSO: ", respuesta.result.id);
                    console.log('SE ENVIÓ EL ARCHIVO');
                    this.file.removeFile(carpeta, nombre_archivo).then((response) => {
                        console.log('SE ELIMINÓ EL ARCHIVO');
                        this.storage.get('sentForms').then((response) => {
                            let sentForms = response;
                            if (sentForms != null && sentForms.length > 0) {
                                sentForms.push(pendingForm);
                            } else {
                                sentForms = [pendingForm];
                            }
                            this.storage.set("pendingForms", []);
                            this.storage.set("sentForms", sentForms);
                        });
                    }).catch(err => {
                        console.log(err);
                        console.log('NO SE ELIMINÓ EL ARCHIVO');
                        this.storage.get('sentForms').then((response) => {
                            let sentForms = response;
                            if (sentForms != null && sentForms.length > 0) {
                                sentForms.push(pendingForm);
                            } else {
                                sentForms = [pendingForm];
                            }
                            this.storage.set("pendingForms", []);
                            this.storage.set("sentForms", sentForms);
                        });
                    });
                }).catch(err => {
                    console.log(err);
                    console.log('NO SE LEYÓ EL ARCHIVO');
                });
            }).catch(err => {
                console.log(err);
                console.log('NO SE ESCRIBIÓ EL ARCHIVO');
            });
        }).catch(err => {
            console.log(err);
            console.log('NO SE CREÓ EL ARCHIVO');
        });
    }

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
                this.navCtrl.push(FormPage, {
                    template: template,
                    selectedTemplate: selectedTemplate,
                    formData: selectedTemplate,
                    currentForm: currentForm,
                    forms: forms,
                    formsData: this.formsData,
                    pendingForms: pendingForms,
                    geolocationAuth: this.geolocationAuth,
                    infoTemplates: this.infoTemplates,
                    infoTemplateIndex: index
                });
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
            /*let alert = this.alertCtrl.create({
                title: 'Ingrese una identificación',
                cssClass: 'alert-title',
                inputs: [
                    {
                        name: 'identification',
                        placeholder: 'Código, cédula, ..',
                        type: 'text',
                    }
                ],
                buttons: [
                    {
                        text: 'Continuar',
                        handler: data => {
                            if (data && data.identification.length >= 5 && data.identification.length <= 15) {
                                let formUuid = uuid();
                                this.startInitialForm(template, template.data.initial, templateUuid, formUuid, type, index, data.identification, reason);
                            } else {
                                const alert = this.alertCtrl.create({
                                    title: 'Identificación incorrecta!',
                                    cssClass: 'alert-title',
                                    subTitle: 'Debe contener entre 5 a 15 caracteres',
                                    buttons: ['OK']
                                });
                                alert.present();
                                return false;
                            }
                        }
                    },
                    {
                        text: 'Cancelar',
                        handler: () => { }
                    }
                ]
            });
            alert.present();*/
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
        this.storage.get('linkedUser').then((val) => {
            this.storage.set('linkedUser', null).then(data => {
                this.appCtrl.getRootNav().setRoot(AuthPage);
            });
        });
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
                this.navCtrl.push(FormPage, {
                    template: template,
                    selectedTemplate: selectedTemplate,
                    formData: selectedTemplate,
                    currentForm: currentForm,
                    forms: forms,
                    formsData: this.formsData,
                    pendingForms: pendingForms,
                    geolocationAuth: this.geolocationAuth,
                    infoTemplates: this.infoTemplates,
                });
            });
        });
    }

}