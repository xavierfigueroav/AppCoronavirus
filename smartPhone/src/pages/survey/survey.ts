import { Component } from '@angular/core';
import { NavController, MenuController, AlertController, LoadingController, App } from 'ionic-angular';
import { Storage } from '@ionic/storage';
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

import * as plantilla from '../../assets/plantilla/plantilla.json';

@Component({
	selector: 'page-survey',
	templateUrl: 'survey.html',
})

export class SurveyPage {
    templates = (<any>plantilla);
	sentForms;
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
    loader;
    id;

	constructor(private diagnostic: Diagnostic,
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
        public loadingCtrl: LoadingController,
        private file: File) {

        this.loader = this.loadingCtrl.create({
            content: "Espere ...",
        });
        this.loader.present();

        this.menuCtrl.enable(true);

        this.storage.get('linkedUser').then((linkedUser) => {
            this.linkedUser = linkedUser;
        });

        this.storage.get('pendingForms').then((pendingForms) => {
            console.log('[SURVEY/constructor] PENDING FORMS', pendingForms);
            this.pendingForms = pendingForms;
        });

        this.storage.get("formsData").then((formsData) => {
            if (formsData !== null && (Object.keys(formsData).length > 0)) {
                this.formsData = formsData;
            }
        });

        this.storage.get('sentForms').then((sentForms) => {
            console.log('[SURVEY/Constructor] sentForms', sentForms);
            if(sentForms !== null && sentForms.length >0) {
                const initialForms = sentForms.filter((sentForm: any) => sentForm.formData.type === 'initial');
                console.log('[SURVEY/Constructor] initialForms', initialForms)
                const pendingForm = initialForms[initialForms.length - 1];
                this.clickEditForm(sentForms, pendingForm);
            } else {
                this.getInfoPlantilla();
            }
        });
    }

    async clickEditForm(sentForms: any[], pendingForm: any) {
        try{
            let currentForm = pendingForm.formData;
            let templateUuid = pendingForm.template;
            let formsData = await this.storage.get('formsData');
            let forms = formsData[templateUuid];
            let infoTemplates = await this.storage.get('infoTemplates');
            console.log('[SURVEY/clickEditForm] PENDING FORM', pendingForm);
            console.log('[SURVEY/clickEditForm] infoTemplates', infoTemplates);

            let template: any;
            let infoTemplateIndex: number;
            for (let i = 0; i < infoTemplates.length; i++) {
                let temp = infoTemplates[i];
                if (temp.uuid === templateUuid) {
                    template = temp;
                    infoTemplateIndex = i;
                    break;
                }
            }

            // Although this can look dumb, it is the easiest way to make a deep copy
            template.data = JSON.parse(JSON.stringify(currentForm.data));
            const selectedTemplate = JSON.parse(JSON.stringify(currentForm.data));

            const formulario_uso = {
                template: template,
                selectedTemplate: selectedTemplate,
                formData: selectedTemplate,
                currentForm: currentForm,
                forms: forms,
                formsData: formsData,
                pendingForms: sentForms,
                geolocationAuth: 'GRANTED',
                infoTemplates: infoTemplates,
                infoTemplateIndex: infoTemplateIndex,
                indice_seccion: 0
            };

            this.storage.set('formulario_uso', formulario_uso);
            this.loader.dismiss();
            this.appCtrl.getRootNav().setRoot(FormPage);

        } catch(err) {
            console.log(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        }
    }

    getInfoPlantilla() {
        for (let template of this.templates) {
            this.infoTemplates.push({
                uuid: template.uid,
                name: template.name,
                type: template.type,
                gps: template.gps,
                set_id: template.set_id,
                data: template.data
            });
        }

        console.log('[SURVEY/getInfoPlantilla] this.infoTemplates', this.infoTemplates);
        this.storage.set('infoTemplates', this.infoTemplates).then(() => {
            const info_template = this.infoTemplates[0];
            if (info_template.gps === 'required') {
                this.requestLocationAuthorization(info_template, info_template.uuid, 'initial', 0);
            } else {
                this.chooseFormTypeToInit(info_template, info_template.uuid, 'initial', 0);
            }
        }).catch((error) => {
            console.log("ERROR EN INFO PLANTILLA", error);
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
            console.log('[SURVEY/startInitialForm] formsData', formsData);
            console.log('[SURVEY/startInitialForm] this.formsData', this.formsData);
            console.log('[SURVEY/startInitialForm] formsData === this.formsData', formsData === this.formsData);
            this.formsData = formsData;
            let currentForm = {};
            let forms;
            // NUNCA SE CUMPLE EN EL VERY FIRST LOGIN
            if (this.formsData != null && (Object.keys(this.formsData).length > 0) && this.formsData.hasOwnProperty(templateUuid)) {
                forms = this.formsData[templateUuid].slice(0);
                console.log('[SURVEY/startInitialForm] this.formsData[templateUuid]', this.formsData[templateUuid]);
            }
            console.log('[SURVEY/startInitialForm] forms', forms);
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
            if (forms != null && (forms.length > 0)) {
                forms.push(currentForm);
            } else {
                forms = [currentForm];
            }
            this.storage.get('pendingForms').then((pendingForms) => {
                console.log('[SURVEY/startInitialForm] pendingForms', pendingForms);
                console.log('[SURVEY/startInitialForm] this.pendingForms', this.pendingForms);
                console.log('[SURVEY/startInitialForm] pendingForms === this.pendingForms', pendingForms === this.pendingForms);
                this.pendingForms = pendingForms;
                console.log('[SURVEY/startInitialForm] pendingForms === this.pendingForms', pendingForms === this.pendingForms);
                if (this.pendingForms != null && (this.pendingForms.length > 0)) {
                    pendingForms = this.pendingForms.slice(0);
                    console.log('[SURVEY/startInitialForm] pendingForms === this.pendingForms', pendingForms === this.pendingForms);
                    let idx = 0;
                    console.log('[SURVEY/startInitialForm] forms', forms);
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
                console.log('[SURVEY/startInitialForm] formulario_uso', formulario_uso);
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
        console.log('[SURVEY/chooseFormTypeToInit] type', type);
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

    cerrarSesion() {
        this.storage.get('linkedUser').then((val) => {
            this.storage.set('linkedUser', null).then(data => {
                this.appCtrl.getRootNav().setRoot(AuthPage);
            });
        });
    }

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
                    indice_seccion: 0
                };
                this.storage.set("formulario_uso", formulario_uso);
                this.appCtrl.getRootNav().setRoot(FormPage);
            });
        });
    }

}
